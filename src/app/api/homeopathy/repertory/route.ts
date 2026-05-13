import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireDoctor } from '@/lib/auth-guard'
import { checkRateLimit } from '@/lib/rate-limit'
import { autocompleteSymptoms, findMatchingRemedies, getRemedyDetails, searchRubrics } from '@/lib/repertory-engine'
import { getOorepLocalCatalog } from '@/lib/oorep-local'

const searchRemediesSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  limit: z.number().min(1).max(50).optional().default(10),
})

const symptomAnalysisSchema = z.object({
  symptoms: z.array(z.string().min(1)).min(1, 'At least one symptom is required'),
  patientInfo: z.object({
    age: z.number().optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    thermalPreference: z.string().optional(),
    cravings: z.array(z.string()).optional(),
    emotionalSymptoms: z.array(z.string()).optional(),
    sleepPattern: z.string().optional(),
    modalities: z.array(z.string()).optional(),
    aggravations: z.array(z.string()).optional(),
    ameliorations: z.array(z.string()).optional(),
  }).optional(),
})

const remedyDetailsSchema = z.object({
  remedyName: z.string().min(1, 'Remedy name is required'),
})

export async function GET(request: NextRequest) {
  try {
    const auth = await requireDoctor(request)
    if (auth.error) return auth.error

    const forwardedFor = request.headers.get('x-forwarded-for') || String(auth.doctor._id)
    const rateLimit = checkRateLimit(`repertory:get:${forwardedFor}`, 120, 60_000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many searches. Please slow down for a moment.' },
        { status: 429 },
      )
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    const limit = parseInt(searchParams.get('limit') || '10')
    const remedyName = searchParams.get('remedy')
    const chapter = searchParams.get('chapter')
    const autocomplete = searchParams.get('autocomplete')
    const stats = searchParams.get('stats')

    if (stats) {
      const catalog = await getOorepLocalCatalog()
      return NextResponse.json({
        success: true,
        data: {
          remedies: catalog.remedies.length,
          rubrics: catalog.rubrics.length,
          builtAt: catalog.builtAt,
          sourcePath: catalog.sourcePath,
        },
      })
    }

    if (remedyName) {
      const validatedData = remedyDetailsSchema.parse({ remedyName })
      const remedy = await getRemedyDetails(validatedData.remedyName)

      if (!remedy) {
        return NextResponse.json(
          { success: false, message: 'Remedy not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: remedy,
      })
    }

    if (autocomplete) {
      const suggestions = await autocompleteSymptoms(autocomplete)
      return NextResponse.json({
        success: true,
        data: suggestions,
      })
    }

    if (chapter) {
      const rubrics = await searchRubrics(chapter)
      const remedies = await findMatchingRemedies({
        symptoms: rubrics.map((rubric) => rubric.rubric),
      })

      return NextResponse.json({
        success: true,
        data: remedies.slice(0, limit),
        chapter,
        total: remedies.length,
      })
    }

    if (!query) {
      return NextResponse.json(
        { success: false, message: 'Search query is required' },
        { status: 400 },
      )
    }

    const validatedData = searchRemediesSchema.parse({ query, limit })
    const [rubrics, matches] = await Promise.all([
      searchRubrics(validatedData.query),
      findMatchingRemedies({ symptoms: [validatedData.query] }),
    ])

    return NextResponse.json({
      success: true,
      data: matches.slice(0, validatedData.limit),
      total: matches.length,
      rubrics: rubrics.slice(0, validatedData.limit),
      query: validatedData.query,
    })
  } catch (error) {
    console.error('Local repertory API error:', error)

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

export async function POST(request: NextRequest) {
  try {
    const auth = await requireDoctor(request)
    if (auth.error) return auth.error

    const forwardedFor = request.headers.get('x-forwarded-for') || String(auth.doctor._id)
    const rateLimit = checkRateLimit(`repertory:post:${forwardedFor}`, 60, 60_000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many analysis requests. Please try again shortly.' },
        { status: 429 },
      )
    }

    const body = await request.json()
    const { type } = body

    if (type === 'symptom-analysis' || type === 'repertory-search') {
      const validatedData = symptomAnalysisSchema.parse(body)
      const matches = await findMatchingRemedies({
        symptoms: validatedData.symptoms,
        thermalPreference: validatedData.patientInfo?.thermalPreference,
        cravings: validatedData.patientInfo?.cravings,
        emotionalSymptoms: validatedData.patientInfo?.emotionalSymptoms,
        sleepPattern: validatedData.patientInfo?.sleepPattern,
        modalities: validatedData.patientInfo?.modalities,
        aggravations: validatedData.patientInfo?.aggravations,
        ameliorations: validatedData.patientInfo?.ameliorations,
      })

      return NextResponse.json({
        success: true,
        data: {
          topRemedies: matches.slice(0, 5),
          matchedRubrics: Array.from(new Set(matches.flatMap((match) => match.matchedRubrics))).slice(0, 12),
          symptoms: validatedData.symptoms,
          totalMatches: matches.length,
        },
      })
    }

    if (type === 'autocomplete') {
      const validatedData = searchRemediesSchema.parse(body)
      const data = await autocompleteSymptoms(validatedData.query)

      return NextResponse.json({
        success: true,
        data,
      })
    }

    if (type === 'remedy-details') {
      const validatedData = remedyDetailsSchema.parse(body)
      const remedy = await getRemedyDetails(validatedData.remedyName)

      if (!remedy) {
        return NextResponse.json(
          { success: false, message: 'Remedy not found' },
          { status: 404 },
        )
      }

      return NextResponse.json({
        success: true,
        data: remedy,
      })
    }

    return NextResponse.json(
      { success: false, message: 'Invalid analysis type' },
      { status: 400 },
    )
  } catch (error) {
    console.error('Local repertory analysis error:', error)

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
