'use client'

import React, { useState } from 'react'
import { DailyProtocolTask, UserProfile } from '@/lib/types'
import { Calendar } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { LayoutOrientation } from '../ui/ViewSelectorHeader'
import { ExpandedModalityDetailBanner } from './ExpandedModalityDetailBanner'
import { sortTasksChronologically } from '@/lib/data/resolveOptimalTiming'

interface SevenDayWeekViewProps {
  tasksByDate: Record<string, DailyProtocolTask[]>
  weekDates: string[]
  currentDateStr: string
  selectedProtocolFilter?: string
  selectedIsolatedOutcome?: string | null
  layoutOrientation?: LayoutOrientation
  userProfile?: UserProfile | null
  onSelectDate?: (dateStr: string) => void
  onTaskStatusChange?: (taskId: string, newStatus: string) => void
  onOpenDosageModal?: (modality: any) => void
  onOpenRescheduleModal?: (task: DailyProtocolTask) => void
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
      map.set(key, { ...t, lineages: t.lineages ? [...t.lineages] : [] })
    } else {
      const existing = map.get(key)!
      if (t.lineages) {
        if (!existing.lineages) existing.lineages = []
        t.lineages.forEach(l => {
          if (!existing.lineages!.some(el => el.protocol_name === l.protocol_name)) {
            existing.lineages!.push(l)
          }
        })
      }
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
      borderLeft: `2.5px solid ${protoColorHex}`,
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
      borderLeft: '2.5px solid #F59E0B',
      color: '#FDE68A'
    }
  }
  if (isFasting) {
    return {
      backgroundColor: 'rgba(59, 130, 246, 0.22)',
      borderLeft: '2.5px solid #3B82F6',
      color: '#BFDBFE'
    }
  }
  if (isPulsedSupp) {
    return {
      backgroundColor: 'rgba(168, 85, 247, 0.22)',
      borderLeft: '2.5px solid #A855F7',
      color: '#E9D5FF'
    }
  }

  return {
    backgroundColor: 'rgba(20, 184, 166, 0.22)',
    borderLeft: '2.5px solid #14B8A6',
    color: '#99F6E4'
  }
}

export const SevenDayWeekView: React.FC<SevenDayWeekViewProps> = ({
  tasksByDate,
  weekDates,
  currentDateStr,
  selectedProtocolFilter,
  selectedIsolatedOutcome,
  layoutOrientation = 'columns',
  userProfile,
  onSelectDate,
  onTaskStatusChange,
  onOpenDosageModal,
  onOpenRescheduleModal,
  onMoveToBench,
  onEliminateEntirely,
  activeCategoryFilters
}) => {
  const [expandedTask, setExpandedTask] = useState<DailyProtocolTask | null>(null)

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
  const todayStr = format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="space-y-3 w-full my-1">
      {/* Full-Width Modality Expansion Banner */}
      {expandedTask && (
        <ExpandedModalityDetailBanner
          task={expandedTask}
          onClose={() => setExpandedTask(null)}
          onTaskStatusChange={onTaskStatusChange}
          onOpenDosageModal={onOpenDosageModal}
          onOpenRescheduleModal={onOpenRescheduleModal}
          onMoveToBench={onMoveToBench}
          onEliminateEntirely={onEliminateEntirely}
        />
      )}

      <div className="w-full overflow-x-auto pb-1 scrollbar-none">
        <div className={isStacked ? 'flex flex-col space-y-2 w-full' : 'grid grid-cols-[repeat(7,minmax(120px,1fr))] sm:grid-cols-7 gap-0.5 min-w-[840px] sm:min-w-0'}>
          {weekDates.map((dateStr) => {
            const isSelected = dateStr === currentDateStr
            const dateObj = parseISO(dateStr + 'T00:00:00')
            const dayName = format(dateObj, 'EEEE')
            const dayShortName = format(dateObj, 'EEE')
            const dayNum = format(dateObj, 'd')
            const isPastDay = dateStr < todayStr

            const rawTasks = tasksByDate[dateStr] || []
            const filteredTasks = rawTasks.filter(filterTask)
            const dedupedTasks = sortTasksChronologically(dedupeTasksForColumn(filteredTasks), userProfile)
            const completedCount = dedupedTasks.filter(t => t.status === 'completed').length
            const adherencePct = dedupedTasks.length > 0 ? Math.round((completedCount / dedupedTasks.length) * 100) : 0

            return (
              <div
                key={dateStr}
                className={`rounded-lg border p-1 flex flex-col ${
                  isStacked ? 'space-y-1.5' : 'space-y-0.5 min-h-[360px]'
                } ${
                  isSelected
                    ? 'bg-slate-950/95 border-teal-500/90 ring-1 ring-teal-500/50 shadow-md'
                    : 'bg-slate-950/60 border-slate-800/80'
                }`}
              >
                {/* Day Header Badge (Clickable to open Today view for this day) */}
                <div 
                  onClick={() => onSelectDate && onSelectDate(dateStr)}
                  title={`Click to open Today view for ${dayName}, ${format(dateObj, 'MMM d')}`}
                  className={`p-1.5 rounded-lg border cursor-pointer group transition-all active:scale-98 shadow-sm ${
                    isSelected 
                      ? 'bg-teal-950/80 border-teal-500/80 ring-1 ring-teal-500/40 shadow-md' 
                      : 'bg-white/5 hover:bg-teal-500/15 border-white/10 hover:border-teal-400/60'
                  } ${isStacked ? 'flex items-center justify-between px-2.5' : 'text-center flex flex-col items-center justify-center gap-0.5'}`}
                >
                  <div className={isStacked ? 'flex items-center gap-2' : 'w-full flex items-center justify-center gap-1.5'}>
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider transition-colors ${isSelected ? 'text-teal-300' : 'text-slate-400 group-hover:text-teal-200'}`}>
                      {isStacked ? dayName : dayShortName}
                    </span>
                    <span className={`text-xs sm:text-sm font-black leading-none transition-colors ${isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                      {dayNum}
                    </span>
                    
                    {/* Past day adherence % indicator */}
                    {isPastDay && dedupedTasks.length > 0 && (
                      <span className={`ml-1 text-[8px] font-mono font-bold px-1 rounded ${
                        adherencePct >= 80 
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60' 
                          : 'bg-slate-900 text-slate-400 border border-slate-700'
                      }`}>
                        {adherencePct}%
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-[9px] font-bold text-teal-400/80 group-hover:text-teal-200">
                    <span>Open Day</span>
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </div>

                  {isStacked && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      {dedupedTasks.length} modalities
                    </span>
                  )}
                </div>

                {/* Swimlane Task Items */}
                <div 
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      onSelectDate && onSelectDate(dateStr)
                    }
                  }}
                  className={`space-y-0.5 flex-1 ${isStacked ? '' : 'overflow-y-auto max-h-[64vh]'}`}
                >
                  {dedupedTasks.length === 0 ? (
                    <div className="text-center py-4 text-slate-500 text-[9px]">Rest / Empty</div>
                  ) : (
                    dedupedTasks.map((t) => {
                      const mod = t.protocol_step?.modality || t.loose_modality
                      const modName = mod?.name || 'Protocol Task'
                      const protoName = t.lineages?.map(l => l.protocol_name).join(' + ') || t.protocol_step?.protocol?.name || ''
                      const style = getModalityHighlightStyle(t, selectedProtocolFilter)
                      const isExpanded = expandedTask?.id === t.id

                      return (
                        <div
                          key={t.id}
                          onClick={() => setExpandedTask(isExpanded ? null : t)}
                          className={`pl-1.5 pr-0.5 py-0.5 rounded-r-[3px] text-left flex flex-col justify-center transition-all cursor-pointer group shadow-2xs w-full ${
                            isExpanded ? 'ring-2 ring-teal-400 shadow-teal-500/20' : ''
                          }`}
                          style={style}
                        >
                          {protoName && (selectedProtocolFilter === 'all' || isStacked) && (
                            <span className="text-[7.5px] sm:text-[8px] font-extrabold uppercase tracking-wider truncate block opacity-85 leading-tight">
                              {protoName}
                            </span>
                          )}

                          <div className="text-[9.5px] sm:text-[10px] font-extrabold leading-tight truncate">
                            {modName}
                          </div>

                          {mod?.dose_or_exposure && (
                            <div className="text-[7.5px] sm:text-[8px] opacity-80 font-mono truncate leading-tight">
                              {mod.dose_or_exposure}
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
