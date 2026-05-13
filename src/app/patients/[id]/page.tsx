"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle2, FileText, Printer, Save, Sparkles, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { buildMatchPresentation } from '@/lib/remedy-reference'

type PatientPayload = {
  id: string
  fullName: string
  age: number
  gender: string
  consultationFeeInr?: number
  chiefComplaint?: string
  thermalPreference?: string
  sleepPattern?: string
  cravings?: string[]
  emotionalSymptoms?: string[]
  aggravations?: string[]
  ameliorations?: string[]
  currentSymptoms?: string[]
  visits: Array<any>
  appointments: Array<any>
  followUps: Array<any>
  notes: Array<any>
}

type RemedyMatch = {
  remedy: {
    id?: string
    name: string
    potency: string
    potencyReference: string
    dosage: string
    pelletsPerDose: string
    sessionsPerDay: string
    reviewWindowDays: string
    watchfulness: number
    associatedSymptoms: string[]
    comfortMeasures: string[]
    accuracyNote: string
    keynotes: string[]
    modalities: string[]
    description: string
    complementaryRemedies: string[]
    antidotes: string[]
    recoveryEstimate: string
    source?: string[]
  }
  score: number
  matchedRubrics: string[]
}

export default function PatientDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [patient, setPatient] = useState<PatientPayload | null>(null)
  const [symptoms, setSymptoms] = useState('')
  const [results, setResults] = useState<RemedyMatch[]>([])
  const [selectedRemedies, setSelectedRemedies] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [assessment, setAssessment] = useState('')
  const [observations, setObservations] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const response = await fetch(`/api/patients/${params.id}`)
      const result = await response.json()
      if (result.success) {
        setPatient(result.data)
        setSymptoms((result.data.currentSymptoms || []).join(', '))
      }
    }

    load()
  }, [params.id])

  useEffect(() => {
    if (!symptoms.trim()) {
      setResults([])
      setSelectedRemedies([])
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const response = await fetch('/api/homeopathy/repertory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'symptom-analysis',
            symptoms: symptoms.split(',').map((item) => item.trim()).filter(Boolean),
            patientInfo: {
              thermalPreference: patient?.thermalPreference,
              cravings: patient?.cravings,
              emotionalSymptoms: patient?.emotionalSymptoms,
              sleepPattern: patient?.sleepPattern,
              aggravations: patient?.aggravations,
              ameliorations: patient?.ameliorations,
            },
          }),
        })
        const result = await response.json()
        if (result.success) {
          setResults(result.data.topRemedies)
        } else {
          setResults([])
        }
      } finally {
        setIsSearching(false)
      }
    }, 350)

    return () => clearTimeout(timer)
  }, [symptoms, patient])

  useEffect(() => {
    if (results.length === 0) {
      setSelectedRemedies([])
      return
    }

    setSelectedRemedies((current) => {
      const available = new Set(results.map((match) => match.remedy.name))
      const preserved = current.filter((name) => available.has(name))
      if (preserved.length > 0) return preserved
      return results.slice(0, 3).map((match) => match.remedy.name)
    })
  }, [results])

  const selectedMatches = useMemo(
    () => results.filter((match) => selectedRemedies.includes(match.remedy.name)),
    [results, selectedRemedies],
  )

  const toggleRemedy = (name: string) => {
    setSelectedRemedies((current) =>
      current.includes(name) ? current.filter((item) => item !== name) : [...current, name],
    )
  }

  const saveVisit = async () => {
    if (!patient) return

    const parsedSymptoms = symptoms.split(',').map((item) => item.trim()).filter(Boolean)
    if (parsedSymptoms.length === 0) {
      toast.error('Add symptoms before saving a visit.')
      return
    }

    if (selectedMatches.length === 0) {
      toast.error('Select at least one remedy to save this repertorization.')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient.id,
          symptoms: parsedSymptoms,
          observations,
          assessment,
          notes,
          followUpDate: followUpDate ? new Date(followUpDate).toISOString() : null,
          billedAmountInr: patient.consultationFeeInr || 0,
          selectedRemedies: selectedMatches.map((match) => ({
            remedyName: match.remedy.name,
            score: match.score,
            potency: match.remedy.potency,
            dosage: match.remedy.dosage,
            instructions: `Matched via local repertory against ${match.matchedRubrics.slice(0, 3).join(', ')}`,
          })),
        }),
      })

      const result = await response.json()
      if (!result.success) {
        toast.error(result.message || 'Could not save the visit.')
        return
      }

      setPatient((current) =>
        current
          ? {
              ...current,
              currentSymptoms: parsedSymptoms,
              visits: [result.data, ...current.visits],
            }
          : current,
      )
      toast.success('Visit and remedy selection saved.')
    } finally {
      setIsSaving(false)
    }
  }

  const quickSelectRemedy = (name: string) => {
    setSelectedRemedies([name])
  }

  if (!patient) {
    return <div className="page-shell flex min-h-screen items-center justify-center p-6">Loading patient record...</div>
  }

  return (
    <div className="page-shell p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel-pop pop-in flex flex-col gap-4 p-6 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <div className="flex flex-wrap gap-4">
              <Link href="/patients" className="section-kicker inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to patients
              </Link>
              <Link href="/dashboard" className="section-kicker inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Link>
            </div>
            <Link href="/dashboard" className="sr-only">
              Back
            </Link>
            <h1 className="mt-3 font-serif text-4xl text-slate-900 dark:text-white">{patient.fullName}</h1>
            <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">
              {patient.age} years - {patient.gender} - {patient.chiefComplaint || 'No chief complaint recorded yet'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" className="rounded-full" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button type="button" className="rounded-full bg-emerald-600 hover:bg-emerald-700" onClick={saveVisit} disabled={isSaving || selectedMatches.length === 0}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving visit...' : `Save visit with ${selectedMatches.length} remedy${selectedMatches.length === 1 ? '' : 'ies'}`}
            </Button>
          </div>
        </motion.div>

        <div className="space-y-6">
          <Card className="panel-pop border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-600" />
                Live repertory workspace
              </CardTitle>
              <CardDescription>
                Edit the symptom totality, watch local OOREP matching refresh, then save the remedies that matter.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
                <Textarea
                  rows={4}
                  value={symptoms}
                  onChange={(event) => setSymptoms(event.target.value)}
                  placeholder="dry cough, thirst, worse at night"
                  className="rounded-[1.5rem]"
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <Textarea
                    rows={3}
                    value={assessment}
                    onChange={(event) => setAssessment(event.target.value)}
                    placeholder="Assessment"
                    className="rounded-[1.5rem]"
                  />
                  <Textarea
                    rows={3}
                    value={observations}
                    onChange={(event) => setObservations(event.target.value)}
                    placeholder="Observations"
                    className="rounded-[1.5rem]"
                  />
                </div>
                <Textarea
                  rows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Clinical notes or prescription instructions"
                  className="rounded-[1.5rem]"
                />

                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <span className="pill-pop">{results.length} remedies matched</span>
                  <span className="pill-pop">{selectedMatches.length} selected to save</span>
                  <span>{isSearching ? 'Refreshing remedy map...' : 'Local repertory results are ready.'}</span>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Review date</label>
                  <Input type="date" value={followUpDate} onChange={(event) => setFollowUpDate(event.target.value)} />
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  {results.map((match, index) => {
                    const isSelected = selectedRemedies.includes(match.remedy.name)
                    const presentation = buildMatchPresentation(match.score, match.matchedRubrics)
                    return (
                      <motion.div
                        key={match.remedy.name}
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04 }}
                      >
                        <div className={`rounded-[1.75rem] border p-5 transition ${
                          isSelected
                            ? 'border-emerald-400 bg-emerald-50 shadow-[0_18px_40px_-28px_rgba(16,185,129,0.8)] dark:bg-emerald-500/10'
                            : 'border-emerald-100/80 bg-white/65 dark:border-white/10 dark:bg-white/5'
                        }`}>
                          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-3">
                                <h3 className="font-serif text-2xl text-slate-900 dark:text-white">{match.remedy.name}</h3>
                                <Badge className="bg-emerald-600">score {match.score}</Badge>
                                <Badge variant="secondary">fit {presentation.fitScore}/100</Badge>
                                {isSelected && <Badge variant="secondary"><CheckCircle2 className="mr-1 h-3.5 w-3.5" />selected</Badge>}
                              </div>
                              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{match.remedy.description}</p>
                            </div>
                            <Button
                              type="button"
                              variant={isSelected ? 'default' : 'outline'}
                              className={`rounded-full ${isSelected ? 'bg-emerald-700 hover:bg-emerald-800' : ''}`}
                              onClick={() => toggleRemedy(match.remedy.name)}
                            >
                              {isSelected ? 'Selected' : 'Select remedy'}
                            </Button>
                          </div>

                          <div className="mt-4">
                            <Button
                              type="button"
                              variant="outline"
                              className="rounded-full border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                              onClick={() => quickSelectRemedy(match.remedy.name)}
                            >
                              Save only this remedy
                            </Button>
                          </div>

                          <div className="mt-4 grid gap-3 md:grid-cols-2">
                            <div className="rounded-[1.25rem] border border-white/60 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
                              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Traditional potency and dose</p>
                              <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                                {match.remedy.potency} - {match.remedy.dosage}
                              </p>
                              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{match.remedy.potencyReference}</p>
                            </div>
                            <div className="rounded-[1.25rem] border border-white/60 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
                              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Review and watchfulness</p>
                              <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{match.remedy.reviewWindowDays} day review window</p>
                              <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{match.remedy.sessionsPerDay} times/day | {match.remedy.pelletsPerDose} pellets</p>
                              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{match.remedy.recoveryEstimate}</p>
                            </div>
                          </div>
                          <div className="mt-4 rounded-[1.25rem] border border-white/60 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
                            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                              <span>Watchfulness meter</span>
                              <span>{match.remedy.watchfulness || presentation.watchfulness}/100</span>
                            </div>
                            <div className="mt-3 h-2 rounded-full bg-emerald-100 dark:bg-emerald-950/40">
                              <div className="h-2 rounded-full bg-gradient-to-r from-emerald-500 via-lime-400 to-amber-400" style={{ width: `${match.remedy.watchfulness || presentation.watchfulness}%` }} />
                            </div>
                          </div>

                          <div className="mt-4 grid gap-4 lg:grid-cols-2">
                            <div>
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">Keynotes</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {match.remedy.keynotes.slice(0, 8).map((keynote) => (
                                  <Badge key={keynote} variant="outline">{keynote}</Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">Associated symptom clusters</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {match.remedy.associatedSymptoms.map((item) => (
                                  <Badge key={item} variant="secondary">{item}</Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 grid gap-4 lg:grid-cols-2">
                            <div className="rounded-[1.25rem] border border-white/60 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">Matched rubrics</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {match.matchedRubrics.slice(0, 8).map((rubric) => (
                                  <Badge key={rubric} variant="outline">{rubric}</Badge>
                                ))}
                              </div>
                            </div>
                            <div className="rounded-[1.25rem] border border-white/60 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">Comfort and monitoring</p>
                              <div className="mt-2 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                                {match.remedy.comfortMeasures.map((item) => (
                                  <p key={item}>{item}</p>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 rounded-[1.25rem] border border-white/60 bg-white/60 p-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                            {match.remedy.accuracyNote}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}

                  {results.length === 0 && !isSearching && (
                    <div className="rounded-[1.75rem] border border-dashed border-emerald-200 bg-emerald-50/50 p-8 text-center text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                      Add or refine symptoms to load local remedy matches.
                    </div>
                  )}
                </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
            <Card className="panel-pop border-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserRound className="h-5 w-5 text-emerald-600" />
                  Constitutional picture
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm">
                <div><span className="font-semibold text-slate-900 dark:text-white">Thermal:</span> {patient.thermalPreference || 'Not recorded'}</div>
                <div><span className="font-semibold text-slate-900 dark:text-white">Sleep:</span> {patient.sleepPattern || 'Not recorded'}</div>
                <div><span className="font-semibold text-slate-900 dark:text-white">Cravings:</span> {(patient.cravings || []).join(', ') || 'Not recorded'}</div>
                <div><span className="font-semibold text-slate-900 dark:text-white">Emotional:</span> {(patient.emotionalSymptoms || []).join(', ') || 'Not recorded'}</div>
                <div><span className="font-semibold text-slate-900 dark:text-white">Aggravations:</span> {(patient.aggravations || []).join(', ') || 'Not recorded'}</div>
                <div><span className="font-semibold text-slate-900 dark:text-white">Ameliorations:</span> {(patient.ameliorations || []).join(', ') || 'Not recorded'}</div>
                <div><span className="font-semibold text-slate-900 dark:text-white">Consultation fee:</span> Rs {patient.consultationFeeInr || 0}</div>
              </CardContent>
            </Card>

            <Card className="panel-pop border-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  Visit history and notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {patient.visits.map((visit) => (
                  <div key={visit._id} className="rounded-[1.5rem] border border-emerald-100/70 bg-emerald-50/50 p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-semibold text-slate-900 dark:text-white">{new Date(visit.visitDate).toLocaleDateString()}</p>
                      <Badge variant="secondary">{visit.selectedRemedies?.[0]?.remedyName || 'No remedy saved'}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{(visit.symptoms || []).join(', ')}</p>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{visit.notes || visit.assessment || 'No notes recorded.'}</p>
                  </div>
                ))}
                {patient.notes.map((note) => (
                  <div key={note._id} className="rounded-[1.5rem] border border-emerald-100/70 bg-emerald-50/50 p-4 dark:border-white/10 dark:bg-white/5">
                    <p className="font-semibold text-slate-900 dark:text-white">{note.title}</p>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{note.content}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
