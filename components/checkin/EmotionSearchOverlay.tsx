'use client'

import React, { useState, useMemo } from 'react'
import { ArrowLeft, Search, X } from 'lucide-react'
import {
  EmotionEntry,
  EmotionQuadrant,
  QUADRANT_CONFIGS,
  searchEmotions
} from '@/lib/emotions/emotionDictionary'
import { useTheme } from '@/lib/utils/useTheme'
import { triggerHaptic } from '@/lib/utils/haptics'

interface EmotionSearchOverlayProps {
  isOpen: boolean
  onClose: () => void
  onSelectEmotion: (emotion: EmotionEntry) => void
  initialQuadrant?: EmotionQuadrant | null
}

export default function EmotionSearchOverlay({
  isOpen,
  onClose,
  onSelectEmotion,
  initialQuadrant = null
}: EmotionSearchOverlayProps) {
  const { theme } = useTheme()
  const isDaylight = theme === 'light'

  const [query, setQuery] = useState('')
  const [selectedQuadrant, setSelectedQuadrant] = useState<EmotionQuadrant | null>(initialQuadrant)

  const filteredEmotions = useMemo(() => {
    return searchEmotions(query, selectedQuadrant)
  }, [query, selectedQuadrant])

  if (!isOpen) return null

  const handleToggleQuadrant = (quadrant: EmotionQuadrant) => {
    triggerHaptic('selection')
    setSelectedQuadrant((prev) => (prev === quadrant ? null : quadrant))
  }

  const handleSelect = (emotion: EmotionEntry) => {
    triggerHaptic('success')
    onSelectEmotion(emotion)
    onClose()
  }

  const quadrantOrder: EmotionQuadrant[] = [
    'high_energy_pleasant',
    'low_energy_pleasant',
    'low_energy_unpleasant',
    'high_energy_unpleasant'
  ]

  return (
    <div
      className={`fixed inset-0 z-[120] flex flex-col backdrop-blur-xl animate-in fade-in duration-200 ${
        isDaylight ? 'bg-slate-50/98 text-slate-900' : 'bg-slate-950/98 text-white'
      }`}
    >
      {/* Header Bar with Search Input */}
      <div
        className={`px-4 pt-4 pb-3 border-b flex items-center gap-3 ${
          isDaylight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-white/10'
        }`}
      >
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light')
            onClose()
          }}
          className={`p-2 rounded-xl transition-all cursor-pointer ${
            isDaylight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
          title="Back to feelings map"
        >
          <ArrowLeft size={20} />
        </button>

        <div
          className={`flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border transition-all ${
            isDaylight
              ? 'bg-slate-50 border-slate-300 focus-within:border-emerald-500 focus-within:bg-white'
              : 'bg-black/40 border-white/15 focus-within:border-emerald-400 focus-within:bg-black/60'
          }`}
        >
          <Search size={17} className={isDaylight ? 'text-slate-400' : 'text-slate-500'} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search feelings (e.g. curious, anxious, calm)..."
            autoFocus
            className={`w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-500 ${
              isDaylight ? 'text-slate-900' : 'text-white'
            }`}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-200 p-0.5"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Quadrant Vector Filter Pills (Colored Directly With Quadrant Color) */}
      <div
        className={`px-4 py-2.5 border-b overflow-x-auto scrollbar-none flex items-center gap-2 ${
          isDaylight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-900/50 border-white/5'
        }`}
      >
        {quadrantOrder.map((qKey) => {
          const cfg = QUADRANT_CONFIGS[qKey]
          const isSelected = selectedQuadrant === qKey

          // Dynamic quadrant styling based on theme and selection state
          let pillStyle = ''
          if (qKey === 'high_energy_pleasant') {
            pillStyle = isSelected
              ? 'bg-amber-400 text-slate-950 font-black border-amber-300 shadow-md shadow-amber-500/30 ring-2 ring-amber-300/40'
              : isDaylight
              ? 'bg-amber-100 text-amber-950 border-amber-400 hover:bg-amber-200'
              : 'bg-amber-500/25 text-amber-200 border-amber-400/70 hover:bg-amber-500/35'
          } else if (qKey === 'low_energy_pleasant') {
            pillStyle = isSelected
              ? 'bg-emerald-400 text-slate-950 font-black border-emerald-300 shadow-md shadow-emerald-500/30 ring-2 ring-emerald-300/40'
              : isDaylight
              ? 'bg-emerald-100 text-emerald-950 border-emerald-400 hover:bg-emerald-200'
              : 'bg-emerald-500/25 text-emerald-200 border-emerald-400/70 hover:bg-emerald-500/35'
          } else if (qKey === 'low_energy_unpleasant') {
            pillStyle = isSelected
              ? 'bg-blue-400 text-slate-950 font-black border-blue-300 shadow-md shadow-blue-500/30 ring-2 ring-blue-300/40'
              : isDaylight
              ? 'bg-blue-100 text-blue-950 border-blue-400 hover:bg-blue-200'
              : 'bg-blue-500/25 text-blue-200 border-blue-400/70 hover:bg-blue-500/35'
          } else {
            pillStyle = isSelected
              ? 'bg-rose-400 text-slate-950 font-black border-rose-300 shadow-md shadow-rose-500/30 ring-2 ring-rose-300/40'
              : isDaylight
              ? 'bg-rose-100 text-rose-950 border-rose-400 hover:bg-rose-200'
              : 'bg-rose-500/25 text-rose-200 border-rose-400/70 hover:bg-rose-500/35'
          }

          return (
            <button
              key={qKey}
              type="button"
              onClick={() => handleToggleQuadrant(qKey)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap cursor-pointer shrink-0 active:scale-95 text-center ${pillStyle}`}
            >
              <span>{cfg.filterLabel}</span>
            </button>
          )
        })}

        {selectedQuadrant && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light')
              setSelectedQuadrant(null)
            }}
            className={`px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              isDaylight
                ? 'text-slate-500 hover:text-slate-800'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Scrollable Emotion List */}
      <div
        className={`flex-1 overflow-y-auto px-4 py-2 divide-y ${
          isDaylight ? 'divide-slate-200' : 'divide-white/5'
        }`}
      >
        {filteredEmotions.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <p className="text-sm font-medium">No feelings found matching &ldquo;{query}&rdquo;</p>
            <p className="text-xs text-slate-400 mt-1">Try another keyword or clear the filter.</p>
          </div>
        ) : (
          filteredEmotions.map((emotion) => {
            const cfg = QUADRANT_CONFIGS[emotion.quadrant]
            return (
              <div
                key={emotion.id}
                onClick={() => handleSelect(emotion)}
                className={`py-3.5 px-3 rounded-2xl flex items-center justify-between gap-4 transition-all cursor-pointer group active:scale-[0.99] ${
                  isDaylight ? 'hover:bg-slate-200/60' : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {/* Quadrant-colored circle badge */}
                  <div
                    className="w-7 h-7 rounded-full shrink-0 shadow-sm transition-transform group-hover:scale-110"
                    style={{ backgroundColor: cfg.baseColorHex }}
                  />

                  <div className="min-w-0">
                    <span
                      className={`text-base font-serif font-bold tracking-tight block ${
                        isDaylight ? 'text-slate-900' : 'text-white'
                      }`}
                    >
                      {emotion.name}
                    </span>
                  </div>
                </div>

                {/* Definition on the right */}
                <div className="text-right max-w-[50%] shrink-0">
                  <span
                    className={`text-xs leading-snug line-clamp-2 ${
                      isDaylight ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    {emotion.definition}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
