-- 0004_fix_vector_dimensions.sql

-- Drop the function first because it depends on the column type
DROP FUNCTION IF EXISTS match_modalities;

-- Alter the column to 3072 dimensions (required by the latest Gemini embedding model)
ALTER TABLE modalities ALTER COLUMN embedding TYPE vector(3072);

-- Recreate the function with the correct dimension size
CREATE OR REPLACE FUNCTION match_modalities (
  query_embedding vector(3072),
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
    1 - (m.embedding <=> query_embedding) AS similarity
  FROM modalities m
  WHERE
    (filter_category IS NULL OR m.category = filter_category)
    AND
    (
      (1 - (m.embedding <=> query_embedding) > 0.5)
      OR 
      (query_text IS NOT NULL AND m.name ILIKE '%' || query_text || '%')
    )
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
