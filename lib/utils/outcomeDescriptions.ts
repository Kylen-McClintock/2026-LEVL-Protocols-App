/**
 * Concise, expert functional outcome descriptions
 * Explains ambiguous biomarker dimensions in plain, precise language.
 */

export const OUTCOME_DESCRIPTIONS: Record<string, string> = {
  energy: 'Sustained daytime vitality, cellular ATP production & eliminating afternoon crashes.',
  motivation: 'Dopamine-driven drive, initiative, reward anticipation & focus readiness.',
  soreness: 'Delayed onset muscle soreness (DOMS), joint recovery & muscular repair speed.',
  sleep_quality: 'Deep and REM sleep architecture, restorative overnight recovery & fewer awakenings.',
  waking_restedness: 'Waking alert and refreshed with optimal morning circadian cortisol response.',
  sleep_latency: 'Speed of falling asleep without tossing and turning (reducing sleep onset delay).',
  focus: 'Laser cognitive clarity, working memory retention & sustained attention span.',
  stress: 'High parasympathetic vagal tone, rapid autonomic recovery & lower circulating cortisol.',
  calmness: 'Emotional equilibrium, central nervous system relaxation & anxiety reduction.',
  strength: 'Peak muscular force output, neuromuscular power & training capacity.',
  endurance: 'Cardiorespiratory stamina, aerobic efficiency & delayed lactate fatigue.',
  brain_fog: 'Fast neural processing speed, crisp mental acuity & cerebral metabolic clearance.',
  mood: 'Emotional resilience, positive neurochemical valence & psychological well-being.',
  pain: 'Musculoskeletal comfort, joint ease & systemic inflammatory relief.',
  joint_comfort: 'Cartilage mobility, synovial lubrication & pain-free range of motion.',
  skin_clarity: 'Dermal barrier integrity, collagen density & cellular turnover.',
  immune_resilience: 'Innate and adaptive immune defense & reduced susceptibility to infections.',
  digestive_comfort: 'Smooth gut motility, microbiome balance & reduced post-meal bloating.',
  libido: 'Hormonal vitality, sexual health & vitality signaling.',
  emotional_resilience: 'Stress adaptability, heart rate variability (HRV) recovery & emotional control.',
  blood_glucose_stability: 'Stable glycemic response, insulin sensitivity & mitigating glucose spikes.'
}

export function getOutcomeDescription(id: string, fallbackDesc?: string): string {
  if (fallbackDesc && fallbackDesc.trim().length > 5) {
    return fallbackDesc.trim()
  }
  const norm = id.toLowerCase().replace(/[\s-]/g, '_')
  
  if (OUTCOME_DESCRIPTIONS[norm]) {
    return OUTCOME_DESCRIPTIONS[norm]
  }

  // Key word fuzzy matching
  for (const [key, desc] of Object.entries(OUTCOME_DESCRIPTIONS)) {
    if (norm.includes(key) || key.includes(norm)) {
      return desc
    }
  }

  return 'Physiological biomarker and functional performance dimension.'
}
