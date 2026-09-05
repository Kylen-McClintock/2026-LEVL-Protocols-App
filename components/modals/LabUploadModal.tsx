'use client'

import React, { useState } from 'react'
import { X, Upload, Check, AlertTriangle, FileText, Sparkles, Loader2, CheckCircle2 } from 'lucide-react'
import { saveLabPanel } from '@/lib/data/bloodworkData'
import { compressImageToFile } from '@/lib/utils/imageCompression'

interface LabUploadModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  userProfile?: { chronological_age?: number; sex?: 'male' | 'female' }
  onSaved?: () => void
}

export default function LabUploadModal({
  isOpen,
  onClose,
  userId,
  userProfile = {},
  onSaved
}: LabUploadModalProps) {
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [extractedData, setExtractedData] = useState<{
    collection_date: string
    provider_name: string
    biomarkers: Array<{
      biomarker_id: string
      raw_name: string
      raw_value: number
      raw_unit: string
      normalized_value: number
      normalized_unit: string
      lab_reference_range?: string
      lab_flag?: 'normal' | 'high' | 'low' | 'critical'
      confidence: number
      is_bioage_used: boolean
      needs_review: boolean
    }>
    summary_counts: {
      total_extracted: number
      used_by_bioage: number
      needs_review: number
    }
  } | null>(null)

  if (!isOpen) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleRunAIExtraction = async () => {
    if (files.length === 0) return
    setIsParsing(true)
    setSaveError(null)
    try {
      const formData = new FormData()
      for (const f of files) {
        if (f.type.startsWith('image/')) {
          const compressed = await compressImageToFile(f, { maxDimension: 1200, quality: 0.80 })
          formData.append('files', compressed)
        } else {
          formData.append('files', f)
        }
      }

      const res = await fetch('/api/labs/upload', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()
      if (res.ok) {
        setExtractedData(data)
      } else {
        alert(data.error || 'Failed to extract lab data.')
      }
    } catch (err) {
      console.error('Error uploading labs:', err)
      alert('Error parsing lab document.')
    } finally {
      setIsParsing(false)
    }
  }

  const handleConfirmAll = () => {
    if (!extractedData) return
    const updatedBiomarkers = extractedData.biomarkers.map(b => ({ ...b, needs_review: false }))
    setExtractedData({
      ...extractedData,
      biomarkers: updatedBiomarkers,
      summary_counts: {
        ...extractedData.summary_counts,
        needs_review: 0
      }
    })
  }

  const handleSaveToProfile = async () => {
    if (!extractedData) return
    setIsSaving(true)
    setSaveError(null)
    try {
      await saveLabPanel(
        userId,
        extractedData.collection_date,
        extractedData.provider_name,
        files.map(f => f.name),
        extractedData.biomarkers,
        userProfile
      )
      if (onSaved) onSaved()
      onClose()
    } catch (err: any) {
      console.error('Error saving panel:', err)
      setSaveError(err?.message || 'Failed to save lab panel to profile.')
    } finally {
      setIsSaving(false)
    }
  }

  const reviewItemsCount = extractedData?.biomarkers.filter(b => b.needs_review).length || 0

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
    >
      <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="text-levl-accent" size={22} /> AI Bloodwork & Lab Upload
            </h2>
            <p className="text-xs text-gray-400">Upload PDFs, screenshots, or photos of lab reports for automated BioAge analysis.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Step 1: File Selection */}
        {!extractedData && (
          <div className="space-y-4">
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all bg-black/40 ${
                isDragging 
                  ? 'border-emerald-400 bg-emerald-500/10 scale-[1.01]' 
                  : 'border-white/20 hover:border-levl-accent/50'
              }`}
            >
              <Upload className={`mx-auto mb-3 transition-transform ${isDragging ? 'scale-125 text-emerald-400' : 'text-indigo-400'}`} size={36} />
              <p className="text-sm font-bold text-white mb-1">
                {isDragging ? 'Drop your lab PDF or photo here' : 'Drag and drop lab PDFs or photos here'}
              </p>
              <p className="text-xs text-gray-400 mb-4">Supports Quest, Labcorp, Function Health, or hospital PDFs/images</p>
              <input
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.heic"
                onChange={handleFileChange}
                className="hidden"
                id="lab-file-input"
              />
              <label
                htmlFor="lab-file-input"
                className="px-5 py-2.5 rounded-xl bg-levl-accent text-white font-bold text-xs shadow-lg cursor-pointer hover:bg-levl-accent/90 transition-all inline-block"
              >
                Browse Files
              </label>
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-300">Selected Files ({files.length}):</h4>
                  <button 
                    type="button" 
                    onClick={() => setFiles([])} 
                    className="text-[10px] text-gray-400 hover:text-amber-400 underline"
                  >
                    Clear files
                  </button>
                </div>
                <div className="space-y-1">
                  {files.map((f, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs text-gray-300 bg-white/5 p-2 rounded-xl">
                      <div className="flex items-center gap-2 truncate">
                        <FileText size={14} className="text-indigo-400 shrink-0" />
                        <span className="truncate">{f.name}</span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono shrink-0 ml-2">({Math.round(f.size / 1024)} KB)</span>
                    </div>
                  ))}
                </div>

                <button
                  disabled={isParsing}
                  onClick={handleRunAIExtraction}
                  className="w-full py-3 rounded-xl bg-emerald-500 text-black font-extrabold text-sm shadow-lg hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 mt-4"
                >
                  {isParsing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Extracting Biomarkers with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} /> Extract Biomarkers with AI
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Minimal Review & Confirmation */}
        {extractedData && (
          <div className="space-y-5">
            {/* Minimal Review Header Banner */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">AI Extraction Complete</span>
                <h3 className="text-base font-bold text-white">
                  <strong>{extractedData.summary_counts.total_extracted}</strong> biomarkers detected · 
                  <strong className="text-emerald-300"> {extractedData.summary_counts.used_by_bioage}</strong> used by BioAge · 
                  <strong className="text-amber-300"> {reviewItemsCount}</strong> need review
                </h3>
              </div>
            </div>

            {/* Targeted Review Section with "Confirm All" Button */}
            {reviewItemsCount > 0 && (
              <div className="space-y-2 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center justify-between pb-1">
                  <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
                    <AlertTriangle size={16} /> Targeted Value Review Needed ({reviewItemsCount}):
                  </h4>
                  <button
                    type="button"
                    onClick={handleConfirmAll}
                    className="px-3 py-1 rounded-lg bg-amber-400 text-black font-extrabold text-xs shadow hover:bg-amber-300 transition-all flex items-center gap-1"
                  >
                    <CheckCircle2 size={14} /> Confirm All Values
                  </button>
                </div>

                <div className="space-y-2 pt-1 max-h-56 overflow-y-auto pr-1">
                  {extractedData.biomarkers.filter(b => b.needs_review).map((b, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-black/60 border border-amber-500/30 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs items-center">
                      <div>
                        <span className="text-gray-400 text-[10px]">Printed Text:</span>
                        <input
                          type="text"
                          value={b.raw_name}
                          onChange={(e) => {
                            b.raw_name = e.target.value
                            setExtractedData({ ...extractedData })
                          }}
                          className="w-full bg-black/80 border border-white/10 rounded px-2 py-1 text-white text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-gray-400 text-[10px]">Value ({b.raw_unit}):</span>
                        <input
                          type="number"
                          value={b.raw_value}
                          onChange={(e) => {
                            b.raw_value = parseFloat(e.target.value) || 0
                            b.normalized_value = b.raw_value
                            setExtractedData({ ...extractedData })
                          }}
                          className="w-full bg-black/80 border border-white/10 rounded px-2 py-1 text-white text-xs font-mono"
                        />
                      </div>
                      <div className="flex items-center justify-end pt-3">
                        <button
                          type="button"
                          onClick={() => {
                            b.needs_review = false
                            setExtractedData({ ...extractedData })
                          }}
                          className="px-3 py-1 bg-amber-500 text-black font-bold rounded-lg text-xs hover:bg-amber-400 transition-all"
                        >
                          Confirm Item
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Complete Extracted Biomarkers List */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">All Extracted Biomarkers ({extractedData.biomarkers.length}):</h4>
              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                {extractedData.biomarkers.map((b, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{b.raw_name}</span>
                      {b.is_bioage_used && (
                        <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          BioAge
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-gray-200">
                      <strong>{b.raw_value}</strong> {b.raw_unit}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {saveError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 font-medium">
                {saveError}
              </div>
            )}

            {/* Save Action */}
            <button
              disabled={isSaving}
              onClick={handleSaveToProfile}
              className="w-full py-3.5 rounded-xl bg-levl-accent text-white font-bold text-sm shadow-lg hover:bg-levl-accent/90 transition-all flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Saving Lab Panel & Recalculating BioAge...
                </>
              ) : (
                <>
                  <Check size={18} /> Save Lab Panel & Calculate BioAge
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
