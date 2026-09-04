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
      userQuestion,
      messages = []
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

    let conversationHistory = ''
    if (Array.isArray(messages) && messages.length > 0) {
      conversationHistory = `
=== PREVIOUS CONVERSATION THREAD ===
${messages.map((m: any) => `${m.role === 'user' ? 'User' : 'LEVL Coach'}: ${m.content}`).join('\n\n')}
`
    }

    const systemPrompt = `You are the LEVL AI Longevity & Protocol Coach.
You specialize in evidence-informed longevity protocols (Bryan Johnson Blueprint, Peter Attia Centenarian Decathlon, David Sinclair Epigenetic Stack, Valter Longo FMD, Matthew Walker Sleep Architecture, Rhonda Patrick Heat Shock / Micronutrient, etc.) AS WELL AS acting as the intelligent user guide and personalization engine for the LEVL Protocols application.

Your task is to provide empowering, evidence-based advice for optimizing longevity modalities, dosages, circadian timing, multi-session daily splitting, rest cadence, stack synergies, answering questions about navigating LEVL, AND executing structured configuration actions.

${contextDetails}
${conversationHistory}

=== BALANCED LONGEVITY COACHING & CADENCE PRINCIPLES ===
You are an empowering, pragmatic performance and longevity coach. You support physical ambition, athletic challenges, and biohacking protocols (including CrossFit Hero WODs like Murph, heavy resistance training, high-volume calisthenics, cold immersion, sauna, extended fasts, etc.).

CRITICAL CONSERVATISM REBALANCING RULE:
- DO NOT be overly conservative or reject modalities that carry manageable athletic or physical demands (e.g. NEVER reject or prevent the user from adding workouts like Murph, marathons, heavy lifting, or calisthenic holds).
- When a user asks to add or explore an intense, demanding, or non-standard modality (like Murph):
  1. DO NOT reject or refuse it! ALWAYS embrace their ambition and INCLUDE it in "suggestedAdditions" so they can add it to their Today routine!
  2. Instead of blocking, provide SMART SAFETY CAUTIONS and a HEALTHY CADENCE RECOMMENDATION:
     • For Murph (1 mile run, 100 pull-ups, 200 push-ups, 300 squats, 1 mile run): Recommend partition strategies (e.g. 20 rounds of Cindy: 5 pull-ups, 10 push-ups, 15 squats), healthy frequency (e.g. 1x weekly, bi-weekly, or monthly rather than daily), pre/post electrolyte hydration, and 48-72h recovery before intense upper-body or leg training.
     • For heavy lifting or high-intensity intervals: Recommend 1-2 rest days between muscle groups.
  3. Reserve hard pushback ("scientificPushback: true") ONLY for severe, unscientific conflicts (e.g. taking high caffeine <30m before bed, taking melatonin in the morning, cold plunge immediately post-hypertrophy lifting, or acute lethal drug interactions).
  4. For all other modalities, empower the user, give clear guidance on healthy cadence, and facilitate scheduling with "suggestedAdditions".

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

    let promptContent = ''
    if (messages && messages.length > 0) {
      promptContent = 'Conversation History:\n' + 
        messages.map((m: any) => `${m.role === 'user' ? 'User' : 'Coach'}: ${m.content}`).join('\n') +
        (userQuestion && (!messages[messages.length - 1] || messages[messages.length - 1].content !== userQuestion) 
          ? `\n\nLatest User Question: "${userQuestion}"` 
          : '')
    } else {
      promptContent = `User Question: "${userQuestion || 'How can I optimize my stack today?'}"`
    }

    let resultText = ''
    try {
      const result = await generateText({
        model: google('gemini-2.5-flash'),
        system: systemPrompt,
        prompt: promptContent
      })
      resultText = result.text
    } catch (aiErr: any) {
      console.warn('AI generateText note in protocol-coach (using clinical fallback engine):', aiErr?.message || aiErr)
      resultText = generateFallbackCoachAdvice({
        userQuestion,
        messages,
        modalityName,
        modalityDetails,
        protocolName,
        activeModalities,
        userProfile
      })
    }

    // Parse advice text and optional JSON actions payload
    let advice = resultText
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

    const jsonMatch = resultText.match(/```json\s*([\s\S]*?)\s*```/)
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
        
        advice = resultText.replace(/```json\s*[\s\S]*?\s*```/, '').trim()
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

function generateFallbackCoachAdvice({
  userQuestion = '',
  messages = [],
  modalityName,
  modalityDetails,
  protocolName,
  activeModalities = [],
  userProfile
}: any): string {
  const query = (userQuestion || (messages.length > 0 ? messages[messages.length - 1].content : '')).toLowerCase()

  // 1. Murph / High-Intensity Fitness
  if (query.includes('murph') || query.includes('crossfit') || query.includes('hero wod')) {
    return `Murph is an exceptional cardiovascular and muscular endurance stimulus consisting of a 1-mile run, 100 pull-ups, 200 push-ups, 300 squats, and a closing 1-mile run.

From an athletic longevity perspective:
• **Pacing & Partitioning**: Strongly recommend partitioning the volume into 20 rounds of "Cindy" (5 pull-ups, 10 push-ups, 15 squats). This dramatically blunts excessive eccentric muscle breakdown and reduces rhabdomyolysis risk while sustaining high aerobic output.
• **Cadence & Recovery**: Schedule at a cadence of 1x weekly or bi-weekly. Allow 48–72 hours before subsequent intense upper-body or leg resistance training.
• **Hydration**: Consume 500–750mL water with 500mg sodium and electrolytes 45 minutes prior.

I have prepared Murph below so you can add it directly to your routine.

\`\`\`json
{
  "suggestedDose": "1 Workout (Partitioned)",
  "suggestedTiming": "morning",
  "suggestedDosesPerDay": 1,
  "suggestedTimingSlots": ["morning"],
  "suggestedScheduleMode": "days_of_week",
  "suggestedDays": ["Sat"],
  "suggestedRestIntervalDays": 7,
  "suggestedAdaptationStrategy": "roll_forward",
  "suggestedNotes": "Partition into 20 rounds of Cindy. 48-72h recovery before upper-body lifting.",
  "suggestedAdditions": ["Murph"],
  "suggestedRemovals": [],
  "synergyHighlight": "Pair with pre-workout electrolytes and post-workout whey protein + tart cherry for rapid recovery.",
  "scientificPushback": false
}
\`\`\``
  }

  // 2. Cold plunge / Sauna
  if (query.includes('cold') || query.includes('plunge') || query.includes('sauna') || query.includes('heat')) {
    return `Thermal contrast therapy provides potent metabolic and cardiovascular benefits.

• **Cold Plunge**: 2–3 minutes at 50°F–55°F (10°C–13°C). End on cold (Søberg Principle) to force metabolic thermogenesis. Avoid cold plunge within 4 hours post-hypertrophy resistance training.
• **Sauna**: 15–20 minutes at 174°F+ (80°C+) to activate heat shock proteins (HSP70/90) and induce growth hormone release.

\`\`\`json
{
  "suggestedDose": "11 mins weekly cold / 57 mins weekly sauna",
  "suggestedTiming": "morning",
  "suggestedDosesPerDay": 1,
  "suggestedScheduleMode": "days_of_week",
  "suggestedDays": ["Tue", "Thu", "Sat"],
  "suggestedRestIntervalDays": 2,
  "suggestedAdditions": ["Cold Plunge", "Sauna"],
  "synergyHighlight": "Apply Søberg Principle: always end on cold to maximize brown adipose tissue activation.",
  "scientificPushback": false
}
\`\`\``
  }

  // 3. Fasting & Meal sequencing
  if (query.includes('fast') || query.includes('meal') || query.includes('eating') || query.includes('break')) {
    return `To optimize your fasting window and nutrient absorption:
• **Breaking the Fast**: Prioritize high protein (30–40g whey or egg white) and healthy fats (EVOO, avocado) before carbohydrates to blunt glucose and insulin spikes.
• **Hydration**: Maintain sodium and potassium intake during the fasting window to prevent lightheadedness and sustain cognitive clarity.
• **Schedule**: Access the unified fasting timer and eating window tracker at /schedule.

\`\`\`json
{
  "suggestedTiming": "first_meal",
  "suggestedDose": "30-40g protein + healthy fats",
  "synergyHighlight": "Break fast with protein and fiber first to reduce postprandial glucose excursions by up to 40%.",
  "scientificPushback": false
}
\`\`\``
  }

  // 4. Sleep & Circadian
  if (query.includes('sleep') || query.includes('caffeine') || query.includes('melatonin') || query.includes('magnesium') || query.includes('night')) {
    return `To maximize deep and REM sleep architecture tonight:
• **Caffeine Cutoff**: Ensure your last caffeine intake is at least 9–10 hours before your target bedtime to clear adenosine receptor antagonism.
• **Light Hygiene**: Switch to dim warm light or blue-blocking glasses 90 minutes before bed.
• **Evening Stack**: Magnesium L-Threonate (145mg elemental) or Bisglycinate (200mg) 30–60 minutes before bed supports GABAergic inhibitory neurotransmission.

\`\`\`json
{
  "suggestedDose": "400mg Magnesium L-Threonate",
  "suggestedTiming": "pre_bed",
  "suggestedAdditions": ["Magnesium L-Threonate"],
  "synergyHighlight": "Set caffeine cutoff 9-10h prior to sleep and avoid bright overhead light after 8:30 PM.",
  "scientificPushback": false
}
\`\`\``
  }

  // 5. Check if user asked to add a specific modality name
  const addMatch = query.match(/(?:add|include|start|try)\s+([a-z0-9\s\-]+?)(?:\s+to|\s+as|\s+today|\s+in|\?|$)/i)
  const candidateName = addMatch && addMatch[1] && addMatch[1].trim().length > 2 
    ? addMatch[1].trim().replace(/\b\w/g, (c: string) => c.toUpperCase())
    : (modalityName || 'Optimized Protocol')

  return `Here is the evidence-based guidance for **${candidateName}**:
• **Clinical Dosing & Cadence**: Start with standard literature exposure. Progressive adaptation ensures sustained biological resilience without excessive sympathetic load.
• **Circadian Timing**: Integrate into your morning or afternoon routine depending on whether it provides an energetic or calming physiological signal.
• **Synergy**: Combine with consistent hydration and active recovery.

You can add this modality directly to your Today feed using the button below.

\`\`\`json
{
  "suggestedDose": "Standard literature dose",
  "suggestedTiming": "morning",
  "suggestedDosesPerDay": 1,
  "suggestedScheduleMode": "days_of_week",
  "suggestedDays": ["Mon", "Wed", "Fri"],
  "suggestedRestIntervalDays": 1,
  "suggestedAdditions": ["${candidateName}"],
  "synergyHighlight": "Incorporate progressive adaptation to maximize biological benefit and minimize fatigue.",
  "scientificPushback": false
}
\`\`\``
}

