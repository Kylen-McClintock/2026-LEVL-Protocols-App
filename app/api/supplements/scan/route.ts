import { NextRequest, NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { google } from '@ai-sdk/google'
import { z } from 'zod'

const ingredientItemSchema = z.object({
  name: z.string().describe('Common or clinical name of the active ingredient, e.g., Magnesium, L-Theanine, Creatine Monohydrate, Ashwagandha KSM-66'),
  form: z.string().optional().describe('Chemical form or extract standardization, e.g., Bisglycinate Chelate, 5% withanolides, Root Extract 10:1'),
  amount: z.number().describe('Numeric quantity per serving'),
  unit: z.string().describe('Unit of measurement, e.g., mg, mcg, g, IU, CFU'),
  elemental_amount: z.string().optional().describe('Elemental yield if applicable, e.g., "80mg elemental Magnesium" or "500mg EPA / 250mg DHA"'),
  daily_value_percent: z.number().nullable().optional().describe('% Daily Value if printed on label'),
  notes: z.string().optional().describe('Key synergist or botanical note')
})

const supplementScanSchema = z.object({
  product_name: z.string().describe('Full commercial name of the supplement product'),
  brand_name: z.string().optional().describe('Manufacturer or brand name, e.g., Thorne, Pure Encapsulations, NOW, Momentous, LEVL'),
  serving_size: z.string().describe('Serving size as printed on label, e.g., "2 Capsules", "1 Scoop (5g)", "1 Dropper (1mL)"'),
  servings_per_container: z.number().nullable().optional().describe('Total servings in container if visible'),
  is_combination: z.boolean().describe('True if product contains 2 or more distinct active ingredients or a proprietary blend; false if it is a single-ingredient supplement'),
  primary_active_ingredient: z.string().describe('Primary single ingredient if single-ingredient, or primary complex classification if combination'),
  dosage_summary: z.string().describe('Concise dosage string for protocol dosing card, e.g., "400mg (2 capsules)" or "5g Monohydrate" or "2.1g Complex"'),
  suggested_timing_slot: z.enum([
    'morning_supplement_stack',
    'first_meal',
    'midday',
    'pre_workout_stack',
    'evening_routine',
    'bedtime',
    'anytime'
  ]).describe('Optimal biological timing slot based on circadian uptake, sedative vs stimulant nature, and lipid solubility'),
  suggested_instructions: z.string().describe('Short, actionable administration instructions, e.g., "Take 2 capsules 30-60 mins before bed with water"'),
  headline_benefit: z.string().describe('One punchy headline benefit for the modality card'),
  expanded_why: z.string().describe('2-3 sentence scientific rationale for what this supplement does biochemically'),
  matched_catalog_modality_id: z.string().nullable().describe('Closest canonical LEVL modality ID if matching a single ingredient (e.g., magnesium_glycinate, creatine_monohydrate, ashwagandha, apigenin, omega_3, nmn, l_theanine, glycine, taurine, tongkat_ali, coq10, vitamin_d3_k2, zinc_copper, bpc_157, cjc_1295), else null'),
  ingredients: z.array(ingredientItemSchema).describe('Detailed breakdown of all active ingredients in the supplement facts panel'),
  functional_outcomes_to_track: z.array(z.string()).describe('Top 2-4 functional outcomes this supplement impacts (e.g., sleep_quality, sleep_latency, energy, focus, calmness, soreness, strength, endurance, brain_fog, mood, joint_comfort)'),
  confidence_score: z.number().describe('OCR extraction confidence score from 0.0 to 1.0')
})

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const base64Image = formData.get('image') as string | null

    let imageDataUrl: string = ''

    if (file) {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const mimeType = file.type || 'image/jpeg'
      imageDataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`
    } else if (base64Image) {
      imageDataUrl = base64Image.startsWith('data:') ? base64Image : `data:image/jpeg;base64,${base64Image}`
    } else {
      return NextResponse.json({ error: 'No image or photo provided for supplement scanning.' }, { status: 400 })
    }

    const promptText = `You are an expert precision longevity and clinical supplement analysis system.
Carefully examine the attached photo of the supplement facts label / bottle packaging.
1. Perform high-precision Character Recognition (OCR) on all text, tables, ingredient names, dosages, units (mg, mcg, g, IU), serving sizes, and chemical forms.
2. Determine if the supplement is a SINGLE INGREDIENT product (e.g. Creatine Monohydrate, Magnesium Glycinate, Glycine, Ashwagandha) or a COMBINATION COMPLEX (e.g. Multivitamin, Sleep Blend, Pre-workout, Nootropic Stack with multiple active ingredients).
3. If single-ingredient, match it to the closest canonical LEVL modality ID if applicable.
4. Extract all ingredients in the table with exact numeric amounts and units.
5. Provide optimal circadian timing guidance and actionable 1-sentence administration notes.`

    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: supplementScanSchema,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: promptText },
            { type: 'image', image: imageDataUrl }
          ]
        }
      ]
    })

    return NextResponse.json({
      success: true,
      data: object
    })
  } catch (error: any) {
    console.error('Error scanning supplement label with Gemini:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to scan supplement label. Please ensure the label is clearly illuminated and legible.',
        details: String(error)
      }, 
      { status: 500 }
    )
  }
}
