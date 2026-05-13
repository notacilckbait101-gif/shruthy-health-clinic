import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireDoctor } from '@/lib/auth-guard'
import { toPlainObject } from '@/lib/db-utils'
import { createJsonPatient, listJsonPatients, normalizePatientPayload } from '@/lib/json-store'

const createPatientSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  age: z.number().min(0).max(150),
  contactNumber: z.string().min(10, 'Contact number must be at least 10 characters'),
  address: z.string().optional(),
  consultationFeeInr: z.number().min(0).max(1_000_000).optional(),
  bloodType: z.string().optional(),
  allergies: z.string().optional(),
  medicalHistory: z.string().optional(),
  chiefComplaint: z.string().optional(),
  thermalPreference: z.string().optional(),
  cravings: z.array(z.string()).optional().default([]),
  emotionalSymptoms: z.array(z.string()).optional().default([]),
  sleepPattern: z.string().optional(),
  modalities: z.array(z.string()).optional().default([]),
  aggravations: z.array(z.string()).optional().default([]),
  ameliorations: z.array(z.string()).optional().default([]),
  currentSymptoms: z.array(z.string()).optional().default([]),
})

export async function GET(request: NextRequest) {
  try {
    const auth = await requireDoctor(request)
    if (auth.error) return auth.error

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const gender = searchParams.get('gender')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const skip = (page - 1) * limit

    const where: any = {
      doctorId: auth.doctor._id,
      isActive: true,
    }

    if (search) {
      where.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { contactNumber: { $regex: search, $options: 'i' } },
        { currentSymptoms: { $elemMatch: { $regex: search, $options: 'i' } } },
      ]
    }

    if (gender) {
      where.gender = gender
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.$gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.$lte = new Date(endDate)
      }
    }

    const result = listJsonPatients({
      doctorId: String(auth.doctor._id),
      page,
      limit,
      search,
      gender,
      startDate,
      endDate,
    })

    return NextResponse.json({
      success: true,
      data: result.patients,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit),
      },
    })
  } catch (error) {
    console.error('Get patients error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireDoctor(request)
    if (auth.error) return auth.error

    const body = await request.json()
    const validatedData = createPatientSchema.parse(body)
    const patient = createJsonPatient({
      ...normalizePatientPayload(validatedData),
      doctorId: String(auth.doctor._id),
      fullName: validatedData.fullName,
      gender: validatedData.gender,
      age: validatedData.age,
      contactNumber: validatedData.contactNumber,
      cravings: validatedData.cravings || [],
      emotionalSymptoms: validatedData.emotionalSymptoms || [],
      modalities: validatedData.modalities || [],
      aggravations: validatedData.aggravations || [],
      ameliorations: validatedData.ameliorations || [],
      currentSymptoms: validatedData.currentSymptoms || [],
    })

    return NextResponse.json({
      success: true,
      data: {
        ...toPlainObject(patient),
        id: String(patient._id),
      },
      message: 'Patient created successfully',
    })
  } catch (error) {
    console.error('Create patient error:', error)

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
