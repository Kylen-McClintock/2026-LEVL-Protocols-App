'use client'

import React, { useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  className?: string
  defaultExpanded?: boolean
  modalityCategory?: string
  modalityName?: string
}

export default function MedicalDisclaimerBanner({
  className = '',
  defaultExpanded = false,
  modalityCategory,
  modalityName
}: Props) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <div className={`space-y-1.5 ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setIsExpanded(!isExpanded)
        }}
        className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Medical &amp; Educational Disclaimer</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs text-slate-300 leading-relaxed space-y-1.5 animate-in fade-in duration-200">
          <p className="font-semibold text-amber-300">LEVL Medical &amp; Educational Disclaimer</p>
          <p className="text-slate-300/90 text-[11px] leading-relaxed">
            The information, dosing benchmarks, and protocol evidence presented in LEVL are compiled from scientific literature, clinical trials, and expert longevity protocols strictly for educational and informational self-experimentation purposes. LEVL does not provide medical advice, diagnosis, or treatment. Always consult a qualified physician or healthcare professional prior to initiating any new supplement, dietary protocol, environmental exposure, or exercise regimen.
          </p>
        </div>
      )}
    </div>
  )
}
