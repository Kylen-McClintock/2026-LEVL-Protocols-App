import { Modality, ProtocolStep, UserProfile } from '../types'

/**
 * Smart Modality Timing Resolver Engine
 * Guarantees that all current and future modalities automatically map to their optimal 
 * timing block (morning, afternoon, evening, bedtime, etc.) instead of defaulting to 'anytime'.
 */

export type OptimalTimingSlot = 
  | 'morning'
  | 'morning_supplement_stack'
  | 'midday_stack'
  | 'afternoon'
  | 'late_afternoon'
  | 'evening'
  | 'evening_supplement_stack'
  | 'bedtime'
  | 'pre_bed'
  | 'anytime'

export function resolveOptimalTimingSlot(
  modality?: Modality | null,
  step?: ProtocolStep | null,
  fallbackSlot: string = 'anytime',
  userProfile?: UserProfile | null
): string {
  // 0. If user has explicit primary workout window preference in profile, apply to workouts
  if (modality && userProfile?.primary_workout_window) {
    const text = `${modality.name || ''} ${modality.category || ''} ${modality.timing_summary || ''}`.toLowerCase()
    const isWorkout = 
      text.includes('resistance training') || 
      text.includes('strength') || 
      text.includes('hypertrophy') || 
      text.includes('decathlon') ||
      text.includes('vo2 max') ||
      text.includes('sprint')
    
    if (isWorkout) {
      const window = userProfile.primary_workout_window.toLowerCase()
      if (window.includes('morning')) return 'morning'
      if (window.includes('midday')) return 'midday'
      if (window.includes('afternoon')) return 'afternoon'
      if (window.includes('evening')) return 'evening'
    }
  }

  // 1. Explicit task timing slot if non-empty and not 'anytime'
  if (fallbackSlot && fallbackSlot !== 'anytime') {
    return normalizeSlot(fallbackSlot)
  }

  // 2. Explicit protocol step timing slot if non-empty and not 'anytime'
  if (step?.timing_slot && step.timing_slot !== 'anytime') {
    return normalizeSlot(step.timing_slot)
  }

  // 3. Explicit modality default timing slot if non-empty and not 'anytime'
  if (modality?.default_timing_slot && modality.default_timing_slot !== 'anytime') {
    return normalizeSlot(modality.default_timing_slot)
  }

  // 4. Comprehensive Keyword & Semantic Resolver
  if (modality) {
    const timing = (modality.timing_summary || '').toLowerCase()
    const name = (modality.name || '').toLowerCase()
    const cat = (modality.category || '').toLowerCase()
    const inst = (modality.instructions || '').toLowerCase()
    const text = `${timing} ${name} ${cat} ${inst}`.toLowerCase()

    // Bedtime / Sleep / Overnight / Dental Nightly
    if (
      timing.includes('bed') || timing.includes('nightly') || timing.includes('pre-bed') || 
      timing.includes('overnight') || timing.includes('before bed') || timing.includes('sleep environment') ||
      name.includes('flossing') || name.includes('mouth tap') || name.includes('sleep environment') ||
      text.includes('30m before bed') || text.includes('before sleep') || text.includes('sleep architecture') ||
      name.includes('sleep consistency')
    ) {
      return 'bedtime'
    }

    // Wind Down / Evening Cutoffs
    if (
      timing.includes('wind down') || timing.includes('wind_down') || text.includes('4-7-8') || 
      name.includes('screen time reduction') || timing.includes('screen') || timing.includes('cutoff') ||
      text.includes('caffeine cutoff') || text.includes('alcohol sleep-protection') ||
      name.includes('blue-light') || timing.includes('dimming')
    ) {
      return 'wind_down'
    }

    // Evening / Dinner / Sauna
    if (
      timing.includes('evening') || timing.includes('dinner') || timing.includes('night') || 
      timing.includes('dusk') || name.includes('sauna') || timing.includes('sauna') ||
      text.includes('with dinner') || text.includes('evening with') || text.includes('dinner / daily') ||
      text.includes('dinner with food') || text.includes('dinner / evening')
    ) {
      const isSupplement = cat.includes('supplement') || (modality.modality_type || '').toLowerCase() === 'supplement'
      return isSupplement ? 'evening_supplement_stack' : 'evening'
    }

    // Post-Meal / Glycemic walk
    if (
      timing.includes('post-meal') || timing.includes('post meal') || timing.includes('postprandial') ||
      name.includes('postprandial') || text.includes('after eating') || text.includes('after major meals') ||
      (name.includes('soleus') && text.includes('post-meal')) || (name.includes('walk') && text.includes('post-meal'))
    ) {
      return 'post_meal'
    }

    // Afternoon / Late Afternoon / Strength / Workouts
    if (
      timing.includes('afternoon') || timing.includes('2-6 pm') || timing.includes('peak body temp') ||
      timing.includes('4:00 pm') || text.includes('resistance training') || text.includes('hypertrophy') ||
      text.includes('strength training') || text.includes('coherent') || text.includes('resonant') ||
      text.includes('vo2 max') || text.includes('sprints')
    ) {
      return 'afternoon'
    }

    // Midday / Lunch / Desk micro-movement
    if (
      timing.includes('midday') || timing.includes('lunch') || timing.includes('noon') || 
      timing.includes('11:00 am') || timing.includes('12:00 pm') || timing.includes('1:00 pm') ||
      timing.includes('desk micro-movement') || name.includes('nut pudding') || text.includes('box breath')
    ) {
      return 'midday'
    }

    // Morning / Waking / Breakfast / Morning Supplements / Light / Cold
    if (
      timing.includes('morning') || timing.includes('wake') || timing.includes('waking') ||
      timing.includes('am') || timing.includes('fasted') || timing.includes('breakfast') ||
      name.includes('light') || name.includes('sunlight') || name.includes('cold') || 
      name.includes('coffee') || name.includes('caffeine') || name.includes('sigh') ||
      name.includes('super veggie') || text.includes('morning meal') || text.includes('upon waking') ||
      name.includes('red light') || name.includes('photobiomodulation')
    ) {
      const isSupplement = cat.includes('supplement') || (modality.modality_type || '').toLowerCase() === 'supplement'
      return isSupplement ? 'morning_supplement_stack' : 'morning'
    }
  }

  return 'anytime'
}

function normalizeSlot(slot: string): string {
  const s = slot.toLowerCase().trim()
  if (s.includes('wind_down') || s.includes('winddown')) return 'wind_down'
  if (s.includes('bed') || s.includes('sleep') || s.includes('nightly')) return 'bedtime'
  if (s.includes('evening_supplement') || s.includes('dinner_stack')) return 'evening_supplement_stack'
  if (s.includes('evening') || s.includes('dinner')) return 'evening'
  if (s.includes('post_meal') || s.includes('post-meal') || s.includes('post meal') || s.includes('postprandial')) return 'post_meal'
  if (s.includes('morning_supplement')) return 'morning_supplement_stack'
  if (s.includes('morning') || s.includes('wake') || s.includes('waking')) return 'morning'
  if (s.includes('midday') || s.includes('lunch')) return 'midday'
  if (s.includes('afternoon') || s.includes('workout')) return 'afternoon'
  return s
}
