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
import { canonicalizeTimingSlot } from './timingSlots'
import { UserProfile } from '@/lib/types'

export type PulsePhaseType = 
  | 'growth' 
  | 'autophagy' 
  | 'glymphatic' 
  | 'transition_fasted_to_growth' 
  | 'transition_growth_to_fasted' 
  | 'transition_to_glymphatic' 
  | 'overnight_dual' 
  | 'flexible'

export interface SlotPulsePhaseSegment {
  name: string
  colorHex: string
  textClass: string
  mechanism?: string
  subtitle?: string
}

export interface SlotPulseBadgeConfig {
  phaseType: PulsePhaseType
  label: string
  expandedLabel?: string
  mechanism?: string
  dotColor: string
  dotGradientCSS?: string
  badgeBg: string
  badgeBorder: string
  badgeText: string
  badgeGradientCSS?: string
  fromPhase?: SlotPulsePhaseSegment
  toPhase?: SlotPulsePhaseSegment
  dividerChar?: string
  arrowGradientCSS?: string
}

export interface CircadianSlotConfig {
  key: string
  label: string
  timeRange: string
  circadianPhase: string
  pulseBadge: SlotPulseBadgeConfig
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
    pulseBadge: {
      phaseType: 'transition_to_glymphatic',
      label: 'Neural Reset ➔ Cellular Renewal',
      expandedLabel: 'Neural Reset (Glymphatic) ➔ Cellular Renewal (Autophagy)',
      dotColor: '#8B5CF6',
      dotGradientCSS: 'linear-gradient(135deg, #8B5CF6, #0284C7)',
      badgeBg: 'bg-gradient-to-r from-purple-500/15 via-slate-900/50 to-sky-500/15',
      badgeBorder: 'border-purple-500/30',
      badgeText: 'text-purple-300',
      badgeGradientCSS: 'linear-gradient(135deg, rgba(139,92,246,0.18) 0%, rgba(2,132,199,0.18) 100%)',
      fromPhase: {
        name: 'Neural Reset',
        mechanism: 'Glymphatic',
        colorHex: '#C084FC',
        textClass: 'text-purple-400'
      },
      toPhase: {
        name: 'Cellular Renewal',
        mechanism: 'Autophagy',
        colorHex: '#38BDF8',
        textClass: 'text-sky-400'
      },
      dividerChar: '➔',
      arrowGradientCSS: 'linear-gradient(to right, #C084FC, #38BDF8)'
    },
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
    pulseBadge: {
      phaseType: 'autophagy',
      label: 'Cellular Renewal',
      expandedLabel: 'Cellular Renewal (Autophagy)',
      mechanism: 'Autophagy',
      dotColor: '#0284C7',
      badgeBg: 'bg-sky-500/10',
      badgeBorder: 'border-sky-500/30',
      badgeText: 'text-sky-300'
    },
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
    pulseBadge: {
      phaseType: 'autophagy',
      label: 'Cellular Renewal',
      expandedLabel: 'Cellular Renewal (Autophagy)',
      mechanism: 'Autophagy',
      dotColor: '#0284C7',
      badgeBg: 'bg-sky-500/10',
      badgeBorder: 'border-sky-500/30',
      badgeText: 'text-sky-300'
    },
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
    pulseBadge: {
      phaseType: 'transition_fasted_to_growth',
      label: 'Cellular Renewal ➔ Growth',
      expandedLabel: 'Cellular Renewal (Autophagy) ➔ Growth (mTOR)',
      dotColor: '#10B981',
      dotGradientCSS: 'linear-gradient(135deg, #0284C7, #10B981)',
      badgeBg: 'bg-gradient-to-r from-sky-500/15 via-slate-900/50 to-emerald-500/15',
      badgeBorder: 'border-emerald-500/30',
      badgeText: 'text-emerald-300',
      badgeGradientCSS: 'linear-gradient(135deg, rgba(2,132,199,0.18) 0%, rgba(16,185,129,0.18) 100%)',
      fromPhase: {
        name: 'Cellular Renewal',
        mechanism: 'Autophagy',
        colorHex: '#38BDF8',
        textClass: 'text-sky-400'
      },
      toPhase: {
        name: 'Growth',
        mechanism: 'mTOR',
        colorHex: '#34D399',
        textClass: 'text-emerald-400'
      },
      dividerChar: '➔',
      arrowGradientCSS: 'linear-gradient(to right, #38BDF8, #34D399)'
    },
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
    pulseBadge: {
      phaseType: 'transition_fasted_to_growth',
      label: 'Cellular Renewal ➔ Growth',
      expandedLabel: 'Cellular Renewal (Autophagy) ➔ Growth (mTOR)',
      dotColor: '#10B981',
      dotGradientCSS: 'linear-gradient(135deg, #0284C7, #10B981)',
      badgeBg: 'bg-gradient-to-r from-sky-500/15 via-slate-900/50 to-emerald-500/15',
      badgeBorder: 'border-emerald-500/30',
      badgeText: 'text-emerald-300',
      badgeGradientCSS: 'linear-gradient(135deg, rgba(2,132,199,0.18) 0%, rgba(16,185,129,0.18) 100%)',
      fromPhase: {
        name: 'Cellular Renewal',
        mechanism: 'Autophagy',
        colorHex: '#38BDF8',
        textClass: 'text-sky-400'
      },
      toPhase: {
        name: 'Growth',
        mechanism: 'mTOR',
        colorHex: '#34D399',
        textClass: 'text-emerald-400'
      },
      dividerChar: '➔',
      arrowGradientCSS: 'linear-gradient(to right, #38BDF8, #34D399)'
    },
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
    pulseBadge: {
      phaseType: 'growth',
      label: 'Growth',
      expandedLabel: 'Growth (mTOR)',
      mechanism: 'mTOR',
      dotColor: '#10B981',
      badgeBg: 'bg-emerald-500/10',
      badgeBorder: 'border-emerald-500/30',
      badgeText: 'text-emerald-300'
    },
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
    pulseBadge: {
      phaseType: 'growth',
      label: 'Growth',
      expandedLabel: 'Growth (mTOR)',
      mechanism: 'mTOR',
      dotColor: '#10B981',
      badgeBg: 'bg-emerald-500/10',
      badgeBorder: 'border-emerald-500/30',
      badgeText: 'text-emerald-300'
    },
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
    pulseBadge: {
      phaseType: 'growth',
      label: 'Growth',
      expandedLabel: 'Growth (mTOR)',
      mechanism: 'mTOR',
      dotColor: '#10B981',
      badgeBg: 'bg-emerald-500/10',
      badgeBorder: 'border-emerald-500/30',
      badgeText: 'text-emerald-300'
    },
    skyColorHex: '#2563EB',
    startColorHex: '#0284C7',
    endColorHex: '#2563EB',
    gradientCSS: 'linear-gradient(to bottom, #0284C7, #2563EB)',
    badgeGradientCSS: 'linear-gradient(135deg, rgba(2,132,199,0.3), rgba(37,99,235,0.25))',
    accentGradient: 'from-blue-600/20 via-sky-500/10 to-transparent',
    icon: Sun,
    badgeBg: 'bg-blue-500/15',
    badgeBorder: 'border-blue-400/40',
    badgeText: 'text-sky-300',
    glowShadow: 'shadow-[0_0_16px_rgba(37,99,235,0.45)]',
    activeRing: 'ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-950',
    startHour: 14,
    endHour: 17
  },
  late_afternoon: {
    key: 'late_afternoon',
    label: 'Late Afternoon',
    timeRange: '3:30 PM – 5:30 PM',
    circadianPhase: 'Late Afternoon Sky',
    pulseBadge: {
      phaseType: 'growth',
      label: 'Growth',
      expandedLabel: 'Growth (mTOR)',
      mechanism: 'mTOR',
      dotColor: '#10B981',
      badgeBg: 'bg-emerald-500/10',
      badgeBorder: 'border-emerald-500/30',
      badgeText: 'text-emerald-300'
    },
    skyColorHex: '#1D4ED8',
    startColorHex: '#2563EB',
    endColorHex: '#1D4ED8',
    gradientCSS: 'linear-gradient(to bottom, #2563EB, #1D4ED8)',
    badgeGradientCSS: 'linear-gradient(135deg, rgba(37,99,235,0.35), rgba(29,78,216,0.3))',
    accentGradient: 'from-blue-500/20 via-sky-400/10 to-transparent',
    icon: Sun,
    badgeBg: 'bg-blue-600/15',
    badgeBorder: 'border-blue-500/40',
    badgeText: 'text-blue-200',
    glowShadow: 'shadow-[0_0_16px_rgba(29,78,216,0.45)]',
    activeRing: 'ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-950',
    startHour: 15,
    endHour: 18
  },
  pre_meal: {
    key: 'pre_meal',
    label: 'Pre-Meal',
    timeRange: '4:30 PM – 6:30 PM',
    circadianPhase: 'Pre-Meal Window • Glycemic Buffer',
    pulseBadge: {
      phaseType: 'growth',
      label: 'Growth',
      expandedLabel: 'Growth (mTOR)',
      mechanism: 'mTOR',
      dotColor: '#10B981',
      badgeBg: 'bg-emerald-500/10',
      badgeBorder: 'border-emerald-500/30',
      badgeText: 'text-emerald-300'
    },
    skyColorHex: '#F87E38',
    startColorHex: '#F59E0B',
    endColorHex: '#F87E38',
    gradientCSS: 'linear-gradient(to bottom, #F59E0B, #F87E38)',
    badgeGradientCSS: 'linear-gradient(135deg, rgba(248,126,56,0.35), rgba(240,106,66,0.3))',
    accentGradient: 'from-orange-500/20 via-amber-400/10 to-transparent',
    icon: Sunset,
    badgeBg: 'bg-orange-500/15',
    badgeBorder: 'border-orange-400/40',
    badgeText: 'text-orange-200',
    glowShadow: 'shadow-[0_0_16px_rgba(248,126,56,0.5)]',
    activeRing: 'ring-2 ring-orange-300 ring-offset-2 ring-offset-slate-950',
    startHour: 16,
    endHour: 19
  },
  post_meal: {
    key: 'post_meal',
    label: 'Post-Meal',
    timeRange: '5:00 PM – 7:30 PM',
    circadianPhase: 'Post-Meal Window',
    pulseBadge: {
      phaseType: 'transition_growth_to_fasted',
      label: 'Growth ➔ Cellular Renewal',
      expandedLabel: 'Growth (mTOR) ➔ Cellular Renewal (Autophagy)',
      dotColor: '#0284C7',
      dotGradientCSS: 'linear-gradient(135deg, #10B981, #0284C7)',
      badgeBg: 'bg-gradient-to-r from-emerald-500/15 via-slate-900/50 to-sky-500/15',
      badgeBorder: 'border-sky-500/30',
      badgeText: 'text-sky-300',
      badgeGradientCSS: 'linear-gradient(135deg, rgba(16,185,129,0.18) 0%, rgba(2,132,199,0.18) 100%)',
      fromPhase: {
        name: 'Growth',
        mechanism: 'mTOR',
        colorHex: '#34D399',
        textClass: 'text-emerald-400'
      },
      toPhase: {
        name: 'Cellular Renewal',
        mechanism: 'Autophagy',
        colorHex: '#38BDF8',
        textClass: 'text-sky-400'
      },
      dividerChar: '➔',
      arrowGradientCSS: 'linear-gradient(to right, #34D399, #38BDF8)'
    },
    skyColorHex: '#F87E38',
    startColorHex: '#F87E38',
    endColorHex: '#F87E38',
    gradientCSS: 'linear-gradient(to bottom, #F87E38, #F87E38)',
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
    pulseBadge: {
      phaseType: 'autophagy',
      label: 'Cellular Renewal',
      expandedLabel: 'Cellular Renewal (Autophagy)',
      mechanism: 'Autophagy',
      dotColor: '#0284C7',
      badgeBg: 'bg-sky-500/10',
      badgeBorder: 'border-sky-500/30',
      badgeText: 'text-sky-300'
    },
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
    pulseBadge: {
      phaseType: 'transition_to_glymphatic',
      label: 'Cellular Renewal ➔ Neural Reset',
      expandedLabel: 'Cellular Renewal (Autophagy) ➔ Neural Reset (Glymphatic)',
      dotColor: '#8B5CF6',
      dotGradientCSS: 'linear-gradient(135deg, #0284C7, #8B5CF6)',
      badgeBg: 'bg-gradient-to-r from-sky-500/15 via-slate-900/50 to-purple-500/15',
      badgeBorder: 'border-purple-500/30',
      badgeText: 'text-purple-300',
      badgeGradientCSS: 'linear-gradient(135deg, rgba(2,132,199,0.18) 0%, rgba(139,92,246,0.18) 100%)',
      fromPhase: {
        name: 'Cellular Renewal',
        mechanism: 'Autophagy',
        colorHex: '#38BDF8',
        textClass: 'text-sky-400'
      },
      toPhase: {
        name: 'Neural Reset',
        mechanism: 'Glymphatic',
        colorHex: '#C084FC',
        textClass: 'text-purple-400'
      },
      dividerChar: '➔',
      arrowGradientCSS: 'linear-gradient(to right, #38BDF8, #C084FC)'
    },
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
    pulseBadge: {
      phaseType: 'transition_to_glymphatic',
      label: 'Cellular Renewal ➔ Neural Reset',
      expandedLabel: 'Cellular Renewal (Autophagy) ➔ Neural Reset (Glymphatic)',
      dotColor: '#8B5CF6',
      dotGradientCSS: 'linear-gradient(135deg, #0284C7, #8B5CF6)',
      badgeBg: 'bg-gradient-to-r from-sky-500/15 via-slate-900/50 to-purple-500/15',
      badgeBorder: 'border-purple-500/30',
      badgeText: 'text-purple-300',
      badgeGradientCSS: 'linear-gradient(135deg, rgba(2,132,199,0.18) 0%, rgba(139,92,246,0.18) 100%)',
      fromPhase: {
        name: 'Cellular Renewal',
        mechanism: 'Autophagy',
        colorHex: '#38BDF8',
        textClass: 'text-sky-400'
      },
      toPhase: {
        name: 'Neural Reset',
        mechanism: 'Glymphatic',
        colorHex: '#C084FC',
        textClass: 'text-purple-400',
        subtitle: 'Prep'
      },
      dividerChar: '➔',
      arrowGradientCSS: 'linear-gradient(to right, #38BDF8, #C084FC)'
    },
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
    pulseBadge: {
      phaseType: 'glymphatic',
      label: 'Neural Reset',
      expandedLabel: 'Neural Reset (Glymphatic)',
      mechanism: 'Glymphatic',
      dotColor: '#8B5CF6',
      badgeBg: 'bg-purple-500/10',
      badgeBorder: 'border-purple-500/30',
      badgeText: 'text-purple-300'
    },
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
    pulseBadge: {
      phaseType: 'overnight_dual',
      label: 'Neural Reset + Cellular Renewal',
      expandedLabel: 'Neural Reset (Glymphatic) + Cellular Renewal (Autophagy)',
      dotColor: '#A855F7',
      dotGradientCSS: 'linear-gradient(135deg, #A855F7, #0284C7)',
      badgeBg: 'bg-gradient-to-r from-purple-500/20 via-slate-900/50 to-sky-500/20',
      badgeBorder: 'border-purple-500/40',
      badgeText: 'text-purple-200',
      badgeGradientCSS: 'linear-gradient(135deg, rgba(168,85,247,0.2) 0%, rgba(2,132,199,0.2) 100%)',
      fromPhase: {
        name: 'Neural Reset',
        mechanism: 'Glymphatic',
        colorHex: '#C084FC',
        textClass: 'text-purple-400'
      },
      toPhase: {
        name: 'Cellular Renewal',
        mechanism: 'Autophagy',
        colorHex: '#38BDF8',
        textClass: 'text-sky-400'
      },
      dividerChar: '+',
      arrowGradientCSS: 'linear-gradient(to right, #C084FC, #38BDF8)'
    },
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
    pulseBadge: {
      phaseType: 'flexible',
      label: 'Flexible Window',
      expandedLabel: 'Flexible Window',
      dotColor: '#94A3B8',
      badgeBg: 'bg-slate-800/40',
      badgeBorder: 'border-slate-700/40',
      badgeText: 'text-slate-300'
    },
    skyColorHex: '#8B5CF6',
    startColorHex: '#8B5CF6',
    endColorHex: '#8B5CF6',
    gradientCSS: 'linear-gradient(to bottom, #8B5CF6, #8B5CF6)',
    badgeGradientCSS: 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(99,102,241,0.2))',
    accentGradient: 'from-purple-500/20 via-indigo-500/10 to-transparent',
    icon: Clock,
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
export function getCircadianConfig(slotName?: string | null): CircadianSlotConfig {
  if (!slotName) return CIRCADIAN_SLOTS.anytime
  const normalized = slotName.toLowerCase().trim()

  if (CIRCADIAN_SLOTS[normalized]) {
    return CIRCADIAN_SLOTS[normalized]
  }

  const canonical = canonicalizeTimingSlot(slotName)
  if (CIRCADIAN_SLOTS[canonical]) {
    return CIRCADIAN_SLOTS[canonical]
  }

  return CIRCADIAN_SLOTS.anytime
}

/**
 * Returns the biological pulse badge metadata for a slot configuration
 */
export function getSlotPulseBadge(slotConfig: CircadianSlotConfig): SlotPulseBadgeConfig {
  return slotConfig.pulseBadge || {
    phaseType: 'flexible',
    label: 'Flexible Window',
    dotColor: '#94A3B8',
    badgeBg: 'bg-slate-800/40',
    badgeBorder: 'border-slate-700/40',
    badgeText: 'text-slate-300'
  }
}

/**
 * Adaptively calculates circadian slot configuration shifted by actual wake time
 */
export function getAdaptiveCircadianConfig(
  slotName: string, 
  actualWakeTimeStr?: string | null, 
  idealWakeTimeStr: string = '06:30'
): CircadianSlotConfig {
  const baseConfig = getCircadianConfig(slotName)
  const actStr = actualWakeTimeStr != null ? String(actualWakeTimeStr).trim() : ''
  const idStr = idealWakeTimeStr != null ? String(idealWakeTimeStr).trim() : '06:30'
  if (!actStr || !actStr.includes(':')) {
    return baseConfig
  }

  const [actH, actM] = actStr.split(':').map(Number)
  const [idH, idM] = idStr.includes(':') ? idStr.split(':').map(Number) : [6, 30]
  if (isNaN(actH) || isNaN(idH)) return baseConfig

  const deltaMinutes = (actH * 60 + actM) - (idH * 60 + idM)
  // If delta is less than 15 minutes, keep base config
  if (Math.abs(deltaMinutes) < 15) return baseConfig

  // Evening and night slots should remain anchored to bedtime to protect sleep architecture
  const isMorningOrDaytime = [
    'waking', 'morning_routine', 'morning', 'morning_supplement_stack', 
    'first_meal', 'midday', 'midday_stack', 'afternoon', 'late_afternoon', 'pre_meal', 'post_meal'
  ].includes(baseConfig.key)

  if (!isMorningOrDaytime) {
    return baseConfig
  }

  const shiftTimeStr = (hour: number, minute: number = 0) => {
    let totalM = hour * 60 + minute + deltaMinutes
    totalM = ((totalM % 1440) + 1440) % 1440
    const h = Math.floor(totalM / 60)
    const m = totalM % 60
    const ampm = h >= 12 ? 'PM' : 'AM'
    const displayH = h % 12 === 0 ? 12 : h % 12
    return `${displayH}:${m.toString().padStart(2, '0')} ${ampm}`
  }

  const newStartStr = shiftTimeStr(baseConfig.startHour, 0)
  const newEndStr = shiftTimeStr(baseConfig.endHour, 0)
  const adaptedTimeRange = `${newStartStr} – ${newEndStr}`

  const deltaHours = Math.round(deltaMinutes / 60 * 10) / 10
  const deltaDisplay = deltaMinutes > 0 ? `+${deltaHours}h wake shift` : `${deltaHours}h wake shift`

  return {
    ...baseConfig,
    timeRange: adaptedTimeRange,
    circadianPhase: `${baseConfig.circadianPhase} • Adapted (${deltaDisplay})`,
    startHour: Math.floor((((baseConfig.startHour * 60 + deltaMinutes) % 1440) + 1440) % 1440 / 60),
    endHour: Math.floor((((baseConfig.endHour * 60 + deltaMinutes) % 1440) + 1440) % 1440 / 60),
  }
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
 * Calculates whether a given circadian time slot has passed by at least graceHours (default 1.0 hour)
 */
export function isCircadianSlotPast(
  slotName: string, 
  currentDate: Date = new Date(),
  graceHours: number = 1.0,
  actualWakeTimeStr?: string | null,
  idealWakeTimeStr: string = '06:30'
): boolean {
  if (!slotName || slotName.toLowerCase().includes('anytime')) return false

  const config = getAdaptiveCircadianConfig(slotName, actualWakeTimeStr, idealWakeTimeStr)
  if (config.key === 'anytime') return false

  const nowH = currentDate.getHours() + currentDate.getMinutes() / 60

  // For slots that do not cross midnight:
  if (config.startHour <= config.endHour) {
    const threshold = config.endHour + graceHours
    return nowH >= threshold
  } else {
    // Crosses midnight (e.g. bedtime 22:00 to 05:00).
    // On today's active schedule, bedtime is the final block of today.
    // Throughout today's daytime (before 22:00) and evening, tonight's bedtime is in the future.
    // Between 22:00 and 05:00, bedtime is currently live/ongoing.
    // Therefore, bedtime is NEVER a past block on today's view.
    return false
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
  'pre_meal',
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
    return 'linear-gradient(to bottom, #D97706 0%, #F59E0B 8%, #FBBF24 16%, #38BDF8 26%, #0284C7 38%, #2563EB 50%, #F59E0B 60%, #F87E38 68%, #DF5558 78%, #A52D6A 86%, #50236B 92%, #231A45 96%, #1B1536 98%, #0B132B 100%)'
  }
  if (slotKeys.length === 1) {
    return getCircadianConfig(slotKeys[0]).gradientCSS
  }

  const N = slotKeys.length
  const step = 100 / N
  const colorStops: { color: string; pct: number }[] = []

  const isBlueFamily = (hex: string) => ['#38bdf8', '#0ea5e9', '#0284c7', '#0369a1', '#2563eb', '#3b82f6', '#5b9bd5'].includes(hex.toLowerCase())
  const isSunsetFamily = (hex: string) => ['#f87e38', '#df5558', '#f97316', '#ea580c'].includes(hex.toLowerCase())

  slotKeys.forEach((key, i) => {
    const cfg = getCircadianConfig(key)
    const startPct = i * step
    const endPct = (i + 1) * step
    const primary = cfg.skyColorHex

    const nextKey = i < N - 1 ? slotKeys[i + 1] : null
    const nextCfg = nextKey ? getCircadianConfig(nextKey) : null

    if (i === 0) {
      colorStops.push({ color: cfg.startColorHex || primary, pct: 0 })
      colorStops.push({ color: primary, pct: Math.max(0, Number((endPct - 1.2).toFixed(1))) })
    } else if (i === N - 1) {
      colorStops.push({ color: primary, pct: Math.min(100, Number((startPct + 1.0).toFixed(1))) })
      colorStops.push({ color: cfg.endColorHex || primary, pct: 100 })
    } else {
      colorStops.push({ color: primary, pct: Math.min(100, Number((startPct + 1.0).toFixed(1))) })
      colorStops.push({ color: primary, pct: Math.max(0, Number((endPct - 1.0).toFixed(1))) })
    }

    if (nextCfg) {
      if (isBlueFamily(primary) && (isSunsetFamily(nextCfg.skyColorHex) || nextCfg.key === 'pre_meal' || nextCfg.key === 'post_meal' || nextCfg.key === 'evening')) {
        colorStops.push({ color: '#F59E0B', pct: Number(endPct.toFixed(1)) })
      } else if (cfg.key === 'evening' && (nextCfg.key === 'evening_supplement_stack' || nextCfg.key === 'wind_down')) {
        colorStops.push({ color: '#A52D6A', pct: Number(endPct.toFixed(1)) })
      } else if (cfg.key === 'wind_down' && nextCfg.key === 'pre_bed') {
        colorStops.push({ color: '#312154', pct: Number(endPct.toFixed(1)) })
      } else if (nextCfg.startColorHex && nextCfg.startColorHex !== primary) {
        colorStops.push({ color: nextCfg.startColorHex, pct: Number(endPct.toFixed(1)) })
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

/**
 * Determines whether the current local time falls in the late-night window:
 * from midnight (12:00 AM / 00:00) until 3 hours before the user's ideal wake time.
 * If true, the user is still in their biological evening session from yesterday,
 * so the app should prioritize loading yesterday's protocol tasks and evening check-in first.
 */
export function isLateNightCarryoverWindow(
  now: Date = new Date(),
  idealWakeTime?: any
): boolean {
  const curHour = now.getHours()
  const curMinute = now.getMinutes()
  const curTotalMins = curHour * 60 + curMinute

  // Default ideal wake time is 06:30 AM (390 mins)
  let wakeHour = 6
  let wakeMinute = 30
  if (idealWakeTime != null) {
    const wakeStr = String(idealWakeTime).trim()
    if (wakeStr.includes(':')) {
      const [h, m] = wakeStr.split(':').map(Number)
      if (!isNaN(h) && !isNaN(m)) {
        wakeHour = h
        wakeMinute = m
      }
    } else if (!isNaN(Number(wakeStr))) {
      wakeHour = Math.floor(Number(wakeStr))
      wakeMinute = 0
    }
  }

  const wakeTotalMins = wakeHour * 60 + wakeMinute
  const cutoffMins = wakeTotalMins - 180 // 3 hours before wake time (e.g. 06:30 -> 03:30 / 210 mins)

  // From 12:00 AM (00:00) until 3 hours before wake time
  if (cutoffMins > 0) {
    return curTotalMins < cutoffMins
  }
  return false
}

export interface DynamicCircadianWindow {
  slotKey: string
  label: string
  timeWindow: string
  startHour: number
  endHour: number
}

/**
 * Dynamically computes circadian slot time windows based on the user's actual wake time,
 * bedtime, fasting schedule (e.g. 16:8, 18:6, OMAD), and target eating window.
 */
export function getUserCircadianTimeWindows(
  profile?: UserProfile | null
): Record<string, DynamicCircadianWindow> {
  // 1. Resolve user's wake time (default 06:30)
  const wakeTimeStr = profile?.ideal_wake_time || (profile as any)?.actual_wake_time || '06:30'
  let wakeH = 6
  let wakeM = 30
  if (wakeTimeStr && String(wakeTimeStr).includes(':')) {
    const [h, m] = String(wakeTimeStr).split(':').map(Number)
    if (!isNaN(h)) wakeH = h
    if (!isNaN(m)) wakeM = m
  }
  const wakeHourDecimal = wakeH + wakeM / 60

  // 2. Resolve user's bedtime (default 22:30)
  const bedTimeStr = profile?.ideal_bedtime || '22:30'
  let bedH = 22
  let bedM = 30
  if (bedTimeStr && String(bedTimeStr).includes(':')) {
    const [h, m] = String(bedTimeStr).split(':').map(Number)
    if (!isNaN(h)) bedH = h
    if (!isNaN(m)) bedM = m
  }
  const bedHourDecimal = bedH + bedM / 60

  // 3. Resolve user's fasting schedule & nutrition targets
  const fastingSchedule = (profile?.fasting_schedule || '').toLowerCase().trim()
  const eatingStartTarget = profile?.eating_window_start || (profile as any)?.nutrition_targets?.eating_window_start_target
  const eatingEndTarget = profile?.eating_window_end || (profile as any)?.nutrition_targets?.eating_window_end_target
  const targetFastHours = (profile as any)?.nutrition_targets?.target_fasting_hours || (profile as any)?.target_fasting_hours

  const formatHourMin = (hourDecimal: number): string => {
    let totalM = Math.round(hourDecimal * 60)
    totalM = ((totalM % 1440) + 1440) % 1440
    const h24 = Math.floor(totalM / 60)
    const mins = totalM % 60
    const ampm = h24 >= 12 ? 'PM' : 'AM'
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12
    return mins === 0 ? `${h12}:00 ${ampm}` : `${h12}:${mins.toString().padStart(2, '0')} ${ampm}`
  }

  // WAKING: Starts at wake time for ~1.5h
  const wakingStart = wakeHourDecimal
  const wakingEnd = wakeHourDecimal + 1.5

  // MORNING: From end of waking to ~3.5-4h post-wake
  const morningStart = wakingEnd
  const morningEnd = wakeHourDecimal + 4.0

  // FIRST MEAL: Dynamically calculated based on fasting schedule and eating window
  let firstMealStart: number
  let firstMealEnd: number

  if (eatingStartTarget && String(eatingStartTarget).includes(':')) {
    const [esh, esm] = String(eatingStartTarget).split(':').map(Number)
    firstMealStart = (!isNaN(esh) ? esh : 12) + (!isNaN(esm) ? esm : 0) / 60
    firstMealEnd = firstMealStart + 1.5
  } else if (fastingSchedule.includes('18:6') || fastingSchedule.includes('18/6') || targetFastHours === 18) {
    // 18:6 Fast: typically breaks fast at ~1:30 PM / 2:00 PM
    firstMealStart = Math.max(wakeHourDecimal + 6.0, 13.5)
    firstMealEnd = firstMealStart + 1.5
  } else if (fastingSchedule.includes('20:4') || fastingSchedule.includes('20/4') || targetFastHours === 20) {
    // 20:4 Fast: breaks fast around 3:30 PM / 4:00 PM
    firstMealStart = Math.max(wakeHourDecimal + 8.0, 15.5)
    firstMealEnd = firstMealStart + 1.5
  } else if (fastingSchedule.includes('omad') || targetFastHours === 23) {
    // OMAD: One single meal in late afternoon / evening
    firstMealStart = 17.5
    firstMealEnd = 19.5
  } else if (fastingSchedule.includes('16:8') || fastingSchedule.includes('16/8') || targetFastHours === 16) {
    // 16:8 Fast (Standard Time-Restricted Feeding): typically 12:00 PM – 1:30 PM
    firstMealStart = Math.max(wakeHourDecimal + 4.5, 11.75)
    firstMealEnd = firstMealStart + 1.5
  } else {
    // Standard / 12:12 gentle circadian fast: break-fast ~1.5 - 2h after waking
    firstMealStart = wakeHourDecimal + 1.5
    firstMealEnd = firstMealStart + 1.5
  }

  // LUNCH / MIDDAY:
  let lunchStart: number
  let lunchEnd: number
  if (firstMealStart >= 13.0) {
    // If first meal is late (1:00 PM or later), lunch is secondary meal in mid-feeding window
    lunchStart = firstMealEnd + 1.5
    lunchEnd = lunchStart + 1.5
  } else {
    // Solar peak midday meal
    lunchStart = 11.75
    lunchEnd = 14.0
  }

  // AFTERNOON: Between midday and evening
  const afternoonStart = Math.max(lunchEnd, 14.0)
  const afternoonEnd = Math.min(afternoonStart + 3.0, 17.5)

  // LAST MEAL: Based on eating window end and bedtime buffer (finish ≥2.5–3h before sleep)
  let lastMealStart: number
  let lastMealEnd: number
  if (eatingEndTarget && String(eatingEndTarget).includes(':')) {
    const [eeh, eem] = String(eatingEndTarget).split(':').map(Number)
    lastMealEnd = (!isNaN(eeh) ? eeh : 20) + (!isNaN(eem) ? eem : 0) / 60
    lastMealStart = lastMealEnd - 1.5
  } else if (fastingSchedule.includes('16:8') || fastingSchedule.includes('18:6')) {
    // 8-hour or 6-hour feeding window from first meal
    const windowHours = fastingSchedule.includes('18:6') ? 6 : 8
    lastMealEnd = Math.min(firstMealStart + windowHours, bedHourDecimal - 2.5)
    lastMealStart = lastMealEnd - 1.5
  } else {
    // Standard: finish ~3h before ideal bedtime
    lastMealEnd = Math.max(bedHourDecimal - 2.5, 19.5)
    lastMealStart = lastMealEnd - 1.5
  }

  // BEDTIME: 1.5h leading up to bedtime
  const bedtimeStart = bedHourDecimal - 1.5
  const bedtimeEnd = bedHourDecimal + 0.5

  return {
    waking: {
      slotKey: 'waking',
      label: 'Upon Waking',
      timeWindow: `${formatHourMin(wakingStart)} – ${formatHourMin(wakingEnd)}`,
      startHour: wakingStart,
      endHour: wakingEnd
    },
    morning: {
      slotKey: 'morning',
      label: 'Morning',
      timeWindow: `${formatHourMin(morningStart)} – ${formatHourMin(morningEnd)}`,
      startHour: morningStart,
      endHour: morningEnd
    },
    breakfast: {
      slotKey: 'breakfast',
      label: 'First Meal',
      timeWindow: `${formatHourMin(firstMealStart)} – ${formatHourMin(firstMealEnd)}`,
      startHour: firstMealStart,
      endHour: firstMealEnd
    },
    lunch: {
      slotKey: 'lunch',
      label: 'Lunch / Midday Meal',
      timeWindow: `${formatHourMin(lunchStart)} – ${formatHourMin(lunchEnd)}`,
      startHour: lunchStart,
      endHour: lunchEnd
    },
    afternoon: {
      slotKey: 'afternoon',
      label: 'Afternoon',
      timeWindow: `${formatHourMin(afternoonStart)} – ${formatHourMin(afternoonEnd)}`,
      startHour: afternoonStart,
      endHour: afternoonEnd
    },
    dinner: {
      slotKey: 'dinner',
      label: 'Last Meal',
      timeWindow: `${formatHourMin(lastMealStart)} – ${formatHourMin(lastMealEnd)}`,
      startHour: lastMealStart,
      endHour: lastMealEnd
    },
    bedtime: {
      slotKey: 'bedtime',
      label: 'Bedtime',
      timeWindow: `${formatHourMin(bedtimeStart)} – ${formatHourMin(bedtimeEnd)}`,
      startHour: bedtimeStart,
      endHour: bedtimeEnd
    },
    anytime: {
      slotKey: 'anytime',
      label: 'Anytime',
      timeWindow: 'Flexible',
      startHour: 0,
      endHour: 24
    }
  }
}

