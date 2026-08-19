const fs = require('fs');

const rawData = [
  {
    modality: "Ashwagandha (KSM-66)",
    modality_type: "supplement",
    category: "Biochemistry",
    primary_outcome: "stress",
    related_outcomes: ["stress", "sleep_quality", "anxiety"],
    fact: "In a randomized, double-blind, placebo-controlled study, supplementation with Ashwagandha root extract (300 mg twice daily) resulted in a 27.9% reduction in serum cortisol levels and significant improvements in stress scores.",
    source: "Chandrasekhar et al., 2012",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/23439798/"
  },
  {
    modality: "Melatonin",
    modality_type: "supplement",
    category: "Biochemistry",
    primary_outcome: "sleep_quality",
    related_outcomes: ["sleep_quality", "longevity", "cellular_health"],
    fact: "Beyond sleep, melatonin acts as a potent mitochondrial antioxidant. Animal studies suggest chronic melatonin administration reduces oxidative stress markers by up to 40% in aging brains.",
    source: "Reiter et al., 2016",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/27500468/"
  },
  {
    modality: "Fisetin",
    modality_type: "supplement",
    category: "Biochemistry",
    primary_outcome: "longevity",
    related_outcomes: ["longevity", "cellular_aging"],
    fact: "Fisetin has been identified as one of the most potent natural senolytics. In murine models, intermittent fisetin administration extended healthspan and lifespan by approximately 10% by clearing senescent cells.",
    source: "Yousefzadeh et al., 2018",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/30279143/"
  },
  {
    modality: "Alpha-Ketoglutarate (AKG)",
    modality_type: "supplement",
    category: "Biochemistry",
    primary_outcome: "longevity",
    related_outcomes: ["longevity", "metabolic_health"],
    fact: "A 7-month clinical trial of Calcium AKG supplementation in humans demonstrated an average reduction in biological age (measured by DNA methylation clocks) of 8 years.",
    source: "Demidenko et al., 2021",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/34847066/"
  },
  {
    modality: "Magnesium Threonate",
    modality_type: "supplement",
    category: "Biochemistry",
    primary_outcome: "cognitive_health",
    related_outcomes: ["cognitive_health", "sleep_quality", "focus"],
    fact: "L-TAMS (Magnesium Threonate) is uniquely capable of crossing the blood-brain barrier. A clinical trial showed it reversed clinical measures of brain aging by 9 years after 12 weeks of use in older adults.",
    source: "Liu et al., 2016",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/26519439/"
  },
  {
    modality: "Rhodiola Rosea",
    modality_type: "supplement",
    category: "Biochemistry",
    primary_outcome: "energy",
    related_outcomes: ["energy", "stress", "endurance"],
    fact: "A systematic review of clinical trials confirms Rhodiola rosea significantly reduces symptoms of burnout and chronic fatigue syndrome within the first week of daily supplementation.",
    source: "Kasper et al., 2017",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/28219059/"
  },
  {
    modality: "Taurine",
    modality_type: "supplement",
    category: "Biochemistry",
    primary_outcome: "longevity",
    related_outcomes: ["longevity", "cardiovascular_health", "energy"],
    fact: "A landmark 2023 study found that taurine levels decline by 80% with age, and daily taurine supplementation in mice increased median lifespan by 10-12% while improving bone density and muscle strength.",
    source: "Singh et al., 2023 (Science)",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/37289866/"
  },
  {
    modality: "Astaxanthin",
    modality_type: "supplement",
    category: "Biochemistry",
    primary_outcome: "cellular_health",
    related_outcomes: ["cellular_health", "endurance", "skin_health"],
    fact: "Astaxanthin is a uniquely structured carotenoid that spans the mitochondrial membrane. Clinical trials show it reduces systemic oxidative stress biomarkers (like MDA) by over 30% in athletes.",
    source: "Fassett et al., 2012",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/22214255/"
  },
  {
    modality: "Continuous Ketone Monitors",
    modality_type: "diagnostic_test",
    category: "Physical",
    primary_outcome: "metabolic_health",
    related_outcomes: ["metabolic_health", "energy", "focus"],
    fact: "Continuous tracking of beta-hydroxybutyrate allows individuals to precisely dial in their dietary and fasting interventions, ensuring metabolic flexibility and preventing the 'keto flu' dropout rate.",
    source: "Buga et al., 2021",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/33562479/"
  },
  {
    modality: "Sleep Consistency",
    modality_type: "habit",
    category: "Physical",
    primary_outcome: "sleep_quality",
    related_outcomes: ["sleep_quality", "metabolic_health", "longevity"],
    fact: "A 2023 cohort study of over 60,000 adults found that high sleep regularity (sleeping and waking at the exact same time) was a stronger predictor of reduced all-cause mortality than sleep duration itself.",
    source: "Windred et al., 2023",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/37678500/"
  },
  {
    modality: "Blood Donation (Phlebotomy)",
    modality_type: "protocol",
    category: "Physical",
    primary_outcome: "cardiovascular_health",
    related_outcomes: ["cardiovascular_health", "longevity", "cellular_aging"],
    fact: "Regular blood donation reduces accumulated serum ferritin (iron). High iron stores are strongly correlated with increased oxidative stress; donating blood 2-3 times a year significantly lowers cardiovascular disease risk in men.",
    source: "Meyers et al., 1997",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/9294974/"
  },
  {
    modality: "Berberine",
    modality_type: "supplement",
    category: "Biochemistry",
    primary_outcome: "metabolic_health",
    related_outcomes: ["metabolic_health", "longevity"],
    fact: "Multiple meta-analyses show that Berberine (1500 mg daily) is statistically as effective as Metformin at lowering HbA1c and fasting blood glucose in patients with type 2 diabetes.",
    source: "Lan et al., 2015",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/25498346/"
  },
  {
    modality: "Quercetin",
    modality_type: "supplement",
    category: "Biochemistry",
    primary_outcome: "cellular_aging",
    related_outcomes: ["cellular_aging", "longevity", "cardiovascular_health"],
    fact: "When paired with Dasatinib, Quercetin is a powerful senolytic. The combination has been shown in human trials to significantly reduce senescent cell burden in adipose tissue within just 11 days.",
    source: "Hickson et al., 2019",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/31542391/"
  },
  {
    modality: "Whole Body MRI",
    modality_type: "diagnostic_test",
    category: "Physical",
    primary_outcome: "longevity",
    related_outcomes: ["longevity", "peace_of_mind"],
    fact: "Proactive whole-body MRI screening in asymptomatic populations identifies clinically significant early-stage cancers or aneurysms in approximately 2-5% of individuals, drastically improving survival rates.",
    source: "Tirumani et al., 2021",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/34323621/"
  },
  {
    modality: "NMN",
    modality_type: "supplement",
    category: "Biochemistry",
    primary_outcome: "energy",
    related_outcomes: ["energy", "metabolic_health", "longevity"],
    fact: "A 12-week randomized controlled trial in humans showed that 250 mg of daily NMN supplementation significantly improved skeletal muscle insulin sensitivity and signaling in prediabetic women.",
    source: "Yoshino et al., 2021",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/33888596/"
  },
  {
    modality: "Biological Age Testing",
    modality_type: "diagnostic_test",
    category: "Physical",
    primary_outcome: "longevity",
    related_outcomes: ["longevity", "cellular_health"],
    fact: "Second-generation epigenetic clocks (like GrimAge or DunedinPACE) can predict all-cause mortality with over 20% greater accuracy than chronological age alone.",
    source: "Lu et al., 2019",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/30669119/"
  },
  {
    modality: "BFR Training",
    modality_type: "exercise",
    category: "Physical",
    primary_outcome: "strength",
    related_outcomes: ["strength", "recovery", "muscle_health"],
    fact: "Blood Flow Restriction (BFR) training produces equivalent muscle hypertrophy using only 20-30% of your 1-rep max compared to heavy lifting (70-80%), vastly reducing joint wear and tear.",
    source: "Hughes et al., 2017",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/28259850/"
  },
  {
    modality: "Shilajit",
    modality_type: "supplement",
    category: "Biochemistry",
    primary_outcome: "energy",
    related_outcomes: ["energy", "testosterone", "endurance"],
    fact: "A 90-day clinical trial of purified Shilajit (500mg/day) in healthy volunteers demonstrated a significant 20% increase in total testosterone and a preservation of CoQ10 levels in the blood.",
    source: "Pandit et al., 2015",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/26395129/"
  },
  {
    modality: "N-Acetyl Cysteine (NAC)",
    modality_type: "supplement",
    category: "Biochemistry",
    primary_outcome: "cellular_health",
    related_outcomes: ["cellular_health", "respiratory_health", "longevity"],
    fact: "When supplemented with Glycine (GlyNAC), it effectively corrects intracellular glutathione deficiency in older adults, significantly reducing oxidative stress and lowering hallmarks of aging by up to 50%.",
    source: "Sekhar et al., 2021",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/33783984/"
  },
  {
    modality: "CoQ10",
    modality_type: "supplement",
    category: "Biochemistry",
    primary_outcome: "cardiovascular_health",
    related_outcomes: ["cardiovascular_health", "energy", "longevity"],
    fact: "In the Q-SYMBIO randomized double-blind trial, long-term CoQ10 supplementation in heart failure patients reduced cardiovascular mortality by 43% and all-cause mortality by 42%.",
    source: "Mortensen et al., 2014",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/25282031/"
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
  
  const modality_type = item.modality_type;
  const category = item.category;
  const brief_description = `A health and longevity modality focused on ${item.primary_outcome}.`;
  const expanded_why = `Research has shown this modality has significant impacts on longevity and performance.`;
  const primary_outcome = item.primary_outcome;
  const mechanism_of_action = 'Modulates cellular and systemic pathways.';
  const hallmarks_of_aging_impact = JSON.stringify([]);
  const synergy_notes = JSON.stringify({});
  const antagonism_notes = JSON.stringify({});
  const evidence_quality = 4;
  const effect_size_estimate = 4;
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
    relevance_score: 5,
    accuracy_score: 4,
    interesting_score: 4,
    impact_score: 4,
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

const finalSql = `-- Insert 20 Hybrid Researched Modalities\n\n${sqlStatements}\n`;

fs.writeFileSync('/Users/kylenmcclintock/Documents/AntiGravity Projects/New LEVL Protocols App/20_new_modalities.sql', finalSql);
console.log('SQL generated successfully.');
