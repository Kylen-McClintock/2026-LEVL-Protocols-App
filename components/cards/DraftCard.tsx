'use client'

import { useState } from 'react'
import { Modality, Protocol } from '@/lib/types'
import { Edit2, Globe, Clock, Check, Info } from 'lucide-react'
import { publishModalityGlobally, publishProtocolGlobally } from '@/lib/data'

type DraftCardProps = {
  item: Modality | Protocol
  type: 'modality' | 'protocol'
  onEdit: (item: Modality | Protocol, type: 'modality' | 'protocol') => void
  onPublishStateChange: () => void
}

export default function DraftCard({ item, type, onEdit, onPublishStateChange }: DraftCardProps) {
  const [isPublishing, setIsPublishing] = useState(false)
  const isPending = type === 'modality' 
    ? (item as Modality).visibility === 'pending_review' 
    : (item as Protocol).visibility === 'pending_review'

  const handlePublish = async () => {
    setIsPublishing(true)
    if (type === 'modality') {
      await publishModalityGlobally(item.id)
    } else {
      await publishProtocolGlobally(item.id)
    }
    setIsPublishing(false)
    onPublishStateChange()
  }

  const name = item.name
  const description = type === 'modality' ? (item as Modality).brief_description : (item as Protocol).description

  return (
    <div className="bg-levl-surface border border-levl-border rounded-xl p-4 overflow-hidden relative transition-all duration-300">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-white">{name}</h3>
        <div className="flex space-x-2">
          {isPending ? (
            <span className="flex items-center text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-full border border-yellow-500/20">
              <Clock size={12} className="mr-1" /> Pending Review
            </span>
          ) : (
            <span className="flex items-center text-xs text-levl-text-secondary bg-levl-surface-highlight px-2 py-1 rounded-full border border-levl-border">
              Private Draft
            </span>
          )}
        </div>
      </div>
      
      <p className="text-sm text-levl-text-secondary mb-4 line-clamp-2">
        {description || 'No description provided.'}
      </p>

      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => onEdit(item, type)}
          className="flex items-center px-4 py-2 text-sm bg-levl-surface-highlight text-white rounded-lg border border-levl-border hover:bg-levl-border transition-colors"
        >
          <Edit2 size={16} className="mr-2 text-levl-accent" /> Edit
        </button>

        {!isPending && (
          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="flex items-center px-4 py-2 text-sm bg-levl-accent text-white rounded-lg hover:bg-levl-accent/90 transition-colors disabled:opacity-50"
          >
            <Globe size={16} className="mr-2" /> 
            {isPublishing ? 'Publishing...' : 'Publish Globally'}
          </button>
        )}
      </div>
    </div>
  )
}
