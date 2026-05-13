import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/rate-limit'
import { verifyPassword, generateToken, createAuthResponse } from '@/lib/auth'
import { findJsonDoctorByEmail, updateJsonDoctorLastLogin } from '@/lib/json-store'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(request: NextRequest) {
  try {
    const forwardedFor = request.headers.get('x-forwarded-for') || 'local'
    const rateLimit = checkRateLimit(`login:${forwardedFor}`, 20, 60_000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many login attempts. Please try again in a minute.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const validatedData = loginSchema.parse(body)

    const doctor = findJsonDoctorByEmail(validatedData.email)

    if (!doctor) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      )
    }
    const isPasswordValid = await verifyPassword(validatedData.password, doctor.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      )
    }
    if (!doctor.isActive) {
      return NextResponse.json(
        { success: false, message: 'Account is deactivated' },
        { status: 401 }
      )
    }
    updateJsonDoctorLastLogin(String(doctor._id))

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
    console.error('Login error:', error)

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
