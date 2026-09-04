'use client'

import React, { useState } from 'react'
import { DailyProtocolTask, UserProfile } from '@/lib/types'
import { Calendar, ChevronRight } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { LayoutOrientation } from '../ui/ViewSelectorHeader'
import { ExpandedModalityDetailBanner } from './ExpandedModalityDetailBanner'
import { groupTasksByTimeBlock, groupTasksByProtocol } from '@/lib/data/resolveOptimalTiming'
import { getModalityTheme } from '@/lib/utils/modalityColors'

interface ThreeDaySplitViewProps {
  tasksByDate: Record<string, DailyProtocolTask[]>
  threeDates: string[]
  currentDateStr: string
  selectedProtocolFilter?: string
  selectedIsolatedOutcome?: string | null
  layoutOrientation?: LayoutOrientation
  viewMode?: 'chronological' | 'protocol'
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

export const ThreeDaySplitView: React.FC<ThreeDaySplitViewProps> = ({
  tasksByDate,
  threeDates,
  currentDateStr,
  layoutOrientation = 'columns',
  viewMode = 'chronological',
  userProfile,
  onSelectDate,
  onTaskStatusChange,
  onOpenDosageModal,
  onOpenRescheduleModal,
  onMoveToBench,
  onEliminateEntirely
}) => {
  const [expandedTask, setExpandedTask] = useState<DailyProtocolTask | null>(null)

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
            const dedupedTasks = dedupeTasksForColumn(rawTasks)
            const completedCount = dedupedTasks.filter(t => t.status === 'completed').length
            const adherencePct = dedupedTasks.length > 0 ? Math.round((completedCount / dedupedTasks.length) * 100) : 0

            // Grouping by either Time Blocks or Protocol
            const timeBlocks = viewMode === 'chronological'
              ? groupTasksByTimeBlock(dedupedTasks, userProfile)
              : []
            const protocolBlocks = viewMode === 'protocol'
              ? groupTasksByProtocol(dedupedTasks, userProfile)
              : []

            return (
              <div
                key={dateStr}
                className={`rounded-xl border p-2.5 transition-all flex flex-col space-y-2.5 ${
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

                {/* Task Items Grouped by Time Blocks or Protocol */}
                <div className="space-y-3 flex-1">
                  {dedupedTasks.length === 0 ? (
                    <div className="text-center py-6 px-2 rounded-lg bg-slate-900/30 border border-slate-800/40 text-slate-500 text-xs">
                      No scheduled modalities.
                    </div>
                  ) : viewMode === 'protocol' ? (
                    /* Grouped by Protocol */
                    protocolBlocks.map((pBlock) => (
                      <div key={pBlock.protocolName} className="space-y-1.5">
                        {/* Protocol Header Break */}
                        <div className="flex items-center gap-1.5 pt-1.5 pb-1 px-1 border-b border-white/10">
                          <span 
                            className="w-2 h-2 rounded-full shrink-0" 
                            style={{ backgroundColor: pBlock.protocolColorHex || '#A855F7' }} 
                          />
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 truncate">
                            {pBlock.protocolName}
                          </span>
                          <span className="text-[9px] font-mono text-slate-500 font-bold ml-auto shrink-0">
                            {pBlock.tasks.length}
                          </span>
                        </div>

                        {/* Modality Cards (NO Icons per user instruction) */}
                        <div className="space-y-1.5">
                          {pBlock.tasks.map((t) => renderModalityCard(t))}
                        </div>
                      </div>
                    ))
                  ) : (
                    /* Grouped by Time Block */
                    timeBlocks.map((tBlock) => (
                      <div key={tBlock.block.id} className="space-y-1.5">
                        {/* Time Block Header Break */}
                        <div className="flex items-center gap-1.5 pt-1.5 pb-1 px-1 border-b border-slate-800/80">
                          <span className="text-xs shrink-0">{tBlock.block.icon}</span>
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 truncate">
                            {tBlock.block.label}
                          </span>
                          <span className="text-[9px] font-mono text-slate-500 font-bold ml-auto shrink-0">
                            {tBlock.tasks.length}
                          </span>
                        </div>

                        {/* Modality Cards (NO Icons per user instruction) */}
                        <div className="space-y-1.5">
                          {tBlock.tasks.map((t) => renderModalityCard(t))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  function renderModalityCard(t: DailyProtocolTask) {
    const theme = getModalityTheme(t)
    const mod = t.protocol_step?.modality || t.loose_modality
    const modName = mod?.name || (t as any).name || 'Protocol Task'
    const protoName = t.lineages?.map(l => l.protocol_name).join(' + ') || t.protocol_step?.protocol?.name || ''
    const doseStr = t.execution_details?.custom_dose || mod?.dose_or_exposure || t.timing_slot || ''
    const isExpanded = expandedTask?.id === t.id
    const isCompleted = t.status === 'completed'

    return (
      <div
        key={t.id}
        onClick={() => setExpandedTask(isExpanded ? null : t)}
        className={`p-2 rounded-lg border-l-[3.5px] transition-all cursor-pointer group space-y-1 shadow-sm w-full ${
          isExpanded ? 'ring-2 ring-teal-400 shadow-teal-500/20' : ''
        } ${isCompleted ? 'opacity-70' : 'opacity-100 hover:opacity-100'}`}
        style={{
          borderLeftColor: theme.borderHex,
          backgroundColor: theme.bgTint
        }}
      >
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 min-w-0">
            <span 
              className="text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded font-mono shrink-0"
              style={{
                color: theme.colorHex,
                backgroundColor: `${theme.borderHex}25`
              }}
            >
              {theme.label}
            </span>
            {protoName && viewMode !== 'protocol' && (
              <span className="text-[8.5px] font-extrabold text-slate-400 truncate opacity-85">
                • {protoName}
              </span>
            )}
          </div>
          {isCompleted && (
            <span className="text-[8.5px] font-mono font-bold text-emerald-400 shrink-0">
              ✓ Done
            </span>
          )}
        </div>

        {/* Modality Title */}
        <div 
          className="text-xs font-black tracking-tight leading-snug group-hover:brightness-125 transition-all truncate"
          style={{ color: theme.textHex }}
        >
          {modName}
        </div>

        {/* Dosage / Subtext */}
        {doseStr && (
          <div className="text-[9.5px] text-slate-300/80 font-mono truncate">
            {doseStr}
          </div>
        )}
      </div>
    )
  }
}
