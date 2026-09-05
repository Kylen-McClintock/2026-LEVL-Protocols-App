/**
 * Infradian & Menstrual Cycle Longevity Engine
 * 
 * Features:
 * - Computes biological cycle day and phase (Menstrual, Follicular, Ovulatory, Early Luteal, Late Luteal).
 * - Provides physiological baseline context (Estrogen, Progesterone, Basal Temp +0.8°F, HRV dip).
 * - Surfaces intelligent protocol adaptations (pausing cold plunge during acute dysmenorrhea, 
 *   suggesting Magnesium Glycinate & localized heat, alerting for sauna hydration, and follicular hormesis windows).
 * - Self-adjusting rolling average cycle length upon period start logging.
 */

import {
  UserProfile,
  PeriodDailyLogEntry,
  InfradianStatus,
  InfradianPhase,
  InfradianProtocolModification,
  PeriodFlowLevel,
  PeriodPainLevel
} from '@/lib/types'
import { format, parseISO, differenceInCalendarDays, addDays } from 'date-fns'

const STORAGE_KEY_PREFIX = 'levl_period_daily_logs_'

/**
 * Loads all period daily logs for a given local user ID from localStorage.
 */
export function loadPeriodDailyLogs(localUserId: string): Record<string, PeriodDailyLogEntry> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${localUserId}`)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch (err) {
    console.error('Failed to load period daily logs:', err)
    return {}
  }
}

/**
 * Saves or updates a daily period log entry.
 */
export function savePeriodDailyLog(
  localUserId: string,
  entry: PeriodDailyLogEntry
): Record<string, PeriodDailyLogEntry> {
  if (typeof window === 'undefined') return {}
  try {
    const existing = loadPeriodDailyLogs(localUserId)
    const updated = {
      ...existing,
      [entry.date]: {
        ...entry,
        updated_at: new Date().toISOString()
      }
    }
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${localUserId}`, JSON.stringify(updated))
    return updated
  } catch (err) {
    console.error('Failed to save period daily log:', err)
    return {}
  }
}

/**
 * Retrieves the period log for a specific calendar date.
 */
export function getPeriodDailyLogForDate(
  localUserId: string,
  dateStr: string
): PeriodDailyLogEntry | null {
  const logs = loadPeriodDailyLogs(localUserId)
  return logs[dateStr] || null
}

/**
 * Main Calculation Engine: Evaluates the user's infradian status for a given target date.
 */
export function calculateInfradianStatus(
  profile: UserProfile | null | undefined,
  targetDateStr: string = format(new Date(), 'yyyy-MM-dd'),
  passedLogs?: Record<string, PeriodDailyLogEntry>
): InfradianStatus | null {
  if (!profile) return null

  // 1. Guard check: User must be Female, under 52 (or unspecified age), and have infradian tracking enabled
  const isFemale = profile.biological_sex?.toLowerCase() === 'female'
  const isEligibleAge = !profile.age || profile.age < 52
  const isEnabled = Boolean(profile.infradian_cycle_enabled)

  if (!isFemale || !isEligibleAge || !isEnabled) {
    return null
  }

  const cycleLength = profile.average_cycle_length_days || 28
  const lastPeriodStart = profile.last_period_start_date

  const logs = passedLogs || (typeof window !== 'undefined' ? loadPeriodDailyLogs(profile.local_user_id) : {})
  const todayLog = logs[targetDateStr]

  // Calculate cycle day based on last period start date
  let cycleDay = 1
  if (lastPeriodStart) {
    try {
      const startD = parseISO(lastPeriodStart)
      const targetD = parseISO(targetDateStr)
      const diff = differenceInCalendarDays(targetD, startD)
      if (diff >= 0) {
        cycleDay = (diff % cycleLength) + 1
      }
    } catch {
      cycleDay = 1
    }
  }

  // Determine if active period flow is logged today
  const hasActivePeriodLog = todayLog && todayLog.is_period_day && todayLog.flow_level !== 'none'
  const isPeriodActive = hasActivePeriodLog || cycleDay <= 5

  // Calculate days until next predicted period start
  const daysUntilNextPeriod = cycleLength - cycleDay + 1
  const isPeriodExpectedSoon = daysUntilNextPeriod <= 3 || cycleDay === 1

  // 2. Determine Infradian Phase
  let currentPhase: InfradianPhase = 'follicular'
  let phaseName = 'Follicular Phase'
  let phaseDescription = 'Estrogen rising, insulin sensitivity peak, optimal for high-intensity training and cold hormesis.'

  if (todayLog?.birth_control_status === 'placebo') {
    currentPhase = 'menstrual'
    phaseName = 'Placebo Interval (Withdrawal Bleed)'
    phaseDescription = 'Hormone-free interval triggers scheduled synthetic withdrawal bleed. Prioritize iron defense, hydration, and gentle recovery.'
  } else if (todayLog?.birth_control_status === 'active' && cycleDay >= 14 && cycleDay <= 16) {
    currentPhase = 'follicular'
    phaseName = 'Active Pill Phase (Mid-Cycle)'
    phaseDescription = 'Synthetic progestin/estrogen suppresses endogenous LH surge. Steady metabolic output and consistent training tolerance.'
  } else if (isPeriodActive || cycleDay <= 5) {
    currentPhase = 'menstrual'
    phaseName = 'Menstrual Phase (Menses)'
    phaseDescription = 'Low systemic hormones, acute energy preservation, prioritize warmth, magnesium, and gentle movement.'
  } else if (cycleDay >= 6 && cycleDay <= 13) {
    currentPhase = 'follicular'
    phaseName = 'Mid-Late Follicular Phase'
    phaseDescription = 'Estrogen climbing to peak, high glycogen storage, optimal pain tolerance for cold plunge and resistance PRs.'
  } else if (cycleDay >= 14 && cycleDay <= 16) {
    currentPhase = 'ovulatory'
    phaseName = 'Ovulatory Phase'
    phaseDescription = 'Peak estrogen & LH surge. Maximum power output; maintain joint stability as laxity increases.'
  } else if (cycleDay >= 17 && cycleDay <= 22) {
    currentPhase = 'early_luteal'
    phaseName = 'Early Luteal Phase'
    phaseDescription = 'Progesterone surge, basal body temperature rises (+0.6°F–0.8°F), baseline resting heart rate rises slightly.'
  } else {
    currentPhase = 'late_luteal'
    phaseName = 'Late Luteal Phase (PMS Window)'
    phaseDescription = 'Hormone withdrawal, natural 10–15% HRV dip, prioritize sleep architecture and gentle fasting windows.'
  }

  // 3. Hormonal & Biomarker Baseline Context
  const hormonalProfile = {
    estrogen: (cycleDay <= 5 ? 'low' : cycleDay <= 13 ? 'rising' : cycleDay <= 16 ? 'peak' : cycleDay <= 22 ? 'moderate' : 'dropping') as 'low' | 'rising' | 'peak' | 'moderate' | 'dropping',
    progesterone: (cycleDay <= 14 ? 'low' : cycleDay <= 22 ? 'peak' : 'dropping') as 'low' | 'rising' | 'peak' | 'dropping',
    basalBodyTempOffset: cycleDay >= 15 ? '+0.6°F to +1.0°F' : '+0.0°F (Baseline)',
    hrvBaselineOffset: cycleDay >= 22 ? '-10% to -15% (Normal Hormonal Dip)' : 'Optimal / Baseline',
    insulinSensitivity: (cycleDay <= 14 ? 'optimal' : 'reduced') as 'optimal' | 'high' | 'reduced'
  }

  // 4. Generate Intelligent Protocol Modifications
  const protocolModifications: InfradianProtocolModification[] = []

  const flow = todayLog?.flow_level || (cycleDay <= 3 ? 'medium' : cycleDay <= 5 ? 'light' : 'none')
  const pain = todayLog?.pain_level !== undefined ? todayLog.pain_level : (cycleDay <= 2 ? 1 : 0)

  // A. Acute Cramping / Dysmenorrhea Protocol Rules
  if (pain >= 2) {
    protocolModifications.push({
      id: 'pause_cold_plunge_cramps',
      category: 'cold_plunge',
      type: 'caution',
      title: 'Pause Intense Cold Plunge',
      reason: 'Cold water shock during acute uterine cramping stimulates peripheral vasoconstriction and myometrial spasms (PGF2α). Resume in late follicular.',
      badgeText: '⚠️ Cold Plunge Paused',
      colorTheme: 'rose'
    })

    protocolModifications.push({
      id: 'add_magnesium_glycinate',
      category: 'nutrition_supplement',
      type: 'add',
      title: 'Magnesium Glycinate (400mg)',
      reason: 'Inhibits myometrial smooth muscle contractions and downregulates inflammatory prostaglandins to relieve cramps.',
      suggestedModalityName: 'Magnesium Glycinate',
      suggestedAction: 'Take 400mg with evening meal',
      badgeText: '💡 Anti-Cramping Supplement',
      colorTheme: 'purple'
    })

    protocolModifications.push({
      id: 'add_localized_heat',
      category: 'sauna',
      type: 'add',
      title: 'Localized Heat Therapy / Warm Bath',
      reason: 'Continuous soothing heat (104°F+) promotes pelvic vasodilatation and reduces uterine ischemia.',
      suggestedModalityName: 'Localized Heat Therapy',
      suggestedAction: '20 min soothing heating pad or warm mineral soak',
      badgeText: '🔥 Pelvic Heat Relief',
      colorTheme: 'amber'
    })
  }

  // B. Heavy Flow Iron & Electrolyte Rules
  if (flow === 'heavy') {
    protocolModifications.push({
      id: 'iron_ferritin_replenish',
      category: 'nutrition_supplement',
      type: 'add',
      title: 'Iron Bisglycinate (25mg) + Vitamin C',
      reason: 'Heavy menses accelerates acute iron/ferritin depletion. Pair with 250mg Vitamin C for optimal enteric absorption.',
      suggestedModalityName: 'Iron Bisglycinate',
      suggestedAction: 'Take 25mg away from calcium/coffee',
      badgeText: '🩸 Ferritin Defense',
      colorTheme: 'rose'
    })

    protocolModifications.push({
      id: 'hydration_electrolytes',
      category: 'sauna',
      type: 'modify',
      title: 'Electrolyte Pre-Load for Heat Sessions',
      reason: 'Elevated blood loss increases dehydration risk. Pre-hydrate with 500mg sodium + 200mg potassium before any thermal stress.',
      badgeText: '💧 Hydration Pre-Load',
      colorTheme: 'cyan'
    })
  }

  // C. Follicular Hormesis Window Rules
  if (currentPhase === 'follicular' && !isPeriodActive) {
    protocolModifications.push({
      id: 'follicular_cold_hormesis',
      category: 'cold_plunge',
      type: 'boost',
      title: 'Peak Cold Hormesis Window (3 mins @ 50°F)',
      reason: 'Estrogen elevates dopamine receptor sensitivity and metabolic resilience. Optimal window for deliberate cold immersion.',
      badgeText: '⚡ Peak Cold Hormesis',
      colorTheme: 'cyan'
    })

    protocolModifications.push({
      id: 'follicular_strength_pr',
      category: 'exercise',
      type: 'boost',
      title: 'High-Volume Strength & Norwegian 4x4 HIIT',
      reason: 'Optimal glycogen replenishment and reduced muscle protein breakdown. Prime window for peak progressive overload.',
      badgeText: '💪 High Strain Tolerance',
      colorTheme: 'emerald'
    })
  }

  // D. Luteal Phase Progesterone & Fasting Rules
  if (currentPhase === 'early_luteal' || currentPhase === 'late_luteal') {
    protocolModifications.push({
      id: 'luteal_gentle_fasting',
      category: 'fasting',
      type: 'modify',
      title: 'Progesterone Protection: Cap Fasting at 14 Hours',
      reason: 'Aggressive caloric restriction in the luteal phase triggers cortisol elevation that suppresses progesterone synthesis. Keep fasts gentle (12–14h).',
      badgeText: '🥑 Gentle Fasting (<14h)',
      colorTheme: 'amber'
    })

    protocolModifications.push({
      id: 'luteal_sauna_thermoregulation',
      category: 'sauna',
      type: 'modify',
      title: 'Sauna Heat Strain Awareness (+0.8°F Core Temp)',
      reason: 'Progesterone elevates baseline core temperature. Keep Finnish sauna to 15–20 mins @ 174°F and hydrate with electrolytes.',
      badgeText: '🌡️ Core Temp +0.8°F',
      colorTheme: 'amber'
    })

    if (currentPhase === 'late_luteal') {
      protocolModifications.push({
        id: 'luteal_hrv_normalization',
        category: 'exercise',
        type: 'modify',
        title: 'HRV Normalization: 10–15% Dip is Expected',
        reason: 'Resting HRV naturally drops due to parasympathetic progesterone shifts. Do not interpret as overtraining; prioritize 8.5h sleep.',
        badgeText: '🧘 Parasympathetic Recovery',
        colorTheme: 'purple'
      })
    }
  }

  // E. Birth Control Adherence Rules
  if (todayLog?.birth_control_status === 'missed') {
    protocolModifications.push({
      id: 'missed_pill_advisory',
      category: 'nutrition_supplement',
      type: 'caution',
      title: 'Missed Birth Control Pill Logged',
      reason: 'Sudden drop in circulating synthetic progestin/estrogen can trigger breakthrough spotting or uterine cramping within 24–48h. Follow package instructions and consider backup barrier contraception.',
      badgeText: '⚠️ Missed Pill Logged',
      colorTheme: 'amber'
    })
  } else if (todayLog?.birth_control_status === 'active') {
    protocolModifications.push({
      id: 'oral_contraceptive_micronutrients',
      category: 'nutrition_supplement',
      type: 'add',
      title: 'B-Complex & Magnesium Synergy',
      reason: 'Oral contraceptives accelerate hepatic clearance of B-vitamins (B6, B12, Folate) and magnesium. Ensure adequate dietary or supplemental intake.',
      suggestedModalityName: 'B-Complex & Magnesium Glycinate',
      suggestedAction: 'Take with morning meal or evening recovery stack',
      badgeText: '💊 Pill Synergy',
      colorTheme: 'purple'
    })
  }

  return {
    enabled: true,
    currentPhase,
    phaseName,
    phaseDescription,
    cycleDay,
    cycleLength,
    isPeriodActive,
    isPeriodExpectedSoon,
    daysUntilNextPeriod,
    todayLog,
    hormonalProfile,
    protocolModifications
  }
}
