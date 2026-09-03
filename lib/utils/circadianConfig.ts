import React from 'react'
import { 
  Sunrise, 
  Zap, 
  Sun, 
  Sunset, 
  Moon, 
  MoonStar, 
  Sparkles, 
  Clock,
  LucideIcon 
} from 'lucide-react'

export interface CircadianSlotConfig {
  key: string
  label: string
  timeRange: string
  circadianPhase: string
  skyColorHex: string         // Dominant/accent hex
  startColorHex: string       // Gradient start hex (links from previous block)
  endColorHex: string         // Gradient end hex (links into next block)
  gradientCSS: string         // Full multi-stop linear gradient for local spine node
  badgeGradientCSS: string    // Glowing badge background gradient
  accentGradient: string      // Tailwind class for card top glow
  icon: LucideIcon
  badgeBg: string
  badgeBorder: string
  badgeText: string
  glowShadow: string
  activeRing: string
  startHour: number
  endHour: number
}

export const CIRCADIAN_SLOTS: Record<string, CircadianSlotConfig> = {
  waking: {
    key: 'waking',
    label: 'Waking & Early Dawn',
    timeRange: '5:30 AM – 7:30 AM',
    circadianPhase: 'Astronomical & Nautical Dawn • Cortisol Awakening',
    skyColorHex: '#F59E0B',
    startColorHex: '#D97706',
    endColorHex: '#F59E0B',
    gradientCSS: 'linear-gradient(to bottom, #D97706, #F59E0B)',
    badgeGradientCSS: 'linear-gradient(135deg, rgba(217,119,6,0.35), rgba(245,158,11,0.25))',
    accentGradient: 'from-amber-500/20 via-amber-500/10 to-transparent',
    icon: Sunrise,
    badgeBg: 'bg-amber-500/15',
    badgeBorder: 'border-amber-500/40',
    badgeText: 'text-amber-300',
    glowShadow: 'shadow-[0_0_16px_rgba(245,158,11,0.45)]',
    activeRing: 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950',
    startHour: 5,
    endHour: 8
  },
  morning_routine: {
    key: 'morning_routine',
    label: 'Morning Routine',
    timeRange: '6:30 AM – 9:00 AM',
    circadianPhase: 'Golden Morning Sunrise & Hydration',
    skyColorHex: '#FBBF24',
    startColorHex: '#F59E0B',
    endColorHex: '#38BDF8',
    gradientCSS: 'linear-gradient(to bottom, #F59E0B, #FBBF24, #38BDF8)',
    badgeGradientCSS: 'linear-gradient(135deg, rgba(245,158,11,0.3), rgba(251,191,36,0.25), rgba(56,189,248,0.2))',
    accentGradient: 'from-amber-500/20 via-yellow-500/10 to-sky-500/10',
    icon: Sunrise,
    badgeBg: 'bg-amber-500/15',
    badgeBorder: 'border-amber-400/40',
    badgeText: 'text-amber-200',
    glowShadow: 'shadow-[0_0_16px_rgba(251,191,36,0.45)]',
    activeRing: 'ring-2 ring-amber-300 ring-offset-2 ring-offset-slate-950',
    startHour: 6,
    endHour: 9
  },
  morning: {
    key: 'morning',
    label: 'Morning Alertness',
    timeRange: '8:00 AM – 11:30 AM',
    circadianPhase: 'High-Lux 480nm Light • Dopaminergic Focus',
    skyColorHex: '#38BDF8',
    startColorHex: '#F59E0B',
    endColorHex: '#0EA5E9',
    gradientCSS: 'linear-gradient(to bottom, #F59E0B, #FBBF24, #38BDF8)',
    badgeGradientCSS: 'linear-gradient(135deg, rgba(245,158,11,0.3), rgba(56,189,248,0.25))',
    accentGradient: 'from-amber-500/20 via-sky-500/10 to-transparent',
    icon: Zap,
    badgeBg: 'bg-sky-500/15',
    badgeBorder: 'border-sky-500/40',
    badgeText: 'text-sky-300',
    glowShadow: 'shadow-[0_0_16px_rgba(56,189,248,0.45)]',
    activeRing: 'ring-2 ring-sky-400 ring-offset-2 ring-offset-slate-950',
    startHour: 8,
    endHour: 11
  },
  morning_supplement_stack: {
    key: 'morning_supplement_stack',
    label: 'Morning Stack',
    timeRange: '8:30 AM – 11:30 AM',
    circadianPhase: 'Fasted AM / Post-Breakfast Bioavailability',
    skyColorHex: '#0EA5E9',
    startColorHex: '#F59E0B',
    endColorHex: '#0284C7',
    gradientCSS: 'linear-gradient(to bottom, #F59E0B, #FBBF24, #0EA5E9)',
    badgeGradientCSS: 'linear-gradient(135deg, rgba(245,158,11,0.3), rgba(14,165,233,0.25))',
    accentGradient: 'from-amber-500/20 via-sky-500/10 to-transparent',
    icon: Zap,
    badgeBg: 'bg-sky-500/15',
    badgeBorder: 'border-sky-500/40',
    badgeText: 'text-sky-300',
    glowShadow: 'shadow-[0_0_16px_rgba(14,165,233,0.45)]',
    activeRing: 'ring-2 ring-sky-400 ring-offset-2 ring-offset-slate-950',
    startHour: 8,
    endHour: 12
  },
  first_meal: {
    key: 'first_meal',
    label: 'First Meal / Breakfast',
    timeRange: '9:00 AM – 11:30 AM',
    circadianPhase: 'Late Morning Sky • Fat-Soluble Nutrient Uptake',
    skyColorHex: '#0284C7',
    startColorHex: '#0EA5E9',
    endColorHex: '#0284C7',
    gradientCSS: 'linear-gradient(to bottom, #0EA5E9, #0284C7)',
    badgeGradientCSS: 'linear-gradient(135deg, rgba(14,165,233,0.3), rgba(2,132,199,0.25))',
    accentGradient: 'from-cyan-500/20 via-sky-400/10 to-transparent',
    icon: Zap,
    badgeBg: 'bg-cyan-500/15',
    badgeBorder: 'border-cyan-500/40',
    badgeText: 'text-cyan-300',
    glowShadow: 'shadow-[0_0_16px_rgba(14,165,233,0.45)]',
    activeRing: 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950',
    startHour: 9,
    endHour: 12
  },
  midday: {
    key: 'midday',
    label: 'Midday & Solar Noon',
    timeRange: '11:30 AM – 2:30 PM',
    circadianPhase: 'Peak Solar Noon • Maximum High-Lux Brilliance',
    skyColorHex: '#0284C7',
    startColorHex: '#0284C7',
    endColorHex: '#0284C7',
    gradientCSS: 'linear-gradient(to bottom, #0284C7, #0284C7)',
    badgeGradientCSS: 'linear-gradient(135deg, rgba(2,132,199,0.35), rgba(14,165,233,0.3))',
    accentGradient: 'from-sky-400/25 via-cyan-400/15 to-transparent',
    icon: Sun,
    badgeBg: 'bg-sky-500/15',
    badgeBorder: 'border-sky-400/50',
    badgeText: 'text-sky-200',
    glowShadow: 'shadow-[0_0_20px_rgba(2,132,199,0.55)]',
    activeRing: 'ring-2 ring-sky-300 ring-offset-2 ring-offset-slate-950',
    startHour: 11,
    endHour: 14
  },
  midday_stack: {
    key: 'midday_stack',
    label: 'Midday Stack',
    timeRange: '12:00 PM – 3:00 PM',
    circadianPhase: 'Mitochondrial Co-factors • Solar Peak Bioavailability',
    skyColorHex: '#2563EB',
    startColorHex: '#2563EB',
    endColorHex: '#2563EB',
    gradientCSS: 'linear-gradient(to bottom, #2563EB, #2563EB)',
    badgeGradientCSS: 'linear-gradient(135deg, rgba(37,99,235,0.35), rgba(59,130,246,0.25))',
    accentGradient: 'from-sky-400/25 via-blue-500/15 to-transparent',
    icon: Sun,
    badgeBg: 'bg-blue-500/15',
    badgeBorder: 'border-blue-400/50',
    badgeText: 'text-blue-200',
    glowShadow: 'shadow-[0_0_20px_rgba(37,99,235,0.45)]',
    activeRing: 'ring-2 ring-blue-300 ring-offset-2 ring-offset-slate-950',
    startHour: 12,
    endHour: 15
  },
  afternoon: {
    key: 'afternoon',
    label: 'Afternoon / Workout',
    timeRange: '2:00 PM – 5:30 PM',
    circadianPhase: 'Deep Daylight Sky',
    skyColorHex: '#5B9BD5',
    startColorHex: '#3B82F6',
    endColorHex: '#5B9BD5',
    gradientCSS: 'linear-gradient(to bottom, #3B82F6, #5B9BD5)',
    badgeGradientCSS: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(91,155,213,0.25))',
    accentGradient: 'from-blue-600/20 via-sky-500/10 to-transparent',
    icon: Sun,
    badgeBg: 'bg-blue-500/15',
    badgeBorder: 'border-blue-400/40',
    badgeText: 'text-sky-300',
    glowShadow: 'shadow-[0_0_16px_rgba(91,155,213,0.45)]',
    activeRing: 'ring-2 ring-sky-400 ring-offset-2 ring-offset-slate-950',
    startHour: 14,
    endHour: 17
  },
  late_afternoon: {
    key: 'late_afternoon',
    label: 'Late Afternoon',
    timeRange: '3:30 PM – 5:30 PM',
    circadianPhase: 'Late Afternoon Sky',
    skyColorHex: '#9D9EC9',
    startColorHex: '#5B9BD5',
    endColorHex: '#9D9EC9',
    gradientCSS: 'linear-gradient(to bottom, #5B9BD5, #9D9EC9)',
    badgeGradientCSS: 'linear-gradient(135deg, rgba(91,155,213,0.35), rgba(157,158,201,0.3))',
    accentGradient: 'from-blue-500/20 via-indigo-400/10 to-transparent',
    icon: Sun,
    badgeBg: 'bg-indigo-500/15',
    badgeBorder: 'border-indigo-400/40',
    badgeText: 'text-indigo-200',
    glowShadow: 'shadow-[0_0_16px_rgba(157,158,201,0.45)]',
    activeRing: 'ring-2 ring-indigo-300 ring-offset-2 ring-offset-slate-950',
    startHour: 15,
    endHour: 18
  },
  post_meal: {
    key: 'post_meal',
    label: 'Post-Meal',
    timeRange: '5:00 PM – 7:30 PM',
    circadianPhase: 'Post-Meal Window',
    skyColorHex: '#F87E38',
    startColorHex: '#9D9EC9',
    endColorHex: '#F87E38',
    gradientCSS: 'linear-gradient(to bottom, #9D9EC9, #F87E38)',
    badgeGradientCSS: 'linear-gradient(135deg, rgba(248,126,56,0.35), rgba(240,106,66,0.3))',
    accentGradient: 'from-orange-500/20 via-amber-400/10 to-transparent',
    icon: Sunset,
    badgeBg: 'bg-orange-500/15',
    badgeBorder: 'border-orange-400/40',
    badgeText: 'text-orange-200',
    glowShadow: 'shadow-[0_0_16px_rgba(248,126,56,0.5)]',
    activeRing: 'ring-2 ring-orange-300 ring-offset-2 ring-offset-slate-950',
    startHour: 17,
    endHour: 20
  },
  evening: {
    key: 'evening',
    label: 'Evening / Sunset',
    timeRange: '5:30 PM – 8:30 PM',
    circadianPhase: 'Evening & Sunset',
    skyColorHex: '#DF5558',
    startColorHex: '#F87E38',
    endColorHex: '#DF5558',
    gradientCSS: 'linear-gradient(to bottom, #F87E38, #DF5558)',
    badgeGradientCSS: 'linear-gradient(135deg, rgba(248,126,56,0.35), rgba(223,85,88,0.35))',
    accentGradient: 'from-rose-500/25 via-pink-500/15 to-transparent',
    icon: Sunset,
    badgeBg: 'bg-rose-500/15',
    badgeBorder: 'border-rose-400/50',
    badgeText: 'text-rose-200',
    glowShadow: 'shadow-[0_0_20px_rgba(223,85,88,0.55)]',
    activeRing: 'ring-2 ring-rose-400 ring-offset-2 ring-offset-slate-950',
    startHour: 17,
    endHour: 20
  },
  evening_supplement_stack: {
    key: 'evening_supplement_stack',
    label: 'Evening Stack',
    timeRange: '7:30 PM – 9:30 PM',
    circadianPhase: 'Evening Stack',
    skyColorHex: '#A52D6A',
    startColorHex: '#DF5558',
    endColorHex: '#A52D6A',
    gradientCSS: 'linear-gradient(to bottom, #DF5558, #A52D6A)',
    badgeGradientCSS: 'linear-gradient(135deg, rgba(223,85,88,0.3), rgba(165,45,106,0.3))',
    accentGradient: 'from-pink-500/20 via-purple-500/10 to-transparent',
    icon: Moon,
    badgeBg: 'bg-pink-500/15',
    badgeBorder: 'border-pink-400/40',
    badgeText: 'text-pink-300',
    glowShadow: 'shadow-[0_0_16px_rgba(165,45,106,0.45)]',
    activeRing: 'ring-2 ring-pink-400 ring-offset-2 ring-offset-slate-950',
    startHour: 19,
    endHour: 21
  },
  wind_down: {
    key: 'wind_down',
    label: 'Wind Down',
    timeRange: '8:30 PM – 10:30 PM',
    circadianPhase: 'Evening Wind-Down',
    skyColorHex: '#50236B',
    startColorHex: '#A52D6A',
    endColorHex: '#50236B',
    gradientCSS: 'linear-gradient(to bottom, #A52D6A, #50236B)',
    badgeGradientCSS: 'linear-gradient(135deg, rgba(165,45,106,0.35), rgba(80,35,107,0.35))',
    accentGradient: 'from-purple-500/20 via-indigo-600/10 to-transparent',
    icon: Moon,
    badgeBg: 'bg-purple-500/15',
    badgeBorder: 'border-purple-500/40',
    badgeText: 'text-purple-200',
    glowShadow: 'shadow-[0_0_16px_rgba(80,35,107,0.55)]',
    activeRing: 'ring-2 ring-purple-400 ring-offset-2 ring-offset-slate-950',
    startHour: 20,
    endHour: 22
  },
  pre_bed: {
    key: 'pre_bed',
    label: 'Pre-Bed',
    timeRange: '9:30 PM – 11:00 PM',
    circadianPhase: 'Pre-Bed Preparation',
    skyColorHex: '#231A45',
    startColorHex: '#50236B',
    endColorHex: '#231A45',
    gradientCSS: 'linear-gradient(to bottom, #50236B, #231A45)',
    badgeGradientCSS: 'linear-gradient(135deg, rgba(80,35,107,0.4), rgba(35,26,69,0.5))',
    accentGradient: 'from-indigo-600/25 via-blue-900/40 to-transparent',
    icon: MoonStar,
    badgeBg: 'bg-indigo-900/30',
    badgeBorder: 'border-indigo-500/40',
    badgeText: 'text-indigo-200',
    glowShadow: 'shadow-[0_0_20px_rgba(35,26,69,0.7)]',
    activeRing: 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-950',
    startHour: 21,
    endHour: 23
  },
  bedtime: {
    key: 'bedtime',
    label: 'Bedtime / Overnight',
    timeRange: '10:00 PM – 5:30 AM',
    circadianPhase: 'Bedtime & Overnight',
    skyColorHex: '#1B1536',
    startColorHex: '#231A45',
    endColorHex: '#0B132B',
    gradientCSS: 'linear-gradient(to bottom, #231A45, #1B1536, #0B132B)',
    badgeGradientCSS: 'linear-gradient(135deg, rgba(35,26,69,0.5), rgba(11,19,43,0.8))',
    accentGradient: 'from-blue-900/30 via-indigo-950/50 to-transparent',
    icon: MoonStar,
    badgeBg: 'bg-blue-950/70',
    badgeBorder: 'border-blue-700/60',
    badgeText: 'text-blue-300',
    glowShadow: 'shadow-[0_0_20px_rgba(27,21,54,0.8)]',
    activeRing: 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-950',
    startHour: 22,
    endHour: 5
  },
  anytime: {
    key: 'anytime',
    label: 'Anytime / Flexible Window',
    timeRange: 'Flexible Timing',
    circadianPhase: 'Throughout Today • Habit Synergy & Vitality',
    skyColorHex: '#8B5CF6',
    startColorHex: '#8B5CF6',
    endColorHex: '#8B5CF6',
    gradientCSS: 'linear-gradient(to bottom, #8B5CF6, #8B5CF6)',
    badgeGradientCSS: 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(99,102,241,0.2))',
    accentGradient: 'from-purple-500/20 via-indigo-500/10 to-transparent',
    icon: Sparkles,
    badgeBg: 'bg-purple-500/15',
    badgeBorder: 'border-purple-500/30',
    badgeText: 'text-purple-300',
    glowShadow: 'shadow-[0_0_12px_rgba(139,92,246,0.35)]',
    activeRing: 'ring-2 ring-purple-400 ring-offset-2 ring-offset-slate-950',
    startHour: 0,
    endHour: 24
  }
}

/**
 * Returns circadian metadata, atmospheric sky colors, and glowing beacon icons for a time slot
 */
export function getCircadianConfig(slotName: string): CircadianSlotConfig {
  if (!slotName) return CIRCADIAN_SLOTS.anytime
  const normalized = slotName.toLowerCase().trim()

  if (CIRCADIAN_SLOTS[normalized]) {
    return CIRCADIAN_SLOTS[normalized]
  }

  // Fuzzy matching for custom or non-standard slot strings
  if (normalized.includes('wake') || normalized.includes('sunrise') || normalized.includes('dawn')) {
    return CIRCADIAN_SLOTS.waking
  }
  if (normalized.includes('morning_routine') || normalized.includes('fasted_am')) {
    return CIRCADIAN_SLOTS.morning_routine
  }
  if (normalized.includes('first_meal') || normalized.includes('first meal') || normalized.includes('breakfast') || normalized.includes('meal_1')) {
    return CIRCADIAN_SLOTS.first_meal
  }
  if (normalized.includes('morning_supplement') || normalized.includes('am_stack')) {
    return CIRCADIAN_SLOTS.morning_supplement_stack
  }
  if (normalized.includes('morning') || normalized.includes('sunlight') || normalized.includes('am')) {
    return CIRCADIAN_SLOTS.morning
  }
  if (normalized.includes('midday_stack') || normalized.includes('lunch_stack')) {
    return CIRCADIAN_SLOTS.midday_stack
  }
  if (normalized.includes('noon') || normalized.includes('lunch') || normalized.includes('midday')) {
    return CIRCADIAN_SLOTS.midday
  }
  if (normalized.includes('late_afternoon')) {
    return CIRCADIAN_SLOTS.late_afternoon
  }
  if (normalized.includes('afternoon') || normalized.includes('workout') || normalized.includes('training')) {
    return CIRCADIAN_SLOTS.afternoon
  }
  if (normalized.includes('post_meal') || normalized.includes('post meal') || normalized.includes('postprandial')) {
    return CIRCADIAN_SLOTS.post_meal
  }
  if (normalized.includes('evening_supplement') || normalized.includes('dinner_stack')) {
    return CIRCADIAN_SLOTS.evening_supplement_stack
  }
  if (normalized.includes('evening') || normalized.includes('sunset') || normalized.includes('dinner') || normalized.includes('dusk')) {
    return CIRCADIAN_SLOTS.evening
  }
  if (normalized.includes('wind') || normalized.includes('dim')) {
    return CIRCADIAN_SLOTS.wind_down
  }
  if (normalized.includes('pre_bed') || normalized.includes('pre-bed')) {
    return CIRCADIAN_SLOTS.pre_bed
  }
  if (normalized.includes('bed') || normalized.includes('sleep') || normalized.includes('night')) {
    return CIRCADIAN_SLOTS.bedtime
  }

  return CIRCADIAN_SLOTS.anytime
}

/**
 * Calculates whether the current local time falls into a given slot
 */
export function isCurrentCircadianSlot(slotName: string, currentHour?: number): boolean {
  const hour = currentHour !== undefined ? currentHour : new Date().getHours()
  const config = getCircadianConfig(slotName)

  if (config.key === 'anytime') return false

  if (config.startHour <= config.endHour) {
    return hour >= config.startHour && hour < config.endHour
  } else {
    // Crosses midnight (e.g. bedtime 22 to 5)
    return hour >= config.startHour || hour < config.endHour
  }
}

export const CHRONOLOGICAL_CIRCADIAN_SLOTS: string[] = [
  'waking',
  'morning_routine',
  'morning',
  'morning_supplement_stack',
  'first_meal',
  'midday',
  'midday_stack',
  'afternoon',
  'late_afternoon',
  'post_meal',
  'evening',
  'evening_supplement_stack',
  'wind_down',
  'pre_bed',
  'bedtime'
]

/**
 * Mathematically builds a seamless continuous linear gradient spanning from top to bottom
 * based on whichever ordered sequence of time blocks are actively rendered on the user's page.
 * If any intermediate time blocks are skipped (e.g. Midday to Evening), the missing portion
 * of the circadian spectrum (deep daylight blue -> lavender -> vibrant sunset orange -> red)
 * is smoothly expressed in a compressed vertical transition window across the seam.
 */
export function buildDynamicCircadianGradientCSS(slotKeys: string[]): string {
  if (!slotKeys || slotKeys.length === 0) {
    return 'linear-gradient(to bottom, #D97706 0%, #F59E0B 8%, #FBBF24 16%, #38BDF8 26%, #0284C7 38%, #5B9BD5 50%, #9D9EC9 60%, #F87E38 70%, #DF5558 78%, #A52D6A 86%, #50236B 92%, #231A45 96%, #1B1536 98%, #0B132B 100%)'
  }
  if (slotKeys.length === 1) {
    return getCircadianConfig(slotKeys[0]).gradientCSS
  }

  const N = slotKeys.length
  const step = 100 / N
  const colorStops: { color: string; pct: number }[] = []

  slotKeys.forEach((key, i) => {
    const cfg = getCircadianConfig(key)
    const startPct = i * step
    const endPct = (i + 1) * step
    const primary = cfg.skyColorHex

    const nextKey = i < N - 1 ? slotKeys[i + 1] : null
    const nextCfg = nextKey ? getCircadianConfig(nextKey) : null

    if (i === 0) {
      const firstIdx = CHRONOLOGICAL_CIRCADIAN_SLOTS.indexOf(cfg.key)
      if (firstIdx > 2) {
        colorStops.push({ color: '#D97706', pct: 0 })
        colorStops.push({ color: '#F59E0B', pct: Math.min(Number((endPct * 0.25).toFixed(1)), 4) })
        colorStops.push({ color: '#38BDF8', pct: Math.min(Number((endPct * 0.5).toFixed(1)), 8) })
      } else if (['waking', 'morning_routine', 'morning', 'morning_supplement_stack', 'first_meal'].includes(cfg.key)) {
        colorStops.push({ color: '#D97706', pct: 0 })
        colorStops.push({ color: '#F59E0B', pct: Math.min(Number((endPct * 0.35).toFixed(1)), 8) })
        colorStops.push({ color: '#FBBF24', pct: Math.min(Number((endPct * 0.7).toFixed(1)), 16) })
      } else {
        colorStops.push({ color: cfg.startColorHex || primary, pct: 0 })
      }
      colorStops.push({ color: primary, pct: Math.max(0, Number((endPct - 1.2).toFixed(1))) })
    } else if (cfg.key === 'post_meal') {
      colorStops.push({ color: '#F87E38', pct: Math.min(100, Number((startPct + 0.8).toFixed(1))) })
      colorStops.push({ color: '#F87E38', pct: Math.max(0, Number((endPct - 0.8).toFixed(1))) })
    } else if (cfg.key === 'evening') {
      colorStops.push({ color: '#DF5558', pct: Math.min(100, Number((startPct + 0.8).toFixed(1))) })
      colorStops.push({ color: '#DF5558', pct: Math.max(0, Number((endPct - 0.8).toFixed(1))) })
    } else if (cfg.key === 'evening_supplement_stack') {
      colorStops.push({ color: '#A52D6A', pct: Math.min(100, Number((startPct + 0.8).toFixed(1))) })
      colorStops.push({ color: '#A52D6A', pct: Math.max(0, Number((endPct - 0.8).toFixed(1))) })
    } else if (cfg.key === 'wind_down') {
      colorStops.push({ color: '#50236B', pct: Math.min(100, Number((startPct + 0.8).toFixed(1))) })
      colorStops.push({ color: '#50236B', pct: Math.max(0, Number((endPct - 0.8).toFixed(1))) })
    } else if (cfg.key === 'pre_bed') {
      colorStops.push({ color: '#231A45', pct: Math.min(100, Number((startPct + 0.8).toFixed(1))) })
      colorStops.push({ color: '#231A45', pct: Math.max(0, Number((endPct - 0.8).toFixed(1))) })
    } else if (i === N - 1) {
      colorStops.push({ color: primary, pct: Math.min(100, Number((startPct + 1.0).toFixed(1))) })
      const lastIdx = CHRONOLOGICAL_CIRCADIAN_SLOTS.indexOf(cfg.key)
      if (lastIdx !== -1 && lastIdx < CHRONOLOGICAL_CIRCADIAN_SLOTS.length - 2) {
        const remainingKeys = CHRONOLOGICAL_CIRCADIAN_SLOTS.slice(lastIdx + 1)
        const remCount = remainingKeys.length
        remainingKeys.forEach((remKey, rIdx) => {
          const remCfg = getCircadianConfig(remKey)
          const pct = endPct - 6 + ((rIdx + 1) / (remCount + 1)) * 6
          colorStops.push({ color: remCfg.skyColorHex, pct: Number(pct.toFixed(1)) })
        })
        colorStops.push({ color: '#0B132B', pct: 100 })
      } else {
        colorStops.push({ color: primary, pct: Number(((startPct + 100) / 2).toFixed(1)) })
        colorStops.push({ color: cfg.endColorHex || '#0B132B', pct: 100 })
      }
    } else {
      colorStops.push({ color: primary, pct: Math.min(100, Number((startPct + 1.0).toFixed(1))) })
      colorStops.push({ color: primary, pct: Math.max(0, Number((endPct - 1.0).toFixed(1))) })
    }

    if (nextCfg) {
      const currIdx = CHRONOLOGICAL_CIRCADIAN_SLOTS.indexOf(cfg.key)
      const nextIdx = CHRONOLOGICAL_CIRCADIAN_SLOTS.indexOf(nextCfg.key)

      if (currIdx !== -1 && nextIdx !== -1 && nextIdx > currIdx + 1) {
        const skippedKeys = CHRONOLOGICAL_CIRCADIAN_SLOTS.slice(currIdx + 1, nextIdx)
        const distinctSkippedColors: string[] = []
        skippedKeys.forEach(k => {
          const col = getCircadianConfig(k).skyColorHex
          if (!distinctSkippedColors.includes(col) && col.toLowerCase() !== primary.toLowerCase() && col.toLowerCase() !== nextCfg.skyColorHex.toLowerCase()) {
            distinctSkippedColors.push(col)
          }
        })

        if (distinctSkippedColors.length > 0) {
          const windowStart = Math.max(startPct + 1, endPct - 5)
          const windowEnd = endPct
          const count = distinctSkippedColors.length
          distinctSkippedColors.forEach((color, sIdx) => {
            const pct = windowStart + ((sIdx + 1) / (count + 1)) * (windowEnd - windowStart)
            colorStops.push({ color, pct: Number(pct.toFixed(1)) })
          })
        }
      }
    }
  })

  colorStops.sort((a, b) => a.pct - b.pct)

  const uniqueStops: { color: string; pct: number }[] = []
  colorStops.forEach((s) => {
    if (
      uniqueStops.length === 0 ||
      uniqueStops[uniqueStops.length - 1].pct !== s.pct ||
      uniqueStops[uniqueStops.length - 1].color !== s.color
    ) {
      uniqueStops.push(s)
    }
  })

  const stopStrings = uniqueStops.map(s => `${s.color} ${s.pct}%`)
  return `linear-gradient(to bottom, ${stopStrings.join(', ')})`
}
