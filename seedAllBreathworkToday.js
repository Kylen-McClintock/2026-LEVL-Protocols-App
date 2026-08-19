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

  const tasksToSeed = [
    {
      local_user_id: localUserId,
      scheduled_date: todayStr,
      modality_id: 'cyclic_hyperventilation',
      timing_slot: 'morning',
      status: 'pending'
    },
    {
      local_user_id: localUserId,
      scheduled_date: todayStr,
      modality_id: 'box_breathing',
      timing_slot: 'midday',
      status: 'pending'
    },
    {
      local_user_id: localUserId,
      scheduled_date: todayStr,
      modality_id: 'coherent_breathing',
      timing_slot: 'afternoon',
      status: 'pending'
    },
    {
      local_user_id: localUserId,
      scheduled_date: todayStr,
      modality_id: 'breathing_4_7_8',
      timing_slot: 'wind_down',
      status: 'pending'
    }
  ];

  for (const task of tasksToSeed) {
    const { data: existing } = await supabase
      .from('daily_protocol_tasks')
      .select('id')
      .eq('local_user_id', localUserId)
      .eq('scheduled_date', todayStr)
      .eq('modality_id', task.modality_id)
      .maybeSingle();

    if (!existing) {
      await supabase.from('daily_protocol_tasks').insert(task);
    } else {
      await supabase.from('daily_protocol_tasks').update(task).eq('id', existing.id);
    }
  }

  console.log('Successfully seeded all 4 breathwork modalities across Morning, Midday, Afternoon, and Wind Down for today!');
}

run();
