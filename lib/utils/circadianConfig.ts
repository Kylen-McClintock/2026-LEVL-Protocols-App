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
    circadianPhase: 'Golden Morning Light Sync & Hydration',
    skyColorHex: '#FBBF24',
    startColorHex: '#F59E0B',
    endColorHex: '#FBBF24',
    gradientCSS: 'linear-gradient(to bottom, #F59E0B, #FBBF24)',
    badgeGradientCSS: 'linear-gradient(135deg, rgba(245,158,11,0.3), rgba(251,191,36,0.25))',
    accentGradient: 'from-amber-500/20 via-yellow-500/10 to-transparent',
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
    startColorHex: '#FBBF24',
    endColorHex: '#38BDF8',
    gradientCSS: 'linear-gradient(to bottom, #FBBF24, #38BDF8)',
    badgeGradientCSS: 'linear-gradient(135deg, rgba(56,189,248,0.3), rgba(14,165,233,0.25))',
    accentGradient: 'from-sky-500/20 via-cyan-500/10 to-transparent',
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
    startColorHex: '#38BDF8',
    endColorHex: '#0EA5E9',
    gradientCSS: 'linear-gradient(to bottom, #38BDF8, #0EA5E9)',
    badgeGradientCSS: 'linear-gradient(135deg, rgba(56,189,248,0.3), rgba(14,165,233,0.25))',
    accentGradient: 'from-sky-500/20 via-cyan-500/10 to-transparent',
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
    skyColorHex: '#7DD3FC',
    startColorHex: '#0EA5E9',
    endColorHex: '#7DD3FC',
    gradientCSS: 'linear-gradient(to bottom, #0EA5E9, #7DD3FC)',
    badgeGradientCSS: 'linear-gradient(135deg, rgba(14,165,233,0.3), rgba(125,211,252,0.25))',
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
    startColorHex: '#7DD3FC',
    endColorHex: '#0284C7',
    gradientCSS: 'linear-gradient(to bottom, #7DD3FC, #BAE6FD, #0284C7)',
    badgeGradientCSS: 'linear-gradient(135deg, rgba(125,211,252,0.4), rgba(186,230,253,0.35), rgba(2,132,199,0.25))',
    accentGradient: 'from-sky-300/25 via-cyan-400/15 to-transparent',
    icon: Sun,
    badgeBg: 'bg-sky-400/15',
    badgeBorder: 'border-sky-300/50',
    badgeText: 'text-sky-200',
    glowShadow: 'shadow-[0_0_20px_rgba(186,230,253,0.55)]',
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
    startColorHex: '#0284C7',
    endColorHex: '#2563EB',
    gradientCSS: 'linear-gradient(to bottom, #0284C7, #2563EB)',
    badgeGradientCSS: 'linear-gradient(135deg, rgba(2,132,199,0.35), rgba(37,99,235,0.25))',
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
    label: 'Afternoon Workout & Peak',
    timeRange: '2:00 PM – 5:30 PM',
    circadianPhase: 'Deep Daylight Sky • Peak Muscle Performance & VO2',
    skyColorHex: '#4F46E5',
    startColorHex: '#2563EB',
    endColorHex: '#4F46E5',
    gradientCSS: 'linear-gradient(to bottom, #2563EB, #4F46E5)',
    badgeGradientCSS: 'linear-gradient(135deg, rgba(37,99,235,0.3), rgba(79,70,229,0.25))',
    accentGradient: 'from-blue-600/20 via-indigo-600/10 to-transparent',
    icon: Sun,
    badgeBg: 'bg-blue-500/15',
    badgeBorder: 'border-blue-500/40',
    badgeText: 'text-blue-300',
    glowShadow: 'shadow-[0_0_16px_rgba(37,99,235,0.45)]',
    activeRing: 'ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-950',
    startHour: 14,
    endHour: 17
  },
  late_afternoon: {
    key: 'late_afternoon',
    label: 'Late Afternoon',
    timeRange: '3:30 PM – 5:30 PM',
    circadianPhase: 'Pre-Sunset Atmosphere • Core Temperature Peak',
    skyColorHex: '#F97316',
    startColorHex: '#4F46E5',
    endColorHex: '#F97316',
    gradientCSS: 'linear-gradient(to bottom, #4F46E5, #F97316)',
    badgeGradientCSS: 'linear-gradient(135deg, rgba(79,70,229,0.3), rgba(249,115,22,0.25))',
    accentGradient: 'from-indigo-600/20 via-orange-600/10 to-transparent',
    icon: Sun,
    badgeBg: 'bg-orange-500/15',
    badgeBorder: 'border-orange-500/40',
    badgeText: 'text-orange-300',
    glowShadow: 'shadow-[0_0_16px_rgba(249,115,22,0.45)]',
    activeRing: 'ring-2 ring-orange-400 ring-offset-2 ring-offset-slate-950',
    startHour: 15,
    endHour: 18
  },
  post_meal: {
    key: 'post_meal',
    label: 'Post-Meal Window',
    timeRange: '5:00 PM – 7:30 PM',
    circadianPhase: 'Golden Horizon • Postprandial Glucose Walk & Thermal Drop',
    skyColorHex: '#EA580C',
    startColorHex: '#F97316',
    endColorHex: '#EA580C',
    gradientCSS: 'linear-gradient(to bottom, #F97316, #EA580C)',
    badgeGradientCSS: 'linear-gradient(135deg, rgba(249,115,22,0.35), rgba(234,88,12,0.3))',
    accentGradient: 'from-orange-500/20 via-amber-500/10 to-transparent',
    icon: Sunset,
    badgeBg: 'bg-orange-500/15',
    badgeBorder: 'border-orange-500/40',
    badgeText: 'text-orange-300',
    glowShadow: 'shadow-[0_0_16px_rgba(249,115,22,0.45)]',
    activeRing: 'ring-2 ring-orange-400 ring-offset-2 ring-offset-slate-950',
    startHour: 17,
    endHour: 20
  },
  evening: {
    key: 'evening',
    label: 'Evening & Dinner',
    timeRange: '5:30 PM – 8:30 PM',
    circadianPhase: 'Sunset Glow • Blue Light Moderation & Wind-Down',
    skyColorHex: '#F43F5E',
    startColorHex: '#EA580C',
    endColorHex: '#F43F5E',
    gradientCSS: 'linear-gradient(to bottom, #EA580C, #F43F5E)',
    badgeGradientCSS: 'linear-gradient(135deg, rgba(234,88,12,0.35), rgba(244,63,94,0.3))',
    accentGradient: 'from-orange-500/20 via-pink-500/15 to-transparent',
    icon: Sunset,
    badgeBg: 'bg-rose-500/15',
    badgeBorder: 'border-rose-400/40',
    badgeText: 'text-rose-300',
    glowShadow: 'shadow-[0_0_18px_rgba(244,63,94,0.5)]',
    activeRing: 'ring-2 ring-rose-400 ring-offset-2 ring-offset-slate-950',
    startHour: 17,
    endHour: 20
  },
  evening_supplement_stack: {
    key: 'evening_supplement_stack',
    label: 'Evening Stack',
    timeRange: '7:30 PM – 9:30 PM',
    circadianPhase: 'Melatonin Synthesis & Cortisol Suppression',
    skyColorHex: '#8B5CF6',
    startColorHex: '#F43F5E',
    endColorHex: '#8B5CF6',
    gradientCSS: 'linear-gradient(to bottom, #F43F5E, #8B5CF6)',
    badgeGradientCSS: 'linear-gradient(135deg, rgba(244,63,94,0.3), rgba(139,92,246,0.25))',
    accentGradient: 'from-pink-500/20 via-purple-500/10 to-transparent',
    icon: Moon,
    badgeBg: 'bg-purple-500/15',
    badgeBorder: 'border-purple-500/40',
    badgeText: 'text-purple-300',
    glowShadow: 'shadow-[0_0_16px_rgba(139,92,246,0.45)]',
    activeRing: 'ring-2 ring-purple-400 ring-offset-2 ring-offset-slate-950',
    startHour: 19,
    endHour: 21
  },
  wind_down: {
    key: 'wind_down',
    label: 'Evening Wind-Down',
    timeRange: '8:30 PM – 10:30 PM',
    circadianPhase: 'Twilight Indigo • Parasympathetic Tone & Screen Cutoff',
    skyColorHex: '#6366F1',
    startColorHex: '#8B5CF6',
    endColorHex: '#6366F1',
    gradientCSS: 'linear-gradient(to bottom, #8B5CF6, #6366F1)',
    badgeGradientCSS: 'linear-gradient(135deg, rgba(139,92,246,0.35), rgba(99,102,241,0.25))',
    accentGradient: 'from-purple-500/20 via-indigo-600/10 to-transparent',
    icon: Moon,
    badgeBg: 'bg-indigo-500/15',
    badgeBorder: 'border-indigo-500/40',
    badgeText: 'text-indigo-300',
    glowShadow: 'shadow-[0_0_16px_rgba(99,102,241,0.45)]',
    activeRing: 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-950',
    startHour: 20,
    endHour: 22
  },
  bedtime: {
    key: 'bedtime',
    label: 'Bedtime & Sleep',
    timeRange: '10:00 PM – 5:30 AM',
    circadianPhase: 'Midnight Starlit Abyss • Glymphatic Cleansing & Recovery',
    skyColorHex: '#4338CA',
    startColorHex: '#6366F1',
    endColorHex: '#1E1B4B',
    gradientCSS: 'linear-gradient(to bottom, #6366F1, #4338CA, #1E1B4B)',
    badgeGradientCSS: 'linear-gradient(135deg, rgba(99,102,241,0.35), rgba(67,56,202,0.4), rgba(30,27,75,0.45))',
    accentGradient: 'from-indigo-600/25 via-slate-950/50 to-transparent',
    icon: MoonStar,
    badgeBg: 'bg-indigo-900/30',
    badgeBorder: 'border-indigo-500/40',
    badgeText: 'text-indigo-200',
    glowShadow: 'shadow-[0_0_20px_rgba(67,56,202,0.5)]',
    activeRing: 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-950',
    startHour: 22,
    endHour: 5
  },
  pre_bed: {
    key: 'pre_bed',
    label: 'Pre-Bed Preparation',
    timeRange: '9:30 PM – 11:00 PM',
    circadianPhase: 'Deep Twilight • Sleep Architecture Priming',
    skyColorHex: '#4338CA',
    startColorHex: '#6366F1',
    endColorHex: '#1E1B4B',
    gradientCSS: 'linear-gradient(to bottom, #6366F1, #4338CA, #1E1B4B)',
    badgeGradientCSS: 'linear-gradient(135deg, rgba(99,102,241,0.35), rgba(67,56,202,0.4), rgba(30,27,75,0.45))',
    accentGradient: 'from-indigo-600/25 via-slate-950/50 to-transparent',
    icon: MoonStar,
    badgeBg: 'bg-indigo-900/30',
    badgeBorder: 'border-indigo-500/40',
    badgeText: 'text-indigo-200',
    glowShadow: 'shadow-[0_0_20px_rgba(67,56,202,0.5)]',
    activeRing: 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-950',
    startHour: 21,
    endHour: 23
  },
  anytime: {
    key: 'anytime',
    label: 'Anytime / Flexible Window',
    timeRange: 'Flexible Timing',
    circadianPhase: 'Throughout Today • Habit Synergy & Vitality',
    skyColorHex: '#A855F7',
    startColorHex: '#A855F7',
    endColorHex: '#8B5CF6',
    gradientCSS: 'linear-gradient(to bottom, #A855F7, #8B5CF6)',
    badgeGradientCSS: 'linear-gradient(135deg, rgba(168,85,247,0.35), rgba(139,92,246,0.25))',
    accentGradient: 'from-purple-500/20 via-indigo-500/10 to-transparent',
    icon: Sparkles,
    badgeBg: 'bg-purple-500/15',
    badgeBorder: 'border-purple-500/40',
    badgeText: 'text-purple-300',
    glowShadow: 'shadow-[0_0_18px_rgba(168,85,247,0.45)]',
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
  if (normalized.includes('morning_supplement') || normalized.includes('am_stack') || normalized.includes('am stack')) {
    return CIRCADIAN_SLOTS.morning_supplement_stack
  }
  if (normalized.includes('first_meal') || normalized.includes('first meal') || normalized.includes('breakfast') || normalized.includes('meal_1')) {
    return CIRCADIAN_SLOTS.first_meal
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
  if (normalized.includes('evening_supplement') || normalized.includes('dinner_stack') || normalized.includes('pm_stack')) {
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

/**
 * Mathematically builds a seamless continuous linear gradient spanning from top to bottom
 * based on whichever ordered sequence of time blocks are actively rendered on the user's page.
 * Guarantees zero hard cuts and 100% smooth, continuous chromatic interpolation.
 */
export function buildDynamicCircadianGradientCSS(slotKeys: string[]): string {
  if (!slotKeys || slotKeys.length === 0) {
    return 'linear-gradient(to bottom, #D97706, #F59E0B, #FBBF24, #38BDF8, #0EA5E9, #7DD3FC, #0284C7, #2563EB, #4F46E5, #F97316, #EA580C, #F43F5E, #8B5CF6, #6366F1, #4338CA, #1E1B4B)'
  }
  if (slotKeys.length === 1) {
    return getCircadianConfig(slotKeys[0]).gradientCSS
  }

  const rawColorSequence: string[] = []

  slotKeys.forEach((key, idx) => {
    const cfg = getCircadianConfig(key)

    if (cfg.key === 'anytime') {
      // Injects an iridescent violet bridge
      rawColorSequence.push('#A855F7')
    } else {
      if (idx === 0) {
        rawColorSequence.push(cfg.startColorHex)
      }
      if (cfg.skyColorHex && cfg.skyColorHex !== cfg.startColorHex) {
        rawColorSequence.push(cfg.skyColorHex)
      }
      if (cfg.endColorHex && cfg.endColorHex !== cfg.skyColorHex) {
        rawColorSequence.push(cfg.endColorHex)
      }
    }
  })

  // Deduplicate adjacent identical colors to maintain fluid transitions
  const uniqueColors: string[] = []
  rawColorSequence.forEach((c) => {
    if (uniqueColors.length === 0 || uniqueColors[uniqueColors.length - 1] !== c) {
      uniqueColors.push(c)
    }
  })

  if (uniqueColors.length <= 1) {
    return getCircadianConfig(slotKeys[0]).gradientCSS
  }

  const total = uniqueColors.length - 1
  const stops = uniqueColors.map((col, i) => {
    const pct = Math.round((i / total) * 100)
    return `${col} ${pct}%`
  })

  return `linear-gradient(to bottom, ${stops.join(', ')})`
}
