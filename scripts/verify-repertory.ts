import { autocompleteSymptoms, findMatchingRemedies, searchRubrics } from '@/lib/repertory-engine'

async function main() {
  const rubrics = await searchRubrics('dry cough')
  const suggestions = await autocompleteSymptoms('dry cough')
  const matches = await findMatchingRemedies({
    symptoms: ['dry cough', 'thirst', 'worse at night'],
  })

  console.log(JSON.stringify({
    rubricCount: rubrics.length,
    firstRubrics: rubrics.slice(0, 5).map((item) => item.rubric),
    suggestions: suggestions.slice(0, 8),
    matches: matches.slice(0, 5).map((item) => ({
      name: item.remedy.name,
      score: item.score,
      rubrics: item.matchedRubrics.slice(0, 3),
      source: item.remedy.source,
    })),
  }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
