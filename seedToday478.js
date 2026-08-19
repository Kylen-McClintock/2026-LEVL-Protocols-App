const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const localUserId = 'default_local_user';
  const todayStr = '2026-08-06'; // Today's local date

  const task = {
    local_user_id: localUserId,
    scheduled_date: todayStr,
    modality_id: 'breathing_4_7_8',
    timing_slot: 'evening',
    status: 'pending'
  };

  const { data, error } = await supabase.from('daily_protocol_tasks').insert([task]).select();
  if (error) {
    console.error('Error seeding 4-7-8 for today:', error);
  } else {
    console.log('Successfully added 4-7-8 Relaxing Breathwork to Today view for local user!');
  }
}

run();
