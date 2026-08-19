'use client'

import React from 'react'

interface SilhouetteVisualProps {
  measurementId: string
  className?: string
  variant?: 'compact' | 'full'
}

export default function SilhouetteVisual({ 
  measurementId, 
  className = 'w-full h-full',
  variant = 'full' 
}: SilhouetteVisualProps) {
  const isCompact = variant === 'compact'

  switch (measurementId) {
    case 'sitting_rising_test':
      return (
        <div className={`relative flex flex-col items-center justify-between rounded-2xl bg-black/70 border border-teal-500/40 overflow-hidden ${isCompact ? 'p-2' : 'p-3'} ${className}`}>
          {!isCompact && (
            <div className="w-full flex items-center justify-between text-xs font-bold text-teal-300 border-b border-white/10 pb-1.5 z-10">
              <span className="flex items-center gap-1.5">🧘 Sitting-Rising Test (SRT)</span>
              <span className="text-[10px] text-gray-400 font-mono">Unassisted Floor Transition</span>
            </div>
          )}

          {/* SVG Canvas with preserveAspectRatio */}
          <div className="relative w-full flex-1 flex items-center justify-center py-1 overflow-hidden">
            <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
              {/* Floor Surface Line */}
              <line x1="10" y1="105" x2="190" y2="105" stroke="#475569" strokeWidth="3" strokeLinecap="round" />

              {!isCompact && (
                <>
                  <text x="35" y="116" fill="#64748B" fontSize="7" textAnchor="middle" fontWeight="bold">1. Stand</text>
                  <text x="100" y="116" fill="#5EEAD4" fontSize="7" textAnchor="middle" fontWeight="bold">2. Cross-Legged Sit</text>
                  <text x="165" y="116" fill="#64748B" fontSize="7" textAnchor="middle" fontWeight="bold">3. Unassisted Rise</text>
                </>
              )}

              {/* FULL ANATOMICAL HUMAN FIGURE (SOLID VISIBLE HEAD, TORSO, ARMS, LEGS) */}
              <g className="animate-[srtAnatomicalCycle_5s_ease-in-out_infinite]" style={{ transformOrigin: '100px 105px' }}>
                {/* Head */}
                <circle cx="100" cy="20" r="8" fill="#2DD4BF" />
                {/* Torso */}
                <path d="M100 28 L100 58" stroke="#14B8A6" strokeWidth="10" strokeLinecap="round" />
                {/* Outstretched Arms for Balance */}
                <path d="M82 38 Q100 32 118 38" stroke="#CCFBF1" strokeWidth="4" strokeLinecap="round" fill="none" />
                {/* Legs (Thighs & Calves down to feet) */}
                <path d="M96 58 L94 82 L94 105" stroke="#14B8A6" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M104 58 L106 82 L106 105" stroke="#14B8A6" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
                {/* Feet */}
                <path d="M90 105 H97 M103 105 H110" stroke="#5EEAD4" strokeWidth="3" strokeLinecap="round" />
              </g>
            </svg>
          </div>

          {!isCompact && (
            <div className="w-full flex items-center justify-between text-[10px] text-gray-300 bg-teal-950/80 px-3 py-1 rounded-xl border border-teal-500/30 z-10">
              <span>⛔ No hands, knees, or forearms touching floor.</span>
              <span className="text-teal-300 font-bold">Start 10 Pts</span>
            </div>
          )}

          <style jsx>{`
            @keyframes srtAnatomicalCycle {
              0%, 100% { transform: translateY(0px) scaleY(1); }
              35%, 65% { transform: translateY(34px) scaleY(0.62); }
            }
          `}</style>
        </div>
      )

    case 'single_leg_balance':
      return (
        <div className={`relative flex flex-col items-center justify-between rounded-2xl bg-black/70 border border-indigo-500/40 overflow-hidden ${isCompact ? 'p-2' : 'p-3'} ${className}`}>
          {!isCompact && (
            <div className="w-full flex items-center justify-between text-xs font-bold text-indigo-300 border-b border-white/10 pb-1.5 z-10">
              <span className="flex items-center gap-1.5">🦶 Single-Leg Stance Balance</span>
              <span className="text-[10px] text-gray-400 font-mono">90° Knee Flexion Hold</span>
            </div>
          )}

          <div className="relative w-full flex-1 flex items-center justify-center py-1 overflow-hidden">
            <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
              {/* Floor Line */}
              <line x1="10" y1="105" x2="190" y2="105" stroke="#475569" strokeWidth="3" strokeLinecap="round" />

              {/* Center Plumb Line */}
              <line x1="100" y1="10" x2="100" y2="105" stroke="#818CF8" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />

              {/* SOLID ANATOMICAL BALANCING FIGURE */}
              <g className="animate-[singleLegBalanceMotion_3.5s_ease-in-out_infinite]" style={{ transformOrigin: '100px 105px' }}>
                {/* Head */}
                <circle cx="100" cy="20" r="8" fill="#818CF8" />
                {/* Torso */}
                <path d="M100 28 L100 58" stroke="#6366F1" strokeWidth="10" strokeLinecap="round" />
                {/* Crossed Arms over Chest */}
                <path d="M88 38 Q100 44 112 38" stroke="#E0E7FF" strokeWidth="4" strokeLinecap="round" fill="none" />

                {/* Standing Right Supporting Leg */}
                <path d="M100 58 L100 82 L100 105" stroke="#6366F1" strokeWidth="8" strokeLinecap="round" />
                <path d="M96 105 H106" stroke="#E0E7FF" strokeWidth="3" strokeLinecap="round" />

                {/* Raised Left Leg (Flexed 90° at Knee) */}
                <path d="M98 58 L84 62 L82 78" stroke="#A5B4FC" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <path d="M82 78 L76 80" stroke="#E0E7FF" strokeWidth="3" strokeLinecap="round" />

                {!isCompact && (
                  <text x="74" y="60" fill="#A5B4FC" fontSize="8" fontFamily="sans-serif" fontWeight="bold">90°</text>
                )}
              </g>
            </svg>
          </div>

          {!isCompact && (
            <div className="w-full flex items-center justify-between text-[10px] text-gray-300 bg-indigo-950/80 px-3 py-1 rounded-xl border border-indigo-500/30 z-10">
              <span>🎯 Barefoot on standing leg. Arms crossed.</span>
              <span className="text-indigo-300 font-bold">Max 60s</span>
            </div>
          )}

          <style jsx>{`
            @keyframes singleLegBalanceMotion {
              0%, 100% { transform: rotate(0deg); }
              25% { transform: rotate(1.6deg); }
              75% { transform: rotate(-1.6deg); }
            }
          `}</style>
        </div>
      )

    case 'chair_stand_30s':
      return (
        <div className={`relative flex flex-col items-center justify-between rounded-2xl bg-black/70 border border-amber-500/40 overflow-hidden ${isCompact ? 'p-2' : 'p-3'} ${className}`}>
          {!isCompact && (
            <div className="w-full flex items-center justify-between text-xs font-bold text-amber-300 border-b border-white/10 pb-1.5 z-10">
              <span className="flex items-center gap-1.5">🪑 30-Second Chair Stand</span>
              <span className="text-[10px] text-gray-400 font-mono">Full Stand Cycle</span>
            </div>
          )}

          <div className="relative w-full flex-1 flex items-center justify-center py-1 overflow-hidden">
            <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
              {/* Floor Line */}
              <line x1="10" y1="105" x2="190" y2="105" stroke="#475569" strokeWidth="3" strokeLinecap="round" />

              {/* Armless Chair */}
              <g opacity="0.9">
                <rect x="74" y="42" width="7" height="38" rx="2" fill="#78350F" stroke="#F59E0B" strokeWidth="2" />
                <rect x="74" y="78" width="42" height="7" rx="2" fill="#92400E" stroke="#FDE68A" strokeWidth="2" />
                <line x1="79" y1="85" x2="79" y2="105" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
                <line x1="111" y1="85" x2="111" y2="105" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
              </g>

              {/* SOLID ANATOMICAL HUMAN FIGURE (HEAD, TORSO, CROSSED ARMS, THIGHS, CALVES, FEET) */}
              <g className="animate-[chairStandAnatomicalMotion_2.4s_ease-in-out_infinite]" style={{ transformOrigin: '100px 105px' }}>
                {/* Head */}
                <circle cx="100" cy="20" r="8" fill="#FBBF24" />
                {/* Torso */}
                <path d="M100 28 L100 58" stroke="#F59E0B" strokeWidth="10" strokeLinecap="round" />
                {/* Crossed Arms */}
                <path d="M88 38 Q100 44 112 38" stroke="#FEF3C7" strokeWidth="4.5" strokeLinecap="round" fill="none" />
                {/* Legs (Thighs & Calves) */}
                <path d="M100 58 L100 82 L100 105" stroke="#F59E0B" strokeWidth="8" strokeLinecap="round" />
                {/* Feet */}
                <path d="M94 105 H106" stroke="#FEF3C7" strokeWidth="3" strokeLinecap="round" />
              </g>

              {/* Rep Badge */}
              <g transform="translate(150, 15)">
                <circle cx="12" cy="12" r="12" fill="#B45309" stroke="#FBBF24" strokeWidth="2" />
                <text x="12" y="16" fill="#FEF3C7" fontSize="10" textAnchor="middle" fontWeight="bold">+1</text>
              </g>
            </svg>
          </div>

          {!isCompact && (
            <div className="w-full flex items-center justify-between text-[10px] text-gray-300 bg-amber-950/80 px-3 py-1 rounded-xl border border-amber-500/30 z-10">
              <span>⏱️ Maximum full stands in 30 seconds.</span>
              <span className="text-amber-300 font-bold">30s Timer</span>
            </div>
          )}

          <style jsx>{`
            @keyframes chairStandAnatomicalMotion {
              0%, 100% { transform: translateY(22px) scaleY(0.78); }
              50% { transform: translateY(-2px) scaleY(1); }
            }
          `}</style>
        </div>
      )

    case 'reaction_time':
      return (
        <div className={`relative flex flex-col items-center justify-between rounded-2xl bg-black/70 border border-emerald-500/40 overflow-hidden ${isCompact ? 'p-2' : 'p-3'} ${className}`}>
          {!isCompact && (
            <div className="w-full flex items-center justify-between text-xs font-bold text-emerald-300 border-b border-white/10 pb-1.5 z-10">
              <span className="flex items-center gap-1.5">⚡ Visual Reaction Time</span>
              <span className="text-[10px] text-gray-400 font-mono">Screen Stimulus Tap</span>
            </div>
          )}

          <div className="relative w-full flex-1 flex items-center justify-center py-1 overflow-hidden">
            <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
              {/* Screen Device */}
              <rect x="30" y="15" width="140" height="90" rx="14" fill="#022C22" stroke="#10B981" strokeWidth="2.5" />
              <rect x="38" y="22" width="124" height="76" rx="10" fill="#064E3B" stroke="#059669" strokeWidth="1.5" />

              {/* Green Stimulus Flash Target */}
              <circle cx="100" cy="60" r="24" className="stroke-emerald-400/40 fill-none animate-ping" strokeWidth="2" />
              <circle cx="100" cy="60" r="16" fill="#10B981" />
              <path d="M103 48 L94 61 H103 L97 74" stroke="#ECFDF5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />

              {/* Hand Finger Tapping */}
              <g className="animate-[fingerTapMotion_1.4s_infinite]">
                <path d="M100 100 V72 Q100 68 104 68" stroke="#A7F3D0" strokeWidth="6" strokeLinecap="round" fill="none" />
                <circle cx="100" cy="68" r="4.5" fill="#D1FAE5" />
              </g>
            </svg>
          </div>

          {!isCompact && (
            <div className="w-full flex items-center justify-between text-[10px] text-gray-300 bg-emerald-950/80 px-3 py-1 rounded-xl border border-emerald-500/30 z-10">
              <span>⚡ Tap screen immediately when dark background turns green.</span>
              <span className="text-emerald-300 font-bold">5 Trials</span>
            </div>
          )}

          <style jsx>{`
            @keyframes fingerTapMotion {
              0%, 100% { transform: translateY(12px); opacity: 0.3; }
              50% { transform: translateY(-2px); opacity: 1; }
            }
          `}</style>
        </div>
      )

    case 'grip_strength':
      return (
        <div className={`relative flex flex-col items-center justify-between rounded-2xl bg-black/70 border border-orange-500/40 overflow-hidden ${isCompact ? 'p-2' : 'p-3'} ${className}`}>
          {!isCompact && (
            <div className="w-full flex items-center justify-between text-xs font-bold text-orange-300 border-b border-white/10 pb-1.5 z-10">
              <span className="flex items-center gap-1.5">✊ Hand Grip Strength</span>
              <span className="text-[10px] text-gray-400 font-mono">Max Squeeze</span>
            </div>
          )}

          <div className="relative w-full flex-1 flex items-center justify-center py-1 overflow-hidden">
            <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
              <rect x="65" y="20" width="70" height="85" rx="12" fill="#27272A" stroke="#F97316" strokeWidth="2.5" />
              <rect x="75" y="28" width="50" height="24" rx="4" fill="#09090B" stroke="#FB923C" strokeWidth="1.5" />
              <text x="100" y="44" fill="#FDBA74" fontSize="12" fontFamily="monospace" textAnchor="middle" fontWeight="bold">52.4 kg</text>

              <g className="animate-[gripSqueezeMotion_1.8s_ease-in-out_infinite]" style={{ transformOrigin: '100px 60px' }}>
                <path d="M55 52 Q75 42 115 52 M55 68 Q75 58 115 68 M55 84 Q75 74 115 84" stroke="#F97316" strokeWidth="6" strokeLinecap="round" fill="none" />
              </g>
            </svg>
          </div>

          {!isCompact && (
            <div className="w-full flex items-center justify-between text-[10px] text-gray-300 bg-orange-950/80 px-3 py-1 rounded-xl border border-orange-500/30 z-10">
              <span>💪 Arm extended downwards at side. Squeeze max effort 3s.</span>
              <span className="text-orange-300 font-bold">Best of 3</span>
            </div>
          )}

          <style jsx>{`
            @keyframes gripSqueezeMotion {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(0.92); }
            }
          `}</style>
        </div>
      )

    case 'fev1':
    case 'fvc':
      return (
        <div className={`relative flex flex-col items-center justify-between rounded-2xl bg-black/70 border border-blue-500/40 overflow-hidden ${isCompact ? 'p-2' : 'p-3'} ${className}`}>
          {!isCompact && (
            <div className="w-full flex items-center justify-between text-xs font-bold text-blue-300 border-b border-white/10 pb-1.5 z-10">
              <span className="flex items-center gap-1.5">🫁 FEV1 Lung Function</span>
              <span className="text-[10px] text-gray-400 font-mono">Forced Exhalation</span>
            </div>
          )}

          <div className="relative w-full flex-1 flex items-center justify-center py-1 overflow-hidden">
            <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
              <path d="M65 45 C52 54 52 86 74 94 C82 96 84 78 84 62 Z" fill="#3B82F6" opacity="0.4" stroke="#3B82F6" strokeWidth="2" />
              <path d="M135 45 C148 54 148 86 126 94 C118 96 116 78 116 62 Z" fill="#3B82F6" opacity="0.4" stroke="#3B82F6" strokeWidth="2" />

              <g className="animate-[lungFlowMotion_2.2s_infinite]">
                <path d="M100 45 V18 M92 26 L100 18 L108 26" stroke="#93C5FD" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </g>
            </svg>
          </div>

          {!isCompact && (
            <div className="w-full flex items-center justify-between text-[10px] text-gray-300 bg-blue-950/80 px-3 py-1 rounded-xl border border-blue-500/30 z-10">
              <span>🌬️ Inhale fully, blast out air hard & fast for 6s.</span>
              <span className="text-blue-300 font-bold">Best of 3</span>
            </div>
          )}

          <style jsx>{`
            @keyframes lungFlowMotion {
              0% { opacity: 0.2; transform: translateY(10px); }
              50% { opacity: 1; transform: translateY(-4px); }
              100% { opacity: 0; transform: translateY(-16px); }
            }
          `}</style>
        </div>
      )

    case 'gait_speed':
    case 'usual_gait_speed':
      return (
        <div className={`relative flex flex-col items-center justify-between rounded-2xl bg-black/70 border border-emerald-500/40 overflow-hidden ${isCompact ? 'p-2' : 'p-3'} ${className}`}>
          {!isCompact && (
            <div className="w-full flex items-center justify-between text-xs font-bold text-emerald-300 border-b border-white/10 pb-1.5 z-10">
              <span className="flex items-center gap-1.5">🚶 Usual Gait Speed (m/s)</span>
              <span className="text-[10px] text-gray-400 font-mono">Timed 4-Meter Walkway</span>
            </div>
          )}

          <div className="relative w-full flex-1 flex items-center justify-center py-1 overflow-hidden">
            <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
              {/* Walkway Ground Surface */}
              <line x1="10" y1="100" x2="190" y2="100" stroke="#334155" strokeWidth="3" strokeLinecap="round" />

              {/* Start & End Timing Markers (4-Meter Zone) */}
              <line x1="40" y1="75" x2="40" y2="100" stroke="#10B981" strokeWidth="2" strokeDasharray="3 3" />
              <text x="40" y="70" fill="#34D399" fontSize="7" textAnchor="middle" fontWeight="bold">0m (Start Timing)</text>

              <line x1="160" y1="75" x2="160" y2="100" stroke="#10B981" strokeWidth="2" strokeDasharray="3 3" />
              <text x="160" y="70" fill="#34D399" fontSize="7" textAnchor="middle" fontWeight="bold">4m (Stop Timing)</text>

              {/* Walking Figure */}
              <g className="animate-[gaitWalkCycle_3.5s_linear_infinite]">
                {/* Head */}
                <circle cx="40" cy="25" r="7" fill="#34D399" />
                {/* Torso */}
                <path d="M40 32 L40 60" stroke="#10B981" strokeWidth="8" strokeLinecap="round" />
                {/* Swinging Arms */}
                <path d="M40 38 L30 54 M40 38 L50 54" stroke="#A7F3D0" strokeWidth="3.5" strokeLinecap="round" />
                {/* Walking Striding Legs */}
                <path d="M40 60 L28 100 M40 60 L52 100" stroke="#10B981" strokeWidth="6" strokeLinecap="round" />
              </g>
            </svg>
          </div>

          {!isCompact && (
            <div className="w-full flex items-center justify-between text-[10px] text-gray-300 bg-emerald-950/80 px-3 py-1 rounded-xl border border-emerald-500/30 z-10">
              <span>⏱️ Walk normal pace on 6m track. Time central 4 meters.</span>
              <span className="text-emerald-300 font-bold">Calculate m/s</span>
            </div>
          )}

          <style jsx>{`
            @keyframes gaitWalkCycle {
              0% { transform: translateX(0px); }
              100% { transform: translateX(120px); }
            }
          `}</style>
        </div>
      )

    case 'vo2max':
      return (
        <div className={`relative flex flex-col items-center justify-between rounded-2xl bg-black/70 border border-blue-500/40 overflow-hidden ${isCompact ? 'p-2' : 'p-3'} ${className}`}>
          {!isCompact && (
            <div className="w-full flex items-center justify-between text-xs font-bold text-blue-300 border-b border-white/10 pb-1.5 z-10">
              <span className="flex items-center gap-1.5">🫀 Cardiorespiratory Fitness (VO₂ Max)</span>
              <span className="text-[10px] text-gray-400 font-mono">Aerobic Capacity Peak</span>
            </div>
          )}

          <div className="relative w-full flex-1 flex items-center justify-center py-1 overflow-hidden">
            <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
              <path d="M20 95 Q60 90 90 70 T180 25" stroke="#3B82F6" strokeWidth="4" fill="none" strokeLinecap="round" />
              <circle cx="180" cy="25" r="5" fill="#60A5FA" className="animate-ping" />
              <circle cx="180" cy="25" r="4" fill="#93C5FD" />
              <text x="175" y="16" fill="#93C5FD" fontSize="8" fontFamily="monospace" textAnchor="end" fontWeight="bold">Peak VO₂ Max</text>
            </svg>
          </div>

          {!isCompact && (
            <div className="w-full flex items-center justify-between text-[10px] text-gray-300 bg-blue-950/80 px-3 py-1 rounded-xl border border-blue-500/30 z-10">
              <span>🏃 Treadmill ramp test or 4x4 high-intensity effort.</span>
              <span className="text-blue-300 font-bold">mL/kg/min</span>
            </div>
          )}
        </div>
      )

    case 'bp_sys':
    case 'bp_dia':
    default:
      return (
        <div className={`relative flex flex-col items-center justify-between rounded-2xl bg-black/70 border border-red-500/40 overflow-hidden ${isCompact ? 'p-2' : 'p-3'} ${className}`}>
          {!isCompact && (
            <div className="w-full flex items-center justify-between text-xs font-bold text-red-300 border-b border-white/10 pb-1.5 z-10">
              <span className="flex items-center gap-1.5">🩺 Blood Pressure</span>
              <span className="text-[10px] text-gray-400 font-mono">Resting SBP / DBP</span>
            </div>
          )}

          <div className="relative w-full flex-1 flex items-center justify-center py-1 overflow-hidden">
            <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
              <circle cx="100" cy="24" r="8" fill="#EF4444" />
              <path d="M100 32 L100 62" stroke="#EF4444" strokeWidth="10" strokeLinecap="round" />
              <path d="M90 48 L66 66 L48 66" stroke="#FCA5A5" strokeWidth="6" strokeLinecap="round" fill="none" />
              <rect x="54" y="56" width="20" height="22" rx="4" fill="#991B1B" stroke="#EF4444" strokeWidth="2" className="animate-pulse" />
            </svg>
          </div>

          {!isCompact && (
            <div className="w-full flex items-center justify-between text-[10px] text-gray-300 bg-red-950/80 px-3 py-1 rounded-xl border border-red-500/30 z-10">
              <span>🛋️ Sit quietly 5 minutes with feet flat and arm supported.</span>
              <span className="text-red-300 font-bold">2 Readings Avg</span>
            </div>
          )}
        </div>
      )
  }
}
