/**
 * 4-Night Dermatological Skin Cycling Engine
 * Implements the evidence-based 4-day skin rotation:
 * - Day 1: Exfoliation Night (Cellular Renewal)
 * - Day 2: Retinoid Night (Deep Gene Transcription)
 * - Day 3: Collagen Matrix Night (Red Light Photobiomodulation + Topical GHK-Cu)
 * - Day 4: Deep Recovery Night (Red Light Photobiomodulation + Topical GHK-Cu + Barrier Repair)
 */

export type SkinCyclePhaseKey = 'exfoliation' | 'retinoid' | 'collagen_matrix' | 'recovery'

export interface SkinCyclePhase {
  dayNumber: 1 | 2 | 3 | 4
  phaseKey: SkinCyclePhaseKey
  name: string
  subtitle: string
  badge: string
  colorBadge: string
  colorBorder: string
  colorGlow: string
  eveningFocus: string
  rationale: string
  layeringSequence: string[]
  activeEveningModalityIds: string[]
  contraindicatedNotes?: string
}

export const SKIN_CYCLE_PHASES: SkinCyclePhase[] = [
  {
    dayNumber: 1,
    phaseKey: 'exfoliation',
    name: 'Exfoliation Night',
    subtitle: 'Cellular Renewal & Stratum Corneum Preparation',
    badge: '✨ Exfoliation',
    colorBadge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    colorBorder: 'border-amber-500/40',
    colorGlow: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]',
    eveningFocus: 'Gentle BHA/AHA Chemical Exfoliation + Ceramide Barrier Hydration',
    rationale: 'Removes dead keratinocytes to clear pores and maximize transdermal peptide absorption for subsequent cycle days.',
    layeringSequence: [
      '1. Gentle Hydrating Cleanser & Pat Dry',
      '2. Mild BHA/AHA Exfoliating Tonic (pH 3.5–4.0)',
      '3. Ceramide NP & Ectoin Barrier Recovery Cream'
    ],
    activeEveningModalityIds: ['ceramide_ectoin_barrier_cream'],
    contraindicatedNotes: '⚠️ Rest Night for GHK-Cu and Retinoids. Low-pH acids oxidize copper peptides.'
  },
  {
    dayNumber: 2,
    phaseKey: 'retinoid',
    name: 'Retinoid Night',
    subtitle: 'Cellular Turnover & Nuclear Receptor Binding',
    badge: '⚡ Retinoid Turnover',
    colorBadge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    colorBorder: 'border-rose-500/40',
    colorGlow: 'shadow-[0_0_15px_rgba(244,63,94,0.3)]',
    eveningFocus: 'Micro-Encapsulated Tretinoin (0.025%) + Barrier Buffer',
    rationale: 'Binds to nuclear retinoic acid receptors (RARs) to accelerate epidermal turnover and reverse photo-damage.',
    layeringSequence: [
      '1. Gentle Cleanser & Wait 5 Minutes Until Bone Dry',
      '2. Pea-Sized Micro-Retinoid (Tretinoin 0.025%)',
      '3. Ceramide NP & Ectoin Barrier Recovery Cream (Buffer)'
    ],
    activeEveningModalityIds: ['micro_retinoid_tretinoin', 'ceramide_ectoin_barrier_cream'],
    contraindicatedNotes: '⚠️ Do not apply GHK-Cu or strong acids on this night to prevent chemical interference and retinoid dermatitis.'
  },
  {
    dayNumber: 3,
    phaseKey: 'collagen_matrix',
    name: 'Collagen Matrix Night',
    subtitle: 'Mitochondrial Photobiomodulation & Dermal Remodeling',
    badge: '🌟 Collagen & Peptides',
    colorBadge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    colorBorder: 'border-indigo-500/40',
    colorGlow: 'shadow-[0_0_20px_rgba(99,102,241,0.35)]',
    eveningFocus: '10m Red & NIR LED Mask (Bare Skin) ➔ Topical GHK-Cu Copper Peptides',
    rationale: 'Red/NIR photons activate mitochondrial cytochrome c oxidase ATP output, while GHK-Cu upregulates pro-collagen I, III, and decorin mRNA.',
    layeringSequence: [
      '1. Cleanse & Pat Dry (100% Bare Skin)',
      '2. Red & NIR LED Face Mask (10 Mins • 630nm + 830nm)',
      '3. Topical GHK-Cu Copper Tripeptide-1 Serum (3–4 Drops)',
      '4. Ceramide NP & Ectoin Barrier Cream'
    ],
    activeEveningModalityIds: ['red_light_face_mask', 'topical_ghk_cu_serum', 'ceramide_ectoin_barrier_cream']
  },
  {
    dayNumber: 4,
    phaseKey: 'recovery',
    name: 'Deep Recovery Night',
    subtitle: 'Extracellular Matrix Rebuilding & Moisture Locking',
    badge: '🛡️ Deep Barrier Rest',
    colorBadge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    colorBorder: 'border-emerald-500/40',
    colorGlow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]',
    eveningFocus: 'Red Light Photobiomodulation + Topical GHK-Cu + Deep Lipid Sealing',
    rationale: 'Allows stratum corneum to fully replenish intercellular lipids while sustaining pro-collagen signaling.',
    layeringSequence: [
      '1. Gentle Cleanser & Pat Dry',
      '2. Red & NIR LED Face Mask (10 Mins • Optional)',
      '3. Topical GHK-Cu Copper Peptide Serum',
      '4. Generous Layer of Ceramide NP & Ectoin Cream'
    ],
    activeEveningModalityIds: ['red_light_face_mask', 'topical_ghk_cu_serum', 'ceramide_ectoin_barrier_cream']
  }
]

/**
 * Calculates the skin cycle phase for any given calendar date.
 * Anchored to a stable reference epoch so day 1-4 progression is deterministic across devices.
 */
export function getSkinCyclePhaseForDate(dateInput: Date | string): SkinCyclePhase {
  const d = typeof dateInput === 'string' ? new Date(dateInput + 'T00:00:00') : new Date(dateInput)
  
  // Stable reference epoch: Jan 1, 2026
  const epoch = new Date('2026-01-01T00:00:00').getTime()
  const targetTime = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const diffDays = Math.floor((targetTime - epoch) / (1000 * 60 * 60 * 24))
  
  // 4-day modulo (handles negative days safely if needed)
  const cycleIndex = ((diffDays % 4) + 4) % 4
  return SKIN_CYCLE_PHASES[cycleIndex]
}

/**
 * Checks if a specific modality is scheduled to run on the given cycle date.
 * Morning modalities (Vitamin C, Mineral Sunscreen) and midday collagen run daily.
 * Evening modalities follow the 4-day cycle rotation.
 */
export function isSkinModalityActiveOnDate(modalityId: string, dateInput: Date | string): boolean {
  const cleanId = (modalityId || '').toLowerCase()
  
  // Daily modalities run every single day
  if (
    cleanId.includes('sunscreen') || 
    cleanId.includes('vitamin_c') || 
    cleanId.includes('antioxidant') ||
    cleanId.includes('collagen')
  ) {
    return true
  }

  // Evening modalities are governed by the cycle
  const currentPhase = getSkinCyclePhaseForDate(dateInput)
  return currentPhase.activeEveningModalityIds.some(id => cleanId.includes(id) || id.includes(cleanId))
}
