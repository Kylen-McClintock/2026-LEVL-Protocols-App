import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { DailyProtocolTask } from '@/lib/types'
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isSameMonth, startOfWeek, endOfWeek } from 'date-fns'
import { generateWaveforms } from '@/lib/calendar/waveformMapper'

type Props = {
  tasks: DailyProtocolTask[]
  currentDate: Date
}

export default function MonthHeatmapView({ tasks, currentDate }: Props) {
  const router = useRouter()
  
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate })
  
  const waveforms = useMemo(() => generateWaveforms(tasks), [tasks])

  return (
    <div className="glass-card rounded-xl border border-white/10 p-6 bg-black/20">
      <div className="flex items-center gap-2 mb-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">30-Day Pulse View</h3>
        <span className="w-4 h-4 rounded-full border border-gray-500 flex items-center justify-center text-[8px] text-gray-400">i</span>
      </div>

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
          
          const dayStart = day.getTime()
          const dayEnd = dayStart + 24 * 60 * 60 * 1000
          
          const dayWaves = waveforms.filter(w => w.startTime.getTime() < dayEnd && w.endTime.getTime() > dayStart)

          let bgClass = 'bg-white/5 border-white/5'
          if (dayWaves.length > 0) {
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
              className={`h-24 border rounded-lg p-2 transition-all cursor-pointer hover:scale-105 hover:z-10 shadow-sm flex flex-col justify-between ${bgClass} ${!isCurrentMonth ? 'opacity-30' : 'opacity-100'}`}
            >
              <div className="text-xs font-bold text-gray-400">{format(day, 'd')}</div>
              <div className="flex gap-1 flex-wrap mt-auto">
                {dayWaves.slice(0, 4).map((w, i) => {
                  let dotColor = 'bg-gray-400'
                  if (w.vector === 'mTOR_Growth') dotColor = 'bg-orange-400'
                  if (w.vector === 'AMPK_Clearance') dotColor = 'bg-levl-accent'
                  if (w.vector === 'Senolytic_Clearance') dotColor = 'bg-emerald-400'
                  if (w.vector === 'Sympathetic_Load') dotColor = 'bg-red-400'
                  if (w.vector === 'Parasympathetic_Recovery') dotColor = 'bg-blue-400'

                  return <div key={i} className={`w-2 h-2 rounded-full ${dotColor}`}></div>
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
