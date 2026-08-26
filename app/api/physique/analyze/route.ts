import { NextRequest, NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { google } from '@ai-sdk/google'
import { z } from 'zod'

const physiqueAnalysisSchema = z.object({
  body_fat_pct: z.number().describe('Estimated total body fat percentage (e.g. 14.2 for 14.2%). Grounded in visual subcutaneous landmark analysis.'),
  body_fat_ci: z.object({
    min: z.number().describe('Lower bound of 90% confidence interval for body fat % (e.g. 13.0)'),
    max: z.number().describe('Upper bound of 90% confidence interval for body fat % (e.g. 15.4)')
  }).describe('90% Confidence Interval for Body Fat Percentage'),
  estimated_weight_lbs: z.number().describe('Estimated or confirmed body weight in lbs'),
  weight_ci: z.object({
    min: z.number().describe('Lower bound of 90% confidence interval for weight in lbs'),
    max: z.number().describe('Upper bound of 90% confidence interval for weight in lbs')
  }).optional().describe('Confidence interval for weight (tighter if user provided known scale weight, broader ±6-10 lbs if purely visual)'),
  skeletal_muscle_mass_pct: z.number().describe('Estimated skeletal muscle mass percentage (typically 38-48% for men, 28-38% for women)'),
  visceral_fat_grade: z.number().int().min(1).max(10).describe('Estimated visceral intra-abdominal fat level from 1 (lowest/optimal athletic) to 10 (high risk central adiposity)'),
  ffmi: z.number().optional().describe('Calculated or estimated normalized Fat-Free Mass Index (FFMI), standard range 18-25'),
  v_taper_ratio: z.number().optional().describe('Estimated biacromial shoulder width to narrowest waist width ratio (e.g. 1.45 to 1.62)'),
  waist_to_hip_ratio: z.number().optional().describe('Estimated waist-to-hip circumference ratio (e.g. 0.82)'),
  posture_assessment: z.object({
    forward_head: z.enum(['none', 'mild', 'moderate', 'pronounced']).describe('Degree of forward head displacement relative to shoulder plane'),
    rounded_shoulders: z.enum(['none', 'mild', 'moderate', 'pronounced']).describe('Degree of internal humeral rotation and scapular protraction'),
    pelvic_tilt: z.enum(['neutral', 'mild_anterior', 'anterior', 'posterior']).describe('Pelvic orientation and lumbar lordosis alignment'),
    bilateral_asymmetry: z.string().optional().describe('Notable left vs right shoulder, trap, or hip lateral height discrepancy if visible'),
    summary: z.string().describe('1-2 sentence clinical summary of posture and spinal alignment'),
    corrective_cues: z.array(z.string()).describe('Top 2 actionable movement/corrective exercise cues (e.g. "Strengthen lower traps & rhomboids", "Glute bridge and hip flexor stretches")')
  }),
  fluid_retention_level: z.enum(['dry_lean', 'normal', 'mild_watery', 'moderate_watery']).describe('Visual assessment of subcutaneous fluid retention vs intramuscular fullness'),
  anatomical_landmarks_detected: z.array(z.string()).describe('List of 3-6 distinct anatomical landmarks detected (e.g. "Visible upper 4 abdominal subdivisions", "Distinct serratus anterior striations", "Deltoid-pectoral separation groove", "Vascularity in forearms")'),
  confidence_score: z.number().describe('Visual diagnostic confidence score from 0.0 to 1.0 based on lighting, camera distance, and pose clarity'),
  confidence_tier: z.enum(['high', 'moderate', 'low']).describe('Confidence classification: high (when clear photo and known weight given), moderate (visual only), low (obscured/poor lighting)'),
  key_observations: z.array(z.string()).describe('3-4 key bullet points describing body composition, muscular development, and frame proportions'),
  recommendation: z.string().describe('Targeted, practical protocol or nutritional recommendation based on current body composition')
})

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const base64Image = formData.get('image') as string | null
    
    // User Context Anchors
    const knownWeightLbs = formData.get('known_weight_lbs') ? parseFloat(formData.get('known_weight_lbs') as string) : null
    const heightInches = formData.get('height_inches') ? parseFloat(formData.get('height_inches') as string) : null
    const sex = (formData.get('sex') as string) || 'male'
    const age = formData.get('age') ? parseInt(formData.get('age') as string) : null
    const pose = (formData.get('pose') as string) || 'front'

    let imageDataUrl: string = ''

    if (file) {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const mimeType = file.type || 'image/jpeg'
      imageDataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`
    } else if (base64Image) {
      imageDataUrl = base64Image.startsWith('data:') ? base64Image : `data:image/jpeg;base64,${base64Image}`
    } else {
      return NextResponse.json({ error: 'No physique photo provided.' }, { status: 400 })
    }

    const contextDescriptions: string[] = []
    if (sex) contextDescriptions.push(`Biological Sex: ${sex}`)
    if (age) contextDescriptions.push(`Age: ${age} years old`)
    if (heightInches) {
      const ft = Math.floor(heightInches / 12)
      const inches = Math.round(heightInches % 12)
      contextDescriptions.push(`Height: ${ft}'${inches}" (${Math.round(heightInches * 2.54)} cm)`)
    }
    if (knownWeightLbs && !isNaN(knownWeightLbs)) {
      contextDescriptions.push(`Known Scale Weight: ${knownWeightLbs} lbs (Exact user-provided measurement)`)
    } else {
      contextDescriptions.push(`Known Scale Weight: UNKNOWN (You MUST estimate weight from frame size, volume, and height)`)
    }
    if (pose) contextDescriptions.push(`Photo Pose / Angle: ${pose}`)

    const promptText = `You are a world-class clinical exercise physiologist, anthropometry specialist, and precision sports medicine vision system.
Analyze the attached physique/body check-in photo with rigorous scientific fidelity.

USER CONTEXT ANCHORS:
${contextDescriptions.join('\n')}

DIAGNOSTIC GUIDELINES:
1. BODY FAT PERCENTAGE ESTIMATION & CONFIDENCE INTERVAL:
   - Evaluate 6 anatomical zones: (a) Rectus abdominis separation / linea alba, (b) Serratus anterior & intercostals, (c) Deltopectoral separation, (d) Superficial vascularity, (e) Scapular/rhomboid definition, (f) Subcutaneous fold thickness vs intra-abdominal distension.
   - Provide an exact point estimate and a statistically rigorous 90% Confidence Interval.
   - For Males: 8-10% (veins on lower abs, serratus clear, deep separation), 11-13% (full 6-pack, serratus visible), 14-17% (upper 4 abs visible, soft lower abs), 18-22% (flat stomach, no distinct ab separation), 23-28% (softness over waist/flanks).
   - For Females: 16-19% (athletic/toned core, visible lines), 20-23% (flat stomach, slight line of separation), 24-27% (healthy athletic/normal, soft contours), 28-33% (softness around hips/thighs/lower abdomen).
   - IF KNOWN WEIGHT IS PROVIDED: Cross-validate with Fat-Free Mass Index (FFMI) to anchor lean mass plausibility and narrow the 90% confidence interval down to ±1.0-1.4%.
   - IF WEIGHT IS UNKNOWN: Estimate weight from visual frame volume and height, providing a ±6-8 lbs confidence interval.

2. POSTURAL & MUSCULOSKELETAL SCREEN:
   - Forward Head: Measure plumb line displacement from ear tragus to acromion process.
   - Rounded Shoulders: Assess internal rotation of humerus and scapular protraction.
   - Pelvic Tilt: Observe ASIS/PSIS alignment, lumbar lordotic curve, and anterior pelvic tilt.
   - Bilateral Asymmetry: Note any lateral drop in shoulder or hip height.

3. VISCERAL FAT GRADE (1 to 10):
   - Level 1-3: Low/Athletic (flat abdominal wall, minimal intra-abdominal pressure).
   - Level 4-6: Moderate (normal metabolic range).
   - Level 7-10: Elevated (prominent central intra-abdominal protrusion).

4. V-TAPER & SYMMETRY:
   - Calculate estimated biacromial shoulder to waist ratio (e.g. 1.40 - 1.62).

Provide an accurate, honest, and scientifically grounded assessment.`

    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: physiqueAnalysisSchema,
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
    console.error('Error analyzing physique photo with Gemini Vision:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to analyze physique photo. Please ensure the body is clearly framed with adequate lighting.',
        success: false
      },
      { status: 500 }
    )
  }
}
