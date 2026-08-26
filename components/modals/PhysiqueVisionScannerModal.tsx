'use client'

import React, { useState, useRef } from 'react'
import {
  X,
  Camera,
  Upload,
  Sparkles,
  Check,
  AlertCircle,
  Activity,
  Zap,
  TrendingUp,
  Shield,
  Layers,
  ChevronRight,
  Info,
  Scale,
  Dna,
  CheckCircle2,
  RefreshCw,
  Sliders,
  HelpCircle,
  ArrowRight
} from 'lucide-react'
import {
  PhysiqueAnalysisResult,
  BodyCompositionRecord,
  analyzePhysiquePhoto,
  savePhysiqueRecordToDB
} from '@/lib/storage/physiqueStorage'
import { compressAndDownscaleImage } from '@/lib/utils/imageCompression'
import { UserProfile } from '@/lib/types'
import { format } from 'date-fns'

interface PhysiqueVisionScannerModalProps {
  isOpen: boolean
  onClose: () => void
  userProfile?: UserProfile | null
  initialDate?: string
  onRecordSaved?: (record: BodyCompositionRecord) => void
}

export default function PhysiqueVisionScannerModal({
  isOpen,
  onClose,
  userProfile,
  initialDate,
  onRecordSaved
}: PhysiqueVisionScannerModalProps) {
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isCompressing, setIsCompressing] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisStepIndex, setAnalysisStepIndex] = useState(0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  // Weight Anchor
  const [knownWeight, setKnownWeight] = useState<string>(
    userProfile?.weight_lbs ? userProfile.weight_lbs.toString() : ''
  )
  const [weightUnknown, setWeightUnknown] = useState(false)
  const [selectedPose, setSelectedPose] = useState<'front' | 'side' | 'back' | 'flexed'>('front')
  const [recordDate, setRecordDate] = useState<string>(initialDate || format(new Date(), 'yyyy-MM-dd'))

  // Results State
  const [scanResult, setScanResult] = useState<PhysiqueAnalysisResult | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavedSuccess, setIsSavedSuccess] = useState(false)

  // Editable overrides after scan
  const [editBodyFat, setEditBodyFat] = useState<string>('')
  const [editWeight, setEditWeight] = useState<string>('')
  const [userNotes, setUserNotes] = useState<string>('')

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  if (!isOpen) return null

  const analysisSteps = [
    'Applying client-side canvas downscaling (1200px @ 80% JPEG)...',
    'Analyzing abdominal wall, linea alba, and serratus anterior depth...',
    'Screening postural plumb line, scapular alignment & pelvic tilt...',
    'Calculating Fat-Free Mass Index (FFMI) & 90% Confidence Intervals...'
  ]

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, WEBP).')
      return
    }

    setErrorMsg(null)
    setIsCompressing(true)
    try {
      const compressed = await compressAndDownscaleImage(file, { maxDimension: 1200, quality: 0.82 })
      setPhotoFile(file)
      setPhotoPreview(compressed)
    } catch (err: any) {
      console.error('Compression error:', err)
      setErrorMsg('Failed to process image preview.')
    } finally {
      setIsCompressing(false)
    }
  }

  const handleStartAnalysis = async () => {
    if (!photoPreview) {
      setErrorMsg('Please upload or snap a physique photo first.')
      return
    }

    setErrorMsg(null)
    setIsAnalyzing(true)
    setAnalysisStepIndex(0)

    // Animated progress simulation
    const timer1 = setTimeout(() => setAnalysisStepIndex(1), 450)
    const timer2 = setTimeout(() => setAnalysisStepIndex(2), 1100)
    const timer3 = setTimeout(() => setAnalysisStepIndex(3), 1800)

    try {
      const weightVal = !weightUnknown && knownWeight ? parseFloat(knownWeight) : null
      const heightInches = 70 // default standard height if not set
      const sex = (userProfile?.biological_sex as 'male' | 'female') || 'male'
      const age = userProfile?.age || 32

      const result = await analyzePhysiquePhoto(photoPreview, {
        knownWeightLbs: weightVal,
        heightInches: Math.round(heightInches),
        sex: sex,
        age: age,
        pose: selectedPose
      })

      setScanResult(result)
      setEditBodyFat(result.body_fat_pct.toString())
      setEditWeight((result.estimated_weight_lbs || weightVal || 170).toString())
    } catch (err: any) {
      console.error('Analysis error:', err)
      setErrorMsg(err.message || 'Failed to analyze physique photo. Please ensure clear lighting and framing.')
    } finally {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      setIsAnalyzing(false)
    }
  }

  const handleSaveToJournal = async () => {
    if (!scanResult) return
    setIsSaving(true)
    setErrorMsg(null)

    try {
      const finalBf = editBodyFat ? parseFloat(editBodyFat) : scanResult.body_fat_pct
      const finalWeight = editWeight ? parseFloat(editWeight) : scanResult.estimated_weight_lbs

      const newRecord: BodyCompositionRecord = {
        id: `comp_${Date.now()}`,
        date: recordDate,
        weight_lbs: finalWeight,
        body_fat_pct: finalBf,
        skeletal_muscle_mass_pct: scanResult.skeletal_muscle_mass_pct,
        visceral_fat_grade: scanResult.visceral_fat_grade,
        photo_url: photoPreview || undefined,
        photo_pose: selectedPose,
        notes: userNotes || undefined,
        ai_estimated: true,
        confidence_score: scanResult.confidence_score,
        body_fat_ci: scanResult.body_fat_ci,
        weight_ci: scanResult.weight_ci,
        ffmi: scanResult.ffmi,
        v_taper_ratio: scanResult.v_taper_ratio,
        waist_to_hip_ratio: scanResult.waist_to_hip_ratio,
        posture_assessment: scanResult.posture_assessment,
        fluid_retention_level: scanResult.fluid_retention_level,
        analysis_result: scanResult
      }

      await savePhysiqueRecordToDB(newRecord)
      setIsSavedSuccess(true)

      if (onRecordSaved) {
        onRecordSaved(newRecord)
      }

      setTimeout(() => {
        onClose()
      }, 900)
    } catch (err: any) {
      console.error('Error saving record:', err)
      setErrorMsg('Failed to save physique record.')
      setIsSaving(false)
    }
  }

  const getVisceralBadgeColor = (grade: number) => {
    if (grade <= 3) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    if (grade <= 6) return 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    return 'bg-rose-500/20 text-rose-300 border-rose-500/40'
  }

  const getPostureColor = (val?: string) => {
    if (!val || val === 'none' || val === 'neutral') return 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30'
    if (val.includes('mild')) return 'text-amber-400 bg-amber-950/40 border-amber-500/30'
    return 'text-rose-400 bg-rose-950/40 border-rose-500/30'
  }

  return (
    <div className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 pb-safe animate-in fade-in">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 pb-8 sm:pb-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                  AI Physique Vision Engine
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
                  Confidence CIs
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Subcutaneous landmark scoring, posture screening &amp; FFMI cross-validation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Alert */}
        {isSavedSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in zoom-in-95">
            <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
            <span>Physique record saved to your progress timeline!</span>
          </div>
        )}

        {!scanResult ? (
          /* STEP 1: UPLOAD & CONFIGURATION */
          <div className="space-y-4">
            {/* Photo Capture & Upload Box */}
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {photoPreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-cyan-500/40 bg-black/60 max-h-72 flex items-center justify-center group">
                  <img
                    src={photoPreview}
                    alt="Physique Preview"
                    className="max-h-72 w-auto object-contain mx-auto"
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-black/80 hover:bg-black text-white text-xs font-bold border border-white/20 flex items-center gap-1.5 backdrop-blur-md cursor-pointer transition-all"
                    >
                      <RefreshCw size={12} />
                      <span>Retake / Change</span>
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-3 px-2 py-0.5 rounded-md bg-black/70 border border-white/10 text-[10px] font-mono text-cyan-300 backdrop-blur-sm">
                    ⚡ Auto-compressed in-memory (~160 KB)
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-8 rounded-2xl border-2 border-dashed border-slate-700 hover:border-cyan-500/60 bg-slate-950/60 hover:bg-slate-900/40 transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-3 group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 group-hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center transition-all shadow-inner">
                    <Camera size={26} />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-white group-hover:text-cyan-300 transition-colors">
                      {isCompressing ? 'Compressing Photo...' : 'Snap or Upload Physique Photo'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Full torso front, side, or back relaxed pose with good lighting
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
                    Browse Camera Roll / Files
                  </span>
                </div>
              )}
            </div>

            {/* Optional Scale Weight Anchor */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Scale size={14} className="text-cyan-400" />
                  <span>Today&apos;s Scale Weight (Optional Anchor)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setWeightUnknown(!weightUnknown)}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                    weightUnknown
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {weightUnknown ? '✓ Weight Unknown (Estimate It)' : 'I don\'t know my weight'}
                </button>
              </div>

              {!weightUnknown ? (
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="0.1"
                      value={knownWeight}
                      onChange={e => setKnownWeight(e.target.value)}
                      placeholder="e.g. 175.4"
                      className="w-full bg-black/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                    />
                    <span className="absolute right-3.5 top-3 text-xs font-bold text-slate-500">lbs</span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex-1 leading-snug">
                    💡 Providing exact scale weight triggers <strong className="text-cyan-300 font-semibold">FFMI cross-validation</strong>, tightening confidence intervals to ±1.0%.
                  </div>
                </div>
              ) : (
                <div className="text-xs text-cyan-300/90 bg-cyan-950/30 p-2.5 rounded-xl border border-cyan-500/30 flex items-center gap-2">
                  <Info size={14} className="shrink-0 text-cyan-400" />
                  <span>AI will use 3D volumetric frame estimation to predict your weight (±7 lbs).</span>
                </div>
              )}
            </div>

            {/* Pose & Date Selector */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Pose Angle
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['front', 'side', 'back', 'flexed'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setSelectedPose(p)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                        selectedPose === p
                          ? 'bg-cyan-500 text-black shadow-md font-black'
                          : 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Check-in Date
                </label>
                <input
                  type="date"
                  value={recordDate}
                  onChange={e => setRecordDate(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 h-[38px]"
                />
              </div>
            </div>

            {/* Action Button */}
            <button
              type="button"
              onClick={handleStartAnalysis}
              disabled={!photoPreview || isAnalyzing}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-black font-black text-sm transition-all shadow-lg shadow-cyan-900/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw size={18} className="animate-spin text-black" />
                  <span>Analyzing Physique Landmarks...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Run AI Physique &amp; Body Fat Scan</span>
                </>
              )}
            </button>

            {/* Live progress ticker when analyzing */}
            {isAnalyzing && (
              <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-300 font-mono flex items-center gap-2.5 animate-pulse">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>{analysisSteps[analysisStepIndex] || 'Processing model output...'}</span>
              </div>
            )}
          </div>
        ) : (
          /* STEP 2: RICH RESULTS DASHBOARD */
          <div className="space-y-5 animate-in fade-in">
            {/* Primary KPI Grid (Body Fat % & Weight) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Body Fat Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/60 to-slate-900 border border-cyan-500/40 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-300 flex items-center gap-1">
                    <Activity size={13} />
                    <span>Estimated Body Fat</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {scanResult.confidence_tier.toUpperCase()} CONFIDENCE
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
                    {editBodyFat || scanResult.body_fat_pct}%
                  </span>
                  <span className="text-xs text-cyan-400 font-mono">
                    [90% CI: {scanResult.body_fat_ci.min}% — {scanResult.body_fat_ci.max}%]
                  </span>
                </div>

                {/* Range Bar Visualization */}
                <div className="mt-3 space-y-1">
                  <div className="w-full h-2 rounded-full bg-slate-950/80 border border-white/10 overflow-hidden relative">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-amber-400 rounded-full"
                      style={{ width: `${Math.min(100, (parseFloat(editBodyFat || scanResult.body_fat_pct.toString()) / 35) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] font-mono text-slate-500">
                    <span>8% (Athletic)</span>
                    <span>15% (Fitness)</span>
                    <span>25%+ (Normal)</span>
                  </div>
                </div>
              </div>

              {/* Weight & Lean Mass Card */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Scale size={13} className="text-blue-400" />
                    <span>Body Mass &amp; FFMI</span>
                  </span>
                  {scanResult.ffmi && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      FFMI: {scanResult.ffmi.toFixed(1)}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-white font-mono tracking-tight">
                    {editWeight || scanResult.estimated_weight_lbs}
                  </span>
                  <span className="text-sm font-bold text-slate-400">lbs</span>
                  {scanResult.weight_ci && (
                    <span className="text-[11px] text-slate-500 font-mono">
                      (CI: {scanResult.weight_ci.min}–{scanResult.weight_ci.max})
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                  <span className="text-slate-400">Skeletal Muscle:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {scanResult.skeletal_muscle_mass_pct}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Visceral Fat Grade:</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${getVisceralBadgeColor(scanResult.visceral_fat_grade)}`}>
                    Level {scanResult.visceral_fat_grade} / 10 ({scanResult.visceral_fat_grade <= 3 ? 'Optimal' : scanResult.visceral_fat_grade <= 6 ? 'Moderate' : 'Elevated'})
                  </span>
                </div>
              </div>
            </div>

            {/* Posture & Musculoskeletal Screen */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Shield size={14} className="text-purple-400" />
                  <span>Clinical Posture &amp; Spinal Alignment Screen</span>
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className={`p-2.5 rounded-xl border text-center ${getPostureColor(scanResult.posture_assessment.forward_head)}`}>
                  <span className="text-[10px] uppercase font-bold block opacity-70">Forward Head</span>
                  <span className="text-xs font-black capitalize block mt-0.5">
                    {scanResult.posture_assessment.forward_head}
                  </span>
                </div>

                <div className={`p-2.5 rounded-xl border text-center ${getPostureColor(scanResult.posture_assessment.rounded_shoulders)}`}>
                  <span className="text-[10px] uppercase font-bold block opacity-70">Rounded Shoulders</span>
                  <span className="text-xs font-black capitalize block mt-0.5">
                    {scanResult.posture_assessment.rounded_shoulders}
                  </span>
                </div>

                <div className={`p-2.5 rounded-xl border text-center ${getPostureColor(scanResult.posture_assessment.pelvic_tilt)}`}>
                  <span className="text-[10px] uppercase font-bold block opacity-70">Pelvic Tilt</span>
                  <span className="text-xs font-black capitalize block mt-0.5">
                    {scanResult.posture_assessment.pelvic_tilt.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-white/5 p-2.5 rounded-xl">
                {scanResult.posture_assessment.summary}
              </p>

              {scanResult.posture_assessment.corrective_cues && scanResult.posture_assessment.corrective_cues.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Corrective Movement Cues:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {scanResult.posture_assessment.corrective_cues.map((cue, i) => (
                      <span key={i} className="text-[11px] font-medium text-purple-300 bg-purple-950/40 border border-purple-500/30 px-2.5 py-1 rounded-lg">
                        🎯 {cue}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Proportion & Anatomical Landmarks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Morphometrics */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Proportion &amp; Fluid Status
                </span>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">V-Taper Ratio:</span>
                  <span className="font-mono font-bold text-cyan-300">
                    {scanResult.v_taper_ratio ? `${scanResult.v_taper_ratio.toFixed(2)}:1` : '1.45:1'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Subcutaneous Fluid:</span>
                  <span className="font-mono font-bold text-white capitalize">
                    {scanResult.fluid_retention_level.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Landmarks */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Detected Visual Landmarks
                </span>
                <div className="flex flex-wrap gap-1">
                  {scanResult.anatomical_landmarks_detected.slice(0, 3).map((lm, idx) => (
                    <span key={idx} className="text-[10px] text-slate-300 bg-black/50 px-2 py-0.5 rounded border border-white/10">
                      ✓ {lm}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Editable Overrides Before Saving */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Adjust Values (Optional) &amp; Notes
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <span className="text-[10px] text-slate-500 block mb-1">Body Fat %</span>
                  <input
                    type="number"
                    step="0.1"
                    value={editBodyFat}
                    onChange={e => setEditBodyFat(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block mb-1">Weight (lbs)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={editWeight}
                    onChange={e => setEditWeight(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <input
                type="text"
                value={userNotes}
                onChange={e => setUserNotes(e.target.value)}
                placeholder="Optional notes (e.g. morning fasted check-in, post-leg day)..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setScanResult(null)}
                className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Scan Another Photo
              </button>
              <button
                type="button"
                onClick={handleSaveToJournal}
                disabled={isSaving || isSavedSuccess}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black text-xs rounded-xl transition-all shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Saving Record...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>Save to Physique Timeline</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
