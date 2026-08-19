'use client'

import { DailySession } from '@/lib/types'

type FollowUpTrackerCardProps = {
  session: DailySession
  onTrack: (sessionId: string) => void
}

export default function FollowUpTrackerCard({ session, onTrack }: FollowUpTrackerCardProps) {
  const modality = session.modality
  if (!modality) return null

  return (
    <div className="glass-card p-4 rounded-xl border-l-4 border-l-levl-accent mb-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-sm">Follow-up: {modality.display_name}</h3>
          <p className="text-xs text-levl-text-secondary mt-1">Log how you feel today</p>
        </div>
        <button 
          onClick={() => onTrack(session.id)}
          className="bg-levl-accent/20 text-levl-accent border border-levl-accent rounded-lg px-4 py-2 text-xs font-medium hover:bg-levl-accent hover:text-white transition-colors"
        >
          Track
        </button>
      </div>
    </div>
  )
}
