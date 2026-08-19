'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Modality, UserProfile } from '../../lib/types'
import { resolveRecommendedDose, ProtocolDoseContext } from '@/lib/utils/resolveRecommendedDose'
import { DosageDetailModal } from '../modals/DosageDetailModal'
import ManageTaskModal from '../modals/ManageTaskModal'
import { Sliders, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react'
import { upsertBenchItemOverride } from '../../lib/data'
import { getLocalUserId } from '../../lib/local-user/getLocalUserId'
import { useTemperatureUnit } from '../../lib/utils/useTemperatureUnit'

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

function formatShortSourceLabel(label: string): string {
  if (!label) return ''
  const lower = label.toLowerCase()
  if (lower.includes('valter longo') || lower.includes('longo')) return 'Longo Protocol'
  if (lower.includes('bryan johnson') || lower.includes('blueprint')) return 'Blueprint 2026'
  if (lower.includes('peter attia') || lower.includes('attia')) return 'Attia Protocol'
  if (lower.includes('rhonda patrick') || lower.includes('rhonda')) return 'Patrick Protocol'
  if (lower.includes('huberman')) return 'Huberman Protocol'
  if (lower.includes('brecka')) return 'Brecka Protocol'
  if (lower.includes('wim hof')) return 'Wim Hof'
  if (lower.includes('dayspring')) return 'Dayspring'

  if (label.length > 20) {
    return label.substring(0, 18) + '…'
  }
  return label
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
      await upsertBenchItemOverride(localUserId, modality.id, customDose, customTiming, notes)
      if (onDoseChange) {
        onDoseChange(customDose, 0)
      }
      window.location.reload()
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

  const shortLabel = formatShortSourceLabel(resolved.sourceLabel)

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
        window.location.reload()
      }}
    />
  )

  const { formatText: formatTemp } = useTemperatureUnit()

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setIsModalOpen(true)
        }}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-semibold tracking-wide transition-all shadow-sm group max-w-full overflow-hidden leading-tight ${colorStyles} ${className}`}
        title={`${formatTemp(resolved.recommendedDoseText)} (${resolved.sourceLabel}) - Click to customize`}
      >
        <span className="shrink-0">
          {resolved.source === 'sensitivity_starter' && <ShieldCheck className="w-3 h-3 text-emerald-400" />}
          {resolved.source === 'protocol_preset' && <Sparkles className="w-3 h-3 text-amber-400" />}
          {resolved.source === 'personalized_target' && <CheckCircle2 className="w-3 h-3 text-blue-400" />}
        </span>

        <span className="font-mono text-white text-[11px] font-bold truncate max-w-[200px] sm:max-w-[320px]">{formatTemp(activeDoseText)}</span>
        {shortLabel && (
          <span className="text-[10px] opacity-90 font-sans font-medium shrink-0">({shortLabel})</span>
        )}

        <Sliders className="w-3 h-3 ml-0.5 opacity-80 group-hover:opacity-100 transition-opacity shrink-0" />
      </button>

      {isMounted && typeof window !== 'undefined' && modalElement
        ? createPortal(modalElement, document.body)
        : null}
    </>
  )
}
