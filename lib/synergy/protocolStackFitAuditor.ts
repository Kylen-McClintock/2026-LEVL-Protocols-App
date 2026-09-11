import { Modality, DailyProtocolTask, UserBenchItem, UserProfile } from '@/lib/types'
import {
  COMPREHENSIVE_CONFLICT_RULES,
  COMPREHENSIVE_SYNERGY_RULES,
  BiochemicalConflictRule
} from './comprehensiveInteractions'
import {
  LONGEVITY_VECTORS_METADATA,
  calculateCompositeProtocolLongevityScore,
  getAllModalityLongevityImpacts
} from '@/lib/data/longevityKnowledgeBase'

// ============================================================================
// Types & Contracts
// ============================================================================

export interface FunctionalModalityCluster {
  id: string
  name: string
  icon: string
  category: string
  keywords: string[]
  modalityRankings: Record<string, {
    tier: number // 1 = Gold Standard / RCT Anchor, 2 = Synergistic / Substitute, 3 = Entry / Mild
    evidenceGrade: string
    title: string
    clinicalDelta: string
    mechanism: string
    preferredSlot?: string
  }>
}

export interface AlreadyCoveredItem {
  protocolModality: Modality
  userModalityId: string
  userModalityName: string
  clusterName: string
  matchType: 'exact' | 'cluster_equivalent'
  comparisonNote: string
}

export interface UpgradeOpportunityItem {
  id: string
  clusterId: string
  clusterName: string
  currentModalityId: string
  currentModalityName: string
  currentGrade: string
  upgradedModality: Modality
  upgradedGrade: string
  clinicalDelta: string
  mechanismComparison: string
  recommendedTimingSlot: string
  conflictWarning?: {
    conflictingModalityName: string
    headline: string
    suggestedTimingSlot: string
  }
  studies?: { title: string; url: string; pmid?: string }[]
  defaultAction: 'upgrade' | 'keep'
}

export interface StackConflictAlert {
  id: string
  incomingModalityId: string
  incomingModalityName: string
  conflictingModalityId: string
  conflictingModalityName: string
  conflictType: string
  severity: 'timing' | 'moderate' | 'critical'
  headline: string
  rationale: string
  autoResolutionDescription: string
  suggestedTimingSlot: string
  originalTimingSlot: string
  pubmedUrl?: string
}

export interface SynergisticAdditionItem {
  modality: Modality
  step?: any
  clusterName?: string
  headlineBenefit: string
  synergyWithStack?: {
    existingModalityName: string
    headline: string
    rationale: string
  }
  timingSlot: string
  durationMinutes: number
  primaryOutcome?: string
  evidenceGrade?: string
  checkedByDefault: boolean
  hasConflictWarning?: boolean
  conflictResolutionSlot?: string
}

export interface NetLongevityDelta {
  addedDailyMinutes: number
  vectorScoresDelta: {
    vectorId: string
    vectorName: string
    currentScore: number
    projectedScore: number
    gain: number
  }[]
  topGainingVector: string
  topGainPoints: number
  summaryText: string
}

export interface ProtocolStackFitAuditResult {
  hasExistingStack: boolean
  totalProtocolSteps: number
  alreadyCovered: AlreadyCoveredItem[]
  upgrades: UpgradeOpportunityItem[]
  conflicts: StackConflictAlert[]
  synergisticAdditions: SynergisticAdditionItem[]
  netDelta: NetLongevityDelta
  suggestedActionsSummary: {
    additionsCount: number
    upgradesCount: number
    conflictsAutoResolvedCount: number
    coveredCount: number
  }
}

// ============================================================================
// Functional Modality Clusters
// ============================================================================

export const FUNCTIONAL_MODALITY_CLUSTERS: FunctionalModalityCluster[] = [
  {
    id: 'cold_exposure',
    name: 'Cold Exposure & Hormesis',
    icon: '❄️',
    category: 'Thermal Conditioning',
    keywords: ['cold', 'plunge', 'ice', 'cryo', 'shower', 'immersion', 'soberg', 'tenacity'],
    modalityRankings: {
      'cold_water_immersion': {
        tier: 1,
        evidenceGrade: 'Grade A (Human RCT)',
        title: 'Deliberate Cold Water Immersion (50°F–55°F)',
        clinicalDelta: '+250% sustained dopamine surge, profound norepinephrine elevation & brown adipose tissue (BAT) thermogenesis via Søberg Principle.',
        mechanism: 'Full submersion up to neck activates cutaneous cold-shock receptors, stimulating locus coeruleus noradrenaline release and UCP1 mitochondrial uncoupling.',
        preferredSlot: 'morning'
      },
      'huberman_cold_exposure': {
        tier: 1,
        evidenceGrade: 'Grade A (Human RCT)',
        title: 'Huberman Cold Exposure & Willpower Protocol',
        clinicalDelta: '+250% dopamine and anterior midcingulate cortex (aMCC) tenacity conditioning.',
        mechanism: 'Conditions the brain\'s central willpower hub (aMCC) through top-down cognitive suppression of the flight reflex.',
        preferredSlot: 'morning'
      },
      'deliberate_cold_exposure_protocol': {
        tier: 1,
        evidenceGrade: 'Grade A (Human RCT)',
        title: 'Deliberate Cold Water Immersion',
        clinicalDelta: '+250% dopamine and catecholamine surge.',
        mechanism: 'Water immersion stimulates rapid sympathetic nervous response.',
        preferredSlot: 'morning'
      },
      'wim_hof_cold_shock_immersion': {
        tier: 1,
        evidenceGrade: 'Grade A (Human RCT)',
        title: 'Wim Hof Cold Shock Immersion',
        clinicalDelta: 'Vigorous autonomic resilience and acute immune suppression.',
        mechanism: 'Epistemic cold tolerance training with intercostal recruitment.',
        preferredSlot: 'morning'
      },
      'cold_shower': {
        tier: 2,
        evidenceGrade: 'Grade B (Clinical Trial)',
        title: 'Cold Shower Finish (30–60s)',
        clinicalDelta: 'Superficial cutaneous vasoconstriction and acute wakefulness; limited core thermal drop.',
        mechanism: 'Triggers peripheral sensory shock without sufficient volumetric hydrostatic pressure for deep BAT induction.',
        preferredSlot: 'morning'
      },
      'cryotherapy': {
        tier: 2,
        evidenceGrade: 'Grade B (Clinical Trial)',
        title: 'Whole-Body Cryotherapy Chamber',
        clinicalDelta: 'Acute anti-inflammatory cooling; air conductivity is 25x lower than water.',
        mechanism: 'Gaseous nitrogen cooling cools skin surface but produces less sustained catecholamine elevation than liquid immersion.',
        preferredSlot: 'afternoon'
      }
    }
  },
  {
    id: 'circadian_light',
    name: 'Circadian Photobiology & Light Entrainment',
    icon: '🌅',
    category: 'Circadian Health',
    keywords: ['sunlight', 'light', 'circadian', 'lux', 'photobiomodulation', 'optic', 'melanopsin'],
    modalityRankings: {
      'morning_sunlight_viewing': {
        tier: 1,
        evidenceGrade: 'Grade A (Human RCT)',
        title: 'Outdoor Direct Morning Sunlight',
        clinicalDelta: '10,000–100,000 lux broad-spectrum natural photons anchoring central circadian clock.',
        mechanism: 'Stimulates melanopsin intrinsically photosensitive retinal ganglion cells (ipRGCs), resetting SCN clock and timing nocturnal melatonin release 14–16h later.',
        preferredSlot: 'morning'
      },
      'huberman_morning_sunlight': {
        tier: 1,
        evidenceGrade: 'Grade A (Human RCT)',
        title: 'Huberman Morning Sunlight Entrainment',
        clinicalDelta: '10–30 mins outdoor sunlight within 60 mins of waking to eliminate daytime sleepiness.',
        mechanism: 'Direct ipRGC stimulation synchronizes peripheral metabolic clocks and elevates daytime dopamine.',
        preferredSlot: 'morning'
      },
      'lux_light_therapy': {
        tier: 2,
        evidenceGrade: 'Grade B (Clinical Trial)',
        title: '10,000 Lux SAD Light Box',
        clinicalDelta: 'Effective indoor photon flux substitute for dark winter mornings.',
        mechanism: 'High-intensity blue-white LED wavelength simulates natural solar irradiance on retina.',
        preferredSlot: 'morning'
      }
    }
  },
  {
    id: 'caffeine_management',
    name: 'Adenosine & Caffeine Regulation',
    icon: '☕',
    category: 'Neurological & Energy',
    keywords: ['caffeine', 'coffee', 'adenosine', 'crash', 'curfew'],
    modalityRankings: {
      'delay_caffeine_90_120m': {
        tier: 1,
        evidenceGrade: 'Grade A (Human RCT)',
        title: '90–120 Min Morning Caffeine Delay',
        clinicalDelta: 'Completely eliminates the afternoon crash by allowing hepatic adenosine clearance.',
        mechanism: 'Cortisol naturally clears residual sleep adenosine in early morning. Delaying caffeine prevents immediate receptor blockade and subsequent rebound somnolence.',
        preferredSlot: 'morning'
      },
      'huberman_caffeine_delay': {
        tier: 1,
        evidenceGrade: 'Grade A (Human RCT)',
        title: 'Huberman 90–120m Caffeine Delay',
        clinicalDelta: 'Sustained all-day cognitive alertness without afternoon slump.',
        mechanism: 'Synergizes with cortisol awakening response (CAR) before introducing adenosine A1/A2A competitive antagonists.',
        preferredSlot: 'morning'
      },
      'walkercaffeinecutoff': {
        tier: 1,
        evidenceGrade: 'Grade A (Human RCT)',
        title: '10-Hour Pre-Bed Caffeine Curfew',
        clinicalDelta: 'Preserves slow-wave deep sleep (Stage 3/4 NREM) architecture.',
        mechanism: 'Clears circulating caffeine (5–7h elimination half-life) before bedtime to allow VLPO adenosine accumulation.',
        preferredSlot: 'morning'
      },
      'caffeine_intake': {
        tier: 3,
        evidenceGrade: 'Grade C',
        title: 'Uncalibrated Morning Coffee',
        clinicalDelta: 'Immediate adenosine receptor blockage causing late afternoon rebound fatigue.',
        mechanism: 'Caffeine binds to vacant receptors while adenosine levels are elevated, guaranteeing severe crash once caffeine metabolizes.',
        preferredSlot: 'morning'
      }
    }
  },
  {
    id: 'autonomic_breathwork',
    name: 'Autonomic Regulation & Stress Reset',
    icon: '🫁',
    category: 'Mental Resilience',
    keywords: ['sigh', 'breath', 'breathing', 'respiration', 'autonomic', 'vagus', 'cyclic', 'box'],
    modalityRankings: {
      'cyclic_sighing': {
        tier: 1,
        evidenceGrade: 'Grade A (Human RCT)',
        title: 'Cyclic Physiological Sighing (Stanford RCT)',
        clinicalDelta: 'Superior to mindfulness meditation in reducing daily respiratory rate and improving 24h positive affect.',
        mechanism: 'Two rapid nasal inhales re-inflate collapsed pulmonary alveoli; prolonged slow mouth exhale triggers respiratory sinus arrhythmia (RSA) and rapid vagal heart rate deceleration.',
        preferredSlot: 'anytime'
      },
      'huberman_physiological_sigh': {
        tier: 1,
        evidenceGrade: 'Grade A (Human RCT)',
        title: 'Real-Time Physiological Sigh',
        clinicalDelta: 'Immediate real-time autonomic down-regulation in under 60 seconds.',
        mechanism: 'Maximizes alveolar surface area and triggers immediate parasympathetic brake via vagal baroreceptors.',
        preferredSlot: 'anytime'
      },
      'box_breathing': {
        tier: 2,
        evidenceGrade: 'Grade B (Clinical Trial)',
        title: 'Box Breathing (4-4-4-4)',
        clinicalDelta: 'Effective tactical cognitive stabilization under acute combat or surgical stress.',
        mechanism: 'Equalized autonomic pacing regulates heart rate variability during acute sympathetic surges.',
        preferredSlot: 'anytime'
      },
      '478breathing': {
        tier: 2,
        evidenceGrade: 'Grade B (Clinical Trial)',
        title: '4-7-8 Relaxing Breath',
        clinicalDelta: 'Parasympathetic induction for bedtime relaxation.',
        mechanism: 'Extended exhalation ratio increases acetylcholine release at cardiac muscarinic receptors.',
        preferredSlot: 'evening'
      }
    }
  },
  {
    id: 'metabolic_zone2',
    name: 'Post-Meal Ambulation & Metabolic Clearance',
    icon: '🚶',
    category: 'Metabolic & Cardiovascular',
    keywords: ['walk', 'walking', 'glucose', 'postprandial', 'glycemic', 'zone 2', 'cardio'],
    modalityRankings: {
      'huberman_metabolic_walk': {
        tier: 1,
        evidenceGrade: 'Grade A (Human RCT)',
        title: 'Post-Meal Glycemic Disposal Walk (10–15 min)',
        clinicalDelta: 'Blunts postprandial glucose spike by 25–35% and prevents lethargy.',
        mechanism: 'Contracting soleus and quadriceps muscles induce non-insulin-mediated GLUT4 glucose translocation into skeletal muscle.',
        preferredSlot: 'afternoon'
      },
      'metabolic_walking': {
        tier: 1,
        evidenceGrade: 'Grade A (Human RCT)',
        title: 'Postprandial Glycemic Walk',
        clinicalDelta: 'Lowers peak glycemic excursions and improves insulin sensitivity.',
        mechanism: 'Skeletal muscle contraction clears interstitial glucose independent of insulin signaling.',
        preferredSlot: 'afternoon'
      },
      'zone_2_cardio': {
        tier: 1,
        evidenceGrade: 'Grade A (Human RCT)',
        title: 'Zone 2 Steady-State Cardio',
        clinicalDelta: 'Maximal mitochondrial density, lactate clearance & metabolic flexibility.',
        mechanism: 'Stimulates PGC-1α to expand mitochondrial volume in slow-twitch Type I muscle fibers.',
        preferredSlot: 'morning'
      }
    }
  },
  {
    id: 'ultradian_focus',
    name: 'Ultradian Focus & Neuroplasticity',
    icon: '🧠',
    category: 'Cognitive Performance',
    keywords: ['focus', 'bout', 'ultradian', 'deep work', 'pomodoro', 'neuroplasticity'],
    modalityRankings: {
      'huberman_90min_focus_bout': {
        tier: 1,
        evidenceGrade: 'Grade A (Clinical Neurobiology)',
        title: '90-Min Ultradian Deep Focus Bout',
        clinicalDelta: 'Optimizes neuroplasticity window with optimal ~15% error rate and phone isolation.',
        mechanism: 'Matches endogenous 90-minute Kleitman Basic Rest-Activity Cycle (BRAC), driving peak acetylcholine focus and dopamine salience.',
        preferredSlot: 'morning'
      },
      'deep_work_block': {
        tier: 2,
        evidenceGrade: 'Grade B (Observational)',
        title: 'Standard Deep Work Session',
        clinicalDelta: 'High-output distraction-free cognitive productivity.',
        mechanism: 'Reduces attention residue from task switching.',
        preferredSlot: 'morning'
      },
      'pomodoro_technique': {
        tier: 3,
        evidenceGrade: 'Grade C',
        title: 'Pomodoro 25m Sprints',
        clinicalDelta: 'Short sprint focus; artificial interrupts can disrupt deep ultradian flow states.',
        mechanism: 'Frequent 5-minute interruptions truncate sustained prefrontal cortex dopamine buildup.',
        preferredSlot: 'morning'
      }
    }
  },
  {
    id: 'nsdr_rest',
    name: 'Non-Sleep Deep Rest & Neural Reset',
    icon: '⚡',
    category: 'Rest & Recovery',
    keywords: ['nsdr', 'nidra', 'nap', 'rest', 'hypnotherapy', 'theta'],
    modalityRankings: {
      'non_sleep_deep_rest_nsdr': {
        tier: 1,
        evidenceGrade: 'Grade A (Clinical Neurobiology)',
        title: '10–20 Min Non-Sleep Deep Rest (NSDR / Yoga Nidra)',
        clinicalDelta: 'Restores striatal dopamine pools by up to 65% and offsets sleep debt without sleep inertia.',
        mechanism: 'Guides cortical oscillations into alpha-theta border state, resetting dopamine transmission in ventral striatum and enhancing memory consolidation.',
        preferredSlot: 'afternoon'
      },
      'huberman_nsdr': {
        tier: 1,
        evidenceGrade: 'Grade A (Clinical Neurobiology)',
        title: 'Huberman Midday NSDR Reset',
        clinicalDelta: 'Rapid dopamine restoration and physical recovery after morning cognitive bouts.',
        mechanism: 'Theta wave synchronization accelerates prefrontal cortex neural recovery.',
        preferredSlot: 'afternoon'
      },
      'power_nap': {
        tier: 2,
        evidenceGrade: 'Grade B (Clinical Trial)',
        title: '20-Minute Power Nap',
        clinicalDelta: 'Alertness boost; risk of sleep inertia if entering slow-wave Stage 3.',
        mechanism: 'Brief NREM Stage 1/2 sleep clears light adenosine but lacks active guided neuroplasticity induction.',
        preferredSlot: 'afternoon'
      }
    }
  },
  {
    id: 'morning_hydration',
    name: 'Cellular Hydration & Osmoregulation',
    icon: '💧',
    category: 'Physiological Baseline',
    keywords: ['hydration', 'electrolytes', 'water', 'salt', 'potassium', 'magnesium', 'osmolality'],
    modalityRankings: {
      'huberman_hydration_electrolytes': {
        tier: 1,
        evidenceGrade: 'Grade A (Clinical)',
        title: '16–32 oz Water + Full-Spectrum Electrolytes',
        clinicalDelta: 'Reverses overnight dehydration, sustains neuronal action potentials and prevents morning brain fog.',
        mechanism: 'Sodium, potassium, and magnesium ions restore plasma osmolality and fuel active transport Na+/K+-ATPase pumps across cell membranes.',
        preferredSlot: 'morning'
      },
      'morning_hydration_electrolytes': {
        tier: 1,
        evidenceGrade: 'Grade A (Clinical)',
        title: 'Morning Electrolyte Hydration',
        clinicalDelta: 'Optimal cellular hydration and adrenal support upon waking.',
        mechanism: 'Directly restores intravascular fluid volume without osmotic diuresis.',
        preferredSlot: 'morning'
      },
      'plain_water': {
        tier: 3,
        evidenceGrade: 'Grade C',
        title: 'Plain Tap Water',
        clinicalDelta: 'Hydrates but can dilute serum electrolytes and accelerate renal clearance without cellular retention.',
        mechanism: 'Lacks osmotic electrolytes required for intracellular cellular uptake.',
        preferredSlot: 'morning'
      }
    }
  },
  {
    id: 'sleep_optimization',
    name: 'Sleep Architecture & Environment',
    icon: '🌙',
    category: 'Sleep Optimization',
    keywords: ['sleep', 'dark', 'cool', 'thermal drop', 'melatonin', '65f', 'bedtime'],
    modalityRankings: {
      'dark_cool_sleep_environment': {
        tier: 1,
        evidenceGrade: 'Grade A (Human RCT)',
        title: '65°F Thermal Drop & 100% Pitch Darkness',
        clinicalDelta: 'Maximizes Stage 3 Slow-Wave Deep Sleep and nocturnal growth hormone release.',
        mechanism: 'Core body temperature drop of 2°–3°F is the physiological trigger for NREM slow-wave sleep initiation; darkness prevents ocular melatonin suppression.',
        preferredSlot: 'evening'
      },
      'blueprintsleeparchitecture': {
        tier: 1,
        evidenceGrade: 'Grade A (Human RCT)',
        title: 'Bryan Johnson Sleep Architecture System',
        clinicalDelta: 'Consistent 100% sleep score with strict light curfew and temperature regulation.',
        mechanism: 'Multi-layered circadian synchronization and uninterrupted slow-wave recovery.',
        preferredSlot: 'evening'
      }
    }
  }
]

// ============================================================================
// Helper Utilities
// ============================================================================

function normalizeString(str?: string): string {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function findModalityCluster(modality?: Modality | { id?: string; name?: string } | null): FunctionalModalityCluster | null {
  if (!modality || !modality.id) return null
  const normId = normalizeString(modality.id)
  const normName = normalizeString((modality as any).name || (modality as any).display_name || '')

  for (const cluster of FUNCTIONAL_MODALITY_CLUSTERS) {
    // Check explicit ranking keys
    for (const key of Object.keys(cluster.modalityRankings)) {
      const normKey = normalizeString(key)
      if (normId === normKey || normId.includes(normKey) || normKey.includes(normId)) {
        return cluster
      }
    }
    // Check keywords
    const matchesKeyword = cluster.keywords.some(kw => {
      const normKw = normalizeString(kw)
      return normId.includes(normKw) || normName.includes(normKw)
    })
    if (matchesKeyword) {
      return cluster
    }
  }
  return null
}

export function getModalityRankInCluster(
  modality?: Modality | { id?: string; name?: string } | null,
  cluster?: FunctionalModalityCluster | null
): { tier: number; evidenceGrade: string; title: string; clinicalDelta: string; mechanism: string; preferredSlot?: string } | null {
  if (!modality || !modality.id || !cluster) return null
  const normId = normalizeString(modality.id)
  const normName = normalizeString((modality as any).name || (modality as any).display_name || '')

  // Exact key match
  for (const [key, ranking] of Object.entries(cluster.modalityRankings)) {
    const normKey = normalizeString(key)
    if (normId === normKey || normId.includes(normKey) || normKey.includes(normId)) {
      return ranking
    }
  }

  // Name match
  for (const [key, ranking] of Object.entries(cluster.modalityRankings)) {
    const normKey = normalizeString(key)
    if (normName.includes(normKey)) {
      return ranking
    }
  }

  // Fallback heuristic based on modality evidence_quality if present
  const modObj = modality as Modality
  if (modObj.evidence_quality && modObj.evidence_quality >= 80) {
    return {
      tier: 1,
      evidenceGrade: 'Grade A (Human RCT)',
      title: modObj.display_name || modObj.name || modObj.id,
      clinicalDelta: modObj.headline_benefit || 'High-evidence clinical protocol.',
      mechanism: modObj.mechanism_of_action || 'Targeted physiological pathway stimulation.'
    }
  }

  return {
    tier: 2,
    evidenceGrade: 'Grade B (Clinical Trial)',
    title: (modality as any).display_name || (modality as any).name || modality.id,
    clinicalDelta: (modality as any).headline_benefit || 'Standard modality implementation.',
    mechanism: (modality as any).mechanism_of_action || 'Supported physiological mechanism.'
  }
}

function parseDurationMinutes(durationStr?: string, category?: string): number {
  if (!durationStr) return 10
  const clean = durationStr.toLowerCase().trim()
  
  // Passive environmental modalities like sleep environment or overnight fasting shouldn't count as hours of active execution
  if (category === 'sleep' || clean.includes('sleep') || clean.includes('overnight') || clean.includes('environment')) {
    return 2 // 2 minutes to set thermostat / prep bedroom
  }

  // Check for hours
  const hourMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:hour|hr)/)
  if (hourMatch) {
    const hrs = parseFloat(hourMatch[1])
    if (hrs >= 5) return 2 // Likely an overnight state
    return Math.round(hrs * 60)
  }

  // Check for range like 10-15 or 10–15
  const rangeMatch = clean.match(/(\d+)\s*[-–—to]+\s*(\d+)/)
  if (rangeMatch) {
    const avg = Math.round((parseInt(rangeMatch[1], 10) + parseInt(rangeMatch[2], 10)) / 2)
    return Math.min(avg, 120)
  }

  const singleMatch = clean.match(/(\d+)/)
  if (singleMatch) {
    const val = parseInt(singleMatch[1], 10)
    return Math.min(val, 120)
  }

  return 10
}

export function auditProtocolStackFit(
  protocol: any,
  existingTasks: DailyProtocolTask[] = [],
  benchItems: UserBenchItem[] = [],
  allModalities: Modality[] = [],
  userProfile?: UserProfile | null
): ProtocolStackFitAuditResult {
  const emptyResult: ProtocolStackFitAuditResult = {
    hasExistingStack: false,
    totalProtocolSteps: 0,
    alreadyCovered: [],
    upgrades: [],
    conflicts: [],
    synergisticAdditions: [],
    netDelta: {
      addedDailyMinutes: 0,
      vectorScoresDelta: [],
      topGainingVector: 'Brain Longevity',
      topGainPoints: 0,
      summaryText: '0m tailored daily habit investment.'
    },
    suggestedActionsSummary: {
      additionsCount: 0,
      upgradesCount: 0,
      conflictsAutoResolvedCount: 0,
      coveredCount: 0
    }
  }

  if (!protocol) return emptyResult

  const hasExistingStack = (existingTasks && existingTasks.length > 0) || (benchItems && benchItems.some(b => b && b.status === 'active'))

  // 1. Gather all active modalities currently in the user's stack
  const activeUserModalities: { id: string; name: string; timingSlot: string; modality?: Modality }[] = []

  existingTasks?.forEach(task => {
    if (!task || task.status === 'skipped') return
    const modId = task.modality_id
    if (!modId) return
    const resolvedMod = allModalities?.find(m => m && m.id === modId) || task.loose_modality || task.protocol_step?.modality || (task as any).modality
    activeUserModalities.push({
      id: modId,
      name: resolvedMod?.display_name || resolvedMod?.name || (task as any).custom_name || modId,
      timingSlot: task.timing_slot || 'morning',
      modality: resolvedMod
    })
  })

  benchItems?.forEach(bench => {
    if (!bench || bench.status !== 'active') return
    const modId = bench.modality_id
    if (!modId) return
    const resolvedMod = allModalities?.find(m => m && m.id === modId) || bench.modality
    if (!activeUserModalities.some(u => u.id === modId)) {
      activeUserModalities.push({
        id: modId,
        name: resolvedMod?.display_name || resolvedMod?.name || modId,
        timingSlot: bench.custom_timing || 'morning',
        modality: resolvedMod
      })
    }
  })

  // 2. Resolve protocol steps and their modalities
  const protocolSteps: any[] = Array.isArray(protocol?.steps)
    ? protocol.steps
    : (Array.isArray(protocol?.protocol_steps) ? protocol.protocol_steps : [])
  const protocolConstituents: {
    modality: Modality
    step: any
    timingSlot: string
  }[] = []

  protocolSteps.forEach(step => {
    if (!step) return
    const modId = step.modality_id || step.modality?.id
    if (!modId) return

    const rawMod = step.modality || allModalities?.find(m => m && (m.id === modId || m.slug === modId)) || null

    const safeFunctionalOutcomes = rawMod?.functional_outcomes_to_track
      ? (Array.isArray(rawMod.functional_outcomes_to_track)
          ? rawMod.functional_outcomes_to_track
          : (typeof rawMod.functional_outcomes_to_track === 'string'
              ? (rawMod.functional_outcomes_to_track as string).replace(/[{}]/g, '').split(',').map((s: string) => s.trim()).filter(Boolean)
              : []))
      : []

    const resolvedMod: Modality = rawMod ? {
      ...rawMod,
      functional_outcomes_to_track: safeFunctionalOutcomes
    } : {
      id: modId,
      name: step.name || modId.replace(/_/g, ' '),
      display_name: step.name || modId.replace(/_/g, ' '),
      category: 'lifestyle',
      timing_summary: step.timing_slot || 'morning',
      functional_outcomes_to_track: safeFunctionalOutcomes
    } as Modality

    protocolConstituents.push({
      modality: resolvedMod,
      step,
      timingSlot: step.timing_slot || resolvedMod.default_timing_slot || 'morning'
    })
  })

  // 3. Process each protocol step into audit categories
  const alreadyCovered: AlreadyCoveredItem[] = []
  const upgrades: UpgradeOpportunityItem[] = []
  const conflicts: StackConflictAlert[] = []
  const synergisticAdditions: SynergisticAdditionItem[] = []

  protocolConstituents.forEach(({ modality: incomingMod, step, timingSlot }) => {
    if (!incomingMod) return
    const normIncomingId = normalizeString(incomingMod.id)
    const normIncomingName = normalizeString(incomingMod.name || incomingMod.display_name || '')

    // Check A: Exact match with existing active user modality
    const exactMatch = activeUserModalities.find(u => {
      const uNormId = normalizeString(u.id)
      const uNormName = normalizeString(u.name)
      return uNormId === normIncomingId || uNormName === normIncomingName
    })

    if (exactMatch) {
      alreadyCovered.push({
        protocolModality: incomingMod,
        userModalityId: exactMatch.id,
        userModalityName: exactMatch.name,
        clusterName: 'Exact Habit Match',
        matchType: 'exact',
        comparisonNote: `Already active in your daily routine (${exactMatch.timingSlot || 'scheduled'}).`
      })
      return
    }

    // Check B: Cluster equivalent & Evidence Upgrade Opportunity
    const incomingCluster = findModalityCluster(incomingMod)

    if (incomingCluster) {
      // Find if user has a modality in the same functional cluster
      const userClusterMatch = activeUserModalities.find(u => {
        const uCluster = findModalityCluster(u.modality || { id: u.id, name: u.name })
        return uCluster && uCluster.id === incomingCluster.id
      })

      if (userClusterMatch) {
        const incomingRank = getModalityRankInCluster(incomingMod, incomingCluster)
        const userRank = getModalityRankInCluster(
          userClusterMatch.modality || { id: userClusterMatch.id, name: userClusterMatch.name },
          incomingCluster
        )

        const incomingTier = incomingRank?.tier || 2
        const userTier = userRank?.tier || 2

        if (incomingTier < userTier) {
          // Check if this upgraded modality conflicts with user's routine
          let upgradeSlot = incomingRank?.preferredSlot || timingSlot || 'morning'
          let conflictNotice: UpgradeOpportunityItem['conflictWarning'] = undefined

          for (const rule of COMPREHENSIVE_CONFLICT_RULES) {
            const incomingMatchesTrigger = rule.triggers.some(t => normIncomingId.includes(t) || normIncomingName.includes(t))
            if (!incomingMatchesTrigger) continue

            const userTargetMatch = activeUserModalities.find(u => {
              if (u.id === userClusterMatch.id) return false
              const uNormId = normalizeString(u.id)
              const uNormName = normalizeString(u.name)
              return rule.targets.some(target => uNormId.includes(target) || uNormName.includes(target))
            })

            if (userTargetMatch) {
              let resolvedSlot = 'afternoon'
              if (rule.autoResolutionTiming.recommendedTimeSlot) {
                resolvedSlot = rule.autoResolutionTiming.recommendedTimeSlot.toLowerCase().includes('morning')
                  ? 'morning'
                  : rule.autoResolutionTiming.recommendedTimeSlot.toLowerCase().includes('evening')
                  ? 'evening'
                  : 'afternoon'
              } else if (userTargetMatch.timingSlot.toLowerCase().includes('morning')) {
                resolvedSlot = 'afternoon'
              }

              upgradeSlot = resolvedSlot
              conflictNotice = {
                conflictingModalityName: userTargetMatch.name,
                headline: rule.headline,
                suggestedTimingSlot: resolvedSlot
              }

              conflicts.push({
                id: `conflict_upgrade_${incomingMod.id}_vs_${userTargetMatch.id}`,
                incomingModalityId: incomingMod.id,
                incomingModalityName: incomingMod.display_name || incomingMod.name || incomingMod.id,
                conflictingModalityId: userTargetMatch.id,
                conflictingModalityName: userTargetMatch.name,
                conflictType: rule.type,
                severity: rule.severity,
                headline: rule.headline,
                rationale: rule.rationale,
                autoResolutionDescription: rule.autoResolutionTiming.description,
                suggestedTimingSlot: resolvedSlot,
                originalTimingSlot: timingSlot,
                pubmedUrl: rule.pubmedUrl
              })
              break
            }
          }

          // Protocol has a superior evidence-grade version (e.g. Cold Plunge vs Cold Shower)
          upgrades.push({
            id: `upgrade_${userClusterMatch.id}_to_${incomingMod.id}`,
            clusterId: incomingCluster.id,
            clusterName: incomingCluster.name,
            currentModalityId: userClusterMatch.id,
            currentModalityName: userClusterMatch.name,
            currentGrade: userRank?.evidenceGrade || 'Grade B',
            upgradedModality: incomingMod,
            upgradedGrade: incomingRank?.evidenceGrade || 'Grade A (Human RCT)',
            clinicalDelta: incomingRank?.clinicalDelta || 'Clinically validated upgrade with superior biomarker outcomes.',
            mechanismComparison: incomingRank?.mechanism || 'Direct physiological stimulation.',
            recommendedTimingSlot: upgradeSlot,
            conflictWarning: conflictNotice,
            studies: incomingMod.scientific_references?.map(r => ({
              title: r?.title || '',
              url: r?.url || '',
              pmid: r?.pmid
            })) || [],
            defaultAction: 'upgrade'
          })
          return
        } else {
          // User already has an equal or superior version in this cluster
          alreadyCovered.push({
            protocolModality: incomingMod,
            userModalityId: userClusterMatch.id,
            userModalityName: userClusterMatch.name,
            clusterName: incomingCluster.name,
            matchType: 'cluster_equivalent',
            comparisonNote: `Your current ${userClusterMatch.name} (${userRank?.evidenceGrade || 'Grade A'}) already satisfies this biological target.`
          })
          return
        }
      }
    }

    // Check C: Modality is NOT covered - Check for Physiological Conflicts with user's routine
    let hasConflict = false
    let conflictResolutionSlot: string | undefined = undefined

    for (const rule of COMPREHENSIVE_CONFLICT_RULES) {
      const incomingMatchesTrigger = rule.triggers.some(t => normIncomingId.includes(t) || normIncomingName.includes(t))
      if (!incomingMatchesTrigger) continue

      // Check if user has an active modality that matches the targets of this conflict
      const userTargetMatch = activeUserModalities.find(u => {
        const uNormId = normalizeString(u.id)
        const uNormName = normalizeString(u.name)
        return rule.targets.some(target => uNormId.includes(target) || uNormName.includes(target))
      })

      if (userTargetMatch) {
        hasConflict = true
        // Calculate resolution slot
        let resolvedSlot = 'afternoon'
        if (rule.autoResolutionTiming.recommendedTimeSlot) {
          resolvedSlot = rule.autoResolutionTiming.recommendedTimeSlot.toLowerCase().includes('morning')
            ? 'morning'
            : rule.autoResolutionTiming.recommendedTimeSlot.toLowerCase().includes('evening')
            ? 'evening'
            : 'afternoon'
        } else if (userTargetMatch.timingSlot.toLowerCase().includes('morning')) {
          resolvedSlot = 'afternoon'
        } else {
          resolvedSlot = 'morning'
        }

        conflictResolutionSlot = resolvedSlot

        conflicts.push({
          id: `conflict_${incomingMod.id}_vs_${userTargetMatch.id}`,
          incomingModalityId: incomingMod.id,
          incomingModalityName: incomingMod.display_name || incomingMod.name || incomingMod.id,
          conflictingModalityId: userTargetMatch.id,
          conflictingModalityName: userTargetMatch.name,
          conflictType: rule.type,
          severity: rule.severity,
          headline: rule.headline,
          rationale: rule.rationale,
          autoResolutionDescription: rule.autoResolutionTiming.description,
          suggestedTimingSlot: resolvedSlot,
          originalTimingSlot: timingSlot,
          pubmedUrl: rule.pubmedUrl
        })
        break // Flag once per modality
      }
    }

    // Check D: Look for positive synergies with user's existing stack
    let synergyMatch: { existingModalityName: string; headline: string; rationale: string } | undefined = undefined

    for (const rule of COMPREHENSIVE_SYNERGY_RULES) {
      const incomingMatchesTrigger = rule.triggers.some(t => normIncomingId.includes(t) || normIncomingName.includes(t))
      if (!incomingMatchesTrigger) continue

      const userTargetMatch = activeUserModalities.find(u => {
        const uNormId = normalizeString(u.id)
        const uNormName = normalizeString(u.name)
        return rule.targets.some(target => uNormId.includes(target) || uNormName.includes(target))
      })

      if (userTargetMatch) {
        synergyMatch = {
          existingModalityName: userTargetMatch.name,
          headline: rule.headline,
          rationale: rule.rationale
        }
        break
      }
    }

    // Add to Synergistic Additions
    const estDuration = parseDurationMinutes(incomingMod.duration, incomingMod.category)

    synergisticAdditions.push({
      modality: incomingMod,
      step,
      clusterName: incomingCluster?.name,
      headlineBenefit: incomingMod.headline_benefit || 'Evidence-backed longevity anchor.',
      synergyWithStack: synergyMatch,
      timingSlot: conflictResolutionSlot || timingSlot,
      durationMinutes: estDuration,
      primaryOutcome: incomingMod.primary_outcome || 'Longevity',
      evidenceGrade: incomingMod.evidence_quality && incomingMod.evidence_quality >= 80 ? 'Grade A (Human RCT)' : 'Grade B (Clinical)',
      checkedByDefault: true,
      hasConflictWarning: hasConflict,
      conflictResolutionSlot
    })
  })

  // 4. Calculate Net Longevity & Biological Delta
  const currentModsList = activeUserModalities.map(u => u.modality).filter(Boolean) as Modality[]
  
  // Model the projected stack: current mods minus upgraded old mods plus new additions and upgraded mods
  const upgradedOldIds = new Set(upgrades.map(u => u.currentModalityId))
  const projectedModsList = currentModsList.filter(m => m && !upgradedOldIds.has(m.id))
  
  upgrades.forEach(u => {
    if (u?.upgradedModality) projectedModsList.push(u.upgradedModality)
  })
  synergisticAdditions.forEach(a => {
    if (a?.modality) projectedModsList.push(a.modality)
  })

  const vectorScoresDelta: NetLongevityDelta['vectorScoresDelta'] = []
  let topGainingVector = 'Brain Longevity'
  let topGainPoints = 0

  Object.keys(LONGEVITY_VECTORS_METADATA).forEach(vKey => {
    const meta = LONGEVITY_VECTORS_METADATA[vKey]
    const curComp = currentModsList.length > 0 ? calculateCompositeProtocolLongevityScore(currentModsList, vKey) : { score: 0 }
    const projComp = calculateCompositeProtocolLongevityScore(projectedModsList, vKey)
    
    const curScore = curComp.score || 0
    const projScore = projComp.score || 0
    const gain = Math.max(0, projScore - curScore)

    if (gain > topGainPoints) {
      topGainPoints = gain
      topGainingVector = meta.name
    }

    vectorScoresDelta.push({
      vectorId: vKey,
      vectorName: meta.name,
      currentScore: curScore,
      projectedScore: projScore,
      gain
    })
  })

  const addedDailyMinutes = synergisticAdditions.reduce((acc, a) => acc + (a.durationMinutes || 10), 0)

  const netDelta: NetLongevityDelta = {
    addedDailyMinutes,
    vectorScoresDelta: vectorScoresDelta.sort((a, b) => b.gain - a.gain),
    topGainingVector,
    topGainPoints,
    summaryText: topGainPoints > 0 
      ? `+${topGainPoints} pts projected in ${topGainingVector} with ${addedDailyMinutes}m daily commitment.`
      : `${addedDailyMinutes}m tailored daily habit investment.`
  }

  return {
    hasExistingStack,
    totalProtocolSteps: protocolConstituents.length,
    alreadyCovered,
    upgrades,
    conflicts,
    synergisticAdditions,
    netDelta,
    suggestedActionsSummary: {
      additionsCount: synergisticAdditions.length,
      upgradesCount: upgrades.length,
      conflictsAutoResolvedCount: conflicts.length,
      coveredCount: alreadyCovered.length
    }
  }
}
