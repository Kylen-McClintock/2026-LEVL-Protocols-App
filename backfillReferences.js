const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const referencesMap = {
  'rapamycin_weekly': [
    { title: "Rapamycin and aging: When, for how long, and how much?", url: "https://pubmed.ncbi.nlm.nih.gov/29033321/", type: "Review" },
    { title: "mTOR inhibition improves immune function in the elderly", url: "https://pubmed.ncbi.nlm.nih.gov/25540326/", type: "RCT" }
  ],
  'metformin_daily': [
    { title: "Metformin as a Tool to Target Aging", url: "https://pubmed.ncbi.nlm.nih.gov/27304507/", type: "Review" },
    { title: "Can people with type 2 diabetes live longer than those without? A comparison of mortality", url: "https://pubmed.ncbi.nlm.nih.gov/25041462/", type: "Observational" }
  ],
  'zone_2_cardio': [
    { title: "Effects of Exercise on Mitochondrial Content and Function in Aging Human Skeletal Muscle", url: "https://pubmed.ncbi.nlm.nih.gov/23581781/", type: "Review" },
    { title: "Exercise training in heart failure", url: "https://pubmed.ncbi.nlm.nih.gov/22425076/", type: "Meta-Analysis" }
  ],
  'spermidine_supplement': [
    { title: "Higher spermidine intake is linked to lower mortality", url: "https://pubmed.ncbi.nlm.nih.gov/29953335/", type: "Observational" },
    { title: "Spermidine delays aging in humans", url: "https://pubmed.ncbi.nlm.nih.gov/29315079/", type: "Review" }
  ],
  'sauna_exposure': [
    { title: "Sauna Bathing Is Inversely Associated with Dementia and Alzheimer's Disease", url: "https://pubmed.ncbi.nlm.nih.gov/27932366/", type: "Observational" },
    { title: "Cardiovascular and Other Health Benefits of Sauna Bathing", url: "https://pubmed.ncbi.nlm.nih.gov/30077204/", type: "Review" }
  ],
  'epa_dha_omega3': [
    { title: "Cardiovascular Risk Reduction with Icosapent Ethyl for Hypertriglyceridemia (REDUCE-IT)", url: "https://pubmed.ncbi.nlm.nih.gov/30415628/", type: "RCT" },
    { title: "Marine Omega-3 Supplementation and Cardiovascular Disease", url: "https://pubmed.ncbi.nlm.nih.gov/31567003/", type: "Meta-Analysis" }
  ],
  'creatine_monohydrate': [
    { title: "Creatine supplementation and cognitive performance", url: "https://pubmed.ncbi.nlm.nih.gov/36316270/", type: "Meta-Analysis" },
    { title: "International Society of Sports Nutrition position stand: safety and efficacy of creatine", url: "https://pubmed.ncbi.nlm.nih.gov/28615996/", type: "Review" }
  ],
  'cold_water_immersion': [
    { title: "Human physiological responses to immersion into water of different temperatures", url: "https://pubmed.ncbi.nlm.nih.gov/10751106/", type: "Experimental" },
    { title: "Health effects of voluntary exposure to cold water", url: "https://pubmed.ncbi.nlm.nih.gov/36137592/", type: "Review" }
  ],
  'intermittent_fasting_16_8': [
    { title: "Effects of Intermittent Fasting on Health, Aging, and Disease", url: "https://pubmed.ncbi.nlm.nih.gov/31881139/", type: "Review" },
    { title: "Time-Restricted Eating Effects on Body Composition and Metabolic Measures", url: "https://pubmed.ncbi.nlm.nih.gov/32486948/", type: "RCT" }
  ],
  'acarbose': [
    { title: "Acarbose, 17-α-estradiol, and nordihydroguaiaretic acid extend mouse lifespan", url: "https://pubmed.ncbi.nlm.nih.gov/24245565/", type: "Experimental" },
    { title: "Acarbose for prevention of type 2 diabetes", url: "https://pubmed.ncbi.nlm.nih.gov/11408169/", type: "RCT" }
  ],
  'morning_sunlight': [
    { title: "The Role of Light in the Human Circadian System", url: "https://pubmed.ncbi.nlm.nih.gov/16499877/", type: "Review" },
    { title: "Daytime light exposure and melatonin", url: "https://pubmed.ncbi.nlm.nih.gov/8979406/", type: "Experimental" }
  ],
  'magnesium_glycinate': [
    { title: "The effect of magnesium supplementation on primary insomnia", url: "https://pubmed.ncbi.nlm.nih.gov/23853635/", type: "RCT" },
    { title: "Magnesium Status and Stress", url: "https://pubmed.ncbi.nlm.nih.gov/33260549/", type: "Review" }
  ],
  'nad_precursors': [
    { title: "NAD+ in aging, metabolism, and neurodegeneration", url: "https://pubmed.ncbi.nlm.nih.gov/26653298/", type: "Review" },
    { title: "Nicotinamide Riboside Augments the Aged Human Skeletal Muscle NAD+ Metabolome", url: "https://pubmed.ncbi.nlm.nih.gov/31412242/", type: "RCT" }
  ],
  'resistance_training': [
    { title: "Resistance Training is Medicine", url: "https://pubmed.ncbi.nlm.nih.gov/22777332/", type: "Review" },
    { title: "Effects of Resistance Training on Insulin Sensitivity", url: "https://pubmed.ncbi.nlm.nih.gov/21778224/", type: "Meta-Analysis" }
  ],
  'dexa_scan': [
    { title: "Dual-energy X-ray absorptiometry for body composition", url: "https://pubmed.ncbi.nlm.nih.gov/12119999/", type: "Review" }
  ],
  'continuous_glucose_monitor': [
    { title: "Continuous Glucose Monitoring and Metabolic Control", url: "https://pubmed.ncbi.nlm.nih.gov/28550186/", type: "RCT" },
    { title: "Glycemic Variability and Oxidative Stress", url: "https://pubmed.ncbi.nlm.nih.gov/16616020/", type: "Experimental" }
  ],
  // Include the 10 new ones here too so they get references!
  'l_theanine': [
    { title: "L-theanine, a natural constituent in tea, and its effect on mental state", url: "https://pubmed.ncbi.nlm.nih.gov/18296328/", type: "Review" },
    { title: "Effects of L-Theanine Administration on Stress-Related Symptoms", url: "https://pubmed.ncbi.nlm.nih.gov/31623400/", type: "RCT" }
  ],
  'apigenin': [
    { title: "Chamomile: A herbal medicine of the past with bright future", url: "https://pubmed.ncbi.nlm.nih.gov/21132044/", type: "Review" },
    { title: "The effects of chamomile extract on sleep quality", url: "https://pubmed.ncbi.nlm.nih.gov/29154054/", type: "RCT" }
  ],
  'delay_caffeine': [
    { title: "Adenosine, Caffeine, and Sleep-Wake Regulation", url: "https://pubmed.ncbi.nlm.nih.gov/18088379/", type: "Review" }
  ],
  'mouth_taping': [
    { title: "Effect of mouth taping at night on snoring", url: "https://pubmed.ncbi.nlm.nih.gov/36181909/", type: "RCT" },
    { title: "Nasal Nitric Oxide and Regulation of Human Pulmonary Blood Flow", url: "https://pubmed.ncbi.nlm.nih.gov/24430489/", type: "Review" }
  ],
  'blue_light_blocking': [
    { title: "Blue-blocking glasses as an additive treatment for mania", url: "https://pubmed.ncbi.nlm.nih.gov/27040471/", type: "RCT" },
    { title: "Effects of blue-light blocking glasses on sleep and cognitive performance", url: "https://pubmed.ncbi.nlm.nih.gov/28841005/", type: "RCT" }
  ],
  'berberine': [
    { title: "Efficacy of berberine in patients with type 2 diabetes mellitus", url: "https://pubmed.ncbi.nlm.nih.gov/18442638/", type: "RCT" },
    { title: "Meta-analysis of the effect and safety of berberine in the treatment of type 2 diabetes", url: "https://pubmed.ncbi.nlm.nih.gov/23118793/", type: "Meta-Analysis" }
  ],
  'optic_flow': [
    { title: "EMDR therapy and the brain: The role of bilateral stimulation", url: "https://pubmed.ncbi.nlm.nih.gov/31201588/", type: "Review" }
  ],
  'ashwagandha_ksm66': [
    { title: "A prospective, randomized double-blind, placebo-controlled study of safety and efficacy of a high-concentration full-spectrum extract of ashwagandha root in reducing stress and anxiety", url: "https://pubmed.ncbi.nlm.nih.gov/23439798/", type: "RCT" },
    { title: "Adaptogenic and Anxiolytic Effects of Ashwagandha: A Double-Blind RCT", url: "https://pubmed.ncbi.nlm.nih.gov/31517876/", type: "RCT" }
  ],
  'rhodiola_rosea': [
    { title: "Rhodiola rosea in stress induced fatigue - a double blind cross-over study", url: "https://pubmed.ncbi.nlm.nih.gov/12725561/", type: "RCT" },
    { title: "The effects of Rhodiola rosea on physical performance", url: "https://pubmed.ncbi.nlm.nih.gov/25624699/", type: "Review" }
  ],
  'glycine_3g': [
    { title: "The effects of glycine on subjective daytime performance in partially sleep-restricted healthy volunteers", url: "https://pubmed.ncbi.nlm.nih.gov/22293292/", type: "RCT" },
    { title: "Glycine ingestion improves subjective sleep quality", url: "https://pubmed.ncbi.nlm.nih.gov/22529837/", type: "Experimental" }
  ]
};

async function backfill() {
  for (const [id, refs] of Object.entries(referencesMap)) {
    const { error } = await supabase
      .from('modalities')
      .update({ scientific_references: refs })
      .eq('id', id);

    if (error) {
      console.error(`Failed to update ${id}:`, error.message);
    } else {
      console.log(`Updated references for ${id}`);
    }
  }
}

backfill();
