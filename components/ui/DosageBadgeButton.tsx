'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Modality, UserProfile } from '../../lib/types'
import { resolveRecommendedDose, ProtocolDoseContext } from '@/lib/utils/resolveRecommendedDose'
import { DosageDetailModal } from '../modals/DosageDetailModal'
import ManageTaskModal from '../modals/ManageTaskModal'
import { Sliders, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react'
import { upsertBenchItemOverride, reconcileModalityScheduleAndFutureTasks } from '../../lib/data'
import { getLocalUserId } from '../../lib/local-user/getLocalUserId'
import { useTemperatureUnit } from '../../lib/utils/useTemperatureUnit'
import { format } from 'date-fns'

interface DosageBadgeButtonProps {
  modality: Modality
  userProfile?: UserProfile | null
  protocolContext?: ProtocolDoseContext | ProtocolDoseContext[] | null
  task?: any
  benchItem?: any
  existingTiming?: string
  className?: string
  onDoseChange?: (newDoseText: string, value: number) => void
  onOpenCustomizeOutcomes?: () => void
  onSavePersonalization?: (customDose: string, customTiming: string, notes?: string) => void
}

function cleanDosagePillText(text: string): string {
  if (!text) return ''
  let cleaned = text.trim()

  // 1. If text is like "Conservative starter dose (100 mg)." or "Starter dose (1 bowl)" -> extract inside parenthetical dose!
  const parenthesizedDose = cleaned.match(/(?:starter|conservative|target|prescribed|blueprint|protocol)\s*dose[^(]*\(([^)]+)\)/i)
  if (parenthesizedDose && parenthesizedDose[1]) {
    cleaned = parenthesizedDose[1].trim()
  }

  // 2. Remove leading descriptive labels like "Conservative starter dose:", "Starter dose:", "Starter:", "Blueprint 2026:", "Target Dose:"
  cleaned = cleaned.replace(/^(?:conservative\s*starter\s*dose|starter\s*dose|starter|blueprint\s*\d*|target\s*dose|prescribed\s*dose|standard\s*dose|protocol\s*dose|valter\s*longo|longo\s*protocol|attia\s*protocol|huberman\s*protocol)[:\-–—\s]+/i, '')

  // 3. Remove trailing parenthesized protocol/dose type names (e.g. "(Blueprint 2026)", "(Starter Dose)", "(Bryan Johnson)")
  cleaned = cleaned.replace(/\s*\((?:starter\s*dose|conservative\s*starter|blueprint\s*\d*|bryan\s*johnson\s*\d*|longo\s*protocol|attia\s*protocol|huberman\s*protocol)\)/gi, '')

  // 4. Strip verbose parenthetical ingredient lists (e.g. "1 Bowl (Macadamia, Walnut, Chia, Flax, Berries...)")
  cleaned = cleaned.replace(/^(\d+(?:\.\d+)?(?:\/\d+)?\s*(?:bowl|serving|meal|cup|tbsp|tsp|shake|packet|scoop|plate)s?)\s*\([^)]+\)/i, '$1')

  // 5. Strip trailing secondary notes in parentheses if string is long (e.g. "(1.5-2.0 mmol/L lactate)", "(2-3 min rest)")
  if (cleaned.length > 28) {
    cleaned = cleaned.replace(/\s*\([^)]*(?:mmol|lactate|rest|min rest|hr|bpm)[^)]*\)/i, '')
  }

  // 6. Strip trailing punctuation like trailing periods from sentences
  cleaned = cleaned.replace(/\.$/, '').trim()

  return cleaned
}

export const DosageBadgeButton: React.FC<DosageBadgeButtonProps> = ({
  modality,
  userProfile,
  protocolContext,
  task,
  benchItem,
  existingTiming,
  className = '',
  onDoseChange,
  onOpenCustomizeOutcomes,
  onSavePersonalization
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const resolved = resolveRecommendedDose(modality, userProfile, protocolContext)
  const savedDoseText = task?.execution_details?.custom_dose || benchItem?.custom_dose
  const [activeDoseText, setActiveDoseText] = useState(savedDoseText || resolved.recommendedDoseText)

  useEffect(() => {
    if (savedDoseText) {
      setActiveDoseText(savedDoseText)
    }
  }, [savedDoseText])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleSelectDose = (newDoseText: string, val: number) => {
    setActiveDoseText(newDoseText)
    if (onDoseChange) {
      onDoseChange(newDoseText, val)
    }
  }

  const handleSavePersonalization = async (customDose: string, customTiming: string, notes?: string) => {
    if (onSavePersonalization) {
      onSavePersonalization(customDose, customTiming, notes)
    } else {
      const localUserId = getLocalUserId()
      const fromDate = task?.scheduled_date || format(new Date(), 'yyyy-MM-dd')
      await reconcileModalityScheduleAndFutureTasks(localUserId, modality.id, {
        customDose,
        customTiming,
        notes,
        fromDate,
        protocolStepId: task?.protocol_step_id || undefined,
        scheduleConfig: task?.execution_details?.schedule_config
      })
      if (onDoseChange) {
        onDoseChange(customDose, 0)
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('levl_schedule_updated'))
        window.dispatchEvent(new CustomEvent('levl_tasks_updated'))
      }
    }
  }

  // Color classes for badge
  const colorStyles = {
    emerald: 'bg-emerald-950/70 border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/80',
    purple: 'bg-purple-950/70 border-purple-700/60 text-purple-300 hover:bg-purple-900/80',
    blue: 'bg-blue-950/70 border-blue-700/60 text-blue-300 hover:bg-blue-900/80',
    amber: 'bg-amber-950/70 border-amber-600/60 text-amber-300 hover:bg-amber-900/80',
    cyan: 'bg-cyan-950/70 border-cyan-700/60 text-cyan-300 hover:bg-cyan-900/80',
    pink: 'bg-pink-950/70 border-pink-700/60 text-pink-300 hover:bg-pink-900/80',
    indigo: 'bg-indigo-950/70 border-indigo-700/60 text-indigo-300 hover:bg-indigo-900/80'
  }[resolved.badgeColor || 'blue']

  const modalElement = isModalOpen && (
    <ManageTaskModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      modality={modality}
      task={task}
      benchItem={benchItem}
      userProfile={userProfile}
      onSaveSuccess={() => {
        setIsModalOpen(false)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('levl_schedule_updated'))
          window.dispatchEvent(new CustomEvent('levl_tasks_updated'))
        }
      }}
    />
  )

  const { formatText: formatTemp } = useTemperatureUnit()
  const displayDoseText = cleanDosagePillText(activeDoseText || resolved.recommendedDoseText)

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setIsModalOpen(true)
        }}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-semibold tracking-wide transition-all shadow-sm group max-w-full min-w-0 overflow-hidden leading-tight ${colorStyles} ${className}`}
        title={`${formatTemp(displayDoseText)} (${resolved.sourceLabel}) - Click to customize`}
      >
        <span className="shrink-0">
          {resolved.source === 'sensitivity_starter' && <ShieldCheck className="w-3 h-3 text-emerald-400" />}
          {resolved.source === 'protocol_preset' && <Sparkles className="w-3 h-3 text-amber-400" />}
          {resolved.source === 'personalized_target' && <CheckCircle2 className="w-3 h-3 text-blue-400" />}
        </span>

        <span className="font-mono text-white text-[11px] font-bold truncate min-w-0 shrink">{formatTemp(displayDoseText)}</span>

        <Sliders className="w-3 h-3 ml-0.5 opacity-80 group-hover:opacity-100 transition-opacity shrink-0" />
      </button>

      {isMounted && typeof window !== 'undefined' && modalElement
        ? createPortal(modalElement, document.body)
        : null}
    </>
  )
}
