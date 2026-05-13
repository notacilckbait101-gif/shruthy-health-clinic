"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

type PatientCard = {
  id: string
  fullName: string
  age: number
  gender: string
  chiefComplaint?: string
  currentSymptoms?: string[]
  latestVisit?: {
    visitDate?: string
    selectedRemedies?: Array<{ remedyName: string }>
  } | null
}

export default function PatientsPage() {
  const [search, setSearch] = useState('')
  const [patients, setPatients] = useState<PatientCard[]>([])

  useEffect(() => {
    const timer = setTimeout(async () => {
      const response = await fetch(`/api/patients?limit=100&search=${encodeURIComponent(search)}`)
      const result = await response.json()
      if (result.success) {
        setPatients(result.data)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [search])

  return (
    <div className="page-shell p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="panel-pop pop-in flex flex-col gap-5 p-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/85 px-4 py-2 text-sm font-medium text-emerald-800 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>
            <p className="section-kicker mt-5">Patient register</p>
            <h1 className="mt-3 font-serif text-5xl text-slate-900 dark:text-white">Brief patient cards</h1>
            <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">
              Browse each case quickly, then click through to the full patient file with repertory details, visits, notes, and follow-ups.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Designed by Shrujan</p>
            <Link href="/patients/add">
              <Button className="rounded-full bg-emerald-600 hover:bg-emerald-700">Add patient</Button>
            </Link>
          </div>
        </div>

        <Card className="panel-pop border-none">
          <CardContent className="p-5">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by patient name, phone, email, or symptom..."
                className="h-12 rounded-full pl-11"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {patients.map((patient) => (
            <Link key={patient.id} href={`/patients/${patient.id}`}>
              <Card className="panel-pop h-full border-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 font-serif text-2xl">
                    <span className="rounded-2xl bg-emerald-500/15 p-2 text-emerald-700 dark:text-emerald-300">
                      <UserRound className="h-5 w-5" />
                    </span>
                    {patient.fullName}
                  </CardTitle>
                  <CardDescription>
                    {patient.age} years - {patient.gender}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {patient.chiefComplaint || 'Chief complaint not recorded yet.'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(patient.currentSymptoms || []).slice(0, 4).map((symptom) => (
                      <Badge key={symptom} variant="outline">{symptom}</Badge>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-emerald-100/70 p-4 dark:border-white/10">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Latest remedy</p>
                    <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                      {patient.latestVisit?.selectedRemedies?.[0]?.remedyName || 'No repertory selection yet'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
