'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { UserLabPanel, BiomarkerMeasurementRecord } from '@/lib/aging-models/bioAgeTypes'
import { getUserLabPanels, getAllBiomarkerMeasurements } from '@/lib/data/bloodworkData'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { UserProfile } from '@/lib/types'
import LabUploadModal from '@/components/modals/LabUploadModal'
import { Upload, Sparkles, FileText, Calendar, CheckCircle2, ChevronRight, Dna, Activity } from 'lucide-react'

interface BloodworkProfileCardProps {
  profile: UserProfile
}

export default function BloodworkProfileCard({ profile }: BloodworkProfileCardProps) {
  const [panels, setPanels] = useState<UserLabPanel[]>([])
  const [biomarkers, setBiomarkers] = useState<BiomarkerMeasurementRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center shadow-md shrink-0">
            <Activity size={20} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span>Bloodwork & Lab Panels</span>
              {panels.length > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {panels.length} {panels.length === 1 ? 'Panel' : 'Panels'} Uploaded
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400">
              Synced directly with your Biological Aging & Protocol Personalization engine
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="px-3.5 py-2 bg-gradient-to-r from-levl-accent to-teal-500 hover:from-levl-accent/90 hover:to-teal-400 text-black font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
        >
          <Upload size={14} />
          <span>Upload Labs</span>
        </button>
      </div>

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
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs truncate">
                          {panel.provider_name || 'Standard Diagnostic Lab'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Calendar size={10} />
                          {panel.collection_date}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>{panelMeasCount > 0 ? `${panelMeasCount} Biomarkers` : 'Biomarkers parsed'}</span>
                        {phenoAge && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-400 font-bold">PhenoAge: {phenoAge.toFixed(1)} yrs</span>
                          </>
                        )}
                        {kdmAge && (
                          <>
                            <span>•</span>
                            <span className="text-teal-400 font-bold">KDM: {kdmAge.toFixed(1)} yrs</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 justify-end shrink-0">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 size={10} /> Active
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Deep-Dive Navigation to /aging */}
          <div className="pt-2 flex justify-between items-center text-xs">
            <span className="text-slate-400">
              Total Biomarkers Active: <strong className="text-white">{biomarkers.length}</strong>
            </span>
            <Link
              href="/aging"
              className="font-bold text-levl-accent hover:text-teal-300 flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span>View Biological Age & Biomarker Analysis</span>
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
