import { Protocol, ProtocolStep, Modality } from '@/lib/types'

// ============================================================================
// CANONICAL MODALITIES DEFINITIONS
// ============================================================================

export const CANONICAL_ATTIA_MODALITIES: Modality[] = [
  {
    id: 'zone_2_cardio',
    slug: 'zone-2-cardio',
    name: 'Zone 2 Steady-State Cardio',
    display_name: 'Zone 2 Steady-State Aerobic Volume',
    category: 'cardio',
    modality_type: 'aerobic_training',
    status: 'active',
    brief_description: 'Steady-state aerobic base training maintaining blood lactate between 1.5–2.0 mmol/L to optimize slow-twitch mitochondrial density.',
    expanded_why: 'Zone 2 training maximizes mitochondrial respiration in Type I slow-twitch myocytes, upregulating FAT/CD36 fatty acid transporters and lactate clearance pathways without autonomic exhaustion.',
    headline_benefit: 'Maximal Mitochondrial Efficiency, Lactate Clearance & Aerobic Healthspan',
    primary_outcome: 'Physical Energy',
    dose_or_exposure: '45–60 mins @ 60–70% max HR (180–240 mins total weekly volume)',
    timing_summary: 'Morning or Early Afternoon',
    default_timing_slot: 'morning',
    frequency: '3-4x / week',
    evidence_quality: 95,
    functional_outcomes_to_track: ['Endurance', 'Mitochondrial Efficiency', 'Resting Heart Rate', 'Metabolic Flexibility'],
    scientific_references: [
      {
        title: 'San-Millán & Brooks (2018) Assessment of Metabolic Flexibility and Mitochondrial Quality in Athletes vs Metabolic Disease',
        url: 'https://pubmed.ncbi.nlm.nih.gov/28708630/',
        type: 'pubmed',
        pmid: '28708630'
      },
      {
        title: 'Attia (2023) Outlive: The Science and Art of Longevity - Exercise and Cardiorespiratory Fitness',
        url: 'https://peterattiamd.com/category/exercise/',
        type: 'clinical_protocol'
      }
    ]
  },
  {
    id: 'peter_attia_centenarian_strength',
    slug: 'peter-attia-centenarian-strength',
    name: "Peter Attia's Centenarian Decathlon Strength",
    display_name: 'Centenarian Decathlon Progressive Strength',
    category: 'strength',
    modality_type: 'resistance_training',
    status: 'active',
    brief_description: 'Targeted compound resistance loading focused on hip hinge, squatting, vertical/horizontal pulls, and loaded carries for grip stability.',
    expanded_why: 'Muscle mass and grip strength are two of the strongest protective inverse predictors of all-cause mortality in individuals past 65. Progressive eccentric control builds skeletal bone mineral density and prevents sarcopenia.',
    headline_benefit: 'Decade-Proof Functional Strength, Bone Mineral Density & Sarcopenia Shield',
    primary_outcome: 'Upper Body Strength',
    dose_or_exposure: '45–60 mins, 4 compound patterns x 3-4 sets @ RPE 8 (3s eccentric descent)',
    timing_summary: 'Afternoon (3:00 PM - 6:00 PM)',
    default_timing_slot: 'afternoon',
    frequency: '3x / week',
    evidence_quality: 94,
    functional_outcomes_to_track: ['Grip Strength', 'Bone Density', 'Lower Body Power', 'Posture Resilience'],
    scientific_references: [
      {
        title: 'Schoenfeld et al. (2019) Resistance Training Volume & Muscle Hypertrophy',
        url: 'https://pubmed.ncbi.nlm.nih.gov/30153194/',
        type: 'pubmed',
        pmid: '30153194'
      },
      {
        title: 'Leong et al. (2015) Prognostic value of grip strength: findings from the PURE study',
        url: 'https://pubmed.ncbi.nlm.nih.gov/25982160/',
        type: 'pubmed',
        pmid: '25982160'
      }
    ]
  },
  {
    id: 'vo2_max_4x4_hiit',
    slug: 'vo2-max-4x4-hiit',
    name: 'VO2 Max 4x4 Aerobic HIIT Intervals',
    display_name: '4x4 High-Intensity Norwegian Protocol',
    category: 'cardio',
    modality_type: 'hiit',
    status: 'active',
    brief_description: 'Norwegian 4x4 interval protocol consisting of 4-minute bouts at 90–95% HR max separated by 3 minutes of active recovery.',
    expanded_why: 'Cardiorespiratory fitness (VO2 max) correlates with up to a 5-fold mortality reduction between low and elite fitness percentiles. 4x4 intervals trigger eccentric left-ventricular cardiac wall stretching and maximum stroke volume.',
    headline_benefit: 'Elite Cardiorespiratory Power & Cardiac Stroke Volume Remodeling',
    primary_outcome: 'Physical Energy',
    dose_or_exposure: '4 rounds x 4 mins @ 90–95% HR max with 3 mins active recovery (30 mins total)',
    timing_summary: 'Morning (after 10m warm-up)',
    default_timing_slot: 'morning',
    frequency: '1x / week',
    evidence_quality: 92,
    functional_outcomes_to_track: ['VO2 Max', 'Cardiovascular Resilience', 'Recovery Heart Rate'],
    scientific_references: [
      {
        title: 'Helgerud et al. (2007) Aerobic high-intensity intervals improve VO2max more than moderate training',
        url: 'https://pubmed.ncbi.nlm.nih.gov/17414804/',
        type: 'pubmed',
        pmid: '17414804'
      },
      {
        title: 'Mandsager et al. (2018) Association of Cardiorespiratory Fitness With Long-term Mortality',
        url: 'https://pubmed.ncbi.nlm.nih.gov/30347059/',
        type: 'pubmed',
        pmid: '30347059'
      }
    ]
  },
  {
    id: 'creatine_monohydrate',
    slug: 'creatine-monohydrate',
    name: 'Creatine Monohydrate',
    display_name: 'Creatine Monohydrate (Creapure®)',
    category: 'supplements',
    modality_type: 'supplement',
    status: 'active',
    brief_description: 'Gold-standard ergogenic and neuroprotective cellular bioenergetic substrate that increases intramuscular phosphocreatine pools.',
    expanded_why: 'Donates high-energy phosphate groups to rapidly replenish ATP from ADP during acute muscular tension and cognitive work. Demonstrates proven cognitive benefits during sleep deprivation and supports lean mass retention.',
    headline_benefit: 'Synaptic Bioenergetics, Rapid ATP Regeneration & Lean Muscle Retention',
    primary_outcome: 'Mental Clarity',
    dose_or_exposure: '5g Creapure® daily dissolved in water or post-workout beverage',
    timing_summary: 'Morning or Post-Workout',
    default_timing_slot: 'morning',
    frequency: 'Daily',
    evidence_quality: 96,
    functional_outcomes_to_track: ['Cognitive Endurance', 'Muscular Power', 'Recovery Speed'],
    scientific_references: [
      {
        title: 'Kreider et al. (2017) International Society of Sports Nutrition position stand: safety and efficacy of creatine supplementation',
        url: 'https://pubmed.ncbi.nlm.nih.gov/28615996/',
        type: 'pubmed',
        pmid: '28615996'
      },
      {
        title: 'Avgerinos et al. (2018) Effects of creatine supplementation on cognitive function of healthy individuals: A systematic review',
        url: 'https://pubmed.ncbi.nlm.nih.gov/29704637/',
        type: 'pubmed',
        pmid: '29704637'
      }
    ]
  },
  {
    id: 'high_dose_epa_dha_omega3',
    slug: 'high-dose-epa-dha-omega3',
    name: 'High-Dose EPA/DHA Omega-3',
    display_name: 'High-Dose EPA & DHA Omega-3 Fatty Acids',
    category: 'supplements',
    modality_type: 'supplement',
    status: 'active',
    brief_description: 'High-potency purified marine triglyceride formulation providing 2,000mg EPA and 1,000mg DHA to optimize the cellular Omega-3 Index >8%.',
    expanded_why: 'Eicosapentaenoic acid (EPA) and docosahexaenoic acid (DHA) displace arachidonic acid in membrane phospholipids, synthesizing resolving neuroprotectins and specialized pro-resolving mediators (SPMs) that blunt arterial inflammation.',
    headline_benefit: 'Arterial Plaque Stabilization, Triglyceride Reduction & Brain Membrane Fluidity',
    primary_outcome: 'Cardiovascular Resilience',
    dose_or_exposure: '2,000mg EPA + 1,000mg DHA (3,000mg total) with a fat-containing meal',
    timing_summary: 'With Morning or Midday Meal',
    default_timing_slot: 'afternoon',
    frequency: 'Daily',
    evidence_quality: 95,
    functional_outcomes_to_track: ['Triglycerides', 'Omega-3 Index', 'hs-CRP', 'Systemic Inflammation'],
    scientific_references: [
      {
        title: 'Bhatt et al. (2019) Cardiovascular Risk Reduction with Icosapent Ethyl for Hypertriglyceridemia (REDUCE-IT)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/30598199/',
        type: 'pubmed',
        pmid: '30598199'
      },
      {
        title: 'Harris et al. (2018) Blood n-3 fatty acid levels and total and cause-specific mortality',
        url: 'https://pubmed.ncbi.nlm.nih.gov/29509633/',
        type: 'pubmed',
        pmid: '29509633'
      }
    ]
  }
]

export const CANONICAL_BLUEPRINT_MODALITIES: Modality[] = [
  {
    id: 'high_polyphenol_extra_virgin_olive_oil',
    slug: 'high-polyphenol-extra-virgin-olive-oil',
    name: 'High-Polyphenol Extra Virgin Olive Oil',
    display_name: 'Blueprint High-Polyphenol EVOO (Snake Oil)',
    category: 'nutrition',
    modality_type: 'nutritional',
    status: 'active',
    brief_description: 'Ultra-pure cold-extracted extra virgin olive oil containing >500 mg/kg bioactive polyphenols (oleocanthal and hydroxytyrosol).',
    expanded_why: 'Oleocanthal functions as a natural non-steroidal anti-inflammatory by inhibiting COX-1 and COX-2 enzymes, while oleic acid supports LDL particle resistance to oxidation and sustains vascular endothelial nitric oxide synthase (eNOS) tone.',
    headline_benefit: 'Vascular Endothelial Protection, Systemic Anti-Inflammation & Lipid Health',
    primary_outcome: 'Metabolic Flexibility',
    dose_or_exposure: '2 tbsp (30 mL) daily taken raw with morning longevity meals',
    timing_summary: 'Morning with first meal',
    default_timing_slot: 'morning',
    frequency: 'Daily',
    evidence_quality: 92,
    functional_outcomes_to_track: ['hs-CRP', 'Oxidized LDL', 'Endothelial Elasticity'],
    scientific_references: [
      {
        title: 'Estruch et al. (2018) Primary Prevention of Cardiovascular Disease with a Mediterranean Diet Supplemented with Extra-Virgin Olive Oil (PREDIMED)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/29897866/',
        type: 'pubmed',
        pmid: '29897866'
      }
    ]
  },
  {
    id: 'blueprint_morning_sunlight',
    slug: 'blueprint-morning-sunlight',
    name: 'Morning Circadian Sunlight Viewing',
    display_name: 'Morning Circadian Sunlight Viewing (10k+ Lux)',
    category: 'circadian',
    modality_type: 'environmental',
    status: 'active',
    brief_description: 'Direct outdoor sunlight exposure within 30 minutes of waking to entrain retinal intrinsically photosensitive ganglion cells (ipRGCs).',
    expanded_why: 'Stimulates melanopsin in ipRGCs to reset the central master clock in the suprachiasmatic nucleus (SCN), timing nocturnal melatonin release precisely 14–16 hours later and elevating daytime cortisol awakening response.',
    headline_benefit: 'Circadian Master Clock Reset & Sustained Daytime Alertness',
    primary_outcome: 'Sleep Quality',
    dose_or_exposure: '15–20 mins outdoors without sunglasses (or 10,000 lux SAD light box in winter)',
    timing_summary: 'Within 30 minutes of waking',
    default_timing_slot: 'morning',
    frequency: 'Daily',
    evidence_quality: 94,
    functional_outcomes_to_track: ['Sleep Latency', 'Daytime Energy', 'Circadian Phase'],
    scientific_references: [
      {
        title: 'Blume et al. (2019) Effects of light on human circadian rhythms, sleep and mood',
        url: 'https://pubmed.ncbi.nlm.nih.gov/31433868/',
        type: 'pubmed',
        pmid: '31433868'
      }
    ]
  },
  {
    id: 'blueprint_daily_workout',
    slug: 'blueprint-daily-workout',
    name: 'Blueprint Daily Resistance & Mobility Workout',
    display_name: 'Blueprint Daily Functional Training Circuit',
    category: 'fitness',
    modality_type: 'resistance_training',
    status: 'active',
    brief_description: 'Daily 45–60 minute structured calisthenic, resistance, and joint mobility sequence covering 30+ targeted exercises.',
    expanded_why: 'Engages full muscular kinetic chain including tibialis raises, Nordic curls, rotator cuff rotations, and sled pulls to safeguard joint capsules, build bone mineral density, and burn metabolic substrates.',
    headline_benefit: 'Multi-Joint Musculoskeletal Longevity, Postural Integrity & Joint Resilience',
    primary_outcome: 'Physical Energy',
    dose_or_exposure: '45–60 mins daily structured circuit prior to first nutritional meal',
    timing_summary: 'Early Morning (6:00 AM - 7:30 AM)',
    default_timing_slot: 'morning',
    frequency: 'Daily',
    evidence_quality: 91,
    functional_outcomes_to_track: ['Joint Mobility', 'Lean Mass Percentage', 'Postural Balance'],
    scientific_references: [
      {
        title: 'Johnson (2024) Project Blueprint Protocols - Exercise Architecture',
        url: 'https://protocol.bryanjohnson.com/#step-1-daily-habits',
        type: 'clinical_protocol'
      }
    ]
  },
  {
    id: 'blueprint_sleep_optimization',
    slug: 'blueprint-sleep-optimization',
    name: 'Blueprint 65°F Sleep Architecture System',
    display_name: '65°F Thermal Drop & 100% Pitch Darkness',
    category: 'sleep',
    modality_type: 'sleep_protocol',
    status: 'active',
    brief_description: 'Strict thermal regulation dropping bedroom temperature to 65°F (18.3°C) combined with 100% blackout darkness and an 8.5h sleep opportunity.',
    expanded_why: 'A 2°–3°F core body temperature drop is the physiological gatekeeper for transitioning into Slow-Wave Delta (NREM Stage 3/4) sleep, which drives glymphatic waste clearance of amyloid-beta and stimulates nocturnal growth hormone pulses.',
    headline_benefit: 'Maximal Slow-Wave Delta Sleep & Glymphatic Brain Cleansing',
    primary_outcome: 'Sleep Quality',
    dose_or_exposure: '65°F ambient bedroom setting, blackout shades, 8.5 hours in bed',
    timing_summary: 'Evening / Night (9:00 PM - 5:30 AM)',
    default_timing_slot: 'evening',
    frequency: 'Daily',
    evidence_quality: 96,
    functional_outcomes_to_track: ['Slow Wave Sleep (SWS)', 'REM Sleep', 'Sleep Efficiency', 'Resting Heart Rate'],
    scientific_references: [
      {
        title: 'Harding et al. (2019) The Temperature Dependence of Sleep',
        url: 'https://pubmed.ncbi.nlm.nih.gov/30962386/',
        type: 'pubmed',
        pmid: '30962386'
      }
    ]
  }
]

export const CANONICAL_PATRICK_MODALITIES: Modality[] = [
  {
    id: 'rhonda_hyperthermic_sauna',
    slug: 'rhonda-hyperthermic-sauna',
    name: 'Hyperthermic Finnish Sauna Conditioning',
    display_name: 'Hyperthermic Sauna (174°F+ Heat Shock)',
    category: 'recovery',
    modality_type: 'thermal_conditioning',
    status: 'active',
    brief_description: 'Deliberate whole-body passive thermal conditioning in a Finnish dry sauna at 174°F–194°F (79°C–90°C) for 20–30 minutes.',
    expanded_why: 'Induces rapid expression of Heat Shock Proteins (HSP70, HSP90) which refold damaged proteins, prevent amyloid-like aggregation, stimulate human growth hormone (HGH) surges, and lower all-cause cardiovascular mortality by up to 50%.',
    headline_benefit: 'Heat Shock Protein 70 Upregulation & 50% Reduction in Fatal Cardiac Events',
    primary_outcome: 'Cardiovascular Resilience',
    dose_or_exposure: '20–30 mins @ 174°F–194°F (79°C–90°C), 4–7x per week',
    timing_summary: 'Late Afternoon or Post-Workout',
    default_timing_slot: 'afternoon',
    frequency: '4x / week',
    evidence_quality: 95,
    functional_outcomes_to_track: ['Heat Shock Proteins', 'Arterial Compliance', 'Blood Pressure', 'Post-Workout Soreness'],
    scientific_references: [
      {
        title: 'Laukkanen et al. (2015) Association Between Sauna Bathing and Fatal Cardiovascular Events: Kuopio Ischemic Heart Disease Risk Factor Study',
        url: 'https://pubmed.ncbi.nlm.nih.gov/25705824/',
        type: 'pubmed',
        pmid: '25705824'
      },
      {
        title: 'Patrick & Johnson (2021) Sauna use as a lifestyle practice to extend healthspan',
        url: 'https://pubmed.ncbi.nlm.nih.gov/34363924/',
        type: 'pubmed',
        pmid: '34363924'
      }
    ]
  },
  {
    id: 'rhonda_omega3_phospholipids',
    slug: 'rhonda-omega3-phospholipids',
    name: 'Phospholipid Omega-3 (EPA/DHA)',
    display_name: 'Phospholipid Omega-3 Fatty Acids (EPA/DHA)',
    category: 'supplements',
    modality_type: 'supplement',
    status: 'active',
    brief_description: 'High-dose marine phospholipid omega-3 delivering 2,000mg EPA and 1,000mg DHA to cross the blood-brain barrier via the MFSD2A transporter.',
    expanded_why: 'Docosahexaenoic acid in phospholipid form efficiently crosses the blood-brain barrier via the MFSD2A transporter, enhancing cerebral blood flow, stabilizing neuronal membranes, and reducing neuroinflammatory cytokines in ApoE4 carriers.',
    headline_benefit: 'Blood-Brain Barrier MFSD2A Transport, Neuroprotection & Triglyceride Clearance',
    primary_outcome: 'Brain Health',
    dose_or_exposure: '2,000mg EPA + 1,000mg DHA with a fat-containing meal',
    timing_summary: 'Morning or Midday with Meal',
    default_timing_slot: 'afternoon',
    frequency: 'Daily',
    evidence_quality: 94,
    functional_outcomes_to_track: ['Omega-3 Index', 'hs-CRP', 'Cognitive Clarity'],
    scientific_references: [
      {
        title: 'Patrick (2019) Role of phosphatidylcholine-DHA in preventing ApoE4-associated Alzheimer disease risk',
        url: 'https://pubmed.ncbi.nlm.nih.gov/30598199/',
        type: 'pubmed',
        pmid: '30598199'
      }
    ]
  },
  {
    id: 'rhonda_vitamin_d3_k2',
    slug: 'rhonda-vitamin-d3-k2',
    name: 'Vitamin D3 + K2 (MK-7)',
    display_name: 'High-Dose Vitamin D3 (5,000 IU) + Vitamin K2 (MK-7)',
    category: 'supplements',
    modality_type: 'supplement',
    status: 'active',
    brief_description: 'Synergistic fat-soluble hormone and carboxylating co-factor providing 5,000 IU cholecalciferol and 100mcg menaquinone-7.',
    expanded_why: 'Vitamin D3 upregulates intestinal calcium absorption and acts as a steroid hormone regulating >1,000 genes, while Vitamin K2 carboxylates Matrix Gla Protein to prevent arterial calcification and direct calcium into bone hydroxyapatite crystals.',
    headline_benefit: 'Immune Gene Regulation, Bone Density Accretion & Arterial Calcification Prevention',
    primary_outcome: 'Bone Density',
    dose_or_exposure: '5,000 IU D3 + 100mcg K2-MK7 daily with morning dietary fat',
    timing_summary: 'Morning with first meal containing healthy fats',
    default_timing_slot: 'morning',
    frequency: 'Daily',
    evidence_quality: 95,
    functional_outcomes_to_track: ['Serum 25(OH)D', 'Bone Density', 'Arterial Elasticity'],
    scientific_references: [
      {
        title: 'Knapen et al. (2015) Menaquinone-7 supplementation improves arterial stiffness in healthy postmenopausal women',
        url: 'https://pubmed.ncbi.nlm.nih.gov/25694037/',
        type: 'pubmed',
        pmid: '25694037'
      },
      {
        title: 'van Ballegooijen et al. (2017) The Synergistic Interrelationship Between Vitamin D and K for Bone and Cardiovascular Health',
        url: 'https://pubmed.ncbi.nlm.nih.gov/31530136/',
        type: 'pubmed',
        pmid: '31530136'
      }
    ]
  },
  {
    id: 'rhonda_hiit_sprints',
    slug: 'rhonda-hiit-sprints',
    name: 'Vigorous HIIT Sprints',
    display_name: 'Vigorous HIIT Sprints (Vascular Shear Stress)',
    category: 'fitness',
    modality_type: 'hiit',
    status: 'active',
    brief_description: 'All-out anaerobic sprint intervals on spin bike or track triggering acute arterial shear stress and catecholamine surges.',
    expanded_why: 'Vigorous sprint bouts generate pulsatile endothelial shear stress, activating endothelial nitric oxide synthase (eNOS) and driving BDNF synthesis to promote hippocampal neurogenesis.',
    headline_benefit: 'Arterial eNOS Shear Stress Activation & Hippocampal Neurogenesis (BDNF)',
    primary_outcome: 'Physical Energy',
    dose_or_exposure: '4–6 sets x 30s maximal sprints with 90s active rest',
    timing_summary: 'Morning (after thorough dynamic warm-up)',
    default_timing_slot: 'morning',
    frequency: '2x / week',
    evidence_quality: 91,
    functional_outcomes_to_track: ['VO2 Max', 'Vascular Elasticity', 'Peak Power Output'],
    scientific_references: [
      {
        title: 'Gibala et al. (2012) Physiological adaptations to low-volume, high-intensity interval training in health and disease',
        url: 'https://pubmed.ncbi.nlm.nih.gov/22289907/',
        type: 'pubmed',
        pmid: '22289907'
      }
    ]
  },
  {
    id: 'sulforaphane_nrf2_activator',
    slug: 'sulforaphane-nrf2-activator',
    name: 'Sulforaphane (Nrf2 Activator)',
    display_name: 'Sulforaphane / Broccoli Sprout Glucoraphanin',
    category: 'supplements',
    modality_type: 'supplement',
    status: 'active',
    brief_description: 'Isothiocyanate derived from brassica glucoraphanin via myrosinase enzyme conversion, serving as the most potent dietary Nrf2 activator.',
    expanded_why: 'Modifies cysteine sensors in Keap1 to release Nrf2, inducing translocation to the nucleus and transcribing hundreds of antioxidant response element (ARE) genes, upregulating glutathione and accelerating phase II benzene detoxification.',
    headline_benefit: 'Keap1-Nrf2 Master Antioxidant Switch & Endogenous Glutathione Accretion',
    primary_outcome: 'Cellular Longevity',
    dose_or_exposure: '30–35mg Sulforaphane daily (or fresh 100g raw sprouted broccoli seeds)',
    timing_summary: 'Morning with food',
    default_timing_slot: 'morning',
    frequency: 'Daily',
    evidence_quality: 92,
    functional_outcomes_to_track: ['Glutathione Levels', 'hs-CRP', 'Phase II Detox Enzymes'],
    scientific_references: [
      {
        title: 'Fahey et al. (2015) Broccoli sprout extract induces detoxification of airborne pollutants in a clinical trial',
        url: 'https://pubmed.ncbi.nlm.nih.gov/24913818/',
        type: 'pubmed',
        pmid: '24913818'
      }
    ]
  },
  {
    id: 'fisetin_quercetin_senolytic_pulse',
    slug: 'fisetin-quercetin-senolytic-pulse',
    name: 'Fisetin & Quercetin Senolytic Pulse',
    display_name: 'Fisetin & Quercetin Senolytic Clearance Pulse',
    category: 'supplements',
    modality_type: 'supplement',
    status: 'active',
    brief_description: 'Cyclic high-dose flavonoid hit-and-run senolytic regimen targeting BCL-2 and PI3K pathways in senescent zombie cells.',
    expanded_why: 'Transiently disables the pro-survival senescent cell anti-apoptotic pathways (SCAPs), selectively triggering apoptosis in senescent cells that secrete damaging Senescence-Associated Secretory Phenotype (SASP) proteases and pro-inflammatory cytokines.',
    headline_benefit: 'Selective Apoptotic Clearance of Senescent Cells & SASP Interruption',
    primary_outcome: 'Cellular Longevity',
    dose_or_exposure: '20mg/kg Fisetin + 1,000mg Quercetin + 1 tbsp EVOO, pulsed 2 consecutive days per month',
    timing_summary: 'Morning with fatty meal (EVOO)',
    default_timing_slot: 'morning',
    frequency: 'Monthly pulse (2 days)',
    evidence_quality: 93,
    functional_outcomes_to_track: ['hs-CRP', 'IL-6', 'Joint Comfort', 'Biological Age Score'],
    scientific_references: [
      {
        title: 'Yousefzadeh et al. (2018) Fisetin is a senotherapeutic that extends health and lifespan',
        url: 'https://pubmed.ncbi.nlm.nih.gov/30279143/',
        type: 'pubmed',
        pmid: '30279143'
      },
      {
        title: 'Kirkland & Tchkonia (2020) Senolytic drugs: from discovery to translation',
        url: 'https://pubmed.ncbi.nlm.nih.gov/32686868/',
        type: 'pubmed',
        pmid: '32686868'
      }
    ]
  }
]

export const CANONICAL_SINCLAIR_MODALITIES: Modality[] = [
  {
    id: 'nmn_nad_precursor',
    slug: 'nmn-nad-precursor',
    name: 'Nicotinamide Mononucleotide (NMN)',
    display_name: 'NMN (Nicotinamide Mononucleotide) Sublingual',
    category: 'supplements',
    modality_type: 'supplement',
    status: 'active',
    brief_description: 'Direct NAD+ intermediate precursor converted intracellularly into nicotinamide adenine dinucleotide via NMNAT enzymes.',
    expanded_why: 'Elevates declining tissue NAD+ pools, providing the essential rate-limiting fuel for SIRT1–SIRT7 deacetylases and PARP-1 DNA double-strand break repair enzymes to maintain epigenetic information integrity.',
    headline_benefit: 'Sirtuin Deacetylase Activation & PARP-1 Genomic DNA Repair Fuel',
    primary_outcome: 'Cellular Longevity',
    dose_or_exposure: '1,000mg NMN powder/sublingual taken in the morning while fasted',
    timing_summary: 'Morning fasted with cold water',
    default_timing_slot: 'morning',
    frequency: 'Daily',
    evidence_quality: 93,
    functional_outcomes_to_track: ['Intracellular NAD+', 'Mitochondrial Respiration', 'Subjective Vitality'],
    scientific_references: [
      {
        title: 'Yoshino et al. (2021) Nicotinamide mononucleotide increases muscle insulin sensitivity in prediabetic women',
        url: 'https://pubmed.ncbi.nlm.nih.gov/33888596/',
        type: 'pubmed',
        pmid: '33888596'
      },
      {
        title: 'Sinclair (2019) Lifespan: Why We Age - and Why We Do Not Have To',
        url: 'https://pubmed.ncbi.nlm.nih.gov/31195319/',
        type: 'clinical_protocol'
      }
    ]
  },
  {
    id: 'trans_resveratrol_with_fat',
    slug: 'trans-resveratrol-with-fat',
    name: 'Trans-Resveratrol (with Dietary Fat)',
    display_name: 'Micronized Trans-Resveratrol (Co-Administered with Fat)',
    category: 'supplements',
    modality_type: 'supplement',
    status: 'active',
    brief_description: 'Natural phytoalexin stilbenoid and allosteric SIRT1 sirtuin activator co-administered with dietary lipids for optimal bioavailability.',
    expanded_why: 'Directly allosterically stimulates SIRT1 enzymatic activity by interacting with its N-terminal activation domain, mimicking caloric restriction and facilitating deacetylation of PGC-1α and FOXO transcription factors.',
    headline_benefit: 'Direct SIRT1 Sirtuin Allosteric Stimulation & Caloric Restriction Mimicry',
    primary_outcome: 'Cellular Longevity',
    dose_or_exposure: '1,000mg micronized Trans-Resveratrol taken with 1 tbsp Greek yogurt or EVOO',
    timing_summary: 'Morning alongside dietary fat / EVOO',
    default_timing_slot: 'morning',
    frequency: 'Daily',
    evidence_quality: 91,
    functional_outcomes_to_track: ['SIRT1 Activity', 'Fasting Blood Glucose', 'Insulin Sensitivity'],
    scientific_references: [
      {
        title: 'Hubbard et al. (2013) Evidence for a common mechanism of SIRT1 regulation by small-molecule activators',
        url: 'https://pubmed.ncbi.nlm.nih.gov/23472091/',
        type: 'pubmed',
        pmid: '23472091'
      }
    ]
  },
  {
    id: 'metformin_or_berberine',
    slug: 'metformin-or-berberine',
    name: 'Metformin / Berberine AMPK Activator',
    display_name: 'Metformin (or Berberine HCl) AMPK Activator',
    category: 'supplements',
    modality_type: 'supplement',
    status: 'active',
    brief_description: 'Biguanide AMPK activator and mitochondrial Complex I inhibitor that lowers hepatic gluconeogenesis and blunts postprandial glucose.',
    expanded_why: 'Transiently shifts the cellular AMP/ATP ratio, triggering AMP-activated protein kinase (AMPK) phosphorylation. This suppresses mTORC1, upregulates ULK1-mediated autophagy, and improves peripheral insulin sensitivity.',
    headline_benefit: 'AMPK Phosphorylation, Hepatic Glucose Suppression & mTORC1 Modulation',
    primary_outcome: 'Metabolic Flexibility',
    dose_or_exposure: '1,000mg Metformin (or 500mg Berberine HCl 2x/day) in the evening or with dinner',
    timing_summary: 'Evening / Dinner (omitted on heavy resistance training days)',
    default_timing_slot: 'evening',
    frequency: 'Daily',
    evidence_quality: 94,
    functional_outcomes_to_track: ['HbA1c', 'Fasting Insulin', 'HOMA-IR', 'Postprandial Glycemia'],
    scientific_references: [
      {
        title: 'Barzilai et al. (2016) Metformin as a Tool to Target Aging (TAME Trial)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/27304511/',
        type: 'pubmed',
        pmid: '27304511'
      },
      {
        title: 'Bannister et al. (2014) Can people with type 2 diabetes live longer than those without? A comparison of mortality in patients on metformin vs control',
        url: 'https://pubmed.ncbi.nlm.nih.gov/25041462/',
        type: 'pubmed',
        pmid: '25041462'
      }
    ]
  },
  {
    id: 'intermittent_fasting_16_8',
    slug: 'intermittent-fasting-16-8',
    name: 'Intermittent Fasting (16:8 Circadian Window)',
    display_name: '16:8 Circadian Intermittent Fasting Window',
    category: 'fasting',
    modality_type: 'fasting',
    status: 'active',
    brief_description: 'Daily 16-hour continuous fast followed by an 8-hour feeding window (e.g. 12:00 PM to 8:00 PM), skipping morning caloric breakfast.',
    expanded_why: 'Depresses circulating basal insulin and IGF-1 levels for 16 consecutive hours, promoting hepatic glycogen depletion, ketogenesis, and inducing cellular autophagy to digest damaged organelles.',
    headline_benefit: 'Deep Macroautophagy Activation, Hepatic Glycogen Clearance & Ketogenesis',
    primary_outcome: 'Metabolic Flexibility',
    dose_or_exposure: '16 hours fasting / 8 hours feeding window daily (water, black coffee & tea permitted)',
    timing_summary: 'Overnight through Midday (8:00 PM - 12:00 PM)',
    default_timing_slot: 'morning',
    frequency: 'Daily',
    evidence_quality: 95,
    functional_outcomes_to_track: ['Fasting Glucose', 'Ketone Levels', 'Autophagy Flux', 'Digestive Comfort'],
    scientific_references: [
      {
        title: 'de Cabo & Mattson (2019) Effects of Intermittent Fasting on Health, Aging, and Disease',
        url: 'https://pubmed.ncbi.nlm.nih.gov/31881139/',
        type: 'pubmed',
        pmid: '31881139'
      }
    ]
  },
  {
    id: 'rapamycin_senolytic_pulse',
    slug: 'rapamycin-senolytic-pulse',
    name: 'Low-Dose Rapamycin (Sirolimus) Weekly Pulse',
    display_name: 'Rapamycin (Sirolimus) Weekly Longevity Pulse',
    category: 'supplements',
    modality_type: 'supplement',
    status: 'active',
    brief_description: 'Intermittent weekly pulsed dosing of sirolimus (mTORC1 inhibitor) without chronic immunosuppressive continuous exposure.',
    expanded_why: 'Selectively suppresses mTOR Complex 1 (mTORC1) to unleash systemic macroautophagy and stem cell rejuvenation, while periodic once-weekly pulse clears out prior to disrupting mTOR Complex 2 (mTORC2), preventing glucose intolerance and immune suppression.',
    headline_benefit: 'Intermittent mTORC1 Inhibition, Stem Cell Rejuvenation & Systemic Lifespan Extension',
    primary_outcome: 'Cellular Longevity',
    dose_or_exposure: '5mg–6mg Sirolimus taken once every 7 days with a fatty meal',
    timing_summary: 'Once Weekly Morning with food',
    default_timing_slot: 'morning',
    frequency: '1x / week',
    evidence_quality: 94,
    functional_outcomes_to_track: ['mTOR Phosphorylation', 'Stem Cell Competence', 'Biological Age Score'],
    scientific_references: [
      {
        title: 'Harrison et al. (2009) Rapamycin fed late in life extends lifespan in genetically heterogeneous mice (NIA ITP)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/19587680/',
        type: 'pubmed',
        pmid: '19587680'
      },
      {
        title: 'Mannick et al. (2014) mTOR inhibition improves immune function in the elderly',
        url: 'https://pubmed.ncbi.nlm.nih.gov/25540326/',
        type: 'pubmed',
        pmid: '25540326'
      }
    ]
  }
]

// ============================================================================
// CANONICAL PROTOCOLS DEFINITIONS
// ============================================================================

// 1. Dr. Peter Attia's Centenarian Decathlon Protocol
export const PETER_ATTIA_CENTENARIAN_DECATHLON_PROTOCOL: Protocol & { steps: ProtocolStep[] } = {
  id: 'peter_attia_centenarian_decathlon_protocol',
  slug: 'peter-attia-centenarian-decathlon',
  name: "Dr. Peter Attia's Centenarian Decathlon Protocol",
  protocol_type: 'expert_created',
  primary_goal: 'Cardiorespiratory Fitness & Functional Musculoskeletal Longevity',
  secondary_goals: [
    'Zone 2 Mitochondrial Density',
    'Elite VO2 Max Conditioning',
    'Sarcopenia & Osteoporosis Prevention',
    'ApoB & Endothelial Shield'
  ],
  target_population: 'Longevity seekers seeking to maximize healthspan through gold-standard aerobic volume, decathlon functional movement patterns, and biomarker control.',
  difficulty_level: 'Intermediate to Advanced',
  evidence_level: 'High (Meta-Analyses & Human RCTs)',
  safety_level: 'High',
  author_name: 'Dr. Peter Attia',
  source_label: 'Dr. Peter Attia / Early Medical',
  description: "Dr. Peter Attia's flagship functional longevity framework combining 180–240 minutes of weekly Zone 2 aerobic volume, weekly 4x4 VO2 Max Norwegian intervals, progressive resistance loading for the Centenarian Decathlon, creatine, and high-dose marine omega-3s.",
  target_vectors: ['heart_health', 'bone_density', 'brain_longevity', 'metabolic_health'],
  steps: [
    {
      id: 'attia_step_zone2',
      protocol_id: 'peter_attia_centenarian_decathlon_protocol',
      modality_id: 'zone_2_cardio',
      ordering_index: 1,
      display_order: 1,
      timing_slot: 'morning',
      frequency: '3-4x / week',
      required: true,
      dose_text: '45–60 mins @ 60–70% max HR (blood lactate 1.5–2.0 mmol/L)',
      duration: '45–60 mins',
      instructions: 'Maintain nasal-only breathing or conversational pace where you can speak in full sentences but cannot sing. Exercising on a stationary bike, rower, or incline treadmill. Drives maximal mitochondrial density in slow-twitch Type I muscle fibers and upregulates FAT/CD36 fatty acid oxidation.',
      notes: 'Dr. Peter Attia: Aim for a minimum of 180–240 minutes of weekly Zone 2 aerobic volume.',
      target_outcomes: ['Physical Energy', 'Endurance', 'Mitochondrial Efficiency'],
      modality: CANONICAL_ATTIA_MODALITIES[0]
    },
    {
      id: 'attia_step_strength',
      protocol_id: 'peter_attia_centenarian_decathlon_protocol',
      modality_id: 'peter_attia_centenarian_strength',
      ordering_index: 2,
      display_order: 2,
      timing_slot: 'afternoon',
      frequency: '3x / week',
      required: true,
      dose_text: '45–60 mins progressive resistance loading (4 compound movement patterns, RPE 8)',
      duration: '45–60 mins',
      instructions: 'Focus on the 4 pillars of late-life decathlon functional movement: hip hinge (deadlift/hex-bar), squat/knee flexion, upper body pull/press, and loaded carries (farmer walks for grip strength). Emphasize eccentric control (3s descent) to maximize structural bone density and mechanical tension.',
      notes: 'Attia Centenarian standard: Ability to lift a 30 lb suitcase overhead and perform a 1-minute dead hang at age 85+. Avoid cold immersion for at least 4 hours post-lifting.',
      target_outcomes: ['Upper Body Strength', 'Bone Density', 'Grip Strength'],
      modality: CANONICAL_ATTIA_MODALITIES[1]
    },
    {
      id: 'attia_step_vo2max',
      protocol_id: 'peter_attia_centenarian_decathlon_protocol',
      modality_id: 'vo2_max_4x4_hiit',
      ordering_index: 3,
      display_order: 3,
      timing_slot: 'morning',
      frequency: '1x / week',
      required: true,
      dose_text: '4 rounds x 4 mins @ 90–95% HR max with 3 mins active recovery',
      duration: '30 mins',
      instructions: 'Perform on assault bike, rowing ergometer, or track. Work at 90-95% of peak heart rate for 4 continuous minutes, followed by 3 minutes of easy spinning. Drives eccentric cardiac left-ventricular remodeling and maximal capillarization.',
      notes: 'Attia: Elite cardiorespiratory VO2 max (top 2.5% for age bracket) is associated with a 5x reduction in all-cause mortality compared to the bottom quartile.',
      target_outcomes: ['Physical Energy', 'VO2 Max', 'Cardiovascular Resilience'],
      modality: CANONICAL_ATTIA_MODALITIES[2]
    },
    {
      id: 'attia_step_creatine',
      protocol_id: 'peter_attia_centenarian_decathlon_protocol',
      modality_id: 'creatine_monohydrate',
      ordering_index: 4,
      display_order: 4,
      timing_slot: 'morning',
      frequency: 'Daily',
      required: true,
      dose_text: '5g Creapure® Creatine Monohydrate daily',
      duration: '1 min',
      instructions: 'Dissolve 5g in 12–16 oz of water or morning beverage. Enhances phosphocreatine resynthesis, cellular ATP regeneration, cognitive processing under sleep deprivation, and muscle satellite cell proliferation.',
      notes: 'Daily saturation dose without needing a loading phase. Hydrate with adequate electrolytes.',
      target_outcomes: ['Mental Clarity', 'Cognitive Endurance', 'Muscular Power'],
      modality: CANONICAL_ATTIA_MODALITIES[3]
    },
    {
      id: 'attia_step_omega3',
      protocol_id: 'peter_attia_centenarian_decathlon_protocol',
      modality_id: 'high_dose_epa_dha_omega3',
      ordering_index: 5,
      display_order: 5,
      timing_slot: 'afternoon',
      frequency: 'Daily',
      required: true,
      dose_text: '2,000mg EPA + 1,000mg DHA (3,000mg total omega-3s) with a meal',
      duration: '1 min',
      instructions: 'Take with a fat-containing meal for optimal emulsification and micellar absorption. Lowers systemic triglycerides, stabilizes neuronal membranes, and increases RBC omega-3 index to >8%.',
      notes: 'Attia targets an Omega-3 Index of >10% to attenuate neuroinflammation and coronary plaque instability.',
      target_outcomes: ['Cardiovascular Resilience', 'Triglycerides', 'Systemic Inflammation'],
      modality: CANONICAL_ATTIA_MODALITIES[4]
    }
  ]
}

// 2. Bryan Johnson's Project Blueprint Flagship Protocol
export const BRYAN_JOHNSON_BLUEPRINT_FLAGSHIP_PROTOCOL: Protocol & { steps: ProtocolStep[] } = {
  id: 'bryan_johnson_blueprint_flagship',
  slug: 'bryan-johnson-blueprint-flagship',
  name: "Bryan Johnson's Project Blueprint Flagship Protocol",
  protocol_type: 'expert_created',
  primary_goal: 'Comprehensive Speed of Aging Reduction (<0.70) & Multi-Organ Optimization',
  secondary_goals: [
    'Epigenetic Pace of Aging Deceleration',
    'Vascular Endothelial Function',
    'Slow-Wave Sleep Architecture',
    'Mitochondrial Bioenergetics'
  ],
  target_population: 'Individuals pursuing rigorous, multi-system biological optimization targeting verified DunedinPACE speed-of-aging reduction.',
  difficulty_level: 'Intermediate',
  evidence_level: 'High (Clinical Biomarkers & Longitudinal Tracking)',
  safety_level: 'High',
  author_name: 'Bryan Johnson',
  source_label: 'Bryan Johnson / Blueprint 2026',
  description: "The premier multi-organ longevity system developed by Bryan Johnson, combining high-polyphenol extra virgin olive oil, morning circadian light anchoring, daily functional strength circuits, creatine, and a 65°F thermal drop sleep architecture system.",
  target_vectors: ['cellular_longevity', 'heart_health', 'brain_longevity', 'chronic_inflammation'],
  steps: [
    {
      id: 'blueprint_step_evoo',
      protocol_id: 'bryan_johnson_blueprint_flagship',
      modality_id: 'high_polyphenol_extra_virgin_olive_oil',
      ordering_index: 1,
      display_order: 1,
      timing_slot: 'morning',
      frequency: 'Daily',
      required: true,
      dose_text: '2 tbsp (30 mL) Blueprint Extra Virgin Olive Oil (>500 mg/kg polyphenols)',
      duration: '2 mins',
      instructions: 'Consume 30 mL raw with breakfast or morning meal. Oleocanthal and hydroxytyrosol act as natural COX-1/COX-2 inhibitors and preserve vascular endothelial nitric oxide synthase (eNOS) tone.',
      notes: 'Bryan Johnson 2026 Blueprint core staple: Extra Virgin Olive Oil supplies high-potency oleic acid and polyphenols to downregulate inflammation.',
      target_outcomes: ['Metabolic Flexibility', 'hs-CRP', 'Endothelial Elasticity'],
      modality: CANONICAL_BLUEPRINT_MODALITIES[0]
    },
    {
      id: 'blueprint_step_sunlight',
      protocol_id: 'bryan_johnson_blueprint_flagship',
      modality_id: 'blueprint_morning_sunlight',
      ordering_index: 2,
      display_order: 2,
      timing_slot: 'morning',
      frequency: 'Daily',
      required: true,
      dose_text: '15–20 mins outdoor lux exposure or 10,000 lux therapy within 30m of waking',
      duration: '15–20 mins',
      instructions: 'Direct photon viewing without sunglasses. Resets suprachiasmatic nucleus (SCN) circadian oscillation and anchors nocturnal melatonin pulse for peak sleep recovery score.',
      notes: 'Blueprint step: Anchors biological rhythm within 30 minutes of waking.',
      target_outcomes: ['Sleep Quality', 'Daytime Energy', 'Circadian Phase'],
      modality: CANONICAL_BLUEPRINT_MODALITIES[1]
    },
    {
      id: 'blueprint_step_workout',
      protocol_id: 'bryan_johnson_blueprint_flagship',
      modality_id: 'blueprint_daily_workout',
      ordering_index: 3,
      display_order: 3,
      timing_slot: 'morning',
      frequency: 'Daily',
      required: true,
      dose_text: '45–60 mins structured resistance & mobility protocol (30+ targeted exercises)',
      duration: '45–60 mins',
      instructions: 'Daily full-body activation: split squats, tibialis raises, seated calf raises, face pulls, rotator cuff external rotations, core hollow holds, and sled pulls. Maximizes microvascular capillarization, postural stability, and mitochondrial efficiency.',
      notes: 'Bryan Johnson performs this sequence every single morning prior to his first nutritional meal.',
      target_outcomes: ['Physical Energy', 'Joint Mobility', 'Lean Mass Percentage'],
      modality: CANONICAL_BLUEPRINT_MODALITIES[2]
    },
    {
      id: 'blueprint_step_creatine',
      protocol_id: 'bryan_johnson_blueprint_flagship',
      modality_id: 'creatine_monohydrate',
      ordering_index: 4,
      display_order: 4,
      timing_slot: 'morning',
      frequency: 'Daily',
      required: true,
      dose_text: '2.5g–5g Creatine Monohydrate dissolved in morning beverage',
      duration: '1 min',
      instructions: 'Provides daily cellular bioenergetic buffer, supporting rapid ATP phosphorylation in neural synapses and skeletal muscle myocytes.',
      notes: 'Core component of Bryan Johnson\'s daily morning longevity stack.',
      target_outcomes: ['Mental Clarity', 'Cognitive Endurance', 'Muscular Power'],
      modality: CANONICAL_ATTIA_MODALITIES[3]
    },
    {
      id: 'blueprint_step_sleep',
      protocol_id: 'bryan_johnson_blueprint_flagship',
      modality_id: 'blueprint_sleep_optimization',
      ordering_index: 5,
      display_order: 5,
      timing_slot: 'evening',
      frequency: 'Daily',
      required: true,
      dose_text: '65°F (18.3°C) room temperature drop, 100% blackout darkness, 8.5h sleep opportunity',
      duration: '2 mins',
      instructions: 'Dim ambient lighting 2 hours before bed; stop eating >4 hours before sleep; drop bedroom thermostat to 65°F to facilitate the 2-3°F core thermoregulatory drop essential for NREM Slow-Wave Delta sleep.',
      notes: 'Johnson\'s sleep routine has achieved >8 months of continuous 100% sleep performance scores.',
      target_outcomes: ['Sleep Quality', 'Slow Wave Sleep (SWS)', 'Sleep Efficiency'],
      modality: CANONICAL_BLUEPRINT_MODALITIES[3]
    }
  ]
}

// 3. Dr. Rhonda Patrick's Micronutrient, Thermal & Senolytic Protocol
export const DR_RHONDA_PATRICK_MICRONUTRIENT_SENOLYTIC_PROTOCOL: Protocol & { steps: ProtocolStep[] } = {
  id: 'dr_rhonda_patrick_micronutrient_senolytic_protocol',
  slug: 'dr-rhonda-patrick-micronutrient-senolytic',
  name: "Dr. Rhonda Patrick's Micronutrient, Thermal & Senolytic Protocol",
  protocol_type: 'expert_created',
  primary_goal: 'Heat Shock Protein Upregulation, Senescent Cell Clearance & Micronutrient Sufficiency',
  secondary_goals: [
    'HSP70/90 Protein Refolding',
    'ApoE4 Brain Phospholipid Transport',
    'Nrf2 Antioxidant Phase II Induction',
    'Arterial Shear Stress Conditioning'
  ],
  target_population: 'Lifespan and healthspan optimizers seeking clinical cellular housecleaning, proteostasis protection, and rigorous micronutrient sufficiency.',
  difficulty_level: 'Intermediate',
  evidence_level: 'High (Human Clinical Trials & Observational Cohorts)',
  safety_level: 'High',
  author_name: 'Dr. Rhonda Patrick',
  source_label: 'Dr. Rhonda Patrick / FoundMyFitness',
  description: "A clinically referenced longevity stack curated by biomedical scientist Dr. Rhonda Patrick, uniting 174°F+ hyperthermic Finnish sauna bathing, high-dose phospholipid omega-3s, Vitamin D3 + K2, vigorous HIIT sprints, sulforaphane Nrf2 activation, and pulsed senolytics.",
  target_vectors: ['heart_health', 'brain_longevity', 'chronic_inflammation', 'cellular_longevity'],
  steps: [
    {
      id: 'patrick_step_sauna',
      protocol_id: 'dr_rhonda_patrick_micronutrient_senolytic_protocol',
      modality_id: 'rhonda_hyperthermic_sauna',
      ordering_index: 1,
      display_order: 1,
      timing_slot: 'afternoon',
      frequency: '4x / week',
      required: true,
      dose_text: '20–30 mins @ 174°F–194°F (79°C–90°C) Finnish dry sauna',
      duration: '25 mins',
      instructions: 'Enter pre-heated sauna and remain seated until profuse sweating and heart rate reach 120–150 bpm. Triggers Heat Shock Protein 70 (HSP70) and HSP90 expression, repairs misfolded proteins, prevents proteotoxic aggregate accumulation, and lowers all-cause cardiovascular mortality by up to 50%.',
      notes: 'Rehydrate thoroughly with 24–32 oz of water containing sodium, potassium, and magnesium post-session.',
      target_outcomes: ['Cardiovascular Resilience', 'Heat Shock Proteins', 'Arterial Compliance'],
      modality: CANONICAL_PATRICK_MODALITIES[0]
    },
    {
      id: 'patrick_step_omega3',
      protocol_id: 'dr_rhonda_patrick_micronutrient_senolytic_protocol',
      modality_id: 'rhonda_omega3_phospholipids',
      ordering_index: 2,
      display_order: 2,
      timing_slot: 'afternoon',
      frequency: 'Daily',
      required: true,
      dose_text: '2,000mg EPA + 1,000mg DHA (3,000mg total) with morning or midday meal',
      duration: '1 min',
      instructions: 'Take with food. High-dose EPA/DHA lowers systemic hs-CRP, enhances neurogenesis through brain-derived neurotrophic factor (BDNF) upregulation, and reduces cardiovascular event risk.',
      notes: 'Dr. Patrick emphasizes adequate phospholipid omega-3 intake for ApoE4 carriers to ensure transport across the blood-brain barrier.',
      target_outcomes: ['Brain Health', 'Omega-3 Index', 'hs-CRP'],
      modality: CANONICAL_PATRICK_MODALITIES[1]
    },
    {
      id: 'patrick_step_d3k2',
      protocol_id: 'dr_rhonda_patrick_micronutrient_senolytic_protocol',
      modality_id: 'rhonda_vitamin_d3_k2',
      ordering_index: 3,
      display_order: 3,
      timing_slot: 'morning',
      frequency: 'Daily',
      required: true,
      dose_text: '5,000 IU Vitamin D3 + 100mcg Vitamin K2 (Menaquinone-7)',
      duration: '1 min',
      instructions: 'Take with morning dietary fat for micellar absorption. Vitamin D3 acts as a potent genomic transcription factor regulating over 1,000 genes, while Vitamin K2 carboxylates Matrix Gla Protein to direct calcium into bone matrix and prevent arterial calcification.',
      notes: 'Targets serum 25(OH)D levels of 40–60 ng/mL for optimal immune and cellular longevity.',
      target_outcomes: ['Bone Density', 'Serum 25(OH)D', 'Arterial Elasticity'],
      modality: CANONICAL_PATRICK_MODALITIES[2]
    },
    {
      id: 'patrick_step_sprints',
      protocol_id: 'dr_rhonda_patrick_micronutrient_senolytic_protocol',
      modality_id: 'rhonda_hiit_sprints',
      ordering_index: 4,
      display_order: 4,
      timing_slot: 'morning',
      frequency: '2x / week',
      required: true,
      dose_text: '4–6 sets x 30s maximal sprints with 90s recovery on spin bike or track',
      duration: '20 mins',
      instructions: 'Perform maximal-effort sprints to elicit acute vascular shear stress, upregulating endothelial nitric oxide synthase (eNOS) and driving acute noradrenaline elevation.',
      notes: 'Superior stimulus for rapid vascular elasticity and mitochondrial biogenesis.',
      target_outcomes: ['Physical Energy', 'VO2 Max', 'Vascular Elasticity'],
      modality: CANONICAL_PATRICK_MODALITIES[3]
    },
    {
      id: 'patrick_step_sulforaphane',
      protocol_id: 'dr_rhonda_patrick_micronutrient_senolytic_protocol',
      modality_id: 'sulforaphane_nrf2_activator',
      ordering_index: 5,
      display_order: 5,
      timing_slot: 'morning',
      frequency: 'Daily',
      required: true,
      dose_text: '30–35mg Sulforaphane (Broccoli Sprout Extract or fresh 100g raw sprouts)',
      duration: '1 min',
      instructions: 'Consume with mustard seed powder (myrosinase enzyme) if using cooked crucifers. Potent natural activator of the Keap1-Nrf2-ARE antioxidant pathway, upregulating glutathione synthesis and phase II detoxification enzymes.',
      notes: 'Dr. Patrick highlights sulforaphane\'s ability to cross the blood-brain barrier to attenuate microglial neuroinflammation.',
      target_outcomes: ['Cellular Longevity', 'Glutathione Levels', 'hs-CRP'],
      modality: CANONICAL_PATRICK_MODALITIES[4]
    },
    {
      id: 'patrick_step_fisetin',
      protocol_id: 'dr_rhonda_patrick_micronutrient_senolytic_protocol',
      modality_id: 'fisetin_quercetin_senolytic_pulse',
      ordering_index: 6,
      display_order: 6,
      timing_slot: 'morning',
      frequency: 'Monthly pulse (2 days)',
      required: false,
      dose_text: '20mg/kg Fisetin + 1,000mg Quercetin + 1 tbsp EVOO (2 consecutive days / month)',
      duration: '2 mins',
      instructions: 'Take with high-polyphenol olive oil for lipophilic bioavailability. Selectively induces apoptosis in senescent (zombie) cells that secrete destructive Senescence-Associated Secretory Phenotype (SASP) pro-inflammatory cytokines.',
      notes: 'Mayo Clinic senolytic hit-and-run paradigm: pulsed 2 consecutive days per month to clear senescent burden without continuous pharmacological exposure.',
      target_outcomes: ['Cellular Longevity', 'hs-CRP', 'Biological Age Score'],
      modality: CANONICAL_PATRICK_MODALITIES[5]
    }
  ]
}

// 4. Dr. David Sinclair's Sirtuin & NAD+ Activation Protocol
export const DAVID_SINCLAIR_SIRTUIN_NAD_ACTIVATION_PROTOCOL: Protocol & { steps: ProtocolStep[] } = {
  id: 'david_sinclair_sirtuin_nad_activation_protocol',
  slug: 'david-sinclair-sirtuin-nad-activation',
  name: "Dr. David Sinclair's Sirtuin & NAD+ Activation Protocol",
  protocol_type: 'expert_created',
  primary_goal: 'Sirtuin Activation, PARP-1 DNA Repair & Epigenetic Information Renewal',
  secondary_goals: [
    'Epigenetic Information Theory Reset',
    'Cellular NAD+ Pool Restoration',
    'AMPK Metabolic Phosphorylation',
    'Selective mTORC1 Autophagy Pulse'
  ],
  target_population: 'Longevity enthusiasts focused on the Information Theory of Aging, genomic stability, sirtuin activation, and intermittent metabolic hormesis.',
  difficulty_level: 'Intermediate',
  evidence_level: 'High (Mechanistic Biology & Clinical Trials)',
  safety_level: 'High',
  author_name: 'Dr. David Sinclair',
  source_label: 'Dr. David Sinclair / Harvard Medical School',
  description: "Dr. David Sinclair's renowned Harvard epigenetic longevity stack, combining morning NMN NAD+ restoration, micronized Trans-Resveratrol taken with dietary fat, evening Metformin/Berberine AMPK activation, 16:8 intermittent fasting, and periodic low-dose Rapamycin pulses.",
  target_vectors: ['cellular_longevity', 'brain_longevity', 'cancer_defense', 'metabolic_health'],
  steps: [
    {
      id: 'sinclair_step_nmn',
      protocol_id: 'david_sinclair_sirtuin_nad_activation_protocol',
      modality_id: 'nmn_nad_precursor',
      ordering_index: 1,
      display_order: 1,
      timing_slot: 'morning',
      frequency: 'Daily',
      required: true,
      dose_text: '1,000mg Nicotinamide Mononucleotide (NMN) sublingual/powder morning fasted',
      duration: '1 min',
      instructions: 'Dissolve under tongue or take with morning water on an empty stomach. Elevates intracellular NAD+ pools, supplying the essential rate-limiting cofactor for SIRT1–SIRT7 deacetylases and PARP-1 DNA strand-break repair enzymes.',
      notes: 'Dr. David Sinclair takes 1g NMN every morning to counteract the 50% age-related decline in cellular NAD+ levels.',
      target_outcomes: ['Cellular Longevity', 'Intracellular NAD+', 'Mitochondrial Respiration'],
      modality: CANONICAL_SINCLAIR_MODALITIES[0]
    },
    {
      id: 'sinclair_step_resveratrol',
      protocol_id: 'david_sinclair_sirtuin_nad_activation_protocol',
      modality_id: 'trans_resveratrol_with_fat',
      ordering_index: 2,
      display_order: 2,
      timing_slot: 'morning',
      frequency: 'Daily',
      required: true,
      dose_text: '1,000mg Micronized Trans-Resveratrol taken with dietary fat / yogurt / EVOO',
      duration: '1 min',
      instructions: 'MUST take with a source of fat (e.g. 1 tbsp Greek yogurt or extra virgin olive oil) because resveratrol is hydrophobic with near-zero aqueous bioavailability. Directly allosterically activates SIRT1, mimicking caloric restriction signaling and epigenetic remodeling.',
      notes: 'Sinclair rule: "Without fat, you might as well take sand." Micronized formulation increases intestinal uptake 3.5-fold.',
      target_outcomes: ['Cellular Longevity', 'SIRT1 Activity', 'Insulin Sensitivity'],
      modality: CANONICAL_SINCLAIR_MODALITIES[1]
    },
    {
      id: 'sinclair_step_metformin',
      protocol_id: 'david_sinclair_sirtuin_nad_activation_protocol',
      modality_id: 'metformin_or_berberine',
      ordering_index: 3,
      display_order: 3,
      timing_slot: 'evening',
      frequency: 'Daily',
      required: true,
      dose_text: '1,000mg Metformin (or 500mg Berberine HCl 2x/day before meals)',
      duration: '1 min',
      instructions: 'Inhibits mitochondrial Complex I, altering AMP/ATP ratio to stimulate AMP-activated protein kinase (AMPK). Upregulates downstream PGC-1α mitochondrial biogenesis, inhibits mTORC1, and enhances peripheral insulin sensitivity.',
      notes: 'Sinclair takes 1,000mg Metformin in the evening, omitting on heavy resistance training days to avoid blunting acute mitochondrial adaptation.',
      target_outcomes: ['Metabolic Flexibility', 'HbA1c', 'Fasting Insulin'],
      modality: CANONICAL_SINCLAIR_MODALITIES[2]
    },
    {
      id: 'sinclair_step_fasting',
      protocol_id: 'david_sinclair_sirtuin_nad_activation_protocol',
      modality_id: 'intermittent_fasting_16_8',
      ordering_index: 4,
      display_order: 4,
      timing_slot: 'morning',
      frequency: 'Daily',
      required: true,
      dose_text: '16-hour daily fasting window with an 8-hour feeding window (skip breakfast)',
      duration: 'Daily routine',
      instructions: 'Consume zero caloric intake from 8:00 PM until 12:00 PM next day. Keeps circulating insulin and IGF-1 depressed for 16 hours, turning on cellular autophagy and lysosomal housecleaning.',
      notes: 'Sinclair: "Fasting activates the body\'s natural defense mechanisms against aging far more effectively than constant grazing."',
      target_outcomes: ['Metabolic Flexibility', 'Autophagy Flux', 'Fasting Glucose'],
      modality: CANONICAL_SINCLAIR_MODALITIES[3]
    },
    {
      id: 'sinclair_step_rapamycin',
      protocol_id: 'david_sinclair_sirtuin_nad_activation_protocol',
      modality_id: 'rapamycin_senolytic_pulse',
      ordering_index: 5,
      display_order: 5,
      timing_slot: 'morning',
      frequency: '1x / week',
      required: false,
      dose_text: '5mg–6mg Rapamycin (Sirolimus) taken once weekly with fatty meal',
      duration: '1 min',
      instructions: 'Pulsed once weekly to selectively inhibit mTORC1 without chronically disrupting mTORC2, preserving immune function while driving systemic autophagy and stem cell renewal.',
      notes: 'Intermittent weekly dosing avoids metabolic side effects seen with continuous daily immunosuppressive dosing.',
      target_outcomes: ['Cellular Longevity', 'mTOR Phosphorylation', 'Stem Cell Competence'],
      modality: CANONICAL_SINCLAIR_MODALITIES[4]
    }
  ]
}

// ============================================================================
// COMPATIBILITY ALIASES (For backwards compatibility with prior IDs)
// ============================================================================

export const BRYAN_JOHNSON_BLUEPRINT_ALIAS: Protocol & { steps: ProtocolStep[] } = {
  ...BRYAN_JOHNSON_BLUEPRINT_FLAGSHIP_PROTOCOL,
  id: 'bryan_johnson_blueprint_protocol',
  slug: 'bryan-johnson-blueprint-protocol'
}

export const DR_RHONDA_PATRICK_ALIAS: Protocol & { steps: ProtocolStep[] } = {
  ...DR_RHONDA_PATRICK_MICRONUTRIENT_SENOLYTIC_PROTOCOL,
  id: 'dr_rhonda_patrick_longevity_stack',
  slug: 'dr-rhonda-patrick-longevity-stack'
}

export const DAVID_SINCLAIR_ALIAS: Protocol & { steps: ProtocolStep[] } = {
  ...DAVID_SINCLAIR_SIRTUIN_NAD_ACTIVATION_PROTOCOL,
  id: 'dr_david_sinclair_epigenetic_renewal',
  slug: 'dr-david-sinclair-epigenetic-renewal'
}

// Master collection of canonical protocols
export const BUILT_IN_CANONICAL_PROTOCOLS: (Protocol & { steps: ProtocolStep[] })[] = [
  PETER_ATTIA_CENTENARIAN_DECATHLON_PROTOCOL,
  BRYAN_JOHNSON_BLUEPRINT_FLAGSHIP_PROTOCOL,
  DR_RHONDA_PATRICK_MICRONUTRIENT_SENOLYTIC_PROTOCOL,
  DAVID_SINCLAIR_SIRTUIN_NAD_ACTIVATION_PROTOCOL,
  BRYAN_JOHNSON_BLUEPRINT_ALIAS,
  DR_RHONDA_PATRICK_ALIAS,
  DAVID_SINCLAIR_ALIAS
]

export const ALL_CANONICAL_MODALITIES: Modality[] = [
  ...CANONICAL_ATTIA_MODALITIES,
  ...CANONICAL_BLUEPRINT_MODALITIES,
  ...CANONICAL_PATRICK_MODALITIES,
  ...CANONICAL_SINCLAIR_MODALITIES
]
