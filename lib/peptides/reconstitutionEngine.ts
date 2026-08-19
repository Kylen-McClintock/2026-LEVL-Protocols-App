import { PeptideVialConfig, InjectionSite, PeptideDoseLog } from '@/lib/types'

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
