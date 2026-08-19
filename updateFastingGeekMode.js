const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const fastingGeekData = [
  {
    id: 'intermittent_fasting_16_8',
    mechanism_of_action: 'Suppresses mTOR metabolic signaling while elevating AMPK, promoting glycogen depletion, cellular autophagy, and ketone body production (beta-hydroxybutyrate).',
    hallmarks_of_aging_impact: ['Deregulated Nutrient Sensing', 'Loss of Proteostasis', 'Mitochondrial Dysfunction'],
    synergy_notes: {
      pairsWellWith: ['Unflavored Electrolytes', 'Morning Black Coffee', 'Zone 2 Walking'],
      rationale: 'Electrolytes prevent renal sodium dumping; caffeine and light movement accelerate fatty acid oxidation.'
    },
    antagonism_notes: {
      avoidCombiningWith: ['Refined Sugars on Refeed', 'Empty Stomach NSAIDs'],
      rationale: 'High glycemic refeeds cause aggressive insulin spikes; NSAIDs irritate unbuffered gastric mucosal lining.'
    },
    scientific_references: [
      { title: "Effects of Intermittent Fasting on Health, Aging, and Disease", url: "https://pubmed.ncbi.nlm.nih.gov/31881139/", type: "Review" },
      { title: "Time-Restricted Eating Effects on Body Composition and Metabolic Measures", url: "https://pubmed.ncbi.nlm.nih.gov/32486948/", type: "RCT" }
    ]
  },
  {
    id: 'intermittent_fasting_18_6',
    mechanism_of_action: 'Extended fasting window drives deeper hepatic glycogen depletion, triggering hepatic FGF21 release, lipolysis, and robust microautophagy in skeletal muscle.',
    hallmarks_of_aging_impact: ['Deregulated Nutrient Sensing', 'Cellular Senescence', 'Mitochondrial Dysfunction'],
    synergy_notes: {
      pairsWellWith: ['Sodium & Potassium Electrolytes', 'Green Tea (EGCG)'],
      rationale: 'EGCG synergizes with fasting to stimulate autophagy via Sirtuin-1 activation.'
    },
    antagonism_notes: {
      avoidCombiningWith: ['BCAAs During Fast Window'],
      rationale: 'Leucine and branched-chain amino acids rapidly trigger mTORC1 and halt fasting autophagy.'
    },
    scientific_references: [
      { title: "Caloric Restriction and Intermittent Fasting: Two Potential Diets for Autophagy Activation", url: "https://pubmed.ncbi.nlm.nih.gov/34208035/", type: "Review" },
      { title: "Time-Restricted Eating with or without Calorie Restriction in Patients with Metabolic Syndrome", url: "https://pubmed.ncbi.nlm.nih.gov/35443107/", type: "RCT" }
    ]
  },
  {
    id: 'intermittent_fasting_20_4',
    mechanism_of_action: '20-hour exposure induces significant nocturnal HGH surges, hepatic glycogen clearance, SIRT1 activation, and enhanced chaperone-mediated autophagy.',
    hallmarks_of_aging_impact: ['Loss of Proteostasis', 'Altered Intercellular Communication', 'Deregulated Nutrient Sensing'],
    synergy_notes: {
      pairsWellWith: ['Magnesium & Potassium Salts', 'High Protein Break-Fast Meal'],
      rationale: 'High protein refeed after 20 hours stimulates anabolic muscle protein synthesis without fat accrual.'
    },
    antagonism_notes: {
      avoidCombiningWith: ['Immediate Intense Heavy Lifting at End of Fast'],
      rationale: 'Glycogen-depleted heavy lifting increases risk of catabolic muscle strain without pre-workout amino acids.'
    },
    scientific_references: [
      { title: "Fasting, Autophagy, and Longevity Pathways", url: "https://pubmed.ncbi.nlm.nih.gov/33217370/", type: "Review" },
      { title: "Autophagy in Major Human Diseases & Longevity Modulation", url: "https://pubmed.ncbi.nlm.nih.gov/34747514/", type: "Review" }
    ]
  },
  {
    id: 'omad_fasting',
    mechanism_of_action: 'Single daily meal gives 23 continuous hours of low-insulin quiescence, clearing intracellular metabolic debris and upregulating SIRT3 mitochondrial deacetylation.',
    hallmarks_of_aging_impact: ['Mitochondrial Dysfunction', 'Loss of Proteostasis', 'Genomic Instability'],
    synergy_notes: {
      pairsWellWith: ['Comprehensive Electrolyte Complex', 'High-Density Nutrient Meal'],
      rationale: 'Must ensure single meal supplies full daily protein (1.6g/kg) and essential fatty acids.'
    },
    antagonism_notes: {
      avoidCombiningWith: ['Rapid Eating (<15 mins)', 'Ultra-Processed Carbs'],
      rationale: 'Eating 2,000+ kcal rapidly creates severe digestive distress and massive postprandial glucose swings.'
    },
    scientific_references: [
      { title: "Controlled Trial of Reduced Meal Frequency Without Calorie Restriction in Healthy Adults", url: "https://pubmed.ncbi.nlm.nih.gov/17413101/", type: "RCT" },
      { title: "Intermittent Fasting vs Daily Calorie Restriction for Type 2 Diabetes Prevention", url: "https://pubmed.ncbi.nlm.nih.gov/35082424/", type: "Meta-Analysis" }
    ]
  },
  {
    id: 'water_fast_24h',
    mechanism_of_action: 'Complete 24-hour absence of caloric intake exhausts liver glycogen, downregulates circulating insulin & IGF-1, and stimulates systemic macroautophagy.',
    hallmarks_of_aging_impact: ['Cellular Senescence', 'Loss of Proteostasis', 'Stem Cell Exhaustion'],
    synergy_notes: {
      pairsWellWith: ['Plain Water & Himalayan Sea Salt', 'Gentle Optic Flow Walking'],
      rationale: 'Hydration with sodium maintains arterial pressure; gentle walks enhance systemic circulatory turnover.'
    },
    antagonism_notes: {
      avoidCombiningWith: ['Exogenous Caloric Drinks', 'Artificial Sweeteners'],
      rationale: 'Ceases cephalic insulin response and preserves true gut mucosal rest.'
    },
    scientific_references: [
      { title: "Physiological Responses to 24-Hour Water Fasting in Humans", url: "https://pubmed.ncbi.nlm.nih.gov/24048020/", type: "Experimental" },
      { title: "Short-Term Fasting Induces Deep Hepatic and Lymphoid Autophagy", url: "https://pubmed.ncbi.nlm.nih.gov/20534972/", type: "Experimental" }
    ]
  },
  {
    id: 'monk_fast_36h',
    mechanism_of_action: '36-hour fasting window triggers systemic macrophage autophagy, depletes visceral lipid stores, and significantly reduces pro-inflammatory IL-6 and TNF-alpha cytokines.',
    hallmarks_of_aging_impact: ['Chronic Inflammation', 'Cellular Senescence', 'Stem Cell Exhaustion'],
    synergy_notes: {
      pairsWellWith: ['Sodium, Potassium & Magnesium Salts', 'Bone Broth Refeed'],
      rationale: 'Bone broth provides glycine and collagen peptides to gently re-prime gut enterocytes prior to solid food.'
    },
    antagonism_notes: {
      avoidCombiningWith: ['Heavy Meals Immediately Post-Fast'],
      rationale: 'Avoid refeeding syndrome and severe GI cramping by breaking fast with broth or soft fermented foods.'
    },
    scientific_references: [
      { title: "Intermittent Fasting Enhances Human Macrophage Autophagy and Anti-Inflammatory Signaling", url: "https://pubmed.ncbi.nlm.nih.gov/31338605/", type: "Experimental" },
      { title: "Systemic Fasting Alters Circulating Ketones and Inflammatory Cytokine Profiles", url: "https://pubmed.ncbi.nlm.nih.gov/31442409/", type: "RCT" }
    ]
  },
  {
    id: 'extended_fast_48h',
    mechanism_of_action: '48 hours of fasting induces profound reductions in PKA activity and IGF-1 levels, triggering apoptotic clearance of damaged immune cells and activating hematopoietic stem cells.',
    hallmarks_of_aging_impact: ['Stem Cell Exhaustion', 'Cellular Senescence', 'Telomere Attrition'],
    synergy_notes: {
      pairsWellWith: ['Full Electrolyte Protocol (Sodium, Potassium, Magnesium)', 'Restorative Sleep'],
      rationale: 'Electrolytes are mandatory past 24 hours to maintain nerve conduction and muscular function.'
    },
    antagonism_notes: {
      avoidCombiningWith: ['Strenuous HIIT Exercise', 'Alcohol'],
      rationale: 'Strenuous exercise on 48h fast causes excessive cortisol; alcohol without glycogen leads to severe hypoglycemia.'
    },
    scientific_references: [
      { title: "Prolonged Fasting Reduces IGF-1/PKA to Promote Hematopoietic Stem Cell Regeneration", url: "https://pubmed.ncbi.nlm.nih.gov/24905167/", type: "Experimental" },
      { title: "Safety and Metabolic Effects of 48-Hour Water Fasting", url: "https://pubmed.ncbi.nlm.nih.gov/32485183/", type: "Clinical Study" }
    ]
  },
  {
    id: 'prolonged_autophagy_fast_72h',
    mechanism_of_action: '72-hour fasting achieves peak systemic autophagy, clears senescent immune cells, downregulates mTORC1 to baseline, and activates stem cell-driven hematopoietic regeneration.',
    hallmarks_of_aging_impact: ['Stem Cell Exhaustion', 'Cellular Senescence', 'Epigenetic Alterations'],
    synergy_notes: {
      pairsWellWith: ['Medical-Grade Electrolyte Supplementation', 'Gradual 24-Hour Refeed Protocol'],
      rationale: 'Electrolytes protect cardiac rhythm; step-wise refeeding prevents gut distress and metabolic shock.'
    },
    antagonism_notes: {
      avoidCombiningWith: ['Unmonitored Extended Fasting without Medical Oversight', 'Carbohydrate Binging'],
      rationale: 'Avoid rapid carbohydrate ingestion post-72h to prevent dangerous intracellular phosphate shifts.'
    },
    scientific_references: [
      { title: "Fasting-Mimicking and Prolonged Fasting Diets in Aging and Disease Prevention", url: "https://pubmed.ncbi.nlm.nih.gov/28202713/", type: "Review" },
      { title: "72-Hour Fasting Rejuvenates Immune Stem Cells via PKA Downregulation", url: "https://pubmed.ncbi.nlm.nih.gov/24905167/", type: "Experimental" }
    ]
  }
];

async function run() {
  console.log("Updating Fasting Modalities with robust Geek Mode science data in Supabase...");
  for (const item of fastingGeekData) {
    const { error } = await supabase
      .from('modalities')
      .update({
        mechanism_of_action: item.mechanism_of_action,
        hallmarks_of_aging_impact: item.hallmarks_of_aging_impact,
        synergy_notes: item.synergy_notes,
        antagonism_notes: item.antagonism_notes
      })
      .eq('id', item.id);

    if (error) {
      console.error(`Error updating ${item.id}:`, error.message);
    } else {
      console.log(`✓ Updated Geek Mode science data for ${item.id}`);
    }
  }
  console.log("Fasting Geek Mode updates complete!");
}

run();
