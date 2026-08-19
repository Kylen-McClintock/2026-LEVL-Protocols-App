const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (fs.existsSync('.env.local')) {
  const envText = fs.readFileSync('.env.local', 'utf-8');
  envText.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length) {
      const val = vals.join('=').trim().replace(/^["']|["']$/g, '');
      if (key.trim() === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = val;
      if (key.trim() === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') supabaseKey = val;
    }
  });
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectBloodwork() {
  const { data: panels, error: pErr } = await supabase.from('user_lab_panels').select('*');
  console.log("Panels in Supabase:", panels?.length, "Error:", pErr);
  if (panels && panels.length > 0) {
    console.log("Panel records:", JSON.stringify(panels, null, 2));
  }

  const { data: meas, error: mErr } = await supabase.from('biomarker_measurements').select('*');
  console.log("Biomarkers in Supabase:", meas?.length, "Error:", mErr);
  if (meas && meas.length > 0) {
    console.log("Sample biomarkers:", meas.slice(0, 5));
  }

  const { data: profiles } = await supabase.from('user_profiles').select('*');
  console.log("User Profiles in Supabase:", profiles?.length, profiles?.map(p => ({ local_user_id: p.local_user_id, display_name: p.display_name })));
}

inspectBloodwork();
