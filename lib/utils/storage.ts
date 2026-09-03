/**
 * Safe localStorage utilities with automatic QuotaExceededError handling and cache eviction.
 */

export function safeLocalStorageSet(key: string, value: string): boolean {
  if (typeof window === 'undefined') return false

  try {
    localStorage.setItem(key, value)
    return true
  } catch (err: any) {
    const isQuotaError =
      err?.name === 'QuotaExceededError' ||
      err?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      err?.code === 22 ||
      err?.code === 1014

    if (isQuotaError) {
      console.warn(`localStorage quota exceeded when setting "${key}". Evicting stale cache...`)
      try {
        const keysToRemove: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i)
          if (k && k !== key && (
            k.startsWith('levl_cached_tasks_') || 
            k.startsWith('levl_wellbeing_') || 
            k.startsWith('levl_daily_tip_')
          )) {
            keysToRemove.push(k)
          }
        }

        // Evict up to 30 oldest task and wellbeing cache entries
        keysToRemove.slice(0, 30).forEach(k => {
          try {
            localStorage.removeItem(k)
          } catch (e) {}
        })

        // Retry setting item
        localStorage.setItem(key, value)
        return true
      } catch (retryErr) {
        console.warn(`Failed to set "${key}" even after cache eviction. Suppressing error to avoid UI crash.`, retryErr)
        return false
      }
    }

    console.warn(`localStorage.setItem failed for key "${key}":`, err)
    return false
  }
}

export function safeLocalStorageGet(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(key)
  } catch (err) {
    return null
  }
}

export function safeLocalStorageRemove(key: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    localStorage.removeItem(key)
    return true
  } catch (err) {
    return false
  }
}
