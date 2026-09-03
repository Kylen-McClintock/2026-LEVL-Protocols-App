import { DailyProtocolTask, UserProfile } from '@/lib/types'
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

export interface CriticalModalitySpec {
  id: string
  name: string
  mode: 'growth' | 'recovery'
  category: string
  exactDose: string
  temperature?: string
  durationAndFrequency: string
  administrationNotes: string
  biologicalMechanism: string
  pmid: string
  pubMedUrl: string
  citationText: string
  matcherKeywords: string[]
}

export interface CriticalModalityEvaluation extends CriticalModalitySpec {
  isScheduledToday: boolean
  matchedTaskId?: string
  matchedTaskName?: string
  matchedTiming?: string
}

export interface DayTimelinePhase {
  id: string
  name: string
  mode: 'growth' | 'recovery' | 'transition' | 'sleep'
  startHour: number
  endHour: number
  startTimeFormatted: string
  endTimeFormatted: string
  title: string
  description: string
  bgGradient: string
  borderGlow: string
  textAccent: string
}

export interface TimelineTransitionMarker {
  id: string
  type: 'growth_onset' | 'recovery_onset' | 'post_strain_window' | 'morning_activation' | 'sleep_onset'
  hour: number
  timeFormatted: string
  title: string
  badgeText: string
  badgeColor: string
  triggerText: string
  biologicalMechanism: string
  keyActions: string[]
  criticalModalitiesToConsider: string[]
}

export interface ChronoGuardrailStatus {
  id: string
  title: string
  rule: string
  status: 'passed' | 'warning' | 'info'
  statusLabel: string
  description: string
  recommendation: string
  citation: string
  pubMedUrl: string
}

export interface DayPhasesAndTransitions {
  growthStartHour: number
  growthStartTimeFormatted: string
  growthTriggerText: string
  recoveryStartHour: number
  recoveryStartTimeFormatted: string
  recoveryTriggerText: string
  hasResistanceTrainingToday: boolean
  phases: DayTimelinePhase[]
  transitions: TimelineTransitionMarker[]
  criticalModalities: {
    growth: CriticalModalityEvaluation[]
    recovery: CriticalModalityEvaluation[]
    growthCoveragePercentage: number
    recoveryCoveragePercentage: number
  }
  guardrails: ChronoGuardrailStatus[]
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
 * 100% Scientific Gold-Standard Critical Optimization Modalities Registry
 * Compliant with LEVL Modality & Protocol Dosing Standards:
 * - Specific Modality Specs
 * - Temperature & Exact Dosing
 * - Duration & Frequency
 * - Administration & Synergy Notes
 * - Verified PubMed links & PMIDs
 */
export const CRITICAL_OPTIMIZATION_MODALITIES: Record<'growth' | 'recovery', CriticalModalitySpec[]> = {
  growth: [
    {
      id: 'resistance_training',
      name: 'Progressive Resistance Training (Mechanical Tension)',
      mode: 'growth',
      category: 'Fitness & Hypertrophy',
      exactDose: '3–5 compound sets @ RPE 8–9 (1–2 reps in reserve)',
      durationAndFrequency: '45–60 mins per session, 3–4x weekly',
      administrationNotes: 'Emphasize deep eccentric stretch under load; progressive overload; consume 30–40g protein within 90m post-exercise',
      biologicalMechanism: 'Mechanical tension activates focal adhesion mechanosensors, triggering mTORC1 and p70S6K ribosomal biogenesis and muscle protein synthesis',
      pmid: '27213469',
      pubMedUrl: 'https://pubmed.ncbi.nlm.nih.gov/27213469/',
      citationText: 'Morton et al., J Appl Physiol (2016)',
      matcherKeywords: ['resistance', 'lift', 'strength', 'hypertrophy', 'dumbbell', 'barbell', 'squat', 'deadlift', 'press', 'pull']
    },
    {
      id: 'leucine_protein',
      name: 'Leucine-Rich Protein / Essential Amino Acids',
      mode: 'growth',
      category: 'Nutrition & Anabolism',
      exactDose: '30–40g Whey Isolate or 10–15g EAAs (min 2.7g Leucine)',
      durationAndFrequency: '3–4 pulses spaced 3–4 hours apart during diurnal eating window',
      administrationNotes: 'Hits the leucine threshold to maximize Muscle Protein Synthesis (MPS) refractory window; space evenly across active day',
      biologicalMechanism: 'Intracellular leucine binds Sestrin2, stimulating Rag GTPase-mediated mTORC1 recruitment to the lysosome and activating protein translation',
      pmid: '26797090',
      pubMedUrl: 'https://pubmed.ncbi.nlm.nih.gov/26797090/',
      citationText: 'Phillips et al., Clin Nutr (2016)',
      matcherKeywords: ['protein', 'whey', 'leucine', 'eaa', 'bcaa', 'amino', 'shake']
    },
    {
      id: 'creatine_monohydrate',
      name: 'Creatine Monohydrate',
      mode: 'growth',
      category: 'Ergogenic & Cellular Energy',
      exactDose: '5,000mg (5g) Creapure / micronized powder',
      durationAndFrequency: 'Daily continuous administration (anytime, optimally post-workout)',
      administrationNotes: 'Take with 12–16oz water and optional carbohydrate to maximize sodium-dependent transporter (SLC6A8) uptake',
      biologicalMechanism: 'Increases intramuscular phosphocreatine (PCr) stores, accelerates satellite cell mitotic division, and enhances cellular hydration',
      pmid: '28615996',
      pubMedUrl: 'https://pubmed.ncbi.nlm.nih.gov/28615996/',
      citationText: 'Kreider et al., J Int Soc Sports Nutr (2017)',
      matcherKeywords: ['creatine', 'monohydrate']
    },
    {
      id: 'photobiomodulation_growth',
      name: 'Photobiomodulation / Near-Infrared Light (Red Light)',
      mode: 'growth',
      category: 'Mitochondrial Bioenergetics',
      exactDose: '660nm (Red) + 850nm (NIR) @ 50–100 mW/cm²',
      durationAndFrequency: '10–15 mins per exposure, 3–5x weekly',
      administrationNotes: 'Administer 15–30m pre-exercise or post-exercise directly over large working muscle groups; maintain 6–12 inches distance',
      biologicalMechanism: 'Photons absorbed by Cytochrome c Oxidase in complex IV, augmenting mitochondrial ATP synthesis and reducing delayed onset muscle soreness (DOMS)',
      pmid: '27874264',
      pubMedUrl: 'https://pubmed.ncbi.nlm.nih.gov/27874264/',
      citationText: 'Ferraresi et al., Photomed Laser Surg (2016)',
      matcherKeywords: ['red light', 'photobiomodulation', 'near-infrared', 'nir', 'joovv', 'light therapy']
    }
  ],
  recovery: [
    {
      id: 'time_restricted_fasting',
      name: 'Time-Restricted Fasting (14:10 / 16:8 Autophagy Window)',
      mode: 'recovery',
      category: 'Metabolic Longevity',
      exactDose: '14–16 hours continuous caloric abstention (water, black coffee, electrolytes only)',
      durationAndFrequency: 'Daily or 5–6 days weekly; finish dinner $\\ge$3h before sleep',
      administrationNotes: 'Preserve evening digestive clearing; break fast with whole protein and healthy fats rather than high glycemic refined carbs',
      biologicalMechanism: 'Hepatic glycogen depletion suppresses circulating insulin, stimulating AMPK phosphorylation and activating macroautophagy (ULK1/Beclin-1)',
      pmid: '31881139',
      pubMedUrl: 'https://pubmed.ncbi.nlm.nih.gov/31881139/',
      citationText: 'de Cabo & Mattson, N Engl J Med (2019)',
      matcherKeywords: ['fast', 'trf', 'time-restricted', 'intermittent fasting', 'autophagy']
    },
    {
      id: 'cold_plunge',
      name: 'Cold Water Immersion / Cold Plunge',
      mode: 'recovery',
      category: 'Neuroendocrine & Vagal',
      temperature: '50°F–55°F (10°C–13°C)',
      exactDose: 'Submersion to clavicle; hands/feet submerged',
      durationAndFrequency: '2–3 mins per session, 11 mins total weekly',
      administrationNotes: 'Søberg Principle: end on cold, warm up naturally; CRITICAL: NEVER plunge within 4 hours after resistance training to preserve mTOR hypertrophy',
      biologicalMechanism: 'Triggers a 530% surge in plasma norepinephrine, brown adipose tissue (BAT) mitochondrial uncoupling (UCP1), and post-exit vagal rebound',
      pmid: '34685327',
      pubMedUrl: 'https://pubmed.ncbi.nlm.nih.gov/34685327/',
      citationText: 'Søberg et al., Cell Rep Med (2021)',
      matcherKeywords: ['cold', 'plunge', 'ice bath', 'cwi', 'cold water']
    },
    {
      id: 'sauna_heat_shock',
      name: 'Traditional / Infrared Sauna Bathing',
      mode: 'recovery',
      category: 'Thermal Conditioning',
      temperature: '174°F–194°F (80°C–90°C)',
      exactDose: '20 mins continuous thermal exposure',
      durationAndFrequency: '4–7 sessions weekly (proven clinical dose for cardiovascular longevity)',
      administrationNotes: 'Hydrate with 16oz water + electrolytes pre/post; follow with cooling shower; complete $\\ge$2h before sleep to allow core temp cooling',
      biologicalMechanism: 'Thermal hyperthermia induces Heat Shock Protein 70 (HSP70) chaperone activity, increases endothelial nitric oxide, and reduces all-cause cardiovascular mortality',
      pmid: '30077204',
      pubMedUrl: 'https://pubmed.ncbi.nlm.nih.gov/30077204/',
      citationText: 'Laukkanen et al., Mayo Clin Proc (2018)',
      matcherKeywords: ['sauna', 'infrared sauna', 'heat shock', 'thermal']
    },
    {
      id: 'vagal_breathwork',
      name: 'Cyclic Sighing / Vagal Down-Regulation Breathwork',
      mode: 'recovery',
      category: 'Autonomic Regulation',
      exactDose: 'Double nasal inhale (deep + top-off) followed by long, unforced mouth exhale',
      durationAndFrequency: '5 mins daily or acute post-stress rescue',
      administrationNotes: 'Perform seated or lying down; focus on slowing heart rate during the prolonged exhalation; optimal prior to bed or after high stress',
      biologicalMechanism: 'Engages pulmonary stretch receptors and activates the vagus nerve (cranial nerve X), directly suppressing sympathetic tone and increasing respiratory sinus arrhythmia (RSA)',
      pmid: '36630953',
      pubMedUrl: 'https://pubmed.ncbi.nlm.nih.gov/36630953/',
      citationText: 'Balban & Huberman, Cell Rep Med (2023)',
      matcherKeywords: ['breath', 'cyclic sigh', 'sighing', 'nsdr', 'nidra', 'box breath', '4-7-8', 'meditat']
    },
    {
      id: 'magnesium_sleep_stack',
      name: 'Nocturnal Magnesium Stack (L-Threonate or Glycinate)',
      mode: 'recovery',
      category: 'Neurochemical Sleep Architecture',
      exactDose: '145mg elemental Magnesium L-Threonate or 200mg Magnesium Bisglycinate',
      durationAndFrequency: 'Nightly, 30–60 mins prior to lights out',
      administrationNotes: 'Synergizes with 100–200mg L-Theanine and 50mg Apigenin; avoid combining with high-calcium meals; take with 4oz water',
      biologicalMechanism: 'Crosses blood-brain barrier, acts as an allosteric modulator of GABA-A receptors, antagonizes NMDA receptors, and deepens Stage 3 Slow-Wave Delta sleep',
      pmid: '24015971',
      pubMedUrl: 'https://pubmed.ncbi.nlm.nih.gov/24015971/',
      citationText: 'Slutsky et al., Physiol Behav (2013)',
      matcherKeywords: ['magnesium', 'threonate', 'glycinate', 'bisglycinate', 'theanine', 'apigenin', 'sleep stack', 'sleep formula']
    }
  ]
}

/**
 * Formats a decimal hour (e.g. 10.5) to a clean 12-hour string (e.g. "10:30 AM")
 */
export function formatHourToTimeStr(decimalHour: number): string {
  const normalized = (decimalHour % 24 + 24) % 24
  const hour = Math.floor(normalized)
  const minutes = Math.round((normalized % 1) * 60)
  const isPM = hour >= 12
  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  const displayMinutes = minutes.toString().padStart(2, '0')
  const period = isPM ? 'PM' : 'AM'
  return `${displayHour}:${displayMinutes} ${period}`
}

/**
 * Resolves a task's rough decimal hour based on scheduled_time or timing_slot
 */
export function getTaskDecimalHour(task: DailyProtocolTask): number {
  if (task.scheduled_time && task.scheduled_time.includes(':')) {
    const parts = task.scheduled_time.split(':').map(Number)
    if (!isNaN(parts[0]) && !isNaN(parts[1])) {
      return parts[0] + parts[1] / 60
    }
  }
  const slot = (task.timing_slot || '').toLowerCase()
  if (slot.includes('waking') || slot.includes('early')) return 6.5
  if (slot.includes('morning_routine')) return 8.0
  if (slot.includes('morning_supplement') || slot.includes('morning')) return 8.5
  if (slot.includes('midday') || slot.includes('noon') || slot.includes('lunch')) return 12.0
  if (slot.includes('afternoon') || slot.includes('post_workout')) return 14.5
  if (slot.includes('evening') || slot.includes('dinner')) return 18.5
  if (slot.includes('pre_bed') || slot.includes('bed') || slot.includes('night')) return 21.5
  return 10.0
}

/**
 * Calculates when Growth Mode begins, when Recovery Mode begins,
 * the chronological transitions between them, and evaluates critical modalities for both.
 */
export function calculateDayPhasesAndTransitions(
  tasks: DailyProtocolTask[],
  userProfile?: UserProfile | null,
  dateStr?: string
): DayPhasesAndTransitions {
  const dayTasks = dateStr ? tasks.filter(t => t.scheduled_date === dateStr) : tasks

  // 1. Determine user wake time & bedtime defaults
  let wakeHour = 6.5 // 6:30 AM
  let bedHour = 23.0 // 11:00 PM

  if (userProfile?.ideal_wake_time && userProfile.ideal_wake_time.includes(':')) {
    const [h, m] = userProfile.ideal_wake_time.split(':').map(Number)
    if (!isNaN(h)) wakeHour = h + (isNaN(m) ? 0 : m / 60)
  }

  if (userProfile?.ideal_bedtime && userProfile.ideal_bedtime.includes(':')) {
    const [h, m] = userProfile.ideal_bedtime.split(':').map(Number)
    if (!isNaN(h)) bedHour = h + (isNaN(m) ? 0 : m / 60)
  }

  // 2. Identify Growth & Recovery tasks
  const growthTasks: { task: DailyProtocolTask; hour: number; name: string }[] = []
  const recoveryTasks: { task: DailyProtocolTask; hour: number; name: string }[] = []

  let resistanceTask: { task: DailyProtocolTask; hour: number; name: string } | null = null
  let coldTask: { task: DailyProtocolTask; hour: number; name: string } | null = null
  let caffeineTask: { task: DailyProtocolTask; hour: number; name: string } | null = null

  dayTasks.forEach(t => {
    const name = getModalityName(t)
    const lower = name.toLowerCase()
    const vectorClass = classifyModalityVector(t)
    const hour = getTaskDecimalHour(t)

    if (vectorClass.type === 'growth') {
      growthTasks.push({ task: t, hour, name })
      if (lower.includes('resistance') || lower.includes('lift') || lower.includes('strength') || lower.includes('hypertrophy')) {
        if (!resistanceTask || hour < resistanceTask.hour) {
          resistanceTask = { task: t, hour, name }
        }
      }
    } else if (vectorClass.type === 'recovery') {
      recoveryTasks.push({ task: t, hour, name })
      if (lower.includes('cold') || lower.includes('plunge') || lower.includes('ice')) {
        if (!coldTask) coldTask = { task: t, hour, name }
      }
    }

    if (lower.includes('coffee') || lower.includes('caffeine') || lower.includes('pre-workout')) {
      if (!caffeineTask) caffeineTask = { task: t, hour, name }
    }
  })

  // Sort growth tasks by hour
  growthTasks.sort((a, b) => a.hour - b.hour)

  // 3. Calculate exact hour when Growth Mode begins
  // Default is 11:00 AM (TRF eating onset) or user's eating_window_start
  let growthStartHour = 11.0
  let growthTriggerText = '16:8 TRF Diurnal Feeding Onset & Baseline Anabolic Window'

  if (userProfile?.eating_window_start && userProfile.eating_window_start.includes(':')) {
    const [h, m] = userProfile.eating_window_start.split(':').map(Number)
    if (!isNaN(h)) {
      growthStartHour = h + (isNaN(m) ? 0 : m / 60)
      growthTriggerText = `Personalized Eating Window Start (${formatHourToTimeStr(growthStartHour)})`
    }
  }

  // If there is an earlier scheduled growth modality (e.g. morning lifting or early breakfast stack)
  if (growthTasks.length > 0 && growthTasks[0].hour < growthStartHour) {
    growthStartHour = growthTasks[0].hour
    growthTriggerText = `${growthTasks[0].name} (${formatHourToTimeStr(growthStartHour)})`
  } else if (resistanceTask && (resistanceTask as any).hour <= growthStartHour) {
    growthStartHour = (resistanceTask as any).hour
    growthTriggerText = `${(resistanceTask as any).name} (${formatHourToTimeStr(growthStartHour)})`
  }

  // 4. Calculate exact hour when Recovery Mode begins
  // Default is 19.5 (7:30 PM, 3.5 hours before bed)
  let recoveryStartHour = Math.max(growthStartHour + 4.0, bedHour - 3.5)
  let recoveryTriggerText = 'Evening Caloric Cutoff & Digestive Clearance Window'

  if (userProfile?.eating_window_end && userProfile.eating_window_end.includes(':')) {
    const [h, m] = userProfile.eating_window_end.split(':').map(Number)
    if (!isNaN(h)) {
      recoveryStartHour = Math.max(growthStartHour + 3.0, h + (isNaN(m) ? 0 : m / 60) + 0.5)
      recoveryTriggerText = `Caloric Intake Window Closed at ${formatHourToTimeStr(h + (isNaN(m) ? 0 : m / 60))}`
    }
  }

  // Clamp recovery start hour nicely
  if (recoveryStartHour < growthStartHour + 2.0) {
    recoveryStartHour = growthStartHour + 4.0
  }
  if (recoveryStartHour > bedHour - 1.5) {
    recoveryStartHour = bedHour - 2.0
  }

  // 5. Build Day Timeline Phases
  const phases: DayTimelinePhase[] = [
    {
      id: 'morning_clearance',
      name: 'Morning Clearance & Fasted Zone',
      mode: 'transition',
      startHour: wakeHour,
      endHour: growthStartHour,
      startTimeFormatted: formatHourToTimeStr(wakeHour),
      endTimeFormatted: formatHourToTimeStr(growthStartHour),
      title: '🌅 Morning Clearance & Fasted Transition',
      description: 'Glycogen-depleted fasted state. AMPK active, elevated morning cortisol awakening response (CAR), baseline macroautophagy.',
      bgGradient: 'from-amber-950/20 via-slate-900/60 to-slate-900/80',
      borderGlow: 'border-amber-500/20',
      textAccent: 'text-amber-400'
    },
    {
      id: 'growth_mode',
      name: 'Diurnal Growth Mode (mTORC1 Anabolism)',
      mode: 'growth',
      startHour: growthStartHour,
      endHour: recoveryStartHour,
      startTimeFormatted: formatHourToTimeStr(growthStartHour),
      endTimeFormatted: formatHourToTimeStr(recoveryStartHour),
      title: '🟣 Diurnal Growth Mode (mTORC1 Axis)',
      description: 'Peak muscular torque, amino acid sensing, mechanical tension, protein synthesis, and cellular remodeling.',
      bgGradient: 'from-purple-950/25 via-indigo-950/20 to-purple-950/30',
      borderGlow: 'border-purple-500/30',
      textAccent: 'text-purple-400'
    },
    {
      id: 'evening_recovery',
      name: 'Evening Vagal & Autophagy Transition',
      mode: 'recovery',
      startHour: recoveryStartHour,
      endHour: bedHour,
      startTimeFormatted: formatHourToTimeStr(recoveryStartHour),
      endTimeFormatted: formatHourToTimeStr(bedHour),
      title: '🟢 Evening Recovery & Vagal Transition',
      description: 'Caloric cutoff, postprandial glucose clearance, Heat Shock Protein induction, and parasympathetic sleep preparation.',
      bgGradient: 'from-emerald-950/25 via-teal-950/20 to-slate-900/80',
      borderGlow: 'border-emerald-500/30',
      textAccent: 'text-emerald-400'
    },
    {
      id: 'nocturnal_sleep',
      name: 'Nocturnal Somatic Recovery & Deep Sleep',
      mode: 'sleep',
      startHour: bedHour,
      endHour: wakeHour + 24,
      startTimeFormatted: formatHourToTimeStr(bedHour),
      endTimeFormatted: formatHourToTimeStr(wakeHour),
      title: '🌙 Nocturnal Somatic Recovery & Delta Sleep',
      description: 'Stage 3 Slow-Wave Sleep, pulsatile Growth Hormone (GH) release, deep cellular autophagy, and cerebral glymphatic waste clearance.',
      bgGradient: 'from-slate-950 via-indigo-950/30 to-slate-950',
      borderGlow: 'border-indigo-500/20',
      textAccent: 'text-indigo-400'
    }
  ]

  // 6. Build Ordered Timeline Transition Markers
  const transitions: TimelineTransitionMarker[] = [
    {
      id: 'trans_morning',
      type: 'morning_activation',
      hour: wakeHour,
      timeFormatted: formatHourToTimeStr(wakeHour),
      title: 'Morning Awakening & Fasted Activation',
      badgeText: '🌅 Fasted AMPK Active',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      triggerText: 'Circadian Awakening & Cortisol Awakening Response (CAR)',
      biologicalMechanism: 'Awakening in a glycogen-depleted state sustains cellular autophagy and AMPK signaling until first diurnal mechanical strain or caloric intake.',
      keyActions: [
        'Hydrate with 500ml water + pinch of pink salt/electrolytes',
        'Expose eyes to 10k+ lux natural sunlight (10–15 mins)',
        'Delay caffeine 90–120 mins to allow adenosine clearance without crash'
      ],
      criticalModalitiesToConsider: ['Hydration & Electrolytes', 'Morning Sunlight Exposure', 'Zone 2 Movement / Cold Plunge']
    },
    {
      id: 'trans_growth_onset',
      type: 'growth_onset',
      hour: growthStartHour,
      timeFormatted: formatHourToTimeStr(growthStartHour),
      title: '⚡ Growth Mode Begins (mTORC1 Anabolism Switch)',
      badgeText: '🟣 Growth Mode Onset',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.3)]',
      triggerText: growthTriggerText,
      biologicalMechanism: 'Nutrient sensing (leucine/essential amino acids) and mechanical loading trigger mTORC1 and p70S6K phosphorylation, shifting cells out of autophagic clearance into muscle protein synthesis and osteogenic remodeling.',
      keyActions: [
        'Initiate 30–40g high-quality protein pulse (min 2.7g leucine)',
        'Progressive resistance training with mechanical tension @ RPE 8–9',
        'Hydrate with 5,000mg Creatine Monohydrate for PCr resynthesis'
      ],
      criticalModalitiesToConsider: ['Progressive Resistance Training', 'Leucine-Rich Protein / EAAs', 'Creatine Monohydrate', 'Photobiomodulation']
    }
  ]

  // If resistance training is scheduled today, insert post-strain anabolic window transition
  if (resistanceTask) {
    const postLiftHour = (resistanceTask as any).hour + 1.0
    transitions.push({
      id: 'trans_post_lift',
      type: 'post_strain_window',
      hour: postLiftHour,
      timeFormatted: formatHourToTimeStr(postLiftHour),
      title: '⚡ Post-Strain Hypertrophic Anabolic Window',
      badgeText: '🟣 Peak MPS Window (3–4h)',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      triggerText: `${(resistanceTask as any).name} Completed`,
      biologicalMechanism: 'Muscle Protein Synthesis (MPS) rates peak at 3 hours post-mechanical strain and remain elevated for 12 hours. Cold water immersion within 4 hours is contraindicated due to blunting of ribosomal biogenesis.',
      keyActions: [
        'Supply 30–40g essential amino acids to support myofibrillar synthesis',
        'Replenish intramuscular glycogen stores',
        'AVOID cold water immersion / cryotherapy for $\\ge$4 hours post-lift'
      ],
      criticalModalitiesToConsider: ['Post-Workout Protein & Carbs', 'Creatine Saturation', 'Separation from Cryotherapy']
    })
  }

  // Add Recovery Mode Begins transition
  transitions.push({
    id: 'trans_recovery_onset',
    type: 'recovery_onset',
    hour: recoveryStartHour,
    timeFormatted: formatHourToTimeStr(recoveryStartHour),
    title: '🌙 Recovery Mode Begins (Autophagy & Vagal Switch)',
    badgeText: '🟢 Recovery Mode Onset',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.3)]',
    triggerText: recoveryTriggerText,
    biologicalMechanism: 'Caloric and mechanical strain cease. Postprandial insulin drops, activating hepatic AMPK, Heat Shock Proteins (HSP70), and central vagal parasympathetic down-regulation to prepare for restorative delta sleep.',
    keyActions: [
      'Cease all caloric intake $\\ge$3h before sleep to avoid insulin-mediated GH suppression',
      'Begin thermal dissipation / heat shock sauna therapy',
      'Engage vagal down-regulation (cyclic sighing / NSDR)'
    ],
    criticalModalitiesToConsider: ['Time-Restricted Fasting (14:10 / 16:8)', 'Sauna Heat Shock Therapy', 'Cyclic Sighing / Vagal Breathwork', 'Magnesium Sleep Stack']
  })

  // Add Bedtime Sleep transition
  transitions.push({
    id: 'trans_sleep',
    type: 'sleep_onset',
    hour: bedHour,
    timeFormatted: formatHourToTimeStr(bedHour),
    title: '🌙 Nocturnal Somatic Recovery & Deep Delta Sleep',
    badgeText: '🟢 Somatic Repair & GH Pulse',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    triggerText: 'Circadian Melatonin Peak & Core Body Temperature Nadir',
    biologicalMechanism: 'Stage 3 Slow-Wave Sleep (SWS) drives pulsatile Growth Hormone (GH) release for structural tissue repair, macroautophagy, and glymphatic clearance of cerebral metabolic waste (amyloid-beta).',
    keyActions: [
      'Cool bedroom temperature to 65°F–68°F (18°C–20°C)',
      'Circadian darkness: zero blue photons / eye mask',
      'Nocturnal Magnesium L-Threonate + Apigenin Stack'
    ],
    criticalModalitiesToConsider: ['Nocturnal Magnesium Stack', 'Circadian Darkness', 'Glymphatic Brain Clearance']
  })

  // Sort transitions chronologically
  transitions.sort((a, b) => a.hour - b.hour)

  // 7. Evaluate Critical Modalities for Today's Stack
  const evaluateSpecs = (specs: CriticalModalitySpec[]): CriticalModalityEvaluation[] => {
    return specs.map(spec => {
      // Look for a task matching any keyword
      const matched = dayTasks.find(t => {
        const name = getModalityName(t).toLowerCase()
        const cat = (t.protocol_step?.modality?.category || t.loose_modality?.category || '').toLowerCase()
        return spec.matcherKeywords.some(kw => name.includes(kw) || cat.includes(kw))
      })

      return {
        ...spec,
        isScheduledToday: !!matched,
        matchedTaskId: matched?.id,
        matchedTaskName: matched ? getModalityName(matched) : undefined,
        matchedTiming: matched ? (matched.timing_slot?.replace(/_/g, ' ') || matched.scheduled_time || 'Scheduled') : undefined
      }
    })
  }

  const growthEvaluated = evaluateSpecs(CRITICAL_OPTIMIZATION_MODALITIES.growth)
  const recoveryEvaluated = evaluateSpecs(CRITICAL_OPTIMIZATION_MODALITIES.recovery)

  const growthCoveragePercentage = Math.round(
    (growthEvaluated.filter(e => e.isScheduledToday).length / growthEvaluated.length) * 100
  )
  const recoveryCoveragePercentage = Math.round(
    (recoveryEvaluated.filter(e => e.isScheduledToday).length / recoveryEvaluated.length) * 100
  )

  // 8. Evaluate Chrono-Spacing Guardrails
  const guardrails: ChronoGuardrailStatus[] = []

  // Guardrail 1: Cold Plunge vs. Lifting Spacing (Roberts et al. / PMID 26174983)
  if (resistanceTask && coldTask) {
    const resH = (resistanceTask as any).hour
    const coldH = (coldTask as any).hour
    const diff = coldH - resH

    if (diff > 0 && diff < 4.0) {
      guardrails.push({
        id: 'cold_lift_interference',
        title: 'Cold Plunge vs. Resistance Training Spacing',
        rule: 'Cold plunge must be spaced $\\ge$4 hours after resistance training',
        status: 'warning',
        statusLabel: `Interference Alert (${Math.round(diff * 10) / 10}h separation)`,
        description: `Cold water immersion scheduled only ${Math.round(diff * 10) / 10}h after lifting blunts p70S6K phosphorylation, reducing muscle hypertrophy gains by up to 50%.`,
        recommendation: 'Advance cold plunge to morning before lifting (7:00 AM) or move to dedicated rest day.',
        citation: 'Roberts et al., J Physiol (2015) / PMID: 26174983',
        pubMedUrl: 'https://pubmed.ncbi.nlm.nih.gov/26174983/'
      })
    } else {
      guardrails.push({
        id: 'cold_lift_separated',
        title: 'Cold Plunge vs. Resistance Training Spacing',
        rule: 'Cold plunge must be spaced $\\ge$4 hours after resistance training',
        status: 'passed',
        statusLabel: 'Cleanly Partitioned ($\ge$4h Separation)',
        description: 'Cold plunge is separated by $\\ge$4 hours or scheduled prior to resistance training, completely preserving mTORC1 mechanotransduction.',
        recommendation: 'Maintain this separation for uninhibited muscle protein synthesis.',
        citation: 'Roberts et al., J Physiol (2015) / PMID: 26174983',
        pubMedUrl: 'https://pubmed.ncbi.nlm.nih.gov/26174983/'
      })
    }
  } else {
    guardrails.push({
      id: 'cold_lift_none',
      title: 'Cold Plunge vs. Resistance Training Spacing',
      rule: 'Cold plunge must be spaced $\\ge$4 hours after resistance training',
      status: 'info',
      statusLabel: 'No Clash Detected',
      description: 'Lifting and cold plunge are not in competition on today\'s schedule.',
      recommendation: 'If adding cold plunge on lifting days, maintain a 4+ hour post-lift window.',
      citation: 'Roberts et al., J Physiol (2015) / PMID: 26174983',
      pubMedUrl: 'https://pubmed.ncbi.nlm.nih.gov/26174983/'
    })
  }

  // Guardrail 2: Evening Caloric Cutoff ($\ge$3h before sleep)
  const digestDiff = bedHour - recoveryStartHour
  if (digestDiff >= 3.0) {
    guardrails.push({
      id: 'caloric_cutoff_protected',
      title: 'Evening Caloric Cutoff & Nocturnal Autophagy',
      rule: 'Cease caloric intake $\\ge$3 hours prior to sleep',
      status: 'passed',
      statusLabel: `${Math.round(digestDiff * 10) / 10}h Fasting Buffer Protected`,
      description: `Last caloric intake closes at ${formatHourToTimeStr(recoveryStartHour)}, allowing 3+ hours for insulin and glucose clearance prior to sleep.`,
      recommendation: 'Protects natural nocturnal Growth Hormone (GH) release and slow-wave sleep depth.',
      citation: 'de Cabo & Mattson, N Engl J Med (2019) / PMID: 31881139',
      pubMedUrl: 'https://pubmed.ncbi.nlm.nih.gov/31881139/'
    })
  } else {
    guardrails.push({
      id: 'caloric_cutoff_tight',
      title: 'Evening Caloric Cutoff & Nocturnal Autophagy',
      rule: 'Cease caloric intake $\\ge$3 hours prior to sleep',
      status: 'warning',
      statusLabel: `Late Caloric Window (${Math.round(digestDiff * 10) / 10}h buffer)`,
      description: `Caloric intake is scheduled within 3 hours of sleep (${formatHourToTimeStr(recoveryStartHour)} vs ${formatHourToTimeStr(bedHour)} bedtime). Nocturnal insulin suppresses sleep-induced Growth Hormone pulsatility.`,
      recommendation: 'Advance last meal 60–90 minutes earlier to ensure full gastric clearance.',
      citation: 'de Cabo & Mattson, N Engl J Med (2019) / PMID: 31881139',
      pubMedUrl: 'https://pubmed.ncbi.nlm.nih.gov/31881139/'
    })
  }

  // Guardrail 3: Circadian Caffeine Clearance ($\ge$8-10h before sleep)
  if (caffeineTask) {
    const caffH = (caffeineTask as any).hour
    const diff = bedHour - caffH
    if (diff < 8.0) {
      guardrails.push({
        id: 'caffeine_late',
        title: 'Circadian Caffeine Adenosine Clearance',
        rule: 'Cease caffeine intake $\\ge$8–10 hours prior to sleep',
        status: 'warning',
        statusLabel: `Late Caffeine Detected (${Math.round(diff * 10) / 10}h before bed)`,
        description: 'Caffeine has a 5.7h elimination half-life. Afternoon/evening intake blocks adenosine A1/A2A receptors, suppressing restorative slow-wave delta sleep.',
        recommendation: 'Advance caffeine intake to morning stack (before 12:00 PM).',
        citation: 'Drake et al., J Clin Sleep Med (2013) / PMID: 24235826',
        pubMedUrl: 'https://pubmed.ncbi.nlm.nih.gov/24235826/'
      })
    } else {
      guardrails.push({
        id: 'caffeine_cleared',
        title: 'Circadian Caffeine Adenosine Clearance',
        rule: 'Cease caffeine intake $\\ge$8–10 hours prior to sleep',
        status: 'passed',
        statusLabel: `${Math.round(diff * 10) / 10}h Clearance Respected`,
        description: 'Caffeine is consumed early enough to allow central adenosine receptor unblocking prior to sleep.',
        recommendation: 'Maintains optimal slow-wave delta sleep architecture and nocturnal HRV.',
        citation: 'Drake et al., J Clin Sleep Med (2013) / PMID: 24235826',
        pubMedUrl: 'https://pubmed.ncbi.nlm.nih.gov/24235826/'
      })
    }
  } else {
    guardrails.push({
      id: 'caffeine_none',
      title: 'Circadian Caffeine Adenosine Clearance',
      rule: 'Cease caffeine intake $\\ge$8–10 hours prior to sleep',
      status: 'passed',
      statusLabel: 'Zero Late Stimulants',
      description: 'No late-day caffeine or stimulant modalities scheduled.',
      recommendation: 'Natural adenosine accumulation supports rapid sleep onset latency.',
      citation: 'Drake et al., J Clin Sleep Med (2013) / PMID: 24235826',
      pubMedUrl: 'https://pubmed.ncbi.nlm.nih.gov/24235826/'
    })
  }

  return {
    growthStartHour,
    growthStartTimeFormatted: formatHourToTimeStr(growthStartHour),
    growthTriggerText,
    recoveryStartHour,
    recoveryStartTimeFormatted: formatHourToTimeStr(recoveryStartHour),
    recoveryTriggerText,
    hasResistanceTrainingToday: !!resistanceTask,
    phases,
    transitions,
    criticalModalities: {
      growth: growthEvaluated,
      recovery: recoveryEvaluated,
      growthCoveragePercentage,
      recoveryCoveragePercentage
    },
    guardrails
  }
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
