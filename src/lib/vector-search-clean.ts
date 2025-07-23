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
 * 
 * @param queryEmbedding - The vector embedding of the user's query
 * @param topK - Maximum number of chunks to retrieve from AI configuration
 * @returns Promise<KnowledgeContext[]>
 */
export async function fetchRelevantKnowledge(
  queryEmbedding: number[],
  topK: number
): Promise<KnowledgeContext[]> {
  try {
    // Convert embedding array to pgvector format
    const embeddingString = `[${queryEmbedding.join(',')}]`;
    
    // Use raw SQL query for efficient pgvector cosine similarity search
    const results = await prisma.$queryRaw<Array<{
      content: string;
      knowledgeId: string;
      title: string;
      similarity: number;
      chunkIndex: number;
    }>>`
      SELECT
        kc.content,
        ki.id as "knowledgeId",
        ki.title,
        1 - (kc."embeddingData"::vector <=> ${embeddingString}::vector) as similarity,
        kc."chunkIndex"
      FROM "KnowledgeChunk" kc
      JOIN "KnowledgeItem" ki ON kc."knowledgeItemId" = ki.id
      WHERE ki.status = 'READY'
        AND kc."embeddingData" IS NOT NULL
      ORDER BY kc."embeddingData"::vector <=> ${embeddingString}::vector
      LIMIT ${topK};
    `;

    return results.map(result => ({
      content: result.content,
      knowledgeId: result.knowledgeId,
      title: result.title,
      similarity: Number(result.similarity),
      chunkIndex: result.chunkIndex
    }));

  } catch (error) {
    console.error('❌ Vector search error:', error);
    // Fallback to JSON-based similarity if pgvector fails
    return await fallbackJsonSimilaritySearch(queryEmbedding, topK);
  }
}

/**
 * Fallback similarity search using JSON embeddings (for systems without pgvector)
 */
async function fallbackJsonSimilaritySearch(
  queryEmbedding: number[],
  topK: number
): Promise<KnowledgeContext[]> {
  try {
    // Fetch all chunks with JSON embeddings
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
      }
    });

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

    // Sort by similarity and return top K
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

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
