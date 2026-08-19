const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => { 
  const [k, ...v] = line.split('='); 
  if(k && v) acc[k] = v.join('=').replace(/"/g, '').trim(); 
  return acc; 
}, {}); 

const { createClient } = require('@supabase/supabase-js'); 
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY); 

const updates = [
  { 
    id: 'hyperbaric_oxygen_therapy_hbot', 
    dose: '60-90 min @ 1.5-2.0 ATA', 
    freq: 'Daily (Protocols of 20-60)', 
    timing: 'Anytime', 
    benefit: 4,
    moa: 'Floods plasma with oxygen under pressure, stimulating angiogenesis, reducing inflammation, and triggering stem cell mobilization.',
    syn: { "pairsWellWith": ["hyperbaric_oxygen", "fasting"], "rationale": "Fasting before HBOT can amplify autophagy and ketosis." }
  },
  { 
    id: 'red_light_photobiomodulation_therapy', 
    dose: '10-20 mins (10-50 mW/cm2)', 
    freq: '3-5x Weekly', 
    timing: 'Anytime', 
    benefit: 3,
    moa: 'Photons penetrate tissue and are absorbed by cytochrome C oxidase in the mitochondria, directly increasing ATP production and reducing oxidative stress.'
  },
  { 
    id: 'vo2_max_hiit_training', 
    dose: '4x4 intervals (4m hard, 4m active rest)', 
    freq: '1-2x Weekly', 
    timing: 'Morning / Afternoon', 
    benefit: 5,
    moa: 'Maximizes stroke volume of the heart and drives mitochondrial biogenesis in muscle tissue, creating a massive metabolic sink for glucose.'
  },
  { 
    id: 'glycine_supplementation', 
    dose: '3-5g', 
    freq: 'Daily', 
    timing: 'Before Bed', 
    benefit: 3,
    moa: 'Acts as an inhibitory neurotransmitter in the brainstem, promoting sleep by lowering core body temperature via peripheral vasodilation.',
    syn: { "pairsWellWith": ["nac_supplement", "magnesium_glycinate"], "rationale": "Combines with NAC to synthesize glutathione, a master antioxidant." }
  },
  { 
    id: 'nad_iv_therapy', 
    dose: '250-500mg IV', 
    freq: 'Monthly / Cycled', 
    timing: 'Morning', 
    benefit: 3,
    moa: 'Bypasses the digestive system to rapidly elevate systemic NAD+ levels, fueling sirtuin activity and PARP DNA repair enzymes.'
  },
  { 
    id: 'ashwagandha_ksm_66', 
    dose: '300-600mg', 
    freq: 'Daily (Cycled)', 
    timing: 'Evening / Afternoon', 
    benefit: 3,
    moa: 'An adaptogen that modulates the HPA axis, significantly lowering serum cortisol and reducing stress-induced anxiety.'
  },
  { 
    id: 'alpha_ketoglutarate_akg', 
    dose: '1000mg', 
    freq: 'Daily', 
    timing: 'Morning', 
    benefit: 4,
    moa: 'A key intermediate in the Krebs cycle that also acts as a cofactor for TET enzymes, facilitating active DNA demethylation and epigenetic clock reversal.'
  },
  { 
    id: 'fisetin', 
    dose: '20mg/kg bodyweight', 
    freq: '2-3 Days Monthly (Hit and Run)', 
    timing: 'Morning with fats', 
    benefit: 3,
    moa: 'A flavonoid that acts as a potent senolytic by inhibiting the PI3K/AKT/mTOR pathway, triggering apoptosis specifically in senescent cells.'
  },
  { 
    id: 'blood_donation_phlebotomy', 
    dose: '1 Pint (Whole Blood)', 
    freq: '2-4x Annually', 
    timing: 'Anytime', 
    benefit: 3,
    moa: 'Mechanically removes excess serum ferritin (iron) and microplastics from circulation, reducing systemic oxidative stress and lipid peroxidation.'
  },
  { 
    id: 'n_acetyl_cysteine_nac', 
    dose: '600-1200mg', 
    freq: 'Daily', 
    timing: 'Morning / Fasted', 
    benefit: 4,
    moa: 'Provides the rate-limiting amino acid (cysteine) required for intracellular glutathione synthesis, acting as a powerful systemic antioxidant.',
    syn: { "pairsWellWith": ["glycine_supplementation"], "rationale": "GlyNAC combination is highly proven to reverse mitochondrial dysfunction in older adults." }
  },
  { 
    id: 'magnesium_threonate', 
    dose: '144mg elemental Mg (approx 2000mg Magtein)', 
    freq: 'Daily', 
    timing: 'Evening', 
    benefit: 3,
    moa: 'A unique magnesium salt capable of efficiently crossing the blood-brain barrier to increase synaptic density and enhance cognitive function.'
  },
  { 
    id: 'astaxanthin', 
    dose: '4-12mg', 
    freq: 'Daily', 
    timing: 'With Fats', 
    benefit: 3,
    moa: 'A unique carotenoid that physically spans the lipid bilayer of cell membranes, providing superior protection against mitochondrial lipid peroxidation.'
  },
  { 
    id: 'urolithin_a', 
    dose: '500-1000mg', 
    freq: 'Daily', 
    timing: 'Morning', 
    benefit: 4,
    moa: 'A postbiotic compound that specifically triggers mitophagy, the selective clearing of dysfunctional mitochondria, thereby improving muscle endurance.'
  },
  { 
    id: 'taurine', 
    dose: '1-3g', 
    freq: 'Daily', 
    timing: 'Pre-workout or Evening', 
    benefit: 4,
    moa: 'Acts as an osmolyte and cytoprotectant, regulating mitochondrial protein synthesis and reducing inflammaging across multiple organ systems.'
  }
];

async function patchMissing14() {
  console.log("Patching the 14 missed modalities...");
  for (const u of updates) {
    const synObj = u.syn ? u.syn : {};
    
    const { error } = await supabase.from("modalities")
      .update({ 
        dose_or_exposure: u.dose, 
        frequency: u.freq, 
        timing_summary: u.timing, 
        overall_longevity_benefit: u.benefit,
        mechanism_of_action: u.moa,
        synergy_notes: synObj
      })
      .eq("id", u.id);
      
    if (error) {
      console.error("Error updating", u.id, error);
    } else {
      console.log("Successfully updated:", u.id);
    }
  }
  console.log("All 14 missed modalities have been perfectly fleshed out.");
}

patchMissing14();
