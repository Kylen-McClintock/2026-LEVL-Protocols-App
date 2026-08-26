export interface ModalityVideoInfo {
  youtubeVideoId: string
  videoStartSeconds: number
  videoTitle: string
}

export const MODALITY_VIDEOS: Record<string, ModalityVideoInfo> = {
  'sports-nutrition': {
    youtubeVideoId: '8lKjMoeESEc',
    videoStartSeconds: 29,
    videoTitle: 'How to Maximize Muscle Protein Synthesis | Alan Aragon &amp; Dr. Andrew Huberman Why It Matches: Nutrition researcher Alan Aragon explains the optimal daily protein requirements and the exact metabolic threshold needed per meal to maximize muscle protein synthesis and optimize body composition. Physiological Mechanism: The accrual and maintenance of lean skeletal muscle mass are dictated by the delicate equilibrium between muscle protein synthesis (MPS) and muscle protein breakdown (MPB)'
  },

  'longo_post_fmd_stem_cell_refeed': {
    youtubeVideoId: 'rWL3k9Dofv0',
    videoStartSeconds: 909,
    videoTitle: 'Fasting and Prostate Cancer with Dr. Valter Longo Why It Matches: Dr. Valter Longo, creator of the Fasting Mimicking Diet (FMD), explains the scientific development and specific physiological advantages of using a 5-day nutrient-calibrated protocol over traditional water-only fasting. Physiological Mechanism: Developed by Dr. Valter Longo at the University of Southern California, the Fasting Mimicking Diet (FMD) is a meticulously calibrated, 5-day dietary protocol that provides low caloric density (700–1100 kcal/day), extremely low protein and carbohydrates, and high amounts of healthy fats'
  },

  'longo_5day_fasting_mimicking_diet': {
    youtubeVideoId: 'rWL3k9Dofv0',
    videoStartSeconds: 909,
    videoTitle: 'Fasting and Prostate Cancer with Dr. Valter Longo Why It Matches: Dr. Valter Longo, creator of the Fasting Mimicking Diet (FMD), explains the scientific development and specific physiological advantages of using a 5-day nutrient-calibrated protocol over traditional water-only fasting. Physiological Mechanism: Developed by Dr. Valter Longo at the University of Southern California, the Fasting Mimicking Diet (FMD) is a meticulously calibrated, 5-day dietary protocol that provides low caloric density (700–1100 kcal/day), extremely low protein and carbohydrates, and high amounts of healthy fats'
  },

  'intermittent_fasting_18_6': {
    youtubeVideoId: 'D61jJJPIQeo',
    videoStartSeconds: 544,
    videoTitle: 'Effects of Fasting &amp; Time Restricted Eating on Fat Loss &amp; Health | Huberman Lab Essentials Why It Matches: Dr. Andrew Huberman explains the definitive framework for designing an 18:6 time-restricted eating (TRE) window, detailing how extending the sleep-related fast optimizes circadian gene rhythms and cellular repair. Physiological Mechanism: Time-Restricted Eating (TRE) limits absolute caloric consumption to a distinct diurnal window—typically 6 to 8 hours—followed by a prolonged fasting period of 16 to 18 hours'
  },

  'post_meal_glucose_walk': {
    youtubeVideoId: 'fKV2kZBs2vY',
    videoStartSeconds: 0,
    videoTitle: 'Move Like This After Eating (It Changes Everything) Why It Matches: Biochemist Jessie Inchauspé details the exact 10-minute post-meal physical walking protocol and the underlying metabolic science of how skeletal muscles act as glucose sinks. Physiological Mechanism: The postprandial period represents a critical window of cardiometabolic vulnerability, characterized by sharp rises in blood glucose and circulating triglycerides'
  },

  'time-blocking': {
    youtubeVideoId: 'T4dser6ssp0',
    videoStartSeconds: 71,
    videoTitle: 'Dr. Cal Newport: How to Enhance Focus and Improve Productivity Why It Matches: Dr. Cal Newport physically explains the functional procedure of adopting a fixed-schedule, time-blocked productivity system to counteract task-switching and achieve deep work. Physiological Mechanism: Time blocking operates as a defense mechanism against a severe cognitive penalty known as &quot;attention residue,&quot; a phenomenon first quantified by management researcher Sophie Leroy in 2009'
  },

  'mindfulness-meditation': {
    youtubeVideoId: 'IReEu2kI6oI',
    videoStartSeconds: 0,
    videoTitle: 'Find Your Focus with this Mini Meditation Why It Matches: Headspace founder Andy Puddicombe demonstrates the exact physical setup, diaphragmatic breathing rhythm, and soft-focus eye technique required for an immediate, effective one-minute mindfulness reset. Physiological Mechanism: Mindfulness meditation leverages precise respiratory mechanics to exert profound control over the autonomic nervous system, specifically targeting the vagus nerve (cranial nerve X)'
  },

  'mental-fortitude-training': {
    youtubeVideoId: '84dYijIpWjQ',
    videoStartSeconds: 0,
    videoTitle: 'How to Build Extreme Willpower | David Goggins &amp; Dr. Andrew Huberman Why It Matches: Dr. Andrew Huberman and David Goggins provide a precise neuroscientific explanation of how engaging in deliberately uncomfortable tasks physically enlarges the brain&#39;s willpower center, detailing the exact mental framework required to trigger this adaptation. Physiological Mechanism: Deliberately engaging in high-friction, non-preferred tasks stimulates neuroplasticity and volumetric expansion within the anterior midcingulate cortex (aMCC)'
  },

  'mouth_taping': {
    youtubeVideoId: 'dimle_T67UM',
    videoStartSeconds: 0,
    videoTitle: 'How to use MyoTape for Better Sleep | Patrick McKeown Why It Matches: This concise, highly specific video demonstrates the exact physical procedure, lateral stretch technique, and safety applications for taping the mouth to enforce nasal breathing during sleep. Physiological Mechanism: Chronic nocturnal mouth breathing is a catastrophic mechanical failure that instantly shifts the autonomic nervous system into sympathetic &quot;fight or flight&quot; dominance, dehydrating the oral cavity, collapsing the soft palate, and heavily contributing to obstructive sleep apnea and snoring'
  },

  'walker_65f_thermal_drop': {
    youtubeVideoId: 'FmLO9UlebgM',
    videoStartSeconds: 0,
    videoTitle: 'How Room Temperature Affects Your Sleep | Dr. Matthew Walker Why It Matches: This dedicated segment by sleep expert Dr. Matthew Walker breaks down the exact thermoregulatory necessity of dropping a bedroom&#39;s ambient temperature to 65°F (18.3°C) and the specific vascular mechanisms the body uses to shed heat. Physiological Mechanism: Sleep architecture and systemic thermoregulation are physiologically locked in a mutually dependent relationship regulated by the anterior hypothalamus'
  },

  'walker_melatonin_dimming': {
    youtubeVideoId: 'ZrywkDJ8W9k',
    videoStartSeconds: 0,
    videoTitle: 'How Blue Light at Night Negatively Impacts Your Sleep | Dr. Andrew Huberman Why It Matches: Because dimming a light is a simple physical action, this dedicated clip explains the exact neurobiological and ocular mechanisms of why lowering ambient light intensity strictly two hours before bed is critical for endogenous hormone synthesis. Physiological Mechanism: The human eye contains a specialized subset of photoreceptors known as intrinsically photosensitive retinal ganglion cells (ipRGCs), which are heavily concentrated in the lower half of the retina (designed to detect sunlight coming from above)'
  },

  'evening-screen-time-reduction': {
    youtubeVideoId: 'TVUibwoVXZc',
    videoStartSeconds: 115,
    videoTitle: 'How Technology &amp; Phones Impact Dopamine | Dr. Andrew Huberman Why It Matches: The timestamp drops directly into the neurological explanation of why staring at high-dopamine digital screens at night fractures autonomic regulation, chronically elevating stress hormones and disrupting restorative sleep cycles. Physiological Mechanism: While the photic impact of screens (blue light) is widely understood to suppress melatonin, the more insidious physiological threat to sleep architecture stems from the neurochemical stimulation triggered by the content on the screen'
  },

  'walker_metabolic_alcohol_cutoff': {
    youtubeVideoId: 'K5utMfG1rSg',
    videoStartSeconds: 3210,
    videoTitle: 'Matthew Walker, Ph.D., on sleep – Part III: The impact of caffeine, alcohol, THC, and CBD on sleep Why It Matches: This timestamp jumps exactly to sleep expert Dr. Matthew Walker&#39;s clinical explanation of how late alcohol and food intake destroys sleep architecture, justifying the strict 3-hour pre-sleep fasting rule. Physiological Mechanism: Consuming alcohol and large caloric loads closely prior to sleep initiates a cascade of catastrophic disruptions to natural sleep architecture and overnight autonomic recovery'
  },

  'dark-cool-sleep-environment': {
    youtubeVideoId: 'oce0_CvRaSY',
    videoStartSeconds: 0,
    videoTitle: 'How To Get Better Sleep at Night Why It Matches: This clip clearly explains the exact environmental modifications required for optimizing a bedroom&#39;s ambient light and temperature parameters to perfectly biohack circadian sleep alignment. Physiological Mechanism: Human sleep architecture is dictated by the suprachiasmatic nucleus (SCN), a tiny region in the brain&#39;s hypothalamus that acts as the master circadian pacemaker'
  },

  'recovery-techniques': {
    youtubeVideoId: 'XLvmPRNwr3Q',
    videoStartSeconds: 0,
    videoTitle: 'The Best Breathing Exercise for Recovery | Dr. Andy Galpin Why It Matches: The video explicitly demonstrates the specific parasympathetic breathing protocols and physical down-regulation techniques used to immediately initiate active autonomic recovery post-exercise, complementing the metabolic lactate clearance protocols. Physiological Mechanism: Active recovery functions through two distinct but deeply intertwined physiological mechanisms: metabolic clearance and autonomic nervous system down-regulation'
  },

  'optic_flow': {
    youtubeVideoId: '8TGaxpasdmw',
    videoStartSeconds: 0,
    videoTitle: 'Andrew Huberman on the Benefits of Lateral Eye Movements (Optic Flow) Why It Matches: Because forward ambulation is a simple behavioral procedure (walking), this dedicated clinical clip jumps directly into the deep neurobiological explanation of why moving forward generates optic flow that chemically suppresses the brain&#39;s stress and fear centers. Physiological Mechanism: The profound psychological relief associated with walking or running is driven by a hardwired neurological circuit linking the visual system to the brain&#39;s emotional regulatory centers'
  },

  'strength-training': {
    youtubeVideoId: 'v8XV6h0G3FI',
    videoStartSeconds: 0,
    videoTitle: 'The Truth About Mechanical Tension For Muscle Growth Why It Matches: This clip provides an exact, detailed explanation of how to gauge mechanical tension and proximity to failure during strength training to ensure muscle fibers are optimally stimulated for hypertrophy, regardless of the absolute weight on the bar. Physiological Mechanism: Mechanical tension is the primary driving force behind skeletal muscle hypertrophy, operating through a complex biochemical process known as mechanotransduction'
  },

  'running': {
    youtubeVideoId: 'gYajoeR_UF8',
    videoStartSeconds: 35,
    videoTitle: 'PERFECT RUNNING FORM - Techniques PRO Runners use to Run Faster Why It Matches: The video provides an exact, step-by-step visual demonstration of optimal running mechanics, focusing specifically on proper forward hip drive, correct foot strike placement beneath the center of mass, and ideal cadence alignment. Physiological Mechanism: Optimal running biomechanics are dictated by the efficient management of ground reaction forces and the maximal utilization of the stretch-shortening cycle (SSC) within the lower kinetic chain'
  },

  'bfr_training': {
    youtubeVideoId: 'cqPsLWMtfI8',
    videoStartSeconds: 45,
    videoTitle: 'Try This BFR Training Workout (Blood Flow Restriction) Why It Matches: This dedicated instructional clip physically demonstrates the exact tourniquet placement on the proximal limbs, optimal perceived compression levels (7/10 tightness), and step-by-step low-load exercise execution required for proper BFR training. Physiological Mechanism: Blood Flow Restriction (BFR) training fundamentally operates by inducing partial arterial inflow restriction while creating a complete venous outflow blockade in the targeted limb musculature'
  },

  'gaba': {
    youtubeVideoId: 'bQIU2KDtHTI',
    videoStartSeconds: 0,
    videoTitle: '2-Minute Neuroscience: GABA Why It Matches: An exact, highly concise neuroscientific breakdown of how Gamma-aminobutyric acid functions at the cellular ionotropic and metabotropic receptor levels. Physiological Mechanism: Gamma-aminobutyric acid (GABA) is the absolute principal inhibitory neurotransmitter of the mammalian central nervous system, biologically responsible for regulating cortical excitability, inducing profound relaxation, and guarding against chronic stress and systemic hyperarousal'
  },

  'zinc': {
    youtubeVideoId: 'kqXBIEQ_bug',
    videoStartSeconds: 509,
    videoTitle: 'Magnesium for Sleep: The Form Matters More Than the Dose Why It Matches: Jumps straight into the high-level scientific explanation of how this specific chelated form of magnesium impacts ATP, GABA signaling, and profound central nervous system relaxation. Physiological Mechanism: Magnesium bisglycinate (often referred to simply as magnesium glycinate) represents a triumph of chelation pharmacokinetics, providing the absolutely essential mineral magnesium covalently bonded to two molecules of the amino acid glycine'
  },

  'magnesium_glycinate': {
    youtubeVideoId: 'kqXBIEQ_bug',
    videoStartSeconds: 509,
    videoTitle: 'Magnesium for Sleep: The Form Matters More Than the Dose Why It Matches: Jumps straight into the high-level scientific explanation of how this specific chelated form of magnesium impacts ATP, GABA signaling, and profound central nervous system relaxation. Physiological Mechanism: Magnesium bisglycinate (often referred to simply as magnesium glycinate) represents a triumph of chelation pharmacokinetics, providing the absolutely essential mineral magnesium covalently bonded to two molecules of the amino acid glycine'
  },

  'taurine': {
    youtubeVideoId: 'JrpNUR73lb0',
    videoStartSeconds: 51,
    videoTitle: 'Taurine.. Time to Throw it Away? Two New Studies Why It Matches: A medical doctor breaks down exactly what taurine is biochemically and analyzes its cellular mechanisms, cytoprotective properties, and clinical effects at the designated timestamp. Physiological Mechanism: Taurine (2-aminoethanesulfonic acid) is a conditionally essential, sulfur-containing amino acid that operates entirely uniquely; it does not act as a traditional structural building block for proteins, but rather serves as a ubiquitous cytoprotectant, potent neuromodulator, and master metabolic orchestrator'
  },

  'alpha_gpc': {
    youtubeVideoId: 'uXs-zPc63kM',
    videoStartSeconds: 359,
    videoTitle: 'Nicotine&#39;s Effects on the Brain &amp; Body &amp; How to Quit Smoking or Vaping | Huberman Lab Podcast #90 Why It Matches: Jumps directly to the segment breaking down Alpha-GPC and its direct cholinergic role in the neurobiological &quot;Arrow Model of Focus.&quot; Physiological Mechanism: Alpha-GPC (L-Alpha-glycerylphosphorylcholine) is a highly bioavailable, naturally occurring phospholipid precursor that acts as a profound, rapid-acting cholinergic upregulator in both the central brain and the peripheral nervous system'
  },

  'l_theanine': {
    youtubeVideoId: 'h2aWYjSA1Jc',
    videoStartSeconds: 4305,
    videoTitle: 'Master Your Sleep &amp; Be More Alert When Awake | Huberman Lab Podcast #2 Why It Matches: Dr. Huberman specifically addresses the clinical dosage, timing, and biological effects of L-theanine within a targeted, multi-supplement neural sleep protocol. Physiological Mechanism: L-Theanine (γ-glutamylethylamide) is a highly unique, non-proteinogenic amino acid found predominantly in green tea leaves that acts as a powerful neuro-modulatory agent capable of inducing profound, deep relaxation without any accompanying central nervous system sedation or intoxication'
  },

  'glp_1_receptor_agonists': {
    youtubeVideoId: 'KeqMSzFbSos',
    videoStartSeconds: 0,
    videoTitle: 'What is a GLP-1 agonist, and how does it work? | Ohio State Medical Center Why It Matches: A medical specialist provides a concise, highly clinical breakdown of exactly how GLP-1 peptide medications function simultaneously in the gut and the brain. Physiological Mechanism: Glucagon-like peptide-1 (GLP-1) receptor agonists are a revolutionary class of synthetic therapeutic peptides engineered to exactly mimic the metabolic effects of endogenous GLP-1, a crucial incretin hormone naturally secreted by intestinal enteroendocrine L-cells directly in response to nutrient ingestion'
  },

  'ashwagandha_ksm_66': {
    youtubeVideoId: 'Ibj1k3IZTNU',
    videoStartSeconds: 6272,
    videoTitle: 'How to Control Your Cortisol &amp; Overcome Burnout Why It Matches: Jumps directly to Dr. Huberman detailing evidence-based supplements specifically designed to reduce chronic stress, highlighting the neuroendocrine mechanisms of ashwagandha. Physiological Mechanism: Ashwagandha (Withania somnifera) is a premier Ayurvedic adaptogen whose clinical efficacy is entirely driven by a complex, naturally occurring matrix of steroidal lactones collectively known as withanolides'
  },

  'ashwagandha_ksm66': {
    youtubeVideoId: 'Ibj1k3IZTNU',
    videoStartSeconds: 6272,
    videoTitle: 'How to Control Your Cortisol &amp; Overcome Burnout Why It Matches: Jumps directly to Dr. Huberman detailing evidence-based supplements specifically designed to reduce chronic stress, highlighting the neuroendocrine mechanisms of ashwagandha. Physiological Mechanism: Ashwagandha (Withania somnifera) is a premier Ayurvedic adaptogen whose clinical efficacy is entirely driven by a complex, naturally occurring matrix of steroidal lactones collectively known as withanolides'
  },

  'glycine_3g': {
    youtubeVideoId: 'FPuJGJtwPzg',
    videoStartSeconds: 0,
    videoTitle: 'Glycine: The Sleep Hack Doctors Forget to Mention Why It Matches: A physician explicitly breaks down the dosing and the specific biological pathways by which glycine regulates circadian rhythm and sleep architecture. Physiological Mechanism: Glycine is a non-essential amino acid that acts as a potent systemic neuromodulator and inhibitory neurotransmitter, playing a highly specialized, non-negotiable role in the biological regulation of sleep architecture and the circadian rhythm'
  },

  'glycine_supplementation': {
    youtubeVideoId: 'FPuJGJtwPzg',
    videoStartSeconds: 0,
    videoTitle: 'Glycine: The Sleep Hack Doctors Forget to Mention Why It Matches: A physician explicitly breaks down the dosing and the specific biological pathways by which glycine regulates circadian rhythm and sleep architecture. Physiological Mechanism: Glycine is a non-essential amino acid that acts as a potent systemic neuromodulator and inhibitory neurotransmitter, playing a highly specialized, non-negotiable role in the biological regulation of sleep architecture and the circadian rhythm'
  },

  'lions_mane': {
    youtubeVideoId: 'bJdtXYupIwI',
    videoStartSeconds: 580,
    videoTitle: 'Lion&#39;s Mane Mushroom Benefits &amp; Science Why It Matches: The timestamp jumps directly to a high-level scientific breakdown of how lion&#39;s mane stimulates endogenous nerve growth factors to improve cognition. Physiological Mechanism: Lion&#39;s Mane (Hericium erinaceus) is a unique medicinal fungus uniquely characterized by its high concentration of distinct, low-molecular-weight bioactive compounds, principally hericenones (which are extracted exclusively from the fruiting body) and erinacines (which are derived deeply from the mycelium)'
  },

  'rhonda_omega3_phospholipids': {
    youtubeVideoId: 'r4TppE0LDxs',
    videoStartSeconds: 25,
    videoTitle: 'Rhonda Patrick Goes in Depth on the Benefits of Omega-3s Why It Matches: Dr. Patrick details the specific cardiovascular health effects, cellular integration mechanisms, and long-term mortality benefits of high-dose EPA/DHA supplementation. Physiological Mechanism: Eicosapentaenoic acid (EPA) and docosahexaenoic acid (DHA) are absolutely essential, marine-derived long-chain polyunsaturated fatty acids that exert profound, multi-systemic physiological effects by directly modifying cellular architecture and modulating lipid-derived immune signaling molecules'
  },

  'epa_dha_omega3': {
    youtubeVideoId: 'r4TppE0LDxs',
    videoStartSeconds: 25,
    videoTitle: 'Rhonda Patrick Goes in Depth on the Benefits of Omega-3s Why It Matches: Dr. Patrick details the specific cardiovascular health effects, cellular integration mechanisms, and long-term mortality benefits of high-dose EPA/DHA supplementation. Physiological Mechanism: Eicosapentaenoic acid (EPA) and docosahexaenoic acid (DHA) are absolutely essential, marine-derived long-chain polyunsaturated fatty acids that exert profound, multi-systemic physiological effects by directly modifying cellular architecture and modulating lipid-derived immune signaling molecules'
  },

  'abpm-24h-blood-pressure-monitor': {
    youtubeVideoId: 'xHtF0xLTk9g',
    videoStartSeconds: 0,
    videoTitle: '24-Hour Ambulatory Blood Pressure Monitor Demo Video'
  },

  'continuous_glucose_monitor': {
    youtubeVideoId: 'CX1dJ3TlLbc',
    videoStartSeconds: 0,
    videoTitle: 'Continuous Glucose Monitor (CGM) Demo Video'
  },

  'blue_light_blocking': {
    youtubeVideoId: '1ONNqv2eMwQ',
    videoStartSeconds: 0,
    videoTitle: 'Blue Light Blocking Glasses (Evening) Demo Video'
  },

  'blueprint_red_light_therapy': {
    youtubeVideoId: 'I44ZFvo4pcg',
    videoStartSeconds: 0,
    videoTitle: 'Blueprint Whole-Body Red & Near-Infrared Light Therapy Demo Video'
  },

  'red_light_photobiomodulation_therapy': {
    youtubeVideoId: 'I44ZFvo4pcg',
    videoStartSeconds: 0,
    videoTitle: 'Red Light / Photobiomodulation Therapy Demo Video'
  },

  'morning_sunlight': {
    youtubeVideoId: 'RTgJSQtvo88',
    videoStartSeconds: 0,
    videoTitle: 'Morning Light Exposure Demo Video'
  },

  'f0dba777-57ed-4070-8c2e-038e40a0cf6a': {
    youtubeVideoId: 'RTgJSQtvo88',
    videoStartSeconds: 0,
    videoTitle: 'Solar Noon Sunlight Exposure Demo Video'
  },

  'morning-sunlight-exposure': {
    youtubeVideoId: 'RTgJSQtvo88',
    videoStartSeconds: 0,
    videoTitle: 'Morning Sunlight Exposure Demo Video'
  },

  'means_berberine_gda': {
    youtubeVideoId: 'x6NixO45JEA',
    videoStartSeconds: 0,
    videoTitle: 'Berberine HCl (500mg) Glucose Disposal Agent (GDA) Video Research'
  },

  'berberine': {
    youtubeVideoId: 'x6NixO45JEA',
    videoStartSeconds: 0,
    videoTitle: 'Berberine (500mg) Video Research'
  },

  'sulforaphane': {
    youtubeVideoId: 'zY08GW7baqs',
    videoStartSeconds: 0,
    videoTitle: 'Sulforaphane Video Research'
  },

  'apigenin': {
    youtubeVideoId: 't2esRS4-6BY',
    videoStartSeconds: 0,
    videoTitle: 'Apigenin (50mg) Video Research'
  },

  'magnesium_threonate': {
    youtubeVideoId: 'l9Dotr3Y6W0',
    videoStartSeconds: 0,
    videoTitle: 'Magnesium Threonate Video Research'
  },

  'walker_sleep_triad_supplement': {
    youtubeVideoId: 't2esRS4-6BY',
    videoStartSeconds: 0,
    videoTitle: 'Matthew Walker Sleep Triad (Mag L-Threonate + Apigenin + L-Theanine) Video Research'
  },

  'tudca': {
    youtubeVideoId: 'C-zbaTZc5_A',
    videoStartSeconds: 0,
    videoTitle: 'TUDCA Video Research'
  },

  'coq10': {
    youtubeVideoId: 'LkzEbGY7cEY',
    videoStartSeconds: 0,
    videoTitle: 'CoQ10 Video Research'
  },

  'glynac_glutathione_pulse': {
    youtubeVideoId: 'mj2v0mXUPf4',
    videoStartSeconds: 0,
    videoTitle: 'GlyNAC (Glycine + NAC Stack) Video Research'
  },

  'creatine_monohydrate': {
    youtubeVideoId: 'Tu3I-JhlKYA',
    videoStartSeconds: 0,
    videoTitle: 'Creatine Monohydrate Video Research'
  },

  'spermidine_supplement': {
    youtubeVideoId: 'jyn7MgTRaTU',
    videoStartSeconds: 0,
    videoTitle: 'Spermidine Supplementation Video Research'
  },

  'extra-virgin-olive-oil': {
    youtubeVideoId: 'Iq34Plm1Crc',
    videoStartSeconds: 0,
    videoTitle: 'High-Polyphenol Extra Virgin Olive Oil (EVOO) Video Research'
  },

  'rapamycin_weekly': {
    youtubeVideoId: 'Rcgiv8PoNBc',
    videoStartSeconds: 0,
    videoTitle: 'Rapamycin (Sirolimus) Weekly Video Research'
  },

  'metformin_daily': {
    youtubeVideoId: 'c24Dz8b0Dbs',
    videoStartSeconds: 0,
    videoTitle: 'Metformin Video Research'
  },

  'sinclair_metformin_berberine': {
    youtubeVideoId: 'x6NixO45JEA',
    videoStartSeconds: 0,
    videoTitle: 'Metformin (850mg) or Berberine (1,000mg) AMPK Pulse Video Research'
  },

  'acarbose': {
    youtubeVideoId: '0grv7IJ_nxg',
    videoStartSeconds: 0,
    videoTitle: 'Acarbose (With Meals) Video Research'
  },

  'resveratrol_pterostilbene': {
    youtubeVideoId: 'DCrR8UKmqbs',
    videoStartSeconds: 0,
    videoTitle: 'Resveratrol / Pterostilbene Video Research'
  },

  'sinclair_trans_resveratrol': {
    youtubeVideoId: 'DCrR8UKmqbs',
    videoStartSeconds: 0,
    videoTitle: 'Micronized Trans-Resveratrol (1,000mg) with Dietary Fat Video Research'
  },

  'nad_precursors': {
    youtubeVideoId: 'lt8Z0fNukBw',
    videoStartSeconds: 0,
    videoTitle: 'NAD+ Precursors (NMN / NR) Video Research'
  },

  'sinclair_nmn_tmg': {
    youtubeVideoId: 'lt8Z0fNukBw',
    videoStartSeconds: 0,
    videoTitle: 'Sublingual Micronized NMN (1g) + TMG (500mg) Video Research'
  },

  'nmn': {
    youtubeVideoId: 'lt8Z0fNukBw',
    videoStartSeconds: 0,
    videoTitle: 'NMN Video Research'
  },

  'quercetin': {
    youtubeVideoId: 'VAVBZIoed-c',
    videoStartSeconds: 0,
    videoTitle: 'Quercetin Video Research'
  },

  'longo_fisetin_quercetin_senolytic_pulse': {
    youtubeVideoId: 'VAVBZIoed-c',
    videoStartSeconds: 0,
    videoTitle: 'Mayo Clinic Pulsed High-Dose Fisetin (20mg/kg) & Quercetin Video Research'
  },

  'fisetin': {
    youtubeVideoId: 'ca0QC_IZUQQ',
    videoStartSeconds: 0,
    videoTitle: 'Fisetin Video Research'
  },

  'fisetin_quercetin_senolytic_pulse': {
    youtubeVideoId: 'VAVBZIoed-c',
    videoStartSeconds: 0,
    videoTitle: 'Fisetin & Quercetin Senolytic Pulse Video Research'
  },

  'grip_strength': {
    youtubeVideoId: 'WcLgfUOUrPk',
    videoStartSeconds: 0,
    videoTitle: 'Grip Strength Measurement with Grip Dynamometer'
  },

  'handgrip_strength': {
    youtubeVideoId: 'WcLgfUOUrPk',
    videoStartSeconds: 0,
    videoTitle: 'Grip Strength Measurement with Grip Dynamometer'
  },

  'usual_gait_speed': {
    youtubeVideoId: 'xLScK_NXUN0',
    videoStartSeconds: 0,
    videoTitle: 'NIH Toolbox 4-Meter Walk Gait Speed Test'
  },

  'gait_speed': {
    youtubeVideoId: 'xLScK_NXUN0',
    videoStartSeconds: 0,
    videoTitle: 'NIH Toolbox 4-Meter Walk Gait Speed Test'
  },

  '30s_chair_stand': {
    youtubeVideoId: 'qkV0UvjXgcs',
    videoStartSeconds: 0,
    videoTitle: '30-Second Chair Stand Test (CDC STEADI Official)'
  },

  'chair_stand_30s': {
    youtubeVideoId: 'qkV0UvjXgcs',
    videoStartSeconds: 0,
    videoTitle: '30-Second Chair Stand Test (CDC STEADI Official)'
  },

  'single_leg_stance': {
    youtubeVideoId: 'PzaeZjsVs5Q',
    videoStartSeconds: 0,
    videoTitle: 'One-Leg Stance Protocol (CSEP Guidelines)'
  },

  'single_leg_balance': {
    youtubeVideoId: 'PzaeZjsVs5Q',
    videoStartSeconds: 0,
    videoTitle: 'One-Leg Stance Protocol (CSEP Guidelines)'
  },

  'hypoxic_breath_retentions': {
    youtubeVideoId: '0BNejY1e9ik',
    videoStartSeconds: 0,
    videoTitle: 'Wim Hof Method Guided Breathing & Hypoxic Retentions'
  },

  'resonance_frequency_breathing': {
    youtubeVideoId: '-2wqXuRcXmY',
    videoStartSeconds: 0,
    videoTitle: 'Resonance Frequency Breathing (6 Breaths Per Minute)'
  },

  'tactical_box_breathing': {
    youtubeVideoId: '1hQFMC0luis',
    videoStartSeconds: 0,
    videoTitle: 'Guided Tactical Box Breathing Protocol (4-4-4-4)'
  },

  'physiological_cyclic_sighing': {
    youtubeVideoId: 't7P2DaCwabA',
    videoStartSeconds: 0,
    videoTitle: 'The Physiological Sigh: Instant Stress Lowering Technique — Dr. Andrew Huberman'
  },

  'far_infrared_sauna': {
    youtubeVideoId: '2Cg5H6_2tEc',
    videoStartSeconds: 0,
    videoTitle: 'Sauna Benefits Deep Dive & Optimal Use with Dr. Rhonda Patrick'
  },

  'contrast_hydrotherapy': {
    youtubeVideoId: '9YAcQLUGUAE',
    videoStartSeconds: 0,
    videoTitle: 'Contrast Therapy Explained (Sauna to Cold Plunge Protocol)'
  },

  'soberg_reheating_principle': {
    youtubeVideoId: 'Qjy4wRgC75Y',
    videoStartSeconds: 10,
    videoTitle: 'Dr. Andrew Huberman Explains the Søberg Reheating Principle'
  },

  'hyperthermic_sauna': {
    youtubeVideoId: 'vZlVucnOxso',
    videoStartSeconds: 247,
    videoTitle: 'Sauna Benefits for Longevity and Performance: Doctor Experiment and Scientific Analysis'
  },

  'sauna_exposure': {
    youtubeVideoId: 'vZlVucnOxso',
    videoStartSeconds: 247,
    videoTitle: 'Sauna Benefits for Longevity and Performance: Doctor Experiment and Scientific Analysis'
  },

  // 1. Breathwork Protocols (Short 1-2 min verified demos)
  '478_relaxing_breathing': {
    youtubeVideoId: 'gz4G31LGyog',
    videoStartSeconds: 15,
    videoTitle: 'Dr. Andrew Weil 4-7-8 Relaxing Breath Technique'
  },
  four_seven_eight_breathing: {
    youtubeVideoId: 'gz4G31LGyog',
    videoStartSeconds: 15,
    videoTitle: 'Dr. Andrew Weil 4-7-8 Relaxing Breath Technique'
  },
  cyclic_sighing: {
    youtubeVideoId: 'rBdhqBGqiMc',
    videoStartSeconds: 10,
    videoTitle: 'Physiological Cyclic Sighing Double Inhale Demo'
  },
  box_breathing: {
    youtubeVideoId: 'ibGpierkYdI',
    videoStartSeconds: 15,
    videoTitle: 'Tactical Box Breathing Protocol'
  },

  // 2. Cold Exposure & Søberg Principle
  cold_plunge: {
    youtubeVideoId: '5kkBgb426Aw',
    videoStartSeconds: 0,
    videoTitle: 'How to Cold Plunge: Crucial Tips for Beginners & Protocol Guide'
  },
  soberg_cold_water_immersion: {
    youtubeVideoId: '5kkBgb426Aw',
    videoStartSeconds: 0,
    videoTitle: 'How to Cold Plunge: Crucial Tips for Beginners & Protocol Guide'
  },
  cold_water_immersion: {
    youtubeVideoId: '5kkBgb426Aw',
    videoStartSeconds: 0,
    videoTitle: 'How to Cold Plunge: Crucial Tips for Beginners & Protocol Guide'
  },
  ice_bath: {
    youtubeVideoId: '5kkBgb426Aw',
    videoStartSeconds: 0,
    videoTitle: 'How to Cold Plunge: Crucial Tips for Beginners & Protocol Guide'
  },
  deliberate_cold_exposure: {
    youtubeVideoId: '5kkBgb426Aw',
    videoStartSeconds: 0,
    videoTitle: 'How to Cold Plunge: Crucial Tips for Beginners & Protocol Guide'
  },
  cold_shock: {
    youtubeVideoId: '5kkBgb426Aw',
    videoStartSeconds: 0,
    videoTitle: 'How to Cold Plunge: Crucial Tips for Beginners & Protocol Guide'
  },

  // 3. Physical Tests (Only short dedicated movement demos)
  sitting_rising_test: {
    youtubeVideoId: 'u_h30-Jg_3M',
    videoStartSeconds: 0,
    videoTitle: 'Sitting-Rising Test (SRT) Unassisted Floor Transition Demo'
  },

  // 4. Exercise & Cardiorespiratory Modalities (Verified Research Matches)
  soleus_pushups: {
    youtubeVideoId: 'pN8E3O5ZGTs',
    videoStartSeconds: 0,
    videoTitle: 'Dr. Marc Hamilton, Developer of SPUs (Soleus Push Ups), teaches how to do them'
  },
  post_meal_soleus_pushups: {
    youtubeVideoId: 'pN8E3O5ZGTs',
    videoStartSeconds: 0,
    videoTitle: 'Dr. Marc Hamilton, Developer of SPUs (Soleus Push Ups), teaches how to do them'
  },
  norwegian_4x4_vo2_max_intervals: {
    youtubeVideoId: '1XDsRNeVynk',
    videoStartSeconds: 0,
    videoTitle: '4x4 Interval Training - NTNU Official Protocol'
  },
  vo2_max_4x4_hiit: {
    youtubeVideoId: '1XDsRNeVynk',
    videoStartSeconds: 0,
    videoTitle: '4x4 Interval Training - NTNU Official Protocol'
  },
  zone_2_aerobic_base_training: {
    youtubeVideoId: 'z82GCNXdLAA',
    videoStartSeconds: 0,
    videoTitle: 'Zone 2 Training: Dose, Frequency, and Duration | Dr. Iñigo San-Millán & Dr. Peter Attia'
  },
  zone_2_cardio: {
    youtubeVideoId: 'z82GCNXdLAA',
    videoStartSeconds: 0,
    videoTitle: 'Zone 2 Training: Dose, Frequency, and Duration | Dr. Iñigo San-Millán & Dr. Peter Attia'
  },
  vilpa_micro_bursts: {
    youtubeVideoId: 'LGtAKrUmb0c',
    videoStartSeconds: 0,
    videoTitle: 'VILPA Research News & Exercise Protocol'
  },
  vilpa: {
    youtubeVideoId: 'LGtAKrUmb0c',
    videoStartSeconds: 0,
    videoTitle: 'VILPA Research News & Exercise Protocol'
  },
  tibialis_raises: {
    youtubeVideoId: 'UD9Xb8dcv0E',
    videoStartSeconds: 0,
    videoTitle: 'Anterior Tib Raises on Wall'
  },
  slant_board_squats: {
    youtubeVideoId: '8kG9ZVYU6m8',
    videoStartSeconds: 0,
    videoTitle: 'How a Slant Board Improves a Squat'
  },
  poliquin_step_ups: {
    youtubeVideoId: 'AMQGRHM6ymc',
    videoStartSeconds: 0,
    videoTitle: 'Poliquin Step-up Exercise for Knee Pain & Strong VMO'
  },
  nordic_hamstring_curls: {
    youtubeVideoId: 'zd_YToC83TA',
    videoStartSeconds: 0,
    videoTitle: 'Nordic Hamstring Exercise - Aspetar Clinical Protocol'
  },
  thoracic_spine_extension_rotation: {
    youtubeVideoId: 'hJuoqOHLbzY',
    videoStartSeconds: 0,
    videoTitle: 'Thoracic Spine Foam Rolling'
  },
  isometric_handgrip_training: {
    youtubeVideoId: 'k8ATJjEyuDQ',
    videoStartSeconds: 0,
    videoTitle: 'Isometric Grip Strength Exercise | Allan Mishra, MD'
  }
}

export const PROTOCOL_VIDEOS: Record<string, ModalityVideoInfo> = {}

export function getModalityVideoInfo(modalityId?: string, category?: string, name?: string): ModalityVideoInfo | undefined {
  if (modalityId) {
    const cleaned = modalityId.toLowerCase().trim().replace(/-/g, '_')
    if (MODALITY_VIDEOS[cleaned]) return MODALITY_VIDEOS[cleaned]
  }

  const searchStr = `${modalityId || ''} ${category || ''} ${name || ''}`.toLowerCase()

    if (searchStr.includes('single_leg') || searchStr.includes('single leg') || searchStr.includes('balance')) {
    return MODALITY_VIDEOS['single_leg_balance']
  }

  if (searchStr.includes('chair_stand') || searchStr.includes('chair stand')) {
    return MODALITY_VIDEOS['chair_stand_30s']
  }

  if (searchStr.includes('gait') || searchStr.includes('4m_walk') || searchStr.includes('walking speed')) {
    return MODALITY_VIDEOS['gait_speed']
  }

  if (searchStr.includes('grip') || searchStr.includes('handgrip')) {
    return MODALITY_VIDEOS['handgrip_strength']
  }

  if (searchStr.includes('soleus') || searchStr.includes('spus')) {
    return MODALITY_VIDEOS['soleus_pushups']
  }

  if (searchStr.includes('norwegian') || searchStr.includes('4x4')) {
    return MODALITY_VIDEOS['norwegian_4x4_vo2_max_intervals']
  }

  if (searchStr.includes('zone 2') || searchStr.includes('zone_2')) {
    return MODALITY_VIDEOS['zone_2_aerobic_base_training']
  }

  if (searchStr.includes('vilpa') || searchStr.includes('intermittent lifestyle')) {
    return MODALITY_VIDEOS['vilpa']
  }

  if (searchStr.includes('tibialis')) {
    return MODALITY_VIDEOS['tibialis_raises']
  }

  if (searchStr.includes('slant board')) {
    return MODALITY_VIDEOS['slant_board_squats']
  }

  if (searchStr.includes('poliquin')) {
    return MODALITY_VIDEOS['poliquin_step_ups']
  }

  if (searchStr.includes('nordic')) {
    return MODALITY_VIDEOS['nordic_hamstring_curls']
  }

  if (searchStr.includes('thoracic')) {
    return MODALITY_VIDEOS['thoracic_spine_extension_rotation']
  }

  if (searchStr.includes('handgrip') || searchStr.includes('isometric grip')) {
    return MODALITY_VIDEOS['isometric_handgrip_training']
  }

  if (searchStr.includes('4-7-8') || searchStr.includes('478')) {
    return MODALITY_VIDEOS['478_relaxing_breathing']
  }

  if (searchStr.includes('cyclic') || searchStr.includes('sigh')) {
    return MODALITY_VIDEOS['cyclic_sighing']
  }

  if (searchStr.includes('box') && searchStr.includes('breath')) {
    return MODALITY_VIDEOS['box_breathing']
  }

  if (searchStr.includes('sitting') && searchStr.includes('rising')) {
    return MODALITY_VIDEOS['sitting_rising_test']
  }

  if (searchStr.includes('cold') && (searchStr.includes('plunge') || searchStr.includes('immersion') || searchStr.includes('bath') || searchStr.includes('shock') || searchStr.includes('water'))) {
    return MODALITY_VIDEOS['cold_plunge']
  }
  if (searchStr.includes('ice bath') || searchStr.includes('ice_bath')) {
    return MODALITY_VIDEOS['cold_plunge']
  }

  return undefined
}

export function getProtocolVideoInfo(protocolId?: string, protocolName?: string): ModalityVideoInfo | undefined {
  if (protocolId) {
    const cleaned = protocolId.toLowerCase().trim().replace(/-/g, '_')
    if (PROTOCOL_VIDEOS[cleaned]) return PROTOCOL_VIDEOS[cleaned]
  }

  return undefined
}
