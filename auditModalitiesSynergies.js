const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function audit() {
  const { data, error } = await supabase
    .from('modalities')
    .select('id, name, display_name, category, synergy_notes, antagonism_notes');

  if (error) {
    console.error("Error:", error);
    return;
  }

  let total = data.length;
  let missingSynergies = 0;
  let missingAntagonisms = 0;

  data.forEach(m => {
    const hasSyn = m.synergy_notes && (typeof m.synergy_notes === 'string' ? m.synergy_notes.length > 0 : Object.keys(m.synergy_notes).length > 0);
    const hasAnt = m.antagonism_notes && (typeof m.antagonism_notes === 'string' ? m.antagonism_notes.length > 0 : Object.keys(m.antagonism_notes).length > 0);

    if (!hasSyn) missingSynergies++;
    if (!hasAnt) missingAntagonisms++;

    console.log(`- [${m.id}] ${m.display_name || m.name} | Syn: ${hasSyn ? 'YES' : 'MISSING'} | Ant: ${hasAnt ? 'YES' : 'MISSING'}`);
  });

  console.log(`\nSummary: ${missingSynergies}/${total} missing synergies, ${missingAntagonisms}/${total} missing antagonisms.`);
}

audit();
