'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Calendar,
  Clock,
  Camera,
  Activity,
  Sliders,
  Scale,
  Target,
  Bookmark,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Search,
  ExternalLink,
  ChevronRight,
  Check,
  Flame,
  Snowflake,
  Droplets,
  Coffee,
  Sun,
  Layers,
  HelpCircle
} from 'lucide-react'

interface Chapter {
  id: string
  title: string
  subtitle: string
  icon: React.ReactNode
  badge: string
  color: string
}

const CHAPTERS: Chapter[] = [
  {
    id: 'today',
    title: "1. Today's Protocol Timeline",
    subtitle: 'Circadian execution, multi-day views & outcome tracking',
    icon: <Calendar className="w-4 h-4 text-emerald-400" />,
    badge: 'Core Daily Routine',
    color: 'emerald'
  },
  {
    id: 'quicklog',
    title: '2. Quick-Log Hotkeys & Vision AI',
    subtitle: 'Meal plate photo AI scans, 30+ plant diversity & hydration',
    icon: <Camera className="w-4 h-4 text-purple-400" />,
    badge: 'Instant Logging',
    color: 'purple'
  },
  {
    id: 'studio',
    title: '3. Modality Personalization Studio',
    subtitle: 'Cadence rotations, skip policies, dosage spectrum & titration',
    icon: <Sliders className="w-4 h-4 text-cyan-400" />,
    badge: 'Customization',
    color: 'cyan'
  },
  {
    id: 'schedule',
    title: '4. Unified Fasting & Schedule Hub',
    subtitle: 'Fasting window targets, macro goals & calendar rescheduling',
    icon: <Clock className="w-4 h-4 text-sky-400" />,
    badge: 'Fasting & Timing',
    color: 'sky'
  },
  {
    id: 'bloodwork',
    title: '5. Bloodwork & Lab Biomarkers AI',
    subtitle: 'PDF lab uploads, PhenoAge biological age & longevity ranges',
    icon: <Activity className="w-4 h-4 text-rose-400" />,
    badge: 'Biological Age & Labs',
    color: 'rose'
  },
  {
    id: 'explore',
    title: '6. Explore Protocols Catalog',
    subtitle: '100+ clinical protocols (Blueprint, Attia, Sinclair, FMD)',
    icon: <Search className="w-4 h-4 text-amber-400" />,
    badge: 'Protocol Library',
    color: 'amber'
  },
  {
    id: 'bench',
    title: '7. The Bench & Protocol Backlog',
    subtitle: 'Saving modalities to experiment with before going live',
    icon: <Bookmark className="w-4 h-4 text-indigo-400" />,
    badge: 'Sandbox & Backlog',
    color: 'indigo'
  },
  {
    id: 'coach',
    title: '8. AI Longevity Coach & In-App Guide',
    subtitle: 'Evidence-based synergy advice & in-app feature navigation',
    icon: <Sparkles className="w-4 h-4 text-purple-400" />,
    badge: 'AI Assistant',
    color: 'purple'
  }
]

export default function GuidePage() {
  const router = useRouter()
  const [activeChapter, setActiveChapter] = useState<string>('today')

  useEffect(() => {
    // Handle hash change on initial load / navigation
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '')
      if (hash && CHAPTERS.some(c => c.id === hash)) {
        setActiveChapter(hash)
        const el = document.getElementById(hash)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }
    }
  }, [])

  const scrollToChapter = (id: string) => {
    setActiveChapter(id)
    if (typeof window !== 'undefined') {
      window.location.hash = id
      const el = document.getElementById(id)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3.5 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Go Back"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-purple-400" />
                <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                  LEVL Visual Playbook &amp; App Tour
                </h1>
                <span className="text-[10px] bg-purple-950/80 border border-purple-800/60 text-purple-300 px-2 py-0.5 rounded-full font-mono font-bold hidden sm:inline-block">
                  Master User Guide
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Everything you need to master your daily longevity routine, fasting hub, and biomarker AI.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/today"
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-md shadow-purple-900/40 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Go to Today</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container with Sticky Sidebar + Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Sticky Sidebar (Desktop) / Horizontal Chapter Bar (Mobile) */}
        <aside className="lg:col-span-4 space-y-3">
          <div className="lg:sticky lg:top-20 space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Layers size={13} className="text-purple-400" /> Chapter Directory
                </span>
                <span className="text-[10px] font-mono text-purple-300 font-bold bg-purple-950/80 border border-purple-800/60 px-2 py-0.5 rounded-full">
                  8 Chapters
                </span>
              </div>

              {/* Chapter Buttons */}
              <div className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 custom-scrollbar">
                {CHAPTERS.map((ch) => {
                  const isActive = activeChapter === ch.id
                  return (
                    <button
                      key={ch.id}
                      onClick={() => scrollToChapter(ch.id)}
                      className={`text-left p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-2 shrink-0 lg:shrink w-auto lg:w-full border ${
                        isActive
                          ? 'bg-purple-950/60 border-purple-500/50 text-white font-bold shadow-sm'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="shrink-0">{ch.icon}</div>
                        <span className="text-xs font-semibold truncate">{ch.title}</span>
                      </div>
                      <ChevronRight size={13} className={`shrink-0 transition-transform ${isActive ? 'text-purple-400 translate-x-0.5' : 'text-slate-600'}`} />
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Quick Support Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/30 to-slate-900 border border-purple-500/20 text-xs text-slate-300 space-y-2 hidden lg:block">
              <div className="flex items-center gap-2 font-bold text-white">
                <Sparkles size={14} className="text-purple-400" />
                <span>Have a question?</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                You can ask the AI Longevity Coach on any screen for direct step-by-step help and instant navigation shortcuts.
              </p>
              <Link
                href="/coach"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-300 hover:text-purple-200 pt-1"
              >
                <span>Ask AI Coach</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </aside>

        {/* Right Content Area: 8 Detailed Annotated Visual Chapters */}
        <main className="lg:col-span-8 space-y-12">
          
          {/* ========================================================================= */}
          {/* CHAPTER 1: TODAY'S PROTOCOL TIMELINE */}
          {/* ========================================================================= */}
          <section id="today" className="scroll-mt-24 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  1
                </span>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-white">
                    Today&apos;s Protocol Timeline &amp; Circadian Execution
                  </h2>
                  <p className="text-xs text-slate-400">
                    How daily tasks are grouped by circadian time blocks and tracked with outcome ratings.
                  </p>
                </div>
              </div>
              <Link
                href="/today"
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-600/50 text-emerald-300 hover:text-white flex items-center gap-1.5 transition-all shadow-sm"
              >
                <span>Open Today</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            {/* Visual Annotated Mock Card */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-6 space-y-5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

              {/* Annotated Mock UI Component */}
              <div className="space-y-3 bg-slate-950/90 border border-slate-800/80 rounded-2xl p-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-extrabold text-white">🌅 Morning Stack (6:00 AM – 9:00 AM)</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-full font-bold">
                    3 of 4 Completed
                  </span>
                </div>

                {/* Mock Task 1 with Callout Pointer */}
                <div className="relative p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                      <Check size={14} className="stroke-[3]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Cold Plunge Therapy (50°F / 10°C)</h4>
                      <p className="text-[10px] text-slate-400">3 mins • Søberg Principle warm-up • +250% dopamine</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono bg-emerald-950 border border-emerald-800/80 text-emerald-300 px-2 py-0.5 rounded-md font-bold">
                      Mood: 9/10
                    </span>
                  </div>
                </div>

                {/* Mock Task 2 with Personalize Gear */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center font-bold text-xs">
                      ○
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">NMN + Resveratrol Epigenetic Stack</h4>
                      <p className="text-[10px] text-slate-400">1,000mg NMN + 500mg Resveratrol • With EVOO</p>
                    </div>
                  </div>
                  <button className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1">
                    <Sliders size={11} />
                    <span>Personalize</span>
                  </button>
                </div>
              </div>

              {/* 3 Step Key Takeaways */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                    <Clock size={13} />
                    <span>1. Circadian Blocks</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Protocols are ordered chronologically (Morning, Midday, Evening, Pre-Bed) for optimal nutrient synergy and biological absorption.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                    <CheckCircle2 size={13} />
                    <span>2. Outcome Logging</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Tap any task to log energy, mood, or sleep quality ratings, which automatically computes efficacy correlations over time.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                    <Calendar size={13} />
                    <span>3. Multi-Day Views</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Use the top view selector to switch between <strong>Today</strong>, <strong>3-Day Split</strong>, <strong>7-Day Week</strong>, and <strong>Month Matrix</strong>.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* CHAPTER 2: QUICK-LOG HOTKEYS & VISION AI */}
          {/* ========================================================================= */}
          <section id="quicklog" className="scroll-mt-24 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center font-bold text-xs">
                  2
                </span>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-white">
                    Quick-Log Hotkeys &amp; Meal Vision AI
                  </h2>
                  <p className="text-xs text-slate-400">
                    Snap meal plate photos for instant macro analysis and track botanical plant diversity.
                  </p>
                </div>
              </div>
              <Link
                href="/today"
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-600/50 text-purple-300 hover:text-white flex items-center gap-1.5 transition-all shadow-sm"
              >
                <span>Try Hotkeys in Today</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            {/* Visual Annotated Mock Card */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-6 space-y-5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

              {/* Annotated Hotkey Grid Preview */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800/80 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Quick Log Hotkeys Bar (Pinned at top of Today)
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-950/60 to-slate-900 border border-purple-500/40 text-center space-y-1 shadow-sm">
                    <Camera size={16} className="text-purple-400 mx-auto" />
                    <span className="text-[10px] font-extrabold text-white block">Log Meal AI</span>
                    <span className="text-[9px] text-purple-300 block font-mono">Photo / Fast</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center space-y-1">
                    <Droplets size={16} className="text-sky-400 mx-auto" />
                    <span className="text-[10px] font-bold text-white block">Water</span>
                    <span className="text-[9px] text-slate-400 block">+16 oz</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center space-y-1">
                    <Coffee size={16} className="text-amber-400 mx-auto" />
                    <span className="text-[10px] font-bold text-white block">Caffeine</span>
                    <span className="text-[9px] text-slate-400 block">Cutoff Track</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center space-y-1">
                    <Sun size={16} className="text-yellow-400 mx-auto" />
                    <span className="text-[10px] font-bold text-white block">Sunlight</span>
                    <span className="text-[9px] text-slate-400 block">Circadian</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center space-y-1">
                    <Flame size={16} className="text-orange-400 mx-auto" />
                    <span className="text-[10px] font-bold text-white block">Sauna</span>
                    <span className="text-[9px] text-slate-400 block">174°F+</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center space-y-1">
                    <Snowflake size={16} className="text-cyan-400 mx-auto" />
                    <span className="text-[10px] font-bold text-white block">Cold Plunge</span>
                    <span className="text-[9px] text-slate-400 block">50°F</span>
                  </div>
                </div>
              </div>

              {/* 3 Step Key Takeaways */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-purple-400 font-bold text-xs">
                    <Camera size={13} />
                    <span>1. Meal Photo Vision AI</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Snap any plate of food — Multimodal AI estimates Calories, Protein, Net Carbs, Prebiotic Fiber, and Healthy Fats automatically.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-purple-400 font-bold text-xs">
                    <Target size={13} />
                    <span>2. 30+ Plant Diversity</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Vision AI filters out animal products and tallies botanical plant species to optimize your gut microbiome and microbial richness.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-purple-400 font-bold text-xs">
                    <Zap size={13} />
                    <span>3. Instant Hotkeys</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Log water (+8oz/+16oz), caffeine cutoff, morning sunlight, sauna, and cold plunge in 1 tap without opening complicated menus.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* CHAPTER 3: MODALITY PERSONALIZATION & SCHEDULING STUDIO */}
          {/* ========================================================================= */}
          <section id="studio" className="scroll-mt-24 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center font-bold text-xs">
                  3
                </span>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-white">
                    Modality Personalization &amp; Scheduling Studio
                  </h2>
                  <p className="text-xs text-slate-400">
                    Fine-tune cadences, skip policies, dosage spectrums, and peptide titration cycles.
                  </p>
                </div>
              </div>
              <Link
                href="/today"
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-600/50 text-cyan-300 hover:text-white flex items-center gap-1.5 transition-all shadow-sm"
              >
                <span>Customize a Modality</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            {/* Visual Annotated Mock Card */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-6 space-y-5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

              {/* Annotated 2-Column Studio Preview */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-white flex items-center gap-1.5">
                    <Sliders size={13} className="text-cyan-400" /> Modality Personalize &amp; Schedule Studio (2-Column Desktop)
                  </span>
                  <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950 border border-cyan-800/80 px-2 py-0.5 rounded-full font-bold">
                    Scroll Safe Viewport
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Left Column Mock */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block">
                      Left Column: Cadence &amp; Rotation
                    </span>
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[11px] font-bold text-white block">Days of Week vs Rest Interval</span>
                      <p className="text-[10px] text-slate-400">e.g. Every 2 days (1 day on, 1 day rest) • Rolling cycle preview</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[11px] font-bold text-white block">Real-World Adaptation Policy</span>
                      <p className="text-[10px] text-slate-400">If skipped: Roll Forward to next day, Fixed, or Cascade Shift</p>
                    </div>
                  </div>

                  {/* Right Column Mock */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block">
                      Right Column: Dosage &amp; Evidence
                    </span>
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[11px] font-bold text-white block">Literature Dosing Slider</span>
                      <p className="text-[10px] text-slate-400">Sensitivity Starter vs Personal Target vs Blueprint preset</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[11px] font-bold text-white block">Peptide Titration Step-Up</span>
                      <p className="text-[10px] text-slate-400">Week 1-4 ramp up schedules &amp; PubMed evidence dossier</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3 Step Key Takeaways */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs">
                    <Calendar size={13} />
                    <span>1. Flexible Cadences</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Set specific days of the week, or recovery rest intervals (e.g. 1 day on, 1 day off) with rolling rotation previews.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs">
                    <ShieldCheck size={13} />
                    <span>2. Skip Handling</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Choose whether missed sessions roll forward automatically, stay locked to calendar days, or cascade shift future intervals.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs">
                    <Scale size={13} />
                    <span>3. Multi-Parameter Target</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Calibrate secondary parameters like sauna temperature (174°F+), cold plunge temp (50°F), or administration vehicles (with EVOO).
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* CHAPTER 4: UNIFIED FASTING & SCHEDULE HUB */}
          {/* ========================================================================= */}
          <section id="schedule" className="scroll-mt-24 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-500/40 text-sky-400 flex items-center justify-center font-bold text-xs">
                  4
                </span>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-white">
                    Unified Fasting &amp; Schedule Hub
                  </h2>
                  <p className="text-xs text-slate-400">
                    Sync your fasting window with nutrition targets and calendar rescheduling.
                  </p>
                </div>
              </div>
              <Link
                href="/schedule"
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-sky-950/60 hover:bg-sky-900/80 border border-sky-600/50 text-sky-300 hover:text-white flex items-center gap-1.5 transition-all shadow-sm"
              >
                <span>Open Fasting Hub</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            {/* Visual Annotated Mock Card */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-6 space-y-5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

              {/* 4 Interactive Headline KPI Cards */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-white">
                    Interactive Headline Target Cards (Click [Edit] to Adjust)
                  </span>
                  <span className="text-[10px] font-mono text-sky-300 bg-sky-950 border border-sky-800 px-2 py-0.5 rounded-full font-bold">
                    Targets Drawer
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-900 border border-sky-500/30 space-y-1">
                    <span className="text-[10px] text-slate-400 block font-bold">Fasting Target</span>
                    <span className="text-base font-extrabold text-sky-300 block">16:8 Window</span>
                    <span className="text-[9px] text-slate-500 block">Fast Break: 12:00 PM</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 block font-bold">Calories / Macros</span>
                    <span className="text-base font-extrabold text-white block">2,150 kcal</span>
                    <span className="text-[9px] text-slate-500 block">165g Protein • 45g Fiber</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 block font-bold">Daily Plant Servings</span>
                    <span className="text-base font-extrabold text-emerald-400 block">8.5 Servings</span>
                    <span className="text-[9px] text-slate-500 block">Target: 7+ daily</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 block font-bold">Plant Diversity Count</span>
                    <span className="text-base font-extrabold text-purple-300 block">34 Species</span>
                    <span className="text-[9px] text-slate-500 block">Goal: 30+ weekly</span>
                  </div>
                </div>
              </div>

              {/* 3 Step Key Takeaways */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-sky-400 font-bold text-xs">
                    <Clock size={13} />
                    <span>1. Tap [Edit] on Cards</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Tap any headline card to open the Targets Drawer to change fasting hours (16:8, 18:6, OMAD) and macro targets.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-sky-400 font-bold text-xs">
                    <Target size={13} />
                    <span>2. Net Carbs vs Fiber</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Carbohydrates and prebiotic fiber are tracked separately so you can optimize microbiome gut health while managing glycemic spikes.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-sky-400 font-bold text-xs">
                    <Calendar size={13} />
                    <span>3. Drag &amp; Reschedule</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Easily drag and drop modalities across the calendar grid to adapt your routine to travel or schedule changes.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* CHAPTER 5: BLOODWORK & LAB BIOMARKERS VISION AI */}
          {/* ========================================================================= */}
          <section id="bloodwork" className="scroll-mt-24 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center font-bold text-xs">
                  5
                </span>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-white">
                    Bloodwork &amp; Lab Biomarkers Vision AI
                  </h2>
                  <p className="text-xs text-slate-400">
                    Upload Quest, Labcorp, or Function Health blood tests for automatic PhenoAge parsing.
                  </p>
                </div>
              </div>
              <Link
                href="/physiological-age"
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-600/50 text-rose-300 hover:text-white flex items-center gap-1.5 transition-all shadow-sm"
              >
                <span>Upload Lab Panel</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            {/* Visual Annotated Mock Card */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-6 space-y-5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

              {/* Annotated Lab Parser & BioAge Preview */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Activity size={14} className="text-rose-400" />
                    <span className="font-extrabold text-white">PhenoAge Biological Age Calculation</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    Age Gap: -4.2 Years Younger
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 block font-bold">ApoB (Vascular)</span>
                    <span className="text-sm font-extrabold text-emerald-400 block">58 mg/dL</span>
                    <span className="text-[9px] text-slate-500 block">Optimal: &lt;65 mg/dL</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 block font-bold">hs-CRP (Inflammation)</span>
                    <span className="text-sm font-extrabold text-emerald-400 block">0.32 mg/L</span>
                    <span className="text-[9px] text-slate-500 block">Optimal: &lt;0.5 mg/L</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 block font-bold">HbA1c (Glycemic)</span>
                    <span className="text-sm font-extrabold text-emerald-400 block">5.0%</span>
                    <span className="text-[9px] text-slate-500 block">Optimal: &lt;5.2%</span>
                  </div>
                </div>
              </div>

              {/* 3 Step Key Takeaways */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs">
                    <Camera size={13} />
                    <span>1. Multimodal Lab Upload</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Upload any PDF or photo of lab results — Vision AI automatically normalizes and graphs every measured biomarker.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs">
                    <Activity size={13} />
                    <span>2. Biological Age Scores</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Computes your Phenotypic Age, KDM Biological Age, and Homeostatic Dysregulation scores to measure your rate of aging.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs">
                    <ShieldCheck size={13} />
                    <span>3. Longevity Ranges</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Biomarkers are compared against strict longevity reference ranges (e.g. Dayspring ApoB targets) rather than standard pathology ranges.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* CHAPTER 6: EXPLORE PROTOCOLS CATALOG */}
          {/* ========================================================================= */}
          <section id="explore" className="scroll-mt-24 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold text-xs">
                  6
                </span>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-white">
                    Explore Protocols Catalog
                  </h2>
                  <p className="text-xs text-slate-400">
                    Browse 100+ clinical protocols and 1-click enroll stacks.
                  </p>
                </div>
              </div>
              <Link
                href="/explore"
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 border border-amber-600/50 text-amber-300 hover:text-white flex items-center gap-1.5 transition-all shadow-sm"
              >
                <span>Browse Explore Catalog</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            {/* Visual Annotated Mock Card */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-6 space-y-5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800/80 space-y-3 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Featured Master Protocol Presets
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-900 border border-amber-500/30 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-white">Bryan Johnson Blueprint v2.0</span>
                      <span className="text-[9px] bg-amber-950 border border-amber-800 text-amber-300 px-2 py-0.5 rounded-full font-bold">Speed of Aging</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Full 2026 stack • 30+ biomarkers • 1-click enroll</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-white">Peter Attia Centenarian Decathlon</span>
                      <span className="text-[9px] bg-blue-950 border border-blue-800 text-blue-300 px-2 py-0.5 rounded-full font-bold">Cardiorespiratory</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Zone 2 cardio • 4x4 HIIT • Grip strength &amp; stability</p>
                  </div>
                </div>
              </div>

              {/* 3 Step Key Takeaways */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                    <Search size={13} />
                    <span>1. Category Filters</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Filter by Supplements, Nutrition, Sleep, Thermal &amp; Light Hormesis, Fitness, Peptides, or Diagnostics.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                    <BookOpen size={13} />
                    <span>2. Evidence Dossiers</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Every modality includes verified PubMed study links, biological mechanisms, and researcher guidelines.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                    <Zap size={13} />
                    <span>3. 1-Click Enrollment</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Enroll in whole protocols with 1 click, or add individual modalities to your live Today timeline or Bench.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* CHAPTER 7: THE BENCH & BACKLOG */}
          {/* ========================================================================= */}
          <section id="bench" className="scroll-mt-24 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center font-bold text-xs">
                  7
                </span>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-white">
                    The Bench &amp; Protocol Backlog
                  </h2>
                  <p className="text-xs text-slate-400">
                    Store and calibrate modalities before activating them to your live Today timeline.
                  </p>
                </div>
              </div>
              <Link
                href="/bench"
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-600/50 text-indigo-300 hover:text-white flex items-center gap-1.5 transition-all shadow-sm"
              >
                <span>Open My Bench</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            {/* Visual Annotated Mock Card */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-6 space-y-5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800/80 space-y-2 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Bench Holding Sandbox Preview
                </span>
                <div className="p-3 rounded-xl bg-slate-900 border border-indigo-500/30 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-extrabold text-white text-xs">Fisetin Senolytic Pulse Protocol</h4>
                    <p className="text-[10px] text-slate-400">20mg/kg • 2 consecutive days per month • Mayo Clinic Trial</p>
                  </div>
                  <button className="text-[10px] font-extrabold px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md">
                    Activate to Today
                  </button>
                </div>
              </div>

              {/* 3 Step Key Takeaways */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-xs">
                    <Bookmark size={13} />
                    <span>1. Research Sandbox</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Save interesting supplements or therapies from Explore without crowding your current daily routine.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-xs">
                    <Sliders size={13} />
                    <span>2. Pre-Configuration</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Set up your target dosages, cadences, and notes on the bench so they are ready to go when you cycle them in.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-xs">
                    <Zap size={13} />
                    <span>3. 1-Tap Activation</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    When you are ready to start a bench protocol, tap &quot;Activate to Today&quot; to instantly schedule it into your routine.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* CHAPTER 8: AI LONGEVITY COACH & IN-APP GUIDE */}
          {/* ========================================================================= */}
          <section id="coach" className="scroll-mt-24 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center font-bold text-xs">
                  8
                </span>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-white">
                    AI Longevity Coach &amp; In-App Assistant
                  </h2>
                  <p className="text-xs text-slate-400">
                    Your 24/7 personal longevity expert and navigation copilot.
                  </p>
                </div>
              </div>
              <Link
                href="/coach"
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-600/50 text-purple-300 hover:text-white flex items-center gap-1.5 transition-all shadow-sm"
              >
                <span>Open Full AI Coach</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            {/* Visual Annotated Mock Card */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-6 space-y-5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800/80 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                  <Sparkles size={14} />
                  <span>Ask AI Longevity Coach Anything</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-purple-500/30 text-slate-300 space-y-1">
                  <p className="text-[11px] text-purple-300 font-bold">User: &quot;Where do I go to upload my bloodwork?&quot;</p>
                  <p className="text-[11px] text-slate-300">
                    AI Coach: &quot;Go to Physiological Age (/physiological-age), tap &apos;Upload Lab Panel&apos;, and Vision AI will parse your biomarkers and PhenoAge gap.&quot;
                  </p>
                  <div className="pt-1">
                    <span className="text-[10px] font-bold bg-purple-950 border border-purple-700/60 text-purple-200 px-2 py-0.5 rounded-lg inline-flex items-center gap-1">
                      🩸 [Open Bloodwork &amp; BioAge →]
                    </span>
                  </div>
                </div>
              </div>

              {/* 3 Step Key Takeaways */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-purple-400 font-bold text-xs">
                    <Sparkles size={13} />
                    <span>1. Rotating Prompts</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    The single-line bar under the Daily Tip cycles through 20 clinical questions to inspire high-impact optimizations.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-purple-400 font-bold text-xs">
                    <Sliders size={13} />
                    <span>2. In-Modal Dosing Coach</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Ask questions inside the Modality Studio with 1-click buttons to apply recommended doses and timing windows.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-purple-400 font-bold text-xs">
                    <ExternalLink size={13} />
                    <span>3. In-App Navigation</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Ask the AI how to do anything in the app, and it provides step-by-step instructions and direct route jump buttons.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Bottom Call to Action */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-cyan-950/40 border border-purple-500/30 text-center space-y-3 shadow-2xl">
            <h3 className="text-lg font-extrabold text-white">
              Ready to start your longevity routine?
            </h3>
            <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
              Explore 100+ clinical protocols, track your circadian stack on Today, and monitor your PhenoAge biological age gap.
            </p>
            <div className="flex items-center justify-center gap-3 pt-1">
              <Link
                href="/today"
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-900/40 transition-all cursor-pointer"
              >
                Go to Today Timeline
              </Link>
              <Link
                href="/explore"
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs transition-all cursor-pointer"
              >
                Explore Protocols
              </Link>
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
