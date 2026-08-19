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
  HelpCircle,
  Dumbbell,
  Microscope,
  HeartPulse,
  Settings,
  Plus,
  Compass,
  FileText
} from 'lucide-react'

interface Chapter {
  id: string
  title: string
  subtitle: string
  icon: React.ReactNode
  badge: string
  color: string
  destinationRoute: string
}

const CHAPTERS: Chapter[] = [
  {
    id: 'today',
    title: "1. Today's Protocol Timeline",
    subtitle: 'Circadian execution, multi-day views & daily check-ins',
    icon: <Calendar className="w-4 h-4 text-emerald-400" />,
    badge: 'Core Routine',
    color: 'emerald',
    destinationRoute: '/today'
  },
  {
    id: 'outcomes',
    title: '2. Before, After & During Outcome Tracking',
    subtitle: 'Pre-session baseline vs post-session shift & intra-session performance',
    icon: <HeartPulse className="w-4 h-4 text-teal-400" />,
    badge: 'Biometric Feedback',
    color: 'teal',
    destinationRoute: '/today'
  },
  {
    id: 'precision',
    title: '3. Precision Complete & Execution Logging',
    subtitle: 'Thermal exposure temps, heart rate zones, weights, sets & wavelengths',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    badge: 'Execution Details',
    color: 'emerald',
    destinationRoute: '/today'
  },
  {
    id: 'studio',
    title: '4. Modality Studio, Geek Mode & Titration',
    subtitle: 'Biological mechanisms, PubMed links, dosage sliders & skip policies',
    icon: <Sliders className="w-4 h-4 text-cyan-400" />,
    badge: 'Deep Customization',
    color: 'cyan',
    destinationRoute: '/today'
  },
  {
    id: 'quicklog',
    title: '5. Quick-Log Hotkeys: 1-Tap & Custom Creation',
    subtitle: 'Left vertical gradient fill bars, custom hotkey builder & meal AI',
    icon: <Camera className="w-4 h-4 text-purple-400" />,
    badge: 'Instant Logging',
    color: 'purple',
    destinationRoute: '/today'
  },
  {
    id: 'schedule',
    title: '6. Unified Fasting & Schedule Hub',
    subtitle: 'Fasting window targets, circadian eating times & macro targets',
    icon: <Clock className="w-4 h-4 text-sky-400" />,
    badge: 'Fasting & Timing',
    color: 'sky',
    destinationRoute: '/schedule'
  },
  {
    id: 'bloodwork',
    title: '7. Bloodwork, Lab Panels & BioAge Testing',
    subtitle: 'PDF lab uploads, PhenoAge biological age gap & longevity ranges',
    icon: <Activity className="w-4 h-4 text-rose-400" />,
    badge: 'Biological Age & Labs',
    color: 'rose',
    destinationRoute: '/physiological-age'
  },
  {
    id: 'explore',
    title: '8. Explore Clinical Protocols Catalog',
    subtitle: '100+ verified stacks (Blueprint, Attia, Sinclair, Longo FMD)',
    icon: <Search className="w-4 h-4 text-amber-400" />,
    badge: 'Protocol Library',
    color: 'amber',
    destinationRoute: '/explore'
  },
  {
    id: 'bench',
    title: '9. The Bench & Staging Sandbox',
    subtitle: 'Saving modalities to customize and experiment before going live',
    icon: <Bookmark className="w-4 h-4 text-indigo-400" />,
    badge: 'Sandbox & Backlog',
    color: 'indigo',
    destinationRoute: '/bench'
  },
  {
    id: 'coach',
    title: '10. AI Longevity Coach & In-App Guide',
    subtitle: 'Circadian sequencing advice, synergy checks & 1-click stack enrollment',
    icon: <Sparkles className="w-4 h-4 text-purple-400" />,
    badge: 'AI Assistant',
    color: 'purple',
    destinationRoute: '/coach'
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
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }, [])

  const scrollToChapter = (id: string) => {
    setActiveChapter(id)
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', `#${id}`)
      const el = document.getElementById(id)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28 selection:bg-purple-500/30">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-white/10 px-4 py-3 sm:py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Go Back"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                  LEVL Protocols Playbook &amp; App Tour
                </h1>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Comprehensive visual guide to protocol tracking, biometric outcomes, fasting, lab uploads, and AI coaching.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/today"
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-900/30 flex items-center gap-1.5"
            >
              <span>Launch App</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-8">
        {/* Hero Banner */}
        <section className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-purple-950/70 via-slate-900 to-indigo-950/50 border border-purple-500/30 shadow-2xl relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-mono font-bold">
              <Sparkles size={12} className="text-purple-400" />
              <span>Interactive Clinical Longevity Playbook</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Master Every Dimension of Your Protocol Stack
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Explore step-by-step walkthroughs for logging before/after outcomes, unlocking specialized Precision Complete data, configuring custom 1-tap hotkeys, running PhenoAge blood tests, and dialing in your circadian fasting schedule.
            </p>
          </div>
        </section>

        {/* Directory Navigator (Horizontal pill scroller) */}
        <nav className="sticky top-16 z-30 bg-slate-950/95 backdrop-blur-md py-2.5 -mx-4 px-4 border-b border-white/5 overflow-x-auto scrollbar-hide flex items-center gap-2">
          {CHAPTERS.map(ch => {
            const isSelected = activeChapter === ch.id
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => scrollToChapter(ch.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer border shrink-0 ${
                  isSelected
                    ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-900/40 scale-105'
                    : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {ch.icon}
                <span>{ch.title.split('. ')[1] || ch.title}</span>
              </button>
            )
          })}
        </nav>

        {/* ========================================================================= */}
        {/* CHAPTER 1: TODAY TIMELINE */}
        {/* ========================================================================= */}
        <section id="today" className="scroll-mt-32 space-y-4 pt-4">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-emerald-500/20 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
                <Calendar size={16} />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  1. Today&apos;s Protocol Timeline &amp; Circadian Execution
                </h3>
                <p className="text-xs text-slate-400">
                  Organizing modalities into biologically aligned circadian windows.
                </p>
              </div>
            </div>
            <Link
              href="/today"
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 hover:text-white transition-all flex items-center gap-1 shadow-sm"
            >
              <span>Open Today Timeline</span>
              <ExternalLink size={12} />
            </Link>
          </div>

          {/* Visual Showcase Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-6 space-y-4 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mockup Left: Circadian Buckets */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <Clock size={11} /> Circadian Buckets Preview
                </span>
                <div className="space-y-2">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-amber-500/20 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Sun size={14} className="text-amber-400" />
                      <span className="font-bold text-slate-200">Morning Sunlight Viewing</span>
                    </div>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">Within 30m waking</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-purple-500/20 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Layers size={14} className="text-purple-400" />
                      <span className="font-bold text-slate-200">Morning Longevity Stack (6 pills)</span>
                    </div>
                    <span className="text-[10px] font-mono text-purple-300 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/40">With EVOO</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-emerald-500/20 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Flame size={14} className="text-orange-400" />
                      <span className="font-bold text-slate-200">Sauna Hyperthermia</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">174°F / 20m</span>
                  </div>
                </div>
              </div>

              {/* Mockup Right: View Selector & Wellbeing */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1">
                  <Activity size={11} /> Multi-Day Planning &amp; Daily Check-in
                </span>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-300">View Modes:</span>
                    <div className="flex items-center gap-1">
                      <span className="px-2 py-0.5 rounded bg-purple-600 text-white font-bold text-[10px]">Today</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">3-Day</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">7-Day</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">Month</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-emerald-500/20 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-emerald-300">Daily Wellbeing Check-in:</span>
                      <span className="font-mono text-slate-400">8.4 / 10 Avg</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 text-[10px] text-center font-mono">
                      <div className="bg-slate-950 p-1 rounded border border-white/5">Mood: 8</div>
                      <div className="bg-slate-950 p-1 rounded border border-white/5">Energy: 9</div>
                      <div className="bg-slate-950 p-1 rounded border border-white/5">Stress: 2</div>
                      <div className="bg-slate-950 p-1 rounded border border-white/5">Sleep: 8.5</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step-by-Step Guidance */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
                <div className="text-xs font-extrabold text-emerald-400 font-mono">STEP 1: Circadian Slots</div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Interventions automatically group by biological timing (Morning Sun, Morning Stack, Midday Meal, Afternoon Training, Evening Recovery, Pre-Bed).
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
                <div className="text-xs font-extrabold text-emerald-400 font-mono">STEP 2: Multi-Day Views</div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Switch seamlessly between Single-Day, 3-Day Rolling Split, 7-Day Week, and Month Matrix to visualize your adherence and rest intervals.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
                <div className="text-xs font-extrabold text-emerald-400 font-mono">STEP 3: Daily Wellbeing</div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Log your morning wellbeing check-in banner (0-10 on mood, energy, stress, sleep) to power your longitudinal efficacy correlations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* CHAPTER 2: OUTCOMES (BEFORE, AFTER & DURING) */}
        {/* ========================================================================= */}
        <section id="outcomes" className="scroll-mt-32 space-y-4 pt-4">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-teal-500/20 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-400 flex items-center justify-center font-bold">
                <HeartPulse size={16} />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  2. Outcome Tracking: Before, After &amp; During (Intra-Session)
                </h3>
                <p className="text-xs text-slate-400">
                  Measuring acute bio-signals, therapeutic shifts, and understanding execution-only metrics.
                </p>
              </div>
            </div>
            <Link
              href="/today"
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-teal-950/60 hover:bg-teal-900 border border-teal-500/40 text-teal-300 hover:text-white transition-all flex items-center gap-1 shadow-sm"
            >
              <span>Try in Today</span>
              <ExternalLink size={12} />
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-6 space-y-4 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left: Pre -> Post Delta Comparison */}
              <div className="rounded-xl border border-teal-500/30 bg-slate-950 p-4 space-y-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                  <Activity size={12} /> Acute Pre → Post Shift (e.g. Cold Plunge / Sauna)
                </span>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-purple-500/30 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-300">1. Baseline (Before Plunge):</span>
                      <span className="text-[10px] font-mono bg-purple-950 px-1.5 py-0.5 rounded text-purple-200">Pre-Session</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300 font-mono text-[11px]">
                      <span>Stress: 8 / 10 (Elevated)</span>
                      <span>Alertness: 3 / 10 (Groggy)</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-emerald-500/30 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-300">2. Outcome (After Plunge):</span>
                      <span className="text-[10px] font-mono bg-emerald-950 px-1.5 py-0.5 rounded text-emerald-200">Post-Session</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-200 font-mono text-[11px]">
                      <span className="text-emerald-400 font-bold">Stress: 2 / 10 (-75% Drop)</span>
                      <span className="text-emerald-400 font-bold">Alertness: 9 / 10 (+200%)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Why Some Are During-Only */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Dumbbell size={12} /> Intra-Session / During-Only (Strength &amp; Endurance)
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Why don&apos;t strength workouts or Zone 2 cardio have a &ldquo;Before Strength&rdquo; slider?
                </p>
                <div className="p-3 rounded-lg bg-slate-900/80 border border-amber-500/20 text-xs text-slate-300 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span><strong>Physical Capacity is Delivered During Execution:</strong> You cannot rate workout strength before lifting; it measures actual capacity delivered (sets, reps, watts, active HR).</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span><strong>Morning Sleep Quality:</strong> Evaluated upon waking based on cumulative overnight sleep architecture.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Deep Step-by-Step */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
                <div className="text-xs font-extrabold text-teal-400 font-mono">1. Log Baseline (Before)</div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  On reactive modalities, tap <span className="text-purple-300 font-bold">Log Baseline (Before)</span> to record acute pre-state (Stress, Alertness, Mood, Joint Pain, Satiety).
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
                <div className="text-xs font-extrabold text-teal-400 font-mono">2. How Do You Feel? (After)</div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Upon marking the task complete, adjust post-session sliders. LEVL calculates your exact therapeutic delta shift and logs the observation.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
                <div className="text-xs font-extrabold text-teal-400 font-mono">3. Customize Sliders</div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Tap <span className="text-cyan-300 font-bold">Customize Tracked Outcomes</span> on any card to add or remove bio-signal sliders tailored to your health goals.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* CHAPTER 3: PRECISION COMPLETE */}
        {/* ========================================================================= */}
        <section id="precision" className="scroll-mt-32 space-y-4 pt-4">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-emerald-500/20 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
                <CheckCircle2 size={16} />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  3. Precision Complete &amp; Specialized Execution Logging
                </h3>
                <p className="text-xs text-slate-400">
                  Granular bio-mechanical parameters: Thermal exposure, HR zones, sets, reps &amp; wavelengths.
                </p>
              </div>
            </div>
            <Link
              href="/today"
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 hover:text-white transition-all flex items-center gap-1 shadow-sm"
            >
              <span>View Modality Cards</span>
              <ExternalLink size={12} />
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-6 space-y-4 shadow-xl">
            <div className="rounded-xl border border-emerald-500/30 bg-slate-950 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-lg bg-emerald-500 text-black font-extrabold text-xs flex items-center gap-1 shadow-md">
                    <CheckCircle2 size={13} /> Precision Complete
                  </span>
                  <span className="text-xs text-slate-300 font-bold">Specialized Execution Modals</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">Clinical Grade</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1 text-xs">
                <div className="p-3 rounded-lg bg-slate-900 border border-orange-500/20 space-y-1">
                  <div className="font-bold text-orange-300 flex items-center gap-1">
                    <Flame size={12} /> Thermal Exposure
                  </div>
                  <p className="text-[11px] text-slate-400">Sauna 174°F / 20 mins; Cold plunge 50°F / 3 mins; Søberg natural re-warm notes.</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-sky-500/20 space-y-1">
                  <div className="font-bold text-sky-300 flex items-center gap-1">
                    <Activity size={12} /> Cardio &amp; Zones
                  </div>
                  <p className="text-[11px] text-slate-400">Zone 2 duration, active 135 bpm HR, VO2 Max intervals, average watts &amp; distance.</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-purple-500/20 space-y-1">
                  <div className="font-bold text-purple-300 flex items-center gap-1">
                    <Dumbbell size={12} /> Strength &amp; Load
                  </div>
                  <p className="text-[11px] text-slate-400">Multi-set execution, weight load (lbs/kg), reps completed, RPE fatigue score.</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-rose-500/20 space-y-1">
                  <div className="font-bold text-rose-300 flex items-center gap-1">
                    <Sun size={12} /> Photobiomodulation
                  </div>
                  <p className="text-[11px] text-slate-400">Red/NIR 660nm &amp; 850nm wavelengths, panel distance, irradiance duration.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
                <div className="text-xs font-bold text-emerald-400">1-Click Fast Log vs Precision Log</div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Mark complete with standard 1-click button for rapid compliance, or tap <span className="text-emerald-300 font-bold">Precision Complete</span> when you want to track exact bio-mechanical telemetry.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
                <div className="text-xs font-bold text-emerald-400">Longitudinal Efficacy Mapping</div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Every precision metric links into your historical debrief reports, establishing dose-response curves against your biological age score and wellbeing.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* CHAPTER 4: MODALITY STUDIO & GEEK MODE */}
        {/* ========================================================================= */}
        <section id="studio" className="scroll-mt-32 space-y-4 pt-4">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-cyan-500/20 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center font-bold">
                <Sliders size={16} />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  4. Modality Personalization Studio, Geek Mode &amp; Titration
                </h3>
                <p className="text-xs text-slate-400">
                  Deep biological mechanisms, PubMed citations, dose spectrum sliders &amp; skip policies.
                </p>
              </div>
            </div>
            <Link
              href="/today"
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 hover:text-white transition-all flex items-center gap-1 shadow-sm"
            >
              <span>Personalize a Modality</span>
              <ExternalLink size={12} />
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-6 space-y-4 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Studio Left: Dosing Spectrum & Cadence */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Sliders size={12} /> Modality Studio Dosing &amp; Cadence
                </span>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <span className="font-bold text-slate-200">Dosage Spectrum Slider:</span>
                    <div className="flex items-center justify-between font-mono text-[11px] text-slate-400 pt-1">
                      <span>Starter: 100mg</span>
                      <span className="text-cyan-300 font-bold bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">Target: 500mg</span>
                      <span>Clinical: 1,000mg</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <span className="font-bold text-slate-200">Secondary Vehicle Synergy:</span>
                    <p className="text-[11px] text-slate-300 italic">&ldquo;Take with 1 tbsp Extra Virgin Olive Oil for fat-soluble bioavailability.&rdquo;</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <span className="font-bold text-slate-200">Missed Dose Policy:</span>
                    <span className="text-cyan-300 font-mono text-[11px] font-bold">Roll Forward (Next Day)</span>
                  </div>
                </div>
              </div>

              {/* Studio Right: Geek Mode */}
              <div className="rounded-xl border border-cyan-500/30 bg-slate-950 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                    <Microscope size={12} /> 🔬 Geek Mode Science
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/40">Evidence Grade A</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <span className="font-bold text-slate-200">Primary Biological Mechanism:</span>
                    <p className="text-[11px] text-slate-300">SIRT1 deacetylation, NAD+ salvage pathway conservation, and mTORC1 inhibition.</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <span className="font-bold text-slate-200">Hallmarks of Aging Impacted:</span>
                    <div className="flex items-center gap-1 flex-wrap pt-0.5">
                      <span className="text-[10px] bg-purple-950/80 text-purple-300 px-2 py-0.5 rounded border border-purple-800">Cellular Senescence</span>
                      <span className="text-[10px] bg-teal-950/80 text-teal-300 px-2 py-0.5 rounded border border-teal-800">Mitochondrial Dysfunction</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-cyan-500/30 flex items-center justify-between text-cyan-300">
                    <span className="font-bold">PubMed Paper Link:</span>
                    <span className="font-mono text-[10px] underline">PMID: 34567890 ↗</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Studio Summary Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
                <div className="text-xs font-bold text-cyan-400">1. Open Modality Studio</div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Click the gear or <span className="text-cyan-300 font-bold">Personalize</span> button on any modality card to access cadence settings, rest intervals, and dose sliders.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
                <div className="text-xs font-bold text-cyan-400">2. Titrate Dosages</div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Slide between starter, personal target, and clinical study maximum doses with automatic unit conversions.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
                <div className="text-xs font-bold text-cyan-400">3. Inspect Geek Mode</div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Expand Geek Mode on any card to read molecular mechanisms, evidence effect sizes, and tap direct verified PubMed study URLs.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* CHAPTER 5: QUICK-LOG HOTKEYS */}
        {/* ========================================================================= */}
        <section id="quicklog" className="scroll-mt-32 space-y-4 pt-4">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-purple-500/20 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center font-bold">
                <Camera size={16} />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  5. Quick-Log Hotkeys: 1-Tap Logging &amp; Custom Creation
                </h3>
                <p className="text-xs text-slate-400">
                  Left vertical gradient progress bars, custom hotkey builder, and Gemini Vision AI meal plate scans.
                </p>
              </div>
            </div>
            <Link
              href="/today"
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900 border border-purple-500/40 text-purple-300 hover:text-white transition-all flex items-center gap-1 shadow-sm"
            >
              <span>Try Hotkeys on Today</span>
              <ExternalLink size={12} />
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-6 space-y-4 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left: 1-Tap & Vertical Gradient */}
              <div className="rounded-xl border border-purple-500/30 bg-slate-950 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                    <Zap size={12} /> 1-Tap Logging &amp; Left Vertical Gradient Fill Bar
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/40">Goal Progress</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Mock Hotkey Card 1 */}
                  <div className="rounded-xl border border-emerald-500/40 bg-slate-900 p-3 relative overflow-hidden space-y-2">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-t from-emerald-600 via-emerald-500 to-teal-400 rounded-l-xl" style={{ height: '75%' }} />
                    <div className="flex items-center justify-between pl-1">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs">
                        <Droplets size={12} />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded">+12</span>
                    </div>
                    <div className="pl-1">
                      <div className="text-base font-black text-white font-mono">72 <span className="text-[10px] text-slate-400 font-normal">oz</span></div>
                      <div className="text-[11px] font-bold text-slate-200">Hydration</div>
                    </div>
                    <div className="text-[9px] font-mono text-slate-400 border-t border-white/5 pt-1 pl-1 flex items-center justify-between">
                      <span>Goal: 100oz</span>
                      <span className="text-orange-400 font-bold">Details →</span>
                    </div>
                  </div>

                  {/* Mock Hotkey Card 2 */}
                  <div className="rounded-xl border border-orange-500/40 bg-slate-900 p-3 relative overflow-hidden space-y-2">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-t from-orange-600 via-orange-500 to-amber-400 rounded-l-xl" style={{ height: '100%' }} />
                    <div className="flex items-center justify-between pl-1">
                      <div className="w-6 h-6 rounded-lg bg-orange-500/20 text-orange-300 flex items-center justify-center text-xs">
                        <Flame size={12} />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-orange-300 bg-orange-500/20 px-1.5 py-0.5 rounded">+30</span>
                    </div>
                    <div className="pl-1">
                      <div className="text-base font-black text-white font-mono">160 <span className="text-[10px] text-slate-400 font-normal">g</span></div>
                      <div className="text-[11px] font-bold text-slate-200">Protein Pulse</div>
                    </div>
                    <div className="text-[9px] font-mono text-emerald-400 border-t border-white/5 pt-1 pl-1 flex items-center justify-between font-bold">
                      <span>✓ Goal Done</span>
                      <span className="text-orange-400 font-bold">Details →</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: How to Create Your Own Custom Hotkey */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                  <Plus size={12} /> How to Create &amp; Customize Your Own Hotkeys
                </span>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <span className="font-bold text-white">1. Tap &ldquo;+ Add Hotkey&rdquo; or Manage Gear:</span>
                    <p className="text-[11px] text-slate-300">Opens the hotkey builder drawer where you can select from 30+ longevity presets or craft a custom tracker.</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <span className="font-bold text-white">2. Set Precision Parameters:</span>
                    <p className="text-[11px] text-slate-300">Define Name, Icon, Unit (oz, g, mins, sessions, cups, mg), Default 1-Tap Increment (+12, +30, +1), and Daily Goal.</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <span className="font-bold text-white">3. Active Day Scheduling:</span>
                    <p className="text-[11px] text-slate-300">Choose which days of the week the hotkey appears (e.g. Sauna on Tue/Thu/Sat, Creatine daily).</p>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Vision Scan Row */}
            <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs flex items-start gap-3">
              <Camera size={18} className="text-purple-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="text-purple-200">Gemini Vision AI Meal Plate Scanner:</strong>
                <p className="text-slate-300 leading-relaxed">
                  Tap the first hotkey button (<span className="text-emerald-300 font-bold">Meal / Fast Break</span>) to photograph your plate. Multimodal Vision AI instantly extracts calories, protein, carbs, prebiotic fiber, healthy fats, botanical plant diversity count, and lets you add or remove specific constituent ingredients.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* CHAPTER 6: UNIFIED FASTING & SCHEDULE HUB */}
        {/* ========================================================================= */}
        <section id="schedule" className="scroll-mt-32 space-y-4 pt-4">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-sky-500/20 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-400 flex items-center justify-center font-bold">
                <Clock size={16} />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  6. Unified Fasting &amp; Schedule Hub
                </h3>
                <p className="text-xs text-slate-400">
                  Fasting protocols (16:8, 18:6, OMAD), circadian eating windows &amp; precision macro targets.
                </p>
              </div>
            </div>
            <Link
              href="/schedule"
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-sky-950/60 hover:bg-sky-900 border border-sky-500/40 text-sky-300 hover:text-white transition-all flex items-center gap-1 shadow-sm"
            >
              <span>Open Schedule Hub</span>
              <ExternalLink size={12} />
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-6 space-y-4 shadow-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-950 border border-sky-500/30 space-y-1">
                <span className="text-[10px] font-mono text-sky-400 uppercase font-bold">[Edit] Fasting Window</span>
                <div className="text-base font-black text-white">16:8 Protocol</div>
                <p className="text-[10px] text-slate-400">16h Fasting / 8h Eating Window</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-1">
                <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">[Edit] Fast Break Time</span>
                <div className="text-base font-black text-white">12:00 PM</div>
                <p className="text-[10px] text-slate-400">First Bite Circadian Target</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/30 space-y-1">
                <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">[Edit] Fast Cutoff Time</span>
                <div className="text-base font-black text-white">8:00 PM</div>
                <p className="text-[10px] text-slate-400">Last Bite / Fast Initiation</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-purple-500/30 space-y-1">
                <span className="text-[10px] font-mono text-purple-400 uppercase font-bold">[Edit] Daily Targets</span>
                <div className="text-base font-black text-white">2,200 kcal</div>
                <p className="text-[10px] text-slate-400">160g P • 45g Fiber • 70g Fat</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
                <div className="text-xs font-bold text-sky-400">1. Tap Any Headline Card</div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Click any of the 4 KPI cards above to open the Fasting &amp; Nutrition Targets Drawer.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
                <div className="text-xs font-bold text-sky-400">2. Dial In Fasting &amp; Macros</div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Choose 16:8, 18:6, 20:4, OMAD, or custom fasting hours, and set separate targets for Net Carbs vs Prebiotic Fiber.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
                <div className="text-xs font-bold text-sky-400">3. Smart Rescheduling Grid</div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  In the Schedule split view, easily drag, drop, roll over missed days, or push upcoming sessions forward.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* CHAPTER 7: BLOODWORK & PHENOAGE */}
        {/* ========================================================================= */}
        <section id="bloodwork" className="scroll-mt-32 space-y-4 pt-4">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-rose-500/20 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center font-bold">
                <Activity size={16} />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  7. Bloodwork, Lab Panels &amp; BioAge (PhenoAge) Testing
                </h3>
                <p className="text-xs text-slate-400">
                  Uploading lab PDFs, AI biomarker extraction, and clinical 9-biomarker PhenoAge calculations.
                </p>
              </div>
            </div>
            <Link
              href="/physiological-age"
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 hover:text-white transition-all flex items-center gap-1 shadow-sm"
            >
              <span>Open BioAge Hub</span>
              <ExternalLink size={12} />
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-6 space-y-4 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left: Upload & Extraction */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                  <FileText size={12} /> Multimodal Lab Vision AI Upload
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Upload any PDF report or photo of bloodwork from Quest Diagnostics, Labcorp, Function Health, Marek Health, etc.
                </p>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-rose-500/20 text-xs space-y-1.5 font-mono">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>• ApoB:</span>
                    <span className="text-emerald-400 font-bold">68 mg/dL (Optimal &lt; 70)</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>• hs-CRP:</span>
                    <span className="text-emerald-400 font-bold">0.3 mg/L (Optimal &lt; 0.5)</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>• Fasting Glucose:</span>
                    <span className="text-emerald-400 font-bold">84 mg/dL</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>• HbA1c:</span>
                    <span className="text-emerald-400 font-bold">5.1%</span>
                  </div>
                </div>
              </div>

              {/* Right: PhenoAge Gauge */}
              <div className="rounded-xl border border-rose-500/30 bg-slate-950 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                    <Activity size={12} /> PhenoAge Biological Age Gap
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">Morgan Levine Algorithm</span>
                </div>
                <div className="p-3 rounded-lg bg-gradient-to-br from-purple-950/40 to-slate-900 border border-purple-500/30 text-center space-y-1">
                  <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">-7.2 Years</div>
                  <div className="text-xs text-slate-200 font-bold">Biological Age: 34.8 vs Chronological: 42.0</div>
                  <p className="text-[11px] text-slate-400">Your cellular senescence and organ resilience is decelerated relative to peers.</p>
                </div>
              </div>
            </div>

            {/* Deep Step-by-Step */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
                <div className="text-xs font-bold text-rose-400">1. Upload Lab PDF or Photo</div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Navigate to <span className="text-rose-300 font-bold">Physiological Age</span> and tap the upload button. No manual transcription needed.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
                <div className="text-xs font-bold text-rose-400">2. Longevity Reference Ranges</div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Biomarkers are benchmarked against optimal longevity targets rather than standard broad hospital sickness ranges.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
                <div className="text-xs font-bold text-rose-400">3. PhenoAge Gap Tracking</div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Track your biological age trajectory across consecutive panels to verify if your protocols are truly moving the needle.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* CHAPTER 8: EXPLORE PROTOCOLS */}
        {/* ========================================================================= */}
        <section id="explore" className="scroll-mt-32 space-y-4 pt-4">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-amber-500/20 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold">
                <Search size={16} />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  8. Explore Clinical Protocols Catalog
                </h3>
                <p className="text-xs text-slate-400">
                  100+ clinical protocols (Bryan Johnson Blueprint, Peter Attia Decathlon, Sinclair Epigenetic Stack, Valter Longo FMD).
                </p>
              </div>
            </div>
            <Link
              href="/explore"
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900 border border-amber-500/40 text-amber-300 hover:text-white transition-all flex items-center gap-1 shadow-sm"
            >
              <span>Browse Catalog</span>
              <ExternalLink size={12} />
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-6 space-y-4 shadow-xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="text-xs font-bold text-amber-300">Bryan Johnson Blueprint 2026</div>
                <p className="text-[11px] text-slate-400">Comprehensive multi-vector biomarkers, longevity supplements, and circadian schedule.</p>
                <span className="inline-block text-[10px] font-mono bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-800">54 Steps</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="text-xs font-bold text-cyan-300">Peter Attia Centenarian Decathlon</div>
                <p className="text-[11px] text-slate-400">Zone 2 endurance, VO2 max intervals, stability, heavy carries, and vascular ApoB targets.</p>
                <span className="inline-block text-[10px] font-mono bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800">Physicality</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="text-xs font-bold text-purple-300">Valter Longo Fasting-Mimicking Diet</div>
                <p className="text-[11px] text-slate-400">5-day periodic caloric restriction inducing deep systemic autophagy and stem cell renewal.</p>
                <span className="inline-block text-[10px] font-mono bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-800">Autophagy</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 text-xs text-slate-300 space-y-1">
              <strong className="text-white">1-Click Enrollment &amp; Protocol Comparison:</strong>
              <p className="leading-relaxed">
                Tap any protocol card to review the scientific dossier, target biological vectors, and compare protocols side-by-side. Tap <span className="text-emerald-300 font-bold">Enroll Protocol</span> to schedule all constituent steps directly into Today, or <span className="text-indigo-300 font-bold">Add to Bench</span> to experiment first.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* CHAPTER 9: THE BENCH */}
        {/* ========================================================================= */}
        <section id="bench" className="scroll-mt-32 space-y-4 pt-4">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-indigo-500/20 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center font-bold">
                <Bookmark size={16} />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  9. The Bench &amp; Protocol Staging Sandbox
                </h3>
                <p className="text-xs text-slate-400">
                  Staging area to research, tune dosages, and experiment before activating into your live routine.
                </p>
              </div>
            </div>
            <Link
              href="/bench"
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 hover:text-white transition-all flex items-center gap-1 shadow-sm"
            >
              <span>Open The Bench</span>
              <ExternalLink size={12} />
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-6 space-y-4 shadow-xl">
            <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-indigo-300">Why Use The Bench?</span>
                <span className="text-[10px] font-mono text-slate-400">Backlog Management</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                When you discover exciting longevity interventions (e.g. Fisetin senolytic cycling, peptide titrations, or infrared heat therapy), add them to <span className="text-indigo-300 font-bold">The Bench</span>. You can configure their dosage sliders, study their Geek Mode papers, and customize their cadence without cluttering your daily schedule until you are ready to promote them to Today.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* CHAPTER 10: AI LONGEVITY COACH */}
        {/* ========================================================================= */}
        <section id="coach" className="scroll-mt-32 space-y-4 pt-4">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-purple-500/20 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center font-bold">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  10. AI Longevity Coach &amp; In-App Guide
                </h3>
                <p className="text-xs text-slate-400">
                  Circadian sequencing advice, supplement synergy checks, and 1-click addition to Today.
                </p>
              </div>
            </div>
            <Link
              href="/coach"
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900 border border-purple-500/40 text-purple-300 hover:text-white transition-all flex items-center gap-1 shadow-sm"
            >
              <span>Chat with Coach</span>
              <ExternalLink size={12} />
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-6 space-y-4 shadow-xl">
            <div className="p-4 rounded-xl bg-slate-950 border border-purple-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                  <Sparkles size={12} /> Inline AI Coach on Today Timeline
                </span>
                <span className="text-[10px] font-mono text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-800">20 Rotating Clinical Prompts</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Located right under your Daily Longevity Tip banner on the Today timeline, the single-line AI Longevity Coach bar provides rapid evidence-based answers tailored directly to your active stack and profile.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-white/5 space-y-1">
                  <div className="font-bold text-purple-300">1. Stack Synergies</div>
                  <p className="text-[11px] text-slate-400">Ask about absorption timing (e.g. fat-soluble vitamins, caffeine cutoff times, cold vs sauna sequencing).</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-white/5 space-y-1">
                  <div className="font-bold text-purple-300">2. In-App Navigation</div>
                  <p className="text-[11px] text-slate-400">Ask where to find features (e.g. &ldquo;where do I upload bloodwork&rdquo;) for instant deep-link navigation buttons.</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-white/5 space-y-1">
                  <div className="font-bold text-purple-300">3. 1-Click Enrollment</div>
                  <p className="text-[11px] text-slate-400">When the coach suggests an intervention, tap <span className="text-emerald-300 font-bold">Add to Today</span> to immediately schedule it into your routine.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer Navigation */}
        <div className="pt-8 text-center space-y-3">
          <Link
            href="/today"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-purple-950/50 transition-all cursor-pointer hover:scale-105"
          >
            <span>Launch Today Protocol Timeline</span>
            <ArrowRight size={16} />
          </Link>
          <div>
            <Link href="/settings" className="text-xs text-slate-400 hover:text-slate-200 transition-colors">
              ← Return to Profile &amp; Settings
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
