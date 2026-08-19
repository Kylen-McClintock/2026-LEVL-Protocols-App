import React, { useState, useEffect } from 'react'
import { Clock, Activity, Droplets, Flame, Zap, Shield, Sparkles, Utensils, Heart, ChevronDown, ChevronUp } from 'lucide-react'
import { format, differenceInMinutes } from 'date-fns'
import { calculateGKI, getAutophagyStage } from '../fasting/ActiveFastWidget'

export type FastingExecutionDetails = {
  duration?: number | ''
  fast_type?: string
  start_time?: string // ISO string
  end_time?: string // ISO string
  ketones?: number | ''
  glucose?: number | ''
  sodium_mg?: number
  water_oz?: number
  refeed_meal_type?: string
  gi_comfort_score?: number | ''
}

type Props = {
  value: FastingExecutionDetails
  onChange: (val: FastingExecutionDetails) => void
  isMultiDay?: boolean
}

const FAST_TYPES = [
  "Water Only",
  "Bone Broth",
  "Coffee/Tea",
  "Fat Fast",
  "Dry Fast",
  "Juice Fast",
  "Custom"
]

const REFEED_TYPES = [
  { id: 'bone_broth', label: 'Bone Broth / Electrolytes' },
  { id: 'protein_fats', label: 'Healthy Protein + Fats (Eggs, Avocado)' },
  { id: 'low_carb', label: 'Balanced Low-Carb Meal' },
  { id: 'high_carb', label: 'High Carb Meal' }
]

export default function FastingExecutionLog({ value, onChange, isMultiDay = false }: Props) {
  const formatForInput = (isoString?: string) => {
    if (!isoString) return ''
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return ''
    return format(date, "yyyy-MM-dd'T'HH:mm")
  }

  const [startTime, setStartTime] = useState(formatForInput(value.start_time))
  const [endTime, setEndTime] = useState(formatForInput(value.end_time))
  
  // Auto-expand detailed tracking if user has already entered advanced data
  const hasAdvancedData = Boolean(value.ketones || value.glucose || value.refeed_meal_type || value.sodium_mg || value.water_oz)
  const [showDetailedTracking, setShowDetailedTracking] = useState(hasAdvancedData)

  useEffect(() => {
    if (startTime && endTime) {
      const start = new Date(startTime)
      const end = new Date(endTime)
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const diffMins = differenceInMinutes(end, start)
        const diffHours = Math.max(0, diffMins / 60)
        
        onChange({
          ...value,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          duration: parseFloat(diffHours.toFixed(1))
        })
      }
    }
  }, [startTime, endTime])

  const elapsedHours = typeof value.duration === 'number' ? value.duration : 16
  const currentStage = getAutophagyStage(elapsedHours)
  const gkiInfo = calculateGKI(value.glucose, value.ketones)

  const inputType = isMultiDay ? "datetime-local" : "time"

  return (
    <div className="flex flex-col gap-3 mt-3 p-3 bg-black/20 rounded-lg border border-white/5">
      <div className="flex items-center justify-between">
        <div className="text-[10px] text-levl-text-secondary uppercase tracking-wider font-bold">
          Fasting Log
        </div>
        {value.duration !== undefined && value.duration !== '' && (
          <div className="text-[10px] text-levl-accent font-bold">
            {value.duration} Hours Logged
          </div>
        )}
      </div>
      
      {/* Autophagy Stage Highlight Banner */}
      <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${currentStage.color}`}>
        <div className="flex items-center gap-2">
          <span className="text-base">{currentStage.icon}</span>
          <div>
            <span className="font-bold uppercase tracking-wider text-[11px] block">{currentStage.stage}</span>
            <span className="text-[10px] opacity-80">{currentStage.description}</span>
          </div>
        </div>
      </div>

      {/* DEFAULT VIEW: Time Started, Time Ended, Fast Protocol */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 w-full">
          <div className="flex-1 min-w-[120px]">
            <label className="text-[9px] text-gray-500 uppercase font-semibold ml-1 block mb-1">Started Fast</label>
            <input 
              type={inputType}
              value={isMultiDay ? startTime : (startTime ? format(new Date(value.start_time || startTime), 'HH:mm') : '')}
              onChange={(e) => {
                if (isMultiDay) {
                  setStartTime(e.target.value)
                } else {
                  const [h, m] = e.target.value.split(':')
                  const d = new Date()
                  d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0)
                  setStartTime(format(d, "yyyy-MM-dd'T'HH:mm"))
                }
              }}
              className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-levl-accent font-mono"
            />
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="text-[9px] text-gray-500 uppercase font-semibold ml-1 block mb-1">Ended Fast</label>
            <input 
              type={inputType}
              value={isMultiDay ? endTime : (endTime ? format(new Date(value.end_time || endTime), 'HH:mm') : '')}
              onChange={(e) => {
                if (isMultiDay) {
                  setEndTime(e.target.value)
                } else {
                  const [h, m] = e.target.value.split(':')
                  const d = new Date()
                  d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0)
                  setEndTime(format(d, "yyyy-MM-dd'T'HH:mm"))
                }
              }}
              className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-levl-accent font-mono"
            />
          </div>
        </div>

        <div>
          <label className="text-[9px] text-gray-500 uppercase font-semibold ml-1 block mb-1">Fast Protocol</label>
          <select 
            value={value.fast_type || ''}
            onChange={(e) => onChange({...value, fast_type: e.target.value})}
            className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-levl-accent"
          >
            <option value="">Select Protocol...</option>
            {FAST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* DETAILED TRACKING TOGGLE BUTTON */}
      <button 
        type="button"
        onClick={() => setShowDetailedTracking(!showDetailedTracking)}
        className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-semibold text-gray-300 hover:text-white transition-colors flex items-center justify-between px-3 mt-1"
      >
        <span className="flex items-center gap-1.5">
          📊 Detailed Tracking <span className="text-[10px] text-gray-500 font-normal">(Ketones, GKI, Refeeding, Hydration)</span>
        </span>
        {showDetailedTracking ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* EXPANDABLE ADVANCED TECHNICAL METRICS */}
      {showDetailedTracking && (
        <div className="space-y-3 pt-2 border-t border-white/10 animate-in slide-in-from-top-2">
          {/* Biomarkers */}
          <div className="flex flex-wrap items-center gap-2 w-full">
            <div className="flex-1 min-w-[100px]">
              <label className="text-[9px] text-gray-500 uppercase font-semibold ml-1 block mb-1 flex items-center gap-1">
                <Droplets size={10} className="text-red-400"/> Ketones
              </label>
              <input 
                type="number" 
                min="0"
                step="0.1"
                placeholder="mmol/L"
                value={value.ketones ?? ''}
                onChange={(e) => onChange({...value, ketones: e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0)})}
                className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-levl-accent font-mono"
              />
            </div>

            <div className="flex-1 min-w-[100px]">
              <label className="text-[9px] text-gray-500 uppercase font-semibold ml-1 block mb-1 flex items-center gap-1">
                <Activity size={10} className="text-blue-400"/> Glucose
              </label>
              <input 
                type="number" 
                min="0"
                placeholder="mg/dL"
                value={value.glucose ?? ''}
                onChange={(e) => onChange({...value, glucose: e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0)})}
                className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-levl-accent font-mono"
              />
            </div>
          </div>

          {/* GKI Score Banner if values entered */}
          {gkiInfo && (
            <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono font-bold ${gkiInfo.color}`}>
              <div className="flex items-center gap-2">
                <Activity size={14} />
                <span>Glucose-Ketone Index (GKI): {gkiInfo.gki}</span>
              </div>
              <span className="text-[10px] font-sans uppercase font-bold">{gkiInfo.level}</span>
            </div>
          )}

          {/* Refeeding Meal & GI Comfort */}
          <div className="space-y-2">
            <label className="text-[9px] text-gray-500 uppercase font-semibold ml-1 block flex items-center gap-1">
              <Utensils size={10} className="text-emerald-400" /> Refeeding Meal & Recovery
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <select 
                value={value.refeed_meal_type || ''}
                onChange={(e) => onChange({...value, refeed_meal_type: e.target.value})}
                className="flex-[2] min-w-[130px] h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-levl-accent"
              >
                <option value="">Select Refeeding Meal...</option>
                {REFEED_TYPES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>

              <div className="flex-1 min-w-[100px]">
                <input 
                  type="number"
                  min="1"
                  max="10"
                  placeholder="GI Comfort (1-10)"
                  value={value.gi_comfort_score ?? ''}
                  onChange={(e) => {
                    if (e.target.value === '') return onChange({...value, gi_comfort_score: ''})
                    const num = parseInt(e.target.value, 10) || 1
                    onChange({...value, gi_comfort_score: Math.min(10, Math.max(1, num))})
                  }}
                  className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-levl-accent font-mono"
                />
              </div>
            </div>
          </div>

          {/* Hydration & Electrolytes Quick Toggles */}
          <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/5">
            <span className="text-[10px] text-gray-400 font-semibold uppercase">Fasting Support Hydration:</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => onChange({ ...value, sodium_mg: (value.sodium_mg || 0) + 500 })}
                className="px-2 py-1 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded text-[10px] font-semibold transition-colors"
              >
                + 500mg Sodium ({value.sodium_mg || 0}mg)
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...value, water_oz: (value.water_oz || 0) + 16 })}
                className="px-2 py-1 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded text-[10px] font-semibold transition-colors"
              >
                + 16oz Water ({value.water_oz || 0}oz)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
