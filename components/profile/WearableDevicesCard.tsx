'use client'

import React, { useState } from 'react'
import { UserProfile } from '@/lib/types'
import { updateUserProfile } from '@/lib/data'
import { Watch, Check, Sparkles, ChevronDown, ChevronUp, Link as LinkIcon, Radio, Shield, Info, X } from 'lucide-react'

interface WearableDevicesCardProps {
  profile: UserProfile
  onUpdated?: (updated: UserProfile) => void
}

export interface WearableDeviceOption {
  id: string
  name: string
  models: string
  emoji: string
  brandColor: string
  metrics: string[]
}

export const SUPPORTED_WEARABLES: WearableDeviceOption[] = [
  {
    id: 'oura',
    name: 'Oura Ring',
    models: 'Gen 3, Horizon, Heritage',
    emoji: '💍',
    brandColor: 'from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/40',
    metrics: ['Readiness Score', 'Sleep Stages', 'HRV Balance', 'Skin Temp']
  },
  {
    id: 'whoop',
    name: 'Whoop',
    models: '4.0, 3.0 Band',
    emoji: '⚡',
    brandColor: 'from-rose-500/20 to-red-500/20 text-rose-300 border-rose-500/40',
    metrics: ['Recovery %', 'Day Strain', 'Sleep Performance', 'HRV']
  },
  {
    id: 'apple_watch',
    name: 'Apple Watch',
    models: 'Ultra, Series 9/8/7, SE',
    emoji: '⌚',
    brandColor: 'from-blue-500/20 to-indigo-500/20 text-blue-300 border-blue-500/40',
    metrics: ['Resting HR', 'Wrist Temp', 'Apple Health Sleep', 'SDNN HRV']
  },
  {
    id: 'garmin',
    name: 'Garmin',
    models: 'Fenix, Forerunner, Epix, Venu',
    emoji: '🏃',
    brandColor: 'from-cyan-500/20 to-teal-500/20 text-cyan-300 border-cyan-500/40',
    metrics: ['Body Battery', 'HRV Status', 'Training Readiness', 'VO2 Max']
  },
  {
    id: 'samsung_watch',
    name: 'Samsung Galaxy Watch',
    models: 'Galaxy Watch 6, 5 Pro, Classic',
    emoji: '⌚',
    brandColor: 'from-indigo-500/20 to-purple-500/20 text-indigo-300 border-indigo-500/40',
    metrics: ['Energy Score', 'Sleep Animal', 'Body Composition', 'HRV']
  },
  {
    id: 'pixel_watch',
    name: 'Google Pixel Watch',
    models: 'Pixel Watch 2, Pixel Watch 1',
    emoji: '📱',
    brandColor: 'from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/40',
    metrics: ['Daily Readiness Score', 'Sleep Profile', 'cEDA Stress', 'Skin Temp']
  },
  {
    id: 'fitbit',
    name: 'Fitbit',
    models: 'Sense 2, Versa 4, Charge 6, Inspire',
    emoji: '🏃',
    brandColor: 'from-teal-500/20 to-emerald-500/20 text-teal-300 border-teal-500/40',
    metrics: ['Daily Readiness Score', 'Sleep Score', 'Stress Management', 'HRV']
  },
  {
    id: 'eight_sleep',
    name: 'Eight Sleep Pod',
    models: 'Pod 4, Pod 3 Cover',
    emoji: '🛏️',
    brandColor: 'from-sky-500/20 to-blue-500/20 text-sky-300 border-sky-500/40',
    metrics: ['Sleep Fitness Score', 'Autonomic Temp Shift', 'Respiratory Rate']
  },
  {
    id: 'ultrahuman',
    name: 'Ultrahuman Ring AIR',
    models: 'Ring AIR, M1 Glucose',
    emoji: '🟣',
    brandColor: 'from-purple-500/20 to-fuchsia-500/20 text-purple-300 border-purple-500/40',
    metrics: ['Recovery Index', 'Circadian Phase Alignment', 'Movement Index']
  },
  {
    id: 'polar',
    name: 'Polar',
    models: 'Vantage V3, Grit X Pro, Ignite',
    emoji: '❄️',
    brandColor: 'from-red-500/20 to-rose-500/20 text-red-300 border-red-500/40',
    metrics: ['Nightly Recharge', 'Sleep Plus Stages', 'Cardio Load Status']
  },
  {
    id: 'withings_other',
    name: 'Withings / Coros / Other',
    models: 'ScanWatch 2, Pace 3, Suunto',
    emoji: '⏱️',
    brandColor: 'from-slate-500/20 to-zinc-500/20 text-slate-300 border-slate-500/40',
    metrics: ['Vascular Age', 'Sleep Index', 'Continuous SpO2']
  }
]

export default function WearableDevicesCard({ profile, onUpdated }: WearableDevicesCardProps) {
  const prefs = profile.outcome_preference_scores || {}
  const savedWearables = prefs.wearables || {}

  const [hasWearable, setHasWearable] = useState<boolean>(
    profile.has_wearable ?? savedWearables.has_wearable ?? (profile.hardware_access?.includes('wearable') || false)
  )
  const [selectedDevices, setSelectedDevices] = useState<string[]>(
    profile.wearable_devices || savedWearables.devices || (hasWearable ? ['oura'] : [])
  )
  const [primaryDevice, setPrimaryDevice] = useState<string>(
    profile.primary_wearable || savedWearables.primary_device || (selectedDevices[0] || 'oura')
  )
  const [isExpanded, setIsExpanded] = useState<boolean>(hasWearable)
  const [showComingSoonModal, setShowComingSoonModal] = useState<boolean>(false)
  const [modalDevice, setModalDevice] = useState<WearableDeviceOption | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  const handleToggleHasWearable = async (enabled: boolean) => {
    setHasWearable(enabled)
    setIsExpanded(enabled)
    const nextDevices = enabled && selectedDevices.length === 0 ? ['oura'] : selectedDevices
    if (enabled && !primaryDevice) setPrimaryDevice(nextDevices[0] || 'oura')
    await saveChanges(enabled, nextDevices, enabled ? (primaryDevice || nextDevices[0] || 'oura') : '')
  }

  const handleToggleDevice = async (deviceId: string) => {
    let nextDevices: string[]
    if (selectedDevices.includes(deviceId)) {
      nextDevices = selectedDevices.filter(id => id !== deviceId)
    } else {
      nextDevices = [...selectedDevices, deviceId]
    }
    setSelectedDevices(nextDevices)

    let nextPrimary = primaryDevice
    if (!nextDevices.includes(primaryDevice) && nextDevices.length > 0) {
      nextPrimary = nextDevices[0]
      setPrimaryDevice(nextPrimary)
    }

    await saveChanges(hasWearable, nextDevices, nextPrimary)
  }

  const handleSetPrimary = async (deviceId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setPrimaryDevice(deviceId)
    if (!selectedDevices.includes(deviceId)) {
      const nextDevices = [...selectedDevices, deviceId]
      setSelectedDevices(nextDevices)
      await saveChanges(hasWearable, nextDevices, deviceId)
    } else {
      await saveChanges(hasWearable, selectedDevices, deviceId)
    }
  }

  const saveChanges = async (hasW: boolean, devices: string[], primary: string) => {
    setIsSaving(true)

    // Update hardware_access array as well to stay 100% in sync
    const currentHardware = profile.hardware_access || []
    let nextHardware = currentHardware.filter(h => h !== 'wearable')
    if (hasW) {
      nextHardware.push('wearable')
    }

    const updatedPrefs = {
      ...profile.outcome_preference_scores,
      wearables: {
        has_wearable: hasW,
        primary_device: primary,
        devices: devices
      },
      hardware_access: nextHardware
    }

    const updated = await updateUserProfile(profile.local_user_id, {
      has_wearable: hasW,
      primary_wearable: primary,
      wearable_devices: devices,
      hardware_access: nextHardware,
      outcome_preference_scores: updatedPrefs
    })

    setIsSaving(false)
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2000)

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('levl_profile_updated', { detail: updated }))
    }
    if (updated && onUpdated) onUpdated(updated)
  }

  const openIntegrateModal = (device: WearableDeviceOption, e: React.MouseEvent) => {
    e.stopPropagation()
    setModalDevice(device)
    setShowComingSoonModal(true)
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden transition-all duration-300 hover:border-slate-700/80 shadow-lg mb-6">
      {/* Glow highlight */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Watch className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Wearables & Biometric Trackers
              {savedSuccess && (
                <span className="text-xs text-emerald-400 font-normal animate-pulse flex items-center gap-1">
                  <Check className="w-3 h-3" /> Saved
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Personalizes your daily protocol strain and unlocks dynamic 80/20 routine adjustments.
            </p>
          </div>
        </div>

        {/* Has Wearable Binary Switch */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium hidden xs:inline">
            {hasWearable ? 'Enabled' : 'No Wearable'}
          </span>
          <button
            type="button"
            onClick={() => handleToggleHasWearable(!hasWearable)}
            className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none p-0.5 ${
              hasWearable ? 'bg-cyan-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                hasWearable ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Expandable Section */}
      {hasWearable && (
        <div className="mt-4 pt-4 border-t border-slate-800/70">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              Select Your Tracking Device(s)
              <span className="text-cyan-400 font-mono">({selectedDevices.length} active)</span>
            </span>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              {isExpanded ? (
                <>Collapse <ChevronUp className="w-3.5 h-3.5" /></>
              ) : (
                <>View All ({SUPPORTED_WEARABLES.length}) <ChevronDown className="w-3.5 h-3.5" /></>
              )}
            </button>
          </div>

          {/* Device Grid */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2.5 transition-all duration-300 ${
            !isExpanded ? 'max-h-[160px] overflow-hidden' : ''
          }`}>
            {SUPPORTED_WEARABLES.map(device => {
              const isSelected = selectedDevices.includes(device.id)
              const isPrimary = primaryDevice === device.id

              return (
                <div
                  key={device.id}
                  onClick={() => handleToggleDevice(device.id)}
                  className={`relative p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-800/80 border-cyan-500/50 shadow-sm shadow-cyan-500/10'
                      : 'bg-slate-950/40 border-slate-800/60 hover:border-slate-700/80 text-slate-400 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl shrink-0">{device.emoji}</span>
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          {device.name}
                          {isPrimary && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold uppercase tracking-wider">
                              Primary
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{device.models}</p>
                      </div>
                    </div>

                    {/* Checkbox indicator */}
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                        isSelected
                          ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                          : 'border-slate-700 bg-slate-900/60'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>

                  {/* Metrics preview & Actions */}
                  <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400 truncate max-w-[170px]">
                      {device.metrics.slice(0, 2).join(' • ')}
                    </span>

                    <div className="flex items-center gap-2">
                      {isSelected && !isPrimary && (
                        <button
                          type="button"
                          onClick={(e) => handleSetPrimary(device.id, e)}
                          className="text-[10px] text-slate-400 hover:text-cyan-300 transition-colors underline"
                        >
                          Make Primary
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => openIntegrateModal(device, e)}
                        className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
                      >
                        <LinkIcon className="w-2.5 h-2.5" /> Sync
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Quick Notice */}
          <div className="mt-3.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-300">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-white mb-0.5">How LEVL Uses Your Wearable Data</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                During your daily morning check-in, simply enter your device&apos;s daily Readiness or Recovery score (0–100%). LEVL uses this to dynamically scale down allostatic physical stress on low-battery days and suggest 80/20 Minimum Effective Dose routines.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Direct Sync Coming Soon Modal */}
      {showComingSoonModal && modalDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-2xl">
                  {modalDevice.emoji}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white flex items-center gap-2">
                    {modalDevice.name}
                  </h4>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                    <Sparkles className="w-3 h-3" /> Direct Sync Coming Soon
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowComingSoonModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                Native cloud OAuth 2.0 integration for <strong className="text-white">{modalDevice.name}</strong> is currently being finalized. Once live, your daily sleep stages, HRV trends, and readiness metrics will stream directly into LEVL automatically each morning.
              </p>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="font-semibold text-white block text-xs">In the Meantime:</span>
                <p className="text-[11px] text-slate-400">
                  You can input your morning <strong className="text-slate-200">{modalDevice.metrics[0] || 'Readiness'}</strong> score (0–100%) during your 15-second Daily Check-in. LEVL will instantly adapt your protocol schedule, protecting your nervous system and preserving your streaks.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowComingSoonModal(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-sm shadow-md transition-all"
              >
                Got It, Thanks
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
