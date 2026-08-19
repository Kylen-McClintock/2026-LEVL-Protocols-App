'use client'

import { format } from 'date-fns'
import { DailyMealLogEntry, UserNutritionTargets, CircadianFastingState, UserProfile } from '../types'
import { saveQuickLogEntry, deleteQuickLogEntry, loadQuickLogsForDate } from './quickLogsStorage'

const MEALS_STORAGE_KEY_PREFIX = 'levl_nutrition_meals_'
const TARGETS_STORAGE_KEY_PREFIX = 'levl_nutrition_targets_'

/**
 * Load all meals logged for a given user and date (YYYY-MM-DD)
 */
export async function loadDailyMealLogs(localUserId: string, date: string): Promise<DailyMealLogEntry[]> {
  if (typeof window === 'undefined' || !localUserId) return []
  try {
    const raw = localStorage.getItem(`${MEALS_STORAGE_KEY_PREFIX}${localUserId}`)
    if (!raw) return []
    const allMeals: DailyMealLogEntry[] = JSON.parse(raw)
    return allMeals
      .filter(m => m.date === date)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  } catch (err) {
    console.error('Error loading daily meal logs:', err)
    return []
  }
}

/**
 * Load all meals logged across all dates for stats/history
 */
export async function loadAllMealLogs(localUserId: string): Promise<DailyMealLogEntry[]> {
  if (typeof window === 'undefined' || !localUserId) return []
  try {
    const raw = localStorage.getItem(`${MEALS_STORAGE_KEY_PREFIX}${localUserId}`)
    if (!raw) return []
    return JSON.parse(raw)
  } catch (err) {
    console.error('Error loading all meal logs:', err)
    return []
  }
}

/**
 * Save a new or updated meal entry
 */
export async function saveDailyMealLog(entry: DailyMealLogEntry): Promise<void> {
  if (typeof window === 'undefined' || !entry.local_user_id) return
  try {
    const raw = localStorage.getItem(`${MEALS_STORAGE_KEY_PREFIX}${entry.local_user_id}`)
    const allMeals: DailyMealLogEntry[] = raw ? JSON.parse(raw) : []
    
    const existingIdx = allMeals.findIndex(m => m.id === entry.id)
    if (existingIdx >= 0) {
      allMeals[existingIdx] = entry
    } else {
      allMeals.push(entry)
    }

    localStorage.setItem(`${MEALS_STORAGE_KEY_PREFIX}${entry.local_user_id}`, JSON.stringify(allMeals))

    // Sync to hotkey quick-logs for protein pulses & macros
    if (entry.protein_g > 0) {
      await saveQuickLogEntry({
        id: `qlog_meal_${entry.id}`,
        local_user_id: entry.local_user_id,
        date: entry.date,
        hotkey_id: 'protein_pulse',
        hotkey_name: 'Protein Pulse',
        value: entry.protein_g,
        unit: 'g',
        logged_at: entry.timestamp,
        notes: `${entry.meal_name} (${entry.calories} kcal)`
      })
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('levl_nutrition_updated', { detail: { date: entry.date } }))
      window.dispatchEvent(new CustomEvent('levl_quicklog_updated', { detail: { date: entry.date } }))
    }
  } catch (err) {
    console.error('Error saving meal log:', err)
  }
}

/**
 * Delete a meal log entry by ID
 */
export async function deleteDailyMealLog(localUserId: string, mealId: string): Promise<void> {
  if (typeof window === 'undefined' || !localUserId) return
  try {
    const raw = localStorage.getItem(`${MEALS_STORAGE_KEY_PREFIX}${localUserId}`)
    if (!raw) return
    const allMeals: DailyMealLogEntry[] = JSON.parse(raw)
    const targetMeal = allMeals.find(m => m.id === mealId)
    const filtered = allMeals.filter(m => m.id !== mealId)
    localStorage.setItem(`${MEALS_STORAGE_KEY_PREFIX}${localUserId}`, JSON.stringify(filtered))

    // Also delete linked quick log entry
    await deleteQuickLogEntry(localUserId, `qlog_meal_${mealId}`)

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('levl_nutrition_updated', { detail: { date: targetMeal?.date } }))
      window.dispatchEvent(new CustomEvent('levl_quicklog_updated', { detail: { date: targetMeal?.date } }))
    }
  } catch (err) {
    console.error('Error deleting meal log:', err)
  }
}

/**
 * Get personalized nutrition targets or compute science-backed defaults
 */
export async function getNutritionTargets(localUserId: string, userProfile?: UserProfile | null): Promise<UserNutritionTargets> {
  const weightLbs = userProfile?.weight_lbs || 175
  const isFemale = (userProfile?.biological_sex || '').toLowerCase() === 'female'

  const defaultCalories = Math.round(weightLbs * (isFemale ? 12.5 : 13.5))
  const defaultProtein = Math.round(weightLbs * 0.9) // 0.9g per lb (~2.0g/kg)
  const defaultFat = Math.round((defaultCalories * 0.30) / 9)
  const defaultCarbs = Math.round((defaultCalories - (defaultProtein * 4 + defaultFat * 9)) / 4)

  const fallback: UserNutritionTargets = {
    daily_calories: defaultCalories,
    protein_g: defaultProtein,
    carbs_g: defaultCarbs,
    fat_g: defaultFat,
    veggie_servings: 5.0,
    fruit_servings: 2.0,
    target_fasting_hours: 16,
    eating_window_start_target: '12:00',
    eating_window_end_target: '20:00'
  }

  if (typeof window === 'undefined' || !localUserId) return fallback

  try {
    const raw = localStorage.getItem(`${TARGETS_STORAGE_KEY_PREFIX}${localUserId}`)
    if (!raw) return fallback
    return { ...fallback, ...JSON.parse(raw) }
  } catch (err) {
    console.error('Error loading nutrition targets:', err)
    return fallback
  }
}

/**
 * Persist customized nutrition targets
 */
export async function saveNutritionTargets(localUserId: string, targets: UserNutritionTargets): Promise<void> {
  if (typeof window === 'undefined' || !localUserId) return
  try {
    localStorage.setItem(`${TARGETS_STORAGE_KEY_PREFIX}${localUserId}`, JSON.stringify(targets))
    window.dispatchEvent(new CustomEvent('levl_nutrition_targets_updated', { detail: targets }))
  } catch (err) {
    console.error('Error saving nutrition targets:', err)
  }
}

const FASTING_OVERRIDES_KEY_PREFIX = 'levl_fasting_override_'

export interface DailyFastingOverride {
  first_meal_time?: string // HH:mm
  last_meal_time?: string // HH:mm
}

export function getDailyFastingOverride(localUserId: string, date: string): DailyFastingOverride | null {
  if (typeof window === 'undefined' || !localUserId) return null
  try {
    const raw = localStorage.getItem(`${FASTING_OVERRIDES_KEY_PREFIX}${localUserId}_${date}`)
    return raw ? JSON.parse(raw) : null
  } catch (err) {
    return null
  }
}

export function saveDailyFastingOverride(localUserId: string, date: string, override: DailyFastingOverride): void {
  if (typeof window === 'undefined' || !localUserId) return
  try {
    localStorage.setItem(`${FASTING_OVERRIDES_KEY_PREFIX}${localUserId}_${date}`, JSON.stringify(override))
    window.dispatchEvent(new CustomEvent('levl_nutrition_updated', { detail: { date } }))
  } catch (err) {
    console.error('Error saving fasting override:', err)
  }
}

/**
 * Calculate dynamic Circadian Fasting & Eating Window state from logged meals and optional overrides
 */
export function calculateCircadianFastingState(
  meals: DailyMealLogEntry[],
  targetFastingHours: number = 16,
  override?: DailyFastingOverride | null,
  date?: string
): CircadianFastingState {
  const targetDateStr = date || format(new Date(), 'yyyy-MM-dd')

  let firstMealDate: Date | null = null
  let lastMealDate: Date | null = null

  if (override?.first_meal_time) {
    const [h, m] = override.first_meal_time.split(':').map(Number)
    firstMealDate = new Date(`${targetDateStr}T12:00:00`)
    firstMealDate.setHours(h || 12, m || 0, 0, 0)
  }

  if (override?.last_meal_time) {
    const [h, m] = override.last_meal_time.split(':').map(Number)
    lastMealDate = new Date(`${targetDateStr}T12:00:00`)
    lastMealDate.setHours(h || 20, m || 0, 0, 0)
  }

  if (meals && meals.length > 0) {
    const sorted = [...meals].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    const mealFirst = new Date(sorted[0].timestamp)
    const mealLast = new Date(sorted[sorted.length - 1].timestamp)

    if (!firstMealDate || mealFirst.getTime() < firstMealDate.getTime()) {
      firstMealDate = mealFirst
    }
    if (!lastMealDate || mealLast.getTime() > lastMealDate.getTime()) {
      lastMealDate = mealLast
    }
  }

  if (!firstMealDate) {
    return {
      first_meal_time: null,
      last_meal_time: null,
      eating_window_hours: 0,
      current_fast_hours: 0,
      is_currently_fasting: true,
      target_fast_hours: targetFastingHours
    }
  }

  if (!lastMealDate) {
    lastMealDate = firstMealDate
  }

  const now = new Date()
  const windowDiffMs = Math.max(0, lastMealDate.getTime() - firstMealDate.getTime())
  const eatingWindowHours = windowDiffMs === 0 ? 0.75 : Math.round((windowDiffMs / (1000 * 60 * 60)) * 10) / 10

  const fastDiffMs = Math.max(0, now.getTime() - lastMealDate.getTime())
  const currentFastHours = Math.round((fastDiffMs / (1000 * 60 * 60)) * 10) / 10
  const isCurrentlyFasting = fastDiffMs > 30 * 60 * 1000

  return {
    first_meal_time: firstMealDate.toISOString(),
    last_meal_time: lastMealDate.toISOString(),
    eating_window_hours: eatingWindowHours,
    current_fast_hours: currentFastHours,
    is_currently_fasting: isCurrentlyFasting,
    target_fast_hours: targetFastingHours
  }
}
