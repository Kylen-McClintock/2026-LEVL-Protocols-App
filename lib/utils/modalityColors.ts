/**
 * Unified Modality Color & Classification Engine
 * 
 * Provides consistent, high-contrast, beautiful luminous colors across all views:
 * - Supplements: Solar Amber / Gold (#F59E0B)
 * - Peptides: Bioactive Fuchsia / Pink (#E879F9)
 * - Fitness & Movement: Energetic Crimson / Scarlet Red (#EF4444)
 * - Nutrition & Fasting: Vibrant Emerald / Spring Green (#05DF72)
 * - Sleep & Circadian: Deep Royal Purple / Violet (#A855F7)
 * - Mind & Nervous System: Focus & Cognitive Blue (#3B82F6)
 * - Thermal & Environmental: Ice Cyan (#06B6D4)
 * - Diagnostics & Tracking: High-Tech Indigo (#6366F1)
 */

export type ModalityMacroType =
  | 'supplements'
  | 'peptides'
  | 'fitness'
  | 'nutrition'
  | 'sleep'
  | 'mind'
  | 'thermal'
  | 'diagnostics'
  | 'other'

export interface ModalityColorTheme {
  type: ModalityMacroType
  label: string
  colorHex: string
  bgTint: string
  borderHex: string
  borderClass: string
  badgeBg: string
  badgeText: string
  badgeBorder: string
  cardBg: string
  textHex: string
}

export const MODALITY_COLOR_THEMES: Record<ModalityMacroType, ModalityColorTheme> = {
  supplements: {
    type: 'supplements',
    label: 'Supplements',
    colorHex: '#F59E0B', // Solar Amber
    bgTint: 'rgba(245, 158, 11, 0.16)',
    borderHex: '#F59E0B',
    borderClass: 'border-amber-500/60',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-300',
    badgeBorder: 'border-amber-500/40',
    cardBg: 'bg-amber-950/25',
    textHex: '#FEF3C7'
  },
  peptides: {
    type: 'peptides',
    label: 'Peptides',
    colorHex: '#E879F9', // Bioactive Fuchsia
    bgTint: 'rgba(232, 121, 249, 0.16)',
    borderHex: '#E879F9',
    borderClass: 'border-fuchsia-500/60',
    badgeBg: 'bg-fuchsia-500/20',
    badgeText: 'text-fuchsia-300',
    badgeBorder: 'border-fuchsia-500/40',
    cardBg: 'bg-fuchsia-950/25',
    textHex: '#FDF4FF'
  },
  fitness: {
    type: 'fitness',
    label: 'Fitness',
    colorHex: '#EF4444', // Energetic Crimson / Scarlet Red
    bgTint: 'rgba(239, 68, 68, 0.16)',
    borderHex: '#EF4444',
    borderClass: 'border-red-500/60',
    badgeBg: 'bg-red-500/20',
    badgeText: 'text-red-300',
    badgeBorder: 'border-red-500/40',
    cardBg: 'bg-red-950/25',
    textHex: '#FEE2E2'
  },
  nutrition: {
    type: 'nutrition',
    label: 'Nutrition',
    colorHex: '#05DF72', // Vibrant Rich Emerald / Spring Green
    bgTint: 'rgba(5, 223, 114, 0.16)',
    borderHex: '#05DF72',
    borderClass: 'border-emerald-400/60',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-300',
    badgeBorder: 'border-emerald-500/40',
    cardBg: 'bg-emerald-950/25',
    textHex: '#D1FAE5'
  },
  sleep: {
    type: 'sleep',
    label: 'Sleep & Circadian',
    colorHex: '#A855F7', // Deep Royal Purple
    bgTint: 'rgba(168, 85, 247, 0.16)',
    borderHex: '#A855F7',
    borderClass: 'border-purple-500/60',
    badgeBg: 'bg-purple-500/20',
    badgeText: 'text-purple-300',
    badgeBorder: 'border-purple-500/40',
    cardBg: 'bg-purple-950/25',
    textHex: '#F3E8FF'
  },
  mind: {
    type: 'mind',
    label: 'Mind & Nervous System',
    colorHex: '#3B82F6', // Focus / Cognitive Blue
    bgTint: 'rgba(59, 130, 246, 0.16)',
    borderHex: '#3B82F6',
    borderClass: 'border-blue-500/60',
    badgeBg: 'bg-blue-500/20',
    badgeText: 'text-blue-300',
    badgeBorder: 'border-blue-500/40',
    cardBg: 'bg-blue-950/25',
    textHex: '#DBEAFE'
  },
  thermal: {
    type: 'thermal',
    label: 'Thermal & Recovery',
    colorHex: '#06B6D4', // Ice Cyan
    bgTint: 'rgba(6, 182, 212, 0.16)',
    borderHex: '#06B6D4',
    borderClass: 'border-cyan-500/60',
    badgeBg: 'bg-cyan-500/20',
    badgeText: 'text-cyan-300',
    badgeBorder: 'border-cyan-500/40',
    cardBg: 'bg-cyan-950/25',
    textHex: '#CFFAFE'
  },
  diagnostics: {
    type: 'diagnostics',
    label: 'Diagnostics & Tracking',
    colorHex: '#6366F1', // High-Tech Indigo
    bgTint: 'rgba(99, 102, 241, 0.16)',
    borderHex: '#6366F1',
    borderClass: 'border-indigo-500/60',
    badgeBg: 'bg-indigo-500/20',
    badgeText: 'text-indigo-300',
    badgeBorder: 'border-indigo-500/40',
    cardBg: 'bg-indigo-950/25',
    textHex: '#E0E7FF'
  },
  other: {
    type: 'other',
    label: 'General Modality',
    colorHex: '#14B8A6', // Teal
    bgTint: 'rgba(20, 184, 166, 0.16)',
    borderHex: '#14B8A6',
    borderClass: 'border-teal-500/60',
    badgeBg: 'bg-teal-500/20',
    badgeText: 'text-teal-300',
    badgeBorder: 'border-teal-500/40',
    cardBg: 'bg-teal-950/25',
    textHex: '#99F6E4'
  }
}

/**
 * Detects the unified modality type from task and modality metadata
 */
export function getModalityMacroType(modalityOrTask?: any): ModalityMacroType {
  if (!modalityOrTask) return 'other'

  const modality = modalityOrTask.protocol_step?.modality || modalityOrTask.loose_modality || modalityOrTask
  const task = modalityOrTask.protocol_step ? modalityOrTask : null

  const catLower = (modality.category || task?.category || '').toLowerCase()
  const typeLower = (modality.modality_type || task?.modality_type || '').toLowerCase()
  const nameLower = (modality.name || modality.display_name || task?.name || '').toLowerCase()
  const descLower = (modality.brief_description || modality.description || '').toLowerCase()
  const idLower = (modality.id || task?.modality_id || '').toLowerCase()

  const combined = `${catLower} ${typeLower} ${nameLower} ${descLower} ${idLower}`

  // 1. Peptides first
  if (
    catLower.includes('peptide') ||
    typeLower.includes('peptide') ||
    catLower.includes('injectable') ||
    combined.includes('bpc') ||
    combined.includes('tb-500') ||
    combined.includes('tb500') ||
    combined.includes('cjc') ||
    combined.includes('ipamorelin') ||
    combined.includes('ghk') ||
    combined.includes('epithalon') ||
    combined.includes('mots-c') ||
    combined.includes('ss-31') ||
    combined.includes('kpv') ||
    combined.includes('ta1') ||
    combined.includes('semax') ||
    combined.includes('selank') ||
    combined.includes('retatrutide') ||
    combined.includes('tirzepatide') ||
    combined.includes('semaglutide') ||
    combined.includes('subq')
  ) {
    return 'peptides'
  }

  // 2. Thermal & Environmental (Cold Plunge, Sauna, Cryo, Heat)
  if (
    nameLower.includes('cold plunge') ||
    nameLower.includes('ice bath') ||
    nameLower.includes('cryo') ||
    nameLower.includes('sauna') ||
    nameLower.includes('heat exposure') ||
    nameLower.includes('contrast') ||
    combined.includes('photobio') ||
    combined.includes('red light') ||
    combined.includes('hbot')
  ) {
    return 'thermal'
  }

  // 3. Hydration & Water Balance (Radiant Emerald / Mint)
  if (
    nameLower.includes('hydration') ||
    nameLower.includes('water') ||
    nameLower.includes('hydrate')
  ) {
    return 'nutrition'
  }

  // 4. Supplements & Nutraceuticals (Specific distinct category!)
  if (
    catLower.includes('supplement') ||
    typeLower.includes('supplement') ||
    nameLower.includes('supplement') ||
    nameLower.includes('pill') ||
    nameLower.includes('capsule') ||
    nameLower.includes('tablet') ||
    nameLower.includes('magnesium') ||
    nameLower.includes('creatine') ||
    nameLower.includes('omega') ||
    nameLower.includes('vitamin') ||
    nameLower.includes('nmn') ||
    nameLower.includes('nad+') ||
    nameLower.includes('nad ') ||
    nameLower.includes('coq10') ||
    nameLower.includes('fisetin') ||
    nameLower.includes('quercetin') ||
    nameLower.includes('curcumin') ||
    nameLower.includes('zinc') ||
    nameLower.includes('ashwagandha') ||
    nameLower.includes('theanine') ||
    nameLower.includes('apigenin') ||
    nameLower.includes('glycine') ||
    nameLower.includes('taurine') ||
    nameLower.includes('sulforaphane') ||
    nameLower.includes('resveratrol') ||
    nameLower.includes('electrolytes') ||
    nameLower.includes('stack')
  ) {
    return 'supplements'
  }

  // 4. Fitness & Physical Training
  if (
    catLower.includes('fitness') ||
    catLower.includes('exercise') ||
    catLower.includes('strength') ||
    catLower.includes('cardio') ||
    catLower.includes('physical') ||
    nameLower.includes('workout') ||
    nameLower.includes('lift') ||
    nameLower.includes('dumbbell') ||
    nameLower.includes('training') ||
    nameLower.includes('zone 2') ||
    nameLower.includes('sprint') ||
    nameLower.includes('vilpa') ||
    nameLower.includes('calisthenic') ||
    nameLower.includes('stretch') ||
    nameLower.includes('mobility') ||
    nameLower.includes('yoga')
  ) {
    return 'fitness'
  }

  // 5. Sleep & Circadian
  if (
    catLower.includes('sleep') ||
    catLower.includes('circadian') ||
    nameLower.includes('sleep') ||
    nameLower.includes('circadian') ||
    nameLower.includes('wind down') ||
    nameLower.includes('wind_down') ||
    nameLower.includes('bedtime') ||
    nameLower.includes('mouth tape') ||
    nameLower.includes('dark room') ||
    nameLower.includes('sunlight')
  ) {
    return 'sleep'
  }

  // 6. Mind, Nervous System & Recovery
  if (
    catLower.includes('mind') ||
    catLower.includes('nervous') ||
    catLower.includes('mental') ||
    catLower.includes('cognitive') ||
    nameLower.includes('breath') ||
    nameLower.includes('sigh') ||
    nameLower.includes('meditat') ||
    nameLower.includes('nsdr') ||
    nameLower.includes('nidra') ||
    nameLower.includes('vagal') ||
    nameLower.includes('nootropic')
  ) {
    return 'mind'
  }

  // 7. Diagnostics & Biomarkers
  if (
    catLower.includes('diagnostic') ||
    catLower.includes('biomarker') ||
    catLower.includes('tracking') ||
    catLower.includes('lab') ||
    catLower.includes('screening') ||
    nameLower.includes('cgm') ||
    nameLower.includes('glucose monitor') ||
    nameLower.includes('blood') ||
    nameLower.includes('dexa')
  ) {
    return 'diagnostics'
  }

  // 8. Nutrition & Diet (Food, meals, fasting, TRE, caloric restriction)
  if (
    catLower.includes('nutrition') ||
    catLower.includes('diet') ||
    catLower.includes('fasting') ||
    typeLower.includes('fasting') ||
    nameLower.includes('fast') ||
    nameLower.includes('omad') ||
    nameLower.includes('16:8') ||
    nameLower.includes('tre') ||
    nameLower.includes('meal') ||
    nameLower.includes('evoo') ||
    nameLower.includes('olive oil') ||
    nameLower.includes('protein') ||
    nameLower.includes('calori')
  ) {
    return 'nutrition'
  }

  return 'other'
}

/**
 * Returns complete color styling config for any task or modality
 */
export function getModalityTheme(modalityOrTask?: any): ModalityColorTheme {
  const type = getModalityMacroType(modalityOrTask)
  return MODALITY_COLOR_THEMES[type]
}

/**
 * High-contrast category label color adapted for theme mode
 */
export function getModalityLabelColor(theme: ModalityColorTheme, isLight: boolean): string {
  if (!isLight) return theme.colorHex
  const darkCategoryColors: Record<ModalityMacroType, string> = {
    supplements: '#B45309', // Amber 700
    peptides: '#A21CAF',    // Fuchsia 700
    fitness: '#B91C1C',     // Red 700
    nutrition: '#047857',   // Emerald 700
    sleep: '#7E22CE',       // Purple 700
    mind: '#1D4ED8',        // Blue 700
    thermal: '#0E7490',     // Cyan 700
    diagnostics: '#4338CA', // Indigo 700
    other: '#0F766E'        // Teal 700
  }
  return darkCategoryColors[theme.type] || theme.colorHex
}

/**
 * High-contrast modality title text color
 * In Light mode: #0F172A (slate-900 / dark charcoal)
 * In Dark mode: #FFFFFF (pure crisp white)
 */
export function getModalityTitleColor(isLight: boolean): string {
  return isLight ? '#0F172A' : '#FFFFFF'
}

/**
 * High-contrast dosage text color
 * In Light mode: #334155 (slate-700)
 * In Dark mode: #CBD5E1 (slate-300)
 */
export function getModalityDoseColor(isLight: boolean): string {
  return isLight ? '#334155' : '#CBD5E1'
}

export interface DaylightCategoryStyle {
  textHex: string
  bgHex: string
  label: string
  iconContainerClass: string
  badgeClass: string
}

/**
 * Daylight Art-Direction Category Style (Exact tokens from design brief)
 * - Completion / Nutrition: #2B725C on #E6F3EB
 * - Hydration: #236F92 on #EAF5FA
 * - Sunlight: #8A610E on #FBF2D9
 * - Movement: #A05238 on #F9ECE4
 * - Supplements: #765DB4 on #F0ECF9
 */
export function getDaylightCategoryStyle(modalityOrTask?: any): DaylightCategoryStyle {
  const modName = (
    modalityOrTask?.display_name ||
    modalityOrTask?.name ||
    modalityOrTask?.custom_name ||
    modalityOrTask?.execution_details?.custom_name ||
    modalityOrTask?.execution_details?.modality_name ||
    modalityOrTask?.protocol_step?.title ||
    modalityOrTask?.title ||
    ''
  ).toLowerCase()
  const cat = (modalityOrTask?.category || modalityOrTask?.modality_type || '').toLowerCase()
  const combined = `${modName} ${cat}`

  // 1. Water / Hydration / Thermal Cold
  if (
    combined.includes('water') ||
    combined.includes('hydrate') ||
    combined.includes('hydration') ||
    combined.includes('electrolyte') ||
    combined.includes('plunge') ||
    combined.includes('ice bath') ||
    combined.includes('cryo') ||
    combined.includes('cold')
  ) {
    return {
      textHex: '#0EA5E9',
      bgHex: '#E0F2FE',
      label: 'Hydration',
      iconContainerClass: 'bg-[#E0F2FE] text-[#0EA5E9]',
      badgeClass: 'bg-[#E0F2FE] text-[#0EA5E9] border-[#0EA5E9]/20'
    }
  }

  // 2. Sunlight / Circadian / Light & Rhythm / Thermal Heat
  if (
    combined.includes('sunlight') ||
    combined.includes('sun ') ||
    combined.includes('circadian') ||
    combined.includes('light') ||
    combined.includes('solar') ||
    combined.includes('dawn') ||
    combined.includes('sauna') ||
    combined.includes('heat')
  ) {
    return {
      textHex: '#F59E0B',
      bgHex: '#FEF3C7',
      label: 'Light & Rhythm',
      iconContainerClass: 'bg-[#FEF3C7] text-[#F59E0B]',
      badgeClass: 'bg-[#FEF3C7] text-[#F59E0B] border-[#F59E0B]/20'
    }
  }

  // 3. Movement / Fitness / Exercise / Cardio
  if (
    combined.includes('fitness') ||
    combined.includes('strength') ||
    combined.includes('workout') ||
    combined.includes('training') ||
    combined.includes('lift') ||
    combined.includes('cardio') ||
    combined.includes('zone 2') ||
    combined.includes('vo2') ||
    combined.includes('hiit') ||
    combined.includes('walk') ||
    combined.includes('exercise') ||
    combined.includes('running') ||
    combined.includes('mobility') ||
    combined.includes('calisthenic')
  ) {
    return {
      textHex: '#F43F5E',
      bgHex: '#FFE4E6',
      label: 'Movement',
      iconContainerClass: 'bg-[#FFE4E6] text-[#F43F5E]',
      badgeClass: 'bg-[#FFE4E6] text-[#F43F5E] border-[#F43F5E]/20'
    }
  }

  // 4. Peptides & Bioactives
  if (
    combined.includes('peptide') ||
    combined.includes('bpc') ||
    combined.includes('tb-500') ||
    combined.includes('tb500') ||
    combined.includes('cjc') ||
    combined.includes('ipamorelin') ||
    combined.includes('ghk') ||
    combined.includes('epithalon') ||
    combined.includes('mots-c') ||
    combined.includes('subq')
  ) {
    return {
      textHex: '#EC4899',
      bgHex: '#FCE7F3',
      label: 'Peptides',
      iconContainerClass: 'bg-[#FCE7F3] text-[#EC4899]',
      badgeClass: 'bg-[#FCE7F3] text-[#EC4899] border-[#EC4899]/20'
    }
  }

  // 5. Sleep & Circadian Rest
  if (
    combined.includes('sleep') ||
    combined.includes('bed') ||
    combined.includes('rem sleep') ||
    combined.includes('wind down') ||
    combined.includes('mouth tape')
  ) {
    return {
      textHex: '#A855F7',
      bgHex: '#F3E8FF',
      label: 'Sleep',
      iconContainerClass: 'bg-[#F3E8FF] text-[#A855F7]',
      badgeClass: 'bg-[#F3E8FF] text-[#A855F7] border-[#A855F7]/20'
    }
  }

  // 6. Mind & Nervous System / Breathwork
  if (
    combined.includes('mind') ||
    combined.includes('meditat') ||
    combined.includes('breath') ||
    combined.includes('nsdr') ||
    combined.includes('focus') ||
    combined.includes('brain')
  ) {
    return {
      textHex: '#3B82F6',
      bgHex: '#DBEAFE',
      label: 'Mind',
      iconContainerClass: 'bg-[#DBEAFE] text-[#3B82F6]',
      badgeClass: 'bg-[#DBEAFE] text-[#3B82F6] border-[#3B82F6]/20'
    }
  }

  // 7. Supplements & Nutraceuticals & Nootropics
  if (
    combined.includes('supplement') ||
    combined.includes('vitamin') ||
    combined.includes('stack') ||
    combined.includes('magnesium') ||
    combined.includes('creatine') ||
    combined.includes('omega') ||
    combined.includes('nmn') ||
    combined.includes('nad') ||
    combined.includes('fisetin') ||
    combined.includes('quercetin') ||
    combined.includes('theanine') ||
    combined.includes('ashwagandha') ||
    combined.includes('apigenin') ||
    combined.includes('pill') ||
    combined.includes('capsule')
  ) {
    return {
      textHex: '#8B5CF6',
      bgHex: '#EDE9FE',
      label: 'Supplements',
      iconContainerClass: 'bg-[#EDE9FE] text-[#8B5CF6]',
      badgeClass: 'bg-[#EDE9FE] text-[#8B5CF6] border-[#8B5CF6]/20'
    }
  }

  // 8. Diagnostics & Biomarkers
  if (
    combined.includes('scan') ||
    combined.includes('dexa') ||
    combined.includes('mri') ||
    combined.includes('panel') ||
    combined.includes('cpet') ||
    combined.includes('clock') ||
    combined.includes('diagnostic')
  ) {
    return {
      textHex: '#6366F1',
      bgHex: '#EEF2FF',
      label: 'Diagnostics',
      iconContainerClass: 'bg-[#EEF2FF] text-[#6366F1]',
      badgeClass: 'bg-[#EEF2FF] text-[#6366F1] border-[#6366F1]/20'
    }
  }

  // 9. Nutrition / Meals / Fasting (Default fallback: Fresh Pastel Emerald)
  return {
    textHex: '#10B981',
    bgHex: '#D1FAE5',
    label: 'Nutrition',
    iconContainerClass: 'bg-[#D1FAE5] text-[#10B981]',
    badgeClass: 'bg-[#D1FAE5] text-[#10B981] border-[#10B981]/20'
  }
}
