'use client'

import React, { useId, useState, useEffect, useRef } from 'react'
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
  scrollIgnite?: boolean
  isIgnited?: boolean
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
  // 1. Peptides first (prevents "CJC-1295 Bedtime" from resolving to sleep)
  if (
    catLower.includes('peptide') ||
    catLower.includes('injectable') ||
    catLower.includes('hormone') ||
    nameLower.includes('bpc') ||
    nameLower.includes('tb-500') ||
    nameLower.includes('tb500') ||
    nameLower.includes('cjc') ||
    nameLower.includes('ipamorelin') ||
    nameLower.includes('ghk') ||
    nameLower.includes('epithalon') ||
    nameLower.includes('epitalon') ||
    nameLower.includes('mots-c') ||
    nameLower.includes('motsc') ||
    nameLower.includes('ss-31') ||
    nameLower.includes('ss31') ||
    nameLower.includes('kpv') ||
    nameLower.includes('ta1') ||
    nameLower.includes('ta-1') ||
    nameLower.includes('thymosin') ||
    nameLower.includes('semax') ||
    nameLower.includes('selank') ||
    nameLower.includes('retatrutide') ||
    nameLower.includes('tirzepatide') ||
    nameLower.includes('semaglutide') ||
    nameLower.includes('aod') ||
    nameLower.includes('tesamorelin') ||
    nameLower.includes('sermorelin') ||
    nameLower.includes('subq') ||
    nameLower.includes('inject')
  ) {
    return CATEGORY_GRADIENTS.peptides
  }

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

/** Cold Plunge / Cold Water Immersion: Deep plunge tub with waterline and floating ice crystal */
function ColdPlungeGlyph({ stroke, size }: { stroke: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
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

/** Detailed Sauna: Finnish volcanic stone stove (kiuas) with rising löyly steam & cedar bucket with ladle */
function DetailedSaunaGlyph({ stroke, size }: { stroke: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {/* Finnish Sauna Stove (Kiuas) Body with Front Heat Grates */}
      <rect x="2.5" y="11" width="8" height="10" rx="1" />
      <line x1="5" y1="14.5" x2="5" y2="18.5" />
      <line x1="8" y1="14.5" x2="8" y2="18.5" />
      {/* Volcanic Heating Stones Piled on Top */}
      <path d="M3 11c0-1.8 1.5-2.8 3.5-2.8s3.5 1 3.5 2.8" />
      <path d="M5 8.2c0-1.2 1-2 2.2-2s2.2.8 2.2 2" />
      {/* Convective Rising Löyly Steam Waves */}
      <path d="M4.5 2c-.6.8-.6 1.6 0 2.4s.6 1.6 0 2.4" />
      <path d="M8 1.5c-.6.9-.6 1.8 0 2.7s.6 1.8 0 2.7" />
      {/* Traditional Cedar Sauna Bucket (Kiulu) */}
      <path d="M14 13.5h7.5l-1 7.5h-5.5z" />
      <line x1="14.5" y1="17" x2="20" y2="17" />
      {/* Wooden Sauna Ladle (Kauha) resting in bucket */}
      <path d="M16 7.5l4 7" />
      <path d="M15 6.5l2 2" />
    </svg>
  )
}

/** Precision Subcutaneous Peptide Pen / Micro-Injector */
function PeptidePenGlyph({ stroke, size }: { stroke: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {/* Sleek Angled Pen Barrel Body */}
      <path d="M10 14l6-6 2 2-6 6z" />
      {/* Precision Dose Graduation Measurement Marks */}
      <path d="M12 10l1 1" />
      <path d="M13.5 11.5l1 1" />
      {/* Top Plunger Shaft & Clickable Dosage Dial */}
      <path d="M17 7l2-2" />
      <path d="M18 4l3 3" />
      {/* Subcutaneous Needle Collar Hub */}
      <path d="M9 15l-2 2" />
      {/* Ultra-Fine Micro-Needle Shaft */}
      <path d="M7 17l-3.5 3.5" />
      {/* Active Bioactive Micro-Droplet at Tip */}
      <circle cx="3.5" cy="20.5" r="0.75" />
    </svg>
  )
}

/** Contrast Therapy: Dual circulating hot & cold thermodynamic cycle */
function ContrastTherapyGlyph({ stroke, size }: { stroke: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {/* Left Cold Wave Arc */}
      <path d="M12 3a9 9 0 0 0-9 9c0 2.8 1.3 5.3 3.3 6.9" />
      <path d="M6 19l.5-3.5-3.5.5" />
      {/* Right Hot Wave Arc */}
      <path d="M12 21a9 9 0 0 0 9-9c0-2.8-1.3-5.3-3.3-6.9" />
      <path d="M18 5l-.5 3.5 3.5-.5" />
      {/* Center Dual Thermal Indicator */}
      <path d="M10 12h4" />
      <path d="M12 10v4" />
    </svg>
  )
}

/** Hot Bath: Soaking tub with warm rising steam ripples */
function HotBathGlyph({ stroke, size }: { stroke: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h18" />
      <path d="M4 12v5a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4v-5" />
      <path d="M6 21v1" />
      <path d="M18 21v1" />
      <path d="M9 5c-.5.8-.5 1.5 0 2.2s.5 1.5 0 2.2" />
      <path d="M15 5c-.5.8-.5 1.5 0 2.2s.5 1.5 0 2.2" />
    </svg>
  )
}

/** Red Light Therapy / Photobiomodulation: Focused LED panel emitting rays onto a human silhouette */
function RedLightGlyph({ stroke, size }: { stroke: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
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
function FastingGlyph({ stroke, size }: { stroke: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5.5" strokeDasharray="2 2" />
      <path d="M12 8v4l3 2" />
    </svg>
  )
}

/** Seated Meditation: Zen lotus meditation figure with focused spinal alignment */
function MeditationGlyph({ stroke, size }: { stroke: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5.5" r="2.2" />
      <path d="M12 8v6" />
      <path d="M6 14l3-3 3 2 3-2 3 3" />
      <path d="M5 19.5c1.5-1.8 3.8-2 7-2s5.5.2 7 2" />
      <path d="M4 20h16" />
    </svg>
  )
}

/** Breathwork: Anatomical lungs with directional airflow vectors */
function BreathworkGlyph({ stroke, size }: { stroke: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v6" />
      <path d="M12 9l-2 2" />
      <path d="M12 9l2 2" />
      <path d="M10 11c-2.5 0-4.5 2-4.5 5 0 3.5 2.5 5 4.5 5h1v-10z" />
      <path d="M14 11c2.5 0 4.5 2 4.5 5 0 3.5-2.5 5-4.5 5h-1v-10z" />
    </svg>
  )
}

/** NSDR / Yoga Nidra: Reclined figure in deep somatic relaxation with soft alpha/theta wave */
function NSDRGlyph({ stroke, size }: { stroke: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18h18" />
      <circle cx="7" cy="13" r="2" />
      <path d="M9 15h11" />
      <path d="M9 8c1.5-.8 3-.8 4.5 0s3 .8 4.5 0" />
    </svg>
  )
}

/** Zone 2 Cardio: Heart coupled with continuous steady metabolic rhythm wave */
function Zone2Glyph({ stroke, size }: { stroke: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20.5l-7-6.5A5 5 0 0 1 12 7.5a5 5 0 0 1 7 6.5l-7 6.5z" />
      <path d="M8 14h2l1.2-2.5 1.6 5 1.2-2.5H16" />
    </svg>
  )
}

/** VILPA: Sprinting silhouette with burst acceleration cues */
function VILPAGlyph({ stroke, size }: { stroke: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="15" cy="5" r="2" />
      <path d="M13 7l-2 5 4 2" />
      <path d="M11 12l-3 4-4-1" />
      <path d="M15 14l2 4 4 1" />
      <path d="M4 8h3" />
      <path d="M3 11h2" />
    </svg>
  )
}

/** Mobility & Dynamic Stretching: Full-range flexibility extension silhouette */
function MobilityGlyph({ stroke, size }: { stroke: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="4.5" r="2" />
      <path d="M12 7v5" />
      <path d="M6 8l6-1 6 1" />
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
  glow = true,
  scrollIgnite = true,
  isIgnited: propIsIgnited
}: ModalityIconProps) {
  const rawId = useId()
  const cleanId = rawId.replace(/[^a-zA-Z0-9_-]/g, '')
  const gradId = `mod-grad-${cleanId}`
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Scroll-driven ignition state
  const [internalIgnited, setInternalIgnited] = useState(!scrollIgnite)

  useEffect(() => {
    if (!scrollIgnite) {
      setInternalIgnited(true)
      return
    }

    const checkIgnition = () => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      // Lights up only after scrolled past (trigger horizon at 45% of viewport, matching circadian time-block engine)
      const horizon = window.innerHeight * 0.45
      const isPast = (rect.top + rect.height / 2) <= horizon + 12
      setInternalIgnited(isPast)
    }

    checkIgnition()
    window.addEventListener('scroll', checkIgnition, { passive: true })
    window.addEventListener('resize', checkIgnition, { passive: true })
    return () => {
      window.removeEventListener('scroll', checkIgnition)
      window.removeEventListener('resize', checkIgnition)
    }
  }, [scrollIgnite])

  const activeIgnited = propIsIgnited !== undefined ? propIsIgnited : internalIgnited

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
  const effectiveStroke = activeIgnited ? `url(#${gradId})` : '#64748B'
  const glowStyle = (glow && activeIgnited) ? { filter: `drop-shadow(0 0 5px ${grad.glow})` } : undefined

  // Helper renderer for Lucide icons using the gradient stroke
  const renderLucide = (IconComponent: React.ComponentType<any>) => (
    <div 
      ref={containerRef}
      className={`inline-flex items-center justify-center shrink-0 transition-all duration-500 ease-out ${
        activeIgnited ? 'opacity-100 scale-100' : 'opacity-35 scale-95'
      } ${className}`}
      style={glowStyle}
    >
      <svg width={0} height={0} className="absolute pointer-events-none">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={grad.from} />
            <stop offset="100%" stopColor={grad.to} />
          </linearGradient>
        </defs>
      </svg>
      <IconComponent 
        size={size} 
        stroke={effectiveStroke} 
        strokeWidth={1.8} 
        className="shrink-0 transition-all duration-500"
      />
    </div>
  )

  // Helper renderer for custom SVG glyphs
  const renderCustom = (GlyphComponent: React.ComponentType<{ stroke: string; size: number }>) => (
    <div 
      ref={containerRef}
      className={`inline-flex items-center justify-center shrink-0 transition-all duration-500 ease-out ${
        activeIgnited ? 'opacity-100 scale-100' : 'opacity-35 scale-95'
      } ${className}`}
      style={glowStyle}
    >
      <svg width={0} height={0} className="absolute pointer-events-none">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={grad.from} />
            <stop offset="100%" stopColor={grad.to} />
          </linearGradient>
        </defs>
      </svg>
      <GlyphComponent stroke={effectiveStroke} size={size} />
    </div>
  )

  // 1. PEPTIDES & INJECTABLE BIOACTIVES (Checked first to prevent bedtime/other overlaps)
  if (
    catLower.includes('peptide') ||
    catLower.includes('injectable') ||
    catLower.includes('hormone') ||
    modality?.modality_type?.includes('peptide') ||
    nameLower.includes('bpc') ||
    nameLower.includes('tb-500') ||
    nameLower.includes('tb500') ||
    nameLower.includes('cjc') ||
    nameLower.includes('ipamorelin') ||
    nameLower.includes('ghk') ||
    nameLower.includes('epithalon') ||
    nameLower.includes('epitalon') ||
    nameLower.includes('mots-c') ||
    nameLower.includes('motsc') ||
    nameLower.includes('ss-31') ||
    nameLower.includes('ss31') ||
    nameLower.includes('kpv') ||
    nameLower.includes('ta1') ||
    nameLower.includes('ta-1') ||
    nameLower.includes('thymosin') ||
    nameLower.includes('semax') ||
    nameLower.includes('selank') ||
    nameLower.includes('retatrutide') ||
    nameLower.includes('tirzepatide') ||
    nameLower.includes('semaglutide') ||
    nameLower.includes('aod') ||
    nameLower.includes('tesamorelin') ||
    nameLower.includes('sermorelin') ||
    nameLower.includes('subq') ||
    nameLower.includes('inject')
  ) {
    return renderCustom(PeptidePenGlyph)
  }

  // 2. THERMAL / RECOVERY
  if (nameLower.includes('cold plunge') || nameLower.includes('ice bath') || nameLower.includes('cold water') || nameLower.includes('cryotherapy') || nameLower.includes('cold immersion')) {
    return renderCustom(ColdPlungeGlyph)
  }
  if (nameLower.includes('sauna') || nameLower.includes('hyperthermic') || nameLower.includes('finnish sauna') || nameLower.includes('infrared sauna')) {
    return renderCustom(DetailedSaunaGlyph)
  }
  if (nameLower.includes('contrast')) {
    return renderCustom(ContrastTherapyGlyph)
  }
  if (nameLower.includes('hot bath') || nameLower.includes('epsom salt bath') || nameLower.includes('soak')) {
    return renderCustom(HotBathGlyph)
  }

  // 3. FITNESS & MOVEMENT (Exhaustive check so exercise NEVER defaults to sparkles)
  if (nameLower.includes('zone 2') || nameLower.includes('aerobic base') || nameLower.includes('cardio base') || nameLower.includes('cpet') || nameLower.includes('vo2 max')) {
    return renderCustom(Zone2Glyph)
  }
  if (nameLower.includes('vilpa') || nameLower.includes('micro-burst') || nameLower.includes('sprint') || nameLower.includes('interval')) {
    return renderCustom(VILPAGlyph)
  }
  if (nameLower.includes('hiit') || nameLower.includes('tabata') || nameLower.includes('anaerobic')) {
    return renderLucide(Zap)
  }
  if (
    nameLower.includes('resistance') ||
    nameLower.includes('strength') ||
    nameLower.includes('weight') ||
    nameLower.includes('lift') ||
    nameLower.includes('hypertrophy') ||
    nameLower.includes('dumbbell') ||
    nameLower.includes('barbell') ||
    nameLower.includes('squat') ||
    nameLower.includes('deadlift') ||
    nameLower.includes('bench press') ||
    nameLower.includes('pull-up') ||
    nameLower.includes('calisthenic') ||
    nameLower.includes('gym')
  ) {
    return renderLucide(Dumbbell)
  }
  if (nameLower.includes('cycling') || nameLower.includes('bike') || nameLower.includes('biking') || nameLower.includes('spin') || nameLower.includes('peloton')) {
    return renderLucide(Bike)
  }
  if (
    nameLower.includes('walk') ||
    nameLower.includes('glucose walk') ||
    nameLower.includes('post-meal walk') ||
    nameLower.includes('steps') ||
    nameLower.includes('hiking') ||
    nameLower.includes('stride') ||
    nameLower.includes('treadmill walk')
  ) {
    return renderLucide(Footprints)
  }
  if (
    nameLower.includes('stretch') ||
    nameLower.includes('mobility') ||
    nameLower.includes('yoga') ||
    nameLower.includes('flexibility') ||
    nameLower.includes('rom') ||
    nameLower.includes('pilates') ||
    nameLower.includes('foam roll')
  ) {
    return renderCustom(MobilityGlyph)
  }
  if (nameLower.includes('run') || nameLower.includes('jog') || nameLower.includes('5k') || nameLower.includes('treadmill')) {
    return renderCustom(VILPAGlyph)
  }
  if (
    catLower.includes('fitness') ||
    catLower.includes('physical') ||
    catLower.includes('movement') ||
    catLower.includes('exercise') ||
    catLower.includes('workout') ||
    catLower.includes('training') ||
    nameLower.includes('workout') ||
    nameLower.includes('exercise') ||
    nameLower.includes('training')
  ) {
    return renderLucide(Dumbbell)
  }

  // 4. CIRCADIAN & LIGHT
  if (nameLower.includes('red light') || nameLower.includes('photobio') || nameLower.includes('pbm') || nameLower.includes('infrared panel')) {
    return renderCustom(RedLightGlyph)
  }
  if (nameLower.includes('morning light') || nameLower.includes('sunrise') || nameLower.includes('outdoor light') || nameLower.includes('lux') || nameLower.includes('sunlight')) {
    return renderLucide(Sunrise)
  }
  if (nameLower.includes('blue light') || nameLower.includes('screen filter') || nameLower.includes('blocking glasses') || nameLower.includes('amber glasses')) {
    return renderLucide(Glasses)
  }
  if (nameLower.includes('evening darkness') || nameLower.includes('dark room') || nameLower.includes('dim light') || nameLower.includes('blackout')) {
    return renderLucide(Moon)
  }

  // 5. MIND & NERVOUS SYSTEM
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
  if (nameLower.includes('focus') || nameLower.includes('brain') || nameLower.includes('cognitive') || nameLower.includes('neuro') || nameLower.includes('nootropic')) {
    return renderLucide(Brain)
  }

  // 6. NUTRITION & METABOLIC
  if (nameLower.includes('fasting') || nameLower.includes('fast') || nameLower.includes('omad') || nameLower.includes('tre') || nameLower.includes('time-restricted')) {
    return renderCustom(FastingGlyph)
  }
  if (nameLower.includes('water') || nameLower.includes('hydrate') || nameLower.includes('hydration') || nameLower.includes('electrolytes') || nameLower.includes('salt')) {
    return renderLucide(Droplets)
  }
  if (nameLower.includes('caffeine') || nameLower.includes('coffee') || nameLower.includes('tea') || nameLower.includes('espresso') || nameLower.includes('matcha')) {
    return renderLucide(Coffee)
  }
  if (nameLower.includes('protein') || nameLower.includes('shake') || nameLower.includes('whey') || nameLower.includes('collagen') || nameLower.includes('amino')) {
    return renderLucide(Activity)
  }
  if (nameLower.includes('meal') || nameLower.includes('food') || nameLower.includes('dinner') || nameLower.includes('lunch') || nameLower.includes('breakfast') || nameLower.includes('salad') || nameLower.includes('pudding') || nameLower.includes('olive oil')) {
    return renderLucide(Utensils)
  }
  if (nameLower.includes('supplement') || nameLower.includes('stack') || nameLower.includes('capsule') || nameLower.includes('pill') || catLower.includes('supplement') || modality?.modality_type === 'supplement') {
    return renderLucide(Pill)
  }

  // 7. SLEEP & HYGIENE (Only non-peptide sleep modalities)
  if (nameLower.includes('mouth tape') || nameLower.includes('airway') || nameLower.includes('nasal')) {
    return renderLucide(ShieldCheck)
  }
  if (nameLower.includes('wind down') || nameLower.includes('wind-down') || nameLower.includes('evening routine')) {
    return renderLucide(Moon)
  }
  if (nameLower.includes('sleep') || nameLower.includes('bed') || nameLower.includes('deep sleep') || nameLower.includes('rem sleep')) {
    return renderLucide(BedDouble)
  }

  // 8. DIAGNOSTICS & BIOMARKERS
  if (catLower.includes('diagnostic') || catLower.includes('biomarker') || catLower.includes('tracking') || nameLower.includes('scan') || nameLower.includes('mri') || nameLower.includes('dexa') || nameLower.includes('blood') || nameLower.includes('lab') || nameLower.includes('test')) {
    return renderLucide(ScanLine)
  }

  // Safe category fallbacks (NEVER Sparks for fitness)
  if (catLower.includes('fitness') || catLower.includes('physical')) return renderLucide(Dumbbell)
  if (catLower.includes('mind') || catLower.includes('nervous')) return renderLucide(Brain)
  if (catLower.includes('sleep') || catLower.includes('circadian')) return renderLucide(Moon)
  if (catLower.includes('nutrition') || catLower.includes('diet')) return renderLucide(Utensils)
  if (catLower.includes('supplement')) return renderLucide(Pill)

  return renderLucide(Sparkles)
}
