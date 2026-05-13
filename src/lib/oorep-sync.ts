import fs from 'node:fs'
import readline from 'node:readline'
import zlib from 'node:zlib'
import { connectToDatabase } from '@/lib/mongoose'
import { Remedy, RepertoryRubric } from '@/lib/models'
import { toSlug } from '@/lib/db-utils'

const DEFAULT_OOREP_SQL_PATH =
  process.env.OOREP_SQL_PATH || 'C:\\Users\\user\\Desktop\\New folder\\oorep\\oorep.sql.gz'

declare global {
  var __oorepImportPromise: Promise<void> | undefined
}

function parseNullable(value: string) {
  return value === '\\N' ? '' : value
}

function parsePgArray(value: string) {
  const raw = parseNullable(value)
  if (!raw || raw === '{}') return []
  return raw
    .replace(/^\{|\}$/g, '')
    .split(',')
    .map((item) => item.replace(/^"|"$/g, '').trim())
    .filter(Boolean)
}

function scoreToGrade(weight: number) {
  if (weight >= 4) return 4
  if (weight === 3) return 3
  if (weight === 2) return 2
  return 1
}

function takeHighlights(sections: Array<{ heading: string; content: string }>) {
  return sections
    .flatMap((section) =>
      section.content
        .split(/\\n|\.\s+/)
        .map((line) => line.replace(/\*/g, '').trim())
        .filter((line) => line.length > 12),
    )
    .slice(0, 8)
}

async function importOorepDataFromDump(filePath: string) {
  await connectToDatabase()

  const rubrics = new Map<
    string,
    {
      rubricId: number
      rubric: string
      chapter: string
      keywords: string[]
    }
  >()
  const remedies = new Map<
    number,
    {
      name: string
      abbrev: string
      aliases: string[]
    }
  >()
  const rubricRemedies = new Map<number, Array<{ remedyId: number; weight: number }>>()
  const boerickeSections = new Map<number, Array<{ heading: string; content: string }>>()
  const boerickeChapterByRemedy = new Map<number, number>()
  const boerickeChapterIds = new Set<number>()

  let boerickeInfoId: number | null = null
  let currentTable = ''

  const stream = fs.createReadStream(filePath).pipe(zlib.createGunzip())
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity })

  for await (const line of rl) {
    if (!currentTable) {
      if (line.startsWith('COPY public.rubric ')) currentTable = 'rubric'
      else if (line.startsWith('COPY public.remedy ')) currentTable = 'remedy'
      else if (line.startsWith('COPY public.rubricremedy ')) currentTable = 'rubricremedy'
      else if (line.startsWith('COPY public.mminfo ')) currentTable = 'mminfo'
      else if (line.startsWith('COPY public.mmchapter ')) currentTable = 'mmchapter'
      else if (line.startsWith('COPY public.mmsection ')) currentTable = 'mmsection'
      continue
    }

    if (line === '\\.') {
      currentTable = ''
      continue
    }

    const parts = line.split('\t')

    if (currentTable === 'rubric') {
      const [abbrev, id, , , , fullpath] = parts
      if (abbrev !== 'publicum') continue
      const rubricText = parseNullable(fullpath)
      const chapter = rubricText.split(',')[0]?.trim() || 'GENERALITIES'
      rubrics.set(Number(id).toString(), {
        rubricId: Number(id),
        rubric: rubricText,
        chapter,
        keywords: rubricText
          .toLowerCase()
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      })
    }

    if (currentTable === 'remedy') {
      const [id, abbrev, longName, alt] = parts
      remedies.set(Number(id), {
        name: parseNullable(longName),
        abbrev: parseNullable(abbrev),
        aliases: parsePgArray(alt),
      })
    }

    if (currentTable === 'rubricremedy') {
      const [abbrev, rubricId, remedyId, weight] = parts
      if (abbrev !== 'publicum') continue
      const list = rubricRemedies.get(Number(rubricId)) || []
      list.push({ remedyId: Number(remedyId), weight: Number(weight) })
      rubricRemedies.set(Number(rubricId), list)
    }

    if (currentTable === 'mminfo') {
      const [id, abbrev, lang] = parts
      if (abbrev === 'boericke' && lang === 'en') {
        boerickeInfoId = Number(id)
      }
    }

    if (currentTable === 'mmchapter' && boerickeInfoId !== null) {
      const [chapterId, infoId, , remedyId] = parts
      if (Number(infoId) !== boerickeInfoId) continue
      if (!parseNullable(remedyId)) continue
      boerickeChapterByRemedy.set(Number(remedyId), Number(chapterId))
      boerickeChapterIds.add(Number(chapterId))
    }

    if (currentTable === 'mmsection') {
      const [, chapterId, , , , heading, content] = parts
      const parsedChapterId = Number(chapterId)
      if (!boerickeChapterIds.has(parsedChapterId)) continue

      const remedyId = Array.from(boerickeChapterByRemedy.entries()).find(
        ([, mappedChapterId]) => mappedChapterId === parsedChapterId,
      )?.[0]

      if (!remedyId) continue
      const sections = boerickeSections.get(remedyId) || []
      sections.push({
        heading: parseNullable(heading),
        content: parseNullable(content),
      })
      boerickeSections.set(remedyId, sections)
    }
  }

  const usedRemedyIds = new Set<number>()
  rubricRemedies.forEach((entries) => entries.forEach((entry) => usedRemedyIds.add(entry.remedyId)))

  await Promise.all([
    RepertoryRubric.deleteMany({ source: 'OOREP publicum' }),
    Remedy.deleteMany({ source: { $in: ['OOREP', 'Boericke Materia Medica'] } }),
  ])

  const remedyDocs = Array.from(usedRemedyIds)
    .map((remedyId) => {
      const remedy = remedies.get(remedyId)
      if (!remedy) return null
      const sections = boerickeSections.get(remedyId) || []
      const keynotes = Array.from(
        new Set([
          ...sections.map((section) => section.heading).filter(Boolean),
          ...takeHighlights(sections).slice(0, 6),
        ]),
      ).slice(0, 12)

      return {
        name: remedy.name,
        slug: toSlug(remedy.name),
        source: ['OOREP', 'Boericke Materia Medica'],
        description:
          takeHighlights(sections).slice(0, 2).join(' ') ||
          `${remedy.name} imported from the local OOREP repertory dump.`,
        potencies: ['6C', '30C', '200C', '1M'],
        defaultPotency: '30C',
        dosage: '30C potency; adjust repetition clinically based on sensitivity, vitality, and follow-up.',
        keynotes,
        modalities: sections
          .filter((section) => /better|worse|aggr|amel/i.test(section.heading))
          .map((section) => `${section.heading}: ${section.content.split(/\\n|\./)[0]}`.trim())
          .slice(0, 8),
        aggravations: sections
          .filter((section) => /worse|aggr/i.test(section.heading))
          .flatMap((section) => takeHighlights([section]))
          .slice(0, 6),
        ameliorations: sections
          .filter((section) => /better|amel/i.test(section.heading))
          .flatMap((section) => takeHighlights([section]))
          .slice(0, 6),
        complementaryRemedies: [],
        antidotes: [],
        recoveryEstimate: 'Review clinically after follow-up; estimate depends on totality and remedy response.',
        cravings: [],
        emotionalSymptoms: sections
          .filter((section) => /mind|mental|emotion/i.test(section.heading))
          .flatMap((section) => takeHighlights([section]))
          .slice(0, 6),
        thermalPreference: '',
        sleepPattern: sections
          .filter((section) => /sleep/i.test(section.heading))
          .flatMap((section) => takeHighlights([section]))
          .slice(0, 1)[0] || '',
        searchTerms: Array.from(
          new Set([
            remedy.abbrev,
            remedy.name,
            ...remedy.aliases,
            ...keynotes,
          ]),
        ),
      }
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))

  if (remedyDocs.length > 0) {
    await Remedy.insertMany(remedyDocs, { ordered: false })
  }

  type InsertedRemedy = {
    _id: string
    name: string
  }

  const insertedRemedies = await Remedy.find({
    name: { $in: remedyDocs.map((doc) => doc.name) },
  }).lean<InsertedRemedy[]>()
  const mongoRemedyByName = new Map(insertedRemedies.map((remedy: InsertedRemedy) => [remedy.name, remedy]))

  const rubricDocs = Array.from(rubrics.values())
    .map((rubric) => {
      const entries = rubricRemedies.get(rubric.rubricId) || []
      const mappedRemedies = entries
        .map((entry) => {
          const remedy = remedies.get(entry.remedyId)
          if (!remedy) return null
          const mongoRemedy = mongoRemedyByName.get(remedy.name)
          return {
            remedyId: mongoRemedy?._id,
            remedyName: remedy.name,
            grade: scoreToGrade(entry.weight),
          }
        })
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))

      if (mappedRemedies.length === 0) return null

      return {
        rubric: rubric.rubric,
        chapter: rubric.chapter,
        source: 'OOREP publicum',
        keywords: rubric.keywords,
        modalities: rubric.keywords.slice(1),
        remedies: mappedRemedies,
      }
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))

  const batchSize = 1000
  for (let index = 0; index < rubricDocs.length; index += batchSize) {
    await RepertoryRubric.insertMany(rubricDocs.slice(index, index + batchSize), {
      ordered: false,
    })
  }
}

export async function ensureOorepDataImported() {
  await connectToDatabase()

  const existing = await RepertoryRubric.countDocuments({ source: 'OOREP publicum' })
  if (existing > 1000) return
  if (!fs.existsSync(DEFAULT_OOREP_SQL_PATH)) return

  if (!global.__oorepImportPromise) {
    global.__oorepImportPromise = importOorepDataFromDump(DEFAULT_OOREP_SQL_PATH)
      .catch((error) => {
        console.error('OOREP import failed:', error)
      })
      .finally(() => {
        global.__oorepImportPromise = undefined
      })
  }

  await global.__oorepImportPromise
}
