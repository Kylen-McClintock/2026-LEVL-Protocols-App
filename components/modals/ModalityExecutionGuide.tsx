'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Play, CheckCircle2, ListOrdered, Video } from 'lucide-react'

interface ModalityExecutionGuideProps {
  instructions?: string
  youtubeVideoId?: string
  videoStartSeconds?: number
  videoTitle?: string
  modalityName?: string
  briefDescription?: string
  doseOrExposure?: string
  timingSummary?: string
  defaultOpen?: boolean
}

export const ModalityExecutionGuide: React.FC<ModalityExecutionGuideProps> = ({
  instructions,
  youtubeVideoId,
  videoStartSeconds = 0,
  videoTitle = 'Video Demonstration',
  modalityName = 'Modality',
  briefDescription,
  doseOrExposure,
  timingSummary,
  defaultOpen = false
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [isPlayingVideo, setIsPlayingVideo] = useState(false)

  // Derive effective instructions if instructions string is missing
  let effectiveInstructions = instructions || ''
  if (!effectiveInstructions || effectiveInstructions.trim().length < 15) {
    const desc = briefDescription || `Execute ${modalityName} according to targeted protocol parameters.`
    const dose = doseOrExposure || 'Standard dose/exposure'
    const timing = timingSummary || 'As scheduled in daily routine'
    effectiveInstructions = `Step 1: Timing & Prep — Prepare for ${modalityName}. Target timing: ${timing}.\nStep 2: Execution Protocol — ${desc} Target exposure/dosing: ${dose}.\nStep 3: Post-Care & Tracking — Record baseline observations before and post-modality shift after completion.`
  }

  // Parse instructions string into numbered steps
  const steps = effectiveInstructions
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 0)

  const embedUrl = youtubeVideoId
    ? `https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&start=${videoStartSeconds}&enablejsapi=1`
    : ''

  const thumbnailUrl = youtubeVideoId
    ? `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`
    : ''

  return (
    <div className="w-full bg-slate-950/90 border border-slate-800 rounded-2xl overflow-hidden shadow-md my-2.5 transition-all">
      {/* Header Accordion Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 sm:p-4 text-left bg-slate-900/60 hover:bg-slate-900 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <div className="p-1.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
            <ListOrdered size={16} />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-extrabold text-white truncate">
              Step-by-Step Execution Guide
            </h4>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
              Exact physical technique & pacing setup
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0 text-right">
          {youtubeVideoId && (
            <span className="text-[9px] sm:text-[10px] bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full font-mono flex items-center gap-1 shrink-0 font-bold">
              <Video size={10} className="text-red-400" /> Video Demo
            </span>
          )}
          <div className="text-slate-400 flex items-center gap-1 text-[11px] sm:text-xs font-bold">
            <span>{isOpen ? 'Hide' : 'Show Steps'}</span>
            {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>
      </button>

      {/* Expanded Content Body */}
      {isOpen && (
        <div className="p-4 space-y-4 border-t border-slate-800/80 bg-slate-950 animate-in fade-in slide-in-from-top-2">
          
          {/* Text Steps List */}
          {steps.length > 0 && (
            <div className="space-y-2.5">
              <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                Execution Steps:
              </h5>
              <div className="space-y-2">
                {steps.map((stepText, idx) => {
                  const cleanStep = stepText.replace(/^Step\s*\d+:?\s*/i, '')
                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200"
                    >
                      <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center justify-center font-bold font-mono text-[11px] shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="leading-relaxed font-sans text-slate-200">
                        {cleanStep}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* YouTube Video Player Embed / Thumbnail */}
          {youtubeVideoId && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Video size={13} className="text-red-400" /> Demonstration Video:
                </h5>
                {videoStartSeconds > 0 && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    Starts @ {Math.floor(videoStartSeconds / 60)}:{(videoStartSeconds % 60).toString().padStart(2, '0')}
                  </span>
                )}
              </div>

              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-black aspect-video shadow-lg">
                {!isPlayingVideo ? (
                  <div
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      setIsPlayingVideo(true)
                    }}
                    className="relative w-full h-full cursor-pointer group flex items-center justify-center overflow-hidden"
                  >
                    {/* Thumbnail Image */}
                    {thumbnailUrl && (
                      <img
                        src={thumbnailUrl}
                        alt={videoTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-70 group-hover:opacity-90"
                      />
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />

                    {/* Play Button Icon */}
                    <div className="relative z-10 w-14 h-14 rounded-full bg-red-600 group-hover:bg-red-500 text-white flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110">
                      <Play size={26} className="ml-1 fill-white" />
                    </div>

                    {/* Title overlay */}
                    <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between text-xs text-white font-bold bg-slate-950/80 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-sm">
                      <span className="truncate">{videoTitle || `How to perform ${modalityName}`}</span>
                      <span className="text-[10px] text-red-400 font-mono font-extrabold uppercase shrink-0">Watch Now ▶</span>
                    </div>
                  </div>
                ) : (
                  <iframe
                    src={embedUrl}
                    title={videoTitle}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                )}
              </div>

              {/* Direct YouTube Link Fallback */}
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-slate-400">Having trouble playing inline?</span>
                <a
                  href={`https://www.youtube.com/watch?v=${youtubeVideoId}&t=${videoStartSeconds}s`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="font-bold text-red-400 hover:text-red-300 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span>Open on YouTube ({Math.floor(videoStartSeconds / 60)}:{(videoStartSeconds % 60).toString().padStart(2, '0')}) ↗</span>
                </a>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
