import { Modality } from '@/lib/types'
import { ModalityArchetype, getModalityArchetype } from '@/lib/data/modalityArchetypes'

export interface ArchetypeDoseConfig {
  archetype: ModalityArchetype
  primaryLabel: string
  defaultUnit: string
  allowedUnits: string[]
  secondaryLabel: string
  secondaryPlaceholder: string
  secondaryPresets: string[]
  isSupplementsOrPeptide: boolean
}

/**
 * Returns the canonical dosage, parameter, and synergy configuration for any modality based on its biological archetype.
 */
export function getArchetypeDoseConfig(modality: Modality | any): ArchetypeDoseConfig {
  const { archetype } = getModalityArchetype(modality)
  const name = (modality?.display_name || modality?.name || '').toLowerCase()
  const cat = (modality?.category || '').toLowerCase()

  switch (archetype) {
    case 'sleep':
      return {
        archetype: 'sleep',
        primaryLabel: 'Sleep Opportunity (Hours)',
        defaultUnit: 'hours',
        allowedUnits: ['hours', 'hrs', 'hours in bed', 'hours of sleep'],
        secondaryLabel: 'Target Room Temp & Environment',
        secondaryPlaceholder: 'e.g. 65°F (18.3°C) + 100% Blackout Darkness',
        secondaryPresets: [
          '65°F (18.3°C)',
          '66°F–68°F (19°C–20°C)',
          '100% Pitch Darkness',
          'Blackout Shades + Eye Mask',
          '65°F Thermostat & Breathable Bedding'
        ],
        isSupplementsOrPeptide: false
      }

    case 'thermal': {
      const isSauna = name.includes('sauna') || name.includes('heat') || cat.includes('sauna') || cat.includes('heat')
      if (isSauna) {
        return {
          archetype: 'thermal',
          primaryLabel: 'Session Duration (Minutes)',
          defaultUnit: 'mins',
          allowedUnits: ['mins', 'minutes', 'secs', 'seconds'],
          secondaryLabel: 'Target Sauna Temperature',
          secondaryPlaceholder: 'e.g. 174°F+ (80°C+)',
          secondaryPresets: [
            '174°F+ (80°C+)',
            '185°F (85°C)',
            '195°F (90°C)',
            '160°F (71°C Infrared)'
          ],
          isSupplementsOrPeptide: false
        }
      }
      return {
        archetype: 'thermal',
        primaryLabel: 'Immersion Duration (Minutes)',
        defaultUnit: 'mins',
        allowedUnits: ['mins', 'minutes', 'secs', 'seconds'],
        secondaryLabel: 'Target Water Temperature',
        secondaryPlaceholder: 'e.g. 50°F–55°F (10°C–13°C)',
        secondaryPresets: [
          '50°F–55°F (10°C–13°C)',
          '45°F–50°F (7°C–10°C)',
          '38°F–42°F (3°C–5°C)',
          'Søberg Natural Warm-Up'
        ],
        isSupplementsOrPeptide: false
      }
    }

    case 'cardio':
      return {
        archetype: 'cardio',
        primaryLabel: 'Workout Duration (Minutes)',
        defaultUnit: 'mins',
        allowedUnits: ['mins', 'minutes', 'hours', 'hrs', 'miles', 'km'],
        secondaryLabel: 'Target Intensity / HR Zone',
        secondaryPlaceholder: 'e.g. Zone 2 (60–70% HRmax)',
        secondaryPresets: [
          'Zone 2 (60–70% HRmax)',
          'Zone 5 (4x4 Intervals)',
          'RPE 7–8/10 (Vigorous)',
          'Zone 3–4 (Tempo / Threshold)'
        ],
        isSupplementsOrPeptide: false
      }

    case 'strength':
      return {
        archetype: 'strength',
        primaryLabel: 'Workout Duration (Minutes)',
        defaultUnit: 'mins',
        allowedUnits: ['mins', 'minutes', 'sets', 'reps', 'circuits'],
        secondaryLabel: 'Target Rep Range / Split',
        secondaryPlaceholder: 'e.g. 6–12 Reps @ RPE 8–9',
        secondaryPresets: [
          '6–12 Reps @ RPE 8–9',
          'Compound 5x5 Heavy',
          'Push / Pull / Legs Split',
          'Calisthenics Bodyweight'
        ],
        isSupplementsOrPeptide: false
      }

    case 'breathwork':
      return {
        archetype: 'breathwork',
        primaryLabel: 'Session Duration (Minutes)',
        defaultUnit: 'mins',
        allowedUnits: ['mins', 'minutes', 'cycles', 'rounds'],
        secondaryLabel: 'Cadence & Breathing Technique',
        secondaryPlaceholder: 'e.g. Cyclic Sighing (2 in, 1 slow out)',
        secondaryPresets: [
          'Cyclic Sighing (Double Inhale)',
          'Box Breathing (4-4-4-4)',
          '4-7-8 Parasympathetic Cadence',
          'Wim Hof 3 Rounds'
        ],
        isSupplementsOrPeptide: false
      }

    case 'nsdr':
      return {
        archetype: 'nsdr',
        primaryLabel: 'Rest Duration (Minutes)',
        defaultUnit: 'mins',
        allowedUnits: ['mins', 'minutes'],
        secondaryLabel: 'Protocol Guidance',
        secondaryPlaceholder: 'e.g. Huberman NSDR (10 mins)',
        secondaryPresets: [
          'Huberman NSDR (10 mins)',
          'Yoga Nidra Deep Relaxation (20 mins)',
          'Full Body Scan (30 mins)'
        ],
        isSupplementsOrPeptide: false
      }

    case 'fasting':
      return {
        archetype: 'fasting',
        primaryLabel: 'Fasting Window (Hours)',
        defaultUnit: 'hours',
        allowedUnits: ['hours', 'hrs', 'days'],
        secondaryLabel: 'Fasting Protocol / Window',
        secondaryPlaceholder: 'e.g. 16:8 TRF (12:00 PM – 8:00 PM)',
        secondaryPresets: [
          '16:8 Time-Restricted Feeding',
          '18:6 Fasting Window',
          'OMAD (23:1)',
          'Early Time-Restricted (8 AM - 4 PM)'
        ],
        isSupplementsOrPeptide: false
      }

    case 'nutrition_macro':
      return {
        archetype: 'nutrition_macro',
        primaryLabel: 'Portion / Grams Target',
        defaultUnit: 'g',
        allowedUnits: ['g', 'grams', 'serving', 'servings', 'bowl', 'meals'],
        secondaryLabel: 'Timing & Macro Sequencing',
        secondaryPlaceholder: 'e.g. Post-Workout Window (within 60m)',
        secondaryPresets: [
          '40g Leucine Pulse',
          'Post-Workout (within 60m)',
          'Fiber First -> Protein -> Carbs',
          'Pre-Workout Fuel (>2h prior)'
        ],
        isSupplementsOrPeptide: false
      }

    case 'hydration':
      return {
        archetype: 'hydration',
        primaryLabel: 'Fluid Volume',
        defaultUnit: 'mL',
        allowedUnits: ['mL', 'oz', 'packets', 'caps', 'liters', 'L'],
        secondaryLabel: 'Electrolyte Formulation',
        secondaryPlaceholder: 'e.g. 1 LMNT Packet (1000mg Na, 200mg K, 60mg Mg)',
        secondaryPresets: [
          '1 LMNT Packet (1000mg Sodium)',
          '500mL Water + 1/4 tsp Pink Salt',
          'Fasted AM Hydration Anchor'
        ],
        isSupplementsOrPeptide: false
      }

    case 'blue_light_dimming':
      return {
        archetype: 'blue_light_dimming',
        primaryLabel: 'Curfew Window (Hours Before Bed)',
        defaultUnit: 'hours before bed',
        allowedUnits: ['hours before bed', 'hours prior to sleep', 'hrs', 'hours', 'mins'],
        secondaryLabel: 'Attenuation Method',
        secondaryPlaceholder: 'e.g. 100% Amber/Red Lenses + Low Amber Lighting',
        secondaryPresets: [
          '100% Amber/Red Lenses',
          'Digital Sunset (Zero Screens)',
          'Warm Amber Dimming (<10 Lux)',
          'Night Shift / f.lux Filter'
        ],
        isSupplementsOrPeptide: false
      }

    case 'caffeine_cutoff':
      return {
        archetype: 'caffeine_cutoff',
        primaryLabel: 'Buffer Window',
        defaultUnit: 'hours before bed',
        allowedUnits: ['hours before bed', 'mins after waking', 'hours', 'hrs', 'mins'],
        secondaryLabel: 'Circadian Buffer Mechanism',
        secondaryPlaceholder: 'e.g. 90-120m After Waking / 10h Prior to Sleep',
        secondaryPresets: [
          '90–120m After Waking (Adenosine Clearance)',
          '10 Hours Prior to Bedtime',
          '12 Hours Prior to Bedtime'
        ],
        isSupplementsOrPeptide: false
      }

    case 'sunlight':
      return {
        archetype: 'sunlight',
        primaryLabel: 'Outdoor Exposure (Minutes)',
        defaultUnit: 'mins',
        allowedUnits: ['mins', 'minutes'],
        secondaryLabel: 'Solar / Lux Intensity',
        secondaryPlaceholder: 'e.g. 10,000+ Lux (Direct Sun, No Sunglasses)',
        secondaryPresets: [
          '10,000+ Lux (Direct Morning Sun)',
          'Overcast Day (20–30 mins)',
          '10,000 Lux Circadian Light Box'
        ],
        isSupplementsOrPeptide: false
      }

    case 'red_light':
      return {
        archetype: 'red_light',
        primaryLabel: 'Treatment Time (Minutes)',
        defaultUnit: 'mins',
        allowedUnits: ['mins', 'minutes'],
        secondaryLabel: 'Distance & Irradiance',
        secondaryPlaceholder: 'e.g. 6–12 inches @ 50 mW/cm² (660nm + 850nm)',
        secondaryPresets: [
          '6–12 inches @ 50 mW/cm²',
          '660nm Red + 850nm NIR Matrix',
          'Target Unclothed Exposure'
        ],
        isSupplementsOrPeptide: false
      }

    case 'skincare':
      return {
        archetype: 'skincare',
        primaryLabel: 'Application Amount',
        defaultUnit: 'pumps',
        allowedUnits: ['pumps', 'application', 'drops', 'pea-sized', 'mL', 'g'],
        secondaryLabel: 'Application Routine & Protection',
        secondaryPlaceholder: 'e.g. Pea-sized amount to face & neck',
        secondaryPresets: [
          'Pea-sized amount to face & neck',
          'Post-Cleanser / Pre-Moisturizer',
          'SPF 50+ Broad Spectrum AM',
          'Evening Clean Skin'
        ],
        isSupplementsOrPeptide: false
      }

    case 'peptide':
      return {
        archetype: 'peptide',
        primaryLabel: 'Target Dose',
        defaultUnit: 'mcg',
        allowedUnits: ['mcg', 'mg', 'IU', 'units'],
        secondaryLabel: 'Injection Route & Timing',
        secondaryPlaceholder: 'e.g. SubQ Abdominal (Fasted AM)',
        secondaryPresets: [
          'SubQ Abdominal (Fasted AM)',
          'SubQ Before Bed (Growth Hormone Peak)',
          'SubQ Post-Workout'
        ],
        isSupplementsOrPeptide: true
      }

    case 'phlebotomy':
      return {
        archetype: 'phlebotomy',
        primaryLabel: 'Donation Volume (mL)',
        defaultUnit: 'mL',
        allowedUnits: ['mL', 'pints', 'units'],
        secondaryLabel: 'Biomarker Target',
        secondaryPlaceholder: 'e.g. Target Serum Ferritin 50–70 ng/mL',
        secondaryPresets: [
          '500 mL (1 Whole Blood Pint)',
          'Target Serum Ferritin 50–70 ng/mL',
          'Therapeutic Phlebotomy'
        ],
        isSupplementsOrPeptide: false
      }

    case 'cgm':
      return {
        archetype: 'cgm',
        primaryLabel: 'Target Glucose Spike Ceiling',
        defaultUnit: 'mg/dL',
        allowedUnits: ['mg/dL', 'mmol/L', 'days'],
        secondaryLabel: 'Target Glycemic Range',
        secondaryPlaceholder: 'e.g. Postprandial <140 mg/dL',
        secondaryPresets: [
          'Postprandial Spike <140 mg/dL',
          'Fasting Baseline 70–90 mg/dL',
          'Time in Tight Range >90%'
        ],
        isSupplementsOrPeptide: false
      }

    case 'diagnostic':
      return {
        archetype: 'diagnostic',
        primaryLabel: 'Testing Frequency',
        defaultUnit: 'sessions',
        allowedUnits: ['sessions', 'scans', 'tests', 'panels', 'quarterly', 'annually'],
        secondaryLabel: 'Monitored Biomarkers & Scope',
        secondaryPlaceholder: 'e.g. ApoB, hs-CRP, Fasting Insulin Panel',
        secondaryPresets: [
          'ApoB, hs-CRP & Lipid NMR Profile',
          'DEXA Visceral Fat & BMD Scan',
          'Coronary Calcium (CAC) CT Scan',
          'DunedinPACE Epigenetic Biological Clock'
        ],
        isSupplementsOrPeptide: false
      }

    case 'supplement':
      return {
        archetype: 'supplement',
        primaryLabel: 'Target Dose',
        defaultUnit: 'mg',
        allowedUnits: ['mg', 'mcg', 'IU', 'g', 'caps', 'tabs', 'drops', 'tbsp', 'tsp', 'scoop', 'pills', 'dropperful'],
        secondaryLabel: 'Synergy / Admin Vehicle',
        secondaryPlaceholder: 'e.g. with 1 tbsp EVOO / Fat Meal',
        secondaryPresets: [
          'With Fat Meal (1 tbsp EVOO)',
          'Fasted AM (Empty Stomach)',
          'With 8oz Water',
          'With Carbohydrate Meal'
        ],
        isSupplementsOrPeptide: true
      }

    case 'sport':
      return {
        archetype: 'sport',
        primaryLabel: 'Session Duration (Minutes)',
        defaultUnit: 'mins',
        allowedUnits: ['mins', 'minutes', 'hours', 'games', 'matches'],
        secondaryLabel: 'Activity Context',
        secondaryPlaceholder: 'e.g. Skill Practice / Match Play',
        secondaryPresets: ['Match Play', 'Drills & Footwork', 'Recreational Play'],
        isSupplementsOrPeptide: false
      }

    case 'general':
    default:
      return {
        archetype: 'general',
        primaryLabel: 'Daily Practice',
        defaultUnit: 'session',
        allowedUnits: ['session', 'mins', 'times', 'minutes'],
        secondaryLabel: 'Execution Context / Anchor',
        secondaryPlaceholder: 'e.g. Immediately Upon Waking',
        secondaryPresets: [
          'Upon Waking',
          'Before Bedtime',
          'Habit Stacking (Post-Brush)',
          'Mid-Day Break'
        ],
        isSupplementsOrPeptide: false
      }
  }
}

/**
 * Strips non-dosage parameters such as temperatures, lux, wavelength, percentages,
 * and clock times so they are never misinterpreted as primary numeric dosages.
 */
export function cleanTextForNumericDose(text: string): { cleanedText: string; extractedTemperature?: string } {
  if (!text) return { cleanedText: '' }

  let extractedTemperature: string | undefined = undefined

  // 1. Extract temperature if present in the text
  const tempMatch = text.match(/\b\d+(?:\.\d+)?\s*(?:°|º|deg|degrees)?\s*[FC]\b(?:\s*[-–—/]\s*\d+(?:\.\d+)?\s*(?:°|º|deg|degrees)?\s*[FC]\b)?(?:\s*\([0-9.]+\s*(?:°|º|deg|degrees)?\s*[FC]\))?/i)
  if (tempMatch) {
    extractedTemperature = tempMatch[0].trim()
  }

  let cleaned = text
    // Strip ranges like 65°F–68°F, 65–68°F, 18.3–20°C
    .replace(/\b\d+(?:\.\d+)?\s*(?:°|º|deg|degrees)?\s*[FC]?\s*[-–—]\s*\d+(?:\.\d+)?\s*(?:°|º|deg|degrees)?\s*[FC]\b/gi, '')
    // Strip dual-unit parentheticals like 65°F (18.3°C) or (18.3°C)
    .replace(/\(?\d+(?:\.\d+)?\s*(?:°|º|deg|degrees)?\s*[FC]?\s*\/\s*\d+(?:\.\d+)?\s*(?:°|º|deg|degrees)?\s*[FC]?\)?/gi, '')
    .replace(/\(?\d+(?:\.\d+)?\s*(?:°|º|deg|degrees)?\s*[FC]\s*\([0-9.]+\s*(?:°|º|deg|degrees)?\s*[FC]\)\)?/gi, '')
    .replace(/\([0-9.]+\s*(?:°|º|deg|degrees)?\s*[FC]\)/gi, '')
    // Strip standalone temperatures like 174°F+, 65°F, 18°C, 65 degrees, 65°
    .replace(/\d+(?:\.\d+)?\s*(?:°|º|deg|degrees)\s*[FC]?\+?/gi, '')
    .replace(/\b\d+(?:\.\d+)?\s*[FC]\b\+?/gi, '')
    // Strip clock times like 8:30 PM, 6:00 AM, 21:00
    .replace(/\b\d{1,2}:\d{2}\s*(?:[ap]m)?\b/gi, '')
    // Strip percentages like 100%
    .replace(/\d+(?:\.\d+)?\s*%/g, '')
    // Strip lux / illuminance
    .replace(/[<>]?\s*\d+(?:,\d+)?\s*(?:lux|lx)\b/gi, '')
    // Strip wavelength nm
    .replace(/\d+\s*(?:nm|nanometer|nanometre)\b/gi, '')
    // Strip secondary heart rate / blood pressure / lactate targets
    .replace(/\b\d+\s*bpm\b/gi, '')
    .replace(/\b\d+\/\d+\s*mmhg\b/gi, '')
    .replace(/\b\d+(?:\.\d+)?\s*mmol(?:\/L)?\b/gi, '')
    // Strip timing lead times & offsets like (30-60 mins pre-bed), (30-60m before bed), 30 mins pre-bed, 3 hrs prior to sleep
    .replace(/\(?\d+(?:[-–—]\d+)?\s*(?:mins?|minutes?|m|hours?|hrs?|h)\s*(?:pre-bed|before bed|before sleep|prior to bed|prior to sleep|post-workout|after waking)\)?/gi, '')
    .replace(/\(?within \d+(?:[-–—]\d+)?\s*(?:mins?|minutes?|hours?|hrs?)\s*(?:of waking|post-waking|prior to sleep)\)?/gi, '')

  return { cleanedText: cleaned, extractedTemperature }
}

export interface ParsedArchetypeDoseResult {
  unit: string
  primaryValue: number
  starterValue: number
  targetValue: number
  blueprintValue: number
  minLit: number
  maxLit: number
  extractedSecondaryParam?: string
}

/**
 * Parses dosage text with strict word boundaries and validates that the resolved unit
 * is medically and contextually permitted by the modality's archetype.
 */
export function parseArchetypeDose(
  modality: Modality | any,
  rawText: string,
  isPeptideOrHighRisk: boolean = false
): ParsedArchetypeDoseResult {
  const config = getArchetypeDoseConfig(modality)
  const { cleanedText, extractedTemperature } = cleanTextForNumericDose(rawText || '')

  // Extract remaining numbers from cleaned text
  const numbers = (cleanedText.match(/\d+(?:\.\d+)?/g) || []).map(n => parseFloat(n))

  // Strict unit detection using word boundaries from cleaned text (avoids timing offsets like 'mins pre-bed')
  let detectedUnit = config.defaultUnit
  const lower = (cleanedText || rawText || '').toLowerCase()

  if (/\b(?:mcg|micrograms?)\b/i.test(lower)) detectedUnit = 'mcg'
  else if (/\b(?:iu|international units?)\b/i.test(lower)) detectedUnit = 'IU'
  else if (/\b(?:mg|milligrams?)\b/i.test(lower)) detectedUnit = 'mg'
  else if (/\b(?:ml|milliliters?|millilitres?)\b/i.test(lower)) detectedUnit = 'mL'
  else if (/\b(?:liters?|litres?)\b/i.test(lower)) detectedUnit = 'L'
  else if (/\b(?:tbsp|tablespoons?)\b/i.test(lower)) detectedUnit = 'tbsp'
  else if (/\b(?:tsp|teaspoons?)\b/i.test(lower)) detectedUnit = 'tsp'
  else if (/\b(?:drops?)\b/i.test(lower)) detectedUnit = 'drops'
  else if (/\b(?:pumps?)\b/i.test(lower)) detectedUnit = 'pumps'
  else if (/\b(?:capsules?|caps?)\b/i.test(lower)) detectedUnit = 'caps'
  else if (/\b(?:tablets?|tabs?)\b/i.test(lower)) detectedUnit = 'tabs'
  else if (/\b(?:sprays?)\b/i.test(lower)) detectedUnit = 'sprays'
  else if (/\b(?:bowls?)\b/i.test(lower)) detectedUnit = 'bowl'
  else if (/\b(?:servings?)\b/i.test(lower)) detectedUnit = 'servings'
  else if (/\b(?:meals?)\b/i.test(lower)) detectedUnit = 'meals'
  else if (/\b(?:cups?)\b/i.test(lower)) detectedUnit = 'cups'
  else if (/\b(?:seconds?|secs?)\b/i.test(lower)) detectedUnit = 'seconds'
  else if (/\b(?:hours?|hrs?)\b/i.test(lower)) detectedUnit = 'hours'
  else if (/\b(?:mins?|minutes?)\b/i.test(lower)) detectedUnit = 'mins'
  else if (/\b(?:sets?)\b/i.test(lower)) detectedUnit = 'sets'
  else if (/\b(?:reps?)\b/i.test(lower)) detectedUnit = 'reps'
  else if (/\b(?:packets?)\b/i.test(lower)) detectedUnit = 'packets'
  else if (/\b(?:pints?)\b/i.test(lower)) detectedUnit = 'pints'
  else if (/\b(?:sessions?|cycles?|rounds?)\b/i.test(lower)) detectedUnit = 'sessions'
  else if (/\bg\b/i.test(lower) && !/\bmg\b/i.test(lower)) detectedUnit = 'g'

  // ARCHETYPE SAFETY GUARD:
  // If the detected unit is NOT in the allowed units for this archetype, force the archetype's default!
  // This completely eliminates "sets" on sleep, "mg" on breathwork, "drops" on thermal, etc.
  if (!config.allowedUnits.includes(detectedUnit)) {
    detectedUnit = config.defaultUnit
  }

  // Derive target, starter, and bounds
  let targetVal = 1
  let starterVal = 1
  let blueprintVal = 1
  let minLit = 1
  let maxLit = 1

  if (numbers.length >= 2) {
    minLit = Math.min(numbers[0], numbers[1])
    maxLit = Math.max(numbers[0], numbers[1])
    targetVal = isPeptideOrHighRisk ? minLit : Math.round(((minLit + maxLit) / 2) * 10) / 10
    starterVal = minLit
    blueprintVal = maxLit
  } else if (numbers.length === 1) {
    targetVal = numbers[0]
    starterVal = isPeptideOrHighRisk ? targetVal : (Math.round(targetVal * 0.5 * 10) / 10 || 1)
    blueprintVal = Math.round(targetVal * 1.5 * 10) / 10 || targetVal
    minLit = starterVal > 0 ? starterVal : 1
    maxLit = blueprintVal
  } else {
    // Archetype-informed sensible default targets when no numbers exist in text
    if (config.archetype === 'sleep') {
      targetVal = 8.5
      starterVal = 8
      blueprintVal = 8.5
      minLit = 7.5
      maxLit = 9
    } else if (config.archetype === 'thermal') {
      targetVal = 20
      starterVal = 10
      blueprintVal = 20
      minLit = 10
      maxLit = 30
    } else if (config.archetype === 'breathwork' || config.archetype === 'nsdr') {
      targetVal = 10
      starterVal = 5
      blueprintVal = 15
      minLit = 5
      maxLit = 20
    } else if (config.archetype === 'sunlight') {
      targetVal = 20
      starterVal = 10
      blueprintVal = 30
      minLit = 10
      maxLit = 30
    } else if (config.archetype === 'cardio') {
      targetVal = 45
      starterVal = 30
      blueprintVal = 60
      minLit = 20
      maxLit = 90
    } else if (config.archetype === 'fasting') {
      targetVal = 16
      starterVal = 14
      blueprintVal = 18
      minLit = 12
      maxLit = 20
    } else if (config.archetype === 'blue_light_dimming') {
      targetVal = 2
      starterVal = 1
      blueprintVal = 2
      minLit = 1
      maxLit = 3
    } else {
      targetVal = 1
      starterVal = 1
      blueprintVal = 1
      minLit = 1
      maxLit = 2
    }
  }

  return {
    unit: detectedUnit,
    primaryValue: targetVal,
    starterValue: starterVal,
    targetValue: targetVal,
    blueprintValue: blueprintVal,
    minLit,
    maxLit,
    extractedSecondaryParam: extractedTemperature
  }
}
