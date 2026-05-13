import { NextRequest, NextResponse } from 'next/server'
import { requireDoctor } from '@/lib/auth-guard'

export async function GET(request: NextRequest) {
  const auth = await requireDoctor(request)
  if (auth.error) return auth.error

  return NextResponse.json({
    success: true,
    data: {
      id: String(auth.doctor._id),
      fullName: auth.doctor.fullName,
      email: auth.doctor.email,
      clinicName: auth.doctor.clinicName,
      avatarUrl: null,
      authProvider: auth.doctor.authProvider || 'local',
      medicalLicenseId: auth.doctor.medicalLicenseId,
    },
  })
}
