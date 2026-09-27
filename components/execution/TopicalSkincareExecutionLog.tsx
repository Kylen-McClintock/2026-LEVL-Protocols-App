import React from 'react'
import { Sparkles, Check, Droplets, ShieldCheck, AlertCircle } from 'lucide-react'
import { Modality } from '@/lib/types'

export interface TopicalSkincareExecutionDetails {
  custom_dose?: string
  application_areas?: string[]
  absorbed?: boolean
  skin_preparation?: string
  sensation?: 'smooth' | 'mild_tingling' | 'redness' | string
  stack_notes?: string
}

interface Props {
  value: TopicalSkincareExecutionDetails
  onChange: (val: TopicalSkincareExecutionDetails) => void
  modality?: Modality | null
}

const DEFAULT_AREAS = [
  { id: 'face', label: 'Face' },
  { id: 'neck', label: 'Neck' },
  { id: 'chest', label: 'Chest / Décolleté' },
  { id: 'hands', label: 'Hands' }
]

const SENSATION_OPTIONS = [
  { id: 'smooth', label: '✓ Smooth (Zero Irritation)' },
  { id: 'mild_tingling', label: 'Transient Tingling / Micro-Sting' },
  { id: 'redness', label: '⚠️ Erythema / Site Sensitivity' }
]

export default function TopicalSkincareExecutionLog({
  value,
  onChange,
  modality
}: Props) {
  const currentAreas = value.application_areas || ['face', 'neck']
  const currentSensation = value.sensation || 'smooth'
  const suggestedDose = modality?.dose_or_exposure || '3–4 drops'

  const toggleArea = (areaId: string) => {
    let next: string[]
    if (currentAreas.includes(areaId)) {
      next = currentAreas.filter(a => a !== areaId)
    } else {
      next = [...currentAreas, areaId]
    }
    onChange({
      ...value,
      application_areas: next
    })
  }

  const setSensation = (sensationId: string) => {
    onChange({
      ...value,
      sensation: sensationId
    })
  }

  return (
    <div className="flex flex-col gap-3 mt-3 p-4 bg-gradient-to-r from-purple-950/20 via-slate-900/40 to-slate-950/40 rounded-2xl border border-purple-500/20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplets size={14} className="text-purple-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">
            Dermal Administration & Target Areas
          </span>
        </div>
        <span className="text-[11px] font-mono font-bold text-purple-200/90 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">
          {suggestedDose}
        </span>
      </div>

      {/* Application Target Areas */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-slate-300">
          Target Application Zones
        </label>
        <div className="flex flex-wrap gap-1.5">
          {DEFAULT_AREAS.map(area => {
            const isSelected = currentAreas.includes(area.id)
            return (
              <button
                key={area.id}
                type="button"
                onClick={() => toggleArea(area.id)}
                className={`px-3 py-1 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-purple-600/30 border-purple-400 text-purple-100 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {isSelected && <Check size={12} className="text-purple-300" />}
                <span>{area.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Protocol Clinical Notes & Timing Pre-Flight */}
      {modality?.timing_summary && (
        <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-start gap-2 text-xs text-purple-200/90">
          <Sparkles size={14} className="text-purple-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-purple-100">Optimal Timing & Synergy: </span>
            {modality.timing_summary}
          </div>
        </div>
      )}

      {/* Dermal Tolerance / Sensation */}
      <div className="space-y-1.5 pt-1">
        <label className="text-[11px] font-semibold text-slate-300">
          Dermal Tolerance
        </label>
        <div className="flex flex-wrap gap-1.5">
          {SENSATION_OPTIONS.map(opt => {
            const isSelected = currentSensation === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSensation(opt.id)}
                className={`px-2.5 py-1 rounded-xl text-[11px] border transition-all cursor-pointer ${
                  isSelected
                    ? opt.id === 'redness'
                      ? 'bg-rose-500/20 border-rose-400 text-rose-200 font-semibold'
                      : opt.id === 'mild_tingling'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-semibold'
                      : 'bg-emerald-500/20 border-emerald-400 text-emerald-200 font-semibold'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
