-- Hybrid Search Function for Better RAG Retrieval
-- This function combines vector similarity search with keyword search using Reciprocal Rank Fusion

CREATE OR REPLACE FUNCTION perform_hybrid_search(
    query_text text,
    match_count int DEFAULT 5,
    similarity_threshold float DEFAULT 0.4,
    user_id_filter text DEFAULT NULL
)
RETURNS TABLE (
    chunk_id text,
    content text,
    similarity_score float,
    knowledge_item_id text,
    knowledge_item_title text,
    chunk_index int,
    created_at timestamp
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Since we're using JSON embeddings stored in Prisma, we'll implement a hybrid approach
    -- that combines full-text search with semantic similarity from the application layer
    -- This function focuses on the keyword search component
    
    RETURN QUERY
    WITH keyword_results AS (
        SELECT
            kc.id as chunk_id,
            kc.content,
            -- Simple keyword matching score
            (
                -- Count keyword matches and normalize
                (LENGTH(kc.content) - LENGTH(REPLACE(LOWER(kc.content), LOWER(query_text), ''))) / 
                GREATEST(LENGTH(query_text), 1)
            ) as keyword_score,
            kc.knowledge_item_id,
            ki.title as knowledge_item_title,
            kc.chunk_index,
            kc.created_at
        FROM
            "KnowledgeChunk" kc
        JOIN
            "KnowledgeItem" ki ON kc.knowledge_item_id = ki.id
        WHERE
            (user_id_filter IS NULL OR ki.user_id = user_id_filter)
            AND ki.status = 'READY'
            AND (
                -- Full-text search conditions
                LOWER(kc.content) LIKE '%' || LOWER(query_text) || '%'
                OR LOWER(ki.title) LIKE '%' || LOWER(query_text) || '%'
                -- Add more sophisticated text matching here
                OR kc.content ILIKE '%' || REPLACE(LOWER(query_text), ' ', '%') || '%'
            )
        ORDER BY
            keyword_score DESC
        LIMIT match_count * 2
    )
    SELECT
        kr.chunk_id,
        kr.content,
        kr.keyword_score as similarity_score,
        kr.knowledge_item_id,
        kr.knowledge_item_title,
        kr.chunk_index,
        kr.created_at
    FROM
        keyword_results kr
    WHERE
        kr.keyword_score >= similarity_threshold
    ORDER BY
        kr.keyword_score DESC
    LIMIT
        match_count;
END;
$$;

-- Create improved text search function for better keyword matching
CREATE OR REPLACE FUNCTION improved_text_search(
    query_text text,
    match_count int DEFAULT 5,
    user_id_filter text DEFAULT NULL
)
RETURNS TABLE (
    chunk_id text,
    content text,
    relevance_score float,
    knowledge_item_id text,
    knowledge_item_title text,
    chunk_index int
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH search_terms AS (
        SELECT unnest(string_to_array(LOWER(query_text), ' ')) as term
    ),
    scored_chunks AS (
        SELECT
            kc.id as chunk_id,
            kc.content,
            kc.knowledge_item_id,
            ki.title as knowledge_item_title,
            kc.chunk_index,
            -- Calculate relevance score based on term frequency and position
            (
                -- Term frequency score
                (SELECT COUNT(*) FROM search_terms st 
                 WHERE LOWER(kc.content) LIKE '%' || st.term || '%') * 1.0 / 
                (SELECT COUNT(*) FROM search_terms)
                +
                -- Title match bonus
                CASE WHEN LOWER(ki.title) LIKE '%' || LOWER(query_text) || '%' THEN 0.5 ELSE 0 END
                +
                -- Exact phrase match bonus
                CASE WHEN LOWER(kc.content) LIKE '%' || LOWER(query_text) || '%' THEN 0.3 ELSE 0 END
            ) as relevance_score
        FROM
            "KnowledgeChunk" kc
        JOIN
            "KnowledgeItem" ki ON kc.knowledge_item_id = ki.id
        WHERE
            (user_id_filter IS NULL OR ki.user_id = user_id_filter)
            AND ki.status = 'READY'
            AND (
                EXISTS (
                    SELECT 1 FROM search_terms st 
                    WHERE LOWER(kc.content) LIKE '%' || st.term || '%'
                )
                OR LOWER(ki.title) LIKE '%' || LOWER(query_text) || '%'
            )
    )
    SELECT
        sc.chunk_id,
        sc.content,
        sc.relevance_score,
        sc.knowledge_item_id,
        sc.knowledge_item_title,
        sc.chunk_index
    FROM
        scored_chunks sc
    WHERE
        sc.relevance_score > 0
    ORDER BY
        sc.relevance_score DESC
    LIMIT
        match_count;
END;
$$;
