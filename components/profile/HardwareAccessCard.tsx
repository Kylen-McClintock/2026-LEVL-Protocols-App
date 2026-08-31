'use client'

import React, { useState } from 'react'
import { UserProfile } from '@/lib/types'
import { updateUserProfile } from '@/lib/data'
import { Dumbbell, Check, CheckCircle2, ShieldCheck, Sparkles, SlidersHorizontal } from 'lucide-react'

interface HardwareAccessCardProps {
  profile: UserProfile
  onUpdated?: (updated: UserProfile) => void
}

const HARDWARE_ITEMS = [
  {
    id: 'cold_plunge',
    label: 'Cold Plunge / Ice Tub',
    emoji: '🧊',
    desc: 'Dedicated cold tub, chest freezer, or commercial cold immersion facility.'
  },
  {
    id: 'sauna',
    label: 'Sauna (Finnish 174°F+ or Infrared)',
    emoji: '🧖',
    desc: 'Traditional high-heat Finnish sauna or full-spectrum infrared sauna.'
  },
  {
    id: 'red_light',
    label: 'Red Light / Photobiomodulation Panel',
    emoji: '🔴',
    desc: '660nm red and 850nm near-infrared LED panel for mitochondrial ATP synthesis.'
  },
  {
    id: 'cgm',
    label: 'Continuous Glucose Monitor (CGM)',
    emoji: '🩸',
    desc: 'Real-time interstitial glucose sensor (Dexcom, FreeStyle Libre, Abbott).'
  },
  {
    id: 'wearable',
    label: 'Biometric Wearable Tracker',
    emoji: '⌚',
    desc: 'Oura Ring, Whoop 4.0, Apple Watch, Garmin, or Eight Sleep pod.'
  },
  {
    id: 'gym',
    label: 'Full Gym / Free Weights & Barbell',
    emoji: '🏋️',
    desc: 'Access to heavy barbells, squat rack, dumbbells, or cable resistance machines.'
  },
  {
    id: 'bp_cuff',
    label: 'Blood Pressure Monitor',
    emoji: '🫀',
    desc: 'Upper arm automated blood pressure cuff for cardiovascular tracking.'
  },
  {
    id: 'mouth_tape',
    label: 'Sleep Mouth Tape / Nasal Dilator',
    emoji: '👃',
    desc: 'Hypoallergenic mouth tape or nasal strips for obligate nasal breathing.'
  }
]

export default function HardwareAccessCard({ profile, onUpdated }: HardwareAccessCardProps) {
  const prefs = profile.outcome_preference_scores || {}

  const [hardware, setHardware] = useState<string[]>(
    profile.hardware_access || prefs.hardware_access || [
      'cold_plunge',
      'sauna',
      'wearable',
      'gym',
      'mouth_tape'
    ]
  )
  const [isSaving, setIsSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  const autoSave = async (updatedHardware: string[]) => {
    setIsSaving(true)
    const updatedPrefs = {
      ...profile.outcome_preference_scores,
      hardware_access: updatedHardware
    }

    const updated = await updateUserProfile(profile.local_user_id, {
      hardware_access: updatedHardware,
      outcome_preference_scores: updatedPrefs
    })

    setIsSaving(false)
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2000)
    if (updated && onUpdated) onUpdated(updated)
  }

  const toggleItem = (itemId: string) => {
    const nextHardware = hardware.includes(itemId)
      ? hardware.filter(id => id !== itemId)
      : [...hardware, itemId]
    setHardware(nextHardware)
    autoSave(nextHardware)
  }

  return (
    <div className="glass-card p-5 sm:p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md shadow-xl space-y-5">
      {/* Header */}
      <div className="space-y-2 pb-3 border-b border-slate-800/80">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center shadow-md shrink-0 mt-0.5">
            <Dumbbell size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2 flex-wrap">
              <span>Biohacking Hardware &amp; Facility Access</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {hardware.length}/{HARDWARE_ITEMS.length} Available
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Personalizes protocol recommendations based on equipment you own or access
            </p>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] font-mono">
              {isSaving ? (
                <span className="text-purple-400 font-bold animate-pulse">Saving...</span>
              ) : savedSuccess ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Check size={12} /> Auto-saved
                </span>
              ) : (
                <span className="text-slate-500 font-medium">Auto-saves on change</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hardware Checklist Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {HARDWARE_ITEMS.map((item) => {
          const isChecked = hardware.includes(item.id)
          return (
            <div
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                isChecked
                  ? 'bg-purple-950/30 border-purple-500/50 text-white shadow-md'
                  : 'bg-slate-950/50 border-slate-800/80 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span className="text-xl shrink-0 mt-0.5">{item.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isChecked ? 'text-purple-200' : 'text-slate-300'}`}>
                    {item.label}
                  </span>
                  <div
                    className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors shrink-0 ml-2 ${
                      isChecked
                        ? 'bg-purple-500 border-purple-400 text-black'
                        : 'border-slate-700 bg-slate-900'
                    }`}
                  >
                    {isChecked && <Check size={12} className="stroke-[3]" />}
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">{item.desc}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer Info Pill */}
      <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center gap-2 text-xs text-slate-300">
        <ShieldCheck size={15} className="text-purple-400 shrink-0" />
        <span>
          Modality recommendations in Explore and Today will prioritize protocols matching your available hardware.
        </span>
      </div>
    </div>
  )
}
