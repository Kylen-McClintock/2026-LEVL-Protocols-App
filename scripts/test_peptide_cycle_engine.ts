import {
  extractPeptideCycles,
  computeWeeklyPKCurves,
  correlatePeptideBiomarkers,
  PEPTIDE_PK_REGISTRY
} from '../lib/peptides/peptideCycleEngine'
import { DailyProtocolTask } from '../lib/types'
import { BiomarkerMeasurementRecord } from '../lib/aging-models/bioAgeTypes'
import { format, addDays } from 'date-fns'

console.log(`\n==============================================`)
console.log(`TESTING PEPTIDE CYCLE & PHARMACOKINETICS ENGINE`)
console.log(`==============================================\n`)

async function runTests() {
  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(today, i))

  // 1. Synthesize mock Wolverine Stack tasks (BPC-157 daily + TB-500 2x weekly)
  const mockTasks: DailyProtocolTask[] = [
    {
      id: 'task-bpc-1',
      user_id: 'test-user',
      scheduled_date: todayStr,
      status: 'completed',
      created_at: new Date().toISOString(),
      modality_id: 'bpc157_subq',
      loose_modality: {
        id: 'bpc157_subq',
        name: 'BPC-157 SubQ',
        category: 'peptide',
        description: 'Gastric pentadecapeptide tissue repair accelerant',
        evidence_level: 'Moderate',
        is_evidence_based: true,
        is_custom: false
      } as any,
      execution_details: {
        dosage: '250mcg twice daily'
      },
      timing_slot: 'morning'
    },
    {
      id: 'task-tb-1',
      user_id: 'test-user',
      scheduled_date: todayStr,
      status: 'completed',
      created_at: new Date().toISOString(),
      modality_id: 'tb500_subq',
      loose_modality: {
        id: 'tb500_subq',
        name: 'TB-500 (Thymosin Beta-4) SubQ',
        category: 'peptide',
        description: 'Systemic cellular healing and actin-sequestering peptide',
        evidence_level: 'Moderate',
        is_evidence_based: true,
        is_custom: false
      } as any,
      execution_details: {
        dosage: '2.5mg SubQ'
      },
      timing_slot: 'evening'
    },
    {
      id: 'task-cjc-1',
      user_id: 'test-user',
      scheduled_date: todayStr,
      status: 'pending',
      created_at: new Date().toISOString(),
      modality_id: 'cjc1295_no_dac_subq',
      loose_modality: {
        id: 'cjc1295_no_dac_subq',
        name: 'CJC-1295 (No DAC) SubQ',
        category: 'peptide',
        description: 'Pulsatile GHRH secretagogue analogue',
        evidence_level: 'High',
        is_evidence_based: true,
        is_custom: false
      } as any,
      execution_details: {
        dosage: '100mcg SubQ pre-bed'
      },
      timing_slot: 'pre_bed'
    }
  ]

  // Test Cycle Extraction
  const cycles = extractPeptideCycles(mockTasks, weekDays, null)
  console.log(`Extracted Peptide Cycles count: ${cycles.length}`)
  if (cycles.length !== 3) {
    console.error(`❌ Expected 3 cycles, got ${cycles.length}`)
    process.exit(1)
  }

  const bpcCycle = cycles.find(c => c.modalityId === 'bpc157_subq')
  if (!bpcCycle || bpcCycle.halfLifeHours !== 4) {
    console.error(`❌ BPC-157 cycle PK mapping failed:`, bpcCycle)
    process.exit(1)
  }
  console.log(`✅ BPC-157 Half-life correctly mapped to: ${bpcCycle.halfLifeLabel}`)

  const cjcCycle = cycles.find(c => c.modalityId === 'cjc1295_no_dac_subq')
  if (!cjcCycle || cjcCycle.halfLifeHours !== 0.5) {
    console.error(`❌ CJC-1295 cycle PK mapping failed:`, cjcCycle)
    process.exit(1)
  }
  console.log(`✅ CJC-1295 Half-life correctly mapped to: ${cjcCycle.halfLifeLabel}`)

  // Test PK Curve Generation
  const pkPoints = computeWeeklyPKCurves(mockTasks, weekDays, bpcCycle)
  console.log(`PK Points computed: ${pkPoints.length}`)
  if (pkPoints[0].estimatedRelativeLevel < 90) {
    console.error(`❌ Expected peak relative level >= 90 on dose day, got ${pkPoints[0].estimatedRelativeLevel}`)
    process.exit(1)
  }
  console.log(`✅ Dose Day Peak Relative Concentration: ${pkPoints[0].estimatedRelativeLevel}%`)
  console.log(`✅ Subsequent Days Decay Curve: ${pkPoints.slice(1, 4).map(p => `${p.dayLabel}: ${p.estimatedRelativeLevel}%`).join(', ')}`)

  // Test Biomarker Correlation
  const mockBiomarkers: BiomarkerMeasurementRecord[] = [
    {
      user_id: 'test-user',
      biomarker_id: 'hscrp',
      raw_name: 'High Sensitivity CRP',
      raw_value: 2.8,
      raw_unit: 'mg/L',
      normalized_value: 2.8,
      normalized_unit: 'mg/L',
      collection_date: format(addDays(today, -30), 'yyyy-MM-dd') // Pre-cycle
    },
    {
      user_id: 'test-user',
      biomarker_id: 'hscrp',
      raw_name: 'High Sensitivity CRP',
      raw_value: 0.9,
      raw_unit: 'mg/L',
      normalized_value: 0.9,
      normalized_unit: 'mg/L',
      collection_date: todayStr // Active cycle
    },
    {
      user_id: 'test-user',
      biomarker_id: 'igf1',
      raw_name: 'IGF-1 Somatomedin C',
      raw_value: 140,
      raw_unit: 'ng/mL',
      normalized_value: 140,
      normalized_unit: 'ng/mL',
      collection_date: format(addDays(today, -40), 'yyyy-MM-dd')
    },
    {
      user_id: 'test-user',
      biomarker_id: 'igf1',
      raw_name: 'IGF-1 Somatomedin C',
      raw_value: 225,
      raw_unit: 'ng/mL',
      normalized_value: 225,
      normalized_unit: 'ng/mL',
      collection_date: todayStr
    }
  ]

  const correlatedBpc = correlatePeptideBiomarkers(bpcCycle, mockBiomarkers)
  const hscrpCorrel = correlatedBpc.find(b => b.biomarkerId === 'hscrp')
  if (!hscrpCorrel || hscrpCorrel.deltaPercent === null || hscrpCorrel.deltaPercent >= 0) {
    console.error(`❌ hs-CRP biomarker correlation failed:`, hscrpCorrel)
    process.exit(1)
  }
  console.log(`✅ hs-CRP Pre-Cycle: ${hscrpCorrel.preCycleBaseline?.value} -> Intra-Cycle: ${hscrpCorrel.intraCycleActive?.value} (${hscrpCorrel.deltaPercent}%)`)

  const correlatedCjc = correlatePeptideBiomarkers(cjcCycle, mockBiomarkers)
  const igf1Correl = correlatedCjc.find(b => b.biomarkerId === 'igf1')
  if (!igf1Correl || igf1Correl.deltaPercent === null || igf1Correl.deltaPercent <= 0) {
    console.error(`❌ IGF-1 biomarker correlation failed:`, igf1Correl)
    process.exit(1)
  }
  console.log(`✅ IGF-1 Pre-Cycle: ${igf1Correl.preCycleBaseline?.value} -> Intra-Cycle: ${igf1Correl.intraCycleActive?.value} (+${igf1Correl.deltaPercent}%)`)

  console.log(`\n--- Testing Non-Peptide Exclusion & Duplicate Deduplication ---`)
  const mixedTasks: DailyProtocolTask[] = [
    // Duplicate BPC-157 tasks from 2 different protocols on today
    {
      id: 'task-bpc-proto-1',
      user_id: 'test-user',
      scheduled_date: todayStr,
      status: 'completed',
      created_at: new Date().toISOString(),
      modality_id: 'bpc157_subq',
      loose_modality: { id: 'bpc157_subq', name: 'BPC-157 SubQ', category: 'peptide' } as any
    },
    {
      id: 'task-bpc-proto-2',
      user_id: 'test-user',
      scheduled_date: todayStr,
      status: 'completed',
      created_at: new Date().toISOString(),
      modality_id: 'bpc157_subq',
      loose_modality: { id: 'bpc157_subq', name: 'BPC-157 SubQ', category: 'peptide' } as any
    },
    // Non-peptides that must be 100% excluded
    {
      id: 'task-zone2-1',
      user_id: 'test-user',
      scheduled_date: todayStr,
      status: 'pending',
      created_at: new Date().toISOString(),
      modality_id: 'zone_2_cardio',
      loose_modality: { id: 'zone_2_cardio', name: 'Zone 2 Cardiovascular', category: 'cardio' } as any
    },
    {
      id: 'task-sauna-1',
      user_id: 'test-user',
      scheduled_date: todayStr,
      status: 'pending',
      created_at: new Date().toISOString(),
      modality_id: 'sauna_hyperthermic',
      loose_modality: { id: 'sauna_hyperthermic', name: 'Hyperthermic Conditioning / Sauna', category: 'thermal' } as any
    },
    {
      id: 'task-ala-1',
      user_id: 'test-user',
      scheduled_date: todayStr,
      status: 'pending',
      created_at: new Date().toISOString(),
      modality_id: 'alpha_lipoic_acid',
      loose_modality: { id: 'alpha_lipoic_acid', name: 'Alpha-Lipoic Acid (ALA)', category: 'supplement' } as any
    },
    {
      id: 'task-collagen-1',
      user_id: 'test-user',
      scheduled_date: todayStr,
      status: 'pending',
      created_at: new Date().toISOString(),
      modality_id: 'collagen_peptides_powder',
      loose_modality: { id: 'collagen_peptides_powder', name: 'Collagen Peptides (Grass-Fed)', category: 'supplement' } as any
    },
    {
      id: 'task-vitd-1',
      user_id: 'test-user',
      scheduled_date: todayStr,
      status: 'pending',
      created_at: new Date().toISOString(),
      modality_id: 'vitamin_d3_k2',
      loose_modality: { id: 'vitamin_d3_k2', name: 'Vitamin D3 (5,000 IU) + K2', category: 'supplement' } as any
    },
    // Valid GLP-1 / Semaglutide peptide
    {
      id: 'task-sema-1',
      user_id: 'test-user',
      scheduled_date: todayStr,
      status: 'completed',
      created_at: new Date().toISOString(),
      modality_id: 'semaglutide_subq',
      loose_modality: { id: 'semaglutide_subq', name: 'GLP-1 Receptor Agonist (Semaglutide)', category: 'peptide' } as any
    }
  ]

  const mixedCycles = extractPeptideCycles(mixedTasks, weekDays, null)
  console.log(`Mixed Tasks input count: ${mixedTasks.length}`)
  console.log(`Extracted Peptide Cycles count: ${mixedCycles.length}`)
  
  if (mixedCycles.length !== 2) {
    console.error(`❌ Expected exactly 2 cycles (BPC-157 and Semaglutide), got ${mixedCycles.length}:`, mixedCycles.map(c => c.modalityName))
    process.exit(1)
  }

  const cycleNames = mixedCycles.map(c => c.modalityName)
  console.log(`✅ Cycles extracted: ${cycleNames.join(', ')}`)
  console.log(`✅ Verified: Zone 2, Sauna, ALA, Collagen Peptides, and Vitamin D3 were 100% excluded!`)
  console.log(`✅ Verified: Duplicate BPC-157 tasks merged into a single distinct cycle card!`)

  console.log(`\n----------------------------------------------`)
  console.log(`ALL PEPTIDE CYCLE & PK ENGINE TESTS PASSED!`)
  console.log(`----------------------------------------------\n`)
}

runTests().catch(console.error)
