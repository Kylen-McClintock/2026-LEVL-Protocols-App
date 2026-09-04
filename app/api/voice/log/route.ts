import { NextRequest, NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { google } from '@ai-sdk/google'
import { z } from 'zod'

export const maxDuration = 30

const voiceLogSchema = z.object({
  transcript: z.string().describe('Verbatim transcription of user speech with correct scientific/biohacking spelling (e.g. DeepCell, BPC-157, Fisetin, NMN, Infrared Sauna, Cold Plunge).'),
  completed_task_ids: z.array(z.string()).describe('List of IDs of existing scheduled tasks that the user confirmed completing with high confidence.'),
  completed_modality_names: z.array(z.string()).describe('Names of all completed modalities recognized.'),
  ad_hoc_items: z.array(z.object({
    name: z.string().describe('Name of supplement, exercise, or routine taken that was not in the scheduled today list'),
    dose: z.string().optional().describe('Dosage or amount mentioned (e.g. 500mg, 1 scoop, 20 mins)'),
    duration_minutes: z.number().optional().describe('Duration in minutes if thermal, cardio, or breathwork'),
    note: z.string().optional().describe('Specific details or administration context mentioned (e.g. took with coffee, felt tingle)')
  })).describe('Any completed modalities mentioned that were NOT already scheduled in Today tasks.'),
  pending_confirmations: z.array(z.object({
    recognized_term: z.string().describe('The user\'s spoken term if slightly ambiguous (e.g. "heat therapy", "sleep pill", "peptides")'),
    suggested_modality_id: z.string().optional().describe('Candidate modality ID from tasks or catalog'),
    suggested_modality_name: z.string().describe('Clean name of the candidate modality'),
    suggested_dose: z.string().optional().describe('Inferred dose or duration if mentioned')
  })).optional().describe('Any modality mentioned where similarity is likely but user 1-tap confirmation is helpful.'),
  outcomes_observed: z.array(z.object({
    outcome_id: z.enum(['energy', 'sleep_quality', 'stress_resilience', 'recovery', 'mood', 'cognitive_performance', 'muscle_soreness', 'digestive_comfort']).describe('Specific outcome dimension'),
    rating_0_10: z.number().describe('0 to 10 numerical score translated intelligently from natural language or explicit numbers'),
    notes: z.string().optional().describe('Subjective observation context or phrase')
  })).optional().describe('Subjective or objective outcome ratings translated automatically from natural language or direct numbers.'),
  task_notes: z.array(z.object({
    task_id: z.string().optional(),
    modality_name: z.string(),
    note: z.string().describe('Nuanced context or side observation to be saved directly to the modality notes field')
  })).optional().describe('Specific notes to attach to completed modalities.'),
  checkin_timings: z.object({
    last_meal_time: z.string().optional().describe('24-hour time HH:MM format (e.g. "19:30" or "20:00") if dinner or last food was mentioned'),
    last_caffeine_time: z.string().optional().describe('24-hour time HH:MM format (e.g. "14:00") if last coffee or caffeine cutoff was mentioned'),
    last_screen_time: z.string().optional().describe('24-hour time HH:MM format (e.g. "21:30") if screen cutoff or blue light was mentioned'),
    alcohol_drinks: z.number().optional().describe('Number of alcoholic drinks consumed today if mentioned'),
    sitting_duration: z.string().optional().describe('Sitting duration category if mentioned (e.g. "< 4 hrs", "4-8 hrs", "> 8 hrs")'),
    processed_sugar: z.string().optional().describe('Processed sugar exposure level if mentioned (e.g. "None", "Low", "Moderate", "High")')
  }).optional().describe('Timings and negative longevity exposures extracted from speech for daily check-ins.'),
  hotkey_actions: z.object({
    water_oz: z.number().optional().describe('Fluid ounces of water to log (e.g. 24, 32, 40)'),
    sunlight_minutes: z.number().optional().describe('Minutes of outdoor sunlight to log (e.g. 15, 20, 30)'),
    coffee_cups: z.number().optional().describe('Number of coffee or caffeine cups to log (e.g. 1, 2)'),
    meal_calories: z.number().optional().describe('Calories from meal/food to log if mentioned (e.g. 450, 600)')
  }).optional().describe('Quick-log hotkey increments to add directly to daily totals.'),
  checkin_notes: z.string().optional().describe('General check-in or qualitative wellbeing notes extracted from speech.'),
  confounders: z.object({
    day_busyness_score: z.number().min(0).max(10).optional().describe('0 to 10 busyness/tempo score (0=spacious, 10=redline non-stop) if mentioned'),
    busyness_tags: z.array(z.string()).optional().describe('Reasons for busyness (e.g. "meetings", "commute", "deadlines", "chores")'),
    external_stress_score: z.number().min(0).max(10).optional().describe('0 to 10 external life stress score if acute stressors mentioned'),
    stressor_domain: z.enum(['work', 'relationship', 'financial', 'health', 'family_logistics', 'other']).optional().describe('Primary domain of external stress'),
    stressor_notes: z.string().optional().describe('Specific cause or trigger of the stress mentioned'),
    social_cohort: z.enum(['solo', 'partner', 'friends', 'loved_ones', 'family', 'professional', 'draining']).optional().describe('Who the user spent social time with today: partner, friends, family, loved_ones, professional, solo, draining'),
    social_energy_delta: z.number().min(-5).max(5).optional().describe('Net social impact score: -5 (severely draining) to +5 (rejuvenating/uplifting)'),
    productivity_score: z.number().min(0).max(10).optional().describe('0 to 10 subjective productivity or goal accomplishment score'),
    productivity_depth: z.enum(['deep_flow', 'shallow_admin', 'distracted', 'rest_day']).optional().describe('Depth of focus today'),
    goals_completed: z.number().optional().describe('Number of goals or intentions completed today if mentioned')
  }).optional().describe('External life confounders and context (busyness, external stress triggers, social energy, productivity) extracted from speech.'),
  deviations_and_symptoms: z.string().optional().describe('Protocol deviations (e.g. stopped early, took with meal) or adverse symptoms (e.g. lightheadedness, nausea, cramps).'),
  ai_response_text: z.string().describe('A 1-3 sentence natural conversational response matching the selected Persona tone. If a conversation history was provided, maintain context and reply directly to the user\'s response.')
})

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const base64Audio = formData.get('audio') as string | null
    const todayTasksJson = formData.get('todayTasks') as string | null
    const catalogModalitiesJson = formData.get('catalogModalities') as string | null
    const historyJson = formData.get('history') as string | null
    const persona = (formData.get('persona') as string) || 'coach'

    let audioDataUrl: string = ''
    let mimeType = 'audio/webm'

    if (file) {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      mimeType = file.type || 'audio/webm'
      audioDataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`
    } else if (base64Audio) {
      mimeType = 'audio/webm'
      audioDataUrl = base64Audio.startsWith('data:') ? base64Audio : `data:${mimeType};base64,${base64Audio}`
    } else {
      return NextResponse.json({ error: 'No audio recording provided.' }, { status: 400 })
    }

    // Parse today tasks with clean minimal representation
    const rawTasks = todayTasksJson ? JSON.parse(todayTasksJson) : []
    const parsedTodayTasks = rawTasks.map((t: any) => {
      const taskName = 
        t.loose_modality?.name || 
        t.protocol_step?.modality?.name || 
        t.protocol_step?.name || 
        t.modality?.name || 
        t.title || 
        t.name || 
        'Modality'
      const dose = 
        t.execution_details?.custom_dose || 
        t.loose_modality?.dose_or_exposure || 
        t.protocol_step?.modality?.dose_or_exposure || 
        ''
      return {
        id: t.id,
        name: taskName,
        dose,
        timing_slot: t.timing_slot || 'anytime',
        completed: t.status === 'completed'
      }
    })

    const catalogModalities = catalogModalitiesJson ? JSON.parse(catalogModalitiesJson) : []
    const conversationHistory = historyJson ? JSON.parse(historyJson) : []

    const personaInstructions: Record<string, string> = {
      coach: 'Direct, performance-driven, objective, metric-oriented, focused on execution, load, and recovery.',
      friend: 'Warm, supportive, casual, empathetic peer, conversational and encouraging.',
      scientist: 'Biochemical, hypothesis-testing, mechanism-oriented, referencing physiological pathways and data.',
      trainer: 'High-energy, motivating, athletic intensity & muscular recovery oriented.',
      minimalist: 'Ultra-concise, zero fluff, single crisp confirmation sentence.'
    }

    const selectedPersonaGuide = personaInstructions[persona] || personaInstructions.coach

    const promptText = `You are LEVL Precision Protocol AI Omni-Voice Ingestion Engine & Interactive Companion.
Your goal is to parse natural human speech into structured protocol completion, ad-hoc doses, subjective outcome ratings, and notes, while holding a cohesive multi-turn dialogue.

CURRENT SCHEDULED TASKS ON TODAY'S DASHBOARD:
${JSON.stringify(parsedTodayTasks, null, 2)}

CATALOG MODALITIES AVAILABLE:
${JSON.stringify(catalogModalities, null, 2)}

PREVIOUS CONVERSATION THREAD:
${conversationHistory.length > 0 ? JSON.stringify(conversationHistory, null, 2) : 'None (First turn)'}

PERSONA VOICE STYLE:
Tone: ${persona.toUpperCase()} - ${selectedPersonaGuide}

CRITICAL RULES FOR NATURAL LANGUAGE OUTCOME EXTRACTION (Do NOT force users to call out robotic numbers):
- Translate natural qualitative language into calibrated 0-10 ratings:
  * "Feel amazing / fantastic / on top of the world" -> mood: 9 or 10
  * "Feel great / really good / solid" -> mood: 8
  * "Feel okay / fine / normal" -> mood: 6
  * "Feel tired this morning / exhausted / sluggish" -> energy: 3 or 4 (or sleep_quality: 3-4 if referring to sleep)
  * "Super energized / pumped / fired up" -> energy: 9 or 10
  * "Slept like a rock / amazing sleep" -> sleep_quality: 9 or 10
  * "Tossed and turned / rough sleep" -> sleep_quality: 3 or 4
  * "Legs are burning / super sore / wrecked" -> muscle_soreness: 7 or 8
  * "A little tight / mild soreness" -> muscle_soreness: 4 or 5
  * "No soreness at all" -> muscle_soreness: 1
  * "Feeling stressed / overwhelmed" -> stress_resilience: 3 or 4 (lower resilience)
  * "Calm, centered, relaxed" -> stress_resilience: 8 or 9

TASK MATCHING & FUZZY CONFIRMATIONS:
1. High-Confidence Task Match: If user explicitly mentions a scheduled modality name or obvious match (e.g. "DeepCell", "took my magnesium", "did cold plunge"), put its taskId into completed_task_ids.
2. Ambiguous or Vague Match: If the user says something general like "did some heat therapy" or "took longevity stack", suggest it in pending_confirmations with the candidate modality name so the user can 1-tap confirm.
3. Ad-Hoc Items: If they took something not on today's schedule, put into ad_hoc_items.
4. Specific Modality Notes: If the user shared nuance (e.g. "felt a tingle after niacin", "took 30 mins before workout", "only drank 8oz water"), attach it into task_notes.

CHECK-IN TIMINGS & NEGATIVE EXPOSURES:
- Last Meal: If user mentions dinner or last food time (e.g. "dinner at 7:30", "ate last meal at 8 pm"), set checkin_timings.last_meal_time as 24h format "19:30" or "20:00".
- Last Caffeine: If user mentions last coffee or caffeine cutoff (e.g. "last coffee at 2", "stopped caffeine at 1:30"), set checkin_timings.last_caffeine_time as 24h format "14:00" or "13:30".
- Last Screen: If user mentions screen cutoff or blue light (e.g. "screens off at 9:30", "stopped screens at 10 pm"), set checkin_timings.last_screen_time as 24h format "21:30" or "22:00".
- Alcohol: If user mentions alcoholic drinks (e.g. "had 2 drinks", "one glass of red wine"), set checkin_timings.alcohol_drinks to number.

QUICK-LOG HOTKEY ADDITIONS:
- Water: e.g. "drank 32 oz of water", "had two glasses of water" (~16-24 oz) -> hotkey_actions.water_oz.
- Sunlight: e.g. "went outside for 20 minutes", "got 15 mins of sun" -> hotkey_actions.sunlight_minutes.
- Coffee: e.g. "had a cup of coffee", "drank 2 coffees" -> hotkey_actions.coffee_cups.
- Food/Calories: e.g. "logged lunch 500 calories" -> hotkey_actions.meal_calories.

CHECK-IN NOTES:
- Capture any overall subjective reflections or qualitative observations into checkin_notes.

5. Cohesive Response: Write a 1-2 sentence response directly acknowledging what was logged in the chosen Persona tone.`

    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: voiceLogSchema,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: promptText },
            { type: 'file', data: audioDataUrl, mediaType: mimeType }
          ]
        }
      ]
    })

    return NextResponse.json({
      success: true,
      data: object
    })
  } catch (error: any) {
    console.error('Error in /api/voice/log:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to process voice protocol log' },
      { status: 500 }
    )
  }
}
