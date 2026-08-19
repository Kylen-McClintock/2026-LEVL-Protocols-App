import React, { useMemo } from 'react'
import { DailyProtocolTask } from '@/lib/types'
import { BiologicalVector, generateWaveforms } from '@/lib/calendar/waveformMapper'
import { format, differenceInHours, eachDayOfInterval } from 'date-fns'

type Props = {
  tasks: DailyProtocolTask[]
  startDate: Date
  endDate: Date
}

const VECTOR_GRADIENTS: Record<BiologicalVector, string> = {
  'mTOR_Growth': 'bg-gradient-to-r from-orange-500 to-transparent', // Spikes then fades
  'AMPK_Clearance': 'bg-gradient-to-r from-transparent to-levl-accent', // Builds up during fast, ends abruptly
  'Sympathetic_Load': 'bg-gradient-to-r from-red-500 to-transparent', // Spikes then fades
  'Parasympathetic_Recovery': 'bg-gradient-to-r from-blue-500/50 via-blue-500 to-transparent', // Sustained
  'Senolytic_Clearance': 'bg-emerald-500' // Pulse
}

const VECTORS: { id: BiologicalVector, label: string }[] = [
  { id: 'mTOR_Growth', label: 'Growth Stimulus' },
  { id: 'Parasympathetic_Recovery', label: 'Recovery Support' },
  { id: 'AMPK_Clearance', label: 'Clearance Windows' },
  { id: 'Sympathetic_Load', label: 'CNS Load' },
  { id: 'Senolytic_Clearance', label: 'Senolytic Pulse' }
]

export default function CadenceTracks({ tasks, startDate, endDate }: Props) {
  const days = eachDayOfInterval({ start: startDate, end: endDate })
  const totalHours = days.length * 24

  const waveforms = useMemo(() => generateWaveforms(tasks), [tasks])

  return (
    <div className="p-4 border-t border-white/10">
      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
        Cadence Tracks
        <span className="w-4 h-4 rounded-full border border-gray-500 flex items-center justify-center text-[8px]">i</span>
      </div>

      <div className="space-y-4">
        {VECTORS.map(v => {
          const vectorEvents = waveforms.filter(w => w.vector === v.id)
          const isPulse = v.id === 'Senolytic_Clearance'

          return (
            <div key={v.id} className="grid grid-cols-[140px_1fr] items-center gap-4 group">
              <div className="text-xs font-bold text-gray-400 group-hover:text-white transition-colors">
                {v.label}
              </div>
              
              <div className="relative h-6 bg-black/40 rounded border border-white/5 overflow-hidden">
                {/* Vertical markers for days */}
                <div className="absolute inset-0 flex">
                  {days.map(day => (
                    <div key={day.toISOString()} className="flex-1 border-r border-white/5"></div>
                  ))}
                </div>

                {/* Events */}
                {vectorEvents.map((event, i) => {
                  const hoursFromStart = differenceInHours(event.startTime, startDate)
                  const durationHours = differenceInHours(event.endTime, event.startTime)
                  
                  const leftPercent = (hoursFromStart / totalHours) * 100
                  const widthPercent = (durationHours / totalHours) * 100

                  if (isPulse) {
                    return (
                      <div 
                        key={i}
                        className="absolute top-1/2 -translate-y-1/2"
                        style={{ left: `${leftPercent}%` }}
                      >
                        <div className={`w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_15px_#10b981]`}></div>
                        {/* Cooldown Halo */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-emerald-500/30 bg-emerald-500/10"></div>
                      </div>
                    )
                  }

                  // Scientific representation with gradient build/fade
                  return (
                    <div 
                      key={i}
                      className="absolute top-2 bottom-2 rounded-full overflow-hidden"
                      style={{
                        left: `${Math.max(0, leftPercent)}%`,
                        width: `${Math.min(100, widthPercent)}%`,
                      }}
                    >
                      <div className={`w-full h-full ${VECTOR_GRADIENTS[v.id]} opacity-80`}></div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
