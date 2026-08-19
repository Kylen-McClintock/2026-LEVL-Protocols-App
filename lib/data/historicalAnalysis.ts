import { DailyProtocolTask, DailyWellbeingCheckin, OutcomeDimension } from '../types'

export interface DailyOutcomeShiftSummary {
  outcomeId: string
  outcomeName: string
  preValue?: number
  postValue?: number
  avgDelta: number
  sampleCount: number
  contributingModalities: string[]
  directionality?: string
}

export interface SleepFactorAnalysis {
  factorName: string
  status: 'optimal' | 'suboptimal' | 'missing'
  description: string
  modalityName?: string
  loggedValue?: string
}

export interface AIDailyInsight {
  headline: string
  narrative: string
  keyBioInsight: string
  synergyTags: string[]
}

export interface DailyEfficacySummary {
  dateStr: string
  totalTasks: number
  completedTasks: number
  skippedTasks: number
  adherencePercentage: number
  sleepQualityScore?: number
  wakingRestednessScore?: number
  netOutcomeShifts: DailyOutcomeShiftSummary[]
  sleepFactors: SleepFactorAnalysis[]
  topContributingModalities: string[]
  aiDailyInsight?: AIDailyInsight | null
}

export function generateAIDailySummary(
  summary: Omit<DailyEfficacySummary, 'aiDailyInsight'>,
  tasks: DailyProtocolTask[],
  wellbeingCheckin?: DailyWellbeingCheckin | null
): AIDailyInsight | null {
  const isAdherenceHigh = summary.adherencePercentage >= 50
  const hasCheckin = !!wellbeingCheckin && (
    wellbeingCheckin.mood_0_10 !== undefined || 
    wellbeingCheckin.subjective_sleep_0_10 !== undefined || 
    wellbeingCheckin.energy_0_10 !== undefined ||
    wellbeingCheckin.stress_0_10 !== undefined
  )

  // Must have 50%+ adherence OR completed check-in to trigger AI debrief synthesis
  if (!isAdherenceHigh && !hasCheckin) {
    return null
  }

  const completed = tasks.filter(t => t.status === 'completed')
  const completedNames = completed
    .map(t => t.protocol_step?.modality?.display_name || t.protocol_step?.modality?.name || t.loose_modality?.name || '')
    .filter(Boolean)

  const shifts = summary.netOutcomeShifts
  const positiveShifts = shifts.filter(s => s.avgDelta > 0)
  const stressShifts = shifts.filter(s => s.outcomeId.includes('stress') || s.outcomeName.toLowerCase().includes('stress'))
  const topPositiveShift = positiveShifts[0]
  const topStressDrop = stressShifts.find(s => s.avgDelta < 0)

  // Modality category detection
  const hasCold = completedNames.some(n => n.toLowerCase().includes('cold') || n.toLowerCase().includes('plunge') || n.toLowerCase().includes('ice'))
  const hasSauna = completedNames.some(n => n.toLowerCase().includes('sauna') || n.toLowerCase().includes('thermal'))
  const hasSunlight = completedNames.some(n => n.toLowerCase().includes('sunlight') || n.toLowerCase().includes('light'))
  const hasBreath = completedNames.some(n => n.toLowerCase().includes('breath') || n.toLowerCase().includes('meditat') || n.toLowerCase().includes('nsdr'))
  const hasSleepStack = completedNames.some(n => n.toLowerCase().includes('magnesium') || n.toLowerCase().includes('apigenin') || n.toLowerCase().includes('theanine'))
  const hasExercise = completedNames.some(n => n.toLowerCase().includes('resistance') || n.toLowerCase().includes('zone 2') || n.toLowerCase().includes('workout') || n.toLowerCase().includes('cardio'))

  const sleepScore = summary.sleepQualityScore ?? wellbeingCheckin?.subjective_sleep_0_10
  const moodScore = wellbeingCheckin?.mood_0_10
  const energyScore = wellbeingCheckin?.energy_0_10
  const lastFood = wellbeingCheckin?.last_food_time

  // 1. Determine Headline
  let headline = "🌿 High-Efficacy Protocol Execution & Clean Recovery Phase"
  if (hasCold && topPositiveShift?.outcomeId.includes('focus')) {
    headline = "⚡ Neuro-Vascular Priming: Remarkable Focus Surge & Sympathetic Tone"
  } else if (hasBreath && (topStressDrop || (wellbeingCheckin?.stress_0_10 && wellbeingCheckin.stress_0_10 <= 4))) {
    headline = "🧘 Masterclass in Parasympathetic Tone & Circadian Down-Regulation"
  } else if (summary.adherencePercentage >= 80) {
    headline = "🚀 Flawless Protocol Adherence: Exceptional Cellular & Circadian Consistency"
  } else if (sleepScore && sleepScore >= 8) {
    headline = "🌙 Restorative Architecture: Deep Recovery & High Neural Recharging"
  } else if (hasExercise && hasSauna) {
    headline = "🔥 Cardiovascular Synergy: Heat Shock Protein Activation & Tissue Reset"
  }

  // 2. Craft Uplifting, Insightful Narrative
  const paragraphs: string[] = []

  // Opening Paragraph: Adherence & Drive
  if (summary.adherencePercentage >= 75) {
    paragraphs.push(
      `You operated with exceptional discipline on this date, hitting ${summary.completedTasks} of ${summary.totalTasks} scheduled protocols (${summary.adherencePercentage}% adherence). Your biological system was actively primed across circadian, cognitive, and metabolic vectors.`
    )
  } else if (summary.adherencePercentage >= 50) {
    paragraphs.push(
      `A strong, intentional day with ${summary.completedTasks} completed protocols (${summary.adherencePercentage}% adherence). You successfully locked in critical baseline anchors that compounded your baseline performance.`
    )
  } else {
    paragraphs.push(
      `While physical protocol completion was selective on this date, your recorded subjective check-in (Mood: ${moodScore ?? '--'}/10, Sleep: ${sleepScore ?? '--'}/10) provides high-signal feedback on your recovery readiness.`
    )
  }

  // Middle Paragraph: Specific Biological Synergies & Shifts
  const insightsList: string[] = []

  if (topPositiveShift) {
    const modsStr = topPositiveShift.contributingModalities.slice(0, 2).join(' and ')
    insightsList.push(
      `You experienced a notable +${topPositiveShift.avgDelta} pt surge in ${topPositiveShift.outcomeName}${modsStr ? ` following ${modsStr}` : ''}, validating strong acute receptor responsiveness.`
    )
  }

  if (hasCold && hasSunlight) {
    insightsList.push(
      `Stacking morning photons with cold exposure created a powerful dopamine/norepinephrine cascade, elevating sustained alertness throughout your active daylight window.`
    )
  } else if (hasCold) {
    insightsList.push(
      `Cold exposure stimulated cold-shock proteins (RBM3) and delivered sustained norepinephrine elevation for clean, jitter-free mental clarity.`
    )
  }

  if (hasBreath) {
    insightsList.push(
      `Integrating focused breathwork stimulated vagal nerve outflow, accelerating rapid autonomic down-regulation.`
    )
  }

  if (insightsList.length > 0) {
    paragraphs.push(insightsList.join(' '))
  }

  // Evening / Sleep Analysis
  let eveningInsight = ""
  if (sleepScore !== undefined) {
    if (sleepScore >= 8) {
      eveningInsight = `Nighttime recovery was pristine with an impressive ${sleepScore}/10 sleep score${hasSleepStack ? ', heavily reinforced by your evening neuro-supplement stack' : ''}.`
    } else if (sleepScore <= 5) {
      eveningInsight = `Your sleep score registered at ${sleepScore}/10. ${lastFood ? `Eating at ${lastFood} may have elevated core body temperature and metabolic strain during early slow-wave sleep.` : 'Late evening blue light or sympathetic arousal likely delayed optimal melatonin onset.'}`
    } else {
      eveningInsight = `Sleep registered at a solid ${sleepScore}/10. Refining pre-bed thermal transitions will help unlock deeper delta-wave restorative sleep.`
    }
  } else if (hasSleepStack) {
    eveningInsight = `Your evening relaxation protocols helped maintain consistent nervous system down-regulation leading into the nocturnal window.`
  }

  if (eveningInsight) {
    paragraphs.push(eveningInsight)
  }

  // 3. Key Bio-Insight Takeaway
  let keyBioInsight = "Consistency compounds non-linearly: maintaining your core morning anchors while safeguarding a 2-3h pre-bed digestive buffer will maximize your cognitive and biological return."
  if (topPositiveShift && sleepScore && sleepScore >= 7.5) {
    keyBioInsight = `Key Bio-Insight: Your ${topPositiveShift.contributingModalities[0] || 'protocol'} drove peak +${topPositiveShift.avgDelta} ${topPositiveShift.outcomeName}, while your evening routine secured ${sleepScore}/10 restorative sleep.`
  } else if (topPositiveShift) {
    keyBioInsight = `Key Bio-Insight: ${topPositiveShift.outcomeName} responded powerfully (+${topPositiveShift.avgDelta} shift) to ${topPositiveShift.contributingModalities.join(' + ')}, demonstrating high intervention efficacy.`
  }

  const tags = [
    summary.adherencePercentage >= 70 ? 'High Adherence' : 'Targeted Efficacy',
    topPositiveShift ? `+${topPositiveShift.avgDelta} ${topPositiveShift.outcomeName}` : 'Circadian Alignment',
    sleepScore ? `${sleepScore}/10 Sleep` : 'N=1 Biometrics'
  ]

  return {
    headline,
    narrative: paragraphs.join('\n\n'),
    keyBioInsight,
    synergyTags: tags
  }
}

export function calculateDailyEfficacySummary(
  dateStr: string,
  tasks: DailyProtocolTask[],
  wellbeingCheckin?: DailyWellbeingCheckin | null,
  previousDayTasks?: DailyProtocolTask[]
): DailyEfficacySummary {
  const completedTasks = tasks.filter(t => t.status === 'completed')
  const skippedTasks = tasks.filter(t => t.status === 'skipped')
  const totalTasks = tasks.length
  const adherencePercentage = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0

  // 1. Extract Outcome Shifts from completed tasks
  const outcomeMap: Record<string, {
    name: string
    preSum: number
    postSum: number
    preCount: number
    postCount: number
    modalities: Set<string>
    directionality: string
  }> = {}

  tasks.forEach(task => {
    const mod = task.protocol_step?.modality || task.loose_modality
    const modName = mod?.display_name || mod?.name || 'Protocol Task'
    const details = task.execution_details || {}
    const outcomes = details.outcomes || []

    outcomes.forEach((out: any) => {
      const outId = String(out.outcomeId || out.id || '').toLowerCase().trim()
      const outName = out.outcomeName || out.name || outId
      const dir = out.directionality || 'higher_is_better'

      if (!outId) return

      if (!outcomeMap[outId]) {
        outcomeMap[outId] = {
          name: outName.charAt(0).toUpperCase() + outName.slice(1),
          preSum: 0,
          postSum: 0,
          preCount: 0,
          postCount: 0,
          modalities: new Set(),
          directionality: dir
        }
      }

      if (out.preValue !== undefined && out.preValue !== null) {
        outcomeMap[outId].preSum += Number(out.preValue)
        outcomeMap[outId].preCount += 1
      }
      if (out.postValue !== undefined && out.postValue !== null) {
        outcomeMap[outId].postSum += Number(out.postValue)
        outcomeMap[outId].postCount += 1
      }
      outcomeMap[outId].modalities.add(modName)
    })
  })

  const netOutcomeShifts: DailyOutcomeShiftSummary[] = Object.entries(outcomeMap).map(([id, data]) => {
    const avgPre = data.preCount > 0 ? Math.round((data.preSum / data.preCount) * 10) / 10 : undefined
    const avgPost = data.postCount > 0 ? Math.round((data.postSum / data.postCount) * 10) / 10 : undefined
    const avgDelta = (avgPre !== undefined && avgPost !== undefined) ? Math.round((avgPost - avgPre) * 10) / 10 : 0

    return {
      outcomeId: id,
      outcomeName: data.name,
      preValue: avgPre,
      postValue: avgPost,
      avgDelta,
      sampleCount: Math.max(data.preCount, data.postCount),
      contributingModalities: Array.from(data.modalities),
      directionality: data.directionality
    }
  }).sort((a, b) => Math.abs(b.avgDelta) - Math.abs(a.avgDelta))

  // 2. Extract Sleep Quality
  const sleepQualityScore = wellbeingCheckin?.subjective_sleep_0_10 ?? (wellbeingCheckin?.sleep_score_0_100 ? Math.round(wellbeingCheckin.sleep_score_0_100 / 10) : undefined)
  const wakingRestednessScore = wellbeingCheckin?.energy_0_10 ?? undefined

  // 3. Analyze Sleep Contributing Factors
  const sleepFactors: SleepFactorAnalysis[] = []

  // Check Morning Light Exposure
  const lightTask = tasks.find(t => {
    const name = (t.protocol_step?.modality?.name || t.loose_modality?.name || '').toLowerCase()
    return name.includes('sunlight') || name.includes('light')
  })
  if (lightTask) {
    const isDone = lightTask.status === 'completed'
    sleepFactors.push({
      factorName: 'Morning Sunlight & Circadian Reset',
      status: isDone ? 'optimal' : 'suboptimal',
      description: isDone 
        ? 'Morning photons logged — sets nocturnal melatonin timer (~14-16h delay).' 
        : 'Morning sunlight was not logged on this day.',
      modalityName: 'Morning Sunlight',
      loggedValue: isDone ? 'Completed' : 'Missed'
    })
  }

  // Check Evening Sleep Stack / Supplements (Magnesium, Apigenin, L-Theanine)
  const sleepSuppTask = tasks.find(t => {
    const name = (t.protocol_step?.modality?.name || t.loose_modality?.name || '').toLowerCase()
    return name.includes('magnesium') || name.includes('sleep') || name.includes('glycinate') || name.includes('apigenin') || name.includes('theanine')
  })
  if (sleepSuppTask) {
    const isDone = sleepSuppTask.status === 'completed'
    sleepFactors.push({
      factorName: 'Evening Sleep Hygiene & Neuro-Supplements',
      status: isDone ? 'optimal' : 'suboptimal',
      description: isDone 
        ? 'Evening nervous system relaxants logged prior to bedtime.' 
        : 'Evening sleep stack was skipped or not recorded.',
      modalityName: sleepSuppTask.protocol_step?.modality?.name || sleepSuppTask.loose_modality?.name,
      loggedValue: isDone ? 'Completed' : 'Missed'
    })
  }

  // Check Thermal Modality (Sauna / Hot Bath vs Cold)
  const thermalTask = tasks.find(t => {
    const name = (t.protocol_step?.modality?.name || t.loose_modality?.name || '').toLowerCase()
    return name.includes('sauna') || name.includes('bath') || name.includes('cold')
  })
  if (thermalTask) {
    const isDone = thermalTask.status === 'completed'
    sleepFactors.push({
      factorName: 'Thermal Vasodilation & Core Temp Drop',
      status: isDone ? 'optimal' : 'missing',
      description: isDone
        ? 'Evening heat accelerates subsequent core body temperature reduction necessary for deep slow-wave sleep.'
        : 'No thermal vasodilation logged.',
      modalityName: thermalTask.protocol_step?.modality?.name || thermalTask.loose_modality?.name,
      loggedValue: isDone ? 'Completed' : 'Not Logged'
    })
  }

  // Top Contributing Modalities
  const topContributingModalities = completedTasks
    .map(t => t.protocol_step?.modality?.display_name || t.protocol_step?.modality?.name || t.loose_modality?.name || '')
    .filter(Boolean)
    .slice(0, 5)

  const partialSummary = {
    dateStr,
    totalTasks,
    completedTasks: completedTasks.length,
    skippedTasks: skippedTasks.length,
    adherencePercentage,
    sleepQualityScore,
    wakingRestednessScore,
    netOutcomeShifts,
    sleepFactors,
    topContributingModalities
  }

  const aiDailyInsight = generateAIDailySummary(partialSummary, tasks, wellbeingCheckin)

  return {
    ...partialSummary,
    aiDailyInsight
  }
}

export function extractCircadianOutcomeProgression(
  tasks: DailyProtocolTask[],
  outcomeId: string
) {
  const normalizedTarget = outcomeId.toLowerCase().trim()
  const progression: Array<{
    timeStr: string
    timestamp: string
    modalityName: string
    preValue?: number
    postValue?: number
    delta?: number
    directionality: string
  }> = []

  const completed = tasks
    .filter(t => t.status === 'completed' && t.completed_at)
    .sort((a, b) => new Date(a.completed_at!).getTime() - new Date(b.completed_at!).getTime())

  completed.forEach(task => {
    const mod = task.protocol_step?.modality || task.loose_modality
    const modName = mod?.display_name || mod?.name || 'Modality'
    const outcomes = task.execution_details?.outcomes || []

    const match = outcomes.find((o: any) => {
      const oId = String(o.outcomeId || o.id || '').toLowerCase().trim()
      const oName = String(o.outcomeName || o.name || '').toLowerCase().trim()
      return oId === normalizedTarget || oName === normalizedTarget || oId.includes(normalizedTarget) || normalizedTarget.includes(oId)
    })

    if (match) {
      const preVal = match.preValue !== undefined ? Number(match.preValue) : undefined
      const postVal = match.postValue !== undefined ? Number(match.postValue) : undefined
      const delta = (preVal !== undefined && postVal !== undefined) ? Math.round((postVal - preVal) * 10) / 10 : undefined

      progression.push({
        timeStr: new Date(task.completed_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: task.completed_at!,
        modalityName: modName,
        preValue: preVal,
        postValue: postVal,
        delta,
        directionality: match.directionality || 'higher_is_better'
      })
    }
  })

  return progression
}
