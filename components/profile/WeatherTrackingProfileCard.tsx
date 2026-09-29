'use client'

import React from 'react'
import { CloudSun, Sun, Check, Sparkles } from 'lucide-react'
import { UserProfile } from '@/lib/types'
import { useWeatherTracking } from '@/lib/utils/useWeatherTracking'

interface WeatherTrackingProfileCardProps {
  profile?: UserProfile | null
  localUserId?: string
  onUpdated?: (updated: UserProfile) => void
}

export default function WeatherTrackingProfileCard({
  profile,
  localUserId,
  onUpdated
}: WeatherTrackingProfileCardProps) {
  const { isEnabled, currentWeather, isUpdating, setTracking } = useWeatherTracking(profile, localUserId)

  const handleToggle = async () => {
    const nextState = !isEnabled
    await setTracking(nextState)
    if (profile && onUpdated) {
      onUpdated({
        ...profile,
        weather_tracking_enabled: nextState,
        outcome_preference_scores: {
          ...profile.outcome_preference_scores,
          weather_tracking_enabled: nextState
        }
      })
    }
  }

  return (
    <div className="glass-card p-4 sm:p-5 rounded-2xl border border-amber-500/25 shadow-xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-amber-950/20 backdrop-blur-md transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Header & Explanation */}
        <div className="flex items-start gap-3.5 min-w-0">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border ${
            isEnabled 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}>
            <CloudSun size={20} />
          </div>

          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Weather &amp; Circadian Tracking
              </h3>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                isEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700/60'
              }`}>
                {isEnabled ? '✓ Enabled' : 'Disabled'}
              </span>
            </div>

            {/* Super brief explanation of why */}
            <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
              Syncs local UV index and barometric pressure to calibrate morning sunlight timing, joint recovery, and ambient thermal stress.
            </p>

            {/* If opted in and weather is loaded, show live readout */}
            {isEnabled && currentWeather && (
              <div className="pt-2 flex items-center gap-2 text-xs text-slate-300 font-mono">
                <span className="text-base">{currentWeather.icon || '🌤️'}</span>
                <span className="font-bold text-white">{currentWeather.temp_f}°F</span>
                <span className="text-slate-500">•</span>
                <span className="text-amber-300">UV {Number(currentWeather.uv_index || 0).toFixed(1)}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">{currentWeather.condition}</span>
                {currentWeather.city && (
                  <>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400 truncate">{currentWeather.city}</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Direct 1-Click Toggle Switch & Action Button */}
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
          <button
            type="button"
            onClick={handleToggle}
            disabled={isUpdating}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isEnabled ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-slate-700'
            }`}
            role="switch"
            aria-checked={isEnabled}
            title={isEnabled ? 'Click to turn off weather tracking' : 'Click to turn on weather tracking'}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                isEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>

          <button
            type="button"
            onClick={handleToggle}
            disabled={isUpdating}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border select-none ${
              isEnabled
                ? 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-500/40'
                : 'bg-gradient-to-r from-amber-500 to-cyan-500 hover:from-amber-400 hover:to-cyan-400 text-slate-950 font-black shadow-md'
            }`}
          >
            {isUpdating ? 'Updating...' : isEnabled ? 'Turn Off' : 'Turn On'}
          </button>
        </div>
      </div>
    </div>
  )
}
