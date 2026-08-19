export interface BiochemicalSynergyRule {
  id: string
  triggers: string[]
  targets: string[]
  type: 'bioavailability' | 'cofactor' | 'receptor' | 'cellular_pathway' | 'contrast_hormesis'
  headline: string
  rationale: string
  actionableTip: string
  pubmedUrl: string
}

export interface BiochemicalConflictRule {
  id: string
  triggers: string[]
  targets: string[]
  type: 'hypertrophy_blunting' | 'circadian_disruption' | 'absorption_competition' | 'methylation_depletion' | 'glycemic_shock' | 'antagonistic_receptors'
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
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/29086496/'
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
    targets: ['darkcoolsleepenvironment', 'sleep', 'blueprintsleeparchitecture', 'walker65fthermaldrop', 'magnesiumglycinate', '478breathing', 'walkercaffeinecutoff'],
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
    triggers: ['walkermetabolicalcoholcutoff'],
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
  }
]
