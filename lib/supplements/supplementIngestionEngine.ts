'use client'

import { 
  upsertBenchItemOverride, 
  createCustomModality, 
  createDailyTask, 
  getModalities,
  getModalityById
} from '@/lib/data'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { format } from 'date-fns'

export interface ScannedIngredient {
  name: string
  form?: string
  amount: number
  unit: string
  elemental_amount?: string
  daily_value_percent?: number | null
  notes?: string
}

export interface SupplementScanResult {
  product_name: string
  brand_name?: string
  serving_size: string
  servings_per_container?: number | null
  is_combination: boolean
  primary_active_ingredient: string
  dosage_summary: string
  suggested_timing_slot: string
  suggested_instructions: string
  headline_benefit: string
  expanded_why: string
  matched_catalog_modality_id?: string | null
  ingredients: ScannedIngredient[]
  functional_outcomes_to_track: string[]
  confidence_score: number
}

/**
 * Uploads an image file or base64 data to Gemini Vision for supplement facts OCR
 */
export async function scanSupplementImage(fileOrBase64: File | string): Promise<SupplementScanResult> {
  const formData = new FormData()
  if (typeof fileOrBase64 === 'string') {
    formData.append('image', fileOrBase64)
  } else {
    formData.append('file', fileOrBase64)
  }

  const res = await fetch('/api/supplements/scan', {
    method: 'POST',
    body: formData
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to scan supplement label.')
  }

  const json = await res.json()
  return json.data as SupplementScanResult
}

/**
 * Ingests the scanned supplement into the user's personal protocol stack
 */
export async function applyScannedSupplementToUser(
  scan: SupplementScanResult,
  customConfig?: {
    customDose?: string
    customTimingSlot?: string
    scheduleToday?: boolean
    overrideModalityId?: string | null
  }
): Promise<{
  mode: 'single_matched' | 'custom_combination'
  modalityId: string
  modalityName: string
  dosage: string
  timingSlot: string
}> {
  const localUserId = getLocalUserId()
  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const effectiveTiming = customConfig?.customTimingSlot || scan.suggested_timing_slot || 'morning_supplement_stack'
  const effectiveDose = customConfig?.customDose || scan.dosage_summary || `${scan.serving_size}`

  // Check if we should treat as single-ingredient match
  const targetCatalogId = customConfig?.overrideModalityId !== undefined 
    ? customConfig.overrideModalityId 
    : scan.matched_catalog_modality_id

  if (!scan.is_combination && targetCatalogId) {
    // 1. Single Ingredient Match: Update dosage override on existing modality
    const modality = await getModalityById(targetCatalogId)
    const notes = `Scanned from ${scan.product_name}${scan.brand_name ? ` (${scan.brand_name})` : ''}. Serving: ${scan.serving_size}.`

    await upsertBenchItemOverride(
      localUserId,
      targetCatalogId,
      effectiveDose,
      effectiveTiming,
      notes
    )

    if (customConfig?.scheduleToday !== false) {
      try {
        await createDailyTask(localUserId, todayStr, targetCatalogId, effectiveTiming)
      } catch (err) {
        console.warn('Notice scheduling daily task:', err)
      }
    }

    return {
      mode: 'single_matched',
      modalityId: targetCatalogId,
      modalityName: modality?.name || scan.product_name,
      dosage: effectiveDose,
      timingSlot: effectiveTiming
    }
  } else {
    // 2. Combination Complex: Create a structured composite modality like LIFESPAN+ DeepCell
    const formattedIngredientsDose = scan.ingredients.length > 0
      ? `${scan.serving_size}: ` + scan.ingredients.map(i => `${i.name} ${i.amount}${i.unit}${i.form ? ` (${i.form})` : ''}`).join(', ')
      : effectiveDose

    const newModalityData = {
      name: scan.brand_name ? `${scan.product_name} (${scan.brand_name})` : scan.product_name,
      display_name: scan.product_name,
      category: 'Supplements & Nootropics',
      brief_description: `${scan.product_name} formulation containing ${scan.ingredients.map(i => `${i.name} ${i.amount}${i.unit}`).join(', ')}.`,
      headline_benefit: scan.headline_benefit || 'Nutritional & Cellular Optimization',
      expanded_why: scan.expanded_why || 'Multi-ingredient nutritional formulation designed for targeted biological support.',
      dose_or_exposure: formattedIngredientsDose,
      implementation_summary: `Take ${scan.serving_size} with water.`,
      instructions: scan.suggested_instructions || `Take ${scan.serving_size} as directed.`,
      default_timing_slot: effectiveTiming,
      functional_outcomes_to_track: scan.functional_outcomes_to_track || ['energy', 'sleep_quality'],
      cadence_layer: 'daily' as const,
      logging_type: 'supplement' as const
    }

    const created = await createCustomModality(localUserId, newModalityData)

    if (customConfig?.scheduleToday !== false && created?.id) {
      try {
        await createDailyTask(localUserId, todayStr, created.id, effectiveTiming)
      } catch (err) {
        console.warn('Notice scheduling custom daily task:', err)
      }
    }

    return {
      mode: 'custom_combination',
      modalityId: created?.id || 'custom_' + Date.now(),
      modalityName: newModalityData.display_name,
      dosage: formattedIngredientsDose,
      timingSlot: effectiveTiming
    }
  }
}
