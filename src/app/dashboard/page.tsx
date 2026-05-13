"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Activity,
  ChevronRight,
  CircleDollarSign,
  FileText,
  FlaskConical,
  Leaf,
  Pill,
  Stethoscope,
  LogOut,
  User,
  UserPlus,
  Users,
} from 'lucide-react'
import { ClinicLogo } from '@/components/clinic-logo'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ThemeToggle } from '@/components/theme-toggle'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type DashboardPayload = {
  totalPatients: number
  totalVisits: number
  currentMonthRevenue: number
  monthlyRevenue: Array<{ month: string; amount: number }>
  availableRemedies: number
  availableRubrics: number
  upcomingAppointments: Array<any>
  recentVisits: Array<any>
  weeklyTrend: Array<{ _id: string; visits: number }>
  topRemedies: Array<{ _id: string; count: number; avgScore: number }>
  topRemediesSource: 'visits' | 'catalog'
  remedyLibrary: Array<any>
}

type DoctorProfile = {
  id: string
  fullName: string
  email: string
  clinicName: string
  avatarUrl: string | null
  authProvider: 'local' | 'google'
  medicalLicenseId: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardPayload | null>(null)
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [summaryResponse, doctorResponse] = await Promise.all([
          fetch('/api/dashboard/summary'),
          fetch('/api/auth/me'),
        ])
        const [summaryResult, doctorResult] = await Promise.all([
          summaryResponse.json(),
          doctorResponse.json(),
        ])

        if (summaryResult.success) {
          setData(summaryResult.data)
        } else {
          setLoadError(summaryResult.message || 'Dashboard data could not be loaded.')
        }

        if (doctorResult.success) {
          setDoctor(doctorResult.data)
        }
      } catch (error) {
        setLoadError('Dashboard data could not be loaded.')
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [])

  if (isLoading) {
    return (
      <div className="page-shell flex min-h-screen items-center justify-center">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    )
  }

  if (loadError || !data) {
    return (
      <div className="page-shell p-6">
        <div className="mx-auto max-w-4xl">
          <div className="panel-pop rounded-[2rem] p-8 text-center">
            <p className="section-kicker">Dashboard unavailable</p>
            <h1 className="mt-3 font-serif text-4xl text-slate-900 dark:text-white">The local clinic data did not load</h1>
            <p className="mt-3 text-slate-600 dark:text-slate-300">
              {loadError || 'Try reloading after signing in again. The app is now JSON-only, so no Mongo service is required.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const weeklyTrend = data.weeklyTrend.map((item) => ({
    day: item._id,
    visits: item.visits,
  }))
  const hasWeeklyActivity = weeklyTrend.some((item) => item.visits > 0)
  const monthlyRevenue = data.monthlyRevenue.map((entry) => ({
    ...entry,
    label: new Date(`${entry.month}-01T00:00:00`).toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
  }))
  const hasRevenue = monthlyRevenue.some((item) => item.amount > 0)

  const statCards = [
    { label: 'Patients', value: data.totalPatients, icon: Users, href: '/patients', accent: 'bg-emerald-600' },
    { label: 'Visits', value: data.totalVisits, icon: Stethoscope, href: '/visits', accent: 'bg-lime-600' },
    { label: 'This Month', value: `Rs ${data.currentMonthRevenue}`, icon: CircleDollarSign, href: '/visits', accent: 'bg-teal-600' },
    { label: 'Remedies', value: data.availableRemedies.toLocaleString(), icon: FlaskConical, href: '/homeopathy', accent: 'bg-green-600' },
    { label: 'Rubrics', value: data.availableRubrics.toLocaleString(), icon: Pill, href: '/homeopathy', accent: 'bg-emerald-700' },
  ]

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="page-shell p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="panel-pop pop-in overflow-hidden p-6 md:p-8">
          <div className="grid gap-8 xl:grid-cols-[1.12fr_0.88fr]">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-3 rounded-full border border-emerald-200/70 bg-emerald-50/70 px-3 py-2 text-sm font-semibold text-emerald-900">
                  <ClinicLogo size={32} priority className="h-8 w-8 rounded-full object-cover" />
                  Shruty Health Clinic
                </span>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">Minimal local workspace</span>
              </div>

              <div>
                <h1 className="font-serif text-6xl leading-[0.95] text-slate-900 dark:text-white">
                  Calm practice control,
                  <br />
                  richer repertory flow.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300">
                  Patients, repertory, visits, money tracking, and doctor identity all live in one local-first clinic system.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="soft-panel p-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Doctor</p>
                  <p className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">{doctor?.fullName || 'Shruty Health Clinic'}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{doctor?.authProvider === 'google' ? 'Google linked profile' : 'Local clinic profile'}</p>
                </div>
                <div className="soft-panel p-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Revenue pulse</p>
                  <p className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">Rs {data.currentMonthRevenue}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Current month saved from visits</p>
                </div>
                <div className="soft-panel p-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Catalog</p>
                  <p className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">{data.availableRemedies.toLocaleString()} remedies</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{data.availableRubrics.toLocaleString()} rubrics loaded locally</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between gap-4">
              <div className="flex items-center justify-end gap-3">
                <ThemeToggle />
                <Link href="/homeopathy">
                  <Button className="rounded-full bg-emerald-700 px-5 text-white hover:bg-emerald-800">
                    <Pill className="mr-2 h-4 w-4" />
                    Live repertory
                  </Button>
                </Link>
                <Link href="/patients/add">
                  <Button variant="outline" className="rounded-full border-emerald-200 bg-emerald-50/80 text-emerald-900 hover:bg-emerald-100 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add patient
                  </Button>
                </Link>
              </div>

              <div className="soft-panel flex items-center gap-4 p-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-[1.2rem] bg-gradient-to-br from-emerald-800 to-emerald-700 text-white shadow-sm">
                  <User className="h-7 w-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-slate-900 dark:text-white">{doctor?.fullName || 'Shruty Health Clinic'}</p>
                  <p className="truncate text-sm text-slate-500 dark:text-slate-300">{doctor?.email || 'local@shruty-health-clinic'}</p>
                </div>
                <Button type="button" variant="outline" className="rounded-full border-emerald-700/70 bg-emerald-950/30 text-emerald-100 hover:border-emerald-700 hover:bg-emerald-900/60 hover:text-emerald-50" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
                <Leaf className="h-5 w-5 text-emerald-600" />
              </div>

              <div className="soft-panel p-5">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Built for the clinic</p>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Faster case entry, cleaner navigation, and a profile surface that supports both local accounts and Gmail-linked sign-in.
                </p>
                <p className="mt-4 text-xs uppercase tracking-[0.28em] text-slate-500">Designed by Shrujan</p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {statCards.map((card, index) => (
            <Link key={card.label} href={card.href}>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className="metric-tile h-full"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-slate-500 dark:text-slate-300">{card.label}</p>
                    <p className="mt-3 text-4xl font-semibold text-slate-900 dark:text-white">{card.value}</p>
                  </div>
                  <div className={`rounded-[1.3rem] ${card.accent} p-3 text-white shadow-lg`}>
                    <card.icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-5 flex items-center text-sm text-slate-500 dark:text-slate-300">
                  Open {card.label.toLowerCase()}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </div>
              </motion.div>
            </Link>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Card className="panel-pop border-none">
            <CardHeader>
              <CardTitle className="font-serif text-3xl">Revenue rhythm</CardTitle>
              <CardDescription>Monthly INR flow from saved visits.</CardDescription>
            </CardHeader>
            <CardContent className="h-[340px]">
              {hasRevenue ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyRevenue}>
                    <defs>
                      <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.65} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.06} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.14} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(value) => [`Rs ${value}`, 'Revenue']} />
                    <Area type="monotone" dataKey="amount" stroke="#059669" fill="url(#revenueFill)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-[1.75rem] border border-dashed border-emerald-200 bg-emerald-50/60 text-center text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  Save visits with patient fees to start tracking monthly earnings.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="panel-pop border-none">
            <CardHeader>
              <CardTitle className="font-serif text-3xl">Weekly case load</CardTitle>
              <CardDescription>Visit rhythm from your actual case history.</CardDescription>
            </CardHeader>
            <CardContent className="h-[340px]">
              {hasWeeklyActivity ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyTrend}>
                    <defs>
                      <linearGradient id="visitsFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16a34a" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#16a34a" stopOpacity={0.08} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.14} />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="visits" stroke="#15803d" fill="url(#visitsFill)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-[1.75rem] border border-dashed border-emerald-200 bg-emerald-50/60 text-center text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  Save visits to start drawing your weekly trend.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="panel-pop border-none">
            <CardHeader>
              <CardTitle className="font-serif text-3xl">Top remedy hits</CardTitle>
              <CardDescription>
                {data.topRemediesSource === 'visits'
                  ? 'Most frequent repertory outcomes from saved visits.'
                  : 'Fallback network leaders from the imported local repertory library.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.topRemedies.map((remedy) => (
                <div key={remedy._id} className="soft-panel flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{remedy._id}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-300">Average grade {remedy.avgScore.toFixed(1)}</p>
                  </div>
                  <Badge variant="secondary">
                    {remedy.count} {data.topRemediesSource === 'visits' ? 'visits' : 'rubrics'}
                  </Badge>
                </div>
              ))}
              {data.topRemedies.length === 0 && (
                <div className="rounded-[1.5rem] border border-dashed border-emerald-200 bg-emerald-50/60 p-6 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  Remedy signals will appear here once visits or catalog fallbacks are available.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="panel-pop border-none">
            <CardHeader>
              <CardTitle className="font-serif text-3xl">Recent visits</CardTitle>
              <CardDescription>Jump straight into the patient case from the latest three visits.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.recentVisits.slice(0, 3).map((visit) => (
                <Link key={visit._id} href={`/patients/${visit.patientId?._id || ''}`}>
                  <div className="soft-panel p-5 transition dark:hover:bg-white/10">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{visit.patientId?.fullName || 'Patient visit'}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-300">{new Date(visit.visitDate).toLocaleDateString()}</p>
                      </div>
                      <Badge variant="outline">{visit.selectedRemedies?.[0]?.remedyName || 'Pending review'}</Badge>
                    </div>
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                      {(visit.symptoms || []).join(', ') || visit.assessment || 'No symptoms recorded yet.'}
                    </p>
                  </div>
                </Link>
              ))}
              {data.recentVisits.length === 0 && (
                <div className="rounded-[1.5rem] border border-dashed border-emerald-200 bg-emerald-50/60 p-6 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  Saved visits will land here as soon as you store the first repertorization.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <Card className="panel-pop border-none">
            <CardHeader>
              <CardTitle className="font-serif text-3xl">Upcoming appointments</CardTitle>
              <CardDescription>Tap any patient from here to open the full chart.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.upcomingAppointments.map((appointment) => (
                <Link key={appointment._id} href={`/patients/${appointment.patientId?._id || ''}`}>
                  <div className="soft-panel px-4 py-3 transition hover:bg-emerald-100/85 dark:hover:bg-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{appointment.title}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-300">
                          {appointment.patientId?.fullName || 'Patient'} - {new Date(appointment.startTime).toLocaleString()}
                        </p>
                      </div>
                      <Badge>{appointment.status}</Badge>
                    </div>
                  </div>
                </Link>
              ))}
              {data.upcomingAppointments.length === 0 && (
                <div className="rounded-[1.5rem] border border-dashed border-emerald-200 bg-emerald-50/60 p-6 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  No upcoming appointments are scheduled yet.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="panel-pop border-none">
            <CardHeader>
              <CardTitle className="font-serif text-3xl">Remedy library texture</CardTitle>
              <CardDescription>How rich each remedy entry is after local repertory and materia medica import.</CardDescription>
            </CardHeader>
            <CardContent className="h-[340px]">
              {data.remedyLibrary.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.remedyLibrary.map((remedy) => ({
                      name: remedy.name,
                      keynotes: remedy.keynotes?.length || 0,
                      modalities: remedy.modalities?.length || 0,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.14} />
                    <XAxis dataKey="name" interval={0} angle={-18} textAnchor="end" height={76} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="keynotes" fill="#16a34a" radius={[10, 10, 0, 0]} />
                    <Bar dataKey="modalities" fill="#84cc16" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-[1.75rem] border border-dashed border-emerald-200 bg-emerald-50/60 text-center text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  Remedy library metrics will appear here once remedy documents or local catalog samples are loaded.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="panel-pop flex flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div className="flex flex-wrap gap-3">
            <Link href="/homeopathy"><Button variant="outline" className="rounded-full border-emerald-200 bg-emerald-50/80 text-emerald-900 hover:bg-emerald-100 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100"><Activity className="mr-2 h-4 w-4" />Live repertory</Button></Link>
            <Link href="/patients"><Button variant="outline" className="rounded-full border-emerald-200 bg-emerald-50/80 text-emerald-900 hover:bg-emerald-100 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100"><Users className="mr-2 h-4 w-4" />Patients</Button></Link>
            <Link href="/visits"><Button variant="outline" className="rounded-full border-emerald-200 bg-emerald-50/80 text-emerald-900 hover:bg-emerald-100 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100"><FileText className="mr-2 h-4 w-4" />Visits</Button></Link>
          </div>
          <p className="text-sm uppercase tracking-[0.25em] text-slate-500 dark:text-slate-300">Designed and built by Shrujan</p>
        </div>
      </div>
    </div>
  )
}
