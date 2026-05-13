type RemedyReferenceOverride = {
  name: string
  sourceLabel: string
  sourceUrl: string
  potencies: string[]
  defaultPotency: string
  potencyReference: string
  dosageReference: string
  pelletsPerDose: string
  sessionsPerDay: string
  reviewWindowDays: string
  watchfulness: number
  associatedSymptoms: string[]
  comfortMeasures: string[]
}

const remedyReferenceOverrides: RemedyReferenceOverride[] = [
  {
    name: 'Sulphur',
    sourceLabel: 'Boericke Materia Medica',
    sourceUrl: 'https://homeoint.org/books/boericmm/s/sulph.htm',
    potencies: ['12C', '30C', '200C', '1M'],
    defaultPotency: '12C',
    potencyReference: 'Boericke notes 12C as a common starting point, with higher potencies often used in chronic cases and lower potencies in torpid eruptions.',
    dosageReference: 'Traditional reference only: not too frequent dosing; chronic constitutions are often reviewed after a single dose or widely spaced doses.',
    pelletsPerDose: '3-5',
    sessionsPerDay: '0-1',
    reviewWindowDays: '14-42',
    watchfulness: 72,
    associatedSymptoms: ['Heat of bed aggravation', 'Itching or burning skin', 'Sinking around 11 AM', 'Red orifices or offensive discharges'],
    comfortMeasures: ['Review skin and bowel changes before repeating', 'Reduce heat triggers when possible', 'Seek clinical review if symptoms intensify rapidly'],
  },
  {
    name: 'Nux Vomica',
    sourceLabel: 'Boericke Materia Medica',
    sourceUrl: 'https://www.homeoint.org/books/boericmm/n/nux-v.htm',
    potencies: ['6C', '30C', '200C', '1M'],
    defaultPotency: '30C',
    potencyReference: 'Boericke lists first to thirtieth potency and higher, with a note that it is often said to act best when given in the evening.',
    dosageReference: 'Traditional reference only: often used in infrequent doses with reassessment rather than repeated fixed daily scheduling.',
    pelletsPerDose: '3-5',
    sessionsPerDay: '0-1',
    reviewWindowDays: '3-10',
    watchfulness: 58,
    associatedSymptoms: ['Morning aggravation', 'Digestive irritability', 'Oversensitivity to light, noise, odors', '3-4 AM waking'],
    comfortMeasures: ['Review stimulant exposure and sleep pattern', 'Avoid repeating while strong aggravation is unfolding', 'Escalating abdominal pain needs direct clinical review'],
  },
  {
    name: 'Rhus Toxicodendron',
    sourceLabel: 'Boericke Materia Medica',
    sourceUrl: 'https://www.homeoint.org/books/boericmm/r/rhus-t.htm',
    potencies: ['6C', '12C', '30C', '200C'],
    defaultPotency: '30C',
    potencyReference: 'Boericke lists the sixth to thirtieth potency, and notes that 200th and higher are used as antidotal references for plant poisoning.',
    dosageReference: 'Traditional reference only: commonly spaced by response, especially in musculoskeletal or restlessness pictures.',
    pelletsPerDose: '3-5',
    sessionsPerDay: '1-2',
    reviewWindowDays: '5-14',
    watchfulness: 64,
    associatedSymptoms: ['Restlessness with stiffness', 'Worse on first motion', 'Better continued motion', 'Tendon or joint soreness'],
    comfortMeasures: ['Track motion-response changes closely', 'Rest plus gentle movement usually matters more than rapid repetition', 'Swelling or high fever needs direct evaluation'],
  },
  {
    name: 'Pulsatilla',
    sourceLabel: 'Boericke Materia Medica',
    sourceUrl: 'https://www.homeoint.org/books/boericmm/p/puls.htm',
    potencies: ['3C', '6C', '30C', '200C'],
    defaultPotency: '30C',
    potencyReference: 'Boericke lists third to thirtieth attenuation.',
    dosageReference: 'Traditional reference only: usually given in occasional doses with review of the changing symptom picture rather than rigid repetition.',
    pelletsPerDose: '3-5',
    sessionsPerDay: '0-1',
    reviewWindowDays: '5-14',
    watchfulness: 46,
    associatedSymptoms: ['Thirstlessness', 'Changeable discharge or pains', 'Better open air', 'Weepy or reassurance-seeking state'],
    comfortMeasures: ['Track changeability rather than one isolated symptom', 'Heat aggravation matters in this picture', 'Respiratory distress or dehydration needs direct care'],
  },
  {
    name: 'Bryonia Alba',
    sourceLabel: 'Boericke Materia Medica',
    sourceUrl: 'https://www.homeoint.org/books/boericmm/b/bry.htm',
    potencies: ['3C', '6C', '12C', '30C'],
    defaultPotency: '12C',
    potencyReference: 'Boericke lists first to twelfth attenuation.',
    dosageReference: 'Traditional reference only: usually reviewed after response in acute dry, painful states instead of repeated automatic dosing.',
    pelletsPerDose: '3-5',
    sessionsPerDay: '1-2',
    reviewWindowDays: '3-7',
    watchfulness: 52,
    associatedSymptoms: ['Dry mucous membranes', 'Large thirst', 'Worse motion', 'Stitching chest or joint pain'],
    comfortMeasures: ['Protect rest and hydration patterns', 'Watch for increasing chest pain or breathlessness', 'Avoid repeating once the dry acute picture begins to resolve'],
  },
  {
    name: 'Phosphorus',
    sourceLabel: 'Boericke Materia Medica',
    sourceUrl: 'https://www.homeoint.org/books/boericmm/p/phos.htm',
    potencies: ['3C', '6C', '30C', '200C'],
    defaultPotency: '30C',
    potencyReference: 'Boericke lists third to thirtieth potency and warns against too low or too continuous dosing in sensitive destructive states.',
    dosageReference: 'Traditional reference only: usually spaced carefully, with extra caution in tubercular or hemorrhagic pictures.',
    pelletsPerDose: '3-5',
    sessionsPerDay: '0-1',
    reviewWindowDays: '4-10',
    watchfulness: 74,
    associatedSymptoms: ['Thirst for cold water', 'Burning chest', 'Hoarseness', 'Weakness after fluid loss or bleeding'],
    comfortMeasures: ['Watch sensitivity and bleeding symptoms closely', 'Review respiratory progression before repeating', 'Urgent respiratory or bleeding symptoms need direct medical care'],
  },
  {
    name: 'Arsenicum Album',
    sourceLabel: 'Boericke Materia Medica',
    sourceUrl: 'https://www.homeoint.org/books/boericmm/a/ars.htm',
    potencies: ['3C', '6C', '30C', '200C'],
    defaultPotency: '30C',
    potencyReference: 'Boericke lists third to thirtieth potency, with low triturations noted in some gastric or surface conditions and higher use in neuralgic or skin states.',
    dosageReference: 'Traditional reference only: repeated doses are mentioned in Boericke, but spacing still depends on response and sensitivity.',
    pelletsPerDose: '3-5',
    sessionsPerDay: '1-2',
    reviewWindowDays: '2-7',
    watchfulness: 78,
    associatedSymptoms: ['Anxiety after midnight', 'Burning pains better by heat', 'Small frequent sips', 'Marked restlessness'],
    comfortMeasures: ['Watch hydration and exhaustion closely', 'Escalating breathing trouble or collapse signs need urgent care', 'Avoid fixed repetition if the picture changes quickly'],
  },
  {
    name: 'Aconitum Napellus',
    sourceLabel: 'Boericke Materia Medica',
    sourceUrl: 'https://www.homeoint.org/books/boericmm/a/acon.htm',
    potencies: ['1C', '3C', '6C', '30C'],
    defaultPotency: '6C',
    potencyReference: 'Boericke notes sixth potency for sensory affections and first to third for congestive conditions, with frequent repetition in acute disease.',
    dosageReference: 'Traditional reference only: short acute use with frequent review, especially in sudden fever or fright states.',
    pelletsPerDose: '3-5',
    sessionsPerDay: '2-4',
    reviewWindowDays: '1-3',
    watchfulness: 70,
    associatedSymptoms: ['Sudden onset', 'Fear or panic', 'Dry cold exposure trigger', 'Restless feverish state'],
    comfortMeasures: ['Use only while the sudden acute picture is present', 'Worsening fever or respiratory distress needs direct medical review', 'Do not keep repeating after the picture has shifted'],
  },
  {
    name: 'Natrium Muriaticum',
    sourceLabel: 'Boericke Materia Medica',
    sourceUrl: 'https://www.homeoint.org/books/boericmm/n/nat-m.htm',
    potencies: ['12C', '30C', '200C', '1M'],
    defaultPotency: '30C',
    potencyReference: 'Boericke lists twelfth to thirtieth and higher, often with infrequent dosing in the higher range.',
    dosageReference: 'Traditional reference only: higher potencies are often used sparingly with careful observation of chronic response.',
    pelletsPerDose: '3-5',
    sessionsPerDay: '0-1',
    reviewWindowDays: '14-35',
    watchfulness: 60,
    associatedSymptoms: ['Thirst', 'Salt craving', 'Dry cracked lips', 'Reserved grief pattern'],
    comfortMeasures: ['Watch hydration, headaches, and fatigue pattern', 'Repeat cautiously in chronic states', 'Escalating weakness or dehydration needs direct evaluation'],
  },
]

const overrideMap = new Map(remedyReferenceOverrides.map((entry) => [entry.name.toLowerCase(), entry]))

export type RemedyReferenceData = {
  potencies: string[]
  defaultPotency: string
  potencyReference: string
  dosage: string
  pelletsPerDose: string
  sessionsPerDay: string
  reviewWindowDays: string
  watchfulness: number
  associatedSymptoms: string[]
  comfortMeasures: string[]
  accuracyNote: string
  source: string[]
}

export function getRemedyReferenceData(remedy: {
  name: string
  description: string
  potencies?: string[]
  defaultPotency?: string
  dosage?: string
  source?: string[]
  keynotes?: string[]
  modalities?: string[]
  aggravations?: string[]
  ameliorations?: string[]
  emotionalSymptoms?: string[]
}) : RemedyReferenceData {
  const override = overrideMap.get(remedy.name.toLowerCase())
  if (override) {
    return {
      potencies: override.potencies,
      defaultPotency: override.defaultPotency,
      potencyReference: override.potencyReference,
      dosage: `${override.dosageReference} Typical pellet count in common reference dispensing: ${override.pelletsPerDose} pellets.`,
      pelletsPerDose: override.pelletsPerDose,
      sessionsPerDay: override.sessionsPerDay,
      reviewWindowDays: override.reviewWindowDays,
      watchfulness: override.watchfulness,
      associatedSymptoms: override.associatedSymptoms,
      comfortMeasures: override.comfortMeasures,
      accuracyNote: `Traditional literature reference from ${override.sourceLabel}; not a fixed prescription rule.`,
      source: Array.from(new Set([...(remedy.source || []), override.sourceLabel, override.sourceUrl])),
    }
  }

  const text = [remedy.description, ...(remedy.keynotes || []), ...(remedy.modalities || [])].join(' ').toLowerCase()
  const reviewWindowDays =
    /skin|chronic|eruption|eczema|psoric/.test(text) ? '14-42' :
    /joint|stiff|rheum|pain|motion/.test(text) ? '5-21' :
    /cough|fever|acute|throat|chest|respir/.test(text) ? '2-7' :
    /stomach|digest|bowel|constipat/.test(text) ? '3-10' :
    '7-21'

  const associatedSymptoms = Array.from(new Set([
    ...(remedy.keynotes || []).slice(0, 4),
    ...(remedy.aggravations || []).slice(0, 2).map((item) => `Aggravation: ${item}`),
  ])).slice(0, 6)

  const comfortMeasures = Array.from(new Set([
    ...(remedy.ameliorations || []).slice(0, 3).map((item) => `Often feels better with: ${item}`),
    'Review the source materia medica before treating this as a fixed dose schedule.',
    'Escalating or dangerous symptoms need direct clinician review.',
  ])).slice(0, 4)

  return {
    potencies: remedy.potencies || ['6C', '30C', '200C'],
    defaultPotency: remedy.defaultPotency || remedy.potencies?.[0] || '30C',
    potencyReference: 'No remedy-specific potency note was extracted from the local source cache for this remedy.',
    dosage: 'No remedy-specific dosing note is available in the local source cache. Use the materia medica source before assigning a fixed schedule.',
    pelletsPerDose: 'Varies',
    sessionsPerDay: 'Varies',
    reviewWindowDays,
    watchfulness: 50,
    associatedSymptoms,
    comfortMeasures,
    accuracyNote: 'Local repertory match is available, but remedy-specific dosing was not present in the imported source cache.',
    source: remedy.source || [],
  }
}

export function buildMatchPresentation(score: number, matchedRubrics: string[]) {
  const fitScore = Math.max(18, Math.min(98, Math.round(score / 2)))
  const watchfulness = Math.max(20, Math.min(95, 100 - Math.round(matchedRubrics.length * 6)))
  return {
    fitScore,
    watchfulness,
  }
}
