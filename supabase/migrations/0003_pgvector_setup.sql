-- 0003_pgvector_setup.sql

-- Enable the pgvector extension to work with embedding vectors
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to modalities table (gemini-embedding-001 uses 768 dimensions)
ALTER TABLE modalities ADD COLUMN IF NOT EXISTS embedding vector(768);

-- Create a generic hybrid search function that combines keyword and semantic search
-- Returns matching modalities
CREATE OR REPLACE FUNCTION match_modalities (
  query_embedding vector(768),
  query_text text,
  match_count int DEFAULT null,
  filter_category text DEFAULT null
) RETURNS TABLE (
  id text,
  name text,
  brief_description text,
  primary_outcome text,
  safety_level text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.name,
    m.brief_description,
    m.primary_outcome,
    m.safety_level,
    -- Compute the cosine similarity score
    1 - (m.embedding <=> query_embedding) AS similarity
  FROM modalities m
  WHERE
    -- Optional Category Filter
    (filter_category IS NULL OR m.category = filter_category)
    AND
    (
      -- Semantic Match (Cosine similarity > threshold)
      (1 - (m.embedding <=> query_embedding) > 0.5)
      OR 
      -- Exact Keyword Match Fallback
      (query_text IS NOT NULL AND m.name ILIKE '%' || query_text || '%')
    )
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
