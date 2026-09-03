'use client'

import React, { useState } from 'react'
import { DailyProtocolTask, UserProfile } from '@/lib/types'
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from 'date-fns'
import { Calendar } from 'lucide-react'
import { LayoutOrientation } from '../ui/ViewSelectorHeader'
import { ExpandedModalityDetailBanner } from './ExpandedModalityDetailBanner'
import { sortTasksChronologically } from '@/lib/data/resolveOptimalTiming'

interface MonthMatrixViewProps {
  tasksByDate: Record<string, DailyProtocolTask[]>
  currentDateStr: string
  selectedProtocolFilter?: string
  selectedIsolatedOutcome?: string | null
  layoutOrientation?: LayoutOrientation
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
    const key = t.modality_id || mod?.id || mod?.name || t.id

    if (!map.has(key)) {
      map.set(key, t)
    }
  })
  return Array.from(map.values())
}

function matchesProtocol(task: DailyProtocolTask, filterIdOrName?: string): boolean {
  if (!filterIdOrName || filterIdOrName === 'all') return true
  const target = filterIdOrName.toLowerCase()

  const inLineage = (task.lineages || []).some(l => {
    const pid = (l.protocol_id || '').toLowerCase()
    const pname = (l.protocol_name || '').toLowerCase()
    return pid === target || pname === target || pname.includes(target) || target.includes(pname)
  })
  if (inLineage) return true

  const stepProtoId = (task.protocol_step?.protocol_id || '').toLowerCase()
  const stepProtoName = (task.protocol_step?.protocol?.name || '').toLowerCase()
  if (stepProtoId === target || (stepProtoName && stepProtoName.includes(target))) return true

  const instProtoId = ((task as any).user_protocol_instance?.protocol_id || '').toLowerCase()
  const instProtoName = ((task as any).user_protocol_instance?.protocol?.name || '').toLowerCase()
  if (instProtoId === target || (instProtoName && instProtoName.includes(target))) return true

  return false
}

function getModalityHighlightStyle(t: DailyProtocolTask, selectedProtocolFilter?: string) {
  const matchingLineage = selectedProtocolFilter && selectedProtocolFilter !== 'all'
    ? t.lineages?.find(l => {
        const pid = (l.protocol_id || '').toLowerCase()
        const pname = (l.protocol_name || '').toLowerCase()
        const target = selectedProtocolFilter.toLowerCase()
        return pid === target || pname === target || pname.includes(target)
      })
    : t.lineages?.[0]

  const protoColorHex = matchingLineage?.color_hex || t.lineages?.[0]?.color_hex
  if (protoColorHex && protoColorHex !== '#A855F7') {
    return {
      backgroundColor: `${protoColorHex}28`,
      borderLeft: `2px solid ${protoColorHex}`,
      color: '#FFFFFF'
    }
  }

  const mod = t.protocol_step?.modality || t.loose_modality
  const cat = (mod?.category || '').toLowerCase()
  const nameId = ((mod?.name || '') + ' ' + (mod?.id || '')).toLowerCase()
  const isPulsed = (mod as any)?.is_pulsed || 
                   ['weekly', 'biweekly', 'monthly', 'quarterly', 'pulsed', 'cyclical', 'infrequent'].includes((mod?.cadence_layer || '').toLowerCase())

  const isExercise = cat.includes('fitness') || cat.includes('physical') || nameId.includes('workout') || nameId.includes('training') || nameId.includes('cardio')
  const isFasting = cat.includes('fasting') || nameId.includes('fast')
  const isPulsedSupp = isPulsed || nameId.includes('glp') || nameId.includes('fisetin') || nameId.includes('rapamycin')

  if (isExercise) {
    return {
      backgroundColor: 'rgba(245, 158, 11, 0.22)',
      borderLeft: '2px solid #F59E0B',
      color: '#FDE68A'
    }
  }
  if (isFasting) {
    return {
      backgroundColor: 'rgba(59, 130, 246, 0.22)',
      borderLeft: '2px solid #3B82F6',
      color: '#BFDBFE'
    }
  }
  if (isPulsedSupp) {
    return {
      backgroundColor: 'rgba(168, 85, 247, 0.22)',
      borderLeft: '2px solid #A855F7',
      color: '#E9D5FF'
    }
  }

  return {
    backgroundColor: 'rgba(20, 184, 166, 0.22)',
    borderLeft: '2px solid #14B8A6',
    color: '#99F6E4'
  }
}

export const MonthMatrixView: React.FC<MonthMatrixViewProps> = ({
  tasksByDate,
  currentDateStr,
  selectedProtocolFilter,
  selectedIsolatedOutcome,
  layoutOrientation = 'columns',
  userProfile,
  onSelectDate,
  onMoveToBench,
  onEliminateEntirely,
  activeCategoryFilters
}) => {
  const [expandedTask, setExpandedTask] = useState<DailyProtocolTask | null>(null)

  const currentObj = parseISO(currentDateStr + 'T00:00:00')
  const monthStart = startOfMonth(currentObj)
  const monthEnd = endOfMonth(currentObj)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const filterTask = (task: DailyProtocolTask) => {
    if (!matchesProtocol(task, selectedProtocolFilter)) return false

    const mod = task.protocol_step?.modality || task.loose_modality
    if (!mod) return true

    if (selectedIsolatedOutcome) {
      const target = selectedIsolatedOutcome.toLowerCase().trim()
      const outcomes = task.execution_details?.outcomes || []
      const hasLogged = outcomes.some((o: any) => {
        const oId = String(o.outcomeId || o.id || '').toLowerCase()
        const oName = String(o.outcomeName || o.name || '').toLowerCase()
        return oId === target || oName === target || oId.includes(target) || target.includes(oId)
      })
      if (hasLogged) return true

      const pOut = String(mod.primary_outcome || '').toLowerCase()
      const sOuts = (mod.secondary_outcomes || []).map((s: any) => String(typeof s === 'string' ? s : s.name || s.id || '').toLowerCase())
      const allOutcomes = [pOut, ...sOuts]
      if (!allOutcomes.some(o => o === target || o.includes(target) || target.includes(o))) {
        return false
      }
    }

    const cat = (mod.category || '').toLowerCase()
    const nameId = ((mod.name || '') + ' ' + (mod.id || '')).toLowerCase()
    const isPulsed = (mod as any).is_pulsed || 
                     ['weekly', 'biweekly', 'monthly', 'quarterly', 'pulsed', 'cyclical', 'infrequent'].includes((mod.cadence_layer || '').toLowerCase())

    const isExercise = cat.includes('fitness') || cat.includes('physical') || nameId.includes('workout') || nameId.includes('training') || nameId.includes('cardio')
    const isFasting = cat.includes('fasting') || nameId.includes('fast')
    const isPulsedSupp = isPulsed || nameId.includes('glp') || nameId.includes('fisetin') || nameId.includes('rapamycin')
    const isDailyBaseline = !isPulsed && !isExercise && !isFasting

    if (activeCategoryFilters) {
      if (isExercise && !activeCategoryFilters.exercise) return false
      if (isFasting && !activeCategoryFilters.fasting) return false
      if (isPulsedSupp && !activeCategoryFilters.pulsed) return false
      if (isDailyBaseline && !activeCategoryFilters.daily) return false
    }

    return true
  }

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
        <span className="text-[10px] text-slate-400">High-level pulse overview</span>
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
              const filteredTasks = rawTasks.filter(filterTask)
              const dedupedTasks = sortTasksChronologically(dedupeTasksForColumn(filteredTasks), userProfile)
              const completedCount = dedupedTasks.filter(t => t.status === 'completed').length
              const adherencePct = dedupedTasks.length > 0 ? Math.round((completedCount / dedupedTasks.length) * 100) : 0

              return (
                <div
                  key={dStr}
                  onClick={() => onSelectDate(dStr)}
                  className={`p-1 rounded text-left flex flex-col justify-between min-h-[65px] sm:min-h-[75px] transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-cyan-950/90 border-cyan-500 ring-1 ring-cyan-500/60 shadow-md'
                      : isCurrentToday
                      ? 'bg-teal-950/40 border-teal-600/70'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-[11px] font-extrabold leading-none ${isSelected ? 'text-cyan-300' : isCurrentToday ? 'text-teal-300' : 'text-slate-200'}`}>
                      {format(dayObj, 'd')}
                    </span>
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

                  {/* Event Blocks */}
                  <div className="space-y-0.5 w-full overflow-hidden mt-0.5">
                    {dedupedTasks.slice(0, 3).map((t, idx) => {
                      const mod = t.protocol_step?.modality || t.loose_modality
                      const modName = mod?.name || 'Task'
                      const style = getModalityHighlightStyle(t, selectedProtocolFilter)
                      const isExpanded = expandedTask?.id === t.id

                      return (
                        <div
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation()
                            setExpandedTask(isExpanded ? null : t)
                          }}
                          className={`px-1 py-0.5 rounded-r-[3px] text-[9px] font-bold truncate leading-none w-full shadow-2xs cursor-pointer ${
                            isExpanded ? 'ring-1 ring-teal-400' : ''
                          }`}
                          style={style}
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
            const filteredTasks = rawTasks.filter(filterTask)
            const dedupedTasks = sortTasksChronologically(dedupeTasksForColumn(filteredTasks), userProfile)

            if (dedupedTasks.length === 0) return null

            return (
              <div
                key={dStr}
                className={`p-2 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                  isSelected
                    ? 'bg-cyan-950/90 border-cyan-500 shadow-md'
                    : isCurrentToday
                    ? 'bg-teal-950/40 border-teal-600/70'
                    : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-1">
                  <span className={`text-xs font-extrabold ${isSelected ? 'text-cyan-300' : isCurrentToday ? 'text-teal-300' : 'text-white'}`}>
                    {format(dayObj, 'EEEE, MMM d')}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {dedupedTasks.length} modalities
                  </span>
                </div>

                <div className="space-y-1">
                  {dedupedTasks.map((t, idx) => {
                    const mod = t.protocol_step?.modality || t.loose_modality
                    const modName = mod?.name || 'Task'
                    const style = getModalityHighlightStyle(t, selectedProtocolFilter)
                    const isExpanded = expandedTask?.id === t.id

                    return (
                      <div
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation()
                          setExpandedTask(isExpanded ? null : t)
                        }}
                        className={`px-2 py-1 rounded-r-md text-xs font-bold truncate leading-tight w-full shadow-2xs ${
                          isExpanded ? 'ring-2 ring-teal-400' : ''
                        }`}
                        style={style}
                      >
                        {modName}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
