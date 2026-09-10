'use client'

import React from 'react'

export type HallmarkOfAgingId =
  | 'genomic_instability'
  | 'telomere_attrition'
  | 'epigenetic_alterations'
  | 'loss_of_proteostasis'
  | 'disabled_macroautophagy'
  | 'deregulated_nutrient_sensing'
  | 'mitochondrial_dysfunction'
  | 'cellular_senescence'
  | 'stem_cell_exhaustion'
  | 'altered_intercellular_communication'
  | 'chronic_inflammation'
  | 'dysbiosis'

export interface HallmarkIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number
  glow?: boolean
  className?: string
}

export interface HallmarkOfAgingMeta {
  id: HallmarkOfAgingId
  number: number
  name: string
  shortLabel: string
  tier: 'primary' | 'antagonistic' | 'integrative'
  colorHex: string
  secondaryColorHex: string
  bgGlow: string
  borderColor: string
  textColor: string
  description: string
}

export const HALLMARKS_OF_AGING_METADATA: Record<HallmarkOfAgingId, HallmarkOfAgingMeta> = {
  genomic_instability: {
    id: 'genomic_instability',
    number: 1,
    name: 'Genomic Instability',
    shortLabel: 'DNA Stability',
    tier: 'primary',
    colorHex: '#3B82F6', // Electric Blue
    secondaryColorHex: '#60A5FA',
    bgGlow: 'rgba(59, 130, 246, 0.25)',
    borderColor: 'border-blue-500/40',
    textColor: 'text-blue-400',
    description: 'Oxidative DNA lesions, double-strand breaks, and somatic mutations.'
  },
  telomere_attrition: {
    id: 'telomere_attrition',
    number: 2,
    name: 'Telomere Attrition',
    shortLabel: 'Telomeres',
    tier: 'primary',
    colorHex: '#EC4899', // Neon Fuchsia / Pink
    secondaryColorHex: '#F472B6',
    bgGlow: 'rgba(236, 72, 153, 0.25)',
    borderColor: 'border-pink-500/40',
    textColor: 'text-pink-400',
    description: 'Loss of protective hexameric TTAGGG caps at chromosome tips.'
  },
  epigenetic_alterations: {
    id: 'epigenetic_alterations',
    number: 3,
    name: 'Epigenetic Alterations',
    shortLabel: 'Epigenetics',
    tier: 'primary',
    colorHex: '#8B5CF6', // Royal Violet
    secondaryColorHex: '#A78BFA',
    bgGlow: 'rgba(139, 92, 246, 0.25)',
    borderColor: 'border-purple-500/40',
    textColor: 'text-purple-400',
    description: 'Histone deacetylation, chromatin remodeling, and DNA methylation drift.'
  },
  loss_of_proteostasis: {
    id: 'loss_of_proteostasis',
    number: 4,
    name: 'Loss of Proteostasis',
    shortLabel: 'Proteostasis',
    tier: 'primary',
    colorHex: '#F59E0B', // Amber Gold
    secondaryColorHex: '#FCD34D',
    bgGlow: 'rgba(245, 158, 11, 0.25)',
    borderColor: 'border-amber-500/40',
    textColor: 'text-amber-400',
    description: 'Misfolded protein aggregates and molecular chaperone (HSP) exhaustion.'
  },
  disabled_macroautophagy: {
    id: 'disabled_macroautophagy',
    number: 5,
    name: 'Disabled Macroautophagy',
    shortLabel: 'Autophagy',
    tier: 'primary',
    colorHex: '#10B981', // Emerald Mint
    secondaryColorHex: '#6EE7B7',
    bgGlow: 'rgba(16, 185, 129, 0.25)',
    borderColor: 'border-emerald-500/40',
    textColor: 'text-emerald-400',
    description: 'Defective autophagosomal engulfment and lysosomal organelle clearance.'
  },
  deregulated_nutrient_sensing: {
    id: 'deregulated_nutrient_sensing',
    number: 6,
    name: 'Deregulated Nutrient Sensing',
    shortLabel: 'Nutrient Sensing',
    tier: 'antagonistic',
    colorHex: '#EAB308', // Golden Honey
    secondaryColorHex: '#FDE047',
    bgGlow: 'rgba(234, 179, 8, 0.25)',
    borderColor: 'border-yellow-500/40',
    textColor: 'text-yellow-400',
    description: 'Hyperactive mTOR/IGF-1 signaling versus blunted AMPK/SIRT1 response.'
  },
  mitochondrial_dysfunction: {
    id: 'mitochondrial_dysfunction',
    number: 7,
    name: 'Mitochondrial Dysfunction',
    shortLabel: 'Mitochondria',
    tier: 'antagonistic',
    colorHex: '#EF4444', // Molten Crimson
    secondaryColorHex: '#F87171',
    bgGlow: 'rgba(239, 68, 68, 0.25)',
    borderColor: 'border-red-500/40',
    textColor: 'text-red-400',
    description: 'ETC decoupling, fragmented inner cristae, and excessive superoxide ROS.'
  },
  cellular_senescence: {
    id: 'cellular_senescence',
    number: 8,
    name: 'Cellular Senescence',
    shortLabel: 'Senescence',
    tier: 'antagonistic',
    colorHex: '#F43F5E', // Neon Ruby / Rose
    secondaryColorHex: '#FB7185',
    bgGlow: 'rgba(244, 63, 94, 0.25)',
    borderColor: 'border-rose-500/40',
    textColor: 'text-rose-400',
    description: 'Irreversible cell cycle arrest and toxic paracrine SASP secretion.'
  },
  stem_cell_exhaustion: {
    id: 'stem_cell_exhaustion',
    number: 9,
    name: 'Stem Cell Exhaustion',
    shortLabel: 'Stem Cells',
    tier: 'integrative',
    colorHex: '#06B6D4', // Cryo Cyan
    secondaryColorHex: '#67E8F9',
    bgGlow: 'rgba(6, 182, 212, 0.25)',
    borderColor: 'border-cyan-500/40',
    textColor: 'text-cyan-400',
    description: 'Depletion of self-renewing tissue and hematopoietic regenerative progenitors.'
  },
  altered_intercellular_communication: {
    id: 'altered_intercellular_communication',
    number: 10,
    name: 'Altered Intercellular Communication',
    shortLabel: 'Intercellular Signaling',
    tier: 'integrative',
    colorHex: '#6366F1', // Indigo Iris
    secondaryColorHex: '#818CF8',
    bgGlow: 'rgba(99, 102, 241, 0.25)',
    borderColor: 'border-indigo-500/40',
    textColor: 'text-indigo-400',
    description: 'Neuroendocrine decay, cytokine desynchrony, and microvesicle disruption.'
  },
  chronic_inflammation: {
    id: 'chronic_inflammation',
    number: 11,
    name: 'Chronic Inflammation',
    shortLabel: 'Inflammaging',
    tier: 'integrative',
    colorHex: '#F97316', // Blaze Orange
    secondaryColorHex: '#FDBA74',
    bgGlow: 'rgba(249, 115, 22, 0.25)',
    borderColor: 'border-orange-500/40',
    textColor: 'text-orange-400',
    description: 'Sterile innate immune overactivation and NLRP3 inflammasome firing.'
  },
  dysbiosis: {
    id: 'dysbiosis',
    number: 12,
    name: 'Dysbiosis',
    shortLabel: 'Gut Microbiome',
    tier: 'integrative',
    colorHex: '#14B8A6', // Sage Mint Teal
    secondaryColorHex: '#5EEAD4',
    bgGlow: 'rgba(20, 184, 166, 0.25)',
    borderColor: 'border-teal-500/40',
    textColor: 'text-teal-400',
    description: 'Mucosal epithelial barrier erosion and loss of commensal bacterial diversity.'
  }
}

// -----------------------------------------------------------------------------
// INDIVIDUAL DETAILED HALLMARK ICONS (48x48 Multi-layer Vector SVGs)
// -----------------------------------------------------------------------------

/** 1. Genomic Instability */
export const GenomicInstabilityIcon: React.FC<HallmarkIconProps> = ({ size = 24, glow = true, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`} {...props}>
    <defs>
      <linearGradient id="dnaBreakGrad" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#93C5FD" />
        <stop offset="50%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#1D4ED8" />
      </linearGradient>
      {glow && (
        <filter id="genomicGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#3B82F6" floodOpacity="0.5" />
        </filter>
      )}
    </defs>
    <g filter={glow ? 'url(#genomicGlow)' : undefined}>
      {/* Upper DNA Strands */}
      <path d="M12 8C16 12 20 15 24 15C28 15 32 12 36 8M36 18C32 18 28 15 24 15C20 15 16 18 12 18" stroke="url(#dnaBreakGrad)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="16" y1="10" x2="16" y2="16" stroke="#93C5FD" strokeWidth="1.5" />
      <line x1="32" y1="10" x2="32" y2="16" stroke="#93C5FD" strokeWidth="1.5" />
      
      {/* Central DNA Double-Strand Lesion & Enzymatic Repair Laser */}
      <path d="M22 21L26 27M26 21L22 27" stroke="#F87171" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="24" r="7" stroke="#60A5FA" strokeWidth="1.5" strokeDasharray="2 3" fill="rgba(59, 130, 246, 0.12)" />

      {/* Lower DNA Strands */}
      <path d="M12 30C16 30 20 33 24 33C28 33 32 30 36 30M36 40C32 36 28 33 24 33C20 33 16 36 12 40" stroke="url(#dnaBreakGrad)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="16" y1="32" x2="16" y2="38" stroke="#93C5FD" strokeWidth="1.5" />
      <line x1="32" y1="32" x2="32" y2="38" stroke="#93C5FD" strokeWidth="1.5" />
    </g>
  </svg>
)

/** 2. Telomere Attrition */
export const TelomereAttritionIcon: React.FC<HallmarkIconProps> = ({ size = 24, glow = true, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`} {...props}>
    <defs>
      <linearGradient id="chromGrad" x1="10" y1="10" x2="38" y2="38" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#F472B6" />
        <stop offset="50%" stopColor="#EC4899" />
        <stop offset="100%" stopColor="#BE185D" />
      </linearGradient>
      {glow && (
        <filter id="teloGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#EC4899" floodOpacity="0.5" />
        </filter>
      )}
    </defs>
    <g filter={glow ? 'url(#teloGlow)' : undefined}>
      {/* Chromosome 'X' Chromatid Arms */}
      <path d="M14 14L24 24L34 14M14 34L24 24L34 34" stroke="url(#chromGrad)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24" cy="24" r="3.5" fill="#FDF2F8" stroke="#DB2777" strokeWidth="1.5" />
      
      {/* Glowing Protective Telomeric End Caps */}
      <circle cx="14" cy="14" r="4" fill="#FBCFE8" stroke="#BE185D" strokeWidth="1.5" />
      <circle cx="34" cy="14" r="4" fill="#FBCFE8" stroke="#BE185D" strokeWidth="1.5" />
      <circle cx="14" cy="34" r="4" fill="#FBCFE8" stroke="#BE185D" strokeWidth="1.5" />
      <circle cx="34" cy="34" r="4" fill="#FBCFE8" stroke="#BE185D" strokeWidth="1.5" />
    </g>
  </svg>
)

/** 3. Epigenetic Alterations */
export const EpigeneticAlterationsIcon: React.FC<HallmarkIconProps> = ({ size = 24, glow = true, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`} {...props}>
    <defs>
      <linearGradient id="epiGrad" x1="10" y1="10" x2="38" y2="38" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#C4B5FD" />
        <stop offset="50%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#6D28D9" />
      </linearGradient>
      {glow && (
        <filter id="epiGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#8B5CF6" floodOpacity="0.45" />
        </filter>
      )}
    </defs>
    <g filter={glow ? 'url(#epiGlow)' : undefined}>
      {/* Central Nucleosome Histone Core Spool */}
      <circle cx="24" cy="24" r="10" stroke="url(#epiGrad)" strokeWidth="2.5" fill="rgba(139, 92, 246, 0.15)" />
      
      {/* DNA Helix Filament wrapped around nucleosome */}
      <path d="M8 20C12 14 18 10 24 10C32 10 38 16 38 24C38 32 32 38 24 38C17 38 12 33 9 27" stroke="url(#epiGrad)" strokeWidth="2.5" strokeLinecap="round" />
      
      {/* Methylation Flags (-CH3 Tags on Histone Tails) */}
      <line x1="24" y1="6" x2="24" y2="10" stroke="#DDD6FE" strokeWidth="2" strokeLinecap="round" />
      <circle cx="24" cy="5" r="2.5" fill="#DDD6FE" />
      <line x1="41" y1="21" x2="38" y2="24" stroke="#DDD6FE" strokeWidth="2" strokeLinecap="round" />
      <circle cx="42" cy="20" r="2.5" fill="#DDD6FE" />
      <line x1="24" y1="42" x2="24" y2="38" stroke="#DDD6FE" strokeWidth="2" strokeLinecap="round" />
      <circle cx="24" cy="43" r="2.5" fill="#DDD6FE" />
    </g>
  </svg>
)

/** 4. Loss of Proteostasis */
export const LossOfProteostasisIcon: React.FC<HallmarkIconProps> = ({ size = 24, glow = true, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`} {...props}>
    <defs>
      <linearGradient id="protGrad" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FDE68A" />
        <stop offset="50%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
      {glow && (
        <filter id="protGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#F59E0B" floodOpacity="0.45" />
        </filter>
      )}
    </defs>
    <g filter={glow ? 'url(#protGlow)' : undefined}>
      {/* Outer Hexagonal Molecular Chaperone Cage (HSP70/HSP90) */}
      <path d="M24 7L38 15V33L24 41L10 33V15L24 7Z" stroke="url(#protGrad)" strokeWidth="2.5" strokeLinejoin="round" fill="rgba(245, 158, 11, 0.1)" />
      
      {/* Intricate Tangled Misfolded Polypeptide Ribbon being Refolded */}
      <path d="M18 19C22 15 28 17 26 22C24 27 16 23 18 30C20 37 32 31 29 24" stroke="#FDE68A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="18" cy="19" r="2" fill="#FDE68A" />
      <circle cx="29" cy="24" r="2" fill="#FDE68A" />
    </g>
  </svg>
)

/** 5. Disabled Macroautophagy */
export const DisabledMacroautophagyIcon: React.FC<HallmarkIconProps> = ({ size = 24, glow = true, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`} {...props}>
    <defs>
      <linearGradient id="autoGrad" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#A7F3D0" />
        <stop offset="50%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
      {glow && (
        <filter id="autoGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#10B981" floodOpacity="0.45" />
        </filter>
      )}
    </defs>
    <g filter={glow ? 'url(#autoGlow)' : undefined}>
      {/* Outer Autophagosome Double-Membrane Vesicle */}
      <circle cx="24" cy="24" r="16" stroke="url(#autoGrad)" strokeWidth="2.5" strokeDasharray="5 3" fill="rgba(16, 185, 129, 0.12)" />
      <circle cx="24" cy="24" r="11" stroke="url(#autoGrad)" strokeWidth="1.8" />
      
      {/* Engulfed Damaged Cellular Organelle (Lysosomal Digestion Core) */}
      <path d="M20 20C22 17 26 17 28 20C30 23 30 25 28 28C26 31 22 31 20 28C18 25 18 23 20 20Z" stroke="#6EE7B7" strokeWidth="1.8" fill="rgba(110, 231, 183, 0.25)" />
      <circle cx="24" cy="24" r="2" fill="#D1FAE5" />
    </g>
  </svg>
)

/** 6. Deregulated Nutrient Sensing */
export const DeregulatedNutrientSensingIcon: React.FC<HallmarkIconProps> = ({ size = 24, glow = true, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`} {...props}>
    <defs>
      <linearGradient id="nutriGrad" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="50%" stopColor="#EAB308" />
        <stop offset="100%" stopColor="#A16207" />
      </linearGradient>
      {glow && (
        <filter id="nutriGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#EAB308" floodOpacity="0.45" />
        </filter>
      )}
    </defs>
    <g filter={glow ? 'url(#nutriGlow)' : undefined}>
      {/* Central Multi-Node Nutrient Sensing Dial (mTOR / AMPK Gauge) */}
      <circle cx="24" cy="24" r="6" stroke="url(#nutriGrad)" strokeWidth="2.5" fill="rgba(234, 179, 8, 0.18)" />
      
      {/* Tripartite Sensor Nodes (Glucose, Amino Acids, Energy Ratio) */}
      <line x1="24" y1="18" x2="24" y2="9" stroke="url(#nutriGrad)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="8" r="3.5" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1.5" />
      
      <line x1="28.5" y1="27" x2="36" y2="32" stroke="url(#nutriGrad)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="37" cy="33" r="3.5" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1.5" />
      
      <line x1="19.5" y1="27" x2="12" y2="32" stroke="url(#nutriGrad)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="11" cy="33" r="3.5" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1.5" />

      {/* Orbiting Equilibrium Ring */}
      <circle cx="24" cy="24" r="16" stroke="#CA8A04" strokeWidth="1.2" strokeDasharray="3 4" />
    </g>
  </svg>
)

/** 7. Mitochondrial Dysfunction */
export const MitochondrialDysfunctionIcon: React.FC<HallmarkIconProps> = ({ size = 24, glow = true, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`} {...props}>
    <defs>
      <linearGradient id="mitoGrad" x1="10" y1="10" x2="38" y2="38" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FCA5A5" />
        <stop offset="50%" stopColor="#EF4444" />
        <stop offset="100%" stopColor="#B91C1C" />
      </linearGradient>
      {glow && (
        <filter id="mitoGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#EF4444" floodOpacity="0.5" />
        </filter>
      )}
    </defs>
    <g filter={glow ? 'url(#mitoGlow)' : undefined}>
      {/* Outer Double-Membrane Organelle Profile */}
      <path d="M14 11C8 17 9 31 16 37C23 43 37 39 40 31C43 23 37 11 29 8C23 6 18 7 14 11Z" stroke="url(#mitoGrad)" strokeWidth="2.5" strokeLinejoin="round" fill="rgba(239, 68, 68, 0.12)" />
      
      {/* Inner Cristae Folded Serpentine Membrane */}
      <path d="M17 19H25C27 19 28 21 26 23H20C18 23 18 26 21 26H28C30 26 31 28 29 30H21" stroke="#FCA5A5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* ATP Synthase / ROS Emission Sparks */}
      <circle cx="33" cy="18" r="2" fill="#FECACA" />
      <circle cx="34" cy="24" r="1.5" fill="#FECACA" />
    </g>
  </svg>
)

/** 8. Cellular Senescence */
export const CellularSenescenceIcon: React.FC<HallmarkIconProps> = ({ size = 24, glow = true, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`} {...props}>
    <defs>
      <linearGradient id="senGrad" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FDA4AF" />
        <stop offset="50%" stopColor="#F43F5E" />
        <stop offset="100%" stopColor="#9F1239" />
      </linearGradient>
      {glow && (
        <filter id="senGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#F43F5E" floodOpacity="0.45" />
        </filter>
      )}
    </defs>
    <g filter={glow ? 'url(#senGlow)' : undefined}>
      {/* Irregular Flattened Senescent Cell Boundary */}
      <path d="M24 8C30 7 36 10 39 16C42 22 41 29 37 34C33 39 26 42 19 40C12 38 7 31 8 24C9 17 17 9 24 8Z" stroke="url(#senGrad)" strokeWidth="2.5" fill="rgba(244, 63, 94, 0.12)" />
      
      {/* Permanently Arrested Nucleus with Chromatin Condensation */}
      <circle cx="23" cy="24" r="6" stroke="url(#senGrad)" strokeWidth="2" fill="rgba(159, 18, 57, 0.3)" />
      <circle cx="23" cy="24" r="2.5" fill="#FDA4AF" />
      
      {/* Radiating SASP Pro-Inflammatory Secretory Vesicles */}
      <circle cx="36" cy="14" r="2" fill="#FB7185" />
      <circle cx="41" cy="26" r="2" fill="#FB7185" />
      <circle cx="35" cy="37" r="2" fill="#FB7185" />
      <circle cx="11" cy="34" r="2" fill="#FB7185" />
      <circle cx="11" cy="14" r="2" fill="#FB7185" />
    </g>
  </svg>
)

/** 9. Stem Cell Exhaustion */
export const StemCellExhaustionIcon: React.FC<HallmarkIconProps> = ({ size = 24, glow = true, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`} {...props}>
    <defs>
      <linearGradient id="stemGrad" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#A5F3FC" />
        <stop offset="50%" stopColor="#06B6D4" />
        <stop offset="100%" stopColor="#0E7490" />
      </linearGradient>
      {glow && (
        <filter id="stemGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#06B6D4" floodOpacity="0.45" />
        </filter>
      )}
    </defs>
    <g filter={glow ? 'url(#stemGlow)' : undefined}>
      {/* Regenerative Stem Cell Niche Colony (Asymmetric Division) */}
      <circle cx="18" cy="18" r="8" stroke="url(#stemGrad)" strokeWidth="2.5" fill="rgba(6, 182, 212, 0.15)" />
      <circle cx="18" cy="18" r="3.5" fill="#CFFAFE" />
      
      <circle cx="31" cy="29" r="6.5" stroke="url(#stemGrad)" strokeWidth="2.2" fill="rgba(6, 182, 212, 0.12)" />
      <circle cx="31" cy="29" r="2.8" fill="#CFFAFE" />
      
      <circle cx="31" cy="15" r="4.5" stroke="url(#stemGrad)" strokeWidth="1.8" strokeDasharray="2 2" />
      <circle cx="16" cy="33" r="4" stroke="url(#stemGrad)" strokeWidth="1.8" strokeDasharray="2 2" />
      
      {/* Pluripotency Microenvironmental Flow */}
      <path d="M23 23L27 26" stroke="#67E8F9" strokeWidth="2" strokeLinecap="round" />
    </g>
  </svg>
)

/** 10. Altered Intercellular Communication */
export const AlteredIntercellularCommunicationIcon: React.FC<HallmarkIconProps> = ({ size = 24, glow = true, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`} {...props}>
    <defs>
      <linearGradient id="commsGrad" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#C7D2FE" />
        <stop offset="50%" stopColor="#6366F1" />
        <stop offset="100%" stopColor="#4338CA" />
      </linearGradient>
      {glow && (
        <filter id="commsGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#6366F1" floodOpacity="0.45" />
        </filter>
      )}
    </defs>
    <g filter={glow ? 'url(#commsGlow)' : undefined}>
      {/* Central Signaling Cell Node */}
      <circle cx="24" cy="24" r="5" stroke="url(#commsGrad)" strokeWidth="2.5" fill="#EEF2FF" />
      
      {/* Radiating Paracrine & Endocrine Cytokine Signaling Waves */}
      <circle cx="24" cy="24" r="11" stroke="url(#commsGrad)" strokeWidth="1.8" strokeDasharray="3 4" />
      <circle cx="24" cy="24" r="17" stroke="url(#commsGrad)" strokeWidth="1.4" strokeDasharray="4 5" />
      
      {/* Peripheral Target Tissue Receptor Nodes */}
      <circle cx="24" cy="7" r="3" fill="#818CF8" />
      <circle cx="38" cy="32" r="3" fill="#818CF8" />
      <circle cx="10" cy="32" r="3" fill="#818CF8" />
      
      {/* Desynchronized Signal Fracture Rays */}
      <line x1="24" y1="12" x2="24" y2="19" stroke="#A5B4FC" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="33" y1="29" x2="28" y2="26" stroke="#A5B4FC" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="15" y1="29" x2="20" y2="26" stroke="#A5B4FC" strokeWidth="1.8" strokeLinecap="round" />
    </g>
  </svg>
)

/** 11. Chronic Inflammation */
export const ChronicInflammationHallmarkIcon: React.FC<HallmarkIconProps> = ({ size = 24, glow = true, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`} {...props}>
    <defs>
      <linearGradient id="inflamHalGrad" x1="8" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FED7AA" />
        <stop offset="50%" stopColor="#F97316" />
        <stop offset="100%" stopColor="#C2410C" />
      </linearGradient>
      {glow && (
        <filter id="inflamHalGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#F97316" floodOpacity="0.45" />
        </filter>
      )}
    </defs>
    <g filter={glow ? 'url(#inflamHalGlow)' : undefined}>
      {/* Macromolecular Wheel NLRP3 Inflammasome Disc */}
      <circle cx="24" cy="24" r="14" stroke="url(#inflamHalGrad)" strokeWidth="2.5" fill="rgba(249, 115, 22, 0.12)" />
      <circle cx="24" cy="24" r="5" fill="#FED7AA" stroke="#EA580C" strokeWidth="1.8" />
      
      {/* Inflammatory Flare Spikes (Caspase-1 / Pro-IL1β Cleavage Burst) */}
      <path d="M24 4V8M24 40V44M4 24H8M40 24H44M10 10L13 13M35 35L38 38M10 38L13 35M35 13L38 10" stroke="url(#inflamHalGrad)" strokeWidth="2.5" strokeLinecap="round" />
    </g>
  </svg>
)

/** 12. Dysbiosis */
export const DysbiosisIcon: React.FC<HallmarkIconProps> = ({ size = 24, glow = true, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`} {...props}>
    <defs>
      <linearGradient id="dysGrad" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#99F6E4" />
        <stop offset="50%" stopColor="#14B8A6" />
        <stop offset="100%" stopColor="#0F766E" />
      </linearGradient>
      {glow && (
        <filter id="dysGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#14B8A6" floodOpacity="0.45" />
        </filter>
      )}
    </defs>
    <g filter={glow ? 'url(#dysGlow)' : undefined}>
      {/* Epithelial Monolayer Gut Mucosal Barrier Membrane */}
      <path d="M8 36C14 34 18 38 24 36C30 34 34 38 40 36" stroke="url(#dysGrad)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="16" y1="36" x2="16" y2="42" stroke="url(#dysGrad)" strokeWidth="2" strokeLinecap="round" />
      <line x1="24" y1="36" x2="24" y2="42" stroke="url(#dysGrad)" strokeWidth="2" strokeLinecap="round" />
      <line x1="32" y1="36" x2="32" y2="42" stroke="url(#dysGrad)" strokeWidth="2" strokeLinecap="round" />
      
      {/* Symbiotic Gut Microbe Bacilli & Probiotic Cocci */}
      <rect x="12" y="14" width="12" height="6" rx="3" transform="rotate(-20 12 14)" stroke="url(#dysGrad)" strokeWidth="2" fill="rgba(20, 184, 166, 0.2)" />
      <rect x="25" y="18" width="13" height="6" rx="3" transform="rotate(30 25 18)" stroke="url(#dysGrad)" strokeWidth="2" fill="rgba(20, 184, 166, 0.2)" />
      <circle cx="21" cy="27" r="3" stroke="url(#dysGrad)" strokeWidth="1.8" fill="#CCFBF1" />
      <circle cx="34" cy="11" r="2.5" stroke="url(#dysGrad)" strokeWidth="1.8" fill="#CCFBF1" />
    </g>
  </svg>
)

// -----------------------------------------------------------------------------
// UNIFIED DYNAMIC HALLMARK ICON COMPONENT
// -----------------------------------------------------------------------------

export interface HallmarkOfAgingIconProps extends HallmarkIconProps {
  hallmark: HallmarkOfAgingId | string
}

export const HallmarkOfAgingIcon: React.FC<HallmarkOfAgingIconProps> = ({ hallmark, ...props }) => {
  switch (hallmark) {
    case 'genomic_instability':
      return <GenomicInstabilityIcon {...props} />
    case 'telomere_attrition':
      return <TelomereAttritionIcon {...props} />
    case 'epigenetic_alterations':
      return <EpigeneticAlterationsIcon {...props} />
    case 'loss_of_proteostasis':
      return <LossOfProteostasisIcon {...props} />
    case 'disabled_macroautophagy':
      return <DisabledMacroautophagyIcon {...props} />
    case 'deregulated_nutrient_sensing':
      return <DeregulatedNutrientSensingIcon {...props} />
    case 'mitochondrial_dysfunction':
      return <MitochondrialDysfunctionIcon {...props} />
    case 'cellular_senescence':
      return <CellularSenescenceIcon {...props} />
    case 'stem_cell_exhaustion':
      return <StemCellExhaustionIcon {...props} />
    case 'altered_intercellular_communication':
      return <AlteredIntercellularCommunicationIcon {...props} />
    case 'chronic_inflammation':
      return <ChronicInflammationHallmarkIcon {...props} />
    case 'dysbiosis':
      return <DysbiosisIcon {...props} />
    default:
      return <MitochondrialDysfunctionIcon {...props} />
  }
}

export default HallmarkOfAgingIcon
