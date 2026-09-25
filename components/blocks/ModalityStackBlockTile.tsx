'use client'

import React, { useState } from 'react'
import { Pill, Check, CheckCircle2, ChevronRight, X, Sparkles, Layers } from 'lucide-react'
import { DedupedTask } from '@/components/cards/ProtocolTaskCard'
import { UserBenchItem } from '@/lib/types'
import ModalityIcon from '@/components/ui/ModalityIcon'
import { useTheme } from '@/lib/utils/useTheme'
import { BlockSizing, BlocksVisualStyle, BlocksLayoutMode, getGridClassesForSizing, getSimplifiedModalityName } from './blocksUtils'
import { LEVL_TOKENS } from '@/lib/theme/designTokens'

interface ModalityStackBlockTileProps {
  stackName: string
  tasks: DedupedTask[]
  benchItems?: UserBenchItem[]
  sizing: BlockSizing
  visualStyle: BlocksVisualStyle
  isIgnited?: boolean
  layoutMode?: BlocksLayoutMode
  onStatusChange: (taskId: string, status: string) => void
}

export default function ModalityStackBlockTile({
  stackName,
  tasks,
  benchItems = [],
  sizing,
  visualStyle,
  isIgnited = true,
  layoutMode = 'dynamic',
  onStatusChange
}: ModalityStackBlockTileProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { theme } = useTheme()
  const isDaylight = theme === 'light'

  const completedCount = tasks.filter((t) => t.status === 'completed').length
  const totalCount = tasks.length
  const isAllCompleted = completedCount === totalCount && totalCount > 0

  const handleToggleSingle = (task: DedupedTask) => {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed'
    onStatusChange(task.id, nextStatus)
  }

  const handleCompleteAll = () => {
    tasks.forEach((t) => {
      if (t.status !== 'completed') {
        onStatusChange(t.id, 'completed')
      }
    })
  }

  const { colSpanClass, heightClass } = getGridClassesForSizing(sizing, layoutMode)
  const darkBg = 'rgba(10, 14, 23, 0.95)'
  const amberGrad = isIgnited
    ? 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 40%, #FEF08A 75%, #F59E0B 100%)'
    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.04) 100%)'
  const emeraldGrad = 'linear-gradient(135deg, #05DF72 0%, #10E57A 45%, #6EE7B7 75%, #05DF72 100%)'

  const isOneWide = layoutMode === '1-wide'
  const iconSize = isOneWide ? 22 : layoutMode === '3-wide' ? 32 : 42

  return (
    <>
      {/* Condensed Stack Block Face */}
      <div className={`relative select-none ${colSpanClass} ${heightClass} transition-all duration-300`}>
        <div
          onClick={() => setIsModalOpen(true)}
          className={`w-full h-full rounded-2xl sm:rounded-3xl ${
            isOneWide ? 'px-3 sm:px-4 py-2 flex flex-row items-center justify-between' : 'p-3 sm:p-4 flex flex-col items-center justify-center my-auto text-center'
          } cursor-pointer transition-all duration-500 group hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden ${
            isDaylight
              ? 'bg-white border border-[#E1E8E3] text-[#475569] shadow-sm hover:border-[#8B5CF6]/40'
              : isAllCompleted
              ? 'text-emerald-300 shadow-lg'
              : visualStyle === 'full-gradient'
              ? 'text-white border-2 border-white/40 shadow-xl'
              : 'text-white shadow-md'
          }`}
          style={{
            background: isDaylight
              ? LEVL_TOKENS.light.card
              : isAllCompleted
              ? `linear-gradient(${darkBg}, ${darkBg}) padding-box, ${emeraldGrad} border-box`
              : visualStyle === 'full-gradient'
              ? 'linear-gradient(135deg, #B45309 0%, #F59E0B 50%, #FBBF24 100%)'
              : `linear-gradient(${darkBg}, ${darkBg}) padding-box, ${amberGrad} border-box`,
            border: isDaylight ? `1px solid ${LEVL_TOKENS.light.border}` : visualStyle === 'dark-outline' || isAllCompleted ? '2.5px solid transparent' : undefined,
            boxShadow: isDaylight
              ? '0 2px 6px rgb(23 42 40 / 3%)'
              : isIgnited
              ? isAllCompleted
                ? '0 0 16px rgba(16, 185, 129, 0.65), 0 4px 28px rgba(16, 185, 129, 0.40), 0 12px 48px rgba(16, 185, 129, 0.20)'
                : '0 0 16px rgba(245, 158, 11, 0.70), 0 4px 30px rgba(245, 158, 11, 0.45), 0 12px 52px rgba(245, 158, 11, 0.25)'
              : undefined
          }}
        >
          {isOneWide ? (
            /* 1-Wide Horizontal Layout (Matches ModalityBlockTile Height) */
            <div className="flex-1 flex flex-row items-center justify-between gap-3 min-w-0 w-full relative z-10">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isDaylight ? 'bg-[#EDE9FE] text-[#8B5CF6]' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  }`}
                >
                  <ModalityIcon
                    category="supplements"
                    modalityName={stackName}
                    customIcon="pill"
                    size={22}
                    glow={!isDaylight && isIgnited}
                    isIgnited={isIgnited}
                    customColor={isDaylight ? '#8B5CF6' : visualStyle === 'full-gradient' ? '#FFFFFF' : undefined}
                  />
                </div>

                <div className="flex flex-col text-left min-w-0 flex-1">
                  <div className={`font-black tracking-tight leading-tight truncate text-sm sm:text-base ${isDaylight ? 'text-[#475569]' : 'text-white'}`}>
                    {stackName}
                  </div>
                  <div className={`text-[10px] sm:text-[11px] font-mono font-medium truncate ${isDaylight ? 'text-[#64748B]' : 'text-white/80'}`}>
                    {completedCount}/{totalCount} taken
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <div
                  className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    isDaylight
                      ? isAllCompleted
                        ? 'bg-[#D1FAE5] border-[#10B981]/30 text-[#10B981]'
                        : 'bg-[#EFF3F0] border-[#E1E8E3] text-[#64748B]'
                      : isAllCompleted
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-black/40 border-white/15 text-slate-300'
                  }`}
                >
                  {completedCount}/{totalCount}
                </div>
                <ChevronRight
                  size={14}
                  className={`${isDaylight ? 'text-[#64748B]' : 'text-slate-400'} group-hover:translate-x-0.5 transition-transform`}
                />
              </div>
            </div>
          ) : (
            /* Square Mode (2-Wide, 3-Wide) or Dynamic Centered Card Layout */
            <div className="w-full h-full flex flex-col items-center justify-center my-auto text-center px-1 relative z-10">
              {/* Top Floating Badge */}
              <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-20">
                <div
                  className={`text-[10px] sm:text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    isDaylight
                      ? isAllCompleted
                        ? 'bg-[#D1FAE5] border-[#10B981]/30 text-[#10B981]'
                        : 'bg-[#EFF3F0] border-[#E1E8E3] text-[#64748B]'
                      : isAllCompleted
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-black/40 border-white/15 text-slate-300'
                  }`}
                >
                  {completedCount}/{totalCount}
                </div>
              </div>

              {/* Large Centered Pill Stack Icon */}
              <div className="flex items-center justify-center mb-1.5 sm:mb-2">
                {isAllCompleted ? (
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center shadow-sm ${
                      isDaylight
                        ? 'bg-[#D1FAE5] border border-[#10B981]/40 text-[#10B981]'
                        : 'bg-emerald-500/20 border border-emerald-400 text-emerald-300 shadow-emerald-500/30'
                    }`}
                  >
                    <Check size={24} strokeWidth={3} />
                  </div>
                ) : (
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      isDaylight ? 'bg-[#EDE9FE] text-[#8B5CF6]' : ''
                    }`}
                  >
                    <ModalityIcon
                      category="supplements"
                      modalityName={stackName}
                      customIcon="pill"
                      size={iconSize}
                      glow={!isDaylight && isIgnited}
                      isIgnited={isIgnited}
                      customColor={isDaylight ? '#8B5CF6' : visualStyle === 'full-gradient' ? '#FFFFFF' : undefined}
                    />
                  </div>
                )}
              </div>

              <div
                className={`font-black text-sm sm:text-base tracking-tight text-center break-words line-clamp-2 px-1 flex items-center justify-center gap-1 ${
                  isDaylight ? 'text-[#475569]' : 'text-white'
                }`}
              >
                <span>{stackName}</span>
                <ChevronRight
                  size={13}
                  className={`${isDaylight ? 'text-[#64748B]' : 'text-slate-400'} group-hover:translate-x-0.5 transition-transform shrink-0`}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Stack Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
          <div
            className={`border rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl relative ${
              isDaylight
                ? 'bg-white border-[#E1E8E3] text-[#475569]'
                : 'bg-slate-950 border-white/15 text-white'
            }`}
          >
            {/* Header */}
            <div
              className={`flex items-center justify-between border-b pb-3 mb-4 ${
                isDaylight ? 'border-[#E1E8E3]' : 'border-white/10'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    isDaylight
                      ? 'bg-[#F0ECF9] text-[#765DB4]'
                      : 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                  }`}
                >
                  <Pill size={18} className="rotate-45" />
                </div>
                <div>
                  <h3 className={`font-black text-base ${isDaylight ? 'text-[#475569]' : 'text-white'}`}>
                    {stackName}
                  </h3>
                  <p className={`text-xs ${isDaylight ? 'text-[#526661]' : 'text-slate-400'}`}>
                    {completedCount} of {totalCount} supplements completed
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isDaylight
                    ? 'bg-[#EFF3F0] text-[#526661] hover:text-[#475569]'
                    : 'bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white'
                }`}
              >
                <X size={14} />
              </button>
            </div>

            {/* Individual Supplement Rows */}
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {tasks.map((task) => {
                const mod = task.protocol_step?.modality || task.loose_modality
                const modName = getSimplifiedModalityName(mod, task)
                const isDone = task.status === 'completed'
                const mId = mod?.id || ''
                const bench = benchItems.find((b) => b.modality_id === mId)
                const dose =
                  task.execution_details?.custom_dose ||
                  bench?.custom_dose ||
                  mod?.dose_or_exposure ||
                  task.protocol_step?.dose_text ||
                  ''

                return (
                  <div
                    key={task.id}
                    onClick={() => handleToggleSingle(task)}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                      isDaylight
                        ? isDone
                          ? 'bg-[#E6F3EB]/60 border-[#2B725C]/30 text-[#475569]'
                          : 'bg-[#EFF3F0]/60 border-[#E1E8E3] hover:border-[#765DB4]/40 text-[#475569]'
                        : isDone
                        ? 'bg-emerald-950/20 border-emerald-500/30'
                        : 'bg-slate-900/80 border-white/10 hover:border-amber-500/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                          isDone
                            ? isDaylight
                              ? 'bg-[#2B725C] border-[#2B725C] text-white font-black shadow-sm'
                              : 'bg-emerald-500 border-emerald-400 text-slate-950 font-black shadow-sm'
                            : isDaylight
                            ? 'bg-white border-[#E1E8E3] text-transparent'
                            : 'bg-white/5 border-white/10 text-transparent'
                        }`}
                      >
                        <Check size={14} strokeWidth={3} />
                      </div>

                      <div className="min-w-0">
                        <div
                          className={`text-xs sm:text-sm font-bold truncate ${
                            isDone
                              ? isDaylight
                                ? 'line-through text-[#526661]'
                                : 'line-through text-slate-400'
                              : isDaylight
                              ? 'text-[#475569]'
                              : 'text-white'
                          }`}
                        >
                          {modName}
                        </div>
                        {dose && (
                          <div
                            className={`text-[10px] font-mono truncate ${
                              isDaylight ? 'text-[#765DB4]' : 'text-amber-300/80'
                            }`}
                          >
                            {dose}
                          </div>
                        )}
                      </div>
                    </div>

                    <ModalityIcon
                      modality={mod}
                      size={16}
                      glow={!isDaylight && !isDone}
                      customColor={isDaylight ? '#765DB4' : undefined}
                    />
                  </div>
                )
              })}
            </div>

            {/* Bottom Actions */}
            <div
              className={`flex items-center justify-between pt-4 border-t mt-4 gap-2 ${
                isDaylight ? 'border-[#E1E8E3]' : 'border-white/10'
              }`}
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isDaylight
                    ? 'bg-[#EFF3F0] hover:bg-[#E1E8E3] text-[#526661]'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300'
                }`}
              >
                Close
              </button>

              {!isAllCompleted && (
                <button
                  onClick={handleCompleteAll}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md active:scale-95 ${
                    isDaylight
                      ? 'bg-[#6954C8] hover:bg-[#5944B6] text-white shadow-[#6954C8]/20'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                  }`}
                >
                  <Check size={14} strokeWidth={3} />
                  <span>Take All</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
