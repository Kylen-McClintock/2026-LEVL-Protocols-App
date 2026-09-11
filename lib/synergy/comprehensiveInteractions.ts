export interface BiochemicalSynergyRule {
  id: string
  triggers: string[]
  targets: string[]
  type: 'bioavailability' | 'cofactor' | 'receptor' | 'cellular_pathway' | 'contrast_hormesis'
  headline: string
  rationale: string
  actionableTip: string
  pubmedUrl: string
  targetPathway?: string
  clinicalEffectDelta?: string
}

export interface BiochemicalConflictRule {
  id: string
  triggers: string[]
  targets: string[]
  type: 
    | 'hypertrophy_blunting' 
    | 'circadian_disruption' 
    | 'absorption_competition' 
    | 'methylation_depletion' 
    | 'glycemic_shock' 
    | 'antagonistic_receptors'
    | 'mitochondrial_blunting'
    | 'autophagy_anabolism_antagonism'
    | 'serotonin_toxicity_risk'
    | 'autonomic_overreaching'
  severity: 'timing' | 'moderate' | 'critical'
  headline: string
  rationale: string
  mitigationRecommendation: string
  autoResolutionTiming: {
    recommendedTimeSlot?: string
    spacingHours?: number
    description: string
  }
  pubmedUrl: string
  targetPathway?: string
  clinicalEffectDelta?: string
}

export const COMPREHENSIVE_SYNERGY_RULES: BiochemicalSynergyRule[] = [
  // 1. Vitamin D3 + Vitamin K2 (MK-7) + Magnesium
  {
    id: 'd3_k2_mg',
    triggers: ['vitamind', 'vitamind3', 'd3', 'cholecalciferol', 'rhondavitamind3k2'],
    targets: ['vitamink', 'vitamink2', 'mk7', 'menaquinone', 'magnesium', 'magnesiumglycinate', 'magnesiumlthreonate', 'magnesiumbreakthrough'],
    type: 'cofactor',
    headline: 'Arterial Protection & Bone Mineralization (D3 + K2 + Mg)',
    rationale: 'Vitamin D3 increases intestinal calcium absorption. Vitamin K2 (MK-7) activates osteocalcin and Matrix Gla Protein (MGP) to direct circulating calcium into bone crystals and prevent vascular calcification. Magnesium is a required enzymatic cofactor for converting 25(OH)D into active 1,25(OH)2D.',
    actionableTip: 'Take fat-soluble D3 and K2 together with a healthy fat source (e.g. EVOO or avocado) at breakfast or lunch.',
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/28938164/'
  },

  // 2. Vitamin K2 (MK-7) -> D3
  {
    id: 'k2_to_d3',
    triggers: ['vitamink', 'vitamink2', 'mk7', 'menaquinone', 'vitamink2mk4'],
    targets: ['vitamind', 'vitamind3', 'd3', 'magnesium', 'magnesiumglycinate'],
    type: 'cofactor',
    headline: 'Vascular Matrix Gla Protein Carboxylation',
    rationale: 'Carboxylates osteocalcin and MGP, ensuring that calcium absorbed via Vitamin D3 is integrated into skeletal bone rather than accumulating as arterial plaque.',
    actionableTip: 'Co-ingest with Vitamin D3 and dietary lipids.',
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/28938164/'
  },

  // 3. NMN / NR / NAD+ Precursors + TMG (Betaine)
  {
    id: 'nmn_tmg',
    triggers: ['nmn', 'nicotinamidemononucleotide', 'nr', 'nicotinamideriboside', 'nad', 'nadivtherapy'],
    targets: ['tmg', 'betaine', 'trimethylglycine', 'breckamthfrmethylationsupport', 'resveratrol', 'apigenin', 'pterostilbene'],
    type: 'cellular_pathway',
    headline: 'Methyl Donor Buffer for NAD+ Clearance & Sirtuin Flux',
    rationale: 'Hepatic clearance of nicotinamide via NNMT requires methyl groups from S-adenosylmethionine (SAMe). TMG replenishes methyl pools, preventing elevated homocysteine. Sirtuin deacetylases (SIRT1) require high cellular NAD+ to deacetylate longevity targets stimulated by Resveratrol.',
    actionableTip: 'Maintain a 1:1 milligram ratio of TMG (Betaine) alongside your morning NMN dose.',
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/30349075/'
  },

  // 4. GlyNAC (Glycine + NAC) Glutathione Precursor Triad
  {
    id: 'glynac_stack',
    triggers: ['glycine', 'glycine3g', 'glynac', 'glynacglutathionepulse'],
    targets: ['nac', 'nacetylcysteine', 'glutathione', 'alphalipoicacid'],
    type: 'cellular_pathway',
    headline: 'Intracellular Glutathione (GSH) Synthesis Triad',
    rationale: 'Glycine and Cysteine (from NAC) are the rate-limiting substrates for gamma-glutamylcysteine synthetase. Clinical trials demonstrate GlyNAC supplementation restores intracellular glutathione pools, corrects mitochondrial fuel oxidation, and reduces oxidative stress in human aging.',
    actionableTip: 'Take Glycine and NAC together in divided doses or before sleep.',
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/33783414/'
  },

  // 5. NAC -> Glycine
  {
    id: 'nac_to_glycine',
    triggers: ['nac', 'nacetylcysteine'],
    targets: ['glycine', 'glycine3g', 'glynac', 'alphalipoicacid', 'sulforaphane'],
    type: 'cellular_pathway',
    headline: 'Mitochondrial Redox & Hepatic Glutathione Generation',
    rationale: 'Supplies cysteine to drive glutathione synthesis when paired with glycine, providing direct mitochondrial inner-membrane antioxidant protection.',
    actionableTip: 'Pair with 3g Glycine for optimal GlyNAC clinical ratio.',
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/33783414/'
  },

  // 6. Resistance Training + Creatine Monohydrate + Protein / Leucine
  {
    id: 'strength_creatine_leucine',
    triggers: ['resistancetraining', 'strengthtraining', 'weightlifting', 'hypertrophy', 'attiacentenarianstrength', 'bfrtraining'],
    targets: ['creatine', 'creatinemonohydrate', 'wheyprotein', 'leucine', 'attiaproteindistribution', 'magnesium'],
    type: 'cellular_pathway',
    headline: 'Phosphocreatine Resynthesis & mTORC1 Hypertrophy',
    rationale: 'Mechanical tension activates localized mTORC1 and ribosomal biogenesis. Intramuscular phosphocreatine rapidly donates phosphate groups to ADP for ATP regeneration during heavy sets, while post-workout leucine triggers satellite cell muscle protein synthesis.',
    actionableTip: 'Dose 5g Creatine Monohydrate daily with a protein or carbohydrate meal for insulin-mediated muscular uptake.',
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/12701815/'
  },

  // 7. Creatine -> Resistance Training
  {
    id: 'creatine_to_lift',
    triggers: ['creatine', 'creatinemonohydrate'],
    targets: ['resistancetraining', 'strengthtraining', 'attiacentenarianstrength', 'bfrtraining', 'vo2maxhiittraining', 'rhondahiitsprints'],
    type: 'cellular_pathway',
    headline: 'High-Energy Phosphagen System Saturation',
    rationale: 'Maximizes cellular ATP buffers in skeletal muscle and brain neurons, increasing power output and high-threshold motor unit recruitment.',
    actionableTip: 'Consistent daily timing ensures chronic intramuscular saturation.',
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/12701815/'
  },

  // 8. Taurine + Magnesium Glycinate + Glycine (GABAergic CNS Calming)
  {
    id: 'taurine_mg_gaba',
    triggers: ['taurine'],
    targets: ['magnesium', 'magnesiumglycinate', 'magnesiumlthreonate', 'glycine', 'glycine3g', 'ltheanine', 'apigenin', 'caffeine', 'zone2cardio'],
    type: 'receptor',
    headline: 'GABA-A Agonism & Autonomic Sympathetic Downregulation',
    rationale: 'Taurine acts as an endogenous agonist at GABA-A and glycine receptors, counteracting glutamate excitotoxicity. When stacked with Magnesium Glycinate, it lowers systemic vascular resistance, drops resting heart rate, and smooths caffeine vasoconstriction.',
    actionableTip: 'Take 1,000–2,000mg with Magnesium Glycinate 60 minutes before bed.',
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/23170260/'
  },

  // 9. Magnesium (Glycinate / L-Threonate) -> Sleep & Calming
  {
    id: 'mg_sleep_stack',
    triggers: ['magnesium', 'magnesiumglycinate', 'magnesiumlthreonate', 'magnesiumbreakthrough'],
    targets: ['taurine', 'glycine', 'glycine3g', 'ltheanine', 'apigenin', 'melatonin', 'darkcoolsleepenvironment', 'walker65fthermaldrop'],
    type: 'receptor',
    headline: 'NMDA Receptor Blockade & Slow-Wave Sleep Potentiation',
    rationale: 'Blocks excitatory NMDA receptors while allosterically facilitating GABA transmission, lowering core temperature and promoting Stage 3/4 deep delta-wave sleep.',
    actionableTip: 'Administer 200–400mg elemental magnesium 60–90 minutes before bedtime.',
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/23853635/'
  },

  // 10. Caffeine + L-Theanine (1:2 Balanced Focus Stack)
  {
    id: 'caffeine_theanine',
    triggers: ['caffeine', 'coffee', 'delaycaffeine'],
    targets: ['ltheanine', 'taurine'],
    type: 'receptor',
    headline: 'Smooth Alpha-Wave Cognitive Focus (No Jitters)',
    rationale: 'L-Theanine crosses the blood-brain barrier and increases alpha-wave neuro-oscillations while blocking peripheral beta-adrenergic overstimulation. This delivers the alertness of caffeine without elevated blood pressure, jitters, or anxiety.',
    actionableTip: 'Consume 100mg Caffeine with 200mg L-Theanine (1:2 ratio).',
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/18681988/'
  },

  // 11. Hyperthermic Sauna + Cold Plunge (Contrast Hormesis & HSP70/RBM3)
  {
    id: 'sauna_cold_contrast',
    triggers: ['hyperthermicsauna', 'sauna', 'finnishsauna', 'rhondahyperthermicsauna', 'infraredsauna', 'saunaexposure'],
    targets: ['coldwaterimmersion', 'coldplunge', 'icebath', 'wimhofcoldshockimmersion', 'zone2cardio', 'hydrationelectrolytes'],
    type: 'contrast_hormesis',
    headline: 'HSP70 Cellular Chaperoning & Lymphatic Vascular Pumping',
    rationale: 'High heat (174°F+) induces Heat Shock Proteins (HSP70) to refold denatured proteins and stimulates massive endothelial shear stress. Alternating with cold immersion triggers alternating vasoconstriction and vasodilation, clearing metabolic byproducts and boosting norepinephrine by up to 530%.',
    actionableTip: 'Follow the Søberg Principle: If seeking alertness, end on cold. If preparing for evening sleep, end on sauna followed by natural warm down.',
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/25705824/'
  },

  // 12. Cold Plunge -> Contrast Hormesis
  {
    id: 'cold_to_sauna',
    triggers: ['coldwaterimmersion', 'coldplunge', 'icebath', 'wimhofcoldshockimmersion'],
    targets: ['hyperthermicsauna', 'sauna', 'rhondahyperthermicsauna', 'saunaexposure', 'morningsunlight', 'cyclicbreathwork'],
    type: 'contrast_hormesis',
    headline: 'Cold Shock Protein (RBM3) & Dopamine Potentiation',
    rationale: 'Sustained cold immersion elevates circulating norepinephrine and dopamine by 250% for up to 3 hours while activating Brown Adipose Tissue (BAT) mitochondrial uncoupling (UCP1).',
    actionableTip: 'Immerse for 2–3 minutes at 50°F–55°F (10°C–13°C), aiming for 11 minutes total weekly.',
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/17929187/'
  },

  // 13. Red Light Photobiomodulation + Methylene Blue / CoQ10
  {
    id: 'pbm_mitochondrial_stack',
    triggers: ['redlight', 'redlighttherapy', 'redlightphotobiomodulation', 'photobiomodulation', 'blueprintredlighttherapy'],
    targets: ['methyleneblue', 'coq10', 'ubiquinol', 'hyaluronicacid'],
    type: 'cellular_pathway',
    headline: 'Cytochrome c Oxidase Photon Absorption & ATP Velocity',
    rationale: 'Red (660nm) and NIR (850nm) photons displace inhibitory nitric oxide from Cytochrome c Oxidase in mitochondrial Complex IV, accelerating electron transfer. Methylene blue acts as an alternative electron acceptor, generating peak cellular ATP output.',
    actionableTip: 'Perform in early morning for circadian cortisol rhythm entrainment, 6–12 inches from clean skin.',
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/28070154/'
  },

  // 14. Post-Meal Walk / Soleus Pushups + Berberine (Glucose Disposal)
  {
    id: 'postmeal_berberine_gda',
    triggers: ['postmealwalk', 'soleuspushups', 'meanssoleuspushupspostmealwalk', 'meansberberinegda'],
    targets: ['berberine', 'berberinehcl', 'applecidervinegar', 'acv', 'intermittentfasting168', 'meansmacrosequencing'],
    type: 'cellular_pathway',
    headline: 'Non-Insulin Mediated GLUT4 Translocation & Glycemic Blunting',
    rationale: 'Light postprandial muscular contraction translocates GLUT4 glucose transporters to muscle cell membranes without requiring insulin spikes. Combined with Berberine-mediated AMPK activation, this blunts glucose area-under-the-curve (AUC) by up to 35%.',
    actionableTip: 'Begin a 10-minute walk within 30 minutes after your largest carbohydrate meal.',
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/36029785/'
  },

  // 15. Sulforaphane + Mustard Seed (Myrosinase)
  {
    id: 'sulforaphane_myrosinase',
    triggers: ['sulforaphane'],
    targets: ['mustardseed', 'myrosinase', 'selenium', 'glutathione', 'nac'],
    type: 'bioavailability',
    headline: 'Enzymatic Myrosinase Conversion & Nrf2 Phase II Detox',
    rationale: 'Glucoraphanin requires the active enzyme myrosinase to convert into bioactive sulforaphane. Sulforaphane binds Keap1 to release Nrf2, inducing hundreds of Phase II cytoprotective and antioxidant genes.',
    actionableTip: 'Add a pinch of raw mustard seed powder to cooked cruciferous vegetables or supplements to supply active myrosinase.',
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/30372361/'
  },

  // 16. Fisetin / Quercetin + Extra Virgin Olive Oil (Lipid Carrier)
  {
    id: 'senolytic_evoo_transport',
    triggers: ['fisetin', 'quercetin', 'longofisetinquercetinsenolyticpulse', 'resveratrol'],
    targets: ['extravirginoliveoil', 'evoo', 'omega3', 'epadhaomega3', 'healthyfats'],
    type: 'bioavailability',
    headline: 'Lipophilic Senolytic Bioavailability Micelle Transport',
    rationale: 'Polyphenolic senolytics have extremely low aqueous solubility (<5%). Co-ingesting with 1 tablespoon of high-polyphenol EVOO forms mixed micelles in the gut, boosting intestinal lymphatic absorption by 500%.',
    actionableTip: 'Take senolytic pulses with 1 tablespoon of high-polyphenol Extra Virgin Olive Oil.',
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/30279143/'
  },

  // 17. Alpha-GPC + Uridine + DHA (Mr. Happy Synaptogenesis Stack)
  {
    id: 'mr_happy_stack',
    triggers: ['alphagpc', 'alpha_gpc', 'cdpcholine'],
    targets: ['uridine', 'dha', 'epadhaomega3', 'omega3', 'ltheanine'],
    type: 'cellular_pathway',
    headline: 'Kennedy Pathway Phospholipid & Dendritic Spine Synthesis',
    rationale: 'Supplies rate-limiting choline, pyrimidine nucleotide (uridine), and structural fatty acids (DHA) to fuel phosphatidylcholine synthesis and accelerate synaptogenesis and dopamine receptor density.',
    actionableTip: 'Stack Alpha-GPC (300mg) with Omega-3 DHA (500mg) and Uridine in the morning.',
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/18655815/'
  },

  // 18. CoQ10 (Ubiquinol) + Shilajit (Fulvic Acid) + PQQ
  {
    id: 'coq10_shilajit_pqq',
    triggers: ['coq10', 'ubiquinol'],
    targets: ['shilajit', 'pqq', 'zone2cardio', 'extravirginoliveoil'],
    type: 'cellular_pathway',
    headline: 'Mitochondrial Biogenesis & Electron Transport Protection',
    rationale: 'Fulvic acid in Shilajit stabilizes CoQ10 in its active reduced Ubiquinol state within mitochondrial membranes. PQQ activates PGC-1α to stimulate new mitochondrial biogenesis, while CoQ10 powers existing electron transfer.',
    actionableTip: 'Take with morning healthy fats for optimal lipophilic absorption.',
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/19478441/'
  },

  // 19. Citrulline / Inorganic Nitrate + Exercise (eNOS Nitric Oxide Surge)
  {
    id: 'citrulline_nitrate_no',
    triggers: ['citrulline', 'inorganicnitrate', 'dayspringinorganicnitratecitrulline', 'beetroot'],
    targets: ['zone2cardio', 'vo2maxhiittraining', 'rhondahiitsprints', 'resistancetraining'],
    type: 'cellular_pathway',
    headline: 'Endothelial Nitric Oxide & Mitochondrial Oxygen Efficiency',
    rationale: 'L-Citrulline bypasses hepatic arginase to elevate plasma L-Arginine, driving endothelial Nitric Oxide Synthase (eNOS) vasodilation and lowering the oxygen cost of submaximal exercise.',
    actionableTip: 'Consume 6g L-Citrulline or beetroot nitrate 45–60 minutes prior to training.',
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/20386132/'
  },

  // 20. Lithium Orotate + Omega-3 Fatty Acids
  {
    id: 'lithium_omega3',
    triggers: ['lithiumorotate', 'lithium'],
    targets: ['omega3', 'epadhaomega3', 'magnesium', 'glycine'],
    type: 'cellular_pathway',
    headline: 'GSK-3beta Inhibition & BDNF Neurogenesis',
    rationale: 'Micro-dose lithium (1–5mg elemental) inhibits glycogen synthase kinase-3beta (GSK-3beta), upregulating Brain-Derived Neurotrophic Factor (BDNF) and neuroplasticity alongside cell membrane DHA.',
    actionableTip: 'Take micro-dose lithium with evening meal or magnesium.',
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/24095892/'
  },

  // 21. Ashwagandha (KSM-66) + Rhodiola Rosea
  {
    id: 'adaptogen_hpa_stack',
    triggers: ['ashwagandha', 'ashwagandhaksm66'],
    targets: ['rhodiolarosea', 'ltheanine', 'magnesiumglycinate'],
    type: 'receptor',
    headline: 'HPA-Axis Cortisol Modulation & Stress Resilience',
    rationale: 'Withanolides in Ashwagandha downregulate overactive hypothalamic-pituitary-adrenal (HPA) axis signaling, reducing serum cortisol by up to 30% without daytime sedation when balanced with Rhodiola salidrosides.',
    actionableTip: 'Take Ashwagandha in the late afternoon or evening with dinner.',
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/23439798/'
  },

  // 22. Intermittent Fasting + Hydration Electrolytes
  {
    id: 'fasting_electrolytes',
    triggers: ['intermittentfasting168', 'intermittentfasting186', 'intermittentfasting204', 'omadfasting', 'waterfast24h', 'prolongedautophagyfast72h'],
    targets: ['hydrationelectrolytes', 'sodium', 'potassium', 'magnesium', 'blackcoffee', 'greentea'],
    type: 'bioavailability',
    headline: 'Renal Sodium Sparing & Cellular Autophagy Potentiation',
    rationale: 'Fasting drops insulin, triggering renal natriuresis (sodium wasting). Supplementing unflavored electrolytes sustains vascular tone, prevents fatigue/cramps, and supports autophagy flux.',
    actionableTip: 'Sip unflavored sodium and potassium electrolytes in water throughout your morning fast.',
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/29086496/',
    targetPathway: 'Renal ENaC Transporters & Autophagy Flux',
    clinicalEffectDelta: 'Prevents vascular volume depletion & fatigue'
  },

  // 23. Fat-Soluble Vitamins (D3, K2, CoQ10, Curcumin) + First Meal / Dietary Lipids
  {
    id: 'fat_soluble_vitamins_meal',
    triggers: ['vitamind', 'vitamind3', 'd3', 'vitamink', 'vitamink2', 'mk7', 'coq10', 'ubiquinol', 'astaxanthin'],
    targets: ['extravirginoliveoil', 'evoo', 'omega3', 'epadhaomega3', 'healthyfats', 'firstmeal', 'lunch', 'dinner'],
    type: 'bioavailability',
    headline: 'Lipid Micellar Transport for Fat-Soluble Micronutrients',
    rationale: 'Vitamins D3, K2, CoQ10, and carotenoids are highly hydrophobic and require dietary bile acids and mixed micelle formation for enterocyte uptake. Ingestion during an empty-stomach fast reduces absorption by up to 50% compared to co-ingestion with a lipid-containing meal.',
    actionableTip: 'Schedule fat-soluble vitamins with your First Meal or a meal containing healthy fats (EVOO, eggs, avocado).',
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/24500150/',
    targetPathway: 'Intestinal Mixed Micelle Diffusion',
    clinicalEffectDelta: '+30% to +50% Higher Plasma 25(OH)D & Tissue Absorption'
  },

  // 24. Curcumin + Piperine (Black Pepper Extract)
  {
    id: 'curcumin_piperine',
    triggers: ['curcumin', 'turmeric'],
    targets: ['piperine', 'blackpepper', 'bioperine', 'extravirginoliveoil'],
    type: 'bioavailability',
    headline: 'Hepatic Glucuronidation Blockade & Curcumin Bioavailability Surge',
    rationale: 'Curcumin undergoes rapid intestinal sulfation and hepatic glucuronidation, yielding almost zero free plasma curcumin. 20mg Piperine temporarily inhibits UDP-glucuronosyltransferase, boosting bioavailability by 2,000%.',
    actionableTip: 'Ensure your Curcumin extract includes 20mg Piperine (BioPerine) or take with black pepper and dietary fats.',
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/9619120/',
    targetPathway: 'UDP-Glucuronosyltransferase (UGT) Inhibition',
    clinicalEffectDelta: '+2,000% Bioavailability & Active Serum Levels'
  },

  // 25. Collagen Peptides + Vitamin C (Prolyl Hydroxylase Cofactor)
  {
    id: 'collagen_vitc_tendon',
    triggers: ['collagen', 'collagenpeptides'],
    targets: ['vitaminc', 'ascorbicacid'],
    type: 'cofactor',
    headline: 'Prolyl 4-Hydroxylase Triple-Helix Tendon Synthesis',
    rationale: 'Vitamin C is an obligatory electron donor cofactor for prolyl and lysyl hydroxylase, which cross-link the collagen triple helix. Ingesting 15g gelatin/collagen with 50mg Vitamin C 30–60 minutes before loading doubles tendon amino acid uptake and collagen cross-linking.',
    actionableTip: 'Consume 10–15g Collagen Peptides with 50–100mg Vitamin C 45 minutes prior to resistance training or joint rehabilitation.',
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/27927634/',
    targetPathway: 'Prolyl 4-Hydroxylase Cross-Linking',
    clinicalEffectDelta: '+100% Ligamentous Collagen Synthesis Rate'
  },

  // 26. Fasted Zone 2 Cardio + Electrolytes
  {
    id: 'fasted_zone2_electrolytes',
    triggers: ['zone2cardio'],
    targets: ['hydrationelectrolytes', 'sodium', 'potassium', 'waterfast24h', 'intermittentfasting168'],
    type: 'cellular_pathway',
    headline: 'Fatty Acid Beta-Oxidation & Plasma Volume Maintenance',
    rationale: 'Fasted Zone 2 training stimulates intramuscular CPT-1 and maximizes mitochondrial lipid oxidation while insulin is suppressed. Supplementing sodium and water prevents hemoconcentration and elevates parasympathetic recovery speed post-session.',
    actionableTip: 'Hydrate with 500ml water and electrolytes 15 minutes before fasted Zone 2 cardio.',
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/29086496/',
    targetPathway: 'Carnitine Palmitoyltransferase-1 (CPT-1) & Intravascular Hydration',
    clinicalEffectDelta: '+25% Peak Fat Oxidation & Reduced Cardiac Drift'
  }
]

export const COMPREHENSIVE_CONFLICT_RULES: BiochemicalConflictRule[] = [
  // 1. Cold Plunge <4h Post-Hypertrophy Strength Training
  {
    id: 'cold_vs_strength',
    triggers: ['coldwaterimmersion', 'coldplunge', 'icebath', 'wimhofcoldshockimmersion'],
    targets: ['resistancetraining', 'strengthtraining', 'weightlifting', 'hypertrophy', 'attiacentenarianstrength'],
    type: 'hypertrophy_blunting',
    severity: 'timing',
    headline: 'Cold Exposure Blunts Post-Lift Muscle Hypertrophy Signaling',
    rationale: 'Cold water immersion (<55°F) within 4 hours post-lifting acutely constricts blood flow, blunts localized COX-2 inflammatory signaling, and suppresses p70S6K and satellite cell activation, significantly reducing long-term muscle mass and strength adaptations.',
    mitigationRecommendation: 'Separate cold water immersion by at least 4 hours after resistance training, or perform cold plunges on dedicated cardio or rest days.',
    autoResolutionTiming: {
      spacingHours: 4,
      description: 'Auto-schedule Cold Plunge 4+ hours after resistance training or on rest days'
    },
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/31513336/'
  },

  // 2. High-Dose Antioxidants (Vitamin C >1g / Vit E) Post-Exercise
  {
    id: 'vitc_vs_workout_ros',
    triggers: ['vitaminc', 'vitamine'],
    targets: ['resistancetraining', 'strengthtraining', 'zone2cardio', 'vo2maxhiittraining', 'rhondahiitsprints'],
    type: 'hypertrophy_blunting',
    severity: 'timing',
    headline: 'High-Dose Antioxidants Blunt Exercise Hormetic ROS Adaptations',
    rationale: 'Exercise creates an acute pulse of reactive oxygen species (ROS) that acts as an essential molecular messenger to upregulate endogenous SOD, Catalase, and mitochondrial biogenesis (PGC-1α). High-dose Vitamin C (>1,000mg) or Vitamin E immediately post-workout scavenges these signals, blunting training adaptations.',
    mitigationRecommendation: 'Separate high-dose Vitamin C / E by at least 2–3 hours from endurance and resistance exercise.',
    autoResolutionTiming: {
      spacingHours: 3,
      description: 'Separate high-dose antioxidants 3 hours away from workout window'
    },
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/24458514/'
  },

  // 3. Late Afternoon / Evening Caffeine (<10h Before Sleep)
  {
    id: 'late_caffeine_sleep',
    triggers: ['caffeine', 'coffee', 'preworkout'],
    targets: ['darkcoolsleepenvironment', 'sleep', 'blueprintsleeparchitecture', 'walker65fthermaldrop'],
    type: 'circadian_disruption',
    severity: 'timing',
    headline: 'Adenosine Receptor Blockade Degrades Slow-Wave Deep Sleep',
    rationale: 'Caffeine has an elimination half-life of 5–7 hours. Ingesting caffeine within 8–10 hours of bedtime blocks adenosine A1/A2A receptors in the ventrolateral preoptic nucleus (VLPO), significantly reducing Stage 3/4 slow-wave deep sleep and disrupting circadian REM architecture.',
    mitigationRecommendation: 'Enforce a strict caffeine cutoff 10 hours prior to bedtime (before 12:00 PM for a 10:00 PM bedtime).',
    autoResolutionTiming: {
      recommendedTimeSlot: 'Morning (before 12:00 PM)',
      description: 'Shift caffeine to morning (10h before planned sleep)'
    },
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/24235903/'
  },

  // 4. Iron + Calcium / Coffee / Zinc Competition
  {
    id: 'iron_calcium_zinc_competition',
    triggers: ['hemeiron', 'iron'],
    targets: ['calcium', 'zinc', 'caffeine', 'coffee'],
    type: 'absorption_competition',
    severity: 'timing',
    headline: 'DMT-1 Transporter Competition & Tannin Chelation',
    rationale: 'Iron and Calcium/Zinc compete directly for the Divalent Metal Transporter-1 (DMT1) in the intestinal brush border, reducing iron absorption by up to 60%. Polyphenols and chlorogenic acid in coffee chelate iron into insoluble precipitates.',
    mitigationRecommendation: 'Take Iron with Vitamin C on an empty stomach or with a non-dairy meal; separate Calcium, Zinc, and coffee by at least 2 hours.',
    autoResolutionTiming: {
      spacingHours: 2,
      description: 'Separate Iron from Calcium, Zinc, and coffee by 2 hours'
    },
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/21462112/'
  },

  // 5. Zinc (>30mg) without Copper (Metallothionein Trapping)
  {
    id: 'zinc_without_copper',
    triggers: ['zinc'],
    targets: ['none'],
    type: 'absorption_competition',
    severity: 'moderate',
    headline: 'Chronic High-Dose Zinc Induces Copper Deficiency',
    rationale: 'High daily zinc doses (>30–50mg) induce intestinal metallothionein synthesis, which binds copper with higher affinity than zinc and blocks its mucosal transfer, potentially causing microcytic anemia and neutropenia.',
    mitigationRecommendation: 'Maintain a 15:1 Zinc to Copper ratio (e.g. 15–30mg Zinc with 1–2mg Copper).',
    autoResolutionTiming: {
      description: 'Pair high-dose zinc with 1–2mg copper'
    },
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/26085547/'
  },

  // 6. Prolonged Fasting + Refeed High-Glycemic Carbs (Insulin Shock)
  {
    id: 'fasting_refeed_carbs',
    triggers: ['intermittentfasting186', 'intermittentfasting204', 'omadfasting', 'waterfast24h', 'prolongedautophagyfast72h'],
    targets: ['highglycemicmeal', 'refinedsugars'],
    type: 'glycemic_shock',
    severity: 'moderate',
    headline: 'Insulin Surge & Gastrointestinal Refeeding Shock',
    rationale: 'During prolonged fasting, insulin secretion downregulates. Breaking a fast with high-glycemic carbohydrates triggers an acute insulin spike, reactive hypoglycemia, and gastrointestinal distress.',
    mitigationRecommendation: 'Break fasts with warm bone broth, healthy fats (EVOO, avocado), or light protein 30 minutes before complex carbohydrates.',
    autoResolutionTiming: {
      description: 'Break fast with bone broth or healthy fats first'
    },
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/29086496/'
  },

  // 7. Vitamin K2 (MK-7) + Warfarin / Coumadin Anticoagulant Antagonism
  {
    id: 'k2_warfarin_antagonism',
    triggers: ['vitamink', 'vitamink2', 'mk7', 'menaquinone'],
    targets: ['warfarin', 'coumadin', 'bloodthinner'],
    type: 'antagonistic_receptors',
    severity: 'critical',
    headline: 'Vitamin K Directly Antagonizes Warfarin Anticoagulation',
    rationale: 'Warfarin acts by inhibiting vitamin K epoxide reductase (VKOR). Exogenous Vitamin K supplementation directly bypasses this inhibition, altering Prothrombin Time (PT) and International Normalized Ratio (INR) clotting stability.',
    mitigationRecommendation: 'Patients on Warfarin must strictly consult their prescribing physician before taking supplemental Vitamin K.',
    autoResolutionTiming: {
      description: 'Contraindicated with Warfarin without clinical supervision'
    },
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/15984922/'
  },

  // 8. Late Evening Metabolic Meal / Alcohol (<3h Before Sleep)
  {
    id: 'late_meal_alcohol_sleep',
    triggers: ['latemeal', 'alcohol', 'heavy_dinner', 'latenightfood', 'wine', 'beer'],
    targets: ['sleep', 'blueprintsleeparchitecture', 'walker65fthermaldrop', 'darkcoolsleepenvironment'],
    type: 'circadian_disruption',
    severity: 'timing',
    headline: 'Metabolic Digestion & Alcohol Suppresses Core Thermal Drop',
    rationale: 'Digestive thermogenesis from late meals elevates nocturnal core body temperature by 0.5°F–1°F, preventing the physiological thermal drop necessary for deep slow-wave sleep. Alcohol metabolizes into acetaldehyde, fragmenting second-half REM sleep.',
    mitigationRecommendation: 'Enforce a 3-hour metabolic and alcohol cutoff before scheduled bedtime.',
    autoResolutionTiming: {
      spacingHours: 3,
      description: 'Finish eating and drinking 3 hours before sleep'
    },
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/26305626/'
  },

  // 9. Metformin + Zone 2 Aerobic Exercise (Complex I Blunting)
  {
    id: 'metformin_vs_zone2',
    triggers: ['metformin', 'glucophage'],
    targets: ['zone2cardio', 'vo2maxhiittraining', 'endurancetraining', 'cpet'],
    type: 'mitochondrial_blunting',
    severity: 'timing',
    headline: 'Metformin Blunts Mitochondrial Complex I Exercise Adaptations',
    rationale: 'Metformin reversibly inhibits mitochondrial Complex I in skeletal muscle. Co-administering Metformin immediately around aerobic exercise blunts the training-induced increase in whole-body VO2 max and whole-muscle mitochondrial respiration by approximately 50% in healthy individuals (MAST Study).',
    mitigationRecommendation: 'In non-diabetic longevity protocols, dose Metformin in the evening, separated by at least 4 hours from cardiovascular training sessions.',
    autoResolutionTiming: {
      spacingHours: 4,
      recommendedTimeSlot: 'Evening Stack (post-workout window)',
      description: 'Dose Metformin 4+ hours after endurance exercise or in the evening'
    },
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/30817791/'
  },

  // 10. Rapamycin + High-Leucine Protein / Whey (mTORC1 Antagonism)
  {
    id: 'rapamycin_vs_leucine',
    triggers: ['rapamycin', 'sirolimus'],
    targets: ['wheyprotein', 'leucine', 'essentialaminoacids', 'attiaproteindistribution'],
    type: 'autophagy_anabolism_antagonism',
    severity: 'timing',
    headline: 'High Leucine Antagonizes Rapamycin mTORC1 Autophagy Inhibition',
    rationale: 'Rapamycin inhibits mTORC1 by binding FKBP12. High circulating leucine and amino acids stimulate Sestrin2 to recruit mTORC1 to the lysosomal membrane via Rag GTPases, directly opposing the autophagic and geroprotective clearance induced by rapamycin pulses.',
    mitigationRecommendation: 'Take Rapamycin on a dedicated weekly fasting day; withhold high-leucine protein shakes and heavy resistance training for 24 hours post-dose.',
    autoResolutionTiming: {
      spacingHours: 24,
      recommendedTimeSlot: 'Weekly Pulse Fasting Window',
      description: 'Separate high-protein intake 24 hours away from weekly rapamycin pulse'
    },
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/31631026/'
  },

  // 11. Methylene Blue + SSRIs / SNRIs (Severe Serotonin Toxicity Risk)
  {
    id: 'methylene_blue_vs_ssri',
    triggers: ['methyleneblue', 'methylene_blue'],
    targets: ['sertraline', 'zoloft', 'escitalopram', 'lexapro', 'fluoxetine', 'prozac', 'citalopram', 'paroxetine', 'duloxetine', 'cymbalta', 'venlafaxine', 'ssri', 'snri'],
    type: 'serotonin_toxicity_risk',
    severity: 'critical',
    headline: 'Severe Serotonin Toxicity Risk via Potent MAO-A Inhibition',
    rationale: 'Methylene Blue is a potent, reversible Monoamine Oxidase A (MAO-A) inhibitor with IC50 in the nanomolar range. When combined with Serotonin Reuptake Inhibitors (SSRIs/SNRIs), it blocks serotonin degradation, precipitating life-threatening Central Serotonin Syndrome.',
    mitigationRecommendation: 'STRICT CONTRAINDICATION: Methylene Blue must never be combined with SSRIs, SNRIs, or serotonergic antidepressants without a 14-day clinical washout.',
    autoResolutionTiming: {
      description: 'Strict clinical contraindication — do not combine with serotonergic medications'
    },
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/21804245/'
  },

  // 12. Excessive Anaerobic HIIT Without Aerobic Mitochondrial Base
  {
    id: 'anaerobic_hiit_vs_zone2_base',
    triggers: ['vo2maxhiittraining', 'rhondahiitsprints', 'sprintintervals'],
    targets: ['zone2cardio'],
    type: 'autonomic_overreaching',
    severity: 'moderate',
    headline: 'Excessive Anaerobic Density Without Aerobic Mitochondrial Base',
    rationale: 'Daily high-intensity interval training (>90% HRmax) without a foundational Zone 2 aerobic base causes chronic sympathetic tone elevation, impaired parasympathetic reactivation, suppressed nocturnal HRV, and mitochondrial uncoupling overload.',
    mitigationRecommendation: 'Enforce the Seiler 80/20 Rule: Cap high-intensity anaerobic sessions at 1–2 days per week, backed by 3–4 sessions of sub-lactate threshold Zone 2 aerobic base work.',
    autoResolutionTiming: {
      spacingHours: 24,
      recommendedTimeSlot: 'Polarized 80/20 weekly cadence',
      description: 'Cap HIIT at 1–2 sessions weekly, paired with 80% Zone 2 aerobic volume'
    },
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/24790484/',
    targetPathway: 'Autonomic Balance & Mitochondrial Uncoupling',
    clinicalEffectDelta: 'Overreaching & Suppressed Nocturnal HRV'
  },

  // 13. Berberine + Zone 2 Aerobic Cardio (Complex I Blunting)
  {
    id: 'berberine_vs_zone2',
    triggers: ['berberine', 'berberinehcl', 'meansberberinegda'],
    targets: ['zone2cardio', 'vo2maxhiittraining', 'endurancetraining', 'cpet'],
    type: 'mitochondrial_blunting',
    severity: 'timing',
    headline: 'Berberine Complex I Inhibition Blunts Aerobic Mitochondrial Adaptations',
    rationale: 'Like metformin, Berberine acutely inhibits mitochondrial Complex I in skeletal muscle. Taking berberine within 2 hours of endurance exercise suppresses physiological PGC-1alpha upregulation, blunting mitochondrial density and VO2 max training responses.',
    mitigationRecommendation: 'Move Berberine to post-workout lunch or evening meal, separated by at least 2–3 hours from endurance training.',
    autoResolutionTiming: {
      spacingHours: 3,
      recommendedTimeSlot: 'Evening Stack (post-workout meal)',
      description: 'Shift Berberine 3+ hours after endurance training'
    },
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/32087535/',
    targetPathway: 'Complex I / PGC-1alpha Mitochondrial Respiration',
    clinicalEffectDelta: '-35% Mitochondrial Density Adaptation'
  },

  // 14. Late-Night Cold Plunge (<2h Before Bed)
  {
    id: 'evening_cold_plunge_sleep',
    triggers: ['coldwaterimmersion', 'coldplunge', 'icebath', 'wimhofcoldshockimmersion'],
    targets: ['darkcoolsleepenvironment', 'sleep', 'blueprintsleeparchitecture', 'walker65fthermaldrop'],
    type: 'circadian_disruption',
    severity: 'timing',
    headline: 'Late-Night Cold Plunge Re-Warming Elevates Core Body Temp & Latency',
    rationale: 'Per the Søberg Principle, the body responds to cold immersion with prolonged endogenous metabolic heat generation to re-warm core organs. Performing cold plunges within 2 hours of bedtime opposes the natural 1°F core temperature drop required for sleep onset, delaying sleep latency and spiking nocturnal norepinephrine.',
    mitigationRecommendation: 'Perform cold plunge in the morning or early afternoon; avoid within 3–4 hours of sleep.',
    autoResolutionTiming: {
      recommendedTimeSlot: 'Morning (Waking / Early Day)',
      description: 'Shift Cold Plunge to morning for circadian wakefulness'
    },
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/35147574/',
    targetPathway: 'Thermoregulatory Core Cooling & Norepinephrine Clearance',
    clinicalEffectDelta: '+45m Sleep Latency & Fragmented Slow-Wave Sleep'
  },

  // 15. Creatine + High Acute Caffeine Competition
  {
    id: 'creatine_vs_high_caffeine',
    triggers: ['creatine', 'creatinemonohydrate'],
    targets: ['caffeine', 'coffee', 'preworkout'],
    type: 'antagonistic_receptors',
    severity: 'timing',
    headline: 'Simultaneous High-Dose Caffeine Blunts Creatine Muscle Saturation',
    rationale: 'Ingesting high-dose caffeine (>300mg) simultaneously with creatine monohydrate exerts antagonistic effects on muscle relaxation time and inhibits localized phosphocreatine resynthesis, in addition to increasing gastrointestinal motility and excretion before uptake.',
    mitigationRecommendation: 'Separate daily creatine (5g with post-workout meal or lunch) from acute morning pre-workout caffeine.',
    autoResolutionTiming: {
      spacingHours: 2,
      recommendedTimeSlot: 'Post-Workout Meal / Lunch',
      description: 'Take Creatine with a meal away from morning caffeine'
    },
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/12439084/',
    targetPathway: 'Muscle Relaxation Phase & Intramuscular Phosphagen Kinetics',
    clinicalEffectDelta: '-20% Ergogenic Force Gains & Pharmacokinetic Competition'
  },

  // 16. High Calcium + Magnesium TRPM6 Competition
  {
    id: 'high_calcium_vs_magnesium',
    triggers: ['calcium', 'calciumcarbonate', 'calciumcitrate'],
    targets: ['magnesium', 'magnesiumglycinate', 'magnesiumlthreonate', 'magnesiumbreakthrough'],
    type: 'absorption_competition',
    severity: 'timing',
    headline: 'High Divalent Calcium Competes with Magnesium TRPM6 Absorption',
    rationale: 'High calcium intakes (>600–800mg) competitively inhibit magnesium uptake across the intestinal lumen via the TRPM6 and TRPM7 transport channels, reducing systemic magnesium bioavailability by up to 40%.',
    mitigationRecommendation: 'Separate supplemental calcium from magnesium by at least 2 hours, reserving magnesium for evening.',
    autoResolutionTiming: {
      spacingHours: 2,
      recommendedTimeSlot: 'Evening / Wind Down',
      description: 'Take Magnesium in evening, separated from daytime Calcium'
    },
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/29774636/',
    targetPathway: 'Intestinal TRPM6/TRPM7 Divalent Cation Channels',
    clinicalEffectDelta: '-40% Intestinal Magnesium Uptake'
  },

  // 17. Statin / PCSK9 Inhibitor Depletes CoQ10
  {
    id: 'statin_without_coq10',
    triggers: ['atorvastatin', 'rosuvastatin', 'simvastatin', 'pravastatin', 'statin', 'lipitor', 'crestor', 'bempedoicacid'],
    targets: ['coq10', 'ubiquinol'],
    type: 'mitochondrial_blunting',
    severity: 'moderate',
    headline: 'HMG-CoA Reductase Blockade Depletes Endogenous CoQ10',
    rationale: 'Statins inhibit HMG-CoA reductase, the rate-limiting enzyme in both cholesterol and mevalonate synthesis. Because mevalonate is also the essential precursor to Ubiquinone (CoQ10), statin therapy reduces serum and muscle CoQ10 by 40–50%, contributing to mitochondrial uncoupling and statin-associated muscle symptoms (SAMS).',
    mitigationRecommendation: 'Stack 100–200mg Ubiquinol (CoQ10) with fat-containing meal to maintain mitochondrial electron transport.',
    autoResolutionTiming: {
      description: 'Add 100-200mg Ubiquinol with lunch or dinner'
    },
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/17493470/',
    targetPathway: 'Mevalonate Pathway & Complex I/II Electron Shuttling',
    clinicalEffectDelta: '-45% Endogenous CoQ10 Depletion & Statin Myopathy Risk'
  },

  // 18. Melatonin During Circadian Light Entrainment
  {
    id: 'melatonin_bright_light_conflict',
    triggers: ['melatonin'],
    targets: ['morningsunlight', 'brightlighttherapy', 'redlight', 'lightbox'],
    type: 'circadian_disruption',
    severity: 'timing',
    headline: 'Exogenous Melatonin During Circadian Light Entrainment Phase',
    rationale: 'Melatonin binds MT1/MT2 suprachiasmatic receptors to signal biological night. Taking melatonin in proximity to bright light or morning sunlight produces contradictory central circadian clock signals, attenuating the cortisol awakening response and producing daytime grogginess.',
    mitigationRecommendation: 'Strictly reserve micro-dose Melatonin (0.3–1mg) for 30–60 minutes before scheduled sleep in dim lighting.',
    autoResolutionTiming: {
      recommendedTimeSlot: 'Pre-Bed (30-60m before sleep)',
      description: 'Schedule Melatonin 30m before bed in dark environment'
    },
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/29072822/',
    targetPathway: 'Suprachiasmatic Nucleus (SCN) MT1/MT2 Phase Shifting',
    clinicalEffectDelta: 'Circadian Phase Confusion & Suppressed Awakening Cortisol'
  },

  // 19. Piperine / Berberine + Rapamycin / Statins (CYP3A4 & P-gp Blockade)
  {
    id: 'cyp3a4_inhibition_rapamycin_statins',
    triggers: ['piperine', 'bioperine', 'blackpepperextract', 'grapefruitextract', 'naringin'],
    targets: ['rapamycin', 'sirolimus', 'atorvastatin', 'simvastatin', 'lipitor'],
    type: 'absorption_competition',
    severity: 'critical',
    headline: 'CYP3A4 & P-gp Blockade Spikes Serum Drug Levels 200–400%',
    rationale: 'Piperine and naringin potently inhibit intestinal and hepatic Cytochrome P450 3A4 (CYP3A4) and P-glycoprotein efflux pumps. Co-administering with Rapamycin (Sirolimus) or lipophilic statins impairs hepatic clearance, driving uncontrollable 3x–4x blood AUC spikes and increasing risk of toxicity.',
    mitigationRecommendation: 'Strictly separate high-dose Piperine / BioPerine by at least 4–6 hours from Rapamycin or prescription statins, or omit piperine on pulse medication days.',
    autoResolutionTiming: {
      spacingHours: 6,
      recommendedTimeSlot: 'Separate by 6+ hours or separate day',
      description: 'Do not co-ingest piperine with rapamycin or statins'
    },
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/23625327/',
    targetPathway: 'Cytochrome P450 3A4 (CYP3A4) & P-Glycoprotein Efflux',
    clinicalEffectDelta: '+300% Drug AUC Spike & Severe Toxicity Risk'
  },

  // 20. Evening / Night NAD+ Precursors (NMN / NR Clock Desynchrony)
  {
    id: 'circadian_nad_precursor_night',
    triggers: ['nmn', 'nicotinamidemononucleotide', 'nr', 'nicotinamideriboside', 'nad', 'nadivtherapy'],
    targets: ['darkcoolsleepenvironment', 'sleep', 'blueprintsleeparchitecture', 'walker65fthermaldrop'],
    type: 'circadian_disruption',
    severity: 'timing',
    headline: 'Late-Day NAD+ Precursors Disrupt Peripheral Circadian Clocks',
    rationale: 'In mammals, cellular NAD+ biosynthesis is naturally coupled to the daylight phase by the CLOCK:BMAL1 transcriptional loop and NAMPT. Ingesting high-dose NMN or NR in the evening or before bed stimulates nocturnal SIRT1 deacetylation of PER2, desynchronizing peripheral liver/muscle circadian clocks from the central SCN and delaying melatonin release.',
    mitigationRecommendation: 'Take all NAD+ precursors (NMN, NR) upon waking or before 12:00 PM.',
    autoResolutionTiming: {
      recommendedTimeSlot: 'Morning (Waking / Early Day)',
      description: 'Shift NMN/NR to morning for circadian alignment'
    },
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/23817539/',
    targetPathway: 'CLOCK:BMAL1 / SIRT1 Molecular Oscillator',
    clinicalEffectDelta: 'Peripheral Circadian Desynchrony & Delayed Melatonin'
  },

  // 21. Protein / Leucine Inside Autophagy Fasting Window (AMPK vs. mTOR Clash)
  {
    id: 'ampk_mtor_anabolic_catabolic_clash',
    triggers: ['wheyprotein', 'leucine', 'essentialaminoacids', 'attiaproteindistribution'],
    targets: ['intermittentfasting168', 'intermittentfasting186', 'intermittentfasting204', 'omadfasting', 'waterfast24h', 'prolongedautophagyfast72h', 'spermidine'],
    type: 'autophagy_anabolism_antagonism',
    severity: 'timing',
    headline: 'Anabolic Amino Acids Shut Down Autophagic Flux & AMPK',
    rationale: 'Leucine and branched-chain amino acids bind Sestrin2 to activate the Rag GTPase machinery, instantly translocating mTORC1 to the lysosomal membrane and phosphorylating ULK1 to shut down autophagosome formation. Taking protein or EAAs during a targeted autophagy fast completely blunts cellular renewal.',
    mitigationRecommendation: 'Strictly preserve zero-calorie water/electrolytes during your fasting autophagy window; concentrate protein into your dedicated eating/refeed window.',
    autoResolutionTiming: {
      recommendedTimeSlot: 'Eating / Refeed Window',
      description: 'Consume protein only inside your eating window'
    },
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/31631026/',
    targetPathway: 'Sestrin2 / Rag GTPase / ULK1 Autophagy Switch',
    clinicalEffectDelta: '-100% Autophagic Clearance & Sestrin2 mTORC1 Activation'
  },

  // 22. Magnesium Malate Pre-Bedtime (Krebs Cycle Stimulation)
  {
    id: 'magnesium_malate_prebed_insomnia',
    triggers: ['magnesiummalate', 'malate'],
    targets: ['sleep', 'darkcoolsleepenvironment', 'blueprintsleeparchitecture', 'walker65fthermaldrop'],
    type: 'circadian_disruption',
    severity: 'timing',
    headline: 'Magnesium Malate Stimulates Krebs Cycle ATP Prior to Bedtime',
    rationale: 'Malic acid is an intermediate in the citric acid (Krebs) cycle that directly stimulates ATP production and cellular energy metabolism. Taking Magnesium Malate within 3 hours of sleep can induce alertness and insomnia rather than sedation.',
    mitigationRecommendation: 'Move Magnesium Malate to morning or pre-workout; use Magnesium Glycinate or L-Threonate for evening sleep.',
    autoResolutionTiming: {
      recommendedTimeSlot: 'Morning (with breakfast)',
      description: 'Shift Magnesium Malate to morning; use Glycinate for sleep'
    },
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/23853635/',
    targetPathway: 'Citric Acid Cycle Malate-Aspartate Shuttle',
    clinicalEffectDelta: 'Nocturnal ATP Stimulation & Delayed Sleep Onset'
  }
]
