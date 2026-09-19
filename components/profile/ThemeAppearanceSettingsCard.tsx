'use client'

import React, { useEffect } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme, ThemeMode } from '@/lib/utils/useTheme'
import { UserProfile } from '@/lib/types'
import { updateUserProfile } from '@/lib/data'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'

interface ThemeAppearanceSettingsCardProps {
  profile?: UserProfile | null
  onUpdated?: (updated: UserProfile) => void
}

/**
 * Minimalist Dark / Light Mode Toggle.
 */
export default function ThemeAppearanceSettingsCard({ profile, onUpdated }: ThemeAppearanceSettingsCardProps) {
  const { theme, setTheme, isMounted } = useTheme()

  // Sync from cloud profile if available and not set locally
  useEffect(() => {
    if (profile?.outcome_preference_scores) {
      const cloudTheme = profile.outcome_preference_scores.theme_preference as ThemeMode | undefined
      if (cloudTheme === 'light' || cloudTheme === 'dark') {
        const localTheme = typeof window !== 'undefined' ? localStorage.getItem('levl_theme') : null
        if (!localTheme) {
          setTheme(cloudTheme)
        }
      }
    }
  }, [profile, setTheme])

  const activeTheme = isMounted ? theme : 'dark'
  const isLight = activeTheme === 'light'

  const handleToggle = async () => {
    const nextTheme: ThemeMode = isLight ? 'dark' : 'light'
    setTheme(nextTheme)

    // Persist in background
    try {
      const localUserId = profile?.local_user_id || profile?.id || (typeof window !== 'undefined' ? localStorage.getItem('levl_local_user_id') : '') || getLocalUserId()
      if (localUserId) {
        const currentPrefs = profile?.outcome_preference_scores || {}
        const updatedPrefs = {
          ...currentPrefs,
          theme_preference: nextTheme
        }

        const updated = await updateUserProfile(localUserId, {
          outcome_preference_scores: updatedPrefs
        })

        if (updated && onUpdated) {
          onUpdated(updated)
        }
      }
    } catch (err) {
      console.warn('Notice syncing theme to profile:', err)
    }
  }

  return (
    <div className="glass-card p-3.5 sm:p-4 rounded-2xl border border-slate-700/80 shadow-lg bg-slate-900/60 backdrop-blur-md flex items-center justify-between gap-3">
      {/* Icon & Label */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border shadow-sm transition-colors ${
            isLight
              ? 'bg-amber-500/20 text-amber-500 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
              : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
          }`}
        >
          {isLight ? <Sun size={18} /> : <Moon size={18} />}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-sm sm:text-base text-levl-text-primary tracking-tight">
              {isLight ? 'Light Mode' : 'Dark Mode'}
            </h3>
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                isLight
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-indigo-950/80 text-indigo-300 border-indigo-800/60'
              }`}
            >
              {isLight ? 'Light' : 'Dark'}
            </span>
          </div>
          <p className="text-xs text-levl-text-secondary mt-0.5 truncate">
            {isLight ? 'Crystalline quartz frosted glass' : 'Midnight bio-space'}
          </p>
        </div>
      </div>

      {/* Sleek Switch Toggle */}
      <button
        type="button"
        role="switch"
        aria-checked={isLight}
        aria-label="Toggle dark and light mode"
        onClick={handleToggle}
        className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          isLight ? 'bg-amber-500' : 'bg-slate-700'
        }`}
      >
        <span
          className={`pointer-events-none inline-flex h-6 w-6 transform items-center justify-center rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
            isLight ? 'translate-x-7' : 'translate-x-0'
          }`}
        >
          {isLight ? (
            <Sun size={13} className="text-amber-600" />
          ) : (
            <Moon size={13} className="text-slate-800" />
          )}
        </span>
      </button>
    </div>
  )
}
