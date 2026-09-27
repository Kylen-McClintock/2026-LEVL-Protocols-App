/**
 * Evidence Quality & Clinical Evidence Formatting Utility
 * 
 * Standardizes evidence scoring across LEVL protocols.
 * Distinguishes between 0–100 clinical evidence scores (e.g. 96/100 Grade A)
 * and legacy 1–5 star ratings, ensuring no confusing "96/5" formatting.
 */

export interface EvidenceQualityDetail {
  /** Normalized score strictly between 0 and 100 */
  score: number
  /** Formatted string like "96 / 100" */
  displayScore: string
  /** Formatted badge string like "96/100" */
  compactScore: string
  /** Full clinical evidence grade string like "Grade A (Human RCT)" */
  grade: string
  /** Short grade code like "Grade A" */
  shortGrade: string
  /** 3-tier clinical role */
  tier: 'Tier-1 Anchor' | 'Tier-2 Synergist' | 'Tier-3 Marginal'
  /** Summary description of this evidence tier */
  description: string
  /** Key clinical criteria for this evidence tier */
  criteria: string[]
  /** Color tokens for badges */
  badgeColorDark: string
  badgeColorLight: string
  pillColor: string
}

/**
 * Normalizes any raw evidence_quality value (number 1..100, undefined, or string)
 * into a structured EvidenceQualityDetail.
 */
export function getEvidenceQualityDetail(rawScore: number | undefined | null, studyCount: number = 0): EvidenceQualityDetail {
  let score = 85

  if (rawScore !== undefined && rawScore !== null) {
    const num = Number(rawScore)
    if (!isNaN(num)) {
      if (num > 5) {
        // Already on a 0-100 scale (e.g. 96, 94, 92)
        score = Math.min(100, Math.max(1, Math.round(num)))
      } else {
        // Legacy 1-5 scale mapped to 0-100
        switch (Math.round(num)) {
          case 5:
            score = 95
            break
          case 4:
            score = 82
            break
          case 3:
            score = 65
            break
          case 2:
            score = 45
            break
          case 1:
            score = 25
            break
          default:
            score = 75
        }
      }
    }
  } else if (studyCount > 0) {
    score = studyCount >= 3 ? 92 : 82
  }

  if (score >= 85) {
    return {
      score,
      displayScore: `${score} / 100`,
      compactScore: `${score}/100`,
      grade: 'Grade A (Human RCT)',
      shortGrade: 'Grade A',
      tier: 'Tier-1 Anchor',
      description: 'Gold-standard clinical evidence: Multiple double-blind randomized controlled human trials (RCTs), prospective clinical intervention data, or systemic meta-analyses.',
      criteria: [
        'Gold-standard double-blind, placebo-controlled human trials',
        'Direct biomarker endpoint validation (e.g. hs-CRP, ApoB, VO2 max, glucose curve)',
        'Statistically significant effect size reproducible across clinical cohorts',
        'High peer-reviewed publication status and meta-analytic consensus'
      ],
      badgeColorDark: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      badgeColorLight: 'bg-[#F0EDFB] text-[#6954C8] border-[#6954C8]/30',
      pillColor: 'purple'
    }
  }

  if (score >= 70) {
    return {
      score,
      displayScore: `${score} / 100`,
      compactScore: `${score}/100`,
      grade: 'Grade B (Clinical Cohort)',
      shortGrade: 'Grade B',
      tier: 'Tier-2 Synergist',
      description: 'Solid clinical evidence: Controlled human cohort trials, translational human studies, or validated physiological biomarker responses.',
      criteria: [
        'Well-designed human clinical cohort studies or open-label intervention trials',
        'Demonstrated physiological mechanism & intermediate biomarker modulation',
        'Statistically meaningful correlation with longevity endpoints',
        'Replicated across independent clinical research institutions'
      ],
      badgeColorDark: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      badgeColorLight: 'bg-[#EFF6FF] text-[#2563EB] border-[#2563EB]/30',
      pillColor: 'blue'
    }
  }

  if (score >= 50) {
    return {
      score,
      displayScore: `${score} / 100`,
      compactScore: `${score}/100`,
      grade: 'Grade C (Epidemiological)',
      shortGrade: 'Grade C',
      tier: 'Tier-2 Synergist',
      description: 'Observational & Mechanistic evidence: Large prospective population cohorts, epidemiological tracking, or established cellular pathway biology.',
      criteria: [
        'Longitudinal prospective observational cohort studies (e.g. NHANES, UK Biobank)',
        'Clear biological plausibility and mapped cellular signaling pathways',
        'Indirect risk reduction or behavioral lifestyle synergy',
        'Human RCT data is currently limited or in progress'
      ],
      badgeColorDark: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      badgeColorLight: 'bg-[#ECFEFF] text-[#0891B2] border-[#0891B2]/30',
      pillColor: 'cyan'
    }
  }

  return {
    score,
    displayScore: `${score} / 100`,
    compactScore: `${score}/100`,
    grade: 'Grade D (Preclinical / Emerging)',
    shortGrade: 'Grade D',
    tier: 'Tier-3 Marginal',
    description: 'Early emerging evidence: In-vitro cell models, animal longevity models (rodents, C. elegans), or early pilot studies awaiting human trial validation.',
    criteria: [
      'Mechanistic animal longevity or in-vitro cellular assays',
      'Emerging pilot or exploratory observational findings',
      'Definitive human randomized trials pending publication',
      'Dosing and bioavailability still undergoing optimization'
    ],
    badgeColorDark: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    badgeColorLight: 'bg-[#FFFBEB] text-[#D97706] border-[#D97706]/30',
    pillColor: 'amber'
  }
}
