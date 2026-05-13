import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Clear the auth cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })
    
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
    })
    
    return response
    
  } catch (error) {
    console.error('Logout error:', error)
    
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
