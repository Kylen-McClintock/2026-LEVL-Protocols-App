'use client'

import React, { useState } from 'react'
import { DailyProtocolTask, UserProfile } from '@/lib/types'
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isToday, startOfWeek, endOfWeek, isSameMonth } from 'date-fns'
import { Calendar } from 'lucide-react'
import { LayoutOrientation } from '../ui/ViewSelectorHeader'
import { ExpandedModalityDetailBanner } from './ExpandedModalityDetailBanner'
import { groupTasksByTimeBlock, groupTasksByProtocol, sortTasksChronologically } from '@/lib/data/resolveOptimalTiming'
import { getModalityTheme, getModalityLabelColor } from '@/lib/utils/modalityColors'
import { useTheme } from '@/lib/utils/useTheme'
import ProtocolAvatar from '../ui/ProtocolAvatar'

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
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const [expandedTask, setExpandedTask] = useState<DailyProtocolTask | null>(null)

  const currentObj = parseISO(currentDateStr + 'T00:00:00')
  const monthStart = startOfMonth(currentObj)
  const monthEnd = endOfMonth(currentObj)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const isStacked = layoutOrientation === 'stack'

  return (
    <div className={`month-matrix-view my-1 border rounded-xl p-1.5 sm:p-2.5 shadow-xl space-y-2 w-full ${
      isLight ? 'bg-white/95 border-slate-200' : 'bg-slate-950/95 border-slate-800/90'
    }`}>
      {/* Month Matrix Header */}
      <div className={`flex items-center justify-between border-b pb-1 px-1 ${
        isLight ? 'border-slate-200' : 'border-slate-800/80'
      }`}>
        <div className="flex items-center gap-1.5">
          <Calendar className={`w-3.5 h-3.5 ${isLight ? 'text-teal-600' : 'text-cyan-400'}`} />
          <h2 className={`text-xs sm:text-sm font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {format(currentObj, 'MMMM yyyy')} Pulse Matrix
          </h2>
        </div>
        <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
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
          <div className={`grid grid-cols-7 gap-0.5 text-center text-[9px] font-extrabold uppercase tracking-wider ${
            isLight ? 'text-slate-500' : 'text-slate-400'
          }`}>
            <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
          </div>

          {/* Month Days Matrix Grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {calendarDays.map((dayObj) => {
              const dStr = format(dayObj, 'yyyy-MM-dd')
              const isSelected = dStr === currentDateStr
              const isCurrentToday = isToday(dayObj)
              const isCurrentMonth = isSameMonth(dayObj, currentObj)

              const rawTasks = tasksByDate[dStr] || []
              const dedupedTasks = sortTasksChronologically(dedupeTasksForColumn(rawTasks), userProfile)
              const completedCount = dedupedTasks.filter(t => t.status === 'completed').length
              const adherencePct = dedupedTasks.length > 0 ? Math.round((completedCount / dedupedTasks.length) * 100) : 0

              if (!isCurrentMonth) {
                return (
                  <div
                    key={dStr}
                    onClick={() => onSelectDate(dStr)}
                    title={`Go to ${format(dayObj, 'EEEE, MMMM d, yyyy')}`}
                    className={`p-1 sm:p-1.5 rounded-xl text-left flex flex-col justify-between min-h-[68px] sm:min-h-[84px] opacity-25 hover:opacity-60 transition-all cursor-pointer border ${
                      isLight ? 'border-slate-200 bg-slate-100/50' : 'border-slate-900/60 bg-slate-950/20'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-[10px] sm:text-[11px] font-bold ${isLight ? 'text-slate-500' : 'text-slate-600'}`}>
                        {format(dayObj, 'd')}
                      </span>
                    </div>
                  </div>
                )
              }

              return (
                <div
                  key={dStr}
                  onClick={() => onSelectDate(dStr)}
                  title={`Click to open Today view for ${format(dayObj, 'EEEE, MMMM d, yyyy')}`}
                  className={`p-1 sm:p-1.5 rounded-xl text-left flex flex-col justify-between min-h-[68px] sm:min-h-[84px] transition-all cursor-pointer border group hover:border-cyan-400 hover:scale-[1.02] active:scale-[0.98] ${
                    isSelected
                      ? (isLight ? 'bg-cyan-50/90 border-cyan-500 ring-1 ring-cyan-500/60 shadow-md' : 'bg-cyan-950/90 border-cyan-500 ring-1 ring-cyan-500/60 shadow-md')
                      : isCurrentToday
                      ? (isLight ? 'bg-teal-50/80 border-teal-500' : 'bg-teal-950/40 border-teal-600/70')
                      : (isLight ? 'bg-slate-50/90 border-slate-200 hover:bg-white hover:shadow-sm' : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900')
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-1">
                      <span className={`text-[11px] sm:text-xs font-black leading-none transition-colors ${
                        isSelected 
                          ? (isLight ? 'text-cyan-800' : 'text-cyan-300') 
                          : isCurrentToday 
                          ? (isLight ? 'text-teal-800' : 'text-teal-300') 
                          : (isLight ? 'text-slate-900 group-hover:text-cyan-800' : 'text-slate-200 group-hover:text-cyan-200')
                      }`}>
                        {format(dayObj, 'd')}
                      </span>
                    </div>
                    {completedCount > 0 && (
                      <span className={`text-[8px] px-1 py-0 rounded font-mono font-bold leading-none border ${
                        adherencePct >= 80 
                          ? (isLight ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-emerald-950/90 text-emerald-300 border border-emerald-800/70') 
                          : (isLight ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'bg-slate-900 text-slate-400 border border-slate-700')
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
                          className={`px-1 py-0.5 rounded-r-[3px] text-[8.5px] font-black truncate leading-none w-full shadow-2xs border-l-[2.5px] ${
                            isLight ? 'text-slate-950 font-bold' : 'text-white'
                          }`}
                          style={{
                            borderLeftColor: theme.borderHex,
                            backgroundColor: isLight ? `${theme.borderHex}22` : theme.bgTint
                          }}
                        >
                          {modName}
                        </div>
                      )
                    })}
                    {dedupedTasks.length > 3 && (
                      <div className={`text-[8px] font-extrabold text-right leading-none pt-0.5 pr-0.5 ${
                        isLight ? 'text-cyan-700' : 'text-cyan-400'
                      }`}>
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
                className={`p-2.5 rounded-xl border transition-all space-y-2 group hover:border-cyan-400/80 hover:shadow-md ${
                  isSelected
                    ? (isLight ? 'bg-cyan-50/90 border-cyan-500 shadow-md' : 'bg-cyan-950/90 border-cyan-500 shadow-md')
                    : isCurrentToday
                    ? (isLight ? 'bg-teal-50/80 border-teal-600/70' : 'bg-teal-950/40 border-teal-600/70')
                    : (isLight ? 'bg-white border-slate-200 hover:bg-slate-50' : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900/90')
                }`}
              >
                <div 
                  onClick={() => onSelectDate(dStr)}
                  title={`Click to open Today view for ${format(dayObj, 'EEEE, MMMM d, yyyy')}`}
                  className={`flex items-center justify-between border-b pb-1.5 cursor-pointer ${
                    isLight ? 'border-slate-200' : 'border-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-xs sm:text-sm font-black ${
                      isSelected 
                        ? (isLight ? 'text-cyan-800' : 'text-cyan-300') 
                        : isCurrentToday 
                        ? (isLight ? 'text-teal-800' : 'text-teal-300') 
                        : (isLight ? 'text-slate-900 group-hover:text-cyan-800' : 'text-white group-hover:text-cyan-200')
                    }`}>
                      {format(dayObj, 'EEEE, MMM d')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      adherencePct >= 80 
                        ? (isLight ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-emerald-950 text-emerald-300 border border-emerald-700/60') 
                        : (isLight ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'bg-slate-900 text-slate-400 border border-slate-700')
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
                        <div className={`flex items-center gap-1.5 px-1 py-0.5 border-b ${isLight ? 'border-slate-200' : 'border-white/5'}`}>
                          <ProtocolAvatar
                            protocolName={pBlock.protocolName}
                            groupTasksOrSteps={pBlock.tasks}
                            size={18}
                            showHalo={false}
                            roundedClass="rounded-[4px]"
                          />
                          <span className={`text-[9px] font-black uppercase tracking-wider line-clamp-3 leading-snug break-words flex-1 min-w-0 ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
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
                        <div className={`flex items-center gap-1.5 px-1 py-0.5 border-b ${isLight ? 'border-slate-200' : 'border-slate-800/80'}`}>
                          <span className="text-xs">{tBlock.block.icon}</span>
                          <span className={`text-[9px] font-black uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
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
    const labelColor = getModalityLabelColor(theme, isLight)

    return (
      <div
        key={t.id}
        onClick={() => setExpandedTask(t)}
        className={`p-2 rounded-lg border-l-[3.5px] transition-all cursor-pointer group shadow-2xs ${
          isCompleted ? 'opacity-75' : 'opacity-100 hover:opacity-100'
        }`}
        style={{
          borderLeftColor: theme.borderHex,
          backgroundColor: isLight ? `${theme.borderHex}18` : theme.bgTint
        }}
      >
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span 
            className="text-[8px] font-black uppercase tracking-wider"
            style={{ color: labelColor }}
          >
            {theme.label}
          </span>
          {isCompleted && (
            <span className={`text-[8px] font-mono font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
              ✓
            </span>
          )}
        </div>

        <div 
          className={`text-[10px] font-black leading-tight line-clamp-3 break-words group-hover:brightness-125 transition-all ${
            isLight ? 'text-slate-950 font-bold' : 'text-white'
          }`}
        >
          {modName}
        </div>

        {doseStr && (
          <div className={`text-[8.5px] font-mono leading-tight mt-0.5 line-clamp-2 break-words ${
            isLight ? 'text-slate-800 font-semibold' : 'text-slate-200/90 font-medium'
          }`}>
            {doseStr}
          </div>
        )}
      </div>
    )
  }
}
