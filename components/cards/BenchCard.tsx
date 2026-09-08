'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { UserBenchItem, UserProfile } from '@/lib/types'
import { Plus, Trash2, Check, Info, Activity, User, Sparkles, ExternalLink, CheckCircle2, Zap } from 'lucide-react'
import GeekMode from './GeekMode'
import PersonalizeModalityModal from '../modals/PersonalizeModalityModal'
import { DosageDetailModal } from '../modals/DosageDetailModal'
import ManageTaskModal from '../modals/ManageTaskModal'
import { upsertBenchItemOverride, logAsNeededCompletedSession } from '@/lib/data'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { getColorForProtocol } from '@/lib/utils/categories'
import OutcomePill from '@/components/outcomes/OutcomePill'
import ModalityIcon from '../ui/ModalityIcon'

export type ProtocolTag = {
  protocol_name: string
  color_hex?: string
}

type BenchCardProps = {
  item: UserBenchItem
  userProfile?: UserProfile | null
  protocolTags?: ProtocolTag[]
  onAddToToday: (modalityId: string) => Promise<void>
  onRemove: (modalityId: string) => Promise<void>
  onSessionLogged?: () => void
}

export default function BenchCard({ item, userProfile, protocolTags = [], onAddToToday, onRemove, onSessionLogged }: BenchCardProps) {
  const router = useRouter()
  const [addedToToday, setAddedToToday] = useState(false)
  const [removed, setRemoved] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const [expanded, setExpanded] = useState(false)
  const [showGeekMode, setShowGeekMode] = useState(false)
  const [showPersonalizeModal, setShowPersonalizeModal] = useState(false)

  const [isPrimed, setIsPrimed] = useState(false)
  const [sessionLogged, setSessionLogged] = useState(false)
  const [customDoseVal, setCustomDoseVal] = useState(item.custom_dose || item.modality?.dose_or_exposure || '')
  const [timingSlotVal, setTimingSlotVal] = useState('morning')
  const [notesVal, setNotesVal] = useState(item.notes || '')

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) setTimingSlotVal('morning')
    else if (hour >= 12 && hour < 17) setTimingSlotVal('afternoon')
    else if (hour >= 17 && hour < 21) setTimingSlotVal('evening')
    else if (hour >= 21 || hour < 5) setTimingSlotVal('pre_bed')
  }, [])

  const modality = item.modality
  if (!modality) return null

  // Two-Tap Complete state for As Needed modalities
  const isAsNeeded = 
    item.schedule_config?.schedule_mode === 'as_needed' ||
    (item.custom_timing || '').toLowerCase().includes('as needed') ||
    (item.custom_timing || '').toLowerCase().includes('as-needed') ||
    (item.custom_timing || '').toLowerCase().includes('prn') ||
    (item.notes || '').toLowerCase().includes('as needed') ||
    (modality.timing_summary || '').toLowerCase().includes('as needed')

  const handleToday = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (addedToToday) {
      router.push(`/today?modality=${encodeURIComponent(modality.id)}&name=${encodeURIComponent(modality.display_name || modality.name)}`)
      return
    }
    setIsProcessing(true)
    await onAddToToday(modality.id)
    setIsProcessing(false)
    setAddedToToday(true)
  }

  // Two-Tap Complete flow for As Needed modalities:
  // Tap 1: Expands details & primes button to '✓ Complete (Click to Log Now)'
  // Tap 2: Instantly logs completed session even without modifying any details
  const handleAsNeededComplete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (sessionLogged) {
      router.push(`/today?modality=${encodeURIComponent(modality.id)}&name=${encodeURIComponent(modality.display_name || modality.name)}`)
      return
    }

    if (!isPrimed) {
      setIsPrimed(true)
      return
    }

    setIsProcessing(true)
    const localUserId = userProfile?.local_user_id || (typeof window !== 'undefined' ? localStorage.getItem('levl_local_user_id') : '') || getLocalUserId()
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    await logAsNeededCompletedSession(localUserId, modality.id, todayStr, {
      actual_dose: customDoseVal || item.custom_dose || modality.dose_or_exposure || 'Standard Dose',
      timing_slot: timingSlotVal,
      notes: notesVal
    })
    setIsProcessing(false)
    setSessionLogged(true)
    setIsPrimed(false)
    if (onSessionLogged) {
      onSessionLogged()
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('levl_tasks_updated'))
      window.dispatchEvent(new CustomEvent('levl_today_tasks_stats'))
    }
  }

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsProcessing(true)
    await onRemove(modality.id)
    setIsProcessing(false)
    setRemoved(true)
  }

  if (removed) {
    return (
      <div className="glass-card p-4 rounded-xl flex items-center justify-center text-levl-text-secondary opacity-50">
        Removed from bench
      </div>
    )
  }

  return (
    <div className="glass-card rounded-xl overflow-hidden transition-all duration-300">
      <div 
        className="p-4 cursor-pointer flex flex-col gap-3"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Protocol Lineage Badges & As-Needed Indicator */}
        {(isAsNeeded || (protocolTags && protocolTags.length > 0)) && (
          <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
            {isAsNeeded && (
              <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1 shadow-sm">
                <Zap size={11} className="text-amber-400 fill-amber-400" />
                <span>As Needed</span>
              </span>
            )}
            {protocolTags && protocolTags.map((tag, idx) => {
              const color = tag.color_hex || getColorForProtocol(tag.protocol_name)
              return (
                <Link
                  key={idx}
                  href={`/protocols/${encodeURIComponent(tag.protocol_name)}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border hover:brightness-125 hover:scale-105 transition-all cursor-pointer flex items-center gap-1 group"
                  style={{
                    backgroundColor: `${color}1A`, // 10% opacity
                    color: color,
                    borderColor: `${color}33` // 20% opacity
                  }}
                  title={`View full ${tag.protocol_name} protocol focus view`}
                >
                  <span>{tag.protocol_name}</span>
                  <ExternalLink size={9} className="opacity-70 group-hover:opacity-100" />
                </Link>
              )
            })}
          </div>
        )}

        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-start gap-2.5 min-w-0">
              <ModalityIcon modality={modality} size={20} className="shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-lg leading-tight">
                    {modality.display_name || modality.name}
                  </h3>
                  {modality.modality_type === 'prescription_supported' && (
                    <span className="text-[9px] uppercase bg-red-900/40 text-red-300 px-2 py-0.5 rounded border border-red-900/50 whitespace-nowrap">Prescription Rx</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-levl-text-secondary uppercase">{modality.category}</p>
              {modality.nba_result && (
                <div className="flex items-center gap-1 bg-levl-accent/10 border border-levl-accent/30 text-levl-accent px-1.5 py-0.5 rounded text-[10px] font-bold">
                  <Sparkles size={10} />
                  {modality.nba_result.matchPercentage}% Match
                </div>
              )}
            </div>

            {/* Dosing Details */}
            {(modality.dose_or_exposure || modality.frequency || modality.timing_summary || item.custom_dose || item.custom_timing) && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(item.custom_dose || modality.dose_or_exposure) && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono border ${item.custom_dose ? 'bg-blue-500/10 border-blue-500/20 text-blue-200 flex items-center gap-1' : 'bg-black/40 border-white/5 text-gray-300'}`}>
                    {item.custom_dose && <User size={10} className="text-blue-400" />}
                    {item.custom_dose || modality.dose_or_exposure}
                  </span>
                )}
                
                {(item.custom_timing || modality.timing_summary) && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${item.custom_timing ? 'bg-blue-500/10 border-blue-500/20 text-blue-200 flex items-center gap-1' : 'bg-white/5 border-white/5 text-gray-300'}`}>
                    {item.custom_timing ? <User size={10} className="text-blue-400" /> : '⏱️'} {item.custom_timing || modality.timing_summary}
                  </span>
                )}

                {modality.frequency && !item.custom_timing && (
                  <span className="text-[10px] bg-white/5 text-gray-300 px-1.5 py-0.5 rounded border border-white/5">
                    🔄 {modality.frequency}
                  </span>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 animate-in fade-in slide-in-from-top-2">
          <p className="text-sm text-gray-300">{modality.brief_description}</p>
          
          {modality.functional_impacts && Object.keys(modality.functional_impacts).some(k => modality.functional_impacts![k].score > 5) && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {Object.entries(modality.functional_impacts)
                .filter(([_, impact]) => impact.score > 5)
                .sort((a, b) => b[1].score - a[1].score)
                .map(([outcome, impact]) => (
                  <OutcomePill
                    key={outcome}
                    outcome={outcome}
                    score={impact.score}
                    size="sm"
                  />
                ))
              }
            </div>
          )}

          {modality.nba_result && modality.nba_result.reasons.length > 0 && (
            <div className="bg-levl-accent/5 rounded-lg p-3 border border-levl-accent/20 space-y-2">
              <h4 className="text-xs font-semibold text-levl-accent uppercase flex items-center gap-1">
                <Sparkles size={12} /> Why this is recommended for you
              </h4>
              <ul className="text-xs text-gray-300 space-y-1 pl-4 list-disc">
                {modality.nba_result.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowPersonalizeModal(true); }}
              className="flex-1 border text-xs sm:text-sm font-bold h-9 rounded-xl flex items-center justify-center gap-1.5 transition-colors bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500 hover:text-white"
            >
              <Activity size={14} /> Personalize
            </button>

            <button 
              onClick={(e) => { e.stopPropagation(); setShowGeekMode(!showGeekMode); }}
              className={`flex-1 border text-xs sm:text-sm font-bold h-9 rounded-xl flex items-center justify-center gap-1.5 transition-colors ${showGeekMode ? 'bg-levl-purple text-white border-levl-purple' : 'bg-levl-purple/10 border-levl-purple/30 text-purple-300 hover:bg-levl-purple hover:text-white'}`}
            >
              <Info size={14} /> Geek Mode
            </button>
          </div>
          
          {showGeekMode && <GeekMode modality={modality} />}
        </div>
      )}

      {showPersonalizeModal && modality && (
        <ManageTaskModal 
          isOpen={showPersonalizeModal}
          onClose={() => setShowPersonalizeModal(false)}
          modality={modality}
          benchItem={item}
          userProfile={userProfile}
          onSaveSuccess={() => {
            setShowPersonalizeModal(false)
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('levl_bench_updated'))
              window.dispatchEvent(new CustomEvent('levl_tasks_updated'))
            }
          }}
        />
      )}

      {/* As Needed Two-Tap Inline Details Drawer */}
      {isAsNeeded && isPrimed && !sessionLogged && (
        <div 
          onClick={(e) => e.stopPropagation()} 
          className="p-3.5 bg-amber-950/25 border-t border-b border-amber-500/30 space-y-2.5 animate-in fade-in slide-in-from-top-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-1">
              <Zap size={12} className="text-amber-400 fill-amber-400" />
              Log As Needed Session • Tap Complete to Confirm
            </span>
            <button
              type="button"
              onClick={() => setIsPrimed(false)}
              className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 mb-1">Dose / Exposure</label>
              <input
                type="text"
                value={customDoseVal}
                onChange={(e) => setCustomDoseVal(e.target.value)}
                placeholder={item.custom_dose || modality.dose_or_exposure || 'Standard Dose'}
                className="w-full bg-black/60 border border-amber-500/30 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 mb-1">Timing Block</label>
              <div className="flex items-center gap-1">
                {[
                  { id: 'morning', label: 'Morn' },
                  { id: 'afternoon', label: 'Aft' },
                  { id: 'evening', label: 'Eve' },
                  { id: 'pre_bed', label: 'Bed' }
                ].map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setTimingSlotVal(s.id)}
                    className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all ${
                      timingSlotVal === s.id
                        ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                        : 'bg-black/40 text-slate-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 mb-1">Context Notes (Optional)</label>
            <input
              type="text"
              value={notesVal}
              onChange={(e) => setNotesVal(e.target.value)}
              placeholder="e.g. post-workout fatigue, high stress, travel..."
              className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 p-4 pt-0 border-t border-white/5 mt-2">
        {isAsNeeded ? (
          <button 
            type="button"
            onClick={handleAsNeededComplete}
            disabled={isProcessing}
            className={`flex-1 flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all shadow-sm cursor-pointer ${
              sessionLogged
                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.15)] active:scale-95'
                : isPrimed
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-[0_0_16px_rgba(16,185,129,0.4)] animate-pulse'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
            }`}
          >
            {sessionLogged ? (
              <span className="flex items-center justify-center gap-1.5 truncate">
                <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                <span className="truncate">Logged to Today!</span>
              </span>
            ) : isPrimed ? (
              <span className="flex items-center justify-center gap-1.5 truncate">
                <Check size={16} strokeWidth={3} className="text-slate-950 shrink-0" />
                <span className="truncate">{isProcessing ? 'Logging...' : '✓ Complete (Click to Log Now)'}</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1.5 truncate">
                <Zap size={14} className="text-slate-950 fill-slate-950 shrink-0" />
                <span className="truncate">⚡ Complete</span>
              </span>
            )}
          </button>
        ) : (
          <button 
            onClick={handleToday}
            disabled={isProcessing}
            className={`flex-1 flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all shadow-sm ${
              addedToToday 
                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.15)] cursor-pointer active:scale-95' 
                : 'bg-levl-accent text-white hover:bg-levl-accent/90 shadow-md cursor-pointer'
            }`}
          >
            {addedToToday ? (
              <span className="flex items-center justify-center gap-1.5 truncate">
                <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                <span className="truncate">In Today&apos;s Plan</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1.5 truncate">
                <Plus size={15} className="shrink-0" />
                <span className="truncate">{isProcessing ? 'Adding...' : 'Add to Today'}</span>
              </span>
            )}
          </button>
        )}
        
        <button 
          onClick={handleRemove}
          disabled={isProcessing}
          className="flex-1 flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl text-xs sm:text-sm font-bold bg-rose-950/40 text-rose-300 border border-rose-500/30 hover:bg-rose-900/60 transition-colors cursor-pointer"
        >
          <Trash2 size={14} className="text-rose-400 shrink-0" />
          <span className="truncate">Remove</span>
        </button>
      </div>
    </div>
  )
}
