import React, { useState, useRef, useEffect } from 'react'
import { Plus, Copy, Trash2, Heart, Flame, Activity, Lock, Gauge } from 'lucide-react'
import { SpecializedTraits } from '@/lib/data/modalityArchetypes'

export type SetLog = {
  lift: string
  weight: number | ''
  reps: number | ''
  rpe?: number | ''
}

export type StrengthExecutionDetails = {
  duration?: number | ''
  intensity?: number | '' // 1-10
  sets: SetLog[]
  // Specialized Parameter Fields
  bfr_pressure_mmhg?: number | ''
  grip_force_lbs?: number | ''
  grip_hand?: 'left' | 'right' | 'both'
  // Wearable Biomarkers (Manual or Auto-Synced)
  avg_hr?: number | ''
  max_hr?: number | ''
  active_calories?: number | ''
  strain?: number | ''
  hr_recovery_1m?: number | ''
}

type Props = {
  value: StrengthExecutionDetails
  onChange: (val: StrengthExecutionDetails) => void
  lockedExerciseName?: string
  specializedTraits?: SpecializedTraits
}

const POPULAR_LIFTS = [
  "Bench Press", "Squat", "Deadlift", "Overhead Press", "Pull-ups", 
  "Barbell Row", "Dumbbell Curl", "Tricep Extension", "Leg Press",
  "Lat Pulldown", "Incline Bench Press", "Romanian Deadlift", "Lunges",
  "Lateral Raises", "Front Squat", "Leg Curl", "Leg Extension",
  "Calf Raises", "Face Pulls", "Hip Thrust", "Dumbbell Row",
  "Seated Cable Row", "Chest Fly", "Skull Crushers", "Hammer Curls",
  "Dips", "Push-ups", "Bulgarian Split Squat", "Kettlebell Swing", "Farmer's Walk",
  "Tibialis Raise", "Nordic Curl", "Handgrip Dynamometer", "BFR Occlusion Training"
].sort()

export default function StrengthExecutionLog({ value, onChange, lockedExerciseName, specializedTraits }: Props) {
  const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null)
  const [showBiometrics, setShowBiometrics] = useState(
    Boolean(value.avg_hr || value.max_hr || value.active_calories || value.strain || value.hr_recovery_1m)
  )

  const defaultLift = lockedExerciseName || ''
  
  const addSet = () => {
    const defaultExercise = lockedExerciseName || (value.sets?.[0]?.lift || '')
    onChange({
      ...value,
      sets: [...(value.sets || []), { lift: defaultExercise, weight: '', reps: '' }]
    })
  }

  const duplicateLastSet = () => {
    if (!value.sets || value.sets.length === 0) return addSet()
    const last = value.sets[value.sets.length - 1]
    onChange({
      ...value,
      sets: [...value.sets, { ...last }]
    })
  }

  const updateSet = (index: number, field: keyof SetLog, val: any) => {
    const newSets = [...(value.sets || [])]
    newSets[index] = { ...newSets[index], [field]: val }
    onChange({ ...value, sets: newSets })
  }

  const removeSet = (index: number) => {
    const newSets = [...(value.sets || [])]
    newSets.splice(index, 1)
    onChange({ ...value, sets: newSets })
  }

  const sets = value.sets || []

  // If lockedExerciseName is provided and sets are empty, auto-seed 1 set
  useEffect(() => {
    if (lockedExerciseName && sets.length === 0) {
      onChange({
        ...value,
        sets: [{ lift: lockedExerciseName, weight: '', reps: '' }]
      })
    }
  }, [lockedExerciseName])

  return (
    <div className="flex flex-col gap-3 mt-3 p-3.5 bg-black/30 rounded-xl border border-white/10 space-y-1">
      <div className="flex items-center justify-between">
        <div className="text-[10px] text-levl-text-secondary uppercase tracking-wider font-bold flex items-center gap-1.5">
          <Activity size={12} className="text-cyan-400" />
          <span>Resistance &amp; Strength Precision Log</span>
        </div>
        {lockedExerciseName && (
          <span className="text-[10px] text-cyan-300 font-bold bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Lock size={10} />
            <span>{lockedExerciseName}</span>
          </span>
        )}
      </div>
      
      {/* Top Level Meta */}
      <div className="flex flex-wrap items-center gap-2 w-full">
        <div className="flex-1 min-w-[80px]">
          <label className="text-[9px] text-slate-400 uppercase font-semibold ml-1 block mb-1">Time (min)</label>
          <input 
            type="number" 
            min="0"
            placeholder="45"
            value={value.duration ?? ''}
            onChange={(e) => onChange({...value, duration: e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0)})}
            className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
          />
        </div>
        <div className="flex-1 min-w-[80px] relative group">
          <label className="text-[9px] text-slate-400 uppercase font-semibold ml-1 block mb-1">
            Intensity (1-10 RPE)
          </label>
          <input 
            type="number" 
            min="1"
            max="10"
            placeholder="8"
            value={value.intensity ?? ''}
            onChange={(e) => {
              if (e.target.value === '') return onChange({...value, intensity: ''})
              const num = parseFloat(e.target.value) || 1
              onChange({...value, intensity: Math.min(10, Math.max(1, num))})
            }}
            className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
          />
        </div>

        {/* Specialized Parameter: BFR Pressure */}
        {specializedTraits?.hasBfrPressure && (
          <div className="flex-1 min-w-[110px]">
            <label className="text-[9px] text-amber-400 uppercase font-semibold ml-1 block mb-1 flex items-center gap-1">
              <Gauge size={10} /> Cuff Pressure
            </label>
            <div className="relative">
              <input 
                type="number" 
                min="0"
                placeholder="180"
                value={value.bfr_pressure_mmhg ?? ''}
                onChange={(e) => onChange({...value, bfr_pressure_mmhg: e.target.value === '' ? '' : parseFloat(e.target.value) || ''})}
                className="w-full h-9 bg-amber-950/20 border border-amber-500/30 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
              />
              <span className="absolute right-2.5 top-2 text-[10px] text-slate-500 font-mono">mmHg</span>
            </div>
          </div>
        )}

        {/* Specialized Parameter: Grip Force */}
        {specializedTraits?.hasGripForce && (
          <div className="flex-1 min-w-[120px]">
            <label className="text-[9px] text-emerald-400 uppercase font-semibold ml-1 block mb-1">
              Peak Force (lbs)
            </label>
            <div className="flex gap-1.5">
              <input 
                type="number" 
                min="0"
                placeholder="115"
                value={value.grip_force_lbs ?? ''}
                onChange={(e) => onChange({...value, grip_force_lbs: e.target.value === '' ? '' : parseFloat(e.target.value) || ''})}
                className="flex-1 h-9 bg-emerald-950/20 border border-emerald-500/30 rounded-lg px-2 text-xs text-white font-mono"
              />
              <select
                value={value.grip_hand || 'both'}
                onChange={(e) => onChange({...value, grip_hand: e.target.value as any})}
                className="w-16 h-9 bg-slate-900 border border-white/10 rounded-lg px-1 text-[10px] text-slate-300 font-bold"
              >
                <option value="both">Both</option>
                <option value="right">Right</option>
                <option value="left">Left</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="w-full h-px bg-white/10 my-1" />

      {/* Sets Builder */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 px-1">
          <span>{lockedExerciseName ? 'Sets & Performance Target' : 'Exercise & Weight/Reps'}</span>
          <span>{sets.length} {sets.length === 1 ? 'Set' : 'Sets'} Logged</span>
        </div>

        {sets.map((set, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            {lockedExerciseName ? (
              <div className="flex-[2] min-w-[110px] h-9 bg-white/5 border border-white/10 rounded-lg px-3 flex items-center text-xs font-bold text-slate-300">
                <span className="text-slate-400 mr-2 text-[10px] font-mono">#{idx + 1}</span>
                <span className="truncate">{lockedExerciseName}</span>
              </div>
            ) : (
              <div className="relative flex-[2] min-w-[120px]">
                <input
                  type="text"
                  placeholder="e.g. Squat"
                  value={set.lift}
                  onChange={(e) => updateSet(idx, 'lift', e.target.value)}
                  onFocus={() => setActiveSearchIndex(idx)}
                  onBlur={() => setTimeout(() => setActiveSearchIndex(null), 200)}
                  className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-cyan-400 font-medium"
                />
                {activeSearchIndex === idx && set.lift.length > 0 && (
                  <div className="absolute top-full mt-1 left-0 w-full max-h-40 overflow-y-auto bg-slate-900 border border-white/15 rounded-lg shadow-2xl z-20">
                    {POPULAR_LIFTS.filter(l => l.toLowerCase().includes(set.lift.toLowerCase())).map(match => (
                      <div 
                        key={match}
                        onClick={() => updateSet(idx, 'lift', match)}
                        className="px-3 py-2 text-xs text-slate-300 hover:bg-cyan-600 hover:text-black font-medium cursor-pointer"
                      >
                        {match}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex-1 min-w-[65px]">
              <input 
                type="number" 
                min="0"
                placeholder="lbs"
                value={set.weight}
                onChange={(e) => updateSet(idx, 'weight', e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono text-center"
              />
            </div>
            <div className="flex-1 min-w-[60px]">
              <input 
                type="number" 
                min="0"
                placeholder="reps"
                value={set.reps}
                onChange={(e) => updateSet(idx, 'reps', e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono text-center"
              />
            </div>
            <button 
              type="button"
              onClick={() => removeSet(idx)}
              className="w-8 h-9 flex items-center justify-center bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg hover:bg-rose-500 hover:text-white transition-colors shrink-0 cursor-pointer"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-1">
        <button 
          type="button"
          onClick={addSet}
          className="flex-1 flex items-center justify-center gap-1.5 h-9 text-xs font-bold bg-white/5 text-slate-300 border border-white/10 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
        >
          <Plus size={14} /> Add Set
        </button>
        {sets.length > 0 && (
          <button 
            type="button"
            onClick={duplicateLastSet}
            className="flex-1 flex items-center justify-center gap-1.5 h-9 text-xs font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 rounded-lg hover:bg-cyan-500 hover:text-black transition-colors cursor-pointer"
          >
            <Copy size={13} /> Duplicate Last
          </button>
        )}
      </div>

      {/* Wearable Biometrics Section (Whoop, Apple, Garmin) */}
      <div className="pt-2 border-t border-white/5">
        <button
          type="button"
          onClick={() => setShowBiometrics(!showBiometrics)}
          className="text-[10px] font-bold text-slate-400 hover:text-cyan-300 flex items-center justify-between w-full transition-colors cursor-pointer py-1"
        >
          <span className="flex items-center gap-1.5">
            <Heart size={11} className="text-rose-400" />
            <span>Wearable Biometrics (HR, Calories, Strain)</span>
          </span>
          <span className="text-[9px] font-mono text-cyan-400">{showBiometrics ? '▲ Hide' : '▼ Add'}</span>
        </button>

        {showBiometrics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 animate-in fade-in">
            <div>
              <label className="text-[9px] text-slate-500 uppercase font-semibold block mb-1">Avg HR (bpm)</label>
              <input
                type="number"
                placeholder="135"
                value={value.avg_hr ?? ''}
                onChange={(e) => onChange({...value, avg_hr: e.target.value === '' ? '' : parseInt(e.target.value, 10) || ''})}
                className="w-full h-8 bg-slate-950 border border-white/10 rounded-lg px-2.5 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[9px] text-slate-500 uppercase font-semibold block mb-1">Max HR (bpm)</label>
              <input
                type="number"
                placeholder="165"
                value={value.max_hr ?? ''}
                onChange={(e) => onChange({...value, max_hr: e.target.value === '' ? '' : parseInt(e.target.value, 10) || ''})}
                className="w-full h-8 bg-slate-950 border border-white/10 rounded-lg px-2.5 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[9px] text-slate-500 uppercase font-semibold block mb-1">Active kcal</label>
              <input
                type="number"
                placeholder="320"
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
                placeholder="12.4"
                value={value.strain ?? ''}
                onChange={(e) => onChange({...value, strain: e.target.value === '' ? '' : parseFloat(e.target.value) || ''})}
                className="w-full h-8 bg-slate-950 border border-white/10 rounded-lg px-2.5 text-xs text-white font-mono"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
