import mongoose, { InferSchemaType, Model, Schema, Types } from 'mongoose'

const DoctorSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    clinicName: { type: String, trim: true, default: 'Homeopathy Clinic' },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    phoneNumber: { type: String, trim: true, default: '' },
    medicalLicenseId: { type: String, required: true, unique: true, trim: true },
    specialty: { type: String, trim: true, default: 'Classical Homeopathy' },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true, collection: 'doctors' },
)

const PatientSchema = new Schema(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    fullName: { type: String, required: true, trim: true },
    gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'], required: true },
    age: { type: Number, required: true, min: 0, max: 150 },
    contactNumber: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, sparse: true },
    address: { type: String, trim: true },
    emergencyContact: { type: String, trim: true },
    bloodType: { type: String, trim: true },
    allergies: { type: String, trim: true },
    medicalHistory: { type: String, trim: true },
    chiefComplaint: { type: String, trim: true },
    thermalPreference: { type: String, trim: true },
    cravings: [{ type: String, trim: true }],
    emotionalSymptoms: [{ type: String, trim: true }],
    sleepPattern: { type: String, trim: true },
    modalities: [{ type: String, trim: true }],
    aggravations: [{ type: String, trim: true }],
    ameliorations: [{ type: String, trim: true }],
    currentSymptoms: [{ type: String, trim: true }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'patients' },
)

PatientSchema.index({ doctorId: 1, fullName: 'text', email: 'text', currentSymptoms: 'text' })

const VisitSchema = new Schema(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    visitDate: { type: Date, default: Date.now },
    symptoms: [{ type: String, trim: true }],
    observations: { type: String, trim: true },
    assessment: { type: String, trim: true },
    notes: { type: String, trim: true },
    followUpDate: { type: Date },
    selectedRemedies: [
      {
        remedyId: { type: Schema.Types.ObjectId, ref: 'Remedy' },
        remedyName: { type: String, required: true },
        score: { type: Number, required: true },
        potency: { type: String, trim: true },
        dosage: { type: String, trim: true },
        instructions: { type: String, trim: true },
      },
    ],
  },
  { timestamps: true, collection: 'visits' },
)

const RemedySchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    source: [{ type: String, trim: true }],
    description: { type: String, required: true, trim: true },
    potencies: [{ type: String, trim: true }],
    defaultPotency: { type: String, trim: true },
    dosage: { type: String, required: true, trim: true },
    keynotes: [{ type: String, trim: true }],
    modalities: [{ type: String, trim: true }],
    aggravations: [{ type: String, trim: true }],
    ameliorations: [{ type: String, trim: true }],
    complementaryRemedies: [{ type: String, trim: true }],
    antidotes: [{ type: String, trim: true }],
    recoveryEstimate: { type: String, trim: true },
    cravings: [{ type: String, trim: true }],
    emotionalSymptoms: [{ type: String, trim: true }],
    thermalPreference: { type: String, trim: true },
    sleepPattern: { type: String, trim: true },
    searchTerms: [{ type: String, trim: true }],
  },
  { timestamps: true, collection: 'remedies' },
)

RemedySchema.index({ name: 'text', keynotes: 'text', searchTerms: 'text', description: 'text' })

const RepertoryRubricSchema = new Schema(
  {
    rubric: { type: String, required: true, trim: true },
    chapter: { type: String, required: true, trim: true },
    source: { type: String, required: true, trim: true },
    keywords: [{ type: String, trim: true }],
    modalities: [{ type: String, trim: true }],
    remedies: [
      {
        remedyId: { type: Schema.Types.ObjectId, ref: 'Remedy' },
        remedyName: { type: String, required: true },
        grade: { type: Number, required: true, min: 1, max: 4 },
      },
    ],
  },
  { timestamps: true, collection: 'repertoryRubrics' },
)

RepertoryRubricSchema.index({ rubric: 'text', chapter: 'text', keywords: 'text', modalities: 'text' })

const AppointmentSchema = new Schema(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: { type: String, default: 'SCHEDULED' },
    type: { type: String, default: 'FOLLOW_UP' },
  },
  { timestamps: true, collection: 'appointments' },
)

const FollowUpSchema = new Schema(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    visitId: { type: Schema.Types.ObjectId, ref: 'Visit' },
    dueDate: { type: Date, required: true },
    status: { type: String, default: 'PENDING' },
    summary: { type: String, trim: true },
    responseNotes: { type: String, trim: true },
  },
  { timestamps: true, collection: 'followUps' },
)

const NoteSchema = new Schema(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    visitId: { type: Schema.Types.ObjectId, ref: 'Visit' },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    category: { type: String, default: 'clinical', trim: true },
  },
  { timestamps: true, collection: 'notes' },
)

function getModel<T>(name: string, schema: Schema<T>) {
  return (mongoose.models[name] as Model<T>) || mongoose.model<T>(name, schema)
}

export const Doctor = getModel('Doctor', DoctorSchema)
export const Patient = getModel('Patient', PatientSchema)
export const Visit = getModel('Visit', VisitSchema)
export const Remedy = getModel('Remedy', RemedySchema)
export const RepertoryRubric = getModel('RepertoryRubric', RepertoryRubricSchema)
export const Appointment = getModel('Appointment', AppointmentSchema)
export const FollowUp = getModel('FollowUp', FollowUpSchema)
export const Note = getModel('Note', NoteSchema)

export type DoctorDocument = InferSchemaType<typeof DoctorSchema> & { _id: Types.ObjectId }
export type PatientDocument = InferSchemaType<typeof PatientSchema> & { _id: Types.ObjectId }
export type VisitDocument = InferSchemaType<typeof VisitSchema> & { _id: Types.ObjectId }
export type RemedyDocument = InferSchemaType<typeof RemedySchema> & { _id: Types.ObjectId }
export type RepertoryRubricDocument = InferSchemaType<typeof RepertoryRubricSchema> & { _id: Types.ObjectId }
