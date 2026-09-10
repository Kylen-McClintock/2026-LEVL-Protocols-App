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
import { HUBERMAN_DOAC_MODALITIES } from '@/lib/data/hubermanDoacModalities'
import { BUILT_IN_LONGEVITY_MODALITIES } from '@/lib/data/builtInLongevityModalities'
import { 
  addProtocolToToday, 
  getDailyProtocolTasks,
  getOutcomeDimensions,
  getOrCreateUserProfile,
  getModalities,
  createDailyTask
} from '@/lib/data'
import { modalityReferences } from '@/lib/data/references'
import GeekMode from '@/components/cards/GeekMode'
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
  Award,
  Microscope,
  ChevronDown,
  ChevronUp,
  Calendar,
  ListChecks
} from 'lucide-react'
import CyclicSighingApplet from '@/components/applets/CyclicSighingApplet'
import { DosageDetailModal } from '@/components/modals/DosageDetailModal'
import ModalityIcon from '@/components/ui/ModalityIcon'
import ProtocolAvatar, { ProtocolCategoryPills } from '@/components/ui/ProtocolAvatar'
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
    accentColor: 'from-purple-500/20 via-indigo-500/10 to-transparent border-purple-500/40 text-purple-300',
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

// Circadian Window mapping helper for diurnal grouping
interface CircadianWindowDef {
  id: string
  title: string
  subtitle: string
  icon: string
  badgeColor: string
  slots: string[]
}

const CIRCADIAN_WINDOWS: CircadianWindowDef[] = [
  {
    id: 'waking',
    title: 'Dawn & Waking Fasted (0–60m)',
    subtitle: 'Cortisol awakening pulse, hydration vagal trigger, and low solar-angle photon entrainment',
    icon: '🌅',
    badgeColor: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    slots: ['waking', 'upon_waking', 'fasted', 'early_morning', 'dawn', 'sunrise']
  },
  {
    id: 'morning_tenacity',
    title: 'Morning Focus & Tenacity (60–120m+)',
    subtitle: 'Adenosine receptor clearance, aMCC willpower hypertrophy & sustained dopamine',
    icon: '⚡',
    badgeColor: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300',
    slots: ['morning']
  },
  {
    id: 'midday_performance',
    title: 'Midday Ultradian Focus & Metabolic Ambulation',
    subtitle: '90-minute single-task focus bouts and GLUT4 insulin-independent glucose disposal',
    icon: '🍽️',
    badgeColor: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    slots: ['midday', 'afternoon', 'lunch', 'meal', 'post_meal']
  },
  {
    id: 'realtime_control',
    title: 'Anytime Autonomic Reset',
    subtitle: 'Instant vagal parasympathetic activation via dual-inhalation physiological sighs',
    icon: '🫁',
    badgeColor: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
    slots: ['anytime', 'flexible', 'as_needed']
  },
  {
    id: 'evening_sanctuary',
    title: 'Evening Sunset & Sleep Sanctuary',
    subtitle: 'Sunset photopic buffering, 65°F core thermal drop, and 2 AM wake rescue',
    icon: '🌙',
    badgeColor: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300',
    slots: ['evening', 'sunset', 'pre_bed', 'bedtime', 'night', 'sleep', 'overnight']
  }
]

const getCircadianTimingBadge = (slot: string) => {
  const norm = (slot || '').toLowerCase().replace(/[-\s]/g, '_')
  if (norm.includes('wake') || norm.includes('upon_waking') || norm.includes('fasted')) {
    return {
      label: 'Waking / Fasted',
      icon: '🌅',
      color: 'bg-amber-500/10 text-amber-300 border-amber-500/30'
    }
  }
  if (norm.includes('morning') || norm.includes('sunrise') || norm.includes('dawn')) {
    return {
      label: 'Morning Focus',
      icon: '☀️',
      color: 'bg-sky-500/10 text-sky-300 border-sky-500/30'
    }
  }
  if (norm.includes('midday') || norm.includes('afternoon') || norm.includes('meal') || norm.includes('walk') || norm.includes('lunch') || norm.includes('post_meal')) {
    return {
      label: 'Midday / Fuel',
      icon: '🍽️',
      color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
    }
  }
  if (norm.includes('evening') || norm.includes('sunset') || norm.includes('dusk') || norm.includes('wind_down')) {
    return {
      label: 'Evening Wind-Down',
      icon: '🌙',
      color: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
    }
  }
  if (norm.includes('bed') || norm.includes('sleep') || norm.includes('night') || norm.includes('rescue')) {
    return {
      label: 'Bedtime & Sleep',
      icon: '🛌',
      color: 'bg-purple-500/10 text-purple-300 border-purple-500/30'
    }
  }
  return {
    label: slot.replace(/_/g, ' ') || 'Daily Routine',
    icon: '⚡',
    color: 'bg-slate-800 text-slate-300 border-slate-700'
  }
}

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
  const [viewMode, setViewMode] = useState<'checklist' | 'circadian'>('checklist')
  
  // Modals & Applets
  const [isBreathworkOpen, setIsBreathworkOpen] = useState(false)
  const [selectedModalityForDetail, setSelectedModalityForDetail] = useState<Modality | null>(null)
  const [isDosageModalOpen, setIsDosageModalOpen] = useState(false)
  const [catalogModalities, setCatalogModalities] = useState<Modality[]>([])
  const [expandedGeekStepId, setExpandedGeekStepId] = useState<string | null>(null)
  const [expandedDescStepIds, setExpandedDescStepIds] = useState<Record<string, boolean>>({})

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
    setExpandedDescStepIds({})
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

  // Modality presence & schedule completion checks
  const protocolStepModalityIds = useMemo(() => {
    if (!currentProtocol?.steps) return []
    return currentProtocol.steps.map(s => s.modality_id || s.modality?.id).filter(Boolean) as string[]
  }, [currentProtocol])

  const missingStepModalityIds = useMemo(() => {
    if (!protocolStepModalityIds.length) return []
    return protocolStepModalityIds.filter(id => !todayTasks.some(t => t.modality_id === id))
  }, [protocolStepModalityIds, todayTasks])

  const activeModalityCount = useMemo(() => {
    return protocolStepModalityIds.filter(id => todayTasks.some(t => t.modality_id === id)).length
  }, [protocolStepModalityIds, todayTasks])

  const isProtocolFullyActiveToday = useMemo(() => {
    if (!protocolStepModalityIds.length) return false
    return missingStepModalityIds.length === 0
  }, [protocolStepModalityIds, missingStepModalityIds])

  // Load existing tasks on mount & automatically start the protocol if opening from link
  useEffect(() => {
    let isCancelled = false

    const initData = async () => {
      if (!effectiveUserId) return
      try {
        const [tasks, profile, allMods] = await Promise.all([
          getDailyProtocolTasks(effectiveUserId, todayStr),
          getOrCreateUserProfile(effectiveUserId),
          getModalities()
        ])
        if (isCancelled) return
        setTodayTasks(tasks)
        setUserProfile(profile)
        if (allMods) setCatalogModalities(allMods)

        // Check if steps are missing from active protocol
        const stepModalityIds = (currentProtocol.steps || []).map(s => s.modality_id || s.modality?.id).filter(Boolean) as string[]
        const missing = stepModalityIds.filter(id => !tasks.some(t => t.modality_id === id))

        // Auto-activate on first load of link or if start query is set
        const shouldAutoStart = (searchParams.get('start') === 'true' || searchParams.get('autoAdd') === 'true') && missing.length > 0
        if (!hasAutoActivated && shouldAutoStart) {
          setHasAutoActivated(true)
          setIsActivating(true)
          try {
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
          } finally {
            setIsActivating(false)
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
        if (typeof window !== 'undefined') {
          window.location.href = '/today'
        } else {
          router.push('/today')
        }
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

  // Quick single-modality addition to today's schedule
  const handleAddSingleStepToToday = async (stepModId: string, timingSlot?: string) => {
    if (!stepModId) return
    setIsActivating(true)
    try {
      const activeId = effectiveUserId || getLocalUserId()
      await createDailyTask(activeId, todayStr, stepModId, timingSlot || 'morning')
      const updated = await getDailyProtocolTasks(activeId, todayStr)
      setTodayTasks(updated)
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`levl_cached_tasks_${todayStr}`, JSON.stringify(updated))
          window.dispatchEvent(new CustomEvent('levl_sync_end'))
          window.dispatchEvent(new CustomEvent('levl_tasks_updated', { detail: updated }))
        } catch (e) {}
      }
    } catch (err) {
      console.error('Failed to add single step to today:', err)
    } finally {
      setIsActivating(false)
    }
  }

  // Helper to determine category-specific active styling for protocol tabs
  const getTabActiveStyle = (slug: string, isSelected: boolean) => {
    if (!isSelected) {
      return 'bg-slate-900/60 text-slate-400 border-slate-800/80 hover:border-slate-700 hover:text-slate-200'
    }
    switch (slug) {
      case 'morning-circadian':
        return 'bg-slate-900 text-white border-amber-400/60 shadow-lg shadow-amber-500/15 ring-1 ring-amber-400/30'
      case 'stress-reset':
        return 'bg-slate-900 text-white border-cyan-400/60 shadow-lg shadow-cyan-500/15 ring-1 ring-cyan-400/30'
      case 'cold-tenacity':
        return 'bg-slate-900 text-white border-blue-400/60 shadow-lg shadow-blue-500/15 ring-1 ring-blue-400/30'
      case 'metabolic-walk':
        return 'bg-slate-900 text-white border-emerald-400/60 shadow-lg shadow-emerald-500/15 ring-1 ring-emerald-400/30'
      case 'focus-neuroplasticity':
        return 'bg-slate-900 text-white border-purple-400/60 shadow-lg shadow-purple-500/15 ring-1 ring-purple-400/30'
      case 'sleep-rescue':
        return 'bg-slate-900 text-white border-indigo-400/60 shadow-lg shadow-indigo-500/15 ring-1 ring-indigo-400/30'
      case 'all':
      default:
        return 'bg-slate-900 text-white border-purple-400/60 shadow-lg shadow-purple-500/15 ring-1 ring-purple-400/30'
    }
  }

  const getTabDotColor = (slug: string) => {
    switch (slug) {
      case 'morning-circadian': return 'bg-amber-400'
      case 'stress-reset': return 'bg-cyan-400'
      case 'cold-tenacity': return 'bg-blue-400'
      case 'metabolic-walk': return 'bg-emerald-400'
      case 'focus-neuroplasticity': return 'bg-purple-400'
      case 'sleep-rescue': return 'bg-indigo-400'
      case 'all':
      default: return 'bg-purple-400'
    }
  }

  // Render a single high-fidelity LEVL modality card
  const renderModalityCard = (step: ProtocolStep, idx: number) => {
    const stepModId = step.modality_id || step.modality?.id || ''
    const fromCatalog = catalogModalities.find(m => m.id === stepModId || m.slug === stepModId)
    const fromDoac = HUBERMAN_DOAC_MODALITIES.find(m => m.id === stepModId)
    const fromBuiltIn = BUILT_IN_LONGEVITY_MODALITIES.find(m => m.id === stepModId)
    const fromStep = step.modality

    const baseMod = fromCatalog || fromDoac || fromBuiltIn || fromStep || ({ id: stepModId, name: step.instructions } as Modality)
    const fallbackMod = fromDoac || fromBuiltIn || fromStep

    const fullMod: Modality = {
      ...fallbackMod,
      ...baseMod,
      scientific_references: (baseMod.scientific_references && baseMod.scientific_references.length > 0)
        ? baseMod.scientific_references
        : (fallbackMod?.scientific_references && fallbackMod.scientific_references.length > 0)
          ? fallbackMod.scientific_references
          : (modalityReferences[stepModId] || []),
      functional_impacts: baseMod.functional_impacts || fallbackMod?.functional_impacts || {},
      mechanism_of_action: baseMod.mechanism_of_action || fallbackMod?.mechanism_of_action || '',
      evidence_summary: baseMod.evidence_summary || fallbackMod?.evidence_summary || ''
    }

    const isStepActiveToday = todayTasks.some(t => t.modality_id === stepModId || t.modality_id === fullMod.id)
    const isSigh = stepModId === 'physiological_sigh' || stepModId === 'cyclic_sighing' || fullMod.id === 'physiological_sigh' || fullMod.id === 'cyclic_sighing'
    const stepKey = step.id || `${stepModId}-${idx}`
    const isGeekOpen = expandedGeekStepId === stepKey
    const isDescExpanded = !!expandedDescStepIds[stepKey]
    const descriptionText = step.instructions || fullMod.brief_description || ''
    const hasLongDescription = descriptionText.length > 120 || Boolean(step.notes)
    const circadian = getCircadianTimingBadge(step.timing_slot || fullMod.timing_summary || '')
    const targetModId = stepModId || fullMod.id || fullMod.slug || ''

    return (
      <div
        key={stepKey}
        className="group relative rounded-2xl border border-slate-800/90 hover:border-purple-500/40 bg-slate-900/70 backdrop-blur-md p-4 sm:p-5 transition-all duration-200 shadow-lg hover:shadow-xl space-y-3.5"
      >
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          
          {/* Left: Icon + Title + Badges + Dosing + Instructions */}
          <div className="flex items-start gap-3.5 flex-1 min-w-0">
            {/* Custom Modality Vector Icon with Glowing Halo */}
            <div className="shrink-0 mt-0.5">
              <ModalityIcon 
                modality={fullMod} 
                size={24} 
                glow={true} 
                isIgnited={true}
                className="shrink-0"
              />
            </div>

            <div className="space-y-2 flex-1 min-w-0">
              
              {/* Header Meta: Step Number, Title, Diurnal Timing & Today Status */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/80 shrink-0">
                  #{String(idx + 1).padStart(2, '0')}
                </span>

                <h5 className="text-base sm:text-lg font-extrabold text-white group-hover:text-purple-300 transition-colors leading-snug">
                  {fullMod.display_name || fullMod.name || step.instructions}
                </h5>

                {/* Circadian Sky Beacon Badge */}
                {step.timing_slot && (
                  <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${circadian.color}`}>
                    <span>{circadian.icon}</span>
                    <span>{circadian.label}</span>
                  </span>
                )}

                {/* Thermal Temperature Pill */}
                {step.temperature && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-800/60">
                    🌡️ {step.temperature}
                  </span>
                )}

                {/* Schedule Status or Quick-Add */}
                {isStepActiveToday ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 shadow-[0_0_10px_rgba(16,185,129,0.25)]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>In Today’s Plan</span>
                  </span>
                ) : (
                  <button
                    onClick={() => handleAddSingleStepToToday(stepModId, step.timing_slot)}
                    disabled={isActivating}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-500/40 transition-all disabled:opacity-50 cursor-pointer shadow-sm active:scale-95"
                  >
                    <Plus className="w-3 h-3 stroke-[3]" />
                    <span>Add to Today</span>
                  </button>
                )}
              </div>

              {/* Dosing Specs Pills Row (Structured instead of plain text) */}
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                {step.dose_text && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-mono font-medium text-slate-200 shadow-xs">
                    <span className="text-teal-400">💊 Dose:</span>
                    <span className="text-slate-300 font-sans">{step.dose_text}</span>
                  </span>
                )}
                {step.duration && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-mono font-medium text-slate-200 shadow-xs">
                    <span className="text-sky-400">⏱️ Duration:</span>
                    <span className="text-slate-300 font-sans">{step.duration}</span>
                  </span>
                )}
                {step.frequency && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-mono font-medium text-slate-200 shadow-xs">
                    <span className="text-purple-400">🔄 Cadence:</span>
                    <span className="text-slate-300 font-sans">{step.frequency}</span>
                  </span>
                )}
              </div>

              {/* Protocol Instructions & DOAC Masterclass Note */}
              <div className="space-y-2 pt-1">
                {!hasLongDescription ? (
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                    {descriptionText}
                  </p>
                ) : isDescExpanded ? (
                  <>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans animate-in fade-in duration-150">
                      {descriptionText}
                    </p>
                    {step.notes && (
                      <div className="p-3 rounded-xl bg-slate-950/90 border border-cyan-500/30 text-xs text-slate-300 leading-relaxed shadow-sm animate-in fade-in duration-150">
                        <div className="flex items-center gap-1.5 text-cyan-300 font-bold uppercase text-[10px] tracking-wider mb-1">
                          <span>💡</span>
                          <span>Diary of a CEO Masterclass Protocol Note</span>
                        </div>
                        <p className="italic text-slate-200/90">{step.notes}</p>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setExpandedDescStepIds(prev => ({ ...prev, [stepKey]: false }))}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-200 transition-colors pt-0.5 cursor-pointer"
                    >
                      <span>Collapse protocol instructions</span>
                      <ChevronUp className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans line-clamp-2">
                      {descriptionText}
                    </p>
                    <button
                      type="button"
                      onClick={() => setExpandedDescStepIds(prev => ({ ...prev, [stepKey]: true }))}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-400 hover:text-purple-300 transition-colors pt-0.5 cursor-pointer"
                    >
                      <span>Read full protocol instructions &amp; DOAC note</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Quick Action Controls & Deep Links */}
          <div className="flex flex-wrap lg:flex-col items-center lg:items-end gap-2 shrink-0 pt-2 lg:pt-0">
            {isSigh && (
              <button
                onClick={() => setIsBreathworkOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 transition-all cursor-pointer active:scale-95"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Run Pacer (5m)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setExpandedGeekStepId(isGeekOpen ? null : stepKey)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isGeekOpen 
                  ? 'bg-purple-600 text-white border-purple-500 shadow-md' 
                  : 'bg-slate-800/80 text-purple-300 hover:bg-slate-700/80 border-slate-700 hover:text-purple-200'
              }`}
            >
              <Microscope className="w-3.5 h-3.5" />
              <span>{isGeekOpen ? 'Hide Science' : '🔬 Geek Mode'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedModalityForDetail(fullMod)
                setIsDosageModalOpen(true)
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800/90 hover:bg-slate-700 hover:text-white border border-slate-700 transition-colors shadow-xs cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-400" />
              <span>Inspect Modality</span>
            </button>

            {/* LongevityReviews PubMed Consensus Bridge */}
            {targetModId && (
              <a
                href={`https://longevityreviews.org/modalities/${targetModId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-400 hover:text-purple-300 transition-colors pt-1 group/bridge"
              >
                <span>View PubMed Consensus &amp; Studies</span>
                <ExternalLink className="w-3 h-3 opacity-70 group-hover/bridge:opacity-100 transition-opacity" />
              </a>
            )}

            {/* Direct PubMed Paper Link (if available) */}
            {(fullMod.scientific_references?.[0]?.url || modalityReferences[stepModId]?.[0]?.url) && (
              <a
                href={fullMod.scientific_references?.[0]?.url || modalityReferences[stepModId]?.[0]?.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 transition-colors"
              >
                <BookOpen className="w-3 h-3" />
                <span>Primary Paper</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
        </div>

        {/* Inline Expandable Geek Mode Card */}
        {isGeekOpen && (
          <div className="mt-4 pt-3 border-t border-slate-800 animate-in fade-in duration-200">
            <GeekMode modality={fullMod} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28 selection:bg-purple-500/30">
      
      {/* Hero Header */}
      <div className="relative border-b border-slate-800/80 bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-950 px-4 pt-7 pb-8 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          
          {/* Header Row: ProtocolAvatar, Creator Pills, Title */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
            <ProtocolAvatar
              protocolName={currentProtocol.name}
              protocolInfo={currentProtocol}
              size={54}
              roundedClass="rounded-2xl"
            />
            
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30 tracking-wide uppercase">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  The Diary of a CEO Masterclass
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-900 text-slate-300 border border-slate-800">
                  <Brain className="w-3.5 h-3.5 text-cyan-400" />
                  Dr. Andrew Huberman, Ph.D.
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-900 text-slate-300 border border-slate-800">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  24-Hour Daily Arc
                </span>
              </div>
              
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
                Andrew Huberman’s Daily Operating System
              </h1>
            </div>
          </div>

          <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed mb-6 font-sans">
            From his masterclass on <em className="text-white font-medium not-italic">The Diary of a CEO</em> and his clinical handbook <em className="text-white font-medium not-italic">Protocols: An Operating Manual for the Human Body</em>. 
            Zero-cost, science-grounded interventions sequenced along the 24-hour circadian arc to master morning cortisol, peak dopamine, sustained focus, and deep slow-wave sleep.
          </p>

          {/* Quick Action Bar: Start Protocol + Share Link */}
          <div className="flex flex-wrap items-center gap-3.5 pt-1">
            {isProtocolFullyActiveToday ? (
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.href = '/today'
                  } else {
                    router.push('/today')
                  }
                }}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>All {protocolStepModalityIds.length} Modalities Active in Today • Open Today</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>
            ) : (
              <button
                onClick={() => handleActivateProtocol(true)}
                disabled={isActivating}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 via-indigo-600 to-teal-500 hover:from-purple-500 hover:to-teal-400 text-white shadow-lg shadow-purple-500/25 transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isActivating ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin text-white" />
                    <span>Adding to Today’s Schedule...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-300 fill-current" />
                    <span>
                      {activeModalityCount > 0 
                        ? `Add Remaining ${missingStepModalityIds.length} Modalities to Today (${activeModalityCount}/${protocolStepModalityIds.length} Active)`
                        : `Start This Protocol Now • Add All ${protocolStepModalityIds.length} Modalities`
                      }
                    </span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </>
                )}
              </button>
            )}

            {/* Copy Share Link */}
            <button
              onClick={() => handleCopyLink(activeTab.slug)}
              className="inline-flex items-center gap-2 px-4 py-3.5 rounded-xl font-semibold text-sm bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 transition-all active:scale-95 cursor-pointer"
              title="Copy custom direct link for this protocol"
            >
              {copiedLink === activeTab.slug ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
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
              className="inline-flex items-center gap-2 px-4 py-3.5 rounded-xl font-semibold text-sm bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-700/50 transition-all active:scale-95 cursor-pointer"
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
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-md transition-all active:scale-95 cursor-pointer"
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
                <span>Top Protocols &amp; Modality Anchors</span>
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
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium border transition-all cursor-pointer ${getTabActiveStyle(tab.slug, isSelected)}`}
                >
                  <span className="text-base">{tab.icon}</span>
                  <span className="font-semibold">{tab.shortLabel}</span>
                  {isSelected && (
                    <span className={`w-2 h-2 rounded-full ${getTabDotColor(tab.slug)} animate-pulse ml-0.5`} />
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
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl font-sans">
                {currentProtocol.description}
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-shrink-0">
              <button
                onClick={() => handleCopyLink(activeTab.slug)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
              >
                {copiedLink === activeTab.slug ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  if (isProtocolFullyActiveToday) {
                    if (typeof window !== 'undefined') {
                      window.location.href = '/today'
                    } else {
                      router.push('/today')
                    }
                  } else {
                    handleActivateProtocol(true)
                  }
                }}
                disabled={isActivating}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer ${
                  isProtocolFullyActiveToday
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                    : 'bg-gradient-to-r from-purple-600 to-teal-500 hover:from-purple-500 hover:to-teal-400 text-white'
                }`}
              >
                {isProtocolFullyActiveToday ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>All {protocolStepModalityIds.length} Active in Schedule • View Today</span>
                  </>
                ) : missingStepModalityIds.length > 0 && activeModalityCount > 0 ? (
                  <>
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Add Remaining {missingStepModalityIds.length} Modalities ({activeModalityCount}/{protocolStepModalityIds.length} Active)</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Add All {protocolStepModalityIds.length} to Today</span>
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
              <div className="text-xs sm:text-sm font-semibold text-purple-400">{currentProtocol.steps?.length || 0} Modalities</div>
            </div>
          </div>

          {/* Protocol Steps Checklist & Circadian Arc View Mode Switcher */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-200 tracking-wide uppercase flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-400" />
                  <span>Sequenced Protocol Steps &amp; Dosing Parameters</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click any step for clinical paper, custom dosing, or 🔬 Geek Mode science.
                </p>
              </div>

              {/* View Switcher: Steps Checklist vs 24-Hour Circadian Arc */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('checklist')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === 'checklist'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ListChecks className="w-3.5 h-3.5" />
                  <span>Checklist ({currentProtocol.steps?.length || 0})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('circadian')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === 'circadian'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>24-Hour Arc</span>
                </button>
              </div>
            </div>

            {/* Checklist View */}
            {viewMode === 'checklist' && (
              <div className="space-y-3.5 animate-in fade-in duration-150">
                {(currentProtocol.steps || []).map((step: ProtocolStep, idx: number) => 
                  renderModalityCard(step, idx)
                )}
              </div>
            )}

            {/* 24-Hour Circadian Arc Diurnal View */}
            {viewMode === 'circadian' && (
              <div className="space-y-6 animate-in fade-in duration-150 pt-1">
                {CIRCADIAN_WINDOWS.map((win) => {
                  const windowSteps = (currentProtocol.steps || []).filter((s: ProtocolStep) => {
                    const slotNorm = (s.timing_slot || s.timing_anchor || '').toLowerCase().replace(/[-\s]/g, '_')
                    return win.slots.some(slotPattern => slotNorm.includes(slotPattern))
                  })

                  if (windowSteps.length === 0) return null

                  return (
                    <div key={win.id} className="space-y-3">
                      {/* Window Header */}
                      <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{win.icon}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="text-sm font-extrabold text-white">
                                {win.title}
                              </h5>
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${win.badgeColor}`}>
                                {windowSteps.length} {windowSteps.length === 1 ? 'Modality' : 'Modalities'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                              {win.subtitle}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Window Steps with vertical circadian connecting rail */}
                      <div className="relative pl-4 sm:pl-6 space-y-3 before:absolute before:left-2 sm:before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-purple-500/80 before:to-teal-500/80">
                        {windowSteps.map((step: ProtocolStep) => {
                          const originalIdx = (currentProtocol.steps || []).findIndex(s => s.id === step.id)
                          return renderModalityCard(step, originalIdx >= 0 ? originalIdx : 0)
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* 8-Vector Canonical Longevity Profile for Huberman DOAC OS */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:p-7 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
                <Award className="w-4 h-4 text-purple-400" />
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
              <p className="text-[11px] text-slate-400">Zone 2 mitochondrial respiration, left ventricular stroke volume, and vagal tone.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-emerald-400">⚡ Metabolic Health</span>
                <span className="text-xs font-bold text-white">90 / 100</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '90%' }} />
              </div>
              <p className="text-[11px] text-slate-400">GLUT4 glucose disposal walks, brown adipose tissue thermogenesis, and insulin sensitivity.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-amber-400">🛡️ Inflammation &amp; HPA</span>
                <span className="text-xs font-bold text-white">86 / 100</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '86%' }} />
              </div>
              <p className="text-[11px] text-slate-400">Autonomic vagal sigh resetting, delayed caffeine adenosine buffering, and stress resilience.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-blue-400">⚡ Testosterone &amp; Endocrine</span>
                <span className="text-xs font-bold text-white">84 / 100</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '84%' }} />
              </div>
              <p className="text-[11px] text-slate-400">Compound resistance mechanical tension, deep NREM pulsatile LH release, and cold dopamine.</p>
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
                <Share2 className="w-4 h-4 text-sky-400" />
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
                  className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
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
          initialShowGeekMode={true}
          initialShowLongevityDrawer={true}
        />
      )}
    </div>
  )
}
