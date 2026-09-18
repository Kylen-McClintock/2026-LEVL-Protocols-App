'use client'

import React, { useState, useEffect } from 'react'
import { Moon, Sun, Sparkles, Check, CheckCircle2, Shield, Eye } from 'lucide-react'
import { useTheme, ThemeMode } from '@/lib/utils/useTheme'
import { UserProfile } from '@/lib/types'
import { updateUserProfile } from '@/lib/data'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'

interface ThemeAppearanceSettingsCardProps {
  profile?: UserProfile | null
  onUpdated?: (updated: UserProfile) => void
}

export default function ThemeAppearanceSettingsCard({ profile, onUpdated }: ThemeAppearanceSettingsCardProps) {
  const { theme, setTheme, isMounted } = useTheme()
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  // Optional sync from cloud profile if available
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

  const handleSelectTheme = async (mode: ThemeMode) => {
    if (theme === mode) return
    setTheme(mode)
    setSaveStatus('saving')

    // Persist to user profile preferences in background
    try {
      const localUserId = profile?.local_user_id || profile?.id || (typeof window !== 'undefined' ? localStorage.getItem('levl_local_user_id') : '') || getLocalUserId()
      if (localUserId) {
        const currentPrefs = profile?.outcome_preference_scores || {}
        const updatedPrefs = {
          ...currentPrefs,
          theme_preference: mode
        }

        const updated = await updateUserProfile(localUserId, {
          outcome_preference_scores: updatedPrefs
        })

        if (updated && onUpdated) {
          onUpdated(updated)
        }
      }
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2500)
    } catch (err) {
      console.warn('Failed to sync theme to profile:', err)
      setSaveStatus('idle')
    }
  }

  const themes = [
    {
      id: 'dark' as ThemeMode,
      title: 'Midnight Bio-Space',
      subtitle: 'Dark Mode (Default)',
      badge: 'Circadian Optimized',
      icon: Moon,
      iconColor: 'text-indigo-400',
      activeBorder: 'border-emerald-500/60 ring-1 ring-emerald-500/40',
      activeBg: 'bg-emerald-950/20',
      description: 'Deep midnight obsidian canvas with bioluminescent emerald accents for circadian eye protection.',
      previewBg: 'bg-[#030712] border-slate-800 text-white',
      pillBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    },
    {
      id: 'light' as ThemeMode,
      title: 'Crystalline Quartz',
      subtitle: 'Frosted Glass Light Mode',
      badge: 'Solar Photic Flux',
      icon: Sun,
      iconColor: 'text-amber-500',
      activeBorder: 'border-sky-500/60 ring-1 ring-sky-500/40',
      activeBg: 'bg-sky-50/60 dark:bg-sky-950/20',
      description: 'High-contrast frosted liquid quartz with obsidian typography and daylight vitality.',
      previewBg: 'bg-[#f8fafc] border-slate-200 text-slate-900 shadow-sm',
      pillBg: 'bg-emerald-100 text-emerald-800 border-emerald-300'
    }
  ]

  return (
    <div className="glass-card rounded-2xl p-5 sm:p-6 transition-all duration-300 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-sky-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
            {theme === 'dark' ? (
              <Moon size={20} className="text-indigo-400" />
            ) : (
              <Sun size={20} className="text-amber-500" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-levl-text-primary">
                Appearance & Visual Mode
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 font-semibold uppercase tracking-wider">
                Frosted Glass
              </span>
            </div>
            <p className="text-xs text-levl-text-secondary mt-0.5">
              Switch between circadian midnight and high-contrast frosted quartz glass.
            </p>
          </div>
        </div>

        {saveStatus === 'saved' && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium animate-in fade-in duration-200">
            <CheckCircle2 size={13} />
            <span className="text-[11px] font-mono">Saved</span>
          </div>
        )}
      </div>

      {/* Theme Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-2">
        {themes.map((t) => {
          const Icon = t.icon
          const isSelected = isMounted ? theme === t.id : t.id === 'dark'

          return (
            <button
              key={t.id}
              type="button"
              onClick={() => handleSelectTheme(t.id)}
              className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer relative flex flex-col justify-between ${
                isSelected
                  ? `${t.activeBorder} ${t.activeBg} shadow-md`
                  : 'border-levl-border hover:border-slate-400/40 bg-levl-card/60 hover:bg-levl-card-hover'
              }`}
            >
              {/* Top Row: Icon, Title, Check */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg bg-white/5 border border-white/10 ${t.iconColor}`}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-levl-text-primary leading-tight">
                        {t.title}
                      </div>
                      <div className="text-[11px] text-levl-text-secondary">
                        {t.subtitle}
                      </div>
                    </div>
                  </div>

                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                    isSelected
                      ? 'bg-emerald-500 border-emerald-400 text-white shadow-sm'
                      : 'border-slate-500/40 bg-transparent'
                  }`}>
                    {isSelected && <Check size={12} strokeWidth={3} />}
                  </div>
                </div>

                <p className="text-xs text-levl-text-secondary line-clamp-2 mt-2 leading-relaxed">
                  {t.description}
                </p>
              </div>

              {/* Bottom Miniature Preview Swatch */}
              <div className="mt-4 pt-3 border-t border-levl-border/60 flex items-center justify-between">
                <div className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-mono flex items-center gap-2 ${t.previewBg}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-[10px]">9.8 Longevity</span>
                </div>
                <span className="text-[10px] font-mono font-medium text-levl-text-secondary uppercase tracking-wider">
                  {t.badge}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
