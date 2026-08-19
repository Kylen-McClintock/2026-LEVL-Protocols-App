const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const localUserId = 'default_local_user';
  const todayStr = '2026-08-06';

  // Upsert breathing_4_7_8 in wind_down section for today
  const { data, error } = await supabase
    .from('daily_protocol_tasks')
    .upsert([
      {
        local_user_id: localUserId,
        scheduled_date: todayStr,
        modality_id: 'breathing_4_7_8',
        timing_slot: 'wind_down',
        status: 'pending'
      }
    ])
    .select();

  if (error) {
    console.error('Error scheduling 4-7-8 for wind_down:', error);
  } else {
    console.log('Successfully set 4-7-8 Relaxing Breathwork in Wind Down section for today!');
  }
}

run();
