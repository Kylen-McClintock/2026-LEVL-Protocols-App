import { DailyProtocolTask, Modality, UserProfile, DailyWellbeingCheckin } from '@/lib/types'
import {
  COMPREHENSIVE_CONFLICT_RULES,
  COMPREHENSIVE_SYNERGY_RULES,
  BiochemicalConflictRule,
  BiochemicalSynergyRule
} from './comprehensiveInteractions'
import {
  LONGEVITY_VECTORS_METADATA,
  calculateCompositeProtocolLongevityScore
} from '@/lib/data/longevityKnowledgeBase'
import {
  ProtocolFingerprint,
  ProtocolVectorScores,
  ProtocolHallmarkScores
} from '@/lib/data/protocolFingerprints'
import { resolveSlotFromTimingString } from '@/lib/data/resolveOptimalTiming'

// ============================================================================
// Types & Contracts
// ============================================================================

export interface RoutineConflictItem {
  id: string
  ruleId: string
  modalityAId: string
  modalityAName: string
  modalityBId: string
  modalityBName: string
  conflictType: BiochemicalConflictRule['type']
  severity: 'timing' | 'moderate' | 'critical'
  headline: string
  rationale: string
  clinicalEffectDelta: string
  targetPathway: string
  pubmedUrl: string
  autoFix: {
    modalityIdToShift: string
    modalityNameToShift: string
    currentSlot: string
    targetSlot: string
    targetTimingString: string
    description: string
  }
}

export interface RoutineSynergyUnlockItem {
  id: string
  ruleId: string
  modalityId: string
  modalityName: string
  synergyPartnerName?: string
  headline: string
  rationale: string
  clinicalEffectDelta: string
  targetPathway: string
  actionableTip: string
  pubmedUrl: string
  suggestedTimingShift?: {
    currentSlot: string
    targetSlot: string
    targetTimingString: string
    description: string
  }
}

export interface RoutineActiveSynergyItem {
  id: string
  modalityAName: string
  modalityBName: string
  headline: string
  rationale: string
  targetPathway: string
  clinicalEffectDelta: string
  pubmedUrl: string
}

export interface RoutineTimelineSlotGroup {
  slot: string
  label: string
  hourApprox: number
  tasks: {
    taskId: string
    modalityId: string
    modalityName: string
    customDose?: string
    customTiming?: string
    status: string
    hasConflict?: boolean
    hasSynergy?: boolean
  }[]
}

export interface PKDataPoint {
  hour: number // 6.0 to 24.0
  concentrationPct: number // 0 to 100%
  timeLabel: string
}

export interface PharmacokineticCurveSeries {
  id: string
  compoundName: string
  headline: string
  halfLifeHours: number
  doseHour: number
  strokeColor: string
  fillColor: string
  dataPoints: PKDataPoint[]
  criticalThresholdHour?: number
  thresholdLabel?: string
  conflictNote?: string
}

export interface RoutineStackHealthReport {
  overallScore: number // 0-100
  healthGrade: 'Optimal' | 'High' | 'Needs Optimization' | 'Critical Conflict'
  activeModalityCount: number
  conflictCount: number
  criticalCount: number
  synergyUnlockCount: number
  activeSynergyCount: number
  conflicts: RoutineConflictItem[]
  synergyUnlocks: RoutineSynergyUnlockItem[]
  activeSynergies: RoutineActiveSynergyItem[]
  timelineGroups: RoutineTimelineSlotGroup[]
  currentRadarFingerprint: ProtocolFingerprint
  optimizedRadarFingerprint: ProtocolFingerprint
  pkCurves: PharmacokineticCurveSeries[]
  biometricProofNotes: string[]
  summaryMessage: string
}

// ============================================================================
// Helper Functions
// ============================================================================

function normalizeKey(str?: string): string {
  if (!str) return ''
  return str.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * Converts a slot or time string into an approximate 24-hour decimal for distance checks.
 */
function resolveHourDecimal(timingSlot?: string, scheduledTime?: string, customTiming?: string): number {
  if (scheduledTime && scheduledTime.includes(':')) {
    const [h, m] = scheduledTime.split(':').map(Number)
    if (!isNaN(h)) return h + (m || 0) / 60
  }

  const natural = (customTiming || '').toLowerCase()
  if (natural.includes('am') || natural.includes('pm')) {
    const match = natural.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i)
    if (match) {
      let h = parseInt(match[1], 10)
      const m = match[2] ? parseInt(match[2], 10) : 0
      const ampm = match[3].toLowerCase()
      if (ampm === 'pm' && h < 12) h += 12
      if (ampm === 'am' && h === 12) h = 0
      return h + m / 60
    }
  }

  const slot = (timingSlot || '').toLowerCase()
  if (slot === 'fasted_am' || natural.includes('fasted') || natural.includes('waking')) return 7.0
  if (slot.includes('morning')) return 8.5
  if (slot.includes('midday') || natural.includes('lunch') || natural.includes('noon')) return 12.5
  if (slot.includes('afternoon') || slot.includes('post_meal')) return 15.0
  if (slot.includes('evening') || natural.includes('dinner')) return 18.5
  if (slot.includes('wind_down')) return 20.5
  if (slot.includes('bedtime') || slot.includes('pre_bed') || natural.includes('sleep')) return 22.5

  return 12.0 // fallback
}

/**
 * Categorizes a task into human-friendly timeline blocks
 */
function getTimelineSlotLabel(hourDec: number): { slot: string; label: string } {
  if (hourDec < 8) return { slot: 'fasted_am', label: 'Fasted Morning (6:00 AM – 8:00 AM)' }
  if (hourDec < 11.5) return { slot: 'morning', label: 'Morning (8:00 AM – 11:30 AM)' }
  if (hourDec < 14) return { slot: 'midday', label: 'Midday / First Meal (11:30 AM – 2:00 PM)' }
  if (hourDec < 17.5) return { slot: 'afternoon', label: 'Afternoon & Workout (2:00 PM – 5:30 PM)' }
  if (hourDec < 20) return { slot: 'evening', label: 'Evening & Dinner (5:30 PM – 8:00 PM)' }
  if (hourDec < 22) return { slot: 'wind_down', label: 'Wind-Down (8:00 PM – 10:00 PM)' }
  return { slot: 'bedtime', label: 'Pre-Bed & Sleep (10:00 PM – 11:30 PM)' }
}

function formatHourLabel(h: number): string {
  const normH = Math.floor(h)
  const m = Math.round((h - normH) * 60)
  const mStr = m === 0 ? '00' : String(m).padStart(2, '0')
  const period = normH >= 12 && normH < 24 ? 'PM' : 'AM'
  const displayH = normH === 0 ? 12 : normH > 12 ? normH - 12 : normH
  return `${displayH}:${mStr} ${period}`
}

function calculatePKCurve(doseHour: number, halfLife: number, tMax: number = 0.5): PKDataPoint[] {
  const points: PKDataPoint[] = []
  for (let h = 6; h <= 24; h += 0.5) {
    let conc = 0
    if (h >= doseHour) {
      const dt = h - doseHour
      if (dt < tMax) {
        conc = Math.round((dt / tMax) * 100)
      } else {
        const decayTime = dt - tMax
        conc = Math.round(100 * Math.pow(0.5, decayTime / halfLife))
      }
    }
    points.push({
      hour: h,
      concentrationPct: Math.max(0, Math.min(100, conc)),
      timeLabel: formatHourLabel(h)
    })
  }
  return points
}

// ============================================================================
// Core Audit Engine
// ============================================================================

export function auditRoutineStackHealth(
  activeTasks: DailyProtocolTask[],
  allModalities: Modality[],
  userProfile?: UserProfile | null,
  wellbeingCheckin?: DailyWellbeingCheckin | null
): RoutineStackHealthReport {
  // 1. Resolve active modalities and their scheduled context
  const activeTaskModalityMap: {
    task: DailyProtocolTask
    modality: Modality
    normKey: string
    resolvedSlot: string
    hourDec: number
  }[] = []

  const modalitiesById = new Map<string, Modality>()
  allModalities.forEach(m => modalitiesById.set(m.id, m))

  // Filter out skipped or non-actionable tasks
  const eligibleTasks = (activeTasks || []).filter(
    t => t.status !== 'skipped' && t.status !== 'not_today'
  )

  eligibleTasks.forEach(task => {
    let mod = task.loose_modality || task.protocol_step?.modality
    if (!mod && task.modality_id) {
      mod = modalitiesById.get(task.modality_id)
    }
    if (!mod && task.protocol_step?.modality_id) {
      mod = modalitiesById.get(task.protocol_step.modality_id)
    }

    if (mod) {
      const normKey = normalizeKey(mod.slug || mod.name || mod.display_name)
      const slotCandidate = task.timing_slot || resolveSlotFromTimingString(task.custom_timing, mod.logging_type === 'supplement')
      const hourDec = resolveHourDecimal(slotCandidate, task.scheduled_time, task.custom_timing)

      activeTaskModalityMap.push({
        task,
        modality: mod,
        normKey,
        resolvedSlot: slotCandidate,
        hourDec
      })
    }
  })

  const uniqueActiveModalities = Array.from(
    new Map(activeTaskModalityMap.map(item => [item.modality.id, item.modality])).values()
  )

  // 2. Identify Red & Amber Conflicts
  const conflicts: RoutineConflictItem[] = []
  const seenConflictPairs = new Set<string>()

  for (let i = 0; i < activeTaskModalityMap.length; i++) {
    for (let j = i + 1; j < activeTaskModalityMap.length; j++) {
      const itemA = activeTaskModalityMap[i]
      const itemB = activeTaskModalityMap[j]

      // Don't compare same modality to itself
      if (itemA.modality.id === itemB.modality.id) continue

      const pairKeyForward = `${itemA.modality.id}__${itemB.modality.id}`
      const pairKeyReverse = `${itemB.modality.id}__${itemA.modality.id}`
      if (seenConflictPairs.has(pairKeyForward) || seenConflictPairs.has(pairKeyReverse)) continue

      for (const rule of COMPREHENSIVE_CONFLICT_RULES) {
        if (rule.id === 'late_caffeine_sleep') {
          // A cutoff or curfew habit (e.g. Walker 10-Hour Caffeine Cutoff) is sleep hygiene, not caffeine intake
          if (
            itemA.normKey.includes('cutoff') || itemA.normKey.includes('curfew') || itemA.normKey.includes('cessation') ||
            itemB.normKey.includes('cutoff') || itemB.normKey.includes('curfew') || itemB.normKey.includes('cessation')
          ) {
            continue
          }
        }

        const aIsTrigger = rule.triggers.some(t => itemA.normKey.includes(t) || t.includes(itemA.normKey))
        const bIsTarget = rule.targets.some(t => itemB.normKey.includes(t) || t.includes(itemB.normKey))
        const bIsTrigger = rule.triggers.some(t => itemB.normKey.includes(t) || t.includes(itemB.normKey))
        const aIsTarget = rule.targets.some(t => itemA.normKey.includes(t) || t.includes(itemA.normKey))

        let triggerItem = null
        let targetItem = null

        if (aIsTrigger && bIsTarget) {
          triggerItem = itemA
          targetItem = itemB
        } else if (bIsTrigger && aIsTarget) {
          triggerItem = itemB
          targetItem = itemA
        }

        if (triggerItem && targetItem) {
          // Adenosine receptor blockade conflict:
          // Never trigger conflict if caffeine is scheduled during midday or earlier time blocks (or <= 1:00 PM)
          if (rule.id === 'late_caffeine_sleep') {
            const slot = (triggerItem.resolvedSlot || '').toLowerCase()
            const isMiddayOrEarlier = 
              slot === 'morning' || 
              slot === 'early_morning' || 
              slot === 'waking' || 
              slot === 'wake_up' || 
              slot === 'breakfast' || 
              slot === 'midday' || 
              slot === 'lunch' ||
              slot.includes('morning') ||
              slot.includes('midday') ||
              slot.includes('wake') ||
              slot.includes('breakfast') ||
              slot.includes('lunch') ||
              triggerItem.hourDec <= 13.0
            if (isMiddayOrEarlier) {
              continue // Valid early intake; no conflict!
            }
          }

          const hourDiff = Math.abs(triggerItem.hourDec - targetItem.hourDec)
          const requiredSpacing = rule.autoResolutionTiming?.spacingHours || 2.5

          // If scheduled within the dangerous conflict proximity
          if (hourDiff < requiredSpacing || triggerItem.resolvedSlot === targetItem.resolvedSlot) {
            seenConflictPairs.add(pairKeyForward)

            // Determine optimal auto-fix target slot
            let targetSlot = rule.autoResolutionTiming?.recommendedTimeSlot || 'Evening Stack'
            let targetTimingString = 'Evening • 6:30 PM'
            if (rule.type === 'hypertrophy_blunting' && rule.id === 'cold_vs_strength') {
              targetSlot = 'Midday or Separate Day'
              targetTimingString = 'Midday • 1:00 PM (4h post-lift)'
            } else if (rule.type === 'circadian_disruption' && rule.id === 'evening_cold_plunge_sleep') {
              targetSlot = 'Morning (Waking)'
              targetTimingString = 'Morning • 7:30 AM'
            } else if (rule.type === 'mitochondrial_blunting') {
              targetSlot = 'Evening Stack (with dinner)'
              targetTimingString = 'Evening • 7:00 PM (post-workout)'
            }

            conflicts.push({
              id: `conflict_${triggerItem.modality.id}_${targetItem.modality.id}_${rule.id}`,
              ruleId: rule.id,
              modalityAId: triggerItem.modality.id,
              modalityAName: triggerItem.modality.display_name || triggerItem.modality.name,
              modalityBId: targetItem.modality.id,
              modalityBName: targetItem.modality.display_name || targetItem.modality.name,
              conflictType: rule.type,
              severity: rule.severity,
              headline: rule.headline,
              rationale: rule.rationale,
              clinicalEffectDelta: rule.clinicalEffectDelta || '-30% Cellular Adaptation',
              targetPathway: rule.targetPathway || 'Cellular Pathway Interference',
              pubmedUrl: rule.pubmedUrl,
              autoFix: {
                modalityIdToShift: triggerItem.modality.id,
                modalityNameToShift: triggerItem.modality.display_name || triggerItem.modality.name,
                currentSlot: triggerItem.resolvedSlot || 'Current Slot',
                targetSlot,
                targetTimingString,
                description: rule.autoResolutionTiming?.description || `Shift ${triggerItem.modality.name} to ${targetSlot}`
              }
            })
            break // Match highest priority rule for this pair
          }
        }
      }
    }
  }

  // 3. Identify Active Synergies in Current Routine
  const activeSynergies: RoutineActiveSynergyItem[] = []
  const seenSynergyPairs = new Set<string>()

  for (let i = 0; i < activeTaskModalityMap.length; i++) {
    for (let j = i + 1; j < activeTaskModalityMap.length; j++) {
      const itemA = activeTaskModalityMap[i]
      const itemB = activeTaskModalityMap[j]
      if (itemA.modality.id === itemB.modality.id) continue

      const pairKey = `${itemA.modality.id}__${itemB.modality.id}`
      const pairKeyRev = `${itemB.modality.id}__${itemA.modality.id}`
      if (seenSynergyPairs.has(pairKey) || seenSynergyPairs.has(pairKeyRev)) continue

      for (const synRule of COMPREHENSIVE_SYNERGY_RULES) {
        const aTrigger = synRule.triggers.some(t => itemA.normKey.includes(t) || t.includes(itemA.normKey))
        const bTarget = synRule.targets.some(t => itemB.normKey.includes(t) || t.includes(itemB.normKey))
        const bTrigger = synRule.triggers.some(t => itemB.normKey.includes(t) || t.includes(itemB.normKey))
        const aTarget = synRule.targets.some(t => itemA.normKey.includes(t) || t.includes(itemA.normKey))

        if ((aTrigger && bTarget) || (bTrigger && aTarget)) {
          seenSynergyPairs.add(pairKey)
          activeSynergies.push({
            id: `active_synergy_${synRule.id}_${itemA.modality.id}_${itemB.modality.id}`,
            modalityAName: itemA.modality.display_name || itemA.modality.name,
            modalityBName: itemB.modality.display_name || itemB.modality.name,
            headline: synRule.headline,
            rationale: synRule.rationale,
            targetPathway: synRule.targetPathway || 'Synergistic Biological Pathway',
            clinicalEffectDelta: synRule.clinicalEffectDelta || '+25% Enhanced Efficacy',
            pubmedUrl: synRule.pubmedUrl
          })
          break
        }
      }
    }
  }

  // 4. Identify Synergy Unlocks (Simple Timing Tweaks to Elevate Bioavailability)
  const synergyUnlocks: RoutineSynergyUnlockItem[] = []

  // A. Check Fat-Soluble Vitamins scheduled in Fasted AM
  const FAT_SOLUBLE_KEYS = ['vitamind', 'vitamind3', 'd3', 'vitamink', 'vitamink2', 'mk7', 'coq10', 'ubiquinol', 'curcumin', 'astaxanthin']
  activeTaskModalityMap.forEach(item => {
    const isFatSoluble = FAT_SOLUBLE_KEYS.some(k => item.normKey.includes(k))
    const isFastedSlot = item.resolvedSlot === 'fasted_am' || 
      item.hourDec < 9.0 || 
      (item.task.custom_timing && item.task.custom_timing.toLowerCase().includes('fasted'))

    if (isFatSoluble && isFastedSlot) {
      synergyUnlocks.push({
        id: `unlock_fat_soluble_${item.modality.id}`,
        ruleId: 'fat_soluble_vitamins_meal',
        modalityId: item.modality.id,
        modalityName: item.modality.display_name || item.modality.name,
        headline: 'Shift to First Meal for +30–50% Higher Lipid Absorption',
        rationale: `${item.modality.display_name || item.modality.name} is fat-soluble and requires dietary lipids for mixed micelle formation in the gut. Taking it during a morning fast drops intestinal absorption significantly.`,
        clinicalEffectDelta: '+30% to +50% Greater Bioavailability & Tissue Delivery',
        targetPathway: 'Intestinal Mixed Micelle Diffusion',
        actionableTip: 'Shift from Fasted AM to First Meal / Lunch alongside healthy fats (EVOO, eggs, or avocado).',
        pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/24500150/',
        suggestedTimingShift: {
          currentSlot: item.resolvedSlot || 'Fasted AM',
          targetSlot: 'First Meal / Lunch',
          targetTimingString: 'Midday • 12:30 PM (with food)',
          description: 'Move to First Meal / Lunch with dietary fats'
        }
      })
    }
  })

  // B. Missing Key Synergists (e.g. NMN without TMG, or Statin without CoQ10)
  const hasNMN = activeTaskModalityMap.some(i => i.normKey.includes('nmn') || i.normKey.includes('nicotinamidemononucleotide') || i.normKey.includes('nr'))
  const hasTMG = activeTaskModalityMap.some(i => i.normKey.includes('tmg') || i.normKey.includes('betaine') || i.normKey.includes('trimethylglycine'))
  if (hasNMN && !hasTMG) {
    const nmnItem = activeTaskModalityMap.find(i => i.normKey.includes('nmn') || i.normKey.includes('nr'))
    if (nmnItem) {
      synergyUnlocks.push({
        id: 'unlock_nmn_tmg',
        ruleId: 'nmn_tmg',
        modalityId: nmnItem.modality.id,
        modalityName: nmnItem.modality.display_name || nmnItem.modality.name,
        synergyPartnerName: 'TMG (Trimethylglycine)',
        headline: 'Pair NMN with TMG to Buffer Hepatic Methyl Groups',
        rationale: 'Nicotinamide clearance consumes methyl groups from SAMe pools via NNMT. Adding 500mg TMG preserves methyl donor balance, preventing homocysteine elevation while supporting sirtuin deacetylation flux.',
        clinicalEffectDelta: '+100% Methyl Pool Buffering & Homocysteine Protection',
        targetPathway: 'NNMT Nicotinamide Clearance & SAMe S-Adenosylmethionine',
        actionableTip: 'Take 500mg TMG alongside your morning NMN dose.',
        pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/30349075/'
      })
    }
  }

  // 5. Calculate Overall Routine Stack Health Score (0–100)
  let baseScore = 100
  const criticalCount = conflicts.filter(c => c.severity === 'critical').length
  const timingCount = conflicts.filter(c => c.severity === 'timing').length
  const moderateCount = conflicts.filter(c => c.severity === 'moderate').length

  baseScore -= criticalCount * 25
  baseScore -= timingCount * 12
  baseScore -= moderateCount * 8
  baseScore -= synergyUnlocks.length * 5

  // Add small reward for active synergies present
  baseScore += Math.min(10, activeSynergies.length * 3)
  const overallScore = Math.max(25, Math.min(100, Math.round(baseScore)))

  const healthGrade: RoutineStackHealthReport['healthGrade'] =
    criticalCount > 0 ? 'Critical Conflict' :
    overallScore >= 90 ? 'Optimal' :
    overallScore >= 75 ? 'High' : 'Needs Optimization'

  // 6. Construct 24-Hour Timeline Groups
  const timelineSlotBuckets = new Map<string, RoutineTimelineSlotGroup>()
  const orderedSlotKeys = ['fasted_am', 'morning', 'midday', 'afternoon', 'evening', 'wind_down', 'bedtime']

  orderedSlotKeys.forEach(slotKey => {
    const meta = getTimelineSlotLabel(
      slotKey === 'fasted_am' ? 7.0 :
      slotKey === 'morning' ? 9.0 :
      slotKey === 'midday' ? 12.5 :
      slotKey === 'afternoon' ? 15.0 :
      slotKey === 'evening' ? 18.5 :
      slotKey === 'wind_down' ? 20.5 : 22.5
    )
    timelineSlotBuckets.set(slotKey, {
      slot: slotKey,
      label: meta.label,
      hourApprox: meta.slot === 'fasted_am' ? 7.0 : 12.0,
      tasks: []
    })
  })

  activeTaskModalityMap.forEach(item => {
    const meta = getTimelineSlotLabel(item.hourDec)
    const bucket = timelineSlotBuckets.get(meta.slot)
    if (bucket) {
      const hasConflict = conflicts.some(c => c.modalityAId === item.modality.id || c.modalityBId === item.modality.id)
      const hasSynergy = activeSynergies.some(s => s.modalityAName === item.modality.name || s.modalityBName === item.modality.name)

      bucket.tasks.push({
        taskId: item.task.id,
        modalityId: item.modality.id,
        modalityName: item.modality.display_name || item.modality.name,
        customDose: item.task.custom_dose,
        customTiming: item.task.custom_timing,
        status: item.task.status,
        hasConflict,
        hasSynergy
      })
    }
  })

  const timelineGroups = orderedSlotKeys
    .map(key => timelineSlotBuckets.get(key)!)
    .filter(group => group.tasks.length > 0)

  // 7. Compute Overlaid Coverage Radar: Current vs. Optimized
  const currentVectorScores: ProtocolVectorScores = {
    heart_health: 0,
    brain_longevity: 0,
    metabolic_health: 0,
    cancer_defense: 0,
    testosterone: 0,
    chronic_inflammation: 0,
    bone_density: 0,
    cellular_longevity: 0
  }

  const optimizedVectorScores: ProtocolVectorScores = {
    heart_health: 0,
    brain_longevity: 0,
    metabolic_health: 0,
    cancer_defense: 0,
    testosterone: 0,
    chronic_inflammation: 0,
    bone_density: 0,
    cellular_longevity: 0
  }

  const vectorKeys: (keyof ProtocolVectorScores)[] = [
    'heart_health',
    'brain_longevity',
    'metabolic_health',
    'cancer_defense',
    'testosterone',
    'chronic_inflammation',
    'bone_density',
    'cellular_longevity'
  ]

  vectorKeys.forEach(vKey => {
    const rawScore = calculateCompositeProtocolLongevityScore(uniqueActiveModalities, vKey).score
    
    // If routine has blunting conflicts, discount affected vectors
    let currentVectorPenalty = 0
    if (conflicts.some(c => c.conflictType === 'hypertrophy_blunting' && (vKey === 'testosterone' || vKey === 'bone_density'))) {
      currentVectorPenalty += 15
    }
    if (conflicts.some(c => c.conflictType === 'mitochondrial_blunting' && (vKey === 'heart_health' || vKey === 'metabolic_health'))) {
      currentVectorPenalty += 18
    }
    if (conflicts.some(c => c.conflictType === 'circadian_disruption' && (vKey === 'brain_longevity' || vKey === 'cellular_longevity'))) {
      currentVectorPenalty += 14
    }

    currentVectorScores[vKey] = Math.max(15, Math.round(rawScore - currentVectorPenalty))

    // In optimized state, eliminate all penalties + add bonus from synergy unlocks
    const synergyBonus = (activeSynergies.length > 0 || synergyUnlocks.length > 0) ? 6 : 0
    optimizedVectorScores[vKey] = Math.min(100, Math.round(rawScore + synergyBonus))
  })

  const dummyHallmarks: ProtocolHallmarkScores = {
    genomic_instability: 50,
    telomere_attrition: 50,
    epigenetic_alterations: 50,
    loss_of_proteostasis: 50,
    disabled_macroautophagy: 50,
    deregulated_nutrient_sensing: 50,
    mitochondrial_dysfunction: 50,
    cellular_senescence: 50,
    stem_cell_exhaustion: 50,
    altered_intercellular_communication: 50,
    chronic_inflammation: 50,
    dysbiosis: 50
  }

  const currentRadarFingerprint: ProtocolFingerprint = {
    id: 'active_current_stack',
    name: 'Current Stack (Unoptimized)',
    creator: 'Active Daily Schedule',
    superpowers: activeSynergies.map(s => s.headline).slice(0, 3),
    primaryGaps: conflicts.map(c => c.headline).slice(0, 3),
    synergyNotes: 'Contains active timing conflicts and blunting interactions.',
    vectors: currentVectorScores,
    hallmarks: dummyHallmarks
  }

  const optimizedRadarFingerprint: ProtocolFingerprint = {
    id: 'active_optimized_stack',
    name: 'Conflict-Free Stack (Fully Optimized)',
    creator: 'LEVL Conflict Engine',
    superpowers: ['Maximized Mitochondrial Adaptation', 'Zero Hypertrophy Blunting', 'Optimized Micelle Bioavailability'],
    primaryGaps: [],
    synergyNotes: 'All timing conflicts resolved and synergy unlocks active.',
    vectors: optimizedVectorScores,
    hallmarks: dummyHallmarks
  }

  // 8. Generate Pharmacokinetic Curves for Active Interacting Compounds
  const pkCurves: PharmacokineticCurveSeries[] = []

  // Caffeine curve
  const caffeineItem = activeTaskModalityMap.find(i => i.normKey.includes('caffeine') || i.normKey.includes('coffee') || i.normKey.includes('preworkout'))
  if (caffeineItem) {
    const doseHour = caffeineItem.hourDec
    const dataPoints = calculatePKCurve(doseHour, 5.7, 0.75)
    const bedtimeHour = 22.5
    const concAtBed = dataPoints.find(p => p.hour === bedtimeHour)?.concentrationPct ?? 0

    pkCurves.push({
      id: 'pk_caffeine',
      compoundName: caffeineItem.modality.display_name || caffeineItem.modality.name,
      headline: `Caffeine Elimination Kinetics (t½ = 5.7h)`,
      halfLifeHours: 5.7,
      doseHour,
      strokeColor: '#F59E0B',
      fillColor: 'rgba(245, 158, 11, 0.15)',
      dataPoints,
      criticalThresholdHour: bedtimeHour,
      thresholdLabel: 'Bedtime (10:30 PM)',
      conflictNote: concAtBed > 20
        ? `${concAtBed}% active caffeine still circulating at bedtime — exceeds 20% slow-wave sleep threshold.`
        : 'Clearance aligns with sleep architecture.'
    })
  }

  // Metformin / Berberine curve
  const metabolicItem = activeTaskModalityMap.find(i => i.normKey.includes('metformin') || i.normKey.includes('glucophage') || i.normKey.includes('berberine'))
  if (metabolicItem) {
    const doseHour = metabolicItem.hourDec
    const dataPoints = calculatePKCurve(doseHour, 6.0, 2.5)
    pkCurves.push({
      id: 'pk_metformin',
      compoundName: metabolicItem.modality.display_name || metabolicItem.modality.name,
      headline: `${metabolicItem.modality.name} Plasma Concentration (t_max = 2.5h)`,
      halfLifeHours: 6.0,
      doseHour,
      strokeColor: '#A855F7',
      fillColor: 'rgba(168, 85, 247, 0.15)',
      dataPoints,
      conflictNote: conflicts.some(c => c.conflictType === 'mitochondrial_blunting')
        ? 'Peak serum concentration directly overlaps with endurance exercise window.'
        : 'Physiologically separated from aerobic training.'
    })
  }

  // Resistance Training / mTORC1 Hypertrophy Sensitivity Curve
  const strengthItem = activeTaskModalityMap.find(i => i.normKey.includes('resistancetraining') || i.normKey.includes('strengthtraining') || i.normKey.includes('hypertrophy'))
  if (strengthItem) {
    const doseHour = strengthItem.hourDec
    const dataPoints = calculatePKCurve(doseHour, 2.0, 0.5)
    pkCurves.push({
      id: 'pk_hypertrophy',
      compoundName: `${strengthItem.modality.name} Hypertrophy Signaling`,
      headline: 'p70S6K / mTORC1 Adaptive Window (4-Hour Window)',
      halfLifeHours: 2.0,
      doseHour,
      strokeColor: '#EC4899',
      fillColor: 'rgba(236, 72, 153, 0.15)',
      dataPoints,
      conflictNote: conflicts.some(c => c.conflictType === 'hypertrophy_blunting')
        ? 'Cold immersion scheduled within this 4-hour window blunts muscle growth signaling.'
        : 'Hormetic adaptive window preserved.'
    })
  }

  // 9. Check-in Correlation & Manual Sleep Evidence Proof Notes
  const biometricProofNotes: string[] = []
  if (wellbeingCheckin) {
    const sleepRating = (wellbeingCheckin as any).sleep_quality ?? (wellbeingCheckin as any).sleep_score ?? (wellbeingCheckin as any).sleep
    if (sleepRating != null && Number(sleepRating) <= 6 && conflicts.some(c => c.conflictType === 'circadian_disruption')) {
      biometricProofNotes.push(
        `Manual Sleep Check-in: Your logged sleep score (${sleepRating}/10) reflects degraded slow-wave rest on dates with late caffeine or evening thermal stimulation.`
      )
    }
    const energyRating = (wellbeingCheckin as any).energy
    if (energyRating != null && Number(energyRating) <= 6 && conflicts.some(c => c.conflictType === 'mitochondrial_blunting' || c.conflictType === 'absorption_competition')) {
      biometricProofNotes.push(
        `Subjective Energy Log: Midday energy dips align with active nutrient timing competition in your scheduled stack.`
      )
    }
  }

  if (biometricProofNotes.length === 0) {
    biometricProofNotes.push(
      'Continue logging your daily morning and evening wellbeing check-ins to unlock personalized correlation proof notes.'
    )
  }

  // Summary headline
  let summaryMessage = 'Your daily schedule is synergistically aligned with zero timing conflicts.'
  if (criticalCount > 0) {
    summaryMessage = `${criticalCount} critical interaction detected requiring immediate clinical timing separation.`
  } else if (conflicts.length > 0) {
    summaryMessage = `${conflicts.length} timing conflicts detected blunting training adaptations. Apply 1-click optimization below.`
  } else if (synergyUnlocks.length > 0) {
    summaryMessage = `All clear on conflicts! ${synergyUnlocks.length} synergy unlocks available to increase nutrient bioavailability.`
  }

  return {
    overallScore,
    healthGrade,
    activeModalityCount: uniqueActiveModalities.length,
    conflictCount: conflicts.length,
    criticalCount,
    synergyUnlockCount: synergyUnlocks.length,
    activeSynergyCount: activeSynergies.length,
    conflicts,
    synergyUnlocks,
    activeSynergies,
    timelineGroups,
    currentRadarFingerprint,
    optimizedRadarFingerprint,
    pkCurves,
    biometricProofNotes,
    summaryMessage
  }
}
