import { getProtocolsWithSteps, getProtocolByIdWithSteps, getModalities } from '../lib/data'
import { BUILT_IN_PEPTIDE_PROTOCOLS } from '../lib/data/builtInPeptideProtocols'

async function test() {
  console.log('Testing getModalities()...')
  const mods = await getModalities(true)
  console.log(`Fetched ${mods.length} modalities.`)
  
  // Check for duplicate modality IDs
  const idCounts: Record<string, number> = {}
  mods.forEach(m => {
    idCounts[m.id] = (idCounts[m.id] || 0) + 1
  })
  const duplicates = Object.entries(idCounts).filter(([_, count]) => count > 1)
  console.log(`Duplicate modality IDs found:`, duplicates)

  console.log('\nTesting getProtocolsWithSteps()...')
  const allWithSteps = await getProtocolsWithSteps(true)
  console.log(`Total protocols with steps: ${allWithSteps.length}`)

  // Check built-in peptide protocols
  console.log('\nChecking steps for each peptide protocol:')
  for (const builtIn of BUILT_IN_PEPTIDE_PROTOCOLS) {
    const found = await getProtocolByIdWithSteps(builtIn.id)
    const builtInStepsCount = builtIn.steps?.length || 0
    const foundStepsCount = found?.steps?.length || 0
    if (foundStepsCount < builtInStepsCount) {
      console.warn(`⚠️ [DEFICIT] Protocol ${builtIn.id}: Built-in has ${builtInStepsCount} steps, but getProtocolByIdWithSteps returned ${foundStepsCount} steps!`)
    } else {
      console.log(`✓ Protocol ${builtIn.id}: ${foundStepsCount} steps (Built-in: ${builtInStepsCount})`)
    }
  }
}

test().catch(console.error)
