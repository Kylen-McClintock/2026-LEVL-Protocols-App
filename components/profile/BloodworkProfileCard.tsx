'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { UserLabPanel, BiomarkerMeasurementRecord } from '@/lib/aging-models/bioAgeTypes'
import { getUserLabPanels, getAllBiomarkerMeasurements } from '@/lib/data/bloodworkData'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { UserProfile } from '@/lib/types'
import LabUploadModal from '@/components/modals/LabUploadModal'
import { Upload, Sparkles, FileText, Calendar, CheckCircle2, ChevronRight, Dna, Activity, ChevronDown, ChevronUp } from 'lucide-react'

interface BloodworkProfileCardProps {
  profile: UserProfile
}

export default function BloodworkProfileCard({ profile }: BloodworkProfileCardProps) {
  const [panels, setPanels] = useState<UserLabPanel[]>([])
  const [biomarkers, setBiomarkers] = useState<BiomarkerMeasurementRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const userId = profile.local_user_id || getLocalUserId()

  const loadData = async () => {
    if (!userId) return
    setLoading(true)
    try {
      const [fetchedPanels, fetchedMeas] = await Promise.all([
        getUserLabPanels(userId),
        getAllBiomarkerMeasurements(userId)
      ])
      setPanels(fetchedPanels)
      setBiomarkers(fetchedMeas)
    } catch (err) {
      console.error('Failed to load lab data in profile:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()

    const handleUpdate = () => loadData()
    window.addEventListener('levl_lab_panels_updated', handleUpdate)
    return () => window.removeEventListener('levl_lab_panels_updated', handleUpdate)
  }, [userId])

  const chronologicalAge = profile.age || (profile as any).chronological_age || 35
  const sex = profile.biological_sex === 'Female' ? 'female' : 'male'

  return (
    <div className="glass-card p-5 sm:p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md shadow-xl space-y-4">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center shadow-md shrink-0 mt-0.5">
            <Activity size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2 flex-wrap">
              <span>Bloodwork &amp; Lab Panels</span>
              {panels.length > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {panels.length} {panels.length === 1 ? 'Panel' : 'Panels'} Uploaded
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Synced directly with your Biological Aging &amp; Protocol Personalization engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-levl-accent to-teal-500 hover:from-levl-accent/90 hover:to-teal-400 text-black font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Upload size={14} />
            <span>Upload Labs</span>
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="text-slate-400 hover:text-white p-1 shrink-0 cursor-pointer transition-colors"
            aria-label={isOpen ? 'Collapse bloodwork section' : 'Expand bloodwork section'}
          >
            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* Collapsed Summary vs Expanded Details */}
      {!isOpen ? (
        <div 
          onClick={() => setIsOpen(true)}
          className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-red-500/30 flex items-center justify-between cursor-pointer transition-all group select-none"
        >
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-xs text-slate-400 font-medium">Diagnostic Panels:</span>
            {panels.length > 0 ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg border bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
                <Calendar size={12} />
                <span>Latest: {panels[0]?.collection_date || 'Recent'}</span>
                <span className="text-slate-500">•</span>
                <span>{panels.length} {panels.length === 1 ? 'Panel' : 'Panels'}</span>
              </span>
            ) : (
              <span className="text-xs text-slate-500 italic">No lab panels uploaded yet</span>
            )}
          </div>
          <div className="text-xs text-red-400 group-hover:text-red-300 font-bold flex items-center gap-1 shrink-0 ml-2">
            <span>{panels.length > 0 ? `View Panels (${panels.length})` : 'Expand & Upload'}</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </div>
      ) : (
        <div className="space-y-4 pt-1 animate-in fade-in duration-200">
          {/* Card Body */}
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-500 animate-pulse">
              Loading diagnostic lab panels...
            </div>
          ) : panels.length > 0 ? (
            <div className="space-y-3">
              {/* Panels List */}
              <div className="grid grid-cols-1 gap-2.5">
                {panels.map((panel, idx) => {
                  const panelMeasCount = panel.measurements?.length || biomarkers.filter(b => b.panel_id === panel.id).length
                  const phenoAge = panel.bioage_outputs?.pheno_age
                  const kdmAge = panel.bioage_outputs?.kdm_age

                  return (
                    <div
                      key={panel.id || idx}
                      className="p-3.5 sm:p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <FileText size={13} className="text-red-400" />
                            <span>{panel.provider_name || 'Diagnostic Panel'}</span>
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                            {panel.collection_date}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-950/40 text-red-300 border border-red-800/40">
                            {panelMeasCount} Biomarkers
                          </span>
                        </div>
                        {(panel as any).notes && (
                          <p className="text-[11px] text-slate-400 line-clamp-1">{(panel as any).notes}</p>
                        )}
                      </div>

                      {/* PhenoAge output pill */}
                      {phenoAge && (
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right sm:text-right">
                            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">PhenoAge</div>
                            <div className="text-sm font-black text-emerald-400 font-mono">
                              {phenoAge.toFixed(1)} yrs
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Biological Age Link */}
              <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/60">
                <span>Computed via Klemera-Doubal &amp; Levine PhenoAge algorithms</span>
                <Link
                  href="/aging"
                  className="font-bold text-levl-accent hover:text-teal-300 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span>View Biological Age &amp; Biomarker Analysis</span>
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="py-6 px-4 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
                <Dna size={24} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">No Bloodwork Panels Uploaded Yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                  Upload PDF or image lab reports (Quest, Labcorp, Function Health) to extract biomarkers, compute multi-system BioAge, and personalize your protocol dosages.
                </p>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-levl-accent to-teal-500 hover:from-levl-accent/90 hover:to-teal-400 text-black font-extrabold text-xs rounded-xl transition-all shadow-md inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Upload size={14} />
                <span>Upload Bloodwork (PDF / Image)</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Lab Upload Modal */}
      <LabUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        userId={userId}
        userProfile={{ chronological_age: chronologicalAge, sex }}
        onSaved={loadData}
      />
    </div>
  )
}
