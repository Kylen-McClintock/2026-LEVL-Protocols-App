import { Modality, UserProfile } from '@/lib/types'

export interface FrictionShiftOption {
  id: string
  title: string
  subtitle: string
  recommendedTiming?: string
  recommendedFrequency?: string
  rationale: string
  frictionReductionScore: number // percentage e.g. 60% less friction
}

export interface FrictionDiagnosis {
  modalityId: string
  modalityName: string
  currentAdherence: number
  primaryBottleneck: string
  options: FrictionShiftOption[]
}

export function diagnoseFriction(
  modality: Modality,
  adherencePercent: number,
  userProfile?: UserProfile | null
): FrictionDiagnosis {
  const modId = (modality.id || '').toLowerCase()
  const modName = (modality.name || modality.display_name || '').toLowerCase()
  const category = (modality.category || '').toLowerCase()

  const options: FrictionShiftOption[] = []
  let primaryBottleneck = 'Schedule conflict or high morning activation energy'

  if (modId.includes('cold') || modId.includes('plunge') || modId.includes('ice')) {
    primaryBottleneck = 'Morning thermal shock resistance & setup friction'
    options.push({
      id: 'shift_weekend',
      title: 'Weekend Anchor Protocol (2x/Week)',
      subtitle: 'Schedule on Saturday & Sunday mornings',
      recommendedFrequency: '2x per week (Sat, Sun)',
      recommendedTiming: '10:00 AM - 11:30 AM',
      rationale: 'Thermal hormesis benefits (11 mins weekly total) are fully preserved when concentrated into 2 relaxed weekend sessions without weekday time pressure.',
      frictionReductionScore: 75
    })
    options.push({
      id: 'shift_post_workout',
      title: 'Afternoon / Non-Lifting Day Shift',
      subtitle: 'Move to 4:30 PM on Cardio/Rest Days',
      recommendedTiming: '4:30 PM - 5:30 PM',
      rationale: 'Avoids morning grogginess and strictly enforces the anti-blunting rule by placing cold exposure well away from morning resistance training.',
      frictionReductionScore: 60
    })
    options.push({
      id: 'micro_exposure',
      title: 'Micro-Dosing (60-90s Express Plunge)',
      subtitle: 'Reduce immersion time to 60s',
      rationale: 'Lowers the mental activation barrier while still delivering 80% of the noradrenaline and dopamine surge.',
      frictionReductionScore: 50
    })
  } else if (modId.includes('sauna') || modId.includes('heat')) {
    primaryBottleneck = 'Time constraints & pre-heating duration during workdays'
    options.push({
      id: 'shift_evening',
      title: 'Evening Wind-Down Session',
      subtitle: 'Move to 8:00 PM (1-2h before bed)',
      recommendedTiming: '8:00 PM - 9:00 PM',
      recommendedFrequency: '3x per week',
      rationale: 'Post-sauna core temperature drop triggers natural melatonin synthesis, dramatically improving deep sleep architecture.',
      frictionReductionScore: 70
    })
    options.push({
      id: 'shift_weekend_batch',
      title: 'Weekend Recovery Ritual',
      subtitle: 'Batch sessions on Friday & Sunday',
      recommendedFrequency: '2x per week',
      rationale: 'Allows unhurried 20-30m sessions to meet the 57-minute weekly longevity threshold.',
      frictionReductionScore: 65
    })
  } else if (category.includes('supplement') || modId.includes('pill') || modId.includes('powder')) {
    primaryBottleneck = 'Timing friction or taking on empty stomach vs with meals'
    options.push({
      id: 'bundle_meal',
      title: 'Anchor to Main Meal (First Bite)',
      subtitle: 'Co-ingest with breakfast or lunch',
      recommendedTiming: 'With Lunch (12:30 PM)',
      rationale: 'Anchoring supplements to an established habit (mealtime) increases adherence to over 90% via habit pairing (Clear, 2018).',
      frictionReductionScore: 80
    })
    options.push({
      id: 'bedside_anchor',
      title: 'Bedside Nightstand Anchor',
      subtitle: 'Take 30m before sleep with water',
      recommendedTiming: '9:30 PM (Bedside)',
      rationale: 'Eliminates kitchen trips before bed by placing near nightstand.',
      frictionReductionScore: 70
    })
  } else if (modId.includes('breath') || modId.includes('meditat') || modId.includes('mind')) {
    primaryBottleneck = 'Dedicated seated time availability during busy mornings'
    options.push({
      id: 'shift_midday_reset',
      title: 'Midday Cognitive Reset (1:30 PM)',
      subtitle: 'Shift to post-lunch energy dip',
      recommendedTiming: '1:30 PM',
      rationale: 'Clears afternoon brain fog and down-regulates sympathetic overdrive at your peak stress window.',
      frictionReductionScore: 65
    })
    options.push({
      id: 'shift_pre_bed',
      title: 'Pre-Sleep Wind-Down (10:00 PM)',
      subtitle: 'Do directly in bed before lights out',
      recommendedTiming: '10:00 PM',
      rationale: 'Activates parasympathetic vagal tone to reduce sleep onset latency to under 15 minutes.',
      frictionReductionScore: 75
    })
  } else {
    // General fallback for workouts, light therapy, habits
    options.push({
      id: 'reduce_frequency',
      title: 'Reduce Frequency to 3x / Week',
      subtitle: 'Schedule on Mon, Wed, Fri only',
      recommendedFrequency: '3x per week (Mon, Wed, Fri)',
      rationale: 'Establishing a 100% consistent 3x/week baseline provides higher biological ROI than an inconsistent daily target.',
      frictionReductionScore: 70
    })
    options.push({
      id: 'shift_evening',
      title: 'Shift from Morning to Evening Window',
      subtitle: 'Move to 6:00 PM after workday',
      recommendedTiming: '6:00 PM - 7:00 PM',
      rationale: 'Avoids morning rush and leverages peak afternoon body temperature and motor coordination.',
      frictionReductionScore: 60
    })
  }

  return {
    modalityId: modality.id,
    modalityName: modality.display_name || modality.name,
    currentAdherence: Math.round(adherencePercent),
    primaryBottleneck,
    options
  }
}
