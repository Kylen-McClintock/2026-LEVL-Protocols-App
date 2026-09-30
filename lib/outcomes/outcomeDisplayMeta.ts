import { UserProfile } from '@/lib/types'
import { ALL_SCHEMA_CHECKIN_OUTCOMES } from '@/components/ui/ViewSelectorHeader'

export interface OutcomeDisplayMeta {
  id: string
  displayName: string
  shortLabel: string
  description: string
  icon?: string
  biomarkers?: string[]
  isLongevityVector: boolean
}

/**
 * Universal helper that resolves any raw outcome key or longevity vector into
 * a formatted, human-friendly title, description, and sex-appropriate terminology.
 */
export function resolveOutcomeDisplayMeta(
  rawKeyOrName: string,
  userProfile?: UserProfile | null
): OutcomeDisplayMeta {
  const norm = (rawKeyOrName || '').toLowerCase().replace(/[\s-]/g, '_').trim()
  const isFemale = userProfile?.biological_sex?.toLowerCase() === 'female'

  // 1. Hormone / Endocrine Vector Check (Sex-specific adaptation)
  if (
    norm === 'testosterone' ||
    norm.includes('testoster') ||
    norm.includes('hormon') ||
    norm.includes('androgen') ||
    norm.includes('endocrine')
  ) {
    if (isFemale) {
      return {
        id: 'testosterone',
        displayName: 'Hormone Balance & Vitality',
        shortLabel: 'Hormone Balance',
        description: 'Optimal estrogen, progesterone, and balanced androgen levels for vitality, metabolic health, and endocrine stability.',
        icon: '⚡',
        biomarkers: ['Estradiol (E2)', 'Progesterone', 'DHEA-S', 'Free Testosterone', 'FSH/LH'],
        isLongevityVector: true
      }
    }

    return {
      id: 'testosterone',
      displayName: 'Hormone Balance & Androgens',
      shortLabel: 'Hormone Balance',
      description: 'Physiological hormone balance, free testosterone, and endocrine vitality.',
      icon: '⚡',
      biomarkers: ['Total Testosterone', 'Free Testosterone', 'Morning Cortisol', 'DHEA-S'],
      isLongevityVector: true
    }
  }

  // 2. Canonical Biological Longevity Vectors
  if (norm === 'heart_health' || norm.includes('heart') || norm.includes('cardio')) {
    return {
      id: 'heart_health',
      displayName: 'Cardiovascular & Heart Health',
      shortLabel: 'Heart Health',
      description: 'VO2 max, arterial elasticity, endothelial nitric oxide, and low atherogenic particle burden (ApoB).',
      icon: '❤️',
      biomarkers: ['ApoB', 'VO2 Max', 'High-Sensitivity Troponin', 'Resting Heart Rate'],
      isLongevityVector: true
    }
  }

  if (norm === 'brain_longevity' || norm.includes('brain_longev') || norm.includes('neuroprotect')) {
    return {
      id: 'brain_longevity',
      displayName: 'Brain Health & Neuroprotection',
      shortLabel: 'Brain Longevity',
      description: 'Prefrontal BDNF, glymphatic neuro-waste clearance, slow-wave sleep, and autonomic HRV.',
      icon: '🧠',
      biomarkers: ['BDNF', 'High-Frequency HRV', 'Deep Sleep Duration'],
      isLongevityVector: true
    }
  }

  if (norm === 'metabolic_health' || norm.includes('metabol') || norm.includes('blood_sugar')) {
    return {
      id: 'metabolic_health',
      displayName: 'Metabolic & Glycemic Health',
      shortLabel: 'Metabolic Health',
      description: 'Insulin sensitivity, non-insulin GLUT4 glucose uptake, and hepatic AMPK activation.',
      icon: '🔥',
      biomarkers: ['Fasting Insulin', 'HOMA-IR', 'HbA1c', 'CGM Mean'],
      isLongevityVector: true
    }
  }

  if (norm === 'cancer_defense' || norm.includes('cancer') || norm.includes('autophagy')) {
    return {
      id: 'cancer_defense',
      displayName: 'Autophagy & Cancer Defense',
      shortLabel: 'Autophagy & Defense',
      description: 'Macroautophagy flux, senescent zombie cell apoptosis, and SASP suppression.',
      icon: '🛡️',
      biomarkers: ['Fasting Glucagon : Insulin', 'SASP Markers', 'hs-CRP'],
      isLongevityVector: true
    }
  }

  if (norm === 'chronic_inflammation' || norm.includes('inflamm')) {
    return {
      id: 'chronic_inflammation',
      displayName: 'Systemic Inflammation Suppression',
      shortLabel: 'Inflammaging',
      description: 'Suppression of NLRP3 inflammasome, NF-kB nuclear translocation, and IL-6/TNF-alpha.',
      icon: '🧊',
      biomarkers: ['hs-CRP', 'Interleukin-6 (IL-6)', 'TNF-alpha'],
      isLongevityVector: true
    }
  }

  if (norm === 'bone_density' || norm.includes('bone') || norm.includes('skelet')) {
    return {
      id: 'bone_density',
      displayName: 'Bone Density & Skeletal Strength',
      shortLabel: 'Bone & Matrix',
      description: 'Axial osteoblast Piezo1 mechanotransduction, DEXA BMD, and tendon collagen elasticity.',
      icon: '🦴',
      biomarkers: ['DEXA Lumbar T-Score', 'Serum P1NP', 'Tendon Stiffness'],
      isLongevityVector: true
    }
  }

  if (norm === 'cellular_longevity' || norm.includes('cellular_longev') || norm.includes('epigenet')) {
    return {
      id: 'cellular_longevity',
      displayName: 'Cellular Longevity & DNA Repair',
      shortLabel: 'Epigenetic Clocks',
      description: 'DNAmAge Horvath methylation clocks, intracellular NAD+/sirtuins, and telomeric protection.',
      icon: '🧬',
      biomarkers: ['DNAmAge Clock', 'NAD+ : NADH Ratio', 'Telomere Length'],
      isLongevityVector: true
    }
  }

  // 3. Subjective Check-in Dimensions
  const matchedCheckin = ALL_SCHEMA_CHECKIN_OUTCOMES.find(
    o => o.id.toLowerCase() === norm || o.name.toLowerCase() === norm || norm.includes(o.id.toLowerCase())
  )

  if (matchedCheckin) {
    return {
      id: matchedCheckin.id,
      displayName: matchedCheckin.name,
      shortLabel: matchedCheckin.name,
      description: matchedCheckin.description || '',
      icon: matchedCheckin.icon,
      isLongevityVector: false
    }
  }

  // 4. Fallback Capitalization for Custom / Unrecognized Names
  const formatted = rawKeyOrName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())

  return {
    id: norm,
    displayName: formatted,
    shortLabel: formatted,
    description: '',
    isLongevityVector: false
  }
}
