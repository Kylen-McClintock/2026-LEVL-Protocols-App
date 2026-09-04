'use client'

import React, { useState, useEffect, useRef } from 'react'
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
  HeartPulse,
  Atom,
  Shield,
  Timer,
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
  ScanLine,
  Waves,
  Compass,
  Target,
  Wind,
  ShieldAlert,
  Sparkle,
  Layers,
  Radio,
  Thermometer
} from 'lucide-react'

export interface ModalityIconProps {
  modality?: {
    id?: string
    name?: string
    display_name?: string
    category?: string
    modality_type?: string
    icon?: string
    icon_name?: string
    color_hex?: string
    media_assets?: any
    [key: string]: any
  } | null
  modalityName?: string
  category?: string | string[]
  size?: number
  className?: string
  glow?: boolean
  scrollIgnite?: boolean
  isIgnited?: boolean
  customColor?: string
  customIcon?: string
}

// ---------------------------------------------------------------------------
// Category Color Palette & Gradients
// ---------------------------------------------------------------------------
interface GradientConfig {
  from: string
  to: string
  glow: string
  ambient: string
}

const CATEGORY_GRADIENTS: Record<string, GradientConfig> = {
  // Thermal & Environmental
  thermal_cold: { 
    from: '#06B6D4', // Ice Cyan
    to: '#38BDF8',   // Luminous Sky Blue
    glow: 'rgba(6, 182, 212, 0.75)', 
    ambient: 'rgba(56, 189, 248, 0.35)' 
  },
  thermal_heat: { 
    from: '#FB923C', // Luminous Ember Orange
    to: '#F87171',   // Infrared Coral
    glow: 'rgba(251, 146, 60, 0.75)', 
    ambient: 'rgba(248, 113, 113, 0.35)' 
  },
  thermal_contrast: { 
    from: '#06B6D4', // Vivid Cyan
    to: '#FB923C',   // Radiant Coral
    glow: 'rgba(6, 182, 212, 0.75)', 
    ambient: 'rgba(251, 146, 60, 0.35)' 
  },
  
  // Supplements & Nutraceuticals (Dedicated Solar Amber Theme)
  supplements: {
    from: '#F59E0B', // Solar Amber
    to: '#FBBF24',   // Luminous Gold
    glow: 'rgba(245, 158, 11, 0.75)', 
    ambient: 'rgba(251, 191, 36, 0.35)' 
  },

  // Fitness & Movement (Electric Coral / Orange)
  fitness: { 
    from: '#F97316', // Electric Coral / Orange
    to: '#FB923C',   // Luminous Ember
    glow: 'rgba(249, 115, 22, 0.75)', 
    ambient: 'rgba(251, 146, 60, 0.35)' 
  },
  fitness_intense: { 
    from: '#F97316', // Luminous Coral
    to: '#EF4444',   // Neon Red / Burst
    glow: 'rgba(249, 115, 22, 0.75)', 
    ambient: 'rgba(239, 68, 68, 0.35)' 
  },
  
  // Mind & Nervous System (Electric Violet / Purple)
  mind: { 
    from: '#A855F7', // Electric Violet
    to: '#C084FC',   // Vivid Purple
    glow: 'rgba(168, 85, 247, 0.75)', 
    ambient: 'rgba(192, 132, 252, 0.35)' 
  },
  
  // Sleep & Circadian (Moonlight Indigo)
  sleep: { 
    from: '#6366F1', // Moonlight Indigo
    to: '#818CF8',   // Luminous Periwinkle
    glow: 'rgba(99, 102, 241, 0.75)', 
    ambient: 'rgba(129, 140, 248, 0.35)' 
  },
  circadian: { 
    from: '#FDE047', // Radiant Solar Gold
    to: '#38BDF8',   // Daylight Sky Blue
    glow: 'rgba(253, 224, 71, 0.75)', 
    ambient: 'rgba(56, 189, 248, 0.35)' 
  },
  
  // Nutrition & Fasting (Radiant Emerald)
  nutrition: { 
    from: '#10B981', // Radiant Emerald
    to: '#34D399',   // Vital Mint
    glow: 'rgba(16, 185, 129, 0.75)', 
    ambient: 'rgba(52, 211, 153, 0.35)' 
  },
  fasting: { 
    from: '#10B981', // Radiant Emerald
    to: '#059669',   // Deep Autophagy Emerald
    glow: 'rgba(16, 185, 129, 0.75)', 
    ambient: 'rgba(5, 150, 105, 0.35)' 
  },
  
  // Peptides & Bioactives (Bioactive Fuchsia)
  peptides: { 
    from: '#E879F9', // Neon Bioactive Fuchsia
    to: '#F472B6',   // Radiant Bioactive Rose
    glow: 'rgba(232, 121, 249, 0.75)', 
    ambient: 'rgba(244, 114, 182, 0.35)' 
  },
  
  // Diagnostics & Biomarkers (High-Tech Cobalt)
  diagnostics: { 
    from: '#3B82F6', // Cobalt Blue
    to: '#60A5FA',   // High-Tech Blue
    glow: 'rgba(59, 130, 246, 0.75)', 
    ambient: 'rgba(96, 165, 250, 0.35)' 
  },
  
  // Fallback / General Longevity
  default: { 
    from: '#14B8A6', 
    to: '#22D3EE', 
    glow: 'rgba(20, 184, 166, 0.7)', 
    ambient: 'rgba(34, 211, 238, 0.35)' 
  }
}

function resolveGradient(nameLower: string, catLower: string, customHex?: string): GradientConfig {
  if (customHex && customHex.startsWith('#')) {
    return {
      from: customHex,
      to: customHex,
      glow: `${customHex}B3`,
      ambient: `${customHex}4D`
    }
  }
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

  // 2. Specific modality-level thermal overrides
  if (nameLower.includes('cold') || nameLower.includes('plunge') || nameLower.includes('ice bath') || nameLower.includes('cryo')) {
    return CATEGORY_GRADIENTS.thermal_cold
  }
  if (nameLower.includes('sauna') || nameLower.includes('hot bath') || nameLower.includes('heat exposure')) {
    return CATEGORY_GRADIENTS.thermal_heat
  }
  if (nameLower.includes('contrast')) {
    return CATEGORY_GRADIENTS.thermal_contrast
  }

  // 3. Supplements (oral delivery, vitamins, minerals, NAD, stacks)
  if (
    catLower.includes('supplement') ||
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
    nameLower.includes('zinc') ||
    nameLower.includes('ashwagandha') ||
    nameLower.includes('theanine') ||
    nameLower.includes('apigenin') ||
    nameLower.includes('glycine') ||
    nameLower.includes('taurine') ||
    nameLower.includes('stack')
  ) {
    return CATEGORY_GRADIENTS.supplements
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
  if (catLower.includes('nutrition') || catLower.includes('diet') || catLower.includes('food') || catLower.includes('fasting')) {
    return CATEGORY_GRADIENTS.nutrition
  }
  if (catLower.includes('diagnostic') || catLower.includes('biomarker') || catLower.includes('tracking') || catLower.includes('lab') || catLower.includes('scan')) {
    return CATEGORY_GRADIENTS.diagnostics
  }

  return CATEGORY_GRADIENTS.default
}

// ---------------------------------------------------------------------------
// Bespoke Monoline SVG Glyphs (24x24 viewBox, stroke-only, 1.55px stroke)
// Precision geometric clearances ensure zero detail loss when illuminated.
// ---------------------------------------------------------------------------

/** Cold Plunge / Cold Water Immersion: Deep plunge tub with waterline ripple and floating snowflake ice crystal */
function ColdPlungeGlyph({ stroke, size }: { stroke: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">
      {/* Plunge Tub Rim & Base */}
      <path d="M2.5 10.5h19" />
      <path d="M4 10.5v6a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4v-6" />
      {/* Waterline Ripple */}
      <path d="M6.5 15c1.8-.8 3.5-.8 5.5 0s3.5.8 5.5 0" />
      {/* Floating Ice Crystal (Clear radiating snowflake geometry) */}
      <line x1="12" y1="2" x2="12" y2="8" />
      <line x1="9" y1="5" x2="15" y2="5" />
      <line x1="9.8" y1="2.8" x2="14.2" y2="7.2" />
      <line x1="14.2" y1="2.8" x2="9.8" y2="7.2" />
    </svg>
  )
}

/** Detailed Sauna: Finnish volcanic stone stove (kiuas) with rising löyly steam & cedar bucket with ladle */
function DetailedSaunaGlyph({ stroke, size }: { stroke: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">
      {/* Finnish Sauna Stove (Kiuas) Body with Front Heat Grates */}
      <rect x="3" y="10.5" width="10" height="10.5" rx="1.5" />
      <line x1="6.5" y1="14" x2="6.5" y2="18.5" />
      <line x1="9.5" y1="14" x2="9.5" y2="18.5" />
      {/* Volcanic Heating Stones Piled on Top with clear clearance */}
      <path d="M4 10.5c0-1.8 1.8-2.8 4-2.8s4 1 4 2.8" />
      <path d="M6 7.7c0-1.2 1-2 2-2s2 .8 2 2" />
      {/* Convective Rising Löyly Steam Waves */}
      <path d="M5.5 1.5c-.7.8-.7 1.6 0 2.4s.7 1.6 0 2.4" />
      <path d="M9 1.5c-.7.8-.7 1.6 0 2.4s.7 1.6 0 2.4" />
      {/* Traditional Cedar Sauna Bucket (Kiulu) */}
      <path d="M15 13.5h6l-1 7.5h-4z" />
      <line x1="15.5" y1="17.5" x2="20.5" y2="17.5" />
      {/* Wooden Sauna Ladle (Kauha) resting in bucket */}
      <path d="M17 7l3 7.5" />
      <path d="M16 6.5l2 1.5" />
    </svg>
  )
}

/** Precision Subcutaneous Peptide Syringe & Micro-Needle (True medical insulin syringe with open barrel negative space) */
function PeptideSyringeGlyph({ stroke, size }: { stroke: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">
      {/* Syringe Cylindrical Barrel with generous 4.5px clearance */}
      <line x1="7.5" y1="14.5" x2="16.5" y2="5.5" />
      <line x1="11" y1="18" x2="20" y2="9" />
      <line x1="16.5" y1="5.5" x2="20" y2="9" />
      {/* Finger Grip Flange Wings at barrel top */}
      <line x1="5.5" y1="12.5" x2="13" y2="20" />
      {/* Plunger Shaft extended backwards */}
      <line x1="8" y1="17.5" x2="4.5" y2="21" />
      {/* Thumb Press Disc */}
      <line x1="3" y1="19.5" x2="6" y2="22.5" />
      {/* Precision Dose Graduation Measurement Marks (Leaves clear dark interior space) */}
      <line x1="10" y1="12" x2="11.5" y2="13.5" />
      <line x1="12" y1="10" x2="13.5" y2="11.5" />
      <line x1="14" y1="8" x2="15.5" y2="9.5" />
      {/* Needle Hub Collar */}
      <line x1="17.5" y1="6.5" x2="19" y2="8" />
      {/* Ultra-Fine Micro-Needle Shaft */}
      <line x1="18.25" y1="7.25" x2="22.5" y2="3" />
      {/* Active Bioactive Micro-Droplet at Tip */}
      <circle cx="22.5" cy="3" r="0.75" fill={stroke} />
    </svg>
  )
}

/** Handstand & Inversion Balance Glyph (Inverted gymnast hold, open spacing) */
function HandstandGlyph({ stroke, size }: { stroke: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">
      {/* Floor / Ground Platform Line */}
      <line x1="3" y1="21" x2="21" y2="21" />
      {/* Left Palm & Forearm Planted */}
      <line x1="8" y1="21" x2="9.5" y2="14.5" />
      {/* Right Palm & Forearm Planted */}
      <line x1="16" y1="21" x2="14.5" y2="14.5" />
      {/* Inverted Head Tucked Between Shoulders */}
      <circle cx="12" cy="17" r="1.5" />
      {/* Shoulder Girdle */}
      <line x1="9.5" y1="14.5" x2="14.5" y2="14.5" />
      {/* Inverted Torso Extending Vertically */}
      <line x1="12" y1="14.5" x2="12" y2="9" />
      {/* Pelvis / Hip Line */}
      <line x1="10" y1="9" x2="14" y2="9" />
      {/* Extended Legs in Strict Vertical Hold */}
      <line x1="10.5" y1="9" x2="10.5" y2="3" />
      <line x1="13.5" y1="9" x2="13.5" y2="3" />
      {/* Pointed Feet at Apex */}
      <line x1="10.5" y1="3" x2="9" y2="2.5" />
      <line x1="13.5" y1="3" x2="15" y2="2.5" />
    </svg>
  )
}

/** Calisthenics, Pull-Ups & Bodyweight Mastery Glyph */
function CalisthenicsGlyph({ stroke, size }: { stroke: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">
      {/* Overhead Pull-Up Rig / Bar */}
      <line x1="2" y1="3.5" x2="22" y2="3.5" />
      <line x1="4" y1="2" x2="4" y2="5" />
      <line x1="20" y1="2" x2="20" y2="5" />
      {/* Athlete Hands Gripping Bar */}
      <circle cx="8.5" cy="3.5" r="0.9" fill={stroke} />
      <circle cx="15.5" cy="3.5" r="0.9" fill={stroke} />
      {/* Arms in Pull Flexion */}
      <path d="M8.5 4.5L10 8.5" />
      <path d="M15.5 4.5L14 8.5" />
      {/* Head */}
      <circle cx="12" cy="6.5" r="1.5" />
      {/* Torso in Hollow-Body Form */}
      <path d="M10 8.5h4" />
      <line x1="12" y1="8.5" x2="12" y2="14.5" />
      {/* Disciplined Extended Legs */}
      <line x1="12" y1="14.5" x2="11" y2="20.5" />
      <line x1="12" y1="14.5" x2="13" y2="20.5" />
    </svg>
  )
}

/** Single-Leg Balance & Proprioceptive Stability Glyph */
function BalanceGlyph({ stroke, size }: { stroke: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">
      {/* Ground Balance Line */}
      <line x1="4" y1="21" x2="20" y2="21" />
      {/* Head */}
      <circle cx="12" cy="4" r="1.8" />
      {/* Torso */}
      <line x1="12" y1="5.8" x2="12" y2="13" />
      {/* Outstretched Balancing Arms */}
      <path d="M4.5 9.5c2.5-.5 5-.5 7.5-.5s5 0 7.5.5" />
      {/* Planted Standing Support Leg */}
      <line x1="12" y1="13" x2="12" y2="21" />
      {/* Elevated Leg in Tree/Flamingo Balance Pose */}
      <path d="M12 14l4.5 2.5-4.5 2.5" />
    </svg>
  )
}

/** Continuous Glucose / Ketone Monitor (CGM) Bio-Wearable Glyph */
function CGMGlyph({ stroke, size }: { stroke: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">
      {/* Circular Sensor Patch Body */}
      <circle cx="12" cy="12" r="8" />
      {/* Central Biosensor Core */}
      <circle cx="12" cy="12" r="3.5" />
      <circle cx="12" cy="12" r="1.2" fill={stroke} />
      {/* Wireless Signal Telemetry Arcs */}
      <path d="M17 7.5a6.5 6.5 0 0 1 0 9" />
      <path d="M7 7.5a6.5 6.5 0 0 0 0 9" />
    </svg>
  )
}

/** Hyperbaric Oxygen Therapy (HBOT) Pressurized Capsule Chamber */
function HBOTGlyph({ stroke, size }: { stroke: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">
      {/* Capsule Chamber Body */}
      <rect x="2.5" y="6.5" width="19" height="11" rx="5.5" />
      {/* Observation Window Porthole */}
      <circle cx="12" cy="12" r="3.2" />
      {/* High-Pressure Support Base Feet */}
      <line x1="7" y1="17.5" x2="5.5" y2="20.5" />
      <line x1="17" y1="17.5" x2="18.5" y2="20.5" />
      {/* O2 Oxygen Purity Rings */}
      <circle cx="18" cy="9.5" r="1" />
      <circle cx="6" cy="9.5" r="1" />
    </svg>
  )
}

/** Oral Health & Longevity Glyph (Molar & Floss Protection) */
function OralHygieneGlyph({ stroke, size }: { stroke: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">
      {/* Anatomical Molar Crown & Roots */}
      <path d="M7 5c2-.5 3 .5 5 .5s3-1 5-.5c2 .5 2.5 3 2.5 5 0 3.5-1.5 6-3 9.5-1 2-2.2 2-2.7 0l-1.8-5.5-1.8 5.5c-.5 2-1.7 2-2.7 0-1.5-3.5-3-6-3-9.5 0-2 .5-4.5 2.5-5z" />
      {/* Protective Cleansing Sparkle */}
      <path d="M16 4l1.5-2 1.5 2" />
    </svg>
  )
}

/** Horse Stance / Active Thermogenesis Reheating Glyph */
function ThermogenesisGlyph({ stroke, size }: { stroke: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">
      {/* Ground Platform Line */}
      <line x1="3" y1="21" x2="21" y2="21" />
      {/* Head */}
      <circle cx="12" cy="4" r="1.6" />
      {/* Upright Torso */}
      <line x1="12" y1="5.6" x2="12" y2="12" />
      {/* Deep Horse Stance Squatting Legs */}
      <path d="M12 12l-4.5 2.5-1.5 6.5" />
      <path d="M12 12l4.5 2.5 1.5 6.5" />
      {/* Guarded Focus Arms */}
      <path d="M9 9.5l3 1.5 3-1.5" />
      {/* Core Metabolic Heat Flame */}
      <path d="M12 17.5c-1-1.2-1.5-1.8-1.5-2.5 0-1.2 1-2 1.5-2.5.5.5 1.5 1.3 1.5 2.5 0 .7-.5 1.3-1.5 2.5z" />
    </svg>
  )
}

/** Therapeutic Plasma Exchange / Blood Centrifugation Glyph */
function PlasmaExchangeGlyph({ stroke, size }: { stroke: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">
      {/* Outer Filtration Capsule */}
      <rect x="5.5" y="3" width="13" height="18" rx="3.5" />
      {/* Separation Membrane Divider */}
      <line x1="5.5" y1="12" x2="18.5" y2="12" strokeDasharray="2 2" />
      {/* Upper Plasma Chamber */}
      <circle cx="12" cy="7.5" r="2" />
      {/* Lower Cellular Blood Chamber */}
      <path d="M12 14.5c-1.5 1.5-2 2.5-2 3.5a2 2 0 0 0 4 0c0-1-.5-2-2-3.5z" fill={stroke} fillOpacity="0.2" />
    </svg>
  )
}

/** Contrast Therapy: Dual circulating hot & cold thermodynamic cycle */
function ContrastTherapyGlyph({ stroke, size }: { stroke: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">
      {/* Left Cold Wave Arc */}
      <path d="M12 3a9 9 0 0 0-8.5 6" />
      <path d="M3 5.5v3.5h3.5" />
      {/* Right Hot Wave Arc */}
      <path d="M12 21a9 9 0 0 0 8.5-6" />
      <path d="M21 18.5v-3.5h-3.5" />
      {/* Center Dual Thermal Indicator */}
      <path d="M9 12c1.5-1.5 2.5-1.5 4 0s2.5 1.5 4 0" />
      <path d="M12 9.5v5" />
    </svg>
  )
}

/** Hot Bath: Soaking tub with warm rising steam ripples */
function HotBathGlyph({ stroke, size }: { stroke: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11.5h18" />
      <path d="M4 11.5v5.5a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4v-5.5" />
      <line x1="6" y1="21" x2="5.5" y2="22.5" />
      <line x1="18" y1="21" x2="18.5" y2="22.5" />
      <path d="M8.5 4.5c-.6.8-.6 1.6 0 2.4s.6 1.6 0 2.4" />
      <path d="M15.5 4.5c-.6.8-.6 1.6 0 2.4s.6 1.6 0 2.4" />
    </svg>
  )
}

/** Red Light Therapy / Photobiomodulation: Focused LED panel emitting rays onto a human silhouette */
function RedLightGlyph({ stroke, size }: { stroke: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">
      {/* Vertical LED Light Panel */}
      <rect x="3" y="3.5" width="4.5" height="17" rx="1.5" />
      <circle cx="5.25" cy="7.5" r="0.75" fill={stroke} />
      <circle cx="5.25" cy="12" r="0.75" fill={stroke} />
      <circle cx="5.25" cy="16.5" r="0.75" fill={stroke} />
      {/* Directed Light Emission Rays */}
      <line x1="10.5" y1="7.5" x2="15" y2="7.5" />
      <line x1="10.5" y1="12" x2="16" y2="12" />
      <line x1="10.5" y1="16.5" x2="15" y2="16.5" />
      {/* Recipient Profile / Body Line */}
      <circle cx="19.5" cy="7.5" r="2" />
      <path d="M17.5 19v-4a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v4" />
    </svg>
  )
}

/** 16:8 Fasting / Time-Restricted Eating: Plate with distinct 16:8 fasting partition clock arc */
function FastingGlyph({ stroke, size }: { stroke: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">
      {/* Outer Dining Plate Rim */}
      <circle cx="12" cy="12" r="9" />
      {/* Inner Dining Plate Well */}
      <circle cx="12" cy="12" r="6.5" />
      {/* Fasting Window Arc (Highlights 16:8 split with open space) */}
      <path d="M8.5 15.5A6.5 6.5 0 1 1 12 5.5" strokeWidth="2.2" />
      {/* Clock Hands indicating Dinner-to-Noon (8PM to 12PM) */}
      <line x1="12" y1="12" x2="12" y2="7.5" />
      <line x1="12" y1="12" x2="9" y2="14.5" />
      <circle cx="12" cy="12" r="1" fill={stroke} />
    </svg>
  )
}

/** Seated Meditation: Zen lotus meditation figure with focused spinal alignment */
function MeditationGlyph({ stroke, size }: { stroke: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="2" />
      <line x1="12" y1="7" x2="12" y2="13" />
      <path d="M6 13.5l3-2.5 3 2 3-2 3 2.5" />
      <path d="M4.5 18.5c2-1.5 4.5-1.5 7.5-1.5s5.5 0 7.5 1.5" />
      <line x1="4" y1="19.5" x2="20" y2="19.5" />
    </svg>
  )
}

/** Breathwork: Anatomical lungs with open bronchial airflow corridors */
function BreathworkGlyph({ stroke, size }: { stroke: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">
      {/* Trachea & Airway */}
      <line x1="12" y1="3" x2="12" y2="7.5" />
      <path d="M12 7.5l-2.5 2" />
      <path d="M12 7.5l2.5 2" />
      {/* Left Anatomical Lung Lobe with generous dark interior space */}
      <path d="M9.5 9.5c-2.8 0-5 2.2-5 5.5 0 3.8 2.5 5.5 4.5 5.5h1.5v-11z" />
      {/* Right Anatomical Lung Lobe */}
      <path d="M14.5 9.5c2.8 0 5 2.2 5 5.5 0 3.8-2.5 5.5-4.5 5.5h-1.5v-11z" />
      {/* Internal Bronchial Airway Branches */}
      <path d="M8.5 13l-1.5 1.5" />
      <path d="M15.5 13l1.5 1.5" />
    </svg>
  )
}

/** NSDR / Yoga Nidra: Reclined figure in deep somatic relaxation with soft alpha/theta wave */
function NSDRGlyph({ stroke, size }: { stroke: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="19" x2="21" y2="19" />
      <circle cx="6.5" cy="14.5" r="1.8" />
      <path d="M8.5 16h11.5" />
      <path d="M8 9c2-1 4-1 6 0s4 1 6 0" />
      <path d="M10 6c1.5-.8 3-.8 4.5 0s3 .8 4.5 0" />
    </svg>
  )
}

/** Zone 2 Cardio: Heart coupled with continuous steady metabolic rhythm wave */
function Zone2Glyph({ stroke, size }: { stroke: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20.5l-6.5-6a4.8 4.8 0 0 1 0-6.8 4.8 4.8 0 0 1 6.8 0l-.3.3.3-.3a4.8 4.8 0 0 1 6.8 0 4.8 4.8 0 0 1 0 6.8z" />
      <path d="M6.5 13.5h3l1.5-3 2 6 1.5-3h3" />
    </svg>
  )
}

/** VILPA: Sprinting silhouette with burst acceleration cues */
function VILPAGlyph({ stroke, size }: { stroke: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="16" cy="5" r="1.8" />
      <line x1="14" y1="7" x2="11" y2="12" />
      <path d="M13 8.5l-3 2 1 3.5" />
      <path d="M13 8.5l3 2 2-1" />
      <path d="M11 12l2 3.5 3.5 1" />
      <path d="M11 12l-3.5 2-3.5-1" />
      <line x1="3" y1="7" x2="6.5" y2="7" />
      <line x1="2" y1="10" x2="5" y2="10" />
    </svg>
  )
}

/** Mobility & Dynamic Stretching: Full-range flexibility extension silhouette */
function MobilityGlyph({ stroke, size }: { stroke: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="4" r="1.8" />
      <path d="M12 6c0 2 1 4 2 6" />
      <path d="M7 7.5c2.5-1 7.5-1 10 0" />
      <path d="M14 12l-4.5 8.5" />
      <path d="M14 12l5 8.5" />
      <line x1="4" y1="21" x2="20" y2="21" strokeDasharray="2 2" />
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
  isIgnited: propIsIgnited,
  customColor,
  customIcon
}: ModalityIconProps) {
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
      // Guard against zero-size or unrendered/collapsed elements
      if (rect.width === 0 && rect.height === 0) return
      // Lights up only after scrolled past (trigger horizon at 45% of viewport, matching circadian time-block engine)
      const horizon = window.innerHeight * 0.45
      const isPast = (rect.top + rect.height / 2) <= horizon + 12
      setInternalIgnited(isPast)
    }

    let rafId: number | null = null
    const handleScrollOrResize = () => {
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        rafId = null
        checkIgnition()
      })
    }

    checkIgnition()
    window.addEventListener('scroll', handleScrollOrResize, { passive: true })
    window.addEventListener('resize', handleScrollOrResize, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize)
      window.removeEventListener('resize', handleScrollOrResize)
      if (rafId !== null) cancelAnimationFrame(rafId)
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

  const effectiveColorHex = customColor || modality?.color_hex || modality?.media_assets?.color_hex
  const grad = resolveGradient(nameLower, catLower, effectiveColorHex)
  // Crucial: Use solid high-luminance stroke color (grad.from) instead of SVG url(#gradId).
  // SVG linearGradient with default objectBoundingBox fails to paint any zero-width or zero-height
  // lines (e.g., BedDouble mattress line, Sun cardinal rays, Utensils center fork tine/handle),
  // causing parts of icons to disappear when lit up. Solid hex stroke guarantees 100% of every line is drawn.
  const effectiveStroke = activeIgnited ? grad.from : '#94A3B8'

  // Micro-precise edge definition for crisp lines:
  // We use a deep dark shadow (NO color blur!) that casts behind the stroke,
  // making high-luminance lines pop with crisp, high-contrast separation.
  const foregroundFilter = (glow && activeIgnited)
    ? 'drop-shadow(0 1px 1.5px rgba(0, 0, 0, 0.85))'
    : undefined

  // Helper renderer for Lucide icons using the gradient stroke & dual-layer lighting
  const renderLucide = (IconComponent: React.ComponentType<any>) => (
    <div 
      ref={containerRef}
      className={`relative inline-flex items-center justify-center shrink-0 transition-all duration-500 ease-out ${
        activeIgnited ? 'opacity-100 scale-100' : 'opacity-60 scale-95'
      } ${className}`}
    >
      {/* Layer 1: Ambient Background Lighting Halo (Soft, delicate aura that leaves negative space pitch-dark) */}
      {glow && activeIgnited && (
        <div 
          className="absolute inset-0 -m-1 rounded-full pointer-events-none transition-all duration-700 ease-out"
          style={{
            background: `radial-gradient(circle at center, ${grad.glow} 0%, ${grad.ambient || 'transparent'} 40%, transparent 70%)`,
            filter: 'blur(6px)',
            opacity: 0.32,
            transform: 'scale(1.2)'
          }}
        />
      )}

      {/* Layer 2: Foreground Razor-Sharp Vector Icon */}
      <div 
        className="relative z-10 inline-flex items-center justify-center transition-all duration-500"
        style={{ filter: foregroundFilter }}
      >
        <IconComponent 
          size={size} 
          stroke={effectiveStroke} 
          strokeWidth={1.65} 
          className="shrink-0 transition-all duration-500"
        />
      </div>
    </div>
  )

  // Helper renderer for custom SVG glyphs using the gradient stroke & dual-layer lighting
  const renderCustom = (GlyphComponent: React.ComponentType<{ stroke: string; size: number }>) => (
    <div 
      ref={containerRef}
      className={`relative inline-flex items-center justify-center shrink-0 transition-all duration-500 ease-out ${
        activeIgnited ? 'opacity-100 scale-100' : 'opacity-60 scale-95'
      } ${className}`}
    >
      {/* Layer 1: Ambient Background Lighting Halo (Soft, delicate aura that leaves negative space pitch-dark) */}
      {glow && activeIgnited && (
        <div 
          className="absolute inset-0 -m-1 rounded-full pointer-events-none transition-all duration-700 ease-out"
          style={{
            background: `radial-gradient(circle at center, ${grad.glow} 0%, ${grad.ambient || 'transparent'} 40%, transparent 70%)`,
            filter: 'blur(6px)',
            opacity: 0.32,
            transform: 'scale(1.2)'
          }}
        />
      )}

      {/* Layer 2: Foreground Razor-Sharp Vector Icon */}
      <div 
        className="relative z-10 inline-flex items-center justify-center transition-all duration-500"
        style={{ filter: foregroundFilter }}
      >
        <GlyphComponent stroke={effectiveStroke} size={size} />
      </div>
    </div>
  )

  // Check for explicit custom icon passed or stored in modality
  const explicitIcon = (customIcon || modality?.icon || modality?.icon_name || modality?.media_assets?.icon || '').trim()
  if (explicitIcon) {
    switch (explicitIcon.toLowerCase()) {
      case 'coldplunge':
      case 'cold_plunge':
        return renderCustom(ColdPlungeGlyph)
      case 'sauna':
      case 'detailedsauna':
        return renderCustom(DetailedSaunaGlyph)
      case 'peptidesyringe':
      case 'peptide':
      case 'syringe':
        return renderCustom(PeptideSyringeGlyph)
      case 'handstand':
        return renderCustom(HandstandGlyph)
      case 'balance':
        return renderCustom(BalanceGlyph)
      case 'calisthenics':
        return renderCustom(CalisthenicsGlyph)
      case 'hbot':
        return renderCustom(HBOTGlyph)
      case 'cgm':
        return renderCustom(CGMGlyph)
      case 'oralhygiene':
      case 'dental':
        return renderCustom(OralHygieneGlyph)
      case 'thermogenesis':
        return renderCustom(ThermogenesisGlyph)
      case 'plasmaexchange':
        return renderCustom(PlasmaExchangeGlyph)
      case 'contrasttherapy':
        return renderCustom(ContrastTherapyGlyph)
      case 'hotbath':
        return renderCustom(HotBathGlyph)
      case 'redlight':
        return renderCustom(RedLightGlyph)
      case 'fasting':
        return renderCustom(FastingGlyph)
      case 'meditation':
        return renderCustom(MeditationGlyph)
      case 'breathwork':
        return renderCustom(BreathworkGlyph)
      case 'nsdr':
        return renderCustom(NSDRGlyph)
      case 'zone2':
        return renderCustom(Zone2Glyph)
      case 'vilpa':
        return renderCustom(VILPAGlyph)
      case 'mobility':
        return renderCustom(MobilityGlyph)
      case 'waves':
        return renderLucide(Waves)
      case 'compass':
        return renderLucide(Compass)
      case 'target':
        return renderLucide(Target)
      case 'wind':
        return renderLucide(Wind)
      case 'shieldalert':
        return renderLucide(ShieldAlert)
      case 'sparkle':
        return renderLucide(Sparkle)
      case 'layers':
        return renderLucide(Layers)
      case 'radio':
        return renderLucide(Radio)
      case 'eye':
        return renderLucide(Eye)
      case 'zap':
        return renderLucide(Zap)
      case 'thermometer':
        return renderLucide(Thermometer)
      case 'dumbbell':
        return renderLucide(Dumbbell)
      case 'brain':
        return renderLucide(Brain)
      case 'atom':
        return renderLucide(Atom)
      case 'moon':
        return renderLucide(Moon)
      case 'scale':
        return renderLucide(Scale)
      case 'heartpulse':
        return renderLucide(HeartPulse)
      case 'flame':
        return renderLucide(Flame)
      case 'shield':
        return renderLucide(Shield)
      case 'sun':
        return renderLucide(Sun)
      case 'pill':
        return renderLucide(Pill)
      case 'scanline':
        return renderLucide(ScanLine)
      default:
        break
    }
  }

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
    nameLower.includes('glp-1') ||
    nameLower.includes('glp1') ||
    nameLower.includes('aod') ||
    nameLower.includes('tesamorelin') ||
    nameLower.includes('sermorelin') ||
    nameLower.includes('subq') ||
    nameLower.includes('syringe') ||
    nameLower.includes('needle') ||
    nameLower.includes('inject')
  ) {
    return renderCustom(PeptideSyringeGlyph)
  }

  // 2. SPECIALTY CLINICAL PROCEDURES & BIO-WEARABLES
  if (nameLower.includes('hbot') || nameLower.includes('hyperbaric') || nameLower.includes('ewot') || nameLower.includes('oxygen chamber') || nameLower.includes('oxygen therapy')) {
    return renderCustom(HBOTGlyph)
  }
  if (nameLower.includes('plasma exchange') || nameLower.includes('tpe') || nameLower.includes('plasmapheresis') || nameLower.includes('stem cell')) {
    return renderCustom(PlasmaExchangeGlyph)
  }
  if (nameLower.includes('oral') || nameLower.includes('teeth') || nameLower.includes('tooth') || nameLower.includes('floss') || nameLower.includes('mouthwash') || nameLower.includes('dental') || nameLower.includes('brushing')) {
    return renderCustom(OralHygieneGlyph)
  }
  if (nameLower.includes('cgm') || nameLower.includes('continuous glucose') || nameLower.includes('glucose monitor') || nameLower.includes('ketone monitor') || nameLower.includes('sensor')) {
    return renderCustom(CGMGlyph)
  }

  // 3. THERMAL / RECOVERY
  if (nameLower.includes('cold plunge') || nameLower.includes('ice bath') || nameLower.includes('cold water') || nameLower.includes('cryotherapy') || nameLower.includes('cold immersion')) {
    return renderCustom(ColdPlungeGlyph)
  }
  if (nameLower.includes('horse stance') || nameLower.includes('reheat') || nameLower.includes('søberg') || nameLower.includes('soberg')) {
    return renderCustom(ThermogenesisGlyph)
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

  // 4. FITNESS, CALISTHENICS & MOVEMENT (Precision classification - handstand & bodyweight NEVER dumbbells)
  if (
    nameLower.includes('handstand') ||
    nameLower.includes('inversion') ||
    nameLower.includes('headstand') ||
    nameLower.includes('feet-up-the-wall') ||
    nameLower.includes('wall handstand')
  ) {
    return renderCustom(HandstandGlyph)
  }
  if (
    nameLower.includes('balance') ||
    nameLower.includes('stability') ||
    nameLower.includes('proprioception') ||
    nameLower.includes('single-leg') ||
    nameLower.includes('single leg')
  ) {
    return renderCustom(BalanceGlyph)
  }
  if (
    nameLower.includes('calisthenic') ||
    nameLower.includes('murph') ||
    nameLower.includes('hero wod') ||
    nameLower.includes('crossfit') ||
    nameLower.includes('cindy') ||
    nameLower.includes('pull-up') ||
    nameLower.includes('pull up') ||
    nameLower.includes('chin-up') ||
    nameLower.includes('chin up') ||
    nameLower.includes('dip') ||
    nameLower.includes('push-up') ||
    nameLower.includes('pushup') ||
    nameLower.includes('bodyweight') ||
    nameLower.includes('nordic') ||
    nameLower.includes('tibialis') ||
    nameLower.includes('slant board') ||
    nameLower.includes('step-up') ||
    nameLower.includes('isometric') ||
    nameLower.includes('core hold') ||
    nameLower.includes('plank')
  ) {
    return renderCustom(CalisthenicsGlyph)
  }
  if (nameLower.includes('zone 2') || nameLower.includes('aerobic base') || nameLower.includes('cardio base') || nameLower.includes('vo2 max')) {
    return renderCustom(Zone2Glyph)
  }
  if (nameLower.includes('vilpa') || nameLower.includes('micro-burst') || nameLower.includes('sprint') || nameLower.includes('interval')) {
    return renderCustom(VILPAGlyph)
  }
  if (nameLower.includes('hiit') || nameLower.includes('tabata') || nameLower.includes('anaerobic')) {
    return renderLucide(Zap)
  }
  if (nameLower.includes('cycling') || nameLower.includes('bike') || nameLower.includes('biking') || nameLower.includes('spin') || nameLower.includes('peloton')) {
    return renderLucide(Bike)
  }
  if (
    nameLower.includes('walk') ||
    nameLower.includes('glucose walk') ||
    nameLower.includes('post-meal walk') ||
    nameLower.includes('optic flow') ||
    nameLower.includes('ambulation') ||
    nameLower.includes('steps') ||
    nameLower.includes('hiking') ||
    nameLower.includes('stride') ||
    nameLower.includes('treadmill walk')
  ) {
    return renderLucide(Footprints)
  }
  if (nameLower.includes('run') || nameLower.includes('jog') || nameLower.includes('5k') || nameLower.includes('treadmill')) {
    return renderCustom(VILPAGlyph)
  }
  if (
    nameLower.includes('stretch') ||
    nameLower.includes('mobility') ||
    nameLower.includes('yoga') ||
    nameLower.includes('flexibility') ||
    nameLower.includes('rom') ||
    nameLower.includes('pilates') ||
    nameLower.includes('foam roll') ||
    nameLower.includes('recovery day') ||
    nameLower.includes('recovery technique')
  ) {
    return renderCustom(MobilityGlyph)
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
    nameLower.includes('push day') ||
    nameLower.includes('pull day') ||
    nameLower.includes('leg day') ||
    nameLower.includes('exercise routine') ||
    nameLower.includes('structural resilience') ||
    nameLower.includes('gym') ||
    nameLower.includes('bfr')
  ) {
    return renderLucide(Dumbbell)
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

  // 5. CIRCADIAN & LIGHT
  if (nameLower.includes('red light') || nameLower.includes('photobio') || nameLower.includes('pbm') || nameLower.includes('infrared panel')) {
    return renderCustom(RedLightGlyph)
  }
  if (nameLower.includes('morning light') || nameLower.includes('sunrise') || nameLower.includes('outdoor light') || nameLower.includes('lux') || nameLower.includes('sunlight')) {
    return renderLucide(Sunrise)
  }
  if (nameLower.includes('blue light') || nameLower.includes('screen') || nameLower.includes('glasses') || nameLower.includes('screen filter') || nameLower.includes('amber glasses')) {
    return renderLucide(Glasses)
  }
  if (nameLower.includes('evening darkness') || nameLower.includes('dark room') || nameLower.includes('dim light') || nameLower.includes('blackout')) {
    return renderLucide(Moon)
  }

  // 6. MIND & NERVOUS SYSTEM
  if (
    nameLower.includes('breath') ||
    nameLower.includes('sigh') ||
    nameLower.includes('4-7-8') ||
    nameLower.includes('box breath') ||
    nameLower.includes('coherent') ||
    nameLower.includes('hyperventilation') ||
    nameLower.includes('wim hof') ||
    nameLower.includes('exhale') ||
    nameLower.includes('humming')
  ) {
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
  if (
    nameLower.includes('focus') ||
    nameLower.includes('brain') ||
    nameLower.includes('cognitive') ||
    nameLower.includes('neuro') ||
    nameLower.includes('nootropic') ||
    nameLower.includes('mental') ||
    nameLower.includes('fortitude')
  ) {
    return renderLucide(Brain)
  }
  if (nameLower.includes('time block') || nameLower.includes('timer')) {
    return renderLucide(Timer)
  }

  // 7. NUTRITION & METABOLIC
  if (nameLower.includes('fasting') || nameLower.includes('fast') || nameLower.includes('omad') || nameLower.includes('tre') || nameLower.includes('time-restricted')) {
    return renderCustom(FastingGlyph)
  }
  if (nameLower.includes('water') || nameLower.includes('hydrate') || nameLower.includes('hydration') || nameLower.includes('electrolytes') || nameLower.includes('salt')) {
    return renderLucide(Droplets)
  }
  if (nameLower.includes('caffeine') || nameLower.includes('coffee') || nameLower.includes('tea') || nameLower.includes('espresso') || nameLower.includes('matcha')) {
    return renderLucide(Coffee)
  }
  if (
    nameLower.includes('protein') ||
    nameLower.includes('shake') ||
    nameLower.includes('whey') ||
    nameLower.includes('collagen') ||
    nameLower.includes('amino') ||
    nameLower.includes('lysine') ||
    nameLower.includes('iron') ||
    nameLower.includes('heme')
  ) {
    return renderLucide(Activity)
  }
  if (
    nameLower.includes('meal') ||
    nameLower.includes('food') ||
    nameLower.includes('dinner') ||
    nameLower.includes('lunch') ||
    nameLower.includes('breakfast') ||
    nameLower.includes('salad') ||
    nameLower.includes('pudding') ||
    nameLower.includes('olive oil') ||
    nameLower.includes('evoo') ||
    nameLower.includes('vinegar') ||
    nameLower.includes('acetic') ||
    nameLower.includes('nutrition') ||
    catLower.includes('nutrition')
  ) {
    return renderLucide(Utensils)
  }

  // 8. SUPPLEMENTS & BIOACTIVES (Granular varieties)
  // Cellular & Mitochondrial Bioenergetics (Atom)
  if (
    nameLower.includes('nmn') ||
    nameLower.includes('nr ') ||
    nameLower.includes('nicotinamide') ||
    nameLower.includes('nad+') ||
    nameLower.includes('nad') ||
    nameLower.includes('coq10') ||
    nameLower.includes('ubiquinol') ||
    nameLower.includes('methylene blue') ||
    nameLower.includes('alpha-ketoglutarate') ||
    nameLower.includes('ca-akg') ||
    nameLower.includes('akg') ||
    nameLower.includes('urolithin') ||
    nameLower.includes('mitochondria') ||
    nameLower.includes('creatine') ||
    nameLower.includes('carnosine') ||
    nameLower.includes('l-carnosine') ||
    nameLower.includes('alpha-lipoic') ||
    nameLower.includes('ala')
  ) {
    return renderLucide(Atom)
  }

  // Senolytics & Longevity Synergies (Sparkles)
  if (
    nameLower.includes('fisetin') ||
    nameLower.includes('quercetin') ||
    nameLower.includes('senolytic') ||
    nameLower.includes('spermidine') ||
    nameLower.includes('glyteine') ||
    nameLower.includes('glutathione')
  ) {
    return renderLucide(Sparkles)
  }

  // Nootropics & Cognitive Enhancers (Brain)
  if (
    nameLower.includes("lion's mane") ||
    nameLower.includes('lions mane') ||
    nameLower.includes('bacopa') ||
    nameLower.includes('alpha-gpc') ||
    nameLower.includes('phosphatidylserine') ||
    nameLower.includes('tyrosine') ||
    nameLower.includes('huperzine') ||
    nameLower.includes('l-theanine') ||
    nameLower.includes('theanine') ||
    nameLower.includes('lithium')
  ) {
    return renderLucide(Brain)
  }

  // Sleep & Restorative Minerals (Moon)
  if (
    nameLower.includes('apigenin') ||
    nameLower.includes('magnesium') ||
    nameLower.includes('gaba') ||
    nameLower.includes('glycine') ||
    nameLower.includes('melatonin') ||
    nameLower.includes('tart cherry')
  ) {
    return renderLucide(Moon)
  }

  // Cardiovascular & Circulation Longevity (HeartPulse)
  if (
    nameLower.includes('apob') ||
    nameLower.includes('omega-3') ||
    nameLower.includes('fish oil') ||
    nameLower.includes('phytosterol') ||
    nameLower.includes('citrulline') ||
    nameLower.includes('nitric oxide') ||
    nameLower.includes('garlic') ||
    nameLower.includes('red yeast rice') ||
    nameLower.includes('circulation') ||
    nameLower.includes('aspirin') ||
    nameLower.includes('cocoa') ||
    nameLower.includes('flavanol')
  ) {
    return renderLucide(HeartPulse)
  }

  // Metabolic, Glucose & Insulin Regulators (Scale)
  if (
    nameLower.includes('berberine') ||
    nameLower.includes('metformin') ||
    nameLower.includes('acarbose') ||
    nameLower.includes('inositol') ||
    nameLower.includes('chromium') ||
    nameLower.includes('cinnamon') ||
    nameLower.includes('glucose control')
  ) {
    return renderLucide(Scale)
  }

  // Vitality, Adaptogens & Hormonal Axis (Flame)
  if (
    nameLower.includes('ashwagandha') ||
    nameLower.includes('rhodiola') ||
    nameLower.includes('shilajit') ||
    nameLower.includes('tongkat') ||
    nameLower.includes('fadogia') ||
    nameLower.includes('cordyceps') ||
    nameLower.includes('taurine')
  ) {
    return renderLucide(Flame)
  }

  // Cytoprotection, Detoxification & Cellular Defense (Shield)
  if (
    nameLower.includes('sulforaphane') ||
    nameLower.includes('broc elite') ||
    nameLower.includes('nac') ||
    nameLower.includes('n-acetyl') ||
    nameLower.includes('tudca') ||
    nameLower.includes('milk thistle') ||
    nameLower.includes('astaxanthin') ||
    nameLower.includes('resveratrol') ||
    nameLower.includes('rapamycin') ||
    nameLower.includes('curcumin') ||
    nameLower.includes('turmeric') ||
    nameLower.includes('genistein') ||
    nameLower.includes('ndga') ||
    nameLower.includes('glucosamine') ||
    nameLower.includes('lycopene') ||
    nameLower.includes('ginger')
  ) {
    return renderLucide(Shield)
  }

  // Sunlight Vitamins, Minerals & Methylation (Sun)
  if (
    nameLower.includes('vitamin d') ||
    nameLower.includes('d3') ||
    nameLower.includes('vitamin k') ||
    nameLower.includes('k2') ||
    nameLower.includes('vitamin c') ||
    nameLower.includes('ascorbic') ||
    nameLower.includes('vitamin e') ||
    nameLower.includes('tocopherol') ||
    nameLower.includes('zinc') ||
    nameLower.includes('copper') ||
    nameLower.includes('boron') ||
    nameLower.includes('iodine') ||
    nameLower.includes('b-complex') ||
    nameLower.includes('b12') ||
    nameLower.includes('folate') ||
    nameLower.includes('methylation') ||
    nameLower.includes('mthfr')
  ) {
    return renderLucide(Sun)
  }

  // Generic Supplement / Stack Fallback
  if (
    nameLower.includes('supplement') ||
    nameLower.includes('stack') ||
    nameLower.includes('capsule') ||
    nameLower.includes('pill') ||
    catLower.includes('supplement') ||
    modality?.modality_type === 'supplement'
  ) {
    return renderLucide(Pill)
  }

  // 9. SLEEP & HYGIENE (Only non-peptide sleep modalities)
  if (nameLower.includes('mouth tape') || nameLower.includes('airway') || nameLower.includes('nasal')) {
    return renderLucide(ShieldCheck)
  }
  if (nameLower.includes('wind down') || nameLower.includes('wind-down') || nameLower.includes('evening routine')) {
    return renderLucide(Moon)
  }
  if (nameLower.includes('sleep') || nameLower.includes('bed') || nameLower.includes('deep sleep') || nameLower.includes('rem sleep')) {
    return renderLucide(BedDouble)
  }

  // 10. DIAGNOSTICS & BIOMARKERS
  if (
    catLower.includes('diagnostic') ||
    catLower.includes('biomarker') ||
    catLower.includes('tracking') ||
    nameLower.includes('scan') ||
    nameLower.includes('screen') ||
    nameLower.includes('panel') ||
    nameLower.includes('clock') ||
    nameLower.includes('dunedin') ||
    nameLower.includes('mri') ||
    nameLower.includes('dexa') ||
    nameLower.includes('blood') ||
    nameLower.includes('lab') ||
    nameLower.includes('test') ||
    nameLower.includes('cpet') ||
    nameLower.includes('cac')
  ) {
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
