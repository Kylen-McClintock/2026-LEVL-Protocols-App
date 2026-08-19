const fs = require('fs');

const rawData = [
  {
    "modality": "GLP-1 Receptor Agonists",
    "fact": "In the SELECT trial, semaglutide (2.4 mg) was associated with a 20% reduction in the risk of major adverse cardiovascular events (Hazard Ratio 0.80) in adults with overweight or obesity and established cardiovascular disease.",
    "source": "Lincoff et al., 2023",
    "source_url": "https://pubmed.ncbi.nlm.nih.gov/37952131/",
    "relevance_score": 5,
    "accuracy_score": 5,
    "interesting_score": 5,
    "impact_score": 5,
    "related_outcomes": ["cardiovascular_health", "metabolic_health", "longevity"]
  },
  {
    "modality": "Urolithin A",
    "fact": "A randomized controlled trial showed that 4 months of Urolithin A supplementation improved muscle strength by approximately 12% and increased aerobic endurance (peak VO2) in middle-aged adults.",
    "source": "Singh et al., 2022",
    "source_url": "https://pubmed.ncbi.nlm.nih.gov/35584623/",
    "relevance_score": 5,
    "accuracy_score": 5,
    "interesting_score": 4,
    "impact_score": 4,
    "related_outcomes": ["muscle_health", "energy", "longevity"]
  },
  {
    "modality": "Hyperbaric Oxygen Therapy (HBOT)",
    "fact": "A prospective clinical trial involving 60 daily HBOT sessions in healthy adults aged 64 and older led to a significant increase in telomere length (over 20%) and a reduction in senescent immune cells.",
    "source": "Hachmo et al., 2020",
    "source_url": "https://pubmed.ncbi.nlm.nih.gov/33206062/",
    "relevance_score": 4,
    "accuracy_score": 4,
    "interesting_score": 5,
    "impact_score": 4,
    "related_outcomes": ["longevity", "cognitive_health", "cellular_aging"]
  },
  {
    "modality": "Red Light / Photobiomodulation Therapy",
    "fact": "Clinical pilot studies have shown that near-infrared photobiomodulation can lead to significant improvements in standardized cognitive assessments (like MMSE and ADAS-cog) in patients with mild-to-moderate dementia.",
    "source": "Saltmarche et al., 2017",
    "source_url": "https://pubmed.ncbi.nlm.nih.gov/28186867/",
    "relevance_score": 4,
    "accuracy_score": 4,
    "interesting_score": 4,
    "impact_score": 4,
    "related_outcomes": ["cognitive_health", "sleep_quality", "energy"]
  },
  {
    "modality": "Apigenin",
    "fact": "While isolated apigenin lacks large human trials, chamomile extract (which is rich in apigenin) has been shown in clinical trials to significantly reduce symptoms of generalized anxiety disorder, potentially through GABA-A receptor modulation.",
    "source": "Amsterdam et al., 2009",
    "source_url": "https://pubmed.ncbi.nlm.nih.gov/19593179/",
    "relevance_score": 3,
    "accuracy_score": 4,
    "interesting_score": 3,
    "impact_score": 3,
    "related_outcomes": ["sleep_quality", "anxiety_reduction"]
  },
  {
    "modality": "L-Theanine",
    "fact": "A randomized controlled trial demonstrated that L-theanine supplementation improved objective sleep quality, sleep efficiency, and reduced perceived stress by increasing alpha brainwave activity.",
    "source": "Lyon et al., 2011",
    "source_url": "https://pubmed.ncbi.nlm.nih.gov/22214254/",
    "relevance_score": 4,
    "accuracy_score": 5,
    "interesting_score": 4,
    "impact_score": 3,
    "related_outcomes": ["sleep_quality", "cognitive_health", "stress_reduction"]
  },
  {
    "modality": "VO2 Max / HIIT Training",
    "fact": "A massive cohort study found that elite cardiorespiratory fitness (top 2.5% of VO2 max) is associated with an 80% reduction in all-cause mortality risk (Hazard Ratio 0.20) compared to the lowest fitness quartile.",
    "source": "Mandsager et al., 2018",
    "source_url": "https://pubmed.ncbi.nlm.nih.gov/30346464/",
    "relevance_score": 5,
    "accuracy_score": 5,
    "interesting_score": 5,
    "impact_score": 5,
    "related_outcomes": ["longevity", "cardiovascular_health", "metabolic_health"]
  },
  {
    "modality": "Glycine Supplementation",
    "fact": "Oral supplementation of 3 grams of glycine before bedtime has been clinically shown to reduce sleep onset latency and improve subjective sleep quality, partially by helping to lower core body temperature.",
    "source": "Yamadera et al., 2007",
    "source_url": "https://pubmed.ncbi.nlm.nih.gov/17229531/",
    "relevance_score": 4,
    "accuracy_score": 5,
    "interesting_score": 3,
    "impact_score": 3,
    "related_outcomes": ["sleep_quality", "metabolic_health"]
  },
  {
    "modality": "Plasmapheresis / Therapeutic Plasma Exchange",
    "fact": "The AMBAR Phase 2b/3 trial demonstrated that Therapeutic Plasma Exchange with albumin and IVIG replacement significantly slowed cognitive and functional decline in patients with mild-to-moderate Alzheimer's disease over a 14-month period.",
    "source": "Boada et al., 2020",
    "source_url": "https://pubmed.ncbi.nlm.nih.gov/32715623/",
    "relevance_score": 4,
    "accuracy_score": 4,
    "interesting_score": 5,
    "impact_score": 5,
    "related_outcomes": ["cognitive_health", "longevity", "cellular_aging"]
  },
  {
    "modality": "NAD+ IV Therapy",
    "fact": "Clinical pilot studies demonstrate that intravenous administration of NAD+ safely and significantly increases the NAD+ metabolome in human blood plasma, though large-scale placebo-controlled efficacy trials for longevity outcomes are still ongoing.",
    "source": "Grant et al., 2019",
    "source_url": "https://pubmed.ncbi.nlm.nih.gov/31512154/",
    "relevance_score": 4,
    "accuracy_score": 4,
    "interesting_score": 4,
    "impact_score": 3,
    "related_outcomes": ["energy", "longevity", "cellular_aging"]
  }
];

function escapeString(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + str.replace(/'/g, "''") + "'";
}

function escapeArray(arr) {
  if (!arr || arr.length === 0) return "ARRAY[]::text[]";
  const elements = arr.map(a => escapeString(a)).join(', ');
  return `ARRAY[${elements}]`;
}

const generateId = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

const sqlStatements = rawData.map(item => {
  const id = generateId(item.modality);
  const slug = id;
  const name = item.modality;
  const display_name = item.modality;
  
  // Set some sensible defaults for the missing fields
  const modality_type = name.includes('Therapy') || name.includes('Plasmapheresis') ? 'protocol' : (name.includes('Training') ? 'exercise' : 'supplement');
  const category = modality_type === 'supplement' ? 'Biochemistry' : 'Physical';
  const brief_description = `A health and longevity modality focused on ${item.related_outcomes.join(' and ')}.`;
  const expanded_why = `Research has shown this modality has significant impacts on longevity and performance.`;
  const primary_outcome = item.related_outcomes[0] || 'longevity';
  const mechanism_of_action = 'Modulates cellular and systemic pathways.';
  const hallmarks_of_aging_impact = JSON.stringify(['Altered intercellular communication']);
  const synergy_notes = JSON.stringify({});
  const antagonism_notes = JSON.stringify({});
  const evidence_quality = 3;
  const effect_size_estimate = 3;
  const safety_level = 'low_risk';
  const cost_tier = 'accessible';
  const effort_level = 'medium';
  const contraindications = [];
  const functional_outcomes_to_track = item.related_outcomes;
  const status = 'active';

  const efficacy_stats = JSON.stringify([{
    fact: item.fact,
    source: item.source,
    source_url: item.source_url,
    relevance_score: item.relevance_score,
    accuracy_score: item.accuracy_score,
    interesting_score: item.interesting_score,
    impact_score: item.impact_score,
    related_outcomes: item.related_outcomes
  }]);

  return `
INSERT INTO modalities (
  id, slug, name, display_name, modality_type, category, 
  brief_description, expanded_why, primary_outcome, mechanism_of_action,
  hallmarks_of_aging_impact, synergy_notes, antagonism_notes, evidence_quality,
  effect_size_estimate, safety_level, cost_tier, effort_level, contraindications,
  functional_outcomes_to_track, efficacy_stats, status
) VALUES (
  ${escapeString(id)}, ${escapeString(slug)}, ${escapeString(name)}, ${escapeString(display_name)}, 
  ${escapeString(modality_type)}, ${escapeString(category)}, ${escapeString(brief_description)}, 
  ${escapeString(expanded_why)}, ${escapeString(primary_outcome)}, ${escapeString(mechanism_of_action)},
  '${hallmarks_of_aging_impact}'::jsonb, '${synergy_notes}'::jsonb, '${antagonism_notes}'::jsonb, 
  ${evidence_quality}, ${effect_size_estimate}, ${escapeString(safety_level)}, 
  ${escapeString(cost_tier)}, ${escapeString(effort_level)}, ${escapeArray(contraindications)},
  ${escapeArray(functional_outcomes_to_track)}, '${efficacy_stats.replace(/'/g, "''")}'::jsonb, ${escapeString(status)}
) ON CONFLICT (id) DO UPDATE SET efficacy_stats = EXCLUDED.efficacy_stats;
`;
}).join('\n');

const finalSql = `-- Insert 10 Researched Modalities\n\n${sqlStatements}\n`;

fs.writeFileSync('/Users/kylenmcclintock/Documents/AntiGravity Projects/New LEVL Protocols App/10_new_modalities.sql', finalSql);
console.log('SQL generated successfully.');
