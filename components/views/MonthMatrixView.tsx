'use client'

import React, { useState } from 'react'
import { DailyProtocolTask, UserProfile } from '@/lib/types'
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from 'date-fns'
import { Calendar } from 'lucide-react'
import { LayoutOrientation } from '../ui/ViewSelectorHeader'
import { ExpandedModalityDetailBanner } from './ExpandedModalityDetailBanner'
import { groupTasksByTimeBlock, groupTasksByProtocol, sortTasksChronologically } from '@/lib/data/resolveOptimalTiming'
import { getModalityTheme } from '@/lib/utils/modalityColors'

interface MonthMatrixViewProps {
  tasksByDate: Record<string, DailyProtocolTask[]>
  currentDateStr: string
  selectedProtocolFilter?: string
  selectedIsolatedOutcome?: string | null
  layoutOrientation?: LayoutOrientation
  viewMode?: 'chronological' | 'protocol'
  userProfile?: UserProfile | null
  onSelectDate: (dateStr: string) => void
  onMoveToBench?: (task: DailyProtocolTask) => void
  onEliminateEntirely?: (task: DailyProtocolTask, reason?: string, selectedReasons?: string[]) => void
  activeCategoryFilters?: { exercise: boolean; fasting: boolean; pulsed: boolean; daily: boolean }
}

function dedupeTasksForColumn(tasks: DailyProtocolTask[]) {
  const map = new Map<string, DailyProtocolTask>()
  tasks.forEach(t => {
    const mod = t.protocol_step?.modality || t.loose_modality
    const splitNumber = t.execution_details?.split_dose_number || (t.id.includes('-split-') ? t.id.split('-split-')[1] : 0)
    const baseKey = (t.modality_id || mod?.id || mod?.name || t.id).trim().toLowerCase()
    const key = splitNumber ? `${baseKey}-split-${splitNumber}` : baseKey

    if (!map.has(key)) {
      map.set(key, t)
    }
  })
  return Array.from(map.values())
}

export const MonthMatrixView: React.FC<MonthMatrixViewProps> = ({
  tasksByDate,
  currentDateStr,
  layoutOrientation = 'columns',
  viewMode = 'chronological',
  userProfile,
  onSelectDate,
  onMoveToBench,
  onEliminateEntirely
}) => {
  const [expandedTask, setExpandedTask] = useState<DailyProtocolTask | null>(null)

  const currentObj = parseISO(currentDateStr + 'T00:00:00')
  const monthStart = startOfMonth(currentObj)
  const monthEnd = endOfMonth(currentObj)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const isStacked = layoutOrientation === 'stack'

  return (
    <div className="my-1 bg-slate-950/95 border border-slate-800/90 rounded-xl p-1.5 sm:p-2.5 shadow-xl space-y-2 w-full">
      {/* Month Matrix Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-1 px-1">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
          <h2 className="text-xs sm:text-sm font-extrabold text-white">
            {format(currentObj, 'MMMM yyyy')} Pulse Matrix
          </h2>
        </div>
        <span className="text-[10px] text-slate-400">
          Viewing by {viewMode === 'protocol' ? 'Protocols' : 'Time Blocks'}
        </span>
      </div>

      {/* Full-Width Modality Expansion Banner */}
      {expandedTask && (
        <ExpandedModalityDetailBanner
          task={expandedTask}
          onClose={() => setExpandedTask(null)}
          onMoveToBench={onMoveToBench}
          onEliminateEntirely={onEliminateEntirely}
        />
      )}

      {/* Grid vs Stack Layout */}
      {!isStacked ? (
        <>
          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-0.5 text-center text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
            <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
          </div>

          {/* Month Days Matrix Grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {monthDays.map((dayObj) => {
              const dStr = format(dayObj, 'yyyy-MM-dd')
              const isSelected = dStr === currentDateStr
              const isCurrentToday = isToday(dayObj)

              const rawTasks = tasksByDate[dStr] || []
              const dedupedTasks = sortTasksChronologically(dedupeTasksForColumn(rawTasks), userProfile)
              const completedCount = dedupedTasks.filter(t => t.status === 'completed').length
              const adherencePct = dedupedTasks.length > 0 ? Math.round((completedCount / dedupedTasks.length) * 100) : 0

              return (
                <div
                  key={dStr}
                  onClick={() => onSelectDate(dStr)}
                  title={`Click to open Today view for ${format(dayObj, 'EEEE, MMMM d, yyyy')}`}
                  className={`p-1 sm:p-1.5 rounded-xl text-left flex flex-col justify-between min-h-[68px] sm:min-h-[84px] transition-all cursor-pointer border group hover:border-cyan-400 hover:bg-slate-900 hover:shadow-[0_0_15px_rgba(6,182,212,0.25)] hover:scale-[1.02] active:scale-[0.98] ${
                    isSelected
                      ? 'bg-cyan-950/90 border-cyan-500 ring-1 ring-cyan-500/60 shadow-md'
                      : isCurrentToday
                      ? 'bg-teal-950/40 border-teal-600/70'
                      : 'bg-slate-900/60 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-1">
                      <span className={`text-[11px] sm:text-xs font-black leading-none transition-colors ${isSelected ? 'text-cyan-300' : isCurrentToday ? 'text-teal-300' : 'text-slate-200 group-hover:text-cyan-200'}`}>
                        {format(dayObj, 'd')}
                      </span>
                      <span className="text-[9px] font-black text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        →
                      </span>
                    </div>
                    {completedCount > 0 && (
                      <span className={`text-[8px] px-1 py-0 rounded font-mono font-bold leading-none border ${
                        adherencePct >= 80 
                          ? 'bg-emerald-950/90 text-emerald-300 border-emerald-800/70' 
                          : 'bg-slate-900 text-slate-400 border-slate-700'
                      }`}>
                        {adherencePct}% ({completedCount})
                      </span>
                    )}
                  </div>

                  {/* Event Blocks - NO icons */}
                  <div className="space-y-0.5 w-full overflow-hidden mt-0.5 pointer-events-none">
                    {dedupedTasks.slice(0, 3).map((t, idx) => {
                      const mod = t.protocol_step?.modality || t.loose_modality
                      const modName = mod?.name || (t as any).name || 'Task'
                      const theme = getModalityTheme(t)

                      return (
                        <div
                          key={idx}
                          className="px-1 py-0.5 rounded-r-[3px] text-[8.5px] font-black truncate leading-none w-full shadow-2xs border-l-[2.5px]"
                          style={{
                            borderLeftColor: theme.borderHex,
                            backgroundColor: theme.bgTint,
                            color: theme.textHex
                          }}
                        >
                          {modName}
                        </div>
                      )
                    })}
                    {dedupedTasks.length > 3 && (
                      <div className="text-[8px] text-cyan-400 font-extrabold text-right leading-none pt-0.5 pr-0.5">
                        +{dedupedTasks.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        /* Vertical Stacked Days List Mode */
        <div className="space-y-2 pt-1">
          {monthDays.map((dayObj) => {
            const dStr = format(dayObj, 'yyyy-MM-dd')
            const isSelected = dStr === currentDateStr
            const isCurrentToday = isToday(dayObj)

            const rawTasks = tasksByDate[dStr] || []
            const dedupedTasks = dedupeTasksForColumn(rawTasks)

            if (dedupedTasks.length === 0) return null

            const completedCount = dedupedTasks.filter(t => t.status === 'completed').length
            const adherencePct = Math.round((completedCount / dedupedTasks.length) * 100)

            const timeBlocks = viewMode === 'chronological'
              ? groupTasksByTimeBlock(dedupedTasks, userProfile)
              : []
            const protocolBlocks = viewMode === 'protocol'
              ? groupTasksByProtocol(dedupedTasks, userProfile)
              : []

            return (
              <div
                key={dStr}
                className={`p-2.5 rounded-xl border transition-all space-y-2 group hover:border-cyan-400/80 hover:bg-slate-900/90 hover:shadow-md ${
                  isSelected
                    ? 'bg-cyan-950/90 border-cyan-500 shadow-md'
                    : isCurrentToday
                    ? 'bg-teal-950/40 border-teal-600/70'
                    : 'bg-slate-900/60 border-slate-800/80'
                }`}
              >
                <div 
                  onClick={() => onSelectDate(dStr)}
                  title={`Click to open Today view for ${format(dayObj, 'EEEE, MMMM d, yyyy')}`}
                  className="flex items-center justify-between border-b border-slate-800/60 pb-1.5 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-xs sm:text-sm font-black ${isSelected ? 'text-cyan-300' : isCurrentToday ? 'text-teal-300' : 'text-white group-hover:text-cyan-200'}`}>
                      {format(dayObj, 'EEEE, MMM d')}
                    </span>
                    <span className="text-[9px] text-teal-400 font-bold group-hover:translate-x-0.5 transition-transform">
                      Open Day →
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      adherencePct >= 80 
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60' 
                        : 'bg-slate-900 text-slate-400 border border-slate-700'
                    }`}>
                      {adherencePct}% ({completedCount}/{dedupedTasks.length})
                    </span>
                  </div>
                </div>

                {/* Grouped Tasks (Time Blocks or Protocols) */}
                <div className="space-y-2">
                  {viewMode === 'protocol' ? (
                    protocolBlocks.map((pBlock) => (
                      <div key={pBlock.protocolName} className="space-y-1">
                        <div className="flex items-center gap-1.5 px-1 py-0.5 border-b border-white/5">
                          <span 
                            className="w-1.5 h-1.5 rounded-full" 
                            style={{ backgroundColor: pBlock.protocolColorHex || '#A855F7' }} 
                          />
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-300">
                            {pBlock.protocolName}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                          {pBlock.tasks.map((t) => renderStackedCard(t))}
                        </div>
                      </div>
                    ))
                  ) : (
                    timeBlocks.map((tBlock) => (
                      <div key={tBlock.block.id} className="space-y-1">
                        <div className="flex items-center gap-1.5 px-1 py-0.5 border-b border-slate-800/80">
                          <span className="text-xs">{tBlock.block.icon}</span>
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-300">
                            {tBlock.block.label}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                          {tBlock.tasks.map((t) => renderStackedCard(t))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  function renderStackedCard(t: DailyProtocolTask) {
    const theme = getModalityTheme(t)
    const mod = t.protocol_step?.modality || t.loose_modality
    const modName = mod?.name || (t as any).name || 'Task'
    const doseStr = t.execution_details?.custom_dose || mod?.dose_or_exposure || ''
    const isCompleted = t.status === 'completed'

    return (
      <div
        key={t.id}
        onClick={() => setExpandedTask(t)}
        className={`p-2 rounded-lg border-l-[3.5px] transition-all cursor-pointer group shadow-2xs ${
          isCompleted ? 'opacity-70' : 'opacity-100 hover:opacity-100'
        }`}
        style={{
          borderLeftColor: theme.borderHex,
          backgroundColor: theme.bgTint
        }}
      >
        <div className="flex items-center justify-between gap-1">
          <span 
            className="text-[8px] font-black uppercase tracking-wider"
            style={{ color: theme.colorHex }}
          >
            {theme.label}
          </span>
          {isCompleted && (
            <span className="text-[8px] font-mono font-bold text-emerald-400">
              ✓
            </span>
          )}
        </div>

        <div 
          className="text-[10px] font-black leading-tight truncate group-hover:brightness-125 transition-all"
          style={{ color: theme.textHex }}
        >
          {modName}
        </div>

        {doseStr && (
          <div className="text-[8.5px] text-slate-300/80 font-mono truncate">
            {doseStr}
          </div>
        )}
      </div>
    )
  }
}
