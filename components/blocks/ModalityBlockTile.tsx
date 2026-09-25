'use client'

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { Check, Clock, SkipForward, Sparkles, RotateCcw } from 'lucide-react'
import { DedupedTask } from '@/components/cards/ProtocolTaskCard'
import { Modality, UserBenchItem } from '@/lib/types'
import ModalityIcon from '@/components/ui/ModalityIcon'
import {
  BlockSizing,
  BlockWidth,
  BlocksVisualStyle,
  BlocksLayoutMode,
  getSimplifiedModalityName,
  getBlockVisualStyles,
  getGridClassesForSizing,
  getModalityDoseDisplay,
  getNextWidth
} from './blocksUtils'
import BlocksSynergyConnector, { ModalitySynergyInfo } from './BlocksSynergyConnector'
import BlocksSequenceBadge, { ModalitySequenceInfo } from './BlocksSequenceSpine'
import { useBlocksDrag } from './BlocksDragContext'
import { triggerHaptic } from '@/lib/utils/haptics'
import { useTheme } from '@/lib/utils/useTheme'
import { getDaylightCategoryStyle } from '@/lib/utils/modalityColors'
import { useCardBadges } from '@/lib/utils/layoutSettings'

interface ModalityBlockTileProps {
  task: DedupedTask
  modality?: Modality | null
  benchItem?: UserBenchItem | null
  sizing: BlockSizing
  visualStyle: BlocksVisualStyle
  layoutMode?: BlocksLayoutMode
  showDosing?: boolean
  currentSlotKey?: string
  isEditMode: boolean
  isIgnited?: boolean
  synergy?: ModalitySynergyInfo
  sequence?: ModalitySequenceInfo
  isPartnerHighlighted?: boolean
  isReorderTarget?: boolean
  onHighlightPartner?: (id: string | null) => void
  onOpenDetails: () => void
  onToggleComplete?: () => void // Quick 1-tap undo / toggle
  onSwipeRight: () => void // Open detailed complete in-feed or undo
  onSwipeLeft: () => void // Open detailed skip/snooze in-feed
  onResize: (newSizing: BlockSizing) => void
  onLongPress: () => void
  onMoveTask?: (taskId: string, targetSlotKey: string, targetTaskId?: string) => void
}

export default function ModalityBlockTile({
  task,
  modality,
  benchItem,
  sizing,
  visualStyle,
  layoutMode = 'dynamic',
  showDosing = false,
  currentSlotKey,
  isEditMode,
  isIgnited = true,
  synergy,
  sequence,
  isPartnerHighlighted = false,
  isReorderTarget = false,
  onHighlightPartner,
  onOpenDetails,
  onToggleComplete,
  onSwipeRight,
  onSwipeLeft,
  onResize,
  onLongPress,
  onMoveTask
}: ModalityBlockTileProps) {
  const isCompleted = task.status === 'completed'
  const isSnoozed = task.status === 'snoozed'
  const isSkipped = task.status === 'skipped'

  const { theme } = useTheme()
  const isDaylight = theme === 'light' || visualStyle === 'light-glass'
  const daylightCategory = useMemo(() => getDaylightCategoryStyle(modality || task), [modality, task])
  const { badges } = useCardBadges()
  const effectiveShowDosing = showDosing !== undefined ? showDosing : badges.showDosing

  const protocolName = useMemo(() => {
    return (
      task.protocol_step?.protocol?.name ||
      task.lineages?.[0]?.protocol_name ||
      (task as any).lineage ||
      ''
    )
  }, [task])

  const categoryName = useMemo(() => {
    return modality?.category || (modality as any)?.modality_type || ''
  }, [modality])

  const hasSynergy = useMemo(() => {
    return Boolean(synergy || modality?.synergy_notes)
  }, [synergy, modality?.synergy_notes])

  const protocolLineage = useMemo(() => {
    return (
      task.protocol_step?.protocol?.name ||
      task.lineages?.[0]?.protocol_name ||
      (task as any).lineage ||
      modality?.category ||
      'PROTOCOL'
    ).toUpperCase()
  }, [task, modality])

  const simplifiedName = getSimplifiedModalityName(modality, task)

  // Edge drag resizing state
  const [isResizing, setIsResizing] = useState(false)
  const [previewWidth, setPreviewWidth] = useState<BlockWidth>(sizing.width)
  const latestPreviewWidthRef = useRef<BlockWidth>(sizing.width)
  const edgeTimerRef = useRef<NodeJS.Timeout | null>(null)
  const resizeActiveRef = useRef(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const edgeDirectionRef = useRef<'right' | 'left'>('right')
  const cleanupWindowTouchListenersRef = useRef<(() => void) | null>(null)

  // Detect touch device to avoid native HTML5 drag hijacking touch events on mobile
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  useEffect(() => {
    if (typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
      setIsTouchDevice(true)
    }
  }, [])

  // When sizing prop changes from external source, sync previewWidth
  useEffect(() => {
    if (!isResizing) {
      setPreviewWidth(sizing.width)
      latestPreviewWidthRef.current = sizing.width
    }
  }, [sizing.width, isResizing])

  // Stop edge resize and commit changes
  const stopEdgeResize = useCallback((finalWidth?: BlockWidth) => {
    if (edgeTimerRef.current) {
      clearTimeout(edgeTimerRef.current)
      edgeTimerRef.current = null
    }
    if (cleanupWindowTouchListenersRef.current) {
      cleanupWindowTouchListenersRef.current()
      cleanupWindowTouchListenersRef.current = null
    }

    if (resizeActiveRef.current) {
      resizeActiveRef.current = false
      setIsResizing(false)
      triggerHaptic('light')
      const targetW = finalWidth || latestPreviewWidthRef.current
      if (targetW) {
        onResize({ ...sizing, width: targetW })
      }
    }
  }, [onResize, sizing])

  // Clean up any remaining window listeners on component unmount
  useEffect(() => {
    return () => {
      if (cleanupWindowTouchListenersRef.current) {
        cleanupWindowTouchListenersRef.current()
      }
      if (edgeTimerRef.current) {
        clearTimeout(edgeTimerRef.current)
      }
    }
  }, [])

  // Responsive grid classes based on active preview and layout mode
  const activeSizing = useMemo(() => {
    return isResizing ? { ...sizing, width: previewWidth } : sizing
  }, [isResizing, sizing, previewWidth])

  const { colSpanClass, heightClass } = getGridClassesForSizing(activeSizing, layoutMode)
  const styles = getBlockVisualStyles(modality, visualStyle, isCompleted, isSnoozed, isSkipped, isIgnited)
  const isOneWideSquare = layoutMode === '1-wide'

  // Large centered icon size tailored for each layout mode
  const iconSize = isOneWideSquare
    ? 22
    : layoutMode === '2-wide' || layoutMode === 'uniform'
    ? 44
    : layoutMode === '3-wide'
    ? 34
    : activeSizing.width === 'full'
    ? 44
    : activeSizing.width === '2/3'
    ? 40
    : 36

  // Edge drag calculation: computes target width based on drag position relative to start position & container
  const calculateWidthFromPointer = useCallback(
    (clientX: number, direction: 'right' | 'left', startClientX?: number): BlockWidth => {
      const isSquareMode =
        layoutMode === 'uniform' ||
        layoutMode === '2-wide' ||
        layoutMode === '3-wide' ||
        layoutMode === '1-wide'

      const currentW = sizing.width

      // Calculate outward delta (positive = expanding wider, negative = shrinking)
      let deltaX = 0
      if (typeof startClientX === 'number') {
        deltaX = direction === 'right' ? clientX - startClientX : startClientX - clientX
      } else if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect()
        const anchor = direction === 'right' ? rect.right : rect.left
        deltaX = direction === 'right' ? clientX - anchor : anchor - clientX
      }

      // Check proximity to screen edge (outer 15% margin triggers full width)
      const isNearEdge = typeof window !== 'undefined' && (clientX >= window.innerWidth - 60 || clientX <= 60)

      if (isSquareMode) {
        // Dragging outward by 35px or near edge -> ALWAYS snaps to full width!
        if (isNearEdge || deltaX >= 35) {
          return 'full'
        }
        if (currentW === 'full') {
          if (deltaX <= -65) return '1/3'
          if (deltaX <= -25) return '1/2'
          return 'full'
        }
        if (currentW === '1/3') {
          if (deltaX >= 65) return 'full'
          if (deltaX >= 25) return '1/2'
          return '1/3'
        }
        // Current is 1/2
        if (deltaX <= -30) return '1/3'
        return '1/2'
      } else {
        // Dynamic mode: 1/3, 1/2, 2/3, full
        if (isNearEdge || deltaX >= 75) {
          return 'full'
        }
        if (currentW === 'full') {
          if (deltaX <= -40) return '2/3'
          if (deltaX <= -75) return '1/2'
          if (deltaX <= -110) return '1/3'
          return 'full'
        }
        if (currentW === '2/3') {
          if (deltaX >= 35) return 'full'
          if (deltaX <= -35) return '1/2'
          if (deltaX <= -70) return '1/3'
          return '2/3'
        }
        if (currentW === '1/3') {
          if (deltaX >= 75) return 'full'
          if (deltaX >= 50) return '2/3'
          if (deltaX >= 25) return '1/2'
          return '1/3'
        }
        // Current is 1/2
        if (deltaX >= 65) return 'full'
        if (deltaX >= 30) return '2/3'
        if (deltaX <= -30) return '1/3'
        return '1/2'
      }
    },
    [layoutMode, sizing.width]
  )

  // Edge Touch Handlers (Long press to drag resize with tap-to-cycle support)
  const handleEdgeTouchStart = (e: React.TouchEvent, direction: 'right' | 'left') => {
    e.stopPropagation()
    edgeDirectionRef.current = direction
    const touch = e.touches[0]
    if (!touch) return
    const startX = touch.clientX
    let hasMovedSignificant = false
    resizeActiveRef.current = false

    // Clean up any stale listener
    if (cleanupWindowTouchListenersRef.current) {
      cleanupWindowTouchListenersRef.current()
      cleanupWindowTouchListenersRef.current = null
    }

    edgeTimerRef.current = setTimeout(() => {
      triggerHaptic('medium')
      resizeActiveRef.current = true
      setIsResizing(true)
      latestPreviewWidthRef.current = sizing.width
      setPreviewWidth(sizing.width)
    }, 180)

    const onWindowTouchMove = (moveEvt: TouchEvent) => {
      if (!moveEvt.touches || !moveEvt.touches[0]) return
      const currentTouch = moveEvt.touches[0]
      const dist = Math.abs(currentTouch.clientX - startX)

      if (dist > 8) {
        hasMovedSignificant = true
      }

      if (!resizeActiveRef.current) {
        // If moved before hold threshold, cancel hold timer
        if (dist > 15 && edgeTimerRef.current) {
          clearTimeout(edgeTimerRef.current)
          edgeTimerRef.current = null
        }
        return
      }

      moveEvt.preventDefault()
      const newW = calculateWidthFromPointer(currentTouch.clientX, edgeDirectionRef.current, startX)
      latestPreviewWidthRef.current = newW
      setPreviewWidth((prev) => {
        if (prev !== newW) triggerHaptic('selection')
        return newW
      })
    }

    const onWindowTouchEnd = () => {
      if (!hasMovedSignificant && !resizeActiveRef.current) {
        // Quick tap on edge handle: toggle to next width immediately!
        triggerHaptic('light')
        const nextW = getNextWidth(activeSizing.width, layoutMode)
        onResize({ ...sizing, width: nextW })
        if (edgeTimerRef.current) {
          clearTimeout(edgeTimerRef.current)
          edgeTimerRef.current = null
        }
        if (cleanupWindowTouchListenersRef.current) {
          cleanupWindowTouchListenersRef.current()
          cleanupWindowTouchListenersRef.current = null
        }
        return
      }
      stopEdgeResize()
    }

    window.addEventListener('touchmove', onWindowTouchMove, { passive: false })
    window.addEventListener('touchend', onWindowTouchEnd, { capture: true })
    window.addEventListener('touchcancel', onWindowTouchEnd, { capture: true })

    cleanupWindowTouchListenersRef.current = () => {
      window.removeEventListener('touchmove', onWindowTouchMove)
      window.removeEventListener('touchend', onWindowTouchEnd, { capture: true })
      window.removeEventListener('touchcancel', onWindowTouchEnd, { capture: true })
    }
  }

  // Edge Mouse Handlers (Desktop click & drag or tap to cycle)
  const handleEdgeMouseDown = (e: React.MouseEvent, direction: 'right' | 'left') => {
    e.stopPropagation()
    e.preventDefault()
    edgeDirectionRef.current = direction
    resizeActiveRef.current = true
    setIsResizing(true)
    triggerHaptic('light')

    const startX = e.clientX
    let hasMoved = false

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault()
      const dist = Math.abs(moveEvent.clientX - startX)
      if (dist > 6) hasMoved = true
      const newW = calculateWidthFromPointer(moveEvent.clientX, direction, startX)
      latestPreviewWidthRef.current = newW
      setPreviewWidth((prev) => {
        if (prev !== newW) {
          triggerHaptic('selection')
        }
        return newW
      })
    }

    const handleMouseUp = (upEvent: MouseEvent) => {
      upEvent.preventDefault()
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      resizeActiveRef.current = false
      setIsResizing(false)
      triggerHaptic('light')

      if (!hasMoved) {
        // Quick tap: cycle width directly
        const nextW = getNextWidth(activeSizing.width, layoutMode)
        onResize({ ...sizing, width: nextW })
        return
      }

      const finalW = calculateWidthFromPointer(upEvent.clientX, direction, startX) || latestPreviewWidthRef.current
      if (finalW) {
        onResize({ ...sizing, width: finalW })
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }



  const doseDisplay = useMemo(() => {
    return getModalityDoseDisplay(task, modality, benchItem)
  }, [task, modality, benchItem])

  const [isDragging, setIsDragging] = useState(false)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const swipeStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const isHorizontalSwipeRef = useRef<boolean | null>(null)

  let dragCtx: any = null
  try {
    dragCtx = useBlocksDrag()
  } catch {
    dragCtx = null
  }

  const dragItem = useMemo(
    () => ({
      id: task.id,
      type: 'task' as const,
      title: simplifiedName,
      sourceSlotKey: currentSlotKey || task.timing_slot,
      modality
    }),
    [task.id, simplifiedName, currentSlotKey, task.timing_slot, modality]
  )

  const dragHandlers = useMemo(() => {
    if (!dragCtx || isEditMode) return null
    return dragCtx.bindDraggable(dragItem, {
      onSwipeRight,
      onSwipeLeft,
      onClick: () => {
        if (!isEditMode && !isResizing) onOpenDetails()
      }
    })
  }, [dragCtx, isEditMode, isResizing, dragItem, onSwipeRight, onSwipeLeft, onOpenDetails])

  const isCurrentDragged = dragCtx?.activeDrag?.id === task.id

  // Touch Handlers with horizontal swipe detection and underlayer translation
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isEditMode || isResizing) return
    const touch = e.touches[0]
    if (!touch) return
    swipeStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() }
    isHorizontalSwipeRef.current = null
    dragHandlers?.onTouchStart(e)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isEditMode || isResizing || !swipeStartRef.current) {
      dragHandlers?.onTouchMove(e)
      return
    }

    if (dragCtx?.activeDrag) {
      dragHandlers?.onTouchMove(e)
      return
    }

    const touch = e.touches[0]
    if (!touch) return

    const diffX = touch.clientX - swipeStartRef.current.x
    const diffY = touch.clientY - swipeStartRef.current.y
    const absX = Math.abs(diffX)
    const absY = Math.abs(diffY)

    if (isHorizontalSwipeRef.current === null) {
      if (absY > 8 && absY > absX) {
        isHorizontalSwipeRef.current = false
      } else if (absX > 10 && absX > absY * 1.2) {
        isHorizontalSwipeRef.current = true
        setIsSwiping(true)
      }
    }

    if (isHorizontalSwipeRef.current === true) {
      if (e.cancelable) {
        e.preventDefault()
      }
      const maxOffset = 130
      let offset = diffX
      if (Math.abs(offset) > 80) {
        const excess = Math.abs(offset) - 80
        offset = Math.sign(offset) * (80 + excess * 0.35)
      }
      offset = Math.max(-maxOffset, Math.min(maxOffset, offset))
      setSwipeOffset(offset)
    }

    dragHandlers?.onTouchMove(e)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isHorizontalSwipeRef.current === true) {
      const SWIPE_THRESHOLD = 50
      if (swipeOffset >= SWIPE_THRESHOLD) {
        triggerHaptic('success')
        onSwipeRight()
      } else if (swipeOffset <= -SWIPE_THRESHOLD) {
        triggerHaptic('selection')
        onSwipeLeft()
      }
      setSwipeOffset(0)
      setIsSwiping(false)
      swipeStartRef.current = null
      isHorizontalSwipeRef.current = null
      return
    }

    setSwipeOffset(0)
    setIsSwiping(false)
    swipeStartRef.current = null
    isHorizontalSwipeRef.current = null
    dragHandlers?.onTouchEnd(e)
  }

  const handleTouchCancel = (e: React.TouchEvent) => {
    setSwipeOffset(0)
    setIsSwiping(false)
    swipeStartRef.current = null
    isHorizontalSwipeRef.current = null
    dragHandlers?.onTouchCancel?.(e)
  }

  // Desktop Mouse Handlers (Click for details, horizontal drag to swipe, vertical/diagonal to drag-reorder)
  const handleTileMouseDown = (e: React.MouseEvent) => {
    if (isEditMode || isResizing || e.button !== 0) return
    const target = e.target as HTMLElement
    if (target.closest('[data-resize-handle]')) return

    const startX = e.clientX
    const startY = e.clientY
    const startTime = Date.now()
    let mode: 'idle' | 'swipe' | 'drag' = 'idle'
    let currentOffset = 0

    const onMouseMove = (moveEvt: MouseEvent) => {
      const diffX = moveEvt.clientX - startX
      const diffY = moveEvt.clientY - startY
      const absX = Math.abs(diffX)
      const absY = Math.abs(diffY)

      if (mode === 'idle') {
        if (absX > 14 && absX > absY * 1.3) {
          mode = 'swipe'
          setIsSwiping(true)
        } else if (Math.hypot(diffX, diffY) > 16) {
          mode = 'drag'
          window.removeEventListener('mousemove', onMouseMove)
          window.removeEventListener('mouseup', onMouseUp)
          if (dragCtx) {
            dragCtx.startDrag(dragItem, moveEvt.clientX, moveEvt.clientY)
          }
          return
        }
      }

      if (mode === 'swipe') {
        const maxOffset = 130
        let offset = diffX
        if (Math.abs(offset) > 80) {
          const excess = Math.abs(offset) - 80
          offset = Math.sign(offset) * (80 + excess * 0.35)
        }
        offset = Math.max(-maxOffset, Math.min(maxOffset, offset))
        currentOffset = offset
        setSwipeOffset(offset)
      }
    }

    const onMouseUp = (upEvt: MouseEvent) => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)

      if (mode === 'swipe') {
        const SWIPE_THRESHOLD = 50
        if (currentOffset >= SWIPE_THRESHOLD) {
          triggerHaptic('success')
          onSwipeRight()
        } else if (currentOffset <= -SWIPE_THRESHOLD) {
          triggerHaptic('selection')
          onSwipeLeft()
        }
        setSwipeOffset(0)
        setIsSwiping(false)
        return
      }

      if (mode === 'idle') {
        if (Date.now() - startTime < 400 && Math.hypot(upEvt.clientX - startX, upEvt.clientY - startY) < 14) {
          if (!isEditMode && !isResizing) {
            onOpenDetails()
          }
        }
      }
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  return (
    <div
      ref={cardRef}
      data-task-id={task.id}
      draggable={false}
      onMouseDown={handleTileMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      style={{ touchAction: isCurrentDragged ? 'none' : 'pan-y' }}
      className={`relative select-none ${colSpanClass} ${heightClass} transition-all duration-300 ${
        isCurrentDragged ? 'opacity-30 scale-95 pointer-events-none' : ''
      } ${
        isReorderTarget ? 'ring-2 ring-purple-400 border-purple-400 shadow-xl shadow-purple-500/30 scale-[1.02]' : ''
      } ${
        isResizing ? 'ring-2 ring-purple-400 shadow-2xl shadow-purple-500/50 scale-[1.01]' : ''
      }`}
    >
      {/* Background Underlayers revealed during swipe */}
      <div className="absolute inset-0 flex items-center justify-between pointer-events-none rounded-2xl sm:rounded-3xl overflow-hidden z-0">
        {/* Complete Underlayer (Right Swipe) */}
        <div
          className="h-full bg-emerald-600/90 flex items-center px-4 gap-2 text-white font-black text-xs sm:text-sm transition-opacity shadow-inner"
          style={{
            opacity: swipeOffset > 8 ? Math.min(1, swipeOffset / 35) : 0,
            width: `${Math.max(0, swipeOffset)}px`
          }}
        >
          <Check size={20} strokeWidth={3} className="shrink-0 text-white" />
          <span className="truncate font-bold tracking-tight">Complete</span>
        </div>

        {/* Snooze / Skip Underlayer (Left Swipe) */}
        <div
          className="h-full bg-amber-600/90 flex items-center justify-end px-4 gap-2 text-white font-black text-xs sm:text-sm transition-opacity ml-auto shadow-inner"
          style={{
            opacity: swipeOffset < -8 ? Math.min(1, Math.abs(swipeOffset) / 35) : 0,
            width: `${Math.max(0, -swipeOffset)}px`
          }}
        >
          <span className="truncate font-bold tracking-tight">Snooze / Skip</span>
          <Clock size={18} className="shrink-0 text-white" />
        </div>
      </div>

      {/* Floating HUD Preview while edge resizing */}
      {isResizing && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1 rounded-full bg-slate-950/95 border border-purple-400/90 shadow-2xl backdrop-blur-md flex items-center gap-1.5 pointer-events-none animate-in fade-in zoom-in-95 duration-150 whitespace-nowrap">
          <Sparkles size={11} className="text-purple-400 animate-spin" />
          <span className="text-[11px] font-mono font-black text-purple-200 tracking-wide uppercase">
            {layoutMode === 'uniform' || layoutMode === '2-wide' || layoutMode === '3-wide' || layoutMode === '1-wide'
              ? previewWidth === '1/3'
                ? '3-Wide Square'
                : previewWidth === '1/2'
                ? '2-Wide Square (Default)'
                : '1-Wide Banner (Full Width)'
              : previewWidth === '1/3'
              ? '1/3 Width (Compact)'
              : previewWidth === '1/2'
              ? '1/2 Width (Balanced)'
              : previewWidth === '2/3'
              ? '2/3 Width (Hero)'
              : 'Full Width (Anchor)'}
          </span>
        </div>
      )}

      {/* Right Edge Resize Handle (Tap to cycle, drag outward for full width) */}
      <div
        data-resize-handle="right"
        onMouseDown={(e) => handleEdgeMouseDown(e, 'right')}
        onTouchStart={(e) => handleEdgeTouchStart(e, 'right')}
        className="absolute right-0 top-0 bottom-0 w-8 cursor-ew-resize select-none touch-none z-30 bg-transparent"
        title="Tap or drag edge to resize (Full, 1/2, 1/3)"
      />

      {/* Left Edge Resize Handle (Tap to cycle, drag outward for full width) */}
      <div
        data-resize-handle="left"
        onMouseDown={(e) => handleEdgeMouseDown(e, 'left')}
        onTouchStart={(e) => handleEdgeTouchStart(e, 'left')}
        className="absolute left-0 top-0 bottom-0 w-8 cursor-ew-resize select-none touch-none z-30 bg-transparent"
        title="Tap or drag edge to resize (Full, 1/2, 1/3)"
      />

      {/* Main Rounded Block Tile */}
      <div
        onClick={(e) => {
          if (isResizing) return
          if (isEditMode) {
            e.stopPropagation()
            triggerHaptic('selection')
            const nextW = getNextWidth(activeSizing.width, layoutMode)
            onResize({ ...sizing, width: nextW })
            return
          }
          if (Math.abs(swipeOffset) > 5) return
          onOpenDetails()
        }}
        style={{
          ...styles.cardStyle,
          transform: `translateX(${swipeOffset}px)`,
          transition: isSwiping ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}
        className={`w-full h-full rounded-2xl sm:rounded-3xl ${
          isOneWideSquare ? 'p-3 sm:p-4 flex flex-row items-center justify-between' : 'p-0 flex flex-col justify-between'
        } cursor-pointer relative overflow-hidden group transition-colors duration-500 z-10 ${
          styles.cardClassName
        } ${isEditMode ? 'ring-2 ring-purple-500/70 animate-pulse' : ''} ${
          isPartnerHighlighted ? 'ring-2 ring-emerald-400 shadow-xl shadow-emerald-500/25 scale-[1.02]' : ''
        }`}
      >
        {/* Quick Size Toggle Badge in Edit Mode */}
        {isEditMode && (
          <div
            onClick={(e) => {
              e.stopPropagation()
              triggerHaptic('selection')
              const nextW = getNextWidth(activeSizing.width, layoutMode)
              onResize({ ...sizing, width: nextW })
            }}
            className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded-full bg-purple-600/90 text-white font-mono text-[10px] font-black tracking-wide uppercase shadow-lg border border-purple-400 hover:scale-105 active:scale-95 transition-all"
            title="Tap to toggle width"
          >
            {activeSizing.width === 'full' ? 'Full' : activeSizing.width === '1/2' ? '1/2' : activeSizing.width === '1/3' ? '1/3' : activeSizing.width}
          </div>
        )}
        {isOneWideSquare ? (
          /* 1-Wide Vertically Shorter Horizontal Banner Layout */
          <div className="flex-1 flex flex-row items-center justify-between gap-3 px-1 my-auto w-full">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isDaylight ? '' : 'bg-white/5 border border-white/10'
                }`}
                style={isDaylight ? { backgroundColor: daylightCategory.bgHex, color: daylightCategory.textHex } : undefined}
              >
                <ModalityIcon
                  modality={modality}
                  size={22}
                  glow={!isDaylight && isIgnited && !isCompleted}
                  isIgnited={isIgnited}
                  customColor={isDaylight ? daylightCategory.textHex : visualStyle === 'full-gradient' ? '#FFFFFF' : undefined}
                />
              </div>
              <div className="flex flex-col text-left min-w-0">
                <div
                  className={`font-black tracking-tight leading-tight truncate text-sm sm:text-base ${
                    isCompleted ? 'line-through opacity-70' : ''
                  }`}
                  style={{ color: styles.textColor }}
                >
                  {simplifiedName}
                </div>
                {/* Meta details row: Dose, Protocol, Category, Synergies */}
                <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                  {effectiveShowDosing && doseDisplay && (
                    <span
                      className={`text-[10px] sm:text-[11px] font-mono font-bold truncate max-w-[200px] px-2 py-0.5 rounded border ${
                        isDaylight
                          ? 'bg-slate-100 text-slate-800 border-slate-300'
                          : visualStyle === 'full-gradient'
                          ? 'bg-black/30 text-white border-white/35 backdrop-blur-sm'
                          : 'bg-white/10 text-slate-200 border-white/20'
                      }`}
                      title={doseDisplay}
                    >
                      {doseDisplay}
                    </span>
                  )}

                  {badges.showProtocol && protocolName && (
                    <span
                      className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border truncate max-w-[140px] shadow-sm ${
                        isDaylight
                          ? 'bg-purple-100 text-purple-800 border-purple-300'
                          : visualStyle === 'full-gradient'
                          ? 'bg-black/30 text-white border-white/35 backdrop-blur-sm'
                          : 'bg-purple-500/25 text-purple-200 border-purple-400/40'
                      }`}
                      title={protocolName}
                    >
                      {protocolName}
                    </span>
                  )}

                  {badges.showCategory && categoryName && (
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border truncate max-w-[120px] shadow-sm ${
                        isDaylight
                          ? 'bg-slate-100 text-slate-700 border-slate-300'
                          : visualStyle === 'full-gradient'
                          ? 'bg-black/30 text-white border-white/35 backdrop-blur-sm'
                          : 'bg-slate-800/80 text-slate-200 border-slate-700/60'
                      }`}
                      title={categoryName}
                    >
                      {categoryName}
                    </span>
                  )}

                  {badges.showSynergies && hasSynergy && (
                    <span
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded border flex items-center gap-1 shadow-sm ${
                        isDaylight
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : visualStyle === 'full-gradient'
                          ? 'bg-black/30 text-amber-300 border-amber-400/40 backdrop-blur-sm'
                          : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                      }`}
                    >
                      <Sparkles size={9} className={isDaylight ? 'text-amber-800' : 'text-amber-300'} />
                      <span>Synergy</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right Status Badge */}
            <div className="flex items-center gap-1.5 shrink-0">
              {isCompleted ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    triggerHaptic('light')
                    onToggleComplete?.()
                  }}
                  title="Completed — Click to undo / mark pending"
                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shadow-sm cursor-pointer transition-all active:scale-90 group/undo ${
                    isDaylight
                      ? 'bg-[#D1FAE5] border border-[#10B981]/40 text-[#10B981] hover:bg-[#D1FAE5]/80'
                      : 'bg-emerald-500/30 hover:bg-emerald-500/50 border border-emerald-400 hover:border-emerald-300 text-emerald-400 hover:text-emerald-200'
                  }`}
                >
                  <Check size={12} strokeWidth={3} className="group-hover/undo:hidden" />
                  <RotateCcw size={11} strokeWidth={2.5} className="hidden group-hover/undo:block" />
                </button>
              ) : isSnoozed ? (
                <div className="w-5 h-5 rounded-full bg-amber-500/30 border border-amber-400 text-amber-400 flex items-center justify-center shadow-sm">
                  <Clock size={11} strokeWidth={2.5} />
                </div>
              ) : isSkipped ? (
                <div className="w-5 h-5 rounded-full bg-slate-500/30 border border-slate-400 text-slate-400 flex items-center justify-center">
                  <SkipForward size={11} />
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          /* Standard Square (2-Wide, 3-Wide) or Dynamic Centered Card Layout */
          <>
            <div className="w-full flex-1 flex flex-col items-center justify-center my-auto text-center px-2 py-3 sm:p-4 relative">
              {/* Top Floating Controls Bar: Status Badge */}
              <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-20">
                {isCompleted ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      triggerHaptic('light')
                      onToggleComplete?.()
                    }}
                    title="Completed — Click to undo / mark pending"
                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shadow-sm cursor-pointer transition-all active:scale-90 group/undo ${
                      isDaylight
                        ? 'bg-[#D1FAE5] border border-[#10B981]/40 text-[#10B981] hover:bg-[#D1FAE5]/80'
                        : 'bg-emerald-500/30 hover:bg-emerald-500/50 border border-emerald-400 hover:border-emerald-300 text-emerald-400 hover:text-emerald-200'
                    }`}
                  >
                    <Check size={12} strokeWidth={3} className="group-hover/undo:hidden" />
                    <RotateCcw size={11} strokeWidth={2.5} className="hidden group-hover/undo:block" />
                  </button>
                ) : isSnoozed ? (
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shadow-sm ${
                    isDaylight ? 'bg-amber-100 border border-amber-300 text-amber-600' : 'bg-amber-500/30 border border-amber-400 text-amber-400'
                  }`}>
                    <Clock size={11} strokeWidth={2.5} />
                  </div>
                ) : isSkipped ? (
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    isDaylight ? 'bg-slate-100 border border-slate-300 text-slate-500' : 'bg-slate-500/30 border border-slate-400 text-slate-400'
                  }`}>
                    <SkipForward size={11} />
                  </div>
                ) : null}
              </div>

              {/* Upper/Center Stage: Large Centered Modality Icon */}
              <div className="flex items-center justify-center mb-1.5 sm:mb-2">
                <ModalityIcon
                  modality={modality}
                  size={iconSize}
                  glow={!isDaylight && isIgnited && !isCompleted}
                  isIgnited={isIgnited}
                  customColor={
                    isDaylight
                      ? daylightCategory.textHex
                      : visualStyle === 'full-gradient'
                      ? '#FFFFFF'
                      : undefined
                  }
                />
              </div>

              {/* Lower Stage: Modality Name Centered */}
              <div className="w-full flex flex-col items-center justify-center text-center px-1">
                {/* Modality Name: Centered, Bold, Multi-Line Wrapped */}
                <div
                  className={`font-black tracking-tight leading-snug text-center break-words line-clamp-2 ${
                    layoutMode === '3-wide' || activeSizing.width === '1/3' || activeSizing.width === '1/4'
                      ? 'text-xs sm:text-[13px]'
                      : 'text-sm sm:text-base'
                  } ${isCompleted ? 'line-through opacity-70' : ''}`}
                  style={{ color: styles.textColor }}
                >
                  {simplifiedName}
                </div>

                {/* Badges container: Dose, Category, Synergies */}
                <div className="flex flex-col items-center gap-1 mt-1 max-w-[95%]">
                  {effectiveShowDosing && doseDisplay && (
                    <div
                      className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-bold tracking-tight truncate max-w-full shadow-sm backdrop-blur-sm border ${
                        isDaylight
                          ? 'bg-slate-100 text-slate-800 border-slate-300'
                          : visualStyle === 'full-gradient'
                          ? 'bg-black/30 text-white border-white/35'
                          : 'bg-white/10 text-slate-200 border-white/20'
                      }`}
                      title={doseDisplay}
                    >
                      {doseDisplay}
                    </div>
                  )}

                  {/* Optional metadata badges row (Category & Synergy) */}
                  {Boolean(
                    (badges.showCategory && categoryName) ||
                    (badges.showSynergies && hasSynergy)
                  ) && (
                    <div className="flex items-center justify-center gap-1 flex-wrap">
                      {badges.showCategory && categoryName && (
                        <span
                          className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border truncate max-w-[120px] shadow-sm ${
                            isDaylight
                              ? 'bg-slate-100 text-slate-700 border-slate-300'
                              : visualStyle === 'full-gradient'
                              ? 'bg-black/30 text-white border-white/35 backdrop-blur-sm'
                              : 'bg-slate-800/80 text-slate-200 border-slate-700/60'
                          }`}
                          title={categoryName}
                        >
                          {categoryName}
                        </span>
                      )}
                      {badges.showSynergies && hasSynergy && (
                        <span
                          className={`text-[8px] sm:text-[9px] font-extrabold px-2 py-0.5 rounded-full border flex items-center gap-1 shadow-sm ${
                            isDaylight
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : visualStyle === 'full-gradient'
                              ? 'bg-black/30 text-amber-300 border-amber-400/40 backdrop-blur-sm'
                              : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                          }`}
                        >
                          <Sparkles size={8} className={isDaylight ? 'text-amber-800' : 'text-amber-300'} />
                          <span>Synergy</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Protocol Full-Width Bottom Bar */}
            {badges.showProtocol && protocolName && (
              <div
                className={`w-full py-1.5 px-2.5 text-center border-t text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider truncate shrink-0 transition-colors ${
                  isDaylight
                    ? 'bg-purple-100/90 border-purple-200/80 text-purple-900 shadow-inner'
                    : visualStyle === 'full-gradient'
                    ? 'bg-black/40 border-white/20 text-white/95 backdrop-blur-md'
                    : 'bg-purple-950/50 border-purple-500/30 text-purple-200 backdrop-blur-sm'
                }`}
                title={protocolName}
              >
                {protocolName}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
