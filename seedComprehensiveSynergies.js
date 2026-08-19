const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const synergyUpdates = {
  // --- TAURINE ---
  'taurine': {
    synergy_notes: {
      pairsWellWith: ['Magnesium Glycinate', 'Glycine', 'Caffeine', 'CoQ10', 'Zone 2 Cardio'],
      rationale: 'Taurine works synergistically with Magnesium and Glycine to enhance GABAergic inhibitory neurotransmission, calming the central nervous system before sleep. When paired with Caffeine, it smooths out jitters and blood pressure spikes. Also enhances cardiac mitochondrial energetics alongside CoQ10.'
    },
    antagonism_notes: {
      avoidCombiningWith: ['Heavy Alcohol Consumption', 'Excessive Unbuffered Stimulants'],
      rationale: 'Chronic heavy alcohol depletes endogenous taurine stores and disrupts hepatic taurine conjugation. Avoid stacking with high-dose unbuffered stimulants that overstimulate beta-adrenergic receptors.'
    }
  },

  // --- NMN / NAD+ ---
  'nmn': {
    synergy_notes: {
      pairsWellWith: ['TMG (Betaine)', 'Resveratrol / Pterostilbene', 'Apigenin', 'Exercise'],
      rationale: 'NMN consumption consumes methyl donors during NAM (nicotinamide) methylation by NNMT, making TMG (Betaine) a crucial methyl donor donor. Resveratrol and SIRT1 activators require elevated NAD+ to deacetylate target proteins, while Apigenin inhibits CD38 to prevent NAD+ degradation.'
    },
    antagonism_notes: {
      avoidCombiningWith: ['High Inflammation / Uncontrolled CD38', 'High-Glycemic Refined Carbohydrates'],
      rationale: 'Excessive unbuffered NMN without TMG may deplete SAMe and methyl donor pools. High acute inflammation upregulates CD38, rapidly consuming supplemental NAD+ before cellular uptake.'
    }
  },
  'nad_precursors': {
    synergy_notes: {
      pairsWellWith: ['TMG (Betaine)', 'Resveratrol', 'Quercetin / Apigenin', 'Zone 2 Exercise'],
      rationale: 'NAD+ precursors demand methyl groups via NNMT clearance; TMG replenishes S-adenosylmethionine (SAMe). Flavonoids like Apigenin block CD38, preserving newly synthesized NAD+.'
    },
    antagonism_notes: {
      avoidCombiningWith: ['Methylation Deficiency without TMG'],
      rationale: 'Dosing high NAD+ precursors without methyl donors can elevate homocysteine in individuals with MTHFR mutations.'
    }
  },

  // --- VITAMIN D3 & K2 ---
  'vitamin_d3': {
    synergy_notes: {
      pairsWellWith: ['Vitamin K2 (MK-7)', 'Magnesium Glycinate', 'Dietary Healthy Fats'],
      rationale: 'Vitamin D3 increases calcium absorption from the gut, while Vitamin K2 (MK-7) activates osteocalcin and matrix Gla protein to direct calcium into bones and away from arterial walls. Magnesium is a required cofactor for enzymatic activation of 25(OH)D.'
    },
    antagonism_notes: {
      avoidCombiningWith: ['High-Dose Calcium Alone', 'Fasting on Empty Stomach'],
      rationale: 'Taking high-dose D3 with calcium but without K2 increases risk of soft tissue calcification. Fat-soluble vitamin requiring dietary lipids for intestinal absorption.'
    }
  },
  'vitamin_k2_mk7': {
    synergy_notes: {
      pairsWellWith: ['Vitamin D3', 'Magnesium', 'Fat-Containing Meal'],
      rationale: 'Activates matrix Gla protein (MGP) to prevent arterial calcification and carboxymates osteocalcin to bind calcium into bone matrix.'
    },
    antagonism_notes: {
      avoidCombiningWith: ['Warfarin / Coumadin (Blood Thinners)'],
      rationale: 'Vitamin K directly antagonizes the vitamin K epoxide reductase (VKOR) inhibition mechanism of Warfarin, altering INR clotting times.'
    }
  },

  // --- FASTING MODALITIES ---
  'intermittent_fasting_18_6': {
    synergy_notes: {
      pairsWellWith: ['Electrolytes (Sodium, Potassium, Magnesium)', 'Black Coffee / Green Tea', 'Zone 2 Cardio', 'Berberine'],
      rationale: 'Fasting drops insulin levels, triggering renal sodium wasting; supplemental electrolytes prevent headache, fatigue, and cramping. Black coffee and EGCG boost autophagy and AMPK activation synergistically.'
    },
    antagonism_notes: {
      avoidCombiningWith: ['Refeeding High-Glycemic Carbs', 'NSAIDs on Empty Stomach'],
      rationale: 'Breaking fasts with refined carbs causes acute glucose/insulin spikes and gastrointestinal distress. NSAIDs on an empty stomach increase gastric mucosal ulceration risk.'
    }
  },
  'intermittent_fasting_20_4': {
    synergy_notes: {
      pairsWellWith: ['Hydration + Electrolytes', 'Protein-Rich Refeeding Meal', 'Zone 2 Walking'],
      rationale: '20-hour fasting accelerates hepatic glycogen depletion and lipid oxidation. High protein refeed ensures muscle preservation.'
    },
    antagonism_notes: {
      avoidCombiningWith: ['Heavy Exhaustive HIIT Near Fast End', 'Simple Sugars Refeed'],
      rationale: 'Hard glycolytic training near end of 20h fast elevates cortisol excessively. High-sugar refeeds trigger massive glycemic spikes.'
    }
  },
  'omad_fasting': {
    synergy_notes: {
      pairsWellWith: ['Comprehensive Electrolytes', 'Digestive Enzymes (at refeed)', 'Bone Broth'],
      rationale: 'Electrolytes sustain vascular tone during the 23-hour fast. Digestive enzymes assist digesting a large single meal without bloating.'
    },
    antagonism_notes: {
      avoidCombiningWith: ['Rapid High-Fat + High-Carb Binge', 'Unbuffered Iron/Zinc Supplements'],
      rationale: 'Eating 2,000+ kcal in 30 minutes can cause severe GI distress; metallic minerals on empty stomach trigger nausea.'
    }
  },
  'water_fast_24h': {
    synergy_notes: {
      pairsWellWith: ['Pink Himalayan Salt / Sodium', 'Magnesium Malate', 'Light Walking'],
      rationale: '24-hour water fasts flush glycogen and intracellular water; sodium supplementation maintains blood pressure and prevents lightheadedness.'
    },
    antagonism_notes: {
      avoidCombiningWith: ['Intense Anaerobic Weightlifting', 'Alcohol'],
      rationale: 'Anaerobic lifting requires glycolytic flux; alcohol during fasting causes acute hypoglycemia and hepatic strain.'
    }
  },
  'monk_fast_36h': {
    synergy_notes: {
      pairsWellWith: ['Electrolyte Powder (No Sugar)', 'Bone Broth (to break fast)', 'EGCG / Green Tea'],
      rationale: '36 hours activates robust macro-autophagy and immune clearance. Breaking with warm bone broth re-introduces collagen and electrolytes gently.'
    },
    antagonism_notes: {
      avoidCombiningWith: ['Heavy Meals immediately post-fast', 'Strenuous CrossFit'],
      rationale: 'Severe GI distress if breaking 36h fast with heavy steak or fried foods.'
    }
  },
  'prolonged_autophagy_fast_72h': {
    synergy_notes: {
      pairsWellWith: ['Unflavored Sodium & Potassium', 'Magnesium Bisglycinate', 'Bone Broth Refeed'],
      rationale: '72h fast triggers hematopoietic stem cell rejuvenation and deep autophagy. Electrolytes are mandatory to avoid refeeding syndrome symptoms.'
    },
    antagonism_notes: {
      avoidCombiningWith: ['High-Carb Meals Post-Fast', 'Heavy Exertion without Supervision'],
      rationale: 'Refeeding carbohydrate spikes insulin, forcing electrolyte shifts (hypophosphatemia risk). Must break fast with broths and healthy fats first.'
    }
  },

  // --- STRENGTH & EXERCISE ---
  'strength-training': {
    synergy_notes: {
      pairsWellWith: ['Creatine Monohydrate', 'Whey / EAAs', 'Magnesium', '7-9 Hours Sleep'],
      rationale: 'Creatine increases intramuscular phosphocreatine stores for explosive anaerobic power. Post-workout protein (leucine) triggers mTORC1 muscle protein synthesis, maximized by deep sleep growth hormone pulses.'
    },
    antagonism_notes: {
      avoidCombiningWith: ['Immediate Cold Plunge Post-Workout', 'High-Dose NSAIDs'],
      rationale: 'Cold water immersion within 4 hours post-lifting blunts localized inflammatory signaling and muscle hypertrophy pathways. High-dose NSAIDs inhibit COX-2 and blunt muscle protein synthesis.'
    }
  },
  'resistance_training': {
    synergy_notes: {
      pairsWellWith: ['Creatine Monohydrate', 'Protein / Leucine', 'Tart Cherry Juice', 'Hydration'],
      rationale: 'Maximizes myofibrillar hypertrophy and bone mineral density when coupled with adequate amino acid availability and recovery sleep.'
    },
    antagonism_notes: {
      avoidCombiningWith: ['Post-Workout Ice Baths (<4h)', 'Chronic Alcohol Consumption'],
      rationale: 'Ice baths immediately after lifting blunt satellite cell activation and hypertrophy signaling pathways.'
    }
  },
  'zone_2_cardio': {
    synergy_notes: {
      pairsWellWith: ['L-Carnitine', 'CoQ10', 'NMN / NAD+ Precursors', 'Electrolytes'],
      rationale: 'Zone 2 relies exclusively on mitochondrial beta-oxidation of fatty acids. L-Carnitine shuttles long-chain fatty acids across the inner mitochondrial membrane, while CoQ10 optimizes electron transport chain ATP production.'
    },
    antagonism_notes: {
      avoidCombiningWith: ['High-Glycemic Simple Sugars Pre-Workout', 'Zone 4/5 Anaerobic Spikes'],
      rationale: 'Ingesting high-glycemic carbs right before Zone 2 spikes insulin, inhibiting lipolysis and switching cellular substrate preference back to glycolysis.'
    }
  },

  // --- NOOTROPICS & SLEEP ---
  'alpha_gpc': {
    synergy_notes: {
      pairsWellWith: ['Uridine Monophosphate', 'Omega-3 DHA', 'L-Theanine', 'Caffeine'],
      rationale: 'Combines with Uridine and DHA to form the Mr. Happy Stack, accelerating phosphatidylcholine synthesis and synaptic density (Kennedy pathway). L-Theanine prevents acetylcholine-mediated over-excitation.'
    },
    antagonism_notes: {
      avoidCombiningWith: ['High-Dose Anticholinergic Drugs', 'Daily Unbuffered High Doses'],
      rationale: 'Chronically high Alpha-GPC without breaks can elevate TMAO (gut bacterial metabolite) and cause acetylcholine dominance symptoms (depression, lethargy, muscle tightness).'
    }
  },
  'lions_mane': {
    synergy_notes: {
      pairsWellWith: ['Niacin (Vitamin B3)', 'Alpha-GPC', 'Coffee / L-Theanine'],
      rationale: 'Niacin causes peripheral vasodilation to deliver erinacines and hericenones to peripheral nerve endings, boosting nerve growth factor (NGF) and neurogenesis.'
    },
    antagonism_notes: {
      avoidCombiningWith: ['High-Dose 5-alpha reductase inhibitors (in sensitive individuals)'],
      rationale: 'Lion\'s mane may weakly inhibit 5-alpha reductase; monitor if tracking androgen levels.'
    }
  },
  'sulforaphane': {
    synergy_notes: {
      pairsWellWith: ['Myrosinase (Mustard Seed Powder)', 'Selenium', 'Glutathione / NAC'],
      rationale: 'Myrosinase is the essential enzyme that converts glucoraphanin to active sulforaphane. Sulforaphane activates the Nrf2 pathway, upregulating Phase II detoxification enzymes and endogenous antioxidant production.'
    },
    antagonism_notes: {
      avoidCombiningWith: ['High Heat Cooking (>60°C)', 'Severe Iodine Deficiency'],
      rationale: 'Cooking broccoli sprouts above 60°C denatures myrosinase. Excess raw brassica glucosinolates without adequate iodine may act as mild goitrogens.'
    }
  },
  'alpha_lipoic_acid': {
    synergy_notes: {
      pairsWellWith: ['ALCAR (Acetyl-L-Carnitine)', 'CoQ10', 'Vitamin C & E'],
      rationale: 'ALA recycles oxidized Vitamin C, Vitamin E, and Glutathione back to active reduced states. When paired with ALCAR, it reverses age-related mitochondrial decay and lipid peroxidation.'
    },
    antagonism_notes: {
      avoidCombiningWith: ['Biotin Depletion (Take biotin separated)', 'Minerals at same time'],
      rationale: 'ALA chelates heavy metals and can bind minerals like iron and copper if taken simultaneously. High-dose ALA competes with Biotin transport.'
    }
  },
  'bacopa_monnieri': {
    synergy_notes: {
      pairsWellWith: ['Dietary Fat (Lipidic carrier)', 'Gotu Kola', 'L-Theanine', 'Phosphatidylserine'],
      rationale: 'Bacosides are fat-soluble saponins requiring dietary fat for bioavailability. Enhances synaptic communication and serotonin/GABA neurotransmission.'
    },
    antagonism_notes: {
      avoidCombiningWith: ['Empty Stomach (causes nausea)', 'Sedating Antihistamines'],
      rationale: 'Can cause GI upset on an empty stomach. Weak acetylcholinesterase inhibition may amplify lethargy if paired with heavy sedatives.'
    }
  },
  'lithium_orotate': {
    synergy_notes: {
      pairsWellWith: ['Omega-3 Fatty Acids', 'Magnesium', 'Glycine', 'BDNF Boosters'],
      rationale: 'Inhibits GSK-3beta, promoting neuroprotection, brain-derived neurotrophic factor (BDNF), and autophagy. Microdosing (1-5mg elemental) stabilizes mood without renal toxicity.'
    },
    antagonism_notes: {
      avoidCombiningWith: ['Dehydration / Sodium Depletion', 'NSAIDs'],
      rationale: 'Sodium depletion decreases renal lithium clearance, elevating blood levels. NSAIDs decrease lithium excretion.'
    }
  },
  'coq10': {
    synergy_notes: {
      pairsWellWith: ['PQQ (Pyrroloquinoline Quinone)', 'Shilajit', 'Statins', 'Omega-3s'],
      rationale: 'Shilajit stabilizes CoQ10 in its active reduced Ubiquinol form and increases cellular ATP output. PQQ stimulates mitochondrial biogenesis, while CoQ10 powers existing mitochondria.'
    },
    antagonism_notes: {
      avoidCombiningWith: ['Taking at Bedtime'],
      rationale: 'Enhances ATP synthesis, which can cause mild sleep disturbance if taken immediately before sleep.'
    }
  },
  'red_light_photobiomodulation_therapy': {
    synergy_notes: {
      pairsWellWith: ['Methylene Blue', 'CoQ10', 'Topical Hyaluronic Acid', 'Post-Workout Recovery'],
      rationale: 'Photons at 660nm and 850nm excite Cytochrome c Oxidase in the mitochondrial electron transport chain. Methylene blue acts as an alternative electron acceptor, creating peak ATP mitochondrial output.'
    },
    antagonism_notes: {
      avoidCombiningWith: ['Photosensitizing Drugs (Tetracylines, Isotretinoin)', 'Over-exposure (>20 min per area)'],
      rationale: 'Excessive photon exposure causes a biphasic dose response, producing reactive oxygen species (ROS) rather than ATP benefits.'
    }
  },
  'bfr_training': {
    synergy_notes: {
      pairsWellWith: ['Essential Amino Acids', 'Creatine', 'Light Loading (20-30% 1RM)'],
      rationale: 'Venous occlusion induces intracellular swelling, hypoxia, and massive growth hormone pulse without high joint stress.'
    },
    antagonism_notes: {
      avoidCombiningWith: ['Arterial Occlusion (cuffs too tight)', 'Active Deep Vein Thrombosis (DVT)'],
      rationale: 'Cuffs must never block arterial flow (7/10 tightness max). Contraindicated in blood clotting disorders.'
    }
  }
};

async function seed() {
  console.log("Updating synergies and antagonisms in Supabase...");
  
  for (const [id, data] of Object.entries(synergyUpdates)) {
    const { error } = await supabase
      .from('modalities')
      .update({
        synergy_notes: data.synergy_notes,
        antagonism_notes: data.antagonism_notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error(`Failed to update ${id}:`, error.message);
    } else {
      console.log(`✓ Updated synergies & antagonisms for [${id}]`);
    }
  }

  console.log("\nSeeding completed!");
}

seed();
