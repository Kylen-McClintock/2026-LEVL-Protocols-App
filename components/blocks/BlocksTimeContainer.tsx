'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Clock,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  MoonStar,
  Utensils,
  Zap
} from 'lucide-react'
import { getCircadianConfig } from '@/lib/utils/circadianConfig'
import { DedupedTask } from '@/components/cards/ProtocolTaskCard'
import { Modality, OutcomeDimension, UserProfile, UserBenchItem } from '@/lib/types'
import { getCachedModalitiesSync } from '@/lib/data'
import { useTheme } from '@/lib/utils/useTheme'
import ModalityBlockTile from './ModalityBlockTile'
import ModalityStackBlockTile from './ModalityStackBlockTile'
import BlocksNutritionTile from './BlocksNutritionTile'
import HotkeySquareTile from './HotkeySquareTile'
import { QuickHotkeyConfig, DailyQuickLogEntry } from '@/lib/types'
import {
  BlockSizing,
  BlocksVisualStyle,
  BlocksLayoutMode,
  getDefaultBlockSizing,
  getSavedBlockSizing,
  saveBlockSizing,
  isTimeBlockInFutureForDay,
  harmonizeTimeBlockRowSizings,
  getSmartSlotForHotkey,
  getStoredSlotTaskOrder,
  saveStoredSlotTaskOrder
} from './blocksUtils'
import { COMPREHENSIVE_SYNERGY_RULES } from '@/lib/synergy/comprehensiveInteractions'
import { ModalitySynergyInfo } from './BlocksSynergyConnector'
import { ModalitySequenceInfo } from './BlocksSequenceSpine'
import { useBlocksDrag } from './BlocksDragContext'

interface BlocksTimeContainerProps {
  slotKey: string
  slotTitle: string
  timeWindowLabel: string
  tasks: DedupedTask[]
  benchItems?: UserBenchItem[]
  userProfile?: UserProfile | null
  allOutcomes?: OutcomeDimension[]
  allModalities?: Modality[]
  hotkeys?: QuickHotkeyConfig[]
  logs?: DailyQuickLogEntry[]
  visualStyle: BlocksVisualStyle
  layoutMode?: BlocksLayoutMode
  showDosing?: boolean
  isEditMode: boolean
  date: string
  localUserId: string
  onOpenDetails: (task: DedupedTask) => void
  onSwipeRight: (task: DedupedTask) => void
  onSwipeLeft: (task: DedupedTask) => void
  onStatusChange: (taskId: string, status: string) => void
  onAddActivity: (slotKey: string) => void
  onLongPress: () => void
  onQuickLog?: (hotkey: QuickHotkeyConfig) => void
  onSelectHotkey?: (hotkey: QuickHotkeyConfig) => void
  onMoveHotkey?: (hotkeyId: string, targetSlotKey: string) => void
  onMoveTask?: (taskId: string, targetSlotKey: string, targetTaskId?: string) => void
}

export default function BlocksTimeContainer({
  slotKey,
  slotTitle,
  timeWindowLabel,
  tasks,
  benchItems = [],
  userProfile,
  allOutcomes = [],
  allModalities = [],
  hotkeys = [],
  logs = [],
  visualStyle,
  layoutMode = 'dynamic',
  showDosing = false,
  isEditMode,
  date,
  localUserId,
  onOpenDetails,
  onSwipeRight,
  onSwipeLeft,
  onStatusChange,
  onAddActivity,
  onLongPress,
  onQuickLog,
  onSelectHotkey,
  onMoveHotkey,
  onMoveTask
}: BlocksTimeContainerProps) {
  // Blocks that are in the past according to the user's circadian/fasting schedule are collapsed into compact bars (e.g. past morning).
  // Upcoming and active time blocks are open by default.
  const isFuture = useMemo(() => isTimeBlockInFutureForDay(slotKey, date, userProfile), [slotKey, date, userProfile])
  const [isCollapsed, setIsCollapsed] = useState(!isFuture)
  const [isDragOver, setIsDragOver] = useState(false)
  const { theme } = useTheme()
  const isDaylight = theme === 'light'

  let dragCtx: any = null
  try {
    dragCtx = useBlocksDrag()
  } catch {
    dragCtx = null
  }
  const isTouchHovered = dragCtx?.hoveredSlotKey === slotKey
  const isDropTarget = isDragOver || isTouchHovered

  useEffect(() => {
    setIsCollapsed(!isTimeBlockInFutureForDay(slotKey, date, userProfile))
  }, [slotKey, date, userProfile])

  const containerRef = useRef<HTMLDivElement>(null)
  const [isIgnited, setIsIgnited] = useState(true)

  // Viewport ignition engine: fully illuminate icons & borders whenever visible in viewport
  useEffect(() => {
    const checkIgnition = () => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      // Active whenever visible anywhere in or near the viewport
      const ignited = rect.top <= window.innerHeight + 100 && rect.bottom >= -50
      setIsIgnited(ignited)
    }

    checkIgnition()
    window.addEventListener('scroll', checkIgnition, { passive: true })
    window.addEventListener('resize', checkIgnition, { passive: true })
    return () => {
      window.removeEventListener('scroll', checkIgnition)
      window.removeEventListener('resize', checkIgnition)
    }
  }, [isCollapsed])

  const [partnerHighlightedId, setPartnerHighlightedId] = useState<string | null>(null)
  const [sizings, setSizings] = useState<Record<string, BlockSizing>>({})
  const [orderVersion, setOrderVersion] = useState(0)
  const customOrder = useMemo(() => getStoredSlotTaskOrder(slotKey), [slotKey, orderVersion])

  useEffect(() => {
    const handleOrderChange = (e: any) => {
      if (!e.detail || e.detail.slotKey === slotKey) {
        setOrderVersion((v) => v + 1)
      }
    }
    const handleSizingChange = (e: any) => {
      if (e.detail?.modalityId && e.detail?.sizing) {
        setSizings((prev) => ({ ...prev, [e.detail.modalityId]: e.detail.sizing }))
      }
    }
    window.addEventListener('levl_slot_order_change', handleOrderChange)
    window.addEventListener('levl_block_sizing_change', handleSizingChange)
    return () => {
      window.removeEventListener('levl_slot_order_change', handleOrderChange)
      window.removeEventListener('levl_block_sizing_change', handleSizingChange)
    }
  }, [slotKey])

  const isMealSlot =
    slotKey.includes('meal') ||
    slotKey.includes('breakfast') ||
    slotKey.includes('lunch') ||
    slotKey.includes('midday') ||
    slotKey.includes('dinner')

  // Filter hotkeys assigned to this slot (strictly super obvious or user-assigned)
  const slotHotkeys = useMemo(() => {
    if (!hotkeys || hotkeys.length === 0) return []
    return hotkeys.filter((h) => {
      // If user explicitly configured assigned slots:
      if (h.assigned_time_slots && h.assigned_time_slots.length > 0) {
        return h.assigned_time_slots.includes(slotKey)
      }
      // SMART FALLBACK: ONLY map unassigned hotkeys if SUPER obvious (Coffee/Sunlight morning, Alcohol/Chamomile evening, Mag bedtime)
      const smartSlot = getSmartSlotForHotkey(h)
      return smartSlot === slotKey
    })
  }, [hotkeys, slotKey])

  // Resolve modality from task, allModalities, cache, or benchItems
  const resolveModality = (task: DedupedTask): Modality | undefined => {
    if (task.protocol_step?.modality) return task.protocol_step.modality
    if (task.loose_modality) return task.loose_modality
    const targetId = task.modality_id || task.protocol_step?.modality_id
    if (targetId) {
      const catalog = allModalities && allModalities.length > 0 ? allModalities : getCachedModalitiesSync()
      const found = catalog.find((m) => m.id === targetId)
      if (found) return found
      const bench = benchItems.find((b) => b.modality_id === targetId)
      if (bench?.modality) return bench.modality
    }
    const candidate =
      task.execution_details?.custom_name ||
      task.execution_details?.modality_name ||
      (task as any).title ||
      task.protocol_step?.protocol?.name
    if (candidate) {
      const candLower = candidate.toLowerCase()
      const catalog = allModalities && allModalities.length > 0 ? allModalities : getCachedModalitiesSync()
      const foundByName = catalog.find(
        (m) =>
          m.name.toLowerCase() === candLower ||
          m.display_name?.toLowerCase() === candLower
      )
      if (foundByName) return foundByName
    }
    return undefined
  }

  const totalCount = tasks.length
  const completedCount = tasks.filter((t) => t.status === 'completed').length
  const isAllDone = completedCount === totalCount && totalCount > 0

  // Identify supplements vs other modalities in this window
  const supplements = tasks.filter((t) => {
    const mod = resolveModality(t)
    const cat = (mod?.category || '').toLowerCase()
    const name = (mod?.name || '').toLowerCase()
    return (
      cat.includes('supplement') ||
      cat.includes('peptide') ||
      name.includes('vitamin') ||
      name.includes('magnesium')
    )
  })

  const nonSupplements = tasks.filter((t) => !supplements.some((s) => s.id === t.id))

  // Condense supplements into one stack block if 3 or more!
  const shouldCondenseStack = supplements.length >= 3

  // Modalities map for active tasks in this container
  const modalitiesMap = useMemo(() => {
    const map: Record<string, Modality | undefined> = {}
    tasks.forEach((t) => {
      const mId = t.modality_id || t.protocol_step?.modality_id || t.id
      map[mId] = resolveModality(t)
    })
    return map
  }, [tasks, allModalities, benchItems])

  // Biochemical & Physiological Synergy Linker
  const synergiesMap = useMemo(() => {
    const map: Record<string, ModalitySynergyInfo> = {}
    const activeTasks = shouldCondenseStack ? nonSupplements : tasks
    const norm = (s?: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '')

    activeTasks.forEach((t1) => {
      const mod1 = modalitiesMap[t1.modality_id || t1.protocol_step?.modality_id || t1.id]
      const id1 = norm(mod1?.id || t1.modality_id)
      const name1 = norm(mod1?.name || mod1?.display_name || (t1 as any).title)

      // 1. Check against other tasks in this container
      for (const t2 of activeTasks) {
        if (t1.id === t2.id) continue
        const mod2 = modalitiesMap[t2.modality_id || t2.protocol_step?.modality_id || t2.id]
        const id2 = norm(mod2?.id || t2.modality_id)
        const name2 = norm(mod2?.name || mod2?.display_name || (t2 as any).title)

        const match = COMPREHENSIVE_SYNERGY_RULES.find((rule) => {
          const t1MatchesTrigger = rule.triggers.some((tr) => id1.includes(tr) || name1.includes(tr) || tr.includes(id1))
          const t2MatchesTarget = rule.targets.some((tg) => id2.includes(tg) || name2.includes(tg) || tg.includes(id2))
          return t1MatchesTrigger && t2MatchesTarget
        })

        if (match) {
          const partnerName = mod2?.display_name || mod2?.name || 'Partner Modality'
          map[t1.id] = {
            partnerId: mod2?.id || t2.id,
            partnerName,
            synergyType: match.type,
            multiplierBadge: match.type === 'bioavailability' 
              ? `⚡ +3.4x Absorption with ${partnerName}` 
              : match.type === 'contrast_hormesis'
              ? `⇄ Contrast Pair with ${partnerName}`
              : `⚡ Synergistic with ${partnerName}`,
            headline: match.headline,
            mechanism: match.rationale,
            pubmedUrl: match.pubmedUrl
          }
          break
        }
      }

      // 2. Also check against hotkeys in this slot (e.g. EVOO hotkey paired with fat-soluble senolytics/vitamins)
      if (!map[t1.id]) {
        for (const hk of slotHotkeys) {
          const hkId = norm(hk.id)
          const hkName = norm(hk.name)

          const match = COMPREHENSIVE_SYNERGY_RULES.find((rule) => {
            const t1MatchesTarget = rule.targets.some((tg) => id1.includes(tg) || name1.includes(tg) || tg.includes(id1))
            const hkMatchesTrigger = rule.triggers.some((tr) => hkId.includes(tr) || hkName.includes(tr) || tr.includes(hkId))
            return t1MatchesTarget && hkMatchesTrigger
          })

          if (match) {
            map[t1.id] = {
              partnerId: hk.id,
              partnerName: hk.name,
              synergyType: match.type,
              multiplierBadge: `⚡ Synergistic with ${hk.name}`,
              headline: match.headline,
              mechanism: match.rationale,
              pubmedUrl: match.pubmedUrl
            }
            break
          }
        }
      }
    })

    return map
  }, [tasks, nonSupplements, shouldCondenseStack, modalitiesMap, slotHotkeys])

  // Row-Filling Bin-Packing Engine: guarantees zero blank space, pairs 1/2 synergies and meals
  const layout = useMemo(() => {
    const activeTasks = shouldCondenseStack ? nonSupplements : tasks
    return harmonizeTimeBlockRowSizings(
      activeTasks,
      modalitiesMap,
      slotHotkeys,
      isMealSlot,
      sizings,
      synergiesMap,
      shouldCondenseStack,
      layoutMode,
      customOrder
    )
  }, [tasks, nonSupplements, shouldCondenseStack, modalitiesMap, slotHotkeys, isMealSlot, sizings, synergiesMap, layoutMode, customOrder])

  // Sequential Routine Pipeline Linker (e.g. Step 1 -> Step 2 -> Step 3)
  const sequencesMap = useMemo(() => {
    const map: Record<string, ModalitySequenceInfo> = {}
    const activeTasks = shouldCondenseStack ? nonSupplements : tasks

    const protocolGroups: Record<string, DedupedTask[]> = {}
    activeTasks.forEach((t) => {
      const pId = t.protocol_step?.protocol_id || t.lineages?.[0]?.protocol_id || t.protocol_step?.protocol?.name
      if (pId) {
        if (!protocolGroups[pId]) protocolGroups[pId] = []
        protocolGroups[pId].push(t)
      }
    })

    Object.values(protocolGroups).forEach((groupTasks) => {
      if (groupTasks.length < 2) return // Only routines with 2+ steps form a sequence

      groupTasks.sort((a, b) => {
        const stepA = a.protocol_step?.ordering_index || a.protocol_step?.display_order || a.lineages?.[0]?.step_number || 0
        const stepB = b.protocol_step?.ordering_index || b.protocol_step?.display_order || b.lineages?.[0]?.step_number || 0
        return stepA - stepB
      })

      const totalSteps = groupTasks.length

      groupTasks.forEach((t, idx) => {
        const stepNumber = t.lineages?.[0]?.step_number || t.protocol_step?.ordering_index || idx + 1
        const isCompleted = t.status === 'completed'
        const previousStepsDone = groupTasks.slice(0, idx).every((prev) => prev.status === 'completed')
        const isUpNext = !isCompleted && previousStepsDone && t.status === 'pending'

        map[t.id] = {
          stepNumber,
          totalSteps,
          protocolName: t.protocol_step?.protocol?.name || t.lineages?.[0]?.protocol_name,
          isUpNext,
          isCompleted,
          transitionRestLabel: t.protocol_step?.timing_precision || t.protocol_step?.notes
        }
      })
    })

    return map
  }, [tasks, nonSupplements, shouldCondenseStack])

  const getSlotIcon = () => {
    const k = slotKey.toLowerCase()
    if (k.includes('wake') || k.includes('dawn')) return <Sunrise size={16} className="text-amber-400" />
    if (k.includes('morning')) return <Zap size={16} className="text-sky-400" />
    if (k.includes('breakfast') || k.includes('first_meal')) return <Utensils size={16} className="text-orange-400" />
    if (k.includes('lunch') || k.includes('midday') || k.includes('noon')) return <Sun size={16} className="text-yellow-400" />
    if (k.includes('afternoon') || k.includes('workout')) return <Zap size={16} className="text-blue-400" />
    if (k.includes('dinner') || k.includes('evening')) return <Sunset size={16} className="text-rose-400" />
    if (k.includes('wind') || k.includes('pre_bed')) return <Moon size={16} className="text-purple-400" />
    if (k.includes('bed') || k.includes('night') || k.includes('sleep')) return <MoonStar size={16} className="text-indigo-400" />
    if (k.includes('anytime') || k.includes('flexible')) return <Clock size={16} className="text-slate-400" />
    const circadian = getCircadianConfig(slotKey)
    const IconComp = circadian.icon || Clock
    return <IconComp size={16} className={circadian.badgeText || "text-purple-400"} />
  }

  const getTaskSizing = (task: DedupedTask): BlockSizing => {
    const mId = task.modality_id || task.protocol_step?.modality_id || task.id
    if (sizings[mId]) return sizings[mId]
    if (layout.taskSizings[mId]) return layout.taskSizings[mId]
    const mod = resolveModality(task)
    const def = layoutMode === 'uniform' ? ({ width: '1/2', height: '1x' } as const) : getDefaultBlockSizing(mod, false, task)
    return getSavedBlockSizing(mId, def, layoutMode)
  }

  const handleResizeTask = (task: DedupedTask, newSizing: BlockSizing) => {
    const mId = task.modality_id || task.protocol_step?.modality_id || task.id
    setSizings((prev) => ({ ...prev, [mId]: newSizing }))
    saveBlockSizing(mId, newSizing, layoutMode)
  }

  const handleContainerDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    let dataStr = ''
    try {
      dataStr =
        e.dataTransfer.getData('application/json') ||
        e.dataTransfer.getData('text/plain') ||
        e.dataTransfer.getData('text')
    } catch {
      dataStr = ''
    }

    let parsed: any = null
    if (dataStr) {
      try {
        parsed = JSON.parse(dataStr)
      } catch {
        parsed = null
      }
    }

    if (!parsed && typeof window !== 'undefined' && (window as any).__draggedItem) {
      parsed = (window as any).__draggedItem
    }

    if (parsed) {
      if (parsed.type === 'task' && parsed.id && onMoveTask) {
        onMoveTask(parsed.id, slotKey)
        return
      }
      if (parsed.type === 'hotkey' && parsed.id && onMoveHotkey) {
        onMoveHotkey(parsed.id, slotKey)
        return
      }
    }

    if (dataStr) {
      if (hotkeys.some((h) => h.id === dataStr) && onMoveHotkey) {
        onMoveHotkey(dataStr, slotKey)
      } else if (onMoveTask) {
        onMoveTask(dataStr, slotKey)
      }
    }
  }

  // COLLAPSED: Smallest-height full-width block (h-14 / h-16)
  if (isCollapsed) {
    return (
      <div
        ref={containerRef}
        data-slot-key={slotKey}
        onDragOver={(e) => {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
          if (!isDragOver) setIsDragOver(true)
        }}
        onDragEnter={(e) => {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
          setIsDragOver(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          if (e.currentTarget.contains(e.relatedTarget as Node)) return
          setIsDragOver(false)
        }}
        onDrop={handleContainerDrop}
        onClick={() => setIsCollapsed(false)}
        className={`w-full h-14 sm:h-16 my-2 px-4 sm:px-5 rounded-2xl sm:rounded-3xl border flex items-center justify-between transition-all duration-300 cursor-pointer shadow-sm select-none group active:scale-[0.99] ${
          isDragOver ? 'ring-4 ring-[#6954C8]/90 bg-[#6954C8]/20 border-[#6954C8] scale-[1.01] shadow-xl' : ''
        } ${
          isDaylight
            ? 'bg-white border-[#E1E8E3] hover:bg-[#EFF3F0]/60 text-[#475569]'
            : visualStyle === 'dark-outline'
            ? isIgnited
              ? 'bg-slate-950/95 border-[2.5px] border-purple-500/60 shadow-xl shadow-purple-950/30 text-white'
              : 'bg-slate-950/95 border-[2.5px] border-white/20 hover:border-purple-500/50 text-white'
            : 'bg-gradient-to-r from-slate-950/95 via-slate-900/90 to-slate-950/95 border-white/20 hover:border-purple-500/50 text-white'
        }`}
      >
        {/* Left: Icon + Title + Time Window */}
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 shadow-sm transition-colors duration-500 ${
            isDaylight
              ? 'border-slate-200 bg-slate-100 text-slate-600'
              : isIgnited ? 'border-purple-500/50 text-purple-300 bg-white/5' : 'border-white/10 text-slate-400 bg-white/5'
          }`}>
            {getSlotIcon()}
          </div>
          <div className="flex items-center gap-2 min-w-0 truncate">
            <span className={`font-extrabold text-sm sm:text-base tracking-tight truncate transition-colors ${
              isDaylight ? 'text-[#475569] group-hover:text-purple-600' : 'text-white group-hover:text-purple-300'
            }`}>
              {slotTitle}
            </span>
            {timeWindowLabel && (
              <span className={`text-[10px] sm:text-[11px] font-mono shrink-0 truncate ${
                isDaylight ? 'text-[#64748B]' : 'text-slate-400'
              }`}>
                • {timeWindowLabel}
              </span>
            )}
          </div>
        </div>

        {/* Right: Meal Preview / Count / Chevron */}
        <div className="flex items-center gap-2.5 shrink-0">
          {isMealSlot && (
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
              isDaylight
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                : 'bg-orange-500/15 border border-orange-500/30 text-orange-300'
            }`}>
              <Utensils size={11} />
              <span>Nutrition</span>
            </span>
          )}

          {totalCount > 0 && (
            <span
              className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                isDaylight
                  ? isAllDone
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                    : 'bg-slate-100 border-slate-200 text-slate-600'
                  : isAllDone
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-black/30 border-white/10 text-slate-400'
              }`}
            >
              {completedCount}/{totalCount}
            </span>
          )}

          <div className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
            isDaylight
              ? 'bg-slate-100 text-slate-600 group-hover:text-[#475569]'
              : 'bg-white/5 group-hover:bg-white/15 text-slate-400 group-hover:text-white'
          }`}>
            <ChevronDown size={15} />
          </div>
        </div>
      </div>
    )
  }

  // EXPANDED: Full container with meal nutrition at top and grid of modality blocks
  return (
    <div
      ref={containerRef}
      data-slot-key={slotKey}
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        if (!isDragOver) setIsDragOver(true)
      }}
      onDragEnter={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        setIsDragOver(true)
      }}
      onDragLeave={(e) => {
        e.preventDefault()
        if (e.currentTarget.contains(e.relatedTarget as Node)) return
        setIsDragOver(false)
      }}
      onDrop={handleContainerDrop}
      className={`w-full transition-all duration-300 animate-in fade-in ${
        isDropTarget && dragCtx?.activeDrag?.sourceSlotKey !== slotKey ? 'ring-4 ring-[#6954C8]/90 bg-[#6954C8]/10 rounded-3xl scale-[1.01]' : ''
      } ${
        isDaylight
          ? 'my-3 bg-transparent border-0 p-0 shadow-none'
          : `rounded-3xl p-4 sm:p-5 my-3.5 border-2 backdrop-blur-xl shadow-xl ${
              visualStyle === 'dark-outline'
                ? isIgnited
                  ? 'bg-slate-950/95 border-[2.5px] border-purple-500/60 shadow-2xl shadow-purple-950/40 text-white'
                  : 'bg-slate-950/95 border-[2.5px] border-white/20 hover:border-purple-500/50 text-white'
                : isIgnited
                ? 'bg-gradient-to-b from-slate-950/90 via-slate-950/92 to-slate-900/90 border-purple-500/40 shadow-2xl shadow-purple-950/30 text-white'
                : 'bg-gradient-to-b from-slate-950/85 via-slate-950/90 to-slate-900/90 border-white/15 text-white'
            }`
      }`}
    >
      {/* Container Header */}
      <div className={`flex items-center justify-between gap-3 mb-3 ${isDaylight ? 'pb-1 border-0' : 'pb-2 border-b border-white/5'}`}>
        <div
          onClick={() => setIsCollapsed(true)}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          {!isDaylight && (
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                isAllDone ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-400 group-hover:bg-white/10'
              }`}
            >
              <ChevronUp size={14} />
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors duration-500 ${
              isDaylight
                ? 'bg-transparent text-amber-500'
                : isIgnited ? 'bg-white/5 border border-purple-500/50 text-purple-300' : 'bg-white/5 border border-white/10 text-slate-400'
            }`}>
              {getSlotIcon()}
            </div>
            <h2 className={`text-base sm:text-lg font-extrabold tracking-tight ${isDaylight ? 'text-[#475569]' : 'text-white group-hover:text-purple-300'} transition-colors flex items-center gap-2`}>
              <span>{slotTitle}</span>
              {timeWindowLabel && !isDaylight && (
                <span className="text-[10px] sm:text-[11px] font-normal text-slate-400 font-mono shrink-0 truncate">
                  • {timeWindowLabel}
                </span>
              )}
            </h2>
          </div>
        </div>

        {/* Right Status Badge & Add Button */}
        <div className="flex items-center gap-2">
          {isDropTarget && dragCtx?.activeDrag && (
            <span className="text-[11px] font-mono font-bold text-purple-300 animate-pulse px-2.5 py-0.5 rounded-full bg-purple-500/25 border border-purple-400/50">
              Drop to move here
            </span>
          )}
          {totalCount > 0 && !isDropTarget && (
            isDaylight ? (
              <span className="text-xs text-[#64748B] font-semibold">
                {completedCount} of {totalCount} complete
              </span>
            ) : (
              <span
                className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                  isAllDone
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-black/30 border-white/10 text-slate-400'
                }`}
              >
                {completedCount}/{totalCount}
              </span>
            )
          )}

          <button
            onClick={() => onAddActivity(slotKey)}
            title="Add Activity to this Time Window"
            className={`w-7 h-7 rounded-xl ${isDaylight ? 'bg-white hover:bg-slate-50 text-slate-500 hover:text-[#475569] border-slate-200 shadow-sm' : 'bg-white/5 hover:bg-purple-600/30 text-slate-300 hover:text-white border-white/10'} border flex items-center justify-center transition-all active:scale-95 cursor-pointer`}
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Container Body (The Blocks Grid) - Drop enabled across entire surface */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
        }}
        onDrop={handleContainerDrop}
        className="grid grid-cols-12 gap-2.5 sm:gap-3.5 pt-1"
      >
        {/* Meal / Nutrition Block if applicable (Placed right at the top for meal windows!) */}
        {isMealSlot && (
          <BlocksNutritionTile
            date={date}
            localUserId={localUserId}
            userProfile={userProfile}
            visualStyle={visualStyle}
            sizing={layout.nutritionSizing}
            isIgnited={isIgnited}
            layoutMode={layoutMode}
            slotKey={slotKey}
            slotTitle={slotTitle}
          />
        )}

        {/* Condensed Supplement Stack (if 3+) */}
        {shouldCondenseStack && (
          <ModalityStackBlockTile
            stackName={`${slotTitle} Supplements`}
            tasks={supplements}
            benchItems={benchItems}
            sizing={{ width: '1/2', height: '1x' }}
            visualStyle={visualStyle}
            isIgnited={isIgnited}
            layoutMode={layoutMode}
            onStatusChange={onStatusChange}
          />
        )}

        {/* Individual Modalities (Using orderedDisplayTasks to place pairs flush without gaps!) */}
        {layout.orderedDisplayTasks.map((task) => {
          const mod = resolveModality(task)
          const mId = mod?.id || task.modality_id || task.protocol_step?.modality_id || ''
          const bench = benchItems.find((b) => b.modality_id === mId)
          const sizing = layout.taskSizings[mId] || layout.taskSizings[task.id] || getTaskSizing(task)

          const isDropSlotHere =
            dragCtx?.activeDrag &&
            dragCtx.hoveredSlotKey === slotKey &&
            (dragCtx.hoveredTaskId === task.id || dragCtx.hoveredTaskId === mId) &&
            dragCtx.activeDrag.id !== task.id

          return (
            <ModalityBlockTile
              key={task.id}
              task={task}
              modality={mod}
              benchItem={bench}
              sizing={sizing}
              visualStyle={visualStyle}
              layoutMode={layoutMode}
              showDosing={showDosing}
              currentSlotKey={slotKey}
              isEditMode={isEditMode}
              isIgnited={isIgnited}
              isReorderTarget={Boolean(isDropSlotHere)}
              synergy={synergiesMap[task.id]}
              sequence={sequencesMap[task.id]}
              isPartnerHighlighted={partnerHighlightedId === mId || partnerHighlightedId === task.id}
              onHighlightPartner={setPartnerHighlightedId}
              onOpenDetails={() => onOpenDetails(task)}
              onToggleComplete={() => onStatusChange(task.id, task.status === 'completed' ? 'pending' : 'completed')}
              onSwipeRight={() => onSwipeRight(task)}
              onSwipeLeft={() => onSwipeLeft(task)}
              onResize={(newSizing) => handleResizeTask(task, newSizing)}
              onLongPress={onLongPress}
              onMoveTask={onMoveTask}
            />
          )
        })}

        {/* Dynamic Drop Slot Placeholder at end of container when hovering over container body */}
        {dragCtx?.activeDrag && isDropTarget && !dragCtx.hoveredTaskId && (
          <div
            className={`rounded-2xl sm:rounded-3xl border-2 border-dashed border-purple-400 bg-purple-500/20 backdrop-blur-md shadow-xl shadow-purple-500/25 flex flex-col items-center justify-center text-center p-3 transition-all duration-300 animate-pulse ${
              layoutMode === 'uniform' ? 'col-span-6 aspect-square' : 'col-span-6 min-h-[120px] sm:min-h-[140px]'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-purple-500/30 border border-purple-400/60 flex items-center justify-center text-purple-200 mb-1">
              <Sparkles size={16} className="animate-spin text-purple-300" />
            </div>
            <span className="text-xs font-mono font-black text-purple-200 uppercase tracking-wide">
              Add to {slotTitle}
            </span>
          </div>
        )}

        {/* Square Hotkey Tiles (Dynamic Sizing from Layout Engine) */}
        {slotHotkeys.map((hotkey) => (
          <HotkeySquareTile
            key={`hotkey_${hotkey.id}_${slotKey}`}
            hotkey={hotkey}
            logs={logs}
            visualStyle={visualStyle}
            layoutMode={layoutMode}
            currentSlotKey={slotKey}
            isEditMode={isEditMode}
            isIgnited={isIgnited}
            sizing={layout.hotkeySizings[hotkey.id] || (layoutMode === '1-wide' || layoutMode === '2-wide' ? { width: '1/2', height: '1x' } : { width: '1/3', height: '1x' })}
            onQuickLog={onQuickLog || (() => {})}
            onOpenDetails={onSelectHotkey || (() => {})}
            onMoveHotkey={onMoveHotkey}
          />
        ))}

        {/* Harmonized Add Block - Perfectly completes the bottom row (12, 6+6, 8+4, or 4+4+4) */}
        <div
          className={`${
            layout.addBlockColSpan === 6
              ? 'col-span-6 min-h-[96px] sm:min-h-[110px]'
              : layout.addBlockColSpan === 4
              ? 'col-span-4 min-h-[96px] sm:min-h-[110px]'
              : layout.addBlockColSpan === 8
              ? 'col-span-8 min-h-[96px] sm:min-h-[110px]'
              : layout.addBlockColSpan === 3
              ? 'col-span-3 min-h-[96px] sm:min-h-[110px]'
              : layout.addBlockColSpan === 9
              ? 'col-span-9 min-h-[96px] sm:min-h-[110px]'
              : 'col-span-12 h-12 sm:h-14'
          }`}
        >
          <button
            onClick={() => onAddActivity(slotKey)}
            className={`w-full h-full rounded-2xl sm:rounded-3xl border-2 border-dashed ${
              isDaylight
                ? 'border-slate-300 hover:border-purple-400 bg-white/60 hover:bg-white text-slate-500 hover:text-[#475569]'
                : 'border-white/20 hover:border-purple-400/80 bg-white/[0.03] hover:bg-white/[0.06] text-slate-400 hover:text-white'
            } flex ${
              layout.addBlockColSpan === 12
                ? 'flex-row items-center justify-center gap-2'
                : 'flex-col items-center justify-center gap-1.5'
            } transition-all cursor-pointer group active:scale-95 select-none`}
          >
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl ${
              isDaylight
                ? 'bg-slate-100 group-hover:bg-purple-100 text-slate-600 group-hover:text-purple-700'
                : 'bg-white/5 group-hover:bg-purple-600/30'
            } flex items-center justify-center transition-colors`}>
              <Plus size={15} />
            </div>
            <span className="text-[11px] sm:text-xs font-bold">Add</span>
          </button>
        </div>
      </div>
    </div>
  )
}

