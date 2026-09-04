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
  ambient: string
}

const CATEGORY_GRADIENTS: Record<string, GradientConfig> = {
  // Thermal & Environmental
  thermal_cold: { 
    from: '#38BDF8', // Luminous Ice Cyan
    to: '#34D399',   // Radiant Mint
    glow: 'rgba(56, 189, 248, 0.75)', 
    ambient: 'rgba(52, 211, 153, 0.35)' 
  },
  thermal_heat: { 
    from: '#FB923C', // Luminous Ember Orange
    to: '#F87171',   // Infrared Coral (High luminance, never dark crimson)
    glow: 'rgba(251, 146, 60, 0.75)', 
    ambient: 'rgba(248, 113, 113, 0.35)' 
  },
  thermal_contrast: { 
    from: '#22D3EE', // Vivid Cyan
    to: '#FB923C',   // Radiant Coral
    glow: 'rgba(34, 211, 238, 0.75)', 
    ambient: 'rgba(251, 146, 60, 0.35)' 
  },
  
  // Fitness & Movement
  fitness: { 
    from: '#34D399', // Vital Emerald
    to: '#22D3EE',   // Electric Cyan
    glow: 'rgba(52, 211, 153, 0.75)', 
    ambient: 'rgba(34, 211, 238, 0.35)' 
  },
  fitness_intense: { 
    from: '#FBBF24', // Luminous Solar Amber
    to: '#FB7185',   // Vivid Neon Coral
    glow: 'rgba(251, 191, 36, 0.75)', 
    ambient: 'rgba(251, 113, 133, 0.35)' 
  },
  
  // Mind & Nervous System
  mind: { 
    from: '#C084FC', // Electric Violet
    to: '#818CF8',   // Luminous Periwinkle
    glow: 'rgba(192, 132, 252, 0.75)', 
    ambient: 'rgba(129, 140, 248, 0.35)' 
  },
  
  // Sleep & Circadian - Upgraded to luminous periwinkle and ice moonlight (NO dark #312E81!)
  sleep: { 
    from: '#A5B4FC', // Soft Radiant Lavender
    to: '#C7D2FE',   // Ice Moonlight
    glow: 'rgba(165, 180, 252, 0.75)', 
    ambient: 'rgba(199, 210, 254, 0.35)' 
  },
  circadian: { 
    from: '#FDE047', // Radiant Solar Gold
    to: '#38BDF8',   // Daylight Sky Blue
    glow: 'rgba(253, 224, 71, 0.75)', 
    ambient: 'rgba(56, 189, 248, 0.35)' 
  },
  
  // Nutrition & Metabolic
  nutrition: { 
    from: '#34D399', // Radiant Mint
    to: '#FBBF24',   // Golden Bio-Amber
    glow: 'rgba(52, 211, 153, 0.75)', 
    ambient: 'rgba(251, 191, 36, 0.35)' 
  },
  fasting: { 
    from: '#FDE047', // Solar Gold (High luminance, never muddy dark gold)
    to: '#F59E0B',   // Radiant Amber Core
    glow: 'rgba(253, 224, 71, 0.75)', 
    ambient: 'rgba(245, 158, 11, 0.35)' 
  },
  
  // Peptides & Bioactives
  peptides: { 
    from: '#E879F9', // Neon Bioactive Fuchsia
    to: '#F472B6',   // Radiant Bioactive Rose
    glow: 'rgba(232, 121, 249, 0.75)', 
    ambient: 'rgba(244, 114, 182, 0.35)' 
  },
  
  // Diagnostics & Biomarkers
  diagnostics: { 
    from: '#22D3EE', // High-Tech Cyan
    to: '#60A5FA',   // Biomarker Cobalt Blue
    glow: 'rgba(34, 211, 238, 0.75)', 
    ambient: 'rgba(96, 165, 250, 0.35)' 
  },
  
  // Fallback / General Longevity
  default: { 
    from: '#34D399', 
    to: '#22D3EE', 
    glow: 'rgba(52, 211, 153, 0.7)', 
    ambient: 'rgba(34, 211, 238, 0.35)' 
  }
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
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
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
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
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

/** Precision Subcutaneous Peptide Syringe & Micro-Needle (True medical insulin syringe, NOT a trumpet) */
function PeptideSyringeGlyph({ stroke, size }: { stroke: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
      {/* Finger Grip Flange Wings at barrel top */}
      <line x1="5.5" y1="16.5" x2="8.5" y2="19.5" />
      {/* Plunger Shaft extended backwards */}
      <line x1="6" y1="18" x2="3.5" y2="20.5" />
      {/* Thumb Press Disc */}
      <line x1="2" y1="20" x2="4.5" y2="22.5" />
      {/* Syringe Cylindrical Barrel */}
      <path d="M7 17l9.5-9.5 2 2L9 19z" />
      {/* Precision Dose Graduation Measurement Marks */}
      <line x1="10" y1="13" x2="11.5" y2="11.5" />
      <line x1="12" y1="11" x2="13.5" y2="9.5" />
      <line x1="14" y1="9" x2="15.5" y2="7.5" />
      {/* Needle Hub Collar */}
      <line x1="16.5" y1="7.5" x2="18.5" y2="9.5" />
      {/* Ultra-Fine Micro-Needle Shaft */}
      <line x1="17.5" y1="8.5" x2="21.5" y2="4.5" />
      {/* Active Bioactive Micro-Droplet at Tip */}
      <circle cx="22" cy="4" r="0.75" fill={stroke} />
    </svg>
  )
}

/** Handstand & Inversion Balance Glyph (Inverted gymnast hold, explicitly NOT a dumbbell) */
function HandstandGlyph({ stroke, size }: { stroke: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
      {/* Floor / Ground Platform Line */}
      <line x1="4" y1="21" x2="20" y2="21" />
      {/* Left Palm & Forearm Planted */}
      <line x1="8.5" y1="21" x2="9.5" y2="15" />
      {/* Right Palm & Forearm Planted */}
      <line x1="15.5" y1="21" x2="14.5" y2="15" />
      {/* Inverted Head Tucked Between Shoulders */}
      <circle cx="12" cy="18" r="1.5" />
      {/* Shoulder Girdle */}
      <path d="M9 15h6" />
      {/* Inverted Torso Extending Vertically */}
      <line x1="12" y1="15" x2="12" y2="9.5" />
      {/* Pelvis / Hip Line */}
      <path d="M10 9.5h4" />
      {/* Extended Legs in Strict Vertical Hold */}
      <line x1="10.5" y1="9.5" x2="10.5" y2="3.5" />
      <line x1="13.5" y1="9.5" x2="13.5" y2="3.5" />
      {/* Pointed Feet at Apex */}
      <line x1="10.5" y1="3.5" x2="9" y2="3" />
      <line x1="13.5" y1="3.5" x2="15" y2="3" />
    </svg>
  )
}

/** Calisthenics, Pull-Ups & Bodyweight Mastery Glyph */
function CalisthenicsGlyph({ stroke, size }: { stroke: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
      {/* Overhead Pull-Up Rig / Bar */}
      <line x1="3" y1="3.5" x2="21" y2="3.5" />
      <line x1="5" y1="3.5" x2="5" y2="5.5" />
      <line x1="19" y1="3.5" x2="19" y2="5.5" />
      {/* Athlete Hands Gripping Bar */}
      <line x1="8.5" y1="3.5" x2="8.5" y2="5" />
      <line x1="15.5" y1="3.5" x2="15.5" y2="5" />
      {/* Arms in Pull Flexion */}
      <path d="M8.5 5L10 9.5" />
      <path d="M15.5 5L14 9.5" />
      {/* Head */}
      <circle cx="12" cy="7.5" r="1.5" />
      {/* Torso in Hollow-Body Form */}
      <path d="M10 9.5h4" />
      <line x1="12" y1="9.5" x2="12" y2="15.5" />
      {/* Disciplined Extended Legs */}
      <path d="M12 15.5l-1 5.5" />
      <path d="M12 15.5l1 5.5" />
    </svg>
  )
}

/** Single-Leg Balance & Proprioceptive Stability Glyph */
function BalanceGlyph({ stroke, size }: { stroke: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
      {/* Ground Balance Line */}
      <line x1="4" y1="21" x2="20" y2="21" />
      {/* Head */}
      <circle cx="12" cy="4" r="1.75" />
      {/* Torso */}
      <line x1="12" y1="6" x2="12" y2="13" />
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
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
      {/* Circular Sensor Patch Body */}
      <circle cx="12" cy="12" r="7.5" />
      {/* Central Biosensor Core */}
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="1" fill={stroke} />
      {/* Wireless Signal Telemetry Arcs */}
      <path d="M17.5 8a8.5 8.5 0 0 1 0 8" />
      <path d="M6.5 8a8.5 8.5 0 0 0 0 8" />
    </svg>
  )
}

/** Hyperbaric Oxygen Therapy (HBOT) Pressurized Capsule Chamber */
function HBOTGlyph({ stroke, size }: { stroke: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
      {/* Capsule Chamber Body */}
      <rect x="2.5" y="7" width="19" height="10" rx="5" />
      {/* Observation Window Porthole */}
      <circle cx="12" cy="12" r="3" />
      {/* High-Pressure Support Base Feet */}
      <line x1="7" y1="17" x2="5.5" y2="20.5" />
      <line x1="17" y1="17" x2="18.5" y2="20.5" />
      {/* O2 Oxygen Purity Rings */}
      <circle cx="18" cy="9.5" r="1" />
      <circle cx="6" cy="9.5" r="1" />
    </svg>
  )
}

/** Oral Health & Longevity Glyph (Molar & Floss Protection) */
function OralHygieneGlyph({ stroke, size }: { stroke: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
      {/* Anatomical Molar Crown & Roots */}
      <path d="M7 4.5c2-.5 3 .5 5 .5s3-1 5-.5c2 .5 2.5 3 2.5 5 0 3.5-1.5 6-3 10-1 2.5-2.5 2.5-3 0l-1.5-6-1.5 6c-.5 2.5-2 2.5-3 0-1.5-4-3-6.5-3-10 0-2 .5-4.5 2.5-5z" />
      {/* Protective Cleansing Sparkle */}
      <path d="M16 4l1.5-2 1.5 2" />
    </svg>
  )
}

/** Horse Stance / Active Thermogenesis Reheating Glyph */
function ThermogenesisGlyph({ stroke, size }: { stroke: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
      {/* Ground Platform Line */}
      <line x1="3" y1="21" x2="21" y2="21" />
      {/* Head */}
      <circle cx="12" cy="4" r="1.5" />
      {/* Upright Torso */}
      <line x1="12" y1="5.5" x2="12" y2="12" />
      {/* Deep Horse Stance Squatting Legs */}
      <path d="M12 12l-4.5 2.5-1.5 6.5" />
      <path d="M12 12l4.5 2.5 1.5 6.5" />
      {/* Guarded Focus Arms */}
      <path d="M9 9l3 1.5 3-1.5" />
      {/* Core Metabolic Heat Flame */}
      <path d="M12 17c-.8-1-1.2-1.5-1.2-2.2 0-1 .8-1.8 1.2-2.3.4.5 1.2 1.3 1.2 2.3 0 .7-.4 1.2-1.2 2.2z" />
    </svg>
  )
}

/** Therapeutic Plasma Exchange / Blood Centrifugation Glyph */
function PlasmaExchangeGlyph({ stroke, size }: { stroke: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
      {/* Outer Filtration Capsule */}
      <rect x="5" y="3" width="14" height="18" rx="4" />
      {/* Separation Membrane Divider */}
      <line x1="5" y1="12" x2="19" y2="12" strokeDasharray="2 2" />
      {/* Upper Plasma Chamber */}
      <circle cx="12" cy="7.5" r="2" />
      {/* Lower Cellular Blood Chamber */}
      <path d="M12 15c-1.5 1.5-2 2.5-2 3.5a2 2 0 0 0 4 0c0-1-.5-2-2-3.5z" fill={stroke} fillOpacity="0.3" />
    </svg>
  )
}

/** Contrast Therapy: Dual circulating hot & cold thermodynamic cycle */
function ContrastTherapyGlyph({ stroke, size }: { stroke: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
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
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
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
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
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
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5.5" strokeDasharray="2 2" />
      <path d="M12 8v4l3 2" />
    </svg>
  )
}

/** Seated Meditation: Zen lotus meditation figure with focused spinal alignment */
function MeditationGlyph({ stroke, size }: { stroke: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
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
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
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
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
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
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20.5l-7-6.5A5 5 0 0 1 12 7.5a5 5 0 0 1 7 6.5l-7 6.5z" />
      <path d="M8 14h2l1.2-2.5 1.6 5 1.2-2.5H16" />
    </svg>
  )
}

/** VILPA: Sprinting silhouette with burst acceleration cues */
function VILPAGlyph({ stroke, size }: { stroke: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
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
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
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

  const grad = resolveGradient(nameLower, catLower)
  const effectiveStroke = activeIgnited ? `url(#${gradId})` : '#94A3B8'

  // Micro-precise edge definition for crisp lines:
  // Instead of a 5px blur that bleeds across adjacent lines, we use a 1px intense luminous rim
  // plus an ultra-subtle shadow for razor-sharp edge contrast against any background.
  const foregroundFilter = (glow && activeIgnited)
    ? `drop-shadow(0 0 1.2px ${grad.glow}) drop-shadow(0 1px 1.5px rgba(0, 0, 0, 0.45))`
    : undefined

  // Helper renderer for Lucide icons using the gradient stroke & dual-layer lighting
  const renderLucide = (IconComponent: React.ComponentType<any>) => (
    <div 
      ref={containerRef}
      className={`relative inline-flex items-center justify-center shrink-0 transition-all duration-500 ease-out ${
        activeIgnited ? 'opacity-100 scale-100' : 'opacity-60 scale-95'
      } ${className}`}
    >
      {/* Layer 1: Ambient Background Lighting Aura (Radiates softly behind the icon without blurring strokes) */}
      {glow && activeIgnited && (
        <div 
          className="absolute inset-0 -m-1.5 rounded-full pointer-events-none transition-all duration-700 ease-out"
          style={{
            background: `radial-gradient(circle at center, ${grad.glow} 0%, ${grad.ambient || 'transparent'} 50%, transparent 80%)`,
            filter: 'blur(5px)',
            opacity: 0.75,
            transform: 'scale(1.2)'
          }}
        />
      )}

      {/* SVG Linear Gradient Definition */}
      <svg width={0} height={0} className="absolute pointer-events-none">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={grad.from} />
            <stop offset="100%" stopColor={grad.to} />
          </linearGradient>
        </defs>
      </svg>

      {/* Layer 2: Foreground Razor-Sharp Vector Icon */}
      <div 
        className="relative z-10 inline-flex items-center justify-center transition-all duration-500"
        style={{ filter: foregroundFilter }}
      >
        <IconComponent 
          size={size} 
          stroke={effectiveStroke} 
          strokeWidth={1.85} 
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
      {/* Layer 1: Ambient Background Lighting Aura (Radiates softly behind the icon without blurring strokes) */}
      {glow && activeIgnited && (
        <div 
          className="absolute inset-0 -m-1.5 rounded-full pointer-events-none transition-all duration-700 ease-out"
          style={{
            background: `radial-gradient(circle at center, ${grad.glow} 0%, ${grad.ambient || 'transparent'} 50%, transparent 80%)`,
            filter: 'blur(5px)',
            opacity: 0.75,
            transform: 'scale(1.2)'
          }}
        />
      )}

      {/* SVG Linear Gradient Definition */}
      <svg width={0} height={0} className="absolute pointer-events-none">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={grad.from} />
            <stop offset="100%" stopColor={grad.to} />
          </linearGradient>
        </defs>
      </svg>

      {/* Layer 2: Foreground Razor-Sharp Vector Icon */}
      <div 
        className="relative z-10 inline-flex items-center justify-center transition-all duration-500"
        style={{ filter: foregroundFilter }}
      >
        <GlyphComponent stroke={effectiveStroke} size={size} />
      </div>
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
