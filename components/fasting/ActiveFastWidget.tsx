import { useState, useEffect, useMemo } from 'react'
import { DailyProtocolTask, Modality, OutcomeDimension, UserProfile } from '@/lib/types'
import { getOutcomeColorConfig, getNeutralOutcomeColorConfig } from '@/lib/utils/outcomeColors'
import { hasAnyPreLoggableOutcome } from '@/lib/utils/outcomePhaseRules'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { getTaskOutcomeObservations, saveOutcomeObservation } from '@/lib/data'
import CustomizeModalityOutcomesModal from '../modals/CustomizeModalityOutcomesModal'
import GeekMode from '../cards/GeekMode'
import { FastingExecutionDetails } from '../execution/FastingExecutionLog'
import { Star, Sliders, Flame, Clock, Zap, Shield, Sparkles, Check, Plus, Droplets, Heart, Activity, ChevronDown, ChevronUp, BookOpen, Info, ExternalLink, Brain, Dna } from 'lucide-react'

type ActiveFastWidgetProps = {
  activeFastTask: DailyProtocolTask | null
  onStatusChange: (taskId: string, status: string, details?: any) => void
  onTrackOutcomes?: (modality: Modality, taskId: string, phase?: string) => void
  allOutcomes?: OutcomeDimension[]
  userProfile?: UserProfile | null
  onSaveCustomOutcomes?: (modalityId: string, outcomeIds: string[]) => void | Promise<void>
  onOutcomesSaved?: (taskId: string) => void
}

export function getAutophagyStage(elapsedHours: number) {
  if (elapsedHours < 12) {
    return {
      stage: 'Insulin Normalization',
      icon: '🩸',
      color: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
      description: 'Blood glucose settling. Digestive system at rest.'
    }
  } else if (elapsedHours < 18) {
    return {
      stage: 'Fat Oxidation & Ketosis',
      icon: '⚡',
      color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
      description: 'Glycogen depleted. Body switching to fat for fuel.'
    }
  } else if (elapsedHours < 24) {
    return {
      stage: 'Cellular Autophagy',
      icon: '🧬',
      color: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
      description: 'Active recycling of damaged cellular components & proteins.'
    }
  } else if (elapsedHours < 48) {
    return {
      stage: 'Peak Autophagy & HGH Surge',
      icon: '🛡️',
      color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
      description: 'Human Growth Hormone spike protecting lean muscle.'
    }
  } else {
    return {
      stage: 'Immune System Reset',
      icon: '🔄',
      color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
      description: 'Stem cell generation & immune cell rejuvenation.'
    }
  }
}

export function calculateGKI(glucoseMgDl?: number | '', ketonesMmolL?: number | '') {
  if (!glucoseMgDl || !ketonesMmolL || ketonesMmolL === 0) return null
  const gki = parseFloat((Number(glucoseMgDl) / (18 * Number(ketonesMmolL))).toFixed(2))
  
  let level = 'Light / Non-Ketotic'
  let color = 'text-gray-400 border-gray-500/30 bg-gray-500/10'
  
  if (gki < 1.0) {
    level = 'Highest Therapeutic Autophagy'
    color = 'text-emerald-400 border-emerald-500/40 bg-emerald-500/20'
  } else if (gki <= 3.0) {
    level = 'Deep Ketosis & Autophagy'
    color = 'text-purple-400 border-purple-500/40 bg-purple-500/20'
  } else if (gki <= 6.0) {
    level = 'Moderate Ketosis'
    color = 'text-blue-400 border-blue-500/30 bg-blue-500/10'
  }

  return { gki, level, color }
}

export default function ActiveFastWidget({ 
  activeFastTask, 
  onStatusChange,
  onTrackOutcomes,
  allOutcomes = [],
  userProfile,
  onSaveCustomOutcomes,
  onOutcomesSaved
}: ActiveFastWidgetProps) {
  const [now, setNow] = useState<Date>(new Date())
  const [isExpanded, setIsExpanded] = useState(false)
  const [showGeekMode, setShowGeekMode] = useState(false)

  // Outcome observations state
  const [taskObs, setTaskObs] = useState<any[]>([])
  const [isJustCompletedInline, setIsJustCompletedInline] = useState(false)
  const [inlineOutcomeValues, setInlineOutcomeValues] = useState<Record<string, number>>({})
  const [touchedInlineOutcomes, setTouchedInlineOutcomes] = useState<Record<string, boolean>>({})
  const [isSavingOutcomes, setIsSavingOutcomes] = useState(false)
  const [showCustomizeOutcomesModal, setShowCustomizeOutcomesModal] = useState(false)

  // Update timer every minute
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Fetch observations for baseline pre ratings
  useEffect(() => {
    if (activeFastTask) {
      const localUserId = getLocalUserId()
      getTaskOutcomeObservations(localUserId, activeFastTask.id).then(obs => {
        if (obs) setTaskObs(obs)
      })
    }
  }, [activeFastTask])

  if (!activeFastTask) return null

  const details: FastingExecutionDetails = activeFastTask.execution_details || {}
  const startTime = details.start_time ? new Date(details.start_time) : new Date(activeFastTask.scheduled_date)
  const targetDurationHours = details.duration || 18

  // Calculate elapsed time
  const diffMs = Math.max(0, now.getTime() - startTime.getTime())
  const elapsedMinutes = Math.floor(diffMs / (1000 * 60))
  const elapsedHours = elapsedMinutes / 60

  const hoursDisplay = Math.floor(elapsedHours)
  const minsDisplay = elapsedMinutes % 60

  const percentComplete = Math.min(100, Math.round((elapsedHours / Number(targetDurationHours)) * 100))
  const currentStage = getAutophagyStage(elapsedHours)
  const gkiInfo = calculateGKI(details.glucose, details.ketones)

  const modality: Modality | undefined = activeFastTask.loose_modality || activeFastTask.protocol_step?.modality

  // Map baseline pre-modality ratings
  const baselineOutcomesMap = useMemo(() => {
    const map: Record<string, number> = {}
    if (!taskObs || taskObs.length === 0) return map
    taskObs.forEach(ob => {
      if (ob.phase === 'pre' && ob.value_0_10 !== undefined) {
        map[ob.outcome_id] = ob.value_0_10
      }
    })
    return map
  }, [taskObs])

  // User preference priority map
  const userPriorityMap = useMemo(() => {
    const map = new Map<string, { score: number; label: string }>()
    if (!userProfile?.outcome_preference_scores) return map

    Object.entries(userProfile.outcome_preference_scores).forEach(([id, score]) => {
      if (score >= 9) map.set(id, { score, label: 'Highest Priority' })
      else if (score >= 7) map.set(id, { score, label: 'High Priority' })
    })

    return map
  }, [userProfile])

  // Calculate relevant outcomes for this fasting modality
  const currentRelevantOutcomes = useMemo(() => {
    if (!modality) return []
    let functionalOutcomes = modality.functional_outcomes_to_track || []
    if (typeof functionalOutcomes === 'string') {
      const cleaned = (functionalOutcomes as string).replace(/^{|}$/g, '')
      functionalOutcomes = cleaned ? cleaned.split(',') : []
    }

    const mappedOutcomeIds = [
      modality.primary_outcome, 
      ...(modality.secondary_outcomes || []),
      ...functionalOutcomes
    ].filter(Boolean) as string[]

    const normalizedKeys = mappedOutcomeIds.map(s => s.toLowerCase().trim())
    let list = allOutcomes.filter(o => 
      normalizedKeys.includes(o.id.toLowerCase()) || 
      normalizedKeys.includes(o.id.toLowerCase().replace(/_/g, ' ')) ||
      normalizedKeys.includes(o.name.toLowerCase())
    )

    if (list.length === 0) {
      list = allOutcomes.filter(o => 
        o.id === 'mental_clarity' || 
        o.id === 'focus' || 
        o.id === 'energy' || 
        o.id === 'satiety' || 
        o.id === 'digestive_comfort' || 
        o.id === 'brain_fog'
      )
    }

    // Exclude sleep outcomes from acute modality tracking
    list = list.filter(o => {
      const idLower = o.id.toLowerCase()
      const nameLower = o.name.toLowerCase()
      const catLower = (o.category || '').toLowerCase()
      return !idLower.includes('sleep') && !nameLower.includes('sleep') && !catLower.includes('sleep')
    })

    return [...list].sort((a, b) => {
      const aP = userPriorityMap.get(a.id)?.score || 0
      const bP = userPriorityMap.get(b.id)?.score || 0
      return bP - aP
    })
  }, [modality, allOutcomes, userPriorityMap])

  // Initialize inline outcome values
  useEffect(() => {
    if (currentRelevantOutcomes.length > 0 && Object.keys(inlineOutcomeValues).length === 0) {
      const init: Record<string, number> = {}
      currentRelevantOutcomes.forEach(o => {
        init[o.id] = baselineOutcomesMap[o.id] ?? 5
      })
      setInlineOutcomeValues(init)
    }
  }, [currentRelevantOutcomes, baselineOutcomesMap])

  const handleExtend = (extraHours: number) => {
    const newDuration = Math.max(1, Number(targetDurationHours) + extraHours)
    onStatusChange(activeFastTask.id, activeFastTask.status, {
      ...details,
      duration: newDuration
    })
  }

  const handleBreakFastClick = () => {
    setIsJustCompletedInline(true)
    setIsExpanded(true)
  }

  const handleSaveInlineOutcomes = async () => {
    setIsSavingOutcomes(true)
    try {
      const localUserId = getLocalUserId()
      const dateStr = new Date().toISOString().split('T')[0]
      for (const [outcomeId, val] of Object.entries(inlineOutcomeValues)) {
        if (touchedInlineOutcomes[outcomeId]) {
          await saveOutcomeObservation(localUserId, outcomeId, 'post', val, dateStr, activeFastTask.id)
        }
      }
      if (onOutcomesSaved) {
        onOutcomesSaved(activeFastTask.id)
      }
      onStatusChange(activeFastTask.id, 'completed', {
        ...details,
        end_time: new Date().toISOString(),
        duration: parseFloat(elapsedHours.toFixed(1))
      })
    } catch (err) {
      console.error('Error saving inline fasting outcomes:', err)
    } finally {
      setIsSavingOutcomes(false)
    }
  }

  const handleSkipOutcomesClick = () => {
    onStatusChange(activeFastTask.id, 'completed', {
      ...details,
      end_time: new Date().toISOString(),
      duration: parseFloat(elapsedHours.toFixed(1))
    })
  }

  const handleAddElectrolyte = (type: 'sodium' | 'water') => {
    const currentSodium = details.sodium_mg || 0
    const currentWater = details.water_oz || 0
    
    onStatusChange(activeFastTask.id, activeFastTask.status, {
      ...details,
      sodium_mg: type === 'sodium' ? currentSodium + 500 : currentSodium,
      water_oz: type === 'water' ? currentWater + 16 : currentWater
    })
  }

  const modName = modality?.display_name || modality?.name || 'Active Fasting Protocol'

  return (
    <div className="mt-4 rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-950/30 via-black/40 to-black/60 p-4 shadow-[0_0_25px_rgba(168,85,247,0.15)] relative overflow-hidden transition-all">
      
      {/* Background Subtle Pulsing Aura */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl animate-pulse pointer-events-none" />

      {/* Header Bar */}
      <div 
        className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-500/20 pb-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center font-bold text-sm shadow-[0_0_10px_rgba(168,85,247,0.3)]">
            🔥
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">{modName}</h2>
              <span className="text-[9px] uppercase font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full animate-pulse">
                Live Fast
              </span>
            </div>
            <p className="text-xs text-gray-400">Started {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2">
          {gkiInfo && (
            <div className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5 ${gkiInfo.color}`}>
              <Activity size={12} /> GKI: {gkiInfo.gki} ({gkiInfo.level})
            </div>
          )}
          <button 
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
            className="text-xs font-bold text-purple-300 hover:text-white bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>{isExpanded ? 'Less' : 'Modality Details'}</span>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Progress & Stage Section */}
      <div className="my-4 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
        
        {/* Timer Display */}
        <div className="sm:col-span-1">
          <div className="text-3xl font-extrabold text-white font-mono tracking-tight leading-none">
            {hoursDisplay}<span className="text-sm text-purple-400 font-sans font-normal ml-0.5 mr-1.5">h</span>
            {minsDisplay}<span className="text-sm text-purple-400 font-sans font-normal ml-0.5">m</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Goal: <span className="text-white font-bold">{targetDurationHours}h</span> ({percentComplete}% complete)
          </div>
        </div>

        {/* Autophagy Stage Badge */}
        <div className="sm:col-span-2">
          <div className={`p-2.5 rounded-xl border flex items-start gap-2.5 ${currentStage.color}`}>
            <span className="text-lg">{currentStage.icon}</span>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider">{currentStage.stage}</div>
              <p className="text-[11px] opacity-90 leading-tight mt-0.5">{currentStage.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-black/60 rounded-full h-2.5 border border-white/10 overflow-hidden mb-4">
        <div 
          className="bg-gradient-to-r from-purple-500 via-emerald-400 to-cyan-400 h-full transition-all duration-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" 
          style={{ width: `${percentComplete}%` }}
        />
      </div>

      {/* Quick Fasting Log Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 pb-2 border-b border-white/5">
        <div className="flex gap-1.5 flex-wrap">
          {onTrackOutcomes && modality && hasAnyPreLoggableOutcome(modality.functional_outcomes_to_track || ['mental_clarity']) && (
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onTrackOutcomes(modality, activeFastTask.id, 'pre')
              }}
              className="px-2.5 py-1.5 bg-purple-500/15 border border-purple-500/30 rounded-lg text-xs text-purple-300 font-medium hover:bg-purple-500 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
              title="Log baseline bio-signals before starting modality"
            >
              <Activity size={12} className="text-purple-400" /> Log Baseline (Before)
            </button>
          )}
          <button 
            onClick={() => handleAddElectrolyte('sodium')}
            className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-gray-300 font-medium transition-colors flex items-center gap-1 cursor-pointer"
            title="Log 500mg Sodium intake"
          >
            + 500mg Sodium
          </button>
          <button 
            onClick={() => handleAddElectrolyte('water')}
            className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-gray-300 font-medium transition-colors flex items-center gap-1 cursor-pointer"
            title="Log 16oz Water intake"
          >
            + 16oz Water
          </button>
          <button 
            onClick={() => handleExtend(2)}
            className="px-2.5 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-lg text-xs text-purple-300 font-medium transition-colors flex items-center gap-1 cursor-pointer"
          >
            + 2h Goal
          </button>
        </div>

        <button 
          onClick={handleBreakFastClick}
          className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
        >
          <Check size={14} strokeWidth={3} /> Break Fast & Complete
        </button>
      </div>

      {/* INLINE OUTCOME OBSERVATIONS TRACKER (HOW DO YOU FEEL?) */}
      {isJustCompletedInline && (
        <div className="bg-black/50 p-4 rounded-xl border border-emerald-500/30 space-y-4 my-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
              How Do You Feel? (Post-Fast Observations)
            </h4>
            {modality && onSaveCustomOutcomes && (
              <button
                type="button"
                onClick={() => setShowCustomizeOutcomesModal(true)}
                className="text-[11px] font-bold text-gray-200 hover:text-white bg-white/10 hover:bg-white/15 border border-white/20 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Sliders size={12} /> Edit Tracked Outcomes
              </button>
            )}
          </div>

          <div className="space-y-4">
            {currentRelevantOutcomes.map(outcome => {
              const baselineVal = baselineOutcomesMap[outcome.id]
              const val = inlineOutcomeValues[outcome.id] ?? baselineVal ?? 5
              const isTouched = touchedInlineOutcomes[outcome.id] || baselineVal !== undefined
              const colorCfg = isTouched ? getOutcomeColorConfig(val, outcome.directionality) : getNeutralOutcomeColorConfig()
              const isLowerBetter = outcome.directionality === 'lower_is_better'
              const userPriority = userPriorityMap.get(outcome.id)

              return (
                <div key={outcome.id} className="bg-black/40 p-3.5 rounded-xl border border-white/10 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-white font-bold">{outcome.name}</span>
                      {baselineVal !== undefined && (
                        <span className="text-[9px] font-bold text-purple-300 bg-purple-500/20 border border-purple-500/40 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          ⚡ Baseline: {baselineVal}/10
                        </span>
                      )}
                      {userPriority && (
                        <span className="text-[9px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <Star size={9} fill="currentColor" /> {userPriority.label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${colorCfg.badgeBg}`}>
                        {isTouched ? colorCfg.qualityLabel : 'Unset'}
                      </span>
                      <span className={`font-mono font-bold text-xs ${colorCfg.textColor}`}>
                        {isTouched ? `${val}/10` : 'Unset'}
                      </span>
                    </div>
                  </div>
                  
                  <input 
                    type="range" 
                    min="0" 
                    max="10" 
                    value={val} 
                    onChange={(e) => {
                      setInlineOutcomeValues(prev => ({ ...prev, [outcome.id]: parseInt(e.target.value) }))
                      setTouchedInlineOutcomes(prev => ({ ...prev, [outcome.id]: true }))
                    }} 
                    className="w-full cursor-pointer" 
                    style={{ accentColor: colorCfg.accentHex }}
                  />
                  
                  <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-gray-400">
                    <span className={isLowerBetter ? 'text-emerald-400' : 'text-red-400'}>
                      0: {isLowerBetter ? 'Best (None)' : 'Poor (Low)'}
                    </span>
                    <span className={isLowerBetter ? 'text-red-400' : 'text-emerald-400'}>
                      10: {isLowerBetter ? 'Worst (Severe)' : 'Peak (Best)'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleSaveInlineOutcomes}
              disabled={isSavingOutcomes}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Check size={14} /> {isSavingOutcomes ? 'Saving...' : 'Save Observations & Complete Fast'}
            </button>
            <button
              type="button"
              onClick={handleSkipOutcomesClick}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/20 text-gray-200 hover:text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shrink-0"
            >
              Skip Tracking
            </button>
          </div>
        </div>
      )}

      {/* EXPANDED FULL MODALITY DETAILS SECTION */}
      {isExpanded && (
        <div className="pt-4 space-y-4 animate-in fade-in slide-in-from-top-2">
          
          {/* Headline Benefit / Brief Description */}
          {(modality?.headline_benefit || modality?.brief_description) && (
            <div className="bg-black/40 p-3.5 rounded-xl border border-white/10 space-y-1">
              <div className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={13} /> Headline Benefit
              </div>
              <p className="text-sm text-white font-medium">
                {modality?.headline_benefit || modality?.brief_description}
              </p>
            </div>
          )}

          {/* Expanded Why (Scientific Rationale) */}
          {(modality?.expanded_why || modality?.brief_description) && (
            <div className="bg-black/40 p-3.5 rounded-xl border border-white/10 space-y-1">
              <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen size={13} /> Physiological Mechanism & Rationale
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                {modality?.expanded_why || modality?.brief_description}
              </p>
            </div>
          )}

          {/* Outcomes & Bio-Signals */}
          {(modality?.primary_outcome || (modality?.secondary_outcomes && modality.secondary_outcomes.length > 0)) && (
            <div className="bg-black/40 p-3.5 rounded-xl border border-white/10 space-y-2">
              <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <Activity size={13} /> Targeted Bio-Signals & Outcomes
              </div>
              <div className="flex flex-wrap gap-1.5">
                {modality?.primary_outcome && (
                  <span className="text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-lg">
                    🎯 Primary: {modality.primary_outcome}
                  </span>
                )}
                {modality?.secondary_outcomes?.map((sec: string) => (
                  <span key={sec} className="text-xs font-medium bg-white/5 text-gray-300 border border-white/10 px-2.5 py-1 rounded-lg">
                    {sec}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Implementation Instructions & Hydration Guidelines */}
          <div className="bg-black/40 p-3.5 rounded-xl border border-white/10 space-y-2">
            <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Info size={13} /> Implementation & Fasting Guidelines
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              {modality?.instructions || modality?.implementation_summary || 'Maintain fast drinking water, black coffee, or plain tea. Replenish electrolytes during extended windows.'}
            </p>
            {modality?.dose_or_exposure && (
              <div className="text-xs text-gray-400 pt-1 font-mono">
                Exposure / Window: <span className="text-white font-bold">{modality.dose_or_exposure}</span>
              </div>
            )}
          </div>

          {/* Geek Mode Toggle Button & Details */}
          <div className="pt-2">
            <button 
              onClick={() => setShowGeekMode(!showGeekMode)}
              className="text-xs font-bold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Brain size={13} />
              <span>{showGeekMode ? 'Hide Geek Mode' : '🔬 Geek Mode (Deep Science)'}</span>
            </button>

            {showGeekMode && modality && <GeekMode modality={modality} />}
          </div>

        </div>
      )}

      {/* CUSTOMIZE OUTCOMES MODAL */}
      {showCustomizeOutcomesModal && modality && onSaveCustomOutcomes && (
        <CustomizeModalityOutcomesModal 
          isOpen={showCustomizeOutcomesModal}
          onClose={() => setShowCustomizeOutcomesModal(false)}
          modality={modality}
          allOutcomes={allOutcomes}
          currentOutcomeIds={currentRelevantOutcomes.map(o => o.id)}
          userProfile={userProfile}
          onSaveOutcomes={async (modalityId, selectedOutcomeIds) => {
            await onSaveCustomOutcomes(modalityId, selectedOutcomeIds)
            setShowCustomizeOutcomesModal(false)
          }}
        />
      )}

    </div>
  )
}
