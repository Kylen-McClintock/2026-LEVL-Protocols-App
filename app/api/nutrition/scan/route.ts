import { NextRequest, NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { google } from '@ai-sdk/google'
import { z } from 'zod'

const mealScanSchema = z.object({
  meal_name: z.string().describe('Descriptive, culinary name of the meal/dish, e.g. "Wild Salmon Bowl with Roasted Broccoli & Quinoa" or "Scrambled Eggs & Protein Bar"'),
  calories: z.number().describe('Estimated total energy in kilocalories (kcal)'),
  protein_g: z.number().describe('Estimated grams of protein'),
  carbs_g: z.number().describe('Estimated grams of total carbohydrates'),
  fat_g: z.number().describe('Estimated grams of total dietary fat'),
  fiber_g: z.number().describe('Estimated grams of dietary fiber'),
  veggie_servings: z.number().describe('Estimated vegetable servings (Standard: 1 cup raw leafy greens or 1/2 cup cooked vegetables like broccoli, spinach, carrots, asparagus, peppers, mushrooms). Round to 0.5 increments, e.g., 0, 0.5, 1.0, 1.5, 2.0, 3.0. MUST BE 0 IF NO VEGETABLES PRESENT.'),
  fruit_servings: z.number().describe('Estimated fruit servings (Standard: 1 medium whole fruit or 1/2 cup berries like blueberries, blackberries, strawberries). Round to 0.5 increments, e.g., 0, 0.5, 1.0, 1.5, 2.0. MUST BE 0 IF NO FRUITS PRESENT.'),
  plant_ingredients: z.array(z.string()).describe('List of ONLY distinct whole plant species in this meal (e.g. broccoli, blueberry, almond, oats, olive oil, garlic, chia). Exclude non-plant items like eggs, whey, meat, dairy, salt, artificial sweeteners, chemicals, and processing agents.'),
  plant_diversity_count: z.number().describe('Count of distinct whole plant species from the plant_ingredients list. MUST BE 0 if the meal contains no whole plant foods (e.g. eggs, steak, whey protein = 0).'),
  ingredients: z.array(z.string()).describe('Constituent food items with estimated portions, e.g. ["2 Scrambled Eggs", "1 Chocolate Protein Bar"]'),
  longevity_highlights: z.array(z.string()).optional().describe('Top 2-3 longevity biochemical highlights'),
  confidence_score: z.number().describe('Visual recognition confidence score from 0.0 to 1.0'),
  summary: z.string().describe('1-2 sentence nutritional and metabolic summary of the meal')
})

export async function POST(req: NextRequest) {
  try {
    let description = ''
    let ingredients: string[] = []
    let imageDataUrl = ''

    const contentType = req.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      const body = await req.json().catch(() => ({}))
      description = body.description || body.meal_name || ''
      ingredients = Array.isArray(body.ingredients) ? body.ingredients : []
      if (body.image) {
        imageDataUrl = body.image.startsWith('data:') ? body.image : `data:image/jpeg;base64,${body.image}`
      }
    } else {
      const formData = await req.formData()
      const file = formData.get('file') as File | null
      const base64Image = formData.get('image') as string | null
      description = (formData.get('description') as string) || (formData.get('meal_name') as string) || ''
      const rawIngredients = formData.get('ingredients') as string | null
      if (rawIngredients) {
        try {
          ingredients = JSON.parse(rawIngredients)
        } catch {
          ingredients = rawIngredients.split(',').map(s => s.trim()).filter(Boolean)
        }
      }

      if (file) {
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const mimeType = file.type || 'image/jpeg'
        imageDataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`
      } else if (base64Image) {
        imageDataUrl = base64Image.startsWith('data:') ? base64Image : `data:image/jpeg;base64,${base64Image}`
      }
    }

    if (!imageDataUrl && !description.trim()) {
      return NextResponse.json(
        { error: 'Please provide either a meal image or a food description to analyze.' },
        { status: 400 }
      )
    }

    const ingredientsContext = ingredients.length > 0
      ? `\nSpecified constituent ingredients & portions:\n${ingredients.map(ing => `- ${ing}`).join('\n')}`
      : ''

    let promptText = ''
    const contentParts: any[] = []

    if (imageDataUrl && description.trim()) {
      // Refinement / Recalculation with both image and user-edited description
      promptText = `You are a world-class precision clinical nutritionist, food biochemist, and computer vision food analysis model.
The user has provided a verified, refined description and ingredients for this meal:
User-Specified Description: "${description.trim()}"${ingredientsContext}

Analyze the attached meal photo with high fidelity, calibrated by the user's explicit description:
1. Use the user's description as the authoritative ground truth for ingredients, items, and preparation while using the visual image to confirm realistic portion sizes.
2. Accurately calculate total Calories (kcal), Protein (g), Total Carbs (g), Dietary Fat (g), and Fiber (g).
3. Compute exact VEGETABLE SERVINGS (1 cup raw leafy or 1/2 cup cooked/dense veggies = 1 serving) and FRUIT SERVINGS (1 medium fruit or 1/2 cup berries = 1 serving). If no vegetables/fruits are present, return 0.
4. STRICT PLANT DIVERSITY RULES:
   - Only count distinct, whole botanical plant species (vegetables, fruits, herbs, spices, legumes, whole grains, nuts, seeds, extra virgin olive oil).
   - Animal foods (eggs, chicken, beef, fish, dairy, whey, collagen) and processed chemicals (sucralose, emulsifiers, artificial flavors) have ZERO plant diversity.
5. Return a refined culinary meal name, full constituent ingredients list with portions, and concise metabolic summary.`

      contentParts.push({ type: 'text', text: promptText })
      contentParts.push({ type: 'image', image: imageDataUrl })
    } else if (imageDataUrl) {
      // Vision-only photo scan
      promptText = `You are a world-class precision clinical nutritionist, food biochemist, and computer vision food analysis model.
Analyze the attached meal photo with high fidelity:
1. Identify all food items, cooking methods, protein sources, carbohydrate sources, added fats/oils, and sauces.
2. Estimate realistic portion sizes and accurately calculate total Calories (kcal), Protein (g), Total Carbs (g), Dietary Fat (g), and Fiber (g).
3. Compute exact VEGETABLE SERVINGS (1 cup raw leafy or 1/2 cup cooked/dense veggies = 1 serving) and FRUIT SERVINGS (1 medium fruit or 1/2 cup berries = 1 serving). If no vegetables/fruits are on the plate, return 0.
4. STRICT PLANT DIVERSITY RULES:
   - Only count distinct, whole botanical plant species (vegetables, fruits, herbs, spices, legumes, whole grains, nuts, seeds, extra virgin olive oil).
   - Animal foods (eggs, chicken, beef, fish, dairy, whey, collagen) and processed chemicals (sucralose, emulsifiers, soy lecithin, palm oil fractions) have ZERO plant diversity.
   - If a meal contains only eggs, animal protein, or processed bars without recognizable whole plant foods, plant_diversity_count MUST be 0 or equal to only the real whole plant ingredients (e.g. peanuts/almonds in the bar).
5. Provide a crisp culinary meal name and actionable breakdown.`

      contentParts.push({ type: 'text', text: promptText })
      contentParts.push({ type: 'image', image: imageDataUrl })
    } else {
      // Text-only description recalculation
      promptText = `You are a world-class precision clinical nutritionist and food biochemist.
The user wants an accurate nutritional and macronutrient recalculation for the following meal description:
Meal Description: "${description.trim()}"${ingredientsContext}

Analyze this meal with clinical precision:
1. Identify all food items, portions, cooking methods, protein sources, carbohydrate sources, added fats/oils, and sauces described.
2. Accurately calculate total Calories (kcal), Protein (g), Total Carbs (g), Dietary Fat (g), and Fiber (g).
3. Compute exact VEGETABLE SERVINGS (1 cup raw leafy or 1/2 cup cooked/dense veggies = 1 serving) and FRUIT SERVINGS (1 medium fruit or 1/2 cup berries = 1 serving). If no vegetables/fruits are present, return 0.
4. STRICT PLANT DIVERSITY RULES:
   - Only count distinct, whole botanical plant species (vegetables, fruits, herbs, spices, legumes, whole grains, nuts, seeds, extra virgin olive oil).
   - Animal foods (eggs, chicken, beef, fish, dairy, whey, collagen) and processed chemicals have ZERO plant diversity.
5. Provide a refined culinary meal name, list of constituent ingredients with portions, and concise metabolic summary.`

      contentParts.push({ type: 'text', text: promptText })
    }

    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: mealScanSchema,
      messages: [
        {
          role: 'user',
          content: contentParts
        }
      ]
    })

    return NextResponse.json({
      success: true,
      data: object
    })
  } catch (error: any) {
    console.error('Error analyzing meal with Gemini:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to analyze meal. Please check your description or image and try again.',
        details: String(error)
      }, 
      { status: 500 }
    )
  }
}
