'use client'

import { useState, useEffect, useCallback } from 'react'

export type ThemeMode = 'dark' | 'light'

const THEME_STORAGE_KEY = 'levl_theme'
const THEME_EVENT = 'levl_theme_changed'

/**
 * High-performance, zero-FOUC theme management hook.
 * Defaults to 'dark' mode unless explicitly toggled by user.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>('dark')
  const [isMounted, setIsMounted] = useState(false)

  // 1. Synchronous hydration check from DOM class & localStorage
  useEffect(() => {
    setIsMounted(true)
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null
      if (stored === 'light' || stored === 'dark') {
        setThemeState(stored)
        applyThemeClass(stored)
      } else {
        // Default to dark
        setThemeState('dark')
        applyThemeClass('dark')
      }
    } catch (e) {
      setThemeState('dark')
      applyThemeClass('dark')
    }

    // Listen for cross-component theme changes
    const handleThemeChange = (e: any) => {
      if (e.detail === 'light' || e.detail === 'dark') {
        setThemeState(e.detail)
      }
    }

    window.addEventListener(THEME_EVENT, handleThemeChange)
    return () => window.removeEventListener(THEME_EVENT, handleThemeChange)
  }, [])

  // Helper to apply DOM class
  const applyThemeClass = (t: ThemeMode) => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    if (t === 'light') {
      root.classList.remove('dark')
      root.classList.add('light')
    } else {
      root.classList.remove('light')
      root.classList.add('dark')
    }
  }

  // 2. Set Theme Function
  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme)
    applyThemeClass(newTheme)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme)
    } catch (e) {}

    // Dispatch global event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: newTheme }))
    }
  }, [])

  // 3. Toggle Theme Function
  const toggleTheme = useCallback(() => {
    const nextTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
  }, [theme, setTheme])

  return {
    theme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    setTheme,
    toggleTheme,
    isMounted
  }
}
