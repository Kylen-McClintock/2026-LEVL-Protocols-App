/**
 * Unified Modality Color & Classification Engine
 * 
 * Provides consistent, high-contrast, beautiful luminous colors across all views:
 * - Supplements: Solar Amber / Gold (#F59E0B)
 * - Peptides: Bioactive Fuchsia / Pink (#E879F9)
 * - Fitness & Movement: Electric Coral / Orange (#F97316)
 * - Nutrition & Fasting: Radiant Emerald / Mint (#10B981)
 * - Sleep & Circadian: Moonlight Indigo / Lavender (#6366F1)
 * - Mind & Nervous System: Electric Violet / Purple (#A855F7)
 * - Thermal & Environmental: Ice Cyan (#06B6D4)
 * - Diagnostics & Tracking: High-Tech Cobalt Blue (#3B82F6)
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
    colorHex: '#F97316', // Electric Coral / Orange
    bgTint: 'rgba(249, 115, 22, 0.16)',
    borderHex: '#F97316',
    borderClass: 'border-orange-500/60',
    badgeBg: 'bg-orange-500/20',
    badgeText: 'text-orange-300',
    badgeBorder: 'border-orange-500/40',
    cardBg: 'bg-orange-950/25',
    textHex: '#FFEDD5'
  },
  nutrition: {
    type: 'nutrition',
    label: 'Nutrition',
    colorHex: '#10B981', // Radiant Emerald
    bgTint: 'rgba(16, 185, 129, 0.16)',
    borderHex: '#10B981',
    borderClass: 'border-emerald-500/60',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-300',
    badgeBorder: 'border-emerald-500/40',
    cardBg: 'bg-emerald-950/25',
    textHex: '#D1FAE5'
  },
  sleep: {
    type: 'sleep',
    label: 'Sleep & Circadian',
    colorHex: '#6366F1', // Moonlight Indigo
    bgTint: 'rgba(99, 102, 241, 0.16)',
    borderHex: '#6366F1',
    borderClass: 'border-indigo-500/60',
    badgeBg: 'bg-indigo-500/20',
    badgeText: 'text-indigo-300',
    badgeBorder: 'border-indigo-500/40',
    cardBg: 'bg-indigo-950/25',
    textHex: '#E0E7FF'
  },
  mind: {
    type: 'mind',
    label: 'Mind & Nervous System',
    colorHex: '#A855F7', // Electric Violet
    bgTint: 'rgba(168, 85, 247, 0.16)',
    borderHex: '#A855F7',
    borderClass: 'border-purple-500/60',
    badgeBg: 'bg-purple-500/20',
    badgeText: 'text-purple-300',
    badgeBorder: 'border-purple-500/40',
    cardBg: 'bg-purple-950/25',
    textHex: '#F3E8FF'
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
    colorHex: '#3B82F6', // Cobalt Blue
    bgTint: 'rgba(59, 130, 246, 0.16)',
    borderHex: '#3B82F6',
    borderClass: 'border-blue-500/60',
    badgeBg: 'bg-blue-500/20',
    badgeText: 'text-blue-300',
    badgeBorder: 'border-blue-500/40',
    cardBg: 'bg-blue-950/25',
    textHex: '#DBEAFE'
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

  // 3. Supplements & Nutraceuticals (Specific distinct category!)
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
