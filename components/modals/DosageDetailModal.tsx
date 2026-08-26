'use client'

import React, { useState, useEffect } from 'react'
import { Modality, UserProfile } from '../../lib/types'
import { resolveRecommendedDose, ProtocolDoseContext, getProtocolColorBadge } from '../../lib/utils/resolveRecommendedDose'
import { 
  ShieldCheck, Info, Sparkles, CheckCircle2, ChevronRight, X, Layers, Scale, ExternalLink, 
  BookOpen, Clock, Sliders, Bot, AlertTriangle, ChevronDown, ChevronUp, FileText, Edit3, CheckSquare, Square
} from 'lucide-react'
import { assessSafetyWithAI } from '../../lib/data'
import { getCircadianTipForModality } from '../../lib/utils/circadianTimingTips'
import { ModalityAICoachBar } from '../ai/ModalityAICoachBar'

export const CHRONOLOGICAL_TIMING_PRESETS = [
  { label: '🌅 Upon Waking (6:00 AM – 8:00 AM)', value: 'Upon Waking (6:00 AM – 8:00 AM)' },
  { label: '🍳 Morning / With Breakfast (8:00 AM – 10:00 AM)', value: 'Morning / With Breakfast (8:00 AM – 10:00 AM)' },
  { label: '☀️ Mid-Day / Lunch (12:00 PM – 2:00 PM)', value: 'Mid-Day / Lunch (12:00 PM – 2:00 PM)' },
  { label: '☕ Late Afternoon (4:00 PM – 6:00 PM)', value: 'Late Afternoon (4:00 PM – 6:00 PM)' },
  { label: '🍽️ Evening / Post-Meal (6:00 PM – 8:00 PM)', value: 'Evening / Post-Meal (6:00 PM – 8:00 PM)' },
  { label: '🌙 Pre-Bed / Night (9:00 PM – 11:00 PM)', value: 'Pre-Bed / Night (9:00 PM – 11:00 PM)' },
  { label: '⚡ Fasting Window / Flexible', value: 'Fasting Window / Flexible' }
]

export function matchDefaultTimingPreset(timingText?: string): { presetValue: string; isCustom: boolean; customText: string } {
  if (!timingText || !timingText.trim()) {
    return { presetValue: CHRONOLOGICAL_TIMING_PRESETS[0].value, isCustom: false, customText: '' }
  }

  const lower = timingText.toLowerCase()

  const exactMatch = CHRONOLOGICAL_TIMING_PRESETS.find(p => p.value === timingText || p.label === timingText)
  if (exactMatch) {
    return { presetValue: exactMatch.value, isCustom: false, customText: '' }
  }

  if (lower.includes('bed') || lower.includes('sleep') || lower.includes('night') || lower.includes('9:00 pm') || lower.includes('10:00 pm') || lower.includes('11:00 pm')) {
    return { presetValue: 'Pre-Bed / Night (9:00 PM – 11:00 PM)', isCustom: false, customText: '' }
  }
  if (lower.includes('post-meal') || lower.includes('dinner') || lower.includes('evening') || lower.includes('6:00 pm') || lower.includes('7:00 pm') || lower.includes('8:00 pm')) {
    return { presetValue: 'Evening / Post-Meal (6:00 PM – 8:00 PM)', isCustom: false, customText: '' }
  }
  if (lower.includes('waking') || lower.includes('6:00 am') || lower.includes('7:00 am') || lower.includes('fasted morning')) {
    return { presetValue: 'Upon Waking (6:00 AM – 8:00 AM)', isCustom: false, customText: '' }
  }
  if (lower.includes('morning') || lower.includes('breakfast') || lower.includes('8:00 am') || lower.includes('9:00 am') || lower.includes('10:00 am')) {
    return { presetValue: 'Morning / With Breakfast (8:00 AM – 10:00 AM)', isCustom: false, customText: '' }
  }
  if (lower.includes('mid-day') || lower.includes('lunch') || lower.includes('12:00 pm') || lower.includes('1:00 pm') || lower.includes('2:00 pm')) {
    return { presetValue: 'Mid-Day / Lunch (12:00 PM – 2:00 PM)', isCustom: false, customText: '' }
  }
  if (lower.includes('afternoon') || lower.includes('4:00 pm') || lower.includes('5:00 pm')) {
    return { presetValue: 'Late Afternoon (4:00 PM – 6:00 PM)', isCustom: false, customText: '' }
  }
  if (lower.includes('fasting') || lower.includes('flexible') || lower.includes('as needed') || lower.includes('daily as needed') || lower.includes('daily or as needed') || lower.includes('daily')) {
    return { presetValue: 'Fasting Window / Flexible', isCustom: false, customText: '' }
  }

  return { presetValue: 'CUSTOM', isCustom: true, customText: timingText }
}

export function parseTimingState(timingText?: string) {
  if (!timingText || !timingText.trim()) {
    return {
      dosesPerDay: 1,
      dose1Timing: CHRONOLOGICAL_TIMING_PRESETS[0].value,
      dose2Timing: 'Pre-Bed / Night (9:00 PM – 11:00 PM)',
      dose3Timing: 'Evening / Post-Meal (6:00 PM – 8:00 PM)',
      isCustom: false,
      customText: ''
    }
  }

  let count = 1
  if (timingText.includes('3x Daily') || timingText.includes('+ Dose 3')) {
    count = 3
  } else if (timingText.includes('2x Daily') || timingText.includes('+ Dose 2') || timingText.toLowerCase().includes('2x daily') || timingText.toLowerCase().includes('split am / pm')) {
    count = 2
  }

  if (timingText.includes('Dose 1') || timingText.includes(' + ')) {
    const parts = timingText.split(/\s*\+\s*/)
    const cleanPart = (str?: string) => {
      if (!str) return ''
      return str
        .replace(/^[23]x Daily:\s*/i, '')
        .replace(/^Dose \d+\s*\(/i, '')
        .replace(/\)$/, '')
        .trim()
    }

    const d1Str = cleanPart(parts[0])
    const d2Str = cleanPart(parts[1])
    const d3Str = cleanPart(parts[2])

    const m1 = matchDefaultTimingPreset(d1Str)
    const m2 = matchDefaultTimingPreset(d2Str)
    const m3 = matchDefaultTimingPreset(d3Str)

    return {
      dosesPerDay: count,
      dose1Timing: m1.presetValue,
      dose2Timing: m2.presetValue || 'Pre-Bed / Night (9:00 PM – 11:00 PM)',
      dose3Timing: m3.presetValue || 'Evening / Post-Meal (6:00 PM – 8:00 PM)',
      isCustom: m1.isCustom,
      customText: m1.isCustom ? d1Str : ''
    }
  }

  const match = matchDefaultTimingPreset(timingText)
  return {
    dosesPerDay: count,
    dose1Timing: match.presetValue,
    dose2Timing: 'Pre-Bed / Night (9:00 PM – 11:00 PM)',
    dose3Timing: 'Evening / Post-Meal (6:00 PM – 8:00 PM)',
    isCustom: match.isCustom,
    customText: match.customText
  }
}

interface DosageDetailModalProps {
  isOpen: boolean
  onClose: () => void
  modality: Modality
  userProfile?: UserProfile | null
  protocolContext?: ProtocolDoseContext | ProtocolDoseContext[] | null
  task?: any
  benchItem?: any
  existingTiming?: string
  onSelectDose?: (newDoseText: string, value: number) => void
  onOpenCustomizeOutcomes?: () => void
  onSavePersonalization?: (customDose: string, customTiming: string, notes?: string) => void
}

export const DosageDetailModal: React.FC<DosageDetailModalProps> = ({
  isOpen,
  onClose,
  modality,
  userProfile,
  protocolContext,
  task,
  benchItem,
  existingTiming,
  onSelectDose,
  onOpenCustomizeOutcomes,
  onSavePersonalization
}) => {
  if (!isOpen) return null

  const resolved = resolveRecommendedDose(modality, userProfile, protocolContext)
  const [selectedSource, setSelectedSource] = useState<string>(resolved.sourceLabel)
  const [customValue, setCustomValue] = useState<number>(resolved.recommendedValue)

  // Custom dose text override option
  const [customDoseInput, setCustomDoseInput] = useState<string>('')

  // Multi-dose frequency per day (1x, 2x, 3x daily)
  const [dosesPerDay, setDosesPerDay] = useState<number>(1)

  // Collapsed by default accordion state for Timing section
  const [isTimingSectionExpanded, setIsTimingSectionExpanded] = useState<boolean>(false)

  // Smart timing matching based on modality & active protocol
  const initialTimingText = modality.frequency || resolved.activeProtocolPreset?.notes || 'Daily as needed'
  const timingMatch = matchDefaultTimingPreset(initialTimingText)
  
  // Separate time windows for 1x, 2x, and 3x daily doses
  const [dose1Timing, setDose1Timing] = useState<string>(timingMatch.presetValue)
  const [dose2Timing, setDose2Timing] = useState<string>('Pre-Bed / Night (9:00 PM – 11:00 PM)')
  const [dose3Timing, setDose3Timing] = useState<string>('Evening / Post-Meal (6:00 PM – 8:00 PM)')

  const [customTimingText, setCustomTimingText] = useState<string>(timingMatch.customText)
  const [isCustomTimingSelected, setIsCustomTimingSelected] = useState<boolean>(timingMatch.isCustom)

  // Unique Modality AI Circadian Tip
  const circadianTip = getCircadianTipForModality(modality.name, modality.category)

  // Personal Notes state
  const [personalNotes, setPersonalNotes] = useState<string>('')

  // AI Safety Assessor & Disclaimer state
  const [aiAssessment, setAiAssessment] = useState<string | null>(null)
  const [isAssessing, setIsAssessing] = useState<boolean>(false)
  const [showDisclaimerExpanded, setShowDisclaimerExpanded] = useState<boolean>(false)

  // Secondary Parameter State (e.g. Temperature for Sauna/Cold, Intensity/Zone for HIIT/Cardio)
  const [secondaryParam, setSecondaryParam] = useState<string>('')
  const [weeklyFrequency, setWeeklyFrequency] = useState<string>('Daily')

  // Modality category detection for multi-parameter dosage inputs
  const modalityNameCat = `${modality?.name || ''} ${modality?.category || ''}`.toLowerCase()
  const isSauna = modalityNameCat.includes('sauna') || modalityNameCat.includes('heat')
  const isCold = modalityNameCat.includes('cold') || modalityNameCat.includes('plunge') || modalityNameCat.includes('ice')
  const isCardio = modalityNameCat.includes('fitness') || modalityNameCat.includes('cardio') || modalityNameCat.includes('exercise') || modalityNameCat.includes('hiit') || modalityNameCat.includes('vo2') || modalityNameCat.includes('zone') || modalityNameCat.includes('run') || modalityNameCat.includes('walk')

  let secondaryLabel = 'Synergy / Admin Vehicle'
  let secondaryPlaceholder = 'e.g. with 1 tbsp EVOO / Fat Meal'
  let secondaryPresets: string[] = ['With Fat Meal', 'Fasted AM', 'With EVOO']

  const isHoursBeforeBed = 
    modalityNameCat.includes('blue light') ||
    modalityNameCat.includes('glasses') ||
    modalityNameCat.includes('screen cutoff') ||
    modalityNameCat.includes('digital sunset') ||
    modalityNameCat.includes('dim light') ||
    modalityNameCat.includes('evening darkness') ||
    modalityNameCat.includes('food cutoff') ||
    modalityNameCat.includes('caffeine cutoff')

  if (isSauna) {
    secondaryLabel = 'Target Temperature'
    secondaryPlaceholder = 'e.g. 174°F+ / 80°C+'
    secondaryPresets = ['174°F+ (80°C+)', '185°F (85°C)', '195°F (90°C)', '160°F (71°C)']
  } else if (isCold) {
    secondaryLabel = 'Target Water Temp'
    secondaryPlaceholder = 'e.g. 50°F–55°F / 10°C–13°C'
    secondaryPresets = ['50°F–55°F (10°C–13°C)', '45°F–50°F (7°C–10°C)', '38°F–42°F (3°C–5°C)']
  } else if (isCardio) {
    secondaryLabel = 'Target Intensity / HR Zone'
    secondaryPlaceholder = 'e.g. Zone 2 (60-70% HRmax) or Zone 5 (4x4 Intervals)'
    secondaryPresets = ['Zone 2 (60-70% HRmax)', 'Zone 5 (4x4 Intervals)', 'RPE 7-8/10 (Vigorous)', 'Zone 3-4 (Tempo)']
  } else if (isHoursBeforeBed) {
    secondaryLabel = 'Bedtime Timing Target'
    secondaryPlaceholder = 'e.g. 2 Hours Prior to Bedtime'
    secondaryPresets = ['2 Hours Before Bed', '3 Hours Before Bed', '1.5 Hours Before Bed', '1 Hour Before Bed']
  }

  useEffect(() => {
    // 1. Timing State
    const initialText = existingTiming || task?.execution_details?.custom_timing || benchItem?.custom_timing || modality.frequency || resolved.activeProtocolPreset?.notes || ''
    const parsed = parseTimingState(initialText)
    setDosesPerDay(parsed.dosesPerDay)
    setDose1Timing(parsed.dose1Timing)
    setDose2Timing(parsed.dose2Timing)
    setDose3Timing(parsed.dose3Timing)
    setIsCustomTimingSelected(parsed.isCustom)
    setCustomTimingText(parsed.customText)

    // Parse execution frequency (Default to Daily)
    if (initialText.includes('3-4x') || initialText.includes('3–4x')) setWeeklyFrequency('3–4x per week')
    else if (initialText.includes('1-2x') || initialText.includes('1–2x')) setWeeklyFrequency('1–2x per week')
    else if (initialText.includes('Weekly') || initialText.includes('1x_week') || initialText.includes('1x week')) setWeeklyFrequency('1x Weekly')
    else if (initialText.includes('2x_month') || initialText.includes('2x per month') || initialText.includes('biweekly')) setWeeklyFrequency('2x per month')
    else if (initialText.includes('Monthly') || initialText.includes('1x_month') || initialText.includes('30')) setWeeklyFrequency('1x Monthly')
    else setWeeklyFrequency('Daily')

    // 2. Saved Dosage Target & Secondary Parameter
    const savedDose = task?.execution_details?.custom_dose || benchItem?.custom_dose || modality?.dose_or_exposure || ''
    if (savedDose && savedDose.trim()) {
      if (savedDose.includes('@')) {
        const parts = savedDose.split('@')
        const mainDose = parts[0].trim()
        const secDose = parts.slice(1).join('@').trim()
        setCustomDoseInput(mainDose.replace(/[^\d.]/g, ''))
        setSecondaryParam(secDose)
      } else {
        setCustomDoseInput(savedDose)
      }
      const num = parseFloat(savedDose)
      if (!isNaN(num) && num > 0) {
        setCustomValue(num)
      }
      setSelectedSource('Personal Target')
    }
    if (!secondaryParam && modality?.dose_or_exposure && modality.dose_or_exposure.includes('@')) {
      const sec = modality.dose_or_exposure.split('@')[1].trim()
      setSecondaryParam(sec)
    }

    // 3. Saved Personal Notes
    const savedNotes = task?.execution_details?.notes || benchItem?.notes
    if (savedNotes) {
      setPersonalNotes(savedNotes)
    }
  }, [modality?.id, existingTiming, task?.id, benchItem?.id])

  const lit = resolved.literatureRange || { min: 0, max: resolved.recommendedValue * 2, unit: resolved.unit || 'mg' }
  const unit = resolved.unit || 'mg'
  const minLit = lit.min
  const maxLit = lit.max
  const rangeSpan = Math.max(1, maxLit - minLit)

  // Calculate percentage along spectrum bar (0 to 100%)
  const getPct = (val: number) => {
    const clamped = Math.min(Math.max(val, minLit), maxLit)
    return Math.round(((clamped - minLit) / rangeSpan) * 100)
  }

  const handleSelect = (doseText: string, val: number, sourceLabel: string) => {
    setSelectedSource(sourceLabel)
    setCustomValue(val)
    setCustomDoseInput(`${val}`)
    if (doseText.includes('@')) {
      const sec = doseText.split('@')[1].trim()
      setSecondaryParam(sec)
    }
    if (onSelectDose) {
      onSelectDose(doseText, val)
    }
  }

  const getFormattedDoseOutput = () => {
    const totalDose = customDoseInput ? parseFloat(customDoseInput) || customValue : customValue
    let baseStr = `${totalDose} ${unit}`
    if (dosesPerDay > 1) {
      const perDose = Math.round((totalDose / dosesPerDay) * 10) / 10
      baseStr = `${totalDose} ${unit} total (${dosesPerDay}x daily split: ${perDose} ${unit} / dose)`
    }
    if (secondaryParam && secondaryParam.trim()) {
      return `${baseStr} @ ${secondaryParam.trim()}`
    }
    return baseStr
  }

  const getEffectiveTimingString = () => {
    let timeWindowStr = ''
    if (isCustomTimingSelected && customTimingText) {
      timeWindowStr = customTimingText
    } else if (dosesPerDay === 1) {
      timeWindowStr = dose1Timing
    } else if (dosesPerDay === 2) {
      timeWindowStr = `2x Daily: Dose 1 (${dose1Timing}) + Dose 2 (${dose2Timing})`
    } else {
      timeWindowStr = `3x Daily: Dose 1 (${dose1Timing}) + Dose 2 (${dose2Timing}) + Dose 3 (${dose3Timing})`
    }

    if (weeklyFrequency && weeklyFrequency !== 'Daily') {
      return `${weeklyFrequency} • ${timeWindowStr}`
    }
    return timeWindowStr
  }

  const handleAssessSafety = async () => {
    setIsAssessing(true)
    const effectiveTiming = getEffectiveTimingString()
    const doseText = getFormattedDoseOutput()
    const assessment = await assessSafetyWithAI(
      modality.name, 
      `${doseText} | ${effectiveTiming}`, 
      `${modality.dose_or_exposure} ${modality.frequency || ''}`
    )
    setAiAssessment(assessment)
    setIsAssessing(false)
  }

  // Color map helper
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'emerald':
        return {
          bg: 'bg-emerald-950/80',
          border: 'border-emerald-600',
          text: 'text-emerald-300',
          pinBg: 'bg-emerald-400',
          shadow: 'shadow-[0_0_10px_rgba(52,211,153,0.8)]'
        }
      case 'amber':
      case 'orange':
        return {
          bg: 'bg-amber-950/80',
          border: 'border-amber-500',
          text: 'text-amber-300',
          pinBg: 'bg-amber-400',
          shadow: 'shadow-[0_0_10px_rgba(251,191,36,0.8)]'
        }
      case 'cyan':
        return {
          bg: 'bg-cyan-950/80',
          border: 'border-cyan-600',
          text: 'text-cyan-300',
          pinBg: 'bg-cyan-400',
          shadow: 'shadow-[0_0_10px_rgba(34,211,238,0.8)]'
        }
      case 'pink':
        return {
          bg: 'bg-pink-950/80',
          border: 'border-pink-600',
          text: 'text-pink-300',
          pinBg: 'bg-pink-400',
          shadow: 'shadow-[0_0_10px_rgba(244,114,182,0.8)]'
        }
      case 'indigo':
        return {
          bg: 'bg-indigo-950/80',
          border: 'border-indigo-600',
          text: 'text-indigo-300',
          pinBg: 'bg-indigo-400',
          shadow: 'shadow-[0_0_10px_rgba(129,140,248,0.8)]'
        }
      case 'blue':
        return {
          bg: 'bg-blue-950/80',
          border: 'border-blue-600',
          text: 'text-blue-300',
          pinBg: 'bg-blue-400',
          shadow: 'shadow-[0_0_10px_rgba(96,165,250,0.8)]'
        }
      case 'purple':
      default:
        return {
          bg: 'bg-purple-950/80',
          border: 'border-purple-600',
          text: 'text-purple-300',
          pinBg: 'bg-purple-400',
          shadow: 'shadow-[0_0_10px_rgba(192,132,252,0.8)]'
        }
    }
  }

  const activeColor = getColorClasses(resolved.badgeColor)
  const activeProtoPreset = resolved.activeProtocolPreset
  const comparisonProtocols = resolved.allProtocolPresets.filter(p => p.protocolName !== activeProtoPreset?.protocolName)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 md:p-6 animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-xl md:max-w-3xl lg:max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[92vh] min-h-0 my-auto">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-start justify-between bg-slate-950/90 backdrop-blur-md shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400 bg-teal-950/80 border border-teal-800/60 px-3 py-1 rounded-full flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5" /> Dosage & Timing Intelligence
              </span>
              <span className="text-xs text-slate-300 font-medium">• {modality.category || 'Supplement'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">{modality.name}</h2>
            {modality.headline_benefit && (
              <p className="text-xs sm:text-sm text-slate-300 line-clamp-1">{modality.headline_benefit}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800/80 transition-colors shrink-0 ml-2"
            aria-label="Close dosage detail modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-5 sm:p-6 md:p-7 overflow-y-auto custom-scrollbar space-y-6 flex-1 min-h-0 text-slate-200">
          
          {/* AI Modality & Protocol Synergy Coach Bar */}
          <ModalityAICoachBar
            modalityName={modality?.name || 'Protocol Modality'}
            modalityDetails={modality}
            protocolName={activeProtoPreset?.protocolName}
            currentDose={`${customDoseInput ? customDoseInput : customValue} ${unit}`}
            currentTiming={getEffectiveTimingString()}
            userProfile={userProfile}
            onApplyDose={(dose) => {
              const cleaned = dose.replace(/[^\d.]/g, '')
              if (cleaned) {
                setCustomDoseInput(cleaned)
                const num = parseFloat(cleaned)
                if (!isNaN(num)) setCustomValue(num)
              } else {
                setCustomDoseInput(dose)
              }
              setSelectedSource('Personal Target')
            }}
            onApplyTiming={(timing) => {
              const matched = matchDefaultTimingPreset(timing)
              setDose1Timing(matched.presetValue)
              if (matched.isCustom) setCustomTimingText(matched.customText)
            }}
            onApplyMultiDose={(count, s1, s2, s3) => {
              setDosesPerDay(count)
              if (s1) {
                const m1 = matchDefaultTimingPreset(s1)
                setDose1Timing(m1.presetValue)
                if (m1.isCustom) setCustomTimingText(m1.customText)
              }
              if (s2) setDose2Timing(s2)
              if (s3) setDose3Timing(s3)
              setIsTimingSectionExpanded(true)
            }}
            onApplyCadence={(mode, days, restDays) => {
              if (days && days.length > 0 && days.length < 7) {
                setWeeklyFrequency(`${days.length}x / week (${days.join(', ')})`)
              } else if (restDays !== undefined && restDays !== null) {
                setWeeklyFrequency(`Every ${restDays + 1} Days (${restDays}d rest)`)
              }
            }}
            onAppendNotes={(note) => {
              setPersonalNotes(prev => prev ? `${prev}\n\n${note}` : note)
            }}
          />

          {/* SECTION 1: Active Context Recommendation Card */}
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900 border border-slate-700/70 rounded-2xl p-5 shadow-lg space-y-3.5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Context Recommendation</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-baseline gap-2">
                  <span>{customDoseInput ? customDoseInput : customValue} {unit}</span>
                  <span className="text-xs sm:text-sm font-normal text-slate-400">/ day</span>
                </div>
              </div>
              <div className={`px-3.5 py-1.5 rounded-xl border text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-sm ${activeColor.bg} ${activeColor.border} ${activeColor.text}`}>
                {resolved.source === 'sensitivity_starter' && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
                {resolved.source === 'protocol_preset' && <Sparkles className="w-4 h-4 text-amber-400" />}
                {resolved.source === 'personalized_target' && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                <span>{resolved.sourceLabel}</span>
              </div>
            </div>

            {/* Active Execution Timing Banner & Weekly Cadence Selector */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-purple-500/40 space-y-2.5">
              <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                <div className="flex items-center gap-2 text-purple-300 font-semibold">
                  <Clock className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Active Execution Timing:</span>
                </div>
                <span className="font-mono text-white font-bold bg-purple-500/20 border border-purple-500/40 px-2.5 py-1 rounded-lg text-xs truncate max-w-[280px]">
                  {getEffectiveTimingString()}
                </span>
              </div>

              {/* Weekly Frequency Cadence Quick Buttons */}
              <div className="pt-2 border-t border-purple-500/20 space-y-1.5">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-purple-300/80">Execution Frequency Cadence:</span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {[
                    { value: 'Daily', label: 'Daily' },
                    { value: '3–4x per week', label: '3–4x/wk' },
                    { value: '1–2x per week', label: '1–2x/wk' },
                    { value: '1x Weekly', label: '1x Weekly' },
                    { value: '2x per month', label: '2x/Month' },
                    { value: '1x Monthly', label: '1x Monthly' }
                  ].map((freq) => (
                    <button
                      key={freq.value}
                      type="button"
                      onClick={() => setWeeklyFrequency(freq.value)}
                      className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all text-center cursor-pointer select-none active:scale-95 ${
                        weeklyFrequency === freq.value
                          ? 'bg-purple-950 border-purple-400 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)] ring-1 ring-purple-400'
                          : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      {freq.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Rationale explanation */}
            <div className="pt-2 border-t border-slate-700/60 flex items-start gap-2.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <Info className="w-4 h-4 sm:w-5 sm:h-5 text-teal-400 shrink-0 mt-0.5" />
              <p>{resolved.rationale}</p>
            </div>
          </div>

          {/* SECTION 2: Interactive Dosage Spectrum & Marker Cards */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 space-y-5">
            <div className="flex items-center justify-between text-xs sm:text-sm font-medium text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="font-semibold text-white">Literature Range</span>
                <span className="text-slate-400 font-normal hidden sm:inline">(Outliers excluded)</span>
              </span>
              <span className="font-bold text-teal-400 font-mono text-xs sm:text-sm">{minLit} {unit} – {maxLit} {unit}</span>
            </div>

            {/* Spectrum Track Bar */}
            <div className="relative my-4 py-2">
              <div className="h-4 w-full bg-slate-800/90 rounded-full overflow-hidden relative border border-slate-700/60 shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-amber-500 rounded-full transition-all duration-300 opacity-90"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Starter Pin */}
              {resolved.starterDose && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer z-10 group"
                  style={{ left: `${Math.max(4, Math.min(96, getPct(resolved.starterDose.value)))}%` }}
                  onClick={() => handleSelect(`${resolved.starterDose!.value} ${unit}`, resolved.starterDose!.value, 'Starter Dose')}
                  title={`Starter: ${resolved.starterDose.value} ${unit}`}
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-400 border-2 border-slate-950 shadow-[0_0_10px_rgba(52,211,153,0.8)] group-hover:scale-125 transition-transform" />
                </div>
              )}

              {/* Personal Target Pin */}
              {resolved.personalizedTargetDose && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer z-10 group"
                  style={{ left: `${Math.max(4, Math.min(96, getPct(resolved.personalizedTargetDose.value)))}%` }}
                  onClick={() => handleSelect(`${resolved.personalizedTargetDose!.value} ${unit}`, resolved.personalizedTargetDose!.value, 'Personal Target')}
                  title={`Personal Target: ${resolved.personalizedTargetDose.value} ${unit}`}
                >
                  <div className="w-5 h-5 rounded-full bg-blue-400 border-2 border-slate-950 shadow-[0_0_10px_rgba(96,165,250,0.8)] group-hover:scale-125 transition-transform" />
                </div>
              )}

              {/* Active Protocol Pins */}
              {resolved.allProtocolPresets.map((proto, i) => {
                const color = getColorClasses(proto.colorBadge)
                return (
                  <div
                    key={i}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer z-20 group"
                    style={{ left: `${Math.max(4, Math.min(96, getPct(proto.doseAmount)))}%` }}
                    onClick={() => handleSelect(proto.doseText, proto.doseAmount, proto.protocolName)}
                    title={`${proto.protocolName}: ${proto.doseText}`}
                  >
                    <div className={`w-5 h-5 rounded-full ${color.pinBg} border-2 border-slate-950 ${color.shadow} group-hover:scale-125 transition-transform`} />
                  </div>
                )
              })}
            </div>

            {/* RECOMMENDED MARKER ROW CARDS FIRST */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              {resolved.starterDose && (
                <div
                  onClick={() => handleSelect(`${resolved.starterDose!.value} ${unit}`, resolved.starterDose!.value, 'Starter Dose')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    selectedSource === 'Starter Dose'
                      ? 'bg-emerald-950/60 border-emerald-500/80 shadow-[0_0_12px_rgba(10,185,129,0.2)]'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-400 shrink-0" />
                    <span className="text-xs font-semibold text-emerald-300">Starter</span>
                  </div>
                  <div className="text-sm font-bold font-mono text-white mt-1">{resolved.starterDose.value} {unit}</div>
                </div>
              )}

              {resolved.personalizedTargetDose && (
                <div
                  onClick={() => handleSelect(`${resolved.personalizedTargetDose!.value} ${unit}`, resolved.personalizedTargetDose!.value, 'Personal Target')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    selectedSource === 'Personal Target'
                      ? 'bg-blue-950/60 border-blue-500/80 shadow-[0_0_12px_rgba(59,130,246,0.2)]'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-400 shrink-0" />
                    <span className="text-xs font-semibold text-blue-300">Personal Target</span>
                  </div>
                  <div className="text-sm font-bold font-mono text-white mt-1">{resolved.personalizedTargetDose.value} {unit}</div>
                </div>
              )}

              {activeProtoPreset && (
                <div
                  onClick={() => handleSelect(activeProtoPreset.doseText, activeProtoPreset.doseAmount, activeProtoPreset.protocolName)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    selectedSource === activeProtoPreset.protocolName
                      ? `${activeColor.bg} ${activeColor.border} shadow-[0_0_12px_rgba(251,191,36,0.2)]`
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${activeColor.pinBg} shrink-0`} />
                    <span className={`text-xs font-semibold ${activeColor.text} truncate`}>{activeProtoPreset.protocolName}</span>
                  </div>
                  <div className="text-sm font-bold font-mono text-white mt-1 truncate">{activeProtoPreset.doseText}</div>
                </div>
              )}
            </div>

            {/* MULTI-PARAMETER CUSTOM DOSAGE TARGET INPUT */}
            <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3 mt-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="space-y-0.5">
                  <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-teal-400" /> Multi-Parameter Custom Dosage Target:
                  </label>
                  <p className="text-[10px] text-slate-400">Specify primary value ({unit}) and secondary target parameters</p>
                </div>
                <div className="text-xs font-mono font-bold text-teal-300 bg-teal-950/80 px-2.5 py-1 rounded-lg border border-teal-800/60">
                  Target: {getFormattedDoseOutput()}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Field 1: Primary Value (Minutes / mg / IU) */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-300">
                    Primary Exposure / Dose ({unit}):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={customDoseInput || customValue}
                      onChange={(e) => {
                        const rawStr = e.target.value
                        setCustomDoseInput(rawStr)
                        const val = parseFloat(rawStr) || 0
                        setCustomValue(val)
                        setSelectedSource('Custom Dose')
                        if (onSelectDose) onSelectDose(`${val} ${unit}`, val)
                      }}
                      className="w-full bg-slate-950 border border-teal-500/50 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold text-center focus:outline-none focus:border-teal-400 shadow-inner"
                      placeholder="0"
                    />
                    <span className="text-xs font-mono font-bold text-teal-400 shrink-0">{unit}</span>
                  </div>
                </div>

                {/* Field 2: Secondary Parameter (Temp / Intensity / HR Zone / Synergy) */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-300">
                    {secondaryLabel}:
                  </label>
                  <input
                    type="text"
                    value={secondaryParam}
                    onChange={(e) => setSecondaryParam(e.target.value)}
                    placeholder={secondaryPlaceholder}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-teal-400 shadow-inner placeholder:text-slate-600"
                  />
                </div>
              </div>

              {/* Secondary Parameter Preset Quick Chips */}
              {secondaryPresets.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 flex-wrap text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Presets:</span>
                  {secondaryPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSecondaryParam(preset)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold border transition-all cursor-pointer select-none active:scale-95 ${
                        secondaryParam === preset
                          ? 'bg-teal-950 border-teal-400 text-teal-200 shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: ENROLLED PROTOCOL DETAILED SPECIFICATIONS */}
          {activeProtoPreset && (
            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 space-y-3.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${activeColor.pinBg}`} />
                  <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-teal-400" /> {activeProtoPreset.protocolName} Details
                  </h3>
                </div>
                {activeProtoPreset.sourceUrl && (
                  <a
                    href={activeProtoPreset.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-teal-400 hover:text-teal-300 bg-teal-950/80 border border-teal-800/60 px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Source Material & PubMed
                  </a>
                )}
              </div>

              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed space-y-2.5">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Sparkles className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Prescribed Protocol Dosing: <strong className="text-teal-300 font-mono">{activeProtoPreset.doseText}</strong></span>
                </div>
                <p className="text-slate-300 pt-2 border-t border-slate-800/80 leading-relaxed">{activeProtoPreset.fullProtocolInstructions || activeProtoPreset.notes}</p>
              </div>
            </div>
          )}

          {/* SECTION 4: OTHER COMPARISON PROTOCOLS SECTION */}
          {comparisonProtocols.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-purple-400" /> Comparison Protocol Dosages ({comparisonProtocols.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {comparisonProtocols.map((proto, idx) => {
                  const color = getColorClasses(proto.colorBadge)
                  const isSelected = selectedSource === proto.protocolName
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border text-left flex flex-col gap-2.5 transition-all ${
                        isSelected
                          ? `${color.bg} ${color.border} text-white shadow-md`
                          : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div
                          className="flex items-center gap-3.5 cursor-pointer flex-1"
                          onClick={() => handleSelect(proto.doseText, proto.doseAmount, proto.protocolName)}
                        >
                          <div className={`w-10 h-10 rounded-xl ${color.bg} border ${color.border} flex items-center justify-center ${color.text} shrink-0`}>
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-sm sm:text-base font-bold flex items-center gap-2 flex-wrap">
                              <span>{proto.protocolName}</span>
                              <span className={`text-xs sm:text-sm font-mono font-semibold ${color.text}`}>({proto.doseText})</span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-300 mt-0.5 leading-relaxed">{proto.notes || proto.fullProtocolInstructions}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-500 shrink-0 ml-2" />
                      </div>

                      {proto.sourceUrl && (
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-end">
                          <a
                            href={proto.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-teal-400 hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" /> Literature Source
                          </a>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* SECTION 5: PERSONALIZE EXECUTION TIMING & MULTI-DOSE FREQUENCY PER DAY (COLLAPSED BY DEFAULT) */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setIsTimingSectionExpanded(!isTimingSectionExpanded)}
              className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-900/60 transition-colors cursor-pointer"
            >
              <div className="space-y-1">
                <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-400" /> Personalize Execution Timing & Frequency
                </h3>
                <p className="text-[11px] text-purple-300 font-mono truncate max-w-[280px] sm:max-w-[420px]">
                  {dosesPerDay}x Daily • {getEffectiveTimingString()}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-purple-300 bg-purple-500/20 border border-purple-500/30 px-2.5 py-1 rounded-full font-bold">
                  {isTimingSectionExpanded ? 'Hide Timing' : 'Customize Timing'}
                </span>
                {isTimingSectionExpanded ? <ChevronUp size={16} className="text-purple-400" /> : <ChevronDown size={16} className="text-purple-400" />}
              </div>
            </button>

            {isTimingSectionExpanded && (
              <div className="p-5 pt-0 space-y-4 border-t border-slate-800/80 animate-in fade-in">
                {/* Unique Modality AI Circadian Recommendation Tip */}
                <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-800/50 flex items-start gap-2.5 text-xs text-purple-200 mt-4">
                  <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-purple-300">AI Circadian Tip: </span>
                    <span className="leading-relaxed">{circadianTip}</span>
                  </div>
                </div>

                {/* Daily Dosing Frequency Pills (1x, 2x, 3x Daily) */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <label className="block text-xs font-semibold text-slate-300">
                    Daily Session Frequency (Doses Per Day):
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { count: 1, label: '1x Daily', sub: 'Single Session' },
                      { count: 2, label: '2x Daily', sub: 'Split AM / PM' },
                      { count: 3, label: '3x Daily', sub: 'TID with Meals' }
                    ].map((freq) => (
                      <button
                        key={freq.count}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setDosesPerDay(freq.count)
                          setIsCustomTimingSelected(false)
                          if (freq.count === 2) {
                            setDose1Timing('Morning / With Breakfast (8:00 AM – 10:00 AM)')
                            setDose2Timing('Pre-Bed / Night (9:00 PM – 11:00 PM)')
                          } else if (freq.count === 3) {
                            setDose1Timing('Morning / With Breakfast (8:00 AM – 10:00 AM)')
                            setDose2Timing('Mid-Day / Lunch (12:00 PM – 2:00 PM)')
                            setDose3Timing('Evening / Post-Meal (6:00 PM – 8:00 PM)')
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer select-none active:scale-95 ${
                          dosesPerDay === freq.count
                            ? 'bg-purple-950/90 border-purple-400 text-white font-bold shadow-[0_0_12px_rgba(168,85,247,0.3)] ring-2 ring-purple-500/50'
                            : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-bold">{freq.label}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-medium">{freq.sub}</div>
                      </button>
                    ))}
                  </div>

                  {/* Multi-dose breakdown calculation box */}
                  {dosesPerDay > 1 && (
                    <div className="p-3 bg-purple-950/40 border border-purple-500/30 rounded-xl text-xs text-purple-200 flex items-center justify-between gap-2">
                      <span className="font-semibold text-purple-300">Per-Session Split Dose:</span>
                      <span className="font-mono font-bold text-white bg-purple-500/20 px-2.5 py-1 rounded-lg border border-purple-500/40">
                        {Math.round(((customDoseInput ? parseFloat(customDoseInput) || customValue : customValue) / dosesPerDay) * 10) / 10} {unit} / dose ({dosesPerDay}x daily)
                      </span>
                    </div>
                  )}
                </div>

                {/* DYNAMIC MULTI-TIME WINDOW DROPDOWN FIELDS BASED ON FREQUENCY */}
                <div className="space-y-3 pt-2 border-t border-slate-800/80">
                  {/* Dose 1 Dropdown */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      {dosesPerDay === 1 ? 'Select Execution Time Window:' : 'Dose 1 Time Window (AM / First Session):'}
                    </label>
                    <select
                      value={dose1Timing}
                      onChange={(e) => setDose1Timing(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white font-medium focus:outline-none focus:border-purple-500 transition-colors"
                    >
                      {CHRONOLOGICAL_TIMING_PRESETS.map((preset, idx) => (
                        <option key={idx} value={preset.value}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Dose 2 Dropdown (if 2x or 3x daily) */}
                  {dosesPerDay >= 2 && (
                    <div className="space-y-1 animate-in fade-in">
                      <label className="block text-xs font-semibold text-slate-300">
                        Dose 2 Time Window (PM / Second Session):
                      </label>
                      <select
                        value={dose2Timing}
                        onChange={(e) => setDose2Timing(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white font-medium focus:outline-none focus:border-purple-500 transition-colors"
                      >
                        {CHRONOLOGICAL_TIMING_PRESETS.map((preset, idx) => (
                          <option key={idx} value={preset.value}>
                            {preset.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Dose 3 Dropdown (if 3x daily) */}
                  {dosesPerDay >= 3 && (
                    <div className="space-y-1 animate-in fade-in">
                      <label className="block text-xs font-semibold text-slate-300">
                        Dose 3 Time Window (Dinner / Third Session):
                      </label>
                      <select
                        value={dose3Timing}
                        onChange={(e) => setDose3Timing(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white font-medium focus:outline-none focus:border-purple-500 transition-colors"
                      >
                        {CHRONOLOGICAL_TIMING_PRESETS.map((preset, idx) => (
                          <option key={idx} value={preset.value}>
                            {preset.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Freeform Timing Override Toggle Card */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setIsCustomTimingSelected(!isCustomTimingSelected)
                      }}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer select-none ${
                        isCustomTimingSelected
                          ? 'bg-purple-950/80 border-purple-500 text-purple-200 font-bold shadow-sm'
                          : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs">
                        {isCustomTimingSelected ? (
                          <CheckSquare className="w-4 h-4 text-purple-400 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600 shrink-0" />
                        )}
                        <span>Use Custom Freeform Timing Text Override</span>
                      </div>
                      <span className="text-[10px] text-purple-300 font-mono">
                        {isCustomTimingSelected ? 'Active' : 'Disabled'}
                      </span>
                    </button>

                    {isCustomTimingSelected && (
                      <input
                        type="text"
                        value={customTimingText}
                        onChange={(e) => setCustomTimingText(e.target.value)}
                        placeholder="e.g. 30 mins post-workout or 10:30 PM"
                        className="w-full bg-slate-950 border border-purple-500/60 rounded-xl px-3 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none mt-2 font-mono"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 6: PERSONAL NOTES & PROTOCOL REMINDERS */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" /> Personal Notes & Protocol Reminders
            </h3>
            <textarea
              value={personalNotes}
              onChange={(e) => setPersonalNotes(e.target.value)}
              placeholder="e.g. Take with 8oz room temp water, don't mix with dairy."
              rows={2}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* SECTION 7: SIDE-BY-SIDE HALF-WIDTH ACTION BUTTONS & MEDICAL DISCLAIMER */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              {/* Button 1 (50% Width): Tracked Outcomes & Bio-Signals */}
              <button
                type="button"
                onClick={() => {
                  onClose()
                  if (onOpenCustomizeOutcomes) onOpenCustomizeOutcomes()
                }}
                className="flex-1 py-3 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <Sliders className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Edit Tracked Outcomes</span>
              </button>

              {/* Button 2 (50% Width): Assess Safety with AI */}
              <button
                type="button"
                onClick={handleAssessSafety}
                disabled={isAssessing}
                className="flex-1 py-3 px-3 bg-emerald-600/80 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Bot className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>{isAssessing ? 'Assessing Safety...' : 'Assess Safety'}</span>
              </button>
            </div>

            {/* AI Safety Assessment Output Box */}
            {aiAssessment && (
              <div className="text-xs text-slate-200 p-4 bg-slate-950/90 rounded-2xl border border-emerald-500/40 animate-in fade-in space-y-1.5 shadow-md">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <Bot size={14} /> LEVL AI Safety Assessment:
                </div>
                <p className="leading-relaxed text-slate-300 font-mono text-xs">{aiAssessment}</p>
              </div>
            )}

            {/* Underneath: Small Grey Expandable Medical Disclaimer */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-xs text-slate-400 space-y-1.5">
              <button
                type="button"
                onClick={() => setShowDisclaimerExpanded(!showDisclaimerExpanded)}
                className="w-full flex items-center justify-between text-left text-[11px] font-semibold text-slate-400 hover:text-slate-300 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5 text-amber-400/80 font-bold">
                  <AlertTriangle size={13} /> Medical Disclaimer Notice
                </span>
                <span className="text-[10px] underline flex items-center gap-0.5">
                  {showDisclaimerExpanded ? 'Show Less' : 'Expand Disclaimer'}
                  {showDisclaimerExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </span>
              </button>

              {showDisclaimerExpanded && (
                <p className="text-[11px] text-slate-400 leading-relaxed pt-1.5 border-t border-slate-800/60 animate-in fade-in">
                  Modifying dosage, administration routes, or timing windows outside of verified medical study parameters is not medically validated and may carry unknown physiological risks or reduced intervention efficacy. Always consult your healthcare provider before adjusting active protocols.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              const effectiveTiming = getEffectiveTimingString()
              const finalDose = getFormattedDoseOutput()
              if (onSelectDose) onSelectDose(finalDose, customValue)
              if (onSavePersonalization) onSavePersonalization(finalDose, effectiveTiming, personalNotes)
              onClose()
            }}
            className="px-6 py-3 rounded-xl text-xs sm:text-sm font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 transition-colors shadow-lg active:scale-95 cursor-pointer"
          >
            Save & Apply ({getFormattedDoseOutput()})
          </button>
        </div>
      </div>
    </div>
  )
}
