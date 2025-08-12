/**
 * NEW RAG SYSTEM - Efficient Vector Search with pgvector
 * 
 * This module provides optimized functions for retrieving relevant knowledge
 * from the KnowledgeChunk table using vector similarity search.
 */

import { prisma } from './prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface KnowledgeContext {
  content: string;
  knowledgeId: string;
  title: string;
  similarity: number;
  chunkIndex: number;
}

/**
 * NEW: Orchestrates a more robust, multi-layered retrieval process.
 * This ensures both specific intent documents AND foundational principles are retrieved.
 */
export async function fetchEnhancedKnowledgeContext(
  query: string,
  maxChunks: number,
  similarityThreshold: number,
  highRelevanceThreshold: number,
  strictMusclePriority: boolean = false,
  userId?: string
): Promise<KnowledgeContext[]> {
  console.log(`🚀 Enhanced multi-layered retrieval: "${query}"`);
  
  try {
    // --- Step 1: Foundational Principle Retrieval ---
    // Always retrieve core programming principles to ensure the AI never forgets the rules.
    console.log('📚 Fetching foundational programming principles...');
    
    const corePrinciples = await prisma.knowledgeItem.findMany({
      where: {
        category: 'Programming Principles',
        status: 'READY',
        ...(userId && { userId })
      },
      include: {
        chunks: {
          where: {
            embeddingData: {
              not: null
            }
          },
          take: 2 // Take top 2 chunks per principle document
        }
      },
      take: 5 // Limit to the top 5 most important principle documents
    });

    const principleContexts: KnowledgeContext[] = [];
    for (const doc of corePrinciples) {
      for (const chunk of doc.chunks) {
        principleContexts.push({
          content: chunk.content,
          knowledgeId: doc.id,
          title: doc.title,
          similarity: 1.0, // Assign max similarity as these are considered mandatory
          chunkIndex: chunk.chunkIndex
        });
      }
    }

    console.log(`✅ Retrieved ${principleContexts.length} foundational principle chunks`);

    // --- Step 2: Specific Intent Retrieval (Vector Search) ---
    console.log('🎯 Performing vector search for specific intent...');
    const queryEmbedding = await getEmbedding(query);
    const intentContexts = await fetchRelevantKnowledge(
      queryEmbedding,
      maxChunks,
      highRelevanceThreshold
    );

    console.log(`✅ Retrieved ${intentContexts.length} intent-specific chunks`);

    // --- Step 3: Combine and De-duplicate ---
    // Combine principles and intent-based results, ensuring no duplicates by title + chunkIndex
    const combinedContexts = [...principleContexts, ...intentContexts];
    const uniqueContexts = Array.from(
      new Map(
        combinedContexts.map(item => [`${item.title}-${item.chunkIndex}`, item])
      ).values()
    );

    console.log(`✅ Combined contexts: ${combinedContexts.length} total, ${uniqueContexts.length} unique`);

    // Optional: Apply strict muscle priority filtering if enabled
    if (strictMusclePriority) {
      console.log('🎯 Applying strict muscle priority filtering...');
      // This could be enhanced with muscle-specific keywords detection
    }

    return uniqueContexts.slice(0, maxChunks + principleContexts.length); // Allow extra for principles
    
  } catch (error) {
    console.error('❌ Enhanced knowledge retrieval failed:', error);
    // Fallback to standard retrieval if enhanced fails
    console.log('🔄 Falling back to standard vector search...');
    const queryEmbedding = await getEmbedding(query);
    return await fetchRelevantKnowledge(queryEmbedding, maxChunks, highRelevanceThreshold);
  }
}

/**
 * Helper function to generate embeddings using Gemini
 */
async function getEmbedding(text: string): Promise<number[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error('Failed to generate embedding for query');
  }
}

/**
 * Efficient pgvector-based similarity search using raw SQL
 * PERFORMANCE: Searches all chunks in database without batch limits
 */
async function performOptimizedPgvectorSearch(
  queryEmbedding: number[], 
  topK: number, 
  threshold: number = 0.3,
  userId?: string
): Promise<KnowledgeContext[]> {
  console.log(`🔍 pgvector search: ${topK} chunks, threshold ${threshold}`);
  
  // Retry logic for database connection issues
  const maxRetries = 2;
  let retryCount = 0;
  
  while (retryCount <= maxRetries) {
    try {
      // Direct SQL query using pgvector for maximum efficiency  
      const embeddingStr = `[${queryEmbedding.join(',')}]`;
      
      const chunks = userId
        ? await prisma.$queryRaw`
            SELECT
              kc.content,
              ki.id as "knowledgeId", 
              ki.title,
              1 - (kc."embeddingData"::vector <=> ${embeddingStr}::vector) as similarity,
              kc."chunkIndex"
            FROM "KnowledgeChunk" kc
            JOIN "KnowledgeItem" ki ON kc."knowledgeItemId" = ki.id  
            WHERE ki.status = 'READY' 
              AND kc."embeddingData" IS NOT NULL
              AND ki."userId" = ${userId}
            ORDER BY kc."embeddingData"::vector <=> ${embeddingStr}::vector
            LIMIT ${topK}
          `
        : await prisma.$queryRaw`
            SELECT
              kc.content,
              ki.id as "knowledgeId", 
              ki.title,
              1 - (kc."embeddingData"::vector <=> ${embeddingStr}::vector) as similarity,
              kc."chunkIndex"
            FROM "KnowledgeChunk" kc
            JOIN "KnowledgeItem" ki ON kc."knowledgeItemId" = ki.id  
            WHERE ki.status = 'READY' 
              AND kc."embeddingData" IS NOT NULL
            ORDER BY kc."embeddingData"::vector <=> ${embeddingStr}::vector
            LIMIT ${topK}
          `;
      
      // Return topK results (sorted by similarity). Do NOT discard here — caller will
      // mark which ones are "high relevance". Filtering early can produce empty context.
      const results = (chunks as Array<{
        content: string;
        knowledgeId: string;
        title: string; 
        similarity: number;
        chunkIndex: number;
      }>);

      // Optional: count how many exceed the threshold for logging
      const countAbove = results.filter(r => r.similarity >= threshold).length;
      console.log(`✅ pgvector returned ${results.length}/${topK} chunks (${countAbove} >= threshold ${threshold})`);
      return results;
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorCode = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
      console.error(`❌ pgvector search error (attempt ${retryCount + 1}):`, errorMessage);
      
      // Check if it's a connection error that we should retry
      const isConnectionError = errorMessage?.includes('connection') || 
                                errorMessage?.includes('closed') ||
                                errorCode === 'P1017';
      
      if (isConnectionError && retryCount < maxRetries) {
        retryCount++;
        console.log(`🔄 Retrying pgvector search (attempt ${retryCount + 1})...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        continue;
      }
      
      // If not a retryable error or max retries exceeded, throw the error
      throw error;
    }
  }
  
  // This should never be reached due to the while loop structure
  throw new Error('Vector search failed after all retry attempts');
}

/**
 * Fetch relevant knowledge chunks using efficient vector similarity search
 * OPTIMIZED: Direct pgvector SQL for full-database search, no batch limits
 */
export async function fetchRelevantKnowledge(
  queryEmbedding: number[],
  topK: number,
  highRelevanceThreshold?: number
): Promise<KnowledgeContext[]> {
  console.log(`🚀 Starting optimized vector search for top ${topK} chunks`);
  
  try {
    // Use efficient pgvector SQL query - no fallback, no batch limits
    const threshold = highRelevanceThreshold || 0.3;
    const results = await performOptimizedPgvectorSearch(queryEmbedding, topK, threshold);
    console.log(`✅ Optimized pgvector search returned ${results.length} results`);
    return results;
  } catch (error) {
    console.error(`❌ Optimized pgvector search failed:`, error);
    // Only fallback for critical errors, not normal "no results" cases
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('pgvector') || errorMessage.includes('vector')) {
      console.log(`🔄 Using JSON fallback due to pgvector unavailability`);
      return await optimizedJsonSimilaritySearch(queryEmbedding, topK, highRelevanceThreshold);
    }
    throw error; // Re-throw other errors
  }
}

/**
 * AND-based keyword search for precise term matching
 * OPTIMIZED: Uses PostgreSQL full-text search with AND logic for specificity
 */
export async function performAndKeywordSearch(
  query: string,
  topK: number = 5,
  userId?: string
): Promise<KnowledgeContext[]> {
  console.log(`🔍 Intelligent keyword search: "${query}"`);
  
  try {
    const lowerQuery = query.toLowerCase();
    let searchTerms: string;
    
    // SMART MUSCLE GROUP DETECTION: Use flexible search for muscle-specific queries
    if (lowerQuery.includes('triceps') || (lowerQuery.includes('arms') && (lowerQuery.includes('isolation') || lowerQuery.includes('exercises') || lowerQuery.includes('train')))) {
      // Triceps/Arms-specific search with OR logic for broader coverage
      searchTerms = 'triceps | arms | biceps | isolation | "arm training" | biasing | heads';
      console.log(`💪 Arms/Triceps query detected - using flexible search: "${searchTerms}"`);
      
    } else if (lowerQuery.includes('biceps') || lowerQuery.includes('elbow flexors')) {
      // Biceps-specific search
      searchTerms = 'biceps | "elbow flexors" | brachialis | brachioradialis | arms | curl';
      console.log(`💪 Biceps query detected - using targeted search: "${searchTerms}"`);
      
    } else if (lowerQuery.includes('chest') || lowerQuery.includes('pectorals') || lowerQuery.includes('pec')) {
      // Chest-specific search
      searchTerms = 'chest | pectorals | pec | press | bench | fly | dip';
      console.log(`🫀 Chest query detected - using targeted search: "${searchTerms}"`);
      
    } else if (lowerQuery.includes('back') || lowerQuery.includes('lats') || lowerQuery.includes('latissimus')) {
      // Back-specific search
      searchTerms = 'back | lats | latissimus | dorsi | "back training" | pull | row';
      console.log(`🧗 Back query detected - using targeted search: "${searchTerms}"`);
      
    } else if (lowerQuery.includes('shoulders') || lowerQuery.includes('deltoids') || lowerQuery.includes('delts')) {
      // Shoulders-specific search
      searchTerms = 'shoulders | deltoids | delts | "shoulder training" | press | raise';
      console.log(`🫸 Shoulders query detected - using targeted search: "${searchTerms}"`);
      
    } else if (lowerQuery.includes('legs') || lowerQuery.includes('quads') || lowerQuery.includes('hamstrings') || lowerQuery.includes('glutes') || lowerQuery.includes('lower body')) {
      // Legs-specific search
      searchTerms = 'legs | quads | hamstrings | glutes | "lower body" | squat | deadlift | lunge';
      console.log(`🦵 Legs query detected - using targeted search: "${searchTerms}"`);
      
    } else if (lowerQuery.includes('upper') && lowerQuery.includes('lower')) {
      // Upper/Lower split queries
      searchTerms = '(upper | body) & (lower | body) & (workout | routine | structure | program)';
      console.log(`🎯 Upper/Lower split detected - using enhanced search: "${searchTerms}"`);
      
    } else if (lowerQuery.includes('full body') || lowerQuery.includes('full-body')) {
      // Full body queries
      searchTerms = '"full body" | "full-body" | complete | total | "whole body"';
      console.log(`🎯 Full body query detected - using targeted search: "${searchTerms}"`);
      
    } else if (lowerQuery.includes('program') || lowerQuery.includes('routine') || lowerQuery.includes('split')) {
      // Program/routine queries - use key content terms
      const contentTerms = [];
      if (lowerQuery.includes('beginner')) contentTerms.push('beginner');
      if (lowerQuery.includes('intermediate')) contentTerms.push('intermediate');
      if (lowerQuery.includes('advanced')) contentTerms.push('advanced');
      if (lowerQuery.includes('3') || lowerQuery.includes('three')) contentTerms.push('3');
      if (lowerQuery.includes('4') || lowerQuery.includes('four')) contentTerms.push('4');
      if (lowerQuery.includes('5') || lowerQuery.includes('five')) contentTerms.push('5');
      
      searchTerms = contentTerms.length > 0 
        ? `(program | routine | workout | split) & (${contentTerms.join(' | ')})`
        : 'program | routine | workout | split | structure';
      console.log(`📋 Program query detected - using targeted search: "${searchTerms}"`);
      
    } else {
      // Default approach: Remove stop words and use important terms only
      const stopWords = ['what', 'are', 'the', 'best', 'how', 'to', 'for', 'is', 'and', 'or', 'a', 'an'];
      const terms = lowerQuery
        .replace(/[^\w\s]/g, ' ')
        .split(' ')
        .filter(term => term.length > 2 && !stopWords.includes(term));
      
      if (terms.length === 0) {
        console.log(`⚠️ No meaningful search terms found in: "${query}"`);
        return [];
      }
      
      // Use OR logic for better coverage when we have few meaningful terms
      searchTerms = terms.length <= 2 ? terms.join(' | ') : terms.join(' & ');
      console.log(`🎯 General search (${terms.length} terms): "${searchTerms}"`);
    }
    
    if (!searchTerms) {
      console.log(`⚠️ No valid search terms extracted from: "${query}"`);
      return [];
    }
    
    console.log(`🎯 Final search terms: "${searchTerms}"`);
    
    // Use PostgreSQL to_tsvector and to_tsquery for full-text search
    const chunks = userId 
      ? await prisma.$queryRaw`
          SELECT 
            kc.content,
            kc."chunkIndex",
            ki.id as "knowledgeId",
            ki.title,
            ts_rank(to_tsvector('english', kc.content), to_tsquery('english', ${searchTerms})) as similarity
          FROM "KnowledgeChunk" kc
          JOIN "KnowledgeItem" ki ON kc."knowledgeItemId" = ki.id
          WHERE ki.status = 'READY'
            AND to_tsvector('english', kc.content) @@ to_tsquery('english', ${searchTerms})
            AND ki."userId" = ${userId}
          ORDER BY similarity DESC
          LIMIT ${topK}
        `
      : await prisma.$queryRaw`
          SELECT 
            kc.content,
            kc."chunkIndex",
            ki.id as "knowledgeId",
            ki.title,
            ts_rank(to_tsvector('english', kc.content), to_tsquery('english', ${searchTerms})) as similarity
          FROM "KnowledgeChunk" kc
          JOIN "KnowledgeItem" ki ON kc."knowledgeItemId" = ki.id
          WHERE ki.status = 'READY'
            AND to_tsvector('english', kc.content) @@ to_tsquery('english', ${searchTerms})
          ORDER BY similarity DESC
          LIMIT ${topK}
        `;
    
    const results = (chunks as Array<{
      content: string;
      knowledgeId: string; 
      title: string;
      chunkIndex: number;
      similarity: number;
    }>).map(chunk => ({
      content: chunk.content,
      knowledgeId: chunk.knowledgeId,
      title: chunk.title,
      similarity: Math.min(chunk.similarity, 1.0), // Normalize to 0-1 range
      chunkIndex: chunk.chunkIndex
    }));
    
    console.log(`✅ AND keyword search returned ${results.length} results`);
    return results;
    
  } catch (error) {
    console.error('❌ AND keyword search error:', error);
    return [];
  }
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

    // Keep all chunks - mark high relevance for logging only, don't filter out useful chunks
    const candidateChunks = sortedSimilarities;
    let highRelevanceCount = 0;
    if (highRelevanceThreshold !== undefined) {
      highRelevanceCount = sortedSimilarities.filter(
        chunk => chunk.similarity >= highRelevanceThreshold
      ).length;
      
      console.log(`🔍 High relevance marking: ${sortedSimilarities.length} total → ${highRelevanceCount} above threshold ${highRelevanceThreshold}`);
    }

    if (candidateChunks.length === 0) {
      console.log('⚠️ No chunks available');
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
