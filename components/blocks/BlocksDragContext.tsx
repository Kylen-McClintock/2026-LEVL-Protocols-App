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
  bindDraggable: (item: DraggedItem, options?: { onSwipeRight?: () => void; onSwipeLeft?: () => void; onClick?: () => void }) => {
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
  onMoveHotkey?: (hotkeyId: string, targetSlotKey: string) => void
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

  const dragPosRef = useRef<{ x: number; y: number } | null>(null)
  dragPosRef.current = dragPosition

  const hoveredSlotKeyRef = useRef<string | null>(null)
  hoveredSlotKeyRef.current = hoveredSlotKey

  const hoveredTaskIdRef = useRef<string | null>(null)
  hoveredTaskIdRef.current = hoveredTaskId

  const autoScrollFrameRef = useRef<number | null>(null)

  // Auto-scroll loop: smooth scrolling when holding card near viewport top or bottom
  const startAutoScrollLoop = useCallback(() => {
    if (autoScrollFrameRef.current !== null) return

    const loop = () => {
      const pos = dragPosRef.current
      if (activeDragRef.current && pos) {
        const topEdge = 110
        const bottomEdge = window.innerHeight - 110

        if (pos.y < topEdge) {
          // Closer to edge = faster scroll
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
  const detectHoveredSlot = (clientX: number, clientY: number) => {
    try {
      const el = document.elementFromPoint(clientX, clientY)
      const container = el?.closest('[data-slot-key]')
      const slot = container?.getAttribute('data-slot-key') || null
      if (slot !== hoveredSlotKeyRef.current) {
        hoveredSlotKeyRef.current = slot
        setHoveredSlotKey(slot)
        if (slot) {
          triggerHaptic('selection')
        }
      }

      const taskEl = el?.closest('[data-task-id]')
      const taskId = taskEl?.getAttribute('data-task-id') || null
      if (taskId !== hoveredTaskIdRef.current) {
        hoveredTaskIdRef.current = taskId
        setHoveredTaskId(taskId)
      }
    } catch {
      // Ignored if outside viewport
    }
  }

  // Start drag manually
  const startDrag = useCallback((item: DraggedItem, startX: number, startY: number) => {
    triggerHaptic('medium')
    activeDragRef.current = item
    dragPosRef.current = { x: startX, y: startY }
    setActiveDrag(item)
    setDragPosition({ x: startX, y: startY })
    detectHoveredSlot(startX, startY)
    startAutoScrollLoop()
  }, [startAutoScrollLoop])

  // End drag & execute move
  const endDrag = useCallback((releaseX?: number, releaseY?: number) => {
    stopAutoScrollLoop()
    const item = activeDragRef.current
    let targetSlot = hoveredSlotKeyRef.current
    let targetTaskId = hoveredTaskIdRef.current

    // If explicit release coordinates are provided (from touchend/pointerup), query directly under finger
    if (releaseX !== undefined && releaseY !== undefined && typeof document !== 'undefined') {
      try {
        const el = document.elementFromPoint(releaseX, releaseY)
        const container = el?.closest('[data-slot-key]')
        const slot = container?.getAttribute('data-slot-key')
        if (slot) {
          targetSlot = slot
        }
        const taskEl = el?.closest('[data-task-id]')
        const tId = taskEl?.getAttribute('data-task-id')
        if (tId) {
          targetTaskId = tId
        }
      } catch (err) {
        console.warn('[BlocksDragContext] elementFromPoint failed:', err)
      }
    }

    try {
      if (item && targetSlot) {
        const isSlotChange = targetSlot !== item.sourceSlotKey
        const isReorder = Boolean(targetTaskId && targetTaskId !== item.id)
        const isSameSlot = targetSlot === item.sourceSlotKey

        if (isSlotChange || isReorder || isSameSlot) {
          triggerHaptic('success')
          if (item.type === 'task' && onMoveTask) {
            onMoveTask(item.id, targetSlot, targetTaskId || undefined)
          } else if (item.type === 'hotkey' && onMoveHotkey) {
            onMoveHotkey(item.id, targetSlot)
          }
        }
      }
    } catch (err) {
      console.error('[BlocksDragContext] Error completing drag:', err)
    } finally {
      // Unconditionally and synchronously clear all drag state
      activeDragRef.current = null
      hoveredSlotKeyRef.current = null
      hoveredTaskIdRef.current = null
      dragPosRef.current = null
      setActiveDrag(null)
      setDragPosition(null)
      setHoveredSlotKey(null)
      setHoveredTaskId(null)
    }
  }, [onMoveTask, onMoveHotkey, stopAutoScrollLoop])

  // Continuous global window capture listeners: guarantees finger release is never missed anywhere
  useEffect(() => {
    const handleGlobalRelease = (e: any) => {
      if (activeDragRef.current) {
        let relX: number | undefined
        let relY: number | undefined
        if (e.changedTouches && e.changedTouches[0]) {
          relX = e.changedTouches[0].clientX
          relY = e.changedTouches[0].clientY
        } else if (typeof e.clientX === 'number') {
          relX = e.clientX
          relY = e.clientY
        }
        endDrag(relX, relY)
      }
    }

    window.addEventListener('pointerup', handleGlobalRelease, { capture: true })
    window.addEventListener('touchend', handleGlobalRelease, { capture: true })
    window.addEventListener('touchcancel', handleGlobalRelease, { capture: true })
    window.addEventListener('mouseup', handleGlobalRelease, { capture: true })
    window.addEventListener('blur', handleGlobalRelease, { capture: true })

    return () => {
      window.removeEventListener('pointerup', handleGlobalRelease, { capture: true })
      window.removeEventListener('touchend', handleGlobalRelease, { capture: true })
      window.removeEventListener('touchcancel', handleGlobalRelease, { capture: true })
      window.removeEventListener('mouseup', handleGlobalRelease, { capture: true })
      window.removeEventListener('blur', handleGlobalRelease, { capture: true })
    }
  }, [endDrag])

  // Active drag listeners for position tracking and auto-scroll
  useEffect(() => {
    if (!activeDrag) return

    const handlePointerMove = (e: PointerEvent) => {
      setDragPosition({ x: e.clientX, y: e.clientY })
      dragPosRef.current = { x: e.clientX, y: e.clientY }
      detectHoveredSlot(e.clientX, e.clientY)
    }

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

    const handleRelease = (e: any) => {
      let relX: number | undefined
      let relY: number | undefined
      if (e.changedTouches && e.changedTouches[0]) {
        relX = e.changedTouches[0].clientX
        relY = e.changedTouches[0].clientY
      } else if (typeof e.clientX === 'number') {
        relX = e.clientX
        relY = e.clientY
      }
      endDrag(relX, relY)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stopAutoScrollLoop()
        endDrag()
      }
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('pointerup', handleRelease, { capture: true })
    window.addEventListener('mouseup', handleRelease, { capture: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleRelease, { capture: true })
    window.addEventListener('touchcancel', handleRelease, { capture: true })
    window.addEventListener('dragend', handleRelease, { capture: true })
    window.addEventListener('blur', handleRelease, { capture: true })
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handleRelease, { capture: true })
      window.removeEventListener('mouseup', handleRelease, { capture: true })
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleRelease, { capture: true })
      window.removeEventListener('touchcancel', handleRelease, { capture: true })
      window.removeEventListener('dragend', handleRelease, { capture: true })
      window.removeEventListener('blur', handleRelease, { capture: true })
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeDrag, endDrag, stopAutoScrollLoop])

  // Factory function to bind draggable interactions to any card (mouse + mobile touch)
  const bindDraggable = useCallback(
    (
      item: DraggedItem,
      options?: {
        onSwipeRight?: () => void
        onSwipeLeft?: () => void
        onClick?: () => void
      }
    ) => {
      let touchStartTime = 0
      let touchStartX = 0
      let touchStartY = 0
      let isHoldTriggered = false
      let holdTimer: any = null

      return {
        // Desktop mouse drag
        onMouseDown: (e: React.MouseEvent) => {
          if (e.button !== 0) return // Only primary click
          const startX = e.clientX
          const startY = e.clientY

          const onMouseMove = (moveEvt: MouseEvent) => {
            const dist = Math.hypot(moveEvt.clientX - startX, moveEvt.clientY - startY)
            if (dist > 7) {
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
            }
          }

          window.addEventListener('mousemove', onMouseMove)
          window.addEventListener('mouseup', onMouseUp)
        },

        // Mobile touch drag with press-and-hold (180ms)
        onTouchStart: (e: React.TouchEvent) => {
          if (!e.touches || !e.touches[0]) return
          const t = e.touches[0]
          touchStartTime = Date.now()
          touchStartX = t.clientX
          touchStartY = t.clientY
          isHoldTriggered = false

          if (holdTimer) clearTimeout(holdTimer)
          holdTimer = setTimeout(() => {
            isHoldTriggered = true
            startDrag(item, touchStartX, touchStartY)
          }, 180)
        },

        onTouchMove: (e: React.TouchEvent) => {
          if (!e.touches || !e.touches[0]) return
          const t = e.touches[0]
          const diffX = t.clientX - touchStartX
          const diffY = t.clientY - touchStartY
          const dist = Math.hypot(diffX, diffY)

          // If moving significantly before hold is reached, cancel hold timer and allow natural gestures (swipe/scroll)
          if (!isHoldTriggered && dist > 10) {
            if (holdTimer) {
              clearTimeout(holdTimer)
              holdTimer = null
            }
          }
        },

        onTouchEnd: (e: React.TouchEvent) => {
          if (holdTimer) {
            clearTimeout(holdTimer)
            holdTimer = null
          }

          if (isHoldTriggered || activeDragRef.current) {
            const touch = e.changedTouches?.[0]
            endDrag(touch?.clientX, touch?.clientY)
            return
          }

          // Check for quick swipe or tap
          const duration = Date.now() - touchStartTime
          if (e.changedTouches && e.changedTouches[0] && duration < 350) {
            const t = e.changedTouches[0]
            const diffX = t.clientX - touchStartX
            const diffY = t.clientY - touchStartY

            if (Math.abs(diffX) > 45 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
              if (diffX > 0 && options?.onSwipeRight) {
                options.onSwipeRight()
                return
              } else if (diffX < 0 && options?.onSwipeLeft) {
                options.onSwipeLeft()
                return
              }
            } else if (Math.hypot(diffX, diffY) < 10 && options?.onClick) {
              options.onClick()
              return
            }
          }
        },

        onTouchCancel: (e: React.TouchEvent) => {
          if (holdTimer) {
            clearTimeout(holdTimer)
            holdTimer = null
          }
          if (isHoldTriggered || activeDragRef.current) {
            const touch = e.changedTouches?.[0]
            endDrag(touch?.clientX, touch?.clientY)
          }
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

      {/* Floating Drag Overlay (Follows pointer / finger smoothly) */}
      {activeDrag && dragPosition && (
        <div
          className="fixed pointer-events-none z-[99999] select-none transition-transform duration-75"
          style={{
            left: `${dragPosition.x}px`,
            top: `${dragPosition.y}px`,
            transform: 'translate(-50%, -50%) rotate(2.5deg) scale(1.04)'
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
