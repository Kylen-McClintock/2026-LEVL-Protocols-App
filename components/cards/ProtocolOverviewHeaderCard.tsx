'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { 
  Sparkles, 
  BookOpen, 
  Activity, 
  Check, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  Zap, 
  Layers, 
  ShieldCheck, 
  FileText,
  GitBranch,
  Archive,
  Trash2,
  Sliders,
  Clock,
  ListOrdered
} from 'lucide-react'
import { Protocol, Modality, OutcomeDimension } from '@/lib/types'
import { DedupedTask, TimePickerWithAmPmToggle } from './ProtocolTaskCard'
import ProtocolVarianceModal from '../modals/ProtocolVarianceModal'
import ProtocolActionModal from '../modals/ProtocolActionModal'
import { ModalityExecutionGuide } from '../modals/ModalityExecutionGuide'
import { getModalityVideoInfo, getProtocolVideoInfo } from '@/lib/data/modalityVideos'

interface ProtocolOverviewHeaderCardProps {
  protocolName: string
  protocolInfo?: Protocol | null
  groupTasks: DedupedTask[]
  allOutcomes: OutcomeDimension[]
  onCompleteAll: () => void
  onTrackGroup: () => void
  isTrackingActive: boolean
  isFutureTimeline?: boolean
}

// Preset scientific synergy & mechanism breakdowns for known & custom protocols
const PROTOCOL_SYNERGY_REGISTRY: Record<string, {
  synergyText: string
  geekMode: {
    pathways: string[]
    mechanism: string
    references: { title: string; url: string }[]
  }
}> = {
  'Dr. David Sinclair’s Epigenetic Renewal Protocol': {
    synergyText: '🧬 Epigenetic & Sirtuin Synergy: NMN elevates intracellular NAD+ pools to fuel SIRT1/3 deacetylases and PARP1 DNA repair, while Trans-Resveratrol allosterically enhances SIRT1 catalytic rate and Metformin/Berberine activates AMPK.',
    geekMode: {
      pathways: ['SIRT1/3 Sirtuin Activation', 'PARP1 DNA Base Excision Repair', 'AMPK Phosphorylation', 'NNMT Methyl Donation'],
      mechanism: 'NMN increases cellular NAD+ by ~50%, enabling SIRT1 nuclear chromatin stabilization. Resveratrol lowers SIRT1 Km for NAD+, while TMG buffers methyl depletion during nicotinamide methylation.',
      references: [
        { title: 'NMN Human Aerobic Capacity RCT (2021)', url: 'https://pubmed.ncbi.nlm.nih.gov/34238308/' },
        { title: 'Resveratrol Human SIRT1 RCT (2011)', url: 'https://pubmed.ncbi.nlm.nih.gov/22055504/' }
      ]
    }
  },
  "Dr. David Sinclair's Epigenetic Renewal Protocol": {
    synergyText: '🧬 Epigenetic & Sirtuin Synergy: NMN elevates intracellular NAD+ pools to fuel SIRT1/3 deacetylases and PARP1 DNA repair, while Trans-Resveratrol allosterically enhances SIRT1 catalytic rate and Metformin/Berberine activates AMPK.',
    geekMode: {
      pathways: ['SIRT1/3 Sirtuin Activation', 'PARP1 DNA Base Excision Repair', 'AMPK Phosphorylation', 'NNMT Methyl Donation'],
      mechanism: 'NMN increases cellular NAD+ by ~50%, enabling SIRT1 nuclear chromatin stabilization. Resveratrol lowers SIRT1 Km for NAD+, while TMG buffers methyl depletion during nicotinamide methylation.',
      references: [
        { title: 'NMN Human Aerobic Capacity RCT (2021)', url: 'https://pubmed.ncbi.nlm.nih.gov/34238308/' },
        { title: 'Resveratrol Human SIRT1 RCT (2011)', url: 'https://pubmed.ncbi.nlm.nih.gov/22055504/' }
      ]
    }
  },
  'Gary Brecka’s Superhuman Protocol': {
    synergyText: '🧲 Magnetism -> Oxygen -> Light Triad: PEMF grounding restores cell membrane voltage (-70mV) and separates Rouleaux red blood cells, allowing EWOT hyper-oxygenation to flood blood plasma, followed by Red Light NIR photon ATP production.',
    geekMode: {
      pathways: ['Transmembrane Potential (-70mV)', 'Plasma O2 Dissolution (Henry Law)', 'Cytochrome c Oxidase Photobiomodulation', 'MTHFR L-5-MTHF Remethylation'],
      mechanism: 'PEMF increases erythrocyte negative zeta potential. EWOT elevates arterial PO2 past 400 mmHg. Red/NIR light (660/850nm) dissociates Nitric Oxide from Cytochrome c Oxidase to accelerate ATP synthesis.',
      references: [
        { title: 'PEMF Erythrocyte Aggregation Trial (2014)', url: 'https://pubmed.ncbi.nlm.nih.gov/24430983/' },
        { title: 'Hyperoxic Exercise Saturation RCT (2003)', url: 'https://pubmed.ncbi.nlm.nih.gov/12834574/' }
      ]
    }
  },
  'Dr. Matthew Walker’s 8-Hour Sleep Architecture Blueprint': {
    synergyText: '🌙 Adenosine & Thermoregulatory Sleep Synergy: 10h caffeine cutoff preserves homeostatic sleep pressure, 3h food cutoff prevents nocturnal thermogenesis, and 65°F room drop triggers the 2-3°F core cooling needed for NREM deep sleep.',
    geekMode: {
      pathways: ['Adenosine A1/A2A Unbound Receptors', 'ipRGC Melanopsin Light Suppression', 'Palmar/Plantar AVA Vasodilation', 'GABA-A Allosteric Modulation'],
      mechanism: 'Unblocked adenosine receptors build Process S sleep pressure. 65°F ambient temp shunts blood to peripheral capillaries to lower core temp by 1°C, while Mag L-Threonate + Apigenin + L-Theanine elevate alpha EEG power.',
      references: [
        { title: 'Caffeine Sleep Timing RCT (2013)', url: 'https://pubmed.ncbi.nlm.nih.gov/24235903/' },
        { title: 'Thermoregulatory Control of Sleep Review (1999)', url: 'https://pubmed.ncbi.nlm.nih.gov/10473919/' }
      ]
    }
  },
  'Dr. Valter Longo & Mayo Clinic Senolytic & Fasting Mimicking Protocol': {
    synergyText: '🦠 Senolytic Purge & Stem Cell Regeneration: High-dose Fisetin & Quercetin selectively induce apoptosis in senescent zombie cells (halting SASP), while 5-day FMD depresses IGF-1 and post-fast refeed triggers stem cell immune renewal.',
    geekMode: {
      pathways: ['BCL-2/BCL-xL SCAP Disruption', 'Macroautophagy Organellar Clearance', 'IGF-1 / PKA Downregulation', 'Hematopoietic Stem Cell (HSC) Proliferation'],
      mechanism: 'Fisetin inhibits senescent cell SCAPs. 5-day caloric restriction depresses IGF-1/PKA, driving autophagic digestion of damaged mitochondria. High-leucine refeed reactivates mTORC1 to stimulate bone marrow stem cells.',
      references: [
        { title: 'Fisetin Senolytic Lifespan Study (2018)', url: 'https://pubmed.ncbi.nlm.nih.gov/30279143/' },
        { title: 'Fasting-Mimicking Diet Human RCT (2017)', url: 'https://pubmed.ncbi.nlm.nih.gov/28202615/' }
      ]
    }
  },
  'Wim Hof Autonomic Nervous System & HRV Reset Protocol': {
    synergyText: '⚡ Adrenal Hypoxic Stress & Vagal Tone Synergy: Cyclic hyperventilation washes out CO2 (alkalosis) followed by retention hypoxia (SpO2 70-80%), driving a epinephrine surge that lowers TNF-alpha, while 50°F cold immersion boosts dopamine 250%.',
    geekMode: {
      pathways: ['Beta-2 Adrenergic Anti-Inflammatory Signaling', 'Intermittent Respiratory Hypoxia', 'Locus Coeruleus Norepinephrine Surge', 'Brown Fat UCP-1 Thermogenesis'],
      mechanism: 'Hyperventilation + retention surges plasma epinephrine, binding beta-2 receptors on macrophages to suppress pro-inflammatory cytokines. Cold water activates cutaneous thermoreceptors to boost dopamine by 250% and train vagal HRV.',
      references: [
        { title: 'PNAS Voluntary Autonomic Control RCT (2014)', url: 'https://pubmed.ncbi.nlm.nih.gov/24799686/' },
        { title: 'Cold Immersion Dopamine Elevation RCT (2000)', url: 'https://pubmed.ncbi.nlm.nih.gov/10751106/' }
      ]
    }
  },
  'Dr. Casey Means & Glucose Goddess Postprandial Glycemic Protocol': {
    synergyText: '📉 Postprandial Glycemic & GLUT4 Synergy: Pre-meal apple cider vinegar slows starch amylase breakdown, macro sequencing delays gastric emptying via fiber mesh, and soleus pushups pull glucose into muscle cells without insulin.',
    geekMode: {
      pathways: ['Alpha-Amylase / Glucosidase Inhibition', 'Non-Insulin Mediated GLUT4 Translocation', 'Viscous Chyme Gastric Emptying Delay', 'AMPK InsR Expression'],
      mechanism: 'Acetic acid inactivates intestinal glucosidases. Viscous soluble fiber coats mucosal walls. Soleus calf contractions translocate GLUT4 to sarcolemma via mechanical AMPK activation independent of pancreatic insulin.',
      references: [
        { title: 'Vinegar Postprandial Glycemia RCT (2004)', url: 'https://pubmed.ncbi.nlm.nih.gov/14694010/' },
        { title: 'Soleus Muscle Glucose Metabolism RCT (2022)', url: 'https://pubmed.ncbi.nlm.nih.gov/36066746/' }
      ]
    }
  },
  'Dr. Thomas Dayspring Endothelial & Vascular Elasticity Protocol': {
    synergyText: '🫀 Arterial Compliance & ApoB Clearance Synergy: Inorganic nitrate + L-Citrulline fuel enterosalivary nitric oxide vasodilation, isometric handgrips trigger shear-stress eNOS activation, and psyllium fiber upregulates hepatic LDLRs.',
    geekMode: {
      pathways: ['Enterosalivary NO3 -> NO2 -> NO Pathway', 'Shear-Stress eNOS Phosphorylation', 'Hepatic LDLR Upregulation', 'Bile Acid Intestinal Sequestration'],
      mechanism: 'Dietary nitrate increases capillary NO independently of O2. Isometric 30% MVC squeezes induce reactive hyperemia, upregulating eNOS. Viscous psyllium binds bile acids, forcing liver LDLRs to clear ApoB particles from plasma.',
      references: [
        { title: 'Dietary Nitrate Blood Pressure Meta-Analysis (2013)', url: 'https://pubmed.ncbi.nlm.nih.gov/23596162/' },
        { title: 'Isometric Handgrip Blood Pressure Meta-Analysis (2014)', url: 'https://pubmed.ncbi.nlm.nih.gov/24368551/' }
      ]
    }
  },
  'Bryan Johnson\'s Project Blueprint Core Protocol v2.0': {
    synergyText: '👑 Comprehensive Speed of Aging Reduction (<0.70): Combines polyphenol olive oil, morning sunlight, Zone 2/HIIT cardio, and bio-identical DHEA to target organ system longevity.',
    geekMode: {
      pathways: ['Mitochondrial Biogenesis', 'DHEA-S Endocrine Homeostasis', 'SCN Circadian Entrainment', 'Autophagy Signal Triggers'],
      mechanism: 'High-polyphenol extra virgin olive oil provides oleocanthal and hydroxytyrosol to scavenge ROS. Zone 2 cardio expands mitochondrial volume, while morning light anchors circadian cortisol/melatonin oscillation.',
      references: [
        { title: 'Project Blueprint Official Documentation', url: 'https://blueprint.bryanjohnson.com/' }
      ]
    }
  },
  'Dr. Peter Attia\'s Centenarian Decathlon Protocol': {
    synergyText: '🏃 Functional Longevity & Cardiorespiratory Volume: Combines 4x4 VO2 Max intervals, Zone 2 aerobic volume, progressive resistance training, and high-leucine protein distribution to maximize healthspan.',
    geekMode: {
      pathways: ['Mitochondrial Density (Zone 2)', 'Stroke Volume Peak Cardiac Output (4x4)', 'Sarcopenia Prevention (MPS)', 'Leucine mTOR Threshold'],
      mechanism: 'Zone 2 cardio increases mitochondrial fractional area in slow-twitch muscle fibers. 4x4 HIIT intervals maximize left ventricular stroke volume and VO2 max, the #1 predictor of all-cause mortality.',
      references: [
        { title: 'Peter Attia M.D. Outlive: The Science & Art of Longevity', url: 'https://peterattiamd.com/' }
      ]
    }
  },
  'Push / Pull / Legs (PPL) Science-Based Hypertrophy Split': {
    synergyText: '🏋️ Hypertrophy & Mechanical Tension: 3-4 day rotational split pairing anterior pressing, posterior pulling, and quad/posterior chain overload with strict mTOR recovery spacing.',
    geekMode: {
      pathways: ['Myofibrillar Protein Synthesis (MPS)', 'mTORC1 Mechanical Signaling', 'Satellite Cell Proliferation', 'Autonomic Nervous Recovery'],
      mechanism: 'Mechanical tension directly activates the focal adhesion kinase and mTORC1 pathways to upregulate protein translation. Rotational rest days prevent central nervous system fatigue and protect tendon remodeling.',
      references: [
        { title: 'Schoenfeld et al. (2019) Resistance Training Volume & Hypertrophy', url: 'https://pubmed.ncbi.nlm.nih.gov/30153194/' },
        { title: 'Krzysztofik et al. (2019) Maximizing Muscle Hypertrophy Systematic Review', url: 'https://pubmed.ncbi.nlm.nih.gov/31804791/' }
      ]
    }
  },
  '12-Week Adaptive Half Marathon Training Protocol': {
    synergyText: '🏃 Aerobic Periodization & Threshold Expansion: Combines Zone 2 base building, lactate threshold intervals, runner prehab stability, and progressive long runs leading up to target race day.',
    geekMode: {
      pathways: ['Mitochondrial Biogenesis (PGC-1α)', 'Lactate Clearance Velocity (MCT1/MCT4)', 'Capillarization of Type I Fibers', 'Tendon Elastic Energy Storage'],
      mechanism: 'Zone 2 running stimulates PGC-1α to expand mitochondrial volume, while weekly threshold intervals increase monocarboxylate transporter expression to clear lactate rapidly during high-intensity endurance output.',
      references: [
        { title: 'Seiler et al. (2010) Training Intensity Distribution in Endurance Athletes', url: 'https://pubmed.ncbi.nlm.nih.gov/20861519/' },
        { title: 'Billat et al. (2001) Interval Training for Performance', url: 'https://pubmed.ncbi.nlm.nih.gov/11219501/' }
      ]
    }
  }
};

interface ProtocolOverviewHeaderCardProps {
  protocolName: string
  protocolInfo?: Protocol | null
  groupTasks: DedupedTask[]
  allOutcomes: OutcomeDimension[]
  onCompleteAll: () => void
  onTrackGroup: () => void
  isTrackingActive: boolean
  isFutureTimeline?: boolean
  onProtocolActionSuccess?: () => void
  completedTime?: string
  onCompletedTimeChange?: (newTime: string) => void
  onEditTrackedOutcomes?: () => void
  trackingPanelSlot?: React.ReactNode
}

export default function ProtocolOverviewHeaderCard({
  protocolName,
  protocolInfo,
  groupTasks,
  allOutcomes,
  onCompleteAll,
  onTrackGroup,
  isTrackingActive,
  isFutureTimeline = false,
  onProtocolActionSuccess,
  completedTime,
  onCompletedTimeChange,
  onEditTrackedOutcomes,
  trackingPanelSlot
}: ProtocolOverviewHeaderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSynthesisStepsExpanded, setIsSynthesisStepsExpanded] = useState(false)
  const [showGeekMode, setShowGeekMode] = useState(false)
  const [isVarianceOpen, setIsVarianceOpen] = useState(false)
  const [protocolActionModalType, setProtocolActionModalType] = useState<'bench' | 'eliminate' | null>(null)
  const [protocolActionScope, setProtocolActionScope] = useState<'all' | 'custom'>('all')

  const totalCount = groupTasks.length
  const completedCount = groupTasks.filter(t => t.status === 'completed').length
  const isFullyCompleted = completedCount === totalCount && totalCount > 0

  // Internal completed time fallback if not controlled
  const [internalTime, setInternalTime] = useState(() => {
    const d = new Date()
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${hh}:${mm}`
  })

  const currentTimeVal = completedTime || internalTime
  const handleTimeUpdate = (val: string) => {
    setInternalTime(val)
    if (onCompletedTimeChange) onCompletedTimeChange(val)
  }

  // Lookup known synergy or build dynamic synergy from modalities
  const preset = PROTOCOL_SYNERGY_REGISTRY[protocolName] || {
    synergyText: `⚡ Multi-Modality Synergy Stack: Combines ${groupTasks.map(t => t.loose_modality?.name || t.protocol_step?.modality?.name).filter(Boolean).slice(0, 3).join(', ')} to target systemic physiological resilience and outcome optimization.`,
    geekMode: {
      pathways: ['AMPK Cellular Sensing', 'Autophagy Signal Triggers', 'Mitochondrial Efficiency'],
      mechanism: `Synergistic combination of ${totalCount} targeted modalities operating across complementary physiological time windows for maximum healthspan ROI.`,
      references: [
        { title: 'Hallmarks of Aging: An Expanding Universe (Cell 2023 Update)', url: 'https://pubmed.ncbi.nlm.nih.gov/36599349/' }
      ]
    }
  }

  // Detect if user has custom variances / modifications
  const isModified = groupTasks.some(t => t.execution_details?.custom_dose || t.status === 'skipped' || t.status === 'not_today') || groupTasks.length !== 3

  let groupStatusLabel = 'Complete All'
  if (completedCount === totalCount && totalCount > 0) {
    groupStatusLabel = 'Completed'
  } else if (completedCount > 0) {
    groupStatusLabel = 'Partially Completed'
  }

  return (
    <>
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="glass-card rounded-xl p-4 border border-white/5 space-y-3 cursor-pointer transition-all hover:border-white/10"
      >
        {/* Header Preview Section */}
        <div className="space-y-2 border-b border-white/10 pb-3">
          {/* Line 1: Full-width protocol title as clickable link to protocol page */}
          <div className="flex items-center gap-2.5">
            <Layers size={20} className="text-levl-purple shrink-0" />
            <h2 className="text-base sm:text-lg font-extrabold text-white tracking-wide leading-snug">
              <Link 
                href={`/protocols/${encodeURIComponent(protocolInfo?.id || protocolName)}`}
                onClick={(e) => e.stopPropagation()}
                className="hover:underline hover:text-purple-300 transition-colors flex items-center gap-1.5 inline-flex"
                title="Click to view full protocol focus page"
              >
                <span>{protocolName}</span>
                <ExternalLink size={14} className="text-purple-400 opacity-80" />
              </Link>
            </h2>
          </div>

          {/* Line 2: Modified & Modalities count (Left), Status Badge & Expand Chevron (Right) */}
          <div className="flex items-center justify-between gap-3 pt-0.5 flex-wrap">
            <div className="flex items-center gap-2.5">
              {isModified && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setIsVarianceOpen(true); }}
                  className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all flex items-center gap-1 cursor-pointer shrink-0"
                  title="Click to view variances from the original blueprint"
                >
                  <GitBranch size={10} /> 🛠️ Modified
                </button>
              )}
              <span className="text-xs text-gray-400 font-medium tracking-wide">
                {totalCount} {totalCount === 1 ? 'Modality' : 'Modalities'}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Status Badge in Header */}
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); onCompleteAll(); }} 
                disabled={isFutureTimeline || isFullyCompleted}
                className={`text-xs px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 uppercase tracking-wider font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${
                  isFullyCompleted 
                    ? 'bg-white/10 border border-white/20 text-gray-400' 
                    : 'bg-levl-accent/20 border border-levl-accent text-levl-accent hover:bg-levl-accent hover:text-white'
                }`}
              >
                <Check size={13} /> {groupStatusLabel}
              </button>

              {/* Clean Dropdown Chevron Icon Button */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm shrink-0 active:scale-95"
                aria-label={isExpanded ? "Collapse protocol details" : "Expand protocol details"}
                title={isExpanded ? "Collapse protocol details" : "Expand protocol details"}
              >
                {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-300" /> : <ChevronDown className="w-4 h-4 text-slate-300" />}
              </button>
            </div>
          </div>

          {/* Line 3: Visible Protocol Description */}
          {(protocolInfo?.description || preset.synergyText) && (
            <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed pt-1.5">
              {protocolInfo?.description || preset.synergyText}
            </p>
          )}
        </div>

        {/* EXPANDED VIEW: Visible ONLY when protocol card is opened (expanded) */}
        {isExpanded && (
          <div className="space-y-3 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
            {/* Quick Action Toolbar Box */}
            <div className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-2.5">
              {/* Row 1: Side-by-side 50/50 Track Protocol & Edit Tracked Outcomes */}
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={onTrackGroup} 
                  className={`flex-1 text-xs py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider font-semibold cursor-pointer ${
                    isTrackingActive 
                      ? 'bg-purple-600 text-white shadow-md border border-purple-400' 
                      : 'bg-white/5 border border-white/10 text-levl-purple hover:bg-white/10'
                  }`}
                >
                  <Activity size={13} /> {isTrackingActive ? 'Close Tracking' : '⚡ Track Protocol'}
                </button>

                {onEditTrackedOutcomes && (
                  <button
                    type="button"
                    onClick={onEditTrackedOutcomes}
                    className="flex-1 text-xs py-2 bg-white/10 hover:bg-white/15 border border-white/20 text-gray-200 hover:text-white rounded-xl transition-colors flex items-center justify-center gap-1.5 font-bold cursor-pointer"
                  >
                    <Sliders size={13} /> Edit Tracked Outcomes
                  </button>
                )}
              </div>

              {/* Row 2: Full-width Completed Time Field */}
              <div className="flex items-center justify-between gap-2 bg-black/60 border border-emerald-500/40 rounded-xl px-3 py-1.5 text-sm font-semibold">
                <span className="text-emerald-200 font-bold text-xs">Completed:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date()
                      const hh = String(d.getHours()).padStart(2, '0')
                      const mm = String(d.getMinutes()).padStart(2, '0')
                      handleTimeUpdate(`${hh}:${mm}`)
                    }}
                    className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                    title="Click to reset completion time to current time (NOW)"
                  >
                    <Clock size={16} />
                    <span className="text-xs uppercase font-bold text-emerald-400/90 underline decoration-dotted">Now</span>
                  </button>
                  <TimePickerWithAmPmToggle
                    value={currentTimeVal}
                    onChange={handleTimeUpdate}
                  />
                </div>
              </div>
            </div>

            {/* Outcome Tracking Panel Slot (opens directly under toolbar) */}
            {trackingPanelSlot}

            {/* Detailed Description */}
            <p className="text-xs text-gray-300 leading-relaxed">
              {protocolInfo?.description || 'Curated longevity protocol stack optimized for biological age reduction and targeted outcome enhancement.'}
            </p>

            {/* Biological Synergy Highlight Box */}
            <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-2.5">
              <Zap size={14} className="text-indigo-400 mt-0.5 shrink-0" />
              <p className="text-xs text-indigo-200 leading-relaxed font-sans">
                {preset.synergyText}
              </p>
            </div>

            {/* STEP-BY-STEP PROTOCOL SYNTHESIS GUIDE & PROTOCOL VIDEO (Collapsed by default) */}
            {(() => {
              const protoVid = getProtocolVideoInfo(protocolInfo?.id, protocolName)
              return (
                <div className="space-y-2 pt-2 border-t border-white/10">
                  {/* Protocol-level Video if present */}
                  {protoVid && (
                    <ModalityExecutionGuide
                      youtubeVideoId={protoVid.youtubeVideoId}
                      videoStartSeconds={protoVid.videoStartSeconds}
                      videoTitle={protoVid.videoTitle}
                      modalityName={protocolName}
                      defaultOpen={false}
                    />
                  )}

                  {/* Sequential Steps Collapsed by Default */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setIsSynthesisStepsExpanded(!isSynthesisStepsExpanded); }}
                      className="w-full flex items-center justify-between p-3 text-left bg-slate-900/60 hover:bg-slate-900 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <ListOrdered size={14} className="text-purple-400" />
                        <span className="text-xs font-extrabold text-white uppercase tracking-wider">
                          Sequential Protocol Steps ({groupTasks.length})
                        </span>
                      </div>
                      <div className="text-purple-300 text-xs font-bold flex items-center gap-1">
                        <span>{isSynthesisStepsExpanded ? 'Hide Steps' : 'Show Steps'}</span>
                        {isSynthesisStepsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </button>

                    {isSynthesisStepsExpanded && (
                      <div className="p-3 border-t border-slate-800 space-y-2 bg-slate-950 animate-in fade-in slide-in-from-top-1">
                        {groupTasks.map((t, idx) => {
                          const mod = t.loose_modality || t.protocol_step?.modality
                          const stepName = mod?.display_name || mod?.name || t.protocol_step?.instructions || `Step ${idx + 1}`
                          const stepTiming = t.timing_slot ? t.timing_slot.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Daily'
                          const stepDose = t.execution_details?.custom_dose || mod?.dose_or_exposure || 'Standard dose'
                          const stepNotes = t.protocol_step?.instructions || mod?.instructions || mod?.brief_description || ''

                          return (
                            <div key={t.id || idx} className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-200 space-y-1">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center justify-center font-bold font-mono text-[11px] shrink-0">
                                    {idx + 1}
                                  </span>
                                  <span className="font-extrabold text-white">{stepName}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] font-mono">
                                  <span className="bg-slate-950 px-2 py-0.5 rounded text-purple-300 border border-slate-800">⏰ {stepTiming}</span>
                                  <span className="bg-slate-950 px-2 py-0.5 rounded text-teal-300 border border-slate-800">💊 {stepDose}</span>
                                </div>
                              </div>
                              {stepNotes && (
                                <p className="text-[11px] text-slate-300 pl-7 border-l-2 border-purple-500/30 my-1 leading-relaxed">
                                  {stepNotes}
                                </p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}

            {/* Action Buttons 2x2 Grid on Expanded View */}
            <div className="space-y-2 pt-1 border-t border-white/10">
              {/* Row 1: Adjust Protocol (50%) & Geek Mode (50%) */}
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => {
                    setProtocolActionScope('custom')
                    setProtocolActionModalType('bench')
                  }}
                  className="flex-1 text-xs font-bold py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  title="Remove or bench specific modalities within this protocol"
                >
                  <Sliders size={13} className="text-teal-400" /> Adjust Protocol
                </button>

                <button
                  type="button"
                  onClick={() => setShowGeekMode(!showGeekMode)}
                  className="flex-1 text-xs font-bold py-2 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 rounded-xl border border-amber-500/30 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <BookOpen size={13} /> {showGeekMode ? 'Hide Geek Mode' : 'Geek Mode 🤓'}
                </button>
              </div>

              {/* Row 2: Bench Protocol (50%) & Eliminate Protocol (50%) */}
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => {
                    setProtocolActionScope('all')
                    setProtocolActionModalType('bench')
                  }}
                  className="flex-1 text-xs font-bold py-2 bg-purple-950/80 hover:bg-purple-900 text-purple-200 rounded-xl border border-purple-700/80 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  title="Move entire protocol to bench"
                >
                  <Archive size={13} /> Bench Protocol
                </button>

                <button 
                  type="button"
                  onClick={() => {
                    setProtocolActionScope('all')
                    setProtocolActionModalType('eliminate')
                  }}
                  className="flex-1 text-xs font-bold py-2 bg-red-950/80 hover:bg-red-900 text-red-200 rounded-xl border border-red-700/80 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  title="Eliminate entire protocol"
                >
                  <Trash2 size={13} /> Eliminate Protocol
                </button>
              </div>
            </div>

            {/* Geek Mode Expanded Scientific Breakdown */}
            {showGeekMode && (
              <div className="p-4 rounded-2xl bg-black/80 border border-amber-500/40 space-y-3 animate-in fade-in slide-in-from-top-2 shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                    <BookOpen size={14} /> Geek Mode: Deep Scientific Protocol Mechanics
                  </h4>
                  <span className="text-[10px] font-mono text-gray-400">Peer-Reviewed Evidence</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Target Cellular Pathways</span>
                    <div className="flex flex-wrap gap-1.5">
                      {preset.geekMode.pathways.map((p, idx) => (
                        <span key={idx} className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono font-bold text-[10px]">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Molecular Mechanism of Action</span>
                    <p className="text-gray-300 leading-relaxed text-xs">
                      {preset.geekMode.mechanism}
                    </p>
                  </div>

                  {preset.geekMode.references && preset.geekMode.references.length > 0 && (
                    <div className="pt-2 border-t border-white/10">
                      <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Clinical Study Citations</span>
                      <div className="space-y-1">
                        {preset.geekMode.references.map((ref, idx) => (
                          <a
                            key={idx}
                            href={ref.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-indigo-300 hover:text-white flex items-center gap-1 transition-colors"
                          >
                            <ExternalLink size={12} /> {ref.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ProtocolVarianceModal
        isOpen={isVarianceOpen}
        onClose={() => setIsVarianceOpen(false)}
        protocolName={protocolName}
        protocolInfo={protocolInfo}
        groupTasks={groupTasks}
      />

      <ProtocolActionModal
        isOpen={protocolActionModalType !== null}
        onClose={() => setProtocolActionModalType(null)}
        protocolName={protocolName}
        protocolInfo={protocolInfo}
        groupTasks={groupTasks}
        initialAction={protocolActionModalType || 'bench'}
        initialScope={protocolActionScope}
        onSuccess={() => {
          if (onProtocolActionSuccess) onProtocolActionSuccess()
        }}
      />
    </>
  )
}
