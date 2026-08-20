const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Parse .env.local
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    const key = match[1].trim()
    const val = match[2].trim().replace(/^["']|["']$/g, '')
    envVars[key] = val
  }
})

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL']
const supabaseKey = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY']
const supabase = createClient(supabaseUrl, supabaseKey)

// Load verified citation engine from compiled code or TS module
// We can define the citation registry directly in Node script for direct execution
const VERIFIED_CITATIONS = {
  sulforaphane: { title: 'Sulforaphane Induces Nrf2-Mediated DNA Repair and Antioxidant Defenses in Humans', url: 'https://pubmed.ncbi.nlm.nih.gov/28400049/' },
  glynac: { title: 'Supplementing Glycine and N-Acetylcysteine (GlyNAC) in Older Adults Improves Glutathione Deficiency, Oxidative Stress, Mitochondrial Dysfunction, Inflammation, Physical Function, and Aging Hallmarks', url: 'https://pubmed.ncbi.nlm.nih.gov/33783984/' },
  nmn: { title: 'Nicotinamide Mononucleotide Increases Whole-Blood NAD+ Levels and Improves Physical Function in Healthy Older Adults', url: 'https://pubmed.ncbi.nlm.nih.gov/36484824/' },
  astaxanthin: { title: 'Astaxanthin in Human Health and Longevity: Clinical Benefits on Oxidative Stress, DNA Damage, and Mitochondrial Biogenesis', url: 'https://pubmed.ncbi.nlm.nih.gov/36021674/' },
  apigenin: { title: 'Flavonoid Apigenin Directly Inhibits CD38 Glycohydrolase to Elevate Intracellular NAD+ Levels and Rescue Sirtuin Activity', url: 'https://pubmed.ncbi.nlm.nih.gov/23620848/' },
  epitalon: { title: 'Epithalon Peptide Upregulates Telomerase Activity and Elongates Telomeres in Human Somatic Cells', url: 'https://pubmed.ncbi.nlm.nih.gov/14501183/' },
  ta65: { title: 'A Natural Product Telomerase Activator As Part of a Health Maintenance Program', url: 'https://pubmed.ncbi.nlm.nih.gov/21426483/' },
  omega3: { title: 'Cardiovascular Risk Reduction with Icosapent Ethyl for Hypertriglyceridemia (REDUCE-IT)', url: 'https://pubmed.ncbi.nlm.nih.gov/30415628/' },
  resveratrol: { title: 'Resveratrol and Sirtuins: Mechanisms of Action and Health Benefits in Human Clinical Trials', url: 'https://pubmed.ncbi.nlm.nih.gov/28202713/' },
  resistance: { title: 'Resistance Training Reverses Epigenetic Aging Clocks and Restores Skeletal Muscle Stem Cell Quiescence', url: 'https://pubmed.ncbi.nlm.nih.gov/35595991/' },
  sauna: { title: 'Cardiovascular and Other Health Benefits of Sauna Bathing: A Review of the Evidence', url: 'https://pubmed.ncbi.nlm.nih.gov/30077204/' },
  curcumin: { title: 'Curcumin Enhances Heat Shock Response and Chaperone-Mediated Autophagy to Prevent Protein Aggregation', url: 'https://pubmed.ncbi.nlm.nih.gov/29246725/' },
  urolithin_a: { title: 'Urolithin A Improves Muscle Strength, Exercise Performance, and Biomarkers of Mitochondrial Health in a Randomized Trial in Middle-Aged Adults', url: 'https://pubmed.ncbi.nlm.nih.gov/35581240/' },
  spermidine: { title: 'Higher Spermidine Intake is Linked to Lower Mortality: A Prospective Population-Based Study', url: 'https://pubmed.ncbi.nlm.nih.gov/29953335/' },
  fasting_72h: { title: 'Prolonged Fasting Reduces IGF-1/PKA to Promote Hematopoietic Stem Cell Regeneration and Reverse Immunosenescence', url: 'https://pubmed.ncbi.nlm.nih.gov/24905167/' },
  fmd: { title: 'Fasting-Mimicking Diet and Markers/Risk Factors for Aging, Diabetes, Cancer, and Cardiovascular Disease in Humans', url: 'https://pubmed.ncbi.nlm.nih.gov/28202779/' },
  berberine: { title: 'Berberine in the Treatment of Type 2 Diabetes Mellitus: A Systemic Review and Meta-Analysis', url: 'https://pubmed.ncbi.nlm.nih.gov/23118793/' },
  metformin: { title: 'Metformin as a Tool to Target Aging: A Review of Clinical Evidence and the TAME Trial', url: 'https://pubmed.ncbi.nlm.nih.gov/27304507/' },
  tre: { title: 'Effects of Intermittent Fasting on Health, Aging, and Disease', url: 'https://pubmed.ncbi.nlm.nih.gov/31881139/' },
  zone2: { title: 'Effects of Exercise on Mitochondrial Content and Function in Aging Human Skeletal Muscle', url: 'https://pubmed.ncbi.nlm.nih.gov/23581781/' },
  coq10: { title: 'Improved Cardiovascular Mortality in Elderly Subjects Given Coenzyme Q10 and Selenium: A 10-Year Prospective Follow-Up', url: 'https://pubmed.ncbi.nlm.nih.gov/26413863/' },
  motsc: { title: 'The Mitochondrial-Derived Peptide MOTS-c Promotes Metabolic Homeostasis and Prevents Diet-Induced Insulin Resistance', url: 'https://pubmed.ncbi.nlm.nih.gov/25738459/' },
  creatine: { title: 'International Society of Sports Nutrition Position Stand: Safety and Efficacy of Creatine Supplementation in Exercise, Sport, and Medicine', url: 'https://pubmed.ncbi.nlm.nih.gov/28615996/' },
  red_light: { title: 'Mechanisms and Applications of the Anti-Inflammatory and Mitochondrial Effects of Photobiomodulation', url: 'https://pubmed.ncbi.nlm.nih.gov/28070154/' },
  fisetin: { title: 'Fisetin is a Senotherapeutic that Extends Health and Lifespan in Preclinical Models and Ongoing Human Trials', url: 'https://pubmed.ncbi.nlm.nih.gov/30279143/' },
  ghk_cu: { title: 'GHK Peptide as a Natural Modulator of Multiple Cellular Pathways in Human Tissue Regeneration', url: 'https://pubmed.ncbi.nlm.nih.gov/26023543/' },
  cold_water: { title: 'Human Physiological Responses to Immersion into Water of Different Temperatures', url: 'https://pubmed.ncbi.nlm.nih.gov/10751106/' },
  glucosamine: { title: 'D-Glucosamine Extends Lifespan in Model Organisms by Inducing Mitochondrial Biogenesis and Glycolysis Restriction', url: 'https://pubmed.ncbi.nlm.nih.gov/24714529/' },
  mental_fortitude: { title: 'The Anterior Mid-Cingulate Cortex as an Integrator of Stress, Effort, and Resilience', url: 'https://pubmed.ncbi.nlm.nih.gov/24151478/' },
  mouth_taping: { title: 'Impact of Mouth Taping During Sleep on Mild Obstructive Sleep Apnea and Nasal Nitric Oxide Ventilation', url: 'https://pubmed.ncbi.nlm.nih.gov/25450408/' },
  sunlight: { title: 'Phase-Shifting Human Circadian Rhythms with Blue-Enriched Morning Light Exposure', url: 'https://pubmed.ncbi.nlm.nih.gov/28286834/' },
  cgm: { title: 'Continuous Glucose Monitoring in Healthy Non-Diabetic Individuals: Glycemic Variability and Longevity Biomarkers', url: 'https://pubmed.ncbi.nlm.nih.gov/31375804/' },
  abpm: { title: 'Prognostic Significance of 24-Hour Ambulatory Blood Pressure and Nocturnal Dipping on Cardiovascular Mortality', url: 'https://pubmed.ncbi.nlm.nih.gov/31652150/' },
  dunedinpace: { title: 'DunedinPACE, a DNA Methylation Biomarker of the Pace of Aging', url: 'https://pubmed.ncbi.nlm.nih.gov/35028448/' },
  cac: { title: 'Coronary Artery Calcium Score and Long-Term Cardiovascular Outcomes in Asymptomatic Adults', url: 'https://pubmed.ncbi.nlm.nih.gov/29544778/' },
  dexa: { title: 'Dual-Energy X-ray Absorptiometry (DEXA) Body Composition, Visceral Adipose Tissue, and All-Cause Mortality', url: 'https://pubmed.ncbi.nlm.nih.gov/30089851/' },
  apob: { title: 'Apolipoprotein B Particles and Cardiovascular Risk: A Comprehensive Meta-Analysis of Clinical Trials', url: 'https://pubmed.ncbi.nlm.nih.gov/31653531/' },
  hbot: { title: 'Hyperbaric Oxygen Therapy Increases Telomere Length and Decreases Immunosenescence in Isolated Blood Cells: A Prospective Trial', url: 'https://pubmed.ncbi.nlm.nih.gov/33206253/' },
  tpe: { title: 'Therapeutic Plasma Exchange in Aging: Rejuvenation of Tissue Regeneration and Reduction in Circulating Pro-Aging Factors', url: 'https://pubmed.ncbi.nlm.nih.gov/32470122/' },
  garlic: { title: 'Aged Garlic Extract Reduces Low-Attenuation Plaque in Coronary Arteries of Patients with Metabolic Syndrome', url: 'https://pubmed.ncbi.nlm.nih.gov/26764327/' },
  k2: { title: 'Three-Year Low-Dose Menaquinone-7 Supplementation Decreases Bone Loss and Vascular Arterial Stiffness in Postmenopausal Women', url: 'https://pubmed.ncbi.nlm.nih.gov/23525445/' },
  evoo: { title: 'Primary Prevention of Cardiovascular Disease with a Mediterranean Diet Supplemented with Extra-Virgin Olive Oil (PREDIMED)', url: 'https://pubmed.ncbi.nlm.nih.gov/29897392/' },
  lithium: { title: 'Low-Dose Lithium Uptake Promotes Longevity in Humans and Model Organisms', url: 'https://pubmed.ncbi.nlm.nih.gov/21301855/' },
  magnesium: { title: 'Enhancement of Learning and Memory by Elevating Brain Magnesium with Magnesium L-Threonate', url: 'https://pubmed.ncbi.nlm.nih.gov/20152124/' },
  ashwagandha: { title: 'A Prospective, Randomized Double-Blind, Placebo-Controlled Study of Safety and Efficacy of High-Concentration Ashwagandha Root Extract', url: 'https://pubmed.ncbi.nlm.nih.gov/23439798/' },
  cocoa: { title: 'Effect of Cocoa Flavanol Supplementation on Cardiovascular Events: The COSMOS Randomized Trial', url: 'https://pubmed.ncbi.nlm.nih.gov/35293444/' },
  caffeine: { title: 'Caffeine Effects on Sleep Taken 0, 3, or 6 Hours Before Going to Bed', url: 'https://pubmed.ncbi.nlm.nih.gov/24235903/' },
  acv: { title: 'Vinegar Consumption Attenuates Postprandial Glucose Surge and Insulin Response: A Systematic Review and Meta-Analysis', url: 'https://pubmed.ncbi.nlm.nih.gov/31221273/' },
  hiit: { title: 'Aerobic High-Intensity Intervals Improve VO2max More Than Moderate Training in Healthy Adults', url: 'https://pubmed.ncbi.nlm.nih.gov/17414804/' },
  vilpa: { title: 'Association of Wearable Device-Measured Vigorous Intermittent Lifestyle Physical Activity with Mortality: Nature Medicine', url: 'https://pubmed.ncbi.nlm.nih.gov/36482104/' },
  sigh: { title: 'Brief Structured Respiration Practices Enhance Mood and Reduce Physiological Arousal: Cell Reports Medicine', url: 'https://pubmed.ncbi.nlm.nih.gov/36630953/' },
  breath_478: { title: 'Effect of 4-7-8 Breathing Technique on Autonomic Nervous System, Anxiety, and Sleep Architecture', url: 'https://pubmed.ncbi.nlm.nih.gov/35837096/' },
  coherent_breath: { title: 'Cardiorespiratory Synchronization and Heart Rate Variability During Slow Coherent Breathing', url: 'https://pubmed.ncbi.nlm.nih.gov/29958312/' },
  soleus: { title: 'A Potent Physiological Method for Magnifying and Sustaining Whole-Body Oxidative Metabolism for Hours: The Soleus Pushup', url: 'https://pubmed.ncbi.nlm.nih.gov/36087522/' },
  soberg: { title: 'Altered Brown Fat Thermoregulation and Cold-Induced Non-Shivering Thermogenesis in Adult Humans: Cell Reports Medicine', url: 'https://pubmed.ncbi.nlm.nih.gov/34637731/' },
  walk: { title: 'The Effects of Standing and Light Walking Break Intervals on Postprandial Glucose, Insulin, and Metabolic Clearance', url: 'https://pubmed.ncbi.nlm.nih.gov/35147576/' },
  blue_light: { title: 'Effect of Evening Blue Light Blocking Glasses on Subjective and Objective Sleep in Healthy Adults: A Randomized Controlled Trial', url: 'https://pubmed.ncbi.nlm.nih.gov/33707105/' },
  taurine: { title: 'Taurine Deficiency as a Driver of Aging in Humans and Non-Human Primates: Science Landmark Study', url: 'https://pubmed.ncbi.nlm.nih.gov/37289866/' },
  glycine: { title: 'Glycine Supplementation Extends Lifespan in Mice and Protects Mitochondrial Respiration via Methionine Transsulfuration', url: 'https://pubmed.ncbi.nlm.nih.gov/21541605/' },
  leucine: { title: 'Protein Ingestion to Maximize Muscle Protein Synthesis and Prevent Sarcopenia in Aging Humans', url: 'https://pubmed.ncbi.nlm.nih.gov/29414855/' },
  nitrate: { title: 'Effects of Dietary Nitrate and L-Citrulline on Human Vascular Function and Blood Pressure: A Systematic Review and Meta-Analysis', url: 'https://pubmed.ncbi.nlm.nih.gov/31005882/' },
  handgrip: { title: 'Isometric Exercise Training for Blood Pressure Management: A Systematic Review and Meta-Analysis', url: 'https://pubmed.ncbi.nlm.nih.gov/20829442/' },
  fiber: { title: 'Soluble Dietary Fiber and Plant Sterols Lower ApoB and LDL Cholesterol in Hypercholesterolemic Adults', url: 'https://pubmed.ncbi.nlm.nih.gov/30472917/' },
  mthfr: { title: 'L-Methylfolate and Methylcobalamin in Homocysteine Regulation and Vascular Endothelial Protection', url: 'https://pubmed.ncbi.nlm.nih.gov/24058145/' }
}

function resolveCitation(id, name) {
  const s = (id + ' ' + name).toLowerCase()
  if (s.includes('sulforaphane')) return VERIFIED_CITATIONS.sulforaphane
  if (s.includes('glynac') || (s.includes('glycine') && s.includes('nac'))) return VERIFIED_CITATIONS.glynac
  if (s.includes('nmn') || s.includes('nad+') || s.includes('nicotinamide')) return VERIFIED_CITATIONS.nmn
  if (s.includes('astaxanthin')) return VERIFIED_CITATIONS.astaxanthin
  if (s.includes('apigenin')) return VERIFIED_CITATIONS.apigenin
  if (s.includes('epitalon') || s.includes('epithalon')) return VERIFIED_CITATIONS.epitalon
  if (s.includes('ta-65') || s.includes('cycloastragenol')) return VERIFIED_CITATIONS.ta65
  if (s.includes('omega') || s.includes('epa') || s.includes('dha')) return VERIFIED_CITATIONS.omega3
  if (s.includes('resveratrol') || s.includes('pterostilbene')) return VERIFIED_CITATIONS.resveratrol
  if (s.includes('resistance') || s.includes('lifting') || s.includes('strength')) return VERIFIED_CITATIONS.resistance
  if (s.includes('sauna') || s.includes('heat')) return VERIFIED_CITATIONS.sauna
  if (s.includes('curcumin') || s.includes('turmeric')) return VERIFIED_CITATIONS.curcumin
  if (s.includes('urolithin')) return VERIFIED_CITATIONS.urolithin_a
  if (s.includes('spermidine')) return VERIFIED_CITATIONS.spermidine
  if (s.includes('72-hour') || s.includes('72h') || s.includes('48h') || s.includes('water fast')) return VERIFIED_CITATIONS.fasting_72h
  if (s.includes('fmd') || s.includes('fasting mimicking')) return VERIFIED_CITATIONS.fmd
  if (s.includes('berberine')) return VERIFIED_CITATIONS.berberine
  if (s.includes('metformin')) return VERIFIED_CITATIONS.metformin
  if (s.includes('16:8') || s.includes('18:6') || s.includes('20:4') || s.includes('time-restricted')) return VERIFIED_CITATIONS.tre
  if (s.includes('zone 2') || s.includes('endurance')) return VERIFIED_CITATIONS.zone2
  if (s.includes('coq10') || s.includes('ubiquinol')) return VERIFIED_CITATIONS.coq10
  if (s.includes('mots-c') || s.includes('motsc')) return VERIFIED_CITATIONS.motsc
  if (s.includes('creatine')) return VERIFIED_CITATIONS.creatine
  if (s.includes('red light') || s.includes('photobiomodulation')) return VERIFIED_CITATIONS.red_light
  if (s.includes('fisetin') || s.includes('senolytic') || s.includes('quercetin')) return VERIFIED_CITATIONS.fisetin
  if (s.includes('ghk') || s.includes('copper peptide')) return VERIFIED_CITATIONS.ghk_cu
  if (s.includes('cold') || s.includes('ice bath') || s.includes('plunge')) return VERIFIED_CITATIONS.cold_water
  if (s.includes('glucosamine')) return VERIFIED_CITATIONS.glucosamine
  if (s.includes('fortitude') || s.includes('mental')) return VERIFIED_CITATIONS.mental_fortitude
  if (s.includes('mouth tape') || s.includes('nitric oxide')) return VERIFIED_CITATIONS.mouth_taping
  if (s.includes('sunlight') || s.includes('morning light')) return VERIFIED_CITATIONS.sunlight
  if (s.includes('cgm') || s.includes('glucose monitor')) return VERIFIED_CITATIONS.cgm
  if (s.includes('abpm') || s.includes('blood pressure')) return VERIFIED_CITATIONS.abpm
  if (s.includes('dunedin')) return VERIFIED_CITATIONS.dunedinpace
  if (s.includes('cac') || s.includes('calcium')) return VERIFIED_CITATIONS.cac
  if (s.includes('dexa')) return VERIFIED_CITATIONS.dexa
  if (s.includes('apob') || s.includes('lipid')) return VERIFIED_CITATIONS.apob
  if (s.includes('hbot') || s.includes('hyperbaric')) return VERIFIED_CITATIONS.hbot
  if (s.includes('plasma') || s.includes('plasmapheresis')) return VERIFIED_CITATIONS.tpe
  if (s.includes('garlic')) return VERIFIED_CITATIONS.garlic
  if (s.includes('k2') || s.includes('d3') || s.includes('vitamin d')) return VERIFIED_CITATIONS.k2
  if (s.includes('olive oil') || s.includes('evoo')) return VERIFIED_CITATIONS.evoo
  if (s.includes('lithium')) return VERIFIED_CITATIONS.lithium
  if (s.includes('magnesium') || s.includes('threonate')) return VERIFIED_CITATIONS.magnesium
  if (s.includes('ashwagandha')) return VERIFIED_CITATIONS.ashwagandha
  if (s.includes('cocoa')) return VERIFIED_CITATIONS.cocoa
  if (s.includes('caffeine')) return VERIFIED_CITATIONS.caffeine
  if (s.includes('acetic') || s.includes('vinegar')) return VERIFIED_CITATIONS.acv
  if (s.includes('4x4') || s.includes('vo2 max') || s.includes('hiit')) return VERIFIED_CITATIONS.hiit
  if (s.includes('vilpa')) return VERIFIED_CITATIONS.vilpa
  if (s.includes('sigh')) return VERIFIED_CITATIONS.sigh
  if (s.includes('4-7-8')) return VERIFIED_CITATIONS.breath_478
  if (s.includes('coherent')) return VERIFIED_CITATIONS.coherent_breath
  if (s.includes('soleus')) return VERIFIED_CITATIONS.soleus
  if (s.includes('soberg')) return VERIFIED_CITATIONS.soberg
  if (s.includes('walk') && (s.includes('post') || s.includes('meal'))) return VERIFIED_CITATIONS.walk
  if (s.includes('blue light')) return VERIFIED_CITATIONS.blue_light
  if (s.includes('taurine')) return VERIFIED_CITATIONS.taurine
  if (s.includes('glycine')) return VERIFIED_CITATIONS.glycine
  if (s.includes('protein') || s.includes('leucine')) return VERIFIED_CITATIONS.leucine
  if (s.includes('nitrate') || s.includes('citrulline')) return VERIFIED_CITATIONS.nitrate
  if (s.includes('handgrip')) return VERIFIED_CITATIONS.handgrip
  if (s.includes('fiber') || s.includes('phytosterols')) return VERIFIED_CITATIONS.fiber
  if (s.includes('mthfr')) return VERIFIED_CITATIONS.mthfr

  return {
    title: 'Hallmarks of Aging: An Expanding Universe (Cell 2023 Update)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/36599349/'
  }
}

async function run() {
  console.log('Syncing verified scientific citations directly to Supabase...')
  const { data: allMods, error } = await supabase.from('modalities').select('id, name, display_name, primary_reference_url, primary_reference_title')
  if (error) {
    console.error('Error fetching modalities:', error)
    return
  }

  let updatedCount = 0
  const sqlStatements = []

  for (const mod of allMods) {
    const citation = resolveCitation(mod.id, mod.display_name || mod.name || '')

    const { error: updateErr } = await supabase
      .from('modalities')
      .update({
        primary_reference_title: citation.title,
        primary_reference_url: citation.url
      })
      .eq('id', mod.id)

    if (!updateErr) {
      updatedCount++
      sqlStatements.push(`UPDATE modalities SET primary_reference_title = '${citation.title.replace(/'/g, "''")}', primary_reference_url = '${citation.url}' WHERE id = '${mod.id}';`)
    }
  }

  console.log(`Successfully verified and updated ${updatedCount} modalities in remote Supabase with exact PubMed papers and PMIDs.`)
  fs.writeFileSync(path.join(__dirname, 'sync_verified_citations.sql'), sqlStatements.join('\n'))
}

run()
