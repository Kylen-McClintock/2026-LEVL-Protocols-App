const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  const { data, error } = await supabase
    .from('modalities')
    .select('id, name, visibility, status');

  if (error) {
    console.error("Error querying Supabase:", error);
    return;
  }

  const counts = {};
  data.forEach(m => {
    counts[m.visibility] = (counts[m.visibility] || 0) + 1;
  });

  console.log("Modality Visibility counts across entire DB:", counts);
}

check();
