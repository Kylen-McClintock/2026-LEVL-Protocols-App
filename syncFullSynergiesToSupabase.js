const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (fs.existsSync('.env.local')) {
  const envText = fs.readFileSync('.env.local', 'utf-8');
  envText.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length) {
      const val = vals.join('=').trim().replace(/^["']|["']$/g, '');
      if (key.trim() === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = val;
      if (key.trim() === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') supabaseKey = val;
    }
  });
}

const supabase = createClient(supabaseUrl, supabaseKey);

const COMPREHENSIVE_MODALITY_SYNERGIES = {
  // Methylene Blue
  'methylene_blue': {
    synergy_notes: {
      pairsWellWith: ['Red Light Photobiomodulation', 'CoQ10 / Ubiquinol', 'Zone 2 Cardio'],
      rationale: 'Acts as an alternative electron cycler in the mitochondrial electron transport chain (Complex I-IV), creating synergistic ATP velocity when combined with 660nm/850nm red light photon absorption.'
    },
    antagonism_notes: {
      avoidCombiningWith: ['SSRIs / Serotonergic Antidepressants (MAO-A inhibition)', 'High Doses (>2mg/kg)'],
      rationale: 'Methylene blue is a potent monoamine oxidase A (MAO-A) inhibitor. Taking it alongside SSRIs or SNRIs carries a clinical risk of Serotonin Syndrome.'
    }
  },

  // Astaxanthin
  'astaxanthin': {
    synergy_notes: {
      pairsWellWith: ['High-Polyphenol EVOO', 'Omega-3 EPA/DHA', 'Morning Sunlight'],
      rationale: 'Lipophilic marine carotenoid that integrates across the full lipid bilayer of cellular membranes. Co-ingesting with dietary fats increases lymphatic uptake by 4x; protects skin from solar UV photon damage.'
    },
    antagonism_notes: {
      avoidCombiningWith: ['Taking on empty stomach without fat carrier'],
      rationale: 'Aqueous insolubility causes poor absorption (<5%) if taken without dietary lipids.'
    }
  },

  // GlyNAC (Glycine + NAC)
  'glynac_glutathione_pulse': {
    synergy_notes: {
      pairsWellWith: ['Alpha-Lipoic Acid (ALA)', 'Selenium', 'Magnesium Glycinate'],
      rationale: 'Provides rate-limiting Glycine and Cysteine to drive gamma-glutamylcysteine synthetase for intracellular glutathione (GSH) synthesis, correcting age-related mitochondrial dysfunction.'
    },
    antagonism_notes: {
      avoidCombiningWith: ['Immediate Post-Workout Window (<2h)'],
      rationale: 'High-dose antioxidant pulses immediately post-exercise can blunt exercise-induced reactive oxygen species (ROS) required for PGC-1alpha mitochondrial biogenesis.'
    }
  },

  // Post-Meal Walk & Soleus Pushups
  'means_soleus_pushups_postmeal_walk': {
    synergy_notes: {
      pairsWellWith: ['Berberine HCl', 'Apple Cider Vinegar (ACV)', 'Macro Meal Sequencing'],
      rationale: 'Soleus muscle contractions and light ambulation trigger non-insulin dependent GLUT4 glucose transporter translocation, directly blunting postprandial glucose AUC.'
    },
    antagonism_notes: {
      avoidCombiningWith: ['Prolonged Sedentary Sitting immediately after high-carb meals'],
      rationale: 'Sedentary state post-meal forces high pancreatic insulin secretion and glycemic variability.'
    }
  },

  // Wim Hof Cold Shock Immersion
  'wim_hof_cold_shock_immersion': {
    synergy_notes: {
      pairsWellWith: ['Wim Hof Breathwork', 'Morning Sunlight', 'Hyperthermic Sauna (Contrast)', 'Horse Stance Thermogenesis'],
      rationale: 'Triggers a massive 530% norepinephrine surge and activates brown adipose tissue (BAT) thermogenesis via UCP1 uncoupling.'
    },
    antagonism_notes: {
      avoidCombiningWith: ['Resistance Training within 4 hours', 'Hyperventilation while inside water'],
      rationale: 'Cold water within 4 hours of lifting blunts satellite cell muscle hypertrophy. Never perform hyperventilation breathwork in water due to shallow water blackout risk.'
    }
  },

  // Coherent 5.5s Breathing
  'coherent_breathing': {
    synergy_notes: {
      pairsWellWith: ['Magnesium Glycinate', 'Evening Wind-Down', 'Heart Rate Variability (HRV) Tracking'],
      rationale: 'Paces respiration at ~0.1 Hz (5.5 breaths/min), maximizing respiratory sinus arrhythmia and parasympathetic vagal tone.'
    },
    antagonism_notes: {
      avoidCombiningWith: ['High-Stress Multitasking / Screen Stimulation during session'],
      rationale: 'Cognitive sympathetic arousal counteracts vagal autonomic entrainment.'
    }
  },

  // Resveratrol / Pterostilbene
  'resveratrol_pterostilbene': {
    synergy_notes: {
      pairsWellWith: ['NMN / NAD+ Precursors', 'Quercetin / Apigenin', 'Extra Virgin Olive Oil (EVOO)'],
      rationale: 'Allosterically activates SIRT1 deacetylation, which requires high cellular NAD+ levels supplied by NMN. Lipophilic structure requires dietary fat.'
    },
    antagonism_notes: {
      avoidCombiningWith: ['Taking on dry empty stomach', 'Post-Workout Hypertrophy Window'],
      rationale: 'Resveratrol has low water solubility; high doses post-lifting can blunt exercise adaptation.'
    }
  },

  // Heme Iron
  'heme-iron': {
    synergy_notes: {
      pairsWellWith: ['Vitamin C (Ascorbic Acid)', 'Meat / Amino Acid Factor'],
      rationale: 'Ascorbic acid maintains iron in the soluble ferrous (Fe2+) state, boosting intestinal absorption by up to 300%.'
    },
    antagonism_notes: {
      avoidCombiningWith: ['Calcium / Dairy', 'Coffee / Black Tea', 'Zinc / Magnesium'],
      rationale: 'Calcium and zinc compete for Divalent Metal Transporter-1 (DMT1); chlorogenic acid and tannins in coffee/tea chelate iron into insoluble complexes. Separate by 2 hours.'
    }
  },

  // Zinc Picolinate / Bisglycinate
  'zinc': {
    synergy_notes: {
      pairsWellWith: ['Copper (15:1 Zinc:Copper ratio)', 'Vitamin A', 'Quercetin (Zinc Ionophore)'],
      rationale: 'Essential for DNA synthesis, thymulin immune function, and testosterone synthesis. Quercetin acts as a natural ionophore to transport zinc into cells.'
    },
    antagonism_notes: {
      avoidCombiningWith: ['High-Dose Iron', 'High-Dose Zinc (>30mg) without Copper', 'Empty Stomach'],
      rationale: 'Chronic high zinc induces intestinal metallothionein, trapping dietary copper and inducing anemia. Take with food to prevent nausea.'
    }
  },

  // High-Flavanol Cocoa
  'cocoa-flavanols': {
    synergy_notes: {
      pairsWellWith: ['Zone 2 Cardio', 'Inorganic Nitrate (Beetroot)', 'Morning Sunlight'],
      rationale: 'Epicatechins stimulate endothelial nitric oxide synthase (eNOS), lowering blood pressure and improving cerebral blood flow and flow-mediated dilation (FMD).'
    },
    antagonism_notes: {
      avoidCombiningWith: ['Dairy Milk (Casein protein binds polyphenols)', 'Late Evening Bedtime'],
      rationale: 'Dairy casein binds flavanols and prevents intestinal absorption; contains trace theobromine which can disrupt sleep.'
    }
  },

  // High-Polyphenol EVOO
  'extra-virgin-olive-oil': {
    synergy_notes: {
      pairsWellWith: ['Fisetin', 'Quercetin', 'Vitamin D3 & K2', 'Curcumin', 'Nut Pudding'],
      rationale: 'Oleocanthal and oleuropein provide potent anti-inflammatory COX-1/2 inhibition while lipid triglycerides act as the optimal micelle carrier for lipophilic supplements.'
    },
    antagonism_notes: {
      avoidCombiningWith: ['High-Heat Deep Frying (>375°F)'],
      rationale: 'Overheating oxidizes delicate polyphenols and unsaturated fatty acids.'
    }
  },

  // Inorganic Nitrate & Citrulline
  'dayspring_inorganic_nitrate_citrulline': {
    synergy_notes: {
      pairsWellWith: ['Zone 2 Cardio', 'VO2 Max Intervals', 'Sauna Exposure'],
      rationale: 'Nitrates convert to nitrite in the oral microbiome and into systemic Nitric Oxide (NO), reducing the ATP and oxygen cost of muscular contraction.'
    },
    antagonism_notes: {
      avoidCombiningWith: ['Antibacterial Mouthwash (Destroys oral nitrate-reducing bacteria)'],
      rationale: 'Chlorhexidine and antiseptic mouthwashes kill oral Veillonella and Actinomyces bacteria, completely blocking nitrate-to-nitrite conversion.'
    }
  },

  // Urolithin A (Mitophagy Support)
  'urolithin_a_mitophagy': {
    synergy_notes: {
      pairsWellWith: ['Zone 2 Cardio', 'Resistance Training', 'CoQ10'],
      rationale: 'Induces selective autophagy of dysfunctional mitochondria (mitophagy), clearing defective organelles so newly synthesized healthy mitochondria take over cellular respiration.'
    },
    antagonism_notes: {
      avoidCombiningWith: ['Chronic Nutrient Excess without Fasting or Exercise'],
      rationale: 'Mitophagy is amplified when coupled with energetic deficit or exercise-induced AMPK activation.'
    }
  },

  // Rapamycin Weekly
  'rapamycin_weekly': {
    synergy_notes: {
      pairsWellWith: ['High-Fat Meal (Enhances absorption 3x)', 'Prolonged Fasting'],
      rationale: 'Pulsed weekly dosing selectively inhibits mTORC1 without chronically suppressing mTORC2, rejuvenating hematopoietic stem cells and clearing senescent phenotypes.'
    },
    antagonism_notes: {
      avoidCombiningWith: ['Continuous Daily Dosing (Causes mTORC2 immunosuppression)', 'Active Severe Infections'],
      rationale: 'Must be pulsed weekly to preserve immune memory and avoid glucose intolerance.'
    }
  },

  // Peter Attia High-Leucine Protein Distribution
  'attia_protein_distribution': {
    synergy_notes: {
      pairsWellWith: ['Resistance Training', 'Creatine Monohydrate', 'Magnesium Bisglycinate'],
      rationale: 'Dosing 30–50g of high-quality protein containing >2.5g leucine reaches the leucine trigger threshold, turning on mTORC1 muscle protein synthesis 3–4 times daily.'
    },
    antagonism_notes: {
      avoidCombiningWith: ['Prolonged Deep Fasting Days (Incompatible with high-frequency feeding)'],
      rationale: 'Anabolic MPS pulses require regular amino acid availability throughout feeding windows.'
    }
  },

  // Dr. Rhonda Patrick Hyperthermic Sauna
  'rhonda_hyperthermic_sauna': {
    synergy_notes: {
      pairsWellWith: ['Electrolytes + Hydration', 'Cold Plunge (Contrast)', 'Zone 2 Cardio (Pre-Sauna)'],
      rationale: '174°F–194°F for 20 minutes induces Heat Shock Protein 70 (HSP70), elevates IL-6 anti-inflammatory pulses, and triggers growth hormone surges.'
    },
    antagonism_notes: {
      avoidCombiningWith: ['Severe Dehydration', 'Heavy Alcohol', 'Immediate Pre-Heavy Max Lifting'],
      rationale: 'Sauna induces acute plasma volume shifts; severe dehydration increases orthostatic hypotension risk.'
    }
  },

  // 10-Hour Caffeine Cutoff (Walker)
  'walker_caffeine_cutoff': {
    synergy_notes: {
      pairsWellWith: ['Magnesium Glycinate', '65°F Sleep Environment', 'Dark & Cool Bedroom'],
      rationale: 'Allows caffeine to undergo two full elimination half-lives, clearing adenosine A1/A2A receptors in the brain prior to sleep onset.'
    },
    antagonism_notes: {
      avoidCombiningWith: ['Afternoon Energy Drinks / Pre-Workout after 12:00 PM'],
      rationale: 'Late stimulant ingestion blocks Stage 3/4 slow-wave sleep and spikes nighttime resting heart rate.'
    }
  }
};

async function syncAllSynergies() {
  console.log('Fetching all modalities from Supabase...');
  const { data: modalities, error } = await supabase.from('modalities').select('id, name, display_name, category');
  if (error) {
    console.error('Fetch error:', error);
    return;
  }

  console.log(`Fetched ${modalities.length} modalities. Starting database enrichment...`);
  let updatedCount = 0;

  for (const mod of modalities) {
    const matched = COMPREHENSIVE_MODALITY_SYNERGIES[mod.id] ||
      Object.entries(COMPREHENSIVE_MODALITY_SYNERGIES).find(([key]) => mod.id.includes(key))?.[1];

    if (matched) {
      const { error: updateErr } = await supabase
        .from('modalities')
        .update({
          synergy_notes: matched.synergy_notes,
          antagonism_notes: matched.antagonism_notes
        })
        .eq('id', mod.id);

      if (updateErr) {
        console.error(`Error updating [${mod.id}]:`, updateErr);
      } else {
        console.log(`✓ Updated [${mod.id}] ${mod.display_name || mod.name}`);
        updatedCount++;
      }
    }
  }

  console.log(`\nSuccessfully updated ${updatedCount} modalities in remote Supabase!`);
}

syncAllSynergies();
