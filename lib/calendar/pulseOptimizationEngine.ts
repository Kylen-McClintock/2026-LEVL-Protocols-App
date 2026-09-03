import { DailyProtocolTask } from '@/lib/types'
import { generateWaveforms, calculateAUCForVectors, WaveformEvent } from './waveformMapper'
import { updateTaskExecutionDetails } from '@/lib/data'

export interface TimingOptimizationSuggestion {
  id: string
  taskId: string
  modalityName: string
  currentSlot: string
  recommendedSlot: string
  severity: 'critical' | 'high' | 'medium' | 'info'
  title: string
  mechanismExplanation: string
  actionLabel: string
}

export interface DriverItem {
  task: DailyProtocolTask
  name: string
  dose: string
  timing: string
  vector: string
  impact: string
}

export interface DailyPulseBalance {
  dateStr: string
  growthPercentage: number
  recoveryPercentage: number
  growthAUC: number
  recoveryAUC: number
  archetype: string
  archetypeSubtitle: string
  archetypeColor: string
  growthDrivers: DriverItem[]
  recoveryDrivers: DriverItem[]
  baselineDrivers: DriverItem[]
  suggestions: TimingOptimizationSuggestion[]
}

/**
 * Resolves modality name safely from protocol step or loose modality
 */
function getModalityName(task: DailyProtocolTask): string {
  return (task.protocol_step?.modality?.name || task.loose_modality?.name || (task as any).modality?.name || 'Protocol Modality')
}

/**
 * Determines whether a modality is primarily Growth (Anabolic), Recovery (Autophagic/Parasympathetic), or Baseline.
 */
function classifyModalityVector(task: DailyProtocolTask): { type: 'growth' | 'recovery' | 'baseline'; vector: string; impact: string } {
  const name = getModalityName(task).toLowerCase()
  const cat = (task.protocol_step?.modality?.category || task.loose_modality?.category || '').toLowerCase()

  // 1. Growth (mTORC1, Anabolism, Mechanical Strain)
  if (
    name.includes('resistance') ||
    name.includes('lift') ||
    name.includes('strength') ||
    name.includes('hypertrophy') ||
    name.includes('push') ||
    name.includes('pull') ||
    name.includes('legs') ||
    name.includes('protein') ||
    name.includes('creatine') ||
    name.includes('eaa') ||
    name.includes('bcaa') ||
    name.includes('zone 5') ||
    name.includes('sprint') ||
    name.includes('hiit')
  ) {
    if (name.includes('creatine')) {
      return { type: 'growth', vector: 'mTOR_Growth', impact: 'Cellular ATP replenishment & satellite cell signaling' }
    }
    if (name.includes('protein') || name.includes('eaa')) {
      return { type: 'growth', vector: 'mTOR_Growth', impact: 'Leucine-triggered muscle protein synthesis (MPS)' }
    }
    return { type: 'growth', vector: 'mTOR_Growth', impact: 'Mechanical tension & anabolic mechanotransduction' }
  }

  // 2. Recovery (AMPK, Autophagy, Parasympathetic, Vagal)
  if (
    name.includes('fast') ||
    name.includes('cold') ||
    name.includes('plunge') ||
    name.includes('ice') ||
    name.includes('sauna') ||
    name.includes('heat') ||
    name.includes('breath') ||
    name.includes('nsdr') ||
    name.includes('nidra') ||
    name.includes('meditat') ||
    name.includes('magnesium') ||
    name.includes('glycine') ||
    name.includes('sleep') ||
    name.includes('zone 2') ||
    name.includes('walk') ||
    name.includes('fisetin') ||
    name.includes('quercetin')
  ) {
    if (name.includes('cold') || name.includes('plunge')) {
      return { type: 'recovery', vector: 'Parasympathetic_Recovery', impact: 'Vagal rebound, dopamine sustain & mitochondrial biogenesis' }
    }
    if (name.includes('sauna')) {
      return { type: 'recovery', vector: 'Parasympathetic_Recovery', impact: 'Heat shock proteins (HSP70) & peripheral vasodilation' }
    }
    if (name.includes('fast')) {
      return { type: 'recovery', vector: 'AMPK_Clearance', impact: 'Hepatic glycogen clearing & macroautophagy' }
    }
    if (name.includes('zone 2')) {
      return { type: 'recovery', vector: 'AMPK_Clearance', impact: 'Mitochondrial efficiency & lactate clearance' }
    }
    if (name.includes('fisetin') || name.includes('quercetin')) {
      return { type: 'recovery', vector: 'Senolytic_Clearance', impact: 'Selective apoptotic clearance of senescent cells' }
    }
    return { type: 'recovery', vector: 'Parasympathetic_Recovery', impact: 'Autonomic nervous system down-regulation & restorative sleep prep' }
  }

  // Baseline
  return { type: 'baseline', vector: 'Baseline_Hygiene', impact: 'Circadian anchoring & baseline micronutrient support' }
}

/**
 * Calculates the Growth vs. Recovery Mode Barometer and partitions drivers
 */
export function calculateDailyPulseBalance(tasks: DailyProtocolTask[], dateStr: string): DailyPulseBalance {
  const dayTasks = tasks.filter(t => t.scheduled_date === dateStr)

  if (dayTasks.length === 0) {
    return {
      dateStr,
      growthPercentage: 30,
      recoveryPercentage: 70,
      growthAUC: 0,
      recoveryAUC: 0,
      archetype: 'Rest & Somatic Recovery',
      archetypeSubtitle: 'No active high-strain protocols scheduled. Baseline cellular recovery active.',
      archetypeColor: 'text-emerald-400',
      growthDrivers: [],
      recoveryDrivers: [],
      baselineDrivers: [],
      suggestions: []
    }
  }

  // 1. Calculate Area Under Curve (AUC) from waveforms
  const waveforms = generateWaveforms(dayTasks)
  const auc = calculateAUCForVectors(waveforms)

  const rawGrowth = (auc['mTOR_Growth'] || 0) + ((auc['Sympathetic_Load'] || 0) * 0.75)
  const rawRecovery = (auc['AMPK_Clearance'] || 0) + (auc['Parasympathetic_Recovery'] || 0) + ((auc['Senolytic_Clearance'] || 0) * 1.25)

  // Avoid zero division
  const total = rawGrowth + rawRecovery
  let growthPercentage = total > 0 ? Math.round((rawGrowth / total) * 100) : 50
  // Clamp between 10% and 90% for balanced realism
  growthPercentage = Math.max(10, Math.min(90, growthPercentage))
  const recoveryPercentage = 100 - growthPercentage

  // 2. Classify Archetype
  let archetype = 'Harmonized Biphasic Protocol'
  let archetypeSubtitle = 'Balanced partition of morning recovery/clearance and midday anabolic stimulus.'
  let archetypeColor = 'text-indigo-300'

  if (growthPercentage >= 65) {
    archetype = 'Hypertrophic Anabolic Anchor'
    archetypeSubtitle = 'High mechanical tension, mTORC1 activation & nutrient surplus. Prioritize post-strain sleep hygiene.'
    archetypeColor = 'text-purple-400'
  } else if (recoveryPercentage >= 65) {
    archetype = 'Cellular Autophagy & Reset'
    archetypeSubtitle = 'Dominant AMPK clearance, mitochondrial biogenesis, and deep parasympathetic restoration.'
    archetypeColor = 'text-emerald-400'
  } else if (dayTasks.length <= 2 && rawGrowth < 5) {
    archetype = 'Deep Somatic Recovery'
    archetypeSubtitle = 'Active recovery protocols prioritized to allow structural and neural repair.'
    archetypeColor = 'text-blue-400'
  }

  // 3. Partition Driver Items
  const growthDrivers: DriverItem[] = []
  const recoveryDrivers: DriverItem[] = []
  const baselineDrivers: DriverItem[] = []

  dayTasks.forEach(task => {
    const name = getModalityName(task)
    const classification = classifyModalityVector(task)
    const dose = task.execution_details?.custom_dose || task.protocol_step?.dose_text || (task.protocol_step?.modality as any)?.dose_or_exposure || 'Standard Dose'
    const timing = task.timing_slot || 'anytime'

    const item: DriverItem = {
      task,
      name,
      dose,
      timing,
      vector: classification.vector,
      impact: classification.impact
    }

    if (classification.type === 'growth') {
      growthDrivers.push(item)
    } else if (classification.type === 'recovery') {
      recoveryDrivers.push(item)
    } else {
      baselineDrivers.push(item)
    }
  })

  // 4. Run Timing Optimization Checks
  const suggestions = detectTimingOptimizations(dayTasks)

  return {
    dateStr,
    growthPercentage,
    recoveryPercentage,
    growthAUC: Math.round(rawGrowth * 10) / 10,
    recoveryAUC: Math.round(rawRecovery * 10) / 10,
    archetype,
    archetypeSubtitle,
    archetypeColor,
    growthDrivers,
    recoveryDrivers,
    baselineDrivers,
    suggestions
  }
}

/**
 * Detects chronological conflicts and biological timing clashes within a day's schedule.
 */
export function detectTimingOptimizations(tasks: DailyProtocolTask[]): TimingOptimizationSuggestion[] {
  const suggestions: TimingOptimizationSuggestion[] = []

  // Check 1: Søberg Principle / Hypertrophy vs. Cold Plunge Interference
  // Rule: Cold water immersion within 4 hours AFTER resistance training blunts mTOR/p70S6K.
  const resistanceTask = tasks.find(t => {
    const name = getModalityName(t).toLowerCase()
    return name.includes('resistance') || name.includes('lift') || name.includes('strength') || name.includes('hypertrophy')
  })

  const coldTask = tasks.find(t => {
    const name = getModalityName(t).toLowerCase()
    return name.includes('cold') || name.includes('plunge') || name.includes('ice')
  })

  if (resistanceTask && coldTask) {
    const resSlot = resistanceTask.timing_slot || 'afternoon'
    const coldSlot = coldTask.timing_slot || 'afternoon'

    // If cold is scheduled in the afternoon, evening, or post-workout after lifting
    if (coldSlot === resSlot || coldSlot === 'afternoon' || coldSlot === 'evening' || coldSlot === 'post_bed') {
      suggestions.push({
        id: `soberg_cold_${coldTask.id}`,
        taskId: coldTask.id,
        modalityName: getModalityName(coldTask),
        currentSlot: coldSlot,
        recommendedSlot: 'morning_routine',
        severity: 'critical',
        title: 'Hypertrophy Interference: Cold Plunge Post-Lift',
        mechanismExplanation: 'Søberg & Roberts (2015 / PMID: 26174983) demonstrated cold water immersion within 4 hours after resistance training blunts p70S6K and mTORC1 phosphorylation, diminishing muscle hypertrophy by up to 50%.',
        actionLabel: 'Shift Cold Plunge to Morning (7:00 AM)'
      })
    }
  }

  // Check 2: Caffeine Adenosine Clearance Cutoff
  // Rule: Caffeine consumed in afternoon or evening disrupts stage 3 slow-wave sleep.
  const caffeineTask = tasks.find(t => {
    const name = getModalityName(t).toLowerCase()
    return name.includes('coffee') || name.includes('caffeine') || name.includes('pre-workout')
  })

  if (caffeineTask) {
    const slot = caffeineTask.timing_slot || ''
    if (slot.includes('afternoon') || slot.includes('evening') || slot.includes('bed')) {
      suggestions.push({
        id: `caffeine_cutoff_${caffeineTask.id}`,
        taskId: caffeineTask.id,
        modalityName: getModalityName(caffeineTask),
        currentSlot: slot,
        recommendedSlot: 'morning_supplement_stack',
        severity: 'high',
        title: 'Circadian Sleep Interference: Late Caffeine',
        mechanismExplanation: 'Caffeine has an elimination half-life of 5.7 hours. Afternoon ingestion blocks central adenosine A1/A2A receptors, suppressing restorative slow-wave delta sleep and lowering nocturnal HRV.',
        actionLabel: 'Advance Caffeine to Morning Stack'
      })
    }
  }

  // Check 3: Late Sympathetic / Thermal Stress before Bed
  // Rule: High-intensity cardio or extreme sauna within 2 hours of bedtime elevates core body temperature.
  const lateStrainTask = tasks.find(t => {
    const name = getModalityName(t).toLowerCase()
    const slot = t.timing_slot || ''
    const isLate = slot.includes('evening') || slot.includes('pre_bed') || slot.includes('bed')
    const isStrain = name.includes('zone 5') || name.includes('hiit') || name.includes('sprint') || name.includes('heavy') || name.includes('sauna')
    return isLate && isStrain
  })

  if (lateStrainTask) {
    suggestions.push({
      id: `late_strain_${lateStrainTask.id}`,
      taskId: lateStrainTask.id,
      modalityName: getModalityName(lateStrainTask),
      currentSlot: lateStrainTask.timing_slot || 'evening',
      recommendedSlot: 'afternoon',
      severity: 'medium',
      title: 'Core Temperature & Autonomic Suppression',
      mechanismExplanation: 'Intense thermal or cardiovascular strain within 2 hours of bedtime spikes core body temperature and sympathetic norepinephrine, preventing the 1°C thermal drop necessary for melatonin onset.',
      actionLabel: 'Advance to Afternoon Window (2:00–5:00 PM)'
    })
  }

  return suggestions
}

/**
 * Executes a timing optimization update on a task.
 */
export async function applyTimingOptimization(taskId: string, targetSlot: string): Promise<boolean> {
  try {
    const success = await updateTaskExecutionDetails(taskId, {
      timing_slot: targetSlot,
      custom_timing: `Auto-Harmonized: ${targetSlot.replace(/_/g, ' ')}`
    })

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('levl_tasks_updated'))
    }
    return success
  } catch (e) {
    console.error('Failed to apply timing optimization:', e)
    return false
  }
}
