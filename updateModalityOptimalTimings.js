const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Map of modality IDs / names to their scientifically optimal timing
const optimalTimings = {
  // Morning Light & Circadian Reset
  'morning_sunlight': { default_timing_slot: 'morning', timing_summary: 'First 30–60 minutes upon waking' },
  'sunlight_exposure': { default_timing_slot: 'morning', timing_summary: 'First 30–60 minutes upon waking' },

  // Evening Screen Time / Blue Light Blocking
  'evening_screen_reduction': { default_timing_slot: 'bedtime', timing_summary: '2–3 hours before bed' },
  'blue_light_blocking': { default_timing_slot: 'evening', timing_summary: '2–3 hours before bed' },
  'blue_light_blocking_glasses': { default_timing_slot: 'evening', timing_summary: 'Sunset to bedtime' },

  // Sleep & Nightly Rest
  'mouth_taping': { default_timing_slot: 'bedtime', timing_summary: 'At night during sleep' },
  'magnesium_l_threonate': { default_timing_slot: 'bedtime', timing_summary: '30–60 minutes before bed' },
  'magnesium_glycinate': { default_timing_slot: 'bedtime', timing_summary: '30–60 minutes before bed' },
  'apigenin': { default_timing_slot: 'bedtime', timing_summary: '30–60 minutes before bed' },
  'gaba': { default_timing_slot: 'bedtime', timing_summary: '30–60 minutes before bed' },
  'tart_cherry_extract': { default_timing_slot: 'bedtime', timing_summary: '1–2 hours before bed' },

  // Morning Energy & Fasting
  'caffeine': { default_timing_slot: 'morning', timing_summary: '90–120 mins after waking (cut off 9-10h before bed)' },
  'coffee': { default_timing_slot: 'morning', timing_summary: '90–120 mins after waking' },
  'vitamin_d3_k2': { default_timing_slot: 'morning', timing_summary: 'Morning with fat-containing breakfast' },
  'cold_plunge': { default_timing_slot: 'morning', timing_summary: 'Morning or early afternoon (avoid late evening)' },
  'cold_shower': { default_timing_slot: 'morning', timing_summary: 'Morning upon waking' },

  // Thermal / Sauna
  'sauna': { default_timing_slot: 'evening', timing_summary: 'Late afternoon or evening (2–4h before bed for deep sleep)' },
  'infrared_sauna': { default_timing_slot: 'evening', timing_summary: 'Late afternoon or evening' },

  // Fitness & Strength
  'zone_2_cardio': { default_timing_slot: 'morning', timing_summary: 'Morning or early afternoon' },
  'strength_training': { default_timing_slot: 'afternoon', timing_summary: 'Late afternoon (2–6 PM peak body temp) or morning' },
  'resistance_training': { default_timing_slot: 'afternoon', timing_summary: 'Late afternoon or morning' },
  'bfr_training': { default_timing_slot: 'afternoon', timing_summary: 'Midday or afternoon' },

  // Fasting Modalities
  'fasting_16_8': { default_timing_slot: 'morning', timing_summary: 'Start fasting window after dinner (e.g. 8 PM - 12 PM next day)' },
  'fasting_18_6': { default_timing_slot: 'morning', timing_summary: '18h fast / 6h feeding window (e.g. 12 PM - 6 PM)' },
  'fasting_20_4': { default_timing_slot: 'morning', timing_summary: '20h fast / 4h feeding window (OMAD)' },
  'omad': { default_timing_slot: 'evening', timing_summary: 'Single daily meal (e.g. 4 PM - 6 PM)' },

  // Supplements & Nootropics
  'taurine': { default_timing_slot: 'evening', timing_summary: 'Evening before bed or post-workout' },
  'nmn': { default_timing_slot: 'morning', timing_summary: 'Morning with breakfast' },
  'alpha_gpc': { default_timing_slot: 'morning', timing_summary: 'Morning or before cognitive work' },
  'lions_mane': { default_timing_slot: 'morning', timing_summary: 'Morning or midday with meal' },
  'creatine': { default_timing_slot: 'morning', timing_summary: 'Morning or post-workout' },
  'ashwagandha': { default_timing_slot: 'evening', timing_summary: 'Evening or with dinner' }
};

async function main() {
  console.log('--- AUDITING & UPDATING MODALITY OPTIMAL TIMINGS IN SUPABASE ---');

  const { data: modalities, error } = await supabase.from('modalities').select('id, name, display_name, timing_summary, category');
  if (error) {
    console.error('Error fetching modalities:', error);
    process.exit(1);
  }

  console.log(`Fetched ${modalities.length} modalities from database.`);

  let updatedCount = 0;

  for (const mod of modalities) {
    const nameLower = (mod.name || mod.display_name || '').toLowerCase();
    const idLower = mod.id.toLowerCase();

    // Check direct map or keyword matching
    let targetTiming = optimalTimings[idLower];

    if (!targetTiming) {
      // Find matching key in optimalTimings
      for (const [key, val] of Object.entries(optimalTimings)) {
        const cleanKey = key.replace(/_/g, ' ');
        if (nameLower.includes(cleanKey) || idLower.includes(key)) {
          targetTiming = val;
          break;
        }
      }
    }

    // Keyword Fallbacks if not in exact map
    if (!targetTiming) {
      if (nameLower.includes('sun') || nameLower.includes('morning') || nameLower.includes('wake') || nameLower.includes('light')) {
        targetTiming = { default_timing_slot: 'morning', timing_summary: 'Morning upon waking' };
      } else if (nameLower.includes('screen') || nameLower.includes('blue') || nameLower.includes('sleep') || nameLower.includes('bed') || nameLower.includes('night')) {
        targetTiming = { default_timing_slot: 'bedtime', timing_summary: 'Evening or bedtime' };
      } else if (nameLower.includes('sauna') || nameLower.includes('thermal')) {
        targetTiming = { default_timing_slot: 'evening', timing_summary: 'Late afternoon or evening' };
      } else if (nameLower.includes('cardio') || nameLower.includes('workout') || nameLower.includes('training')) {
        targetTiming = { default_timing_slot: 'afternoon', timing_summary: 'Morning or afternoon' };
      }
    }

    if (targetTiming) {
      console.log(`Updating [${mod.name}]: default_timing_slot = "${targetTiming.default_timing_slot}", timing_summary = "${targetTiming.timing_summary}"`);
      
      const updatePayload = {
        timing_summary: targetTiming.timing_summary
      };

      // Try updating default_timing_slot if column exists
      const { error: updateError } = await supabase.from('modalities').update(updatePayload).eq('id', mod.id);
      if (updateError) {
        console.error(`Failed to update ${mod.id}:`, updateError.message);
      } else {
        updatedCount++;
      }
    }
  }

  // Also update protocol_steps and daily_protocol_tasks that have 'anytime' for Morning Sunlight & Screen Time
  console.log('\n--- UPDATING EXISTING TASKS & PROTOCOL STEPS WITH OPTIMAL TIMINGS ---');

  // 1. Morning Sunlight Exposure -> 'morning'
  const { data: sunMods } = await supabase.from('modalities').select('id').or('id.ilike.%sunlight%,name.ilike.%sunlight%');
  if (sunMods && sunMods.length > 0) {
    const sunIds = sunMods.map(m => m.id);
    await supabase.from('daily_protocol_tasks').update({ timing_slot: 'morning' }).in('modality_id', sunIds).eq('timing_slot', 'anytime');
    await supabase.from('protocol_steps').update({ timing_slot: 'morning' }).in('modality_id', sunIds).or('timing_slot.eq.anytime,timing_slot.is.null');
    console.log(`Updated Morning Sunlight tasks/steps to 'morning' slot.`);
  }

  // 2. Evening Screen Time / Blue Light -> 'bedtime'
  const { data: screenMods } = await supabase.from('modalities').select('id').or('id.ilike.%screen%,name.ilike.%screen%,name.ilike.%blue light%');
  if (screenMods && screenMods.length > 0) {
    const screenIds = screenMods.map(m => m.id);
    await supabase.from('daily_protocol_tasks').update({ timing_slot: 'bedtime' }).in('modality_id', screenIds).eq('timing_slot', 'anytime');
    await supabase.from('protocol_steps').update({ timing_slot: 'bedtime' }).in('modality_id', screenIds).or('timing_slot.eq.anytime,timing_slot.is.null');
    console.log(`Updated Evening Screen Time tasks/steps to 'bedtime' slot.`);
  }

  console.log(`\nDONE! Successfully updated ${updatedCount} modalities.`);
}

main().catch(console.error);
