'use client'

import React from 'react'

export type FunctionalOutcomeId =
  | 'focus'
  | 'sleep_quality'
  | 'deep_sleep'
  | 'energy'
  | 'skin_clarity'
  | 'libido'
  | 'stress'
  | 'mood'
  | 'joint_comfort'
  | 'muscle_hypertrophy'
  | 'strength'
  | 'athletic_endurance'
  | 'digestive_comfort'
  | 'waking_restedness'
  | 'calmness'
  | 'immune_resilience'
  | 'brain_fog'
  | 'satiety'
  | 'soreness'
  | 'sleep_latency'
  | 'emotional_resilience'
  | 'motivation'
  | 'physical_fatigue'
  | 'productivity'
  | 'pain'

export type FunctionalOutcomeCategory = 'cognitive' | 'sleep' | 'vitality' | 'physical' | 'recovery' | 'metabolic'

export interface OutcomeIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number
  glow?: boolean
  className?: string
}

export interface FunctionalOutcomeMeta {
  id: FunctionalOutcomeId
  name: string
  shortLabel: string
  category: FunctionalOutcomeCategory
  colorHex: string
  secondaryColorHex: string
  bgGlow: string
  borderColor: string
  textColor: string
  description: string
}

export const FUNCTIONAL_OUTCOMES_METADATA: Record<FunctionalOutcomeId, FunctionalOutcomeMeta> = {
  focus: {
    id: 'focus',
    name: 'Cognitive Focus & Clarity',
    shortLabel: 'Focus',
    category: 'cognitive',
    colorHex: '#8B5CF6',
    secondaryColorHex: '#06B6D4',
    bgGlow: 'rgba(139, 92, 246, 0.25)',
    borderColor: 'border-purple-500/40',
    textColor: 'text-purple-400',
    description: 'Laser focus, working memory retention, mental sharpness & flow state.'
  },
  sleep_quality: {
    id: 'sleep_quality',
    name: 'Sleep Quality',
    shortLabel: 'Sleep Quality',
    category: 'sleep',
    colorHex: '#6366F1',
    secondaryColorHex: '#A5B4FC',
    bgGlow: 'rgba(99, 102, 241, 0.25)',
    borderColor: 'border-indigo-500/40',
    textColor: 'text-indigo-400',
    description: 'Deep & REM sleep architecture, restorative overnight recovery & fewer awakenings.'
  },
  deep_sleep: {
    id: 'deep_sleep',
    name: 'Deep Sleep',
    shortLabel: 'Deep Sleep',
    category: 'sleep',
    colorHex: '#4F46E5',
    secondaryColorHex: '#818CF8',
    bgGlow: 'rgba(79, 70, 229, 0.25)',
    borderColor: 'border-indigo-600/40',
    textColor: 'text-indigo-300',
    description: 'Stage 3 slow-wave physical cellular repair & glymphatic brain clearance.'
  },
  energy: {
    id: 'energy',
    name: 'Energy & Mitochondria',
    shortLabel: 'Energy',
    category: 'vitality',
    colorHex: '#EAB308',
    secondaryColorHex: '#FEF08A',
    bgGlow: 'rgba(234, 179, 8, 0.25)',
    borderColor: 'border-yellow-500/40',
    textColor: 'text-yellow-400',
    description: 'Sustained daytime vitality, cellular ATP production & eliminating energy crashes.'
  },
  skin_clarity: {
    id: 'skin_clarity',
    name: 'Skin Clarity & Health',
    shortLabel: 'Skin Clarity',
    category: 'vitality',
    colorHex: '#FB7185',
    secondaryColorHex: '#FEE2E2',
    bgGlow: 'rgba(251, 113, 133, 0.25)',
    borderColor: 'border-rose-400/40',
    textColor: 'text-rose-300',
    description: 'Dermal barrier integrity, collagen density, elasticity & cellular turnover.'
  },
  libido: {
    id: 'libido',
    name: 'Libido & Sexual Vitality',
    shortLabel: 'Libido',
    category: 'vitality',
    colorHex: '#E11D48',
    secondaryColorHex: '#FDA4AF',
    bgGlow: 'rgba(225, 29, 72, 0.25)',
    borderColor: 'border-rose-600/40',
    textColor: 'text-rose-400',
    description: 'Sexual desire, arousal, reproductive health & endocrine vitality signaling.'
  },
  stress: {
    id: 'stress',
    name: 'Stress & Autonomic Balance',
    shortLabel: 'Stress / HRV',
    category: 'recovery',
    colorHex: '#10B981',
    secondaryColorHex: '#6EE7B7',
    bgGlow: 'rgba(16, 185, 129, 0.25)',
    borderColor: 'border-emerald-500/40',
    textColor: 'text-emerald-400',
    description: 'High parasympathetic vagal tone, rapid autonomic recovery & lower cortisol.'
  },
  mood: {
    id: 'mood',
    name: 'Mood & Emotional Resilience',
    shortLabel: 'Mood',
    category: 'cognitive',
    colorHex: '#F59E0B',
    secondaryColorHex: '#FCD34D',
    bgGlow: 'rgba(245, 158, 11, 0.25)',
    borderColor: 'border-amber-500/40',
    textColor: 'text-amber-400',
    description: 'Positive neurochemical valence, emotional equilibrium & psychological well-being.'
  },
  joint_comfort: {
    id: 'joint_comfort',
    name: 'Joint Comfort & Mobility',
    shortLabel: 'Joint Comfort',
    category: 'recovery',
    colorHex: '#38BDF8',
    secondaryColorHex: '#BAE6FD',
    bgGlow: 'rgba(56, 189, 248, 0.25)',
    borderColor: 'border-sky-400/40',
    textColor: 'text-sky-300',
    description: 'Cartilage mobility, synovial lubrication, connective tissue repair & joint ease.'
  },
  muscle_hypertrophy: {
    id: 'muscle_hypertrophy',
    name: 'Muscle Hypertrophy & Growth',
    shortLabel: 'Hypertrophy',
    category: 'physical',
    colorHex: '#EF4444',
    secondaryColorHex: '#FCA5A5',
    bgGlow: 'rgba(239, 68, 68, 0.25)',
    borderColor: 'border-red-500/40',
    textColor: 'text-red-400',
    description: 'Muscle protein synthesis, myofibrillar growth & lean mass retention.'
  },
  strength: {
    id: 'strength',
    name: 'Strength & Power',
    shortLabel: 'Strength',
    category: 'physical',
    colorHex: '#F97316',
    secondaryColorHex: '#E2E8F0',
    bgGlow: 'rgba(249, 115, 22, 0.25)',
    borderColor: 'border-orange-500/40',
    textColor: 'text-orange-400',
    description: 'Peak neuromuscular force output, power capacity & training output.'
  },
  athletic_endurance: {
    id: 'athletic_endurance',
    name: 'Athletic & Aerobic Endurance',
    shortLabel: 'Endurance',
    category: 'physical',
    colorHex: '#06B6D4',
    secondaryColorHex: '#F97316',
    bgGlow: 'rgba(6, 182, 212, 0.25)',
    borderColor: 'border-cyan-500/40',
    textColor: 'text-cyan-400',
    description: 'Cardiorespiratory stamina, VO2 max, aerobic efficiency & delayed lactate fatigue.'
  },
  digestive_comfort: {
    id: 'digestive_comfort',
    name: 'Digestive Comfort & Gut Health',
    shortLabel: 'Digestion',
    category: 'vitality',
    colorHex: '#10B981',
    secondaryColorHex: '#A7F3D0',
    bgGlow: 'rgba(16, 185, 129, 0.25)',
    borderColor: 'border-emerald-500/40',
    textColor: 'text-emerald-400',
    description: 'Smooth gut motility, microbiome balance, intestinal barrier & reduced bloating.'
  },
  waking_restedness: {
    id: 'waking_restedness',
    name: 'Waking Restedness',
    shortLabel: 'Waking Rested',
    category: 'sleep',
    colorHex: '#F59E0B',
    secondaryColorHex: '#F43F5E',
    bgGlow: 'rgba(245, 158, 11, 0.25)',
    borderColor: 'border-amber-500/40',
    textColor: 'text-amber-400',
    description: 'Waking alert and refreshed with optimal morning circadian cortisol response.'
  },
  calmness: {
    id: 'calmness',
    name: 'Calmness & Anxiety Relief',
    shortLabel: 'Calmness',
    category: 'cognitive',
    colorHex: '#06B6D4',
    secondaryColorHex: '#6EE7B7',
    bgGlow: 'rgba(6, 182, 212, 0.25)',
    borderColor: 'border-cyan-500/40',
    textColor: 'text-cyan-400',
    description: 'Central nervous system relaxation, lower trait anxiety & inner tranquility.'
  },
  immune_resilience: {
    id: 'immune_resilience',
    name: 'Immune Resilience',
    shortLabel: 'Immunity',
    category: 'recovery',
    colorHex: '#14B8A6',
    secondaryColorHex: '#5EEAD4',
    bgGlow: 'rgba(20, 184, 166, 0.25)',
    borderColor: 'border-teal-500/40',
    textColor: 'text-teal-400',
    description: 'Innate and adaptive immune defense & reduced susceptibility to infections.'
  },
  brain_fog: {
    id: 'brain_fog',
    name: 'Brain Fog Reduction',
    shortLabel: 'Mental Clarity',
    category: 'cognitive',
    colorHex: '#3B82F6',
    secondaryColorHex: '#93C5FD',
    bgGlow: 'rgba(59, 130, 246, 0.25)',
    borderColor: 'border-blue-500/40',
    textColor: 'text-blue-400',
    description: 'Fast neural processing speed, crisp mental acuity & cerebral metabolic clearance.'
  },
  satiety: {
    id: 'satiety',
    name: 'Satiety & Appetite Control',
    shortLabel: 'Satiety',
    category: 'metabolic',
    colorHex: '#D97706',
    secondaryColorHex: '#FDE68A',
    bgGlow: 'rgba(217, 119, 6, 0.25)',
    borderColor: 'border-amber-600/40',
    textColor: 'text-amber-500',
    description: 'Optimal leptin/ghrelin signaling, prolonged fullness & craving mitigation.'
  },
  soreness: {
    id: 'soreness',
    name: 'Soreness (DOMS) Recovery',
    shortLabel: 'DOMS Recovery',
    category: 'recovery',
    colorHex: '#06B6D4',
    secondaryColorHex: '#E0F2FE',
    bgGlow: 'rgba(6, 182, 212, 0.25)',
    borderColor: 'border-cyan-500/40',
    textColor: 'text-cyan-400',
    description: 'Delayed onset muscle soreness (DOMS) reduction & accelerated muscular recovery.'
  },
  sleep_latency: {
    id: 'sleep_latency',
    name: 'Sleep Latency (Falling Asleep)',
    shortLabel: 'Sleep Latency',
    category: 'sleep',
    colorHex: '#818CF8',
    secondaryColorHex: '#C7D2FE',
    bgGlow: 'rgba(129, 140, 248, 0.25)',
    borderColor: 'border-indigo-400/40',
    textColor: 'text-indigo-300',
    description: 'Speed of falling asleep peacefully without tossing and turning.'
  },
  emotional_resilience: {
    id: 'emotional_resilience',
    name: 'Emotional Resilience',
    shortLabel: 'Resilience',
    category: 'cognitive',
    colorHex: '#A855F7',
    secondaryColorHex: '#E9D5FF',
    bgGlow: 'rgba(168, 85, 247, 0.25)',
    borderColor: 'border-purple-500/40',
    textColor: 'text-purple-400',
    description: 'Stress adaptability, heart rate variability (HRV) rebound & emotional control.'
  },
  motivation: {
    id: 'motivation',
    name: 'Motivation & Drive',
    shortLabel: 'Motivation',
    category: 'cognitive',
    colorHex: '#F97316',
    secondaryColorHex: '#FDBA74',
    bgGlow: 'rgba(249, 115, 22, 0.25)',
    borderColor: 'border-orange-500/40',
    textColor: 'text-orange-400',
    description: 'Dopamine-driven initiative, reward anticipation & productivity readiness.'
  },
  physical_fatigue: {
    id: 'physical_fatigue',
    name: 'Physical Fatigue Reduction',
    shortLabel: 'Fatigue Relief',
    category: 'vitality',
    colorHex: '#10B981',
    secondaryColorHex: '#34D399',
    bgGlow: 'rgba(16, 185, 129, 0.25)',
    borderColor: 'border-emerald-500/40',
    textColor: 'text-emerald-400',
    description: 'Mitigating systemic exhaustion, muscular burnout & heavy-limb sensations.'
  },
  productivity: {
    id: 'productivity',
    name: 'Productivity & Deep Work',
    shortLabel: 'Productivity',
    category: 'cognitive',
    colorHex: '#10B981',
    secondaryColorHex: '#3B82F6',
    bgGlow: 'rgba(16, 185, 129, 0.25)',
    borderColor: 'border-emerald-500/40',
    textColor: 'text-emerald-400',
    description: 'High-leverage work output, cognitive stamina & deep work efficiency.'
  },
  pain: {
    id: 'pain',
    name: 'Musculoskeletal Pain Relief',
    shortLabel: 'Pain Relief',
    category: 'recovery',
    colorHex: '#10B981',
    secondaryColorHex: '#D1FAE5',
    bgGlow: 'rgba(16, 185, 129, 0.25)',
    borderColor: 'border-emerald-500/40',
    textColor: 'text-emerald-400',
    description: 'Systemic inflammatory relief, joint comfort & musculoskeletal ease.'
  }
}

// -----------------------------------------------------------------------------
// INDIVIDUAL DETAILED FUNCTIONAL OUTCOME ICONS (48x48 Multi-layer SVGs)
// -----------------------------------------------------------------------------

/** 1. Focus */
export const FocusIcon: React.FC<OutcomeIconProps> = ({ size = 24, glow = true, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`} {...props}>
    <defs>
      <linearGradient id="focusGrad" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#C084FC" />
        <stop offset="50%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#06B6D4" />
      </linearGradient>
      {glow && (
        <filter id="focusGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#8B5CF6" floodOpacity="0.45" />
        </filter>
      )}
    </defs>
    <g filter={glow ? 'url(#focusGlow)' : undefined}>
      <circle cx="24" cy="24" r="16" stroke="url(#focusGrad)" strokeWidth="2.5" strokeDasharray="6 3" fill="rgba(139, 92, 246, 0.12)" />
      <circle cx="24" cy="24" r="9" stroke="url(#focusGrad)" strokeWidth="2" />
      <circle cx="24" cy="24" r="3" fill="#A5F3FC" />
      <line x1="24" y1="4" x2="24" y2="10" stroke="#C084FC" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="24" y1="38" x2="24" y2="44" stroke="#C084FC" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="4" y1="24" x2="10" y2="24" stroke="#C084FC" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="38" y1="24" x2="44" y2="24" stroke="#C084FC" strokeWidth="2.5" strokeLinecap="round" />
    </g>
  </svg>
)

/** 2. Sleep Quality */
export const SleepQualityIcon: React.FC<OutcomeIconProps> = ({ size = 24, glow = true, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`} {...props}>
    <defs>
      <linearGradient id="sleepQGrad" x1="10" y1="8" x2="38" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#C7D2FE" />
        <stop offset="50%" stopColor="#6366F1" />
        <stop offset="100%" stopColor="#4338CA" />
      </linearGradient>
      {glow && (
        <filter id="sleepQGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#6366F1" floodOpacity="0.5" />
        </filter>
      )}
    </defs>
    <g filter={glow ? 'url(#sleepQGlow)' : undefined}>
      <path d="M34 26C33 34 26 40 18 40C12 40 7 36 5 31C13 31 20 25 21 17C21 12 19 8 16 5C27 5 35 14 34 26Z" stroke="url(#sleepQGrad)" strokeWidth="2.5" strokeLinejoin="round" fill="rgba(99, 102, 241, 0.15)" />
      <circle cx="34" cy="11" r="2" fill="#E0E7FF" />
      <circle cx="41" cy="18" r="1.5" fill="#E0E7FF" />
      <path d="M12 28L14 26L16 29L19 24L22 30L25 28" stroke="#A5B4FC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
)

/** 3. Deep Sleep */
export const DeepSleepIcon: React.FC<OutcomeIconProps> = ({ size = 24, glow = true, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`} {...props}>
    <defs>
      <linearGradient id="deepSleepGrad" x1="6" y1="8" x2="42" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#A5B4FC" />
        <stop offset="50%" stopColor="#4F46E5" />
        <stop offset="100%" stopColor="#312E81" />
      </linearGradient>
      {glow && (
        <filter id="deepSleepGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#4F46E5" floodOpacity="0.5" />
        </filter>
      )}
    </defs>
    <g filter={glow ? 'url(#deepSleepGlow)' : undefined}>
      <circle cx="24" cy="24" r="16" stroke="url(#deepSleepGrad)" strokeWidth="2" strokeDasharray="3 3" fill="rgba(79, 70, 229, 0.12)" />
      <path d="M8 24C12 24 14 14 18 14C22 14 24 34 28 34C32 34 34 24 40 24" stroke="#818CF8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="18" cy="14" r="2" fill="#E0E7FF" />
      <circle cx="28" cy="34" r="2" fill="#E0E7FF" />
    </g>
  </svg>
)

/** 4. Energy & Mitochondria */
export const EnergyIcon: React.FC<OutcomeIconProps> = ({ size = 24, glow = true, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`} {...props}>
    <defs>
      <linearGradient id="energyGrad" x1="8" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="50%" stopColor="#EAB308" />
        <stop offset="100%" stopColor="#CA8A04" />
      </linearGradient>
      {glow && (
        <filter id="energyGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#EAB308" floodOpacity="0.5" />
        </filter>
      )}
    </defs>
    <g filter={glow ? 'url(#energyGlow)' : undefined}>
      <path d="M26 4L11 26H24L21 44L37 21H24L26 4Z" stroke="url(#energyGrad)" strokeWidth="2.5" strokeLinejoin="round" fill="rgba(234, 179, 8, 0.18)" />
      <circle cx="12" cy="10" r="1.5" fill="#FEF08A" />
      <circle cx="37" cy="37" r="1.5" fill="#FEF08A" />
    </g>
  </svg>
)

/** 5. Skin Clarity & Health */
export const SkinClarityIcon: React.FC<OutcomeIconProps> = ({ size = 24, glow = true, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`} {...props}>
    <defs>
      <linearGradient id="skinGrad" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFE4E6" />
        <stop offset="50%" stopColor="#FB7185" />
        <stop offset="100%" stopColor="#E11D48" />
      </linearGradient>
      {glow && (
        <filter id="skinGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#FB7185" floodOpacity="0.45" />
        </filter>
      )}
    </defs>
    <g filter={glow ? 'url(#skinGlow)' : undefined}>
      <path d="M24 6L27 17L38 20L27 23L24 34L21 23L10 20L21 17L24 6Z" stroke="url(#skinGrad)" strokeWidth="2" strokeLinejoin="round" fill="rgba(251, 113, 133, 0.2)" />
      <path d="M37 29L38.5 34L43.5 35.5L38.5 37L37 42L35.5 37L30.5 35.5L35.5 34L37 29Z" stroke="#FECDD3" strokeWidth="1.5" strokeLinejoin="round" fill="#FFE4E6" />
      <circle cx="12" cy="34" r="2" fill="#FFE4E6" />
    </g>
  </svg>
)

/** 6. Libido & Sexual Vitality */
export const LibidoIcon: React.FC<OutcomeIconProps> = ({ size = 24, glow = true, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`} {...props}>
    <defs>
      <linearGradient id="libidoGrad" x1="8" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FDA4AF" />
        <stop offset="50%" stopColor="#E11D48" />
        <stop offset="100%" stopColor="#881337" />
      </linearGradient>
      {glow && (
        <filter id="libidoGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#E11D48" floodOpacity="0.5" />
        </filter>
      )}
    </defs>
    <g filter={glow ? 'url(#libidoGlow)' : undefined}>
      <path d="M24 6C24 6 32 14 32 24C32 29 28.5 34 24 37C19.5 34 16 29 16 24C16 14 24 6 24 6Z" stroke="url(#libidoGrad)" strokeWidth="2.5" strokeLinejoin="round" fill="rgba(225, 29, 72, 0.15)" />
      <path d="M24 16C24 16 28 20 28 24C28 26.5 26 29 24 30C22 29 20 26.5 20 24C20 20 24 16 24 16Z" fill="#FDA4AF" />
      <path d="M12 28C10 32 12 37 17 40M36 28C38 32 36 37 31 40" stroke="#FB7185" strokeWidth="2" strokeLinecap="round" />
    </g>
  </svg>
)

/** 7. Stress & Autonomic Balance (HRV) */
export const StressIcon: React.FC<OutcomeIconProps> = ({ size = 24, glow = true, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`} {...props}>
    <defs>
      <linearGradient id="stressGrad" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#A7F3D0" />
        <stop offset="50%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
      {glow && (
        <filter id="stressGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#10B981" floodOpacity="0.45" />
        </filter>
      )}
    </defs>
    <g filter={glow ? 'url(#stressGlow)' : undefined}>
      <path d="M24 39L21.5 36.5C12 27 7 22.5 7 16C7 10.5 11 6.5 16.5 6.5C19.8 6.5 22.8 8.2 24 10.5C25.2 8.2 28.2 6.5 31.5 6.5C37 6.5 41 10.5 41 16C41 22.5 36 27 26.5 36.5L24 39Z" stroke="url(#stressGrad)" strokeWidth="2.5" fill="rgba(16, 185, 129, 0.1)" />
      <path d="M12 22H17L19 16L23 28L26 19L28 24H36" stroke="#6EE7B7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
)

/** 8. Mood & Emotional Resilience */
export const MoodIcon: React.FC<OutcomeIconProps> = ({ size = 24, glow = true, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`} {...props}>
    <defs>
      <linearGradient id="moodGrad" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FDE68A" />
        <stop offset="50%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
      {glow && (
        <filter id="moodGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#F59E0B" floodOpacity="0.45" />
        </filter>
      )}
    </defs>
    <g filter={glow ? 'url(#moodGlow)' : undefined}>
      <circle cx="24" cy="24" r="16" stroke="url(#moodGrad)" strokeWidth="2.5" fill="rgba(245, 158, 11, 0.12)" />
      <circle cx="18" cy="20" r="2.5" fill="#FDE68A" />
      <circle cx="30" cy="20" r="2.5" fill="#FDE68A" />
      <path d="M16 27C18 32 30 32 32 27" stroke="url(#moodGrad)" strokeWidth="2.5" strokeLinecap="round" />
    </g>
  </svg>
)

/** 9. Joint Comfort & Mobility */
export const JointComfortIcon: React.FC<OutcomeIconProps> = ({ size = 24, glow = true, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`} {...props}>
    <defs>
      <linearGradient id="jointGrad" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#BAE6FD" />
        <stop offset="50%" stopColor="#38BDF8" />
        <stop offset="100%" stopColor="#0284C7" />
      </linearGradient>
      {glow && (
        <filter id="jointGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#38BDF8" floodOpacity="0.45" />
        </filter>
      )}
    </defs>
    <g filter={glow ? 'url(#jointGlow)' : undefined}>
      <path d="M24 6V18M18 16C18 19 21 21 24 21C27 21 30 19 30 16" stroke="url(#jointGrad)" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="24" cy="24" rx="9" ry="3.5" stroke="#BAE6FD" strokeWidth="2" fill="rgba(56, 189, 248, 0.25)" />
      <path d="M24 42V30M18 32C18 29 21 27 24 27C27 27 30 29 30 32" stroke="url(#jointGrad)" strokeWidth="3" strokeLinecap="round" />
      <path d="M12 21C10 24 10 27 12 30M36 21C38 24 38 27 36 30" stroke="#7DD3FC" strokeWidth="2" strokeLinecap="round" />
    </g>
  </svg>
)

/** 10. Muscle Hypertrophy & Growth */
export const MuscleHypertrophyIcon: React.FC<OutcomeIconProps> = ({ size = 24, glow = true, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`} {...props}>
    <defs>
      <linearGradient id="muscleGrad" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FCA5A5" />
        <stop offset="50%" stopColor="#EF4444" />
        <stop offset="100%" stopColor="#991B1B" />
      </linearGradient>
      {glow && (
        <filter id="muscleGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#EF4444" floodOpacity="0.45" />
        </filter>
      )}
    </defs>
    <g filter={glow ? 'url(#muscleGlow)' : undefined}>
      <path d="M11 26C11 20 16 16 23 16C26 12 33 13 36 17C39 21 37 27 34 30C32 33 26 36 19 36C14 36 11 31 11 26Z" stroke="url(#muscleGrad)" strokeWidth="2.5" strokeLinejoin="round" fill="rgba(239, 68, 68, 0.15)" />
      <path d="M19 16C21 21 24 25 31 25" stroke="#FCA5A5" strokeWidth="2" strokeLinecap="round" />
      <path d="M15 24C18 27 22 30 27 30" stroke="#FCA5A5" strokeWidth="1.8" strokeLinecap="round" />
    </g>
  </svg>
)

/** 11. Strength & Power */
export const StrengthIcon: React.FC<OutcomeIconProps> = ({ size = 24, glow = true, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`} {...props}>
    <defs>
      <linearGradient id="strengthGrad" x1="6" y1="8" x2="42" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FED7AA" />
        <stop offset="50%" stopColor="#F97316" />
        <stop offset="100%" stopColor="#C2410C" />
      </linearGradient>
      {glow && (
        <filter id="strengthGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#F97316" floodOpacity="0.45" />
        </filter>
      )}
    </defs>
    <g filter={glow ? 'url(#strengthGlow)' : undefined}>
      <line x1="6" y1="24" x2="42" y2="24" stroke="url(#strengthGrad)" strokeWidth="4" strokeLinecap="round" />
      <rect x="12" y="14" width="4" height="20" rx="2" fill="#FED7AA" stroke="#EA580C" strokeWidth="1.5" />
      <rect x="8" y="17" width="4" height="14" rx="2" fill="#FDBA74" />
      <rect x="32" y="14" width="4" height="20" rx="2" fill="#FED7AA" stroke="#EA580C" strokeWidth="1.5" />
      <rect x="36" y="17" width="4" height="14" rx="2" fill="#FDBA74" />
      <circle cx="24" cy="24" r="3" fill="#FED7AA" />
    </g>
  </svg>
)

/** 12. Athletic & Aerobic Endurance */
export const AthleticEnduranceIcon: React.FC<OutcomeIconProps> = ({ size = 24, glow = true, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`} {...props}>
    <defs>
      <linearGradient id="endurGrad" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#A5F3FC" />
        <stop offset="50%" stopColor="#06B6D4" />
        <stop offset="100%" stopColor="#0E7490" />
      </linearGradient>
      {glow && (
        <filter id="endurGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#06B6D4" floodOpacity="0.45" />
        </filter>
      )}
    </defs>
    <g filter={glow ? 'url(#endurGlow)' : undefined}>
      <circle cx="28" cy="11" r="4" fill="#CFFAFE" stroke="url(#endurGrad)" strokeWidth="1.5" />
      <path d="M22 17L18 24L24 28L21 40M24 28L29 23L35 25M18 24L11 26M29 23L34 16" stroke="url(#endurGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="6" y1="36" x2="14" y2="36" stroke="#67E8F9" strokeWidth="2" strokeLinecap="round" />
      <line x1="9" y1="41" x2="17" y2="41" stroke="#67E8F9" strokeWidth="1.5" strokeLinecap="round" />
    </g>
  </svg>
)

/** 13. Digestive Comfort & Gut Health */
export const DigestiveComfortIcon: React.FC<OutcomeIconProps> = ({ size = 24, glow = true, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`} {...props}>
    <defs>
      <linearGradient id="digGrad" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#A7F3D0" />
        <stop offset="50%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
      {glow && (
        <filter id="digGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#10B981" floodOpacity="0.45" />
        </filter>
      )}
    </defs>
    <g filter={glow ? 'url(#digGlow)' : undefined}>
      <path d="M21 8V16C21 16 13 17 11 25C9 33 16 38 23 38C30 38 36 33 36 24C36 15 28 12 28 8" stroke="url(#digGrad)" strokeWidth="2.5" strokeLinecap="round" fill="rgba(16, 185, 129, 0.12)" />
      <path d="M18 24C20 22 24 22 26 25C28 28 30 28 32 26" stroke="#6EE7B7" strokeWidth="2" strokeLinecap="round" />
      <circle cx="20" cy="30" r="1.5" fill="#D1FAE5" />
      <circle cx="27" cy="31" r="1.5" fill="#D1FAE5" />
    </g>
  </svg>
)

/** 14. Waking Restedness */
export const WakingRestednessIcon: React.FC<OutcomeIconProps> = ({ size = 24, glow = true, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`} {...props}>
    <defs>
      <linearGradient id="wakeGrad" x1="8" y1="12" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FDE68A" />
        <stop offset="50%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#F43F5E" />
      </linearGradient>
      {glow && (
        <filter id="wakeGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#F59E0B" floodOpacity="0.45" />
        </filter>
      )}
    </defs>
    <g filter={glow ? 'url(#wakeGlow)' : undefined}>
      <line x1="8" y1="36" x2="40" y2="36" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M14 36C14 26 18.5 20 24 20C29.5 20 34 26 34 36" stroke="url(#wakeGrad)" strokeWidth="2.5" fill="rgba(245, 158, 11, 0.15)" />
      <line x1="24" y1="10" x2="24" y2="15" stroke="#FDE68A" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="14" y1="14" x2="18" y2="17" stroke="#FDE68A" strokeWidth="2" strokeLinecap="round" />
      <line x1="34" y1="14" x2="30" y2="17" stroke="#FDE68A" strokeWidth="2" strokeLinecap="round" />
    </g>
  </svg>
)

/** 15. Calmness & Anxiety Relief */
export const CalmnessIcon: React.FC<OutcomeIconProps> = ({ size = 24, glow = true, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`} {...props}>
    <defs>
      <linearGradient id="calmGrad" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#A5F3FC" />
        <stop offset="50%" stopColor="#06B6D4" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
      {glow && (
        <filter id="calmGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#06B6D4" floodOpacity="0.45" />
        </filter>
      )}
    </defs>
    <g filter={glow ? 'url(#calmGlow)' : undefined}>
      <path d="M24 8C24 8 16 18 16 26C16 31 19.5 35 24 35C28.5 35 32 31 32 26C32 18 24 8 24 8Z" stroke="url(#calmGrad)" strokeWidth="2.5" strokeLinejoin="round" fill="rgba(6, 182, 212, 0.15)" />
      <path d="M10 39C14 37 18 41 24 39C30 37 34 41 38 39" stroke="#67E8F9" strokeWidth="2" strokeLinecap="round" />
      <circle cx="24" cy="26" r="2.5" fill="#CFFAFE" />
    </g>
  </svg>
)

/** 16. Immune Resilience */
export const ImmuneResilienceIcon: React.FC<OutcomeIconProps> = ({ size = 24, glow = true, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`} {...props}>
    <defs>
      <linearGradient id="immGrad" x1="8" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#99F6E4" />
        <stop offset="50%" stopColor="#14B8A6" />
        <stop offset="100%" stopColor="#0F766E" />
      </linearGradient>
      {glow && (
        <filter id="immGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#14B8A6" floodOpacity="0.45" />
        </filter>
      )}
    </defs>
    <g filter={glow ? 'url(#immGlow)' : undefined}>
      <path d="M24 6L39 12V22C39 31.5 32.5 39 24 42C15.5 39 9 31.5 9 22V12L24 6Z" stroke="url(#immGrad)" strokeWidth="2.5" strokeLinejoin="round" fill="rgba(20, 184, 166, 0.12)" />
      <path d="M24 16V30M17 23H31" stroke="#5EEAD4" strokeWidth="2.5" strokeLinecap="round" />
    </g>
  </svg>
)

/** 17. Brain Fog Reduction */
export const BrainFogIcon: React.FC<OutcomeIconProps> = ({ size = 24, glow = true, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`} {...props}>
    <defs>
      <linearGradient id="fogGrad" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#93C5FD" />
        <stop offset="50%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#1D4ED8" />
      </linearGradient>
      {glow && (
        <filter id="fogGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#3B82F6" floodOpacity="0.45" />
        </filter>
      )}
    </defs>
    <g filter={glow ? 'url(#fogGlow)' : undefined}>
      <path d="M17 18C17 14 20 10 24 10C28 10 31 14 31 18C31 22 28 24 27 27H21C20 24 17 22 17 18Z" stroke="url(#fogGrad)" strokeWidth="2.5" strokeLinejoin="round" fill="rgba(59, 130, 246, 0.15)" />
      <line x1="21" y1="31" x2="27" y2="31" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
      <line x1="22" y1="35" x2="26" y2="35" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
      <line x1="24" y1="4" x2="24" y2="7" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
      <line x1="34" y1="12" x2="37" y2="10" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
      <line x1="14" y1="12" x2="11" y2="10" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
    </g>
  </svg>
)

/** 18. Satiety & Appetite Control */
export const SatietyIcon: React.FC<OutcomeIconProps> = ({ size = 24, glow = true, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`} {...props}>
    <defs>
      <linearGradient id="satGrad" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FDE68A" />
        <stop offset="50%" stopColor="#D97706" />
        <stop offset="100%" stopColor="#92400E" />
      </linearGradient>
      {glow && (
        <filter id="satGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#D97706" floodOpacity="0.45" />
        </filter>
      )}
    </defs>
    <g filter={glow ? 'url(#satGlow)' : undefined}>
      <line x1="24" y1="8" x2="24" y2="38" stroke="url(#satGrad)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="10" y1="15" x2="38" y2="15" stroke="url(#satGrad)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M10 15L15 26H7L12 15" stroke="#FDE68A" strokeWidth="1.8" fill="rgba(217, 119, 6, 0.2)" strokeLinejoin="round" />
      <path d="M38 15L43 26H35L40 15" stroke="#FDE68A" strokeWidth="1.8" fill="rgba(217, 119, 6, 0.2)" strokeLinejoin="round" />
      <line x1="16" y1="38" x2="32" y2="38" stroke="url(#satGrad)" strokeWidth="2.5" strokeLinecap="round" />
    </g>
  </svg>
)

/** 19. Soreness (DOMS) Recovery */
export const SorenessIcon: React.FC<OutcomeIconProps> = ({ size = 24, glow = true, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`} {...props}>
    <defs>
      <linearGradient id="soreGrad" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#E0F2FE" />
        <stop offset="50%" stopColor="#06B6D4" />
        <stop offset="100%" stopColor="#0369A1" />
      </linearGradient>
      {glow && (
        <filter id="soreGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#06B6D4" floodOpacity="0.45" />
        </filter>
      )}
    </defs>
    <g filter={glow ? 'url(#soreGlow)' : undefined}>
      <path d="M24 8L36 15V29L24 36L12 29V15L24 8Z" stroke="url(#soreGrad)" strokeWidth="2.5" strokeLinejoin="round" fill="rgba(6, 182, 212, 0.15)" />
      <line x1="24" y1="8" x2="24" y2="36" stroke="#A5F3FC" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="12" y1="15" x2="36" y2="29" stroke="#A5F3FC" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="36" y1="15" x2="12" y2="29" stroke="#A5F3FC" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="24" cy="22" r="2.5" fill="#E0F2FE" />
    </g>
  </svg>
)

/** 20. Sleep Latency */
export const SleepLatencyIcon: React.FC<OutcomeIconProps> = ({ size = 24, glow = true, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`} {...props}>
    <defs>
      <linearGradient id="latGrad" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#C7D2FE" />
        <stop offset="50%" stopColor="#818CF8" />
        <stop offset="100%" stopColor="#4338CA" />
      </linearGradient>
      {glow && (
        <filter id="latGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#818CF8" floodOpacity="0.45" />
        </filter>
      )}
    </defs>
    <g filter={glow ? 'url(#latGlow)' : undefined}>
      <circle cx="24" cy="26" r="14" stroke="url(#latGrad)" strokeWidth="2.5" fill="rgba(129, 140, 248, 0.12)" />
      <line x1="24" y1="6" x2="24" y2="12" stroke="#C7D2FE" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="24" y1="26" x2="24" y2="18" stroke="#E0E7FF" strokeWidth="2" strokeLinecap="round" />
      <line x1="24" y1="26" x2="30" y2="26" stroke="#E0E7FF" strokeWidth="2" strokeLinecap="round" />
      <circle cx="24" cy="26" r="2" fill="#E0E7FF" />
    </g>
  </svg>
)

/** 21. Emotional Resilience */
export const EmotionalResilienceIcon: React.FC<OutcomeIconProps> = ({ size = 24, glow = true, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`} {...props}>
    <defs>
      <linearGradient id="emoGrad" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#E9D5FF" />
        <stop offset="50%" stopColor="#A855F7" />
        <stop offset="100%" stopColor="#6B21A8" />
      </linearGradient>
      {glow && (
        <filter id="emoGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#A855F7" floodOpacity="0.45" />
        </filter>
      )}
    </defs>
    <g filter={glow ? 'url(#emoGlow)' : undefined}>
      <path d="M12 16L24 8L36 16L32 36L24 40L16 36L12 16Z" stroke="url(#emoGrad)" strokeWidth="2.5" strokeLinejoin="round" fill="rgba(168, 85, 247, 0.15)" />
      <path d="M12 16L24 24L36 16M24 24V40M16 36L24 24L32 36" stroke="#E9D5FF" strokeWidth="1.8" strokeLinejoin="round" />
    </g>
  </svg>
)

/** 22. Motivation & Drive */
export const MotivationIcon: React.FC<OutcomeIconProps> = ({ size = 24, glow = true, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`} {...props}>
    <defs>
      <linearGradient id="motGrad" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FED7AA" />
        <stop offset="50%" stopColor="#F97316" />
        <stop offset="100%" stopColor="#C2410C" />
      </linearGradient>
      {glow && (
        <filter id="motGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#F97316" floodOpacity="0.45" />
        </filter>
      )}
    </defs>
    <g filter={glow ? 'url(#motGlow)' : undefined}>
      <path d="M34 14C34 14 34 23 28 29C23 34 14 34 14 34C14 34 14 25 20 19C25 14 34 14 34 14Z" stroke="url(#motGrad)" strokeWidth="2.5" strokeLinejoin="round" fill="rgba(249, 115, 22, 0.15)" />
      <path d="M17 31L10 38M14 34L8 40" stroke="#FDBA74" strokeWidth="2" strokeLinecap="round" />
      <circle cx="26" cy="22" r="2.5" fill="#FED7AA" />
      <path d="M22 32L26 36M16 26L12 22" stroke="#F97316" strokeWidth="2" strokeLinecap="round" />
    </g>
  </svg>
)

/** 23. Physical Fatigue Reduction */
export const PhysicalFatigueIcon: React.FC<OutcomeIconProps> = ({ size = 24, glow = true, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`} {...props}>
    <defs>
      <linearGradient id="fatGrad" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#A7F3D0" />
        <stop offset="50%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
      {glow && (
        <filter id="fatGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#10B981" floodOpacity="0.45" />
        </filter>
      )}
    </defs>
    <g filter={glow ? 'url(#fatGlow)' : undefined}>
      <rect x="8" y="15" width="28" height="18" rx="4" stroke="url(#fatGrad)" strokeWidth="2.5" fill="rgba(16, 185, 129, 0.15)" />
      <line x1="39" y1="21" x2="39" y2="27" stroke="url(#fatGrad)" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="13" y="19" width="4" height="10" rx="1.5" fill="#6EE7B7" />
      <rect x="20" y="19" width="4" height="10" rx="1.5" fill="#6EE7B7" />
      <rect x="27" y="19" width="4" height="10" rx="1.5" fill="#6EE7B7" />
    </g>
  </svg>
)

/** 24. Productivity & Deep Work */
export const ProductivityIcon: React.FC<OutcomeIconProps> = ({ size = 24, glow = true, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`} {...props}>
    <defs>
      <linearGradient id="prodGrad" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#A7F3D0" />
        <stop offset="50%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#3B82F6" />
      </linearGradient>
      {glow && (
        <filter id="prodGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#10B981" floodOpacity="0.45" />
        </filter>
      )}
    </defs>
    <g filter={glow ? 'url(#prodGlow)' : undefined}>
      <rect x="9" y="9" width="30" height="30" rx="6" stroke="url(#prodGrad)" strokeWidth="2.5" fill="rgba(16, 185, 129, 0.12)" />
      <line x1="16" y1="32" x2="16" y2="26" stroke="#6EE7B7" strokeWidth="3" strokeLinecap="round" />
      <line x1="24" y1="32" x2="24" y2="18" stroke="#6EE7B7" strokeWidth="3" strokeLinecap="round" />
      <line x1="32" y1="32" x2="32" y2="22" stroke="#6EE7B7" strokeWidth="3" strokeLinecap="round" />
      <path d="M14 22L22 15L34 18" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
)

/** 25. Musculoskeletal Pain Relief */
export const PainIcon: React.FC<OutcomeIconProps> = ({ size = 24, glow = true, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`} {...props}>
    <defs>
      <linearGradient id="painGrad" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#A7F3D0" />
        <stop offset="50%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
      {glow && (
        <filter id="painGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#10B981" floodOpacity="0.45" />
        </filter>
      )}
    </defs>
    <g filter={glow ? 'url(#painGlow)' : undefined}>
      <circle cx="24" cy="24" r="16" stroke="url(#painGrad)" strokeWidth="2" strokeDasharray="4 3" fill="rgba(16, 185, 129, 0.1)" />
      <path d="M24 14V34M14 24H34" stroke="url(#painGrad)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="24" cy="24" r="3.5" fill="#D1FAE5" />
    </g>
  </svg>
)

// -----------------------------------------------------------------------------
// UNIFIED DYNAMIC FUNCTIONAL OUTCOME ICON COMPONENT
// -----------------------------------------------------------------------------

export interface FunctionalOutcomeIconProps extends OutcomeIconProps {
  outcome: FunctionalOutcomeId | string
}

export const FunctionalOutcomeIcon: React.FC<FunctionalOutcomeIconProps> = ({ outcome, ...props }) => {
  switch (outcome) {
    case 'focus':
      return <FocusIcon {...props} />
    case 'sleep_quality':
      return <SleepQualityIcon {...props} />
    case 'deep_sleep':
      return <DeepSleepIcon {...props} />
    case 'energy':
      return <EnergyIcon {...props} />
    case 'skin_clarity':
      return <SkinClarityIcon {...props} />
    case 'libido':
      return <LibidoIcon {...props} />
    case 'stress':
      return <StressIcon {...props} />
    case 'mood':
      return <MoodIcon {...props} />
    case 'joint_comfort':
      return <JointComfortIcon {...props} />
    case 'muscle_hypertrophy':
      return <MuscleHypertrophyIcon {...props} />
    case 'strength':
      return <StrengthIcon {...props} />
    case 'athletic_endurance':
      return <AthleticEnduranceIcon {...props} />
    case 'digestive_comfort':
      return <DigestiveComfortIcon {...props} />
    case 'waking_restedness':
      return <WakingRestednessIcon {...props} />
    case 'calmness':
      return <CalmnessIcon {...props} />
    case 'immune_resilience':
      return <ImmuneResilienceIcon {...props} />
    case 'brain_fog':
      return <BrainFogIcon {...props} />
    case 'satiety':
      return <SatietyIcon {...props} />
    case 'soreness':
      return <SorenessIcon {...props} />
    case 'sleep_latency':
      return <SleepLatencyIcon {...props} />
    case 'emotional_resilience':
      return <EmotionalResilienceIcon {...props} />
    case 'motivation':
      return <MotivationIcon {...props} />
    case 'physical_fatigue':
      return <PhysicalFatigueIcon {...props} />
    case 'productivity':
      return <ProductivityIcon {...props} />
    case 'pain':
      return <PainIcon {...props} />
    default:
      return <FocusIcon {...props} />
  }
}

// -----------------------------------------------------------------------------
// OPTIONAL BADGE WRAPPER COMPONENT (With or without text label!)
// -----------------------------------------------------------------------------

export interface FunctionalOutcomeBadgeProps {
  outcome: FunctionalOutcomeId | string
  showLabel?: boolean // Set to false for standalone icon badge without text!
  size?: number
  glow?: boolean
  className?: string
  onClick?: () => void
}

export const FunctionalOutcomeBadge: React.FC<FunctionalOutcomeBadgeProps> = ({
  outcome,
  showLabel = true,
  size = 20,
  glow = true,
  className = '',
  onClick
}) => {
  const meta = FUNCTIONAL_OUTCOMES_METADATA[outcome as FunctionalOutcomeId] || {
    name: outcome,
    colorHex: '#10B981',
    bgGlow: 'rgba(16, 185, 129, 0.2)',
    borderColor: 'border-emerald-500/30',
    textColor: 'text-emerald-400'
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
      <FunctionalOutcomeIcon outcome={outcome} size={size} glow={glow} />
      {showLabel && (
        <span className={`text-xs font-semibold whitespace-nowrap ${meta.textColor}`}>
          {meta.name}
        </span>
      )}
    </div>
  )
}

export default FunctionalOutcomeIcon
