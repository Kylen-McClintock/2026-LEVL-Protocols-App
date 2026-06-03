'use client'

import { Calendar } from 'lucide-react'

export default function WeeklyPage() {
  // MVP: Minimal representation of weekly view
  return (
    <div className="p-4 max-w-md mx-auto pt-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Calendar size={24} className="text-levl-accent" /> Weekly</h1>
        <p className="text-levl-text-secondary text-sm">Your week at a glance.</p>
      </header>

      <div className="flex overflow-x-auto gap-2 pb-4 snap-x">
        {/* Placeholder days */}
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
          <div key={day} className={`flex-shrink-0 w-24 p-3 rounded-xl border snap-center flex flex-col items-center gap-2 ${i === 2 ? 'bg-levl-accent/20 border-levl-accent' : 'glass-card border-white/5'}`}>
            <span className="text-xs text-levl-text-secondary">{day}</span>
            <div className="w-8 h-8 rounded-full border-2 border-white/10 flex items-center justify-center text-xs font-bold">
              {10 + i}
            </div>
            <div className="flex gap-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-levl-accent"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-levl-accent"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 glass-card p-6 rounded-xl text-center text-sm text-levl-text-secondary">
        Select a day above to view its stack. (MVP Placeholder)
      </div>
    </div>
  )
}
