const fs = require('fs');

const legacyUpdates = [
  { id: "creatine_monohydrate", dose: "5g", freq: "Daily", timing: "Anytime", benefit: 4 },
  { id: "cold_water_immersion", dose: "1-3 min @ <50°F", freq: "2-4x Weekly", timing: "Morning", benefit: 3 },
  { id: "magnesium_glycinate", dose: "200-400mg", freq: "Daily", timing: "Evening", benefit: 3 },
  { id: "morning_sunlight", dose: "10-30 min", freq: "Daily", timing: "Morning", benefit: 5 },
  { id: "intermittent_fasting_16_8", dose: "16 hours fasted", freq: "Daily", timing: "Anytime", benefit: 4 },
  { id: "acarbose", dose: "25-50mg", freq: "With high-carb meals", timing: "Anytime", benefit: 5 },
  { id: "nad_precursors", dose: "300-1000mg", freq: "Daily", timing: "Morning", benefit: 3 },
  { id: "resistance_training", dose: "3-6 sets per muscle group", freq: "2-4x Weekly", timing: "Anytime", benefit: 5 },
  { id: "dexa_scan", dose: "1 Scan", freq: "1-2x Annually", timing: "Anytime", benefit: 2 },
  { id: "continuous_glucose_monitor", dose: "Continuous", freq: "14-day wear", timing: "Anytime", benefit: 4 },
  { id: "l_theanine", dose: "100-200mg", freq: "Daily or As needed", timing: "Morning or Evening", benefit: 2 },
  { id: "apigenin", dose: "50mg", freq: "Daily", timing: "Evening", benefit: 2 },
  { id: "delay_caffeine", dose: "90-120 min delay", freq: "Daily", timing: "Morning", benefit: 3 },
  { id: "mouth_taping", dose: "1 piece medical tape", freq: "Daily", timing: "Evening", benefit: 3 },
  { id: "blue_light_blocking", dose: "Amber/Red glasses", freq: "Daily", timing: "Evening", benefit: 4 },
  { id: "berberine", dose: "500-1500mg", freq: "With meals", timing: "Anytime", benefit: 4 },
  { id: "optic_flow", dose: "10-20 min walk", freq: "As needed", timing: "Anytime", benefit: 2 },
  { id: "ashwagandha_ksm66", dose: "300-600mg", freq: "Cycled", timing: "Evening", benefit: 3 },
  { id: "rhodiola_rosea", dose: "200-400mg", freq: "As needed", timing: "Morning", benefit: 2 },
  { id: "glycine_3g", dose: "3g", freq: "Daily", timing: "Evening", benefit: 3 },
  { id: "zone_2_cardio", dose: "45-60 min @ 60-70% Max HR", freq: "3-4x Weekly", timing: "Morning / Pre-meal", benefit: 5 },
  { id: "epa_dha_omega3", dose: "2g EPA / 1g DHA", freq: "Daily", timing: "With largest fat meal", benefit: 4 },
  { id: "sauna_exposure", dose: "20 min @ 80°C+", freq: "4-7x Weekly", timing: "Evening / Post-workout", benefit: 4 },
  { id: "spermidine_supplement", dose: "1-2mg pure spermidine", freq: "Daily", timing: "Evening / Fasted", benefit: 3 },
  { id: "rapamycin_weekly", dose: "5-8mg", freq: "Once Weekly", timing: "Morning", benefit: 5 },
  { id: "metformin_daily", dose: "500-1000mg", freq: "2x Daily", timing: "With meals", benefit: 4 },
  { id: "red_light_therapy", dose: "10-20 mins (10-50 mW/cm2)", freq: "3-5x Weekly", timing: "Anytime", benefit: 3 },
  { id: "nac_supplement", dose: "600-1200mg", freq: "Daily", timing: "Morning / Fasted", benefit: 3 },
  { id: "vitamin_d3_k2", dose: "5000 IU D3 / 100mcg K2", freq: "Daily", timing: "Morning with fats", benefit: 4 },
  { id: "fisetin", dose: "20mg/kg bodyweight", freq: "2-3 Days Monthly", timing: "Morning with fats", benefit: 3 },
  { id: "myo_inositol", dose: "2-4g", freq: "Daily", timing: "Evening / Before Bed", benefit: 3 },
  { id: "lions_mane", dose: "1-3g (Dual Extract)", freq: "Daily", timing: "Morning", benefit: 2 },
  { id: "curcumin_phytosome", dose: "500-1000mg", freq: "Daily", timing: "With Meals", benefit: 3 },
  { id: "phosphatidylserine", dose: "300mg", freq: "Daily", timing: "Afternoon/Evening", benefit: 2 },
  { id: "l_tyrosine", dose: "500-1000mg", freq: "As needed", timing: "30-60m pre-focus", benefit: 2 },
  { id: "hiit_vo2_max", dose: "4x4 intervals (4m hard, 4m rest)", freq: "1-2x Weekly", timing: "Morning / Afternoon", benefit: 5 },
  { id: "alcar_carnitine", dose: "500-1500mg", freq: "Daily", timing: "Morning / Pre-workout", benefit: 2 },
  { id: "magnesium_threonate", dose: "144mg elemental Mg", freq: "Daily", timing: "Evening", benefit: 3 },
  { id: "astaxanthin", dose: "4-12mg", freq: "Daily", timing: "With Fats", benefit: 3 },
  { id: "liposomal_glutathione", dose: "250-500mg", freq: "As needed / Cycled", timing: "Morning fasted", benefit: 3 },
  { id: "urolithin_a", dose: "500-1000mg", freq: "Daily", timing: "Morning", benefit: 4 },
  { id: "nad_iv_therapy", dose: "250-500mg IV", freq: "Monthly / Cycled", timing: "Morning", benefit: 3 },
  { id: "methylated_b_complex", dose: "Standard B-Complex", freq: "Daily", timing: "Morning", benefit: 3 },
  { id: "collagen_peptides", dose: "10-20g", freq: "Daily", timing: "Morning", benefit: 3 },
  { id: "taurine", dose: "1-3g", freq: "Daily", timing: "Pre-workout or Evening", benefit: 4 },
  { id: "blood_donation", dose: "1 Pint (Whole Blood)", freq: "1-3x Annually", timing: "Anytime", benefit: 3 },
  { id: "hyperbaric_oxygen", dose: "60-90 min @ 1.5-2.0 ATA", freq: "10-40 Session Protocols", timing: "Anytime", benefit: 4 },
  { id: "cpap_therapy", dose: "Continuous Airway Pressure", freq: "Nightly", timing: "During Sleep", benefit: 5 },
  { id: "methylene_blue", dose: "0.5 - 1.0 mg/kg", freq: "Cycled / As needed", timing: "Morning", benefit: 3 },
  { id: "pterostilbene", dose: "50mg", freq: "Daily", timing: "Morning", benefit: 2 },
  { id: "alpha_ketoglutarate", dose: "1000mg", freq: "Daily", timing: "Morning", benefit: 3 },
  { id: "sulforaphane", dose: "10-20mg", freq: "Daily", timing: "With Meals", benefit: 3 },
  { id: "l_citrulline", dose: "6-8g", freq: "As needed", timing: "30-60m Pre-workout", benefit: 3 },
  { id: "evoo_high_polyphenol", dose: "1-2 Tbsp", freq: "Daily", timing: "With Meals", benefit: 4 },
  { id: "kefir", dose: "1-2 Cups", freq: "Daily", timing: "With Meals", benefit: 4 },
  { id: "akkermansia", dose: "100 Million AFU", freq: "Daily", timing: "With Meals", benefit: 4 }
];

const newUpdates = [
  { id: "glp_1_receptor_agonists", dose: "0.25 - 2.4mg", freq: "Weekly", timing: "Anytime", benefit: 5, moa: "Agonizes the GLP-1 receptor, delaying gastric emptying and increasing satiety signals to the brain.", syn: { "pairsWellWith": ["resistance_training"], "rationale": "Mitigates the lean muscle mass loss typically seen with GLP-1 induced weight loss." } },
  { id: "melatonin", dose: "0.3 - 3.0mg", freq: "Daily", timing: "30m before bed", benefit: 3, moa: "Acts as a potent mitochondrial antioxidant and circadian rhythm anchor.", syn: { "pairsWellWith": ["magnesium_glycinate"], "rationale": "Enhances sleep initiation and architecture." } },
  { id: "continuous_ketone_monitors", dose: "Continuous", freq: "14-day wear", timing: "Anytime", benefit: 3, moa: "Provides real-time feedback on systemic beta-hydroxybutyrate levels." },
  { id: "sleep_consistency", dose: "Targeted Bedtime", freq: "Nightly", timing: "Same time +/- 30m", benefit: 5, moa: "Entrains the suprachiasmatic nucleus, optimizing the cortisol/melatonin axis." },
  { id: "quercetin", dose: "500-1000mg", freq: "Cycled", timing: "With Meals", benefit: 3, moa: "Acts as a senolytic and powerful flavonoid antioxidant.", syn: { "pairsWellWith": ["dasatinib", "fisetin"], "rationale": "Creates a broad-spectrum senolytic cocktail capable of clearing multiple senescent cell types." } },
  { id: "whole_body_mri", dose: "1 Scan", freq: "Every 1-3 Years", timing: "Anytime", benefit: 4, moa: "Non-ionizing radiation imaging for early detection of solid tumors and aneurysms." },
  { id: "nmn", dose: "250-1000mg", freq: "Daily", timing: "Morning", benefit: 3, moa: "A direct precursor to NAD+, bypassing the NAMPT bottleneck to increase cellular energy." },
  { id: "biological_age_testing", dose: "1 Test", freq: "1-2x Annually", timing: "Anytime", benefit: 3, moa: "Measures DNA methylation status at specific CpG sites to calculate epigenetic aging rate." },
  { id: "bfr_training", dose: "4 Sets (30-15-15-15 reps)", freq: "1-3x Weekly", timing: "Anytime", benefit: 4, moa: "Traps venous blood flow while maintaining arterial flow, inducing massive metabolic stress at light weights." },
  { id: "shilajit", dose: "250-500mg", freq: "Daily", timing: "Morning", benefit: 3, moa: "Rich in fulvic acid, it enhances mitochondrial ATP production and CoQ10 synthesis." },
  { id: "coq10", dose: "100-200mg", freq: "Daily", timing: "With Fats", benefit: 4, moa: "An essential component of the electron transport chain, facilitating ATP synthesis in mitochondria." },
  { id: "plasmapheresis_therapeutic_plasma_exchange", dose: "1 Exchange", freq: "1-4x Annually", timing: "Anytime", benefit: 4, moa: "Mechanically removes accumulated age-related proteins, autoantibodies, and systemic inflammatory factors from plasma." }
];

function escapeString(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + str.replace(/'/g, "''") + "'";
}

let sql = `-- Patching missing parameters (dose, freq, timing, and benefits)\n\n`;

// Handle legacy ones
for (const u of legacyUpdates) {
  sql += `UPDATE modalities SET 
    dose_or_exposure = ${escapeString(u.dose)}, 
    frequency = ${escapeString(u.freq)}, 
    timing_summary = ${escapeString(u.timing)}, 
    overall_longevity_benefit = ${u.benefit} 
  WHERE id = ${escapeString(u.id)};\n`;
}

// Handle the newer ones where we also want to fix the generic MoA and Synergies
for (const u of newUpdates) {
  const synStr = u.syn ? `'${JSON.stringify(u.syn).replace(/'/g, "''")}'::jsonb` : `'{}'::jsonb`;
  sql += `UPDATE modalities SET 
    dose_or_exposure = ${escapeString(u.dose)}, 
    frequency = ${escapeString(u.freq)}, 
    timing_summary = ${escapeString(u.timing)}, 
    overall_longevity_benefit = ${u.benefit},
    mechanism_of_action = ${escapeString(u.moa)},
    synergy_notes = ${synStr}
  WHERE id = ${escapeString(u.id)};\n`;
}

fs.writeFileSync('/Users/kylenmcclintock/Documents/AntiGravity Projects/New LEVL Protocols App/fix_missing_fields.sql', sql);
console.log('Update SQL generated successfully.');
