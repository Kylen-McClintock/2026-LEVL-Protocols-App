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
  try {
    const { embedding } = await embed({
      model: google.textEmbeddingModel('gemini-embedding-001'),
      value: query,
    })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Using the match_modalities RPC we already have in Supabase
    // It returns id, name, brief_description, primary_outcome, safety_level, similarity
    const { data, error } = await supabase.rpc('match_modalities', {
      query_embedding: embedding,
      query_text: query,
      match_count: 50,
      filter_category: null
    })

    if (error) {
      console.error('Semantic search Supabase RPC error:', error)
      return []
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      similarity: row.similarity
    }))
  } catch (error) {
    console.error('Semantic search embedding error:', error)
    return []
  }
}
