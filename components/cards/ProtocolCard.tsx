import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookmarkPlus, Plus, Check, Link as LinkIcon, Info, ShieldCheck, User, Zap, ExternalLink, Scale, CheckCircle2, Bookmark } from 'lucide-react'
import { Protocol, ProtocolStep } from '@/lib/types'

type ProtocolCardProps = {
  protocol: Protocol | any // Using any to tolerate partial/mock data for now
  activeStatus?: 'today' | 'bench' | null
  onAddToBench: (protocolId: string) => Promise<void>
  onAddToToday: (protocolId: string) => Promise<void>
  onCompare?: (protocol: Protocol) => void
  isPinnedForCompare?: boolean
}

// Helper to format stack group strings "morning_supplement_stack" -> "Morning Supplement Stack"
const formatStackGroup = (str: string) => {
  return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

export const PROTOCOL_SYNERGY_MAP: Record<string, string> = {
  'dr_david_sinclair_epigenetic_renewal': '🧬 Epigenetic & Sirtuin Synergy: NMN elevates intracellular NAD+ pools to fuel SIRT1/3 deacetylases and PARP1 DNA repair, while Trans-Resveratrol allosterically enhances SIRT1 catalytic rate and Metformin/Berberine activates AMPK.',
  'gary_brecka_superhuman_protocol': '🧲 Magnetism -> Oxygen -> Light Triad: PEMF grounding restores cell membrane voltage (-70mV) and separates Rouleaux red blood cells, allowing EWOT hyper-oxygenation to flood blood plasma, followed by Red Light NIR photon ATP production.',
  'dr_matthew_walker_sleep_blueprint': '🌙 Adenosine & Thermoregulatory Sleep Synergy: 10h caffeine cutoff preserves homeostatic sleep pressure, 3h food cutoff prevents nocturnal thermogenesis, and 65°F room drop triggers the 2-3°F core cooling needed for NREM deep sleep.',
  'dr_valter_longo_senolytic_fmd_protocol': '🦠 Senolytic Purge & Stem Cell Regeneration: High-dose Fisetin & Quercetin selectively induce apoptosis in senescent zombie cells (halting SASP), while 5-day FMD depresses IGF-1 and post-fast refeed triggers stem cell immune renewal.',
  'wim_hof_autonomic_hrv_reset_protocol': '⚡ Adrenal Hypoxic Stress & Vagal Tone Synergy: Cyclic hyperventilation washes out CO2 (alkalosis) followed by retention hypoxia (SpO2 70-80%), driving a epinephrine surge that lowers TNF-alpha, while 50°F cold immersion boosts dopamine 250%.',
  'dr_casey_means_metabolic_flexibility_protocol': '📉 Postprandial Glycemic & GLUT4 Synergy: Pre-meal apple cider vinegar slows starch amylase breakdown, macro sequencing delays gastric emptying via fiber mesh, and soleus pushups pull glucose into muscle cells without insulin.',
  'dr_thomas_dayspring_endothelial_vascular_protocol': '🫀 Arterial Compliance & ApoB Clearance Synergy: Inorganic nitrate + L-Citrulline fuel enterosalivary nitric oxide vasodilation, isometric handgrips trigger shear-stress eNOS activation, and psyllium fiber upregulates hepatic LDLRs.',
  'bryan_johnson_blueprint_protocol': '👑 Comprehensive Speed of Aging Reduction (<0.70): Combines polyphenol olive oil, morning sunlight, Zone 2/HIIT cardio, and bio-identical DHEA to target organ system longevity.',
  'peter_attia_centenarian_decathlon_protocol': '🏃 Functional Longevity & Cardiorespiratory Volume: Combines 4x4 VO2 Max intervals, Zone 2 aerobic volume, progressive resistance training, and high-leucine protein distribution to maximize healthspan.',
  'photonic_ghkcu_red_light_protocol': '✨ Photonic & Biochemical Dermal Remodeling: Topical GHK-Cu delivers bioactive copper to upregulate pro-collagen I/III mRNA transcription, while 630/830nm LED photobiomodulation energizes mitochondrial Cytochrome c Oxidase to accelerate cellular ATP and structural matrix density.',
  'wolverine_thermal_recovery_protocol': '🐺 Angiogenesis & Thermal Shock Synergy: BPC-157/TB-500 build micro-capillaries and mobilize actin, while sauna heat shock (174°F+) surges nitric oxide to flush peptides into deep joint capsules and cold plunge (50°F–55°F) locks them in.',
  'mots_c_zone2_mitochondrial_protocol': '⚡ Mito-Nuclear Aerobic Biogenesis: MOTS-c directly phosphorylates AMPK and stimulates skeletal muscle GLUT4 glucose uptake, multiplying the mitochondrial cristae biogenesis and fat oxidation of fasted Zone-2 endurance training.',
  'cjc_ipam_anabolic_sleep_protocol': '🌙 Nocturnal Somatotropin & Glymphatic Reset: Bedtime CJC-1295 + Ipamorelin trigger an uninhibited pituitary GH surge on an empty stomach, while blue light blocking and mouth taping expand Slow-Wave Delta sleep and glymphatic brain waste clearance.',
  'semax_selank_cognitive_flow_protocol': '🧠 Neurotrophic Flow & Circadian Brain Shield: Semax elevates prefrontal BDNF for rapid learning and focus, Selank calms amygdala performance anxiety via GABA-A modulation, and morning sunlight plus optic flow locks in effortless cognitive productivity.'
}

export default function ProtocolCard({ protocol, activeStatus, onAddToBench, onAddToToday, onCompare, isPinnedForCompare }: ProtocolCardProps) {
  const router = useRouter()
  const [addedToBench, setAddedToBench] = useState(false)
  const [addedToToday, setAddedToToday] = useState(false)
  const [isAddingBench, setIsAddingBench] = useState(false)
  const [isAddingToday, setIsAddingToday] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [showBenchConfirm, setShowBenchConfirm] = useState(false)

  const isCurrentlyActiveInToday = activeStatus === 'today' || addedToToday
  const isCurrentlyOnBench = activeStatus === 'bench' || addedToBench

  const handleBench = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setAddedToBench(true)
    setIsAddingBench(true)
    try {
      await onAddToBench(protocol.id)
    } finally {
      setIsAddingBench(false)
    }
  }

  const handleToday = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isCurrentlyActiveInToday) {
      router.push(`/today?protocol=${encodeURIComponent(protocol.id || protocol.name)}&name=${encodeURIComponent(protocol.name)}`)
      return
    }
    setAddedToToday(true)
    setIsAddingToday(true)
    try {
      await onAddToToday(protocol.id)
    } finally {
      setIsAddingToday(false)
    }
  }

  // Group steps by stack_group or timing_slot
  const groupedSteps = (protocol.steps || []).reduce((acc: Record<string, ProtocolStep[]>, step: ProtocolStep) => {
    const group = step.stack_group || step.timing_slot || 'Standalone Action'
    if (!acc[group]) acc[group] = []
    acc[group].push(step)
    return acc
  }, {})

  // Sort groups chronologically from morning through night
  const groupOrder = [
    'wake',
    'morning',
    'morning_supplement_stack',
    'first_meal',
    'midday',
    'midday_stack',
    'afternoon',
    'pre_workout_stack',
    'post_workout_stack',
    'with_meal',
    'evening',
    'evening_supplement_stack',
    'wind_down',
    'pre_bed',
    'bedtime',
    'sleep',
    'precise_timing',
    'Standalone Action'
  ]
  
  const sortedGroups = Object.entries(groupedSteps).sort(([groupA], [groupB]) => {
    const idxA = groupOrder.indexOf(groupA.toLowerCase())
    const idxB = groupOrder.indexOf(groupB.toLowerCase())
    const posA = idxA === -1 ? 999 : idxA
    const posB = idxB === -1 ? 999 : idxB
    return posA - posB
  })

  const cardContainerStyle = isCurrentlyActiveInToday
    ? 'border-emerald-500/40 bg-emerald-950/10 shadow-[0_0_15px_rgba(16,185,129,0.12)]'
    : isCurrentlyOnBench
    ? 'border-cyan-500/40 bg-cyan-950/10 shadow-[0_0_15px_rgba(6,182,212,0.12)]'
    : 'border-levl-accent/20 glass-card'

  return (
    <div className={`rounded-xl overflow-hidden transition-all duration-300 w-full min-w-0 ${cardContainerStyle}`}>
      <div 
        className="p-4 cursor-pointer flex flex-col gap-3 hover:bg-white/5 transition-colors w-full min-w-0"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex justify-between items-start gap-2 w-full min-w-0">
          <div className="w-full min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-lg text-white break-words">
                <Link 
                  href={`/protocols/${encodeURIComponent(protocol.id || protocol.name)}`}
                  onClick={(e) => e.stopPropagation()}
                  className="hover:underline hover:text-purple-300 transition-colors flex items-center gap-1.5 inline-flex"
                  title="Click to view full protocol focus page"
                >
                  <span>{protocol.name}</span>
                  <ExternalLink size={14} className="text-purple-400 opacity-80" />
                </Link>
              </h3>

              {/* Active Today / Bench Status Badges */}
              {isCurrentlyActiveInToday && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/today?protocol=${encodeURIComponent(protocol.id || protocol.name)}&name=${encodeURIComponent(protocol.name)}`)
                  }}
                  className="flex items-center gap-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-[0_0_8px_rgba(16,185,129,0.3)] transition-colors cursor-pointer"
                >
                  <CheckCircle2 size={11} className="text-emerald-400" /> In Today&apos;s Plan
                </button>
              )}

              {isCurrentlyOnBench && !isCurrentlyActiveInToday && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/bench`)
                  }}
                  className="flex items-center gap-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-[0_0_8px_rgba(6,182,212,0.3)] transition-colors cursor-pointer"
                >
                  <Bookmark size={11} className="text-cyan-400" /> In Bench
                </button>
              )}
            </div>
            
            {/* Split out Source and Evidence badges */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {protocol.source_id && (
                <div className="flex items-center gap-1 text-[10px] text-levl-text-secondary bg-white/5 px-2 py-1 rounded">
                  <User size={10} className="text-levl-accent" />
                  Source: <span className="text-levl-accent font-medium">{protocol.source_id}</span>
                </div>
              )}
              {protocol.evidence_level && (
                <div className="flex items-center gap-1 text-[10px] text-levl-text-secondary bg-white/5 px-2 py-1 rounded">
                  <ShieldCheck size={10} className="text-blue-400" />
                  <span className="text-blue-400 font-medium">{protocol.evidence_level}</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-[10px] text-levl-text-secondary bg-white/5 px-2 py-1 rounded uppercase tracking-wide">
                <span className={protocol.status === 'published' || protocol.status === 'reviewed' ? 'text-green-400' : 'text-orange-400'}>
                  {protocol.status || 'draft'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-levl-accent/10 text-levl-accent text-[10px] uppercase px-2 py-1 rounded border border-levl-accent/20 font-bold tracking-wider shrink-0">
            {protocol.protocol_type ? formatStackGroup(protocol.protocol_type) : 'Protocol'}
          </div>
        </div>
        
        <p className="text-sm text-gray-300 line-clamp-2">{protocol.summary || protocol.description}</p>
        
        <div className="flex justify-between items-center mt-2 border-t border-white/5 pt-2">
          <span className="text-xs text-levl-text-secondary">Primary Goal: <strong className="text-white">{protocol.primary_goal || protocol.goal || 'General Health'}</strong></span>
          <span className="text-[10px] uppercase bg-white/10 px-2 py-1 rounded text-white">{protocol.steps?.length || 0} Steps</span>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-4 animate-in fade-in slide-in-from-top-2">
          
          {/* Scientific Synergy Stack Banner (User requested image feature) */}
          {(() => {
            const synergyText = protocol.synergy_text || PROTOCOL_SYNERGY_MAP[protocol.id] || PROTOCOL_SYNERGY_MAP[protocol.name] || protocol.summary || protocol.description
            if (!synergyText) return null
            return (
              <div className="bg-levl-purple/10 border border-levl-purple/30 rounded-xl p-3.5 text-xs text-purple-200 flex items-start gap-2.5 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                <Zap size={16} className="text-levl-purple shrink-0 mt-0.5" />
                <p className="leading-relaxed font-medium">
                  {synergyText}
                </p>
              </div>
            )
          })()}

          <div className="bg-black/30 rounded-lg p-4 border border-white/5 space-y-4">
            <h4 className="text-xs font-semibold text-levl-text-secondary uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <LinkIcon size={12} /> Synergy Timeline
            </h4>
            
            <div className="space-y-6">
              {sortedGroups.map(([groupName, steps]) => (
                <div key={groupName} className="space-y-3">
                  {/* Timeline Block Header */}
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-levl-accent" />
                    <h5 className="text-xs font-bold text-white uppercase tracking-wider">{formatStackGroup(groupName)}</h5>
                  </div>
                  
                  {/* Steps within Block */}
                  <div className="pl-3.5 border-l-2 border-white/5 space-y-3">
                    {(steps as ProtocolStep[]).sort((a, b) => (a.display_order || 0) - (b.display_order || 0)).map((step, index) => (
                      <div key={step.id || index} className="flex gap-3 items-start group">
                        {/* Step Marker */}
                        <div className="flex flex-col items-center mt-1 -ml-[23px]">
                          <div className="w-4 h-4 rounded-full bg-[#111] border-2 border-levl-accent/50 group-hover:border-levl-accent transition-colors flex items-center justify-center text-[8px] text-levl-accent font-bold" />
                        </div>
                        
                        <div className="flex-1 bg-white/5 rounded-lg p-3 group-hover:bg-white/10 transition-colors">
                          <div className="flex justify-between items-start">
                            <p className="text-sm font-medium text-white">{step.modality?.display_name || step.modality?.name || 'Modality'}</p>
                            
                            {/* Optionality Badge */}
                            {step.optionality && step.optionality !== 'required' && (
                              <span className="text-[9px] uppercase tracking-wide bg-white/10 px-1.5 py-0.5 rounded text-gray-400">
                                {step.optionality.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                          
                          {/* Dose and Timing rules */}
                          <div className="flex flex-wrap gap-2 mt-1.5">
                            {(step.dose_text || step.dose_amount || step.modality?.dose_or_exposure) && (
                              <span className="text-[10px] text-gray-300 font-mono bg-black/40 px-1.5 py-0.5 rounded border border-white/5">
                                {step.dose_text || (step.dose_amount ? `${step.dose_amount} ${step.dose_unit || ''}` : step.modality?.dose_or_exposure)}
                              </span>
                            )}
                            {(step.timing_slot || step.modality?.timing_summary || step.relative_offset_minutes) && (
                              <span className="text-[10px] text-gray-300 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                                ⏱️ {step.timing_slot ? formatStackGroup(step.timing_slot) : (step.relative_offset_minutes ? `${step.relative_offset_minutes > 0 ? '+' : ''}${step.relative_offset_minutes}m from ${step.timing_anchor}` : step.modality?.timing_summary)}
                              </span>
                            )}
                            {(step.frequency_rule || step.modality?.frequency) && (
                              <span className="text-[10px] text-gray-300 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                                🔄 {step.frequency_rule || step.modality?.frequency}
                              </span>
                            )}
                          </div>
                          
                          {/* Administration and Safety Notes */}
                          {(step.administration_conditions || step.safety_notes) && (
                            <div className="mt-2 text-[10px] space-y-1">
                              {step.administration_conditions && (
                                <p className="text-gray-400"><strong>Note:</strong> {JSON.stringify(step.administration_conditions)}</p>
                              )}
                              {step.safety_notes && (
                                <p className="text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded inline-block">⚠️ {step.safety_notes}</p>
                              )}
                            </div>
                          )}

                          {/* Reason Included */}
                          {step.reason_included && (
                            <p className="text-xs text-gray-400 mt-2 italic flex gap-1 items-start">
                              <Info size={12} className="shrink-0 mt-0.5 text-levl-accent/60" />
                              {step.reason_included}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              {sortedGroups.length === 0 && (
                <p className="text-xs text-gray-500 italic">No steps defined for this protocol.</p>
              )}
            </div>
          </div>

          {/* Move Protocol to Bench Button with Built-in Confirmation Box */}
          <div className="pt-2">
            {!showBenchConfirm ? (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowBenchConfirm(true)
                }}
                className="w-full py-2.5 px-4 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <BookmarkPlus size={15} />
                <span>Move Protocol to Bench</span>
              </button>
            ) : (
              <div className="bg-cyan-950/40 border border-cyan-500/40 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 shadow-lg">
                <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs uppercase tracking-wider">
                  <BookmarkPlus size={16} className="text-cyan-400" />
                  <span>Confirm: Move Protocol to Bench?</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Moving this protocol to your Bench saves it as an active baseline in your protocol library without clogging your live Today timeline. You can unpack its steps into Today or run outcome correlation analysis at any time.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={(e) => {
                      handleBench(e)
                      setShowBenchConfirm(false)
                    }}
                    disabled={addedToBench || isAddingBench}
                    className="flex-1 py-2 px-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    {addedToBench ? <Check size={14} /> : <BookmarkPlus size={14} />}
                    {addedToBench ? 'Moved to Bench!' : isAddingBench ? 'Moving...' : 'Confirm Move to Bench'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowBenchConfirm(false)
                    }}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-300 text-xs rounded-lg transition-all font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      <div className="flex items-center gap-2 p-4 pt-0 border-t border-white/5 mt-2">
        <button 
          onClick={handleToday}
          disabled={isAddingToday}
          className={`flex-1 flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all shadow-sm ${
            isCurrentlyActiveInToday 
              ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.15)] active:scale-95' 
              : 'bg-levl-accent text-white hover:bg-levl-accent/90 cursor-pointer shadow-md'
          }`}
        >
          {isCurrentlyActiveInToday ? (
            <span className="flex items-center justify-center gap-1.5 truncate">
              <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
              <span className="truncate">In Today&apos;s Plan</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1.5 truncate">
              <Plus size={15} className="shrink-0" />
              <span className="truncate">{isAddingToday ? 'Adding...' : 'Add to Today'}</span>
            </span>
          )}
        </button>
        
        <button 
          onClick={handleBench}
          disabled={isCurrentlyOnBench || isAddingBench}
          className={`flex-1 flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
            isCurrentlyOnBench 
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 cursor-default' 
              : 'bg-white/10 text-white hover:bg-white/20 border border-white/10 cursor-pointer'
          }`}
        >
          {isCurrentlyOnBench ? (
            <span className="flex items-center justify-center gap-1.5 truncate">
              <Bookmark size={15} className="text-cyan-400 shrink-0" />
              <span className="truncate">Saved on Bench</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1.5 truncate">
              <BookmarkPlus size={15} className="shrink-0 text-cyan-400" />
              <span className="truncate">{isAddingBench ? 'Saving...' : 'Add to Bench'}</span>
            </span>
          )}
        </button>

        {onCompare && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onCompare(protocol)
            }}
            className={`h-9 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer shrink-0 ${
              isPinnedForCompare
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-sm'
                : 'bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border-purple-700/40'
            }`}
            title="Compare protocol side-by-side"
          >
            <Scale size={14} className="text-purple-400" />
            <span className="hidden sm:inline">{isPinnedForCompare ? 'Selected' : 'Compare'}</span>
          </button>
        )}
      </div>
    </div>
  )
}
