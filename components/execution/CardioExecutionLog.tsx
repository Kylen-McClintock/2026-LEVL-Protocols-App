import React from 'react'
import { Activity, Zap, Heart, MapPin, Gauge } from 'lucide-react'

export type CardioExecutionDetails = {
  cardio_type?: string // Zone 2, Zone 5, VO2 Max, Incline Walk, Cycling, Rowing, Sprints
  duration?: number | '' // minutes
  distance?: number | '' // mi or km
  avg_hr?: number | '' // bpm
  max_hr?: number | '' // bpm
  watts?: number | '' // average power output
  elevation_ft?: number | '' // elevation gain
}

type Props = {
  value: CardioExecutionDetails
  onChange: (val: CardioExecutionDetails) => void
}

const CARDIO_TYPES = [
  "Zone 2 Endurance (Aerobic Base)",
  "VO2 Max / Zone 5 Interval",
  "Incline Treadmill Walk",
  "Stationary / Outdoor Bike",
  "Rowing Ergometer",
  "Sprint Interval Training (SIT)",
  "Trail Run / Jog"
]

export default function CardioExecutionLog({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3 mt-3 p-3 bg-black/20 rounded-lg border border-white/5">
      <div className="flex items-center justify-between">
        <div className="text-[10px] text-levl-text-secondary uppercase tracking-wider font-bold">
          Precision Cardio & Zone 2 Log
        </div>
        {value.avg_hr && (
          <div className="text-[10px] text-levl-accent font-bold">
            Avg HR: {value.avg_hr} bpm
          </div>
        )}
      </div>

      {/* Subtype Dropdown */}
      <div>
        <label className="text-[9px] text-gray-500 uppercase font-semibold ml-1 block mb-1">
          Cardio Intensity / Target Zone
        </label>
        <select
          value={value.cardio_type || ''}
          onChange={(e) => onChange({ ...value, cardio_type: e.target.value })}
          className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-levl-accent"
        >
          <option value="">Select Cardio Type / Zone...</option>
          {CARDIO_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="w-full h-px bg-white/10 my-1" />

      {/* Primary Metrics Row */}
      <div className="flex flex-wrap items-center gap-2 w-full">
        <div className="flex-1 min-w-[80px]">
          <label className="text-[9px] text-gray-500 uppercase font-semibold ml-1 block mb-1">
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
            className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-levl-accent"
          />
        </div>

        <div className="flex-1 min-w-[80px]">
          <label className="text-[9px] text-gray-500 uppercase font-semibold ml-1 block mb-1 flex items-center gap-1">
            <MapPin size={10} className="text-emerald-400" /> Dist (mi)
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
            className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-levl-accent"
          />
        </div>

        <div className="flex-1 min-w-[80px]">
          <label className="text-[9px] text-gray-500 uppercase font-semibold ml-1 block mb-1 flex items-center gap-1">
            <Heart size={10} className="text-red-400" /> Avg HR
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
            className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-levl-accent"
          />
        </div>

        <div className="flex-1 min-w-[80px]">
          <label className="text-[9px] text-gray-500 uppercase font-semibold ml-1 block mb-1 flex items-center gap-1">
            <Activity size={10} className="text-blue-400" /> Max HR
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
            className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-levl-accent"
          />
        </div>
      </div>

      {/* Advanced Secondary Row (Watts / Elevation) */}
      <div className="flex flex-wrap items-center gap-2 w-full">
        <div className="flex-1 min-w-[100px]">
          <label className="text-[9px] text-gray-500 uppercase font-semibold ml-1 block mb-1 flex items-center gap-1">
            <Zap size={10} className="text-yellow-400" /> Power (Watts)
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
            className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-levl-accent"
          />
        </div>

        <div className="flex-1 min-w-[100px]">
          <label className="text-[9px] text-gray-500 uppercase font-semibold ml-1 block mb-1 flex items-center gap-1">
            <Gauge size={10} className="text-purple-400" /> Elev Gain (ft)
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
            className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-levl-accent"
          />
        </div>
      </div>
    </div>
  )
}
