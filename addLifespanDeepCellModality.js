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
  id: 'lifespan_plus_deepcell',
  slug: 'lifespan-plus-deepcell',
  name: 'LIFESPAN+ DeepCell (from LEVL)',
  display_name: 'LIFESPAN+ DeepCell',
  modality_type: 'supplement',
  category: 'Nervous System & Sleep',
  status: 'active',
  brief_description: 'A advanced nighttime cellular recovery and deep sleep formulation from LEVL combining Magnesium Glycinate, L-Tryptophan, Apigenin, Luteolin, Spermidine, Lithium Orotate, L-Theanine, and botanical GABA-modulating extracts.',
  headline_benefit: 'Deep Slow-Wave Sleep Optimization & Nighttime Autophagy',
  expanded_why: 'LIFESPAN+ DeepCell is engineered for nighttime parasympathetic activation, deep sleep restoration, and nocturnal cellular cleanup. Magnesium Glycinate, L-Tryptophan, Vitamin B6, and L-Theanine promote endogenous serotonin and melatonin synthesis while reducing nocturnal cortical arousal. Botanical extracts (Lemon Balm, Passion Flower, Valerian, Hops) and Apigenin bind GABA-A receptors to quiet brain chatter. Luteolin and Spermidine HCl trigger overnight autophagic cell renewal, while low-dose Lithium Orotate supports GSK-3b inhibition and neuroprotection.',
  primary_outcome: 'Deep Sleep & Autophagy Activation',
  secondary_outcomes: ['Sleep Latency Reduction', 'GABA Signaling', 'Neuroprotection', 'Nocturnal Autophagy'],
  overall_longevity_benefit: 5,
  implementation_summary: 'Take 1 serving (2.100g) 30 to 60 minutes before sleep with water.',
  instructions: 'Take 1 serving (2.100g total powder or capsules) dissolved in water 30–60 minutes before bedtime. Dim lights after consumption to enhance endogenous melatonin release.',
  dose_or_exposure: '2.100 g / serving (2100 mg): Magnesium Glycinate 550mg (80mg elemental Mg), L-Tryptophan 200mg, Vitamin B6 (Pyridoxine HCl) 5mg, L-Theanine 200mg, Lemon Balm Extract 250mg, Passion Flower Extract 250mg, Valerian Root Extract 350mg, Hops Extract 100mg, Zinc Citrate 30mg (10mg elemental Zn), Apigenin 50mg, Luteolin 50mg, Spermidine HCl 5mg, Lithium Orotate 60mg (2.5mg elemental Li).',
  timing_summary: 'Nighttime supplement (take 30–60 mins before sleep)',
  frequency: '1x daily',
  schedule_pattern: 'daily_evening',
  difficulty: 'easy',
  cost_tier: 'medium',
  effort_level: 'very_low',
  time_to_benefit: 'Immediate (1st night for sleep latency; cumulative benefits over weeks)',
  evidence_quality: 4,
  effect_size_estimate: 5,
  evidence_summary: 'Combines clinically substantiated sleep latency enhancers (Magnesium Glycinate, L-Tryptophan, Valerian, L-Theanine, Apigenin) with autophagic drivers (Spermidine HCl 5mg, Luteolin 50mg) and neuroprotective trace mineral complexes (Lithium Orotate 2.5mg elemental Li).',
  safety_level: 'low_risk',
  safety_summary: 'Safe, non-habit forming formulation. Free of synthetic exogenous melatonin to preserve natural pineal gland regulation.',
  contraindications: ['Pregnancy or nursing', 'Concurrent prescription sedative / MAOI medication without clinical consultation'],
  functional_outcomes_to_track: ['sleep_quality', 'sleep_latency', 'waking_restedness', 'anxiety'],
  hallmarks_of_aging_impact: ['Loss of Proteostasis', 'Altered Intercellular Communication', 'Cellular Senescence'],
  mechanism_of_action: 'Potentiation of GABA-A receptors via Apigenin, Hops & Valerian, enhancement of central serotonin/melatonin biosynthesis via L-Tryptophan + B6, upregulation of autophagy via Spermidine HCl & Luteolin, and NMDA receptor modulation via Magnesium & Lithium Orotate.',
  onset_profile: 'Rapid (30–45 minutes for onset of sleepiness).',
  half_life_profile: '4–8 hours (optimized for whole-night sleep preservation without morning grogginess).',
  ideal_cohort: 'Individuals seeking enhanced deep (slow-wave) sleep architecture, reduced sleep latency, and nighttime autophagic restoration.',
  contraindicating_cohort: 'Individuals taking potent prescription sedatives, SSRIs, or MAOIs without physician approval.',
  synergy_notes: {
    pairsWellWith: ['dark_cool_sleep_environment', 'evening_screen_sunset', 'hot_bath_sauna'],
    rationale: 'Synergizes with thermal drop post-bath and circadian darkness to maximize natural slow-wave sleep cycles.'
  },
  antagonism_notes: {
    avoidCombiningWith: ['morning_ingestion', 'heavy_late_meals'],
    rationale: 'Must be taken at night due to strong sedative and GABA-activating properties. Late heavy meals impair gastrointestinal absorption.'
  },
  visibility: 'private',
  review_status: 'approved',
  version: 1,
  logging_type: 'boolean',
  cadence_layer: 'daily',
  minimum_cooldown_hours: 0,
  functional_impacts: {
    "Sleep Quality": {
      "score": 9,
      "studies": [
        {
          "title": "Magnesium and L-Tryptophan synergy in sleep architecture",
          "url": "https://pubmed.ncbi.nlm.nih.gov/23853635/",
          "notes": "Magnesium and tryptophan supplementation significantly improves subjective and objective sleep quality measures in adults."
        }
      ]
    },
    "Sleep Latency": {
      "score": 9,
      "studies": [
        {
          "title": "Apigenin and Valerian root for sleep onset reduction",
          "url": "https://pubmed.ncbi.nlm.nih.gov/19593179/",
          "notes": "Apigenin acts as a natural GABA-A agonist, calming nervous system hyperexcitability and reducing sleep latency."
        }
      ]
    },
    "Waking Restedness": {
      "score": 8,
      "studies": [
        {
          "title": "L-Theanine and botanical extracts in non-rem restorative sleep",
          "url": "https://pubmed.ncbi.nlm.nih.gov/30707852/",
          "notes": "L-Theanine promotes alpha brainwave activity, fostering restorative slow-wave sleep without morning sedation."
        }
      ]
    },
    "Autophagy": {
      "score": 8,
      "studies": [
        {
          "title": "Spermidine and Luteolin in overnight autophagic renewal",
          "url": "https://pubmed.ncbi.nlm.nih.gov/29305904/",
          "notes": "Spermidine induces autophagy across human cells, supporting cellular proteostasis during nocturnal fasting."
        }
      ]
    }
  }
};

async function main() {
  console.log("Generating embedding for LIFESPAN+ DeepCell...");
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
    console.log("Successfully added LIFESPAN+ DeepCell (from LEVL):", data[0].id);
  }
}

main();
