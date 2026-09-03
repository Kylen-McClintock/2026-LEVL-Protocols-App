'use client'

import React, { useState, useEffect } from 'react'
import { ShieldAlert, Pill, HeartPulse, Plus, X, Check, Sparkles, AlertTriangle, ShieldCheck, Info } from 'lucide-react'
import { UserProfile, DailyProtocolTask } from '@/lib/types'
import { updateUserProfile } from '@/lib/data'
import { parseMedicalProfile, auditScheduleSafety } from '@/lib/safety/contraindicationEngine'

interface MedicalHistoryPrescriptionsCardProps {
  profile: UserProfile | null
  localUserId: string
  tasks?: DailyProtocolTask[]
  onProfileUpdated?: (updated: UserProfile) => void
}

const COMMON_PRESCRIPTION_PRESETS = [
  'Blood Thinners / Anticoagulants (Warfarin, Eliquis)',
  'Statins (Lipid Lowering)',
  'Blood Pressure / Antihypertensives',
  'SSRIs / SNRIs / Antidepressants',
  'Thyroid (Levothyroxine)',
  'Metformin / GLP-1 (Hypoglycemics)',
  'MAO Inhibitors (MAOIs)',
  'Immunosuppressants / Steroids'
]

const COMMON_CONDITION_PRESETS = [
  'Hypertension (High Blood Pressure)',
  'Cardiac Arrhythmia / AFib',
  'Chronic Kidney Disease',
  'Liver Disease / Hepatic Impairment',
  'Active Cancer / Neoplasia History',
  'Autoimmune Conditions',
  'G6PD Deficiency',
  'Bleeding Disorders',
  'Histamine Intolerance',
  'Pregnancy / Nursing'
]

export default function MedicalHistoryPrescriptionsCard({
  profile,
  localUserId,
  tasks = [],
  onProfileUpdated
}: MedicalHistoryPrescriptionsCardProps) {
  const initial = parseMedicalProfile(profile)

  const [medications, setMedications] = useState<string[]>(initial.medications)
  const [conditions, setConditions] = useState<string[]>(initial.conditions)
  const [customMedInput, setCustomMedInput] = useState('')
  const [customCondInput, setCustomCondInput] = useState('')
  const [clinicalNotes, setClinicalNotes] = useState(initial.notes || '')
  
  const [isSaving, setIsSaving] = useState(false)
  const [saveToast, setSaveToast] = useState(false)

  // Re-sync if profile changes externally
  useEffect(() => {
    if (profile) {
      const parsed = parseMedicalProfile(profile)
      setMedications(parsed.medications)
      setConditions(parsed.conditions)
      setClinicalNotes(parsed.notes || '')
    }
  }, [profile])

  const handleToggleMedPreset = (preset: string) => {
    setMedications(prev => {
      const exists = prev.some(m => m.toLowerCase() === preset.toLowerCase() || preset.toLowerCase().includes(m.toLowerCase()))
      if (exists) {
        return prev.filter(m => m.toLowerCase() !== preset.toLowerCase() && !preset.toLowerCase().includes(m.toLowerCase()))
      }
      return [...prev, preset]
    })
  }

  const handleAddCustomMed = () => {
    const trimmed = customMedInput.trim()
    if (!trimmed) return
    if (!medications.some(m => m.toLowerCase() === trimmed.toLowerCase())) {
      setMedications(prev => [...prev, trimmed])
    }
    setCustomMedInput('')
  }

  const handleRemoveMed = (medToRemove: string) => {
    setMedications(prev => prev.filter(m => m !== medToRemove))
  }

  const handleToggleCondPreset = (preset: string) => {
    setConditions(prev => {
      const exists = prev.some(c => c.toLowerCase() === preset.toLowerCase() || preset.toLowerCase().includes(c.toLowerCase()))
      if (exists) {
        return prev.filter(c => c.toLowerCase() !== preset.toLowerCase() && !preset.toLowerCase().includes(c.toLowerCase()))
      }
      return [...prev, preset]
    })
  }

  const handleAddCustomCond = () => {
    const trimmed = customCondInput.trim()
    if (!trimmed) return
    if (!conditions.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      setConditions(prev => [...prev, trimmed])
    }
    setCustomCondInput('')
  }

  const handleRemoveCond = (condToRemove: string) => {
    setConditions(prev => prev.filter(c => c !== condToRemove))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const medsSerialized = JSON.stringify(medications)
      const condsSerialized = JSON.stringify(conditions)

      const updated = await updateUserProfile(localUserId, {
        medications_and_treatments_text: medsSerialized,
        health_conditions_text: condsSerialized
      })

      if (updated && onProfileUpdated) {
        onProfileUpdated(updated)
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('levl_profile_updated', { detail: updated }))
      }

      setSaveToast(true)
      setTimeout(() => setSaveToast(false), 3000)
    } catch (err) {
      console.error('Error saving health profile:', err)
    } finally {
      setIsSaving(false)
    }
  }

  // Active schedule safety audit preview
  const previewProfile: UserProfile = {
    ...(profile || {} as any),
    medications_and_treatments_text: JSON.stringify(medications),
    health_conditions_text: JSON.stringify(conditions)
  }
  const activeWarnings = auditScheduleSafety(tasks, previewProfile)

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-md shadow-xl space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)] shrink-0">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Medical History &amp; Prescriptions</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Safety Screening
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Screen your daily protocol modalities for clinical contraindications, drug-supplement antagonism, and physiological precautions.
            </p>
          </div>
        </div>

        {/* Live Safety Audit Status Badge */}
        <div className="flex items-center gap-2">
          {activeWarnings.length === 0 ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-semibold shadow-sm">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Stack Safe: 0 Conflicts</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-mono font-bold animate-pulse shadow-sm">
              <AlertTriangle size={14} className="text-rose-400" />
              <span>{activeWarnings.length} Stack Interactions Flagged</span>
            </div>
          )}
        </div>
      </div>

      {/* Flagged Warnings Accordion if any detected in current schedule */}
      {activeWarnings.length > 0 && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 space-y-2">
          <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
            <AlertTriangle size={13} /> Active Protocol Flagged Conflicts:
          </span>
          <div className="space-y-1.5">
            {activeWarnings.map(w => (
              <div key={w.id} className="text-[11px] text-slate-300 flex items-start gap-2 bg-black/40 p-2 rounded-lg border border-white/5">
                <span className="text-rose-400 font-bold shrink-0">⚠️ {w.modalityName}:</span>
                <span className="leading-tight">{w.headline} — {w.clinicalRationale}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 1: ACTIVE PRESCRIPTIONS & MEDICATIONS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Pill size={14} className="text-indigo-400" />
            <span>Active Prescriptions &amp; Medications</span>
          </label>
          <span className="text-[10px] text-slate-400 font-mono">
            {medications.length} logged
          </span>
        </div>

        {/* Quick Prescription Presets */}
        <div className="flex flex-wrap gap-1.5">
          {COMMON_PRESCRIPTION_PRESETS.map(preset => {
            const isSelected = medications.some(m => m.toLowerCase() === preset.toLowerCase() || preset.toLowerCase().includes(m.toLowerCase()))
            return (
              <button
                key={preset}
                type="button"
                onClick={() => handleToggleMedPreset(preset)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer select-none ${
                  isSelected
                    ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/50 shadow-sm'
                    : 'bg-black/30 text-slate-400 border border-white/5 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                {isSelected && <Check size={11} className="text-indigo-300" />}
                <span>{preset}</span>
              </button>
            )
          })}
        </div>

        {/* Custom Medication Tag Input */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Type other prescription name (e.g. Eliquis, Lexapro, Plavix)..."
            value={customMedInput}
            onChange={(e) => setCustomMedInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddCustomMed()
              }
            }}
            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
          />
          <button
            type="button"
            onClick={handleAddCustomMed}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 hover:text-white transition-all cursor-pointer flex items-center gap-1"
          >
            <Plus size={13} />
            <span>Add</span>
          </button>
        </div>

        {/* Active Medication Tags */}
        {medications.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {medications.map(med => (
              <span
                key={med}
                className="px-2.5 py-1 rounded-lg bg-indigo-950/60 border border-indigo-500/40 text-indigo-300 text-xs font-mono font-medium flex items-center gap-1.5 shadow-sm"
              >
                <span>{med}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveMed(med)}
                  className="hover:text-white transition-colors cursor-pointer"
                  title="Remove medication"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: MEDICAL CONDITIONS & SENSITIVITIES */}
      <div className="space-y-3 pt-2 border-t border-white/10">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <HeartPulse size={14} className="text-rose-400" />
            <span>Medical History, Conditions &amp; Sensitivities</span>
          </label>
          <span className="text-[10px] text-slate-400 font-mono">
            {conditions.length} logged
          </span>
        </div>

        {/* Quick Condition Presets */}
        <div className="flex flex-wrap gap-1.5">
          {COMMON_CONDITION_PRESETS.map(preset => {
            const isSelected = conditions.some(c => c.toLowerCase() === preset.toLowerCase() || preset.toLowerCase().includes(c.toLowerCase()))
            return (
              <button
                key={preset}
                type="button"
                onClick={() => handleToggleCondPreset(preset)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer select-none ${
                  isSelected
                    ? 'bg-rose-500/30 text-rose-200 border border-rose-400/50 shadow-sm'
                    : 'bg-black/30 text-slate-400 border border-white/5 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                {isSelected && <Check size={11} className="text-rose-300" />}
                <span>{preset}</span>
              </button>
            )
          })}
        </div>

        {/* Custom Condition Tag Input */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Type other medical condition (e.g. Hashimoto's, Raynaud's)..."
            value={customCondInput}
            onChange={(e) => setCustomCondInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddCustomCond()
              }
            }}
            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
          />
          <button
            type="button"
            onClick={handleAddCustomCond}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 hover:text-white transition-all cursor-pointer flex items-center gap-1"
          >
            <Plus size={13} />
            <span>Add</span>
          </button>
        </div>

        {/* Active Condition Tags */}
        {conditions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {conditions.map(cond => (
              <span
                key={cond}
                className="px-2.5 py-1 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-mono font-medium flex items-center gap-1.5 shadow-sm"
              >
                <span>{cond}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveCond(cond)}
                  className="hover:text-white transition-colors cursor-pointer"
                  title="Remove condition"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Clinical Disclaimer & Action Bar */}
      <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2 text-[11px] text-slate-400 max-w-xl">
          <Info size={14} className="text-slate-500 shrink-0 mt-0.5" />
          <span>
            LEVL Protocol Safety Screening is designed for harm-reduction research. Always review stack adjustments with your prescribing physician.
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {saveToast && (
            <span className="text-xs font-bold text-emerald-400 font-mono animate-in fade-in">
              ✓ Saved to Profile
            </span>
          )}
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Sparkles size={14} />
            <span>{isSaving ? 'Saving...' : 'Save Health Profile'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
