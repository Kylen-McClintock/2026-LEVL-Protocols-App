'use server'

import { embed } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createClient } from '@supabase/supabase-js'

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
})

export type SemanticSearchResult = {
  id: string
  similarity: number
}

export async function semanticSearchModalities(query: string): Promise<SemanticSearchResult[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const clean = query.trim()
  if (!clean) return []

  try {
    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      const { embedding } = await embed({
        model: google.textEmbeddingModel('gemini-embedding-001'),
        value: clean,
      })

      const { data, error } = await supabase.rpc('match_modalities', {
        query_embedding: embedding,
        query_text: clean,
        match_count: 50,
        filter_category: null
      })

      if (!error && data && data.length > 0) {
        return data.map((row: any) => ({
          id: row.id,
          similarity: row.similarity
        }))
      }
    }
  } catch (error) {
    // Embedding service failed (e.g. revoked key or offline) -> seamlessly use Supabase fallback
    console.warn('Semantic embedding unavailable, using text fallback search')
  }

  // Graceful Supabase Text Search Fallback
  try {
    const tokens = clean.toLowerCase().split(/\s+/).filter(t => t.length > 2)
    const firstToken = tokens[0] || clean

    const { data: textData, error: textError } = await supabase
      .from('modalities')
      .select('id, name, display_name, brief_description, primary_outcome')
      .or(`name.ilike.%${firstToken}%,display_name.ilike.%${firstToken}%,brief_description.ilike.%${firstToken}%,primary_outcome.ilike.%${firstToken}%`)
      .limit(50)

    if (textError || !textData) return []

    return textData.map((row: any, idx: number) => ({
      id: row.id,
      similarity: Math.max(0.4, 0.95 - (idx * 0.02))
    }))
  } catch (err) {
    return []
  }
}
