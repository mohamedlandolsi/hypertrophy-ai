-- Migration: Add match_document_sections function for efficient similarity search
-- Created: 2025-08-20

-- Enable the pgvector extension if not already enabled
-- Note: On Supabase, you may need to enable this via the dashboard first
-- CREATE EXTENSION IF NOT EXISTS vector;

-- For Supabase hosted databases, check if vector extension is available
-- If not available, we'll use a text-based approach as fallback

-- Drop the function if it exists to ensure we get the latest version
DROP FUNCTION IF EXISTS match_document_sections(text, float, int);

-- Create the match_document_sections function
-- This version works with JSON embeddings stored as text
CREATE OR REPLACE FUNCTION match_document_sections(
  query_embedding text,
  match_threshold float,
  match_count int
)
RETURNS TABLE(
  id text,
  content text,
  title text,
  similarity float
)
LANGUAGE plpgsql
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
      ki.status = 'COMPLETED' AND
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

-- Note: Index will be added later once pgvector is properly configured
-- For now, the function will work without an index (slower but functional)

-- Create a comment on the function
COMMENT ON FUNCTION match_document_sections IS 'Performs cosine similarity search on knowledge chunks using JSON arrays (fallback without pgvector)';
