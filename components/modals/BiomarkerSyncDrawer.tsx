'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Activity,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Upload,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Clock,
  Shield,
  HeartPulse,
  Zap,
  Flame,
  Dumbbell,
  FileText,
  Sliders,
  Check
} from 'lucide-react'
import { getLatestBiomarkerMeasurements, saveLabPanel, getUserLabPanels } from '@/lib/data/bloodworkData'
import { BiomarkerMeasurementRecord } from '@/lib/aging-models/bioAgeTypes'
import { BIOMARKER_REGISTRY } from '@/lib/aging-models/biomarkerRegistry'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import {
  KEY_BIOMARKER_IDS,
  SAMPLE_DIAGNOSTIC_BASELINE,
  evaluateBiomarkerCalibration,
  VECTOR_BIOMARKER_MAP
} from '@/lib/outcomes/biomarkerFeedbackEngine'
import LabUploadModal from './LabUploadModal'

interface BiomarkerSyncDrawerProps {
  isOpen: boolean
  onClose: () => void
  userId?: string
  highlightBiomarkerId?: string
  onSaved?: () => void
}

export const BiomarkerSyncDrawer: React.FC<BiomarkerSyncDrawerProps> = ({
  isOpen,
  onClose,
  userId: propUserId,
  highlightBiomarkerId,
  onSaved
}) => {
  const [activeUserId, setActiveUserId] = useState<string>('')
  const [measurements, setMeasurements] = useState<BiomarkerMeasurementRecord[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false)
  const [showSecondaryMarkers, setShowSecondaryMarkers] = useState<boolean>(false)

  // Form input state: biomarkerId -> { value: string; unit: string }
  const [formValues, setFormValues] = useState<Record<string, { value: string; unit: string }>>({})

  // Resolve user ID
  useEffect(() => {
    const uid = propUserId || getLocalUserId()
    setActiveUserId(uid)
  }, [propUserId])

  // Load latest measurements for user
  const loadData = async (uid: string) => {
    if (!uid) return
    setIsLoading(true)
    try {
      const latest = await getLatestBiomarkerMeasurements(uid)
      setMeasurements(latest)

      // Initialize form values from recorded measurements
      const initialForm: Record<string, { value: string; unit: string }> = {}
      latest.forEach(m => {
        initialForm[m.biomarker_id] = {
          value: m.normalized_value !== undefined && m.normalized_value !== null ? String(m.normalized_value) : '',
          unit: m.normalized_unit || m.raw_unit || ''
        }
      })
      setFormValues(prev => ({ ...initialForm, ...prev }))
    } catch (err) {
      console.warn('Error loading biomarker measurements:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && activeUserId) {
      loadData(activeUserId)
      setSaveSuccess(false)
    }
  }, [isOpen, activeUserId])

  // Listen for external updates
  useEffect(() => {
    const handleUpdate = () => {
      if (activeUserId) {
        loadData(activeUserId)
      }
    }
    window.addEventListener('levl_biomarkers_updated', handleUpdate)
    window.addEventListener('levl_lab_panels_updated', handleUpdate)
    return () => {
      window.removeEventListener('levl_biomarkers_updated', handleUpdate)
      window.removeEventListener('levl_lab_panels_updated', handleUpdate)
    }
  }, [activeUserId])

  const handleInputChange = (id: string, valStr: string) => {
    setFormValues(prev => ({
      ...prev,
      [id]: {
        value: valStr,
        unit: prev[id]?.unit || BIOMARKER_REGISTRY[id]?.primary_unit || ''
      }
    }))
  }

  // Pre-populate with realistic baseline demo values
  const handleLoadSampleBaseline = () => {
    const sampleForm: Record<string, { value: string; unit: string }> = {}
    Object.entries(SAMPLE_DIAGNOSTIC_BASELINE).forEach(([id, item]) => {
      sampleForm[id] = {
        value: String(item.value),
        unit: item.unit
      }
    })
    setFormValues(prev => ({ ...prev, ...sampleForm }))
  }

  // Save changes to localStorage and Cloud Supabase
  const handleSaveAndCalibrate = async () => {
    if (!activeUserId) return
    setIsSaving(true)
    setSaveSuccess(false)

    try {
      const today = new Date().toISOString().split('T')[0]
      const validEntries: Array<{
        raw_name: string
        raw_value: number
        raw_unit: string
        normalized_value: number
        normalized_unit: string
        biomarker_id: string
        lab_flag?: 'normal' | 'high' | 'low' | 'critical'
      }> = []

      // Compile non-empty entries
      Object.entries(formValues).forEach(([id, entry]) => {
        const num = parseFloat(entry.value)
        if (!isNaN(num)) {
          const def = BIOMARKER_REGISTRY[id]
          const unit = entry.unit || def?.primary_unit || ''
          validEntries.push({
            biomarker_id: id,
            raw_name: def?.name || id,
            raw_value: num,
            raw_unit: unit,
            normalized_value: num,
            normalized_unit: unit,
            lab_flag: 'normal'
          })
        }
      })

      if (validEntries.length > 0) {
        await saveLabPanel(
          activeUserId,
          today,
          'Manual Diagnostic Entry & Calibration',
          ['manual_lab_entry'],
          validEntries
        )

        // Dispatch reactive events for live UI re-computation across the app
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('levl_biomarkers_updated'))
          window.dispatchEvent(new CustomEvent('levl_lab_panels_updated'))
        }
      }

      setSaveSuccess(true)
      await loadData(activeUserId)

      if (onSaved) {
        onSaved()
      }

      setTimeout(() => {
        setSaveSuccess(false)
      }, 3000)
    } catch (err) {
      console.error('Error saving biomarkers:', err)
      alert('Failed to save biomarker measurements. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // Evaluate each biomarker status
  const keyMarkersWithStatus = useMemo(() => {
    return KEY_BIOMARKER_IDS.map(id => {
      const userRecord = measurements.find(m => m.biomarker_id === id)
      const formEntry = formValues[id]
      const formNum = formEntry?.value ? parseFloat(formEntry.value) : null

      // If user typed a value, use it for live reactive preview
      const activeRecord: BiomarkerMeasurementRecord | undefined = formNum !== null && !isNaN(formNum)
        ? {
            biomarker_id: id,
            user_id: activeUserId,
            raw_name: BIOMARKER_REGISTRY[id]?.name || id,
            raw_value: formNum,
            raw_unit: formEntry?.unit || BIOMARKER_REGISTRY[id]?.primary_unit || '',
            normalized_value: formNum,
            normalized_unit: formEntry?.unit || BIOMARKER_REGISTRY[id]?.primary_unit || '',
            collection_date: userRecord?.collection_date || new Date().toISOString().split('T')[0]
          }
        : userRecord

      const feedback = evaluateBiomarkerCalibration(id, activeRecord, 85, 'Protocol')
      const isHighlighted = highlightBiomarkerId === id

      return {
        id,
        feedback,
        isHighlighted,
        userRecord
      }
    })
  }, [measurements, formValues, activeUserId, highlightBiomarkerId])

  // Secondary biomarkers (Homocysteine, Vitamin D, Glucose, HbA1c, Triglycerides)
  const secondaryMarkerIds = ['homocysteine', 'vitamin_d', 'glucose', 'hba1c', 'triglycerides', 'ferritin']

  if (!isOpen) return null

  const drawerContent = (
    <div className="fixed inset-0 z-[90] flex justify-end bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Background click dismiss */}
      <div className="flex-1 cursor-pointer" onClick={onClose} />

      {/* Slide-Over Drawer Container */}
      <div className="relative w-full max-w-xl h-full bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
        
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* 1. Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-900/60 shrink-0 relative">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0 shadow-lg">
                <Activity size={20} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                  <span>Biomarker Feedback &amp; Lab Sync</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/50">
                    Live
                  </span>
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                  Connect real-world bloodwork directly to 80/20 Dialed-In scoring.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer shrink-0"
              aria-label="Close Drawer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Action Pills: Load Demo Baseline + Upload Lab PDF */}
          <div className="mt-3.5 flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleLoadSampleBaseline}
              className="px-2.5 py-1 rounded-lg bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/30 text-purple-300 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Fill realistic sample lab panel for immediate demonstration"
            >
              <Sparkles size={12} className="text-purple-400" />
              <span>Load Demo Baseline</span>
            </button>

            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-cyan-300 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Upload size={12} className="text-cyan-400" />
              <span>Upload Lab PDF (AI OCR)</span>
            </button>
          </div>
        </div>

        {/* 2. Success Banner */}
        {saveSuccess && (
          <div className="px-4 py-2.5 bg-emerald-950/80 border-b border-emerald-500/40 flex items-center gap-2 text-emerald-200 text-xs font-bold animate-in fade-in shrink-0">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>Biomarkers saved! 80/20 outcome curves and predictions successfully recalibrated.</span>
          </div>
        )}

        {/* 3. Biomarker List Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          
          <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider font-bold">
              The 8 Canonical Healthspan Biomarkers
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              Optimal targets calibrated by clinical literature
            </span>
          </div>

          {/* Canonical 8 Biomarkers */}
          {keyMarkersWithStatus.map(({ id, feedback, isHighlighted, userRecord }) => {
            const currentInputVal = formValues[id]?.value ?? ''
            const hasInputValue = currentInputVal.trim() !== ''

            return (
              <div
                key={id}
                className={`p-3.5 rounded-2xl transition-all border ${
                  isHighlighted
                    ? 'bg-cyan-950/30 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                    : 'bg-slate-900/60 border-slate-800/90 hover:border-slate-700'
                }`}
              >
                {/* Marker Header: Name, Target, and Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-white text-xs sm:text-sm">
                        {feedback.shortName}
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${feedback.statusColor.badgeBg} ${feedback.statusColor.badgeBorder} ${feedback.statusColor.badgeText}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${feedback.statusColor.dotColor}`} />
                        <span>{feedback.statusLabel}</span>
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-0.5 leading-normal line-clamp-1">
                      Target: <strong className="text-cyan-300 font-mono">{feedback.clinicalTargetDisplay}</strong>
                    </p>
                  </div>

                  {/* Inline Numeric Input */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        placeholder="Log value"
                        value={currentInputVal}
                        onChange={(e) => handleInputChange(id, e.target.value)}
                        className="w-24 sm:w-28 px-2.5 py-1.5 text-right font-mono text-xs sm:text-sm font-bold bg-black/70 border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                      />
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 shrink-0 w-16 truncate">
                      {feedback.unit}
                    </span>
                  </div>
                </div>

                {/* Calibrated Predictive Shift Statement */}
                {feedback.currentValue !== null && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-slate-950/70 border border-white/5 text-[11px] text-slate-300 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1 font-bold">
                        <TrendingUp size={11} className="text-cyan-400" />
                        80/20 Calibrated Projection
                      </span>
                      {userRecord?.collection_date && (
                        <span className="text-[9px] font-mono text-slate-500 flex items-center gap-1">
                          <Clock size={9} />
                          {userRecord.collection_date}
                        </span>
                      )}
                    </div>
                    <p className="text-cyan-200/90 leading-relaxed font-medium">
                      {feedback.calibrationText}
                    </p>
                  </div>
                )}
              </div>
            )
          })}

          {/* Toggle for Secondary Lab Biomarkers */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowSecondaryMarkers(!showSecondaryMarkers)}
              className="text-xs font-bold text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer select-none"
            >
              <Sliders size={13} className="text-purple-400" />
              <span>{showSecondaryMarkers ? 'Hide' : 'Show'} Secondary Diagnostic Panels (Homocysteine, Vitamin D, Glucose, etc.)</span>
            </button>
          </div>

          {showSecondaryMarkers && (
            <div className="space-y-3 pt-1 animate-in fade-in duration-200">
              {secondaryMarkerIds.map(id => {
                const def = BIOMARKER_REGISTRY[id]
                if (!def) return null
                const userRecord = measurements.find(m => m.biomarker_id === id)
                const currentInputVal = formValues[id]?.value ?? (userRecord?.normalized_value ? String(userRecord.normalized_value) : '')

                return (
                  <div
                    key={id}
                    className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800 flex items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-extrabold text-white text-xs block">
                        {def.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        Target: {def.levl_optimal_zone.display}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="number"
                        step="any"
                        placeholder="Log value"
                        value={currentInputVal}
                        onChange={(e) => handleInputChange(id, e.target.value)}
                        className="w-24 px-2.5 py-1 text-right font-mono text-xs font-bold bg-black/60 border border-slate-700 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-all"
                      />
                      <span className="text-[10px] font-mono text-slate-400 w-14 truncate">
                        {def.primary_unit}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

        </div>

        {/* 4. Drawer Footer: Save & Recalibrate */}
        <div className="p-4 sm:p-5 border-t border-slate-800/80 bg-slate-900/80 shrink-0 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveAndCalibrate}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-cyan-950/50 flex items-center gap-2 cursor-pointer active:scale-95 transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Saving &amp; Calibrating...</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check size={14} className="text-emerald-300" />
                <span>Calibrated!</span>
              </>
            ) : (
              <>
                <Sparkles size={14} className="text-cyan-200" />
                <span>Save &amp; Recalibrate 80/20</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* AI OCR Full PDF Upload Modal */}
      {isUploadModalOpen && (
        <LabUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          userId={activeUserId}
          onSaved={() => {
            setIsUploadModalOpen(false)
            loadData(activeUserId)
            if (onSaved) onSaved()
          }}
        />
      )}
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(drawerContent, document.body)
}

export default BiomarkerSyncDrawer
