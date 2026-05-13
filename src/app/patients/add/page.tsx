"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

const patientSchema = z.object({
  fullName: z.string().min(2),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  age: z.number().min(0).max(150),
  contactNumber: z.string().min(10),
  address: z.string().optional(),
  consultationFeeInr: z.preprocess(
    (value) => (typeof value === 'number' && Number.isNaN(value) ? undefined : value),
    z.number().min(0).max(1_000_000).optional(),
  ),
  bloodType: z.string().optional(),
  allergies: z.string().optional(),
  medicalHistory: z.string().optional(),
  chiefComplaint: z.string().optional(),
  thermalPreference: z.string().optional(),
  sleepPattern: z.string().optional(),
  currentSymptoms: z.string().optional(),
  cravings: z.string().optional(),
  emotionalSymptoms: z.string().optional(),
  aggravations: z.string().optional(),
  ameliorations: z.string().optional(),
})

type PatientFormData = z.infer<typeof patientSchema>

export default function AddPatientPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: { gender: 'OTHER' },
  })

  const onSubmit = async (data: PatientFormData) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          consultationFeeInr: Number.isFinite(data.consultationFeeInr) ? data.consultationFeeInr : undefined,
          currentSymptoms: data.currentSymptoms?.split(',').map((item) => item.trim()).filter(Boolean) || [],
          cravings: data.cravings?.split(',').map((item) => item.trim()).filter(Boolean) || [],
          emotionalSymptoms: data.emotionalSymptoms?.split(',').map((item) => item.trim()).filter(Boolean) || [],
          aggravations: data.aggravations?.split(',').map((item) => item.trim()).filter(Boolean) || [],
          ameliorations: data.ameliorations?.split(',').map((item) => item.trim()).filter(Boolean) || [],
          modalities: [],
        }),
      })

      const result = await response.json()
      if (result.success) {
        router.push(`/patients/${result.data.id}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="page-shell p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="panel-pop pop-in space-y-4 p-6">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-sm font-medium text-emerald-800 shadow-sm hover:bg-emerald-50">
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>
            <p className="section-kicker mt-5">Shruty Health Clinic</p>
            <h1 className="mt-3 font-serif text-4xl text-slate-900 dark:text-white">Add a homeopathic case record</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">
              Capture clinical details, generals, and the symptom picture needed for repertory matching.
            </p>
            <p className="mt-3 text-xs uppercase tracking-[0.24em] text-slate-500">Designed by Shrujan</p>
          </div>
        </div>

        <Card className="panel-pop border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-5 w-5 text-emerald-600" />
              Patient intake
            </CardTitle>
            <CardDescription>
              These fields feed patient history, remedy matching, printable prescriptions, and visit revenue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input id="fullName" className="h-12 rounded-2xl" {...register('fullName')} />
                  {errors.fullName && <p className="text-sm text-red-500">Full name is required.</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactNumber">Contact number</Label>
                  <Input id="contactNumber" className="h-12 rounded-2xl" {...register('contactNumber')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" type="number" className="h-12 rounded-2xl" {...register('age', { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select onValueChange={(value) => setValue('gender', value as PatientFormData['gender'])} defaultValue="OTHER">
                    <SelectTrigger className="h-12 rounded-2xl">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bloodType">Blood type</Label>
                  <Input id="bloodType" className="h-12 rounded-2xl" {...register('bloodType')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="consultationFeeInr">Consultation fee (INR)</Label>
                  <Input id="consultationFeeInr" type="number" className="h-12 rounded-2xl" {...register('consultationFeeInr', { valueAsNumber: true })} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" className="h-12 rounded-2xl" {...register('address')} />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="chiefComplaint">Chief complaint</Label>
                  <Textarea id="chiefComplaint" rows={2} {...register('chiefComplaint')} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="currentSymptoms">Current symptoms</Label>
                  <Textarea
                    id="currentSymptoms"
                    rows={3}
                    placeholder="Comma separated, for example dry cough, thirst, worse at night"
                    {...register('currentSymptoms')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="thermalPreference">Thermal preference</Label>
                  <Input id="thermalPreference" {...register('thermalPreference')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sleepPattern">Sleep pattern</Label>
                  <Input id="sleepPattern" {...register('sleepPattern')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cravings">Cravings</Label>
                  <Input id="cravings" placeholder="Cold water, sweets..." {...register('cravings')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emotionalSymptoms">Emotional symptoms</Label>
                  <Input id="emotionalSymptoms" placeholder="Anxiety, irritability..." {...register('emotionalSymptoms')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aggravations">Aggravations</Label>
                  <Input id="aggravations" placeholder="Night, motion..." {...register('aggravations')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ameliorations">Ameliorations</Label>
                  <Input id="ameliorations" placeholder="Rest, cool room..." {...register('ameliorations')} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="allergies">Allergies</Label>
                  <Textarea id="allergies" rows={2} {...register('allergies')} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="medicalHistory">Medical history</Label>
                  <Textarea id="medicalHistory" rows={4} {...register('medicalHistory')} />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-white/20 pt-6">
                <Link href="/dashboard">
                  <Button variant="outline" type="button">Cancel</Button>
                </Link>
                <Button type="submit" disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? 'Saving...' : 'Save patient'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
