'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { CalendarDays, ChevronDown, Check, Filter, LayoutGrid, Calendar, Columns, Rows, AlignJustify, Zap, Activity, HelpCircle, Bookmark } from 'lucide-react'

export type CalendarViewMode = 'today' | '3day' | 'week' | 'month'
export type LayoutOrientation = 'columns' | 'stack'
export type CompletionTrackingMode = 'outcome' | 'fast'

interface ViewSelectorHeaderProps {
  viewMode: CalendarViewMode
  onViewModeChange: (mode: CalendarViewMode) => void
  dateTitle: string
  selectedProtocolFilter: string
  onProtocolFilterChange: (protocolId: string) => void
  availableProtocols: { id: string; name: string; colorHex?: string }[]
  selectedMainCategories: MainCategory[]
  selectedSubCategories: string[]
  onToggleMainCategory: (cat: MainCategory) => void
  onToggleSubCategory: (subId: string) => void
  layoutOrientation: LayoutOrientation
  onToggleLayoutOrientation: (orientation: LayoutOrientation) => void
  onEnrollClick?: () => void
  completionMode?: CompletionTrackingMode
  onCompletionModeChange?: (mode: CompletionTrackingMode) => void
  showCategoryFilters?: boolean
}

export const ViewSelectorHeader: React.FC<ViewSelectorHeaderProps> = ({
  viewMode,
  onViewModeChange,
  dateTitle,
  selectedProtocolFilter,
  onProtocolFilterChange,
  availableProtocols,
  selectedMainCategories,
  selectedSubCategories,
  onToggleMainCategory,
  onToggleSubCategory,
  layoutOrientation,
  onToggleLayoutOrientation,
  onEnrollClick,
  completionMode = 'outcome',
  onCompletionModeChange,
  showCategoryFilters = true
}) => {
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false)
  const [isProtocolDropdownOpen, setIsProtocolDropdownOpen] = useState(false)
  const [isMobileCategoryOpen, setIsMobileCategoryOpen] = useState(false)
  
  const viewDropdownRef = useRef<HTMLDivElement>(null)
  const protocolDropdownRef = useRef<HTMLDivElement>(null)
  const mobileCategoryDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (viewDropdownRef.current && !viewDropdownRef.current.contains(e.target as Node)) {
        setIsViewDropdownOpen(false)
      }
      if (protocolDropdownRef.current && !protocolDropdownRef.current.contains(e.target as Node)) {
        setIsProtocolDropdownOpen(false)
      }
      if (mobileCategoryDropdownRef.current && !mobileCategoryDropdownRef.current.contains(e.target as Node)) {
        setIsMobileCategoryOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentProtocolLabel = selectedProtocolFilter === 'all' 
    ? 'All Active Protocols' 
    : availableProtocols.find(p => p.id === selectedProtocolFilter)?.name || 'Filtered Protocol'

  const isAllActive = !selectedMainCategories || selectedMainCategories.includes('all') || selectedMainCategories.length === 0
  const isCategoryFiltered = !isAllActive
  const activeCategoryLabel = React.useMemo(() => {
    if (isAllActive) return 'Filter by Category'
    const nonAll = (selectedMainCategories || []).filter(c => c !== 'all')
    if (nonAll.length === 1) {
      const match = MAIN_CATEGORIES.find(c => c.id === nonAll[0])
      return match ? `${match.icon} ${match.label}` : 'Category'
    }
    return `Categories (${nonAll.length})`
  }, [isAllActive, selectedMainCategories])

  const activeSubItems = React.useMemo(() => {
    if (isAllActive || !selectedMainCategories) return []
    const items: SubCategoryItem[] = []
    selectedMainCategories.forEach(cat => {
      if (cat !== 'all') {
        const subs = SUB_CATEGORIES_MAP[cat] || []
        items.push(...subs)
      }
    })
    return items
  }, [selectedMainCategories, isAllActive])

  return (
    <div className="w-full flex flex-col gap-2.5 mb-5 relative z-40">
      {/* Top Header Bar */}
      <div className="relative z-50 bg-slate-950/90 p-2.5 sm:p-3.5 rounded-2xl border border-slate-800/80 shadow-xl backdrop-blur-md">
        
        {/* MOBILE VIEW (< md): Two equal-size half-width buttons side-by-side */}
        <div className="flex md:hidden items-center gap-2 w-full">
          {/* Half-width 1: Timeline Mode */}
          <div className={`relative flex-1 min-w-0 ${isViewDropdownOpen ? 'z-[100]' : 'z-20'}`} ref={viewDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsViewDropdownOpen(!isViewDropdownOpen)
                setIsMobileCategoryOpen(false)
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white font-bold text-xs transition-all cursor-pointer shadow-sm truncate"
            >
              <div className="flex items-center gap-1.5 min-w-0 truncate">
                <CalendarDays className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">
                  {viewMode === 'today' ? 'Today Timeline' : viewMode === '3day' ? '3-Day View' : viewMode === 'week' ? '7-Day Week' : 'Month Matrix'}
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 ml-1 transition-transform ${isViewDropdownOpen ? 'rotate-180 text-emerald-400' : ''}`} />
            </button>

            {isViewDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-52 bg-slate-900 border border-slate-700 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] p-1.5 z-[999] backdrop-blur-2xl animate-in fade-in slide-in-from-top-2">
                <div className="text-[10px] uppercase font-bold text-slate-500 px-3 py-1.5 tracking-wider">
                  Timeline Views
                </div>
                <button
                  onClick={() => { onViewModeChange('today'); setIsViewDropdownOpen(false) }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${viewMode === 'today' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-semibold' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'}`}
                >
                  <span>Today Timeline</span>
                  {viewMode === 'today' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
                <button
                  onClick={() => { onViewModeChange('3day'); setIsViewDropdownOpen(false) }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${viewMode === '3day' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-semibold' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'}`}
                >
                  <span>3-Day View</span>
                  {viewMode === '3day' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
                <button
                  onClick={() => { onViewModeChange('week'); setIsViewDropdownOpen(false) }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${viewMode === 'week' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-semibold' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'}`}
                >
                  <span>7-Day Week</span>
                  {viewMode === 'week' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
                <button
                  onClick={() => { onViewModeChange('month'); setIsViewDropdownOpen(false) }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${viewMode === 'month' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-semibold' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'}`}
                >
                  <span>Month Matrix</span>
                  {viewMode === 'month' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>

                <div className="pt-1 mt-1 border-t border-slate-800/80">
                  <Link
                    href="/bench"
                    onClick={() => setIsViewDropdownOpen(false)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-purple-300 hover:bg-purple-950/60 hover:text-white transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Bookmark className="w-3.5 h-3.5 text-purple-400" />
                      <span>Protocol Bench</span>
                    </div>
                    <span className="text-[9px] uppercase font-bold text-purple-300 bg-purple-500/20 px-1.5 py-0.5 rounded border border-purple-500/30">
                      Saved
                    </span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Half-width 2: Filter by Category */}
          <div className="relative flex-1 min-w-0" ref={mobileCategoryDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsMobileCategoryOpen(!isMobileCategoryOpen)
                setIsViewDropdownOpen(false)
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border font-bold text-xs transition-all cursor-pointer shadow-sm truncate ${
                isCategoryFiltered
                  ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                  : isMobileCategoryOpen
                  ? 'bg-slate-800 border-slate-600 text-white'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0 truncate">
                <Filter className={`w-3.5 h-3.5 shrink-0 ${isCategoryFiltered ? 'text-emerald-400' : 'text-purple-400'}`} />
                <span className="truncate">{activeCategoryLabel}</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 shrink-0 ml-1 transition-transform ${isMobileCategoryOpen ? 'rotate-180 text-emerald-400' : 'text-slate-400'}`} />
            </button>
          </div>

          {/* Mobile Guide Icon */}
          <Link
            href="/guide#today"
            className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 text-slate-400 hover:text-purple-300 transition-colors cursor-pointer shadow-sm shrink-0"
            title="View Guide"
          >
            <HelpCircle className="w-4 h-4 text-purple-400" />
          </Link>
        </div>

        {/* DESKTOP VIEW (>= md): Full Desktop Header Row */}
        <div className="hidden md:flex items-center justify-between gap-3 w-full">
          {/* Left: View Mode Dropdown */}
          <div className={`relative ${isViewDropdownOpen ? 'z-[100]' : 'z-20'}`} ref={viewDropdownRef}>
            <button
              onClick={() => setIsViewDropdownOpen(!isViewDropdownOpen)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white font-bold text-xs transition-all cursor-pointer shadow-sm"
            >
              <CalendarDays className="w-4 h-4 text-emerald-400" />
              <span className="capitalize">{viewMode === 'today' ? 'Today Timeline' : viewMode === '3day' ? '3-Day View' : viewMode === 'week' ? '7-Day Week' : 'Month Matrix'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

            {isViewDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] p-1.5 z-[999] backdrop-blur-2xl animate-in fade-in slide-in-from-top-2">
                <div className="text-[10px] uppercase font-bold text-slate-500 px-3 py-1.5 tracking-wider">
                  Calendar Views
                </div>
                <button
                  onClick={() => { onViewModeChange('today'); setIsViewDropdownOpen(false) }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${viewMode === 'today' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-semibold' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'}`}
                >
                  <span>Today Timeline</span>
                  {viewMode === 'today' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
                <button
                  onClick={() => { onViewModeChange('3day'); setIsViewDropdownOpen(false) }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${viewMode === '3day' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-semibold' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'}`}
                >
                  <span>3-Day View</span>
                  {viewMode === '3day' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
                <button
                  onClick={() => { onViewModeChange('week'); setIsViewDropdownOpen(false) }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${viewMode === 'week' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-semibold' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'}`}
                >
                  <span>7-Day Week</span>
                  {viewMode === 'week' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
                <button
                  onClick={() => { onViewModeChange('month'); setIsViewDropdownOpen(false) }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${viewMode === 'month' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-semibold' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'}`}
                >
                  <span>Month Matrix</span>
                  {viewMode === 'month' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>

                <div className="pt-1 mt-1 border-t border-slate-800/80">
                  <Link
                    href="/bench"
                    onClick={() => setIsViewDropdownOpen(false)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-purple-300 hover:bg-purple-950/60 hover:text-white transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Bookmark className="w-3.5 h-3.5 text-purple-400" />
                      <span>Protocol Bench</span>
                    </div>
                    <span className="text-[9px] uppercase font-bold text-purple-300 bg-purple-500/20 px-1.5 py-0.5 rounded border border-purple-500/30">
                      Saved
                    </span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Center: Dynamic Date Range / Title */}
          {viewMode !== 'today' ? (
            <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight flex items-center gap-2">
              {dateTitle}
            </h1>
          ) : null}

          {/* Right: Protocol Filter Dropdown & Guide */}
          <div className="flex items-center gap-2">
            <div className={`relative ${isProtocolDropdownOpen ? 'z-[100]' : 'z-20'}`} ref={protocolDropdownRef}>
              <button
                onClick={() => setIsProtocolDropdownOpen(!isProtocolDropdownOpen)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-950/40 border border-purple-800/40 hover:border-purple-700/60 text-purple-200 font-bold text-xs transition-all cursor-pointer shadow-sm max-w-[200px] truncate"
              >
                <Filter className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="truncate">{currentProtocolLabel}</span>
                <ChevronDown className="w-3.5 h-3.5 text-purple-400 ml-1 shrink-0" />
              </button>

              {isProtocolDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-slate-900 border border-purple-500/40 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] p-2 z-[999] backdrop-blur-2xl animate-in fade-in slide-in-from-top-2">
                  <div className="text-[10px] uppercase font-bold text-purple-400/90 px-3 py-1.5 tracking-wider">
                    Filter by Protocol
                  </div>
                  <button
                    onClick={() => {
                      onProtocolFilterChange('all')
                      setIsProtocolDropdownOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                      selectedProtocolFilter === 'all'
                        ? 'bg-purple-950/80 text-purple-300 border border-purple-800/60 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <span>All Active Protocols</span>
                    {selectedProtocolFilter === 'all' && <Check className="w-3.5 h-3.5 text-purple-400" />}
                  </button>

                  {availableProtocols.map(proto => (
                    <button
                      key={proto.id}
                      onClick={() => {
                        onProtocolFilterChange(proto.id)
                        setIsProtocolDropdownOpen(false)
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors truncate cursor-pointer ${
                        selectedProtocolFilter === proto.id
                          ? 'bg-purple-950/80 text-purple-300 border border-purple-800/60 font-semibold'
                          : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{proto.name}</span>
                      {selectedProtocolFilter === proto.id && <Check className="w-3.5 h-3.5 text-purple-400 shrink-0 ml-2" />}
                    </button>
                  ))}

                  {onEnrollClick && (
                    <div className="pt-1.5 mt-1.5 border-t border-white/10">
                      <button
                        onClick={() => {
                          setIsProtocolDropdownOpen(false)
                          onEnrollClick()
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-emerald-400 hover:bg-emerald-950/40 transition-colors cursor-pointer"
                      >
                        <span>+ Enroll in New Protocol</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Subtle Contextual Guide Button */}
            <Link
              href="/guide#today"
              className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 text-slate-400 hover:text-purple-300 transition-colors cursor-pointer shadow-sm flex items-center gap-1 shrink-0"
              title="View Today Timeline Guide"
            >
              <HelpCircle className="w-4 h-4 text-purple-400" />
              <span className="text-[11px] font-bold hidden sm:inline">Guide</span>
            </Link>
          </div>
        </div>
      </div>

      {/* MOBILE FULL-WIDTH CATEGORY FILTERS DROPDOWN PANEL */}
      {isMobileCategoryOpen && onToggleMainCategory && (
        <div className="md:hidden w-full bg-slate-950/95 p-3.5 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 space-y-3 z-30" ref={mobileCategoryDropdownRef}>
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-emerald-400" /> Filter by Category
            </span>
            {isCategoryFiltered && (
              <button
                type="button"
                onClick={() => {
                  onToggleMainCategory('all')
                }}
                className="text-xs font-bold text-orange-400 hover:text-orange-300 underline cursor-pointer"
              >
                Reset to All
              </button>
            )}
          </div>

          {/* 3-Col Categories Grid */}
          <div className="grid grid-cols-3 gap-2">
            {MAIN_CATEGORIES.map(cat => {
              const isActive = cat.id === 'all' ? isAllActive : selectedMainCategories?.includes(cat.id)
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onToggleMainCategory(cat.id)}
                  className={`px-2 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.3)] scale-[1.02]'
                      : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <span className="text-base leading-none">{cat.icon}</span>
                  <span className="truncate">{cat.label}</span>
                </button>
              )
            })}
          </div>

          {/* Subcategories if any */}
          {activeSubItems.length > 0 && onToggleSubCategory && (
            <div className="pt-2.5 border-t border-slate-800/80 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">
                Subcategories:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeSubItems.map(sub => {
                  const isSubActive = selectedSubCategories?.includes(sub.id)
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => onToggleSubCategory(sub.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        isSubActive
                          ? 'bg-teal-500/20 text-teal-200 border-teal-500/50 shadow-sm'
                          : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {sub.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Control Bar: Modality Category Filter Pills (Desktop Only) */}
      {showCategoryFilters && (
        <div className="hidden md:block">
          <CategoryFiltersBar
            selectedMainCategories={selectedMainCategories || ['all']}
            selectedSubCategories={selectedSubCategories || []}
            onToggleMainCategory={onToggleMainCategory || (() => {})}
            onToggleSubCategory={onToggleSubCategory || (() => {})}
            viewMode={viewMode}
            layoutOrientation={layoutOrientation}
            onToggleLayoutOrientation={onToggleLayoutOrientation}
          />
        </div>
      )}
    </div>
  )
}

export type MainCategory = 'all' | 'peptides' | 'fitness' | 'nutrition' | 'sleep' | 'mind' | 'other'

export interface SubCategoryItem {
  id: string
  label: string
}

export const MAIN_CATEGORIES: Array<{ id: MainCategory; label: string; icon: string }> = [
  { id: 'all', label: 'All', icon: '✨' },
  { id: 'peptides', label: 'Peptides', icon: '💉' },
  { id: 'fitness', label: 'Fitness', icon: '🏋️' },
  { id: 'nutrition', label: 'Nutrition', icon: '🥗' },
  { id: 'sleep', label: 'Sleep', icon: '🌙' },
  { id: 'mind', label: 'Mind', icon: '🧠' },
  { id: 'other', label: 'Other', icon: '🎨' }
]

export const SUB_CATEGORIES_MAP: Record<MainCategory, SubCategoryItem[]> = {
  all: [],
  peptides: [
    { id: 'injury_joint_repair', label: '🩹 Injury & Joint Repair' },
    { id: 'fat_loss_metabolism', label: '🔥 Fat Loss & Metabolism' },
    { id: 'muscle_recovery', label: '💪 Muscle & Recovery' },
    { id: 'focus_brain_mood', label: '🧠 Focus, Brain & Mood' },
    { id: 'skin_aesthetics', label: '✨ Skin & Aesthetics' },
    { id: 'immunity_gut', label: '🛡️ Immunity & Gut Health' },
    { id: 'libido_vitality', label: '❤️‍🔥 Libido & Vitality' },
    { id: 'cellular_longevity', label: '🧬 Cellular Longevity' }
  ],
  fitness: [
    { id: 'cardio', label: 'Cardio' },
    { id: 'strength', label: 'Strength' },
    { id: 'flexibility', label: 'Flexibility & Stretching' },
    { id: 'thermal', label: 'Thermal & Recovery' }
  ],
  nutrition: [
    { id: 'supplements', label: 'Supplements' },
    { id: 'fasting', label: 'Fasting' },
    { id: 'whole_foods', label: 'Whole Foods & Diet' }
  ],
  sleep: [
    { id: 'hygiene', label: 'Sleep Hygiene' },
    { id: 'circadian', label: 'Circadian & Light' },
    { id: 'wind_down', label: 'Wind Down' }
  ],
  mind: [
    { id: 'nervous_system', label: 'Nervous System' },
    { id: 'breathwork', label: 'Breathwork' },
    { id: 'meditation', label: 'Meditation' }
  ],
  other: [
    { id: 'skin', label: 'Skin & Hair' },
    { id: 'biomarkers', label: 'Diagnostics & Biomarkers' },
    { id: 'environmental', label: 'Environmental' }
  ]
}

export const CategoryFiltersBar: React.FC<{
  selectedMainCategories: MainCategory[]
  selectedSubCategories: string[]
  onToggleMainCategory: (cat: MainCategory) => void
  onToggleSubCategory: (subId: string) => void
  viewMode?: CalendarViewMode
  layoutOrientation?: LayoutOrientation
  onToggleLayoutOrientation?: (orientation: LayoutOrientation) => void
  className?: string
}> = ({
  selectedMainCategories,
  selectedSubCategories,
  onToggleMainCategory,
  onToggleSubCategory,
  viewMode,
  layoutOrientation,
  onToggleLayoutOrientation,
  className = ''
}) => {
  const isAllActive = selectedMainCategories.includes('all') || selectedMainCategories.length === 0

  const activeSubItems = React.useMemo(() => {
    if (isAllActive) return []
    const items: SubCategoryItem[] = []
    selectedMainCategories.forEach(cat => {
      if (cat !== 'all') {
        const subs = SUB_CATEGORIES_MAP[cat] || []
        items.push(...subs)
      }
    })
    return items
  }, [selectedMainCategories, isAllActive])

  return (
    <div className={`flex flex-col gap-2 bg-slate-950/60 p-2 sm:p-2.5 rounded-2xl border border-slate-800/80 mb-3 shadow-lg backdrop-blur-md ${className}`}>
      {/* Top Row: Main Broad Categories & Orientation Toggle */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Category:
          </span>

          {MAIN_CATEGORIES.map(cat => {
            const isActive = cat.id === 'all' ? isAllActive : selectedMainCategories.includes(cat.id)

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onToggleMainCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all shrink-0 border cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/60 shadow-[0_0_14px_rgba(16,185,129,0.35)] scale-[1.02]'
                    : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                <span className="text-base sm:text-lg leading-none">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            )
          })}
        </div>

        {/* Right: Side-by-Side vs Vertical Stack Orientation Toggle */}
        {viewMode && viewMode !== 'today' && onToggleLayoutOrientation && layoutOrientation && (
          <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-lg p-0.5 shrink-0 ml-auto">
            <button
              onClick={() => onToggleLayoutOrientation('columns')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                layoutOrientation === 'columns'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Side-by-Side Columns View (Default)"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Side-by-Side</span>
            </button>
            <button
              onClick={() => onToggleLayoutOrientation('stack')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                layoutOrientation === 'stack'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Vertical Stacked View"
            >
              <AlignJustify className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Vertical Stack</span>
            </button>
          </div>
        )}
      </div>

      {/* Dynamic Sub-Category Filter Row */}
      {!isAllActive && activeSubItems.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-2 border-t border-slate-800/60 animate-in fade-in slide-in-from-top-1">
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Focus:
          </span>

          {activeSubItems.map(sub => {
            const isSubActive = selectedSubCategories.includes(sub.id)

            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => onToggleSubCategory(sub.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border cursor-pointer flex items-center gap-1.5 ${
                  isSubActive
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                    : 'bg-black/50 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <span className="font-mono">{isSubActive ? '✓' : '+'}</span>
                <span>{sub.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
