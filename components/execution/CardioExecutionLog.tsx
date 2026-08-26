import React, { useState, useEffect } from 'react'
import { Activity, Zap, Heart, MapPin, Gauge, Lock, TrendingUp, Compass, Flame } from 'lucide-react'
import { SpecializedTraits } from '@/lib/data/modalityArchetypes'

export type CardioExecutionDetails = {
  cardio_type?: string // Zone 2, Zone 5, VO2 Max, Incline Walk, Cycling, Rowing, Sprints, Rucking
  duration?: number | '' // minutes
  distance?: number | '' // mi or km
  avg_hr?: number | '' // bpm
  max_hr?: number | '' // bpm
  watts?: number | '' // average power output
  elevation_ft?: number | '' // elevation gain
  // Specialized Parameter Fields
  incline_pct?: number | '' // Incline treadmill walk
  ruck_weight_lbs?: number | '' // Rucking
  pace_500m?: string // Rowing pace
  cadence_rpm?: number | '' // Bike RPM
  time_in_zone_2_min?: number | '' // Zone 2 specific minutes
  // Wearable Biomarkers (Manual or Auto-Synced)
  active_calories?: number | ''
  strain?: number | ''
  hr_recovery_1m?: number | ''
}

type Props = {
  value: CardioExecutionDetails
  onChange: (val: CardioExecutionDetails) => void
  lockedCardioType?: string
  specializedTraits?: SpecializedTraits
}

const CARDIO_TYPES = [
  "Zone 2 Endurance (Aerobic Base)",
  "VO2 Max / Zone 5 Interval",
  "Incline Treadmill Walk",
  "Rucking",
  "Stationary / Outdoor Bike",
  "Rowing Ergometer",
  "Sprint Interval Training (SIT)",
  "Trail Run / Jog",
  "Stairmaster",
  "Swimming"
]

export default function CardioExecutionLog({ value, onChange, lockedCardioType, specializedTraits }: Props) {
  const [showBiometrics, setShowBiometrics] = useState(
    Boolean(value.active_calories || value.strain || value.hr_recovery_1m || value.time_in_zone_2_min)
  )

  // Auto-lock cardio_type if lockedCardioType provided
  useEffect(() => {
    if (lockedCardioType && value.cardio_type !== lockedCardioType) {
      onChange({ ...value, cardio_type: lockedCardioType })
    }
  }, [lockedCardioType])

  return (
    <div className="flex flex-col gap-3 mt-3 p-3.5 bg-black/30 rounded-xl border border-white/10 space-y-1">
      <div className="flex items-center justify-between">
        <div className="text-[10px] text-levl-text-secondary uppercase tracking-wider font-bold flex items-center gap-1.5">
          <Activity size={12} className="text-cyan-400" />
          <span>Precision Cardio &amp; Aerobic Log</span>
        </div>
        {lockedCardioType ? (
          <span className="text-[10px] text-cyan-300 font-bold bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Lock size={10} />
            <span>{lockedCardioType}</span>
          </span>
        ) : value.avg_hr ? (
          <div className="text-[10px] text-cyan-300 font-bold font-mono">
            Avg HR: {value.avg_hr} bpm
          </div>
        ) : null}
      </div>

      {/* Subtype Dropdown (hidden or disabled when locked) */}
      {!lockedCardioType && (
        <div>
          <label className="text-[9px] text-slate-400 uppercase font-semibold ml-1 block mb-1">
            Cardio Intensity / Target Zone
          </label>
          <select
            value={value.cardio_type || ''}
            onChange={(e) => onChange({ ...value, cardio_type: e.target.value })}
            className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-cyan-400 font-medium"
          >
            <option value="">Select Cardio Type / Zone...</option>
            {CARDIO_TYPES.map((t) => (
              <option key={t} value={t} className="bg-slate-900 text-white">
                {t}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="w-full h-px bg-white/10 my-0.5" />

      {/* Primary Metrics Row */}
      <div className="flex flex-wrap items-center gap-2 w-full">
        <div className="flex-1 min-w-[75px]">
          <label className="text-[9px] text-slate-400 uppercase font-semibold ml-1 block mb-1">
            Time (min)
          </label>
          <input
            type="number"
            min="0"
            placeholder="45"
            value={value.duration ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                duration: e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0),
              })
            }
            className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
          />
        </div>

        <div className="flex-1 min-w-[75px]">
          <label className="text-[9px] text-emerald-400 uppercase font-semibold ml-1 block mb-1 flex items-center gap-1">
            <MapPin size={10} /> Dist (mi)
          </label>
          <input
            type="number"
            min="0"
            step="0.1"
            placeholder="3.5"
            value={value.distance ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                distance: e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0),
              })
            }
            className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
          />
        </div>

        <div className="flex-1 min-w-[75px]">
          <label className="text-[9px] text-rose-400 uppercase font-semibold ml-1 block mb-1 flex items-center gap-1">
            <Heart size={10} /> Avg HR
          </label>
          <input
            type="number"
            min="0"
            placeholder="132"
            value={value.avg_hr ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                avg_hr: e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0),
              })
            }
            className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
          />
        </div>

        <div className="flex-1 min-w-[75px]">
          <label className="text-[9px] text-blue-400 uppercase font-semibold ml-1 block mb-1 flex items-center gap-1">
            <Activity size={10} /> Max HR
          </label>
          <input
            type="number"
            min="0"
            placeholder="165"
            value={value.max_hr ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                max_hr: e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0),
              })
            }
            className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
          />
        </div>
      </div>

      {/* Specialized Parameters Row (Incline %, Ruck Weight, Pace Split, Power) */}
      {(specializedTraits?.hasInclinePct || specializedTraits?.hasRuckWeight || specializedTraits?.hasPaceSplit || specializedTraits?.hasCadenceRpm || value.watts || value.elevation_ft) && (
        <div className="flex flex-wrap items-center gap-2 w-full pt-1">
          {specializedTraits?.hasInclinePct && (
            <div className="flex-1 min-w-[95px]">
              <label className="text-[9px] text-amber-400 uppercase font-semibold ml-1 block mb-1 flex items-center gap-1">
                <TrendingUp size={10} /> Incline (%)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder="12.0"
                value={value.incline_pct ?? ''}
                onChange={(e) => onChange({ ...value, incline_pct: e.target.value === '' ? '' : parseFloat(e.target.value) || 0 })}
                className="w-full h-9 bg-amber-950/20 border border-amber-500/30 rounded-lg px-3 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>
          )}

          {specializedTraits?.hasRuckWeight && (
            <div className="flex-1 min-w-[100px]">
              <label className="text-[9px] text-emerald-400 uppercase font-semibold ml-1 block mb-1 flex items-center gap-1">
                <Gauge size={10} /> Ruck Wt (lbs)
              </label>
              <input
                type="number"
                min="0"
                placeholder="30"
                value={value.ruck_weight_lbs ?? ''}
                onChange={(e) => onChange({ ...value, ruck_weight_lbs: e.target.value === '' ? '' : parseFloat(e.target.value) || 0 })}
                className="w-full h-9 bg-emerald-950/20 border border-emerald-500/30 rounded-lg px-3 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
              />
            </div>
          )}

          {specializedTraits?.hasPaceSplit && (
            <div className="flex-1 min-w-[105px]">
              <label className="text-[9px] text-cyan-400 uppercase font-semibold ml-1 block mb-1 flex items-center gap-1">
                <Compass size={10} /> /500m Pace
              </label>
              <input
                type="text"
                placeholder="1:55.2"
                value={value.pace_500m || ''}
                onChange={(e) => onChange({ ...value, pace_500m: e.target.value })}
                className="w-full h-9 bg-cyan-950/20 border border-cyan-500/30 rounded-lg px-3 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>
          )}

          <div className="flex-1 min-w-[95px]">
            <label className="text-[9px] text-yellow-400 uppercase font-semibold ml-1 block mb-1 flex items-center gap-1">
              <Zap size={10} /> Watts
            </label>
            <input
              type="number"
              min="0"
              placeholder="180"
              value={value.watts ?? ''}
              onChange={(e) =>
                onChange({
                  ...value,
                  watts: e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0),
                })
              }
              className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>

          <div className="flex-1 min-w-[95px]">
            <label className="text-[9px] text-purple-400 uppercase font-semibold ml-1 block mb-1 flex items-center gap-1">
              <Gauge size={10} /> Elev (ft)
            </label>
            <input
              type="number"
              min="0"
              placeholder="450"
              value={value.elevation_ft ?? ''}
              onChange={(e) =>
                onChange({
                  ...value,
                  elevation_ft: e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0),
                })
              }
              className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>
        </div>
      )}

      {/* Wearable Biometrics Section (Whoop, Apple, Garmin) */}
      <div className="pt-2 border-t border-white/5">
        <button
          type="button"
          onClick={() => setShowBiometrics(!showBiometrics)}
          className="text-[10px] font-bold text-slate-400 hover:text-cyan-300 flex items-center justify-between w-full transition-colors cursor-pointer py-1"
        >
          <span className="flex items-center gap-1.5">
            <Flame size={11} className="text-amber-400" />
            <span>Wearable Biometrics (Zone 2 Mins, Active Calories, Strain)</span>
          </span>
          <span className="text-[9px] font-mono text-cyan-400">{showBiometrics ? '▲ Hide' : '▼ Add'}</span>
        </button>

        {showBiometrics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 animate-in fade-in">
            <div>
              <label className="text-[9px] text-slate-500 uppercase font-semibold block mb-1">Zone 2 (min)</label>
              <input
                type="number"
                placeholder="38"
                value={value.time_in_zone_2_min ?? ''}
                onChange={(e) => onChange({...value, time_in_zone_2_min: e.target.value === '' ? '' : parseInt(e.target.value, 10) || ''})}
                className="w-full h-8 bg-slate-950 border border-white/10 rounded-lg px-2.5 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[9px] text-slate-500 uppercase font-semibold block mb-1">Active kcal</label>
              <input
                type="number"
                placeholder="420"
                value={value.active_calories ?? ''}
                onChange={(e) => onChange({...value, active_calories: e.target.value === '' ? '' : parseInt(e.target.value, 10) || ''})}
                className="w-full h-8 bg-slate-950 border border-white/10 rounded-lg px-2.5 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[9px] text-slate-500 uppercase font-semibold block mb-1">Strain (0-21)</label>
              <input
                type="number"
                step="0.1"
                placeholder="14.2"
                value={value.strain ?? ''}
                onChange={(e) => onChange({...value, strain: e.target.value === '' ? '' : parseFloat(e.target.value) || ''})}
                className="w-full h-8 bg-slate-950 border border-white/10 rounded-lg px-2.5 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[9px] text-slate-500 uppercase font-semibold block mb-1">1m HR Drop</label>
              <input
                type="number"
                placeholder="32 bpm"
                value={value.hr_recovery_1m ?? ''}
                onChange={(e) => onChange({...value, hr_recovery_1m: e.target.value === '' ? '' : parseInt(e.target.value, 10) || ''})}
                className="w-full h-8 bg-slate-950 border border-white/10 rounded-lg px-2.5 text-xs text-white font-mono"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
