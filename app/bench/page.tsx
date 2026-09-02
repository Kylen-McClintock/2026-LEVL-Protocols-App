'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { getBenchItems, getBenchProtocols, createDailyTask, addProtocolToToday, removeFromBench, getOrCreateUserProfile, getDraftModalities, getDraftProtocols, getProtocols, getDailyProtocolTasks } from '@/lib/data'
import { UserBenchItem, UserProfile, Modality, Protocol } from '@/lib/types'
import { Bookmark, Plus, Sparkles, HelpCircle } from 'lucide-react'
import BenchCard from '@/components/cards/BenchCard'
import ProtocolCard from '@/components/cards/ProtocolCard'
import DraftCard from '@/components/cards/DraftCard'
import DraftEditorModal from '@/components/modals/DraftEditorModal'
import { CategoryPills } from '@/components/ui/CategoryPills'
import { getMacroCategory, MACRO_CATEGORIES, getColorForProtocol } from '@/lib/utils/categories'
import { calculateNextBestAction } from '@/lib/ranking/nextBestAction'
import { format } from 'date-fns'

export default function BenchPage() {
  const { localUserId: authUserId, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [items, setItems] = useState<UserBenchItem[]>([])
  const [benchedProtocols, setBenchedProtocols] = useState<any[]>([])
  const [draftModalities, setDraftModalities] = useState<Modality[]>([])
  const [draftProtocols, setDraftProtocols] = useState<Protocol[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'modalities' | 'protocols' | 'drafts'>('modalities')
  const [filterCategory, setFilterCategory] = useState('all')

  const [editorOpen, setEditorOpen] = useState(false)
  const [editorItem, setEditorItem] = useState<Modality | Protocol | null>(null)
  const [editorType, setEditorType] = useState<'modality' | 'protocol'>('modality')

  const load = async () => {
    const localUserId = authUserId || (typeof window !== 'undefined' ? localStorage.getItem('levl_local_user_id') : '') || getLocalUserId()
    const todayStr = format(new Date(), 'yyyy-MM-dd')

    const [modData, protoData, profileData, draftModData, draftProtoData, masterProtocols, todayTasks] = await Promise.all([
      getBenchItems(localUserId),
      getBenchProtocols(localUserId),
      getOrCreateUserProfile(localUserId),
      getDraftModalities(localUserId),
      getDraftProtocols(localUserId),
      getProtocols(),
      getDailyProtocolTasks(localUserId, todayStr)
    ])

    // Collect all protocol names active on Today's view
    const todayProtocolNames = new Set<string>()
    todayTasks.forEach(task => {
      const pName = task.protocol_step?.protocol?.name || (task as any).user_protocol_instance?.protocol?.name
      if (pName) todayProtocolNames.add(pName)
    })

    // Also include benched protocol names
    protoData.forEach((bp: any) => {
      if (bp.protocol?.name) todayProtocolNames.add(bp.protocol.name)
    })

    // Map modality ID to all master protocol names it belongs to
    const modalityToProtocolsMap = new Map<string, Set<string>>()
    masterProtocols.forEach(p => {
      if (p.protocol_steps) {
        p.protocol_steps.forEach(step => {
          const mId = step.modality_id || step.modality?.id
          if (mId) {
            const set = modalityToProtocolsMap.get(mId) || new Set<string>()
            set.add(p.name)
            modalityToProtocolsMap.set(mId, set)
          }
        })
      }
    })

    // Sort bench modalities by Next Best Action and compute protocol tags
    modData.forEach(item => {
      if (item.modality) {
        item.modality.nba_result = calculateNextBestAction(item.modality, profileData)
      }

      // Compute protocol tags for modalities that belong to a protocol active on Today's view (or enrolled)
      const associatedProtos = modalityToProtocolsMap.get(item.modality_id) || new Set<string>()
      const matchingTodayProtos = Array.from(associatedProtos).filter(pName => todayProtocolNames.has(pName))

      // If no today protocol match, fall back to any associated master protocol
      const finalProtos = matchingTodayProtos.length > 0 ? matchingTodayProtos : Array.from(associatedProtos)

      item.protocolTags = finalProtos.map(pName => ({
        protocol_name: pName,
        color_hex: getColorForProtocol(pName)
      }))
    })
    modData.sort((a, b) => (b.modality?.nba_result?.score || 0) - (a.modality?.nba_result?.score || 0))
    
    setItems(modData)
    setBenchedProtocols(protoData)
    setProfile(profileData)
    setDraftModalities(draftModData)
    setDraftProtocols(draftProtoData)
    setLoading(false)
  }

  useEffect(() => {
    if (authLoading) return
    load()

    const handleAuthChange = () => {
      load()
    }
    window.addEventListener('levl_auth_user_changed', handleAuthChange)
    return () => {
      window.removeEventListener('levl_auth_user_changed', handleAuthChange)
    }
  }, [authLoading, authUserId])

  const handleAddToToday = async (modalityId: string) => {
    const localUserId = authUserId || getLocalUserId()
    const dateStr = new Date().toISOString().split('T')[0]
    await createDailyTask(localUserId, dateStr, modalityId)
  }

  const handleRemove = async (modalityId: string) => {
    const localUserId = authUserId || getLocalUserId()
    await removeFromBench(localUserId, modalityId)
  }

  if (loading) return <div className="flex h-screen items-center justify-center animate-pulse text-levl-text-secondary">Loading bench...</div>

  const filteredItems = items.filter(item => {
    if (filterCategory !== 'all' && getMacroCategory(item.modality?.category) !== filterCategory) return false
    return true
  })

  const topBenchItem = filteredItems.length > 0 ? filteredItems[0] : null
  const remainingBenchItems = filteredItems.length > 1 ? filteredItems.slice(1) : []

  return (
    <div className="p-4 max-w-xl lg:max-w-5xl xl:max-w-6xl mx-auto pt-8">
      <header className="mb-6">
        <div className="flex justify-between items-center mb-4 gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Bookmark size={24} className="text-levl-accent" /> Bench</h1>
            <p className="text-levl-text-secondary text-sm">Your saved modalities and protocols.</p>
          </div>

          <Link
            href="/guide#bench"
            className="px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-600/50 text-purple-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm shrink-0"
            title="View Bench & Backlog Guide"
          >
            <HelpCircle size={13} className="text-purple-400" /> Guide
          </Link>
        </div>

        <div className="flex p-1 bg-black/40 rounded-xl border border-white/5 overflow-x-auto scrollbar-hide">
          <button 
            onClick={() => setActiveTab('modalities')}
            className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${activeTab === 'modalities' ? 'bg-levl-accent/20 text-levl-accent border border-levl-accent/30 shadow-sm shadow-levl-accent/10' : 'text-gray-400 hover:text-white'}`}
          >
            Modalities
          </button>
          <button 
            onClick={() => setActiveTab('protocols')}
            className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${activeTab === 'protocols' ? 'bg-levl-accent/20 text-levl-accent border border-levl-accent/30 shadow-sm shadow-levl-accent/10' : 'text-gray-400 hover:text-white'}`}
          >
            My Protocols
          </button>
          <button 
            onClick={() => setActiveTab('drafts')}
            className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${activeTab === 'drafts' ? 'bg-levl-accent/20 text-levl-accent border border-levl-accent/30 shadow-sm shadow-levl-accent/10' : 'text-gray-400 hover:text-white'}`}
          >
            Custom & Drafts
          </button>
        </div>
      </header>

      {activeTab === 'modalities' && (
        <>
          <div className="mb-4">
            <CategoryPills 
              categories={[...MACRO_CATEGORIES]} 
              selectedCategory={filterCategory} 
              onSelect={setFilterCategory} 
            />
          </div>
          
          {topBenchItem && (
            <div className="mb-8">
              <details className="group glass-card rounded-xl border border-white/5 overflow-hidden">
                <summary className="p-4 cursor-pointer list-none flex items-center justify-between">
                  <div className="flex flex-col">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Sparkles size={18} className="text-levl-accent" />
                      Next Best Action
                    </h2>
                    <p className="text-xs text-levl-text-secondary mt-1 hidden group-open:block">
                      The absolute highest impact item on your bench right now.
                    </p>
                  </div>
                  <div className="text-white/50 group-open:rotate-180 transition-transform">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </summary>
                
                <div className="p-4 pt-0 border-t border-white/5 mt-4">
                  <BenchCard 
                    item={topBenchItem} 
                    userProfile={profile}
                    protocolTags={topBenchItem.protocolTags}
                    onAddToToday={handleAddToToday} 
                    onRemove={handleRemove} 
                  />
                </div>
              </details>
            </div>
          )}

          {remainingBenchItems.length === 0 && !topBenchItem ? (
            <div className="glass-card p-8 rounded-xl text-center space-y-4">
              <p className="text-levl-text-secondary">No benched modalities found for this category.</p>
              <a href="/explore" className="inline-block bg-levl-accent text-white px-4 py-2 rounded-lg font-medium">Explore Modalities</a>
            </div>
          ) : (
            <div className="space-y-3">
              {remainingBenchItems.map(item => (
                <BenchCard 
                  key={item.id} 
                  item={item} 
                  userProfile={profile}
                  protocolTags={item.protocolTags}
                  onAddToToday={handleAddToToday} 
                  onRemove={handleRemove} 
                />
              ))}
            </div>
          )}
        </>
      )}
      
      {activeTab === 'protocols' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
          {benchedProtocols.length === 0 ? (
            <div className="glass-card p-8 rounded-xl text-center space-y-4">
              <p className="text-levl-text-secondary">You haven't saved any protocols yet.</p>
              <a href="/explore" className="inline-block bg-levl-accent text-white px-4 py-2 rounded-lg font-medium">Explore Protocols</a>
            </div>
          ) : (
            benchedProtocols.map(bp => (
              <ProtocolCard 
                key={bp.id}
                protocol={bp.protocol}
                onAddToBench={async () => {}}
                onAddToToday={async (protocolId) => {
                  await addProtocolToToday(getLocalUserId(), new Date().toISOString().split('T')[0], protocolId)
                }}
              />
            ))
          )}
        </div>
      )}

      {activeTab === 'drafts' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
          <div className="flex justify-between items-center bg-levl-surface border border-levl-border p-4 rounded-xl">
            <div>
              <h2 className="text-white font-medium mb-1">Create Custom</h2>
              <p className="text-xs text-levl-text-secondary">Draft your own modalities or protocols from scratch.</p>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => { setEditorItem(null); setEditorType('modality'); setEditorOpen(true); }}
                className="flex items-center text-xs bg-levl-surface-highlight hover:bg-levl-border border border-levl-border text-white px-3 py-2 rounded-lg transition-colors"
              >
                <Plus size={14} className="mr-1" /> Modality
              </button>
              <button 
                onClick={() => { setEditorItem(null); setEditorType('protocol'); setEditorOpen(true); }}
                className="flex items-center text-xs bg-levl-surface-highlight hover:bg-levl-border border border-levl-border text-white px-3 py-2 rounded-lg transition-colors"
              >
                <Plus size={14} className="mr-1" /> Protocol
              </button>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-levl-text-secondary uppercase tracking-wider mb-3">Custom Modalities</h2>
            {draftModalities.length === 0 ? (
              <p className="text-sm text-levl-text-secondary italic">No custom modalities yet.</p>
            ) : (
              <div className="space-y-3">
                {draftModalities.map(m => (
                  <DraftCard 
                    key={m.id} 
                    item={m} 
                    type="modality" 
                    onEdit={() => { setEditorItem(m); setEditorType('modality'); setEditorOpen(true); }} 
                    onPublishStateChange={load}
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-sm font-semibold text-levl-text-secondary uppercase tracking-wider mb-3 mt-8">Custom Protocols</h2>
            {draftProtocols.length === 0 ? (
              <p className="text-sm text-levl-text-secondary italic">No custom protocols yet.</p>
            ) : (
              <div className="space-y-3">
                {draftProtocols.map(p => (
                  <DraftCard 
                    key={p.id} 
                    item={p} 
                    type="protocol" 
                    onEdit={() => { setEditorItem(p); setEditorType('protocol'); setEditorOpen(true); }} 
                    onPublishStateChange={load}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Unified Editor Modal */}
      <DraftEditorModal 
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        item={editorItem}
        type={editorType}
        localUserId={getLocalUserId()}
        onSaveSuccess={load}
      />
    </div>
  )
}
