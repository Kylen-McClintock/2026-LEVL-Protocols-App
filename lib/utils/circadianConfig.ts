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
  skyColorHex: string
  accentGradient: string
  icon: LucideIcon
  badgeBg: string
  badgeBorder: string
  badgeText: string
  glowShadow: string
  activeRing: string
  spineGradientStop: string
  startHour: number
  endHour: number
}

export const CIRCADIAN_SLOTS: Record<string, CircadianSlotConfig> = {
  waking: {
    key: 'waking',
    label: 'Waking & Early Dawn',
    timeRange: '5:30 AM – 7:30 AM',
    circadianPhase: 'Cortisol Awakening & Natural Light Exposure',
    skyColorHex: '#F59E0B',
    accentGradient: 'from-amber-500/20 via-amber-500/10 to-transparent',
    icon: Sunrise,
    badgeBg: 'bg-amber-500/15',
    badgeBorder: 'border-amber-500/40',
    badgeText: 'text-amber-300',
    glowShadow: 'shadow-[0_0_16px_rgba(245,158,11,0.4)]',
    activeRing: 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950',
    spineGradientStop: 'rgba(245, 158, 11, 0.9)',
    startHour: 5,
    endHour: 8
  },
  morning_routine: {
    key: 'morning_routine',
    label: 'Morning Routine',
    timeRange: '6:30 AM – 9:00 AM',
    circadianPhase: 'Circadian Light Sync & Morning Hydration',
    skyColorHex: '#F59E0B',
    accentGradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
    icon: Sunrise,
    badgeBg: 'bg-amber-500/15',
    badgeBorder: 'border-amber-500/40',
    badgeText: 'text-amber-300',
    glowShadow: 'shadow-[0_0_16px_rgba(245,158,11,0.4)]',
    activeRing: 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950',
    spineGradientStop: 'rgba(245, 158, 11, 0.9)',
    startHour: 6,
    endHour: 9
  },
  morning: {
    key: 'morning',
    label: 'Morning Alertness',
    timeRange: '8:00 AM – 11:30 AM',
    circadianPhase: 'High-Lux Alertness & Dopaminergic Focus',
    skyColorHex: '#06B6D4',
    accentGradient: 'from-cyan-500/20 via-sky-500/10 to-transparent',
    icon: Zap,
    badgeBg: 'bg-cyan-500/15',
    badgeBorder: 'border-cyan-500/40',
    badgeText: 'text-cyan-300',
    glowShadow: 'shadow-[0_0_16px_rgba(6,182,212,0.4)]',
    activeRing: 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950',
    spineGradientStop: 'rgba(6, 182, 212, 0.9)',
    startHour: 8,
    endHour: 11
  },
  morning_supplement_stack: {
    key: 'morning_supplement_stack',
    label: 'Morning Stack',
    timeRange: '8:00 AM – 11:00 AM',
    circadianPhase: 'Fasted / Post-Breakfast Bioavailability',
    skyColorHex: '#06B6D4',
    accentGradient: 'from-cyan-500/20 via-teal-500/10 to-transparent',
    icon: Zap,
    badgeBg: 'bg-cyan-500/15',
    badgeBorder: 'border-cyan-500/40',
    badgeText: 'text-cyan-300',
    glowShadow: 'shadow-[0_0_16px_rgba(6,182,212,0.4)]',
    activeRing: 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950',
    spineGradientStop: 'rgba(6, 182, 212, 0.9)',
    startHour: 8,
    endHour: 11
  },
  midday: {
    key: 'midday',
    label: 'Midday & Solar Noon',
    timeRange: '11:30 AM – 2:30 PM',
    circadianPhase: 'Peak Core Body Temp & Solar Noon Alertness',
    skyColorHex: '#3B82F6',
    accentGradient: 'from-blue-500/20 via-indigo-500/10 to-transparent',
    icon: Sun,
    badgeBg: 'bg-blue-500/15',
    badgeBorder: 'border-blue-500/40',
    badgeText: 'text-blue-300',
    glowShadow: 'shadow-[0_0_16px_rgba(59,130,246,0.4)]',
    activeRing: 'ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-950',
    spineGradientStop: 'rgba(59, 130, 246, 0.9)',
    startHour: 11,
    endHour: 14
  },
  midday_stack: {
    key: 'midday_stack',
    label: 'Midday Stack',
    timeRange: '12:00 PM – 3:00 PM',
    circadianPhase: 'Metabolic & Mitochondrial Co-factors',
    skyColorHex: '#3B82F6',
    accentGradient: 'from-blue-500/20 via-sky-500/10 to-transparent',
    icon: Sun,
    badgeBg: 'bg-blue-500/15',
    badgeBorder: 'border-blue-500/40',
    badgeText: 'text-blue-300',
    glowShadow: 'shadow-[0_0_16px_rgba(59,130,246,0.4)]',
    activeRing: 'ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-950',
    spineGradientStop: 'rgba(59, 130, 246, 0.9)',
    startHour: 12,
    endHour: 15
  },
  afternoon: {
    key: 'afternoon',
    label: 'Afternoon Prime',
    timeRange: '2:00 PM – 5:30 PM',
    circadianPhase: 'Peak Muscle Efficiency & Physical Performance',
    skyColorHex: '#38BDF8',
    accentGradient: 'from-sky-500/20 via-cyan-500/10 to-transparent',
    icon: Sun,
    badgeBg: 'bg-sky-500/15',
    badgeBorder: 'border-sky-500/40',
    badgeText: 'text-sky-300',
    glowShadow: 'shadow-[0_0_16px_rgba(56,189,248,0.4)]',
    activeRing: 'ring-2 ring-sky-400 ring-offset-2 ring-offset-slate-950',
    spineGradientStop: 'rgba(56, 189, 248, 0.9)',
    startHour: 14,
    endHour: 17
  },
  post_meal: {
    key: 'post_meal',
    label: 'Post-Meal Window',
    timeRange: 'Postprandial / Meal Timing',
    circadianPhase: 'Glucose Regulation & Lipid Assimilation',
    skyColorHex: '#F97316',
    accentGradient: 'from-orange-500/20 via-amber-500/10 to-transparent',
    icon: Sunset,
    badgeBg: 'bg-orange-500/15',
    badgeBorder: 'border-orange-500/40',
    badgeText: 'text-orange-300',
    glowShadow: 'shadow-[0_0_16px_rgba(249,115,22,0.4)]',
    activeRing: 'ring-2 ring-orange-400 ring-offset-2 ring-offset-slate-950',
    spineGradientStop: 'rgba(249, 115, 22, 0.9)',
    startHour: 12,
    endHour: 20
  },
  evening: {
    key: 'evening',
    label: 'Golden Hour & Evening',
    timeRange: '5:30 PM – 8:30 PM',
    circadianPhase: 'Sunset Sync, Blue Light Moderation & Recovery',
    skyColorHex: '#F97316',
    accentGradient: 'from-orange-500/20 via-rose-500/10 to-transparent',
    icon: Sunset,
    badgeBg: 'bg-orange-500/15',
    badgeBorder: 'border-orange-500/40',
    badgeText: 'text-orange-300',
    glowShadow: 'shadow-[0_0_16px_rgba(249,115,22,0.4)]',
    activeRing: 'ring-2 ring-orange-400 ring-offset-2 ring-offset-slate-950',
    spineGradientStop: 'rgba(249, 115, 22, 0.9)',
    startHour: 17,
    endHour: 20
  },
  evening_supplement_stack: {
    key: 'evening_supplement_stack',
    label: 'Evening Stack',
    timeRange: '7:30 PM – 9:30 PM',
    circadianPhase: 'Melatonin Synthesis & Cortisol Suppression',
    skyColorHex: '#8B5CF6',
    accentGradient: 'from-purple-500/20 via-indigo-500/10 to-transparent',
    icon: Moon,
    badgeBg: 'bg-purple-500/15',
    badgeBorder: 'border-purple-500/40',
    badgeText: 'text-purple-300',
    glowShadow: 'shadow-[0_0_16px_rgba(139,92,246,0.4)]',
    activeRing: 'ring-2 ring-purple-400 ring-offset-2 ring-offset-slate-950',
    spineGradientStop: 'rgba(139, 92, 246, 0.9)',
    startHour: 19,
    endHour: 21
  },
  wind_down: {
    key: 'wind_down',
    label: 'Night Wind-Down',
    timeRange: '8:30 PM – 10:30 PM',
    circadianPhase: 'Dim Light Melatonin Onset (DLMO) & Parasympathetic Tone',
    skyColorHex: '#8B5CF6',
    accentGradient: 'from-purple-500/20 via-indigo-500/10 to-transparent',
    icon: Moon,
    badgeBg: 'bg-purple-500/15',
    badgeBorder: 'border-purple-500/40',
    badgeText: 'text-purple-300',
    glowShadow: 'shadow-[0_0_16px_rgba(139,92,246,0.4)]',
    activeRing: 'ring-2 ring-purple-400 ring-offset-2 ring-offset-slate-950',
    spineGradientStop: 'rgba(139, 92, 246, 0.9)',
    startHour: 20,
    endHour: 22
  },
  bedtime: {
    key: 'bedtime',
    label: 'Bedtime & Sleep',
    timeRange: '10:00 PM – 5:30 AM',
    circadianPhase: 'Glymphatic System Clearance & Slow-Wave Delta Rest',
    skyColorHex: '#6366F1',
    accentGradient: 'from-indigo-500/20 via-slate-950/40 to-transparent',
    icon: MoonStar,
    badgeBg: 'bg-indigo-500/15',
    badgeBorder: 'border-indigo-500/40',
    badgeText: 'text-indigo-300',
    glowShadow: 'shadow-[0_0_16px_rgba(99,102,241,0.45)]',
    activeRing: 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-950',
    spineGradientStop: 'rgba(99, 102, 241, 0.9)',
    startHour: 22,
    endHour: 5
  },
  anytime: {
    key: 'anytime',
    label: 'Flexible Window',
    timeRange: 'Flexible Timing',
    circadianPhase: 'Individual Context & Habit Synergy',
    skyColorHex: '#A855F7',
    accentGradient: 'from-purple-500/20 via-fuchsia-500/10 to-transparent',
    icon: Sparkles,
    badgeBg: 'bg-purple-500/15',
    badgeBorder: 'border-purple-500/40',
    badgeText: 'text-purple-300',
    glowShadow: 'shadow-[0_0_16px_rgba(168,85,247,0.35)]',
    activeRing: 'ring-2 ring-purple-400 ring-offset-2 ring-offset-slate-950',
    spineGradientStop: 'rgba(168, 85, 247, 0.9)',
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
  if (normalized.includes('morning_routine') || normalized.includes('fasted')) {
    return CIRCADIAN_SLOTS.morning_routine
  }
  if (normalized.includes('morning') || normalized.includes('sunlight')) {
    return CIRCADIAN_SLOTS.morning
  }
  if (normalized.includes('noon') || normalized.includes('lunch') || normalized.includes('midday')) {
    return CIRCADIAN_SLOTS.midday
  }
  if (normalized.includes('afternoon') || normalized.includes('workout') || normalized.includes('training')) {
    return CIRCADIAN_SLOTS.afternoon
  }
  if (normalized.includes('post_meal') || normalized.includes('post meal') || normalized.includes('meal')) {
    return CIRCADIAN_SLOTS.post_meal
  }
  if (normalized.includes('evening') || normalized.includes('sunset') || normalized.includes('dinner')) {
    return CIRCADIAN_SLOTS.evening
  }
  if (normalized.includes('wind') || normalized.includes('dim')) {
    return CIRCADIAN_SLOTS.wind_down
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
