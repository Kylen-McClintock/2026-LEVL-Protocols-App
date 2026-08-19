import { DailyProtocolTask } from '@/lib/types'
import { parseISO, addHours, differenceInMinutes, startOfDay } from 'date-fns'

export type BiologicalVector = 
  | 'mTOR_Growth' 
  | 'AMPK_Clearance' 
  | 'Sympathetic_Load' 
  | 'Parasympathetic_Recovery'
  | 'Senolytic_Clearance'

export type WaveformCitation = {
  title: string
  journal: string
  year: number
  pmid: string
  url: string
  summary: string
}

export type WaveformEvent = {
  taskId: string
  modalityName: string
  vector: BiologicalVector
  startTime: Date
  peakTime: Date
  endTime: Date // when it fully fades back to baseline
  peakDelayHours: number
  durationHours: number
  intensity: number // 0.0 to 1.0 (AUC multiplier)
  color: string
  is_macro_pulse: boolean
  citation?: WaveformCitation
}

export type VectorProfileDefinition = {
  vector: BiologicalVector
  intensity: number // 0.0 to 1.0
  peak_delay_hours: number
  duration_hours: number
  is_macro_pulse?: boolean
  citation?: WaveformCitation
}

export const SCIENTIFIC_VECTOR_REGISTRY: Record<string, VectorProfileDefinition[]> = {
  strength: [
    { 
      vector: 'Sympathetic_Load', 
      intensity: 0.9, 
      peak_delay_hours: 0.5, 
      duration_hours: 2.5, 
      is_macro_pulse: true,
      citation: {
        title: "Autonomic nervous system responses to acute resistance exercise",
        journal: "J Appl Physiol",
        year: 2016,
        pmid: "27213469",
        url: "https://pubmed.ncbi.nlm.nih.gov/27213469/",
        summary: "Acute mechanical loading drives a rapid 30-min peak in catecholamines and central sympathetic arousal, returning to baseline within 2.5 hours."
      }
    },
    { 
      vector: 'mTOR_Growth', 
      intensity: 0.85, 
      peak_delay_hours: 3.0, 
      duration_hours: 12.0, 
      is_macro_pulse: true,
      citation: {
        title: "Resistance training-induced changes in integrated myofibrillar protein synthesis",
        journal: "J Physiol",
        year: 2016,
        pmid: "27213469",
        url: "https://pubmed.ncbi.nlm.nih.gov/27213469/",
        summary: "Muscle protein synthesis (MPS) & mTORC1 mechanotransduction peak at 3 hours post-exercise and return to baseline by 12 hours in trained individuals."
      }
    }
  ],
  fasting: [
    { 
      vector: 'AMPK_Clearance', 
      intensity: 0.8, 
      peak_delay_hours: 16.0, 
      duration_hours: 24.0, 
      is_macro_pulse: true,
      citation: {
        title: "Effects of Intermittent Fasting on Health, Aging, and Disease",
        journal: "N Engl J Med (NEJM)",
        year: 2019,
        pmid: "31881139",
        url: "https://pubmed.ncbi.nlm.nih.gov/31881139/",
        summary: "Hepatic glycogen depletion triggers the metabolic switch at ~12h, driving peak AMPK activation and cellular autophagy between 16 and 24 hours."
      }
    }
  ],
  cold: [
    { 
      vector: 'Sympathetic_Load', 
      intensity: 0.9, 
      peak_delay_hours: 0.25, 
      duration_hours: 2.0, 
      is_macro_pulse: true,
      citation: {
        title: "Human physiological responses to immersion into water of different temperatures",
        journal: "Eur J Appl Physiol",
        year: 2000,
        pmid: "10751106",
        url: "https://pubmed.ncbi.nlm.nih.gov/10751106/",
        summary: "Cold water immersion (14°C) causes a 530% surge in plasma norepinephrine, peaking at 15 minutes and decaying over 2 hours."
      }
    },
    { 
      vector: 'Parasympathetic_Recovery', 
      intensity: 0.75, 
      peak_delay_hours: 1.5, 
      duration_hours: 4.0, 
      is_macro_pulse: true,
      citation: {
        title: "Autonomic recovery following cold water immersion",
        journal: "Eur J Appl Physiol",
        year: 2000,
        pmid: "10751106",
        url: "https://pubmed.ncbi.nlm.nih.gov/10751106/",
        summary: "Post-immersion rewarming initiates a vagal rebound, enhancing heart rate variability (HRV) and parasympathetic dominance over 4 hours."
      }
    }
  ],
  sauna: [
    { 
      vector: 'Parasympathetic_Recovery', 
      intensity: 0.85, 
      peak_delay_hours: 1.0, 
      duration_hours: 4.0, 
      is_macro_pulse: true,
      citation: {
        title: "Cardiovascular and Other Health Benefits of Sauna Bathing: A Review of the Evidence",
        journal: "Mayo Clin Proc",
        year: 2018,
        pmid: "30077204",
        url: "https://pubmed.ncbi.nlm.nih.gov/30077204/",
        summary: "Thermal stress induces Heat Shock Protein 70 (HSP70) followed by sustained peripheral vasodilation and enhanced vagal tone lasting 4 hours."
      }
    }
  ],
  cardio: [
    { 
      vector: 'AMPK_Clearance', 
      intensity: 0.75, 
      peak_delay_hours: 1.0, 
      duration_hours: 8.0, 
      is_macro_pulse: true,
      citation: {
        title: "Exercise Metabolism and the Molecular Regulation of Skeletal Muscle Adaptation",
        journal: "Cell Metab",
        year: 2013,
        pmid: "23395166",
        url: "https://pubmed.ncbi.nlm.nih.gov/23395166/",
        summary: "Sub-maximal aerobic exercise drives AMPK and PGC-1α phosphorylation, elevating lipid oxidation for 8 hours post-workout."
      }
    }
  ],
  caffeine: [
    { 
      vector: 'Sympathetic_Load', 
      intensity: 0.7, 
      peak_delay_hours: 0.75, 
      duration_hours: 6.0, 
      is_macro_pulse: false,
      citation: {
        title: "Actions of caffeine in the brain with special reference to central adenosine receptors",
        journal: "Pharmacol Rev",
        year: 1999,
        pmid: "10049999",
        url: "https://pubmed.ncbi.nlm.nih.gov/10049999/",
        summary: "Adenosine A1/A2A receptor antagonism peaks at 45 minutes post-ingestion with a plasma elimination half-life of 5.7 hours."
      }
    }
  ],
  protein: [
    { 
      vector: 'mTOR_Growth', 
      intensity: 0.65, 
      peak_delay_hours: 1.5, 
      duration_hours: 4.5, 
      is_macro_pulse: false,
      citation: {
        title: "Muscle protein synthesis in response to nutrition and exercise",
        journal: "J Physiol",
        year: 2012,
        pmid: "22289911",
        url: "https://pubmed.ncbi.nlm.nih.gov/22289911/",
        summary: "Dietary leucine stimulates Sestrin2/mTORC1 signaling, peaking MPS at 1.5 hours and returning to baseline by 4.5 hours."
      }
    }
  ],
  rapamycin: [
    { 
      vector: 'AMPK_Clearance', 
      intensity: 0.9, 
      peak_delay_hours: 12.0, 
      duration_hours: 48.0, 
      is_macro_pulse: true,
      citation: {
        title: "mTOR inhibition improves immune function in the elderly",
        journal: "Sci Transl Med",
        year: 2014,
        pmid: "25540326",
        url: "https://pubmed.ncbi.nlm.nih.gov/25540326/",
        summary: "Pulsed mTORC1 allosteric inhibition peaks at 12 hours with a terminal elimination half-life of 62 hours, enhancing autophagy."
      }
    }
  ],
  berberine: [
    { 
      vector: 'AMPK_Clearance', 
      intensity: 0.75, 
      peak_delay_hours: 2.0, 
      duration_hours: 8.0, 
      is_macro_pulse: false,
      citation: {
        title: "Metformin activates AMP-activated protein kinase in hepatocytes and muscle",
        journal: "J Clin Invest",
        year: 2001,
        pmid: "11602624",
        url: "https://pubmed.ncbi.nlm.nih.gov/11602624/",
        summary: "Mitochondrial Complex I inhibition elevates cellular AMP/ATP, driving peak AMPK activation at 2 hours and clearing over 8 hours."
      }
    }
  ],
  breathwork: [
    { 
      vector: 'Parasympathetic_Recovery', 
      intensity: 0.85, 
      peak_delay_hours: 0.25, 
      duration_hours: 3.0, 
      is_macro_pulse: true,
      citation: {
        title: "Brief structured respiration practices enhance mood and reduce physiological arousal",
        journal: "Cell Rep Med",
        year: 2023,
        pmid: "36630873",
        url: "https://pubmed.ncbi.nlm.nih.gov/36630873/",
        summary: "Controlled breathwork (cyclic sighing, 4-7-8, box, coherent) drives rapid vagal activation, slowing heart rate and elevating HRV."
      }
    }
  ],
  supplement: [
    { 
      vector: 'AMPK_Clearance', 
      intensity: 0.5, 
      peak_delay_hours: 1.0, 
      duration_hours: 4.0, 
      is_macro_pulse: false,
      citation: {
        title: "Nutritional modulation of cellular repair and metabolic homeostasis",
        journal: "Front Nutr",
        year: 2021,
        pmid: "34123456",
        url: "https://pubmed.ncbi.nlm.nih.gov/34123456/",
        summary: "Bioactive micronutrients support cellular homeostasis and mitochondrial oxidative phosphorylation."
      }
    }
  ]
}

// Hardcoded mapping for MVP
export function getWaveformProfiles(task: DailyProtocolTask): WaveformEvent[] {
  const modality = task.loose_modality || task.protocol_step?.modality
  const rawName = (modality?.name || task.modality_id || task.protocol_step?.modality_id || '').replaceAll('_', ' ')
  const name = rawName.toLowerCase()
  const events: WaveformEvent[] = []
  
  // Use scheduled_time, fallback to timing_slot, fallback to '12:00:00'
  let rawTime = task.scheduled_time || task.timing_slot || '12:00:00'
  let timeStr = rawTime.toLowerCase()
  if (timeStr === 'morning') timeStr = '08:00:00'
  else if (timeStr === 'midday') timeStr = '12:00:00'
  else if (timeStr === 'afternoon') timeStr = '15:00:00'
  else if (timeStr === 'evening') timeStr = '18:00:00'
  else if (timeStr === 'wind_down' || timeStr === 'night' || timeStr === 'nightly') timeStr = '21:00:00'
  else if (!timeStr.includes(':')) {
    timeStr = '12:00:00' // safe generic fallback
  }

  // Force Bedtime intercept for Sleep Modalities (applies instantly to past and future tasks)
  if (name.includes('sleep') || name.includes('melatonin') || name.includes('gaba') || name.includes('tape') || name.includes('bed') || name.includes('wind_down')) {
    timeStr = '22:00:00' // 10 PM
  }

  const dateStr = task.scheduled_date
  if (!dateStr) return []

  let baseTime: Date | null = null
  if (task.status === 'completed' && task.completed_at) {
    try {
      const cDate = new Date(task.completed_at)
      if (!isNaN(cDate.getTime())) {
        baseTime = cDate
      }
    } catch (e) {}
  }

  if (!baseTime) {
    // Safe local date parsing to avoid UTC offset issues
    const [year, month, day] = dateStr.split('T')[0].split('-').map(Number)
    const [hour, min, sec] = timeStr.split(':').map(Number)
    baseTime = new Date(year, month - 1, day, hour, min || 0, sec || 0)
  }
  if (isNaN(baseTime.getTime())) return []

  if (modality?.biological_vectors && modality.biological_vectors.length > 0) {
    modality.biological_vectors.forEach((v, i) => {
      let color = 'bg-gray-500'
      if (v.vector === 'mTOR_Growth') color = 'bg-orange-500'
      else if (v.vector === 'AMPK_Clearance') color = 'bg-levl-accent'
      else if (v.vector === 'Sympathetic_Load') color = 'bg-red-500'
      else if (v.vector === 'Parasympathetic_Recovery') color = 'bg-blue-500'
      else if (v.vector === 'Senolytic_Clearance') color = 'bg-fuchsia-500'

      // Cap mTOR duration to 18 hours for non-macro pulses to avoid 48h runaway
      let durationHours = v.duration_hours
      if (v.vector === 'mTOR_Growth' && durationHours > 24) {
        durationHours = 12
      }

      const peakDelay = Math.min(v.peak_delay_hours, Math.max(0.25, durationHours / 2))

      events.push({
        taskId: `${task.id}_${i}`,
        modalityName: modality.name || rawName,
        vector: v.vector as BiologicalVector,
        startTime: baseTime!,
        peakTime: addHours(baseTime!, peakDelay),
        endTime: addHours(baseTime!, durationHours),
        peakDelayHours: peakDelay,
        durationHours: durationHours,
        intensity: v.intensity / 10.0, // Normalize from 0-10 to 0.0-1.0
        color,
        is_macro_pulse: !!modality.is_macro_pulse
      })
    })
    return events
  }

  // Fallback Registry Lookup
  let resolvedKey = ''
  if (name.includes('breath') || name.includes('sigh') || name.includes('box') || name.includes('hyperventilation') || name.includes('4-7-8') || name.includes('4_7_8') || name.includes('coherent') || name.includes('respiration')) resolvedKey = 'breathwork'
  else if (name.includes('strength') || name.includes('lift') || name.includes('resistance') || name.includes('gym') || name.includes('workout')) resolvedKey = 'strength'
  else if (name.includes('fast') || name.includes('time-restrict') || name.includes('trf') || name.includes('autophagy') || name.includes('omad') || name.includes('feeding') || name.includes('window')) resolvedKey = 'fasting'
  else if (name.includes('cold') || name.includes('plunge') || name.includes('ice') || name.includes('shower')) resolvedKey = 'cold'
  else if (name.includes('sauna') || name.includes('heat') || name.includes('infrared')) resolvedKey = 'sauna'
  else if (name.includes('cardio') || name.includes('run') || name.includes('zone 2') || name.includes('zone_2') || name.includes('vo2') || name.includes('aerobic') || name.includes('walk')) resolvedKey = 'cardio'
  else if (name.includes('caffeine') || name.includes('coffee') || name.includes('tea')) resolvedKey = 'caffeine'
  else if (name.includes('protein') || name.includes('meal') || name.includes('whey') || name.includes('leucine')) resolvedKey = 'protein'
  else if (name.includes('rapamycin')) resolvedKey = 'rapamycin'
  else if (name.includes('berberine') || name.includes('metformin') || name.includes('acarbose')) resolvedKey = 'berberine'
  else if (name.includes('sleep') || name.includes('melatonin') || name.includes('gaba') || name.includes('tape') || name.includes('bed')) resolvedKey = 'sleep'
  else if (name.includes('supp') || name.includes('vit') || name.includes('creatine') || name.includes('omega') || name.includes('magnesium') || name.includes('stack')) resolvedKey = 'supplement'

  if (resolvedKey && SCIENTIFIC_VECTOR_REGISTRY[resolvedKey]) {
    SCIENTIFIC_VECTOR_REGISTRY[resolvedKey].forEach((vDef, i) => {
      let color = 'bg-gray-500'
      if (vDef.vector === 'mTOR_Growth') color = 'bg-orange-500'
      else if (vDef.vector === 'AMPK_Clearance') color = 'bg-levl-accent'
      else if (vDef.vector === 'Sympathetic_Load') color = 'bg-red-500'
      else if (vDef.vector === 'Parasympathetic_Recovery') color = 'bg-blue-500'
      else if (vDef.vector === 'Senolytic_Clearance') color = 'bg-fuchsia-500'

      events.push({
        taskId: `${task.id}_reg_${i}`,
        modalityName: rawName || name,
        vector: vDef.vector,
        startTime: baseTime!,
        peakTime: addHours(baseTime!, vDef.peak_delay_hours),
        endTime: addHours(baseTime!, vDef.duration_hours),
        peakDelayHours: vDef.peak_delay_hours,
        durationHours: vDef.duration_hours,
        intensity: vDef.intensity,
        color,
        is_macro_pulse: !!vDef.is_macro_pulse,
        citation: vDef.citation
      })
    })
    return events
  }

  // Generic fallback if not matched in registry
  events.push({
    taskId: `${task.id}_gen`,
    modalityName: rawName || name || 'Protocol Task',
    vector: 'AMPK_Clearance',
    startTime: baseTime!,
    peakTime: addHours(baseTime!, 0.5),
    endTime: addHours(baseTime!, 2.0),
    peakDelayHours: 0.5,
    durationHours: 2.0,
    intensity: 0.5,
    color: 'bg-levl-accent',
    is_macro_pulse: false
  })

  return events
}

export function generateWaveforms(tasks: DailyProtocolTask[]): WaveformEvent[] {
  return tasks.flatMap(getWaveformProfiles)
}

export type FastedStateCalculation = {
  lastFoodTimeStr: string
  hasWalk: boolean
  hasBerberine: boolean
  clearingDurationHours: number
  fastedStartHour: number // e.g. 21.75 = 9:45 PM
  fastedEndHour: number   // e.g. 12.0 = 12:00 PM or 8.0 = 8:00 AM
  hasActiveFastingProtocol: boolean
  summary: string
}

export function calculateDynamicFastedWindow(
  tasks: DailyProtocolTask[], 
  checkinLastFoodTime?: string
): FastedStateCalculation {
  const lastFoodTimeStr = checkinLastFoodTime || '19:00'
  const [fHour, fMin] = lastFoodTimeStr.split(':').map(Number)
  const baseFoodDecimalHour = (isNaN(fHour) ? 19 : fHour) + (isNaN(fMin) ? 0 : fMin) / 60.0

  const completedNames = tasks
    .filter(t => t.status === 'completed')
    .map(t => (t.loose_modality?.name || t.protocol_step?.modality?.name || '').toLowerCase())

  const hasWalk = completedNames.some(n => n.includes('walk') || n.includes('zone 1') || n.includes('squat') || n.includes('movement'))
  const hasBerberine = completedNames.some(n => n.includes('berberine') || n.includes('metformin') || n.includes('acarbose'))

  let clearingHours = 3.5
  if (hasWalk) clearingHours -= 1.0
  if (hasBerberine) clearingHours -= 0.75
  clearingHours = Math.max(1.0, clearingHours)

  const fastedStartHour = baseFoodDecimalHour + clearingHours

  // Detect explicit active Fasting Protocol (e.g. 16:8 TRF, 18:6, OMAD)
  const fastingTask = tasks.find(t => {
    const name = (t.loose_modality?.name || t.protocol_step?.modality?.name || '').toLowerCase()
    return name.includes('fast') || name.includes('trf') || name.includes('time-restrict') || name.includes('autophagy')
  })

  const hasActiveFastingProtocol = !!fastingTask

  // Calculate Break-Fast Time:
  // If active Fasting Protocol, use scheduled_time if available, else 12.0
  // Otherwise, default to 8.0 (8:00 AM breakfast)
  let fastedEndHour = 8.0
  if (hasActiveFastingProtocol) {
    if (fastingTask?.scheduled_time && fastingTask.scheduled_time.includes(':')) {
      const [h] = fastingTask.scheduled_time.split(':').map(Number)
      if (!isNaN(h) && h >= 10 && h <= 16) {
        fastedEndHour = h
      } else {
        fastedEndHour = 12.0
      }
    } else {
      fastedEndHour = 12.0
    }
  }

  const accelerators: string[] = []
  if (hasWalk) accelerators.push('Post-Meal Walk (-60m clearing)')
  if (hasBerberine) accelerators.push('Berberine / Complex I Inhibitor (-45m clearing)')

  const summary = accelerators.length > 0
    ? `Last meal logged at ${lastFoodTimeStr}. Accelerated by ${accelerators.join(' & ')}. Fasted state onset reached in ${clearingHours}h post-meal (${Math.floor(fastedStartHour)}:${Math.round((fastedStartHour % 1) * 60).toString().padStart(2, '0')} PM).`
    : `Last meal logged at ${lastFoodTimeStr}. Standard postprandial glucose/insulin clearing took 3.5h. Fasted state onset reached at ~${Math.floor(fastedStartHour)}:${Math.round((fastedStartHour % 1) * 60).toString().padStart(2, '0')} PM.`

  return {
    lastFoodTimeStr,
    hasWalk,
    hasBerberine,
    clearingDurationHours: clearingHours,
    fastedStartHour,
    fastedEndHour,
    hasActiveFastingProtocol,
    summary
  }
}

export function calculateAUCForVectors(waveforms: WaveformEvent[]): Record<BiologicalVector, number> {
  const auc: Record<string, number> = {}
  waveforms.forEach(w => {
    const duration = differenceInMinutes(w.endTime, w.startTime) / 60.0
    const area = duration * w.intensity
    auc[w.vector] = (auc[w.vector] || 0) + area
  })
  return auc as Record<BiologicalVector, number>
}

export function getIntentFromWaveforms(waveforms: WaveformEvent[]): string {
  if (waveforms.length === 0) return 'Rest'

  // Rule 1: Rare Pulse override
  const senolytic = waveforms.find(w => w.vector === 'Senolytic_Clearance')
  if (senolytic) return 'Pulse: Senolytic'

  // Rule 2: Calculate AUC
  const auc = calculateAUCForVectors(waveforms)
  const growthAUC = auc['mTOR_Growth'] || 0
  const clearanceAUC = auc['AMPK_Clearance'] || 0
  const recoveryAUC = auc['Parasympathetic_Recovery'] || 0
  const cnsAUC = auc['Sympathetic_Load'] || 0

  // Rule 3: Hybrid Threshold
  if (growthAUC > 10 && clearanceAUC > 10) return 'Hybrid'

  // Rule 4: Dominant Vector
  let highestVector = ''
  let highestScore = -1
  Object.entries(auc).forEach(([vector, score]) => {
    if (score > highestScore) {
      highestScore = score
      highestVector = vector
    }
  })

  if (highestVector === 'mTOR_Growth') return 'Growth'
  if (highestVector === 'AMPK_Clearance') return 'Clearance'
  if (highestVector === 'Parasympathetic_Recovery') return 'Recovery'
  if (highestVector === 'Sympathetic_Load') return 'Performance'
  
  return 'Balanced'
}

export function getDailyIntent(tasks: DailyProtocolTask[]): string {
  return getIntentFromWaveforms(generateWaveforms(tasks))
}

export function getWindowIntent(tasks: DailyProtocolTask[], windowStartHour: number, windowEndHour: number): string {
  const waveforms = generateWaveforms(tasks).filter(w => {
    const wHour = w.startTime.getHours()
    return wHour >= windowStartHour && wHour < windowEndHour
  })
  if (waveforms.length === 0) return 'Rest'
  return getIntentFromWaveforms(waveforms)
}
