import { NextRequest, NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { google } from '@ai-sdk/google'
import { z } from 'zod'

const mealScanSchema = z.object({
  meal_name: z.string().describe('Descriptive, culinary name of the meal/dish, e.g. "Wild Salmon Bowl with Roasted Broccoli & Quinoa" or "Ribeye Steak with Asparagus" or "Greek Yogurt with Blueberries & Chia Seeds"'),
  calories: z.number().describe('Estimated total energy in kilocalories (kcal)'),
  protein_g: z.number().describe('Estimated grams of protein'),
  carbs_g: z.number().describe('Estimated grams of total carbohydrates'),
  fat_g: z.number().describe('Estimated grams of total dietary fat'),
  fiber_g: z.number().describe('Estimated grams of dietary fiber'),
  veggie_servings: z.number().describe('Estimated vegetable servings (Standard: 1 cup raw leafy greens or 1/2 cup cooked vegetables like broccoli, spinach, carrots, asparagus, peppers, mushrooms). Round to 0.5 increments, e.g., 0, 0.5, 1.0, 1.5, 2.0, 3.0'),
  fruit_servings: z.number().describe('Estimated fruit servings (Standard: 1 medium whole fruit or 1/2 cup berries like blueberries, blackberries, strawberries). Round to 0.5 increments, e.g., 0, 0.5, 1.0, 1.5, 2.0'),
  plant_diversity_count: z.number().describe('Total number of distinct plant species in this meal (e.g., broccoli + quinoa + garlic + olive oil + avocado = 5 plants toward the 30-plant weekly longevity target)'),
  ingredients: z.array(z.string()).describe('Identified constituent food items with estimated portions, e.g. ["6 oz Grilled Salmon", "1.5 cups Steamed Broccoli", "1/2 cup Quinoa", "1 tbsp Extra Virgin Olive Oil"]'),
  longevity_highlights: z.array(z.string()).optional().describe('Top 2-3 longevity biochemical highlights, e.g. ["Rich in Sulforaphane", "High EPA/DHA Omega-3", "Prebiotic Polyphenols"]'),
  confidence_score: z.number().describe('Visual recognition confidence score from 0.0 to 1.0'),
  summary: z.string().describe('1-2 sentence nutritional and metabolic summary of the meal')
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
      return NextResponse.json({ error: 'No image or photo provided for meal scanning.' }, { status: 400 })
    }

    const promptText = `You are a world-class precision clinical nutritionist, food biochemist, and computer vision food analysis model.
Analyze the attached meal photo with high fidelity:
1. Identify all food items, cooking methods (e.g. grilled, fried, raw, steamed), protein sources, carbohydrate sources, added fats/oils, and sauces.
2. Estimate realistic portion sizes and accurately calculate total Calories (kcal), Protein (g), Total Carbs (g), Dietary Fat (g), and Fiber (g).
3. Compute exact VEGETABLE SERVINGS (1 cup raw leafy or 1/2 cup cooked/dense veggies = 1 serving) and FRUIT SERVINGS (1 medium fruit or 1/2 cup berries = 1 serving).
4. Count distinct plant species for microbiome diversity.
5. Provide a crisp culinary meal name and actionable breakdown.`

    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: mealScanSchema,
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
    console.error('Error scanning meal with Gemini Vision:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to analyze meal photo. Please ensure the plate is clearly illuminated and in focus.',
        details: String(error)
      }, 
      { status: 500 }
    )
  }
}
