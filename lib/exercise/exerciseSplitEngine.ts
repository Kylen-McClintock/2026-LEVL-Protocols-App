import { DailyProtocolTask, UserProfile, DailyWellbeingCheckin, Modality } from '@/lib/types'
import { deriveAutomaticScheduleConfig } from '@/lib/data'
import { format, parseISO } from 'date-fns'
import { BodyCompositionRecord, loadPhysiqueRecords, savePhysiqueRecordToDB, compressPhysiqueImage } from '@/lib/storage/physiqueStorage'

export interface ExerciseSet {
  set_number: number
  weight_lbs: number
  reps: number
  rpe?: number
  is_warmup?: boolean
}

export interface LoggedExercise {
  name: string
  target_muscle_groups: string[]
  sets: ExerciseSet[]
  total_volume_lbs: number
  estimated_1rm_lbs?: number
}

export interface WorkoutSessionSummary {
  id: string
  date: string
  dayOfWeek: string // 'Mon', 'Tue', etc.
  modalityName: string // e.g. 'Resistance Training / Hypertrophy'
  modalityId?: string
  splitCategory: 'strength' | 'cardio' | 'hiit' | 'recovery' | 'rest'
  duration_minutes: number
  intensity_rpe: number
  total_volume_lbs: number
  total_sets: number
  exercises: LoggedExercise[]
  isCompleted: boolean
  isScheduled: boolean
  taskId?: string
  task?: DailyProtocolTask
  // Correlative Layer Metrics
  sleepQualityRating?: number // 1-10
  deepSleepMinutes?: number
  hrvStatus?: 'optimal' | 'moderate' | 'low'
  sorenessRating?: number // 1-10
  dailyProteinGrams?: number
  antiBluntingStatus: 'compliant' | 'violation' | 'no_cold_exposure'
  antiBluntingNote?: string
}

export interface MuscleGroupVolume {
  muscleGroup: string
  displayName: string
  weeklySets: number
  optimalMinSets: number
  optimalMaxSets: number
  percentageOfTarget: number
  primaryLifts: string[]
}

const MUSCLE_GROUP_MAPPINGS: Record<string, { group: string; label: string }> = {
  // Chest
  'bench press': { group: 'chest', label: 'Chest (Pectorals)' },
  'incline bench press': { group: 'chest', label: 'Chest (Pectorals)' },
  'incline dumbbell press': { group: 'chest', label: 'Chest (Pectorals)' },
  'dumbbell bench press': { group: 'chest', label: 'Chest (Pectorals)' },
  'chest fly': { group: 'chest', label: 'Chest (Pectorals)' },
  'cable flyes': { group: 'chest', label: 'Chest (Pectorals)' },
  'push-ups': { group: 'chest', label: 'Chest (Pectorals)' },
  'dips': { group: 'chest', label: 'Chest (Pectorals)' },
  // Back
  'deadlift': { group: 'back', label: 'Back (Lats & Traps)' },
  'barbell row': { group: 'back', label: 'Back (Lats & Traps)' },
  'dumbbell row': { group: 'back', label: 'Back (Lats & Traps)' },
  'pull-ups': { group: 'back', label: 'Back (Lats & Traps)' },
  'lat pulldown': { group: 'back', label: 'Back (Lats & Traps)' },
  'seated cable row': { group: 'back', label: 'Back (Lats & Traps)' },
  't-bar row': { group: 'back', label: 'Back (Lats & Traps)' },
  // Quads & Glutes
  'squat': { group: 'quads', label: 'Quads & Glutes' },
  'back squat': { group: 'quads', label: 'Quads & Glutes' },
  'front squat': { group: 'quads', label: 'Quads & Glutes' },
  'leg press': { group: 'quads', label: 'Quads & Glutes' },
  'lunges': { group: 'quads', label: 'Quads & Glutes' },
  'bulgarian split squat': { group: 'quads', label: 'Quads & Glutes' },
  'leg extension': { group: 'quads', label: 'Quads & Glutes' },
  'hack squat': { group: 'quads', label: 'Quads & Glutes' },
  // Hamstrings & Posterior Chain
  'romanian deadlift': { group: 'hamstrings', label: 'Hamstrings & Posterior' },
  'rdl': { group: 'hamstrings', label: 'Hamstrings & Posterior' },
  'leg curl': { group: 'hamstrings', label: 'Hamstrings & Posterior' },
  'hamstring curl': { group: 'hamstrings', label: 'Hamstrings & Posterior' },
  'hip thrust': { group: 'glutes', label: 'Glutes & Posterior' },
  'calf raises': { group: 'calves', label: 'Calves' },
  // Shoulders & Arms
  'overhead press': { group: 'shoulders', label: 'Shoulders (Deltoids)' },
  'military press': { group: 'shoulders', label: 'Shoulders (Deltoids)' },
  'standing dumbbell overhead press': { group: 'shoulders', label: 'Shoulders (Deltoids)' },
  'lateral raises': { group: 'shoulders', label: 'Shoulders (Deltoids)' },
  'dumbbell lateral raises': { group: 'shoulders', label: 'Shoulders (Deltoids)' },
  'face pulls': { group: 'shoulders', label: 'Shoulders (Deltoids)' },
  'rear delt flyes': { group: 'shoulders', label: 'Shoulders (Deltoids)' },
  'dumbbell curl': { group: 'arms', label: 'Arms (Biceps & Triceps)' },
  'bicep curls': { group: 'arms', label: 'Arms (Biceps & Triceps)' },
  'hammer curls': { group: 'arms', label: 'Arms (Biceps & Triceps)' },
  'tricep extension': { group: 'arms', label: 'Arms (Biceps & Triceps)' },
  'tricep pushdowns': { group: 'arms', label: 'Arms (Biceps & Triceps)' },
  'skull crushers': { group: 'arms', label: 'Arms (Biceps & Triceps)' }
}

export function isFitnessModality(task: DailyProtocolTask): boolean {
  const m = task.protocol_step?.modality || task.loose_modality
  const mId = (task.modality_id || m?.id || '').toLowerCase()
  const cat = (m?.category || '').toLowerCase()
  const name = (m?.name || '').toLowerCase()
  const displayName = (m?.display_name || '').toLowerCase()

  // Exclude thermal / light / sleep / recovery devices from exercise splits
  if (
    name.includes('sauna') ||
    name.includes('cold water') ||
    name.includes('cold plunge') ||
    name.includes('ice bath') ||
    name.includes('red light') ||
    name.includes('photobiomodulation') ||
    name.includes('hyperbaric') ||
    name.includes('cryo') ||
    cat === 'sleep' ||
    cat === 'mind' ||
    cat === 'nutrition'
  ) {
    return false
  }

  return (
    cat.includes('fitness') ||
    cat.includes('strength') ||
    cat.includes('exercise') ||
    cat.includes('cardio') ||
    cat.includes('performance') ||
    mId.includes('resistance') ||
    mId.includes('strength') ||
    mId.includes('cardio') ||
    mId.includes('hiit') ||
    mId.includes('training') ||
    mId.includes('workout') ||
    mId.includes('bfr') ||
    mId.includes('isometric') ||
    mId.includes('sprint') ||
    mId.includes('decathlon') ||
    mId.includes('shear') ||
    mId.includes('vo2') ||
    name.includes('training') ||
    name.includes('workout') ||
    name.includes('resistance') ||
    name.includes('strength') ||
    name.includes('cardio') ||
    name.includes('decathlon') ||
    name.includes('sprint') ||
    name.includes('hiit') ||
    name.includes('vo2') ||
    name.includes('zone 2') ||
    name.includes('shear stress') ||
    name.includes('aerobic') ||
    name.includes('hypertrophy') ||
    displayName.includes('training') ||
    displayName.includes('workout')
  )
}

export interface DayWorkoutSummary {
  date: string
  dayOfWeek: string
  dayNumber: string
  isToday: boolean
  sessions: WorkoutSessionSummary[]
  isRestDay: boolean
  sleepQualityRating?: number
  deepSleepMinutes?: number
  hrvStatus?: 'optimal' | 'moderate' | 'low'
  sorenessRating?: number
  dailyProteinGrams?: number
  dayAntiBluntingStatus: 'compliant' | 'violation' | 'no_cold_exposure'
  dayAntiBluntingNote?: string
}

export function isColdExposureModality(task: DailyProtocolTask): boolean {
  const m = task.protocol_step?.modality || task.loose_modality
  const mId = (task.modality_id || m?.id || '').toLowerCase()
  const cat = (m?.category || '').toLowerCase()
  const name = (m?.name || '').toLowerCase()

  return (
    cat.includes('cold') ||
    mId.includes('cold') ||
    mId.includes('plunge') ||
    mId.includes('ice') ||
    mId.includes('cryo') ||
    name.includes('cold') ||
    name.includes('plunge') ||
    name.includes('ice bath')
  )
}

/**
 * Parses workout sessions, sets, volume tonnage, and correlative overlays strictly from the user's actual tasks
 */
export function extractWorkoutSessions(
  tasks: DailyProtocolTask[],
  weekDays: Date[],
  userProfile?: UserProfile | null,
  wellbeingLogs: DailyWellbeingCheckin[] = []
): {
  days: DayWorkoutSummary[]
  sessions: WorkoutSessionSummary[]
  muscleVolumes: MuscleGroupVolume[]
  totalWeeklyVolumeLbs: number
  totalWeeklySets: number
  antiBluntingCompliancePct: number
  activeFitnessModalities: Modality[]
} {
  const allSessions: WorkoutSessionSummary[] = []
  const days: DayWorkoutSummary[] = []
  const muscleSetsMap = new Map<string, { label: string; sets: number; lifts: Set<string> }>()
  const activeFitnessModalitiesMap = new Map<string, Modality>()

  // Ingest all active fitness modalities across the entire task set
  tasks.forEach(t => {
    if (isFitnessModality(t)) {
      const m = t.protocol_step?.modality || t.loose_modality
      if (m) {
        activeFitnessModalitiesMap.set(m.id || m.slug, m)
      } else if (t.modality_id) {
        activeFitnessModalitiesMap.set(t.modality_id, {
          id: t.modality_id,
          slug: t.modality_id,
          name: t.protocol_step?.protocol?.name || t.modality_id,
          status: 'active'
        } as Modality)
      }
    }
  })

  // Standard Evidence-Based Muscle Groups (Schoenfeld et al., 2017)
  const standardGroups = [
    { key: 'chest', label: 'Chest (Pectorals)', min: 12, max: 18 },
    { key: 'back', label: 'Back (Lats & Traps)', min: 14, max: 20 },
    { key: 'quads', label: 'Quads & Glutes', min: 12, max: 18 },
    { key: 'hamstrings', label: 'Hamstrings & Posterior', min: 10, max: 16 },
    { key: 'shoulders', label: 'Shoulders (Deltoids)', min: 10, max: 16 },
    { key: 'arms', label: 'Arms (Biceps & Triceps)', min: 10, max: 16 }
  ]

  standardGroups.forEach(g => {
    muscleSetsMap.set(g.key, { label: g.label, sets: 0, lifts: new Set() })
  })

  let totalVolumeAll = 0
  let totalSetsAll = 0
  let compliantLiftingDaysCount = 0
  let totalLiftingDaysCount = 0

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const profileLiftingDays = new Set(
    (userProfile?.resistance_training_days || []).map(d => d.toLowerCase())
  )

  weekDays.forEach(day => {
    const dateStr = format(day, 'yyyy-MM-dd')
    const dayKey = format(day, 'eee').toLowerCase() // 'mon', 'tue', etc.
    const dayName = format(day, 'EEE')
    const dayNumber = format(day, 'd')

    // Find all real tasks on this day
    const dayTasks = tasks.filter(t => t.scheduled_date === dateStr)
    const dayFitnessTasks = dayTasks.filter(isFitnessModality)
    const coldPlungeTask = dayTasks.find(isColdExposureModality)
    const wellbeing = wellbeingLogs.find(w => w.checkin_date === dateStr)

    // Deduplicate identical modalities scheduled multiple times on the exact same day
    const dedupedDayFitnessTasks: DailyProtocolTask[] = []
    const seenModalitiesOnDay = new Set<string>()

    dayFitnessTasks.forEach(t => {
      const mod = t.protocol_step?.modality || t.loose_modality
      const key = mod?.name || mod?.id || t.modality_id || t.id
      if (!seenModalitiesOnDay.has(key)) {
        seenModalitiesOnDay.add(key)
        dedupedDayFitnessTasks.push(t)
      }
    })

    // Ingest all fitness tasks for this day, respecting custom modality schedule configs and user profile lifting days
    const activeDayFitnessTasks = dedupedDayFitnessTasks.filter(fTask => {
      const m = fTask.protocol_step?.modality || fTask.loose_modality
      const modalityName = (m?.name || fTask.protocol_step?.protocol?.name || fTask.modality_id || '').toLowerCase()
      
      const isCardioOrHiit = 
        modalityName.includes('cardio') || 
        modalityName.includes('zone 2') || 
        modalityName.includes('hiit') || 
        modalityName.includes('sprint') || 
        modalityName.includes('shear stress') || 
        modalityName.includes('running') || 
        modalityName.includes('cycling')

      // Check if this modality has a custom schedule_config (e.g. days_of_week or rest_interval)
      const modKey = m?.id || fTask.modality_id || fTask.id
      let schedConfig: any = fTask.execution_details?.schedule_config
      if (!schedConfig && typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem(`levl_modality_sched_${modKey}`)
          if (raw) schedConfig = JSON.parse(raw)
        } catch (e) {
          // ignore
        }
      }
      if (!schedConfig) {
        schedConfig = deriveAutomaticScheduleConfig(m, fTask.protocol_step, fTask)
      }

      // If user has customized scheduling, enforce specific_dates, rolling rest_interval, or locked days_of_week
      if (schedConfig) {
        if (schedConfig.schedule_mode === 'specific_dates' || (Array.isArray(schedConfig.specific_dates) && schedConfig.specific_dates.length > 0)) {
          if (schedConfig.specific_dates.includes(dateStr)) {
            return true
          }
          return fTask.status === 'completed'
        }

        if (schedConfig.schedule_mode === 'rest_interval' && schedConfig.is_rolling_rotation !== false && schedConfig.rest_days_between !== undefined) {
          const anchorStr = (schedConfig.anchor_date || fTask.scheduled_date || '').split('T')[0]
          if (anchorStr) {
            const d1 = new Date(anchorStr + 'T12:00:00')
            const d2 = new Date(dateStr + 'T12:00:00')
            const diffDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
            const step = schedConfig.rest_days_between + 1
            if (diffDays >= 0) {
              if (diffDays % step !== 0) {
                return fTask.status === 'completed'
              }
              return true
            }
          }
        }

        if (Array.isArray(schedConfig.days_of_week) && schedConfig.days_of_week.length > 0) {
          const matchingDays = schedConfig.days_of_week.map((d: string) => d.toLowerCase().slice(0, 3))
          if (!matchingDays.includes(dayKey.slice(0, 3))) {
            return fTask.status === 'completed'
          }
        }
        return true
      }

      // Default behavior when no custom schedule_config is set:
      // Cardio and HIIT remain on their scheduled calendar days
      if (isCardioOrHiit) return true

      // If user has specific resistance training days configured in profile, respect them
      if (profileLiftingDays.size > 0) {
        return profileLiftingDays.has(dayKey)
      }

      return true
    })

    const daySessions: WorkoutSessionSummary[] = []
    let dayAntiBluntingStatus: WorkoutSessionSummary['antiBluntingStatus'] = 'no_cold_exposure'
    let dayAntiBluntingNote = 'No cold plunge scheduled on this day.'

    if (activeDayFitnessTasks.length > 0) {
      activeDayFitnessTasks.forEach((fTask, fIdx) => {
        const m = fTask.protocol_step?.modality || fTask.loose_modality
        const modalityName = m?.name || fTask.protocol_step?.protocol?.name || fTask.modality_id || 'Fitness Session'
        const modalityId = m?.id || fTask.modality_id
        if (m) activeFitnessModalitiesMap.set(m.id || m.slug, m)

        const isCompleted = fTask.status === 'completed'
        const isScheduled = true

        // Categorize split
        let splitCategory: WorkoutSessionSummary['splitCategory'] = 'strength'
        const lowerName = modalityName.toLowerCase()
        if (
          lowerName.includes('cardio') ||
          lowerName.includes('zone 2') ||
          lowerName.includes('running') ||
          lowerName.includes('cycling') ||
          lowerName.includes('aerobic')
        ) {
          splitCategory = 'cardio'
        } else if (
          lowerName.includes('hiit') ||
          lowerName.includes('vo2 max') ||
          lowerName.includes('sprint') ||
          lowerName.includes('shear stress')
        ) {
          splitCategory = 'hiit'
        } else if (lowerName.includes('recovery') || lowerName.includes('stretching') || lowerName.includes('yoga')) {
          splitCategory = 'recovery'
        } else {
          splitCategory = 'strength'
        }

        let duration = 0
        let intensity = 0
        let sessionVolume = 0
        let sessionSets = 0
        const parsedExercises: LoggedExercise[] = []

        if (fTask.execution_details) {
          const details = fTask.execution_details as any
          duration = details.duration ? parseInt(details.duration) || 0 : 0
          intensity = details.intensity ? parseFloat(details.intensity) || 0 : 0

          const rawSets = Array.isArray(details.sets) ? details.sets : []
          const liftMap = new Map<string, ExerciseSet[]>()

          rawSets.forEach((s: any, sIdx: number) => {
            const liftName = s.lift || 'Exercise Set'
            const weight = parseFloat(s.weight) || 0
            const reps = parseInt(s.reps) || 0
            const rpe = s.rpe ? parseFloat(s.rpe) : undefined

            if (weight > 0 || reps > 0) {
              const exerciseSet: ExerciseSet = {
                set_number: sIdx + 1,
                weight_lbs: weight,
                reps: reps,
                rpe: rpe,
                is_warmup: s.is_warmup || false
              }

              const existing = liftMap.get(liftName) || []
              existing.push(exerciseSet)
              liftMap.set(liftName, existing)

              sessionVolume += weight * reps
              sessionSets += 1

              // Accumulate to muscle group volume if matched
              const normLift = liftName.toLowerCase().trim()
              const matched = MUSCLE_GROUP_MAPPINGS[normLift]
              if (matched) {
                const gData = muscleSetsMap.get(matched.group)
                if (gData) {
                  gData.sets += 1
                  gData.lifts.add(liftName)
                }
              }
            }
          })

          liftMap.forEach((setsList, liftName) => {
            const liftVol = setsList.reduce((acc, s) => acc + s.weight_lbs * s.reps, 0)
            const bestSet = setsList.reduce(
              (max, s) => (s.weight_lbs * (1 + s.reps / 30) > max ? s.weight_lbs * (1 + s.reps / 30) : max),
              0
            )
            const normLift = liftName.toLowerCase().trim()
            const targetMuscle = MUSCLE_GROUP_MAPPINGS[normLift]?.label || 'Target Muscle Group'

            parsedExercises.push({
              name: liftName,
              target_muscle_groups: [targetMuscle],
              sets: setsList,
              total_volume_lbs: Math.round(liftVol),
              estimated_1rm_lbs: Math.round(bestSet)
            })
          })
        }

        // Anti-Blunting verification from actual scheduled tasks
        let antiBluntingStatus: WorkoutSessionSummary['antiBluntingStatus'] = 'no_cold_exposure'
        let antiBluntingNote = 'No cold plunge scheduled on this day.'

        if (splitCategory === 'strength' && (isScheduled || isCompleted)) {
          totalLiftingDaysCount += 1
          if (coldPlungeTask) {
            const plungeSlot = coldPlungeTask.timing_slot || coldPlungeTask.execution_details?.timing || 'morning'
            const workoutSlot = fTask?.timing_slot || userProfile?.primary_workout_window || 'afternoon'

            if (plungeSlot === workoutSlot && plungeSlot !== 'anytime') {
              antiBluntingStatus = 'violation'
              antiBluntingNote = `⚠️ Blunting Risk: Cold exposure and resistance training are both scheduled in the ${plungeSlot} without >4h spacing.`
            } else {
              antiBluntingStatus = 'compliant'
              antiBluntingNote = `🛡️ Compliant: Cold exposure (${plungeSlot}) and resistance training (${workoutSlot}) spaced >4h apart to protect hypertrophy.`
              compliantLiftingDaysCount += 1
            }
          } else {
            antiBluntingStatus = 'compliant'
            antiBluntingNote = '🛡️ Compliant: No cold exposure during post-lifting adaptation window.'
            compliantLiftingDaysCount += 1
          }
        }

        dayAntiBluntingStatus = antiBluntingStatus
        dayAntiBluntingNote = antiBluntingNote

        totalVolumeAll += sessionVolume
        totalSetsAll += sessionSets

        const sessionSummary: WorkoutSessionSummary = {
          id: `session_${dateStr}_${fIdx}`,
          date: dateStr,
          dayOfWeek: dayName,
          modalityName,
          modalityId,
          splitCategory,
          duration_minutes: duration,
          intensity_rpe: intensity,
          total_volume_lbs: sessionVolume,
          total_sets: sessionSets,
          exercises: parsedExercises,
          isCompleted,
          isScheduled,
          taskId: fTask.id,
          task: fTask,
          antiBluntingStatus,
          antiBluntingNote
        }

        daySessions.push(sessionSummary)
        allSessions.push(sessionSummary)
      })
    } else if (profileLiftingDays.has(dayKey)) {
      // User has training scheduled in their profile for this weekday
      const modalityName = 'Resistance Training (Profile Scheduled)'
      const sessionSummary: WorkoutSessionSummary = {
        id: `session_${dateStr}_profile`,
        date: dateStr,
        dayOfWeek: dayName,
        modalityName,
        splitCategory: 'strength',
        duration_minutes: 0,
        intensity_rpe: 0,
        total_volume_lbs: 0,
        total_sets: 0,
        exercises: [],
        isCompleted: false,
        isScheduled: true,
        antiBluntingStatus: 'no_cold_exposure',
        antiBluntingNote: 'Profile scheduled resistance training.'
      }
      daySessions.push(sessionSummary)
      allSessions.push(sessionSummary)
    }

    days.push({
      date: dateStr,
      dayOfWeek: dayName,
      dayNumber,
      isToday: dateStr === todayStr,
      sessions: daySessions,
      isRestDay: daySessions.length === 0,
      sleepQualityRating: (wellbeing as any)?.sleep_quality || (wellbeing as any)?.sleep_quality_score,
      deepSleepMinutes: (wellbeing as any)?.deep_sleep_minutes,
      hrvStatus: (wellbeing as any)?.hrv_score ? ((wellbeing as any).hrv_score > 60 ? 'optimal' : 'moderate') : undefined,
      sorenessRating: (wellbeing as any)?.soreness,
      dailyProteinGrams: (wellbeing as any)?.protein_grams,
      dayAntiBluntingStatus,
      dayAntiBluntingNote
    })
  })

  // Format real weekly muscle group volumes
  const muscleVolumes: MuscleGroupVolume[] = standardGroups.map(g => {
    const data = muscleSetsMap.get(g.key)!
    const weeklySets = data.sets
    const pct = Math.min(100, Math.round((weeklySets / g.min) * 100))

    return {
      muscleGroup: g.key,
      displayName: g.label,
      weeklySets,
      optimalMinSets: g.min,
      optimalMaxSets: g.max,
      percentageOfTarget: pct,
      primaryLifts: Array.from(data.lifts)
    }
  })

  const antiBluntingCompliancePct = totalLiftingDaysCount > 0
    ? Math.round((compliantLiftingDaysCount / totalLiftingDaysCount) * 100)
    : 100

  return {
    days,
    sessions: allSessions,
    muscleVolumes,
    totalWeeklyVolumeLbs: Math.round(totalVolumeAll),
    totalWeeklySets: totalSetsAll,
    antiBluntingCompliancePct,
    activeFitnessModalities: Array.from(activeFitnessModalitiesMap.values())
  }
}

export { loadPhysiqueRecords, savePhysiqueRecordToDB, compressPhysiqueImage }
export type { BodyCompositionRecord } from '@/lib/storage/physiqueStorage'

export function getBodyCompositionRecords(): BodyCompositionRecord[] {
  // Synchronous fallback for legacy callers
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('levl_body_composition_records') : null
    if (raw) return JSON.parse(raw)
  } catch (e) {}
  return []
}

export function saveBodyCompositionRecord(record: BodyCompositionRecord): BodyCompositionRecord[] {
  if (typeof window !== 'undefined') {
    savePhysiqueRecordToDB(record).catch(console.error)
  }
  return [record]
}
