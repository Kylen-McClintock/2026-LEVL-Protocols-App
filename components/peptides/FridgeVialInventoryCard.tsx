'use client'

import React, { useState, useMemo } from 'react'
import {
  PeptideVialConfig,
  Modality
} from '@/lib/types'
import {
  getVialInventoryStatus,
  calculateReconstitution,
  savePeptideVialConfig,
  getSavedPeptideVialConfig
} from '@/lib/peptides/reconstitutionEngine'
import {
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Plus,
  Check,
  ThermometerSnowflake,
  Clock,
  Archive,
  ChevronDown,
  ChevronUp,
  Edit2
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'

interface Props {
  modalityKey: string
  modalityName?: string
  defaultVialConfig?: PeptideVialConfig
  currentDosesLogged?: number
  onVialUpdated?: (config: PeptideVialConfig) => void
  className?: string
}

export default function FridgeVialInventoryCard({
  modalityKey,
  modalityName = 'Peptide Bioactive',
  defaultVialConfig,
  currentDosesLogged = 0,
  onVialUpdated,
  className = ''
}: Props) {
  const [config, setConfig] = useState<PeptideVialConfig>(() => {
    return getSavedPeptideVialConfig(modalityKey, defaultVialConfig) || {
      vial_size_mg: 5,
      bac_water_ml: 2,
      syringe_type: 'u100_1ml',
      recommended_dose_mcg: 250,
      total_doses_per_vial: 20,
      remaining_doses: 20,
      expiration_days: 28,
      reconstitution_date: new Date().toISOString().split('T')[0]
    }
  })

  const [showReconModal, setShowReconModal] = useState(false)
  const [newVialMg, setNewVialMg] = useState(String(config.vial_size_mg))
  const [newBacMl, setNewBacMl] = useState(String(config.bac_water_ml))
  const [newDoseMcg, setNewDoseMcg] = useState(String(config.recommended_dose_mcg || 250))
  const [newReconDate, setNewReconDate] = useState(config.reconstitution_date || new Date().toISOString().split('T')[0])

  const inventory = useMemo(() => {
    return getVialInventoryStatus(config, currentDosesLogged)
  }, [config, currentDosesLogged])

  const handleSaveNewRecon = (e: React.FormEvent) => {
    e.preventDefault()
    const vialMg = parseFloat(newVialMg) || 5
    const bacMl = parseFloat(newBacMl) || 2
    const doseMcg = parseInt(newDoseMcg) || 250
    const calc = calculateReconstitution(vialMg, bacMl, doseMcg)

    const updated: PeptideVialConfig = {
      vial_size_mg: vialMg,
      bac_water_ml: bacMl,
      syringe_type: 'u100_1ml',
      recommended_dose_mcg: doseMcg,
      total_doses_per_vial: calc.total_doses_in_vial,
      remaining_doses: calc.total_doses_in_vial,
      expiration_days: 28,
      reconstitution_date: newReconDate
    }

    setConfig(updated)
    savePeptideVialConfig(modalityKey, updated)
    if (onVialUpdated) onVialUpdated(updated)
    setShowReconModal(false)
  }

  const handleArchiveVial = () => {
    const updated: PeptideVialConfig = {
      ...config,
      remaining_doses: 0
    }
    setConfig(updated)
    savePeptideVialConfig(modalityKey, updated)
    if (onVialUpdated) onVialUpdated(updated)
  }

  return (
    <div className={`p-4 rounded-2xl bg-slate-950/90 border border-cyan-500/20 backdrop-blur-md space-y-3.5 ${className}`}>
      {/* Header with Title & Storage Temp Badge */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            <ThermometerSnowflake size={14} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                Fridge Vial Inventory &amp; Stability
              </h4>
              <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30 uppercase">
                2°C–8°C
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {modalityName} • Active Reconstituted Vial Stock
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowReconModal(true)}
          className="px-2.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-cyan-900/30"
        >
          <Plus size={13} strokeWidth={3} />
          <span>New Reconstitution</span>
        </button>
      </div>

      {/* Main Vial Cylinder & Metrics Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-xl bg-black/40 border border-white/5 items-center">
        {/* Visual 3D/2D Vial Graphic */}
        <div className="flex items-center gap-3">
          {/* Glass Vial Cylinder */}
          <div className="relative w-10 h-20 bg-slate-900 border-2 border-slate-700 rounded-b-xl rounded-t-sm overflow-hidden flex flex-col justify-end p-0.5 shadow-inner">
            {/* Rubber Stopper & Crimped Aluminum Cap */}
            <div className="absolute top-0 inset-x-0 h-2.5 bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 border-b border-black/60 flex items-center justify-center">
              <div className="w-4 h-1 bg-amber-500 rounded-full" />
            </div>

            {/* Liquid Fill Level Shader */}
            <div
              className={`w-full rounded-b-lg transition-all duration-700 relative ${
                inventory.statusColor === 'red'
                  ? 'bg-gradient-to-t from-red-600/80 to-red-400/80 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                  : inventory.statusColor === 'amber'
                  ? 'bg-gradient-to-t from-amber-600/80 to-amber-400/80 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                  : 'bg-gradient-to-t from-cyan-600/80 via-cyan-500/90 to-emerald-400/90 shadow-[0_0_12px_rgba(6,182,212,0.6)]'
              }`}
              style={{ height: `${Math.max(8, Math.min(85, inventory.percentRemaining))}%` }}
            >
              {/* Meniscus Line */}
              <div className="w-full h-1 bg-white/60 absolute top-0 inset-x-0 rounded-full" />
            </div>
          </div>

          <div>
            <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block">
              Volume Remaining:
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-white font-mono">
                {inventory.remainingVolumeMl}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                / {config.bac_water_ml} mL
              </span>
            </div>
            <span className="text-[10px] font-bold text-cyan-400 font-mono">
              {inventory.percentRemaining}% Full
            </span>
          </div>
        </div>

        {/* Doses Left Callout */}
        <div className="space-y-0.5 border-y md:border-y-0 md:border-x border-white/5 py-2 md:py-0 md:px-3">
          <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block">
            Doses Available:
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-cyan-400 font-mono">
              {inventory.remainingDoses}
            </span>
            <span className="text-xs text-slate-400 font-bold">
              / {inventory.totalDoses} Doses Left
            </span>
          </div>
          <span className="text-[10px] text-slate-300 font-mono block">
            @{config.recommended_dose_mcg || 250} mcg per injection
          </span>
        </div>

        {/* Stability Degradation Countdown */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[9.5px]">
            <span className="text-slate-400 font-bold uppercase">
              BAC Water Stability:
            </span>
            <span
              className={`font-mono font-black ${
                inventory.statusColor === 'red'
                  ? 'text-red-400'
                  : inventory.statusColor === 'amber'
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {inventory.daysUntilExpired !== null ? `${inventory.daysUntilExpired} Days Left` : 'Active'}
            </span>
          </div>

          {/* Degradation Track Bar */}
          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-white/10">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                inventory.statusColor === 'red'
                  ? 'bg-red-500'
                  : inventory.statusColor === 'amber'
                  ? 'bg-amber-500'
                  : 'bg-gradient-to-r from-cyan-500 to-emerald-400'
              }`}
              style={{
                width: `${Math.max(
                  5,
                  Math.min(
                    100,
                    inventory.daysUntilExpired !== null
                      ? ((config.expiration_days || 28) - (inventory.daysSinceReconstituted || 0)) /
                          (config.expiration_days || 28) *
                          100
                      : 100
                  )
                )}%`
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
            <span>Mixed: {config.reconstitution_date || 'Recent'}</span>
            <span>Max 28-day sterile limit</span>
          </div>
        </div>
      </div>

      {/* Modal / Drawer for Logging New Reconstitution */}
      {showReconModal && (
        <div className="p-3.5 bg-black/80 rounded-xl border border-cyan-500/40 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h5 className="text-xs font-black text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <Plus size={13} />
              <span>Log New Vial Reconstitution</span>
            </h5>
            <button
              type="button"
              onClick={() => setShowReconModal(false)}
              className="text-slate-400 hover:text-white text-xs font-bold"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSaveNewRecon} className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="text-[9px] font-bold text-slate-400 block mb-1">Vial Size (mg)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={newVialMg}
                  onChange={(e) => setNewVialMg(e.target.value)}
                  className="w-full h-8 bg-slate-900 border border-white/10 rounded-lg px-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  placeholder="5"
                  required
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 block mb-1">BAC Water (mL)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={newBacMl}
                  onChange={(e) => setNewBacMl(e.target.value)}
                  className="w-full h-8 bg-slate-900 border border-white/10 rounded-lg px-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  placeholder="2"
                  required
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 block mb-1">Target Dose (mcg)</label>
                <input
                  type="number"
                  step="25"
                  min="25"
                  value={newDoseMcg}
                  onChange={(e) => setNewDoseMcg(e.target.value)}
                  className="w-full h-8 bg-slate-900 border border-white/10 rounded-lg px-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  placeholder="250"
                  required
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 block mb-1">Date Mixed</label>
                <input
                  type="date"
                  value={newReconDate}
                  onChange={(e) => setNewReconDate(e.target.value)}
                  className="w-full h-8 bg-slate-900 border border-white/10 rounded-lg px-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500 [color-scheme:dark]"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <span className="text-[10px] text-slate-400 font-mono">
                Will calculate ~{Math.floor(((parseFloat(newVialMg) || 5) * 1000) / (parseInt(newDoseMcg) || 250))} Doses
              </span>

              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs cursor-pointer shadow-md"
              >
                Save &amp; Start Fresh Vial
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
