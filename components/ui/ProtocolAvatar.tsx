'use client'

import React from 'react'
import { 
  Crown, 
  Orbit, 
  Atom, 
  Brain, 
  Flame, 
  HeartPulse, 
  Activity, 
  ShieldCheck, 
  Waves, 
  Thermometer, 
  Zap, 
  Sparkles, 
  Dumbbell, 
  Compass, 
  Moon, 
  Radio, 
  Wind, 
  Layers,
  LucideIcon
} from 'lucide-react'
import { ProtocolVisualTheme, getProtocolVisualTheme } from '@/lib/utils/protocolThemes'

const ICON_MAP: Record<ProtocolVisualTheme['iconName'], LucideIcon> = {
  Crown,
  Orbit,
  Atom,
  Brain,
  Flame,
  HeartPulse,
  Activity,
  ShieldCheck,
  Waves,
  Thermometer,
  Zap,
  Sparkles,
  Dumbbell,
  Compass,
  Moon,
  Radio,
  Wind,
  Layers
}

interface ProtocolAvatarProps {
  protocolName?: string
  protocolInfo?: any
  groupTasksOrSteps?: any[]
  themeOverride?: ProtocolVisualTheme
  size?: number // Avatar width & height in px (default: 38)
  className?: string
  showHalo?: boolean
  roundedClass?: string
}

export default function ProtocolAvatar({
  protocolName,
  protocolInfo,
  groupTasksOrSteps,
  themeOverride,
  size = 38,
  className = '',
  showHalo = true,
  roundedClass = 'rounded-xl'
}: ProtocolAvatarProps) {
  const theme = themeOverride || getProtocolVisualTheme(protocolInfo || protocolName, groupTasksOrSteps)
  const IconComponent = ICON_MAP[theme.iconName] || Layers
  const iconSize = Math.max(14, Math.round(size * 0.52))

  return (
    <div className={`relative shrink-0 flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      {/* Ambient Halo Glow */}
      {showHalo && (
        <div 
          className="absolute inset-0 rounded-full blur-md opacity-60 pointer-events-none -z-10 transition-all duration-300"
          style={{ background: theme.glowColor }}
        />
      )}

      {/* Multi-Category Gradient Squircle Container */}
      <div 
        className={`relative w-full h-full flex items-center justify-center border border-white/30 shadow-md overflow-hidden ${roundedClass} transition-transform duration-200`}
        style={{
          background: theme.gradientCSS
        }}
      >
        {/* Specular glass highlight reflection */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/35 via-white/10 to-transparent pointer-events-none" />
        
        {/* Semi-dark inner glass backing to make the clinical SVG vector pop with high contrast */}
        <div className="absolute inset-[1.5px] rounded-[inherit] bg-slate-950/35 backdrop-blur-xs flex items-center justify-center">
          <IconComponent 
            size={iconSize} 
            className="text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.8)]" 
            strokeWidth={2.2}
          />
        </div>
      </div>
    </div>
  )
}

/**
 * Compact reusable badge pill row showing the protocol's constituent categories
 */
export function ProtocolCategoryPills({
  theme,
  className = ''
}: {
  theme: ProtocolVisualTheme
  className?: string
}) {
  if (!theme.categoryBadges || theme.categoryBadges.length === 0) return null

  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${className}`}>
      {theme.categoryBadges.map((badge, idx) => (
        <span
          key={badge.type || idx}
          className="text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border shadow-2xs"
          style={{
            backgroundColor: badge.bgTint,
            color: badge.colorHex,
            borderColor: `${badge.colorHex}55`
          }}
        >
          {badge.label}
        </span>
      ))}
    </div>
  )
}
