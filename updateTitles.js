const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  await supabase
    .from('modalities')
    .update({
      name: 'Cyclic Hyperventilation (Wim Hof Method)',
      display_name: 'Cyclic Hyperventilation (Wim Hof Method)'
    })
    .eq('id', 'cyclic_hyperventilation');

  await supabase
    .from('modalities')
    .update({
      name: 'Box Breathing (Navy SEAL Method)',
      display_name: 'Box Breathing (Navy SEAL Method)'
    })
    .eq('id', 'box_breathing');

  await supabase
    .from('modalities')
    .update({
      name: 'Coherent 5.5s Breathing (Max HRV)',
      display_name: 'Coherent 5.5s Breathing (Max HRV)'
    })
    .eq('id', 'coherent_breathing');

  console.log('Successfully updated modality titles in Supabase!');
}

run();
