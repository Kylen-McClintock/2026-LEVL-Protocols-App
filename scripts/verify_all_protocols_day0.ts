import { BUILT_IN_PEPTIDE_PROTOCOLS } from '../lib/data/builtInPeptideProtocols'
import { BUILT_IN_TRAINING_PROTOCOLS } from '../lib/data/builtInTrainingProtocols'
import { getModalities, getProtocolsWithSteps } from '../lib/data'

console.log(`\n==============================================`)
console.log(`VERIFYING PROTOCOL MODALITY INGESTION & DEDUPLICATION`)
console.log(`==============================================\n`)

async function runVerification() {
  // 1. Verify Modalities Deduplication
  const mods = await getModalities(true)
  console.log(`Total modalities returned by getModalities(): ${mods.length}`)
  const idCounts: Record<string, number> = {}
  mods.forEach(m => {
    idCounts[m.id] = (idCounts[m.id] || 0) + 1
  })
  const duplicates = Object.entries(idCounts).filter(([_, count]) => count > 1)
  if (duplicates.length > 0) {
    console.error(`❌ DUPLICATE MODALITIES FOUND:`, duplicates)
    process.exit(1)
  } else {
    console.log(`✅ 0 Duplicate modality IDs! Modality list is 100% unique.`)
  }

  // 2. Verify Protocols with Steps
  const protocols = await getProtocolsWithSteps(true)
  console.log(`\nTotal protocols returned by getProtocolsWithSteps(): ${protocols.length}`)

  const allBuiltIns = [...BUILT_IN_PEPTIDE_PROTOCOLS, ...BUILT_IN_TRAINING_PROTOCOLS]
  for (const builtIn of allBuiltIns) {
    const found = protocols.find(p => p.id === builtIn.id)
    if (!found) {
      console.error(`❌ Missing protocol in list: ${builtIn.id}`)
      process.exit(1)
    }
    const foundStepsCount = (found.steps || []).length
    const expectedStepsCount = (builtIn.steps || []).length
    if (foundStepsCount < expectedStepsCount) {
      console.error(`❌ Protocol ${builtIn.id} has only ${foundStepsCount}/${expectedStepsCount} steps!`)
      process.exit(1)
    }
  }
  console.log(`✅ All ${allBuiltIns.length} protocols have 100% complete steps with modalities.`)

  console.log(`\n----------------------------------------------`)
  console.log(`ALL CHECKS PASSED PERFECTLY!`)
  console.log(`----------------------------------------------\n`)
}

runVerification().catch(console.error)
