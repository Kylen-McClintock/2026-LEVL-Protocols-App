'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Coffee, Clock, Zap, Check, AlertTriangle, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react'
import { DailyQuickLogEntry } from '@/lib/types'
import { loadQuickLogsForDate } from '@/lib/storage/quickLogsStorage'
import { format } from 'date-fns'

export type CaffeineCutoffExecutionDetails = {
  total_caffeine_mg?: number | ''
  last_caffeine_time?: string // HH:mm
  hours_before_bed?: number | ''
  cutoff_met?: boolean
  notes?: string
  autofilled_from_hotkeys?: boolean
  caffeine_entries_count?: number
  [key: string]: any
}

interface Props {
  value: CaffeineCutoffExecutionDetails
  onChange: (val: CaffeineCutoffExecutionDetails) => void
  date?: string
  localUserId?: string
  idealBedtime?: string
}

// Convert common coffee/caffeine log units to approximate caffeine mg
function estimateCaffeineMg(entry: DailyQuickLogEntry): number {
  const val = Number(entry.value) || 1
  const unit = (entry.unit || '').toLowerCase().trim()
  const name = (entry.hotkey_name || '').toLowerCase()

  if (unit === 'mg') return val
  if (name.includes('espresso') || unit.includes('shot')) return Math.round(val * 65)
  if (name.includes('cold brew')) return Math.round(val * 160)
  if (name.includes('energy') || name.includes('pre-workout') || name.includes('preworkout')) return Math.round(val * 175)
  if (name.includes('tea') || name.includes('matcha')) return Math.round(val * 40)
  // Standard brewed coffee cup (~8-10 oz) is ~95mg
  if (val <= 10) return Math.round(val * 95)
  return val
}

function computeHoursBeforeBed(timeStr: string, bedtimeStr: string = '22:30'): number {
  if (!timeStr) return 10
  const [cHours, cMins] = timeStr.split(':').map((n) => parseInt(n, 10))
  const [bHours, bMins] = bedtimeStr.split(':').map((n) => parseInt(n, 10))
  if (isNaN(cHours) || isNaN(bHours)) return 10

  const caffeineMinutes = cHours * 60 + (cMins || 0)
  let bedtimeMinutes = bHours * 60 + (bMins || 0)

  // Handle midnight wrap (e.g. bedtime 00:30 vs caffeine 14:00)
  if (bedtimeMinutes <= caffeineMinutes) {
    bedtimeMinutes += 24 * 60
  }

  const diffMinutes = bedtimeMinutes - caffeineMinutes
  return Math.round((diffMinutes / 60) * 10) / 10
}

export default function CaffeineCutoffExecutionLog({
  value,
  onChange,
  date,
  localUserId,
  idealBedtime = '22:30'
}: Props) {
  const targetDate = date || format(new Date(), 'yyyy-MM-dd')
  const [hotkeyLogs, setHotkeyLogs] = useState<DailyQuickLogEntry[]>([])
  const [hasAutofilled, setHasAutofilled] = useState(Boolean(value.autofilled_from_hotkeys))
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)

  // Fetch caffeine hotkey logs for the active date
  const loadCaffeineLogs = async () => {
    const uid = localUserId || (typeof window !== 'undefined' ? localStorage.getItem('levl_local_user_id') : null)
    if (!uid) return
    setIsLoadingLogs(true)
    try {
      const logs = await loadQuickLogsForDate(uid, targetDate)
      const caffeineOnly = logs.filter((l) => {
        const hid = (l.hotkey_id || '').toLowerCase()
        const hname = (l.hotkey_name || '').toLowerCase()
        return (
          hid === 'coffee_caffeine' ||
          hid.includes('caffeine') ||
          hid.includes('coffee') ||
          hname.includes('caffeine') ||
          hname.includes('coffee') ||
          hname.includes('espresso')
        )
      })
      setHotkeyLogs(caffeineOnly)

      // If executionDetails doesn't have custom values yet, auto-fill from hotkey logs
      if (caffeineOnly.length > 0 && (value.total_caffeine_mg === undefined || value.total_caffeine_mg === '')) {
        const totalMg = caffeineOnly.reduce((sum, l) => sum + estimateCaffeineMg(l), 0)
        const sorted = [...caffeineOnly].sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime())
        const lastEntry = sorted[sorted.length - 1]
        const d = new Date(lastEntry.logged_at)
        const hh = String(d.getHours()).padStart(2, '0')
        const mm = String(d.getMinutes()).padStart(2, '0')
        const lastTime = `${hh}:${mm}`
        const hrsBefore = computeHoursBeforeBed(lastTime, idealBedtime)

        onChange({
          ...value,
          total_caffeine_mg: totalMg,
          last_caffeine_time: lastTime,
          hours_before_bed: hrsBefore,
          cutoff_met: hrsBefore >= 10,
          autofilled_from_hotkeys: true,
          caffeine_entries_count: caffeineOnly.length
        })
        setHasAutofilled(true)
      }
    } catch (err) {
      console.error('Error loading caffeine hotkey logs:', err)
    } finally {
      setIsLoadingLogs(false)
    }
  }

  useEffect(() => {
    loadCaffeineLogs()

    const handleUpdated = () => {
      loadCaffeineLogs()
    }
    window.addEventListener('levl_quicklog_updated', handleUpdated)
    return () => window.removeEventListener('levl_quicklog_updated', handleUpdated)
  }, [targetDate, localUserId])

  const totalMg = value.total_caffeine_mg !== undefined && value.total_caffeine_mg !== ''
    ? Number(value.total_caffeine_mg)
    : 0

  const lastTime = value.last_caffeine_time || '12:00'
  const hoursBeforeBed = computeHoursBeforeBed(lastTime, idealBedtime)
  const isOptimalCutoff = hoursBeforeBed >= 10.0
  const isModerateCutoff = hoursBeforeBed >= 8.0 && hoursBeforeBed < 10.0

  const handleTotalMgChange = (newVal: number | '') => {
    onChange({
      ...value,
      total_caffeine_mg: newVal,
      hours_before_bed: hoursBeforeBed,
      cutoff_met: hoursBeforeBed >= 10
    })
  }

  const handleTimeChange = (newTime: string) => {
    const hrs = computeHoursBeforeBed(newTime, idealBedtime)
    onChange({
      ...value,
      last_caffeine_time: newTime,
      hours_before_bed: hrs,
      cutoff_met: hrs >= 10
    })
  }

  const handleManualSyncFromHotkeys = () => {
    if (hotkeyLogs.length === 0) return
    const sumMg = hotkeyLogs.reduce((sum, l) => sum + estimateCaffeineMg(l), 0)
    const sorted = [...hotkeyLogs].sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime())
    const lastEntry = sorted[sorted.length - 1]
    const d = new Date(lastEntry.logged_at)
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    const lastTimeStr = `${hh}:${mm}`
    const hrs = computeHoursBeforeBed(lastTimeStr, idealBedtime)

    onChange({
      ...value,
      total_caffeine_mg: sumMg,
      last_caffeine_time: lastTimeStr,
      hours_before_bed: hrs,
      cutoff_met: hrs >= 10,
      autofilled_from_hotkeys: true,
      caffeine_entries_count: hotkeyLogs.length
    })
    setHasAutofilled(true)
  }

  return (
    <div className="flex flex-col gap-3.5 mt-3 p-4 bg-amber-950/15 rounded-2xl border border-amber-500/30 backdrop-blur-sm shadow-sm">
      {/* Header with Title & Live Hotkey Badge */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-xs text-amber-400 uppercase tracking-wider font-extrabold flex items-center gap-1.5">
          <Coffee size={14} className="text-amber-400" />
          <span>Caffeine Cutoff &amp; Daily Intake Log</span>
        </div>

        {hotkeyLogs.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-amber-300 font-bold bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Zap size={10} className="text-amber-400 fill-amber-400" />
              <span>{hotkeyLogs.length} hotkey logs today</span>
            </span>
            <button
              type="button"
              onClick={handleManualSyncFromHotkeys}
              className="text-[10px] text-amber-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
              title="Re-sync data from caffeine hotkeys"
            >
              <RefreshCw size={11} className={isLoadingLogs ? 'animate-spin' : ''} />
            </button>
          </div>
        )}
      </div>

      {/* Grid: Total Caffeine (mg) and Last Caffeine Time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Field 1: Total Caffeine Had Today (mg) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-slate-300 uppercase font-bold flex items-center gap-1">
              <span>Total Caffeine Today</span>
            </label>
            <span className="text-xs font-mono font-extrabold text-amber-400">
              {totalMg} mg
            </span>
          </div>

          <div className="relative">
            <input
              type="number"
              min="0"
              max="1500"
              step="5"
              placeholder="e.g. 190"
              value={value.total_caffeine_mg ?? ''}
              onChange={(e) =>
                handleTotalMgChange(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)
              }
              className="w-full h-10 bg-black/60 border border-white/10 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-amber-400 font-mono font-bold"
            />
            <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">
              mg
            </span>
          </div>

          {/* Quick mg Presets */}
          <div className="flex flex-wrap gap-1 pt-0.5">
            {[
              { label: '0 mg', val: 0 },
              { label: '95 mg (1 cup)', val: 95 },
              { label: '190 mg (2 cups)', val: 190 },
              { label: '285 mg (3 cups)', val: 285 },
              { label: '400 mg (Max)', val: 400 }
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleTotalMgChange(preset.val)}
                className={`text-[9px] px-2 py-0.5 rounded-lg border font-mono transition-all cursor-pointer ${
                  totalMg === preset.val
                    ? 'bg-amber-500/30 text-amber-300 border-amber-500/50 font-bold'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Field 2: Timing of Last Caffeine */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-slate-300 uppercase font-bold flex items-center gap-1">
              <Clock size={11} className="text-amber-400" />
              <span>Timing of Last Caffeine</span>
            </label>
            <span className="text-[10px] font-mono text-slate-400">
              Target bed: {idealBedtime}
            </span>
          </div>

          <input
            type="time"
            value={lastTime}
            onChange={(e) => handleTimeChange(e.target.value)}
            className="w-full h-10 bg-black/60 border border-white/10 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-amber-400 font-mono font-bold text-center"
          />

          {/* Quick Timing Presets */}
          <div className="flex flex-wrap gap-1 pt-0.5">
            {[
              { label: '11:00 AM', val: '11:00' },
              { label: '12:00 PM (Optimal)', val: '12:00' },
              { label: '1:00 PM', val: '13:00' },
              { label: '2:00 PM (Cutoff)', val: '14:00' }
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleTimeChange(preset.val)}
                className={`text-[9px] px-2 py-0.5 rounded-lg border font-mono transition-all cursor-pointer ${
                  lastTime === preset.val
                    ? 'bg-amber-500/30 text-amber-300 border-amber-500/50 font-bold'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Clinical Adenosine Clearance Banner (Walker Protocol) */}
      <div
        className={`p-3 rounded-xl border flex items-start gap-2.5 transition-all text-xs ${
          isOptimalCutoff
            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
            : isModerateCutoff
            ? 'bg-amber-950/40 border-amber-500/30 text-amber-200'
            : 'bg-rose-950/40 border-rose-500/30 text-rose-200'
        }`}
      >
        <div className="mt-0.5 shrink-0">
          {isOptimalCutoff ? (
            <ShieldCheck size={16} className="text-emerald-400" />
          ) : isModerateCutoff ? (
            <AlertTriangle size={16} className="text-amber-400" />
          ) : (
            <AlertTriangle size={16} className="text-rose-400" />
          )}
        </div>
        <div className="space-y-0.5 flex-1">
          <div className="flex items-center justify-between flex-wrap gap-1">
            <span className="font-extrabold text-white text-[11px]">
              {isOptimalCutoff
                ? `✓ 10-Hour Adenosine Threshold Met (${hoursBeforeBed}h buffer)`
                : isModerateCutoff
                ? `⚠️ Moderate Clearance Window (${hoursBeforeBed}h buffer)`
                : `❌ High NREM Disruption Risk (${hoursBeforeBed}h buffer)`}
            </span>
            <span className="text-[10px] font-mono opacity-80">
              Cutoff @ {lastTime} vs Bed @ {idealBedtime}
            </span>
          </div>
          <p className="text-[10px] leading-relaxed opacity-90">
            {isOptimalCutoff
              ? 'Adequate clearance (~2 half-lives) eliminates competitive adenosine receptor antagonism in the basal forebrain, protecting restorative NREM Stage 3/4 slow-wave sleep duration.'
              : isModerateCutoff
              ? 'Caffeine quarter-life is ~10-12 hours. Approximately 25-35% of circulating caffeine remains at bedtime, which can reduce deep delta power by up to 20% even if sleep onset is unhindered.'
              : 'Circulating caffeine actively blocks adenosine sleep pressure, fragments sleep architecture, and reduces slow-wave restorative sleep by up to 30%.'}
          </p>
        </div>
      </div>

      {/* Itemized Hotkey Intake Breakdown (if logs exist today) */}
      {hotkeyLogs.length > 0 && (
        <div className="pt-2 border-t border-white/5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Today's Logged Caffeine Doses:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {hotkeyLogs.map((log) => {
              const mgEst = estimateCaffeineMg(log)
              const logTime = format(new Date(log.logged_at), 'h:mm a')
              return (
                <div
                  key={log.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-[10px] font-mono text-slate-300"
                >
                  <Coffee size={10} className="text-amber-400" />
                  <span className="font-bold text-white">{log.hotkey_name}</span>
                  <span className="text-amber-400">~{mgEst}mg</span>
                  <span className="text-slate-500">({logTime})</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Optional Context Notes */}
      <div>
        <input
          type="text"
          placeholder="Optional notes (e.g. switched to decaf after 12pm, double shot espresso...)"
          value={value.notes || ''}
          onChange={(e) => onChange({ ...value, notes: e.target.value })}
          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
        />
      </div>
    </div>
  )
}
