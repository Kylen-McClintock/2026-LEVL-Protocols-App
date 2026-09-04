'use client'

import React, { useState, useEffect } from 'react'
import { 
  Database, 
  FileText, 
  Table, 
  Download, 
  Sparkles, 
  ShieldCheck, 
  Check, 
  Loader2, 
  Activity, 
  Bookmark, 
  Calendar,
  Layers
} from 'lucide-react'
import { 
  fetchCompleteUserData, 
  generateProtocolJSON, 
  generateProtocolMarkdown, 
  generateProtocolTasksCSV, 
  generateCheckinsCSV, 
  triggerFileDownload 
} from '@/lib/export/dataExportEngine'
import { format } from 'date-fns'

interface DataSovereigntyCardProps {
  localUserId: string
}

export default function DataSovereigntyCard({ localUserId }: DataSovereigntyCardProps) {
  const [loadingStats, setLoadingStats] = useState(true)
  const [stats, setStats] = useState({
    modalitiesCount: 0,
    protocolsCount: 0,
    tasksCount: 0,
    checkinsCount: 0
  })

  const [activeExport, setActiveExport] = useState<string | null>(null)
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null)

  // Fetch light inventory counts on mount
  useEffect(() => {
    let isMounted = true
    async function loadStats() {
      try {
        const data = await fetchCompleteUserData(localUserId)
        if (isMounted) {
          setStats({
            modalitiesCount: data.benchItems.length,
            protocolsCount: data.protocolInstances.length,
            tasksCount: data.tasks.length,
            checkinsCount: data.checkins.length
          })
          setLoadingStats(false)
        }
      } catch {
        if (isMounted) setLoadingStats(false)
      }
    }
    if (localUserId) {
      loadStats()
    }
    return () => {
      isMounted = false
    }
  }, [localUserId])

  const handleExport = async (formatType: 'markdown' | 'json' | 'csv_tasks' | 'csv_checkins') => {
    try {
      setActiveExport(formatType)
      const data = await fetchCompleteUserData(localUserId)
      const dateStr = format(new Date(), 'yyyy-MM-dd')

      if (formatType === 'markdown') {
        const content = generateProtocolMarkdown(data)
        triggerFileDownload(content, `levl-protocol-dossier-${dateStr}.md`, 'text/markdown')
      } else if (formatType === 'json') {
        const content = generateProtocolJSON(data)
        triggerFileDownload(content, `levl-protocol-vault-${dateStr}.json`, 'application/json')
      } else if (formatType === 'csv_tasks') {
        const content = generateProtocolTasksCSV(data)
        triggerFileDownload(content, `levl-protocol-tasks-${dateStr}.csv`, 'text/csv')
      } else if (formatType === 'csv_checkins') {
        const content = generateCheckinsCSV(data)
        triggerFileDownload(content, `levl-wellbeing-checkins-${dateStr}.csv`, 'text/csv')
      }

      setDownloadSuccess(formatType)
      setTimeout(() => setDownloadSuccess(null), 3000)
    } catch (err) {
      console.error('Export failed:', err)
      alert('Failed to generate export. Please check your network connection and try again.')
    } finally {
      setActiveExport(null)
    }
  }

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-indigo-950/40 border border-slate-700/60 shadow-2xl backdrop-blur-md space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.25)] shrink-0">
            <Database size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Data Sovereignty &amp; Protocol Vault
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Zero Lock-In
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              100% portable protocols, dosing formulas, and clinical logs. Export anytime as AI context, raw JSON, or spreadsheet tables.
            </p>
          </div>
        </div>
      </div>

      {/* Live Inventory Counter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <Bookmark size={15} className="text-purple-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-xs font-bold text-white">
              {loadingStats ? '—' : stats.modalitiesCount}
            </div>
            <div className="text-[10px] text-slate-400 truncate">Saved Modalities</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Layers size={15} className="text-sky-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-xs font-bold text-white">
              {loadingStats ? '—' : stats.protocolsCount}
            </div>
            <div className="text-[10px] text-slate-400 truncate">Active Protocols</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Activity size={15} className="text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-xs font-bold text-white">
              {loadingStats ? '—' : stats.tasksCount}
            </div>
            <div className="text-[10px] text-slate-400 truncate">Logged Tasks</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Calendar size={15} className="text-amber-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-xs font-bold text-white">
              {loadingStats ? '—' : stats.checkinsCount}
            </div>
            <div className="text-[10px] text-slate-400 truncate">Check-in Days</div>
          </div>
        </div>
      </div>

      {/* Export Format Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 1. AI-Ready Markdown Dossier */}
        <div className="p-4 rounded-xl bg-gradient-to-b from-purple-950/40 via-slate-900/60 to-slate-950 border border-purple-500/30 flex flex-col justify-between hover:border-purple-500/60 transition-all group">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center">
                <Sparkles size={16} />
              </div>
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                Claude / GPT
              </span>
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
              AI Context Dossier
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Pre-prompted clinical protocol briefing with circadian dosing matrix, biometrics, PubMed papers, and safety guardrails for instant LLM intake.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleExport('markdown')}
            disabled={activeExport !== null}
            className="mt-4 w-full py-2 px-3 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/50 text-purple-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            {activeExport === 'markdown' ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Assembling Dossier...</span>
              </>
            ) : downloadSuccess === 'markdown' ? (
              <>
                <Check size={13} className="text-emerald-400" />
                <span className="text-emerald-300">Downloaded .md!</span>
              </>
            ) : (
              <>
                <Download size={13} />
                <span>Download .md</span>
              </>
            )}
          </button>
        </div>

        {/* 2. Lossless System Backup JSON */}
        <div className="p-4 rounded-xl bg-gradient-to-b from-sky-950/40 via-slate-900/60 to-slate-950 border border-sky-500/30 flex flex-col justify-between hover:border-sky-500/60 transition-all group">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-300 flex items-center justify-center">
                <Database size={16} />
              </div>
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40">
                Lossless Backup
              </span>
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
              Full Protocol Vault
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Complete raw JSON dump of your entire database: custom dosage overrides, active stacks, biomarkers, check-ins, and user profile parameters.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleExport('json')}
            disabled={activeExport !== null}
            className="mt-4 w-full py-2 px-3 rounded-lg bg-sky-600/30 hover:bg-sky-600/50 border border-sky-500/50 text-sky-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            {activeExport === 'json' ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Generating Backup...</span>
              </>
            ) : downloadSuccess === 'json' ? (
              <>
                <Check size={13} className="text-emerald-400" />
                <span className="text-emerald-300">Downloaded .json!</span>
              </>
            ) : (
              <>
                <Download size={13} />
                <span>Download .json</span>
              </>
            )}
          </button>
        </div>

        {/* 3. Tabular Spreadsheets (CSV) */}
        <div className="p-4 rounded-xl bg-gradient-to-b from-amber-950/40 via-slate-900/60 to-slate-950 border border-amber-500/30 flex flex-col justify-between hover:border-amber-500/60 transition-all group">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center">
                <Table size={16} />
              </div>
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Excel / Sheets
              </span>
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
              Tabular Spreadsheets
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Clean flat tabular CSV logs with exact timestamps, adherence statuses, notes, and well-being ratings. Ready for spreadsheet analysis.
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => handleExport('csv_tasks')}
              disabled={activeExport !== null}
              className="w-full py-1.5 px-3 rounded-lg bg-amber-600/25 hover:bg-amber-600/40 border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              {activeExport === 'csv_tasks' ? (
                <Loader2 size={12} className="animate-spin" />
              ) : downloadSuccess === 'csv_tasks' ? (
                <Check size={12} className="text-emerald-400" />
              ) : (
                <Download size={12} />
              )}
              <span>Tasks &amp; Stacks (.csv)</span>
            </button>
            <button
              type="button"
              onClick={() => handleExport('csv_checkins')}
              disabled={activeExport !== null}
              className="w-full py-1 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              {activeExport === 'csv_checkins' ? (
                <Loader2 size={11} className="animate-spin" />
              ) : downloadSuccess === 'csv_checkins' ? (
                <Check size={11} className="text-emerald-400" />
              ) : (
                <Download size={11} />
              )}
              <span>Daily Check-ins (.csv)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Security Guarantee Footer */}
      <div className="flex items-center gap-2.5 text-[11px] text-slate-400 bg-slate-950/40 px-3.5 py-2.5 rounded-xl border border-slate-800/60">
        <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
        <span>
          <strong className="text-slate-300">Client-Side Sovereign Assembly:</strong> Your export files are assembled directly within your browser from your encrypted Supabase instance. LEVL never monetizes, rents, or shares your biological data.
        </span>
      </div>
    </div>
  )
}
