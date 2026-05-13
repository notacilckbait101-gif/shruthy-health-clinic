"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, BookOpenText, Search, Sparkles, Thermometer } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { buildMatchPresentation } from '@/lib/remedy-reference'

type Match = {
  remedy: {
    id: string
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
    aggravations: string[]
    ameliorations: string[]
    potencies: string[]
    source: string[]
    thermalPreference?: string
    cravings?: string[]
    emotionalSymptoms?: string[]
    sleepPattern?: string
  }
  score: number
  matchedRubrics: string[]
  overlapTerms: string[]
}

export default function LocalRemedySearch() {
  const [symptomInput, setSymptomInput] = useState('dry cough, thirst, worse at night')
  const [thermalPreference, setThermalPreference] = useState('')
  const [sleepPattern, setSleepPattern] = useState('')
  const [cravings, setCravings] = useState('')
  const [emotionalSymptoms, setEmotionalSymptoms] = useState('')
  const [aggravations, setAggravations] = useState('')
  const [ameliorations, setAmeliorations] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [results, setResults] = useState<Match[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastQuery, setLastQuery] = useState('')
  const [catalogStats, setCatalogStats] = useState<{ remedies: number; rubrics: number; builtAt: string } | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [matchedRubrics, setMatchedRubrics] = useState<string[]>([])

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch('/api/homeopathy/repertory?stats=1')
        const result = await response.json()
        if (result.success) {
          setCatalogStats(result.data)
        } else {
          setErrorMessage(result.message || 'Catalog stats did not load.')
        }
      } catch (error) {
        setErrorMessage('Catalog stats did not load.')
      }
    }

    loadStats()
  }, [])

  useEffect(() => {
    const lastTerm = symptomInput.split(',').pop()?.trim()
    if (!lastTerm || lastTerm.length < 2) {
      setSuggestions([])
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/homeopathy/repertory?autocomplete=${encodeURIComponent(lastTerm)}`, {
          signal: controller.signal,
        })
        const result = await response.json()
        if (result.success) {
          setSuggestions(result.data)
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setSuggestions([])
        }
      }
    }, 320)

    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [symptomInput])

  const runAnalysis = async (signal?: AbortSignal) => {
    const normalized = symptomInput.trim()
    if (!normalized) {
      setResults([])
      return
    }

    setIsLoading(true)
    setErrorMessage('')
    try {
      const response = await fetch('/api/homeopathy/repertory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal,
        body: JSON.stringify({
          type: 'symptom-analysis',
          symptoms: symptomInput.split(',').map((item) => item.trim()).filter(Boolean),
          patientInfo: {
            thermalPreference,
            sleepPattern,
            cravings: cravings.split(',').map((item) => item.trim()).filter(Boolean),
            emotionalSymptoms: emotionalSymptoms.split(',').map((item) => item.trim()).filter(Boolean),
            aggravations: aggravations.split(',').map((item) => item.trim()).filter(Boolean),
            ameliorations: ameliorations.split(',').map((item) => item.trim()).filter(Boolean),
            modalities: [],
          },
        }),
      })
      const result = await response.json()
      if (result.success) {
        setResults(result.data.topRemedies)
        setMatchedRubrics((result.data.matchedRubrics || []).slice(0, 8))
        setLastQuery(normalized)
      } else {
        setResults([])
        setMatchedRubrics([])
        setErrorMessage(result.message || 'Repertory matching failed.')
      }
    } catch (error) {
      if (signal?.aborted) return
      setResults([])
      setMatchedRubrics([])
      setErrorMessage('Repertory matching failed.')
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    const normalized = symptomInput.trim()
    if (normalized.length < 4) {
      setResults([])
      setMatchedRubrics([])
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(() => {
      runAnalysis(controller.signal)
    }, 700)

    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [symptomInput, thermalPreference, sleepPattern, cravings, emotionalSymptoms, aggravations, ameliorations])

  const summary = useMemo(() => ({
    resultCount: results.length,
    topScore: results[0]?.score || 0,
    rubricSpread: new Set(results.flatMap((match) => match.matchedRubrics)).size,
  }), [results])

  return (
    <div className="space-y-6">
      <Card className="panel-pop border-none">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/dashboard" className="section-kicker inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>
            <CardTitle className="flex items-center gap-2">
              <BookOpenText className="h-5 w-5 text-emerald-600" />
              Local repertory engine
            </CardTitle>
            <CardDescription>
              Live repertory typing with local remedy intelligence, typo-tolerant symptom matching, and richer real-source repertory depth.
            </CardDescription>
          </div>
          <ThemeToggle />
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-emerald-100/70 bg-emerald-50/70 p-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Matched remedies</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">{summary.resultCount}</p>
            </div>
            <div className="rounded-[1.5rem] border border-emerald-100/70 bg-emerald-50/70 p-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Top score</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">{summary.topScore}</p>
            </div>
            <div className="rounded-[1.5rem] border border-emerald-100/70 bg-emerald-50/70 p-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Rubric spread</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">{summary.rubricSpread}</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-emerald-100/70 bg-emerald-950/40 p-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Catalog remedies</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{catalogStats?.remedies ?? '...'}</p>
            </div>
            <div className="rounded-[1.5rem] border border-emerald-100/70 bg-emerald-950/40 p-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Catalog rubrics</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{catalogStats?.rubrics ?? '...'}</p>
            </div>
            <div className="rounded-[1.5rem] border border-emerald-100/70 bg-emerald-950/40 p-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Search mode</p>
              <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">Fast local matching</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Typo-tolerant symptom search with cached local repertory data.</p>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-emerald-100/70 bg-emerald-950/40 p-4 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Cache built</p>
            <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
              {catalogStats?.builtAt ? new Date(catalogStats.builtAt).toLocaleString() : 'Loading...'}
            </p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Real local repertory data with typo-tolerant matching for natural symptom phrases.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="symptoms">Symptoms</Label>
              <Textarea
                id="symptoms"
                rows={4}
                value={symptomInput}
                onChange={(event) => setSymptomInput(event.target.value)}
                placeholder="Type symptoms like dry cough, thirst, worse at night"
                className="rounded-[1.5rem]"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                OOREP-style search works here: use `pain*` for wildcards, `-abdomen` to exclude, or `"dry cough"` for exact phrases.
              </p>
              {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setSymptomInput((current) => `${current.replace(/[^,]*$/, '').trim()}${current.includes(',') ? ', ' : ''}${suggestion}`)}
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="thermalPreference">Thermal preference</Label>
              <Input
                id="thermalPreference"
                value={thermalPreference}
                onChange={(event) => setThermalPreference(event.target.value)}
                placeholder="Chilly, hot, likes cool air..."
                className="rounded-[1.25rem]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sleepPattern">Sleep pattern</Label>
              <Input
                id="sleepPattern"
                value={sleepPattern}
                onChange={(event) => setSleepPattern(event.target.value)}
                placeholder="Wakes after midnight, restless sleep..."
                className="rounded-[1.25rem]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cravings">Cravings</Label>
              <Input
                id="cravings"
                value={cravings}
                onChange={(event) => setCravings(event.target.value)}
                placeholder="Cold water, sweets..."
                className="rounded-[1.25rem]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emotionalSymptoms">Emotional symptoms</Label>
              <Input
                id="emotionalSymptoms"
                value={emotionalSymptoms}
                onChange={(event) => setEmotionalSymptoms(event.target.value)}
                placeholder="Anxious, weepy, irritable..."
                className="rounded-[1.25rem]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aggravations">Aggravations</Label>
              <Input
                id="aggravations"
                value={aggravations}
                onChange={(event) => setAggravations(event.target.value)}
                placeholder="Night, motion, cold air..."
                className="rounded-[1.25rem]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ameliorations">Ameliorations</Label>
              <Input
                id="ameliorations"
                value={ameliorations}
                onChange={(event) => setAmeliorations(event.target.value)}
                placeholder="Rest, pressure, warm drinks..."
                className="rounded-[1.25rem]"
              />
            </div>
          </div>

          <Button onClick={() => { void runAnalysis() }} disabled={isLoading} className="rounded-full bg-emerald-600 px-6 hover:bg-emerald-700">
            <Search className="mr-2 h-4 w-4" />
            {isLoading ? 'Searching repertory...' : 'Match remedies'}
          </Button>

          {errorMessage && (
            <div className="rounded-[1.25rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
              {errorMessage}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            {lastQuery
              ? `Live match for: ${lastQuery}`
              : 'Start typing symptoms and the remedies will appear automatically.'}
          </div>
          {matchedRubrics.length > 0 && (
            <div className="rounded-[1.25rem] border border-emerald-100/70 bg-emerald-950/35 p-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Matched rubrics</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {matchedRubrics.map((rubric) => (
                  <Badge key={rubric} variant="outline">{rubric}</Badge>
                ))}
              </div>
            </div>
          )}
          <div className="grid gap-2 text-xs text-slate-500 dark:text-slate-400 md:grid-cols-3">
            <div className="rounded-[1.25rem] border border-emerald-100/70 px-3 py-2 dark:border-white/10">Example: `cough*, dry*, -whooping`</div>
            <div className="rounded-[1.25rem] border border-emerald-100/70 px-3 py-2 dark:border-white/10">Example: `"thirst large quantities"`</div>
            <div className="rounded-[1.25rem] border border-emerald-100/70 px-3 py-2 dark:border-white/10">Example: `"heart palp*", "pain in"`</div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {results.map((match, index) => (
          <motion.div
            key={match.remedy.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            {(() => {
              const presentation = buildMatchPresentation(match.score, match.matchedRubrics)
              return (
            <Card className="panel-pop border-none">
              <CardContent className="space-y-5 p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-serif text-2xl text-slate-900 dark:text-white">{match.remedy.name}</h3>
                      <Badge className="bg-emerald-600">score: {match.score}</Badge>
                      <Badge variant="secondary">fit: {presentation.fitScore}/100</Badge>
                    </div>
                    <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">{match.remedy.description}</p>
                  </div>
                  <div className="rounded-[1.5rem] bg-emerald-500/10 p-3 text-emerald-700 dark:text-emerald-300">
                    <Sparkles className="h-5 w-5" />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-[1.5rem] border border-emerald-100/70 p-4 dark:border-white/10">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Potency</p>
                    <p className="mt-2 font-medium">{match.remedy.potency}</p>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{match.remedy.potencyReference}</p>
                  </div>
                  <div className="rounded-[1.5rem] border border-emerald-100/70 p-4 dark:border-white/10">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Traditional dose reference</p>
                    <p className="mt-2 text-sm">{match.remedy.dosage}</p>
                  </div>
                  <div className="rounded-[1.5rem] border border-emerald-100/70 p-4 dark:border-white/10">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Review window</p>
                    <p className="mt-2 text-sm">{match.remedy.reviewWindowDays} days</p>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{match.remedy.recoveryEstimate}</p>
                  </div>
                  <div className="rounded-[1.5rem] border border-emerald-100/70 p-4 dark:border-white/10">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Schedule and watchfulness</p>
                    <p className="mt-2 flex items-center gap-2 text-sm">
                      <Thermometer className="h-4 w-4 text-emerald-600" />
                      {match.remedy.sessionsPerDay} times/day • {match.remedy.pelletsPerDose} pellets
                    </p>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>Watchfulness</span>
                        <span>{match.remedy.watchfulness || presentation.watchfulness}/100</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-emerald-100 dark:bg-emerald-950/40">
                        <div className="h-2 rounded-full bg-gradient-to-r from-emerald-500 via-lime-400 to-amber-400" style={{ width: `${match.remedy.watchfulness || presentation.watchfulness}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">Keynotes</p>
                    <div className="flex flex-wrap gap-2">
                      {match.remedy.keynotes.slice(0, 10).map((item) => (
                        <Badge key={item} variant="outline">{item}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">Matched rubrics</p>
                    <div className="flex flex-wrap gap-2">
                      {match.matchedRubrics.slice(0, 10).map((item) => (
                        <Badge key={item} variant="outline">{item}</Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">Modalities</p>
                    <div className="flex flex-wrap gap-2">
                      {match.remedy.modalities.slice(0, 8).map((item) => (
                        <Badge key={item} variant="secondary">{item}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">Associated symptom clusters</p>
                    <div className="flex flex-wrap gap-2">
                      {match.remedy.associatedSymptoms.map((item) => (
                        <Badge key={item} variant="secondary">{item}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-[1.25rem] border border-emerald-100/70 bg-emerald-950/40 p-4 dark:border-white/10 dark:bg-white/5">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Comfort and monitoring notes</p>
                    <div className="mt-2 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                      {match.remedy.comfortMeasures.map((item) => (
                        <p key={item}>{item}</p>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-[1.25rem] border border-emerald-100/70 bg-emerald-950/40 p-4 dark:border-white/10 dark:bg-white/5">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Reference quality</p>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{match.remedy.accuracyNote}</p>
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                      Complementary: {match.remedy.complementaryRemedies.join(', ') || 'None listed'}
                    </p>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      Antidotes: {match.remedy.antidotes.join(', ') || 'None listed'}
                    </p>
                  </div>
                </div>
                <div className="text-xs uppercase tracking-[0.25em] text-slate-400">
                  Sources: {match.remedy.source.join(', ')}
                </div>
              </CardContent>
            </Card>
              )
            })()}
          </motion.div>
        ))}

        {results.length === 0 && !isLoading && (
          <div className="panel-pop rounded-[1.75rem] border-none p-8 text-center text-slate-600 dark:text-slate-300">
            No remedies are shown yet. Type symptoms above and the local repertory will load matches here.
          </div>
        )}
      </div>
    </div>
  )
}
