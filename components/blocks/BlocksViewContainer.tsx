'use client'

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  Clock,
  Layers,
  Sparkles,
  RotateCcw,
  Sliders,
  Check,
  X,
  Palette,
  Eye,
  Plus,
  LayoutGrid,
  Grid2X2,
  Grid3X3,
  Rows3,
  Pill,
  CheckCircle2,
  ChevronDown,
  Droplets,
  Coffee,
  Sun,
  Utensils
} from 'lucide-react'
import { useTheme } from '@/lib/utils/useTheme'
import { DedupedTask } from '@/components/cards/ProtocolTaskCard'
import {
  Modality,
  OutcomeDimension,
  UserProfile,
  UserBenchItem,
  DailyWellbeingCheckin,
  QuickHotkeyConfig,
  DailyQuickLogEntry
} from '@/lib/types'
import {
  getUserHotkeys,
  loadQuickLogsForDate,
  saveQuickLogEntry,
  saveUserHotkeys,
  deleteQuickLogEntry
} from '@/lib/storage/quickLogsStorage'
import ModalityBlockTile from './ModalityBlockTile'
import BlocksTimeContainer from './BlocksTimeContainer'
import BlocksProtocolContainer from './BlocksProtocolContainer'
import QuickHotkeyGrid from '@/components/quicklog/QuickHotkeyGrid'
import BlocksFloatingWaterDock from './BlocksFloatingWaterDock'
import SwipeActionInFeedCard from './SwipeActionInFeedCard'
import FullScreenModalityModal from './FullScreenModalityModal'
import CompletedBlocksSection from './CompletedBlocksSection'
import QuickLogDetailModal from '@/components/quicklog/QuickLogDetailModal'
import ManageHotkeysModal from '@/components/quicklog/ManageHotkeysModal'
import { BlocksDragProvider } from './BlocksDragContext'
import {
  BlocksVisualStyle,
  BlocksLayoutMode,
  BlocksCompletedPlacement,
  getStoredVisualStyle,
  setStoredVisualStyle,
  getStoredBlocksLayoutMode,
  setStoredBlocksLayoutMode,
  getStoredBlocksShowDosing,
  setStoredBlocksShowDosing,
  getStoredBlocksCompletedPlacement,
  setStoredBlocksCompletedPlacement,
  getStoredSlotTaskOrder,
  saveStoredSlotTaskOrder,
  getSimplifiedModalityName,
  getSmartSlotForHotkey,
  getCurrentTimeBlockSlotKey,
  reconcileRowSizingsOnDrop
} from './blocksUtils'
import { canonicalizeTimingSlot } from '@/lib/utils/timingSlots'
import { triggerHaptic } from '@/lib/utils/haptics'
import { saveOutcomeObservation, getCachedModalitiesSync } from '@/lib/data'
import { getUserCircadianTimeWindows } from '@/lib/utils/circadianConfig'

import { useHomeWidgets, useFocusRules } from '@/lib/utils/layoutSettings'

interface BlocksViewContainerProps {
  tasks: DedupedTask[]
  benchItems?: UserBenchItem[]
  userProfile?: UserProfile | null
  isFocusMode?: boolean
  allOutcomes?: OutcomeDimension[]
  allModalities?: Modality[]
  wellbeingCheckin?: DailyWellbeingCheckin | null
  date: string
  localUserId: string
  onStatusChange: (
    taskId: string,
    status: string,
    reason?: string,
    completedAt?: string,
    executionMetrics?: any,
    executionDetails?: any
  ) => void
  onOpenRescheduleModal?: (task: DedupedTask) => void
  onMoveToBench?: (modalityId: string) => void
  onSaveCustomOutcomes?: (modalityId: string, outcomeIds: string[]) => void
  onAddActivity?: (slotKey?: string) => void
  onMoveTaskToSlot?: (taskId: string, targetSlotKey: string, targetTaskId?: string) => void
}

interface ActiveSwipeState {
  task: DedupedTask
  type: 'complete' | 'skip_snooze'
}

interface UndoEntry {
  taskId: string
  previousStatus: string
  previousCompletedAt?: string
  taskName: string
  actionLabel?: string
  buttonLabel?: string
}

export default function BlocksViewContainer({
  tasks,
  benchItems = [],
  userProfile,
  isFocusMode = false,
  allOutcomes = [],
  allModalities = [],
  wellbeingCheckin,
  date,
  localUserId,
  onStatusChange,
  onOpenRescheduleModal,
  onMoveToBench,
  onSaveCustomOutcomes,
  onAddActivity,
  onMoveTaskToSlot
}: BlocksViewContainerProps) {
  // Home widgets & focus rules
  const { widgets: homeWidgets } = useHomeWidgets(userProfile || undefined)
  const { rules: focusRules } = useFocusRules(userProfile || undefined)
  const showHotkeys = isFocusMode ? focusRules.keepHotkeys : homeWidgets.quickHotkeys

  // Sub-view toggle: 'time' vs 'protocol'
  const [subView, setSubView] = useState<'time' | 'protocol'>('time')

  // Visual style: 'full-gradient' | 'dark-outline' | 'light-glass'
  const [visualStyle, setVisualStyle] = useState<BlocksVisualStyle>(() => getStoredVisualStyle())
  const { theme, setTheme } = useTheme()

  // Layout mode: 'dynamic' | 'uniform'
  const [layoutMode, setLayoutMode] = useState<BlocksLayoutMode>(() => getStoredBlocksLayoutMode())

  // Clinical Dosing toggle
  const [showDosing, setShowDosing] = useState<boolean>(() => getStoredBlocksShowDosing())

  // Completed modalities display: 'inline' (default) vs 'section'
  const [completedPlacement, setCompletedPlacement] = useState<BlocksCompletedPlacement>(() =>
    getStoredBlocksCompletedPlacement()
  )

  // Edit / Rearrange mode
  const [isEditMode, setIsEditMode] = useState(false)

  // Single-active in-feed swipe panel
  const [activeSwipe, setActiveSwipe] = useState<ActiveSwipeState | null>(null)

  // Full screen modal selected task
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<DedupedTask | null>(null)

  // Hotkeys & Quick Log State
  const [hotkeys, setHotkeys] = useState<QuickHotkeyConfig[]>([])
  const [quickLogs, setQuickLogs] = useState<DailyQuickLogEntry[]>([])
  const [selectedHotkeyForModal, setSelectedHotkeyForModal] = useState<QuickHotkeyConfig | null>(null)
  const [isManageHotkeysOpen, setIsManageHotkeysOpen] = useState(false)

  // Floating Undo toast state
  const [undoEntry, setUndoEntry] = useState<UndoEntry | null>(null)
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Load hotkeys and logs
  const reloadHotkeysAndLogs = async () => {
    if (!localUserId) return
    try {
      const keys = await getUserHotkeys(localUserId)
      setHotkeys(keys)
      const dailyLogs = await loadQuickLogsForDate(localUserId, date)
      setQuickLogs(dailyLogs)
    } catch (err) {
      console.error('Error reloading hotkeys and logs:', err)
    }
  }

  useEffect(() => {
    reloadHotkeysAndLogs()
  }, [date, localUserId])

  // Listen for hotkey & quick log broadcast updates
  useEffect(() => {
    const handleQuickLogUpdated = () => {
      reloadHotkeysAndLogs()
    }
    const handleHotkeysUpdated = (e: any) => {
      if (e.detail?.hotkeys) {
        setHotkeys(e.detail.hotkeys)
      } else {
        reloadHotkeysAndLogs()
      }
    }
    window.addEventListener('levl_quicklog_updated', handleQuickLogUpdated)
    window.addEventListener('levl_hotkeys_config_updated', handleHotkeysUpdated)
    return () => {
      window.removeEventListener('levl_quicklog_updated', handleQuickLogUpdated)
      window.removeEventListener('levl_hotkeys_config_updated', handleHotkeysUpdated)
    }
  }, [date, localUserId])

  // Synchronize style, layout mode & show dosing updates
  useEffect(() => {
    const handleStyleChange = (e: any) => {
      if (e.detail?.style) setVisualStyle(e.detail.style)
    }
    const handleLayoutModeChange = (e: any) => {
      if (e.detail?.mode) setLayoutMode(e.detail.mode)
    }
    const handleShowDosingChange = (e: any) => {
      if (typeof e.detail?.show === 'boolean') setShowDosing(e.detail.show)
    }
    const handleCompletedPlacementChange = (e: any) => {
      if (e.detail?.placement) setCompletedPlacement(e.detail.placement)
    }
    window.addEventListener('levl_blocks_style_change', handleStyleChange)
    window.addEventListener('levl_blocks_layout_mode_change', handleLayoutModeChange)
    window.addEventListener('levl_blocks_show_dosing_change', handleShowDosingChange)
    window.addEventListener('levl_blocks_completed_placement_change', handleCompletedPlacementChange)
    return () => {
      window.removeEventListener('levl_blocks_style_change', handleStyleChange)
      window.removeEventListener('levl_blocks_layout_mode_change', handleLayoutModeChange)
      window.removeEventListener('levl_blocks_show_dosing_change', handleShowDosingChange)
      window.removeEventListener('levl_blocks_completed_placement_change', handleCompletedPlacementChange)
    }
  }, [])

  // Synchronize visualStyle with global theme when toggled from outside
  useEffect(() => {
    if (theme === 'light' && visualStyle !== 'light-glass') {
      setVisualStyle('light-glass')
      setStoredVisualStyle('light-glass')
    } else if (theme === 'dark' && visualStyle === 'light-glass') {
      setVisualStyle('dark-outline')
      setStoredVisualStyle('dark-outline')
    }
  }, [theme])

  const handleSelectVisualStyle = (style: BlocksVisualStyle) => {
    setVisualStyle(style)
    setStoredVisualStyle(style)
    if (style === 'light-glass') {
      setTheme('light')
    } else if (style === 'dark-outline' || style === 'full-gradient') {
      setTheme('dark')
    }
  }

  const handleSelectLayoutMode = (mode: BlocksLayoutMode) => {
    triggerHaptic('selection')
    setLayoutMode(mode)
    setStoredBlocksLayoutMode(mode)
  }

  const handleToggleShowDosing = () => {
    triggerHaptic('light')
    const nextVal = !showDosing
    setShowDosing(nextVal)
    setStoredBlocksShowDosing(nextVal)
  }

  const handleToggleCompletedPlacement = () => {
    triggerHaptic('light')
    const nextPlacement: BlocksCompletedPlacement = completedPlacement === 'inline' ? 'section' : 'inline'
    setCompletedPlacement(nextPlacement)
    setStoredBlocksCompletedPlacement(nextPlacement)
  }

  // Dynamic Circadian & Fasting Time Windows based on user profile and fasting schedule
  const circadianWindows = useMemo(() => {
    return getUserCircadianTimeWindows(userProfile)
  }, [userProfile])

  const completedTasks = useMemo(() => {
    return tasks.filter((t) => t.status === 'completed')
  }, [tasks])

  // Fast 1-tap undo completion handler: immediately reverts task to pending and shows tactile toast
  const handleUndoTaskCompletion = (task: DedupedTask) => {
    triggerHaptic('light')
    triggerUndo(task, 'completed', 'marked pending', 'Re-complete')
    onStatusChange(task.id, 'pending')
  }

  // Quick 1-tap log handler for hotkey squares
  const handleQuickLogHotkey = async (hotkey: QuickHotkeyConfig) => {
    triggerHaptic('light')
    const newEntry: DailyQuickLogEntry = {
      id: `qlog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      local_user_id: localUserId,
      date,
      hotkey_id: hotkey.id,
      hotkey_name: hotkey.name,
      value: hotkey.default_increment,
      unit: hotkey.unit,
      logged_at: new Date().toISOString(),
      is_negative: hotkey.is_negative
    }

    setQuickLogs((prev) => [...prev, newEntry])
    await saveQuickLogEntry(newEntry)
    window.dispatchEvent(new CustomEvent('levl_quicklog_updated'))

    setUndoEntry({
      taskId: newEntry.id,
      previousStatus: 'quick_log',
      taskName: `+${hotkey.default_increment} ${hotkey.unit} ${hotkey.name}`
    })
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    undoTimerRef.current = setTimeout(() => {
      setUndoEntry(null)
    }, 5000)
  }

  // Drag & drop or placement move handler
  const handleMoveHotkey = useCallback(async (hotkeyId: string, targetSlotKey: string) => {
    triggerHaptic('selection')
    const updatedHotkeys = hotkeys.map((h) => {
      if (h.id === hotkeyId) {
        return {
          ...h,
          assigned_time_slots: [targetSlotKey]
        }
      }
      return h
    })
    setHotkeys(updatedHotkeys)
    await saveUserHotkeys(localUserId, updatedHotkeys)
    window.dispatchEvent(new CustomEvent('levl_hotkeys_config_updated', { detail: { hotkeys: updatedHotkeys } }))

    const moved = hotkeys.find(h => h.id === hotkeyId)
    const slotLabel = targetSlotKey.replace('_', ' ').toUpperCase()
    setUndoEntry({
      taskId: hotkeyId,
      previousStatus: 'hotkey_move',
      taskName: `${moved?.name || 'Hotkey'} moved to ${slotLabel}`
    })
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    undoTimerRef.current = setTimeout(() => {
      setUndoEntry(null)
    }, 5000)
  }, [hotkeys, localUserId])

  // Task relocation handler between time windows or intra-block reordering
  const handleMoveTask = useCallback((taskId: string, targetSlotKey: string, targetTaskId?: string) => {
    const t = tasks.find(task => task.id === taskId || task.id.startsWith(taskId + '-split-'))
    const mod = t?.protocol_step?.modality || t?.loose_modality
    const taskName = getSimplifiedModalityName(mod, t)
    const slotLabel = targetSlotKey
      .split('_')
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')

    // Resolve target task if targetTaskId provided
    const targetTask = targetTaskId ? tasks.find(x => 
      x.id === targetTaskId || 
      x.modality_id === targetTaskId || 
      x.protocol_step?.modality_id === targetTaskId
    ) : null

    // Target keys to match against stored order (both id and modality_id)
    const targetKeys = targetTask ? [
      targetTask.id,
      targetTask.modality_id,
      targetTask.protocol_step?.modality_id
    ].filter(Boolean) as string[] : (targetTaskId ? [targetTaskId] : [])

    // Moved keys to filter out
    const movedKeys = [
      taskId,
      t?.id,
      t?.modality_id,
      t?.protocol_step?.modality_id
    ].filter(Boolean) as string[]

    const currentSlotOrder = getStoredSlotTaskOrder(targetSlotKey)
    const tasksInSlot = tasks.filter(task => {
      const rawSlot = task.timing_slot || task.protocol_step?.timing_slot || task.loose_modality?.default_timing_slot
      const s = canonicalizeTimingSlot(rawSlot)
      return s === targetSlotKey || rawSlot === targetSlotKey || (targetSlotKey === 'dinner' && s === 'evening') || (targetSlotKey === 'breakfast' && s === 'first_meal') || (targetSlotKey === 'lunch' && s === 'midday')
    })
    const existingInSlot = tasksInSlot.map(task => task.id)
    const baseList = [...currentSlotOrder]
    for (const inSlotId of existingInSlot) {
      if (!baseList.includes(inSlotId)) {
        baseList.push(inSlotId)
      }
    }

    // Clean up source slot order if moving to a different slot
    const sourceSlotRaw = t?.timing_slot || t?.protocol_step?.timing_slot || t?.loose_modality?.default_timing_slot
    const sourceSlotKey = sourceSlotRaw ? canonicalizeTimingSlot(sourceSlotRaw) : null
    if (sourceSlotKey && sourceSlotKey !== targetSlotKey) {
      const sourceOrder = getStoredSlotTaskOrder(sourceSlotKey)
      if (sourceOrder.length > 0) {
        const cleanedSourceOrder = sourceOrder.filter(k => !movedKeys.includes(k))
        saveStoredSlotTaskOrder(sourceSlotKey, cleanedSourceOrder)
      }
    }

    // Remove moved task from baseList
    const filtered = baseList.filter(k => !movedKeys.includes(k))
    const movedKey = t?.id || taskId

    if (targetKeys.length > 0) {
      // Find position of target task
      const targetIdx = filtered.findIndex(k => targetKeys.includes(k))
      if (targetIdx !== -1) {
        filtered.splice(targetIdx, 0, movedKey)
      } else {
        filtered.push(movedKey)
      }
    } else {
      // Dragged into container body -> place at end
      filtered.push(movedKey)
    }

    saveStoredSlotTaskOrder(targetSlotKey, filtered)

    // Auto-reconcile row sizings to fit the incoming modality block cleanly
    reconcileRowSizingsOnDrop({
      droppedId: taskId,
      targetSlotKey,
      targetTaskId,
      tasks,
      layoutMode
    })

    setUndoEntry({
      taskId,
      previousStatus: `move_slot:${t?.timing_slot || 'anytime'}`,
      taskName: targetTaskId && targetTaskId !== taskId ? `${taskName} reordered in ${slotLabel}` : `${taskName} moved to ${slotLabel}`
    })
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    undoTimerRef.current = setTimeout(() => {
      setUndoEntry(null)
    }, 5000)

    onMoveTaskToSlot?.(taskId, targetSlotKey, targetTaskId)
  }, [tasks, layoutMode, onMoveTaskToSlot])

  // Trigger undo toast
  const triggerUndo = (
    task: DedupedTask, 
    previousStatus: string = 'pending',
    actionLabel?: string,
    buttonLabel: string = 'Undo'
  ) => {
    const mod = task.protocol_step?.modality || task.loose_modality
    const taskName = getSimplifiedModalityName(mod, task)
    setUndoEntry({
      taskId: task.id,
      previousStatus,
      previousCompletedAt: task.completed_at,
      taskName,
      actionLabel,
      buttonLabel
    })

    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    undoTimerRef.current = setTimeout(() => {
      setUndoEntry(null)
    }, 6000)
  }

  const handleExecuteUndo = async () => {
    if (!undoEntry) return
    triggerHaptic('selection')

    // Handle Quick Log undo
    if (undoEntry.previousStatus === 'quick_log') {
      try {
        await deleteQuickLogEntry(localUserId, date, undoEntry.taskId)
        setQuickLogs(prev => prev.filter(l => l.id !== undoEntry.taskId))
        window.dispatchEvent(new CustomEvent('levl_quicklog_updated'))
      } catch (err) {
        console.error('Failed to undo quick log:', err)
      }
      setUndoEntry(null)
      return
    }

    // Handle Task move undo
    if (undoEntry.previousStatus.startsWith('move_slot:')) {
      const prevSlot = undoEntry.previousStatus.replace('move_slot:', '')
      onMoveTaskToSlot?.(undoEntry.taskId, prevSlot)
      setUndoEntry(null)
      return
    }

    // Handle normal task status undo
    onStatusChange(undoEntry.taskId, undoEntry.previousStatus, undefined, undoEntry.previousCompletedAt)
    setUndoEntry(null)
  }

  // Handle Swipe In-Feed completions
  const handleInFeedComplete = async (taskId: string, outcomes?: Record<string, number>, customDose?: string) => {
    const targetTask = tasks.find((t) => t.id === taskId)
    if (targetTask) triggerUndo(targetTask, targetTask.status, 'completed', 'Undo')

    if (outcomes && Object.keys(outcomes).length > 0 && localUserId) {
      for (const [outcomeId, score] of Object.entries(outcomes)) {
        try {
          await saveOutcomeObservation(localUserId, outcomeId, 'post', score, date, taskId)
        } catch (e) {
          console.error('Error saving in-feed outcome rating:', e)
        }
      }
    }

    const execDetails = (customDose || outcomes)
      ? {
          ...(targetTask?.execution_details || {}),
          ...(customDose ? { custom_dose: customDose } : {}),
          ...(outcomes ? { outcome_ratings: outcomes } : {})
        }
      : undefined

    onStatusChange(taskId, 'completed', undefined, undefined, undefined, execDetails)
    setActiveSwipe(null)
  }

  // Handle Swipe In-Feed skips
  const handleInFeedSkip = (taskId: string, reason?: string) => {
    const targetTask = tasks.find((t) => t.id === taskId)
    if (targetTask) triggerUndo(targetTask, targetTask.status, 'skipped', 'Undo')

    onStatusChange(taskId, 'skipped', reason || 'Skipped by user')
    setActiveSwipe(null)
  }

  // Handle In-Feed snoozes
  const handleInFeedSnooze = (taskId: string, snoozeSlotOrMinutes: string | number) => {
    const targetTask = tasks.find((t) => t.id === taskId)
    if (targetTask) triggerUndo(targetTask, targetTask.status, 'snoozed', 'Undo')

    if (typeof snoozeSlotOrMinutes === 'number') {
      onStatusChange(taskId, 'snoozed', `Snoozed +${snoozeSlotOrMinutes}m`)
    } else {
      onStatusChange(taskId, 'snoozed', `Snoozed to ${snoozeSlotOrMinutes}`)
    }
    setActiveSwipe(null)
  }

  // 1. Group tasks by meaningful time blocks for By Time view
  // Dynamic chronological order: "Anytime" modalities go directly underneath the current active time block!
  const orderedTimeBlocks = useMemo(() => {
    const groups: Record<
      string,
      { title: string; timeWindow: string; tasks: DedupedTask[] }
    > = {
      waking: {
        title: 'Upon Waking',
        timeWindow: circadianWindows.waking?.timeWindow || '6:30 AM – 8:00 AM',
        tasks: []
      },
      morning: {
        title: 'Morning',
        timeWindow: circadianWindows.morning?.timeWindow || '8:00 AM – 10:30 AM',
        tasks: []
      },
      breakfast: {
        title: 'First Meal',
        timeWindow: circadianWindows.breakfast?.timeWindow || '12:00 PM – 1:30 PM',
        tasks: []
      },
      lunch: {
        title: 'Lunch / Midday Meal',
        timeWindow: circadianWindows.lunch?.timeWindow || '12:00 PM – 2:00 PM',
        tasks: []
      },
      afternoon: {
        title: 'Afternoon',
        timeWindow: circadianWindows.afternoon?.timeWindow || '2:00 PM – 5:30 PM',
        tasks: []
      },
      dinner: {
        title: 'Last Meal',
        timeWindow: circadianWindows.dinner?.timeWindow || '6:30 PM – 8:00 PM',
        tasks: []
      },
      bedtime: {
        title: 'Bedtime',
        timeWindow: circadianWindows.bedtime?.timeWindow || '9:30 PM – 11:00 PM',
        tasks: []
      },
      anytime: {
        title: 'Anytime',
        timeWindow: 'Flexible',
        tasks: []
      }
    }

    tasks.forEach((t) => {
      // If completed tasks are moved to the dedicated Completed section, skip inline placement
      if (completedPlacement === 'section' && t.status === 'completed') {
        return
      }

      const rawSlot = t.timing_slot || t.protocol_step?.timing_slot || t.loose_modality?.default_timing_slot
      const slot = canonicalizeTimingSlot(rawSlot)

      if (slot === 'waking' || rawSlot === 'waking') {
        groups.waking.tasks.push(t)
      } else if (slot === 'morning_routine' || slot === 'morning' || rawSlot === 'morning' || rawSlot === 'morning_routine') {
        groups.morning.tasks.push(t)
      } else if (slot === 'first_meal' || slot === 'pre_meal' || rawSlot === 'breakfast' || rawSlot === 'first_meal' || rawSlot === 'pre_meal') {
        groups.breakfast.tasks.push(t)
      } else if (slot === 'midday' || slot === 'post_meal' || rawSlot === 'lunch' || rawSlot === 'midday' || rawSlot === 'post_meal') {
        groups.lunch.tasks.push(t)
      } else if (slot === 'afternoon' || slot === 'late_afternoon' || rawSlot === 'afternoon' || rawSlot === 'late_afternoon') {
        groups.afternoon.tasks.push(t)
      } else if (slot === 'evening' || rawSlot === 'dinner' || rawSlot === 'evening') {
        groups.dinner.tasks.push(t)
      } else if (slot === 'wind_down' || slot === 'pre_bed' || slot === 'bedtime' || rawSlot === 'bedtime' || rawSlot === 'wind_down' || rawSlot === 'pre_bed') {
        groups.bedtime.tasks.push(t)
      } else {
        groups.anytime.tasks.push(t)
      }
    })

    // Chronological order with "anytime" placed directly under the current active time block
    const currentSlot = getCurrentTimeBlockSlotKey(date)
    const standardSequence = ['waking', 'morning', 'breakfast', 'lunch', 'afternoon', 'dinner', 'bedtime']
    const resultEntries: [string, { title: string; timeWindow: string; tasks: DedupedTask[] }][] = []

    for (const slotKey of standardSequence) {
      if (groups[slotKey]) {
        resultEntries.push([slotKey, groups[slotKey]])
      }
      if (slotKey === currentSlot) {
        resultEntries.push(['anytime', groups.anytime])
      }
    }

    // Safety fallback: if anytime wasn't inserted, append at end
    if (!resultEntries.some(([key]) => key === 'anytime')) {
      resultEntries.push(['anytime', groups.anytime])
    }

    return resultEntries
  }, [tasks, date, completedPlacement, circadianWindows])

  // 2. Group tasks by Protocol for By Protocol view
  const protocolGroups = useMemo(() => {
    const groups = new Map<string, DedupedTask[]>()

    tasks.forEach((t) => {
      // If completed tasks are moved to the dedicated Completed section, skip inline placement
      if (completedPlacement === 'section' && t.status === 'completed') {
        return
      }

      const pName =
        t.lineages?.[0]?.protocol_name ||
        t.protocol_step?.protocol?.name ||
        'Individual & Standalone Modalities'
      if (!groups.has(pName)) {
        groups.set(pName, [])
      }
      groups.get(pName)!.push(t)
    })

    return Array.from(groups.entries())
  }, [tasks, completedPlacement])


  return (
    <div className="w-full max-w-4xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1500px] mx-auto px-2.5 sm:px-4 lg:px-6 pb-24 pt-1 transition-all">

      {/* Dynamic Action Bar: Done Resizing & Jump to Completed Section */}
      {((completedTasks.length > 0 && completedPlacement === 'section') || isEditMode) && (
        <div className="flex items-center justify-end gap-2 mb-3">
          {isEditMode && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light')
                setIsEditMode(false)
              }}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white border border-purple-400 shadow-md animate-pulse cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <Check size={13} />
              <span>Done Resizing</span>
            </button>
          )}

          {completedTasks.length > 0 && completedPlacement === 'section' && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light')
                const el = document.getElementById('completed-modalities-section')
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  window.dispatchEvent(new CustomEvent('levl_expand_completed_section'))
                }
              }}
              title="Click to jump to Completed section"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border shadow-sm active:scale-95 ${
                theme === 'light'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30 shadow-emerald-500/20'
              }`}
            >
              <CheckCircle2 size={13} className={theme === 'light' ? 'text-emerald-700' : 'text-emerald-400'} />
              <span>Completed</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold border ${
                theme === 'light'
                  ? 'bg-emerald-200/80 text-emerald-900 border-emerald-400/50'
                  : 'bg-emerald-500/30 text-emerald-200 border-emerald-500/40'
              }`}>
                {completedTasks.length}
              </span>
            </button>
          )}
        </div>
      )}

      {/* Daily Quick-Log Hotkeys */}
      {showHotkeys && (
        <QuickHotkeyGrid date={date} localUserId={localUserId} userProfile={userProfile} defaultCollapsed={false} />
      )}

      {/* Active Swipe In-Feed Section (Single Active Rule) */}
      {activeSwipe && (
        <SwipeActionInFeedCard
          actionType={activeSwipe.type}
          task={activeSwipe.task}
          modality={
            activeSwipe.task.protocol_step?.modality ||
            activeSwipe.task.loose_modality ||
            allModalities.find((m) => m.id === (activeSwipe.task.modality_id || activeSwipe.task.protocol_step?.modality_id)) ||
            getCachedModalitiesSync().find((m) => m.id === (activeSwipe.task.modality_id || activeSwipe.task.protocol_step?.modality_id))
          }
          benchItem={benchItems.find(
            (b) =>
              b.modality_id ===
              (activeSwipe.task.modality_id || activeSwipe.task.protocol_step?.modality_id)
          )}
          allOutcomes={allOutcomes}
          userProfile={userProfile}
          onClose={() => setActiveSwipe(null)}
          onComplete={handleInFeedComplete}
          onSkip={handleInFeedSkip}
          onSnooze={handleInFeedSnooze}
        />
      )}

      {/* MAIN CONTENT: BY TIME OR BY PROTOCOL */}
      <BlocksDragProvider onMoveTask={handleMoveTask} onMoveHotkey={handleMoveHotkey}>
        {subView === 'time' ? (
          <div className="space-y-4">
            {orderedTimeBlocks.map(([slotKey, block]) => {
              const hasAssignedHotkeys = hotkeys.some(h => {
                if (h.assigned_time_slots && h.assigned_time_slots.length > 0) {
                  return h.assigned_time_slots.includes(slotKey)
                }
                const smartSlot = getSmartSlotForHotkey(h)
                return smartSlot === slotKey
              })
              // First Meal and Last Meal are anchored by default as core circadian eating anchors.
              // Lunch / Midday Meal is anchored as needed when tasks or hotkeys exist.
              const isDefaultMeal = slotKey === 'breakfast' || slotKey === 'dinner'
              const isLunchMeal = slotKey === 'lunch' && (block.tasks.length > 0 || hasAssignedHotkeys)
              const isMeal = isDefaultMeal || isLunchMeal
              if (block.tasks.length === 0 && !isMeal && !hasAssignedHotkeys) return null

              return (
                <BlocksTimeContainer
                  key={`${date}_${slotKey}`}
                  slotKey={slotKey}
                  slotTitle={block.title}
                  timeWindowLabel={block.timeWindow}
                  tasks={block.tasks}
                  benchItems={benchItems}
                  userProfile={userProfile}
                  allOutcomes={allOutcomes}
                  allModalities={allModalities}
                  hotkeys={hotkeys}
                  logs={quickLogs}
                  visualStyle={visualStyle}
                  layoutMode={layoutMode}
                  showDosing={showDosing}
                  isEditMode={isEditMode}
                  date={date}
                  localUserId={localUserId}
                  onOpenDetails={(t) => setSelectedTaskForModal(t)}
                  onSwipeRight={(t) => setActiveSwipe({ task: t, type: 'complete' })}
                  onSwipeLeft={(t) => setActiveSwipe({ task: t, type: 'skip_snooze' })}
                  onStatusChange={(taskId, status) => onStatusChange(taskId, status)}
                  onAddActivity={() => onAddActivity?.(slotKey)}
                  onLongPress={() => setIsEditMode(true)}
                  onQuickLog={handleQuickLogHotkey}
                  onSelectHotkey={(h) => setSelectedHotkeyForModal(h)}
                  onMoveHotkey={handleMoveHotkey}
                  onMoveTask={handleMoveTask}
                />
              )
            })}

            {/* Dedicated Completed Modalities Section (Rendered whenever completed tasks exist) */}
            {completedTasks.length > 0 && (
              <CompletedBlocksSection
                tasks={completedTasks}
                allModalities={allModalities}
                benchItems={benchItems}
                userProfile={userProfile}
                allOutcomes={allOutcomes}
                visualStyle={visualStyle}
                layoutMode={layoutMode}
                showDosing={showDosing}
                isEditMode={isEditMode}
                subView={subView}
                date={date}
                onOpenDetails={(t) => setSelectedTaskForModal(t)}
                onUndoTask={handleUndoTaskCompletion}
                onSwipeLeft={(t) => setActiveSwipe({ task: t, type: 'skip_snooze' })}
              />
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {protocolGroups.map(([pName, pTasks]) => (
              <BlocksProtocolContainer
                key={`${date}_${pName}`}
                protocolName={pName}
                tasks={pTasks}
                benchItems={benchItems}
                userProfile={userProfile}
                allOutcomes={allOutcomes}
                allModalities={allModalities}
                visualStyle={visualStyle}
                layoutMode={layoutMode}
                showDosing={showDosing}
                isEditMode={isEditMode}
                onOpenDetails={(t) => setSelectedTaskForModal(t)}
                onSwipeRight={(t) => setActiveSwipe({ task: t, type: 'complete' })}
                onSwipeLeft={(t) => setActiveSwipe({ task: t, type: 'skip_snooze' })}
                onStatusChange={(taskId, status) => onStatusChange(taskId, status)}
                onLongPress={() => setIsEditMode(true)}
                onMoveTask={handleMoveTask}
              />
            ))}

            {/* Dedicated Completed Modalities Section (Rendered whenever completed tasks exist) */}
            {completedTasks.length > 0 && (
              <CompletedBlocksSection
                tasks={completedTasks}
                allModalities={allModalities}
                benchItems={benchItems}
                userProfile={userProfile}
                allOutcomes={allOutcomes}
                visualStyle={visualStyle}
                layoutMode={layoutMode}
                showDosing={showDosing}
                isEditMode={isEditMode}
                subView={subView}
                date={date}
                onOpenDetails={(t) => setSelectedTaskForModal(t)}
                onUndoTask={handleUndoTaskCompletion}
                onSwipeLeft={(t) => setActiveSwipe({ task: t, type: 'skip_snooze' })}
              />
            )}
          </div>
        )}
      </BlocksDragProvider>

      {/* Full-Screen Modality Experience Modal */}
      {selectedTaskForModal && (() => {
        const rawId = selectedTaskForModal.modality_id || selectedTaskForModal.protocol_step?.modality_id || selectedTaskForModal.loose_modality?.id
        const catalog = allModalities.length > 0 ? allModalities : getCachedModalitiesSync()
        let resolvedMod: Modality | undefined = undefined
        if (rawId && catalog.length > 0) {
          const rawLower = rawId.toLowerCase().trim()
          const rawUnder = rawLower.replace(/-/g, '_')
          const rawDash = rawLower.replace(/_/g, '-')
          resolvedMod = catalog.find(m => {
            const mId = m.id?.toLowerCase().trim()
            const mSlug = m.slug?.toLowerCase().trim()
            return mId === rawLower || mId === rawUnder || mId === rawDash ||
                   mSlug === rawLower || mSlug === rawUnder || mSlug === rawDash
          })
        }
        if (!resolvedMod && rawId && benchItems.length > 0) {
          const bench = benchItems.find(b => b.modality_id === rawId || (b as any).id === rawId)
          if (bench?.modality) resolvedMod = bench.modality
        }
        const fullModality = resolvedMod
          ? {
              ...resolvedMod,
              ...(selectedTaskForModal.protocol_step?.modality || {}),
              ...(selectedTaskForModal.loose_modality || {})
            }
          : selectedTaskForModal.protocol_step?.modality || selectedTaskForModal.loose_modality

        return (
          <FullScreenModalityModal
            task={selectedTaskForModal}
            modality={fullModality}
            benchItem={benchItems.find(
              (b) =>
                b.modality_id ===
                (selectedTaskForModal.modality_id || selectedTaskForModal.protocol_step?.modality_id)
            )}
            benchItems={benchItems}
            allTasks={tasks}
            userProfile={userProfile}
            allOutcomes={allOutcomes}
            allModalities={allModalities}
            wellbeingCheckin={wellbeingCheckin}
            visualStyle={visualStyle}
            date={date}
            localUserId={localUserId}
            onClose={() => setSelectedTaskForModal(null)}
            onStatusChange={onStatusChange}
            onMoveToBench={onMoveToBench}
            onOpenRescheduleModal={onOpenRescheduleModal}
            onSaveCustomOutcomes={onSaveCustomOutcomes}
          />
        )
      })()}

      {/* Floating Global Undo Banner */}
      {undoEntry && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3.5 px-5 py-3 rounded-2xl bg-slate-900/95 border border-white/25 text-white shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 max-w-[92vw] sm:max-w-2xl">
          <span className="text-xs sm:text-sm font-bold text-white whitespace-normal leading-snug">
            {undoEntry.actionLabel ? `${undoEntry.taskName} ${undoEntry.actionLabel}` : undoEntry.taskName}
          </span>
          <button
            onClick={handleExecuteUndo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-black text-xs transition-all cursor-pointer shrink-0 shadow-lg shadow-purple-600/30"
          >
            <RotateCcw size={13} />
            <span>{undoEntry.buttonLabel || 'Undo'}</span>
          </button>
          <button
            onClick={() => setUndoEntry(null)}
            className="text-slate-400 hover:text-white transition-colors p-1 shrink-0"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Option 2: Dedicated Floating Water Mini-Dock */}
      <BlocksFloatingWaterDock
        waterHotkey={hotkeys.find((h) => h.id === 'water_intake')}
        logs={quickLogs}
        onQuickLog={handleQuickLogHotkey}
        onOpenDetails={(h) => setSelectedHotkeyForModal(h)}
      />

      {/* Quick Log Detail Modal (for editing increment, amount, or placement) */}
      {selectedHotkeyForModal && (
        <QuickLogDetailModal
          hotkey={selectedHotkeyForModal}
          logs={quickLogs}
          date={date}
          localUserId={localUserId}
          onClose={() => setSelectedHotkeyForModal(null)}
          onLogsChanged={reloadHotkeysAndLogs}
          onHotkeyUpdated={(updated) => {
            setHotkeys((prev) => prev.map((h) => (h.id === updated.id ? updated : h)))
          }}
        />
      )}

      {/* Manage Hotkeys Modal */}
      {isManageHotkeysOpen && (
        <ManageHotkeysModal
          localUserId={localUserId}
          activeHotkeys={hotkeys}
          onClose={() => setIsManageHotkeysOpen(false)}
          onSaved={(updated) => {
            setHotkeys(updated)
            reloadHotkeysAndLogs()
          }}
        />
      )}
    </div>
  )
}
