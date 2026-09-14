'use client'

import { useState, useEffect } from 'react'

export type LandscapeTextPreference = 'auto_enlarge' | 'standard'

export const LANDSCAPE_TEXT_PREF_KEY = 'levl_landscape_text_pref'

export function getLandscapeTextPreference(): LandscapeTextPreference {
  if (typeof window === 'undefined') return 'auto_enlarge'
  try {
    const saved = localStorage.getItem(LANDSCAPE_TEXT_PREF_KEY) as LandscapeTextPreference
    if (saved === 'standard' || saved === 'auto_enlarge') {
      return saved
    }
  } catch (e) {}
  return 'auto_enlarge'
}

export function applyLandscapeTextPreference(pref: LandscapeTextPreference) {
  if (typeof document === 'undefined') return
  try {
    document.documentElement.setAttribute('data-landscape-text', pref === 'standard' ? 'standard' : 'enlarge')
    localStorage.setItem(LANDSCAPE_TEXT_PREF_KEY, pref)
    window.dispatchEvent(new CustomEvent('levl_landscape_text_changed', { detail: { pref } }))
  } catch (e) {}
}

export function useLandscapeFontPreference() {
  const [preference, setPreferenceState] = useState<LandscapeTextPreference>('auto_enlarge')

  useEffect(() => {
    const current = getLandscapeTextPreference()
    setPreferenceState(current)
    applyLandscapeTextPreference(current)

    const handleUpdate = (e: any) => {
      if (e.detail?.pref) {
        setPreferenceState(e.detail.pref)
      }
    }

    window.addEventListener('levl_landscape_text_changed', handleUpdate)
    return () => window.removeEventListener('levl_landscape_text_changed', handleUpdate)
  }, [])

  const setPreference = (newPref: LandscapeTextPreference) => {
    setPreferenceState(newPref)
    applyLandscapeTextPreference(newPref)
  }

  return { preference, setPreference }
}
