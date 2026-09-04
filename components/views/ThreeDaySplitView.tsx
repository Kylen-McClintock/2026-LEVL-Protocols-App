'use client'

import React, { useState } from 'react'
import { DailyProtocolTask, UserProfile } from '@/lib/types'
import { Calendar, Layers, Info, ChevronRight } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { LayoutOrientation } from '../ui/ViewSelectorHeader'
import { ExpandedModalityDetailBanner } from './ExpandedModalityDetailBanner'
import { sortTasksChronologically } from '@/lib/data/resolveOptimalTiming'

interface ThreeDaySplitViewProps {
  tasksByDate: Record<string, DailyProtocolTask[]>
  threeDates: string[]
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
    const splitNumber = t.execution_details?.split_dose_number || (t.id.includes('-split-') ? t.id.split('-split-')[1] : 0)
    const baseKey = (t.modality_id || mod?.id || mod?.name || t.id).trim().toLowerCase()
    const key = splitNumber ? `${baseKey}-split-${splitNumber}` : baseKey

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

export const ThreeDaySplitView: React.FC<ThreeDaySplitViewProps> = ({
  tasksByDate,
  threeDates,
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
    <div className="space-y-3 w-full my-2">
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

      {/* Grid or Stack Layout */}
      <div className="w-full overflow-x-auto pb-2 scrollbar-none">
        <div className={isStacked ? 'flex flex-col space-y-3 w-full' : 'grid grid-cols-3 gap-2 min-w-[560px] sm:min-w-0 w-full'}>
          {threeDates.map((dateStr, idx) => {
            const isSelectedDate = dateStr === currentDateStr
            const dateObj = parseISO(dateStr + 'T00:00:00')
            const dayName = format(dateObj, 'EEEE')
            const dayDate = format(dateObj, 'MMM d')
            const isPastDay = dateStr < todayStr

            const rawTasks = tasksByDate[dateStr] || []
            const filteredTasks = rawTasks.filter(filterTask)
            const dedupedTasks = sortTasksChronologically(dedupeTasksForColumn(filteredTasks), userProfile)
            const completedCount = dedupedTasks.filter(t => t.status === 'completed').length
            const adherencePct = dedupedTasks.length > 0 ? Math.round((completedCount / dedupedTasks.length) * 100) : 0

          return (
            <div
              key={dateStr}
              className={`rounded-xl border p-2.5 transition-all flex flex-col space-y-2 ${
                isSelectedDate
                  ? 'bg-slate-950/95 border-teal-500/90 shadow-[0_0_15px_rgba(20,184,166,0.15)] ring-1 ring-teal-500/50'
                  : 'bg-slate-950/60 border-slate-800/90'
              }`}
            >
              {/* Column / Row Date Header (Clickable to switch historical debrief) */}
              <div 
                onClick={() => onSelectDate && onSelectDate(dateStr)}
                title={`Click to inspect historical debrief for ${dayName}, ${dayDate}`}
                className="flex items-center justify-between border-b border-slate-800/80 pb-2 cursor-pointer group hover:border-slate-600 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Calendar className={`w-4 h-4 transition-transform group-hover:scale-110 ${isSelectedDate ? 'text-teal-400' : 'text-slate-400 group-hover:text-white'}`} />
                  <div>
                    <h3 className={`text-sm font-extrabold tracking-tight leading-none transition-colors ${isSelectedDate ? 'text-white' : 'text-slate-200 group-hover:text-teal-300'}`}>
                      {dayName}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-medium group-hover:text-slate-300">{dayDate}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {isPastDay && dedupedTasks.length > 0 && (
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      adherencePct >= 80 
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60' 
                        : 'bg-slate-900 text-slate-400 border border-slate-700'
                    }`}>
                      {adherencePct}% ({completedCount}/{dedupedTasks.length})
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectDate && onSelectDate(dateStr)
                    }}
                    className="px-2 py-0.5 text-[10px] font-bold text-teal-300 hover:text-white bg-teal-500/15 hover:bg-teal-500/30 border border-teal-500/30 rounded-md transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                    title={`Open Today view for ${dayName}, ${dayDate}`}
                  >
                    <span>Open Day</span>
                    <ChevronRight size={11} />
                  </button>
                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                    isSelectedDate 
                      ? 'bg-teal-950/90 text-teal-300 border border-teal-800/80' 
                      : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}>
                    {idx === 0 ? 'Day 1' : idx === 1 ? 'Day 2' : 'Day 3'}
                  </span>
                </div>
              </div>

              {/* Task Items */}
              <div className="space-y-1.5 flex-1">
                {dedupedTasks.length === 0 ? (
                  <div className="text-center py-6 px-2 rounded-lg bg-slate-900/30 border border-slate-800/40 text-slate-500 text-xs">
                    No scheduled split modalities.
                  </div>
                ) : (
                  dedupedTasks.map((t) => {
                    const mod = t.protocol_step?.modality || t.loose_modality
                    const modName = mod?.name || 'Protocol Task'
                    const protoName = t.lineages?.map(l => l.protocol_name).join(' + ') || t.protocol_step?.protocol?.name || 'Protocol'
                    const colorHex = t.lineages?.[0]?.color_hex || '#A855F7'
                    const doseStr = mod?.dose_or_exposure || t.timing_slot || ''
                    const isExpanded = expandedTask?.id === t.id

                    return (
                      <div
                        key={t.id}
                        onClick={() => setExpandedTask(isExpanded ? null : t)}
                        className={`p-2.5 rounded-r-lg border-l-3 bg-slate-900/90 hover:bg-slate-800/90 transition-all cursor-pointer group space-y-1 shadow-2xs w-full ${
                          isExpanded ? 'ring-2 ring-teal-400 shadow-teal-500/20' : ''
                        }`}
                        style={{ borderLeftColor: colorHex }}
                      >
                        {/* Protocol Badge */}
                        <div className="flex items-center gap-1.5 text-[9px] font-extrabold truncate" style={{ color: colorHex }}>
                          <Layers className="w-3 h-3 shrink-0" />
                          <span className="truncate uppercase tracking-wider">{protoName}</span>
                        </div>

                        {/* Modality Title */}
                        <div className="text-xs font-extrabold text-white group-hover:text-teal-300 transition-colors leading-tight">
                          {modName}
                        </div>

                        {/* Dosage / Exposure Subtext */}
                        {doseStr && (
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 pt-0.5">
                            <Info className="w-3 h-3 text-slate-500 shrink-0" />
                            <span className="truncate">{doseStr}</span>
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
