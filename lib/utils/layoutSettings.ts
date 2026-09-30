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

// -------------------------------------------------------------
// Information Density & Layout Presets
// -------------------------------------------------------------
export type LayoutPreset = 'focus' | 'daily' | 'biohacker'

// -------------------------------------------------------------
// Circadian Time Block Expansion Horizon (3-Stop Control)
// -------------------------------------------------------------
export type TimeBlockHorizonMode = 'current_only' | 'collapse_past' | 'fully_open'

// -------------------------------------------------------------
// Next Best Action (NBA) Settings (Bottom Docked)
// -------------------------------------------------------------
export interface NBAConfig {
  enabled: boolean
  threshold: 0 | 50 | 75 | 100 // 0 = Always, 50 = 50% Done, 75 = 75% Done, 100 = 100% Done
}

export const DEFAULT_NBA_CONFIG: NBAConfig = {
  enabled: true,
  threshold: 75
}

const STORAGE_KEY_HOME_WIDGETS = 'levl_home_widgets'
const STORAGE_KEY_FOCUS_RULES = 'levl_focus_rules'
const STORAGE_KEY_CARD_BADGES = 'levl_card_badges'
const STORAGE_KEY_LAYOUT_PRESET = 'levl_layout_preset'
const STORAGE_KEY_TIMEBLOCK_HORIZON = 'levl_timeblock_horizon'
const STORAGE_KEY_NBA_CONFIG = 'levl_nba_config'

const EVENT_HOME_WIDGETS = 'levl_home_widgets_changed'
const EVENT_FOCUS_RULES = 'levl_focus_rules_changed'
const EVENT_CARD_BADGES = 'levl_card_badges_changed'
const EVENT_LAYOUT_PRESET = 'levl_layout_preset_changed'
const EVENT_TIMEBLOCK_HORIZON = 'levl_timeblock_horizon_changed'
const EVENT_NBA_CONFIG = 'levl_nba_config_changed'

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

export function getStoredLayoutPreset(): LayoutPreset {
  if (typeof window === 'undefined') return 'daily'
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LAYOUT_PRESET) as LayoutPreset
    if (raw === 'focus' || raw === 'daily' || raw === 'biohacker') return raw
  } catch (e) {}
  return 'daily'
}

export function setStoredLayoutPreset(preset: LayoutPreset, profile?: UserProfile | null): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY_LAYOUT_PRESET, preset)
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent(EVENT_LAYOUT_PRESET, { detail: { preset } }))
    }, 0)
    syncLayoutToProfile({ layout_preset: preset }, profile)
  } catch (e) {}
}

export function getStoredTimeBlockHorizon(isFocusMode?: boolean): TimeBlockHorizonMode {
  if (isFocusMode) return 'current_only'
  if (typeof window === 'undefined') return 'collapse_past'
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TIMEBLOCK_HORIZON) as TimeBlockHorizonMode
    if (raw === 'current_only' || raw === 'collapse_past' || raw === 'fully_open') return raw
  } catch (e) {}
  return 'collapse_past'
}

export function setStoredTimeBlockHorizon(mode: TimeBlockHorizonMode, profile?: UserProfile | null): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY_TIMEBLOCK_HORIZON, mode)
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent(EVENT_TIMEBLOCK_HORIZON, { detail: { mode } }))
    }, 0)
    syncLayoutToProfile({ timeblock_horizon: mode }, profile)
  } catch (e) {}
}

export function getStoredNBAConfig(): NBAConfig {
  if (typeof window === 'undefined') return { ...DEFAULT_NBA_CONFIG }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NBA_CONFIG)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { ...DEFAULT_NBA_CONFIG, ...parsed }
    }
  } catch (e) {}
  return { ...DEFAULT_NBA_CONFIG }
}

export function setStoredNBAConfig(config: Partial<NBAConfig>, profile?: UserProfile | null): void {
  if (typeof window === 'undefined') return
  try {
    const current = getStoredNBAConfig()
    const updated = { ...current, ...config }
    localStorage.setItem(STORAGE_KEY_NBA_CONFIG, JSON.stringify(updated))
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent(EVENT_NBA_CONFIG, { detail: { config: updated } }))
    }, 0)
    syncLayoutToProfile({ nba_config: updated }, profile)
  } catch (e) {}
}

/**
 * Applies an Information Density Layout Preset across all visual layers
 */
export function applyLayoutPreset(preset: LayoutPreset, profile?: UserProfile | null): void {
  if (typeof window === 'undefined') return
  setStoredLayoutPreset(preset, profile)

  if (preset === 'focus') {
    setStoredTimeBlockHorizon('current_only', profile)
    setStoredCardBadges({
      showDosing: true,
      showCompletedInline: false,
      showProtocol: false,
      showSynergies: false,
      showCategory: false
    }, profile)
    setStoredHomeWidgets({
      aiCoach: false,
      longevityTip: false,
      quickHotkeys: true,
      sleepTriage: false,
      infradian: false,
      asNeeded: false,
      wellbeing: false,
      categoryFilters: false
    }, profile)
    setStoredNBAConfig({ enabled: false, threshold: 100 }, profile)
  } else if (preset === 'daily') {
    setStoredTimeBlockHorizon('collapse_past', profile)
    setStoredCardBadges({ ...DEFAULT_CARD_BADGES }, profile)
    setStoredHomeWidgets({ ...DEFAULT_HOME_WIDGETS }, profile)
    setStoredNBAConfig({ ...DEFAULT_NBA_CONFIG }, profile)
  } else if (preset === 'biohacker') {
    setStoredTimeBlockHorizon('fully_open', profile)
    setStoredCardBadges({
      showDosing: true,
      showCompletedInline: true,
      showProtocol: true,
      showSynergies: true,
      showCategory: true
    }, profile)
    setStoredHomeWidgets({
      aiCoach: true,
      longevityTip: true,
      quickHotkeys: true,
      sleepTriage: true,
      infradian: true,
      asNeeded: true,
      wellbeing: true,
      categoryFilters: true
    }, profile)
    setStoredNBAConfig({ enabled: true, threshold: 0 }, profile)
  }
}

/**
 * React hook to observe and update Information Density Layout Preset
 */
export function useLayoutPreset(profile?: UserProfile | null) {
  const [preset, setPresetState] = useState<LayoutPreset>(() => getStoredLayoutPreset())

  useEffect(() => {
    if (profile?.outcome_preference_scores) {
      const cloudLayout = (profile.outcome_preference_scores as any)?._layout_settings
      if (cloudLayout?.layout_preset) {
        const local = localStorage.getItem(STORAGE_KEY_LAYOUT_PRESET)
        if (!local) {
          setPresetState(cloudLayout.layout_preset)
          localStorage.setItem(STORAGE_KEY_LAYOUT_PRESET, cloudLayout.layout_preset)
        }
      }
    }

    const handler = (e: any) => {
      if (e.detail?.preset) {
        setPresetState(e.detail.preset)
      }
    }
    window.addEventListener(EVENT_LAYOUT_PRESET, handler)
    return () => window.removeEventListener(EVENT_LAYOUT_PRESET, handler)
  }, [profile])

  const selectPreset = useCallback((newPreset: LayoutPreset) => {
    setPresetState(newPreset)
    applyLayoutPreset(newPreset, profile)
  }, [profile])

  return { preset, selectPreset }
}

/**
 * React hook to observe and update Time Block Expansion Horizon
 */
export function useTimeBlockHorizon(isFocusMode?: boolean, profile?: UserProfile | null) {
  const [horizon, setHorizonState] = useState<TimeBlockHorizonMode>(() => getStoredTimeBlockHorizon(isFocusMode))

  useEffect(() => {
    if (isFocusMode) {
      setHorizonState('current_only')
      return
    }

    if (profile?.outcome_preference_scores) {
      const cloudLayout = (profile.outcome_preference_scores as any)?._layout_settings
      if (cloudLayout?.timeblock_horizon) {
        const local = localStorage.getItem(STORAGE_KEY_TIMEBLOCK_HORIZON)
        if (!local) {
          setHorizonState(cloudLayout.timeblock_horizon)
          localStorage.setItem(STORAGE_KEY_TIMEBLOCK_HORIZON, cloudLayout.timeblock_horizon)
        }
      }
    }

    const handler = (e: any) => {
      if (e.detail?.mode) {
        setHorizonState(e.detail.mode)
      }
    }
    window.addEventListener(EVENT_TIMEBLOCK_HORIZON, handler)
    return () => window.removeEventListener(EVENT_TIMEBLOCK_HORIZON, handler)
  }, [isFocusMode, profile])

  const updateHorizon = useCallback((newMode: TimeBlockHorizonMode) => {
    setHorizonState(newMode)
    setStoredTimeBlockHorizon(newMode, profile)
  }, [profile])

  return { horizon: isFocusMode ? 'current_only' : horizon, updateHorizon }
}

/**
 * React hook to observe and update Next Best Action (NBA) Config
 */
export function useNBAConfig(profile?: UserProfile | null) {
  const [nbaConfig, setNbaConfigState] = useState<NBAConfig>(() => getStoredNBAConfig())

  useEffect(() => {
    if (profile?.outcome_preference_scores) {
      const cloudLayout = (profile.outcome_preference_scores as any)?._layout_settings
      if (cloudLayout?.nba_config) {
        const local = localStorage.getItem(STORAGE_KEY_NBA_CONFIG)
        if (!local) {
          const merged = { ...DEFAULT_NBA_CONFIG, ...cloudLayout.nba_config }
          setNbaConfigState(merged)
          localStorage.setItem(STORAGE_KEY_NBA_CONFIG, JSON.stringify(merged))
        }
      }
    }

    const handler = (e: any) => {
      if (e.detail?.config) {
        setNbaConfigState(prev => ({ ...prev, ...e.detail.config }))
      }
    }
    window.addEventListener(EVENT_NBA_CONFIG, handler)
    return () => window.removeEventListener(EVENT_NBA_CONFIG, handler)
  }, [profile])

  const updateNBAConfig = useCallback((patch: Partial<NBAConfig>) => {
    setNbaConfigState(prev => {
      const next = { ...prev, ...patch }
      setStoredNBAConfig(next, profile)
      return next
    })
  }, [profile])

  const toggleNBAEnabled = useCallback(() => {
    setNbaConfigState(prev => {
      const next = { ...prev, enabled: !prev.enabled }
      setStoredNBAConfig(next, profile)
      return next
    })
  }, [profile])

  return { nbaConfig, updateNBAConfig, toggleNBAEnabled }
}

