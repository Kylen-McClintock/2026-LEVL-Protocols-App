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
  ChevronUp,
  RefreshCw,
  Trash2,
  ArrowRight,
  Shield,
  Activity,
  CheckCircle2,
  ExternalLink
} from 'lucide-react'
import { UserProfile, DailyProtocolTask, ContraindicationWarning } from '@/lib/types'
import { 
  updateUserProfile, 
  getDailyProtocolTasks, 
  moveModalityToBench, 
  addSingleModalityToToday 
} from '@/lib/data'
import { parseMedicalProfile, auditScheduleSafety } from '@/lib/safety/contraindicationEngine'
import { format } from 'date-fns'

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
  
  // Local task state synced with parent or self-hydrated
  const [activeTasks, setActiveTasks] = useState<DailyProtocolTask[]>(tasks)
  const [isSaving, setIsSaving] = useState(false)
  const [saveToast, setSaveToast] = useState(false)
  
  // Safety Screening Modal state
  const [showScreeningModal, setShowScreeningModal] = useState(false)
  const [processingWarningId, setProcessingWarningId] = useState<string | null>(null)
  const [actionFeedback, setActionFeedback] = useState<string | null>(null)

  // Re-sync tasks prop
  useEffect(() => {
    if (tasks && tasks.length > 0) {
      setActiveTasks(tasks)
    }
  }, [tasks])

  // If tasks prop is empty, self-hydrate today's tasks
  useEffect(() => {
    if (localUserId && (!tasks || tasks.length === 0)) {
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      getDailyProtocolTasks(localUserId, todayStr).then(t => {
        if (t && t.length > 0) setActiveTasks(t)
      }).catch(err => console.warn('[MedicalHistoryCard] Task hydrate error:', err))
    }
  }, [localUserId, tasks])

  // Listen to global protocol updates to keep tasks refreshed in real time
  useEffect(() => {
    const handleProtocolUpdate = () => {
      if (localUserId) {
        const todayStr = format(new Date(), 'yyyy-MM-dd')
        getDailyProtocolTasks(localUserId, todayStr).then(t => {
          if (t) setActiveTasks(t)
        }).catch(err => console.warn('[MedicalHistoryCard] Task refresh error:', err))
      }
    }
    window.addEventListener('levl_protocol_updated', handleProtocolUpdate)
    return () => window.removeEventListener('levl_protocol_updated', handleProtocolUpdate)
  }, [localUserId])

  // Dynamic schedule safety audit preview based on selected meds/conditions
  const previewProfile: UserProfile = {
    ...(profile || {} as any),
    medications_and_treatments_text: JSON.stringify(medications),
    health_conditions_text: JSON.stringify(conditions)
  }
  const activeWarnings = auditScheduleSafety(activeTasks, previewProfile)

  // Accordion state
  const [isOpen, setIsOpen] = useState(false)

  // Re-sync if profile changes externally
  useEffect(() => {
    if (profile) {
      const parsed = parseMedicalProfile(profile)
      setMedications(parsed.medications)
      setConditions(parsed.conditions)
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

  // Remove problematic modality right from the screening interface
  const handleRemoveProblematicModality = async (modalityId: string, warningId: string, modalityName: string) => {
    if (!localUserId || !modalityId) return
    setProcessingWarningId(warningId)
    try {
      await moveModalityToBench(localUserId, modalityId)
      // Optimistically remove from activeTasks
      setActiveTasks(prev => prev.filter(t => t.modality_id !== modalityId && t.loose_modality?.id !== modalityId && t.protocol_step?.modality_id !== modalityId))
      setActionFeedback(`Removed "${modalityName}" from active schedule and moved to bench.`)
      setTimeout(() => setActionFeedback(null), 4500)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('levl_protocol_updated'))
      }
    } catch (err) {
      console.error('Error removing conflicting modality:', err)
    } finally {
      setProcessingWarningId(null)
    }
  }

  // Swap problematic modality for a verified safe alternative
  const handleSwapModality = async (warning: ContraindicationWarning) => {
    if (!localUserId || !warning.modalityId || !warning.safeAlternative) return
    setProcessingWarningId(warning.id)
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      // 1. Move conflicting modality to bench
      await moveModalityToBench(localUserId, warning.modalityId)
      // 2. Add safe alternative to today
      await addSingleModalityToToday(localUserId, todayStr, warning.safeAlternative.id)
      // 3. Refresh tasks
      const refreshed = await getDailyProtocolTasks(localUserId, todayStr)
      if (refreshed && refreshed.length > 0) {
        setActiveTasks(refreshed)
      } else {
        setActiveTasks(prev => prev.filter(t => t.modality_id !== warning.modalityId && t.loose_modality?.id !== warning.modalityId && t.protocol_step?.modality_id !== warning.modalityId))
      }
      setActionFeedback(`Swapped! Replaced "${warning.modalityName}" with "${warning.safeAlternative.name}".`)
      setTimeout(() => setActionFeedback(null), 4500)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('levl_protocol_updated'))
      }
    } catch (err) {
      console.error('Error swapping modality for alternative:', err)
    } finally {
      setProcessingWarningId(null)
    }
  }

  return (
    <>
      <div className="rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md shadow-xl overflow-hidden transition-all">
        {/* Header Block: Full width title + chevron, meds/conds bar, caution alert, screening button */}
        <div className="p-4 sm:p-5">
          {/* Row 1: Title (full width minus the expand chevron) */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                activeWarnings.length > 0 
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.3)]' 
                  : 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
              }`}>
                <ShieldAlert size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight leading-tight">
                  Medical History &amp; Prescriptions
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 truncate">
                  Screen protocol modalities for clinical contraindications &amp; interactions
                </p>
              </div>
            </div>

            {/* Expand / Collapse Chevron Button */}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
              aria-label={isOpen ? "Collapse section" : "Expand section"}
            >
              {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>

          {/* Row 2: The # of meds and conditions full width underneath */}
          <div className="w-full mt-3.5 px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2 text-indigo-300 min-w-0">
              <Pill size={14} className="text-indigo-400 shrink-0" />
              <span className="font-semibold truncate">
                {medications.length} Active Prescription{medications.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="h-3.5 w-px bg-white/15 shrink-0" />
            <div className="flex items-center gap-2 text-rose-300 min-w-0">
              <HeartPulse size={14} className="text-rose-400 shrink-0" />
              <span className="font-semibold truncate">
                {conditions.length} Medical Condition{conditions.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          {/* Row 3: Caution warning on the collapsed medical history card if there is still a risk */}
          {activeWarnings.length > 0 && (
            <div className="w-full mt-3 p-3 sm:p-3.5 rounded-xl bg-gradient-to-r from-rose-950/90 via-rose-900/60 to-amber-950/80 border border-rose-500/50 shadow-[0_0_18px_rgba(244,63,94,0.22)] text-rose-200 animate-in fade-in duration-200">
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 mt-0.5 animate-pulse">
                    <AlertTriangle size={14} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-extrabold text-rose-200 uppercase tracking-wide">
                        ⚠️ Caution: {activeWarnings.length} Protocol Risk{activeWarnings.length > 1 ? 's' : ''} Active
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/30 text-rose-300 border border-rose-400/40 uppercase">
                        Action Advised
                      </span>
                    </div>
                    <p className="text-[11px] text-rose-300/90 leading-relaxed mt-1">
                      Conflicting scheduled item{activeWarnings.length > 1 ? 's' : ''}:{' '}
                      <span className="font-semibold text-white">
                        {activeWarnings.map(w => w.modalityName).filter(Boolean).join(', ')}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Row 4: Button to perform a safety screening of your protocol */}
          <div className="w-full mt-3">
            <button
              type="button"
              onClick={() => setShowScreeningModal(true)}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-extrabold tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                activeWarnings.length > 0
                  ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-rose-600/25 animate-pulse'
                  : 'bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-teal-500/20 hover:bg-white/10 border border-amber-500/40 text-amber-200 hover:text-white'
              }`}
            >
              <ShieldAlert size={15} className={activeWarnings.length > 0 ? "text-white" : "text-amber-400"} />
              <span>
                {activeWarnings.length > 0
                  ? `Perform Safety Screening (${activeWarnings.length} Active Conflict${activeWarnings.length > 1 ? 's' : ''})`
                  : 'Perform Protocol Safety Screening'}
              </span>
              <Sparkles size={14} className={activeWarnings.length > 0 ? "text-amber-200" : "text-amber-400"} />
            </button>
          </div>

          {/* Real-time Feedback Toast */}
          {actionFeedback && (
            <div className="w-full mt-3 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-medium flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
              <span>{actionFeedback}</span>
            </div>
          )}
        </div>

        {/* Expandable Body */}
        {isOpen && (
          <div className="p-5 sm:p-6 border-t border-white/10 space-y-6 animate-in fade-in duration-200">
            {/* Active Protocol Flagged Conflicts (with direct Remove and Swap actions) */}
            {activeWarnings.length > 0 && (
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-rose-400" />
                    <span>Active Protocol Flagged Conflicts ({activeWarnings.length}):</span>
                  </span>
                  <span className="text-[10px] font-mono uppercase font-bold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/30">
                    Attention Required
                  </span>
                </div>

                <div className="space-y-3">
                  {activeWarnings.map(w => (
                    <div key={w.id} className="text-xs text-slate-300 bg-black/50 p-3.5 rounded-xl border border-white/10 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <strong className="text-white text-sm block flex items-center gap-2">
                            <span>{w.modalityName}</span>
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">
                              {w.level}
                            </span>
                          </strong>
                          <span className="text-[11px] text-rose-300/90 font-medium block mt-0.5">
                            {w.headline}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {w.clinicalRationale}
                      </p>

                      <div className="text-[11px] text-amber-300/90 font-medium bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                        Guidance: {w.actionAdvice}
                      </div>

                      {/* Direct In-Card Remediation Controls */}
                      <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row gap-2">
                        {/* Remove Problematic Part */}
                        {w.modalityId && (
                          <button
                            type="button"
                            disabled={processingWarningId === w.id}
                            onClick={() => handleRemoveProblematicModality(w.modalityId!, w.id, w.modalityName)}
                            className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 size={12} />
                            <span>Remove from Protocol</span>
                          </button>
                        )}

                        {/* Optional Safe Alternative */}
                        {w.safeAlternative && (
                          <button
                            type="button"
                            disabled={processingWarningId === w.id}
                            onClick={() => handleSwapModality(w)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                            title={w.safeAlternative.rationale}
                          >
                            <RefreshCw size={12} className={processingWarningId === w.id ? "animate-spin" : ""} />
                            <span>Swap to {w.safeAlternative.name}</span>
                          </button>
                        )}
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

            {/* Clinical Disclaimer & Save Profile Bar */}
            <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2 text-[11px] text-slate-400 max-w-xl">
                <Info size={14} className="text-slate-500 shrink-0 mt-0.5" />
                <span>
                  LEVL Protocol Safety Screening is designed for clinical harm-reduction. Always review protocol modifications with your prescribing physician.
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

      {/* PROTOCOL SAFETY SCREENING MODAL */}
      {showScreeningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-white/15 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                  activeWarnings.length > 0 
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.3)]' 
                    : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                }`}>
                  {activeWarnings.length > 0 ? <ShieldAlert size={20} /> : <ShieldCheck size={20} />}
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                    Protocol Safety &amp; Interaction Screening
                  </h2>
                  <p className="text-xs text-slate-400 truncate">
                    Cross-referencing active protocol tasks against your medical history
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowScreeningModal(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content Scroll Area */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
              {/* Screening Context Bar */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block font-bold">
                  Active Screening Parameters:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {medications.map(m => (
                    <span key={m} className="px-2 py-0.5 rounded-md bg-indigo-950/60 border border-indigo-500/30 text-indigo-200 text-[11px] font-mono flex items-center gap-1">
                      <Pill size={10} className="text-indigo-400" />
                      <span className="truncate max-w-[200px]">{m}</span>
                    </span>
                  ))}
                  {conditions.map(c => (
                    <span key={c} className="px-2 py-0.5 rounded-md bg-rose-950/60 border border-rose-500/30 text-rose-200 text-[11px] font-mono flex items-center gap-1">
                      <HeartPulse size={10} className="text-rose-400" />
                      <span className="truncate max-w-[200px]">{c}</span>
                    </span>
                  ))}
                  {medications.length === 0 && conditions.length === 0 && (
                    <span className="text-xs text-slate-500 italic">
                      No medications or conditions recorded in profile. Add presets to enable pharmacological screening.
                    </span>
                  )}
                </div>
              </div>

              {/* Action Feedback Banner inside Modal */}
              {actionFeedback && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-medium flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  <span>{actionFeedback}</span>
                </div>
              )}

              {/* All Clear State */}
              {activeWarnings.length === 0 && (
                <div className="p-6 rounded-2xl bg-emerald-950/25 border border-emerald-500/40 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 mx-auto shadow-[0_0_20px_rgba(16,185,129,0.25)]">
                    <ShieldCheck size={32} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">
                      Protocol 100% Cleared
                    </h3>
                    <p className="text-xs text-emerald-300/90 max-w-md mx-auto mt-1 leading-relaxed">
                      No clinical contraindications, cytochrome P450 interactions, or cardiovascular pressor risks were detected across your active protocol tasks.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-emerald-500/20 grid grid-cols-2 gap-2 text-left text-[11px] font-mono text-slate-300 max-w-md mx-auto">
                    <div className="flex items-center gap-1.5 text-emerald-300">
                      <Check size={12} className="stroke-[3]" />
                      <span>Zero Serotonergic Synergy</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-300">
                      <Check size={12} className="stroke-[3]" />
                      <span>Coagulation Safe</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-300">
                      <Check size={12} className="stroke-[3]" />
                      <span>Pressor &amp; Arrhythmia Checked</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-300">
                      <Check size={12} className="stroke-[3]" />
                      <span>Hypoglycemic Balance OK</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Flagged Warnings List */}
              {activeWarnings.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                      <AlertTriangle size={14} className="text-rose-400" />
                      <span>Flagged Protocol Conflicts ({activeWarnings.length})</span>
                    </h3>
                    <span className="text-[10px] font-mono text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded font-bold border border-rose-500/30">
                      Attention Required
                    </span>
                  </div>

                  {activeWarnings.map(warning => (
                    <div
                      key={warning.id}
                      className="p-4 rounded-2xl bg-black/60 border border-rose-500/40 space-y-3.5 shadow-lg"
                    >
                      {/* Warning Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-extrabold text-white">
                              {warning.modalityName}
                            </span>
                            <span className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded uppercase border ${
                              warning.level === 'critical'
                                ? 'bg-rose-500/30 text-rose-200 border-rose-400/50'
                                : 'bg-amber-500/30 text-amber-200 border-amber-400/50'
                            }`}>
                              {warning.level === 'critical' ? 'Critical Contraindication' : 'Precaution / Interaction'}
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-rose-300 mt-1 block">
                            {warning.headline}
                          </span>
                        </div>

                        {/* Direct Removal Button */}
                        {warning.modalityId && (
                          <button
                            type="button"
                            disabled={processingWarningId === warning.id}
                            onClick={() => handleRemoveProblematicModality(warning.modalityId!, warning.id, warning.modalityName)}
                            className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 size={13} />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>

                      {/* Clinical Mechanism & Action Guidance */}
                      <div className="space-y-1.5 text-xs text-slate-300 bg-white/[0.02] p-3 rounded-xl border border-white/5">
                        <p className="leading-relaxed">
                          <strong className="text-slate-200">Pharmacological Rationale: </strong>
                          {warning.clinicalRationale}
                        </p>
                        <p className="leading-relaxed text-amber-300/90 pt-1">
                          <strong className="text-amber-200">Clinical Advice: </strong>
                          {warning.actionAdvice}
                        </p>
                      </div>

                      {/* Evidence-Based Safe Alternative & 1-Tap Swap */}
                      {warning.safeAlternative && (
                        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-mono font-bold uppercase tracking-wide text-emerald-400 flex items-center gap-1.5">
                              <Sparkles size={13} className="text-emerald-400" />
                              <span>Recommended Safe Alternative (Zero Risk with Profile):</span>
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 capitalize">
                              {warning.safeAlternative.category}
                            </span>
                          </div>

                          <div>
                            <span className="text-xs font-extrabold text-white block">
                              {warning.safeAlternative.name}
                            </span>
                            <span className="text-[11px] text-emerald-300 font-medium block mt-0.5">
                              Target Outcome: {warning.safeAlternative.outcome}
                            </span>
                            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                              {warning.safeAlternative.rationale}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-emerald-500/20 flex justify-end">
                            <button
                              type="button"
                              disabled={processingWarningId === warning.id}
                              onClick={() => handleSwapModality(warning)}
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                            >
                              <RefreshCw size={13} className={processingWarningId === warning.id ? "animate-spin" : ""} />
                              <span>Swap to {warning.safeAlternative.name}</span>
                              <ArrowRight size={13} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10 bg-black/40 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                {activeWarnings.length === 0 ? '✓ All systems clear' : `${activeWarnings.length} conflict(s) pending`}
              </span>
              <button
                type="button"
                onClick={() => setShowScreeningModal(false)}
                className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Close Screening
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
