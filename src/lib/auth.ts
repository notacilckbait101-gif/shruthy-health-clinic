import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key'

export interface JWTPayload {
  id: string
  email: string
  fullName: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    return null
  }
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  // Also check cookies
  const token = request.cookies.get('auth-token')?.value
  return token || null
}

export function createAuthResponse(token: string, user: any) {
  return {
    success: true,
    token,
    user: {
      id: user.id || String(user._id),
      fullName: user.fullName,
      email: user.email,
      clinicName: user.clinicName,
      phoneNumber: user.phoneNumber,
      medicalLicenseId: user.medicalLicenseId,
      avatarUrl: user.avatarUrl || null,
      authProvider: user.authProvider || 'local',
    }
  }
}
