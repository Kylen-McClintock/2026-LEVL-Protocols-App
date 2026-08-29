import { NextRequest, NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { google } from '@ai-sdk/google'
import { z } from 'zod'

const voiceLogSchema = z.object({
  transcript: z.string().describe('Verbatim transcription of user speech with correct scientific/biohacking spelling (e.g. DeepCell, BPC-157, Fisetin, NMN, Infrared Sauna, Cold Plunge).'),
  completed_task_ids: z.array(z.string()).describe('List of IDs of existing scheduled tasks that the user confirmed completing.'),
  completed_modality_names: z.array(z.string()).describe('Names of all completed modalities recognized.'),
  ad_hoc_items: z.array(z.object({
    name: z.string().describe('Name of supplement, exercise, or routine taken that was not in the scheduled today list'),
    dose: z.string().optional().describe('Dosage or amount mentioned (e.g. 500mg, 1 scoop, 20 mins)'),
    duration_minutes: z.number().optional().describe('Duration in minutes if thermal, cardio, or breathwork')
  })).describe('Any completed modalities mentioned that were NOT already scheduled in Today tasks.'),
  outcomes_observed: z.array(z.object({
    outcome_id: z.enum(['energy', 'sleep_quality', 'stress_resilience', 'recovery', 'mood', 'cognitive_performance', 'muscle_soreness', 'digestive_comfort']).describe('Specific outcome dimension'),
    rating_0_10: z.number().describe('0 to 10 numerical score (e.g. "feeling 7 out of 10" -> 7, "soreness was mild" -> 4)'),
    notes: z.string().optional().describe('Subjective observation context')
  })).optional().describe('Any subjective or objective outcome ratings mentioned by the user (energy, sleep, soreness, mood, recovery).'),
  deviations_and_symptoms: z.string().optional().describe('Protocol deviations (e.g. stopped early, took with meal) or adverse symptoms (e.g. lightheadedness, nausea, cramps).'),
  ai_response_text: z.string().describe('A 1-3 sentence natural conversational response matching the selected Persona tone. If a conversation history was provided, maintain context and reply directly to the user\'s response. If they reported an adverse symptom or missing outcome, ask a single targeted follow-up question.')
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

    // Parse today tasks with comprehensive name extraction
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
Your goal is to parse natural human speech into structured protocol completion, ad-hoc doses, subjective outcome ratings, and deviations, while holding a cohesive multi-turn dialogue.

CURRENT SCHEDULED TASKS ON TODAY'S DASHBOARD:
${JSON.stringify(parsedTodayTasks, null, 2)}

CATALOG MODALITIES AVAILABLE:
${JSON.stringify(catalogModalities.slice(0, 50).map((m: any) => ({ id: m.id, name: m.name })), null, 2)}

PREVIOUS CONVERSATION THREAD:
${conversationHistory.length > 0 ? JSON.stringify(conversationHistory, null, 2) : 'None (First turn)'}

PERSONA VOICE STYLE:
Tone: ${persona.toUpperCase()} - ${selectedPersonaGuide}

INSTRUCTIONS:
1. TRANSCRIPTION: Transcribe the user's speech verbatim with exact biological spelling (e.g. DeepCell, BPC-157, Fisetin, NMN, Creatine, Infrared Sauna, Cold Plunge, Magnesium L-Threonate).
2. TASK MATCHING: Look through CURRENT SCHEDULED TASKS. If the user confirmed doing a task, include its exact taskId in completed_task_ids and its name in completed_modality_names.
3. AD-HOC ITEMS: If the user took/completed something NOT in the scheduled tasks list, add it to ad_hoc_items with its name and dosage/duration.
4. OUTCOME TRACKING: If the user mentioned ratings or subjective feelings (e.g. "energy was 7/10", "slept great 8/10", "legs are pretty sore ~6/10", "felt stressed"), extract them into outcomes_observed with accurate 0-10 numbers.
5. DEVIATIONS/SYMPTOMS: Capture deviations (e.g. stopped sauna early at 15m) or adverse symptoms (e.g. lightheadedness, nausea).
6. COHESIVE DIALOGUE: Generate an ai_response_text that directly answers the user, acknowledges what was logged, and if previous conversation history exists, stays coherent with the ongoing thread in the chosen PERSONA tone.`

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
