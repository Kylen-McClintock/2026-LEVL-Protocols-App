'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { ChevronDown, ChevronUp, Layers, Check, Sparkles } from 'lucide-react'
import { DedupedTask } from '@/components/cards/ProtocolTaskCard'
import { Modality, OutcomeDimension, UserProfile, UserBenchItem } from '@/lib/types'
import { getCachedModalitiesSync } from '@/lib/data'
import ModalityBlockTile from './ModalityBlockTile'
import SwipeActionInFeedCard from './SwipeActionInFeedCard'
import { useTheme } from '@/lib/utils/useTheme'
import { useBlocksDrag } from './BlocksDragContext'
import {
  BlockSizing,
  BlocksVisualStyle,
  BlocksLayoutMode,
  getDefaultBlockSizing,
  getSavedBlockSizing,
  saveBlockSizing,
  harmonizeTimeBlockRowSizings
} from './blocksUtils'

interface BlocksProtocolContainerProps {
  protocolName: string
  tasks: DedupedTask[]
  benchItems?: UserBenchItem[]
  userProfile?: UserProfile | null
  allOutcomes?: OutcomeDimension[]
  allModalities?: Modality[]
  visualStyle: BlocksVisualStyle
  layoutMode?: BlocksLayoutMode
  showDosing?: boolean
  isEditMode: boolean
  activeSwipe?: { task: DedupedTask; type: 'complete' | 'skip_snooze' } | null
  onCloseSwipe?: () => void
  onInFeedComplete?: (taskId: string, outcomes?: Record<string, number>, customDose?: string) => void
  onInFeedSkip?: (taskId: string, reason?: string) => void
  onInFeedSnooze?: (taskId: string, snoozeSlotOrMinutes: string | number) => void
  onOpenDetails: (task: DedupedTask) => void
  onSwipeRight: (task: DedupedTask) => void
  onSwipeLeft: (task: DedupedTask) => void
  onStatusChange: (taskId: string, status: string) => void
  onLongPress: () => void
  onMoveTask?: (taskId: string, targetSlotKey: string, targetTaskId?: string) => void
}

export default function BlocksProtocolContainer({
  protocolName,
  tasks,
  benchItems = [],
  userProfile,
  allOutcomes = [],
  allModalities = [],
  visualStyle,
  layoutMode = 'dynamic',
  showDosing = false,
  isEditMode,
  activeSwipe,
  onCloseSwipe,
  onInFeedComplete,
  onInFeedSkip,
  onInFeedSnooze,
  onOpenDetails,
  onSwipeRight,
  onSwipeLeft,
  onStatusChange,
  onLongPress,
  onMoveTask
}: BlocksProtocolContainerProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [sizings, setSizings] = useState<Record<string, BlockSizing>>({})

  let dragCtx: any = null
  try {
    dragCtx = useBlocksDrag()
  } catch {
    dragCtx = null
  }

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

  const getTaskSizing = (task: DedupedTask): BlockSizing => {
    const mId = task.modality_id || task.protocol_step?.modality_id || task.id
    if (sizings[mId]) return sizings[mId]
    const mod = resolveModality(task)
    const def =
      layoutMode === '3-wide'
        ? ({ width: '1/3' as const, height: '1x' as const })
        : layoutMode === '1-wide'
        ? ({ width: 'full' as const, height: '1x' as const })
        : layoutMode === 'uniform' || layoutMode === '2-wide'
        ? ({ width: '1/2' as const, height: '1x' as const })
        : getDefaultBlockSizing(mod)
    return getSavedBlockSizing(mId, def, layoutMode)
  }

  const handleResizeTask = (task: DedupedTask, newSizing: BlockSizing) => {
    const mId = task.modality_id || task.protocol_step?.modality_id || task.id
    setSizings((prev) => ({ ...prev, [mId]: newSizing }))
    saveBlockSizing(mId, newSizing, layoutMode)
  }

  useEffect(() => {
    const handleSizingChange = (e: any) => {
      if (e.detail?.modalityId && e.detail?.sizing) {
        setSizings((prev) => ({ ...prev, [e.detail.modalityId]: e.detail.sizing }))
      }
    }
    window.addEventListener('levl_block_sizing_change', handleSizingChange)
    return () => window.removeEventListener('levl_block_sizing_change', handleSizingChange)
  }, [])

  // Modalities map for layout harmonization
  const modalitiesMap = useMemo(() => {
    const map: Record<string, Modality | undefined> = {}
    tasks.forEach((t) => {
      const mod = resolveModality(t)
      const mId = mod?.id || t.modality_id || t.protocol_step?.modality_id || t.id
      if (mId) map[mId] = mod
      if (t.id) map[t.id] = mod
    })
    return map
  }, [tasks, allModalities, benchItems])

  const layout = useMemo(() => {
    return harmonizeTimeBlockRowSizings(
      tasks as any,
      modalitiesMap,
      [],
      false,
      sizings,
      {},
      false,
      layoutMode
    )
  }, [tasks, modalitiesMap, sizings, layoutMode])

  const { theme } = useTheme()
  const isDaylight = theme === 'light'
  const isDropTarget = dragCtx?.activeDrag && dragCtx.hoveredSlotKey === `protocol_${protocolName}`

  return (
    <div
      ref={containerRef}
      data-slot-key={`protocol_${protocolName}`}
      className={`w-full rounded-3xl p-4 sm:p-5 my-3.5 border-2 backdrop-blur-xl shadow-xl transition-all duration-300 ${
        isDropTarget ? 'ring-4 ring-[#6954C8]/90 bg-[#6954C8]/10 rounded-3xl scale-[1.01]' : ''
      } ${
      isDaylight
        ? 'bg-white border-[#E1E8E3] text-[#475569] shadow-sm'
        : visualStyle === 'light-glass'
        ? 'bg-white/[0.06] border-white/15 backdrop-blur-xl text-white shadow-xl'
        : visualStyle === 'dark-outline'
        ? isIgnited
          ? 'bg-slate-950/95 border-[2.5px] border-purple-500/60 shadow-2xl shadow-purple-950/40 text-white'
          : 'bg-slate-950/95 border-[2.5px] border-white/20 hover:border-purple-500/50 text-white'
        : isIgnited
        ? 'bg-gradient-to-b from-slate-950/90 via-slate-950/92 to-slate-900/90 border-purple-500/40 shadow-2xl shadow-purple-950/30 text-white'
        : 'bg-gradient-to-b from-slate-950/85 via-slate-950/90 to-slate-900/90 border-white/15 text-white'
    }`}>
      {/* Protocol Header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
              isDaylight
                ? 'bg-slate-100 text-slate-600'
                : isAllDone
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-white/5 text-purple-400 group-hover:bg-white/10'
            }`}
          >
            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </div>

          <div>
            <h2 className={`text-sm sm:text-base font-black tracking-tight ${
              isDaylight ? 'text-[#475569]' : 'text-white group-hover:text-purple-300'
            } transition-colors flex items-center gap-2`}>
              <Layers size={15} className={isDaylight ? 'text-purple-600' : 'text-purple-400 shrink-0'} />
              <span>{protocolName}</span>
            </h2>
          </div>
        </div>

        {/* Progress badge */}
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
            {completedCount}/{totalCount} completed
          </span>
        )}
      </div>

      {/* Grid of rounded modality blocks */}
      {!isCollapsed && (
        <div className="grid grid-cols-12 gap-2.5 sm:gap-3.5 pt-1">
          {layout.orderedDisplayTasks.map((task) => {
            const isThisTaskSwiped = activeSwipe && activeSwipe.task.id === task.id
            if (isThisTaskSwiped) {
              const mod = resolveModality(task)
              const mId = mod?.id || task.modality_id || task.protocol_step?.modality_id || ''
              const bench = benchItems.find((b) => b.modality_id === mId)
              return (
                <div key={`swipe_active_${task.id}`} className="col-span-12 animate-in fade-in zoom-in-95 duration-200">
                  <SwipeActionInFeedCard
                    actionType={activeSwipe.type}
                    task={activeSwipe.task}
                    modality={mod}
                    benchItem={bench}
                    allOutcomes={allOutcomes}
                    userProfile={userProfile}
                    onClose={onCloseSwipe || (() => {})}
                    onComplete={onInFeedComplete || (() => {})}
                    onSkip={onInFeedSkip || (() => {})}
                    onSnooze={onInFeedSnooze || (() => {})}
                  />
                </div>
              )
            }

            const mod = resolveModality(task)
            const mId = mod?.id || task.modality_id || task.protocol_step?.modality_id || ''
            const bench = benchItems.find((b) => b.modality_id === mId)
            const sizing = layout.taskSizings[mId] || layout.taskSizings[task.id] || getTaskSizing(task)
            const isReorderTarget = Boolean(dragCtx?.activeDrag && dragCtx.hoveredTaskId === task.id && dragCtx.activeDrag.id !== task.id)

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
                isEditMode={isEditMode}
                isIgnited={isIgnited}
                isReorderTarget={isReorderTarget}
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
        </div>
      )}
    </div>
  )
}
