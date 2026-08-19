'use client'

import { useState } from 'react'
import { Modality } from '@/lib/types'
import { X, Calendar, CalendarPlus, Bookmark, Check } from 'lucide-react'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { createDailyTask, addToBench } from '@/lib/data'
import { format } from 'date-fns'

type ScheduleModalityModalProps = {
  isOpen: boolean
  onClose: () => void
  modality: Modality | null
  onSuccess: (destination: 'today' | 'tomorrow' | 'bench') => void
}

export default function ScheduleModalityModal({ isOpen, onClose, modality, onSuccess }: ScheduleModalityModalProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [confirmedDestination, setConfirmedDestination] = useState<'today' | 'tomorrow' | 'bench' | null>(null)

  if (!isOpen || !modality) return null

  const handleSchedule = (destination: 'today' | 'tomorrow' | 'bench') => {
    // Instant confirmation state
    setConfirmedDestination(destination)
    setIsSaving(true)
    
    const localUserId = getLocalUserId()
    const targetDate = new Date()
    if (destination === 'tomorrow') {
      targetDate.setDate(targetDate.getDate() + 1)
    }
    const dateStr = format(targetDate, 'yyyy-MM-dd')

    // Start async database save in parallel
    const savePromise = destination === 'bench'
      ? addToBench(localUserId, modality.id)
      : createDailyTask(localUserId, dateStr, modality.id)

    savePromise
      .catch(err => console.error('Error saving scheduled modality:', err))
      .finally(() => setIsSaving(false))

    // Auto-disappear after EXACTLY 1.5 seconds (1500ms) from click
    setTimeout(() => {
      onSuccess(destination)
      setConfirmedDestination(null)
      onClose()
    }, 1500)
  }

  const handleModalClose = () => {
    setConfirmedDestination(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleModalClose} />
      
      <div className="relative bg-[#111111] border border-levl-border rounded-2xl w-full max-w-sm shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-levl-border flex justify-between items-center bg-levl-surface">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Schedule Modality
          </h2>
          <button onClick={handleModalClose} className="text-levl-text-secondary hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        {confirmedDestination ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-3 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/60 text-emerald-400 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)] animate-bounce">
              <Check size={32} strokeWidth={3} />
            </div>
            <h3 className="text-xl font-extrabold text-white">
              {confirmedDestination === 'today' && 'Added to Today!'}
              {confirmedDestination === 'tomorrow' && 'Scheduled for Tomorrow!'}
              {confirmedDestination === 'bench' && 'Saved to Bench!'}
            </h3>
            <p className="text-xs text-emerald-400 font-semibold tracking-wide uppercase">
              {modality.display_name || modality.name}
            </p>
          </div>
        ) : (
          <div className="p-6">
            <div className="mb-6 text-center">
              <h3 className="text-xl font-bold text-white mb-2">{modality.display_name || modality.name}</h3>
              <p className="text-sm text-gray-400">When would you like to start this protocol?</p>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => handleSchedule('today')}
                disabled={isSaving}
                className="w-full flex items-center gap-3 p-4 bg-levl-accent/10 border border-levl-accent/20 rounded-xl hover:bg-levl-accent hover:text-white text-levl-accent transition-colors disabled:opacity-50 text-left group cursor-pointer"
              >
                <Calendar size={20} className="shrink-0 text-levl-accent group-hover:text-white" />
                <div>
                  <div className="font-bold text-levl-accent group-hover:text-white">Start Today</div>
                  <div className="text-xs opacity-80 mt-0.5 group-hover:text-white/80">Add to your active timeline immediately.</div>
                </div>
              </button>

              <button 
                onClick={() => handleSchedule('tomorrow')}
                disabled={isSaving}
                className="w-full flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-white transition-colors disabled:opacity-50 text-left group cursor-pointer"
              >
                <CalendarPlus size={20} className="shrink-0 text-gray-400 group-hover:text-white" />
                <div>
                  <div className="font-bold">Start Tomorrow</div>
                  <div className="text-xs text-gray-400 mt-0.5 group-hover:text-gray-300">Need time to get it? Start fresh tomorrow.</div>
                </div>
              </button>

              <button 
                onClick={() => handleSchedule('bench')}
                disabled={isSaving}
                className="w-full flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-white transition-colors disabled:opacity-50 text-left group cursor-pointer"
              >
                <Bookmark size={20} className="shrink-0 text-gray-400 group-hover:text-white" />
                <div>
                  <div className="font-bold">Save to Bench</div>
                  <div className="text-xs text-gray-400 mt-0.5 group-hover:text-gray-300">Keep it saved for a later date.</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
