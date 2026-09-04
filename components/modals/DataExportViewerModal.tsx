'use client'

import React, { useState, useMemo } from 'react'
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  Share2, 
  Search, 
  FileText, 
  Table as TableIcon, 
  Database,
  Sparkles
} from 'lucide-react'
import { 
  canShareFiles, 
  shareFileWithNativeApp, 
  openFileInNewTab, 
  triggerFileDownload 
} from '@/lib/export/dataExportEngine'

export interface ExportViewerItem {
  filename: string
  content: string
  mimeType: string
  formatType: 'markdown' | 'json' | 'csv_tasks' | 'csv_checkins'
  label: string
}

interface DataExportViewerModalProps {
  isOpen: boolean
  onClose: () => void
  item: ExportViewerItem | null
}

export default function DataExportViewerModal({
  isOpen,
  onClose,
  item
}: DataExportViewerModalProps) {
  const [copied, setCopied] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sharing, setSharing] = useState(false)

  const isShareSupported = useMemo(() => {
    return canShareFiles()
  }, [])

  // Parse CSV for tabular spreadsheet view
  const parsedCSV = useMemo(() => {
    if (!item || (!item.filename.endsWith('.csv') && item.mimeType !== 'text/csv')) return null

    const lines = item.content.split(/\r\n|\n/).filter(line => line.trim().length > 0)
    if (lines.length === 0) return null

    // Simple robust CSV line parser handling quotes
    const parseLine = (line: string): string[] => {
      const result: string[] = []
      let cur = ''
      let inQuotes = false

      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cur += '"'
            i++
          } else {
            inQuotes = !inQuotes
          }
        } else if (char === ',' && !inQuotes) {
          result.push(cur.trim())
          cur = ''
        } else {
          cur += char
        }
      }
      result.push(cur.trim())
      return result
    }

    const headers = parseLine(lines[0])
    const rows = lines.slice(1).map(parseLine)

    return { headers, rows }
  }, [item])

  // Filter CSV rows by search
  const filteredRows = useMemo(() => {
    if (!parsedCSV) return []
    if (!searchQuery.trim()) return parsedCSV.rows
    const q = searchQuery.toLowerCase()
    return parsedCSV.rows.filter(row => row.some(cell => cell.toLowerCase().includes(q)))
  }, [parsedCSV, searchQuery])

  if (!isOpen || !item) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(item.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch (err) {
      console.error('Clipboard copy failed:', err)
    }
  }

  const handleNativeShare = async () => {
    try {
      setSharing(true)
      await shareFileWithNativeApp(item.content, item.filename, item.mimeType, item.label)
    } finally {
      setSharing(false)
    }
  }

  const fileSizeKB = (new Blob([item.content]).size / 1024).toFixed(1)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-slate-200 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
              {item.filename.endsWith('.csv') ? (
                <TableIcon size={20} />
              ) : item.filename.endsWith('.json') ? (
                <Database size={20} />
              ) : (
                <Sparkles size={20} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-white truncate">
                  {item.filename}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {fileSizeKB} KB
                </span>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  {item.label}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                Ready for viewing in device apps or browser inspector
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Native OS Share / Open in App button */}
            <button
              type="button"
              onClick={handleNativeShare}
              title="Open with relevant viewing app on device (Numbers, Excel, Notes, Obsidian)"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-[0_0_12px_rgba(168,85,247,0.35)] cursor-pointer"
            >
              <Share2 size={13} />
              <span className="hidden sm:inline">Open with App...</span>
              <span className="sm:hidden">Open...</span>
            </button>

            {/* Open in New Tab */}
            <button
              type="button"
              onClick={() => openFileInNewTab(item.content, item.mimeType)}
              title="Open in new browser tab"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <ExternalLink size={15} />
            </button>

            {/* Copy Raw Content */}
            <button
              type="button"
              onClick={handleCopy}
              title="Copy raw file content to clipboard"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
            </button>

            {/* Re-download */}
            <button
              type="button"
              onClick={() => triggerFileDownload(item.content, item.filename, item.mimeType)}
              title="Download file again"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <Download size={15} />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors ml-1 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-950/80 font-mono text-xs">
          {parsedCSV ? (
            /* Tabular CSV Spreadsheet Grid */
            <div className="space-y-3 font-sans">
              <div className="flex items-center justify-between gap-3 flex-wrap font-sans">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search rows..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Showing {filteredRows.length} of {parsedCSV.rows.length} rows ({parsedCSV.headers.length} columns)
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-[55vh]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-900/95 sticky top-0 z-10 border-b border-slate-700 text-slate-300">
                    <tr>
                      <th className="py-2.5 px-3 font-bold text-slate-400 border-r border-slate-800 w-12 text-center">#</th>
                      {parsedCSV.headers.map((h, i) => (
                        <th key={i} className="py-2.5 px-3.5 font-bold whitespace-nowrap border-r border-slate-800 last:border-r-0">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 font-mono text-[11px]">
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={parsedCSV.headers.length + 1} className="py-8 text-center text-slate-500 font-sans">
                          No matching rows found for &quot;{searchQuery}&quot;
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-purple-950/20 transition-colors odd:bg-slate-950/40 even:bg-slate-900/20">
                          <td className="py-2 px-3 text-slate-500 text-center border-r border-slate-800/80 font-sans">{rIdx + 1}</td>
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="py-2 px-3.5 whitespace-nowrap max-w-xs truncate border-r border-slate-800/50 last:border-r-0 text-slate-300">
                              {cell || <span className="text-slate-600 italic">—</span>}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : item.filename.endsWith('.json') ? (
            /* Syntax Prettified JSON Code View */
            <div className="rounded-xl bg-slate-900/90 p-4 border border-slate-800 overflow-x-auto max-h-[60vh]">
              <pre className="text-purple-300 whitespace-pre-wrap leading-relaxed">
                {(() => {
                  try {
                    return JSON.stringify(JSON.parse(item.content), null, 2)
                  } catch {
                    return item.content
                  }
                })()}
              </pre>
            </div>
          ) : (
            /* Markdown Document View */
            <div className="rounded-xl bg-slate-900/90 p-5 border border-slate-800 overflow-x-auto max-h-[60vh] font-sans">
              <div className="prose prose-invert prose-purple max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-wrap text-slate-300 font-mono">
                {item.content}
              </div>
            </div>
          )}
        </div>

        {/* Footer Guidance */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3 text-xs text-slate-400 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              {isShareSupported ? (
                <>Tap <strong>&quot;Open with App...&quot;</strong> to view in Numbers, Excel, Notes, or Obsidian.</>
              ) : (
                <>Tip: Click the browser download notification to launch in your device&apos;s default spreadsheet or document viewer.</>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="text-xs font-semibold px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              <span>{copied ? 'Copied!' : 'Copy Data'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold px-3.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
