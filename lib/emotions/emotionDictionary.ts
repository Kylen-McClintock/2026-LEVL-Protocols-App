export type EmotionQuadrant =
  | 'high_energy_pleasant'
  | 'high_energy_unpleasant'
  | 'low_energy_unpleasant'
  | 'low_energy_pleasant'

export interface EmotionEntry {
  id: string
  name: string
  quadrant: EmotionQuadrant
  definition: string
  valence: number // -1.0 (Unpleasant) to +1.0 (Pleasant)
  arousal: number // -1.0 (Low Energy) to +1.0 (High Energy)
}

export interface QuadrantMeta {
  key: EmotionQuadrant
  label: string
  sublabel: string
  energyDirection: 'up' | 'down'
  moodDirection: 'up' | 'down'
  filterLabel: string
  baseColorHex: string
  lightBg: string
  lightBorder: string
  lightText: string
  darkBg: string
  darkBorder: string
  darkText: string
  bubbleGradient: string
}

export const QUADRANT_CONFIGS: Record<EmotionQuadrant, QuadrantMeta> = {
  high_energy_pleasant: {
    key: 'high_energy_pleasant',
    label: 'High Energy • Pleasant',
    sublabel: 'Focused, motivated, energized & thriving',
    energyDirection: 'up',
    moodDirection: 'up',
    filterLabel: '↑ Energy  ↑ Mood',
    baseColorHex: '#EAB308', // Yellow-500
    lightBg: 'bg-amber-100',
    lightBorder: 'border-amber-400',
    lightText: 'text-amber-900',
    darkBg: 'bg-amber-500/20',
    darkBorder: 'border-amber-400/80',
    darkText: 'text-amber-300',
    bubbleGradient: 'from-amber-400 via-yellow-400 to-yellow-300'
  },
  low_energy_pleasant: {
    key: 'low_energy_pleasant',
    label: 'Low Energy • Pleasant',
    sublabel: 'Calm, grateful, accepted & serene',
    energyDirection: 'down',
    moodDirection: 'up',
    filterLabel: '↓ Energy  ↑ Mood',
    baseColorHex: '#22C55E', // Green-500
    lightBg: 'bg-emerald-100',
    lightBorder: 'border-emerald-400',
    lightText: 'text-emerald-900',
    darkBg: 'bg-emerald-500/20',
    darkBorder: 'border-emerald-400/80',
    darkText: 'text-emerald-300',
    bubbleGradient: 'from-emerald-400 via-green-400 to-teal-300'
  },
  low_energy_unpleasant: {
    key: 'low_energy_unpleasant',
    label: 'Low Energy • Unpleasant',
    sublabel: 'Exhausted, down, numb & drained',
    energyDirection: 'down',
    moodDirection: 'down',
    filterLabel: '↓ Energy  ↓ Mood',
    baseColorHex: '#3B82F6', // Blue-500
    lightBg: 'bg-sky-100',
    lightBorder: 'border-sky-400',
    lightText: 'text-sky-900',
    darkBg: 'bg-sky-500/20',
    darkBorder: 'border-sky-400/80',
    darkText: 'text-sky-300',
    bubbleGradient: 'from-blue-500 via-sky-400 to-indigo-400'
  },
  high_energy_unpleasant: {
    key: 'high_energy_unpleasant',
    label: 'High Energy • Unpleasant',
    sublabel: 'Anxious, overwhelmed, stressed & restless',
    energyDirection: 'up',
    moodDirection: 'down',
    filterLabel: '↑ Energy  ↓ Mood',
    baseColorHex: '#EF4444', // Red-500
    lightBg: 'bg-rose-100',
    lightBorder: 'border-rose-400',
    lightText: 'text-rose-900',
    darkBg: 'bg-rose-500/20',
    darkBorder: 'border-rose-400/80',
    darkText: 'text-rose-300',
    bubbleGradient: 'from-rose-500 via-red-500 to-orange-500'
  }
}

export const CANONICAL_EMOTIONS: EmotionEntry[] = [
  // ---------------------------------------------------------------------------
  // 1. HIGH ENERGY • PLEASANT (Yellow Quadrant)
  // ---------------------------------------------------------------------------
  {
    id: 'curious',
    name: 'Curious',
    quadrant: 'high_energy_pleasant',
    definition: 'interested in learning something',
    valence: 0.65,
    arousal: 0.60
  },
  {
    id: 'motivated',
    name: 'Motivated',
    quadrant: 'high_energy_pleasant',
    definition: 'enthusiastic about doing something',
    valence: 0.75,
    arousal: 0.80
  },
  {
    id: 'focused',
    name: 'Focused',
    quadrant: 'high_energy_pleasant',
    definition: 'directing clear attention on a specific task',
    valence: 0.70,
    arousal: 0.65
  },
  {
    id: 'energized',
    name: 'Energized',
    quadrant: 'high_energy_pleasant',
    definition: 'full of physical vitality and readiness',
    valence: 0.80,
    arousal: 0.90
  },
  {
    id: 'excited',
    name: 'Excited',
    quadrant: 'high_energy_pleasant',
    definition: 'eager and enthusiastic anticipation',
    valence: 0.85,
    arousal: 0.85
  },
  {
    id: 'determined',
    name: 'Determined',
    quadrant: 'high_energy_pleasant',
    definition: 'firmly set on achieving a goal without wavering',
    valence: 0.70,
    arousal: 0.75
  },
  {
    id: 'productive',
    name: 'Productive',
    quadrant: 'high_energy_pleasant',
    definition: 'achieving significant, meaningful output with momentum',
    valence: 0.75,
    arousal: 0.70
  },
  {
    id: 'empowered',
    name: 'Empowered',
    quadrant: 'high_energy_pleasant',
    definition: 'feeling capable, confident, and in control of your destiny',
    valence: 0.85,
    arousal: 0.80
  },
  {
    id: 'inspired',
    name: 'Inspired',
    quadrant: 'high_energy_pleasant',
    definition: 'mentally stimulated to do or create something creative',
    valence: 0.80,
    arousal: 0.75
  },
  {
    id: 'confident',
    name: 'Confident',
    quadrant: 'high_energy_pleasant',
    definition: 'feeling self-assured in your abilities and judgment',
    valence: 0.75,
    arousal: 0.60
  },
  {
    id: 'joyful',
    name: 'Joyful',
    quadrant: 'high_energy_pleasant',
    definition: 'experiencing deep happiness and delight',
    valence: 0.90,
    arousal: 0.75
  },
  {
    id: 'cheerful',
    name: 'Cheerful',
    quadrant: 'high_energy_pleasant',
    definition: 'noticeably happy and positive in spirit',
    valence: 0.75,
    arousal: 0.60
  },
  {
    id: 'upbeat',
    name: 'Upbeat',
    quadrant: 'high_energy_pleasant',
    definition: 'optimistic and cheerful in outlook',
    valence: 0.70,
    arousal: 0.65
  },
  {
    id: 'alive',
    name: 'Alive',
    quadrant: 'high_energy_pleasant',
    definition: 'feeling alert, connected, and intensely present',
    valence: 0.80,
    arousal: 0.70
  },
  {
    id: 'playful',
    name: 'Playful',
    quadrant: 'high_energy_pleasant',
    definition: 'lighthearted, fun, and spirited in engagement',
    valence: 0.80,
    arousal: 0.65
  },
  {
    id: 'accomplished',
    name: 'Accomplished',
    quadrant: 'high_energy_pleasant',
    definition: 'feeling effective and successful after effort',
    valence: 0.85,
    arousal: 0.65
  },
  {
    id: 'optimistic',
    name: 'Optimistic',
    quadrant: 'high_energy_pleasant',
    definition: 'expecting favorable outcomes in the near future',
    valence: 0.75,
    arousal: 0.60
  },
  {
    id: 'engaged',
    name: 'Engaged',
    quadrant: 'high_energy_pleasant',
    definition: 'deeply involved and absorbed in what you are doing',
    valence: 0.70,
    arousal: 0.65
  },
  {
    id: 'hopeful',
    name: 'Hopeful',
    quadrant: 'high_energy_pleasant',
    definition: 'feeling that something good is likely to happen',
    valence: 0.70,
    arousal: 0.55
  },
  {
    id: 'absorbed',
    name: 'Absorbed',
    quadrant: 'high_energy_pleasant',
    definition: 'fully focused and interested in the flow of work',
    valence: 0.70,
    arousal: 0.60
  },
  {
    id: 'exhilarated',
    name: 'Exhilarated',
    quadrant: 'high_energy_pleasant',
    definition: 'thrilled with intense, invigorating joy',
    valence: 0.90,
    arousal: 0.95
  },
  {
    id: 'elated',
    name: 'Elated',
    quadrant: 'high_energy_pleasant',
    definition: 'ecstatically happy and elevated in spirit',
    valence: 0.95,
    arousal: 0.90
  },

  // ---------------------------------------------------------------------------
  // 2. HIGH ENERGY • UNPLEASANT (Red Quadrant)
  // ---------------------------------------------------------------------------
  {
    id: 'stressed',
    name: 'Stressed',
    quadrant: 'high_energy_unpleasant',
    definition: 'strained by mental or physical pressure and demands',
    valence: -0.70,
    arousal: 0.75
  },
  {
    id: 'anxious',
    name: 'Anxious',
    quadrant: 'high_energy_unpleasant',
    definition: 'experiencing worry, unease, or nervousness about future events',
    valence: -0.75,
    arousal: 0.80
  },
  {
    id: 'overwhelmed',
    name: 'Overwhelmed',
    quadrant: 'high_energy_unpleasant',
    definition: 'feeling submerged beneath more demands than you can process',
    valence: -0.80,
    arousal: 0.85
  },
  {
    id: 'jittery',
    name: 'Jittery',
    quadrant: 'high_energy_unpleasant',
    definition: 'nervously restless, shaky, or over-stimulated',
    valence: -0.60,
    arousal: 0.85
  },
  {
    id: 'pressured',
    name: 'Pressured',
    quadrant: 'high_energy_unpleasant',
    definition: 'feeling forced or rushed by external expectations',
    valence: -0.65,
    arousal: 0.75
  },
  {
    id: 'restless',
    name: 'Restless',
    quadrant: 'high_energy_unpleasant',
    definition: 'unable to rest or relax as nervous energy builds',
    valence: -0.55,
    arousal: 0.70
  },
  {
    id: 'fomo',
    name: 'Fomo',
    quadrant: 'high_energy_unpleasant',
    definition: 'fear of missing out on rewarding social or professional events',
    valence: -0.50,
    arousal: 0.65
  },
  {
    id: 'irritated',
    name: 'Irritated',
    quadrant: 'high_energy_unpleasant',
    definition: 'bothered or slightly provoked by an obstacle or person',
    valence: -0.65,
    arousal: 0.70
  },
  {
    id: 'annoyed',
    name: 'Annoyed',
    quadrant: 'high_energy_unpleasant',
    definition: 'feeling slight anger or mild displeasure',
    valence: -0.60,
    arousal: 0.65
  },
  {
    id: 'frustrated',
    name: 'Frustrated',
    quadrant: 'high_energy_unpleasant',
    definition: 'feeling upset at being unable to change or achieve something',
    valence: -0.75,
    arousal: 0.75
  },
  {
    id: 'apprehensive',
    name: 'Apprehensive',
    quadrant: 'high_energy_unpleasant',
    definition: 'fearful that something unpleasant or bad is about to happen',
    valence: -0.65,
    arousal: 0.70
  },
  {
    id: 'tense',
    name: 'Tense',
    quadrant: 'high_energy_unpleasant',
    definition: 'muscles tight and nervous system bracing for conflict',
    valence: -0.70,
    arousal: 0.75
  },
  {
    id: 'scared',
    name: 'Scared',
    quadrant: 'high_energy_unpleasant',
    definition: 'perceiving threat or danger, whether physical or physiological',
    valence: -0.85,
    arousal: 0.85
  },
  {
    id: 'panicked',
    name: 'Panicked',
    quadrant: 'high_energy_unpleasant',
    definition: 'sudden, uncontrollable surge of acute fear or anxiety',
    valence: -0.90,
    arousal: 0.95
  },
  {
    id: 'alarmed',
    name: 'Alarmed',
    quadrant: 'high_energy_unpleasant',
    definition: 'a sense of urgent fear or sudden vigilance',
    valence: -0.80,
    arousal: 0.85
  },
  {
    id: 'agitated',
    name: 'Agitated',
    quadrant: 'high_energy_unpleasant',
    definition: 'very troubled, stirred up, and restless',
    valence: -0.75,
    arousal: 0.85
  },
  {
    id: 'angry',
    name: 'Angry',
    quadrant: 'high_energy_unpleasant',
    definition: 'strong feeling of annoyance, displeasure, or hostility',
    valence: -0.85,
    arousal: 0.80
  },
  {
    id: 'furious',
    name: 'Furious',
    quadrant: 'high_energy_unpleasant',
    definition: 'extremely angry and on the verge of outburst',
    valence: -0.95,
    arousal: 0.90
  },

  // ---------------------------------------------------------------------------
  // 3. LOW ENERGY • UNPLEASANT (Blue Quadrant)
  // ---------------------------------------------------------------------------
  {
    id: 'exhausted',
    name: 'Exhausted',
    quadrant: 'low_energy_unpleasant',
    definition: 'completely depleted of physical and mental energy',
    valence: -0.65,
    arousal: -0.90
  },
  {
    id: 'burned_out',
    name: 'Burned out',
    quadrant: 'low_energy_unpleasant',
    definition: 'chronic physical and emotional exhaustion from prolonged stress',
    valence: -0.80,
    arousal: -0.85
  },
  {
    id: 'tired',
    name: 'Tired',
    quadrant: 'low_energy_unpleasant',
    definition: 'in need of sleep, rest, or recovery',
    valence: -0.45,
    arousal: -0.70
  },
  {
    id: 'fatigued',
    name: 'Fatigued',
    quadrant: 'low_energy_unpleasant',
    definition: 'persistent weariness and slow physical reaction time',
    valence: -0.55,
    arousal: -0.75
  },
  {
    id: 'sad',
    name: 'Sad',
    quadrant: 'low_energy_unpleasant',
    definition: 'feeling sorrow, grief, or unhappiness',
    valence: -0.75,
    arousal: -0.50
  },
  {
    id: 'down',
    name: 'Down',
    quadrant: 'low_energy_unpleasant',
    definition: 'feeling low in spirits and lacking baseline enthusiasm',
    valence: -0.60,
    arousal: -0.60
  },
  {
    id: 'discouraged',
    name: 'Discouraged',
    quadrant: 'low_energy_unpleasant',
    definition: 'feeling a loss of confidence and enthusiasm',
    valence: -0.70,
    arousal: -0.55
  },
  {
    id: 'numb',
    name: 'Numb',
    quadrant: 'low_energy_unpleasant',
    definition: 'dampening or loss of sensitivity to feelings, with negative undertone',
    valence: -0.60,
    arousal: -0.80
  },
  {
    id: 'spent',
    name: 'Spent',
    quadrant: 'low_energy_unpleasant',
    definition: 'having used up all energy reserves and needing shutdown',
    valence: -0.65,
    arousal: -0.85
  },
  {
    id: 'meh',
    name: 'Meh',
    quadrant: 'low_energy_unpleasant',
    definition: 'unimpressed, uninspired, and indifferent to engagement',
    valence: -0.40,
    arousal: -0.50
  },
  {
    id: 'bored',
    name: 'Bored',
    quadrant: 'low_energy_unpleasant',
    definition: 'feeling weary and restless through lack of interest',
    valence: -0.45,
    arousal: -0.55
  },
  {
    id: 'disappointed',
    name: 'Disappointed',
    quadrant: 'low_energy_unpleasant',
    definition: 'sad because hopes or expectations were not fulfilled',
    valence: -0.65,
    arousal: -0.45
  },
  {
    id: 'lonely',
    name: 'Lonely',
    quadrant: 'low_energy_unpleasant',
    definition: 'feeling isolated and craving meaningful connection',
    valence: -0.70,
    arousal: -0.50
  },
  {
    id: 'helpless',
    name: 'Helpless',
    quadrant: 'low_energy_unpleasant',
    definition: 'unable to defend oneself or act without external aid',
    valence: -0.85,
    arousal: -0.65
  },
  {
    id: 'hopeless',
    name: 'Hopeless',
    quadrant: 'low_energy_unpleasant',
    definition: 'feeling that things will not improve and despair looms',
    valence: -0.90,
    arousal: -0.70
  },
  {
    id: 'apathetic',
    name: 'Apathetic',
    quadrant: 'low_energy_unpleasant',
    definition: 'showing or feeling no interest, enthusiasm, or concern',
    valence: -0.50,
    arousal: -0.60
  },
  {
    id: 'depressed',
    name: 'Depressed',
    quadrant: 'low_energy_unpleasant',
    definition: 'persistent low mood, lack of vitality, and negative self-talk',
    valence: -0.85,
    arousal: -0.65
  },
  {
    id: 'alienated',
    name: 'Alienated',
    quadrant: 'low_energy_unpleasant',
    definition: 'feeling isolated or estranged from surroundings or peers',
    valence: -0.70,
    arousal: -0.45
  },
  {
    id: 'abandoned',
    name: 'Abandoned',
    quadrant: 'low_energy_unpleasant',
    definition: 'feeling left behind and not considered, wanted, or cared about',
    valence: -0.80,
    arousal: -0.50
  },

  // ---------------------------------------------------------------------------
  // 4. LOW ENERGY • PLEASANT (Green Quadrant)
  // ---------------------------------------------------------------------------
  {
    id: 'comfortable',
    name: 'Comfortable',
    quadrant: 'low_energy_pleasant',
    definition: 'feeling reassured both in mind and body',
    valence: 0.80,
    arousal: -0.30
  },
  {
    id: 'calm',
    name: 'Calm',
    quadrant: 'low_energy_pleasant',
    definition: 'not feeling agitated, excited, or rushed; quiet peace',
    valence: 0.75,
    arousal: -0.55
  },
  {
    id: 'relaxed',
    name: 'Relaxed',
    quadrant: 'low_energy_pleasant',
    definition: 'free from physical tension and mental anxiety',
    valence: 0.80,
    arousal: -0.50
  },
  {
    id: 'chill',
    name: 'Chill',
    quadrant: 'low_energy_pleasant',
    definition: 'easygoing, calm, and unfazed by daily stressors',
    valence: 0.70,
    arousal: -0.45
  },
  {
    id: 'accepted',
    name: 'Accepted',
    quadrant: 'low_energy_pleasant',
    definition: 'feeling acknowledged, respected, and welcomed as you are',
    valence: 0.85,
    arousal: -0.35
  },
  {
    id: 'content',
    name: 'Content',
    quadrant: 'low_energy_pleasant',
    definition: 'peacefully satisfied with the current state of things',
    valence: 0.80,
    arousal: -0.40
  },
  {
    id: 'peaceful',
    name: 'Peaceful',
    quadrant: 'low_energy_pleasant',
    definition: 'tranquil, serene, and undisturbed by conflict',
    valence: 0.85,
    arousal: -0.60
  },
  {
    id: 'serene',
    name: 'Serene',
    quadrant: 'low_energy_pleasant',
    definition: 'clear, quiet, and untroubled in spirit',
    valence: 0.90,
    arousal: -0.65
  },
  {
    id: 'tranquil',
    name: 'Tranquil',
    quadrant: 'low_energy_pleasant',
    definition: 'free from commotion; completely settled and rested',
    valence: 0.85,
    arousal: -0.70
  },
  {
    id: 'grateful',
    name: 'Grateful',
    quadrant: 'low_energy_pleasant',
    definition: 'feeling deep thankfulness and appreciation for life',
    valence: 0.90,
    arousal: -0.30
  },
  {
    id: 'thankful',
    name: 'Thankful',
    quadrant: 'low_energy_pleasant',
    definition: 'expressing gratitude for good fortune or kindness',
    valence: 0.85,
    arousal: -0.35
  },
  {
    id: 'valued',
    name: 'Valued',
    quadrant: 'low_energy_pleasant',
    definition: 'feeling that your presence and work genuinely matter',
    valence: 0.85,
    arousal: -0.25
  },
  {
    id: 'loved',
    name: 'Loved',
    quadrant: 'low_energy_pleasant',
    definition: 'experiencing deep affection, warmth, and belonging',
    valence: 0.95,
    arousal: -0.25
  },
  {
    id: 'connected',
    name: 'Connected',
    quadrant: 'low_energy_pleasant',
    definition: 'feeling emotionally linked and aligned with others',
    valence: 0.85,
    arousal: -0.30
  },
  {
    id: 'supported',
    name: 'Supported',
    quadrant: 'low_energy_pleasant',
    definition: 'backed and encouraged by peers or loved ones',
    valence: 0.80,
    arousal: -0.35
  },
  {
    id: 'safe',
    name: 'Safe',
    quadrant: 'low_energy_pleasant',
    definition: 'secure from harm, danger, or emotional threats',
    valence: 0.80,
    arousal: -0.50
  },
  {
    id: 'secure',
    name: 'Secure',
    quadrant: 'low_energy_pleasant',
    definition: 'grounded in safety, predictability, and emotional trust',
    valence: 0.85,
    arousal: -0.45
  },
  {
    id: 'blessed',
    name: 'Blessed',
    quadrant: 'low_energy_pleasant',
    definition: 'experiencing fortunate grace, peace, and abundance',
    valence: 0.90,
    arousal: -0.35
  },
  {
    id: 'relieved',
    name: 'Relieved',
    quadrant: 'low_energy_pleasant',
    definition: 'reassurance following the release from anxiety or pain',
    valence: 0.80,
    arousal: -0.40
  },
  {
    id: 'satisfied',
    name: 'Satisfied',
    quadrant: 'low_energy_pleasant',
    definition: 'fulfilled expectations; comfortably complete',
    valence: 0.75,
    arousal: -0.35
  },
  {
    id: 'mellow',
    name: 'Mellow',
    quadrant: 'low_energy_pleasant',
    definition: 'soft, pleasant, and easygoing in temperament',
    valence: 0.75,
    arousal: -0.60
  },
  {
    id: 'balanced',
    name: 'Balanced',
    quadrant: 'low_energy_pleasant',
    definition: 'autonomic stability; neither over-activated nor depleted',
    valence: 0.80,
    arousal: -0.30
  },
  {
    id: 'carefree',
    name: 'Carefree',
    quadrant: 'low_energy_pleasant',
    definition: 'free from worries or heavy responsibilities',
    valence: 0.80,
    arousal: -0.40
  },
  {
    id: 'at_ease',
    name: 'At ease',
    quadrant: 'low_energy_pleasant',
    definition: 'comfortable and without stiffness or awkwardness',
    valence: 0.80,
    arousal: -0.50
  },
  {
    id: 'fulfilled',
    name: 'Fulfilled',
    quadrant: 'low_energy_pleasant',
    definition: 'deep satisfaction from developing personal potential',
    valence: 0.90,
    arousal: -0.30
  }
]

/**
 * Mathematical Russell Circumplex Mapping Helper:
 * Translates an emotion's normalized [valence, arousal] coordinates into
 * standard 0–10 schema numbers for mood, energy, and stress.
 */
export function mapEmotionToOutcomes(emotion: EmotionEntry): {
  mood: number
  energy: number
  stress: number
  suggestedBandwidthMode: 'survival_80_20' | 'standard' | 'peak_surge'
} {
  // 1. Mood (0–10, higher is better): based primarily on valence [-1.0, 1.0]
  // valence -1.0 -> 1.0; valence 0.0 -> 5.5; valence +1.0 -> 10.0
  const rawMood = ((emotion.valence + 1) / 2) * 9 + 1
  const mood = Math.round(Math.max(1, Math.min(10, rawMood)) * 10) / 10

  // 2. Energy (0–10, higher is better): based primarily on arousal [-1.0, 1.0]
  // arousal -1.0 -> 1.0; arousal 0.0 -> 5.5; arousal +1.0 -> 10.0
  const rawEnergy = ((emotion.arousal + 1) / 2) * 9 + 1
  const energy = Math.round(Math.max(1, Math.min(10, rawEnergy)) * 10) / 10

  // 3. Stress (0–10, lower is better):
  // High energy unpleasant (Red) has high stress.
  // Low energy unpleasant (Blue) has medium-high stress (burnout).
  // Pleasant emotions have low stress.
  let rawStress = 5
  if (emotion.quadrant === 'high_energy_unpleasant') {
    // Red quadrant: stress ranges from 6 to 10
    rawStress = 6 + (emotion.arousal * 2) + Math.abs(emotion.valence) * 2
  } else if (emotion.quadrant === 'low_energy_unpleasant') {
    // Blue quadrant: stress ranges from 4 to 7.5 (exhaustion stress)
    rawStress = 4 + Math.abs(emotion.valence) * 3
  } else if (emotion.quadrant === 'high_energy_pleasant') {
    // Yellow quadrant: stress ranges from 1 to 3
    rawStress = Math.max(1, 3 - emotion.valence * 2)
  } else {
    // Green quadrant: stress ranges from 0.5 to 2
    rawStress = Math.max(0.5, 2 - emotion.valence * 1.5)
  }
  const stress = Math.round(Math.max(0.5, Math.min(10, rawStress)) * 10) / 10

  // 4. Suggested Bandwidth Mode
  let suggestedBandwidthMode: 'survival_80_20' | 'standard' | 'peak_surge' = 'standard'
  if (energy <= 3.5 || (stress >= 7.5 && energy >= 7.0) || mood <= 3.5) {
    suggestedBandwidthMode = 'survival_80_20'
  } else if (energy >= 7.5 && mood >= 7.5 && stress <= 3.5) {
    suggestedBandwidthMode = 'peak_surge'
  }

  return { mood, energy, stress, suggestedBandwidthMode }
}

/**
 * Filter emotions by quadrant
 */
export function getEmotionsByQuadrant(quadrant: EmotionQuadrant): EmotionEntry[] {
  return CANONICAL_EMOTIONS.filter((e) => e.quadrant === quadrant)
}

/**
 * Search emotions by query and optional quadrant filter
 */
export function searchEmotions(
  query: string,
  quadrantFilter?: EmotionQuadrant | null
): EmotionEntry[] {
  const cleanQ = query.trim().toLowerCase()
  return CANONICAL_EMOTIONS.filter((e) => {
    if (quadrantFilter && e.quadrant !== quadrantFilter) return false
    if (!cleanQ) return true
    return (
      e.name.toLowerCase().includes(cleanQ) ||
      e.definition.toLowerCase().includes(cleanQ) ||
      e.id.toLowerCase().includes(cleanQ)
    )
  })
}
