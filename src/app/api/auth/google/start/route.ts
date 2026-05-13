import { NextRequest, NextResponse } from 'next/server'
import { buildGoogleAuthUrl, isGoogleAuthConfigured } from '@/lib/google-auth'

export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin

  if (!isGoogleAuthConfigured(origin)) {
    return NextResponse.redirect(new URL('/login?error=google-not-configured', request.url))
  }

  const mode = request.nextUrl.searchParams.get('mode') === 'register' ? 'register' : 'login'
  const { state, url } = buildGoogleAuthUrl(origin, mode)
  const response = NextResponse.redirect(url)
  response.cookies.set('google-oauth-state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60,
    path: '/',
  })
  return response
}
