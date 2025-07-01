/**
 * Vector search utilities for Supabase with pgvector
 * 
 * This module provides functions to store and search vector embeddings
 * in Supabase using the pgvector extension.
 */

import { prisma } from './prisma';
import { generateQueryEmbedding, cosineSimilarity } from './vector-embeddings';

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
 * Get relevant context for a user query from their knowledge base
 * 
 * @param userId User ID
 * @param query Search query
 * @param maxChunks Maximum number of chunks to return
 * @param similarityThreshold Minimum similarity score
 * @returns Promise<string> Concatenated relevant content
 */
export async function getRelevantContext(
  userId: string,
  query: string,
  maxChunks: number = 5,
  similarityThreshold: number = 0.6
): Promise<string> {
  try {
    const searchResults = await performVectorSearch(query, {
      limit: maxChunks,
      threshold: similarityThreshold,
      userId: userId
    });

    if (searchResults.length === 0) {
      return '';
    }

    // Group chunks by knowledge item to maintain context
    const groupedChunks = groupChunksByKnowledgeItem(searchResults);
    
    // Format the context with source attribution
    const contextParts = Object.entries(groupedChunks).map(([title, chunks]) => {
      const sortedChunks = chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);
      const chunkTexts = sortedChunks.map(chunk => chunk.content).join('\n\n');
      
      return `=== ${title} ===\n${chunkTexts}`;
    });

    return contextParts.join('\n\n');

  } catch (error) {
    console.error('Error getting relevant context:', error);
    return ''; // Return empty string to allow conversation to continue
  }
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
 * Perform hybrid search combining vector similarity and text search
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
    textWeight?: number;
    limit?: number;
    threshold?: number;
  } = {}
): Promise<VectorSearchResult[]> {
  const {
    vectorWeight = 0.7,
    textWeight = 0.3,
    limit = 5,
    threshold = 0.4
  } = options;

  try {
    // Get vector search results
    const vectorResults = await performVectorSearch(query, {
      limit: limit * 2, // Get more results for reranking
      threshold: threshold * 0.8, // Lower threshold for vector search
      userId
    });

    // Normalize and combine scores (simplified hybrid approach)
    const hybridResults = vectorResults.map(result => ({
      ...result,
      similarity: result.similarity * vectorWeight +
        (textSimilarity(query, result.content) * textWeight)
    }));

    // Sort by combined score and return top results
    return hybridResults
      .filter(result => result.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

  } catch (error) {
    console.error('Error performing hybrid search:', error);
    // Fallback to vector search only
    return performVectorSearch(query, { limit, threshold, userId });
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
