import { supabase } from '../supabase/client'
import {
  UserProfile,
  Modality,
  Protocol,
  OutcomeDimension,
  UserBenchItem,
  DailySession,
  DailyWellbeingCheckin
} from '../types'

export async function getModalities(): Promise<Modality[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('modalities').select('*')
  if (error) {
    console.error('Error fetching modalities:', error)
    return []
  }
  return data as Modality[]
}

export async function getModalityById(id: string): Promise<Modality | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from('modalities').select('*').eq('id', id).single()
  if (error) return null
  return data as Modality
}

export async function getProtocols(): Promise<Protocol[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('protocols').select('*')
  if (error) return []
  return data as Protocol[]
}

export async function getOutcomeDimensions(): Promise<OutcomeDimension[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('outcome_dimensions').select('*')
  if (error) return []
  return data as OutcomeDimension[]
}

export async function getOrCreateUserProfile(localUserId: string): Promise<UserProfile | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('local_user_id', localUserId)
    .single()

  if (data) return data as UserProfile

  if (error && error.code !== 'PGRST116') {
    // some other error
    console.error('Error fetching profile:', error)
    return null
  }

  // Create it
  const { data: newProfile, error: insertError } = await supabase
    .from('user_profiles')
    .insert([{ local_user_id: localUserId }])
    .select()
    .single()

  if (insertError) {
    console.error('Error creating profile:', insertError)
    return null
  }

  return newProfile as UserProfile
}

export async function updateUserProfile(localUserId: string, updates: Partial<UserProfile>) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('local_user_id', localUserId)
    .select()
    .single()

  if (error) {
    console.error('Error updating profile:', error)
    return null
  }
  return data as UserProfile
}

export async function getBenchItems(localUserId: string): Promise<UserBenchItem[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('user_bench_items')
    .select('*, modality:modalities(*)')
    .eq('local_user_id', localUserId)
  if (error) return []
  return data as UserBenchItem[]
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

export async function getDailySessions(localUserId: string, date: string): Promise<DailySession[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('daily_sessions')
    .select('*, modality:modalities(*)')
    .eq('local_user_id', localUserId)
    .eq('session_date', date)

  if (error) return []
  return data as DailySession[]
}

export async function createDailySession(localUserId: string, date: string, modalityId: string, archetype?: string) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('daily_sessions')
    .insert([{ 
      local_user_id: localUserId, 
      session_date: date, 
      modality_id: modalityId, 
      relative_time_archetype: archetype 
    }])
    .select()
    .single()
    
  if (error) return null
  return data
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
    .single()

  if (error) return null
  return data
}

export async function saveOutcomeObservation(localUserId: string, sessionId: string, outcomeId: string, phase: string, value: number) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('outcome_observations')
    .insert([{ local_user_id: localUserId, session_id: sessionId, outcome_id: outcomeId, phase, value_0_10: value }])
    .select()
    .single()
    
  if (error) return null
  return data
}

export async function getDailyWellbeingCheckin(localUserId: string, date: string): Promise<DailyWellbeingCheckin | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('daily_wellbeing_checkins')
    .select('*')
    .eq('local_user_id', localUserId)
    .eq('checkin_date', date)
    .single()

  if (error) return null
  return data as DailyWellbeingCheckin
}

export async function saveDailyWellbeingCheckin(localUserId: string, date: string, mood?: number, energy?: number, stress?: number) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('daily_wellbeing_checkins')
    .upsert({ 
      local_user_id: localUserId, 
      checkin_date: date, 
      mood_0_10: mood, 
      energy_0_10: energy, 
      stress_0_10: stress 
    }, { onConflict: 'local_user_id,checkin_date' })
    .select()
    .single()

  if (error) return null
  return data
}
