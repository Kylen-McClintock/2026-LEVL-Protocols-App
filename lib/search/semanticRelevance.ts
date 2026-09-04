import { Modality, Protocol } from '../types'
import type { SemanticSearchResult } from '@/app/actions/search'

// Common conversational words and search noise to ignore
const STOP_WORDS = new Set([
  'how', 'do', 'i', 'can', 'what', 'is', 'the', 'to', 'for', 'a', 'an', 'in', 'on', 'of',
  'and', 'or', 'with', 'about', 'protocol', 'protocols', 'modality', 'modalities', 'best',
  'recommend', 'recommended', 'better', 'good', 'improve', 'improving', 'help', 'helps',
  'me', 'my', 'you', 'your', 'from', 'at', 'by', 'that', 'this', 'any', 'some', 'than',
  'much', 'more', 'most', 'way', 'ways', 'stack', 'routine'
])

// Curated Longevity & Bio-Optimization Semantic Concept Synonyms
const CONCEPT_SYNONYMS: Record<string, string[]> = {
  sleep: [
    'circadian', 'melatonin', 'insomnia', 'rest', 'rem', 'deep_sleep', 'wind_down',
    'darkness', 'blue_light', 'bedtime', 'mouth_tape', 'night', 'somnolence', 'sleep_quality',
    'sleep_architecture', 'walker', 'magnesium'
  ],
  insomnia: ['sleep', 'circadian', 'melatonin', 'rest', 'wind_down', 'bedtime', 'night'],
  cold: ['plunge', 'ice_bath', 'cryo', 'cryotherapy', 'cold_shower', 'soberg', 'shivering', 'brown_fat', 'thermogenesis'],
  plunge: ['cold', 'ice_bath', 'cryo', 'cryotherapy', 'soberg', 'thermogenesis', 'brown_fat'],
  heat: ['sauna', 'hyperthermia', 'heat_shock', 'sweat', 'infrared', 'finnish', 'thermal'],
  sauna: ['heat', 'hyperthermia', 'heat_shock', 'sweating', 'infrared', 'finnish', 'thermal'],
  energy: ['mitochondria', 'atp', 'nad', 'nmn', 'alertness', 'vitality', 'caffeine', 'adenosine', 'nr', 'fatigue'],
  fatigue: ['energy', 'mitochondria', 'nad', 'nmn', 'vitality', 'alertness', 'sleep'],
  focus: ['nootropic', 'semax', 'selank', 'memory', 'cognitive', 'cognition', 'dopamine', 'neuro', 'mental', 'lion_s_mane', 'attention'],
  brain: ['cognitive', 'cognition', 'nootropic', 'neuro', 'neurogenesis', 'memory', 'focus', 'semax', 'selank', 'bdnf'],
  cognition: ['focus', 'brain', 'nootropic', 'memory', 'neuro', 'semax', 'selank', 'bdnf'],
  muscle: ['resistance', 'lifting', 'hypertrophy', 'strength', 'creatine', 'protein', 'anabolic', 'cjc', 'ipamorelin', 'workout'],
  strength: ['muscle', 'resistance', 'lifting', 'hypertrophy', 'creatine', 'protein', 'workout'],
  hypertrophy: ['muscle', 'strength', 'resistance', 'lifting', 'protein', 'creatine', 'anabolic'],
  fat_loss: ['lipolysis', 'visceral', 'glp1', 'tirzepatide', 'semaglutide', 'retatrutide', 'fasting', 'metabolic', 'aod', 'weight_loss'],
  weight_loss: ['fat_loss', 'lipolysis', 'visceral', 'glp1', 'tirzepatide', 'semaglutide', 'fasting', 'aod', 'metabolic'],
  fasting: ['autophagy', 'fmd', 'intermittent_fasting', 'time_restricted', 'longevity', 'sinclair', 'longo'],
  heart: ['vo2', 'cardiovascular', 'aerobic', 'zone_2', 'zone_5', 'endurance', 'cpet', 'nitric_oxide', 'blood_pressure'],
  cardio: ['vo2', 'heart', 'aerobic', 'zone_2', 'zone_5', 'endurance', 'running', 'cycling', 'hiit'],
  vo2: ['cardio', 'heart', 'zone_5', 'aerobic', 'hiit', 'endurance', 'cpet'],
  joint: ['bpc', 'tb_500', 'tb500', 'collagen', 'tendon', 'ligament', 'cartilage', 'inflammation', 'tissue_repair', 'injury'],
  injury: ['joint', 'repair', 'bpc', 'tb_500', 'tb500', 'tissue', 'collagen', 'tendon', 'healing'],
  repair: ['injury', 'joint', 'bpc', 'tb_500', 'tissue_repair', 'collagen', 'recovery'],
  stress: ['cortisol', 'hrv', 'vagus', 'vagal', 'breathwork', 'physiological_sigh', 'nsdr', 'nervous_system', 'calm', 'anxiety'],
  anxiety: ['stress', 'cortisol', 'hrv', 'vagus', 'breathwork', 'calm', 'nervous_system', 'l_theanine'],
  gut: ['microbiome', 'fiber', 'probiotic', 'prebiotic', 'gut_barrier', 'digestive', 'digestion', 'fermented'],
  longevity: ['blueprint', 'sinclair', 'rapamycin', 'metformin', 'senolytic', 'fisetin', 'spermidine', 'epigenetic', 'hallmark'],
  aging: ['longevity', 'anti_aging', 'senolytic', 'fisetin', 'epigenetic', 'hallmark', 'sinclair', 'blueprint'],
  peptides: ['peptide', 'bpc', 'tb500', 'cjc', 'ipamorelin', 'semax', 'selank', 'epitalon', 'ghk', 'retatrutide', 'tirzepatide']
}

/**
 * Extracts cleaned search tokens and expanded semantic concepts from a user query string.
 */
export function extractSearchTokens(rawQuery: string): { tokens: string[]; expandedConcepts: Set<string> } {
  const clean = rawQuery
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, ' ')
    .trim()

  const rawTokens = clean.split(/\s+/).filter(Boolean)
  const meaningfulTokens = rawTokens.filter(t => !STOP_WORDS.has(t) && t.length > 1)
  
  // If all words were stopwords (e.g. "how do I"), fallback to raw tokens
  const tokens = meaningfulTokens.length > 0 ? meaningfulTokens : rawTokens.filter(t => t.length > 1)

  const expandedConcepts = new Set<string>()
  tokens.forEach(tok => {
    expandedConcepts.add(tok)
    if (CONCEPT_SYNONYMS[tok]) {
      CONCEPT_SYNONYMS[tok].forEach(syn => expandedConcepts.add(syn))
    }
    // Check partial matches in concept keys
    Object.entries(CONCEPT_SYNONYMS).forEach(([key, synonyms]) => {
      if (tok.includes(key) || key.includes(tok)) {
        expandedConcepts.add(key)
        synonyms.forEach(syn => expandedConcepts.add(syn))
      }
    })
  })

  return { tokens, expandedConcepts }
}

/**
 * Computes semantic & lexical relevance score for a modality.
 * Returns { isMatch: boolean, score: number }.
 */
export function calculateModalityRelevance(
  mod: Modality,
  rawQuery: string,
  searchResults: SemanticSearchResult[] = []
): { isMatch: boolean; score: number } {
  const q = rawQuery.trim().toLowerCase()
  if (!q) {
    return { isMatch: true, score: 0 }
  }

  const { tokens, expandedConcepts } = extractSearchTokens(q)
  if (tokens.length === 0) {
    return { isMatch: true, score: 0 }
  }

  const name = (mod.display_name || mod.name || '').toLowerCase()
  const type = (mod.modality_type || '').toLowerCase()
  const cat = (mod.category || '').toLowerCase()
  const desc = (mod.brief_description || '').toLowerCase()
  const headline = (mod.headline_benefit || '').toLowerCase()
  const why = (mod.expanded_why || '').toLowerCase()
  const primary = (mod.primary_outcome || '').toLowerCase()
  const secondary = Array.isArray(mod.secondary_outcomes) ? mod.secondary_outcomes.join(' ').toLowerCase() : ''
  const mechanism = (mod.mechanism_of_action || '').toLowerCase()

  const fullText = `${name} ${type} ${cat} ${headline} ${primary} ${secondary} ${desc} ${why} ${mechanism}`

  let score = 0

  // 1. Direct whole-query match bonuses
  if (name === q) score += 2000
  else if (name.startsWith(q)) score += 1000
  else if (name.includes(q)) score += 600

  if (headline.includes(q)) score += 350
  if (primary.includes(q) || secondary.includes(q)) score += 300
  if (desc.includes(q)) score += 200

  // 2. Token-level matching across fields
  let matchedTokensCount = 0
  tokens.forEach(tok => {
    let tokenMatched = false

    if (name.includes(tok)) {
      score += 400
      tokenMatched = true
    }
    if (headline.includes(tok)) {
      score += 200
      tokenMatched = true
    }
    if (primary.includes(tok) || secondary.includes(tok)) {
      score += 150
      tokenMatched = true
    }
    if (cat.includes(tok) || type.includes(tok)) {
      score += 120
      tokenMatched = true
    }
    if (desc.includes(tok) || why.includes(tok) || mechanism.includes(tok)) {
      score += 80
      tokenMatched = true
    }

    if (tokenMatched) matchedTokensCount++
  })

  // 3. Concept expansion & synonym matches
  expandedConcepts.forEach(concept => {
    const cleanConcept = concept.replace(/_/g, ' ')
    if (name.includes(cleanConcept)) score += 180
    else if (headline.includes(cleanConcept) || primary.includes(cleanConcept)) score += 120
    else if (desc.includes(cleanConcept) || why.includes(cleanConcept) || cat.includes(cleanConcept)) score += 60
  })

  // 4. Remote semantic search RPC match bonus (only for meaningful similarity >= 0.45)
  const semMatch = searchResults.find(r => r.id === mod.id)
  if (semMatch && semMatch.similarity >= 0.45) {
    score += Math.round(semMatch.similarity * 500)
  }

  // 5. Determine if modality qualifies as a genuine search match
  // Eliminates weak false positives from single keyword occurrences in long descriptions
  const hasStrongTokenMatch = tokens.length === 1 
    ? (matchedTokensCount === 1 && score >= 120) 
    : (matchedTokensCount >= Math.ceil(tokens.length * 0.5) && score >= 120)

  const isMatch = (semMatch && semMatch.similarity >= 0.45) || hasStrongTokenMatch || score >= 150

  return { isMatch, score }
}

/**
 * Computes semantic & lexical relevance score for a protocol.
 * Returns { isMatch: boolean, score: number }.
 */
export function calculateProtocolRelevance(
  proto: any,
  rawQuery: string
): { isMatch: boolean; score: number } {
  const q = rawQuery.trim().toLowerCase()
  if (!q) {
    return { isMatch: true, score: 0 }
  }

  const { tokens, expandedConcepts } = extractSearchTokens(q)
  if (tokens.length === 0) {
    return { isMatch: true, score: 0 }
  }

  const name = (proto.name || '').toLowerCase()
  const desc = (proto.description || '').toLowerCase()
  const primaryGoal = (proto.primary_goal || proto.goal || '').toLowerCase()
  const source = (proto.source_label || proto.author_id || '').toLowerCase()
  const vectors = Array.isArray(proto.target_vectors) ? proto.target_vectors.join(' ').toLowerCase() : ''
  const steps = (proto.steps || proto.protocol_steps || [])
    .map((s: any) => `${s.modality?.display_name || s.modality?.name || ''} ${s.notes || ''}`)
    .join(' ')
    .toLowerCase()

  let score = 0

  // 1. Direct whole-query match
  if (name === q) score += 2000
  else if (name.startsWith(q)) score += 1000
  else if (name.includes(q)) score += 600

  if (primaryGoal.includes(q)) score += 350
  if (source.includes(q)) score += 300
  if (steps.includes(q)) score += 250
  if (desc.includes(q)) score += 150

  // 2. Token-level matching
  let matchedTokensCount = 0
  tokens.forEach(tok => {
    let tokenMatched = false

    if (name.includes(tok)) {
      score += 400
      tokenMatched = true
    }
    if (primaryGoal.includes(tok) || vectors.includes(tok)) {
      score += 200
      tokenMatched = true
    }
    if (source.includes(tok)) {
      score += 150
      tokenMatched = true
    }
    if (steps.includes(tok)) {
      score += 120
      tokenMatched = true
    }
    if (desc.includes(tok)) {
      score += 80
      tokenMatched = true
    }

    if (tokenMatched) matchedTokensCount++
  })

  // 3. Concept expansion & synonym matches
  expandedConcepts.forEach(concept => {
    const cleanConcept = concept.replace(/_/g, ' ')
    if (name.includes(cleanConcept)) score += 180
    else if (primaryGoal.includes(cleanConcept) || vectors.includes(cleanConcept)) score += 120
    else if (steps.includes(cleanConcept) || desc.includes(cleanConcept)) score += 60
  })

  // Determine if protocol qualifies as a genuine search match
  const hasStrongTokenMatch = tokens.length === 1 
    ? (matchedTokensCount === 1 && score >= 120) 
    : (matchedTokensCount >= Math.ceil(tokens.length * 0.5) && score >= 120)

  const isMatch = hasStrongTokenMatch || score >= 150

  return { isMatch, score }
}
