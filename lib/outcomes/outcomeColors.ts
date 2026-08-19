/**
 * Universal Outcome Color & Visual Identity System
 * Provides persistent, scientifically curated color themes across the entire app for all functional outcomes.
 */

export interface OutcomeColorTheme {
  id: string
  label: string
  gradient: string
  text: string
  bg: string
  border: string
  glow: string
  hex: string
  badgeBg: string
  badgeText: string
  badgeBorder: string
}

// 12 Curated Master Visual Identity Themes
const MASTER_PALETTES: OutcomeColorTheme[] = [
  {
    id: 'indigo_blue',
    label: 'Deep Sleep & Circadian',
    gradient: 'from-indigo-500 via-indigo-600 to-blue-700',
    text: 'text-indigo-400',
    bg: 'bg-indigo-950/40',
    border: 'border-indigo-500/40',
    glow: 'rgba(99, 102, 241, 0.35)',
    hex: '#6366f1',
    badgeBg: 'bg-indigo-500/20',
    badgeText: 'text-indigo-300',
    badgeBorder: 'border-indigo-500/40'
  },
  {
    id: 'amber_orange',
    label: 'Mitochondrial Energy & ATP',
    gradient: 'from-amber-400 via-orange-500 to-amber-600',
    text: 'text-amber-400',
    bg: 'bg-amber-950/40',
    border: 'border-amber-500/40',
    glow: 'rgba(245, 158, 11, 0.35)',
    hex: '#f59e0b',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-300',
    badgeBorder: 'border-amber-500/40'
  },
  {
    id: 'emerald_teal',
    label: 'Cognitive Focus & Nootropics',
    gradient: 'from-emerald-400 via-teal-500 to-emerald-600',
    text: 'text-emerald-400',
    bg: 'bg-emerald-950/40',
    border: 'border-emerald-500/40',
    glow: 'rgba(16, 185, 129, 0.35)',
    hex: '#10b981',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-300',
    badgeBorder: 'border-emerald-500/40'
  },
  {
    id: 'violet_purple',
    label: 'Stress Resilience & Parasympathetic',
    gradient: 'from-violet-400 via-purple-500 to-indigo-600',
    text: 'text-violet-400',
    bg: 'bg-violet-950/40',
    border: 'border-violet-500/40',
    glow: 'rgba(139, 92, 246, 0.35)',
    hex: '#8b5cf6',
    badgeBg: 'bg-violet-500/20',
    badgeText: 'text-violet-300',
    badgeBorder: 'border-violet-500/40'
  },
  {
    id: 'cyan_blue',
    label: 'Longevity & Cellular Repair',
    gradient: 'from-cyan-400 via-blue-500 to-indigo-500',
    text: 'text-cyan-400',
    bg: 'bg-cyan-950/40',
    border: 'border-cyan-500/40',
    glow: 'rgba(6, 182, 212, 0.35)',
    hex: '#06b6d4',
    badgeBg: 'bg-cyan-500/20',
    badgeText: 'text-cyan-300',
    badgeBorder: 'border-cyan-500/40'
  },
  {
    id: 'rose_pink',
    label: 'Skin Clarity & Collagen Matrix',
    gradient: 'from-rose-400 via-pink-500 to-rose-600',
    text: 'text-rose-400',
    bg: 'bg-rose-950/40',
    border: 'border-rose-500/40',
    glow: 'rgba(244, 63, 94, 0.35)',
    hex: '#f43f5e',
    badgeBg: 'bg-rose-500/20',
    badgeText: 'text-rose-300',
    badgeBorder: 'border-rose-500/40'
  },
  {
    id: 'sky_cyan',
    label: 'Calmness, Mood & Nervous System',
    gradient: 'from-sky-400 via-cyan-500 to-blue-600',
    text: 'text-sky-400',
    bg: 'bg-sky-950/40',
    border: 'border-sky-500/40',
    glow: 'rgba(56, 189, 248, 0.35)',
    hex: '#38bdf8',
    badgeBg: 'bg-sky-500/20',
    badgeText: 'text-sky-300',
    badgeBorder: 'border-sky-500/40'
  },
  {
    id: 'red_crimson',
    label: 'Cardiovascular & VO2 Max',
    gradient: 'from-red-500 via-rose-600 to-red-700',
    text: 'text-red-400',
    bg: 'bg-red-950/40',
    border: 'border-red-500/40',
    glow: 'rgba(239, 68, 68, 0.35)',
    hex: '#ef4444',
    badgeBg: 'bg-red-500/20',
    badgeText: 'text-red-300',
    badgeBorder: 'border-red-500/40'
  },
  {
    id: 'teal_emerald',
    label: 'Autophagy & Metabolic Renewal',
    gradient: 'from-teal-400 via-emerald-500 to-green-600',
    text: 'text-teal-400',
    bg: 'bg-teal-950/40',
    border: 'border-teal-500/40',
    glow: 'rgba(20, 184, 166, 0.35)',
    hex: '#14b8a6',
    badgeBg: 'bg-teal-500/20',
    badgeText: 'text-teal-300',
    badgeBorder: 'border-teal-500/40'
  },
  {
    id: 'fuchsia_pink',
    label: 'Hormonal Vitality & Libido',
    gradient: 'from-fuchsia-400 via-pink-500 to-purple-600',
    text: 'text-fuchsia-400',
    bg: 'bg-fuchsia-950/40',
    border: 'border-fuchsia-500/40',
    glow: 'rgba(217, 70, 239, 0.35)',
    hex: '#d946ef',
    badgeBg: 'bg-fuchsia-500/20',
    badgeText: 'text-fuchsia-300',
    badgeBorder: 'border-fuchsia-500/40'
  },
  {
    id: 'lime_emerald',
    label: 'Digestive Comfort & Gut Microbiome',
    gradient: 'from-lime-400 via-emerald-500 to-teal-600',
    text: 'text-lime-400',
    bg: 'bg-lime-950/40',
    border: 'border-lime-500/40',
    glow: 'rgba(132, 204, 22, 0.35)',
    hex: '#84cc16',
    badgeBg: 'bg-lime-500/20',
    badgeText: 'text-lime-300',
    badgeBorder: 'border-lime-500/40'
  },
  {
    id: 'orange_gold',
    label: 'Hypertrophy & Physical Strength',
    gradient: 'from-orange-400 via-amber-500 to-red-500',
    text: 'text-orange-400',
    bg: 'bg-orange-950/40',
    border: 'border-orange-500/40',
    glow: 'rgba(249, 115, 22, 0.35)',
    hex: '#f97316',
    badgeBg: 'bg-orange-500/20',
    badgeText: 'text-orange-300',
    badgeBorder: 'border-orange-500/40'
  }
]

// Explicit Domain Map for Every Known LEVL Outcome Dimension
const OUTCOME_THEME_REGISTRY: Record<string, OutcomeColorTheme> = {
  // Sleep & Nocturnal
  sleep_quality: MASTER_PALETTES[0],
  sleep_latency: MASTER_PALETTES[0],
  waking_restedness: {
    ...MASTER_PALETTES[0],
    gradient: 'from-indigo-400 via-sky-500 to-blue-600',
    text: 'text-sky-400',
    bg: 'bg-sky-950/40',
    border: 'border-sky-500/40',
    glow: 'rgba(56, 189, 248, 0.35)',
    hex: '#38bdf8'
  },

  // Energy & Mitochondria
  energy: MASTER_PALETTES[1],
  alertness: {
    ...MASTER_PALETTES[1],
    gradient: 'from-amber-300 via-yellow-400 to-orange-500',
    text: 'text-amber-300',
    bg: 'bg-amber-950/40',
    border: 'border-amber-400/40',
    glow: 'rgba(251, 191, 36, 0.35)',
    hex: '#fbbf24'
  },
  fat_loss: {
    ...MASTER_PALETTES[1],
    gradient: 'from-orange-500 via-amber-500 to-red-500',
    text: 'text-orange-400',
    bg: 'bg-orange-950/40',
    border: 'border-orange-500/40',
    glow: 'rgba(249, 115, 22, 0.35)',
    hex: '#f97316'
  },

  // Focus, Brain & Cognition
  focus: MASTER_PALETTES[2],
  brain_fog: {
    ...MASTER_PALETTES[2],
    gradient: 'from-teal-400 via-cyan-500 to-emerald-600',
    text: 'text-teal-300',
    bg: 'bg-teal-950/40',
    border: 'border-teal-400/40',
    glow: 'rgba(45, 212, 191, 0.35)',
    hex: '#2dd4bf'
  },
  mental_clarity: MASTER_PALETTES[2],
  memory: MASTER_PALETTES[2],
  productivity: MASTER_PALETTES[2],

  // Stress, Emotion & Mood
  stress: MASTER_PALETTES[3],
  stress_resilience: MASTER_PALETTES[3],
  anxiety: {
    ...MASTER_PALETTES[3],
    gradient: 'from-purple-400 via-indigo-500 to-sky-600',
    text: 'text-purple-300',
    bg: 'bg-purple-950/40',
    border: 'border-purple-500/40',
    glow: 'rgba(192, 132, 252, 0.35)',
    hex: '#c084fc'
  },
  emotional_resilience: {
    ...MASTER_PALETTES[3],
    gradient: 'from-violet-400 via-pink-500 to-purple-600',
    text: 'text-violet-300',
    bg: 'bg-violet-950/40',
    border: 'border-violet-500/40',
    glow: 'rgba(167, 139, 250, 0.35)',
    hex: '#a78bfa'
  },
  emotional_balance: {
    ...MASTER_PALETTES[3],
    gradient: 'from-violet-400 via-pink-500 to-purple-600',
    text: 'text-violet-300',
    bg: 'bg-violet-950/40',
    border: 'border-violet-500/40',
    glow: 'rgba(167, 139, 250, 0.35)',
    hex: '#a78bfa'
  },
  calmness: MASTER_PALETTES[6],
  mood: {
    ...MASTER_PALETTES[5],
    gradient: 'from-pink-400 via-rose-500 to-amber-500',
    text: 'text-pink-400',
    bg: 'bg-pink-950/40',
    border: 'border-pink-500/40',
    glow: 'rgba(244, 63, 94, 0.35)',
    hex: '#f43f5e'
  },

  // Longevity, Autophagy & Cellular
  longevity: MASTER_PALETTES[4],
  autophagy: MASTER_PALETTES[8],
  immune_resilience: {
    ...MASTER_PALETTES[4],
    gradient: 'from-blue-400 via-indigo-500 to-cyan-500',
    text: 'text-blue-400',
    bg: 'bg-blue-950/40',
    border: 'border-blue-500/40',
    glow: 'rgba(59, 130, 246, 0.35)',
    hex: '#3b82f6'
  },

  // Cardiovascular & Recovery
  cardiovascular_health: MASTER_PALETTES[7],
  endurance: MASTER_PALETTES[7],
  hrv: {
    ...MASTER_PALETTES[7],
    gradient: 'from-rose-500 via-red-500 to-indigo-600',
    text: 'text-rose-400',
    bg: 'bg-rose-950/40',
    border: 'border-rose-500/40',
    glow: 'rgba(244, 63, 94, 0.35)',
    hex: '#f43f5e'
  },
  recovery: {
    ...MASTER_PALETTES[8],
    gradient: 'from-teal-400 via-cyan-500 to-blue-500',
    text: 'text-teal-300',
    bg: 'bg-teal-950/40',
    border: 'border-teal-500/40',
    glow: 'rgba(45, 212, 191, 0.35)',
    hex: '#2dd4bf'
  },

  // Skin, Connective Tissue & Joints
  skin_clarity: MASTER_PALETTES[5],
  skin_elasticity: MASTER_PALETTES[5],
  skin_elasticity_quality: MASTER_PALETTES[5],
  joint_comfort: {
    ...MASTER_PALETTES[11],
    gradient: 'from-amber-400 via-yellow-500 to-orange-500',
    text: 'text-amber-400',
    bg: 'bg-amber-950/40',
    border: 'border-amber-500/40',
    glow: 'rgba(245, 158, 11, 0.35)',
    hex: '#f59e0b'
  },
  joint_health: {
    ...MASTER_PALETTES[11],
    gradient: 'from-amber-400 via-yellow-500 to-orange-500',
    text: 'text-amber-400',
    bg: 'bg-amber-950/40',
    border: 'border-amber-500/40',
    glow: 'rgba(245, 158, 11, 0.35)',
    hex: '#f59e0b'
  },

  // Hormonal, Vitality & Growth
  libido: MASTER_PALETTES[9],
  hgh_elevation: {
    ...MASTER_PALETTES[9],
    gradient: 'from-purple-500 via-indigo-600 to-pink-500',
    text: 'text-purple-400',
    bg: 'bg-purple-950/40',
    border: 'border-purple-500/40',
    glow: 'rgba(168, 85, 247, 0.35)',
    hex: '#a855f7'
  },
  growth_hormone: {
    ...MASTER_PALETTES[9],
    gradient: 'from-purple-500 via-indigo-600 to-pink-500',
    text: 'text-purple-400',
    bg: 'bg-purple-950/40',
    border: 'border-purple-500/40',
    glow: 'rgba(168, 85, 247, 0.35)',
    hex: '#a855f7'
  },

  // Digestive & Strength
  digestive_comfort: MASTER_PALETTES[10],
  gut_health: MASTER_PALETTES[10],
  satiety: MASTER_PALETTES[10],
  strength: MASTER_PALETTES[11],
  pain: {
    ...MASTER_PALETTES[7],
    gradient: 'from-rose-500 via-amber-500 to-orange-600',
    text: 'text-rose-400',
    bg: 'bg-rose-950/40',
    border: 'border-rose-500/40',
    glow: 'rgba(244, 63, 94, 0.35)',
    hex: '#f43f5e'
  },
  soreness: {
    ...MASTER_PALETTES[7],
    gradient: 'from-rose-500 via-amber-500 to-orange-600',
    text: 'text-rose-400',
    bg: 'bg-rose-950/40',
    border: 'border-rose-500/40',
    glow: 'rgba(244, 63, 94, 0.35)',
    hex: '#f43f5e'
  }
}

function cleanKey(input: string): string {
  return input
    .toLowerCase()
    .replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .trim()
}

/**
 * Universal lookup that guarantees every outcome gets a persistent, vibrant color theme.
 */
export function getOutcomeColor(outcomeIdOrName: string): OutcomeColorTheme {
  if (!outcomeIdOrName) return MASTER_PALETTES[0]

  const cleaned = cleanKey(outcomeIdOrName)

  // 1. Direct registry hit
  if (OUTCOME_THEME_REGISTRY[cleaned]) {
    return OUTCOME_THEME_REGISTRY[cleaned]
  }

  // 2. Substring matching
  if (cleaned.includes('sleep') || cleaned.includes('wake') || cleaned.includes('insomnia')) {
    return OUTCOME_THEME_REGISTRY.sleep_quality
  }
  if (cleaned.includes('energy') || cleaned.includes('fatigue') || cleaned.includes('mitochond')) {
    return OUTCOME_THEME_REGISTRY.energy
  }
  if (cleaned.includes('focus') || cleaned.includes('brain') || cleaned.includes('clarity') || cleaned.includes('cognit')) {
    return OUTCOME_THEME_REGISTRY.focus
  }
  if (cleaned.includes('stress') || cleaned.includes('anxiety') || cleaned.includes('calm') || cleaned.includes('resilien')) {
    return OUTCOME_THEME_REGISTRY.stress_resilience
  }
  if (cleaned.includes('longev') || cleaned.includes('aging') || cleaned.includes('senolyt') || cleaned.includes('dna')) {
    return OUTCOME_THEME_REGISTRY.longevity
  }
  if (cleaned.includes('skin') || cleaned.includes('collagen') || cleaned.includes('wrinkle') || cleaned.includes('dermat')) {
    return OUTCOME_THEME_REGISTRY.skin_clarity
  }
  if (cleaned.includes('heart') || cleaned.includes('cardio') || cleaned.includes('bp') || cleaned.includes('vo2') || cleaned.includes('hrv')) {
    return OUTCOME_THEME_REGISTRY.cardiovascular_health
  }
  if (cleaned.includes('joint') || cleaned.includes('cartilage') || cleaned.includes('bone')) {
    return OUTCOME_THEME_REGISTRY.joint_health
  }
  if (cleaned.includes('gut') || cleaned.includes('digest') || cleaned.includes('microbio') || cleaned.includes('bloat')) {
    return OUTCOME_THEME_REGISTRY.digestive_comfort
  }
  if (cleaned.includes('libido') || cleaned.includes('testoster') || cleaned.includes('hormon') || cleaned.includes('hgh')) {
    return OUTCOME_THEME_REGISTRY.libido
  }
  if (cleaned.includes('fat') || cleaned.includes('weight') || cleaned.includes('metabol') || cleaned.includes('glucose')) {
    return OUTCOME_THEME_REGISTRY.fat_loss
  }

  // 3. Deterministic hash fallback to guarantee a vibrant unique palette for any custom outcome
  let hash = 0
  for (let i = 0; i < cleaned.length; i++) {
    hash = cleaned.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % MASTER_PALETTES.length
  return MASTER_PALETTES[index]
}
