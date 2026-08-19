import { Modality, UserProfile } from '../types'

export interface ProtocolDosePreset {
  protocolId?: string
  protocolName: string
  doseAmount: number
  doseUnit: string
  doseText: string
  colorBadge: 'purple' | 'amber' | 'cyan' | 'pink' | 'indigo' | 'blue' | 'emerald'
  notes?: string
  sourceUrl?: string
  fullProtocolInstructions?: string
}

export interface ResolvedDoseResult {
  recommendedDoseText: string
  recommendedValue: number
  unit: string
  source: 'sensitivity_starter' | 'protocol_preset' | 'personalized_target' | 'standard'
  sourceLabel: string
  badgeColor: 'emerald' | 'blue' | 'purple' | 'amber' | 'cyan' | 'pink' | 'indigo'
  starterDose?: { value: number; unit: string; notes?: string }
  personalizedTargetDose?: { value: number; unit: string; notes?: string }
  blueprintDose?: { value: number; unit: string; notes?: string }
  protocolDose?: { value: number; unit: string; notes?: string }
  activeProtocolPreset?: ProtocolDosePreset
  allProtocolPresets: ProtocolDosePreset[]
  literatureRange?: { min: number; max: number; unit: string; outlier_upper?: number }
  rationale: string
}

export interface ProtocolDoseContext {
  protocolId?: string
  protocolName?: string
  doseAmount?: number
  doseUnit?: string
  doseText?: string
  colorBadge?: 'purple' | 'amber' | 'cyan' | 'pink' | 'indigo' | 'blue' | 'emerald'
  colorHex?: string
  sourceUrl?: string
  fullProtocolInstructions?: string
}

// Official Bryan Johnson Blueprint 2026 Supplement & Intervention Stack IDs
const BRYAN_JOHNSON_2026_IDS = new Set([
  'sulforaphane', 'vitamin-c', 'ginger-root', 'aged-garlic-extract', 'vitamin-k1', 'vitamin-k2-mk4',
  'zinc', 'iodine', 'lycopene', 'heme-iron', 'cocoa-flavanols', 'vitamin-e', 'glucosamine-sulfate',
  'l-lysine', 'curcumin', 'genistein', 'extra-virgin-olive-oil', 'ndga', 'low-dose-aspirin',
  'nmn', 'nr', 'metformin_daily', 'rapamycin_weekly', 'fisetin', 'acarbose', 'ashwagandha_ksm_66',
  'ashwagandha', 'creatine_monohydrate', 'coq10', 'taurine', 'spermidine_supplement', 'alpha_gpc',
  'l_theanine', 'magnesium_threonate', 'magnesium_l_threonate', 'collagen_peptides',
  'hyaluronic_acid_oral', 'urolithin_a', 'alpha_lipoic_acid', 'vitamin_d3', 'vitamin_k2_mk7',
  'epa_dha_omega3', 'blueprint_super_veggie', 'blueprint_nut_pudding', 'blueprint_60m_exercise_routine',
  'blueprint_sleep_architecture'
])

export function getProtocolColorBadge(protoName?: string, colorHex?: string): 'purple' | 'amber' | 'cyan' | 'pink' | 'indigo' | 'blue' | 'emerald' {
  if (colorHex) {
    const hex = colorHex.toLowerCase()
    if (hex.includes('f59e0b') || hex.includes('ea580c') || hex.includes('d97706') || hex.includes('ff9800') || hex.includes('orange')) return 'amber'
    if (hex.includes('a855f7') || hex.includes('9333ea') || hex.includes('purple')) return 'purple'
    if (hex.includes('3b82f6') || hex.includes('2563eb') || hex.includes('blue')) return 'blue'
    if (hex.includes('10b981') || hex.includes('059669') || hex.includes('emerald') || hex.includes('green')) return 'emerald'
    if (hex.includes('ec4899') || hex.includes('db2777') || hex.includes('pink') || hex.includes('rose')) return 'pink'
    if (hex.includes('06b6d4') || hex.includes('0891b2') || hex.includes('cyan') || hex.includes('teal')) return 'cyan'
  }

  if (protoName) {
    const name = protoName.toLowerCase()
    if (name.includes('valter longo') || name.includes('longo') || name.includes('fasting mimicking') || name.includes('fmd')) return 'amber'
    if (name.includes('blueprint') || name.includes('bryan johnson')) return 'purple'
    if (name.includes('attia') || name.includes('peter attia')) return 'blue'
    if (name.includes('rhonda') || name.includes('patrick')) return 'pink'
    if (name.includes('huberman')) return 'cyan'
    if (name.includes('brecka') || name.includes('gary brecka')) return 'emerald'
    if (name.includes('wim hof')) return 'cyan'
    if (name.includes('dayspring')) return 'indigo'
  }

  return 'purple'
}

export function getProtocolSourceDetails(protoName?: string, modality?: Modality): { sourceUrl: string; fullProtocolInstructions: string } {
  const name = (protoName || '').toLowerCase()
  const modName = modality?.name || modality?.id || 'Modality'
  const modDose = modality?.dose_or_exposure || 'Standard Dose'
  const profile = modality?.relationships?.dosage_profile
  const modNotes = profile?.recommended_notes || profile?.blueprint_notes || modality?.brief_description || ''

  if (name.includes('huberman')) {
    let specificText = ''
    const lowerMod = modName.toLowerCase() + ' ' + (modality?.id || '').toLowerCase()

    if (lowerMod.includes('cold') || lowerMod.includes('plunge') || lowerMod.includes('immersion')) {
      specificText = 'Cold Water Immersion (50°F–55°F / 10°C–13°C) for 2–3 mins. Huberman protocol targets 11 minutes total weekly exposure to elevate catecholamines (250% dopamine surge for 3+ hrs) and activate brown adipose thermogenesis. Let yourself warm up naturally (Søberg Principle).'
    } else if (lowerMod.includes('sunlight') || lowerMod.includes('light')) {
      specificText = '10–30 minutes of outdoor morning sunlight within 60 minutes of waking (no sunglasses). Direct retinal ganglion cell activation triggers cortisol peak and sets circadian clock for nighttime melatonin release.'
    } else if (lowerMod.includes('delay') || lowerMod.includes('caffeine')) {
      specificText = 'Delay caffeine intake by 90–120 minutes post-waking. Prevents afternoon crash by allowing natural adenosine clearance prior to adenosine receptor blockade.'
    } else if (lowerMod.includes('sighing') || lowerMod.includes('breathwork')) {
      specificText = 'Cyclic Sighing (5 mins): Double inhalation through nose followed by slow, unforced exhalation through mouth. Rapidly engages parasympathetic vagal tone to lower heart rate and respiratory rate.'
    } else {
      specificText = `${modName}: Prescribed at ${modDose}. ${modNotes} Integrated into Dr. Andrew Huberman's daily neurobiology protocol.`
    }
    return {
      sourceUrl: 'https://www.hubermanlab.com/topics/protocols',
      fullProtocolInstructions: specificText
    }
  }

  if (name.includes('valter longo') || name.includes('longo') || name.includes('fasting mimicking') || name.includes('fmd')) {
    let specificText = `${modName}: Prescribed dose of ${modDose}. ${modNotes} Part of Dr. Valter Longo's longevity & senolytic protocol designed to activate cellular autophagy during low-calorie phase and trigger stem-cell-based tissue regeneration upon refeed.`
    return {
      sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/24905167/',
      fullProtocolInstructions: specificText
    }
  }

  if (name.includes('blueprint') || name.includes('bryan johnson')) {
    let specificText = `${modName}: Prescribed dose of ${modDose}. ${modNotes} Bryan Johnson Project Blueprint 2026 protocol item, taken on strict daily timing schedule with biomarker tracking.`
    return {
      sourceUrl: 'https://www.nad.com/news/aging-guru-bryan-johnsons-supplement-list-for-2026',
      fullProtocolInstructions: specificText
    }
  }

  if (name.includes('attia') || name.includes('peter attia')) {
    let specificText = `${modName}: Target dose of ${modDose}. ${modNotes} Dr. Peter Attia Medicine 3.0 protocol targeting healthspan extension, cardiovascular risk reduction, and metabolic resilience.`
    return {
      sourceUrl: 'https://peterattiamd.com/category/interventions/',
      fullProtocolInstructions: specificText
    }
  }

  if (name.includes('ppl') || name.includes('push / pull / legs') || name.includes('hypertrophy split')) {
    let specificText = `${modName}: Prescribed dose of ${modDose}. ${modNotes} Science-based Push/Pull/Legs hypertrophy split focusing on mechanical tension (6-12 reps @ RPE 8-9) with strict mTOR recovery spacing (>4h from cold exposure).`
    return {
      sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/30153194/',
      fullProtocolInstructions: specificText
    }
  }

  if (name.includes('half marathon') || name.includes('marathon')) {
    let specificText = `${modName}: Prescribed volume of ${modDose}. ${modNotes} 12-Week Adaptive Half Marathon Training Protocol incorporating Zone 2 base runs, lactate threshold intervals, runner prehab stability, and progressive long runs.`
    return {
      sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/20861519/',
      fullProtocolInstructions: specificText
    }
  }

  if (name.includes('rhonda') || name.includes('patrick')) {
    let specificText = `${modName}: Target dose of ${modDose}. ${modNotes} Dr. Rhonda Patrick, PhD protocol focusing on heat shock proteins (HSP70), Nrf2 activation, and phospholipid membrane optimization.`
    return {
      sourceUrl: 'https://www.foundmyfitness.com/',
      fullProtocolInstructions: specificText
    }
  }

  if (name.includes('wim hof')) {
    let specificText = `${modName}: Prescribed exposure of ${modDose}. ${modNotes} Wim Hof Method combining controlled hyperventilation breathwork with cold stress to modulate autonomic nervous system & inflammatory cytokines.`
    return {
      sourceUrl: 'https://www.wimhofmethod.com/',
      fullProtocolInstructions: specificText
    }
  }

  if (name.includes('dayspring')) {
    let specificText = `${modName}: Prescribed at ${modDose}. ${modNotes} Dr. Thomas Dayspring lipidology & endothelial protocol.`
    return {
      sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/33946288/',
      fullProtocolInstructions: specificText
    }
  }

  // Fallback to modality's efficacy stats PubMed URL if available
  const firstPubMedUrl = modality?.efficacy_stats?.find((e: any) => e.source_url)?.source_url || 'https://pubmed.ncbi.nlm.nih.gov/'
  return {
    sourceUrl: firstPubMedUrl,
    fullProtocolInstructions: `${modName}: Prescribed at ${modDose}. ${modNotes}`
  }
}

function parseDoseFromText(text: string, isPeptideOrHighRisk: boolean = false) {
  if (!text) return null
  const numbers = (text.match(/\d+([.,]\d+)?/g) || []).map(n => parseFloat(n.replace(',', '.')))
  if (numbers.length === 0) return null

  let unit = 'mg'
  if (/mcg/i.test(text)) unit = 'mcg'
  else if (/iu/i.test(text)) unit = 'IU'
  else if (/ml/i.test(text)) unit = 'mL'
  else if (/tbsp|tablespoon/i.test(text)) unit = 'tbsp'
  else if (/\bg\b/i.test(text) && !/mg/i.test(text)) unit = 'g'
  else if (/min|minute/i.test(text)) unit = 'mins'
  else if (/hr|hour/i.test(text)) unit = 'hours'
  else if (/session|cycle|round/i.test(text)) unit = 'sessions'

  if (numbers.length >= 2) {
    const min = Math.min(numbers[0], numbers[1])
    const max = Math.max(numbers[0], numbers[1])
    // For peptides, pharmaceuticals, and high-risk modalities, ALWAYS use the conservative lower bound as the target
    const target = isPeptideOrHighRisk ? min : Math.round((min + max) / 2)
    return {
      unit,
      starter: { value: min, unit, notes: `Conservative starter dose (${min} ${unit}).` },
      target: { value: target, unit, notes: isPeptideOrHighRisk ? `Conservative clinical target dose (${target} ${unit}) for safe tissue recovery.` : `Recommended target average (${target} ${unit}).` },
      blueprint: { value: max, unit, notes: `Upper bound from literature range (${max} ${unit}).` },
      litRange: { min, max, unit }
    }
  } else {
    const val = numbers[0]
    const min = isPeptideOrHighRisk ? val : (Math.round(val * 0.5) || 1)
    const max = Math.round(val * 1.5) || val
    return {
      unit,
      starter: { value: min, unit, notes: `Conservative starter dose (${min} ${unit}).` },
      target: { value: val, unit, notes: `Standard evidence dose (${val} ${unit}).` },
      blueprint: { value: max, unit, notes: `Standard protocol dose (${val} ${unit}).` },
      litRange: { min: min > 0 ? min : 1, max, unit }
    }
  }
}

export function resolveRecommendedDose(
  modality: Modality,
  userProfile?: UserProfile | null,
  protocolContext?: ProtocolDoseContext | ProtocolDoseContext[] | null
): ResolvedDoseResult {
  const catLower = (modality.category || '').toLowerCase()
  const nameLower = (modality.name || modality.display_name || '').toLowerCase()
  const typeLower = (modality.modality_type || (modality as any).logging_type || '').toLowerCase()

  const isPeptideOrHighRisk =
    catLower.includes('peptide') ||
    catLower.includes('hormone') ||
    catLower.includes('injectable') ||
    catLower.includes('pharmaceutical') ||
    catLower.includes('senolytic') ||
    catLower.includes('secretagogue') ||
    nameLower.includes('bpc') ||
    nameLower.includes('tb-500') ||
    nameLower.includes('tb500') ||
    nameLower.includes('mots-c') ||
    nameLower.includes('cjc') ||
    nameLower.includes('ipamorelin') ||
    nameLower.includes('epithalon') ||
    nameLower.includes('ghk-cu') ||
    nameLower.includes('semaglutide') ||
    nameLower.includes('tirzepatide') ||
    nameLower.includes('rapamycin') ||
    nameLower.includes('metformin') ||
    nameLower.includes('fisetin') ||
    nameLower.includes('retatrutide') ||
    nameLower.includes('kpv') ||
    nameLower.includes('thymosin') ||
    nameLower.includes('tesamorelin') ||
    nameLower.includes('sermorelin') ||
    nameLower.includes('aod-9604') ||
    nameLower.includes('subq')

  const profile = (modality.relationships?.dosage_profile || (modality as any).dosages) || null
  const parsedFallback = !profile ? parseDoseFromText(modality.dose_or_exposure || '', isPeptideOrHighRisk) : null
  const defaultText = modality.dose_or_exposure || 'Standard dose'

  // Extract array of active protocol contexts
  const activeProtocolsList: ProtocolDoseContext[] = Array.isArray(protocolContext)
    ? protocolContext
    : protocolContext
    ? [protocolContext]
    : []

  let unit = profile?.unit || parsedFallback?.unit || 'mg'

  // Safety unit override for physical, calisthenics, breathwork, thermal, sleep & diagnostic modalities
  const isExerciseOrPhysical = catLower.includes('fitness') || catLower.includes('physical') || catLower.includes('cardio') || catLower.includes('strength') || typeLower.includes('exercise') || typeLower.includes('physical') || nameLower.includes('handstand') || nameLower.includes('walk') || nameLower.includes('push-up') || nameLower.includes('sprint') || nameLower.includes('squat')
  const isBreathOrMind = catLower.includes('breath') || catLower.includes('mind') || typeLower.includes('breathwork') || typeLower.includes('meditation') || nameLower.includes('breathing') || nameLower.includes('sigh') || nameLower.includes('optic flow')
  const isThermal = catLower.includes('sauna') || catLower.includes('cold') || catLower.includes('thermal') || nameLower.includes('sauna') || nameLower.includes('plunge') || nameLower.includes('cold')
  const isSleepOrFasting = catLower.includes('sleep') || catLower.includes('fasting') || typeLower.includes('fasting') || nameLower.includes('fasting') || nameLower.includes('sleep') || nameLower.includes('mouth tap') || nameLower.includes('caffeine')
  const isDiagnostic = catLower.includes('diagnostic') || catLower.includes('screening') || catLower.includes('tracking') || typeLower.includes('diagnostic_test') || nameLower.includes('mri') || nameLower.includes('dexa') || nameLower.includes('cac') || nameLower.includes('scan') || nameLower.includes('cpet')

  const isHoursBeforeBed = 
    nameLower.includes('blue light') ||
    nameLower.includes('glasses') ||
    nameLower.includes('screen cutoff') ||
    nameLower.includes('digital sunset') ||
    nameLower.includes('dim light') ||
    nameLower.includes('evening darkness') ||
    nameLower.includes('food cutoff') ||
    nameLower.includes('caffeine cutoff')

  if (isHoursBeforeBed) {
    unit = 'hours before bed'
  } else if (unit === 'mg' || !unit || unit === 'undefined' || unit === 'exposure') {
    if (nameLower.includes('handstand')) unit = 'seconds'
    else if (isExerciseOrPhysical || isBreathOrMind || isThermal) unit = 'mins'
    else if (isSleepOrFasting) unit = 'hours'
    else if (isDiagnostic) unit = 'sessions'
  }

  let starter = profile?.starter_dose ? { value: profile.starter_dose, unit, notes: profile.starter_notes } : parsedFallback?.starter
  let target = profile?.personalized_target_dose ? { value: profile.personalized_target_dose, unit, notes: profile.recommended_notes } : parsedFallback?.target
  let blueprint = profile?.blueprint_dose ? { value: profile.blueprint_dose, unit, notes: profile.blueprint_notes } : parsedFallback?.blueprint
  let litRange = profile?.literature_range ? { ...profile.literature_range, unit } : parsedFallback?.litRange

  if (isHoursBeforeBed) {
    if (!starter || starter.value === 0) starter = { value: 1, unit: 'hours before bed', notes: '1 hour prior to sleep lead time.' }
    if (!target || target.value === 0) target = { value: 2, unit: 'hours before bed', notes: '2 hours prior to sleep for natural melatonin secretion.' }
    if (!blueprint || blueprint.value === 0) blueprint = { value: 2, unit: 'hours before bed', notes: '2 hours prior to sleep.' }
    if (!litRange) litRange = { min: 1, max: 3, unit: 'hours before bed' }
  }

  // Build list of active protocol presets
  const allProtocolPresets: ProtocolDosePreset[] = activeProtocolsList.map((proto, idx) => {
    let val = proto.doseAmount || target?.value || (isHoursBeforeBed ? 2 : 1)
    let u = proto.doseUnit || unit
    let text = proto.doseText || `${val} ${u}`.trim()

    if (isHoursBeforeBed && (text.toLowerCase().includes('exposure') || !proto.doseAmount)) {
      val = 2
      u = 'hours before bed'
      text = '2 Hours Prior to Bedtime'
    }

    const color = proto.colorBadge || getProtocolColorBadge(proto.protocolName, proto.colorHex)
    const details = getProtocolSourceDetails(proto.protocolName, modality)
    return {
      protocolId: proto.protocolId,
      protocolName: proto.protocolName || `Protocol ${idx + 1}`,
      doseAmount: val,
      doseUnit: u,
      doseText: text,
      colorBadge: color,
      notes: details.fullProtocolInstructions,
      sourceUrl: proto.sourceUrl || details.sourceUrl,
      fullProtocolInstructions: details.fullProtocolInstructions
    }
  })

  // ONLY include Bryan Johnson Blueprint 2026 if this modality is ACTUALLY in Blueprint 2026!
  const isActuallyInBlueprint = BRYAN_JOHNSON_2026_IDS.has(modality.id) || Boolean((modality as any).is_blueprint_2026)
  if (isActuallyInBlueprint && profile?.blueprint_dose && !allProtocolPresets.some(p => p.protocolName.toLowerCase().includes('blueprint'))) {
    const details = getProtocolSourceDetails('Bryan Johnson 2026 Blueprint', modality)
    allProtocolPresets.push({
      protocolName: 'Bryan Johnson 2026 Blueprint',
      doseAmount: profile.blueprint_dose,
      doseUnit: unit,
      doseText: `${profile.blueprint_dose} ${unit}`,
      colorBadge: 'purple',
      notes: details.fullProtocolInstructions,
      sourceUrl: details.sourceUrl,
      fullProtocolInstructions: details.fullProtocolInstructions
    })
  }

  // 1. User Sensitivity Override (Takes priority if user profile specifies sensitivity)
  const isSensitive = Boolean(
    userProfile?.experimental_openness_0_99 !== undefined && userProfile.experimental_openness_0_99 < 30 ||
    (userProfile as any)?.sensitive_to_new_supplements === true ||
    (userProfile as any)?.supplement_sensitivity === true
  )

  if (isSensitive && starter) {
    return {
      recommendedDoseText: `${starter.value} ${unit}`,
      recommendedValue: starter.value,
      unit,
      source: 'sensitivity_starter',
      sourceLabel: 'Starter Dose (Sensitivity On)',
      badgeColor: 'emerald',
      starterDose: starter,
      personalizedTargetDose: target,
      blueprintDose: blueprint,
      allProtocolPresets,
      literatureRange: litRange,
      rationale: starter.notes || 'Recommended conservative starter dose because Supplement Sensitivity is enabled in your profile.'
    }
  }

  // 2. Specific Protocol Context Override (if pulled up under a specific active protocol)
  if (allProtocolPresets.length > 0) {
    const primaryProto = allProtocolPresets[0]
    
    // For peptides and high-risk modalities, ensure target never overshoots protocol prescription
    let safeTarget = target
    if (isPeptideOrHighRisk && primaryProto.doseAmount && target && target.value > primaryProto.doseAmount) {
      safeTarget = {
        ...target,
        value: primaryProto.doseAmount,
        notes: `Conservative target aligned with ${primaryProto.protocolName} (${primaryProto.doseAmount} ${primaryProto.doseUnit || unit}).`
      }
    }

    return {
      recommendedDoseText: primaryProto.doseText,
      recommendedValue: primaryProto.doseAmount,
      unit: primaryProto.doseUnit || unit,
      source: 'protocol_preset',
      sourceLabel: `${primaryProto.protocolName}`,
      badgeColor: primaryProto.colorBadge,
      starterDose: starter,
      personalizedTargetDose: safeTarget,
      blueprintDose: blueprint,
      protocolDose: { value: primaryProto.doseAmount, unit: primaryProto.doseUnit || unit },
      activeProtocolPreset: primaryProto,
      allProtocolPresets,
      literatureRange: litRange,
      rationale: `Prescribed by ${primaryProto.protocolName} protocol enrollment.`
    }
  }

  // 3. Personalized Target (Blue)
  if (target) {
    return {
      recommendedDoseText: `${target.value} ${unit}`,
      recommendedValue: target.value,
      unit,
      source: 'personalized_target',
      sourceLabel: 'Personalized Target',
      badgeColor: 'blue',
      starterDose: starter,
      personalizedTargetDose: target,
      blueprintDose: blueprint,
      allProtocolPresets,
      literatureRange: litRange,
      rationale: target.notes || 'Personalized target calculated for optimal biological benefit.'
    }
  }

  // 4. Default Fallback
  return {
    recommendedDoseText: defaultText,
    recommendedValue: (target as { value: number } | undefined)?.value || (starter as { value: number } | undefined)?.value || 1,
    unit,
    source: 'standard',
    sourceLabel: 'Standard Reference',
    badgeColor: 'blue',
    starterDose: starter,
    personalizedTargetDose: target,
    blueprintDose: blueprint,
    allProtocolPresets,
    literatureRange: litRange,
    rationale: 'Standard reference recommendation.'
  }
}
