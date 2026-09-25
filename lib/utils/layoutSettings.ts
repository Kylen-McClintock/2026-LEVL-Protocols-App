'use client'

import { useState, useEffect, useCallback } from 'react'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { updateUserProfile } from '@/lib/data'
import { UserProfile } from '@/lib/types'

export interface HomeWidgetsConfig {
  aiCoach: boolean
  longevityTip: boolean
  quickHotkeys: boolean
  sleepTriage: boolean
  infradian: boolean
  asNeeded: boolean
  wellbeing: boolean
}

export const DEFAULT_HOME_WIDGETS: HomeWidgetsConfig = {
  aiCoach: true,
  longevityTip: true,
  quickHotkeys: true,
  sleepTriage: true,
  infradian: true,
  asNeeded: true,
  wellbeing: true
}

export interface FocusRulesConfig {
  hideCompleted: boolean
  keepHotkeys: boolean
  keepAICoach: boolean
  keepSleepTriage: boolean
  keepTip: boolean
  keepInfradian: boolean
  keepWellbeing: boolean
}

export const DEFAULT_FOCUS_RULES: FocusRulesConfig = {
  hideCompleted: true,
  keepHotkeys: false,
  keepAICoach: false,
  keepSleepTriage: false,
  keepTip: false,
  keepInfradian: false,
  keepWellbeing: false
}

const STORAGE_KEY_HOME_WIDGETS = 'levl_home_widgets'
const STORAGE_KEY_FOCUS_RULES = 'levl_focus_rules'
const EVENT_HOME_WIDGETS = 'levl_home_widgets_changed'
const EVENT_FOCUS_RULES = 'levl_focus_rules_changed'

export function getStoredHomeWidgets(): HomeWidgetsConfig {
  if (typeof window === 'undefined') return { ...DEFAULT_HOME_WIDGETS }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HOME_WIDGETS)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { ...DEFAULT_HOME_WIDGETS, ...parsed }
    }
  } catch (e) {}
  return { ...DEFAULT_HOME_WIDGETS }
}

export function setStoredHomeWidgets(config: Partial<HomeWidgetsConfig>, profile?: UserProfile): void {
  if (typeof window === 'undefined') return
  try {
    const current = getStoredHomeWidgets()
    const updated = { ...current, ...config }
    localStorage.setItem(STORAGE_KEY_HOME_WIDGETS, JSON.stringify(updated))
    window.dispatchEvent(new CustomEvent(EVENT_HOME_WIDGETS, { detail: { config: updated } }))

    // Sync to user profile if available
    syncLayoutToProfile({ home_widgets: updated }, profile)
  } catch (e) {}
}

export function getStoredFocusRules(): FocusRulesConfig {
  if (typeof window === 'undefined') return { ...DEFAULT_FOCUS_RULES }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FOCUS_RULES)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { ...DEFAULT_FOCUS_RULES, ...parsed }
    }
  } catch (e) {}
  return { ...DEFAULT_FOCUS_RULES }
}

export function setStoredFocusRules(rules: Partial<FocusRulesConfig>, profile?: UserProfile): void {
  if (typeof window === 'undefined') return
  try {
    const current = getStoredFocusRules()
    const updated = { ...current, ...rules }
    localStorage.setItem(STORAGE_KEY_FOCUS_RULES, JSON.stringify(updated))
    window.dispatchEvent(new CustomEvent(EVENT_FOCUS_RULES, { detail: { rules: updated } }))

    // Sync to user profile if available
    syncLayoutToProfile({ focus_rules: updated }, profile)
  } catch (e) {}
}

/**
 * Async background sync to remote Supabase user_profile
 */
async function syncLayoutToProfile(patch: Record<string, any>, profile?: UserProfile) {
  try {
    const uid = profile?.local_user_id || getLocalUserId()
    if (!uid) return
    const existingScores = profile?.outcome_preference_scores || {}
    const existingLayout = (existingScores as any)._layout_settings || {}
    const updatedLayout = { ...existingLayout, ...patch }
    const updatedScores = {
      ...existingScores,
      _layout_settings: updatedLayout
    }
    await updateUserProfile(uid, {
      outcome_preference_scores: updatedScores
    })
  } catch (e) {
    // Non-blocking
  }
}

/**
 * React hook to observe and update Home Widgets state
 */
export function useHomeWidgets(profile?: UserProfile) {
  const [widgets, setWidgets] = useState<HomeWidgetsConfig>(() => getStoredHomeWidgets())

  useEffect(() => {
    // Hydrate from profile if available and not yet set in local storage
    if (profile?.outcome_preference_scores) {
      const cloudLayout = (profile.outcome_preference_scores as any)?._layout_settings
      if (cloudLayout?.home_widgets) {
        const local = localStorage.getItem(STORAGE_KEY_HOME_WIDGETS)
        if (!local) {
          const merged = { ...DEFAULT_HOME_WIDGETS, ...cloudLayout.home_widgets }
          setWidgets(merged)
          localStorage.setItem(STORAGE_KEY_HOME_WIDGETS, JSON.stringify(merged))
        }
      }
    }

    const handler = (e: any) => {
      if (e.detail?.config) {
        setWidgets(e.detail.config)
      }
    }
    window.addEventListener(EVENT_HOME_WIDGETS, handler)
    return () => window.removeEventListener(EVENT_HOME_WIDGETS, handler)
  }, [profile])

  const toggleWidget = useCallback((key: keyof HomeWidgetsConfig) => {
    setWidgets(prev => {
      const next = { ...prev, [key]: !prev[key] }
      setStoredHomeWidgets(next, profile)
      return next
    })
  }, [profile])

  return { widgets, setWidgets, toggleWidget }
}

/**
 * React hook to observe and update Focus Rules state
 */
export function useFocusRules(profile?: UserProfile) {
  const [rules, setRules] = useState<FocusRulesConfig>(() => getStoredFocusRules())

  useEffect(() => {
    // Hydrate from profile if available
    if (profile?.outcome_preference_scores) {
      const cloudLayout = (profile.outcome_preference_scores as any)?._layout_settings
      if (cloudLayout?.focus_rules) {
        const local = localStorage.getItem(STORAGE_KEY_FOCUS_RULES)
        if (!local) {
          const merged = { ...DEFAULT_FOCUS_RULES, ...cloudLayout.focus_rules }
          setRules(merged)
          localStorage.setItem(STORAGE_KEY_FOCUS_RULES, JSON.stringify(merged))
        }
      }
    }

    const handler = (e: any) => {
      if (e.detail?.rules) {
        setRules(e.detail.rules)
      }
    }
    window.addEventListener(EVENT_FOCUS_RULES, handler)
    return () => window.removeEventListener(EVENT_FOCUS_RULES, handler)
  }, [profile])

  const updateRule = useCallback((key: keyof FocusRulesConfig, val: boolean) => {
    setRules(prev => {
      const next = { ...prev, [key]: val }
      setStoredFocusRules(next, profile)
      return next
    })
  }, [profile])

  const toggleRule = useCallback((key: keyof FocusRulesConfig) => {
    setRules(prev => {
      const next = { ...prev, [key]: !prev[key] }
      setStoredFocusRules(next, profile)
      return next
    })
  }, [profile])

  return { rules, setRules, updateRule, toggleRule }
}
