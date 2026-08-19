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
    .select('id, name, category, status, visibility, review_status')
    .or('name.ilike.%fast%,category.ilike.%fast%');

  if (error) {
    console.error("Error querying Supabase:", error);
    return;
  }

  console.log(`Found ${data.length} fasting modalities in Supabase:`);
  data.forEach(m => {
    console.log(`- [${m.id}] ${m.name} | Cat: ${m.category} | Status: ${m.status} | Vis: ${m.visibility}`);
  });
}

check();
