import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/rate-limit'
import { hashPassword, generateToken, createAuthResponse } from '@/lib/auth'
import { createJsonDoctor, findJsonDoctorByEmail } from '@/lib/json-store'

const signupSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  clinicName: z.string().min(2).optional(),
  phoneNumber: z.string().min(8).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export async function POST(request: NextRequest) {
  try {
    const forwardedFor = request.headers.get('x-forwarded-for') || 'local'
    const rateLimit = checkRateLimit(`signup:${forwardedFor}`, 10, 60_000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many signup attempts. Please try again in a minute.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const validatedData = signupSchema.parse(body)

    const existingDoctor = findJsonDoctorByEmail(validatedData.email)

    if (existingDoctor) {
      return NextResponse.json(
        { success: false, message: 'Doctor with this email already exists' },
        { status: 400 }
      )
    }

    const hashedPassword = await hashPassword(validatedData.password)

    const doctor = createJsonDoctor({
      fullName: validatedData.fullName,
      clinicName: validatedData.clinicName,
      email: validatedData.email,
      password: hashedPassword,
      phoneNumber: validatedData.phoneNumber,
    })

    const token = generateToken({
      id: String(doctor._id),
      email: doctor.email,
      fullName: doctor.fullName,
    })

    const response = createAuthResponse(token, doctor)
    const nextResponse = NextResponse.json(response)
    nextResponse.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })
    
    return nextResponse
  } catch (error) {
    console.error('Signup error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Validation error', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
