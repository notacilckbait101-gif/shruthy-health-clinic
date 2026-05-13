import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl?.pathname || '/'

  const publicRoutes = ['/login', '/register', '/api/auth']
  
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  if (isPublicRoute) {
    return NextResponse.next()
  }

  const authHeader = request.headers.get('authorization')
  const bearerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : null
  const cookieToken = request.cookies.get('auth-token')?.value || null
  const token = bearerToken || cookieToken
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
