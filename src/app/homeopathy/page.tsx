"use client"

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, BookOpenText, DatabaseZap, ShieldCheck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import LocalRemedySearch from '@/components/homeopathy/local-remedy-search'

export default function HomeopathyDashboard() {
  return (
    <div className="page-shell p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="panel-pop space-y-4 p-8 text-center"
        >
          <div className="flex justify-start">
            <Link
              href="/dashboard"
              prefetch={false}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-900/50 bg-emerald-950/45 px-4 py-2 text-sm font-medium text-emerald-100 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-800 hover:bg-emerald-900/60"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>
          </div>
          <p className="section-kicker">
            OOREP local repertory
          </p>
          <h1 className="font-serif text-4xl text-slate-900 dark:text-white">
            Repertory search with local remedy intelligence
          </h1>
          <p className="mx-auto max-w-3xl text-lg text-slate-600 dark:text-slate-300">
            Live symptom lookup runs against the local OOREP dump and Boericke-linked remedy notes, now surfaced in a faster pop-in workspace with stronger fallbacks.
          </p>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: DatabaseZap,
              title: 'Local JSON persistence',
              description: 'Doctors, patients, visits, rubrics, remedies, appointments, follow-ups, and notes are now stored only in local JSON files and caches inside the workspace.',
            },
            {
              icon: BookOpenText,
              title: 'OOREP-compatible search',
              description: 'Symptoms are scored against local repertory rubrics with wildcard, exclusion, and exact-phrase search behavior modeled on OOREP.',
            },
            {
              icon: ShieldCheck,
              title: 'Offline-friendly logic',
              description: 'No OpenAI, no cloud AI, no paid APIs, and no automatic diagnosis or autonomous prescription engine.',
            },
          ].map((item) => (
            <Card key={item.title} className="panel-pop border-none">
              <CardContent className="p-6">
                <item.icon className="h-6 w-6 text-emerald-600 dark:text-emerald-300" />
                <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">{item.title}</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <LocalRemedySearch />
      </div>
    </div>
  )
}
