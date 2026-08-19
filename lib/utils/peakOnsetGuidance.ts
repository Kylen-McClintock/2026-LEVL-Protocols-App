import { Modality } from '@/lib/types'

export interface PeakOnsetGuidance {
  bestTimeToLog: string // Short, punchy time (e.g. "30–60 mins after")
  subtitle: string      // Everyday clear explanation
  badgeText: string     // Compact badge (e.g. "Best logged: ~45m post")
}

/**
 * Returns clean, simple, human-friendly peak onset and optimal recording time guidance for any modality.
 */
export function getPeakOnsetGuidance(modality?: Modality | null): PeakOnsetGuidance {
  if (!modality) {
    return {
      bestTimeToLog: '30–60 mins after',
      subtitle: 'Record your ratings when the physiological effects are most noticeable.',
      badgeText: 'Best logged: ~30-60m post'
    }
  }

  const id = (modality.id || '').toLowerCase()
  const name = (modality.name || '').toLowerCase()
  const category = (modality.category || '').toLowerCase()

  // 1. Cold Exposure & Cryotherapy
  if (id.includes('cold') || name.includes('cold') || id.includes('plunge') || id.includes('cryo') || name.includes('ice bath')) {
    return {
      bestTimeToLog: '30–60 mins after',
      subtitle: 'Dopamine, mood, and alertness reach their peak 30 to 60 minutes after you finish warming back up.',
      badgeText: 'Best logged: 30–60m post'
    }
  }

  // 2. Sauna & Hyperthermic Exposure
  if (id.includes('sauna') || name.includes('sauna') || id.includes('heat') || name.includes('hot bath')) {
    return {
      bestTimeToLog: '45–90 mins after',
      subtitle: 'Growth hormone release and deep physical relaxation set in as your body cools back down over the next hour.',
      badgeText: 'Best logged: 45–90m post'
    }
  }

  // 3. Breathwork & Mindfulness
  if (category.includes('breath') || id.includes('breath') || id.includes('sigh') || id.includes('meditation') || name.includes('breathwork')) {
    return {
      bestTimeToLog: 'Right after to 15 mins post',
      subtitle: 'Your nervous system shifts into calm, relaxed flow immediately after completing your breath cycles.',
      badgeText: 'Best logged: 0–15m post'
    }
  }

  // 4. Morning Light & Circadian Anchors
  if (id.includes('sunlight') || name.includes('sunlight') || id.includes('light') || name.includes('optic flow')) {
    return {
      bestTimeToLog: '30–45 mins after waking',
      subtitle: 'Natural sunlight triggers your morning cortisol peak and sets your internal energy clock for the day.',
      badgeText: 'Best logged: ~30m post'
    }
  }

  // 5. Evening Sleep Supplements & Wind-Down
  if (
    id.includes('magnesium') || id.includes('glycine') || id.includes('apigenin') || 
    id.includes('melatonin') || id.includes('theanine') || name.includes('sleep') || 
    modality.cadence_layer === 'daily' && (name.includes('bed') || name.includes('night'))
  ) {
    return {
      bestTimeToLog: 'Next morning upon waking',
      subtitle: 'Best recorded tomorrow morning to accurately measure deep sleep quality and how rested you feel.',
      badgeText: 'Best logged: Next morning'
    }
  }

  // 6. Resistance Training & Workouts
  if (
    category.includes('training') || category.includes('exercise') || 
    id.includes('push') || id.includes('pull') || id.includes('leg') || 
    id.includes('workout') || name.includes('hypertrophy') || name.includes('strength')
  ) {
    return {
      bestTimeToLog: '1–2 hours post-workout (or next morning)',
      subtitle: 'Energy and mood peak within 1 hour; muscle soreness and recovery are best rated the following morning.',
      badgeText: 'Best logged: 1–2h post'
    }
  }

  // 7. Cardio & HIIT
  if (category.includes('cardio') || id.includes('zone2') || id.includes('hiit') || id.includes('vo2')) {
    return {
      bestTimeToLog: '30–60 mins after session',
      subtitle: 'Endorphin release and cardiovascular recovery are most pronounced 30 to 60 minutes after cooling down.',
      badgeText: 'Best logged: 30–60m post'
    }
  }

  // 8. Post-Meal Walks & Nutrition
  if (id.includes('walk') || id.includes('glucose') || id.includes('olive') || id.includes('fasting')) {
    return {
      bestTimeToLog: '30–60 mins after',
      subtitle: 'Blood sugar and digestion stabilize within 30 to 60 minutes of finishing light movement or nutrition.',
      badgeText: 'Best logged: 30–60m post'
    }
  }

  // 9. Peptides & Biologics
  if (category.includes('peptide') || id.includes('bpc') || id.includes('cjc') || id.includes('ipamorelin') || id.includes('semaglutide')) {
    return {
      bestTimeToLog: '1–3 hours after administration',
      subtitle: 'Peptide blood concentration and cellular signaling peak 1 to 3 hours after injection.',
      badgeText: 'Best logged: 1–3h post'
    }
  }

  // 10. Daily Supplements & Nootropics (Creatine, Omega-3, Ashwagandha, NMN, etc.)
  if (category.includes('supplement') || category.includes('nootropic') || id.includes('creatine') || id.includes('omega') || id.includes('ashwagandha')) {
    return {
      bestTimeToLog: '60–90 mins after taking',
      subtitle: 'Allows 1 to 2 hours for full digestion, blood absorption, and cognitive/cellular uptake.',
      badgeText: 'Best logged: ~1h post'
    }
  }

  // 11. Inspect biological_vectors if present
  if (modality.biological_vectors && modality.biological_vectors.length > 0) {
    const primaryVector = modality.biological_vectors[0]
    if (primaryVector.peak_delay_hours > 0) {
      const mins = Math.round(primaryVector.peak_delay_hours * 60)
      if (mins <= 20) {
        return {
          bestTimeToLog: 'Right after to 15 mins post',
          subtitle: `Acute physiological impact peaks within ~${mins} minutes of completion.`,
          badgeText: `Best logged: ~${mins}m post`
        }
      }
      if (mins < 90) {
        return {
          bestTimeToLog: `${mins} mins after`,
          subtitle: `Peak biological absorption and effects occur ~${mins} minutes after completion.`,
          badgeText: `Best logged: ~${mins}m post`
        }
      }
      const hours = Math.round(primaryVector.peak_delay_hours)
      return {
        bestTimeToLog: `~${hours} hours after`,
        subtitle: `Optimal biological response reaches full peak around ${hours} hours post-session.`,
        badgeText: `Best logged: ~${hours}h post`
      }
    }
  }

  // Generic fallback
  return {
    bestTimeToLog: '30–60 mins after',
    subtitle: 'Record your ratings when the physical and mental effects are most noticeable.',
    badgeText: 'Best logged: ~30-60m post'
  }
}
