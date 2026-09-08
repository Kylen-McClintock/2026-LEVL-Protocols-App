'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, RefreshCw, Trash2, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    console.error('Captured error in root app boundary:', error)
  }, [error])

  const handleClearCacheAndReload = () => {
    if (typeof window !== 'undefined') {
      try {
        const keysToRemove: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i)
          if (k && k.startsWith('levl_')) {
            keysToRemove.push(k)
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k))
      } catch (e) {}
      window.location.href = '/today'
    }
  }

  const handleRetry = () => {
    try {
      reset()
    } catch {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 text-slate-100">
      <div className="max-w-md w-full rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-8 shadow-2xl relative overflow-hidden text-center space-y-6">
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-[0_0_20px_rgba(245,158,11,0.2)]">
          <AlertTriangle size={28} />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Something Interrupted This Page
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            A temporary navigation or cache conflict prevented this view from rendering cleanly. Try reloading or clearing local application cache below.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={handleRetry}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw size={16} />
            <span>Reload Page</span>
          </button>

          <button
            type="button"
            onClick={handleClearCacheAndReload}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Trash2 size={14} className="text-amber-400" />
            <span>Clear Cache &amp; Reopen Today</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') window.location.href = '/today'
            }}
            className="w-full py-2 px-4 rounded-xl text-slate-400 hover:text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft size={13} />
            <span>Go to Today View</span>
          </button>
        </div>

        <div className="pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="text-[11px] font-mono text-slate-400 hover:text-slate-300 flex items-center justify-center gap-1 mx-auto cursor-pointer"
          >
            <span>{showDetails ? 'Hide Error Details' : 'Show Error Details'}</span>
            {showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {showDetails && (
            <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-left font-mono text-[10px] text-slate-400 overflow-x-auto max-h-40 leading-relaxed">
              <div className="text-red-400 font-semibold mb-1">
                {error?.name || 'Error'}: {error?.message || 'Unknown error'}
              </div>
              {error?.digest && (
                <div className="text-slate-500 text-[9px] mb-1">Digest: {error.digest}</div>
              )}
              {error?.stack && (
                <pre className="text-slate-400 whitespace-pre-wrap">{error.stack}</pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
