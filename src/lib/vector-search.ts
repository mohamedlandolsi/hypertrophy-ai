/**
 * NEW RAG SYSTEM - Efficient Vector Search with pgvector
 * 
 * This module provides optimized functions for retrieving relevant knowledge
 * from the KnowledgeChunk table using vector similarity search.
 */

import { prisma } from './prisma';

export interface KnowledgeContext {
  content: string;
  knowledgeId: string;
  title: string;
  similarity: number;
  chunkIndex: number;
}

/**
 * Fetch relevant knowledge chunks using efficient vector similarity search
 * with two-step retrieval: fetch larger pool, then filter by high relevance
 * 
 * @param queryEmbedding - The vector embedding of the user's query
 * @param topK - Maximum number of chunks to retrieve from AI configuration
 * @param highRelevanceThreshold - Optional high relevance threshold for filtering
 * @returns Promise<KnowledgeContext[]>
 */
export async function fetchRelevantKnowledge(
  queryEmbedding: number[],  
  topK: number,
  highRelevanceThreshold?: number
): Promise<KnowledgeContext[]> {
  // Use optimized search with batching for better performance
  return await optimizedJsonSimilaritySearch(queryEmbedding, topK, highRelevanceThreshold);
}

/**
 * Optimized JSON similarity search with batching and early stopping
 * Only processes chunks in batches for better performance and memory efficiency
 */
export async function optimizedJsonSimilaritySearch(
  queryEmbedding: number[],
  topK: number,
  highRelevanceThreshold?: number
): Promise<KnowledgeContext[]> {
  try {
    
    // Process chunks in optimized batches for better performance
    const batchSize = 100; // Increased batch size for efficiency
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allSimilarities: Array<{chunk: any, similarity: number}> = [];
    let offset = 0;
    let hasMore = true;
    let consecutiveLowBatches = 0;
    const maxConsecutiveLowBatches = 3; // Early stopping if similarity is consistently low
    
    while (hasMore) {
      const chunks = await prisma.knowledgeChunk.findMany({
        where: {
          embeddingData: { not: null },
          knowledgeItem: {
            status: 'READY'
          }
        },
        select: {
          id: true,
          content: true,
          embeddingData: true,
          chunkIndex: true,
          knowledgeItem: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: [
          { createdAt: 'desc' }, // More recent content first
          { chunkIndex: 'asc' }
        ],
        take: batchSize,
        skip: offset
      });
      
      if (chunks.length === 0) {
        hasMore = false;
        continue;
      }
      
      // Calculate similarities for this batch
      const batchSimilarities = chunks.map(chunk => {
        try {
          const chunkEmbedding = JSON.parse(chunk.embeddingData!) as number[];
          const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);
          return { chunk, similarity };
        } catch (error) {
          console.error(`❌ Error parsing embedding for chunk ${chunk.id}:`, error);
          return { chunk, similarity: 0 };
        }
      });
      
      // Check if this batch has low relevance scores for early stopping
      const batchMaxSimilarity = Math.max(...batchSimilarities.map(s => s.similarity));
      const relevanceThreshold = highRelevanceThreshold || 0.3; // Lower threshold for early stopping
      
      if (batchMaxSimilarity < relevanceThreshold * 0.5) {
        consecutiveLowBatches++;
        if (consecutiveLowBatches >= maxConsecutiveLowBatches && allSimilarities.length >= topK * 2) {
          // Stop early if we have enough results and consecutive batches are low relevance
          console.log(`⚡ Early stopping after ${offset + chunks.length} chunks (${consecutiveLowBatches} low batches)`);
          break;
        }
      } else {
        consecutiveLowBatches = 0; // Reset counter if we find relevant content
      }
      
      allSimilarities.push(...batchSimilarities);
      offset += batchSize;
      
      // Limit total chunks processed for performance
      if (offset >= 1000) {
        console.log(`⚡ Stopping at 1000 chunks for performance`);
        break;
      }
    }
    
    // Sort all results by similarity
    allSimilarities.sort((a, b) => b.similarity - a.similarity);
    
    // Apply high relevance threshold if specified
    let candidateSimilarities = allSimilarities;
    if (highRelevanceThreshold && highRelevanceThreshold > 0) {
      candidateSimilarities = allSimilarities.filter(
        item => item.similarity >= highRelevanceThreshold
      );
    }
    
    // Take top results with source diversification
    const results: KnowledgeContext[] = [];
    const maxPerSource = Math.max(1, Math.floor(topK / 3));
    
    for (const {chunk, similarity} of candidateSimilarities) {
      if (results.length >= topK) break;
      
      const sourceCount = results.filter(r => r.knowledgeId === chunk.knowledgeItem.id).length;
      if (sourceCount < maxPerSource) {
        results.push({
          content: chunk.content,
          knowledgeId: chunk.knowledgeItem.id,
          title: chunk.knowledgeItem.title,
          similarity,
          chunkIndex: chunk.chunkIndex
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error('❌ Optimized search failed, falling back to standard search:', error);
    return await fallbackJsonSimilaritySearch(queryEmbedding, topK, highRelevanceThreshold);
  }
}

/**
 * Fallback similarity search using JSON embeddings (for systems without pgvector)
 * Implements two-step retrieval with source diversification to prevent chunk dominance
 */
export async function fallbackJsonSimilaritySearch(
  queryEmbedding: number[],
  topK: number,
  highRelevanceThreshold?: number
): Promise<KnowledgeContext[]> {
  let retries = 3;
  
  while (retries > 0) {
    try {
      console.log(`🔍 Starting optimized JSON similarity search for top ${topK} chunks (${4 - retries}/3 attempts)`);
      const searchStart = Date.now();
      
      // Ensure database connection is fresh
      await prisma.$connect();
      
      // Fetch ALL chunks with JSON embeddings - remove artificial limit
      // The vector similarity calculation should work across the entire knowledge base
      console.log('📊 Fetching all available chunks for comprehensive search...');
      
      const chunks = await prisma.knowledgeChunk.findMany({
        where: {
          embeddingData: { not: null },
          knowledgeItem: {
            status: 'READY'
          }
        },
        include: {
          knowledgeItem: {
            select: {
              id: true,
              title: true
            }
          }
        },
        // Remove the artificial limit - search across entire knowledge base
        // Order by creation time for consistent results, but search all chunks
        orderBy: {
          createdAt: 'asc'
        }
      });

    const fetchTime = Date.now() - searchStart;
    console.log(`📊 Fetched ${chunks.length} chunks from entire knowledge base in ${fetchTime}ms`);

    if (chunks.length === 0) {
      console.log('⚠️ No chunks found in knowledge base');
      return [];
    }

    // Calculate cosine similarity in JavaScript across ALL chunks
    console.log('🧮 Computing similarity scores for all chunks...');
    const similarities = chunks.map(chunk => {
      try {
        const chunkEmbedding = JSON.parse(chunk.embeddingData!) as number[];
        const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);
        
        return {
          content: chunk.content,
          knowledgeId: chunk.knowledgeItem.id,
          title: chunk.knowledgeItem.title,
          similarity,
          chunkIndex: chunk.chunkIndex
        };
      } catch (parseError) {
        console.error('Error parsing embedding data:', parseError);
        return null;
      }
    }).filter(Boolean) as KnowledgeContext[];

    // Sort by similarity descending to get the best matches first
    const sortedSimilarities = similarities.sort((a, b) => b.similarity - a.similarity);
    
    console.log(`🎯 Top similarity scores: ${sortedSimilarities.slice(0, 5).map(s => s.similarity.toFixed(4)).join(', ')}`);

    // Apply high relevance threshold filtering if provided
    let candidateChunks = sortedSimilarities;
    if (highRelevanceThreshold !== undefined) {
      candidateChunks = sortedSimilarities.filter(
        chunk => chunk.similarity >= highRelevanceThreshold
      );
      
      console.log(`🔍 High relevance filtering: ${sortedSimilarities.length} total → ${candidateChunks.length} above threshold ${highRelevanceThreshold}`);
    }

    if (candidateChunks.length === 0) {
      console.log('⚠️ No chunks meet the similarity criteria');
      return [];
    }

    // Simplified diversification: ensure we get results from multiple sources
    const diversifiedChunks: KnowledgeContext[] = [];
    const usedSources = new Set<string>();
    const maxPerSource = Math.max(1, Math.floor(topK / 3)); // Allow max 1/3 of results from same source
    
    // First pass: take the best chunk from each unique source
    for (const chunk of candidateChunks) {
      if (!usedSources.has(chunk.knowledgeId) && diversifiedChunks.length < topK) {
        diversifiedChunks.push(chunk);
        usedSources.add(chunk.knowledgeId);
      }
    }
    
    // Second pass: fill remaining slots with best available chunks, respecting per-source limits
    const sourceCount = new Map<string, number>();
    for (const chunk of candidateChunks) {
      if (diversifiedChunks.length >= topK) break;
      
      const currentCount = sourceCount.get(chunk.knowledgeId) || 0;
      if (currentCount < maxPerSource && !diversifiedChunks.some(dc => dc.chunkIndex === chunk.chunkIndex && dc.knowledgeId === chunk.knowledgeId)) {
        diversifiedChunks.push(chunk);
        sourceCount.set(chunk.knowledgeId, currentCount + 1);
      }
    }

    console.log(`� Diversified results: ${diversifiedChunks.length} chunks from ${usedSources.size} sources`);

    const searchTime = Date.now() - searchStart;
    console.log(`✅ Vector search completed in ${searchTime}ms`);

    return diversifiedChunks;
    } catch (error) {
      console.error(`❌ Fallback JSON similarity search failed (attempt ${4 - retries}/3):`, error);
      retries--;
      
      if (retries === 0) {
        console.error('❌ All retry attempts failed for JSON similarity search');
        throw error;
      }
      
      // Disconnect and wait before retry
      await prisma.$disconnect();
      await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries))); // Exponential backoff
      console.log(`🔄 Retrying database connection... (${retries} attempts remaining)`);
    }
  }
  
  // This should never be reached, but TypeScript needs it
  throw new Error('Unexpected end of retry loop');
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Admin function to run embedding audit
 * TODO: Implement comprehensive embedding quality check
 */
export async function runEmbeddingAudit() {
  console.log('🔍 Running embedding audit...');
  
  const chunks = await prisma.knowledgeChunk.findMany({
    where: {
      embeddingData: { not: null }
    },
    select: {
      id: true,
      knowledgeItemId: true,
      chunkIndex: true,
      embeddingData: true
    }
  });
  
  return {
    totalChunks: chunks.length,
    chunksWithEmbeddings: chunks.filter(c => c.embeddingData).length,
    auditComplete: true
  };
}

/**
 * Admin function to re-embed missing chunks
 * TODO: Implement re-embedding logic for chunks without embeddings
 */
export async function reembedMissingChunks() {
  console.log('🔄 Re-embedding missing chunks...');
  
  const chunksWithoutEmbeddings = await prisma.knowledgeChunk.findMany({
    where: {
      embeddingData: null
    }
  });
  
  console.log(`Found ${chunksWithoutEmbeddings.length} chunks without embeddings`);
  
  return {
    processed: 0,
    skipped: chunksWithoutEmbeddings.length,
    message: 'Re-embedding functionality not yet implemented'
  };
}

/**
 * Delete embeddings for a knowledge item
 */
export async function deleteEmbeddings(knowledgeItemId: string) {
  console.log(`🗑️ Deleting embeddings for knowledge item: ${knowledgeItemId}`);
  
  const result = await prisma.knowledgeChunk.updateMany({
    where: {
      knowledgeItemId: knowledgeItemId
    },
    data: {
      embeddingData: null
    }
  });
  
  return { deletedCount: result.count };
}
