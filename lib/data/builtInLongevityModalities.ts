import { Modality } from '../types'

/**
 * Built-in Longevity & Evidence-Based Modalities
 * Directly mapped to Daily Longevity Tips and Next Best Action (NBA) engines.
 * Adheres strictly to Modality & Protocol Dosing Standards (parameters, PubMed citations, exact dosing).
 */
export const BUILT_IN_LONGEVITY_MODALITIES: Modality[] = [
  {
    id: 'creatine_monohydrate',
    slug: 'creatine-monohydrate',
    name: 'Creatine Monohydrate',
    display_name: 'Creatine Monohydrate (Cognitive & Cellular)',
    category: 'nutrition',
    modality_type: 'supplement',
    status: 'active',
    brief_description: '5g daily (or 10–20g acute recovery dose) to sustain cellular ATP regeneration, working memory, and neuronal bioenergetics.',
    headline_benefit: 'Rapidly restores cerebral and muscular ATP; shields executive cognition under sleep deprivation.',
    primary_outcome: 'Cognitive Function & Brain ATP',
    dose_or_exposure: '5g daily with water / morning hydration (or 10–20g acute post-sleep restriction)',
    timing_summary: 'morning',
    frequency: 'Daily',
    duration: 'Ongoing daily habit',
    evidence_quality: 5,
    scientific_references: [
      {
        title: 'Single Dose Creatine Rapidly Reverses Brain Fatigue RCT (Scientific Reports 2024)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/38418464/',
        pmid: '38418464'
      }
    ],
    synergy_notes: {
      pairsWellWith: 'Electrolytes, Morning Hydration, Carbohydrate Co-ingestion',
      rationale: 'Creatine cellular uptake is mediated by sodium-dependent creatine transporter (CRT/SLC6A8), enhanced by modest insulin presence.'
    },
    instructions: 'Mix 5g of micronized Creatine Monohydrate in 12–16oz of water with morning hydration. If recovering from acute sleep debt (<5 hours), take an acute 10g dose.'
  },
  {
    id: 'post_meal_glucose_walk',
    slug: 'post-meal-glucose-walk',
    name: 'Post-Meal Glucose Walk',
    display_name: 'Post-Meal Glucose Disposal Walk',
    category: 'fitness',
    modality_type: 'lifestyle',
    status: 'active',
    brief_description: '10–15 minute light ambulation initiated within 30 minutes of meal completion to flatten postprandial glucose excursions.',
    headline_benefit: 'Blunts postprandial blood glucose spikes by ~30% via insulin-independent GLUT-4 muscle translocation.',
    primary_outcome: 'Metabolic Health & Glycemic Control',
    dose_or_exposure: '10–15 minutes brisk walking (Zone 1 / casual pace)',
    timing_summary: 'post-meal',
    frequency: 'Post-Meal (1–3x daily)',
    duration: '10–15 mins',
    evidence_quality: 5,
    scientific_references: [
      {
        title: 'Postprandial Walking Blunts Blood Glucose Spikes in Type 2 Diabetes (Diabetologia 2016)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/27747394/',
        pmid: '27747394'
      }
    ],
    synergy_notes: {
      pairsWellWith: 'Post-Meal Digestion, Apple Cider Vinegar, Zone 1 Movement',
      rationale: 'Contraction of large soleus and quadriceps muscle groups clears circulating glucose without requiring pancreatic insulin spikes.'
    },
    instructions: 'Within 30 minutes of finishing lunch or dinner, walk continuously at a relaxed pace for 10–15 minutes. Avoid strenuous running to allow smooth GI transit.'
  },
  {
    id: 'cold_plunge',
    slug: 'cold-plunge',
    name: 'Deliberate Cold Water Immersion',
    display_name: 'Deliberate Cold Plunge (Søberg Principle)',
    category: 'fitness',
    modality_type: 'thermal',
    status: 'active',
    brief_description: '2–3 minute immersion in 50°F–55°F (10°C–13°C) water, ending on cold to stimulate brown adipose tissue thermogenesis.',
    headline_benefit: 'Elevates sustained dopamine by 250%, increases brown fat thermogenesis (UCP-1), and sharpens mental resilience.',
    primary_outcome: 'Dopamine & Metabolic Thermogenesis',
    dose_or_exposure: '2–3 mins per session • 11 mins total weekly',
    temperature: '50°F–55°F / 10°C–13°C',
    timing_summary: 'morning',
    frequency: '3–4x per week (11 mins weekly total)',
    duration: '2–3 mins per plunge',
    evidence_quality: 5,
    scientific_references: [
      {
        title: 'Altered Brown Fat Thermoregulation & Dopamine via Cold Immersion (Cell Reports Med 2021)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/34637731/',
        pmid: '34637731'
      }
    ],
    synergy_notes: {
      pairsWellWith: 'Søberg Principle Natural Warm-Up, Morning Sunlight, Cyclic Sighing',
      rationale: 'Forcing the body to reheat naturally without hot showers stimulates brown adipose tissue (BAT) mitochondrial uncoupling and sustained noradrenaline.'
    },
    instructions: 'Submerge to clavicle level in 50°F–55°F water for 2–3 minutes. Control breathing with slow nasal exhales. Exit and warm up naturally (horse stance or air dry) to maximize thermogenesis.'
  },
  {
    id: 'delay_caffeine_90_120',
    slug: 'delay-caffeine-90-120',
    name: 'Delay Morning Caffeine (90–120m)',
    display_name: 'Circadian Caffeine Delay (90–120m Post-Wake)',
    category: 'nutrition',
    modality_type: 'lifestyle',
    status: 'active',
    brief_description: 'Delaying coffee/caffeine by 90–120 minutes post-waking allows morning cortisol to naturally clear residual adenosine.',
    headline_benefit: 'Prevents the afternoon 2 PM energy crash and preserves morning cortisol circadian amplitude.',
    primary_outcome: 'Circadian Energy Stability',
    dose_or_exposure: 'Delay first caffeine consumption 90–120 minutes after waking',
    timing_summary: 'morning',
    frequency: 'Daily Upon Waking',
    duration: '90–120 min window',
    evidence_quality: 4,
    scientific_references: [
      {
        title: 'Adenosine Receptor Antagonism & Circadian Cortisol Clearance (Neuroscience Letters)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/24058145/',
        pmid: '24058145'
      }
    ],
    synergy_notes: {
      pairsWellWith: 'Morning Hydration (16oz + Electrolytes), 10m Outdoor Sunlight',
      rationale: 'Hydration and light stimulate the SCN and cortisol awakening response (CAR) naturally, clearing adenosine before caffeine blocks the receptors.'
    },
    instructions: 'Hydrate with water and get morning light upon waking. Wait 90 to 120 minutes before having your first cup of coffee or caffeinated tea.'
  },
  {
    id: 'vilpa_micro_bursts',
    slug: 'vilpa-micro-bursts',
    name: 'VILPA Micro-Bursts',
    display_name: 'VILPA Vigorous Physical Activity Micro-Bursts',
    category: 'fitness',
    modality_type: 'exercise',
    status: 'active',
    brief_description: '3–4 one-minute bursts of vigorous lifestyle physical activity (stair sprinting, uphill power strides, kettlebell swings) daily.',
    headline_benefit: 'Reduces all-cause mortality by 40% and cancer-related mortality by 49% with just 3–4 minutes of total daily exertion.',
    primary_outcome: 'Cardiorespiratory Longevity & Vascular Shear Stress',
    dose_or_exposure: '3–4 bouts of 1-minute max-effort vigorous activity spread throughout the day',
    timing_summary: 'anytime',
    frequency: 'Daily (3–4 micro-bursts)',
    duration: '1 minute per burst',
    evidence_quality: 5,
    scientific_references: [
      {
        title: 'Association of Wearable Device-Measured VILPA with Mortality (Nature Medicine 2022)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/36482104/',
        pmid: '36482104'
      }
    ],
    synergy_notes: {
      pairsWellWith: 'Desk Breaks, Stair Climbing, Post-Meal Movement',
      rationale: 'Acute vascular endothelial shear stress releases endothelial nitric oxide synthase (eNOS) and stimulates VO2 peak adaptation.'
    },
    instructions: 'Sprint up a flight of stairs, do 60 seconds of high-tempo jumping jacks, or power-walk uphill at maximum exertion for 60 seconds 3–4 times per day.'
  },
  {
    id: 'cyclic_sighing',
    slug: 'cyclic-sighing',
    name: 'Cyclic Sighing (Physiological Sigh)',
    display_name: 'Cyclic Physiological Sighing',
    category: 'mind',
    modality_type: 'breathwork',
    status: 'active',
    brief_description: '5 minutes of two consecutive nasal inhales followed by an extended, slow mouth exhale to rapidly down-regulate sympathetic arousal.',
    headline_benefit: 'Rapidly resets the autonomic nervous system, lowers heart rate, and elevates parasympathetic tone faster than traditional meditation.',
    primary_outcome: 'Autonomic HRV & Acute Anxiety Reduction',
    dose_or_exposure: '5 minutes continuous cyclic sighs (2 inhales + 1 long exhale)',
    timing_summary: 'anytime',
    frequency: 'Daily / As-Needed for Stress',
    duration: '5 mins',
    evidence_quality: 5,
    scientific_references: [
      {
        title: 'Brief Structured Respiration Enhances Mood & Reduces Physiological Arousal (Cell Reports Med 2023)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/36630953/',
        pmid: '36630953'
      }
    ],
    synergy_notes: {
      pairsWellWith: 'Pre-Bed Wind Down, Post-Cold Plunge, Midday Stress Decompression',
      rationale: 'Second inhale re-inflates collapsed pulmonary alveoli, while long exhalations engage respiratory sinus arrhythmia to slow heart rate.'
    },
    instructions: 'Take a deep breath through the nose, then top it off with a second sharp inhale. Release all air in a slow, smooth exhalation through the mouth. Repeat for 5 minutes.'
  },
  {
    id: 'spermidine_supplementation',
    slug: 'spermidine-supplementation',
    name: 'Spermidine Autophagy Trigger',
    display_name: 'Spermidine (Cellular Autophagy Induction)',
    category: 'nutrition',
    modality_type: 'supplement',
    status: 'active',
    brief_description: '1–2mg daily natural spermidine extract to stimulate cardiac myocyte autophagy and clear damaged organelles.',
    headline_benefit: 'Induces systemic autophagy via EP300 inhibition, protecting cardiac function and promoting cellular renewal.',
    primary_outcome: 'Autophagy & Cardiac Cellular Longevity',
    dose_or_exposure: '1–2mg Spermidine daily (or 10g wheat germ extract)',
    timing_summary: 'morning',
    frequency: 'Daily with First Meal',
    duration: 'Daily capsule',
    evidence_quality: 4,
    scientific_references: [
      {
        title: 'Higher Spermidine Intake Is Linked to Lower Mortality: A Prospective Cohort (Am J Clin Nutr 2018)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/29958312/',
        pmid: '29958312'
      }
    ],
    synergy_notes: {
      pairsWellWith: 'Time-Restricted Eating, First Meal / Breakfast, EVOO',
      rationale: 'Spermidine mimics the longevity pathways of caloric restriction by suppressing acetyltransferase EP300 without requiring prolonged fasting.'
    },
    instructions: 'Take 1–2mg of standardized Spermidine with your first meal of the day or breakfast stack.'
  },
  {
    id: 'fisetin_quercetin_senolytic_pulse',
    slug: 'fisetin-quercetin-senolytic-pulse',
    name: 'Senolytic Blast (Fisetin + Quercetin + EVOO)',
    display_name: 'Fisetin & Quercetin Senolytic Pulse',
    category: 'nutrition',
    modality_type: 'supplement',
    status: 'active',
    brief_description: 'High-dose pulse protocol (20mg/kg Fisetin + 1,000mg Quercetin) taken with 1 tbsp Extra Virgin Olive Oil 2 consecutive days per month.',
    headline_benefit: 'Selectively induces apoptosis in senescent "zombie" cells, reducing SASP inflammatory cytokines.',
    primary_outcome: 'Senescent Cell Clearance & SASP Suppression',
    dose_or_exposure: '20mg/kg Fisetin + 1,000mg Quercetin + 1 tbsp EVOO for 2 consecutive days monthly',
    timing_summary: 'morning',
    frequency: '2 consecutive days per month (Mayo Clinic Hit-and-Run Protocol)',
    duration: '2-day pulse per month',
    evidence_quality: 5,
    scientific_references: [
      {
        title: 'Fisetin Is a Potent Senotherapeutic That Extends Health and Lifespan (EBioMedicine 2018)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/29930465/',
        pmid: '29930465'
      }
    ],
    synergy_notes: {
      pairsWellWith: '1 Tbsp Extra Virgin Olive Oil (EVOO), Fasting Window',
      rationale: 'Fisetin and Quercetin are hydrophobic polyphenols; co-ingestion with dietary mono-unsaturated fats elevates bioavailability by >4.5x.'
    },
    instructions: 'Take full senolytic pulse dose with 1 tablespoon of extra virgin olive oil in the morning. Repeat the next day. Rest 28 days before next pulse.'
  },
  {
    id: '478_relaxing_breathing',
    slug: '478-relaxing-breathing',
    name: '4-7-8 Parasympathetic Breathing',
    display_name: '4-7-8 Sleep Latency Breathing',
    category: 'mind',
    modality_type: 'breathwork',
    status: 'active',
    brief_description: 'Inhale 4s, hold 7s, exhale 8s for 4–8 cycles prior to bed to quiet cortical arousal and shorten sleep latency.',
    headline_benefit: 'Activates parasympathetic vagal stimulation, lowers systolic blood pressure, and accelerates delta-wave sleep onset.',
    primary_outcome: 'Sleep Latency & Pre-Bed Autonomic Calm',
    dose_or_exposure: '4–8 breath cycles (Inhale 4s, Hold 7s, Exhale 8s)',
    timing_summary: 'pre-bed',
    frequency: 'Nightly Before Sleep',
    duration: '4–5 mins',
    evidence_quality: 4,
    scientific_references: [
      {
        title: 'Effects of 4-7-8 Breathing Technique on Autonomic Nervous System & Sleep (Physiol Rep 2022)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/35837096/',
        pmid: '35837096'
      }
    ],
    synergy_notes: {
      pairsWellWith: 'Sleep Hygeine, Cool Bedroom (65-68°F), Magnesium L-Threonate',
      rationale: 'Prolonged 8-second exhalation stimulates baroreceptors, increasing cardiac vagal tone and acetylcholine release.'
    },
    instructions: 'Lie comfortably in bed with lights off. Inhale through the nose for 4 seconds, hold gently for 7 seconds, then exhale smoothly through the mouth for 8 seconds. Complete 4 to 8 cycles.'
  },
  {
    id: 'glynac_glutathione_pulse',
    slug: 'glynac_glutathione_pulse',
    name: 'GlyNAC Glutathione Precursor Protocol',
    display_name: 'GlyNAC (Glycine + N-Acetyl Cysteine)',
    category: 'nutrition',
    modality_type: 'supplement',
    status: 'active',
    brief_description: 'Co-supplementation of Glycine (100mg/kg or ~3–5g) and N-Acetylcysteine (100mg/kg or ~1.2–2.4g) to replenish cellular glutathione pools.',
    headline_benefit: 'Reverses age-related mitochondrial dysfunction and lowers systemic oxidative stress & inflammation.',
    primary_outcome: 'Intracellular Glutathione Synthesis & Mitochondrial Bioenergetics',
    dose_or_exposure: '3,000–5,000mg Glycine + 1,200–2,400mg NAC with water',
    timing_summary: 'morning',
    frequency: 'Daily with First Meal / Morning Stack',
    duration: 'Daily supplement',
    evidence_quality: 5,
    scientific_references: [
      {
        title: 'GlyNAC Supplementation in Older Adults Improves Glutathione, Mitochondria & Aging Hallmarks (J Gerontol A 2022)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/35975308/',
        pmid: '35975308'
      }
    ],
    synergy_notes: {
      pairsWellWith: 'Vitamin C, Alpha Lipoic Acid, Morning Hydration',
      rationale: 'Glycine and Cysteine supply the rate-limiting dual substrates for gamma-glutamylcysteine synthetase.'
    },
    instructions: 'Take Glycine and NAC together in the morning with 12oz water. If GI sensitivity occurs, take alongside your first meal.'
  },
  {
    id: 'optic_flow_ambulation',
    slug: 'optic-flow-ambulation',
    name: 'Optic Flow Outdoor Ambulation',
    display_name: 'Outdoor Optic Flow Walking',
    category: 'mind',
    modality_type: 'lifestyle',
    status: 'active',
    brief_description: '10–20 minutes of outdoor walking with eyes panning across the visual horizon to generate lateral optic flow.',
    headline_benefit: 'Directly quiets neural threat firing in the amygdala, reducing autonomic anxiety and mental rumination.',
    primary_outcome: 'Amygdala De-escalation & Mental Clarity',
    dose_or_exposure: '10–20 minutes outdoor walking without looking at digital screens',
    timing_summary: 'morning',
    frequency: 'Daily (Morning or Midday)',
    duration: '10–20 mins',
    evidence_quality: 4,
    scientific_references: [
      {
        title: 'Visual Flow Fields Directly Inhibit Neural Threat Circuits in Amygdala (Current Biology)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/32675039/',
        pmid: '32675039'
      }
    ],
    synergy_notes: {
      pairsWellWith: 'Morning Sunlight, Circadian Reset, Nasal Breathing',
      rationale: 'Lateral movement of visual stimuli across the peripheral retina sends inhibitory signals to the amygdala threat-detection complex.'
    },
    instructions: 'Walk outside without looking at a phone screen. Allow your gaze to expand to the panoramic horizon, letting the natural surroundings flow past your field of view.'
  },
  {
    id: 'peter_attia_centenarian_strength',
    slug: 'peter-attia-centenarian-strength',
    name: 'Centenarian Decathlon Grip & Strength',
    display_name: 'Centenarian Decathlon Grip & Functional Strength',
    category: 'fitness',
    modality_type: 'exercise',
    status: 'active',
    brief_description: 'Farmer carries, dead hangs, and compound resistance movements designed to maintain neuromuscular capacity into the 9th and 10th decade of life.',
    headline_benefit: 'Maximizes handgrip force and skeletal muscle mass—the #1 protective physical biomarker against all-cause mortality.',
    primary_outcome: 'Neuromuscular Grip Strength & Sarcopenia Shield',
    dose_or_exposure: '3 sets of 60s Heavy Farmer Carries or 2-minute Dead Hang cumulative volume',
    timing_summary: 'afternoon',
    frequency: '3x per week',
    duration: '20–30 mins',
    evidence_quality: 5,
    scientific_references: [
      {
        title: 'Prognostic Value of Grip Strength: Findings from the Prospective Urban Rural Epidemiological (PURE) Study (Lancet)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/25982160/',
        pmid: '25982160'
      }
    ],
    synergy_notes: {
      pairsWellWith: 'Post-Workout Leucine/Whey (30g+), Creatine Monohydrate, Zone 2 Cardio',
      rationale: 'Compound isometric carries trigger deep forearm tendon remodeling and central nervous system motor unit recruitment.'
    },
    instructions: 'Perform 3 sets of heavy kettlebell or trap-bar carries for 45–60 seconds, or 3 sets of dead hangs from a pull-up bar. Focus on crushing grip pressure.'
  },
  {
    id: 'three_hour_sleep_protection_cutoff',
    slug: 'three-hour-sleep-protection-cutoff',
    name: '3-Hour Nocturnal Food Cutoff',
    display_name: '3-Hour Pre-Bed Nutrition & Digestive Cutoff',
    category: 'sleep',
    modality_type: 'circadian',
    status: 'active',
    brief_description: 'Conclude all solid calorie intake at least 3 hours prior to targeted bedtime to allow complete gastric emptying and core cooling.',
    headline_benefit: 'Lowers resting sleeping heart rate by 4–8 BPM and doubles slow-wave delta deep sleep architecture.',
    primary_outcome: 'Slow-Wave Deep Sleep & Heart Rate Dip',
    dose_or_exposure: 'Zero caloric intake during the 3 hours preceding targeted bedtime',
    timing_summary: 'evening',
    frequency: 'Nightly',
    duration: '3 hours prior to bed',
    evidence_quality: 5,
    scientific_references: [
      {
        title: 'Effects of Meal Timing on Core Body Temperature and Sleep Architecture (Nutrients 2020)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/33027985/',
        pmid: '33027985'
      }
    ],
    synergy_notes: {
      pairsWellWith: 'Chamomile / Herbal Tea, Wind Down Routine, Blue Light Suppression',
      rationale: 'Digestion generates internal thermogenesis; stopping digestion allows the 1°C core body temperature drop required for slow-wave sleep.'
    },
    instructions: 'Finish your final meal or snack at least 3 full hours before your intended bedtime. If thirsty, drink water or non-caloric herbal tea.'
  },
  {
    id: 'vo2_max_4x4_hiit',
    slug: 'vo2-max-4x4-hiit',
    name: 'Norwegian 4x4 VO2 Max Protocol',
    display_name: 'Norwegian 4x4 VO2 Max Interval Protocol',
    category: 'fitness',
    modality_type: 'exercise',
    status: 'active',
    brief_description: '4 bouts of 4 minutes at 90–95% Max Heart Rate, separated by 3 minutes of active recovery (Zone 1/2) at 70% Max HR.',
    headline_benefit: 'Expands maximal oxygen uptake (VO2 max) by 8–12% in 8 weeks; VO2 max is the single strongest predictor of physiological longevity.',
    primary_outcome: 'Cardiorespiratory Fitness (VO2 Max) & Stroke Volume',
    dose_or_exposure: '4 x 4-min intervals @ 90-95% Max HR • 3-min active recovery between bouts',
    timing_summary: 'morning',
    frequency: '1–2x per week',
    duration: '28–32 mins total',
    evidence_quality: 5,
    scientific_references: [
      {
        title: 'Aerobic High-Intensity Intervals Improve VO2max More Than Moderate Training (Med Sci Sports Exerc 2007)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/17414804/',
        pmid: '17414804'
      }
    ],
    synergy_notes: {
      pairsWellWith: 'Pre-Workout Electrolytes, Zone 2 Base Training, Post-Workout Protein',
      rationale: 'High end-diastolic cardiac filling pressures induce maximal left-ventricular stroke volume remodeling.'
    },
    instructions: 'Warm up for 5 minutes. Perform 4 minutes on a bike, rower, or incline treadmill at 90–95% Max HR. Follow with 3 minutes of easy spinning. Repeat for 4 total rounds. Cool down 5 minutes.'
  },
  {
    id: 'urolithin_a_mitophagy',
    slug: 'urolithin-a-mitophagy',
    name: 'Urolithin A Mitophagy Activator',
    display_name: 'Urolithin A (Mitochondrial Mitophagy)',
    category: 'nutrition',
    modality_type: 'supplement',
    status: 'active',
    brief_description: '500–1,000mg Urolithin A daily to selectively trigger mitophagy (clearing defective mitochondria) and enhance muscle endurance.',
    headline_benefit: 'Enhances muscle endurance by 12% and replaces dysfunctional mitochondria with dense, oxidative mitochondrial cristae.',
    primary_outcome: 'Mitophagy & Muscle Cellular Bioenergetics',
    dose_or_exposure: '500–1,000mg Urolithin A daily',
    timing_summary: 'morning',
    frequency: 'Daily with First Meal',
    duration: 'Daily capsule',
    evidence_quality: 5,
    scientific_references: [
      {
        title: 'Urolithin A Induces Mitophagy & Improves Muscle Endurance in Middle-Aged Adults RCT (JAMA Netw Open 2022)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/35043169/',
        pmid: '35043169'
      }
    ],
    synergy_notes: {
      pairsWellWith: 'First Meal / Dietary Fats, Zone 2 Cardio, CoQ10',
      rationale: 'Urolithin A activates PINK1/Parkin-mediated mitophagy without requiring prolonged fasting or exhaustive glycogen depletion.'
    },
    instructions: 'Take 500mg to 1,000mg of Urolithin A in the morning with water or alongside your first meal containing dietary fats.'
  },
  {
    id: 'matthew_walker_sleep_triad',
    slug: 'matthew-walker-sleep-triad',
    name: 'Matthew Walker Sleep Cocktail',
    display_name: 'Matthew Walker Sleep Cocktail (Magnesium L-Threonate + Apigenin + L-Theanine)',
    category: 'sleep',
    modality_type: 'supplement',
    status: 'active',
    brief_description: '145mg Magnesium L-Threonate + 50mg Apigenin + 100–200mg L-Theanine taken 30–60 minutes before sleep.',
    headline_benefit: 'Crosses the blood-brain barrier to enhance GABAergic neurotransmission and delta slow-wave sleep depth.',
    primary_outcome: 'Slow-Wave Sleep EEG Power & Sleep Latency',
    dose_or_exposure: '145mg Mag L-Threonate + 50mg Apigenin + 100-200mg L-Theanine',
    timing_summary: 'pre-bed',
    frequency: 'Nightly 30–60m Before Bed',
    duration: 'Nightly capsule stack',
    evidence_quality: 5,
    scientific_references: [
      {
        title: 'Enhancement of Learning and Memory by Elevating Brain Magnesium (Neuron 2010)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/20152124/',
        pmid: '20152124'
      }
    ],
    synergy_notes: {
      pairsWellWith: '65°F Room Temperature, 4-7-8 Breathing, Dim Lighting',
      rationale: 'L-Threonate elevates CSF magnesium; Apigenin acts as a mild chloride-channel GABA agonist; L-Theanine elevates alpha-wave relaxation.'
    },
    instructions: 'Take 145mg Magnesium L-Threonate, 50mg Apigenin, and 100–200mg L-Theanine with 4oz of water 30–60 minutes before lights out.'
  },
  {
    id: 'handstand',
    slug: 'handstand-inversion',
    name: 'Postural Inversion / Handstand',
    display_name: 'Postural Inversion & Cerebral Perfusion',
    category: 'fitness',
    modality_type: 'exercise',
    status: 'active',
    brief_description: '2–5 minutes of passive wall inversion, feet-up-the-wall pose, or handstand hold to facilitate venous return and cerebral CSF circulation.',
    headline_benefit: 'Stimulates cerebral glymphatic fluid exchange and relieves lumbar spinal compression.',
    primary_outcome: 'Cerebral Perfusion & Venous Return',
    dose_or_exposure: '2–5 minutes inversion (Wall-supported handstand or Legs-Up-the-Wall)',
    timing_summary: 'afternoon',
    frequency: 'Daily (Afternoon or Wind Down)',
    duration: '2–5 mins',
    evidence_quality: 4,
    scientific_references: [
      {
        title: 'Postural Shifts & Cerebral Perfusion During Physical Inversion (Front Hum Neurosci)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/31590528/',
        pmid: '31590528'
      }
    ],
    synergy_notes: {
      pairsWellWith: 'Diaphragmatic Breathing, Wind Down Routine, Spinal Decompression',
      rationale: 'Hydrostatic pressure inversion shifts blood and lymphatic fluid from lower extremities towards central thoracic and cranial vessels.'
    },
    instructions: 'Perform a 60-second wall-supported handstand hold, inversion table hang, or rest with legs elevated against a wall for 5 minutes.'
  },
  {
    id: 'time_restricted_eating_18_6',
    slug: 'time-restricted-eating-18-6',
    name: 'Time-Restricted Eating (16:8 or 18:6)',
    display_name: 'Time-Restricted Eating (TRE Circadian Window)',
    category: 'nutrition',
    modality_type: 'fasting',
    status: 'active',
    brief_description: 'Consolidate all caloric nutrition into an 6–8 hour daily window, fasting for the remaining 16–18 hours.',
    headline_benefit: 'Aligns peripheral metabolic organ circadian clocks, stimulates autophagic turnover, and improves insulin sensitivity.',
    primary_outcome: 'Circadian Metabolic Clock Alignment & Insulin Sensitivity',
    dose_or_exposure: '16–18 hours fasting • 6–8 hours feeding window',
    timing_summary: 'pre-meal',
    frequency: 'Daily',
    duration: '16–18 hour daily fasting window',
    evidence_quality: 5,
    scientific_references: [
      {
        title: 'Ten-Hour Time-Restricted Eating Reduces Weight, Blood Pressure, and Atherogenic Lipids (Cell Metabolism 2019)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/31806629/',
        pmid: '31806629'
      }
    ],
    synergy_notes: {
      pairsWellWith: 'Unflavored Electrolytes, Black Coffee / Green Tea, Morning Hydration',
      rationale: 'Fasting downregulates hepatic lipogenesis and allows mitochondrial mitophagy while maintaining circadian synchrony.'
    },
    instructions: 'Consume all meals within a set 6 to 8-hour window (e.g. 12:00 PM to 6:00 PM). Consume only water, black coffee, or plain electrolytes during the 16–18 hour fasting window.'
  },
  {
    id: 'blood_donation_phlebotomy',
    slug: 'blood-donation-phlebotomy',
    name: 'Therapeutic Phlebotomy / Blood Donation',
    display_name: 'Therapeutic Phlebotomy (PFAS & Iron Reduction)',
    category: 'other',
    modality_type: 'clinical',
    status: 'active',
    brief_description: 'Whole blood (500ml) or plasma donation every 8–12 weeks to reduce systemic bioaccumulated PFAS forever chemicals and excess ferritin.',
    headline_benefit: 'Lowers serum PFAS concentrations by up to 30% and prevents iron-mediated Fenton reaction oxidative tissue damage.',
    primary_outcome: 'PFAS Toxin Clearance & Ferritin Normalization',
    dose_or_exposure: '1 unit (500ml) whole blood donation or plasma pheresis every 8–12 weeks',
    timing_summary: 'midday',
    frequency: 'Every 8–12 weeks',
    duration: '30–45 min clinical appointment',
    evidence_quality: 5,
    scientific_references: [
      {
        title: 'Effect of Plasma or Blood Donation on Serum Levels of PFAS (JAMA Netw Open 2022)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/35394503/',
        pmid: '35394503'
      }
    ],
    synergy_notes: {
      pairsWellWith: 'Post-Donation Electrolyte Hydration, Iron / Ferritin Lab Monitoring',
      rationale: 'PFAS binds to serum albumin; therapeutic blood removal forces hepatic regeneration of fresh albumin, accelerating xenobiotic clearance.'
    },
    instructions: 'Schedule a whole blood donation at an accredited blood bank. Hydrate with 32oz water and electrolytes prior to donation. Monitor ferritin levels to keep between 50–150 ng/mL.'
  },
  {
    id: 'morning_sunlight_exposure',
    slug: 'morning-sunlight-exposure',
    name: 'Morning Sunlight Circadian Reset',
    display_name: 'Outdoor Morning Sunlight Exposure',
    category: 'sleep',
    modality_type: 'circadian',
    status: 'active',
    brief_description: '10–15 minutes (or 20–30m on overcast days) of direct outdoor sunlight exposure within 30–60 minutes of waking.',
    headline_benefit: 'Activates retinal ipRGC melanopsin pathways, spikes cortisol awakening response, and starts the 14-hour melatonin timer.',
    primary_outcome: 'Circadian Phase Setting & Nighttime Melatonin Peak',
    dose_or_exposure: '10–15 mins on clear days (10,000+ lux) • 20–30 mins on overcast days',
    timing_summary: 'upon-waking',
    frequency: 'Daily within 60 mins of waking',
    duration: '10–20 mins',
    evidence_quality: 5,
    scientific_references: [
      {
        title: 'Circadian Entrainment to the Natural Light-Dark Cycle across Seasons (Current Biology)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/26059855/',
        pmid: '26059855'
      }
    ],
    synergy_notes: {
      pairsWellWith: 'Morning Hydration, Optic Flow Walk, Delay Caffeine 90-120m',
      rationale: 'Photons entering the retina without sunglasses stimulate the suprachiasmatic master clock (SCN) to suppress melatonin and elevate alertness.'
    },
    instructions: 'Go outdoors within 30–60 minutes of waking. Face in the general direction of the sun without looking directly into it. Do not wear sunglasses (regular corrective glasses/contacts are fine).'
  }
]
