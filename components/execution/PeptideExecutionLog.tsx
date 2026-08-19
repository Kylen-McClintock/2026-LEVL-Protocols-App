import React, { useState, useMemo, useEffect } from 'react'
import { Syringe, RotateCcw, AlertTriangle, Sparkles, Check, CheckCircle2, ChevronDown, ChevronUp, Clock, Info, ShieldAlert, Activity, Calendar } from 'lucide-react'
import {
  InjectionSite,
  PeptideVialConfig,
  PeptideSideEffectLog,
  PeptideDoseLog,
  Modality
} from '@/lib/types'
import {
  calculateReconstitution,
  INJECTION_SITES,
  getRecommendedNextInjectionSite,
  getVialInventoryStatus,
  getSavedPeptideVialConfig,
  savePeptideVialConfig,
  getSavedInjectionSiteHistory,
  saveInjectionSiteLog,
  InjectionSiteMetadata
} from '@/lib/peptides/reconstitutionEngine'

import VisualSyringeDrawingGuide from '@/components/peptides/VisualSyringeDrawingGuide'
import FridgeVialInventoryCard from '@/components/peptides/FridgeVialInventoryCard'

export interface PeptideExecutionDetails {
  dose_amount_mcg?: number
  syringe_units_injected?: number
  injection_site?: InjectionSite
  vial_config?: PeptideVialConfig
  side_effects?: PeptideSideEffectLog[]
  sensation_notes?: string
  timing_context?: string
  doses_logged_count?: number
}

interface Props {
  value: PeptideExecutionDetails
  onChange: (val: PeptideExecutionDetails) => void
  modality?: Modality | null
  modalityKey: string
  defaultDoseMcg?: number
}

const COMMON_SYMPTOMS = [
  { id: 'none', label: 'No Adverse Effects (Smooth)', safe: true },
  { id: 'transient_flushing', label: 'Transient Flushing (5-10m)' },
  { id: 'site_redness', label: 'Minor Site Redness / Sting' },
  { id: 'mild_hunger', label: 'Appetite Increase' },
  { id: 'deep_drowsiness', label: 'Somnolence / Drowsiness' },
  { id: 'mild_headache', label: 'Mild Headache' }
]

export default function PeptideExecutionLog({
  value,
  onChange,
  modality,
  modalityKey,
  defaultDoseMcg = 250
}: Props) {
  const meta = modality?.peptide_metadata
  const targetDose = value.dose_amount_mcg || defaultDoseMcg || meta?.default_vial_config?.recommended_dose_mcg || 250

  // Local state for vial configuration
  const [vialConfig, setVialConfig] = useState<PeptideVialConfig>(() => {
    return value.vial_config || getSavedPeptideVialConfig(modalityKey, meta?.default_vial_config) || {
      vial_size_mg: 5,
      bac_water_ml: 2,
      syringe_type: 'u100_1ml',
      recommended_dose_mcg: targetDose,
      total_doses_per_vial: 20,
      remaining_doses: 20,
      expiration_days: 28,
      reconstitution_date: new Date().toISOString().split('T')[0]
    }
  })

  const [showVialEditor, setShowVialEditor] = useState(false)
  const [showFridgeInventory, setShowFridgeInventory] = useState(false)
  const [showSideEffects, setShowSideEffects] = useState(false)

  // Injection site history & recommendation
  const siteHistory = useMemo(() => getSavedInjectionSiteHistory(modalityKey), [modalityKey])
  const { recommendedSite, lastUsedSite } = useMemo(() => getRecommendedNextInjectionSite(siteHistory), [siteHistory])

  const selectedSite = value.injection_site || recommendedSite.id

  // Calculate live reconstitution math
  const reconCalc = useMemo(() => {
    return calculateReconstitution(
      vialConfig.vial_size_mg,
      vialConfig.bac_water_ml,
      targetDose,
      vialConfig.syringe_type || 'u100_1ml'
    )
  }, [vialConfig, targetDose])

  // Vial inventory status
  const inventory = useMemo(() => {
    return getVialInventoryStatus(vialConfig, value.doses_logged_count || 0)
  }, [vialConfig, value.doses_logged_count])

  // Sync calculations into parent state if changed
  useEffect(() => {
    if (
      value.dose_amount_mcg !== targetDose ||
      value.syringe_units_injected !== reconCalc.units_to_draw ||
      value.injection_site !== selectedSite
    ) {
      onChange({
        ...value,
        dose_amount_mcg: targetDose,
        syringe_units_injected: reconCalc.units_to_draw,
        injection_site: selectedSite,
        vial_config: vialConfig
      })
    }
  }, [targetDose, reconCalc.units_to_draw, selectedSite, vialConfig])

  const handleSelectSite = (siteId: InjectionSite) => {
    onChange({
      ...value,
      injection_site: siteId
    })
  }

  const handleSaveVialConfig = (updated: PeptideVialConfig) => {
    setVialConfig(updated)
    savePeptideVialConfig(modalityKey, updated)
    onChange({
      ...value,
      vial_config: updated
    })
    setShowVialEditor(false)
  }

  const handleToggleSymptom = (symptomLabel: string) => {
    const existing = value.side_effects || []
    if (symptomLabel.includes('No Adverse')) {
      onChange({ ...value, side_effects: [] })
      return
    }

    const isPresent = existing.some(s => s.symptom === symptomLabel)
    if (isPresent) {
      onChange({ ...value, side_effects: existing.filter(s => s.symptom !== symptomLabel) })
    } else {
      onChange({
        ...value,
        side_effects: [
          ...existing,
          {
            timestamp: new Date().toISOString(),
            symptom: symptomLabel,
            severity: 1
          }
        ]
      })
    }
  }

  return (
    <div className="flex flex-col gap-3.5 mt-3 p-3.5 bg-slate-950/80 rounded-2xl border border-cyan-500/20 backdrop-blur-md animate-in fade-in">
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400">
            <Syringe size={14} />
          </div>
          <div>
            <div className="text-[11px] font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>Peptide SubQ Administration &amp; Reconstitution</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                {reconCalc.syringe_type.toUpperCase().replace('_', '-')}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium">
              Auto-converted from vial concentration to precise syringe tick marks
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowFridgeInventory(!showFridgeInventory)}
            className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-400 hover:text-cyan-300 border border-white/10 text-[10px] font-bold transition-all cursor-pointer"
          >
            {showFridgeInventory ? 'Hide Fridge' : 'Fridge Stock'}
          </button>
          <button
            type="button"
            onClick={() => setShowVialEditor(!showVialEditor)}
            className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-400 hover:text-cyan-300 border border-white/10 text-[10px] font-bold transition-all cursor-pointer"
          >
            {showVialEditor ? 'Close Calc' : 'Edit Math'}
          </button>
        </div>
      </div>

      {/* 1. Interactive Visual Syringe Drawing Guide (Realistic Scale) */}
      <VisualSyringeDrawingGuide
        unitsToDraw={reconCalc.units_to_draw}
        targetDoseMcg={targetDose}
        vialSizeMg={vialConfig.vial_size_mg}
        bacWaterMl={vialConfig.bac_water_ml}
        concentrationMcgPerMl={reconCalc.concentration_mcg_per_ml}
      />

      {/* Fridge Vial Inventory & Stability (Collapsible) */}
      {showFridgeInventory && (
        <FridgeVialInventoryCard
          modalityKey={modalityKey}
          modalityName={modality?.name || 'Peptide Bioactive'}
          defaultVialConfig={vialConfig}
          currentDosesLogged={value.doses_logged_count || 0}
          onVialUpdated={(updated) => handleSaveVialConfig(updated)}
        />
      )}

      {/* Vial Reconstitution Settings Drawer (Collapsible) */}
      {showVialEditor && (
        <div className="p-3 bg-black/60 rounded-xl border border-cyan-500/20 space-y-3 animate-in fade-in">
          <div className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider">
            Reconstitution Parameters
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[9px] font-semibold text-slate-400 block mb-1">Vial Size (mg)</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={vialConfig.vial_size_mg}
                onChange={(e) => setVialConfig({ ...vialConfig, vial_size_mg: parseFloat(e.target.value) || 5 })}
                className="w-full h-8 bg-slate-900 border border-white/10 rounded-lg px-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-[9px] font-semibold text-slate-400 block mb-1">BAC Water (mL)</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={vialConfig.bac_water_ml}
                onChange={(e) => setVialConfig({ ...vialConfig, bac_water_ml: parseFloat(e.target.value) || 2 })}
                className="w-full h-8 bg-slate-900 border border-white/10 rounded-lg px-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-[9px] font-semibold text-slate-400 block mb-1">Target Dose (mcg)</label>
              <input
                type="number"
                step="25"
                min="25"
                value={targetDose}
                onChange={(e) => onChange({ ...value, dose_amount_mcg: parseInt(e.target.value) || 250 })}
                className="w-full h-8 bg-slate-900 border border-white/10 rounded-lg px-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1 border-t border-white/5">
            <button
              type="button"
              onClick={() => handleSaveVialConfig(vialConfig)}
              className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black rounded-lg cursor-pointer transition-all"
            >
              Save as Default
            </button>
          </div>
        </div>
      )}

      {/* 2. Injection Site Rotation Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase text-slate-300 tracking-wider">
            <RotateCcw size={12} className="text-cyan-400" />
            <span>Injection Site Rotation</span>
          </div>
          {lastUsedSite && (
            <span className="text-[9px] text-slate-400">
              Last used: <span className="text-slate-300 font-semibold">{lastUsedSite.shortLabel}</span>
            </span>
          )}
        </div>

        {/* Anatomical Site Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {INJECTION_SITES.map((site) => {
            const isSelected = selectedSite === site.id
            const isRecommended = recommendedSite.id === site.id
            const isLastUsed = lastUsedSite?.id === site.id

            return (
              <button
                key={site.id}
                type="button"
                onClick={() => handleSelectSite(site.id)}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-cyan-500/20 border-cyan-500 text-white font-bold shadow-sm shadow-cyan-500/20 ring-1 ring-cyan-500/50'
                    : isRecommended
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40'
                    : isLastUsed
                    ? 'bg-white/5 border-amber-500/30 text-slate-400 hover:bg-white/10'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="block font-bold text-[11px] leading-tight truncate">
                    {site.shortLabel}
                  </span>
                  {isRecommended && (
                    <span className="text-[8px] px-1 rounded bg-emerald-500/30 text-emerald-300 font-black uppercase">
                      Next
                    </span>
                  )}
                  {isLastUsed && !isRecommended && (
                    <span className="text-[8px] px-1 rounded bg-amber-500/20 text-amber-300 font-bold uppercase">
                      Prev
                    </span>
                  )}
                </div>
                <span className="block text-[9px] text-slate-500 truncate mt-0.5 leading-tight">
                  {site.region}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. Acute Sensation & Side Effects Logger */}
      <div className="pt-1 border-t border-white/5 space-y-2">
        <button
          type="button"
          onClick={() => setShowSideEffects(!showSideEffects)}
          className="w-full py-1.5 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-between text-[11px] font-bold transition-all cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <ShieldAlert size={13} className="text-amber-400" />
            <span>Symptom &amp; Side Effect Tracker</span>
            {(value.side_effects?.length || 0) > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[9px]">
                {value.side_effects?.length} Recorded
              </span>
            )}
          </span>
          {showSideEffects ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showSideEffects && (
          <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 space-y-2 animate-in fade-in">
            <span className="text-[9px] text-slate-400 uppercase font-semibold block">
              Tap any sensations experienced around dose timing:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_SYMPTOMS.map((sym) => {
                const isSelected = sym.id === 'none'
                  ? (!value.side_effects || value.side_effects.length === 0)
                  : value.side_effects?.some(s => s.symptom === sym.label)

                return (
                  <button
                    key={sym.id}
                    type="button"
                    onClick={() => handleToggleSymptom(sym.label)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] border font-bold transition-all cursor-pointer ${
                      isSelected
                        ? sym.safe
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {sym.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
