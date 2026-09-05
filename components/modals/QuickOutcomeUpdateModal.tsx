'use client'

import React, { useState, useEffect } from 'react'
import { OutcomeLiveState } from '@/lib/utils/outcomeRecency'
import { getOutcomeColorConfig } from '@/lib/utils/outcomeColors'
import { X, Check, ArrowUpRight, ArrowDownRight, Minus, Sparkles } from 'lucide-react'

export interface QuickOutcomeUpdateModalProps {
  isOpen: boolean
  onClose: () => void
  outcomeState: OutcomeLiveState | null
  onSave: (outcomeId: string, newValue: number) => Promise<void>
}

export const QuickOutcomeUpdateModal: React.FC<QuickOutcomeUpdateModalProps> = ({
  isOpen,
  onClose,
  outcomeState,
  onSave
}) => {
  const [value, setValue] = useState<number>(5)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (outcomeState?.currentValue != null) {
      setValue(outcomeState.currentValue)
    } else {
      setValue(5)
    }
  }, [outcomeState])

  if (!isOpen || !outcomeState) return null

  const colorCfg = getOutcomeColorConfig(value, outcomeState.directionality)
  const morningVal = outcomeState.morningBaseline
  const delta = morningVal != null ? value - morningVal : null

  const handleQuickBump = (newVal: number) => {
    const clamped = Math.max(0, Math.min(10, newVal))
    setValue(clamped)
  }

  const handleConfirm = async () => {
    setIsSaving(true)
    try {
      await onSave(outcomeState.outcomeId, value)
      onClose()
    } catch (err) {
      console.error('Error saving quick outcome snapshot:', err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm rounded-3xl bg-slate-950 border border-white/15 p-5 shadow-2xl space-y-4 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div 
          className="absolute -top-16 -right-16 w-36 h-36 rounded-full blur-2xl pointer-events-none opacity-40 transition-all duration-300"
          style={{ backgroundColor: colorCfg.accentHex }}
        />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-xl flex items-center justify-center border text-base shrink-0"
              style={{ 
                backgroundColor: `${colorCfg.accentHex}20`,
                borderColor: `${colorCfg.accentHex}40`
              }}
            >
              {outcomeState.icon || '⚡'}
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
                Quick Log Current State
              </span>
              <h3 className="text-sm font-extrabold text-white">
                {outcomeState.name}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Large Value Display with Delta */}
        <div 
          className="p-4 rounded-2xl border text-center space-y-1 transition-all duration-200"
          style={{
            backgroundColor: `${colorCfg.accentHex}15`,
            borderColor: `${colorCfg.accentHex}40`
          }}
        >
          <div className="flex items-center justify-center gap-2">
            <span className={`text-4xl font-black font-mono ${colorCfg.textColor}`}>
              {value}
            </span>
            <span className="text-slate-500 text-sm font-mono font-bold">/ 10</span>
          </div>

          <div className="flex items-center justify-center gap-1.5 pt-0.5">
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${colorCfg.badgeBg} ${colorCfg.textColor}`}>
              {colorCfg.qualityLabel}
            </span>
            {delta !== null && delta !== 0 && (
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border flex items-center gap-0.5 ${
                (outcomeState.directionality === 'higher_is_better' ? delta > 0 : delta < 0)
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
              }`}>
                {delta > 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                {delta > 0 ? `+${delta}` : delta} vs morning
              </span>
            )}
            {delta === 0 && morningVal != null && (
              <span className="text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                Same as morning ({morningVal})
              </span>
            )}
          </div>
        </div>

        {/* Slider */}
        <div className="space-y-2 pt-1">
          <input
            type="range"
            min="0"
            max="10"
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="w-full cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
            style={{ accentColor: colorCfg.accentHex }}
          />

          <div className="flex justify-between text-[9px] font-extrabold uppercase tracking-wider text-slate-400 px-0.5">
            <span>0 (Lowest)</span>
            <span>5 (Baseline)</span>
            <span>10 (Peak)</span>
          </div>
        </div>

        {/* Quick Bump Preset Chips */}
        <div className="flex items-center justify-between gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => handleQuickBump(value - 1)}
            disabled={value <= 0}
            className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 font-mono font-bold text-xs rounded-xl border border-white/10 transition-all cursor-pointer flex items-center justify-center gap-1"
          >
            <Minus size={11} /> 1
          </button>
          {morningVal != null && (
            <button
              type="button"
              onClick={() => setValue(morningVal)}
              className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono font-bold text-[10px] rounded-xl border border-white/10 transition-all cursor-pointer"
            >
              AM ({morningVal})
            </button>
          )}
          <button
            type="button"
            onClick={() => handleQuickBump(value + 1)}
            disabled={value >= 10}
            className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 font-mono font-bold text-xs rounded-xl border border-white/10 transition-all cursor-pointer flex items-center justify-center gap-1"
          >
            +1
          </button>
          <button
            type="button"
            onClick={() => setValue(outcomeState.directionality === 'higher_is_better' ? 10 : 0)}
            className="py-1.5 px-2.5 bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 font-bold text-[10px] rounded-xl border border-purple-500/30 transition-all cursor-pointer flex items-center gap-1"
          >
            <Sparkles size={10} /> {outcomeState.directionality === 'higher_is_better' ? '10' : '0'}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSaving}
            className="flex-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-1.5"
          >
            <Check size={14} strokeWidth={2.5} />
            <span>{isSaving ? 'Logging...' : `Log ${outcomeState.name} (${value})`}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default QuickOutcomeUpdateModal
