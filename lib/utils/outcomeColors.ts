/**
 * Standardized Directionality-Aware Outcome Color Utility
 * Standardizes 0-10 ratings so GREEN is always GOOD/BEST and RED is always BAD/SEVERE.
 */

export function getOutcomeColorConfig(val: number, directionality?: string) {
  const isLowerBetter = directionality === 'lower_is_better'

  // Normalize effective "goodness" score (0 = worst, 10 = best)
  const goodness = isLowerBetter ? (10 - val) : val
  const rounded = Math.round(goodness * 10) / 10

  if (rounded >= 9.5) {
    return {
      textColor: 'text-emerald-400',
      bgColor: 'bg-emerald-500',
      borderColor: 'border-emerald-400/40',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
      accentHex: '#10B981',
      qualityLabel: isLowerBetter ? 'Optimal (Zero)' : 'Peak (Optimal)'
    }
  } else if (rounded >= 8.5) {
    return {
      textColor: 'text-emerald-300',
      bgColor: 'bg-emerald-400',
      borderColor: 'border-emerald-300/40',
      badgeBg: 'bg-emerald-400/20 text-emerald-200 border-emerald-300/40',
      accentHex: '#34D399',
      qualityLabel: isLowerBetter ? 'Exceptional' : 'Exceptional'
    }
  } else if (rounded >= 7.5) {
    return {
      textColor: 'text-teal-400',
      bgColor: 'bg-teal-500',
      borderColor: 'border-teal-400/40',
      badgeBg: 'bg-teal-500/20 text-teal-300 border-teal-400/40',
      accentHex: '#14B8A6',
      qualityLabel: isLowerBetter ? 'Great (Minimal)' : 'Great'
    }
  } else if (rounded >= 6.5) {
    return {
      textColor: 'text-cyan-400',
      bgColor: 'bg-cyan-500',
      borderColor: 'border-cyan-400/40',
      badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
      accentHex: '#06B6D4',
      qualityLabel: isLowerBetter ? 'Good (Low)' : 'Good (Above Avg)'
    }
  } else if (rounded >= 5.5) {
    return {
      textColor: 'text-sky-400',
      bgColor: 'bg-sky-500',
      borderColor: 'border-sky-400/40',
      badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-400/40',
      accentHex: '#38BDF8',
      qualityLabel: 'Fair (Mod-High)'
    }
  } else if (rounded >= 4.5) {
    // Rating 5: Ultra light neutral crisp sky blue
    return {
      textColor: 'text-sky-200',
      bgColor: 'bg-sky-300',
      borderColor: 'border-sky-200/50',
      badgeBg: 'bg-sky-300/20 text-sky-100 border-sky-300/40',
      accentHex: '#7DD3FC',
      qualityLabel: 'Moderate'
    }
  } else if (rounded >= 3.5) {
    return {
      textColor: 'text-yellow-300',
      bgColor: 'bg-yellow-400',
      borderColor: 'border-yellow-400/40',
      badgeBg: 'bg-yellow-400/20 text-yellow-200 border-yellow-400/40',
      accentHex: '#FACC15',
      qualityLabel: 'Fair (Low)'
    }
  } else if (rounded >= 2.5) {
    return {
      textColor: 'text-amber-400',
      bgColor: 'bg-amber-500',
      borderColor: 'border-amber-400/40',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
      accentHex: '#F59E0B',
      qualityLabel: isLowerBetter ? 'Elevated' : 'Sub-Optimal'
    }
  } else if (rounded >= 1.5) {
    return {
      textColor: 'text-orange-400',
      bgColor: 'bg-orange-500',
      borderColor: 'border-orange-400/40',
      badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-400/40',
      accentHex: '#FB923C',
      qualityLabel: isLowerBetter ? 'High' : 'Sub-Optimal (Low)'
    }
  } else if (rounded >= 0.5) {
    return {
      textColor: 'text-red-400',
      bgColor: 'bg-red-500',
      borderColor: 'border-red-400/40',
      badgeBg: 'bg-red-500/20 text-red-300 border-red-400/40',
      accentHex: '#EF4444',
      qualityLabel: isLowerBetter ? 'Severe (High)' : 'Poor (Low)'
    }
  } else {
    return {
      textColor: 'text-rose-400',
      bgColor: 'bg-rose-600',
      borderColor: 'border-rose-500/40',
      badgeBg: 'bg-rose-600/20 text-rose-300 border-rose-500/40',
      accentHex: '#E11D48',
      qualityLabel: isLowerBetter ? 'Extreme (Worst)' : 'Poor (Zero)'
    }
  }
}

export function getNeutralOutcomeColorConfig() {
  return {
    textColor: 'text-gray-400',
    bgColor: 'bg-gray-500',
    borderColor: 'border-gray-500/40',
    badgeBg: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    accentHex: '#6B7280',
    qualityLabel: 'Unset (5/10)'
  }
}

export { getOutcomeColor, type OutcomeColorTheme } from '@/lib/outcomes/outcomeColors'
