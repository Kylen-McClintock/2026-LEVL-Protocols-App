import { supabase } from '@/lib/supabase/client'
import { BiomarkerMeasurementRecord, UserLabPanel, BioAgeResult, SystemAgingStatus, BiologicalSystem } from '../aging-models/bioAgeTypes'
import { BIOMARKER_REGISTRY, resolveCanonicalBiomarkerId } from '../aging-models/biomarkerRegistry'
import { calculateBioAge } from '../aging-models/bioAgeModel'

const LOCAL_PANELS_KEY_PREFIX = 'levl_lab_panels_'
const LOCAL_MEASUREMENTS_KEY_PREFIX = 'levl_biomarkers_'

/**
 * Ensures a date string is in valid YYYY-MM-DD format
 */
function sanitizeDate(dateStr?: string): string {
  if (dateStr && !isNaN(Date.parse(dateStr))) {
    try {
      return new Date(dateStr).toISOString().split('T')[0]
    } catch {
      // Fallback
    }
  }
  return new Date().toISOString().split('T')[0]
}

/**
 * Saves a complete lab panel and its extracted biomarker measurements
 */
export async function saveLabPanel(
  userId: string,
  collectionDate: string,
  providerName: string,
  sourceFiles: string[],
  measurements: Array<{
    raw_name: string
    raw_value: number
    raw_unit: string
    normalized_value: number
    normalized_unit: string
    lab_reference_range?: string
    lab_flag?: 'normal' | 'high' | 'low' | 'critical'
    extraction_confidence?: number
    user_corrected?: boolean
    biomarker_id?: string
  }>,
  userProfile: { chronological_age?: number; sex?: 'male' | 'female' } = {}
): Promise<UserLabPanel> {
  const chronoAge = userProfile.chronological_age || 35
  const sex = userProfile.sex || 'male'
  const safeDate = sanitizeDate(collectionDate)
  const panelId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `panel_${Date.now()}`

  // Prepare normalized biomarker records
  const validMeasurements: BiomarkerMeasurementRecord[] = measurements.map(m => {
    const canonicalId = m.biomarker_id || resolveCanonicalBiomarkerId(m.raw_name) || 'unknown'
    return {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `m_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      panel_id: panelId,
      user_id: userId,
      biomarker_id: canonicalId,
      raw_name: m.raw_name,
      raw_value: Number(m.raw_value),
      raw_unit: m.raw_unit,
      normalized_value: Number(m.normalized_value),
      normalized_unit: m.normalized_unit,
      lab_reference_range: m.lab_reference_range || '',
      lab_flag: m.lab_flag || 'normal',
      extraction_confidence: m.extraction_confidence ?? 1.0,
      user_corrected: m.user_corrected || false,
      collection_date: safeDate
    }
  })

  // Get previous measurements to form cumulative set
  const existingLatest = await getLatestBiomarkerMeasurements(userId)
  const cumulativeMap = new Map<string, BiomarkerMeasurementRecord>()
  existingLatest.forEach(m => cumulativeMap.set(m.biomarker_id, m))
  validMeasurements.forEach(m => cumulativeMap.set(m.biomarker_id, m))
  const cumulativeMeasurements = Array.from(cumulativeMap.values())

  // Compute BioAge Result on cumulative biomarkers
  const bioAgeResult = calculateBioAge(chronoAge, sex, cumulativeMeasurements)

  const newPanel: UserLabPanel = {
    id: panelId,
    user_id: userId,
    collection_date: safeDate,
    upload_date: new Date().toISOString(),
    provider_name: providerName || 'Standard Health Lab',
    source_files: sourceFiles,
    bioage_outputs: bioAgeResult,
    measurements: validMeasurements
  }

  // 1. Save to localStorage for instant UI reactivity and offline resilience
  if (typeof window !== 'undefined') {
    try {
      const pKey = `${LOCAL_PANELS_KEY_PREFIX}${userId}`
      const mKey = `${LOCAL_MEASUREMENTS_KEY_PREFIX}${userId}`

      const existingPanelsRaw = localStorage.getItem(pKey)
      const existingPanels: UserLabPanel[] = existingPanelsRaw ? JSON.parse(existingPanelsRaw) : []
      const updatedPanels = [newPanel, ...existingPanels]
      localStorage.setItem(pKey, JSON.stringify(updatedPanels))

      const existingMeasRaw = localStorage.getItem(mKey)
      const existingMeas: BiomarkerMeasurementRecord[] = existingMeasRaw ? JSON.parse(existingMeasRaw) : []
      const updatedMeas = [...validMeasurements, ...existingMeas]
      localStorage.setItem(mKey, JSON.stringify(updatedMeas))

      window.dispatchEvent(new CustomEvent('levl_lab_panels_updated', { detail: updatedPanels }))
    } catch (err) {
      console.warn('LocalStorage save error:', err)
    }
  }

  // 2. Cloud Supabase Sync (non-blocking graceful fallback)
  try {
    if (supabase) {
      const { data: dbPanel, error: pErr } = await supabase
        .from('user_lab_panels')
        .insert({
          user_id: userId,
          collection_date: safeDate,
          provider_name: newPanel.provider_name,
          source_files: sourceFiles,
          bioage_outputs: bioAgeResult
        })
        .select()
        .single()

      if (!pErr && dbPanel) {
        const cloudRecords = validMeasurements.map(r => ({
          panel_id: dbPanel.id,
          user_id: userId,
          biomarker_id: r.biomarker_id,
          raw_name: r.raw_name,
          raw_value: r.raw_value,
          raw_unit: r.raw_unit,
          normalized_value: r.normalized_value,
          normalized_unit: r.normalized_unit,
          lab_reference_range: r.lab_reference_range,
          lab_flag: r.lab_flag,
          extraction_confidence: r.extraction_confidence,
          user_corrected: r.user_corrected,
          collection_date: safeDate
        }))

        await supabase.from('biomarker_measurements').insert(cloudRecords)
        await supabase.from('bioage_calculation_logs').insert({
          user_id: userId,
          panel_id: dbPanel.id,
          chronological_age: chronoAge,
          sex,
          kdm_age: bioAgeResult.kdm_age,
          pheno_age: bioAgeResult.pheno_age,
          hd_score: bioAgeResult.hd_score,
          provenance: bioAgeResult.provenance
        })
      }
    }
  } catch (err) {
    console.warn('Supabase cloud sync skipped for lab panel (local fallback active):', err)
  }

  return newPanel
}

/**
 * Fetches all lab panels for a user
 */
export async function getUserLabPanels(userId: string): Promise<UserLabPanel[]> {
  // Check localStorage first
  let localPanels: UserLabPanel[] = []
  if (typeof window !== 'undefined') {
    try {
      const pKey = `${LOCAL_PANELS_KEY_PREFIX}${userId}`
      const raw = localStorage.getItem(pKey)
      if (raw) {
        localPanels = JSON.parse(raw)
      }

      // Auto-Recovery: If no panels found for current userId, scan localStorage for panels saved under earlier session IDs
      if ((!localPanels || localPanels.length === 0)) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith(LOCAL_PANELS_KEY_PREFIX) && key !== pKey) {
            try {
              const legacyRaw = localStorage.getItem(key)
              if (legacyRaw) {
                const legacyPanels: UserLabPanel[] = JSON.parse(legacyRaw)
                if (Array.isArray(legacyPanels) && legacyPanels.length > 0) {
                  localPanels = legacyPanels
                  // Re-bind to current active userId so it persists reliably
                  localStorage.setItem(pKey, JSON.stringify(localPanels))
                  break
                }
              }
            } catch {
              // Ignore legacy format errors
            }
          }
        }
      }
    } catch (err) {
      console.warn('LocalStorage read error:', err)
    }
  }

  // Check Supabase cloud
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('user_lab_panels')
        .select('*')
        .eq('user_id', userId)
        .order('collection_date', { ascending: false })

      if (!error && data && data.length > 0) {
        return data
      }
    }
  } catch (err) {
    console.warn('Supabase fetch skipped for lab panels:', err)
  }

  return localPanels
}

/**
 * Fetches all historical biomarker measurements for a user (without deduplication)
 */
export async function getAllBiomarkerMeasurements(userId: string): Promise<BiomarkerMeasurementRecord[]> {
  let localMeas: BiomarkerMeasurementRecord[] = []
  if (typeof window !== 'undefined') {
    try {
      const mKey = `${LOCAL_MEASUREMENTS_KEY_PREFIX}${userId}`
      const raw = localStorage.getItem(mKey)
      if (raw) {
        localMeas = JSON.parse(raw)
      }

      // Auto-Recovery: Scan for legacy measurements if empty
      if ((!localMeas || localMeas.length === 0)) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith(LOCAL_MEASUREMENTS_KEY_PREFIX) && key !== mKey) {
            try {
              const legacyRaw = localStorage.getItem(key)
              if (legacyRaw) {
                const legacyItems: BiomarkerMeasurementRecord[] = JSON.parse(legacyRaw)
                if (Array.isArray(legacyItems) && legacyItems.length > 0) {
                  localMeas = legacyItems
                  localStorage.setItem(mKey, JSON.stringify(localMeas))
                  break
                }
              }
            } catch {
              // Ignore legacy format errors
            }
          }
        }
      }
    } catch (err) {
      console.warn('LocalStorage read error:', err)
    }
  }

  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('biomarker_measurements')
        .select('*')
        .eq('user_id', userId)
        .order('collection_date', { ascending: false })

      if (!error && data && data.length > 0) {
        localMeas = data
      }
    }
  } catch (err) {
    console.warn('Supabase fetch skipped for biomarkers:', err)
  }

  return localMeas.map(m => ({
    ...m,
    raw_value: Number(m.raw_value),
    normalized_value: Number(m.normalized_value)
  }))
}

/**
 * Fetches latest deduplicated biomarker measurements for a user
 */
export async function getLatestBiomarkerMeasurements(userId: string): Promise<BiomarkerMeasurementRecord[]> {
  const allMeas = await getAllBiomarkerMeasurements(userId)

  const latestMap = new Map<string, BiomarkerMeasurementRecord>()
  allMeas.forEach(m => {
    if (!latestMap.has(m.biomarker_id)) {
      latestMap.set(m.biomarker_id, m)
    }
  })

  return Array.from(latestMap.values())
}

/**
 * Updates an individual biomarker measurement (value, unit, name, or canonical id)
 */
export async function updateBiomarkerMeasurement(
  userId: string,
  target: { id?: string; biomarker_id?: string; panel_id?: string; raw_name?: string },
  updates: Partial<BiomarkerMeasurementRecord>
): Promise<boolean> {
  const isMatch = (m: BiomarkerMeasurementRecord) => {
    if (target.id && m.id === target.id) return true
    if (target.biomarker_id && target.panel_id && m.biomarker_id === target.biomarker_id && m.panel_id === target.panel_id) return true
    if (target.raw_name && target.panel_id && m.raw_name === target.raw_name && m.panel_id === target.panel_id) return true
    return false
  }

  if (typeof window !== 'undefined') {
    try {
      const mKey = `${LOCAL_MEASUREMENTS_KEY_PREFIX}${userId}`
      const raw = localStorage.getItem(mKey)
      if (raw) {
        let list: BiomarkerMeasurementRecord[] = JSON.parse(raw)
        list = list.map(m => isMatch(m) ? { ...m, ...updates, user_corrected: true } : m)
        localStorage.setItem(mKey, JSON.stringify(list))
      }

      const pKey = `${LOCAL_PANELS_KEY_PREFIX}${userId}`
      const pRaw = localStorage.getItem(pKey)
      if (pRaw) {
        let panels: UserLabPanel[] = JSON.parse(pRaw)
        panels = panels.map(p => {
          if (p.measurements) {
            p.measurements = p.measurements.map(m => isMatch(m) ? { ...m, ...updates, user_corrected: true } : m)
          }
          return p
        })
        localStorage.setItem(pKey, JSON.stringify(panels))
      }
    } catch (err) {
      console.warn('LocalStorage update error:', err)
    }
  }

  try {
    if (supabase && target.id) {
      await supabase
        .from('biomarker_measurements')
        .update({ ...updates, user_corrected: true })
        .eq('id', target.id)
    }
  } catch (err) {
    console.warn('Supabase update error:', err)
  }

  return true
}

/**
 * Deletes an individual biomarker measurement
 */
export async function deleteBiomarkerMeasurement(
  userId: string,
  target: { id?: string; biomarker_id?: string; panel_id?: string; raw_name?: string }
): Promise<boolean> {
  const isMatch = (m: BiomarkerMeasurementRecord) => {
    if (target.id && m.id === target.id) return true
    if (target.biomarker_id && target.panel_id && m.biomarker_id === target.biomarker_id && m.panel_id === target.panel_id) return true
    if (target.raw_name && target.panel_id && m.raw_name === target.raw_name && m.panel_id === target.panel_id) return true
    return false
  }

  if (typeof window !== 'undefined') {
    try {
      const mKey = `${LOCAL_MEASUREMENTS_KEY_PREFIX}${userId}`
      const raw = localStorage.getItem(mKey)
      if (raw) {
        let list: BiomarkerMeasurementRecord[] = JSON.parse(raw)
        list = list.filter(m => !isMatch(m))
        localStorage.setItem(mKey, JSON.stringify(list))
      }

      const pKey = `${LOCAL_PANELS_KEY_PREFIX}${userId}`
      const pRaw = localStorage.getItem(pKey)
      if (pRaw) {
        let panels: UserLabPanel[] = JSON.parse(pRaw)
        panels = panels.map(p => {
          if (p.measurements) {
            p.measurements = p.measurements.filter(m => !isMatch(m))
          }
          return p
        })
        localStorage.setItem(pKey, JSON.stringify(panels))
      }
    } catch (err) {
      console.warn('LocalStorage delete error:', err)
    }
  }

  try {
    if (supabase && target.id) {
      await supabase
        .from('biomarker_measurements')
        .delete()
        .eq('id', target.id)
    }
  } catch (err) {
    console.warn('Supabase delete error:', err)
  }

  return true
}

/**
 * Computes system aging statuses across the 8 biological systems
 */
export function calculateSystemAgingStatuses(
  measurements: BiomarkerMeasurementRecord[],
  bioAgeResult?: BioAgeResult | null
): SystemAgingStatus[] {
  const systems: BiologicalSystem[] = [
    'cardiovascular',
    'brain',
    'metabolic',
    'immune',
    'kidney',
    'liver',
    'lung',
    'musculoskeletal'
  ]

  const systemNames: Record<BiologicalSystem, string> = {
    cardiovascular: 'Heart & Cardiovascular',
    brain: 'Brain & Neuromotor',
    metabolic: 'Metabolic Health',
    immune: 'Immune & Inflammatory',
    kidney: 'Kidney Health',
    liver: 'Liver & Protein',
    lung: 'Lung & Respiratory',
    musculoskeletal: 'Musculoskeletal'
  }

  const systemIcons: Record<BiologicalSystem, string> = {
    cardiovascular: 'HeartPulse',
    brain: 'Brain',
    metabolic: 'Zap',
    immune: 'Shield',
    kidney: 'Activity',
    liver: 'Flame',
    lung: 'Wind',
    musculoskeletal: 'Dumbbell'
  }

  return systems.map(system => {
    const systemBiomarkers = measurements.filter(m => {
      const def = BIOMARKER_REGISTRY[m.biomarker_id]
      return def && (def.system === system || def.secondary_systems?.includes(system))
    })

    const totalSystemDefs = Object.values(BIOMARKER_REGISTRY).filter(
      def => def.system === system || def.secondary_systems?.includes(system)
    ).length

    if (system === 'lung' && bioAgeResult?.kdm_age) {
      return {
        system,
        display_name: systemNames[system],
        icon_name: systemIcons[system],
        status_type: 'valid_age',
        calculated_age: bioAgeResult.kdm_age,
        age_gap: bioAgeResult.kdm_age_gap || 0,
        unlocked_biomarker_count: systemBiomarkers.length,
        total_system_biomarkers: totalSystemDefs,
        top_biomarkers: systemBiomarkers
      }
    }

    if (systemBiomarkers.length > 0) {
      // Check if all biomarkers are in optimal zone
      const allOptimal = systemBiomarkers.every(m => {
        const def = BIOMARKER_REGISTRY[m.biomarker_id]
        if (!def) return true
        return m.normalized_value >= def.levl_optimal_zone.min && m.normalized_value <= def.levl_optimal_zone.max
      })

      return {
        system,
        display_name: systemNames[system],
        icon_name: systemIcons[system],
        status_type: 'useful_data',
        health_status_label: allOptimal ? 'Optimal Longevity Zone' : 'Opportunity to Optimize',
        unlocked_biomarker_count: systemBiomarkers.length,
        total_system_biomarkers: totalSystemDefs,
        top_biomarkers: systemBiomarkers
      }
    }

    return {
      system,
      display_name: systemNames[system],
      icon_name: systemIcons[system],
      status_type: 'insufficient_data',
      unlocked_biomarker_count: 0,
      total_system_biomarkers: totalSystemDefs,
      unlock_prompt: `Add ${system === 'brain' ? 'reaction time' : system === 'cardiovascular' ? 'ApoB or BP' : 'labs'} to unlock.`,
      top_biomarkers: []
    }
  })
}
