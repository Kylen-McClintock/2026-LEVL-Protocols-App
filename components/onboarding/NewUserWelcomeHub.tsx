'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Sparkles, ArrowRight, ShieldCheck, Zap, Moon, 
  Brain, Dna, Dumbbell, Flame, Heart, Clock, Sun, 
  ChevronDown, ChevronUp, ChevronRight, X, Bot, 
  Award, Sliders, CheckCircle2, Droplets, Compass, Thermometer
} from 'lucide-react'

interface NewUserWelcomeHubProps {
  onOpenEnrollModal: () => void
  onDismiss?: () => void
  userFirstName?: string
}

// Top Marquee Protocols for Pathway 2
const SHOWCASE_PROTOCOLS = [
  {
    id: 'bryan-johnson-2026',
    title: 'Bryan Johnson Blueprint 2026',
    tagline: 'Longevity Olympics • Multiorgan Biomarker Optimization',
    badge: 'Flagship Bio-Stack',
    badgeColor: 'text-cyan-300 bg-cyan-950/80 border-cyan-500/40',
    accentColor: 'from-cyan-500/20 via-blue-500/10 to-indigo-500/20 border-cyan-500/40',
    icon: Dna,
    highlights: [
      '1 tbsp EVOO (Polyphenols) + Micro-Dosed Lithium',
      'Morning Photobiomodulation (Red Light Panel)',
      'Strict 11-Hour Feeding Window & Caloric Restriction'
    ],
    effort: 'Comprehensive'
  },
  {
    id: 'huberman-foundational',
    title: 'Andrew Huberman Foundational Routine',
    tagline: 'SCN Circadian Entrainment • Dopamine Homeostasis',
    badge: 'Neurobiology Anchor',
    badgeColor: 'text-amber-300 bg-amber-950/80 border-amber-500/40',
    accentColor: 'from-amber-500/20 via-orange-500/10 to-purple-500/20 border-amber-500/40',
    icon: Sun,
    highlights: [
      '10–15m Retinal Photons within 60m of waking',
      '90–120m Caffeine Delay (Clear Adenosine first)',
      'Deliberate Cold Exposure + Physiological Sigh'
    ],
    effort: 'High 80/20 ROI'
  },
  {
    id: 'peter-attia-centenarian',
    title: 'Peter Attia Centenarian Decathlon',
    tagline: 'Cardiorespiratory Peak & Structural Longevity',
    badge: 'Athletic Longevity',
    badgeColor: 'text-emerald-300 bg-emerald-950/80 border-emerald-500/40',
    accentColor: 'from-emerald-500/20 via-teal-500/10 to-blue-500/20 border-emerald-500/40',
    icon: Heart,
    highlights: [
      'Zone 2 Aerobic Base (3–4 hours/week)',
      'Norwegian 4x4 High-Intensity VO2 Max Intervals',
      '1.6g/kg Targeted Protein + Heavy Grip Rucking'
    ],
    effort: 'Cardio & Strength'
  },
  {
    id: 'zero-cost-80-20',
    title: 'Foundational 80/20 Longevity Stack',
    tagline: 'Maximum Biological ROI with $0 Spent & Zero Supplements',
    badge: '$0 Baseline Habits',
    badgeColor: 'text-purple-300 bg-purple-950/80 border-purple-500/40',
    accentColor: 'from-purple-500/20 via-indigo-500/10 to-slate-500/20 border-purple-500/40',
    icon: Zap,
    highlights: [
      'Outdoor morning sunlight + sea-salt hydration',
      '30-minute post-meal glucose clearing walks',
      '10-hour caffeine curfew & strict blue-light cutoff'
    ],
    effort: 'Minimal Friction'
  },
  {
    id: 'rhonda-patrick-hsp',
    title: 'Rhonda Patrick Heat Shock & Nutrients',
    tagline: 'HSP70 Chaperone Induction & Cellular Autophagy',
    badge: 'Thermal Science',
    badgeColor: 'text-rose-300 bg-rose-950/80 border-rose-500/40',
    accentColor: 'from-rose-500/20 via-red-500/10 to-amber-500/20 border-rose-500/40',
    icon: Flame,
    highlights: [
      'Finnish Sauna 174°F+ (20m 4x/wk for HSP70)',
      'Sulforaphane (Broccoli Sprouts for Nrf2 pathway)',
      'High-Dose EPA/DHA Omega-3s (2–4g daily)'
    ],
    effort: 'Thermal & Cellular'
  }
]

// Tailored Prompts for Pathway 3 (Beginner-specific: goals + constraints)
const SHOWCASE_AI_PROMPTS = [
  {
    text: "I'm 44yo with elevated ApoB and only 35 minutes a day. Build me a morning routine for heart longevity and deep sleep with zero expensive gear.",
    tag: "Heart Health • 35m Budget"
  },
  {
    text: "I already take Creatine and drink black coffee. What are the 3 highest-yield modalities to add for energy and cognitive longevity on a $50/mo budget?",
    tag: "Energy • $50/mo Budget"
  },
  {
    text: "I work late and have trouble falling asleep before 1 AM. Design a circadian reset protocol with strict evening wind-down rules.",
    tag: "Sleep Reset • Late Schedule"
  },
  {
    text: "Give me the 80/20 'busy parent' version of Bryan Johnson's Blueprint that takes under 25 minutes a day.",
    tag: "80/20 Blueprint • 25m Daily"
  },
  {
    text: "I want to maximize VO2 Max and lower biological age. I have access to a gym, cold plunge tub, and Apple Watch.",
    tag: "VO2 Max • Hardware Access"
  }
]

export default function NewUserWelcomeHub({
  onOpenEnrollModal,
  onDismiss,
  userFirstName
}: NewUserWelcomeHubProps) {
  const router = useRouter()

  // Click-to-Expand Preview Drawer state for Pathway 1
  const [expandedPillar, setExpandedPillar] = useState<'biology' | 'goals' | 'constraints' | null>(null)
  const [activeGoalTab, setActiveGoalTab] = useState<'heart' | 'sleep' | 'cognition' | 'cellular'>('heart')

  // Protocol Showcase Marquee auto-cycle
  const [protocolIndex, setProtocolIndex] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => {
      setProtocolIndex(prev => (prev + 1) % SHOWCASE_PROTOCOLS.length)
    }, 7000)
    return () => clearInterval(timer)
  }, [])

  // AI Coach Prompts auto-cycle
  const [promptIndex, setPromptIndex] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => {
      setPromptIndex(prev => (prev + 1) % SHOWCASE_AI_PROMPTS.length)
    }, 6500)
    return () => clearInterval(timer)
  }, [])

  const currentProtocol = SHOWCASE_PROTOCOLS[protocolIndex]
  const currentPrompt = SHOWCASE_AI_PROMPTS[promptIndex]

  const handleLaunchCoachWithPrompt = (promptText: string) => {
    router.push(`/coach?prompt=${encodeURIComponent(promptText)}`)
  }

  return (
    <div className="mb-8 rounded-3xl bg-gradient-to-br from-slate-900/95 via-slate-950 to-indigo-950/70 border border-indigo-500/30 shadow-[0_8px_40px_rgba(79,70,229,0.18)] relative overflow-hidden backdrop-blur-xl animate-in fade-in duration-300">
      {/* Ambient background glows */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 p-5 sm:p-7 md:p-8 space-y-6">
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-indigo-300 bg-indigo-950/80 border border-indigo-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm">
                <Sparkles size={11} className="text-amber-400" />
                First-Run Launchpad
              </span>
              <span className="text-[11px] font-medium text-slate-400">
                Choose how you want to build your daily protocol
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
              Welcome to LEVL{userFirstName && userFirstName !== 'Your' ? `, ${userFirstName}` : ''}.
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Generic health checklists fail because human biology isn’t generic. Pick the entry point that fits you best below to generate your daily science-backed routine.
            </p>
          </div>

          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              title="Dismiss launchpad and explore sample schedule"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* ── PATHWAY 1 (PRIMARY CTA): CALIBRATE TO BIOLOGY, GOALS & CONSTRAINTS ── */}
        <div className="rounded-2xl bg-gradient-to-r from-indigo-950/70 via-purple-950/50 to-slate-900/90 border-2 border-indigo-500/40 p-4 sm:p-6 shadow-xl relative overflow-hidden transition-all duration-300">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-950/80 border border-amber-500/40 px-2.5 py-0.5 rounded-full">
                  ⭐ Recommended Starting Path
                </span>
                <span className="text-[11px] text-slate-400">
                  Full Personalized Experience
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                <Dna className="text-indigo-400 shrink-0" size={20} />
                Calibrate to Your Biology, Goals &amp; Constraints
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Answer our guided onboarding questions to synchronize dosing windows to your exact wake &amp; sleep curve, select targeted longevity vectors, and filter by your real-world time budget.
              </p>
            </div>

            {/* Launch Primary Onboarding Flow Button */}
            <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2">
              <button
                type="button"
                onClick={() => router.push('/onboarding')}
                className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs sm:text-sm font-extrabold shadow-lg shadow-indigo-600/30 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <span>Begin Biological Calibration</span>
                <ArrowRight size={16} />
              </button>
              <span className="text-[11px] text-slate-400 text-center lg:text-right font-medium">
                Takes you to our interactive onboarding wizard
              </span>
            </div>
          </div>

          {/* 3 Click-to-Expand Preview Pillar Buttons */}
          <div className="mt-5 pt-4 border-t border-indigo-500/20 space-y-3">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={13} className="text-indigo-400" />
              <span>Tap to preview what our calibration tailors:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Pillar 1: Biology */}
              <button
                type="button"
                onClick={() => setExpandedPillar(expandedPillar === 'biology' ? null : 'biology')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                  expandedPillar === 'biology'
                    ? 'bg-indigo-900/40 border-indigo-400 text-white shadow-md'
                    : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-700/60 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shrink-0">
                    <Sun size={14} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">🧬 1. Your Biology</div>
                    <div className="text-[10px] text-slate-400 truncate">Wake curve, biomarkers, hormones</div>
                  </div>
                </div>
                {expandedPillar === 'biology' ? <ChevronUp size={15} className="text-indigo-400 shrink-0" /> : <ChevronDown size={15} className="text-slate-400 shrink-0" />}
              </button>

              {/* Pillar 2: Goals */}
              <button
                type="button"
                onClick={() => setExpandedPillar(expandedPillar === 'goals' ? null : 'goals')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                  expandedPillar === 'goals'
                    ? 'bg-purple-900/40 border-purple-400 text-white shadow-md'
                    : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-700/60 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 shrink-0">
                    <Heart size={14} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">🎯 2. Your Goals</div>
                    <div className="text-[10px] text-slate-400 truncate">Heart &amp; VO2, deep sleep, cognition</div>
                  </div>
                </div>
                {expandedPillar === 'goals' ? <ChevronUp size={15} className="text-purple-400 shrink-0" /> : <ChevronDown size={15} className="text-slate-400 shrink-0" />}
              </button>

              {/* Pillar 3: Constraints */}
              <button
                type="button"
                onClick={() => setExpandedPillar(expandedPillar === 'constraints' ? null : 'constraints')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                  expandedPillar === 'constraints'
                    ? 'bg-teal-900/40 border-teal-400 text-white shadow-md'
                    : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-700/60 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 shrink-0">
                    <Clock size={14} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">⚖️ 3. Your Constraints</div>
                    <div className="text-[10px] text-slate-400 truncate">Time caps, $0 habits, hardware</div>
                  </div>
                </div>
                {expandedPillar === 'constraints' ? <ChevronUp size={15} className="text-teal-400 shrink-0" /> : <ChevronDown size={15} className="text-slate-400 shrink-0" />}
              </button>
            </div>

            {/* EXPANDED DRAWER: BIOLOGY */}
            {expandedPillar === 'biology' && (
              <div className="p-4 rounded-xl bg-slate-950/80 border border-indigo-500/30 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                    <Sun size={15} className="text-amber-400" />
                    <span>How LEVL Tailors Your Biology &amp; Circadian Architecture:</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setExpandedPillar(null)}
                    className="text-[11px] text-slate-400 hover:text-white"
                  >
                    Close ▴
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1.5">
                    <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                      <Clock size={13} />
                      <span>Circadian Dosing Curve</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      If you wake at 6:30 AM, outdoor sunlight photons are pinned to 6:45 AM. Your natural cortisol awakening response is protected by delaying coffee 90 minutes (8:00 AM), and your 10-hour caffeine cutoff is automatically locked to 12:30 PM.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1.5">
                    <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                      <Heart size={13} />
                      <span>Biomarkers &amp; Clinical Profiles</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Elevated ApoB or LDL-P? The engine prioritizes Extra Virgin Olive Oil polyphenols and soluble fibers. High hs-CRP systemic inflammation? Recommends Deliberate Cold Exposure + Curcumin synergies.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1.5">
                    <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                      <Dna size={13} />
                      <span>Infradian Cycles (For Women)</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Follicular Phase unlocks higher metabolic strain tolerance and cold exposure. Luteal Phase softens intensity and prioritizes magnesium glycinate and wind-down recovery.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1.5">
                    <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                      <Moon size={13} />
                      <span>Sleep Architecture Priming</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Calculates the exact 14-hour pineal melatonin synthesis timer so evening wind-down, blue-light dimming, and slow-wave sleep stacks hit right when your body is biologically ready.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => router.push('/onboarding')}
                    className="text-xs font-bold text-indigo-300 hover:text-white flex items-center gap-1.5 underline underline-offset-4 cursor-pointer"
                  >
                    <span>Proceed to full calibration with your sleep hours</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            )}

            {/* EXPANDED DRAWER: GOALS */}
            {expandedPillar === 'goals' && (
              <div className="p-4 rounded-xl bg-slate-950/80 border border-purple-500/30 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                    <Heart size={15} className="text-purple-400" />
                    <span>Select a Target Goal to Preview Its Clinical Stack:</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setExpandedPillar(null)}
                    className="text-[11px] text-slate-400 hover:text-white"
                  >
                    Close ▴
                  </button>
                </div>

                {/* Sub-tabs for goals */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveGoalTab('heart')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      activeGoalTab === 'heart'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    ❤️ Heart &amp; VO2 Max
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveGoalTab('sleep')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      activeGoalTab === 'sleep'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    🌙 Stage 3 Deep Sleep
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveGoalTab('cognition')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      activeGoalTab === 'cognition'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    🧠 Neuro-Focus &amp; Memory
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveGoalTab('cellular')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      activeGoalTab === 'cellular'
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    🧬 Autophagy &amp; Senolytics
                  </button>
                </div>

                {/* Goal Detail Content */}
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-purple-500/20 space-y-2 text-xs">
                  {activeGoalTab === 'heart' && (
                    <>
                      <div className="font-bold text-white text-sm">Target: Cardiorespiratory Longevity &amp; Endothelial Health</div>
                      <ul className="text-slate-300 space-y-1.5 text-[11px] list-disc list-inside">
                        <li><strong>Movement:</strong> 3–4x weekly Zone 2 Aerobic Base (35–45m) + 1x weekly Norwegian 4x4 VO2 Max intervals</li>
                        <li><strong>Nutrients:</strong> 1 tbsp Extra Virgin Olive Oil (Polyphenols) + 2g EPA/DHA Omega-3s + 100mg CoQ10</li>
                        <li><strong>Thermal:</strong> Finnish Sauna (20m @ 174°F / 79°C) for arterial shear stress and reduced all-cause cardiovascular mortality</li>
                        <li><strong>Biomarkers:</strong> Targets ApoB &lt; 60 mg/dL, Resting Heart Rate -4 bpm, VO2 Max +15%</li>
                      </ul>
                    </>
                  )}

                  {activeGoalTab === 'sleep' && (
                    <>
                      <div className="font-bold text-white text-sm">Target: Deep Slow-Wave &amp; REM Sleep Architecture</div>
                      <ul className="text-slate-300 space-y-1.5 text-[11px] list-disc list-inside">
                        <li><strong>Circadian:</strong> 10–15m Morning Sunlight Photons to anchor cortisol; strict 10-hour caffeine clearance window</li>
                        <li><strong>Supplements:</strong> 400mg Magnesium L-Threonate + 50mg Apigenin + 100mg L-Theanine (taken 45m before bed)</li>
                        <li><strong>Environment:</strong> 100% Blue-light block glasses at 8:30 PM + 65°F–68°F bedroom ambient temp</li>
                        <li><strong>Biomarkers:</strong> Improves sleep latency &lt; 15 mins, Stage 3 Slow-Wave sleep &gt; 1.5 hours</li>
                      </ul>
                    </>
                  )}

                  {activeGoalTab === 'cognition' && (
                    <>
                      <div className="font-bold text-white text-sm">Target: BDNF Neurogenesis &amp; Executive Focus</div>
                      <ul className="text-slate-300 space-y-1.5 text-[11px] list-disc list-inside">
                        <li><strong>Nootropic Synergies:</strong> 5g Creatine Monohydrate + 1g Taurine + Lion’s Mane Mushroom Extract</li>
                        <li><strong>Thermal Activation:</strong> Deliberate Cold Exposure (3m @ 50°F / 10°C) triggering +250% Dopamine &amp; Norepinephrine sustained for hours</li>
                        <li><strong>Circadian Habits:</strong> 90m Coffee Delay so adenosine clears naturally without afternoon grogginess</li>
                        <li><strong>Biomarkers:</strong> Subjective Focus 8+/10, Reaction Time, Zero Afternoon Crash</li>
                      </ul>
                    </>
                  )}

                  {activeGoalTab === 'cellular' && (
                    <>
                      <div className="font-bold text-white text-sm">Target: Senescent Cell Clearance &amp; Mitochondrial Turnover</div>
                      <ul className="text-slate-300 space-y-1.5 text-[11px] list-disc list-inside">
                        <li><strong>Senolytics:</strong> Intermittent Fisetin (20mg/kg) + Quercetin (1,000mg) pulse with EVOO for lipophilic bioavailability</li>
                        <li><strong>Mitochondrial Pools:</strong> Glycine + NAC (GlyNAC 1,200mg) for endogenous glutathione synthesis</li>
                        <li><strong>Autophagy Trigger:</strong> 16:8 Time-Restricted Feeding or 24-hour monthly water fast to activate AMPK and inhibit mTOR</li>
                        <li><strong>Biomarkers:</strong> PhenoAge biological clock gap reduction, lower hs-CRP systemic inflammation</li>
                      </ul>
                    </>
                  )}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => router.push('/onboarding')}
                    className="text-xs font-bold text-purple-300 hover:text-white flex items-center gap-1.5 underline underline-offset-4 cursor-pointer"
                  >
                    <span>Configure your custom goals in the onboarding wizard</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            )}

            {/* EXPANDED DRAWER: CONSTRAINTS */}
            {expandedPillar === 'constraints' && (
              <div className="p-4 rounded-xl bg-slate-950/80 border border-teal-500/30 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                    <Clock size={15} className="text-teal-400" />
                    <span>How LEVL Adapts to Your Real-World Constraints:</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setExpandedPillar(null)}
                    className="text-[11px] text-slate-400 hover:text-white"
                  >
                    Close ▴
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1.5">
                    <div className="font-bold text-teal-300 flex items-center gap-1.5">
                      <Clock size={13} />
                      <span>Daily Time Caps (15–60m)</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Only have 25 minutes a day? We prune complex 8-step rituals and activate the 80/20 Minimum Effective Dose: 10m morning sunlight + 10m brisk walk + 5m evening magnesium.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1.5">
                    <div className="font-bold text-teal-300 flex items-center gap-1.5">
                      <Zap size={13} />
                      <span>$0 Zero-Cost Baseline</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Don’t want to buy supplements? We filter for proven non-pharmacological interventions: cold showers, morning photons, physiological sigh, time-restricted eating, and post-meal walks.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1.5">
                    <div className="font-bold text-teal-300 flex items-center gap-1.5">
                      <Sliders size={13} />
                      <span>Equipment &amp; Hardware</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      No sauna or ice plunge? We auto-substitute contrast showers. Have an Oura Ring or Apple Watch? We integrate HRV and resting heart rate shifts directly into your recovery score.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => router.push('/onboarding')}
                    className="text-xs font-bold text-teal-300 hover:text-white flex items-center gap-1.5 underline underline-offset-4 cursor-pointer"
                  >
                    <span>Calibrate around your exact constraints</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── 2-COLUMN SECONDARY OPTIONS: PROVEN PROTOCOLS & AI LONGEVITY COACH ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {/* OPTION A: START WITH A PROVEN PROTOCOL */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 hover:border-indigo-500/30 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 bg-cyan-950/80 border border-cyan-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Award size={11} />
                  Option A • 1-Click Start
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {protocolIndex + 1} of {SHOWCASE_PROTOCOLS.length}
                </span>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                  <Award size={18} className="text-cyan-400 shrink-0" />
                  Start with a Proven Protocol
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Enroll in a world-class protocol in 1 click. Runs on standard 7:00 AM circadian timing.
                </p>
              </div>

              {/* Auto-Cycling Protocol Card */}
              <div className={`p-3.5 rounded-xl bg-gradient-to-br ${currentProtocol.accentColor} border transition-all duration-300 space-y-2`}>
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${currentProtocol.badgeColor}`}>
                    {currentProtocol.badge}
                  </span>
                  <span className="text-[10px] text-slate-300 font-medium">
                    Effort: {currentProtocol.effort}
                  </span>
                </div>

                <div className="font-extrabold text-white text-xs sm:text-sm">
                  {currentProtocol.title}
                </div>
                <div className="text-[11px] text-slate-300 italic">
                  {currentProtocol.tagline}
                </div>

                <div className="pt-1 space-y-1">
                  {currentProtocol.highlights.map((h, i) => (
                    <div key={i} className="text-[11px] text-slate-200 flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                      <span className="truncate">{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dots navigation */}
              <div className="flex items-center justify-center gap-1.5 pt-1">
                {SHOWCASE_PROTOCOLS.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setProtocolIndex(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${
                      protocolIndex === i ? 'w-5 bg-cyan-400' : 'bg-slate-700 hover:bg-slate-500'
                    }`}
                    title={`View protocol ${i + 1}`}
                  />
                ))}
              </div>

              {/* Explicit "Finish Later" Guarantee */}
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                <ShieldCheck size={14} className="text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  <strong>No questionnaire required now.</strong> Your daily schedule will populate immediately. You can personalize your sleep times and constraints anytime later.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenEnrollModal}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500/40 text-cyan-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95"
            >
              <span>Browse &amp; Enroll in Protocol</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* OPTION B: BUILD WITH AI LONGEVITY COACH */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 hover:border-purple-500/30 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 bg-purple-950/80 border border-purple-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Bot size={11} />
                  Option B • Conversational
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {promptIndex + 1} of {SHOWCASE_AI_PROMPTS.length}
                </span>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                  <Bot size={18} className="text-purple-400 shrink-0" />
                  Build with AI Longevity Coach
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Chat with our evidence-backed AI coach to design a stack from scratch around your routine, biomarkers, or budget.
                </p>
              </div>

              {/* Large Interactive Prompt Showcase Card */}
              <div 
                onClick={() => handleLaunchCoachWithPrompt(currentPrompt.text)}
                className="p-3.5 rounded-xl bg-purple-950/25 hover:bg-purple-950/40 border border-purple-500/30 transition-all duration-300 space-y-2 cursor-pointer group shadow-inner"
                title="Click to launch coach with this prompt"
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-purple-300 font-bold uppercase px-2 py-0.5 rounded bg-purple-950/80 border border-purple-500/40">
                    {currentPrompt.tag}
                  </span>
                  <span className="text-slate-400 group-hover:text-purple-300 transition-colors flex items-center gap-1 font-semibold">
                    Tap to use ↗
                  </span>
                </div>

                <p className="text-xs sm:text-[13px] text-slate-100 font-medium italic leading-snug">
                  &ldquo;{currentPrompt.text}&rdquo;
                </p>
              </div>

              {/* Prompt Ticker Dots */}
              <div className="flex items-center justify-center gap-1.5 pt-1">
                {SHOWCASE_AI_PROMPTS.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPromptIndex(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${
                      promptIndex === i ? 'w-5 bg-purple-400' : 'bg-slate-700 hover:bg-slate-500'
                    }`}
                    title={`View prompt ${i + 1}`}
                  />
                ))}
              </div>

              {/* Explicit "Finish Later" Guarantee */}
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                <ShieldCheck size={14} className="text-purple-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Build your protocol first in chat.</strong> The coach pushes tasks directly to your Today timeline. Complete profile onboarding whenever you are ready.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleLaunchCoachWithPrompt(currentPrompt.text)}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-purple-500/40 text-purple-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95"
            >
              <span>Chat with AI Longevity Coach</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Dismiss / Explore Demo Day Banner */}
        {onDismiss && (
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={onDismiss}
              className="text-xs text-slate-400 hover:text-slate-200 underline underline-offset-4 transition-colors cursor-pointer"
            >
              Or dismiss this hub and explore the interactive sample schedule below
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
