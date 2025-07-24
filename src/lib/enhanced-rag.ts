/**
 * Enhanced RAG System - Hybrid Search Implementation
 * 
 * This module implements a sophisticated retrieval system combining:
 * 1. Vector (semantic) search
 * 2. Keyword (BM25-style) search  
 * 3. Re-ranking with cross-encoder
 * 4. Query transformation with conversation history
 */

import { prisma } from './prisma';
import { generateEmbedding } from './vector-embeddings';
import { generateSubQueries } from './query-generator';

export interface EnhancedKnowledgeContext {
  content: string;
  knowledgeId: string;
  title: string;
  similarity: number;
  chunkIndex: number;
  keywordScore?: number;
  hybridScore?: number;
  source: 'vector' | 'keyword' | 'hybrid';
}

export interface SearchOptions {
  maxChunks: number;
  similarityThreshold: number;
  highRelevanceThreshold: number;
  useHybridSearch?: boolean;
  useReranking?: boolean;
  conversationHistory?: Array<{ role: string; content: string }>;
}

/**
 * Enhanced retrieval with hybrid search combining semantic and keyword matching
 */
export async function enhancedKnowledgeRetrieval(
  userQuery: string,
  options: SearchOptions,
  userId?: string
): Promise<EnhancedKnowledgeContext[]> {
  
  console.log('🚀 Starting Enhanced RAG Retrieval');
  console.log(`📝 Query: "${userQuery}"`);
  console.log(`⚙️ Options:`, options);
  
  const startTime = Date.now();
  
  try {
    // Step 1: Query Enhancement with Conversation History
    const enhancedQuery = await enhanceQueryWithHistory(userQuery, options.conversationHistory);
    console.log(`🔍 Enhanced query: "${enhancedQuery}"`);
    
    // Step 2: Multi-Query Generation (if beneficial)
    const queries = await generateSearchQueries(enhancedQuery);
    console.log(`📚 Generated ${queries.length} search queries`);
    
    // Step 3: Hybrid Search - Get candidates from both vector and keyword search
    const candidates = await performHybridSearch(queries, options);
    console.log(`📊 Retrieved ${candidates.length} hybrid candidates`);
    
    // Step 4: Re-ranking (if enabled)
    let finalResults = candidates;
    if (options.useReranking && candidates.length > options.maxChunks) {
      finalResults = await reRankCandidates(enhancedQuery, candidates, options.maxChunks);
      console.log(`🎯 Re-ranked to ${finalResults.length} final results`);
    } else {
      finalResults = candidates.slice(0, options.maxChunks);
    }
    
    // Step 5: Source Diversification (existing logic)
    const diversifiedResults = diversifyResults(finalResults, options.maxChunks);
    
    const totalTime = Date.now() - startTime;
    console.log(`✅ Enhanced RAG completed in ${totalTime}ms`);
    
    // Log performance metrics
    logRetrievalMetrics(diversifiedResults, totalTime);
    
    return diversifiedResults;
    
  } catch (error) {
    console.error('❌ Enhanced RAG error:', error);
    // Fallback to existing system
    return [];
  }
}

/**
 * Enhance user query with conversation history for better context
 */
async function enhanceQueryWithHistory(
  userQuery: string, 
  conversationHistory?: Array<{ role: string; content: string }>
): Promise<string> {
  
  if (!conversationHistory || conversationHistory.length < 2) {
    return userQuery;
  }
  
  // Get last 2 exchanges for context
  const recentHistory = conversationHistory.slice(-4); // Last 2 user-assistant pairs
  
  // Check if query needs context (contains pronouns, follow-up words)
  const needsContext = /\b(it|they|that|this|these|those|how many|which|what about)\b/i.test(userQuery);
  
  if (!needsContext) {
    return userQuery;
  }
  
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash-latest',
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 200,
      }
    });
    
    const contextPrompt = `
Based on this conversation history and the user's latest question, create a standalone, complete query that includes all necessary context.

Conversation History:
${recentHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

User's Latest Question: "${userQuery}"

Create a complete, standalone search query that captures what the user is really asking about. Include specific muscle groups, exercises, or concepts mentioned in the conversation.

Return only the enhanced query, no explanation.`;

    const result = await model.generateContent(contextPrompt);
    const enhancedQuery = result.response.text().trim();
    
    console.log(`🔄 Query enhanced with conversation context`);
    return enhancedQuery;
    
  } catch (error) {
    console.warn('Failed to enhance query with history:', error);
    return userQuery;
  }
}

/**
 * Generate optimized search queries (combination of original and sub-queries)
 */
async function generateSearchQueries(query: string): Promise<string[]> {
  // Use existing multi-query system
  const subQueries = await generateSubQueries(query);
  
  // Add fitness-specific expansions
  const fitnessExpansions = generateFitnessExpansions(query);
  
  // Combine and deduplicate
  const allQueries = [...new Set([query, ...subQueries, ...fitnessExpansions])];
  
  return allQueries.slice(0, 6); // Limit to 6 queries max
}

/**
 * Generate fitness-specific query expansions
 */
function generateFitnessExpansions(query: string): string[] {
  const expansions: string[] = [];
  const lowerQuery = query.toLowerCase();
  
  // Muscle group expansions
  const muscleMap: { [key: string]: string[] } = {
    'chest': ['pectoral anatomy', 'pectoralis major training', 'chest mechanical tension'],
    'back': ['latissimus dorsi', 'rhomboids training', 'back muscle anatomy'],
    'shoulders': ['deltoid training', 'shoulder anatomy', 'rotator cuff'],
    'arms': ['biceps training', 'triceps training', 'arm muscle growth'],
    'legs': ['quadriceps training', 'hamstring development', 'leg muscle anatomy']
  };
  
  // Exercise technique expansions
  if (lowerQuery.includes('exercise') || lowerQuery.includes('movement')) {
    expansions.push(query.replace(/exercise|movement/gi, 'technique biomechanics'));
  }
  
  // Training concept expansions
  if (lowerQuery.includes('growth') || lowerQuery.includes('hypertrophy')) {
    expansions.push(query + ' mechanical tension');
    expansions.push(query.replace(/growth|hypertrophy/gi, 'volume frequency'));
  }
  
  // Apply muscle expansions
  Object.entries(muscleMap).forEach(([muscle, terms]) => {
    if (lowerQuery.includes(muscle)) {
      terms.forEach(term => {
        expansions.push(query.replace(new RegExp(muscle, 'gi'), term));
      });
    }
  });
  
  return expansions.slice(0, 3); // Limit expansions
}

/**
 * Perform hybrid search combining vector and keyword approaches
 */
async function performHybridSearch(
  queries: string[], 
  options: SearchOptions
): Promise<EnhancedKnowledgeContext[]> {
  
  const vectorResults: EnhancedKnowledgeContext[] = [];
  const keywordResults: EnhancedKnowledgeContext[] = [];
  
  // Run searches in parallel for each query
  await Promise.all(queries.map(async (query) => {
    try {
      // Vector search
      const vectorChunks = await performVectorSearch(query, options.maxChunks * 2);
      vectorResults.push(...vectorChunks.map(chunk => ({ ...chunk, source: 'vector' as const })));
      
      // Keyword search
      const keywordChunks = await performKeywordSearch(query, options.maxChunks);
      keywordResults.push(...keywordChunks.map(chunk => ({ ...chunk, source: 'keyword' as const })));
      
    } catch (error) {
      console.warn(`Search failed for query "${query}":`, error);
    }
  }));
  
  // Combine and calculate hybrid scores
  const combinedResults = combineSearchResults(vectorResults, keywordResults);
  
  // Filter by thresholds
  return combinedResults.filter(result => 
    result.similarity >= options.similarityThreshold ||
    (result.keywordScore && result.keywordScore > 0.3)
  );
}

/**
 * Vector search using existing system
 */
async function performVectorSearch(query: string, limit: number): Promise<EnhancedKnowledgeContext[]> {
  try {
    const queryEmbedding = await generateEmbedding(query);
    
    // Use existing fallback search from vector-search.ts
    const { fallbackJsonSimilaritySearch } = require('./vector-search');
    const results = await fallbackJsonSimilaritySearch(
      queryEmbedding.embedding,
      limit,
      0.3 // Lower threshold for candidates
    );
    
    return results.map((result: any) => ({
      ...result,
      source: 'vector' as const
    }));
    
  } catch (error) {
    console.error('Vector search error:', error);
    return [];
  }
}

/**
 * Keyword search using PostgreSQL full-text search
 */
async function performKeywordSearch(query: string, limit: number): Promise<EnhancedKnowledgeContext[]> {
  try {
    // Clean and prepare search terms
    const searchTerms = query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(' ')
      .filter(term => term.length > 2)
      .join(' | '); // PostgreSQL OR syntax
    
    if (!searchTerms) return [];
    
    // Use PostgreSQL to_tsvector and to_tsquery for full-text search
    const chunks = await prisma.$queryRaw`
      SELECT 
        kc.content,
        kc."chunkIndex",
        ki.id as "knowledgeId",
        ki.title,
        ts_rank(to_tsvector('english', kc.content), to_tsquery('english', ${searchTerms})) as keyword_score
      FROM "KnowledgeChunk" kc
      JOIN "KnowledgeItem" ki ON kc."knowledgeItemId" = ki.id
      WHERE ki.status = 'READY'
        AND to_tsvector('english', kc.content) @@ to_tsquery('english', ${searchTerms})
      ORDER BY keyword_score DESC
      LIMIT ${limit}
    `;
    
    return (chunks as any[]).map(chunk => ({
      content: chunk.content,
      knowledgeId: chunk.knowledgeId,
      title: chunk.title,
      similarity: 0, // No vector similarity for keyword search
      chunkIndex: chunk.chunkIndex,
      keywordScore: parseFloat(chunk.keyword_score),
      source: 'keyword' as const
    }));
    
  } catch (error) {
    console.error('Keyword search error:', error);
    return [];
  }
}

/**
 * Combine vector and keyword search results with hybrid scoring
 */
function combineSearchResults(
  vectorResults: EnhancedKnowledgeContext[],
  keywordResults: EnhancedKnowledgeContext[]
): EnhancedKnowledgeContext[] {
  
  const combinedMap = new Map<string, EnhancedKnowledgeContext>();
  
  // Add vector results
  vectorResults.forEach(result => {
    const key = `${result.knowledgeId}-${result.chunkIndex}`;
    combinedMap.set(key, result);
  });
  
  // Merge keyword results
  keywordResults.forEach(result => {
    const key = `${result.knowledgeId}-${result.chunkIndex}`;
    const existing = combinedMap.get(key);
    
    if (existing) {
      // Combine scores for hybrid ranking
      existing.keywordScore = result.keywordScore;
      existing.hybridScore = (existing.similarity * 0.7) + ((result.keywordScore || 0) * 0.3);
      existing.source = 'hybrid';
    } else {
      combinedMap.set(key, result);
    }
  });
  
  // Sort by hybrid score (if available) or similarity
  return Array.from(combinedMap.values()).sort((a, b) => {
    const scoreA = a.hybridScore || a.similarity;
    const scoreB = b.hybridScore || b.similarity;
    return scoreB - scoreA;
  });
}

/**
 * Re-rank candidates using a more sophisticated model (placeholder for cross-encoder)
 */
async function reRankCandidates(
  query: string,
  candidates: EnhancedKnowledgeContext[],
  maxResults: number
): Promise<EnhancedKnowledgeContext[]> {
  
  // For now, use a simple heuristic-based re-ranking
  // In the future, this could be replaced with a cross-encoder model
  
  const reRanked = candidates.map(candidate => {
    let reRankScore = candidate.hybridScore || candidate.similarity;
    
    // Boost score for fitness-specific terms
    const fitnessBoost = calculateFitnessRelevanceBoost(query, candidate.content);
    reRankScore += fitnessBoost;
    
    // Boost score for recent/high-quality sources
    const qualityBoost = calculateQualityBoost(candidate);
    reRankScore += qualityBoost;
    
    return {
      ...candidate,
      hybridScore: reRankScore
    };
  });
  
  return reRanked
    .sort((a, b) => (b.hybridScore || 0) - (a.hybridScore || 0))
    .slice(0, maxResults);
}

/**
 * Calculate fitness-specific relevance boost
 */
function calculateFitnessRelevanceBoost(query: string, content: string): number {
  const queryLower = query.toLowerCase();
  const contentLower = content.toLowerCase();
  
  let boost = 0;
  
  // Boost for exact muscle group matches
  const muscleGroups = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'glutes'];
  muscleGroups.forEach(muscle => {
    if (queryLower.includes(muscle) && contentLower.includes(muscle)) {
      boost += 0.1;
    }
  });
  
  // Boost for exercise technique terms
  const techniqueTerms = ['form', 'technique', 'range of motion', 'tempo', 'biomechanics'];
  techniqueTerms.forEach(term => {
    if (queryLower.includes(term) && contentLower.includes(term)) {
      boost += 0.05;
    }
  });
  
  // Boost for training concepts
  const trainingConcepts = ['volume', 'frequency', 'intensity', 'progressive overload', 'RIR'];
  trainingConcepts.forEach(concept => {
    if (queryLower.includes(concept) && contentLower.includes(concept)) {
      boost += 0.08;
    }
  });
  
  return Math.min(boost, 0.3); // Cap the boost
}

/**
 * Calculate quality boost based on source characteristics
 */
function calculateQualityBoost(candidate: EnhancedKnowledgeContext): number {
  let boost = 0;
  
  // Boost for comprehensive guides
  if (candidate.title.toLowerCase().includes('guide')) {
    boost += 0.05;
  }
  
  // Boost for specific muscle training documents
  if (candidate.title.toLowerCase().includes('training')) {
    boost += 0.03;
  }
  
  // Boost for chunks that appear early in documents (likely more important)
  if (candidate.chunkIndex < 3) {
    boost += 0.02;
  }
  
  return boost;
}

/**
 * Diversify results to ensure variety from different sources
 */
function diversifyResults(
  candidates: EnhancedKnowledgeContext[], 
  maxResults: number
): EnhancedKnowledgeContext[] {
  
  // Use existing diversification logic from vector-search.ts
  const diversified: EnhancedKnowledgeContext[] = [];
  const sourceChunks = new Map<string, EnhancedKnowledgeContext[]>();
  
  // Group by source
  candidates.forEach(candidate => {
    if (!sourceChunks.has(candidate.knowledgeId)) {
      sourceChunks.set(candidate.knowledgeId, []);
    }
    sourceChunks.get(candidate.knowledgeId)!.push(candidate);
  });
  
  // Round-robin selection
  const sources = Array.from(sourceChunks.entries())
    .sort(([, a], [, b]) => (b[0].hybridScore || b[0].similarity) - (a[0].hybridScore || a[0].similarity));
  
  let sourceIndex = 0;
  const sourceIndices = new Map<string, number>();
  
  while (diversified.length < maxResults && sources.length > 0) {
    let added = false;
    
    for (const [sourceId, chunks] of sources) {
      if (diversified.length >= maxResults) break;
      
      const chunkIndex = sourceIndices.get(sourceId) || 0;
      if (chunkIndex < chunks.length) {
        const chunk = chunks[chunkIndex];
        if (!diversified.some(d => d.content === chunk.content)) {
          diversified.push(chunk);
          added = true;
        }
        sourceIndices.set(sourceId, chunkIndex + 1);
      }
    }
    
    if (!added) break;
  }
  
  return diversified;
}

/**
 * Log retrieval performance metrics
 */
function logRetrievalMetrics(results: EnhancedKnowledgeContext[], timeMs: number): void {
  const sourceDistribution = results.reduce((dist, result) => {
    dist[result.title] = (dist[result.title] || 0) + 1;
    return dist;
  }, {} as Record<string, number>);
  
  const searchTypes = results.reduce((types, result) => {
    types[result.source] = (types[result.source] || 0) + 1;
    return types;
  }, {} as Record<string, number>);
  
  console.log('📊 Enhanced RAG Metrics:');
  console.log(`   ⏱️  Total time: ${timeMs}ms`);
  console.log(`   📄 Results: ${results.length}`);
  console.log(`   🔍 Search types:`, searchTypes);
  console.log(`   📚 Source distribution:`, sourceDistribution);
  console.log(`   🎯 Avg similarity: ${(results.reduce((sum, r) => sum + r.similarity, 0) / results.length).toFixed(3)}`);
}

export default enhancedKnowledgeRetrieval;
