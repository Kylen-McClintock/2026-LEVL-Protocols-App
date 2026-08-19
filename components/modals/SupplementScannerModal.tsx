'use client'

import React, { useState, useRef } from 'react'
import { 
  X, Camera, Upload, Sparkles, CheckCircle2, AlertCircle, 
  RefreshCw, Layers, Check, Clock, Edit2, Sliders, Pill, 
  ArrowRight, ShieldCheck, HelpCircle, ChevronRight, Zap
} from 'lucide-react'
import { 
  scanSupplementImage, 
  applyScannedSupplementToUser, 
  SupplementScanResult, 
  ScannedIngredient 
} from '@/lib/supplements/supplementIngestionEngine'
import { Modality } from '@/lib/types'

interface SupplementScannerModalProps {
  isOpen: boolean
  onClose: () => void
  catalogModalities?: Modality[]
  onIngestSuccess?: (result: {
    mode: 'single_matched' | 'custom_combination'
    modalityName: string
    dosage: string
    timingSlot: string
  }) => void
}

const TIMING_SLOT_OPTIONS = [
  { id: 'morning_supplement_stack', label: 'Morning Supplement Stack (Waking)', icon: '🌅' },
  { id: 'first_meal', label: 'First Meal / Breakfast (Fat-Soluble)', icon: '🥑' },
  { id: 'midday', label: 'Midday / Lunch Focus', icon: '☀️' },
  { id: 'pre_workout_stack', label: 'Pre-Workout Stack (30–45m before)', icon: '⚡' },
  { id: 'evening_routine', label: 'Evening Routine / Dinner', icon: '🌆' },
  { id: 'bedtime', label: 'Bedtime / Wind-Down (Deep Sleep)', icon: '🌙' },
  { id: 'anytime', label: 'Anytime / As Needed', icon: '🕒' }
]

export default function SupplementScannerModal({
  isOpen,
  onClose,
  catalogModalities = [],
  onIngestSuccess
}: SupplementScannerModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const cameraInputRef = useRef<HTMLInputElement | null>(null)

  const [step, setStep] = useState<'upload' | 'scanning' | 'review' | 'success'>('upload')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [scanResult, setScanResult] = useState<SupplementScanResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // User calibration states
  const [customProductName, setCustomProductName] = useState('')
  const [customDosage, setCustomDosage] = useState('')
  const [selectedTimingSlot, setSelectedTimingSlot] = useState('morning_supplement_stack')
  const [scheduleToday, setScheduleToday] = useState(true)
  const [matchedModalityId, setMatchedModalityId] = useState<string | null>(null)
  const [isCombination, setIsCombination] = useState(false)
  const [ingredients, setIngredients] = useState<ScannedIngredient[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [ingestedSummary, setIngestedSummary] = useState<{
    mode: 'single_matched' | 'custom_combination'
    modalityName: string
    dosage: string
    timingSlot: string
  } | null>(null)

  if (!isOpen) return null

  const handleFileSelected = async (file: File) => {
    try {
      setErrorMsg(null)
      const previewUrl = URL.createObjectURL(file)
      setImagePreview(previewUrl)
      setStep('scanning')

      const result = await scanSupplementImage(file)
      setScanResult(result)

      // Initialize form fields with AI extracted data
      setCustomProductName(result.product_name || 'My Supplement')
      setCustomDosage(result.dosage_summary || result.serving_size || '1 Serving')
      setSelectedTimingSlot(result.suggested_timing_slot || 'morning_supplement_stack')
      setIsCombination(result.is_combination)
      setMatchedModalityId(result.matched_catalog_modality_id || null)
      setIngredients(result.ingredients || [])

      setStep('review')
    } catch (err: any) {
      console.error('Scan error:', err)
      setErrorMsg(err.message || 'Failed to scan supplement facts label. Please ensure the text is well-lit and clear.')
      setStep('upload')
    }
  }

  const handleSaveSupplement = async () => {
    if (!scanResult) return
    setIsSaving(true)
    setErrorMsg(null)

    try {
      const result = await applyScannedSupplementToUser(
        {
          ...scanResult,
          product_name: customProductName,
          dosage_summary: customDosage,
          is_combination: isCombination,
          ingredients
        },
        {
          customDose: customDosage,
          customTimingSlot: selectedTimingSlot,
          scheduleToday,
          overrideModalityId: isCombination ? null : matchedModalityId
        }
      )

      setIngestedSummary(result)
      setStep('success')

      if (onIngestSuccess) {
        onIngestSuccess(result)
      }
    } catch (err: any) {
      console.error('Ingest error:', err)
      setErrorMsg(err.message || 'Failed to save supplement to your protocol stack.')
    } finally {
      setIsSaving(false)
    }
  }

  const resetAll = () => {
    setStep('upload')
    setImagePreview(null)
    setScanResult(null)
    setErrorMsg(null)
    setIngestedSummary(null)
  }

  const handleClose = () => {
    resetAll()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-950/95 border border-purple-500/30 shadow-2xl text-white overflow-hidden">
        
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between shrink-0 bg-slate-900/60 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 border border-purple-400/40 flex items-center justify-center text-white shadow-md">
              <Camera size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  AI Supplement Facts Scanner
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Gemini Vision
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Snap or upload any supplement label for instant dosage &amp; ingredient breakdown.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-slate-200">
          
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle size={16} className="shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: UPLOAD / CAMERA PROMPT */}
          {step === 'upload' && (
            <div className="space-y-6 text-center py-4">
              {/* Hidden File Inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileSelected(e.target.files[0])
                }}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileSelected(e.target.files[0])
                }}
              />

              {/* Central Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="p-5 rounded-2xl bg-gradient-to-b from-purple-900/60 to-slate-900 border border-purple-500/40 hover:border-purple-400 hover:scale-[1.02] active:scale-95 transition-all text-center space-y-2.5 cursor-pointer shadow-lg group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/30 text-purple-300 flex items-center justify-center mx-auto group-hover:bg-purple-500/30 transition-colors">
                    <Camera size={24} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white">Take Bottle Photo</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Use camera on your phone or laptop</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 hover:border-white/20 hover:bg-slate-800/80 hover:scale-[1.02] active:scale-95 transition-all text-center space-y-2.5 cursor-pointer shadow group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center mx-auto group-hover:bg-white/10 transition-colors">
                    <Upload size={22} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white">Upload Image</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Pick photo from your library</p>
                  </div>
                </button>
              </div>

              {/* Best Results Guidance */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 max-w-md mx-auto text-left space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span>How to get 100% accurate scans</span>
                </div>
                <ul className="text-[11px] text-slate-400 space-y-1.5 list-disc list-inside">
                  <li>Hold bottle steady with good lighting on the <strong>Supplement Facts</strong> panel.</li>
                  <li>Single-ingredient products (e.g. Creatine, Magnesium) auto-adjust your dosage.</li>
                  <li>Multi-ingredient complexes (e.g. Sleep Stacks, Multivitamins) create a composite modality with ingredients broken out like DeepCell.</li>
                </ul>
              </div>
            </div>
          )}

          {/* STEP 2: SCANNING / OCR IN PROGRESS */}
          {step === 'scanning' && (
            <div className="py-12 text-center space-y-5">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full border-2 border-purple-500/20 border-t-purple-400 animate-spin" />
                <div className="absolute inset-2 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-300">
                  <Sparkles size={28} className="animate-pulse" />
                </div>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-extrabold text-white">Analyzing Supplement Facts...</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Extracting active ingredients, exact milligram dosages, elemental yields, and circadian timing with Gemini Vision.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW & INGESTION FORM */}
          {step === 'review' && scanResult && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              {/* Top Banner: Single Match vs Combination */}
              <div className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                isCombination 
                  ? 'bg-purple-950/40 border-purple-500/40 text-purple-200' 
                  : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              }`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                  isCombination 
                    ? 'bg-purple-500/20 border-purple-400/30 text-purple-300' 
                    : 'bg-emerald-500/20 border-emerald-400/30 text-emerald-400'
                }`}>
                  {isCombination ? <Layers size={18} /> : <Pill size={18} />}
                </div>

                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-sm text-white">
                      {isCombination ? 'Combination Supplement Complex' : 'Single-Ingredient Match'}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      isCombination 
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' 
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    }`}>
                      {isCombination ? `${ingredients.length} Active Ingredients` : 'Modality Matched'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {isCombination 
                      ? 'Creates a custom composite modality with broken-out sub-ingredients table (identical to LIFESPAN+ DeepCell).'
                      : `Matched to catalog modality. Will update your personalized dosage override.`}
                  </p>
                </div>
              </div>

              {/* Product Name & Brand */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Product / Modality Name
                </label>
                <input
                  type="text"
                  value={customProductName}
                  onChange={(e) => setCustomProductName(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500 font-bold"
                />
              </div>

              {/* Dosage String & Serving Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Dose / Serving Amount
                  </label>
                  <input
                    type="text"
                    value={customDosage}
                    onChange={(e) => setCustomDosage(e.target.value)}
                    placeholder="e.g. 5g (1 scoop) or 400mg"
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Optimal Timing Slot
                  </label>
                  <select
                    value={selectedTimingSlot}
                    onChange={(e) => setSelectedTimingSlot(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    {TIMING_SLOT_OPTIONS.map(opt => (
                      <option key={opt.id} value={opt.id}>
                        {opt.icon} {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Breakdown Table for Ingredients */}
              {ingredients.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers size={13} className="text-purple-400" />
                      <span>Extracted Ingredients Breakdown ({ingredients.length})</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Per {scanResult.serving_size}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-white/10 overflow-hidden bg-black/40">
                    <div className="max-h-48 overflow-y-auto divide-y divide-white/5">
                      {ingredients.map((ing, idx) => (
                        <div key={idx} className="p-2.5 sm:px-3.5 sm:py-2.5 flex items-center justify-between gap-3 text-xs">
                          <div className="min-w-0">
                            <span className="font-bold text-white block truncate">{ing.name}</span>
                            {ing.form && (
                              <span className="text-[10px] text-slate-400 block truncate">{ing.form}</span>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-mono font-bold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">
                              {ing.amount} {ing.unit}
                            </span>
                            {ing.elemental_amount && (
                              <span className="text-[10px] text-emerald-400/90 block font-mono mt-0.5">{ing.elemental_amount}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Add to Today's Routine Checkbox */}
              <label className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex items-center gap-3 cursor-pointer hover:bg-black/60 transition-colors">
                <input
                  type="checkbox"
                  checked={scheduleToday}
                  onChange={(e) => setScheduleToday(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 text-purple-600 focus:ring-purple-500 accent-purple-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-white block">Schedule this supplement in Today's Routine</span>
                  <span className="text-slate-400">Adds an active daily task to your timeline for today.</span>
                </div>
              </label>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetAll}
                  className="px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs rounded-xl transition-all border border-white/10 cursor-pointer"
                >
                  Scan Another Label
                </button>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveSupplement}
                  className="flex-1 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-[0.98] text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Saving to Protocol Stack...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} strokeWidth={3} />
                      <span>Save &amp; Calibrate Protocol</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: SUCCESS CONFIRMATION */}
          {step === 'success' && ingestedSummary && (
            <div className="py-8 text-center space-y-5 animate-in fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <CheckCircle2 size={32} />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-white">Supplement Calibrated Successfully!</h3>
                <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                  <strong>{ingestedSummary.modalityName}</strong> has been calibrated with your exact bottle dosage (<strong>{ingestedSummary.dosage}</strong>).
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-black/50 border border-white/10 text-xs text-left max-w-sm mx-auto space-y-2">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Ingestion Mode:</span>
                  <span className="font-bold text-white capitalize">{ingestedSummary.mode.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Timing Slot:</span>
                  <span className="font-bold text-purple-300">{ingestedSummary.timingSlot.replace(/_/g, ' ')}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={resetAll}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs rounded-xl border border-white/10 cursor-pointer"
                >
                  Scan Next Supplement
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
