import { normalizeOptionalString } from '@/lib/db-utils'
import { getOorepLocalCatalog, type OorepCatalog, type OorepCatalogRemedy, type OorepCatalogRubric } from '@/lib/oorep-local'
import { getRemedyReferenceData } from '@/lib/remedy-reference'

export type RepertorySearchInput = {
  symptoms: string[]
  thermalPreference?: string
  cravings?: string[]
  emotionalSymptoms?: string[]
  sleepPattern?: string
  modalities?: string[]
  aggravations?: string[]
  ameliorations?: string[]
}

type ParsedQuery = {
  include: string[]
  exclude: string[]
}

type SearchRubric = {
  id: string
  sourceId?: number
  rubric: string
  chapter: string
  source: string
  keywords: string[]
  modalities: string[]
  remedies: Array<{
    remedyId?: string
    remedyName: string
    grade: number
  }>
  searchText: string
}

type SearchRemedy = {
  id: string
  name: string
  potency: string
  potencyReference: string
  dosage: string
  pelletsPerDose: string
  sessionsPerDay: string
  reviewWindowDays: string
  watchfulness: number
  associatedSymptoms: string[]
  comfortMeasures: string[]
  accuracyNote: string
  keynotes: string[]
  modalities: string[]
  description: string
  complementaryRemedies: string[]
  antidotes: string[]
  recoveryEstimate: string
  aggravations: string[]
  ameliorations: string[]
  potencies: string[]
  source: string[]
  thermalPreference?: string
  cravings?: string[]
  emotionalSymptoms?: string[]
  sleepPattern?: string
  searchTerms?: string[]
}

type IndexedRubric = {
  rubric: SearchRubric
  lowerRubric: string
  lowerText: string
}

type CatalogSearchIndex = {
  catalogBuiltAt: string
  indexedRubrics: IndexedRubric[]
  tokenToRubricIds: Map<string, number[]>
  vocabulary: string[]
  normalizedRemedies: SearchRemedy[]
  normalizedRemedyById: Map<string, SearchRemedy>
  normalizedRemedyByName: Map<string, SearchRemedy>
}

declare global {
  var __oorepCatalogSearchIndex: CatalogSearchIndex | undefined
}

function cleanList(values: Array<string | undefined | null> = []) {
  return values
    .map((value) => normalizeOptionalString(value))
    .filter((value): value is string => Boolean(value))
}

function tokenize(text: string) {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 1)
}

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'at', 'be', 'been', 'being', 'but', 'by', 'for', 'from', 'had', 'has', 'have', 'he',
  'her', 'his', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'me', 'my', 'of', 'on', 'or', 'she', 'that', 'the',
  'their', 'them', 'there', 'they', 'this', 'to', 'very', 'was', 'were', 'while', 'with', 'you', 'your',
])

const COMMON_TERM_FIXES: Record<string, string> = {
  anxity: 'anxiety',
  bloatedness: 'bloating',
  blod: 'blood',
  caugh: 'cough',
  coufh: 'cough',
  couhg: 'cough',
  couh: 'cough',
  diarhea: 'diarrhea',
  diziness: 'dizziness',
  faver: 'fever',
  headeche: 'headache',
  nausia: 'nausea',
  nesal: 'nasal',
  restlesness: 'restlessness',
  soar: 'sore',
  sorenesss: 'soreness',
  stumach: 'stomach',
  sweting: 'sweating',
  thorat: 'throat',
  throath: 'throat',
  tirdness: 'tiredness',
  vomitting: 'vomiting',
}

function normalizeToken(token: string) {
  const normalized = token.toLowerCase().trim()
  return COMMON_TERM_FIXES[normalized] || normalized
}

function meaningfulTokens(text: string) {
  return tokenize(text)
    .map(normalizeToken)
    .filter((token) => !STOP_WORDS.has(token))
}

function splitSentenceClauses(text: string) {
  return text
    .toLowerCase()
    .replace(/[.;:/\\|]+/g, ',')
    .split(/\b(?:and|with|while|when|after|before|during|because|but|then)\b|,+/i)
    .map((part) => part.trim())
    .filter(Boolean)
}

function expandFreeTextTerms(values: string[] = []) {
  const expanded = new Set<string>()

  values.forEach((value) => {
    const trimmed = value.trim()
    if (!trimmed) return
    expanded.add(trimmed)

    const clauses = splitSentenceClauses(trimmed)
    clauses.forEach((clause) => {
      const tokens = meaningfulTokens(clause)
      if (tokens.length === 0) return

      expanded.add(tokens.join(' '))
      tokens.forEach((token) => expanded.add(token))

      for (let size = 2; size <= Math.min(tokens.length, 3); size += 1) {
        for (let start = 0; start <= tokens.length - size; start += 1) {
          expanded.add(tokens.slice(start, start + size).join(' '))
        }
      }
    })
  })

  return Array.from(expanded)
    .map((item) => item.trim())
    .filter((item) => item.length > 1)
}

function editDistanceWithin(a: string, b: string, maxDistance = 2) {
  if (a === b) return true
  if (Math.abs(a.length - b.length) > maxDistance) return false

  const rows = a.length + 1
  const cols = b.length + 1
  const dp = Array.from({ length: rows }, () => new Array<number>(cols).fill(0))

  for (let i = 0; i < rows; i += 1) dp[i][0] = i
  for (let j = 0; j < cols; j += 1) dp[0][j] = j

  for (let i = 1; i < rows; i += 1) {
    let minInRow = maxDistance + 1
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      )
      minInRow = Math.min(minInRow, dp[i][j])
    }
    if (minInRow > maxDistance) return false
  }

  return dp[rows - 1][cols - 1] <= maxDistance
}

function charBigrams(text: string) {
  const compact = text.replace(/\s+/g, ' ').trim()
  if (compact.length < 2) return new Set([compact])
  const grams = new Set<string>()
  for (let index = 0; index < compact.length - 1; index += 1) {
    grams.add(compact.slice(index, index + 2))
  }
  return grams
}

function diceCoefficient(a: string, b: string) {
  const left = charBigrams(a)
  const right = charBigrams(b)
  let overlap = 0
  left.forEach((gram) => {
    if (right.has(gram)) overlap += 1
  })
  return (2 * overlap) / Math.max(left.size + right.size, 1)
}

function fuzzyPhraseScore(query: string, target: string) {
  const queryTokens = meaningfulTokens(query)
  const targetTokens = meaningfulTokens(target)
  if (queryTokens.length === 0 || targetTokens.length === 0) return 0

  let exactMatches = 0
  let approximateMatches = 0

  queryTokens.forEach((queryToken) => {
    if (targetTokens.includes(queryToken)) {
      exactMatches += 1
      return
    }

    const matched = targetTokens.some((targetToken) =>
      editDistanceWithin(queryToken, targetToken, queryToken.length > 6 ? 2 : 1),
    )
    if (matched) approximateMatches += 1
  })

  const dice = diceCoefficient(query.toLowerCase(), target.toLowerCase())
  return exactMatches * 6 + approximateMatches * 3 + dice * 10
}

function getCatalogSearchIndex(catalog: OorepCatalog) {
  if (
    global.__oorepCatalogSearchIndex &&
    global.__oorepCatalogSearchIndex.catalogBuiltAt === catalog.builtAt
  ) {
    return global.__oorepCatalogSearchIndex
  }

  const tokenToRubricIds = new Map<string, number[]>()
  const indexedRubrics: IndexedRubric[] = catalog.rubrics.map((rubric) => {
    const lowerRubric = rubric.rubric.toLowerCase()
    const lowerText = getRubricSearchText(rubric).toLowerCase()
    const seenTokens = new Set(meaningfulTokens(`${rubric.rubric} ${rubric.chapter} ${(rubric.keywords || []).join(' ')} ${(rubric.modalities || []).join(' ')}`))

    seenTokens.forEach((token) => {
      const list = tokenToRubricIds.get(token) || []
      list.push(rubric.sourceId)
      tokenToRubricIds.set(token, list)
    })

    return {
      rubric: rubric as SearchRubric,
      lowerRubric,
      lowerText,
    }
  })

  const sourceIdToIndex = new Map<number, number>()
  indexedRubrics.forEach((entry, index) => {
    if (typeof entry.rubric.sourceId === 'number') {
      sourceIdToIndex.set(entry.rubric.sourceId, index)
    }
  })

  const normalizedTokenMap = new Map<string, number[]>()
  tokenToRubricIds.forEach((sourceIds, token) => {
    const mappedIndexes = Array.from(new Set(sourceIds))
      .map((sourceId) => sourceIdToIndex.get(sourceId))
      .filter((value): value is number => value !== undefined)
    normalizedTokenMap.set(token, mappedIndexes)
  })

  const normalizedRemedies = catalog.remedies.map((remedy) => normalizeCatalogRemedy(remedy))
  const normalizedRemedyById = new Map(normalizedRemedies.map((remedy) => [remedy.id, remedy]))
  const normalizedRemedyByName = new Map(normalizedRemedies.map((remedy) => [remedy.name.toLowerCase(), remedy]))

  const index = {
    catalogBuiltAt: catalog.builtAt,
    indexedRubrics,
    tokenToRubricIds: normalizedTokenMap,
    vocabulary: Array.from(normalizedTokenMap.keys()),
    normalizedRemedies,
    normalizedRemedyById,
    normalizedRemedyByName,
  }

  global.__oorepCatalogSearchIndex = index
  return index
}

function parseOorepStyleQuery(query: string): ParsedQuery {
  const matches = query.match(/-?"[^"]+"|-?[^,\s]+/g) || []
  const include: string[] = []
  const exclude: string[] = []

  matches.forEach((rawToken) => {
    const isExclude = rawToken.startsWith('-')
    const token = rawToken.replace(/^-/, '').replace(/^"|"$/g, '').trim()
    if (!token) return

    if (isExclude) exclude.push(token)
    else include.push(token)
  })

  return { include, exclude }
}

function wildcardToRegex(term: string) {
  const escaped = term
    .toLowerCase()
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\\\*/g, '.*')

  return new RegExp(escaped.includes('.*') ? escaped : `\\b${escaped}\\b`, 'i')
}

function matchesAllIncludedTerms(text: string, include: string[]) {
  if (include.length === 0) return false
  return include.every((term) => wildcardToRegex(term).test(text))
}

function matchesExcludedTerm(text: string, exclude: string[]) {
  return exclude.some((term) => wildcardToRegex(term).test(text))
}

function getRubricSearchText(rubric: Pick<SearchRubric, 'searchText' | 'rubric' | 'chapter' | 'keywords' | 'modalities' | 'remedies'>) {
  if (rubric.searchText) return rubric.searchText
  return [
    rubric.rubric,
    rubric.chapter,
    ...(rubric.keywords || []),
    ...(rubric.modalities || []),
    ...(rubric.remedies || []).map((entry) => entry.remedyName),
  ]
    .join(' ')
    .toLowerCase()
}

function normalizeCatalogRemedy(remedy: OorepCatalogRemedy): SearchRemedy {
  const reference = getRemedyReferenceData(remedy)
  return {
    id: remedy.id,
    name: remedy.name,
    potency: reference.defaultPotency,
    potencyReference: reference.potencyReference,
    dosage: reference.dosage,
    pelletsPerDose: reference.pelletsPerDose,
    sessionsPerDay: reference.sessionsPerDay,
    reviewWindowDays: reference.reviewWindowDays,
    watchfulness: reference.watchfulness,
    associatedSymptoms: reference.associatedSymptoms,
    comfortMeasures: reference.comfortMeasures,
    accuracyNote: reference.accuracyNote,
    keynotes: remedy.keynotes,
    modalities: remedy.modalities,
    description: remedy.description,
    complementaryRemedies: remedy.complementaryRemedies,
    antidotes: remedy.antidotes,
    recoveryEstimate: remedy.recoveryEstimate,
    aggravations: remedy.aggravations,
    ameliorations: remedy.ameliorations,
    potencies: reference.potencies,
    source: reference.source,
    thermalPreference: remedy.thermalPreference,
    cravings: remedy.cravings,
    emotionalSymptoms: remedy.emotionalSymptoms,
    sleepPattern: remedy.sleepPattern,
    searchTerms: remedy.searchTerms,
  }
}

function scoreRubricMatch(rubric: SearchRubric, parsed: ParsedQuery, rawQuery: string) {
  const text = getRubricSearchText(rubric)
  if (!matchesAllIncludedTerms(text, parsed.include) || matchesExcludedTerm(text, parsed.exclude)) {
    return -1
  }

  let score = 0
  const lowerRubric = rubric.rubric.toLowerCase()
  const lowerQuery = rawQuery.trim().toLowerCase()

  if (lowerQuery && lowerRubric === lowerQuery) score += 16
  if (lowerQuery && lowerRubric.startsWith(lowerQuery)) score += 10
  if (lowerQuery && lowerRubric.includes(lowerQuery)) score += 6

  parsed.include.forEach((term) => {
    const regex = wildcardToRegex(term)
    if (regex.test(lowerRubric)) score += 6
    else if (regex.test(text)) score += 3
  })

  score += Math.min(rubric.remedies.length, 8)
  return score
}

function scoreRubricFuzzyMatch(rubric: SearchRubric, query: string) {
  const text = getRubricSearchText(rubric)
  const rubricScore = fuzzyPhraseScore(query, rubric.rubric)
  const textScore = fuzzyPhraseScore(query, text)
  const best = Math.max(rubricScore, textScore * 0.85)
  return best >= 6 ? best + Math.min(rubric.remedies.length, 6) : -1
}

function getCandidateRubrics(catalog: OorepCatalog, query: string) {
  const index = getCatalogSearchIndex(catalog)
  const tokens = meaningfulTokens(query)
  const candidateIndexes = new Set<number>()

  tokens.forEach((token) => {
    index.tokenToRubricIds.get(token)?.forEach((rubricIndex) => candidateIndexes.add(rubricIndex))
  })

  if (candidateIndexes.size < 80) {
    for (const token of tokens) {
      let matchesForToken = 0
      for (const vocabToken of index.vocabulary) {
        const maxDistance = token.length > 6 ? 2 : 1
        if (!editDistanceWithin(token, vocabToken, maxDistance)) continue
        index.tokenToRubricIds.get(vocabToken)?.forEach((rubricIndex) => candidateIndexes.add(rubricIndex))
        matchesForToken += 1
        if (matchesForToken >= 8) break
      }
    }
  }

  if (candidateIndexes.size === 0) {
    const compactQuery = query.trim().toLowerCase()
    index.indexedRubrics.forEach((entry, rubricIndex) => {
      if (
        compactQuery &&
        (entry.lowerRubric.includes(compactQuery) || entry.lowerText.includes(compactQuery))
      ) {
        candidateIndexes.add(rubricIndex)
      }
    })
  }

  if (candidateIndexes.size === 0) {
    return index.indexedRubrics.slice(0, 300).map((entry) => entry.rubric)
  }

  return Array.from(candidateIndexes)
    .slice(0, 900)
    .map((rubricIndex) => index.indexedRubrics[rubricIndex]?.rubric)
    .filter((rubric): rubric is SearchRubric => Boolean(rubric))
}

function searchCatalogRubrics(catalog: OorepCatalog, query: string, limit = 40) {
  const parsed = parseOorepStyleQuery(query)
  const normalized = query.trim()
  if (!normalized) return []
  const candidateRubrics = getCandidateRubrics(catalog, normalized)

  const exactScored = parsed.include.length === 0
    ? []
    : candidateRubrics
    .map((rubric) => ({
      rubric,
      score: scoreRubricMatch(rubric, parsed, normalized),
    }))
    .filter((entry) => entry.score >= 0)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score
      return left.rubric.rubric.length - right.rubric.rubric.length
    })
    .slice(0, limit)

  const fuzzyQueries = expandFreeTextTerms([normalized]).slice(0, 5)
  const fuzzyScored = candidateRubrics
    .map((rubric) => {
      const bestScore = fuzzyQueries.reduce((best, fuzzyQuery) => {
        const next = scoreRubricFuzzyMatch(rubric, fuzzyQuery)
        return Math.max(best, next)
      }, -1)

      return {
        rubric,
        score: bestScore,
      }
    })
    .filter((entry) => entry.score >= 0)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score
      return left.rubric.rubric.length - right.rubric.rubric.length
    })
    .slice(0, limit)

  const merged = new Map<string, { rubric: SearchRubric; score: number }>()
  ;[...exactScored, ...fuzzyScored].forEach((entry) => {
    const current = merged.get(entry.rubric.id)
    if (!current || entry.score > current.score) {
      merged.set(entry.rubric.id, entry)
    }
  })

  return Array.from(merged.values())
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((entry) => entry.rubric)
}

async function getLocalCatalogSafe() {
  try {
    return await getOorepLocalCatalog()
  } catch (error) {
    console.error('Local OOREP catalog unavailable:', error)
    return null
  }
}

async function getLocalRemedyByName(name: string) {
  const catalog = await getLocalCatalogSafe()
  if (!catalog) return null
  const index = getCatalogSearchIndex(catalog)
  return index.normalizedRemedyByName.get(name.toLowerCase()) || null
}

export async function searchRubrics(query: string) {
  const catalog = await getLocalCatalogSafe()
  if (catalog) {
    return searchCatalogRubrics(catalog, query)
  }

  return []
}

export async function autocompleteSymptoms(query: string) {
  const catalog = await getLocalCatalogSafe()
  if (!catalog) return []

  const candidateRubrics = getCandidateRubrics(catalog, query).slice(0, 80)
  const suggestions = new Set<string>()

  candidateRubrics.forEach((rubric) => {
    suggestions.add(rubric.rubric)
    rubric.keywords?.forEach((keyword: string) => suggestions.add(keyword))
    rubric.modalities?.forEach((modality: string) => suggestions.add(modality))
  })

  const normalizedQuery = query.toLowerCase().trim()
  return Array.from(suggestions)
    .filter((item) => {
      const lower = item.toLowerCase()
      return (
        lower.includes(normalizedQuery) ||
        fuzzyPhraseScore(normalizedQuery, lower) >= 4
      )
    })
    .slice(0, 12)
}

function remedyTextIncludes(remedy: SearchRemedy, term: string) {
  const searchText = [
    remedy.thermalPreference,
    remedy.sleepPattern,
    ...(remedy.modalities || []),
    ...(remedy.aggravations || []),
    ...(remedy.ameliorations || []),
    ...(remedy.cravings || []),
    ...(remedy.emotionalSymptoms || []),
    ...(remedy.keynotes || []),
    ...(remedy.searchTerms || []),
    remedy.description,
  ]
    .join(' ')
  return fuzzyPhraseScore(term, searchText) >= 6
}

export async function findMatchingRemedies(input: RepertorySearchInput) {
  const symptoms = expandFreeTextTerms(cleanList(input.symptoms)).slice(0, 12)
  const modalities = expandFreeTextTerms(cleanList([
    input.thermalPreference,
    input.sleepPattern,
    ...(input.modalities || []),
    ...(input.aggravations || []),
    ...(input.ameliorations || []),
    ...(input.cravings || []),
    ...(input.emotionalSymptoms || []),
  ])).slice(0, 10)

  const allTerms = [...symptoms, ...modalities]
  const catalog = await getLocalCatalogSafe()

  if (catalog) {
    const rubricMatches = allTerms.map((term) => searchCatalogRubrics(catalog, term, 16))
    const flattenedRubrics = Array.from(
      new Map(rubricMatches.flat().map((rubric) => [rubric.id, rubric])).values(),
    )
    const index = getCatalogSearchIndex(catalog)
    const remedyById = index.normalizedRemedyById

    const scored = new Map<
      string,
      {
        remedyName: string
        remedyId?: string
        score: number
        matchedRubrics: string[]
        overlapTerms: string[]
      }
    >()

    for (const rubric of flattenedRubrics) {
      const searchableText = getRubricSearchText(rubric)

      for (const remedy of rubric.remedies || []) {
        const current =
          scored.get(remedy.remedyName) ||
          ({
            remedyName: remedy.remedyName,
            remedyId: remedy.remedyId ? String(remedy.remedyId) : undefined,
            score: 0,
            matchedRubrics: [] as string[],
            overlapTerms: [] as string[],
          })

        let localScore = remedy.grade

        for (const term of symptoms) {
          if (fuzzyPhraseScore(term, searchableText) >= 6) {
            localScore += 2
            current.overlapTerms.push(term)
          }
        }

        for (const term of modalities) {
          if (fuzzyPhraseScore(term, searchableText) >= 5) {
            localScore += 1
            current.overlapTerms.push(term)
          }
        }

        current.score += localScore
        current.matchedRubrics.push(rubric.rubric)
        scored.set(remedy.remedyName, current)
      }
    }

    return Array.from(scored.values())
      .map((entry) => {
        const remedy = entry.remedyId ? remedyById.get(entry.remedyId) : null
        const namedRemedy =
          remedy ||
          index.normalizedRemedyByName.get(entry.remedyName.toLowerCase())
        if (!namedRemedy) return null

        const modalityBonus =
          cleanList([input.thermalPreference, input.sleepPattern]).filter((term) => remedyTextIncludes(namedRemedy, term)).length * 2

        return {
          remedy: namedRemedy,
          score: entry.score + modalityBonus,
          matchedRubrics: Array.from(new Set(entry.matchedRubrics)),
          overlapTerms: Array.from(new Set(entry.overlapTerms)),
        }
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
      .sort((left, right) => right.score - left.score)
      .slice(0, 10)
  }

  return []
}

export async function getRemedyDetails(remedyName: string) {
  const localRemedy = await getLocalRemedyByName(remedyName)
  if (localRemedy) {
    return localRemedy
  }

  return null
}
