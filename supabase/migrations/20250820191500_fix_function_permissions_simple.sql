-- Simplified fix for match_document_sections function permissions
-- This migration recreates the function with proper security settings

-- Drop existing function
DROP FUNCTION IF EXISTS public.match_document_sections(text, float, int);

-- Create the function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.match_document_sections(
  query_embedding text,
  match_threshold float DEFAULT 0.1,
  match_count int DEFAULT 10
)
RETURNS TABLE(
  id text,
  content text,
  title text,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH embedding_similarity AS (
    SELECT 
      kc.id,
      kc.content,
      ki.title,
      -- Calculate cosine similarity using JSON arrays
      (
        WITH query_array AS (
          SELECT array_agg(value::float) AS q_vec
          FROM json_array_elements_text(query_embedding::json)
        ),
        embedding_array AS (
          SELECT array_agg(value::float) AS e_vec
          FROM json_array_elements_text(kc."embeddingData"::json)
        )
        SELECT 
          CASE 
            WHEN sqrt(
              (SELECT sum(q * q) FROM unnest(q_vec) AS q) * 
              (SELECT sum(e * e) FROM unnest(e_vec) AS e)
            ) = 0 THEN 0
            ELSE (SELECT sum(q * e) FROM unnest(q_vec, e_vec) AS t(q, e)) / 
                 sqrt(
                   (SELECT sum(q * q) FROM unnest(q_vec) AS q) * 
                   (SELECT sum(e * e) FROM unnest(e_vec) AS e)
                 )
          END
        FROM query_array, embedding_array
      ) AS cosine_similarity
    FROM "KnowledgeChunk" kc
    INNER JOIN "KnowledgeItem" ki ON kc."knowledgeItemId" = ki.id
    WHERE 
      ki.status = 'READY' AND
      kc."embeddingData" IS NOT NULL AND
      length(kc."embeddingData") > 10
  )
  SELECT 
    es.id,
    es.content,
    es.title,
    es.cosine_similarity AS similarity
  FROM embedding_similarity es
  WHERE es.cosine_similarity >= match_threshold
  ORDER BY es.cosine_similarity DESC
  LIMIT match_count;
END;
$$;

-- Grant execute permissions - only the main function signature
GRANT EXECUTE ON FUNCTION public.match_document_sections(text, float, int) TO anon, authenticated, service_role;

-- Add comment
COMMENT ON FUNCTION public.match_document_sections IS 'Performs cosine similarity search on knowledge chunks using JSON arrays. SECURITY DEFINER function.';
