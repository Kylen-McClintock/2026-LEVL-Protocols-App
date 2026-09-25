import { Modality, DailyProtocolTask, UserProfile } from '@/lib/types'
import { getModalityMacroType, MODALITY_COLOR_THEMES, ModalityMacroType, getDaylightCategoryStyle } from '@/lib/utils/modalityColors'
import { canonicalizeTimingSlot } from '@/lib/utils/timingSlots'
import { getUserCircadianTimeWindows } from '@/lib/utils/circadianConfig'
import { LEVL_TOKENS } from '@/lib/theme/designTokens'

export type BlockWidth = '1/4' | '1/2' | 'full' | '1/3' | '2/3'
export type BlockHeight = '1x' | '2x'
export type BlocksVisualStyle = 'full-gradient' | 'dark-outline' | 'light-glass'

export interface BlockSizing {
  width: BlockWidth
  height: BlockHeight
}

const STORAGE_KEY_SIZING = 'levl_blocks_sizing_overrides'
const STORAGE_KEY_STYLE = 'levl_blocks_visual_style'
const STORAGE_KEY_DISPLAY_MODE = 'levl_display_mode'

import { format } from 'date-fns'

/**
 * Determines whether a time block is currently active or in the future for the specified date.
 * - Future dates: All time blocks are in the future -> returns true (OPEN).
 * - Past dates: All time blocks are in the past -> returns false (COLLAPSED).
 * - Today: Compares current local time against the end of the user's circadian/fasting window.
 */
export function isTimeBlockInFutureForDay(
  slotKey: string,
  dateStr?: string,
  userProfile?: UserProfile | null
): boolean {
  const now = new Date()
  const todayStr = format(now, 'yyyy-MM-dd')
  const targetDate = dateStr || todayStr

  // 1. Viewing a future date: all blocks are in the future -> OPEN
  if (targetDate > todayStr) return true
  // 2. Viewing a past date: none are in the future -> COLLAPSED
  if (targetDate < todayStr) return false

  // 3. Viewing today: check against user's dynamic circadian & fasting end hour!
  const currentHour = now.getHours() + now.getMinutes() / 60
  const windows = getUserCircadianTimeWindows(userProfile)
  const windowConfig = windows[slotKey.toLowerCase()]

  if (windowConfig) {
    if (slotKey.toLowerCase() === 'anytime') return true
    return currentHour < windowConfig.endHour
  }

  return true
}

/**
 * Resolves the currently active time slot key for a given date.
 * For today: checks current local time to pick the active window (e.g. morning, lunch, afternoon, dinner, bedtime).
 * For future dates: defaults to 'morning' so anytime items appear near the top.
 * For past dates: defaults to 'bedtime'.
 */
export function getCurrentTimeBlockSlotKey(dateStr?: string): string {
  const now = new Date()
  const todayStr = format(now, 'yyyy-MM-dd')
  const targetDate = dateStr || todayStr

  if (targetDate > todayStr) return 'morning'
  if (targetDate < todayStr) return 'bedtime'

  const currentHour = now.getHours() + now.getMinutes() / 60

  if (currentHour < 8.0) return 'waking'
  if (currentHour < 10.0) return 'morning'
  if (currentHour < 11.5) return 'breakfast'
  if (currentHour < 14.0) return 'lunch'
  if (currentHour < 17.5) return 'afternoon'
  if (currentHour < 20.5) return 'dinner'
  return 'bedtime'
}

/**
 * Simplifies clinical or verbose modality names into short, recognizable, punchy display labels.
 * Never reduces names to a meaningless generic word like "Activity".
 */
/**
 * Simplifies clinical or verbose modality names into short, recognizable, punchy display labels.
 * Preserves authentic modality names (e.g. Strength Training, High-Leucine Protein, Power Breath).
 * Never defaults to parent protocol name and strips author prefixes.
 */
export function getSimplifiedModalityName(modality?: Modality | null, taskOrFallback?: any): string {
  // 1. Identify base title strictly prioritizing:
  // - User explicit custom name override (if user renamed it)
  // - Modality canonical display_name
  // - Modality canonical name
  // - Task execution custom name
  // - Task step title
  // NEVER prioritize parent protocol name (e.g. "Peter Attia's Longevity Protocol") over the modality!
  let raw = ''
  if (typeof taskOrFallback === 'string') {
    raw = taskOrFallback
  } else {
    raw =
      taskOrFallback?.execution_details?.custom_name ||
      taskOrFallback?.custom_name ||
      modality?.display_name ||
      modality?.name ||
      taskOrFallback?.execution_details?.modality_name ||
      taskOrFallback?.protocol_step?.title ||
      taskOrFallback?.title ||
      ''
  }

  if (!raw && modality?.id) {
    raw = modality.id.replace(/[_-]/g, ' ')
  }

  if (!raw) return 'Protocol Task'

  // 2. Strip parent protocol author/provenance prefixes like:
  // "Peter Attia: ", "Peter Attia's ", "Dr. Peter Attia's ", "Dr. Matthew Walker's ", "Matthew Walker's ",
  // "Andrew Huberman's ", "Huberman: ", "Huberman's ", "Bryan Johnson's ", "David Sinclair's ", "Rhonda Patrick's ", "Blueprint: "
  raw = raw
    .replace(
      /^(Peter Attia|Dr\.?\s*Peter Attia|Dr\.?\s*Matthew Walker|Matthew Walker|Dr\.?\s*Andrew Huberman|Andrew Huberman|Huberman|Bryan Johnson|David Sinclair|Rhonda Patrick|Dr\.?\s*Rhonda Patrick|Blueprint)['’]?s?\s*[:\-–—]?\s*/i,
      ''
    )
    .trim()

  // 3. Strip clinical parentheticals like "(Cognitive & Cellular)", "(Søberg Principle)", "(10-Hour Rule)", "(Hyperventilation)"
  raw = raw.replace(/\s*\([^)]*\)/g, '').trim()

  // 4. Strip protocol numbering prefixes like "Protocol 6: ", "Step 1: ", "Session 2 - "
  raw = raw.replace(/^(Protocol|Step|Session|Phase|Rule)\s*\d+[\s:\-–—]+/i, '').trim()

  // 5. Strip verbose clinical colon subtitles if prefix is already substantial:
  // e.g. "Resistance Training: Hypertrophy & Neuromuscular" -> "Resistance Training"
  if (raw.includes(':')) {
    const parts = raw.split(':')
    if (/^(Protocol|Step|Phase|Session|Rule)\s*\d+$/i.test(parts[0].trim())) {
      raw = parts.slice(1).join(':').trim()
    } else if (parts[0].trim().length >= 6) {
      raw = parts[0].trim()
    }
  }

  // 5. Clean snake_case or kebab-case
  if (raw.includes('_') || (raw.includes('-') && !raw.includes(' '))) {
    raw = raw.replace(/[_-]/g, ' ')
  }

  // 6. Fix "simple strength" -> If it's literally just "Strength" or "Resistance", display "Strength Training"!
  const lower = raw.trim().toLowerCase()
  if (lower === 'strength' || lower === 'resistance') {
    return 'Strength Training'
  }

  // 7. Title-case properly while preserving established clinical acronyms
  const words = raw.trim().split(/\s+/)
  return words
    .map((w: string) => {
      const upper = w.toUpperCase()
      if (['SPF', 'VO2', 'NSDR', 'NMN', 'NAD', 'DEXA', 'CPET', 'CGM', 'EVOO', 'HIIT', 'HRV', '4X4'].includes(upper)) {
        return upper
      }
      return w.charAt(0).toUpperCase() + w.slice(1)
    })
    .join(' ')
}

/**
 * Classifies a modality or task into visual hierarchy tiers:
 * - 'anchor': Solitary massive diagnostics/focus blocks -> prefers full width
 * - 'hero': Major workouts, lifting, cardio, sauna, cold plunge, heavy sessions -> prefers 2/3 width
 * - 'compact': Supplements, vitamins, peptides, skincare, micro-habits -> prefers 1/3 width
 * - 'standard': Balanced habits, routines -> prefers 1/2 width
 */
export function getModalityVisualTier(
  modality?: Modality | null,
  taskOrInstructions?: any
): 'hero' | 'compact' | 'anchor' | 'standard' {
  const modName = (
    modality?.display_name ||
    modality?.name ||
    taskOrInstructions?.custom_name ||
    taskOrInstructions?.execution_details?.custom_name ||
    taskOrInstructions?.execution_details?.modality_name ||
    taskOrInstructions?.protocol_step?.title ||
    taskOrInstructions?.protocol_step?.modality_id ||
    taskOrInstructions?.title ||
    ''
  ).toLowerCase()
  const cat = (modality?.category || modality?.modality_type || '').toLowerCase()
  const desc = (modality?.brief_description || modality?.headline_benefit || '').toLowerCase()
  const combined = `${modName} ${cat} ${desc}`

  // 1. Solitary Anchors (Full width 12 cols)
  // Comprehensive biomarker protocols, full-body imaging, deep focus blocks, major diagnostics
  if (
    combined.includes('ultradian') ||
    combined.includes('focus block') ||
    combined.includes('deep work') ||
    combined.includes('cpet') ||
    combined.includes('dexa') ||
    combined.includes('apob') ||
    combined.includes('lipid risk') ||
    combined.includes('risk reduction') ||
    combined.includes('cardiovascular risk') ||
    combined.includes('cancer defense') ||
    combined.includes('whole-body mri') ||
    combined.includes('full-body mri') ||
    combined.includes('mri scan') ||
    combined.includes('epigenetic clock') ||
    combined.includes('blood panel') ||
    combined.includes('comprehensive blood') ||
    (combined.includes('protocol') && (combined.includes('reduction') || combined.includes('defense') || combined.includes('screening') || combined.includes('assessment')))
  ) {
    return 'anchor'
  }

  // 2. Compact items (1/3 width 4 cols)
  // Supplements, peptides, vitamins, skincare, lotions, creams, oils, quick micro-habits
  if (
    cat.includes('supplement') ||
    cat.includes('peptide') ||
    cat.includes('vitamin') ||
    cat.includes('skincare') ||
    cat.includes('skin') ||
    cat.includes('topical') ||
    combined.includes('vitamin') ||
    combined.includes('magnesium') ||
    combined.includes('omega') ||
    combined.includes('fish oil') ||
    combined.includes('creatine') ||
    combined.includes('serum') ||
    combined.includes('sunscreen') ||
    combined.includes('spf') ||
    combined.includes('collagen') ||
    combined.includes('urolithin') ||
    combined.includes('fisetin') ||
    combined.includes('nmn') ||
    combined.includes('nad') ||
    combined.includes('quercetin') ||
    combined.includes('berberine') ||
    combined.includes('ashwagandha') ||
    combined.includes('theanine') ||
    combined.includes('glycine') ||
    combined.includes('apigenin') ||
    combined.includes('melatonin') ||
    combined.includes('triad') ||
    combined.includes('sleep triad') ||
    combined.includes('tributyrin') ||
    combined.includes('butyrate') ||
    combined.includes('evoo') ||
    combined.includes('olive oil') ||
    combined.includes('oil') ||
    combined.includes('drops') ||
    combined.includes('capsule') ||
    combined.includes('tablet') ||
    combined.includes('powder') ||
    combined.includes('taurine') ||
    combined.includes('zinc') ||
    combined.includes('copper') ||
    combined.includes('electrolytes') ||
    combined.includes('ceramide') ||
    combined.includes('ectoin') ||
    combined.includes('barrier cream') ||
    combined.includes('cream') ||
    combined.includes('lotion') ||
    combined.includes('moisturizer') ||
    combined.includes('retinol') ||
    combined.includes('tretinoin') ||
    combined.includes('cleanser') ||
    combined.includes('eye cream')
  ) {
    return 'compact'
  }

  // 3. Hero items (2/3 width 8 cols)
  // Workouts, lifting, cardio, sauna, cold plunge, major physical sessions,
  // restorative breathwork, sleep environments, circadian light & thermal pillars
  if (
    cat.includes('exercise') ||
    cat.includes('fitness') ||
    cat.includes('workout') ||
    cat.includes('strength') ||
    cat.includes('cardio') ||
    cat.includes('movement') ||
    combined.includes('strength') ||
    combined.includes('resistance') ||
    combined.includes('lift') ||
    combined.includes('workout') ||
    combined.includes('vo2') ||
    combined.includes('zone 2') ||
    combined.includes('zone 5') ||
    combined.includes('hiit') ||
    combined.includes('sprint') ||
    combined.includes('sauna') ||
    combined.includes('cold plunge') ||
    combined.includes('cold immersion') ||
    combined.includes('ice bath') ||
    combined.includes('hyperbaric') ||
    combined.includes('hbot') ||
    combined.includes('pilates') ||
    combined.includes('calisthenics') ||
    combined.includes('rucking') ||
    combined.includes('running') ||
    combined.includes('cycling') ||
    combined.includes('swimming') ||
    combined.includes('red light') ||
    combined.includes('photobiomodulation') ||
    combined.includes('cryotherapy') ||
    combined.includes('breathwork') ||
    combined.includes('cyclic hyperventilation') ||
    combined.includes('hyperventilation') ||
    combined.includes('box breathing') ||
    combined.includes('wim hof') ||
    combined.includes('nsdr') ||
    combined.includes('yoga nidra') ||
    combined.includes('meditation') ||
    combined.includes('sleep rescue') ||
    combined.includes('melatonin onset') ||
    combined.includes('blue-light') ||
    combined.includes('blue light') ||
    combined.includes('thermal drop') ||
    combined.includes('pitch darkness') ||
    combined.includes('sleep environment')
  ) {
    return 'hero'
  }

  // 4. Standard items (1/2 width 6 cols)
  return 'standard'
}

/**
 * Intelligent default sizing:
 * - Hero items default to 2/3
 * - Compact items (supplements, skincare) default to 1/3
 * - Synergies and standard habits default to 1/2
 * - Solitary anchors default to full width
 */
export function getDefaultBlockSizing(
  modality?: Modality | null,
  isStack: boolean = false,
  taskOrInstructions?: any
): BlockSizing {
  if (isStack) {
    return { width: '1/2', height: '1x' }
  }

  const tier = getModalityVisualTier(modality, taskOrInstructions)
  if (tier === 'anchor') {
    return { width: 'full', height: '1x' }
  }
  if (tier === 'hero') {
    return { width: '2/3', height: '1x' }
  }
  if (tier === 'compact') {
    return { width: '1/3', height: '1x' }
  }
  return { width: '1/2', height: '1x' }
}

/**
 * Smart default chronological slot mapping for hotkeys.
 * ONLY assigns a hotkey to a slot if it is SUPER OBVIOUS.
 * Everything else remains strictly in the top bar / floating dock unless user manually assigns it.
 */
export function getSmartSlotForHotkey(hotkey: { id: string; category?: string; name?: string }): string | null {
  const id = (hotkey.id || '').toLowerCase()
  const name = (hotkey.name || '').toLowerCase()

  // 1. SUPER obvious Morning items:
  if (id.includes('coffee') || id.includes('caffeine') || name.includes('coffee') || name.includes('caffeine')) {
    return 'morning'
  }
  if (id.includes('outside_sunlight') || id.includes('morning_sunlight') || name.includes('sunlight')) {
    return 'morning'
  }

  // 2. SUPER obvious Evening items:
  if (id.includes('alcohol') || name.includes('alcohol') || id.includes('drink')) {
    return 'evening'
  }
  if (id.includes('chamomile') || name.includes('chamomile')) {
    return 'evening'
  }

  // 3. SUPER obvious Bedtime items:
  if (id.includes('magnesium') || name.includes('magnesium')) {
    return 'bedtime'
  }

  // Everything else: NOT super obvious -> return null!
  return null
}

export interface ContainerLayoutPacking {
  taskSizings: Record<string, BlockSizing>
  nutritionSizing: BlockSizing
  addBlockSizing: BlockSizing
  addBlockColSpan: number // 12 | 8 | 6 | 4
  hotkeySizings: Record<string, BlockSizing>
  orderedDisplayTasks: DailyProtocolTask[]
}

/**
 * Row-Filling Bin-Packing Engine:
 * Guarantees ZERO BLANK SPACES in any time block. Every row sums to exactly 12 columns.
 * Incomplete rows sit strictly at the bottom with the + Add button filling the remainder flush.
 * Generates an engaging visual rhythm:
 * - Hero (2/3 = 8) + Compact (1/3 = 4) = 12
 * - Compact Triads (4 + 4 + 4) = 12
 * - Synergistic & Balanced Pairs (6 + 6) = 12
 * - Solitary Anchors = 12
 * - Bottom Row Remainder + Add Button = 12
 */
export function harmonizeTimeBlockRowSizings(
  tasks: DailyProtocolTask[],
  modalitiesMap: Record<string, Modality | undefined>,
  slotHotkeys: { id: string }[],
  isMealSlot: boolean,
  savedOverrides: Record<string, BlockSizing> = {},
  synergiesMap: Record<string, { partnerId: string }> = {},
  hasStack: boolean = false,
  layoutMode: BlocksLayoutMode = 'dynamic',
  customOrder?: string[]
): ContainerLayoutPacking {
  const taskSizings: Record<string, BlockSizing> = {}
  const hotkeySizings: Record<string, BlockSizing> = {}
  let nutritionSizing: BlockSizing = { width: '1/2', height: '1x' }
  let addBlockSizing: BlockSizing = { width: 'full', height: '1x' }
  let addBlockColSpan = 12

  // 0. Sort tasks by customOrder if provided
  let inputTasks = [...tasks]
  if (customOrder && customOrder.length > 0) {
    const orderMap = new Map<string, number>()
    customOrder.forEach((id, idx) => orderMap.set(id.toLowerCase(), idx))
    inputTasks.sort((a, b) => {
      const aId = (a.modality_id || a.protocol_step?.modality_id || a.id).toLowerCase()
      const bId = (b.modality_id || b.protocol_step?.modality_id || b.id).toLowerCase()
      const aOrder = orderMap.has(a.id.toLowerCase()) ? orderMap.get(a.id.toLowerCase())! : (orderMap.has(aId) ? orderMap.get(aId)! : 999)
      const bOrder = orderMap.has(b.id.toLowerCase()) ? orderMap.get(b.id.toLowerCase())! : (orderMap.has(bId) ? orderMap.get(bId)! : 999)
      return aOrder - bOrder
    })
  }

  // UNIFORM SQUARES & BANNER MODES:
  // 2-wide squares (default), 3-wide squares (compact), or 1-wide banners (shorter)
  if (layoutMode === 'uniform' || layoutMode === '2-wide' || layoutMode === '3-wide' || layoutMode === '1-wide') {
    let totalCols = 0

    // Nutrition block if meal slot
    if (isMealSlot) {
      const nutWidth: BlockWidth = layoutMode === '1-wide' ? 'full' : layoutMode === '3-wide' ? '1/3' : '1/2'
      nutritionSizing = { width: nutWidth, height: '1x' }
      totalCols += (nutWidth === 'full' ? 12 : nutWidth === '1/3' ? 4 : 6)
    }

    // Stack if present
    if (hasStack) {
      const stackWidth: BlockWidth = layoutMode === '1-wide' ? 'full' : layoutMode === '3-wide' ? '1/3' : '1/2'
      totalCols += (stackWidth === 'full' ? 12 : stackWidth === '1/3' ? 4 : 6)
    }

    const defaultWidth: BlockWidth =
      layoutMode === '3-wide' ? '1/3' : layoutMode === '1-wide' ? 'full' : '1/2'

    const finalOrderedTasks: DailyProtocolTask[] = []
    inputTasks.forEach((t) => {
      const mId = t.modality_id || t.protocol_step?.modality_id || t.id
      const saved = savedOverrides[mId] || getSavedBlockSizing(mId, { width: defaultWidth, height: '1x' }, layoutMode)
      // Respect user's explicit saved override if present, otherwise default to mode's standard width
      const width = saved?.width || defaultWidth
      taskSizings[mId] = { width, height: '1x' }
      finalOrderedTasks.push(t)

      const cols = width === 'full' ? 12 : width === '1/3' ? 4 : 6
      totalCols += cols
    })

    // Hotkeys in uniform mode: strictly matched to layout mode grid
    let remainingSlotHotkeys = [...slotHotkeys]
    if (layoutMode === '1-wide') {
      remainingSlotHotkeys.forEach((hk) => {
        hotkeySizings[hk.id] = { width: 'full', height: '1x' }
        totalCols += 12
      })
    } else if (layoutMode === '3-wide') {
      remainingSlotHotkeys.forEach((hk) => {
        hotkeySizings[hk.id] = { width: '1/3', height: '1x' }
        totalCols += 4
      })
    } else {
      remainingSlotHotkeys.forEach((hk) => {
        hotkeySizings[hk.id] = { width: '1/2', height: '1x' }
        totalCols += 6
      })
    }

    // Compute exact remainder for the + Add button
    if (totalCols === 0 || totalCols % 12 === 0) {
      addBlockColSpan = 12
      addBlockSizing = { width: 'full', height: '1x' }
    } else {
      const remainder = 12 - (totalCols % 12)
      addBlockColSpan = remainder
      if (remainder === 6) {
        addBlockSizing = { width: '1/2', height: '1x' }
      } else if (remainder === 4) {
        addBlockSizing = { width: '1/3', height: '1x' }
      } else if (remainder === 8) {
        addBlockSizing = { width: '2/3', height: '1x' }
      } else {
        addBlockSizing = { width: '1/4', height: '1x' }
      }
    }

    return {
      taskSizings,
      nutritionSizing,
      addBlockSizing,
      addBlockColSpan,
      hotkeySizings,
      orderedDisplayTasks: finalOrderedTasks
    }
  }

  // DYNAMIC RHYTHM MODE (IMPORTANCE HIERARCHY):
  // 1. Identify user manual overrides
  inputTasks.forEach((t) => {
    const mId = t.modality_id || t.protocol_step?.modality_id || t.id
    const saved = savedOverrides[mId] || getSavedBlockSizing(mId, undefined as any, 'dynamic')
    if (saved) {
      taskSizings[mId] = saved
    }
  })

  const pairedIds = new Set<string>()
  const finalOrderedTasks: DailyProtocolTask[] = []

  // 2. Identify synergistic pairings
  const synergyPairs: [DailyProtocolTask, DailyProtocolTask][] = []
  inputTasks.forEach((t1) => {
    if (pairedIds.has(t1.id)) return
    const synergy = synergiesMap[t1.id]
    if (synergy) {
      const partnerTask = inputTasks.find((t2) => {
        if (t2.id === t1.id || pairedIds.has(t2.id)) return false
        const m2Id = t2.modality_id || t2.protocol_step?.modality_id || t2.id
        return m2Id === synergy.partnerId || t2.id === synergy.partnerId
      })
      if (partnerTask) {
        pairedIds.add(t1.id)
        pairedIds.add(partnerTask.id)
        synergyPairs.push([t1, partnerTask])
      }
    }
  })

  // 3. Classify remaining unpaired tasks into visual tiers
  const anchors: DailyProtocolTask[] = []
  const heroes: DailyProtocolTask[] = []
  const compacts: DailyProtocolTask[] = []
  const standards: DailyProtocolTask[] = []

  inputTasks.forEach((t) => {
    if (pairedIds.has(t.id)) return
    const mId = t.modality_id || t.protocol_step?.modality_id || t.id
    const mod = modalitiesMap[mId]
    const tier = getModalityVisualTier(mod, t)
    if (tier === 'anchor') anchors.push(t)
    else if (tier === 'hero') heroes.push(t)
    else if (tier === 'compact') compacts.push(t)
    else standards.push(t)
  })

  // 4. Handle Meal Slot / Nutrition Block & Condensed Supplement Stack (Row 1 Anchors)
  // If hasStack is true: Stack takes 6 cols (1/2).
  // If isMealSlot is true: Nutrition takes 6 cols (1/2) if paired, or 12 cols if solitary.
  let stackPartner: DailyProtocolTask | null = null
  let mealPartner: DailyProtocolTask | null = null

  if (isMealSlot && hasStack) {
    // Both present: Nutrition (6) + Stack (6) = 12 cols! Row 1 is completely full!
    nutritionSizing = { width: '1/2', height: '1x' }
  } else if (isMealSlot && !hasStack) {
    // Nutrition needs a 6-col partner
    if (standards.length > 0) {
      mealPartner = standards.shift()!
    } else if (compacts.length > 0) {
      mealPartner = compacts.shift()!
    } else if (heroes.length > 0) {
      mealPartner = heroes.shift()!
    }

    if (mealPartner) {
      pairedIds.add(mealPartner.id)
      const mId = mealPartner.modality_id || mealPartner.protocol_step?.modality_id || mealPartner.id
      if (!savedOverrides[mId]) taskSizings[mId] = { width: '1/2', height: '1x' }
      nutritionSizing = { width: '1/2', height: '1x' }
      finalOrderedTasks.push(mealPartner)
    } else {
      nutritionSizing = { width: 'full', height: '1x' }
    }
  } else if (!isMealSlot && hasStack) {
    // Stack needs a 6-col partner to complete Row 1
    if (standards.length > 0) {
      stackPartner = standards.shift()!
    } else if (compacts.length > 0) {
      stackPartner = compacts.shift()!
    } else if (heroes.length > 0) {
      stackPartner = heroes.shift()!
    }

    if (stackPartner) {
      pairedIds.add(stackPartner.id)
      const mId = stackPartner.modality_id || stackPartner.protocol_step?.modality_id || stackPartner.id
      if (!savedOverrides[mId]) taskSizings[mId] = { width: '1/2', height: '1x' }
      finalOrderedTasks.push(stackPartner)
    }
  }

  // 5. Complete 12-Column Synergies
  synergyPairs.forEach(([t1, t2]) => {
    const m1Id = t1.modality_id || t1.protocol_step?.modality_id || t1.id
    const m2Id = t2.modality_id || t2.protocol_step?.modality_id || t2.id
    const tier1 = getModalityVisualTier(modalitiesMap[m1Id], t1)
    const tier2 = getModalityVisualTier(modalitiesMap[m2Id], t2)

    if (tier1 === 'hero' && tier2 === 'compact') {
      if (!savedOverrides[m1Id]) taskSizings[m1Id] = { width: '2/3', height: '1x' }
      if (!savedOverrides[m2Id]) taskSizings[m2Id] = { width: '1/3', height: '1x' }
    } else if (tier1 === 'compact' && tier2 === 'hero') {
      if (!savedOverrides[m1Id]) taskSizings[m1Id] = { width: '1/3', height: '1x' }
      if (!savedOverrides[m2Id]) taskSizings[m2Id] = { width: '2/3', height: '1x' }
    } else {
      if (!savedOverrides[m1Id]) taskSizings[m1Id] = { width: '1/2', height: '1x' }
      if (!savedOverrides[m2Id]) taskSizings[m2Id] = { width: '1/2', height: '1x' }
    }
    finalOrderedTasks.push(t1, t2)
  })

  // 6. Complete 12-Column Anchors (Solitary full-width rows)
  anchors.forEach((a) => {
    const aId = a.modality_id || a.protocol_step?.modality_id || a.id
    if (!savedOverrides[aId]) taskSizings[aId] = { width: 'full', height: '1x' }
    pairedIds.add(a.id)
    finalOrderedTasks.push(a)
  })

  // 7. Pair Heroes (8 cols) with Compacts (4 cols) -> 8 + 4 = 12 cols!
  while (heroes.length > 0 && compacts.length > 0) {
    const hero = heroes.shift()!
    const compact = compacts.shift()!
    const hId = hero.modality_id || hero.protocol_step?.modality_id || hero.id
    const cId = compact.modality_id || compact.protocol_step?.modality_id || compact.id

    if (!savedOverrides[hId]) taskSizings[hId] = { width: '2/3', height: '1x' }
    if (!savedOverrides[cId]) taskSizings[cId] = { width: '1/3', height: '1x' }
    pairedIds.add(hero.id)
    pairedIds.add(compact.id)
    finalOrderedTasks.push(hero, compact)
  }

  // 8. Pack Compacts into Triads (4 + 4 + 4 = 12 cols!)
  while (compacts.length >= 3) {
    const c1 = compacts.shift()!
    const c2 = compacts.shift()!
    const c3 = compacts.shift()!
    const c1Id = c1.modality_id || c1.protocol_step?.modality_id || c1.id
    const c2Id = c2.modality_id || c2.protocol_step?.modality_id || c2.id
    const c3Id = c3.modality_id || c3.protocol_step?.modality_id || c3.id

    if (!savedOverrides[c1Id]) taskSizings[c1Id] = { width: '1/3', height: '1x' }
    if (!savedOverrides[c2Id]) taskSizings[c2Id] = { width: '1/3', height: '1x' }
    if (!savedOverrides[c3Id]) taskSizings[c3Id] = { width: '1/3', height: '1x' }
    pairedIds.add(c1.id)
    pairedIds.add(c2.id)
    pairedIds.add(c3.id)
    finalOrderedTasks.push(c1, c2, c3)
  }

  // 9. Pack Standards into Pairs (6 + 6 = 12 cols!)
  while (standards.length >= 2) {
    const s1 = standards.shift()!
    const s2 = standards.shift()!
    const s1Id = s1.modality_id || s1.protocol_step?.modality_id || s1.id
    const s2Id = s2.modality_id || s2.protocol_step?.modality_id || s2.id

    if (!savedOverrides[s1Id]) taskSizings[s1Id] = { width: '1/2', height: '1x' }
    if (!savedOverrides[s2Id]) taskSizings[s2Id] = { width: '1/2', height: '1x' }
    pairedIds.add(s1.id)
    pairedIds.add(s2.id)
    finalOrderedTasks.push(s1, s2)
  }

  // 10. Harmonize cross-tier leftovers into 12-column pairs if possible
  // If 2 heroes remain -> scale both to 6 + 6 = 12 cols!
  while (heroes.length >= 2) {
    const h1 = heroes.shift()!
    const h2 = heroes.shift()!
    const h1Id = h1.modality_id || h1.protocol_step?.modality_id || h1.id
    const h2Id = h2.modality_id || h2.protocol_step?.modality_id || h2.id
    if (!savedOverrides[h1Id]) taskSizings[h1Id] = { width: '1/2', height: '1x' }
    if (!savedOverrides[h2Id]) taskSizings[h2Id] = { width: '1/2', height: '1x' }
    pairedIds.add(h1.id)
    pairedIds.add(h2.id)
    finalOrderedTasks.push(h1, h2)
  }

  // If 1 hero and 1 standard remain -> scale both to 6 + 6 = 12 cols!
  if (heroes.length === 1 && standards.length === 1) {
    const h = heroes.shift()!
    const s = standards.shift()!
    const hId = h.modality_id || h.protocol_step?.modality_id || h.id
    const sId = s.modality_id || s.protocol_step?.modality_id || s.id
    if (!savedOverrides[hId]) taskSizings[hId] = { width: '1/2', height: '1x' }
    if (!savedOverrides[sId]) taskSizings[sId] = { width: '1/2', height: '1x' }
    pairedIds.add(h.id)
    pairedIds.add(s.id)
    finalOrderedTasks.push(h, s)
  }

  // If 1 standard and 2 compacts remain -> scale standard to 1/3: 4 + 4 + 4 = 12 cols!
  if (standards.length === 1 && compacts.length === 2) {
    const s = standards.shift()!
    const c1 = compacts.shift()!
    const c2 = compacts.shift()!
    const sId = s.modality_id || s.protocol_step?.modality_id || s.id
    const c1Id = c1.modality_id || c1.protocol_step?.modality_id || c1.id
    const c2Id = c2.modality_id || c2.protocol_step?.modality_id || c2.id
    if (!savedOverrides[sId]) taskSizings[sId] = { width: '1/3', height: '1x' }
    if (!savedOverrides[c1Id]) taskSizings[c1Id] = { width: '1/3', height: '1x' }
    if (!savedOverrides[c2Id]) taskSizings[c2Id] = { width: '1/3', height: '1x' }
    pairedIds.add(s.id)
    pairedIds.add(c1.id)
    pairedIds.add(c2.id)
    finalOrderedTasks.push(s, c1, c2)
  }

  // If 1 standard and 1 compact remain -> scale compact to 6 + 6 = 12 cols!
  if (standards.length === 1 && compacts.length === 1) {
    const s = standards.shift()!
    const c = compacts.shift()!
    const sId = s.modality_id || s.protocol_step?.modality_id || s.id
    const cId = c.modality_id || c.protocol_step?.modality_id || c.id
    if (!savedOverrides[sId]) taskSizings[sId] = { width: '1/2', height: '1x' }
    if (!savedOverrides[cId]) taskSizings[cId] = { width: '1/2', height: '1x' }
    pairedIds.add(s.id)
    pairedIds.add(c.id)
    finalOrderedTasks.push(s, c)
  }

  // 11. Co-Harmonize Leftover Tasks with Hotkeys into Exact 12-Column Rows
  let remainingSlotHotkeys = [...slotHotkeys]

  // If 2 compacts remain:
  if (compacts.length === 2) {
    const c1 = compacts.shift()!
    const c2 = compacts.shift()!
    const c1Id = c1.modality_id || c1.protocol_step?.modality_id || c1.id
    const c2Id = c2.modality_id || c2.protocol_step?.modality_id || c2.id

    if (remainingSlotHotkeys.length >= 1) {
      // Pair 2 compacts + 1 hotkey -> 4 + 4 + 4 = 12 cols! Complete triad!
      const hk = remainingSlotHotkeys.shift()!
      if (!savedOverrides[c1Id]) taskSizings[c1Id] = { width: '1/3', height: '1x' }
      if (!savedOverrides[c2Id]) taskSizings[c2Id] = { width: '1/3', height: '1x' }
      hotkeySizings[hk.id] = { width: '1/3', height: '1x' }
      pairedIds.add(c1.id)
      pairedIds.add(c2.id)
      finalOrderedTasks.push(c1, c2)
    } else {
      // No hotkeys: 4 + 4 = 8 cols, + Add button will take remaining 4 cols (4+4+4=12)!
      if (!savedOverrides[c1Id]) taskSizings[c1Id] = { width: '1/3', height: '1x' }
      if (!savedOverrides[c2Id]) taskSizings[c2Id] = { width: '1/3', height: '1x' }
      pairedIds.add(c1.id)
      pairedIds.add(c2.id)
      finalOrderedTasks.push(c1, c2)
    }
  }

  // If 1 compact remains:
  if (compacts.length === 1) {
    const c = compacts.shift()!
    const cId = c.modality_id || c.protocol_step?.modality_id || c.id

    if (remainingSlotHotkeys.length >= 2) {
      // 1 compact + 2 hotkeys -> 4 + 4 + 4 = 12 cols! Complete triad!
      const hk1 = remainingSlotHotkeys.shift()!
      const hk2 = remainingSlotHotkeys.shift()!
      if (!savedOverrides[cId]) taskSizings[cId] = { width: '1/3', height: '1x' }
      hotkeySizings[hk1.id] = { width: '1/3', height: '1x' }
      hotkeySizings[hk2.id] = { width: '1/3', height: '1x' }
      pairedIds.add(c.id)
      finalOrderedTasks.push(c)
    } else if (remainingSlotHotkeys.length === 1) {
      // 1 compact + 1 hotkey -> both at 4 cols (8 cols used), + Add button will take 4 cols (4+4+4=12)!
      const hk = remainingSlotHotkeys.shift()!
      if (!savedOverrides[cId]) taskSizings[cId] = { width: '1/3', height: '1x' }
      hotkeySizings[hk.id] = { width: '1/3', height: '1x' }
      pairedIds.add(c.id)
      finalOrderedTasks.push(c)
    } else {
      // 1 compact + 0 hotkeys: promote to 1/2 so it forms a balanced 6+6 row with the + Add button!
      if (!savedOverrides[cId]) taskSizings[cId] = { width: '1/2', height: '1x' }
      pairedIds.add(c.id)
      finalOrderedTasks.push(c)
    }
  }

  // If 1 hero remains:
  if (heroes.length === 1) {
    const h = heroes.shift()!
    const hId = h.modality_id || h.protocol_step?.modality_id || h.id

    if (remainingSlotHotkeys.length >= 1) {
      // 1 hero (8) + 1 hotkey (4) = 12 cols! Complete 2/3 + 1/3 row!
      const hk = remainingSlotHotkeys.shift()!
      if (!savedOverrides[hId]) taskSizings[hId] = { width: '2/3', height: '1x' }
      hotkeySizings[hk.id] = { width: '1/3', height: '1x' }
      pairedIds.add(h.id)
      finalOrderedTasks.push(h)
    } else {
      // 1 hero + 0 hotkeys: 8 cols used, + Add button takes remaining 4 cols (8+4=12)!
      if (!savedOverrides[hId]) taskSizings[hId] = { width: '2/3', height: '1x' }
      pairedIds.add(h.id)
      finalOrderedTasks.push(h)
    }
  }

  // If 1 standard remains:
  if (standards.length === 1) {
    const s = standards.shift()!
    const sId = s.modality_id || s.protocol_step?.modality_id || s.id

    if (remainingSlotHotkeys.length >= 1) {
      // In dynamic mode, hotkeys always remain 1/3 (4 cols). Standard promotes to 2/3 (8 cols) -> 8 + 4 = 12 cols!
      const hk = remainingSlotHotkeys.shift()!
      if (!savedOverrides[sId]) taskSizings[sId] = { width: '2/3', height: '1x' }
      hotkeySizings[hk.id] = { width: '1/3', height: '1x' }
      pairedIds.add(s.id)
      finalOrderedTasks.push(s)
    } else {
      // 1 standard + 0 hotkeys: 6 cols used, + Add button takes remaining 6 cols (6+6=12)!
      if (!savedOverrides[sId]) taskSizings[sId] = { width: '1/2', height: '1x' }
      pairedIds.add(s.id)
      finalOrderedTasks.push(s)
    }
  }

  // 12. Pack Any Remaining Standalone Hotkeys (Consistently 1/3 width in dynamic mode)
  while (remainingSlotHotkeys.length > 0) {
    const hk = remainingSlotHotkeys.shift()!
    hotkeySizings[hk.id] = { width: '1/3', height: '1x' }
  }

  // 13. Exact Cumulative DOM Column Flow & Flush + Add Button Remainder
  // If user provided a custom drag-and-drop order, honor inputTasks order directly.
  // Otherwise use finalOrderedTasks derived from dynamic visual hierarchy & synergies.
  const displayTasks = (customOrder && customOrder.length > 0) ? inputTasks : finalOrderedTasks

  // Ensure every task in inputTasks has a sizing in taskSizings (fallback to visual tier or 1/2)
  inputTasks.forEach((t) => {
    const mId = t.modality_id || t.protocol_step?.modality_id || t.id
    if (!taskSizings[mId]) {
      const mod = modalitiesMap[mId]
      const tier = getModalityVisualTier(mod, t)
      if (tier === 'anchor') taskSizings[mId] = { width: 'full', height: '1x' }
      else if (tier === 'compact') taskSizings[mId] = { width: '1/3', height: '1x' }
      else if (tier === 'hero') taskSizings[mId] = { width: '2/3', height: '1x' }
      else taskSizings[mId] = { width: '1/2', height: '1x' }
    }
  })

  // Simulates the exact physical columns rendered across the container to guarantee zero gaps
  let totalColsInDOM = 0
  if (isMealSlot) {
    totalColsInDOM += nutritionSizing.width === 'full' ? 12 : 6
  }
  if (hasStack) {
    totalColsInDOM += 6
  }
  displayTasks.forEach((t) => {
    const mId = t.modality_id || t.protocol_step?.modality_id || t.id
    const s = taskSizings[mId] || { width: '1/2', height: '1x' }
    const cols = s.width === 'full' ? 12 : s.width === '2/3' ? 8 : s.width === '1/3' ? 4 : s.width === '1/4' ? 3 : 6
    totalColsInDOM += cols
  })
  slotHotkeys.forEach((hk) => {
    const s = hotkeySizings[hk.id] || { width: '1/3', height: '1x' }
    const cols = s.width === 'full' ? 12 : s.width === '2/3' ? 8 : s.width === '1/3' ? 4 : s.width === '1/4' ? 3 : 6
    totalColsInDOM += cols
  })

  // Compute exact columns needed by the + Add button to make the bottom row flush
  const remainder = totalColsInDOM % 12 === 0 ? 12 : 12 - (totalColsInDOM % 12)
  addBlockColSpan = remainder
  if (remainder === 6) {
    addBlockSizing = { width: '1/2', height: '1x' }
  } else if (remainder === 4) {
    addBlockSizing = { width: '1/3', height: '1x' }
  } else if (remainder === 8) {
    addBlockSizing = { width: '2/3', height: '1x' }
  } else if (remainder === 12) {
    addBlockSizing = { width: 'full', height: '1x' }
  } else {
    addBlockSizing = { width: '1/4', height: '1x' }
  }
  // Solitary task in a container expands to full width
  if (displayTasks.length === 1 && !isMealSlot && !hasStack && slotHotkeys.length === 0) {
    const only = displayTasks[0]
    const onlyId = only.modality_id || only.protocol_step?.modality_id || only.id
    if (!savedOverrides[onlyId]) {
      taskSizings[onlyId] = { width: 'full', height: '1x' }
    }
  }

  // Ensure multi-key aliases are populated in taskSizings
  displayTasks.forEach((t) => {
    const mId = t.modality_id || t.protocol_step?.modality_id || t.id
    const s = taskSizings[mId]
    if (s) {
      if (t.id && !taskSizings[t.id]) taskSizings[t.id] = s
      if (t.protocol_step?.modality_id && !taskSizings[t.protocol_step.modality_id]) {
        taskSizings[t.protocol_step.modality_id] = s
      }
    }
  })

  return {
    taskSizings,
    nutritionSizing,
    addBlockSizing,
    addBlockColSpan,
    hotkeySizings,
    orderedDisplayTasks: displayTasks
  }
}

export type BlocksLayoutMode = 'dynamic' | '2-wide' | '3-wide' | '1-wide' | 'uniform'

const STORAGE_KEY_UNIFORM_SIZING = 'levl_blocks_uniform_sizing_overrides'
const STORAGE_KEY_LAYOUT_MODE = 'levl_blocks_layout_mode'
const STORAGE_KEY_SHOW_DOSING = 'levl_blocks_show_dosing'

/**
 * Extracts formatted clinical dosage, exposure, duration, or temperature for tile display.
 */
export function getModalityDoseDisplay(
  task?: DailyProtocolTask | null,
  modality?: Modality | null,
  benchItem?: any | null
): string | null {
  const raw =
    task?.execution_details?.custom_dose ||
    task?.custom_dose ||
    benchItem?.custom_dose ||
    task?.protocol_step?.dose_text ||
    modality?.dose_or_exposure ||
    ''
  if (!raw || !raw.trim()) return null
  const trimmed = raw.trim()
  const lower = trimmed.toLowerCase()
  if (lower === 'standard dose' || lower === 'as directed' || lower === 'standard') return null
  return trimmed
}

/**
 * Load user customized sizing overrides from localStorage per mode
 */
export function getSavedBlockSizing(
  modalityId: string,
  defaultSizing: BlockSizing,
  mode: BlocksLayoutMode = 'dynamic'
): BlockSizing {
  if (typeof window === 'undefined') return defaultSizing
  try {
    const key = mode === 'dynamic' ? STORAGE_KEY_SIZING : `${STORAGE_KEY_UNIFORM_SIZING}_${mode}`
    const raw =
      localStorage.getItem(key) ||
      (mode === 'uniform' || mode === '2-wide' ? localStorage.getItem(STORAGE_KEY_UNIFORM_SIZING) : null)
    if (!raw) return defaultSizing
    const map = JSON.parse(raw)
    if (map[modalityId]) {
      return map[modalityId]
    }
  } catch (e) {}
  return defaultSizing
}

/**
 * Save customized sizing override per mode and broadcast change event
 */
export function saveBlockSizing(
  modalityId: string,
  sizing: BlockSizing,
  mode: BlocksLayoutMode = 'dynamic'
): void {
  if (typeof window === 'undefined') return
  try {
    const key = mode === 'dynamic' ? STORAGE_KEY_SIZING : `${STORAGE_KEY_UNIFORM_SIZING}_${mode}`
    const raw = localStorage.getItem(key)
    const map = raw ? JSON.parse(raw) : {}
    map[modalityId] = sizing
    localStorage.setItem(key, JSON.stringify(map))
    if (mode === 'uniform' || mode === '2-wide') {
      localStorage.setItem(STORAGE_KEY_UNIFORM_SIZING, JSON.stringify(map))
    }

    window.dispatchEvent(
      new CustomEvent('levl_block_sizing_change', {
        detail: { modalityId, sizing, mode }
      })
    )
  } catch (e) {}
}

/**
 * Dynamic row auto-resizing engine on block drop:
 * When dropping a block into an area or beside another block:
 * - Beside a full-width (12-col) modality: auto-resizes both to 1/2 (6 + 6) or 2/3 + 1/3 to fit on the same row.
 * - Into a row with a 1/2 modality: auto-resizes incoming to 1/2 so both sit flush side-by-side.
 * - Into a row with two 1/3 modalities: auto-resizes incoming to 1/3 to complete the 3-wide row (4 + 4 + 4 = 12).
 * - Third block beside two 1/2 modalities in Uniform mode: all 3 adapt to 1/3 (3-wide squares).
 * - Into an area with bottom-row space: auto-resizes incoming to fill the remaining columns flush.
 */
export function reconcileRowSizingsOnDrop(params: {
  droppedId: string
  targetSlotKey: string
  targetTaskId?: string
  tasks: DailyProtocolTask[]
  layoutMode?: BlocksLayoutMode
  modalitiesMap?: Record<string, Modality | undefined>
}): void {
  const { droppedId, targetSlotKey, targetTaskId, tasks, layoutMode = 'dynamic', modalitiesMap = {} } = params
  if (typeof window === 'undefined') return

  const isSquareMode =
    layoutMode === 'uniform' ||
    layoutMode === '2-wide' ||
    layoutMode === '3-wide' ||
    layoutMode === '1-wide'

  const droppedTask = tasks.find((t) => t.id === droppedId || t.modality_id === droppedId)
  const droppedModId = droppedTask?.modality_id || droppedTask?.protocol_step?.modality_id || droppedId

  // Case 1: Dropped onto/beside a specific target task
  if (targetTaskId && targetTaskId !== droppedId && targetTaskId !== droppedModId) {
    const targetTask = tasks.find((t) => t.id === targetTaskId || t.modality_id === targetTaskId)
    const targetModId = targetTask?.modality_id || targetTask?.protocol_step?.modality_id || targetTaskId

    const targetSaved = getSavedBlockSizing(targetModId, { width: '1/2', height: '1x' }, layoutMode)
    const targetWidth = targetSaved?.width || '1/2'

    // If target was full-width (12 cols)
    if (targetWidth === 'full') {
      if (isSquareMode) {
        if (layoutMode === '3-wide') {
          saveBlockSizing(targetModId, { width: '1/3', height: '1x' }, layoutMode)
          saveBlockSizing(droppedModId, { width: '1/3', height: '1x' }, layoutMode)
        } else if (layoutMode === '1-wide') {
          saveBlockSizing(targetModId, { width: 'full', height: '1x' }, layoutMode)
          saveBlockSizing(droppedModId, { width: 'full', height: '1x' }, layoutMode)
        } else {
          // Uniform 2-wide squares: both become 1/2
          saveBlockSizing(targetModId, { width: '1/2', height: '1x' }, layoutMode)
          saveBlockSizing(droppedModId, { width: '1/2', height: '1x' }, layoutMode)
        }
      } else {
        // Dynamic mode: check visual tiers
        const droppedTier = getModalityVisualTier(modalitiesMap[droppedModId], droppedTask)
        const targetTier = getModalityVisualTier(modalitiesMap[targetModId], targetTask)

        if (targetTier === 'hero' && droppedTier === 'compact') {
          saveBlockSizing(targetModId, { width: '2/3', height: '1x' }, layoutMode)
          saveBlockSizing(droppedModId, { width: '1/3', height: '1x' }, layoutMode)
        } else if (droppedTier === 'hero' && targetTier === 'compact') {
          saveBlockSizing(targetModId, { width: '1/3', height: '1x' }, layoutMode)
          saveBlockSizing(droppedModId, { width: '2/3', height: '1x' }, layoutMode)
        } else {
          saveBlockSizing(targetModId, { width: '1/2', height: '1x' }, layoutMode)
          saveBlockSizing(droppedModId, { width: '1/2', height: '1x' }, layoutMode)
        }
      }
      return
    }

    // If target was 1/2 width (6 cols)
    if (targetWidth === '1/2') {
      const droppedSaved = getSavedBlockSizing(droppedModId, { width: '1/2', height: '1x' }, layoutMode)
      if (droppedSaved.width === 'full') {
        // Shrink full-width down to 1/2 so it fits beside the 1/2 card
        saveBlockSizing(droppedModId, { width: '1/2', height: '1x' }, layoutMode)
      } else if (isSquareMode) {
        // Check if there are already other tasks in this slot
        const slotTasks = tasks.filter((t) => {
          const rawSlot = t.timing_slot || t.protocol_step?.timing_slot || t.loose_modality?.default_timing_slot
          const s = canonicalizeTimingSlot(rawSlot)
          return s === targetSlotKey || rawSlot === targetSlotKey
        })
        if (layoutMode === '3-wide') {
          // If in 3-wide mode, adapt all 3 to 1/3 (3-wide squares)!
          saveBlockSizing(targetModId, { width: '1/3', height: '1x' }, layoutMode)
          saveBlockSizing(droppedModId, { width: '1/3', height: '1x' }, layoutMode)
          const companion = slotTasks.find((t) => {
            const mId = t.modality_id || t.protocol_step?.modality_id || t.id
            return mId !== targetModId && mId !== droppedModId
          })
          if (companion) {
            const cId = companion.modality_id || companion.protocol_step?.modality_id || companion.id
            saveBlockSizing(cId, { width: '1/3', height: '1x' }, layoutMode)
          }
          return
        }
      }
      saveBlockSizing(droppedModId, { width: '1/2', height: '1x' }, layoutMode)
      return
    }

    // If target was 1/3 width (4 cols)
    if (targetWidth === '1/3') {
      saveBlockSizing(droppedModId, { width: layoutMode === '3-wide' ? '1/3' : '1/2', height: '1x' }, layoutMode)
      return
    }
  }

  // Case 2: Dropped into targetSlotKey generally (check row remainder)
  const slotTasks = tasks.filter((t) => {
    const rawSlot = t.timing_slot || t.protocol_step?.timing_slot || t.loose_modality?.default_timing_slot
    const s = canonicalizeTimingSlot(rawSlot)
    return (s === targetSlotKey || rawSlot === targetSlotKey) && t.id !== droppedId && (t.modality_id || '') !== droppedModId
  })

  let totalCols = 0
  slotTasks.forEach((t) => {
    const mId = t.modality_id || t.protocol_step?.modality_id || t.id
    const sizing = getSavedBlockSizing(mId, { width: '1/2', height: '1x' }, layoutMode)
    const cols = sizing.width === 'full' ? 12 : sizing.width === '2/3' ? 8 : sizing.width === '1/3' ? 4 : 6
    totalCols += cols
  })

  const remainder = totalCols % 12
  if (remainder === 6) {
    // 6 columns remaining on bottom row -> adapt dropped task to 1/2 to fill row
    saveBlockSizing(droppedModId, { width: '1/2', height: '1x' }, layoutMode)
  } else if (remainder === 8) {
    // 4 columns remaining -> adapt to 1/3 only if in 3-wide mode, otherwise default to 1/2
    saveBlockSizing(droppedModId, { width: layoutMode === '3-wide' ? '1/3' : '1/2', height: '1x' }, layoutMode)
  } else if (remainder === 4) {
    // 8 columns remaining -> adapt to 2/3 (or 1/2 in square modes)
    saveBlockSizing(droppedModId, { width: isSquareMode ? '1/2' : '2/3', height: '1x' }, layoutMode)
  }
}

/**
 * Cycle through supported widths:
 * In uniform mode: 2-wide (1/2) -> sized down to 3-wide (1/3) -> sized up to full (full) -> 2-wide (1/2)
 * In dynamic mode: 1/4 -> 1/3 -> 1/2 -> 2/3 -> full -> 1/3
 */
export function getNextWidth(current: BlockWidth, mode: BlocksLayoutMode = 'dynamic'): BlockWidth {
  if (mode === 'uniform' || mode === '2-wide' || mode === '3-wide' || mode === '1-wide') {
    switch (current) {
      case '1/2': return '1/3'
      case '1/3': return 'full'
      case 'full': return '1/2'
      default: return '1/2'
    }
  }

  switch (current) {
    case '1/4': return '1/3'
    case '1/3': return '1/2'
    case '1/2': return '2/3'
    case '2/3': return 'full'
    case 'full': return '1/3'
    default: return '1/3'
  }
}

/**
 * Tailwind grid classes for each width and height.
 * On mobile:
 * - 2-wide: 2 squares across (col-span-6)
 * - 3-wide: 3 squares across (col-span-4)
 * - 1-wide: 1 shorter banner across (col-span-12)
 * On desktop:
 * - The number of squares scales dynamically with screen width (3 on sm, 4 on md, 6 on xl)!
 */
export function getGridClassesForSizing(
  sizing: BlockSizing,
  layoutMode: BlocksLayoutMode = 'dynamic'
): {
  colSpanClass: string
  heightClass: string
} {
  const isUniformSquare =
    layoutMode === 'uniform' ||
    layoutMode === '2-wide' ||
    layoutMode === '3-wide' ||
    layoutMode === '1-wide'

  if (layoutMode === '1-wide') {
    return {
      colSpanClass: 'col-span-12 md:col-span-6',
      heightClass: 'min-h-[64px] sm:min-h-[72px] h-[64px] sm:h-[72px]'
    }
  }

  if (layoutMode === '3-wide') {
    return {
      colSpanClass: 'col-span-4 sm:col-span-3 md:col-span-2',
      heightClass: 'aspect-square min-h-[105px] sm:min-h-[120px]'
    }
  }

  if (layoutMode === '2-wide' || layoutMode === 'uniform') {
    return {
      colSpanClass: 'col-span-6 sm:col-span-4 md:col-span-3 xl:col-span-2',
      heightClass: 'aspect-square min-h-[135px] sm:min-h-[155px]'
    }
  }

  // Dynamic mode: clinical visual hierarchy
  // Proportional 12-column spans on all devices so complementary pairs/triads sit flush side-by-side
  let colSpanClass = 'col-span-4'
  switch (sizing.width) {
    case '1/4':
      colSpanClass = 'col-span-3'
      break
    case '1/3':
      colSpanClass = 'col-span-4'
      break
    case '1/2':
      colSpanClass = 'col-span-6'
      break
    case '2/3':
      colSpanClass = 'col-span-8'
      break
    case 'full':
      colSpanClass = 'col-span-12'
      break
  }

  let heightClass = sizing.height === '2x' 
    ? 'min-h-[180px] sm:min-h-[220px]' 
    : 'min-h-[135px] sm:min-h-[150px]'

  return { colSpanClass, heightClass }
}

/**
 * Rich multi-stop vibrant gradients and dark ambient surfaces per modality macro-type.
 */
export const MODALITY_GRADIENTS: Record<ModalityMacroType, {
  fullGradient: string // vibrant multi-stop linear gradient for full-gradient mode
  darkGradient: string // sleek dark ambient surface gradient with radial glow
  borderGradient: string // high-contrast luminous multi-stop linear gradient for dark-outline border
  thickBorder: string  // high-saturation, high-opacity border color
  borderGlow: string   // amplified layered triple-drop neon atmospheric glow
}> = {
  supplements: {
    fullGradient: 'linear-gradient(135deg, #D97706 0%, #F59E0B 45%, #FBBF24 100%)',
    darkGradient: 'radial-gradient(circle at 12% 15%, rgba(245, 158, 11, 0.35) 0%, transparent 60%), linear-gradient(145deg, rgba(28, 20, 10, 0.95) 0%, rgba(14, 10, 6, 0.98) 100%)',
    borderGradient: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 40%, #FEF08A 75%, #F59E0B 100%)',
    thickBorder: 'rgba(245, 158, 11, 0.95)',
    borderGlow: '0 0 16px rgba(245, 158, 11, 0.70), 0 4px 30px rgba(245, 158, 11, 0.45), 0 12px 52px rgba(245, 158, 11, 0.25)'
  },
  peptides: {
    fullGradient: 'linear-gradient(135deg, #C026D3 0%, #E879F9 45%, #FB7185 100%)',
    darkGradient: 'radial-gradient(circle at 12% 15%, rgba(232, 121, 249, 0.35) 0%, transparent 60%), linear-gradient(145deg, rgba(32, 12, 35, 0.95) 0%, rgba(16, 7, 18, 0.98) 100%)',
    borderGradient: 'linear-gradient(135deg, #E879F9 0%, #F472B6 40%, #FCE7F3 75%, #D946EF 100%)',
    thickBorder: 'rgba(232, 121, 249, 0.95)',
    borderGlow: '0 0 16px rgba(232, 121, 249, 0.70), 0 4px 30px rgba(232, 121, 249, 0.45), 0 12px 52px rgba(232, 121, 249, 0.25)'
  },
  fitness: {
    fullGradient: 'linear-gradient(135deg, #E11D48 0%, #EF4444 48%, #FB7185 100%)',
    darkGradient: 'radial-gradient(circle at 12% 15%, rgba(239, 68, 68, 0.35) 0%, transparent 60%), linear-gradient(145deg, rgba(32, 10, 14, 0.95) 0%, rgba(16, 6, 8, 0.98) 100%)',
    borderGradient: 'linear-gradient(135deg, #EF4444 0%, #FB7185 40%, #FDA4AF 75%, #F43F5E 100%)',
    thickBorder: 'rgba(239, 68, 68, 0.95)',
    borderGlow: '0 0 16px rgba(239, 68, 68, 0.70), 0 4px 30px rgba(239, 68, 68, 0.45), 0 12px 52px rgba(239, 68, 68, 0.25)'
  },
  nutrition: {
    fullGradient: 'linear-gradient(135deg, #059669 0%, #05DF72 48%, #10E57A 100%)',
    darkGradient: 'radial-gradient(circle at 12% 15%, rgba(5, 223, 114, 0.35) 0%, transparent 60%), linear-gradient(145deg, rgba(6, 28, 18, 0.95) 0%, rgba(4, 15, 10, 0.98) 100%)',
    borderGradient: 'linear-gradient(135deg, #05DF72 0%, #10E57A 40%, #A7F3D0 75%, #05DF72 100%)',
    thickBorder: 'rgba(5, 223, 114, 0.95)',
    borderGlow: '0 0 16px rgba(5, 223, 114, 0.70), 0 4px 30px rgba(5, 223, 114, 0.45), 0 12px 52px rgba(5, 223, 114, 0.25)'
  },
  sleep: {
    fullGradient: 'linear-gradient(135deg, #7E22CE 0%, #A855F7 48%, #C084FC 100%)',
    darkGradient: 'radial-gradient(circle at 12% 15%, rgba(168, 85, 247, 0.35) 0%, transparent 60%), linear-gradient(145deg, rgba(28, 12, 42, 0.95) 0%, rgba(14, 6, 22, 0.98) 100%)',
    borderGradient: 'linear-gradient(135deg, #A855F7 0%, #C084FC 40%, #E9D5FF 75%, #9333EA 100%)',
    thickBorder: 'rgba(168, 85, 247, 0.95)',
    borderGlow: '0 0 16px rgba(168, 85, 247, 0.70), 0 4px 30px rgba(168, 85, 247, 0.45), 0 12px 52px rgba(168, 85, 247, 0.25)'
  },
  mind: {
    fullGradient: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 48%, #60A5FA 100%)',
    darkGradient: 'radial-gradient(circle at 12% 15%, rgba(59, 130, 246, 0.35) 0%, transparent 60%), linear-gradient(145deg, rgba(10, 20, 42, 0.95) 0%, rgba(6, 11, 24, 0.98) 100%)',
    borderGradient: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 40%, #BAE6FD 75%, #2563EB 100%)',
    thickBorder: 'rgba(59, 130, 246, 0.95)',
    borderGlow: '0 0 16px rgba(59, 130, 246, 0.70), 0 4px 30px rgba(59, 130, 246, 0.45), 0 12px 52px rgba(59, 130, 246, 0.25)'
  },
  thermal: {
    fullGradient: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 48%, #38BDF8 100%)',
    darkGradient: 'radial-gradient(circle at 12% 15%, rgba(6, 182, 212, 0.35) 0%, transparent 60%), linear-gradient(145deg, rgba(8, 25, 34, 0.95) 0%, rgba(5, 13, 18, 0.98) 100%)',
    borderGradient: 'linear-gradient(135deg, #06B6D4 0%, #22D3EE 40%, #CFFAFE 75%, #0891B2 100%)',
    thickBorder: 'rgba(6, 182, 212, 0.95)',
    borderGlow: '0 0 16px rgba(6, 182, 212, 0.70), 0 4px 30px rgba(6, 182, 212, 0.45), 0 12px 52px rgba(6, 182, 212, 0.25)'
  },
  diagnostics: {
    fullGradient: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 48%, #818CF8 100%)',
    darkGradient: 'radial-gradient(circle at 12% 15%, rgba(99, 102, 241, 0.35) 0%, transparent 60%), linear-gradient(145deg, rgba(16, 18, 42, 0.95) 0%, rgba(8, 9, 22, 0.98) 100%)',
    borderGradient: 'linear-gradient(135deg, #6366F1 0%, #818CF8 40%, #E0E7FF 75%, #4F46E5 100%)',
    thickBorder: 'rgba(99, 102, 241, 0.95)',
    borderGlow: '0 0 16px rgba(99, 102, 241, 0.70), 0 4px 30px rgba(99, 102, 241, 0.45), 0 12px 52px rgba(99, 102, 241, 0.25)'
  },
  other: {
    fullGradient: 'linear-gradient(135deg, #475569 0%, #64748B 50%, #94A3B8 100%)',
    darkGradient: 'radial-gradient(circle at 12% 15%, rgba(148, 163, 184, 0.28) 0%, transparent 60%), linear-gradient(145deg, rgba(20, 24, 34, 0.95) 0%, rgba(10, 13, 20, 0.98) 100%)',
    borderGradient: 'linear-gradient(135deg, #94A3B8 0%, #CBD5E1 50%, #E2E8F0 75%, #64748B 100%)',
    thickBorder: 'rgba(148, 163, 184, 0.95)',
    borderGlow: '0 0 16px rgba(148, 163, 184, 0.60), 0 4px 28px rgba(148, 163, 184, 0.35)'
  }
}

/**
 * Visual Style palette styling generator
 */
export function getBlockVisualStyles(
  modality: Modality | null | undefined,
  style: BlocksVisualStyle,
  isCompleted: boolean,
  isSnoozed: boolean,
  isSkipped: boolean,
  isIgnited: boolean = true
): {
  cardStyle: React.CSSProperties
  cardClassName: string
  iconColor: string
  textColor: string
  subtextColor: string
  borderColor: string
} {
  const macroType = getModalityMacroType(modality)
  const theme = MODALITY_COLOR_THEMES[macroType] || MODALITY_COLOR_THEMES.other
  const hex = theme.colorHex
  const grad = MODALITY_GRADIENTS[macroType] || MODALITY_GRADIENTS.other
  const darkGlassBg = 'rgba(10, 14, 23, 0.95)'

  const isLightMode = typeof document !== 'undefined' ? document.documentElement.classList.contains('light') : false

  // If completed, provide consistent soothing emerald/done glow
  if (isCompleted) {
    if (style === 'light-glass') {
      if (!isLightMode) {
        return {
          cardStyle: {
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1.5px solid rgba(52, 211, 153, 0.6)',
            boxShadow: '0 0 16px rgba(16, 185, 129, 0.3)'
          },
          cardClassName: 'backdrop-blur-md transition-all duration-300',
          iconColor: '#34D399',
          textColor: '#ECFDF5',
          subtextColor: '#A7F3D0',
          borderColor: 'rgba(52, 211, 153, 0.6)'
        }
      }
      return {
        cardStyle: {
          background: LEVL_TOKENS.light.card,
          border: `1.5px solid ${LEVL_TOKENS.light.accentEmerald}`,
          boxShadow: '0 2px 8px rgb(43 114 92 / 10%)'
        },
        cardClassName: 'transition-all duration-300',
        iconColor: LEVL_TOKENS.light.accentEmerald,
        textColor: LEVL_TOKENS.light.textPrimary,
        subtextColor: LEVL_TOKENS.light.textMuted,
        borderColor: LEVL_TOKENS.light.accentEmerald
      }
    }
    const emeraldGrad = 'linear-gradient(135deg, #05DF72 0%, #10E57A 45%, #6EE7B7 75%, #05DF72 100%)'
    return {
      cardStyle: {
        background: `linear-gradient(${darkGlassBg}, ${darkGlassBg}) padding-box, ${emeraldGrad} border-box`,
        border: '2.5px solid transparent',
        boxShadow: '0 0 16px rgba(16, 185, 129, 0.65), 0 4px 28px rgba(16, 185, 129, 0.40), 0 12px 48px rgba(16, 185, 129, 0.20)'
      },
      cardClassName: 'backdrop-blur-md transition-all duration-300',
      iconColor: '#34D399',
      textColor: '#ECFDF5',
      subtextColor: '#A7F3D0',
      borderColor: 'rgba(52, 211, 153, 0.7)'
    }
  }

  // If snoozed
  if (isSnoozed) {
    if (style === 'light-glass') {
      if (!isLightMode) {
        return {
          cardStyle: {
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1.5px solid rgba(245, 158, 11, 0.6)',
            boxShadow: '0 0 16px rgba(245, 158, 11, 0.3)'
          },
          cardClassName: 'backdrop-blur-md transition-all duration-300',
          iconColor: '#FBBF24',
          textColor: '#FEF3C7',
          subtextColor: '#FDE68A',
          borderColor: 'rgba(245, 158, 11, 0.6)'
        }
      }
      return {
        cardStyle: {
          background: '#ffffff',
          border: '1.5px solid #8a610e',
          boxShadow: '0 2px 6px rgb(138 97 14 / 8%)'
        },
        cardClassName: 'transition-all duration-300',
        iconColor: '#8a610e',
        textColor: '#44514d',
        subtextColor: '#6e7e78',
        borderColor: '#8a610e'
      }
    }
    const amberGrad = 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 50%, #FEF08A 100%)'
    return {
      cardStyle: {
        background: `linear-gradient(${darkGlassBg}, ${darkGlassBg}) padding-box, ${amberGrad} border-box`,
        border: '2.5px solid transparent',
        boxShadow: '0 0 16px rgba(245, 158, 11, 0.60), 0 4px 24px rgba(245, 158, 11, 0.35)'
      },
      cardClassName: 'backdrop-blur-md transition-all duration-300',
      iconColor: '#FBBF24',
      textColor: '#FEF3C7',
      subtextColor: '#FDE68A',
      borderColor: 'rgba(245, 158, 11, 0.65)'
    }
  }

  // If skipped
  if (isSkipped) {
    if (style === 'light-glass') {
      if (!isLightMode) {
        return {
          cardStyle: {
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(148, 163, 184, 0.25)',
            opacity: 0.55
          },
          cardClassName: 'backdrop-blur-sm transition-all duration-300 grayscale',
          iconColor: '#94A3B8',
          textColor: '#94A3B8',
          subtextColor: '#64748B',
          borderColor: 'rgba(148, 163, 184, 0.25)'
        }
      }
      return {
        cardStyle: {
          background: LEVL_TOKENS.light.card,
          border: `1px solid ${LEVL_TOKENS.light.border}`,
          opacity: 0.55
        },
        cardClassName: 'transition-all duration-300 grayscale',
        iconColor: LEVL_TOKENS.light.textMuted,
        textColor: LEVL_TOKENS.light.textMuted,
        subtextColor: LEVL_TOKENS.light.textSecondary,
        borderColor: LEVL_TOKENS.light.border
      }
    }
    return {
      cardStyle: {
        background: 'rgba(10, 14, 23, 0.65)',
        border: '2px solid rgba(148, 163, 184, 0.35)',
        opacity: 0.6
      },
      cardClassName: 'backdrop-blur-sm transition-all duration-300 grayscale',
      iconColor: '#94A3B8',
      textColor: '#94A3B8',
      subtextColor: '#64748B',
      borderColor: 'rgba(148, 163, 184, 0.35)'
    }
  }

  // Active / Pending states per style:
  if (style === 'full-gradient') {
    return {
      cardStyle: {
        background: grad.fullGradient,
        border: 'none',
        boxShadow: `0 8px 30px ${hex}35, 0 2px 6px rgba(0, 0, 0, 0.28)`
      },
      cardClassName: 'backdrop-blur-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]',
      iconColor: '#FFFFFF',
      textColor: '#FFFFFF',
      subtextColor: 'rgba(255, 255, 255, 0.92)',
      borderColor: 'rgba(255, 255, 255, 0.25)'
    }
  }

  if (style === 'light-glass') {
    if (!isLightMode) {
      // Sleek Dark Frosted Glass for Dark Theme
      return {
        cardStyle: {
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: isIgnited ? '0 8px 32px rgba(0, 0, 0, 0.45)' : '0 4px 16px rgba(0, 0, 0, 0.3)'
        },
        cardClassName: 'backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg',
        iconColor: isIgnited ? hex : '#94A3B8',
        textColor: '#FFFFFF',
        subtextColor: 'rgba(255, 255, 255, 0.75)',
        borderColor: 'rgba(255, 255, 255, 0.18)'
      }
    }
    const daylight = getDaylightCategoryStyle(modality)
    return {
      cardStyle: {
        background: LEVL_TOKENS.light.card,
        border: `1px solid ${LEVL_TOKENS.light.border}`,
        boxShadow: '0 2px 6px rgb(23 42 40 / 3%)'
      },
      cardClassName: 'transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] shadow-sm',
      iconColor: daylight.textHex,
      textColor: LEVL_TOKENS.light.textPrimary,
      subtextColor: LEVL_TOKENS.light.textSecondary,
      borderColor: LEVL_TOKENS.light.border
    }
  }

  // Default: 'dark-outline' (Strictly zero color infill, pure dark glass background + luminous multi-stop 2.5px gradient border + amplified glow)
  const borderGrad = isIgnited
    ? (grad.borderGradient || grad.fullGradient)
    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.32) 0%, rgba(255, 255, 255, 0.10) 100%)'

  return {
    cardStyle: {
      background: `linear-gradient(${darkGlassBg}, ${darkGlassBg}) padding-box, ${borderGrad} border-box`,
      border: '2.5px solid transparent',
      boxShadow: isIgnited ? grad.borderGlow : '0 2px 8px rgba(0,0,0,0.4)'
    },
    cardClassName: 'backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] shadow-md',
    iconColor: isIgnited ? hex : '#94A3B8',
    textColor: isIgnited ? '#F8FAFC' : '#CBD5E1',
    subtextColor: '#94A3B8',
    borderColor: isIgnited ? grad.thickBorder : 'rgba(255, 255, 255, 0.28)'
  }
}

/**
 * Storage helpers for Display Mode (Classic vs Blocks) and Visual Style
 */
export function getStoredDisplayMode(): 'classic' | 'blocks' {
  if (typeof window === 'undefined') return 'classic'
  try {
    const val = localStorage.getItem(STORAGE_KEY_DISPLAY_MODE)
    if (val === 'classic' || val === 'blocks') return val
  } catch (e) {}
  return 'classic'
}

export function setStoredDisplayMode(mode: 'classic' | 'blocks'): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY_DISPLAY_MODE, mode)
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('levl_display_mode_change', { detail: { mode } }))
    }, 0)
  } catch (e) {}
}

export function getStoredVisualStyle(): BlocksVisualStyle {
  if (typeof window === 'undefined') return 'full-gradient'
  try {
    const val = localStorage.getItem(STORAGE_KEY_STYLE) as BlocksVisualStyle
    if (val === 'full-gradient' || val === 'dark-outline' || val === 'light-glass') return val
  } catch (e) {}
  return 'full-gradient'
}

export function setStoredVisualStyle(style: BlocksVisualStyle): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY_STYLE, style)
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('levl_blocks_style_change', { detail: { style } }))
    }, 0)
  } catch (e) {}
}

export function getStoredBlocksLayoutMode(): BlocksLayoutMode {
  if (typeof window === 'undefined') return 'dynamic'
  try {
    const val = localStorage.getItem(STORAGE_KEY_LAYOUT_MODE)
    if (val === 'dynamic' || val === '2-wide' || val === '3-wide' || val === '1-wide' || val === 'uniform') return val
  } catch (e) {}
  return 'dynamic'
}

export function setStoredBlocksLayoutMode(mode: BlocksLayoutMode): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY_LAYOUT_MODE, mode)
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('levl_blocks_layout_mode_change', { detail: { mode } }))
    }, 0)
  } catch (e) {}
}

export function getStoredBlocksShowDosing(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const val = localStorage.getItem(STORAGE_KEY_SHOW_DOSING)
    if (val !== null) return val === 'true'
  } catch (e) {}
  return false
}

export function setStoredBlocksShowDosing(show: boolean): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY_SHOW_DOSING, String(show))
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('levl_blocks_show_dosing_change', { detail: { show } }))
    }, 0)
  } catch (e) {}
}

export function getStoredSlotTaskOrder(slotKey: string): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(`levl_slot_task_order_${slotKey}`)
    if (raw) return JSON.parse(raw)
  } catch (e) {}
  return []
}

export function saveStoredSlotTaskOrder(slotKey: string, order: string[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(`levl_slot_task_order_${slotKey}`, JSON.stringify(order))
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('levl_slot_order_change', { detail: { slotKey, order } }))
    }, 0)
  } catch (e) {}
}

export type BlocksCompletedPlacement = 'inline' | 'section'
const STORAGE_KEY_COMPLETED_PLACEMENT = 'levl_blocks_completed_placement'

export function getStoredBlocksCompletedPlacement(): BlocksCompletedPlacement {
  if (typeof window === 'undefined') return 'section'
  try {
    const val = localStorage.getItem(STORAGE_KEY_COMPLETED_PLACEMENT)
    if (val === 'inline' || val === 'section') return val
  } catch (e) {}
  return 'section'
}

export function setStoredBlocksCompletedPlacement(placement: BlocksCompletedPlacement): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY_COMPLETED_PLACEMENT, placement)
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent('levl_blocks_completed_placement_change', { detail: { placement } })
      )
    }, 0)
  } catch (e) {}
}


