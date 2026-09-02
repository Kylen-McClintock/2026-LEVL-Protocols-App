'use client'

import React, { useState } from 'react'
import { 
  X, Plus, Sparkles, Zap, Flame, Wind, Droplets, 
  FileText, Activity, Layers, ArrowRight, BookOpen, ShieldCheck, Dumbbell, Mic, Pill, Camera 
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import CreateCustomModalityModal from './CreateCustomModalityModal'
import EnrollProtocolModal from './EnrollProtocolModal'
import VoiceLogModal from './VoiceLogModal'
import AdHocLoggerModal from './AdHocLoggerModal'
import SupplementScannerModal from './SupplementScannerModal'
import Breathing478Applet from '@/components/applets/Breathing478Applet'
import BoxBreathingApplet from '@/components/applets/BoxBreathingApplet'
import ManageHotkeysModal from '@/components/quicklog/ManageHotkeysModal'

import { useAuth } from '@/contexts/AuthContext'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'

interface QuickActionHubModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function QuickActionHubModal({
  isOpen,
  onClose
}: QuickActionHubModalProps) {
  const router = useRouter()
  const { localUserId: authUserId } = useAuth()
  const localUserId = authUserId || getLocalUserId()

  const [showVoiceLog, setShowVoiceLog] = useState(false)
  const [showCreateCustom, setShowCreateCustom] = useState(false)
  const [showSupplementScanner, setShowSupplementScanner] = useState(false)
  const [showEnrollProtocol, setShowEnrollProtocol] = useState(false)
  const [showAdHocLog, setShowAdHocLog] = useState(false)
  const [showHotkeysModal, setShowHotkeysModal] = useState(false)
  const [show478Breathing, setShow478Breathing] = useState(false)
  const [showBoxBreathing, setShowBoxBreathing] = useState(false)

  if (!isOpen && !showVoiceLog && !showCreateCustom && !showSupplementScanner && !showEnrollProtocol && !showAdHocLog && !showHotkeysModal && !show478Breathing && !showBoxBreathing) {
    return null
  }

  return (
    <>
      {/* Primary Action Sheet */}
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-950/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
                  <Plus size={18} className="stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">Quick Actions & Log</h2>
                  <p className="text-xs text-slate-400">Create, log, or start a guided bio-routine</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Action Grid */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5 flex-1">
              
              {/* Option 1: Voice Protocol Log */}
              <button
                onClick={() => {
                  onClose()
                  setShowVoiceLog(true)
                }}
                className="w-full text-left p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/20 via-indigo-500/15 to-sky-500/15 border border-purple-500/40 hover:border-purple-400/70 hover:bg-purple-500/25 transition-all group flex items-center justify-between cursor-pointer shadow-lg shadow-purple-500/10"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/30 to-sky-500/30 border border-purple-500/50 flex items-center justify-center text-purple-300 group-hover:scale-105 transition-transform shadow-md shadow-purple-500/20">
                    <Mic size={20} className="text-purple-200" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white group-hover:text-purple-200 transition-colors flex items-center gap-1.5">
                      Voice Protocol Log
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/30 border border-purple-500/40 text-purple-300 font-mono font-bold">
                        ✦ VOICE AI
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      Speak naturally to log doses, sauna, workouts, and symptoms
                    </div>
                  </div>
                </div>
                <ArrowRight size={16} className="text-slate-500 group-hover:text-purple-300 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </button>

              {/* Option 2: AI Longevity Coach */}
              <button
                onClick={() => {
                  onClose()
                  router.push('/coach')
                }}
                className="w-full text-left p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/15 via-indigo-500/10 to-sky-500/10 border border-purple-500/35 hover:border-purple-400/60 hover:bg-purple-500/20 transition-all group flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/30 to-indigo-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 group-hover:scale-105 transition-transform shadow-md shadow-purple-500/10">
                    <Sparkles size={20} className="text-purple-300" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white group-hover:text-purple-200 transition-colors flex items-center gap-1.5">
                      AI Longevity Coach
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 font-mono font-bold">
                        ✦ AI
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      Ask stack questions, biomarker reviews, and protocol timing
                    </div>
                  </div>
                </div>
                <ArrowRight size={16} className="text-slate-500 group-hover:text-purple-300 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </button>

              {/* Option 3: Add a Supplement (Scan Facts Label) */}
              <button
                onClick={() => {
                  onClose()
                  setShowSupplementScanner(true)
                }}
                className="w-full text-left p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-600/10 border border-amber-500/35 hover:border-amber-400/60 hover:bg-amber-500/20 transition-all group flex items-center justify-between cursor-pointer shadow-lg shadow-amber-500/5"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-500/30 border border-amber-500/40 flex items-center justify-center text-amber-300 group-hover:scale-105 transition-transform shadow-md shadow-amber-500/10">
                    <Pill size={20} className="text-amber-200" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white group-hover:text-amber-200 transition-colors flex items-center gap-1.5">
                      Add a Supplement
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/25 border border-amber-500/40 text-amber-300 font-mono font-bold flex items-center gap-1">
                        <Camera size={10} /> SCAN LABEL
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      Snap or upload a Supplement Facts label to auto-extract dosing, timing & ingredients
                    </div>
                  </div>
                </div>
                <ArrowRight size={16} className="text-slate-500 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </button>

              {/* Option 4: Create Custom Modality from Scratch */}
              <button
                onClick={() => {
                  onClose()
                  setShowCreateCustom(true)
                }}
                className="w-full text-left p-3.5 rounded-2xl bg-gradient-to-r from-sky-500/10 to-blue-500/10 border border-sky-500/30 hover:border-sky-400/60 hover:bg-sky-500/15 transition-all group flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-300 group-hover:scale-105 transition-transform">
                    <Plus size={20} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white group-hover:text-sky-200 transition-colors flex items-center gap-1.5">
                      Create Custom Modality
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono font-medium">CUSTOM</span>
                    </div>
                    <div className="text-xs text-slate-400">
                      Build your own exercise, device, therapy, or habit from scratch
                    </div>
                  </div>
                </div>
                <ArrowRight size={16} className="text-slate-500 group-hover:text-sky-300 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </button>

              {/* Option 3: Enroll in Protocol Stack */}
              <button
                onClick={() => {
                  onClose()
                  setShowEnrollProtocol(true)
                }}
                className="w-full text-left p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-sky-500/10 border border-emerald-500/30 hover:border-emerald-400/60 hover:bg-emerald-500/15 transition-all group flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 group-hover:scale-105 transition-transform">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white group-hover:text-emerald-200 transition-colors flex items-center gap-1.5">
                      Enroll in Protocol Stack
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-mono font-medium">
                        STACKS
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      Adopt verified stacks (Blueprint 2026, Huberman, Sinclair, Attia)
                    </div>
                  </div>
                </div>
                <ArrowRight size={16} className="text-slate-500 group-hover:text-emerald-300 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </button>

              {/* Option 4: Log Unscheduled / Ad-Hoc Dose */}
              <button
                onClick={() => {
                  onClose()
                  setShowAdHocLog(true)
                }}
                className="w-full text-left p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-950 transition-all group flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                    <Zap size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white group-hover:text-amber-200 transition-colors">
                      Log Ad-Hoc Protocol Dose
                    </div>
                    <div className="text-xs text-slate-400">
                      Add a one-time un-scheduled session or supplement to Today
                    </div>
                  </div>
                </div>
                <ArrowRight size={16} className="text-slate-500 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </button>

              {/* Option 4: Quick Hotkeys & Daily Log Manager */}
              <button
                onClick={() => {
                  onClose()
                  setShowHotkeysModal(true)
                }}
                className="w-full text-left p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-950 transition-all group flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                    <Layers size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white group-hover:text-emerald-200 transition-colors">
                      Manage Daily Quick Hotkeys
                    </div>
                    <div className="text-xs text-slate-400">
                      Customize 1-tap logging buttons for water, creatine, and habits
                    </div>
                  </div>
                </div>
                <ArrowRight size={16} className="text-slate-500 group-hover:text-emerald-300 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </button>

              {/* Option 5: Bloodwork & Lab PDF Upload */}
              <button
                onClick={() => {
                  onClose()
                  router.push('/settings#bloodwork')
                }}
                className="w-full text-left p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-950 transition-all group flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
                    <Activity size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white group-hover:text-rose-200 transition-colors">
                      Upload Bloodwork / Lab PDF
                    </div>
                    <div className="text-xs text-slate-400">
                      Extract Quest/Labcorp panels and calculate biological PhenoAge
                    </div>
                  </div>
                </div>
                <ArrowRight size={16} className="text-slate-500 group-hover:text-rose-300 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </button>

              {/* Option 6: Guided 4-7-8 Breathwork Applet */}
              <button
                onClick={() => {
                  onClose()
                  setShow478Breathing(true)
                }}
                className="w-full text-left p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-950 transition-all group flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                    <Wind size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white group-hover:text-indigo-200 transition-colors">
                      Guided 4-7-8 Breathwork
                    </div>
                    <div className="text-xs text-slate-400">
                      Live interactive parasympathetic down-regulation pacer
                    </div>
                  </div>
                </div>
                <ArrowRight size={16} className="text-slate-500 group-hover:text-indigo-300 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </button>

            </div>
          </div>
        </div>
      )}

      {/* Sub-Modals */}
      {showVoiceLog && (
        <VoiceLogModal
          isOpen={showVoiceLog}
          onClose={() => setShowVoiceLog(false)}
          onLoggedSuccess={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('levl_bench_updated'))
            }
          }}
        />
      )}

      {showCreateCustom && (
        <CreateCustomModalityModal
          isOpen={showCreateCustom}
          onClose={() => setShowCreateCustom(false)}
        />
      )}

      {showSupplementScanner && (
        <SupplementScannerModal
          isOpen={showSupplementScanner}
          onClose={() => setShowSupplementScanner(false)}
          onIngestSuccess={() => {
            setShowSupplementScanner(false)
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('levl_modality_created'))
              window.dispatchEvent(new CustomEvent('levl_task_status_changed'))
              window.dispatchEvent(new CustomEvent('levl_bench_updated'))
            }
          }}
        />
      )}

      {showEnrollProtocol && (
        <EnrollProtocolModal
          isOpen={showEnrollProtocol}
          onClose={() => setShowEnrollProtocol(false)}
          dateStr={format(new Date(), 'yyyy-MM-dd')}
          onProtocolEnrolled={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('levl_bench_updated'))
            }
          }}
        />
      )}

      {showAdHocLog && (
        <AdHocLoggerModal
          isOpen={showAdHocLog}
          onClose={() => setShowAdHocLog(false)}
          localUserId={localUserId}
          onLogged={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('levl_bench_updated'))
            }
          }}
          benchItems={[]}
          todayTasks={[]}
        />
      )}

      {showHotkeysModal && (
        <ManageHotkeysModal
          localUserId={localUserId}
          activeHotkeys={[]}
          onClose={() => setShowHotkeysModal(false)}
          onSaved={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('levl_hotkeys_updated'))
            }
          }}
        />
      )}

      {show478Breathing && (
        <Breathing478Applet
          isOpen={show478Breathing}
          onClose={() => setShow478Breathing(false)}
        />
      )}

      {showBoxBreathing && (
        <BoxBreathingApplet
          isOpen={showBoxBreathing}
          onClose={() => setShowBoxBreathing(false)}
        />
      )}
    </>
  )
}
