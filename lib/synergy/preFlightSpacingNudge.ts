import { DailyProtocolTask, UserProfile } from '@/lib/types'
import { format } from 'date-fns'

export interface PreFlightSpacingNudge {
  id: string
  type: 
    | 'hypertrophy_blunting' 
    | 'ros_blunting' 
    | 'mitochondrial_blunting' 
    | 'chrono_circadian' 
    | 'absorption_clash'
    | 'cyp3a4_inhibition'
  severity: 'warning' | 'critical'
  title: string
  message: string
  elapsedMinutes?: number
  remainingMinutes?: number
  conflictingTaskName?: string
  safeTargetTimeStr?: string
  safeTargetTimingSlot?: string
  actionLabel?: string
  citation: string
  pubmedUrl: string
  canAutoDelay: boolean
}

/**
 * Normalizes modality / task strings for clinical keyword matching
 */
function extractTaskSearchText(task: DailyProtocolTask): string {
  const mId = (task.modality_id || task.protocol_step?.modality_id || task.loose_modality?.id || '').toLowerCase()
  const mName = (task.protocol_step?.modality?.name || task.loose_modality?.name || '').toLowerCase()
  const mCat = (task.protocol_step?.modality?.category || task.loose_modality?.category || '').toLowerCase()
  const mStep = (task.protocol_step?.instructions || '').toLowerCase()
  return `${mId} ${mName} ${mCat} ${mStep}`
}

/**
 * Calculates hours remaining between now and planned bedtime
 */
function getHoursUntilBed(bedtimeStr: string = '22:30', now: Date = new Date()): number {
  const [bedH, bedM] = (bedtimeStr || '22:30').split(':').map(Number)
  const safeH = isNaN(bedH) ? 22 : bedH
  const safeM = isNaN(bedM) ? 30 : bedM
  
  const currentHours = now.getHours() + now.getMinutes() / 60
  const bedHours = safeH + safeM / 60
  
  let diff = bedHours - currentHours
  if (diff < 0) diff += 24
  return diff
}

/**
 * Evaluates real-time pre-flight conflicts and pharmacological spacing
 * between a pending task and recently completed or concurrently scheduled tasks.
 */
export function detectPreFlightSpacingNudge(
  task: DailyProtocolTask,
  recentTasks?: DailyProtocolTask[],
  userProfile?: UserProfile | null,
  now: Date = new Date()
): PreFlightSpacingNudge | null {
  // Only evaluate active pending tasks
  if (task.status !== 'pending') return null

  const taskText = extractTaskSearchText(task)
  const currentSlot = (task.timing_slot || task.protocol_step?.timing_slot || '').toLowerCase()
  const bedtimeStr = (userProfile as any)?.sleep_schedule?.bed_time || userProfile?.ideal_bedtime || '22:30'
  const hoursUntilBed = getHoursUntilBed(bedtimeStr, now)

  // -------------------------------------------------------------
  // 1. COLD PLUNGE / CRYO vs. STRENGTH TRAINING (4h Cooldown)
  // -------------------------------------------------------------
  const isColdPlunge = 
    taskText.includes('cold') || 
    taskText.includes('ice bath') || 
    taskText.includes('icebath') || 
    taskText.includes('plunge') || 
    taskText.includes('cryo')

  if (isColdPlunge && recentTasks && recentTasks.length > 0) {
    const completedStrength = recentTasks.find(t => {
      if (t.status !== 'completed' || !t.completed_at) return false
      const tText = extractTaskSearchText(t)
      return (
        tText.includes('strength') || 
        tText.includes('resistance') || 
        tText.includes('weight') || 
        tText.includes('hypertrophy') || 
        tText.includes('lifting') ||
        tText.includes('centenarian')
      )
    })

    if (completedStrength && completedStrength.completed_at) {
      const compDate = new Date(completedStrength.completed_at)
      const elapsedMins = Math.floor((now.getTime() - compDate.getTime()) / 60000)
      if (elapsedMins >= 0 && elapsedMins < 240) {
        const remainingMins = 240 - elapsedMins
        const safeDate = new Date(compDate.getTime() + 240 * 60000)
        const safeTargetTimeStr = format(safeDate, 'h:mm a')
        const strName = completedStrength.protocol_step?.modality?.name || completedStrength.loose_modality?.name || 'Strength Training'

        return {
          id: 'nudge_cold_vs_strength',
          type: 'hypertrophy_blunting',
          severity: 'warning',
          title: 'Hypertrophy Blunting Hazard',
          message: `${strName} was completed ${elapsedMins}m ago. Cold water immersion within 4 hours constricts microvasculature, suppresses localized COX-2 inflammatory signaling, and blunts p70S6K satellite cell activation. Delay until ${safeTargetTimeStr} (${remainingMins}m left) to preserve myofibrillar protein synthesis.`,
          elapsedMinutes: elapsedMins,
          remainingMinutes: remainingMins,
          conflictingTaskName: strName,
          safeTargetTimeStr,
          safeTargetTimingSlot: 'evening',
          actionLabel: `Delay to ${safeTargetTimeStr}`,
          citation: 'Peake et al., J Physiol 2017 (PMID: 28628045) & Roberts et al. (PMID: 26174323)',
          pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/31513336/',
          canAutoDelay: true
        }
      }
    }
  }

  // -------------------------------------------------------------
  // 2. HIGH-DOSE ANTIOXIDANTS vs. WORKOUT ROS (3h Cooldown)
  // -------------------------------------------------------------
  const isAntioxidant = 
    taskText.includes('vitamin c') || 
    taskText.includes('ascorbic') || 
    taskText.includes('vitamin e') || 
    taskText.includes('nac') || 
    taskText.includes('n-acetyl') || 
    taskText.includes('resveratrol')

  if (isAntioxidant && recentTasks && recentTasks.length > 0) {
    const completedWorkout = recentTasks.find(t => {
      if (t.status !== 'completed' || !t.completed_at) return false
      const tText = extractTaskSearchText(t)
      return (
        tText.includes('strength') || 
        tText.includes('resistance') || 
        tText.includes('weight') || 
        tText.includes('cardio') || 
        tText.includes('hiit') || 
        tText.includes('zone 2') || 
        tText.includes('sprint') || 
        tText.includes('running') || 
        tText.includes('cycling')
      )
    })

    if (completedWorkout && completedWorkout.completed_at) {
      const compDate = new Date(completedWorkout.completed_at)
      const elapsedMins = Math.floor((now.getTime() - compDate.getTime()) / 60000)
      if (elapsedMins >= 0 && elapsedMins < 180) {
        const remainingMins = 180 - elapsedMins
        const safeDate = new Date(compDate.getTime() + 180 * 60000)
        const safeTargetTimeStr = format(safeDate, 'h:mm a')
        const workoutName = completedWorkout.protocol_step?.modality?.name || completedWorkout.loose_modality?.name || 'Workout'

        return {
          id: 'nudge_antioxidants_vs_workout',
          type: 'ros_blunting',
          severity: 'warning',
          title: 'Hormetic ROS Blunting Hazard',
          message: `${workoutName} was completed ${elapsedMins}m ago. Acute exercise-induced ROS pulses are obligatory messengers that trigger PGC-1α mitochondrial biogenesis and endogenous SOD/Catalase upregulation. Delay antioxidant dosing until ${safeTargetTimeStr} (${remainingMins}m left).`,
          elapsedMinutes: elapsedMins,
          remainingMinutes: remainingMins,
          conflictingTaskName: workoutName,
          safeTargetTimeStr,
          safeTargetTimingSlot: 'evening',
          actionLabel: `Delay to ${safeTargetTimeStr}`,
          citation: 'Ristow et al., PNAS 2009 (PMID: 19433786) & Paulsen et al. (PMID: 24458514)',
          pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/24458514/',
          canAutoDelay: true
        }
      }
    }
  }

  // -------------------------------------------------------------
  // 3. METFORMIN / BERBERINE vs. CARDIO (3h Cooldown)
  // -------------------------------------------------------------
  const isMitochondrialBlunter = 
    taskText.includes('metformin') || 
    taskText.includes('berberine')

  if (isMitochondrialBlunter && recentTasks && recentTasks.length > 0) {
    const completedCardio = recentTasks.find(t => {
      if (t.status !== 'completed' || !t.completed_at) return false
      const tText = extractTaskSearchText(t)
      return (
        tText.includes('zone 2') || 
        tText.includes('cardio') || 
        tText.includes('aerobic') || 
        tText.includes('endurance') || 
        tText.includes('vo2') ||
        tText.includes('running')
      )
    })

    if (completedCardio && completedCardio.completed_at) {
      const compDate = new Date(completedCardio.completed_at)
      const elapsedMins = Math.floor((now.getTime() - compDate.getTime()) / 60000)
      if (elapsedMins >= 0 && elapsedMins < 180) {
        const remainingMins = 180 - elapsedMins
        const safeDate = new Date(compDate.getTime() + 180 * 60000)
        const safeTargetTimeStr = format(safeDate, 'h:mm a')
        const cardioName = completedCardio.protocol_step?.modality?.name || completedCardio.loose_modality?.name || 'Cardio Session'

        return {
          id: 'nudge_metformin_vs_cardio',
          type: 'mitochondrial_blunting',
          severity: 'warning',
          title: 'Complex I Respiratory Clash',
          message: `${cardioName} was completed ${elapsedMins}m ago. Complex I inhibition by Metformin/Berberine blunts mitochondrial respiration and attenuates aerobic VO2 max improvements. Delay until ${safeTargetTimeStr} (${remainingMins}m left).`,
          elapsedMinutes: elapsedMins,
          remainingMinutes: remainingMins,
          conflictingTaskName: cardioName,
          safeTargetTimeStr,
          safeTargetTimingSlot: 'evening',
          actionLabel: `Delay to ${safeTargetTimeStr}`,
          citation: 'Konopka et al., Aging Cell 2019 (PMID: 30817791)',
          pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/30817791/',
          canAutoDelay: true
        }
      }
    }
  }

  // -------------------------------------------------------------
  // 4. CAFFEINE / STIMULANTS vs. BEDTIME (t½ = 5.7h)
  // -------------------------------------------------------------
  const isCutoffHabit = 
    taskText.includes('cutoff') || 
    taskText.includes('curfew') || 
    taskText.includes('cessation')

  const isCaffeine = 
    !isCutoffHabit && (
      taskText.includes('caffeine') || 
      taskText.includes('coffee') || 
      taskText.includes('pre-workout') || 
      taskText.includes('preworkout') || 
      taskText.includes('energy drink')
    )

  const isMiddayOrEarlierSlot = 
    currentSlot === 'morning' ||
    currentSlot === 'early_morning' ||
    currentSlot === 'waking' ||
    currentSlot === 'wake_up' ||
    currentSlot === 'breakfast' ||
    currentSlot === 'midday' ||
    currentSlot === 'lunch' ||
    currentSlot.includes('morning') ||
    currentSlot.includes('midday') ||
    currentSlot.includes('wake') ||
    currentSlot.includes('breakfast') ||
    currentSlot.includes('lunch') ||
    now.getHours() <= 13

  // The adenosine receptor blockade conflict warning should not come up for 10-hour caffeine cutoff when it's during midday or earlier time blocks
  if (isCaffeine && !isMiddayOrEarlierSlot && hoursUntilBed > 0 && hoursUntilBed < 10.0) {
    return {
      id: 'nudge_late_caffeine',
      type: 'chrono_circadian',
      severity: 'critical',
      title: 'Adenosine Receptor Blockade Hazard',
      message: `Your bedtime is in ~${hoursUntilBed.toFixed(1)}h. With a caffeine elimination half-life of 5.7h, active serum concentrations will occupy adenosine A1/A2A receptors in the ventrolateral preoptic nucleus (VLPO), severely fragmenting Stage 3/4 slow-wave deep sleep.`,
      safeTargetTimingSlot: 'morning',
      actionLabel: 'Reschedule to Morning',
      citation: 'Drake et al., J Clin Sleep Med 2013 (PMID: 24235903)',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/24235903/',
      canAutoDelay: true
    }
  }

  // -------------------------------------------------------------
  // 5. LATE NMN / NR (Circadian Phase Mismatch)
  // -------------------------------------------------------------
  const isLateNad = 
    taskText.includes('nmn') || 
    taskText.includes('nicotinamide mononucleotide') || 
    taskText.includes('nr') || 
    taskText.includes('nicotinamide riboside')

  if (isLateNad && (now.getHours() >= 14 || hoursUntilBed < 8.0)) {
    return {
      id: 'nudge_late_nad',
      type: 'chrono_circadian',
      severity: 'warning',
      title: 'Peripheral CLOCK:BMAL1 Desynchrony',
      message: 'NAD+ precursor supplementation late in the day elevates SIRT1 out of circadian phase, desynchronizing peripheral liver/muscle CLOCK:BMAL1 oscillatory gene expression from the central SCN clock.',
      safeTargetTimingSlot: 'morning',
      actionLabel: 'Move to Morning Slot',
      citation: 'Chang & Guarente, Cell 2013 (PMID: 23817539)',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/23817539/',
      canAutoDelay: true
    }
  }

  // -------------------------------------------------------------
  // 6. MAGNESIUM MALATE BEFORE BED
  // -------------------------------------------------------------
  const isMagMalate = 
    taskText.includes('magnesium malate') || 
    (taskText.includes('magnesium') && taskText.includes('malate'))

  const isEveningTiming = 
    currentSlot.includes('evening') || 
    currentSlot.includes('bed') || 
    currentSlot.includes('night') || 
    currentSlot.includes('wind')

  if (isMagMalate && (isEveningTiming || hoursUntilBed < 4.0)) {
    return {
      id: 'nudge_mag_malate_night',
      type: 'chrono_circadian',
      severity: 'warning',
      title: 'Krebs Cycle Energetic Stimulation at Night',
      message: 'Malic acid is a rate-limiting Krebs cycle intermediate that drives cellular ATP synthesis, stimulating wakefulness. Reserve Magnesium Malate for morning/midday and use Glycinate or L-Threonate for nocturnal relaxation.',
      safeTargetTimingSlot: 'morning',
      actionLabel: 'Move to Morning Slot',
      citation: 'PMID: 23853635',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/23853635/',
      canAutoDelay: true
    }
  }

  // -------------------------------------------------------------
  // 7. LATE COLD PLUNGE (<3h before bedtime)
  // -------------------------------------------------------------
  if (isColdPlunge && (isEveningTiming || (hoursUntilBed > 0 && hoursUntilBed < 3.0))) {
    return {
      id: 'nudge_late_cold_rebound',
      type: 'chrono_circadian',
      severity: 'warning',
      title: 'Thermal Rebound Sleep Latency Hazard',
      message: 'Cold exposure triggers peripheral vasoconstriction followed by metabolic shivering and core body temperature rebound (+0.5°F–1°F), elevating nocturnal resting heart rate and delaying deep sleep onset.',
      safeTargetTimingSlot: 'morning',
      actionLabel: 'Reschedule to Morning',
      citation: 'Søberg et al., Cell Rep Med 2021 (PMID: 35147574)',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/35147574/',
      canAutoDelay: true
    }
  }

  // -------------------------------------------------------------
  // 8. IRON vs. CALCIUM / COFFEE / ZINC (DMT1 Competition)
  // -------------------------------------------------------------
  const isIron = taskText.includes('iron') || taskText.includes('heme iron')
  if (isIron && recentTasks && recentTasks.length > 0) {
    const competingTask = recentTasks.find(t => {
      if (t.id === task.id) return false
      const tSlot = (t.timing_slot || t.protocol_step?.timing_slot || '').toLowerCase()
      const tText = extractTaskSearchText(t)
      const sameSlot = tSlot === currentSlot
      const hasCompetition = 
        tText.includes('calcium') || 
        tText.includes('coffee') || 
        tText.includes('caffeine') || 
        tText.includes('zinc') || 
        tText.includes('dairy')
      return sameSlot && hasCompetition
    })

    if (competingTask) {
      const compName = competingTask.protocol_step?.modality?.name || competingTask.loose_modality?.name || 'Mineral/Coffee'
      return {
        id: 'nudge_iron_dmt1_clash',
        type: 'absorption_clash',
        severity: 'warning',
        title: 'DMT-1 Mineral Transporter Competition',
        message: `Iron and ${compName} are scheduled in the same time slot (${currentSlot || 'now'}). They compete directly for the Divalent Metal Transporter-1 (DMT1) in enterocytes, reducing iron absorption by up to 60%. Polyphenols also chelate elemental iron.`,
        conflictingTaskName: compName,
        safeTargetTimingSlot: 'midday',
        actionLabel: 'Separate by 2+ Hours',
        citation: 'Lönnerdal, Am J Clin Nutr 2010 (PMID: 21462112)',
        pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/21462112/',
        canAutoDelay: false
      }
    }
  }

  // -------------------------------------------------------------
  // 9. PIPERINE / BERBERINE vs. STATIN / RAPAMYCIN (CYP3A4 / P-gp)
  // -------------------------------------------------------------
  const isCYP3A4Inhibitor = 
    taskText.includes('piperine') || 
    taskText.includes('bioperine') || 
    taskText.includes('black pepper') ||
    taskText.includes('berberine')

  if (isCYP3A4Inhibitor && recentTasks && recentTasks.length > 0) {
    const rxTask = recentTasks.find(t => {
      if (t.id === task.id) return false
      const tSlot = (t.timing_slot || t.protocol_step?.timing_slot || '').toLowerCase()
      const tText = extractTaskSearchText(t)
      const sameSlot = tSlot === currentSlot
      const isSubstrate = 
        tText.includes('rapamycin') || 
        tText.includes('sirolimus') || 
        tText.includes('statin') || 
        tText.includes('atorvastatin') || 
        tText.includes('rosuvastatin')
      return sameSlot && isSubstrate
    })

    if (rxTask) {
      const rxName = rxTask.protocol_step?.modality?.name || rxTask.loose_modality?.name || 'Prescription Medication'
      return {
        id: 'nudge_cyp3a4_blockade',
        type: 'cyp3a4_inhibition',
        severity: 'critical',
        title: 'CYP3A4 & P-gp Efflux Blockade Alert',
        message: `Piperine/Berberine potently inhibits intestinal cytochrome P450 3A4 (CYP3A4) and P-glycoprotein (P-gp), which can multiply circulating plasma concentrations and systemic exposure of ${rxName} by up to 300%.`,
        conflictingTaskName: rxName,
        safeTargetTimingSlot: 'evening',
        actionLabel: 'Separate Timing Slots',
        citation: 'Jin et al., Phytother Res 2013 (PMID: 23625327)',
        pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/23625327/',
        canAutoDelay: false
      }
    }
  }

  return null
}
