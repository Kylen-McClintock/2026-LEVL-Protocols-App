import { DailyQuickLogEntry, QuickHotkeyConfig } from '../types'
import { DEFAULT_STARTER_HOTKEYS } from '../quicklog/quickHotkeyLibrary'

const DB_NAME = 'levl_quick_logs_db'
const DB_VERSION = 1
const STORE_LOGS = 'quick_logs'
const STORE_CONFIG = 'user_hotkeys'

function openQuickLogsDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('IndexedDB unavailable on server'))
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_LOGS)) {
        const logStore = db.createObjectStore(STORE_LOGS, { keyPath: 'id' })
        logStore.createIndex('date', 'date', { unique: false })
        logStore.createIndex('hotkey_id', 'hotkey_id', { unique: false })
        logStore.createIndex('local_user_id', 'local_user_id', { unique: false })
      }
      if (!db.objectStoreNames.contains(STORE_CONFIG)) {
        db.createObjectStore(STORE_CONFIG, { keyPath: 'local_user_id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

import { supabase } from '@/lib/supabase/client'

/**
 * Save a single quick log entry into IndexedDB, LocalStorage, and Supabase Cloud
 */
export async function saveQuickLogEntry(entry: DailyQuickLogEntry): Promise<boolean> {
  // 1. Instant local IndexedDB write
  try {
    const db = await openQuickLogsDB()
    const tx = db.transaction(STORE_LOGS, 'readwrite')
    const store = tx.objectStore(STORE_LOGS)
    store.put(entry)

    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve
      tx.onerror = () => reject(tx.error)
    })
  } catch (err) {
    console.warn('Falling back to localStorage for quick log:', err)
  }

  // 2. Instant LocalStorage fallback + UI event dispatch
  if (typeof window !== 'undefined') {
    const key = `levl_quicklog_${entry.date}`
    const existing: DailyQuickLogEntry[] = JSON.parse(localStorage.getItem(key) || '[]')
    const filtered = existing.filter(e => e.id !== entry.id)
    filtered.push(entry)
    localStorage.setItem(key, JSON.stringify(filtered))
    window.dispatchEvent(new CustomEvent('levl_quicklog_updated', { detail: entry }))
  }

  // 3. Asynchronously sync to Supabase user profile for cross-device visibility
  if (supabase && entry.local_user_id && entry.local_user_id !== 'default') {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('outcome_preference_scores')
        .eq('local_user_id', entry.local_user_id)
        .maybeSingle()

      const existingScores = (profile?.outcome_preference_scores as any) || {}
      const dailyLogsMap = existingScores._daily_quick_logs || {}
      const existingDateLogs: DailyQuickLogEntry[] = dailyLogsMap[entry.date] || []
      const filteredDateLogs = existingDateLogs.filter(e => e.id !== entry.id)
      filteredDateLogs.push(entry)

      const updatedScores = {
        ...existingScores,
        _daily_quick_logs: {
          ...dailyLogsMap,
          [entry.date]: filteredDateLogs
        }
      }

      await supabase
        .from('user_profiles')
        .upsert(
          { local_user_id: entry.local_user_id, outcome_preference_scores: updatedScores, updated_at: new Date().toISOString() },
          { onConflict: 'local_user_id' }
        )
    } catch (e) {
      console.warn('Notice saving quick log to Supabase:', e)
    }
  }

  return true
}

/**
 * Load all quick log entries for a given date from Local Storage and Supabase Cloud
 */
export async function loadQuickLogsForDate(
  localUserId: string,
  date: string
): Promise<DailyQuickLogEntry[]> {
  const effectiveUserId = localUserId || 'default'
  let localEntries: DailyQuickLogEntry[] = []

  // 1. Instant local read
  try {
    const db = await openQuickLogsDB()
    const tx = db.transaction(STORE_LOGS, 'readonly')
    const store = tx.objectStore(STORE_LOGS)
    const index = store.index('date')
    const request = index.getAll(date)

    localEntries = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  } catch (err) {
    if (typeof window !== 'undefined') {
      const key = `levl_quicklog_${date}`
      localEntries = JSON.parse(localStorage.getItem(key) || '[]')
    }
  }

  // 2. Supabase Cloud Sync & Merge
  if (supabase && effectiveUserId && effectiveUserId !== 'default') {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('outcome_preference_scores')
        .eq('local_user_id', effectiveUserId)
        .maybeSingle()

      const cloudLogs: DailyQuickLogEntry[] = (profile?.outcome_preference_scores as any)?._daily_quick_logs?.[date]
      if (Array.isArray(cloudLogs) && cloudLogs.length > 0) {
        const map = new Map<string, DailyQuickLogEntry>()
        localEntries.forEach(e => map.set(e.id, e))
        cloudLogs.forEach(c => map.set(c.id, c))

        // Backfill missing entries to local IndexedDB and localStorage
        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime()
        )

        if (typeof window !== 'undefined') {
          const key = `levl_quicklog_${date}`
          localStorage.setItem(key, JSON.stringify(merged))
        }

        try {
          const db = await openQuickLogsDB()
          const tx = db.transaction(STORE_LOGS, 'readwrite')
          const store = tx.objectStore(STORE_LOGS)
          cloudLogs.forEach(c => store.put(c))
        } catch (e) {}

        return merged
      }
    } catch (e) {
      console.warn('Notice syncing quick logs from cloud:', e)
    }
  }

  return localEntries.sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime())
}

/**
 * Delete a quick log entry by id locally and from Supabase Cloud
 */
export async function deleteQuickLogEntry(
  id: string,
  date: string,
  localUserId?: string
): Promise<boolean> {
  // 1. Delete from IndexedDB
  try {
    const db = await openQuickLogsDB()
    const tx = db.transaction(STORE_LOGS, 'readwrite')
    const store = tx.objectStore(STORE_LOGS)
    store.delete(id)

    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve
      tx.onerror = () => reject(tx.error)
    })
  } catch (err) {}

  // 2. Delete from LocalStorage + dispatch event
  if (typeof window !== 'undefined') {
    const key = `levl_quicklog_${date}`
    const existing: DailyQuickLogEntry[] = JSON.parse(localStorage.getItem(key) || '[]')
    const filtered = existing.filter(e => e.id !== id)
    localStorage.setItem(key, JSON.stringify(filtered))
    window.dispatchEvent(new CustomEvent('levl_quicklog_updated', { detail: { id, deleted: true, date } }))
  }

  // 3. Delete from Supabase Cloud
  const effectiveUserId = localUserId || (typeof window !== 'undefined' ? localStorage.getItem('levl_local_user_id') : '')
  if (supabase && effectiveUserId && effectiveUserId !== 'default') {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('outcome_preference_scores')
        .eq('local_user_id', effectiveUserId)
        .maybeSingle()

      const existingScores = (profile?.outcome_preference_scores as any) || {}
      const dailyLogsMap = existingScores._daily_quick_logs || {}
      const existingDateLogs: DailyQuickLogEntry[] = dailyLogsMap[date] || []
      const filteredDateLogs = existingDateLogs.filter(e => e.id !== id)

      const updatedScores = {
        ...existingScores,
        _daily_quick_logs: {
          ...dailyLogsMap,
          [date]: filteredDateLogs
        }
      }

      await supabase
        .from('user_profiles')
        .update({ outcome_preference_scores: updatedScores, updated_at: new Date().toISOString() })
        .eq('local_user_id', effectiveUserId)
    } catch (e) {
      console.warn('Notice deleting quick log from cloud:', e)
    }
  }

  return true
}

/**
 * Load user's customized hotkeys list
 */
export async function getUserHotkeys(localUserId: string): Promise<QuickHotkeyConfig[]> {
  const effectiveUserId = localUserId || 'default'

  // 1. Fast, synchronous LocalStorage read
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(`levl_user_hotkeys_${effectiveUserId}`) || localStorage.getItem('levl_user_hotkeys_default') || localStorage.getItem('levl_user_hotkeys')
    if (local) {
      try {
        const parsed = JSON.parse(local)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      } catch (e) {}
    }
  }

  // 2. IndexedDB read
  try {
    const db = await openQuickLogsDB()
    const tx = db.transaction(STORE_CONFIG, 'readonly')
    const store = tx.objectStore(STORE_CONFIG)
    const request = store.get(effectiveUserId)

    const result: { local_user_id: string; hotkeys: QuickHotkeyConfig[] } | undefined =
      await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })

    if (result && result.hotkeys && result.hotkeys.length > 0) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`levl_user_hotkeys_${effectiveUserId}`, JSON.stringify(result.hotkeys))
      }
      return result.hotkeys
    }
  } catch (err) {
    console.warn('Fallback loading user hotkeys:', err)
  }

  // 3. Supabase Cloud Profile Sync
  if (supabase && effectiveUserId && effectiveUserId !== 'default') {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('outcome_preference_scores')
        .eq('local_user_id', effectiveUserId)
        .maybeSingle()

      const cloudHotkeys = (profile?.outcome_preference_scores as any)?._custom_hotkeys
      if (Array.isArray(cloudHotkeys) && cloudHotkeys.length > 0) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(`levl_user_hotkeys_${effectiveUserId}`, JSON.stringify(cloudHotkeys))
          localStorage.setItem('levl_user_hotkeys_default', JSON.stringify(cloudHotkeys))
          localStorage.setItem('levl_user_hotkeys', JSON.stringify(cloudHotkeys))
        }
        return cloudHotkeys
      }
    } catch (e) {
      console.warn('Notice loading hotkeys from cloud profile:', e)
    }
  }

  return DEFAULT_STARTER_HOTKEYS
}

/**
 * Save user's customized hotkeys list
 */
export async function saveUserHotkeys(
  localUserId: string,
  hotkeys: QuickHotkeyConfig[]
): Promise<boolean> {
  const effectiveUserId = localUserId || 'default'

  // 1. Instant synchronous write to localStorage + global event broadcast
  if (typeof window !== 'undefined') {
    localStorage.setItem(`levl_user_hotkeys_${effectiveUserId}`, JSON.stringify(hotkeys))
    localStorage.setItem('levl_user_hotkeys_default', JSON.stringify(hotkeys))
    localStorage.setItem('levl_user_hotkeys', JSON.stringify(hotkeys))
    window.dispatchEvent(new CustomEvent('levl_hotkeys_config_updated', { detail: hotkeys }))
  }

  // 2. Persist to IndexedDB
  try {
    const db = await openQuickLogsDB()
    const tx = db.transaction(STORE_CONFIG, 'readwrite')
    const store = tx.objectStore(STORE_CONFIG)
    store.put({ local_user_id: effectiveUserId, hotkeys, updated_at: new Date().toISOString() })

    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve
      tx.onerror = () => reject(tx.error)
    })
  } catch (err) {
    console.warn('Fallback saving user hotkeys to IndexedDB:', err)
  }

  // 3. Asynchronously sync to Supabase user profile for cross-device sharing
  if (supabase && effectiveUserId && effectiveUserId !== 'default') {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('outcome_preference_scores')
        .eq('local_user_id', effectiveUserId)
        .maybeSingle()

      const existingScores = (profile?.outcome_preference_scores as any) || {}
      const updatedScores = {
        ...existingScores,
        _custom_hotkeys: hotkeys
      }

      await supabase
        .from('user_profiles')
        .upsert(
          { local_user_id: effectiveUserId, outcome_preference_scores: updatedScores, updated_at: new Date().toISOString() },
          { onConflict: 'local_user_id' }
        )
    } catch (e) {
      console.warn('Notice syncing hotkeys to Supabase:', e)
    }
  }

  return true
}

/**
 * Load all user-created custom hotkeys (active or inactive)
 */
export async function getCustomCreatedHotkeys(localUserId: string): Promise<QuickHotkeyConfig[]> {
  const effectiveUserId = localUserId || 'default'

  // 1. LocalStorage
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(`levl_custom_created_hotkeys_${effectiveUserId}`)
    if (local) {
      try {
        const parsed = JSON.parse(local)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      } catch (e) {}
    }
  }

  // 2. Supabase Cloud Sync
  if (supabase && effectiveUserId && effectiveUserId !== 'default') {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('outcome_preference_scores')
        .eq('local_user_id', effectiveUserId)
        .maybeSingle()

      const cloudCustom = (profile?.outcome_preference_scores as any)?._created_custom_hotkeys
      if (Array.isArray(cloudCustom) && cloudCustom.length > 0) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(`levl_custom_created_hotkeys_${effectiveUserId}`, JSON.stringify(cloudCustom))
        }
        return cloudCustom
      }
    } catch (e) {
      console.warn('Notice loading custom created hotkeys from cloud profile:', e)
    }
  }

  return []
}

/**
 * Save / persist a custom created hotkey to user library
 */
export async function saveCustomCreatedHotkey(
  localUserId: string,
  hotkey: QuickHotkeyConfig
): Promise<boolean> {
  const effectiveUserId = localUserId || 'default'

  let updatedList: QuickHotkeyConfig[] = []
  if (typeof window !== 'undefined') {
    const existing = await getCustomCreatedHotkeys(effectiveUserId)
    const filtered = existing.filter(h => h.id !== hotkey.id)
    filtered.push(hotkey)
    updatedList = filtered
    localStorage.setItem(`levl_custom_created_hotkeys_${effectiveUserId}`, JSON.stringify(filtered))
  }

  // Asynchronously sync to Supabase user profile
  if (supabase && effectiveUserId && effectiveUserId !== 'default') {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('outcome_preference_scores')
        .eq('local_user_id', effectiveUserId)
        .maybeSingle()

      const existingScores = (profile?.outcome_preference_scores as any) || {}
      const updatedScores = {
        ...existingScores,
        _created_custom_hotkeys: updatedList
      }

      await supabase
        .from('user_profiles')
        .upsert(
          { local_user_id: effectiveUserId, outcome_preference_scores: updatedScores, updated_at: new Date().toISOString() },
          { onConflict: 'local_user_id' }
        )
    } catch (e) {
      console.warn('Notice syncing custom created hotkey to Supabase:', e)
    }
  }

  return true
}

/**
 * Delete a custom created hotkey completely
 */
export async function deleteCustomCreatedHotkey(
  localUserId: string,
  hotkeyId: string
): Promise<boolean> {
  const effectiveUserId = localUserId || 'default'

  let updatedList: QuickHotkeyConfig[] = []
  if (typeof window !== 'undefined') {
    const existing = await getCustomCreatedHotkeys(effectiveUserId)
    const filtered = existing.filter(h => h.id !== hotkeyId)
    updatedList = filtered
    localStorage.setItem(`levl_custom_created_hotkeys_${effectiveUserId}`, JSON.stringify(filtered))
  }

  // Asynchronously sync deletion to Supabase user profile
  if (supabase && effectiveUserId && effectiveUserId !== 'default') {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('outcome_preference_scores')
        .eq('local_user_id', effectiveUserId)
        .maybeSingle()

      const existingScores = (profile?.outcome_preference_scores as any) || {}
      const updatedScores = {
        ...existingScores,
        _created_custom_hotkeys: updatedList
      }

      await supabase
        .from('user_profiles')
        .upsert(
          { local_user_id: effectiveUserId, outcome_preference_scores: updatedScores, updated_at: new Date().toISOString() },
          { onConflict: 'local_user_id' }
        )
    } catch (e) {
      console.warn('Notice syncing deleted hotkey to Supabase:', e)
    }
  }

  return true
}
