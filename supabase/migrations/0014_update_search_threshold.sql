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
      (1 - (m.embedding <=> query_embedding) > 0.3) -- Lowered threshold from 0.5 to 0.3 to catch more semantic matches
      OR 
      (query_text IS NOT NULL AND m.name ILIKE '%' || query_text || '%')
    )
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
