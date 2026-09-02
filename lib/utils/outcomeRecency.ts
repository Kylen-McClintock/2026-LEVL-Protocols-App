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
  timestamp?: number
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
      : (rawCreated ? new Date(rawCreated).getTime() : Date.now() - 3600 * 1000)

    let customJSON = (wellbeingCheckin as any).custom_outcomes_jsonb || {}
    if (typeof customJSON === 'string') {
      try { customJSON = JSON.parse(customJSON) } catch (e) {}
    }
    if (!customJSON || Object.keys(customJSON).length === 0) {
      if ((wellbeingCheckin as any).notes) {
        try {
          const parsedNotes = JSON.parse((wellbeingCheckin as any).notes)
          customJSON = parsedNotes.custom_outcomes_jsonb || parsedNotes.custom_outcomes || {}
        } catch (e) {}
      }
    }

    if (checkinTime > 0) {
      let checkinVal: number | undefined = undefined

      if (cleanId === 'mood' || cleanId.includes('mood')) {
        checkinVal = wellbeingCheckin.mood_0_10 ?? undefined
      } else if (cleanId === 'energy' || cleanId.includes('energy') || cleanId.includes('readiness')) {
        checkinVal = wellbeingCheckin.energy_0_10 ?? undefined
      } else if (cleanId === 'stress' || cleanId.includes('stress') || cleanId.includes('anxiety')) {
        checkinVal = wellbeingCheckin.stress_0_10 ?? undefined
      } else if (cleanId === 'sleep' || cleanId.includes('sleep') || cleanId === 'subjective_sleep' || cleanId === 'sleep_quality') {
        checkinVal = wellbeingCheckin.subjective_sleep_0_10 ?? undefined
      } else {
        const candidates = [
          cleanId,
          cleanId.replace(/\s+/g, '_'),
          cleanId.replace(/_/g, ' '),
          `${cleanId}_score`,
          cleanId.replace(/_score$/, '')
        ]
        for (const k of candidates) {
          if (customJSON[k] !== undefined && typeof customJSON[k] === 'number') {
            checkinVal = customJSON[k]
            break
          }
        }
        if (checkinVal === undefined) {
          if (cleanId === 'focus' || cleanId.includes('focus') || cleanId.includes('clarity')) {
            checkinVal = customJSON.focus_score ?? customJSON.focus
          } else if (cleanId === 'skin' || cleanId.includes('skin')) {
            checkinVal = customJSON.skin_clarity ?? customJSON.skin
          }
        }
      }

      if (typeof checkinVal === 'number' && checkinTime >= candidateTimestamp) {
        candidateVal = checkinVal
        candidateTimestamp = checkinTime
        candidateDateStr = rawUpdated || rawCreated || new Date(checkinTime).toISOString()
        candidateSource = rawUpdated ? 'anytime_checkin' : 'morning_checkin'
      }

      // Check anytime check-in snapshots array if present
      if (Array.isArray(customJSON._anytime_checkins) && customJSON._anytime_checkins.length > 0) {
        customJSON._anytime_checkins.forEach((snap: any) => {
          const snapTime = snap.timestamp ? new Date(snap.timestamp).getTime() : 0
          if (snapTime > 0 && snapTime >= candidateTimestamp) {
            let snapVal: number | undefined = undefined
            if (cleanId === 'mood' || cleanId.includes('mood')) {
              snapVal = snap.mood
            } else if (cleanId === 'energy' || cleanId.includes('energy') || cleanId.includes('readiness')) {
              snapVal = snap.energy
            } else if (cleanId === 'stress' || cleanId.includes('stress') || cleanId.includes('anxiety')) {
              snapVal = snap.stress
            } else if (cleanId === 'focus' || cleanId.includes('focus') || cleanId.includes('clarity')) {
              snapVal = snap.focus ?? snap.focus_score
            } else if (cleanId === 'skin' || cleanId.includes('skin')) {
              snapVal = snap.skin ?? snap.skin_clarity
            } else if (snap[cleanId] !== undefined && typeof snap[cleanId] === 'number') {
              snapVal = snap[cleanId]
            } else {
              const snapCandidates = [
                cleanId,
                cleanId.replace(/\s+/g, '_'),
                cleanId.replace(/_/g, ' '),
                `${cleanId}_score`,
                cleanId.replace(/_score$/, '')
              ]
              for (const k of snapCandidates) {
                if (snap[k] !== undefined && typeof snap[k] === 'number') {
                  snapVal = snap[k]
                  break
                }
              }
            }

            if (typeof snapVal === 'number') {
              candidateVal = snapVal
              candidateTimestamp = snapTime
              candidateDateStr = snap.timestamp
              candidateSource = 'anytime_checkin'
            }
          }
        })
      }
    }
  }

  // 3. Fallback to default neutral (5) if no logs exist
  const isRecent = candidateTimestamp > 0 && (Date.now() - candidateTimestamp < 2 * 60 * 60 * 1000)
  const timeAgoMinutes = candidateTimestamp > 0 ? Math.floor((Date.now() - candidateTimestamp) / (1000 * 60)) : undefined

  return {
    value: candidateVal ?? 5,
    recordedAt: candidateDateStr,
    timestamp: candidateTimestamp,
    isRecent,
    timeAgoMinutes,
    source: candidateSource
  }
}

export interface OutcomeLiveState {
  outcomeId: string
  name: string
  currentValue: number | null
  morningBaseline: number | null
  trend: 'increasing' | 'decreasing' | 'steady' | 'baseline_only' | 'unrecorded'
  delta: number
  sourceLabel: string
  recordedAt: string | null
  timeAgoMinutes?: number
  directionality: 'higher_is_better' | 'lower_is_better'
  icon?: string
}

/**
 * Calculates the real-time live state and trend for an outcome dimension
 * by comparing the latest reading across all sources against the morning baseline.
 */
export function getLatestOutcomeLiveState(
  outcomeId: string,
  wellbeingCheckin?: DailyWellbeingCheckin | null,
  recentTasks?: any[] | null,
  allOutcomes?: any[] | null
): OutcomeLiveState {
  const cleanId = (outcomeId || '').toLowerCase().trim()
  const matchedOutcome = allOutcomes?.find(o => o.id?.toLowerCase() === cleanId || o.name?.toLowerCase() === cleanId)
  const name = matchedOutcome?.name || outcomeId.charAt(0).toUpperCase() + outcomeId.slice(1).replace(/_/g, ' ')
  const directionality = (matchedOutcome?.directionality || (cleanId === 'stress' || cleanId.includes('pain') || cleanId.includes('fatigue') ? 'lower_is_better' : 'higher_is_better')) as 'higher_is_better' | 'lower_is_better'

  // 1. Get morning baseline reading
  let morningBaseline: number | null = null
  let morningTimestamp = 0
  let morningRecordedAt: string | null = null

  if (wellbeingCheckin) {
    const rawTime = (wellbeingCheckin as any).updated_at || (wellbeingCheckin as any).created_at
    morningTimestamp = rawTime ? new Date(rawTime).getTime() : Date.now() - 3600 * 1000
    morningRecordedAt = rawTime || new Date(morningTimestamp).toISOString()

    let customJSON = (wellbeingCheckin as any).custom_outcomes_jsonb || {}
    if (typeof customJSON === 'string') {
      try { customJSON = JSON.parse(customJSON) } catch (e) {}
    }
    if (!customJSON || Object.keys(customJSON).length === 0) {
      if ((wellbeingCheckin as any).notes) {
        try {
          const parsedNotes = JSON.parse((wellbeingCheckin as any).notes)
          customJSON = parsedNotes.custom_outcomes_jsonb || parsedNotes.custom_outcomes || {}
        } catch (e) {}
      }
    }

    if (cleanId === 'mood' || cleanId.includes('mood')) {
      morningBaseline = wellbeingCheckin.mood_0_10 ?? null
    } else if (cleanId === 'energy' || cleanId.includes('energy') || cleanId.includes('readiness')) {
      morningBaseline = wellbeingCheckin.energy_0_10 ?? null
    } else if (cleanId === 'stress' || cleanId.includes('stress') || cleanId.includes('anxiety')) {
      morningBaseline = wellbeingCheckin.stress_0_10 ?? null
    } else if (cleanId === 'sleep' || cleanId.includes('sleep') || cleanId === 'subjective_sleep' || cleanId === 'sleep_quality') {
      morningBaseline = wellbeingCheckin.subjective_sleep_0_10 ?? null
    } else {
      const candidates = [
        cleanId,
        cleanId.replace(/\s+/g, '_'),
        cleanId.replace(/_/g, ' '),
        `${cleanId}_score`,
        cleanId.replace(/_score$/, '')
      ]
      for (const k of candidates) {
        if (customJSON[k] !== undefined && typeof customJSON[k] === 'number') {
          morningBaseline = customJSON[k]
          break
        }
      }
      if (morningBaseline === null) {
        if (cleanId === 'focus' || cleanId.includes('focus')) {
          morningBaseline = customJSON.focus_score ?? customJSON.focus ?? null
        } else if (cleanId === 'skin' || cleanId.includes('skin')) {
          morningBaseline = customJSON.skin_clarity ?? customJSON.skin ?? null
        }
      }
    }
  }

  // 2. Scan for the absolute latest reading across all sources
  let latestVal = morningBaseline
  let latestTimestamp = morningTimestamp
  let latestDateStr = morningRecordedAt
  let latestSourceLabel = morningBaseline !== null ? 'Morning Check-in' : 'Unrecorded'

  // Check anytime check-in snapshots
  if (wellbeingCheckin) {
    let customJSON = (wellbeingCheckin as any).custom_outcomes_jsonb || {}
    if (typeof customJSON === 'string') {
      try { customJSON = JSON.parse(customJSON) } catch (e) {}
    }
    if (!customJSON || Object.keys(customJSON).length === 0) {
      if ((wellbeingCheckin as any).notes) {
        try {
          const parsedNotes = JSON.parse((wellbeingCheckin as any).notes)
          customJSON = parsedNotes.custom_outcomes_jsonb || parsedNotes.custom_outcomes || {}
        } catch (e) {}
      }
    }

    if (Array.isArray(customJSON._anytime_checkins) && customJSON._anytime_checkins.length > 0) {
      customJSON._anytime_checkins.forEach((snap: any) => {
        const snapTime = snap.timestamp ? new Date(snap.timestamp).getTime() : 0
        if (snapTime > 0 && snapTime >= latestTimestamp) {
          let snapVal: number | undefined = undefined
          if (cleanId === 'mood' || cleanId.includes('mood')) snapVal = snap.mood
          else if (cleanId === 'energy' || cleanId.includes('energy') || cleanId.includes('readiness')) snapVal = snap.energy
          else if (cleanId === 'stress' || cleanId.includes('stress') || cleanId.includes('anxiety')) snapVal = snap.stress
          else if (cleanId === 'focus' || cleanId.includes('focus')) snapVal = snap.focus ?? snap.focus_score
          else if (cleanId === 'skin' || cleanId.includes('skin')) snapVal = snap.skin ?? snap.skin_clarity
          else if (snap[cleanId] !== undefined && typeof snap[cleanId] === 'number') snapVal = snap[cleanId]
          else {
            const snapCandidates = [
              cleanId,
              cleanId.replace(/\s+/g, '_'),
              cleanId.replace(/_/g, ' '),
              `${cleanId}_score`,
              cleanId.replace(/_score$/, '')
            ]
            for (const k of snapCandidates) {
              if (snap[k] !== undefined && typeof snap[k] === 'number') {
                snapVal = snap[k]
                break
              }
            }
          }

          if (typeof snapVal === 'number') {
            latestVal = snapVal
            latestTimestamp = snapTime
            latestDateStr = snap.timestamp
            const timeStr = snap.time_display || (snap.timestamp ? new Date(snap.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '')
            latestSourceLabel = `Anytime Check-in${timeStr ? ` (${timeStr})` : ''}`
          }
        }
      })
    }
  }

  // Check completed modality tasks or tasks with logged outcome ratings
  if (recentTasks && recentTasks.length > 0) {
    recentTasks.forEach(task => {
      const isDone = task.status === 'completed'
      const rawDetails = task.execution_details || {}
      const hasLoggedOutcomes = Array.isArray(rawDetails.logged_outcomes) && rawDetails.logged_outcomes.length > 0
      const hasTrackedOutcomes = rawDetails.outcomes_tracked || rawDetails.outcome_ratings

      if (isDone || hasLoggedOutcomes || hasTrackedOutcomes) {
        const rawTime = task.completed_at || task.updated_at || task.created_at
        const taskTime = rawTime ? new Date(rawTime).getTime() : Date.now()
        
        let taskOutcomeVal: number | undefined = undefined

        // A. Check logged_outcomes array format (used by ProtocolTaskCard)
        if (Array.isArray(rawDetails.logged_outcomes)) {
          rawDetails.logged_outcomes.forEach((item: any) => {
            const oId = (item.outcomeId || item.outcome_id || '').toLowerCase().trim()
            const oName = (item.outcomeName || item.name || '').toLowerCase().trim()
            if (oId === cleanId || oName === cleanId || oId.includes(cleanId) || cleanId.includes(oId)) {
              const val = item.postValue ?? item.post_value ?? item.preValue ?? item.pre_value ?? item.value
              if (typeof val === 'number') {
                taskOutcomeVal = val
              }
            }
          })
        }

        // B. Check outcomes_tracked or outcome_ratings map format
        if (taskOutcomeVal === undefined) {
          const tracked = rawDetails.outcomes_tracked || rawDetails.outcome_ratings || {}
          if (tracked[cleanId] !== undefined && typeof tracked[cleanId] === 'number') {
            taskOutcomeVal = tracked[cleanId]
          } else {
            Object.entries(tracked).forEach(([k, v]) => {
              if (typeof v === 'number' && (k.toLowerCase() === cleanId || k.toLowerCase().includes(cleanId) || cleanId.includes(k.toLowerCase()))) {
                taskOutcomeVal = v
              }
            })
          }
        }

        // C. Check direct keys on execution_details
        if (taskOutcomeVal === undefined) {
          if (typeof rawDetails[cleanId] === 'number') {
            taskOutcomeVal = rawDetails[cleanId]
          } else if (typeof rawDetails[`${cleanId}_score`] === 'number') {
            taskOutcomeVal = rawDetails[`${cleanId}_score`]
          }
        }

        if (typeof taskOutcomeVal === 'number' && taskTime >= latestTimestamp) {
          latestVal = taskOutcomeVal
          latestTimestamp = taskTime
          latestDateStr = rawTime || new Date().toISOString()
          const modName = task.loose_modality?.display_name || task.loose_modality?.name || task.protocol_step?.modality?.display_name || task.protocol_step?.modality?.name || 'Modality'
          const timeStr = new Date(taskTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
          latestSourceLabel = `${modName} (${timeStr})`
        }
      }
    })
  }

  // 3. Compute delta & trend direction
  let trend: OutcomeLiveState['trend'] = 'unrecorded'
  let delta = 0

  if (latestVal !== null) {
    if (morningBaseline !== null) {
      delta = latestVal - morningBaseline
      if (delta > 0) trend = 'increasing'
      else if (delta < 0) trend = 'decreasing'
      else trend = latestTimestamp > morningTimestamp ? 'steady' : 'baseline_only'
    } else {
      trend = 'baseline_only'
    }
  }

  let timeAgoMinutes: number | undefined = undefined
  if (latestTimestamp > 0) {
    const ageMs = Date.now() - latestTimestamp
    if (ageMs >= 0) {
      timeAgoMinutes = Math.max(1, Math.round(ageMs / (60 * 1000)))
    }
  }

  return {
    outcomeId,
    name,
    currentValue: latestVal,
    morningBaseline,
    trend,
    delta,
    sourceLabel: latestSourceLabel,
    recordedAt: latestDateStr,
    timeAgoMinutes,
    directionality,
    icon: matchedOutcome?.icon
  }
}
