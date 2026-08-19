'use client'

import { useState, useEffect } from 'react'

export type TextScale = 'compact' | 'default' | 'large' | 'xlarge'

export const TEXT_SCALE_OPTIONS: { id: TextScale; label: string; percentage: string; description: string }[] = [
  { id: 'compact', label: 'Compact', percentage: '90%', description: 'Dense layout, fits more cards on screen' },
  { id: 'default', label: 'Default', percentage: '100%', description: 'Standard balanced size' },
  { id: 'large', label: 'Large', percentage: '112%', description: 'Enhanced legibility for mobile' },
  { id: 'xlarge', label: 'Extra Large', percentage: '125%', description: 'Maximum readability and comfort' }
]

export const FONT_SIZE_MAP: Record<TextScale, string> = {
  compact: '14px',
  default: '16px',
  large: '18.5px',
  xlarge: '21px'
}

export function applyTextScale(scale: TextScale) {
  if (typeof document === 'undefined') return
  try {
    document.documentElement.setAttribute('data-text-scale', scale)
    document.documentElement.style.fontSize = FONT_SIZE_MAP[scale] || '16px'
    localStorage.setItem('levl_text_scale', scale)
  } catch (e) {}
}

export function getTextScale(): TextScale {
  if (typeof window === 'undefined') return 'default'
  try {
    const saved = localStorage.getItem('levl_text_scale') as TextScale
    if (saved && ['compact', 'default', 'large', 'xlarge'].includes(saved)) {
      return saved
    }
  } catch (e) {}
  return 'default'
}

export function useTextScale() {
  const [scale, setScaleState] = useState<TextScale>('default')

  useEffect(() => {
    const current = getTextScale()
    setScaleState(current)
    applyTextScale(current)
  }, [])

  const setScale = (newScale: TextScale) => {
    setScaleState(newScale)
    applyTextScale(newScale)
  }

  return { scale, setScale, options: TEXT_SCALE_OPTIONS }
}
