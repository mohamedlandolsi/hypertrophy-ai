// Enhanced vector search using the new SQL function
// This provides a direct replacement for the old vector search functions

import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini client for embeddings
if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export interface EnhancedKnowledgeContext {
  id: string;
  title: string;
  content: string;
  score: number;
}

/**
 * Generate embedding for query using Gemini
 */
async function getEmbedding(query: string): Promise<number[]> {
  const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await embeddingModel.embedContent(query);
  return result.embedding.values;
}

/**
 * Enhanced vector search using the new SQL function
 * This is a drop-in replacement for fetchKnowledgeContext
 */
export async function fetchEnhancedKnowledgeContext(
  query: string,
  maxChunks: number,
  threshold: number
): Promise<EnhancedKnowledgeContext[]> {
  try {
    console.log("🔍 Enhanced vector search using match_document_sections...");
    
    // Generate embedding for the search query
    const queryEmbedding = await getEmbedding(query);
    const embeddingString = JSON.stringify(queryEmbedding);
    
    // Call the SQL function using Supabase RPC
    const supabase = await createClient();
    const { data: searchResults, error: rpcError } = await supabase.rpc('match_document_sections', {
      query_embedding: embeddingString,
      match_threshold: threshold,
      match_count: maxChunks
    });
    
    if (rpcError) {
      console.error("❌ Error calling match_document_sections:", rpcError);
      throw new Error(`SQL function error: ${rpcError.message}`);
    }
    
    // Convert SQL results to EnhancedKnowledgeContext format
    const results = (searchResults || []).map((result: {
      id: string;
      content: string;
      title: string;
      similarity: number;
    }) => ({
      id: result.id,
      title: result.title,
      content: result.content,
      score: result.similarity
    }));
    
    console.log(`✅ Enhanced vector search returned ${results.length} results`);
    return results;
    
  } catch (error) {
    console.error("❌ Error in enhanced vector search:", error);
    // Return empty results rather than crashing
    return [];
  }
}

/**
 * Enhanced batch embedding generation
 * Useful for processing multiple queries efficiently
 */
export async function generateBatchEmbeddings(queries: string[]): Promise<number[][]> {
  try {
    const embeddings = await Promise.all(
      queries.map(query => getEmbedding(query))
    );
    return embeddings;
  } catch (error) {
    console.error("❌ Error generating batch embeddings:", error);
    throw error;
  }
}

/**
 * Enhanced multi-query search
 * Combines results from multiple related queries for better coverage
 */
export async function fetchMultiQueryKnowledgeContext(
  queries: string[],
  maxChunksPerQuery: number,
  threshold: number
): Promise<EnhancedKnowledgeContext[]> {
  try {
    console.log(`🔍 Multi-query search with ${queries.length} queries...`);
    
    const allResults = await Promise.all(
      queries.map(query => 
        fetchEnhancedKnowledgeContext(query, maxChunksPerQuery, threshold)
      )
    );
    
    // Flatten and deduplicate results
    const seenIds = new Set<string>();
    const combinedResults: EnhancedKnowledgeContext[] = [];
    
    for (const queryResults of allResults) {
      for (const result of queryResults) {
        if (!seenIds.has(result.id)) {
          seenIds.add(result.id);
          combinedResults.push(result);
        }
      }
    }
    
    // Sort by score and limit total results
    combinedResults.sort((a, b) => b.score - a.score);
    const maxTotalResults = maxChunksPerQuery * queries.length;
    
    const finalResults = combinedResults.slice(0, maxTotalResults);
    console.log(`✅ Multi-query search returned ${finalResults.length} unique results`);
    
    return finalResults;
    
  } catch (error) {
    console.error("❌ Error in multi-query search:", error);
    return [];
  }
}
