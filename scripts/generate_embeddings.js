const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());
const { createClient } = require('@supabase/supabase-js');
const { embed } = require('ai');
const { createGoogleGenerativeAI } = require('@ai-sdk/google');

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  console.log("Fetching modalities...");
  const { data: modalities, error } = await supabase
    .from('modalities')
    .select('id, name, brief_description, primary_outcome, category');

  if (error) {
    console.error("Error fetching modalities:", error);
    return;
  }

  console.log(`Found ${modalities.length} modalities to process.`);

  for (const m of modalities) {
    const textToEmbed = `${m.name}. Category: ${m.category || 'N/A'}. Description: ${m.brief_description}. Primary Outcome: ${m.primary_outcome}`;
    
    try {
      const { embedding } = await embed({
        model: google.textEmbeddingModel('gemini-embedding-001'),
        value: textToEmbed,
      });

      // Update Supabase
      const { error: updateError } = await supabase
        .from('modalities')
        .update({ embedding })
        .eq('id', m.id);

      if (updateError) {
        console.error(`Failed to update ${m.id}:`, updateError.message);
      } else {
        console.log(`Embedded and saved: ${m.id}`);
      }

      // Small delay to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (e) {
      console.error(`Error embedding ${m.id}:`, e);
    }
  }

  console.log("Done backfilling embeddings.");
}

main();
