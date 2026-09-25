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
  matrixCol: number // 0 to 5
  matrixRow: number // 0 to 5
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
    lightText: 'text-amber-950',
    darkBg: 'bg-amber-500/25',
    darkBorder: 'border-amber-400/80',
    darkText: 'text-amber-200'
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
    lightText: 'text-emerald-950',
    darkBg: 'bg-emerald-500/25',
    darkBorder: 'border-emerald-400/80',
    darkText: 'text-emerald-200'
  },
  low_energy_unpleasant: {
    key: 'low_energy_unpleasant',
    label: 'Low Energy • Unpleasant',
    sublabel: 'Exhausted, down, numb & drained',
    energyDirection: 'down',
    moodDirection: 'down',
    filterLabel: '↓ Energy  ↓ Mood',
    baseColorHex: '#3B82F6', // Blue-500
    lightBg: 'bg-blue-100',
    lightBorder: 'border-blue-400',
    lightText: 'text-blue-950',
    darkBg: 'bg-blue-500/25',
    darkBorder: 'border-blue-400/80',
    darkText: 'text-blue-200'
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
    lightText: 'text-rose-950',
    darkBg: 'bg-rose-500/25',
    darkBorder: 'border-rose-400/80',
    darkText: 'text-rose-200'
  }
}

/**
 * Solid HSL color calculation spread throughout the entire quadrant.
 * No individual circle diagonal gradient restart!
 */
export function getEmotionColor(emotion: EmotionEntry): string {
  const { quadrant, matrixCol = 0, matrixRow = 0 } = emotion
  const normX = Math.max(0, Math.min(1, matrixCol / 5))
  const normY = Math.max(0, Math.min(1, matrixRow / 5))

  if (quadrant === 'high_energy_pleasant') {
    // Yellow Quadrant (Top-Right):
    // Amber/Gold at top-left, sunny yellow in center, lime-chartreuse at bottom-right
    const hue = Math.round(40 + normX * 18 + normY * 14)
    const sat = Math.round(96 - normX * 8)
    const light = Math.round(51 + normY * 2)
    return `hsl(${hue}, ${sat}%, ${light}%)`
  }

  if (quadrant === 'high_energy_unpleasant') {
    // Red Quadrant (Top-Left):
    // Deep crimson on far-left, bright ruby at top, warm fiery coral-orange on right boundary
    const hue = Math.round(350 + normX * 32)
    const sat = Math.round(88 + (1 - normX) * 8)
    const light = Math.round(53 + normX * 3 - normY * 3)
    return `hsl(${hue % 360}, ${sat}%, ${light}%)`
  }

  if (quadrant === 'low_energy_unpleasant') {
    // Blue Quadrant (Bottom-Left):
    // Slate-indigo on left/top, royal blue in center, sky cerulean on bottom/right
    const hue = Math.round(230 - normX * 28 - normY * 6)
    const sat = Math.round(78 + normX * 18)
    const light = Math.round(52 + normY * 3)
    return `hsl(${hue}, ${sat}%, ${light}%)`
  }

  // Green Quadrant (Bottom-Right):
  // Mint-teal on left boundary, vibrant jade in center, spring green on right
  const hue = Math.round(168 - normX * 28 + (1 - normY) * 10)
  const sat = Math.round(76 + normX * 12)
  const light = Math.round(48 + normY * 3)
  return `hsl(${hue}, ${sat}%, ${light}%)`
}

export function getEmotionTextColor(emotion: EmotionEntry): string {
  if (emotion.quadrant === 'high_energy_pleasant' || emotion.quadrant === 'low_energy_pleasant') {
    return '#020617' // slate-950 on yellow and green
  }
  return '#FFFFFF' // white on red and blue
}

/**
 * Comprehensive Canonical Emotion Dataset (Exact 144 Emotions from How We Feel)
 * 36 emotions in each quadrant (6 rows x 6 columns)
 */
export const CANONICAL_EMOTIONS: EmotionEntry[] = [
  // ===========================================================================
  // 1. HIGH ENERGY • PLEASANT (Top-Right, 36 Emotions)
  // ===========================================================================
  { id: 'surprised', name: 'Surprised', quadrant: 'high_energy_pleasant', definition: 'unexpectedly astonished by something good', valence: 0.65, arousal: 0.90, matrixCol: 0, matrixRow: 0 },
  { id: 'awe', name: 'Awe', quadrant: 'high_energy_pleasant', definition: 'overwhelmed by immense wonder, reverence or grandeur', valence: 0.70, arousal: 0.90, matrixCol: 1, matrixRow: 0 },
  { id: 'exhilarated', name: 'Exhilarated', quadrant: 'high_energy_pleasant', definition: 'thrilled with vibrant physical and mental energy', valence: 0.85, arousal: 0.95, matrixCol: 2, matrixRow: 0 },
  { id: 'elated', name: 'Elated', quadrant: 'high_energy_pleasant', definition: 'overflowing with high-spirited joy and triumph', valence: 0.90, arousal: 0.95, matrixCol: 3, matrixRow: 0 },
  { id: 'ecstatic', name: 'Ecstatic', quadrant: 'high_energy_pleasant', definition: 'feeling overwhelmingly blissful, rapturous or euphoric', valence: 0.95, arousal: 0.95, matrixCol: 4, matrixRow: 0 },
  { id: 'thrilled', name: 'Thrilled', quadrant: 'high_energy_pleasant', definition: 'excited by a sudden triumph, adventure or breakthrough', valence: 0.88, arousal: 0.90, matrixCol: 5, matrixRow: 0 },

  { id: 'excited', name: 'Excited', quadrant: 'high_energy_pleasant', definition: 'eager and enthusiastic anticipation of what is ahead', valence: 0.82, arousal: 0.85, matrixCol: 0, matrixRow: 1 },
  { id: 'determined', name: 'Determined', quadrant: 'high_energy_pleasant', definition: 'firmly set on achieving a goal without wavering', valence: 0.75, arousal: 0.80, matrixCol: 1, matrixRow: 1 },
  { id: 'successful', name: 'Successful', quadrant: 'high_energy_pleasant', definition: 'feeling victorious, competent and proud of execution', valence: 0.85, arousal: 0.80, matrixCol: 2, matrixRow: 1 },
  { id: 'inspired', name: 'Inspired', quadrant: 'high_energy_pleasant', definition: 'mentally stimulated to do or create something noble', valence: 0.82, arousal: 0.80, matrixCol: 3, matrixRow: 1 },
  { id: 'empowered', name: 'Empowered', quadrant: 'high_energy_pleasant', definition: 'feeling capable, confident, and in command of your destiny', valence: 0.88, arousal: 0.85, matrixCol: 4, matrixRow: 1 },
  { id: 'amazed', name: 'Amazed', quadrant: 'high_energy_pleasant', definition: 'struck with wonderful astonishment and admiration', valence: 0.80, arousal: 0.80, matrixCol: 5, matrixRow: 1 },

  { id: 'energized', name: 'Energized', quadrant: 'high_energy_pleasant', definition: 'full of physical vitality, alertness and readiness', valence: 0.78, arousal: 0.85, matrixCol: 0, matrixRow: 2 },
  { id: 'eager', name: 'Eager', quadrant: 'high_energy_pleasant', definition: 'keenly wanting to start, engage or take on a challenge', valence: 0.74, arousal: 0.75, matrixCol: 1, matrixRow: 2 },
  { id: 'enthusiastic', name: 'Enthusiastic', quadrant: 'high_energy_pleasant', definition: 'showing vibrant approval, passion and interest', valence: 0.80, arousal: 0.78, matrixCol: 2, matrixRow: 2 },
  { id: 'productive', name: 'Productive', quadrant: 'high_energy_pleasant', definition: 'achieving significant output with effortless momentum', valence: 0.78, arousal: 0.72, matrixCol: 3, matrixRow: 2 },
  { id: 'proud', name: 'Proud', quadrant: 'high_energy_pleasant', definition: 'deep satisfaction with one’s own or another’s achievement', valence: 0.82, arousal: 0.70, matrixCol: 4, matrixRow: 2 },
  { id: 'joyful', name: 'Joyful', quadrant: 'high_energy_pleasant', definition: 'experiencing deep happiness, lightness and delight', valence: 0.90, arousal: 0.78, matrixCol: 5, matrixRow: 2 },

  { id: 'cheerful', name: 'Cheerful', quadrant: 'high_energy_pleasant', definition: 'bright, buoyant, positive and uplifted in spirit', valence: 0.76, arousal: 0.65, matrixCol: 0, matrixRow: 3 },
  { id: 'curious', name: 'Curious', quadrant: 'high_energy_pleasant', definition: 'interested in learning, exploring and discovering', valence: 0.70, arousal: 0.65, matrixCol: 1, matrixRow: 3 },
  { id: 'upbeat', name: 'Upbeat', quadrant: 'high_energy_pleasant', definition: 'consistently cheerful, optimistic and positive in posture', valence: 0.75, arousal: 0.68, matrixCol: 2, matrixRow: 3 },
  { id: 'motivated', name: 'Motivated', quadrant: 'high_energy_pleasant', definition: 'enthusiastic about doing something and pursuing goals', valence: 0.80, arousal: 0.75, matrixCol: 3, matrixRow: 3 },
  { id: 'optimistic', name: 'Optimistic', quadrant: 'high_energy_pleasant', definition: 'expecting favorable outcomes in the near and far future', valence: 0.78, arousal: 0.65, matrixCol: 4, matrixRow: 3 },
  { id: 'happy', name: 'Happy', quadrant: 'high_energy_pleasant', definition: 'feeling glad, fortunate, and in high positive spirits', valence: 0.85, arousal: 0.70, matrixCol: 5, matrixRow: 3 },

  { id: 'pleasant', name: 'Pleasant', quadrant: 'high_energy_pleasant', definition: 'agreeable, good-natured and enjoying your current state', valence: 0.70, arousal: 0.60, matrixCol: 0, matrixRow: 4 },
  { id: 'focused', name: 'Focused', quadrant: 'high_energy_pleasant', definition: 'directing clear, laser attention on a specific task', valence: 0.72, arousal: 0.65, matrixCol: 1, matrixRow: 4 },
  { id: 'alive', name: 'Alive', quadrant: 'high_energy_pleasant', definition: 'feeling vibrantly awake, present and attuned to life', valence: 0.82, arousal: 0.70, matrixCol: 2, matrixRow: 4 },
  { id: 'engaged', name: 'Engaged', quadrant: 'high_energy_pleasant', definition: 'deeply involved and absorbed in what you are doing', valence: 0.74, arousal: 0.66, matrixCol: 3, matrixRow: 4 },
  { id: 'challenged', name: 'Challenged', quadrant: 'high_energy_pleasant', definition: 'positively provoked and stimulated by an ambitious goal', valence: 0.68, arousal: 0.70, matrixCol: 4, matrixRow: 4 },
  { id: 'confident', name: 'Confident', quadrant: 'high_energy_pleasant', definition: 'trusting in your abilities, judgment and strength', valence: 0.80, arousal: 0.62, matrixCol: 5, matrixRow: 4 },

  { id: 'pleased', name: 'Pleased', quadrant: 'high_energy_pleasant', definition: 'satisfied with how things have turned out or progressed', valence: 0.75, arousal: 0.55, matrixCol: 0, matrixRow: 5 },
  { id: 'playful', name: 'Playful', quadrant: 'high_energy_pleasant', definition: 'lighthearted, spirited, and fun-loving in interaction', valence: 0.78, arousal: 0.62, matrixCol: 1, matrixRow: 5 },
  { id: 'delighted', name: 'Delighted', quadrant: 'high_energy_pleasant', definition: 'experiencing sharp, charming pleasure and gratification', valence: 0.85, arousal: 0.68, matrixCol: 2, matrixRow: 5 },
  { id: 'hopeful', name: 'Hopeful', quadrant: 'high_energy_pleasant', definition: 'believing positive and meaningful change is coming', valence: 0.76, arousal: 0.58, matrixCol: 3, matrixRow: 5 },
  { id: 'accomplished', name: 'Accomplished', quadrant: 'high_energy_pleasant', definition: 'feeling effective and successful after thorough effort', valence: 0.86, arousal: 0.64, matrixCol: 4, matrixRow: 5 },
  { id: 'wishful', name: 'Wishful', quadrant: 'high_energy_pleasant', definition: 'longing with positive hope and rich imagination', valence: 0.68, arousal: 0.55, matrixCol: 5, matrixRow: 5 },

  // ===========================================================================
  // 2. HIGH ENERGY • UNPLEASANT (Top-Left, 36 Emotions)
  // ===========================================================================
  { id: 'terrified', name: 'Terrified', quadrant: 'high_energy_unpleasant', definition: 'experiencing acute, paralyzing dread or extreme fear', valence: -0.95, arousal: 0.95, matrixCol: 0, matrixRow: 0 },
  { id: 'panicked', name: 'Panicked', quadrant: 'high_energy_unpleasant', definition: 'overwhelmed by sudden, chaotic fear and urgent alarm', valence: -0.90, arousal: 0.95, matrixCol: 1, matrixRow: 0 },
  { id: 'shocked', name: 'Shocked', quadrant: 'high_energy_unpleasant', definition: 'stunned and shaken by sudden alarming news or event', valence: -0.80, arousal: 0.90, matrixCol: 2, matrixRow: 0 },
  { id: 'impassioned', name: 'Impassioned', quadrant: 'high_energy_unpleasant', definition: 'filled with fiery, turbulent, highly charged feeling', valence: -0.55, arousal: 0.90, matrixCol: 3, matrixRow: 0 },
  { id: 'hyper', name: 'Hyper', quadrant: 'high_energy_unpleasant', definition: 'overly stimulated, frenetic and unable to settle down', valence: -0.50, arousal: 0.92, matrixCol: 4, matrixRow: 0 },
  { id: 'overwhelmed', name: 'Overwhelmed', quadrant: 'high_energy_unpleasant', definition: 'feeling buried under excessive demands or stimulation', valence: -0.75, arousal: 0.85, matrixCol: 5, matrixRow: 0 },

  { id: 'enraged', name: 'Enraged', quadrant: 'high_energy_unpleasant', definition: 'experiencing explosive, furious and violent anger', valence: -0.92, arousal: 0.95, matrixCol: 0, matrixRow: 1 },
  { id: 'irate', name: 'Irate', quadrant: 'high_energy_unpleasant', definition: 'feeling intense, incensed fury and burning indignation', valence: -0.88, arousal: 0.90, matrixCol: 1, matrixRow: 1 },
  { id: 'livid', name: 'Livid', quadrant: 'high_energy_unpleasant', definition: 'furiously angry and visibly flushed with indignation', valence: -0.85, arousal: 0.88, matrixCol: 2, matrixRow: 1 },
  { id: 'stressed', name: 'Stressed', quadrant: 'high_energy_unpleasant', definition: 'under excessive emotional, physiological or mental strain', valence: -0.75, arousal: 0.82, matrixCol: 3, matrixRow: 1 },
  { id: 'pressured', name: 'Pressured', quadrant: 'high_energy_unpleasant', definition: 'feeling intense urgency and burdensome external expectation', valence: -0.68, arousal: 0.80, matrixCol: 4, matrixRow: 1 },
  { id: 'annoyed', name: 'Annoyed', quadrant: 'high_energy_unpleasant', definition: 'irritated by a persistent nuisance or obstacle', valence: -0.60, arousal: 0.70, matrixCol: 5, matrixRow: 1 },

  { id: 'furious', name: 'Furious', quadrant: 'high_energy_unpleasant', definition: 'full of raging, tempestuous anger', valence: -0.88, arousal: 0.90, matrixCol: 0, matrixRow: 2 },
  { id: 'frightened', name: 'Frightened', quadrant: 'high_energy_unpleasant', definition: 'feeling direct, acute fear of imminent threat', valence: -0.82, arousal: 0.82, matrixCol: 1, matrixRow: 2 },
  { id: 'anxious', name: 'Anxious', quadrant: 'high_energy_unpleasant', definition: 'experiencing persistent unease, dread or nervousness', valence: -0.78, arousal: 0.82, matrixCol: 2, matrixRow: 2 },
  { id: 'irritated', name: 'Irritated', quadrant: 'high_energy_unpleasant', definition: 'bothered, prickly and reacting with sharp frustration', valence: -0.65, arousal: 0.72, matrixCol: 3, matrixRow: 2 },
  { id: 'restless', name: 'Restless', quadrant: 'high_energy_unpleasant', definition: 'unable to relax, agitated physical impulse to pace or move', valence: -0.58, arousal: 0.75, matrixCol: 4, matrixRow: 2 },
  { id: 'apprehensive', name: 'Apprehensive', quadrant: 'high_energy_unpleasant', definition: 'fearful or anxious that something bad is about to happen', valence: -0.70, arousal: 0.72, matrixCol: 5, matrixRow: 2 },

  { id: 'scared', name: 'Scared', quadrant: 'high_energy_unpleasant', definition: 'perceiving threat or danger, whether physical or physiological', valence: -0.85, arousal: 0.80, matrixCol: 0, matrixRow: 3 },
  { id: 'angry', name: 'Angry', quadrant: 'high_energy_unpleasant', definition: 'feeling strong displeasure, hostility or antagonism', valence: -0.80, arousal: 0.80, matrixCol: 1, matrixRow: 3 },
  { id: 'jittery', name: 'Jittery', quadrant: 'high_energy_unpleasant', definition: 'physiologically shaky, hyper-aroused or over-caffeinated', valence: -0.55, arousal: 0.82, matrixCol: 2, matrixRow: 3 },
  { id: 'fomo', name: 'Fomo', quadrant: 'high_energy_unpleasant', definition: 'fear of missing out on rewarding social or life events', valence: -0.52, arousal: 0.70, matrixCol: 3, matrixRow: 3 },
  { id: 'confused', name: 'Confused', quadrant: 'high_energy_unpleasant', definition: 'unable to think clearly or understand a disorienting situation', valence: -0.50, arousal: 0.65, matrixCol: 4, matrixRow: 3 },
  { id: 'jealous', name: 'Jealous', quadrant: 'high_energy_unpleasant', definition: 'threatened by rivalry, loss of affection or status', valence: -0.75, arousal: 0.75, matrixCol: 5, matrixRow: 3 },

  { id: 'repulsed', name: 'Repulsed', quadrant: 'high_energy_unpleasant', definition: 'feeling deep disgust, visceral aversion or revulsion', valence: -0.85, arousal: 0.72, matrixCol: 0, matrixRow: 4 },
  { id: 'frustrated', name: 'Frustrated', quadrant: 'high_energy_unpleasant', definition: 'blocked from achieving a desired outcome by obstacles', valence: -0.72, arousal: 0.75, matrixCol: 1, matrixRow: 4 },
  { id: 'embarrassed', name: 'Embarrassed', quadrant: 'high_energy_unpleasant', definition: 'feeling painfully self-conscious, awkward or exposed', valence: -0.65, arousal: 0.68, matrixCol: 2, matrixRow: 4 },
  { id: 'concerned', name: 'Concerned', quadrant: 'high_energy_unpleasant', definition: 'troubled, anxious and caring about a serious issue', valence: -0.60, arousal: 0.65, matrixCol: 3, matrixRow: 4 },
  { id: 'tense', name: 'Tense', quadrant: 'high_energy_unpleasant', definition: 'physically tight with taut muscles and mental alertness', valence: -0.65, arousal: 0.70, matrixCol: 4, matrixRow: 4 },
  { id: 'envious', name: 'Envious', quadrant: 'high_energy_unpleasant', definition: 'wishing you possessed the qualities or luck of another', valence: -0.70, arousal: 0.65, matrixCol: 5, matrixRow: 4 },

  { id: 'contempt', name: 'Contempt', quadrant: 'high_energy_unpleasant', definition: 'feeling disdain, scorn and bitter superiority toward others', valence: -0.80, arousal: 0.65, matrixCol: 0, matrixRow: 5 },
  { id: 'worried', name: 'Worried', quadrant: 'high_energy_unpleasant', definition: 'ruminating persistently on potential problems or dangers', valence: -0.72, arousal: 0.68, matrixCol: 1, matrixRow: 5 },
  { id: 'troubled', name: 'Troubled', quadrant: 'high_energy_unpleasant', definition: 'distressed and burdened by unresolved difficulties', valence: -0.68, arousal: 0.62, matrixCol: 2, matrixRow: 5 },
  { id: 'nervous', name: 'Nervous', quadrant: 'high_energy_unpleasant', definition: 'apprehensively keyed up before a challenging trial', valence: -0.65, arousal: 0.70, matrixCol: 3, matrixRow: 5 },
  { id: 'peeved', name: 'Peeved', quadrant: 'high_energy_unpleasant', definition: 'mildly irritated, resentful and peeved at an annoyance', valence: -0.55, arousal: 0.60, matrixCol: 4, matrixRow: 5 },
  { id: 'uneasy', name: 'Uneasy', quadrant: 'high_energy_unpleasant', definition: 'vague feeling of impending discomfort, trouble or tension', valence: -0.58, arousal: 0.58, matrixCol: 5, matrixRow: 5 },

  // ===========================================================================
  // 3. LOW ENERGY • UNPLEASANT (Bottom-Left, 36 Emotions)
  // ===========================================================================
  { id: 'disgusted', name: 'Disgusted', quadrant: 'low_energy_unpleasant', definition: 'feeling persistent distaste, disapproval and revulsion', valence: -0.80, arousal: -0.20, matrixCol: 0, matrixRow: 0 },
  { id: 'trapped', name: 'Trapped', quadrant: 'low_energy_unpleasant', definition: 'feeling confined in a suffocating corner with no escape', valence: -0.85, arousal: -0.15, matrixCol: 1, matrixRow: 0 },
  { id: 'insecure', name: 'Insecure', quadrant: 'low_energy_unpleasant', definition: 'lacking confidence and doubting self-worth or safety', valence: -0.72, arousal: -0.20, matrixCol: 2, matrixRow: 0 },
  { id: 'down', name: 'Down', quadrant: 'low_energy_unpleasant', definition: 'low in mood, feeling dejected, damp and dispirited', valence: -0.65, arousal: -0.30, matrixCol: 3, matrixRow: 0 },
  { id: 'bored', name: 'Bored', quadrant: 'low_energy_unpleasant', definition: 'unstimulated, flat and weary of current lack of interest', valence: -0.45, arousal: -0.40, matrixCol: 4, matrixRow: 0 },
  { id: 'meh', name: 'Meh', quadrant: 'low_energy_unpleasant', definition: 'thoroughly indifferent, flat, unenthusiastic and uninspired', valence: -0.35, arousal: -0.50, matrixCol: 5, matrixRow: 0 },

  { id: 'humiliated', name: 'Humiliated', quadrant: 'low_energy_unpleasant', definition: 'feeling deeply shamed, reduced and stripped of pride', valence: -0.92, arousal: -0.25, matrixCol: 0, matrixRow: 1 },
  { id: 'ashamed', name: 'Ashamed', quadrant: 'low_energy_unpleasant', definition: 'distressed by guilt or personal wrongdoing and remorse', valence: -0.85, arousal: -0.30, matrixCol: 1, matrixRow: 1 },
  { id: 'lost', name: 'Lost', quadrant: 'low_energy_unpleasant', definition: 'lacking direction, clarity, bearings or compass', valence: -0.75, arousal: -0.35, matrixCol: 2, matrixRow: 1 },
  { id: 'disheartened', name: 'Disheartened', quadrant: 'low_energy_unpleasant', definition: 'having lost courage, enthusiasm or inner determination', valence: -0.70, arousal: -0.40, matrixCol: 3, matrixRow: 1 },
  { id: 'tired', name: 'Tired', quadrant: 'low_energy_unpleasant', definition: 'physically and mentally drained, needing restorative sleep', valence: -0.50, arousal: -0.60, matrixCol: 4, matrixRow: 1 },
  { id: 'vulnerable', name: 'Vulnerable', quadrant: 'low_energy_unpleasant', definition: 'exposed, defenseless and susceptible to harm or judgment', valence: -0.62, arousal: -0.30, matrixCol: 5, matrixRow: 1 },

  { id: 'pessimistic', name: 'Pessimistic', quadrant: 'low_energy_unpleasant', definition: 'expecting unfavorable or bleak outcomes to occur', valence: -0.68, arousal: -0.35, matrixCol: 0, matrixRow: 2 },
  { id: 'disconnected', name: 'Disconnected', quadrant: 'low_energy_unpleasant', definition: 'feeling detached from other people or physical surroundings', valence: -0.70, arousal: -0.45, matrixCol: 1, matrixRow: 2 },
  { id: 'disappointed', name: 'Disappointed', quadrant: 'low_energy_unpleasant', definition: 'let down by expectations failing to materialize', valence: -0.72, arousal: -0.40, matrixCol: 2, matrixRow: 2 },
  { id: 'sad', name: 'Sad', quadrant: 'low_energy_unpleasant', definition: 'experiencing deep sorrow, grief, heartache or loss', valence: -0.80, arousal: -0.50, matrixCol: 3, matrixRow: 2 },
  { id: 'forlorn', name: 'Forlorn', quadrant: 'low_energy_unpleasant', definition: 'pitifully sad, deserted and desperately lonely', valence: -0.85, arousal: -0.55, matrixCol: 4, matrixRow: 2 },
  { id: 'fatigued', name: 'Fatigued', quadrant: 'low_energy_unpleasant', definition: 'exhausted from prolonged physical, nervous or mental toil', valence: -0.58, arousal: -0.68, matrixCol: 5, matrixRow: 2 },

  { id: 'guilty', name: 'Guilty', quadrant: 'low_energy_unpleasant', definition: 'feeling internal self-reproach for an error or harm done', valence: -0.78, arousal: -0.35, matrixCol: 0, matrixRow: 3 },
  { id: 'numb', name: 'Numb', quadrant: 'low_energy_unpleasant', definition: 'dampening or loss of sensitivity to feelings, with negative mood', valence: -0.65, arousal: -0.60, matrixCol: 1, matrixRow: 3 },
  { id: 'excluded', name: 'Excluded', quadrant: 'low_energy_unpleasant', definition: 'feeling deliberately left out, rejected or uninvited', valence: -0.75, arousal: -0.40, matrixCol: 2, matrixRow: 3 },
  { id: 'spent', name: 'Spent', quadrant: 'low_energy_unpleasant', definition: 'completely drained of energy with zero reserve left', valence: -0.60, arousal: -0.75, matrixCol: 3, matrixRow: 3 },
  { id: 'discouraged', name: 'Discouraged', quadrant: 'low_energy_unpleasant', definition: 'feeling a loss of confidence and dampening of enthusiasm', valence: -0.72, arousal: -0.45, matrixCol: 4, matrixRow: 3 },
  { id: 'disengaged', name: 'Disengaged', quadrant: 'low_energy_unpleasant', definition: 'emotionally checked out, detached and uninvested', valence: -0.55, arousal: -0.50, matrixCol: 5, matrixRow: 3 },

  { id: 'depressed', name: 'Depressed', quadrant: 'low_energy_unpleasant', definition: 'heavy, persistent cloud of sadness and loss of interest', valence: -0.90, arousal: -0.70, matrixCol: 0, matrixRow: 4 },
  { id: 'hopeless', name: 'Hopeless', quadrant: 'low_energy_unpleasant', definition: 'feeling no expectation of improvement or relief', valence: -0.92, arousal: -0.65, matrixCol: 1, matrixRow: 4 },
  { id: 'alienated', name: 'Alienated', quadrant: 'low_energy_unpleasant', definition: 'feeling like an outsider, isolated and foreign', valence: -0.78, arousal: -0.45, matrixCol: 2, matrixRow: 4 },
  { id: 'nostalgic', name: 'Nostalgic', quadrant: 'low_energy_unpleasant', definition: 'wistful, melancholy longing for the past that is gone', valence: -0.40, arousal: -0.35, matrixCol: 3, matrixRow: 4 },
  { id: 'lonely', name: 'Lonely', quadrant: 'low_energy_unpleasant', definition: 'feeling sad and isolated from meaningful connection', valence: -0.82, arousal: -0.50, matrixCol: 4, matrixRow: 4 },
  { id: 'apathetic', name: 'Apathetic', quadrant: 'low_energy_unpleasant', definition: 'complete lack of interest, enthusiasm or emotional concern', valence: -0.50, arousal: -0.60, matrixCol: 5, matrixRow: 4 },

  { id: 'miserable', name: 'Miserable', quadrant: 'low_energy_unpleasant', definition: 'wretchedly unhappy, uncomfortable and suffering', valence: -0.92, arousal: -0.60, matrixCol: 0, matrixRow: 5 },
  { id: 'despair', name: 'Despair', quadrant: 'low_energy_unpleasant', definition: 'complete absence of hope, utter defeat and desolation', valence: -0.95, arousal: -0.70, matrixCol: 1, matrixRow: 5 },
  { id: 'glum', name: 'Glum', quadrant: 'low_energy_unpleasant', definition: 'quietly sullen, morose, dejected and dispirited', valence: -0.70, arousal: -0.55, matrixCol: 2, matrixRow: 5 },
  { id: 'burned_out', name: 'Burned out', quadrant: 'low_energy_unpleasant', definition: 'profound exhaustion caused by chronic unmanaged load', valence: -0.85, arousal: -0.80, matrixCol: 3, matrixRow: 5 },
  { id: 'exhausted', name: 'Exhausted', quadrant: 'low_energy_unpleasant', definition: 'completely drained of physical and mental energy', valence: -0.75, arousal: -0.85, matrixCol: 4, matrixRow: 5 },
  { id: 'helpless', name: 'Helpless', quadrant: 'low_energy_unpleasant', definition: 'unable to defend oneself or act with efficacy', valence: -0.88, arousal: -0.65, matrixCol: 5, matrixRow: 5 },

  // ===========================================================================
  // 4. LOW ENERGY • PLEASANT (Bottom-Right, 36 Emotions)
  // ===========================================================================
  { id: 'at_ease', name: 'At ease', quadrant: 'low_energy_pleasant', definition: 'comfortable, unwound and free from worry or distress', valence: 0.70, arousal: -0.25, matrixCol: 0, matrixRow: 0 },
  { id: 'calm', name: 'Calm', quadrant: 'low_energy_pleasant', definition: 'peaceful and tranquil, free from agitation or hurry', valence: 0.75, arousal: -0.40, matrixCol: 1, matrixRow: 0 },
  { id: 'understood', name: 'Understood', quadrant: 'low_energy_pleasant', definition: 'feeling deeply seen, heard and validated by others', valence: 0.80, arousal: -0.20, matrixCol: 2, matrixRow: 0 },
  { id: 'fulfilled', name: 'Fulfilled', quadrant: 'low_energy_pleasant', definition: 'deeply satisfied with one’s contributions and existence', valence: 0.88, arousal: -0.15, matrixCol: 3, matrixRow: 0 },
  { id: 'respected', name: 'Respected', quadrant: 'low_energy_pleasant', definition: 'feeling honored, recognized and held in high regard', valence: 0.82, arousal: -0.20, matrixCol: 4, matrixRow: 0 },
  { id: 'blissful', name: 'Blissful', quadrant: 'low_energy_pleasant', definition: 'pure, heavenly serenity and supreme peaceful delight', valence: 0.95, arousal: -0.25, matrixCol: 5, matrixRow: 0 },

  { id: 'thoughtful', name: 'Thoughtful', quadrant: 'low_energy_pleasant', definition: 'quietly contemplative, reflective and considerate', valence: 0.65, arousal: -0.30, matrixCol: 0, matrixRow: 1 },
  { id: 'good', name: 'Good', quadrant: 'low_energy_pleasant', definition: 'experiencing clean, balanced and reassuring health', valence: 0.72, arousal: -0.20, matrixCol: 1, matrixRow: 1 },
  { id: 'appreciated', name: 'Appreciated', quadrant: 'low_energy_pleasant', definition: 'feeling acknowledged, cherished and valued by others', valence: 0.82, arousal: -0.22, matrixCol: 2, matrixRow: 1 },
  { id: 'loved', name: 'Loved', quadrant: 'low_energy_pleasant', definition: 'warmed by deep affection, tenderness and belonging', valence: 0.92, arousal: -0.20, matrixCol: 3, matrixRow: 1 },
  { id: 'supported', name: 'Supported', quadrant: 'low_energy_pleasant', definition: 'comforted by knowing you have trustworthy backing', valence: 0.80, arousal: -0.25, matrixCol: 4, matrixRow: 1 },
  { id: 'connected', name: 'Connected', quadrant: 'low_energy_pleasant', definition: 'feeling close, bonded and in tune with others or life', valence: 0.85, arousal: -0.22, matrixCol: 5, matrixRow: 1 },

  { id: 'chill', name: 'Chill', quadrant: 'low_energy_pleasant', definition: 'relaxed, cool-headed and unwinding with ease', valence: 0.72, arousal: -0.45, matrixCol: 0, matrixRow: 2 },
  { id: 'relaxed', name: 'Relaxed', quadrant: 'low_energy_pleasant', definition: 'free from physical tension, muscle stiffness and anxiety', valence: 0.78, arousal: -0.50, matrixCol: 1, matrixRow: 2 },
  { id: 'compassionate', name: 'Compassionate', quadrant: 'low_energy_pleasant', definition: 'feeling gentle, tender sympathy and kindness toward all', valence: 0.76, arousal: -0.30, matrixCol: 2, matrixRow: 2 },
  { id: 'included', name: 'Included', quadrant: 'low_energy_pleasant', definition: 'welcomed warmly and belonging as part of the circle', valence: 0.80, arousal: -0.25, matrixCol: 3, matrixRow: 2 },
  { id: 'valued', name: 'Valued', quadrant: 'low_energy_pleasant', definition: 'knowing that your presence and work genuinely matter', valence: 0.84, arousal: -0.22, matrixCol: 4, matrixRow: 2 },
  { id: 'grateful', name: 'Grateful', quadrant: 'low_energy_pleasant', definition: 'deeply appreciative of kindness, life and blessings', valence: 0.88, arousal: -0.30, matrixCol: 5, matrixRow: 2 },

  { id: 'sympathetic', name: 'Sympathetic', quadrant: 'low_energy_pleasant', definition: 'openhearted compassion and care for another person', valence: 0.74, arousal: -0.32, matrixCol: 0, matrixRow: 3 },
  { id: 'comfortable', name: 'Comfortable', quadrant: 'low_energy_pleasant', definition: 'feeling completely reassured, snug and at home in body', valence: 0.78, arousal: -0.40, matrixCol: 1, matrixRow: 3 },
  { id: 'empathetic', name: 'Empathetic', quadrant: 'low_energy_pleasant', definition: 'deeply understanding and sharing the feelings of another', valence: 0.76, arousal: -0.30, matrixCol: 2, matrixRow: 3 },
  { id: 'content', name: 'Content', quadrant: 'low_energy_pleasant', definition: 'peacefully satisfied with what is, without striving', valence: 0.82, arousal: -0.45, matrixCol: 3, matrixRow: 3 },
  { id: 'accepted', name: 'Accepted', quadrant: 'low_energy_pleasant', definition: 'feeling acknowledged, embraced and seen without judgment', valence: 0.85, arousal: -0.35, matrixCol: 4, matrixRow: 3 },
  { id: 'moved', name: 'Moved', quadrant: 'low_energy_pleasant', definition: 'touched emotionally by profound beauty, grace or meaning', valence: 0.80, arousal: -0.25, matrixCol: 5, matrixRow: 3 },

  { id: 'mellow', name: 'Mellow', quadrant: 'low_energy_pleasant', definition: 'pleasantly soft, warm, relaxed and unhurried', valence: 0.75, arousal: -0.55, matrixCol: 0, matrixRow: 4 },
  { id: 'peaceful', name: 'Peaceful', quadrant: 'low_energy_pleasant', definition: 'quiet inner stillness, undisturbed harmony and calm', valence: 0.86, arousal: -0.60, matrixCol: 1, matrixRow: 4 },
  { id: 'balanced', name: 'Balanced', quadrant: 'low_energy_pleasant', definition: 'equipoise, stable, centered and calm from within', valence: 0.80, arousal: -0.40, matrixCol: 2, matrixRow: 4 },
  { id: 'safe', name: 'Safe', quadrant: 'low_energy_pleasant', definition: 'protected, secure, and completely free from danger', valence: 0.84, arousal: -0.48, matrixCol: 3, matrixRow: 4 },
  { id: 'secure', name: 'Secure', quadrant: 'low_energy_pleasant', definition: 'confident in safety, stability and quiet protection', valence: 0.82, arousal: -0.45, matrixCol: 4, matrixRow: 4 },
  { id: 'blessed', name: 'Blessed', quadrant: 'low_energy_pleasant', definition: 'filled with quiet gratitude and spiritual enrichment', valence: 0.88, arousal: -0.35, matrixCol: 5, matrixRow: 4 },

  { id: 'carefree', name: 'Carefree', quadrant: 'low_energy_pleasant', definition: 'lighthearted, unburdened and free of worry or duty', valence: 0.78, arousal: -0.50, matrixCol: 0, matrixRow: 5 },
  { id: 'tranquil', name: 'Tranquil', quadrant: 'low_energy_pleasant', definition: 'deeply serene, crystal calm, untroubled and still', valence: 0.88, arousal: -0.65, matrixCol: 1, matrixRow: 5 },
  { id: 'thankful', name: 'Thankful', quadrant: 'low_energy_pleasant', definition: 'warmly appreciative of received benefits and care', valence: 0.84, arousal: -0.40, matrixCol: 2, matrixRow: 5 },
  { id: 'relieved', name: 'Relieved', quadrant: 'low_energy_pleasant', definition: 'liberated from anxiety or pain, sigh of release', valence: 0.82, arousal: -0.50, matrixCol: 3, matrixRow: 5 },
  { id: 'satisfied', name: 'Satisfied', quadrant: 'low_energy_pleasant', definition: 'pleased with the calm fulfillment of a need or day', valence: 0.80, arousal: -0.45, matrixCol: 4, matrixRow: 5 },
  { id: 'serene', name: 'Serene', quadrant: 'low_energy_pleasant', definition: 'unclouded, quiet, luminous and shining inner peace', valence: 0.90, arousal: -0.65, matrixCol: 5, matrixRow: 5 }
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
  const rawMood = ((emotion.valence + 1) / 2) * 9 + 1
  const mood = Math.round(Math.max(1, Math.min(10, rawMood)) * 10) / 10

  const rawEnergy = ((emotion.arousal + 1) / 2) * 9 + 1
  const energy = Math.round(Math.max(1, Math.min(10, rawEnergy)) * 10) / 10

  let rawStress = 5
  if (emotion.quadrant === 'high_energy_unpleasant') {
    rawStress = 6 + (emotion.arousal * 2) + Math.abs(emotion.valence) * 2
  } else if (emotion.quadrant === 'low_energy_unpleasant') {
    rawStress = 4 + Math.abs(emotion.valence) * 3
  } else if (emotion.quadrant === 'high_energy_pleasant') {
    rawStress = Math.max(1, 3 - emotion.valence * 2)
  } else {
    rawStress = Math.max(0.5, 2 - emotion.valence * 1.5)
  }
  const stress = Math.round(Math.max(0.5, Math.min(10, rawStress)) * 10) / 10

  let suggestedBandwidthMode: 'survival_80_20' | 'standard' | 'peak_surge' = 'standard'
  if (energy <= 3.5 || (stress >= 7.5 && energy >= 7.0) || mood <= 3.5) {
    suggestedBandwidthMode = 'survival_80_20'
  } else if (energy >= 7.5 && mood >= 7.5 && stress <= 3.5) {
    suggestedBandwidthMode = 'peak_surge'
  }

  return { mood, energy, stress, suggestedBandwidthMode }
}

export function getEmotionsByQuadrant(quadrant: EmotionQuadrant): EmotionEntry[] {
  return CANONICAL_EMOTIONS.filter((e) => e.quadrant === quadrant)
}

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
