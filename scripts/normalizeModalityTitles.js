const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('@next/env').loadEnvConfig(process.cwd());

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Map of canonical title normalizations separating dosage from modality identity
const TITLE_UPDATES = [
  // Skincare & Topicals
  {
    id: 'ceramide_ectoin_barrier_cream',
    display_name: 'Ceramide & Ectoin Barrier Cream',
    name: 'Ceramide NP & Ectoin Barrier Recovery Cream'
  },
  {
    id: 'topical_ghk_cu_serum',
    display_name: 'Topical GHK-Cu Copper Peptide Serum',
    name: 'Topical GHK-Cu Copper Tripeptide Serum'
  },
  {
    id: 'micro_retinoid_tretinoin',
    display_name: 'Micro-Retinoid (Topical)',
    name: 'Micro-Encapsulated Retinoid (Topical)'
  },
  {
    id: 'antioxidant_vitamin_c_ferulic',
    display_name: 'Antioxidant C+E+Ferulic Serum',
    name: 'Antioxidant C + E + Ferulic Acid Serum'
  },
  {
    id: 'mineral_sunscreen_spf50',
    display_name: 'Mineral SPF 50+ Sunscreen',
    name: 'Mineral Zinc Oxide SPF 50+ Sunscreen'
  },
  {
    id: 'hydrolyzed_collagen_peptides',
    display_name: 'Hydrolyzed Collagen Peptides',
    name: 'Hydrolyzed Collagen Peptides (Types I & III)'
  },
  {
    id: 'red_nir_led_mask',
    display_name: 'Red & NIR Photobiomodulation Mask',
    name: 'Red & Near-Infrared LED Photobiomodulation Mask'
  },

  // Peptides (Preserving Route (SubQ), removing dosage amounts)
  {
    id: 'bpc157_subq',
    display_name: 'BPC-157 Peptide (SubQ)',
    name: 'BPC-157 Peptide (SubQ)'
  },
  {
    id: 'tb500_subq',
    display_name: 'TB-500 Thymosin Beta-4 (SubQ)',
    name: 'TB-500 (Thymosin Beta-4 SubQ)'
  },
  {
    id: 'ipamorelin_subq',
    display_name: 'Ipamorelin (SubQ)',
    name: 'Ipamorelin Growth Hormone Secretagogue (SubQ)'
  },
  {
    id: 'cjc1295_no_dac_subq',
    display_name: 'CJC-1295 No DAC (SubQ)',
    name: 'CJC-1295 (No DAC / Mod GRF 1-29 SubQ)'
  },
  {
    id: 'ghk_cu_subq',
    display_name: 'GHK-Cu Peptide (SubQ)',
    name: 'GHK-Cu (Copper Tripeptide-1 SubQ)'
  },
  {
    id: 'tirzepatide_subq',
    display_name: 'Tirzepatide (SubQ)',
    name: 'Tirzepatide (Dual GIP/GLP-1 Receptor Agonist SubQ)'
  },
  {
    id: 'kpv_subq',
    display_name: 'KPV Peptide (SubQ)',
    name: 'KPV (Alpha-MSH 11-13 Tripeptide SubQ)'
  },
  {
    id: 'aod9604_subq',
    display_name: 'AOD-9604 Lipolytic Fragment (SubQ)',
    name: 'AOD-9604 (Lipolytic hGH Fragment 177-191 SubQ)'
  },

  // Supplements & Biomolecules
  {
    id: 'glycine_3g',
    display_name: 'Glycine Supplementation',
    name: 'Glycine Supplementation'
  },
  {
    id: 'glycine',
    display_name: 'Glycine Supplementation',
    name: 'Glycine Supplementation'
  },
  {
    id: 'apigenin',
    display_name: 'Apigenin',
    name: 'Apigenin Flavonoid'
  },
  {
    id: 'l_theanine',
    display_name: 'L-Theanine',
    name: 'L-Theanine Amino Acid'
  },
  {
    id: 'means_berberine_gda',
    display_name: 'Berberine HCl',
    name: 'Berberine HCl Glucose Disposal Agent'
  },
  {
    id: 'rhonda_vitamin_d3_k2',
    display_name: 'Vitamin D3 + K2 (MK-7)',
    name: 'Vitamin D3 (Cholecalciferol) + Vitamin K2 (MK-7)'
  },
  {
    id: 'dayspring_viscous_fiber_phytosterols',
    display_name: 'Viscous Soluble Fiber & Plant Phytosterols',
    name: 'Viscous Soluble Fiber & Plant Phytosterols'
  },
  {
    id: 'dayspring_inorganic_nitrate_citrulline',
    display_name: 'Dietary Inorganic Nitrate + L-Citrulline Malate',
    name: 'Dietary Inorganic Nitrate + L-Citrulline Malate'
  },

  // Movement & Behavioral Protocols
  {
    id: 'hm_progressive_longrun',
    display_name: 'Progressive Endurance Long Run',
    name: 'Progressive Endurance Long Run (Cardiovascular Base)'
  },
  {
    id: 'vilpa_micro_bursts',
    display_name: 'VILPA Vigorous Micro-Bursts',
    name: 'VILPA (Vigorous Intermittent Lifestyle Physical Activity)'
  },
  {
    id: 'delay_caffeine',
    display_name: 'Circadian Caffeine Delay',
    name: 'Circadian Adenosine Caffeine Delay'
  },
  {
    id: 'sleep_rescue_eye_movement',
    display_name: 'Sleep Rescue: Lateral Eye Movement Sweep',
    name: 'Sleep Rescue: Lateral Eye Movement Sweep'
  }
];

async function run() {
  console.log('--- Executing Modality Title Normalization in Supabase ---');
  let successCount = 0;
  let failCount = 0;

  for (const item of TITLE_UPDATES) {
    const { data, error } = await supabase
      .from('modalities')
      .update({
        display_name: item.display_name,
        name: item.name
      })
      .eq('id', item.id)
      .select('id, name, display_name');

    if (error) {
      console.error(`[FAIL] ${item.id}:`, error.message);
      failCount++;
    } else if (!data || data.length === 0) {
      console.warn(`[WARN] ${item.id}: Row not found in Supabase`);
    } else {
      console.log(`[OK] ${item.id} -> Display: "${data[0].display_name}" | Name: "${data[0].name}"`);
      successCount++;
    }
  }

  console.log(`\nCompleted: ${successCount} updated successfully, ${failCount} failed.`);
}

run();
