'use client'

import React, { useId } from 'react'
import {
  Dumbbell,
  Bike,
  Footprints,
  Pill,
  Utensils,
  BookOpen,
  Moon,
  Sunrise,
  Droplets,
  BedDouble,
  Brain,
  Syringe,
  Activity,
  Heart,
  Eye,
  Glasses,
  Scale,
  Sparkles,
  Flame,
  Zap,
  Coffee,
  Sun,
  ShieldCheck,
  FlaskConical,
  ScanLine
} from 'lucide-react'

export interface ModalityIconProps {
  modality?: {
    id?: string
    name?: string
    display_name?: string
    category?: string
    modality_type?: string
    icon?: string
    [key: string]: any
  } | null
  modalityName?: string
  category?: string | string[]
  size?: number
  className?: string
  glow?: boolean
}

// ---------------------------------------------------------------------------
// Category Color Palette & Gradients
// ---------------------------------------------------------------------------
interface GradientConfig {
  from: string
  to: string
  glow: string
}

const CATEGORY_GRADIENTS: Record<string, GradientConfig> = {
  // Thermal & Environmental
  thermal_cold: { from: '#38BDF8', to: '#10B981', glow: 'rgba(56, 189, 248, 0.45)' }, // Ice Cyan -> Mint
  thermal_heat: { from: '#F97316', to: '#EF4444', glow: 'rgba(249, 115, 22, 0.45)' }, // Warm Orange -> Crimson
  thermal_contrast: { from: '#06B6D4', to: '#F97316', glow: 'rgba(6, 182, 212, 0.45)' }, // Cold Cyan -> Hot Coral
  
  // Fitness & Movement
  fitness: { from: '#10B981', to: '#06B6D4', glow: 'rgba(16, 185, 129, 0.45)' }, // Vital Emerald -> Cyan
  fitness_intense: { from: '#F59E0B', to: '#EF4444', glow: 'rgba(245, 158, 11, 0.45)' }, // Amber -> Red
  
  // Mind & Nervous System
  mind: { from: '#A855F7', to: '#6366F1', glow: 'rgba(168, 85, 247, 0.45)' }, // Vivid Purple -> Indigo
  
  // Sleep & Circadian
  sleep: { from: '#818CF8', to: '#312E81', glow: 'rgba(129, 140, 248, 0.45)' }, // Indigo -> Deep Midnight
  circadian: { from: '#F59E0B', to: '#38BDF8', glow: 'rgba(245, 158, 11, 0.45)' }, // Sunrise Amber -> Sky Blue
  
  // Nutrition & Metabolic
  nutrition: { from: '#10B981', to: '#F59E0B', glow: 'rgba(16, 185, 129, 0.45)' }, // Emerald -> Golden Amber
  fasting: { from: '#F59E0B', to: '#D97706', glow: 'rgba(245, 158, 11, 0.45)' }, // Golden Amber -> Deep Gold
  
  // Peptides & Bioactives
  peptides: { from: '#C084FC', to: '#EC4899', glow: 'rgba(192, 132, 252, 0.45)' }, // Violet -> Fuchsia Pink
  
  // Diagnostics & Biomarkers
  diagnostics: { from: '#06B6D4', to: '#3B82F6', glow: 'rgba(6, 182, 212, 0.45)' }, // Cyan -> Royal Blue
  
  // Fallback / General Longevity
  default: { from: '#10B981', to: '#06B6D4', glow: 'rgba(16, 185, 129, 0.4)' }
}

function resolveGradient(nameLower: string, catLower: string): GradientConfig {
  // Specific modality-level thermal overrides
  if (nameLower.includes('cold') || nameLower.includes('plunge') || nameLower.includes('ice bath') || nameLower.includes('cryo')) {
    return CATEGORY_GRADIENTS.thermal_cold
  }
  if (nameLower.includes('sauna') || nameLower.includes('hot bath') || nameLower.includes('heat exposure')) {
    return CATEGORY_GRADIENTS.thermal_heat
  }
  if (nameLower.includes('contrast')) {
    return CATEGORY_GRADIENTS.thermal_contrast
  }
  if (nameLower.includes('fast') || nameLower.includes('omad') || nameLower.includes('tre') || nameLower.includes('autophagy')) {
    return CATEGORY_GRADIENTS.fasting
  }
  if (nameLower.includes('hiit') || nameLower.includes('sprint') || nameLower.includes('vilpa') || nameLower.includes('vo2')) {
    return CATEGORY_GRADIENTS.fitness_intense
  }
  if (nameLower.includes('light') || nameLower.includes('sun') || nameLower.includes('photobio') || nameLower.includes('circadian')) {
    return CATEGORY_GRADIENTS.circadian
  }

  // Category matching
  if (catLower.includes('peptide') || catLower.includes('hormone') || catLower.includes('injectable')) {
    return CATEGORY_GRADIENTS.peptides
  }
  if (catLower.includes('thermal') || catLower.includes('recovery')) {
    return CATEGORY_GRADIENTS.thermal_cold
  }
  if (catLower.includes('fitness') || catLower.includes('strength') || catLower.includes('cardio') || catLower.includes('movement') || catLower.includes('exercise')) {
    return CATEGORY_GRADIENTS.fitness
  }
  if (catLower.includes('mind') || catLower.includes('nervous') || catLower.includes('mental') || catLower.includes('breath') || catLower.includes('meditation')) {
    return CATEGORY_GRADIENTS.mind
  }
  if (catLower.includes('sleep') || catLower.includes('circadian') || catLower.includes('wind_down') || catLower.includes('night') || catLower.includes('bed')) {
    return CATEGORY_GRADIENTS.sleep
  }
  if (catLower.includes('nutrition') || catLower.includes('supplement') || catLower.includes('diet') || catLower.includes('food') || catLower.includes('fasting')) {
    return CATEGORY_GRADIENTS.nutrition
  }
  if (catLower.includes('diagnostic') || catLower.includes('biomarker') || catLower.includes('tracking') || catLower.includes('lab') || catLower.includes('scan')) {
    return CATEGORY_GRADIENTS.diagnostics
  }

  return CATEGORY_GRADIENTS.default
}

// ---------------------------------------------------------------------------
// Bespoke Monoline SVG Glyphs (24x24 viewBox, stroke-only, 1.75px stroke)
// ---------------------------------------------------------------------------

/** Cold Plunge / Cold Water Immersion: Deep plunge tub with waterline and floating ice facet */
function ColdPlungeGlyph({ gradId, size }: { gradId: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={`url(#${gradId})`} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {/* Plunge Tub Rim & Base */}
      <path d="M3 11h18" />
      <path d="M4 11v6a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4v-6" />
      {/* Waterline Ripple */}
      <path d="M7 15c1.5-.7 2.5-.7 4 0s2.5.7 4 0" />
      {/* Floating Ice / Cold Crystal Indicator */}
      <path d="M12 4v4" />
      <path d="M10 6l4 0" />
      <path d="M10.5 4.5l3 3" />
      <path d="M13.5 4.5l-3 3" />
    </svg>
  )
}

/** Sauna: Wooden bench slats with rising thermal convective waves */
function SaunaGlyph({ gradId, size }: { gradId: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={`url(#${gradId})`} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {/* Rising Convective Heat / Steam Waves */}
      <path d="M8 4c-.7 1-.7 2 0 3s.7 2 0 3" />
      <path d="M12 3c-.7 1.2-.7 2.3 0 3.5s.7 2.3 0 3.5" />
      <path d="M16 4c-.7 1-.7 2 0 3s.7 2 0 3" />
      {/* Sauna Stepped Cedar Bench */}
      <path d="M4 15h16" />
      <path d="M4 19h16" />
      <path d="M7 15v6" />
      <path d="M17 15v6" />
      {/* Upper Bench Tier */}
      <path d="M11 12h9" />
      <path d="M11 12v3" />
    </svg>
  )
}

/** Contrast Therapy: Dual circulating hot & cold thermodynamic cycle */
function ContrastTherapyGlyph({ gradId, size }: { gradId: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={`url(#${gradId})`} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {/* Left Cold Wave Arc */}
      <path d="M12 3a9 9 0 0 0-9 9c0 2.8 1.3 5.3 3.3 6.9" />
      <path d="M6 19l.5-3.5-3.5.5" />
      {/* Right Hot Wave Arc */}
      <path d="M12 21a9 9 0 0 0 9-9c0-2.8-1.3-5.3-3.3-6.9" />
      <path d="M18 5l-.5 3.5 3.5-.5" />
      {/* Center Dual Thermal Indicator (Ice dot + Flame crest) */}
      <path d="M10 12h4" />
      <path d="M12 10v4" />
    </svg>
  )
}

/** Hot Bath: Soaking tub with warm rising steam ripples */
function HotBathGlyph({ gradId, size }: { gradId: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={`url(#${gradId})`} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h18" />
      <path d="M4 12v5a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4v-5" />
      <path d="M6 21v1" />
      <path d="M18 21v1" />
      {/* Rising gentle steam */}
      <path d="M9 5c-.5.8-.5 1.5 0 2.2s.5 1.5 0 2.2" />
      <path d="M15 5c-.5.8-.5 1.5 0 2.2s.5 1.5 0 2.2" />
    </svg>
  )
}

/** Red Light Therapy / Photobiomodulation: Focused LED panel emitting rays onto a human silhouette */
function RedLightGlyph({ gradId, size }: { gradId: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={`url(#${gradId})`} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {/* Vertical LED Light Panel */}
      <rect x="3" y="4" width="4" height="16" rx="1" />
      <line x1="5" y1="8" x2="5.01" y2="8" strokeWidth="2.5" />
      <line x1="5" y1="12" x2="5.01" y2="12" strokeWidth="2.5" />
      <line x1="5" y1="16" x2="5.01" y2="16" strokeWidth="2.5" />
      {/* Directed Light Emission Rays */}
      <line x1="10" y1="7" x2="14" y2="7" strokeDasharray="1 1" />
      <line x1="10" y1="12" x2="15" y2="12" />
      <line x1="10" y1="17" x2="14" y2="17" strokeDasharray="1 1" />
      {/* Recipient Profile / Body Line */}
      <circle cx="19" cy="8" r="2" />
      <path d="M17 19v-4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v4" />
    </svg>
  )
}

/** 16:8 Fasting / Time-Restricted Eating: Plate with distinct 16:8 fasting partition clock arc */
function FastingGlyph({ gradId, size }: { gradId: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={`url(#${gradId})`} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {/* Outer Dining Plate */}
      <circle cx="12" cy="12" r="9" />
      {/* Inner Recessed Rim */}
      <circle cx="12" cy="12" r="5.5" strokeDasharray="2 2" />
      {/* Clock Hands Indicating Fasting Window Cutoff */}
      <path d="M12 8v4l3 2" />
    </svg>
  )
}

/** Seated Meditation: Zen lotus meditation figure with focused spinal alignment */
function MeditationGlyph({ gradId, size }: { gradId: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={`url(#${gradId})`} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {/* Head */}
      <circle cx="12" cy="5.5" r="2.2" />
      {/* Shoulders & Spine */}
      <path d="M12 8v6" />
      {/* Arms & Hands Resting in Mudra */}
      <path d="M6 14l3-3 3 2 3-2 3 3" />
      {/* Cross-Legged Lotus Base */}
      <path d="M5 19.5c1.5-1.8 3.8-2 7-2s5.5.2 7 2" />
      <path d="M4 20h16" />
    </svg>
  )
}

/** Breathwork: Anatomical lungs with directional airflow vectors */
function BreathworkGlyph({ gradId, size }: { gradId: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={`url(#${gradId})`} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {/* Trachea Windpipe */}
      <path d="M12 3v6" />
      <path d="M12 9l-2 2" />
      <path d="M12 9l2 2" />
      {/* Left Lung Lobe */}
      <path d="M10 11c-2.5 0-4.5 2-4.5 5 0 3.5 2.5 5 4.5 5h1v-10z" />
      {/* Right Lung Lobe */}
      <path d="M14 11c2.5 0 4.5 2 4.5 5 0 3.5-2.5 5-4.5 5h-1v-10z" />
    </svg>
  )
}

/** NSDR / Yoga Nidra: Reclined figure in deep somatic relaxation with soft alpha/theta wave */
function NSDRGlyph({ gradId, size }: { gradId: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={`url(#${gradId})`} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {/* Relaxation Mat / Horizon */}
      <path d="M3 18h18" />
      {/* Reclined Head & Rest Pillow */}
      <circle cx="7" cy="13" r="2" />
      {/* Reclined Supine Torso & Relaxed Legs */}
      <path d="M9 15h11" />
      {/* Calming Rest Wave / Brainwave Floating Above */}
      <path d="M9 8c1.5-.8 3-.8 4.5 0s3 .8 4.5 0" />
    </svg>
  )
}

/** Zone 2 Cardio: Heart coupled with continuous steady metabolic rhythm wave */
function Zone2Glyph({ gradId, size }: { gradId: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={`url(#${gradId})`} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {/* Heart Contour */}
      <path d="M12 20.5l-7-6.5A5 5 0 0 1 12 7.5a5 5 0 0 1 7 6.5l-7 6.5z" />
      {/* Steady Aerobic Pulse Line */}
      <path d="M8 14h2l1.2-2.5 1.6 5 1.2-2.5H16" />
    </svg>
  )
}

/** VILPA: Sprinting silhouette with burst acceleration cues */
function VILPAGlyph({ gradId, size }: { gradId: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={`url(#${gradId})`} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {/* Head in Forward Stride */}
      <circle cx="15" cy="5" r="2" />
      {/* Torso Angled for Sprint */}
      <path d="M13 7l-2 5 4 2" />
      {/* Forward Leading Leg & Trailing Leg */}
      <path d="M11 12l-3 4-4-1" />
      <path d="M15 14l2 4 4 1" />
      {/* Burst Wind Velocity Accent */}
      <path d="M4 8h3" />
      <path d="M3 11h2" />
    </svg>
  )
}

/** Mobility & Dynamic Stretching: Full-range flexibility extension silhouette */
function MobilityGlyph({ gradId, size }: { gradId: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={`url(#${gradId})`} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="4.5" r="2" />
      <path d="M12 7v5" />
      {/* Extended Arms Overhead Reach */}
      <path d="M6 8l6-1 6 1" />
      {/* Open Stance Stretch Legs */}
      <path d="M12 12l-4 8" />
      <path d="M12 12l4 8" />
      <path d="M5 21h14" strokeDasharray="1 2" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Main ModalityIcon Component
// ---------------------------------------------------------------------------
export default function ModalityIcon({
  modality,
  modalityName,
  category,
  size = 22,
  className = '',
  glow = true
}: ModalityIconProps) {
  const rawId = useId()
  const cleanId = rawId.replace(/[^a-zA-Z0-9_-]/g, '')
  const gradId = `mod-grad-${cleanId}`

  const nameLower = (
    modalityName ||
    modality?.display_name ||
    modality?.name ||
    ''
  ).toLowerCase().trim()

  const catLower = (
    Array.isArray(category)
      ? category.join(' ')
      : (category || modality?.category || modality?.modality_type || '')
  ).toLowerCase().trim()

  const grad = resolveGradient(nameLower, catLower)
  const glowStyle = glow ? { filter: `drop-shadow(0 0 5px ${grad.glow})` } : undefined

  // Helper renderer for Lucide icons using the gradient stroke
  const renderLucide = (IconComponent: React.ComponentType<any>) => (
    <div 
      className={`inline-flex items-center justify-center ${className}`}
      style={glowStyle}
    >
      <svg width={0} height={0} className="absolute">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={grad.from} />
            <stop offset="100%" stopColor={grad.to} />
          </linearGradient>
        </defs>
      </svg>
      <IconComponent 
        size={size} 
        stroke={`url(#${gradId})`} 
        strokeWidth={1.8} 
        className="shrink-0"
      />
    </div>
  )

  // Helper renderer for custom SVG glyphs
  const renderCustom = (GlyphComponent: React.ComponentType<{ gradId: string; size: number }>) => (
    <div 
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      style={glowStyle}
    >
      <svg width={0} height={0} className="absolute">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={grad.from} />
            <stop offset="100%" stopColor={grad.to} />
          </linearGradient>
        </defs>
      </svg>
      <GlyphComponent gradId={gradId} size={size} />
    </div>
  )

  // 1. THERMAL / RECOVERY
  if (nameLower.includes('cold plunge') || nameLower.includes('ice bath') || nameLower.includes('cold water') || nameLower.includes('cryotherapy')) {
    return renderCustom(ColdPlungeGlyph)
  }
  if (nameLower.includes('sauna') || nameLower.includes('infrared sauna') || nameLower.includes('finnish sauna')) {
    return renderCustom(SaunaGlyph)
  }
  if (nameLower.includes('contrast')) {
    return renderCustom(ContrastTherapyGlyph)
  }
  if (nameLower.includes('hot bath') || nameLower.includes('epsom salt bath')) {
    return renderCustom(HotBathGlyph)
  }

  // 2. FITNESS & MOVEMENT
  if (nameLower.includes('zone 2') || nameLower.includes('aerobic base') || nameLower.includes('cardio base')) {
    return renderCustom(Zone2Glyph)
  }
  if (nameLower.includes('vilpa')) {
    return renderCustom(VILPAGlyph)
  }
  if (nameLower.includes('hiit') || nameLower.includes('sprint') || nameLower.includes('intervals') || nameLower.includes('tabata')) {
    return renderLucide(Zap)
  }
  if (nameLower.includes('resistance') || nameLower.includes('strength') || nameLower.includes('weight') || nameLower.includes('lift') || nameLower.includes('hypertrophy') || nameLower.includes('dumbbell') || nameLower.includes('barbell') || nameLower.includes('squat')) {
    return renderLucide(Dumbbell)
  }
  if (nameLower.includes('cycling') || nameLower.includes('bike') || nameLower.includes('biking') || nameLower.includes('spin')) {
    return renderLucide(Bike)
  }
  if (nameLower.includes('walk') || nameLower.includes('glucose walk') || nameLower.includes('post-meal walk') || nameLower.includes('steps') || nameLower.includes('hiking')) {
    return renderLucide(Footprints)
  }
  if (nameLower.includes('stretch') || nameLower.includes('mobility') || nameLower.includes('yoga') || nameLower.includes('flexibility')) {
    return renderCustom(MobilityGlyph)
  }
  if (nameLower.includes('run') || nameLower.includes('jog') || nameLower.includes('treadmill')) {
    return renderCustom(VILPAGlyph)
  }

  // 3. MIND & NERVOUS SYSTEM
  if (nameLower.includes('breath') || nameLower.includes('sigh') || nameLower.includes('4-7-8') || nameLower.includes('box breath') || nameLower.includes('coherent')) {
    return renderCustom(BreathworkGlyph)
  }
  if (nameLower.includes('nsdr') || nameLower.includes('yoga nidra') || nameLower.includes('non-sleep deep rest')) {
    return renderCustom(NSDRGlyph)
  }
  if (nameLower.includes('meditat') || nameLower.includes('mindful') || nameLower.includes('vipassana') || nameLower.includes('zen')) {
    return renderCustom(MeditationGlyph)
  }
  if (nameLower.includes('journal') || nameLower.includes('gratitude') || nameLower.includes('writing') || nameLower.includes('reflection')) {
    return renderLucide(BookOpen)
  }
  if (nameLower.includes('focus') || nameLower.includes('brain') || nameLower.includes('cognitive') || nameLower.includes('neuro')) {
    return renderLucide(Brain)
  }

  // 4. CIRCADIAN & LIGHT
  if (nameLower.includes('red light') || nameLower.includes('photobio') || nameLower.includes('pbm') || nameLower.includes('infrared panel')) {
    return renderCustom(RedLightGlyph)
  }
  if (nameLower.includes('morning light') || nameLower.includes('sunrise') || nameLower.includes('outdoor light') || nameLower.includes('lux')) {
    return renderLucide(Sunrise)
  }
  if (nameLower.includes('blue light') || nameLower.includes('screen filter') || nameLower.includes('blocking glasses')) {
    return renderLucide(Glasses)
  }
  if (nameLower.includes('evening darkness') || nameLower.includes('dark room') || nameLower.includes('dim light') || nameLower.includes('blackout')) {
    return renderLucide(Moon)
  }

  // 5. NUTRITION & METABOLIC
  if (nameLower.includes('fasting') || nameLower.includes('fast') || nameLower.includes('omad') || nameLower.includes('tre') || nameLower.includes('time-restricted')) {
    return renderCustom(FastingGlyph)
  }
  if (nameLower.includes('water') || nameLower.includes('hydrate') || nameLower.includes('hydration') || nameLower.includes('electrolytes') || nameLower.includes('salt')) {
    return renderLucide(Droplets)
  }
  if (nameLower.includes('caffeine') || nameLower.includes('coffee') || nameLower.includes('tea') || nameLower.includes('espresso') || nameLower.includes('matcha')) {
    return renderLucide(Coffee)
  }
  if (nameLower.includes('protein') || nameLower.includes('shake') || nameLower.includes('whey') || nameLower.includes('collagen')) {
    return renderLucide(Activity)
  }
  if (nameLower.includes('meal') || nameLower.includes('food') || nameLower.includes('dinner') || nameLower.includes('lunch') || nameLower.includes('breakfast') || nameLower.includes('salad') || nameLower.includes('pudding')) {
    return renderLucide(Utensils)
  }
  if (nameLower.includes('supplement') || nameLower.includes('stack') || nameLower.includes('capsule') || nameLower.includes('pill') || catLower.includes('supplement') || modality?.modality_type === 'supplement') {
    return renderLucide(Pill)
  }

  // 6. SLEEP
  if (nameLower.includes('mouth tape') || nameLower.includes('airway') || nameLower.includes('nasal')) {
    return renderLucide(ShieldCheck)
  }
  if (nameLower.includes('wind down') || nameLower.includes('wind-down') || nameLower.includes('evening routine')) {
    return renderLucide(Moon)
  }
  if (nameLower.includes('sleep') || nameLower.includes('bed') || nameLower.includes('deep sleep') || nameLower.includes('rem sleep')) {
    return renderLucide(BedDouble)
  }

  // 7. PEPTIDES & BIOACTIVES
  if (catLower.includes('peptide') || nameLower.includes('bpc') || nameLower.includes('tb-500') || nameLower.includes('cjc') || nameLower.includes('ipamorelin') || nameLower.includes('epithalon') || nameLower.includes('ghk') || nameLower.includes('subq') || nameLower.includes('inject')) {
    return renderLucide(Syringe)
  }

  // 8. DIAGNOSTICS & BIOMARKERS
  if (catLower.includes('diagnostic') || catLower.includes('biomarker') || catLower.includes('tracking') || nameLower.includes('scan') || nameLower.includes('mri') || nameLower.includes('dexa') || nameLower.includes('blood') || nameLower.includes('lab') || nameLower.includes('test')) {
    return renderLucide(ScanLine)
  }

  // Fallback icon based on general category
  if (catLower.includes('fitness') || catLower.includes('physical')) return renderLucide(Dumbbell)
  if (catLower.includes('mind') || catLower.includes('nervous')) return renderLucide(Brain)
  if (catLower.includes('sleep') || catLower.includes('circadian')) return renderLucide(Moon)
  if (catLower.includes('nutrition') || catLower.includes('diet')) return renderLucide(Utensils)
  if (catLower.includes('supplement')) return renderLucide(Pill)

  return renderLucide(Sparkles)
}
