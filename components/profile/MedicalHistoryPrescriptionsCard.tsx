'use client'

import React, { useState, useEffect } from 'react'
import { 
  ShieldAlert, 
  Pill, 
  HeartPulse, 
  Plus, 
  X, 
  Check, 
  Sparkles, 
  AlertTriangle, 
  ShieldCheck, 
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { UserProfile, DailyProtocolTask } from '@/lib/types'
import { updateUserProfile } from '@/lib/data'
import { parseMedicalProfile, auditScheduleSafety } from '@/lib/safety/contraindicationEngine'

interface MedicalHistoryPrescriptionsCardProps {
  profile: UserProfile | null
  localUserId: string
  tasks?: DailyProtocolTask[]
  onProfileUpdated?: (updated: UserProfile) => void
}

/**
 * 100% Generic Pharmacological Classes with popular representatives in parentheses
 */
const COMMON_PRESCRIPTION_PRESETS = [
  'SSRIs / SNRIs / Antidepressants (Sertraline, Lexapro, Wellbutrin)',
  'MAO Inhibitors / MAOIs (Selegiline, Parnate, Nardil)',
  'Stimulants / ADHD Medications (Adderall, Vyvanse, Modafinil)',
  'Blood Thinners / Anticoagulants (Warfarin, Eliquis, Plavix, Aspirin)',
  'Blood Pressure / Antihypertensives (ACEi, ARBs, Beta Blockers)',
  'Statins / PCSK9 Inhibitors (Atorvastatin, Rosuvastatin)',
  'GLP-1 / GIP Receptor Agonists (Semaglutide, Tirzepatide, Liraglutide)',
  'Metformin / SGLT2 Inhibitors (Glucophage, Jardiance, Farxiga)',
  'Thyroid Hormones (Levothyroxine, Synthroid, Liothyronine)',
  'HRT / TRT / Sex Hormones (Testosterone, Estrogen, Progesterone)',
  'Immunosuppressants & Biologics (Rapamycin / Sirolimus, Tacrolimus)',
  'Corticosteroids (Prednisone, Dexamethasone, Hydrocortisone)',
  'Sleep & Sedative Medications (Z-Drugs, Benzodiazepines, Gabapentinoids)',
  'PDE5 Inhibitors (Tadalafil, Sildenafil)',
  'PPIs / Acid Blockers (Omeprazole, Pantoprazole, Famotidine)',
  'Antihistamines / Mast Cell Stabilizers (Cetirizine, Ketotifen)'
]

/**
 * 100% Generic Clinical & Physiological Condition Categories
 */
const COMMON_CONDITION_PRESETS = [
  'Hypertension (High Blood Pressure)',
  'Cardiac Arrhythmia / AFib / Tachycardia',
  'Coronary Artery Disease / Atherosclerosis',
  'POTS / Orthostatic Hypotension (Low Blood Pressure)',
  'Type 2 Diabetes / Insulin Resistance / Hypoglycemia',
  'Chronic Kidney Disease / Impaired eGFR',
  'Liver Disease / NAFLD / Elevated Enzymes',
  'Active Cancer / History of Neoplasia',
  'Epilepsy / History of Seizures',
  'Autoimmune Conditions (Hashimoto\'s, RA, Lupus, Crohn\'s)',
  'Histamine Intolerance / MCAS',
  'G6PD Deficiency (Redox Sensitivity)',
  'Bleeding Disorders / Easy Bruising',
  'Osteopenia / Osteoporosis (Low Bone Density)',
  'Severe Migraines / Chronic Headaches',
  'Pregnancy / Nursing / Trying to Conceive'
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

  // Active schedule safety audit preview
  const previewProfile: UserProfile = {
    ...(profile || {} as any),
    medications_and_treatments_text: JSON.stringify(medications),
    health_conditions_text: JSON.stringify(conditions)
  }
  const activeWarnings = auditScheduleSafety(tasks, previewProfile)

  // Expandable state: open by default if active warnings are flagged, otherwise collapsed
  const [isOpen, setIsOpen] = useState(activeWarnings.length > 0)

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

  const totalLogged = medications.length + conditions.length

  return (
    <div className="rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md shadow-xl overflow-hidden transition-all">
      {/* Clickable Header Accordion Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 sm:gap-4 text-left hover:bg-white/[0.03] transition-colors cursor-pointer group"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)] shrink-0">
            <ShieldAlert size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight group-hover:text-amber-300 transition-colors">
                Medical History &amp; Prescriptions
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Safety Screening
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              Screen your protocol modalities for clinical contraindications &amp; drug-supplement interactions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* Live Status Summary Badge */}
          {activeWarnings.length > 0 ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-mono font-bold animate-pulse shadow-sm">
              <AlertTriangle size={12} className="text-rose-400" />
              <span>{activeWarnings.length} Flagged</span>
            </div>
          ) : totalLogged > 0 ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-semibold shadow-sm">
              <ShieldCheck size={12} className="text-emerald-400" />
              <span>{medications.length} Meds • {conditions.length} Conditions</span>
            </div>
          ) : (
            <span className="text-[10px] font-mono text-slate-500 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
              None Logged
            </span>
          )}

          <div className="p-1.5 rounded-lg bg-white/5 text-slate-400 group-hover:text-white group-hover:bg-white/10 transition-colors">
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </button>

      {/* Expandable Body */}
      {isOpen && (
        <div className="p-5 sm:p-6 border-t border-white/10 space-y-6 animate-in fade-in duration-200">
          {/* Flagged Warnings Accordion if any detected in current schedule */}
          {activeWarnings.length > 0 && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-rose-400" />
                  <span>Active Protocol Flagged Conflicts ({activeWarnings.length}):</span>
                </span>
                <span className="text-[10px] font-mono uppercase font-bold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/30">
                  Attention Required
                </span>
              </div>
              <div className="space-y-2">
                {activeWarnings.map(w => (
                  <div key={w.id} className="text-xs text-slate-300 flex items-start gap-2 bg-black/40 p-3 rounded-lg border border-white/5 space-y-1">
                    <span className="text-rose-400 font-bold shrink-0 mt-0.5">⚠️</span>
                    <div>
                      <strong className="text-white block">{w.modalityName}: {w.headline}</strong>
                      <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">{w.clinicalRationale}</p>
                      <span className="text-[11px] text-amber-300/90 font-medium block mt-1">Guidance: {w.actionAdvice}</span>
                    </div>
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
                <span>Active Prescriptions &amp; Medications ({medications.length} selected)</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                Click generic presets or type custom below
              </span>
            </div>

            {/* Quick Prescription Presets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {COMMON_PRESCRIPTION_PRESETS.map(preset => {
                const isSelected = medications.some(m => m.toLowerCase() === preset.toLowerCase() || preset.toLowerCase().includes(m.toLowerCase()))
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleToggleMedPreset(preset)}
                    className={`px-3 py-2 rounded-xl text-left text-xs font-medium transition-all flex items-center justify-between gap-2 cursor-pointer select-none ${
                      isSelected
                        ? 'bg-indigo-500/30 text-indigo-100 border border-indigo-400/50 shadow-sm'
                        : 'bg-black/40 text-slate-300 border border-white/5 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="line-clamp-1">{preset}</span>
                    <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                      isSelected ? 'bg-indigo-500 border-indigo-400 text-white' : 'border-white/20 bg-black/40'
                    }`}>
                      {isSelected && <Check size={11} className="stroke-[3]" />}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Custom Medication Tag Input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Type other prescription name (e.g. Eliquis, Lexapro, Plavix, Vyvanse)..."
                value={customMedInput}
                onChange={(e) => setCustomMedInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddCustomMed()
                  }
                }}
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
              />
              <button
                type="button"
                onClick={handleAddCustomMed}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 hover:text-white transition-all cursor-pointer flex items-center gap-1 shrink-0"
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
                    className="px-3 py-1 rounded-lg bg-indigo-950/70 border border-indigo-500/40 text-indigo-200 text-xs font-mono font-medium flex items-center gap-1.5 shadow-sm"
                  >
                    <span>{med}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMed(med)}
                      className="hover:text-white transition-colors cursor-pointer ml-0.5"
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
          <div className="space-y-3 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <HeartPulse size={14} className="text-rose-400" />
                <span>Medical History, Conditions &amp; Sensitivities ({conditions.length} selected)</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                Click generic presets or type custom below
              </span>
            </div>

            {/* Quick Condition Presets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {COMMON_CONDITION_PRESETS.map(preset => {
                const isSelected = conditions.some(c => c.toLowerCase() === preset.toLowerCase() || preset.toLowerCase().includes(c.toLowerCase()))
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleToggleCondPreset(preset)}
                    className={`px-3 py-2 rounded-xl text-left text-xs font-medium transition-all flex items-center justify-between gap-2 cursor-pointer select-none ${
                      isSelected
                        ? 'bg-rose-500/30 text-rose-100 border border-rose-400/50 shadow-sm'
                        : 'bg-black/40 text-slate-300 border border-white/5 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="line-clamp-1">{preset}</span>
                    <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                      isSelected ? 'bg-rose-500 border-rose-400 text-white' : 'border-white/20 bg-black/40'
                    }`}>
                      {isSelected && <Check size={11} className="stroke-[3]" />}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Custom Condition Tag Input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Type other medical condition (e.g. Hashimoto's, Raynaud's, MCAS)..."
                value={customCondInput}
                onChange={(e) => setCustomCondInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddCustomCond()
                  }
                }}
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
              />
              <button
                type="button"
                onClick={handleAddCustomCond}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 hover:text-white transition-all cursor-pointer flex items-center gap-1 shrink-0"
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
                    className="px-3 py-1 rounded-lg bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs font-mono font-medium flex items-center gap-1.5 shadow-sm"
                  >
                    <span>{cond}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCond(cond)}
                      className="hover:text-white transition-colors cursor-pointer ml-0.5"
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
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles size={14} />
                <span>{isSaving ? 'Saving...' : 'Save Health Profile'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
