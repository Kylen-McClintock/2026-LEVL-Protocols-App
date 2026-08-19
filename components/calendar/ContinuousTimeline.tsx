import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { DailyProtocolTask } from '@/lib/types'
import { generateWaveforms, BiologicalVector, WaveformEvent } from '@/lib/calendar/waveformMapper'
import { format, differenceInHours, startOfDay, addDays, eachDayOfInterval } from 'date-fns'

type Props = {
  tasks: DailyProtocolTask[]
  startDate: Date
  endDate: Date
  selectedVectors: BiologicalVector[]
}

const VECTOR_COLORS: Record<BiologicalVector, string> = {
  'mTOR_Growth': 'bg-orange-500',
  'AMPK_Clearance': 'bg-levl-accent',
  'Sympathetic_Load': 'bg-red-500',
  'Parasympathetic_Recovery': 'bg-blue-500',
  'Senolytic_Clearance': 'bg-emerald-500'
}

export default function ContinuousTimeline({ tasks, startDate, endDate, selectedVectors }: Props) {
  const router = useRouter()
  const days = eachDayOfInterval({ start: startDate, end: endDate })
  const totalHours = days.length * 24

  const waveforms = useMemo(() => {
    let waves = generateWaveforms(tasks)
    if (selectedVectors.length > 0) {
      waves = waves.filter(w => selectedVectors.includes(w.vector))
    }
    return waves
  }, [tasks, selectedVectors])

  const getPositionStyle = (event: WaveformEvent) => {
    const hoursFromStart = differenceInHours(event.startTime, startDate)
    const durationHours = differenceInHours(event.endTime, event.startTime)
    const peakHours = differenceInHours(event.peakTime, event.startTime)
    
    // Convert to percentages relative to totalHours
    const leftPercent = (hoursFromStart / totalHours) * 100
    const widthPercent = (durationHours / totalHours) * 100
    const peakPercentOfWidth = (peakHours / durationHours) * 100

    return {
      left: `${leftPercent}%`,
      width: `${widthPercent}%`,
      // CSS gradient to simulate fade in to peak, then fade out
      background: `linear-gradient(90deg, 
        rgba(0,0,0,0) 0%, 
        var(--tw-gradient-from) ${peakPercentOfWidth}%, 
        rgba(0,0,0,0) 100%)`
    }
  }

  return (
    <div className="relative w-full overflow-x-auto pb-8 pt-4">
      <div className="min-w-[1200px] relative h-[400px]">
        {/* Background Grid - Days */}
        <div className="absolute inset-0 flex">
          {days.map((day, i) => (
            <div key={day.toISOString()} className="flex-1 border-r border-white/5 relative">
              <div 
                onClick={() => router.push(`/today?date=${format(day, 'yyyy-MM-dd')}`)}
                className="absolute top-0 left-2 text-[10px] text-gray-500 font-bold uppercase tracking-wider cursor-pointer hover:text-white transition-colors z-50 p-1 -ml-1 rounded hover:bg-white/10"
              >
                {format(day, 'EEE do')}
              </div>
              {/* Midday line */}
              <div className="absolute left-1/2 top-0 bottom-0 border-r border-white/5 border-dashed"></div>
            </div>
          ))}
        </div>

        {/* Tracks/Lanes for Vectors */}
        <div className="absolute inset-0 top-8 flex flex-col gap-4">
          {(['mTOR_Growth', 'AMPK_Clearance', 'Sympathetic_Load', 'Parasympathetic_Recovery', 'Senolytic_Clearance'] as BiologicalVector[]).map(vector => {
            if (selectedVectors.length > 0 && !selectedVectors.includes(vector)) return null
            
            const vectorEvents = waveforms.filter(w => w.vector === vector)
            if (vectorEvents.length === 0 && selectedVectors.length === 0) return null

            const tailwindColorClass = VECTOR_COLORS[vector] || 'bg-gray-500'

            return (
              <div key={vector} className="relative h-16 border-b border-white/5 group">
                <div className="absolute -left-4 top-2 text-[9px] text-gray-500 uppercase font-bold tracking-widest -rotate-90 origin-top-right w-16 text-right opacity-50 group-hover:opacity-100 transition-opacity">
                  {vector.replace('_', ' ')}
                </div>
                
                {vectorEvents.map((event, i) => {
                  const style = getPositionStyle(event)
                  
                  // Extract base color from tailwind class for custom property if needed, 
                  // but we'll use a trick: we'll set the gradient via style but use Tailwind's `from-{color}` to provide the color variable.
                  // Since we can't dynamically build tailwind classes easily, we'll map them explicitly.
                  let colorVar = 'rgba(255,255,255,0.5)'
                  if (event.color.includes('red')) colorVar = 'rgba(239, 68, 68, 0.8)'
                  else if (event.color.includes('orange')) colorVar = 'rgba(249, 115, 22, 0.8)'
                  else if (event.color.includes('blue')) colorVar = 'rgba(59, 130, 246, 0.8)'
                  else if (event.color.includes('levl-accent')) colorVar = 'rgba(109, 40, 217, 0.8)'
                  else if (event.color.includes('emerald')) colorVar = 'rgba(16, 185, 129, 0.8)'

                  return (
                    <div 
                      key={event.taskId + i}
                      className="absolute top-2 bottom-2 rounded-full overflow-visible group/wave cursor-pointer"
                      style={{
                        ...style,
                        background: `linear-gradient(90deg, rgba(0,0,0,0) 0%, ${colorVar} ${parseFloat(style.background.split(' ')[4]) || 50}%, rgba(0,0,0,0) 100%)`
                      }}
                    >
                      {/* Peak Marker */}
                      <div className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" style={{ left: `${parseFloat(style.background.split(' ')[4]) || 50}%` }}></div>
                      
                      {/* Tooltip */}
                      <div className="absolute hidden group-hover/wave:block bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black border border-white/10 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50">
                        <span className="font-bold">{event.modalityName}</span>
                        <div className="text-gray-400">Peak: {format(event.peakTime, 'h:mm a')}</div>
                        <div className="text-gray-400">Tail: {differenceInHours(event.endTime, event.startTime)}h</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
