"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CalendarClock, Stethoscope } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function VisitsPage() {
  const [visits, setVisits] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      const response = await fetch('/api/visits?limit=100')
      const result = await response.json()
      if (result.success) {
        setVisits(result.data)
      }
    }
    load()
  }, [])

  return (
    <div className="page-shell p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/85 px-4 py-2 text-sm font-medium text-emerald-800 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
          <p className="section-kicker">Clinical timeline</p>
          <h1 className="mt-3 font-serif text-5xl text-slate-900 dark:text-white">Visits overview</h1>
          <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">
            Every visit is grouped as a quick clinical summary so you can jump straight into the patient file that needs attention.
          </p>
        </div>

        <div className="grid gap-4">
          {visits.map((visit) => (
            <Link key={visit._id} href={`/patients/${visit.patientId?._id || ''}`}>
              <Card className="panel-pop border-none">
                <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 font-serif text-2xl">
                      <Stethoscope className="h-5 w-5 text-emerald-600" />
                      {visit.patientId?.fullName || 'Patient visit'}
                    </CardTitle>
                    <CardDescription>
                      {new Date(visit.visitDate).toLocaleString()}
                    </CardDescription>
                  </div>
                  <Badge className="bg-emerald-600">
                    {visit.selectedRemedies?.[0]?.remedyName || 'Pending repertorization'}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {(visit.symptoms || []).slice(0, 6).map((symptom: string) => (
                      <Badge key={symptom} variant="outline">{symptom}</Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <CalendarClock className="h-4 w-4" />
                    Revenue booked: Rs {visit.billedAmountInr || 0}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {visit.notes || visit.assessment || 'No additional visit notes recorded yet.'}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
