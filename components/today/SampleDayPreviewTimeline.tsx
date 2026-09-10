'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { 
  Sun, Droplets, Pill, Clock, Heart, Snowflake, 
  Utensils, Moon, Flame, Sparkles, Check, ArrowRight,
  Info, ShieldCheck, Compass, Eye
} from 'lucide-react'
import OutcomePill from '@/components/outcomes/OutcomePill'

interface SampleDayPreviewTimelineProps {
  onEnrollClick: () => void
  onOpenCoachClick?: () => void
}

interface SampleModality {
  id: string
  name: string
  time: string
  slot: 'morning' | 'midday' | 'evening'
  dose: string
  duration: string
  mechanism: string
  outcomes: string[]
  synergy: string
  tier: string
}

const SAMPLE_SCHEDULE: Record<'morning' | 'midday' | 'evening', {
  title: string
  timeWindow: string
  icon: any
  iconColor: string
  accentBorder: string
  badgeBg: string
  modalities: SampleModality[]
}> = {
  morning: {
    title: 'Morning Circadian Entrainment',
    timeWindow: '7:00 AM – 9:00 AM',
    icon: Sun,
    iconColor: 'text-amber-400',
    accentBorder: 'border-amber-500/30',
    badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    modalities: [
      {
        id: 'sample_sunlight',
        name: 'Morning Optic Sunlight & Photons',
        time: '7:15 AM',
        slot: 'morning',
        dose: '10–15 mins outdoor direct exposure',
        duration: '15 mins',
        mechanism: 'Retinal ipRGC photons reset the hypothalamic SCN clock, triggering cortisol awakening response & priming 14h melatonin synthesis.',
        outcomes: ['energy', 'sleep_quality', 'waking_restedness'],
        synergy: 'Pairs with 90m Coffee Delay so adenosine clears naturally first.',
        tier: 'Tier-1 Anchor (RCT)'
      },
      {
        id: 'sample_hydration',
        name: 'Baseline Cellular Hydration & Electrolytes',
        time: '7:30 AM',
        slot: 'morning',
        dose: '500ml filtered water + 500mg Sodium / Potassium / Magnesium',
        duration: 'Instant',
        mechanism: 'Reverses overnight respiratory dehydration, activates cellular osmolarity, and prevents morning hemodynamic orthostatic dips.',
        outcomes: ['energy', 'focus'],
        synergy: 'Synergizes with Morning Photons to rapidly clear sleep inertia.',
        tier: 'Tier-1 Baseline'
      },
      {
        id: 'sample_creatine',
        name: 'Cellular ATP & Methylation Support',
        time: '8:00 AM',
        slot: 'morning',
        dose: '5g Creatine Monohydrate + 1g Taurine + 600mg NAC',
        duration: 'Instant',
        mechanism: 'Replenishes cellular phosphocreatine ATP pools for muscle & cognitive stamina while supporting endogenous glutathione synthesis.',
        outcomes: ['energy', 'focus', 'soreness'],
        synergy: 'High bio-synergy with morning hydration and post-exercise recovery.',
        tier: 'Gold-Standard Clinical'
      },
      {
        id: 'sample_caffeine',
        name: 'Strategic 90–120m Caffeine Delay',
        time: '8:45 AM',
        slot: 'morning',
        dose: '100–150mg natural caffeine (black coffee or green tea)',
        duration: 'Instant',
        mechanism: 'Waiting 90–120 minutes allows circulating adenosine to clear naturally, preventing the dreaded 2:00 PM afternoon energy crash.',
        outcomes: ['energy', 'focus'],
        synergy: 'Never consumes caffeine within 10 hours of planned bedtime.',
        tier: 'Circadian Behavioral Rule'
      }
    ]
  },
  midday: {
    title: 'Midday Metabolic & Cardiovascular Peak',
    timeWindow: '12:00 PM – 2:30 PM',
    icon: Heart,
    iconColor: 'text-cyan-400',
    accentBorder: 'border-cyan-500/30',
    badgeBg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
    modalities: [
      {
        id: 'sample_zone2',
        name: 'Zone 2 Aerobic Base Conditioning',
        time: '12:30 PM',
        slot: 'midday',
        dose: '35–45 mins @ 60–70% Max Heart Rate (conversational pace)',
        duration: '40 mins',
        mechanism: 'Stimulates mitochondrial biogenesis, enhances fatty acid substrate utilization, and reduces all-cause cardiovascular mortality.',
        outcomes: ['vo2_max', 'energy', 'cardiovascular'],
        synergy: 'Complements morning fasting and sets up post-exercise glucose uptake.',
        tier: 'Tier-1 Mortality Reducer'
      },
      {
        id: 'sample_cold',
        name: 'Deliberate Cold Exposure (Cold Plunge)',
        time: '1:15 PM',
        slot: 'midday',
        dose: '2–3 mins @ 50°F–55°F / 10°C–13°C (Søberg Principle)',
        duration: '3 mins',
        mechanism: 'Triggers sustained +250% dopamine and norepinephrine elevation, activates brown adipose tissue (BAT) thermogenesis, and clears inflammation.',
        outcomes: ['mood', 'focus', 'soreness'],
        synergy: 'Søberg Principle: allow natural shivering / rewarming without sauna immediately after to maximize metabolic adaptation.',
        tier: 'Human RCT Validated'
      },
      {
        id: 'sample_lunch',
        name: 'High-Polyphenol Longevity Plate',
        time: '1:45 PM',
        slot: 'midday',
        dose: '1 tbsp Extra Virgin Olive Oil + 35g bioavailable protein + dark leafy greens',
        duration: 'Meal',
        mechanism: 'EVOO oleocanthal inhibits inflammatory COX pathways; plant diversity feeds Akkermansia muciniphila gut microbiome integrity.',
        outcomes: ['digestive_comfort', 'energy'],
        synergy: 'Healthy lipids maximize fat-soluble nutrient absorption.',
        tier: 'Nutritional Foundation'
      }
    ]
  },
  evening: {
    title: 'Evening Sleep Architecture & Thermal Wind-Down',
    timeWindow: '8:00 PM – 10:30 PM',
    icon: Moon,
    iconColor: 'text-indigo-400',
    accentBorder: 'border-indigo-500/30',
    badgeBg: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    modalities: [
      {
        id: 'sample_bluelight',
        name: 'Blue Light Filtering & Retinal Dimming',
        time: '8:30 PM',
        slot: 'evening',
        dose: '100% blue/green blocking eyewear or sub-50 lux ambient red lighting',
        duration: 'Ongoing',
        mechanism: 'Prevents suppression of pineal melatonin release, stabilizing circadian core body temperature drop required for deep sleep onset.',
        outcomes: ['sleep_quality', 'waking_restedness'],
        synergy: 'Directly unlocks high slow-wave sleep efficiency.',
        tier: 'Photobiological Anchor'
      },
      {
        id: 'sample_sauna',
        name: 'Finnish Sauna / Hyperthermic Conditioning',
        time: '9:00 PM',
        slot: 'evening',
        dose: '20 mins @ 174°F+ / 79°C+ followed by room-temp cool down',
        duration: '20 mins',
        mechanism: 'Upregulates Heat Shock Proteins (HSP70) for cellular chaperone repair, induces plasma volume expansion, and promotes deep relaxation.',
        outcomes: ['cardiovascular', 'stress', 'sleep_quality'],
        synergy: 'Rapid post-sauna core temperature cooling triggers immediate somnolence.',
        tier: 'Kuopio 20-Year Cohort'
      },
      {
        id: 'sample_sleep_stack',
        name: 'Neuro-Restorative Deep Sleep Stack',
        time: '9:45 PM',
        slot: 'evening',
        dose: '400mg Magnesium L-Threonate + 50mg Apigenin + 100mg L-Theanine',
        duration: 'Instant',
        mechanism: 'Magnesium L-Threonate crosses blood-brain barrier to elevate synaptic plasticity; Apigenin binds GABA-A receptors for Stage 3 Slow-Wave sleep.',
        outcomes: ['sleep_quality', 'waking_restedness', 'stress'],
        synergy: 'Taken 30–45 minutes before sleep with minimal fluid to prevent nocturia.',
        tier: 'Clinical Synergist'
      }
    ]
  }
}

export default function SampleDayPreviewTimeline({
  onEnrollClick,
  onOpenCoachClick
}: SampleDayPreviewTimelineProps) {
  const router = useRouter()

  return (
    <div className="space-y-6 pt-2 animate-in fade-in duration-300">
      {/* Sample Preview Watermark Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900/95 via-indigo-950/40 to-slate-900/95 border border-indigo-500/30 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shrink-0 shadow-inner">
            <Compass size={18} className="animate-spin duration-[10000ms]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-extrabold text-white">
                Interactive Sample Protocol Preview
              </h3>
              <span className="text-[10px] font-mono uppercase text-indigo-300 bg-indigo-950/80 border border-indigo-500/30 px-2 py-0.2 rounded-full font-bold">
                Live Demo Routine
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              This is what your daily timeline looks like once active. Calibrate or pick a starting path above to make this routine yours.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            type="button"
            onClick={onEnrollClick}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 whitespace-nowrap"
          >
            <span>+ Enroll in Protocol</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* 3 Main Timeline Time Blocks */}
      {(['morning', 'midday', 'evening'] as const).map(timeBlockKey => {
        const block = SAMPLE_SCHEDULE[timeBlockKey]
        const BlockIcon = block.icon

        return (
          <div key={timeBlockKey} className="space-y-3">
            {/* Time Block Header */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-lg ${block.badgeBg} flex items-center justify-center shrink-0`}>
                  <BlockIcon size={14} className={block.iconColor} />
                </div>
                <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                  {block.title}
                </h4>
                <span className="text-[10px] sm:text-xs text-slate-400 font-mono">
                  ({block.timeWindow})
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {block.modalities.length} modalities
              </span>
            </div>

            {/* Modalities in this time block */}
            <div className="space-y-2.5">
              {block.modalities.map(modality => (
                <div
                  key={modality.id}
                  className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 hover:border-indigo-500/40 transition-all shadow-sm relative overflow-hidden group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      {/* Top Row: Time, Name & Tier */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/60">
                          {modality.time}
                        </span>
                        <h5 className="text-xs sm:text-sm font-extrabold text-white group-hover:text-indigo-300 transition-colors">
                          {modality.name}
                        </h5>
                        <span className="text-[9px] font-mono uppercase text-slate-400 bg-slate-800/40 border border-slate-700/40 px-1.5 py-0.2 rounded">
                          {modality.tier}
                        </span>
                      </div>

                      {/* Dosing & Mechanism Specs */}
                      <div className="text-[11px] text-slate-300 flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-indigo-300">
                          Dose / Specs:
                        </span>
                        <span>{modality.dose}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400">Duration: {modality.duration}</span>
                      </div>

                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {modality.mechanism}
                      </p>

                      {/* Synergy Note */}
                      <div className="text-[10px] text-emerald-400/90 font-medium flex items-center gap-1 pt-0.5">
                        <Sparkles size={11} className="shrink-0" />
                        <span>Synergy: {modality.synergy}</span>
                      </div>
                    </div>

                    {/* Right: Outcome Pills & Demo Status */}
                    <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2 shrink-0 pt-2 sm:pt-0">
                      <div className="flex items-center gap-1 flex-wrap justify-end">
                        {modality.outcomes.map(outcome => (
                          <OutcomePill 
                            key={outcome} 
                            outcome={outcome} 
                            size="xs" 
                            showScore={false} 
                            showIcon={true}
                          />
                        ))}
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono bg-slate-950/60 border border-slate-800 px-2 py-0.5 rounded-lg">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                        <span>Sample Modality</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Bottom CTA Bar */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-950 border border-indigo-500/30 text-center space-y-3">
        <h4 className="text-sm sm:text-base font-extrabold text-white">
          Ready to activate and track your personalized daily routine?
        </h4>
        <p className="text-xs text-slate-300 max-w-md mx-auto">
          Start with our guided onboarding to calibrate your sleep curve and goals, or pick from Bryan Johnson, Andrew Huberman, and Peter Attia stacks.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => router.push('/onboarding')}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Begin Biological Calibration</span>
            <ArrowRight size={14} />
          </button>
          <button
            type="button"
            onClick={onEnrollClick}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Browse Protocols</span>
          </button>
        </div>
      </div>
    </div>
  )
}
