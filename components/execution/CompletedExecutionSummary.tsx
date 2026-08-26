import React from 'react'
import { Edit2 } from 'lucide-react'

type Props = {
  modalityType: string
  loggingType: string
  details: any
  onEdit?: () => void
}

export default function CompletedExecutionSummary({ modalityType, loggingType, details, onEdit }: Props) {
  if (!details) return null

  // --- STRENGTH SUMMARY ---
  if (loggingType === 'strength' && details.sets && details.sets.length > 0) {
    // Group by lift
    const grouped: Record<string, typeof details.sets> = {}
    details.sets.forEach((set: any) => {
      if (!set.lift) return
      if (!grouped[set.lift]) grouped[set.lift] = []
      grouped[set.lift].push(set)
    })

    return (
      <div className="w-full mt-3 p-3 bg-black/20 rounded-lg border border-white/5 relative group">
        <div className="text-[10px] text-levl-text-secondary uppercase tracking-wider font-bold mb-2 flex items-center justify-between">
          <span>Execution Summary</span>
          {onEdit && (
            <button onClick={onEdit} className="text-gray-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer">
              <Edit2 size={10} /> Edit
            </button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-300 mb-3 pb-2 border-b border-white/10">
          {details.duration && <span>{details.duration} min</span>}
          {details.intensity && <span>Intensity: {details.intensity}/10 RPE</span>}
          {details.bfr_pressure_mmhg && <span className="text-amber-300 font-medium">BFR: {details.bfr_pressure_mmhg} mmHg</span>}
          {details.grip_force_lbs && <span className="text-emerald-300 font-medium">Grip: {details.grip_force_lbs} lbs ({details.grip_hand || 'both'})</span>}
          {details.avg_hr && <span>Avg HR: {details.avg_hr} bpm</span>}
          {details.max_hr && <span>Max HR: {details.max_hr} bpm</span>}
          {details.active_calories && <span className="text-amber-400 font-medium">{details.active_calories} kcal</span>}
          {details.strain && <span className="text-cyan-400 font-medium">Strain: {details.strain}</span>}
        </div>

        <div className="space-y-1.5">
          {Object.entries(grouped).map(([lift, sets]: [string, any[]]) => {
            const allSame = sets.every(s => s.weight === sets[0].weight && s.reps === sets[0].reps)
            
            let summaryString = ""
            if (allSame && sets.length > 1) {
              summaryString = `${sets.length} sets @ ${sets[0].weight}lbs × ${sets[0].reps} reps`
            } else {
              summaryString = sets.map(s => `${s.weight}×${s.reps}`).join(', ')
            }

            return (
              <div key={lift} className="flex justify-between text-xs">
                <span className="font-semibold text-gray-300">{lift}</span>
                <span className="text-gray-400 font-mono">{summaryString}</span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // --- CARDIO & ENDURANCE SUMMARY ---
  if (
    loggingType === 'cardio' || 
    details.cardio_type || 
    details.avg_hr || 
    details.distance || 
    details.watts || 
    details.elevation_ft ||
    details.incline_pct ||
    details.ruck_weight_lbs ||
    (modalityType && (
      modalityType.toLowerCase().includes('cardio') || 
      modalityType.toLowerCase().includes('run') || 
      modalityType.toLowerCase().includes('cycle') || 
      modalityType.toLowerCase().includes('hiit') || 
      modalityType.toLowerCase().includes('micro')
    ))
  ) {
    return (
      <div className="w-full mt-3 p-3 bg-black/20 rounded-lg border border-white/5 relative group">
        <div className="text-[10px] text-levl-text-secondary uppercase tracking-wider font-bold mb-2 flex items-center justify-between">
          <span>Cardio & Endurance Execution Summary</span>
          {onEdit && (
            <button onClick={onEdit} className="text-gray-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer">
              <Edit2 size={10} /> Edit
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-300">
          {details.cardio_type && <span className="font-bold text-levl-accent">{details.cardio_type}</span>}
          {details.distance && <span>{details.distance} mi</span>}
          {details.duration && <span>{details.duration} min</span>}
          {details.time_in_zone_2_min && <span className="text-emerald-400 font-medium">Zone 2: {details.time_in_zone_2_min}m</span>}
          {details.incline_pct && <span className="text-amber-300 font-medium">Incline: {details.incline_pct}%</span>}
          {details.ruck_weight_lbs && <span className="text-emerald-300 font-medium">Ruck Wt: {details.ruck_weight_lbs} lbs</span>}
          {details.pace_500m && <span className="text-cyan-300 font-medium">Pace: {details.pace_500m}/500m</span>}
          {details.intensity && <span>Intensity: {details.intensity}/10</span>}
          {details.avg_hr && <span>Avg HR: {details.avg_hr} bpm</span>}
          {details.max_hr && <span>Max HR: {details.max_hr} bpm</span>}
          {details.watts && <span>Power: {details.watts} W</span>}
          {details.elevation_ft && <span>Elev: {details.elevation_ft} ft</span>}
          {details.active_calories && <span className="text-amber-400 font-medium">{details.active_calories} kcal</span>}
          {details.strain && <span className="text-cyan-400 font-medium">Strain: {details.strain}</span>}
          {details.hr_recovery_1m && <span className="text-rose-400 font-medium">1m Drop: {details.hr_recovery_1m} bpm</span>}
        </div>
      </div>
    )
  }

  // --- FASTING SUMMARY ---
  if (details.fast_type !== undefined || (modalityType && modalityType.toLowerCase().includes('fast')) || details.ketones || details.refeed_meal_type) {
    const gkiInfo = (details.glucose && details.ketones && Number(details.ketones) > 0)
      ? parseFloat((Number(details.glucose) / (18 * Number(details.ketones))).toFixed(2))
      : null

    return (
      <div className="w-full mt-3 p-3 bg-black/20 rounded-lg border border-white/5 relative group">
        <div className="text-[10px] text-levl-text-secondary uppercase tracking-wider font-bold mb-2 flex items-center justify-between">
          <span>Precision Fasting & Autophagy Summary</span>
          {onEdit && (
            <button onClick={onEdit} className="text-gray-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer">
              <Edit2 size={10} /> Edit
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-300">
          {details.duration && <span className="font-bold text-levl-accent">{details.duration} Hours Logged</span>}
          {details.fast_type && <span>{details.fast_type}</span>}
          {details.ketones && <span>Ketones: {details.ketones} mmol/L</span>}
          {details.glucose && <span>Glucose: {details.glucose} mg/dL</span>}
          {gkiInfo && <span className="font-mono font-bold text-purple-400">GKI: {gkiInfo}</span>}
          {details.refeed_meal_type && <span className="capitalize text-emerald-400">Refeed: {details.refeed_meal_type.replace('_', ' ')}</span>}
          {details.gi_comfort_score && <span>GI Comfort: {details.gi_comfort_score}/10</span>}
          {details.sodium_mg && <span>Sodium: {details.sodium_mg}mg</span>}
          {details.water_oz && <span>Water: {details.water_oz}oz</span>}
        </div>
      </div>
    )
  }

  // --- THERMAL SUMMARY ---
  if (loggingType === 'thermal' || details.exposure_type || details.temperature || (details.round_details && details.round_details.length > 0)) {
    const hasRounds = details.round_details && details.round_details.length > 0
    return (
      <div className="w-full mt-3 p-3 bg-black/20 rounded-lg border border-white/5 relative group">
        <div className="text-[10px] text-levl-text-secondary uppercase tracking-wider font-bold mb-2 flex items-center justify-between">
          <span>Thermal Exposure Summary</span>
          {onEdit && (
            <button onClick={onEdit} className="text-gray-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer">
              <Edit2 size={10} /> Edit
            </button>
          )}
        </div>
        
        {hasRounds ? (
          <div className="space-y-1.5 text-xs text-gray-300">
            {details.round_details.map((round: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center bg-white/5 px-2 py-1 rounded">
                <span className="font-semibold capitalize text-levl-accent">
                  R{idx + 1}: {round.exposure_type?.replace('_', ' ')}
                </span>
                <span className="font-mono text-gray-300">
                  {round.duration ? `${round.duration}m` : ''} {round.temperature ? `@ ${round.temperature}°${details.temperature_unit || 'F'}` : ''}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-300">
            {details.exposure_type && <span className="font-bold text-levl-accent capitalize">{details.exposure_type.replace('_', ' ')}</span>}
            {details.temperature && <span>Temp: {details.temperature}°{details.temperature_unit || 'F'}</span>}
            {details.duration && <span>{details.duration} mins</span>}
            {details.rounds && <span>{details.rounds} rounds</span>}
          </div>
        )}
      </div>
    )
  }

  // --- BREATHWORK & MEDITATION SUMMARY ---
  if (loggingType === 'breathwork' || loggingType === 'mindfulness' || details.protocol_type || details.max_retention_sec || details.subjective_depth || details.include_breathwork !== undefined) {
    return (
      <div className="w-full mt-3 p-3 bg-black/20 rounded-lg border border-white/5 relative group">
        <div className="text-[10px] text-levl-text-secondary uppercase tracking-wider font-bold mb-2 flex items-center justify-between">
          <span>{details.include_breathwork || details.protocol_type ? 'Breathwork & Meditation Summary' : 'Mindfulness Meditation Summary'}</span>
          {onEdit && (
            <button onClick={onEdit} className="text-gray-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer">
              <Edit2 size={10} /> Edit
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-300">
          {details.protocol_type && <span className="font-bold text-levl-accent">{details.protocol_type}</span>}
          {details.duration && <span>{details.duration} mins</span>}
          {details.max_retention_sec && <span>Max Hold: {details.max_retention_sec}s</span>}
          {details.subjective_depth && <span>Depth: {details.subjective_depth}/10</span>}
          {details.hrv_change_ms && <span>HRV: {details.hrv_change_ms} ms</span>}
        </div>
      </div>
    )
  }

  // --- CARDIO SUMMARY ---
  if (loggingType === 'cardio' || details.cardio_type || details.avg_hr) {
    return (
      <div className="w-full mt-3 p-3 bg-black/20 rounded-lg border border-white/5 relative group">
        <div className="text-[10px] text-levl-text-secondary uppercase tracking-wider font-bold mb-2 flex items-center justify-between">
          <span>Cardio Execution Summary</span>
          {onEdit && (
            <button onClick={onEdit} className="text-gray-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer">
              <Edit2 size={10} /> Edit
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-300">
          {details.cardio_type && <span className="font-bold text-levl-accent">{details.cardio_type}</span>}
          {details.distance && <span>{details.distance} mi</span>}
          {details.duration && <span>{details.duration} min</span>}
          {details.avg_hr && <span>Avg HR: {details.avg_hr} bpm</span>}
          {details.max_hr && <span>Max HR: {details.max_hr} bpm</span>}
          {details.watts && <span>Power: {details.watts} W</span>}
          {details.elevation_ft && <span>Elev: {details.elevation_ft} ft</span>}
        </div>
      </div>
    )
  }

  // --- SUPPLEMENT SUMMARY ---
  if (loggingType === 'supplement' || details.timing_context || details.custom_dose) {
    return (
      <div className="w-full mt-3 p-3 bg-black/20 rounded-lg border border-white/5 relative group">
        <div className="text-[10px] text-levl-text-secondary uppercase tracking-wider font-bold mb-2 flex items-center justify-between">
          <span>Precision Supplement Summary</span>
          {onEdit && (
            <button onClick={onEdit} className="text-gray-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer">
              <Edit2 size={10} /> Edit
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-300">
          {details.custom_dose && <span className="font-bold text-levl-accent">{details.custom_dose}</span>}
          {details.timing_context && <span className="capitalize">Context: {details.timing_context.replace('_', ' ')}</span>}
          {details.water_oz && <span>Water: {details.water_oz} oz</span>}
        </div>
      </div>
    )
  }

  // --- NUTRITION & PROTEIN MACRO SUMMARY ---
  if (details.meal1_protein_g !== undefined || details.total_protein_g !== undefined || details.leucine_threshold_met !== undefined) {
    const meal1 = Number(details.meal1_protein_g) || 0
    const meal2 = Number(details.meal2_protein_g) || 0
    const meal3 = Number(details.meal3_protein_g) || 0
    const meal4 = Number(details.meal4_protein_g) || 0
    const calculatedTotal = meal1 + meal2 + meal3 + meal4

    return (
      <div className="w-full mt-3 p-3 bg-black/20 rounded-lg border border-white/5 relative group">
        <div className="text-[10px] text-amber-400 uppercase tracking-wider font-bold mb-2 flex items-center justify-between">
          <span>Nutrition & Protein Distribution Summary</span>
          {onEdit && (
            <button onClick={onEdit} className="text-gray-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer">
              <Edit2 size={10} /> Edit
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-300">
          {calculatedTotal > 0 && <span className="font-bold text-amber-300">Total Protein: {calculatedTotal}g</span>}
          {meal1 > 0 && <span>M1: {meal1}g</span>}
          {meal2 > 0 && <span>M2: {meal2}g</span>}
          {meal3 > 0 && <span>M3: {meal3}g</span>}
          {meal4 > 0 && <span>M4: {meal4}g</span>}
          {details.leucine_threshold_met && <span className="text-amber-400 font-semibold">✓ ≥3g Leucine Met</span>}
        </div>
      </div>
    )
  }

  // --- RED LIGHT / PBM SUMMARY ---
  if (details.distance_inches !== undefined || details.target_area !== undefined) {
    return (
      <div className="w-full mt-3 p-3 bg-black/20 rounded-lg border border-white/5 relative group">
        <div className="text-[10px] text-red-400 uppercase tracking-wider font-bold mb-2 flex items-center justify-between">
          <span>Photobiomodulation / Red Light Summary</span>
          {onEdit && (
            <button onClick={onEdit} className="text-gray-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer">
              <Edit2 size={10} /> Edit
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-300">
          {details.duration_min && <span className="font-bold text-red-300">{details.duration_min} min</span>}
          {details.distance_inches && <span>{details.distance_inches} in distance</span>}
          {details.target_area && <span className="capitalize">Target: {details.target_area.replace('_', ' ')}</span>}
        </div>
      </div>
    )
  }

  // --- CGM & GLUCOSE CLEARANCE SUMMARY ---
  if (details.fasting_glucose_mgdl !== undefined || details.post_meal_peak_mgdl !== undefined) {
    return (
      <div className="w-full mt-3 p-3 bg-black/20 rounded-lg border border-white/5 relative group">
        <div className="text-[10px] text-teal-400 uppercase tracking-wider font-bold mb-2 flex items-center justify-between">
          <span>CGM & Glucose Clearance Summary</span>
          {onEdit && (
            <button onClick={onEdit} className="text-gray-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer">
              <Edit2 size={10} /> Edit
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-300">
          {details.fasting_glucose_mgdl && <span>Fasting: {details.fasting_glucose_mgdl} mg/dL</span>}
          {details.post_meal_peak_mgdl && <span className="font-bold text-teal-300">Peak: {details.post_meal_peak_mgdl} mg/dL</span>}
          {details.clearance_time_min && <span>Clearance: {details.clearance_time_min} min</span>}
          {details.walk_duration_min && <span>Walk: {details.walk_duration_min} min</span>}
        </div>
      </div>
    )
  }

  // --- SLEEP HYGIENE SUMMARY ---
  if (details.room_temp_f !== undefined || details.sleep_latency_min !== undefined || details.mouth_tape_used !== undefined) {
    return (
      <div className="w-full mt-3 p-3 bg-black/20 rounded-lg border border-white/5 relative group">
        <div className="text-[10px] text-indigo-400 uppercase tracking-wider font-bold mb-2 flex items-center justify-between">
          <span>Sleep Hygiene & Environment Summary</span>
          {onEdit && (
            <button onClick={onEdit} className="text-gray-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer">
              <Edit2 size={10} /> Edit
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-300">
          {details.room_temp_f && <span className="font-bold text-indigo-300">{details.room_temp_f}°F</span>}
          {details.sleep_latency_min && <span>Latency: {details.sleep_latency_min} min</span>}
          {details.blackout_darkness_score && <span>Darkness: {details.blackout_darkness_score}/10</span>}
          {details.mouth_tape_used && <span className="text-indigo-400 font-semibold">✓ Mouth Tape Used</span>}
        </div>
      </div>
    )
  }

  // --- BLUE-LIGHT DIMMING & MELATONIN SHIELDING SUMMARY ---
  if (details.dimming_method !== undefined || details.pre_bed_window_min !== undefined || details.overhead_lights_off !== undefined || details.screen_brightness_minimized !== undefined) {
    const formatMethod = (m: string) => {
      if (m === 'amber_glasses') return '👓 Amber Lenses (500nm+)'
      if (m === 'screen_curfew') return '📵 Screen Curfew'
      if (m === 'ambient_amber') return '🕯️ Low-Lux Amber Lights'
      if (m === 'software_filter') return '📱 Red Screen Filter'
      return m
    }

    return (
      <div className="w-full mt-3 p-3 bg-black/20 rounded-lg border border-white/5 relative group">
        <div className="text-[10px] text-amber-400 uppercase tracking-wider font-bold mb-2 flex items-center justify-between">
          <span>Melatonin Onset & Blue-Light Shielding Summary</span>
          {onEdit && (
            <button onClick={onEdit} className="text-gray-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer">
              <Edit2 size={10} /> Edit
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-300">
          {details.pre_bed_window_min && <span className="font-bold text-amber-300">{details.pre_bed_window_min} min pre-bed</span>}
          {details.dimming_method && <span className="text-amber-200">{formatMethod(details.dimming_method)}</span>}
          {details.lux_level && <span className="capitalize">{details.lux_level.replace('_', ' ')}</span>}
          {details.overhead_lights_off && <span className="text-amber-400 font-semibold">✓ Overhead Lights Off</span>}
          {details.screen_brightness_minimized && <span className="text-amber-400 font-semibold">✓ Screens Dimmed &lt;20%</span>}
        </div>
      </div>
    )
  }

  // --- SUNLIGHT CIRCADIAN SUMMARY ---
  if (details.sky_condition !== undefined || details.within_30m_waking !== undefined) {
    return (
      <div className="w-full mt-3 p-3 bg-black/20 rounded-lg border border-white/5 relative group">
        <div className="text-[10px] text-yellow-400 uppercase tracking-wider font-bold mb-2 flex items-center justify-between">
          <span>Sunlight & Circadian Photic Summary</span>
          {onEdit && (
            <button onClick={onEdit} className="text-gray-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer">
              <Edit2 size={10} /> Edit
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-300">
          {details.duration_min && <span className="font-bold text-yellow-300">{details.duration_min} min</span>}
          {details.sky_condition && <span className="capitalize">{details.sky_condition.replace('_', ' ')}</span>}
          {details.within_30m_waking && <span className="text-yellow-400 font-semibold">✓ Within 30m Waking</span>}
        </div>
      </div>
    )
  }

  // --- GENERIC SUMMARY ---
  if (details.duration || details.intensity) {
    return (
      <div className="w-full mt-3 p-3 bg-black/20 rounded-lg border border-white/5 relative group">
        <div className="text-[10px] text-levl-text-secondary uppercase tracking-wider font-bold mb-2 flex items-center justify-between">
          <span>Execution Summary</span>
          {onEdit && (
            <button onClick={onEdit} className="text-gray-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer">
              <Edit2 size={10} /> Edit
            </button>
          )}
        </div>
        <div className="flex gap-4 text-xs text-gray-300">
          {details.duration && <span>{details.duration} min</span>}
          {details.intensity && <span>Intensity: {details.intensity}/10</span>}
        </div>
      </div>
    )
  }

  return null
}
