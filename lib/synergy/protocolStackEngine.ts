/**
 * Protocol Stacking Engine
 * 
 * Computes multi-protocol biometric coverage envelopes across:
 * - 8 Longevity Vectors
 * - 12 Hallmarks of Aging
 * 
 * Handles multi-protocol stacking (2, 3, or more protocols), gap-fill analysis,
 * discovery of complementary protocols, and chronobiological clash harmonization.
 */

import { Protocol, ProtocolStep, Modality } from '@/lib/types'
import {
  ProtocolFingerprint,
  ProtocolVectorScores,
  ProtocolHallmarkScores,
  LONGEVITY_VECTOR_AXES,
  HALLMARK_OF_AGING_AXES,
  getProtocolFingerprint
} from '@/lib/data/protocolFingerprints'
import { detectAntagonisticClashes, AntagonisticClash } from '@/lib/outcomes/outcomeOptimizationEngine'

export type RadarMode = 'vectors' | 'hallmarks'

export interface GapFillMetric {
  axisId: string
  label: string
  singleBestScore: number
  stackedScore: number
  delta: number
  contributingProtocolName: string
}

export interface HarmonizedScheduleItem {
  id: string
  protocolId: string
  protocolName: string
  modalityName: string
  timingSlot: string
  actionNotes?: string
  isClashShifted?: boolean
  clashResolutionNote?: string
}

export interface HarmonizedScheduleBlock {
  blockId: 'morning' | 'midday' | 'evening' | 'night' | 'flexible'
  blockTitle: string
  items: HarmonizedScheduleItem[]
}

export interface StackedProtocolsAnalysis {
  protocols: ProtocolFingerprint[]
  rawProtocols: any[]
  mode: RadarMode
  axes: { id: string; label: string; shortLabel: string }[]
  stackedScores: Record<string, number>
  individualScores: Record<string, Record<string, number>>
  gapFills: GapFillMetric[]
  totalCoveragePct: number
  singleBestCoveragePct: number
  coverageExpansionPct: number
  clashes: AntagonisticClash[]
  scheduleBlocks: HarmonizedScheduleBlock[]
  zeroClashesVerified: boolean
}

export interface ComplementaryProtocolRecommendation {
  protocol: any
  fingerprint: ProtocolFingerprint
  gapGainPoints: number
  coverageJumpPct: number
  topFilledGaps: string[]
  clashesWithStackCount: number
  synergyHighlights: string
}

// -----------------------------------------------------------------------------
// 1. CALCULATE STACKED PROTOCOLS COVERAGE
// -----------------------------------------------------------------------------

export function calculateStackedProtocolsCoverage(
  protocolsList: any[],
  mode: RadarMode = 'vectors'
): StackedProtocolsAnalysis {
  const fingerprints = protocolsList.map(p => getProtocolFingerprint(p))
  const axes = mode === 'vectors' ? LONGEVITY_VECTOR_AXES : HALLMARK_OF_AGING_AXES

  const stackedScores: Record<string, number> = {}
  const individualScores: Record<string, Record<string, number>> = {}

  // Initialize individual scores
  fingerprints.forEach(fp => {
    individualScores[fp.id] = {}
    axes.forEach(axis => {
      const score = mode === 'vectors'
        ? (fp.vectors as any)[axis.id] || 0
        : (fp.hallmarks as any)[axis.id] || 0
      individualScores[fp.id][axis.id] = score
    })
  })

  // Compute maximal stacked envelope with cross-protocol synergy amplification
  const gapFills: GapFillMetric[] = []

  axes.forEach(axis => {
    let maxScore = 0
    let bestProtoName = ''

    fingerprints.forEach(fp => {
      const s = individualScores[fp.id]?.[axis.id] || 0
      if (s > maxScore) {
        maxScore = s
        bestProtoName = fp.name
      }
    })

    // Cross-protocol synergy bonus (+2 to +5 pts if 2+ protocols both target this axis at >=70)
    let synergyBonus = 0
    const highContributors = fingerprints.filter(fp => (individualScores[fp.id]?.[axis.id] || 0) >= 70)
    if (highContributors.length >= 2) {
      synergyBonus = Math.min(5, highContributors.length * 2)
    }

    const finalStackedScore = Math.min(100, maxScore + synergyBonus)
    stackedScores[axis.id] = finalStackedScore

    // Find baseline: what would the single "primary" protocol have had?
    // Baseline is the first protocol's score (or average single score if multi)
    const primaryScore = fingerprints.length > 0 ? (individualScores[fingerprints[0].id]?.[axis.id] || 0) : 0
    const delta = finalStackedScore - primaryScore

    if (delta > 0) {
      gapFills.push({
        axisId: axis.id,
        label: axis.label,
        singleBestScore: primaryScore,
        stackedScore: finalStackedScore,
        delta,
        contributingProtocolName: bestProtoName
      })
    }
  })

  // Sort gap fills by biggest point improvement
  gapFills.sort((a, b) => b.delta - a.delta)

  // Systemic Coverage Calculations
  const numAxes = axes.length
  const totalPoints = Object.values(stackedScores).reduce((acc, s) => acc + s, 0)
  const totalCoveragePct = Math.round((totalPoints / (numAxes * 100)) * 100)

  // Single best protocol coverage
  let singleBestCoveragePct = 0
  fingerprints.forEach(fp => {
    const pPoints = Object.values(individualScores[fp.id] || {}).reduce((acc, s) => acc + s, 0)
    const pPct = Math.round((pPoints / (numAxes * 100)) * 100)
    if (pPct > singleBestCoveragePct) {
      singleBestCoveragePct = pPct
    }
  })

  const coverageExpansionPct = Math.max(0, totalCoveragePct - singleBestCoveragePct)

  // Clash detection across constituent modalities
  const allModalities: Modality[] = []
  const allTasks: any[] = []

  protocolsList.forEach(proto => {
    const steps: ProtocolStep[] = proto.steps || proto.protocol_steps || []
    steps.forEach((step, idx) => {
      const modName = step.notes || step.modality_id || (step as any).name || `Modality ${idx}`
      const mId = step.modality_id || `mod_${proto.id}_${idx}`
      allModalities.push({
        id: mId,
        name: modName,
        display_name: modName,
        slug: mId,
        category: (proto.categories?.[0] as any) || 'supplements',
        timing_slot: step.timing_slot || 'morning'
      } as unknown as Modality)

      allTasks.push({
        id: `task_${proto.id}_${idx}`,
        modality_id: mId,
        timing_slot: step.timing_slot || 'morning',
        status: 'pending'
      })
    })
  })

  const clashes = detectAntagonisticClashes(allModalities, allTasks)
  const scheduleBlocks = harmonizeScheduleBlocks(protocolsList, clashes)

  return {
    protocols: fingerprints,
    rawProtocols: protocolsList,
    mode,
    axes: axes.map(a => ({ id: a.id, label: a.label, shortLabel: a.shortLabel })),
    stackedScores,
    individualScores,
    gapFills,
    totalCoveragePct,
    singleBestCoveragePct,
    coverageExpansionPct,
    clashes,
    scheduleBlocks,
    zeroClashesVerified: clashes.length === 0
  }
}

// -----------------------------------------------------------------------------
// 2. FIND TOP COMPLEMENTARY PROTOCOLS
// -----------------------------------------------------------------------------

export function findTopComplementaryProtocols(
  currentProtocols: any[],
  allProtocols: any[],
  mode: RadarMode = 'vectors',
  limit: number = 3
): ComplementaryProtocolRecommendation[] {
  if (!allProtocols || allProtocols.length === 0) return []

  // Current stack coverage
  const currentAnalysis = calculateStackedProtocolsCoverage(currentProtocols, mode)
  const currentStackIds = new Set(currentProtocols.map(p => p.id || p.name?.toLowerCase()))

  const candidateRecommendations: ComplementaryProtocolRecommendation[] = []

  allProtocols.forEach(candidate => {
    const cId = candidate.id || candidate.name?.toLowerCase()
    if (currentStackIds.has(cId)) return // Skip already stacked

    const fp = getProtocolFingerprint(candidate)
    const axes = mode === 'vectors' ? LONGEVITY_VECTOR_AXES : HALLMARK_OF_AGING_AXES

    let gapGainPoints = 0
    const filledGaps: { label: string; gain: number }[] = []

    axes.forEach(axis => {
      const candidateScore = mode === 'vectors'
        ? (fp.vectors as any)[axis.id] || 0
        : (fp.hallmarks as any)[axis.id] || 0

      const currentScore = currentAnalysis.stackedScores[axis.id] || 0
      const gain = Math.max(0, candidateScore - currentScore)

      if (gain > 0) {
        gapGainPoints += gain
        filledGaps.push({ label: axis.label, gain })
      }
    })

    // Sort filled gaps descending
    filledGaps.sort((a, b) => b.gain - a.gain)
    const topFilledGaps = filledGaps.slice(0, 3).map(g => `+${g.gain} pts ${g.label}`)

    // Check potential clash count
    const simulatedStack = [...currentProtocols, candidate]
    const simAnalysis = calculateStackedProtocolsCoverage(simulatedStack, mode)
    const coverageJumpPct = Math.max(0, simAnalysis.totalCoveragePct - currentAnalysis.totalCoveragePct)

    candidateRecommendations.push({
      protocol: candidate,
      fingerprint: fp,
      gapGainPoints,
      coverageJumpPct,
      topFilledGaps,
      clashesWithStackCount: simAnalysis.clashes.length,
      synergyHighlights: fp.synergyNotes
    })
  })

  // Rank by highest gap gain, with bonus for zero clashes
  candidateRecommendations.sort((a, b) => {
    const scoreA = a.gapGainPoints - (a.clashesWithStackCount * 15)
    const scoreB = b.gapGainPoints - (b.clashesWithStackCount * 15)
    return scoreB - scoreA
  })

  return candidateRecommendations.slice(0, limit)
}

// -----------------------------------------------------------------------------
// 3. SCHEDULE HARMONIZATION & CLASH RESOLUTION
// -----------------------------------------------------------------------------

function harmonizeScheduleBlocks(
  protocolsList: any[],
  clashes: AntagonisticClash[]
): HarmonizedScheduleBlock[] {
  const blocks: Record<'morning' | 'midday' | 'evening' | 'night' | 'flexible', HarmonizedScheduleItem[]> = {
    morning: [],
    midday: [],
    evening: [],
    night: [],
    flexible: []
  }

  const clashModalityIds = new Set(clashes.flatMap(c => [c.modalityA.id.toLowerCase(), c.modalityB.id.toLowerCase()]))

  protocolsList.forEach(proto => {
    const steps: ProtocolStep[] = proto.steps || proto.protocol_steps || []
    steps.forEach((step, idx) => {
      const modName = step.notes || step.modality_id || (step as any).name || `Protocol Modality ${idx + 1}`
      const rawSlot = (step.timing_slot || step.stack_group || 'morning').toLowerCase()
      const mId = (step.modality_id || modName).toLowerCase()

      let targetBlock: 'morning' | 'midday' | 'evening' | 'night' | 'flexible' = 'flexible'
      if (rawSlot.includes('wake') || rawSlot.includes('morning') || rawSlot.includes('breakfast')) {
        targetBlock = 'morning'
      } else if (rawSlot.includes('midday') || rawSlot.includes('afternoon') || rawSlot.includes('workout') || rawSlot.includes('lunch')) {
        targetBlock = 'midday'
      } else if (rawSlot.includes('evening') || rawSlot.includes('dinner') || rawSlot.includes('wind_down')) {
        targetBlock = 'evening'
      } else if (rawSlot.includes('bed') || rawSlot.includes('sleep') || rawSlot.includes('night')) {
        targetBlock = 'night'
      }

      // Check if this step is involved in a clash
      const isClash = Array.from(clashModalityIds).some(cid => mId.includes(cid))
      let resolutionNote: string | undefined

      if (isClash) {
        const matchingClash = clashes.find(c => 
          mId.includes(c.modalityA.id.toLowerCase()) || mId.includes(c.modalityB.id.toLowerCase())
        )
        if (matchingClash) {
          resolutionNote = matchingClash.recommendedFix
        }
      }

      blocks[targetBlock].push({
        id: `${proto.id}_step_${idx}`,
        protocolId: proto.id,
        protocolName: proto.name,
        modalityName: modName,
        timingSlot: step.timing_slot || targetBlock,
        actionNotes: step.notes,
        isClashShifted: isClash,
        clashResolutionNote: resolutionNote
      })
    })
  })

  const allBlocks: HarmonizedScheduleBlock[] = [
    { blockId: 'morning', blockTitle: 'Sunrise & Morning Protocol Stack', items: blocks.morning },
    { blockId: 'midday', blockTitle: 'Midday & Performance Block', items: blocks.midday },
    { blockId: 'evening', blockTitle: 'Evening & Dinner Nutrition Block', items: blocks.evening },
    { blockId: 'night', blockTitle: 'Nocturnal Somatotropin & Sleep Restoration', items: blocks.night },
    { blockId: 'flexible', blockTitle: 'Flexible & Weekly Cadence Steps', items: blocks.flexible }
  ]

  return allBlocks.filter(b => b.items.length > 0)
}
