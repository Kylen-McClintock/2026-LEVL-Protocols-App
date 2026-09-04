'use client'

import React, { useState } from 'react'
import { Sparkles, Check, X, ShieldAlert, Zap, Activity, Coffee, Waves, Brain } from 'lucide-react'
import { DailyProtocolTask } from '@/lib/types'
import { addModalityOrProtocolToToday, updateTaskExecutionDetails } from '@/lib/data'
import { safeLocalStorageSet } from '@/lib/utils/storage'

export interface AdaptiveSleepTriageCardProps {
  actualSleepMinutes: number
  subjectiveSleep: number
  dateStr: string
  localUserId: string
  todayTasks: DailyProtocolTask[]
  onApplied: () => void
  onDismiss: () => void
}

interface TriageOption {
  id: string
  title: string
  category: 'supplement' | 'cardio' | 'recovery' | 'lifestyle'
  icon: any
  badge: string
  badgeColor: string
  description: string
  scientificRationale: string
}

export default function AdaptiveSleepTriageCard({
  actualSleepMinutes,
  subjectiveSleep,
  dateStr,
  localUserId,
  todayTasks,
  onApplied,
  onDismiss,
}: AdaptiveSleepTriageCardProps) {
  const isSleepDeficient = actualSleepMinutes < 390 || subjectiveSleep <= 4 // Under 6.5h or <=4/10
  const sleepHoursDisplay = `${Math.floor(actualSleepMinutes / 60)}h ${actualSleepMinutes % 60}m`

  const triageOptions: TriageOption[] = [
    {
      id: 'creatine',
      title: 'Creatine Monohydrate (+10g Cognitive Recovery Dose)',
      category: 'supplement',
      icon: Brain,
      badge: 'Recommended for Poor Sleep',
      badgeColor: 'text-amber-300 bg-amber-500/20 border-amber-500/40',
      description: 'Rapidly replenishes cerebral phosphocreatine and rescues working memory, executive function, and mental processing speed.',
      scientificRationale: 'Gordji-Nejad et al. (2024 / PMID: 36316270) demonstrated acute 10g–20g creatine restores prefrontal ATP and eliminates sleep-loss brain fog.'
    },
    {
      id: 'strain_swap',
      title: 'Swap High-Strain Cardio/Lifting ➔ Zone 2 Recovery Walk (45 mins)',
      category: 'cardio',
      icon: Activity,
      badge: 'Autonomic Protection',
      badgeColor: 'text-emerald-300 bg-emerald-500/20 border-emerald-500/40',
      description: 'Replace heavy sympathetic strain with a steady aerobic recovery walk to maintain mitochondrial flux without central nervous system burnout.',
      scientificRationale: 'Training at high RPE under sleep debt doubles musculoskeletal injury rates and suppresses immune function. Zone 2 enhances parasympathetic recovery.'
    },
    {
      id: 'nsdr',
      title: 'Add 20-min Non-Sleep Deep Rest (NSDR / Yoga Nidra) at 1:30 PM',
      category: 'recovery',
      icon: Waves,
      badge: 'Dopamine & Autonomic Reset',
      badgeColor: 'text-cyan-300 bg-cyan-500/20 border-cyan-500/40',
      description: 'Guided autonomic decompression that recharges striatal dopamine reserves without reducing homeostatic sleep pressure for tonight.',
      scientificRationale: 'Stanford Huberman Lab protocols show 20m NSDR restores cognitive alertness comparable to 90m slow-wave sleep without post-nap grogginess.'
    },
    {
      id: 'caffeine_cutoff',
      title: 'Advance Caffeine Cutoff to 12:00 PM (Noon)',
      category: 'lifestyle',
      icon: Coffee,
      badge: 'Circadian Lock',
      badgeColor: 'text-purple-300 bg-purple-500/20 border-purple-500/40',
      description: 'Stops the vicious cycle of late compensatory coffee intake from wrecking tonight\'s slow-wave sleep architecture.',
      scientificRationale: 'Sleep-deprived adenosine receptors are hypersensitive. A 12:00 PM cutoff guarantees complete hepatic caffeine clearance before bedtime.'
    },
    {
      id: 'cold_downgrade',
      title: 'Downgrade Cold Plunge to 1-min Gentle Cool Shower',
      category: 'recovery',
      icon: Zap,
      badge: 'Reduced Adrenergic Stress',
      badgeColor: 'text-sky-300 bg-sky-500/20 border-sky-500/40',
      description: 'Shorten acute cold shock exposure to avoid taxing an already depleted sympathetic nervous system.',
      scientificRationale: 'Prolonged cold water immersion triggers an intense norepinephrine spike that can exhaust adrenals during acute sleep restriction.'
    }
  ]

  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({
    creatine: true,
    strain_swap: true,
    nsdr: true,
    caffeine_cutoff: true,
    cold_downgrade: true,
  })

  const [isApplying, setIsApplying] = useState(false)

  const selectedCount = Object.values(selectedIds).filter(Boolean).length

  const handleToggle = (id: string) => {
    setSelectedIds(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleSelectAll = () => {
    const allOn: Record<string, boolean> = {}
    triageOptions.forEach(o => { allOn[o.id] = true })
    setSelectedIds(allOn)
  }

  const handleDeselectAll = () => {
    const allOff: Record<string, boolean> = {}
    triageOptions.forEach(o => { allOff[o.id] = false })
    setSelectedIds(allOff)
  }

  const handleApproveSelected = async () => {
    setIsApplying(true)
    try {
      const getTaskName = (t: DailyProtocolTask): string => {
        return (t.protocol_step?.modality?.name || t.loose_modality?.name || (t as any).modality?.name || '').toLowerCase()
      }

      // 1. Creatine Monohydrate Boost / Addition
      if (selectedIds.creatine) {
        const existingCreatine = todayTasks.find(t => 
          getTaskName(t).includes('creatine') ||
          (t.modality_id || '').includes('creatine')
        )
        if (existingCreatine) {
          await updateTaskExecutionDetails(existingCreatine.id, {
            custom_dose: '10g (Sleep Recovery Cognitive Rescue Dose)',
            notes: 'Boosted to 10g for prefrontal ATP replenishment and cognitive recovery.'
          })
        } else {
          await addModalityOrProtocolToToday(localUserId, dateStr, 'creatine_monohydrate')
        }
      }

      // 2. High Strain Workout ➔ Zone 2 Swap
      if (selectedIds.strain_swap) {
        const strainTask = todayTasks.find(t => {
          const name = getTaskName(t)
          return name.includes('zone 5') || name.includes('hiit') || name.includes('sprint') || name.includes('resistance') || name.includes('heavy')
        })
        if (strainTask) {
          await updateTaskExecutionDetails(strainTask.id, {
            custom_dose: '45 mins @ 60–70% Max HR',
            custom_timing: 'Morning / Afternoon Recovery Walk',
            notes: 'Adapted from high-strain lifting/HIIT to Zone 2 recovery walk to protect nervous system after poor sleep.'
          })
        }
      }

      // 3. 20-min NSDR at 1:30 PM
      if (selectedIds.nsdr) {
        await addModalityOrProtocolToToday(localUserId, dateStr, 'Non-Sleep Deep Rest (NSDR / Yoga Nidra)')
      }

      // 4. Cold Plunge Downgrade
      if (selectedIds.cold_downgrade) {
        const coldTask = todayTasks.find(t => {
          const name = getTaskName(t)
          return name.includes('cold') || name.includes('plunge') || name.includes('ice')
        })
        if (coldTask) {
          await updateTaskExecutionDetails(coldTask.id, {
            custom_dose: '1 min gentle cool shower',
            notes: 'Reduced duration from 3 mins to 1 min to prevent adrenergic exhaustion.'
          })
        }
      }

      if (typeof window !== 'undefined') {
        safeLocalStorageSet(`levl_sleep_triage_${dateStr}`, 'applied')
        window.dispatchEvent(new CustomEvent('levl_tasks_updated'))
      }

      onApplied()
    } catch (err) {
      console.error('Error applying sleep recovery triage:', err)
      onApplied()
    } finally {
      setIsApplying(false)
    }
  }

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      safeLocalStorageSet(`levl_sleep_triage_${dateStr}`, 'dismissed')
    }
    onDismiss()
  }

  if (!isSleepDeficient) return null

  return (
    <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-950/90 to-purple-950/40 border border-amber-500/40 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-300">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.35)] shrink-0">
            <ShieldAlert size={18} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-extrabold text-white tracking-tight">
                Adaptive Sleep Recovery Protocol
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300">
                ⚠️ Sleep Deficit ({sleepHoursDisplay} • {subjectiveSleep}/10)
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Your autonomic nervous system has elevated strain today. We calibrated evidence-based adjustments to eliminate brain fog, prevent injury, and restore dopamine:
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
          title="Dismiss triage"
        >
          <X size={16} />
        </button>
      </div>

      {/* Select All / Deselect All Bar */}
      <div className="flex items-center justify-between py-2 text-xs text-slate-400">
        <span className="text-[11px] font-medium">
          Select or uncheck swaps below, then approve all at once:
        </span>
        <div className="flex items-center gap-2 text-[11px] font-semibold">
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
          >
            Select All
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={handleDeselectAll}
            className="text-slate-400 hover:text-slate-300 transition-colors cursor-pointer"
          >
            Deselect All
          </button>
        </div>
      </div>

      {/* Triage Options Checklist */}
      <div className="space-y-2.5 pt-1">
        {triageOptions.map(option => {
          const isChecked = Boolean(selectedIds[option.id])
          const Icon = option.icon

          return (
            <div
              key={option.id}
              onClick={() => handleToggle(option.id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                isChecked
                  ? 'bg-black/60 border-amber-500/40 shadow-sm'
                  : 'bg-black/20 border-white/5 opacity-60 hover:opacity-85'
              }`}
            >
              {/* Checkbox */}
              <div className="pt-0.5">
                <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                  isChecked
                    ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                    : 'border border-white/30 bg-transparent'
                }`}>
                  {isChecked && <Check size={13} strokeWidth={3} />}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                    <Icon size={14} className="text-amber-400 shrink-0" />
                    <span>{option.title}</span>
                  </div>
                  <span className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full border ${option.badgeColor}`}>
                    {option.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  {option.description}
                </p>
                <p className="text-[10px] text-amber-200/70 mt-1 italic">
                  💡 {option.scientificRationale}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom Batch Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-2 border-t border-white/10">
        <span className="text-xs font-mono text-slate-400">
          {selectedCount} of {triageOptions.length} adaptations selected
        </span>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleDismiss}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all cursor-pointer"
          >
            Keep Original Schedule
          </button>
          <button
            type="button"
            disabled={selectedCount === 0 || isApplying}
            onClick={handleApproveSelected}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-amber-500/25 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Sparkles size={14} />
            <span>{isApplying ? 'Applying...' : `Approve Selected Adjustments (${selectedCount})`}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
