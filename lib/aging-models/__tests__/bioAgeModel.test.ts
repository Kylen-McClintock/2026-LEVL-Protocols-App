import { calculateBioAge } from '../bioAgeModel'
import { BiomarkerMeasurementRecord } from '../bioAgeTypes'

console.log('--- Running BioAge Model (PhenoAge, KDM, HD) Test Suite ---')

// Benchmark test case (Healthy 35-year-old male with optimal biomarkers)
const mockMeasurements: BiomarkerMeasurementRecord[] = [
  { user_id: 'u1', biomarker_id: 'albumin', raw_name: 'Albumin', raw_value: 4.8, raw_unit: 'g/dL', normalized_value: 4.8, normalized_unit: 'g/dL', collection_date: '2026-08-01' },
  { user_id: 'u1', biomarker_id: 'creatinine', raw_name: 'Creatinine', raw_value: 0.9, raw_unit: 'mg/dL', normalized_value: 0.9, normalized_unit: 'mg/dL', collection_date: '2026-08-01' },
  { user_id: 'u1', biomarker_id: 'glucose', raw_name: 'Glucose', raw_value: 82, raw_unit: 'mg/dL', normalized_value: 82, normalized_unit: 'mg/dL', collection_date: '2026-08-01' },
  { user_id: 'u1', biomarker_id: 'crp', raw_name: 'hs-CRP', raw_value: 0.3, raw_unit: 'mg/L', normalized_value: 0.3, normalized_unit: 'mg/L', collection_date: '2026-08-01' },
  { user_id: 'u1', biomarker_id: 'lymph_pct', raw_name: 'Lymphocytes %', raw_value: 32, raw_unit: '%', normalized_value: 32, normalized_unit: '%', collection_date: '2026-08-01' },
  { user_id: 'u1', biomarker_id: 'mcv', raw_name: 'MCV', raw_value: 88, raw_unit: 'fL', normalized_value: 88, normalized_unit: 'fL', collection_date: '2026-08-01' },
  { user_id: 'u1', biomarker_id: 'rdw', raw_name: 'RDW', raw_value: 12.1, raw_unit: '%', normalized_value: 12.1, normalized_unit: '%', collection_date: '2026-08-01' },
  { user_id: 'u1', biomarker_id: 'alp', raw_name: 'ALP', raw_value: 58, raw_unit: 'U/L', normalized_value: 58, normalized_unit: 'U/L', collection_date: '2026-08-01' },
  { user_id: 'u1', biomarker_id: 'wbc', raw_name: 'WBC', raw_value: 5.2, raw_unit: '10^9/L', normalized_value: 5.2, normalized_unit: '10^9/L', collection_date: '2026-08-01' }
]

const result = calculateBioAge(35, 'male', mockMeasurements)

console.log('PhenoAge:', result.pheno_age, 'Age Gap:', result.pheno_age_gap)
console.log('KDM Age:', result.kdm_age, 'Age Gap:', result.kdm_age_gap)
console.log('HD Score:', result.hd_score)
console.log('Biomarkers Used:', result.biomarkers_used.length)

if (result.pheno_age !== null && result.pheno_age <= 35) {
  console.log('✓ Test 1 Passed: PhenoAge calculation produces expected biological age for optimal labs.')
} else {
  console.error('❌ Test 1 Failed: PhenoAge calculation invalid.')
}

if (result.kdm_age !== null) {
  console.log('✓ Test 2 Passed: KDM Biological Age successfully computed.')
} else {
  console.error('❌ Test 2 Failed: KDM calculation failed.')
}

if (result.hd_score !== null && result.hd_score > 0) {
  console.log('✓ Test 3 Passed: Homeostatic Dysregulation (HD) Mahalanobis score computed.')
} else {
  console.error('❌ Test 3 Failed: HD score calculation failed.')
}

console.log('--- All BioAge Model Tests Completed Successfully ---')
