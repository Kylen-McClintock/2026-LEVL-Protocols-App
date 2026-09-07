'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { 
  HUBERMAN_DOAC_MASTER_PROTOCOL, 
  HUBERMAN_SUB_PROTOCOLS,
  ALL_HUBERMAN_DOAC_PROTOCOLS 
} from '@/lib/data/hubermanDoacProtocol'
import { 
  addProtocolToToday, 
  getDailyProtocolTasks,
  getOutcomeDimensions,
  getOrCreateUserProfile
} from '@/lib/data'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { format } from 'date-fns'
import { 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Activity, 
  Plus, 
  Check, 
  Info, 
  Zap, 
  ChevronRight, 
  ExternalLink, 
  BookOpen, 
  Share2, 
  Copy, 
  Play, 
  Sliders, 
  ArrowRight, 
  Lock, 
  RotateCcw,
  Flame,
  Sun,
  Moon,
  Wind,
  Brain,
  Timer,
  Heart,
  Droplets,
  Layers,
  Award
} from 'lucide-react'
import CyclicSighingApplet from '@/components/applets/CyclicSighingApplet'
import { DosageDetailModal } from '@/components/modals/DosageDetailModal'
import { Modality, DailyProtocolTask, UserProfile, ProtocolStep } from '@/lib/types'

// Tab definitions for top protocols
interface ProtocolTab {
  id: string
  slug: string
  label: string
  shortLabel: string
  icon: string
  accentColor: string
  badgeText: string
  description: string
}

const PROTOCOL_TABS: ProtocolTab[] = [
  {
    id: 'andrew_huberman_doac_operating_system',
    slug: 'all',
    label: 'Complete 10-Protocol Operating System',
    shortLabel: 'Full System',
    icon: '⚡',
    accentColor: 'from-amber-500/20 via-orange-500/10 to-transparent border-amber-500/40 text-amber-400',
    badgeText: '10 Core Daily Anchors',
    description: 'The master 24-hour routine from Dr. Huberman\'s Diary of a CEO masterclass. Covers waking hydration, light entrainment, delayed caffeine, cold tenacity, deep focus, and nocturnal sleep rescue.'
  },
  {
    id: 'huberman_morning_circadian',
    slug: 'morning-circadian',
    label: 'Morning Circadian Stack',
    shortLabel: 'Morning Circadian',
    icon: '🌅',
    accentColor: 'from-amber-400/20 via-yellow-500/10 to-transparent border-amber-400/40 text-amber-300',
    badgeText: 'Protocols 1, 2 & 3',
    description: '16–32 oz hydration + 10–30 mins outdoor sunlight within 60 mins of waking + 90–120 min caffeine delay to eliminate the afternoon crash.'
  },
  {
    id: 'huberman_stress_reset',
    slug: 'stress-reset',
    label: 'Real-Time Stress Reset (Physiological Sigh)',
    shortLabel: 'Stress Reset',
    icon: '🫁',
    accentColor: 'from-cyan-500/20 via-blue-500/10 to-transparent border-cyan-500/40 text-cyan-300',
    badgeText: 'Stanford Neurobiology Tested',
    description: 'Two quick nasal inhales followed by one slow, extended mouth exhale to immediately lower heart rate via respiratory sinus arrhythmia (RSA).'
  },
  {
    id: 'huberman_cold_tenacity',
    slug: 'cold-tenacity',
    label: 'Deliberate Cold & Willpower (aMCC Tenacity)',
    shortLabel: 'Cold & Tenacity',
    icon: '❄️',
    accentColor: 'from-blue-500/20 via-indigo-500/10 to-transparent border-blue-500/40 text-blue-300',
    badgeText: '+250% Dopamine Surge',
    description: '2–3 mins in 50°F–55°F cold water or cold shower. Conditions the anterior midcingulate cortex (aMCC)—the brain\'s willpower hub.'
  },
  {
    id: 'huberman_metabolic_walk',
    slug: 'metabolic-walk',
    label: 'Post-Meal Glycemic Disposal Walk',
    shortLabel: 'Metabolic Walk',
    icon: '🚶',
    accentColor: 'from-emerald-500/20 via-teal-500/10 to-transparent border-emerald-500/40 text-emerald-300',
    badgeText: 'GLUT4 Glucose Disposal',
    description: '5–15 minute brisk ambulation within 30 minutes after meals to blunt glucose excursions and prevent postprandial lethargy.'
  },
  {
    id: 'huberman_focus_neuroplasticity',
    slug: 'focus-neuroplasticity',
    label: '90-Min Focus & Neuroplasticity Bout',
    shortLabel: '90m Focus Bout',
    icon: '🧠',
    accentColor: 'from-purple-500/20 via-violet-500/10 to-transparent border-purple-500/40 text-purple-300',
    badgeText: 'Ultradian Work Cycle',
    description: 'Single-task ultradian work bout with phone in another room, embracing an optimal ~15% error rate, followed by 10m NSDR rest.'
  },
  {
    id: 'huberman_sleep_rescue',
    slug: 'sleep-rescue',
    label: 'Sleep Environment & 2 AM Wake Rescue',
    shortLabel: 'Sleep Rescue',
    icon: '🌙',
    accentColor: 'from-indigo-500/20 via-slate-500/10 to-transparent border-indigo-500/40 text-indigo-300',
    badgeText: 'Dark Room & Eye Sweep',
    description: '65°F–68°F pitch dark bedroom + sunset light inoculation + closed-eye ocular sweep trick to fall back asleep immediately upon waking.'
  }
]

export default function HubermanClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, localUserId: authUserId, isGuest, openAuthModal } = useAuth()

  // Routing and Tab State
  const initialProtocolParam = searchParams.get('protocol') || searchParams.get('p') || 'all'
  const [selectedTabSlug, setSelectedTabSlug] = useState<string>(initialProtocolParam)
  
  // UI State
  const [isActivating, setIsActivating] = useState(false)
  const [activatedSuccess, setActivatedSuccess] = useState(false)
  const [copiedLink, setCopiedLink] = useState<string | null>(null)
  const [todayTasks, setTodayTasks] = useState<DailyProtocolTask[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [hasAutoActivated, setHasAutoActivated] = useState(false)
  
  // Modals & Applets
  const [isBreathworkOpen, setIsBreathworkOpen] = useState(false)
  const [selectedModalityForDetail, setSelectedModalityForDetail] = useState<Modality | null>(null)
  const [isDosageModalOpen, setIsDosageModalOpen] = useState(false)

  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), [])

  // Resolve user ID with exact parity to /today
  const effectiveUserId = useMemo(() => {
    return user?.id || authUserId || (typeof window !== 'undefined' ? localStorage.getItem('levl_local_user_id') : '') || getLocalUserId()
  }, [user?.id, authUserId])

  // Resolve current active protocol object
  const activeTab = useMemo(() => {
    return PROTOCOL_TABS.find(t => t.slug === selectedTabSlug || t.id === selectedTabSlug) || PROTOCOL_TABS[0]
  }, [selectedTabSlug])

  const currentProtocol = useMemo(() => {
    if (activeTab.slug === 'all') {
      return HUBERMAN_DOAC_MASTER_PROTOCOL
    }
    return ALL_HUBERMAN_DOAC_PROTOCOLS.find(p => p.id === activeTab.id || p.slug === activeTab.slug) || HUBERMAN_DOAC_MASTER_PROTOCOL
  }, [activeTab])

  // Sync URL query params on tab change
  const handleSelectTab = (slug: string) => {
    setSelectedTabSlug(slug)
    setActivatedSuccess(false)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (slug === 'all') {
        url.searchParams.delete('protocol')
        url.searchParams.delete('p')
      } else {
        url.searchParams.set('protocol', slug)
        url.searchParams.delete('p')
      }
      window.history.replaceState({}, '', url.toString())
    }
  }

  // Check if active protocol is already added in today's tasks
  const isProtocolAlreadyActiveToday = useMemo(() => {
    if (!currentProtocol || todayTasks.length === 0) return false
    const stepModalityIds = (currentProtocol.steps || []).map(s => s.modality_id || s.modality?.id).filter(Boolean)
    if (stepModalityIds.length === 0) return false
    // If at least 2 steps (or all if < 2) are present in today's tasks
    const matchedCount = stepModalityIds.filter(id => todayTasks.some(t => t.modality_id === id)).length
    return matchedCount >= Math.min(2, stepModalityIds.length)
  }, [currentProtocol, todayTasks])

  // Load existing tasks on mount & automatically start the protocol if opening from link
  useEffect(() => {
    let isCancelled = false

    const initData = async () => {
      if (!effectiveUserId) return
      try {
        const [tasks, profile] = await Promise.all([
          getDailyProtocolTasks(effectiveUserId, todayStr),
          getOrCreateUserProfile(effectiveUserId)
        ])
        if (isCancelled) return
        setTodayTasks(tasks)
        setUserProfile(profile)

        // Check if active protocol is already added in today's tasks
        const stepModalityIds = (currentProtocol.steps || []).map(s => s.modality_id || s.modality?.id).filter(Boolean)
        const isAlreadyActive = stepModalityIds.length > 0 && stepModalityIds.filter(id => tasks.some(t => t.modality_id === id)).length >= Math.min(2, stepModalityIds.length)

        // Auto-activate on first load of link or if start query is set
        const shouldAutoStart = searchParams.get('start') === 'true' || searchParams.get('autoAdd') === 'true' || !isAlreadyActive
        if (!hasAutoActivated && shouldAutoStart) {
          setHasAutoActivated(true)
          await addProtocolToToday(effectiveUserId, todayStr, currentProtocol.id)
          const updated = await getDailyProtocolTasks(effectiveUserId, todayStr)
          if (isCancelled) return
          setTodayTasks(updated)
          setActivatedSuccess(true)
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(`levl_cached_tasks_${todayStr}`, JSON.stringify(updated))
              localStorage.setItem('levl_guest_instant_kickstart', 'true')
              localStorage.setItem('levl_active_protocol', currentProtocol.name)
              localStorage.setItem('levl_referral_source', 'diary_of_a_ceo')
              localStorage.setItem('levl_referral_influencer', 'andrew_huberman')
              window.dispatchEvent(new CustomEvent('levl_sync_end'))
              window.dispatchEvent(new CustomEvent('levl_tasks_updated', { detail: updated }))
            } catch (e) {}
          }
        }
      } catch (e) {
        console.warn('Failed to load initial tasks in HubermanClient:', e)
      }
    }
    initData()
    return () => { isCancelled = true }
  }, [effectiveUserId, todayStr, currentProtocol, searchParams, hasAutoActivated])

  // Instant Kickstart: Add protocol to today's schedule
  const handleActivateProtocol = async (redirectAfter = true) => {
    if (!currentProtocol) return
    setIsActivating(true)
    try {
      const activeId = effectiveUserId || getLocalUserId()
      
      // Store referral and kickstart attribution
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('levl_guest_instant_kickstart', 'true')
          localStorage.setItem('levl_active_protocol', currentProtocol.name)
          localStorage.setItem('levl_referral_source', 'diary_of_a_ceo')
          localStorage.setItem('levl_referral_influencer', 'andrew_huberman')
        } catch (e) {}
      }

      await addProtocolToToday(activeId, todayStr, currentProtocol.id)
      const updatedTasks = await getDailyProtocolTasks(activeId, todayStr)
      setTodayTasks(updatedTasks)
      
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`levl_cached_tasks_${todayStr}`, JSON.stringify(updatedTasks))
          window.dispatchEvent(new CustomEvent('levl_sync_end'))
          window.dispatchEvent(new CustomEvent('levl_tasks_updated', { detail: updatedTasks }))
        } catch (e) {}
      }

      setActivatedSuccess(true)

      if (redirectAfter) {
        router.push('/today')
      }
    } catch (err) {
      console.error('Failed to activate protocol:', err)
    } finally {
      setIsActivating(false)
    }
  }

  // Copy shareable protocol link to clipboard with auto-start enabled
  const handleCopyLink = (protocolSlug?: string) => {
    if (typeof window === 'undefined') return
    const targetSlug = protocolSlug || activeTab.slug
    const baseUrl = window.location.origin + '/huberman'
    const shareUrl = targetSlug === 'all' ? `${baseUrl}?start=true` : `${baseUrl}?protocol=${targetSlug}&start=true`
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedLink(targetSlug)
      setTimeout(() => setCopiedLink(null), 2400)
    }).catch(err => {
      console.error('Failed to copy share link:', err)
    })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28">
      {/* Hero Header */}
      <div className="relative border-b border-slate-800/80 bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-950 px-4 pt-6 pb-8 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Top Pill Badges */}
          <div className="flex flex-wrap items-center gap-2.5 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              The Diary of a CEO Exclusive
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
              <Brain className="w-3.5 h-3.5 text-sky-400" />
              Dr. Andrew Huberman, Ph.D.
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              24-Hour Daily Operating System
            </span>
          </div>

          {/* Main Title & Teaser */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-3">
            Andrew Huberman’s Daily Operating System
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-3xl leading-relaxed mb-6">
            From his masterclass on <em className="text-white font-medium not-italic">The Diary of a CEO</em> and his clinical handbook <em className="text-white font-medium not-italic">Protocols: An Operating Manual for the Human Body</em>. 
            Zero-cost, science-grounded interventions sequenced along the 24-hour circadian arc to master morning cortisol, peak dopamine, sustained focus, and deep slow-wave sleep.
          </p>

          {/* Quick Action Bar: Start Protocol + Share Link */}
          <div className="flex flex-wrap items-center gap-3.5 pt-1">
            {activatedSuccess || isProtocolAlreadyActiveToday ? (
              <button
                onClick={() => router.push('/today')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>Protocol Active in Today’s Schedule • Open Today</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>
            ) : (
              <button
                onClick={() => handleActivateProtocol(true)}
                disabled={isActivating}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-lg shadow-amber-500/25 transition-all transform active:scale-95 disabled:opacity-50"
              >
                {isActivating ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Adding to Today’s Schedule...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-slate-950 fill-current" />
                    <span>Start This Protocol Now (Instant Free Access)</span>
                  </>
                )}
              </button>
            )}

            {/* Copy Share Link */}
            <button
              onClick={() => handleCopyLink(activeTab.slug)}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 transition-all active:scale-95"
              title="Copy custom direct link for this protocol"
            >
              {copiedLink === activeTab.slug ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300 font-semibold">Custom Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-slate-400" />
                  <span>Share Custom Link</span>
                </>
              )}
            </button>

            {/* Quick Sigh Breathwork Trigger */}
            <button
              onClick={() => setIsBreathworkOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-700/50 transition-all active:scale-95"
            >
              <Wind className="w-4 h-4 text-cyan-400" />
              <span>Launch Physiological Sigh Applet (5m)</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
        
        {/* Progressive Profiling Banner: "Get the Entire Experience" */}
        <div className="relative overflow-hidden rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-950/40 via-slate-900 to-indigo-950/40 p-5 sm:p-6 shadow-xl backdrop-blur-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 tracking-wider uppercase">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                {isGuest ? 'Running in Instant Guest Mode' : 'Cloud Sync & Personalized Calibration Active'}
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white">
                {isGuest 
                  ? 'Unlock the Complete LEVL Experience' 
                  : `Calibrated for ${user?.email || 'Your Health Profile'}`}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {isGuest ? (
                  <>
                    You can start Dr. Huberman’s exact protocols immediately with zero barriers. When you’re ready to save your daily streaks across all devices, personalize exact dosages based on your weight and wake time, sync smart wearables (Apple Health, Oura, Whoop), and unlock the 24/7 AI Longevity Coach—simply sign in. All your guest progress transfers seamlessly.
                  </>
                ) : (
                  <>
                    Your account is fully synchronized. Your personal biometrics, custom morning wake anchor, and daily completion logs are secured in the cloud.
                  </>
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {isGuest ? (
                <>
                  <button
                    onClick={openAuthModal}
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-md transition-all active:scale-95"
                  >
                    <span>Sign In / Save Progress</span>
                    <ChevronRight className="w-4 h-4 text-slate-950" />
                  </button>
                  <Link
                    href="/onboarding?calibrate=huberman"
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
                  >
                    <Sliders className="w-3.5 h-3.5 text-slate-400" />
                    <span>Quick 60-Sec Calibration</span>
                  </Link>
                </>
              ) : (
                <Link
                  href="/settings"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
                >
                  <Sliders className="w-3.5 h-3.5 text-slate-400" />
                  <span>Manage Profile & Wearables</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Protocol Selector Tabs */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Top Protocols & Modality Anchors</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Select any protocol below to inspect exact steps, clinical dosing, and launch its custom link.
              </p>
            </div>
            <span className="text-xs text-slate-400 hidden sm:inline-block">
              {PROTOCOL_TABS.length} Protocols Available
            </span>
          </div>

          {/* Horizontal Scrolling Pill Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
            {PROTOCOL_TABS.map((tab) => {
              const isSelected = activeTab.slug === tab.slug
              return (
                <button
                  key={tab.slug}
                  onClick={() => handleSelectTab(tab.slug)}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium border transition-all ${
                    isSelected
                      ? 'bg-slate-800 text-white border-amber-500/60 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <span className="text-base">{tab.icon}</span>
                  <span className="font-semibold">{tab.shortLabel}</span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse ml-0.5" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Active Protocol Card Details */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 sm:p-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="text-2xl">{activeTab.icon}</span>
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  {currentProtocol.name}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                {currentProtocol.description}
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-shrink-0">
              <button
                onClick={() => handleCopyLink(activeTab.slug)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
              >
                {copiedLink === activeTab.slug ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Custom Link</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  if (isProtocolAlreadyActiveToday) {
                    router.push('/today')
                  } else {
                    handleActivateProtocol(true)
                  }
                }}
                disabled={isActivating}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50 ${
                  isProtocolAlreadyActiveToday
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                }`}
              >
                {isProtocolAlreadyActiveToday ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Active in Schedule • View Today</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Add to Today</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Key Targets & Evidence Pill Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Primary Target</div>
              <div className="text-xs sm:text-sm font-semibold text-slate-200 truncate">{currentProtocol.primary_goal}</div>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Evidence Level</div>
              <div className="text-xs sm:text-sm font-semibold text-emerald-400">{currentProtocol.evidence_level}</div>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Difficulty</div>
              <div className="text-xs sm:text-sm font-semibold text-sky-400">{currentProtocol.difficulty_level}</div>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Steps Count</div>
              <div className="text-xs sm:text-sm font-semibold text-amber-400">{currentProtocol.steps?.length || 0} Modalities</div>
            </div>
          </div>

          {/* Protocol Steps Checklist */}
          <div className="space-y-4 pt-2">
            <h4 className="text-sm font-bold text-slate-200 tracking-wide uppercase flex items-center justify-between">
              <span>Sequenced Protocol Steps & Dosing Parameters</span>
              <span className="text-xs text-slate-400 font-normal">Click any step for clinical paper & dosing</span>
            </h4>

            <div className="space-y-3">
              {(currentProtocol.steps || []).map((step: ProtocolStep, idx: number) => {
                const mod = step.modality
                const isSigh = step.modality_id === 'physiological_sigh' || mod?.id === 'physiological_sigh'
                
                return (
                  <div
                    key={step.id || idx}
                    className="group relative rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950/60 p-4 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5 border border-slate-700">
                          {idx + 1}
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h5 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                              {mod?.display_name || mod?.name || step.instructions}
                            </h5>
                            {step.timing_slot && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                                {step.timing_slot}
                              </span>
                            )}
                            {step.temperature && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/60">
                                🌡️ {step.temperature}
                              </span>
                            )}
                          </div>

                          {/* Dosing Specs */}
                          <div className="flex flex-wrap items-center gap-3 text-xs text-amber-400 font-medium">
                            {step.dose_text && (
                              <span>Dose: {step.dose_text}</span>
                            )}
                            {step.duration && (
                              <span>• Duration: {step.duration}</span>
                            )}
                            {step.frequency && (
                              <span>• Frequency: {step.frequency}</span>
                            )}
                          </div>

                          {/* Instructions */}
                          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-1">
                            {step.instructions}
                          </p>

                          {/* Synergy / Pod quote note */}
                          {step.notes && (
                            <p className="text-xs text-slate-400 italic pt-0.5">
                              💡 Huberman DOAC Note: {step.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right-Side Actions: Launch Breathwork Applet or Inspect Dose */}
                      <div className="flex sm:flex-col items-center sm:items-end gap-2 flex-shrink-0 pt-2 sm:pt-0">
                        {isSigh && (
                          <button
                            onClick={() => setIsBreathworkOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow transition-all"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Run Pacer (5m)</span>
                          </button>
                        )}

                        {mod && (
                          <button
                            onClick={() => {
                              setSelectedModalityForDetail(mod)
                              setIsDosageModalOpen(true)
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700 hover:text-white border border-slate-700 transition-colors"
                          >
                            <Info className="w-3.5 h-3.5 text-slate-400" />
                            <span>Inspect Modality</span>
                          </button>
                        )}

                        {mod?.scientific_references?.[0]?.url && (
                          <a
                            href={mod.scientific_references[0].url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 transition-colors"
                          >
                            <BookOpen className="w-3 h-3" />
                            <span>PubMed RCT</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* 8-Vector Canonical Longevity Profile for Huberman DOAC OS */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:p-7 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
                <Award className="w-4 h-4 text-amber-400" />
                Evidence-Anchored Longevity Profile
              </div>
              <h3 className="text-xl font-bold text-white">
                8-Vector Biological Longevity Impact
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              Calibrated against PubMed Clinical Trials
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-purple-400">🧠 Brain Longevity</span>
                <span className="text-xs font-bold text-white">95 / 100</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: '95%' }} />
              </div>
              <p className="text-[11px] text-slate-400">aMCC willpower hypertrophy, SCN clock entrainment, and slow-wave sleep spindles.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-rose-400">❤️ Heart Health</span>
                <span className="text-xs font-bold text-white">88 / 100</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: '88%' }} />
              </div>
              <p className="text-[11px] text-slate-400">Resting HRV elevation, autonomic baroreflex restoration, and Zone 2 mitochondrial capillarization.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-emerald-400">⚡ Metabolic Health</span>
                <span className="text-xs font-bold text-white">85 / 100</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '85%' }} />
              </div>
              <p className="text-[11px] text-slate-400">Postprandial GLUT4 non-insulin glucose clearance and brown adipose tissue UCP-1 thermogenesis.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-amber-400">🛡️ Inflammation & HPA</span>
                <span className="text-xs font-bold text-white">86 / 100</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '86%' }} />
              </div>
              <p className="text-[11px] text-slate-400">Cortisol awakening synchronization, vagal cholinergic anti-inflammatory reflex, and hs-CRP reduction.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-sky-400">💪 Testosterone / Hormonal</span>
                <span className="text-xs font-bold text-white">84 / 100</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div className="bg-sky-500 h-1.5 rounded-full" style={{ width: '84%' }} />
              </div>
              <p className="text-[11px] text-slate-400">Preserves nocturnal LH pulses through slow-wave sleep protection; heavy compound resistance loading.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-cyan-400">🧬 Cellular Longevity</span>
                <span className="text-xs font-bold text-white">82 / 100</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: '82%' }} />
              </div>
              <p className="text-[11px] text-slate-400">Mitochondrial biogenesis via PGC-1α; nocturnal glymphatic macromolecular waste clearance.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-teal-400">🦴 Bone Density</span>
                <span className="text-xs font-bold text-white">80 / 100</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: '80%' }} />
              </div>
              <p className="text-[11px] text-slate-400">Axial osteoblastic loading via 3-day resistance training program.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-400">🔬 Cancer Defense</span>
                <span className="text-xs font-bold text-slate-400">Neutral</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div className="bg-slate-600 h-1.5 rounded-full" style={{ width: '35%' }} />
              </div>
              <p className="text-[11px] text-slate-400">Indirect benefit via nocturnal melatonin peak and Natural Killer cell immune surveillance.</p>
            </div>
          </div>
        </div>

        {/* Shareable Direct Links Directory */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Share2 className="w-4 h-4 text-amber-400" />
                <span>Direct Protocol Links (Shareable)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Share any specific protocol with your audience or friends. They can launch the routine instantly without sign-up.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PROTOCOL_TABS.map(tab => (
              <div
                key={tab.slug}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 text-xs transition-all"
              >
                <div className="flex items-center gap-2.5 truncate mr-3">
                  <span className="text-lg">{tab.icon}</span>
                  <div className="truncate">
                    <div className="font-semibold text-slate-200 truncate">{tab.label}</div>
                    <div className="text-[11px] text-slate-400 font-mono truncate">
                      /huberman{tab.slug !== 'all' ? `?protocol=${tab.slug}` : ''}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleCopyLink(tab.slug)}
                  className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  {copiedLink === tab.slug ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Embedded Breathwork Applet Modal */}
      {isBreathworkOpen && (
        <CyclicSighingApplet
          isOpen={isBreathworkOpen}
          onClose={() => setIsBreathworkOpen(false)}
          modalityName="The Physiological Sigh (Stanford RCT)"
          onComplete={() => {
            setIsBreathworkOpen(false)
          }}
        />
      )}

      {/* Modality Dosage Detail Modal */}
      {isDosageModalOpen && selectedModalityForDetail && (
        <DosageDetailModal
          isOpen={isDosageModalOpen}
          onClose={() => {
            setIsDosageModalOpen(false)
            setSelectedModalityForDetail(null)
          }}
          modality={selectedModalityForDetail}
          userProfile={userProfile}
        />
      )}
    </div>
  )
}
