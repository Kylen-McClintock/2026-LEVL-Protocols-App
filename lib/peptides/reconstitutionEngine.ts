import { PeptideVialConfig, InjectionSite, PeptideDoseLog, Modality, DailyProtocolTask } from '@/lib/types'

export interface ReconstitutionCalculation {
  vial_size_mg: number
  bac_water_ml: number
  target_dose_mcg: number
  concentration_mcg_per_ml: number
  concentration_mcg_per_unit: number // on U-100 syringe
  units_to_draw: number
  units_display_str: string // e.g. "10 Units (0.10 mL)"
  ml_to_draw: number
  total_doses_in_vial: number
  reconstitution_ratio_str: string // e.g. "5mg in 2.0 mL BAC (2,500 mcg/mL)"
  syringe_type: 'u100_1ml' | 'u100_0_5ml' | 'u100_0_3ml' | 'u40'
}

export interface InjectionSiteMetadata {
  id: InjectionSite
  label: string
  shortLabel: string
  region: 'Abdomen' | 'Thigh' | 'Deltoid' | 'Glute' | 'Target'
  subtext: string
  iconPosition: { x: number; y: number } // 0-100% coordinates on anatomical body map
}

export const INJECTION_SITES: InjectionSiteMetadata[] = [
  {
    id: 'abdomen_upper_left',
    label: 'Abdomen (Upper Left)',
    shortLabel: 'Abd Up-L',
    region: 'Abdomen',
    subtext: '2 inches left and above navel',
    iconPosition: { x: 42, y: 44 }
  },
  {
    id: 'abdomen_upper_right',
    label: 'Abdomen (Upper Right)',
    shortLabel: 'Abd Up-R',
    region: 'Abdomen',
    subtext: '2 inches right and above navel',
    iconPosition: { x: 58, y: 44 }
  },
  {
    id: 'abdomen_lower_left',
    label: 'Abdomen (Lower Left)',
    shortLabel: 'Abd Low-L',
    region: 'Abdomen',
    subtext: '2 inches left and below navel',
    iconPosition: { x: 42, y: 52 }
  },
  {
    id: 'abdomen_lower_right',
    label: 'Abdomen (Lower Right)',
    shortLabel: 'Abd Low-R',
    region: 'Abdomen',
    subtext: '2 inches right and below navel',
    iconPosition: { x: 58, y: 52 }
  },
  {
    id: 'outer_thigh_left',
    label: 'Outer Thigh (Left)',
    shortLabel: 'Thigh L',
    region: 'Thigh',
    subtext: 'Middle third of outer left thigh',
    iconPosition: { x: 38, y: 68 }
  },
  {
    id: 'outer_thigh_right',
    label: 'Outer Thigh (Right)',
    shortLabel: 'Thigh R',
    region: 'Thigh',
    subtext: 'Middle third of outer right thigh',
    iconPosition: { x: 62, y: 68 }
  },
  {
    id: 'deltoid_left',
    label: 'Deltoid (Left Shoulder)',
    shortLabel: 'Delt L',
    region: 'Deltoid',
    subtext: 'Lateral left shoulder head',
    iconPosition: { x: 26, y: 28 }
  },
  {
    id: 'deltoid_right',
    label: 'Deltoid (Right Shoulder)',
    shortLabel: 'Delt R',
    region: 'Deltoid',
    subtext: 'Lateral right shoulder head',
    iconPosition: { x: 74, y: 28 }
  },
  {
    id: 'glute_left',
    label: 'Glute (Upper Outer Left)',
    shortLabel: 'Glute L',
    region: 'Glute',
    subtext: 'Upper outer quadrant of left glute',
    iconPosition: { x: 35, y: 58 }
  },
  {
    id: 'glute_right',
    label: 'Glute (Upper Outer Right)',
    shortLabel: 'Glute R',
    region: 'Glute',
    subtext: 'Upper outer quadrant of right glute',
    iconPosition: { x: 65, y: 58 }
  },
  {
    id: 'localized_injury_site',
    label: 'Near Localized Injury Site',
    shortLabel: 'Injury Site',
    region: 'Target',
    subtext: 'SubQ tissue adjacent to tendon / joint',
    iconPosition: { x: 50, y: 35 }
  }
]

/**
 * Calculates exact syringe units, concentration, and practical administration quantity.
 * Standard Insulin Syringes:
 * - U-100 syringe: 100 units = 1.0 mL (1 unit = 0.01 mL = 10 µL)
 * - U-40 syringe: 40 units = 1.0 mL (1 unit = 0.025 mL = 25 µL)
 */
export function calculateReconstitution(
  vialSizeMg: number,
  bacWaterMl: number,
  targetDoseMcg: number,
  syringeType: 'u100_1ml' | 'u100_0_5ml' | 'u100_0_3ml' | 'u40' = 'u100_1ml'
): ReconstitutionCalculation {
  const safeVialMg = Math.max(0.1, Number(vialSizeMg) || 5)
  const safeBacMl = Math.max(0.1, Number(bacWaterMl) || 2)
  const safeDoseMcg = Math.max(1, Number(targetDoseMcg) || 250)

  // Total vial in micrograms (1 mg = 1,000 mcg)
  const totalVialMcg = safeVialMg * 1000

  // Concentration in mcg / mL
  const concentrationMcgPerMl = totalVialMcg / safeBacMl

  // Units scale: U-100 has 100 units per mL. U-40 has 40 units per mL.
  const unitsPerMl = syringeType === 'u40' ? 40 : 100
  const concentrationMcgPerUnit = concentrationMcgPerMl / unitsPerMl

  // Exact units needed
  const exactUnits = safeDoseMcg / concentrationMcgPerUnit
  // Round to nearest 0.5 unit for practical syringe tick marking
  const roundedUnits = Math.round(exactUnits * 2) / 2

  const mlToDraw = Number((safeDoseMcg / concentrationMcgPerMl).toFixed(3))
  const totalDoses = Math.floor(totalVialMcg / safeDoseMcg)

  const unitsDisplayStr = `${roundedUnits} ${roundedUnits === 1 ? 'Unit' : 'Units'} (${mlToDraw.toFixed(2)} mL)`
  const ratioStr = `${safeVialMg}mg in ${safeBacMl}mL BAC (${Math.round(concentrationMcgPerMl).toLocaleString()} mcg/mL)`

  return {
    vial_size_mg: safeVialMg,
    bac_water_ml: safeBacMl,
    target_dose_mcg: safeDoseMcg,
    concentration_mcg_per_ml: Math.round(concentrationMcgPerMl),
    concentration_mcg_per_unit: Number(concentrationMcgPerUnit.toFixed(2)),
    units_to_draw: roundedUnits,
    units_display_str: unitsDisplayStr,
    ml_to_draw: mlToDraw,
    total_doses_in_vial: totalDoses,
    reconstitution_ratio_str: ratioStr,
    syringe_type: syringeType
  }
}

/**
 * Determines the recommended next injection site to ensure healthy tissue rotation.
 */
export function getRecommendedNextInjectionSite(
  recentHistory: { injection_site?: InjectionSite; timestamp?: string }[]
): { recommendedSite: InjectionSiteMetadata; lastUsedSite: InjectionSiteMetadata | null; siteUsageCounts: Record<InjectionSite, number> } {
  const counts: Record<InjectionSite, number> = {
    abdomen_upper_left: 0,
    abdomen_upper_right: 0,
    abdomen_lower_left: 0,
    abdomen_lower_right: 0,
    outer_thigh_left: 0,
    outer_thigh_right: 0,
    deltoid_left: 0,
    deltoid_right: 0,
    glute_left: 0,
    glute_right: 0,
    localized_injury_site: 0
  }

  let lastUsedSiteId: InjectionSite | null = null
  if (recentHistory && recentHistory.length > 0) {
    const validLogs = recentHistory.filter(h => h.injection_site)
    if (validLogs.length > 0) {
      lastUsedSiteId = validLogs[0].injection_site || null
      validLogs.forEach(h => {
        if (h.injection_site && counts[h.injection_site] !== undefined) {
          counts[h.injection_site]++
        }
      })
    }
  }

  const lastUsedSite = lastUsedSiteId ? INJECTION_SITES.find(s => s.id === lastUsedSiteId) || null : null

  // Rotation sequence prioritizing bilateral alternating quadrants
  const rotationOrder: InjectionSite[] = [
    'abdomen_lower_right',
    'abdomen_lower_left',
    'abdomen_upper_right',
    'abdomen_upper_left',
    'outer_thigh_right',
    'outer_thigh_left',
    'deltoid_right',
    'deltoid_left'
  ]

  let nextSiteId = rotationOrder[0]
  if (lastUsedSiteId) {
    const idx = rotationOrder.indexOf(lastUsedSiteId)
    if (idx >= 0) {
      nextSiteId = rotationOrder[(idx + 1) % rotationOrder.length]
    } else {
      // Find least used site
      let minCount = Infinity
      rotationOrder.forEach(siteId => {
        if (counts[siteId] < minCount) {
          minCount = counts[siteId]
          nextSiteId = siteId
        }
      })
    }
  }

  const recommendedSite = INJECTION_SITES.find(s => s.id === nextSiteId) || INJECTION_SITES[0]

  return {
    recommendedSite,
    lastUsedSite,
    siteUsageCounts: counts
  }
}

/**
 * Calculates current active vial health, remaining doses, and shelf-life expiration.
 */
export function getVialInventoryStatus(
  vialConfig: PeptideVialConfig,
  dosesLoggedCount: number = 0
): {
  remainingDoses: number
  totalDoses: number
  percentRemaining: number
  remainingVolumeMl: number
  daysSinceReconstituted: number | null
  daysUntilExpired: number | null
  isExpired: boolean
  statusLabel: string
  statusColor: 'green' | 'amber' | 'red'
} {
  const calc = calculateReconstitution(
    vialConfig.vial_size_mg,
    vialConfig.bac_water_ml,
    vialConfig.recommended_dose_mcg || 250,
    vialConfig.syringe_type || 'u100_1ml'
  )

  const totalDoses = vialConfig.total_doses_per_vial || calc.total_doses_in_vial
  const remainingDoses = Math.max(0, totalDoses - dosesLoggedCount)
  const percentRemaining = totalDoses > 0 ? Math.round((remainingDoses / totalDoses) * 100) : 0
  const remainingVolumeMl = Number(((remainingDoses / totalDoses) * vialConfig.bac_water_ml).toFixed(2))

  let daysSinceRecon: number | null = null
  let daysUntilExp: number | null = null
  let isExp = false

  if (vialConfig.reconstitution_date) {
    try {
      const reconDate = new Date(vialConfig.reconstitution_date)
      const now = new Date()
      const diffTime = now.getTime() - reconDate.getTime()
      daysSinceRecon = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)))
      const shelfLife = vialConfig.expiration_days || 30
      daysUntilExp = shelfLife - daysSinceRecon
      isExp = daysUntilExp <= 0
    } catch (e) {
      // ignore
    }
  }

  let statusLabel = 'Active Vial Healthy'
  let statusColor: 'green' | 'amber' | 'red' = 'green'

  if (isExp) {
    statusLabel = 'Vial Past Shelf-Life (Reconstitute Fresh)'
    statusColor = 'red'
  } else if (remainingDoses <= 2) {
    statusLabel = 'Vial Almost Depleted (1-2 Doses Left)'
    statusColor = 'amber'
  } else if (daysUntilExp !== null && daysUntilExp <= 5) {
    statusLabel = `Expires in ${daysUntilExp} Days`
    statusColor = 'amber'
  }

  return {
    remainingDoses,
    totalDoses,
    percentRemaining,
    remainingVolumeMl,
    daysSinceReconstituted: daysSinceRecon,
    daysUntilExpired: daysUntilExp,
    isExpired: isExp,
    statusLabel,
    statusColor
  }
}

/**
 * Local storage manager for user peptide vial configurations
 */
export function getSavedPeptideVialConfig(modalityKey: string, defaultFallback?: PeptideVialConfig): PeptideVialConfig | null {
  if (typeof window === 'undefined') return defaultFallback || null
  try {
    const raw = localStorage.getItem(`levl_peptide_vial_${modalityKey}`)
    if (raw) return JSON.parse(raw) as PeptideVialConfig
  } catch (e) {
    console.error('Error loading peptide vial config:', e)
  }
  return defaultFallback || null
}

export function savePeptideVialConfig(modalityKey: string, config: PeptideVialConfig): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(`levl_peptide_vial_${modalityKey}`, JSON.stringify(config))
    window.dispatchEvent(new CustomEvent('levl_peptide_vial_updated', { detail: { modalityKey, config } }))
  } catch (e) {
    console.error('Error saving peptide vial config:', e)
  }
}

/**
 * Retrieves site rotation history for a peptide modality
 */
export function getSavedInjectionSiteHistory(modalityKey: string): { injection_site: InjectionSite; timestamp: string }[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(`levl_injection_history_${modalityKey}`)
    if (raw) return JSON.parse(raw)
  } catch (e) {}
  return []
}

export function saveInjectionSiteLog(modalityKey: string, site: InjectionSite): void {
  if (typeof window === 'undefined') return
  try {
    const existing = getSavedInjectionSiteHistory(modalityKey)
    const updated = [{ injection_site: site, timestamp: new Date().toISOString() }, ...existing].slice(0, 30)
    localStorage.setItem(`levl_injection_history_${modalityKey}`, JSON.stringify(updated))
    window.dispatchEvent(new CustomEvent('levl_injection_site_logged', { detail: { modalityKey, site } }))
  } catch (e) {}
}

/**
 * Determines whether a modality is a Subcutaneous / Injectable peptide requiring
 * vial reconstitution math, insulin syringe drawing guides, and anatomical injection site rotation.
 * 
 * STRICT CLINICAL EXCLUSIONS:
 * - Collagen peptides (oral dietary powder / functional food)
 * - Topical peptides (GHK-Cu copper peptide serum, creams, lotions, transdermal gels)
 * - Oral peptides (BPC-157 arginate capsules, KPV tablets, oral pills)
 * - Intranasal peptides (nasal sprays, drops)
 */
export function isInjectableSubQPeptide(
  modality?: Modality | null,
  task?: DailyProtocolTask | null
): boolean {
  const m = modality || task?.loose_modality || task?.protocol_step?.modality
  if (!m) return false

  const id = (m.id || task?.modality_id || '').toLowerCase()
  const slug = (m.slug || '').toLowerCase()
  const name = (m.name || m.display_name || '').toLowerCase()
  const customName = (task?.execution_details?.custom_name || '').toLowerCase()
  const category = (m.category || '').toLowerCase()
  const modalityType = (m.modality_type || '').toLowerCase()
  const loggingType = (m.logging_type || '').toLowerCase()
  const archetype = ((m as any).archetype || '').toLowerCase()
  const fullText = `${id} ${slug} ${name} ${customName} ${category} ${modalityType} ${loggingType} ${archetype}`

  // 1. Biological peptide check: Is it a peptide at all?
  const isAnyPeptide =
    archetype === 'peptide' ||
    category.includes('peptide') ||
    modalityType.includes('peptide') ||
    loggingType === 'peptide' ||
    id.includes('bpc') || name.includes('bpc') || slug.includes('bpc') ||
    id.includes('tb-500') || id.includes('tb500') || name.includes('tb-500') || name.includes('tb500') ||
    id.includes('cjc') || name.includes('cjc') ||
    id.includes('ipamorelin') || name.includes('ipamorelin') ||
    id.includes('ghk') || name.includes('ghk') ||
    id.includes('semaglutide') || name.includes('semaglutide') ||
    id.includes('tirzepatide') || name.includes('tirzepatide') ||
    id.includes('retatrutide') || name.includes('retatrutide') ||
    id.includes('epithalon') || id.includes('epitalon') || name.includes('epithalon') || name.includes('epitalon') ||
    id.includes('mots-c') || id.includes('motsc') || name.includes('mots-c') || name.includes('motsc') ||
    id.includes('tesamorelin') || name.includes('tesamorelin') ||
    id.includes('sermorelin') || name.includes('sermorelin') ||
    id.includes('aod9604') || name.includes('aod9604') || name.includes('aod-9604') ||
    id.includes('pt141') || name.includes('pt141') || name.includes('pt-141') ||
    id.includes('kisspeptin') || name.includes('kisspeptin') ||
    id.includes('kpv') || name.includes('kpv') ||
    id.includes('semax') || name.includes('semax') ||
    id.includes('selank') || name.includes('selank') ||
    id.includes('ta1') || name.includes('thymosin') ||
    Boolean(m.peptide_metadata?.is_peptide)

  if (!isAnyPeptide) return false

  // 2. Strict Exclusion: Collagen Peptides
  // Collagen is an oral dietary powder/collagen peptide hydrolysate, NEVER a SubQ vial injection
  if (fullText.includes('collagen')) {
    return false
  }

  // 3. Strict Exclusion: Topical Peptides & Skincare
  // Dermal serums, copper peptide creams, lotions, etc.
  const deliveryRoute = ((m.peptide_metadata?.delivery_route as string) || '').toLowerCase()
  if (deliveryRoute === 'topical' || deliveryRoute === 'transdermal') {
    return false
  }
  if (
    modalityType.includes('topical') ||
    category.includes('skin') ||
    /\b(topical|serum|cream|lotion|gel|dermal|transdermal|face mask|skincare)\b/i.test(fullText)
  ) {
    return false
  }

  // 4. Strict Exclusion: Oral Peptides & Supplements
  // Capsules, tablets, pills, arginate oral powders
  if (deliveryRoute === 'oral') {
    return false
  }
  if (
    modalityType.includes('oral') ||
    /\b(oral|capsule|capsules|tablet|tablets|powder|pill|pills|swallow|ingest|dietary)\b/i.test(fullText)
  ) {
    return false
  }

  // 5. Strict Exclusion: Intranasal Peptides
  if (deliveryRoute === 'nasal') {
    return false
  }
  if (
    modalityType.includes('nasal') ||
    /\b(nasal|spray|intranasal|drops)\b/i.test(fullText)
  ) {
    return false
  }

  // 6. Confirmed Subcutaneous or Intramuscular Injectable
  return true
}

/**
 * Resolves the precise clinical microgram (mcg) dosage for a peptide task or modality.
 * Prevents 10-unit vs 100-unit visual mismatches by honoring:
 * 1. User's logged custom execution microgram dose
 * 2. Protocol step prescribed dose (with mg -> mcg conversion)
 * 3. Modality peptide_metadata default vial configuration (e.g. 2,500 mcg for TB-500, 250 mcg for BPC-157)
 * 4. Regex parsing of dose_or_exposure / dose_text strings (e.g. "2.5 mg" -> 2,500 mcg)
 */
export function resolvePeptideTargetDoseMcg(
  task?: DailyProtocolTask | null,
  modality?: Modality | null
): number {
  // 1. Explicit task execution details custom dose if set as a number
  if (task?.execution_details?.dose_amount_mcg && typeof task.execution_details.dose_amount_mcg === 'number') {
    return task.execution_details.dose_amount_mcg
  }

  // 2. Protocol step dose_amount if mcg
  if (task?.protocol_step?.dose_amount) {
    if (task.protocol_step.dose_unit === 'mg') {
      return task.protocol_step.dose_amount * 1000
    }
    return task.protocol_step.dose_amount
  }

  const m = modality || task?.loose_modality || task?.protocol_step?.modality

  // 3. Modality peptide_metadata recommended_dose_mcg
  if (m?.peptide_metadata?.default_vial_config?.recommended_dose_mcg) {
    return m.peptide_metadata.default_vial_config.recommended_dose_mcg
  }

  // 4. Parse from dose_text or dose_or_exposure
  const doseStr = task?.protocol_step?.dose_text || m?.dose_or_exposure || ''
  if (doseStr) {
    // Check for mg patterns like "2.5 mg" or "2.5mg" or "2 mg"
    const mgMatch = doseStr.match(/(\d+(?:\.\d+)?)\s*mg\b/i)
    if (mgMatch) {
      return parseFloat(mgMatch[1]) * 1000
    }
    const mcgMatch = doseStr.match(/(\d+(?:\.\d+)?)\s*mcg\b/i)
    if (mcgMatch) {
      return parseFloat(mcgMatch[1])
    }
  }

  return 250 // Safe clinical fallback
}

