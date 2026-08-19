export const MACRO_CATEGORIES = [
  'Peptides',
  'Nutrition & Supplements',
  'Fitness & Physical',
  'Sleep & Circadian',
  'Mind & Nervous System',
  'Longevity & Cellular',
  'Diagnostics & Tracking'
] as const;

export type MacroCategory = typeof MACRO_CATEGORIES[number];

/**
 * Maps granular database categories to broad UI pills.
 */
export function getMacroCategory(rawCategory?: string, modalityType?: string): MacroCategory | 'Other' {
  const cat = (rawCategory || '').toLowerCase();
  const type = (modalityType || '').toLowerCase();

  if (cat.includes('peptide') || type.includes('peptide') || cat.includes('biologic') || cat.includes('secretagogue')) {
    return 'Peptides';
  }

  if (cat.includes('diagnostic') || cat.includes('tracking') || cat.includes('screening') || type.includes('diagnostic')) {
    return 'Diagnostics & Tracking';
  }

  if (cat.includes('nutrition') || cat.includes('biochemistry') || cat.includes('supplement') || type.includes('supplement')) {
    return 'Nutrition & Supplements';
  }
  
  if (cat.includes('fitness') || cat.includes('cardio') || cat.includes('strength') || cat.includes('physical') || cat.includes('exercise') || cat.includes('movement') || cat.includes('neuromuscular')) {
    return 'Fitness & Physical';
  }

  if (cat.includes('sleep') || cat.includes('circadian') || cat.includes('recovery') || cat.includes('photobiomodulation')) {
    return 'Sleep & Circadian';
  }

  if (cat.includes('mental') || cat.includes('cognitive') || cat.includes('nervous system') || cat.includes('productivity') || cat.includes('well-being') || cat.includes('vagal') || cat.includes('autonomic') || cat.includes('cranial') || cat.includes('airway')) {
    return 'Mind & Nervous System';
  }

  if (cat.includes('cellular') || cat.includes('longevity') || cat.includes('metabolic') || cat.includes('inflammation') || cat.includes('lipid') || cat.includes('environmental stress') || cat.includes('fasting') || cat.includes('autophagy') || cat.includes('hygiene') || cat.includes('systemic') || type.includes('fasting')) {
    return 'Longevity & Cellular';
  }

  return 'Other';
}

export const PROTOCOL_COLORS = [
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
] as const;

export function getColorForProtocol(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return PROTOCOL_COLORS[Math.abs(hash) % PROTOCOL_COLORS.length]
}
