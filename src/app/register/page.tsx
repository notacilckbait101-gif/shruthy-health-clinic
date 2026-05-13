"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react'
import { GoogleLogo } from '@/components/google-logo'
import { ClinicLogo } from '@/components/clinic-logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type RegisterFormData = z.infer<typeof registerSchema>

const GOOGLE_ERROR_MAP: Record<string, string> = {
  'google-not-configured': 'Google sign-up is not configured yet. Add Google OAuth credentials in your local environment first.',
}

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [googleError, setGoogleError] = useState('')

  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get('error') || ''
    setGoogleError(GOOGLE_ERROR_MAP[key] || '')
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: data.fullName,
          email: data.email,
          password: data.password,
          confirmPassword: data.confirmPassword,
          clinicName: 'Shruty Health Clinic',
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Registration successful! Opening your dashboard.')
        router.push('/dashboard')
      } else {
        setError(result.message || 'Registration failed')
        toast.error(result.message || 'Registration failed')
      }
    } catch (submissionError) {
      console.error('Registration error:', submissionError)
      setError('An unexpected error occurred')
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="page-shell flex min-h-screen items-center justify-center p-6">
      <div className="relative grid w-full max-w-6xl gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="hero-orb right-0 top-8 h-52 w-52" />
        <div className="hero-orb bottom-10 left-10 h-44 w-44" />
        <div className="w-full max-w-xl justify-self-center space-y-5 lg:order-2">
          <div className="flex justify-end">
            <ThemeToggle />
          </div>

          <Card className="panel-pop border-none overflow-hidden">
            <CardContent className="p-8 md:p-10">
              <div className="mb-8 space-y-5 text-center">
                <ClinicLogo size={64} priority className="mx-auto h-16 w-16 rounded-[1.6rem] object-cover shadow-lg" />
                <div>
                  <p className="section-kicker">Shruty Health Clinic</p>
                  <h1 className="mt-3 text-[2.5rem] font-semibold tracking-[-0.04em] text-slate-900 dark:text-white">Create your clinic access</h1>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-600 dark:text-slate-300">
                    Register with email, or link your Google account and let the clinic profile fill itself in.
                  </p>
                </div>
              </div>

              <Link href="/api/auth/google/start?mode=register">
                <Button variant="outline" className="h-12 w-full justify-center gap-3 rounded-2xl border-emerald-700 bg-emerald-700 text-white shadow-sm hover:bg-emerald-800 hover:text-white">
                  <GoogleLogo />
                  Continue with Google
                </Button>
              </Link>

              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-emerald-100" />
                <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Or</span>
                <div className="h-px flex-1 bg-emerald-100" />
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {(error || googleError) && (
                  <div className="rounded-[1.4rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error || googleError}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-4 h-4 w-4 text-slate-400" />
                    <Input id="fullName" type="text" placeholder="Doctor name" className="input-shell pl-11" {...register('fullName')} />
                  </div>
                  {errors.fullName && <p className="text-sm text-red-500">{errors.fullName.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-4 h-4 w-4 text-slate-400" />
                    <Input id="email" type="email" placeholder="doctor@clinic.com" className="input-shell pl-11" {...register('email')} />
                  </div>
                  {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-4 h-4 w-4 text-slate-400" />
                      <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Create password" className="input-shell pl-11 pr-11" {...register('password')} />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="absolute right-4 top-3.5 text-slate-400"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-4 h-4 w-4 text-slate-400" />
                      <Input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="Repeat password" className="input-shell pl-11 pr-11" {...register('confirmPassword')} />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((current) => !current)}
                        className="absolute right-4 top-3.5 text-slate-400"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>}
                  </div>
                </div>

                <Button type="submit" className="h-12 w-full rounded-2xl bg-emerald-700 text-white hover:bg-emerald-800" disabled={isLoading}>
                  {isLoading ? 'Creating account...' : 'Create account'}
                </Button>
              </form>

              <div className="mt-7 text-center text-sm text-slate-600 dark:text-slate-300">
                Already have an account?{' '}
                <Link href="/login" className="font-semibold text-emerald-700 dark:text-emerald-300">
                  Sign in here
                </Link>
              </div>

            </CardContent>
          </Card>
        </div>

        <Card className="panel-pop hidden overflow-hidden border-none lg:block lg:order-1">
          <CardContent className="flex h-full flex-col justify-between p-10">
            <div className="space-y-6">
              <div>
                <span className="pill-pop">Register the clinic workspace</span>
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-300">Secure local onboarding</p>
              </div>
              <h2 className="max-w-xl text-6xl font-semibold leading-[1.02] text-slate-900 dark:text-white">
                Build a doctor profile that feels premium from the first screen.
              </h2>
              <p className="max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                Email sign-up stays fast, and Google sign-in can bring in the doctor name and profile image automatically once OAuth credentials are configured.
              </p>
            </div>

            <div className="grid gap-4">
              {[
                'Clinic heading locked to Shruty Health Clinic',
                'Doctor identity and fast sign-in',
                'Fallback clinic avatar for local-only accounts',
                'Google sign-in and email sign-up on one screen',
              ].map((item) => (
                <div key={item} className="soft-panel p-4 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
