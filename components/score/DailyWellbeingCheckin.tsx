'use client'

import { useState } from 'react'

export default function DailyWellbeingCheckin({ onSave }: { onSave: (mood: number, energy: number, stress: number) => void }) {
  const [mood, setMood] = useState(5)
  const [energy, setEnergy] = useState(5)
  const [stress, setStress] = useState(5)
  const [isSaved, setIsSaved] = useState(false)

  const handleSave = () => {
    onSave(mood, energy, stress)
    setIsSaved(true)
  }

  if (isSaved) {
    return (
      <div className="glass-card p-4 rounded-xl flex items-center justify-between mb-6">
        <span className="text-levl-text-secondary">Daily check-in complete.</span>
        <span className="text-levl-accent">✓</span>
      </div>
    )
  }

  return (
    <div className="glass-card p-4 rounded-xl mb-6 space-y-4">
      <h3 className="font-semibold text-sm text-levl-text-secondary">Daily Well-being Check-in</h3>
      
      <div className="space-y-1">
        <div className="flex justify-between text-xs"><span className="text-white">Mood</span> <span className="text-levl-accent">{mood}/10</span></div>
        <input type="range" min="0" max="10" value={mood} onChange={(e) => setMood(parseInt(e.target.value))} className="w-full accent-levl-accent" />
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs"><span className="text-white">Energy</span> <span className="text-levl-accent">{energy}/10</span></div>
        <input type="range" min="0" max="10" value={energy} onChange={(e) => setEnergy(parseInt(e.target.value))} className="w-full accent-levl-accent" />
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs"><span className="text-white">Stress</span> <span className="text-red-400">{stress}/10</span></div>
        <input type="range" min="0" max="10" value={stress} onChange={(e) => setStress(parseInt(e.target.value))} className="w-full accent-red-400" />
      </div>

      <button onClick={handleSave} className="w-full bg-levl-accent/20 text-levl-accent border border-levl-accent rounded-lg py-2 text-sm font-medium hover:bg-levl-accent hover:text-white transition-colors">
        Log Check-in
      </button>
    </div>
  )
}
