'use client'

import { useState, useEffect } from 'react'
import { Modality, Protocol, ProtocolStep, UserBenchItem } from '@/lib/types'
import { X, Save, AlertTriangle, Plus, Search, Trash2, Sparkles } from 'lucide-react'
import { updateModalityDraft, updateProtocolDraft, createManualModality, createManualProtocol, getModalities, getBenchItems } from '@/lib/data'
import ModalityIcon from '@/components/ui/ModalityIcon'
import { assessModalityOrProtocol, ICON_COLOR_PRESETS, AVAILABLE_ICONS } from '@/lib/utils/iconAssessmentEngine'

type DraftEditorModalProps = {
  isOpen: boolean
  onClose: () => void
  item: Modality | Protocol | null
  type: 'modality' | 'protocol'
  localUserId: string
  onSaveSuccess: () => void
}

export default function DraftEditorModal({ isOpen, onClose, item, type, localUserId, onSaveSuccess }: DraftEditorModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [dose, setDose] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Icon & Color Assessment State
  const [assessedIcon, setAssessedIcon] = useState<string>('Target')
  const [assessedColor, setAssessedColor] = useState<string>('#38BDF8')
  const [isExistingMatch, setIsExistingMatch] = useState<boolean>(false)
  const [matchReason, setMatchReason] = useState<string>('')
  const [userCustomizedIcon, setUserCustomizedIcon] = useState<boolean>(false)

  // Real-time assessment of icon and color
  useEffect(() => {
    if (userCustomizedIcon) return
    const assessment = assessModalityOrProtocol({
      name,
      description,
      type
    })
    setAssessedIcon(assessment.iconName)
    setAssessedColor(assessment.colorHex)
    setIsExistingMatch(assessment.isExistingMatch)
    setMatchReason(assessment.matchReason)
  }, [name, description, type, userCustomizedIcon])

  // Protocol Steps State
  const [steps, setSteps] = useState<Partial<ProtocolStep>[]>([])
  const [availableModalities, setAvailableModalities] = useState<Modality[]>([])
  const [benchItems, setBenchItems] = useState<UserBenchItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (isOpen && type === 'protocol') {
      const loadData = async () => {
        const [mods, bench] = await Promise.all([
          getModalities(),
          getBenchItems(localUserId)
        ])
        setAvailableModalities(mods)
        setBenchItems(bench)
      }
      loadData()
    }
  }, [isOpen, type, localUserId])

  useEffect(() => {
    if (item) {
      setName(item.name || '')
      if (type === 'modality') {
        setDescription((item as Modality).brief_description || '')
        setDose((item as Modality).dose_or_exposure || '')
      } else {
        setDescription((item as Protocol).description || '')
        setSteps((item as Protocol).steps || [])
      }
    } else {
      setName('')
      setDescription('')
      setDose('')
      setSteps([])
    }
    setSearchQuery('')
    setIsSearching(false)
  }, [item, type])

  if (!isOpen) return null

  const handleSave = async () => {
    setIsSaving(true)
    if (type === 'modality') {
      if (item) {
        await updateModalityDraft(item.id, { name, brief_description: description, dose_or_exposure: dose, icon: assessedIcon, color_hex: assessedColor })
      } else {
        await createManualModality(localUserId, { name, brief_description: description, dose_or_exposure: dose, icon: assessedIcon, color_hex: assessedColor })
      }
    } else {
      // Pass steps array to the backend logic (to be handled in data/index.ts)
      if (item) {
        await updateProtocolDraft(item.id, { name, description, icon: assessedIcon, color_hex: assessedColor }, steps)
      } else {
        await createManualProtocol(localUserId, { name, description, icon: assessedIcon, color_hex: assessedColor }, steps)
      }
    }
    setIsSaving(false)
    onSaveSuccess()
    onClose()
  }

  const handleAddStep = (modality: Modality) => {
    setSteps([...steps, { modality_id: modality.id, modality } as Partial<ProtocolStep>])
    setSearchQuery('')
    setIsSearching(false)
  }

  const handleUpdateStep = (index: number, updates: Partial<ProtocolStep>) => {
    const newSteps = [...steps]
    newSteps[index] = { ...newSteps[index], ...updates }
    setSteps(newSteps)
  }

  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index))
  }

  const benchedModalityIds = new Set(benchItems.map(b => b.modality_id))
  
  const searchResults = searchQuery.trim() === '' ? [] : availableModalities.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
    !steps.some(s => s.modality_id === m.id)
  ).sort((a, b) => {
    const aBenched = benchedModalityIds.has(a.id)
    const bBenched = benchedModalityIds.has(b.id)
    if (aBenched && !bBenched) return -1
    if (!aBenched && bBenched) return 1
    return 0
  }).slice(0, 5)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-[#111111] border border-levl-border rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-levl-border flex justify-between items-center bg-levl-surface rounded-t-2xl">
          <h2 className="text-xl font-bold text-white">
            {item ? `Edit ${type === 'modality' ? 'Modality' : 'Protocol'}` : `Create New ${type === 'modality' ? 'Modality' : 'Protocol'}`}
          </h2>
          <button onClick={onClose} className="text-levl-text-secondary hover:text-white p-1 rounded-full hover:bg-levl-surface-highlight">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div>
            <label className="block text-sm font-medium text-levl-text-primary mb-1">Name</label>
            <input 
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-levl-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-levl-accent"
              placeholder="e.g. Laser Eye Therapy"
            />
          </div>

          {/* Smart Icon & Color Assessment Card */}
          <div className="p-3.5 bg-black/50 border border-white/10 rounded-xl space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-400" />
                <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider">Icon & Color Assessment</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                isExistingMatch 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                  : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
              }`}>
                {isExistingMatch ? '⚡ Matched Existing Icon' : '✨ Assigned New Distinct Icon'}
              </span>
            </div>

            <div className="flex items-center gap-3 bg-[#1A1A1A] p-2.5 rounded-lg border border-white/5">
              <div className="w-10 h-10 rounded-lg bg-black/60 flex items-center justify-center border border-white/10 shrink-0">
                <ModalityIcon customIcon={assessedIcon} customColor={assessedColor} size={22} glow={true} isIgnited={true} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white truncate">{assessedIcon}</span>
                  <span className="w-2.5 h-2.5 rounded-full border border-white/30 shrink-0" style={{ backgroundColor: assessedColor }} />
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{matchReason}</p>
              </div>
              {userCustomizedIcon && (
                <button
                  type="button"
                  onClick={() => setUserCustomizedIcon(false)}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 underline shrink-0 cursor-pointer"
                >
                  Reset Auto
                </button>
              )}
            </div>

            {/* Color Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-gray-400 mr-1">Color:</span>
              {ICON_COLOR_PRESETS.map((p) => {
                const isSelected = assessedColor === p.hex
                return (
                  <button
                    type="button"
                    key={p.hex}
                    onClick={() => {
                      setAssessedColor(p.hex)
                      setUserCustomizedIcon(true)
                    }}
                    className={`w-4 h-4 rounded-md transition-transform cursor-pointer border ${
                      isSelected ? 'scale-125 border-white ring-1 ring-white/30' : 'border-transparent opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: p.hex }}
                    title={p.label}
                  />
                )
              })}
            </div>

            {/* Icon Dropdown */}
            <select
              value={assessedIcon}
              onChange={(e) => {
                setAssessedIcon(e.target.value)
                setUserCustomizedIcon(true)
              }}
              className="w-full bg-[#1A1A1A] border border-white/10 text-xs text-white rounded-lg px-2.5 py-1.5 outline-none focus:border-cyan-500 cursor-pointer"
            >
              <optgroup label="Existing System Glyphs">
                {AVAILABLE_ICONS.filter(i => i.category === 'existing').map(i => (
                  <option key={i.name} value={i.name}>{i.label}</option>
                ))}
              </optgroup>
              <optgroup label="New Distinct Icons">
                {AVAILABLE_ICONS.filter(i => i.category === 'new').map(i => (
                  <option key={i.name} value={i.name}>{i.label}</option>
                ))}
              </optgroup>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-levl-text-primary mb-1">Description</label>
            <textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              className="w-full bg-[#1A1A1A] border border-levl-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-levl-accent resize-none"
              placeholder="Briefly describe what this is..."
            />
          </div>

          {type === 'modality' && (
            <div>
              <label className="block text-sm font-medium text-levl-text-primary mb-1">Dose / Exposure</label>
              <input 
                value={dose}
                onChange={e => setDose(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-levl-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-levl-accent"
                placeholder="e.g. 5 minutes at 600nm"
              />
            </div>
          )}

          {type === 'protocol' && (
            <div className="mt-6 border-t border-levl-border pt-6">
              <label className="block text-sm font-medium text-levl-text-primary mb-3">Protocol Steps</label>
              
              <div className="space-y-3 mb-4">
                {steps.length === 0 ? (
                  <p className="text-sm text-levl-text-secondary italic">No steps added yet.</p>
                ) : (
                  steps.map((step, idx) => (
                    <div key={idx} className="bg-levl-surface-highlight border border-levl-border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-white">{step.modality?.name || 'Unknown Modality'}</span>
                        <button onClick={() => handleRemoveStep(idx)} className="text-levl-text-secondary hover:text-red-400 p-1">
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <label className="text-[10px] text-levl-text-secondary uppercase">Custom Dose</label>
                          <input 
                            value={step.dose_text || ''}
                            onChange={(e) => handleUpdateStep(idx, { dose_text: e.target.value })}
                            placeholder={step.modality?.dose_or_exposure || "e.g. 5g"}
                            className="w-full bg-black/40 border border-white/5 rounded px-2 py-1 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-levl-text-secondary uppercase">Custom Timing</label>
                          <input 
                            value={step.timing_slot || ''}
                            onChange={(e) => handleUpdateStep(idx, { timing_slot: e.target.value })}
                            placeholder={step.modality?.frequency || "e.g. Morning"}
                            className="w-full bg-black/40 border border-white/5 rounded px-2 py-1 text-xs text-white"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] text-levl-text-secondary uppercase">Study Link (Optional)</label>
                          <input 
                            value={step.notes || ''}
                            onChange={(e) => handleUpdateStep(idx, { notes: e.target.value })}
                            placeholder="https://pubmed.ncbi.nlm.nih.gov/..."
                            className="w-full bg-black/40 border border-white/5 rounded px-2 py-1 text-xs text-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="relative">
                <div className="flex items-center bg-[#1A1A1A] border border-levl-border rounded-lg px-3 py-2">
                  <Search size={16} className="text-levl-text-secondary mr-2" />
                  <input 
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setIsSearching(true); }}
                    onFocus={() => setIsSearching(true)}
                    className="w-full bg-transparent text-white focus:outline-none text-sm"
                    placeholder="Search global & saved modalities..."
                  />
                </div>
                
                {isSearching && searchQuery.trim() !== '' && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#1A1A1A] border border-levl-border rounded-lg shadow-xl overflow-hidden z-10 max-h-48 overflow-y-auto">
                    {searchResults.length === 0 ? (
                      <div className="p-3 text-sm text-levl-text-secondary text-center">No modalities found.</div>
                    ) : (
                      searchResults.map(m => (
                        <button
                          key={m.id}
                          onClick={() => handleAddStep(m)}
                          className="w-full text-left px-3 py-2 hover:bg-levl-surface-highlight flex justify-between items-center border-b border-levl-border last:border-0"
                        >
                          <span className="text-sm text-white">{m.name}</span>
                          {benchedModalityIds.has(m.id) && (
                            <span className="text-[9px] bg-levl-accent/20 text-levl-accent px-1.5 py-0.5 rounded uppercase">Saved</span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-start space-x-3 mt-6">
            <AlertTriangle className="text-blue-400 mt-0.5 flex-shrink-0" size={16} />
            <div className="text-xs text-blue-200/80">
              <span className="block font-medium text-blue-400 mb-1">Private by default</span>
              This item will only be visible to you unless you explicitly choose to publish it globally for researcher review later.
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-levl-border flex justify-end bg-levl-surface rounded-b-2xl">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm text-levl-text-secondary hover:text-white mr-2"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
            className="flex items-center px-6 py-2 text-sm font-medium bg-levl-accent text-white rounded-lg hover:bg-levl-accent/90 disabled:opacity-50 transition-colors"
          >
            <Save size={16} className="mr-2" />
            {isSaving ? 'Saving...' : 'Save (Private)'}
          </button>
        </div>
      </div>
    </div>
  )
}
