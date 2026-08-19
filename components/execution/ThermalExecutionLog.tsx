import React from 'react'
import { Flame, Snowflake, Clock, RefreshCw, Plus, Copy, Trash2 } from 'lucide-react'

export type ThermalRound = {
  exposure_type: string
  temperature?: number | ''
  duration?: number | '' // minutes
}

export type ThermalExecutionDetails = {
  exposure_type?: 'sauna' | 'cold_plunge' | 'contrast' | 'steam' | string
  temperature?: number | ''
  temperature_unit?: 'F' | 'C'
  duration?: number | '' // minutes
  rounds?: number | ''
  round_details?: ThermalRound[]
  notes?: string
}

type Props = {
  value: ThermalExecutionDetails
  onChange: (val: ThermalExecutionDetails) => void
}

const EXPOSURE_TYPES = [
  { id: 'sauna', label: 'Sauna (Dry/Infrared)', icon: Flame },
  { id: 'cold_plunge', label: 'Cold Plunge / Ice Bath', icon: Snowflake },
  { id: 'contrast', label: 'Contrast Therapy', icon: RefreshCw },
  { id: 'steam', label: 'Steam Room', icon: Flame },
]

export default function ThermalExecutionLog({ value, onChange }: Props) {
  const currentUnit = value.temperature_unit || 'F'
  const roundDetails = value.round_details || []

  // Recalculate totals from rounds if present
  const totalRounds = roundDetails.length > 0 ? roundDetails.length : (value.rounds || 1)
  const totalDuration = roundDetails.length > 0 
    ? roundDetails.reduce((acc, r) => acc + (typeof r.duration === 'number' ? r.duration : 0), 0)
    : (value.duration || '')

  const handleExposureTypeChange = (typeId: string) => {
    let newRounds = roundDetails
    const defaultTemp = typeId === 'cold_plunge' ? 45 : (typeId === 'steam' ? 115 : 180)
    const defaultDur = typeId === 'cold_plunge' ? 3 : 15

    if (typeId === 'contrast') {
      if (roundDetails.length === 0) {
        newRounds = [
          { exposure_type: 'sauna', temperature: 180, duration: 15 },
          { exposure_type: 'cold_plunge', temperature: 45, duration: 3 }
        ]
      }
    } else if (roundDetails.length > 0) {
      // Update first round to match selected type if user switches top selection
      newRounds = roundDetails.map((r, i) => 
        i === 0 ? { ...r, exposure_type: typeId, temperature: r.temperature || defaultTemp, duration: r.duration || defaultDur } : r
      )
    }

    onChange({
      ...value,
      exposure_type: typeId,
      round_details: newRounds,
      rounds: newRounds.length > 0 ? newRounds.length : value.rounds,
      duration: newRounds.length > 0 ? newRounds.reduce((acc, r) => acc + (typeof r.duration === 'number' ? r.duration : 0), 0) : value.duration
    })
  }

  const addRound = () => {
    let defaultType = value.exposure_type || 'sauna'

    // If user explicitly chose Contrast Therapy, alternate between Sauna and Cold Plunge
    if (value.exposure_type === 'contrast') {
      const lastRound = roundDetails[roundDetails.length - 1]
      defaultType = lastRound 
        ? (lastRound.exposure_type === 'sauna' ? 'cold_plunge' : 'sauna') 
        : 'sauna'
    }

    const defaultTemp = defaultType === 'cold_plunge' ? 45 : (defaultType === 'steam' ? 115 : 180)
    const defaultDur = defaultType === 'cold_plunge' ? 3 : 15

    const newRounds = [
      ...roundDetails,
      { exposure_type: defaultType, temperature: defaultTemp, duration: defaultDur }
    ]
    onChange({
      ...value,
      rounds: newRounds.length,
      duration: newRounds.reduce((acc, r) => acc + (typeof r.duration === 'number' ? r.duration : 0), 0),
      round_details: newRounds
    })
  }

  const setPresetRounds = (count: number) => {
    const baseType = value.exposure_type || 'sauna'
    const baseTemp = value.temperature || (baseType === 'cold_plunge' ? 45 : (baseType === 'steam' ? 115 : 180))
    const baseDuration = value.duration || (baseType === 'cold_plunge' ? 3 : 15)

    const newRounds: ThermalRound[] = []
    for (let i = 0; i < count; i++) {
      if (baseType === 'contrast') {
        newRounds.push(
          { exposure_type: 'sauna', temperature: 180, duration: 15 },
          { exposure_type: 'cold_plunge', temperature: 45, duration: 3 }
        )
      } else {
        newRounds.push({ exposure_type: baseType, temperature: baseTemp, duration: baseDuration })
      }
    }

    onChange({
      ...value,
      rounds: newRounds.length,
      duration: newRounds.reduce((acc, r) => acc + (typeof r.duration === 'number' ? r.duration : 0), 0),
      round_details: newRounds
    })
  }

  const updateRound = (index: number, field: keyof ThermalRound, val: any) => {
    const newRounds = [...roundDetails]
    newRounds[index] = { ...newRounds[index], [field]: val }
    
    onChange({
      ...value,
      rounds: newRounds.length,
      duration: newRounds.reduce((acc, r) => acc + (typeof r.duration === 'number' ? r.duration : 0), 0),
      round_details: newRounds
    })
  }

  const removeRound = (index: number) => {
    const newRounds = [...roundDetails]
    newRounds.splice(index, 1)
    onChange({
      ...value,
      rounds: newRounds.length,
      duration: newRounds.reduce((acc, r) => acc + (typeof r.duration === 'number' ? r.duration : 0), 0),
      round_details: newRounds
    })
  }

  return (
    <div className="flex flex-col gap-3 mt-3 p-2.5 bg-black/20 rounded-lg border border-white/5 w-full">
      <div className="flex items-center justify-between">
        <div className="text-[10px] text-levl-text-secondary uppercase tracking-wider font-bold">
          Thermal Exposure Log
        </div>
        {totalDuration !== '' && totalDuration > 0 && (
          <div className="text-[10px] text-levl-accent font-bold">
            {totalDuration} mins total ({totalRounds} {totalRounds === 1 ? 'round' : 'rounds'})
          </div>
        )}
      </div>

      {/* Exposure Type Selection */}
      <div className="grid grid-cols-2 gap-2">
        {EXPOSURE_TYPES.map((type) => {
          const Icon = type.icon
          const isSelected = value.exposure_type === type.id
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => handleExposureTypeChange(type.id)}
              className={`flex items-center gap-2 p-2 rounded-lg text-xs border transition-colors ${
                isSelected
                  ? 'bg-levl-accent/20 border-levl-accent text-white font-semibold'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon size={14} className={isSelected ? 'text-levl-accent' : 'text-gray-500'} />
              <span>{type.label}</span>
            </button>
          )
        })}
      </div>

      <div className="w-full h-px bg-white/10 my-1" />

      {/* Quick Round Presets */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] text-gray-400 uppercase font-semibold">Quick Set Rounds:</span>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setPresetRounds(2)}
            className="px-2 py-1 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded text-[10px] font-semibold transition-colors"
          >
            2x Rounds
          </button>
          <button
            type="button"
            onClick={() => setPresetRounds(3)}
            className="px-2 py-1 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded text-[10px] font-semibold transition-colors"
          >
            3x Rounds
          </button>
          <button
            type="button"
            onClick={() => setPresetRounds(4)}
            className="px-2 py-1 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded text-[10px] font-semibold transition-colors"
          >
            4x Rounds
          </button>
        </div>
      </div>

      {/* Multi-Round Detailed List (If user customized rounds) */}
      {roundDetails.length > 0 ? (
        <div className="space-y-2 my-1 w-full">
          {roundDetails.map((round, idx) => (
            <div key={idx} className="flex gap-2 items-center bg-white/5 p-2 rounded-lg border border-white/5 w-full">
              <span className="text-[10px] font-bold text-levl-accent w-6 shrink-0 text-center">
                R{idx + 1}
              </span>

              <select
                value={round.exposure_type || 'sauna'}
                onChange={(e) => updateRound(idx, 'exposure_type', e.target.value)}
                className="h-8 bg-black/40 border border-white/10 rounded px-2 text-xs text-white focus:outline-none focus:border-levl-accent flex-[2] min-w-[90px]"
              >
                <option value="sauna">Sauna</option>
                <option value="cold_plunge">Cold Plunge</option>
                <option value="steam">Steam Room</option>
                <option value="contrast">Contrast</option>
              </select>

              <div className="flex items-center gap-1 flex-1 min-w-[65px]">
                <input
                  type="number"
                  min="0"
                  placeholder="Temp"
                  value={round.temperature ?? ''}
                  onChange={(e) => updateRound(idx, 'temperature', e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full h-8 bg-black/40 border border-white/10 rounded px-1.5 text-xs text-white focus:outline-none focus:border-levl-accent font-mono text-center"
                />
                <span className="text-[10px] text-gray-400 shrink-0">°{currentUnit}</span>
              </div>

              <div className="flex items-center gap-1 flex-1 min-w-[55px]">
                <input
                  type="number"
                  min="0"
                  placeholder="min"
                  value={round.duration ?? ''}
                  onChange={(e) => updateRound(idx, 'duration', e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full h-8 bg-black/40 border border-white/10 rounded px-1.5 text-xs text-white focus:outline-none focus:border-levl-accent font-mono text-center"
                />
                <span className="text-[10px] text-gray-400 shrink-0">m</span>
              </div>

              <button
                type="button"
                onClick={() => removeRound(idx)}
                className="w-7 h-8 flex items-center justify-center bg-red-500/10 text-red-400 border border-red-500/20 rounded hover:bg-red-500 hover:text-white transition-colors shrink-0"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* Single-Round / Generic Form */
        <div className="flex flex-wrap items-center gap-2 w-full">
          <div className="flex-1 min-w-[90px]">
            <label className="text-[9px] text-gray-500 uppercase font-semibold ml-1 block mb-1">
              Temp (°{currentUnit})
            </label>
            <div className="flex gap-1">
              <input
                type="number"
                min="0"
                placeholder={value.exposure_type === 'cold_plunge' ? '45' : '180'}
                value={value.temperature ?? ''}
                onChange={(e) =>
                  onChange({
                    ...value,
                    temperature: e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0),
                  })
                }
                className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-levl-accent"
              />
              <button
                type="button"
                onClick={() =>
                  onChange({ ...value, temperature_unit: currentUnit === 'F' ? 'C' : 'F' })
                }
                className="px-2 h-9 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-400 hover:text-white"
              >
                °{currentUnit}
              </button>
            </div>
          </div>

          <div className="flex-1 min-w-[80px]">
            <label className="text-[9px] text-gray-500 uppercase font-semibold ml-1 block mb-1 flex items-center gap-1">
              <Clock size={10} className="text-levl-accent" /> Time (min)
            </label>
            <input
              type="number"
              min="0"
              placeholder="15"
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
            <label className="text-[9px] text-gray-500 uppercase font-semibold ml-1 block mb-1">
              Rounds
            </label>
            <input
              type="number"
              min="1"
              placeholder="1"
              value={value.rounds ?? ''}
              onChange={(e) =>
                onChange({
                  ...value,
                  rounds: e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value, 10) || 1),
                })
              }
              className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-levl-accent"
            />
          </div>
        </div>
      )}

      {/* Add Round / Duplicate Button */}
      <div className="flex gap-2 mt-1 w-full">
        <button
          type="button"
          onClick={addRound}
          className="flex-1 flex items-center justify-center gap-1.5 h-8 text-xs font-semibold bg-white/5 text-gray-300 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
        >
          <Plus size={14} /> Add Custom Round
        </button>
      </div>
    </div>
  )
}
