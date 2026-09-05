'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { User, RefreshCw, Activity, Target, Bookmark, ChevronRight, Cloud, LogOut, Sparkles, Camera, BookOpen, RotateCcw, Dna } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { getOrCreateUserProfile, getOutcomeDimensions, getModalities, getDailyProtocolTasks } from '@/lib/data'
import { UserProfile, OutcomeDimension, Modality, DailyProtocolTask } from '@/lib/types'
import { format } from 'date-fns'
import ProfileEditor from '@/components/profile/ProfileEditor'
import FunctionalOutcomesRankingCard from '@/components/profile/FunctionalOutcomesRankingCard'
import QuickHotkeysProfileCard from '@/components/profile/QuickHotkeysProfileCard'
import CircadianAnchorsCard from '@/components/profile/CircadianAnchorsCard'
import FastingFeedingCard from '@/components/profile/FastingFeedingCard'
import PhysicalTrainingRecoveryCard from '@/components/profile/PhysicalTrainingRecoveryCard'
import HardwareAccessCard from '@/components/profile/HardwareAccessCard'
import BloodworkProfileCard from '@/components/profile/BloodworkProfileCard'
import NegativeLongevityFactorsCard from '@/components/profile/NegativeLongevityFactorsCard'
import MedicalHistoryPrescriptionsCard from '@/components/profile/MedicalHistoryPrescriptionsCard'
import TemperatureUnitSettingsCard from '@/components/profile/TemperatureUnitSettingsCard'
import DataSovereigntyCard from '@/components/profile/DataSovereigntyCard'
import SupplementScannerModal from '@/components/modals/SupplementScannerModal'
import { linkGuestDataToAuthUser } from '@/lib/auth/linkGuestData'

export default function SettingsPage() {
  const { 
    user, 
    signOut, 
    openAuthModal,
    localUserId: authUserId,
    loading: authLoading
  } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [outcomes, setOutcomes] = useState<OutcomeDimension[]>([])
  const [catalogModalities, setCatalogModalities] = useState<Modality[]>([])
  const [tasks, setTasks] = useState<DailyProtocolTask[]>([])
  const [showSupplementScanner, setShowSupplementScanner] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncSuccess, setSyncSuccess] = useState(false)

  const load = async () => {
    const localUserId = authUserId || (typeof window !== 'undefined' ? localStorage.getItem('levl_local_user_id') : '') || getLocalUserId()
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const [data, outcomeData, modsData, taskData] = await Promise.all([
      getOrCreateUserProfile(localUserId),
      getOutcomeDimensions(),
      getModalities(),
      getDailyProtocolTasks(localUserId, todayStr)
    ])
    setProfile(data)
    setOutcomes(outcomeData)
    setCatalogModalities(modsData || [])
    setTasks(taskData || [])
    setLoading(false)
  }

  useEffect(() => {
    if (authLoading) return
    load()

    const handleAuthChange = () => {
      load()
    }
    const handleProfileUpdate = (e: any) => {
      if (e.detail) {
        setProfile(prev => prev ? { ...prev, ...e.detail } : e.detail)
      }
    }
    const handleProtocolUpdate = () => {
      const localUserId = authUserId || (typeof window !== 'undefined' ? localStorage.getItem('levl_local_user_id') : '') || getLocalUserId()
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      getDailyProtocolTasks(localUserId, todayStr).then(t => {
        if (t) setTasks(t)
      })
    }
    window.addEventListener('levl_auth_user_changed', handleAuthChange)
    window.addEventListener('levl_profile_updated', handleProfileUpdate)
    window.addEventListener('levl_protocol_updated', handleProtocolUpdate)
    return () => {
      window.removeEventListener('levl_auth_user_changed', handleAuthChange)
      window.removeEventListener('levl_profile_updated', handleProfileUpdate)
      window.removeEventListener('levl_protocol_updated', handleProtocolUpdate)
    }
  }, [authLoading, authUserId])

  const handleManualSync = async () => {
    if (!user) {
      openAuthModal()
      return
    }
    try {
      setIsSyncing(true)
      const cachedGuestId = typeof window !== 'undefined' ? (localStorage.getItem('levl_prev_guest_id') || '') : ''
      if (cachedGuestId && user) {
        await linkGuestDataToAuthUser(cachedGuestId, user)
      }
      await load()
      setSyncSuccess(true)
      setTimeout(() => setSyncSuccess(false), 3000)
    } catch (e) {
      console.error('Manual sync failed:', e)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleReset = () => {
    if (confirm('Reset all demo data? This will clear your local user id.')) {
      localStorage.removeItem('levl_local_user_id')
      window.location.href = '/'
    }
  }

  if (loading) return <div className="flex h-screen items-center justify-center animate-pulse text-levl-text-secondary">Loading profile...</div>

  return (
    <div className="p-4 max-w-2xl mx-auto pt-8 pb-20">
      <header className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><User size={24} className="text-levl-accent" /> Profile &amp; Settings</h1>
      </header>

      {/* Quick Biological Hub Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-6">
        <Link
          href="/aging"
          className="p-3 rounded-2xl bg-slate-900/80 border border-emerald-500/20 hover:border-emerald-500/50 transition-all shadow-md group flex items-center justify-between backdrop-blur-md"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <Activity size={16} />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white group-hover:text-emerald-300 block truncate transition-colors">Biological Age</span>
              <span className="text-[10px] text-slate-400 block truncate">PhenoAge &amp; Calico</span>
            </div>
          </div>
          <ChevronRight size={14} className="text-slate-500 group-hover:text-white transition-colors shrink-0" />
        </Link>

        <Link
          href="/tracking"
          className="p-3 rounded-2xl bg-slate-900/80 border border-sky-500/20 hover:border-sky-500/50 transition-all shadow-md group flex items-center justify-between backdrop-blur-md"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
              <Target size={16} />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white group-hover:text-sky-300 block truncate transition-colors">Insights &amp; ROI</span>
              <span className="text-[10px] text-slate-400 block truncate">Habits &amp; Synergies</span>
            </div>
          </div>
          <ChevronRight size={14} className="text-slate-500 group-hover:text-white transition-colors shrink-0" />
        </Link>

        <Link
          href="/bench"
          className="p-3 rounded-2xl bg-slate-900/80 border border-purple-500/20 hover:border-purple-500/50 transition-all shadow-md group flex items-center justify-between backdrop-blur-md"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
              <Bookmark size={16} />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white group-hover:text-purple-300 block truncate transition-colors">My Bench</span>
              <span className="text-[10px] text-slate-400 block truncate">Saved Modalities</span>
            </div>
          </div>
          <ChevronRight size={14} className="text-slate-500 group-hover:text-white transition-colors shrink-0" />
        </Link>
      </div>

      <div className="space-y-6">
        {/* Guided Protocol Calibration Walkthrough Card */}
        <Link
          href="/onboarding?mode=recalibrate"
          className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-500/40 hover:border-emerald-400/70 shadow-xl transition-all block group relative overflow-hidden backdrop-blur-md"
        >
          <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-bold shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <Dna size={20} className="text-emerald-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-extrabold text-white group-hover:text-emerald-300 transition-colors">
                    Guided Protocol Calibration &amp; Setup
                  </h3>
                  <span className="text-[9px] bg-emerald-950 border border-emerald-800 text-emerald-300 px-2 py-0.5 rounded-full font-mono font-bold uppercase">
                    5-Step Wizard
                  </span>
                </div>
                <p className="text-xs text-slate-300 line-clamp-1 mt-0.5">
                  Walk back through your biometrics, circadian anchors, training schedule, and target outcomes with context explanations.
                </p>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-700/50 text-emerald-300 group-hover:text-white group-hover:bg-emerald-900 transition-all shrink-0">
              <ChevronRight size={16} />
            </div>
          </div>
        </Link>
        {/* LEVL Visual Feature Guide & App Tour Card */}
        <Link
          href="/guide"
          className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-950/70 via-slate-900 to-slate-900 border border-purple-500/40 hover:border-purple-400/70 shadow-xl transition-all block group relative overflow-hidden backdrop-blur-md"
        >
          <div className="absolute top-0 right-0 w-36 h-36 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center font-bold shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                <BookOpen size={20} className="text-purple-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-extrabold text-white group-hover:text-purple-300 transition-colors">
                    Visual Feature Guide &amp; App Tour
                  </h3>
                  <span className="text-[9px] bg-purple-950 border border-purple-800 text-purple-300 px-2 py-0.5 rounded-full font-mono font-bold uppercase">
                    Interactive Playbook
                  </span>
                </div>
                <p className="text-xs text-slate-300 line-clamp-1 mt-0.5">
                  Visual walkthrough for Today timeline, Outcomes, Fasting hub, Modality studio &amp; Biomarkers.
                </p>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-700/50 text-purple-300 group-hover:text-white group-hover:bg-purple-900 transition-all shrink-0">
              <ChevronRight size={16} />
            </div>
          </div>
        </Link>

        {/* Cloud Sync & Account Status Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-purple-500/30 shadow-xl space-y-4 backdrop-blur-md">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${user ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-purple-500/10 border border-purple-500/30 text-purple-400'}`}>
                <Cloud size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">
                    {user ? 'Cloud Account Synced' : 'Guest Account (This Device Only)'}
                  </h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${user ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'}`}>
                    {user ? 'Online' : 'Local Only'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {user 
                    ? `Connected as ${user.email}. Streaks and stacks are synced across all devices.`
                    : 'Sign in to sync your stacks, logs, and biomarkers across your phone and computer.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <button
                    type="button"
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
                    <span>{syncSuccess ? '✓ Synced!' : isSyncing ? 'Syncing...' : 'Sync Cloud Data'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={signOut}
                    className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <LogOut size={13} /> Sign Out
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={openAuthModal}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white font-bold text-xs transition-all shadow-lg flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Sparkles size={13} /> Sync Across Devices
                </button>
              )}
            </div>
          </div>
        </div>

        {/* AI Supplement Facts Scanner Banner Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-950/40 via-slate-900 to-indigo-950/30 border border-purple-500/30 shadow-xl space-y-4 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-300 flex items-center justify-center shrink-0 shadow-sm">
                <Camera size={20} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    AI Supplement Label Scanner
                  </h3>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Gemini Vision
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Snap any supplement bottle facts to auto-match modalities, calibrate exact dosages, or generate complex blends.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSupplementScanner(true)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white font-extrabold text-xs transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Camera size={14} />
              <span>Scan Supplement</span>
            </button>
          </div>
        </div>

        {profile && <ProfileEditor profile={profile} outcomes={outcomes} />}

        {profile && (
          <MedicalHistoryPrescriptionsCard 
            profile={profile} 
            localUserId={authUserId || (typeof window !== 'undefined' ? localStorage.getItem('levl_local_user_id') : '') || getLocalUserId()}
            tasks={tasks}
            onProfileUpdated={(updated) => setProfile(updated)} 
          />
        )}

        {profile && (
          <FunctionalOutcomesRankingCard 
            profile={profile} 
            outcomes={outcomes} 
            onUpdated={(updated) => setProfile(updated)} 
          />
        )}

        {profile && (
          <QuickHotkeysProfileCard 
            profile={profile} 
            onUpdated={(updated) => setProfile(updated)} 
          />
        )}

        {profile && (
          <CircadianAnchorsCard 
            profile={profile} 
            onUpdated={(updated) => setProfile(updated)} 
          />
        )}

        {profile && (
          <FastingFeedingCard 
            profile={profile} 
            onUpdated={(updated) => setProfile(updated)} 
          />
        )}

        {profile && (
          <PhysicalTrainingRecoveryCard 
            profile={profile} 
            onUpdated={(updated) => setProfile(updated)} 
          />
        )}

        {profile && (
          <HardwareAccessCard 
            profile={profile} 
            onUpdated={(updated) => setProfile(updated)} 
          />
        )}

        {profile && <BloodworkProfileCard profile={profile} />}

        {profile && (
          <NegativeLongevityFactorsCard 
            profile={profile} 
            onUpdated={(updated) => setProfile(updated)} 
          />
        )}

        <TemperatureUnitSettingsCard />

        <DataSovereigntyCard 
          localUserId={authUserId || (typeof window !== 'undefined' ? localStorage.getItem('levl_local_user_id') : '') || getLocalUserId()} 
        />

        <div className="glass-card p-4 rounded-xl border-red-900/30 mt-8">
          <h3 className="font-bold text-red-400 mb-2">Danger Zone</h3>
          <p className="text-sm text-levl-text-secondary mb-4">Reset your local demo profile and data.</p>
          <button 
            onClick={handleReset}
            className="bg-red-950/50 hover:bg-red-900 border border-red-900/50 text-red-200 py-2 px-4 rounded-lg text-sm w-full flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw size={16} /> Reset Demo Data
          </button>
        </div>
      </div>

      {/* AI Supplement Scanner Modal */}
      <SupplementScannerModal
        isOpen={showSupplementScanner}
        onClose={() => setShowSupplementScanner(false)}
        catalogModalities={catalogModalities}
        onIngestSuccess={() => {
          load()
        }}
      />
    </div>
  )
}
