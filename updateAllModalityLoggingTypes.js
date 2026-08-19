const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  console.log("Fetching all modalities...");
  const { data: modalities, error } = await supabase.from('modalities').select('*');
  if (error) {
    console.error("Error fetching modalities:", error);
    return;
  }

  console.log(`Processing ${modalities.length} modalities...`);
  let updatedCount = 0;

  for (const m of modalities) {
    let targetLoggingType = m.logging_type || 'boolean';
    const nameLower = (m.name || '').toLowerCase();
    const catLower = (m.category || '').toLowerCase();
    const typeLower = (m.modality_type || '').toLowerCase();

    // Determine ideal logging_type
    if (nameLower.includes('sauna') || nameLower.includes('cold') || nameLower.includes('plunge') || nameLower.includes('ice bath') || nameLower.includes('thermal') || typeLower === 'cold_exposure') {
      targetLoggingType = 'thermal';
    } else if (nameLower.includes('breath') || nameLower.includes('sigh') || nameLower.includes('wim hof') || nameLower.includes('meditat') || nameLower.includes('anapanasati')) {
      targetLoggingType = 'breathwork';
    } else if (nameLower.includes('zone 2') || nameLower.includes('vo2 max') || nameLower.includes('cardio') || nameLower.includes('hiit') || nameLower.includes('run') || nameLower.includes('cycle') || catLower.includes('cardiovascular')) {
      targetLoggingType = 'cardio';
    } else if (nameLower.includes('resistance') || nameLower.includes('hypertrophy') || nameLower.includes('strength') || nameLower.includes('bfr') || nameLower.includes('weightlift')) {
      targetLoggingType = 'strength';
    } else if (nameLower.includes('fast') || nameLower.includes('omad') || nameLower.includes('feeding') || nameLower.includes('trf') || typeLower === 'fasting' || catLower.includes('fasting')) {
      targetLoggingType = 'fasting';
    } else if (typeLower === 'supplement' || catLower.includes('biochemistry') || catLower.includes('supplement') || catLower.includes('nutrition') || catLower.includes('longevity & neurology') || catLower.includes('tissue & joint') || catLower.includes('inflammation')) {
      targetLoggingType = 'supplement';
    }

    if (targetLoggingType !== m.logging_type) {
      console.log(`Updating ${m.id} (${m.name}): ${m.logging_type} -> ${targetLoggingType}`);
      const { error: updateErr } = await supabase
        .from('modalities')
        .update({ logging_type: targetLoggingType, updated_at: new Date().toISOString() })
        .eq('id', m.id);

      if (updateErr) {
        console.error(`Failed to update ${m.id}:`, updateErr.message);
      } else {
        updatedCount++;
      }
    }
  }

  console.log(`Successfully updated ${updatedCount} modalities.`);
}

main();
