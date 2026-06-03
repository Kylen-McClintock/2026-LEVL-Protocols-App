'use client'

import { useEffect, useState } from 'react'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { getModalities, getOrCreateUserProfile, addToBench } from '@/lib/data'
import { Modality, UserProfile } from '@/lib/types'
import { sortModalitiesByNBA } from '@/lib/ranking/nextBestAction'
import { Compass, BookmarkPlus } from 'lucide-react'

export default function ExplorePage() {
  const [modalities, setModalities] = useState<Modality[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const localUserId = getLocalUserId()
      const profile = await getOrCreateUserProfile(localUserId)
      const allMods = await getModalities()
      
      // Sort by Next Best Action heuristically
      const ranked = sortModalitiesByNBA(allMods, profile)
      setModalities(ranked)
      setLoading(false)
    }
    load()
  }, [])

  const handleAddToBench = async (modalityId: string) => {
    const localUserId = getLocalUserId()
    await addToBench(localUserId, modalityId)
    alert('Added to bench!')
  }

  if (loading) return <div className="flex h-screen items-center justify-center animate-pulse text-levl-text-secondary">Loading global library...</div>

  return (
    <div className="p-4 max-w-md mx-auto pt-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Compass size={24} className="text-levl-accent" /> Explore</h1>
        <p className="text-levl-text-secondary text-sm">Next best actions for you.</p>
      </header>

      <div className="space-y-4">
        {modalities.map(mod => (
          <div key={mod.id} className="glass-card p-4 rounded-xl flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg">{mod.display_name || mod.name}</h3>
                <p className="text-xs text-levl-text-secondary uppercase mt-1">{mod.category}</p>
              </div>
              <button 
                onClick={() => handleAddToBench(mod.id)}
                className="text-levl-text-secondary hover:text-white bg-white/5 p-2 rounded-full"
                title="Add to Bench"
              >
                <BookmarkPlus size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-300">{mod.brief_description}</p>
            <div className="flex justify-between items-center mt-2 border-t border-white/5 pt-2">
              <span className="text-xs text-levl-text-secondary">Longevity Benefit: <strong className="text-levl-accent">{mod.overall_longevity_benefit}</strong></span>
              <span className="text-[10px] uppercase bg-white/10 px-2 py-1 rounded text-white">{mod.cost_tier} • {mod.effort_level}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
