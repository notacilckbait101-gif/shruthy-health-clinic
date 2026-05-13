import crypto from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createAuthResponse, generateToken, hashPassword } from '@/lib/auth'
import { exchangeGoogleCodeForProfile } from '@/lib/google-auth'
import {
  createJsonDoctor,
  findJsonDoctorByEmail,
  findJsonDoctorByProviderAccountId,
  updateJsonDoctorLastLogin,
  updateJsonDoctorProfile,
} from '@/lib/json-store'

export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin
  const code = request.nextUrl.searchParams.get('code')
  const state = request.nextUrl.searchParams.get('state')
  const storedState = request.cookies.get('google-oauth-state')?.value

  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.redirect(new URL('/login?error=google-state', request.url))
  }

  try {
    const profile = await exchangeGoogleCodeForProfile(origin, code)

    if (!profile.email || !profile.sub) {
      throw new Error('Google profile is incomplete.')
    }

    let doctor =
      findJsonDoctorByProviderAccountId(profile.sub) ||
      findJsonDoctorByEmail(profile.email)

    if (doctor) {
      doctor = updateJsonDoctorProfile(String(doctor._id), {
        fullName: profile.name || doctor.fullName,
        email: profile.email,
        avatarUrl: profile.picture,
        clinicName: doctor.clinicName || 'Shruty Health Clinic',
        providerAccountId: profile.sub,
        authProvider: 'google',
      }) || doctor
    } else {
      const hashedPlaceholderPassword = await hashPassword(crypto.randomUUID())
      doctor = createJsonDoctor({
        fullName: profile.name || profile.given_name || 'Shruty Health Clinic Doctor',
        clinicName: 'Shruty Health Clinic',
        email: profile.email,
        password: hashedPlaceholderPassword,
        avatarUrl: profile.picture,
        authProvider: 'google',
        providerAccountId: profile.sub,
      })
    }

    updateJsonDoctorLastLogin(String(doctor._id))

    const token = generateToken({
      id: String(doctor._id),
      email: doctor.email,
      fullName: doctor.fullName,
    })

    const response = NextResponse.redirect(new URL('/dashboard', request.url))
    response.cookies.set('google-oauth-state', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })
    response.headers.set('x-auth-user', JSON.stringify(createAuthResponse(token, doctor).user))
    return response
  } catch (error) {
    console.error('Google auth callback error:', error)
    return NextResponse.redirect(new URL('/login?error=google-auth-failed', request.url))
  }
}
