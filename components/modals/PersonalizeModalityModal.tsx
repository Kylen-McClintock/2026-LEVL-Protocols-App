'use client'

import React from 'react'
import { Modality, UserBenchItem } from '@/lib/types'
import ManageTaskModal from './ManageTaskModal'

type PersonalizeModalityModalProps = {
  isOpen: boolean
  onClose: () => void
  benchItem?: UserBenchItem | null
  modality: Modality | null
  task?: any
  onSaveSuccess: () => void
  onOpenCustomizeOutcomes?: () => void
}

export default function PersonalizeModalityModal({ 
  isOpen, 
  onClose, 
  benchItem, 
  modality, 
  task, 
  onSaveSuccess 
}: PersonalizeModalityModalProps) {
  if (!isOpen) return null

  return (
    <ManageTaskModal
      isOpen={isOpen}
      onClose={onClose}
      modality={modality}
      benchItem={benchItem}
      task={task}
      onSaveSuccess={() => {
        onSaveSuccess()
        onClose()
      }}
    />
  )
}
