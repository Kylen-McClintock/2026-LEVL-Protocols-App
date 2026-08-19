'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DailyProtocolTask, UserProfile, Modality } from '@/lib/types'
import { format } from 'date-fns'
import {
  Clock,
  Sparkles,
  Flame,
  Zap,
  Activity,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  Info,
  Plus,
  ExternalLink
} from 'lucide-react'

interface FastingSplitViewProps {
  tasks: DailyProtocolTask[]
  weekDays: Date[]
  userProfile?: UserProfile | null
}

export function isFastingModality(task: DailyProtocolTask): boolean {
  const m = task.loose_modality || task.protocol_step?.modality
  const mId = (task.modality_id || m?.id || '').toLowerCase()
  const cat = (m?.category || '').toLowerCase()
  const name = (m?.name || '').toLowerCase()

  return (
    cat.includes('fasting') ||
    cat.includes('autophagy') ||
    mId.includes('fast') ||
    name.includes('fast')
  )
}

export default function FastingSplitView({
  tasks,
  weekDays,
  userProfile
}: FastingSplitViewProps) {
  const router = useRouter()
  const [selectedFastDay, setSelectedFastDay] = useState<string | null>(null)

  // Find all active fasting tasks and modalities
  const fastingTasks = tasks.filter(isFastingModality)
  const activeFastingModalitiesMap = new Map<string, Modality>()
  fastingTasks.forEach(t => {
    const m = t.loose_modality || t.protocol_step?.modality
    if (m) activeFastingModalitiesMap.set(m.id, m)
  })
  const activeFastingModalities = Array.from(activeFastingModalitiesMap.values())

  const hasFastingActive = activeFastingModalities.length > 0 || !!userProfile?.fasting_schedule

  const fastProtocol = userProfile?.fasting_schedule || (activeFastingModalities[0]?.id?.includes('omad') ? 'omad' : activeFastingModalities[0]?.id?.includes('20_4') ? '20_4' : '16_8')
  const firstBite = userProfile?.eating_window_start || '12:00'
  const lastBite = userProfile?.eating_window_end || '20:00'

  const fastingWindowHours = fastProtocol === 'omad' ? 23 : fastProtocol === '20_4' ? 20 : fastProtocol === '18_6' ? 18 : 16
  const feedingWindowHours = 24 - fastingWindowHours

  const completedFastsCount = fastingTasks.filter(t => t.status === 'completed').length

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* 1. Fasting Executive 4-KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex items-center gap-3.5 backdrop-blur-md">
          <div className="w-11 h-11 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center shrink-0 shadow-md">
            <Clock size={22} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Fasting Schedule
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-white font-mono">
                {hasFastingActive ? `${fastingWindowHours}:${feedingWindowHours}` : 'None Set'}
              </span>
              {hasFastingActive && <span className="text-[10px] text-teal-400 font-bold">Ratio</span>}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex items-center gap-3.5 backdrop-blur-md">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 shadow-md">
            <Zap size={22} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Fasting Check-Ins
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-emerald-300 font-mono">
                {completedFastsCount}
              </span>
              <span className="text-[10px] text-slate-400">of {fastingTasks.length || 0} scheduled</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex items-center gap-3.5 backdrop-blur-md">
          <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 shadow-md">
            <Sparkles size={22} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Autophagy Depth
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-sm sm:text-base font-black text-indigo-300 font-mono">
                {hasFastingActive ? (fastingWindowHours >= 18 ? 'High (8.8/10)' : 'Optimal (7.5/10)') : 'Baseline'}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex items-center gap-3.5 backdrop-blur-md">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 shadow-md">
            <Flame size={22} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Feeding Window
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-sm sm:text-base font-black text-white font-mono">
                {hasFastingActive ? `${firstBite} – ${lastBite}` : 'Unrestricted'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Enrolled Fasting Modalities */}
      {activeFastingModalities.length > 0 && (
        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center gap-2 text-xs flex-wrap">
          <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <Flame size={13} className="text-teal-400" />
            Active Fasting Modalities:
          </span>
          {activeFastingModalities.map(m => (
            <span
              key={m.id}
              className="px-2.5 py-0.5 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-300 font-semibold text-[11px]"
            >
              {m.name}
            </span>
          ))}
        </div>
      )}

      {/* 2. Fasting Weekly Chrono Grid */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock size={14} />
            <span>Weekly Intermittent Fasting &amp; Autophagy Timeline</span>
          </h3>
        </div>

        {hasFastingActive ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7 gap-3.5">
            {weekDays.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd')
              const dayName = format(day, 'EEE')
              const dayFastingTask = fastingTasks.find(t => t.scheduled_date === dateStr)
              const isCompleted = dayFastingTask?.status === 'completed'

              return (
                <div
                  key={dateStr}
                  className={`glass-card p-4 rounded-2xl border transition-all space-y-3 ${
                    isCompleted
                      ? 'border-teal-500/50 bg-slate-900/90 shadow-lg shadow-teal-950/20'
                      : 'border-teal-500/30 bg-slate-900/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider font-mono">
                      {dayName} {dateStr.split('-')[2]}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        isCompleted
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                      }`}
                    >
                      {isCompleted ? '✓ Completed' : `${fastingWindowHours}h Fast`}
                    </span>
                  </div>

                  {/* Fasting Progress Bar */}
                  <div className="space-y-1 bg-black/40 p-2.5 rounded-xl border border-white/5">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Fasting Window</span>
                      <span className="text-teal-300 font-mono font-bold">{lastBite} → {firstBite}</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-400"
                        style={{ width: `${(fastingWindowHours / 24) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between text-slate-400">
                      <span>Feeding Window:</span>
                      <span className="text-white font-mono font-bold">{feedingWindowHours}h ({firstBite} – {lastBite})</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3">
            <Clock size={28} className="text-teal-400 mx-auto" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">No Fasting Protocol Enrolled in Active Stack</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Add an intermittent fasting or autophagy protocol to your stack to track metabolic waveforms, feeding windows, and ketone depth.
              </p>
            </div>
            <button
              onClick={() => router.push('/explore')}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold text-xs inline-flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Plus size={14} />
              <span>Browse Fasting Protocols in Explore</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Biological Fasting Zones Science Card */}
      <div className="glass-card p-5 sm:p-6 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-teal-400">
          <Info size={18} />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Biological Stages of Fasting &amp; Autophagy Activation
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 space-y-1.5">
            <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-md">
              0 – 12 Hours
            </span>
            <h4 className="text-xs font-bold text-white">Glycogen Depletion</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Blood glucose and circulating insulin drop. The liver mobilizes stored glycogen for ATP production.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 space-y-1.5">
            <span className="text-[10px] font-mono font-bold text-teal-300 bg-teal-500/20 border border-teal-500/30 px-2 py-0.5 rounded-md">
              12 – 18 Hours
            </span>
            <h4 className="text-xs font-bold text-white">Ketogenesis &amp; Fat Oxidation</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Lipolysis surges. The liver converts fatty acids into beta-hydroxybutyrate (BHB), fueling the brain and sparing muscle tissue.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 space-y-1.5">
            <span className="text-[10px] font-mono font-bold text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 rounded-md">
              18 – 24+ Hours
            </span>
            <h4 className="text-xs font-bold text-white">Deep Autophagy &amp; Cellular Cleanup</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              AMPK activation suppresses mTOR, stimulating autophagosomes to clear damaged senescent organelles and misfolded proteins.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
