'use client'

import React from 'react'
import { CloudSun, Sun, Check, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react'
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

  const handleOptIn = async () => {
    await setTracking(true)
    if (profile && onUpdated) {
      onUpdated({
        ...profile,
        weather_tracking_enabled: true,
        outcome_preference_scores: {
          ...profile.outcome_preference_scores,
          weather_tracking_enabled: true
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
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                {isEnabled ? '✓ Opted In' : 'Optional'}
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

        {/* Action Button */}
        <div className="shrink-0 self-start sm:self-center">
          {isEnabled ? (
            <a
              href="#weather-settings"
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>Manage in Settings</span>
              <ArrowRight size={12} />
            </a>
          ) : (
            <button
              type="button"
              onClick={handleOptIn}
              disabled={isUpdating}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-cyan-500 hover:from-amber-400 hover:to-cyan-400 active:scale-95 text-slate-950 font-black text-xs transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sun size={14} className="fill-current" />
              <span>{isUpdating ? 'Activating...' : 'Opt In to Weather Tracking'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
