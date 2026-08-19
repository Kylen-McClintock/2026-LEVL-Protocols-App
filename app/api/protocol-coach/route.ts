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

    const systemPrompt = `You are the LEVL Protocol Synergy & Longevity Science AI Coach.
You specialize in clinical longevity protocols (Bryan Johnson Blueprint, Peter Attia Centenarian Decathlon, David Sinclair Epigenetic Stack, Valter Longo FMD, Matthew Walker Sleep Architecture, Rhonda Patrick Heat Shock / Micronutrient, etc.).

Your task is to provide concise, evidence-based advice for optimizing and personalizing a user's longevity modality, dosage, circadian timing, and stack synergy in the direct context of their personal profile and schedule.

${contextDetails}

Guidelines:
- Keep answers concise, high-yield, and actionable (2-3 short paragraphs max).
- Explain precise biological mechanisms (e.g. SIRT1 activation, NAD+ pool conservation, AMPK/mTOR crosstalk, GLUT4 translocation, thermoregulation, gastric emptying / bioavailability).
- If the user asks about timing or stack synergy, provide exact circadian recommendations (e.g. Morning with fat source, Delay 90 min post-waking, Pre-bed on empty stomach, etc.).
- Reference landmark clinical trials, PubMed citations, or researcher guidelines where applicable.
- If you recommend a specific dose, timing, or protocol adjustments, include a structured JSON block at the very end.

CRITICAL INSTRUCTION:
At the very end of your response, ALWAYS append a JSON block formatted EXACTLY like this:
\`\`\`json
{
  "suggestedDose": "Suggested dosage string or null",
  "suggestedTiming": "Morning | Midday | Evening | Pre-Bed | With Meal or null",
  "suggestedCadence": "Suggested cadence or null",
  "suggestedAdditions": ["Modality Name To Add"],
  "suggestedRemovals": ["Modality Name To Remove"],
  "synergyHighlight": "One brief sentence highlight of the top synergy or tip"
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
    let suggestedCadence: string | null = null
    let synergyHighlight: string | null = null

    const jsonMatch = result.text.match(/```json\s*([\s\S]*?)\s*```/)
    if (jsonMatch && jsonMatch[1]) {
      try {
        const parsed = JSON.parse(jsonMatch[1])
        if (Array.isArray(parsed.suggestedAdditions)) suggestedAdditions = parsed.suggestedAdditions
        if (Array.isArray(parsed.suggestedRemovals)) suggestedRemovals = parsed.suggestedRemovals
        if (parsed.suggestedDose) suggestedDose = String(parsed.suggestedDose)
        if (parsed.suggestedTiming) suggestedTiming = String(parsed.suggestedTiming)
        if (parsed.suggestedCadence) suggestedCadence = String(parsed.suggestedCadence)
        if (parsed.synergyHighlight) synergyHighlight = String(parsed.synergyHighlight)
        
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
      suggestedCadence,
      synergyHighlight
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

