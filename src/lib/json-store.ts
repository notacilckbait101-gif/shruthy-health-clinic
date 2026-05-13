import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { normalizeOptionalString } from '@/lib/db-utils'

export type JsonDoctor = {
  _id: string
  fullName: string
  clinicName: string
  email: string
  password: string
  avatarUrl?: string
  authProvider: 'local' | 'google'
  providerAccountId?: string
  phoneNumber: string
  medicalLicenseId: string
  specialty: string
  isActive: boolean
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}

export type JsonPatient = {
  _id: string
  doctorId: string
  fullName: string
  gender: 'MALE' | 'FEMALE' | 'OTHER'
  age: number
  contactNumber: string
  address?: string
  consultationFeeInr?: number
  bloodType?: string
  allergies?: string
  medicalHistory?: string
  chiefComplaint?: string
  thermalPreference?: string
  cravings: string[]
  emotionalSymptoms: string[]
  sleepPattern?: string
  modalities: string[]
  aggravations: string[]
  ameliorations: string[]
  currentSymptoms: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type JsonVisit = {
  _id: string
  doctorId: string
  patientId: string
  visitDate: string
  symptoms: string[]
  observations?: string
  assessment?: string
  notes?: string
  followUpDate?: string
  billedAmountInr?: number
  selectedRemedies: Array<{
    remedyName: string
    score: number
    potency?: string
    dosage?: string
    instructions?: string
  }>
  createdAt: string
  updatedAt: string
}

type JsonAppointment = {
  _id: string
  doctorId: string
  patientId: string
  title: string
  description?: string
  startTime: string
  endTime: string
  status: string
  type: string
  createdAt: string
  updatedAt: string
}

type JsonFollowUp = {
  _id: string
  doctorId: string
  patientId: string
  visitId?: string
  dueDate: string
  status: string
  summary?: string
  responseNotes?: string
  createdAt: string
  updatedAt: string
}

type JsonNote = {
  _id: string
  doctorId: string
  patientId: string
  visitId?: string
  title: string
  content: string
  category: string
  createdAt: string
  updatedAt: string
}

type JsonDatabase = {
  doctors: JsonDoctor[]
  patients: JsonPatient[]
  visits: JsonVisit[]
  appointments: JsonAppointment[]
  followUps: JsonFollowUp[]
  notes: JsonNote[]
}

const STORE_PATH = path.join(process.cwd(), 'data', 'clinic-store.json')

declare global {
  var __mongoAvailability: { ok: boolean; checkedAt: number } | undefined
  var __jsonStoreCache: { mtimeMs: number; db: JsonDatabase } | undefined
}

function ensureStore() {
  const dir = path.dirname(STORE_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(STORE_PATH)) {
    const initial: JsonDatabase = {
      doctors: [],
      patients: [],
      visits: [],
      appointments: [],
      followUps: [],
      notes: [],
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2))
  }
}

function readStore(): JsonDatabase {
  ensureStore()
  const stats = fs.statSync(STORE_PATH)
  if (global.__jsonStoreCache && global.__jsonStoreCache.mtimeMs === stats.mtimeMs) {
    return global.__jsonStoreCache.db
  }

  const db = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8')) as JsonDatabase
  global.__jsonStoreCache = {
    mtimeMs: stats.mtimeMs,
    db,
  }
  return db
}

function writeStore(db: JsonDatabase) {
  ensureStore()
  fs.writeFileSync(STORE_PATH, JSON.stringify(db, null, 2))
  const stats = fs.statSync(STORE_PATH)
  global.__jsonStoreCache = {
    mtimeMs: stats.mtimeMs,
    db,
  }
}

function nowIso() {
  return new Date().toISOString()
}

function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`
}

export async function canUseMongo() {
  global.__mongoAvailability = { ok: false, checkedAt: Date.now() }
  return false
}

export function findJsonDoctorById(id: string) {
  const db = readStore()
  return db.doctors.find((doctor) => doctor._id === id && doctor.isActive) || null
}

export function findJsonDoctorByEmail(email: string) {
  const db = readStore()
  return db.doctors.find((doctor) => doctor.email === email.toLowerCase()) || null
}

export function findJsonDoctorByProviderAccountId(providerAccountId: string) {
  const db = readStore()
  return db.doctors.find((doctor) => doctor.providerAccountId === providerAccountId && doctor.isActive) || null
}

export function createJsonDoctor(input: {
  fullName: string
  clinicName?: string
  email: string
  password: string
  phoneNumber?: string
  avatarUrl?: string
  authProvider?: 'local' | 'google'
  providerAccountId?: string
}) {
  const db = readStore()
  const timestamp = nowIso()
  const doctor: JsonDoctor = {
    _id: createId('doctor'),
    fullName: input.fullName,
    clinicName: input.clinicName || 'Shruty Health Clinic',
    email: input.email.toLowerCase(),
    password: input.password,
    avatarUrl: normalizeOptionalString(input.avatarUrl),
    authProvider: input.authProvider || 'local',
    providerAccountId: normalizeOptionalString(input.providerAccountId),
    phoneNumber: input.phoneNumber || '',
    medicalLicenseId: `HOM-${Date.now()}`,
    specialty: 'Classical Homeopathy',
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  db.doctors.push(doctor)
  writeStore(db)
  return doctor
}

export function updateJsonDoctorProfile(
  id: string,
  patch: Partial<Pick<JsonDoctor, 'fullName' | 'email' | 'avatarUrl' | 'clinicName' | 'providerAccountId' | 'authProvider'>>,
) {
  const db = readStore()
  const doctor = db.doctors.find((item) => item._id === id)
  if (!doctor) return null

  Object.assign(doctor, {
    ...patch,
    email: patch.email ? patch.email.toLowerCase() : doctor.email,
    avatarUrl: normalizeOptionalString(patch.avatarUrl) ?? doctor.avatarUrl,
    clinicName: normalizeOptionalString(patch.clinicName) ?? doctor.clinicName,
    providerAccountId: normalizeOptionalString(patch.providerAccountId) ?? doctor.providerAccountId,
    updatedAt: nowIso(),
  })

  writeStore(db)
  return doctor
}

export function updateJsonDoctorLastLogin(id: string) {
  const db = readStore()
  const doctor = db.doctors.find((item) => item._id === id)
  if (!doctor) return null
  doctor.lastLoginAt = nowIso()
  doctor.updatedAt = nowIso()
  writeStore(db)
  return doctor
}

export function listJsonPatients(options: {
  doctorId: string
  page: number
  limit: number
  search?: string
  gender?: string | null
  startDate?: string | null
  endDate?: string | null
}) {
  const db = readStore()
  const search = options.search?.trim().toLowerCase()
  let patients = db.patients.filter((patient) => patient.doctorId === options.doctorId && patient.isActive)

  if (search) {
    patients = patients.filter((patient) =>
      [
        patient.fullName,
        patient.contactNumber,
        ...(patient.currentSymptoms || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(search),
    )
  }

  if (options.gender) {
    patients = patients.filter((patient) => patient.gender === options.gender)
  }

  if (options.startDate) {
    patients = patients.filter((patient) => new Date(patient.createdAt) >= new Date(options.startDate!))
  }

  if (options.endDate) {
    patients = patients.filter((patient) => new Date(patient.createdAt) <= new Date(options.endDate!))
  }

  patients.sort((left, right) => right.createdAt.localeCompare(left.createdAt))
  const total = patients.length
  const start = (options.page - 1) * options.limit
  const pageItems = patients.slice(start, start + options.limit)

  const latestVisitByPatient = new Map<string, JsonVisit>()
  db.visits
    .filter((visit) => visit.doctorId === options.doctorId)
    .sort((left, right) => right.visitDate.localeCompare(left.visitDate))
    .forEach((visit) => {
      if (!latestVisitByPatient.has(visit.patientId)) {
        latestVisitByPatient.set(visit.patientId, visit)
      }
    })

  return {
    total,
    patients: pageItems.map((patient) => ({
      ...patient,
      id: patient._id,
      latestVisit: latestVisitByPatient.get(patient._id) || null,
    })),
  }
}

export function createJsonPatient(input: Omit<JsonPatient, '_id' | 'createdAt' | 'updatedAt' | 'isActive'>) {
  const db = readStore()
  const timestamp = nowIso()
  const patient: JsonPatient = {
    ...input,
    _id: createId('patient'),
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  db.patients.push(patient)
  writeStore(db)
  return patient
}

export function getJsonPatientDetail(id: string, doctorId: string) {
  const db = readStore()
  const patient = db.patients.find((item) => item._id === id && item.doctorId === doctorId)
  if (!patient) return null

  return {
    ...patient,
    id: patient._id,
    visits: db.visits.filter((visit) => visit.patientId === patient._id).sort((a, b) => b.visitDate.localeCompare(a.visitDate)),
    appointments: db.appointments.filter((appointment) => appointment.patientId === patient._id).sort((a, b) => a.startTime.localeCompare(b.startTime)),
    followUps: db.followUps.filter((followUp) => followUp.patientId === patient._id).sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    notes: db.notes.filter((note) => note.patientId === patient._id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  }
}

export function updateJsonPatient(id: string, doctorId: string, patch: Partial<JsonPatient>) {
  const db = readStore()
  const patient = db.patients.find((item) => item._id === id && item.doctorId === doctorId)
  if (!patient) return null
  Object.assign(patient, patch, { updatedAt: nowIso() })
  writeStore(db)
  return patient
}

export function deactivateJsonPatient(id: string, doctorId: string) {
  return updateJsonPatient(id, doctorId, { isActive: false })
}

export function createJsonVisit(input: Omit<JsonVisit, '_id' | 'createdAt' | 'updatedAt'>) {
  const db = readStore()
  const timestamp = nowIso()
  const visit: JsonVisit = {
    ...input,
    _id: createId('visit'),
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  db.visits.push(visit)

  const patient = db.patients.find((item) => item._id === input.patientId)
  if (patient) {
    patient.currentSymptoms = input.symptoms
    patient.updatedAt = timestamp
  }

  writeStore(db)
  return visit
}

export function listJsonVisits(doctorId: string, limit: number) {
  const db = readStore()
  const patientsById = new Map(db.patients.map((patient) => [patient._id, patient]))
  return db.visits
    .filter((visit) => visit.doctorId === doctorId)
    .sort((left, right) => right.visitDate.localeCompare(left.visitDate))
    .slice(0, limit)
    .map((visit) => ({
      ...visit,
      patientId: patientsById.get(visit.patientId)
        ? {
            _id: visit.patientId,
            fullName: patientsById.get(visit.patientId)?.fullName,
            age: patientsById.get(visit.patientId)?.age,
            gender: patientsById.get(visit.patientId)?.gender,
            chiefComplaint: patientsById.get(visit.patientId)?.chiefComplaint,
          }
        : null,
    }))
}

export function getJsonDashboardSummary(doctorId: string) {
  const db = readStore()
  const patients = db.patients.filter((patient) => patient.doctorId === doctorId && patient.isActive)
  const visits = db.visits.filter((visit) => visit.doctorId === doctorId)
  const appointments = db.appointments.filter((appointment) => appointment.doctorId === doctorId)
  const followUps = db.followUps.filter((followUp) => followUp.doctorId === doctorId)
  const patientsById = new Map(patients.map((patient) => [patient._id, patient]))

  const topRemedyMap = new Map<string, { _id: string; count: number; avgScore: number }>()
  visits.forEach((visit) => {
    visit.selectedRemedies.forEach((remedy) => {
      const current = topRemedyMap.get(remedy.remedyName) || { _id: remedy.remedyName, count: 0, avgScore: 0 }
      const nextCount = current.count + 1
      current.avgScore = (current.avgScore * current.count + remedy.score) / nextCount
      current.count = nextCount
      topRemedyMap.set(remedy.remedyName, current)
    })
  })

  const monthlyRevenueMap = new Map<string, number>()
  visits.forEach((visit) => {
    const visitDate = new Date(visit.visitDate)
    if (Number.isNaN(visitDate.getTime())) return
    const monthKey = `${visitDate.getFullYear()}-${String(visitDate.getMonth() + 1).padStart(2, '0')}`
    monthlyRevenueMap.set(monthKey, (monthlyRevenueMap.get(monthKey) || 0) + (visit.billedAmountInr || 0))
  })

  const monthlyRevenue = Array.from(monthlyRevenueMap.entries())
    .sort((left, right) => left[0].localeCompare(right[0]))
    .slice(-6)
    .map(([month, amount]) => ({
      month,
      amount,
    }))

  const currentMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  const currentMonthRevenue = monthlyRevenueMap.get(currentMonthKey) || 0

  return {
    totalPatients: patients.length,
    totalVisits: visits.length,
    pendingFollowUps: followUps.filter((item) => item.status === 'PENDING').length,
    currentMonthRevenue,
    monthlyRevenue,
    upcomingAppointments: appointments
      .filter((item) => new Date(item.startTime) >= new Date())
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .slice(0, 5)
      .map((item) => ({
        ...item,
        patientId: patientsById.get(item.patientId)
          ? { _id: item.patientId, fullName: patientsById.get(item.patientId)?.fullName }
          : null,
      })),
    recentVisits: visits
      .sort((a, b) => b.visitDate.localeCompare(a.visitDate))
      .slice(0, 6)
      .map((visit) => ({
        ...visit,
        patientId: patientsById.get(visit.patientId)
          ? { _id: visit.patientId, fullName: patientsById.get(visit.patientId)?.fullName }
          : null,
      })),
    weeklyVisits: visits.filter((visit) => new Date(visit.visitDate).getTime() >= Date.now() - 7 * 24 * 60 * 60 * 1000),
    topRemedies: Array.from(topRemedyMap.values())
      .sort((a, b) => (b.count - a.count) || (b.avgScore - a.avgScore))
      .slice(0, 5),
  }
}

export function normalizePatientPayload<T extends {
  address?: string | null
  consultationFeeInr?: number | null
  bloodType?: string | null
  allergies?: string | null
  medicalHistory?: string | null
  chiefComplaint?: string | null
  thermalPreference?: string | null
  sleepPattern?: string | null
}>(payload: T) {
  return {
    ...payload,
    address: normalizeOptionalString(payload.address),
    consultationFeeInr: typeof payload.consultationFeeInr === 'number' && Number.isFinite(payload.consultationFeeInr)
      ? payload.consultationFeeInr
      : undefined,
    bloodType: normalizeOptionalString(payload.bloodType),
    allergies: normalizeOptionalString(payload.allergies),
    medicalHistory: normalizeOptionalString(payload.medicalHistory),
    chiefComplaint: normalizeOptionalString(payload.chiefComplaint),
    thermalPreference: normalizeOptionalString(payload.thermalPreference),
    sleepPattern: normalizeOptionalString(payload.sleepPattern),
  }
}

export function getJsonStorePath() {
  return STORE_PATH
}
