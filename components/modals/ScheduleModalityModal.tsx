'use client'

import { useState } from 'react'
import { Modality } from '@/lib/types'
import { X, Calendar, CalendarPlus, Bookmark, Check } from 'lucide-react'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { createDailyTask, addToBench } from '@/lib/data'
import { format } from 'date-fns'
import { useTheme } from '@/lib/utils/useTheme'

type ScheduleModalityModalProps = {
  isOpen: boolean
  onClose: () => void
  modality: Modality | null
  onSuccess: (destination: 'today' | 'tomorrow' | 'bench') => void
}

export default function ScheduleModalityModal({ isOpen, onClose, modality, onSuccess }: ScheduleModalityModalProps) {
  const { theme } = useTheme()
  const isDaylight = theme === 'light'

  const [isSaving, setIsSaving] = useState(false)
  const [confirmedDestination, setConfirmedDestination] = useState<'today' | 'tomorrow' | 'bench' | null>(null)

  if (!isOpen || !modality) return null

  const handleSchedule = (destination: 'today' | 'tomorrow' | 'bench') => {
    // Instant confirmation state and immediate parent notification
    setConfirmedDestination(destination)
    setIsSaving(true)
    onSuccess(destination)
    
    const localUserId = getLocalUserId()
    const targetDate = new Date()
    if (destination === 'tomorrow') {
      targetDate.setDate(targetDate.getDate() + 1)
    }
    const dateStr = format(targetDate, 'yyyy-MM-dd')

    // Start async database save in parallel (high-performance batched)
    const savePromise = destination === 'bench'
      ? addToBench(localUserId, modality.id)
      : createDailyTask(localUserId, dateStr, modality.id)

    savePromise
      .catch(err => console.error('Error saving scheduled modality:', err))
      .finally(() => setIsSaving(false))

    // Auto-disappear smoothly after 900ms
    setTimeout(() => {
      setConfirmedDestination(null)
      onClose()
    }, 900)
  }

  const handleModalClose = () => {
    setConfirmedDestination(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity" 
        onClick={handleModalClose} 
      />
      
      <div className={`relative rounded-2xl w-full max-w-sm shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border ${
        isDaylight 
          ? 'bg-white border-slate-200 text-slate-900 shadow-slate-900/10' 
          : 'bg-[#111111] border-levl-border text-white'
      }`}>
        <div className={`p-4 border-b flex justify-between items-center ${
          isDaylight ? 'bg-slate-50/90 border-slate-200' : 'bg-levl-surface border-levl-border'
        }`}>
          <h2 className={`text-base sm:text-lg font-bold flex items-center gap-2 ${
            isDaylight ? 'text-slate-900' : 'text-white'
          }`}>
            Schedule Modality
          </h2>
          <button 
            type="button"
            onClick={handleModalClose} 
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDaylight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60' : 'text-levl-text-secondary hover:text-white hover:bg-white/10'
            }`}
          >
            <X size={18} />
          </button>
        </div>
        
        {confirmedDestination ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-3 animate-in fade-in zoom-in-95 duration-200">
            <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center shadow-lg animate-bounce ${
              isDaylight 
                ? 'bg-emerald-100 border-emerald-500 text-emerald-600 shadow-emerald-500/20' 
                : 'bg-emerald-500/20 border-emerald-500/60 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.4)]'
            }`}>
              <Check size={32} strokeWidth={3} />
            </div>
            <h3 className={`text-xl font-extrabold ${isDaylight ? 'text-slate-900' : 'text-white'}`}>
              {confirmedDestination === 'today' && 'Added to Today!'}
              {confirmedDestination === 'tomorrow' && 'Scheduled for Tomorrow!'}
              {confirmedDestination === 'bench' && 'Saved to Bench!'}
            </h3>
            <p className={`text-xs font-bold tracking-wide uppercase ${isDaylight ? 'text-emerald-700' : 'text-emerald-400'}`}>
              {modality.display_name || modality.name}
            </p>
          </div>
        ) : (
          <div className="p-6">
            <div className="mb-6 text-center">
              <h3 className={`text-lg sm:text-xl font-extrabold mb-1.5 ${isDaylight ? 'text-slate-900' : 'text-white'}`}>
                {modality.display_name || modality.name}
              </h3>
              <p className={`text-xs sm:text-sm ${isDaylight ? 'text-slate-500' : 'text-gray-400'}`}>
                When would you like to start this protocol?
              </p>
            </div>

            <div className="space-y-2.5">
              <button 
                type="button"
                onClick={() => handleSchedule('today')}
                disabled={isSaving}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left group cursor-pointer transition-all disabled:opacity-50 ${
                  isDaylight 
                    ? 'bg-emerald-50/80 hover:bg-emerald-500 border-emerald-200 hover:border-emerald-500 text-emerald-900 hover:text-white shadow-2xs' 
                    : 'bg-levl-accent/10 border-levl-accent/20 hover:bg-levl-accent text-levl-accent hover:text-white'
                }`}
              >
                <Calendar size={18} className={`shrink-0 ${isDaylight ? 'text-emerald-600 group-hover:text-white' : 'text-levl-accent group-hover:text-white'}`} />
                <div>
                  <div className={`font-bold text-xs sm:text-sm ${isDaylight ? 'text-emerald-950 group-hover:text-white' : 'text-levl-accent group-hover:text-white'}`}>
                    Start Today
                  </div>
                  <div className={`text-[11px] mt-0.5 ${isDaylight ? 'text-emerald-700/80 group-hover:text-white/90' : 'opacity-80 group-hover:text-white/80'}`}>
                    Add to your active timeline immediately.
                  </div>
                </div>
              </button>

              <button 
                type="button"
                onClick={() => handleSchedule('tomorrow')}
                disabled={isSaving}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left group cursor-pointer transition-all disabled:opacity-50 ${
                  isDaylight 
                    ? 'bg-slate-50 hover:bg-slate-100/90 border-slate-200 text-slate-800' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                }`}
              >
                <CalendarPlus size={18} className={`shrink-0 ${isDaylight ? 'text-slate-500 group-hover:text-slate-700' : 'text-gray-400 group-hover:text-white'}`} />
                <div>
                  <div className={`font-bold text-xs sm:text-sm ${isDaylight ? 'text-slate-900' : 'text-white'}`}>
                    Start Tomorrow
                  </div>
                  <div className={`text-[11px] mt-0.5 ${isDaylight ? 'text-slate-500 group-hover:text-slate-600' : 'text-gray-400 group-hover:text-gray-300'}`}>
                    Need time to get it? Start fresh tomorrow.
                  </div>
                </div>
              </button>

              <button 
                type="button"
                onClick={() => handleSchedule('bench')}
                disabled={isSaving}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left group cursor-pointer transition-all disabled:opacity-50 ${
                  isDaylight 
                    ? 'bg-cyan-50/80 hover:bg-cyan-100/90 border-cyan-200 text-cyan-950 shadow-2xs' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                }`}
              >
                <Bookmark size={18} className={`shrink-0 ${isDaylight ? 'text-cyan-600 group-hover:text-cyan-700' : 'text-gray-400 group-hover:text-white'}`} />
                <div>
                  <div className={`font-bold text-xs sm:text-sm ${isDaylight ? 'text-cyan-950' : 'text-white'}`}>
                    Save to Bench
                  </div>
                  <div className={`text-[11px] mt-0.5 ${isDaylight ? 'text-cyan-700/80 group-hover:text-cyan-800' : 'text-gray-400 group-hover:text-gray-300'}`}>
                    Keep it saved for a later date.
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
