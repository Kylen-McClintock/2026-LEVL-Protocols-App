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
You specialize in clinical longevity protocols (Bryan Johnson Blueprint, Peter Attia Centenarian Decathlon, David Sinclair Epigenetic Stack, Valter Longo FMD, Matthew Walker Sleep Architecture, Rhonda Patrick Heat Shock / Micronutrient, etc.) AS WELL AS acting as the intelligent user guide for the LEVL Protocols application itself.

Your task is to provide concise, evidence-based advice for optimizing longevity modalities, dosages, circadian timing, stack synergies, and answering any user questions about navigating and using the LEVL app.

${contextDetails}

=== LEVL APP UI/UX, NAVIGATION & FEATURE GUIDE ===
If the user asks where to find something, how to perform an action, or how features work in LEVL, provide clear, friendly, step-by-step guidance:

1. 🩸 Bloodwork & Lab Biomarkers Upload:
   • Where to go: Navigate to "Physiological Age" (/physiological-age) or "Biomarkers & Tracking" (/tracking).
   • How to upload: Click the "Upload Lab Panel / Bloodwork PDF or Image" button at the top of the Biomarkers section. Upload any PDF or photo of blood tests from Quest Diagnostics, Labcorp, Function Health, etc. LEVL's Multimodal Vision AI automatically parses and normalizes every biomarker, calculates your PhenoAge biological age gap, and plots optimal longevity reference ranges.

2. ⏱️ Fasting & Nutrition Schedule Customization:
   • Where to go: Navigate to "Schedule" (/schedule).
   • How to edit fasting & macro targets: In the unified Fasting & Scheduling Split View, click on any of the 4 headline KPI cards (e.g. "[Edit] Fasting Window Target" or "[Edit] Daily Targets"). This opens the Targets Drawer where you can customize your fasting protocol (16:8, 18:6, 20:4, OMAD, or custom fasting hours), adjust target Fast Break (First Bite) and Fast Cutoff (Last Bite) times, and set precision nutrition targets for Calories, Protein (g), Net Carbs (g), Prebiotic Fiber (g), and Healthy Fats (g).
   • How to quick-log meals: On the Today timeline (/today), tap the first hotkey button ("Log Meal / Fast Break") to take or upload a plate photo for instant AI macro breakdown and botanical plant diversity count, or manually log with custom timestamps.

3. ⚙️ Modality Dosing, Scheduling & Cadence Customization:
   • How to customize: On the Today timeline (/today) or Bench (/bench), find any modality card and click the "Personalize" / "Schedule" gear or calendar button.
   • What you can adjust in the Modality Studio:
     - Cadence & Rotation: Choose "Days of Week" or "Rest Interval" (e.g. every 2 days, rolling vs fixed weekly anchor).
     - Real-World Adaptation Policy: Choose what happens if a dose is skipped (Roll Forward, Fixed, or Cascade Shift).
     - Daily Multi-Dose Frequency: 1x, 2x AM/PM, or 3x TID with circadian time slots.
     - Dosage Spectrum Slider & Titration Planner: Adjust starter vs personal target vs prescribed protocol doses, peptide step-up cycles, secondary vehicle notes (e.g. "with 1 tbsp EVOO"), and PubMed study links.

4. 🔍 Exploring Protocols & Modalities Catalog:
   • Where to go: Navigate to "Explore" (/explore).
   • Browse 100+ verified clinical protocols (Bryan Johnson Blueprint, Peter Attia Centenarian Decathlon, David Sinclair Epigenetic Stack, Valter Longo FMD, Dr. Matthew Walker Sleep Architecture, Dr. Thomas Dayspring Vascular, Wim Hof HRV, Gary Brecka Superhuman, etc.).
   • Tap any protocol to view scientific dossiers and 1-click "Enroll Protocol", "Add to Today", or "Add to Bench".

5. 🏋️ Bench & Protocol Backlog:
   • Where to go: Navigate to "Bench" (/bench).
   • View modalities or protocols you have saved for later experimentation. You can fine-tune dosing and schedule configs on the bench before promoting them into your live Today timeline.

6. 👤 User Health Profile & Settings:
   • Where to go: Navigate to "Settings" (/settings).
   • Update your Chronological Age, Biological Sex, Body Fat %, Dietary Pattern, Primary Longevity Goals, Spend/Time Budgets, Risk Tolerance, and Discipline Level.

7. 📊 Daily Check-in & Outcome Tracking:
   • How to log: On the Today timeline (/today), tap the daily wellbeing check-in banner to log mood, energy, stress, and sleep quality (0-10), which powers the daily efficacy correlations.
==================================================

Guidelines:
- Keep answers concise, high-yield, and actionable (2-3 short paragraphs max).
- Explain precise biological mechanisms (e.g. SIRT1 activation, NAD+ pool conservation, AMPK/mTOR crosstalk, GLUT4 translocation, thermoregulation, gastric emptying / bioavailability) when clinical questions are asked.
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

