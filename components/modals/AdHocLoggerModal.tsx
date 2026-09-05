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
  Inbox, 
  ChevronRight, 
  Zap, 
  Tag, 
  Dumbbell, 
  Pill, 
  Flame, 
  Moon, 
  Brain, 
  Apple, 
  Stethoscope,
  Info
} from 'lucide-react'
import { Modality, UserBenchItem, DailyProtocolTask } from '@/lib/types'
import { 
  getModalities, 
  logAdHocSession, 
  createDailyTaskWithDetails, 
  moveModalityToBench, 
  createCustomModality 
} from '@/lib/data'

type AdHocLoggerModalProps = {
  isOpen: boolean
  onClose: () => void
  localUserId: string
  onLogged: () => void
  benchItems: UserBenchItem[]
  todayTasks: DailyProtocolTask[]
  dateStr?: string
}

type DestinationTab = 'one_off' | 'today' | 'bench'

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
  dateStr
}: AdHocLoggerModalProps) {
  const [allModalities, setAllModalities] = useState<Modality[]>([])
  const [query, setQuery] = useState('')
  const [selectedModality, setSelectedModality] = useState<Modality | null>(null)
  
  // Custom Modality Creation Form state
  const [isCreatingCustom, setIsCreatingCustom] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customCategory, setCustomCategory] = useState('Supplements & Nootropics')
  const [customTimingSlot, setCustomTimingSlot] = useState('morning')
  const [customDose, setCustomDose] = useState('')
  const [customNotes, setCustomNotes] = useState('')
  
  // Destination tab: one_off | today | bench
  const [activeTab, setActiveTab] = useState<DestinationTab>('today')
  
  // Precision metrics inputs
  const now = new Date()
  const nowStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  const [timeStr, setTimeStr] = useState(nowStr)
  const [timingSlot, setTimingSlot] = useState('morning')
  const [doseText, setDoseText] = useState('')
  const [contextNotes, setContextNotes] = useState('')
  const [waterMl, setWaterMl] = useState<number | ''>('')
  const [setsReps, setSetsReps] = useState('')
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Load catalog on open
  useEffect(() => {
    if (isOpen) {
      getModalities().then(mods => {
        setAllModalities(mods || [])
      })
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    } else {
      // Reset state
      setQuery('')
      setSelectedModality(null)
      setIsCreatingCustom(false)
      setActiveTab('today')
      setTimeStr(nowStr)
      setDoseText('')
      setContextNotes('')
      setWaterMl('')
      setSetsReps('')
      setIsSubmitting(false)
    }
  }, [isOpen])

  // When modality is selected, infer default parameters
  useEffect(() => {
    if (selectedModality) {
      setDoseText(selectedModality.dose_or_exposure || '')
      const slot = selectedModality.default_timing_slot?.toLowerCase() || 'anytime'
      if (['morning', 'afternoon', 'evening', 'pre_bed', 'anytime'].includes(slot)) {
        setTimingSlot(slot)
      } else {
        setTimingSlot('morning')
      }
    }
  }, [selectedModality])

  // Live real-time filtered results on each keystroke
  const filteredModalities = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      // Show suggestions from bench or popular items if search is empty
      const benchModIds = new Set(benchItems.map(b => b.modality_id))
      const benchList = allModalities.filter(m => benchModIds.has(m.id))
      if (benchList.length > 0) return benchList.slice(0, 10)
      return allModalities.slice(0, 10)
    }

    return allModalities.filter(m => {
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
    }).sort((a, b) => {
      const aName = a.name.toLowerCase()
      const bName = b.name.toLowerCase()
      const aStarts = aName.startsWith(q)
      const bStarts = bName.startsWith(q)
      if (aStarts && !bStarts) return -1
      if (!aStarts && bStarts) return 1
      return aName.localeCompare(bName)
    })
  }, [query, allModalities, benchItems])

  // Check if current query is an exact match for an existing modality
  const exactMatchExists = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return false
    return allModalities.some(m => m.name.toLowerCase() === q || m.display_name?.toLowerCase() === q)
  }, [query, allModalities])

  // Handle custom modality creation
  const handleCreateCustom = async () => {
    if (!customName.trim()) return
    setIsSubmitting(true)
    try {
      const created = await createCustomModality(localUserId, {
        name: customName.trim(),
        category: customCategory,
        default_timing_slot: customTimingSlot,
        dose_or_exposure: customDose.trim() || undefined,
        brief_description: customNotes.trim() || 'Custom user-created modality'
      })

      if (created) {
        setAllModalities(prev => [created, ...prev])
        setSelectedModality(created)
        setIsCreatingCustom(false)
      }
    } catch (e) {
      console.error('Error creating custom modality:', e)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle execution / destination submission
  const handleSubmitAction = async (completeImmediately: boolean = false) => {
    if (!selectedModality) return
    setIsSubmitting(true)

    const effectiveDate = dateStr || new Date().toISOString().split('T')[0]
    const executionDetails: any = {}
    if (doseText.trim()) executionDetails.actual_dose = doseText.trim()
    if (contextNotes.trim()) executionDetails.notes = contextNotes.trim()
    if (waterMl !== '') executionDetails.water_oz = Number((Number(waterMl) / 29.5735).toFixed(1))
    if (setsReps.trim()) executionDetails.sets_reps = setsReps.trim()

    try {
      if (activeTab === 'one_off') {
        // Mode 1: Log One-Off Completed Session
        const [hours, minutes] = timeStr.split(':')
        const logDate = new Date()
        logDate.setHours(parseInt(hours || '12', 10), parseInt(minutes || '0', 10), 0, 0)
        
        await logAdHocSession(
          localUserId, 
          selectedModality.id, 
          logDate.toISOString(), 
          Object.keys(executionDetails).length > 0 ? executionDetails : undefined
        )
      } else if (activeTab === 'today') {
        // Mode 2: Add to Today's Timeline (either Pending or Immediately Completed!)
        const status = completeImmediately ? 'completed' : 'pending'
        const completedAt = completeImmediately ? new Date().toISOString() : undefined

        await createDailyTaskWithDetails(
          localUserId,
          effectiveDate,
          selectedModality.id,
          timingSlot,
          status,
          completedAt,
          Object.keys(executionDetails).length > 0 ? executionDetails : undefined
        )
      } else if (activeTab === 'bench') {
        // Mode 3: Park on User Bench
        await moveModalityToBench(localUserId, selectedModality.id)
      }

      onLogged()
      onClose()
    } catch (err) {
      console.error('Error processing modality action:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" 
        onClick={onClose} 
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh] z-10">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Zap size={18} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight">
                {isCreatingCustom 
                  ? 'Create Custom Modality' 
                  : selectedModality 
                    ? 'Configure Modality' 
                    : 'Add / Log Modality'}
              </h2>
              <p className="text-xs text-slate-400">
                {isCreatingCustom 
                  ? 'Define your custom protocol component' 
                  : selectedModality 
                    ? selectedModality.name 
                    : 'Search 150+ evidence-based longevity modalities'}
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
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          
          {/* VIEW 1: SEARCH & SELECTION */}
          {!selectedModality && !isCreatingCustom && (
            <div className="space-y-4">
              {/* Search Box */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Type modality name (e.g. Cold Plunge, Creatine, Zone 2, Glycine)..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-black/50 border border-slate-700/80 rounded-2xl pl-11 pr-10 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all shadow-inner"
                />
                {query && (
                  <button 
                    onClick={() => setQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Create Custom Modality Banner if query is typed */}
              {query.trim().length > 0 && !exactMatchExists && (
                <div 
                  onClick={() => {
                    setCustomName(query.trim())
                    setIsCreatingCustom(true)
                  }}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-purple-950/40 border border-purple-500/40 hover:border-purple-400 cursor-pointer group transition-all shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 group-hover:scale-110 transition-transform">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-purple-200">
                        Create Custom Modality: <span className="text-white font-extrabold underline decoration-purple-400">{query.trim()}</span>
                      </div>
                      <div className="text-[11px] text-purple-300/70">
                        Can't find it in library? Add your custom dose, timing, and category.
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-purple-400 group-hover:translate-x-1 transition-transform shrink-0" />
                </div>
              )}

              {/* Search Results List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400 px-1">
                  <span>{query.trim() ? `Matching Modalities (${filteredModalities.length})` : 'Popular & Bench Recommendations'}</span>
                  {!query.trim() && (
                    <button
                      onClick={() => setIsCreatingCustom(true)}
                      className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 normal-case text-xs sm:text-sm cursor-pointer"
                    >
                      <Plus size={15} /> Custom Modality
                    </button>
                  )}
                </div>

                {filteredModalities.length === 0 ? (
                  <div className="text-center py-8 px-4 rounded-2xl bg-black/30 border border-slate-800 space-y-3">
                    <p className="text-sm sm:text-base text-slate-300">No matching library modalities for <span className="text-white font-bold">"{query}"</span></p>
                    <button
                      onClick={() => {
                        setCustomName(query.trim())
                        setIsCreatingCustom(true)
                      }}
                      className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer shadow-lg shadow-purple-900/30"
                    >
                      <Plus size={16} /> Create "{query.trim()}" as Custom Modality
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {filteredModalities.map(mod => {
                      const isOnBench = benchItems.some(b => b.modality_id === mod.id)
                      const isScheduledToday = todayTasks.some(t => t.modality_id === mod.id || t.protocol_step?.modality_id === mod.id)

                      return (
                        <div
                          key={mod.id}
                          onClick={() => setSelectedModality(mod)}
                          className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-slate-950/60 border border-slate-800/90 hover:border-slate-600 hover:bg-slate-800/60 transition-all cursor-pointer group text-left"
                        >
                          <div className="space-y-1.5 flex-1 min-w-0 pr-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm sm:text-base font-extrabold text-white group-hover:text-emerald-400 transition-colors truncate">
                                {mod.name}
                              </span>
                              {mod.category && (
                                <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                                  {mod.category}
                                </span>
                              )}
                              {isOnBench && (
                                <span className="text-xs px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/60 font-bold">
                                  On Bench
                                </span>
                              )}
                              {isScheduledToday && (
                                <span className="text-xs px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-bold">
                                  Scheduled Today
                                </span>
                              )}
                            </div>

                            {mod.dose_or_exposure && (
                              <div className="text-xs sm:text-sm text-emerald-400 font-mono font-bold truncate">
                                Standard Dose: {mod.dose_or_exposure}
                              </div>
                            )}

                            {mod.brief_description && (
                              <p className="text-xs sm:text-sm text-slate-300 line-clamp-1 leading-relaxed">
                                {mod.brief_description}
                              </p>
                            )}
                          </div>

                          <div className="w-9 h-9 rounded-xl bg-white/5 group-hover:bg-emerald-500/20 text-slate-300 group-hover:text-emerald-300 flex items-center justify-center shrink-0 transition-colors">
                            <Plus size={18} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW 2: CUSTOM MODALITY BUILDER */}
          {isCreatingCustom && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
              <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase tracking-wider">
                  <Sparkles size={14} /> New Custom Longevity Modality
                </div>
                
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Modality Name *</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Red Light Therapy Bed, Liposomal Apigenin"
                    className="w-full bg-black/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Category</label>
                    <select
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full bg-black/60 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    >
                      {CATEGORY_OPTIONS.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Default Timing Archetype</label>
                    <select
                      value={customTimingSlot}
                      onChange={(e) => setCustomTimingSlot(e.target.value)}
                      className="w-full bg-black/60 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 capitalize"
                    >
                      <option value="morning">Morning</option>
                      <option value="afternoon">Afternoon</option>
                      <option value="evening">Evening</option>
                      <option value="pre_bed">Pre-Bed</option>
                      <option value="anytime">Anytime</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Default Dose / Protocol Instructions (Optional)</label>
                  <input
                    type="text"
                    value={customDose}
                    onChange={(e) => setCustomDose(e.target.value)}
                    placeholder="e.g. 500mg with 1 tbsp EVOO / 20 mins at 660nm"
                    className="w-full bg-black/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreatingCustom(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateCustom}
                  disabled={!customName.trim() || isSubmitting}
                  className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-lg shadow-purple-900/40 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Creating...' : 'Save & Configure'}
                </button>
              </div>
            </div>
          )}

          {/* VIEW 3: CONFIGURE & EXECUTE SELECTED MODALITY */}
          {selectedModality && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
              {/* Selected Modality Card */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 flex items-start justify-between gap-4 shadow-md">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-extrabold text-white">
                      {selectedModality.name}
                    </span>
                    {selectedModality.category && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                        {selectedModality.category}
                      </span>
                    )}
                  </div>
                  {selectedModality.dose_or_exposure && (
                    <div className="text-xs text-emerald-400 font-mono">
                      Target: {selectedModality.dose_or_exposure}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedModality(null)}
                  className="text-xs text-slate-400 hover:text-emerald-400 transition-colors font-semibold underline cursor-pointer"
                >
                  Change
                </button>
              </div>

              {/* Destination Mode Selector Tabs */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Action Destination
                </label>
                <div className="grid grid-cols-3 gap-2 bg-black/60 p-1.5 rounded-2xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveTab('today')}
                    className={`py-2.5 px-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      activeTab === 'today'
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Calendar size={14} />
                    <span>Add to Today</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('one_off')}
                    className={`py-2.5 px-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      activeTab === 'one_off'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Zap size={14} />
                    <span>Log Session Now</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('bench')}
                    className={`py-2.5 px-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      activeTab === 'bench'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Save to Bench to hold/research without adding to today's timeline"
                  >
                    <Inbox size={14} />
                    <span>Save to Bench</span>
                  </button>
                </div>
              </div>

              {/* TAB CONTENT A: ADD TO TODAY'S SCHEDULE */}
              {activeTab === 'today' && (
                <div className="space-y-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      Schedule Timing Slot
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                      {(['morning', 'afternoon', 'evening', 'pre_bed', 'anytime'] as const).map(slot => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setTimingSlot(slot)}
                          className={`py-2 px-1 rounded-xl text-xs font-bold capitalize transition-all border cursor-pointer ${
                            timingSlot === slot
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-sm'
                              : 'bg-black/40 text-slate-400 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {slot === 'pre_bed' ? 'Pre-Bed' : slot}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Dose / Exposure Details</label>
                      <input
                        type="text"
                        value={doseText}
                        onChange={(e) => setDoseText(e.target.value)}
                        placeholder="e.g. 5g in water / 3 mins @ 50°F"
                        className="w-full bg-black/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Optional Execution Context</label>
                      <input
                        type="text"
                        value={contextNotes}
                        onChange={(e) => setContextNotes(e.target.value)}
                        placeholder="e.g. Fasted, pre-workout, with dinner"
                        className="w-full bg-black/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Dual Execution Choices: Pending vs Complete Right Now */}
                  <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleSubmitAction(false)}
                      disabled={isSubmitting}
                      className="w-full py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs transition-colors border border-slate-700 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Calendar size={15} />
                      <span>Add to Schedule (Pending)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSubmitAction(true)}
                      disabled={isSubmitting}
                      className="w-full py-3 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Check size={16} className="text-emerald-200 stroke-[3]" />
                      <span>Add & Complete Now</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB CONTENT B: LOG ONE-OFF SESSION NOW */}
              {activeTab === 'one_off' && (
                <div className="space-y-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1">
                        <Clock size={14} className="text-purple-400" /> Time Completed
                      </label>
                      <input
                        type="time"
                        value={timeStr}
                        onChange={(e) => setTimeStr(e.target.value)}
                        className="w-full bg-black/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Dose / Protocol Details</label>
                      <input
                        type="text"
                        value={doseText}
                        onChange={(e) => setDoseText(e.target.value)}
                        placeholder="e.g. 500mg / 15 mins"
                        className="w-full bg-black/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Session Context & Notes</label>
                    <input
                      type="text"
                      value={contextNotes}
                      onChange={(e) => setContextNotes(e.target.value)}
                      placeholder="e.g. Completed after morning lift, felt energized"
                      className="w-full bg-black/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => handleSubmitAction(true)}
                      disabled={isSubmitting}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-purple-900/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Zap size={16} />
                      <span>{isSubmitting ? 'Logging Session...' : 'Log Completed Session'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB CONTENT C: SAVE TO BENCH */}
              {activeTab === 'bench' && (
                <div className="space-y-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-800/50 text-xs text-blue-300 space-y-1.5">
                    <div className="font-bold flex items-center gap-1.5 text-blue-200">
                      <Inbox size={15} /> Save to Research Bench (Hold for Later)
                    </div>
                    <p className="text-blue-200/80 text-[11px] leading-relaxed">
                      This saves <strong>{selectedModality.name}</strong> directly to your personal <strong>Bench tab</strong> so you can track research, trial notes, and doses without adding it to today's schedule. You can activate or swap it into your daily protocols anytime.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => handleSubmitAction(false)}
                      disabled={isSubmitting}
                      className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Inbox size={16} />
                      <span>{isSubmitting ? 'Saving to Bench...' : 'Save Modality to Bench'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
