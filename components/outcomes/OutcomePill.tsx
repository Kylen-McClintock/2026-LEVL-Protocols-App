'use client'

import React from 'react'
import { getOutcomeColor } from '@/lib/outcomes/outcomeColors'

interface OutcomePillProps {
  outcome: string
  score?: number
  size?: 'xs' | 'sm' | 'md'
  showScore?: boolean
  className?: string
}

export default function OutcomePill({
  outcome,
  score,
  size = 'sm',
  showScore = true,
  className = ''
}: OutcomePillProps) {
  const theme = getOutcomeColor(outcome)

  const sizeClasses = {
    xs: 'text-[9px] px-1.5 py-0.5',
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1'
  }[size]

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold rounded-full border transition-all ${theme.badgeBg} ${theme.badgeBorder} ${theme.badgeText} ${sizeClasses} ${className}`}
      style={{ boxShadow: `0 0 8px ${theme.glow}` }}
    >
      <span className="truncate capitalize">{outcome.replace(/_/g, ' ')}</span>
      {showScore && typeof score === 'number' && (
        <span className="opacity-90 font-mono text-[9px] px-1 py-0.2 rounded bg-black/30">
          {score}/10
        </span>
      )}
    </span>
  )
}
