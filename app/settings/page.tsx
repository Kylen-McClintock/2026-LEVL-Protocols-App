'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { User, RefreshCw, Activity, Target, Bookmark, ChevronRight, Cloud, LogOut, Sparkles } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { getOrCreateUserProfile, getOutcomeDimensions } from '@/lib/data'
import { UserProfile, OutcomeDimension } from '@/lib/types'
import ProfileEditor from '@/components/profile/ProfileEditor'
import QuickHotkeysProfileCard from '@/components/profile/QuickHotkeysProfileCard'
import CircadianAnchorsCard from '@/components/profile/CircadianAnchorsCard'
import FastingFeedingCard from '@/components/profile/FastingFeedingCard'
import PhysicalTrainingRecoveryCard from '@/components/profile/PhysicalTrainingRecoveryCard'
import HardwareAccessCard from '@/components/profile/HardwareAccessCard'
import BloodworkProfileCard from '@/components/profile/BloodworkProfileCard'
import NegativeLongevityFactorsCard from '@/components/profile/NegativeLongevityFactorsCard'
import TemperatureUnitSettingsCard from '@/components/profile/TemperatureUnitSettingsCard'

export default function SettingsPage() {
  const { user, signOut, openAuthModal } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [outcomes, setOutcomes] = useState<OutcomeDimension[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const localUserId = getLocalUserId()
    const [data, outcomeData] = await Promise.all([
      getOrCreateUserProfile(localUserId),
      getOutcomeDimensions()
    ])
    setProfile(data)
    setOutcomes(outcomeData)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

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
              <span className="text-xs font-bold text-white group-hover:text-sky-300 block truncate transition-colors">Tracking &amp; ROI</span>
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
        {/* Cloud Sync & Account Status Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-purple-500/30 shadow-xl space-y-3 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${user ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-purple-500/10 border border-purple-500/30 text-purple-400'}`}>
                <Cloud size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">
                    {user ? 'Cloud Account Synced' : 'Guest Account (Local Only)'}
                  </h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${user ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'}`}>
                    {user ? 'Online' : 'Local Storage'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {user 
                    ? `Connected as ${user.email || 'Authenticated User'}. Streaks & data backed up.`
                    : 'Your protocol data is currently stored only on this browser.'}
                </p>
              </div>
            </div>

            {user ? (
              <button
                type="button"
                onClick={signOut}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <LogOut size={13} /> Sign Out
              </button>
            ) : (
              <button
                type="button"
                onClick={openAuthModal}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs transition-all shadow-lg flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Sparkles size={13} /> Sync to Cloud
              </button>
            )}
          </div>
        </div>

        {profile && <ProfileEditor profile={profile} outcomes={outcomes} />}

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
    </div>
  )
}
