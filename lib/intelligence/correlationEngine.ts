import { getProtocolTasksHistory, getDailyWellbeingHistory, getOutcomeObservationsHistory, saveModalityOverride, getModalities } from '../data'
import { DailyProtocolTask, DailyWellbeingCheckin, Modality } from '../types'

/**
 * The N-of-1 Correlation Engine
 * Analyzes the user's historical adherence against their subjective wellbeing and micro-observations
 * to find personalized biological responses.
 */
export async function runCorrelationEngine(localUserId: string, daysToLookBack: number = 30) {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(endDate.getDate() - daysToLookBack)

  const startStr = startDate.toISOString().split('T')[0]
  const endStr = endDate.toISOString().split('T')[0]

  // 1. Fetch Data
  const tasks = await getProtocolTasksHistory(localUserId, startStr, endStr)
  const wellbeing = await getDailyWellbeingHistory(localUserId, startStr, endStr)
  const observations = await getOutcomeObservationsHistory(localUserId, startStr, endStr)
  const allMods = await getModalities()
  const modMap = new Map<string, Modality>(allMods.map(m => [m.id, m]))

  // Map wellbeing by date
  const wellbeingByDate = new Map<string, DailyWellbeingCheckin>()
  wellbeing.forEach(w => wellbeingByDate.set(w.checkin_date, w))

  // Map observations by task_id and checkin_date
  const obsByTask = new Map<string, any[]>()
  const obsByDatePhase = new Map<string, Map<string, any[]>>() // date -> phase -> obs
  
  observations.forEach(o => {
    if (o.task_id) {
      if (!obsByTask.has(o.task_id)) obsByTask.set(o.task_id, [])
      obsByTask.get(o.task_id)!.push(o)
    }
    if (o.checkin_date && o.phase) {
      if (!obsByDatePhase.has(o.checkin_date)) obsByDatePhase.set(o.checkin_date, new Map())
      const phaseMap = obsByDatePhase.get(o.checkin_date)!
      if (!phaseMap.has(o.phase)) phaseMap.set(o.phase, [])
      phaseMap.get(o.phase)!.push(o)
    }
  })

  // Group tasks by modality
  const tasksByModality = new Map<string, DailyProtocolTask[]>()
  tasks.forEach(t => {
    const mId = t.modality_id || t.protocol_step?.modality_id
    if (!mId) return
    if (!tasksByModality.has(mId)) tasksByModality.set(mId, [])
    tasksByModality.get(mId)!.push(t)
  })

  const results = []

  // 2. Analyze each modality
  for (const [modalityId, modTasks] of tasksByModality.entries()) {
    const modality = modMap.get(modalityId)
    if (!modality) continue

    // We need at least 5 completed days to make any correlation
    const completedDays = modTasks.filter(t => t.status === 'completed')
    if (completedDays.length < 5) continue
    
    // We also need some control days (skipped/not done) or at least we evaluate against their general baseline
    const skippedDays = modTasks.filter(t => t.status !== 'completed' && t.status !== 'pending')

    // Determine target outcomes. Default to core metrics if modality targets them.
    // E.g., Coffee -> Energy, Focus
    const targetOutcomes = modality.functional_outcomes_to_track || []
    
    // Evaluate each outcome
    for (const outcome of targetOutcomes) {
      let totalTreatmentDelta = 0
      let treatmentCount = 0

      // Calculate micro-signal delta for Treatment (Completed)
      completedDays.forEach(task => {
        const taskObs = obsByTask.get(task.id) || []
        const before = taskObs.find(o => o.outcome_id === outcome && o.phase === 'before_modality')
        const after = taskObs.find(o => o.outcome_id === outcome && o.phase === 'after_modality')
        
        if (before && after) {
          totalTreatmentDelta += (after.value_0_10 - before.value_0_10)
          treatmentCount++
        } else {
          // Fallback to daily wellbeing if mapped
          // e.g., if outcome is 'energy', look at daily checkin
          const wb = wellbeingByDate.get(task.scheduled_date)
          if (wb) {
            let val = null
            if (outcome === 'energy_level' || outcome === 'energy') val = wb.energy_0_10
            if (outcome === 'mood') val = wb.mood_0_10
            if (outcome === 'stress') val = wb.stress_0_10
            if (outcome === 'sleep_quality' || outcome === 'sleep') val = wb.subjective_sleep_0_10
            
            // Also check nightly phase observations for this outcome
            const nightlyObs = obsByDatePhase.get(task.scheduled_date)?.get('nightly')?.find(o => o.outcome_id === outcome)
            if (nightlyObs) val = nightlyObs.value_0_10

            // If we only have an absolute daily score, we need a baseline to compare it to.
            // For simplicity in this engine, if we don't have a direct 'before', we assume their baseline is their overall average for that metric.
            if (val !== null && val !== undefined) {
              // We'll calculate absolute average later, but for now just sum
              totalTreatmentDelta += val
              treatmentCount++
            }
          }
        }
      })

      // Calculate Control Delta
      let totalControlDelta = 0
      let controlCount = 0

      skippedDays.forEach(task => {
        const wb = wellbeingByDate.get(task.scheduled_date)
        if (wb) {
          let val = null
          if (outcome === 'energy_level' || outcome === 'energy') val = wb.energy_0_10
          if (outcome === 'mood') val = wb.mood_0_10
          if (outcome === 'stress') val = wb.stress_0_10
          if (outcome === 'sleep_quality' || outcome === 'sleep') val = wb.subjective_sleep_0_10
          
          const nightlyObs = obsByDatePhase.get(task.scheduled_date)?.get('nightly')?.find(o => o.outcome_id === outcome)
          if (nightlyObs) val = nightlyObs.value_0_10

          if (val !== null && val !== undefined) {
            totalControlDelta += val
            controlCount++
          }
        }
      })

      if (treatmentCount > 0 && controlCount > 0) {
        const treatmentAvg = totalTreatmentDelta / treatmentCount
        const controlAvg = totalControlDelta / controlCount
        const rawDelta = treatmentAvg - controlAvg
        
        // Is the outcome lower_is_better? (e.g. stress, pain)
        // For simplicity, we assume higher is better unless name contains 'stress' or 'pain'
        const isLowerBetter = outcome.includes('stress') || outcome.includes('pain')
        const effectiveDelta = isLowerBetter ? -rawDelta : rawDelta

        // Confidence heuristic
        const confidence = Math.min(100, Math.max(0, (treatmentCount + controlCount) * 5))

        let insightType = null
        let text = ''

        if (effectiveDelta >= 1.5) {
          insightType = 'hyper_responder'
          text = `Your biology hyper-responds to ${modality.name}. It drives ${effectiveDelta.toFixed(1)} more ${outcome.replace('_', ' ')} for you than days without it.`
        } else if (effectiveDelta <= -1.0) {
          insightType = 'negative_correlation'
          text = `Negative impact: ${modality.name} correlates with a ${Math.abs(effectiveDelta).toFixed(1)} drop in your ${outcome.replace('_', ' ')}.`
        } else if (effectiveDelta > -0.5 && effectiveDelta < 0.5 && completedDays.length >= 14) {
          insightType = 'non_responder'
          text = `You've been highly adherent to ${modality.name} for 14+ days, but your ${outcome.replace('_', ' ')} hasn't improved. Consider swapping.`
        }

        if (insightType && confidence >= 50) { // Require 50% confidence
          const patchJsonb = {
            insight_type: insightType,
            outcome: outcome,
            delta: parseFloat(effectiveDelta.toFixed(2)),
            text: text,
            treatmentAvg: parseFloat(treatmentAvg.toFixed(2)),
            controlAvg: parseFloat(controlAvg.toFixed(2)),
            sampleSize: treatmentCount + controlCount
          }

          // Save to database
          await saveModalityOverride(localUserId, modalityId, 'n_of_1_correlation', patchJsonb, confidence)
          
          results.push({ modalityId, patchJsonb })
        }
      }
    }
  }

  return results
}
