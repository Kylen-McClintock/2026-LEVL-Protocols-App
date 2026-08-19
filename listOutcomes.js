const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const { data, error } = await supabase.from('outcome_dimensions').select('*').order('name');
  if (error) {
    console.error(error);
    return;
  }
  console.log('ALL OUTCOME DIMENSIONS IN SUPABASE DATABASE:');
  console.log(JSON.stringify(data, null, 2));
}

run();
