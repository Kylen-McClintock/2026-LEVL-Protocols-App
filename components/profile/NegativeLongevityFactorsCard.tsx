'use client'

import React, { useState } from 'react'
import { UserProfile } from '@/lib/types'
import { updateUserProfile } from '@/lib/data'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { ShieldAlert, Check, Wine, Cigarette, Armchair, Coffee, ChevronDown, ChevronUp } from 'lucide-react'

export default function NegativeLongevityFactorsCard({
  profile,
  onUpdated
}: {
  profile: UserProfile
  onUpdated?: (updated: UserProfile) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const scores = profile.outcome_preference_scores || {}

  const [alcohol, setAlcohol] = useState<string>(
    scores.negative_alcohol === 0 ? 'none' : scores.negative_alcohol === 3 ? 'occasional' : scores.negative_alcohol === 6 ? 'moderate' : scores.negative_alcohol === 9 ? 'frequent' : 'skip'
  )
  const [nicotine, setNicotine] = useState<string>(
    scores.negative_nicotine === 0 ? 'none' : scores.negative_nicotine === 7 ? 'cigarettes' : 'skip'
  )
  const [sitting, setSitting] = useState<string>(
    scores.negative_sitting === 1 ? 'under_4h' : scores.negative_sitting === 4 ? '4_7h' : scores.negative_sitting === 8 ? '8_10h' : scores.negative_sitting === 10 ? 'over_10h' : 'skip'
  )
  const [caffeine, setCaffeine] = useState<string>(
    scores.negative_caffeine === 0 ? 'never' : scores.negative_caffeine === 3 ? 'rarely' : scores.negative_caffeine === 8 ? 'frequent' : 'skip'
  )

  const autoSave = async (updatedFields: {
    alcohol?: string
    nicotine?: string
    sitting?: string
    caffeine?: string
  }) => {
    setSaving(true)
    try {
      const localUserId = getLocalUserId()
      const alc = updatedFields.alcohol !== undefined ? updatedFields.alcohol : alcohol
      const nic = updatedFields.nicotine !== undefined ? updatedFields.nicotine : nicotine
      const sit = updatedFields.sitting !== undefined ? updatedFields.sitting : sitting
      const caf = updatedFields.caffeine !== undefined ? updatedFields.caffeine : caffeine

      const updatedScores = {
        ...scores,
        negative_alcohol: alc === 'none' ? 0 : (alc === 'occasional' ? 3 : (alc === 'moderate' ? 6 : (alc === 'frequent' ? 9 : undefined))),
        negative_nicotine: nic === 'none' ? 0 : (nic !== 'skip' ? 7 : undefined),
        negative_sitting: sit === 'under_4h' ? 1 : (sit === '4_7h' ? 4 : (sit === '8_10h' ? 8 : (sit === 'over_10h' ? 10 : undefined))),
        negative_caffeine: caf === 'never' ? 0 : (caf === 'rarely' ? 3 : (caf !== 'skip' ? 8 : undefined))
      }

      const updated = await updateUserProfile(localUserId, {
        outcome_preference_scores: updatedScores
      })

      if (updated && onUpdated) {
        onUpdated(updated)
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-white/10 shadow-lg space-y-4 backdrop-blur-md">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-start justify-between cursor-pointer gap-3"
      >
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldAlert size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Risk Factor Audit &amp; Negative Longevity Factors</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Optional lifestyle baseline: alcohol, nicotine, sitting duration, late caffeine.
            </p>
            <div className="flex items-center gap-1.5 mt-2 text-[10px] font-mono">
              {saving ? (
                <span className="text-rose-400 font-bold animate-pulse">Saving...</span>
              ) : saved ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Check size={11} /> Auto-saved
                </span>
              ) : (
                <span className="text-slate-500 font-medium">Auto-saves on change</span>
              )}
            </div>
          </div>
        </div>

        <button type="button" className="text-slate-400 hover:text-white p-1 shrink-0 mt-1">
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {isOpen && (
        <div className="space-y-4 pt-3 border-t border-white/5 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Alcohol */}
            <div className="space-y-1.5 bg-black/40 p-3 rounded-xl border border-white/10">
              <label className="font-bold text-white flex items-center gap-1.5">
                <Wine size={14} className="text-rose-400" /> Alcohol Consumption
              </label>
              <select
                value={alcohol}
                onChange={(e) => {
                  const val = e.target.value
                  setAlcohol(val)
                  autoSave({ alcohol: val })
                }}
                className="w-full bg-black/60 border border-white/20 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-rose-500"
              >
                <option value="skip">-- Skip / Not Tracked --</option>
                <option value="none">None (Zero Alcohol / Teetotaler)</option>
                <option value="occasional">Occasional (1-2 drinks/week)</option>
                <option value="moderate">Moderate (3-7 drinks/week)</option>
                <option value="frequent">Heavy / Frequent (8+ drinks/week)</option>
              </select>
            </div>

            {/* Nicotine */}
            <div className="space-y-1.5 bg-black/40 p-3 rounded-xl border border-white/10">
              <label className="font-bold text-white flex items-center gap-1.5">
                <Cigarette size={14} className="text-amber-400" /> Nicotine &amp; Tobacco
              </label>
              <select
                value={nicotine}
                onChange={(e) => {
                  const val = e.target.value
                  setNicotine(val)
                  autoSave({ nicotine: val })
                }}
                className="w-full bg-black/60 border border-white/20 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="skip">-- Skip / Not Tracked --</option>
                <option value="none">None</option>
                <option value="cigarettes">Cigarettes / Smoking</option>
                <option value="vaping">Vaping / E-Cigarettes</option>
                <option value="pouches">Nicotine Pouches / Gum</option>
              </select>
            </div>

            {/* Sitting */}
            <div className="space-y-1.5 bg-black/40 p-3 rounded-xl border border-white/10">
              <label className="font-bold text-white flex items-center gap-1.5">
                <Armchair size={14} className="text-blue-400" /> Daily Sedentary Hours
              </label>
              <select
                value={sitting}
                onChange={(e) => {
                  const val = e.target.value
                  setSitting(val)
                  autoSave({ sitting: val })
                }}
                className="w-full bg-black/60 border border-white/20 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="skip">-- Skip / Not Tracked --</option>
                <option value="under_4h">Under 4 hours/day (Active)</option>
                <option value="4_7h">4 to 7 hours/day (Moderate desk time)</option>
                <option value="8_10h">8 to 10 hours/day (Heavy sedentary)</option>
                <option value="over_10h">10+ hours/day (Prolonged sitting)</option>
              </select>
            </div>

            {/* Caffeine */}
            <div className="space-y-1.5 bg-black/40 p-3 rounded-xl border border-white/10">
              <label className="font-bold text-white flex items-center gap-1.5">
                <Coffee size={14} className="text-amber-400" /> Late Afternoon Caffeine
              </label>
              <select
                value={caffeine}
                onChange={(e) => {
                  const val = e.target.value
                  setCaffeine(val)
                  autoSave({ caffeine: val })
                }}
                className="w-full bg-black/60 border border-white/20 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="skip">-- Skip / Not Tracked --</option>
                <option value="never">Never (Cut off before 12 PM)</option>
                <option value="rarely">Rarely (Occasional late coffee)</option>
                <option value="frequent">2-3x / week after 2 PM</option>
                <option value="daily">Daily after 2-4 PM</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
