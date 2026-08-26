import { subDays, format, parseISO } from 'date-fns'
import { supabase } from '../supabase/client'
import {
  UserProfile,
  Modality,
  Protocol,
  OutcomeDimension,
  UserBenchItem,
  DailySession,
  DailyWellbeingCheckin,
  DailyProtocolTask,
  ProtocolStep,
  UserModalityHabit
} from '../types'
import { resolveOptimalTimingSlot, resolveSlotFromTimingString, parseMultiDoseTimingSlots } from './resolveOptimalTiming'

// Persistent Catalog Cache Configuration (24 Hours TTL with SWR)
const CATALOG_CACHE_PREFIX = 'levl_cat_v1_'
const CATALOG_TTL_MS = 24 * 60 * 60 * 1000 // 24 Hours

let modalitiesCache: { data: Modality[]; timestamp: number } | null = null
let protocolsCache: { data: Protocol[]; timestamp: number } | null = null
let protocolsWithStepsCache: { data: any[]; timestamp: number } | null = null
let outcomeDimensionsCache: { data: OutcomeDimension[]; timestamp: number } | null = null

function getPersistentCache<T>(key: string, maxAgeMs = CATALOG_TTL_MS): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(`${CATALOG_CACHE_PREFIX}${key}`)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || !parsed.timestamp || !parsed.data) return null
    if (Date.now() - parsed.timestamp < maxAgeMs) {
      return parsed.data as T
    }
  } catch (e) {}
  return null
}

function setPersistentCache<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(
      `${CATALOG_CACHE_PREFIX}${key}`,
      JSON.stringify({ timestamp: Date.now(), data })
    )
  } catch (e) {}
}

export function clearCatalogCache() {
  if (typeof window !== 'undefined') {
    try {
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith(CATALOG_CACHE_PREFIX)) {
          localStorage.removeItem(k)
        }
      })
    } catch (e) {}
  }
  modalitiesCache = null
  protocolsCache = null
  protocolsWithStepsCache = null
  outcomeDimensionsCache = null
}

export function clearModalitiesCache() {
  clearCatalogCache()
}

import { BUILT_IN_TRAINING_PROTOCOLS } from './builtInTrainingProtocols'
import { BUILT_IN_PEPTIDE_PROTOCOLS, BUILT_IN_PEPTIDE_MODALITIES } from './builtInPeptideProtocols'

const ALL_BUILT_IN_PROTOCOLS = [...BUILT_IN_TRAINING_PROTOCOLS, ...BUILT_IN_PEPTIDE_PROTOCOLS]

function getBuiltInModalities(): Modality[] {
  const seen = new Set<string>()
  const mods: Modality[] = []

  // 1. Built-in peptide modalities list
  BUILT_IN_PEPTIDE_MODALITIES.forEach(m => {
    const key = (m.id || '').toLowerCase()
    if (key && !seen.has(key)) {
      seen.add(key)
      mods.push(m)
    }
  })

  // 2. Modalities from built-in protocols
  ALL_BUILT_IN_PROTOCOLS.forEach(p => {
    p.steps.forEach(s => {
      if (s.modality) {
        const key = (s.modality.id || '').toLowerCase()
        if (key && !seen.has(key)) {
          seen.add(key)
          mods.push(s.modality)
        }
      }
    })
  })
  return mods
}

function mergeBuiltInModalities(fetched: Modality[]): Modality[] {
  const seen = new Set<string>()
  const result: Modality[] = []
  const safeFetched = fetched || []

  // 1. Process fetched modalities (deduplicating)
  safeFetched.forEach(m => {
    const key = (m.id || '').toLowerCase()
    const slugKey = (m.slug || '').toLowerCase()
    if (key && !seen.has(key)) {
      seen.add(key)
      if (slugKey) seen.add(slugKey)
      result.push(m)
    }
  })

  // 2. Append built-ins that aren't already present
  getBuiltInModalities().forEach(m => {
    const key = (m.id || '').toLowerCase()
    const slugKey = (m.slug || '').toLowerCase()
    if (key && !seen.has(key) && (!slugKey || !seen.has(slugKey))) {
      seen.add(key)
      if (slugKey) seen.add(slugKey)
      result.push(m)
    }
  })

  return result
}

function mergeBuiltInProtocols(fetched: any[]): any[] {
  const safeFetched = fetched || []
  const cleanFetched = safeFetched.filter(p => 
    p.id !== 'test-protocol-123' && 
    p.id !== 'test_protocol' &&
    !p.name?.toLowerCase().includes('test protocol')
  )
  const existingMap = new Map<string, any>()
  cleanFetched.forEach(p => {
    if (p.id) existingMap.set(p.id.toLowerCase(), p)
    if (p.name) existingMap.set(p.name.toLowerCase(), p)
    if (p.slug) existingMap.set(p.slug.toLowerCase(), p)
  })

  const result: any[] = []
  const seenIds = new Set<string>()

  // Prefer rich built-in protocols for built-in IDs if fetched version has missing steps
  ALL_BUILT_IN_PROTOCOLS.forEach(builtIn => {
    const key = builtIn.id.toLowerCase()
    seenIds.add(key)
    const existing = existingMap.get(key) || existingMap.get((builtIn.name || '').toLowerCase())
    if (existing && existing.steps && existing.steps.length >= builtIn.steps.length) {
      result.push(existing)
    } else {
      result.push(builtIn)
    }
  })

  // Add any custom/other protocols from database
  cleanFetched.forEach(p => {
    const key = (p.id || '').toLowerCase()
    if (key && !seenIds.has(key)) {
      seenIds.add(key)
      result.push(p)
    }
  })

  return result
}

export async function getModalities(forceRefresh = false): Promise<Modality[]> {
  if (!supabase) return mergeBuiltInModalities([])
  const now = Date.now()

  // 1. In-memory cache check (fastest)
  if (!forceRefresh && modalitiesCache && (now - modalitiesCache.timestamp < 1000 * 60 * 5)) {
    return modalitiesCache.data
  }

  // 2. Persistent storage cache check (0ms load on refresh/navigation)
  if (!forceRefresh) {
    const persistent = getPersistentCache<Modality[]>('modalities')
    if (persistent && persistent.length > 0) {
      const merged = mergeBuiltInModalities(persistent)
      modalitiesCache = { data: merged, timestamp: now }
      return merged
    }
  }

  // 3. Network fetch
  const { data, error } = await supabase.from('modalities').select('*')
  if (error) {
    console.warn('Error fetching modalities:', error?.message || error)
    return mergeBuiltInModalities(modalitiesCache?.data || [])
  }
  const merged = mergeBuiltInModalities((data as Modality[]) || [])
  modalitiesCache = { data: merged, timestamp: now }
  setPersistentCache('modalities', merged)
  return merged
}

export async function getModalityById(id: string): Promise<Modality | null> {
  const all = await getModalities()
  return all.find(m => m.id === id || m.slug === id) || null
}

export async function getProtocols(forceRefresh = false): Promise<Protocol[]> {
  if (!supabase) return mergeBuiltInProtocols([])
  const now = Date.now()

  if (!forceRefresh && protocolsCache && (now - protocolsCache.timestamp < 1000 * 60 * 5)) {
    return protocolsCache.data
  }

  if (!forceRefresh) {
    const persistent = getPersistentCache<Protocol[]>('protocols')
    if (persistent && persistent.length > 0) {
      const merged = mergeBuiltInProtocols(persistent)
      protocolsCache = { data: merged, timestamp: now }
      return merged
    }
  }

  const { data, error } = await supabase.from('protocols').select('*')
  if (error) return mergeBuiltInProtocols(protocolsCache?.data || [])
  const merged = mergeBuiltInProtocols((data as Protocol[]) || [])
  protocolsCache = { data: merged, timestamp: now }
  setPersistentCache('protocols', merged)
  return merged
}

export async function getProtocolsWithSteps(forceRefresh = false): Promise<any[]> {
  if (!supabase) return mergeBuiltInProtocols([])
  const now = Date.now()

  if (!forceRefresh && protocolsWithStepsCache && (now - protocolsWithStepsCache.timestamp < 1000 * 60 * 5)) {
    return protocolsWithStepsCache.data
  }

  if (!forceRefresh) {
    const persistent = getPersistentCache<any[]>('protocols_with_steps')
    if (persistent && persistent.length > 0) {
      const merged = mergeBuiltInProtocols(persistent)
      protocolsWithStepsCache = { data: merged, timestamp: now }
      return merged
    }
  }

  const { data, error } = await supabase
    .from('protocols')
    .select('*, steps:protocol_steps(*, modality:modalities(*))')
  if (error) return mergeBuiltInProtocols(protocolsWithStepsCache?.data || [])
  const merged = mergeBuiltInProtocols(data || [])
  protocolsWithStepsCache = { data: merged, timestamp: now }
  setPersistentCache('protocols_with_steps', merged)
  return merged
}

export async function getProtocolByIdWithSteps(protocolId: string): Promise<any | null> {
  const all = await getProtocolsWithSteps()
  return all.find(p => p.id === protocolId || (p.name && p.name.toLowerCase() === protocolId.toLowerCase()) || (p.slug && p.slug.toLowerCase() === protocolId.toLowerCase())) || null
}

export async function getOutcomeDimensions(forceRefresh = false): Promise<OutcomeDimension[]> {
  if (!supabase) return []
  const now = Date.now()

  if (!forceRefresh && outcomeDimensionsCache && (now - outcomeDimensionsCache.timestamp < 1000 * 60 * 5)) {
    return outcomeDimensionsCache.data
  }

  if (!forceRefresh) {
    const persistent = getPersistentCache<OutcomeDimension[]>('outcome_dimensions')
    if (persistent && persistent.length > 0) {
      outcomeDimensionsCache = { data: persistent, timestamp: now }
      return persistent
    }
  }

  const { data, error } = await supabase.from('outcome_dimensions').select('*')
  if (error) return outcomeDimensionsCache?.data || []
  outcomeDimensionsCache = { data: data as OutcomeDimension[], timestamp: now }
  setPersistentCache('outcome_dimensions', data)
  return data as OutcomeDimension[]
}

export async function getCatalogMaps() {
  const [modalities, protocolsWithSteps] = await Promise.all([
    getModalities(),
    getProtocolsWithSteps()
  ])

  const modsMap = new Map<string, Modality>()
  modalities.forEach(m => {
    if (m.id) modsMap.set(m.id, m)
    if (m.slug) modsMap.set(m.slug, m)
  })

  const stepsMap = new Map<string, any>()
  const protocolsMap = new Map<string, Protocol>()

  protocolsWithSteps.forEach(p => {
    if (p.id) protocolsMap.set(p.id, p)
    if (p.slug) protocolsMap.set(p.slug, p)
    if (p.steps && Array.isArray(p.steps)) {
      p.steps.forEach((s: any) => {
        if (s.id) {
          const mod = s.modality || (s.modality_id ? modsMap.get(s.modality_id) : undefined)
          stepsMap.set(s.id, {
            ...s,
            protocol: p,
            modality: mod
          })
        }
      })
    }
  })

  return { modsMap, stepsMap, protocolsMap }
}

export async function getOrCreateUserProfile(localUserId: string): Promise<UserProfile | null> {
  let cached: UserProfile | null = null
  if (typeof window !== 'undefined' && localUserId) {
    try {
      const raw = localStorage.getItem(`levl_user_profile_${localUserId}`)
      if (raw) cached = JSON.parse(raw) as UserProfile
    } catch (e) {}
  }

  if (!supabase) return cached

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('local_user_id', localUserId)
      .maybeSingle()

    if (data) {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`levl_user_profile_${localUserId}`, JSON.stringify(data))
        } catch (e) {}
      }
      return data as UserProfile
    }

    if (error && error.code !== 'PGRST116') {
      console.warn('Notice fetching profile from Supabase:', error)
      return cached
    }

    // If cached profile exists locally, persist it to Supabase
    if (cached) {
      const { data: syncedProfile } = await supabase
        .from('user_profiles')
        .upsert({ ...cached, local_user_id: localUserId }, { onConflict: 'local_user_id' })
        .select()
        .maybeSingle()
      if (syncedProfile) return syncedProfile as UserProfile
      return cached
    }

    // Create a new profile (seeding hotkeys from active seed profile if available)
    let initialScores: any = null
    try {
      const { data: seedProf } = await supabase
        .from('user_profiles')
        .select('outcome_preference_scores')
        .eq('local_user_id', 'ae563aa5-59e7-4bfd-8107-d0347acec2ac')
        .maybeSingle()
      if (seedProf?.outcome_preference_scores) {
        initialScores = seedProf.outcome_preference_scores
      }
    } catch (e) {}

    const { data: newProfile, error: insertError } = await supabase
      .from('user_profiles')
      .insert([{ local_user_id: localUserId, outcome_preference_scores: initialScores }])
      .select()
      .maybeSingle()

    if (insertError) {
      console.warn('Notice creating initial profile in Supabase:', insertError)
      return cached
    }

    if (newProfile && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`levl_user_profile_${localUserId}`, JSON.stringify(newProfile))
      } catch (e) {}
    }

    return (newProfile as UserProfile) || cached
  } catch (err) {
    console.warn('Exception in getOrCreateUserProfile:', err)
    return cached
  }
}

export async function updateUserProfile(localUserId: string, updates: Partial<UserProfile>) {
  if (typeof window !== 'undefined' && localUserId) {
    try {
      const cacheKey = `levl_user_profile_${localUserId}`
      const existingRaw = localStorage.getItem(cacheKey)
      const existing = existingRaw ? JSON.parse(existingRaw) : {}
      const merged = { ...existing, ...updates, local_user_id: localUserId, updated_at: new Date().toISOString() }
      localStorage.setItem(cacheKey, JSON.stringify(merged))
    } catch (e) {}
  }

  if (!supabase) return null

  try {
    const payload = {
      local_user_id: localUserId,
      ...updates,
      updated_at: new Date().toISOString()
    }

    // 1. Try upserting by local_user_id
    const { data: upsertData, error: upsertError } = await supabase
      .from('user_profiles')
      .upsert(payload, { onConflict: 'local_user_id' })
      .select()
      .maybeSingle()

    if (!upsertError && upsertData) {
      return upsertData as UserProfile
    }

    // 2. Try update by id if localUserId is UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(localUserId)
    if (isUuid) {
      const { data: idData, error: idError } = await supabase
        .from('user_profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', localUserId)
        .select()
        .maybeSingle()

      if (!idError && idData) {
        return idData as UserProfile
      }
    }

    // 3. Fallback direct update
    const { data: directData } = await supabase
      .from('user_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('local_user_id', localUserId)
      .select()
      .maybeSingle()

    return (directData as UserProfile) || null
  } catch (err) {
    console.warn('Notice updating profile:', err)
    return null
  }
}

export async function getBenchItems(localUserId: string): Promise<UserBenchItem[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('user_bench_items')
    .select('*')
    .eq('local_user_id', localUserId)
    .not('modality_id', 'is', null)

  if (error || !data) return []
  const items = data as UserBenchItem[]
  const allMods = await getModalities()
  const modsMap = new Map(allMods.map(m => [m.id, m]))

  items.forEach(item => {
    if (item.modality_id && modsMap.has(item.modality_id)) {
      item.modality = modsMap.get(item.modality_id)
    }
  })

  return items
}

export async function getBenchProtocols(localUserId: string): Promise<any[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('user_bench_items')
    .select('*, protocol:protocols(*, steps:protocol_steps(*, modality:modalities(*)))')
    .eq('local_user_id', localUserId)
    .is('modality_id', null)
    .not('protocol_id', 'is', null)
    
  if (error) return []
  return data
}

export async function addToBench(localUserId: string, modalityId: string, protocolId?: string) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('user_bench_items')
    .insert([{ local_user_id: localUserId, modality_id: modalityId, protocol_id: protocolId }])
    .select()
    .single()

  if (error) {
    console.error('Error adding to bench:', error)
    return null
  }
  return data
}

export async function updateBenchItemStatus(id: string, status: string) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('user_bench_items')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) return null
  return data
}

export async function addProtocolToBench(localUserId: string, protocolId: string) {
  if (!supabase) return null
  const isProtocolUuid = protocolId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(protocolId)

  const protocolObj = await getProtocolByIdWithSteps(protocolId)
  let steps: any[] = protocolObj?.steps || protocolObj?.protocol_steps || []
  
  if (!steps || steps.length === 0) {
    const { data: dbSteps } = await supabase
      .from('protocol_steps')
      .select('*')
      .eq('protocol_id', protocolId)
    steps = dbSteps || []
  }

  // Ensure all needed modalities exist in modalities table
  const allNeededModalityIds = Array.from(new Set(steps.map(s => s.modality_id || s.modality?.id).filter(Boolean)))
  if (allNeededModalityIds.length > 0) {
    try {
      const { data: existingMods } = await supabase
        .from('modalities')
        .select('id')
        .in('id', allNeededModalityIds)

      const existingModIds = new Set((existingMods || []).map(m => m.id))
      const missingModIds = allNeededModalityIds.filter(id => !existingModIds.has(id))

      if (missingModIds.length > 0) {
        const placeholders = missingModIds.map(missingId => {
          const stepMatch = steps.find(s => (s.modality_id || s.modality?.id) === missingId)
          const stepMod = stepMatch?.modality || {}
          return {
            id: missingId,
            slug: stepMod.slug || missingId,
            name: stepMod.name || stepMod.display_name || missingId.replace(/_/g, ' '),
            display_name: stepMod.display_name || stepMod.name || missingId.replace(/_/g, ' '),
            category: stepMod.category || 'other',
            modality_type: stepMod.modality_type || 'lifestyle',
            status: 'active',
            brief_description: stepMod.brief_description || '',
            headline_benefit: stepMod.headline_benefit || '',
            primary_outcome: stepMod.primary_outcome || 'General Longevity',
            dose_or_exposure: stepMod.dose_or_exposure || '',
            timing_summary: stepMod.timing_summary || 'anytime'
          }
        })

        await supabase
          .from('modalities')
          .upsert(placeholders, { onConflict: 'id', ignoreDuplicates: true })
      }
    } catch (e) {
      console.warn('Modality sync check warning for bench:', e)
    }
  }
  
  const benchItems: any[] = steps.map(step => ({
    local_user_id: localUserId,
    modality_id: step.modality_id || step.modality?.id || null,
    protocol_id: isProtocolUuid ? protocolId : null
  })).filter(item => item.modality_id !== null)

  // Also add the protocol entry itself
  benchItems.push({
    local_user_id: localUserId,
    modality_id: null as any,
    protocol_id: isProtocolUuid ? protocolId : null
  })
  
  const { data, error } = await supabase
    .from('user_bench_items')
    .insert(benchItems)
    .select()
    
  if (error) {
    console.error('Error adding protocol to bench:', error)
    return null
  }
  return data
}

export async function removeFromBench(localUserId: string, modalityId: string) {
  if (!supabase) return null
  const { error } = await supabase
    .from('user_bench_items')
    .delete()
    .eq('local_user_id', localUserId)
    .eq('modality_id', modalityId)

  if (error) {
    console.error('Error removing from bench:', error)
    return false
  }
  return true
}

export async function removeModalityEntirely(localUserId: string, modalityId: string) {
  if (!supabase) return false
  
  const today = new Date().toISOString().split('T')[0]

  // Remove from bench
  await supabase
    .from('user_bench_items')
    .delete()
    .eq('local_user_id', localUserId)
    .eq('modality_id', modalityId)

  // Remove from future daily tasks
  await supabase
    .from('daily_protocol_tasks')
    .delete()
    .eq('local_user_id', localUserId)
    .eq('modality_id', modalityId)
    .gte('scheduled_date', today)

  return true
}


function hydrateTasksInMemory(
  rawTasks: any[],
  modsMap: Map<string, Modality>,
  stepsMap: Map<string, any>,
  protocolsMap: Map<string, Protocol>,
  benchMap: Map<string, { status: string; personal_notes?: string; custom_dose?: string; custom_timing?: string; notes?: string }>
): DailyProtocolTask[] {
  return rawTasks.map(task => {
    const t: any = { ...task }
    const mId = t.modality_id || t.protocol_step?.modality_id

    // Attach protocol_step if present
    if (t.protocol_step_id && stepsMap.has(t.protocol_step_id)) {
      t.protocol_step = stepsMap.get(t.protocol_step_id)
    }

    // Attach loose modality if present (prioritizing step modality)
    const resolvedModId = t.protocol_step?.modality_id || t.modality_id
    if (!t.loose_modality && resolvedModId && modsMap.has(resolvedModId)) {
      t.loose_modality = modsMap.get(resolvedModId)
    }

    // If protocol_step is still missing, infer from stepsMap matching modality_id
    if (!t.protocol_step && resolvedModId) {
      for (const step of Array.from(stepsMap.values())) {
        if (step.modality_id === resolvedModId || step.modality?.id === resolvedModId) {
          t.protocol_step = step
          break
        }
      }
    }

    // Ensure lineages are always populated if protocol is identified
    if ((!t.lineages || t.lineages.length === 0) && t.protocol_step?.protocol) {
      t.lineages = [{
        protocol_id: t.protocol_step.protocol.id,
        protocol_name: t.protocol_step.protocol.name,
        color_hex: (t.protocol_step.protocol as any).color_hex || '#A855F7'
      }]
    }

    // Apply bench status override if pending and merge custom personalization
    if (resolvedModId && benchMap.has(resolvedModId)) {
      const bInfo = benchMap.get(resolvedModId)!
      if (bInfo.status === 'eliminated' && t.status === 'pending') {
        t.status = 'contraindicated'
        t.status_reason = bInfo.personal_notes || 'Eliminated modality'
      } else if ((bInfo.status === 'benched' || bInfo.status === 'inactive') && t.status === 'pending') {
        t.status = 'skipped'
        t.status_reason = 'Moved to Bench'
      }

      // Merge custom_dose & custom_timing from benchItem if task does not have its own overrides
      if (bInfo.custom_dose || bInfo.custom_timing || bInfo.notes) {
        t.execution_details = {
          ...(t.execution_details || {}),
          custom_dose: t.execution_details?.custom_dose || bInfo.custom_dose,
          custom_timing: t.execution_details?.custom_timing || bInfo.custom_timing,
          notes: t.execution_details?.notes || bInfo.notes
        }
      }
    }

    // Resolve optimal timing slot with custom timing priority
    const resolvedMod = t.protocol_step?.modality || t.loose_modality || (resolvedModId && modsMap.get(resolvedModId))
    const effectiveCustomTiming = t.execution_details?.custom_timing || (resolvedModId && benchMap.get(resolvedModId)?.custom_timing)
    t.timing_slot = resolveOptimalTimingSlot(resolvedMod, t.protocol_step, t.timing_slot, null, effectiveCustomTiming)

    // Ensure schedule_config is populated with intelligent defaults if not already present
    if (!t.execution_details?.schedule_config) {
      const autoSched = deriveAutomaticScheduleConfig(resolvedMod, t.protocol_step, t)
      t.execution_details = {
        ...(t.execution_details || {}),
        schedule_config: autoSched
      }
    }

    return t as DailyProtocolTask
  })
}

export async function getDailyProtocolTasks(localUserId: string, date: string): Promise<DailyProtocolTask[]> {
  if (!supabase) return []

  const [{ modsMap, stepsMap, protocolsMap }, { data: benchData }, { data: rawTasks, error }] = await Promise.all([
    getCatalogMaps(),
    supabase
      .from('user_bench_items')
      .select('modality_id, status, personal_notes, custom_dose, custom_timing, notes')
      .eq('local_user_id', localUserId),
    supabase
      .from('daily_protocol_tasks')
      .select('id, local_user_id, scheduled_date, modality_id, protocol_step_id, user_protocol_instance_id, status, timing_slot, completed_at, status_reason, execution_details, execution_metrics, scheduled_time, created_at, updated_at')
      .eq('local_user_id', localUserId)
      .eq('scheduled_date', date)
  ])

  if (error) {
    console.warn('Error fetching daily tasks:', error?.message || error)
    return []
  }

  const benchMap = new Map<string, { status: string; personal_notes?: string; custom_dose?: string; custom_timing?: string; notes?: string }>()
  if (benchData) {
    benchData.forEach((b: any) => {
      if (b.modality_id) benchMap.set(b.modality_id, b)
    })
  }

  return hydrateTasksInMemory(rawTasks || [], modsMap, stepsMap, protocolsMap, benchMap)
}

export async function getMultiDayProtocolTasks(
  localUserId: string,
  startDate: string,
  endDate: string
): Promise<Record<string, DailyProtocolTask[]>> {
  if (!supabase) return {}

  const [{ modsMap, stepsMap, protocolsMap }, { data: benchData }, { data: rawTasks, error }] = await Promise.all([
    getCatalogMaps(),
    supabase
      .from('user_bench_items')
      .select('modality_id, status, personal_notes, custom_dose, custom_timing, notes')
      .eq('local_user_id', localUserId),
    supabase
      .from('daily_protocol_tasks')
      .select('id, local_user_id, scheduled_date, modality_id, protocol_step_id, user_protocol_instance_id, status, timing_slot, completed_at, status_reason, execution_details, execution_metrics, scheduled_time, created_at, updated_at')
      .eq('local_user_id', localUserId)
      .gte('scheduled_date', startDate)
      .lte('scheduled_date', endDate)
      .limit(10000)
  ])

  if (error) {
    console.warn('Error fetching multi-day tasks:', error?.message || error)
    return {}
  }

  const benchMap = new Map<string, { status: string; personal_notes?: string; custom_dose?: string; custom_timing?: string; notes?: string }>()
  if (benchData) {
    benchData.forEach((b: any) => {
      if (b.modality_id) benchMap.set(b.modality_id, b)
    })
  }

  const hydrated = hydrateTasksInMemory(rawTasks || [], modsMap, stepsMap, protocolsMap, benchMap)
  const map: Record<string, DailyProtocolTask[]> = {}

  hydrated.forEach(task => {
    const dStr = task.scheduled_date
    if (dStr) {
      if (!map[dStr]) map[dStr] = []
      map[dStr].push(task)
    }
  })

  return map
}

export async function getProtocolTasksHistory(localUserId: string, startDate: string, endDate: string): Promise<DailyProtocolTask[]> {
  if (!supabase) return []

  const [{ modsMap, stepsMap, protocolsMap }, { data: benchData }, { data: rawTasks, error }] = await Promise.all([
    getCatalogMaps(),
    supabase
      .from('user_bench_items')
      .select('modality_id, status, personal_notes, custom_dose, custom_timing, notes')
      .eq('local_user_id', localUserId),
    supabase
      .from('daily_protocol_tasks')
      .select('id, local_user_id, scheduled_date, modality_id, protocol_step_id, user_protocol_instance_id, status, timing_slot, completed_at, status_reason, execution_details, execution_metrics, scheduled_time, created_at, updated_at')
      .eq('local_user_id', localUserId)
      .gte('scheduled_date', startDate)
      .lte('scheduled_date', endDate)
      .limit(10000)
  ])

  if (error) {
    console.warn('Error fetching protocol tasks history:', error?.message || error)
    return []
  }

  const benchMap = new Map<string, { status: string; personal_notes?: string; custom_dose?: string; custom_timing?: string; notes?: string }>()
  if (benchData) {
    benchData.forEach((b: any) => {
      if (b.modality_id) benchMap.set(b.modality_id, b)
    })
  }

  return hydrateTasksInMemory(rawTasks || [], modsMap, stepsMap, protocolsMap, benchMap)
}

export async function processSnoozedTasksRollover(localUserId: string, currentDateStr: string): Promise<DailyProtocolTask[]> {
  if (!supabase) return []
  
  try {
    const [y, m, d] = currentDateStr.split('-').map(Number)
    const currentDateObj = (y && m && d) ? new Date(y, m - 1, d, 12, 0, 0) : new Date()
    const yesterdayStr = format(subDays(currentDateObj, 1), 'yyyy-MM-dd')

    // Fetch yesterday's tasks
    const yesterdayTasks = await getDailyProtocolTasks(localUserId, yesterdayStr)
    if (!yesterdayTasks || yesterdayTasks.length === 0) return []

    // Filter for snoozed or pending (uncompleted) tasks yesterday
    const unfinishedYesterday = yesterdayTasks.filter(t => t.status === 'snoozed' || t.status === 'pending')
    if (unfinishedYesterday.length === 0) return []

    // Fetch today's existing tasks
    const todayTasks = await getDailyProtocolTasks(localUserId, currentDateStr)
    const todayModalityIds = new Set(
      todayTasks.map(t => t.modality_id || t.protocol_step?.modality_id || t.loose_modality?.id).filter(Boolean)
    )

    const rolledOverTasks: DailyProtocolTask[] = []

    for (const task of unfinishedYesterday) {
      const mod = task.protocol_step?.modality || task.loose_modality
      const modId = task.modality_id || mod?.id
      if (!modId) continue

      // Check if non-daily modality
      const cadence = mod?.cadence_layer || 'daily'
      const freq = (mod?.frequency || '').toLowerCase()
      const pattern = (mod?.schedule_pattern || '').toLowerCase()
      const cat = (mod?.category || '').toLowerCase()
      const name = (mod?.name || '').toLowerCase()

      const isStrictlyDaily = (cadence === 'daily' || freq.includes('daily') || pattern === 'daily_fasting') &&
                              !cat.includes('fitness') && !cat.includes('physical') && !cat.includes('thermal') &&
                              !name.includes('workout') && !name.includes('sauna') && !name.includes('plunge') &&
                              !name.includes('extended') && !name.includes('dexa')

      // Roll over NON-DAILY modalities (workouts, sauna, cold plunge, extended fasts, DEXA, etc.)
      if (!isStrictlyDaily) {
        // DEDUPLICATION: Do not double-up if already present today!
        if (!todayModalityIds.has(modId)) {
          todayModalityIds.add(modId) // Prevent duplicate insertion in same loop
          const timingSlot = task.timing_slot || 'anytime'
          const created = await createDailyTask(localUserId, currentDateStr, modId, timingSlot)
          if (created && created.length > 0) {
            rolledOverTasks.push(...created)
          }
        }
      }
    }

    return rolledOverTasks
  } catch (err) {
    console.error('Error rolling over snoozed tasks:', err)
    return []
  }
}

export async function createDailyTask(localUserId: string, date: string, modalityId: string, archetype?: string) {
  if (!supabase) return null

  // 1. Fetch and resolve the modality object reliably (DB + in-memory cache + built-in library)
  let modality: any = null
  const isModalityUuid = modalityId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(modalityId)

  if (isModalityUuid) {
    const { data } = await supabase.from('modalities').select('*').eq('id', modalityId).maybeSingle()
    modality = data
  }

  if (!modality) {
    modality = await getModalityById(modalityId)
  }

  if (!modality) {
    const allMods = await getModalities()
    const cleanLower = modalityId.toLowerCase().replace(/_/g, ' ')
    modality = allMods.find(m => 
      m.id === modalityId || 
      m.slug === modalityId || 
      m.name.toLowerCase() === cleanLower ||
      (m.display_name && m.display_name.toLowerCase() === cleanLower) ||
      m.name.toLowerCase().includes(cleanLower) ||
      cleanLower.includes(m.name.toLowerCase())
    )
  }

  let effectiveModalityId = modality?.id || modalityId

  // If the modality exists in built-in presets but is not in Supabase yet, upsert it so foreign keys pass
  if (modality && !isModalityUuid) {
    try {
      const { data: existingMod } = await supabase
        .from('modalities')
        .select('id')
        .or(`id.eq.${modality.id},name.ilike.${modality.name}`)
        .maybeSingle()

      if (existingMod?.id) {
        effectiveModalityId = existingMod.id
      } else {
        const { data: insertedMod } = await supabase
          .from('modalities')
          .insert({
            name: modality.name,
            display_name: modality.display_name || modality.name,
            category: modality.category || 'Supplements',
            headline_benefit: modality.headline_benefit || 'Healthspan optimization',
            biological_mechanism: modality.biological_mechanism || '',
            evidence_quality: modality.evidence_quality || 4,
            overall_longevity_benefit: modality.overall_longevity_benefit || 4,
            default_timing: modality.default_timing || 'Morning'
          })
          .select()
          .single()

        if (insertedMod?.id) {
          effectiveModalityId = insertedMod.id
        }
      }
    } catch (err) {
      console.warn('Could not sync built-in modality to remote DB, using effective ID:', err)
    }
  }

  let timing_slot = resolveOptimalTimingSlot(modality, null, archetype || 'anytime')
  if (modality) {
    const isSupplement = modality.category?.toLowerCase().includes('supplement') || 
                         modality.modality_type?.toLowerCase() === 'supplement'
    if (isSupplement && (timing_slot === 'morning' || timing_slot === 'anytime')) {
      timing_slot = 'morning_supplement_stack'
    } else if (isSupplement && timing_slot === 'evening') {
      timing_slot = 'evening_supplement_stack'
    }
  }

  // Create tasks for the next 30 days based on cadence
  const modalityName = modality?.name?.toLowerCase() || ''
  const freqText = modality?.frequency?.toLowerCase() || ''
  const pattern = modality?.schedule_pattern?.toLowerCase() || freqText || modalityName || ''
  const cadence = modality?.cadence_layer || 'daily'
  
  let stepDays = modality?.cadence_interval_days || 1
  
  if (!modality?.cadence_interval_days) {
    const isPulse = pattern.includes('pulse') || pattern.includes('cycled') || pattern.includes('senolytic') || pattern.includes('fisetin') || pattern.includes('dasatinib') || pattern.includes('quercetin')
    if (pattern.includes('monthly') || cadence === 'monthly' || isPulse) stepDays = 30
    else if ((pattern.includes('weekly') && !pattern.match(/\d+-\d+x\s*weekly/)) || cadence === 'infrequent' || pattern.includes('1x_week')) stepDays = 7
    else if (pattern.includes('every_other_day')) stepDays = 2
  }

  // Parse YYYY-MM-DD reliably using local date components
  const [year, month, day] = date.split('-').map(Number)
  const localStartDate = new Date(year, month - 1, day)

  const targetDateStrings: string[] = []
  for (let i = 0; i < 30; i += stepDays) {
    const targetDate = new Date(localStartDate)
    targetDate.setDate(localStartDate.getDate() + i)
    targetDateStrings.push(format(targetDate, 'yyyy-MM-dd'))
  }

  // 1 single batch query to check existing tasks across all target dates
  const { data: existingTasks } = await supabase
    .from('daily_protocol_tasks')
    .select('id, scheduled_date, status')
    .eq('local_user_id', localUserId)
    .eq('modality_id', effectiveModalityId)
    .in('scheduled_date', targetDateStrings)

  const existingDateMap = new Map<string, any>()
  if (existingTasks) {
    existingTasks.forEach(t => existingDateMap.set(t.scheduled_date, t))
  }

  const tasksToInsert: any[] = []
  const idsToReactivate: string[] = []

  targetDateStrings.forEach(targetDateStr => {
    if (existingDateMap.has(targetDateStr)) {
      const existing = existingDateMap.get(targetDateStr)
      if (existing.status !== 'pending' && existing.status !== 'completed') {
        idsToReactivate.push(existing.id)
      }
    } else {
      tasksToInsert.push({
        local_user_id: localUserId, 
        scheduled_date: targetDateStr, 
        modality_id: effectiveModalityId, 
        timing_slot: timing_slot,
        status: 'pending'
      })
    }
  })

  let insertedTasks: any[] = []

  if (idsToReactivate.length > 0) {
    await supabase
      .from('daily_protocol_tasks')
      .update({
        status: 'pending',
        timing_slot: timing_slot,
        status_reason: null
      })
      .in('id', idsToReactivate)
  }

  if (tasksToInsert.length > 0) {
    const { data: inserted, error: insertError } = await supabase
      .from('daily_protocol_tasks')
      .insert(tasksToInsert)
      .select()

    if (insertError) {
      console.warn('Error inserting loose tasks batch:', insertError?.message || insertError)
    } else if (inserted) {
      insertedTasks = inserted
    }
  }

  return insertedTasks
}

/**
 * Universal Intelligent Dispatcher: Adds any modality OR protocol suggested by the AI Longevity Coach or Tip Engine
 */
export async function addModalityOrProtocolToToday(localUserId: string, date: string, nameOrId: string) {
  if (!nameOrId || !localUserId) return false

  const cleanQuery = nameOrId.trim()
  const lowerQuery = cleanQuery.toLowerCase().replace(/_/g, ' ')
  const slugQuery = cleanQuery.toLowerCase().replace(/[^a-z0-9]+/g, '_')

  // Direct fast check for single modality by ID
  const directMod = await getModalityById(cleanQuery)
  if (directMod) {
    const res = await createDailyTask(localUserId, date, directMod.id)
    return !!res
  }

  // Direct fast check for protocol by ID
  const directProto = await getProtocolByIdWithSteps(cleanQuery)
  if (directProto) {
    return await addProtocolToToday(localUserId, date, directProto.id)
  }

  // 1. Check if it matches an existing Protocol
  const allProtocols = await getProtocols()
  const matchedProtocol = allProtocols.find(p => 
    p.id === cleanQuery ||
    p.slug === slugQuery ||
    p.slug === cleanQuery ||
    p.name.toLowerCase() === lowerQuery ||
    p.name.toLowerCase().includes(lowerQuery) ||
    lowerQuery.includes(p.name.toLowerCase())
  )

  if (matchedProtocol) {
    return await addProtocolToToday(localUserId, date, matchedProtocol.id)
  }

  // 2. Check if it matches an existing Modality
  const allModalities = await getModalities()
  let matchedModality = allModalities.find(m => 
    m.id === cleanQuery ||
    m.slug === slugQuery ||
    m.slug === cleanQuery ||
    m.name.toLowerCase() === lowerQuery ||
    (m.display_name && m.display_name.toLowerCase() === lowerQuery)
  )

  // 3. Fuzzy match common longevity modalities
  if (!matchedModality) {
    matchedModality = allModalities.find(m => {
      const mName = (m.name || m.display_name || '').toLowerCase()
      return mName.includes(lowerQuery) || lowerQuery.includes(mName)
    })
  }

  // 4. Token-based synonym matching
  if (!matchedModality) {
    const synonyms: Record<string, string[]> = {
      'cold plunge': ['cold', 'plunge', 'ice bath', 'cold shower', 'cryo'],
      'sauna': ['sauna', 'heat', 'steam', 'infrared'],
      'creatine': ['creatine', 'creatine monohydrate'],
      'zone 2': ['zone 2', 'cardio', 'aerobic', 'endurance'],
      'fisetin': ['fisetin', 'senolytic'],
      'quercetin': ['quercetin'],
      'nmn': ['nmn', 'nad', 'nicotinamide'],
      'resveratrol': ['resveratrol', 'sirtuin'],
      'magnesium': ['magnesium', 'glycinate', 'threonate', 'malate'],
      'sunlight': ['sunlight', 'morning sun', 'circadian light'],
      'breathwork': ['breathwork', 'box breath', 'sigh', 'wim hof'],
      'red light': ['red light', 'photobiomodulation', 'pbm'],
      'bpc 157': ['bpc', 'bpc-157', 'wolverine'],
      'glynac': ['glynac', 'glycine', 'nac'],
      'ta1': ['ta1', 'ta-1', 'thymosin'],
      'omega 3': ['omega', 'fish oil', 'dha', 'epa'],
      'vitamin d': ['vitamin d', 'd3', 'd3+k2', 'cholecalciferol']
    }

    for (const [key, terms] of Object.entries(synonyms)) {
      if (terms.some(t => lowerQuery.includes(t))) {
        matchedModality = allModalities.find(m => {
          const mName = (m.name || m.display_name || '').toLowerCase()
          return terms.some(t => mName.includes(t))
        })
        if (matchedModality) break
      }
    }
  }

  if (matchedModality) {
    const res = await createDailyTask(localUserId, date, matchedModality.id)
    return !!res
  }

  // 5. If completely new modality suggested by AI, create loose task with generated modality
  if (supabase) {
    try {
      const formattedName = cleanQuery
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())

      const { data: newMod, error: modErr } = await supabase
        .from('modalities')
        .insert({
          name: formattedName,
          display_name: formattedName,
          category: 'Supplements',
          headline_benefit: 'Suggested by AI Longevity Coach',
          evidence_quality: 4,
          overall_longevity_benefit: 4,
          default_timing: 'Morning'
        })
        .select()
        .single()

      if (newMod && !modErr) {
        const res = await createDailyTask(localUserId, date, newMod.id)
        return !!res
      }
    } catch (err) {
      console.warn('Could not auto-create custom modality:', err)
    }
  }

  const res = await createDailyTask(localUserId, date, cleanQuery)
  return !!res
}

export async function addProtocolToToday(localUserId: string, date: string, protocolId: string) {
  if (!supabase) return false

  const isProtocolUuid = protocolId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(protocolId)
  const isUuidCheck = (val?: string | null) => {
    return !!val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(val))
  }

  let instanceId: string | null = null

  // 1. Check if user_protocol_instance already exists, if not create it (only if protocolId is valid UUID)
  if (isProtocolUuid) {
    try {
      let { data: instance } = await supabase
        .from('user_protocol_instances')
        .select('id')
        .eq('local_user_id', localUserId)
        .eq('protocol_id', protocolId)
        .eq('status', 'active')
        .maybeSingle()

      if (!instance) {
        const { data: newInstance, error: instanceError } = await supabase
          .from('user_protocol_instances')
          .insert({
            local_user_id: localUserId,
            protocol_id: protocolId,
            status: 'active'
          })
          .select('id')
          .maybeSingle()
          
        if (!instanceError && newInstance) {
          instanceId = newInstance.id
        }
      } else {
        instanceId = instance.id
      }
    } catch (err) {
      console.warn('Instance creation fallback:', err)
    }
  }

  // 2. Fetch protocol steps from catalog or DB
  const protocolObj = await getProtocolByIdWithSteps(protocolId)
  let steps: any[] = protocolObj?.steps || protocolObj?.protocol_steps || []

  if (!steps || steps.length === 0) {
    const { data: dbSteps } = await supabase
      .from('protocol_steps')
      .select('*, protocol:protocols(name), modality:modalities(timing_summary)')
      .eq('protocol_id', protocolId)
    if (dbSteps && dbSteps.length > 0) {
      steps = dbSteps
    }
  }

  // Fallback: If no steps found, check if protocolId matches a loose modality in modalities table
  if (!steps || steps.length === 0) {
    const { data: mod } = await supabase
      .from('modalities')
      .select('*')
      .eq('id', protocolId)
      .maybeSingle()

    if (mod) {
      // Insert single task directly for this modality
      const { error: looseErr } = await supabase
        .from('daily_protocol_tasks')
        .insert({
          local_user_id: localUserId,
          modality_id: mod.id,
          scheduled_date: date,
          timing_slot: mod.timing_summary?.toLowerCase().includes('morning') ? 'morning' : 'anytime',
          status: 'pending'
        })
      return !looseErr
    }
  }

  // Ensure all needed modalities exist in modalities table
  const allNeededModalityIds = Array.from(new Set(steps.map(s => s.modality_id || s.modality?.id).filter(Boolean)))
  if (allNeededModalityIds.length > 0) {
    try {
      const { data: existingMods } = await supabase
        .from('modalities')
        .select('id')
        .in('id', allNeededModalityIds)

      const existingModIds = new Set((existingMods || []).map(m => m.id))
      const missingModIds = allNeededModalityIds.filter(id => !existingModIds.has(id))

      if (missingModIds.length > 0) {
        const placeholders = missingModIds.map(missingId => {
          const stepMatch = steps.find(s => (s.modality_id || s.modality?.id) === missingId)
          const stepMod = stepMatch?.modality || {}
          return {
            id: missingId,
            slug: stepMod.slug || missingId,
            name: stepMod.name || stepMod.display_name || missingId.replace(/_/g, ' '),
            display_name: stepMod.display_name || stepMod.name || missingId.replace(/_/g, ' '),
            category: stepMod.category || 'other',
            modality_type: stepMod.modality_type || 'lifestyle',
            status: 'active',
            brief_description: stepMod.brief_description || '',
            headline_benefit: stepMod.headline_benefit || '',
            primary_outcome: stepMod.primary_outcome || 'General Longevity',
            dose_or_exposure: stepMod.dose_or_exposure || '',
            timing_summary: stepMod.timing_summary || 'anytime'
          }
        })

        await supabase
          .from('modalities')
          .upsert(placeholders, { onConflict: 'id', ignoreDuplicates: true })
      }
    } catch (e) {
      console.warn('Modality sync check warning for daily tasks:', e)
    }
  }

  const tasksToInsert: any[] = []
  const [year, month, day] = date.split('-').map(Number)
  const localStartDate = new Date(year, month - 1, day)

  if (steps && steps.length > 0) {
    // If Push / Pull / Legs protocol: schedule according to standard 2x/week rotation per muscle group starting Day 0
    if (protocolId === 'push_pull_legs_hypertrophy_protocol') {
      const stepOffsetMap: Record<string, number[]> = {
        // Push Day: 2x per week (Day 0 & Day 3 of each 7-day cycle)
        'ppl_push_day': [0, 3, 7, 10, 14, 17, 21, 24, 28, 31, 35, 38, 42, 45, 49, 52, 56, 59, 63, 66, 70, 73, 77, 80],
        // Pull Day: 2x per week (Day 1 & Day 4 of each 7-day cycle)
        'ppl_pull_day': [1, 4, 8, 11, 15, 18, 22, 25, 29, 32, 36, 39, 43, 46, 50, 53, 57, 60, 64, 67, 71, 74, 78, 81],
        // Leg Day: 2x per week (Day 2 & Day 5 of each 7-day cycle)
        'ppl_leg_day': [2, 5, 9, 12, 16, 19, 23, 26, 30, 33, 37, 40, 44, 47, 51, 54, 58, 61, 65, 68, 72, 75, 79, 82],
        // Active Recovery & Growth: 1x per week (Day 6 of each 7-day cycle)
        'ppl_recovery_day': [6, 13, 20, 27, 34, 41, 48, 55, 62, 69, 76, 83]
      }

      steps.forEach(step => {
        const modId = step.modality_id || step.modality?.id
        const offsets = stepOffsetMap[modId] || [0, 3, 7, 10, 14, 17, 21, 24, 28, 31, 35, 38, 42, 45, 49, 52, 56, 59, 63, 66, 70, 73, 77, 80]
        offsets.forEach(dayOff => {
          const targetDate = new Date(localStartDate)
          targetDate.setDate(localStartDate.getDate() + dayOff)
          const targetDateStr = format(targetDate, 'yyyy-MM-dd')

          tasksToInsert.push({
            local_user_id: localUserId,
            user_protocol_instance_id: isUuidCheck(instanceId) ? instanceId : null,
            protocol_step_id: isUuidCheck(step.id) ? step.id : null,
            modality_id: modId || null,
            scheduled_date: targetDateStr,
            timing_slot: step.timing_slot || 'afternoon',
            status: 'pending',
            execution_details: {
              schedule_config: {
                schedule_mode: 'days_of_week',
                days_of_week: modId === 'ppl_push_day' ? ['Mon', 'Thu'] :
                              modId === 'ppl_pull_day' ? ['Tue', 'Fri'] :
                              modId === 'ppl_leg_day' ? ['Wed', 'Sat'] : ['Sun'],
                rest_days_between: modId === 'ppl_recovery_day' ? 6 : 2,
                skip_policy: 'roll_forward',
                timing_slot: step.timing_slot || 'afternoon'
              }
            }
          })
        })
      })
    } else if (protocolId === 'half_marathon_training_protocol') {
      // If Half Marathon protocol: schedule periodized 12-week schedule (84 days) starting Day 0
      const hmOffsetMap: Record<string, number[]> = {
        'hm_zone2_run': [0, 7, 14, 21, 28, 35, 42, 49, 56, 63, 70, 77],
        'hm_runner_stability': [1, 3, 8, 10, 15, 17, 22, 24, 29, 31, 36, 38, 43, 45, 50, 52, 57, 59, 64, 66, 71, 73, 78, 80],
        'hm_threshold_intervals': [2, 9, 16, 23, 30, 37, 44, 51, 58, 65, 72, 79],
        'hm_progressive_longrun': [5, 12, 19, 26, 33, 40, 47, 54, 61, 68, 75, 82]
      }

      steps.forEach(step => {
        const modId = step.modality_id || step.modality?.id
        const offsets = hmOffsetMap[modId] || [0, 7, 14, 21, 28, 35, 42, 49, 56, 63, 70, 77]
        offsets.forEach((dayOff) => {
          const targetDate = new Date(localStartDate)
          targetDate.setDate(localStartDate.getDate() + dayOff)
          const targetDateStr = format(targetDate, 'yyyy-MM-dd')

          const weekNum = Math.floor(dayOff / 7) + 1
          const runDistance = modId === 'hm_progressive_longrun'
            ? Math.min(12, 5 + weekNum)
            : undefined

          tasksToInsert.push({
            local_user_id: localUserId,
            user_protocol_instance_id: isUuidCheck(instanceId) ? instanceId : null,
            protocol_step_id: isUuidCheck(step.id) ? step.id : null,
            modality_id: modId || null,
            scheduled_date: targetDateStr,
            timing_slot: step.timing_slot || 'morning',
            status: 'pending',
            execution_details: {
              target_distance_miles: runDistance,
              week_number: weekNum,
              schedule_config: {
                schedule_mode: 'days_of_week',
                days_of_week: modId === 'hm_zone2_run' ? ['Tue'] :
                              modId === 'hm_threshold_intervals' ? ['Thu'] :
                              modId === 'hm_runner_stability' ? ['Wed', 'Fri'] : ['Sun'],
                rest_days_between: 1,
                skip_policy: 'roll_forward',
                timing_slot: step.timing_slot || 'morning'
              }
            }
          })
        })
      })
    } else if (protocolId === 'bpc157_tb500_wolverine_stack_protocol') {
      // Wolverine Stack: BPC-157 daily for 8 weeks (56 days), TB-500 2x weekly (Day 0, 3 of each week)
      const tbDays: number[] = []
      for (let week = 0; week < 8; week++) {
        tbDays.push(week * 7 + 0)
        tbDays.push(week * 7 + 3)
      }
      steps.forEach(step => {
        const modId = step.modality_id || step.modality?.id
        const isBpc = modId === 'bpc157_subq' || (step.modality?.name || '').toLowerCase().includes('bpc')
        const targetDays = isBpc
          ? Array.from({ length: 56 }, (_, i) => i) // Daily for 8 weeks
          : tbDays // 2x weekly starting Day 0

        targetDays.forEach(dayOff => {
          const targetDate = new Date(localStartDate)
          targetDate.setDate(localStartDate.getDate() + dayOff)
          const targetDateStr = format(targetDate, 'yyyy-MM-dd')

          tasksToInsert.push({
            local_user_id: localUserId,
            user_protocol_instance_id: isUuidCheck(instanceId) ? instanceId : null,
            protocol_step_id: isUuidCheck(step.id) ? step.id : null,
            modality_id: modId || null,
            scheduled_date: targetDateStr,
            timing_slot: isBpc ? 'morning' : 'evening',
            status: 'pending',
            execution_details: {
              schedule_config: {
                schedule_mode: 'days_of_week',
                days_of_week: isBpc ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : ['Tue', 'Fri'],
                rest_days_between: isBpc ? 0 : 2,
                skip_policy: 'roll_forward',
                timing_slot: isBpc ? 'morning' : 'evening'
              }
            }
          })
        })
      })
    } else if (protocolId === 'ghk_cu_bpc157_tb500_glow_stack_protocol') {
      // Glow Stack: GHK-Cu daily morning (56 days), BPC-157 daily morning (56 days), TB-500 2x weekly (evening)
      const tbDays: number[] = []
      for (let week = 0; week < 8; week++) {
        tbDays.push(week * 7 + 0)
        tbDays.push(week * 7 + 3)
      }
      steps.forEach(step => {
        const modId = step.modality_id || step.modality?.id
        const isTb = modId === 'tb500_subq' || (step.modality?.name || '').toLowerCase().includes('tb-500') || (step.modality?.name || '').toLowerCase().includes('tb500')
        const targetDays = isTb
          ? tbDays // 2x weekly starting Day 0
          : Array.from({ length: 56 }, (_, i) => i) // Daily for 8 weeks

        targetDays.forEach(dayOff => {
          const targetDate = new Date(localStartDate)
          targetDate.setDate(localStartDate.getDate() + dayOff)
          const targetDateStr = format(targetDate, 'yyyy-MM-dd')

          tasksToInsert.push({
            local_user_id: localUserId,
            user_protocol_instance_id: isUuidCheck(instanceId) ? instanceId : null,
            protocol_step_id: isUuidCheck(step.id) ? step.id : null,
            modality_id: modId || null,
            scheduled_date: targetDateStr,
            timing_slot: isTb ? 'evening' : 'morning',
            status: 'pending',
            execution_details: {
              schedule_config: {
                schedule_mode: 'days_of_week',
                days_of_week: isTb ? ['Tue', 'Fri'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                rest_days_between: isTb ? 2 : 0,
                skip_policy: 'roll_forward',
                timing_slot: isTb ? 'evening' : 'morning'
              }
            }
          })
        })
      })
    } else if (protocolId === 'tesamorelin_ipamorelin_body_comp_protocol') {
      // Tesamorelin + Ipamorelin: 5 Days On / 2 Days Off at Bedtime across 12 weeks (84 days)
      const fiveOnTwoOffDays: number[] = []
      for (let week = 0; week < 12; week++) {
        for (let day = 0; day < 5; day++) {
          fiveOnTwoOffDays.push(week * 7 + day)
        }
      }

      steps.forEach(step => {
        const modId = step.modality_id || step.modality?.id
        fiveOnTwoOffDays.forEach(dayOff => {
          const targetDate = new Date(localStartDate)
          targetDate.setDate(localStartDate.getDate() + dayOff)
          const targetDateStr = format(targetDate, 'yyyy-MM-dd')

          tasksToInsert.push({
            local_user_id: localUserId,
            user_protocol_instance_id: isUuidCheck(instanceId) ? instanceId : null,
            protocol_step_id: isUuidCheck(step.id) ? step.id : null,
            modality_id: modId || null,
            scheduled_date: targetDateStr,
            timing_slot: 'pre_bed',
            status: 'pending',
            execution_details: {
              schedule_config: {
                schedule_mode: 'days_of_week',
                days_of_week: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                rest_days_between: 0,
                skip_policy: 'roll_forward',
                timing_slot: 'pre_bed'
              }
            }
          })
        })
      })
    } else if (protocolId === 'cjc1295_ipamorelin_motsc_longevity_protocol') {
      // CJC/Ipam 5 On / 2 Off at Bedtime + MOTS-c Mon/Wed/Fri mornings
      const ghDays: number[] = []
      for (let week = 0; week < 12; week++) {
        for (let day = 0; day < 5; day++) {
          ghDays.push(week * 7 + day)
        }
      }

      const motscDays: number[] = []
      for (let week = 0; week < 6; week++) {
        motscDays.push(week * 7 + 0) // Mon
        motscDays.push(week * 7 + 2) // Wed
        motscDays.push(week * 7 + 4) // Fri
      }

      steps.forEach(step => {
        const modId = step.modality_id || step.modality?.id
        const isMotsc = modId === 'mots_c_subq' || (step.modality?.name || '').toLowerCase().includes('mots')
        const targetDays = isMotsc ? motscDays : ghDays
        const slot = isMotsc ? 'morning' : 'pre_bed'

        targetDays.forEach(dayOff => {
          const targetDate = new Date(localStartDate)
          targetDate.setDate(localStartDate.getDate() + dayOff)
          const targetDateStr = format(targetDate, 'yyyy-MM-dd')

          tasksToInsert.push({
            local_user_id: localUserId,
            user_protocol_instance_id: isUuidCheck(instanceId) ? instanceId : null,
            protocol_step_id: isUuidCheck(step.id) ? step.id : null,
            modality_id: modId || null,
            scheduled_date: targetDateStr,
            timing_slot: slot,
            status: 'pending',
            execution_details: {
              schedule_config: {
                schedule_mode: 'days_of_week',
                days_of_week: isMotsc ? ['Mon', 'Wed', 'Fri'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                rest_days_between: isMotsc ? 1 : 0,
                skip_policy: 'roll_forward',
                timing_slot: slot
              }
            }
          })
        })
      })
    } else if (protocolId === 'cjc1295_ipamorelin_gh_protocol') {
      // CJC-1295 + Ipamorelin: 5 Days On / 2 Days Off at Bedtime across 12 weeks (84 days)
      const fiveOnTwoOffDays: number[] = []
      for (let week = 0; week < 12; week++) {
        for (let day = 0; day < 5; day++) {
          fiveOnTwoOffDays.push(week * 7 + day)
        }
      }

      steps.forEach(step => {
        const modId = step.modality_id || step.modality?.id
        fiveOnTwoOffDays.forEach(dayOff => {
          const targetDate = new Date(localStartDate)
          targetDate.setDate(localStartDate.getDate() + dayOff)
          const targetDateStr = format(targetDate, 'yyyy-MM-dd')

          tasksToInsert.push({
            local_user_id: localUserId,
            user_protocol_instance_id: isUuidCheck(instanceId) ? instanceId : null,
            protocol_step_id: isUuidCheck(step.id) ? step.id : null,
            modality_id: modId || null,
            scheduled_date: targetDateStr,
            timing_slot: 'pre_bed',
            status: 'pending',
            execution_details: {
              schedule_config: {
                schedule_mode: 'days_of_week',
                days_of_week: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                rest_days_between: 0,
                skip_policy: 'roll_forward',
                timing_slot: 'pre_bed'
              }
            }
          })
        })
      })
    } else if (protocolId === 'semax_selank_cognition_protocol') {
      // Semax + Selank: Daily morning for 6 weeks (42 days)
      steps.forEach(step => {
        const modId = step.modality_id || step.modality?.id
        const targetDays = Array.from({ length: 42 }, (_, i) => i)

        targetDays.forEach(dayOff => {
          const targetDate = new Date(localStartDate)
          targetDate.setDate(localStartDate.getDate() + dayOff)
          const targetDateStr = format(targetDate, 'yyyy-MM-dd')

          tasksToInsert.push({
            local_user_id: localUserId,
            user_protocol_instance_id: isUuidCheck(instanceId) ? instanceId : null,
            protocol_step_id: isUuidCheck(step.id) ? step.id : null,
            modality_id: modId || null,
            scheduled_date: targetDateStr,
            timing_slot: 'morning',
            status: 'pending',
            execution_details: {
              schedule_config: {
                schedule_mode: 'days_of_week',
                days_of_week: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                rest_days_between: 0,
                skip_policy: 'roll_forward',
                timing_slot: 'morning'
              }
            }
          })
        })
      })
    } else if (protocolId === 'bpc157_tb500_kpv_recovery_protocol') {
      // Wolverine Plus: BPC-157 & KPV daily morning (56 days), TB-500 2x weekly (evening)
      const tbDays: number[] = []
      for (let week = 0; week < 8; week++) {
        tbDays.push(week * 7 + 0)
        tbDays.push(week * 7 + 3)
      }
      steps.forEach(step => {
        const modId = step.modality_id || step.modality?.id
        const isTb = modId === 'tb500_subq' || (step.modality?.name || '').toLowerCase().includes('tb-500') || (step.modality?.name || '').toLowerCase().includes('tb500')
        const targetDays = isTb
          ? tbDays // 2x weekly starting Day 0
          : Array.from({ length: 56 }, (_, i) => i) // Daily for 8 weeks

        targetDays.forEach(dayOff => {
          const targetDate = new Date(localStartDate)
          targetDate.setDate(localStartDate.getDate() + dayOff)
          const targetDateStr = format(targetDate, 'yyyy-MM-dd')

          tasksToInsert.push({
            local_user_id: localUserId,
            user_protocol_instance_id: isUuidCheck(instanceId) ? instanceId : null,
            protocol_step_id: isUuidCheck(step.id) ? step.id : null,
            modality_id: modId || null,
            scheduled_date: targetDateStr,
            timing_slot: isTb ? 'evening' : 'morning',
            status: 'pending',
            execution_details: {
              schedule_config: {
                schedule_mode: 'days_of_week',
                days_of_week: isTb ? ['Tue', 'Fri'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                rest_days_between: isTb ? 2 : 0,
                skip_policy: 'roll_forward',
                timing_slot: isTb ? 'evening' : 'morning'
              }
            }
          })
        })
      })
    } else if (protocolId === 'ghk_cu_bpc157_tb500_kpv_klow_stack_protocol') {
      // KLOW Stack: GHK-Cu, BPC-157, KPV daily morning (56 days), TB-500 2x weekly (evening)
      const tbDays: number[] = []
      for (let week = 0; week < 8; week++) {
        tbDays.push(week * 7 + 0)
        tbDays.push(week * 7 + 3)
      }
      steps.forEach(step => {
        const modId = step.modality_id || step.modality?.id
        const isTb = modId === 'tb500_subq' || (step.modality?.name || '').toLowerCase().includes('tb-500') || (step.modality?.name || '').toLowerCase().includes('tb500')
        const targetDays = isTb
          ? tbDays // 2x weekly starting Day 0
          : Array.from({ length: 56 }, (_, i) => i) // Daily for 8 weeks

        targetDays.forEach(dayOff => {
          const targetDate = new Date(localStartDate)
          targetDate.setDate(localStartDate.getDate() + dayOff)
          const targetDateStr = format(targetDate, 'yyyy-MM-dd')

          tasksToInsert.push({
            local_user_id: localUserId,
            user_protocol_instance_id: isUuidCheck(instanceId) ? instanceId : null,
            protocol_step_id: isUuidCheck(step.id) ? step.id : null,
            modality_id: modId || null,
            scheduled_date: targetDateStr,
            timing_slot: isTb ? 'evening' : 'morning',
            status: 'pending',
            execution_details: {
              schedule_config: {
                schedule_mode: 'days_of_week',
                days_of_week: isTb ? ['Tue', 'Fri'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                rest_days_between: isTb ? 2 : 0,
                skip_policy: 'roll_forward',
                timing_slot: isTb ? 'evening' : 'morning'
              }
            }
          })
        })
      })
    } else if (protocolId === 'retatrutide_tesamorelin_body_recomp_protocol') {
      // Retatrutide: 1x weekly (Sundays morning for 16 weeks / 112 days)
      // Tesamorelin: 5 Days On / 2 Days Off (Mon–Fri pre_bed for 16 weeks)
      const tesaDays: number[] = []
      for (let week = 0; week < 16; week++) {
        for (let day = 0; day < 5; day++) {
          tesaDays.push(week * 7 + day)
        }
      }

      const retaDays: number[] = []
      for (let week = 0; week < 16; week++) {
        retaDays.push(week * 7 + 0) // Sunday / Day 0
      }

      steps.forEach(step => {
        const modId = step.modality_id || step.modality?.id
        const isReta = modId === 'retatrutide_subq' || (step.modality?.name || '').toLowerCase().includes('retatrutide')
        const targetDays = isReta ? retaDays : tesaDays
        const slot = isReta ? 'morning' : 'pre_bed'

        targetDays.forEach(dayOff => {
          const targetDate = new Date(localStartDate)
          targetDate.setDate(localStartDate.getDate() + dayOff)
          const targetDateStr = format(targetDate, 'yyyy-MM-dd')

          tasksToInsert.push({
            local_user_id: localUserId,
            user_protocol_instance_id: isUuidCheck(instanceId) ? instanceId : null,
            protocol_step_id: isUuidCheck(step.id) ? step.id : null,
            modality_id: modId || null,
            scheduled_date: targetDateStr,
            timing_slot: slot,
            status: 'pending',
            execution_details: {
              schedule_config: {
                schedule_mode: 'days_of_week',
                days_of_week: isReta ? ['Sun'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                rest_days_between: isReta ? 6 : 0,
                skip_policy: 'roll_forward',
                timing_slot: slot
              }
            }
          })
        })
      })
    } else if (protocolId === 'motsc_ss31_mitochondrial_stack_protocol') {
      // SS-31: Daily morning for 6 weeks (42 days)
      // MOTS-c: Mon/Wed/Fri morning for 6 weeks (42 days)
      const ss31Days = Array.from({ length: 42 }, (_, i) => i)
      const motscDays: number[] = []
      for (let week = 0; week < 6; week++) {
        motscDays.push(week * 7 + 0) // Mon
        motscDays.push(week * 7 + 2) // Wed
        motscDays.push(week * 7 + 4) // Fri
      }

      steps.forEach(step => {
        const modId = step.modality_id || step.modality?.id
        const isMotsc = modId === 'mots_c_subq' || (step.modality?.name || '').toLowerCase().includes('mots')
        const targetDays = isMotsc ? motscDays : ss31Days

        targetDays.forEach(dayOff => {
          const targetDate = new Date(localStartDate)
          targetDate.setDate(localStartDate.getDate() + dayOff)
          const targetDateStr = format(targetDate, 'yyyy-MM-dd')

          tasksToInsert.push({
            local_user_id: localUserId,
            user_protocol_instance_id: isUuidCheck(instanceId) ? instanceId : null,
            protocol_step_id: isUuidCheck(step.id) ? step.id : null,
            modality_id: modId || null,
            scheduled_date: targetDateStr,
            timing_slot: 'morning',
            status: 'pending',
            execution_details: {
              schedule_config: {
                schedule_mode: 'days_of_week',
                days_of_week: isMotsc ? ['Mon', 'Wed', 'Fri'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                rest_days_between: isMotsc ? 1 : 0,
                skip_policy: 'roll_forward',
                timing_slot: 'morning'
              }
            }
          })
        })
      })
    } else if (protocolId === 'epitalon_motsc_longevity_protocol') {
      // Epitalon: Daily pre_bed for 14 days
      // MOTS-c: Mon/Wed/Fri morning for 6 weeks (42 days)
      const epitalonDays = Array.from({ length: 14 }, (_, i) => i)
      const motscDays: number[] = []
      for (let week = 0; week < 6; week++) {
        motscDays.push(week * 7 + 0) // Mon
        motscDays.push(week * 7 + 2) // Wed
        motscDays.push(week * 7 + 4) // Fri
      }

      steps.forEach(step => {
        const modId = step.modality_id || step.modality?.id
        const isEpitalon = modId === 'epitalon_subq' || (step.modality?.name || '').toLowerCase().includes('epitalon') || (step.modality?.name || '').toLowerCase().includes('epithalon')
        const targetDays = isEpitalon ? epitalonDays : motscDays
        const slot = isEpitalon ? 'pre_bed' : 'morning'

        targetDays.forEach(dayOff => {
          const targetDate = new Date(localStartDate)
          targetDate.setDate(localStartDate.getDate() + dayOff)
          const targetDateStr = format(targetDate, 'yyyy-MM-dd')

          tasksToInsert.push({
            local_user_id: localUserId,
            user_protocol_instance_id: isUuidCheck(instanceId) ? instanceId : null,
            protocol_step_id: isUuidCheck(step.id) ? step.id : null,
            modality_id: modId || null,
            scheduled_date: targetDateStr,
            timing_slot: slot,
            status: 'pending',
            execution_details: {
              schedule_config: {
                schedule_mode: 'days_of_week',
                days_of_week: isEpitalon ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : ['Mon', 'Wed', 'Fri'],
                rest_days_between: isEpitalon ? 0 : 1,
                skip_policy: 'roll_forward',
                timing_slot: slot
              }
            }
          })
        })
      })
    } else if (protocolId === 'bpc157_kpv_gut_repair_protocol') {
      // Both BPC-157 and KPV are daily morning for 8 weeks (56 days)
      const targetDays = Array.from({ length: 56 }, (_, i) => i)

      steps.forEach(step => {
        const modId = step.modality_id || step.modality?.id

        targetDays.forEach(dayOff => {
          const targetDate = new Date(localStartDate)
          targetDate.setDate(localStartDate.getDate() + dayOff)
          const targetDateStr = format(targetDate, 'yyyy-MM-dd')

          tasksToInsert.push({
            local_user_id: localUserId,
            user_protocol_instance_id: isUuidCheck(instanceId) ? instanceId : null,
            protocol_step_id: isUuidCheck(step.id) ? step.id : null,
            modality_id: modId || null,
            scheduled_date: targetDateStr,
            timing_slot: 'morning',
            status: 'pending',
            execution_details: {
              schedule_config: {
                schedule_mode: 'days_of_week',
                days_of_week: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                rest_days_between: 0,
                skip_policy: 'roll_forward',
                timing_slot: 'morning'
              }
            }
          })
        })
      })
    } else if (protocolId === 'bpc157_tb500_ta1_immuno_wolverine_protocol') {
      // BPC-157: Daily morning (56 days)
      // TB-500: 2x weekly (Day 0, 3 of each week)
      // TA-1: 2x weekly (Day 0, 3 of each week)
      const bpcDays = Array.from({ length: 56 }, (_, i) => i)
      const tbDays: number[] = []
      const ta1Days: number[] = []
      for (let week = 0; week < 8; week++) {
        tbDays.push(week * 7 + 0)
        tbDays.push(week * 7 + 3)
        ta1Days.push(week * 7 + 0)
        ta1Days.push(week * 7 + 3)
      }

      steps.forEach(step => {
        const modId = step.modality_id || step.modality?.id
        const isTb = modId === 'tb500_subq' || (step.modality?.name || '').toLowerCase().includes('tb-500') || (step.modality?.name || '').toLowerCase().includes('tb500')
        const isTa1 = modId === 'ta1_subq' || (step.modality?.name || '').toLowerCase().includes('thymosin alpha') || (step.modality?.name || '').toLowerCase().includes('ta1')
        const targetDays = isTb ? tbDays : (isTa1 ? ta1Days : bpcDays)
        const slot = isTb ? 'evening' : 'morning'

        targetDays.forEach(dayOff => {
          const targetDate = new Date(localStartDate)
          targetDate.setDate(localStartDate.getDate() + dayOff)
          const targetDateStr = format(targetDate, 'yyyy-MM-dd')

          tasksToInsert.push({
            local_user_id: localUserId,
            user_protocol_instance_id: isUuidCheck(instanceId) ? instanceId : null,
            protocol_step_id: isUuidCheck(step.id) ? step.id : null,
            modality_id: modId || null,
            scheduled_date: targetDateStr,
            timing_slot: slot,
            status: 'pending',
            execution_details: {
              schedule_config: {
                schedule_mode: 'days_of_week',
                days_of_week: isTb ? ['Tue', 'Fri'] : (isTa1 ? ['Mon', 'Thu'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']),
                rest_days_between: isTb ? 2 : (isTa1 ? 2 : 0),
                skip_policy: 'roll_forward',
                timing_slot: slot
              }
            }
          })
        })
      })
    } else if (protocolId === 'tirzepatide_cjc_ipam_aod_shred_protocol') {
      // Tirzepatide: 1x weekly (Sundays morning for 16 weeks)
      // AOD-9604: Daily morning (56 days)
      // CJC/Ipamorelin: 5 on / 2 off Mon-Fri pre_bed (56 days)
      const tirzDays: number[] = []
      for (let week = 0; week < 16; week++) tirzDays.push(week * 7 + 0)

      const aodDays = Array.from({ length: 56 }, (_, i) => i)

      const ghDays: number[] = []
      for (let week = 0; week < 8; week++) {
        for (let day = 0; day < 5; day++) ghDays.push(week * 7 + day)
      }

      steps.forEach(step => {
        const modId = step.modality_id || step.modality?.id
        const isTirz = modId === 'tirzepatide_subq' || (step.modality?.name || '').toLowerCase().includes('tirzepatide')
        const isAod = modId === 'aod9604_subq' || (step.modality?.name || '').toLowerCase().includes('aod')
        const targetDays = isTirz ? tirzDays : (isAod ? aodDays : ghDays)
        const slot = (isTirz || isAod) ? 'morning' : 'pre_bed'

        targetDays.forEach(dayOff => {
          const targetDate = new Date(localStartDate)
          targetDate.setDate(localStartDate.getDate() + dayOff)
          const targetDateStr = format(targetDate, 'yyyy-MM-dd')

          tasksToInsert.push({
            local_user_id: localUserId,
            user_protocol_instance_id: isUuidCheck(instanceId) ? instanceId : null,
            protocol_step_id: isUuidCheck(step.id) ? step.id : null,
            modality_id: modId || null,
            scheduled_date: targetDateStr,
            timing_slot: slot,
            status: 'pending',
            execution_details: {
              schedule_config: {
                schedule_mode: 'days_of_week',
                days_of_week: isTirz ? ['Sun'] : (isAod ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']),
                rest_days_between: isTirz ? 6 : 0,
                skip_policy: 'roll_forward',
                timing_slot: slot
              }
            }
          })
        })
      })
    } else if (protocolId === 'cjc_ipam_bpc_tb500_super_wolverine_protocol') {
      // BPC-157: Daily morning (56 days)
      // TB-500: 2x weekly (Day 0, 3 of each week)
      // CJC/Ipamorelin: 5 on / 2 off Mon-Fri pre_bed (56 days)
      const bpcDays = Array.from({ length: 56 }, (_, i) => i)
      const tbDays: number[] = []
      for (let week = 0; week < 8; week++) {
        tbDays.push(week * 7 + 0)
        tbDays.push(week * 7 + 3)
      }
      const ghDays: number[] = []
      for (let week = 0; week < 8; week++) {
        for (let day = 0; day < 5; day++) ghDays.push(week * 7 + day)
      }

      steps.forEach(step => {
        const modId = step.modality_id || step.modality?.id
        const isTb = modId === 'tb500_subq' || (step.modality?.name || '').toLowerCase().includes('tb-500') || (step.modality?.name || '').toLowerCase().includes('tb500')
        const isBpc = modId === 'bpc157_subq' || (step.modality?.name || '').toLowerCase().includes('bpc')
        const targetDays = isBpc ? bpcDays : (isTb ? tbDays : ghDays)
        const slot = isBpc ? 'morning' : (isTb ? 'evening' : 'pre_bed')

        targetDays.forEach(dayOff => {
          const targetDate = new Date(localStartDate)
          targetDate.setDate(localStartDate.getDate() + dayOff)
          const targetDateStr = format(targetDate, 'yyyy-MM-dd')

          tasksToInsert.push({
            local_user_id: localUserId,
            user_protocol_instance_id: isUuidCheck(instanceId) ? instanceId : null,
            protocol_step_id: isUuidCheck(step.id) ? step.id : null,
            modality_id: modId || null,
            scheduled_date: targetDateStr,
            timing_slot: slot,
            status: 'pending',
            execution_details: {
              schedule_config: {
                schedule_mode: 'days_of_week',
                days_of_week: isBpc ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : (isTb ? ['Tue', 'Fri'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']),
                rest_days_between: isTb ? 2 : 0,
                skip_policy: 'roll_forward',
                timing_slot: slot
              }
            }
          })
        })
      })
    } else if (protocolId === 'pt141_oxytocin_intimacy_protocol') {
      // PT-141 & Oxytocin: 2x weekly intimacy sessions (Day 0 & Day 4 of each 7-day week across 12 weeks / 84 days)
      const intimacyDays: number[] = []
      for (let week = 0; week < 12; week++) {
        intimacyDays.push(week * 7 + 0) // Dose 1 (Today / Day 0)
        intimacyDays.push(week * 7 + 4) // Dose 2 (Day 4)
      }

      steps.forEach(step => {
        const modId = step.modality_id || step.modality?.id

        intimacyDays.forEach(dayOff => {
          const targetDate = new Date(localStartDate)
          targetDate.setDate(localStartDate.getDate() + dayOff)
          const targetDateStr = format(targetDate, 'yyyy-MM-dd')

          tasksToInsert.push({
            local_user_id: localUserId,
            user_protocol_instance_id: isUuidCheck(instanceId) ? instanceId : null,
            protocol_step_id: isUuidCheck(step.id) ? step.id : null,
            modality_id: modId || null,
            scheduled_date: targetDateStr,
            timing_slot: 'evening',
            status: 'pending',
            execution_details: {
              schedule_config: {
                schedule_mode: 'days_of_week',
                days_of_week: ['Fri', 'Sat'],
                rest_days_between: 1,
                skip_policy: 'roll_forward',
                timing_slot: 'evening'
              }
            }
          })
        })
      })
    } else if (protocolId === 'sermorelin_ipamorelin_gh_protocol') {
      // Sermorelin & Ipamorelin: 5 on / 2 off Mon-Fri pre_bed for 12 weeks (84 days)
      const ghDays: number[] = []
      for (let week = 0; week < 12; week++) {
        for (let day = 0; day < 5; day++) ghDays.push(week * 7 + day)
      }

      steps.forEach(step => {
        const modId = step.modality_id || step.modality?.id

        ghDays.forEach(dayOff => {
          const targetDate = new Date(localStartDate)
          targetDate.setDate(localStartDate.getDate() + dayOff)
          const targetDateStr = format(targetDate, 'yyyy-MM-dd')

          tasksToInsert.push({
            local_user_id: localUserId,
            user_protocol_instance_id: isUuidCheck(instanceId) ? instanceId : null,
            protocol_step_id: isUuidCheck(step.id) ? step.id : null,
            modality_id: modId || null,
            scheduled_date: targetDateStr,
            timing_slot: 'pre_bed',
            status: 'pending',
            execution_details: {
              schedule_config: {
                schedule_mode: 'days_of_week',
                days_of_week: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                rest_days_between: 0,
                skip_policy: 'roll_forward',
                timing_slot: 'pre_bed'
              }
            }
          })
        })
      })
    } else if (protocolId === 'cjc_ipam_igf1_lr3_anabolic_protocol') {
      // IGF-1 LR3: Mon/Wed/Fri/Sat post-workout midday (42 days / 6 weeks)
      // CJC-1295 & Ipamorelin: 5 on / 2 off Mon-Fri pre_bed (56 days / 8 weeks)
      const igfDays: number[] = []
      for (let week = 0; week < 6; week++) {
        [0, 2, 4, 5].forEach(day => igfDays.push(week * 7 + day))
      }

      const ghDays: number[] = []
      for (let week = 0; week < 8; week++) {
        for (let day = 0; day < 5; day++) ghDays.push(week * 7 + day)
      }

      steps.forEach(step => {
        const modId = step.modality_id || step.modality?.id
        const isIgf = modId === 'igf1_lr3_subq' || (step.modality?.name || '').toLowerCase().includes('igf')
        const targetDays = isIgf ? igfDays : ghDays
        const slot = isIgf ? 'midday' : 'pre_bed'

        targetDays.forEach(dayOff => {
          const targetDate = new Date(localStartDate)
          targetDate.setDate(localStartDate.getDate() + dayOff)
          const targetDateStr = format(targetDate, 'yyyy-MM-dd')

          tasksToInsert.push({
            local_user_id: localUserId,
            user_protocol_instance_id: isUuidCheck(instanceId) ? instanceId : null,
            protocol_step_id: isUuidCheck(step.id) ? step.id : null,
            modality_id: modId || null,
            scheduled_date: targetDateStr,
            timing_slot: slot,
            status: 'pending',
            execution_details: {
              schedule_config: {
                schedule_mode: 'days_of_week',
                days_of_week: isIgf ? ['Mon', 'Wed', 'Fri', 'Sat'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                rest_days_between: isIgf ? 1 : 0,
                skip_policy: 'roll_forward',
                timing_slot: slot
              }
            }
          })
        })
      })
    } else if (protocolId === 'tesamorelin_motsc_visceral_recomp_protocol') {
      // Tesamorelin: Mon-Fri pre_bed for 12 weeks (84 days)
      // MOTS-c: Mon/Wed/Fri morning for 8 weeks (56 days)
      const tesaDays: number[] = []
      for (let week = 0; week < 12; week++) {
        for (let day = 0; day < 5; day++) tesaDays.push(week * 7 + day)
      }

      const motscDays: number[] = []
      for (let week = 0; week < 8; week++) {
        [0, 2, 4].forEach(day => motscDays.push(week * 7 + day))
      }

      steps.forEach(step => {
        const modId = step.modality_id || step.modality?.id
        const isMotsc = modId === 'mots_c_subq' || (step.modality?.name || '').toLowerCase().includes('mots')
        const targetDays = isMotsc ? motscDays : tesaDays
        const slot = isMotsc ? 'morning' : 'pre_bed'

        targetDays.forEach(dayOff => {
          const targetDate = new Date(localStartDate)
          targetDate.setDate(localStartDate.getDate() + dayOff)
          const targetDateStr = format(targetDate, 'yyyy-MM-dd')

          tasksToInsert.push({
            local_user_id: localUserId,
            user_protocol_instance_id: isUuidCheck(instanceId) ? instanceId : null,
            protocol_step_id: isUuidCheck(step.id) ? step.id : null,
            modality_id: modId || null,
            scheduled_date: targetDateStr,
            timing_slot: slot,
            status: 'pending',
            execution_details: {
              schedule_config: {
                schedule_mode: 'days_of_week',
                days_of_week: isMotsc ? ['Mon', 'Wed', 'Fri'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                rest_days_between: isMotsc ? 1 : 0,
                skip_policy: 'roll_forward',
                timing_slot: slot
              }
            }
          })
        })
      })
    } else if (protocolId === 'aod9604_cjc_ipam_fatloss_protocol') {
      // AOD-9604: Daily morning for 8 weeks (56 days)
      // CJC/Ipam: Mon-Fri pre_bed for 8 weeks (56 days)
      const aodDays = Array.from({ length: 56 }, (_, i) => i)
      const ghDays: number[] = []
      for (let week = 0; week < 8; week++) {
        for (let day = 0; day < 5; day++) ghDays.push(week * 7 + day)
      }

      steps.forEach(step => {
        const modId = step.modality_id || step.modality?.id
        const isAod = modId === 'aod9604_subq' || (step.modality?.name || '').toLowerCase().includes('aod')
        const targetDays = isAod ? aodDays : ghDays
        const slot = isAod ? 'morning' : 'pre_bed'

        targetDays.forEach(dayOff => {
          const targetDate = new Date(localStartDate)
          targetDate.setDate(localStartDate.getDate() + dayOff)
          const targetDateStr = format(targetDate, 'yyyy-MM-dd')

          tasksToInsert.push({
            local_user_id: localUserId,
            user_protocol_instance_id: isUuidCheck(instanceId) ? instanceId : null,
            protocol_step_id: isUuidCheck(step.id) ? step.id : null,
            modality_id: modId || null,
            scheduled_date: targetDateStr,
            timing_slot: slot,
            status: 'pending',
            execution_details: {
              schedule_config: {
                schedule_mode: 'days_of_week',
                days_of_week: isAod ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                rest_days_between: 0,
                skip_policy: 'roll_forward',
                timing_slot: slot
              }
            }
          })
        })
      })
    } else if (protocolId === 'retatrutide_tesamorelin_motsc_overhaul_protocol') {
      // Retatrutide: Sundays morning for 16 weeks (112 days)
      // Tesamorelin: Mon-Fri pre_bed for 12 weeks (84 days)
      // MOTS-c: Mon/Wed/Fri morning for 8 weeks (56 days)
      const retaDays: number[] = []
      for (let week = 0; week < 16; week++) retaDays.push(week * 7 + 0)

      const tesaDays: number[] = []
      for (let week = 0; week < 12; week++) {
        for (let day = 0; day < 5; day++) tesaDays.push(week * 7 + day)
      }

      const motscDays: number[] = []
      for (let week = 0; week < 8; week++) {
        [0, 2, 4].forEach(day => motscDays.push(week * 7 + day))
      }

      steps.forEach(step => {
        const modId = step.modality_id || step.modality?.id
        const isReta = modId === 'retatrutide_subq' || (step.modality?.name || '').toLowerCase().includes('retatrutide') || (step.modality?.name || '').toLowerCase().includes('reta')
        const isMotsc = modId === 'mots_c_subq' || (step.modality?.name || '').toLowerCase().includes('mots')
        const targetDays = isReta ? retaDays : (isMotsc ? motscDays : tesaDays)
        const slot = (isReta || isMotsc) ? 'morning' : 'pre_bed'

        targetDays.forEach(dayOff => {
          const targetDate = new Date(localStartDate)
          targetDate.setDate(localStartDate.getDate() + dayOff)
          const targetDateStr = format(targetDate, 'yyyy-MM-dd')

          tasksToInsert.push({
            local_user_id: localUserId,
            user_protocol_instance_id: isUuidCheck(instanceId) ? instanceId : null,
            protocol_step_id: isUuidCheck(step.id) ? step.id : null,
            modality_id: modId || null,
            scheduled_date: targetDateStr,
            timing_slot: slot,
            status: 'pending',
            execution_details: {
              schedule_config: {
                schedule_mode: 'days_of_week',
                days_of_week: isReta ? ['Sun'] : (isMotsc ? ['Mon', 'Wed', 'Fri'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']),
                rest_days_between: isReta ? 6 : (isMotsc ? 1 : 0),
                skip_policy: 'roll_forward',
                timing_slot: slot
              }
            }
          })
        })
      })
    } else if (protocolId === 'ghkcu_bpc157_skin_repair_protocol') {
      // GHK-Cu & BPC-157: Daily morning for 30 days
      const days = Array.from({ length: 30 }, (_, i) => i)

      steps.forEach(step => {
        const modId = step.modality_id || step.modality?.id

        days.forEach(dayOff => {
          const targetDate = new Date(localStartDate)
          targetDate.setDate(localStartDate.getDate() + dayOff)
          const targetDateStr = format(targetDate, 'yyyy-MM-dd')

          tasksToInsert.push({
            local_user_id: localUserId,
            user_protocol_instance_id: isUuidCheck(instanceId) ? instanceId : null,
            protocol_step_id: isUuidCheck(step.id) ? step.id : null,
            modality_id: modId || null,
            scheduled_date: targetDateStr,
            timing_slot: 'morning',
            status: 'pending',
            execution_details: {
              schedule_config: {
                schedule_mode: 'days_of_week',
                days_of_week: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                rest_days_between: 0,
                skip_policy: 'roll_forward',
                timing_slot: 'morning'
              }
            }
          })
        })
      })
    } else if (protocolId === 'aod9604_tesamorelin_lipolysis_protocol') {
      // AOD-9604: Daily morning for 8 weeks (56 days)
      // Tesamorelin: Mon-Fri pre_bed for 8 weeks (56 days)
      const aodDays = Array.from({ length: 56 }, (_, i) => i)
      const tesaDays: number[] = []
      for (let week = 0; week < 8; week++) {
        for (let day = 0; day < 5; day++) tesaDays.push(week * 7 + day)
      }

      steps.forEach(step => {
        const modId = step.modality_id || step.modality?.id
        const isAod = modId === 'aod9604_subq' || (step.modality?.name || '').toLowerCase().includes('aod')
        const targetDays = isAod ? aodDays : tesaDays
        const slot = isAod ? 'morning' : 'pre_bed'

        targetDays.forEach(dayOff => {
          const targetDate = new Date(localStartDate)
          targetDate.setDate(localStartDate.getDate() + dayOff)
          const targetDateStr = format(targetDate, 'yyyy-MM-dd')

          tasksToInsert.push({
            local_user_id: localUserId,
            user_protocol_instance_id: isUuidCheck(instanceId) ? instanceId : null,
            protocol_step_id: isUuidCheck(step.id) ? step.id : null,
            modality_id: modId || null,
            scheduled_date: targetDateStr,
            timing_slot: slot,
            status: 'pending',
            execution_details: {
              schedule_config: {
                schedule_mode: 'days_of_week',
                days_of_week: isAod ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                rest_days_between: 0,
                skip_policy: 'roll_forward',
                timing_slot: slot
              }
            }
          })
        })
      })
    } else if (protocolId === 'pt141_kisspeptin10_sexual_health_protocol') {
      // PT-141 & Kisspeptin-10: 2x weekly intimacy sessions (Day 0 & Day 4 of each 7-day week for 8 weeks)
      const sexDays: number[] = []
      for (let week = 0; week < 8; week++) {
        sexDays.push(week * 7 + 0) // Dose 1 (Today / Day 0)
        sexDays.push(week * 7 + 4) // Dose 2 (Day 4)
      }

      steps.forEach(step => {
        const modId = step.modality_id || step.modality?.id

        sexDays.forEach(dayOff => {
          const targetDate = new Date(localStartDate)
          targetDate.setDate(localStartDate.getDate() + dayOff)
          const targetDateStr = format(targetDate, 'yyyy-MM-dd')

          tasksToInsert.push({
            local_user_id: localUserId,
            user_protocol_instance_id: isUuidCheck(instanceId) ? instanceId : null,
            protocol_step_id: isUuidCheck(step.id) ? step.id : null,
            modality_id: modId || null,
            scheduled_date: targetDateStr,
            timing_slot: 'evening',
            status: 'pending',
            execution_details: {
              schedule_config: {
                schedule_mode: 'days_of_week',
                days_of_week: ['Fri', 'Sat'],
                rest_days_between: 1,
                skip_policy: 'roll_forward',
                timing_slot: 'evening'
              }
            }
          })
        })
      })
    } else if (protocolId === 'ta1_kpv_immune_balance_protocol') {
      // TA-1: 2x weekly (Day 0 & Day 3 of each 7-day week for 8 weeks / 56 days)
      // KPV: Daily morning for 8 weeks (56 days)
      const ta1Days: number[] = []
      for (let week = 0; week < 8; week++) {
        ta1Days.push(week * 7 + 0)
        ta1Days.push(week * 7 + 3)
      }
      const kpvDays = Array.from({ length: 56 }, (_, i) => i)

      steps.forEach(step => {
        const modId = step.modality_id || step.modality?.id
        const isTa1 = modId === 'ta1_subq' || (step.modality?.name || '').toLowerCase().includes('ta1') || (step.modality?.name || '').toLowerCase().includes('thymosin')
        const targetDays = isTa1 ? ta1Days : kpvDays

        targetDays.forEach(dayOff => {
          const targetDate = new Date(localStartDate)
          targetDate.setDate(localStartDate.getDate() + dayOff)
          const targetDateStr = format(targetDate, 'yyyy-MM-dd')

          tasksToInsert.push({
            local_user_id: localUserId,
            user_protocol_instance_id: isUuidCheck(instanceId) ? instanceId : null,
            protocol_step_id: isUuidCheck(step.id) ? step.id : null,
            modality_id: modId || null,
            scheduled_date: targetDateStr,
            timing_slot: 'morning',
            status: 'pending',
            execution_details: {
              schedule_config: {
                schedule_mode: 'days_of_week',
                days_of_week: isTa1 ? ['Mon', 'Thu'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                rest_days_between: isTa1 ? 2 : 0,
                skip_policy: 'roll_forward',
                timing_slot: 'morning'
              }
            }
          })
        })
      })
    } else if (protocolId === 'bpc_kpv_ta1_gut_immune_protocol') {
      // BPC-157 & KPV: Daily morning for 8 weeks (56 days)
      // TA-1: 2x weekly (Day 0 & Day 3 of each 7-day week for 8 weeks / 56 days)
      const ta1Days: number[] = []
      for (let week = 0; week < 8; week++) {
        ta1Days.push(week * 7 + 0)
        ta1Days.push(week * 7 + 3)
      }
      const dailyDays = Array.from({ length: 56 }, (_, i) => i)

      steps.forEach(step => {
        const modId = step.modality_id || step.modality?.id
        const isTa1 = modId === 'ta1_subq' || (step.modality?.name || '').toLowerCase().includes('ta1') || (step.modality?.name || '').toLowerCase().includes('thymosin')
        const targetDays = isTa1 ? ta1Days : dailyDays

        targetDays.forEach(dayOff => {
          const targetDate = new Date(localStartDate)
          targetDate.setDate(localStartDate.getDate() + dayOff)
          const targetDateStr = format(targetDate, 'yyyy-MM-dd')

          tasksToInsert.push({
            local_user_id: localUserId,
            user_protocol_instance_id: isUuidCheck(instanceId) ? instanceId : null,
            protocol_step_id: isUuidCheck(step.id) ? step.id : null,
            modality_id: modId || null,
            scheduled_date: targetDateStr,
            timing_slot: 'morning',
            status: 'pending',
            execution_details: {
              schedule_config: {
                schedule_mode: 'days_of_week',
                days_of_week: isTa1 ? ['Mon', 'Thu'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                rest_days_between: isTa1 ? 2 : 0,
                skip_policy: 'roll_forward',
                timing_slot: 'morning'
              }
            }
          })
        })
      })
    } else if (protocolId === 'ghkcu_epitalon_skin_longevity_protocol') {
      // GHK-Cu: Daily morning for 30 days
      // Epitalon: Daily pre_bed for 15 days
      const ghkDays = Array.from({ length: 30 }, (_, i) => i)
      const epiDays = Array.from({ length: 15 }, (_, i) => i)

      steps.forEach(step => {
        const modId = step.modality_id || step.modality?.id
        const isEpi = modId === 'epitalon_subq' || (step.modality?.name || '').toLowerCase().includes('epitalon') || (step.modality?.name || '').toLowerCase().includes('epithalon')
        const targetDays = isEpi ? epiDays : ghkDays
        const slot = isEpi ? 'pre_bed' : 'morning'

        targetDays.forEach(dayOff => {
          const targetDate = new Date(localStartDate)
          targetDate.setDate(localStartDate.getDate() + dayOff)
          const targetDateStr = format(targetDate, 'yyyy-MM-dd')

          tasksToInsert.push({
            local_user_id: localUserId,
            user_protocol_instance_id: isUuidCheck(instanceId) ? instanceId : null,
            protocol_step_id: isUuidCheck(step.id) ? step.id : null,
            modality_id: modId || null,
            scheduled_date: targetDateStr,
            timing_slot: slot,
            status: 'pending',
            execution_details: {
              schedule_config: {
                schedule_mode: 'days_of_week',
                days_of_week: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                rest_days_between: 0,
                skip_policy: 'roll_forward',
                timing_slot: slot
              }
            }
          })
        })
      })
    } else if (protocolId === 'photonic_ghkcu_red_light_protocol') {
      // GHK-Cu topical: Daily evening (30 days)
      // Red light: 5 on / 2 off evening (Days 0, 1, 2, 3, 4 of each week)
      // Collagen: Daily morning (30 days)
      steps.forEach(step => {
        const modId = step.modality_id || step.modality?.id
        const isRedLight = modId === 'red_light_therapy' || (step.modality?.name || '').toLowerCase().includes('red light')
        const isCollagen = modId === 'collagen_peptides' || (step.modality?.name || '').toLowerCase().includes('collagen')
        const slot = isCollagen ? 'morning' : 'evening'

        for (let i = 0; i < 30; i++) {
          if (isRedLight && (i % 7 >= 5)) {
            // Rest 2 days after 5 days on
            continue
          }

          const targetDate = new Date(localStartDate)
          targetDate.setDate(localStartDate.getDate() + i)
          const targetDateStr = format(targetDate, 'yyyy-MM-dd')
          tasksToInsert.push({
            local_user_id: localUserId,
            user_protocol_instance_id: isUuidCheck(instanceId) ? instanceId : null,
            protocol_step_id: isUuidCheck(step.id) ? step.id : null,
            modality_id: modId || null,
            scheduled_date: targetDateStr,
            timing_slot: slot,
            status: 'pending',
            execution_details: {
              schedule_config: {
                schedule_mode: 'days_of_week',
                days_of_week: isRedLight ? ['Mon', 'Tue', 'Wed', 'Fri', 'Sun'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                rest_days_between: 0,
                skip_policy: 'roll_forward',
                timing_slot: slot
              }
            }
          })
        }
      })
    } else if (protocolId === 'wolverine_thermal_recovery_protocol') {
      // BPC-157: Daily morning (30 days)
      // TB-500: 2x weekly evening (Days 0, 3 of each week)
      // Sauna: 4x weekly evening (Days 0, 2, 4, 6 of each week)
      // Cold plunge: 4x weekly evening (Days 0, 2, 4, 6 of each week)
      steps.forEach(step => {
        const modId = step.modality_id || step.modality?.id
        const isTb = modId === 'tb500_subq' || (step.modality?.name || '').toLowerCase().includes('tb-500')
        const isSauna = modId === 'sauna_exposure' || (step.modality?.name || '').toLowerCase().includes('sauna')
        const isCold = modId === 'cold_water_immersion' || (step.modality?.name || '').toLowerCase().includes('cold')
        const isBpc = modId === 'bpc157_subq' || (step.modality?.name || '').toLowerCase().includes('bpc-157')
        const slot = isBpc ? 'morning' : 'evening'

        for (let i = 0; i < 30; i++) {
          if (isTb && !(i % 7 === 0 || i % 7 === 3)) continue
          if ((isSauna || isCold) && !(i % 7 === 0 || i % 7 === 2 || i % 7 === 4 || i % 7 === 6)) continue

          const targetDate = new Date(localStartDate)
          targetDate.setDate(localStartDate.getDate() + i)
          const targetDateStr = format(targetDate, 'yyyy-MM-dd')
          tasksToInsert.push({
            local_user_id: localUserId,
            user_protocol_instance_id: isUuidCheck(instanceId) ? instanceId : null,
            protocol_step_id: isUuidCheck(step.id) ? step.id : null,
            modality_id: modId || null,
            scheduled_date: targetDateStr,
            timing_slot: slot,
            status: 'pending',
            execution_details: {
              schedule_config: {
                schedule_mode: 'days_of_week',
                days_of_week: isTb ? ['Tue', 'Fri'] : (isSauna || isCold) ? ['Mon', 'Wed', 'Fri', 'Sat'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                rest_days_between: 0,
                skip_policy: 'roll_forward',
                timing_slot: slot
              }
            }
          })
        }
      })
    } else if (protocolId === 'mots_c_zone2_mitochondrial_protocol') {
      // MOTS-c: 3x weekly morning (Days 0, 2, 4 of each week)
      // Zone 2: 4x weekly morning (Days 0, 2, 4, 6 of each week)
      // Fasting 16:8: Daily morning (30 days)
      steps.forEach(step => {
        const modId = step.modality_id || step.modality?.id
        const isMotsc = modId === 'mots_c_subq' || (step.modality?.name || '').toLowerCase().includes('mots-c')
        const isZone2 = modId === 'zone_2_cardio' || (step.modality?.name || '').toLowerCase().includes('zone 2')

        for (let i = 0; i < 30; i++) {
          if (isMotsc && !(i % 7 === 0 || i % 7 === 2 || i % 7 === 4)) continue
          if (isZone2 && !(i % 7 === 0 || i % 7 === 2 || i % 7 === 4 || i % 7 === 6)) continue

          const targetDate = new Date(localStartDate)
          targetDate.setDate(localStartDate.getDate() + i)
          const targetDateStr = format(targetDate, 'yyyy-MM-dd')
          tasksToInsert.push({
            local_user_id: localUserId,
            user_protocol_instance_id: isUuidCheck(instanceId) ? instanceId : null,
            protocol_step_id: isUuidCheck(step.id) ? step.id : null,
            modality_id: modId || null,
            scheduled_date: targetDateStr,
            timing_slot: 'morning',
            status: 'pending',
            execution_details: {
              schedule_config: {
                schedule_mode: 'days_of_week',
                days_of_week: isMotsc ? ['Mon', 'Wed', 'Fri'] : isZone2 ? ['Mon', 'Wed', 'Fri', 'Sat'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                rest_days_between: 0,
                skip_policy: 'roll_forward',
                timing_slot: 'morning'
              }
            }
          })
        }
      })
    } else if (protocolId === 'cjc_ipam_anabolic_sleep_protocol') {
      // CJC / Ipam: 5 on / 2 off pre_bed (Days 0, 1, 2, 3, 4 of each week)
      // Blue blockers: Daily evening (30 days)
      // Mouth tape: Daily pre_bed (30 days)
      steps.forEach(step => {
        const modId = step.modality_id || step.modality?.id
        const isCjcIpam = modId === 'cjc1295_no_dac_subq' || modId === 'ipamorelin_subq' || (step.modality?.name || '').toLowerCase().includes('cjc') || (step.modality?.name || '').toLowerCase().includes('ipamorelin')
        const isBlueBlock = modId === 'blue_light_blocking' || (step.modality?.name || '').toLowerCase().includes('blue light')
        const slot = isBlueBlock ? 'evening' : 'pre_bed'

        for (let i = 0; i < 30; i++) {
          if (isCjcIpam && (i % 7 >= 5)) continue // 5 on / 2 off

          const targetDate = new Date(localStartDate)
          targetDate.setDate(localStartDate.getDate() + i)
          const targetDateStr = format(targetDate, 'yyyy-MM-dd')
          tasksToInsert.push({
            local_user_id: localUserId,
            user_protocol_instance_id: isUuidCheck(instanceId) ? instanceId : null,
            protocol_step_id: isUuidCheck(step.id) ? step.id : null,
            modality_id: modId || null,
            scheduled_date: targetDateStr,
            timing_slot: slot,
            status: 'pending',
            execution_details: {
              schedule_config: {
                schedule_mode: 'days_of_week',
                days_of_week: isCjcIpam ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                rest_days_between: 0,
                skip_policy: 'roll_forward',
                timing_slot: slot
              }
            }
          })
        }
      })
    } else if (protocolId === 'semax_selank_cognitive_flow_protocol') {
      // Semax: 5 on / 2 off morning (Days 0, 1, 2, 3, 4 of each week)
      // Selank: 5 on / 2 off midday (Days 0, 1, 2, 3, 4 of each week)
      // Sunlight: Daily morning (30 days)
      // Optic Flow: 5 on / 2 off midday (Days 0, 1, 2, 3, 4 of each week)
      steps.forEach(step => {
        const modId = step.modality_id || step.modality?.id
        const isSemax = modId === 'semax_subq' || (step.modality?.name || '').toLowerCase().includes('semax')
        const isSelank = modId === 'selank_subq' || (step.modality?.name || '').toLowerCase().includes('selank')
        const isSunlight = modId === 'morning_sunlight' || (step.modality?.name || '').toLowerCase().includes('sunlight')
        const slot = (isSemax || isSunlight) ? 'morning' : 'midday'

        for (let i = 0; i < 30; i++) {
          if ((isSemax || isSelank) && (i % 7 >= 5)) continue // 5 on / 2 off

          const targetDate = new Date(localStartDate)
          targetDate.setDate(localStartDate.getDate() + i)
          const targetDateStr = format(targetDate, 'yyyy-MM-dd')
          tasksToInsert.push({
            local_user_id: localUserId,
            user_protocol_instance_id: isUuidCheck(instanceId) ? instanceId : null,
            protocol_step_id: isUuidCheck(step.id) ? step.id : null,
            modality_id: modId || null,
            scheduled_date: targetDateStr,
            timing_slot: slot,
            status: 'pending',
            execution_details: {
              schedule_config: {
                schedule_mode: 'days_of_week',
                days_of_week: (isSemax || isSelank) ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                rest_days_between: 0,
                skip_policy: 'roll_forward',
                timing_slot: slot
              }
            }
          })
        }
      })
    } else {
      // Standard protocol step ingestion
      steps.forEach(step => {
        let slot = step.timing_slot || step.stack_group
        
        if (!slot) {
          const protocolName = (protocolObj?.name || step.protocol?.name || '').toLowerCase()
          const timingText = (step.modality?.timing_summary || '').toLowerCase()
          const combined = protocolName + ' ' + timingText

          if (combined.includes('morning') || combined.includes('wake')) {
            slot = 'morning'
          } else if (combined.includes('evening') || combined.includes('bed') || combined.includes('sleep') || combined.includes('night')) {
            slot = 'evening'
          } else if (combined.includes('midday') || combined.includes('afternoon') || combined.includes('lunch')) {
            slot = 'midday'
          } else {
            slot = 'anytime'
          }
        }

        const modId = step.modality_id || step.modality?.id
        const modalityName = (step.modality?.name || '').toLowerCase()
        const freqText = (step.modality?.frequency || '').toLowerCase()
        const pattern = step.frequency_rule?.toLowerCase() || step.modality?.schedule_pattern?.toLowerCase() || freqText || modalityName || ''
        const cadence = step.modality?.cadence_layer || 'daily'
        
        let stepDays = step.modality?.cadence_interval_days || 1

        if (!step.modality?.cadence_interval_days) {
          const isPulse = pattern.includes('pulse') || pattern.includes('cycled') || pattern.includes('senolytic') || pattern.includes('fisetin') || pattern.includes('dasatinib') || pattern.includes('quercetin')
          if (pattern.includes('monthly') || cadence === 'monthly' || isPulse) stepDays = 30
          else if ((pattern.includes('weekly') && !pattern.match(/\d+-\d+x\s*weekly/)) || cadence === 'infrequent' || pattern.includes('1x_week')) stepDays = 7
          else if (pattern.includes('every_other_day')) stepDays = 2
        }

        for (let i = 0; i < 30; i += stepDays) {
          const targetDate = new Date(localStartDate)
          targetDate.setDate(localStartDate.getDate() + i)
          const targetDateStr = format(targetDate, 'yyyy-MM-dd')

          tasksToInsert.push({
            local_user_id: localUserId,
            user_protocol_instance_id: isUuidCheck(instanceId) ? instanceId : null,
            protocol_step_id: isUuidCheck(step.id) ? step.id : null,
            modality_id: modId || null,
            scheduled_date: targetDateStr,
            timing_slot: slot,
            status: 'pending'
          })
        }
      })
    }
  } else {
    // Ultimate Fallback: Create a direct daily task entry for today's date
    tasksToInsert.push({
      local_user_id: localUserId,
      user_protocol_instance_id: isUuidCheck(instanceId) ? instanceId : null,
      scheduled_date: date,
      timing_slot: 'anytime',
      status: 'pending'
    })
  }

  if (tasksToInsert.length > 0) {
    const sanitizedTasks = tasksToInsert.map(t => ({
      local_user_id: t.local_user_id,
      user_protocol_instance_id: isUuidCheck(t.user_protocol_instance_id) ? t.user_protocol_instance_id : null,
      protocol_step_id: isUuidCheck(t.protocol_step_id) ? t.protocol_step_id : null,
      modality_id: t.modality_id || null,
      scheduled_date: t.scheduled_date,
      timing_slot: t.timing_slot || 'anytime',
      status: 'pending',
      execution_details: t.execution_details || undefined
    }))

    const { error } = await supabase
      .from('daily_protocol_tasks')
      .insert(sanitizedTasks)
      
    if (error) {
      console.warn('First insert attempt warning, falling back to minimal task schema:', error?.message || error)
      
      const cleanTasks = sanitizedTasks.map(t => ({
        local_user_id: t.local_user_id,
        modality_id: t.modality_id,
        scheduled_date: t.scheduled_date,
        timing_slot: t.timing_slot,
        status: 'pending',
        execution_details: t.execution_details
      }))

      const { error: fallbackErr } = await supabase
        .from('daily_protocol_tasks')
        .insert(cleanTasks)

      if (fallbackErr) {
        console.warn('Error adding protocol tasks fallback, attempting individual task inserts:', fallbackErr?.message || fallbackErr)
        let anySuccess = false
        for (const task of cleanTasks) {
          const { error: singleErr } = await supabase
            .from('daily_protocol_tasks')
            .insert(task)
          if (!singleErr) {
            anySuccess = true
          }
        }
        return anySuccess
      }
    }
  }
  return true
}

export async function completeDailySession(id: string) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('daily_sessions')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return null
  return data
}

export async function skipDailySession(id: string) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('daily_sessions')
    .update({ status: 'skipped', skipped_at: new Date().toISOString() })
    .eq('id', id)
    .select()
  if (error) return null
  return data
}

export async function updateDailyTaskStatus(
  taskId: string, 
  status: string, 
  reason?: string, 
  adherenceValue?: number,
  completedAt?: string,
  executionMetrics?: any,
  executionDetails?: any
) {
  if (!supabase) return null
  const isUuid = taskId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(taskId)
  if (!isUuid) {
    console.warn(`[updateDailyTaskStatus] Skipped non-UUID task ID: ${taskId}`)
    return null
  }

  const updateData: any = { status }
  if (reason !== undefined) updateData.status_reason = reason
  if (adherenceValue !== undefined) updateData.adherence_value = adherenceValue
  if (completedAt !== undefined) updateData.completed_at = completedAt
  if (executionMetrics !== undefined) updateData.execution_metrics = executionMetrics
  if (executionDetails !== undefined) updateData.execution_details = executionDetails
  
  const { data, error } = await supabase
    .from('daily_protocol_tasks')
    .update(updateData)
    .eq('id', taskId)
    .select()
    .single()

  if (error) {
    console.error('Error updating task status:', error)
    return null
  }
  clearUserHistoryCache()
  return data
}

export async function saveOutcomeObservation(
  localUserId: string, 
  outcomeId: string, 
  phase: string, 
  value: number,
  checkinDate?: string,
  taskId?: string,
  sessionId?: string,
  notes?: string
) {
  if (!supabase) return null
  const isUuid = taskId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(taskId)

  const localToday = format(new Date(), 'yyyy-MM-dd')

  const { data, error } = await supabase
    .from('outcome_observations')
    .insert([{ 
      local_user_id: localUserId, 
      session_id: sessionId || null, 
      task_id: isUuid ? taskId : null,
      checkin_date: checkinDate || localToday,
      outcome_id: outcomeId, 
      phase, 
      value_0_10: value,
      notes: notes || null
    }])
    .select()
    .single()
    
  if (error) {
    console.error('Error saving outcome observation:', error.message || JSON.stringify(error))
    return null
  }
  return data
}

export type BatchObservationInput = {
  localUserId: string
  outcomeId: string
  phase: string
  value: number
  checkinDate?: string
  taskId?: string
  sessionId?: string
  modalityId?: string
  notes?: string
}

export async function saveBatchOutcomeObservations(inputs: BatchObservationInput[]) {
  if (!inputs || inputs.length === 0) return []
  const localToday = format(new Date(), 'yyyy-MM-dd')

  const dbRows = inputs.map(inp => {
    const isUuid = inp.taskId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(inp.taskId))
    return {
      local_user_id: inp.localUserId,
      session_id: inp.sessionId || null,
      task_id: isUuid ? inp.taskId : null,
      checkin_date: inp.checkinDate || localToday,
      outcome_id: inp.outcomeId,
      phase: inp.phase,
      value_0_10: inp.value,
      notes: inp.notes || null
    }
  })

  // Save to localStorage cache for instant offline retrieval with modality_id metadata
  if (typeof window !== 'undefined' && inputs[0]?.localUserId) {
    try {
      const storageKey = `levl_outcome_obs_${inputs[0].localUserId}`
      const existingRaw = localStorage.getItem(storageKey)
      const existing = existingRaw ? JSON.parse(existingRaw) : []
      const clientRows = inputs.map((inp, idx) => ({ ...dbRows[idx], modality_id: inp.modalityId || null }))
      const merged = [...existing, ...clientRows].filter((r: any) => Boolean(r.modality_id || r.task_id))
      localStorage.setItem(storageKey, JSON.stringify(merged.slice(-500)))
    } catch (e) {
      console.warn('Error caching observations to localStorage:', e)
    }
  }

  if (!supabase) return dbRows

  try {
    const { data, error } = await supabase
      .from('outcome_observations')
      .insert(dbRows)
      .select()

    if (error) {
      console.warn('Supabase outcome observation insert notice:', error?.message || error)
      return dbRows
    }
    clearUserHistoryCache()
    return data || dbRows
  } catch (e) {
    console.warn('Caught outcome observation insert exception:', e)
    return dbRows
  }
}

export async function getBatchTaskOutcomeObservations(localUserId: string, taskIds: string[], checkinDate?: string) {
  if (!supabase || !taskIds || taskIds.length === 0) return []
  let query = supabase
    .from('outcome_observations')
    .select('*')
    .eq('local_user_id', localUserId)
    .in('task_id', taskIds)

  if (checkinDate) {
    query = query.eq('checkin_date', checkinDate)
  }

  const { data, error } = await query
  if (error) return []
  return data || []
}

export async function getOutcomeObservations(localUserId: string, date: string, phase?: string) {
  if (!supabase) return []
  
  let query = supabase
    .from('outcome_observations')
    .select('*')
    .eq('local_user_id', localUserId)
    .eq('checkin_date', date)
    
  if (phase) {
    query = query.eq('phase', phase)
  }
  
  const { data, error } = await query
  if (error) return []
  return data
}

export async function getTaskOutcomeObservations(localUserId: string, taskId: string, checkinDate?: string) {
  if (!supabase) return []
  let query = supabase
    .from('outcome_observations')
    .select('*')
    .eq('local_user_id', localUserId)
    .eq('task_id', taskId)

  if (checkinDate) {
    query = query.eq('checkin_date', checkinDate)
  }

  const { data, error } = await query
  if (error) return []
  return data || []
}

export async function getDailyWellbeingCheckin(localUserId: string, date: string): Promise<DailyWellbeingCheckin | null> {
  let cached: any = null
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(`levl_wellbeing_${localUserId}_${date}`)
      if (raw) cached = JSON.parse(raw)
    } catch (e) {}
  }

  if (!supabase) return cached

  const { data, error } = await supabase
    .from('daily_wellbeing_checkins')
    .select('*')
    .eq('local_user_id', localUserId)
    .eq('checkin_date', date)
    .maybeSingle()

  if (error || !data) return cached

  const row = { ...data } as any
  let parsedNotes: any = {}
  if (row.notes) {
    try {
      parsedNotes = JSON.parse(row.notes)
    } catch (e) {}
  }

  if (!row.last_food_time && parsedNotes.last_food_time) {
    row.last_food_time = parsedNotes.last_food_time
  }
  if (!row.custom_outcomes_jsonb) {
    row.custom_outcomes_jsonb = parsedNotes.custom_outcomes_jsonb || parsedNotes.custom_outcomes || {}
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`levl_wellbeing_${localUserId}_${date}`, JSON.stringify(row))
    } catch (e) {}
  }

  return row as DailyWellbeingCheckin
}

export async function getDailyWellbeingHistory(localUserId: string, startDate: string, endDate: string): Promise<DailyWellbeingCheckin[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('daily_wellbeing_checkins')
    .select('*')
    .eq('local_user_id', localUserId)
    .gte('checkin_date', startDate)
    .lte('checkin_date', endDate)

  if (error || !data) return []

  return data.map((d: any) => {
    const row = { ...d }
    let parsedNotes: any = {}
    if (row.notes) {
      try { parsedNotes = JSON.parse(row.notes) } catch (e) {}
    }
    if (!row.last_food_time && parsedNotes.last_food_time) row.last_food_time = parsedNotes.last_food_time
    if (!row.custom_outcomes_jsonb) row.custom_outcomes_jsonb = parsedNotes.custom_outcomes_jsonb || parsedNotes.custom_outcomes || {}
    return row as DailyWellbeingCheckin
  })
}

export async function getOutcomeObservationsHistory(localUserId: string, startDate: string, endDate: string) {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('outcome_observations')
    .select('*')
    .eq('local_user_id', localUserId)
    .gte('checkin_date', startDate)
    .lte('checkin_date', endDate)

  if (error) return []
  return data
}

export async function saveDailyWellbeingCheckin(
  localUserId: string, 
  date: string, 
  mood?: number, 
  energy?: number, 
  stress?: number, 
  sleep?: number, 
  sleepScore?: number, 
  lastFoodTime?: string, 
  customOutcomes?: any
) {
  // Fetch existing record to merge so Morning and Nightly check-in data NEVER overwrite each other with null
  let existing: any = null
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(`levl_wellbeing_${localUserId}_${date}`)
      if (raw) existing = JSON.parse(raw)
    } catch (e) {}
  }

  if (supabase && !existing) {
    const { data } = await supabase
      .from('daily_wellbeing_checkins')
      .select('*')
      .eq('local_user_id', localUserId)
      .eq('checkin_date', date)
      .maybeSingle()
    if (data) existing = data
  }

  let existingNotesObj: any = {}
  if (existing?.notes) {
    try {
      existingNotesObj = JSON.parse(existing.notes)
    } catch (e) {
      existingNotesObj = { plain_notes: existing.notes }
    }
  }

  const newLastFoodTime = lastFoodTime !== undefined ? lastFoodTime : (existing?.last_food_time || existingNotesObj.last_food_time || null)
  const mergedCustomOutcomes = {
    ...(existing?.custom_outcomes_jsonb || existingNotesObj.custom_outcomes_jsonb || existingNotesObj.custom_outcomes || {}),
    ...(customOutcomes || {})
  }

  const notesMeta = {
    ...existingNotesObj,
    last_food_time: newLastFoodTime,
    custom_outcomes_jsonb: mergedCustomOutcomes
  }

  const payload: any = {
    local_user_id: localUserId,
    checkin_date: date,
    mood_0_10: mood !== undefined ? mood : existing?.mood_0_10 ?? null,
    energy_0_10: energy !== undefined ? energy : existing?.energy_0_10 ?? null,
    stress_0_10: stress !== undefined ? stress : existing?.stress_0_10 ?? null,
    subjective_sleep_0_10: sleep !== undefined ? sleep : existing?.subjective_sleep_0_10 ?? null,
    sleep_score_0_100: sleepScore !== undefined ? sleepScore : existing?.sleep_score_0_100 ?? null,
    notes: JSON.stringify(notesMeta)
  }

  const result = { ...payload, last_food_time: newLastFoodTime, custom_outcomes_jsonb: mergedCustomOutcomes }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`levl_wellbeing_${localUserId}_${date}`, JSON.stringify(result))
      if (payload.mood_0_10 != null || payload.energy_0_10 != null || payload.subjective_sleep_0_10 != null) {
        localStorage.setItem(`levl_checkin_saved_${date}`, 'true')
      }
    } catch (e) {}
  }

  if (!supabase) return result

  const { data, error } = await supabase
    .from('daily_wellbeing_checkins')
    .upsert(payload, { onConflict: 'local_user_id,checkin_date' })
    .select()
    .single()

  if (error) {
    console.error('Error saving daily wellbeing checkin:', error)
    return result
  }

  const dbResult = { ...data } as any
  dbResult.last_food_time = newLastFoodTime
  dbResult.custom_outcomes_jsonb = mergedCustomOutcomes

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`levl_wellbeing_${localUserId}_${date}`, JSON.stringify(dbResult))
    } catch (e) {}
  }

  return dbResult as DailyWellbeingCheckin
}

export async function saveModalityOverride(localUserId: string, modalityId: string, overrideType: string, patchJsonb: any, confidence: number) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('user_modality_overrides')
    .upsert({
      user_id: localUserId,
      modality_id: modalityId,
      override_type: overrideType,
      patch_jsonb: patchJsonb,
      status: 'active',
      confidence: confidence
    }, { onConflict: 'user_id,modality_id,override_type' })
    .select()
    .single()
    
  if (error) {
    console.error('Error saving modality override:', error)
    return null
  }
  return data
}

export async function getUserModalityOverrides(localUserId: string, overrideType?: string) {
  if (!supabase) return []
  let query = supabase
    .from('user_modality_overrides')
    .select('*')
    .eq('user_id', localUserId)
    .eq('status', 'active')
    
  if (overrideType) {
    query = query.eq('override_type', overrideType)
  }
  
  const { data, error } = await query
  if (error) return []
  return data
}

// ------------------------------------------------------------------
// AI Drafts & Manual Creation
// ------------------------------------------------------------------

export async function getDraftModalities(localUserId: string): Promise<Modality[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('modalities')
    .select('*')
    .eq('local_user_id', localUserId)
    .in('status', ['draft_ai_generated', 'draft_manual'])
  
  if (error) return []
  return data as Modality[]
}

export async function getDraftProtocols(localUserId: string): Promise<Protocol[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('protocols')
    .select('*, steps:protocol_steps(*, modality:modalities(*))')
    .eq('local_user_id', localUserId)
    .in('review_status', ['draft', 'draft_ai_generated', 'draft_manual'])
  
  if (error) return []
  return data as Protocol[]
}

export async function updateModalityDraft(id: string, updates: Partial<Modality>) {
  if (!supabase) return null
  clearModalitiesCache()
  const { data, error } = await supabase
    .from('modalities')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) {
    console.error('Error updating modality:', error)
    return null
  }
  return data as Modality
}

export async function updateProtocolDraft(id: string, updates: Partial<Protocol>, steps?: Partial<ProtocolStep>[]) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('protocols')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) {
    console.error('Error updating protocol:', error)
    return null
  }

  if (steps && steps.length > 0) {
    // Basic sync: delete old steps and re-insert
    await supabase.from('protocol_steps').delete().eq('protocol_id', id)
    const stepsToInsert = steps.map((s, idx) => ({
      protocol_id: id,
      modality_id: s.modality_id,
      dose_text: s.dose_text,
      timing_slot: s.timing_slot,
      notes: s.notes,
      display_order: idx
    }))
    await supabase.from('protocol_steps').insert(stepsToInsert)
  }

  return data as Protocol
}

export async function publishModalityGlobally(id: string) {
  if (!supabase) return false
  const { error } = await supabase
    .from('modalities')
    .update({ visibility: 'pending_review' })
    .eq('id', id)
  
  if (error) {
    console.error('Error publishing globally:', error)
    return false
  }
  return true
}

export async function publishProtocolGlobally(id: string) {
  if (!supabase) return false
  const { error } = await supabase
    .from('protocols')
    .update({ visibility: 'pending_review' })
    .eq('id', id)
  
  if (error) {
    console.error('Error publishing globally:', error)
    return false
  }
  return true
}

export function inferLoggingType(modality: Partial<Modality>): Modality['logging_type'] {
  if (modality.logging_type && modality.logging_type !== 'boolean') {
    return modality.logging_type
  }

  const name = (modality.name || '').toLowerCase()
  const cat = (modality.category || '').toLowerCase()
  const type = (modality.modality_type || '').toLowerCase()

  if (name.includes('sauna') || name.includes('cold') || name.includes('plunge') || name.includes('ice bath') || name.includes('thermal') || type === 'cold_exposure') {
    return 'thermal'
  }
  if (name.includes('breath') || name.includes('sigh') || name.includes('wim hof') || name.includes('meditat') || name.includes('anapanasati')) {
    return 'breathwork'
  }
  if (name.includes('zone 2') || name.includes('vo2 max') || name.includes('cardio') || name.includes('hiit') || name.includes('run') || name.includes('cycle') || cat.includes('cardiovascular')) {
    return 'cardio'
  }
  if (name.includes('resistance') || name.includes('hypertrophy') || name.includes('strength') || name.includes('bfr') || name.includes('weightlift')) {
    return 'strength'
  }
  if (type === 'supplement' || cat.includes('biochemistry') || cat.includes('supplement') || cat.includes('nutrition') || cat.includes('longevity & neurology') || cat.includes('tissue & joint') || cat.includes('inflammation') || cat.includes('cellular energy') || cat.includes('nervous system')) {
    return 'supplement'
  }
  return modality.logging_type || 'boolean'
}

export async function createManualModality(localUserId: string, data: Partial<Modality>) {
  if (!supabase) return null
  const slug = (data.name || 'custom-modality').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(7)
  const logging_type = inferLoggingType(data)
  const { data: newMod, error } = await supabase
    .from('modalities')
    .insert([{
      ...data,
      id: slug,
      slug,
      logging_type,
      local_user_id: localUserId,
      status: 'draft_manual',
      visibility: 'private'
    }])
    .select()
    .single()

  if (error) {
    console.error('Error creating manual modality:', error)
    return null
  }
  return newMod as Modality
}

export async function createManualProtocol(localUserId: string, data: Partial<Protocol>, steps?: Partial<ProtocolStep>[]) {
  if (!supabase) return null
  const id = (data.name || 'custom-protocol').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(7)
  const { data: newProt, error } = await supabase
    .from('protocols')
    .insert([{
      ...data,
      id,
      local_user_id: localUserId,
      author_id: localUserId, // Keep author_id in sync
      review_status: 'draft_manual',
      visibility: 'private'
    }])
    .select()
    .single()

  if (error) {
    console.error('Error creating manual protocol:', error)
    return null
  }

  if (steps && steps.length > 0) {
    const stepsToInsert = steps.map((s, idx) => ({
      protocol_id: id,
      modality_id: s.modality_id,
      dose_text: s.dose_text,
      timing_slot: s.timing_slot,
      notes: s.notes,
      display_order: idx
    }))
    await supabase.from('protocol_steps').insert(stepsToInsert)
  }

  return newProt as Protocol
}

export async function updateBenchItemOverride(id: string, customDose: string, customTiming: string, notes?: string) {
  if (!supabase) return null
  const updatePayload: any = { custom_dose: customDose, custom_timing: customTiming }
  if (notes !== undefined) updatePayload.notes = notes

  const { data, error } = await supabase
    .from('user_bench_items')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single()
    
  if (error) {
    console.error('Error updating bench item override:', error)
    return null
  }
  return data
}

export async function upsertBenchItemOverride(localUserId: string, modalityId: string, customDose: string, customTiming: string, notes?: string) {
  if (!supabase) return null
  // Check if exists using maybeSingle
  const { data: existing } = await supabase
    .from('user_bench_items')
    .select('id')
    .eq('local_user_id', localUserId)
    .eq('modality_id', modalityId)
    .maybeSingle()

  if (existing) {
    return updateBenchItemOverride(existing.id, customDose, customTiming, notes)
  } else {
    // Create new
    const { data, error } = await supabase
      .from('user_bench_items')
      .insert([{
        local_user_id: localUserId,
        modality_id: modalityId,
        custom_dose: customDose,
        custom_timing: customTiming,
        notes: notes || '',
        pinned: false,
        created_at: new Date().toISOString()
      }])
      .select()
      .maybeSingle()
    
    if (error) {
      console.error('Error inserting bench item override:', error)
      return null
    }
    return data
  }
}

export async function eliminateModality(
  localUserId: string, 
  modalityId: string, 
  reason: string, 
  currentTaskId?: string,
  selectedReasons: string[] = []
) {
  if (!supabase) return false
  
  // Upsert bench item to eliminated
  const { data: existing } = await supabase
    .from('user_bench_items')
    .select('*')
    .eq('local_user_id', localUserId)
    .eq('modality_id', modalityId)
    .single()

  if (existing) {
    await supabase.from('user_bench_items').update({ 
      status: 'eliminated', 
      personal_notes: reason,
      elimination_reasons: selectedReasons
    }).eq('id', existing.id)
  } else {
    await supabase.from('user_bench_items').insert([{
      local_user_id: localUserId,
      modality_id: modalityId,
      status: 'eliminated',
      personal_notes: reason,
      elimination_reasons: selectedReasons,
      pinned: false
    }])
  }

  // Update all pending daily protocol tasks for this modality
  await supabase
    .from('daily_protocol_tasks')
    .update({ status: 'contraindicated', status_reason: reason })
    .eq('local_user_id', localUserId)
    .eq('modality_id', modalityId)
    .eq('status', 'pending')

  if (currentTaskId) {
    await supabase.from('daily_protocol_tasks').update({ status: 'contraindicated', status_reason: reason }).eq('id', currentTaskId)
  }

  return true
}

export async function moveModalityToBench(localUserId: string, modalityId: string, currentTaskId?: string) {
  if (!supabase || !localUserId || !modalityId) return false

  const { data: existing } = await supabase
    .from('user_bench_items')
    .select('*')
    .eq('local_user_id', localUserId)
    .eq('modality_id', modalityId)
    .maybeSingle()

  if (existing) {
    await supabase.from('user_bench_items').update({ status: 'benched', pinned: false }).eq('id', existing.id)
  } else {
    await supabase.from('user_bench_items').insert([{
      local_user_id: localUserId,
      modality_id: modalityId,
      status: 'benched',
      pinned: false
    }])
  }

  // Update all pending daily protocol tasks for this modality to skipped with status_reason
  await supabase
    .from('daily_protocol_tasks')
    .update({ status: 'skipped', status_reason: 'Moved to Bench' })
    .eq('local_user_id', localUserId)
    .eq('modality_id', modalityId)
    .eq('status', 'pending')

  if (currentTaskId) {
    await supabase
      .from('daily_protocol_tasks')
      .update({ status: 'skipped', status_reason: 'Moved to Bench' })
      .eq('id', currentTaskId)
  }

  return true
}

export async function getBenchItem(localUserId: string, modalityId: string): Promise<UserBenchItem | null> {
  if (!supabase) return null
  const { data } = await supabase
    .from('user_bench_items')
    .select('*')
    .eq('local_user_id', localUserId)
    .eq('modality_id', modalityId)
    .single()
  return data as UserBenchItem | null
}

export async function assessSafetyWithAI(modalityName: string, customDose: string, originalDose: string) {
  try {
    const response = await fetch('/api/assess-safety', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modalityName, customDose, originalDose })
    })
    
    if (!response.ok) {
      throw new Error('Failed to assess safety')
    }
    
    const data = await response.json()
    return data.assessment
  } catch (error) {
    console.error('AI Assessment error:', error)
    return 'Unable to complete AI assessment at this time.'
  }
}

// ------------------------------------------------------------------
// Ad-Hoc Logging
// ------------------------------------------------------------------

export async function searchModalitiesForLogging(localUserId: string, query: string): Promise<Modality[]> {
  if (!supabase) return []
  
  // A real implementation might union Today + Bench + Global.
  // For simplicity, we search the modalities table directly with an ILIKE.
  // We prioritize items that are in the user's bench or today's tasks in the UI, 
  // but we can fetch them all here by matching name/description.
  const { data, error } = await supabase
    .from('modalities')
    .select('*')
    .or(`name.ilike.%${query}%,brief_description.ilike.%${query}%`)
    .limit(20)
    
  if (error) {
    console.error('Error searching for logging:', error)
    return []
  }
  return data as Modality[]
}

export async function logAdHocSession(localUserId: string, modalityId: string, timestamp: string, executionDetails?: any, executionMetrics?: any) {
  if (!supabase) return null
  
  // Determine relative time archetype from the timestamp roughly (for UI sorting if needed)
  const hour = new Date(timestamp).getHours()
  let archetype = 'anytime'
  if (hour >= 5 && hour < 12) archetype = 'morning'
  else if (hour >= 12 && hour < 17) archetype = 'afternoon'
  else if (hour >= 17 && hour < 21) archetype = 'evening'
  else archetype = 'pre_bed'

  const dateStr = new Date(timestamp).toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('daily_protocol_tasks')
    .insert([{
      local_user_id: localUserId,
      modality_id: modalityId,
      scheduled_date: dateStr,
      status: 'completed',
      completed_at: timestamp,
      user_notes: 'Ad-hoc addition',
      timing_slot: archetype,
      execution_details: executionDetails || null,
      execution_metrics: executionMetrics || null
    }])
    .select()
    .single()
    
  if (error) {
    console.error('Error logging ad-hoc session:', error)
    return null
  }
  
  clearUserHistoryCache()
  return data
}

export async function createCustomModality(
  localUserId: string,
  data: {
    name: string
    category?: string
    brief_description?: string
    default_timing_slot?: string
    dose_or_exposure?: string
  }
): Promise<Modality | null> {
  const cleanName = data.name.trim()
  const slug = cleanName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  const id = `custom_${slug}_${Math.random().toString(36).substring(2, 7)}`

  const newMod: Modality = {
    id,
    slug,
    name: cleanName,
    display_name: cleanName,
    category: data.category || 'Other',
    status: 'published',
    visibility: 'user_custom',
    local_user_id: localUserId,
    brief_description: data.brief_description || 'Custom user-created modality',
    default_timing_slot: data.default_timing_slot || 'anytime',
    dose_or_exposure: data.dose_or_exposure || undefined
  }

  if (supabase) {
    const { data: inserted, error } = await supabase
      .from('modalities')
      .insert([newMod])
      .select()
      .single()

    if (error) {
      console.warn('Supabase insert custom modality notice (fallback to local):', error?.message || error)
    }
  }

  // Update in-memory/localStorage catalog cache so it instantly appears
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem('levl_cache_modalities')
      if (cached) {
        const parsed = JSON.parse(cached)
        parsed.data = [newMod, ...(parsed.data || [])]
        localStorage.setItem('levl_cache_modalities', JSON.stringify(parsed))
      }
    } catch (e) {}
  }

  return newMod
}

export async function createDailyTaskWithDetails(
  localUserId: string,
  date: string,
  modalityId: string,
  timingSlot: string = 'anytime',
  status: string = 'pending',
  completedAt?: string,
  executionDetails?: any,
  executionMetrics?: any
) {
  if (!supabase) return null

  const taskRow = {
    local_user_id: localUserId,
    scheduled_date: date,
    modality_id: modalityId,
    timing_slot: timingSlot,
    status: status,
    completed_at: completedAt || (status === 'completed' ? new Date().toISOString() : null),
    execution_details: executionDetails || null,
    execution_metrics: executionMetrics || null,
    user_notes: 'User added modality'
  }

  const { data, error } = await supabase
    .from('daily_protocol_tasks')
    .insert([taskRow])
    .select()
    .single()

  if (error) {
    console.error('Error creating daily task:', error)
    return null
  }
  clearUserHistoryCache()
  return data
}

export interface ModalityScheduleConfig {
  schedule_mode: 'days_of_week' | 'rest_interval' | 'sequence_rotation' | 'specific_dates'
  days_of_week?: string[] // e.g. ['Mon', 'Wed', 'Fri']
  rest_days_between?: number // e.g. 1, 13, 29, 89, 179, 364
  interval_preset?: 'weekly' | 'bi_weekly' | 'monthly' | 'quarterly' | 'bi_annually' | 'annually' | 'custom_days' | 'specific_dates'
  custom_interval_days?: number
  specific_dates?: string[] // e.g. ['2026-08-25', '2026-09-15', '2026-10-30']
  anchor_day?: string // e.g. 'Tue'
  anchor_date?: string // e.g. '2026-08-17'
  is_rolling_rotation?: boolean // true for rolling across weeks, false for locked weekly
  skip_policy: 'fixed' | 'roll_forward' | 'shift_sequence'
  timing_slot: string // e.g. 'afternoon'
  last_completed_date?: string
}

export function deriveAutomaticScheduleConfig(
  modality?: Modality | null,
  step?: ProtocolStep | null,
  task?: DailyProtocolTask | any | null
): ModalityScheduleConfig {
  const mod = modality || task?.protocol_step?.modality || task?.loose_modality
  const pStep = step || task?.protocol_step
  const timingSlot = resolveOptimalTimingSlot(mod, pStep, task?.timing_slot)

  const nameId = ((mod?.name || '') + ' ' + (mod?.id || '') + ' ' + (mod?.slug || '') + ' ' + (task?.modality_id || '')).toLowerCase()
  const freq = (mod?.frequency || pStep?.frequency || '').toLowerCase()
  const timingSummary = (mod?.timing_summary || pStep?.timing_anchor || '').toLowerCase()
  const pattern = (mod?.schedule_pattern || pStep?.frequency_rule || '').toLowerCase()
  const cadence = (mod?.cadence_layer || '').toLowerCase()
  const desc = ((mod?.brief_description || '') + ' ' + (mod?.headline_benefit || '') + ' ' + (pStep?.instructions || '') + ' ' + (pStep?.dose_text || '')).toLowerCase()
  const fullText = `${nameId} ${freq} ${timingSummary} ${pattern} ${cadence} ${desc}`

  // 0. Natural Language Frequency & Cadence Rule Matching
  if (
    fullText.includes('2x weekly') || fullText.includes('2x / week') || fullText.includes('2x/wk') ||
    fullText.includes('twice weekly') || fullText.includes('twice a week') || fullText.includes('2x per week') ||
    fullText.includes('tue/fri') || fullText.includes('tuesday and friday') || fullText.includes('tuesdays & fridays') ||
    nameId.includes('tb500') || nameId.includes('tb-500') || nameId.includes('tb_500') || nameId.includes('thymosin beta')
  ) {
    return {
      schedule_mode: 'days_of_week',
      days_of_week: ['Tue', 'Fri'],
      rest_days_between: 2,
      is_rolling_rotation: true,
      skip_policy: 'roll_forward',
      timing_slot: timingSlot || 'morning'
    }
  }

  if (
    fullText.includes('3-4x') || fullText.includes('3–4x') || fullText.includes('3-4 times') ||
    fullText.includes('3 to 4 times')
  ) {
    return {
      schedule_mode: 'days_of_week',
      days_of_week: ['Mon', 'Wed', 'Fri', 'Sat'],
      rest_days_between: 1,
      is_rolling_rotation: true,
      skip_policy: 'roll_forward',
      timing_slot: timingSlot
    }
  }

  if (
    fullText.includes('3x weekly') || fullText.includes('3x / week') || fullText.includes('3x/wk') ||
    fullText.includes('3x per week') || fullText.includes('3 times a week') || fullText.includes('mon/wed/fri') ||
    fullText.includes('monday, wednesday') || nameId.includes('motsc') || nameId.includes('mots-c')
  ) {
    return {
      schedule_mode: 'days_of_week',
      days_of_week: ['Mon', 'Wed', 'Fri'],
      rest_days_between: 1,
      is_rolling_rotation: true,
      skip_policy: 'roll_forward',
      timing_slot: timingSlot
    }
  }

  if (
    fullText.includes('5 on / 2 off') || fullText.includes('5 on 2 off') || fullText.includes('5 days on') ||
    fullText.includes('weekdays') || fullText.includes('mon-fri') || fullText.includes('5x/week') ||
    fullText.includes('5x weekly')
  ) {
    return {
      schedule_mode: 'days_of_week',
      days_of_week: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      rest_days_between: 0,
      is_rolling_rotation: false,
      skip_policy: 'roll_forward',
      timing_slot: timingSlot
    }
  }

  if (
    fullText.includes('1x weekly') || fullText.includes('once weekly') || fullText.includes('once a week') ||
    fullText.includes('1x/wk') || (fullText.includes('weekly') && !fullText.includes('2x') && !fullText.includes('3x') && !fullText.includes('4x') && !fullText.includes('5x'))
  ) {
    return {
      schedule_mode: 'days_of_week',
      days_of_week: ['Sun'],
      rest_days_between: 6,
      is_rolling_rotation: false,
      skip_policy: 'roll_forward',
      timing_slot: timingSlot
    }
  }

  // 0.1 PPL Split Modalities (Push, Pull, Legs programmed 1-2x per week each, e.g. Mon/Thu, Tue/Fri, Wed/Sat)
  if (nameId.includes('ppl_push') || (nameId.includes('push') && (nameId.includes('chest') || nameId.includes('delts') || nameId.includes('triceps')))) {
    return {
      schedule_mode: 'days_of_week',
      days_of_week: ['Mon', 'Thu'],
      rest_days_between: 2,
      is_rolling_rotation: true,
      skip_policy: 'roll_forward',
      timing_slot: timingSlot
    }
  }

  if (nameId.includes('ppl_pull') || (nameId.includes('pull') && (nameId.includes('back') || nameId.includes('lats') || nameId.includes('biceps')))) {
    return {
      schedule_mode: 'days_of_week',
      days_of_week: ['Tue', 'Fri'],
      rest_days_between: 2,
      is_rolling_rotation: true,
      skip_policy: 'roll_forward',
      timing_slot: timingSlot
    }
  }

  if (nameId.includes('ppl_leg') || (nameId.includes('leg') && (nameId.includes('quad') || nameId.includes('hamstring') || nameId.includes('squat')))) {
    return {
      schedule_mode: 'days_of_week',
      days_of_week: ['Wed', 'Sat'],
      rest_days_between: 2,
      is_rolling_rotation: true,
      skip_policy: 'roll_forward',
      timing_slot: timingSlot
    }
  }

  if (nameId.includes('ppl_recovery')) {
    return {
      schedule_mode: 'days_of_week',
      days_of_week: ['Sun'],
      rest_days_between: 6,
      is_rolling_rotation: false,
      skip_policy: 'roll_forward',
      timing_slot: timingSlot
    }
  }

  // Peptide Protocol Modalities
  if (
    nameId.includes('bpc157') || nameId.includes('bpc-157') || nameId.includes('bpc_157') || 
    nameId.includes('ghk') || nameId.includes('copper peptide') ||
    nameId.includes('semax') || nameId.includes('selank') || nameId.includes('kpv') ||
    nameId.includes('ss31') || nameId.includes('ss-31') || nameId.includes('elamipretide') ||
    nameId.includes('aod9604') || nameId.includes('aod-9604') || nameId.includes('aod_9604') || nameId.includes('aod')
  ) {
    return {
      schedule_mode: 'days_of_week',
      days_of_week: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      rest_days_between: 0,
      is_rolling_rotation: false,
      skip_policy: 'roll_forward',
      timing_slot: 'morning'
    }
  }

  if (nameId.includes('retatrutide') || nameId.includes('reta') || nameId.includes('tirzepatide') || nameId.includes('semaglutide')) {
    return {
      schedule_mode: 'days_of_week',
      days_of_week: ['Sun'],
      rest_days_between: 6,
      is_rolling_rotation: false,
      skip_policy: 'roll_forward',
      timing_slot: 'morning'
    }
  }

  if (nameId.includes('epitalon') || nameId.includes('epithalon')) {
    return {
      schedule_mode: 'days_of_week',
      days_of_week: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      rest_days_between: 0,
      is_rolling_rotation: false,
      skip_policy: 'roll_forward',
      timing_slot: 'pre_bed'
    }
  }

  if (nameId.includes('ta1') || nameId.includes('ta-1') || nameId.includes('ta_1') || nameId.includes('thymosin alpha')) {
    return {
      schedule_mode: 'days_of_week',
      days_of_week: ['Mon', 'Thu'],
      rest_days_between: 2,
      is_rolling_rotation: true,
      skip_policy: 'roll_forward',
      timing_slot: 'morning'
    }
  }

  if (nameId.includes('pt141') || nameId.includes('pt-141') || nameId.includes('pt_141') || nameId.includes('bremelanotide') || nameId.includes('oxytocin') || nameId.includes('kisspeptin')) {
    return {
      schedule_mode: 'days_of_week',
      days_of_week: ['Fri', 'Sat'],
      rest_days_between: 4,
      is_rolling_rotation: false,
      skip_policy: 'roll_forward',
      timing_slot: 'evening'
    }
  }

  if (nameId.includes('tb500') || nameId.includes('tb-500') || nameId.includes('tb_500') || nameId.includes('thymosin beta')) {
    return {
      schedule_mode: 'days_of_week',
      days_of_week: ['Tue', 'Fri'],
      rest_days_between: 2,
      is_rolling_rotation: true,
      skip_policy: 'roll_forward',
      timing_slot: 'evening'
    }
  }

  if (nameId.includes('mots') || nameId.includes('motsc')) {
    return {
      schedule_mode: 'days_of_week',
      days_of_week: ['Mon', 'Wed', 'Fri'],
      rest_days_between: 1,
      is_rolling_rotation: true,
      skip_policy: 'roll_forward',
      timing_slot: 'morning'
    }
  }

  if (nameId.includes('igf1') || nameId.includes('igf-1') || nameId.includes('igf_1') || nameId.includes('lr3')) {
    return {
      schedule_mode: 'days_of_week',
      days_of_week: ['Mon', 'Wed', 'Fri', 'Sat'],
      rest_days_between: 1,
      is_rolling_rotation: true,
      skip_policy: 'roll_forward',
      timing_slot: 'midday'
    }
  }

  if (nameId.includes('cjc') || nameId.includes('ipamorelin') || nameId.includes('tesamorelin') || nameId.includes('sermorelin') || fullText.includes('5 days on / 2 days off') || fullText.includes('5 on 2 off')) {
    return {
      schedule_mode: 'days_of_week',
      days_of_week: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      rest_days_between: 0,
      is_rolling_rotation: true,
      skip_policy: 'roll_forward',
      timing_slot: 'pre_bed'
    }
  }

  // 1. Annual (365 days / 364 rest days)
  if (
    fullText.includes('annual') || fullText.includes('yearly') || fullText.includes('1x / year') || 
    fullText.includes('1x per year') || fullText.includes('every year') || fullText.includes('colonoscopy')
  ) {
    return {
      schedule_mode: 'rest_interval',
      rest_days_between: 364,
      interval_preset: 'annually',
      is_rolling_rotation: false,
      skip_policy: 'roll_forward',
      timing_slot: timingSlot
    }
  }

  // 2. Semi-Annual / Bi-Annual (180 days / 179 rest days)
  if (
    fullText.includes('bi-annual') || fullText.includes('bi annual') || fullText.includes('every 6 months') || 
    fullText.includes('semi-annual') || fullText.includes('semi annual') || fullText.includes('2x / year') || 
    fullText.includes('2x per year')
  ) {
    return {
      schedule_mode: 'rest_interval',
      rest_days_between: 179,
      interval_preset: 'bi_annually',
      is_rolling_rotation: false,
      skip_policy: 'roll_forward',
      timing_slot: timingSlot
    }
  }

  // 3. Quarterly Pulses (90 days / 89 rest days) (e.g. Plasmapheresis, DEXA scan, VO2 max test, Lab Panels)
  if (
    fullText.includes('quarterly') || fullText.includes('every 3 months') || fullText.includes('every quarter') || 
    fullText.includes('4x / year') || fullText.includes('4x per year') || fullText.includes('plasmapheresis') || 
    fullText.includes('tpe') || fullText.includes('dexa') || cadence === 'quarterly'
  ) {
    return {
      schedule_mode: 'rest_interval',
      rest_days_between: 89,
      interval_preset: 'quarterly',
      is_rolling_rotation: false,
      skip_policy: 'roll_forward',
      timing_slot: timingSlot
    }
  }

  // 4. Monthly Pulses & Cycles (28-30 days / 29 rest days) (e.g. Fisetin & Quercetin, Fasting Mimicking Diet, Senolytics)
  if (
    fullText.includes('monthly') || fullText.includes('month pulse') || fullText.includes('days/month') || 
    fullText.includes('days per month') || fullText.includes('fisetin') || fullText.includes('senolytic') || 
    fullText.includes('fasting_mimicking') || fullText.includes('fmd') || cadence === 'monthly' || 
    mod?.cadence_interval_days === 30 || mod?.cadence_interval_days === 28
  ) {
    return {
      schedule_mode: 'rest_interval',
      rest_days_between: 29,
      interval_preset: 'monthly',
      is_rolling_rotation: false,
      skip_policy: 'roll_forward',
      timing_slot: timingSlot
    }
  }

  // 5. Bi-Weekly Pulses (14 days / 13 rest days)
  if (
    fullText.includes('bi-weekly') || fullText.includes('bi weekly') || fullText.includes('every 2 weeks') || 
    fullText.includes('every other week') || mod?.cadence_interval_days === 14
  ) {
    return {
      schedule_mode: 'rest_interval',
      rest_days_between: 13,
      interval_preset: 'bi_weekly',
      is_rolling_rotation: false,
      skip_policy: 'roll_forward',
      timing_slot: timingSlot
    }
  }

  // 6. Weekly Single-Session Pulses (7 days / 6 rest days) (e.g. Rapamycin 1x weekly, VO2 Max 4x4 intervals 1x/wk)
  if (
    fullText.includes('1x weekly') || fullText.includes('1x / week') || fullText.includes('1x per week') || 
    fullText.includes('once weekly') || fullText.includes('once per week') || fullText.includes('weekly pulse') ||
    fullText.includes('rapamycin') || fullText.includes('sirolimus') || mod?.cadence_interval_days === 7
  ) {
    return {
      schedule_mode: 'rest_interval',
      rest_days_between: 6,
      interval_preset: 'weekly',
      is_rolling_rotation: false,
      skip_policy: 'roll_forward',
      timing_slot: timingSlot
    }
  }

  // 7. 3-4x Weekly Rotations (e.g. Cold Plunge 3-4x weekly, Sauna 3-4x weekly, Resistance training Mon/Wed/Fri)
  if (
    fullText.includes('3-4x weekly') || fullText.includes('3-4x / week') || fullText.includes('3-4x per week') || 
    fullText.includes('3-5x weekly') || fullText.includes('3x weekly') || fullText.includes('3x / week') || 
    fullText.includes('3x per week') || fullText.includes('3 times a week')
  ) {
    return {
      schedule_mode: 'days_of_week',
      days_of_week: ['Mon', 'Wed', 'Fri'],
      rest_days_between: 1,
      is_rolling_rotation: true,
      skip_policy: 'roll_forward',
      timing_slot: timingSlot
    }
  }

  // 8. 2x Weekly Rotations (e.g. Tuesday / Thursday)
  if (
    fullText.includes('2x weekly') || fullText.includes('2x / week') || fullText.includes('2x per week') || 
    fullText.includes('2 times a week')
  ) {
    return {
      schedule_mode: 'days_of_week',
      days_of_week: ['Tue', 'Thu'],
      rest_days_between: 2,
      is_rolling_rotation: true,
      skip_policy: 'roll_forward',
      timing_slot: timingSlot
    }
  }

  // 9. 4x Weekly Rotations (e.g. Mon, Tue, Thu, Fri)
  if (
    fullText.includes('4x weekly') || fullText.includes('4x / week') || fullText.includes('4x per week') || 
    fullText.includes('4 times a week')
  ) {
    return {
      schedule_mode: 'days_of_week',
      days_of_week: ['Mon', 'Tue', 'Thu', 'Fri'],
      rest_days_between: 1,
      is_rolling_rotation: true,
      skip_policy: 'roll_forward',
      timing_slot: timingSlot
    }
  }

  // 10. 5x Weekly Rotations (e.g. Weekdays Mon-Fri)
  if (
    fullText.includes('5x weekly') || fullText.includes('5x / week') || fullText.includes('5x per week') || 
    fullText.includes('5 times a week') || fullText.includes('weekdays')
  ) {
    return {
      schedule_mode: 'days_of_week',
      days_of_week: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      rest_days_between: 0,
      is_rolling_rotation: true,
      skip_policy: 'roll_forward',
      timing_slot: timingSlot
    }
  }

  // 11. Alternate Days (Every Other Day)
  if (fullText.includes('every other day') || fullText.includes('alternate days') || mod?.cadence_interval_days === 2) {
    return {
      schedule_mode: 'rest_interval',
      rest_days_between: 1,
      is_rolling_rotation: true,
      skip_policy: 'roll_forward',
      timing_slot: timingSlot
    }
  }

  // 12. Default: Everyday (7/7)
  return {
    schedule_mode: 'days_of_week',
    days_of_week: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    rest_days_between: 0,
    is_rolling_rotation: false,
    skip_policy: 'roll_forward',
    timing_slot: timingSlot
  }
}

export function getModalityScheduleConfig(modalityId: string, fallbackModality?: Modality | null): ModalityScheduleConfig | null {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(`levl_modality_sched_${modalityId}`)
      if (raw) return JSON.parse(raw) as ModalityScheduleConfig
    } catch (e) {
      console.error('Error reading schedule config from localStorage:', e)
    }
  }
  if (fallbackModality) {
    return deriveAutomaticScheduleConfig(fallbackModality)
  }
  return null
}

export async function reconcileModalityScheduleAndFutureTasks(
  localUserId: string,
  modalityId: string,
  options: {
    customDose?: string
    customTiming?: string
    notes?: string
    scheduleConfig?: ModalityScheduleConfig
    fromDate?: string
    protocolStepId?: string
  }
) {
  if (!supabase || !localUserId || !modalityId) return false
  
  const fromDateStr = options.fromDate || format(new Date(), 'yyyy-MM-dd')
  const { customDose, customTiming, notes, scheduleConfig } = options

  // 1. Update/Upsert user_bench_items so the user's personalization is saved permanently
  if (customDose !== undefined || customTiming !== undefined || notes !== undefined) {
    await upsertBenchItemOverride(localUserId, modalityId, customDose || '', customTiming || '', notes)
  }

  // 2. Resolve primary timing slot from customTiming
  const resolvedSlot = customTiming ? resolveSlotFromTimingString(customTiming) : (scheduleConfig?.timing_slot || 'anytime')

  // 3. Compute active dates for the next 30 days based on scheduleConfig or cadence in customTiming
  const [y, m, d] = fromDateStr.split('-').map(Number)
  const localStartDate = new Date(y, m - 1, d, 12, 0, 0)
  
  const activeDateStrings = new Set<string>()
  const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] // 0=Sun, 1=Mon...

  if (scheduleConfig?.schedule_mode === 'specific_dates' && scheduleConfig.specific_dates?.length) {
    scheduleConfig.specific_dates.forEach(dStr => {
      if (dStr >= fromDateStr) activeDateStrings.add(dStr)
    })
    activeDateStrings.add(fromDateStr)
  } else if (scheduleConfig?.schedule_mode === 'rest_interval' && scheduleConfig.rest_days_between !== undefined) {
    const step = scheduleConfig.rest_days_between + 1
    for (let i = 0; i <= 30; i += step) {
      const tDate = new Date(localStartDate)
      tDate.setDate(localStartDate.getDate() + i)
      activeDateStrings.add(format(tDate, 'yyyy-MM-dd'))
    }
  } else if (scheduleConfig?.days_of_week && scheduleConfig.days_of_week.length > 0) {
    const targetDays = scheduleConfig.days_of_week
    for (let i = 0; i <= 30; i++) {
      const tDate = new Date(localStartDate)
      tDate.setDate(localStartDate.getDate() + i)
      const dayName = DAYS_SHORT[tDate.getDay()]
      if (targetDays.includes(dayName)) {
        activeDateStrings.add(format(tDate, 'yyyy-MM-dd'))
      }
    }
    if (targetDays.includes(DAYS_SHORT[localStartDate.getDay()])) {
      activeDateStrings.add(fromDateStr)
    }
  } else if (customTiming) {
    const lower = customTiming.toLowerCase()
    let stepDays = 1
    if (lower.includes('1x monthly') || lower.includes('monthly') || lower.includes('1x_month')) {
      stepDays = 30
    } else if (lower.includes('2x per month') || lower.includes('biweekly') || lower.includes('2x_month')) {
      stepDays = 14
    } else if (lower.includes('1x weekly') || lower.includes('1x_week') || lower.includes('weekly')) {
      stepDays = 7
    } else if (lower.includes('1–2x') || lower.includes('1-2x')) {
      const targetDays = ['Tue', 'Fri']
      for (let i = 0; i <= 30; i++) {
        const tDate = new Date(localStartDate)
        tDate.setDate(localStartDate.getDate() + i)
        if (targetDays.includes(DAYS_SHORT[tDate.getDay()])) activeDateStrings.add(format(tDate, 'yyyy-MM-dd'))
      }
    } else if (lower.includes('3–4x') || lower.includes('3-4x')) {
      const targetDays = ['Mon', 'Wed', 'Fri', 'Sat']
      for (let i = 0; i <= 30; i++) {
        const tDate = new Date(localStartDate)
        tDate.setDate(localStartDate.getDate() + i)
        if (targetDays.includes(DAYS_SHORT[tDate.getDay()])) activeDateStrings.add(format(tDate, 'yyyy-MM-dd'))
      }
    } else {
      stepDays = 1
    }

    if (activeDateStrings.size === 0) {
      for (let i = 0; i <= 30; i += stepDays) {
        const tDate = new Date(localStartDate)
        tDate.setDate(localStartDate.getDate() + i)
        activeDateStrings.add(format(tDate, 'yyyy-MM-dd'))
      }
    }
  } else {
    for (let i = 0; i <= 30; i++) {
      const tDate = new Date(localStartDate)
      tDate.setDate(localStartDate.getDate() + i)
      activeDateStrings.add(format(tDate, 'yyyy-MM-dd'))
    }
  }

  // Always keep fromDate active if currently opened
  activeDateStrings.add(fromDateStr)

  // 4. Fetch all existing tasks for this modality from fromDateStr to 30 days out
  const endDate = new Date(localStartDate)
  endDate.setDate(localStartDate.getDate() + 30)
  const endDateStr = format(endDate, 'yyyy-MM-dd')

  const taskQuery = supabase
    .from('daily_protocol_tasks')
    .select('*')
    .eq('local_user_id', localUserId)
    .gte('scheduled_date', fromDateStr)
    .lte('scheduled_date', endDateStr)

  if (options.protocolStepId) {
    taskQuery.eq('protocol_step_id', options.protocolStepId)
  } else {
    taskQuery.eq('modality_id', modalityId)
  }

  const { data: existingFutureTasks, error: fetchErr } = await taskQuery
  if (fetchErr) {
    console.warn('Error querying existing future tasks:', fetchErr)
  }

  const existingMap = new Map<string, any>()
  const tasksToDeleteIds: string[] = []
  const tasksToUpdateList: any[] = []

  if (existingFutureTasks) {
    existingFutureTasks.forEach((t: any) => {
      const dateKey = t.scheduled_date
      existingMap.set(dateKey, t)

      // If this date is a REST day and the task is uncompleted (pending / snoozed), delete it so it won't show on rest days!
      if (!activeDateStrings.has(dateKey) && dateKey !== fromDateStr && t.status !== 'completed') {
        tasksToDeleteIds.push(t.id)
      }
    })
  }

  // 5. Delete rest-day tasks
  if (tasksToDeleteIds.length > 0) {
    await supabase.from('daily_protocol_tasks').delete().in('id', tasksToDeleteIds)
  }

  // 6. Update existing active tasks & create missing ones on active days
  const tasksToInsert: any[] = []

  activeDateStrings.forEach(targetDateStr => {
    if (existingMap.has(targetDateStr)) {
      const existing = existingMap.get(targetDateStr)
      if (existing.status !== 'completed') {
        tasksToUpdateList.push(existing.id)
      }
    } else {
      tasksToInsert.push({
        local_user_id: localUserId,
        scheduled_date: targetDateStr,
        modality_id: modalityId,
        protocol_step_id: options.protocolStepId || null,
        timing_slot: resolvedSlot,
        status: 'pending',
        execution_details: {
          custom_dose: customDose,
          custom_timing: customTiming,
          notes: notes,
          schedule_config: scheduleConfig
        }
      })
    }
  })

  // Update existing pending tasks on active days
  if (tasksToUpdateList.length > 0) {
    const updatePayload: any = {}
    if (resolvedSlot && resolvedSlot !== 'anytime') updatePayload.timing_slot = resolvedSlot
    
    const { data: currentTaskData } = await supabase
      .from('daily_protocol_tasks')
      .select('id, execution_details')
      .in('id', tasksToUpdateList)

    if (currentTaskData) {
      for (const t of currentTaskData) {
        const mergedDetails = {
          ...(t.execution_details || {}),
          ...(customDose !== undefined ? { custom_dose: customDose } : {}),
          ...(customTiming !== undefined ? { custom_timing: customTiming } : {}),
          ...(notes !== undefined ? { notes: notes } : {}),
          ...(scheduleConfig !== undefined ? { schedule_config: scheduleConfig } : {})
        }
        await supabase
          .from('daily_protocol_tasks')
          .update({
            ...updatePayload,
            execution_details: mergedDetails
          })
          .eq('id', t.id)
      }
    }
  }

  // Insert missing tasks on active days
  if (tasksToInsert.length > 0) {
    await supabase.from('daily_protocol_tasks').insert(tasksToInsert)
  }

  clearUserHistoryCache()
  return true
}

export async function updateModalityScheduleConfig(
  localUserId: string,
  taskId: string,
  config: ModalityScheduleConfig,
  applyToFuture: boolean = true
) {
  if (!supabase) return false

  const { data: task, error: fetchError } = await supabase
    .from('daily_protocol_tasks')
    .select('*')
    .eq('id', taskId)
    .single()

  if (!task || fetchError) return false

  const modalityKey = task.modality_id || task.protocol_step_id || taskId

  // Also persist to localStorage cache for real-time reactivity
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`levl_modality_sched_${modalityKey}`, JSON.stringify(config))
      window.dispatchEvent(new CustomEvent('levl_protocol_schedule_updated', { detail: { modalityKey, config } }))
    }
  } catch (e) {
    console.error('Error saving schedule config to localStorage:', e)
  }

  if (applyToFuture && task.modality_id) {
    return await reconcileModalityScheduleAndFutureTasks(localUserId, task.modality_id, {
      scheduleConfig: config,
      fromDate: task.scheduled_date,
      protocolStepId: task.protocol_step_id || undefined,
      customDose: task.execution_details?.custom_dose,
      customTiming: task.execution_details?.custom_timing,
      notes: task.execution_details?.notes
    })
  } else {
    const updatedDetails = {
      ...(task.execution_details || {}),
      schedule_config: config
    }
    const { error } = await supabase
      .from('daily_protocol_tasks')
      .update({
        timing_slot: config.timing_slot || task.timing_slot,
        execution_details: updatedDetails
      })
      .eq('id', taskId)
    clearUserHistoryCache()
    return !error
  }
}

export async function deleteTask(localUserId: string, taskId: string, applyToFuture: boolean = false) {
  if (!supabase) return false

  const { data: task } = await supabase
    .from('daily_protocol_tasks')
    .select('*')
    .eq('id', taskId)
    .single()

  if (!task) return false

  if (!applyToFuture) {
    const { error } = await supabase
      .from('daily_protocol_tasks')
      .delete()
      .eq('id', taskId)
    return !error
  } else {
    const query = supabase
      .from('daily_protocol_tasks')
      .delete()
      .eq('local_user_id', localUserId)
      .gte('scheduled_date', task.scheduled_date)

    if (task.protocol_step_id) {
      query.eq('protocol_step_id', task.protocol_step_id)
    } else {
      query.eq('modality_id', task.modality_id)
    }

    const { error } = await query
    return !error
  }
}

export async function updateTaskExecutionDetails(taskId: string, detailsPatch: any) {
  if (!supabase) return false

  const { data: task, error: fetchError } = await supabase
    .from('daily_protocol_tasks')
    .select('execution_details, timing_slot')
    .eq('id', taskId)
    .single()

  if (fetchError || !task) return false

  const updatedDetails = { ...(task.execution_details || {}), ...detailsPatch }
  const updatePayload: any = { execution_details: updatedDetails }

  if (detailsPatch.custom_timing) {
    const slot = resolveSlotFromTimingString(detailsPatch.custom_timing)
    if (slot && slot !== 'anytime') {
      updatePayload.timing_slot = slot
    }
  }

  const { error } = await supabase
    .from('daily_protocol_tasks')
    .update(updatePayload)
    .eq('id', taskId)

  if (!error) {
    clearUserHistoryCache()
    return true
  }
  return false
}
export function getModalityStepDays(modality?: Modality | null): number {
  if (!modality) return 1
  if (modality.cadence_interval_days && modality.cadence_interval_days > 0) {
    return modality.cadence_interval_days
  }

  const nameId = ((modality.name || '') + ' ' + (modality.id || '')).toLowerCase()
  const freq = (modality.frequency || '').toLowerCase()
  const pattern = (modality.schedule_pattern || '').toLowerCase()
  const cadence = (modality.cadence_layer || '').toLowerCase()

  // GLP-1s & Rapamycin weekly pulses
  if (
    nameId.includes('glp') || nameId.includes('semaglutide') || nameId.includes('tirzepatide') ||
    nameId.includes('retatrutide') || nameId.includes('ozempic') || nameId.includes('mounjaro') ||
    nameId.includes('wegovy') || nameId.includes('rapamycin') || nameId.includes('sirolimus')
  ) {
    return 7
  }

  // Monthly pulses (Senolytics, FMD, Fisetin, Quercetin)
  if (
    nameId.includes('fisetin') || nameId.includes('quercetin') || nameId.includes('senolytic') ||
    nameId.includes('fasting_mimicking') || nameId.includes('fmd') || pattern.includes('monthly') ||
    cadence === 'monthly' || freq.includes('monthly') || freq.includes('days/month') || freq.includes('days per month')
  ) {
    return 30
  }

  // Quarterly pulses (Plasmapheresis, NAD+ IV)
  if (nameId.includes('plasmapheresis') || nameId.includes('tpe') || pattern.includes('quarterly') || cadence === 'quarterly') {
    return 90
  }

  // Weekly general cadence
  if (pattern.includes('weekly') || cadence === 'weekly' || cadence === 'infrequent' || freq.includes('1x_week') || freq.includes('weekly')) {
    return 7
  }

  if (pattern.includes('every_other_day')) return 2

  return 1
}

export function isPulsedModality(mod?: Modality | null): boolean {
  if (!mod) return false
  if ((mod as any).is_pulsed) return true

  const nameId = ((mod.name || '') + ' ' + (mod.id || '')).toLowerCase()
  const freq = (mod.frequency || '').toLowerCase()
  const pattern = (mod.schedule_pattern || '').toLowerCase()
  const cadence = (mod.cadence_layer || '').toLowerCase()

  // Exclude regular weekly workouts/routines (e.g. 3-4x weekly, 4-7x weekly, 2-4x per week)
  if (
    freq.includes('3-') || freq.includes('4-') || freq.includes('2-') || freq.includes('5-') || 
    freq.includes('x per week') || freq.includes('x weekly') || freq.includes('times/week') || freq.includes('days/week')
  ) {
    // Unless it's an explicit senolytic or peptide pulse
    if (!nameId.includes('fisetin') && !nameId.includes('senolytic') && !nameId.includes('rapamycin') && !nameId.includes('glp') && !nameId.includes('fasting_mimicking')) {
      return false
    }
  }

  if (cadence === 'monthly' || cadence === 'multi_month' || cadence === 'quarterly' || cadence === 'pulsed' || cadence === 'cyclical') {
    return true
  }

  if (pattern.includes('monthly') || pattern.includes('quarterly') || pattern.includes('cyclical')) {
    return true
  }

  if (
    nameId.includes('fisetin') || nameId.includes('quercetin') || nameId.includes('senolytic') ||
    nameId.includes('fasting_mimicking') || nameId.includes('fmd') || nameId.includes('rapamycin') ||
    nameId.includes('sirolimus') || nameId.includes('plasmapheresis') || nameId.includes('tpe') ||
    nameId.includes('glp') || nameId.includes('semaglutide') || nameId.includes('tirzepatide') ||
    nameId.includes('apob') || nameId.includes('lipid') || freq.includes('quarterly') || freq.includes('monthly') ||
    freq.includes('pulse')
  ) {
    return true
  }

  if (mod.cadence_interval_days && mod.cadence_interval_days >= 7) {
    return true
  }

  return false
}

export async function getPulsedModalityContext(localUserId: string, targetDateStr?: string) {
  if (!supabase) return []

  const referenceDateStr = targetDateStr || new Date().toISOString().split('T')[0]
  const [refY, refM, refD] = referenceDateStr.split('-').map(Number)
  const refDateObj = new Date(refY, refM - 1, refD)

  const allMods = await getModalities()
  const modsMap = new Map(allMods.map(m => [m.id, m]))

  // 1. Active bench items for user
  const benchItems = await getBenchItems(localUserId)
  const activeBenchModIds = new Set(benchItems.filter(b => b.status === 'active' || b.status === 'trialing').map(b => b.modality_id))

  // 2. All daily protocol tasks with joined protocol_step modality_id
  const { data: allTasks } = await supabase
    .from('daily_protocol_tasks')
    .select('scheduled_date, modality_id, status, protocol_step:protocol_steps(modality_id)')
    .eq('local_user_id', localUserId)
    .order('scheduled_date', { ascending: false })

  const taskModIds = new Set((allTasks || []).map(t => t.modality_id || (t as any).protocol_step?.modality_id).filter(Boolean))
  const candidateModIds = new Set([
    ...allMods.map(m => m.id),
    ...Array.from(activeBenchModIds), 
    ...Array.from(taskModIds)
  ])

  const pulsedList: any[] = []

  for (const mId of Array.from(candidateModIds)) {
    const mod = modsMap.get(mId)
    if (!mod) continue

    const isPulsed = isPulsedModality(mod)
    if (!isPulsed) continue

    const stepDays = getModalityStepDays(mod)

    // Last completed date on or before reference date
    let isLoggedTodayCache = false
    if (typeof window !== 'undefined') {
      isLoggedTodayCache = localStorage.getItem(`levl_logged_pulse_${localUserId}_${mId}_${referenceDateStr}`) === 'true'
    }

    const lastCompletedTask = (allTasks || [])
      .filter(t => {
        const ps = (t as any).protocol_step
        const psModId = Array.isArray(ps) ? ps[0]?.modality_id : ps?.modality_id
        const matchesModId = t.modality_id === mId || psModId === mId
        return matchesModId && t.scheduled_date <= referenceDateStr && (t.status === 'completed' || t.status === 'partial')
      })
      .sort((a, b) => b.scheduled_date.localeCompare(a.scheduled_date))[0]

    const lastDate = (isLoggedTodayCache && (!lastCompletedTask || lastCompletedTask.scheduled_date < referenceDateStr)) 
      ? referenceDateStr 
      : (lastCompletedTask?.scheduled_date || null)

    let nextDate: string | null = null

    if (lastDate) {
      // Calculate next pulse date based on last completed date + stepDays
      const [y, m, d] = lastDate.split('-').map(Number)
      let projectedObj = new Date(y, m - 1, d)
      
      // Advance in stepDays increments until projectedObj > refDateObj
      do {
        projectedObj.setDate(projectedObj.getDate() + stepDays)
      } while (projectedObj <= refDateObj)

      nextDate = format(projectedObj, 'yyyy-MM-dd')
    } else {
      // Never completed before: Pulse is ready to start Today!
      nextDate = referenceDateStr
    }

    // Compute exact days until next pulse relative to referenceDateStr
    const [nY, nM, nD] = nextDate.split('-').map(Number)
    const nextDateObj = new Date(nY, nM - 1, nD)
    const daysUntil = Math.round((nextDateObj.getTime() - refDateObj.getTime()) / (1000 * 3600 * 24))

    pulsedList.push({
      modality: mod,
      next_date: nextDate,
      last_date: lastDate,
      days_until: daysUntil,
      is_due_today: daysUntil <= 0,
      interval_days: stepDays
    })
  }

  return pulsedList
}

export async function logPulsedExecution(localUserId: string, dateStr: string, modalityId: string) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`levl_logged_pulse_${localUserId}_${modalityId}_${dateStr}`, 'true')
    } catch (e) {}
  }

  if (!supabase) return null

  const nowIso = new Date().toISOString()

  // 1. Check if a task exists for today
  const { data: existing } = await supabase
    .from('daily_protocol_tasks')
    .select('*')
    .eq('local_user_id', localUserId)
    .eq('scheduled_date', dateStr)
    .eq('modality_id', modalityId)
    .maybeSingle()

  let taskRecord = existing

  if (existing) {
    const { data: updated, error: updateError } = await supabase
      .from('daily_protocol_tasks')
      .update({
        status: 'completed',
        completed_at: nowIso,
        adherence_value: 1,
        status_reason: null
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (!updateError && updated) {
      taskRecord = updated
    }
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from('daily_protocol_tasks')
      .insert([{
        local_user_id: localUserId,
        scheduled_date: dateStr,
        modality_id: modalityId,
        timing_slot: 'anytime',
        status: 'completed',
        completed_at: nowIso,
        adherence_value: 1
      }])
      .select()
      .single()

    if (!insertError && inserted) {
      taskRecord = inserted
    }
  }

  // 2. Schedule future recurring pulse tasks (30 days out based on stepDays)
  const { data: modality } = await supabase.from('modalities').select('*').eq('id', modalityId).single()
  const stepDays = getModalityStepDays(modality)

  const [year, month, day] = dateStr.split('-').map(Number)
  const localStartDate = new Date(year, month - 1, day)

  const futureTasksToInsert = []

  for (let i = stepDays; i <= 30; i += stepDays) {
    const targetDate = new Date(localStartDate)
    targetDate.setDate(localStartDate.getDate() + i)
    const targetDateStr = format(targetDate, 'yyyy-MM-dd')

    const { data: futureExisting } = await supabase
      .from('daily_protocol_tasks')
      .select('id')
      .eq('local_user_id', localUserId)
      .eq('scheduled_date', targetDateStr)
      .eq('modality_id', modalityId)
      .maybeSingle()

    if (!futureExisting) {
      futureTasksToInsert.push({
        local_user_id: localUserId,
        scheduled_date: targetDateStr,
        modality_id: modalityId,
        timing_slot: 'anytime',
        status: 'pending'
      })
    }
  }

  if (futureTasksToInsert.length > 0) {
    await supabase.from('daily_protocol_tasks').insert(futureTasksToInsert)
  }

  return taskRecord
}

export async function resetTodayData(localUserId: string, dateStr: string): Promise<boolean> {
  if (!supabase) return false
  try {
    // 1. Fetch all task IDs for today
    const { data: todayTasks } = await supabase
      .from('daily_protocol_tasks')
      .select('id')
      .eq('local_user_id', localUserId)
      .eq('scheduled_date', dateStr)

    const todayTaskIds = (todayTasks || []).map(t => t.id)

    // 2. Delete outcome_observations by checkin_date AND by todayTaskIds
    await supabase
      .from('outcome_observations')
      .delete()
      .eq('local_user_id', localUserId)
      .eq('checkin_date', dateStr)

    const localTodayStr = format(new Date(), 'yyyy-MM-dd')
    await supabase
      .from('outcome_observations')
      .delete()
      .eq('local_user_id', localUserId)
      .eq('checkin_date', localTodayStr)

    if (todayTaskIds.length > 0) {
      await supabase
        .from('outcome_observations')
        .delete()
        .eq('local_user_id', localUserId)
        .in('task_id', todayTaskIds)
    }

    // 3. Delete daily_wellbeing_checkins for today
    await supabase
      .from('daily_wellbeing_checkins')
      .delete()
      .eq('local_user_id', localUserId)
      .eq('checkin_date', dateStr)

    await supabase
      .from('daily_wellbeing_checkins')
      .delete()
      .eq('local_user_id', localUserId)
      .eq('checkin_date', localTodayStr)

    // 4. Reset daily_protocol_tasks for today back to pending using scheduled_date
    await supabase
      .from('daily_protocol_tasks')
      .update({
        status: 'pending',
        status_reason: null,
        completed_at: null,
        execution_metrics: null,
        execution_details: null
      })
      .eq('local_user_id', localUserId)
      .eq('scheduled_date', dateStr)

    return true
  } catch (err) {
    console.error('Error resetting today data:', err)
    return false
  }
}

// ----------------------------------------------------
// AUTOMATIC HABITS & GRADUATION ENGINE
// ----------------------------------------------------

export function calculateHabitTargetDays(modalityName?: string): number {
  if (!modalityName) return 66
  const name = modalityName.toLowerCase()
  if (name.includes('water') || name.includes('creatine') || name.includes('magnesium') || name.includes('hydrate')) return 21
  if (name.includes('training') || name.includes('fast') || name.includes('cold') || name.includes('plunge') || name.includes('sauna')) return 90
  return 66 // Lally et al., 2010 baseline
}

export async function getUserModalityHabits(localUserId: string): Promise<UserModalityHabit[]> {
  try {
    const storageKey = `levl_user_habits_${localUserId}`
    const raw = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null
    let habits: UserModalityHabit[] = raw ? JSON.parse(raw) : []

    const allMods = await getModalities()
    const modMap = new Map(allMods.map(m => [m.id, m]))

    // Dynamically compute completion dates count from daily_protocol_tasks table
    const completedDatesMap: Record<string, Set<string>> = {}
    if (supabase) {
      const { data: dbTasks } = await supabase
        .from('daily_protocol_tasks')
        .select('scheduled_date, status, modality_id, protocol_steps(modality_id)')
        .eq('local_user_id', localUserId)
        .eq('status', 'completed')

      if (dbTasks) {
        dbTasks.forEach((t: any) => {
          const mId = t.modality_id || t.protocol_steps?.modality_id
          const dStr = t.scheduled_date
          if (mId && dStr) {
            if (!completedDatesMap[mId]) completedDatesMap[mId] = new Set()
            completedDatesMap[mId].add(dStr)
          }
        })
      }
    }

    if (habits.length === 0 && typeof window !== 'undefined') {
      const defaultHabitSlugs = ['morning_sunlight', 'creatine_monohydrate', 'interdental-cleaning-flossing']
      const matchedMods = allMods.filter(m => defaultHabitSlugs.includes(m.slug) || defaultHabitSlugs.some(s => m.name.toLowerCase().includes(s.replace('_', ' '))))
      
      habits = matchedMods.map(mod => {
        const completedDates = completedDatesMap[mod.id] || (mod.slug ? completedDatesMap[mod.slug] : null)
        const streak = completedDates ? completedDates.size : 0
        const targetDays = calculateHabitTargetDays(mod.name)
        const isAutomated = streak >= targetDays
        const score = isAutomated ? 100 : Math.min(100, Math.round((streak / targetDays) * 100))

        return {
          id: `habit_${mod.id}`,
          local_user_id: localUserId,
          modality_id: mod.id,
          modality: mod,
          streak_days: streak,
          target_streak_days: targetDays,
          automaticity_score: score,
          is_automated: isAutomated,
          graduation_type: isAutomated ? 'earned' : undefined,
          graduated_at: isAutomated ? new Date().toISOString() : undefined
        }
      })
      localStorage.setItem(storageKey, JSON.stringify(habits))
    } else {
      let needsSave = false
      const existingModIds = new Set<string>()

      habits = habits.map(h => {
        const mod = h.modality || modMap.get(h.modality_id) || allMods.find(m => m.id === h.modality_id || m.slug === h.modality_id)
        if (mod) existingModIds.add(mod.id)
        if (h.modality_id) existingModIds.add(h.modality_id)
        
        let isAutomated = h.is_automated
        let streak = h.streak_days ?? 0

        // Reset default legacy habits so they don't start pre-automated at 45/66 days
        if (h.is_automated && (h.streak_days >= 45 || h.streak_days === 66) && h.graduation_type === 'manual' && !h.graduated_at) {
          isAutomated = false
          streak = 0
          needsSave = true
        }

        // Dynamically update streak from actual DB completed dates
        const completedDates = (mod?.id ? completedDatesMap[mod.id] : null) || completedDatesMap[h.modality_id] || (mod?.slug ? completedDatesMap[mod.slug] : null)
        if (completedDates) {
          streak = Math.max(streak, completedDates.size)
        }

        const targetDays = h.target_streak_days || calculateHabitTargetDays(mod?.name)
        if (streak >= targetDays && !isAutomated) {
          isAutomated = true
          needsSave = true
        }

        const score = isAutomated ? 100 : Math.min(100, Math.round((streak / targetDays) * 100))

        return {
          ...h,
          is_automated: isAutomated,
          streak_days: streak,
          target_streak_days: targetDays,
          automaticity_score: score,
          modality: mod
        }
      }).filter(h => !!h.modality)

      // Auto-create habit records for any modality that has completed tasks in DB
      for (const [mId, datesSet] of Object.entries(completedDatesMap)) {
        if (!existingModIds.has(mId)) {
          const mod = modMap.get(mId) || allMods.find(m => m.id === mId || m.slug === mId)
          if (mod) {
            const streak = datesSet.size
            const targetDays = calculateHabitTargetDays(mod.name)
            const isAutomated = streak >= targetDays
            const score = isAutomated ? 100 : Math.min(100, Math.round((streak / targetDays) * 100))

            habits.push({
              id: `habit_${mod.id}`,
              local_user_id: localUserId,
              modality_id: mod.id,
              modality: mod,
              streak_days: streak,
              target_streak_days: targetDays,
              automaticity_score: score,
              is_automated: isAutomated,
              graduation_type: isAutomated ? 'earned' : undefined,
              graduated_at: isAutomated ? new Date().toISOString() : undefined
            })
            needsSave = true
          }
        }
      }

      if (needsSave && typeof window !== 'undefined') {
        localStorage.setItem(storageKey, JSON.stringify(habits))
      }
    }

    return habits
  } catch (err) {
    console.error('Error fetching habits:', err)
    return []
  }
}

export async function toggleHabitGraduation(localUserId: string, modalityId: string, graduationType: 'manual' | 'earned' = 'manual'): Promise<UserModalityHabit[]> {
  try {
    const habits = await getUserModalityHabits(localUserId)
    const storageKey = `levl_user_habits_${localUserId}`
    const allMods = await getModalities()
    const targetMod = allMods.find(m => m.id === modalityId || m.slug === modalityId)
    const canonicalId = targetMod?.id || modalityId
    
    const existingIndex = habits.findIndex(h => h.modality_id === canonicalId || h.modality_id === modalityId)
    let updated: UserModalityHabit[] = []

    if (existingIndex >= 0) {
      const current = habits[existingIndex]
      if (current.is_automated) {
        updated = habits.map((h, i) => i === existingIndex ? { 
          ...h, 
          is_automated: false, 
          streak_days: 0, 
          automaticity_score: 0, 
          graduation_type: undefined, 
          graduated_at: undefined, 
          modality: targetMod || h.modality 
        } : h)
      } else {
        updated = habits.map((h, i) => i === existingIndex ? {
          ...h,
          is_automated: true,
          graduation_type: graduationType,
          graduated_at: new Date().toISOString(),
          automaticity_score: 100,
          streak_days: current.target_streak_days || calculateHabitTargetDays(targetMod?.name),
          modality: targetMod || h.modality
        } : h)
      }
    } else {
      const newHabit: UserModalityHabit = {
        id: `habit_${canonicalId}`,
        local_user_id: localUserId,
        modality_id: canonicalId,
        modality: targetMod || undefined,
        streak_days: calculateHabitTargetDays(targetMod?.name),
        target_streak_days: calculateHabitTargetDays(targetMod?.name),
        automaticity_score: 100,
        is_automated: true,
        graduation_type: graduationType,
        graduated_at: new Date().toISOString()
      }
      updated = [...habits, newHabit]
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(updated))
      window.dispatchEvent(new CustomEvent('levl_habits_updated', { detail: updated }))
    }
    return updated
  } catch (err) {
    console.error('Error toggling habit graduation:', err)
    return []
  }
}

export async function getDailyHabitExceptions(localUserId: string, dateStr: string): Promise<string[]> {
  try {
    const storageKey = `levl_habit_exceptions_${localUserId}_${dateStr}`
    const raw = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null
    return raw ? JSON.parse(raw) : []
  } catch (err) {
    return []
  }
}

export async function toggleDailyHabitException(localUserId: string, dateStr: string, modalityId: string): Promise<string[]> {
  try {
    const current = await getDailyHabitExceptions(localUserId, dateStr)
    const storageKey = `levl_habit_exceptions_${localUserId}_${dateStr}`
    
    let updated: string[] = []
    if (current.includes(modalityId)) {
      updated = current.filter(id => id !== modalityId)
    } else {
      updated = [...current, modalityId]
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(updated))
    }
    return updated
  } catch (err) {
    return []
  }
}

export interface ModalityCompletionHistoryResult {
  modalityId: string
  totalCompletedDays: number
  targetDays: number
  completedDates: string[]
  completionDetailsMap: Record<string, {
    completedAt?: string
    executionDetails?: any
    outcomes?: Array<{
      outcomeId: string
      outcomeName: string
      preValue?: number
      postValue?: number
      directionality?: string
    }>
  }>
  outcomeShifts: Array<{
    outcomeId: string
    outcomeName: string
    avgPre: number
    avgPost: number
    avgDelta: number
    sampleCount: number
    directionality: string
  }>
  coAdministeredModalities: string[]
}

let userHistoryDataCache: {
  localUserId: string
  tasks: any[]
  obs: any[]
  timestamp: number
} | null = null

export function clearUserHistoryCache() {
  userHistoryDataCache = null
}

export async function getModalityCompletionHistory(
  localUserId: string, 
  modalityId: string,
  targetDaysCount: number = 66
): Promise<ModalityCompletionHistoryResult> {
  try {
    if (!supabase) {
      return {
        modalityId,
        totalCompletedDays: 0,
        targetDays: targetDaysCount,
        completedDates: [],
        completionDetailsMap: {},
        outcomeShifts: [],
        coAdministeredModalities: []
      }
    }

    const allMods = await getModalities()
    const targetMod = allMods.find(m => m.id === modalityId || m.slug === modalityId)
    const targetId = targetMod?.id || modalityId
    const targetSlug = targetMod?.slug

    const targetModOutcomes = new Set<string>()
    if (targetMod) {
      let functionalOutcomes = targetMod.functional_outcomes_to_track || []
      if (typeof functionalOutcomes === 'string') {
        const cleaned = (functionalOutcomes as string).replace(/^{|}$/g, '')
        functionalOutcomes = cleaned ? cleaned.split(',') : []
      }
      const impactKeys = targetMod.functional_impacts ? Object.keys(targetMod.functional_impacts) : []
      const rawList = [
        targetMod.primary_outcome,
        ...(targetMod.secondary_outcomes || []),
        ...functionalOutcomes,
        ...impactKeys
      ].filter(Boolean)

      rawList.forEach((item: any) => {
        const str = String(typeof item === 'string' ? item : item.id || item.name || '').toLowerCase().trim()
        if (str) {
          targetModOutcomes.add(str)
          targetModOutcomes.add(str.replace(/_/g, ' '))
          targetModOutcomes.add(str.replace(/\s+/g, '_'))
        }
      })
    }

    if (targetModOutcomes.size === 0 && targetMod) {
      const nameLower = (targetMod.display_name || targetMod.name || '').toLowerCase()
      const catLower = (targetMod.category || '').toLowerCase()
      if (nameLower.includes('magnesium') || catLower.includes('sleep') || catLower.includes('nervous system')) {
        ['calmness', 'stress', 'sleep_quality', 'sleep_latency', 'waking_restedness'].forEach(k => {
          targetModOutcomes.add(k)
          targetModOutcomes.add(k.replace(/_/g, ' '))
        })
      } else if (nameLower.includes('cold') || nameLower.includes('sauna') || catLower.includes('thermal')) {
        ['focus', 'energy', 'calmness', 'stress', 'soreness', 'mood'].forEach(k => {
          targetModOutcomes.add(k)
          targetModOutcomes.add(k.replace(/_/g, ' '))
        })
      } else if (catLower.includes('exercise') || catLower.includes('fitness') || catLower.includes('physical')) {
        ['energy', 'soreness', 'strength', 'endurance', 'mood'].forEach(k => {
          targetModOutcomes.add(k)
          targetModOutcomes.add(k.replace(/_/g, ' '))
        })
      }
    }

    if (typeof window !== 'undefined' && targetId) {
      try {
        const raw = localStorage.getItem(`levl_modality_outcomes_${targetId}`)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) {
            parsed.forEach((id: string) => {
              const str = String(id).toLowerCase().trim()
              if (str) {
                targetModOutcomes.add(str)
                targetModOutcomes.add(str.replace(/_/g, ' '))
                targetModOutcomes.add(str.replace(/\s+/g, '_'))
              }
            })
          }
        }
      } catch(e) {}
    }

    // Parallel fetch with session cache
    const now = Date.now()
    let tasks: any[] = []
    let dbObs: any[] = []

    if (userHistoryDataCache && userHistoryDataCache.localUserId === localUserId && (now - userHistoryDataCache.timestamp < 60000)) {
      tasks = userHistoryDataCache.tasks
      dbObs = userHistoryDataCache.obs
    } else {
      const [tasksRes, obsRes] = await Promise.all([
        supabase
          .from('daily_protocol_tasks')
          .select('id, scheduled_date, modality_id, protocol_step_id, status, execution_details, completed_at, created_at')
          .eq('local_user_id', localUserId)
          .eq('status', 'completed'),
        supabase
          .from('outcome_observations')
          .select('id, checkin_date, outcome_id, value_0_10, phase, notes, task_id, session_id, modality_id, outcome:outcome_dimensions(id, name, directionality)')
          .eq('local_user_id', localUserId)
      ])
      tasks = tasksRes.data || []
      dbObs = obsRes.data || []
      userHistoryDataCache = {
        localUserId,
        tasks,
        obs: dbObs,
        timestamp: now
      }
    }

    const dateSet = new Set<string>()
    const detailsMap: Record<string, any> = {}
    const outcomeDateCountMap: Record<string, Set<string>> = {}
    const accurateAcc: Record<string, { preSum: number; postSum: number; preCount: number; postCount: number; name: string; dir: string }> = {}
    const coAdminSet = new Set<string>()

    const modalityTaskIds = new Set<string>()
    const modalitySessionIds = new Set<string>()

    if (tasks && tasks.length > 0) {
      const modalityTasks = tasks.filter((t: any) => {
        const mId = t.modality_id || t.protocol_step_id
        return (
          mId === modalityId || 
          mId === targetId || 
          (targetSlug && mId === targetSlug)
        )
      })

      modalityTasks.forEach((t: any) => {
        if (t.id) modalityTaskIds.add(String(t.id))
        if (t.session_id) modalitySessionIds.add(String(t.session_id))

        const dStr = t.scheduled_date
        if (dStr) {
          dateSet.add(dStr)
          if (!detailsMap[dStr]) {
            detailsMap[dStr] = {
              completedAt: t.completed_at || t.created_at,
              executionDetails: t.execution_details,
              outcomes: []
            }
          } else if (t.execution_details && !detailsMap[dStr].executionDetails) {
            detailsMap[dStr].executionDetails = t.execution_details
          }

          if (t.execution_details?.logged_outcomes && Array.isArray(t.execution_details.logged_outcomes)) {
            t.execution_details.logged_outcomes.forEach((lo: any) => {
              if (!lo.outcomeId) return
              const rawOutId = String(lo.outcomeId).toLowerCase().trim()
              const rawName = lo.outcomeName || rawOutId.replace(/_/g, ' ')
              const normName = rawName.toLowerCase().trim()
              if (targetModOutcomes.size > 0 && !targetModOutcomes.has(rawOutId) && !targetModOutcomes.has(normName) && !targetModOutcomes.has(rawOutId.replace(/_/g, ' '))) {
                return
              }

              const outId = rawOutId
              const outName = rawName.charAt(0).toUpperCase() + rawName.slice(1)
              const dir = lo.directionality || 'higher_is_better'

              let existingOut = detailsMap[dStr].outcomes.find((o: any) => o.outcomeId.toLowerCase() === outId)
              if (!existingOut) {
                existingOut = { outcomeId: outId, outcomeName: outName, directionality: dir }
                detailsMap[dStr].outcomes.push(existingOut)
              }
              if (lo.preValue !== undefined && lo.preValue !== null) existingOut.preValue = Number(lo.preValue)
              if (lo.postValue !== undefined && lo.postValue !== null) existingOut.postValue = Number(lo.postValue)

              if (!outcomeDateCountMap[outId]) outcomeDateCountMap[outId] = new Set<string>()
              if (lo.preValue !== undefined || lo.postValue !== undefined) outcomeDateCountMap[outId].add(dStr)

              if (!accurateAcc[outId]) {
                accurateAcc[outId] = { preSum: 0, postSum: 0, preCount: 0, postCount: 0, name: outName, dir }
              }
              if (lo.preValue !== undefined && lo.preValue !== null) {
                accurateAcc[outId].preSum += Number(lo.preValue)
                accurateAcc[outId].preCount += 1
              }
              if (lo.postValue !== undefined && lo.postValue !== null) {
                accurateAcc[outId].postSum += Number(lo.postValue)
                accurateAcc[outId].postCount += 1
              }
            })
          }
        }
      })

      const activeDates = Array.from(dateSet)
      tasks.forEach((t: any) => {
        if (t.scheduled_date && activeDates.includes(t.scheduled_date)) {
          if (t.modality_id && t.modality_id !== modalityId && t.modality_id !== targetId) {
            coAdminSet.add(t.modality_id)
          }
        }
      })
    }

    let localObs: any[] = []
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(`levl_outcome_obs_${localUserId}`)
        if (raw) {
          const parsed = JSON.parse(raw)
          localObs = (parsed || []).filter((obs: any) => Boolean(obs.modality_id || obs.modalityId || obs.task_id || obs.taskId))
        }
      } catch (e) {}
    }

    const rawObsData = [...(dbObs || []), ...localObs]
    const seenObsKeys = new Set<string>()

    if (rawObsData && rawObsData.length > 0) {
      rawObsData.forEach((obs: any) => {
        const dStr = obs.checkin_date || obs.checkinDate
        const rawId = obs.outcome_id || obs.outcomeId || obs.outcome?.id
        if (!rawId || !dStr) return

        const outId = String(rawId).toLowerCase().trim()
        const rawName = obs.outcome?.name || outId.replace(/_/g, ' ')
        const normName = rawName.toLowerCase().trim()

        // Strict Check 1: Must be in targetModOutcomes if targetModOutcomes is configured
        if (targetModOutcomes.size > 0 && !targetModOutcomes.has(outId) && !targetModOutcomes.has(normName) && !targetModOutcomes.has(outId.replace(/_/g, ' '))) {
          return
        }

        const obsTaskId = obs.task_id || obs.taskId
        const obsSessionId = obs.session_id || obs.sessionId
        const obsModalityId = obs.modality_id || obs.modalityId

        // Strict Check 2: Must specifically belong to this modality or one of its tasks
        const belongsToModality = 
          (obsModalityId && (
            obsModalityId === modalityId || 
            obsModalityId === targetId || 
            (targetSlug && obsModalityId === targetSlug)
          )) ||
          (obsTaskId && modalityTaskIds.has(String(obsTaskId))) ||
          (obsSessionId && modalitySessionIds.has(String(obsSessionId)))

        if (!belongsToModality) return

        const outName = rawName.charAt(0).toUpperCase() + rawName.slice(1)
        const dir = obs.outcome?.directionality || 'higher_is_better'

        const obsKey = `${obs.id || ''}_${dStr}_${outId}_${obs.phase}_${obsTaskId || ''}`
        if (seenObsKeys.has(obsKey)) return
        seenObsKeys.add(obsKey)

        if (!detailsMap[dStr]) {
          detailsMap[dStr] = { outcomes: [] }
        }
        if (!detailsMap[dStr].outcomes) {
          detailsMap[dStr].outcomes = []
        }

        let existingOut = detailsMap[dStr].outcomes.find((o: any) => o.outcomeId.toLowerCase() === outId)
        if (!existingOut) {
          existingOut = { outcomeId: outId, outcomeName: outName, directionality: dir }
          detailsMap[dStr].outcomes.push(existingOut)
        }

        const val = obs.value_0_10 !== undefined ? obs.value_0_10 : obs.value
        if (obs.phase === 'pre') existingOut.preValue = val
        if (obs.phase === 'post') existingOut.postValue = val

        if (!outcomeDateCountMap[outId]) outcomeDateCountMap[outId] = new Set<string>()
        if (val !== undefined) outcomeDateCountMap[outId].add(dStr)

        if (!accurateAcc[outId]) {
          accurateAcc[outId] = { preSum: 0, postSum: 0, preCount: 0, postCount: 0, name: outName, dir }
        }
        if (obs.phase === 'pre' && val !== undefined) {
          accurateAcc[outId].preSum += val
          accurateAcc[outId].preCount += 1
        }
        if (obs.phase === 'post' && val !== undefined) {
          accurateAcc[outId].postSum += val
          accurateAcc[outId].postCount += 1
        }
      })
    }

    const completedDates = Array.from(dateSet).sort()
    const outcomeShifts = Object.entries(accurateAcc)
      .filter(([_, acc]) => acc.preCount > 0 || acc.postCount > 0)
      .map(([id, acc]) => {
        const distinctDaysCount = outcomeDateCountMap[id]?.size || 1
        const avgPre = acc.preCount > 0 ? Math.round((acc.preSum / acc.preCount) * 10) / 10 : 0
        const avgPost = acc.postCount > 0 ? Math.round((acc.postSum / acc.postCount) * 10) / 10 : 0
        const avgDelta = Math.round((avgPost - avgPre) * 10) / 10

        return {
          outcomeId: id,
          outcomeName: acc.name,
          avgPre,
          avgPost,
          avgDelta,
          sampleCount: distinctDaysCount,
          directionality: acc.dir
        }
      })

    return {
      modalityId,
      totalCompletedDays: Math.max(completedDates.length > 0 ? completedDates.length : 0, 0),
      targetDays: targetDaysCount,
      completedDates,
      completionDetailsMap: detailsMap,
      outcomeShifts,
      coAdministeredModalities: Array.from(coAdminSet)
    }
  } catch (err) {
    console.error('Error fetching modality completion history:', err)
    return {
      modalityId,
      totalCompletedDays: 0,
      targetDays: targetDaysCount,
      completedDates: [],
      completionDetailsMap: {},
      outcomeShifts: [],
      coAdministeredModalities: []
    }
  }
}

export async function addSingleModalityToToday(localUserId: string, dateStr: string, modalityId: string) {
  if (!supabase) return null
  
  const modality = await getModalityById(modalityId)
  if (!modality) return null

  const { data: existing } = await supabase
    .from('daily_protocol_tasks')
    .select('id')
    .eq('local_user_id', localUserId)
    .eq('scheduled_date', dateStr)
    .eq('modality_id', modalityId)
    .maybeSingle()

  if (existing) return existing.id

  const { data, error } = await supabase
    .from('daily_protocol_tasks')
    .insert([{
      local_user_id: localUserId,
      modality_id: modalityId,
      scheduled_date: dateStr,
      status: 'pending',
      timing_slot: modality.timing_summary || 'morning'
    }])
    .select('id')
    .single()

  if (error) {
    console.error('[addSingleModalityToToday] Error inserting task:', error)
    return null
  }

  return data?.id || null
}

