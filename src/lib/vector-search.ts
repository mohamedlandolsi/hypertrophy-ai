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
  // For now, use JSON-based similarity as primary method since pgvector may not be installed
  // This provides better reliability until pgvector extension is properly configured
  return await fallbackJsonSimilaritySearch(queryEmbedding, topK, highRelevanceThreshold);
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
  try {
    console.log(`🔍 Starting optimized JSON similarity search for top ${topK} chunks`);
    const searchStart = Date.now();
    
    // Fetch chunks with JSON embeddings with LIMIT to prevent timeouts
    // Only process a reasonable number of chunks to keep response time under 30 seconds
    const maxChunksToProcess = 1500; // Limit to 1500 chunks for faster processing
    
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
      take: maxChunksToProcess, // CRITICAL: Limit to prevent timeout
      // No ordering for better source diversity
    });

    const fetchTime = Date.now() - searchStart;
    console.log(`📊 Fetched ${chunks.length} chunks in ${fetchTime}ms`);

    // Calculate cosine similarity in JavaScript
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

    // Sort by similarity descending
    const sortedSimilarities = similarities.sort((a, b) => b.similarity - a.similarity);

    // Step 1: Fetch a larger pool for source diversification (3x topK, minimum 15)
    const initialFetchLimit = Math.max(topK * 3, 15);
    let candidateChunks = sortedSimilarities.slice(0, initialFetchLimit);

    // Step 2: Apply high relevance threshold filtering if provided
    if (highRelevanceThreshold !== undefined) {
      candidateChunks = candidateChunks.filter(
        chunk => chunk.similarity >= highRelevanceThreshold
      );
      
      console.log(`🔍 High relevance filtering: ${sortedSimilarities.length} total → ${candidateChunks.length} above threshold ${highRelevanceThreshold}`);
    }

    // Step 3: Implement interleaved source diversification
    const diversifiedChunks: KnowledgeContext[] = [];
    
    // Group chunks by knowledge item
    const chunksBySource = candidateChunks.reduce((groups, chunk) => {
      if (!groups[chunk.knowledgeId]) {
        groups[chunk.knowledgeId] = [];
      }
      groups[chunk.knowledgeId].push(chunk);
      return groups;
    }, {} as Record<string, KnowledgeContext[]>);
    
    // Sort sources by their best chunk's similarity (descending)
    const sortedSources = Object.entries(chunksBySource)
      .sort(([, a], [, b]) => b[0].similarity - a[0].similarity)
      .map(([sourceId, chunks]) => ({ sourceId, chunks }));
    
    console.log(`🔍 Found ${sortedSources.length} unique sources for interleaving`);
    
    // Interleave chunks: take best chunk from each source in round-robin fashion
    let sourceIndex = 0;
    const sourceChunkIndices = new Array(sortedSources.length).fill(0);
    
    while (diversifiedChunks.length < topK) {
      let addedInThisRound = 0;
      
      // Try to add one chunk from each source in this round
      for (let i = 0; i < sortedSources.length && diversifiedChunks.length < topK; i++) {
        const currentSourceIndex = (sourceIndex + i) % sortedSources.length;
        const source = sortedSources[currentSourceIndex];
        const chunkIndex = sourceChunkIndices[currentSourceIndex];
        
        if (chunkIndex < source.chunks.length) {
          const chunk = source.chunks[chunkIndex];
          
          // Avoid duplicate content
          if (!diversifiedChunks.some(dc => dc.content === chunk.content)) {
            diversifiedChunks.push(chunk);
            addedInThisRound++;
          }
          
          sourceChunkIndices[currentSourceIndex]++;
        }
      }
      
      // If no chunks were added in this round, break to avoid infinite loop
      if (addedInThisRound === 0) {
        break;
      }
      
      sourceIndex = (sourceIndex + 1) % sortedSources.length;
    }

    const uniqueSourceCount = new Set(diversifiedChunks.map(chunk => chunk.knowledgeId)).size;
    console.log(`🔍 Interleaved diversification: ${diversifiedChunks.length} chunks from ${uniqueSourceCount} unique sources`);
    
    // Log source distribution for debugging
    const sourceDistribution = diversifiedChunks.reduce((dist, chunk) => {
      dist[chunk.title] = (dist[chunk.title] || 0) + 1;
      return dist;
    }, {} as Record<string, number>);
    
    console.log(`📊 Source distribution:`, sourceDistribution);

    return diversifiedChunks;

  } catch (error) {
    console.error('❌ Fallback similarity search error:', error);
    return [];
  }
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
