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
  categoryFilters: boolean
}

export const DEFAULT_HOME_WIDGETS: HomeWidgetsConfig = {
  aiCoach: true,
  longevityTip: true,
  quickHotkeys: true,
  sleepTriage: true,
  infradian: false,
  asNeeded: true,
  wellbeing: true,
  categoryFilters: true
}

export interface FocusRulesConfig {
  keepCompleted: boolean
  keepHotkeys: boolean
  keepAICoach: boolean
  keepSleepTriage: boolean
  keepTip: boolean
  keepInfradian: boolean
  keepWellbeing: boolean
  keepCategoryFilters: boolean
}

export const DEFAULT_FOCUS_RULES: FocusRulesConfig = {
  keepCompleted: false,
  keepHotkeys: false,
  keepAICoach: false,
  keepSleepTriage: false,
  keepTip: false,
  keepInfradian: false,
  keepWellbeing: false,
  keepCategoryFilters: false
}

export interface CardBadgesConfig {
  showDosing: boolean           // Target dosage & units (Default: true)
  showCompletedInline: boolean  // Keep completed tasks inline in time blocks (Default: false)
  showProtocol: boolean         // Protocol Attribution name & badge (Default: true)
  showSynergies: boolean        // Synergies, fat-soluble & pairing notes (Default: true)
  showCategory: boolean         // Modality Category / Macro-type badge (Default: true)
}

export const DEFAULT_CARD_BADGES: CardBadgesConfig = {
  showDosing: true,
  showCompletedInline: false,
  showProtocol: true,
  showSynergies: true,
  showCategory: true
}

const STORAGE_KEY_HOME_WIDGETS = 'levl_home_widgets'
const STORAGE_KEY_FOCUS_RULES = 'levl_focus_rules'
const STORAGE_KEY_CARD_BADGES = 'levl_card_badges'
const EVENT_HOME_WIDGETS = 'levl_home_widgets_changed'
const EVENT_FOCUS_RULES = 'levl_focus_rules_changed'
const EVENT_CARD_BADGES = 'levl_card_badges_changed'

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

export function setStoredHomeWidgets(config: Partial<HomeWidgetsConfig>, profile?: UserProfile | null): void {
  if (typeof window === 'undefined') return
  try {
    const current = getStoredHomeWidgets()
    const updated = { ...current, ...config }
    localStorage.setItem(STORAGE_KEY_HOME_WIDGETS, JSON.stringify(updated))
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent(EVENT_HOME_WIDGETS, { detail: { config: updated } }))
    }, 0)

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
      // Migration from legacy hideCompleted to keepCompleted
      if (parsed.keepCompleted === undefined && parsed.hideCompleted !== undefined) {
        parsed.keepCompleted = !parsed.hideCompleted
      }
      return { ...DEFAULT_FOCUS_RULES, ...parsed }
    }
  } catch (e) {}
  return { ...DEFAULT_FOCUS_RULES }
}

export function setStoredFocusRules(rules: Partial<FocusRulesConfig>, profile?: UserProfile | null): void {
  if (typeof window === 'undefined') return
  try {
    const current = getStoredFocusRules()
    const updated = { ...current, ...rules }
    localStorage.setItem(STORAGE_KEY_FOCUS_RULES, JSON.stringify(updated))
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent(EVENT_FOCUS_RULES, { detail: { rules: updated } }))
    }, 0)

    // Sync to user profile if available
    syncLayoutToProfile({ focus_rules: updated }, profile)
  } catch (e) {}
}

export function getStoredCardBadges(): CardBadgesConfig {
  if (typeof window === 'undefined') return { ...DEFAULT_CARD_BADGES }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CARD_BADGES)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { ...DEFAULT_CARD_BADGES, ...parsed }
    }
    // Fallback hydration from legacy keys if card badges not set yet
    const legacyDosing = localStorage.getItem('levl_blocks_show_dosing')
    const legacyCompleted = localStorage.getItem('levl_blocks_completed_placement')
    const legacyShowInline = localStorage.getItem('levl_show_completed_inline')
    return {
      ...DEFAULT_CARD_BADGES,
      ...(legacyDosing !== null ? { showDosing: legacyDosing === 'true' } : {}),
      ...(legacyCompleted !== null ? { showCompletedInline: legacyCompleted === 'inline' } : (legacyShowInline === 'true' ? { showCompletedInline: true } : {}))
    }
  } catch (e) {}
  return { ...DEFAULT_CARD_BADGES }
}

export function setStoredCardBadges(config: Partial<CardBadgesConfig>, profile?: UserProfile | null): void {
  if (typeof window === 'undefined') return
  try {
    const current = getStoredCardBadges()
    const updated = { ...current, ...config }
    localStorage.setItem(STORAGE_KEY_CARD_BADGES, JSON.stringify(updated))
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent(EVENT_CARD_BADGES, { detail: { config: updated } }))

      // Keep legacy events in sync for existing listeners
      if (config.showDosing !== undefined) {
        localStorage.setItem('levl_blocks_show_dosing', String(config.showDosing))
        window.dispatchEvent(new CustomEvent('levl_blocks_show_dosing_change', { detail: { show: config.showDosing } }))
      }
      if (config.showCompletedInline !== undefined) {
        const placement = config.showCompletedInline ? 'inline' : 'section'
        localStorage.setItem('levl_blocks_completed_placement', placement)
        localStorage.setItem('levl_show_completed_inline', String(config.showCompletedInline))
        window.dispatchEvent(new CustomEvent('levl_blocks_completed_placement_change', { detail: { placement } }))
        window.dispatchEvent(new CustomEvent('levl_show_completed_inline_change', { detail: { show: config.showCompletedInline } }))
      }
    }, 0)

    // Sync to user profile if available
    syncLayoutToProfile({ card_badges: updated }, profile)
  } catch (e) {}
}

/**
 * Async background sync to remote Supabase user_profile
 */
async function syncLayoutToProfile(patch: Record<string, any>, profile?: UserProfile | null) {
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
export function useHomeWidgets(profile?: UserProfile | null) {
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
        setWidgets(prev => {
          const next = e.detail.config
          const keys = Object.keys(next) as (keyof HomeWidgetsConfig)[]
          const changed = keys.some(k => prev[k] !== next[k])
          return changed ? next : prev
        })
      }
    }
    window.addEventListener(EVENT_HOME_WIDGETS, handler)
    return () => window.removeEventListener(EVENT_HOME_WIDGETS, handler)
  }, [profile])

  const toggleWidget = useCallback((key: keyof HomeWidgetsConfig) => {
    const current = getStoredHomeWidgets()
    const next = { ...current, [key]: !current[key] }
    setWidgets(next)
    setStoredHomeWidgets(next, profile)
  }, [profile])

  return { widgets, setWidgets, toggleWidget }
}

/**
 * React hook to observe and update Focus Rules state
 */
export function useFocusRules(profile?: UserProfile | null) {
  const [rules, setRules] = useState<FocusRulesConfig>(() => getStoredFocusRules())

  useEffect(() => {
    // Hydrate from profile if available
    if (profile?.outcome_preference_scores) {
      const cloudLayout = (profile.outcome_preference_scores as any)?._layout_settings
      if (cloudLayout?.focus_rules) {
        const local = localStorage.getItem(STORAGE_KEY_FOCUS_RULES)
        if (!local) {
          const cloudRules = { ...cloudLayout.focus_rules }
          if (cloudRules.keepCompleted === undefined && cloudRules.hideCompleted !== undefined) {
            cloudRules.keepCompleted = !cloudRules.hideCompleted
          }
          const merged = { ...DEFAULT_FOCUS_RULES, ...cloudRules }
          setRules(merged)
          localStorage.setItem(STORAGE_KEY_FOCUS_RULES, JSON.stringify(merged))
        }
      }
    }

    const handler = (e: any) => {
      if (e.detail?.rules) {
        setRules(prev => {
          const next = e.detail.rules
          const keys = Object.keys(next) as (keyof FocusRulesConfig)[]
          const changed = keys.some(k => prev[k] !== next[k])
          return changed ? next : prev
        })
      }
    }
    window.addEventListener(EVENT_FOCUS_RULES, handler)
    return () => window.removeEventListener(EVENT_FOCUS_RULES, handler)
  }, [profile])

  const updateRule = useCallback((key: keyof FocusRulesConfig, val: boolean) => {
    const current = getStoredFocusRules()
    const next = { ...current, [key]: val }
    setRules(next)
    setStoredFocusRules(next, profile)
  }, [profile])

  const toggleRule = useCallback((key: keyof FocusRulesConfig) => {
    const current = getStoredFocusRules()
    const next = { ...current, [key]: !current[key] }
    setRules(next)
    setStoredFocusRules(next, profile)
  }, [profile])

  return { rules, setRules, updateRule, toggleRule }
}

/**
 * React hook to observe and update Card Badges state across Classic and Blocks
 */
export function useCardBadges(profile?: UserProfile | null) {
  const [badges, setBadges] = useState<CardBadgesConfig>(() => getStoredCardBadges())

  useEffect(() => {
    // Hydrate from profile if available
    if (profile?.outcome_preference_scores) {
      const cloudLayout = (profile.outcome_preference_scores as any)?._layout_settings
      if (cloudLayout?.card_badges) {
        const local = localStorage.getItem(STORAGE_KEY_CARD_BADGES)
        if (!local) {
          const merged = { ...DEFAULT_CARD_BADGES, ...cloudLayout.card_badges }
          setBadges(merged)
          localStorage.setItem(STORAGE_KEY_CARD_BADGES, JSON.stringify(merged))
        }
      }
    }

    const handler = (e: any) => {
      if (e.detail?.config) {
        setBadges(prev => {
          const next = e.detail.config
          const keys = Object.keys(next) as (keyof CardBadgesConfig)[]
          const changed = keys.some(k => prev[k] !== next[k])
          return changed ? next : prev
        })
      }
    }
    window.addEventListener(EVENT_CARD_BADGES, handler)
    return () => window.removeEventListener(EVENT_CARD_BADGES, handler)
  }, [profile])

  const toggleBadge = useCallback((key: keyof CardBadgesConfig) => {
    const current = getStoredCardBadges()
    const next = { ...current, [key]: !current[key] }
    setBadges(next)
    setStoredCardBadges(next, profile)
  }, [profile])

  const updateBadge = useCallback((key: keyof CardBadgesConfig, val: boolean) => {
    const current = getStoredCardBadges()
    const next = { ...current, [key]: val }
    setBadges(next)
    setStoredCardBadges(next, profile)
  }, [profile])

  return { badges, setBadges, toggleBadge, updateBadge }
}
