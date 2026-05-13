import { ensureOorepDataImported } from '../src/lib/oorep-sync'

async function main() {
  await ensureOorepDataImported()
  console.log('OOREP repertory data synced into MongoDB.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => {
    process.exit(0)
  })
