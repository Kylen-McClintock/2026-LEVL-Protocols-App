import { supabase } from '../supabase/client'
import { BiologicalMeasurement, PhysiologicalAgeResult } from '../aging-models/types'
import { MEASUREMENT_REGISTRY } from '../aging-models/measurementRegistry'
import { calculatePhysiologicalAge } from '../aging-models/calicoModel'

const STORAGE_MEASUREMENTS_PREFIX = 'levl_bio_measurements_'
const STORAGE_SCORES_PREFIX = 'levl_bio_age_scores_'

export async function saveBiologicalMeasurement(
  userId: string,
  measurementTypeId: string,
  value: number,
  unit: string,
  options: {
    laterality?: BiologicalMeasurement['laterality']
    trialNumber?: number
    totalTrials?: number
    trialValues?: number[]
    sourceType?: BiologicalMeasurement['source_type']
    sourceDevice?: string
    notes?: string
  } = {}
): Promise<BiologicalMeasurement> {
  const registryEntry = MEASUREMENT_REGISTRY[measurementTypeId]
  const normUnit = registryEntry?.primary_unit || unit
  const normValue = registryEntry?.unit_conversion_to_primary 
    ? registryEntry.unit_conversion_to_primary(value, unit) 
    : value

  const newMeasurement: BiologicalMeasurement = {
    id: `meas_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    user_id: userId,
    measurement_type_id: measurementTypeId,
    value,
    raw_unit: unit,
    normalized_value: normValue,
    normalized_unit: normUnit,
    laterality: options.laterality || 'none',
    trial_number: options.trialNumber || 1,
    total_trials: options.totalTrials || 1,
    trial_values: options.trialValues || [value],
    source_type: options.sourceType || 'manual',
    source_device: options.sourceDevice,
    ukbb_field_id: registryEntry?.ukbb_field_id,
    quality_score: 1.0,
    measured_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    notes: options.notes
  }

  // 1. Save to LocalStorage for instant UI reactivity
  if (typeof window !== 'undefined') {
    const key = `${STORAGE_MEASUREMENTS_PREFIX}${userId}`
    const existingRaw = localStorage.getItem(key)
    const existing: BiologicalMeasurement[] = existingRaw ? JSON.parse(existingRaw) : []
    const updated = [newMeasurement, ...existing]
    localStorage.setItem(key, JSON.stringify(updated))
    window.dispatchEvent(new CustomEvent('levl_measurements_updated', { detail: updated }))
  }

  // 2. Async sync to cloud Supabase if connected
  try {
    if (supabase) {
      await supabase.from('biological_measurements').insert({
        user_id: userId,
        measurement_type_id: newMeasurement.measurement_type_id,
        value: newMeasurement.value,
        raw_unit: newMeasurement.raw_unit,
        normalized_value: newMeasurement.normalized_value,
        normalized_unit: newMeasurement.normalized_unit,
        laterality: newMeasurement.laterality,
        trial_number: newMeasurement.trial_number,
        total_trials: newMeasurement.total_trials,
        trial_values: newMeasurement.trial_values,
        source_type: newMeasurement.source_type,
        source_device: newMeasurement.source_device,
        ukbb_field_id: newMeasurement.ukbb_field_id,
        quality_score: newMeasurement.quality_score,
        measured_at: newMeasurement.measured_at,
        notes: newMeasurement.notes
      })
    }
  } catch (err) {
    console.warn('Supabase sync skipped for biological measurement (local fallback active):', err)
  }

  return newMeasurement
}

export async function getBiologicalMeasurements(userId: string): Promise<BiologicalMeasurement[]> {
  let measurements: BiologicalMeasurement[] = []

  // 1. Try local storage first
  if (typeof window !== 'undefined') {
    const key = `${STORAGE_MEASUREMENTS_PREFIX}${userId}`
    const raw = localStorage.getItem(key)
    if (raw) {
      measurements = JSON.parse(raw)
    }
  }

  // 2. Fetch from Supabase if available
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('biological_measurements')
        .select('*')
        .eq('user_id', userId)
        .order('measured_at', { ascending: false })

      if (!error && data && data.length > 0) {
        measurements = data as BiologicalMeasurement[]
        if (typeof window !== 'undefined') {
          const key = `${STORAGE_MEASUREMENTS_PREFIX}${userId}`
          localStorage.setItem(key, JSON.stringify(measurements))
        }
      }
    }
  } catch (err) {
    console.warn('Supabase fetch error for measurements (using local storage):', err)
  }

  return measurements
}

export async function savePhysiologicalAgeScore(
  userId: string,
  result: PhysiologicalAgeResult
): Promise<void> {
  // 1. Save to local storage
  if (typeof window !== 'undefined') {
    const key = `${STORAGE_SCORES_PREFIX}${userId}`
    const existingRaw = localStorage.getItem(key)
    const existing: PhysiologicalAgeResult[] = existingRaw ? JSON.parse(existingRaw) : []
    const updated = [result, ...existing]
    localStorage.setItem(key, JSON.stringify(updated))
  }

  // 2. Sync to Supabase
  try {
    if (supabase) {
      await supabase.from('physiological_age_scores').insert({
        user_id: userId,
        predicted_age: result.predicted_age,
        chronological_age: result.chronological_age,
        age_gap: result.age_gap,
        model_classification: result.model_classification,
        model_version: result.model_version,
        doi: result.doi,
        measurement_coverage_pct: result.measurement_coverage_pct,
        represented_domains_count: result.represented_domains_count,
        validated_rmse_years: result.validated_rmse_years,
        estimate_quality: result.estimate_quality,
        provenance: result.provenance,
        domain_scores: result.domain_scores,
        calculated_at: new Date().toISOString()
      })
    }
  } catch (err) {
    console.warn('Supabase sync skipped for age score:', err)
  }
}
