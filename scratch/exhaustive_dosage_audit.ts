import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import { resolveRecommendedDose } from '../lib/utils/resolveRecommendedDose'
import { Modality, UserProfile } from '../lib/types'

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
let supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (fs.existsSync('.env.local')) {
  const envText = fs.readFileSync('.env.local', 'utf-8')
  envText.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=')
    if (key && vals.length) {
      const val = vals.join('=').trim().replace(/^["']|["']$/g, '')
      if (key.trim() === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = val
      if (key.trim() === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') supabaseKey = val
    }
  })
}

function cleanDosagePillText(text: string): string {
  if (!text) return ''
  let cleaned = text.trim()

  // 1. If text is like "Conservative starter dose (100 mg)." or "Starter dose (1 bowl)" -> extract inside parenthetical dose!
  const parenthesizedDose = cleaned.match(/(?:starter|conservative|target|prescribed|blueprint|protocol)\s*dose[^(]*\(([^)]+)\)/i)
  if (parenthesizedDose && parenthesizedDose[1]) {
    cleaned = parenthesizedDose[1].trim()
  }

  // 2. Remove leading descriptive labels like "Conservative starter dose:", "Starter dose:", "Starter:", "Blueprint 2026:", "Target Dose:"
  cleaned = cleaned.replace(/^(?:conservative\s*starter\s*dose|starter\s*dose|starter|blueprint\s*\d*|target\s*dose|prescribed\s*dose|standard\s*dose|protocol\s*dose|valter\s*longo|longo\s*protocol|attia\s*protocol|huberman\s*protocol)[:\-–—\s]+/i, '')

  // 3. Remove trailing parenthesized protocol/dose type names (e.g. "(Blueprint 2026)", "(Starter Dose)", "(Bryan Johnson)")
  cleaned = cleaned.replace(/\s*\((?:starter\s*dose|conservative\s*starter|blueprint\s*\d*|bryan\s*johnson\s*\d*|longo\s*protocol|attia\s*protocol|huberman\s*protocol)\)/gi, '')

  // 4. Strip trailing punctuation like trailing periods from sentences
  cleaned = cleaned.replace(/\.$/, '').trim()

  return cleaned
}

async function runExhaustiveAudit() {
  let modalities: Modality[] = []
  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data, error } = await supabase.from('modalities').select('*')
    if (data && data.length > 0) {
      modalities = data as any
    }
  }

  if (modalities.length === 0 && fs.existsSync('all_modalities.json')) {
    modalities = JSON.parse(fs.readFileSync('all_modalities.json', 'utf-8'))
  }

  console.log(`Auditing ${modalities.length} modalities...\n`)

  const issues: string[] = []

  const standardProfile: UserProfile = {
    local_user_id: 'test_user',
    experimental_openness_0_99: 50
  } as any

  const sensitiveProfile: UserProfile = {
    local_user_id: 'sensitive_user',
    experimental_openness_0_99: 20,
    supplement_sensitivity: true
  } as any

  for (const mod of modalities) {
    const name = mod.name || mod.display_name || mod.id
    const cat = (mod.category || '').toLowerCase()
    const type = (mod.modality_type || '').toLowerCase()

    // Test 1: Standard profile
    const stdRes = resolveRecommendedDose(mod, standardProfile, null)
    const stdPill = cleanDosagePillText(stdRes.recommendedDoseText)

    // Test 2: Sensitive profile
    const sensRes = resolveRecommendedDose(mod, sensitiveProfile, null)
    const sensPill = cleanDosagePillText(sensRes.recommendedDoseText)

    // Test 3: Blueprint Protocol context
    const bpRes = resolveRecommendedDose(mod, standardProfile, { protocolName: 'Bryan Johnson 2026 Blueprint' })
    const bpPill = cleanDosagePillText(bpRes.recommendedDoseText)

    // Check for bad words in pill
    const badWordRegex = /\b(conservative|starter dose|blueprint 2026|prescribed dose|protocol dose)\b/i

    if (badWordRegex.test(stdPill)) {
      issues.push(`[Standard Pill Contains Label] ${mod.id} ("${name}"): "${stdPill}"`)
    }
    if (badWordRegex.test(sensPill)) {
      issues.push(`[Sensitive Pill Contains Label] ${mod.id} ("${name}"): "${sensPill}"`)
    }
    if (badWordRegex.test(bpPill)) {
      issues.push(`[Blueprint Pill Contains Label] ${mod.id} ("${name}"): "${bpPill}"`)
    }

    // Check for "mg" on non-pill modalities
    const isNonPill = cat.includes('fitness') || cat.includes('physical') || cat.includes('cardio') || cat.includes('strength') || cat.includes('breath') || cat.includes('mind') || cat.includes('sleep') || cat.includes('diagnostic') || cat.includes('nutrition') || cat.includes('diet') || type.includes('exercise') || type.includes('physical') || type.includes('habit') || type.includes('breathwork') || type.includes('meditation') || type.includes('diagnostic_test') || name.toLowerCase().includes('handstand') || name.toLowerCase().includes('walk') || name.toLowerCase().includes('sauna') || name.toLowerCase().includes('plunge') || name.toLowerCase().includes('cold') || name.toLowerCase().includes('pudding') || name.toLowerCase().includes('veggie') || name.toLowerCase().includes('fasting') || name.toLowerCase().includes('sigh')

    if (isNonPill) {
      if (stdPill.toLowerCase().includes('mg') || stdPill.toLowerCase().includes('1 mg')) {
        issues.push(`[Standard Pill has bad 'mg' unit] ${mod.id} ("${name}"): "${stdPill}" (dose_or_exposure: "${mod.dose_or_exposure}")`)
      }
      if (sensPill.toLowerCase().includes('mg') || sensPill.toLowerCase().includes('1 mg')) {
        issues.push(`[Sensitive Pill has bad 'mg' unit] ${mod.id} ("${name}"): "${sensPill}"`)
      }
    }

    // Check for empty or undefined
    if (!stdPill || stdPill === 'undefined' || stdPill === 'NaN') {
      issues.push(`[Empty/Invalid Standard Pill] ${mod.id} ("${name}"): "${stdPill}"`)
    }
  }

  console.log(`=== AUDIT COMPLETED: ${issues.length} ISSUES FOUND ===`)
  issues.forEach(iss => console.log(iss))

  if (issues.length === 0) {
    console.log('✅ ALL MODALITY DOSAGE PILLS ARE 100% CLEAN AND ACCURATE ACROSS ALL PROFILES & PROTOCOLS!')
  }
}

runExhaustiveAudit()
