import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import {
  BUILT_IN_FUNCTIONAL_PROTOCOLS,
  ALL_BUILT_IN_FUNCTIONAL_MODALITIES
} from '../lib/data/builtInFunctionalProtocols'

// 1. Parse .env.local
const envPath = path.join(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const env: Record<string, string> = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
  if (match) {
    let val = match[2] || ''
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1)
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1)
    env[match[1]] = val
  }
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

function escapeSqlString(val: string | null | undefined): string {
  if (val === null || val === undefined) return 'NULL'
  return `'${val.replace(/'/g, "''")}'`
}

function escapeSqlJson(val: any): string {
  if (val === null || val === undefined) return "'{}'::jsonb"
  return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`
}

function escapeSqlArray(val: string[] | null | undefined): string {
  if (!val || val.length === 0) return "'{}'::text[]"
  const inner = val.map(s => `"${s.replace(/"/g, '\\"')}"`).join(',')
  return `'{${inner}}'::text[]`
}

const STEP_UUID_MAP: Record<string, string> = {
  // Protocol 1: Gut Microbiome
  'gut_step_fermented_foods': 'a1000001-0000-4000-8000-000000000001',
  'gut_step_akkermansia': 'a1000001-0000-4000-8000-000000000002',
  'gut_step_tributyrin': 'a1000001-0000-4000-8000-000000000003',
  'gut_step_zinc_carnosine': 'a1000001-0000-4000-8000-000000000004',
  // Protocol 2: Glymphatic System
  'glymphatic_step_lateral_sleep': 'a2000002-0000-4000-8000-000000000001',
  'glymphatic_step_gamma_40hz': 'a2000002-0000-4000-8000-000000000002',
  'glymphatic_step_tpbm': 'a2000002-0000-4000-8000-000000000003',
  'glymphatic_step_mouth_tape': 'a2000002-0000-4000-8000-000000000004',
  // Protocol 3: Retinal Mitochondria
  'retinal_step_670nm_light': 'a3000003-0000-4000-8000-000000000001',
  'retinal_step_carotenoid_shield': 'a3000003-0000-4000-8000-000000000002',
  'retinal_step_astaxanthin': 'a3000003-0000-4000-8000-000000000003',
  'retinal_step_20_20_20': 'a3000003-0000-4000-8000-000000000004',
  // Protocol 4: Arterial Compliance & Endothelial NO
  'arterial_step_imst': 'a4000004-0000-4000-8000-000000000001',
  'arterial_step_handgrip': 'a4000004-0000-4000-8000-000000000002',
  'arterial_step_cocoa_flavanols': 'a4000004-0000-4000-8000-000000000003',
  'arterial_step_aged_garlic': 'a4000004-0000-4000-8000-000000000004',
  // Protocol 5: Bone Density & Trabecular Architecture
  'bone_step_liftmor_loading': 'a5000005-0000-4000-8000-000000000001',
  'bone_step_impact_hops': 'a5000005-0000-4000-8000-000000000002',
  'bone_step_mcha_boron': 'a5000005-0000-4000-8000-000000000003',
  'bone_step_liov_vibration': 'a5000005-0000-4000-8000-000000000004',
  // Protocol 6: Hair Follicle Longevity & Scalp Perfusion
  'hair_step_dermastamp': 'a6000006-0000-4000-8000-000000000001',
  'hair_step_lllt_655nm': 'a6000006-0000-4000-8000-000000000002',
  'hair_step_rosemary_serum': 'a6000006-0000-4000-8000-000000000003',
  'hair_step_saw_palmetto_pumpkin': 'a6000006-0000-4000-8000-000000000004',
  // Protocol 7: Full-Body Lymphatic Flush & Microvascular Decongestion
  'lymph_step_compression_boots': 'a7000007-0000-4000-8000-000000000001',
  'lymph_step_rebounding': 'a7000007-0000-4000-8000-000000000002',
  'lymph_step_dry_brushing': 'a7000007-0000-4000-8000-000000000003',
  'lymph_step_contrast_flush': 'a7000007-0000-4000-8000-000000000004'
}

async function main() {
  console.log('--- Seeding All 7 Flagship Functional Protocols & 28 Modalities to Remote Supabase ---')

  // A. Upsert Modalities
  console.log(`\n1. Upserting ${ALL_BUILT_IN_FUNCTIONAL_MODALITIES.length} Clinical Modalities...`)
  const modalitySqlRows: string[] = []

  for (const m of ALL_BUILT_IN_FUNCTIONAL_MODALITIES) {
    const payload = {
      id: m.id,
      slug: m.slug || m.id,
      name: m.name,
      display_name: m.display_name || m.name,
      category: m.category,
      modality_type: m.modality_type || 'lifestyle',
      status: m.status || 'active',
      brief_description: m.brief_description,
      expanded_why: m.expanded_why,
      headline_benefit: m.headline_benefit,
      primary_outcome: m.primary_outcome,
      secondary_outcomes: m.secondary_outcomes || [],
      overall_longevity_benefit: m.overall_longevity_benefit || 8,
      implementation_summary: m.implementation_summary,
      instructions: m.instructions,
      dose_or_exposure: m.dose_or_exposure,
      timing_summary: m.timing_summary,
      frequency: m.frequency,
      schedule_pattern: m.schedule_pattern || 'daily',
      difficulty: m.difficulty || 'Intermediate',
      cost_tier: m.cost_tier || 'free',
      effort_level: m.effort_level || 'level_1',
      time_to_benefit: m.time_to_benefit,
      evidence_quality: m.evidence_quality || 5,
      effect_size_estimate: m.effect_size_estimate,
      evidence_summary: m.evidence_summary,
      safety_level: m.safety_level || 'high_safety',
      safety_summary: m.safety_summary,
      contraindications: m.contraindications || [],
      functional_outcomes_to_track: m.functional_outcomes_to_track || [],
      hallmarks_of_aging_impact: m.hallmarks_of_aging_impact || [],
      mechanism_of_action: m.mechanism_of_action,
      visibility: 'public',
      functional_impacts: m.functional_impacts || {}
    }

    const { error } = await supabase.from('modalities').upsert(payload, { onConflict: 'id' })
    if (error) {
      console.error(`Error upserting modality ${m.id}:`, error.message)
    } else {
      console.log(`  ✓ Modality synced: ${m.name} (${m.id})`)
    }

    // Only include Protocols 6 & 7 modalities in the SQL block for appending
    const p6p7Modalities = [
      'scalp_microneedling_dermastamp',
      'low_level_laser_therapy_scalp_655nm',
      'topical_standardized_rosemary_oil',
      'saw_palmetto_pumpkin_seed_extract',
      'intermittent_pneumatic_compression_boots',
      'rebounding_vertical_g_force',
      'centripetal_dry_brushing',
      'hydrostatic_vascular_contrast_flush'
    ]
    if (p6p7Modalities.includes(m.id)) {
      modalitySqlRows.push(`(
  ${escapeSqlString(m.id)},
  ${escapeSqlString(m.slug || m.id)},
  ${escapeSqlString(m.name)},
  ${escapeSqlString(m.display_name || m.name)},
  ${escapeSqlString(m.category)},
  ${escapeSqlString(m.modality_type || 'lifestyle')},
  'active',
  ${escapeSqlString(m.brief_description)},
  ${escapeSqlString(m.expanded_why)},
  ${escapeSqlString(m.headline_benefit)},
  ${escapeSqlString(m.primary_outcome)},
  ${escapeSqlString(m.dose_or_exposure)},
  ${escapeSqlString(m.timing_summary)},
  ${escapeSqlString(m.frequency)},
  ${escapeSqlString(m.difficulty || 'Intermediate')},
  ${escapeSqlString(m.cost_tier || 'free')},
  ${escapeSqlString(m.effort_level || 'level_1')},
  ${escapeSqlJson(m.hallmarks_of_aging_impact || [])},
  ${escapeSqlString(m.mechanism_of_action)},
  ${escapeSqlJson(m.functional_impacts || {})}
)`)
    }
  }

  // B. Upsert Protocols
  console.log(`\n2. Upserting ${BUILT_IN_FUNCTIONAL_PROTOCOLS.length} Flagship Functional Protocols...`)
  const protocolSqlRows: string[] = []

  for (const p of BUILT_IN_FUNCTIONAL_PROTOCOLS) {
    const protocolPayload = {
      id: p.id,
      name: p.name,
      goal: p.primary_goal,
      description: p.description,
      protocol_type: p.protocol_type || 'expert_created',
      primary_goal: p.primary_goal,
      secondary_goals: p.secondary_goals || [],
      difficulty_level: p.difficulty_level || 'Intermediate',
      visibility: 'public',
      review_status: 'approved',
      source_label: p.evidence_level || 'Human RCT Clinical Literature',
      target_vectors: p.target_vectors || []
    }

    const { error } = await supabase.from('protocols').upsert(protocolPayload, { onConflict: 'id' })
    if (error) {
      console.error(`Error upserting protocol ${p.id}:`, error.message)
    } else {
      console.log(`  ✓ Protocol synced: ${p.name} (${p.id})`)
    }

    if (p.id === 'follicular_anagen_revival_scalp_protocol' || p.id === 'full_body_lymphatic_flush_microvascular_protocol') {
      protocolSqlRows.push(`(
  ${escapeSqlString(p.id)},
  ${escapeSqlString(p.name)},
  ${escapeSqlString(p.description)},
  'expert_created',
  ${escapeSqlString(p.primary_goal)},
  ${escapeSqlArray(p.secondary_goals || [])},
  ${escapeSqlString(p.difficulty_level || 'Intermediate')},
  'public',
  'published',
  'Clinical Literature',
  ${escapeSqlArray(p.target_vectors || [])}
)`)
    }
  }

  // C. Upsert Protocol Steps
  console.log(`\n3. Upserting Protocol Steps...`)
  for (const p of BUILT_IN_FUNCTIONAL_PROTOCOLS) {
    for (const s of p.steps) {
      const stepId = STEP_UUID_MAP[s.id] || s.id
      const stepPayload = {
        id: stepId,
        protocol_id: p.id,
        modality_id: s.modality_id,
        ordering_index: s.ordering_index,
        display_order: s.display_order || s.ordering_index,
        timing_slot: s.timing_slot,
        timing_anchor: s.timing_anchor,
        frequency: s.frequency,
        required: s.required ?? true,
        dose_text: s.dose_text,
        notes: s.notes,
        target_outcomes: s.target_outcomes || [],
        status: 'published'
      }

      const { error } = await supabase.from('protocol_steps').upsert(stepPayload, { onConflict: 'id' })
      if (error) {
        console.error(`Error upserting step ${s.id}:`, error.message)
      } else {
        console.log(`  ✓ Step synced: ${stepId} (${s.id}) -> ${s.modality_id}`)
      }
    }
  }

  // D. Append Idempotent SQL for Protocols 6 & 7 to docs/update_longevity_outcomes.sql
  console.log(`\n4. Generating idempotent SQL block for docs/update_longevity_outcomes.sql...`)
  const sqlAppend = `

-- =========================================================================
-- PROTOCOLS 6 & 7: SCALP FOLLICULAR LONGEVITY & SYSTEMIC LYMPHATIC FLUSH
-- 6. Clinical Follicular Anagen Revival & Scalp Microvascular Perfusion Protocol
-- 7. Full-Body Interstitial Lymphatic Flush & Microvascular Decongestion Protocol
-- =========================================================================

-- Upsert 8 Functional Longevity Modalities (Protocols 6 & 7)
INSERT INTO modalities (
  id, slug, name, display_name, category, modality_type, status,
  brief_description, expanded_why, headline_benefit, primary_outcome,
  dose_or_exposure, timing_summary, frequency, difficulty,
  cost_tier, effort_level, hallmarks_of_aging_impact, mechanism_of_action,
  functional_impacts
) VALUES
${modalitySqlRows.join(',\n')}
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  name = EXCLUDED.name,
  display_name = EXCLUDED.display_name,
  category = EXCLUDED.category,
  modality_type = EXCLUDED.modality_type,
  status = EXCLUDED.status,
  brief_description = EXCLUDED.brief_description,
  expanded_why = EXCLUDED.expanded_why,
  headline_benefit = EXCLUDED.headline_benefit,
  primary_outcome = EXCLUDED.primary_outcome,
  dose_or_exposure = EXCLUDED.dose_or_exposure,
  timing_summary = EXCLUDED.timing_summary,
  frequency = EXCLUDED.frequency,
  difficulty = EXCLUDED.difficulty,
  cost_tier = EXCLUDED.cost_tier,
  effort_level = EXCLUDED.effort_level,
  hallmarks_of_aging_impact = EXCLUDED.hallmarks_of_aging_impact,
  mechanism_of_action = EXCLUDED.mechanism_of_action,
  functional_impacts = EXCLUDED.functional_impacts;

-- Upsert Protocols 6 & 7
INSERT INTO protocols (
  id, name, description, protocol_type, primary_goal, secondary_goals,
  difficulty_level, visibility, review_status, source_label, target_vectors
) VALUES
${protocolSqlRows.join(',\n')}
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  primary_goal = EXCLUDED.primary_goal,
  secondary_goals = EXCLUDED.secondary_goals,
  difficulty_level = EXCLUDED.difficulty_level,
  source_label = EXCLUDED.source_label,
  target_vectors = EXCLUDED.target_vectors;
`

  const sqlDocPath = path.join(process.cwd(), 'docs', 'update_longevity_outcomes.sql')
  fs.appendFileSync(sqlDocPath, sqlAppend, 'utf8')
  console.log(`  ✓ Appended Protocols 6 & 7 to ${sqlDocPath}`)

  console.log('\n=== All 7 Flagship Functional Protocols & 28 Modalities Successfully Seeded! ===\n')
}

main().catch(err => {
  console.error('Fatal seeding error:', err)
  process.exit(1)
})
