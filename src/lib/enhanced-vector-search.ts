// src/lib/enhanced-vector-search.ts
// Enhanced vector search using the new PostgreSQL match_document_sections function

import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from './prisma';

export interface EnhancedKnowledgeContext {
    id: string;
    content: string;
    title: string;
    similarity: number;
}

// Initialize Gemini client
if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate embedding using Gemini API
 */
async function getEmbedding(query: string): Promise<number[]> {
    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await embeddingModel.embedContent(query);
    return result.embedding.values;
}

/**
 * Enhanced vector search using PostgreSQL function
 * This is significantly faster than the current implementation
 */
export async function enhancedVectorSearch(
    query: string,
    matchThreshold: number = 0.1,
    matchCount: number = 10
): Promise<EnhancedKnowledgeContext[]> {
    try {
        if (process.env.NODE_ENV === 'development') { console.log(`🚀 Enhanced PostgreSQL vector search for: "${query}"`); }
        if (process.env.NODE_ENV === 'development') { console.log(`📊 Parameters: threshold=${matchThreshold}, count=${matchCount}`); }
        
        // Generate embedding
        const queryEmbedding = await getEmbedding(query);
        const embeddingStr = JSON.stringify(queryEmbedding);
        
        // Use the new PostgreSQL function
        const results = await prisma.$queryRaw<EnhancedKnowledgeContext[]>`
            SELECT * FROM match_document_sections(
                ${embeddingStr}::text,
                ${matchThreshold}::float,
                ${matchCount}::int
            )
        `;
        
        if (process.env.NODE_ENV === 'development') { console.log(`✅ PostgreSQL function returned ${results.length} results`); }
        
        return results;
        
    } catch (error) {
        console.error('❌ Enhanced vector search error:', error);
        throw error;
    }
}

/**
 * Category-aware enhanced search
 * Combines the efficiency of PostgreSQL with category filtering
 */
export async function enhancedCategorySearch(
    query: string,
    categories: string[],
    matchThreshold: number = 0.1,
    matchCount: number = 10
): Promise<EnhancedKnowledgeContext[]> {
    try {
        if (process.env.NODE_ENV === 'development') { console.log(`🏷️ Enhanced category search: ${categories.join(', ')}`); }
        
        // Generate embedding
        const queryEmbedding = await getEmbedding(query);
        const embeddingStr = JSON.stringify(queryEmbedding);
        
        // Enhanced query with category filtering
        const results = await prisma.$queryRaw<EnhancedKnowledgeContext[]>`
            SELECT 
                mds.id,
                mds.content,
                mds.title,
                mds.similarity
            FROM match_document_sections(
                ${embeddingStr}::text,
                ${matchThreshold}::float,
                ${matchCount * 2}::int
            ) mds
            JOIN "KnowledgeItem" ki ON ki.title = mds.title
            JOIN "KnowledgeItemCategory" kic ON ki.id = kic."knowledgeItemId"
            JOIN "KnowledgeCategory" kcat ON kic."knowledgeCategoryId" = kcat.id
            WHERE kcat.name = ANY(${categories})
            ORDER BY mds.similarity DESC
            LIMIT ${matchCount}
        `;
        
        if (process.env.NODE_ENV === 'development') { console.log(`✅ Category search returned ${results.length} results`); }
        
        return results;
        
    } catch (error) {
        console.error('❌ Enhanced category search error:', error);
        throw error;
    }
}

/**
 * Hybrid search combining vector similarity with keyword matching
 * Uses the PostgreSQL function for efficiency
 */
export async function enhancedHybridSearch(
    query: string,
    matchThreshold: number = 0.1,
    matchCount: number = 10,
    keywordWeight: number = 0.3
): Promise<EnhancedKnowledgeContext[]> {
    try {
        if (process.env.NODE_ENV === 'development') { console.log(`🔀 Enhanced hybrid search for: "${query}"`); }
        
        // Generate embedding
        const queryEmbedding = await getEmbedding(query);
        const embeddingStr = JSON.stringify(queryEmbedding);
        
        // Extract keywords for text search
        const keywords = query.toLowerCase()
            .split(/\s+/)
            .filter(word => word.length > 2)
            .slice(0, 5); // Top 5 keywords
        
        const keywordQuery = keywords.join(' | ');
        
        // Hybrid search with both vector and text similarity
        const results = await prisma.$queryRaw<(EnhancedKnowledgeContext & { text_score: number; hybrid_score: number })[]>`
            SELECT 
                mds.id,
                mds.content,
                mds.title,
                mds.similarity,
                COALESCE(ts_rank(to_tsvector('english', mds.content), plainto_tsquery('english', ${keywordQuery})), 0) as text_score,
                (mds.similarity * ${1 - keywordWeight} + 
                 COALESCE(ts_rank(to_tsvector('english', mds.content), plainto_tsquery('english', ${keywordQuery})), 0) * ${keywordWeight}) as hybrid_score
            FROM match_document_sections(
                ${embeddingStr}::text,
                ${matchThreshold}::float,
                ${matchCount * 2}::int
            ) mds
            ORDER BY hybrid_score DESC
            LIMIT ${matchCount}
        `;
        
        if (process.env.NODE_ENV === 'development') { console.log(`✅ Hybrid search returned ${results.length} results`); }
        
        // Map to standard interface
        return results.map(r => ({
            id: r.id,
            content: r.content,
            title: r.title,
            similarity: r.hybrid_score // Use hybrid score as similarity
        }));
        
    } catch (error) {
        console.error('❌ Enhanced hybrid search error:', error);
        throw error;
    }
}

/**
 * Fallback to original implementation if PostgreSQL function fails
 * This ensures backward compatibility
 */
export async function fallbackVectorSearch(
    query: string,
    maxChunks: number
): Promise<EnhancedKnowledgeContext[]> {
    try {
        if (process.env.NODE_ENV === 'development') { console.log(`🔄 Using fallback vector search`); }
        
        // Generate embedding
        const queryEmbedding = await getEmbedding(query);
        const embeddingStr = `[${queryEmbedding.join(',')}]`;
        
        // Use raw SQL similar to your existing implementation
        const chunks = await prisma.$queryRaw<Array<{
            id: string;
            content: string;
            title: string;
            similarity: number;
        }>>`
            SELECT DISTINCT
              kc.id,
              kc.content,
              ki.title,
              1 - (kc."embeddingData"::text <=> ${embeddingStr}::text) as similarity
            FROM "KnowledgeChunk" kc
            JOIN "KnowledgeItem" ki ON kc."knowledgeItemId" = ki.id  
            WHERE ki.status = 'READY' 
              AND kc."embeddingData" IS NOT NULL
            ORDER BY similarity DESC
            LIMIT ${maxChunks}
        `;
        
        return chunks.map(chunk => ({
            id: chunk.id,
            content: chunk.content,
            title: chunk.title,
            similarity: chunk.similarity
        }));
        
    } catch (error) {
        console.error('❌ Fallback search error:', error);
        throw error;
    }
}

/**
 * Smart search that tries PostgreSQL function first, falls back if needed
 */
export async function smartVectorSearch(
    query: string,
    matchThreshold: number = 0.1,
    matchCount: number = 10
): Promise<EnhancedKnowledgeContext[]> {
    try {
        // Try the enhanced PostgreSQL function first
        return await enhancedVectorSearch(query, matchThreshold, matchCount);
    } catch (error) {
        console.warn('⚠️ PostgreSQL function failed, using fallback:', error);
        // Fall back to original implementation
        return await fallbackVectorSearch(query, matchCount);
    }
}

/**
 * Performance comparison tool
 * Compare PostgreSQL function vs original implementation
 */
export async function performanceComparison(
    query: string,
    matchThreshold: number = 0.1,
    matchCount: number = 10
) {
    if (process.env.NODE_ENV === 'development') { console.log(`🏁 Starting performance comparison for: "${query}"`); }
    
    // Test PostgreSQL function
    const pgStart = Date.now();
    try {
        const pgResults = await enhancedVectorSearch(query, matchThreshold, matchCount);
        const pgTime = Date.now() - pgStart;
        if (process.env.NODE_ENV === 'development') { console.log(`⚡ PostgreSQL function: ${pgTime}ms (${pgResults.length} results)`); }
        
        // Test fallback implementation
        const fallbackStart = Date.now();
        const fallbackResults = await fallbackVectorSearch(query, matchCount);
        const fallbackTime = Date.now() - fallbackStart;
        if (process.env.NODE_ENV === 'development') { console.log(`🐌 Fallback implementation: ${fallbackTime}ms (${fallbackResults.length} results)`); }
        
        // Performance summary
        const speedup = fallbackTime / pgTime;
        if (process.env.NODE_ENV === 'development') { console.log(`📊 Performance Summary:`); }
        if (process.env.NODE_ENV === 'development') { console.log(`   - PostgreSQL: ${pgTime}ms`); }
        if (process.env.NODE_ENV === 'development') { console.log(`   - Fallback: ${fallbackTime}ms`); }
        if (process.env.NODE_ENV === 'development') { console.log(`   - Speedup: ${speedup.toFixed(2)}x faster`); }
        
        return {
            postgresql: { time: pgTime, results: pgResults.length },
            fallback: { time: fallbackTime, results: fallbackResults.length },
            speedup
        };
        
    } catch (error) {
        console.error('❌ Performance comparison failed:', error);
        return null;
    }
}
