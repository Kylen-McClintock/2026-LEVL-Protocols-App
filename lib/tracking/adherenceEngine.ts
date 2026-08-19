import { Modality, DailyProtocolTask, UserProfile, UserModalityHabit } from '@/lib/types'

export type HabitLifecycleStatus = 'new_habit' | 'momentum' | 'steady' | 'leak' | 'sunk_cost'

export interface ModalityDailyDot {
  date: string
  dayLabel: string
  status: 'completed' | 'partial' | 'skipped' | 'pending' | 'none'
}

export interface ModalityAdherenceMetrics {
  modalityId: string
  modality: Modality
  scheduledCount: number
  completedCount: number
  adherencePercent: number
  activeDaysCount: number
  referenceWindowDays: number
  cadenceType: 'daily' | 'periodic_weekly' | 'pulsed_monthly'
  isNewHabit: boolean
  insightStatus: HabitLifecycleStatus
  insightMsg: string
  dailyDots: ModalityDailyDot[]
}

export interface OutcomeAdherenceSummary {
  id: string
  name: string
  preferenceScore: number
  totalPotential: number
  totalRealized: number
  realizedPercent: number
  overallAdherencePercent: number
  wellbeingCorrelationText?: string
  modalities: Array<{
    modality: Modality
    impactScore: number
    adherencePercent: number
    scheduledCount: number
    completedCount: number
    isNewHabit: boolean
    insightStatus: HabitLifecycleStatus
    insightMsg: string
    dailyDots: ModalityDailyDot[]
  }>
  nextBestAction?: Modality & { nba_result?: { score: number; reasons: string[] } }
}

function normId(idOrName?: string): string {
  return (idOrName || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * Determines the expected cadence of a modality based on its slug, protocol instructions, or name.
 */
export function detectModalityCadence(modality: Modality): 'daily' | 'periodic_weekly' | 'pulsed_monthly' {
  const nid = normId(modality.id)
  const name = normId(modality.name || modality.display_name)

  // Monthly / Periodic Pulses
  if (
    nid.includes('fisetin') || name.includes('fisetin') ||
    nid.includes('senolytic') || name.includes('senolytic') ||
    nid.includes('72h') || name.includes('72hour') ||
    nid.includes('rapamycin') || name.includes('rapamycin')
  ) {
    return 'pulsed_monthly'
  }

  // Periodic Weekly (2-4x / week)
  if (
    nid.includes('sauna') || name.includes('sauna') ||
    nid.includes('strength') || name.includes('strength') ||
    nid.includes('resistance') || name.includes('resistance') ||
    nid.includes('weightlifting') || nid.includes('hiit') || name.includes('hiit') ||
    nid.includes('vo2max') || name.includes('vo2max') ||
    nid.includes('bfr') || name.includes('bfr') ||
    nid.includes('coldplunge') || name.includes('coldplunge') ||
    nid.includes('icebath') || name.includes('icebath')
  ) {
    return 'periodic_weekly'
  }

  return 'daily'
}

/**
 * Calculates scientifically sound adherence metrics across all active modalities,
 * handling new habits (<14 days), pulsed modalities (30-day reference window), and established habits.
 */
export function calculateStackAdherence(
  activeModalitiesMap: Map<string, Modality>,
  history: DailyProtocolTask[],
  todayStr: string = new Date().toISOString().split('T')[0]
): Map<string, ModalityAdherenceMetrics> {
  const result = new Map<string, ModalityAdherenceMetrics>()
  const todayTimestamp = new Date(todayStr).getTime()

  // Pre-generate last 7 day dates for the mini timeline
  const last7Days: { date: string; dayLabel: string }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayTimestamp - i * 24 * 60 * 60 * 1000)
    const dateStr = d.toISOString().split('T')[0]
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'narrow' })
    last7Days.push({ date: dateStr, dayLabel })
  }

  // 1. Group historical task logs by modality
  const taskLogsByModality = new Map<string, DailyProtocolTask[]>()
  activeModalitiesMap.forEach((_, modId) => {
    taskLogsByModality.set(modId, [])
  })

  history.forEach(task => {
    const modId = task.modality_id || task.protocol_step?.modality_id
    if (modId && taskLogsByModality.has(modId)) {
      taskLogsByModality.get(modId)!.push(task)
    }
  })

  // 2. Compute adherence metrics per modality
  activeModalitiesMap.forEach((modality, modId) => {
    const logs = taskLogsByModality.get(modId) || []
    const cadence = detectModalityCadence(modality)

    // Deduplicate logs by date (take the highest completion status if multiple entries exist on the same date)
    const dateMap = new Map<string, DailyProtocolTask>()
    logs.forEach(l => {
      const dStr = l.scheduled_date || (l.created_at ? l.created_at.split('T')[0] : null)
      if (!dStr) return
      const existing = dateMap.get(dStr)
      if (!existing) {
        dateMap.set(dStr, l)
      } else if (l.status === 'completed' || (l.status === 'partial' && existing.status !== 'completed')) {
        dateMap.set(dStr, l)
      }
    })

    const uniqueDates = Array.from(dateMap.keys()).sort()
    const completedDatesCount = Array.from(dateMap.values()).filter(l => l.status === 'completed' || l.status === 'partial').length

    // Determine how long the user has actually been actively logging this modality
    let earliestActiveDate = todayStr
    if (uniqueDates.length > 0) {
      earliestActiveDate = uniqueDates[0]
    }

    const daysSinceStart = Math.max(1, Math.round((todayTimestamp - new Date(earliestActiveDate).getTime()) / (1000 * 60 * 60 * 24)) + 1)
    
    // Dynamic reference window: at most 14 days (or 30 days strictly for monthly senolytic pulses)
    const maxWindow = cadence === 'pulsed_monthly' ? 30 : 14
    const referenceWindowDays = Math.min(maxWindow, daysSinceStart)

    const cutoffDate = new Date(todayTimestamp - (referenceWindowDays - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    // Evaluate deduplicated dates within the window
    let scheduled = 0
    let completed = 0

    uniqueDates.forEach(dStr => {
      if (dStr >= cutoffDate && dStr <= todayStr) {
        const task = dateMap.get(dStr)!
        if (task.status !== 'contraindicated' && task.status !== 'not_today') {
          // If task is today and still pending, don't penalize as a miss yet
          if (dStr === todayStr && task.status === 'pending') {
            scheduled += 1
          } else if (task.status === 'completed') {
            scheduled += 1
            completed += 1
          } else if (task.status === 'partial') {
            scheduled += 1
            completed += 0.5
          } else if (task.status === 'skipped' || task.status === 'missed' || (task.status === 'pending' && dStr < todayStr)) {
            scheduled += 1
          }
        }
      }
    })

    // If no past scheduled dates, default to 1 scheduled (today)
    if (scheduled === 0) {
      scheduled = 1
      completed = 0
    }

    const adherencePercent = (completed / scheduled) * 100

    // New Habit determination: active for <= 7 days OR fewer than 4 total scheduled days OR fewer than 2 completed logs
    const isNewHabit = daysSinceStart <= 7 || scheduled <= 4 || completedDatesCount < 2

    // 5-Tier Habit Lifecycle Classification
    let insightStatus: HabitLifecycleStatus = 'steady'
    let insightMsg = ''

    const isHighImpact = (modality.functional_impacts ? Math.max(...Object.values(modality.functional_impacts).map((i: any) => i.score || 0)) : 5) >= 7
    const isHighEffort = modality.effort_level === 'high' || modality.effort_level === 'very_high'

    if (isNewHabit) {
      insightStatus = 'new_habit'
      insightMsg = `Ramping Up: Added recently (${completed} of ${scheduled} completed). Building initial 14-day baseline.`
    } else if (adherencePercent >= 80) {
      insightStatus = 'momentum'
      insightMsg = `Cornerstone Anchor: Flawless consistency (${Math.round(adherencePercent)}% adherence over ${referenceWindowDays} days).`
    } else if (isHighImpact && adherencePercent < 50) {
      insightStatus = 'leak'
      insightMsg = `Execution Leak: High outcome leverage, but completed ${completed} of ${scheduled} scheduled sessions. Consider time-shifting.`
    } else if (!isHighImpact && isHighEffort && adherencePercent < 40) {
      insightStatus = 'sunk_cost'
      insightMsg = `High Friction / Low Impact: Rarely completed (${completed} of ${scheduled}). Consider benching to save mental bandwidth.`
    } else {
      insightStatus = 'steady'
      insightMsg = `Consistent: Solid baseline execution (${Math.round(adherencePercent)}% adherence).`
    }

    // Generate 7-day mini daily dots
    const dailyDots: ModalityDailyDot[] = last7Days.map(({ date, dayLabel }) => {
      const match = dateMap.get(date)
      if (!match) return { date, dayLabel, status: 'none' }
      if (match.status === 'completed') return { date, dayLabel, status: 'completed' }
      if (match.status === 'partial') return { date, dayLabel, status: 'partial' }
      if (match.status === 'skipped' || match.status === 'missed') return { date, dayLabel, status: 'skipped' }
      return { date, dayLabel, status: 'pending' }
    })

    result.set(modId, {
      modalityId: modId,
      modality,
      scheduledCount: scheduled,
      completedCount: completed,
      adherencePercent,
      activeDaysCount: daysSinceStart,
      referenceWindowDays,
      cadenceType: cadence,
      isNewHabit,
      insightStatus,
      insightMsg,
      dailyDots
    })
  })

  return result
}
