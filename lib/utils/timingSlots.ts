/**
 * Canonical Timing Slot & Circadian Ordering Engine
 * Single Source of Truth for timing slot classification, normalization, and chronological sequence.
 * 
 * CRITICAL ARCHITECTURAL RULE:
 * NEVER use loose substring checks like `.includes('noon')` or `.includes('am')` to classify timing slots.
 * Substring sniffing causes catastrophic ordering inversions (e.g. "afternoon".includes("noon") === true).
 * All slot resolution MUST pass through `canonicalizeTimingSlot` or `getTimeBlockOrder`.
 */

export const CANONICAL_TIMING_SLOTS = [
  'waking',
  'morning_routine',
  'morning',
  'first_meal',
  'midday',
  'afternoon',
  'late_afternoon',
  'pre_meal',
  'post_meal',
  'evening',
  'wind_down',
  'pre_bed',
  'bedtime',
  'anytime'
] as const

export type CanonicalTimingSlot = (typeof CANONICAL_TIMING_SLOTS)[number]

/**
 * Immutable chronological sequence weights for each canonical circadian time block.
 * Strictly enforces that Midday (4) precedes Afternoon (5).
 */
export const TIMING_SLOT_ORDER: Record<CanonicalTimingSlot, number> = {
  waking: 0,
  morning_routine: 1,
  morning: 2,
  first_meal: 3,
  midday: 4,
  afternoon: 5,
  late_afternoon: 6,
  pre_meal: 7,
  post_meal: 8,
  evening: 9,
  wind_down: 10,
  pre_bed: 11,
  bedtime: 12,
  anytime: 99
}

/**
 * Exact dictionary mapping of all known database keys, legacy aliases, and supplement stack keys
 * to their canonical time block.
 */
const EXACT_SLOT_MAP: Record<string, CanonicalTimingSlot> = {
  // Waking
  waking: 'waking',
  wake: 'waking',
  dawn: 'waking',
  sunrise: 'waking',
  early_dawn: 'waking',

  // Morning Routine
  morning_routine: 'morning_routine',
  routine: 'morning_routine',

  // Morning & Morning Stacks
  morning: 'morning',
  morning_supplement_stack: 'morning',
  morning_supplement: 'morning',
  morning_supplements: 'morning',
  am_stack: 'morning',
  fasted_am: 'morning',
  am: 'morning',

  // First Meal
  first_meal: 'first_meal',
  breakfast: 'first_meal',
  meal_1: 'first_meal',

  // Midday & Midday Stacks
  midday: 'midday',
  midday_stack: 'midday',
  lunch_stack: 'midday',
  lunch: 'midday',
  noon: 'midday',
  solar_noon: 'midday',

  // Afternoon
  afternoon: 'afternoon',
  afternoon_workout: 'afternoon',
  afternoon_training: 'afternoon',
  workout: 'afternoon',
  training: 'afternoon',

  // Late Afternoon
  late_afternoon: 'late_afternoon',

  // Pre-Meal
  pre_meal: 'pre_meal',
  'pre-meal': 'pre_meal',
  pre_dinner: 'pre_meal',

  // Post-Meal
  post_meal: 'post_meal',
  'post-meal': 'post_meal',
  postprandial: 'post_meal',
  post_dinner: 'post_meal',

  // Evening & Evening Stacks
  evening: 'evening',
  evening_supplement_stack: 'evening',
  evening_supplement: 'evening',
  evening_supplements: 'evening',
  pm_stack: 'evening',
  dinner_stack: 'evening',
  dinner: 'evening',
  sunset: 'evening',
  dusk: 'evening',
  pm: 'evening',

  // Wind Down
  wind_down: 'wind_down',
  winddown: 'wind_down',
  'wind-down': 'wind_down',

  // Pre-Bed
  pre_bed: 'pre_bed',
  'pre-bed': 'pre_bed',
  prebed: 'pre_bed',

  // Bedtime
  bedtime: 'bedtime',
  bed: 'bedtime',
  sleep: 'bedtime',
  night: 'bedtime',
  nightly: 'bedtime',
  overnight: 'bedtime',

  // Anytime / Flexible
  anytime: 'anytime',
  flexible: 'anytime',
  all_day: 'anytime'
}

/**
 * Word-boundary regex patterns evaluated in STRICT chronological priority order.
 * Notice: Word boundaries (\b) ensure that "afternoon" can NEVER match "noon",
 * and "warmup" can NEVER match "am".
 */
const WORD_BOUNDARY_PATTERNS: Array<{ pattern: RegExp; slot: CanonicalTimingSlot }> = [
  // 1. Late afternoon must match before generic afternoon
  { pattern: /\b(late[_\s-]?afternoon)\b/i, slot: 'late_afternoon' },
  // 2. Afternoon
  { pattern: /\b(afternoon)\b/i, slot: 'afternoon' },
  // 3. Midday, Lunch, Solar Noon (strictly bounded word boundaries, never substring)
  { pattern: /\b(midday|lunch|solar[_\s-]?noon)\b/i, slot: 'midday' },
  { pattern: /^(noon)$/i, slot: 'midday' },
  // 4. Pre-bed before bed
  { pattern: /\b(pre[_\s-]?bed)\b/i, slot: 'pre_bed' },
  // 5. Bedtime / Sleep
  { pattern: /\b(bedtime|sleep|overnight|nightly)\b/i, slot: 'bedtime' },
  // 6. Wind down
  { pattern: /\b(wind[_\s-]?down)\b/i, slot: 'wind_down' },
  // 7. Pre / Post meal
  { pattern: /\b(pre[_\s-]?meal|pre[_\s-]?dinner)\b/i, slot: 'pre_meal' },
  { pattern: /\b(post[_\s-]?meal|postprandial|post[_\s-]?dinner)\b/i, slot: 'post_meal' },
  // 8. Evening / Dinner
  { pattern: /\b(evening|dinner|sunset|dusk)\b/i, slot: 'evening' },
  // 9. First meal / Breakfast
  { pattern: /\b(first[_\s-]?meal|breakfast|meal[_\s-]?1)\b/i, slot: 'first_meal' },
  // 10. Morning Routine
  { pattern: /\b(morning[_\s-]?routine)\b/i, slot: 'morning_routine' },
  // 11. Waking / Dawn
  { pattern: /\b(waking|early[_\s-]?dawn|sunrise|dawn)\b/i, slot: 'waking' },
  // 12. Generic Morning
  { pattern: /\b(morning|am[_\s-]?stack|fasted[_\s-]?am)\b/i, slot: 'morning' },
  // 13. Anytime
  { pattern: /\b(anytime|flexible|all[_\s-]?day)\b/i, slot: 'anytime' }
]

/**
 * Canonicalizes any timing slot, routine name, or natural language string into a validated CanonicalTimingSlot.
 * Guaranteed to be idempotent and free of false-positive substring collisions.
 */
export function canonicalizeTimingSlot(slot?: string | null): CanonicalTimingSlot {
  if (!slot) return 'anytime'
  
  const cleaned = slot.toLowerCase().trim().replace(/[\s-]+/g, '_')
  
  // Phase 1: Direct exact match in dictionary
  if (EXACT_SLOT_MAP[cleaned]) {
    return EXACT_SLOT_MAP[cleaned]
  }

  // Phase 2: Check raw slot trimmed
  const rawClean = slot.toLowerCase().trim()
  if (EXACT_SLOT_MAP[rawClean]) {
    return EXACT_SLOT_MAP[rawClean]
  }

  // Phase 3: Word-boundary regex patterns
  for (const { pattern, slot: matchedSlot } of WORD_BOUNDARY_PATTERNS) {
    if (pattern.test(slot)) {
      return matchedSlot
    }
  }

  return 'anytime'
}

/**
 * Returns the immutable chronological sequence index for any slot string (0 to 12, 99 for anytime).
 * Always guarantees that Midday (4) < Afternoon (5).
 */
export function getTimeBlockOrder(slot?: string | null): number {
  const canonical = canonicalizeTimingSlot(slot)
  return TIMING_SLOT_ORDER[canonical] ?? 50
}

/**
 * Compares two timing slots chronologically.
 * Returns negative if slotA comes before slotB, positive if after, 0 if equal.
 * Eliminates fragile alphabetical localeCompare fallbacks!
 */
export function compareTimingSlots(slotA: string, slotB: string): number {
  const orderA = getTimeBlockOrder(slotA)
  const orderB = getTimeBlockOrder(slotB)
  if (orderA !== orderB) {
    return orderA - orderB
  }
  // Deterministic stable tie-breaker based on canonical key name
  return canonicalizeTimingSlot(slotA).localeCompare(canonicalizeTimingSlot(slotB))
}

/**
 * Formats a slot key into a clean, human-readable display title (e.g. 'morning_routine' -> 'Morning Routine').
 */
export function formatSlotName(slot?: string | null): string {
  if (!slot) return 'Anytime'
  const canonical = canonicalizeTimingSlot(slot)
  if (canonical === 'anytime') return 'Anytime / Flexible'
  return canonical
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
