const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

try {
  const envPath = path.join(__dirname, '.env.local')
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8')
    envConfig.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/)
      if (match) {
        process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '')
      }
    })
  }
} catch (e) {
  console.warn('Could not load .env.local automatically:', e)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const newModalities = [
  {
    id: 'post_meal_glucose_walk',
    slug: 'post_meal_glucose_walk',
    name: 'Post-Meal Glucose Walk',
    display_name: 'Post-Meal Glucose Walk (10-15 min)',
    category: 'Metabolic Health',
    modality_type: 'behavioral',
    headline_benefit: 'Blunts postprandial blood glucose spikes by ~30% via non-insulin GLUT-4 activation.',
    brief_description: 'A light 10-15 minute walk within 30 minutes of eating to trigger non-insulin dependent GLUT-4 muscle glucose uptake.',
    dose_or_exposure: '10–15 Minutes @ Zone 1 Light Pace (100–115 bpm)',
    frequency: 'Post-Meal (1-3x daily)',
    timing_summary: 'Within 30 minutes after major meals',
    logging_type: 'duration',
    primary_outcome: 'Glycemic Variability & Postprandial Energy',
    mechanism_of_action: 'Postprandial walking activates GLUT-4 translocation to skeletal muscle cell membranes without requiring insulin spikes, clearing circulating glucose by ~30% and preventing advanced glycation end-products (AGEs).',
    expanded_why: 'Post-meal light walking leverages non-insulin-dependent glucose uptake in large skeletal muscle groups (quadriceps/glutes). This prevents the steep insulin spikes and subsequent reactive hypoglycemia (post-lunch energy crash) that drive metabolic dysfunction and endothelial inflammation over time.',
    instructions: 'Step 1: Finish your meal.\nStep 2: Within 30 minutes, step outside or walk indoors at a relaxed, comfortable pace for 10–15 minutes.\nStep 3: Keep heart rate in Zone 1 (conversational pace). Avoid intense exercise immediately after eating to prevent gastrointestinal blood diversion.',
    synergy_notes: 'Pairs synergistically with Berberine (500mg), Metformin (850mg), Apple Cider Vinegar (1 tbsp), and High-Protein meals.',
    contraindications: ['Avoid post-meal high-intensity interval training or heavy resistance work (can cause GI distress and blood flow shunting away from gut).'],
    safety_summary: 'Exceptionally safe for all populations.',
    ideal_cohort: 'Individuals with pre-diabetes, high glycemic variability, insulin resistance, or post-meal fatigue.',
    contraindicating_cohort: 'Severe acute gastrointestinal motility disorders (under medical direction).',
    evidence_quality: 5,
    functional_outcomes_to_track: ['energy', 'brain_fog', 'digestive_health'],
    status: 'published',
    version: 1
  },
  {
    id: 'vilpa_micro_bursts',
    slug: 'vilpa_micro_bursts',
    name: 'VILPA Micro-Bursts',
    display_name: 'VILPA Vigorous Micro-Bursts (3x 1-min)',
    category: 'Cardiovascular Fitness',
    modality_type: 'exercise',
    headline_benefit: '3–4 1-minute vigorous bursts daily reduce all-cause mortality by 40% and cancer risk by 49%.',
    brief_description: 'Vigorous Intermittent Lifestyle Physical Activity: short 1-minute bursts of max effort (e.g. stair sprinting, hill power walk).',
    dose_or_exposure: '3–4 x 1-Minute Max-Effort Bursts (≥ 85% HRmax)',
    frequency: 'Daily',
    timing_summary: 'Distributed throughout the day (Morning & Afternoon)',
    logging_type: 'duration',
    primary_outcome: 'VO2 Peak & Cardioprotective Resilience',
    mechanism_of_action: 'Vigorous Intermittent Lifestyle Physical Activity (VILPA) induces acute shear stress on vascular endothelium, stimulating endothelial nitric oxide synthase (eNOS), cardiac stroke volume expansion, and anti-inflammatory myokine release.',
    expanded_why: 'Groundbreaking UK Biobank research published in Nature Medicine (2022) tracked non-exercisers and revealed that just 3 to 4 one-minute bursts of vigorous everyday activity (such as running to catch a bus or power-climbing stairs) yielded nearly identical cardiovascular and all-cause mortality reduction as formal structured workouts.',
    instructions: 'Step 1: Identify 3–4 daily opportunities for max effort (e.g., sprinting up stairs, rapid power walking up a hill, high-speed kettlebell swings).\nStep 2: Sustain max effort for 60 seconds until breathing heavily.\nStep 3: Space micro-bursts throughout your day.',
    synergy_notes: 'Complements Zone 2 Cardio sessions, CoQ10 (200mg), and L-Carnitine (2g).',
    contraindications: ['Avoid within 2 hours of sleep (raises core body temperature and sympathetic tone).'],
    safety_summary: 'Safe for general adult population. Individuals with unmanaged cardiovascular disease should consult a physician before high-intensity exertion.',
    ideal_cohort: 'Busy professionals, sedentary individuals, longevity seekers prioritizing maximum ROI per minute.',
    contraindicating_cohort: 'Unstable angina, unmanaged hypertension, acute cardiac conditions.',
    evidence_quality: 5,
    functional_outcomes_to_track: ['energy', 'recovery', 'mood'],
    status: 'published',
    version: 1
  },
  {
    id: 'glynac_glutathione_pulse',
    slug: 'glynac_glutathione_pulse',
    name: 'GlyNAC Glutathione Precursor Pulse',
    display_name: 'GlyNAC (Glycine + NAC Stack)',
    category: 'Mitochondrial Health',
    modality_type: 'supplement',
    headline_benefit: 'Restores intracellular master antioxidant glutathione levels, reversing mitochondrial dysfunction.',
    brief_description: 'Combination of Glycine and N-Acetylcysteine (NAC) to restore intracellular master antioxidant glutathione levels.',
    dose_or_exposure: '100mg/kg Glycine + 100mg/kg NAC (or ~3–5g Glycine + 3–5g NAC daily)',
    frequency: 'Daily (Morning or Split Dose)',
    timing_summary: 'Morning with water or light fat source',
    logging_type: 'dosage',
    primary_outcome: 'Intracellular Glutathione & Oxidative Stress Defend',
    mechanism_of_action: 'Glycine and N-Acetylcysteine (NAC) provide rate-limiting substrate amino acids for gamma-glutamylcysteine synthetase and glutathione synthetase, replenishing mitochondrial and cytosolic glutathione (GSH) pools diminished by aging.',
    expanded_why: 'Clinical trials led by Dr. Rajagopal Sekhar at Baylor College of Medicine demonstrated that GlyNAC supplementation in older adults corrected glutathione deficiency, lowered oxidative stress, restored mitochondrial fat oxidation, reduced insulin resistance, and improved cognitive and muscle strength metrics.',
    instructions: 'Step 1: Measure 3–5g Glycine powder and 3–5g NAC powder (or targeted 100mg/kg weight-based ratio).\nStep 2: Dissolve in 8-12 oz of room temperature water.\nStep 3: Consume in the morning. Split into two daily doses if mild GI sensitivity occurs.',
    synergy_notes: 'Pairs synergistically with Alpha-Lipoic Acid (300mg), Selenium (200mcg), and Vitamin C (500mg).',
    contraindications: ['High-dose inorganic iron supplements (can accelerate Fenton reactions if unbuffered).'],
    safety_summary: 'High safety profile. Mild stomach discomfort resolved by taking with meals or splitting dosage.',
    ideal_cohort: 'Aging adults, individuals with high oxidative stress burden, chronic fatigue, or insulin resistance.',
    contraindicating_cohort: 'Active cystinuria or known hypersensitivity to sulfur compounds/NAC.',
    evidence_quality: 5,
    functional_outcomes_to_track: ['energy', 'brain_fog', 'recovery'],
    status: 'published',
    version: 1
  },
  {
    id: 'vo2_max_4x4_hiit',
    slug: 'vo2_max_4x4_hiit',
    name: 'VO2 Max 4x4 Interval Protocol',
    display_name: 'Norwegian 4x4 VO2 Max Intervals',
    category: 'Cardiovascular Fitness',
    modality_type: 'exercise',
    headline_benefit: 'Gold standard high-intensity interval protocol expanding VO2 max by 10-13% in 8 weeks.',
    brief_description: '4 minutes at 90-95% Max HR followed by 3 minutes active recovery, repeated 4 times. Gold standard for expanding VO2 max.',
    dose_or_exposure: '4 x 4 Minutes @ 90–95% HRmax (3-min active recovery @ 60-70% HRmax)',
    frequency: '1–2x per week',
    timing_summary: 'Morning or Early Afternoon',
    logging_type: 'duration',
    primary_outcome: 'VO2 Max Expansion & Cardiorespiratory Lifespan',
    mechanism_of_action: 'Sustaining 90-95% HRmax for 4-minute intervals elevates cardiac end-diastolic filling and stroke volume to peak limits, driving eccentric cardiac ventricular hypertrophy and rapid mitochondrial biogenesis in skeletal muscle.',
    expanded_why: 'VO2 max is recognized by Dr. Peter Attia and top exercise physiologists as the single strongest statistical predictor of all-cause mortality and functional longevity. The Norwegian 4x4 protocol is proven in clinical trials to produce double the VO2 max gains of moderate continuous exercise.',
    instructions: 'Step 1: Perform a 5-10 minute progressive warm-up.\nStep 2: Perform Interval 1: 4 minutes at 90-95% Max HR (breathing hard, able to speak only 1-2 words).\nStep 3: Recover for 3 minutes at light active pace (60-70% HRmax).\nStep 4: Repeat for 4 total intervals (28 minutes total work + recovery).\nStep 5: 5-minute cool down.',
    synergy_notes: 'Pairs well with Electrolytes, Creatine Monohydrate (5g), and Post-Workout Thermal Sauna.',
    contraindications: ['Avoid cold plunge immediately after session (cold water immersion within 1 hour blunts hypertrophic and mitochondrial adaptive signaling).'],
    safety_summary: 'High intensity. Requires baseline cardio foundation (e.g. 4+ weeks of Zone 2 cardio).',
    ideal_cohort: 'Athletes, longevity enthusiasts, individuals seeking top 2.5% cardiorespiratory fitness tier.',
    contraindicating_cohort: 'Uncontrolled cardiovascular disease, recent cardiac events, acute musculoskeletal injuries.',
    evidence_quality: 5,
    functional_outcomes_to_track: ['energy', 'recovery', 'mood'],
    status: 'published',
    version: 1
  },
  {
    id: 'urolithin_a_mitophagy',
    slug: 'urolithin_a_mitophagy',
    name: 'Urolithin A Mitophagy Protocol',
    display_name: 'Urolithin A (Mitophagy Support)',
    category: 'Mitochondrial Health',
    modality_type: 'supplement',
    headline_benefit: 'Selectively triggers mitophagy (clearing defective mitochondria), boosting muscle endurance by 12%.',
    brief_description: 'Gut-derived postbiotic metabolite that selectively triggers mitophagy (autophagic clearance of damaged mitochondria).',
    dose_or_exposure: '500mg – 1,000mg Urolithin A',
    frequency: 'Daily',
    timing_summary: 'Morning with breakfast or healthy smoothie',
    logging_type: 'dosage',
    primary_outcome: 'Mitophagy & Muscle Endurance Resilience',
    mechanism_of_action: 'Urolithin A triggers PINK1/Parkin-mediated selective autophagy of damaged mitochondria (mitophagy), clearing dysfunctional organelle fragments and stimulating fresh mitochondrial biogenesis.',
    expanded_why: 'Only 30-40% of humans possess the gut microbiome composition capable of converting dietary pomegranate ellagitannins into active Urolithin A. Direct supplementation bypasses microbiome variability, delivering clinically validated muscle endurance gains and systemic inflammatory cytokine reduction in human RCTs.',
    instructions: 'Step 1: Take 500mg to 1,000mg softgel or powder daily in the morning.\nStep 2: Consume alongside a meal containing healthy fats for optimal micellar absorption.',
    synergy_notes: 'Pairs synergistically with CoQ10 (200mg), NMN (500mg), and Pomegranate Extract.',
    contraindications: ['None established in peer-reviewed clinical trials.'],
    safety_summary: 'FDA GRAS status and clinical safety established up to 1,000mg/day.',
    ideal_cohort: 'Adults experiencing age-related muscle decline, individuals unable to perform high-volume exercise, mitochondrial health focus.',
    contraindicating_cohort: 'None known.',
    evidence_quality: 5,
    functional_outcomes_to_track: ['energy', 'recovery', 'joint_health'],
    status: 'published',
    version: 1
  }
]

async function seedNewModalities() {
  console.log('Seeding 5 rich 100%-detailed modalities into Supabase...')

  for (const mod of newModalities) {
    const { data, error } = await supabase
      .from('modalities')
      .upsert(mod, { onConflict: 'id' })
      .select()

    if (error) {
      console.error(`Error inserting ${mod.name}:`, error.message)
    } else {
      console.log(`Successfully seeded rich modality: ${mod.display_name}`)
    }
  }

  // Update all_modalities.json file
  const jsonPath = path.join(__dirname, 'all_modalities.json')
  if (fs.existsSync(jsonPath)) {
    try {
      const existingData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
      newModalities.forEach(newMod => {
        const idx = existingData.findIndex(m => m.id === newMod.id)
        if (idx >= 0) {
          existingData[idx] = { ...existingData[idx], ...newMod }
        } else {
          existingData.push(newMod)
        }
      })
      fs.writeFileSync(jsonPath, JSON.stringify(existingData, null, 2), 'utf8')
      console.log('Successfully updated all_modalities.json!')
    } catch (e) {
      console.error('Error updating all_modalities.json:', e)
    }
  }

  console.log('Finished seeding and updating modalities!')
}

seedNewModalities()
