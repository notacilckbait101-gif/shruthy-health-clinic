import { getOorepCacheFilePath, getOorepLocalCatalog } from '@/lib/oorep-local'

async function main() {
  const catalog = await getOorepLocalCatalog()
  console.log(
    `Built local OOREP cache at ${getOorepCacheFilePath()} with ${catalog.rubrics.length} rubrics and ${catalog.remedies.length} remedies.`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
