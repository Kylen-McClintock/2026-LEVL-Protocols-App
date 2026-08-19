import { NextRequest, NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { google } from '@ai-sdk/google'
import { z } from 'zod'
import { BIOMARKER_REGISTRY, resolveCanonicalBiomarkerId } from '@/lib/aging-models/biomarkerRegistry'

const extractionSchema = z.object({
  collection_date: z.string().describe('Date of blood collection in YYYY-MM-DD format if available, else today date'),
  provider_name: z.string().describe('Name of testing laboratory or healthcare provider e.g. Quest Diagnostics, Labcorp, Function Health'),
  biomarkers: z.array(
    z.object({
      raw_name: z.string().describe('Exact printed lab test name'),
      raw_value: z.number().describe('Numeric test result value'),
      raw_unit: z.string().describe('Unit of measurement as printed on lab report'),
      lab_reference_range: z.string().optional().describe('Printed reference range string e.g. 0.0-3.0 mg/L'),
      lab_flag: z.enum(['normal', 'high', 'low', 'critical']).default('normal').describe('Lab flag if high, low, or critical'),
      confidence: z.number().describe('Extraction confidence from 0.0 to 1.0')
    })
  ).describe('List of all extracted blood biomarker results')
})

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided for lab extraction.' }, { status: 400 })
    }

    // Convert file attachments to base64 buffers for Gemini Vision/Document processing
    const fileBuffers = await Promise.all(
      files.map(async file => {
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const mimeType = file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg')
        return {
          inlineData: {
            data: buffer.toString('base64'),
            mimeType
          }
        }
      })
    )

    // Execute Gemini AI Structured Document Extraction
    const promptText = `You are an expert clinical laboratory data extraction system.
Extract all blood biomarkers, laboratory test results, units, reference ranges, flags, collection dates, and provider names from the attached lab report document(s).
Map every extracted biomarker carefully. If confidence is uncertain, set confidence score appropriately.`

    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: extractionSchema,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: promptText },
            ...fileBuffers.map(f => ({
              type: 'image' as const,
              image: `data:${f.inlineData.mimeType};base64,${f.inlineData.data}`
            }))
          ]
        }
      ]
    })

    // Canonical ID mapping, unit normalization, and confidence flagging
    const processedBiomarkers = object.biomarkers.map(b => {
      const canonicalId = resolveCanonicalBiomarkerId(b.raw_name)
      const def = canonicalId ? BIOMARKER_REGISTRY[canonicalId] : null

      let normalizedValue = b.raw_value
      let normalizedUnit = b.raw_unit

      if (def) {
        normalizedUnit = def.primary_unit
        if (def.conversion_to_canonical) {
          normalizedValue = def.conversion_to_canonical(b.raw_value, b.raw_unit)
        }
      }

      const isBioAgeUsed = def ? (def.bioage_model_usage.phenoage || def.bioage_model_usage.kdm || def.bioage_model_usage.hd) : false
      const needsReview = b.confidence < 0.70 || !canonicalId

      return {
        biomarker_id: canonicalId || 'unknown',
        raw_name: b.raw_name,
        raw_value: b.raw_value,
        raw_unit: b.raw_unit,
        normalized_value: normalizedValue,
        normalized_unit: normalizedUnit,
        lab_reference_range: b.lab_reference_range || '',
        lab_flag: b.lab_flag || 'normal',
        confidence: b.confidence,
        is_bioage_used: isBioAgeUsed,
        needs_review: needsReview
      }
    })

    const totalExtracted = processedBiomarkers.length
    const usedByBioAge = processedBiomarkers.filter(b => b.is_bioage_used).length
    const reviewRequiredCount = processedBiomarkers.filter(b => b.needs_review).length

    return NextResponse.json({
      collection_date: object.collection_date || new Date().toISOString().split('T')[0],
      provider_name: object.provider_name || 'Standard Lab Report',
      biomarkers: processedBiomarkers,
      summary_counts: {
        total_extracted: totalExtracted,
        used_by_bioage: usedByBioAge,
        needs_review: reviewRequiredCount
      }
    })
  } catch (err: any) {
    console.error('AI Lab Extraction Error:', err)
    return NextResponse.json({ error: err?.message || 'Failed to extract lab data from uploaded document.' }, { status: 500 })
  }
}
