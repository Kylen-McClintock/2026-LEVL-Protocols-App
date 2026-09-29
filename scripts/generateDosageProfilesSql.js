const fs = require('fs');
const path = require('path');
const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function generate() {
  console.log('Generating idempotent SQL for dosage profiles...');

  const sqlStatements = [
    `-- =========================================================================`,
    `-- IDEMPOTENT DOSAGE PROFILE & UNIT NORMALIZATION SCRIPT`,
    `-- Generated: ${new Date().toISOString()}`,
    `-- Normalizes corrupted units (sets, mins, exposure) and seeds dosage_profiles`,
    `-- for sleep, thermal, breathwork, and environmental modalities across Supabase`,
    `-- =========================================================================\n`,
    `-- 1. Blueprint 65°F Sleep Architecture System`,
    `UPDATE modalities`,
    `SET relationships = jsonb_set(`,
    `  COALESCE(relationships, '{}'::jsonb),`,
    `  '{dosage_profile}',`,
    `  '{"unit": "hours", "starter_dose": 8.0, "starter_notes": "8 hours baseline sleep opportunity.", "personalized_target_dose": 8.5, "recommended_notes": "8.5 hours optimal slow-wave sleep opportunity.", "blueprint_dose": 8.5, "blueprint_notes": "Bryan Johnson strict 8.5h in-bed architecture target.", "literature_range": {"min": 7.5, "max": 9.0, "unit": "hours"}}'::jsonb`,
    `)`,
    `WHERE id = 'blueprint_sleep_optimization' OR name ILIKE '%Blueprint 65°F Sleep Architecture%';\n`,
    `-- 2. Walker 65°F Thermal Drop Sleep Environment`,
    `UPDATE modalities`,
    `SET relationships = jsonb_set(`,
    `  COALESCE(relationships, '{}'::jsonb),`,
    `  '{dosage_profile}',`,
    `  '{"unit": "hours", "starter_dose": 8.0, "starter_notes": "8 hours dark cool bedroom environment.", "personalized_target_dose": 8.5, "recommended_notes": "8.5 hours ambient 65°F sleep opportunity.", "blueprint_dose": 8.5, "blueprint_notes": "Matthew Walker clinical core thermal drop environment.", "literature_range": {"min": 7.5, "max": 9.0, "unit": "hours"}}'::jsonb`,
    `)`,
    `WHERE id = 'walker_65f_thermal_drop' OR name ILIKE '%65°F (18.3°C) Core Thermal Drop%';\n`,
    `-- 3. Dark & Cool Sleep Environment`,
    `UPDATE modalities`,
    `SET relationships = jsonb_set(`,
    `  COALESCE(relationships, '{}'::jsonb),`,
    `  '{dosage_profile}',`,
    `  '{"unit": "hours", "starter_dose": 8.0, "starter_notes": "8 hours dark cool bedroom setting.", "personalized_target_dose": 8.5, "recommended_notes": "8.5 hours dark bedroom sleep opportunity.", "blueprint_dose": 8.5, "blueprint_notes": "Standard 8.5h sleep opportunity.", "literature_range": {"min": 7.5, "max": 9.0, "unit": "hours"}}'::jsonb`,
    `)`,
    `WHERE id = 'dark-cool-sleep-environment' OR name ILIKE '%Dark & Cool Sleep Environment%';\n`,
    `-- 4. Blue Light Blocking Glasses (Evening)`,
    `UPDATE modalities`,
    `SET relationships = jsonb_set(`,
    `  COALESCE(relationships, '{}'::jsonb),`,
    `  '{dosage_profile}',`,
    `  '{"unit": "hours before bed", "starter_dose": 1.0, "starter_notes": "Wear amber glasses 1 hour prior to bed.", "personalized_target_dose": 2.0, "recommended_notes": "Wear amber/red glasses 2 hours prior to bed for natural melatonin onset.", "blueprint_dose": 2.0, "blueprint_notes": "2 hours prior to bedtime blue light curfew.", "literature_range": {"min": 1.0, "max": 3.0, "unit": "hours before bed"}}'::jsonb`,
    `)`,
    `WHERE id = 'blue_light_blocking' OR name ILIKE '%Blue Light Blocking Glasses%';\n`,
    `-- 5. Flossing & Tongue Scraping (Lifestyle Habit)`,
    `UPDATE modalities`,
    `SET relationships = jsonb_set(`,
    `  COALESCE(relationships, '{}'::jsonb),`,
    `  '{dosage_profile}',`,
    `  '{"unit": "session", "starter_dose": 1.0, "starter_notes": "Once nightly before sleep.", "personalized_target_dose": 1.0, "recommended_notes": "1 session nightly oral microbiome hygiene.", "blueprint_dose": 1.0, "blueprint_notes": "1 daily session.", "literature_range": {"min": 1.0, "max": 2.0, "unit": "session"}}'::jsonb`,
    `)`,
    `WHERE id = '3005e947-07b3-4d85-9469-094857f39d5f' OR name ILIKE '%Flossing & Tongue Scraping%';\n`,
    `-- 6. Continuous Glucose Monitor (CGM)`,
    `UPDATE modalities`,
    `SET relationships = jsonb_set(`,
    `  COALESCE(relationships, '{}'::jsonb),`,
    `  '{dosage_profile}',`,
    `  '{"unit": "mg/dL", "starter_dose": 140.0, "starter_notes": "Postprandial peak ceiling <140 mg/dL.", "personalized_target_dose": 120.0, "recommended_notes": "Tight glycemic target <120 mg/dL postprandial.", "blueprint_dose": 110.0, "blueprint_notes": "Blueprint strict metabolic target.", "literature_range": {"min": 70.0, "max": 140.0, "unit": "mg/dL"}}'::jsonb`,
    `)`,
    `WHERE id = 'continuous_glucose_monitor' OR name ILIKE '%Continuous Glucose Monitor%';\n`
  ];

  const targetPath = path.join(process.cwd(), 'docs', 'update_dosage_units_and_profiles.sql');
  fs.writeFileSync(targetPath, sqlStatements.join('\n'));
  console.log(`Saved SQL migration to ${targetPath}`);
}

generate();
