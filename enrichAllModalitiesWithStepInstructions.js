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

// Specific rich step-by-step instructions map for core modalities
const SPECIFIC_INSTRUCTIONS = {
  // Soleus pushups & post meal walking
  post_meal_soleus_pushups: `Step 1: Timing Setup — Begin within 30 minutes after finishing a meal. Sit comfortably in a chair with feet flat on the floor.\nStep 2: Soleus Pushup Technique — Keep the front of your foot on the floor while lifting your heel to maximum height to contract the soleus muscle. Lower heel under control and repeat continuously for 15 minutes (or perform 10 minutes of light Zone 1 walking).\nStep 3: Post-Protocol — Avoid lying down or immediate intense sprinting to allow steady non-insulin GLUT-4 muscle glucose uptake.`,
  post_meal_glucose_walk: `Step 1: Timing Setup — Step outside or onto a treadmill within 30 minutes of eating.\nStep 2: Execution — Walk at a steady, comfortable Zone 1 pace (100–115 bpm) for 10–15 minutes.\nStep 3: Cool Down — Rest for 2 minutes. Notice the absence of a post-meal fatigue crash.`,
  
  // VILPA Micro-Bursts
  vilpa_micro_bursts: `Step 1: Preparation — Identify a staircase, steep hill, or open path.\nStep 2: Max Effort Burst — Sprint at maximum effort (≥85% HRmax) for exactly 60 seconds until breathing heavily.\nStep 3: Recovery — Walk slowly for 2 minutes until heart rate settles. Repeat 3–4 times throughout the day.`,

  // Cold Plunge
  cold_water_immersion: `Step 1: Submersion — Enter 50°F–55°F cold water up to your neck. Focus on slow, controlled exhalations for the first 30 seconds.\nStep 2: Exposure — Remain submerged for 2 to 3 minutes.\nStep 3: Søberg Warm-up — Exit and do NOT take a hot shower immediately. Cross your arms and allow your body to reheat naturally via brown fat thermogenesis.`,
  cold_plunge: `Step 1: Submersion — Enter 50°F–55°F cold water up to your neck. Focus on slow, controlled exhalations for the first 30 seconds.\nStep 2: Exposure — Remain submerged for 2 to 3 minutes.\nStep 3: Søberg Warm-up — Exit and do NOT take a hot shower immediately. Cross your arms and allow your body to reheat naturally via brown fat thermogenesis.`,
  soberg_cold_water_immersion: `Step 1: Submersion — Enter 50°F–55°F cold water up to your neck. Focus on slow, controlled exhalations for the first 30 seconds.\nStep 2: Exposure — Remain submerged for 2 to 3 minutes.\nStep 3: Søberg Warm-up — Exit and do NOT take a hot shower immediately. Cross your arms and allow your body to reheat naturally via brown fat thermogenesis.`,

  // Sauna
  sauna_exposure: `Step 1: Hydration Prep — Drink 16 oz of water with electrolytes prior to entry.\nStep 2: Heat Exposure — Sit in Finnish sauna @ 174°F+ (80°C+) for 15–20 minutes.\nStep 3: Cool Down — Exit, cool down naturally or take a tepid shower, and rehydrate with 20 oz electrolyte water.`,
  hyperthermic_conditioning: `Step 1: Hydration Prep — Drink 16 oz of water with electrolytes prior to entry.\nStep 2: Heat Exposure — Sit in Finnish sauna @ 174°F+ (80°C+) for 15–20 minutes.\nStep 3: Cool Down — Exit, cool down naturally or take a tepid shower, and rehydrate with 20 oz electrolyte water.`,

  // BFR Training
  bfr_training: `Step 1: Cuff Wrap — Wrap BFR bands around upper arms or thighs at 7/10 perceived tightness.\nStep 2: Exercise Set — Perform 30 reps at 20-30% 1RM, rest 30s, then 15 reps, rest 30s, 15 reps, rest 30s, 15 reps.\nStep 3: Cuff Release — Immediately unbuckle cuffs upon completing the final set to restore full blood flow.`,

  // Norwegian 4x4
  vo2_max_4x4_hiit: `Step 1: Warm-up — 5 minutes of progressive light jogging/cycling.\nStep 2: 4-Min Interval — Work at 90–95% Max HR for 4 minutes (unable to speak full sentences).\nStep 3: Active Recovery — Light jog/walk for 3 minutes @ 60–70% Max HR. Repeat for 4 total intervals (28 mins total).\nStep 4: Cool-down — 5 minutes light recovery.`,

  // Breathwork
  '478_relaxing_breathing': `Step 1: Setup — Sit upright or lie comfortably. Place tip of tongue behind upper front teeth.\nStep 2: Cycle — Inhale quietly through nose for 4s, Hold breath for 7s, Exhale completely through mouth with a whoosh for 8s.\nStep 3: Repeat — Perform 4 complete breath cycles.`,
  cyclic_sighing: `Step 1: Setup — Sit or stand with open posture.\nStep 2: Double Inhale — Take a deep inhalation through nose, then top it off with a second short sharp inhale through nose.\nStep 3: Extended Exhale — Slowly exhale through mouth until lungs are empty. Repeat for 5 minutes.`
}

async function enrichAllModalities() {
  console.log('Fetching all modalities from Supabase & all_modalities.json...')

  const { data: dbModalities, error } = await supabase.from('modalities').select('*')
  if (error) console.error('Error fetching DB modalities:', error)

  const jsonPath = path.join(__dirname, 'all_modalities.json')
  let jsonModalities = []
  if (fs.existsSync(jsonPath)) {
    jsonModalities = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
  }

  const combined = dbModalities || jsonModalities

  let updatedCount = 0

  for (const mod of combined) {
    let instructions = mod.instructions || SPECIFIC_INSTRUCTIONS[mod.id] || SPECIFIC_INSTRUCTIONS[mod.slug]

    if (!instructions || instructions.length < 20) {
      const cat = (mod.category || '').toLowerCase()
      const desc = mod.brief_description || mod.headline_benefit || mod.name
      const dose = mod.dose_or_exposure || 'As directed'
      const timing = mod.timing_summary || 'Per your protocol schedule'

      if (cat.includes('nutrition') || cat.includes('supplement')) {
        instructions = `Step 1: Dosing Prep — Measure targeted dosage: ${dose}.\nStep 2: Administration — Consume with 8-12 oz of water. Optimal timing: ${timing}.\nStep 3: Post-Care — Note any immediate energy or cognitive shift.`
      } else if (cat.includes('fitness') || cat.includes('exercise') || cat.includes('cardio') || cat.includes('strength')) {
        instructions = `Step 1: Warm-up — Perform 3-5 minutes of mobility work. Timing: ${timing}.\nStep 2: Protocol Execution — ${desc}. Target intensity/dose: ${dose}.\nStep 3: Cool Down — Hydrate and allow heart rate to return to baseline.`
      } else if (cat.includes('sleep') || cat.includes('circadian')) {
        instructions = `Step 1: Environment Setup — Prepare quiet environment. Optimal timing: ${timing}.\nStep 2: Protocol Execution — ${desc}. Target duration/spec: ${dose}.\nStep 3: Wind Down — Avoid blue light screens following execution.`
      } else {
        instructions = `Step 1: Preparation — Prepare for ${mod.display_name || mod.name}. Recommended timing: ${timing}.\nStep 2: Protocol Execution — ${desc}. Target dose/exposure: ${dose}.\nStep 3: Completion — Log baseline observation shifts post-execution.`
      }
    }

    // Update Supabase
    if (dbModalities) {
      await supabase.from('modalities').update({ instructions }).eq('id', mod.id)
    }

    // Update JSON array
    const jsonIdx = jsonModalities.findIndex(m => m.id === mod.id)
    if (jsonIdx >= 0) {
      jsonModalities[jsonIdx].instructions = instructions
    } else {
      jsonModalities.push({ ...mod, instructions })
    }
    updatedCount++
  }

  fs.writeFileSync(jsonPath, JSON.stringify(jsonModalities, null, 2), 'utf8')
  console.log(`Successfully enriched ${updatedCount} modalities with step-by-step instructions!`)
}

enrichAllModalities()
