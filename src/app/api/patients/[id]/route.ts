import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireDoctor } from '@/lib/auth-guard'
import { toPlainObject } from '@/lib/db-utils'
import { deactivateJsonPatient, getJsonPatientDetail, listJsonPatients, normalizePatientPayload, updateJsonPatient } from '@/lib/json-store'

const updatePatientSchema = z.object({
  fullName: z.string().min(2).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  age: z.number().min(0).max(150).optional(),
  contactNumber: z.string().min(10).optional(),
  address: z.string().optional().nullable(),
  consultationFeeInr: z.number().min(0).max(1_000_000).optional().nullable(),
  bloodType: z.string().optional().nullable(),
  allergies: z.string().optional().nullable(),
  medicalHistory: z.string().optional().nullable(),
  chiefComplaint: z.string().optional().nullable(),
  thermalPreference: z.string().optional().nullable(),
  cravings: z.array(z.string()).optional(),
  emotionalSymptoms: z.array(z.string()).optional(),
  sleepPattern: z.string().optional().nullable(),
  modalities: z.array(z.string()).optional(),
  aggravations: z.array(z.string()).optional(),
  ameliorations: z.array(z.string()).optional(),
  currentSymptoms: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
})

type PatientRouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  context: PatientRouteContext
) {
  try {
    const auth = await requireDoctor(request)
    if (auth.error) return auth.error

    const { id } = await context.params

    const patient = getJsonPatientDetail(id, String(auth.doctor._id))

    if (!patient) {
      return NextResponse.json(
        { success: false, message: 'Patient not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: patient,
    })
  } catch (error) {
    console.error('Get patient error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: PatientRouteContext
) {
  try {
    const auth = await requireDoctor(request)
    if (auth.error) return auth.error

    const { id } = await context.params

    const body = await request.json()
    const validatedData = updatePatientSchema.parse(body)

    const existingPatient = getJsonPatientDetail(id, String(auth.doctor._id))

    if (!existingPatient) {
      return NextResponse.json(
        { success: false, message: 'Patient not found' },
        { status: 404 }
      )
    }
    const patient = updateJsonPatient(id, String(auth.doctor._id), normalizePatientPayload({
      ...validatedData,
      address: validatedData.address,
      consultationFeeInr: validatedData.consultationFeeInr ?? undefined,
      bloodType: validatedData.bloodType,
      allergies: validatedData.allergies,
      medicalHistory: validatedData.medicalHistory,
      chiefComplaint: validatedData.chiefComplaint,
      thermalPreference: validatedData.thermalPreference,
      sleepPattern: validatedData.sleepPattern,
    }))

    return NextResponse.json({
      success: true,
      data: patient ? { ...toPlainObject(patient), id: String(patient._id) } : null,
      message: 'Patient updated successfully',
    })
  } catch (error) {
    console.error('Update patient error:', error)

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

export async function DELETE(
  request: NextRequest,
  context: PatientRouteContext
) {
  try {
    const auth = await requireDoctor(request)
    if (auth.error) return auth.error

    const { id } = await context.params

    const existingPatient = getJsonPatientDetail(id, String(auth.doctor._id))

    if (!existingPatient) {
      return NextResponse.json(
        { success: false, message: 'Patient not found' },
        { status: 404 }
      )
    }

    deactivateJsonPatient(id, String(auth.doctor._id))

    return NextResponse.json({
      success: true,
      message: 'Patient deleted successfully',
    })
  } catch (error) {
    console.error('Delete patient error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
