'use client'

import React from 'react'
import { CloudSun, Check, Ban } from 'lucide-react'
import { UserProfile } from '@/lib/types'
import { useWeatherTracking } from '@/lib/utils/useWeatherTracking'

interface WeatherTrackingSettingsCardProps {
  profile?: UserProfile | null
  localUserId?: string
  onUpdated?: (updated: UserProfile) => void
}

/**
 * Minimalist Settings Card for Weather Tracking.
 * Allows user to quickly opt out (or re-enable) with zero friction.
 */
export default function WeatherTrackingSettingsCard({
  profile,
  localUserId,
  onUpdated
}: WeatherTrackingSettingsCardProps) {
  const { isEnabled, isUpdating, setTracking } = useWeatherTracking(profile, localUserId)

  const handleToggle = async (enable: boolean) => {
    await setTracking(enable)
    if (profile && onUpdated) {
      onUpdated({
        ...profile,
        weather_tracking_enabled: enable,
        outcome_preference_scores: {
          ...profile.outcome_preference_scores,
          weather_tracking_enabled: enable
        }
      })
    }
  }

  return (
    <div 
      id="weather-settings"
      className="glass-card p-3.5 sm:p-4 rounded-2xl border border-slate-700/80 shadow-lg bg-slate-900/60 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3"
    >
      {/* Title & Icon */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center shadow-[0_0_10px_rgba(245,158,11,0.2)] shrink-0">
          <CloudSun size={18} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
              Weather Tracking
            </h3>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
              isEnabled
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
                : 'bg-slate-800/80 text-slate-400 border-slate-700/60'
            }`}>
              {isEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 truncate">
            Local UV index &amp; barometric pressure calibration
          </p>
        </div>
      </div>

      {/* Minimalist Segmented Toggle */}
      <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-xl border border-slate-800 shrink-0 self-start sm:self-center">
        <button
          type="button"
          onClick={() => handleToggle(true)}
          disabled={isUpdating}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none ${
            isEnabled
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md border border-emerald-400/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <CloudSun size={13} />
          <span>Enabled</span>
          {isEnabled && <Check size={12} className="stroke-[3] text-white" />}
        </button>

        <button
          type="button"
          onClick={() => handleToggle(false)}
          disabled={isUpdating}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none ${
            !isEnabled
              ? 'bg-slate-700 text-white shadow-md border border-slate-600'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Ban size={12} />
          <span>Opt Out</span>
          {!isEnabled && <Check size={12} className="stroke-[3] text-white" />}
        </button>
      </div>
    </div>
  )
}
