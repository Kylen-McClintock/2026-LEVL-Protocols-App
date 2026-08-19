'use client'

import { useState, useEffect } from 'react'
import { updateUserProfile, getOrCreateUserProfile } from '@/lib/data'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { CheckCircle, SlidersHorizontal } from 'lucide-react'

export function ProfileInlineEditor({ message, onComplete }: { message: string, onComplete: () => void }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const uid = getLocalUserId()
      const data = await getOrCreateUserProfile(uid)
      setProfile(data)
      setLoading(false)
    }
    load()
  }, [])

  const handleChange = (field: string, value: any) => {
    setProfile((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    const uid = getLocalUserId()
    await updateUserProfile(uid, {
      discipline_level_0_99: profile.discipline_level_0_99,
      experimental_openness_0_99: profile.experimental_openness_0_99,
      weekly_time_budget_hours: profile.weekly_time_budget_hours,
      weekly_spend_budget_usd: profile.weekly_spend_budget_usd,
      chronotype: profile.chronotype,
      risk_tolerance: profile.risk_tolerance,
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => {
      onComplete()
    }, 1500)
  }

  if (loading) return <div className="text-levl-text-secondary animate-pulse text-sm mt-2">Loading your profile preferences...</div>

  return (
    <div className="bg-levl-surface border border-levl-border rounded-xl p-5 max-w-md w-full my-4 shadow-xl">
      <div className="flex items-center space-x-2 text-levl-text-primary font-semibold mb-2">
        <SlidersHorizontal size={16} className="text-levl-accent" />
        <span>Update Preferences</span>
      </div>
      <p className="text-xs text-levl-text-secondary mb-4">{message}</p>

      {saved ? (
        <div className="flex items-center space-x-2 text-green-400 p-4 bg-green-400/10 border border-green-400/20 rounded-lg">
          <CheckCircle size={18} />
          <span className="text-sm">Preferences saved successfully!</span>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Budget Slider */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Weekly Budget</span>
            </div>
            <div className="pl-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-levl-text-secondary">Spend Tolerance</span>
                <span className="text-yellow-500 font-bold">${profile?.weekly_spend_budget_usd || 50}/wk</span>
              </div>
              <input 
                type="range" min="0" max="500" step="10"
                value={profile?.weekly_spend_budget_usd || 50} 
                onChange={(e) => handleChange('weekly_spend_budget_usd', parseInt(e.target.value))}
                className="w-full accent-yellow-500 h-1.5 bg-levl-background rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Time Slider */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Time Commitment</span>
            </div>
            <div className="pl-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-levl-text-secondary">Max Time per Week</span>
                <span className="text-blue-400 font-bold">{profile?.weekly_time_budget_hours || 5} hrs</span>
              </div>
              <input 
                type="range" min="1" max="20" step="1"
                value={profile?.weekly_time_budget_hours || 5} 
                onChange={(e) => handleChange('weekly_time_budget_hours', parseInt(e.target.value))}
                className="w-full accent-blue-400 h-1.5 bg-levl-background rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Complexity Slider */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Complexity / Effort Tolerance</span>
            </div>
            <div className="pl-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-levl-text-secondary">Tolerance Level</span>
                <span className="text-purple-400 font-bold">{profile?.discipline_level_0_99 || 50}%</span>
              </div>
              <div className="flex justify-between text-[10px] text-levl-text-secondary mb-1">
                <span>Simple & Easy</span>
                <span>Highly Complex</span>
              </div>
              <input 
                type="range" min="1" max="100"
                value={profile?.discipline_level_0_99 || 50} 
                onChange={(e) => handleChange('discipline_level_0_99', parseInt(e.target.value))}
                className="w-full accent-purple-400 h-1.5 bg-levl-background rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Evidence Slider */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Evidence vs Emerging</span>
            </div>
            <div className="pl-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-levl-text-secondary">Openness to Emerging Science</span>
                <span className="text-levl-accent font-bold">{profile?.experimental_openness_0_99 || 50}%</span>
              </div>
              <div className="flex justify-between text-[10px] text-levl-text-secondary mb-1">
                <span>Proven Clinical Only</span>
                <span>Bleeding Edge</span>
              </div>
              <input 
                type="range" min="1" max="100"
                value={profile?.experimental_openness_0_99 || 50} 
                onChange={(e) => handleChange('experimental_openness_0_99', parseInt(e.target.value))}
                className="w-full accent-levl-accent h-1.5 bg-levl-background rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Safety / Side Effects Slider */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Side Effect Tolerance</span>
            </div>
            <div className="pl-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-levl-text-secondary">Tolerance for Side Effects</span>
                <span className="text-red-400 font-bold">
                  {profile?.risk_tolerance === 'high_risk' ? 'High Risk' : profile?.risk_tolerance === 'moderate_risk' ? 'Moderate Risk' : 'Low Risk'}
                </span>
              </div>
              <div className="flex justify-between text-[10px] text-levl-text-secondary mb-1">
                <span>Completely Safe</span>
                <span>High Risk/Reward</span>
              </div>
              <input 
                type="range" min="1" max="3" step="1"
                value={profile?.risk_tolerance === 'high_risk' ? 3 : profile?.risk_tolerance === 'moderate_risk' ? 2 : 1} 
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  const riskMapping: Record<number, string> = { 1: 'low_risk', 2: 'moderate_risk', 3: 'high_risk' };
                  handleChange('risk_tolerance', riskMapping[val]);
                }}
                className="w-full accent-red-400 h-1.5 bg-levl-background rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          <button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full bg-levl-accent text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors mt-2 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      )}
    </div>
  )
}
