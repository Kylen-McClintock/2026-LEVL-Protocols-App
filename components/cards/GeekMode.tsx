import React, { useState } from 'react'
import { Modality } from '@/lib/types'
import { Microscope, AlertTriangle, Target, BookOpen, ExternalLink, Activity, ChevronDown, ChevronUp, Zap, Sparkles } from 'lucide-react'
import { modalityReferences } from '@/lib/data/references'
import { getEffortMetadata, getCostMetadata } from '@/lib/ranking/adaptiveRecommendationEngine'
import MedicalDisclaimerBanner from '../ui/MedicalDisclaimerBanner'
import ModalityLongevityDrawer from './ModalityLongevityDrawer'
import { LONGEVITY_VECTORS_METADATA } from '@/lib/data/longevityKnowledgeBase'
import { getSafeEfficacyStats } from '@/lib/utils/efficacyStats'
import { useTheme } from '@/lib/utils/useTheme'
import { LEVL_TOKENS } from '@/lib/theme/designTokens'

type GeekModeProps = {
  modality: Modality
  hideLongevityDrawer?: boolean
  hideHallmarks?: boolean
  hideFunctionalImpacts?: boolean
}

export default function GeekMode({
  modality,
  hideLongevityDrawer = false,
  hideHallmarks = false,
  hideFunctionalImpacts = false
}: GeekModeProps) {
  const { isLight } = useTheme()
  const [isDisclaimerExpanded, setIsDisclaimerExpanded] = useState(false)
  const [isDeepAnalysisExpanded, setIsDeepAnalysisExpanded] = useState(false)
  const [isSynergiesExpanded, setIsSynergiesExpanded] = useState(false)
  const [isAntagonismsExpanded, setIsAntagonismsExpanded] = useState(false)
  const [isHallmarksExpanded, setIsHallmarksExpanded] = useState(false)
  const [isFunctionalExpanded, setIsFunctionalExpanded] = useState(false)

  const refs = modality.scientific_references && modality.scientific_references.length > 0 
    ? modality.scientific_references 
    : modalityReferences[modality.id] || []

  const effortMeta = getEffortMetadata(modality)
  const costMeta = getCostMetadata(modality.cost_tier)

  return (
    <div className={`rounded-2xl p-4 border space-y-4 animate-in fade-in slide-in-from-top-2 mt-4 text-sm ${
      isLight
        ? 'bg-white border-[#E1E8E3] text-[#475569] shadow-sm'
        : 'bg-black/40 border-levl-purple/20 text-white'
    }`}>
      <div className={`flex items-center gap-2 font-bold border-b pb-2 ${
        isLight
          ? 'text-[#6954C8] border-[#E1E8E3]'
          : 'text-levl-purple border-white/10'
      }`}>
        <Microscope size={16} /> Geek Mode
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`p-2.5 rounded-xl border ${
          isLight
            ? 'bg-[#EFF3F0] border-[#E1E8E3]'
            : 'bg-slate-900/80 border-white/5'
        }`}>
          <span className={`text-[10px] uppercase font-bold block mb-1 ${
            isLight ? 'text-[#526661]' : 'text-levl-text-secondary'
          }`}>Evidence Quality</span>
          <span className={`font-bold font-mono ${isLight ? 'text-[#475569]' : 'text-white'}`}>
            {modality.evidence_quality ? `${modality.evidence_quality}/5` : 'Grade A'}
          </span>
        </div>
        <div className={`p-2.5 rounded-xl border ${
          isLight
            ? 'bg-[#EFF3F0] border-[#E1E8E3]'
            : 'bg-slate-900/80 border-white/5'
        }`}>
          <span className={`text-[10px] uppercase font-bold block mb-1 ${
            isLight ? 'text-[#526661]' : 'text-levl-text-secondary'
          }`}>Effect Size</span>
          <span className={`font-bold capitalize ${isLight ? 'text-[#475569]' : 'text-white'}`}>
            {modality.effect_size_estimate || 'Medium'}
          </span>
        </div>
        <div className={`p-2.5 rounded-xl border ${
          isLight
            ? 'bg-[#EFF3F0] border-[#E1E8E3]'
            : 'bg-slate-900/80 border-white/5'
        }`}>
          <span className={`text-[10px] uppercase font-bold block mb-1 ${
            isLight ? 'text-[#526661]' : 'text-levl-text-secondary'
          }`}>Daily Cost</span>
          <span className={`font-bold capitalize ${isLight ? 'text-[#475569]' : 'text-white'}`}>
            {costMeta.label}
          </span>
        </div>
        <div className={`p-2.5 rounded-xl border ${
          isLight
            ? 'bg-[#EFF3F0] border-[#E1E8E3]'
            : 'bg-slate-900/80 border-white/5'
        }`}>
          <span className={`text-[10px] uppercase font-bold block mb-1 ${
            isLight ? 'text-[#526661]' : 'text-levl-text-secondary'
          }`}>Effort &amp; Time</span>
          <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded border ${effortMeta.badgeColor}`}>
            {effortMeta.shortLabel}
          </span>
        </div>
      </div>

      {/* Collapsible Deep Physiological Mechanism & Hemodynamic Analysis (Collapsed by Default) */}
      <div className={`rounded-2xl border overflow-hidden ${
        isLight ? 'bg-white border-[#E1E8E3]' : 'border-purple-500/30 bg-purple-950/20'
      }`}>
        <button
          onClick={() => setIsDeepAnalysisExpanded(!isDeepAnalysisExpanded)}
          className={`w-full flex items-center justify-between p-3.5 text-left transition-colors cursor-pointer ${
            isLight ? 'hover:bg-[#F0EDFB]/40' : 'hover:bg-purple-900/20'
          }`}
        >
          <div className={`flex items-center gap-2 text-xs font-bold ${
            isLight ? 'text-[#6954C8]' : 'text-purple-300'
          }`}>
            <BookOpen size={14} className={isLight ? 'text-[#6954C8]' : 'text-purple-400'} />
            <span>Deep Physiological Mechanism & Hemodynamic Analysis</span>
          </div>
          {isDeepAnalysisExpanded ? (
            <ChevronUp size={16} className={isLight ? 'text-[#6954C8]' : 'text-purple-400'} />
          ) : (
            <ChevronDown size={16} className={isLight ? 'text-[#6954C8]' : 'text-purple-400'} />
          )}
        </button>

        {isDeepAnalysisExpanded && (
          <div className={`p-4 border-t space-y-4 text-xs leading-relaxed animate-in fade-in duration-200 ${
            isLight ? 'border-[#E1E8E3] text-[#475569]' : 'border-purple-500/20 text-slate-300'
          }`}>
            {modality.mechanism_of_action && (
              <div>
                <span className={`text-[10px] uppercase font-bold tracking-wider block mb-1.5 ${
                  isLight ? 'text-[#526661]' : 'text-purple-300'
                }`}>Cellular & Systemic Mechanism</span>
                <p className={`text-xs leading-relaxed whitespace-pre-line ${
                  isLight ? 'text-[#475569]' : 'text-slate-200'
                }`}>{modality.mechanism_of_action}</p>
              </div>
            )}

            {/* Anatomical / Clinical Mechanism Image Diagram */}
            {(modality.diagram_url || modality.image_url) && (
              <div className={`pt-2 border-t space-y-1.5 ${isLight ? 'border-[#E1E8E3]' : 'border-white/10'}`}>
                <span className={`text-[10px] uppercase font-bold tracking-wider block mb-1 ${
                  isLight ? 'text-[#526661]' : 'text-purple-300'
                }`}>Anatomical & Physiological Diagram</span>
                <div className={`rounded-xl overflow-hidden border shadow-md ${
                  isLight ? 'border-[#E1E8E3]' : 'border-purple-500/30'
                }`}>
                  <img
                    src={modality.diagram_url || modality.image_url}
                    alt={`${modality.name} Mechanism Diagram`}
                    className="w-full h-auto object-cover max-h-96"
                  />
                </div>
              </div>
            )}

            {/* Hemodynamic Parameter / Clinical Normative Data Table */}
            {modality.hemodynamic_table && (
              <div className={`pt-2 border-t space-y-1.5 ${isLight ? 'border-[#E1E8E3]' : 'border-white/10'}`}>
                <span className={`text-[10px] uppercase font-bold tracking-wider block mb-1 ${
                  isLight ? 'text-[#526661]' : 'text-purple-300'
                }`}>Hemodynamic & Clinical Data Table</span>
                <div 
                  className={`overflow-x-auto rounded-xl border p-2 [&_table]:w-full [&_table]:text-xs [&_th]:font-bold [&_th]:p-2.5 [&_td]:p-2.5 [&_td]:border-t ${
                    isLight
                      ? 'border-[#E1E8E3] bg-[#EFF3F0] [&_th]:bg-[#E6F3EB] [&_th]:text-[#2B725C] [&_td]:border-[#E1E8E3] [&_td]:text-[#475569]'
                      : 'border-purple-500/30 bg-black/60 [&_th]:bg-purple-900/40 [&_th]:text-purple-200 [&_td]:border-white/10 [&_td]:text-slate-200'
                  }`}
                  dangerouslySetInnerHTML={{ __html: modality.hemodynamic_table }}
                />
              </div>
            )}

            {modality.evidence_summary && modality.evidence_summary !== modality.mechanism_of_action && (
              <div className={`pt-2 border-t ${isLight ? 'border-[#E1E8E3]' : 'border-white/10'}`}>
                <span className={`text-[10px] uppercase font-bold tracking-wider block mb-1.5 ${
                  isLight ? 'text-[#526661]' : 'text-purple-300'
                }`}>Clinical Evidence & Allostatic Impact</span>
                <p className={`text-xs leading-relaxed whitespace-pre-line ${
                  isLight ? 'text-[#526661]' : 'text-slate-300/90'
                }`}>{modality.evidence_summary}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {modality.mechanism_of_action && !isDeepAnalysisExpanded && (
        <div className="pt-2">
          <span className={`text-[10px] uppercase block mb-1 ${isLight ? 'text-[#526661]' : 'text-levl-text-secondary'}`}>
            Mechanism Summary
          </span>
          <p className={`text-xs leading-relaxed line-clamp-2 ${isLight ? 'text-[#526661]' : 'text-gray-300'}`}>
            {modality.mechanism_of_action}
          </p>
        </div>
      )}

      {(() => {
        const syn = (() => {
          if (modality.synergy_notes) {
            if (typeof modality.synergy_notes === 'object' && !Array.isArray(modality.synergy_notes)) {
              const notes = modality.synergy_notes as any
              const pairs = Array.isArray(notes.pairsWellWith) ? notes.pairsWellWith.join(', ') : (notes.pairsWellWith || '')
              return { pairsWith: pairs.replace(/_/g, ' '), rationale: notes.rationale || notes.summary || '' }
            } else if (typeof modality.synergy_notes === 'string') {
              return { pairsWith: '', rationale: modality.synergy_notes }
            }
          }
          const cat = (modality.category || '').toLowerCase()
          if (cat.includes('nutrition') || cat.includes('supplement')) {
            return { pairsWith: 'Co-factor Nutrients & Healthy Dietary Fats', rationale: 'Supplements achieve optimal cellular uptake when taken alongside lipid-containing meals and necessary electrolyte co-factors.' }
          } else if (cat.includes('fasting') || cat.includes('autophagy')) {
            return { pairsWith: 'Unflavored Electrolytes (Sodium, Potassium), Black Coffee, Zone 2 Walking', rationale: 'Fasting drops insulin levels triggering renal electrolyte excretion. Unflavored electrolytes sustain blood volume while light walking accelerates fatty acid oxidation.' }
          } else if (cat.includes('fitness') || cat.includes('physical') || cat.includes('exercise')) {
            return { pairsWith: 'Post-Workout Protein (Leucine), Creatine, 7-9 Hours Deep Sleep', rationale: 'Physical training triggers tissue remodeling and protein synthesis, requiring amino acid availability and deep slow-wave sleep growth hormone pulses.' }
          } else if (cat.includes('sleep') || cat.includes('circadian')) {
            return { pairsWith: 'Morning Sunlight (10-30m), Blue-Blocking Glasses, Cool Room (65-68°F)', rationale: 'Circadian optimization relies on daytime optic flow light anchors and evening temperature/blue light suppression to maximize endogenous melatonin.' }
          }
          return { pairsWith: 'Complementary Lifestyle Habits & Hydration', rationale: 'Yields elevated benefits when paired with baseline circadian alignment, hydration, and lower systemic inflammation.' }
        })()

        return (
          <div className={`rounded-2xl border overflow-hidden ${
            isLight ? 'bg-white border-[#E1E8E3]' : 'bg-emerald-950/20 border-emerald-500/30'
          }`}>
            <button
              type="button"
              onClick={() => setIsSynergiesExpanded(!isSynergiesExpanded)}
              className={`w-full p-3.5 flex items-center justify-between text-left transition-colors cursor-pointer ${
                isLight ? 'hover:bg-[#E6F3EB]/40' : 'hover:bg-emerald-900/20'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Sparkles size={14} className={isLight ? 'text-[#2B725C]' : 'text-emerald-400'} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${isLight ? 'text-[#475569]' : 'text-emerald-300'}`}>
                      Known Synergies &amp; Stacking
                    </span>
                    {syn.pairsWith && (
                      <span className={`text-[10px] font-mono truncate ${isLight ? 'text-[#2B725C]' : 'text-emerald-400/80'}`}>
                        Pairs with: {syn.pairsWith}
                      </span>
                    )}
                  </div>
                  {!isSynergiesExpanded && (
                    <p className={`text-[11px] line-clamp-1 mt-0.5 ${isLight ? 'text-[#526661]' : 'text-emerald-100/70'}`}>
                      {syn.rationale}
                    </p>
                  )}
                </div>
              </div>
              <div className={`shrink-0 ml-2 ${isLight ? 'text-[#2B725C]' : 'text-emerald-400'}`}>
                {isSynergiesExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>

            {isSynergiesExpanded && (
              <div className={`p-3.5 pt-0 border-t text-xs leading-relaxed space-y-1.5 animate-in fade-in duration-150 ${
                isLight ? 'border-[#E1E8E3] text-[#475569]' : 'border-emerald-500/20 text-emerald-100/90'
              }`}>
                {syn.pairsWith && (
                  <p className="pt-2">
                    <strong className={isLight ? 'text-[#2B725C]' : 'text-emerald-300'}>Pairs well with:</strong> {syn.pairsWith}
                  </p>
                )}
                <p className={isLight ? 'text-[#526661]' : 'opacity-90'}>{syn.rationale}</p>
              </div>
            )}
          </div>
        )
      })()}

      {(() => {
        const ant = (() => {
          if (modality.antagonism_notes) {
            if (typeof modality.antagonism_notes === 'object' && !Array.isArray(modality.antagonism_notes)) {
              const notes = modality.antagonism_notes as any
              const avoid = Array.isArray(notes.avoidCombiningWith) ? notes.avoidCombiningWith.join(', ') : (notes.avoidCombiningWith || '')
              return { avoidWith: avoid.replace(/_/g, ' '), rationale: notes.rationale || notes.summary || '' }
            } else if (typeof modality.antagonism_notes === 'string') {
              return { avoidWith: '', rationale: modality.antagonism_notes }
            }
          }
          const cat = (modality.category || '').toLowerCase()
          if (cat.includes('sleep') || cat.includes('circadian')) {
            return { avoidWith: 'Late-Day Caffeine (>12 PM), Evening Alcohol, High Intensity Exercise <2h Before Bed', rationale: 'Caffeine blocks adenosine receptors, alcohol fragments REM sleep architecture, and late workouts elevate core body temperature.' }
          } else if (cat.includes('fasting')) {
            return { avoidWith: 'Refined Carbohydrate Refeeds, NSAIDs on empty stomach', rationale: 'Breaking fasts with refined sugars causes massive insulin spikes and GI distress. NSAIDs without food increase gastric mucosal irritation.' }
          } else if (cat.includes('fitness') || cat.includes('physical')) {
            return { avoidWith: 'Immediate Post-Workout Ice Baths (<4h), High-Dose NSAIDs', rationale: 'Immediate cold therapy or high-dose NSAIDs blunts localized inflammatory signaling necessary for hypertrophy and power gains.' }
          }
          return { avoidWith: 'Unbuffered High Doses, Extreme Multi-Agent Overlap', rationale: 'Avoid stacking multiple compounds with overlapping hepatic breakdown pathways without periodic wash-out periods.' }
        })()

        return (
          <div className={`rounded-2xl border overflow-hidden ${
            isLight ? 'bg-white border-[#E1E8E3]' : 'bg-amber-950/20 border-amber-500/30'
          }`}>
            <button
              type="button"
              onClick={() => setIsAntagonismsExpanded(!isAntagonismsExpanded)}
              className={`w-full p-3.5 flex items-center justify-between text-left transition-colors cursor-pointer ${
                isLight ? 'hover:bg-[#FFFBEB]' : 'hover:bg-amber-900/20'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <AlertTriangle size={14} className={isLight ? 'text-[#D97706]' : 'text-amber-400'} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${isLight ? 'text-[#475569]' : 'text-amber-300'}`}>
                      Known Antagonisms &amp; Precautions
                    </span>
                    {ant.avoidWith && (
                      <span className={`text-[10px] font-mono truncate ${isLight ? 'text-[#D97706]' : 'text-amber-400/80'}`}>
                        Avoid: {ant.avoidWith}
                      </span>
                    )}
                  </div>
                  {!isAntagonismsExpanded && (
                    <p className={`text-[11px] line-clamp-1 mt-0.5 ${isLight ? 'text-[#526661]' : 'text-amber-100/70'}`}>
                      {ant.rationale}
                    </p>
                  )}
                </div>
              </div>
              <div className={`shrink-0 ml-2 ${isLight ? 'text-[#D97706]' : 'text-amber-400'}`}>
                {isAntagonismsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>

            {isAntagonismsExpanded && (
              <div className={`p-3.5 pt-0 border-t text-xs leading-relaxed space-y-1.5 animate-in fade-in duration-150 ${
                isLight ? 'border-[#E1E8E3] text-[#475569]' : 'border-amber-500/20 text-amber-100/90'
              }`}>
                {ant.avoidWith && (
                  <p className="pt-2">
                    <strong className="text-amber-300">Avoid combining with:</strong> {ant.avoidWith}
                  </p>
                )}
                <p className="opacity-90">{ant.rationale}</p>
              </div>
            )}
          </div>
        )
      })()}

      {(modality.contraindications?.length ?? 0) > 0 && (
        <div className="bg-red-950/30 p-3 rounded-lg border border-red-900/50">
          <div className="flex items-center gap-1 text-red-400 font-bold mb-1 text-xs">
            <AlertTriangle size={12} /> Contraindications
          </div>
          <ul className="list-disc pl-4 text-xs text-white font-normal space-y-1">
            {modality.contraindications?.map((c: string, i: number) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {!hideHallmarks && modality.hallmarks_of_aging_impact && (
        <div className={`rounded-2xl border overflow-hidden ${
          isLight ? 'bg-white border-[#E1E8E3]' : 'bg-purple-950/20 border-purple-500/30'
        }`}>
          <button
            type="button"
            onClick={() => setIsHallmarksExpanded(!isHallmarksExpanded)}
            className={`w-full p-3.5 flex items-center justify-between text-left transition-colors cursor-pointer ${
              isLight ? 'hover:bg-[#F0EDFB]/40' : 'hover:bg-purple-900/20'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Zap size={14} className={isLight ? 'text-[#6954C8]' : 'text-purple-400'} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${isLight ? 'text-[#475569]' : 'text-purple-300'}`}>
                    Improved Hallmarks of Aging
                  </span>
                  {Array.isArray(modality.hallmarks_of_aging_impact) && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                      isLight ? 'bg-[#F0EDFB] text-[#6954C8]' : 'bg-purple-500/20 text-purple-200'
                    }`}>
                      {modality.hallmarks_of_aging_impact.length} Hallmarks
                    </span>
                  )}
                </div>
                {!isHallmarksExpanded && Array.isArray(modality.hallmarks_of_aging_impact) && (
                  <div className="flex items-center gap-1.5 overflow-hidden mt-1">
                    {modality.hallmarks_of_aging_impact.slice(0, 3).map((h: string, i: number) => (
                      <span key={i} className={`text-[10px] px-2 py-0.5 rounded shrink-0 border ${
                        isLight ? 'bg-[#EFF3F0] border-[#E1E8E3] text-[#526661]' : 'bg-white/5 border-white/10 text-slate-300'
                      }`}>
                        {h}
                      </span>
                    ))}
                    {modality.hallmarks_of_aging_impact.length > 3 && (
                      <span className={`text-[10px] font-bold shrink-0 ${isLight ? 'text-[#6954C8]' : 'text-purple-300'}`}>
                        +{modality.hallmarks_of_aging_impact.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className={`shrink-0 ml-2 ${isLight ? 'text-[#6954C8]' : 'text-purple-400'}`}>
              {isHallmarksExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </button>

          {isHallmarksExpanded && (
            <div className={`p-3.5 pt-0 border-t space-y-2 animate-in fade-in duration-150 ${
              isLight ? 'border-[#E1E8E3]' : 'border-purple-500/20'
            }`}>
              <div className="flex flex-wrap gap-1.5 pt-2">
                {Array.isArray(modality.hallmarks_of_aging_impact) 
                  ? modality.hallmarks_of_aging_impact.map((h: string, i: number) => (
                    <span key={i} className={`text-xs px-2.5 py-1 rounded-xl font-mono font-medium border ${
                      isLight
                        ? 'bg-[#F0EDFB] border-[#6954C8]/30 text-[#6954C8]'
                        : 'bg-purple-500/15 border-purple-500/30 text-purple-200'
                    }`}>
                      {h}
                    </span>
                  ))
                  : <span className={`text-xs ${isLight ? 'text-[#526661]' : 'text-slate-400'}`}>See deeper literature for hallmark impact.</span>
                }
              </div>
            </div>
          )}
        </div>
      )}

      {(() => {
        const safeStats = getSafeEfficacyStats(modality)
        if (safeStats.length === 0) return null
        return (
          <div className={`pt-4 border-t mt-2 ${isLight ? 'border-[#E1E8E3]' : 'border-white/10'}`}>
            <div className={`flex items-center gap-2 text-[10px] uppercase block mb-2 font-bold ${
              isLight ? 'text-[#D97706]' : 'text-yellow-400'
            }`}>
              <Target size={12} className={isLight ? 'text-[#D97706]' : 'text-yellow-400'} /> Interesting Facts & Efficacy Stats
            </div>
            <div className="space-y-3">
              {safeStats.map((stat, idx) => (
              <div key={idx} className={`p-3 rounded-xl border ${
                isLight ? 'bg-[#FFFBEB] border-[#D97706]/30' : 'bg-yellow-900/10 border-yellow-700/30'
              }`}>
                <p className={`text-xs italic mb-2 ${isLight ? 'text-[#475569]' : 'text-gray-200'}`}>&ldquo;{stat.fact}&rdquo;</p>
                {stat.source && (
                  <div className="flex items-center justify-end">
                    {stat.source_url ? (
                      <a href={stat.source_url} target="_blank" rel="noopener noreferrer" className={`text-[10px] flex items-center gap-1 group transition-colors ${
                        isLight ? 'text-[#0891B2] hover:text-[#0e7490]' : 'text-blue-300 hover:text-blue-200'
                      }`}>
                        — {stat.source}
                        <ExternalLink size={10} className="opacity-50 group-hover:opacity-100" />
                      </a>
                    ) : (
                      <span className={`text-[10px] ${isLight ? 'text-[#526661]' : 'text-gray-400'}`}>— {stat.source}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )})()}

      {/* 🧬 Clinical Longevity & Biomarkers Expandable Evidence */}
      {!hideLongevityDrawer && <ModalityLongevityDrawer modality={modality} defaultExpanded={false} />}

      {/* ⚡ Subjective / Acute Functional Performance Evidence */}
      {!hideFunctionalImpacts && (() => {
        if (!modality.functional_impacts) return null
        const rawImpacts = modality.functional_impacts as Record<string, any>
        const subjectiveEntries: [string, any][] = Object.entries(rawImpacts).filter(([key]) => {
          const normKey = key.toLowerCase().replace(/[-\s]/g, '_').trim()
          return !LONGEVITY_VECTORS_METADATA[normKey]
        })

        if (subjectiveEntries.length === 0) return null

        return (
          <div className={`rounded-2xl border overflow-hidden mt-2 ${
            isLight ? 'bg-white border-[#E1E8E3]' : 'bg-emerald-950/20 border-emerald-500/30'
          }`}>
            <button
              type="button"
              onClick={() => setIsFunctionalExpanded(!isFunctionalExpanded)}
              className={`w-full p-3.5 flex items-center justify-between text-left transition-colors cursor-pointer ${
                isLight ? 'hover:bg-[#E6F3EB]/40' : 'hover:bg-emerald-900/20'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Activity size={14} className={isLight ? 'text-[#2B725C]' : 'text-emerald-400'} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${isLight ? 'text-[#475569]' : 'text-emerald-300'}`}>
                      Daily Functional Performance Evidence
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                      isLight ? 'bg-[#E6F3EB] text-[#2B725C]' : 'bg-emerald-500/20 text-emerald-200'
                    }`}>
                      {subjectiveEntries.length} Outcomes
                    </span>
                  </div>
                  {!isFunctionalExpanded && (
                    <div className="flex items-center gap-1.5 overflow-hidden mt-1">
                      {subjectiveEntries.slice(0, 3).map(([outcome, impact]: [string, any]) => (
                        <span key={outcome} className={`text-[10px] border px-2 py-0.5 rounded font-mono shrink-0 ${
                          isLight
                            ? 'bg-[#E6F3EB] text-[#2B725C] border-[#2B725C]/30'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}>
                          {outcome}: {impact.score}/10
                        </span>
                      ))}
                      {subjectiveEntries.length > 3 && (
                        <span className={`text-[10px] font-bold shrink-0 ${isLight ? 'text-[#2B725C]' : 'text-emerald-400'}`}>
                          +{subjectiveEntries.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className={`shrink-0 ml-2 ${isLight ? 'text-[#2B725C]' : 'text-emerald-400'}`}>
                {isFunctionalExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>

            {isFunctionalExpanded && (
              <div className={`p-3.5 pt-0 border-t space-y-3 pt-2 animate-in fade-in duration-150 ${
                isLight ? 'border-[#E1E8E3]' : 'border-emerald-500/20'
              }`}>
                <div className="space-y-3 pt-2">
                  {subjectiveEntries
                    .sort((a: [string, any], b: [string, any]) => Number(b[1]?.score ?? 0) - Number(a[1]?.score ?? 0))
                    .map(([outcome, impact]: [string, any]) => (
                      <div key={outcome} className={`p-3 rounded-xl border ${
                        isLight ? 'bg-[#EFF3F0] border-[#E1E8E3]' : 'bg-emerald-900/10 border-emerald-700/30'
                      }`}>
                        <div className="flex justify-between items-center mb-2">
                          <span className={`text-xs font-bold ${isLight ? 'text-[#475569]' : 'text-emerald-300'}`}>{outcome}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                            isLight ? 'bg-[#E6F3EB] text-[#2B725C]' : 'bg-emerald-500/20 text-emerald-400'
                          }`}>{impact.score}/10 Impact</span>
                        </div>
                        {impact.studies && impact.studies.length > 0 ? (
                          <div className={`space-y-2 mt-2 border-t pt-2 ${isLight ? 'border-[#E1E8E3]' : 'border-emerald-900/30'}`}>
                            {impact.studies.map((study: any, idx: number) => (
                              <div key={idx}>
                                <a href={study.url} target="_blank" rel="noopener noreferrer" className={`text-xs block mb-1 group ${
                                  isLight ? 'text-[#0891B2] hover:text-[#0e7490]' : 'text-blue-300 hover:text-blue-200'
                                }`}>
                                  {study.title} <ExternalLink size={10} className="inline opacity-50 group-hover:opacity-100" />
                                </a>
                                {study.notes && <p className={`text-[10px] italic leading-relaxed ${
                                  isLight ? 'text-[#526661]' : 'text-gray-400'
                                }`}>{study.notes}</p>}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className={`text-[10px] italic mt-1 ${isLight ? 'text-[#6E7E78]' : 'text-gray-500'}`}>Impact score mapped from consensus literature.</p>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )
      })()}

      {/* Peptide Pharmacology, Reconstitution & Receptor Dynamics */}
      {modality.peptide_metadata && (
        <div className={`p-4 rounded-2xl border space-y-2.5 ${
          isLight ? 'bg-[#ECFEFF]/50 border-[#0891B2]/30 text-[#475569]' : 'bg-cyan-950/25 border-cyan-500/30'
        }`}>
          <div className={`text-[11px] font-extrabold uppercase tracking-wider flex items-center justify-between ${
            isLight ? 'text-[#0891B2]' : 'text-cyan-400'
          }`}>
            <span>Peptide Pharmacokinetics &amp; Receptors</span>
            <span className={`text-[9px] px-2 py-0.5 rounded font-mono border ${
              isLight ? 'bg-[#ECFEFF] text-[#0891B2] border-[#0891B2]/30' : 'bg-cyan-500/20 text-cyan-300 border-transparent'
            }`}>
              {modality.peptide_metadata.delivery_route.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className={`text-[10px] font-semibold block ${isLight ? 'text-[#526661]' : 'text-cyan-300/70'}`}>Half-Life</span>
              <span className={`font-medium ${isLight ? 'text-[#475569]' : 'text-slate-200'}`}>{modality.peptide_metadata.half_life_summary || 'N/A'}</span>
            </div>
            <div>
              <span className={`text-[10px] font-semibold block ${isLight ? 'text-[#526661]' : 'text-cyan-300/70'}`}>Target Receptors</span>
              <span className={`font-medium ${isLight ? 'text-[#475569]' : 'text-slate-200'}`}>{modality.peptide_metadata.target_receptors?.join(', ') || 'Somatotropic / Repair Pathways'}</span>
            </div>
          </div>

          {modality.peptide_metadata.reconstitution_instructions && (
            <div className={`pt-2 border-t ${isLight ? 'border-[#E1E8E3]' : 'border-cyan-500/20'}`}>
              <span className={`text-[10px] font-semibold block ${isLight ? 'text-[#526661]' : 'text-cyan-300/70'}`}>Reconstitution Protocol</span>
              <p className={`text-xs mt-0.5 leading-relaxed ${isLight ? 'text-[#475569]' : 'text-slate-300'}`}>{modality.peptide_metadata.reconstitution_instructions}</p>
            </div>
          )}

          {modality.peptide_metadata.storage_instructions && (
            <div className={`pt-2 border-t ${isLight ? 'border-[#E1E8E3]' : 'border-cyan-500/20'}`}>
              <span className={`text-[10px] font-semibold block ${isLight ? 'text-[#526661]' : 'text-cyan-300/70'}`}>Storage Guidelines</span>
              <p className={`text-xs mt-0.5 leading-relaxed ${isLight ? 'text-[#475569]' : 'text-slate-300'}`}>{modality.peptide_metadata.storage_instructions}</p>
            </div>
          )}
        </div>
      )}

      {/* Scientific References */}
      {refs && refs.length > 0 && (
        <div className={`pt-4 border-t mt-2 ${isLight ? 'border-[#E1E8E3]' : 'border-white/10'}`}>
          <div className={`flex items-center gap-2 text-[10px] uppercase block mb-2 font-bold ${
            isLight ? 'text-[#2B725C]' : 'text-levl-accent'
          }`}>
            <BookOpen size={12} /> Clinical Evidence
          </div>
          <div className="space-y-2">
            {refs.map((ref: any, idx: number) => (
              <a 
                key={idx}
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`block p-2.5 rounded-xl border transition-colors group ${
                  isLight
                    ? 'bg-[#EFF3F0] hover:bg-[#EAEFEA] border-[#E1E8E3]'
                    : 'bg-white/5 hover:bg-white/10 border-white/5'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <p className={`text-xs font-medium leading-snug flex-1 ${
                    isLight ? 'text-[#475569] group-hover:text-[#2B725C]' : 'text-blue-200 group-hover:text-blue-100'
                  }`}>
                    {ref.title}
                  </p>
                  <ExternalLink size={12} className={`flex-shrink-0 mt-0.5 ${
                    isLight ? 'text-[#6E7E78] group-hover:text-[#475569]' : 'text-white/30 group-hover:text-white/70'
                  }`} />
                </div>
                <div className="mt-1">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${
                    isLight
                      ? 'bg-[#E6F3EB] text-[#2B725C] border border-[#2B725C]/30'
                      : 'bg-levl-accent/20 text-levl-accent'
                  }`}>
                    {ref.type}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* LongevityReviews PubMed Consensus & Evidence Bridge */}
      <div className={`pt-4 border-t mt-3 ${isLight ? 'border-[#E1E8E3]' : 'border-white/10'}`}>
        <a
          href={`https://longevityreviews.org/modalities/${modality.id || modality.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all group shadow-sm ${
            isLight
              ? 'bg-[#F0EDFB]/60 border-[#6954C8]/30 hover:border-[#6954C8]/60 text-[#475569]'
              : 'bg-gradient-to-r from-purple-950/70 via-indigo-950/40 to-slate-900 border-purple-500/40 hover:border-purple-400 text-purple-200 hover:text-white shadow-md'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0 ${
              isLight
                ? 'bg-[#F0EDFB] text-[#6954C8] border border-[#6954C8]/30'
                : 'bg-purple-500/20 border border-purple-500/40 text-purple-300'
            }`}>
              <BookOpen size={16} className={isLight ? 'text-[#6954C8]' : 'text-purple-400'} />
            </div>
            <div>
              <div className={`text-xs font-black flex items-center gap-1.5 ${
                isLight ? 'text-[#475569]' : 'text-white group-hover:text-purple-200'
              }`}>
                <span>LongevityReviews Evidence Bridge</span>
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider border ${
                  isLight
                    ? 'bg-[#F0EDFB] text-[#6954C8] border-[#6954C8]/30'
                    : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                }`}>PubMed Consensus</span>
              </div>
              <p className={`text-[11px] mt-0.5 ${isLight ? 'text-[#526661]' : 'text-slate-400'}`}>
                View PubMed consensus ratings, human RCTs &amp; full literature for {modality.display_name || modality.name} →
              </p>
            </div>
          </div>
          <ExternalLink size={14} className={`shrink-0 ml-2 transition-colors ${
            isLight ? 'text-[#6954C8]' : 'text-slate-500 group-hover:text-purple-300'
          }`} />
        </a>
      </div>

      {/* Expandable Medical Disclaimer Button at bottom of Geek Mode */}
      <div className="pt-4 border-t border-white/10 mt-4">
        <MedicalDisclaimerBanner
          modalityCategory={modality.category}
          modalityName={modality.display_name || modality.name}
        />
      </div>
    </div>
  )
}
