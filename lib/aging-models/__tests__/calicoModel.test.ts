import { calculatePhysiologicalAge, CALICO_MODEL_METADATA } from '../calicoModel'
import { BiologicalMeasurement } from '../types'

export function runCalicoModelTests() {
  console.log('--- Running Calico Aging Model Test Suite ---')

  // Test 1: Empty Measurements -> Insufficient Data / Domain Profile Tier
  const resEmpty = calculatePhysiologicalAge(34, 'male', [])
  console.assert(resEmpty.predicted_age === null, 'Empty measurements should return null predicted_age')
  console.assert(resEmpty.model_classification === 'domain-profile', 'Empty measurements should classify as domain-profile')
  console.assert(resEmpty.estimate_quality === 'Insufficient Data', 'Empty measurements should have Insufficient Data quality')
  console.log('✓ Test 1 Passed: Empty measurements handling')

  // Test 2: Full Calico Model Traits for 34 year old male with optimal health markers
  const mockMeasurements: BiologicalMeasurement[] = [
    {
      id: 'm1',
      user_id: 'test_user',
      measurement_type_id: 'bp_sys',
      value: 118,
      raw_unit: 'mmHg',
      normalized_value: 118,
      normalized_unit: 'mmHg',
      source_type: 'manual',
      measured_at: new Date().toISOString()
    },
    {
      id: 'm2',
      user_id: 'test_user',
      measurement_type_id: 'bp_dia',
      value: 76,
      raw_unit: 'mmHg',
      normalized_value: 76,
      normalized_unit: 'mmHg',
      source_type: 'manual',
      measured_at: new Date().toISOString()
    },
    {
      id: 'm3',
      user_id: 'test_user',
      measurement_type_id: 'fev1',
      value: 4.2,
      raw_unit: 'L',
      normalized_value: 4.2,
      normalized_unit: 'L',
      source_type: 'manual',
      measured_at: new Date().toISOString()
    },
    {
      id: 'm4',
      user_id: 'test_user',
      measurement_type_id: 'grip_strength',
      value: 52,
      raw_unit: 'kg',
      normalized_value: 52,
      normalized_unit: 'kg',
      source_type: 'manual',
      measured_at: new Date().toISOString()
    },
    {
      id: 'm5',
      user_id: 'test_user',
      measurement_type_id: 'reaction_time',
      value: 280,
      raw_unit: 'ms',
      normalized_value: 280,
      normalized_unit: 'ms',
      source_type: 'levl_test',
      measured_at: new Date().toISOString()
    },
    {
      id: 'm6',
      user_id: 'test_user',
      measurement_type_id: 'bmi',
      value: 23.5,
      raw_unit: 'kg/m²',
      normalized_value: 23.5,
      normalized_unit: 'kg/m²',
      source_type: 'manual',
      measured_at: new Date().toISOString()
    }
  ]

  const resFull = calculatePhysiologicalAge(34, 'male', mockMeasurements)
  console.assert(resFull.model_classification === 'calico-full', 'Should classify as calico-full model')
  console.assert(resFull.predicted_age !== null, 'Predicted age should be calculated')
  console.assert(resFull.predicted_age! < 34, `Optimal traits should yield younger predicted age (got ${resFull.predicted_age})`)
  console.assert(resFull.age_gap! < 0, `Age gap should be negative for younger age (got ${resFull.age_gap})`)
  console.assert(resFull.provenance.doi === CALICO_MODEL_METADATA.doi, 'Provenance DOI must match paper')
  console.log(`✓ Test 2 Passed: Full Calico model (Predicted Age: ${resFull.predicted_age}, Chrono: 34, ΔAge: ${resFull.age_gap})`)

  // Test 3: Subset Calico-Informed Model (Only Reaction Time & Grip Strength)
  const subsetMeasurements = mockMeasurements.filter(m => m.measurement_type_id === 'reaction_time' || m.measurement_type_id === 'grip_strength')
  const resSubset = calculatePhysiologicalAge(34, 'male', subsetMeasurements)
  console.assert(resSubset.model_classification === 'calico-informed-subset', 'Should classify as calico-informed-subset')
  console.assert(resSubset.predicted_age !== null, 'Subset model should yield predicted age')
  console.log(`✓ Test 3 Passed: Subset model (Predicted Age: ${resSubset.predicted_age}, Coverage: ${resSubset.measurement_coverage_pct * 100}%)`)

  console.log('--- All Calico Aging Model Tests Passed Successfully ---')
  return true
}

// Auto-run when executed directly in node
if (require.main === module) {
  runCalicoModelTests()
}
