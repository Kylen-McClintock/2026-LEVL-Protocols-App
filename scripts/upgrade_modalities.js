const fs = require('fs');

// Read env vars
const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length > 0) {
    envVars[key.trim()] = values.join('=').trim();
  }
});

const API_KEY = envVars['GOOGLE_GENERATIVE_AI_API_KEY'];
const ALL_OUTCOMES = [
  "Alertness", "Focus", "Soreness", "Pain", "Strength", "Creativity", "Satiety", 
  "Digestive Comfort", "Brain Fog", "Motivation", "Productivity", "Calmness", 
  "Social Connection", "Libido", "Skin Clarity", "Sleep Quality", "Waking Restedness", 
  "Sleep Latency", "Endurance", "Joint Comfort", "Memory", "Emotional Resilience", 
  "Immune Resilience", "Mood", "Energy", "Stress"
];

async function callGemini(modalityName) {
  const prompt = `
You are an expert longevity physician and medical researcher.
We are building a highly accurate Next Best Action algorithm for health and longevity.
Analyze the modality: "${modalityName}"

1. brief_description: A 1-2 sentence hook. It MUST explicitly state the immediate, short-term functional benefit ("Why take it today?") before bridging into the mechanistic longevity or long-term benefits.
2. expanded_why: 2-3 sentences expanding on the precise mechanism of action and the specific pathways it impacts.
3. functional_impacts: Identify 2-4 primary functional outcomes for this modality from the following exact list: [${ALL_OUTCOMES.join(', ')}].
For each identified outcome, assign an impact score (0-10) based strictly on clinical effect sizes.
If the score is 5 or higher, provide 1 canonical, highly-cited PubMed study backing this up.

Return ONLY valid JSON in the exact structure below, no markdown formatting:
{
  "brief_description": "...",
  "expanded_why": "...",
  "functional_impacts": {
    "Focus": {
      "score": 8,
      "studies": [
        {
          "title": "Study Title...",
          "url": "https://pubmed.ncbi.nlm.nih.gov/xxxxxxx",
          "notes": "Short description of clinical findings."
        }
      ]
    }
  }
}
`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    })
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text;
  return JSON.parse(text);
}

function escapeString(str) {
  if (!str) return 'NULL';
  return "'" + str.replace(/'/g, "''") + "'";
}

async function main() {
  const modalities = JSON.parse(fs.readFileSync('all_modalities.json', 'utf8'));
  let sqlStatements = [];

  // Generate Schema update first
  sqlStatements.push('-- Add functional_impacts JSONB column if it does not exist');
  sqlStatements.push('ALTER TABLE modalities ADD COLUMN IF NOT EXISTS functional_impacts JSONB DEFAULT \'{}\'::jsonb;\n');

  console.log(`Processing ${modalities.length} modalities...`);

  // Process in batches of 5 to avoid overwhelming API / rate limits
  for (let i = 0; i < modalities.length; i += 5) {
    const batch = modalities.slice(i, i + 5);
    console.log(`Processing batch ${i/5 + 1} of ${Math.ceil(modalities.length / 5)}...`);
    
    const batchPromises = batch.map(async (mod) => {
      try {
        const result = await callGemini(mod.name);
        
        const updateSql = `
UPDATE modalities 
SET 
  brief_description = ${escapeString(result.brief_description)},
  expanded_why = ${escapeString(result.expanded_why)},
  functional_impacts = '${JSON.stringify(result.functional_impacts).replace(/'/g, "''")}'::jsonb
WHERE id = ${escapeString(mod.id)};
`;
        return updateSql;
      } catch (err) {
        console.error(`Failed to process ${mod.name}:`, err.message);
        return `-- Failed to process ${mod.name}`;
      }
    });

    const results = await Promise.all(batchPromises);
    sqlStatements.push(...results);
    
    // Tiny delay between batches to respect potential rate limits
    await new Promise(r => setTimeout(r, 2000));
  }

  const finalSql = sqlStatements.join('\n');
  fs.writeFileSync('supabase/migrations/0013_add_functional_impacts_and_update_research.sql', finalSql);
  console.log('Migration generated successfully at supabase/migrations/0013_add_functional_impacts_and_update_research.sql');
}

main();
