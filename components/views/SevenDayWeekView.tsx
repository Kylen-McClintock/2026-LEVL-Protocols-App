'use client'

import React, { useState } from 'react'
import { DailyProtocolTask, UserProfile } from '@/lib/types'
import { format, parseISO } from 'date-fns'
import { LayoutOrientation } from '../ui/ViewSelectorHeader'
import { ExpandedModalityDetailBanner } from './ExpandedModalityDetailBanner'
import { groupTasksByTimeBlock, groupTasksByProtocol } from '@/lib/data/resolveOptimalTiming'
import { getModalityTheme } from '@/lib/utils/modalityColors'

interface SevenDayWeekViewProps {
  tasksByDate: Record<string, DailyProtocolTask[]>
  weekDates: string[]
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

export const SevenDayWeekView: React.FC<SevenDayWeekViewProps> = ({
  tasksByDate,
  weekDates,
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
        <div className={isStacked ? 'flex flex-col space-y-2 w-full' : 'grid grid-cols-[repeat(7,minmax(120px,1fr))] sm:grid-cols-7 gap-1 min-w-[840px] sm:min-w-0'}>
          {weekDates.map((dateStr) => {
            const isSelected = dateStr === currentDateStr
            const dateObj = parseISO(dateStr + 'T00:00:00')
            const dayName = format(dateObj, 'EEEE')
            const dayShortName = format(dateObj, 'EEE')
            const dayNum = format(dateObj, 'd')
            const isPastDay = dateStr < todayStr

            const rawTasks = tasksByDate[dateStr] || []
            const dedupedTasks = dedupeTasksForColumn(rawTasks)
            const completedCount = dedupedTasks.filter(t => t.status === 'completed').length
            const adherencePct = dedupedTasks.length > 0 ? Math.round((completedCount / dedupedTasks.length) * 100) : 0

            const timeBlocks = viewMode === 'chronological'
              ? groupTasksByTimeBlock(dedupedTasks, userProfile)
              : []
            const protocolBlocks = viewMode === 'protocol'
              ? groupTasksByProtocol(dedupedTasks, userProfile)
              : []

            return (
              <div
                key={dateStr}
                className={`rounded-lg border p-1 flex flex-col ${
                  isStacked ? 'space-y-2' : 'space-y-1 min-h-[380px]'
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
                  className={`space-y-1.5 flex-1 ${isStacked ? '' : 'overflow-y-auto max-h-[64vh]'}`}
                >
                  {dedupedTasks.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-[9.5px]">Rest / Empty</div>
                  ) : viewMode === 'protocol' ? (
                    /* Protocol Groups */
                    protocolBlocks.map((pBlock) => (
                      <div key={pBlock.protocolName} className="space-y-0.5">
                        {/* Protocol Section Header Break */}
                        <div className="flex items-center gap-1 px-1 py-0.5 border-b border-white/5">
                          <span 
                            className="w-1.5 h-1.5 rounded-full shrink-0" 
                            style={{ backgroundColor: pBlock.protocolColorHex || '#A855F7' }} 
                          />
                          <span className="text-[8px] sm:text-[8.5px] font-black uppercase tracking-wider text-slate-300 truncate">
                            {pBlock.protocolName}
                          </span>
                        </div>

                        {/* Modality Pills (NO icons) */}
                        <div className="space-y-0.5">
                          {pBlock.tasks.map((t) => renderPill(t))}
                        </div>
                      </div>
                    ))
                  ) : (
                    /* Time Block Groups */
                    timeBlocks.map((tBlock) => (
                      <div key={tBlock.block.id} className="space-y-0.5">
                        {/* Time Block Section Header Break */}
                        <div className="flex items-center gap-1 px-1 py-0.5 border-b border-slate-800/80">
                          <span className="text-[9px] shrink-0">{tBlock.block.icon}</span>
                          <span className="text-[8px] sm:text-[8.5px] font-black uppercase tracking-wider text-slate-300 truncate">
                            {isStacked ? tBlock.block.label : tBlock.block.id.toUpperCase()}
                          </span>
                        </div>

                        {/* Modality Pills (NO icons) */}
                        <div className="space-y-0.5">
                          {tBlock.tasks.map((t) => renderPill(t))}
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

  function renderPill(t: DailyProtocolTask) {
    const theme = getModalityTheme(t)
    const mod = t.protocol_step?.modality || t.loose_modality
    const modName = mod?.name || (t as any).name || 'Protocol Task'
    const doseStr = t.execution_details?.custom_dose || mod?.dose_or_exposure || ''
    const isExpanded = expandedTask?.id === t.id
    const isCompleted = t.status === 'completed'

    return (
      <div
        key={t.id}
        onClick={() => setExpandedTask(isExpanded ? null : t)}
        className={`pl-1.5 pr-1 py-1 rounded-r-[4px] border-l-[3px] text-left flex flex-col justify-center transition-all cursor-pointer group shadow-2xs w-full ${
          isExpanded ? 'ring-2 ring-teal-400 shadow-teal-500/20' : ''
        } ${isCompleted ? 'opacity-70' : 'opacity-100 hover:opacity-100'}`}
        style={{
          borderLeftColor: theme.borderHex,
          backgroundColor: theme.bgTint
        }}
      >
        <div className="flex items-center justify-between gap-0.5">
          <span 
            className="text-[7.5px] font-black uppercase tracking-wider truncate"
            style={{ color: theme.colorHex }}
          >
            {theme.label}
          </span>
          {isCompleted && (
            <span className="text-[7.5px] font-mono font-bold text-emerald-400 shrink-0">
              ✓
            </span>
          )}
        </div>

        <div 
          className="text-[9px] sm:text-[9.5px] font-black leading-tight truncate group-hover:brightness-125 transition-all"
          style={{ color: theme.textHex }}
        >
          {modName}
        </div>

        {doseStr && (
          <div className="text-[7.5px] sm:text-[8px] text-slate-300/80 font-mono truncate leading-tight">
            {doseStr}
          </div>
        )}
      </div>
    )
  }
}
