'use client'

import { useEffect, useState } from 'react'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { getBenchItems } from '@/lib/data'
import { UserBenchItem } from '@/lib/types'
import { Bookmark, Plus } from 'lucide-react'

export default function BenchPage() {
  const [items, setItems] = useState<UserBenchItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const localUserId = getLocalUserId()
      const data = await getBenchItems(localUserId)
      setItems(data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="flex h-screen items-center justify-center animate-pulse text-levl-text-secondary">Loading bench...</div>

  return (
    <div className="p-4 max-w-md mx-auto pt-8">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Bookmark size={24} className="text-levl-accent" /> Bench</h1>
          <p className="text-levl-text-secondary text-sm">Your saved modalities to try later.</p>
        </div>
      </header>

      {items.length === 0 ? (
        <div className="glass-card p-8 rounded-xl text-center space-y-4">
          <p className="text-levl-text-secondary">Your bench is empty.</p>
          <a href="/explore" className="inline-block bg-levl-accent text-white px-4 py-2 rounded-lg font-medium">Explore Modalities</a>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="glass-card p-4 rounded-xl flex justify-between items-center">
              <div>
                <h3 className="font-bold">{item.modality?.display_name || item.modality?.name}</h3>
                <p className="text-xs text-levl-text-secondary">{item.modality?.category}</p>
              </div>
              <button className="text-levl-accent hover:text-white transition-colors bg-levl-accent/10 p-2 rounded-full">
                <Plus size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
