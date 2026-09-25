'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { Check, ChevronDown, Clock, Layers, RotateCcw } from 'lucide-react'
import { DedupedTask } from '@/components/cards/ProtocolTaskCard'
import { Modality, UserBenchItem, OutcomeDimension, UserProfile } from '@/lib/types'
import ModalityBlockTile from './ModalityBlockTile'
import {
  BlocksVisualStyle,
  BlocksLayoutMode,
  getSavedBlockSizing,
  BlockSizing
} from './blocksUtils'
import { canonicalizeTimingSlot } from '@/lib/utils/timingSlots'
import { getCachedModalitiesSync } from '@/lib/data'
import { triggerHaptic } from '@/lib/utils/haptics'
import { useTheme } from '@/lib/utils/useTheme'

interface CompletedBlocksSectionProps {
  tasks: DedupedTask[]
  allModalities?: Modality[]
  benchItems?: UserBenchItem[]
  userProfile?: UserProfile | null
  allOutcomes?: OutcomeDimension[]
  visualStyle: BlocksVisualStyle
  layoutMode: BlocksLayoutMode
  showDosing: boolean
  isEditMode: boolean
  subView: 'time' | 'protocol'
  date: string
  onOpenDetails: (task: DedupedTask) => void
  onUndoTask: (task: DedupedTask) => void
  onSwipeLeft: (task: DedupedTask) => void
}

const STORAGE_KEY_EXPANDED = 'levl_blocks_completed_expanded'
const STORAGE_KEY_GROUP_BY = 'levl_blocks_completed_group_by'

interface SlotMeta {
  key: string
  title: string
  icon: string
}

// Relative Circadian Slot Anchors (No forced/rigid clock hours!)
const CIRCADIAN_SLOT_SEQUENCE: SlotMeta[] = [
  { key: 'waking', title: 'Upon Waking', icon: '🌅' },
  { key: 'morning', title: 'Morning', icon: '☀️' },
  { key: 'breakfast', title: 'First Meal', icon: '🍽️' },
  { key: 'lunch', title: 'Lunch / Midday Meal', icon: '🥗' },
  { key: 'afternoon', title: 'Afternoon', icon: '⚡' },
  { key: 'dinner', title: 'Last Meal', icon: '🌙' },
  { key: 'bedtime', title: 'Bedtime', icon: '🛌' },
  { key: 'anytime', title: 'Anytime', icon: '⏱️' }
]

export default function CompletedBlocksSection({
  tasks,
  allModalities = [],
  benchItems = [],
  userProfile,
  allOutcomes = [],
  visualStyle,
  layoutMode,
  showDosing,
  isEditMode,
  subView,
  date,
  onOpenDetails,
  onUndoTask,
  onSwipeLeft
}: CompletedBlocksSectionProps) {
  const { theme } = useTheme()
  const isDaylight = theme === 'light'

  // Persisted accordion expanded state — COLLAPSED BY DEFAULT just like classic mode!
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    try {
      const val = localStorage.getItem(STORAGE_KEY_EXPANDED)
      if (val === 'true') return true
      if (val === 'false') return false
    } catch {}
    return false
  })

  // Persisted grouping choice inside completed section ('time' | 'protocol')
  const [groupBy, setGroupBy] = useState<'time' | 'protocol'>(() => {
    if (typeof window === 'undefined') return subView
    try {
      const val = localStorage.getItem(STORAGE_KEY_GROUP_BY)
      if (val === 'time' || val === 'protocol') return val
    } catch {}
    return subView
  })

  // Keep groupBy in sync if parent subView switches, unless explicitly overridden
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_GROUP_BY)
      if (!stored) {
        setGroupBy(subView)
      }
    } catch {}
  }, [subView])

  // External expand event listener (e.g. from top bar quick jump)
  useEffect(() => {
    const handleExternalExpand = () => {
      setIsExpanded(true)
      try {
        localStorage.setItem(STORAGE_KEY_EXPANDED, 'true')
      } catch {}
    }
    window.addEventListener('levl_expand_completed_section', handleExternalExpand)
    return () => {
      window.removeEventListener('levl_expand_completed_section', handleExternalExpand)
    }
  }, [])

  const toggleExpanded = () => {
    triggerHaptic('light')
    const nextVal = !isExpanded
    setIsExpanded(nextVal)
    try {
      localStorage.setItem(STORAGE_KEY_EXPANDED, String(nextVal))
    } catch {}
  }

  const handleSelectGroupBy = (mode: 'time' | 'protocol') => {
    triggerHaptic('light')
    setGroupBy(mode)
    try {
      localStorage.setItem(STORAGE_KEY_GROUP_BY, mode)
    } catch {}
  }

  // 1. Group tasks by Circadian Time Slot (Contextual circadian anchors, no clock hours!)
  const timeSlotGroups = useMemo(() => {
    const slotMap = new Map<string, DedupedTask[]>()
    CIRCADIAN_SLOT_SEQUENCE.forEach((s) => slotMap.set(s.key, []))

    tasks.forEach((t) => {
      const rawSlot = t.timing_slot || t.protocol_step?.timing_slot || t.loose_modality?.default_timing_slot
      const slot = canonicalizeTimingSlot(rawSlot)

      if (slot === 'waking' || rawSlot === 'waking') {
        slotMap.get('waking')!.push(t)
      } else if (slot === 'morning_routine' || slot === 'morning' || rawSlot === 'morning' || rawSlot === 'morning_routine') {
        slotMap.get('morning')!.push(t)
      } else if (slot === 'first_meal' || slot === 'pre_meal' || rawSlot === 'breakfast' || rawSlot === 'first_meal' || rawSlot === 'pre_meal') {
        slotMap.get('breakfast')!.push(t)
      } else if (slot === 'midday' || slot === 'post_meal' || rawSlot === 'lunch' || rawSlot === 'midday' || rawSlot === 'post_meal') {
        slotMap.get('lunch')!.push(t)
      } else if (slot === 'afternoon' || slot === 'late_afternoon' || rawSlot === 'afternoon' || rawSlot === 'late_afternoon') {
        slotMap.get('afternoon')!.push(t)
      } else if (slot === 'evening' || rawSlot === 'dinner' || rawSlot === 'evening') {
        slotMap.get('dinner')!.push(t)
      } else if (slot === 'wind_down' || slot === 'pre_bed' || slot === 'bedtime' || rawSlot === 'bedtime' || rawSlot === 'wind_down' || rawSlot === 'pre_bed') {
        slotMap.get('bedtime')!.push(t)
      } else {
        slotMap.get('anytime')!.push(t)
      }
    })

    return CIRCADIAN_SLOT_SEQUENCE.filter((meta) => {
      const list = slotMap.get(meta.key)
      return list && list.length > 0
    }).map((meta) => ({
      meta,
      tasks: slotMap.get(meta.key)!
    }))
  }, [tasks])

  // 2. Group tasks by Protocol
  const protocolGroups = useMemo(() => {
    const protoMap = new Map<string, DedupedTask[]>()

    tasks.forEach((t) => {
      const pName =
        t.lineages?.[0]?.protocol_name ||
        t.protocol_step?.protocol?.name ||
        (t as any).user_protocol_instance?.protocol?.name ||
        'Standalone Modalities'

      if (!protoMap.has(pName)) {
        protoMap.set(pName, [])
      }
      protoMap.get(pName)!.push(t)
    })

    return Array.from(protoMap.entries()).map(([pName, pTasks]) => ({
      protocolName: pName,
      tasks: pTasks
    }))
  }, [tasks])

  if (tasks.length === 0) return null

  // Resolve Modality Helper with safety null-checks
  const resolveModality = (task: DedupedTask) => {
    const rawTarget = (task.modality_id || task.protocol_step?.modality_id || '').toLowerCase().trim()
    return (
      task.protocol_step?.modality ||
      task.loose_modality ||
      allModalities.find((m) => m && m.id && m.id.toLowerCase().trim() === rawTarget) ||
      getCachedModalitiesSync().find((m: Modality) => m && m.id && m.id.toLowerCase().trim() === rawTarget)
    )
  }

  // Get Sizing for Task
  const getTaskSizing = (task: DedupedTask): BlockSizing => {
    const mod = resolveModality(task)
    const mId = mod?.id || task.modality_id || task.protocol_step?.modality_id || task.id
    const defaultSizing: BlockSizing =
      layoutMode === 'uniform'
        ? { width: '1/2', height: '1x' }
        : layoutMode === '1-wide'
        ? { width: 'full', height: '1x' }
        : layoutMode === '3-wide'
        ? { width: '1/3', height: '1x' }
        : { width: '1/3', height: '1x' }

    return getSavedBlockSizing(mId, defaultSizing, layoutMode)
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. COLLAPSED BAR STATE: Identical ergonomics to time blocks, collapsed by default
  // ─────────────────────────────────────────────────────────────────────────────
  if (!isExpanded) {
    return (
      <div
        id="completed-modalities-section"
        onClick={toggleExpanded}
        className={`w-full h-14 sm:h-16 px-4 sm:px-5 rounded-2xl sm:rounded-3xl border flex items-center justify-between transition-all duration-300 cursor-pointer shadow-md select-none group active:scale-[0.99] ${
          isDaylight
            ? 'bg-white border-[#E1E8E3] hover:bg-slate-50 text-[#475569] shadow-sm'
            : visualStyle === 'dark-outline'
            ? 'bg-slate-950/95 border-[2.5px] border-emerald-500/50 hover:border-emerald-400/80 shadow-xl shadow-emerald-950/30 text-white'
            : 'bg-gradient-to-r from-emerald-950/90 via-slate-950/95 to-teal-950/90 border border-emerald-400/50 hover:border-emerald-300/70 text-white'
        }`}
      >
        {/* Left: Glowing Emerald Check Icon + Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              isDaylight
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
            }`}
          >
            <Check size={16} strokeWidth={3} />
          </div>
          <span
            className={`font-extrabold text-sm sm:text-base tracking-tight truncate transition-colors ${
              isDaylight ? 'text-[#475569] group-hover:text-emerald-600' : 'group-hover:text-emerald-300'
            }`}
          >
            Completed Modalities
          </span>
        </div>

        {/* Right: Count pill + Show All / Chevron Down */}
        <div className="flex items-center gap-2.5 shrink-0">
          <span
            className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
              isDaylight
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-sm'
            }`}
          >
            {tasks.length} Completed
          </span>

          <div
            className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-xl transition-all ${
              isDaylight
                ? 'bg-slate-100 text-slate-600 group-hover:text-[#475569]'
                : 'text-emerald-400 group-hover:text-emerald-300 bg-white/5 group-hover:bg-emerald-500/20'
            }`}
          >
            <span>Show All</span>
            <ChevronDown size={15} />
          </div>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. EXPANDED CONTAINER STATE: Full block container with sub-groups and tiles
  // ─────────────────────────────────────────────────────────────────────────────
  const containerClasses = isDaylight
    ? 'border border-[#E1E8E3] bg-white shadow-md'
    : visualStyle === 'dark-outline'
    ? 'border-2 border-emerald-500/40 bg-slate-950/95 backdrop-blur-xl shadow-2xl shadow-emerald-950/40'
    : visualStyle === 'full-gradient'
    ? 'border border-emerald-400/50 bg-gradient-to-br from-emerald-950/40 via-slate-950/90 to-teal-950/30 shadow-2xl shadow-emerald-900/30 backdrop-blur-xl'
    : 'border border-emerald-500/30 bg-slate-900/70 backdrop-blur-xl shadow-xl'

  return (
    <div id="completed-modalities-section" className={`w-full rounded-3xl overflow-hidden transition-all duration-300 ${containerClasses}`}>
      {/* Accordion Header */}
      <div
        onClick={toggleExpanded}
        className={`w-full flex items-center justify-between p-3.5 sm:p-4 border-b cursor-pointer select-none group ${
          isDaylight
            ? 'bg-[#F7F9F7] border-[#E1E8E3]'
            : 'bg-gradient-to-r from-emerald-500/15 via-slate-900/70 to-emerald-500/10 border-emerald-500/20'
        }`}
      >
        {/* Left: Glowing Check Icon + Title + Count Pill */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold shrink-0 ${
              isDaylight
                ? 'bg-[#E6F3EB] text-[#2B725C]'
                : 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
            }`}
          >
            <Check size={16} strokeWidth={3} />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <h3
              className={`text-xs sm:text-sm font-black tracking-wider uppercase truncate transition-colors ${
                isDaylight
                  ? 'text-[#475569] group-hover:text-emerald-600'
                  : 'text-white group-hover:text-emerald-300'
              }`}
            >
              Completed Modalities
            </h3>
            <span
              className={`text-[11px] sm:text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${
                isDaylight
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              {tasks.length}
            </span>
          </div>
        </div>

        {/* Right: Grouping Pills & Collapse Button */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* Group By Selector (Time vs Protocol) */}
          <div
            className={`flex items-center p-0.5 rounded-full border text-[10px] sm:text-xs ${
              isDaylight
                ? 'bg-slate-100 border-slate-200'
                : 'bg-black/60 border-emerald-500/30'
            }`}
          >
            <button
              type="button"
              onClick={() => handleSelectGroupBy('time')}
              title="Group completed items by Circadian Time Slot"
              className={`px-2 sm:px-2.5 py-1 rounded-full font-bold transition-all flex items-center gap-1 cursor-pointer ${
                groupBy === 'time'
                  ? isDaylight
                    ? 'bg-white text-[#475569] shadow-sm font-extrabold'
                    : 'bg-emerald-500 text-slate-950 shadow-sm font-extrabold'
                  : isDaylight
                  ? 'text-slate-500 hover:text-[#475569]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock size={11} />
              <span className="hidden min-[420px]:inline">Time</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectGroupBy('protocol')}
              title="Group completed items by Protocol"
              className={`px-2 sm:px-2.5 py-1 rounded-full font-bold transition-all flex items-center gap-1 cursor-pointer ${
                groupBy === 'protocol'
                  ? isDaylight
                    ? 'bg-white text-[#475569] shadow-sm font-extrabold'
                    : 'bg-emerald-500 text-slate-950 shadow-sm font-extrabold'
                  : isDaylight
                  ? 'text-slate-500 hover:text-[#475569]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers size={11} />
              <span className="hidden min-[420px]:inline">Protocol</span>
            </button>
          </div>

          {/* Collapse Toggle Button */}
          <button
            type="button"
            onClick={toggleExpanded}
            className={`flex items-center gap-1 sm:gap-1.5 text-xs font-bold px-2 py-1 rounded-lg transition-all cursor-pointer ${
              isDaylight
                ? 'text-slate-500 hover:text-[#475569] hover:bg-slate-100'
                : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'
            }`}
          >
            <span className="hidden sm:inline">Hide</span>
            <ChevronDown
              size={18}
              className="transition-transform duration-200 rotate-180"
            />
          </button>
        </div>
      </div>

      {/* Expanded Content Area */}
      <div className="p-3.5 sm:p-5 space-y-6 animate-in fade-in slide-in-from-top-2">
        {/* Sub-Grouping: By Circadian Time Slot (No clock hours!) */}
        {groupBy === 'time' && (
          <div className="space-y-6">
            {timeSlotGroups.map(({ meta, tasks: slotTasks }) => (
              <div key={meta.key} className="space-y-3">
                {/* Circadian Slot Subheader Banner */}
                <div
                  className={`flex items-center justify-between px-1 pb-1.5 border-b ${
                    isDaylight ? 'border-[#E1E8E3]' : 'border-emerald-500/20'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg">{meta.icon}</span>
                    <h4
                      className={`text-xs sm:text-sm font-black tracking-tight uppercase ${
                        isDaylight ? 'text-[#475569]' : 'text-emerald-300'
                      }`}
                    >
                      {meta.title}
                    </h4>
                  </div>
                  <span
                    className={`text-[10px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
                      isDaylight
                        ? 'text-[#2B725C] bg-[#E6F3EB] border-[#2B725C]/30'
                        : 'text-emerald-400/80 bg-emerald-500/10 border-emerald-500/20'
                    }`}
                  >
                    {slotTasks.length} {slotTasks.length === 1 ? 'completed' : 'completed'}
                  </span>
                </div>

                {/* Grid of Completed Modality Tiles in this slot */}
                <div className="grid grid-cols-12 gap-2.5 sm:gap-3.5">
                  {slotTasks.map((task) => {
                    const mod = resolveModality(task)
                    const mId = mod?.id || task.modality_id || task.protocol_step?.modality_id || ''
                    const bench = benchItems.find((b) => b.modality_id === mId)
                    const sizing = getTaskSizing(task)

                    return (
                      <ModalityBlockTile
                        key={`completed_${task.id}`}
                        task={task}
                        modality={mod}
                        benchItem={bench}
                        sizing={sizing}
                        visualStyle={visualStyle}
                        layoutMode={layoutMode}
                        showDosing={showDosing}
                        currentSlotKey={meta.key}
                        isEditMode={isEditMode}
                        isIgnited={true}
                        onOpenDetails={() => onOpenDetails(task)}
                        onToggleComplete={() => onUndoTask(task)}
                        onSwipeRight={() => onUndoTask(task)}
                        onSwipeLeft={() => onSwipeLeft(task)}
                        onResize={() => {}}
                        onLongPress={() => {}}
                      />
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sub-Grouping: By Protocol */}
        {groupBy === 'protocol' && (
          <div className="space-y-6">
            {protocolGroups.map(({ protocolName, tasks: pTasks }) => (
              <div key={protocolName} className="space-y-3">
                {/* Protocol Subheader Banner */}
                <div
                  className={`flex items-center justify-between px-1 pb-1.5 border-b ${
                    isDaylight ? 'border-[#E1E8E3]' : 'border-emerald-500/20'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center text-xs ${
                        isDaylight
                          ? 'bg-[#F0ECF9] text-[#765DB4]'
                          : 'bg-purple-500/20 border border-purple-500/40 text-purple-300'
                      }`}
                    >
                      🧬
                    </div>
                    <h4
                      className={`text-xs sm:text-sm font-black tracking-tight uppercase ${
                        isDaylight ? 'text-[#475569]' : 'text-white'
                      }`}
                    >
                      {protocolName}
                    </h4>
                  </div>
                  <span
                    className={`text-[10px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
                      isDaylight
                        ? 'text-[#2B725C] bg-[#E6F3EB] border-[#2B725C]/30'
                        : 'text-emerald-400/80 bg-emerald-500/10 border-emerald-500/20'
                    }`}
                  >
                    {pTasks.length} {pTasks.length === 1 ? 'completed' : 'completed'}
                  </span>
                </div>

                {/* Grid of Completed Modality Tiles in this protocol */}
                <div className="grid grid-cols-12 gap-2.5 sm:gap-3.5">
                  {pTasks.map((task) => {
                    const mod = resolveModality(task)
                    const mId = mod?.id || task.modality_id || task.protocol_step?.modality_id || ''
                    const bench = benchItems.find((b) => b.modality_id === mId)
                    const sizing = getTaskSizing(task)

                    return (
                      <ModalityBlockTile
                        key={`completed_${task.id}`}
                        task={task}
                        modality={mod}
                        benchItem={bench}
                        sizing={sizing}
                        visualStyle={visualStyle}
                        layoutMode={layoutMode}
                        showDosing={showDosing}
                        isEditMode={isEditMode}
                        isIgnited={true}
                        onOpenDetails={() => onOpenDetails(task)}
                        onToggleComplete={() => onUndoTask(task)}
                        onSwipeRight={() => onUndoTask(task)}
                        onSwipeLeft={() => onSwipeLeft(task)}
                        onResize={() => {}}
                        onLongPress={() => {}}
                      />
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
