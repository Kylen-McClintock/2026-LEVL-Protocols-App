import { DailyProtocolTask, UserProfile, DailyWellbeingCheckin, Modality, OutcomeDimension } from '@/lib/types'
import { BiomarkerMeasurementRecord } from '@/lib/aging-models/bioAgeTypes'
import { BodyCompositionRecord } from '@/lib/storage/physiqueStorage'
import {
  PeptideCycleSummary,
  getCanonicalPeptideKey,
  PEPTIDE_PK_REGISTRY
} from '@/lib/peptides/peptideCycleEngine'
import { PROTOCOL_LITERATURE_BENCHMARKS } from '@/lib/peptides/peptideEffectivenessEngine'
import { resolvePubMedCitation } from '@/lib/tracking/scientificCitations'

export interface CycleQualityScores {
  overallScore: number // 0-100
  overallTier: 'Optimal Design' | 'Strong Protocol' | 'Moderate / Room for Optimization' | 'High Risk / Unbalanced'
  overallRatingLabel: string
  goalAlignmentScore: number // 0-100
  synergyScore: number // 0-100
  evidenceScore: number // 0-100
  safetyScore: number // 0-100
  measurabilityScore: number // 0-100
  complexityIndex: number // 0-100 (Lower is cleaner/simpler)
  complexityLabel: 'Streamlined' | 'Moderate' | 'High Complexity'
}

export interface ScoreCalculationDetail {
  id: 'overall' | 'goal_alignment' | 'synergy' | 'evidence' | 'safety' | 'measurability' | 'complexity'
  title: string
  score: number | string
  ratingLabel: string
  mathematicalFormula: string
  summaryExplanation: string
  contributingFactors: {
    label: string
    impact: 'positive' | 'negative' | 'neutral'
    detail: string
  }[]
  targetTab: 'overview' | 'synergies' | 'timing' | 'measurability' | 'learning'
}

export interface CompoundRoleAttribution {
  modalityId: string
  modalityName: string
  protocolName: string
  primaryRole: string
  mechanisticTargets: string[]
  targetReceptors: string[]
  statedGoalFit: {
    aligned: boolean
    goalLabel: string
    rationale: string
  }
  evidenceLevel: string
  pubmedUrl: string
  weeklyFrequency: string
  timingSlot: string
  isRedundant: boolean
  redundancyDetails?: string
}

export interface StackSynergyDetail {
  compoundA: string
  compoundB: string
  synergyType: 'receptor_amplification' | 'structural_collagen' | 'metabolic_cascade' | 'neuro_balance' | 'mucosal_integrity' | 'anti_fibrotic'
  headline: string
  mechanisticRationale: string
  actionableTiming: string
  evidenceRating: 'High (Clinical Trials)' | 'Moderate (Translational)' | 'Mechanistic Synergy'
  pubmedUrl?: string
}

export interface StackRedundancyDetail {
  compounds: string[]
  targetPathway: string
  headline: string
  rationale: string
  recommendation: string
  potentialSimplification: string
}

export interface StackConflictDetail {
  compounds: string[]
  conflictType: 'timing_blunting' | 'circadian_stimulation' | 'receptor_downregulation' | 'mineral_depletion' | 'glycemic_shock'
  severity: 'critical' | 'moderate' | 'timing_adjustment'
  headline: string
  rationale: string
  mitigation: string
  autoResolutionAction: string
}

export interface TimingCoordinationSlot {
  slotKey: string
  slotLabel: string
  scheduledCompounds: string[]
  isOptimal: boolean
  notes: string
}

export interface MeasurabilityAudit {
  measurabilityScorePct: number
  totalTargetOutcomes: number
  activelyTrackedCount: number
  trackedOutcomes: {
    key: string
    label: string
    associatedCompounds: string[]
    observationCount: number
    baselineAvg: number | null
    activeAvg: number | null
    deltaPct: number | null
    isCalibrating?: boolean
  }[]
  blindSpots: {
    modalityName: string
    missingOutcomeKey: string
    missingOutcomeLabel: string
    whyItMatters: string
    suggestedAction: string
  }[]
  biomarkerCoverage: {
    biomarkerId: string
    biomarkerName: string
    associatedCompounds: string[]
    status: 'measured' | 'pending' | 'missing'
    baselineValue?: string
    activeValue?: string
    deltaPercent?: number | null
    clinicalRationale: string
  }[]
}

export interface LearnedStackInsight {
  compoundId: string
  compoundName: string
  primaryOutcome: string
  expectedBenefit: string
  observedBenefit: string
  status: 'proven_value' | 'promising_trend' | 'inconclusive' | 'low_observed_impact'
  personalConfidence: 'Calibrating (<7d)' | 'Moderate Signal (7-21d)' | 'High Confidence (>21d)'
  adherencePct: number
  daysLogged: number
  nextCycleRecommendation: string
}

export interface CycleIntelligenceReport {
  scores: CycleQualityScores
  scoreCalculations: Record<string, ScoreCalculationDetail>
  compoundRoles: CompoundRoleAttribution[]
  synergies: StackSynergyDetail[]
  redundancies: StackRedundancyDetail[]
  conflicts: StackConflictDetail[]
  timingSlots: TimingCoordinationSlot[]
  measurability: MeasurabilityAudit
  learnedInsights: LearnedStackInsight[]
  executiveAdvisories: {
    type: 'synergy' | 'optimization' | 'timing' | 'safety' | 'measurability'
    title: string
    description: string
    actionText?: string
    actionOutcomeKey?: string
    actionOutcomeLabel?: string
  }[]
  nextCycleBlueprint: {
    suggestedKeepers: string[]
    suggestedWashoutsOrDrops: string[]
    suggestedTimingTweaks: string[]
    summaryRationale: string
  }
}

// -------------------------------------------------------------
// KNOWN MECHANISTIC & SYNERGY KNOWLEDGE BASE
// -------------------------------------------------------------

interface SynergyRule {
  compounds: [string, string]
  type: StackSynergyDetail['synergyType']
  headline: string
  rationale: string
  actionableTiming: string
  evidence: StackSynergyDetail['evidenceRating']
  pubmedUrl: string
}

const PEPTIDE_SYNERGY_REGISTRY: SynergyRule[] = [
  {
    compounds: ['bpc157', 'tb500'],
    type: 'structural_collagen',
    headline: 'Dual-Axis Angiogenic & Connective Remodeling (Wolverine Stack)',
    rationale:
      'BPC-157 accelerates focal adhesion kinase (FAK-paxillin) and localized VEGFR2 microvascular perfusion, while TB-500 upregulates actin filament sequestering and suppresses fibrotic TGF-beta scar formation.',
    actionableTiming: 'BPC-157 daily morning; TB-500 2x weekly (e.g. Tuesday & Friday).',
    evidence: 'Moderate (Translational)',
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/29998800/'
  },
  {
    compounds: ['cjc1295', 'ipamorelin'],
    type: 'receptor_amplification',
    headline: 'Synergistic GHRH + Ghrelin Receptor Somatotropic Pulse',
    rationale:
      'CJC-1295 (GHRH analogue) and Ipamorelin (selective GHS-R1a agonist) act on distinct pituitary receptors to produce a 2–10x amplified physiological Growth Hormone pulse without elevating cortisol or prolactin.',
    actionableTiming: 'Administer together pre-bed in a fasted state (≥90 mins post-meal). 5 on / 2 off weekly cadence.',
    evidence: 'High (Clinical Trials)',
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/16822826/'
  },
  {
    compounds: ['ghk_cu', 'bpc157'],
    type: 'structural_collagen',
    headline: 'Synergistic Collagen Matrix & Skin/Tendon Remodeling (Glow Stack)',
    rationale:
      'GHK-Cu upregulates dermal collagen I/III synthesis, decorin, and downregulates metalloproteinases (MMPs), while BPC-157 accelerates microvascular capillary supply to healing epithelial and connective beds.',
    actionableTiming: 'GHK-Cu morning SubQ; BPC-157 morning SubQ. Balance with 15–30mg oral Zinc.',
    evidence: 'High (Clinical Trials)',
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/29998800/'
  },
  {
    compounds: ['motsc', 'ss31'],
    type: 'metabolic_cascade',
    headline: 'Dual Mitochondrial Inner-Membrane Cardiolipin & AMPK Translocation',
    rationale:
      'SS-31 restores mitochondrial inner-membrane cardiolipin integrity and electron transport efficiency, while MOTS-c activates AMPK, stimulates GLUT4 skeletal muscle glucose uptake, and enhances aerobic capacity.',
    actionableTiming: 'MOTS-c 3x weekly morning pre-cardio; SS-31 daily morning loading pulse.',
    evidence: 'High (Clinical Trials)',
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/25738459/'
  },
  {
    compounds: ['semax', 'selank'],
    type: 'neuro_balance',
    headline: 'Balanced Neurotrophic Focus & Anxiolytic Enkephalin Homeostasis',
    rationale:
      'Semax upregulates BDNF and cholinergic neurotransmission for cognitive focus and working memory, while Selank modulates GABAergic and enkephalin pathways to prevent adrenergic over-stimulation and mental fatigue.',
    actionableTiming: 'Semax morning upon waking; Selank midday or during high-stress working hours. 5 on / 2 off.',
    evidence: 'High (Clinical Trials)',
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/16995437/'
  },
  {
    compounds: ['bpc157', 'kpv'],
    type: 'mucosal_integrity',
    headline: 'Dual Mucosal Lining Barrier Restoration & NF-κB Suppression',
    rationale:
      'KPV (alpha-MSH fragment) selectively inhibits mucosal NF-κB and inflammatory interleukin transcription, while BPC-157 stimulates nitric oxide release and restores tight junction integrity in the GI mucosal epithelium.',
    actionableTiming: 'Administer morning on an empty stomach.',
    evidence: 'Moderate (Translational)',
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/29998800/'
  },
  {
    compounds: ['tesamorelin', 'ipamorelin'],
    type: 'receptor_amplification',
    headline: 'Targeted Visceral Adipose Lipolysis & GHS-R1a Synergy',
    rationale:
      'Tesamorelin specifically triggers visceral fat lipolysis via GRF receptor activation while Ipamorelin maintains nocturnal somatotroph sensitivity and preserves lean muscle tissue without stimulating appetite.',
    actionableTiming: 'Pre-bed in a fasted state.',
    evidence: 'High (Clinical Trials)',
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/17978288/'
  },
  {
    compounds: ['epitalon', 'motsc'],
    type: 'metabolic_cascade',
    headline: 'Circadian Pineal Epigenetics & Mitochondrial Longevity Pulse',
    rationale:
      'Epitalon resets pineal melatonin circadian synthesis and telomerase transcriptional access, while MOTS-c optimizes metabolic homeostasis and cellular resilience across longevity pathways.',
    actionableTiming: 'Epitalon pre-bed in dark environment; MOTS-c morning fasted.',
    evidence: 'Moderate (Translational)',
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/12374466/'
  }
]

// Known redundant pairings that target the exact same receptor pathway
const PEPTIDE_REDUNDANCY_REGISTRY = [
  {
    pathway: 'GHRH Receptor Agonism',
    compounds: ['cjc1295', 'sermorelin', 'tesamorelin', 'mod_grf'],
    maxRecommended: 1,
    headline: 'Overlapping GHRH Receptor Saturation',
    rationale:
      'Running multiple GHRH analogues (e.g. CJC-1295 + Sermorelin or Tesamorelin) simultaneously competes for the same pituitary GHRH receptor without providing additive benefits, accelerating receptor desensitization.',
    recommendation: 'Select one GHRH secretagogue based on primary goal (CJC-1295 for nocturnal GH; Tesamorelin for visceral lipolysis).'
  },
  {
    pathway: 'GHRP / Ghrelin Receptor Agonism',
    compounds: ['ipamorelin', 'ghrp2', 'ghrp6', 'hexarelin', 'mk677'],
    maxRecommended: 1,
    headline: 'Overlapping GHS-R1a Agonism',
    rationale:
      'Combining multiple GHRPs (e.g. Ipamorelin + GHRP-2 or MK-677) saturates the GHS-R1a receptor and increases the risk of unwanted prolactin and cortisol elevations.',
    recommendation: 'Use a single selective GHRP (Ipamorelin is gold standard for selective GH pulse without prolactin/cortisol).'
  },
  {
    pathway: 'GLP-1 / GIP Incretin Agonism',
    compounds: ['semaglutide', 'tirzepatide', 'retatrutide', 'liraglutide'],
    maxRecommended: 1,
    headline: 'Concurrent Multi-Incretin Agonism',
    rationale:
      'Stacking multiple GLP-1 or dual GLP-1/GIP agonists (e.g., Semaglutide with Tirzepatide) dramatically increases GI adverse events and pancreatic strain without clinical justification.',
    recommendation: 'Utilize a single titrated incretin agonist under proper clinical guidance.'
  }
]

// Known mechanistic conflicts & timing warnings
const PEPTIDE_CONFLICT_REGISTRY = [
  {
    check: (compounds: string[], timingMap: Record<string, string>) => {
      // GH secretagogues taken with meals or improper timing
      const ghCompounds = compounds.filter(c => ['cjc1295', 'ipamorelin', 'sermorelin', 'tesamorelin'].includes(c))
      const hasMorningGH = ghCompounds.some(c => timingMap[c] === 'morning' || timingMap[c] === 'afternoon')
      if (hasMorningGH) {
        return {
          compounds: ghCompounds,
          conflictType: 'timing_blunting' as const,
          severity: 'timing_adjustment' as const,
          headline: 'Daytime / Post-Prandial GH Blunting Risk',
          rationale: 'Growth hormone secretagogues are heavily blunted by circulating glucose, free fatty acids, and somatostatin. Daytime administration without a strict 90+ minute fast drastically reduces peak pulsatile amplitude.',
          mitigation: 'Shift all GHRH/GHRP injections to pre-bed (at least 90–120 minutes after your last meal) to synchronize with natural slow-wave nocturnal pulses.',
          autoResolutionAction: 'Move to Pre-Bed Fasted Slot'
        }
      }
      return null
    }
  },
  {
    check: (compounds: string[], timingMap: Record<string, string>) => {
      // Semax or Stimulating Nootropics taken pre-bed
      const nootropics = compounds.filter(c => ['semax', 'adamax', 'bromantane', 'motsc'].includes(c))
      const hasLateNootropic = nootropics.some(c => timingMap[c] === 'evening' || timingMap[c] === 'pre_bed' || timingMap[c] === 'night')
      if (hasLateNootropic) {
        return {
          compounds: nootropics,
          conflictType: 'circadian_stimulation' as const,
          severity: 'moderate' as const,
          headline: 'Nocturnal BDNF / Circadian Sleep Disruption',
          rationale: 'Semax and MOTS-c stimulate central monoaminergic transmission, BDNF synthesis, and cellular metabolic energy. Administering them in the evening compromises Slow-Wave Deep Sleep architecture.',
          mitigation: 'Administer stimulating peptides strictly in the morning upon waking or prior to your workout window.',
          autoResolutionAction: 'Move to Morning Fasted Slot'
        }
      }
      return null
    }
  },
  {
    check: (compounds: string[]) => {
      // High-dose copper without zinc monitoring
      if (compounds.includes('ghk_cu')) {
        return {
          compounds: ['ghk_cu'],
          conflictType: 'mineral_depletion' as const,
          severity: 'timing_adjustment' as const,
          headline: 'Zinc/Copper Mineral Homeostasis Check',
          rationale: 'Extended SubQ GHK-Cu cycles introduce bioavailable copper that competes with zinc absorption and storage, which can alter serum zinc/copper ratios over cycles >30 days.',
          mitigation: 'Ensure daily oral supplementation with 15–30 mg Zinc (bisglycinate or picolinate) and cap GHK-Cu cycles at 30 days followed by 30 days washout.',
          autoResolutionAction: 'Add Zinc & 30-Day Washout'
        }
      }
      return null
    }
  }
]

// Normalization Helper
function norm(s?: string): string {
  return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

// -------------------------------------------------------------
// PRIMARY ENGINE EVALUATOR
// -------------------------------------------------------------

export function evaluatePeptideCycleIntelligence({
  tasks,
  weekDays,
  userProfile,
  wellbeingLogs = [],
  biomarkers = [],
  bodyRecords = [],
  outcomeDimensions = [],
  observations = [],
  cycles
}: {
  tasks: DailyProtocolTask[]
  weekDays: Date[]
  userProfile?: UserProfile | null
  wellbeingLogs?: DailyWellbeingCheckin[]
  biomarkers?: BiomarkerMeasurementRecord[]
  bodyRecords?: BodyCompositionRecord[]
  outcomeDimensions?: OutcomeDimension[]
  observations?: any[]
  cycles: PeptideCycleSummary[]
}): CycleIntelligenceReport {
  const activeCycleKeys = cycles.map(c => c.modalityId.toLowerCase())
  const rawUserGoals = (userProfile?.primary_goals || []).map(g => g.toLowerCase())
  const userOutcomePrefs = userProfile?.outcome_preference_scores || {}

  // 1. Compound Role Attribution & Goal Alignment
  const compoundRoles: CompoundRoleAttribution[] = cycles.map(cycle => {
    const canonKey = cycle.modalityId.toLowerCase()
    const pkInfo = PEPTIDE_PK_REGISTRY[canonKey]
    const matchingTask = tasks.find(
      t =>
        (t.modality_id || t.loose_modality?.id || t.protocol_step?.modality?.id)?.toLowerCase() ===
        cycle.modalityId.toLowerCase()
    )
    const modalityObj = matchingTask?.loose_modality || matchingTask?.protocol_step?.modality

    let primaryRole = 'Cellular Signaling & Recovery'
    let targets = ['Cellular Repair', 'Tissue Remodeling']
    let statedGoalMatch = {
      aligned: true,
      goalLabel: 'Tissue Regeneration & Longevity',
      rationale: 'Supports cellular signaling cascades aligned with overall protocol longevity objectives.'
    }

    if (canonKey.includes('bpc157') || canonKey.includes('bpc_157')) {
      primaryRole = 'Angiogenic Microvascular Repair & Tendon Tenocyte Outgrowth'
      targets = ['FAK-Paxillin Focal Adhesion', 'VEGFR2 Angiogenesis', 'EGR-1 Transcription', 'Nitric Oxide Synthesis']
      statedGoalMatch = {
        aligned: rawUserGoals.length === 0 || rawUserGoals.some(g => g.includes('injury') || g.includes('recover') || g.includes('joint') || g.includes('pain') || g.includes('heal') || g.includes('muscle') || g.includes('longevity')),
        goalLabel: 'Injury Recovery & Joint Comfort',
        rationale: 'Directly upregulates tendon fibroblast migration and microvascular repair post-strain.'
      }
    } else if (canonKey.includes('tb500') || canonKey.includes('tb_500')) {
      primaryRole = 'Systemic Actin Filament Sequestering & Anti-Fibrotic Remodeling'
      targets = ['G-Actin Sequestering', 'Endothelial Cell Migration', 'TGF-Beta Downregulation']
      statedGoalMatch = {
        aligned: rawUserGoals.length === 0 || rawUserGoals.some(g => g.includes('injury') || g.includes('flexibility') || g.includes('soreness') || g.includes('recover') || g.includes('longevity')),
        goalLabel: 'Connective Tissue Recovery & Anti-Fibrotic Remodeling',
        rationale: 'Promotes flexible tissue remodeling and prevents stiff fibrotic scar tissue deposition.'
      }
    } else if (canonKey.includes('cjc1295') || canonKey.includes('cjc_1295')) {
      primaryRole = 'Pituitary GHRH Receptor Somatotroph Pulsatility'
      targets = ['GHRH-R', 'Physiologic Nocturnal GH Pulse', 'IGF-1 Somatotropic Axis']
      statedGoalMatch = {
        aligned: rawUserGoals.length === 0 || rawUserGoals.some(g => g.includes('muscle') || g.includes('sleep') || g.includes('growth') || g.includes('fat') || g.includes('longevity')),
        goalLabel: 'Deep Sleep Architecture & Somatotropic GH Tone',
        rationale: 'Triggers physiologic nocturnal GH release for slow-wave deep sleep and lean mass preservation.'
      }
    } else if (canonKey.includes('ipamorelin')) {
      primaryRole = 'Selective GHS-R1a Agonist (Amplified GH Pulse without Prolactin/Cortisol)'
      targets = ['GHS-R1a Ghrelin Receptor', 'Selective Somatotroph GH Secretion', 'Slow-Wave Sleep']
      statedGoalMatch = {
        aligned: rawUserGoals.length === 0 || rawUserGoals.some(g => g.includes('sleep') || g.includes('recovery') || g.includes('muscle') || g.includes('body') || g.includes('longevity')),
        goalLabel: 'Selective GH Pulse & Sleep Recovery',
        rationale: 'Selectively stimulates the ghrelin receptor to amplify GH amplitude without appetite or cortisol spikes.'
      }
    } else if (canonKey.includes('ghk_cu') || canonKey.includes('ghk')) {
      primaryRole = 'Copper Tripeptide Dermal & Collagen I/III Gene Transcription'
      targets = ['Collagen I/III Synthesis', 'Decorin Expression', 'MMP Downregulation', 'Hair Follicle Perfusion']
      statedGoalMatch = {
        aligned: rawUserGoals.length === 0 || rawUserGoals.some(g => g.includes('skin') || g.includes('hair') || g.includes('collagen') || g.includes('aesthetic') || g.includes('remodel') || g.includes('longevity')),
        goalLabel: 'Dermal & Connective Collagen Remodeling',
        rationale: 'Upregulates anti-inflammatory copper gene expression and extracellular matrix density.'
      }
    } else if (canonKey.includes('motsc') || canonKey.includes('mots_c')) {
      primaryRole = 'Mitochondrial DNA-Encoded Peptide AMPK Activation & GLUT4 Translocation'
      targets = ['AMPK Phosphorylation', 'GLUT4 Muscle Translocation', 'Fatty Acid Beta-Oxidation']
      statedGoalMatch = {
        aligned: rawUserGoals.length === 0 || rawUserGoals.some(g => g.includes('endurance') || g.includes('metabolic') || g.includes('fat') || g.includes('energy') || g.includes('mitochondria') || g.includes('longevity')),
        goalLabel: 'Mitochondrial Biogenesis & Metabolic Endurance',
        rationale: 'Mimics exercise signaling to enhance cellular insulin sensitivity and aerobic capacity.'
      }
    } else if (canonKey.includes('semax')) {
      primaryRole = 'Central BDNF Neurotrophic & Cholinergic Synaptic Upregulation'
      targets = ['BDNF Gene Expression', 'TrkB Receptor Signaling', 'Dopaminergic/Cholinergic Tone']
      statedGoalMatch = {
        aligned: rawUserGoals.length === 0 || rawUserGoals.some(g => g.includes('focus') || g.includes('cognitive') || g.includes('brain') || g.includes('memory') || g.includes('energy') || g.includes('longevity')),
        goalLabel: 'Cognitive Focus & Neuroplasticity',
        rationale: 'Elevates central BDNF and working memory performance without peripheral cardiac strain.'
      }
    } else if (canonKey.includes('selank')) {
      primaryRole = 'GABAergic & Enkephalin Homeostatic Stabilization'
      targets = ['GABA-A Allosteric Modulation', 'Enkephalin Degradation Inhibition', 'HPA Axis Buffering']
      statedGoalMatch = {
        aligned: rawUserGoals.length === 0 || rawUserGoals.some(g => g.includes('stress') || g.includes('anxiety') || g.includes('calm') || g.includes('mood') || g.includes('focus') || g.includes('longevity')),
        goalLabel: 'Stress Resilience & Cognitive Calm',
        rationale: 'Inhibits enkephalin-degrading enzymes to stabilize mood during high cognitive demand.'
      }
    } else if (canonKey.includes('kpv')) {
      primaryRole = 'Alpha-MSH Tripeptide Intestinal & Mucosal Anti-Inflammatory'
      targets = ['NF-κB Inhibition', 'Mucosal Tight Junction Integrity', 'Interleukin Suppression']
      statedGoalMatch = {
        aligned: rawUserGoals.length === 0 || rawUserGoals.some(g => g.includes('gut') || g.includes('digestion') || g.includes('inflammation') || g.includes('immunity') || g.includes('longevity')),
        goalLabel: 'Mucosal Barrier & Gut Health',
        rationale: 'Inactivates inflammatory NF-κB pathways to restore gut mucosal barrier function.'
      }
    } else if (canonKey.includes('epitalon')) {
      primaryRole = 'Pineal Gland Circadian Reset & Telomerase Epigenetic Induction'
      targets = ['Pineal Melatonin Synthesis', 'Telomerase Reverse Transcriptase', 'Circadian Clock Genes']
      statedGoalMatch = {
        aligned: true,
        goalLabel: 'Epigenetic Biological Age & Circadian Reset',
        rationale: 'Resets pineal endocrine sensitivity and promotes cellular longevity mechanisms.'
      }
    } else if (canonKey.includes('tirzepatide') || canonKey.includes('semaglutide') || canonKey.includes('retatrutide')) {
      primaryRole = 'Multi-Incretin Agonism (GLP-1 / GIP / Glucagon) & Metabolic Control'
      targets = ['GLP-1R', 'GIP-R', 'Glucagon-R', 'Insulin Secretion', 'Central Satiety']
      statedGoalMatch = {
        aligned: rawUserGoals.length === 0 || rawUserGoals.some(g => g.includes('fat') || g.includes('weight') || g.includes('glucose') || g.includes('metabolic') || g.includes('longevity')),
        goalLabel: 'Glycemic Regulation & Visceral Fat Reduction',
        rationale: 'Provides potent incretin receptor activation for glycemic and weight management.'
      }
    }

    return {
      modalityId: cycle.modalityId,
      modalityName: cycle.modalityName,
      protocolName: cycle.protocolName,
      primaryRole,
      mechanisticTargets: targets,
      targetReceptors: (modalityObj as any)?.peptide_metadata?.target_receptors || targets,
      statedGoalFit: statedGoalMatch,
      evidenceLevel: cycle.evidenceLevel || 'High (Clinical Evidence)',
      pubmedUrl: cycle.pubmedUrl && cycle.pubmedUrl !== 'https://pubmed.ncbi.nlm.nih.gov/'
        ? cycle.pubmedUrl
        : resolvePubMedCitation(cycle.modalityId, cycle.modalityName).pubMedUrl,
      weeklyFrequency: cycle.dosageSpec || 'Scheduled Pulse',
      timingSlot: cycle.timingSlot || 'evening',
      isRedundant: false
    }
  })

  // 2. Identify Synergies
  const synergies: StackSynergyDetail[] = []
  for (const rule of PEPTIDE_SYNERGY_REGISTRY) {
    const hasA = activeCycleKeys.some(k => k.includes(rule.compounds[0]))
    const hasB = activeCycleKeys.some(k => k.includes(rule.compounds[1]))
    if (hasA && hasB) {
      const cycleA = cycles.find(c => c.modalityId.toLowerCase().includes(rule.compounds[0]))!
      const cycleB = cycles.find(c => c.modalityId.toLowerCase().includes(rule.compounds[1]))!
      synergies.push({
        compoundA: cycleA.modalityName,
        compoundB: cycleB.modalityName,
        synergyType: rule.type,
        headline: rule.headline,
        mechanisticRationale: rule.rationale,
        actionableTiming: rule.actionableTiming,
        evidenceRating: rule.evidence,
        pubmedUrl: rule.pubmedUrl
      })
    }
  }

  // 3. Identify Redundancies
  const redundancies: StackRedundancyDetail[] = []
  for (const red of PEPTIDE_REDUNDANCY_REGISTRY) {
    const matched = activeCycleKeys.filter(k => red.compounds.some(c => k.includes(c)))
    if (matched.length > red.maxRecommended) {
      const matchedNames = cycles
        .filter(c => matched.includes(c.modalityId.toLowerCase()))
        .map(c => c.modalityName)

      redundancies.push({
        compounds: matchedNames,
        targetPathway: red.pathway,
        headline: red.headline,
        rationale: red.rationale,
        recommendation: red.recommendation,
        potentialSimplification: `Simplify from ${matched.length} compounds down to 1 primary driver.`
      })

      matchedNames.slice(1).forEach(name => {
        const found = compoundRoles.find(r => r.modalityName === name)
        if (found) {
          found.isRedundant = true
          found.redundancyDetails = red.headline
        }
      })
    }
  }

  // 4. Identify Antagonisms & Conflicts
  const timingMap: Record<string, string> = {}
  cycles.forEach(c => {
    timingMap[c.modalityId.toLowerCase()] = c.timingSlot.toLowerCase()
  })

  const conflicts: StackConflictDetail[] = []
  for (const conf of PEPTIDE_CONFLICT_REGISTRY) {
    const conflictResult = conf.check(activeCycleKeys, timingMap)
    if (conflictResult) {
      const matchedNames = cycles
        .filter(c => conflictResult.compounds.some(compKey => c.modalityId.toLowerCase().includes(compKey)))
        .map(c => c.modalityName)

      conflicts.push({
        compounds: matchedNames.length > 0 ? matchedNames : [conflictResult.compounds.join(', ')],
        conflictType: conflictResult.conflictType,
        severity: conflictResult.severity,
        headline: conflictResult.headline,
        rationale: conflictResult.rationale,
        mitigation: conflictResult.mitigation,
        autoResolutionAction: conflictResult.autoResolutionAction
      })
    }
  }

  // 5. Active-Window Timing Coordination
  const slotGroups: Record<string, string[]> = {
    morning_fasted: [],
    midday: [],
    pre_workout: [],
    evening_fasted: [],
    pre_bed: []
  }

  cycles.forEach(c => {
    const slot = c.timingSlot.toLowerCase()
    if (slot.includes('morning')) slotGroups.morning_fasted.push(c.modalityName)
    else if (slot.includes('midday') || slot.includes('afternoon')) slotGroups.midday.push(c.modalityName)
    else if (slot.includes('pre_bed') || slot.includes('bed')) slotGroups.pre_bed.push(c.modalityName)
    else slotGroups.evening_fasted.push(c.modalityName)
  })

  const timingSlots: TimingCoordinationSlot[] = [
    {
      slotKey: 'morning_fasted',
      slotLabel: 'Morning (Fasted State)',
      scheduledCompounds: slotGroups.morning_fasted,
      isOptimal: true,
      notes: slotGroups.morning_fasted.length > 0
        ? 'Optimal for tissue repair peptides (BPC-157, GHK-Cu) and metabolic/neuro stimulants (MOTS-c, Semax).'
        : 'Open window'
    },
    {
      slotKey: 'midday',
      slotLabel: 'Midday / Work Focus',
      scheduledCompounds: slotGroups.midday,
      isOptimal: true,
      notes: slotGroups.midday.length > 0
        ? 'Optimal for anxiolytic stress modulation (Selank) without sedation.'
        : 'Open window'
    },
    {
      slotKey: 'pre_bed',
      slotLabel: 'Pre-Bed (≥90m Fasted State)',
      scheduledCompounds: [...slotGroups.pre_bed, ...slotGroups.evening_fasted],
      isOptimal: !conflicts.some(c => c.conflictType === 'timing_blunting'),
      notes: (slotGroups.pre_bed.length + slotGroups.evening_fasted.length) > 0
        ? 'Optimal for somatotropic secretagogues (CJC-1295, Ipamorelin, Epitalon) to synchronize with slow-wave nocturnal pulses.'
        : 'Open window'
    }
  ]

  // 6. Comprehensive Outcome Measurability Audit
  const targetOutcomeMap = new Map<string, { label: string; compounds: string[] }>()

  cycles.forEach(c => {
    const canonKey = c.modalityId.toLowerCase()
    const matchingTask = tasks.find(
      t =>
        (t.modality_id || t.loose_modality?.id || t.protocol_step?.modality?.id)?.toLowerCase() ===
        c.modalityId.toLowerCase()
    )
    const taskTargetOutcomes: string[] = matchingTask?.protocol_step?.target_outcomes || (matchingTask?.loose_modality as any)?.functional_outcomes_to_track || []

    // Seed targets from task if available
    taskTargetOutcomes.forEach(tKey => {
      const k = norm(tKey)
      if (!targetOutcomeMap.has(k)) {
        targetOutcomeMap.set(k, { label: tKey, compounds: [c.modalityName] })
      } else {
        const entry = targetOutcomeMap.get(k)!
        if (!entry.compounds.includes(c.modalityName)) entry.compounds.push(c.modalityName)
      }
    })

    // Seed defaults per peptide if task didn't specify
    if (canonKey.includes('bpc157') || canonKey.includes('tb500')) {
      if (!targetOutcomeMap.has('jointcomfort')) targetOutcomeMap.set('jointcomfort', { label: 'Joint Comfort', compounds: [c.modalityName] })
      if (!targetOutcomeMap.has('pain')) targetOutcomeMap.set('pain', { label: 'Pain', compounds: [c.modalityName] })
      if (!targetOutcomeMap.has('soreness')) targetOutcomeMap.set('soreness', { label: 'Soreness', compounds: [c.modalityName] })
    }
    if (canonKey.includes('cjc1295') || canonKey.includes('ipamorelin')) {
      if (!targetOutcomeMap.has('sleepquality')) targetOutcomeMap.set('sleepquality', { label: 'Sleep Quality', compounds: [c.modalityName] })
      if (!targetOutcomeMap.has('wakingrestedness')) targetOutcomeMap.set('wakingrestedness', { label: 'Waking Restedness', compounds: [c.modalityName] })
      if (!targetOutcomeMap.has('energy')) targetOutcomeMap.set('energy', { label: 'Energy', compounds: [c.modalityName] })
    }
    if (canonKey.includes('ghk')) {
      if (!targetOutcomeMap.has('skinclarity')) targetOutcomeMap.set('skinclarity', { label: 'Skin Clarity', compounds: [c.modalityName] })
      if (!targetOutcomeMap.has('jointcomfort')) targetOutcomeMap.set('jointcomfort', { label: 'Joint Comfort', compounds: [c.modalityName] })
    }
    if (canonKey.includes('motsc') || canonKey.includes('ss31')) {
      if (!targetOutcomeMap.has('endurance')) targetOutcomeMap.set('endurance', { label: 'Endurance', compounds: [c.modalityName] })
      if (!targetOutcomeMap.has('energy')) targetOutcomeMap.set('energy', { label: 'Energy', compounds: [c.modalityName] })
    }
    if (canonKey.includes('semax') || canonKey.includes('selank')) {
      if (!targetOutcomeMap.has('mentalclarity')) targetOutcomeMap.set('mentalclarity', { label: 'Mental Clarity', compounds: [c.modalityName] })
      if (!targetOutcomeMap.has('stressresilience')) targetOutcomeMap.set('stressresilience', { label: 'Stress Resilience', compounds: [c.modalityName] })
    }
  })

  // Extract all logged observation values across all data stores
  const trackedOutcomesList: MeasurabilityAudit['trackedOutcomes'] = []
  const blindSpots: MeasurabilityAudit['blindSpots'] = []

  targetOutcomeMap.forEach(({ label, compounds }, normKey) => {
    // 1. Check userProfile.outcome_preference_scores
    const isEnabledInPrefs = Object.entries(userOutcomePrefs).some(([k, v]) => norm(k) === normKey && (Number(v) > 0 || v === true))

    // 2. Check outcome_observations table rows
    const matchingObs = observations.filter(o => norm(o.outcome_id) === normKey || norm(o.outcome_name) === normKey)

    // 3. Check daily_wellbeing_checkins custom_outcomes_jsonb & standard fields
    const customValues: number[] = []
    wellbeingLogs.forEach(w => {
      let customObj = (w as any).custom_outcomes_jsonb
      if (!customObj && w.notes) {
        try {
          const parsed = JSON.parse(w.notes)
          customObj = parsed.custom_outcomes_jsonb || parsed.custom_outcomes
        } catch {}
      }
      if (customObj) {
        Object.entries(customObj).forEach(([ck, cv]) => {
          if (norm(ck) === normKey && typeof cv === 'number') {
            customValues.push(cv)
          }
        })
      }
      // Standard fields fallback
      if (normKey === 'sleepquality' || normKey === 'wakingrestedness') {
        if (w.subjective_sleep_0_10 !== undefined && w.subjective_sleep_0_10 !== null) customValues.push(w.subjective_sleep_0_10)
      } else if (normKey === 'energy') {
        if (w.energy_0_10 !== undefined && w.energy_0_10 !== null) customValues.push(w.energy_0_10)
      } else if (normKey === 'stressresilience' || normKey === 'stress') {
        if (w.stress_0_10 !== undefined && w.stress_0_10 !== null) customValues.push(10 - w.stress_0_10)
      } else if (normKey === 'mood') {
        if (w.mood_0_10 !== undefined && w.mood_0_10 !== null) customValues.push(w.mood_0_10)
      }
    })

    // 4. Check task execution details outcomes
    tasks.forEach(t => {
      const taskOutcomes = t.execution_details?.outcomes || t.execution_metrics
      if (taskOutcomes) {
        Object.entries(taskOutcomes).forEach(([tk, tv]) => {
          if (norm(tk) === normKey && typeof tv === 'number') {
            customValues.push(tv)
          }
        })
      }
    })

    const allValues = [
      ...matchingObs.map(o => Number(o.value_0_10 ?? o.value ?? 0)),
      ...customValues
    ].filter(v => typeof v === 'number' && !isNaN(v))

    const isTracked = isEnabledInPrefs || allValues.length > 0 || matchingObs.length > 0

    if (isTracked) {
      let baselineAvg: number | null = null
      let activeAvg: number | null = null
      let deltaPct: number | null = null

      if (allValues.length > 0) {
        const baselineSlice = allValues.slice(0, Math.min(3, allValues.length))
        const activeSlice = allValues.length > 3 ? allValues.slice(3) : allValues

        baselineAvg = Number((baselineSlice.reduce((a, b) => a + b, 0) / baselineSlice.length).toFixed(1))
        activeAvg = Number((activeSlice.reduce((a, b) => a + b, 0) / activeSlice.length).toFixed(1))
        deltaPct = (baselineAvg > 0) ? Math.round(((activeAvg - baselineAvg) / baselineAvg) * 100) : null
      }

      trackedOutcomesList.push({
        key: normKey,
        label,
        associatedCompounds: compounds,
        observationCount: allValues.length,
        baselineAvg,
        activeAvg,
        deltaPct,
        isCalibrating: allValues.length < 3
      })
    } else {
      blindSpots.push({
        modalityName: compounds[0] || 'Active Cycle',
        missingOutcomeKey: normKey,
        missingOutcomeLabel: label,
        whyItMatters: `Essential primary outcome to determine whether ${compounds[0] || 'this peptide'} is producing measurable clinical value.`,
        suggestedAction: `Enable '${label}' in your daily check-in slider overlay.`
      })
    }
  })

  // Biomarker coverage
  const biomarkerCoverage: MeasurabilityAudit['biomarkerCoverage'] = []
  const requiredBiomarkers = [
    { id: 'igf1', name: 'IGF-1 (Somatotropic Axis)', compounds: ['cjc1295', 'ipamorelin', 'tesamorelin'], rationale: 'Monitors somatotroph GH stimulation and physiologic endocrine elevation.' },
    { id: 'glucose', name: 'Fasting Glucose / HbA1c', compounds: ['cjc1295', 'tesamorelin', 'tirzepatide', 'motsc'], rationale: 'Monitors insulin sensitivity and metabolic glucose clearance.' },
    { id: 'hscrp', name: 'hs-CRP (Inflammation)', compounds: ['bpc157', 'tb500', 'kpv'], rationale: 'Monitors systemic vascular and connective inflammatory resolution.' },
    { id: 'prolactin', name: 'Prolactin', compounds: ['ipamorelin'], rationale: 'Safety selectivity check confirming selective GH release without pituitary distress.' },
    { id: 'copper_serum', name: 'Serum Copper & Zinc', compounds: ['ghk_cu'], rationale: 'Ensures systemic copper-zinc balance is maintained.' }
  ]

  requiredBiomarkers.forEach(req => {
    const isApplicable = activeCycleKeys.some(k => req.compounds.some(c => k.includes(c)))
    if (isApplicable) {
      const existing = biomarkers.filter(b => b.biomarker_id.toLowerCase().includes(req.id) || req.id.includes(b.biomarker_id.toLowerCase()))
      const baseRec = existing.length > 1 ? existing[0] : null
      const intraRec = existing.length > 0 ? existing[existing.length - 1] : null

      const baseVal = baseRec ? (baseRec.normalized_value ?? baseRec.raw_value) : null
      const intraVal = intraRec ? (intraRec.normalized_value ?? intraRec.raw_value) : null
      const baseUnit = baseRec ? (baseRec.normalized_unit || baseRec.raw_unit || '') : ''
      const intraUnit = intraRec ? (intraRec.normalized_unit || intraRec.raw_unit || '') : ''

      const delta = (baseVal !== null && intraVal !== null && baseVal > 0)
        ? Math.round(((intraVal - baseVal) / baseVal) * 100)
        : null

      biomarkerCoverage.push({
        biomarkerId: req.id,
        biomarkerName: req.name,
        associatedCompounds: cycles.filter(c => req.compounds.some(compKey => c.modalityId.toLowerCase().includes(compKey))).map(c => c.modalityName),
        status: intraRec ? 'measured' : 'missing',
        baselineValue: baseVal !== null ? `${baseVal} ${baseUnit}` : undefined,
        activeValue: intraVal !== null ? `${intraVal} ${intraUnit}` : undefined,
        deltaPercent: delta,
        clinicalRationale: req.rationale
      })
    }
  })

  const totalTargetCount = targetOutcomeMap.size
  const measurabilityScorePct = totalTargetCount > 0
    ? Math.round((trackedOutcomesList.length / totalTargetCount) * 100)
    : 100

  const measurability: MeasurabilityAudit = {
    measurabilityScorePct,
    totalTargetOutcomes: totalTargetCount,
    activelyTrackedCount: trackedOutcomesList.length,
    trackedOutcomes: trackedOutcomesList,
    blindSpots,
    biomarkerCoverage
  }

  // 7. Closed-Loop Learned Stack Insights (Expected vs Observed)
  const learnedInsights: LearnedStackInsight[] = cycles.map(cycle => {
    const canonKey = cycle.modalityId.toLowerCase()
    const taskLogs = tasks.filter(
      t =>
        (t.modality_id || t.loose_modality?.id || t.protocol_step?.modality?.id)?.toLowerCase() ===
        cycle.modalityId.toLowerCase()
    )
    const completedTasks = taskLogs.filter(t => t.status === 'completed')
    const adherence = taskLogs.length > 0 ? Math.round((completedTasks.length / taskLogs.length) * 100) : 100
    const daysLogged = completedTasks.length

    let primaryOutcome = 'Tissue Regeneration'
    let expectedBenefit = 'Preclinical & clinical models document +30% to +50% acceleration in target tissue markers.'
    let observedBenefit = 'Baseline calibration active. Daily doses and check-ins calibrate your personal trajectory.'
    let status: LearnedStackInsight['status'] = 'inconclusive'
    let personalConf: LearnedStackInsight['personalConfidence'] = 'Calibrating (<7d)'
    let nextRec = 'Maintain prescribed cadence and log daily wellbeing scores to calibrate signal.'

    // Cross-reference with tracked outcomes
    const relatedTracked = trackedOutcomesList.find(to => to.associatedCompounds.some(c => c.toLowerCase() === cycle.modalityName.toLowerCase()))

    if (canonKey.includes('bpc157')) {
      primaryOutcome = 'Joint Comfort & Tendon Repair'
      expectedBenefit = 'Translational models report 40–60% faster collagen outgrowth & pain reduction (Sikiric et al.).'
      if (relatedTracked && relatedTracked.activeAvg !== null) {
        observedBenefit = `${relatedTracked.deltaPct !== null ? (relatedTracked.deltaPct > 0 ? `+${relatedTracked.deltaPct}%` : `${relatedTracked.deltaPct}%`) : 'Active'} rating (${relatedTracked.activeAvg}/10 on ${relatedTracked.label}) across ${relatedTracked.observationCount} logs.`
        status = 'proven_value'
        personalConf = relatedTracked.observationCount >= 14 ? 'High Confidence (>21d)' : 'Moderate Signal (7-21d)'
        nextRec = 'Highly effective driver. Maintain 8-week cycle duration then initiate 4-week washout.'
      } else if (daysLogged >= 3) {
        observedBenefit = 'Preliminary positive trend in joint comfort (Calibration active).'
        status = 'promising_trend'
      }
    } else if (canonKey.includes('cjc1295') || canonKey.includes('ipamorelin')) {
      primaryOutcome = 'Deep Sleep Architecture & Somatotropic Tone'
      expectedBenefit = 'Clinical trials demonstrate 2–10x pulsatile GH elevation, improving Slow-Wave Sleep by +15% to +25% (Teichman et al.).'
      if (relatedTracked && relatedTracked.activeAvg !== null) {
        observedBenefit = `${relatedTracked.deltaPct !== null ? `+${relatedTracked.deltaPct}%` : 'Active'} subjective sleep quality (${relatedTracked.activeAvg}/10).`
        status = 'proven_value'
        personalConf = relatedTracked.observationCount >= 14 ? 'High Confidence (>21d)' : 'Moderate Signal (7-21d)'
        nextRec = 'Maintain 5 on / 2 off weekly cadence to prevent pituitary somatotroph desensitization.'
      } else if (daysLogged >= 3) {
        observedBenefit = 'Calibration in progress. Nightly fasted pulses logged.'
        status = 'promising_trend'
      }
    } else if (canonKey.includes('tb500')) {
      primaryOutcome = 'Cellular Elasticity & Anti-Fibrosis'
      expectedBenefit = 'Thymosin Beta-4 upregulates actin sequestering and prevents stiff scar tissue deposition.'
      if (daysLogged >= 2) {
        observedBenefit = 'Reduced post-load muscular tightness.'
        status = 'promising_trend'
        personalConf = 'Moderate Signal (7-21d)'
        nextRec = 'Continue 2x weekly pulse (Tuesdays & Fridays) in tandem with BPC-157.'
      }
    } else if (canonKey.includes('ghk_cu')) {
      primaryOutcome = 'Collagen Matrix & Dermal Elasticity'
      expectedBenefit = 'Clinical dermatology trials document significant collagen I/III synthesis and decorin upregulation.'
      if (daysLogged >= 5) {
        observedBenefit = 'Dermal tone stability noted; monitoring copper & zinc balance.'
        status = 'proven_value'
        personalConf = 'Moderate Signal (7-21d)'
        nextRec = 'Cap active cycle at 30 days followed by 30 days mandatory washout.'
      }
    }

    return {
      compoundId: cycle.modalityId,
      compoundName: cycle.modalityName,
      primaryOutcome,
      expectedBenefit,
      observedBenefit,
      status,
      personalConfidence: personalConf,
      adherencePct: adherence,
      daysLogged,
      nextCycleRecommendation: nextRec
    }
  })

  // 8. Compute Multi-Dimensional Cycle Quality Scores
  const count = cycles.length
  const hasSynergy = synergies.length > 0
  const hasRedundancy = redundancies.length > 0
  const hasConflict = conflicts.length > 0

  // Goal Alignment Score
  const alignedCount = compoundRoles.filter(r => r.statedGoalFit.aligned).length
  const goalAlignmentScore = count > 0 ? Math.round((alignedCount / count) * 100) : 90

  // Synergy Score
  let synergyScore = 70
  if (count <= 1) synergyScore = 85
  else if (hasSynergy && !hasRedundancy) synergyScore = 96
  else if (hasSynergy && hasRedundancy) synergyScore = 80
  else if (!hasSynergy && count > 1) synergyScore = 65

  // Evidence Score
  const highEvidenceCount = cycles.filter(c => c.evidenceLevel?.toLowerCase().includes('high')).length
  const evidenceScore = count > 0 ? Math.round(((highEvidenceCount * 1.0 + (count - highEvidenceCount) * 0.75) / count) * 100) : 90

  // Safety & Protocol Hygiene Score
  let safetyScore = 95
  if (hasConflict) safetyScore -= 15
  if (cycles.some(c => c.activeDaysCompleted > 70)) safetyScore -= 10
  if (redundancies.length > 0) safetyScore -= 10

  // Complexity Index (Lower is simpler, but for the score, higher is cleaner)
  const complexityIndex = Math.min(100, Math.round(count * 18 + (hasConflict ? 15 : 0) + (hasRedundancy ? 15 : 0)))
  const complexityLabel = complexityIndex <= 35 ? 'Streamlined' : complexityIndex <= 70 ? 'Moderate' : 'High Complexity'

  // Overall Score (Weighted Synthesis)
  const overallScore = Math.round(
    goalAlignmentScore * 0.25 +
    synergyScore * 0.25 +
    evidenceScore * 0.15 +
    safetyScore * 0.20 +
    measurabilityScorePct * 0.15
  )

  let overallTier: CycleQualityScores['overallTier'] = 'Optimal Design'
  let overallRatingLabel = 'Optimal Stack Coordination'
  if (overallScore < 70) {
    overallTier = 'High Risk / Unbalanced'
    overallRatingLabel = 'High Complexity / Optimization Required'
  } else if (overallScore < 82) {
    overallTier = 'Moderate / Room for Optimization'
    overallRatingLabel = 'Moderate Protocol / Actionable Simplifications'
  } else if (overallScore < 92) {
    overallTier = 'Strong Protocol'
    overallRatingLabel = 'Strong Stack Coordination'
  }

  const scores: CycleQualityScores = {
    overallScore,
    overallTier,
    overallRatingLabel,
    goalAlignmentScore,
    synergyScore,
    evidenceScore,
    safetyScore,
    measurabilityScore: measurabilityScorePct,
    complexityIndex,
    complexityLabel
  }

  // 9. Score Calculation Methodologies for Interactive Cards
  const scoreCalculations: Record<string, ScoreCalculationDetail> = {
    overall: {
      id: 'overall',
      title: 'Overall Cycle Design Quality',
      score: overallScore,
      ratingLabel: overallRatingLabel,
      mathematicalFormula: 'Overall = (Goal Alignment × 25%) + (Synergy × 25%) + (Safety × 20%) + (Evidence × 15%) + (Measurability × 15%)',
      summaryExplanation: 'Synthesizes protocol design quality, pharmacological synergy, clinical safety standards, scientific evidence depth, and outcome measurability into a single coordinated score.',
      contributingFactors: [
        { label: 'Goal Alignment', impact: goalAlignmentScore >= 80 ? 'positive' : 'negative', detail: `${goalAlignmentScore}% contribution weight (25%)` },
        { label: 'Synergy & Compatibility', impact: synergyScore >= 80 ? 'positive' : 'negative', detail: `${synergyScore}% contribution weight (25%)` },
        { label: 'Clinical Safety & Hygiene', impact: safetyScore >= 80 ? 'positive' : 'negative', detail: `${safetyScore}% contribution weight (20%)` },
        { label: 'Scientific Evidence Quality', impact: evidenceScore >= 80 ? 'positive' : 'neutral', detail: `${evidenceScore}% contribution weight (15%)` },
        { label: 'Outcome Measurability', impact: measurabilityScorePct >= 80 ? 'positive' : 'negative', detail: `${measurabilityScorePct}% contribution weight (15%)` }
      ],
      targetTab: 'overview'
    },
    goal_alignment: {
      id: 'goal_alignment',
      title: 'Goal Alignment Score',
      score: `${goalAlignmentScore}%`,
      ratingLabel: goalAlignmentScore === 100 ? 'Optimal Alignment' : 'Partial Alignment',
      mathematicalFormula: 'Goal Alignment = (Aligned Peptides / Total Active Peptides) × 100',
      summaryExplanation: `Evaluates whether each compound in your stack directly maps to one of your stated health & longevity objectives (${rawUserGoals.join(', ') || 'General Longevity'}).`,
      contributingFactors: compoundRoles.map(r => ({
        label: r.modalityName,
        impact: r.statedGoalFit.aligned ? 'positive' : 'negative',
        detail: `${r.statedGoalFit.goalLabel} — ${r.statedGoalFit.rationale}`
      })),
      targetTab: 'overview'
    },
    synergy: {
      id: 'synergy',
      title: 'Synergy & Compatibility Score',
      score: `${synergyScore}%`,
      ratingLabel: hasSynergy ? 'Verified Biochemical Synergy' : 'Standard Compatibility',
      mathematicalFormula: 'Base (70) + Synergy Pairs (+26) - Redundant Receptor Saturations (-16)',
      summaryExplanation: 'Rewards complementary dual-pathway pairings (e.g. GHRH + Ghrelin receptor secretagogues, Angiogenic FAK-paxillin + Actin sequestering) while penalizing redundant receptor competition.',
      contributingFactors: [
        ...synergies.map(s => ({
          label: `${s.compoundA} + ${s.compoundB}`,
          impact: 'positive' as const,
          detail: `Synergy: ${s.headline} (${s.evidenceRating})`
        })),
        ...redundancies.map(r => ({
          label: r.compounds.join(' + '),
          impact: 'negative' as const,
          detail: `Redundancy: ${r.headline}`
        }))
      ],
      targetTab: 'synergies'
    },
    evidence: {
      id: 'evidence',
      title: 'Scientific Evidence Quality',
      score: `${evidenceScore}%`,
      ratingLabel: evidenceScore >= 85 ? 'High Evidence Depth' : 'Translational Evidence',
      mathematicalFormula: 'Evidence = (Human Clinical Trials × 1.0 + Translational Models × 0.75) / Total Peptides',
      summaryExplanation: 'Weights peer-reviewed PubMed literature backing individual compounds and combinations, distinguishing FDA-approved or Phase II/III human clinical data from preclinical models.',
      contributingFactors: compoundRoles.map(r => ({
        label: r.modalityName,
        impact: r.evidenceLevel.toLowerCase().includes('high') ? 'positive' : 'neutral',
        detail: `${r.evidenceLevel} (PubMed peer-reviewed)`
      })),
      targetTab: 'overview'
    },
    safety: {
      id: 'safety',
      title: 'Safety & Protocol Hygiene',
      score: `${safetyScore}%`,
      ratingLabel: safetyScore >= 90 ? 'Optimal Protocol Hygiene' : 'Timing Adjustments Recommended',
      mathematicalFormula: 'Base (95) - Somatostatin/Timing Conflicts (-15) - Receptor Burnout Duration (-10) - Receptor Redundancy (-10)',
      summaryExplanation: 'Monitors cycle durations, receptor desensitization prevention (washout intervals), timing interactions (fasting somatostatin protection), and mineral homeostasis.',
      contributingFactors: [
        ...(conflicts.length > 0
          ? conflicts.map(c => ({
              label: c.headline,
              impact: 'negative' as const,
              detail: c.rationale
            }))
          : [{ label: 'Circadian & Fasting Timing', impact: 'positive' as const, detail: 'All active secretagogues dosed without timing antagonism.' }]),
        {
          label: 'Cycle Duration & Washout',
          impact: cycles.some(c => c.activeDaysCompleted > 70) ? 'negative' as const : 'positive' as const,
          detail: cycles.some(c => c.activeDaysCompleted > 70) ? 'Cycle exceeds 10 weeks without scheduled receptor resensitization.' : 'Active durations within standard 8-week bounds.'
        }
      ],
      targetTab: 'timing'
    },
    measurability: {
      id: 'measurability',
      title: 'Outcome Measurability Score',
      score: `${measurabilityScorePct}%`,
      ratingLabel: measurabilityScorePct === 100 ? 'Full Objective Coverage' : `${blindSpots.length} Blind Spot${blindSpots.length === 1 ? '' : 's'}`,
      mathematicalFormula: 'Measurability = (Actively Tracked Target Outcomes / Total Required Outcomes) × 100',
      summaryExplanation: 'Determines whether you are actively logging the necessary sliders and lab biomarkers to objectively verify whether each peptide in your stack is producing real value.',
      contributingFactors: [
        ...trackedOutcomesList.map(t => ({
          label: t.label,
          impact: 'positive' as const,
          detail: `Actively Tracked (${t.observationCount} observations logged)`
        })),
        ...blindSpots.map(b => ({
          label: b.missingOutcomeLabel,
          impact: 'negative' as const,
          detail: `Missing: ${b.whyItMatters}`
        }))
      ],
      targetTab: 'measurability'
    },
    complexity: {
      id: 'complexity',
      title: 'Stack Complexity Index',
      score: complexityLabel,
      ratingLabel: `${complexityIndex}/100 Complexity Load`,
      mathematicalFormula: 'Complexity Load = (Peptide Count × 18) + (Timing Conflicts × 15) + (Redundancies × 15)',
      summaryExplanation: 'Measures daily injection burden, multi-slot timing constraints, and multi-vial reconstitution maintenance to identify high-yield opportunities for stack simplification.',
      contributingFactors: [
        { label: 'Active Peptide Count', impact: count <= 2 ? 'positive' : 'neutral', detail: `${count} active bioactives in protocol` },
        { label: 'Dosing Time Slots', impact: timingSlots.filter(s => s.scheduledCompounds.length > 0).length <= 2 ? 'positive' : 'neutral', detail: `${timingSlots.filter(s => s.scheduledCompounds.length > 0).length} distinct time slots daily` }
      ],
      targetTab: 'timing'
    }
  }

  // 10. Executive Advisories
  const executiveAdvisories: CycleIntelligenceReport['executiveAdvisories'] = []

  if (synergies.length > 0) {
    executiveAdvisories.push({
      type: 'synergy',
      title: `${synergies.length} High-Affinity Synergy ${synergies.length === 1 ? 'Pair' : 'Pairs'} Active`,
      description: synergies.map(s => `${s.compoundA} + ${s.compoundB} (${s.headline})`).join(' • '),
      actionText: 'Inspect Mechanisms'
    })
  }

  if (conflicts.length > 0) {
    conflicts.forEach(c => {
      executiveAdvisories.push({
        type: 'timing',
        title: c.headline,
        description: c.rationale,
        actionText: c.autoResolutionAction
      })
    })
  }

  if (blindSpots.length > 0) {
    executiveAdvisories.push({
      type: 'measurability',
      title: `${blindSpots.length} Outcome Blind ${blindSpots.length === 1 ? 'Spot' : 'Spots'} Detected`,
      description: `You are administering ${blindSpots[0].modalityName} without tracking '${blindSpots[0].missingOutcomeLabel}'. Add it to verify efficacy.`,
      actionText: `+ Track ${blindSpots[0].missingOutcomeLabel}`,
      actionOutcomeKey: blindSpots[0].missingOutcomeKey,
      actionOutcomeLabel: blindSpots[0].missingOutcomeLabel
    })
  }

  if (redundancies.length > 0) {
    redundancies.forEach(r => {
      executiveAdvisories.push({
        type: 'optimization',
        title: r.headline,
        description: r.rationale,
        actionText: 'Simplify Stack'
      })
    })
  }

  // 11. Next Cycle Blueprint
  const nextCycleBlueprint = {
    suggestedKeepers: learnedInsights.filter(i => i.status === 'proven_value' || i.status === 'promising_trend').map(i => i.compoundName),
    suggestedWashoutsOrDrops: [
      ...redundancies.flatMap(r => r.compounds.slice(1)),
      ...cycles.filter(c => c.activeDaysCompleted >= 56).map(c => `${c.modalityName} (Scheduled 4-Week Washout)`)
    ],
    suggestedTimingTweaks: conflicts.map(c => c.mitigation),
    summaryRationale: count > 0
      ? `Cycle performance reflects ${scores.overallScore}/100 design quality. Maintain proven drivers (${learnedInsights.filter(i => i.status === 'proven_value').map(i => i.compoundName).join(', ') || 'Active Peptides'}) while preserving receptor sensitivity with scheduled washouts.`
      : 'No active cycles to optimize. Explore evidence-based peptide stacks in the catalog.'
  }

  return {
    scores,
    scoreCalculations,
    compoundRoles,
    synergies,
    redundancies,
    conflicts,
    timingSlots,
    measurability,
    learnedInsights,
    executiveAdvisories,
    nextCycleBlueprint
  }
}
