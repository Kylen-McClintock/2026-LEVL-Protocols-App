'use client'

import React, { useState, useEffect } from 'react'
import { X, Check, Activity, Zap, HeartPulse, Wind, Dumbbell, Footprints, Armchair, UserCheck, Flame, Scale, Ruler, Play, RotateCcw, Plus, Minus } from 'lucide-react'
import { GET_ALL_REGISTRY_ENTRIES, MEASUREMENT_REGISTRY } from '../../lib/aging-models/measurementRegistry'
import { saveBiologicalMeasurement } from '../../lib/data/physiologicalAgeData'
import ReactionTimeApplet from '../applets/ReactionTimeApplet'
import SilhouetteVisual from '../ui/SilhouetteVisual'
import { ModalityExecutionGuide } from '../modals/ModalityExecutionGuide'
import { getModalityVideoInfo } from '../../lib/data/modalityVideos'

interface AddMeasurementModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  initialMeasurementId?: string
  onSaved?: () => void
}

export default function AddMeasurementModal({
  isOpen,
  onClose,
  userId,
  initialMeasurementId,
  onSaved
}: AddMeasurementModalProps) {
  const allEntries = GET_ALL_REGISTRY_ENTRIES()
  const defaultEntryId = initialMeasurementId || allEntries[0]?.id || 'bp_sys'

  const [selectedId, setSelectedId] = useState<string>(defaultEntryId)
  const [val, setVal] = useState<string>('')
  const [secVal, setSecVal] = useState<string>('') // For blood pressure DBP
  const [selectedUnit, setSelectedUnit] = useState<string>('')
  const [laterality, setLaterality] = useState<'none' | 'left' | 'right' | 'both'>('none')
  const [notes, setNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'manual' | 'test'>('test')

  // Interactive Test Timers State
  const [timerActive, setTimerActive] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [chairReps, setChairReps] = useState(0)
  const [srtScore, setSrtScore] = useState(10)

  useEffect(() => {
    if (isOpen) {
      const targetId = initialMeasurementId || allEntries[0]?.id || 'bp_sys'
      setSelectedId(targetId)
      setVal('')
      setSecVal('')
      setTimerActive(false)
      setTimerSeconds(0)
      setChairReps(0)
      setSrtScore(10)
      const entry = MEASUREMENT_REGISTRY[targetId]
      if (entry) setSelectedUnit(entry.primary_unit)
      
      // Auto-set test mode for zero equipment tests
      if (targetId === 'reaction_time' || targetId === 'single_leg_balance' || targetId === 'chair_stand_30s' || targetId === 'sitting_rising_test') {
        setActiveTab('test')
      } else {
        setActiveTab('manual')
      }
    }
  }, [isOpen, initialMeasurementId])

  // Timer Interval Effect
  useEffect(() => {
    let interval: any = null
    if (timerActive) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1)
      }, 1000)
    } else {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [timerActive])

  if (!isOpen) return null

  const currentEntry = MEASUREMENT_REGISTRY[selectedId] || allEntries[0]
  const currentUnit = selectedUnit || currentEntry.primary_unit

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!val || isNaN(parseFloat(val))) return

    setIsSubmitting(true)
    try {
      if (selectedId === 'bp_sys') {
        const sysNum = parseFloat(val)
        const diaNum = secVal && !isNaN(parseFloat(secVal)) ? parseFloat(secVal) : 80
        await saveBiologicalMeasurement(userId, 'bp_sys', sysNum, 'mmHg', { notes })
        await saveBiologicalMeasurement(userId, 'bp_dia', diaNum, 'mmHg', { notes })
      } else {
        const numVal = parseFloat(val)
        await saveBiologicalMeasurement(userId, selectedId, numVal, currentUnit, { laterality, notes })
      }

      if (onSaved) onSaved()
      onClose()
    } catch (err) {
      console.error('Error saving measurement:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReactionTimeComplete = async (medianMs: number, trialValues: number[]) => {
    setIsSubmitting(true)
    try {
      await saveBiologicalMeasurement(userId, 'reaction_time', medianMs, 'ms', {
        sourceType: 'levl_test',
        totalTrials: trialValues.length,
        trialValues,
        notes: 'Native LEVL 5-Trial Visual Reaction Time Test'
      })
      if (onSaved) onSaved()
      onClose()
    } catch (err) {
      console.error('Error saving reaction time test:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderIcon = (iconName?: string) => {
    switch (iconName) {
      case 'HeartPulse': return <HeartPulse className="text-red-400" size={24} />
      case 'Wind': return <Wind className="text-blue-400" size={24} />
      case 'Dumbbell': return <Dumbbell className="text-orange-400" size={24} />
      case 'Zap': return <Zap className="text-emerald-400" size={24} />
      case 'Footprints': return <Footprints className="text-indigo-400" size={24} />
      case 'Armchair': return <Armchair className="text-amber-400" size={24} />
      case 'UserCheck': return <UserCheck className="text-teal-400" size={24} />
      case 'Flame': return <Flame className="text-red-400" size={24} />
      case 'Scale': return <Scale className="text-purple-400" size={24} />
      case 'Ruler': return <Ruler className="text-purple-400" size={24} />
      default: return <Activity className="text-levl-accent" size={24} />
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="text-levl-accent" size={22} /> Record Biological Measurement
            </h2>
            <p className="text-xs text-gray-400">Contribute physiological data to your LEVL Biological Age engine.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Measurement Selector Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {allEntries.map(entry => {
            const isSelected = entry.id === selectedId
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => {
                  setSelectedId(entry.id)
                  setVal('')
                  setSecVal('')
                  setSelectedUnit(entry.primary_unit)
                  if (entry.id === 'reaction_time' || entry.id === 'single_leg_balance' || entry.id === 'chair_stand_30s' || entry.id === 'sitting_rising_test') {
                    setActiveTab('test')
                  } else {
                    setActiveTab('manual')
                  }
                }}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all flex items-center gap-1.5 ${
                  isSelected 
                    ? 'bg-levl-accent/20 border-levl-accent text-white shadow-[0_0_12px_rgba(99,102,241,0.3)]' 
                    : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {entry.name}
              </button>
            )
          })}
        </div>

        {/* Selected Measurement Info Card */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                {renderIcon(currentEntry.visual_guidance?.icon_name)}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{currentEntry.display_name}</h3>
                <p className="text-xs text-indigo-300 font-medium">{currentEntry.domain} Aging Domain</p>
              </div>
            </div>
            <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full bg-white/10 text-gray-300 border border-white/10">
              ~{currentEntry.estimated_minutes} min test
            </span>
          </div>

          <p className="text-xs text-gray-300 leading-relaxed">{currentEntry.evidence_summary}</p>

          {/* Prominent Full-Width Visual Protocol Motion Graphic */}
          <div className="space-y-3 pt-2 border-t border-white/5">
            <div className="w-full">
              <SilhouetteVisual measurementId={selectedId} className="w-full h-52 sm:h-44" />
            </div>

            {/* Standardized Execution Guide & Verified Video Demonstration */}
            {(() => {
              const vidInfo = getModalityVideoInfo(selectedId, 'diagnostics', currentEntry.display_name)
              return (
                <div className="pt-2 border-t border-white/10">
                  <ModalityExecutionGuide
                    instructions={currentEntry.protocol_instructions.map((step, i) => `Step ${i + 1}: ${step}`).join('\n')}
                    youtubeVideoId={vidInfo?.youtubeVideoId}
                    videoStartSeconds={vidInfo?.videoStartSeconds}
                    videoTitle={vidInfo?.videoTitle}
                    modalityName={currentEntry.display_name}
                    briefDescription={currentEntry.evidence_summary}
                    doseOrExposure={`Primary Unit: ${currentEntry.primary_unit}`}
                    timingSummary={`~${currentEntry.estimated_minutes} min test`}
                    defaultOpen={true}
                  />
                </div>
              )
            })()}
          </div>
        </div>

        {/* Mode Selector Tabs (Test Mode vs Manual Entry) */}
        <div className="flex border-b border-white/10 gap-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('test')}
            className={`pb-2 border-b-2 transition-colors ${activeTab === 'test' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-gray-400'}`}
          >
            ⚡ Guided Test Applet
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`pb-2 border-b-2 transition-colors ${activeTab === 'manual' ? 'border-indigo-400 text-indigo-400' : 'border-transparent text-gray-400'}`}
          >
            ✏️ Manual Value Entry
          </button>
        </div>

        {activeTab === 'test' ? (
          <div className="space-y-4">
            {selectedId === 'reaction_time' && (
              <ReactionTimeApplet onComplete={handleReactionTimeComplete} />
            )}

            {selectedId === 'single_leg_balance' && (
              <div className="glass-card p-6 rounded-2xl border border-indigo-500/30 text-center space-y-4">
                <h3 className="text-lg font-bold text-white">Single-Leg Stance Balance Timer</h3>
                <p className="text-xs text-gray-300 max-w-sm mx-auto">
                  Lift one foot off the floor and balance. Tap Start to begin timing.
                </p>
                <div className="text-4xl font-black font-mono text-indigo-300">
                  {timerSeconds} <span className="text-sm font-sans font-normal text-gray-400">sec</span>
                </div>
                <div className="flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setTimerActive(!timerActive)}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center gap-2 ${
                      timerActive ? 'bg-amber-500 text-black hover:bg-amber-400' : 'bg-emerald-500 text-black hover:bg-emerald-400'
                    }`}
                  >
                    <Play size={16} /> {timerActive ? 'Stop & Record' : 'Start Balance Timer'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTimerActive(false); setTimerSeconds(0); }}
                    className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold"
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>
                {timerSeconds > 0 && !timerActive && (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={async () => {
                      setIsSubmitting(true)
                      try {
                        await saveBiologicalMeasurement(userId, 'single_leg_balance', timerSeconds, 'sec', { sourceType: 'levl_test', notes })
                        if (onSaved) onSaved()
                        onClose()
                      } finally { setIsSubmitting(false) }
                    }}
                    className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-lg hover:bg-indigo-500 transition-all"
                  >
                    Save {timerSeconds} Second Balance Result
                  </button>
                )}
              </div>
            )}

            {selectedId === 'chair_stand_30s' && (
              <div className="glass-card p-6 rounded-2xl border border-amber-500/30 text-center space-y-4">
                <h3 className="text-lg font-bold text-white">30-Second Chair Stand Counter</h3>
                <p className="text-xs text-gray-300 max-w-sm mx-auto">
                  Rise to full stand and sit back down as many times as possible in 30s.
                </p>
                <div className="flex items-center justify-center gap-6">
                  <div className="text-center">
                    <span className="text-4xl font-black font-mono text-amber-400">{chairReps}</span>
                    <p className="text-[10px] text-gray-400 uppercase">Completed Reps</p>
                  </div>
                  <div className="w-px h-10 bg-white/10" />
                  <div className="text-center">
                    <span className="text-2xl font-bold font-mono text-gray-300">{timerSeconds}s</span>
                    <p className="text-[10px] text-gray-400 uppercase">Timer</p>
                  </div>
                </div>
                <div className="flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setChairReps(prev => prev + 1)}
                    className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm shadow-lg transition-all flex items-center gap-2"
                  >
                    <Plus size={18} /> Tap +1 Rep
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimerActive(!timerActive)}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold"
                  >
                    {timerActive ? 'Pause Timer' : 'Start 30s Timer'}
                  </button>
                </div>
                {chairReps > 0 && (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={async () => {
                      setIsSubmitting(true)
                      try {
                        await saveBiologicalMeasurement(userId, 'chair_stand_30s', chairReps, 'reps', { sourceType: 'levl_test', notes })
                        if (onSaved) onSaved()
                        onClose()
                      } finally { setIsSubmitting(false) }
                    }}
                    className="w-full py-3 rounded-xl bg-amber-600 text-white font-bold text-xs shadow-lg hover:bg-amber-500 transition-all"
                  >
                    Save {chairReps} Completed Reps Result
                  </button>
                )}
              </div>
            )}

            {selectedId === 'sitting_rising_test' && (
              <div className="glass-card p-6 rounded-2xl border border-teal-500/30 text-center space-y-4">
                <h3 className="text-lg font-bold text-white">Sitting-Rising Test Scoring Calculator</h3>
                <p className="text-xs text-gray-300 max-w-sm mx-auto">
                  Start with 10 pts. Deduct 1 pt for each hand/knee used for support. Deduct 0.5 pt for loss of balance.
                </p>
                <div className="text-4xl font-black font-mono text-teal-300">{srtScore} <span className="text-sm font-normal text-gray-400">/ 10 pts</span></div>
                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSrtScore(prev => Math.max(0, Math.round((prev - 1) * 2) / 2))}
                    className="px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-bold flex items-center gap-1"
                  >
                    <Minus size={14} /> -1.0 Support
                  </button>
                  <button
                    type="button"
                    onClick={() => setSrtScore(prev => Math.max(0, Math.round((prev - 0.5) * 2) / 2))}
                    className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1"
                  >
                    <Minus size={14} /> -0.5 Balance Loss
                  </button>
                  <button
                    type="button"
                    onClick={() => setSrtScore(10)}
                    className="px-3 py-2 rounded-xl bg-white/10 text-gray-300 text-xs font-bold"
                  >
                    Reset 10
                  </button>
                </div>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={async () => {
                    setIsSubmitting(true)
                    try {
                      await saveBiologicalMeasurement(userId, 'sitting_rising_test', srtScore, 'score', { sourceType: 'levl_test', notes })
                      if (onSaved) onSaved()
                      onClose()
                    } finally { setIsSubmitting(false) }
                  }}
                  className="w-full py-3 rounded-xl bg-teal-600 text-white font-bold text-xs shadow-lg hover:bg-teal-500 transition-all"
                >
                  Save {srtScore}/10 Sitting-Rising Score
                </button>
              </div>
            )}

            {selectedId !== 'reaction_time' && selectedId !== 'single_leg_balance' && selectedId !== 'chair_stand_30s' && selectedId !== 'sitting_rising_test' && (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center text-xs text-gray-400">
                This measurement uses manual entry or medical device input. Switch to the <strong>Manual Value Entry</strong> tab.
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            {selectedId === 'bp_sys' ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Systolic (SBP mmHg)</label>
                  <input
                    type="number"
                    placeholder="120"
                    value={val}
                    onChange={(e) => setVal(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono text-base focus:border-levl-accent focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Diastolic (DBP mmHg)</label>
                  <input
                    type="number"
                    placeholder="80"
                    value={secVal}
                    onChange={(e) => setSecVal(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono text-base focus:border-levl-accent focus:outline-none"
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-300">Value ({currentUnit})</label>
                  {currentEntry.supported_units.length > 1 && (
                    <select
                      value={currentUnit}
                      onChange={(e) => setSelectedUnit(e.target.value)}
                      className="bg-black/60 text-xs text-gray-300 border border-white/10 rounded px-2 py-1"
                    >
                      {currentEntry.supported_units.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  )}
                </div>
                <input
                  type="number"
                  step="any"
                  placeholder={`e.g. ${currentEntry.primary_unit === 'kg' ? '45' : '3.5'}`}
                  value={val}
                  onChange={(e) => setVal(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono text-base focus:border-levl-accent focus:outline-none"
                  required
                />
              </div>
            )}

            {/* Optional Notes */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-300">Notes (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Measured 1 hr after morning workout"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:border-levl-accent focus:outline-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-levl-accent text-white font-bold text-sm shadow-lg hover:bg-levl-accent/90 transition-all flex items-center justify-center gap-2"
            >
              <Check size={18} /> Save Biological Measurement
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
