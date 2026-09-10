import { DailyProtocolTask, Modality, UserProfile } from '@/lib/types'

export type DailyBandwidthMode = 'survival_80_20' | 'standard' | 'peak_surge'

export interface RoutineAdjustmentItem {
  id: string
  type: 'cut' | 'downgrade' | 'keep_anchor' | 'add_restorative' | 'add_surge'
  title: string
  category: 'fitness' | 'thermal' | 'supplement' | 'recovery' | 'lifestyle' | 'circadian'
  badge: string
  badgeColor: string
  impact: string
  description: string
  scientificRationale: string
  defaultChecked: boolean
  affectedTaskId?: string
  targetModalityId?: string
  swapModalityId?: string
  swapModalityName?: string
  swapDoseText?: string
}

export interface BandwidthEvaluation {
  suggestedMode: DailyBandwidthMode
  readinessScore: number | null
  readinessSource: 'wearable' | 'checkin_sleep' | 'manual_toggle' | 'default'
  headline: string
  rationale: string
  adjustments: RoutineAdjustmentItem[]
}

/**
 * High Allostatic Load Detection
 * Identifies modalities that impose high sympathetic or musculoskeletal strain.
 */
export function isHighAllostaticModality(task: DailyProtocolTask): boolean {
  const name = (task.loose_modality?.name || task.protocol_step?.modality?.name || '').toLowerCase()
  const cat = (task.loose_modality?.category || task.protocol_step?.modality?.category || '').toLowerCase()

  if (
    name.includes('deadlift') ||
    name.includes('squat') ||
    name.includes('liftmor') ||
    name.includes('heavy axial') ||
    name.includes('resistance training') ||
    name.includes('strength training') ||
    name.includes('weightlifting') ||
    name.includes('barbell') ||
    name.includes('hiit') ||
    name.includes('sprint') ||
    name.includes('vo2') ||
    name.includes('cold plunge') ||
    name.includes('ice bath') ||
    name.includes('cryotherapy') ||
    name.includes('fasting') ||
    name.includes('omad')
  ) {
    return true
  }

  return false
}

/**
 * Minimum Effective Dose (MED) Anchors
 * Zero or ultra-low physical cost habits that should ALWAYS be preserved.
 */
export function isMedAnchorModality(task: DailyProtocolTask): boolean {
  const name = (task.loose_modality?.name || task.protocol_step?.modality?.name || '').toLowerCase()
  return (
    name.includes('sunlight') ||
    name.includes('morning light') ||
    name.includes('hydration') ||
    name.includes('electrolytes') ||
    name.includes('water') ||
    name.includes('creatine') ||
    name.includes('vitamin d') ||
    name.includes('blue light') ||
    name.includes('blue-blocking') ||
    name.includes('magnesium') ||
    name.includes('mouth tape')
  )
}

/**
 * Evaluates current daily bandwidth and generates personalized routine adjustments
 */
export function evaluateDailyBandwidth({
  wearableReadiness,
  subjectiveSleep,
  actualSleepMinutes,
  subjectiveEnergy,
  todayTasks,
  forcedMode
}: {
  wearableReadiness?: number | null
  subjectiveSleep?: number | null
  actualSleepMinutes?: number | null
  subjectiveEnergy?: number | null
  todayTasks: DailyProtocolTask[]
  forcedMode?: DailyBandwidthMode | null
}): BandwidthEvaluation {
  // 1. Determine Mode & Source
  let suggestedMode: DailyBandwidthMode = 'standard'
  let readinessScore: number | null = null
  let readinessSource: 'wearable' | 'checkin_sleep' | 'manual_toggle' | 'default' = 'default'
  let headline = 'Standard Protocol Rhythm'
  let rationale = 'Your recovery markers align with your baseline scheduled protocol load.'

  if (forcedMode) {
    suggestedMode = forcedMode
    readinessSource = 'manual_toggle'
    if (forcedMode === 'survival_80_20') {
      headline = '🛡️ Survival (80/20) Mode Activated'
      rationale = 'Routine compressed to minimum effective dose to protect recovery and save time.'
    } else if (forcedMode === 'peak_surge') {
      headline = '⚡ Peak Surge Mode Activated'
      rationale = 'High-capacity adaptation mode enabled for maximum longevity output.'
    }
  } else if (wearableReadiness != null && !isNaN(wearableReadiness)) {
    readinessScore = wearableReadiness
    readinessSource = 'wearable'
    if (wearableReadiness < 50) {
      suggestedMode = 'survival_80_20'
      headline = `🛡️ Low Battery Detected (${wearableReadiness}% Recovery)`
      rationale = `Your wearable reports an autonomic recovery score of ${wearableReadiness}%. High allostatic strain is suppressed to prevent sympathetic burnout.`
    } else if (wearableReadiness >= 80) {
      suggestedMode = 'peak_surge'
      headline = `⚡ Peak Readiness Primed (${wearableReadiness}% Recovery)`
      rationale = `Your autonomic nervous system is primed with an exceptional ${wearableReadiness}% readiness score. Optimal window for high-demand adaptation.`
    }
  } else if (
    (subjectiveSleep != null && subjectiveSleep <= 4) ||
    (actualSleepMinutes != null && actualSleepMinutes < 390) ||
    (subjectiveEnergy != null && subjectiveEnergy <= 4)
  ) {
    suggestedMode = 'survival_80_20'
    readinessSource = 'checkin_sleep'
    const sleepHours = actualSleepMinutes ? `${Math.floor(actualSleepMinutes / 60)}h ${actualSleepMinutes % 60}m` : ''
    headline = '🛡️ Sleep & Energy Deficit Detected'
    rationale = `Your morning check-in indicates acute recovery strain${sleepHours ? ` (${sleepHours} sleep)` : ''}. We recommend activating the 80/20 Minimum Effective Dose.`
  }

  // 2. Generate Granular Adjustments (All Default Checked!)
  const adjustments: RoutineAdjustmentItem[] = []

  if (suggestedMode === 'survival_80_20') {
    // A. Detect high allostatic tasks to cut or downgrade
    for (const task of todayTasks) {
      if (task.status === 'completed') continue
      if (task.status === 'skipped' && !task.status_reason?.includes('80/20')) continue

      const isAlreadyDeferred = task.status === 'skipped' && !!task.status_reason?.includes('80/20')
      const isAlreadyDowngraded = !!task.execution_details?.is_downgraded
      const name = task.loose_modality?.name || task.protocol_step?.modality?.name || 'Session'

      if (
        name.toLowerCase().includes('deadlift') ||
        name.toLowerCase().includes('squat') ||
        name.toLowerCase().includes('liftmor') ||
        name.toLowerCase().includes('heavy axial') ||
        name.toLowerCase().includes('resistance training') ||
        name.toLowerCase().includes('strength') ||
        name.toLowerCase().includes('weightlifting')
      ) {
        adjustments.push({
          id: `swap_lifting_${task.id}`,
          type: 'downgrade',
          title: isAlreadyDowngraded
            ? `Swapped: ${name} ➔ ${task.execution_details?.swap_name || '15-min Restorative Mobility Walk'}`
            : `Swap: ${name} ➔ 15-min Restorative Mobility Walk`,
          category: 'fitness',
          badge: isAlreadyDowngraded ? 'Currently Swapped' : 'Allostatic Relief',
          badgeColor: 'text-amber-300 bg-amber-500/20 border-amber-500/40',
          impact: isAlreadyDowngraded
            ? 'Minimum Effective Dose active • CNS spared'
            : 'Saves 45 mins & eliminates central nervous system burnout',
          description: isAlreadyDowngraded
            ? 'Currently swapped for light parasympathetic movement. Uncheck to restore heavy lifting.'
            : 'Replaces heavy eccentric spinal loading with light parasympathetic aerobic movement to preserve joint health.',
          scientificRationale: 'Heavy resistance training during autonomic depletion doubles musculoskeletal strain and elevates systemic cortisol.',
          defaultChecked: true,
          affectedTaskId: task.id,
          targetModalityId: task.modality_id,
          swapModalityName: 'Zone 1 Restorative Mobility Walk',
          swapDoseText: '15–20 minutes easy outdoor walking'
        })
      } else if (
        name.toLowerCase().includes('cold plunge') ||
        name.toLowerCase().includes('ice bath') ||
        name.toLowerCase().includes('cryotherapy')
      ) {
        adjustments.push({
          id: `downgrade_cold_${task.id}`,
          type: 'downgrade',
          title: isAlreadyDowngraded
            ? `Swapped: ${name} ➔ ${task.execution_details?.swap_name || 'Cool Face/Shower Rinse'}`
            : `Downgrade: ${name} ➔ 60s Cool Face/Shower Rinse`,
          category: 'thermal',
          badge: isAlreadyDowngraded ? 'Currently Swapped' : 'Adrenergic Protection',
          badgeColor: 'text-cyan-300 bg-cyan-500/20 border-cyan-500/40',
          impact: isAlreadyDowngraded
            ? 'Catecholamines preserved • Vagal tone intact'
            : 'Saves cold tub preparation & spares catecholamines',
          description: isAlreadyDowngraded
            ? 'Currently downgraded to gentle cold splash. Uncheck to restore full cold immersion.'
            : 'Spares your already depleted sympathetic nervous system while still offering mild vagal stimulation.',
          scientificRationale: 'Prolonged cold immersion spikes norepinephrine by up to 530%, which exhausts depleted adrenals when sleep is restricted.',
          defaultChecked: true,
          affectedTaskId: task.id,
          targetModalityId: task.modality_id,
          swapModalityName: 'Cool Face & Neck Splash',
          swapDoseText: '60 seconds cool tap water'
        })
      } else if (name.toLowerCase().includes('hiit') || name.toLowerCase().includes('sprint')) {
        adjustments.push({
          id: `defer_hiit_${task.id}`,
          type: 'cut',
          title: isAlreadyDeferred
            ? `Deferred: ${name} (80/20 Autonomic Protection)`
            : `Defer: ${name} to Tomorrow`,
          category: 'fitness',
          badge: isAlreadyDeferred ? 'Currently Deferred' : 'Cardiac Protection',
          badgeColor: 'text-rose-300 bg-rose-500/20 border-rose-500/40',
          impact: isAlreadyDeferred
            ? 'Cardiovascular reserve protected • Streak intact'
            : 'Saves high myocardial load',
          description: isAlreadyDeferred
            ? 'Currently deferred from today\'s active list. Uncheck to restore this session to pending.'
            : 'Defers anaerobic lactic sprints to when cardiovascular autonomic reserve has rebounded.',
          scientificRationale: 'Cardiovascular strain during sleep debt blunts PGC-1α adaptations and impairs endothelial recovery.',
          defaultChecked: true,
          affectedTaskId: task.id,
          targetModalityId: task.modality_id
        })
      } else if (name.toLowerCase().includes('fast') || name.toLowerCase().includes('omad')) {
        adjustments.push({
          id: `shorten_fast_${task.id}`,
          type: 'downgrade',
          title: isAlreadyDowngraded
            ? `Adjusted: Fasting Window Shortened to 12:12`
            : `Shorten Fasting Window to Gentle 12:12`,
          category: 'lifestyle',
          badge: isAlreadyDowngraded ? 'Currently Adjusted' : 'Metabolic Balance',
          badgeColor: 'text-purple-300 bg-purple-500/20 border-purple-500/40',
          impact: 'Lowers stress hormone elevation',
          description: 'Provide timely amino acids and glucose to support cellular repair without metabolic distress.',
          scientificRationale: 'Prolonged fasting on low sleep exacerbates morning cortisol and HPA axis hyperreactivity.',
          defaultChecked: true,
          affectedTaskId: task.id,
          targetModalityId: task.modality_id
        })
      }
    }

    // B. Add Restorative Support Modalities
    const hasCreatine = todayTasks.some(t => t.modality_id === 'creatine_monohydrate' || t.loose_modality?.name?.toLowerCase().includes('creatine'))
    const hasNsdr = todayTasks.some(t => t.modality_id === 'yoga_nidra_nsdr' || t.loose_modality?.name?.toLowerCase().includes('nsdr') || t.loose_modality?.name?.toLowerCase().includes('yoga nidra'))

    adjustments.push({
      id: 'add_creatine_rescue',
      type: 'add_restorative',
      title: hasCreatine
        ? 'Active: Creatine Monohydrate (+10g Cognitive Rescue Dose)'
        : 'Add: Creatine Monohydrate (+10g Cognitive Rescue Dose)',
      category: 'supplement',
      badge: hasCreatine ? 'Active in Today\'s Routine' : 'Cerebral Bioenergetics',
      badgeColor: 'text-emerald-300 bg-emerald-500/20 border-emerald-500/40',
      impact: 'Rapidly clears sleep-loss brain fog',
      description: 'Oral creatine replenishes frontal cortical phosphocreatine pools, restoring working memory and executive function.',
      scientificRationale: 'Gordji-Nejad et al. (2024 / PMID: 36316270) demonstrated acute 10g creatine restores prefrontal ATP during acute sleep debt.',
      defaultChecked: true,
      swapModalityId: 'creatine_monohydrate',
      swapModalityName: 'Creatine Cognitive Rescue Dose',
      swapDoseText: '10g in warm water or morning shake'
    })

    adjustments.push({
      id: 'add_nsdr_rest',
      type: 'add_restorative',
      title: hasNsdr
        ? 'Active: 20-min Non-Sleep Deep Rest (NSDR / Yoga Nidra)'
        : 'Add: 20-min Non-Sleep Deep Rest (NSDR / Yoga Nidra)',
      category: 'recovery',
      badge: hasNsdr ? 'Active in Today\'s Routine' : 'Dopamine & Vagal Rebound',
      badgeColor: 'text-indigo-300 bg-indigo-500/20 border-indigo-500/40',
      impact: 'Recharges mental acuity without grogginess',
      description: 'Guided parasympathetic decompression that replenishes striatal dopamine reserves without disrupting tonight\'s sleep.',
      scientificRationale: 'Huberman Lab clinical protocols confirm 20 mins of NSDR accelerates physical recovery and restores dopamine signaling.',
      defaultChecked: true,
      swapModalityId: 'yoga_nidra_nsdr',
      swapModalityName: 'Non-Sleep Deep Rest (NSDR)',
      swapDoseText: '20 minutes guided audio at 1:00 PM – 2:30 PM'
    })

    // C. Reassure Anchors
    const anchorCount = todayTasks.filter(t => isMedAnchorModality(t) && t.status !== 'completed').length
    if (anchorCount > 0) {
      adjustments.push({
        id: 'lock_med_anchors',
        type: 'keep_anchor',
        title: `Keep: ${anchorCount} Minimum Effective Dose Anchors`,
        category: 'circadian',
        badge: 'Non-Negotiable Baseline',
        badgeColor: 'text-teal-300 bg-teal-500/20 border-teal-500/40',
        impact: 'Maintains 100% adherence with zero fatigue',
        description: 'Morning outdoor sunlight (10m), baseline hydration/electrolytes, and evening blue light blocking are protected.',
        scientificRationale: 'Low-effort circadian zeitgebers preserve master circadian clock alignment even during acute stress.',
        defaultChecked: true
      })
    }
  } else if (suggestedMode === 'peak_surge') {
    // Peak Surge Expansions
    const hasVo2 = todayTasks.some(t => t.modality_id === 'norwegian_4x4_vo2_max' || t.loose_modality?.name?.toLowerCase().includes('4x4'))
    const hasSauna = todayTasks.some(t => t.modality_id === 'finnish_sauna_extended' || t.loose_modality?.name?.toLowerCase().includes('sauna'))

    adjustments.push({
      id: 'add_vo2max_surge',
      type: 'add_surge',
      title: hasVo2
        ? 'Active: Norwegian 4x4 VO2 Max Interval Burst'
        : 'Add: Norwegian 4x4 VO2 Max Interval Burst',
      category: 'fitness',
      badge: hasVo2 ? 'Active in Today\'s Routine' : 'Max Longevity ROI',
      badgeColor: 'text-rose-300 bg-rose-500/20 border-rose-500/40',
      impact: 'Drives maximal stroke volume adaptation',
      description: '4 sets of 4 minutes at 90%–95% max HR with 3-minute active recoveries. Best performed when readiness is >80%.',
      scientificRationale: 'Helgerud et al. (2007 / PMID: 17414804) proved 4x4 intervals produce double the VO2 max expansion of standard Zone 2.',
      defaultChecked: true,
      swapModalityId: 'norwegian_4x4_vo2_max',
      swapModalityName: 'Norwegian 4x4 VO2 Max Intervals',
      swapDoseText: '4 x 4 mins at 90–95% HRmax (28 mins total)'
    })

    adjustments.push({
      id: 'extend_sauna_surge',
      type: 'add_surge',
      title: hasSauna
        ? 'Active: Finnish Sauna (Extended to 25 mins at 174°F+)'
        : 'Extend: Finnish Sauna to 25 mins at 174°F+',
      category: 'thermal',
      badge: hasSauna ? 'Active in Today\'s Routine' : 'Heat Shock Surge',
      badgeColor: 'text-amber-300 bg-amber-500/20 border-amber-500/40',
      impact: 'Maximal HSP70 and growth hormone induction',
      description: 'Capitalize on peak parasympathetic stability with a prolonged hyperthermic conditioning exposure.',
      scientificRationale: 'Laukkanen et al. (2015 / PMID: 25705824) showed 20+ minute sauna exposures produce a 50% risk reduction in fatal cardiovascular events.',
      defaultChecked: true,
      swapModalityId: 'finnish_sauna_extended',
      swapModalityName: 'Extended Finnish Sauna (25 mins)',
      swapDoseText: '25 minutes continuous at 174°F+ (79°C+)'
    })
  }

  return {
    suggestedMode,
    readinessScore,
    readinessSource,
    headline,
    rationale,
    adjustments
  }
}
