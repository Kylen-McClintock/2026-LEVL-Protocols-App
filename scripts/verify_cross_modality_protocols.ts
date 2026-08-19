import { BUILT_IN_PEPTIDE_PROTOCOLS, BUILT_IN_PEPTIDE_MODALITIES } from '../lib/data/builtInPeptideProtocols'
import { PROTOCOL_LITERATURE_BENCHMARKS } from '../lib/peptides/peptideEffectivenessEngine'
import { addProtocolToToday } from '../lib/data'

console.log(`\n==============================================`)
console.log(`VERIFYING CROSS-MODALITY PROTOCOL SUITE (32 TOTAL)`)
console.log(`==============================================\n`)

console.log(`Total Built-in Peptide/Cross-Modal Protocols: ${BUILT_IN_PEPTIDE_PROTOCOLS.length}`)
console.log(`Total Built-in Modalities in Catalog: ${BUILT_IN_PEPTIDE_MODALITIES.length}`)

const targetProtocolIds = [
  'photonic_ghkcu_red_light_protocol',
  'wolverine_thermal_recovery_protocol',
  'mots_c_zone2_mitochondrial_protocol',
  'cjc_ipam_anabolic_sleep_protocol',
  'semax_selank_cognitive_flow_protocol'
]

let passed = 0
let failed = 0

targetProtocolIds.forEach((protoId, idx) => {
  const proto = BUILT_IN_PEPTIDE_PROTOCOLS.find(p => p.id === protoId)
  if (!proto) {
    console.error(`❌ [FAIL] Protocol not found: ${protoId}`)
    failed++
    return
  }

  console.log(`\n[Protocol #${idx + 28}]: ${proto.name}`)
  console.log(`  - Primary Goal: ${proto.primary_goal}`)
  console.log(`  - Human Description: "${(proto.description || '').slice(0, 80)}..."`)
  console.log(`  - Scientific Rationale: "${(proto.rationale || '').slice(0, 80)}..."`)
  console.log(`  - Steps count: ${proto.steps.length}`)

  // Verify steps
  proto.steps.forEach(s => {
    if (!s.modality) {
      console.error(`    ❌ Step ${s.id} missing modality object!`)
      failed++
    } else {
      console.log(`    ✓ Step [${s.ordering_index}]: ${s.modality.display_name || s.modality.name} (${s.dose_text})`)
    }
  })

  // Verify literature benchmark
  const benchmark = (PROTOCOL_LITERATURE_BENCHMARKS as any)[protoId]
  if (!benchmark || !benchmark.outcomes || benchmark.outcomes.length === 0) {
    console.error(`  ❌ Missing literature benchmark for ${protoId}`)
    failed++
  } else {
    console.log(`  ✓ Literature benchmark verified (${benchmark.outcomes.length} tracked dimensions):`)
    benchmark.outcomes.forEach((o: any) => {
      console.log(`      - ${o.key} (${o.label}): "${o.benchmark.slice(0, 60)}..."`)
    })
    passed++
  }
})

console.log(`\n----------------------------------------------`)
if (failed === 0) {
  console.log(`✅ ALL ${passed} CROSS-MODALITY PROTOCOLS FULLY VERIFIED WITH 0 ERRORS!`)
} else {
  console.error(`❌ VERIFICATION FAILED WITH ${failed} ERRORS.`)
}
console.log(`----------------------------------------------\n`)
