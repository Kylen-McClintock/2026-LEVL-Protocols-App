import React, { useState } from 'react'
import { Modality } from '@/lib/types'
import { Microscope, AlertTriangle, Coins, Target, BookOpen, ExternalLink, Activity, ChevronDown, ChevronUp, Clock, Zap } from 'lucide-react'
import { modalityReferences } from '@/lib/data/references'
import { getEffortMetadata, getCostMetadata } from '@/lib/ranking/adaptiveRecommendationEngine'
import MedicalDisclaimerBanner from '../ui/MedicalDisclaimerBanner'
import ModalityLongevityDrawer from './ModalityLongevityDrawer'
import { LONGEVITY_VECTORS_METADATA } from '@/lib/data/longevityKnowledgeBase'

type GeekModeProps = {
  modality: Modality
}

export default function GeekMode({ modality }: GeekModeProps) {
  const [isDisclaimerExpanded, setIsDisclaimerExpanded] = useState(false)
  const [isDeepAnalysisExpanded, setIsDeepAnalysisExpanded] = useState(false)

  const refs = modality.scientific_references && modality.scientific_references.length > 0 
    ? modality.scientific_references 
    : modalityReferences[modality.id] || []

  const effortMeta = getEffortMetadata(modality)
  const costMeta = getCostMetadata(modality.cost_tier)

  return (
    <div className="bg-black/40 rounded-xl p-4 border border-levl-purple/20 space-y-4 animate-in fade-in slide-in-from-top-2 mt-4 text-sm">
      <div className="flex items-center gap-2 text-levl-purple font-bold border-b border-white/10 pb-2">
        <Microscope size={16} /> Geek Mode
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-white/5">
          <span className="text-[10px] text-levl-text-secondary uppercase font-bold block mb-1">Evidence Quality</span>
          <span className="font-bold text-white font-mono">{modality.evidence_quality ? `${modality.evidence_quality}/5` : 'Grade A'}</span>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-white/5">
          <span className="text-[10px] text-levl-text-secondary uppercase font-bold block mb-1">Effect Size</span>
          <span className="font-bold text-white capitalize">{modality.effect_size_estimate || 'Medium'}</span>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-white/5">
          <span className="text-[10px] text-levl-text-secondary uppercase font-bold block mb-1">Daily Cost</span>
          <span className="font-bold text-white capitalize">{costMeta.label}</span>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-white/5">
          <span className="text-[10px] text-levl-text-secondary uppercase font-bold block mb-1">Effort &amp; Time</span>
          <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded border ${effortMeta.badgeColor}`}>
            {effortMeta.shortLabel}
          </span>
        </div>
      </div>

      {/* Collapsible Deep Physiological Mechanism & Hemodynamic Analysis (Collapsed by Default) */}
      <div className="border border-purple-500/30 rounded-xl bg-purple-950/20 overflow-hidden">
        <button
          onClick={() => setIsDeepAnalysisExpanded(!isDeepAnalysisExpanded)}
          className="w-full flex items-center justify-between p-3.5 text-left hover:bg-purple-900/20 transition-colors"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
            <BookOpen size={14} className="text-purple-400" />
            <span>Deep Physiological Mechanism & Hemodynamic Analysis</span>
          </div>
          {isDeepAnalysisExpanded ? <ChevronUp size={16} className="text-purple-400" /> : <ChevronDown size={16} className="text-purple-400" />}
        </button>

        {isDeepAnalysisExpanded && (
          <div className="p-4 border-t border-purple-500/20 space-y-4 text-xs text-slate-300 leading-relaxed animate-in fade-in duration-200">
            {modality.mechanism_of_action && (
              <div>
                <span className="text-[10px] text-purple-300 uppercase font-bold tracking-wider block mb-1.5">Cellular & Systemic Mechanism</span>
                <p className="text-slate-200 text-xs leading-relaxed whitespace-pre-line">{modality.mechanism_of_action}</p>
              </div>
            )}

            {/* Anatomical / Clinical Mechanism Image Diagram */}
            {(modality.diagram_url || modality.image_url) && (
              <div className="pt-2 border-t border-white/10 space-y-1.5">
                <span className="text-[10px] text-purple-300 uppercase font-bold tracking-wider block mb-1">Anatomical & Physiological Diagram</span>
                <div className="rounded-xl overflow-hidden border border-purple-500/30 shadow-md">
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
              <div className="pt-2 border-t border-white/10 space-y-1.5">
                <span className="text-[10px] text-purple-300 uppercase font-bold tracking-wider block mb-1">Hemodynamic & Clinical Data Table</span>
                <div 
                  className="overflow-x-auto rounded-xl border border-purple-500/30 bg-black/60 p-2 [&_table]:w-full [&_table]:text-xs [&_th]:bg-purple-900/40 [&_th]:p-2.5 [&_th]:text-purple-200 [&_th]:font-bold [&_td]:p-2.5 [&_td]:border-t [&_td]:border-white/10 [&_td]:text-slate-200"
                  dangerouslySetInnerHTML={{ __html: modality.hemodynamic_table }}
                />
              </div>
            )}

            {modality.evidence_summary && modality.evidence_summary !== modality.mechanism_of_action && (
              <div className="pt-2 border-t border-white/10">
                <span className="text-[10px] text-purple-300 uppercase font-bold tracking-wider block mb-1.5">Clinical Evidence & Allostatic Impact</span>
                <p className="text-slate-300/90 text-xs leading-relaxed whitespace-pre-line">{modality.evidence_summary}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {modality.mechanism_of_action && !isDeepAnalysisExpanded && (
        <div className="pt-2">
          <span className="text-[10px] text-levl-text-secondary uppercase block mb-1">Mechanism Summary</span>
          <p className="text-gray-300 text-xs leading-relaxed line-clamp-2">{modality.mechanism_of_action}</p>
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
          <div className="bg-emerald-950/20 p-3.5 rounded-xl border border-emerald-500/30">
            <div className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
              <span>Known Synergies & Stacking</span>
            </div>
            <div className="text-xs text-emerald-100/90 leading-relaxed">
              {syn.pairsWith && (
                <p className="mb-1">
                  <strong className="text-emerald-300">Pairs well with:</strong> {syn.pairsWith}
                </p>
              )}
              <p className="opacity-90">{syn.rationale}</p>
            </div>
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
          <div className="bg-amber-950/20 p-3.5 rounded-xl border border-amber-500/30">
            <div className="text-[11px] text-amber-400 font-bold uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
              <span>Known Antagonisms & Precautions</span>
            </div>
            <div className="text-xs text-amber-100/90 leading-relaxed">
              {ant.avoidWith && (
                <p className="mb-1">
                  <strong className="text-amber-300">Avoid combining with:</strong> {ant.avoidWith}
                </p>
              )}
              <p className="opacity-90">{ant.rationale}</p>
            </div>
          </div>
        )
      })()}

      {(modality.contraindications?.length ?? 0) > 0 && (
        <div className="bg-red-950/30 p-3 rounded-lg border border-red-900/50">
          <div className="flex items-center gap-1 text-red-400 font-bold mb-1 text-xs">
            <AlertTriangle size={12} /> Contraindications
          </div>
          <ul className="list-disc pl-4 text-xs text-red-200/80 space-y-1">
            {modality.contraindications?.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {modality.hallmarks_of_aging_impact && (
        <div className="pt-2">
          <span className="text-[10px] text-levl-text-secondary uppercase block mb-1">Improved Hallmarks of Aging</span>
          <div className="flex flex-wrap gap-1">
            {Array.isArray(modality.hallmarks_of_aging_impact) 
              ? modality.hallmarks_of_aging_impact.map((h: string, i: number) => (
                <span key={i} className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-levl-text-secondary">
                  {h}
                </span>
              ))
              : <span className="text-xs text-levl-text-secondary">See deeper literature for hallmark impact.</span>
            }
          </div>
        </div>
      )}

      {modality.efficacy_stats && modality.efficacy_stats.length > 0 && (
        <div className="pt-4 border-t border-white/10 mt-2">
          <div className="flex items-center gap-2 text-[10px] text-yellow-400 uppercase block mb-2 font-bold">
            <Target size={12} className="text-yellow-400" /> Interesting Facts & Efficacy Stats
          </div>
          <div className="space-y-3">
            {modality.efficacy_stats.map((stat, idx) => (
              <div key={idx} className="bg-yellow-900/10 p-3 rounded-lg border border-yellow-700/30">
                <p className="text-gray-200 text-xs italic mb-2">"{stat.fact}"</p>
                {stat.source && (
                  <div className="flex items-center justify-end">
                    {stat.source_url ? (
                      <a href={stat.source_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-300 hover:text-blue-200 flex items-center gap-1 group transition-colors">
                        — {stat.source}
                        <ExternalLink size={10} className="opacity-50 group-hover:opacity-100" />
                      </a>
                    ) : (
                      <span className="text-[10px] text-gray-400">— {stat.source}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🧬 Clinical Longevity & Biomarkers Expandable Evidence */}
      <ModalityLongevityDrawer modality={modality} defaultExpanded={false} />

      {/* ⚡ Subjective / Acute Functional Performance Evidence */}
      {(() => {
        if (!modality.functional_impacts) return null
        const subjectiveEntries = Object.entries(modality.functional_impacts).filter(([key]) => {
          const normKey = key.toLowerCase().replace(/[-\s]/g, '_').trim()
          return !LONGEVITY_VECTORS_METADATA[normKey]
        })

        if (subjectiveEntries.length === 0) return null

        return (
          <div className="pt-4 border-t border-white/10 mt-2">
            <div className="flex items-center gap-2 text-[10px] text-emerald-400 uppercase block mb-2 font-bold">
              <Activity size={12} className="text-emerald-400" /> Daily Functional Performance Evidence
            </div>
            <div className="space-y-4">
              {subjectiveEntries
                .sort((a, b) => b[1].score - a[1].score)
                .map(([outcome, impact]) => (
                  <div key={outcome} className="bg-emerald-900/10 p-3 rounded-lg border border-emerald-700/30">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-emerald-300">{outcome}</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono">{impact.score}/10 Impact</span>
                    </div>
                    {impact.studies && impact.studies.length > 0 ? (
                      <div className="space-y-2 mt-2 border-t border-emerald-900/30 pt-2">
                        {impact.studies.map((study, idx) => (
                          <div key={idx}>
                            <a href={study.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-300 hover:text-blue-200 block mb-1 group">
                              {study.title} <ExternalLink size={10} className="inline opacity-50 group-hover:opacity-100" />
                            </a>
                            {study.notes && <p className="text-[10px] text-gray-400 italic leading-relaxed">{study.notes}</p>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-gray-500 italic mt-1">Impact score mapped from consensus literature.</p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )
      })()}

      {/* Peptide Pharmacology, Reconstitution & Receptor Dynamics */}
      {modality.peptide_metadata && (
        <div className="bg-cyan-950/25 p-4 rounded-xl border border-cyan-500/30 space-y-2.5">
          <div className="text-[11px] text-cyan-400 font-extrabold uppercase tracking-wider flex items-center justify-between">
            <span>Peptide Pharmacokinetics &amp; Receptors</span>
            <span className="text-[9px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
              {modality.peptide_metadata.delivery_route.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-cyan-300/70 font-semibold block">Half-Life</span>
              <span className="text-slate-200 font-medium">{modality.peptide_metadata.half_life_summary || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] text-cyan-300/70 font-semibold block">Target Receptors</span>
              <span className="text-slate-200 font-medium">{modality.peptide_metadata.target_receptors?.join(', ') || 'Somatotropic / Repair Pathways'}</span>
            </div>
          </div>

          {modality.peptide_metadata.reconstitution_instructions && (
            <div className="pt-2 border-t border-cyan-500/20">
              <span className="text-[10px] text-cyan-300/70 font-semibold block">Reconstitution Protocol</span>
              <p className="text-slate-300 text-xs mt-0.5 leading-relaxed">{modality.peptide_metadata.reconstitution_instructions}</p>
            </div>
          )}

          {modality.peptide_metadata.storage_instructions && (
            <div className="pt-2 border-t border-cyan-500/20">
              <span className="text-[10px] text-cyan-300/70 font-semibold block">Storage Guidelines</span>
              <p className="text-slate-300 text-xs mt-0.5 leading-relaxed">{modality.peptide_metadata.storage_instructions}</p>
            </div>
          )}
        </div>
      )}

      {/* Scientific References */}
      {refs && refs.length > 0 && (
        <div className="pt-4 border-t border-white/10 mt-2">
          <div className="flex items-center gap-2 text-[10px] text-levl-accent uppercase block mb-2 font-bold">
            <BookOpen size={12} /> Clinical Evidence
          </div>
          <div className="space-y-2">
            {refs.map((ref: any, idx: number) => (
              <a 
                key={idx}
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-white/5 hover:bg-white/10 p-2.5 rounded border border-white/5 transition-colors group"
              >
                <div className="flex justify-between items-start gap-2">
                  <p className="text-xs text-blue-200 group-hover:text-blue-100 font-medium leading-snug flex-1">
                    {ref.title}
                  </p>
                  <ExternalLink size={12} className="text-white/30 group-hover:text-white/70 flex-shrink-0 mt-0.5" />
                </div>
                <div className="mt-1">
                  <span className="text-[9px] bg-levl-accent/20 text-levl-accent px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                    {ref.type}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

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
