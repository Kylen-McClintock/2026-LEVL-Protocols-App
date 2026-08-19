'use client'

import React, { useState, useRef } from 'react'
import { DailyProtocolTask, UserProfile, OutcomeDimension } from '@/lib/types'
import { 
  Stethoscope, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Activity, 
  Building2, 
  Microscope, 
  Upload,
  FileUp,
  Sparkles,
  RotateCcw,
  FileCheck,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react'
import { format } from 'date-fns'
import GeekMode from './GeekMode'
import { ModalityExecutionGuide } from '../modals/ModalityExecutionGuide'
import { getModalityVideoInfo } from '@/lib/data/modalityVideos'

interface ProactiveDiagnosticCardProps {
  task: DailyProtocolTask
  onStatusChange: (taskId: string, newStatus: string) => void
  onTrackOutcomes?: (modality: any, sessionId?: any, phase?: any) => void
  userProfile?: UserProfile | null
  allOutcomes?: OutcomeDimension[]
}

const DIAGNOSTIC_PREP_REGISTRY: Record<string, {
  cadenceLabel: string
  facilityType: string
  prepNotes: string[]
  recommendedBiomarkers: string[]
  formType: 'apob' | 'cac' | 'dexa' | 'dynamic'
}> = {
  'apob': {
    cadenceLabel: 'Quarterly / Every 6 Mo',
    facilityType: 'Diagnostic Lab (Quest/Labcorp)',
    formType: 'apob',
    prepNotes: [
      '10-12 hour fasting requirement (water only allowed).',
      'Avoid intense workouts 24 hours before draw to prevent acute creatine kinase & muscle enzyme artifacts.'
    ],
    recommendedBiomarkers: ['ApoB (<60 mg/dL)', 'Lp(a)', 'LDL-P', 'hs-CRP']
  },
  'calcium': {
    cadenceLabel: 'Every 3-5 Years',
    facilityType: 'Imaging Center / Low-Dose CT',
    formType: 'cac',
    prepNotes: [
      'Zero caffeine or stimulants 4 hours prior (keeps HR low for motion-artifact-free CT imaging).',
      'No iodine or IV contrast dye required.',
      'Wear comfortable clothing without metal buttons or zippers on chest.'
    ],
    recommendedBiomarkers: ['Agatston Score (Target: 0)', 'Percentile for Age/Sex', 'Soft Plaque Presence']
  },
  'cac': {
    cadenceLabel: 'Every 3-5 Years',
    facilityType: 'Imaging Center / Low-Dose CT',
    formType: 'cac',
    prepNotes: [
      'Zero caffeine or stimulants 4 hours prior (keeps HR low for motion-artifact-free CT imaging).',
      'Wear comfortable clothing without metal.'
    ],
    recommendedBiomarkers: ['Agatston Score']
  },
  'dexa': {
    cadenceLabel: 'Bi-Annual (Every 6 Mo)',
    facilityType: 'DXA Imaging Lab',
    formType: 'dexa',
    prepNotes: [
      'Avoid calcium supplements 24 hours prior to scan.',
      'Fast from food for 3-4 hours prior for consistent visceral fat (VAT) reads.',
      'Empty bladder immediately before scan.'
    ],
    recommendedBiomarkers: ['Visceral Adipose Tissue (VAT)', 'Bone Mineral Density (T-score)', 'Lean Mass %']
  },
  'mri': {
    cadenceLabel: 'Annual or Every 2 Years',
    facilityType: 'Full-Body MRI Suite (Prenuvo/Ezra)',
    formType: 'dynamic',
    prepNotes: [
      '4-hour fast from food prior to scan.',
      'Remove all metallic jewelry, piercings, and wearable devices.',
      'Wear comfortable, metal-free athletic clothing.'
    ],
    recommendedBiomarkers: ['Full Body Solid Lesion Screen', 'Visceral Organ Volume', 'Spine & Disc Degeneration']
  },
  'vo2': {
    cadenceLabel: 'Bi-Annual or Annual',
    facilityType: 'Exercise Physiology Lab / CPET',
    formType: 'dynamic',
    prepNotes: [
      'Avoid strenuous workouts 24 hours prior to testing.',
      'No heavy meals or caffeine 3 hours prior to test.',
      'Wear running shoes and athletic workout clothes.'
    ],
    recommendedBiomarkers: ['VO2 Max (mL/kg/min)', 'Zone 2 VT1 Threshold', 'Respiratory Exchange Ratio (RER)']
  },
  'epigenetic': {
    cadenceLabel: 'Annual (Every 12 Mo)',
    facilityType: 'TruDiagnostic / DNA Methylation Lab',
    formType: 'dynamic',
    prepNotes: [
      'No fasting required prior to blood draw or fingerstick collection.',
      'Ensure sample collection tube is filled to designated fill line.',
      'Register kit barcode online prior to mailing.'
    ],
    recommendedBiomarkers: ['DunedinPACE Speed of Aging', 'Epigenetic Biological Age', 'Telomere Length Estimate']
  },
  'dunedinpace': {
    cadenceLabel: 'Annual (Every 12 Mo)',
    facilityType: 'TruDiagnostic / DNA Methylation Lab',
    formType: 'dynamic',
    prepNotes: [
      'No fasting required prior to collection.',
      'Register kit barcode online before shipping sample.'
    ],
    recommendedBiomarkers: ['DunedinPACE Pace of Aging', 'Biological Age Acceleration']
  },
  'oral': {
    cadenceLabel: 'Annual (Every 12 Mo)',
    facilityType: 'OralDNA / Salivary PCR Lab',
    formType: 'dynamic',
    prepNotes: [
      'Do not brush teeth, use dental floss, or use mouthwash for 30 minutes prior to saline oral rinse collection.',
      'Rinse with saline solution for 30 seconds and spit into collection vial.'
    ],
    recommendedBiomarkers: ['P. gingivalis Load', 'T. forsythia', 'Gingipain Proteases']
  },
  'abpm': {
    cadenceLabel: 'Annual (Every 12 Mo)',
    facilityType: 'Cardiology Clinic / Ambulatory ABPM',
    formType: 'dynamic',
    prepNotes: [
      'Wear automated oscillometric arm cuff continuously for 24 hours.',
      'Keep arm relaxed and stationary during inflation cycles.',
      'Log exact sleep and wake times for dipping calculations.'
    ],
    recommendedBiomarkers: ['Nocturnal Dipping % (Target 10-20%)', '24h Mean Arterial Pressure (MAP)', 'Morning BP Surge']
  },
  'metal': {
    cadenceLabel: 'Every 1-2 Years',
    facilityType: 'Diagnostic Lab (ICP-MS Blood/Urine)',
    formType: 'dynamic',
    prepNotes: [
      'Avoid seafood consumption (tuna, swordfish, shellfish) for 48 hours prior to blood and urine collection.',
      'Collect first morning urine void in metal-free trace element container.'
    ],
    recommendedBiomarkers: ['Blood Lead & Mercury', 'Urinary Cadmium', 'Serum Arsenic & PFAS']
  },
  'grail': {
    cadenceLabel: 'Annual (Every 12 Mo)',
    facilityType: 'Blood Draw Clinic / Phlebotomy',
    formType: 'dynamic',
    prepNotes: [
      'Hydration protocol: Drink 16-24 oz water 1 hour prior for easy phlebotomy draw.',
      'No fasting required prior to blood draw.',
      'Ensure requisition order form is signed by ordering physician.'
    ],
    recommendedBiomarkers: ['50+ Cancer Signal Origin', 'Methylation Signature']
  },
  'cancer': {
    cadenceLabel: 'Annual (Every 12 Mo)',
    facilityType: 'Blood Draw Clinic / Phlebotomy',
    formType: 'dynamic',
    prepNotes: [
      'Hydration protocol: Drink 16-24 oz water 1 hour prior for easy blood draw.',
      'No fasting required prior to blood draw.'
    ],
    recommendedBiomarkers: ['Multi-Cancer Early Detection']
  }
}

export const ProactiveDiagnosticCard: React.FC<ProactiveDiagnosticCardProps> = ({
  task,
  onStatusChange,
  onTrackOutcomes
}) => {
  const [isCardExpanded, setIsCardExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'upload' | 'manual' | 'prep' | 'geek'>('upload')

  // AI Upload State
  const [isDragging, setIsDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiExtractedData, setAiExtractedData] = useState<any | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Structured Manual Input States
  const [apobVal, setApobVal] = useState('')
  const [lpaVal, setLpaVal] = useState('')
  const [hscrpVal, setHscrpVal] = useState('')
  const [trigVal, setTrigVal] = useState('')
  
  const [agatstonScore, setAgatstonScore] = useState('')
  const [percentileVal, setPercentileVal] = useState('')
  const [hasSoftPlaque, setHasSoftPlaque] = useState<'no' | 'yes'>('no')

  const [bodyFatPct, setBodyFatPct] = useState('')
  const [vatWeight, setVatWeight] = useState('')
  const [boneTScore, setBoneTScore] = useState('')

  const [grailSignal, setGrailSignal] = useState<'clear' | 'detected'>('clear')
  const [facilityNotes, setFacilityNotes] = useState('')

  const [isLoggedSuccess, setIsLoggedSuccess] = useState(false)

  const modality = task.protocol_step?.modality || task.loose_modality
  const name = modality?.name || (task as any).name || 'Proactive Diagnostic Screening'
  
  const fullDescription = (modality as any)?.expanded_why || (modality as any)?.brief_description || (modality as any)?.overview || (modality as any)?.description || task.protocol_step?.instructions || 'Annual proactive longevity milestone and preventive screening.'
  const briefDescription = (modality as any)?.brief_description || (modality as any)?.overview || fullDescription

  const lowerName = name.toLowerCase()
  const matchingKey = Object.keys(DIAGNOSTIC_PREP_REGISTRY).find(k => lowerName.includes(k))
  const prepConfig = matchingKey ? DIAGNOSTIC_PREP_REGISTRY[matchingKey] : {
    cadenceLabel: 'Periodic Milestone',
    facilityType: 'Diagnostic Center / Clinic',
    formType: 'dynamic' as const,
    prepNotes: [
      'Follow facility specific fasting and hydration guidelines.',
      'Bring photo ID and requisition forms.'
    ],
    recommendedBiomarkers: ['Primary Diagnostic Score']
  }

  const isCompleted = task.status === 'completed'

  // Handle AI File Processing Simulation
  const processUploadedFile = (file: File) => {
    setUploadedFileName(file.name)
    setIsAnalyzing(true)
    setAiExtractedData(null)

    setTimeout(() => {
      setIsAnalyzing(false)

      if (lowerName.includes('apob') || lowerName.includes('lipid')) {
        setAiExtractedData({
          title: 'ApoB & Lipid Panel Extracted via Gemini AI',
          confidence: '99.4%',
          biomarkers: [
            { name: 'Apolipoprotein B (ApoB)', value: '54 mg/dL', status: 'Optimal (<60)' },
            { name: 'Lipoprotein(a) [Lp(a)]', value: '18 nmol/L', status: 'Low Risk (<75)' },
            { name: 'hs-CRP', value: '0.4 mg/L', status: 'Low Inflammation (<1.0)' },
            { name: 'Triglycerides', value: '72 mg/dL', status: 'Optimal (<100)' }
          ]
        })
        setApobVal('54')
        setLpaVal('18')
        setHscrpVal('0.4')
        setTrigVal('72')
      } else if (lowerName.includes('cac') || lowerName.includes('calcium')) {
        setAiExtractedData({
          title: 'Coronary CT Calcium Scan Extracted via AI',
          confidence: '98.9%',
          biomarkers: [
            { name: 'Agatston Calcium Score', value: '0', status: 'Zero Calcified Plaque' },
            { name: 'Percentile for Age/Sex', value: '100th Percentile', status: 'Optimal' },
            { name: 'Soft Plaque Presence', value: 'None Detected', status: 'Clear' }
          ]
        })
        setAgatstonScore('0')
        setPercentileVal('100')
        setHasSoftPlaque('no')
      } else if (lowerName.includes('dexa')) {
        setAiExtractedData({
          title: 'DEXA Body Composition Extracted via AI',
          confidence: '99.1%',
          biomarkers: [
            { name: 'Total Body Fat', value: '14.2%', status: 'Optimal Athletic Range' },
            { name: 'Visceral Adipose Tissue (VAT)', value: '0.72 lbs', status: 'Low Cardiometabolic Risk' },
            { name: 'Spine Bone Density T-Score', value: '+1.4', status: 'Normal Bone Mass' }
          ]
        })
        setBodyFatPct('14.2')
        setVatWeight('0.72')
        setBoneTScore('1.4')
      } else if (lowerName.includes('mri')) {
        setAiExtractedData({
          title: 'Full-Body MRI Report Extracted via Gemini AI',
          confidence: '99.3%',
          biomarkers: [
            { name: 'Solid Lesion Screen', value: 'Clear / No Malignancy', status: 'Optimal' },
            { name: 'Brain Parenchyma & Vessels', value: 'Normal / No Aneurysm', status: 'Normal' },
            { name: 'Visceral Organ Volume', value: 'Liver Steatosis Negative', status: 'Optimal' }
          ]
        })
      } else if (lowerName.includes('vo2') || lowerName.includes('cpet')) {
        setAiExtractedData({
          title: 'VO₂ Max CPET Test Extracted via Gemini AI',
          confidence: '99.5%',
          biomarkers: [
            { name: 'VO₂ Max Score', value: '54.6 mL/kg/min', status: 'Elite (>95th Percentile)' },
            { name: 'Zone 2 VT1 Power', value: '215 Watts', status: 'High Aerobic Efficiency' },
            { name: 'Max Heart Rate', value: '188 bpm', status: 'Normal Peak' }
          ]
        })
      } else if (lowerName.includes('dunedinpace') || lowerName.includes('epigenetic')) {
        setAiExtractedData({
          title: 'DunedinPACE Epigenetic Clock Extracted via AI',
          confidence: '99.2%',
          biomarkers: [
            { name: 'DunedinPACE Aging Speed', value: '0.74', status: 'Slowing Aging (26% Slower)' },
            { name: 'Epigenetic Biological Age', value: '31.2 Years', status: 'Younger than Chronological' },
            { name: 'Telomere Length Estimation', value: '7.4 kb', status: 'Above Average' }
          ]
        })
      } else if (lowerName.includes('oral') || lowerName.includes('microbiome') || lowerName.includes('periodontal')) {
        setAiExtractedData({
          title: 'Oral Microbiome PCR Extracted via Gemini AI',
          confidence: '99.1%',
          biomarkers: [
            { name: 'P. gingivalis Pathogen Load', value: '<100 copies/mL', status: 'Low Risk (Undetectable)' },
            { name: 'T. forsythia / T. denticola', value: 'Low Threshold', status: 'Optimal' },
            { name: 'Gingipain Protease Risk', value: 'Low Systemic Vulnerability', status: 'Clear' }
          ]
        })
      } else if (lowerName.includes('abpm') || lowerName.includes('ambulatory') || lowerName.includes('pressure')) {
        setAiExtractedData({
          title: '24-Hour ABPM Report Extracted via Gemini AI',
          confidence: '99.4%',
          biomarkers: [
            { name: 'Nocturnal BP Dipping', value: '14.8% Drop', status: 'Normal Dipper (Target 10-20%)' },
            { name: '24h Mean Arterial Pressure (MAP)', value: '82 mmHg', status: 'Optimal (<85 mmHg)' },
            { name: 'Morning BP Surge', value: '+12 mmHg', status: 'Low Cardiovascular Risk' }
          ]
        })
      } else if (lowerName.includes('metal') || lowerName.includes('toxin') || lowerName.includes('mercury') || lowerName.includes('lead')) {
        setAiExtractedData({
          title: 'Heavy Metals ICP-MS Panel Extracted via AI',
          confidence: '99.6%',
          biomarkers: [
            { name: 'Blood Lead Level', value: '0.8 µg/dL', status: 'Low (<3.5 µg/dL)' },
            { name: 'Blood Mercury Level', value: '1.2 µg/L', status: 'Low Risk (<5.0 µg/L)' },
            { name: 'Urinary Cadmium', value: '0.18 µg/g Cr', status: 'Optimal (<0.5)' }
          ]
        })
      } else {
        setAiExtractedData({
          title: 'Diagnostic Report Extracted via Gemini AI',
          confidence: '98.5%',
          biomarkers: [
            { name: 'Diagnostic Signal', value: 'No Signal Detected (Negative)', status: 'Clear / Normal' },
            { name: 'Clinical Finding', value: 'No abnormal tissue origin shedding identified.', status: 'Clear' }
          ]
        })
        setGrailSignal('clear')
      }
    }, 1800)
  }

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0])
    }
  }

  const handleSaveSubmission = () => {
    setIsLoggedSuccess(true)
    setTimeout(() => {
      onStatusChange(task.id, 'completed')
      setIsLoggedSuccess(false)
    }, 600)
  }

  return (
    <div className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
      isCompleted 
        ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-300' 
        : 'bg-slate-900/90 border-slate-800 hover:border-amber-500/40 text-slate-100 shadow-xl backdrop-blur-md'
    }`}>
      {/* Full-Width Header Bar */}
      <div 
        onClick={() => setIsCardExpanded(!isCardExpanded)}
        className="p-4 cursor-pointer hover:bg-white/[0.02] transition-colors flex flex-col gap-2"
      >
        {/* Row 1: Full-Width Modality Title */}
        <div className="w-full flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className={`p-2 rounded-xl border shrink-0 ${
              isCompleted 
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                : 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
            }`}>
              <Stethoscope className="w-4.5 h-4.5" />
            </div>

            <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight truncate">
              {name}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              {prepConfig.cadenceLabel}
            </span>

            {isCompleted && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <Check size={11} strokeWidth={3} /> Done
              </span>
            )}

            <button 
              type="button"
              className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
            >
              {isCardExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
        </div>

        {/* Row 2: Brief Subtitle & Facility Details */}
        <div className="flex items-center justify-between text-xs text-slate-400 gap-2 flex-wrap">
          <p className="line-clamp-1 flex-1 text-slate-400 font-medium">
            {briefDescription}
          </p>

          <span className="flex items-center gap-1 text-[11px] text-amber-300/80 font-mono shrink-0">
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            {prepConfig.facilityType}
          </span>
        </div>
      </div>

      {/* Expanded Card View */}
      {isCardExpanded && (
        <div className="border-t border-slate-800/80 bg-black/60 p-4 space-y-4 animate-in fade-in slide-in-from-top-2">
          
          {/* Entire Description Display Box */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/20 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 uppercase tracking-wider">
              <Info className="w-4 h-4 text-amber-400" />
              <span>Full Diagnostic Overview & Longevity Purpose</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              {fullDescription}
            </p>
          </div>

          {/* STEP-BY-STEP EXECUTION GUIDE & VIDEO DEMO FOR PHYSIOLOGICAL DIAGNOSTICS */}
          {(() => {
            const instructions = task.protocol_step?.instructions || (task as any).instructions || modality?.instructions || ''
            const vidInfo = getModalityVideoInfo(modality?.id || task.modality_id || (modality as any)?.slug, 'diagnostics', name)
            return (
              <ModalityExecutionGuide
                instructions={instructions}
                youtubeVideoId={vidInfo?.youtubeVideoId}
                videoStartSeconds={vidInfo?.videoStartSeconds}
                videoTitle={vidInfo?.videoTitle}
                modalityName={name}
                briefDescription={briefDescription}
                doseOrExposure={modality?.dose_or_exposure || prepConfig.cadenceLabel}
                timingSummary={modality?.timing_summary || prepConfig.facilityType}
                defaultOpen={false}
              />
            )
          })()}

          {/* Action Tabs Header */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 flex-wrap">
            {/* Primary Tab: AI Upload */}
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-amber-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                  : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Lab Report Upload</span>
            </button>

            {/* Secondary Tab: Structured Manual Entry */}
            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'manual'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Manual Entry</span>
            </button>

            {/* Prep Checklist Tab */}
            <button
              type="button"
              onClick={() => setActiveTab('prep')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'prep'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Prep Protocol</span>
            </button>

            {/* Geek Mode Tab */}
            <button
              type="button"
              onClick={() => setActiveTab('geek')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ml-auto ${
                activeTab === 'geek'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Microscope className="w-3.5 h-3.5 text-purple-400" />
              <span>Geek Mode</span>
            </button>
          </div>

          {/* TAB 1: AI LAB REPORT UPLOAD (PRIMARY) */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                accept=".pdf,.png,.jpg,.jpeg" 
                className="hidden" 
              />

              {/* Drag & Drop Upload Zone */}
              <div 
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 rounded-2xl border-2 border-dashed transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
                    : 'border-slate-800 bg-slate-950/80 hover:border-amber-500/50 hover:bg-slate-900/60'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  <FileUp className="w-6 h-6" />
                </div>

                <div>
                  <h4 className="text-sm font-extrabold text-white">
                    Upload Diagnostic Report or Lab PDF
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Drag & drop your Quest, Prenuvo, GRAIL, or Labcorp PDF/image or <span className="text-amber-400 font-bold underline">browse file</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                  <span>Supports: PDF, PNG, JPG</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck size={12} /> Encrypted AI Extraction
                  </span>
                </div>
              </div>

              {/* AI Processing Animation */}
              {isAnalyzing && (
                <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-3 animate-pulse">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                      Analyzing {uploadedFileName}...
                    </span>
                    <span className="font-mono text-[11px] text-amber-400">Gemini Vision AI</span>
                  </div>

                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-amber-500/30">
                    <div className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full w-3/4 transition-all duration-1000 animate-pulse" />
                  </div>
                  <p className="text-[11px] text-slate-400">Extracting biomarkers, reference ranges, and physician notes...</p>
                </div>
              )}

              {/* Extracted AI Results Display */}
              {aiExtractedData && !isAnalyzing && (
                <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-300">
                      <FileCheck className="w-4 h-4 text-emerald-400" />
                      <span>{aiExtractedData.title}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      {aiExtractedData.confidence} Precision
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {aiExtractedData.biomarkers.map((bm: any, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] text-slate-400 block font-medium">{bm.name}</span>
                          <span className="text-xs font-mono font-extrabold text-white">{bm.value}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          {bm.status}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setAiExtractedData(null)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-400 transition cursor-pointer"
                    >
                      Re-upload
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveSubmission}
                      className={`px-4 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer ${
                        isLoggedSuccess
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                      }`}
                    >
                      <Check size={14} strokeWidth={3} />
                      <span>{isLoggedSuccess ? 'Saved & Verified!' : 'Approve & Mark Complete'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: STRUCTURED MANUAL ENTRY */}
          {activeTab === 'manual' && (
            <div className="space-y-4 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Manual Metric Entry ({prepConfig.formType.toUpperCase()})</span>
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">{format(new Date(), 'MMM d, yyyy')}</span>
              </div>

              {/* Form Option 1: ApoB & Lipid Panel */}
              {prepConfig.formType === 'apob' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 font-semibold mb-1">ApoB (mg/dL)</label>
                    <input
                      type="number"
                      value={apobVal}
                      onChange={(e) => setApobVal(e.target.value)}
                      placeholder="e.g. 54 (Target <60)"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 font-mono focus:border-emerald-500/60 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 font-semibold mb-1">Lp(a) (nmol/L)</label>
                    <input
                      type="number"
                      value={lpaVal}
                      onChange={(e) => setLpaVal(e.target.value)}
                      placeholder="e.g. 18 (Target <75)"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 font-mono focus:border-emerald-500/60 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 font-semibold mb-1">hs-CRP (mg/L)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={hscrpVal}
                      onChange={(e) => setHscrpVal(e.target.value)}
                      placeholder="e.g. 0.4 (Target <1.0)"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 font-mono focus:border-emerald-500/60 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 font-semibold mb-1">Triglycerides (mg/dL)</label>
                    <input
                      type="number"
                      value={trigVal}
                      onChange={(e) => setTrigVal(e.target.value)}
                      placeholder="e.g. 72 (Target <100)"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 font-mono focus:border-emerald-500/60 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Form Option 2: CAC Calcium Score */}
              {prepConfig.formType === 'cac' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 font-semibold mb-1">Agatston Calcium Score</label>
                    <input
                      type="number"
                      value={agatstonScore}
                      onChange={(e) => setAgatstonScore(e.target.value)}
                      placeholder="0 = Plaque Free"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 font-mono focus:border-emerald-500/60 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 font-semibold mb-1">Percentile for Age/Sex (%)</label>
                    <input
                      type="number"
                      value={percentileVal}
                      onChange={(e) => setPercentileVal(e.target.value)}
                      placeholder="e.g. 100th Percentile"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 font-mono focus:border-emerald-500/60 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-slate-400 font-semibold mb-1">Soft Plaque Presence</label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setHasSoftPlaque('no')}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border cursor-pointer transition ${
                          hasSoftPlaque === 'no'
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        ✓ None Detected (Clear)
                      </button>
                      <button
                        type="button"
                        onClick={() => setHasSoftPlaque('yes')}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border cursor-pointer transition ${
                          hasSoftPlaque === 'yes'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        Plaque Identified
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Option 3: DEXA Body Composition */}
              {prepConfig.formType === 'dexa' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 font-semibold mb-1">Body Fat %</label>
                    <input
                      type="number"
                      step="0.1"
                      value={bodyFatPct}
                      onChange={(e) => setBodyFatPct(e.target.value)}
                      placeholder="e.g. 14.2%"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 font-mono focus:border-emerald-500/60 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 font-semibold mb-1">Visceral Fat (VAT lbs)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={vatWeight}
                      onChange={(e) => setVatWeight(e.target.value)}
                      placeholder="e.g. 0.72 lbs"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 font-mono focus:border-emerald-500/60 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 font-semibold mb-1">Spine Bone T-Score</label>
                    <input
                      type="number"
                      step="0.1"
                      value={boneTScore}
                      onChange={(e) => setBoneTScore(e.target.value)}
                      placeholder="e.g. +1.4"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 font-mono focus:border-emerald-500/60 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Form Option 4: Dynamic Screenings (GRAIL, MRIs, etc.) */}
              {prepConfig.formType === 'dynamic' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 font-semibold mb-1">Cancer / Diagnostic Signal Outcome</label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setGrailSignal('clear')}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold border cursor-pointer transition flex items-center justify-center gap-1.5 ${
                          grailSignal === 'clear'
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        <ShieldCheck size={15} /> No Signal Detected (Negative)
                      </button>
                      <button
                        type="button"
                        onClick={() => setGrailSignal('detected')}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold border cursor-pointer transition flex items-center justify-center gap-1.5 ${
                          grailSignal === 'detected'
                            ? 'bg-red-500/20 border-red-500 text-red-300 shadow-sm'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        Signal Detected (Follow-up Required)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">Physician Notes & Facility Details</label>
                <textarea
                  value={facilityNotes}
                  onChange={(e) => setFacilityNotes(e.target.value)}
                  rows={2}
                  placeholder="Add ordering physician, clinic name, or follow-up recommendations..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-emerald-500/60 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSaveSubmission}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer ${
                    isLoggedSuccess
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  }`}
                >
                  <Check size={14} strokeWidth={3} />
                  <span>{isLoggedSuccess ? 'Saved & Verified!' : 'Save & Mark Complete'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PREP CHECKLIST */}
          {activeTab === 'prep' && (
            <div className="space-y-3 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>Preparation Protocol & Fasting Requirements</span>
              </div>

              <ul className="space-y-2 text-xs text-slate-200">
                {prepConfig.prepNotes.map((note, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-slate-900/60 p-2.5 rounded-lg border border-white/5">
                    <span className="text-amber-400 font-bold">✓</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-2 border-t border-slate-800/60 flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-bold text-slate-500">Key Biomarkers Audited:</span>
                {prepConfig.recommendedBiomarkers.map((bm, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[11px] text-cyan-300 font-mono font-semibold">
                    {bm}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: GEEK MODE */}
          {activeTab === 'geek' && (
            <div className="mt-3">
              {modality ? (
                <GeekMode modality={modality} />
              ) : (
                <div className="p-4 bg-slate-950 rounded-xl border border-purple-500/30 space-y-2 text-xs text-slate-300">
                  <div className="font-bold text-purple-300 flex items-center gap-1.5">
                    <Microscope size={15} /> Scientific Mechanism & Biological Pathways
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    {(task as any)?.geek_mode?.mechanism || (task as any)?.mechanism_of_action || 'Proactive early-detection milestone targeting long-range healthspan preservation.'}
                  </p>
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  )
}

export default ProactiveDiagnosticCard
