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

/**
 * Get Gemini model for embeddings
 * @returns Gemini embedding model
 */
export async function getGeminiModel() {
  return genAI.getGenerativeModel({ 
    model: 'text-embedding-004'
  });
}

// Muscle group detection for backwards compatibility
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MUSCLE_GROUPS = [
  'chest', 'pectoral', 'shoulders', 'delts', 'deltoid',
  'back', 'lats', 'rhomboids', 'traps', 'biceps', 'triceps',
  'legs', 'quads', 'quadriceps', 'hamstrings', 'glutes',
  'calves', 'abs', 'core', 'forearms'
];

// Training-related terms that should also use muscle-specific search
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const TRAINING_TERMS = [
  'exercise', 'exercises', 'workout', 'training', 'build muscle',
  'muscle building', 'muscle growth', 'hypertrophy', 'strength'
];

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
    // TEMPORARILY DISABLED: Return original query to preserve specific terms like "chest", "shoulders", etc.
    // Query transformation was converting specific muscle group terms to more general fitness terminology
    // which hurt specificity in knowledge retrieval
    console.log(`🔍 Query transformation DISABLED - using original: "${originalQuery}"`);
    return originalQuery;
    
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
 * ✅ IMPROVED with strict muscle prioritization
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
    // Note: conversationHistory currently unused but kept for future enhancement
    void conversationHistory; // Suppress unused variable warning
    
    // Get RAG configuration from database
    const ragConfig = await getRAGConfig();
    
    // Use provided parameters or fall back to configuration
    const effectiveMaxChunks = maxChunks ?? ragConfig.maxChunks;
    const effectiveThreshold = similarityThreshold ?? ragConfig.similarityThreshold;
    
    // Enhanced muscle group detection with more variations
    const ENHANCED_MUSCLE_GROUPS = [
      'chest', 'pectoral', 'shoulder', 'shoulders', 'delts', 'deltoid',
      'back', 'lats', 'rhomboids', 'traps', 'biceps', 'triceps',
      'legs', 'quads', 'quadriceps', 'hamstrings', 'glutes',
      'calves', 'abs', 'core', 'forearms'
    ];
    
    const queryLower = query.toLowerCase();
    const mentionedMuscles = ENHANCED_MUSCLE_GROUPS.filter(muscle => 
      queryLower.includes(muscle)
    );
    
    // ✅ STRICT MUSCLE MATCH - prioritize direct muscle queries
    const strictMuscleMatch = mentionedMuscles.length > 0;
    
    if (strictMuscleMatch) {
      console.log(`🎯 STRICT muscle query detected: [${mentionedMuscles.join(', ')}]`);
      console.log('   Using direct title search for maximum precision...');
      
      // Direct title search for the first mentioned muscle
      const chunks = await prisma.knowledgeChunk.findMany({
        where: {
          knowledgeItem: {
            userId: userId,
            status: 'READY',
            title: {
              contains: mentionedMuscles[0],
              mode: 'insensitive'
            }
          }
        },
        take: effectiveMaxChunks,
        orderBy: { chunkIndex: 'asc' },
        include: { 
          knowledgeItem: { 
            select: { title: true, id: true } 
          } 
        }
      });

      if (chunks.length > 0) {
        console.log(`✅ Found ${chunks.length} chunks for muscle "${mentionedMuscles[0]}"`);
        
        // Apply diversity filtering to prevent single item domination
        const itemCounts = new Map<string, number>();
        const diverseChunks = [];
        
        for (const chunk of chunks) {
          const currentCount = itemCounts.get(chunk.knowledgeItemId) || 0;
          if (currentCount < 2) { // Max 2 chunks per knowledge item
            diverseChunks.push(chunk);
            itemCounts.set(chunk.knowledgeItemId, currentCount + 1);
          }
        }
        
        console.log(`🎯 Muscle-specific results: ${chunks.length} found → ${diverseChunks.length} after diversity filtering`);
        
        // ✅ PERFORMANCE: Trim content to reduce token count
        const trimmedContent = diverseChunks
          .map(c => trimChunkContent(c.content, 500)) // Limit to 500 chars per chunk
          .join('\n---\n');
          
        return trimmedContent;
      }
    }

    // ✅ FALLBACK - optimized hybrid search with diversity control
    console.log('📚 Using fallback hybrid search with performance optimizations...');
    
    const fallbackResults = await performHybridSearch(query, userId, {
      limit: Math.min(effectiveMaxChunks, 4), // ✅ REDUCED: Max 4 chunks for speed
      threshold: effectiveThreshold,
      vectorWeight: 0.6,
      keywordWeight: 0.4,
      rerank: false, // ✅ DISABLED: Skip re-ranking for faster responses
      maxChunksPerItem: 2 // ✅ DIVERSITY: Max 2 chunks per knowledge item
    });

    // Group results by knowledge item to ensure diversity
    const grouped = fallbackResults.reduce((acc, r) => {
      if (!acc[r.knowledgeItemId]) acc[r.knowledgeItemId] = [];
      acc[r.knowledgeItemId].push(r);
      return acc;
    }, {} as Record<string, typeof fallbackResults>);

    // Take max 2 knowledge items and max 2-3 chunks per item
    const diverseResults = Object.values(grouped)
      .slice(0, 2) // Limit to 2 different knowledge items
      .flat()
      .slice(0, effectiveMaxChunks);

    console.log(`🔄 Fallback results: ${fallbackResults.length} found → ${diverseResults.length} after diversity control`);
    
    // ✅ PERFORMANCE: Trim all content to reduce token count
    const trimmedResults = diverseResults
      .map(r => trimChunkContent(r.content, 500)) // Limit to 500 chars per chunk
      .join('\n---\n');
    
    return trimmedResults;

  } catch (error) {
    console.error('Error in getRelevantContext:', error);
    return 'I apologize, but I encountered an issue accessing the knowledge base. Please try rephrasing your question.';
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
 * Apply diversity filtering to avoid redundant content and prevent single items from dominating
 * 
 * @param results Search results
 * @param threshold Similarity threshold for diversity
 * @param maxPerItem Maximum chunks per knowledge item (prevents domination)
 * @returns Filtered results with diversity
 */
function applyDiversityFiltering(
  results: VectorSearchResult[],
  threshold: number = 0.85,
  maxPerItem: number = 3
): VectorSearchResult[] {
  if (results.length <= 1) return results;

  // First, apply per-item limit to prevent domination by large documents (like full-body workout guides)
  const itemCounts = new Map<string, number>();
  const balancedResults: VectorSearchResult[] = [];

  for (const result of results) {
    const currentCount = itemCounts.get(result.knowledgeItemId) || 0;
    if (currentCount < maxPerItem) {
      balancedResults.push(result);
      itemCounts.set(result.knowledgeItemId, currentCount + 1);
    }
  }

  // Then apply content similarity filtering
  const diverseResults: VectorSearchResult[] = [balancedResults[0]]; // Always include the top result

  for (let i = 1; i < balancedResults.length; i++) {
    const candidate = balancedResults[i];
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

  console.log(`🎯 Diversity filtering: ${results.length} → ${balancedResults.length} (per-item limit) → ${diverseResults.length} (content diversity)`);
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
 * ✅ ENHANCED with performance optimizations and chunk limits
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
    maxChunksPerItem?: number;
  } = {}
): Promise<VectorSearchResult[]> {
  const {
    vectorWeight = 0.2,
    keywordWeight = 0.8,
    limit = 5, // ✅ REDUCED from 8 for performance
    threshold = 0.3,
    rerank = false, // ✅ DISABLED by default for speed
    maxChunksPerItem = 2 // ✅ NEW: Limit chunks per knowledge item
  } = options;

  try {
    console.log(`🔍 HYBRID SEARCH: Starting optimized hybrid search for query: "${query}"`);
    
    // ✅ PERFORMANCE: Reduce candidate limit for faster processing
    const candidateLimit = rerank ? limit * 2 : limit; // Reduced from limit * 3
    
    // Perform vector search with lower threshold for more recall
    const vectorResults = await performVectorSearch(query, {
      limit: candidateLimit,
      threshold: threshold * 0.5, // Lower threshold for initial retrieval
      userId
    });

    console.log(`🔍 HYBRID SEARCH: Vector search found ${vectorResults.length} results`);

    // ✅ CONDITIONAL: Skip keyword search for very short queries
    let keywordResults: VectorSearchResult[] = [];
    if (query.length > 3) {
      keywordResults = await performEnhancedKeywordSearch(query, userId, {
        limit: candidateLimit,
        threshold: 0.1
      });
      console.log(`🔍 HYBRID SEARCH: Keyword search found ${keywordResults.length} results`);
    } else {
      console.log(`🔍 HYBRID SEARCH: Skipping keyword search for short query`);
    }

    // ✅ ENHANCED: Combine with per-item limits
    const combinedResults = combineSearchResultsWithRRF(
      vectorResults,
      keywordResults,
      vectorWeight,
      keywordWeight,
      maxChunksPerItem // Apply chunk limits
    );

    console.log(`🔍 HYBRID SEARCH: Combined results: ${combinedResults.length}`);

    // ✅ CONDITIONAL: Only rerank if needed and specifically requested
    let finalResults = combinedResults;
    if (rerank && combinedResults.length > limit) {
      const avgSimilarity = combinedResults.reduce((sum, r) => sum + r.similarity, 0) / combinedResults.length;
      
      // Only rerank if average similarity is low (uncertain results)
      if (avgSimilarity < 0.6) {
        console.log(`🔍 HYBRID SEARCH: Average similarity ${avgSimilarity.toFixed(2)} - applying rerank`);
        finalResults = await reRankResults(query, combinedResults, limit);
      } else {
        console.log(`🔍 HYBRID SEARCH: High similarity ${avgSimilarity.toFixed(2)} - skipping rerank for speed`);
      }
    }

    // Filter by threshold and limit
    const filteredResults = finalResults
      .filter(result => result.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    console.log(`🔍 HYBRID SEARCH: Final results: ${filteredResults.length} (diversity-controlled)`);
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
 * ✅ ENHANCED with per-item chunk limits to prevent domination
 * 
 * @param vectorResults Vector search results
 * @param keywordResults Keyword search results
 * @param vectorWeight Weight for vector scores
 * @param keywordWeight Weight for keyword scores
 * @param maxChunksPerItem Maximum chunks per knowledge item (default: 2)
 * @returns Combined and deduplicated results with diversity
 */
function combineSearchResultsWithRRF(
  vectorResults: VectorSearchResult[],
  keywordResults: VectorSearchResult[],
  vectorWeight: number,
  keywordWeight: number,
  maxChunksPerItem: number = 2
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

  // ✅ NEW: Apply per-item chunk limits to prevent domination
  const allResults = Array.from(combinedMap.values())
    .sort((a, b) => b.similarity - a.similarity);
    
  const grouped: Record<string, VectorSearchResult[]> = {};
  const limitedResults: VectorSearchResult[] = [];
  
  for (const result of allResults) {
    if (!grouped[result.knowledgeItemId]) {
      grouped[result.knowledgeItemId] = [];
    }
    
    // Only add if we haven't exceeded the per-item limit
    if (grouped[result.knowledgeItemId].length < maxChunksPerItem) {
      grouped[result.knowledgeItemId].push(result);
      limitedResults.push(result);
    }
  }
  
  console.log(`🔄 RRF: ${combinedMap.size} combined → ${limitedResults.length} after diversity filtering (max ${maxChunksPerItem} per item)`);
  
  return limitedResults.sort((a, b) => b.similarity - a.similarity);
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

/**
 * ✅ NEW: Trim chunk content for performance optimization
 * Reduces token count by limiting chunk size and preserving context
 * 
 * @param content Original chunk content
 * @param maxLength Maximum character length (default: 600)
 * @returns Trimmed content with ellipsis if truncated
 */
function trimChunkContent(content: string, maxLength: number = 600): string {
  if (content.length <= maxLength) {
    return content;
  }
  
  // Try to find a sentence break near the limit
  const truncated = content.substring(0, maxLength);
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf('.'),
    truncated.lastIndexOf('!'),
    truncated.lastIndexOf('?')
  );
  
  // If we found a sentence break in the last 20% of the limit, use it
  if (lastSentenceEnd > maxLength * 0.8) {
    return truncated.substring(0, lastSentenceEnd + 1);
  }
  
  // Otherwise, find the last complete word
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > maxLength * 0.7) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  // Fallback: hard truncate with ellipsis
  return truncated + '...';
}

// ===============================
// 🔧 EMBEDDING AUDIT & MANAGEMENT UTILITIES
// ===============================

/**
 * Run comprehensive embedding audit to check coverage and quality
 * 
 * @param userId Optional user ID to filter results
 * @returns Promise<object> Audit report with statistics and findings
 */
export async function runEmbeddingAudit(userId?: string): Promise<{
  totalChunks: number;
  chunksWithEmbeddings: number;
  chunksWithoutEmbeddings: number;
  coveragePercentage: number;
  itemsWithoutEmbeddings: string[];
  averageEmbeddingDimensions: number;
  recommendations: string[];
}> {
  try {
    console.log('🔍 Starting comprehensive embedding audit...');
    
    // Get all knowledge chunks, optionally filtered by user
    const whereClause = userId ? {
      knowledgeItem: { userId, status: 'READY' as const }
    } : {
      knowledgeItem: { status: 'READY' as const }
    };
    
    const allChunks = await prisma.knowledgeChunk.findMany({
      where: whereClause,
      include: {
        knowledgeItem: {
          select: { id: true, title: true, userId: true }
        }
      }
    });
    
    const totalChunks = allChunks.length;
    const chunksWithEmbeddings = allChunks.filter(chunk => 
      chunk.embeddingData && chunk.embeddingData !== '[]'
    ).length;
    const chunksWithoutEmbeddings = totalChunks - chunksWithEmbeddings;
    const coveragePercentage = totalChunks > 0 ? (chunksWithEmbeddings / totalChunks) * 100 : 0;
    
    // Find items with missing embeddings
    const itemsWithoutEmbeddings = Array.from(new Set(
      allChunks
        .filter(chunk => !chunk.embeddingData || chunk.embeddingData === '[]')
        .map(chunk => `${chunk.knowledgeItem.title} (ID: ${chunk.knowledgeItemId})`)
    ));
    
    // Calculate average embedding dimensions
    let totalDimensions = 0;
    let validEmbeddings = 0;
    
    for (const chunk of allChunks) {
      if (chunk.embeddingData && chunk.embeddingData !== '[]') {
        try {
          const embedding = JSON.parse(chunk.embeddingData);
          if (Array.isArray(embedding) && embedding.length > 0) {
            totalDimensions += embedding.length;
            validEmbeddings++;
          }
        } catch (error) {
          console.warn(`Invalid embedding format for chunk ${chunk.id}:`, error);
        }
      }
    }
    
    const averageEmbeddingDimensions = validEmbeddings > 0 ? totalDimensions / validEmbeddings : 0;
    
    // Generate recommendations
    const recommendations: string[] = [];
    
    if (coveragePercentage < 95) {
      recommendations.push(`🚨 Low embedding coverage (${coveragePercentage.toFixed(1)}%) - run reembedMissingChunks()`);
    }
    
    if (averageEmbeddingDimensions !== 768) {
      recommendations.push(`⚠️  Unexpected embedding dimensions (${averageEmbeddingDimensions}) - should be 768 for text-embedding-004`);
    }
    
    if (itemsWithoutEmbeddings.length > 0) {
      recommendations.push(`📋 ${itemsWithoutEmbeddings.length} items need embedding generation`);
    }
    
    if (recommendations.length === 0) {
      recommendations.push('✅ All embeddings are properly configured and complete');
    }
    
    const auditReport = {
      totalChunks,
      chunksWithEmbeddings,
      chunksWithoutEmbeddings,
      coveragePercentage,
      itemsWithoutEmbeddings,
      averageEmbeddingDimensions,
      recommendations
    };
    
    console.log('📊 EMBEDDING AUDIT COMPLETE:');
    console.log(`   Total chunks: ${totalChunks}`);
    console.log(`   With embeddings: ${chunksWithEmbeddings}`);
    console.log(`   Missing embeddings: ${chunksWithoutEmbeddings}`);
    console.log(`   Coverage: ${coveragePercentage.toFixed(1)}%`);
    console.log(`   Recommendations: ${recommendations.length}`);
    
    return auditReport;
    
  } catch (error) {
    console.error('Error running embedding audit:', error);
    throw error;
  }
}

/**
 * Reembed all chunks that are missing embeddings
 * 
 * @param userId Optional user ID to filter chunks
 * @param batchSize Number of chunks to process at once
 * @returns Promise<object> Reembedding results
 */
export async function reembedMissingChunks(
  userId?: string, 
  batchSize: number = 10
): Promise<{
  processed: number;
  successful: number;
  failed: number;
  errors: string[];
}> {
  try {
    console.log('🔄 Starting reembedding process for missing embeddings...');
    
    // Get chunks without embeddings
    const whereClause = userId ? {
      knowledgeItem: { userId, status: 'READY' as const },
      OR: [
        { embeddingData: null },
        { embeddingData: '[]' },
        { embeddingData: '' }
      ]
    } : {
      knowledgeItem: { status: 'READY' as const },
      OR: [
        { embeddingData: null },
        { embeddingData: '[]' },
        { embeddingData: '' }
      ]
    };
    
    const chunksWithoutEmbeddings = await prisma.knowledgeChunk.findMany({
      where: whereClause,
      include: {
        knowledgeItem: {
          select: { title: true }
        }
      }
    });
    
    console.log(`📋 Found ${chunksWithoutEmbeddings.length} chunks without embeddings`);
    
    if (chunksWithoutEmbeddings.length === 0) {
      return {
        processed: 0,
        successful: 0,
        failed: 0,
        errors: []
      };
    }
    
    const gemini = await getGeminiModel();
    let processed = 0;
    let successful = 0;
    let failed = 0;
    const errors: string[] = [];
    
    // Process in batches to avoid rate limits
    for (let i = 0; i < chunksWithoutEmbeddings.length; i += batchSize) {
      const batch = chunksWithoutEmbeddings.slice(i, i + batchSize);
      console.log(`🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(chunksWithoutEmbeddings.length/batchSize)}`);
      
      for (const chunk of batch) {
        try {
          // Generate embedding
          const result = await gemini.embedContent(chunk.content);
          const embedding = result.embedding.values;
          
          // Update chunk with embedding
          await prisma.knowledgeChunk.update({
            where: { id: chunk.id },
            data: { embeddingData: JSON.stringify(embedding) }
          });
          
          successful++;
          console.log(`  ✅ Embedded chunk from "${chunk.knowledgeItem.title}"`);
          
        } catch (error) {
          failed++;
          const errorMessage = `Failed to embed chunk ${chunk.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMessage);
          console.error(`  ❌ ${errorMessage}`);
        }
        
        processed++;
      }
      
      // Add delay between batches to respect rate limits
      if (i + batchSize < chunksWithoutEmbeddings.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`🎯 Reembedding complete: ${successful}/${processed} successful`);
    
    return {
      processed,
      successful,
      failed,
      errors
    };
    
  } catch (error) {
    console.error('Error reembedding missing chunks:', error);
    throw error;
  }
}

/**
 * Set the strict muscle priority configuration
 * 
 * @param enabled Whether to enable strict muscle prioritization
 * @returns Promise<boolean> Success status
 */
export async function setStrictMusclePriority(enabled: boolean): Promise<boolean> {
  try {
    console.log(`🎯 ${enabled ? 'Enabling' : 'Disabling'} strict muscle prioritization...`);
    
    // Update the AIConfiguration table
    await prisma.aIConfiguration.upsert({
      where: { id: 'singleton' },
      update: { 
        strictMusclePriority: enabled,
        updatedAt: new Date()
      },
      create: {
        id: 'singleton',
        strictMusclePriority: enabled
      }
    });
    
    console.log(`✅ Strict muscle priority ${enabled ? 'enabled' : 'disabled'} successfully`);
    
    return true;
    
  } catch (error) {
    console.error('Error setting strict muscle priority:', error);
    return false;
  }
}

/**
 * Handle new knowledge upload by generating embeddings immediately
 * 
 * @param knowledgeItemId Knowledge item ID
 * @returns Promise<boolean> Success status
 */
export async function handleNewKnowledgeUpload(knowledgeItemId: string): Promise<boolean> {
  try {
    console.log(`🆕 Processing new knowledge upload: ${knowledgeItemId}`);
    
    // Get all chunks for this knowledge item that need embeddings
    const chunks = await prisma.knowledgeChunk.findMany({
      where: {
        knowledgeItemId,
        OR: [
          { embeddingData: null },
          { embeddingData: '[]' },
          { embeddingData: '' }
        ]
      }
    });
    
    if (chunks.length === 0) {
      console.log('✅ All chunks already have embeddings');
      return true;
    }
    
    console.log(`📋 Generating embeddings for ${chunks.length} new chunks...`);
    
    const gemini = await getGeminiModel();
    let successful = 0;
    
    for (const chunk of chunks) {
      try {
        // Generate embedding
        const result = await gemini.embedContent(chunk.content);
        const embedding = result.embedding.values;
        
        // Update chunk with embedding
        await prisma.knowledgeChunk.update({
          where: { id: chunk.id },
          data: { embeddingData: JSON.stringify(embedding) }
        });
        
        successful++;
        console.log(`  ✅ Embedded chunk ${chunk.chunkIndex + 1}/${chunks.length}`);
        
        // Add small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Failed to embed chunk ${chunk.id}:`, error);
      }
    }
    
    console.log(`🎯 Upload processing complete: ${successful}/${chunks.length} chunks embedded`);
    return successful === chunks.length;
    
  } catch (error) {
    console.error('Error handling new knowledge upload:', error);
    return false;
  }
}

/**
 * ✅ NEW: Smart chunking strategy for long documents
 * Breaks text into semantically meaningful chunks while respecting size limits
 * 
 * @param text Original text content
 * @param maxChunkSize Maximum characters per chunk (default: 600)
 * @param overlapSize Overlap between chunks for context (default: 100)
 * @returns Array of content chunks
 */
export function chunkTextSmart(
  text: string, 
  maxChunkSize: number = 600, 
  overlapSize: number = 100
): string[] {
  if (!text || text.trim().length === 0) {
    return [];
  }
  
  // First, try to split by paragraphs (double newlines)
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const chunks: string[] = [];
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    const trimmedPara = paragraph.trim();
    
    // If this paragraph alone exceeds max size, split it by sentences
    if (trimmedPara.length > maxChunkSize) {
      // Finish current chunk if it exists
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      
      // Split large paragraph by sentences
      const sentences = trimmedPara.split(/[.!?]+/).filter(s => s.trim().length > 0);
      let sentenceChunk = '';
      
      for (const sentence of sentences) {
        const trimmedSentence = sentence.trim() + '.'; // Add back the punctuation
        
        if ((sentenceChunk + ' ' + trimmedSentence).length > maxChunkSize) {
          if (sentenceChunk.trim()) {
            chunks.push(sentenceChunk.trim());
          }
          sentenceChunk = trimmedSentence;
        } else {
          sentenceChunk += (sentenceChunk ? ' ' : '') + trimmedSentence;
        }
      }
      
      if (sentenceChunk.trim()) {
        currentChunk = sentenceChunk.trim();
      }
      
    } else if ((currentChunk + '\n\n' + trimmedPara).length > maxChunkSize) {
      // Current paragraph would make chunk too large
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = trimmedPara;
      
    } else {
      // Add paragraph to current chunk
      currentChunk += (currentChunk ? '\n\n' : '') + trimmedPara;
    }
  }
  
  // Add the last chunk if it exists
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  // Apply overlap if we have multiple chunks
  if (chunks.length > 1 && overlapSize > 0) {
    const overlappedChunks: string[] = [];
    
    for (let i = 0; i < chunks.length; i++) {
      let chunk = chunks[i];
      
      // Add overlap from previous chunk
      if (i > 0 && overlappedChunks[i - 1]) {
        const prevChunk = overlappedChunks[i - 1];
        const overlapText = prevChunk.slice(-overlapSize).trim();
        if (overlapText && !chunk.startsWith(overlapText)) {
          chunk = overlapText + '\n...\n' + chunk;
        }
      }
      
      overlappedChunks.push(chunk);
    }
    
    return overlappedChunks;
  }
  
  return chunks;
}

/**
 * ✅ NEW: Analyze and suggest chunking improvements for existing knowledge items
 * 
 * @param knowledgeItemId Optional knowledge item ID to analyze specific item
 * @returns Promise<object> Analysis report with recommendations
 */
export async function analyzeChunkingQuality(knowledgeItemId?: string): Promise<{
  items: Array<{
    id: string;
    title: string;
    chunkCount: number;
    avgChunkSize: number;
    maxChunkSize: number;
    minChunkSize: number;
    recommendations: string[];
  }>;
  overallRecommendations: string[];
}> {
  try {
    console.log('📊 Analyzing chunking quality...');
    
    // Get knowledge items to analyze
    const whereClause = knowledgeItemId ? 
      { id: knowledgeItemId } : 
      { status: 'READY' as const };
    
    const knowledgeItems = await prisma.knowledgeItem.findMany({
      where: whereClause,
      include: {
        chunks: {
          select: {
            content: true
          }
        }
      }
    });
    
    const itemAnalysis = [];
    const overallRecommendations: string[] = [];
    
    for (const item of knowledgeItems) {
      const chunks = item.chunks;
      const chunkCount = chunks.length;
      
      if (chunkCount === 0) continue;
      
      const chunkSizes = chunks.map((c: { content: string }) => c.content.length);
      const avgChunkSize = chunkSizes.reduce((sum: number, size: number) => sum + size, 0) / chunkCount;
      const maxChunkSize = Math.max(...chunkSizes);
      const minChunkSize = Math.min(...chunkSizes);
      
      const recommendations: string[] = [];
      
      // Analyze chunk distribution
      if (chunkCount > 50) {
        recommendations.push(`⚠️ Very high chunk count (${chunkCount}) - consider splitting into focused sub-topics`);
      }
      
      if (maxChunkSize > 1000) {
        recommendations.push(`📏 Large chunks detected (max: ${maxChunkSize} chars) - consider smaller chunks for better retrieval`);
      }
      
      if (minChunkSize < 100) {
        recommendations.push(`📉 Very small chunks detected (min: ${minChunkSize} chars) - consider merging with adjacent content`);
      }
      
      const sizeVariance = chunkSizes.reduce((acc: number, size: number) => acc + Math.pow(size - avgChunkSize, 2), 0) / chunkCount;
      const sizeStdDev = Math.sqrt(sizeVariance);
      
      if (sizeStdDev > avgChunkSize * 0.5) {
        recommendations.push(`📊 High chunk size variation (σ=${sizeStdDev.toFixed(0)}) - consider more consistent chunking`);
      }
      
      if (recommendations.length === 0) {
        recommendations.push('✅ Chunking appears well-balanced');
      }
      
      itemAnalysis.push({
        id: item.id,
        title: item.title,
        chunkCount,
        avgChunkSize: Math.round(avgChunkSize),
        maxChunkSize,
        minChunkSize,
        recommendations
      });
    }
    
    // Generate overall recommendations
    const totalItems = itemAnalysis.length;
    const totalChunks = itemAnalysis.reduce((sum, item) => sum + item.chunkCount, 0);
    const avgChunksPerItem = totalChunks / totalItems;
    
    if (avgChunksPerItem > 30) {
      overallRecommendations.push('📈 High average chunks per item - consider splitting large documents');
    }
    
    const dominatingItems = itemAnalysis.filter(item => item.chunkCount > totalChunks * 0.3);
    if (dominatingItems.length > 0) {
      overallRecommendations.push(`🎯 Found ${dominatingItems.length} dominating items - these may bias search results`);
    }
    
    if (overallRecommendations.length === 0) {
      overallRecommendations.push('✅ Overall chunking distribution looks healthy');
    }
    
    console.log(`📊 Analysis complete: ${totalItems} items, ${totalChunks} total chunks`);
    
    return {
      items: itemAnalysis,
      overallRecommendations
    };
    
  } catch (error) {
    console.error('Error analyzing chunking quality:', error);
    throw error;
  }
}
