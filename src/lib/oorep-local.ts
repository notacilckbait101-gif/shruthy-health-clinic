import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'
import zlib from 'node:zlib'
import { toSlug } from '@/lib/db-utils'

export type OorepCatalogRemedy = {
  id: string
  sourceId: number
  name: string
  slug: string
  source: string[]
  description: string
  potencies: string[]
  defaultPotency: string
  dosage: string
  keynotes: string[]
  modalities: string[]
  aggravations: string[]
  ameliorations: string[]
  complementaryRemedies: string[]
  antidotes: string[]
  recoveryEstimate: string
  cravings: string[]
  emotionalSymptoms: string[]
  thermalPreference: string
  sleepPattern: string
  searchTerms: string[]
}

export type OorepCatalogRubric = {
  id: string
  sourceId: number
  rubric: string
  chapter: string
  source: string
  keywords: string[]
  modalities: string[]
  remedies: Array<{
    remedyId: string
    remedyName: string
    grade: number
  }>
  searchText: string
}

export type OorepCatalog = {
  catalogVersion?: string
  builtAt: string
  sourcePath: string
  remedies: OorepCatalogRemedy[]
  rubrics: OorepCatalogRubric[]
}

declare global {
  var __oorepLocalCatalog: OorepCatalog | undefined
  var __oorepLocalCatalogPromise: Promise<OorepCatalog> | undefined
}

const CACHE_FILE_PATH = path.join(process.cwd(), 'data', 'oorep-publicum-cache.json')
const CATALOG_VERSION = 'v2-multi-repertory'
const SUPPORTED_REPERTORIES = new Map([
  ['publicum', { label: 'OOREP publicum', language: 'en' }],
  ['kent-de', { label: 'Kent repertory', language: 'de' }],
])

function parseNullable(value: string | undefined) {
  return value === '\\N' || value === undefined ? '' : value
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

function ensureDataDirectory() {
  const dir = path.dirname(CACHE_FILE_PATH)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function resolveOorepSqlPath() {
  const candidates = [
    process.env.OOREP_SQL_PATH,
    path.join(process.cwd(), 'oorep-upstream', 'oorep.sql.gz'),
    'C:\\Users\\user\\Desktop\\New folder\\oorep\\oorep.sql.gz',
  ].filter(Boolean) as string[]

  return candidates.find((candidate) => fs.existsSync(candidate))
}

async function buildCatalogFromSql(sqlPath: string): Promise<OorepCatalog> {
  const rubrics = new Map<
    number,
    {
      abbrev: string
      sourceId: number
      rubric: string
      chapter: string
      keywords: string[]
      modalities: string[]
    }
  >()
  const remedies = new Map<
    number,
    {
      sourceId: number
      name: string
      abbrev: string
      aliases: string[]
    }
  >()
  const rubricRemedies = new Map<number, Array<{ remedyId: number; weight: number }>>()
  const boerickeSections = new Map<number, Array<{ heading: string; content: string }>>()
  const chapterToRemedyId = new Map<number, number>()
  const allowedMmChapterIds = new Set<number>()

  let boerickeInfoId: number | null = null
  let currentTable = ''

  const stream = fs.createReadStream(sqlPath).pipe(zlib.createGunzip())
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
      const [abbrev, id, , textt, pathh, fullpath] = parts
      if (!SUPPORTED_REPERTORIES.has(abbrev)) continue
      const rubricText = parseNullable(fullpath) || parseNullable(pathh) || parseNullable(textt)
      if (!rubricText) continue
      const segments = rubricText
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
      rubrics.set(Number(id), {
        abbrev,
        sourceId: Number(id),
        rubric: rubricText,
        chapter: segments[0] || 'GENERALITIES',
        keywords: segments.map((segment) => segment.toLowerCase()),
        modalities: segments.slice(1).map((segment) => segment.toLowerCase()),
      })
      continue
    }

    if (currentTable === 'remedy') {
      const [id, abbrev, longName, alt] = parts
      remedies.set(Number(id), {
        sourceId: Number(id),
        name: parseNullable(longName),
        abbrev: parseNullable(abbrev),
        aliases: parsePgArray(alt),
      })
      continue
    }

    if (currentTable === 'rubricremedy') {
      const [abbrev, rubricId, remedyId, weight] = parts
      if (!SUPPORTED_REPERTORIES.has(abbrev)) continue
      const parsedRubricId = Number(rubricId)
      const list = rubricRemedies.get(parsedRubricId) || []
      list.push({ remedyId: Number(remedyId), weight: Number(weight) })
      rubricRemedies.set(parsedRubricId, list)
      continue
    }

    if (currentTable === 'mminfo') {
      const [id, abbrev, lang] = parts
      if (abbrev === 'boericke' && lang === 'en') {
        boerickeInfoId = Number(id)
      }
      continue
    }

    if (currentTable === 'mmchapter' && boerickeInfoId !== null) {
      const [chapterId, infoId, , remedyId] = parts
      if (Number(infoId) !== boerickeInfoId) continue
      const parsedRemedyId = Number(parseNullable(remedyId))
      if (!parsedRemedyId) continue
      const parsedChapterId = Number(chapterId)
      chapterToRemedyId.set(parsedChapterId, parsedRemedyId)
      allowedMmChapterIds.add(parsedChapterId)
      continue
    }

    if (currentTable === 'mmsection') {
      const [, chapterId, , , , heading, content] = parts
      const parsedChapterId = Number(chapterId)
      if (!allowedMmChapterIds.has(parsedChapterId)) continue
      const remedyId = chapterToRemedyId.get(parsedChapterId)
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

  const remedyCatalog = Array.from(usedRemedyIds)
    .map((remedyId) => {
      const remedy = remedies.get(remedyId)
      if (!remedy?.name) return null
      const sections = boerickeSections.get(remedyId) || []
      const keynotes = Array.from(
        new Set([
          ...sections.map((section) => section.heading).filter(Boolean),
          ...takeHighlights(sections).slice(0, 6),
        ]),
      ).slice(0, 12)

      const remedyDoc: OorepCatalogRemedy = {
        id: `oorep-remedy-${remedy.sourceId}`,
        sourceId: remedy.sourceId,
        name: remedy.name,
        slug: toSlug(remedy.name),
        source: ['OOREP', 'Boericke Materia Medica'],
        description:
          takeHighlights(sections).slice(0, 2).join(' ') ||
          `${remedy.name} imported from the local OOREP repertory and Boericke materia medica.`,
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
        recoveryEstimate: 'Review clinically after follow-up; estimate depends on totality and response.',
        cravings: [],
        emotionalSymptoms: sections
          .filter((section) => /mind|mental|emotion/i.test(section.heading))
          .flatMap((section) => takeHighlights([section]))
          .slice(0, 6),
        thermalPreference: '',
        sleepPattern:
          sections
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
        ).filter(Boolean),
      }

      return remedyDoc
    })
    .filter((item): item is OorepCatalogRemedy => Boolean(item))

  const remedyBySourceId = new Map(remedyCatalog.map((remedy) => [remedy.sourceId, remedy]))

  const rubricCatalog = Array.from(rubrics.values())
    .map((rubric) => {
      const entries = rubricRemedies.get(rubric.sourceId) || []
      const mappedRemedies = entries
        .map((entry) => {
          const remedy = remedyBySourceId.get(entry.remedyId)
          if (!remedy) return null
          return {
            remedyId: remedy.id,
            remedyName: remedy.name,
            grade: scoreToGrade(entry.weight),
          }
        })
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))

      if (mappedRemedies.length === 0) return null

      const searchText = [
        rubric.rubric,
        rubric.chapter,
        ...rubric.keywords,
        ...rubric.modalities,
        ...mappedRemedies.map((entry) => entry.remedyName),
      ]
        .join(' ')
        .toLowerCase()

      return {
        id: `oorep-rubric-${rubric.sourceId}`,
        sourceId: rubric.sourceId,
        rubric: rubric.rubric,
        chapter: rubric.chapter,
        source: SUPPORTED_REPERTORIES.get(rubric.abbrev)?.label || 'OOREP repertory',
        keywords: rubric.keywords,
        modalities: rubric.modalities,
        remedies: mappedRemedies,
        searchText,
      } satisfies OorepCatalogRubric
    })
    .filter((item): item is OorepCatalogRubric => Boolean(item))

  return {
    catalogVersion: CATALOG_VERSION,
    builtAt: new Date().toISOString(),
    sourcePath: sqlPath,
    remedies: remedyCatalog,
    rubrics: rubricCatalog,
  }
}

export async function getOorepLocalCatalog() {
  if (global.__oorepLocalCatalog) {
    return global.__oorepLocalCatalog
  }

  if (!global.__oorepLocalCatalogPromise) {
    global.__oorepLocalCatalogPromise = (async () => {
      ensureDataDirectory()

      if (fs.existsSync(CACHE_FILE_PATH)) {
        const cached = JSON.parse(fs.readFileSync(CACHE_FILE_PATH, 'utf8')) as OorepCatalog
        if (cached.catalogVersion === CATALOG_VERSION) {
          global.__oorepLocalCatalog = cached
          return cached
        }
      }

      const sqlPath = resolveOorepSqlPath()
      if (!sqlPath) {
        throw new Error('No local OOREP SQL dump was found. Expected oorep.sql.gz in the workspace or configured OOREP_SQL_PATH.')
      }

      const catalog = await buildCatalogFromSql(sqlPath)
      fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(catalog))
      global.__oorepLocalCatalog = catalog
      return catalog
    })()
  }

  return global.__oorepLocalCatalogPromise
}

export function clearOorepLocalCatalogCache() {
  global.__oorepLocalCatalog = undefined
  global.__oorepLocalCatalogPromise = undefined
}

export function getOorepCacheFilePath() {
  return CACHE_FILE_PATH
}
