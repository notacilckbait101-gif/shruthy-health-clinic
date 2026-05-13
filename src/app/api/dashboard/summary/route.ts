import { NextRequest, NextResponse } from 'next/server'
import { requireDoctor } from '@/lib/auth-guard'
import { getOorepLocalCatalog, type OorepCatalog } from '@/lib/oorep-local'
import { getJsonDashboardSummary } from '@/lib/json-store'

declare global {
  var __catalogTopRemediesCache:
    | {
        builtAt: string
        remedies: Array<{ _id: string; count: number; avgScore: number }>
      }
    | undefined
}

function getCatalogTopRemedies(catalog: OorepCatalog, limit = 5) {
  if (
    global.__catalogTopRemediesCache &&
    global.__catalogTopRemediesCache.builtAt === catalog.builtAt &&
    global.__catalogTopRemediesCache.remedies.length >= limit
  ) {
    return global.__catalogTopRemediesCache.remedies.slice(0, limit)
  }

  const scored = new Map<string, { _id: string; count: number; avgScore: number }>()

  catalog.rubrics.forEach((rubric) => {
    rubric.remedies.forEach((remedy) => {
      const current = scored.get(remedy.remedyName) || {
        _id: remedy.remedyName,
        count: 0,
        avgScore: 0,
      }

      const nextCount = current.count + 1
      current.avgScore = (current.avgScore * current.count + remedy.grade) / nextCount
      current.count = nextCount
      scored.set(remedy.remedyName, current)
    })
  })

  const remedies = Array.from(scored.values())
    .sort((left, right) => {
      if (right.count !== left.count) return right.count - left.count
      return right.avgScore - left.avgScore
    })
  global.__catalogTopRemediesCache = {
    builtAt: catalog.builtAt,
    remedies,
  }
  return remedies.slice(0, limit)
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireDoctor(request)
    if (auth.error) return auth.error

    const doctorId = String(auth.doctor._id)
    const localCatalog = await getOorepLocalCatalog().catch(() => null)
    const jsonSummary = getJsonDashboardSummary(doctorId)
    const dayOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const dayCounts = new Map(dayOrder.map((day) => [day, 0]))
    jsonSummary.weeklyVisits.forEach((visit) => {
      const day = dayOrder[new Date(visit.visitDate).getDay()]
      dayCounts.set(day, (dayCounts.get(day) || 0) + 1)
    })
    const weeklyTrend = dayOrder.map((day) => ({
      _id: day,
      visits: dayCounts.get(day) || 0,
    }))
    const fallbackTopRemedies = localCatalog ? getCatalogTopRemedies(localCatalog, 5) : []
    const remedyLibrary = (localCatalog?.remedies || []).slice(0, 12).map((remedy) => ({
      id: remedy.id,
      name: remedy.name,
      keynotes: remedy.keynotes,
      modalities: remedy.modalities,
      source: remedy.source,
    }))

    return NextResponse.json({
      success: true,
      data: {
        totalPatients: jsonSummary.totalPatients,
        totalVisits: jsonSummary.totalVisits,
        pendingFollowUps: jsonSummary.pendingFollowUps,
        currentMonthRevenue: jsonSummary.currentMonthRevenue,
        monthlyRevenue: jsonSummary.monthlyRevenue,
        availableRemedies: localCatalog?.remedies.length || 0,
        availableRubrics: localCatalog?.rubrics.length || 0,
        upcomingAppointments: jsonSummary.upcomingAppointments,
        recentVisits: jsonSummary.recentVisits,
        weeklyTrend,
        topRemedies: jsonSummary.topRemedies.length > 0 ? jsonSummary.topRemedies : fallbackTopRemedies,
        topRemediesSource: jsonSummary.topRemedies.length > 0 ? 'visits' : 'catalog',
        remedyLibrary,
      },
    })
  } catch (error) {
    console.error('Dashboard summary error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    )
  }
}
