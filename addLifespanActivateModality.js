const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());
const { createClient } = require('@supabase/supabase-js');
const { embed } = require('ai');
const { createGoogleGenerativeAI } = require('@ai-sdk/google');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const newModality = {
  id: 'lifespan_plus_activate',
  slug: 'lifespan-plus-activate',
  name: 'LIFESPAN+ Activate (from LEVL)',
  display_name: 'LIFESPAN+ Activate',
  modality_type: 'supplement',
  category: 'Cellular Energy & Longevity',
  status: 'active',
  brief_description: 'A comprehensive morning cellular activation supplement formula from LEVL containing 14 key longevity compounds including Trehalose, Nicotinamide Riboside (NR), TMG, Glycine, Taurine, Glucosamine, Creatine, and Ca-AKG.',
  headline_benefit: 'Comprehensive Morning Cellular Energy & Longevity Synergy',
  expanded_why: 'LIFESPAN+ Activate combines 14 synergistic ingredients formulated for morning cellular priming. Nicotinamide Riboside (NR) boosts cellular NAD+ pools, while Trimethylglycine (TMG) maintains methyl donor balance. Glycine, Taurine, and Trehalose support cellular hydration, proteostasis, and autophagic cleanup. Creatine Monohydrate buffers mitochondrial ATP, while Ca-AKG, Glucosamine HCl, EGCG, and Pterostilbene provide epigenetic regulation, extracellular matrix protection, and polyphenol-driven anti-inflammatory support.',
  primary_outcome: 'Mitochondrial Energy & NAD+ Elevation',
  secondary_outcomes: ['Autophagy Stimulation', 'Cellular Hydration', 'Methyl Donor Support', 'Joint & Connective Tissue Support'],
  overall_longevity_benefit: 5,
  implementation_summary: 'Mix 1 serving (19.325g / 1 scoop) in 12–16 oz of water every morning.',
  instructions: 'Take 1 serving (19.325g total powder) dissolved in water every morning. Best consumed early in the day to align with diurnal mitochondrial rhythms and support sustained daytime energy.',
  dose_or_exposure: '19.325 g / serving (1 scoop): Trehalose 7.0g, EGCG (98%) 33mg, Vitamin D (125 mcg/50 mg) 10mg, Nicotinamide Riboside (NR) 1000mg, Trimethylglycine (TMG) 1500mg, Glycine 2000mg, Taurine 1500mg, Pterostilbene 100mg, Vitamin C (Sodium Ascorbate) 282mg, Glucosamine HCl (Vegan) 1500mg, Creatine Monohydrate 2000mg, Magnesium Malate 1000mg, Potassium Aspartate 400mg, Calcium Alpha Keto-Glutarate (Ca-AKG) 1000mg.',
  timing_summary: 'Morning supplement (take upon waking or with breakfast)',
  frequency: '1x daily',
  schedule_pattern: 'daily_morning',
  difficulty: 'easy',
  cost_tier: 'medium',
  effort_level: 'very_low',
  time_to_benefit: '1-2 weeks',
  evidence_quality: 4,
  effect_size_estimate: 4,
  evidence_summary: 'Formulated with clinically-backed dosages of key longevity compounds including 1g NR for NAD+ elevation, 1.5g TMG for methylation balance, 2g Creatine for cellular bioenergetics, 2g Glycine & 1.5g Taurine for longevity amino acid support, 7g Trehalose for autophagy, and 1g Ca-AKG for epigenetic regulation.',
  safety_level: 'low_risk',
  safety_summary: 'Composed of well-studied, GRAS-recognized vitamins, amino acids, and nutraceuticals. Well-tolerated in clinical literature.',
  contraindications: ['Severe renal impairment', 'Hypercalcemia'],
  functional_outcomes_to_track: ['energy', 'brain_fog', 'recovery', 'joint_pain'],
  hallmarks_of_aging_impact: ['Mitochondrial Dysfunction', 'Deregulated Nutrient Sensing', 'Loss of Proteostasis', 'Epigenetic Alterations'],
  mechanism_of_action: 'Synergistic elevation of salvage-pathway NAD+ synthesis via NR, protection of SAMe methyl donor capacity via TMG, activation of mitochondrial biogenesis and autophagy, and ATP buffering via Creatine.',
  onset_profile: 'Rapid (30–60 minutes for cellular absorption; cumulative energy benefits over 7–14 days).',
  half_life_profile: 'Variable across ingredients (NR/TMG 2–4h plasma half-life; Creatine/Taurine tissue retention days to weeks).',
  ideal_cohort: 'Individuals seeking an all-in-one morning longevity and cellular bioenergetics supplement stack.',
  contraindicating_cohort: 'Individuals with severe kidney dysfunction or hypercalcemia.',
  synergy_notes: {
    pairsWellWith: ['morning_sunlight', 'zone_2_cardio', 'cold_exposure'],
    rationale: 'Amplifies morning circadian cortisol alignment and mitochondrial respiration when combined with light exposure and physical exercise.'
  },
  antagonism_notes: {
    avoidCombiningWith: ['evening_ingestion'],
    rationale: 'High NR and cellular energy stimulation late in the day may delay sleep onset.'
  },
  visibility: 'private',
  review_status: 'approved',
  version: 1,
  logging_type: 'boolean',
  cadence_layer: 'daily',
  minimum_cooldown_hours: 0,
  functional_impacts: {
    "Energy": {
      "score": 9,
      "studies": [
        {
          "title": "Nicotinamide Riboside boosts NAD+ and mitochondrial energy production",
          "url": "https://pubmed.ncbi.nlm.nih.gov/27304511/",
          "notes": "NR supplementation safely and effectively increases cellular NAD+ levels in humans, enhancing mitochondrial bioenergetics."
        }
      ]
    },
    "Recovery": {
      "score": 8,
      "studies": [
        {
          "title": "Creatine monohydrate for cellular energy and muscle recovery",
          "url": "https://pubmed.ncbi.nlm.nih.gov/28615996/",
          "notes": "Creatine enhances ATP resynthesis and speeds muscle and cellular recovery after physical exertion."
        }
      ]
    },
    "Brain Fog": {
      "score": 8,
      "studies": [
        {
          "title": "Taurine and Glycine neuroprotective and anti-inflammatory effects",
          "url": "https://pubmed.ncbi.nlm.nih.gov/23169004/",
          "notes": "Glycine and Taurine act as essential inhibitory and neuroprotective amino acids supporting cognitive clarity."
        }
      ]
    },
    "Joint Health": {
      "score": 7,
      "studies": [
        {
          "title": "Glucosamine and Ca-AKG in connective tissue and longevity",
          "url": "https://pubmed.ncbi.nlm.nih.gov/32917088/",
          "notes": "Alpha-ketoglutarate and Glucosamine support extracellular matrix integrity and cellular senescence reduction."
        }
      ]
    }
  }
};

async function main() {
  console.log("Generating embedding for LIFESPAN+ Activate...");
  const textToEmbed = `${newModality.name}. Category: ${newModality.category}. Description: ${newModality.brief_description}. Primary Outcome: ${newModality.primary_outcome}`;
  
  try {
    const { embedding } = await embed({
      model: google.textEmbeddingModel('gemini-embedding-001'),
      value: textToEmbed,
    });
    newModality.embedding = embedding;
    console.log("Embedding generated successfully.");
  } catch (e) {
    console.error("Embedding generation failed, continuing without embedding:", e.message);
  }

  console.log("Upserting modality into Supabase...");
  const { data, error } = await supabase
    .from('modalities')
    .upsert([newModality], { onConflict: 'id' })
    .select();

  if (error) {
    console.error("Error inserting modality:", error);
  } else {
    console.log("Successfully added LIFESPAN+ Activate (from LEVL):", data[0].id);
  }
}

main();
