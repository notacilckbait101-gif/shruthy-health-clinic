import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireDoctor } from '@/lib/auth-guard'
import { normalizeOptionalString, toPlainObject } from '@/lib/db-utils'
import { createJsonVisit, getJsonPatientDetail, listJsonVisits } from '@/lib/json-store'

const createVisitSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  visitDate: z.string().datetime().optional(),
  symptoms: z.array(z.string().min(1)).min(1, 'At least one symptom is required'),
  observations: z.string().optional().nullable(),
  assessment: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  followUpDate: z.string().datetime().optional().nullable(),
  billedAmountInr: z.number().min(0).optional().nullable(),
  selectedRemedies: z.array(
    z.object({
      remedyId: z.string().optional(),
      remedyName: z.string().min(1, 'Remedy name is required'),
      score: z.number(),
      potency: z.string().optional().nullable(),
      dosage: z.string().optional().nullable(),
      instructions: z.string().optional().nullable(),
    }),
  ).default([]),
})

export async function GET(request: NextRequest) {
  try {
    const auth = await requireDoctor(request)
    if (auth.error) return auth.error

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '30')

    return NextResponse.json({
      success: true,
      data: listJsonVisits(String(auth.doctor._id), limit),
    })
  } catch (error) {
    console.error('Get visits error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireDoctor(request)
    if (auth.error) return auth.error

    const body = await request.json()
    const validatedData = createVisitSchema.parse(body)

    const patient = getJsonPatientDetail(validatedData.patientId, String(auth.doctor._id))

    if (!patient) {
      return NextResponse.json(
        { success: false, message: 'Patient not found' },
        { status: 404 },
      )
    }

    const visit = createJsonVisit({
      doctorId: String(auth.doctor._id),
      patientId: validatedData.patientId,
      visitDate: validatedData.visitDate ? new Date(validatedData.visitDate).toISOString() : new Date().toISOString(),
      symptoms: validatedData.symptoms,
      observations: normalizeOptionalString(validatedData.observations),
      assessment: normalizeOptionalString(validatedData.assessment),
      notes: normalizeOptionalString(validatedData.notes),
      followUpDate: validatedData.followUpDate ? new Date(validatedData.followUpDate).toISOString() : undefined,
      billedAmountInr: validatedData.billedAmountInr ?? patient.consultationFeeInr ?? 0,
      selectedRemedies: validatedData.selectedRemedies.map((item) => ({
        remedyName: item.remedyName,
        score: item.score,
        potency: normalizeOptionalString(item.potency),
        dosage: normalizeOptionalString(item.dosage),
        instructions: normalizeOptionalString(item.instructions),
      })),
    })

    return NextResponse.json({
      success: true,
      data: {
        ...toPlainObject(visit),
        billedAmountInr: visit.billedAmountInr ?? patient.consultationFeeInr ?? 0,
        patientId: {
          _id: patient.id,
          fullName: patient.fullName,
          age: patient.age,
          gender: patient.gender,
          chiefComplaint: patient.chiefComplaint,
        },
      },
      message: 'Visit saved successfully',
    })
  } catch (error) {
    console.error('Create visit error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Validation error', errors: error.errors },
        { status: 400 },
      )
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    )
  }
}
