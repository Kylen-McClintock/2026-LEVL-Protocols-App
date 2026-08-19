'use client'

import { Send, Bot, User, Sparkles, FileSignature, CheckCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { lastAssistantMessageIsCompleteWithToolCalls, DefaultChatTransport, UIMessage } from 'ai'
import { getLocalUserId } from '@/lib/local-user/getLocalUserId'
import { ProfileInlineEditor } from '@/components/ProfileInlineEditor'
import ExploreCard from '@/components/cards/ExploreCard'
import ProtocolCard from '@/components/cards/ProtocolCard'
import { UserProfile } from '@/lib/types'
import { getLatestBiomarkerMeasurements, getUserLabPanels } from '@/lib/data/bloodworkData'
import { getBiologicalMeasurements } from '@/lib/data/physiologicalAgeData'
import { getOrCreateUserProfile, getBenchItems, getDailyProtocolTasks, getDailyWellbeingCheckin, addToBench, addProtocolToBench, addProtocolToToday, createDailyTask } from '@/lib/data'

export default function CoachPage() {
  const [input, setInput] = useState('')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [clientContextData, setClientContextData] = useState<any>(null)
  const contextRef = useRef<any>(null)
  
  useEffect(() => {
    const loadFullContext = async () => {
      const localId = getLocalUserId()
      const todayStr = new Date().toISOString().split('T')[0]
      try {
        const [prof, panels, biomarkers, bioMeas, benchItems, todayTasks, checkin] = await Promise.all([
          getOrCreateUserProfile(localId),
          getUserLabPanels(localId),
          getLatestBiomarkerMeasurements(localId),
          getBiologicalMeasurements(localId),
          getBenchItems(localId),
          getDailyProtocolTasks(localId, todayStr),
          getDailyWellbeingCheckin(localId, todayStr)
        ])
        setProfile(prof)

        const payload = {
          profile: prof,
          panels: panels || [],
          biomarkers: biomarkers || [],
          biologicalMeasurements: bioMeas || [],
          benchItems: benchItems || [],
          todayTasks: todayTasks || [],
          checkin: checkin || null
        }
        setClientContextData(payload)
        contextRef.current = payload
      } catch (err) {
        console.warn('Error assembling client context for AI Coach:', err)
      }
    }

    loadFullContext()
  }, [])

  const { messages, sendMessage, status, error, addToolOutput } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: () => ({
        localUserId: typeof window !== 'undefined' ? getLocalUserId() : '',
        clientContext: contextRef.current || clientContextData
      }),
    }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    messages: [
      {
        id: '1',
        role: 'assistant',
        parts: [{ type: 'text', text: "Hi! I'm your LEVL AI Coach. I have access to your full database of modalities and clinical evidence. How can I help you optimize your health and performance today?" }]
      }
    ] as UIMessage[]
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

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

  const suggestedPrompts = [
    "What protocol should I use for ApoB and cardiovascular health?",
    "Recommend a protocol to optimize deep sleep & caffeine timing",
    "Which protocol clears senescent zombie cells and triggers stem cells?",
    "How can I flatten my postprandial glucose spikes with Casey Means' protocol?"
  ]

  const handleAddModalityToBench = async (modalityId: string) => {
    await addToBench(getLocalUserId(), modalityId)
  }

  const handleAddModalityToToday = async (modalityId: string) => {
    const dateStr = new Date().toISOString().split('T')[0]
    await createDailyTask(getLocalUserId(), dateStr, modalityId)
  }

  const handleAddProtocolToBench = async (protocolId: string) => {
    await addProtocolToBench(getLocalUserId(), protocolId)
  }

  const handleAddProtocolToToday = async (protocolId: string) => {
    const dateStr = new Date().toISOString().split('T')[0]
    await addProtocolToToday(getLocalUserId(), dateStr, protocolId)
  }

  return (
    <div className="flex flex-col h-screen bg-transparent p-4 md:p-8 pt-8 overflow-hidden">
      
      {/* Header */}
      <div className="flex-none mb-6 flex items-center space-x-3">
        <div className="p-2 bg-levl-accent/20 text-levl-accent rounded-full border border-levl-accent/30">
          <Bot size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">LEVL Longevity Coach</h1>
          <p className="text-xs text-levl-text-secondary uppercase tracking-widest flex items-center">
            <Sparkles size={10} className="mr-1 text-levl-accent" />
            AI-Powered Optimization
          </p>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-6 mb-4 pr-2 scrollbar-hide pb-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm flex items-center space-x-2">
            <span>⚠️ API Error: {error.message}. Please try again or refresh the page.</span>
          </div>
        )}
        {messages.map((m) => (
          <div 
            key={m.id} 
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[85%] md:max-w-[70%] space-x-3 ${m.role === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
              
              {/* Avatar */}
              <div className="flex-shrink-0 mt-1">
                {m.role === 'assistant' ? (
                  <div className="p-1.5 bg-levl-surface rounded-full border border-levl-border shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                    <Bot size={16} className="text-levl-accent" />
                  </div>
                ) : (
                  <div className="p-1.5 bg-levl-text-secondary/20 rounded-full border border-levl-border">
                    <User size={16} className="text-white" />
                  </div>
                )}
              </div>

              {/* Message Content Container */}
              <div className="flex flex-col space-y-2 max-w-full">
                
                {/* Parts Mapping (Vercel AI SDK 6.0+) */}
                {(m as any).parts?.map((part: any, index: number) => {
                  switch (part.type) {
                    case 'text':
                      return (
                        <div 
                          key={index}
                          className={`p-4 rounded-2xl text-sm leading-relaxed ${
                            m.role === 'user' 
                              ? 'bg-levl-accent text-white rounded-tr-sm shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
                              : 'bg-levl-surface border border-levl-border text-levl-text-primary rounded-tl-sm shadow-xl'
                          }`}
                        >
                          <div className="prose prose-invert prose-sm max-w-none">
                            {part.text.split('\n').map((line: string, i: number) => (
                              <p key={i} className="min-h-[1rem] my-1">
                                {line.split(/(\*\*.*?\*\*)/).map((p: string, j: number) => {
                                  if (p.startsWith('**') && p.endsWith('**')) {
                                    return <strong key={j} className="text-white">{p.slice(2, -2)}</strong>
                                  }
                                  return p
                                })}
                              </p>
                            ))}
                          </div>
                        </div>
                      )

                    case 'tool-search_database': {
                      const callId = part.toolCallId;
                      const isDone = part.state === 'output-available' || part.state === 'output-error';
                      return (
                        <div key={callId} className="bg-levl-surface border border-levl-border rounded-lg p-3 mt-2 max-w-sm">
                          <div className="flex items-center space-x-2 text-levl-text-secondary mb-1">
                            <Sparkles size={14} className={isDone ? 'text-green-400' : 'animate-pulse'} />
                            <span className="text-xs font-semibold uppercase tracking-wider">
                              {isDone ? 'Database Search Complete' : 'Searching Database...'}
                            </span>
                          </div>
                          {part.input && (
                            <div className="text-xs text-white/70 font-mono bg-black/20 p-2 rounded">
                              Query: "{part.input.query || '...'}"
                            </div>
                          )}
                          {part.state === 'output-available' && part.output?.results && (
                            <div className="mt-2 text-xs text-levl-text-secondary">
                              Found {part.output.results.length} matches.
                            </div>
                          )}
                          {(part.state === 'output-error' || (part.state === 'output-available' && part.output?.error)) && (
                            <div className="mt-2 text-xs text-red-400">
                              Error: {part.errorText || part.output?.error}
                            </div>
                          )}
                        </div>
                      )
                    }

                    case 'tool-update_profile_inline': {
                      const callId = part.toolCallId;
                      const isDone = part.state === 'output-available' || part.state === 'output-error';
                      return (
                        <div key={callId}>
                          <ProfileInlineEditor 
                            message={part.input?.message || 'Please update your preferences below so I can better personalize your recommendations.'} 
                            onComplete={() => {
                              if (!isDone && addToolOutput) {
                                addToolOutput({ tool: 'update_profile_inline', toolCallId: callId, output: { success: true } })
                              }
                            }} 
                          />
                        </div>
                      )
                    }

                    case 'tool-ask_user_options': {
                      const callId = part.toolCallId;
                      const isDone = part.state === 'output-available' || part.state === 'output-error';
                      return (
                        <div key={callId} className="bg-levl-surface border border-levl-border rounded-xl p-4 w-full mt-2 shadow-sm">
                           <p className="text-white text-sm mb-3">{part.input?.question}</p>
                           {!isDone ? (
                             <div className="flex flex-wrap gap-2">
                               {part.input?.options?.map((opt: string) => (
                                 <button 
                                   key={opt}
                                   className="px-4 py-2 bg-levl-accent/20 hover:bg-levl-accent/40 text-levl-accent text-xs rounded-lg transition border border-levl-accent/30"
                                   onClick={() => {
                                      if (addToolOutput) addToolOutput({ tool: 'ask_user_options', toolCallId: callId, output: { answer: opt } })
                                   }}
                                 >
                                    {opt}
                                 </button>
                               ))}
                             </div>
                           ) : (
                             <div className="text-levl-text-secondary text-xs italic">Response recorded.</div>
                           )}
                        </div>
                      )
                    }

                    case 'tool-create_modality_draft':
                    case 'tool-present_modality': {
                      const callId = part.toolCallId;
                      const isDone = part.state === 'output-available' || part.state === 'output-error';
                      if (!isDone) return (
                        <div key={callId} className="mt-2 text-xs text-levl-text-secondary flex items-center gap-1 animate-pulse">
                           <Sparkles size={12} /> <span>Preparing modality card...</span>
                        </div>
                      )
                      
                      const modality = part.output?.modality || part.output?.data
                      if (!modality) return null
                      
                      return (
                        <div key={callId} className="mt-4 max-w-md w-full">
                          <ExploreCard 
                            modality={modality} 
                            userProfile={profile} 
                            onAddToBench={handleAddModalityToBench} 
                            onAddToToday={handleAddModalityToToday} 
                          />
                          {part.type === 'tool-create_modality_draft' && (
                            <div className="mt-2 text-xs text-green-400 flex items-center space-x-1">
                              <CheckCircle size={12} />
                              <span>Draft successfully submitted for review.</span>
                            </div>
                          )}
                        </div>
                      )
                    }

                    case 'tool-create_protocol_draft':
                    case 'tool-present_protocol': {
                      const callId = part.toolCallId;
                      const isDone = part.state === 'output-available' || part.state === 'output-error';
                      if (!isDone) return (
                        <div key={callId} className="mt-2 text-xs text-levl-text-secondary flex items-center gap-1 animate-pulse">
                           <Sparkles size={12} /> <span>Preparing protocol card...</span>
                        </div>
                      )
                      
                      const protocol = part.output?.protocol || part.output?.data
                      if (!protocol) return null
                      
                      return (
                        <div key={callId} className="mt-4 max-w-md w-full">
                          <ProtocolCard 
                            protocol={protocol} 
                            onAddToBench={handleAddProtocolToBench} 
                            onAddToToday={handleAddProtocolToToday} 
                          />
                          {part.type === 'tool-create_protocol_draft' && (
                            <div className="mt-2 text-xs text-green-400 flex items-center space-x-1">
                              <CheckCircle size={12} />
                              <span>Draft successfully submitted for review.</span>
                            </div>
                          )}
                        </div>
                      )
                    }

                    default:
                      return null;
                  }
                })}

                {/* Loading indicator if no content yet and waiting for response */}
                {isLoading && m.role === 'assistant' && (!m.parts || m.parts.length === 0) && (
                  <div className={`p-4 rounded-2xl bg-levl-surface border border-levl-border rounded-tl-sm w-16`}>
                    <div className="flex items-center space-x-1 h-4">
                      <div className="w-2 h-2 rounded-full bg-levl-accent/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-levl-accent/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-levl-accent/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {/* Loading indicator for when AI is processing but hasn't appended a new message yet */}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex justify-start">
            <div className="flex space-x-3">
              <div className="flex-shrink-0 mt-1">
                <div className="p-1.5 bg-levl-surface rounded-full border border-levl-border shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                  <Bot size={16} className="text-levl-accent" />
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-levl-surface border border-levl-border rounded-tl-sm w-16">
                <div className="flex items-center space-x-1 h-4">
                  <div className="w-2 h-2 rounded-full bg-levl-accent/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-levl-accent/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-levl-accent/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer Area (Prompts + Input) */}
      <div className="flex-none pt-2 pb-[80px] md:pb-4 flex flex-col space-y-4">
        {/* Suggested Prompts */}
        {messages.length < 3 && (
          <div className="flex overflow-x-auto space-x-2 pb-1 scrollbar-hide">
            {suggestedPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handlePromptClick(prompt)}
                className="flex-shrink-0 text-xs px-4 py-2 rounded-full bg-levl-surface border border-levl-border text-levl-text-secondary hover:text-white hover:border-levl-accent transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input Form */}
        <form 
          onSubmit={handleSendSubmit}
          className="flex items-center glass-card border border-levl-border rounded-full p-1 pl-4 relative"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your AI Coach..."
            className="flex-1 bg-transparent border-none text-sm text-white placeholder-levl-text-secondary focus:outline-none focus:ring-0"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-3 bg-levl-accent text-white rounded-full hover:bg-levl-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </button>
        </form>
      </div>

    </div>
  )
}

function AIProposedDraftCard({ draft, type }: { draft: any, type: 'modality' | 'protocol' }) {
  if (!draft) return null;
  return (
    <div className="bg-levl-surface border border-levl-border rounded-lg p-4 mt-2 max-w-sm">
      <h3 className="text-sm font-semibold text-white mb-2">
        {type === 'modality' ? 'New Modality Draft' : 'New Protocol Draft'}
      </h3>
      <div className="space-y-1 text-xs text-levl-text-secondary">
        <p><strong className="text-levl-text-primary">Name:</strong> {draft.name}</p>
        <p><strong className="text-levl-text-primary">Category:</strong> {draft.category || 'N/A'}</p>
        <p className="line-clamp-2"><strong className="text-levl-text-primary">Description:</strong> {draft.brief_description || draft.summary}</p>
      </div>
    </div>
  )
}
