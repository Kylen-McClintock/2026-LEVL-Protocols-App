import React, { useState, useRef, useEffect } from 'react'
import { Plus, Copy, Trash2 } from 'lucide-react'

export type SetLog = {
  lift: string
  weight: number | ''
  reps: number | ''
}

export type StrengthExecutionDetails = {
  duration?: number | ''
  intensity?: number | '' // 1-10
  sets: SetLog[]
}

type Props = {
  value: StrengthExecutionDetails
  onChange: (val: StrengthExecutionDetails) => void
}

const POPULAR_LIFTS = [
  "Bench Press", "Squat", "Deadlift", "Overhead Press", "Pull-ups", 
  "Barbell Row", "Dumbbell Curl", "Tricep Extension", "Leg Press",
  "Lat Pulldown", "Incline Bench Press", "Romanian Deadlift", "Lunges",
  "Lateral Raises", "Front Squat", "Leg Curl", "Leg Extension",
  "Calf Raises", "Face Pulls", "Hip Thrust", "Dumbbell Row",
  "Seated Cable Row", "Chest Fly", "Skull Crushers", "Hammer Curls",
  "Dips", "Push-ups", "Bulgarian Split Squat", "Kettlebell Swing", "Farmer's Walk"
].sort()

export default function StrengthExecutionLog({ value, onChange }: Props) {
  const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null)
  
  const addSet = () => {
    onChange({
      ...value,
      sets: [...(value.sets || []), { lift: '', weight: '', reps: '' }]
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

  return (
    <div className="flex flex-col gap-3 mt-3 p-3 bg-black/20 rounded-lg border border-white/5">
      <div className="flex items-center justify-between">
        <div className="text-[10px] text-levl-text-secondary uppercase tracking-wider font-bold">Strength Execution</div>
      </div>
      
      {/* Top Level Meta */}
      <div className="flex flex-wrap items-center gap-2 w-full">
        <div className="flex-1 min-w-[80px]">
          <label className="text-[9px] text-gray-500 uppercase font-semibold ml-1 block mb-1">Time (min)</label>
          <input 
            type="number" 
            min="0"
            value={value.duration || ''}
            onChange={(e) => onChange({...value, duration: e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0)})}
            className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-levl-accent"
          />
        </div>
        <div className="flex-1 min-w-[80px] relative group">
          <label className="text-[9px] text-gray-500 uppercase font-semibold ml-1 block mb-1">
            Intensity (1-10)
          </label>
          <input 
            type="number" 
            min="1"
            max="10"
            value={value.intensity || ''}
            onChange={(e) => {
              if (e.target.value === '') return onChange({...value, intensity: ''})
              const num = parseFloat(e.target.value) || 1
              onChange({...value, intensity: Math.min(10, Math.max(1, num))})
            }}
            className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-levl-accent"
          />
          <div className="absolute hidden group-hover:block bottom-full mb-1 left-0 w-48 bg-black border border-white/10 text-gray-300 text-[10px] p-2 rounded shadow-xl z-10">
            1 = Very Light / Active Recovery<br/>
            5 = Moderate Effort<br/>
            8 = Hard (2 reps in reserve)<br/>
            10 = Absolute Max Effort
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-white/10 my-1" />

      {/* Sets Builder */}
      <div className="space-y-2">
        {sets.map((set, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            <div className="relative flex-[2] min-w-[120px]">
              <input
                type="text"
                placeholder="Lift"
                value={set.lift}
                onChange={(e) => updateSet(idx, 'lift', e.target.value)}
                onFocus={() => setActiveSearchIndex(idx)}
                onBlur={() => setTimeout(() => setActiveSearchIndex(null), 200)}
                className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-levl-accent"
              />
              {activeSearchIndex === idx && set.lift.length > 0 && (
                <div className="absolute top-full mt-1 left-0 w-full max-h-40 overflow-y-auto bg-[#1a1a1a] border border-white/10 rounded shadow-xl z-20">
                  {POPULAR_LIFTS.filter(l => l.toLowerCase().includes(set.lift.toLowerCase())).map(match => (
                    <div 
                      key={match}
                      onClick={() => updateSet(idx, 'lift', match)}
                      className="px-3 py-2 text-sm text-gray-300 hover:bg-levl-accent hover:text-white cursor-pointer"
                    >
                      {match}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-[60px]">
              <input 
                type="number"
                min="0"
                placeholder="lbs"
                value={set.weight}
                onChange={(e) => updateSet(idx, 'weight', e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-levl-accent"
              />
            </div>
            <div className="flex-1 min-w-[60px]">
              <input 
                type="number"
                min="0"
                placeholder="reps"
                value={set.reps}
                onChange={(e) => updateSet(idx, 'reps', e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-levl-accent"
              />
            </div>
            <button 
              onClick={() => removeSet(idx)}
              className="w-8 h-9 flex items-center justify-center bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500 hover:text-white transition-colors flex-shrink-0"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-1">
        <button 
          onClick={addSet}
          className="flex-1 flex items-center justify-center gap-1.5 h-9 text-xs font-semibold bg-white/5 text-gray-300 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
        >
          <Plus size={14} /> Add Set
        </button>
        {sets.length > 0 && (
          <button 
            onClick={duplicateLastSet}
            className="flex-1 flex items-center justify-center gap-1.5 h-9 text-xs font-semibold bg-levl-accent/10 text-levl-accent border border-levl-accent/20 rounded-lg hover:bg-levl-accent hover:text-white transition-colors"
          >
            <Copy size={14} /> Duplicate Last
          </button>
        )}
      </div>
    </div>
  )
}
