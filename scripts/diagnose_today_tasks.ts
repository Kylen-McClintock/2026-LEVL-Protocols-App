import { BUILT_IN_PEPTIDE_PROTOCOLS } from '../lib/data/builtInPeptideProtocols'

// Let's test what tasks are scheduled for Day 0 (today) when localStartDate is Tuesday, Aug 18, 2026
const todayStr = '2026-08-18' // Tuesday (day of week = 2)

console.log(`\n==============================================`)
console.log(`TESTING SCHEDULED TASKS FOR TODAY (${todayStr}, Tuesday)`)
console.log(`==============================================\n`)

// Let's check for each protocol: how many steps does the protocol have, and how many tasks are scheduled for Day 0 (today)?
for (const p of BUILT_IN_PEPTIDE_PROTOCOLS) {
  const stepsCount = p.steps.length
  // Let's inspect which modalities would be scheduled for Day 0
  console.log(`\nProtocol: ${p.name} (${p.id})`)
  console.log(`Total Steps in Protocol: ${stepsCount}`)
  p.steps.forEach((s, idx) => {
    console.log(`  Step ${idx + 1}: ${s.modality_id} | freq: "${s.frequency}" | timing: "${s.timing_slot}"`)
  })
}
