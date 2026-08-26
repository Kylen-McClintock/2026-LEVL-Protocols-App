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

/**
 * Save a single quick log entry into IndexedDB and LocalStorage fallback
 */
export async function saveQuickLogEntry(entry: DailyQuickLogEntry): Promise<boolean> {
  try {
    const db = await openQuickLogsDB()
    const tx = db.transaction(STORE_LOGS, 'readwrite')
    const store = tx.objectStore(STORE_LOGS)
    store.put(entry)

    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve
      tx.onerror = () => reject(tx.error)
    })

    // Also trigger window custom event for live cross-component sync
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('levl_quicklog_updated', { detail: entry }))
    }

    return true
  } catch (err) {
    console.warn('Falling back to localStorage for quick log:', err)
    if (typeof window !== 'undefined') {
      const key = `levl_quicklog_${entry.date}`
      const existing: DailyQuickLogEntry[] = JSON.parse(localStorage.getItem(key) || '[]')
      const filtered = existing.filter(e => e.id !== entry.id)
      filtered.push(entry)
      localStorage.setItem(key, JSON.stringify(filtered))
      window.dispatchEvent(new CustomEvent('levl_quicklog_updated', { detail: entry }))
    }
    return true
  }
}

/**
 * Load all quick log entries for a given date
 */
export async function loadQuickLogsForDate(
  localUserId: string,
  date: string
): Promise<DailyQuickLogEntry[]> {
  try {
    const db = await openQuickLogsDB()
    const tx = db.transaction(STORE_LOGS, 'readonly')
    const store = tx.objectStore(STORE_LOGS)
    const index = store.index('date')
    const request = index.getAll(date)

    const entries: DailyQuickLogEntry[] = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })

    return entries.sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime())
  } catch (err) {
    console.warn('Fallback reading localStorage for quick logs:', err)
    if (typeof window !== 'undefined') {
      const key = `levl_quicklog_${date}`
      return JSON.parse(localStorage.getItem(key) || '[]')
    }
    return []
  }
}

/**
 * Delete a quick log entry by id
 */
export async function deleteQuickLogEntry(id: string, date: string): Promise<boolean> {
  try {
    const db = await openQuickLogsDB()
    const tx = db.transaction(STORE_LOGS, 'readwrite')
    const store = tx.objectStore(STORE_LOGS)
    store.delete(id)

    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve
      tx.onerror = () => reject(tx.error)
    })

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('levl_quicklog_updated', { detail: { id, deleted: true, date } }))
    }
    return true
  } catch (err) {
    if (typeof window !== 'undefined') {
      const key = `levl_quicklog_${date}`
      const existing: DailyQuickLogEntry[] = JSON.parse(localStorage.getItem(key) || '[]')
      const filtered = existing.filter(e => e.id !== id)
      localStorage.setItem(key, JSON.stringify(filtered))
      window.dispatchEvent(new CustomEvent('levl_quicklog_updated', { detail: { id, deleted: true, date } }))
    }
    return true
  }
}

import { supabase } from '@/lib/supabase/client'

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
