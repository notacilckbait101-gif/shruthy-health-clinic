import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { findJsonDoctorById } from '@/lib/json-store'
import type { JWTPayload } from '@/lib/auth'

type RequireDoctorResult =
  | {
      error: ReturnType<typeof NextResponse.json>
      doctor?: never
      payload?: never
    }
  | {
      error?: never
      doctor: any
      payload: JWTPayload
    }

export async function requireDoctor(request: NextRequest): Promise<RequireDoctorResult> {
  const token = getTokenFromRequest(request)
  if (!token) {
    return {
      error: NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 }),
    }
  }

  const payload = verifyToken(token)
  if (!payload) {
    return {
      error: NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 }),
    }
  }

  const doctor = findJsonDoctorById(payload.id)

  if (!doctor || !doctor.isActive) {
    return {
      error: NextResponse.json({ success: false, message: 'Doctor not found' }, { status: 401 }),
    }
  }

  return { doctor, payload }
}
