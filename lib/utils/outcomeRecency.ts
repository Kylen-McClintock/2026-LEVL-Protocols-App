import { DailyWellbeingCheckin } from '@/lib/types'

export interface GenericOutcomeObservation {
  id?: string
  task_id?: string
  modality_id?: string
  outcome_dimension_id?: string
  outcome_id?: string
  dimension_id?: string
  quantity_numeric?: number | null
  value?: number | null
  value_0_10?: number | null
  observation_phase?: string
  phase?: string
  created_at?: string
  recorded_at?: string
}

export interface RecentOutcomeSnapshot {
  value: number
  isRecent: boolean
  recordedAt?: string | null
  timeAgoMinutes?: number
  source?: 'morning_checkin' | 'anytime_checkin' | 'modality_observation' | 'default'
}

/**
 * Resolves the most recent recorded quantity for any outcome dimension.
 * Checks if the last logged entry was within `maxAgeHours` (default: 2 hours).
 * 
 * If within 2 hours: returns the exact recorded quantity and marks `isRecent: true`.
 * If over 2 hours or no previous record: returns 5 and marks `isRecent: false`.
 */
export function getRecentOutcomeSnapshot(
  outcomeId: string,
  wellbeingCheckin?: DailyWellbeingCheckin | null,
  recentObservations?: GenericOutcomeObservation[] | null,
  maxAgeHours: number = 2
): RecentOutcomeSnapshot {
  const maxAgeMs = maxAgeHours * 60 * 60 * 1000
  const now = Date.now()
  const cleanId = (outcomeId || '').toLowerCase().trim()

  let candidateVal: number | null = null
  let candidateTimestamp = 0
  let candidateDateStr: string | null = null
  let candidateSource: 'morning_checkin' | 'anytime_checkin' | 'modality_observation' = 'morning_checkin'

  // 1. Check recent modality observations
  if (recentObservations && recentObservations.length > 0) {
    recentObservations.forEach(obs => {
      const obsDimension = (obs.outcome_dimension_id || (obs as any).dimension_id || '').toLowerCase().trim()
      if (obsDimension === cleanId || obsDimension.includes(cleanId) || cleanId.includes(obsDimension)) {
        const val = obs.quantity_numeric ?? (obs as any).value ?? (obs as any).value_0_10
        if (typeof val === 'number') {
          const rawDate = obs.created_at || (obs as any).recorded_at
          const obsTime = rawDate ? new Date(rawDate).getTime() : 0
          if (obsTime > 0 && obsTime > candidateTimestamp) {
            candidateVal = val
            candidateTimestamp = obsTime
            candidateDateStr = rawDate || null
            candidateSource = 'modality_observation'
          }
        }
      }
    })
  }

  // 2. Check daily wellbeing check-in (mood, energy, stress, or custom outcomes)
  if (wellbeingCheckin) {
    const rawUpdated = (wellbeingCheckin as any).updated_at
    const rawCreated = (wellbeingCheckin as any).created_at
    const checkinTime = rawUpdated 
      ? new Date(rawUpdated).getTime() 
      : (rawCreated ? new Date(rawCreated).getTime() : 0)

    if (checkinTime > 0) {
      let checkinVal: number | undefined = undefined

      if (cleanId === 'mood' || cleanId.includes('mood')) {
        checkinVal = wellbeingCheckin.mood_0_10 ?? undefined
      } else if (cleanId === 'energy' || cleanId.includes('energy') || cleanId.includes('readiness')) {
        checkinVal = wellbeingCheckin.energy_0_10 ?? undefined
      } else if (cleanId === 'stress' || cleanId.includes('stress') || cleanId.includes('anxiety')) {
        checkinVal = wellbeingCheckin.stress_0_10 ?? undefined
      } else if (cleanId === 'sleep' || cleanId.includes('sleep') || cleanId === 'subjective_sleep') {
        checkinVal = wellbeingCheckin.subjective_sleep_0_10 ?? undefined
      } else {
        const customJSON = (wellbeingCheckin as any).custom_outcomes_jsonb || {}
        if (customJSON[cleanId] !== undefined && typeof customJSON[cleanId] === 'number') {
          checkinVal = customJSON[cleanId]
        } else if (customJSON.focus_score !== undefined && (cleanId === 'focus' || cleanId.includes('focus') || cleanId.includes('clarity'))) {
          checkinVal = customJSON.focus_score
        } else if (customJSON.skin_clarity !== undefined && (cleanId === 'skin' || cleanId.includes('skin'))) {
          checkinVal = customJSON.skin_clarity
        }
      }

      if (typeof checkinVal === 'number' && checkinTime > candidateTimestamp) {
        candidateVal = checkinVal
        candidateTimestamp = checkinTime
        candidateDateStr = rawUpdated || rawCreated || null
        candidateSource = rawUpdated ? 'anytime_checkin' : 'morning_checkin'
      }
    }
  }

  // 3. Evaluate if candidate was recorded within the 2-hour window
  if (candidateVal !== null && candidateTimestamp > 0) {
    const ageMs = now - candidateTimestamp
    if (ageMs >= 0 && ageMs <= maxAgeMs) {
      const timeAgoMinutes = Math.max(1, Math.round(ageMs / (60 * 1000)))
      return {
        value: candidateVal,
        isRecent: true,
        recordedAt: candidateDateStr,
        timeAgoMinutes,
        source: candidateSource
      }
    }
  }

  // 4. Default fallback when older than 2 hours or not logged today
  return {
    value: 5,
    isRecent: false,
    recordedAt: null,
    timeAgoMinutes: undefined,
    source: 'default'
  }
}
