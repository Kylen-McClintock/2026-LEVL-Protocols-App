'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { 
  X, 
  Layers, 
  Archive, 
  Trash2, 
  Check, 
  AlertTriangle, 
  Plus, 
  Sparkles, 
  Bot, 
  Send, 
  Zap, 
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { Protocol, Modality } from '@/lib/types'
import { DedupedTask } from '@/components/cards/ProtocolTaskCard'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { moveModalityToBench, eliminateModality, getProtocols, getModalities, getBenchItems, createDailyTask } from '@/lib/data'
import { format } from 'date-fns'

interface AiCoachMessage {
  role: 'user' | 'assistant'
  text: string
  suggestedAdditions?: string[]
  suggestedRemovals?: string[]
}

interface ProtocolActionModalProps {
  isOpen: boolean
  onClose: () => void
  protocolName: string
  protocolInfo?: Protocol | null
  groupTasks: DedupedTask[]
  initialAction?: 'bench' | 'eliminate'
  initialScope?: 'all' | 'custom'
  onSuccess: () => void
}

const COMMON_REASONS = [
  'Too busy / Time constraints',
  'Not effective / Low perceived ROI',
  'Side effects or physical discomfort',
  'Equipment / Facility unavailable',
  'Replaced by an alternative modality',
  'Seasonal or temporary pause'
]

// Known biological synergy recommendations dictionary
const SYNERGY_RECOMMENDATIONS_REGISTRY: Record<string, { name: string; badge: string; reason: string }[]> = {
  "Dr. David Sinclair's Epigenetic Renewal Protocol": [
    { name: 'TMG (Trimethylglycine)', badge: '🧬 Methyl Donor', reason: 'Prevents methyl group depletion during nicotinamide NMN degradation.' },
    { name: 'Berberine HCl', badge: '⚡ AMPK Activator', reason: 'Synergizes with Resveratrol to activate sirtuin pathways via mitochondrial sensing.' }
  ],
  "Dr. David Sinclair’s Epigenetic Renewal Protocol": [
    { name: 'TMG (Trimethylglycine)', badge: '🧬 Methyl Donor', reason: 'Prevents methyl group depletion during nicotinamide NMN degradation.' },
    { name: 'Berberine HCl', badge: '⚡ AMPK Activator', reason: 'Synergizes with Resveratrol to activate sirtuin pathways via mitochondrial sensing.' }
  ],
  "Gary Brecka’s Superhuman Protocol": [
    { name: 'EWOT (Exercise With Oxygen Therapy)', badge: '🫁 Plasma Saturation', reason: 'Floods blood plasma with O2 right after PEMF separates rouleaux red blood cells.' },
    { name: 'Red & Near-Infrared Light Therapy', badge: '💡 ATP Synthesis', reason: 'Dissociates Nitric Oxide from Cytochrome c Oxidase post-oxygenation.' }
  ],
  "Dr. Matthew Walker’s 8-Hour Sleep Architecture Blueprint": [
    { name: 'Magnesium L-Threonate + Apigenin', badge: '🧠 GABA-A Receptor', reason: 'Accelerates deep NREM slow-wave EEG delta activity.' },
    { name: 'Cold Shower / Cold Plunge', badge: '🧊 Thermoregulation', reason: 'Triggers the mandatory 2-3°F core temperature drop for sleep onset.' }
  ],
  "Dr. Valter Longo & Mayo Clinic Senolytic & Fasting Mimicking Protocol": [
    { name: 'Extra Virgin Olive Oil (Polyphenol High)', badge: '🥑 SCAP Bioavailability', reason: 'Enhances lipophilic Fisetin absorption 500%.' },
    { name: 'Quercetin Phytosome', badge: '🦠 Senolytic Synergy', reason: 'Pairing Quercetin with Fisetin increases senescent cell clearance.' }
  ],
  "Wim Hof Autonomic Nervous System & HRV Reset Protocol": [
    { name: 'Cold Shower / Plunge (50°F)', badge: '⚡ Dopamine +250%', reason: 'Surges norepinephrine and dopamine by 250% post-breathing retention.' }
  ]
}

export default function ProtocolActionModal({
  isOpen,
  onClose,
  protocolName,
  protocolInfo,
  groupTasks,
  initialAction = 'bench',
  initialScope = 'all',
  onSuccess
}: ProtocolActionModalProps) {
  const [mounted, setMounted] = useState(false)
  const [actionType, setActionType] = useState<'bench' | 'eliminate'>(initialAction)
  const [scope, setScope] = useState<'all' | 'custom'>(initialScope)
  const [activeTab, setActiveTab] = useState<'adjust' | 'ai_coach'>('adjust')

  useEffect(() => {
    setMounted(true)
  }, [])

  // Master protocol and modality libraries
  const [allProtocols, setAllProtocols] = useState<Protocol[]>([])
  const [allModalities, setAllModalities] = useState<Modality[]>([])
  const [addingModalityId, setAddingModalityId] = useState<string | null>(null)
  const [addSuccessMsg, setAddSuccessMsg] = useState<string | null>(null)

  // AI Chat states
  const [aiInput, setAiInput] = useState('')
  const [aiMessages, setAiMessages] = useState<AiCoachMessage[]>([
    {
      role: 'assistant',
      text: `Hello! I am your LEVL AI Protocol Coach. How can I help you customize or optimize your "${protocolName}" stack today?`
    }
  ])
  const [isAiLoading, setIsAiLoading] = useState(false)

  // Active Modality IDs list
  const activeModalityIds = useMemo(() => {
    const ids = new Set<string>()
    groupTasks.forEach(t => {
      const mId = t.protocol_step?.modality?.id || t.loose_modality?.id || t.modality_id
      if (mId) ids.add(mId)
    })
    return Array.from(ids)
  }, [groupTasks])

  // Active Modality Names list
  const activeModalityNames = useMemo(() => {
    return groupTasks.map(t => t.protocol_step?.modality?.display_name || t.protocol_step?.modality?.name || t.loose_modality?.name || 'Modality').filter(Boolean)
  }, [groupTasks])

  const [selectedModalityIds, setSelectedModalityIds] = useState<Set<string>>(new Set(activeModalityIds))
  const [selectedReasons, setSelectedReasons] = useState<string[]>([])
  const [customReason, setCustomReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [confirmedState, setConfirmedState] = useState<{
    action: 'bench' | 'eliminate'
    count: number
    total: number
  } | null>(null)

  // Load master protocols and modalities library to detect removed steps
  useEffect(() => {
    if (!isOpen) return
    async function loadData() {
      try {
        const [protos, mods] = await Promise.all([
          getProtocols(),
          getModalities()
        ])
        setAllProtocols(protos)
        setAllModalities(mods)
      } catch (err) {
        console.error('Error loading data for ProtocolActionModal:', err)
      }
    }
    loadData()
  }, [isOpen])

  // Sync state when props change
  useEffect(() => {
    setActionType(initialAction)
    setScope(initialScope)
    setSelectedModalityIds(new Set(activeModalityIds))
  }, [initialAction, initialScope, activeModalityIds, isOpen])

  // Detect missing/removed steps from the canonical master protocol
  const canonicalProtocol = useMemo(() => {
    return allProtocols.find(p => p.name === protocolName || p.id === protocolInfo?.id)
  }, [allProtocols, protocolName, protocolInfo])

  const removedBlueprintSteps = useMemo(() => {
    if (!canonicalProtocol?.protocol_steps) return []
    return canonicalProtocol.protocol_steps.filter(step => {
      const mId = step.modality?.id || step.modality_id
      return mId && !activeModalityIds.includes(mId)
    })
  }, [canonicalProtocol, activeModalityIds])

  // Get dynamic synergy recommendations
  const synergyRecs = useMemo(() => {
    return SYNERGY_RECOMMENDATIONS_REGISTRY[protocolName] || [
      { name: 'Cold Shower / Cold Plunge', badge: '🧊 Cold Shock', reason: 'SURGES dopamine and enhances vagal nerve HRV recovery.' },
      { name: 'Zone 2 Aerobic Exercise', badge: '🫀 Mitochondrial Volume', reason: 'Expands mitochondrial density and lactate clearance.' }
    ]
  }, [protocolName])

  if (!isOpen) return null

  const toggleReason = (reason: string) => {
    setSelectedReasons(prev => 
      prev.includes(reason) 
        ? prev.filter(r => r !== reason)
        : [...prev, reason]
    )
  }

  const toggleModality = (modalityId: string) => {
    setSelectedModalityIds(prev => {
      const next = new Set(prev)
      if (next.has(modalityId)) {
        next.delete(modalityId)
      } else {
        next.add(modalityId)
      }
      return next
    })
  }

  // Restore/add a modality into today's protocol timeline
  const handleAddModalityToToday = async (modalityId: string, name: string) => {
    setAddingModalityId(modalityId)
    const localUserId = getLocalUserId()
    const todayStr = format(new Date(), 'yyyy-MM-dd')

    try {
      await createDailyTask(localUserId, todayStr, modalityId)
      setAddSuccessMsg(`Successfully added "${name}" back to Today!`)
      setTimeout(() => {
        setAddSuccessMsg(null)
        onSuccess()
      }, 1200)
    } catch (err) {
      console.error('Error adding modality back:', err)
    } finally {
      setAddingModalityId(null)
    }
  }

  // Handle benching a single modality directly from AI Coach
  const handleBenchSingleModality = async (modalityId: string, taskId?: string) => {
    const userLocalId = getLocalUserId()
    try {
      await moveModalityToBench(userLocalId, modalityId, taskId)
      setAddSuccessMsg('Moved modality to bench!')
      setTimeout(() => {
        setAddSuccessMsg(null)
        onSuccess()
      }, 1200)
    } catch (err) {
      console.error('Error benching modality from AI Coach:', err)
    }
  }

  // Handle AI Coach Chat queries
  const handleSendAiMessage = async (queryText?: string) => {
    const textToSend = queryText || aiInput
    if (!textToSend.trim() || isAiLoading) return

    const newMessages = [...aiMessages, { role: 'user' as const, text: textToSend }]
    setAiMessages(newMessages)
    if (!queryText) setAiInput('')
    setIsAiLoading(true)

    try {
      const response = await fetch('/api/protocol-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocolName,
          activeModalities: activeModalityNames,
          availableModalities: allModalities.slice(0, 15).map(m => m.name),
          userQuestion: textToSend
        })
      })

      const data = await response.json()
      if (data.advice) {
        setAiMessages([
          ...newMessages, 
          { 
            role: 'assistant', 
            text: data.advice,
            suggestedAdditions: data.suggestedAdditions || [],
            suggestedRemovals: data.suggestedRemovals || []
          }
        ])
      } else {
        setAiMessages([...newMessages, { role: 'assistant', text: "I'm having trouble analyzing your protocol stack right now. Please try again!" }])
      }
    } catch (err) {
      console.error('AI Coach Error:', err)
      setAiMessages([...newMessages, { role: 'assistant', text: "Network connection error while consulting AI Coach." }])
    } finally {
      setIsAiLoading(false)
    }
  }

  const handleConfirmAction = async () => {
    if (isProcessing) return
    setIsProcessing(true)

    const userLocalId = getLocalUserId()
    const targetIds = scope === 'all' ? activeModalityIds : Array.from(selectedModalityIds)
    const combinedReasonText = [
      ...selectedReasons,
      customReason.trim() ? `Note: ${customReason.trim()}` : ''
    ].filter(Boolean).join('; ') || (actionType === 'eliminate' ? 'User eliminated protocol' : 'User benched protocol')

    try {
      for (const mId of targetIds) {
        const matchingTask = groupTasks.find(t => 
          (t.protocol_step?.modality?.id === mId || t.loose_modality?.id === mId || t.modality_id === mId)
        )
        const taskId = matchingTask?.id

        if (actionType === 'bench') {
          await moveModalityToBench(userLocalId, mId, taskId)
        } else {
          await eliminateModality(userLocalId, mId, combinedReasonText, taskId, selectedReasons)
        }
      }

      setConfirmedState({
        action: actionType,
        count: targetIds.length,
        total: activeModalityIds.length
      })

      setTimeout(() => {
        setIsProcessing(false)
        setConfirmedState(null)
        onSuccess()
        onClose()
      }, 1500)
    } catch (err) {
      console.error('Error executing protocol action:', err)
      setIsProcessing(false)
    }
  }

  if (!isOpen || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden my-auto max-h-[90vh]">
        
        {/* Modal Header Bar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center space-x-2.5">
            <div className={`p-2 rounded-xl border ${actionType === 'eliminate' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-purple-500/20 text-purple-400 border-purple-500/30'}`}>
              {actionType === 'eliminate' ? <Trash2 size={18} /> : <Archive size={18} />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                {actionType === 'eliminate' ? 'Eliminate Protocol' : scope === 'custom' ? 'Adjust Protocol Modalities' : 'Move Protocol to Bench'}
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                {protocolName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Header Mode Navigation Tabs */}
            <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => setActiveTab('adjust')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'adjust' ? 'bg-purple-950 text-purple-300 border border-purple-700/60 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Adjust
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ai_coach')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  activeTab === 'ai_coach' ? 'bg-indigo-950 text-indigo-300 border border-indigo-700/60 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Bot size={12} /> AI Coach
              </button>
            </div>

            <button 
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Dynamic Success Notification */}
        {addSuccessMsg && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/40 text-emerald-300 px-4 py-2 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-1">
            <Check size={14} />
            <span>{addSuccessMsg}</span>
          </div>
        )}

        {confirmedState ? (
          /* Instant 1.5-Second Confirmation Screen */
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-3 animate-in fade-in zoom-in-95 duration-200">
            <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center shadow-lg animate-bounce ${
              confirmedState.action === 'eliminate'
                ? 'bg-red-500/20 border-red-500/60 text-red-400 shadow-red-500/30'
                : 'bg-purple-500/20 border-purple-500/60 text-purple-400 shadow-purple-500/30'
            }`}>
              <Check size={32} strokeWidth={3} />
            </div>
            <h3 className="text-xl font-extrabold text-white">
              {confirmedState.action === 'eliminate' 
                ? (confirmedState.count === confirmedState.total ? 'Protocol Eliminated!' : `${confirmedState.count} Modalities Eliminated!`)
                : (confirmedState.count === confirmedState.total ? 'Protocol Moved to Bench!' : `${confirmedState.count} Modalities Benched!`)
              }
            </h3>
            <p className="text-xs text-slate-300 font-semibold tracking-wide uppercase">
              {protocolName}
            </p>
          </div>
        ) : activeTab === 'ai_coach' ? (
          /* TAB 2: AI Protocol Coach Chat Guidance */
          <div className="p-4 space-y-3 flex flex-col max-h-[75vh]">
            <div className="flex items-center gap-2 p-2.5 bg-indigo-950/40 border border-indigo-700/50 rounded-xl text-xs text-indigo-200">
              <Bot size={16} className="text-indigo-400 shrink-0" />
              <span>
                <strong>LEVL AI Protocol Guidance:</strong> Ask your AI Coach why modalities work together or how to customize this stack.
              </span>
            </div>

            {/* Chat History Container */}
            <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-slate-900/80 border border-slate-800 rounded-xl max-h-72 scrollbar-thin scrollbar-thumb-slate-800">
              {aiMessages.map((msg, idx) => {
                // Extract parsed or regex-matched additions and removals
                const textAdditions = Array.from(msg.text.matchAll(/\*\*Add:\*\*\s*([^\n\*\.]+)/gi)).map((m: RegExpExecArray) => m[1].trim())
                const textRemovals = Array.from(msg.text.matchAll(/\*\*Remove:\*\*\s*([^\n\*\.]+)/gi)).map((m: RegExpExecArray) => m[1].trim())
                
                const additions = Array.from(new Set([...(msg.suggestedAdditions || []), ...textAdditions]))
                const removals = Array.from(new Set([...(msg.suggestedRemovals || []), ...textRemovals]))

                return (
                  <div 
                    key={idx} 
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`max-w-[88%] p-3 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user' 
                        ? 'bg-purple-600 text-white rounded-br-none shadow-md'
                        : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm'
                    }`}>
                      <div>{msg.text}</div>

                      {/* Render Interactive Action Cards for AI Suggested Additions */}
                      {additions.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-slate-800 space-y-2">
                          <div className="text-[10px] font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles size={11} /> Suggested Modality Additions:
                          </div>
                          {additions.map((name, aIdx) => (
                            <div key={aIdx} className="p-2 rounded-lg bg-teal-950/60 border border-teal-500/40 flex items-center justify-between gap-2">
                              <span className="font-bold text-teal-200 text-xs truncate">{name}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const matched = allModalities.find(m => m.name.toLowerCase().includes(name.toLowerCase().split(' ')[0]))
                                  if (matched) handleAddModalityToToday(matched.id, name)
                                  else if (allModalities.length > 0) handleAddModalityToToday(allModalities[0].id, name)
                                }}
                                className="px-2.5 py-1 rounded-md bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-[10px] transition cursor-pointer shrink-0 flex items-center gap-1 shadow-sm active:scale-95"
                              >
                                <Plus size={11} /> Add to Today
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Render Interactive Action Cards for AI Suggested Removals */}
                      {removals.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-slate-800 space-y-2">
                          <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                            <Archive size={11} /> Suggested Modality Removals:
                          </div>
                          {removals.map((name, rIdx) => (
                            <div key={rIdx} className="p-2 rounded-lg bg-purple-950/60 border border-purple-500/40 flex items-center justify-between gap-2">
                              <span className="font-bold text-purple-200 text-xs truncate">{name}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const matchingTask = groupTasks.find(t => 
                                    t.protocol_step?.modality?.name?.toLowerCase().includes(name.toLowerCase().split(' ')[0]) ||
                                    t.loose_modality?.name?.toLowerCase().includes(name.toLowerCase().split(' ')[0])
                                  )
                                  const mId = matchingTask?.modality_id || matchingTask?.protocol_step?.modality?.id || activeModalityIds[0]
                                  if (mId) handleBenchSingleModality(mId, matchingTask?.id)
                                }}
                                className="px-2.5 py-1 rounded-md bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-[10px] transition cursor-pointer shrink-0 flex items-center gap-1 shadow-sm active:scale-95"
                              >
                                <Archive size={11} /> Move to Bench
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              {isAiLoading && (
                <div className="flex justify-start">
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-indigo-300 flex items-center gap-2">
                    <Sparkles size={14} className="animate-spin text-indigo-400" />
                    <span>Consulting longevity science models...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Suggested Quick Prompt Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => handleSendAiMessage(`What is the biological mechanism of synergy behind ${protocolName}?`)}
                className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-700/60 hover:bg-indigo-900 transition cursor-pointer"
              >
                ⚡ Biological Synergy?
              </button>
              <button
                type="button"
                onClick={() => handleSendAiMessage(`Which missing steps from the original ${protocolName} blueprint should I add back?`)}
                className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-950/80 text-purple-300 border border-purple-700/60 hover:bg-purple-900 transition cursor-pointer"
              >
                🧬 Missing Blueprint Steps?
              </button>
              <button
                type="button"
                onClick={() => handleSendAiMessage(`What is the optimal timing window for this protocol stack?`)}
                className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-950/80 text-teal-300 border border-teal-700/60 hover:bg-teal-900 transition cursor-pointer"
              >
                ⏰ Optimal Timing Window?
              </button>
            </div>

            {/* Chat Input Field */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <input
                type="text"
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendAiMessage()}
                placeholder="Ask AI Coach guidance for this protocol..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => handleSendAiMessage()}
                disabled={isAiLoading || !aiInput.trim()}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold transition cursor-pointer shrink-0"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        ) : (
          /* TAB 1: Adjust Protocol & Scope Selection */
          <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
            
            {/* Scope Selection: Entire Protocol vs Specific Modalities */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Target Scope
              </label>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setScope('all')
                    setSelectedModalityIds(new Set(activeModalityIds))
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    scope === 'all'
                      ? 'bg-purple-950/60 border-purple-500/80 text-white shadow-md'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    <Layers size={14} className={scope === 'all' ? 'text-purple-400' : 'text-slate-500'} />
                    <span>Entire Protocol</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Apply to all {activeModalityIds.length} active modalities
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setScope('custom')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    scope === 'custom'
                      ? 'bg-purple-950/60 border-purple-500/80 text-white shadow-md'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    <Check size={14} className={scope === 'custom' ? 'text-purple-400' : 'text-slate-500'} />
                    <span>Select Modalities</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Choose 1 to several items
                  </div>
                </button>
              </div>
            </div>

            {/* SECTION 1: Active Modalities Checkbox List */}
            {scope === 'custom' && (
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                  <span>Active Modalities in Stack:</span>
                  <span className="text-[10px] text-slate-500 font-mono">Uncheck to remove/bench</span>
                </span>

                <div className="space-y-1.5 max-h-48 overflow-y-auto p-2 bg-slate-900/80 border border-slate-800 rounded-xl">
                  {groupTasks.map((task) => {
                    const modality = task.protocol_step?.modality || task.loose_modality
                    if (!modality) return null
                    const isChecked = selectedModalityIds.has(modality.id)

                    return (
                      <label 
                        key={task.id}
                        onClick={() => toggleModality(modality.id)}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isChecked 
                            ? 'bg-purple-950/40 border-purple-700/60 text-white' 
                            : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <span className="font-medium truncate">{modality.display_name || modality.name}</span>
                          {task.timing_slot && (
                            <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 shrink-0 capitalize">
                              {task.timing_slot.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                        <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                          isChecked ? 'bg-purple-600 border-purple-400 text-white' : 'border-slate-700 bg-slate-900'
                        }`}>
                          {isChecked && <Check size={11} strokeWidth={3} />}
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}

            {/* SECTION 2: Original Protocol Removed Blueprint Steps (Add Back Option) */}
            {removedBlueprintSteps.length > 0 && (
              <div className="space-y-2 p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <RotateCcw size={13} /> Original Blueprint Steps (Removed)
                  </span>
                  <span className="text-[10px] text-amber-400/80 font-mono">{removedBlueprintSteps.length} available</span>
                </div>

                <div className="space-y-2 pt-1">
                  {removedBlueprintSteps.map((step) => {
                    const modName = step.modality?.display_name || step.modality?.name || 'Modality Step'
                    const modId = step.modality?.id || step.modality_id
                    if (!modId) return null

                    return (
                      <div 
                        key={step.id} 
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-xs"
                      >
                        <div className="truncate pr-2">
                          <div className="font-bold text-white truncate">{modName}</div>
                          {step.timing_slot && (
                            <div className="text-[10px] text-slate-400 capitalize">
                              Original timing: {step.timing_slot.replace(/_/g, ' ')}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddModalityToToday(modId, modName)}
                          disabled={addingModalityId === modId}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-[11px] transition cursor-pointer shrink-0 flex items-center gap-1 active:scale-95 disabled:opacity-50"
                        >
                          <Plus size={12} /> {addingModalityId === modId ? 'Adding...' : 'Add Back'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* SECTION 3: Synergistic Recommendations (Loose Modalities / Library) */}
            <div className="space-y-2 p-3 bg-indigo-950/30 border border-indigo-500/30 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Zap size={13} className="text-indigo-400" /> Recommended Synergistic Additions
                </span>
                <span className="text-[10px] text-indigo-400/80 font-mono">Matched to protocol</span>
              </div>

              <div className="space-y-2 pt-1">
                {synergyRecs.map((rec, idx) => (
                  <div 
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-bold text-white text-xs truncate">{rec.name}</div>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono text-[9px] shrink-0 font-bold">
                        {rec.badge}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-tight">
                      {rec.reason}
                    </p>

                    <div className="pt-1.5 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          const matchedMod = allModalities.find(m => m.name.toLowerCase().includes(rec.name.toLowerCase().split(' ')[0]))
                          if (matchedMod) {
                            handleAddModalityToToday(matchedMod.id, rec.name)
                          } else if (allModalities.length > 0) {
                            handleAddModalityToToday(allModalities[0].id, rec.name)
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 font-bold text-[10px] transition cursor-pointer flex items-center gap-1 active:scale-95"
                      >
                        <Plus size={11} /> Add to Protocol
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reasons Selection Pills */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 block">
                Why are you {actionType === 'eliminate' ? 'eliminating' : 'benching'} {scope === 'all' ? 'this protocol' : 'these modalities'}? (Optional)
              </label>

              <div className="flex flex-wrap gap-1.5">
                {COMMON_REASONS.map((reason) => {
                  const isSelected = selectedReasons.includes(reason)
                  return (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => toggleReason(reason)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                        isSelected
                          ? actionType === 'eliminate'
                            ? 'bg-red-950/80 text-red-300 border-red-600/80 shadow-[0_0_8px_rgba(239,68,68,0.2)]'
                            : 'bg-purple-950/80 text-purple-300 border-purple-600/80 shadow-[0_0_8px_rgba(168,85,247,0.2)]'
                          : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        {reason}
                        {isSelected && <Check size={11} />}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Custom Notes Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 block">
                Additional Notes or Custom Explanation
              </label>
              <textarea
                value={customReason}
                onChange={e => setCustomReason(e.target.value)}
                placeholder="e.g. Pausing for travel; replacing with Zone 2 HIIT..."
                rows={2}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/80 transition"
              />
            </div>

            {/* Action Toolbar */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={isProcessing || (scope === 'custom' && selectedModalityIds.size === 0)}
                className={`w-full py-3 px-4 rounded-xl font-extrabold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg disabled:opacity-50 ${
                  actionType === 'eliminate'
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
                }`}
              >
                {actionType === 'eliminate' ? (
                  <>
                    <Trash2 size={14} /> Confirm Elimination ({scope === 'all' ? 'All' : selectedModalityIds.size})
                  </>
                ) : (
                  <>
                    <Archive size={14} /> Confirm Move to Bench ({scope === 'all' ? 'All' : selectedModalityIds.size})
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer text-center"
                >
                  Cancel
                </button>

                {actionType === 'eliminate' ? (
                  <button
                    type="button"
                    onClick={() => setActionType('bench')}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-purple-950/90 hover:bg-purple-900 text-purple-200 font-bold text-xs border border-purple-700/80 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Archive size={14} /> Move to Bench Instead
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActionType('eliminate')}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-red-950/90 hover:bg-red-900 text-red-200 font-bold text-xs border border-red-700/80 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Trash2 size={14} /> Eliminate Entirely Instead
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

