import React from 'react'
import { Wind, Heart, Sparkles, Clock, Brain } from 'lucide-react'

export type BreathworkExecutionDetails = {
  include_breathwork?: boolean
  protocol_type?: string
  duration?: number | '' // minutes
  max_retention_sec?: number | '' // breath hold seconds
  subjective_depth?: number | '' // 1-10 depth score
  hrv_change_ms?: number | '' // HRV delta or post HRV
}

type Props = {
  value: BreathworkExecutionDetails
  onChange: (val: BreathworkExecutionDetails) => void
}

const BREATHWORK_PROTOCOLS = [
  "Box Breathing (4-4-4-4)",
  "Cyclic Physiological Sighing",
  "4-7-8 Relaxing Breath",
  "Wim Hof / Tummo Method",
  "Anapanasati Breath Awareness",
  "Holotropic / Heavy Hyperventilation",
  "Nadi Shodhana (Alternate Nostril)",
  "Coherent Breathing (5.5s in / 5.5s out)"
]

export default function BreathworkExecutionLog({ value, onChange }: Props) {
  const includeBreathwork = value.include_breathwork ?? !!value.protocol_type

  const handleToggleBreathwork = (enabled: boolean) => {
    onChange({
      ...value,
      include_breathwork: enabled,
      protocol_type: enabled ? (value.protocol_type || BREATHWORK_PROTOCOLS[0]) : undefined,
      max_retention_sec: enabled ? value.max_retention_sec : undefined,
    })
  }

  return (
    <div className="flex flex-col gap-3 mt-3 p-3 bg-black/20 rounded-lg border border-white/5">
      <div className="flex items-center justify-between">
        <div className="text-[10px] text-levl-text-secondary uppercase tracking-wider font-bold">
          Mindfulness & Meditation Log
        </div>
        {value.duration !== undefined && value.duration !== '' && (
          <div className="text-[10px] text-levl-accent font-bold">
            {value.duration} min session
          </div>
        )}
      </div>

      {/* Mode Toggle: Meditation Only vs Included Breathwork */}
      <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/5">
        <div className="flex items-center gap-2">
          <Brain size={14} className="text-levl-purple" />
          <span className="text-xs text-gray-300 font-medium">Include Breathwork Protocol?</span>
        </div>
        <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/10">
          <button
            type="button"
            onClick={() => handleToggleBreathwork(false)}
            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md transition-colors ${
              !includeBreathwork ? 'bg-levl-purple text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            No
          </button>
          <button
            type="button"
            onClick={() => handleToggleBreathwork(true)}
            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md transition-colors ${
              includeBreathwork ? 'bg-cyan-500 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Yes
          </button>
        </div>
      </div>

      {/* Protocol Dropdown (Only when breathwork is enabled) */}
      {includeBreathwork && (
        <div className="animate-in fade-in slide-in-from-top-1">
          <label className="text-[9px] text-gray-500 uppercase font-semibold ml-1 block mb-1">
            Cadence / Breathwork Protocol
          </label>
          <select
            value={value.protocol_type || ''}
            onChange={(e) => onChange({ ...value, protocol_type: e.target.value })}
            className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-levl-accent"
          >
            <option value="">Select Breathwork Protocol...</option>
            {BREATHWORK_PROTOCOLS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="w-full h-px bg-white/10 my-1" />

      {/* Metrics Row */}
      <div className="flex flex-wrap items-center gap-2 w-full">
        <div className="flex-1 min-w-[80px]">
          <label className="text-[9px] text-gray-500 uppercase font-semibold ml-1 block mb-1 flex items-center gap-1">
            <Clock size={10} className="text-levl-accent" /> Time (min)
          </label>
          <input
            type="number"
            min="0"
            placeholder="10"
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

        {includeBreathwork && (
          <div className="flex-1 min-w-[90px] animate-in fade-in">
            <label className="text-[9px] text-gray-500 uppercase font-semibold ml-1 block mb-1 flex items-center gap-1">
              <Wind size={10} className="text-cyan-400" /> Hold (sec)
            </label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 60"
              value={value.max_retention_sec ?? ''}
              onChange={(e) =>
                onChange({
                  ...value,
                  max_retention_sec: e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0),
                })
              }
              className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-levl-accent"
            />
          </div>
        )}

        <div className="flex-1 min-w-[90px]">
          <label className="text-[9px] text-gray-500 uppercase font-semibold ml-1 block mb-1 flex items-center gap-1">
            <Sparkles size={10} className="text-yellow-400" /> Depth (1-10)
          </label>
          <input
            type="number"
            min="1"
            max="10"
            placeholder="8"
            value={value.subjective_depth ?? ''}
            onChange={(e) => {
              if (e.target.value === '') return onChange({ ...value, subjective_depth: '' })
              const num = parseInt(e.target.value, 10) || 1
              onChange({
                ...value,
                subjective_depth: Math.min(10, Math.max(1, num)),
              })
            }}
            className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-levl-accent"
          />
        </div>

        <div className="flex-1 min-w-[80px]">
          <label className="text-[9px] text-gray-500 uppercase font-semibold ml-1 block mb-1 flex items-center gap-1">
            <Heart size={10} className="text-red-400" /> HRV (ms)
          </label>
          <input
            type="number"
            min="0"
            placeholder="Post HRV"
            value={value.hrv_change_ms ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                hrv_change_ms: e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0),
              })
            }
            className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-levl-accent"
          />
        </div>
      </div>
    </div>
  )
}
