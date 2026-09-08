'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { 
  X, 
  Search, 
  Clock, 
  Plus, 
  Sparkles, 
  Check, 
  Calendar, 
  Zap, 
  Tag, 
  ChevronRight, 
  CheckCircle2,
  Bookmark,
  Layers,
  ArrowRight,
  Flame,
  Droplets,
  Pill,
  Moon,
  Wind
} from 'lucide-react'
import { Modality, UserBenchItem, DailyProtocolTask } from '@/lib/types'
import { 
  getModalities, 
  createDailyTaskWithDetails, 
  createCustomModality,
  logAsNeededCompletedSession,
  upsertBenchItemOverride
} from '@/lib/data'
import ModalityIcon from '@/components/ui/ModalityIcon'

type AdHocLoggerModalProps = {
  isOpen: boolean
  onClose: () => void
  localUserId: string
  onLogged: () => void
  benchItems: UserBenchItem[]
  todayTasks: DailyProtocolTask[]
  dateStr?: string
  initialTimingSlot?: string
  initialModalityId?: string
}

const CATEGORY_OPTIONS = [
  'Supplements & Nootropics',
  'Thermal & Environmental',
  'Fitness & Movement',
  'Sleep & Circadian',
  'Nutrition & Fasting',
  'Mind & Nervous System',
  'Diagnostics & Biomarkers',
  'Other'
]

export default function AdHocLoggerModal({
  isOpen,
  onClose,
  localUserId,
  onLogged,
  benchItems,
  todayTasks,
  dateStr,
  initialTimingSlot,
  initialModalityId
}: AdHocLoggerModalProps) {
  const [allModalities, setAllModalities] = useState<Modality[]>([])
  const [query, setQuery] = useState('')
  
  // Two-Tap Complete inline state (keyed by modality id)
  const [primedModalityId, setPrimedModalityId] = useState<string | null>(null)
  const [primedDose, setPrimedDose] = useState<string>('')
  const [primedSlot, setPrimedSlot] = useState<string>('anytime')
  const [primedNotes, setPrimedNotes] = useState<string>('')
  const [isLoggingId, setIsLoggingId] = useState<string | null>(null)
  const [loggedSuccessId, setLoggedSuccessId] = useState<string | null>(null)

  // Custom Modality Creation state
  const [isCreatingCustom, setIsCreatingCustom] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customCategory, setCustomCategory] = useState('Supplements & Nootropics')
  const [customTimingSlot, setCustomTimingSlot] = useState('anytime')
  const [customDose, setCustomDose] = useState('')
  const [customNotes, setCustomNotes] = useState('')
  const [isSubmittingCustom, setIsSubmittingCustom] = useState(false)

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Determine fallback circadian slot
  const currentCircadianSlot = useMemo(() => {
    if (initialTimingSlot) return initialTimingSlot
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) return 'morning'
    if (hour >= 12 && hour < 17) return 'afternoon'
    if (hour >= 17 && hour < 21) return 'evening'
    if (hour >= 21 || hour < 5) return 'pre_bed'
    return 'anytime'
  }, [initialTimingSlot])

  // Load modality catalog on open
  useEffect(() => {
    if (isOpen) {
      getModalities().then(mods => {
        setAllModalities(mods || [])
      })
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 120)
    } else {
      // Reset state on modal close
      setQuery('')
      setPrimedModalityId(null)
      setPrimedDose('')
      setPrimedSlot('anytime')
      setPrimedNotes('')
      setIsCreatingCustom(false)
      setIsLoggingId(null)
      setLoggedSuccessId(null)
    }
  }, [isOpen])

  // Pre-prime initial modality if passed (e.g. from single-row quick pill tap)
  useEffect(() => {
    if (isOpen && initialModalityId && allModalities.length > 0) {
      const target = allModalities.find(m => m.id === initialModalityId) || benchItems.find(b => b.modality_id === initialModalityId)?.modality
      if (target) {
        const benchMatch = benchItems.find(b => b.modality_id === target.id)
        setPrimedModalityId(target.id)
        setPrimedDose(benchMatch?.custom_dose || target.dose_or_exposure || 'Standard Dose')
        setPrimedSlot(currentCircadianSlot)
        setPrimedNotes(benchMatch?.notes || '')
      }
    }
  }, [isOpen, initialModalityId, allModalities, benchItems, currentCircadianSlot])

  // Map of Bench Items by modality_id for O(1) lookup
  const benchMap = useMemo(() => {
    const map = new Map<string, UserBenchItem>()
    benchItems.forEach(b => {
      if (b.modality_id) map.set(b.modality_id, b)
    })
    return map
  }, [benchItems])

  // Bench Modalities List (User's personal arsenal - strictly deduplicated)
  const userBenchModalities = useMemo(() => {
    const mods: Modality[] = []
    const seenIds = new Set<string>()
    benchItems.forEach(b => {
      const mod = b.modality || (b.modality_id ? allModalities.find(m => m.id === b.modality_id) : null)
      if (mod && !seenIds.has(mod.id)) {
        seenIds.add(mod.id)
        mods.push(mod)
      }
    })
    return mods
  }, [benchItems, allModalities])

  // Tiered Search Filtering
  const { benchMatches, libraryMatches } = useMemo(() => {
    const q = query.trim().toLowerCase()
    const benchIds = new Set(userBenchModalities.map(m => m.id))

    if (!q) {
      // Empty query: Show user's bench items first
      return {
        benchMatches: userBenchModalities,
        libraryMatches: allModalities.filter(m => !benchIds.has(m.id)).slice(0, 8)
      }
    }

    // Matching logic
    const matchesModality = (m: Modality) => {
      const name = (m.name || '').toLowerCase()
      const disp = (m.display_name || '').toLowerCase()
      const cat = (m.category || '').toLowerCase()
      const desc = (m.brief_description || '').toLowerCase()
      const dose = (m.dose_or_exposure || '').toLowerCase()

      return (
        name.includes(q) ||
        disp.includes(q) ||
        cat.includes(q) ||
        desc.includes(q) ||
        dose.includes(q)
      )
    }

    const sortFn = (a: Modality, b: Modality) => {
      const aName = a.name.toLowerCase()
      const bName = b.name.toLowerCase()
      const aStarts = aName.startsWith(q)
      const bStarts = bName.startsWith(q)
      if (aStarts && !bStarts) return -1
      if (!aStarts && bStarts) return 1
      return aName.localeCompare(bName)
    }

    const bMatches = userBenchModalities.filter(matchesModality).sort(sortFn)
    const seenLibIds = new Set<string>()
    const lMatches: Modality[] = []
    allModalities.forEach(m => {
      if (!benchIds.has(m.id) && !seenLibIds.has(m.id) && matchesModality(m)) {
        seenLibIds.add(m.id)
        lMatches.push(m)
      }
    })
    lMatches.sort(sortFn)

    return {
      benchMatches: bMatches,
      libraryMatches: lMatches
    }
  }, [query, userBenchModalities, allModalities])

  const exactMatchExists = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return false
    return allModalities.some(m => m.name.toLowerCase() === q || m.display_name?.toLowerCase() === q)
  }, [query, allModalities])

  // --------------------------------------------------------------------------
  // TWO-TAP COMPLETION HANDLER
  // Tap 1: Expands details (dose, timing, notes) & primes the button
  // Tap 2: Instantly logs the session to Today as completed
  // --------------------------------------------------------------------------
  const handleTwoTapComplete = async (mod: Modality) => {
    const isPrimed = primedModalityId === mod.id

    if (!isPrimed) {
      // CLICK 1: Prime for completion & open inline details drawer
      const benchItem = benchMap.get(mod.id)
      const defaultDose = benchItem?.custom_dose || mod.dose_or_exposure || ''
      const defaultSlot = initialTimingSlot || mod.default_timing_slot || currentCircadianSlot

      setPrimedModalityId(mod.id)
      setPrimedDose(defaultDose)
      setPrimedSlot(defaultSlot)
      setPrimedNotes(benchItem?.notes || '')
      return
    }

    // CLICK 2: Instantly execute and log completed session!
    setIsLoggingId(mod.id)
    const effectiveDate = dateStr || new Date().toISOString().split('T')[0]

    try {
      await logAsNeededCompletedSession(localUserId, mod.id, effectiveDate, {
        actual_dose: primedDose.trim() || undefined,
        timing_slot: primedSlot || currentCircadianSlot,
        notes: primedNotes.trim() || undefined
      })

      // Trigger celebration checkmark
      setLoggedSuccessId(mod.id)

      // Dispatch real-time stats update so Today's header completion bar updates
      window.dispatchEvent(new CustomEvent('levl_today_tasks_stats'))
      window.dispatchEvent(new CustomEvent('levl_task_completed', {
        detail: { modalityId: mod.id, date: effectiveDate }
      }))

      onLogged()

      // Close modal smoothly after brief visual feedback
      setTimeout(() => {
        onClose()
      }, 700)
    } catch (err) {
      console.error('Error logging As Needed session:', err)
      setIsLoggingId(null)
    }
  }

  // Handle custom modality creation & immediate log
  const handleCreateCustomAndLog = async () => {
    if (!customName.trim()) return
    setIsSubmittingCustom(true)

    try {
      const created = await createCustomModality(localUserId, {
        name: customName.trim(),
        category: customCategory,
        default_timing_slot: customTimingSlot || currentCircadianSlot,
        dose_or_exposure: customDose.trim() || undefined,
        brief_description: customNotes.trim() || 'Custom As Needed Modality'
      })

      if (created) {
        setAllModalities(prev => [created, ...prev])
        // Log immediately as completed
        const effectiveDate = dateStr || new Date().toISOString().split('T')[0]
        await logAsNeededCompletedSession(localUserId, created.id, effectiveDate, {
          actual_dose: customDose.trim() || undefined,
          timing_slot: customTimingSlot || currentCircadianSlot,
          notes: customNotes.trim() || undefined
        })

        setLoggedSuccessId(created.id)
        window.dispatchEvent(new CustomEvent('levl_today_tasks_stats'))
        onLogged()

        setTimeout(() => {
          onClose()
        }, 700)
      }
    } catch (err) {
      console.error('Error creating & logging custom modality:', err)
    } finally {
      setIsSubmittingCustom(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-3 sm:p-4 pt-[calc(env(safe-area-inset-top,0px)+16px)] pb-safe bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Modal Container */}
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[88vh] z-10">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-slate-950/70 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center justify-center font-bold shadow-[0_0_12px_rgba(245,158,11,0.25)] shrink-0">
              <Zap size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                  {isCreatingCustom ? 'Create As Needed Modality' : 'As Needed Modalities'}
                </h2>
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  AS NEEDED
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {isCreatingCustom 
                  ? 'Define your spontaneous protocol and log immediately' 
                  : 'Tap complete once to adjust details, tap again to instantly log'}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          
          {/* VIEW 1: SEARCH & RESULTS */}
          {!isCreatingCustom && (
            <div className="space-y-4">
              {/* Typeahead Search Input */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search As Needed (e.g. Electrolytes, Cold Plunge, Sauna, Melatonin)..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-black/60 border border-slate-700/80 rounded-2xl pl-11 pr-10 py-3.5 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 transition-all shadow-inner"
                />
                {query && (
                  <button 
                    onClick={() => setQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Inline Custom Creator Trigger */}
              {query.trim().length > 0 && !exactMatchExists && (
                <div 
                  onClick={() => {
                    setCustomName(query.trim())
                    setIsCreatingCustom(true)
                  }}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-500/40 hover:border-amber-400 cursor-pointer group transition-all shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 group-hover:scale-110 transition-transform">
                      <Plus size={16} className="stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-white group-hover:text-amber-200 transition-colors">
                        Create &amp; Log: <span className="text-amber-300 underline underline-offset-2 font-bold">{query.trim()}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Add as a custom As Needed modality with your dosage
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-amber-400 group-hover:translate-x-1 transition-transform shrink-0" />
                </div>
              )}

              {/* SECTION A: Bench & Previously Used Matches (Tier 1 Priority) */}
              {benchMatches.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Bookmark size={12} className="text-amber-400" />
                      <span>From Your Bench &amp; As-Needed ({benchMatches.length})</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Top Priority</span>
                  </div>

                  <div className="space-y-2">
                    {benchMatches.map(mod => {
                      const benchItem = benchMap.get(mod.id)
                      const isPrimed = primedModalityId === mod.id
                      const isLogging = isLoggingId === mod.id
                      const isLogged = loggedSuccessId === mod.id

                      return (
                        <div
                          key={mod.id}
                          className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 ${
                            isLogged
                              ? 'bg-emerald-950/80 border-emerald-500 text-white'
                              : isPrimed
                                ? 'bg-slate-950 border-amber-500/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40'
                                : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-300 shrink-0 mt-0.5">
                                <ModalityIcon modality={mod} size={18} className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-extrabold text-white truncate">
                                    {mod.display_name || mod.name}
                                  </span>
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25 font-bold">
                                    Bench
                                  </span>
                                </div>
                                <div className="text-xs text-emerald-400 font-mono font-bold mt-0.5">
                                  Dose: {benchItem?.custom_dose || mod.dose_or_exposure || 'Standard Dose'}
                                </div>
                              </div>
                            </div>

                            {/* Two-Tap Complete Button */}
                            <button
                              type="button"
                              onClick={() => handleTwoTapComplete(mod)}
                              disabled={isLogging || isLogged}
                              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm ${
                                isLogged
                                  ? 'bg-emerald-500 text-white'
                                  : isPrimed
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-md shadow-emerald-500/30 scale-[1.03] animate-pulse ring-2 ring-emerald-400/60'
                                    : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                              }`}
                            >
                              {isLogged ? (
                                <>
                                  <CheckCircle2 size={14} className="animate-bounce" />
                                  <span>Logged!</span>
                                </>
                              ) : isLogging ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : isPrimed ? (
                                <>
                                  <Check size={14} strokeWidth={3} />
                                  <span>✓ Log Now</span>
                                </>
                              ) : (
                                <>
                                  <Zap size={13} />
                                  <span>Complete</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Inline Details Drawer (Revealed on Click 1) */}
                          {isPrimed && (
                            <div className="mt-3.5 pt-3 border-t border-slate-800 space-y-2.5 animate-in fade-in slide-in-from-top-1">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                                    Dose / Exposure (Editable)
                                  </label>
                                  <input
                                    type="text"
                                    value={primedDose}
                                    onChange={(e) => setPrimedDose(e.target.value)}
                                    placeholder="e.g. 500mg, 1 packet, 3 mins"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                                  />
                                </div>

                                <div>
                                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                                    Timing Slot
                                  </label>
                                  <select
                                    value={primedSlot}
                                    onChange={(e) => setPrimedSlot(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 font-bold capitalize"
                                  >
                                    <option value="morning">🌅 Morning</option>
                                    <option value="afternoon">☀️ Afternoon</option>
                                    <option value="evening">🌆 Evening</option>
                                    <option value="pre_bed">🌙 Bedtime</option>
                                    <option value="anytime">⚡ Anytime</option>
                                  </select>
                                </div>
                              </div>

                              <div>
                                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                                  Context / Notes (Optional)
                                </label>
                                <input
                                  type="text"
                                  value={primedNotes}
                                  onChange={(e) => setPrimedNotes(e.target.value)}
                                  placeholder="e.g. Post-workout recovery, Feeling fatigued, Travel"
                                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                                />
                              </div>

                              <div className="flex items-center justify-between pt-1">
                                <span className="text-[11px] text-amber-300/80 font-medium">
                                  💡 Tap <strong>"✓ Log Now"</strong> to record session immediately
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setPrimedModalityId(null)}
                                  className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* SECTION B: Library Matches */}
              {libraryMatches.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Layers size={12} className="text-slate-400" />
                      <span>{query.trim() ? `Library Matches (${libraryMatches.length})` : 'Popular As Needed Suggestions'}</span>
                    </span>
                    {!query.trim() && (
                      <button
                        type="button"
                        onClick={() => setIsCreatingCustom(true)}
                        className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={13} /> Custom Modality
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {libraryMatches.map(mod => {
                      const isPrimed = primedModalityId === mod.id
                      const isLogging = isLoggingId === mod.id
                      const isLogged = loggedSuccessId === mod.id

                      return (
                        <div
                          key={mod.id}
                          className={`p-3.5 rounded-2xl border transition-all duration-200 ${
                            isLogged
                              ? 'bg-emerald-950/80 border-emerald-500 text-white'
                              : isPrimed
                                ? 'bg-slate-950 border-amber-500/80 shadow-lg ring-1 ring-amber-500/40'
                                : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <div className="w-9 h-9 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                                <ModalityIcon modality={mod} size={18} className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-extrabold text-white truncate">
                                    {mod.display_name || mod.name}
                                  </span>
                                  {mod.category && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                                      {mod.category}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-400 font-mono mt-0.5 truncate">
                                  Standard: {mod.dose_or_exposure || 'Standard Dose'}
                                </div>
                              </div>
                            </div>

                            {/* Two-Tap Complete Button */}
                            <button
                              type="button"
                              onClick={() => handleTwoTapComplete(mod)}
                              disabled={isLogging || isLogged}
                              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm ${
                                isLogged
                                  ? 'bg-emerald-500 text-white'
                                  : isPrimed
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-md shadow-emerald-500/30 scale-[1.03] animate-pulse ring-2 ring-emerald-400/60'
                                    : 'bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10'
                              }`}
                            >
                              {isLogged ? (
                                <>
                                  <CheckCircle2 size={14} className="animate-bounce" />
                                  <span>Logged!</span>
                                </>
                              ) : isLogging ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : isPrimed ? (
                                <>
                                  <Check size={14} strokeWidth={3} />
                                  <span>✓ Log Now</span>
                                </>
                              ) : (
                                <>
                                  <Zap size={13} />
                                  <span>Complete</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Inline Details Drawer (Revealed on Click 1) */}
                          {isPrimed && (
                            <div className="mt-3.5 pt-3 border-t border-slate-800 space-y-2.5 animate-in fade-in slide-in-from-top-1">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                                    Dose / Exposure (Editable)
                                  </label>
                                  <input
                                    type="text"
                                    value={primedDose}
                                    onChange={(e) => setPrimedDose(e.target.value)}
                                    placeholder="e.g. 500mg, 1 packet, 3 mins"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                                  />
                                </div>

                                <div>
                                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                                    Timing Slot
                                  </label>
                                  <select
                                    value={primedSlot}
                                    onChange={(e) => setPrimedSlot(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 font-bold capitalize"
                                  >
                                    <option value="morning">🌅 Morning</option>
                                    <option value="afternoon">☀️ Afternoon</option>
                                    <option value="evening">🌆 Evening</option>
                                    <option value="pre_bed">🌙 Bedtime</option>
                                    <option value="anytime">⚡ Anytime</option>
                                  </select>
                                </div>
                              </div>

                              <div>
                                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                                  Context / Notes (Optional)
                                </label>
                                <input
                                  type="text"
                                  value={primedNotes}
                                  onChange={(e) => setPrimedNotes(e.target.value)}
                                  placeholder="e.g. Post-workout recovery, Feeling fatigued, Travel"
                                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                                />
                              </div>

                              <div className="flex items-center justify-between pt-1">
                                <span className="text-[11px] text-amber-300/80 font-medium">
                                  💡 Tap <strong>"✓ Log Now"</strong> to record session immediately
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setPrimedModalityId(null)}
                                  className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Empty state when search yields no matches */}
              {query.trim().length > 0 && benchMatches.length === 0 && libraryMatches.length === 0 && (
                <div className="text-center py-8 px-4 rounded-2xl bg-black/40 border border-slate-800 space-y-3">
                  <p className="text-sm text-slate-300">
                    No matching modalities found for <span className="text-white font-bold">"{query}"</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomName(query.trim())
                      setIsCreatingCustom(true)
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-extrabold transition-all cursor-pointer shadow-lg shadow-amber-500/20"
                  >
                    <Plus size={16} className="stroke-[2.5]" />
                    <span>Create "{query.trim()}" As Custom</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* VIEW 2: CUSTOM AS NEEDED CREATOR */}
          {isCreatingCustom && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider">
                  <Sparkles size={14} /> New Custom As Needed Modality
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Modality Name *</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Liposomal Apigenin, Salt Bath, Cold Plunge"
                    className="w-full bg-black/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Category</label>
                    <select
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full bg-black/60 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      {CATEGORY_OPTIONS.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Default Timing</label>
                    <select
                      value={customTimingSlot}
                      onChange={(e) => setCustomTimingSlot(e.target.value)}
                      className="w-full bg-black/60 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 capitalize font-bold"
                    >
                      <option value="morning">🌅 Morning</option>
                      <option value="afternoon">☀️ Afternoon</option>
                      <option value="evening">🌆 Evening</option>
                      <option value="pre_bed">🌙 Bedtime</option>
                      <option value="anytime">⚡ Anytime</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Dose or Exposure (Optional)</label>
                  <input
                    type="text"
                    value={customDose}
                    onChange={(e) => setCustomDose(e.target.value)}
                    placeholder="e.g. 500mg, 3 mins @ 50°F, 1 packet"
                    className="w-full bg-black/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Context Notes (Optional)</label>
                  <input
                    type="text"
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    placeholder="e.g. Post-workout rehydration"
                    className="w-full bg-black/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreatingCustom(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  Back to Search
                </button>
                <button
                  type="button"
                  onClick={handleCreateCustomAndLog}
                  disabled={!customName.trim() || isSubmittingCustom}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isSubmittingCustom ? (
                    <div className="w-4 h-4 border-2 border-slate-950/40 border-t-slate-950 rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check size={15} strokeWidth={3} />
                      <span>Save &amp; Log to Today</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
