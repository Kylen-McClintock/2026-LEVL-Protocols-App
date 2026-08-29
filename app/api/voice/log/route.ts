import { NextRequest, NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { google } from '@ai-sdk/google'
import { z } from 'zod'

const voiceLogSchema = z.object({
  transcript: z.string().describe('Verbatim transcription of the user speech, with correct biological & brand spelling (e.g. DeepCell, BPC-157, Fisetin, NMN, Sauna).'),
  completed_task_ids: z.array(z.string()).describe('Array of task IDs from the provided active tasks list that the user confirmed taking or completing.'),
  completed_modality_names: z.array(z.string()).describe('List of modality or supplement names the user completed.'),
  ad_hoc_items: z.array(z.object({
    name: z.string().describe('Name of any completed supplement, routine, or exercise not in the active today task list'),
    dose: z.string().optional().describe('Dosage or amount mentioned (e.g. 500mg, 2 capsules, 15m)'),
    duration_minutes: z.number().optional().describe('Duration in minutes if an activity/thermal exposure')
  })).describe('Any items mentioned by user that were not already in their scheduled Today task list.'),
  deviations_and_symptoms: z.string().optional().describe('Any protocol deviations (e.g. stopped early), side effects, or adverse symptoms reported (e.g. lightheadedness, stomach ache, high energy).'),
  ai_response_text: z.string().describe('A 1-2 sentence response to the user in their selected Persona tone (Coach, Friend, Scientist, Trainer, or Minimalist). If they reported an adverse symptom or deviation, ask a single relevant biological follow-up.')
})

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const base64Audio = formData.get('audio') as string | null
    const todayTasksJson = formData.get('todayTasks') as string | null
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

    const todayTasksList = todayTasksJson ? JSON.parse(todayTasksJson) : []
    const tasksContext = todayTasksList.length > 0 
      ? JSON.stringify(todayTasksList.map((t: any) => ({ id: t.id, name: t.title || t.modality_name || t.name, timing_slot: t.timing_slot })))
      : '[]'

    const personaInstructions: Record<string, string> = {
      coach: 'Direct, performance-driven, objective, metric-oriented, focused on execution and recovery.',
      friend: 'Warm, supportive, casual, empathetic peer, encouraging and conversational.',
      scientist: 'Biochemical, hypothesis-testing, mechanism-oriented, referencing physiology and data.',
      trainer: 'High-energy, motivating, athletic recovery-oriented, intensity and soreness tracking.',
      minimalist: 'Ultra-concise, zero fluff, single crisp confirmation sentence.'
    }

    const selectedPersonaGuide = personaInstructions[persona] || personaInstructions.coach

    const promptText = `You are LEVL Precision Protocol Omni-Voice Ingestion Engine.
Your job is to listen to the user's spoken protocol check-in and extract structured data.

CURRENT SCHEDULED TASKS TODAY:
${tasksContext}

PERSONA VOICE STYLE:
Tone: ${persona.toUpperCase()} - ${selectedPersonaGuide}

INSTRUCTIONS:
1. Accurately transcribe the spoken voice. Ensure correct spelling for scientific terms, peptides, and brand modalities (e.g. DeepCell, BPC-157, Fisetin, NMN, Creatine, Infrared Sauna, Cold Plunge, Magnesium L-Threonate, Zone 2, Vo2 Max).
2. Identify all tasks from the scheduled list that the user confirmed taking or doing, and include their exact task IDs in completed_task_ids.
3. If they took something not in today's task list, put it into ad_hoc_items.
4. Capture any protocol deviations (e.g., got out early, took with food) and symptoms (e.g. dizzy, lightheaded, energetic) in deviations_and_symptoms.
5. Generate an ai_response_text strictly matching the selected PERSONA VOICE STYLE. Keep it to 1-2 sentences. If a deviation or adverse symptom was reported, include one single relevant clarification question.`

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
