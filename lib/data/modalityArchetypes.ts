import { Modality } from '@/lib/types'

export type ModalityArchetype = 
  | 'strength'
  | 'cardio'
  | 'thermal'
  | 'breathwork'
  | 'fasting'
  | 'nutrition_macro'
  | 'red_light'
  | 'cgm'
  | 'sunlight'
  | 'sleep'
  | 'hydration'
  | 'phlebotomy'
  | 'peptide'
  | 'supplement'
  | 'sport'
  | 'general'

export interface SpecializedTraits {
  hasBfrPressure?: boolean
  hasGripForce?: boolean
  hasRuckWeight?: boolean
  hasInclinePct?: boolean
  hasPaceSplit?: boolean
  hasCadenceRpm?: boolean
  hasSobergWarmup?: boolean
  hasSubmersionDepth?: boolean
  hasHumidity?: boolean
  hasDistancePbm?: boolean
}

export interface ModalityArchetypeProfile {
  archetype: ModalityArchetype
  isSpecialized: boolean
  lockedExerciseName?: string
  lockedCardioType?: string
  specializedTraits: SpecializedTraits
  suggestedDefaults?: Record<string, any>
}

/**
 * Resolves a modality to its core archetype and extracts any specialized locked parameters
 */
export function getModalityArchetype(modality: Modality | any): ModalityArchetypeProfile {
  if (!modality) {
    return {
      archetype: 'general',
      isSpecialized: false,
      specializedTraits: {}
    }
  }

  const name = (modality.display_name || modality.name || '').toLowerCase()
  const cat = (modality.category || '').toLowerCase()
  const logType = (modality.logging_type || '').toLowerCase()
  const modType = (modality.modality_type || '').toLowerCase()

  const specializedTraits: SpecializedTraits = {}

  // 1. PEPTIDES (Strict Priority - Excludes Oral Collagen Peptides Powder)
  const isOralCollagen = name.includes('collagen')
  if (
    !isOralCollagen && (
      logType === 'peptide' || 
      modType.includes('peptide') || 
      cat.includes('peptide') || 
      name.includes('bpc') || 
      name.includes('tb-500') || 
      name.includes('tb500') || 
      name.includes('cjc') || 
      name.includes('ipamorelin') || 
      name.includes('semaglutide') || 
      name.includes('tirzepatide') || 
      name.includes('retatrutide') || 
      name.includes('nad+') || 
      name.includes('glutathione') || 
      name.includes('epithalon') || 
      name.includes('mots-c') || 
      name.includes('ss-31') || 
      name.includes('ghk-cu') ||
      !!modality.peptide_metadata?.is_peptide
    )
  ) {
    return {
      archetype: 'peptide',
      isSpecialized: true,
      specializedTraits
    }
  }

  // 2. THERMAL (Sauna & Cold)
  if (
    logType === 'thermal' || 
    cat.includes('thermal') || 
    cat.includes('cold') || 
    cat.includes('heat') || 
    name.includes('sauna') || 
    name.includes('cold plunge') || 
    name.includes('ice bath') || 
    name.includes('cold shower') || 
    name.includes('cryotherapy') || 
    name.includes('heat exposure')
  ) {
    const isCold = name.includes('cold') || name.includes('ice') || name.includes('cryo')
    const isSauna = name.includes('sauna') || name.includes('heat')
    
    if (isCold) {
      specializedTraits.hasSobergWarmup = true
      specializedTraits.hasSubmersionDepth = true
    }
    if (isSauna) {
      specializedTraits.hasHumidity = true
    }

    return {
      archetype: 'thermal',
      isSpecialized: isCold || isSauna,
      specializedTraits
    }
  }

  // 3. BREATHWORK & MINDFULNESS
  if (
    logType === 'breathwork' || 
    logType === 'mindfulness' || 
    cat.includes('breath') || 
    cat.includes('mindful') || 
    cat.includes('meditat') || 
    name.includes('breath') || 
    name.includes('meditat') || 
    name.includes('physiological sigh') || 
    name.includes('box breath') || 
    name.includes('wim hof') || 
    name.includes('pranayama') || 
    name.includes('nsdr') || 
    name.includes('yoga nidra')
  ) {
    return {
      archetype: 'breathwork',
      isSpecialized: true,
      specializedTraits
    }
  }

  // 4. FASTING & MEAL TIMING
  if (
    logType === 'fasting' || 
    modType.includes('fast') || 
    cat.includes('fast') || 
    name.includes('fasting') || 
    name.includes('omad') || 
    name.includes('time-restricted') || 
    name.includes('trf') || 
    name.includes('16:8') || 
    name.includes('18:6') || 
    name.includes('intermittent fast')
  ) {
    return {
      archetype: 'fasting',
      isSpecialized: true,
      specializedTraits
    }
  }

  // 5. NUTRITION MACROS & PROTEIN TIMING (Excludes Oral Collagen Supplement Powder)
  if (
    logType === 'nutrition_protein' || 
    (logType === 'nutrition' && !isOralCollagen) || 
    (cat.includes('nutrition') && !isOralCollagen) || 
    name.includes('protein distribution') || 
    name.includes('leucine threshold') || 
    name.includes('protein synthesis') || 
    name.includes('macro timing') || 
    name.includes('pre-workout fuel') || 
    name.includes('post-workout protein')
  ) {
    return {
      archetype: 'nutrition_macro',
      isSpecialized: true,
      specializedTraits
    }
  }

  // 6. RED LIGHT & PHOTOBIOMODULATION
  if (
    logType === 'red_light' || 
    cat.includes('light') || 
    name.includes('red light') || 
    name.includes('photobiomodulation') || 
    name.includes('near-infrared') || 
    name.includes('pbm panel')
  ) {
    specializedTraits.hasDistancePbm = true
    return {
      archetype: 'red_light',
      isSpecialized: true,
      specializedTraits
    }
  }

  // 7. CGM & GLUCOSE MANAGEMENT
  if (
    logType === 'cgm' || 
    name.includes('cgm') || 
    name.includes('glucose') || 
    name.includes('post-meal walk') || 
    name.includes('postprandial') || 
    name.includes('soleus pushup') || 
    name.includes('glycemic')
  ) {
    return {
      archetype: 'cgm',
      isSpecialized: true,
      specializedTraits
    }
  }

  // 8. SUNLIGHT & CIRCADIAN
  if (
    logType === 'sunlight' || 
    cat.includes('circadian') || 
    name.includes('sunlight') || 
    name.includes('solar noon') || 
    name.includes('optic flow') || 
    name.includes('morning sun')
  ) {
    return {
      archetype: 'sunlight',
      isSpecialized: true,
      specializedTraits
    }
  }

  // 9. SLEEP HYGIENE
  if (
    logType === 'sleep' || 
    cat.includes('sleep') || 
    name.includes('sleep') || 
    name.includes('mouth tape') || 
    name.includes('dark & cool') || 
    name.includes('blue blocker') || 
    name.includes('circadian wind-down')
  ) {
    return {
      archetype: 'sleep',
      isSpecialized: true,
      specializedTraits
    }
  }

  // 10. HYDRATION & ELECTROLYTES
  if (
    logType === 'hydration' || 
    cat.includes('hydration') || 
    name.includes('hydration') || 
    name.includes('electrolyte') || 
    name.includes('water intake') || 
    name.includes('sodium') || 
    name.includes('lmnt')
  ) {
    return {
      archetype: 'hydration',
      isSpecialized: true,
      specializedTraits
    }
  }

  // 11. PHLEBOTOMY & BLOOD WORK
  if (
    logType === 'phlebotomy' || 
    cat.includes('phlebotomy') || 
    name.includes('phlebotomy') || 
    name.includes('blood donation') || 
    name.includes('ferritin dump')
  ) {
    return {
      archetype: 'phlebotomy',
      isSpecialized: true,
      specializedTraits
    }
  }

  // 12. CARDIO & AEROBIC ENDURANCE (Comprehensive Identification)
  const isCardioMatch = (
    logType === 'cardio' || 
    cat.includes('cardio') || 
    cat.includes('aerobic') || 
    cat.includes('cardiovascular') || 
    name.includes('cardio') || 
    name.includes('zone 2') || 
    name.includes('zone 5') || 
    name.includes('vo2') || 
    name.includes('run') || 
    name.includes('jog') || 
    name.includes('cycle') || 
    name.includes('cycling') || 
    name.includes('bike') || 
    name.includes('rowing') || 
    name.includes('rower') || 
    name.includes('ruck') || 
    name.includes('incline') || 
    name.includes('stairmaster') || 
    name.includes('stairs') || 
    name.includes('elliptical') || 
    name.includes('hiit') || 
    name.includes('sprint') || 
    name.includes('vilpa') || 
    name.includes('aerobic base') || 
    name.includes('swimming') || 
    name.includes('jump rope')
  ) && !name.includes('breath') && !name.includes('soleus')

  if (isCardioMatch) {
    let lockedCardioType: string | undefined = undefined

    if (name.includes('incline')) {
      lockedCardioType = 'Incline Treadmill Walk'
      specializedTraits.hasInclinePct = true
    } else if (name.includes('ruck')) {
      lockedCardioType = 'Rucking'
      specializedTraits.hasRuckWeight = true
    } else if (name.includes('row')) {
      lockedCardioType = 'Rowing Ergometer'
      specializedTraits.hasPaceSplit = true
    } else if (name.includes('bike') || name.includes('cycle')) {
      lockedCardioType = 'Stationary / Outdoor Bike'
      specializedTraits.hasCadenceRpm = true
    } else if (name.includes('zone 2') || name.includes('aerobic base')) {
      lockedCardioType = 'Zone 2 Endurance (Aerobic Base)'
    } else if (name.includes('zone 5') || name.includes('vo2') || name.includes('4x4')) {
      lockedCardioType = 'VO2 Max / Zone 5 Interval'
    } else if (name.includes('sprint') || name.includes('hiit') || name.includes('vilpa')) {
      lockedCardioType = 'Sprint Interval Training (SIT)'
    } else if (name.includes('run') || name.includes('jog')) {
      lockedCardioType = 'Trail Run / Jog'
    }

    return {
      archetype: 'cardio',
      isSpecialized: !!lockedCardioType,
      lockedCardioType,
      specializedTraits
    }
  }

  // 13. RESISTANCE & STRENGTH TRAINING (Comprehensive Identification)
  const isStrengthMatch = (
    logType === 'strength' || 
    cat.includes('strength') || 
    cat.includes('resistance') || 
    cat.includes('lift') || 
    cat.includes('hypertrophy') || 
    cat.includes('bodybuilding') || 
    cat.includes('calisthenics') || 
    cat.includes('exercise') ||
    cat.includes('fitness') ||
    cat.includes('movement') ||
    name.includes('strength') || 
    name.includes('resistance') || 
    name.includes('weight') || 
    name.includes('lift') || 
    name.includes('workout') ||
    name.includes('exercise') ||
    name.includes('squat') || 
    name.includes('deadlift') || 
    name.includes('bench press') || 
    name.includes('overhead press') || 
    name.includes('press') || 
    name.includes('pull-up') || 
    name.includes('pullup') || 
    name.includes('chin-up') || 
    name.includes('row') || 
    name.includes('curl') || 
    name.includes('pushup') || 
    name.includes('push-up') || 
    name.includes('dip') || 
    name.includes('raise') || 
    name.includes('bfr') || 
    name.includes('handgrip') || 
    name.includes('grip') || 
    name.includes('tibialis') || 
    name.includes('nordic') || 
    name.includes('kettlebell') || 
    name.includes('hypertrophy') || 
    name.includes('eccentric') || 
    name.includes('isometrics')
  )

  if (isStrengthMatch) {
    let lockedExerciseName: string | undefined = undefined

    if (name.includes('bfr') || name.includes('blood flow restriction')) {
      lockedExerciseName = 'BFR Occlusion Training'
      specializedTraits.hasBfrPressure = true
    } else if (name.includes('handgrip') || name.includes('grip dynamometer')) {
      lockedExerciseName = 'Handgrip Dynamometer'
      specializedTraits.hasGripForce = true
    } else if (name.includes('squat')) {
      lockedExerciseName = 'Barbell Back Squat'
    } else if (name.includes('deadlift')) {
      lockedExerciseName = 'Deadlift'
    } else if (name.includes('bench press')) {
      lockedExerciseName = 'Bench Press'
    } else if (name.includes('overhead press') || name.includes('shoulder press')) {
      lockedExerciseName = 'Overhead Press'
    } else if (name.includes('pull-up') || name.includes('pullup') || name.includes('chin-up')) {
      lockedExerciseName = 'Pull-ups'
    } else if (name.includes('push-up') || name.includes('pushup')) {
      lockedExerciseName = 'Push-ups'
    } else if (name.includes('dip')) {
      lockedExerciseName = 'Dips'
    } else if (name.includes('tibialis')) {
      lockedExerciseName = 'Tibialis Raises'
    } else if (name.includes('nordic')) {
      lockedExerciseName = 'Nordic Curls'
    } else if (name.includes('kettlebell swing')) {
      lockedExerciseName = 'Kettlebell Swings'
    }

    return {
      archetype: 'strength',
      isSpecialized: !!lockedExerciseName,
      lockedExerciseName,
      specializedTraits
    }
  }

  // 14. SUPPLEMENTS & NUTRACEUTICALS
  const isSupplementMatch = (
    logType === 'supplement' || 
    modType === 'supplement' || 
    cat.includes('supplement') || 
    cat.includes('nutraceutical') || 
    cat.includes('nootropic') || 
    name.includes('nmn') || name.includes('fisetin') || name.includes('quercetin') || name.includes('creatine') || 
    name.includes('glycine') || name.includes('ashwagandha') || name.includes('resveratrol') || name.includes('theanine') || 
    name.includes('alpha-gpc') || name.includes('taurine') || name.includes('magnesium') || name.includes('spermidine') || 
    name.includes('gaba') || name.includes('berberine') || name.includes('apigenin') || name.includes('sulforaphane') || 
    name.includes('tudca') || name.includes('acarbose') || name.includes('metformin') || name.includes('rapamycin') || 
    name.includes('omega') || name.includes('coq10') || name.includes('vitamin') || name.includes('zinc') ||
    name.includes('collagen') || name.includes('olive oil') || name.includes('evoo')
  )

  if (isSupplementMatch) {
    return {
      archetype: 'supplement',
      isSpecialized: false,
      specializedTraits
    }
  }

  // 15. SPORTS
  if (logType === 'sport' || cat.includes('sport')) {
    return {
      archetype: 'sport',
      isSpecialized: false,
      specializedTraits
    }
  }

  return {
    archetype: 'general',
    isSpecialized: false,
    specializedTraits
  }
}
