'use client'

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react'
import { Modality } from '@/lib/types'
import { triggerHaptic } from '@/lib/utils/haptics'
import ModalityIcon from '@/components/ui/ModalityIcon'

export interface DraggedItem {
  id: string
  type: 'task' | 'hotkey'
  title: string
  sourceSlotKey?: string
  modality?: Modality | null
  icon?: any
}

interface BlocksDragContextType {
  activeDrag: DraggedItem | null
  hoveredSlotKey: string | null
  hoveredTaskId: string | null
  dragPosition: { x: number; y: number } | null
  startDrag: (item: DraggedItem, startX: number, startY: number) => void
  bindDraggable: (
    item: DraggedItem,
    options?: {
      onSwipeRight?: () => void
      onSwipeLeft?: () => void
      onClick?: () => void
      isEditMode?: boolean
    }
  ) => {
    onMouseDown: (e: React.MouseEvent) => void
    onTouchStart: (e: React.TouchEvent) => void
    onTouchMove: (e: React.TouchEvent) => void
    onTouchEnd: (e: React.TouchEvent) => void
    onTouchCancel?: (e: React.TouchEvent) => void
  }
}

const BlocksDragContext = createContext<BlocksDragContextType | null>(null)

export function useBlocksDrag() {
  const ctx = useContext(BlocksDragContext)
  if (!ctx) {
    throw new Error('useBlocksDrag must be used within a BlocksDragProvider')
  }
  return ctx
}

interface BlocksDragProviderProps {
  children: React.ReactNode
  onMoveTask?: (taskId: string, targetSlotKey: string, targetTaskId?: string) => void
  onMoveHotkey?: (hotkeyId: string, targetSlotKey: string, targetHotkeyId?: string) => void
}

export function BlocksDragProvider({
  children,
  onMoveTask,
  onMoveHotkey
}: BlocksDragProviderProps) {
  const [activeDrag, setActiveDrag] = useState<DraggedItem | null>(null)
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null)
  const [hoveredSlotKey, setHoveredSlotKey] = useState<string | null>(null)
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null)

  // Ref tracking for event listeners and animation loop
  const activeDragRef = useRef<DraggedItem | null>(null)
  activeDragRef.current = activeDrag

  const startPosRef = useRef<{ x: number; y: number } | null>(null)

  const dragPosRef = useRef<{ x: number; y: number } | null>(null)
  dragPosRef.current = dragPosition

  const hoveredSlotKeyRef = useRef<string | null>(null)
  hoveredSlotKeyRef.current = hoveredSlotKey

  const hoveredTaskIdRef = useRef<string | null>(null)
  hoveredTaskIdRef.current = hoveredTaskId

  const autoScrollFrameRef = useRef<number | null>(null)

  // Centralized pending hold timer and touch start position
  // Living at the provider level guarantees that tile re-renders will NEVER orphan a running timer!
  const pendingHoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingTouchPosRef = useRef<{ x: number; y: number; time: number } | null>(null)

  // Auto-scroll loop: smooth scrolling when holding card near viewport top or bottom
  const startAutoScrollLoop = useCallback(() => {
    if (autoScrollFrameRef.current !== null) return

    const loop = () => {
      const pos = dragPosRef.current
      if (activeDragRef.current && pos) {
        const topEdge = 110
        const bottomEdge = window.innerHeight - 110

        if (pos.y < topEdge) {
          const intensity = Math.max(3, Math.min(24, ((topEdge - pos.y) / topEdge) * 24))
          window.scrollBy({ top: -intensity, behavior: 'instant' as ScrollBehavior })
          detectHoveredSlot(pos.x, pos.y)
        } else if (pos.y > bottomEdge) {
          const intensity = Math.max(3, Math.min(24, ((pos.y - bottomEdge) / 110) * 24))
          window.scrollBy({ top: intensity, behavior: 'instant' as ScrollBehavior })
          detectHoveredSlot(pos.x, pos.y)
        }
      }

      if (activeDragRef.current) {
        autoScrollFrameRef.current = requestAnimationFrame(loop)
      } else {
        autoScrollFrameRef.current = null
      }
    }

    autoScrollFrameRef.current = requestAnimationFrame(loop)
  }, [])

  const stopAutoScrollLoop = useCallback(() => {
    if (autoScrollFrameRef.current !== null) {
      cancelAnimationFrame(autoScrollFrameRef.current)
      autoScrollFrameRef.current = null
    }
  }, [])

  // Detect time block container currently under the cursor / finger
  // Uses elementsFromPoint to see through the tile without requiring pointer-events: none!
  const detectHoveredSlot = (clientX: number, clientY: number) => {
    try {
      if (typeof document === 'undefined') return
      const elements = typeof document.elementsFromPoint === 'function'
        ? document.elementsFromPoint(clientX, clientY)
        : [document.elementFromPoint(clientX, clientY)]

      let nextSlot: string | null = null
      let nextTaskId: string | null = null

      for (const el of elements) {
        if (!el) continue
        if (!nextTaskId) {
          const taskEl = el.closest('[data-task-id]')
          const tId = taskEl?.getAttribute('data-task-id')
          if (tId && activeDragRef.current && tId !== activeDragRef.current.id) {
            nextTaskId = tId
          }
        }
        if (!nextSlot) {
          const container = el.closest('[data-slot-key]')
          const slot = container?.getAttribute('data-slot-key')
          if (slot) {
            nextSlot = slot
          }
        }
        if (nextSlot && nextTaskId) break
      }

      if (nextSlot && nextSlot !== hoveredSlotKeyRef.current) {
        hoveredSlotKeyRef.current = nextSlot
        setHoveredSlotKey(nextSlot)
        triggerHaptic('selection')
      }

      if (nextTaskId !== hoveredTaskIdRef.current) {
        hoveredTaskIdRef.current = nextTaskId
        setHoveredTaskId(nextTaskId)
      }
    } catch {
      // Ignored if outside viewport
    }
  }

  // Safe cancellation helper (clean reset without reordering or moving)
  const cancelDrag = useCallback(() => {
    stopAutoScrollLoop()
    if (pendingHoldTimerRef.current) {
      clearTimeout(pendingHoldTimerRef.current)
      pendingHoldTimerRef.current = null
    }
    pendingTouchPosRef.current = null
    activeDragRef.current = null
    dragPosRef.current = null
    startPosRef.current = null
    hoveredSlotKeyRef.current = null
    hoveredTaskIdRef.current = null
    setActiveDrag(null)
    setDragPosition(null)
    setHoveredSlotKey(null)
    setHoveredTaskId(null)
    if (typeof document !== 'undefined') {
      document.body.style.userSelect = ''
    }
  }, [stopAutoScrollLoop])

  // Window scroll listener: If the user scrolls natively before a drag is actively underway,
  // INSTANTLY abort any pending hold timer! Zero chance of accidental grab while scrolling!
  useEffect(() => {
    const handleScroll = () => {
      if (!activeDragRef.current && pendingHoldTimerRef.current) {
        clearTimeout(pendingHoldTimerRef.current)
        pendingHoldTimerRef.current = null
        pendingTouchPosRef.current = null
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Start drag manually
  const startDrag = useCallback((item: DraggedItem, startX: number, startY: number) => {
    triggerHaptic('medium')
    activeDragRef.current = item
    startPosRef.current = { x: startX, y: startY }
    dragPosRef.current = { x: startX, y: startY }
    hoveredSlotKeyRef.current = item.sourceSlotKey || null
    hoveredTaskIdRef.current = null
    setActiveDrag(item)
    setDragPosition({ x: startX, y: startY })
    setHoveredSlotKey(item.sourceSlotKey || null)
    setHoveredTaskId(null)
    detectHoveredSlot(startX, startY)
    startAutoScrollLoop()
    if (typeof document !== 'undefined') {
      document.body.style.userSelect = 'none'
    }
  }, [startAutoScrollLoop])

  // End drag & execute move
  const endDrag = useCallback((releaseX?: number, releaseY?: number) => {
    stopAutoScrollLoop()
    const item = activeDragRef.current
    if (!item) {
      cancelDrag()
      return
    }

    const startPos = startPosRef.current
    let targetSlot = hoveredSlotKeyRef.current
    let targetTaskId = hoveredTaskIdRef.current

    // If explicit release coordinates are provided, query directly under finger
    if (releaseX !== undefined && releaseY !== undefined && typeof document !== 'undefined') {
      try {
        const elements = typeof document.elementsFromPoint === 'function'
          ? document.elementsFromPoint(releaseX, releaseY)
          : [document.elementFromPoint(releaseX, releaseY)]

        for (const el of elements) {
          if (!el) continue
          if (!targetTaskId) {
            const taskEl = el.closest('[data-task-id]')
            const tId = taskEl?.getAttribute('data-task-id')
            if (tId && tId !== item.id) {
              targetTaskId = tId
            }
          }
          if (!targetSlot) {
            const container = el.closest('[data-slot-key]')
            const slot = container?.getAttribute('data-slot-key')
            if (slot) {
              targetSlot = slot
            }
          }
          if (targetSlot && targetTaskId) break
        }
      } catch (err) {
        console.warn('[BlocksDragContext] elementsFromPoint failed:', err)
      }
    }

    const finalX = releaseX !== undefined ? releaseX : (dragPosRef.current?.x || 0)
    const finalY = releaseY !== undefined ? releaseY : (dragPosRef.current?.y || 0)
    const dist = startPos ? Math.hypot(finalX - startPos.x, finalY - startPos.y) : 0

    const isSlotChange = Boolean(targetSlot && item.sourceSlotKey && targetSlot !== item.sourceSlotKey)
    const isReorder = Boolean(targetTaskId && targetTaskId !== item.id)

    // STATE OF THE ART SAFEGUARD:
    // If the user released in place (dist < 22px) OR dropped in the same slot without targeting another task,
    // IT IS AN INTENTIONAL NO-OP! Do not reorder or alter stored arrays!
    if (dist < 22 || (!isSlotChange && !isReorder)) {
      cancelDrag()
      return
    }

    try {
      if (isSlotChange || isReorder) {
        triggerHaptic('success')
        if (item.type === 'task' && onMoveTask && targetSlot) {
          onMoveTask(item.id, targetSlot, targetTaskId || undefined)
        } else if (item.type === 'hotkey' && onMoveHotkey && targetSlot) {
          onMoveHotkey(item.id, targetSlot, targetTaskId || undefined)
        }
      }
    } catch (err) {
      console.error('[BlocksDragContext] Error completing drag:', err)
    } finally {
      cancelDrag()
    }
  }, [onMoveTask, onMoveHotkey, stopAutoScrollLoop, cancelDrag])

  // Active drag listeners for position tracking and auto-scroll (active ONLY during a live drag)
  useEffect(() => {
    if (!activeDrag) return

    const handleTouchMove = (e: TouchEvent) => {
      if (e.cancelable) {
        e.preventDefault() // Prevents background scroll while actively dragging a card
      }
      if (e.touches && e.touches[0]) {
        const touch = e.touches[0]
        setDragPosition({ x: touch.clientX, y: touch.clientY })
        dragPosRef.current = { x: touch.clientX, y: touch.clientY }
        detectHoveredSlot(touch.clientX, touch.clientY)
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      let relX: number | undefined
      let relY: number | undefined
      if (e.changedTouches && e.changedTouches[0]) {
        relX = e.changedTouches[0].clientX
        relY = e.changedTouches[0].clientY
      }
      endDrag(relX, relY)
    }

    const handleTouchCancel = () => {
      cancelDrag()
    }

    const handleMouseMove = (e: MouseEvent) => {
      setDragPosition({ x: e.clientX, y: e.clientY })
      dragPosRef.current = { x: e.clientX, y: e.clientY }
      detectHoveredSlot(e.clientX, e.clientY)
    }

    const handleMouseUp = (e: MouseEvent) => {
      endDrag(e.clientX, e.clientY)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cancelDrag()
      }
    }

    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)
    window.addEventListener('touchcancel', handleTouchCancel)
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('touchcancel', handleTouchCancel)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeDrag, endDrag, cancelDrag])

  // Factory function to bind draggable interactions to any card (mouse + mobile touch)
  const bindDraggable = useCallback(
    (
      item: DraggedItem,
      options?: {
        onSwipeRight?: () => void
        onSwipeLeft?: () => void
        onClick?: () => void
        isEditMode?: boolean
      }
    ) => {
      const HOLD_DELAY = options?.isEditMode ? 140 : 450
      const TOLERANCE = 6

      return {
        // Desktop mouse drag: deliberate 14px threshold to prevent accidental grabs on click
        onMouseDown: (e: React.MouseEvent) => {
          if (e.button !== 0) return // Only primary click
          const target = e.target as HTMLElement
          if (target.closest('[data-resize-handle]') || target.closest('button')) return

          const startX = e.clientX
          const startY = e.clientY
          let isDragging = false

          const onMouseMove = (moveEvt: MouseEvent) => {
            const dist = Math.hypot(moveEvt.clientX - startX, moveEvt.clientY - startY)
            if (!isDragging && dist > (options?.isEditMode ? 6 : 14)) {
              isDragging = true
              window.removeEventListener('mousemove', onMouseMove)
              window.removeEventListener('mouseup', onMouseUp)
              startDrag(item, moveEvt.clientX, moveEvt.clientY)
            }
          }

          const onMouseUp = (upEvt: MouseEvent) => {
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', onMouseUp)
            if (activeDragRef.current) {
              endDrag(upEvt.clientX, upEvt.clientY)
            } else if (!isDragging) {
              options?.onClick?.()
            }
          }

          window.addEventListener('mousemove', onMouseMove)
          window.addEventListener('mouseup', onMouseUp)
        },

        // Mobile touch drag with intentional press-and-hold (450ms) and strict 6px movement tolerance
        onTouchStart: (e: React.TouchEvent) => {
          if (!e.touches || !e.touches[0]) return
          const t = e.touches[0]
          pendingTouchPosRef.current = { x: t.clientX, y: t.clientY, time: Date.now() }

          if (pendingHoldTimerRef.current) {
            clearTimeout(pendingHoldTimerRef.current)
            pendingHoldTimerRef.current = null
          }

          pendingHoldTimerRef.current = setTimeout(() => {
            pendingHoldTimerRef.current = null
            startDrag(item, t.clientX, t.clientY)
          }, HOLD_DELAY)
        },

        onTouchMove: (e: React.TouchEvent) => {
          if (!e.touches || !e.touches[0]) return
          if (activeDragRef.current) return // Already dragging; window listener handles tracking

          const t = e.touches[0]
          const startPos = pendingTouchPosRef.current
          if (!startPos) return

          const dist = Math.hypot(t.clientX - startPos.x, t.clientY - startPos.y)

          // Strict tolerance: Any movement > 6px means the user is scrolling the page or swiping!
          // Instantly and permanently abort the hold timer so scrolling is 100% natural!
          if (dist > TOLERANCE) {
            if (pendingHoldTimerRef.current) {
              clearTimeout(pendingHoldTimerRef.current)
              pendingHoldTimerRef.current = null
            }
          }
        },

        onTouchEnd: (e: React.TouchEvent) => {
          const hadTimer = Boolean(pendingHoldTimerRef.current)
          if (pendingHoldTimerRef.current) {
            clearTimeout(pendingHoldTimerRef.current)
            pendingHoldTimerRef.current = null
          }

          if (activeDragRef.current) {
            return
          }

          const startPos = pendingTouchPosRef.current
          pendingTouchPosRef.current = null

          if (e.changedTouches && e.changedTouches[0] && startPos) {
            const t = e.changedTouches[0]
            const duration = Date.now() - startPos.time
            const diffX = t.clientX - startPos.x
            const diffY = t.clientY - startPos.y
            const dist = Math.hypot(diffX, diffY)

            // Horizontal Swipe intent
            if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY) * 1.2) {
              if (diffX > 0 && options?.onSwipeRight) {
                options.onSwipeRight()
                return
              } else if (diffX < 0 && options?.onSwipeLeft) {
                options.onSwipeLeft()
                return
              }
            } else if (hadTimer && dist < 10 && duration < 350 && options?.onClick) {
              options.onClick()
              return
            }
          }
        },

        onTouchCancel: () => {
          if (pendingHoldTimerRef.current) {
            clearTimeout(pendingHoldTimerRef.current)
            pendingHoldTimerRef.current = null
          }
          pendingTouchPosRef.current = null
        }
      }
    },
    [startDrag, endDrag]
  )

  return (
    <BlocksDragContext.Provider
      value={{
        activeDrag,
        hoveredSlotKey,
        hoveredTaskId,
        dragPosition,
        startDrag,
        bindDraggable
      }}
    >
      {children}

      {/* Floating Drag Overlay (Follows pointer / finger smoothly with 0 latency GPU acceleration) */}
      {activeDrag && dragPosition && (
        <div
          className="fixed pointer-events-none z-[99999] select-none will-change-transform"
          style={{
            left: 0,
            top: 0,
            transform: `translate3d(${dragPosition.x}px, ${dragPosition.y}px, 0) translate(-50%, -50%) rotate(2deg) scale(1.05)`,
            transition: 'none'
          }}
        >
          <div className="w-48 sm:w-56 p-3.5 rounded-2xl sm:rounded-3xl border-2 border-purple-400 bg-slate-950/95 backdrop-blur-2xl shadow-2xl shadow-purple-900/60 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center mb-1.5 text-purple-300">
              <ModalityIcon modality={activeDrag.modality} size={24} glow={true} isIgnited={true} />
            </div>
            <div className="text-xs sm:text-sm font-black text-white tracking-tight break-words line-clamp-2 px-1">
              {activeDrag.title}
            </div>
            <div className="mt-1 text-[10px] font-mono text-purple-300/80 font-bold uppercase tracking-wider">
              {hoveredTaskId && hoveredTaskId !== activeDrag.id
                ? 'Reorder in time block'
                : hoveredSlotKey
                ? `Drop in ${hoveredSlotKey.replace('_', ' ')}`
                : 'Dragging...'}
            </div>
          </div>
        </div>
      )}
    </BlocksDragContext.Provider>
  )
}
