'use client'

import { useEffect, useState, useMemo, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { getBenchItems, getBenchProtocols, createDailyTask, addProtocolToToday, removeFromBench, getOrCreateUserProfile, getDraftModalities, getDraftProtocols, getProtocols, getDailyProtocolTasks, addToBench } from '@/lib/data'
import { UserBenchItem, UserProfile, Modality, Protocol } from '@/lib/types'
import { Bookmark, Plus, Sparkles, HelpCircle, Clock, Zap, Calendar, CheckCircle2, X } from 'lucide-react'
import BenchCard from '@/components/cards/BenchCard'
import ProtocolCard from '@/components/cards/ProtocolCard'
import DraftCard from '@/components/cards/DraftCard'
import DraftEditorModal from '@/components/modals/DraftEditorModal'
import CreateCustomModalityModal from '@/components/modals/CreateCustomModalityModal'
import AdHocLoggerModal from '@/components/modals/AdHocLoggerModal'
import { CategoryPills } from '@/components/ui/CategoryPills'
import { getMacroCategory, MACRO_CATEGORIES, getColorForProtocol } from '@/lib/utils/categories'
import { calculateNextBestAction } from '@/lib/ranking/nextBestAction'
import { format } from 'date-fns'

interface PendingImportProtocol {
  title: string
  items: Array<{
    modalityId: string
    displayName: string
    slot: string
    dose: string
  }>
}

function BenchPageContent() {
  const searchParams = useSearchParams()
  const { localUserId: authUserId, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [items, setItems] = useState<UserBenchItem[]>([])
  const [benchedProtocols, setBenchedProtocols] = useState<any[]>([])
  const [draftModalities, setDraftModalities] = useState<Modality[]>([])
  const [draftProtocols, setDraftProtocols] = useState<Protocol[]>([])
  const [isCreateModalityModalOpen, setIsCreateModalityModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'modalities' | 'protocols' | 'drafts'>('modalities')
  const [filterCategory, setFilterCategory] = useState('all')
  const [cadenceFilter, setCadenceFilter] = useState<'all' | 'as_needed' | 'scheduled'>('all')
  const [sortMode, setSortMode] = useState<'nba' | 'recent'>('nba')
  const [isAdHocModalOpen, setIsAdHocModalOpen] = useState(false)

  const [editorOpen, setEditorOpen] = useState(false)
  const [editorItem, setEditorItem] = useState<Modality | Protocol | null>(null)
  const [editorType, setEditorType] = useState<'modality' | 'protocol'>('modality')

  const [pendingProtocolImport, setPendingProtocolImport] = useState<PendingImportProtocol | null>(null)
  const [importFeedback, setImportFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const hasProcessedParamsRef = useRef(false)

  const load = async () => {
    window.dispatchEvent(new CustomEvent('levl_sync_start'))
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

    // Filter to valid modalities and strictly deduplicate by modality_id
    const seenModIds = new Set<string>()
    const validModData: UserBenchItem[] = []

    modData.forEach(item => {
      if (!item.modality || !item.modality_id) return
      if (seenModIds.has(item.modality_id)) return
      seenModIds.add(item.modality_id)

      item.modality.nba_result = calculateNextBestAction(item.modality, profileData)

      // Compute protocol tags for modalities that belong to a protocol active on Today's view (or enrolled)
      const associatedProtos = modalityToProtocolsMap.get(item.modality_id) || new Set<string>()
      const matchingTodayProtos = Array.from(associatedProtos).filter(pName => todayProtocolNames.has(pName))

      // If no today protocol match, fall back to any associated master protocol
      const finalProtos = matchingTodayProtos.length > 0 ? matchingTodayProtos : Array.from(associatedProtos)

      item.protocolTags = finalProtos.map(pName => ({
        protocol_name: pName,
        color_hex: getColorForProtocol(pName)
      }))

      validModData.push(item)
    })
    validModData.sort((a, b) => (b.modality?.nba_result?.score || 0) - (a.modality?.nba_result?.score || 0))
    
    setItems(validModData)
    try {
      localStorage.setItem('levl_cached_bench_items', JSON.stringify(validModData))
    } catch (e) {}
    setBenchedProtocols(protoData)
    setProfile(profileData)
    setDraftModalities(draftModData)
    setDraftProtocols(draftProtoData)
    setLoading(false)
    window.dispatchEvent(new CustomEvent('levl_sync_end'))
  }

  useEffect(() => {
    // SWR instant hydration: paint cached bench items immediately if available
    try {
      const cached = localStorage.getItem('levl_cached_bench_items')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed)
          setLoading(false)
        }
      }
    } catch (e) {}

    load()

    // Process inbound URL imports from LongevityReviews
    if (!hasProcessedParamsRef.current) {
      const addModalityParam = searchParams.get('addModality')
      const nameParam = searchParams.get('name')
      const importParam = searchParams.get('import')

      if (addModalityParam) {
        hasProcessedParamsRef.current = true
        if (typeof window !== 'undefined') {
          window.history.replaceState({}, '', window.location.pathname)
        }
        const localUserId = authUserId || (typeof window !== 'undefined' ? localStorage.getItem('levl_local_user_id') : '') || getLocalUserId()
        const cleanName = nameParam || addModalityParam.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

        addToBench(localUserId, addModalityParam, undefined, { name: cleanName, display_name: cleanName })
          .then(() => {
            setImportFeedback({
              type: 'success',
              message: `Added ${cleanName} to your Bench from LongevityReviews!`
            })
            load()
          })
          .catch(err => {
            console.error('Error importing modality to bench:', err)
          })
      } else if (importParam === 'custom_protocol') {
        hasProcessedParamsRef.current = true
        const titleParam = searchParams.get('title') || 'Custom Protocol'
        const modalitiesParam = searchParams.get('modalities') || ''
        const slotsParam = searchParams.get('slots') || ''
        const dosesParam = searchParams.get('doses') || ''

        if (typeof window !== 'undefined') {
          window.history.replaceState({}, '', window.location.pathname)
        }

        const rawMods = modalitiesParam.split(',').map(m => m.trim()).filter(Boolean)
        const rawSlots = slotsParam ? slotsParam.split(',').map(s => s.trim()) : []
        const rawDoses = dosesParam ? dosesParam.split('||').map(d => d.trim()) : []

        if (rawMods.length > 0) {
          const localUserId = authUserId || (typeof window !== 'undefined' ? localStorage.getItem('levl_local_user_id') : '') || getLocalUserId()

          ;(async () => {
            try {
              for (let idx = 0; idx < rawMods.length; idx++) {
                const modId = rawMods[idx]
                const cleanName = modId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                const slot = rawSlots[idx] || 'anytime'
                const dose = rawDoses[idx] || ''

                await addToBench(
                  localUserId,
                  modId,
                  undefined,
                  { name: cleanName, display_name: cleanName },
                  { customDose: dose, customTiming: slot }
                )
              }
              setImportFeedback({
                type: 'success',
                message: `Imported ${titleParam} from LongevityReviews!`
              })
              await load()
            } catch (err) {
              console.error('Error auto-importing custom protocol to bench:', err)
              setImportFeedback({
                type: 'error',
                message: `Failed to import ${titleParam}. Please try again.`
              })
            }
          })()
        }
      }
    }

    const handleRefresh = () => {
      load()
    }
    window.addEventListener('levl_auth_user_changed', handleRefresh)
    window.addEventListener('levl_bench_updated', handleRefresh)
    return () => {
      window.removeEventListener('levl_auth_user_changed', handleRefresh)
      window.removeEventListener('levl_bench_updated', handleRefresh)
    }
  }, [authUserId, searchParams])

  const handleImportProtocolToBench = async () => {
    if (!pendingProtocolImport) return
    setIsImporting(true)
    const localUserId = authUserId || (typeof window !== 'undefined' ? localStorage.getItem('levl_local_user_id') : '') || getLocalUserId()

    try {
      for (const item of pendingProtocolImport.items) {
        await addToBench(
          localUserId, 
          item.modalityId, 
          undefined, 
          { name: item.displayName, display_name: item.displayName },
          { customDose: item.dose, customTiming: item.slot }
        )
      }
      setImportFeedback({
        type: 'success',
        message: `Successfully added ${pendingProtocolImport.items.length} modalities from "${pendingProtocolImport.title}" to your Bench!`
      })
      setPendingProtocolImport(null)
      await load()
    } catch (err) {
      console.error('Error importing protocol to bench:', err)
      setImportFeedback({
        type: 'error',
        message: 'Could not complete import. Please try again.'
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleImportProtocolToToday = async () => {
    if (!pendingProtocolImport) return
    setIsImporting(true)
    const localUserId = authUserId || (typeof window !== 'undefined' ? localStorage.getItem('levl_local_user_id') : '') || getLocalUserId()
    const todayStr = format(new Date(), 'yyyy-MM-dd')

    try {
      for (const item of pendingProtocolImport.items) {
        await createDailyTask(localUserId, todayStr, item.modalityId, undefined, item.dose, item.slot)
      }
      setImportFeedback({
        type: 'success',
        message: `Successfully scheduled "${pendingProtocolImport.title}" (${pendingProtocolImport.items.length} items) into Today's routine!`
      })
      setPendingProtocolImport(null)
      await load()
    } catch (err) {
      console.error('Error importing protocol to today:', err)
      setImportFeedback({
        type: 'error',
        message: 'Could not complete import to today. Please try again.'
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleAddToToday = async (modalityId: string) => {
    const localUserId = authUserId || getLocalUserId()
    const dateStr = new Date().toISOString().split('T')[0]
    await createDailyTask(localUserId, dateStr, modalityId)
  }

  const handleRemove = async (modalityId: string) => {
    const localUserId = authUserId || getLocalUserId()
    await removeFromBench(localUserId, modalityId)
  }

  const asNeededCount = useMemo(() => {
    return items.filter(item => 
      item.schedule_config?.schedule_mode === 'as_needed' ||
      (item.custom_timing || '').toLowerCase().includes('as needed') ||
      (item.custom_timing || '').toLowerCase().includes('as-needed') ||
      (item.custom_timing || '').toLowerCase().includes('prn') ||
      (item.notes || '').toLowerCase().includes('as needed') ||
      (item.modality?.timing_summary || '').toLowerCase().includes('as needed')
    ).length
  }, [items])

  const scheduledCount = items.length - asNeededCount

  const filteredItems = useMemo(() => {
    return items
      .filter(item => {
        if (filterCategory !== 'all' && getMacroCategory(item.modality?.category) !== filterCategory) return false

        const isAsNeeded = 
          item.schedule_config?.schedule_mode === 'as_needed' ||
          (item.custom_timing || '').toLowerCase().includes('as needed') ||
          (item.custom_timing || '').toLowerCase().includes('as-needed') ||
          (item.custom_timing || '').toLowerCase().includes('prn') ||
          (item.notes || '').toLowerCase().includes('as needed') ||
          (item.modality?.timing_summary || '').toLowerCase().includes('as needed')

        if (cadenceFilter === 'as_needed' && !isAsNeeded) return false
        if (cadenceFilter === 'scheduled' && isAsNeeded) return false

        return true
      })
      .sort((a, b) => {
        if (sortMode === 'recent') {
          const timeA = new Date(a.added_at || (a as any).created_at || 0).getTime()
          const timeB = new Date(b.added_at || (b as any).created_at || 0).getTime()
          return timeB - timeA
        }
        return (b.modality?.nba_result?.score || 0) - (a.modality?.nba_result?.score || 0)
      })
  }, [items, filterCategory, cadenceFilter, sortMode])

  const isNbaMode = sortMode === 'nba'
  const topBenchItem = (isNbaMode && filteredItems.length > 0) ? filteredItems[0] : null
  const remainingBenchItems = isNbaMode ? (filteredItems.length > 1 ? filteredItems.slice(1) : []) : filteredItems

  if (loading) {
    return <div className="flex h-screen items-center justify-center animate-pulse text-levl-text-secondary">Loading bench...</div>
  }

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

      {/* LongevityReviews Inbound Import Feedback Banner */}
      {importFeedback && (
        <div className={`mb-5 p-3.5 rounded-xl border flex items-center justify-between gap-3 text-sm animate-in fade-in slide-in-from-top-2 duration-200 ${
          importFeedback.type === 'success' 
            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200 shadow-lg shadow-emerald-950/30' 
            : 'bg-red-950/60 border-red-500/40 text-red-200 shadow-lg shadow-red-950/30'
        }`}>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className={importFeedback.type === 'success' ? 'text-emerald-400 shrink-0' : 'text-red-400 shrink-0'} />
            <span className="font-medium">{importFeedback.message}</span>
          </div>
          <button 
            type="button"
            onClick={() => setImportFeedback(null)}
            className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {activeTab === 'modalities' && (
        <>
          {/* Single-Row Cadence Shelf Filter (Takes no more than one vertical row) */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 mb-3 whitespace-nowrap">
            <button
              type="button"
              onClick={() => setCadenceFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                cadenceFilter === 'all'
                  ? 'bg-levl-accent text-white shadow-sm'
                  : 'bg-black/40 text-gray-400 hover:text-white border border-white/5'
              }`}
            >
              All Modalities ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setCadenceFilter('as_needed')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                cadenceFilter === 'as_needed'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-md shadow-amber-500/20'
                  : 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/20'
              }`}
            >
              <Zap size={13} className={cadenceFilter === 'as_needed' ? 'text-slate-950 fill-slate-950' : 'text-amber-400'} />
              <span>As Needed ({asNeededCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setCadenceFilter('scheduled')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                cadenceFilter === 'scheduled'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-black/40 text-gray-400 hover:text-white border border-white/5'
              }`}
            >
              <Calendar size={13} />
              <span>Scheduled ({scheduledCount})</span>
            </button>

            <div className="h-4 w-px bg-white/10 mx-1 shrink-0" />

            <button
              type="button"
              onClick={() => setIsAdHocModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 hover:text-white transition-all cursor-pointer ml-auto shrink-0"
              title="Quickly log any occasional or as-needed modality"
            >
              <Plus size={13} className="stroke-[3]" />
              <span>+ Log As Needed</span>
            </button>
          </div>

          {/* Controls Bar: Category Filter & Sort Mode Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <CategoryPills 
                categories={[...MACRO_CATEGORIES]} 
                selectedCategory={filterCategory} 
                onSelect={setFilterCategory} 
              />
            </div>

            {/* Segmented Sort Toggle: Next Best Action vs Most Recent */}
            <div className="flex items-center self-start sm:self-auto bg-black/60 p-1 rounded-xl border border-white/10 shrink-0 shadow-sm">
              <button
                type="button"
                onClick={() => setSortMode('nba')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  sortMode === 'nba'
                    ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 text-white shadow-md shadow-purple-900/30'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Sort by Next Best Action algorithmic impact"
              >
                <Sparkles size={13} className={sortMode === 'nba' ? 'text-amber-300' : 'text-slate-400'} />
                <span>Next Best Action</span>
              </button>
              <button
                type="button"
                onClick={() => setSortMode('recent')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  sortMode === 'recent'
                    ? 'bg-gradient-to-r from-teal-600 via-emerald-600 to-emerald-700 text-white shadow-md shadow-emerald-900/30'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Sort chronologically by most recently added"
              >
                <Clock size={13} className={sortMode === 'recent' ? 'text-teal-200' : 'text-slate-400'} />
                <span>Most Recent</span>
              </button>
            </div>
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
                    onSessionLogged={load}
                  />
                </div>
              </details>
            </div>
          )}

          {remainingBenchItems.length === 0 && !topBenchItem ? (
            <div className="glass-card p-8 rounded-xl text-center space-y-4">
              <p className="text-levl-text-secondary">
                {cadenceFilter === 'as_needed' 
                  ? 'No "As Needed" modalities found on your bench. Tap "+ Log As Needed" above or personalize any modality cadence to "As Needed".'
                  : 'No benched modalities found for this filter.'}
              </p>
              <div className="flex items-center justify-center gap-3">
                {cadenceFilter === 'as_needed' ? (
                  <button 
                    onClick={() => setIsAdHocModalOpen(true)}
                    className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 px-4 py-2 rounded-lg font-bold text-sm cursor-pointer shadow-md shadow-amber-500/20"
                  >
                    <Plus size={15} className="stroke-[3]" />
                    <span>Log As Needed</span>
                  </button>
                ) : (
                  <a href="/explore" className="inline-block bg-levl-accent text-white px-4 py-2 rounded-lg font-medium">Explore Modalities</a>
                )}
              </div>
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
                  onSessionLogged={load}
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
                onClick={() => setIsCreateModalityModalOpen(true)}
                className="flex items-center text-xs bg-sky-600 hover:bg-sky-500 border border-sky-400 text-white font-bold px-3 py-2 rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                <Plus size={14} className="mr-1" /> Modality
              </button>
              <button 
                onClick={() => { setEditorItem(null); setEditorType('protocol'); setEditorOpen(true); }}
                className="flex items-center text-xs bg-levl-surface-highlight hover:bg-levl-border border border-levl-border text-white px-3 py-2 rounded-lg transition-colors cursor-pointer"
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

      {/* Unified Editor Modal for Protocols and Edits */}
      <DraftEditorModal 
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        item={editorItem}
        type={editorType}
        localUserId={getLocalUserId()}
        onSaveSuccess={load}
      />

      {/* 1st-Class Custom Modality Creator Studio */}
      <CreateCustomModalityModal
        isOpen={isCreateModalityModalOpen}
        onClose={() => setIsCreateModalityModalOpen(false)}
        onCreated={load}
      />

      {/* As Needed Modalities Logger Modal */}
      <AdHocLoggerModal
        isOpen={isAdHocModalOpen}
        onClose={() => setIsAdHocModalOpen(false)}
        localUserId={authUserId || (typeof window !== 'undefined' ? localStorage.getItem('levl_local_user_id') : '') || getLocalUserId()}
        benchItems={items}
        todayTasks={[]}
        onLogged={load}
      />

      {/* LongevityReviews 1-Click Protocol Import Modal */}
      {pendingProtocolImport && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-levl-surface border border-levl-border rounded-2xl p-6 max-w-lg w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button 
              type="button"
              onClick={() => setPendingProtocolImport(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-levl-text-secondary hover:text-white hover:bg-levl-surface-highlight transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <Sparkles size={22} />
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-purple-400 font-semibold">LongevityReviews Import</span>
                <h2 className="text-lg font-bold text-white leading-tight">{pendingProtocolImport.title}</h2>
              </div>
            </div>

            <p className="text-xs text-levl-text-secondary mb-4">
              This protocol includes <strong className="text-white">{pendingProtocolImport.items.length} modalities</strong> exported from LongevityReviews.org:
            </p>

            <div className="max-h-56 overflow-y-auto space-y-2 pr-1 mb-6 border border-white/5 rounded-xl p-2.5 bg-black/30">
              {pendingProtocolImport.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-levl-surface/60 border border-white/5 text-xs">
                  <div className="font-medium text-white truncate max-w-[210px]">
                    {item.displayName}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.dose && (
                      <span className="px-2 py-0.5 rounded bg-levl-accent/15 border border-levl-accent/30 text-levl-accent font-mono text-[10px]">
                        {item.dose}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300 text-[10px] capitalize">
                      {item.slot.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleImportProtocolToBench}
                disabled={isImporting}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs transition-colors shadow-lg shadow-purple-600/20 disabled:opacity-50 cursor-pointer"
              >
                <Bookmark size={15} />
                {isImporting ? 'Importing...' : 'Add All to Bench'}
              </button>

              <button
                type="button"
                onClick={handleImportProtocolToToday}
                disabled={isImporting}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-levl-accent hover:bg-levl-accent/90 text-black font-semibold text-xs transition-colors shadow-lg shadow-levl-accent/20 disabled:opacity-50 cursor-pointer"
              >
                <Calendar size={15} />
                {isImporting ? 'Scheduling...' : "Add to Today's Routine"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function BenchPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center animate-pulse text-levl-text-secondary">Loading bench...</div>}>
      <BenchPageContent />
    </Suspense>
  )
}
