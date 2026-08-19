const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());
const { createClient } = require('@supabase/supabase-js');
const { embed } = require('ai');
const { createGoogleGenerativeAI } = require('@ai-sdk/google');

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

async function main() {
  const query = "libido";
  const { embedding } = await embed({
    model: google.textEmbeddingModel('text-embedding-004'),
    value: query,
  });

  console.log("Embedding dimensions:", embedding.length);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data, error } = await supabase.rpc('match_modalities', {
    query_embedding: embedding,
    query_text: query,
    match_count: 50,
    filter_category: null
  });

  if (error) {
    console.error("RPC Error:", error);
  } else {
    console.log("Results:", data.length);
  }
}
main();
