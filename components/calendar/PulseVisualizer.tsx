import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DailyProtocolTask } from '@/lib/types'
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isSameMonth, startOfWeek, endOfWeek } from 'date-fns'
import { ChevronLeft, ChevronRight, Activity, Zap, Brain, Dumbbell } from 'lucide-react'
import ContinuousTimeline from './ContinuousTimeline'
import { BiologicalVector, generateWaveforms } from '@/lib/calendar/waveformMapper'

type Props = {
  tasks: DailyProtocolTask[]
  currentDate: Date
  onNextMonth: () => void
  onPrevMonth: () => void
}

export default function PulseVisualizer({ tasks, currentDate, onNextMonth, onPrevMonth }: Props) {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly')
  const [selectedVectors, setSelectedVectors] = useState<BiologicalVector[]>([])

  // Dates
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })

  const toggleVector = (vector: BiologicalVector) => {
    if (selectedVectors.includes(vector)) {
      setSelectedVectors(selectedVectors.filter(v => v !== vector))
    } else {
      setSelectedVectors([...selectedVectors, vector])
    }
  }

  const vectors: { id: BiologicalVector, label: string, color: string }[] = [
    { id: 'mTOR_Growth', label: 'Growth (mTOR)', color: 'border-orange-500/50 bg-orange-500/20 text-orange-400' },
    { id: 'AMPK_Clearance', label: 'Clearance (AMPK)', color: 'border-levl-accent/50 bg-levl-accent/20 text-levl-accent' },
    { id: 'Sympathetic_Load', label: 'CNS Load', color: 'border-red-500/50 bg-red-500/20 text-red-400' },
    { id: 'Parasympathetic_Recovery', label: 'Recovery', color: 'border-blue-500/50 bg-blue-500/20 text-blue-400' },
    { id: 'Senolytic_Clearance', label: 'Senolytic', color: 'border-emerald-500/50 bg-emerald-500/20 text-emerald-400' }
  ]

  // Monthly Heatmap rendering
  const renderMonthlyHeatmap = () => {
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate })
    const waveforms = generateWaveforms(tasks)
    
    return (
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="text-center text-[10px] font-bold text-levl-text-secondary uppercase tracking-widest">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map(day => {
            const isCurrentMonth = isSameMonth(day, currentDate)
            // Aggregate AUC for this day based on selected vectors
            const dayWaves = waveforms.filter(w => {
              if (selectedVectors.length > 0 && !selectedVectors.includes(w.vector)) return false
              // Simple overlap check: does the waveform overlap with this day?
              const dayStart = day.getTime()
              const dayEnd = dayStart + 24 * 60 * 60 * 1000
              return w.startTime.getTime() < dayEnd && w.endTime.getTime() > dayStart
            })

            let bgClass = 'bg-white/5 border-white/5'
            if (dayWaves.length > 0) {
              // Priority coloring based on the highest intensity
              const highest = dayWaves.sort((a, b) => b.intensity - a.intensity)[0]
              if (highest.vector === 'Senolytic_Clearance') bgClass = 'bg-emerald-500/20 border-emerald-500/30'
              else if (highest.vector === 'Sympathetic_Load') bgClass = 'bg-red-500/20 border-red-500/30'
              else if (highest.vector === 'mTOR_Growth') bgClass = 'bg-orange-500/20 border-orange-500/30'
              else if (highest.vector === 'AMPK_Clearance') bgClass = 'bg-levl-accent/20 border-levl-accent/30'
              else if (highest.vector === 'Parasympathetic_Recovery') bgClass = 'bg-blue-500/10 border-blue-500/20'
            }

            return (
              <div 
                key={day.toISOString()} 
                onClick={() => router.push(`/today?date=${format(day, 'yyyy-MM-dd')}`)}
                className={`h-16 border rounded-lg p-2 transition-all cursor-pointer hover:scale-105 hover:z-10 shadow-sm ${bgClass} ${!isCurrentMonth ? 'opacity-30' : 'opacity-100'}`}
              >
                <div className="text-xs font-bold text-gray-400 mb-1">{format(day, 'd')}</div>
                <div className="flex gap-1 flex-wrap">
                  {dayWaves.slice(0,3).map((w, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/50"></div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-xl border border-white/10 overflow-hidden">
      {/* Header Controls */}
      <div className="p-4 border-b border-white/5 bg-black/20 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button onClick={onPrevMonth} className="p-1 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-white">
              <ChevronLeft size={20} />
            </button>
            <span className="text-lg font-bold min-w-[140px] text-center">
              {viewMode === 'weekly' ? `Week of ${format(weekStart, 'MMM do')}` : format(currentDate, 'MMMM yyyy')}
            </span>
            <button onClick={onNextMonth} className="p-1 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-white">
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
            <button 
              onClick={() => setViewMode('weekly')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'weekly' ? 'bg-levl-surface-highlight text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Weekly Timeline
            </button>
            <button 
              onClick={() => setViewMode('monthly')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'monthly' ? 'bg-levl-surface-highlight text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Monthly Heatmap
            </button>
          </div>
        </div>

        {/* Vector Filters */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
          <span className="text-xs text-gray-500 font-bold uppercase tracking-wider self-center mr-2">Isolate Axis:</span>
          {vectors.map(v => (
            <button
              key={v.id}
              onClick={() => toggleVector(v.id)}
              className={`text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-full border transition-all ${
                selectedVectors.includes(v.id) 
                  ? v.color 
                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
              }`}
            >
              {v.label}
            </button>
          ))}
          {selectedVectors.length > 0 && (
            <button 
              onClick={() => setSelectedVectors([])}
              className="text-[10px] text-gray-500 hover:text-white ml-2 uppercase font-bold tracking-wider"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {viewMode === 'weekly' ? (
        <div className="p-4 md:p-6 overflow-x-auto">
          <ContinuousTimeline 
            tasks={tasks}
            startDate={weekStart}
            endDate={weekEnd}
            selectedVectors={selectedVectors}
          />
        </div>
      ) : (
        renderMonthlyHeatmap()
      )}
    </div>
  )
}
