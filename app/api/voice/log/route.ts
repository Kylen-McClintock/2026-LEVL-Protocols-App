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
