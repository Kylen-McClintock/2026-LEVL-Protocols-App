/**
 * Protocol Visual Identity & Multi-Category Gradient Engine
 * 
 * Provides sophisticated, non-emoji clinical longevity iconography and
 * multi-stop category gradients matching constituent modalities across the app.
 */

import { MODALITY_COLOR_THEMES, ModalityMacroType, getModalityMacroType } from './modalityColors'

export interface ProtocolCategoryBadge {
  type: ModalityMacroType
  label: string
  colorHex: string
  bgTint: string
}

export interface ProtocolVisualTheme {
  id: string
  name: string
  iconName: 
    | 'Crown' 
    | 'Orbit' 
    | 'Atom' 
    | 'Brain' 
    | 'Flame' 
    | 'HeartPulse' 
    | 'Activity' 
    | 'ShieldCheck' 
    | 'Waves' 
    | 'Thermometer' 
    | 'Zap' 
    | 'Sparkles' 
    | 'Dumbbell' 
    | 'Compass' 
    | 'Moon' 
    | 'Radio' 
    | 'Wind' 
    | 'Layers'
  categories: ModalityMacroType[]
  categoryBadges: ProtocolCategoryBadge[]
  primaryColorHex: string
  secondaryColorHex: string
  gradientCSS: string
  glowColor: string
  accentBorderCSS: string
  subtleBgTint: string
}

// Curated signature visual themes for known protocols in the library
export const PRESET_PROTOCOL_THEMES: Record<string, ProtocolVisualTheme> = {
  // 1. Bryan Johnson Blueprint Core
  'bryan_johnson_blueprint_protocol': {
    id: 'bryan_johnson_blueprint_protocol',
    name: "Bryan Johnson's Project Blueprint Core Protocol v2.0",
    iconName: 'Crown',
    categories: ['supplements', 'fitness', 'nutrition', 'sleep'],
    categoryBadges: [
      { type: 'supplements', label: 'Supplements', colorHex: '#F59E0B', bgTint: 'rgba(245, 158, 11, 0.2)' },
      { type: 'fitness', label: 'Fitness', colorHex: '#F97316', bgTint: 'rgba(249, 115, 22, 0.2)' },
      { type: 'sleep', label: 'Sleep', colorHex: '#6366F1', bgTint: 'rgba(99, 102, 241, 0.2)' }
    ],
    primaryColorHex: '#F59E0B',
    secondaryColorHex: '#6366F1',
    gradientCSS: 'linear-gradient(135deg, #F59E0B 0%, #6366F1 50%, #10B981 100%)',
    glowColor: 'rgba(245, 158, 11, 0.35)',
    accentBorderCSS: 'linear-gradient(90deg, #F59E0B, #6366F1, #10B981)',
    subtleBgTint: 'rgba(245, 158, 11, 0.08)'
  },

  // 2. Peter Attia Centenarian Decathlon
  'peter_attia_centenarian_decathlon_protocol': {
    id: 'peter_attia_centenarian_decathlon_protocol',
    name: "Dr. Peter Attia's Centenarian Decathlon Protocol",
    iconName: 'Activity',
    categories: ['fitness', 'nutrition'],
    categoryBadges: [
      { type: 'fitness', label: 'Fitness', colorHex: '#F97316', bgTint: 'rgba(249, 115, 22, 0.2)' },
      { type: 'nutrition', label: 'Nutrition', colorHex: '#10B981', bgTint: 'rgba(16, 185, 129, 0.2)' }
    ],
    primaryColorHex: '#F97316',
    secondaryColorHex: '#10B981',
    gradientCSS: 'linear-gradient(135deg, #F97316 0%, #10B981 100%)',
    glowColor: 'rgba(249, 115, 22, 0.35)',
    accentBorderCSS: 'linear-gradient(90deg, #F97316, #10B981)',
    subtleBgTint: 'rgba(249, 115, 22, 0.08)'
  },

  // 3. David Sinclair Epigenetic Renewal
  'dr_david_sinclair_epigenetic_renewal': {
    id: 'dr_david_sinclair_epigenetic_renewal',
    name: "Dr. David Sinclair's Epigenetic Renewal Protocol",
    iconName: 'Atom',
    categories: ['supplements', 'nutrition'],
    categoryBadges: [
      { type: 'supplements', label: 'Supplements', colorHex: '#F59E0B', bgTint: 'rgba(245, 158, 11, 0.2)' },
      { type: 'nutrition', label: 'Nutrition', colorHex: '#10B981', bgTint: 'rgba(16, 185, 129, 0.2)' }
    ],
    primaryColorHex: '#F59E0B',
    secondaryColorHex: '#10B981',
    gradientCSS: 'linear-gradient(135deg, #F59E0B 0%, #10B981 100%)',
    glowColor: 'rgba(245, 158, 11, 0.35)',
    accentBorderCSS: 'linear-gradient(90deg, #F59E0B, #10B981)',
    subtleBgTint: 'rgba(245, 158, 11, 0.08)'
  },

  // 4. Wim Hof Autonomic Nervous System & HRV Reset
  'wim_hof_autonomic_hrv_reset_protocol': {
    id: 'wim_hof_autonomic_hrv_reset_protocol',
    name: "Wim Hof Autonomic Nervous System & HRV Reset Protocol",
    iconName: 'Waves',
    categories: ['thermal', 'mind'],
    categoryBadges: [
      { type: 'thermal', label: 'Thermal', colorHex: '#06B6D4', bgTint: 'rgba(6, 182, 212, 0.2)' },
      { type: 'mind', label: 'Mind', colorHex: '#A855F7', bgTint: 'rgba(168, 85, 247, 0.2)' }
    ],
    primaryColorHex: '#06B6D4',
    secondaryColorHex: '#A855F7',
    gradientCSS: 'linear-gradient(135deg, #06B6D4 0%, #A855F7 100%)',
    glowColor: 'rgba(6, 182, 212, 0.35)',
    accentBorderCSS: 'linear-gradient(90deg, #06B6D4, #A855F7)',
    subtleBgTint: 'rgba(6, 182, 212, 0.08)'
  },

  // 5. Gary Brecka Superhuman Protocol
  'gary_brecka_superhuman_protocol': {
    id: 'gary_brecka_superhuman_protocol',
    name: "Gary Brecka's Superhuman Protocol",
    iconName: 'Zap',
    categories: ['thermal', 'mind', 'supplements'],
    categoryBadges: [
      { type: 'thermal', label: 'Thermal', colorHex: '#06B6D4', bgTint: 'rgba(6, 182, 212, 0.2)' },
      { type: 'mind', label: 'Mind', colorHex: '#A855F7', bgTint: 'rgba(168, 85, 247, 0.2)' },
      { type: 'supplements', label: 'Supplements', colorHex: '#F59E0B', bgTint: 'rgba(245, 158, 11, 0.2)' }
    ],
    primaryColorHex: '#A855F7',
    secondaryColorHex: '#06B6D4',
    gradientCSS: 'linear-gradient(135deg, #A855F7 0%, #06B6D4 50%, #F59E0B 100%)',
    glowColor: 'rgba(168, 85, 247, 0.35)',
    accentBorderCSS: 'linear-gradient(90deg, #A855F7, #06B6D4, #F59E0B)',
    subtleBgTint: 'rgba(168, 85, 247, 0.08)'
  },

  // 6. Dr. Matthew Walker Sleep Blueprint
  'dr_matthew_walker_sleep_blueprint': {
    id: 'dr_matthew_walker_sleep_blueprint',
    name: "Dr. Matthew Walker's 8-Hour Sleep Architecture Blueprint",
    iconName: 'Moon',
    categories: ['sleep', 'supplements'],
    categoryBadges: [
      { type: 'sleep', label: 'Sleep', colorHex: '#6366F1', bgTint: 'rgba(99, 102, 241, 0.2)' },
      { type: 'supplements', label: 'Supplements', colorHex: '#F59E0B', bgTint: 'rgba(245, 158, 11, 0.2)' }
    ],
    primaryColorHex: '#6366F1',
    secondaryColorHex: '#F59E0B',
    gradientCSS: 'linear-gradient(135deg, #6366F1 0%, #818CF8 50%, #F59E0B 100%)',
    glowColor: 'rgba(99, 102, 241, 0.35)',
    accentBorderCSS: 'linear-gradient(90deg, #6366F1, #F59E0B)',
    subtleBgTint: 'rgba(99, 102, 241, 0.08)'
  },

  // 7. Dr. Valter Longo Senolytic & Fasting Mimicking
  'dr_valter_longo_senolytic_fmd_protocol': {
    id: 'dr_valter_longo_senolytic_fmd_protocol',
    name: "Dr. Valter Longo & Mayo Clinic Senolytic & Fasting Mimicking Protocol",
    iconName: 'ShieldCheck',
    categories: ['nutrition', 'supplements'],
    categoryBadges: [
      { type: 'nutrition', label: 'Nutrition', colorHex: '#10B981', bgTint: 'rgba(16, 185, 129, 0.2)' },
      { type: 'supplements', label: 'Supplements', colorHex: '#F59E0B', bgTint: 'rgba(245, 158, 11, 0.2)' }
    ],
    primaryColorHex: '#10B981',
    secondaryColorHex: '#F59E0B',
    gradientCSS: 'linear-gradient(135deg, #10B981 0%, #F59E0B 100%)',
    glowColor: 'rgba(16, 185, 129, 0.35)',
    accentBorderCSS: 'linear-gradient(90deg, #10B981, #F59E0B)',
    subtleBgTint: 'rgba(16, 185, 129, 0.08)'
  },

  // 8. Dr. Casey Means Metabolic & Glycemic
  'dr_casey_means_metabolic_flexibility_protocol': {
    id: 'dr_casey_means_metabolic_flexibility_protocol',
    name: "Dr. Casey Means & Glucose Goddess Postprandial Glycemic Protocol",
    iconName: 'Flame',
    categories: ['nutrition', 'fitness'],
    categoryBadges: [
      { type: 'nutrition', label: 'Nutrition', colorHex: '#10B981', bgTint: 'rgba(16, 185, 129, 0.2)' },
      { type: 'fitness', label: 'Fitness', colorHex: '#F97316', bgTint: 'rgba(249, 115, 22, 0.2)' }
    ],
    primaryColorHex: '#10B981',
    secondaryColorHex: '#F97316',
    gradientCSS: 'linear-gradient(135deg, #10B981 0%, #F97316 100%)',
    glowColor: 'rgba(16, 185, 129, 0.35)',
    accentBorderCSS: 'linear-gradient(90deg, #10B981, #F97316)',
    subtleBgTint: 'rgba(16, 185, 129, 0.08)'
  },

  // 9. Dr. Thomas Dayspring Endothelial & Vascular Elasticity
  'dr_thomas_dayspring_endothelial_vascular_protocol': {
    id: 'dr_thomas_dayspring_endothelial_vascular_protocol',
    name: "Dr. Thomas Dayspring Endothelial & Vascular Elasticity Protocol",
    iconName: 'HeartPulse',
    categories: ['supplements', 'fitness', 'diagnostics'],
    categoryBadges: [
      { type: 'supplements', label: 'Supplements', colorHex: '#F59E0B', bgTint: 'rgba(245, 158, 11, 0.2)' },
      { type: 'fitness', label: 'Fitness', colorHex: '#F97316', bgTint: 'rgba(249, 115, 22, 0.2)' },
      { type: 'diagnostics', label: 'Diagnostics', colorHex: '#3B82F6', bgTint: 'rgba(59, 130, 246, 0.2)' }
    ],
    primaryColorHex: '#3B82F6',
    secondaryColorHex: '#F59E0B',
    gradientCSS: 'linear-gradient(135deg, #3B82F6 0%, #F59E0B 100%)',
    glowColor: 'rgba(59, 130, 246, 0.35)',
    accentBorderCSS: 'linear-gradient(90deg, #3B82F6, #F59E0B)',
    subtleBgTint: 'rgba(59, 130, 246, 0.08)'
  },

  // 10. Photonic GHK-Cu Red Light Protocol
  'photonic_ghkcu_red_light_protocol': {
    id: 'photonic_ghkcu_red_light_protocol',
    name: "Photonic & Biochemical Dermal Remodeling",
    iconName: 'Sparkles',
    categories: ['peptides', 'thermal'],
    categoryBadges: [
      { type: 'peptides', label: 'Peptides', colorHex: '#E879F9', bgTint: 'rgba(232, 121, 249, 0.2)' },
      { type: 'thermal', label: 'Thermal', colorHex: '#06B6D4', bgTint: 'rgba(6, 182, 212, 0.2)' }
    ],
    primaryColorHex: '#E879F9',
    secondaryColorHex: '#06B6D4',
    gradientCSS: 'linear-gradient(135deg, #E879F9 0%, #06B6D4 100%)',
    glowColor: 'rgba(232, 121, 249, 0.35)',
    accentBorderCSS: 'linear-gradient(90deg, #E879F9, #06B6D4)',
    subtleBgTint: 'rgba(232, 121, 249, 0.08)'
  },

  // 11. Wolverine Thermal Recovery Protocol
  'wolverine_thermal_recovery_protocol': {
    id: 'wolverine_thermal_recovery_protocol',
    name: "Wolverine Angiogenesis & Thermal Recovery Protocol",
    iconName: 'Thermometer',
    categories: ['peptides', 'thermal'],
    categoryBadges: [
      { type: 'peptides', label: 'Peptides', colorHex: '#E879F9', bgTint: 'rgba(232, 121, 249, 0.2)' },
      { type: 'thermal', label: 'Thermal', colorHex: '#06B6D4', bgTint: 'rgba(6, 182, 212, 0.2)' }
    ],
    primaryColorHex: '#E879F9',
    secondaryColorHex: '#06B6D4',
    gradientCSS: 'linear-gradient(135deg, #E879F9 0%, #06B6D4 100%)',
    glowColor: 'rgba(232, 121, 249, 0.35)',
    accentBorderCSS: 'linear-gradient(90deg, #E879F9, #06B6D4)',
    subtleBgTint: 'rgba(232, 121, 249, 0.08)'
  },

  // 12. MOTS-c Fasted Zone 2 Mitochondrial Biogenesis Protocol
  'mots_c_zone2_mitochondrial_protocol': {
    id: 'mots_c_zone2_mitochondrial_protocol',
    name: "MOTS-c Fasted Zone 2 Mitochondrial Biogenesis Protocol",
    iconName: 'Zap',
    categories: ['peptides', 'fitness'],
    categoryBadges: [
      { type: 'peptides', label: 'Peptides', colorHex: '#E879F9', bgTint: 'rgba(232, 121, 249, 0.2)' },
      { type: 'fitness', label: 'Fitness', colorHex: '#F97316', bgTint: 'rgba(249, 115, 22, 0.2)' }
    ],
    primaryColorHex: '#E879F9',
    secondaryColorHex: '#F97316',
    gradientCSS: 'linear-gradient(135deg, #E879F9 0%, #F97316 100%)',
    glowColor: 'rgba(232, 121, 249, 0.35)',
    accentBorderCSS: 'linear-gradient(90deg, #E879F9, #F97316)',
    subtleBgTint: 'rgba(232, 121, 249, 0.08)'
  },

  // 13. CJC-1295 / Ipamorelin Nocturnal Somatotropin Protocol
  'cjc_ipam_anabolic_sleep_protocol': {
    id: 'cjc_ipam_anabolic_sleep_protocol',
    name: "CJC-1295 / Ipamorelin Nocturnal Somatotropin Protocol",
    iconName: 'Moon',
    categories: ['peptides', 'sleep'],
    categoryBadges: [
      { type: 'peptides', label: 'Peptides', colorHex: '#E879F9', bgTint: 'rgba(232, 121, 249, 0.2)' },
      { type: 'sleep', label: 'Sleep', colorHex: '#6366F1', bgTint: 'rgba(99, 102, 241, 0.2)' }
    ],
    primaryColorHex: '#E879F9',
    secondaryColorHex: '#6366F1',
    gradientCSS: 'linear-gradient(135deg, #E879F9 0%, #6366F1 100%)',
    glowColor: 'rgba(232, 121, 249, 0.35)',
    accentBorderCSS: 'linear-gradient(90deg, #E879F9, #6366F1)',
    subtleBgTint: 'rgba(232, 121, 249, 0.08)'
  },

  // 14. Semax & Selank Neurotrophic Flow State Protocol
  'semax_selank_cognitive_flow_protocol': {
    id: 'semax_selank_cognitive_flow_protocol',
    name: "Semax & Selank Neurotrophic Flow State Protocol",
    iconName: 'Brain',
    categories: ['peptides', 'mind'],
    categoryBadges: [
      { type: 'peptides', label: 'Peptides', colorHex: '#E879F9', bgTint: 'rgba(232, 121, 249, 0.2)' },
      { type: 'mind', label: 'Mind', colorHex: '#A855F7', bgTint: 'rgba(168, 85, 247, 0.2)' }
    ],
    primaryColorHex: '#E879F9',
    secondaryColorHex: '#A855F7',
    gradientCSS: 'linear-gradient(135deg, #E879F9 0%, #A855F7 100%)',
    glowColor: 'rgba(232, 121, 249, 0.35)',
    accentBorderCSS: 'linear-gradient(90deg, #E879F9, #A855F7)',
    subtleBgTint: 'rgba(232, 121, 249, 0.08)'
  },

  // 15. Push / Pull / Legs Hypertrophy
  'push_pull_legs_hypertrophy': {
    id: 'push_pull_legs_hypertrophy',
    name: "Push / Pull / Legs (PPL) Science-Based Hypertrophy Split",
    iconName: 'Dumbbell',
    categories: ['fitness'],
    categoryBadges: [
      { type: 'fitness', label: 'Fitness', colorHex: '#F97316', bgTint: 'rgba(249, 115, 22, 0.2)' }
    ],
    primaryColorHex: '#F97316',
    secondaryColorHex: '#FB923C',
    gradientCSS: 'linear-gradient(135deg, #EA580C 0%, #F97316 100%)',
    glowColor: 'rgba(249, 115, 22, 0.35)',
    accentBorderCSS: 'linear-gradient(90deg, #EA580C, #F97316)',
    subtleBgTint: 'rgba(249, 115, 22, 0.08)'
  },

  // 16. Half Marathon Training
  'half_marathon_training': {
    id: 'half_marathon_training',
    name: "12-Week Adaptive Half Marathon Training Protocol",
    iconName: 'Compass',
    categories: ['fitness'],
    categoryBadges: [
      { type: 'fitness', label: 'Fitness', colorHex: '#F97316', bgTint: 'rgba(249, 115, 22, 0.2)' }
    ],
    primaryColorHex: '#F97316',
    secondaryColorHex: '#38BDF8',
    gradientCSS: 'linear-gradient(135deg, #EA580C 0%, #F97316 50%, #38BDF8 100%)',
    glowColor: 'rgba(249, 115, 22, 0.35)',
    accentBorderCSS: 'linear-gradient(90deg, #EA580C, #F97316, #38BDF8)',
    subtleBgTint: 'rgba(249, 115, 22, 0.08)'
  }
}

/**
 * Normalizes protocol names to map accurately to presets
 */
function normalizeProtocolKey(val?: string): string {
  if (!val) return ''
  return val
    .toLowerCase()
    .replace(/[’'’]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

/**
 * Dynamically resolves or synthesizes a sophisticated visual theme for ANY protocol,
 * whether in the current library or created in the future.
 */
export function getProtocolVisualTheme(
  protocolOrName?: any,
  tasksOrSteps?: any[]
): ProtocolVisualTheme {
  const name = typeof protocolOrName === 'string' 
    ? protocolOrName 
    : protocolOrName?.name || protocolOrName?.title || 'Protocol'
  const id = protocolOrName?.id || normalizeProtocolKey(name)
  const normKey = normalizeProtocolKey(id)
  const normName = normalizeProtocolKey(name)

  // 1. Direct preset match by ID or normalized name
  for (const [presetKey, preset] of Object.entries(PRESET_PROTOCOL_THEMES)) {
    if (
      presetKey === normKey ||
      presetKey === normName ||
      normKey.includes(presetKey) ||
      normName.includes(presetKey) ||
      preset.name.toLowerCase() === name.toLowerCase()
    ) {
      return preset
    }
  }

  // 2. Dynamic multi-category extraction from tasks or steps
  const detectedCategories = new Set<ModalityMacroType>()
  const itemsToCheck: any[] = []

  if (tasksOrSteps && Array.isArray(tasksOrSteps)) {
    itemsToCheck.push(...tasksOrSteps)
  }
  if (protocolOrName?.steps && Array.isArray(protocolOrName.steps)) {
    itemsToCheck.push(...protocolOrName.steps)
  }
  if (protocolOrName?.protocol_steps && Array.isArray(protocolOrName.protocol_steps)) {
    itemsToCheck.push(...protocolOrName.protocol_steps)
  }

  itemsToCheck.forEach((item) => {
    const macroType = getModalityMacroType(item)
    if (macroType && macroType !== 'other') {
      detectedCategories.add(macroType)
    }
  })

  // 3. If no items provided or empty, parse protocol metadata
  const textCorpus = [
    name,
    protocolOrName?.description || '',
    protocolOrName?.summary || '',
    protocolOrName?.primary_goal || '',
    protocolOrName?.goal || '',
    protocolOrName?.category || ''
  ].join(' ').toLowerCase()

  if (detectedCategories.size === 0) {
    if (textCorpus.includes('peptide') || textCorpus.includes('bpc') || textCorpus.includes('ghk') || textCorpus.includes('cjc') || textCorpus.includes('mots')) {
      detectedCategories.add('peptides')
    }
    if (textCorpus.includes('cold') || textCorpus.includes('sauna') || textCorpus.includes('heat') || textCorpus.includes('cryo') || textCorpus.includes('plunge') || textCorpus.includes('red light') || textCorpus.includes('photobio')) {
      detectedCategories.add('thermal')
    }
    if (textCorpus.includes('supplement') || textCorpus.includes('nmn') || textCorpus.includes('nad') || textCorpus.includes('creatine') || textCorpus.includes('resveratrol') || textCorpus.includes('vitamin') || textCorpus.includes('stack')) {
      detectedCategories.add('supplements')
    }
    if (textCorpus.includes('fitness') || textCorpus.includes('exercise') || textCorpus.includes('cardio') || textCorpus.includes('strength') || textCorpus.includes('workout') || textCorpus.includes('vo2') || textCorpus.includes('zone 2') || textCorpus.includes('hypertrophy')) {
      detectedCategories.add('fitness')
    }
    if (textCorpus.includes('sleep') || textCorpus.includes('circadian') || textCorpus.includes('bedtime') || textCorpus.includes('night') || textCorpus.includes('mouth tape')) {
      detectedCategories.add('sleep')
    }
    if (textCorpus.includes('brain') || textCorpus.includes('cognitive') || textCorpus.includes('nervous') || textCorpus.includes('breath') || textCorpus.includes('hrv') || textCorpus.includes('meditat') || textCorpus.includes('vagal')) {
      detectedCategories.add('mind')
    }
    if (textCorpus.includes('fast') || textCorpus.includes('nutrition') || textCorpus.includes('diet') || textCorpus.includes('glucose') || textCorpus.includes('glycemic') || textCorpus.includes('meal') || textCorpus.includes('olive oil')) {
      detectedCategories.add('nutrition')
    }
    if (textCorpus.includes('diagnostic') || textCorpus.includes('biomarker') || textCorpus.includes('lab') || textCorpus.includes('cgm') || textCorpus.includes('blood') || textCorpus.includes('tracking')) {
      detectedCategories.add('diagnostics')
    }
  }

  // Fallback if completely unspecified
  if (detectedCategories.size === 0) {
    detectedCategories.add('other')
  }

  const categoryList = Array.from(detectedCategories)

  // 4. Derive Category Badges & Color stops
  const categoryBadges: ProtocolCategoryBadge[] = categoryList.map(cat => {
    const theme = MODALITY_COLOR_THEMES[cat] || MODALITY_COLOR_THEMES.other
    return {
      type: cat,
      label: theme.label.split('&')[0].trim(),
      colorHex: theme.colorHex,
      bgTint: theme.bgTint
    }
  })

  const primaryCat = categoryList[0] || 'other'
  const primaryTheme = MODALITY_COLOR_THEMES[primaryCat] || MODALITY_COLOR_THEMES.other
  const primaryColorHex = primaryTheme.colorHex

  let secondaryColorHex = primaryColorHex
  let gradientCSS = ''
  let accentBorderCSS = ''

  if (categoryList.length === 1) {
    // Single category: Rich 2-stop monochromatic luminous gradient
    const cat = categoryList[0]
    if (cat === 'supplements') {
      gradientCSS = 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)'
      accentBorderCSS = 'linear-gradient(90deg, #D97706, #F59E0B)'
      secondaryColorHex = '#FDE68A'
    } else if (cat === 'peptides') {
      gradientCSS = 'linear-gradient(135deg, #C026D3 0%, #E879F9 100%)'
      accentBorderCSS = 'linear-gradient(90deg, #C026D3, #E879F9)'
      secondaryColorHex = '#F5D0FE'
    } else if (cat === 'fitness') {
      gradientCSS = 'linear-gradient(135deg, #EA580C 0%, #F97316 100%)'
      accentBorderCSS = 'linear-gradient(90deg, #EA580C, #F97316)'
      secondaryColorHex = '#FED7AA'
    } else if (cat === 'nutrition') {
      gradientCSS = 'linear-gradient(135deg, #059669 0%, #10B981 100%)'
      accentBorderCSS = 'linear-gradient(90deg, #059669, #10B981)'
      secondaryColorHex = '#A7F3D0'
    } else if (cat === 'sleep') {
      gradientCSS = 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)'
      accentBorderCSS = 'linear-gradient(90deg, #4F46E5, #6366F1)'
      secondaryColorHex = '#C7D2FE'
    } else if (cat === 'mind') {
      gradientCSS = 'linear-gradient(135deg, #9333EA 0%, #A855F7 100%)'
      accentBorderCSS = 'linear-gradient(90deg, #9333EA, #A855F7)'
      secondaryColorHex = '#E9D5FF'
    } else if (cat === 'thermal') {
      gradientCSS = 'linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)'
      accentBorderCSS = 'linear-gradient(90deg, #0891B2, #06B6D4)'
      secondaryColorHex = '#A5F3FC'
    } else if (cat === 'diagnostics') {
      gradientCSS = 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)'
      accentBorderCSS = 'linear-gradient(90deg, #2563EB, #3B82F6)'
      secondaryColorHex = '#BFDBFE'
    } else {
      gradientCSS = 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)'
      accentBorderCSS = 'linear-gradient(90deg, #0D9488, #14B8A6)'
      secondaryColorHex = '#99F6E4'
    }
  } else if (categoryList.length === 2) {
    // 2 Categories: High-contrast bi-directional gradient
    const theme2 = MODALITY_COLOR_THEMES[categoryList[1]] || MODALITY_COLOR_THEMES.other
    secondaryColorHex = theme2.colorHex
    gradientCSS = `linear-gradient(135deg, ${primaryColorHex} 0%, ${secondaryColorHex} 100%)`
    accentBorderCSS = `linear-gradient(90deg, ${primaryColorHex}, ${secondaryColorHex})`
  } else {
    // 3+ Categories: Luminous multi-stop tri-gradient
    const theme2 = MODALITY_COLOR_THEMES[categoryList[1]] || MODALITY_COLOR_THEMES.other
    const theme3 = MODALITY_COLOR_THEMES[categoryList[2]] || MODALITY_COLOR_THEMES.other
    secondaryColorHex = theme2.colorHex
    gradientCSS = `linear-gradient(135deg, ${primaryColorHex} 0%, ${theme2.colorHex} 50%, ${theme3.colorHex} 100%)`
    accentBorderCSS = `linear-gradient(90deg, ${primaryColorHex}, ${theme2.colorHex}, ${theme3.colorHex})`
  }

  // 5. Intelligent clinical longevity icon selection
  let iconName: ProtocolVisualTheme['iconName'] = 'Layers'

  if (categoryList.includes('peptides')) {
    if (categoryList.includes('mind') || textCorpus.includes('neuro') || textCorpus.includes('brain')) {
      iconName = 'Brain'
    } else if (categoryList.includes('sleep') || textCorpus.includes('nocturnal')) {
      iconName = 'Moon'
    } else if (categoryList.includes('fitness')) {
      iconName = 'Zap'
    } else if (categoryList.includes('thermal')) {
      iconName = 'Sparkles'
    } else {
      iconName = 'Atom'
    }
  } else if (categoryList.includes('thermal')) {
    if (textCorpus.includes('ice') || textCorpus.includes('cold') || textCorpus.includes('plunge') || textCorpus.includes('breath') || textCorpus.includes('hrv')) {
      iconName = 'Waves'
    } else {
      iconName = 'Thermometer'
    }
  } else if (categoryList.includes('sleep')) {
    iconName = 'Moon'
  } else if (categoryList.includes('mind')) {
    if (textCorpus.includes('breath') || textCorpus.includes('oxygen') || textCorpus.includes('ewot')) {
      iconName = 'Wind'
    } else {
      iconName = 'Brain'
    }
  } else if (categoryList.includes('fitness')) {
    if (textCorpus.includes('strength') || textCorpus.includes('lift') || textCorpus.includes('hypertrophy') || textCorpus.includes('ppl')) {
      iconName = 'Dumbbell'
    } else if (textCorpus.includes('marathon') || textCorpus.includes('running') || textCorpus.includes('periodization')) {
      iconName = 'Compass'
    } else {
      iconName = 'Activity'
    }
  } else if (categoryList.includes('nutrition')) {
    if (textCorpus.includes('senolytic') || textCorpus.includes('immune')) {
      iconName = 'ShieldCheck'
    } else {
      iconName = 'Flame'
    }
  } else if (categoryList.includes('diagnostics')) {
    iconName = 'HeartPulse'
  } else if (categoryList.includes('supplements')) {
    iconName = 'Atom'
  } else if (categoryList.length >= 3) {
    iconName = 'Orbit'
  }

  // Special title overrides
  if (textCorpus.includes('blueprint') || textCorpus.includes('master') || textCorpus.includes('king') || textCorpus.includes('crown')) {
    iconName = 'Crown'
  }

  const glowColor = primaryColorHex.startsWith('#')
    ? hexToRgba(primaryColorHex, 0.35)
    : 'rgba(168, 85, 247, 0.35)'

  return {
    id: id || normKey,
    name,
    iconName,
    categories: categoryList,
    categoryBadges,
    primaryColorHex,
    secondaryColorHex,
    gradientCSS,
    glowColor,
    accentBorderCSS,
    subtleBgTint: hexToRgba(primaryColorHex, 0.08)
  }
}

function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace('#', '')
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.slice(0, 2), 16)
    const g = parseInt(cleanHex.slice(2, 4), 16)
    const b = parseInt(cleanHex.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  return `rgba(168, 85, 247, ${alpha})`
}
