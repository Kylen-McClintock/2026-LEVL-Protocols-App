import { supabase } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

/**
 * Automatically merges/migrates any guest local session data to the authenticated user's account.
 */
export async function linkGuestDataToAuthUser(guestId: string, authUser: User): Promise<void> {
  if (!supabase || !guestId || !authUser || guestId === authUser.id) {
    return
  }

  try {
    // 1. Ensure user_profile exists for authUser.id
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle()

    const { data: guestProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', guestId)
      .maybeSingle()

    if (!existingProfile) {
      if (guestProfile) {
        // Clone guest profile under the authenticated user ID
        const newProfile = {
          ...guestProfile,
          id: authUser.id,
          email: authUser.email || guestProfile.email,
          name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || guestProfile.name || 'Protocol Optimizer',
          updated_at: new Date().toISOString()
        }
        await supabase.from('user_profiles').upsert(newProfile)
      } else {
        await supabase.from('user_profiles').upsert({
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || 'Protocol Optimizer',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }
    } else if (guestProfile && !existingProfile.equipment_profile?.length) {
      // Merge preferences if existing profile was blank
      await supabase.from('user_profiles').update({
        equipment_profile: guestProfile.equipment_profile || existingProfile.equipment_profile,
        primary_goal: guestProfile.primary_goal || existingProfile.primary_goal,
        preferred_time_slots: guestProfile.preferred_time_slots || existingProfile.preferred_time_slots,
        updated_at: new Date().toISOString()
      }).eq('id', authUser.id)
    }

    // 2. Re-assign all guest tasks to the authenticated user
    await supabase
      .from('daily_protocol_tasks')
      .update({ user_id: authUser.id })
      .eq('user_id', guestId)

    // 3. Re-assign wellbeing checkins
    await supabase
      .from('daily_wellbeing_checkins')
      .update({ user_id: authUser.id })
      .eq('user_id', guestId)

    // 4. Re-assign bench items (avoid duplicate unique constraint collisions if any)
    const { data: guestBench } = await supabase
      .from('user_bench_items')
      .select('modality_id')
      .eq('user_id', guestId)

    if (guestBench && guestBench.length > 0) {
      const { data: userBench } = await supabase
        .from('user_bench_items')
        .select('modality_id')
        .eq('user_id', authUser.id)

      const existingModalityIds = new Set((userBench || []).map(b => b.modality_id))
      const toMigrate = guestBench.filter(b => !existingModalityIds.has(b.modality_id)).map(b => b.modality_id)

      if (toMigrate.length > 0) {
        await supabase
          .from('user_bench_items')
          .update({ user_id: authUser.id })
          .eq('user_id', guestId)
          .in('modality_id', toMigrate)
      }
    }

    // 5. Re-assign user protocol instances
    await supabase
      .from('user_protocol_instances')
      .update({ user_id: authUser.id })
      .eq('user_id', guestId)

    // 6. Re-assign outcome observations
    await supabase
      .from('outcome_observations')
      .update({ user_id: authUser.id })
      .eq('user_id', guestId)

  } catch (error) {
    console.error('Error linking guest data to authenticated user:', error)
  }
}
