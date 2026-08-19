'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Bot, Send, Sparkles, ChevronDown, ChevronUp, MessageSquare, Activity, ShieldCheck, CheckCircle, User } from 'lucide-react'
import { useChat } from '@ai-sdk/react'
import { lastAssistantMessageIsCompleteWithToolCalls, DefaultChatTransport, UIMessage } from 'ai'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import ExploreCard from '@/components/cards/ExploreCard'
import ProtocolCard from '@/components/cards/ProtocolCard'
import { addToBench, addProtocolToBench, addProtocolToToday, createDailyTask } from '@/lib/data'

interface MinimalistAgingCoachProps {
  profile?: any
  panels?: any[]
  biomarkers?: any[]
  calicoMeasurements?: any[]
  systemStatuses?: any[]
  latestBioAge?: any
}

export default function MinimalistAgingCoach({
  profile,
  panels = [],
  biomarkers = [],
  calicoMeasurements = [],
  systemStatuses = [],
  latestBioAge
}: MinimalistAgingCoachProps) {
  const [input, setInput] = useState('')
  const [isExpanded, setIsExpanded] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const contextData = {
    profile,
    panels,
    biomarkers,
    biologicalMeasurements: calicoMeasurements,
    systemStatuses,
    latestBioAge
  }

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: () => ({
        localUserId: typeof window !== 'undefined' ? getLocalUserId() : '',
        clientContext: contextData
      }),
    }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    messages: [
      {
        id: 'aging_init',
        role: 'assistant',
        parts: [{ 
          type: 'text', 
          text: "👋 Hi! I'm your Biological Aging AI Coach. Ask me anything about your lab results, PhenoAge, KDM age gaps, or what modalities will optimize your 8 biological systems!" 
        }]
      }
    ] as UIMessage[]
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  useEffect(() => {
    if (isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading, isExpanded])

  const handlePromptClick = (prompt: string) => {
    if (isLoading) return
    sendMessage({ text: prompt })
  }

  const handleSendSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput('')
  }

  const quickPrompts = [
    "Analyze my latest lab panel & biological age gaps",
    "What modalities will help optimize my bloodwork?",
    "Explain my PhenoAge vs KDM biological age",
    "How can I lower systemic hs-CRP inflammation?"
  ]

  const handleAddModalityToBench = async (id: string) => {
    await addToBench(getLocalUserId(), id)
  }

  const handleAddModalityToToday = async (id: string) => {
    const dateStr = new Date().toISOString().split('T')[0]
    await createDailyTask(getLocalUserId(), dateStr, id)
  }

  const handleAddProtocolToBench = async (id: string) => {
    await addProtocolToBench(getLocalUserId(), id)
  }

  const handleAddProtocolToToday = async (id: string) => {
    const dateStr = new Date().toISOString().split('T')[0]
    await addProtocolToToday(getLocalUserId(), dateStr, id)
  }

  return (
    <div className="bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-black border border-indigo-500/30 rounded-3xl p-5 shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between cursor-pointer border-b border-indigo-500/20 pb-3" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
            <Bot size={20} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-extrabold text-white text-base tracking-wide">Biological Aging AI Coach</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Connected to Your Labs
              </span>
            </div>
            <p className="text-xs text-gray-400">Discuss your bloodwork, PhenoAge, and biological system optimizations inline</p>
          </div>
        </div>

        <button className="text-gray-400 hover:text-white p-1 rounded-lg transition">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4 pt-1">
          {/* Quick Prompts */}
          {messages.length <= 2 && (
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePromptClick(prompt)}
                  disabled={isLoading}
                  className="text-xs px-3 py-1.5 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition-all font-medium flex items-center gap-1.5"
                >
                  <Sparkles size={12} className="text-indigo-400" />
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Messages Window */}
          <div className="max-h-[360px] overflow-y-auto space-y-4 pr-1 text-xs scrollbar-hide">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl">
                ⚠️ API Connection issue: {error.message}. Please try asking again.
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[90%] md:max-w-[80%] space-x-2.5 ${m.role === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
                  <div className="flex-shrink-0 mt-0.5">
                    {m.role === 'assistant' ? (
                      <div className="p-1 bg-indigo-900/60 rounded-full border border-indigo-500/40 text-indigo-300">
                        <Bot size={14} />
                      </div>
                    ) : (
                      <div className="p-1 bg-gray-800 rounded-full border border-gray-700 text-gray-300">
                        <User size={14} />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2">
                    {(m as any).parts?.map((part: any, idx: number) => {
                      if (part.type === 'text') {
                        return (
                          <div
                            key={idx}
                            className={`p-3 rounded-2xl leading-relaxed text-xs ${
                              m.role === 'user'
                                ? 'bg-indigo-600 text-white rounded-tr-none'
                                : 'bg-black/60 border border-white/10 text-gray-200 rounded-tl-none'
                            }`}
                          >
                            <div className="prose prose-invert prose-xs max-w-none">
                              {part.text.split('\n').map((line: string, i: number) => (
                                <p key={i} className="my-0.5">
                                  {line.split(/(\*\*.*?\*\*)/).map((p: string, j: number) => {
                                    if (p.startsWith('**') && p.endsWith('**')) {
                                      return <strong key={j} className="text-white font-bold">{p.slice(2, -2)}</strong>
                                    }
                                    return p
                                  })}
                                </p>
                              ))}
                            </div>
                          </div>
                        )
                      }

                      if (part.type === 'tool-present_modality' || part.type === 'tool-create_modality_draft') {
                        const modality = part.output?.modality || part.output?.data
                        if (!modality) return null
                        return (
                          <div key={idx} className="mt-2 max-w-sm">
                            <ExploreCard 
                              modality={modality} 
                              userProfile={profile} 
                              onAddToBench={handleAddModalityToBench} 
                              onAddToToday={handleAddModalityToToday} 
                            />
                          </div>
                        )
                      }

                      if (part.type === 'tool-present_protocol' || part.type === 'tool-create_protocol_draft') {
                        const protocol = part.output?.protocol || part.output?.data
                        if (!protocol) return null
                        return (
                          <div key={idx} className="mt-2 max-w-sm">
                            <ProtocolCard 
                              protocol={protocol} 
                              onAddToBench={handleAddProtocolToBench} 
                              onAddToToday={handleAddProtocolToToday} 
                            />
                          </div>
                        )
                      }

                      return null
                    })}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex justify-start items-center space-x-2 text-indigo-400 text-xs italic animate-pulse">
                <Bot size={14} />
                <span>Analyzing your bloodwork & biological age metrics...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSendSubmit} className="flex items-center bg-black/80 border border-white/20 rounded-full p-1.5 pl-4 focus-within:border-indigo-400">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask AI Coach about your bloodwork or system ages..."
              className="flex-1 bg-transparent border-none text-xs text-white placeholder-gray-500 focus:outline-none"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
