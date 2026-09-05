'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { DailyProtocolTask } from '@/lib/types'
import { 
  CheckCircle2, Clock, Calendar, Sparkles, X, ChevronDown, ChevronUp, 
  Layers, Info, RotateCcw, ExternalLink, Microscope, AlertTriangle, BookOpen, ShieldAlert,
  Archive, Trash2, Ban, HelpCircle, Check
} from 'lucide-react'
import { modalityReferences } from '@/lib/data/references'
import { ModalityExecutionGuide } from '@/components/modals/ModalityExecutionGuide'
import { getModalityVideoInfo } from '@/lib/data/modalityVideos'
import MedicalDisclaimerBanner from '@/components/ui/MedicalDisclaimerBanner'
import ModalityLongevityDrawer from '@/components/cards/ModalityLongevityDrawer'

export const ELIMINATION_REASON_OPTIONS = [
  { id: 'time', label: 'Too Time-Consuming / Schedule Conflict', icon: '⏰' },
  { id: 'results', label: 'Not Seeing Results / Ineffective', icon: '⚡' },
  { id: 'side_effects', label: 'Side Effects / Discomfort', icon: '🩺' },
  { id: 'cost', label: 'Too Expensive / High Cost', icon: '💰' },
  { id: 'equipment', label: 'Lack of Equipment / Access', icon: '🏖️' },
  { id: 'medical', label: 'Medical Advice / Doctor Direction', icon: '🧬' },
  { id: 'replacing', label: 'Replacing with Better Modality', icon: '🔄' },
  { id: 'completed_trial', label: 'Completed Planned Protocol Trial', icon: '🏆' }
]

interface ExpandedModalityDetailBannerProps {
  task: DailyProtocolTask
  onClose: () => void
  onTaskStatusChange?: (taskId: string, newStatus: string) => void
  onOpenDosageModal?: (modality: any) => void
  onOpenRescheduleModal?: (task: DailyProtocolTask) => void
  onMoveToBench?: (task: DailyProtocolTask) => void
  onEliminateEntirely?: (task: DailyProtocolTask, reason?: string, selectedReasons?: string[]) => void
}

export const ExpandedModalityDetailBanner: React.FC<ExpandedModalityDetailBannerProps> = ({
  task,
  onClose,
  onTaskStatusChange,
  onOpenDosageModal,
  onOpenRescheduleModal,
  onMoveToBench,
  onEliminateEntirely
}) => {
  const [showGeekMode, setShowGeekMode] = useState(false)
  const [isDisclaimerExpanded, setIsDisclaimerExpanded] = useState(false)
  const [actionModalType, setActionModalType] = useState<'bench' | 'eliminate' | null>(null)
  const [actionSuccess, setActionSuccess] = useState<'bench' | 'eliminate' | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Elimination reason state
  const [selectedReasons, setSelectedReasons] = useState<string[]>([])
  const [customNote, setCustomNote] = useState('')

  const mod = task.protocol_step?.modality || task.loose_modality
  if (!mod) return null

  const modName = mod.display_name || mod.name || 'Protocol Modality'
  const catName = mod.category || 'Longevity Protocol'
  const isDone = task.status === 'completed'
  const colorHex = task.lineages?.[0]?.color_hex || '#14B8A6'
  const protoNames = task.lineages?.map(l => l.protocol_name).join(' + ') || task.protocol_step?.protocol?.name || 'LEVL Stack'

  const instructionsText = task.protocol_step?.instructions || (task as any).instructions || mod.instructions || (mod as any).description || ''

  const refs = mod.scientific_references && mod.scientific_references.length > 0 
    ? mod.scientific_references 
    : modalityReferences[mod.id] || []

  const synergyData = (() => {
    if (mod.synergy_notes) {
      if (typeof mod.synergy_notes === 'object' && !Array.isArray(mod.synergy_notes)) {
        const notes = mod.synergy_notes as any
        const pairs = Array.isArray(notes.pairsWellWith) ? notes.pairsWellWith.join(', ') : (notes.pairsWellWith || '')
        return { pairsWith: pairs.replace(/_/g, ' '), rationale: notes.rationale || notes.summary || '' }
      } else if (typeof mod.synergy_notes === 'string') {
        return { pairsWith: '', rationale: mod.synergy_notes }
      }
    }
    const cat = (mod.category || '').toLowerCase()
    if (cat.includes('nutrition') || cat.includes('supplement')) {
      return { pairsWith: 'Co-factor Nutrients & Healthy Dietary Fats', rationale: 'Supplements achieve optimal cellular uptake when taken alongside lipid-containing meals and necessary electrolyte co-factors.' }
    } else if (cat.includes('fasting') || cat.includes('autophagy')) {
      return { pairsWith: 'Unflavored Electrolytes (Sodium, Potassium), Black Coffee, Zone 2 Walking', rationale: 'Fasting drops insulin levels triggering renal electrolyte excretion. Unflavored electrolytes sustain blood volume while light walking accelerates fatty acid oxidation.' }
    } else if (cat.includes('fitness') || cat.includes('physical') || cat.includes('exercise')) {
      return { pairsWith: 'Post-Workout Protein (Leucine), Creatine, 7-9 Hours Deep Sleep', rationale: 'Physical training triggers tissue remodeling and protein synthesis, requiring amino acid availability and deep slow-wave sleep growth hormone pulses.' }
    } else if (cat.includes('sleep') || cat.includes('circadian')) {
      return { pairsWith: 'Morning Sunlight (10-30m), Blue-Blocking Glasses, Cool Room (65-68°F)', rationale: 'Circadian optimization relies on daytime optic flow light anchors and evening temperature/blue light suppression to maximize endogenous melatonin.' }
    }
    return { pairsWith: 'Complementary Lifestyle Habits & Hydration', rationale: 'Yields elevated benefits when paired with baseline circadian alignment, hydration, and lower systemic inflammation.' }
  })()

  const antagonismData = (() => {
    if (mod.antagonism_notes) {
      if (typeof mod.antagonism_notes === 'object' && !Array.isArray(mod.antagonism_notes)) {
        const notes = mod.antagonism_notes as any
        const avoid = Array.isArray(notes.avoidCombiningWith) ? notes.avoidCombiningWith.join(', ') : (notes.avoidCombiningWith || '')
        return { avoidWith: avoid.replace(/_/g, ' '), rationale: notes.rationale || notes.summary || '' }
      } else if (typeof mod.antagonism_notes === 'string') {
        return { avoidWith: '', rationale: mod.antagonism_notes }
      }
    }
    return null
  })()

  const toggleReason = (label: string) => {
    setSelectedReasons(prev => 
      prev.includes(label) ? prev.filter(r => r !== label) : [...prev, label]
    )
  }

  const handleConfirmAction = async () => {
    if (actionModalType === 'eliminate') {
      setActionSuccess('eliminate')
      if (onEliminateEntirely) {
        onEliminateEntirely(task, customNote || 'User eliminated modality', selectedReasons)
      }
    } else if (actionModalType === 'bench') {
      setActionSuccess('bench')
      if (onMoveToBench) {
        onMoveToBench(task)
      }
    }
    // 0.5-second visual confirmation before closing
    await new Promise(r => setTimeout(r, 500))
    setActionSuccess(null)
    setActionModalType(null)
    onClose()
  }

  return (
    <div className="w-full my-2.5 bg-slate-950 border border-teal-500/80 rounded-2xl p-4 sm:p-5 shadow-[0_0_30px_rgba(20,184,166,0.15)] ring-1 ring-teal-500/40 animate-in fade-in zoom-in-95 duration-200 space-y-4 relative">
      
      {/* Full-Screen Action Confirmation Takeover Modal with Multi-Select Reasons (Bench or Eliminate) */}
      {actionModalType && mounted && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
          onClick={(e) => {
            e.stopPropagation()
            if (e.target === e.currentTarget) setActionModalType(null)
          }}
        >
          <div 
            className={`relative w-full max-w-lg bg-slate-950 border ${actionModalType === 'eliminate' ? 'border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.25)]' : 'border-purple-500/50 shadow-[0_0_50px_rgba(168,85,247,0.25)]'} rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col my-auto max-h-[90vh] overflow-hidden space-y-4`}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className={`p-2.5 rounded-2xl border shrink-0 ${actionModalType === 'eliminate' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-purple-500/20 text-purple-300 border-purple-500/30'}`}>
                  {actionModalType === 'eliminate' ? <Trash2 size={22} /> : <Archive size={22} />}
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-white leading-tight">
                    {actionModalType === 'eliminate' ? `Eliminate "${modName}" from Schedule?` : `Move "${modName}" to Bench?`}
                  </h4>
                  <p className={`text-xs font-medium ${actionModalType === 'eliminate' ? 'text-red-300/90' : 'text-purple-300/90'}`}>
                    {actionModalType === 'eliminate' ? 'Active Schedule Removal • Still Available in Library' : 'Saved on Bench for Future Use'}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setActionModalType(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <div className="space-y-4 overflow-y-auto pr-1 flex-1 pb-2">
              <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs text-slate-300 leading-relaxed">
                <p>
                  {actionModalType === 'eliminate' ? (
                    <>Eliminating <strong className="text-white">{modName}</strong> removes it completely from your active daily timeline and schedule.</>
                  ) : (
                    <>Moving <strong className="text-white">{modName}</strong> to your Bench removes it from your active daily timeline while keeping it safely saved on your personal Bench.</>
                  )}
                </p>
                <p className="text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  💡 <strong className="text-teal-300">Don't worry:</strong> {actionModalType === 'eliminate' ? 'This modality will remain saved in your Protocol Library to re-add at any time.' : 'You can re-add this benched modality to your schedule anytime.'}
                </p>
              </div>

              {/* Multi-Select Common Reasons (0 to All) */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider block">
                  Why are you {actionModalType === 'eliminate' ? 'eliminating' : 'benching'} this modality? (Select 0 or more)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ELIMINATION_REASON_OPTIONS.map((opt) => {
                    const isSelected = selectedReasons.includes(opt.label)
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => toggleReason(opt.label)}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between text-xs font-semibold transition-all cursor-pointer active:scale-95 touch-manipulation ${
                          isSelected
                            ? actionModalType === 'eliminate'
                              ? 'bg-red-950/90 border-red-500 text-white ring-1 ring-red-500/60 shadow-md'
                              : 'bg-purple-950/90 border-purple-500 text-white ring-1 ring-purple-500/60 shadow-md'
                            : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate pr-1">
                          <span>{opt.icon}</span>
                          <span className="truncate">{opt.label}</span>
                        </span>
                        {isSelected && (
                          <span className={`w-4 h-4 rounded-full text-white flex items-center justify-center shrink-0 ${actionModalType === 'eliminate' ? 'bg-red-500' : 'bg-purple-500'}`}>
                            <Check size={10} />
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Custom Notes Field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 block">
                  Additional Notes or Explanation (Optional)
                </label>
                <textarea
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="e.g. Taking a break for travel; switching to Berberine..."
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/80 transition"
                />
              </div>
            </div>

            {/* Action Toolbar (Sticky at bottom of modal to ensure buttons are NEVER covered) */}
            <div className="flex flex-col gap-2.5 pt-3 border-t border-slate-800 bg-slate-950 shrink-0">
              {/* Full Width Primary Action with 0.5s confirmation state */}
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={actionSuccess !== null}
                className={`w-full py-3 px-4 rounded-xl font-extrabold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-95 touch-manipulation ${
                  actionSuccess
                    ? 'bg-emerald-600 text-white shadow-emerald-600/30 ring-2 ring-emerald-400'
                    : actionModalType === 'eliminate'
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
                }`}
              >
                {actionSuccess === 'eliminate' ? (
                  <>
                    <Check size={16} className="stroke-[3]" /> Eliminated (Saved in Library)
                  </>
                ) : actionSuccess === 'bench' ? (
                  <>
                    <Check size={16} className="stroke-[3]" /> Moved to Bench
                  </>
                ) : actionModalType === 'eliminate' ? (
                  <>
                    <Trash2 size={15} /> Confirm Elimination (Kept in Library)
                  </>
                ) : (
                  <>
                    <Archive size={15} /> Confirm Move to Bench
                  </>
                )}
              </button>

              {/* Side-by-Side Cancel & Secondary Alternative */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActionModalType(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer text-center active:scale-95 touch-manipulation"
                >
                  Cancel
                </button>

                {actionModalType === 'eliminate' ? (
                  <button
                    type="button"
                    onClick={() => setActionModalType('bench')}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-purple-950/90 hover:bg-purple-900 text-purple-200 font-bold text-xs border border-purple-700/80 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95 touch-manipulation"
                  >
                    <Archive size={14} /> Move to Bench Instead
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActionModalType('eliminate')}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-red-950/90 hover:bg-red-900 text-red-200 font-bold text-xs border border-red-700/80 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95 touch-manipulation"
                  >
                    <Trash2 size={14} /> Eliminate (Kept in Library) Instead
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Top Header: Title, Category Badge, and Close Button */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            {task.lineages && task.lineages.length > 0 ? (
              task.lineages.map((lineage, idx) => (
                <Link
                  key={idx}
                  href={`/protocols/${encodeURIComponent(lineage.protocol_id || lineage.protocol_name)}`}
                  className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md border hover:brightness-125 hover:scale-105 transition-all flex items-center gap-1 group"
                  style={{
                    backgroundColor: `${lineage.color_hex || colorHex}25`,
                    borderColor: lineage.color_hex || colorHex,
                    color: '#FFFFFF'
                  }}
                  title={`View full ${lineage.protocol_name} protocol focus view`}
                >
                  <span>{lineage.protocol_name}</span>
                  <ExternalLink size={10} className="opacity-70 group-hover:opacity-100" />
                </Link>
              ))
            ) : (
              <Link
                href={`/protocols/${encodeURIComponent(task.protocol_step?.protocol_id || task.protocol_step?.protocol?.name || protoNames)}`}
                className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md border hover:brightness-125 hover:scale-105 transition-all flex items-center gap-1 group"
                style={{ 
                  backgroundColor: `${colorHex}25`, 
                  borderColor: colorHex, 
                  color: '#FFFFFF' 
                }}
                title={`View full ${protoNames} protocol focus view`}
              >
                <span>{protoNames}</span>
                <ExternalLink size={10} className="opacity-70 group-hover:opacity-100" />
              </Link>
            )}
            <span className="text-[10px] font-semibold text-slate-300 bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded-md">
              {catName}
            </span>
            {mod.cadence_layer && (
              <span className="text-[10px] font-semibold text-purple-300 bg-purple-950/80 border border-purple-800/80 px-2.5 py-0.5 rounded-md uppercase">
                {mod.cadence_layer}
              </span>
            )}
          </div>

          <h3 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight">
            {modName}
          </h3>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all cursor-pointer shrink-0"
          title="Close expanded details"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Mandatory Dosing Parameters Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Exact Dosing / Protocol</span>
          <p className="text-xs font-mono font-bold text-teal-300 mt-0.5 truncate">
            {mod.dose_or_exposure || task.timing_slot || 'Standard Dosing'}
          </p>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Temperature / Spec</span>
          <p className="text-xs font-mono font-bold text-cyan-300 mt-0.5 truncate">
            {(mod as any).temperature || 'Ambient / N/A'}
          </p>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Duration & Frequency</span>
          <p className="text-xs font-mono font-bold text-purple-300 mt-0.5 truncate">
            {(mod as any).duration || 'Session'} • {mod.frequency || 'Scheduled'}
          </p>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Execution Status</span>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isDone ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className={`text-xs font-bold ${isDone ? 'text-emerald-400' : 'text-amber-300'}`}>
              {isDone ? 'Completed Today' : task.status === 'snoozed' ? 'Snoozed' : 'Pending'}
            </span>
          </div>
        </div>
      </div>

      {/* EXPANDABLE STEP-BY-STEP EXECUTION GUIDE & TIMESTAMPED VIDEO DEMO */}
      {(() => {
        const vidInfo = getModalityVideoInfo(mod.id, mod.category, modName)
        return (
          <ModalityExecutionGuide
            instructions={instructionsText}
            youtubeVideoId={vidInfo?.youtubeVideoId}
            videoStartSeconds={vidInfo?.videoStartSeconds}
            videoTitle={vidInfo?.videoTitle}
            modalityName={modName}
            briefDescription={mod.brief_description || mod.headline_benefit}
            doseOrExposure={mod.dose_or_exposure}
            timingSummary={mod.timing_summary}
            defaultOpen={true}
          />
        )
      })()}

      {/* Synergies & Stacking / Antagonisms Grid (Side-by-Side on Desktop) */}
      {(synergyData || antagonismData) && (
        <div className={`grid grid-cols-1 ${synergyData && antagonismData ? 'lg:grid-cols-2' : ''} gap-3.5`}>
          {synergyData && (
            <div className="bg-emerald-950/20 border border-emerald-500/30 p-3.5 rounded-xl space-y-1">
              <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider block flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Known Synergies & Stacking Protocol
              </span>
              {synergyData.pairsWith && (
                <p className="text-xs font-bold text-emerald-200">
                  Pairs well with: <span className="text-white font-normal">{synergyData.pairsWith}</span>
                </p>
              )}
              <p className="text-xs text-emerald-100/90 leading-relaxed">
                {synergyData.rationale}
              </p>
            </div>
          )}

          {antagonismData && (
            <div className="bg-red-950/20 border border-red-500/30 p-3.5 rounded-xl space-y-1">
              <span className="text-[10px] font-extrabold text-red-400 uppercase tracking-wider block flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Timing Conflicts & Contraindications
              </span>
              {antagonismData.avoidWith && (
                <p className="text-xs font-bold text-red-200">
                  Avoid combining with: <span className="text-white font-normal">{antagonismData.avoidWith}</span>
                </p>
              )}
              <p className="text-xs text-red-100/90 leading-relaxed">
                {antagonismData.rationale}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Full Geek Mode Science & PubMed Literature Section */}
      <div className="border-t border-slate-800 pt-2 space-y-3">
        <button
          onClick={() => setShowGeekMode(!showGeekMode)}
          className="text-xs text-purple-400 hover:text-purple-300 font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Microscope className="w-4 h-4 text-purple-400" />
          <span>{showGeekMode ? 'Hide Geek Mode Science Specs' : 'Expand Geek Mode Science, Evidence & PubMed Papers'}</span>
          {showGeekMode ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showGeekMode && (
          <div className="bg-slate-900/90 border border-purple-900/50 p-4 rounded-xl space-y-4 animate-in fade-in duration-150">
            {/* Evidence & Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-black/40 p-3 rounded-lg border border-slate-800">
              <div>
                <span className="text-[9px] text-slate-400 uppercase block font-bold">Evidence Quality</span>
                <span className="text-xs font-bold text-white">
                  {mod.evidence_quality ? `${mod.evidence_quality}/5 (Verified)` : 'High Evidence'}
                </span>
              </div>

              <div>
                <span className="text-[9px] text-slate-400 uppercase block font-bold">Effect Size</span>
                <span className="text-xs font-bold text-white capitalize">
                  {mod.effect_size_estimate || 'Moderate - High'}
                </span>
              </div>

              <div>
                <span className="text-[9px] text-slate-400 uppercase block font-bold">Safety Level</span>
                <span className="text-xs font-bold text-emerald-400 capitalize">
                  {mod.safety_level?.replace('_', ' ') || 'General Public Safe'}
                </span>
              </div>

              <div>
                <span className="text-[9px] text-slate-400 uppercase block font-bold">Effort & Cost</span>
                <span className="text-xs font-bold text-white capitalize">
                  {mod.cost_tier || 'Minimal Cost'} • {mod.effort_level?.replace('_', ' ') || 'Moderate Effort'}
                </span>
              </div>
            </div>

            {/* 🧬 Clinical Longevity Evidence Drawer (Collapsed by default in Geek Mode) */}
            <ModalityLongevityDrawer modality={mod} defaultExpanded={false} />

            {/* Detailed Mechanism & PubMed Citations Grid on Desktop */}
            <div className={`grid grid-cols-1 ${mod.mechanism_of_action && refs.length > 0 ? 'lg:grid-cols-2' : ''} gap-4`}>
              {/* Mechanism of Action */}
              {mod.mechanism_of_action && (
                <div className="space-y-1 bg-black/30 p-3 rounded-xl border border-white/5">
                  <span className="text-[10px] font-extrabold text-purple-300 uppercase tracking-wider block">
                    Mechanism of Action
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {mod.mechanism_of_action}
                  </p>
                </div>
              )}

              {/* PubMed & Source Material Links */}
              {refs.length > 0 && (
                <div className="space-y-2 bg-black/30 p-3 rounded-xl border border-white/5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-cyan-400" /> Source Material & PubMed Citations
                  </span>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
                    {refs.map((ref: any, idx: number) => {
                      const title = typeof ref === 'string' ? ref : ref.title || ref.citation || `PubMed Research #${idx + 1}`
                      const url = typeof ref === 'object' ? (ref.url || ref.pubmed_url || `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(modName)}`) : `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(modName)}`

                      return (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/60 text-xs text-cyan-300 hover:text-cyan-200 transition-all group"
                        >
                          <span className="truncate pr-2 font-medium">{title}</span>
                          <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-75 group-hover:opacity-100" />
                        </a>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Expandable Disclaimer Button */}
            <div className="pt-2 border-t border-slate-800/80">
              <MedicalDisclaimerBanner
                modalityCategory={mod?.category}
                modalityName={mod?.display_name || mod?.name}
              />
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons Toolbar with Move to Bench & Eliminate Entirely */}
      <div className="flex items-center gap-2 pt-2 flex-wrap border-t border-slate-800">
        {onTaskStatusChange && (
          <button
            onClick={() => onTaskStatusChange(task.id, isDone ? 'pending' : 'completed')}
            className={`py-2 px-4 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
              isDone
                ? 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isDone ? 'Mark Pending' : 'Complete Step'}</span>
          </button>
        )}

        {/* Move to Bench Button (Opens Confirmation Modal with Reason Pills) */}
        <button
          onClick={() => setActionModalType('bench')}
          className="py-2 px-3.5 rounded-xl bg-purple-950/90 hover:bg-purple-900 text-purple-200 font-bold text-xs border border-purple-700/80 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          title="Move modality to Bench with custom confirmation"
        >
          <Archive className="w-3.5 h-3.5" />
          <span>Move to Bench</span>
        </button>

        {/* Eliminate Button (Opens Confirmation Modal with Reason Pills) */}
        <button
          onClick={() => setActionModalType('eliminate')}
          className="py-2 px-3.5 rounded-xl bg-red-950/90 hover:bg-red-900 text-red-200 font-bold text-xs border border-red-700/80 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          title="Eliminates from active schedule. Still available in Library anytime."
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Eliminate (Kept in Library)</span>
        </button>

        {onOpenRescheduleModal && (
          <button
            onClick={() => onOpenRescheduleModal(task)}
            className="py-2 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-purple-300 font-bold text-xs border border-purple-800/60 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reschedule / Skip</span>
          </button>
        )}

        {onOpenDosageModal && mod && (
          <button
            onClick={() => onOpenDosageModal(mod)}
            className="py-2 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 font-bold text-xs border border-cyan-800/60 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Customize Dosage</span>
          </button>
        )}

        <button
          onClick={onClose}
          className="py-2 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-xs border border-slate-800 transition-all cursor-pointer ml-auto"
        >
          Collapse Details
        </button>
      </div>
    </div>
  )
}
