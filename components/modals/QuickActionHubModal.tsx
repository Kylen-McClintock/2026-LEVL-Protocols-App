'use client'

import React, { useState } from 'react'
import { 
  X, Plus, Sparkles, Zap, Flame, Wind, Droplets, 
  FileText, Activity, Layers, ArrowRight, BookOpen, ShieldCheck, Dumbbell 
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import CreateCustomModalityModal from './CreateCustomModalityModal'
import AdHocLoggerModal from './AdHocLoggerModal'
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

  const [showCreateCustom, setShowCreateCustom] = useState(false)
  const [showAdHocLog, setShowAdHocLog] = useState(false)
  const [showHotkeysModal, setShowHotkeysModal] = useState(false)
  const [show478Breathing, setShow478Breathing] = useState(false)
  const [showBoxBreathing, setShowBoxBreathing] = useState(false)

  if (!isOpen && !showCreateCustom && !showAdHocLog && !showHotkeysModal && !show478Breathing && !showBoxBreathing) {
    return null
  }

  return (
    <>
      {/* Primary Action Sheet */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-300">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/80">
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
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Action Grid */}
            <div className="p-5 overflow-y-auto space-y-2.5">
              
              {/* Option 1: Create Custom Modality from Scratch */}
              <button
                onClick={() => {
                  onClose()
                  setShowCreateCustom(true)
                }}
                className="w-full text-left p-3.5 rounded-2xl bg-gradient-to-r from-sky-500/10 to-blue-500/10 border border-sky-500/30 hover:border-sky-400/60 hover:bg-sky-500/15 transition-all group flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-300 group-hover:scale-105 transition-transform">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white group-hover:text-sky-200 transition-colors flex items-center gap-1.5">
                      Create Custom Modality
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono">NEW</span>
                    </div>
                    <div className="text-xs text-slate-400">
                      Build your own supplement, exercise, or protocol from scratch
                    </div>
                  </div>
                </div>
                <ArrowRight size={16} className="text-slate-500 group-hover:text-sky-300 group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* Option 2: Log Unscheduled / Ad-Hoc Dose */}
              <button
                onClick={() => {
                  onClose()
                  setShowAdHocLog(true)
                }}
                className="w-full text-left p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-950 transition-all group flex items-center justify-between"
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
                <ArrowRight size={16} className="text-slate-500 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* Option 3: Quick Hotkeys & Daily Log Manager */}
              <button
                onClick={() => {
                  onClose()
                  setShowHotkeysModal(true)
                }}
                className="w-full text-left p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-950 transition-all group flex items-center justify-between"
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
                <ArrowRight size={16} className="text-slate-500 group-hover:text-emerald-300 group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* Option 4: Bloodwork & Lab PDF Upload */}
              <button
                onClick={() => {
                  onClose()
                  router.push('/settings#bloodwork')
                }}
                className="w-full text-left p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-950 transition-all group flex items-center justify-between"
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
                <ArrowRight size={16} className="text-slate-500 group-hover:text-rose-300 group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* Option 5: Guided 4-7-8 Breathwork Applet */}
              <button
                onClick={() => {
                  onClose()
                  setShow478Breathing(true)
                }}
                className="w-full text-left p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-950 transition-all group flex items-center justify-between"
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
                <ArrowRight size={16} className="text-slate-500 group-hover:text-indigo-300 group-hover:translate-x-0.5 transition-all" />
              </button>

            </div>
          </div>
        </div>
      )}

      {/* Sub-Modals */}
      {showCreateCustom && (
        <CreateCustomModalityModal
          isOpen={showCreateCustom}
          onClose={() => setShowCreateCustom(false)}
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
