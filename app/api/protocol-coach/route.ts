import { google } from '@ai-sdk/google'
import { generateText } from 'ai'

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { 
      protocolName, 
      activeModalities = [], 
      availableModalities = [], 
      modalityName,
      modalityDetails,
      currentDose,
      currentTiming,
      userProfile,
      userQuestion 
    } = await req.json()

    let contextDetails = ''

    if (modalityName || modalityDetails) {
      contextDetails = `
=== TARGET MODALITY CONTEXT ===
- Modality Name: ${modalityName || modalityDetails?.name || 'Target Modality'}
- Category: ${modalityDetails?.category || 'Longevity / Biomarker Intervention'}
- Headline Benefit: ${modalityDetails?.headline_benefit || 'Healthspan optimization'}
- Biological Mechanism: ${modalityDetails?.biological_mechanism || 'N/A'}
- Literature Dosing Spectrum: ${modalityDetails?.literature_min ?? 'N/A'} - ${modalityDetails?.literature_max ?? 'N/A'} ${modalityDetails?.dose_unit || ''}
- Default Circadian Timing: ${modalityDetails?.default_timing || 'N/A'}
- Current User Configured Dose: ${currentDose || 'Not set'}
- Current User Configured Timing: ${currentTiming || 'Not set'}
`
    }

    if (protocolName) {
      contextDetails += `
=== PARENT PROTOCOL CONTEXT ===
- Protocol Name: ${protocolName}
- Current Active Modalities in Stack: ${Array.isArray(activeModalities) ? activeModalities.join(', ') : activeModalities}
- Available Blueprint Modalities: ${Array.isArray(availableModalities) ? availableModalities.join(', ') : availableModalities}
`
    }

    if (userProfile) {
      contextDetails += `
=== USER PROFILE & BIOLOGICAL CONTEXT ===
- Age: ${userProfile.age ?? 'Not specified'}
- Biological Sex: ${userProfile.biological_sex ?? 'Not specified'}
- Body Fat %: ${userProfile.body_fat_percentage ?? 'Not specified'}%
- Dietary Pattern: ${userProfile.dietary_pattern ?? 'Standard'}
- Primary Health Goals: ${Array.isArray(userProfile.primary_goals) ? userProfile.primary_goals.join(', ') : userProfile.primary_goals || 'Longevity & Vitality'}
- Risk Tolerance: ${userProfile.risk_tolerance ?? 'Moderate'}
- Discipline Level: ${userProfile.discipline_level_0_99 ?? 50}/100
`
    }

    const systemPrompt = `You are the LEVL AI Longevity & Protocol Coach.
You specialize in clinical longevity protocols (Bryan Johnson Blueprint, Peter Attia Centenarian Decathlon, David Sinclair Epigenetic Stack, Valter Longo FMD, Matthew Walker Sleep Architecture, Rhonda Patrick Heat Shock / Micronutrient, etc.) AS WELL AS acting as the intelligent user guide and personalization engine for the LEVL Protocols application.

Your task is to provide concise, evidence-based advice for optimizing longevity modalities, dosages, circadian timing, multi-session daily splitting, rest cadence, stack synergies, answering questions about navigating LEVL, AND executing structured configuration actions.

${contextDetails}

=== SCIENTIFIC PUSHBACK & SAFETY PRINCIPLES ===
You MUST evaluate user questions with clinical rigor and push back when a requested configuration or dosing is contra-indicated, unscientific, or suboptimal for the user's biological profile:
1. PUSH BACK on unscientific timing: (e.g. Taking caffeine or stimulating Nootropics <8h before sleep; taking Melatonin in the morning; doing Cold Plunge immediately post-hypertrophy strength training which blunts satellite cell signaling and muscular adaptation by up to 40%).
2. PUSH BACK on dangerous/extreme dosages: (e.g. Megadosing fat-soluble vitamins A/D/E/K, extreme un-titrated peptide dosages, or exceeding literature safety ceilings).
3. PUSH BACK on invalid cadences: (e.g. Daily intense resistance training on the same muscle groups with zero rest days, or chronic uncycled senolytics like Fisetin/Dasatinib that require pulse dosing).
4. When pushing back, explain the EXACT biological mechanism (mTOR/AMPK crosstalk, adenosine receptor antagonism, pineal melatonin suppression, gastric absorption kinetics, half-life accumulation) in a respectful, authoritative tone, and offer the scientifically validated alternative in your suggested action payload with "scientificPushback": true.

=== LEVL APP UI/UX, NAVIGATION & FEATURE GUIDE ===
If the user asks where to find something or how features work in LEVL, provide clear, friendly guidance:
1. Bloodwork / Biomarkers: /physiological-age or /tracking (Multimodal Vision upload).
2. Fasting & Nutrition: /schedule (unified split view & KPI drawer).
3. Modality Personalization & Scheduling: Click Personalize/Schedule on any card on /today or /bench.
4. Explore Catalog: /explore (100+ protocols).
5. Bench Backlog: /bench.
6. Settings: /settings.

=== GUIDELINES FOR STRUCTURED ACTIONS ===
At the very end of your response, ALWAYS include a JSON block formatted EXACTLY like this:
\`\`\`json
{
  "suggestedDose": "string with unit (e.g. '500 mg', '20 mg/kg', '15 mL') or null",
  "suggestedTiming": "morning | first_meal | midday | afternoon | evening | pre_bed | with_meal | anytime or null",
  "suggestedDosesPerDay": 1 | 2 | 3 | null,
  "suggestedTimingSlots": ["morning", "evening"] or null,
  "suggestedScheduleMode": "days_of_week" | "rest_interval" | null,
  "suggestedDays": ["Mon", "Wed", "Fri"] or null,
  "suggestedRestIntervalDays": 1 or null,
  "suggestedAdaptationStrategy": "roll_forward" | "strict_fixed" | "cascade_shift" | null,
  "suggestedNotes": "Brief evidence-based note to append to user notes or null",
  "suggestedAdditions": ["Modality Name To Add"],
  "suggestedRemovals": ["Modality Name To Remove"],
  "synergyHighlight": "One brief sentence highlight of the top synergy or biological tip",
  "scientificPushback": true | false
}
\`\`\``

    const result = await generateText({
      model: google('gemini-2.5-flash'),
      system: systemPrompt,
      prompt: `User Question: "${userQuestion}"`
    })

    // Parse advice text and optional JSON actions payload
    let advice = result.text
    let suggestedAdditions: string[] = []
    let suggestedRemovals: string[] = []
    let suggestedDose: string | null = null
    let suggestedTiming: string | null = null
    let suggestedDosesPerDay: number | null = null
    let suggestedTimingSlots: string[] | null = null
    let suggestedScheduleMode: 'days_of_week' | 'rest_interval' | null = null
    let suggestedDays: string[] | null = null
    let suggestedRestIntervalDays: number | null = null
    let suggestedAdaptationStrategy: 'roll_forward' | 'strict_fixed' | 'cascade_shift' | null = null
    let suggestedNotes: string | null = null
    let synergyHighlight: string | null = null
    let scientificPushback: boolean = false

    const jsonMatch = result.text.match(/```json\s*([\s\S]*?)\s*```/)
    if (jsonMatch && jsonMatch[1]) {
      try {
        const parsed = JSON.parse(jsonMatch[1])
        if (Array.isArray(parsed.suggestedAdditions)) suggestedAdditions = parsed.suggestedAdditions
        if (Array.isArray(parsed.suggestedRemovals)) suggestedRemovals = parsed.suggestedRemovals
        if (parsed.suggestedDose) suggestedDose = String(parsed.suggestedDose)
        if (parsed.suggestedTiming) suggestedTiming = String(parsed.suggestedTiming)
        if (parsed.suggestedDosesPerDay) suggestedDosesPerDay = Number(parsed.suggestedDosesPerDay)
        if (Array.isArray(parsed.suggestedTimingSlots)) suggestedTimingSlots = parsed.suggestedTimingSlots
        if (parsed.suggestedScheduleMode === 'days_of_week' || parsed.suggestedScheduleMode === 'rest_interval') {
          suggestedScheduleMode = parsed.suggestedScheduleMode
        }
        if (Array.isArray(parsed.suggestedDays)) suggestedDays = parsed.suggestedDays
        if (typeof parsed.suggestedRestIntervalDays === 'number') suggestedRestIntervalDays = parsed.suggestedRestIntervalDays
        if (parsed.suggestedAdaptationStrategy) suggestedAdaptationStrategy = parsed.suggestedAdaptationStrategy
        if (parsed.suggestedNotes) suggestedNotes = String(parsed.suggestedNotes)
        if (parsed.synergyHighlight) synergyHighlight = String(parsed.synergyHighlight)
        if (parsed.scientificPushback === true || parsed.scientificPushback === 'true') scientificPushback = true
        
        advice = result.text.replace(/```json\s*[\s\S]*?\s*```/, '').trim()
      } catch (e) {
        console.error('Failed to parse suggested actions JSON:', e)
      }
    }

    return new Response(JSON.stringify({ 
      advice, 
      suggestedAdditions, 
      suggestedRemovals,
      suggestedDose,
      suggestedTiming,
      suggestedDosesPerDay,
      suggestedTimingSlots,
      suggestedScheduleMode,
      suggestedDays,
      suggestedRestIntervalDays,
      suggestedAdaptationStrategy,
      suggestedNotes,
      synergyHighlight,
      scientificPushback
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('API Protocol Coach Error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500 }
    )
  }
}

