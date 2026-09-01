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
    label: 'Afternoon Workout & Peak',
    timeRange: '2:00 PM – 5:30 PM',
    circadianPhase: 'Deep Daylight Sky • Peak Muscle Performance & VO2',
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
    label: 'Late Afternoon & Pre-Sunset',
    timeRange: '3:30 PM – 5:30 PM',
    circadianPhase: 'Pre-Sunset Lavender Sky • Core Temperature Peak',
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
    label: 'Post-Meal Window',
    timeRange: '5:00 PM – 7:30 PM',
    circadianPhase: 'Golden Hour Sunset & Twilight Rose • Postprandial Glucose Walk & Thermal Drop',
    skyColorHex: '#F7C275',
    startColorHex: '#E2B4AA',
    endColorHex: '#F7C275',
    gradientCSS: 'linear-gradient(to bottom, #9D9EC9, #E2B4AA, #F7C275)',
    badgeGradientCSS: 'linear-gradient(135deg, rgba(226,180,170,0.35), rgba(247,194,117,0.3))',
    accentGradient: 'from-amber-500/20 via-orange-400/10 to-transparent',
    icon: Sunset,
    badgeBg: 'bg-amber-500/15',
    badgeBorder: 'border-amber-400/40',
    badgeText: 'text-amber-200',
    glowShadow: 'shadow-[0_0_16px_rgba(247,194,117,0.5)]',
    activeRing: 'ring-2 ring-amber-300 ring-offset-2 ring-offset-slate-950',
    startHour: 17,
    endHour: 20
  },
  evening: {
    key: 'evening',
    label: 'Evening & Dinner',
    timeRange: '5:30 PM – 8:30 PM',
    circadianPhase: 'Vibrant Sunset Horizon & Persimmon Sky • Blue Light Moderation',
    skyColorHex: '#F88A20',
    startColorHex: '#F7C275',
    endColorHex: '#EA580C',
    gradientCSS: 'linear-gradient(to bottom, #E2B4AA, #F7C275, #F88A20, #EA580C)',
    badgeGradientCSS: 'linear-gradient(135deg, rgba(247,194,117,0.35), rgba(248,138,32,0.35))',
    accentGradient: 'from-orange-500/25 via-pink-500/15 to-transparent',
    icon: Sunset,
    badgeBg: 'bg-orange-500/15',
    badgeBorder: 'border-orange-400/50',
    badgeText: 'text-orange-200',
    glowShadow: 'shadow-[0_0_20px_rgba(248,138,32,0.55)]',
    activeRing: 'ring-2 ring-orange-400 ring-offset-2 ring-offset-slate-950',
    startHour: 17,
    endHour: 20
  },
  evening_supplement_stack: {
    key: 'evening_supplement_stack',
    label: 'Evening Stack',
    timeRange: '7:30 PM – 9:30 PM',
    circadianPhase: 'Melatonin Synthesis & Cortisol Suppression',
    skyColorHex: '#EC4899',
    startColorHex: '#F88A20',
    endColorHex: '#EC4899',
    gradientCSS: 'linear-gradient(to bottom, #F88A20, #EC4899, #8B5CF6)',
    badgeGradientCSS: 'linear-gradient(135deg, rgba(248,138,32,0.3), rgba(236,72,153,0.25))',
    accentGradient: 'from-pink-500/20 via-purple-500/10 to-transparent',
    icon: Moon,
    badgeBg: 'bg-pink-500/15',
    badgeBorder: 'border-pink-400/40',
    badgeText: 'text-pink-300',
    glowShadow: 'shadow-[0_0_16px_rgba(236,72,153,0.45)]',
    activeRing: 'ring-2 ring-pink-400 ring-offset-2 ring-offset-slate-950',
    startHour: 19,
    endHour: 21
  },
  wind_down: {
    key: 'wind_down',
    label: 'Evening Wind-Down',
    timeRange: '8:30 PM – 10:30 PM',
    circadianPhase: 'Twilight Violet & Indigo • Parasympathetic Tone & Screen Cutoff',
    skyColorHex: '#8B5CF6',
    startColorHex: '#8B5CF6',
    endColorHex: '#6366F1',
    gradientCSS: 'linear-gradient(to bottom, #EC4899, #8B5CF6, #6366F1)',
    badgeGradientCSS: 'linear-gradient(135deg, rgba(139,92,246,0.35), rgba(99,102,241,0.25))',
    accentGradient: 'from-purple-500/20 via-indigo-600/10 to-transparent',
    icon: Moon,
    badgeBg: 'bg-purple-500/15',
    badgeBorder: 'border-purple-500/40',
    badgeText: 'text-indigo-300',
    glowShadow: 'shadow-[0_0_16px_rgba(139,92,246,0.45)]',
    activeRing: 'ring-2 ring-purple-400 ring-offset-2 ring-offset-slate-950',
    startHour: 20,
    endHour: 22
  },
  pre_bed: {
    key: 'pre_bed',
    label: 'Pre-Bed Preparation',
    timeRange: '9:30 PM – 11:00 PM',
    circadianPhase: 'Deep Twilight • Sleep Architecture Priming',
    skyColorHex: '#6366F1',
    startColorHex: '#8B5CF6',
    endColorHex: '#4F46E5',
    gradientCSS: 'linear-gradient(to bottom, #8B5CF6, #6366F1, #4F46E5)',
    badgeGradientCSS: 'linear-gradient(135deg, rgba(99,102,241,0.35), rgba(79,70,229,0.4))',
    accentGradient: 'from-indigo-600/25 via-blue-900/40 to-transparent',
    icon: MoonStar,
    badgeBg: 'bg-indigo-900/30',
    badgeBorder: 'border-indigo-500/40',
    badgeText: 'text-indigo-200',
    glowShadow: 'shadow-[0_0_20px_rgba(79,70,229,0.5)]',
    activeRing: 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-950',
    startHour: 21,
    endHour: 23
  },
  bedtime: {
    key: 'bedtime',
    label: 'Bedtime & Sleep',
    timeRange: '10:00 PM – 5:30 AM',
    circadianPhase: 'Deep Midnight Starlit Abyss • Glymphatic Cleansing & Recovery',
    skyColorHex: '#1E3A8A',
    startColorHex: '#6366F1',
    endColorHex: '#0B132B',
    gradientCSS: 'linear-gradient(to bottom, #6366F1, #1E3A8A, #172554, #0B132B)',
    badgeGradientCSS: 'linear-gradient(135deg, rgba(30,58,138,0.5), rgba(11,19,43,0.7))',
    accentGradient: 'from-blue-900/30 via-indigo-950/50 to-transparent',
    icon: MoonStar,
    badgeBg: 'bg-blue-950/70',
    badgeBorder: 'border-blue-700/60',
    badgeText: 'text-blue-300',
    glowShadow: 'shadow-[0_0_20px_rgba(30,58,138,0.8)]',
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

/**
 * Mathematically builds a seamless continuous linear gradient spanning from top to bottom
 * based on whichever ordered sequence of time blocks are actively rendered on the user's page.
 * Guarantees that each time block holds its signature primary color across ~98% of its zone,
 * and only smoothly blends at the narrow tail ends between adjacent blocks.
 */
export function buildDynamicCircadianGradientCSS(slotKeys: string[]): string {
  if (!slotKeys || slotKeys.length === 0) {
    return 'linear-gradient(to bottom, #D97706 0%, #F59E0B 8%, #FBBF24 16%, #38BDF8 26%, #0284C7 38%, #5B9BD5 50%, #9D9EC9 62%, #E2B4AA 72%, #F7C275 80%, #F88A20 87%, #EC4899 92%, #8B5CF6 95%, #6366F1 98%, #1E3A8A 100%)'
  }
  if (slotKeys.length === 1) {
    return getCircadianConfig(slotKeys[0]).gradientCSS
  }

  const N = slotKeys.length
  const step = 100 / N
  const colorStops: { color: string; pct: number }[] = []

  // Helper to check if color is in the daylight blue/cyan family
  const isBlueFamily = (hex: string) => {
    const h = hex.toLowerCase()
    return h === '#38bdf8' || h === '#0ea5e9' || h === '#0284c7' || h === '#0369a1' || h === '#2563eb' || h === '#3b82f6' || h === '#5b9bd5'
  }

  // Helper to check if color is in the orange/amber sunset family
  const isOrangeFamily = (hex: string) => {
    const h = hex.toLowerCase()
    return h === '#f97316' || h === '#ea580c' || h === '#f88a20' || h === '#f7c275' || h === '#f59e0b' || h === '#d97706' || h === '#fbbf24'
  }

  // Helper to check if color is dark blue
  const isDarkBlueFamily = (hex: string) => {
    const h = hex.toLowerCase()
    return h === '#172554' || h === '#1e3a8a' || h === '#0f172a' || h === '#0b132b' || h === '#1d4ed8' || h === '#1e40af' || h === '#2563eb' || h === '#1e1b4b'
  }

  slotKeys.forEach((key, i) => {
    const cfg = getCircadianConfig(key)
    const startPct = i * step
    const endPct = (i + 1) * step
    const primary = cfg.skyColorHex

    const nextKey = i < N - 1 ? slotKeys[i + 1] : null
    const nextCfg = nextKey ? getCircadianConfig(nextKey) : null
    const nextPrimary = nextCfg ? nextCfg.skyColorHex : null

    // Multi-stop sunset bridge between daytime blue and sunset/evening
    const isTransitioningToSunset = nextPrimary && (
      (isBlueFamily(primary) && isOrangeFamily(nextPrimary)) ||
      (isBlueFamily(primary) && (nextKey === 'post_meal' || nextKey === 'evening' || nextKey === 'late_afternoon'))
    )

    if (i === 0) {
      // First slot: if waking, morning, or morning stack, guarantee warm golden sunrise dawn (#D97706 -> #F59E0B -> #FBBF24) into sky blue
      if (['waking', 'morning_routine', 'morning', 'morning_supplement_stack', 'first_meal'].includes(cfg.key)) {
        colorStops.push({ color: '#D97706', pct: 0 })
        colorStops.push({ color: '#F59E0B', pct: Math.min(Number((endPct * 0.35).toFixed(1)), 8) })
        colorStops.push({ color: '#FBBF24', pct: Math.min(Number((endPct * 0.7).toFixed(1)), 16) })
        colorStops.push({ color: primary, pct: Math.max(0, Number((endPct - 1.2).toFixed(1))) })
      } else {
        const startCol = cfg.startColorHex || primary
        colorStops.push({ color: startCol, pct: 0 })
        colorStops.push({ color: primary, pct: Math.max(0, Number((endPct - 1.2).toFixed(1))) })
      }
    } else if (cfg.key === 'post_meal') {
      // Post-meal golden hour sunset: rich transition from Twilight Rose (#E2B4AA) to Golden Apricot (#F7C275)
      colorStops.push({ color: '#E2B4AA', pct: Math.min(100, Number((startPct + 1.0).toFixed(1))) })
      colorStops.push({ color: '#F7C275', pct: Math.max(0, Number((endPct - 1.0).toFixed(1))) })
    } else if (cfg.key === 'evening') {
      // Evening vibrant sunset horizon: Golden Apricot (#F7C275) -> Vivid Sunset Orange (#F88A20) -> Persimmon (#EA580C)
      colorStops.push({ color: '#F7C275', pct: Math.min(100, Number((startPct + 0.8).toFixed(1))) })
      colorStops.push({ color: '#F88A20', pct: Number(((startPct + endPct) / 2).toFixed(1)) })
      colorStops.push({ color: '#EA580C', pct: Math.max(0, Number((endPct - 0.8).toFixed(1))) })
    } else if (cfg.key === 'wind_down') {
      // Evening wind-down: Sunset Crimson (#EC4899) -> Twilight Violet (#8B5CF6) -> Indigo (#6366F1)
      colorStops.push({ color: '#EC4899', pct: Math.min(100, Number((startPct + 0.8).toFixed(1))) })
      colorStops.push({ color: '#8B5CF6', pct: Number(((startPct + endPct) / 2).toFixed(1)) })
      colorStops.push({ color: '#6366F1', pct: Math.max(0, Number((endPct - 0.8).toFixed(1))) })
    } else if (i === N - 1) {
      // Last slot (e.g. Bedtime): begins at startPct, holds rich visible dark midnight blue through to 100%
      colorStops.push({ color: cfg.startColorHex || primary, pct: Math.min(100, Number((startPct + 1.0).toFixed(1))) })
      colorStops.push({ color: primary, pct: Number(((startPct + 100) / 2).toFixed(1)) })
      colorStops.push({ color: cfg.endColorHex || '#0B132B', pct: 100 })
    } else {
      colorStops.push({ color: primary, pct: Math.min(100, Number((startPct + 1.0).toFixed(1))) })
      colorStops.push({ color: primary, pct: Math.max(0, Number((endPct - 1.0).toFixed(1))) })
    }

    // Bridge seamless transitions
    if (isTransitioningToSunset) {
      colorStops.push({ color: '#9D9EC9', pct: Number((endPct - 0.5).toFixed(1)) })
      colorStops.push({ color: '#E2B4AA', pct: Number(endPct.toFixed(1)) })
    } else if (nextPrimary && isOrangeFamily(primary) && (nextPrimary.toLowerCase() === '#ec4899' || nextPrimary.toLowerCase() === '#8b5cf6')) {
      colorStops.push({ color: '#EC4899', pct: Number(endPct.toFixed(1)) })
    } else if (nextPrimary && (primary.toLowerCase() === '#8b5cf6' || primary.toLowerCase() === '#6366f1') && isDarkBlueFamily(nextPrimary)) {
      colorStops.push({ color: '#6366F1', pct: Number(endPct.toFixed(1)) })
    }
  })

  // Sort stops by percentage
  colorStops.sort((a, b) => a.pct - b.pct)

  // Deduplicate adjacent stops with identical pct & color to keep CSS clean
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
