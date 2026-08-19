'use client'

import React, { useState, useMemo } from 'react'
import {
  TrendingUp,
  Sparkles,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  ChevronRight,
  AlertCircle
} from 'lucide-react'
import { format, addWeeks, differenceInDays } from 'date-fns'

export interface TitrationStep {
  phaseNumber: number
  phaseLabel: string
  doseAmount: number
  doseUnit: string
  durationWeeks: number
  startDate?: string
  endDate?: string
  isCompleted?: boolean
  isCurrent?: boolean
}

export interface TitrationSchedule {
  protocolName: string
  modalityKey: string
  startDate: string
  steps: TitrationStep[]
}

const POPULAR_TITRATION_PRESETS: {
  id: string
  name: string
  category: string
  modalityMatch: string[]
  steps: { phaseLabel: string; doseAmount: number; doseUnit: string; durationWeeks: number }[]
}[] = [
  {
    id: 'tirzepatide_standard',
    name: 'Tirzepatide Standard GLP-1/GIP 4-Week Ramp',
    category: 'Metabolic & Glycemic Control',
    modalityMatch: ['tirzepatide', 'mounjaro', 'zepbound'],
    steps: [
      { phaseLabel: 'Starter Dose (Acclimation)', doseAmount: 2.5, doseUnit: 'mg', durationWeeks: 4 },
      { phaseLabel: 'Step 2 (Primary Lipolytic)', doseAmount: 5.0, doseUnit: 'mg', durationWeeks: 4 },
      { phaseLabel: 'Step 3 (Escalation)', doseAmount: 7.5, doseUnit: 'mg', durationWeeks: 4 },
      { phaseLabel: 'Maintenance Target', doseAmount: 10.0, doseUnit: 'mg', durationWeeks: 12 }
    ]
  },
  {
    id: 'semaglutide_standard',
    name: 'Semaglutide GLP-1 4-Week Titration Ramp',
    category: 'Metabolic & Appetite Control',
    modalityMatch: ['semaglutide', 'ozempic', 'wegovy'],
    steps: [
      { phaseLabel: 'Phase 1: Initiation', doseAmount: 0.25, doseUnit: 'mg', durationWeeks: 4 },
      { phaseLabel: 'Phase 2: Dose Step-Up', doseAmount: 0.5, doseUnit: 'mg', durationWeeks: 4 },
      { phaseLabel: 'Phase 3: Active Therapeutic', doseAmount: 1.0, doseUnit: 'mg', durationWeeks: 4 },
      { phaseLabel: 'Phase 4: Target Maintenance', doseAmount: 1.7, doseUnit: 'mg', durationWeeks: 12 }
    ]
  },
  {
    id: 'cjc_ipam_ramp',
    name: 'CJC-1295 + Ipamorelin Somatotropic Ramp',
    category: 'GH Secretagogue & Recovery',
    modalityMatch: ['cjc', 'ipamorelin', 'sermorelin', 'growth_hormone'],
    steps: [
      { phaseLabel: 'Week 1–2: Receptor Baseline', doseAmount: 100, doseUnit: 'mcg', durationWeeks: 2 },
      { phaseLabel: 'Week 3–6: Full Somatotropic Pulse', doseAmount: 200, doseUnit: 'mcg', durationWeeks: 4 },
      { phaseLabel: 'Week 7–8: Peak Regenerative Wave', doseAmount: 250, doseUnit: 'mcg', durationWeeks: 2 }
    ]
  },
  {
    id: 'ghk_cu_ramp',
    name: 'GHK-Cu Collagen Synthesis Micro-Ramp',
    category: 'Skin & Connective Tissue',
    modalityMatch: ['ghk', 'copper', 'dermal'],
    steps: [
      { phaseLabel: 'Week 1: Dermal Tolerance', doseAmount: 1.0, doseUnit: 'mg', durationWeeks: 1 },
      { phaseLabel: 'Week 2–4: Full Matrix Synthesis', doseAmount: 2.0, doseUnit: 'mg', durationWeeks: 3 }
    ]
  }
]

interface Props {
  modalityKey: string
  modalityName?: string
  currentDoseAmount?: number
  doseUnit?: string
  cycleStartDate?: string
  onApplyDose?: (newDose: number, unit: string) => void
  className?: string
}

export default function PeptideTitrationPlanner({
  modalityKey,
  modalityName = 'Bioactive Protocol',
  currentDoseAmount = 250,
  doseUnit = 'mcg',
  cycleStartDate = new Date().toISOString().split('T')[0],
  onApplyDose,
  className = ''
}: Props) {
  // Check for auto-matched preset
  const matchedPreset = useMemo(() => {
    const keyLower = modalityKey.toLowerCase()
    return POPULAR_TITRATION_PRESETS.find(p => p.modalityMatch.some(m => keyLower.includes(m))) || null
  }, [modalityKey])

  const [steps, setSteps] = useState<TitrationStep[]>(() => {
    if (matchedPreset) {
      return matchedPreset.steps.map((s, idx) => ({
        phaseNumber: idx + 1,
        phaseLabel: s.phaseLabel,
        doseAmount: s.doseAmount,
        doseUnit: s.doseUnit,
        durationWeeks: s.durationWeeks
      }))
    }
    return [
      { phaseNumber: 1, phaseLabel: 'Initial Phase (Acclimation)', doseAmount: currentDoseAmount, doseUnit, durationWeeks: 4 },
      { phaseNumber: 2, phaseLabel: 'Step 2 (Active Target)', doseAmount: currentDoseAmount * 2, doseUnit, durationWeeks: 4 }
    ]
  })

  const [startDateStr, setStartDateStr] = useState(cycleStartDate)

  // Compute dated timeline
  const computedSteps = useMemo(() => {
    const start = new Date(startDateStr + 'T00:00:00')
    const today = new Date()
    let accumWeeks = 0

    return steps.map((step, idx) => {
      const stepStart = addWeeks(start, accumWeeks)
      accumWeeks += step.durationWeeks
      const stepEnd = addWeeks(start, accumWeeks)

      const isCompleted = today >= stepEnd
      const isCurrent = today >= stepStart && today < stepEnd

      return {
        ...step,
        startDate: format(stepStart, 'MMM d, yyyy'),
        endDate: format(stepEnd, 'MMM d, yyyy'),
        isCompleted,
        isCurrent: isCurrent || (idx === 0 && today < stepStart)
      }
    })
  }, [steps, startDateStr])

  const currentActiveStep = computedSteps.find(s => s.isCurrent) || computedSteps[0]

  const handleApplyPreset = (preset: typeof POPULAR_TITRATION_PRESETS[0]) => {
    setSteps(
      preset.steps.map((s, idx) => ({
        phaseNumber: idx + 1,
        phaseLabel: s.phaseLabel,
        doseAmount: s.doseAmount,
        doseUnit: s.doseUnit,
        durationWeeks: s.durationWeeks
      }))
    )
  }

  const handleAddStep = () => {
    const lastStep = steps[steps.length - 1]
    const nextNum = steps.length + 1
    const nextDose = lastStep ? Number((lastStep.doseAmount * 1.5).toFixed(1)) : currentDoseAmount
    setSteps([
      ...steps,
      {
        phaseNumber: nextNum,
        phaseLabel: `Phase ${nextNum}`,
        doseAmount: nextDose,
        doseUnit: lastStep?.doseUnit || doseUnit,
        durationWeeks: 4
      }
    ])
  }

  const handleRemoveStep = (idx: number) => {
    if (steps.length <= 1) return
    setSteps(steps.filter((_, i) => i !== idx))
  }

  const handleUpdateStep = (idx: number, field: keyof TitrationStep, val: any) => {
    setSteps(
      steps.map((s, i) => (i === idx ? { ...s, [field]: val } : s))
    )
  }

  return (
    <div className={`p-4 rounded-2xl bg-slate-950/90 border border-cyan-500/20 backdrop-blur-md space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            <TrendingUp size={14} />
          </div>
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider">
              Longitudinal Dose Titration &amp; Step-Up Planner
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">
              Auto-escalates scheduled doses across progressive cycle weeks
            </span>
          </div>
        </div>

        {currentActiveStep && onApplyDose && (
          <button
            type="button"
            onClick={() => onApplyDose(currentActiveStep.doseAmount, currentActiveStep.doseUnit)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-cyan-900/30"
          >
            <Check size={13} strokeWidth={3} />
            <span>Apply Current Phase ({currentActiveStep.doseAmount} {currentActiveStep.doseUnit})</span>
          </button>
        )}
      </div>

      {/* Preset Quick Selectors */}
      <div className="space-y-1.5">
        <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">
          One-Click Titration Presets:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {POPULAR_TITRATION_PRESETS.map(preset => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className={`p-2 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                matchedPreset?.id === preset.id
                  ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-200 ring-1 ring-cyan-500/40'
                  : 'bg-black/40 border-white/5 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-[11px] truncate">{preset.name}</span>
                {matchedPreset?.id === preset.id && (
                  <span className="text-[8px] px-1.5 py-0.2 rounded bg-cyan-500/30 text-cyan-300 font-black uppercase">
                    Matched
                  </span>
                )}
              </div>
              <span className="text-[9.5px] text-slate-400 block truncate mt-0.5">
                {preset.steps.map(s => `${s.doseAmount}${s.doseUnit}`).join(' → ')}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Visual Staircase Step-Ramp Progress Display */}
      <div className="space-y-2 pt-2 border-t border-white/5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Clock size={12} className="text-cyan-400" />
            <span>Current Step-Up Progression</span>
          </span>
          <span className="font-mono text-cyan-400 font-bold">
            Active: {currentActiveStep.phaseLabel} ({currentActiveStep.doseAmount} {currentActiveStep.doseUnit})
          </span>
        </div>

        {/* Step Progression Timeline */}
        <div className="space-y-2">
          {computedSteps.map((step, idx) => (
            <div
              key={step.phaseNumber}
              className={`p-3 rounded-xl border transition-all ${
                step.isCurrent
                  ? 'bg-cyan-950/50 border-cyan-500 text-white shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/50'
                  : step.isCompleted
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200 opacity-80'
                  : 'bg-black/30 border-white/5 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      step.isCurrent
                        ? 'bg-cyan-500 text-black'
                        : step.isCompleted
                        ? 'bg-emerald-500 text-black'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {step.isCompleted ? <Check size={13} strokeWidth={3} /> : step.phaseNumber}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black">{step.phaseLabel}</span>
                      {step.isCurrent && (
                        <span className="text-[9px] px-2 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-black tracking-widest uppercase border border-cyan-500/40 animate-pulse">
                          ACTIVE TODAY
                        </span>
                      )}
                      {step.isCompleted && (
                        <span className="text-[9px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-bold uppercase">
                          Completed
                        </span>
                      )}
                    </div>
                    <span className="text-[9.5px] text-slate-400 font-mono">
                      {step.startDate} – {step.endDate} ({step.durationWeeks} Weeks)
                    </span>
                  </div>
                </div>

                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-black font-mono text-cyan-400">
                    {step.doseAmount}
                  </span>
                  <span className="text-xs font-bold font-mono text-slate-300">
                    {step.doseUnit}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Manual Step Editor Drawer (Collapsible) */}
      <div className="pt-2 border-t border-white/5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
            Edit Custom Ramp Steps:
          </span>
          <button
            type="button"
            onClick={handleAddStep}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-400 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer border border-white/10"
          >
            <Plus size={11} />
            <span>Add Step</span>
          </button>
        </div>

        <div className="space-y-1.5">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2 bg-black/40 rounded-xl border border-white/5 text-xs">
              <span className="text-[10px] font-mono text-slate-400 font-bold shrink-0">
                P{idx + 1}
              </span>
              <input
                type="text"
                value={step.phaseLabel}
                onChange={(e) => handleUpdateStep(idx, 'phaseLabel', e.target.value)}
                className="flex-1 h-7 bg-slate-900 border border-white/10 rounded-lg px-2 text-[11px] text-white focus:outline-none focus:border-cyan-500"
                placeholder="Phase Name"
              />
              <div className="flex items-center gap-1 shrink-0 w-24">
                <input
                  type="number"
                  step="0.1"
                  value={step.doseAmount}
                  onChange={(e) => handleUpdateStep(idx, 'doseAmount', parseFloat(e.target.value) || 0)}
                  className="w-14 h-7 bg-slate-900 border border-white/10 rounded-lg px-1.5 text-center text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                />
                <span className="text-[10px] font-mono text-slate-400">{step.doseUnit}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0 w-20">
                <input
                  type="number"
                  min="1"
                  value={step.durationWeeks}
                  onChange={(e) => handleUpdateStep(idx, 'durationWeeks', parseInt(e.target.value) || 1)}
                  className="w-10 h-7 bg-slate-900 border border-white/10 rounded-lg px-1.5 text-center text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                />
                <span className="text-[10px] font-mono text-slate-400">Wks</span>
              </div>
              {steps.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveStep(idx)}
                  className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
