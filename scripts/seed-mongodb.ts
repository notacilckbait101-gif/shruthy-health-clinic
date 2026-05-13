import bcrypt from 'bcryptjs'
import { homeopathyRemedies, repertoryRubrics } from '../src/data/homeopathy'
import { toSlug } from '../src/lib/db-utils'
import { connectToDatabase } from '../src/lib/mongoose'
import {
  Appointment,
  Doctor,
  FollowUp,
  Note,
  Patient,
  Remedy,
  RepertoryRubric,
  Visit,
} from '../src/lib/models'

async function seed() {
  await connectToDatabase()

  await Promise.all([
    Appointment.deleteMany({}),
    FollowUp.deleteMany({}),
    Note.deleteMany({}),
    Visit.deleteMany({}),
    Patient.deleteMany({}),
    RepertoryRubric.deleteMany({}),
    Remedy.deleteMany({}),
    Doctor.deleteMany({}),
  ])

  const doctor = await Doctor.create({
    fullName: 'Dr. Kavya Sharma',
    clinicName: 'Aarogya Homeopathy Centre',
    email: 'doctor@clinic.com',
    password: await bcrypt.hash('doctor123', 12),
    phoneNumber: '+91 9876543210',
    medicalLicenseId: 'HOM-IND-2026-001',
    specialty: 'Classical Homeopathy',
  })

  const remedies = await Remedy.insertMany(
    homeopathyRemedies.map((remedy) => ({
      ...remedy,
      slug: toSlug(remedy.name),
    })),
  )

  const remedyIdByName = new Map(remedies.map((remedy) => [remedy.name, remedy._id]))

  await RepertoryRubric.insertMany(
    repertoryRubrics.map((rubric) => ({
      ...rubric,
      remedies: rubric.remedies.map((entry) => ({
        ...entry,
        remedyId: remedyIdByName.get(entry.remedyName),
      })),
    })),
  )

  const patient = await Patient.create({
    doctorId: doctor._id,
    fullName: 'Rohan Mehta',
    gender: 'MALE',
    age: 34,
    contactNumber: '+91 9988776655',
    address: 'Bengaluru',
    chiefComplaint: 'Dry cough worse at night',
    currentSymptoms: ['dry cough', 'thirst', 'worse at night'],
    thermalPreference: 'Wants cool air',
    cravings: ['Cold water'],
    emotionalSymptoms: ['Irritable when questioned'],
    sleepPattern: 'Interrupted after midnight',
    modalities: ['Dry cough', 'Night aggravation'],
    aggravations: ['Night', 'Motion'],
    ameliorations: ['Rest', 'Cool room'],
    medicalHistory: 'Recurrent seasonal cough episodes.',
  })

  const visit = await Visit.create({
    doctorId: doctor._id,
    patientId: patient._id,
    symptoms: ['dry cough', 'thirst', 'worse at night'],
    observations: 'Dry mucous membranes and chest discomfort on motion.',
    assessment: 'Acute respiratory case under repertory evaluation.',
    notes: 'Rule-based repertory shortlist reviewed with patient.',
    selectedRemedies: ['Bryonia Alba', 'Phosphorus', 'Drosera'].map((name, index) => {
      const remedy = remedies.find((entry) => entry.name === name)
      return {
        remedyId: remedy?._id,
        remedyName: name,
        score: [9, 7, 5][index],
        potency: remedy?.defaultPotency || '30C',
        dosage: remedy?.dosage || 'Use as advised by physician.',
        instructions: 'Review in 3 days or sooner if symptoms worsen.',
      }
    }),
    followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  })

  await Appointment.create({
    doctorId: doctor._id,
    patientId: patient._id,
    title: 'Follow-up review',
    description: 'Assess cough, sleep, and response to remedy.',
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
    status: 'CONFIRMED',
    type: 'FOLLOW_UP',
  })

  await FollowUp.create({
    doctorId: doctor._id,
    patientId: patient._id,
    visitId: visit._id,
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    summary: 'Track cough frequency, thirst, and midnight aggravation.',
  })

  await Note.create({
    doctorId: doctor._id,
    patientId: patient._id,
    visitId: visit._id,
    title: 'Initial repertory summary',
    content:
      'Bryonia Alba covered dry cough, thirst, and night aggravation most strongly. Phosphorus and Drosera remained close differentials.',
    category: 'repertory',
  })

  console.log('MongoDB seed complete')
  console.log('Doctor login:', doctor.email)
  console.log('Password: doctor123')
}

seed()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    process.exit(0)
  })
