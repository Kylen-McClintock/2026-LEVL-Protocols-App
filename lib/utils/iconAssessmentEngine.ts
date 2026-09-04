/**
 * Smart Icon & Color Assessment Engine
 * 
 * Intelligently assesses newly created modalities and protocols to determine:
 * 1. Whether it strongly matches an existing system icon/glyph (e.g. ColdPlunge, Sauna, PeptideSyringe, etc.)
 * 2. Or whether a new distinct icon and tailored luminous color should be created/assigned.
 */

export interface IconAssessmentResult {
  isExistingMatch: boolean
  iconName: string
  matchReason: string
  colorHex: string
  badgeColor: string
  suggestedGlyphOrComponent: string
}

export interface IconOption {
  name: string
  label: string
  category: 'existing' | 'new'
  description: string
}

export const ICON_COLOR_PRESETS = [
  { label: 'Ice Cyan', hex: '#38BDF8', glow: 'rgba(56, 189, 248, 0.75)' },
  { label: 'Vital Mint', hex: '#34D399', glow: 'rgba(52, 211, 153, 0.75)' },
  { label: 'Solar Amber', hex: '#FBBF24', glow: 'rgba(251, 191, 36, 0.75)' },
  { label: 'Ember Coral', hex: '#FB923C', glow: 'rgba(251, 146, 60, 0.75)' },
  { label: 'Electric Violet', hex: '#C084FC', glow: 'rgba(192, 132, 252, 0.75)' },
  { label: 'Bioactive Fuchsia', hex: '#E879F9', glow: 'rgba(232, 121, 249, 0.75)' },
  { label: 'Moonlight Periwinkle', hex: '#818CF8', glow: 'rgba(129, 140, 248, 0.75)' },
  { label: 'High-Tech Cyan', hex: '#22D3EE', glow: 'rgba(34, 211, 238, 0.75)' },
  { label: 'Rose Vitality', hex: '#FB7185', glow: 'rgba(251, 113, 133, 0.75)' },
  { label: 'Royal Indigo', hex: '#6366F1', glow: 'rgba(99, 102, 241, 0.75)' },
]

export const AVAILABLE_ICONS: IconOption[] = [
  // Existing Glyphs in System
  { name: 'ColdPlunge', label: 'Cold Plunge / Cryo', category: 'existing', description: 'Deep plunge tub with ice crystal' },
  { name: 'Sauna', label: 'Finnish Sauna', category: 'existing', description: 'Volcanic stone stove & löyly steam' },
  { name: 'PeptideSyringe', label: 'Peptide / Injectable', category: 'existing', description: 'Precision subQ medical syringe' },
  { name: 'Dumbbell', label: 'Resistance Training', category: 'existing', description: 'Strength & hypertrophy lifting' },
  { name: 'Handstand', label: 'Handstand / Inversion', category: 'existing', description: 'Gymnast balance & spinal decompression' },
  { name: 'Calisthenics', label: 'Calisthenics / Pull-Ups', category: 'existing', description: 'Bodyweight strength mastery' },
  { name: 'Breathwork', label: 'Breathwork / Lungs', category: 'existing', description: 'Anatomical lungs & airway corridors' },
  { name: 'Meditation', label: 'Meditation / Mindfulness', category: 'existing', description: 'Seated zen lotus posture' },
  { name: 'NSDR', label: 'NSDR / Yoga Nidra', category: 'existing', description: 'Somatic alpha-wave deep relaxation' },
  { name: 'Zone2', label: 'Zone 2 Cardio', category: 'existing', description: 'Heart coupled with steady metabolic rhythm' },
  { name: 'VILPA', label: 'VILPA / Sprint Burst', category: 'existing', description: 'High-velocity sprint acceleration' },
  { name: 'Mobility', label: 'Mobility & Stretching', category: 'existing', description: 'Full-range extension flexibility' },
  { name: 'RedLight', label: 'Red Light / PBM', category: 'existing', description: 'Photobiomodulation panel & rays' },
  { name: 'Fasting', label: '16:8 Fasting / TRE', category: 'existing', description: 'Plate with 16:8 time-restricted partition' },
  { name: 'HBOT', label: 'Hyperbaric Chamber', category: 'existing', description: 'Pressurized oxygen capsule' },
  { name: 'CGM', label: 'CGM Biosensor', category: 'existing', description: 'Wearable glucose/ketone telemetry patch' },
  { name: 'Atom', label: 'Cellular Bioenergetics', category: 'existing', description: 'Mitochondria, NAD+, NMN, CoQ10' },
  { name: 'Brain', label: 'Cognitive / Nootropic', category: 'existing', description: 'Neural focus & mental acuity' },
  { name: 'Moon', label: 'Sleep & Night Rest', category: 'existing', description: 'Circadian darkness & sleep minerals' },
  { name: 'Scale', label: 'Metabolic & Glucose', category: 'existing', description: 'Metabolic balance & insulin sensitizers' },
  { name: 'HeartPulse', label: 'Cardiovascular Health', category: 'existing', description: 'Heart, ApoB, omega-3, nitric oxide' },
  { name: 'Flame', label: 'Adaptogens & Vitality', category: 'existing', description: 'Hormonal axis, ashwagandha, cordyceps' },
  { name: 'Shield', label: 'Cellular Defense', category: 'existing', description: 'Cytoprotection, sulforaphane, rapamycin' },
  { name: 'Sun', label: 'Sunlight & Vitamins', category: 'existing', description: 'Vitamin D3, K2, methylation' },
  { name: 'Pill', label: 'Nutraceutical / Stack', category: 'existing', description: 'General oral supplement capsules' },

  // New Extended Icons
  { name: 'Waves', label: 'Acoustic / PEMF Waves', category: 'new', description: 'Vibroacoustic sound healing & frequency' },
  { name: 'Compass', label: 'Circadian Navigation', category: 'new', description: 'Time-zone shifts & chronobiology alignment' },
  { name: 'Target', label: 'Precision Intervention', category: 'new', description: 'Laser-focused acute longevity therapy' },
  { name: 'Wind', label: 'Respiratory & Hypoxia', category: 'new', description: 'Airflow, altitude simulation & pure O2' },
  { name: 'ShieldAlert', label: 'Immune Resilience', category: 'new', description: 'Acute immune defense & inflammation reset' },
  { name: 'Sparkle', label: 'Aesthetics & Skin', category: 'new', description: 'Collagen remodeling & epidermal healthspan' },
  { name: 'Layers', label: 'Synergistic Protocol Stack', category: 'new', description: 'Multi-modality integrated protocol stack' },
  { name: 'Radio', label: 'Bio-Electric / Rife', category: 'new', description: 'Frequency resonance & electromedicine' },
  { name: 'Eye', label: 'Ocular / Vision Care', category: 'new', description: 'Vision training & blue light hygiene' },
  { name: 'Zap', label: 'Bio-Electric Stimulation', category: 'new', description: 'EMS, tDCS, nervous system activation' },
  { name: 'Thermometer', label: 'Thermal Regulation', category: 'new', description: 'Body temp modulation & hormesis' },
]

/**
 * Assesses input text for a modality or protocol and returns whether it matches
 * an existing system glyph or assigns a distinct new icon + color.
 */
export function assessModalityOrProtocol(params: {
  name: string
  category?: string
  description?: string
  outcomes?: string[]
  type?: 'modality' | 'protocol'
}): IconAssessmentResult {
  const nameLower = (params.name || '').toLowerCase().trim()
  const catLower = (params.category || '').toLowerCase().trim()
  const descLower = (params.description || '').toLowerCase().trim()
  const outcomesLower = (params.outcomes || []).map(o => o.toLowerCase()).join(' ')
  const combined = `${nameLower} ${catLower} ${descLower} ${outcomesLower}`

  // Protocols special check
  if (params.type === 'protocol' && (nameLower.includes('stack') || nameLower.includes('protocol') || nameLower.includes('bundle') || nameLower.includes('blueprint'))) {
    return {
      isExistingMatch: false,
      iconName: 'Layers',
      matchReason: 'Assigned new multi-layered protocol stack icon',
      colorHex: '#6366F1',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      suggestedGlyphOrComponent: 'Layers'
    }
  }

  // 1. PEPTIDES & INJECTABLES (Existing Match)
  if (
    catLower.includes('peptide') ||
    catLower.includes('injectable') ||
    combined.includes('bpc') ||
    combined.includes('tb-500') ||
    combined.includes('cjc') ||
    combined.includes('ipamorelin') ||
    combined.includes('ghk') ||
    combined.includes('epithalon') ||
    combined.includes('mots-c') ||
    combined.includes('subq') ||
    combined.includes('syringe') ||
    combined.includes('semaglutide') ||
    combined.includes('tirzepatide')
  ) {
    return {
      isExistingMatch: true,
      iconName: 'PeptideSyringe',
      matchReason: 'Matched existing medical peptide & injectable glyph',
      colorHex: '#E879F9',
      badgeColor: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40',
      suggestedGlyphOrComponent: 'PeptideSyringeGlyph'
    }
  }

  // 2. THERMAL COLD (Existing Match)
  if (
    nameLower.includes('cold plunge') ||
    nameLower.includes('ice bath') ||
    nameLower.includes('cryotherapy') ||
    nameLower.includes('cold water') ||
    nameLower.includes('cold immersion')
  ) {
    return {
      isExistingMatch: true,
      iconName: 'ColdPlunge',
      matchReason: 'Matched existing Cold Plunge / Cryo tub glyph',
      colorHex: '#38BDF8',
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      suggestedGlyphOrComponent: 'ColdPlungeGlyph'
    }
  }

  // 3. THERMAL HEAT (Existing Match)
  if (
    nameLower.includes('sauna') ||
    nameLower.includes('infrared sauna') ||
    nameLower.includes('finnish sauna') ||
    nameLower.includes('hyperthermic')
  ) {
    return {
      isExistingMatch: true,
      iconName: 'Sauna',
      matchReason: 'Matched existing Finnish Sauna stove & löyly glyph',
      colorHex: '#FB923C',
      badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
      suggestedGlyphOrComponent: 'DetailedSaunaGlyph'
    }
  }

  // 4. SPECIALTY CLINICAL PROCEDURES (Existing Match)
  if (combined.includes('hbot') || combined.includes('hyperbaric') || combined.includes('oxygen chamber')) {
    return {
      isExistingMatch: true,
      iconName: 'HBOT',
      matchReason: 'Matched existing Hyperbaric Capsule Chamber glyph',
      colorHex: '#22D3EE',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      suggestedGlyphOrComponent: 'HBOTGlyph'
    }
  }

  if (combined.includes('cgm') || combined.includes('continuous glucose') || combined.includes('glucose monitor')) {
    return {
      isExistingMatch: true,
      iconName: 'CGM',
      matchReason: 'Matched existing Continuous Glucose Monitor glyph',
      colorHex: '#22D3EE',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      suggestedGlyphOrComponent: 'CGMGlyph'
    }
  }

  // 5. BREATHWORK (Existing Match)
  if (
    nameLower.includes('breath') ||
    nameLower.includes('sigh') ||
    nameLower.includes('4-7-8') ||
    nameLower.includes('box breath') ||
    nameLower.includes('wim hof') ||
    nameLower.includes('pranayama')
  ) {
    return {
      isExistingMatch: true,
      iconName: 'Breathwork',
      matchReason: 'Matched existing Anatomical Lungs & Breathwork glyph',
      colorHex: '#C084FC',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      suggestedGlyphOrComponent: 'BreathworkGlyph'
    }
  }

  // 6. FASTING (Existing Match)
  if (combined.includes('fasting') || combined.includes('16:8') || combined.includes('omad') || combined.includes('tre') || combined.includes('autophagy')) {
    return {
      isExistingMatch: true,
      iconName: 'Fasting',
      matchReason: 'Matched existing 16:8 Time-Restricted Eating glyph',
      colorHex: '#FBBF24',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      suggestedGlyphOrComponent: 'FastingGlyph'
    }
  }

  // 7. RED LIGHT (Existing Match)
  if (combined.includes('red light') || combined.includes('photobio') || combined.includes('pbm') || combined.includes('near-infrared')) {
    return {
      isExistingMatch: true,
      iconName: 'RedLight',
      matchReason: 'Matched existing Photobiomodulation panel glyph',
      colorHex: '#F87171',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      suggestedGlyphOrComponent: 'RedLightGlyph'
    }
  }

  // 8. FITNESS & MOVEMENT (Existing Matches)
  if (combined.includes('handstand') || combined.includes('inversion')) {
    return {
      isExistingMatch: true,
      iconName: 'Handstand',
      matchReason: 'Matched existing Handstand Balance glyph',
      colorHex: '#34D399',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      suggestedGlyphOrComponent: 'HandstandGlyph'
    }
  }

  if (combined.includes('pull-up') || combined.includes('push-up') || combined.includes('calisthenic') || combined.includes('bodyweight')) {
    return {
      isExistingMatch: true,
      iconName: 'Calisthenics',
      matchReason: 'Matched existing Calisthenics & Bodyweight glyph',
      colorHex: '#34D399',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      suggestedGlyphOrComponent: 'CalisthenicsGlyph'
    }
  }

  if (combined.includes('zone 2') || combined.includes('aerobic base') || combined.includes('vo2 max')) {
    return {
      isExistingMatch: true,
      iconName: 'Zone2',
      matchReason: 'Matched existing Zone 2 Aerobic Rhythm glyph',
      colorHex: '#34D399',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      suggestedGlyphOrComponent: 'Zone2Glyph'
    }
  }

  if (combined.includes('vilpa') || combined.includes('sprint') || combined.includes('interval')) {
    return {
      isExistingMatch: true,
      iconName: 'VILPA',
      matchReason: 'Matched existing VILPA Sprint Burst glyph',
      colorHex: '#FBBF24',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      suggestedGlyphOrComponent: 'VILPAGlyph'
    }
  }

  if (combined.includes('stretch') || combined.includes('mobility') || combined.includes('yoga') || combined.includes('foam roll')) {
    return {
      isExistingMatch: true,
      iconName: 'Mobility',
      matchReason: 'Matched existing Dynamic Flexibility & Mobility glyph',
      colorHex: '#38BDF8',
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      suggestedGlyphOrComponent: 'MobilityGlyph'
    }
  }

  if (
    combined.includes('strength') ||
    combined.includes('weight') ||
    combined.includes('dumbbell') ||
    combined.includes('barbell') ||
    combined.includes('lift') ||
    combined.includes('hypertrophy') ||
    catLower.includes('fitness')
  ) {
    return {
      isExistingMatch: true,
      iconName: 'Dumbbell',
      matchReason: 'Matched existing Strength & Resistance training icon',
      colorHex: '#34D399',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      suggestedGlyphOrComponent: 'Dumbbell'
    }
  }

  // 9. CELLULAR & NUTRACEUTICAL (Existing Matches)
  if (
    combined.includes('nmn') ||
    combined.includes('nad') ||
    combined.includes('coq10') ||
    combined.includes('creatine') ||
    combined.includes('mitochondria') ||
    combined.includes('cellular')
  ) {
    return {
      isExistingMatch: true,
      iconName: 'Atom',
      matchReason: 'Matched existing Cellular Bioenergetics & Mitochondria icon',
      colorHex: '#38BDF8',
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      suggestedGlyphOrComponent: 'Atom'
    }
  }

  if (combined.includes('nootropic') || combined.includes('cognition') || combined.includes('focus') || combined.includes('lion') || combined.includes('brain')) {
    return {
      isExistingMatch: true,
      iconName: 'Brain',
      matchReason: 'Matched existing Cognitive Performance & Nootropic icon',
      colorHex: '#C084FC',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      suggestedGlyphOrComponent: 'Brain'
    }
  }

  if (combined.includes('sleep') || combined.includes('magnesium') || combined.includes('apigenin') || combined.includes('melatonin') || combined.includes('bedtime')) {
    return {
      isExistingMatch: true,
      iconName: 'Moon',
      matchReason: 'Matched existing Sleep & Restorative Rest icon',
      colorHex: '#818CF8',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      suggestedGlyphOrComponent: 'Moon'
    }
  }

  // 10. NOVEL MODALITY / ASSIGN NEW DISTINCT ICON
  // Evaluate semantic characteristics to pick a tailored NEW icon and color:
  if (combined.includes('sound') || combined.includes('acoustic') || combined.includes('frequency') || combined.includes('vibration') || combined.includes('pemf') || combined.includes('resonance')) {
    return {
      isExistingMatch: false,
      iconName: 'Waves',
      matchReason: 'Assigned new distinct Vibroacoustic & Frequency wave icon',
      colorHex: '#C084FC',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      suggestedGlyphOrComponent: 'Waves'
    }
  }

  if (combined.includes('circadian') || combined.includes('travel') || combined.includes('jet lag') || combined.includes('shift work')) {
    return {
      isExistingMatch: false,
      iconName: 'Compass',
      matchReason: 'Assigned new distinct Circadian Navigation & Alignment icon',
      colorHex: '#FBBF24',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      suggestedGlyphOrComponent: 'Compass'
    }
  }

  if (combined.includes('air') || combined.includes('oxygen') || combined.includes('hypoxia') || combined.includes('altitude') || combined.includes('ozone')) {
    return {
      isExistingMatch: false,
      iconName: 'Wind',
      matchReason: 'Assigned new distinct Atmospheric & Hypoxia icon',
      colorHex: '#38BDF8',
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      suggestedGlyphOrComponent: 'Wind'
    }
  }

  if (combined.includes('skin') || combined.includes('collagen') || combined.includes('derma') || combined.includes('beauty') || combined.includes('hair')) {
    return {
      isExistingMatch: false,
      iconName: 'Sparkle',
      matchReason: 'Assigned new distinct Aesthetic & Epidermal healthspan icon',
      colorHex: '#FB7185',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      suggestedGlyphOrComponent: 'Sparkle'
    }
  }

  if (combined.includes('immune') || combined.includes('infection') || combined.includes('vaccine') || combined.includes('shield')) {
    return {
      isExistingMatch: false,
      iconName: 'ShieldAlert',
      matchReason: 'Assigned new distinct Immune Resilience & Defense icon',
      colorHex: '#10B981',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      suggestedGlyphOrComponent: 'ShieldAlert'
    }
  }

  if (combined.includes('eye') || combined.includes('vision') || combined.includes('retina') || combined.includes('cataract')) {
    return {
      isExistingMatch: false,
      iconName: 'Eye',
      matchReason: 'Assigned new distinct Ocular & Visual Acuity icon',
      colorHex: '#38BDF8',
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      suggestedGlyphOrComponent: 'Eye'
    }
  }

  if (combined.includes('electric') || combined.includes('ems') || combined.includes('tdcs') || combined.includes('tens')) {
    return {
      isExistingMatch: false,
      iconName: 'Zap',
      matchReason: 'Assigned new distinct Bio-Electric Stimulation icon',
      colorHex: '#FBBF24',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      suggestedGlyphOrComponent: 'Zap'
    }
  }

  // Category-based fallback for new distinct modalities
  if (catLower.includes('mind') || catLower.includes('mental')) {
    return {
      isExistingMatch: false,
      iconName: 'Target',
      matchReason: 'Assigned new distinct Mental Acuity & Focus Target icon',
      colorHex: '#C084FC',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      suggestedGlyphOrComponent: 'Target'
    }
  }

  if (catLower.includes('supplement') || catLower.includes('nutrition')) {
    return {
      isExistingMatch: false,
      iconName: 'Pill',
      matchReason: 'Assigned standard Nutraceutical Capsule icon',
      colorHex: '#34D399',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      suggestedGlyphOrComponent: 'Pill'
    }
  }

  // Default novel protocol / modality assignment
  return {
    isExistingMatch: false,
    iconName: 'Target',
    matchReason: 'Assigned new distinct Precision Longevity Target icon',
    colorHex: '#38BDF8',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    suggestedGlyphOrComponent: 'Target'
  }
}
