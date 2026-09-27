import { Modality, DailyProtocolTask } from '@/lib/types'
import { getSimplifiedModalityName } from '@/components/blocks/blocksUtils'

export interface ModalityTimingRelationship {
  isCutoffOrBuffer: boolean
  pillText: string
  replacesDosage: boolean
  placement: 'under_title' | 'between_nodes' | 'inline_badge'
  anchorName?: string
  timingDirection?: 'before' | 'after' | 'during'
  timeOffsetLabel?: string // e.g. "at least 4 hours after", "6 hours before", "within 30m"
  scientificRationale?: string
  mechanism?: string
  pubmedUrl?: string
}

export interface SequentialStepLink {
  fromTaskId: string
  toTaskId: string
  fromModalityName: string
  toModalityName: string
  pillText: string // e.g. "within 30m", "immediately after", "30-60m", NO EMOJIS
  timingDirection: 'before' | 'after' | 'during'
  isDuring?: boolean
  scientificRationale: string
  mechanism: string
  pubmedUrl?: string
}

/**
 * Extracts normalized modality name for clinical matching, ensuring protocol names NEVER shadow modality identity.
 */
function extractCleanModalityName(task: DailyProtocolTask, modality?: Modality | null): string {
  const simplified = getSimplifiedModalityName(modality, task)
  const idParts = [
    modality?.id,
    modality?.slug,
    (task as any)?.modality_id,
    task.execution_details?.custom_name,
    (task as any)?.custom_name,
    modality?.display_name,
    modality?.name,
    (task as any)?.protocol_step?.title,
    (task as any)?.title,
    task.loose_modality?.name,
    ''
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (simplified && simplified !== 'Protocol Task') {
    return `${simplified.toLowerCase()} ${idParts}`
  }

  return idParts
}

/**
 * Automatically parses natural language timing relationships from database fields:
 * - protocol_step.timing_precision
 * - protocol_step.frequency
 * - protocol_step.timing_anchor
 * - protocol_step.timing_slot
 * - protocol_step.dose_text
 * - protocol_step.notes
 * - protocol_step.instructions
 * - modality.timing_summary
 * - modality.dose_or_exposure
 * - modality.preferred_time
 * - modality.default_timing_slot
 * - modality.instructions
 * - modality.brief_description
 * - task.execution_details.custom_timing
 * - task.execution_details.custom_dose
 * - task.execution_details.notes
 * - task.notes
 */
function extractDynamicTimingRelationship(
  task: DailyProtocolTask,
  modality?: Modality | null
): ModalityTimingRelationship | null {
  const isDiagnostic =
    (modality as any)?.is_diagnostic ||
    modality?.category === 'diagnostics' ||
    /clock|monitor|cpet|dexa|panel|scan|mri|bloodwork/i.test(modality?.name || '')

  const step = task.protocol_step
  const texts = [
    (step as any)?.timing_precision,
    step?.frequency,
    step?.timing_anchor,
    step?.timing_slot,
    modality?.timing_summary,
    (modality as any)?.preferred_time,
    (modality as any)?.default_timing_slot,
    step?.notes,
    step?.dose_text,
    modality?.dose_or_exposure,
    task.execution_details?.custom_timing,
    task.execution_details?.custom_dose,
    task.execution_details?.notes,
    (task as any)?.notes,
    step?.instructions,
    modality?.instructions,
    modality?.brief_description,
    modality?.name,
    modality?.display_name
  ]
    .filter(Boolean)
    .map((t) => String(t).toLowerCase())

  const combined = texts.join(' • ')
  if (!combined) return null

  // 1. "X hours/min before bed/sleep/lights out" or "X hour melatonin onset"
  const beforeBedHour =
    combined.match(
      /(\d+(?:\.\d+)?(?:[–-]\d+)?)\s*(?:hours?|hrs?|h)\s*(?:before|prior to|pre-?)\s*(?:bed|bedtime|sleep|lights out)/
    ) ||
    combined.match(
      /(\d+(?:\.\d+)?(?:[–-]\d+)?)\s*(?:hours?|hrs?|h)\s*(?:melatonin\s+onset|dimming|cutoff)/
    )
  if (beforeBedHour) {
    const dur = beforeBedHour[1].replace('-', '–')
    const isMelatoninOrLight = combined.includes('melatonin') || combined.includes('dimming') || combined.includes('light')
    return {
      isCutoffOrBuffer: true,
      pillText: `${dur} hours before bed`,
      replacesDosage: isMelatoninOrLight,
      placement: 'under_title',
      anchorName: 'bed',
      timingDirection: 'before',
      timeOffsetLabel: `${dur} hours before`,
      scientificRationale: isMelatoninOrLight
        ? 'Melatonin secretion rises in biological twilight. Ambient dimming 2 hours prior to lights out optimizes Dim Light Melatonin Onset (DLMO) and slow-wave sleep.'
        : 'Aligned with circadian biological night and pre-sleep core thermoregulatory drop.',
      mechanism: isMelatoninOrLight
        ? 'Prevents ocular melanopsin activation of ipRGCs, releasing inhibition on pineal melatonin synthesis.'
        : 'Facilitates core body temperature drop and parasympathetic activation prior to sleep onset.',
      pubmedUrl: isMelatoninOrLight ? 'https://pubmed.ncbi.nlm.nih.gov/25535358/' : undefined
    }
  }

  const beforeBedMin = combined.match(
    /(\d+(?:[–-]\d+)?)\s*(?:mins?|minutes?|m)\s*(?:before|prior to|pre-?)\s*(?:bed|bedtime|sleep|lights out)/
  )
  if (beforeBedMin) {
    const dur = beforeBedMin[1].replace('-', '–')
    return {
      isCutoffOrBuffer: true,
      pillText: `${dur}m before bed`,
      replacesDosage: false,
      placement: 'under_title',
      anchorName: 'bed',
      timingDirection: 'before',
      timeOffsetLabel: `${dur}m before`,
      scientificRationale:
        'Optimized pre-sleep window for neurochemical absorption and autonomic down-regulation.'
    }
  }

  if (
    combined.includes('immediately before bed') ||
    combined.includes('immediately before sleep') ||
    combined.includes('just before turning off the lights') ||
    combined.includes('at lights out')
  ) {
    return {
      isCutoffOrBuffer: true,
      pillText: 'immediately before bed',
      replacesDosage: false,
      placement: 'under_title',
      anchorName: 'bed',
      timingDirection: 'before',
      timeOffsetLabel: 'immediately before',
      scientificRationale:
        'Administered directly prior to sleep onset to anchor nighttime physiological recovery.'
    }
  }

  if (
    combined.includes('before bed') ||
    combined.includes('before bedtime') ||
    combined.includes('prior to sleep')
  ) {
    return {
      isCutoffOrBuffer: true,
      pillText: 'before bed',
      replacesDosage: false,
      placement: 'under_title',
      anchorName: 'bed',
      timingDirection: 'before',
      timeOffsetLabel: 'before bed',
      scientificRationale:
        'Administered before sleep to align with nocturnal recovery and cellular repair cycles.'
    }
  }

  // 2. Waking
  const postWakeMin =
    combined.match(
      /(?:within\s*)?(\d+(?:[–-]\d+)?)\s*(?:mins?|minutes?|m)\s*(?:of|after|post-?|upon)\s*wak(?:ing|e)/
    ) ||
    combined.match(
      /(?:first\s*)(\d+(?:[–-]\d+)?)\s*(?:mins?|minutes?|m)\s*(?:of|upon)\s*wak(?:ing|e)/
    ) ||
    combined.match(/within an hour of waking/)
  if (postWakeMin) {
    if (postWakeMin[0].includes('hour')) {
      return {
        isCutoffOrBuffer: true,
        pillText: 'within 60m of waking',
        replacesDosage: false,
        placement: 'under_title',
        anchorName: 'waking',
        timingDirection: 'after',
        timeOffsetLabel: 'within 60m of waking',
        scientificRationale:
          'Entrains the morning circadian activation window and peak cortisol awakening response.'
      }
    }
    const dur = postWakeMin[1].replace('-', '–')
    return {
      isCutoffOrBuffer: true,
      pillText: `within ${dur}m of waking`,
      replacesDosage: false,
      placement: 'under_title',
      anchorName: 'waking',
      timingDirection: 'after',
      timeOffsetLabel: `within ${dur}m of waking`,
      scientificRationale:
        'Entrains the morning circadian activation window and peak cortisol awakening response.'
    }
  }

  const mDelay = combined.match(/delay\s*(?:caffeine|coffee)?\s*(\d+(?:[–-]\d+)?)\s*(?:mins?|minutes?|m)/)
  if (mDelay) {
    const dur = mDelay[1].replace('-', '–')
    return {
      isCutoffOrBuffer: true,
      pillText: `${dur}m after waking`,
      replacesDosage: true,
      placement: 'under_title',
      anchorName: 'waking',
      timingDirection: 'after',
      timeOffsetLabel: `${dur}m after waking`,
      scientificRationale:
        'Allows natural cortisol awakening response to clear adenosine before exogenous caffeine ingestion.',
      mechanism: 'Avoids early morning adenosine receptor saturation and prevents the 2 PM energy crash.',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/1884484/'
    }
  }

  if (
    combined.includes('upon waking') ||
    combined.includes('immediately upon waking') ||
    combined.includes('on waking') ||
    combined.includes('fasted am')
  ) {
    return {
      isCutoffOrBuffer: true,
      pillText: 'upon waking',
      replacesDosage: false,
      placement: 'under_title',
      anchorName: 'waking',
      timingDirection: 'after',
      timeOffsetLabel: 'upon waking',
      scientificRationale:
        'First-action circadian anchor to jumpstart diurnal metabolic and cognitive rhythms.'
    }
  }

  // Diagnostics skip general meal/food pills
  if (isDiagnostic) return null

  // 3. Meals - ONLY for ingestibles or explicit postprandial/digestive activities
  const isMealContextAppropriate =
    modality?.category === 'supplements' ||
    modality?.category === 'nutrition' ||
    modality?.category === 'diet' ||
    modality?.category === 'peptides' ||
    /walk|soleus|glucose|insulin|digestive|berberine|acarbose|metformin|acetic|enzyme|fasting/i.test(modality?.name || '') ||
    /postprandial|post-meal|pre-meal/i.test(combined)

  if (isMealContextAppropriate) {
    const beforeMealMin = combined.match(
      /(\d+(?:[–-]\d+)?)\s*(?:mins?|minutes?|m)\s*(?:before|prior to)\s*(?:meals?|eating|food|first meal)/
    )
    if (beforeMealMin) {
      const dur = beforeMealMin[1].replace('-', '–')
      return {
        isCutoffOrBuffer: true,
        pillText: `${dur}m before meal`,
        replacesDosage: false,
        placement: 'under_title',
        anchorName: 'meal',
        timingDirection: 'before',
        timeOffsetLabel: `${dur}m before meal`,
        scientificRationale:
          'Pre-prandial priming window for optimal gastrointestinal enzyme and metabolic receptor readiness.'
      }
    }

    const postMealMin = combined.match(
      /(?:within\s*)?(\d+(?:[–-]\d+)?)\s*(?:mins?|minutes?|m)\s*(?:after|post-?)\s*(?:meals?|eating|food)/
    )
    if (postMealMin) {
      const dur = postMealMin[1].replace('-', '–')
      return {
        isCutoffOrBuffer: true,
        pillText: `within ${dur}m after meal`,
        replacesDosage: false,
        placement: 'under_title',
        anchorName: 'meal',
        timingDirection: 'after',
        timeOffsetLabel: `within ${dur}m after meal`,
        scientificRationale:
          'Postprandial window to accelerate glucose disposal and mitigate peak insulin excursions.'
      }
    }

    if (
      combined.includes('with first meal') ||
      combined.includes('with breakfast') ||
      combined.includes('during first meal')
    ) {
      return {
        isCutoffOrBuffer: true,
        pillText: 'with first meal',
        replacesDosage: false,
        placement: 'under_title',
        anchorName: 'first meal',
        timingDirection: 'during',
        timeOffsetLabel: 'with first meal',
        scientificRationale:
          'Co-ingestion with dietary lipids maximizes biliary micellar solubilization and absorption.'
      }
    }

    // Only match generic "with meal" if it does not merely stem from the legacy slot label "Morning / With Meal (8:00 AM - 10:00 AM)"
    const withoutSlot = combined.replace(/morning\s*\/\s*with meal\s*\([^)]*\)/g, '')
    if (
      withoutSlot.includes('with meal') ||
      withoutSlot.includes('with food') ||
      withoutSlot.includes('with dinner')
    ) {
      return {
        isCutoffOrBuffer: true,
        pillText: 'with meal',
        replacesDosage: false,
        placement: 'under_title',
        anchorName: 'meal',
        timingDirection: 'during',
        timeOffsetLabel: 'with meal',
        scientificRationale:
          'Co-ingestion with food buffers stomach acidity and enhances nutrient assimilation.'
      }
    }
  }

  // 4. Workout / Lift
  const beforeWorkoutMin = combined.match(
    /(\d+(?:[–-]\d+)?)\s*(?:mins?|minutes?|m)\s*(?:before|pre-?)\s*(?:workouts?|lifts?|training|exercise)/
  )
  if (beforeWorkoutMin) {
    const dur = beforeWorkoutMin[1].replace('-', '–')
    return {
      isCutoffOrBuffer: true,
      pillText: `${dur}m before workout`,
      replacesDosage: false,
      placement: 'under_title',
      anchorName: 'workout',
      timingDirection: 'before',
      timeOffsetLabel: `${dur}m before workout`,
      scientificRationale:
        'Pre-workout bioavailability window for peak plasma substrate concentration.'
    }
  }

  const postWorkoutMin = combined.match(
    /(?:within\s*)?(\d+(?:[–-]\d+)?)\s*(?:mins?|minutes?|m)\s*(?:after|post-?)\s*(?:workouts?|lifts?|training|exercise)/
  )
  if (postWorkoutMin) {
    const dur = postWorkoutMin[1].replace('-', '–')
    return {
      isCutoffOrBuffer: true,
      pillText: `within ${dur}m after workout`,
      replacesDosage: false,
      placement: 'under_title',
      anchorName: 'workout',
      timingDirection: 'after',
      timeOffsetLabel: `within ${dur}m after workout`,
      scientificRationale:
        'Post-exercise anabolic sensitivity window for myofibrillar protein synthesis.'
    }
  }

  return null
}

/**
 * Checks whether a modality has an explicit clinical protocol timing, buffer, or cutoff relationship
 * where the neutral timing pill renders prominently on the card.
 */
export function resolveModalityTimingRelationship(
  task: DailyProtocolTask,
  modality?: Modality | null,
  allDayTasks: DailyProtocolTask[] = []
): ModalityTimingRelationship | null {
  const rawName = extractCleanModalityName(task, modality)
  const doseText = (task.protocol_step?.dose_text || modality?.dose_or_exposure || '').toLowerCase()
  const timingText = (task.protocol_step?.timing_slot || modality?.timing_summary || '').toLowerCase()
  const stepNotes = (task.protocol_step?.notes || '').toLowerCase()
  const stepInstructions = (task.protocol_step?.instructions || '').toLowerCase()
  const combinedContext = `${rawName} | ${doseText} | ${timingText} | ${stepNotes} | ${stepInstructions}`

  // 1. Caffeine Cutoff
  if (
    rawName.includes('caffeine') &&
    (rawName.includes('cutoff') ||
      rawName.includes('adenosine') ||
      combinedContext.includes('cutoff') ||
      combinedContext.includes('past'))
  ) {
    const hours =
      rawName.includes('10-hour') || rawName.includes('10h') || combinedContext.includes('10-hour')
        ? '10 hours'
        : '8–10 hours'
    return {
      isCutoffOrBuffer: true,
      pillText: `${hours} before bed`,
      replacesDosage: true,
      placement: 'under_title',
      anchorName: 'bed',
      timingDirection: 'before',
      timeOffsetLabel: `${hours} before`,
      scientificRationale:
        'Caffeine has an elimination half-life of 5-7 hours. Antagonizing adenosine receptors within 8-10h of sleep severely disrupts NREM slow-wave sleep depth.',
      mechanism:
        'Prevents competitive antagonism of A1 and A2A adenosine receptors in the basal forebrain and ventrolateral preoptic nucleus (VLPO), preserving delta wave amplitude.',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/24235903/'
    }
  }

  // 2. Last Meal / Food / Alcohol Sleep-Protection Cutoff
  if (
    rawName.includes('last meal') ||
    rawName.includes('food cutoff') ||
    rawName.includes('eating cutoff') ||
    (rawName.includes('metabolic') && rawName.includes('cutoff')) ||
    combinedContext.includes('stop eating >4 hours') ||
    combinedContext.includes('stop eating >3 hours')
  ) {
    const hours =
      combinedContext.includes('>4 hours') || combinedContext.includes('4 hours')
        ? '4 hours before bed'
        : '3 hours before bed'
    return {
      isCutoffOrBuffer: true,
      pillText: hours,
      replacesDosage: true,
      placement: 'under_title',
      anchorName: 'bed',
      timingDirection: 'before',
      timeOffsetLabel: hours,
      scientificRationale:
        'Digestive cessation allows the core body temperature to drop 1-2°C required for sleep onset and deep slow-wave sleep progression.',
      mechanism:
        'Eliminates nocturnal diet-induced thermogenesis, prevents nocturnal insulin surges from blunting sleep-induced human growth hormone (hGH) release, and guards against reflux.',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/32822452/'
    }
  }

  // 3. Screen / Digital Sunset / Blue Light Dimming Cutoff
  if (
    rawName.includes('digital sunset') ||
    rawName.includes('screen cutoff') ||
    rawName.includes('blue light cutoff') ||
    rawName.includes('blue light dimming') ||
    rawName.includes('blue blocker')
  ) {
    return {
      isCutoffOrBuffer: true,
      pillText: '2 hours before bed',
      replacesDosage: true,
      placement: 'under_title',
      anchorName: 'bed',
      timingDirection: 'before',
      timeOffsetLabel: '2 hours before',
      scientificRationale:
        'Photoreceptors in intrinsically photosensitive retinal ganglion cells (ipRGCs) require absence of 460-480nm wavelengths to initiate melatonin synthesis.',
      mechanism:
        'Prevents melanopsin phototransduction in ipRGCs, terminating retinohypothalamic tract inhibition of the pineal gland enzyme arylalkylamine N-acetyltransferase (AANAT).',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/25535358/'
    }
  }

  // 4. Melatonin (Endogenous Dimming / Onset or Microdose Supplement)
  if (
    rawName.includes('melatonin') ||
    combinedContext.includes('melatonin onset') ||
    combinedContext.includes('melatonin dimming')
  ) {
    const isBehavioralOnset =
      rawName.includes('dimming') ||
      rawName.includes('onset') ||
      rawName.includes('hygiene') ||
      rawName.includes('walker')
    return {
      isCutoffOrBuffer: true,
      pillText: isBehavioralOnset ? '2 hours before bed' : '30–60m before bed',
      replacesDosage: isBehavioralOnset,
      placement: 'under_title',
      anchorName: 'bed',
      timingDirection: 'before',
      timeOffsetLabel: isBehavioralOnset ? '2 hours before' : '30–60m before',
      scientificRationale:
        'Melatonin secretion rises in biological twilight. Exogenous administration or ambient dimming 1-2 hours prior to lights out optimizes sleep onset and core thermoregulation.',
      mechanism:
        'Binds MT1/MT2 G-protein coupled receptors in the suprachiasmatic nucleus (SCN), attenuating neuronal firing rate and disinhibiting the VLPO sleep switch.',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/24802882/'
    }
  }

  // 5. Matthew Walker Sleep Triad / Core Sleep Stack (Mag L-Threonate + Apigenin + L-Theanine)
  if (
    rawName.includes('sleep triad') ||
    rawName.includes('sleep stack') ||
    (rawName.includes('magnesium') &&
      (rawName.includes('threonate') || rawName.includes('bisglycinate') || rawName.includes('glycinate')) &&
      (combinedContext.includes('bed') || combinedContext.includes('sleep') || combinedContext.includes('night'))) ||
    (rawName.includes('apigenin') &&
      (combinedContext.includes('bed') || combinedContext.includes('sleep') || combinedContext.includes('night')))
  ) {
    return {
      isCutoffOrBuffer: true,
      pillText: '30–60m before bed',
      replacesDosage: false,
      placement: 'under_title',
      anchorName: 'bed',
      timingDirection: 'before',
      timeOffsetLabel: '30–60m before',
      scientificRationale:
        'Plasma amino acid and magnesium levels peak within 45 minutes, quieting cortical excitement before slow-wave sleep.',
      mechanism:
        'Inhibits NMDA receptor channels and activates GABA-A chloride channels, facilitating the required 1°C core body temperature drop.',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/23853635/'
    }
  }

  // 6. Cool Bedroom / 65°F (18.3°C) Thermal Drop Sleep Environment
  if (
    rawName.includes('65°f') ||
    rawName.includes('thermal drop') ||
    (rawName.includes('cool') && rawName.includes('sleep') && rawName.includes('environment'))
  ) {
    return {
      isCutoffOrBuffer: true,
      pillText: '30m before bed',
      replacesDosage: false,
      placement: 'under_title',
      anchorName: 'bed',
      timingDirection: 'before',
      timeOffsetLabel: '30m before',
      scientificRationale:
        'Pre-cooling the bedroom allows peripheral vasodilation to dump core heat into the environment before bedtime.',
      mechanism:
        'Peripheral cutaneous vasodilation drives core heat dissipation, stimulating the preoptic anterior hypothalamus to trigger sleep onset.',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/10496152/'
    }
  }

  // 7. Nocturnal Mouth Taping / Nasal Breathing Airway
  if (
    rawName.includes('mouth tap') ||
    rawName.includes('nasal airway') ||
    (rawName.includes('nasal breathing') &&
      (combinedContext.includes('nocturnal') || combinedContext.includes('sleep') || combinedContext.includes('bed')))
  ) {
    return {
      isCutoffOrBuffer: true,
      pillText: 'immediately before bed',
      replacesDosage: false,
      placement: 'under_title',
      anchorName: 'bed',
      timingDirection: 'before',
      timeOffsetLabel: 'immediately before',
      scientificRationale:
        'Secures mandatory nasal breathing before sleep onset, preventing airway collapse and nocturnal mouth breathing.',
      mechanism:
        'Enhances paranasal sinus nitric oxide inhalation, increasing alveolar gas exchange and preventing nocturnal sympathetic arousals.',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/36149015/'
    }
  }

  // 8. Delay Morning Caffeine / Cortisol Awakening Protection
  if (
    rawName.includes('delay coffee') ||
    rawName.includes('delay caffeine') ||
    rawName.includes('cortisol awakening')
  ) {
    return {
      isCutoffOrBuffer: true,
      pillText: '90–120m after waking',
      replacesDosage: true,
      placement: 'under_title',
      anchorName: 'waking',
      timingDirection: 'after',
      timeOffsetLabel: '90–120m after',
      scientificRationale:
        'Allows natural peak cortisol to clear morning adenosine residuals without creating early adenosine receptor upregulation and an afternoon crash.',
      mechanism:
        'Permits the Cortisol Awakening Response (CAR) to peak naturally at 30-45m post-waking, avoiding early-morning caffeine tolerance and receptor saturation.',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/1884484/'
    }
  }

  // 9. Morning Sunlight / Direct Outdoor Photon Exposure
  if (
    rawName.includes('morning sunlight') ||
    rawName.includes('morning light') ||
    (rawName.includes('sunlight') && combinedContext.includes('waking')) ||
    (rawName.includes('10k lux') && combinedContext.includes('waking'))
  ) {
    return {
      isCutoffOrBuffer: true,
      pillText: 'within 30–60m of waking',
      replacesDosage: false,
      placement: 'under_title',
      anchorName: 'waking',
      timingDirection: 'after',
      timeOffsetLabel: 'within 30–60m of waking',
      scientificRationale:
        'Direct outdoor sunlight exposure within 30-60 minutes of waking sets the central circadian clock and starts the 14-hour timer for nocturnal melatonin onset.',
      mechanism:
        'Activates melanopsin intrinsically photosensitive retinal ganglion cells (ipRGCs), resetting SCN clock genes and elevating morning cortisol awakening response.',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/31534032/'
    }
  }

  // 10. Morning Electrolyte Hydration
  if (
    (rawName.includes('electrolyte') ||
      rawName.includes('hydration') ||
      rawName.includes('lmnt') ||
      rawName.includes('water')) &&
    (combinedContext.includes('morning') ||
      combinedContext.includes('waking') ||
      combinedContext.includes('upon waking'))
  ) {
    return {
      isCutoffOrBuffer: true,
      pillText: 'immediately upon waking',
      replacesDosage: false,
      placement: 'under_title',
      anchorName: 'waking',
      timingDirection: 'after',
      timeOffsetLabel: 'immediately upon waking',
      scientificRationale:
        'Rapidly reverses nocturnal hypovolemia and restores glomerular filtration and blood pressure after 7-8 hours of fluid loss.',
      mechanism:
        'Rapid sodium and water absorption via SGLT1 restores extracellular fluid volume and stabilizes resting heart rate variability.',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/29345167/'
    }
  }

  // 11. Evening Light / Sunset Viewing ("Netflix Inoculation")
  if (
    rawName.includes('evening light') ||
    rawName.includes('sunset') ||
    rawName.includes('netflix inoculation')
  ) {
    return {
      isCutoffOrBuffer: true,
      pillText: 'during sunset',
      replacesDosage: false,
      placement: 'under_title',
      anchorName: 'sunset',
      timingDirection: 'during',
      timeOffsetLabel: 'during sunset',
      scientificRationale:
        'Viewing sunset communicates solar descent to the SCN and adjusts retinal sensitivity to buffer against nocturnal screen blue light.',
      mechanism:
        'Adjusts the biological threshold sensitivity of retinal melanopsin ganglion cells, mitigating nocturnal melatonin suppression.',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/30311830/'
    }
  }

  // 12. Cold Plunge (Check if Resistance Training was done earlier on the same day)
  if (
    rawName.includes('cold plunge') ||
    rawName.includes('ice bath') ||
    rawName.includes('cold immersion')
  ) {
    const hasLift = allDayTasks.some((t) => {
      const n = extractCleanModalityName(t)
      return (
        n.includes('strength') ||
        n.includes('resistance') ||
        n.includes('lift') ||
        n.includes('hypertrophy') ||
        n.includes('circuit')
      )
    })

    if (hasLift) {
      return {
        isCutoffOrBuffer: true,
        pillText: 'at least 4 hours after lift',
        replacesDosage: false,
        placement: 'under_title',
        anchorName: 'lift',
        timingDirection: 'after',
        timeOffsetLabel: 'at least 4 hours after',
        scientificRationale:
          'Cold water immersion directly post-resistance training blunts satellite cell activity, muscle protein synthesis, and hypertrophic signaling.',
        mechanism:
          'Suppresses inflammatory prostaglandins and downregulates p70S6K and mTORC1 phosphorylation when administered within 4h of mechanical overload.',
        pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/31513366/'
      }
    }
  }

  // 13. Post-Meal Glucose Walk
  if (
    (rawName.includes('walk') || rawName.includes('ambulation')) &&
    (combinedContext.includes('post-meal') ||
      combinedContext.includes('glucose') ||
      combinedContext.includes('after meal'))
  ) {
    return {
      isCutoffOrBuffer: true,
      pillText: 'within 30m after meal',
      replacesDosage: false,
      placement: 'under_title',
      anchorName: 'meal',
      timingDirection: 'after',
      timeOffsetLabel: 'within 30m after meal',
      scientificRationale:
        'Light ambulation immediately following meals significantly dampens the glycemic spike and reduces insulin demand.',
      mechanism:
        'Muscle contraction stimulates non-insulin-dependent GLUT4 translocation, accelerating glucose disposal into working lower-limb musculature.',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/23761134/'
    }
  }

  // 14. Berberine / Metformin / Digestive Enzymes
  if (
    rawName.includes('berberine') ||
    rawName.includes('metformin') ||
    rawName.includes('acarbose') ||
    rawName.includes('digestive enzyme')
  ) {
    return {
      isCutoffOrBuffer: true,
      pillText: '10–15m before meal',
      replacesDosage: false,
      placement: 'under_title',
      anchorName: 'meal',
      timingDirection: 'before',
      timeOffsetLabel: '10–15m before meal',
      scientificRationale:
        'Enzymatic and AMPK mucosal priming attenuates the peak postprandial glucose excursion.',
      mechanism:
        'Pre-meal AMPK activation promotes GLUT4 transporter translocation in peripheral tissue before carbohydrate influx.',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/18442638/'
    }
  }

  // 15. Fat-Soluble Longevity Nutrients (EVOO, Omega-3, Vit D3, K2, CoQ10, Curcumin)
  if (
    (rawName.includes('evoo') ||
      rawName.includes('olive oil') ||
      rawName.includes('omega') ||
      rawName.includes('vitamin d') ||
      rawName.includes('coq10') ||
      rawName.includes('curcumin')) &&
    (combinedContext.includes('meal') ||
      combinedContext.includes('food') ||
      combinedContext.includes('breakfast'))
  ) {
    return {
      isCutoffOrBuffer: true,
      pillText: 'with first meal',
      replacesDosage: false,
      placement: 'under_title',
      anchorName: 'first meal',
      timingDirection: 'during',
      timeOffsetLabel: 'with first meal',
      scientificRationale:
        'Lipophilic polyphenols and fat-soluble vitamins require dietary lipids for micellar integration and enterocyte uptake.',
      mechanism:
        'Co-ingestion with lipids stimulates biliary micelle formation and cholecystokinin (CCK) release, boosting bioavailability by up to 300%.',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/25442537/'
    }
  }

  // 16. Pre-Workout / Citrulline / Nitric Oxide
  if (
    rawName.includes('pre-workout') ||
    rawName.includes('citrulline') ||
    rawName.includes('nitric oxide') ||
    rawName.includes('arginine')
  ) {
    return {
      isCutoffOrBuffer: true,
      pillText: '30–45m before workout',
      replacesDosage: false,
      placement: 'under_title',
      anchorName: 'workout',
      timingDirection: 'before',
      timeOffsetLabel: '30–45m before workout',
      scientificRationale:
        'Plasma L-arginine and nitric oxide precursors peak at 45 minutes, optimizing endothelial vasodilation and metabolite buffering.',
      mechanism:
        'eNOS upregulation enhances intramuscular capillary perfusion, nutrient delivery, and ammonia clearance during high-load muscular contraction.',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/20386132/'
    }
  }

  // 17. Whey Protein / Post-Workout Leucine Bolus
  if (
    (rawName.includes('whey') ||
      rawName.includes('protein shake') ||
      rawName.includes('leucine') ||
      rawName.includes('essential amino')) &&
    (combinedContext.includes('workout') ||
      combinedContext.includes('post-workout') ||
      combinedContext.includes('lift'))
  ) {
    return {
      isCutoffOrBuffer: true,
      pillText: 'within 45–60m after workout',
      replacesDosage: false,
      placement: 'under_title',
      anchorName: 'workout',
      timingDirection: 'after',
      timeOffsetLabel: 'within 45–60m after workout',
      scientificRationale:
        'Supplies essential amino acids during the heightened post-exercise anabolic sensitivity window.',
      mechanism:
        'Intracellular leucine triggers Sestrin2 disinhibition of GATOR2, activating mTORC1 and p70S6K phosphorylation for myofibrillar protein synthesis.',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/25169440/'
    }
  }

  // 18. Hyperthermic Sauna (Post-Workout or Evening)
  if (rawName.includes('sauna') || rawName.includes('hyperthermic')) {
    if (combinedContext.includes('workout') || combinedContext.includes('lift') || combinedContext.includes('exercise')) {
      return {
        isCutoffOrBuffer: true,
        pillText: 'within 20m after workout',
        replacesDosage: false,
        placement: 'under_title',
        anchorName: 'workout',
        timingDirection: 'after',
        timeOffsetLabel: 'within 20m after workout',
        scientificRationale:
          'Post-exercise hyperthermia induces prolonged vascular dilation and amplifies the endocrine recovery response.',
        mechanism:
          'Heat shock transcription factor 1 (HSF1) triggers HSP70/HSP90 chaperones and augments circulating human growth hormone (hGH) release.',
        pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/17582485/'
      }
    }
    if (combinedContext.includes('evening') || combinedContext.includes('bed') || combinedContext.includes('sleep')) {
      return {
        isCutoffOrBuffer: true,
        pillText: '1–2 hours before bed',
        replacesDosage: false,
        placement: 'under_title',
        anchorName: 'bed',
        timingDirection: 'before',
        timeOffsetLabel: '1–2 hours before bed',
        scientificRationale:
          'Convective hyperthermia elevates core temperature, followed by rapid peripheral heat dumping that facilitates the 2°F core drop needed for deep sleep.',
        mechanism:
          'Vasodilation accelerates cutaneous heat dissipation, stimulating preoptic anterior hypothalamus sleep networks.',
        pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/10496152/'
      }
    }
  }

  // 19. NSDR / Yoga Nidra
  if (rawName.includes('nsdr') || rawName.includes('yoga nidra')) {
    return {
      isCutoffOrBuffer: true,
      pillText: 'early afternoon dip',
      replacesDosage: false,
      placement: 'under_title',
      anchorName: 'afternoon',
      timingDirection: 'during',
      timeOffsetLabel: 'during afternoon circadian dip',
      scientificRationale:
        'Practicing 10-20 minutes of Non-Sleep Deep Rest during the afternoon circadian dip restores striatal dopamine and autonomic vagal tone.',
      mechanism:
        'Synchronizes cortical slow-wave oscillations, facilitating synaptic consolidation and replenishing striatal dopamine reserves.',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/11958969/'
    }
  }

  // 20. Dynamic Database & Metadata Parsing Fallback:
  // Extracts timing deltas embedded in protocol step descriptions, frequencies, or notes
  const dynamicMatch = extractDynamicTimingRelationship(task, modality)
  if (dynamicMatch) {
    return dynamicMatch
  }

  return null
}

/**
 * Resolves sequential step links between adjacent tasks in 1-wide blocks mode or classic mode.
 * STRICT CLINICAL STANDARD: Only pairs with established, evidence-based physiological
 * relationships or explicit intra-protocol sequence steps are linked.
 */
export function resolveSequentialStepLink(
  currentTask: DailyProtocolTask,
  nextTask: DailyProtocolTask,
  currentModality?: Modality | null,
  nextModality?: Modality | null
): SequentialStepLink | null {
  const currentName = extractCleanModalityName(currentTask, currentModality)
  const nextName = extractCleanModalityName(nextTask, nextModality)

  const currentSimple = getSimplifiedModalityName(currentModality, currentTask)
  const nextSimple = getSimplifiedModalityName(nextModality, nextTask)

  // 1. Morning Sunlight -> Morning Workout / Cardio / Walk
  if (
    (currentName.includes('sunlight') ||
      currentName.includes('circadian sunlight') ||
      currentName.includes('outdoor light')) &&
    (nextName.includes('exercise') ||
      nextName.includes('cardio') ||
      nextName.includes('zone 2') ||
      nextName.includes('training') ||
      nextName.includes('circuit') ||
      nextName.includes('walk') ||
      nextName.includes('run'))
  ) {
    return {
      fromTaskId: currentTask.id,
      toTaskId: nextTask.id,
      fromModalityName: currentSimple,
      toModalityName: nextSimple,
      pillText: 'within 30m after',
      timingDirection: 'after',
      scientificRationale:
        'Morning photon exposure synchronizes peripheral muscular clocks, raising core body temperature and sympathetic output.',
      mechanism:
        'SCN-driven sympathetic tone increases epinephrine release and intramuscular substrate mobilization during subsequent physical exertion.',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/31534032/'
    }
  }

  // 2. Morning Hydration / Electrolytes -> Morning Sunlight
  if (
    (currentName.includes('electrolyte') || currentName.includes('water') || currentName.includes('hydration') || currentName.includes('lmnt')) &&
    (nextName.includes('sunlight') || nextName.includes('outdoor light') || nextName.includes('morning light'))
  ) {
    return {
      fromTaskId: currentTask.id,
      toTaskId: nextTask.id,
      fromModalityName: currentSimple,
      toModalityName: nextSimple,
      pillText: 'immediately after',
      timingDirection: 'after',
      scientificRationale:
        'Hydration restores intracellular osmolality before direct outdoor photon exposure.',
      mechanism:
        'SGLT1-mediated sodium and water absorption stabilizes systemic blood pressure, optimizing cerebral perfusion while outdoors.',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/29345167/'
    }
  }

  // 3. Morning Hydration / Electrolytes -> Morning Workout
  if (
    (currentName.includes('electrolyte') || currentName.includes('water') || currentName.includes('hydration') || currentName.includes('lmnt')) &&
    (nextName.includes('workout') || nextName.includes('lift') || nextName.includes('cardio') || nextName.includes('training'))
  ) {
    return {
      fromTaskId: currentTask.id,
      toTaskId: nextTask.id,
      fromModalityName: currentSimple,
      toModalityName: nextSimple,
      pillText: 'within 20–30m after',
      timingDirection: 'after',
      scientificRationale:
        'Pre-hydrating with electrolytes prevents hypovolemic cardiac drift and preserves contractile cross-bridge cycling.',
      mechanism:
        'Maintains plasma volume and preserves sarcolemmal sodium-potassium ATPase pump velocity during physical exertion.',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/29345167/'
    }
  }

  // 4. Pre-Workout / Citrulline / Nitric Oxide -> Resistance Training / Workout
  if (
    (currentName.includes('citrulline') ||
      currentName.includes('pre-workout') ||
      currentName.includes('nitric oxide') ||
      currentName.includes('arginine')) &&
    (nextName.includes('resistance') ||
      nextName.includes('lift') ||
      nextName.includes('strength') ||
      nextName.includes('circuit') ||
      nextName.includes('workout'))
  ) {
    return {
      fromTaskId: currentTask.id,
      toTaskId: nextTask.id,
      fromModalityName: currentSimple,
      toModalityName: nextSimple,
      pillText: '30–45m before',
      timingDirection: 'before',
      scientificRationale:
        'Plasma L-arginine and nitric oxide precursors peak at 45 minutes, optimizing endothelial vasodilation and metabolite buffering.',
      mechanism:
        'eNOS upregulation enhances intramuscular capillary perfusion, nutrient delivery, and ammonia clearance during high-load muscular contraction.',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/20386132/'
    }
  }

  // 5. Resistance Training / Lift -> Whey / Protein / Leucine
  if (
    (currentName.includes('resistance') ||
      currentName.includes('lift') ||
      currentName.includes('strength') ||
      currentName.includes('functional training')) &&
    (nextName.includes('protein') ||
      nextName.includes('whey') ||
      nextName.includes('leucine') ||
      nextName.includes('essential amino'))
  ) {
    return {
      fromTaskId: currentTask.id,
      toTaskId: nextTask.id,
      fromModalityName: currentSimple,
      toModalityName: nextSimple,
      pillText: 'within 45–60m after',
      timingDirection: 'after',
      scientificRationale:
        'Supplies essential amino acids during the heightened post-exercise anabolic sensitivity window.',
      mechanism:
        'Intracellular leucine triggers Sestrin2 disinhibition of GATOR2, activating mTORC1 and p70S6K phosphorylation for myofibrillar protein synthesis.',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/25169440/'
    }
  }

  // 6. Resistance Training / Exercise -> Sauna (Heat Acclimation)
  if (
    (currentName.includes('resistance') ||
      currentName.includes('lift') ||
      currentName.includes('strength') ||
      currentName.includes('workout') ||
      currentName.includes('training')) &&
    (nextName.includes('sauna') ||
      nextName.includes('hyperthermic') ||
      nextName.includes('infrared'))
  ) {
    return {
      fromTaskId: currentTask.id,
      toTaskId: nextTask.id,
      fromModalityName: currentSimple,
      toModalityName: nextSimple,
      pillText: 'within 20m after',
      timingDirection: 'after',
      scientificRationale:
        'Post-exercise hyperthermia induces prolonged vascular dilation and amplifies the endocrine recovery response.',
      mechanism:
        'Heat shock transcription factor 1 (HSF1) triggers HSP70/HSP90 chaperones and augments circulating human growth hormone (hGH) release.',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/17582485/'
    }
  }

  // 7. Sauna -> Cold Plunge (Contrast Therapy / Søberg Principle)
  if (
    (currentName.includes('sauna') || currentName.includes('hyperthermic')) &&
    (nextName.includes('cold plunge') ||
      nextName.includes('ice bath') ||
      nextName.includes('cold immersion'))
  ) {
    return {
      fromTaskId: currentTask.id,
      toTaskId: nextTask.id,
      fromModalityName: currentSimple,
      toModalityName: nextSimple,
      pillText: 'immediately after',
      timingDirection: 'after',
      scientificRationale:
        'Rapid contrast vasodilation-to-vasoconstriction flush; ending on cold forces prolonged metabolic shivering thermogenesis.',
      mechanism:
        'Acute vasoconstriction shunts blood from the cutaneous periphery to core organs, activating brown adipose tissue (BAT) UCP1 thermogenesis.',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/34689033/'
    }
  }

  // 8. High-Polyphenol EVOO / Fat-Soluble Vitamins (D3, K2, CoQ10, Omega 3) -> Meal
  if (
    (currentName.includes('evoo') ||
      currentName.includes('olive oil') ||
      currentName.includes('omega') ||
      currentName.includes('vitamin d') ||
      currentName.includes('coq10') ||
      currentName.includes('curcumin')) &&
    (nextName.includes('meal') ||
      nextName.includes('breakfast') ||
      nextName.includes('lunch') ||
      nextName.includes('dinner'))
  ) {
    return {
      fromTaskId: currentTask.id,
      toTaskId: nextTask.id,
      fromModalityName: currentSimple,
      toModalityName: nextSimple,
      pillText: 'with first meal',
      timingDirection: 'during',
      isDuring: true,
      scientificRationale:
        'Lipophilic polyphenols and fat-soluble vitamins require dietary lipids for micellar integration and enterocyte uptake.',
      mechanism:
        'Co-ingestion with lipids stimulates biliary micelle formation and cholecystokinin (CCK) release, boosting bioavailability by up to 300%.',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/25442537/'
    }
  }

  // 9. Meal -> High-Polyphenol EVOO / Fat-Soluble Supplements (Reverse sequence)
  if (
    (currentName.includes('meal') ||
      currentName.includes('breakfast') ||
      nextName.includes('lunch') ||
      nextName.includes('dinner')) &&
    (nextName.includes('evoo') ||
      nextName.includes('olive oil') ||
      nextName.includes('omega') ||
      nextName.includes('vitamin d') ||
      nextName.includes('coq10') ||
      nextName.includes('curcumin'))
  ) {
    return {
      fromTaskId: currentTask.id,
      toTaskId: nextTask.id,
      fromModalityName: currentSimple,
      toModalityName: nextSimple,
      pillText: 'during meal',
      timingDirection: 'during',
      isDuring: true,
      scientificRationale:
        'Lipophilic compounds require co-ingestion with dietary fats to stimulate duodenal bile secretion and enterocyte absorption.',
      mechanism:
        'Biliary micelles solubilize fat-soluble molecules for passive diffusion across the intestinal unstirred water layer.',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/25442537/'
    }
  }

  // 10. Berberine / Metformin / Bitter Melon -> Meal
  if (
    (currentName.includes('berberine') ||
      currentName.includes('metformin') ||
      currentName.includes('bitter melon') ||
      currentName.includes('digestive enzyme')) &&
    (nextName.includes('meal') ||
      nextName.includes('breakfast') ||
      nextName.includes('lunch') ||
      nextName.includes('dinner'))
  ) {
    return {
      fromTaskId: currentTask.id,
      toTaskId: nextTask.id,
      fromModalityName: currentSimple,
      toModalityName: nextSimple,
      pillText: '10–15m before',
      timingDirection: 'before',
      scientificRationale:
        'Enzymatic and AMPK mucosal priming attenuates the peak postprandial glucose excursion.',
      mechanism:
        'Pre-meal AMPK activation promotes GLUT4 transporter translocation in peripheral tissue before carbohydrate influx.',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/18442638/'
    }
  }

  // 11. Meal -> Post-Meal Glucose Walk
  if (
    (currentName.includes('meal') ||
      currentName.includes('breakfast') ||
      currentName.includes('lunch') ||
      currentName.includes('dinner')) &&
    (nextName.includes('walk') ||
      nextName.includes('glucose walk') ||
      nextName.includes('ambulation'))
  ) {
    return {
      fromTaskId: currentTask.id,
      toTaskId: nextTask.id,
      fromModalityName: currentSimple,
      toModalityName: nextSimple,
      pillText: 'within 30m after',
      timingDirection: 'after',
      scientificRationale:
        'Light ambulation immediately following meals significantly dampens the glycemic spike and reduces insulin demand.',
      mechanism:
        'Muscle contraction stimulates non-insulin-dependent GLUT4 translocation, accelerating glucose disposal into working lower-limb musculature.',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/23761134/'
    }
  }

  // 12. Deep Work / Focus Bout -> NSDR / Yoga Nidra
  if (
    (currentName.includes('focus') || currentName.includes('deep work') || currentName.includes('study')) &&
    (nextName.includes('nsdr') || nextName.includes('yoga nidra'))
  ) {
    return {
      fromTaskId: currentTask.id,
      toTaskId: nextTask.id,
      fromModalityName: currentSimple,
      toModalityName: nextSimple,
      pillText: 'immediately after',
      timingDirection: 'after',
      scientificRationale:
        'Non-Sleep Deep Rest immediately following high-intensity focus bouts consolidates neural plasticity and resets dopamine.',
      mechanism:
        'Low-frequency oscillatory synchronization accelerates synaptic downscaling and replenishes striatal dopamine reserves.',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/11958969/'
    }
  }

  // 13. Evening Light / Sunset -> Dinner / Last Meal
  if (
    (currentName.includes('evening light') || currentName.includes('sunset') || currentName.includes('netflix inoculation')) &&
    (nextName.includes('dinner') || nextName.includes('last meal') || nextName.includes('meal'))
  ) {
    return {
      fromTaskId: currentTask.id,
      toTaskId: nextTask.id,
      fromModalityName: currentSimple,
      toModalityName: nextSimple,
      pillText: 'before last meal',
      timingDirection: 'before',
      scientificRationale:
        'Viewing natural sunset communication anchors biological evening prior to final metabolic caloric intake.',
      mechanism:
        'Low-solar-angle sunset light reduces retinal sensitivity to subsequent artificial light, preserving nighttime insulin and melatonin cycles.',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/30311830/'
    }
  }

  // 14. Digital Sunset / Blue Light Dimming -> Sleep Stack / Melatonin
  if (
    (currentName.includes('digital sunset') || currentName.includes('blue light') || currentName.includes('screen cutoff')) &&
    (nextName.includes('melatonin') || nextName.includes('sleep triad') || nextName.includes('sleep stack') || nextName.includes('magnesium'))
  ) {
    return {
      fromTaskId: currentTask.id,
      toTaskId: nextTask.id,
      fromModalityName: currentSimple,
      toModalityName: nextSimple,
      pillText: '30–60m before bed',
      timingDirection: 'after',
      scientificRationale:
        'Pre-dimming ambient light allows neurochemical sleep aids to take effect without ocular melanopsin interference.',
      mechanism:
        'Absence of short-wavelength photons permits pineal AANAT enzyme activity, synergizing with exogenous GABA and magnesium agonists.',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/25535358/'
    }
  }

  // 15. Sleep Stack (Magnesium / Theanine / Apigenin / Melatonin) -> Bedtime / Thermal Drop
  if (
    (currentName.includes('magnesium') ||
      currentName.includes('glycine') ||
      currentName.includes('theanine') ||
      currentName.includes('apigenin') ||
      currentName.includes('sleep triad') ||
      currentName.includes('sleep stack') ||
      currentName.includes('melatonin')) &&
    (nextName.includes('sleep') ||
      nextName.includes('bedtime') ||
      nextName.includes('65°f') ||
      nextName.includes('thermal drop') ||
      nextName.includes('wind down'))
  ) {
    return {
      fromTaskId: currentTask.id,
      toTaskId: nextTask.id,
      fromModalityName: currentSimple,
      toModalityName: nextSimple,
      pillText: '30–60m before',
      timingDirection: 'before',
      scientificRationale:
        'Absorption and peak plasma concentration of neuroinhibitory amino acids align with circadian sleep spindle onset.',
      mechanism:
        'Magnesium blocks NMDA glutamate receptor channels while glycine stimulates inhibitory GABA-A receptors, facilitating core temperature drop.',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/23853635/'
    }
  }

  // 16. Nocturnal Mouth Taping -> Sleep / Lights Out
  if (
    (currentName.includes('mouth tape') || currentName.includes('nasal airway') || currentName.includes('nasal breathing')) &&
    (nextName.includes('sleep') || nextName.includes('bedtime') || nextName.includes('night'))
  ) {
    return {
      fromTaskId: currentTask.id,
      toTaskId: nextTask.id,
      fromModalityName: currentSimple,
      toModalityName: nextSimple,
      pillText: 'immediately before',
      timingDirection: 'before',
      scientificRationale:
        'Ensures lip seal and strict nasal respiration before lights out.',
      mechanism:
        'Mandates paranasal sinus nitric oxide uptake, optimizing blood oxygenation and deep slow-wave sleep consolidation.',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/36149015/'
    }
  }

  // 17. Intra-Protocol Consecutive Step Linking:
  // If tasks belong to the same protocol and have consecutive steps, extract the timing delta from the protocol step definition!
  const currentProtoId = currentTask.protocol_step?.protocol_id || currentTask.lineages?.[0]?.protocol_id
  const nextProtoId = nextTask.protocol_step?.protocol_id || nextTask.lineages?.[0]?.protocol_id

  if (currentProtoId && nextProtoId && currentProtoId === nextProtoId) {
    const nextPrecision = (nextTask.protocol_step as any)?.timing_precision || nextTask.protocol_step?.timing_anchor || nextTask.protocol_step?.notes
    if (nextPrecision && typeof nextPrecision === 'string') {
      const pLower = nextPrecision.toLowerCase()
      let pillText: string | null = null

      if (pLower.includes('within 30m') || pLower.includes('within 30 min')) pillText = 'within 30m after'
      else if (pLower.includes('within 15m') || pLower.includes('within 15 min')) pillText = 'within 15m after'
      else if (pLower.includes('within 45–60m') || pLower.includes('within 45-60m')) pillText = 'within 45–60m after'
      else if (pLower.includes('immediately after')) pillText = 'immediately after'
      else if (pLower.includes('30–60m before') || pLower.includes('30-60m before')) pillText = '30–60m before'
      else if (pLower.includes('10–15m before') || pLower.includes('10-15m before')) pillText = '10–15m before'
      else if (pLower.includes('with first meal') || pLower.includes('during meal')) pillText = 'during meal'

      if (pillText) {
        return {
          fromTaskId: currentTask.id,
          toTaskId: nextTask.id,
          fromModalityName: currentSimple,
          toModalityName: nextSimple,
          pillText,
          timingDirection: pillText.includes('before') ? 'before' : pillText.includes('during') ? 'during' : 'after',
          isDuring: pillText.includes('during'),
          scientificRationale: nextTask.protocol_step?.notes || nextTask.protocol_step?.instructions || 'Standard sequential protocol routine sequence.',
          mechanism: nextTask.protocol_step?.instructions || 'Coupled physiological protocol progression.',
          pubmedUrl: (nextTask.protocol_step as any)?.pubmed_url
        }
      }
    }
  }

  // Default: NO authentic sequential link between these two items -> Return null!
  return null
}
