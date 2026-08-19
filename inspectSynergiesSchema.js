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
    .select('*')
    .limit(1);

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log("Modality Keys:", Object.keys(data[0]));
  console.log("Sample Taurine record:", data[0]);
}

check();
