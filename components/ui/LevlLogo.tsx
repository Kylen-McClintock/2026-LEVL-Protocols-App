import React from 'react'

interface LevlLogoProps {
  className?: string
  height?: number | string
}

export default function LevlLogo({ className = 'h-8 w-auto', height }: LevlLogoProps) {
  return (
    <svg
      viewBox="0 0 520 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={height ? { height } : undefined}
    >
      <defs>
        {/* LEVL Gradient: Blue -> Cyan -> Emerald */}
        <linearGradient id="levl-logo-gradient" x1="0" y1="0" x2="520" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1D4ED8" />
          <stop offset="35%" stopColor="#2563EB" />
          <stop offset="65%" stopColor="#0EA5E9" />
          <stop offset="85%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>

        <filter id="levl-glow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#38BDF8" floodOpacity="0.4" />
        </filter>
      </defs>

      <g filter="url(#levl-glow)" fill="url(#levl-logo-gradient)">
        {/* Top Beam extending across the top ending in Arrowhead on the right */}
        {/* Horizontal top line */}
        <path d="M 0,12 H 470 V 26 H 0 Z" />
        
        {/* Arrowhead on top right */}
        <path d="M 465,0 L 520,19 L 465,38 Z" />

        {/* --- LETTER 'L' (Left) --- */}
        {/* Vertical left stroke */}
        <path d="M 0,38 H 18 V 142 H 115 V 158 H 0 Z" />

        {/* --- LETTER 'E' --- */}
        {/* Outer curved E shell */}
        <path d="M 125,38 H 215 V 54 H 143 V 86 H 205 V 102 H 143 V 142 H 235 V 158 H 125 Z" />

        {/* --- LETTER 'V' --- */}
        {/* Slanted V connecting up to the top beam */}
        <path d="M 215,38 L 265,158 H 285 L 335,38 H 315 L 275,135 L 235,38 Z" />

        {/* --- LETTER 'L' (Right) --- */}
        {/* Vertical right stroke */}
        <path d="M 345,38 H 363 V 142 H 465 V 158 H 345 Z" />
      </g>
    </svg>
  )
}
