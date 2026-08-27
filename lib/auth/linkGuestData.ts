import { supabase } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { updateUserProfile } from '@/lib/data'

/**
 * Automatically merges/migrates any guest local session data to the authenticated user's account in Supabase.
 */
export async function linkGuestDataToAuthUser(guestId: string, authUser: User): Promise<void> {
  if (!guestId || !authUser || guestId === authUser.id) {
    return
  }

  // 1. Re-index and copy client-side LocalStorage cache so data is instant offline
  if (typeof window !== 'undefined') {
    try {
      // Profile cache
      const guestProfKey = `levl_user_profile_${guestId}`
      const authProfKey = `levl_user_profile_${authUser.id}`
      const guestProfRaw = localStorage.getItem(guestProfKey)
      if (guestProfRaw && !localStorage.getItem(authProfKey)) {
        localStorage.setItem(authProfKey, guestProfRaw)
      }

      // Observations cache
      const guestObsKey = `levl_outcome_obs_${guestId}`
      const authObsKey = `levl_outcome_obs_${authUser.id}`
      const guestObsRaw = localStorage.getItem(guestObsKey)
      if (guestObsRaw && !localStorage.getItem(authObsKey)) {
        localStorage.setItem(authObsKey, guestObsRaw)
      }

      // Bench items cache
      const guestBenchKey = `levl_user_bench_${guestId}`
      const authBenchKey = `levl_user_bench_${authUser.id}`
      const guestBenchRaw = localStorage.getItem(guestBenchKey)
      if (guestBenchRaw && !localStorage.getItem(authBenchKey)) {
        localStorage.setItem(authBenchKey, guestBenchRaw)
      }

      // Daily tasks cache
      const todayStr = new Date().toISOString().split('T')[0]
      const guestTasksKey = `levl_daily_tasks_${guestId}_${todayStr}`
      const authTasksKey = `levl_daily_tasks_${authUser.id}_${todayStr}`
      const guestTasksRaw = localStorage.getItem(guestTasksKey)
      if (guestTasksRaw && !localStorage.getItem(authTasksKey)) {
        localStorage.setItem(authTasksKey, guestTasksRaw)
      }

      // Wellbeing checkins cache
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(`levl_wellbeing_${guestId}_`)) {
          const datePart = key.replace(`levl_wellbeing_${guestId}_`, '')
          const targetKey = `levl_wellbeing_${authUser.id}_${datePart}`
          const val = localStorage.getItem(key)
          if (val && !localStorage.getItem(targetKey)) {
            localStorage.setItem(targetKey, val)
          }
        }
      }

      // Hotkeys cache
      const guestHotkeysKey = `levl_user_hotkeys_${guestId}`
      const authHotkeysKey = `levl_user_hotkeys_${authUser.id}`
      const guestHotkeysRaw = localStorage.getItem(guestHotkeysKey) || localStorage.getItem('levl_user_hotkeys')
      if (guestHotkeysRaw) {
        localStorage.setItem(authHotkeysKey, guestHotkeysRaw)
      }

      const guestCustomKey = `levl_custom_created_hotkeys_${guestId}`
      const authCustomKey = `levl_custom_created_hotkeys_${authUser.id}`
      const guestCustomRaw = localStorage.getItem(guestCustomKey)
      if (guestCustomRaw) {
        localStorage.setItem(authCustomKey, guestCustomRaw)
      }

      // Update active local user ID
      localStorage.setItem('levl_local_user_id', authUser.id)
    } catch (e) {
      console.warn('Notice mirroring local storage keys for auth user:', e)
    }
  }

  if (!supabase) return

  try {
    // 2. Fetch guest profile and existing auth profile from Supabase
    const { data: guestProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('local_user_id', guestId)
      .maybeSingle()

    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('local_user_id', authUser.id)
      .maybeSingle()

    if (!existingProfile) {
      if (guestProfile) {
        // Clone guest profile under the authenticated user's local_user_id
        await updateUserProfile(authUser.id, {
          ...guestProfile,
          display_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || guestProfile.display_name || 'Protocol Optimizer'
        })
      } else {
        await updateUserProfile(authUser.id, {
          display_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || 'Protocol Optimizer'
        })
      }
    } else if (guestProfile) {
      // Merge preferences, hotkey configs, and daily click logs from guest into existing auth profile
      const guestPref = (guestProfile.outcome_preference_scores as any) || {}
      const authPref = (existingProfile.outcome_preference_scores as any) || {}
      const mergedDailyLogs = {
        ...(guestPref._daily_quick_logs || {}),
        ...(authPref._daily_quick_logs || {})
      }
      const mergedPref = {
        ...guestPref,
        ...authPref,
        _custom_hotkeys: authPref._custom_hotkeys || guestPref._custom_hotkeys,
        _created_custom_hotkeys: authPref._created_custom_hotkeys || guestPref._created_custom_hotkeys,
        _daily_quick_logs: mergedDailyLogs
      }

      await updateUserProfile(authUser.id, {
        primary_goals: existingProfile.primary_goals?.length ? existingProfile.primary_goals : (guestProfile.primary_goals || existingProfile.primary_goals),
        outcome_preference_scores: mergedPref,
        hardware_access: existingProfile.hardware_access?.length ? existingProfile.hardware_access : (guestProfile.hardware_access || existingProfile.hardware_access)
      })
    }

    // 3. Migrate all daily protocol tasks to the authenticated local_user_id
    await supabase
      .from('daily_protocol_tasks')
      .update({ local_user_id: authUser.id })
      .eq('local_user_id', guestId)

    // 4. Migrate daily wellbeing checkins (prevent duplicate date collision)
    const { data: existingCheckins } = await supabase
      .from('daily_wellbeing_checkins')
      .select('checkin_date')
      .eq('local_user_id', authUser.id)

    const existingDates = new Set((existingCheckins || []).map(c => c.checkin_date))

    const { data: guestCheckins } = await supabase
      .from('daily_wellbeing_checkins')
      .select('checkin_date')
      .eq('local_user_id', guestId)

    if (guestCheckins && guestCheckins.length > 0) {
      const datesToMigrate = guestCheckins.filter(c => !existingDates.has(c.checkin_date)).map(c => c.checkin_date)
      if (datesToMigrate.length > 0) {
        await supabase
          .from('daily_wellbeing_checkins')
          .update({ local_user_id: authUser.id })
          .eq('local_user_id', guestId)
          .in('checkin_date', datesToMigrate)
      }
    }

    // 5. Migrate user bench items & copy custom dosage / timing overrides
    const { data: guestBench } = await supabase
      .from('user_bench_items')
      .select('*')
      .eq('local_user_id', guestId)

    if (guestBench && guestBench.length > 0) {
      const { data: userBench } = await supabase
        .from('user_bench_items')
        .select('*')
        .eq('local_user_id', authUser.id)

      const existingModIds = new Set((userBench || []).map(b => b.modality_id).filter(Boolean))
      const existingProtIds = new Set((userBench || []).map(b => b.protocol_id).filter(Boolean))

      // 5a. If auth profile already has this modality row, copy guest's custom dosage & timing overrides
      for (const gb of guestBench) {
        if (gb.modality_id && existingModIds.has(gb.modality_id)) {
          if (gb.custom_dose || gb.custom_timing || gb.notes) {
            await supabase
              .from('user_bench_items')
              .update({
                custom_dose: gb.custom_dose,
                custom_timing: gb.custom_timing,
                notes: gb.notes,
                updated_at: new Date().toISOString()
              })
              .eq('local_user_id', authUser.id)
              .eq('modality_id', gb.modality_id)
          }
        }
      }

      // 5b. Migrate non-colliding guest bench items
      const modsToMigrate = guestBench
        .filter(b => b.modality_id && !existingModIds.has(b.modality_id))
        .map(b => b.modality_id as string)

      const protsToMigrate = guestBench
        .filter(b => b.protocol_id && !existingProtIds.has(b.protocol_id))
        .map(b => b.protocol_id as string)

      if (modsToMigrate.length > 0) {
        await supabase
          .from('user_bench_items')
          .update({ local_user_id: authUser.id })
          .eq('local_user_id', guestId)
          .in('modality_id', modsToMigrate)
      }

      if (protsToMigrate.length > 0) {
        await supabase
          .from('user_bench_items')
          .update({ local_user_id: authUser.id })
          .eq('local_user_id', guestId)
          .in('protocol_id', protsToMigrate)
      }
    }

    // 6. Migrate protocol instances
    await supabase
      .from('user_protocol_instances')
      .update({ local_user_id: authUser.id })
      .eq('local_user_id', guestId)

    // 7. Migrate outcome observations
    await supabase
      .from('outcome_observations')
      .update({ local_user_id: authUser.id })
      .eq('local_user_id', guestId)

    // 8. Migrate lab panels & biomarker measurements (tables that use user_id)
    await supabase
      .from('user_lab_panels')
      .update({ user_id: authUser.id })
      .eq('user_id', guestId)

    await supabase
      .from('biomarker_measurements')
      .update({ user_id: authUser.id })
      .eq('user_id', guestId)

    await supabase
      .from('bioage_calculation_logs')
      .update({ user_id: authUser.id })
      .eq('user_id', guestId)

  } catch (error) {
    console.error('Error linking guest data to authenticated user:', error)
  }
}
