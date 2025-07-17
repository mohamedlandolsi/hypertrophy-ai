/**
 * Vector search utilities for Supabase with pgvector
 * 
 * This module provides functions to store and search vector embeddings
 * in Supabase using the pgvector extension.
 */

import { prisma } from './prisma';
import { generateQueryEmbedding, cosineSimilarity } from './vector-embeddings';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini for query transformation
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface VectorSearchResult {
  id: string;
  content: string;
  similarity: number;
  knowledgeItemId: string;
  knowledgeItemTitle: string;
  chunkIndex: number;
  metadata?: Record<string, unknown>;
}

export interface SearchOptions {
  limit?: number;
  threshold?: number;
  userId?: string;
  knowledgeItemIds?: string[];
}

export interface RAGConfig {
  similarityThreshold: number;
  maxChunks: number;
  highRelevanceThreshold: number;
}

/**
 * Get RAG configuration from AI configuration
 * Falls back to defaults if configuration is not available
 * 
 * @returns Promise<RAGConfig>
 */
export async function getRAGConfig(): Promise<RAGConfig> {
  try {
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' },
      select: {
        ragSimilarityThreshold: true,
        ragMaxChunks: true,
        ragHighRelevanceThreshold: true,
      }
    });

    if (config) {
      return {
        similarityThreshold: config.ragSimilarityThreshold,
        maxChunks: config.ragMaxChunks,
        highRelevanceThreshold: config.ragHighRelevanceThreshold,
      };
    }
  } catch (error) {
    console.warn('Failed to load RAG configuration, using defaults:', error);
  }

  // Fallback to defaults
  return {
    similarityThreshold: 0.6,
    maxChunks: 5,
    highRelevanceThreshold: 0.8,
  };
}

/**
 * Store a vector embedding for a knowledge chunk
 * 
 * @param chunkId ID of the knowledge chunk
 * @param embedding Embedding vector
 * @returns Promise<void>
 */
export async function storeEmbedding(
  chunkId: string,
  embedding: number[]
): Promise<void> {
  try {
    // Store embedding as JSON string temporarily until pgvector is enabled
    const embeddingJson = JSON.stringify(embedding);
    
    await prisma.knowledgeChunk.update({
      where: { id: chunkId },
      data: { embeddingData: embeddingJson }
    });
    
  } catch (error) {
    console.error('Error storing embedding:', error);
    throw new Error(`Failed to store embedding for chunk ${chunkId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Perform semantic search using vector similarity (JSON storage fallback)
 * 
 * @param query Search query text
 * @param options Search configuration options
 * @returns Promise<VectorSearchResult[]>
 */
export async function performVectorSearch(
  query: string,
  options: SearchOptions = {}
): Promise<VectorSearchResult[]> {
  try {
    const {
      limit = 5,
      threshold = 0.5,
      userId,
      knowledgeItemIds
    } = options;

    // Generate embedding for the query
    const queryEmbedding = await generateQueryEmbedding(query);

    // Build the where clause for filtering
    const whereClause: Record<string, unknown> = {
      embeddingData: { not: null }
    };

    if (userId) {
      whereClause.knowledgeItem = { userId };
    }

    if (knowledgeItemIds && knowledgeItemIds.length > 0) {
      whereClause.knowledgeItemId = { in: knowledgeItemIds };
    }

    // Get all chunks with embeddings (using JSON storage)
    const chunks = await prisma.knowledgeChunk.findMany({
      where: whereClause,
      include: {
        knowledgeItem: {
          select: { title: true }
        }
      }
    });

    // Calculate similarities manually
    const results: VectorSearchResult[] = [];

    for (const chunk of chunks) {
      if (!chunk.embeddingData) continue;

      try {
        const chunkEmbedding = JSON.parse(chunk.embeddingData) as number[];
        const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);

        if (similarity >= threshold) {
          results.push({
            id: chunk.id,
            content: chunk.content,
            similarity,
            knowledgeItemId: chunk.knowledgeItemId,
            knowledgeItemTitle: chunk.knowledgeItem.title,
            chunkIndex: chunk.chunkIndex
          });
        }
      } catch (parseError) {
        console.error('Error parsing embedding data:', parseError);
        continue;
      }
    }

    // Sort by similarity and return top results
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

  } catch (error) {
    console.error('Error performing vector search:', error);
    
    // Provide helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('permission')) {
        throw new Error('Insufficient permissions to perform vector search.');
      }
    }
    
    throw new Error(`Vector search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Transform and enhance user queries for better retrieval
 * 
 * @param originalQuery Original user query
 * @param conversationHistory Recent conversation context
 * @returns Promise<string> Enhanced query for retrieval
 */
export async function transformQuery(
  originalQuery: string,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<string> {
  try {
    // Skip transformation for very short queries or if API key is not available
    if (originalQuery.length < 10 || !process.env.GEMINI_API_KEY) {
      return originalQuery;
    }

    // Build context from recent conversation
    const recentContext = conversationHistory
      .slice(-4) // Last 4 messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 150,
      }
    });

    const prompt = `You are a query enhancement expert for fitness and hypertrophy knowledge retrieval.

Original query: "${originalQuery}"

Recent conversation context:
${recentContext}

Task: Transform the original query into a more effective search query that will retrieve relevant fitness, nutrition, and training information. Focus on:
1. Adding relevant fitness/training terminology
2. Expanding abbreviations and implicit concepts
3. Including alternative phrasings
4. Maintaining the core intent

Rules:
- Keep it concise (max 2-3 sentences)
- Use scientific and fitness terminology
- Include synonyms for key concepts
- Don't change the fundamental question

Enhanced query:`;

    const result = await model.generateContent(prompt);
    const enhancedQuery = result.response.text().trim();

    // Use enhanced query if it's reasonable, otherwise fall back to original
    if (enhancedQuery.length > 5 && enhancedQuery.length < 300) {
      console.log(`🔍 Query transformation: "${originalQuery}" -> "${enhancedQuery}"`);
      return enhancedQuery;
    } else {
      return originalQuery;
    }

  } catch (error) {
    console.error('Error transforming query:', error);
    return originalQuery; // Fallback to original query
  }
}

/**
 * Get relevant context for a user query from their knowledge base
 * 
 * @param userId User ID
 * @param query Search query
 * @param maxChunks Maximum number of chunks to return (optional override)
 * @param similarityThreshold Minimum similarity score (optional override)
 * @param conversationHistory Recent conversation for query enhancement
 * @returns Promise<string> Concatenated relevant content WITHOUT titles
 */
export async function getRelevantContext(
  userId: string,
  query: string,
  maxChunks?: number,
  similarityThreshold?: number,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<string> {
  try {
    // Get RAG configuration from database
    const ragConfig = await getRAGConfig();
    
    // Use provided parameters or fall back to configuration
    const effectiveMaxChunks = maxChunks ?? ragConfig.maxChunks;
    const effectiveThreshold = similarityThreshold ?? ragConfig.similarityThreshold;
    
    // Transform query for better retrieval
    const enhancedQuery = await transformQuery(query, conversationHistory);
    
    // Use hybrid search for better retrieval
    let searchResults = await performHybridSearch(enhancedQuery, userId, {
      limit: effectiveMaxChunks,
      threshold: effectiveThreshold,
      rerank: true
    });

    // If results are insufficient, try with relaxed parameters
    if (searchResults.length < Math.min(effectiveMaxChunks, 3)) {
      console.log('📚 Insufficient results from enhanced search, trying fallback approach');
      
      // Try with lower threshold
      const fallbackResults = await performHybridSearch(enhancedQuery, userId, {
        limit: effectiveMaxChunks,
        threshold: effectiveThreshold * 0.7,
        rerank: true
      });

      // If still insufficient, try with original query
      if (fallbackResults.length < Math.min(effectiveMaxChunks, 2)) {
        const originalResults = await performVectorSearch(query, {
          limit: effectiveMaxChunks,
          threshold: effectiveThreshold * 0.6,
          userId
        });
        searchResults = originalResults.length > searchResults.length ? originalResults : searchResults;
      } else {
        searchResults = fallbackResults;
      }
    }

    if (searchResults.length === 0) {
      return '';
    }

    // Group chunks by knowledge item to maintain context
    const groupedChunks = groupChunksByKnowledgeItem(searchResults);
    
    // Format the context WITHOUT titles - only pure content for AI
    const contextParts = Object.entries(groupedChunks).map(([, chunks]) => {
      const sortedChunks = chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);
      
      const chunkTexts = sortedChunks.map(chunk => {
        // Mark highly relevant content but don't include title
        const relevanceMarker = chunk.similarity > ragConfig.highRelevanceThreshold ? ' [HIGH RELEVANCE]' : '';
        return `${chunk.content}${relevanceMarker}`;
      }).join('\n\n');
      
      // Return only content without source attribution for AI
      return chunkTexts;
    });

    return contextParts.join('\n---\n');

  } catch (error) {
    console.error('Error getting relevant context:', error);
    return ''; // Return empty string to allow conversation to continue
  }
}

/**
 * Get source information from retrieved context for UI display (e.g., article links)
 * This function provides the titles and IDs that were removed from the AI context
 * 
 * @param userId User ID
 * @param query Search query
 * @param maxChunks Maximum number of chunks to return (optional override)
 * @param similarityThreshold Minimum similarity score (optional override)
 * @param conversationHistory Recent conversation for query enhancement
 * @returns Promise<Array<{title: string, id: string, relevance: number}>>
 */
export async function getContextSources(
  userId: string,
  query: string,
  maxChunks?: number,
  similarityThreshold?: number,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<Array<{title: string, id: string, relevance: number}>> {
  try {
    // Get RAG configuration from database
    const ragConfig = await getRAGConfig();
    
    // Use provided parameters or fall back to configuration
    const effectiveMaxChunks = maxChunks ?? ragConfig.maxChunks;
    const effectiveThreshold = similarityThreshold ?? ragConfig.similarityThreshold;
    
    // Transform query for better retrieval
    const enhancedQuery = await transformQuery(query, conversationHistory);
    
    // Use hybrid search for better retrieval
    const searchResults = await performHybridSearch(enhancedQuery, userId, {
      limit: effectiveMaxChunks,
      threshold: effectiveThreshold,
      rerank: true
    });

    if (searchResults.length === 0) {
      return [];
    }

    // Group chunks by knowledge item and calculate relevance
    const groupedChunks = groupChunksByKnowledgeItem(searchResults);
    
    return Object.entries(groupedChunks).map(([title, chunks]) => {
      const knowledgeItemId = chunks[0].knowledgeItemId;
      const avgSimilarity = chunks.reduce((sum, chunk) => sum + chunk.similarity, 0) / chunks.length;
      
      return {
        title,
        id: knowledgeItemId,
        relevance: avgSimilarity
      };
    }).sort((a, b) => b.relevance - a.relevance); // Sort by relevance

  } catch (error) {
    console.error('Error getting context sources:', error);
    return [];
  }
}

/**
 * Advanced retrieval with multiple strategies
 * 
 * @param userId User ID
 * @param query Search query
 * @param options Advanced retrieval options
 * @returns Promise<VectorSearchResult[]>
 */
export async function performAdvancedRetrieval(
  userId: string,
  query: string,
  options: {
    maxChunks?: number;
    diversityThreshold?: number;
    conversationHistory?: Array<{ role: string; content: string }>;
    includeSimilarContent?: boolean;
  } = {}
): Promise<VectorSearchResult[]> {
  const {
    maxChunks = 8,
    diversityThreshold = 0.85,
    conversationHistory = [],
    includeSimilarContent = false
  } = options;

  try {
    // Transform query for better retrieval
    const enhancedQuery = await transformQuery(query, conversationHistory);
    
    // Get initial results with hybrid search
    const initialResults = await performHybridSearch(enhancedQuery, userId, {
      limit: maxChunks * 2,
      threshold: 0.4,
      rerank: true
    });

    // Apply diversity filtering to avoid redundant content
    const diverseResults = applyDiversityFiltering(initialResults, diversityThreshold);

    // If we need more results and includeSimilarContent is true
    if (diverseResults.length < maxChunks && includeSimilarContent) {
      // Find similar content from the highest-scoring result
      if (diverseResults.length > 0) {
        const topResult = diverseResults[0];
        const similarContent = await findSimilarContent(
          topResult.knowledgeItemId,
          topResult.chunkIndex,
          userId,
          maxChunks - diverseResults.length
        );
        
        // Add similar content that's not already included
        const existingIds = new Set(diverseResults.map(r => r.id));
        const newSimilarContent = similarContent.filter(s => !existingIds.has(s.id));
        diverseResults.push(...newSimilarContent);
      }
    }

    return diverseResults.slice(0, maxChunks);

  } catch (error) {
    console.error('Error performing advanced retrieval:', error);
    return [];
  }
}

/**
 * Apply diversity filtering to avoid redundant content
 * 
 * @param results Search results
 * @param threshold Similarity threshold for diversity
 * @returns Filtered results with diversity
 */
function applyDiversityFiltering(
  results: VectorSearchResult[],
  threshold: number = 0.85
): VectorSearchResult[] {
  if (results.length <= 1) return results;

  const diverseResults: VectorSearchResult[] = [results[0]]; // Always include the top result

  for (let i = 1; i < results.length; i++) {
    const candidate = results[i];
    let isDiverse = true;

    // Check if candidate is too similar to already selected results
    for (const selected of diverseResults) {
      const similarity = textSimilarity(candidate.content, selected.content);
      if (similarity > threshold) {
        isDiverse = false;
        break;
      }
    }

    if (isDiverse) {
      diverseResults.push(candidate);
    }
  }

  return diverseResults;
}

/**
 * Group search results by knowledge item for better context organization
 * 
 * @param results Vector search results
 * @returns Grouped results by knowledge item title
 */
function groupChunksByKnowledgeItem(
  results: VectorSearchResult[]
): Record<string, VectorSearchResult[]> {
  return results.reduce((groups, result) => {
    const title = result.knowledgeItemTitle;
    if (!groups[title]) {
      groups[title] = [];
    }
    groups[title].push(result);
    return groups;
  }, {} as Record<string, VectorSearchResult[]>);
}

/**
 * Check if a knowledge item has embeddings generated
 * 
 * @param knowledgeItemId Knowledge item ID
 * @returns Promise<boolean>
 */
export async function hasEmbeddings(knowledgeItemId: string): Promise<boolean> {
  try {
    const count = await prisma.knowledgeChunk.count({
      where: {
        knowledgeItemId: knowledgeItemId,
        embeddingData: { not: null }
      }
    });
    
    return count > 0;
  } catch (error) {
    console.error('Error checking embeddings:', error);
    return false;
  }
}

/**
 * Get embedding statistics for a knowledge item
 * 
 * @param knowledgeItemId Knowledge item ID
 * @returns Promise<object> Statistics about the embeddings
 */
export async function getEmbeddingStats(knowledgeItemId: string): Promise<{
  totalChunks: number;
  chunksWithEmbeddings: number;
  averageChunkSize: number;
  embeddingCoverage: number;
}> {
  try {
    const chunks = await prisma.knowledgeChunk.findMany({
      where: { knowledgeItemId },
      select: {
        content: true,
        embeddingData: true
      }
    });

    const totalChunks = chunks.length;
    const chunksWithEmbeddings = chunks.filter((chunk: { embeddingData: string | null }) => chunk.embeddingData !== null).length;
    const averageChunkSize = chunks.length > 0 
      ? chunks.reduce((sum: number, chunk: { content: string }) => sum + chunk.content.length, 0) / chunks.length 
      : 0;
    const embeddingCoverage = totalChunks > 0 ? chunksWithEmbeddings / totalChunks : 0;

    return {
      totalChunks,
      chunksWithEmbeddings,
      averageChunkSize: Math.round(averageChunkSize),
      embeddingCoverage: Math.round(embeddingCoverage * 100) / 100
    };
  } catch (error) {
    console.error('Error getting embedding stats:', error);
    return {
      totalChunks: 0,
      chunksWithEmbeddings: 0,
      averageChunkSize: 0,
      embeddingCoverage: 0
    };
  }
}

/**
 * Delete all embeddings for a knowledge item
 * 
 * @param knowledgeItemId Knowledge item ID
 * @returns Promise<void>
 */
export async function deleteEmbeddings(knowledgeItemId: string): Promise<void> {
  try {
    await prisma.knowledgeChunk.updateMany({
      where: { knowledgeItemId },
      data: { embeddingData: null }
    });
  } catch (error) {
    console.error('Error deleting embeddings:', error);
    throw new Error(`Failed to delete embeddings for knowledge item ${knowledgeItemId}`);
  }
}

/**
 * Find similar content within a user's knowledge base
 * 
 * @param knowledgeItemId Source knowledge item ID
 * @param chunkIndex Source chunk index
 * @param userId User ID
 * @param limit Number of similar chunks to find
 * @returns Promise<VectorSearchResult[]>
 */
export async function findSimilarContent(
  knowledgeItemId: string,
  chunkIndex: number,
  userId: string,
  limit: number = 3
): Promise<VectorSearchResult[]> {
  try {
    // Get the source chunk's embedding
    const sourceChunk = await prisma.knowledgeChunk.findFirst({
      where: {
        knowledgeItemId,
        chunkIndex
      },
      select: {
        embeddingData: true,
        content: true
      }
    });

    if (!sourceChunk || !sourceChunk.embeddingData) {
      return [];
    }

    // Parse the source embedding
    let sourceEmbedding: number[];
    try {
      sourceEmbedding = JSON.parse(sourceChunk.embeddingData);
    } catch (parseError) {
      console.error('Error parsing source embedding:', parseError);
      return [];
    }

    // Get all chunks with embeddings for comparison
    const allChunks = await prisma.knowledgeChunk.findMany({
      where: {
        embeddingData: { not: null },
        knowledgeItem: { userId },
        NOT: {
          AND: [
            { knowledgeItemId },
            { chunkIndex }
          ]
        }
      },
      include: {
        knowledgeItem: {
          select: { title: true }
        }
      }
    });

    // Calculate similarities
    const similarities: VectorSearchResult[] = [];

    for (const chunk of allChunks) {
      if (!chunk.embeddingData) continue;

      try {
        const chunkEmbedding = JSON.parse(chunk.embeddingData) as number[];
        const similarity = cosineSimilarity(sourceEmbedding, chunkEmbedding);

        similarities.push({
          id: chunk.id,
          content: chunk.content,
          similarity,
          knowledgeItemId: chunk.knowledgeItemId,
          knowledgeItemTitle: chunk.knowledgeItem.title,
          chunkIndex: chunk.chunkIndex
        });
      } catch (parseError) {
        console.error('Error parsing chunk embedding:', parseError);
        continue;
      }
    }

    // Sort by similarity and return top results
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

  } catch (error) {
    console.error('Error finding similar content:', error);
    return [];
  }
}

/**
 * Perform hybrid search combining vector similarity and keyword search
 * 
 * @param query Search query
 * @param userId User ID
 * @param options Search options
 * @returns Promise<VectorSearchResult[]>
 */
export async function performHybridSearch(
  query: string,
  userId: string,
  options: {
    vectorWeight?: number;
    keywordWeight?: number;
    limit?: number;
    threshold?: number;
    rerank?: boolean;
  } = {}
): Promise<VectorSearchResult[]> {
  const {
    vectorWeight = 0.6,
    keywordWeight = 0.4,
    limit = 5,
    threshold = 0.3,
    rerank = true
  } = options;

  try {
    console.log(`🔍 HYBRID SEARCH: Starting hybrid search for query: "${query}"`);
    
    // Get more candidates for re-ranking
    const candidateLimit = rerank ? limit * 3 : limit;
    
    // Perform vector search with lower threshold for more recall
    const vectorResults = await performVectorSearch(query, {
      limit: candidateLimit,
      threshold: threshold * 0.5, // Lower threshold for initial retrieval
      userId
    });

    console.log(`🔍 HYBRID SEARCH: Vector search found ${vectorResults.length} results`);

    // Perform enhanced keyword search
    const keywordResults = await performEnhancedKeywordSearch(query, userId, {
      limit: candidateLimit,
      threshold: 0.1
    });

    console.log(`🔍 HYBRID SEARCH: Keyword search found ${keywordResults.length} results`);

    // Combine and deduplicate results with improved scoring
    const combinedResults = combineSearchResultsWithRRF(
      vectorResults,
      keywordResults,
      vectorWeight,
      keywordWeight
    );

    console.log(`🔍 HYBRID SEARCH: Combined results: ${combinedResults.length}`);

    // Apply re-ranking if enabled
    let finalResults = combinedResults;
    if (rerank && combinedResults.length > limit) {
      finalResults = await reRankResults(query, combinedResults, limit);
    }

    // Filter by threshold and limit
    const filteredResults = finalResults
      .filter(result => result.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    console.log(`🔍 HYBRID SEARCH: Final results: ${filteredResults.length}`);
    filteredResults.forEach(result => {
      console.log(`  - ${result.knowledgeItemTitle} (${result.knowledgeItemId}): ${(result.similarity * 100).toFixed(1)}%`);
    });

    return filteredResults;

  } catch (error) {
    console.error('Error performing hybrid search:', error);
    // Fallback to vector search only
    return performVectorSearch(query, { limit, threshold, userId });
  }
}

/**
 * Enhanced keyword-based search with better term matching
 * 
 * @param query Search query
 * @param userId User ID
 * @param options Search options
 * @returns Promise<VectorSearchResult[]>
 */
export async function performEnhancedKeywordSearch(
  query: string,
  userId: string,
  options: {
    limit?: number;
    threshold?: number;
  } = {}
): Promise<VectorSearchResult[]> {
  const { limit = 10, threshold = 0.1 } = options;

  try {
    console.log(`🔍 ENHANCED KEYWORD SEARCH: Starting for query: "${query}"`);
    
    // Extract and clean query terms
    const queryTerms = extractQueryTerms(query);
    const originalQuery = query.toLowerCase().trim();
    
    console.log(`🔍 ENHANCED KEYWORD SEARCH: Query terms: ${queryTerms.join(', ')}`);
    
    if (queryTerms.length === 0 && originalQuery.length === 0) {
      return [];
    }

    // Build comprehensive search conditions
    const searchConditions = [];
    
    // 1. Exact phrase matching (highest priority)
    if (originalQuery.length > 0) {
      searchConditions.push({
        OR: [
          { content: { contains: originalQuery, mode: 'insensitive' as const } },
          { knowledgeItem: { title: { contains: originalQuery, mode: 'insensitive' as const } } }
        ]
      });
    }

    // 2. Individual term matching
    queryTerms.forEach(term => {
      searchConditions.push({
        OR: [
          { content: { contains: term, mode: 'insensitive' as const } },
          { knowledgeItem: { title: { contains: term, mode: 'insensitive' as const } } }
        ]
      });
    });

    // 3. Fuzzy/partial matching for key terms
    queryTerms.forEach(term => {
      if (term.length >= 4) { // Only for longer terms
        searchConditions.push({
          OR: [
            { content: { contains: term.substring(0, term.length - 1), mode: 'insensitive' as const } },
            { knowledgeItem: { title: { contains: term.substring(0, term.length - 1), mode: 'insensitive' as const } } }
          ]
        });
      }
    });

    // Get matching chunks
    const matchingChunks = await prisma.knowledgeChunk.findMany({
      where: {
        knowledgeItem: { 
          userId: userId,
          status: 'READY'
        },
        OR: searchConditions
      },
      include: {
        knowledgeItem: {
          select: { title: true, id: true }
        }
      },
      take: limit * 2 // Get more for better scoring
    });

    console.log(`🔍 ENHANCED KEYWORD SEARCH: Found ${matchingChunks.length} matching chunks`);

    // Calculate enhanced relevance scores
    const results: VectorSearchResult[] = [];
    
    for (const chunk of matchingChunks) {
      const score = calculateEnhancedRelevanceScore(
        originalQuery,
        queryTerms,
        chunk.content,
        chunk.knowledgeItem.title
      );
      
      if (score >= threshold) {
        results.push({
          id: chunk.id,
          content: chunk.content,
          similarity: score,
          knowledgeItemId: chunk.knowledgeItemId,
          knowledgeItemTitle: chunk.knowledgeItem.title,
          chunkIndex: chunk.chunkIndex
        });
      }
    }

    // Sort by score and return top results
    const sortedResults = results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    console.log(`🔍 ENHANCED KEYWORD SEARCH: Returning ${sortedResults.length} results`);
    sortedResults.forEach(result => {
      console.log(`  - ${result.knowledgeItemTitle}: ${(result.similarity * 100).toFixed(1)}%`);
    });

    return sortedResults;

  } catch (error) {
    console.error('Error performing enhanced keyword search:', error);
    return [];
  }
}

/**
 * Combine vector and keyword search results using Reciprocal Rank Fusion (RRF)
 * 
 * @param vectorResults Vector search results
 * @param keywordResults Keyword search results
 * @param vectorWeight Weight for vector scores
 * @param keywordWeight Weight for keyword scores
 * @returns Combined and deduplicated results
 */
function combineSearchResultsWithRRF(
  vectorResults: VectorSearchResult[],
  keywordResults: VectorSearchResult[],
  vectorWeight: number,
  keywordWeight: number
): VectorSearchResult[] {
  // Create a map to combine scores for the same chunks
  const combinedMap = new Map<string, VectorSearchResult>();
  
  // RRF parameters
  const k = 60; // Standard RRF parameter
  
  // Process vector results
  vectorResults.forEach((result, index) => {
    const rrfScore = 1 / (k + index + 1);
    combinedMap.set(result.id, {
      ...result,
      similarity: rrfScore * vectorWeight + result.similarity * vectorWeight * 0.5
    });
  });

  // Process keyword results
  keywordResults.forEach((result, index) => {
    const rrfScore = 1 / (k + index + 1);
    const existing = combinedMap.get(result.id);
    
    if (existing) {
      // Combine scores for chunks found in both searches
      existing.similarity += rrfScore * keywordWeight + result.similarity * keywordWeight * 0.5;
    } else {
      combinedMap.set(result.id, {
        ...result,
        similarity: rrfScore * keywordWeight + result.similarity * keywordWeight * 0.5
      });
    }
  });

  return Array.from(combinedMap.values());
}

/**
 * Calculate enhanced relevance score for keyword matching
 * 
 * @param originalQuery Original search query
 * @param queryTerms Extracted query terms
 * @param content Document content
 * @param title Document title
 * @returns Enhanced relevance score
 */
function calculateEnhancedRelevanceScore(
  originalQuery: string,
  queryTerms: string[],
  content: string,
  title: string
): number {
  const contentLower = content.toLowerCase();
  const titleLower = title.toLowerCase();
  const queryLower = originalQuery.toLowerCase();
  
  let score = 0;
  
  // 1. Exact phrase matching (highest weight)
  if (contentLower.includes(queryLower)) {
    score += 0.8;
  }
  if (titleLower.includes(queryLower)) {
    score += 0.9; // Title matches are very important
  }
  
  // 2. Individual term matching
  let termMatchCount = 0;
  let titleTermMatchCount = 0;
  
  for (const term of queryTerms) {
    if (contentLower.includes(term)) {
      termMatchCount++;
    }
    if (titleLower.includes(term)) {
      titleTermMatchCount++;
    }
  }
  
  // Term frequency score
  const termFreqScore = queryTerms.length > 0 ? termMatchCount / queryTerms.length : 0;
  const titleTermFreqScore = queryTerms.length > 0 ? titleTermMatchCount / queryTerms.length : 0;
  
  score += termFreqScore * 0.4;
  score += titleTermFreqScore * 0.5;
  
  // 3. Position-based scoring (earlier is better)
  const firstOccurrenceIndex = contentLower.indexOf(queryLower);
  if (firstOccurrenceIndex !== -1) {
    const positionScore = Math.max(0, 1 - (firstOccurrenceIndex / content.length));
    score += positionScore * 0.2;
  }
  
  // 4. Length normalization (prefer moderate length content)
  const lengthScore = calculateLengthScore(content);
  score += lengthScore * 0.1;
  
  // 5. Density bonus (multiple occurrences)
  const queryOccurrences = (contentLower.match(new RegExp(queryLower, 'g')) || []).length;
  if (queryOccurrences > 1) {
    score += Math.min(queryOccurrences * 0.1, 0.3);
  }
  
  return Math.min(score, 1.0); // Cap at 1.0
}

/**
 * Re-rank search results using cross-encoder-like scoring
 * 
 * @param query Original query
 * @param candidates Candidate results to re-rank
 * @param topK Number of top results to return
 * @returns Re-ranked results
 */
async function reRankResults(
  query: string,
  candidates: VectorSearchResult[],
  topK: number
): Promise<VectorSearchResult[]> {
  try {
    // For now, implement a simple re-ranking based on query-document relevance
    // In a production system, you might use a cross-encoder model here
    const rerankedResults = candidates.map(candidate => ({
      ...candidate,
      similarity: calculateRelevanceScore(query, candidate.content, candidate.similarity)
    }));

    return rerankedResults
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

  } catch (error) {
    console.error('Error re-ranking results:', error);
    return candidates.slice(0, topK);
  }
}

/**
 * Extract meaningful query terms from the search query
 * 
 * @param query Search query
 * @returns Array of query terms
 */
function extractQueryTerms(query: string): string[] {
  // Remove common stop words and extract meaningful terms
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall'
  ]);

  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(term => term.length > 2 && !stopWords.has(term))
    .slice(0, 10); // Limit to top 10 terms
}

/**
 * Calculate relevance score for re-ranking
 * 
 * @param query Original query
 * @param document Document text
 * @param initialScore Initial similarity score
 * @returns Enhanced relevance score
 */
function calculateRelevanceScore(
  query: string,
  document: string,
  initialScore: number
): number {
  // Combine multiple relevance signals
  const keywordScore = textSimilarity(query, document);
  const positionScore = calculatePositionScore(query, document);
  const lengthScore = calculateLengthScore(document);

  // Weighted combination
  return (
    initialScore * 0.5 +
    keywordScore * 0.3 +
    positionScore * 0.15 +
    lengthScore * 0.05
  );
}

/**
 * Calculate position score based on where query terms appear in document
 * 
 * @param query Search query
 * @param document Document text
 * @returns Position-based score
 */
function calculatePositionScore(query: string, document: string): number {
  const queryTerms = extractQueryTerms(query);
  const docLower = document.toLowerCase();
  const docLength = document.length;

  let positionScore = 0;
  for (const term of queryTerms) {
    const index = docLower.indexOf(term);
    if (index !== -1) {
      // Earlier positions get higher scores
      positionScore += 1 - (index / docLength);
    }
  }

  return queryTerms.length > 0 ? positionScore / queryTerms.length : 0;
}

/**
 * Calculate length score (preference for moderate length documents)
 * 
 * @param document Document text
 * @returns Length-based score
 */
function calculateLengthScore(document: string): number {
  const length = document.length;
  const optimalLength = 500; // Optimal chunk length
  
  if (length <= optimalLength) {
    return length / optimalLength;
  } else {
    return Math.max(0, 1 - (length - optimalLength) / (optimalLength * 2));
  }
}

/**
 * Simple text similarity calculation for hybrid search
 * 
 * @param query Search query
 * @param text Text to compare against
 * @returns Similarity score between 0 and 1
 */
function textSimilarity(query: string, text: string): number {
  const queryWords = query.toLowerCase().split(/\s+/);
  const textWords = text.toLowerCase().split(/\s+/);
  
  const commonWords = queryWords.filter(word => 
    textWords.some(textWord => textWord.includes(word) || word.includes(textWord))
  );
  
  return queryWords.length > 0 ? commonWords.length / queryWords.length : 0;
}
