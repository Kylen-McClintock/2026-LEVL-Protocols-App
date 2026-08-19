export const MODALITY_CIRCADIAN_TIPS: Record<string, string> = {
  // Sleep & Nervous System
  'magnesium': 'Magnesium Bisglycinate crosses the BBB to elevate GABA; taking 30–60 mins pre-bed minimizes nocturnal cortisol spikes and enhances deep NREM slow-wave sleep.',
  'magnesium bisglycinate': 'Magnesium Bisglycinate crosses the BBB to elevate GABA; taking 30–60 mins pre-bed minimizes nocturnal cortisol spikes and enhances deep NREM sleep.',
  'magnesium l-threonate': 'L-Threonate rapidly penetrates brain tissue; administer 1 hour before bed to support synaptic plasticity, N-methyl-D-aspartate (NMDA) signaling, and deep sleep density.',
  'apigenin': 'Apigenin binds to central GABA-A receptors and inhibits CD38 to preserve NAD+; take 30-45 minutes before bed.',
  'glycine': '3g of Glycine taken 60 mins before bed promotes peripheral vasodilation to lower core body temperature, accelerating sleep onset latency and improving REM quality.',
  'l-theanine': 'Promotes alpha brainwave generation (8–12 Hz). Pair with morning coffee to blunt jitteriness/vasoconstriction, or take 200mg pre-bed for calm sleep without sedation.',
  'ashwagandha': 'Blunts evening cortisol awakening response (CAR). Best taken 1-2 hours before bed or late afternoon to quiet HPA-axis hyperactivation.',
  'phosphatidylserine': 'Attenuates ACTH-stimulated cortisol secretion; administer post-workout or evening to reduce systemic stress hormones before sleep.',

  // NAD+ & Longevity Interventions
  'nmn': 'Endogenous NAD+ levels follow a strict circadian rhythm peaking early in the day; morning administration synchronizes Sirtuin-1 (SIRT1) metabolic gene expression.',
  'nicotinamide mononucleotide': 'Endogenous NAD+ levels follow a strict circadian rhythm peaking early in the day; morning administration synchronizes Sirtuin-1 (SIRT1) metabolic gene expression.',
  'nr': 'Take in the morning with breakfast to align with the peripheral liver circadian clock and optimize mitochondrial SIRT3 activity.',
  'fisetin': 'High-dose senolytic protocol: take on 2 consecutive days with fat (EVOO) for lymphatic absorption; space away from daily antioxidants to allow senescent cell clearance.',
  'quercetin': 'Pair with healthy fats at breakfast/lunch to maximize bio-availability and synergize with senolytic protocols.',
  'sulforaphane': 'Up-regulates Nrf2 phase II detoxification enzymes; take in the morning to arm cellular antioxidant defenses prior to daily oxidative stressors.',

  // Metabolic & Glucose Regulation
  'berberine': 'Potent AMPK activator; administer 10-15 minutes before your largest carbohydrate-dense meal to suppress postprandial glucose spikes and gluconeogenesis.',
  'metformin': 'Take with evening dinner to curb overnight hepatic gluconeogenesis and lower fasting blood glucose.',
  'creatine': 'Post-workout administration with carbohydrates enhances skeletal muscle glycogen resynthesis and cellular uptake via insulin-mediated GLUT4 transporters.',
  'omega-3': 'Always ingest with your largest meal containing dietary lipids to optimize micellar emulsification and EPA/DHA phospholipid membrane insertion.',
  'omega 3': 'Always ingest with your largest meal containing dietary lipids to optimize micellar emulsification and EPA/DHA phospholipid membrane insertion.',
  'fish oil': 'Always ingest with your largest meal containing dietary lipids to optimize micellar emulsification and EPA/DHA phospholipid membrane insertion.',

  // Vitamins & Minerals
  'vitamin d3': 'Fat-soluble D3 suppresses pineal melatonin secretion; take strictly with morning or lunch fat-containing meals to prevent circadian sleep disruption.',
  'vitamin d3 + k2': 'Fat-soluble D3 suppresses pineal melatonin secretion; take strictly with morning or lunch fat-containing meals to prevent circadian sleep disruption.',
  'b-complex': 'Essential for NAD+ synthesis and SAMe methylation cycles; take in the morning to prevent vivid sleep disruption and evening restlessness.',
  'methylated b12': 'Methylcobalamin supports dopamine and SAMe production; administer upon waking to boost alertness and preserve melatonin production at night.',
  'zinc': 'Administer in the evening with dinner (away from iron and calcium) to support immune cell synthesis and nocturnal anabolic hormone output.',

  // Energy & Nootropics
  'coq10': 'Essential mitochondrial electron transport catalyst; take in the morning or mid-day with fat to avoid mild nocturnal energy stimulation.',
  'ubiquinol': 'Take with morning breakfast for optimal lipid absorption and cellular ATP generation throughout the day.',
  'alpha-gpc': 'Acetylcholine precursor; take 30-45 mins pre-workout or during morning deep work. Avoid evening use to prevent REM sleep latency delay.',
  'huperzine': 'Acetylcholinesterase inhibitor; take in the morning or early afternoon to enhance cognitive focus without disturbing nocturnal REM sleep.',

  // Thermal & Exercise Interventions
  'cold plunge': 'Søberg Principle: Avoid cold water immersion within 4 hours post-resistance training to preserve mTOR hypertrophy; best done AM to boost dopamine.',
  'cold therapy': 'Søberg Principle: Avoid cold water immersion within 4 hours post-resistance training to preserve mTOR hypertrophy; best done AM to boost dopamine.',
  'sauna': 'Evening heat exposure elevates heat shock proteins (HSP70) and triggers a post-sauna core temperature drop that naturally induces deep sleep.',
  'infrared sauna': 'Evening heat exposure elevates heat shock proteins (HSP70) and triggers a post-sauna core temperature drop that naturally induces deep sleep.',
  'red light therapy': '660nm/850nm NIR light stimulates Cytochrome c Oxidase; apply in morning or early afternoon to boost mitochondrial ATP without blunting melatonin.',
  'zone 2 cardio': 'Morning or early afternoon Zone 2 mitochondrial training maximizes fatty acid oxidation while safeguarding nocturnal HRV recovery.',
  'fasting': 'Early time-restricted feeding (eTRF, 8 AM - 4 PM) enhances autophagy and insulin sensitivity compared to late-evening eating windows.'
}

export function getCircadianTipForModality(modalityName?: string, category?: string): string {
  if (!modalityName) return 'Aligning timing with your natural circadian rhythm optimizes cellular absorption and physiological efficacy.'

  const lowerName = modalityName.toLowerCase().trim()
  
  // Exact match or substring match in dictionary
  for (const [key, tip] of Object.entries(MODALITY_CIRCADIAN_TIPS)) {
    if (lowerName.includes(key)) {
      return tip
    }
  }

  // Category fallbacks
  const lowerCat = (category || '').toLowerCase()
  if (lowerCat.includes('sleep') || lowerCat.includes('relax')) {
    return 'Take 30–60 minutes prior to bedtime to sync with pineal melatonin synthesis and promote parasympathetic nervous system tone.'
  }
  if (lowerCat.includes('energy') || lowerCat.includes('nootropic') || lowerCat.includes('focus')) {
    return 'Administer in the morning or early afternoon to optimize cognitive neurotransmitters without disrupting nocturnal sleep architecture.'
  }
  if (lowerCat.includes('metabolic') || lowerCat.includes('glucose')) {
    return 'Pair with your largest meal of the day to optimize nutrient partitioning, GLUT4 translocation, and postprandial glycemic control.'
  }

  return 'Pairing with breakfast optimizes gut transport, while pre-bed windows maximize parasympathetic nocturnal recovery.'
}
