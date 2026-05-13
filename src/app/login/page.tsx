"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { GoogleLogo } from '@/components/google-logo'
import { ClinicLogo } from '@/components/clinic-logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

type LoginFormData = z.infer<typeof loginSchema>

const GOOGLE_ERROR_MAP: Record<string, string> = {
  'google-not-configured': 'Google sign-in is not configured yet. Add Google OAuth credentials in your local environment first.',
  'google-state': 'The Google sign-in session expired. Please try again.',
  'google-auth-failed': 'Google sign-in could not be completed. Please try again.',
}

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [googleError, setGoogleError] = useState('')

  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get('error') || ''
    setGoogleError(GOOGLE_ERROR_MAP[key] || '')
  }, [])

  const { register, handleSubmit } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError('')
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await response.json()
      if (result.success) {
        router.push('/dashboard')
        return
      }
      setError(result.message || 'Unable to sign in.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="page-shell flex min-h-screen items-center justify-center p-6">
      <div className="relative grid w-full max-w-6xl gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="hero-orb left-0 top-6 h-48 w-48" />
        <div className="hero-orb bottom-8 right-12 h-56 w-56" />

        <Card className="panel-pop hidden border-none overflow-hidden lg:block">
          <CardContent className="relative flex h-full flex-col justify-between p-10">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <ClinicLogo size={48} priority className="h-12 w-12 rounded-[1.2rem] object-cover shadow-lg" />
                <div>
                  <p className="section-kicker">Shruty Health Clinic</p>
                  <p className="text-sm text-slate-500 dark:text-slate-300">Fast clinic access</p>
                </div>
              </div>
              <h1 className="max-w-xl text-6xl font-semibold leading-[1.02] text-slate-900 dark:text-white">
                Minimal clinic software that still feels alive.
              </h1>
              <p className="max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                Move from sign-in to repertory, patient intake, and saved visits in a clean local-first workspace built for speed.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {[
                'AI-ready clinical summaries',
                'Google account linking ready',
                'Repertory + remedy intelligence',
                'Fast case record workflow',
              ].map((item) => (
                <div key={item} className="soft-panel p-4 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="w-full max-w-xl justify-self-center space-y-5">
          <div className="flex justify-end">
            <ThemeToggle />
          </div>

          <Card className="panel-pop border-none overflow-hidden">
            <CardContent className="p-8 md:p-10">
              <div className="mb-8 space-y-5 text-center">
                <ClinicLogo size={64} priority className="mx-auto h-16 w-16 rounded-[1.6rem] object-cover shadow-lg" />
                <div>
                  <p className="section-kicker">Shruty Health Clinic</p>
                  <h2 className="mt-3 text-[2.6rem] font-semibold tracking-[-0.04em] text-slate-900 dark:text-white">Welcome back</h2>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-600 dark:text-slate-300">
                    Sign in with email and password, or connect your Google account directly.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-4 h-4 w-4 text-slate-400" />
                    <Input id="email" type="email" className="input-shell pl-11" placeholder="doctor@clinic.com" {...register('email')} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <LockKeyhole className="absolute left-4 top-4 h-4 w-4 text-slate-400" />
                    <Input id="password" type={showPassword ? 'text' : 'password'} className="input-shell pl-11 pr-11" placeholder="Enter your password" {...register('password')} />
                    <button
                      type="button"
                      className="absolute right-4 top-3.5 text-slate-400"
                      onClick={() => setShowPassword((current) => !current)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {(error || googleError) && (
                  <div className="rounded-[1.4rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error || googleError}
                  </div>
                )}

                <Button type="submit" disabled={isLoading} className="h-12 w-full rounded-2xl bg-emerald-700 text-white hover:bg-emerald-800">
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </Button>
              </form>

              <div className="my-7 flex items-center gap-4">
                <div className="h-px flex-1 bg-emerald-100" />
                <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Or</span>
                <div className="h-px flex-1 bg-emerald-100" />
              </div>

              <Link href="/api/auth/google/start?mode=login">
                <Button variant="outline" className="h-12 w-full justify-center gap-3 rounded-2xl border-emerald-700 bg-emerald-700 text-white shadow-sm hover:bg-emerald-800 hover:text-white">
                  <GoogleLogo />
                  Continue with Google
                </Button>
              </Link>

              <div className="mt-7 text-center text-sm text-slate-600 dark:text-slate-300">
                New here?{' '}
                <Link href="/register" className="font-semibold text-emerald-700 dark:text-emerald-300">
                  Register here
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
