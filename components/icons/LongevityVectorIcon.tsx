'use client'

import React from 'react'

export type LongevityVectorId =
  | 'heart_health'
  | 'brain_longevity'
  | 'metabolic_health'
  | 'cancer_defense'
  | 'testosterone'
  | 'chronic_inflammation'
  | 'bone_density'
  | 'cellular_longevity'

export interface VectorIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number
  glow?: boolean
  className?: string
}

export interface LongevityVectorMeta {
  id: LongevityVectorId
  vectorNumber: number
  name: string
  shortLabel: string
  colorHex: string
  secondaryColorHex: string
  bgGlow: string
  borderColor: string
  textColor: string
  description: string
  keyBiomarkers: string[]
}

export const LONGEVITY_VECTOR_METADATA: Record<LongevityVectorId, LongevityVectorMeta> = {
  heart_health: {
    id: 'heart_health',
    vectorNumber: 1,
    name: 'Heart Health & Endothelial Function',
    shortLabel: 'Cardiovascular',
    colorHex: '#F43F5E', // Coral Rose
    secondaryColorHex: '#10B981', // Endothelial Mint
    bgGlow: 'rgba(244, 63, 94, 0.25)',
    borderColor: 'border-rose-500/40',
    textColor: 'text-rose-400',
    description: 'Cardiovascular output, endothelial elasticity, VO2 max & arterial compliance.',
    keyBiomarkers: ['VO2 Max', 'ApoB', 'CAC Score', 'Resting HR']
  },
  brain_longevity: {
    id: 'brain_longevity',
    vectorNumber: 2,
    name: 'Brain Longevity & Neuroprotection',
    shortLabel: 'Neuroprotection',
    colorHex: '#A855F7', // Electric Violet
    secondaryColorHex: '#C084FC',
    bgGlow: 'rgba(168, 85, 247, 0.25)',
    borderColor: 'border-purple-500/40',
    textColor: 'text-purple-400',
    description: 'Hippocampal plasticity, neurogenesis, synaptic density & glymphatic clearance.',
    keyBiomarkers: ['BDNF', 'Deep NREM Sleep', 'High-Frequency HRV']
  },
  metabolic_health: {
    id: 'metabolic_health',
    vectorNumber: 3,
    name: 'Metabolic Flexibility & Glycemic Control',
    shortLabel: 'Metabolic Health',
    colorHex: '#F59E0B', // Amber Gold
    secondaryColorHex: '#FBBF24',
    bgGlow: 'rgba(245, 158, 11, 0.25)',
    borderColor: 'border-amber-500/40',
    textColor: 'text-amber-400',
    description: 'Insulin sensitivity, substrate switching, mitochondrial uncoupling & visceral fat reduction.',
    keyBiomarkers: ['HOMA-IR', 'Fasting Insulin', 'HbA1c']
  },
  cancer_defense: {
    id: 'cancer_defense',
    vectorNumber: 4,
    name: 'Cancer Defense & DNA Repair',
    shortLabel: 'Cancer Defense',
    colorHex: '#10B981', // Emerald Mint
    secondaryColorHex: '#34D399',
    bgGlow: 'rgba(16, 185, 129, 0.25)',
    borderColor: 'border-emerald-500/40',
    textColor: 'text-emerald-400',
    description: 'Immunosurveillance, genomic stability, PARP activation & senescent cell purge.',
    keyBiomarkers: ['NK Cell Cytotoxicity', 'Circulating ctDNA', 'hs-CRP']
  },
  testosterone: {
    id: 'testosterone',
    vectorNumber: 5,
    name: 'Endocrine & Anabolic Balance',
    shortLabel: 'Endocrine Vitality',
    colorHex: '#F97316', // Anabolic Orange
    secondaryColorHex: '#FB923C',
    bgGlow: 'rgba(249, 115, 22, 0.25)',
    borderColor: 'border-orange-500/40',
    textColor: 'text-orange-400',
    description: 'Leydig cell output, free androgen index, LH/FSH axis & lean mass signaling.',
    keyBiomarkers: ['Free Testosterone', 'Total Testosterone', 'Morning Cortisol']
  },
  chronic_inflammation: {
    id: 'chronic_inflammation',
    vectorNumber: 6,
    name: 'Chronic Inflammation Reduction',
    shortLabel: 'Inflammaging',
    colorHex: '#06B6D4', // Cryo Cyan
    secondaryColorHex: '#38BDF8',
    bgGlow: 'rgba(6, 182, 212, 0.25)',
    borderColor: 'border-cyan-500/40',
    textColor: 'text-cyan-400',
    description: 'Suppression of sterile low-grade inflammaging and SASP secretome.',
    keyBiomarkers: ['hs-CRP', 'IL-6', 'TNF-alpha']
  },
  bone_density: {
    id: 'bone_density',
    vectorNumber: 7,
    name: 'Bone Density & Connective Matrix',
    shortLabel: 'Bone & Matrix',
    colorHex: '#94A3B8', // Platinum Silver Slate
    secondaryColorHex: '#CBD5E1',
    bgGlow: 'rgba(148, 163, 184, 0.25)',
    borderColor: 'border-slate-500/40',
    textColor: 'text-slate-300',
    description: 'Osteoblast mechanotransduction, trabecular architecture & collagen synthesis.',
    keyBiomarkers: ['DEXA Lumbar & Femoral T-Score', 'Serum P1NP', 'CTx']
  },
  cellular_longevity: {
    id: 'cellular_longevity',
    vectorNumber: 8,
    name: 'Cellular Longevity & Autophagy',
    shortLabel: 'Cellular Longevity',
    colorHex: '#C084FC', // Neon Lilac / Deep Fuchsia
    secondaryColorHex: '#E879F9',
    bgGlow: 'rgba(192, 132, 252, 0.25)',
    borderColor: 'border-purple-400/40',
    textColor: 'text-purple-300',
    description: 'Mitophagy velocity, sirtuin/AMPK activation, stem cell renewal & telomere maintenance.',
    keyBiomarkers: ['DunedinPACE Epigenetic Clock', 'GrimAge Clock', 'NAD+ Ratio']
  }
}

// -----------------------------------------------------------------------------
// INDIVIDUAL DETAILED VECTOR ICONS (48x48 Multi-layer Vector SVGs)
// -----------------------------------------------------------------------------

/** Vector 1: Heart Health & Endothelial Function (Coral Rose #F43F5E + Mint #10B981) */
export const HeartHealthIcon: React.FC<VectorIconProps> = ({ size = 24, glow = true, className = '', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
    {...props}
  >
    <defs>
      <linearGradient id="vectorHeartGrad" x1="8" y1="6" x2="40" y2="44" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FB7185" />
        <stop offset="50%" stopColor="#F43F5E" />
        <stop offset="100%" stopColor="#BE123C" />
      </linearGradient>
      <linearGradient id="vectorAortaGrad" x1="16" y1="4" x2="32" y2="18" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#34D399" />
        <stop offset="100%" stopColor="#10B981" />
      </linearGradient>
      {glow && (
        <filter id="heartGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#F43F5E" floodOpacity="0.45" />
        </filter>
      )}
    </defs>

    {/* Aorta Arch & Superior Vena Cava Pipes */}
    <path
      d="M20 12V6C20 4.89543 20.8954 4 22 4H26C27.1046 4 28 4.89543 28 6V12"
      stroke="url(#vectorAortaGrad)"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M28 7H33C34.1046 7 35 7.89543 35 9V14"
      stroke="url(#vectorAortaGrad)"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.85"
    />
    <path
      d="M15 9V14"
      stroke="url(#vectorAortaGrad)"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.75"
    />

    {/* Anatomical Cardiac Body */}
    <g filter={glow ? 'url(#heartGlow)' : undefined}>
      <path
        d="M24 43C24 43 11 33.5 8.5 24C6.2 15.2 12.8 11.5 18 14.5C21 16.2 23 19 24 21C25 19 27 16.2 30 14.5C35.2 11.5 41.8 15.2 39.5 24C37 33.5 24 43 24 43Z"
        stroke="url(#vectorHeartGrad)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        fill="rgba(244, 63, 94, 0.12)"
      />

      {/* Coronary Microvasculature & Nitric Oxide Endothelial Branches */}
      <path
        d="M24 21V33M24 27L17 23M24 30L31 26M19 29L16 32M28 32L32 35"
        stroke="#FDA4AF"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
      {/* Endothelial Wave Impulse */}
      <path
        d="M12 25L14 23L16 26L18 21L20 27L22 25"
        stroke="#34D399"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
    </g>
  </svg>
)

/** Vector 2: Brain Longevity & Neuroprotection (Electric Violet #A855F7) */
export const BrainLongevityIcon: React.FC<VectorIconProps> = ({ size = 24, glow = true, className = '', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
    {...props}
  >
    <defs>
      <linearGradient id="vectorBrainGrad" x1="6" y1="8" x2="42" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#D8B4FE" />
        <stop offset="50%" stopColor="#A855F7" />
        <stop offset="100%" stopColor="#7E22CE" />
      </linearGradient>
      {glow && (
        <filter id="brainGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#A855F7" floodOpacity="0.45" />
        </filter>
      )}
    </defs>

    <g filter={glow ? 'url(#brainGlow)' : undefined}>
      {/* Left & Right Cerebral Hemispheres Profile */}
      <path
        d="M24 10C19 10 16 11.5 13 14.5C9.5 18 8 22.5 9 27.5C10 32.5 13 36 17 38C19 39 21.5 39 24 39M24 10C29 10 32 11.5 35 14.5C38.5 18 40 22.5 39 27.5C38 32.5 35 36 31 38C29 39 26.5 39 24 39"
        stroke="url(#vectorBrainGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="rgba(168, 85, 247, 0.12)"
      />
      {/* Central Longitudinal Fissure */}
      <path
        d="M24 10V39"
        stroke="url(#vectorBrainGrad)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="2 3"
      />

      {/* Intricate Sulcal Convolutions & Neural Network Nodes */}
      <path
        d="M13 19C15.5 19 18 20.5 18 23C18 25.5 15.5 27 13 27M35 19C32.5 19 30 20.5 30 23C30 25.5 32.5 27 35 27"
        stroke="#E9D5FF"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M18 23H24M30 23H24M17 31C19.5 31 21 32.5 21 34.5M31 31C28.5 31 27 32.5 27 34.5"
        stroke="#E9D5FF"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Synaptic Density Micro-Nodes */}
      <circle cx="18" cy="23" r="2" fill="#E9D5FF" />
      <circle cx="30" cy="23" r="2" fill="#E9D5FF" />
      <circle cx="24" cy="17" r="2" fill="#C084FC" />
      <circle cx="21" cy="34" r="1.8" fill="#C084FC" />
      <circle cx="27" cy="34" r="1.8" fill="#C084FC" />
    </g>
  </svg>
)

/** Vector 3: Metabolic Flexibility & Glycemic Control (Amber Gold #F59E0B) */
export const MetabolicHealthIcon: React.FC<VectorIconProps> = ({ size = 24, glow = true, className = '', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
    {...props}
  >
    <defs>
      <linearGradient id="vectorMetabGrad" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FDE68A" />
        <stop offset="50%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
      {glow && (
        <filter id="metabGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#F59E0B" floodOpacity="0.45" />
        </filter>
      )}
    </defs>

    <g filter={glow ? 'url(#metabGlow)' : undefined}>
      {/* Precision Metabolic Cogwheel (Substrate Switching Gear) */}
      <path
        d="M24 6V9M24 39V42M6 24H9M39 24H42M11.3 11.3L13.5 13.5M34.5 34.5L36.7 36.7M11.3 36.7L13.5 34.5M34.5 13.5L36.7 11.3"
        stroke="url(#vectorMetabGrad)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle
        cx="24"
        cy="24"
        r="14.5"
        stroke="url(#vectorMetabGrad)"
        strokeWidth="2.5"
        fill="rgba(245, 158, 11, 0.12)"
      />

      {/* Hexose / Glucose Molecule Ring inside Core */}
      <path
        d="M24 15L31 19.5V28.5L24 33L17 28.5V19.5L24 15Z"
        stroke="#FDE68A"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      {/* Central Substrate Energy Spark */}
      <circle cx="24" cy="24" r="2.5" fill="#FDE68A" />
      <path
        d="M21 13L24 15L27 13"
        stroke="#FCD34D"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </g>
  </svg>
)

/** Vector 4: Cancer Defense & DNA Repair (Emerald Mint #10B981) */
export const CancerDefenseIcon: React.FC<VectorIconProps> = ({ size = 24, glow = true, className = '', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
    {...props}
  >
    <defs>
      <linearGradient id="vectorCancerGrad" x1="8" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#A7F3D0" />
        <stop offset="50%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
      {glow && (
        <filter id="cancerGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#10B981" floodOpacity="0.45" />
        </filter>
      )}
    </defs>

    <g filter={glow ? 'url(#cancerGlow)' : undefined}>
      {/* Fortified Polyhedral Immune Shield */}
      <path
        d="M24 6L39 12V22C39 31.5 32.5 39 24 42C15.5 39 9 31.5 9 22V12L24 6Z"
        stroke="url(#vectorCancerGrad)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        fill="rgba(16, 185, 129, 0.12)"
      />

      {/* Intact Double-Helix DNA Strands Protected Inside */}
      <path
        d="M20 15C22 18 26 21 28 24C26 27 22 30 20 33M28 15C26 18 22 21 20 24C22 27 26 30 28 33"
        stroke="#6EE7B7"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Base-Pair Hydrogen Bonds (PARP Enzymatic Repair Links) */}
      <line x1="22" y1="18" x2="26" y2="18" stroke="#A7F3D0" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="20" y1="24" x2="28" y2="24" stroke="#A7F3D0" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="22" y1="30" x2="26" y2="30" stroke="#A7F3D0" strokeWidth="1.6" strokeLinecap="round" />

      {/* Sentinel Star Emblem */}
      <circle cx="24" cy="11" r="1.5" fill="#A7F3D0" />
    </g>
  </svg>
)

/** Vector 5: Endocrine & Anabolic Balance (Anabolic Orange #F97316) */
export const EndocrineBalanceIcon: React.FC<VectorIconProps> = ({ size = 24, glow = true, className = '', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
    {...props}
  >
    <defs>
      <linearGradient id="vectorEndoGrad" x1="8" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FED7AA" />
        <stop offset="50%" stopColor="#F97316" />
        <stop offset="100%" stopColor="#C2410C" />
      </linearGradient>
      {glow && (
        <filter id="endoGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#F97316" floodOpacity="0.45" />
        </filter>
      )}
    </defs>

    <g filter={glow ? 'url(#endoGlow)' : undefined}>
      {/* Dynamic Circulating Endocrine Orbit Rings */}
      <path
        d="M24 7C14.6 7 7 14.6 7 24C7 33.4 14.6 41 24 41C31.5 41 37.8 36.1 40 29"
        stroke="url(#vectorEndoGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="rgba(249, 115, 22, 0.08)"
      />
      {/* Ascending Anabolic Surge Arrow */}
      <path
        d="M40 29L35 30.5M40 29L41.5 34.5"
        stroke="url(#vectorEndoGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Steroid Hormone 4-Ring Cyclopentanoperhydrophenanthrene Core */}
      <path
        d="M17 28L21 21H27L31 28L24 33L17 28Z"
        stroke="#FDBA74"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="rgba(251, 146, 60, 0.15)"
      />
      {/* Anabolic Energy Lightning Bolt across axis */}
      <path
        d="M26 13L21 23H27L22 33"
        stroke="#FED7AA"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Leydig Pulsatility Core */}
      <circle cx="35" cy="14" r="3" stroke="#FDBA74" strokeWidth="2" fill="#FED7AA" />
    </g>
  </svg>
)

/** Vector 6: Chronic Inflammation Reduction (Cryo Cyan #06B6D4) */
export const ChronicInflammationIcon: React.FC<VectorIconProps> = ({ size = 24, glow = true, className = '', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
    {...props}
  >
    <defs>
      <linearGradient id="vectorInflamGrad" x1="8" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#A5F3FC" />
        <stop offset="50%" stopColor="#06B6D4" />
        <stop offset="100%" stopColor="#0E7490" />
      </linearGradient>
      {glow && (
        <filter id="inflamGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#06B6D4" floodOpacity="0.45" />
        </filter>
      )}
    </defs>

    <g filter={glow ? 'url(#inflamGlow)' : undefined}>
      {/* Cryogenic Protective Shield Base */}
      <path
        d="M24 6L39 12V22C39 31.5 32.5 39 24 42C15.5 39 9 31.5 9 22V12L24 6Z"
        stroke="url(#vectorInflamGrad)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        fill="rgba(6, 182, 212, 0.12)"
      />

      {/* Chilled Inflammatory Flame being suppressed inside */}
      <path
        d="M24 14C24 14 27 18 27 21C27 22.5 26 23.5 25 24C27 25 29 27.5 29 30C29 33.5 26.5 36 24 36C21.5 36 19 33.5 19 30C19 28 20 26.5 21.5 25.5C20.5 24.5 21 23 21 21C21 18 24 14 24 14Z"
        stroke="#67E8F9"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="rgba(103, 232, 249, 0.2)"
      />

      {/* Subdued Cytokine Spark / Snowflake Core */}
      <path
        d="M24 23V31M20 27H28M21 24L27 30M27 24L21 30"
        stroke="#CFFAFE"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </g>
  </svg>
)

/** Vector 7: Bone Density & Connective Matrix (Platinum Silver Slate #94A3B8) */
export const BoneDensityIcon: React.FC<VectorIconProps> = ({ size = 24, glow = true, className = '', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
    {...props}
  >
    <defs>
      <linearGradient id="vectorBoneGrad" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#F1F5F9" />
        <stop offset="50%" stopColor="#CBD5E1" />
        <stop offset="100%" stopColor="#64748B" />
      </linearGradient>
      {glow && (
        <filter id="boneGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#94A3B8" floodOpacity="0.4" />
        </filter>
      )}
    </defs>

    <g filter={glow ? 'url(#boneGlow)' : undefined}>
      {/* Outer Cortical Bone Boundary Frame */}
      <rect
        x="8"
        y="8"
        width="32"
        height="32"
        rx="8"
        stroke="url(#vectorBoneGrad)"
        strokeWidth="2.5"
        fill="rgba(148, 163, 184, 0.12)"
      />

      {/* Trabecular Architecture Mineral Lattice (Hexagonal Mechanotransduction Scaffolding) */}
      <path
        d="M16 16L24 12L32 16V26L24 30L16 26V16Z"
        stroke="#E2E8F0"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M24 12V30M16 16L32 26M32 16L16 26"
        stroke="#94A3B8"
        strokeWidth="1.4"
        strokeLinecap="round"
      />

      {/* Micro-mineral density nodes */}
      <circle cx="24" cy="21" r="2.5" fill="#F8FAFC" />
      <circle cx="16" cy="16" r="1.8" fill="#CBD5E1" />
      <circle cx="32" cy="16" r="1.8" fill="#CBD5E1" />
      <circle cx="24" cy="30" r="1.8" fill="#CBD5E1" />

      {/* Piezo1 Axial Stress Load Arrows */}
      <path
        d="M24 5V8M24 40V43"
        stroke="#F1F5F9"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </g>
  </svg>
)

/** Vector 8: Cellular Longevity & Autophagy (Neon Lilac / Deep Fuchsia #C084FC) */
export const CellularLongevityIcon: React.FC<VectorIconProps> = ({ size = 24, glow = true, className = '', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
    {...props}
  >
    <defs>
      <linearGradient id="vectorCellGrad" x1="6" y1="8" x2="42" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#F5D0FE" />
        <stop offset="50%" stopColor="#C084FC" />
        <stop offset="100%" stopColor="#9333EA" />
      </linearGradient>
      {glow && (
        <filter id="cellGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#C084FC" floodOpacity="0.45" />
        </filter>
      )}
    </defs>

    <g filter={glow ? 'url(#cellGlow)' : undefined}>
      {/* Infinity Autophagy / Sirtuin Renewal Knot */}
      <path
        d="M17 18C13.5 18 10 20.5 10 24C10 27.5 13.5 30 17 30C22 30 26 18 31 18C34.5 18 38 20.5 38 24C38 27.5 34.5 30 31 30C26 30 22 18 17 18Z"
        stroke="url(#vectorCellGrad)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="rgba(192, 132, 252, 0.12)"
      />

      {/* Surrounding Dual-Membrane Epigenetic Clock Ring */}
      <circle
        cx="24"
        cy="24"
        r="17"
        stroke="url(#vectorCellGrad)"
        strokeWidth="1.5"
        strokeDasharray="3 4"
      />

      {/* Intracellular Mitophagy Lysosome Cleansing Nodes */}
      <circle cx="17" cy="24" r="2.5" fill="#F5D0FE" />
      <circle cx="31" cy="24" r="2.5" fill="#F5D0FE" />
      <circle cx="24" cy="24" r="2" fill="#E879F9" />
    </g>
  </svg>
)

// -----------------------------------------------------------------------------
// UNIFIED DYNAMIC VECTOR ICON COMPONENT
// -----------------------------------------------------------------------------

export interface LongevityVectorIconProps extends VectorIconProps {
  vector: LongevityVectorId | string
}

export const LongevityVectorIcon: React.FC<LongevityVectorIconProps> = ({ vector, ...props }) => {
  switch (vector) {
    case 'heart_health':
      return <HeartHealthIcon {...props} />
    case 'brain_longevity':
      return <BrainLongevityIcon {...props} />
    case 'metabolic_health':
      return <MetabolicHealthIcon {...props} />
    case 'cancer_defense':
      return <CancerDefenseIcon {...props} />
    case 'testosterone':
      return <EndocrineBalanceIcon {...props} />
    case 'chronic_inflammation':
      return <ChronicInflammationIcon {...props} />
    case 'bone_density':
      return <BoneDensityIcon {...props} />
    case 'cellular_longevity':
      return <CellularLongevityIcon {...props} />
    default:
      return <CellularLongevityIcon {...props} />
  }
}

export default LongevityVectorIcon

// -----------------------------------------------------------------------------
// OPTIONAL BADGE WRAPPER COMPONENT (With or without text label!)
// -----------------------------------------------------------------------------

export interface LongevityVectorBadgeProps {
  vector: LongevityVectorId | string
  showLabel?: boolean // Set to false for standalone icon badge without text!
  size?: number
  glow?: boolean
  className?: string
  onClick?: () => void
}

export const LongevityVectorBadge: React.FC<LongevityVectorBadgeProps> = ({
  vector,
  showLabel = true,
  size = 20,
  glow = true,
  className = '',
  onClick
}) => {
  const meta = LONGEVITY_VECTOR_METADATA[vector as LongevityVectorId] || {
    name: vector,
    colorHex: '#C084FC',
    bgGlow: 'rgba(192, 132, 252, 0.25)',
    borderColor: 'border-purple-400/40',
    textColor: 'text-purple-300'
  }

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-xl border bg-slate-900/80 transition-all ${meta.borderColor} ${
        onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
      } ${className}`}
      style={{
        boxShadow: glow ? `0 0 12px ${meta.bgGlow}` : undefined
      }}
      title={meta.name}
    >
      <LongevityVectorIcon vector={vector} size={size} glow={glow} />
      {showLabel && (
        <span className={`text-xs font-semibold whitespace-nowrap ${meta.textColor}`}>
          {meta.name}
        </span>
      )}
    </div>
  )
}
