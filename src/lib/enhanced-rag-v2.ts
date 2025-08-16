/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { prisma } from './prisma';
import { generateEmbedding } from './vector-embeddings';

export interface EnhancedKnowledgeContext {
  content: string;
  knowledgeId: string;
  title: string;
  similarity: number;
  chunkIndex: number;
  keywordScore?: number;
  hybridScore?: number;
  source: 'vector' | 'keyword' | 'hybrid';
  isHighRelevance: boolean;
  muscleGroup?: string;
}

export interface SearchOptions {
  maxChunks: number;
  similarityThreshold: number;
  highRelevanceThreshold: number;
  useHybridSearch?: boolean;
  useReranking?: boolean;
  conversationHistory?: Array<{ role: string; content: string }>;
  strictMusclePriority?: boolean;
}

/**
 * FIXED: Enhanced RAG with better muscle-specific search and stricter filtering
 */
export async function enhancedKnowledgeRetrieval(
  userQuery: string,
  options: SearchOptions
): Promise<EnhancedKnowledgeContext[]> {
  
  console.log('🚀 Starting Enhanced RAG Retrieval v2');
  console.log(`📝 Query: "${userQuery}"`);
  console.log(`⚙️ Options:`, options);
  
  const startTime = Date.now();
  
  try {
    // Step 1: Extract muscle groups and training concepts from query
    const queryContext = await analyzeQueryContext(userQuery);
    console.log('🔍 Query context:', queryContext);
    
    // Step 2: Generate multiple search strategies
    const searchQueries = await generateComprehensiveSearchQueries(userQuery, queryContext);
    console.log(`📚 Generated ${searchQueries.length} search queries`);
    
    // Step 3: Execute multi-strategy search with muscle prioritization
    const candidates = await executeMultiStrategySearch(searchQueries, options, queryContext);
    console.log(`📊 Retrieved ${candidates.length} candidates`);
    
    // Step 4: Apply strict filtering and ranking
    const filteredResults = await applyStrictFiltering(candidates, options, queryContext);
    console.log(`🎯 Filtered to ${filteredResults.length} high-quality results`);
    
    // Step 5: Ensure mandatory content is included
    const finalResults = await ensureMandatoryContent(filteredResults, queryContext, options);
    
    const totalTime = Date.now() - startTime;
    console.log(`✅ Enhanced RAG v2 completed in ${totalTime}ms`);
    
    logDetailedMetrics(finalResults, totalTime, queryContext);
    
    return finalResults;
    
  } catch (error) {
    console.error('❌ Enhanced RAG v2 error:', error);
    return [];
  }
}

/**
 * FIXED: Better query analysis to understand training context
 */
async function analyzeQueryContext(query: string): Promise<{
  muscleGroups: string[];
  trainingConcepts: string[];
  isWorkoutRequest: boolean;
  isProgramRequest: boolean;
  isNutritionRequest: boolean;
  exerciseKeywords: string[];
  relevantCategories: string[];
}> {
  const lowerQuery = query.toLowerCase();
  
  // Enhanced muscle group detection
  const muscleGroups: string[] = [];
  const musclePatterns = {
    'chest': ['chest', 'pectoral', 'pec', 'bench'],
    'back': ['back', 'lat', 'latissimus', 'rhomboid', 'trapezius', 'trap', 'pull'],
    'shoulders': ['shoulder', 'deltoid', 'delt', 'overhead', 'press'],
    'biceps': ['bicep', 'biceps', 'curl'],
    'triceps': ['tricep', 'triceps', 'extension'],
    'legs': ['leg', 'quad', 'quadricep', 'hamstring', 'calf', 'squat'],
    'glutes': ['glute', 'glutes', 'hip thrust'],
    'core': ['core', 'abs', 'abdominal']
  };
  
  Object.entries(musclePatterns).forEach(([muscle, patterns]) => {
    if (patterns.some(pattern => lowerQuery.includes(pattern))) {
      muscleGroups.push(muscle);
    }
  });
  
  // Training concept detection
  const trainingConcepts: string[] = [];
  const conceptPatterns = {
    'hypertrophy': ['hypertrophy', 'muscle growth', 'build muscle', 'mass'],
    'strength': ['strength', 'power', '1rm', 'max'],
    'volume': ['volume', 'sets', 'reps'],
    'frequency': ['frequency', 'times per week', 'how often'],
    'progressive_overload': ['progressive overload', 'progression', 'increase'],
    'rep_ranges': ['rep range', 'reps', 'repetitions'],
    'rest_periods': ['rest', 'recovery', 'between sets'],
    'technique': ['form', 'technique', 'execution', 'biomechanics']
  };
  
  Object.entries(conceptPatterns).forEach(([concept, patterns]) => {
    if (patterns.some(pattern => lowerQuery.includes(pattern))) {
      trainingConcepts.push(concept);
    }
  });
  
  // Exercise keyword extraction
  const exerciseKeywords = extractExerciseKeywords(lowerQuery);
  
  // Determine relevant categories based on context
  const relevantCategories: string[] = [];
  
  // CRITICAL: For ANY workout/program request, ALWAYS prioritize hypertrophy categories FIRST
  if (/workout|program|routine|split|plan|exercise|training|hypertrophy|muscle|build|mass|rep|set|rest/.test(lowerQuery)) {
    relevantCategories.push('hypertrophy_programs', 'hypertrophy_principles');
  }
  
  // Add muscle-specific categories
  muscleGroups.forEach(muscle => {
    relevantCategories.push(muscle);
    relevantCategories.push(`${muscle}_exercises`);
  });
  
  // Add training type categories for additional context
  if (/program|plan|routine|split/.test(lowerQuery)) {
    relevantCategories.push('training_programs');
  }
  
  // Always include myths category to check for misconceptions (but after priority categories)
  relevantCategories.push('myths');
  
  // CRITICAL: For rest period queries, ensure we get the specific rest period guide
  if (/rest|recovery|between sets|minute|second/.test(lowerQuery)) {
    // Force inclusion of specific rest period content
    relevantCategories.unshift('hypertrophy_programs', 'hypertrophy_principles');
  }
  
  // Add exercise categories based on movement patterns
  if (/push|press|bench/.test(lowerQuery)) {
    relevantCategories.push('pushing_movements');
  }
  if (/pull|row|lat/.test(lowerQuery)) {
    relevantCategories.push('pulling_movements');
  }
  
  return {
    muscleGroups,
    trainingConcepts,
    isWorkoutRequest: /workout|program|routine|split|plan/.test(lowerQuery),
    isProgramRequest: /program|plan|routine|split/.test(lowerQuery),
    isNutritionRequest: /nutrition|diet|food|protein|calories/.test(lowerQuery),
    exerciseKeywords,
    relevantCategories: [...new Set(relevantCategories)] // Remove duplicates
  };
}

/**
 * FIXED: Extract specific exercise keywords for better matching
 */
function extractExerciseKeywords(query: string): string[] {
  const exercisePatterns = [
    'squat', 'deadlift', 'bench press', 'row', 'pullup', 'chin up',
    'curl', 'extension', 'press', 'fly', 'raise', 'thrust',
    'lunge', 'dip', 'pushup', 'plank'
  ];
  
  return exercisePatterns.filter(exercise => query.includes(exercise));
}

/**
 * FIXED: Generate more comprehensive and specific search queries
 */
async function generateComprehensiveSearchQueries(
  originalQuery: string,
  context: { 
    muscleGroups: string[]; 
    trainingConcepts: string[]; 
    exerciseKeywords: string[];
    isWorkoutRequest: boolean;
    isProgramRequest: boolean;
    isNutritionRequest: boolean;
    relevantCategories: string[];
  }
): Promise<string[]> {
  
  const queries = [originalQuery];
  
  // Add muscle-specific queries
  context.muscleGroups.forEach(muscle => {
    queries.push(`${muscle} training hypertrophy`);
    queries.push(`${muscle} exercises muscle growth`);
    queries.push(`${muscle} workout programming`);
  });
  
  // Add concept-specific queries
  context.trainingConcepts.forEach(concept => {
    queries.push(`${concept} muscle hypertrophy`);
    queries.push(`${originalQuery} ${concept}`);
  });
  
  // Add exercise-specific queries
  context.exerciseKeywords.forEach(exercise => {
    queries.push(`${exercise} technique form`);
    queries.push(`${exercise} hypertrophy sets reps`);
  });
  
  // Add mandatory training principle queries
  if (context.isWorkoutRequest) {
    queries.push('workout programming principles');
    queries.push('hypertrophy training guidelines');
    queries.push('muscle building rep ranges');
    queries.push('training volume frequency');
  }
  
  // Remove duplicates and limit
  return [...new Set(queries)].slice(0, 8);
}

/**
 * FIXED: Execute multiple search strategies with better prioritization
 */
async function executeMultiStrategySearch(
  queries: string[],
  options: SearchOptions,
  context: any
): Promise<EnhancedKnowledgeContext[]> {
  
  const allCandidates: EnhancedKnowledgeContext[] = [];
  
  // NEW: PRIORITY 0 - Specialized search for specific training parameters to prevent hallucination
  const specializedResults = await searchSpecificTrainingParameters(queries[0], context);
  if (specializedResults.length > 0) {
    allCandidates.push(...specializedResults);
    console.log(`✓ Added ${specializedResults.length} specialized training parameter results`);
  }
  
  // CRITICAL: Priority-based search - Hypertrophy categories FIRST
  if (context.isWorkoutRequest || context.isProgramRequest) {
    const priorityCategories = ['hypertrophy_programs', 'hypertrophy_principles'];
    
    // Strategy 1: PRIORITY search in hypertrophy categories
    await Promise.all(queries.map(async (query) => {
      const priorityResults = await performEnhancedVectorSearch(
        query, 
        Math.ceil(options.maxChunks * 0.7), // 70% of results from priority categories
        priorityCategories
      );
      // Mark as high priority
      priorityResults.forEach(result => {
        result.isHighRelevance = true;
        result.source = 'priority' as any;
      });
      allCandidates.push(...priorityResults);
    }));
    
    // Only search other categories if we don't have enough results
    if (allCandidates.length < options.maxChunks * 0.5) {
      // Strategy 2: Muscle-specific search with remaining categories
      const remainingCategories = context.relevantCategories.filter(
        (cat: string) => !priorityCategories.includes(cat)
      );
      
      if (remainingCategories.length > 0) {
        await Promise.all(queries.map(async (query) => {
          const muscleResults = await performEnhancedVectorSearch(
            query, 
            Math.ceil(options.maxChunks * 0.3), // 30% from other categories
            remainingCategories
          );
          allCandidates.push(...muscleResults);
        }));
      }
    }
  } else {
    // For non-workout queries, use standard category-filtered search
    await Promise.all(queries.map(async (query) => {
      const vectorResults = await performEnhancedVectorSearch(
        query, 
        options.maxChunks * 2,
        context.relevantCategories.length > 0 ? context.relevantCategories : undefined
      );
      allCandidates.push(...vectorResults);
    }));
  }
  
  // Strategy 3: Muscle-specific prioritized search (for targeting specific muscles)
  if (context.muscleGroups.length > 0 && options.strictMusclePriority) {
    for (const muscle of context.muscleGroups) {
      const muscleResults = await performMuscleSpecificSearch(muscle, options);
      allCandidates.push(...muscleResults);
    }
  }
  
  // Strategy 4: Keyword search with AND logic (only if we need more results)
  if (allCandidates.length < options.maxChunks) {
    await Promise.all(queries.map(async (query) => {
      const keywordResults = await performStrictKeywordSearch(query, options.maxChunks);
      allCandidates.push(...keywordResults);
    }));
  }
  
  // Strategy 5: Title-based search for guides
  if (context.isWorkoutRequest) {
    const guideResults = await searchTrainingGuides(context);
    allCandidates.push(...guideResults);
  }
  
  return deduplicateAndRank(allCandidates, options);
}

/**
 * NEW: Muscle-specific search with higher priority
 */
async function performMuscleSpecificSearch(
  muscle: string, 
  options: SearchOptions
): Promise<EnhancedKnowledgeContext[]> {
  
  try {
    // Search in titles first (guides are usually titled well)
    const titleResults = await prisma.$queryRaw`
      SELECT 
        kc.content,
        kc."chunkIndex",
        ki.id as "knowledgeId",
        ki.title,
        0.9 as similarity
      FROM "KnowledgeChunk" kc
      JOIN "KnowledgeItem" ki ON kc."knowledgeItemId" = ki.id
      WHERE ki.status = 'READY'
        AND LOWER(ki.title) LIKE ${'%' + muscle.toLowerCase() + '%'}
      ORDER BY kc."chunkIndex" ASC
      LIMIT ${options.maxChunks}
    `;
    
    return (titleResults as any[]).map(chunk => ({
      content: chunk.content,
      knowledgeId: chunk.knowledgeId,
      title: chunk.title,
      similarity: chunk.similarity,
      chunkIndex: chunk.chunkIndex,
      source: 'hybrid' as const,
      isHighRelevance: true,
      muscleGroup: muscle
    }));
    
  } catch (error) {
    console.error('Muscle-specific search error:', error);
    return [];
  }
}

/**
 * Convert category names to category IDs for database queries
 */
async function getCategoryIdsByNames(categoryNames: string[]): Promise<string[]> {
  try {
    const categories = await prisma.knowledgeCategory.findMany({
      where: {
        name: {
          in: categoryNames
        }
      },
      select: { id: true, name: true }
    });
    
    const foundIds = categories.map(cat => cat.id);
    const foundNames = categories.map(cat => cat.name);
    const notFound = categoryNames.filter(name => !foundNames.includes(name));
    
    if (notFound.length > 0) {
      console.log(`Warning: Categories not found: ${notFound.join(', ')}`);
    }
    
    return foundIds;
  } catch (error) {
    console.error('Error mapping category names to IDs:', error);
    return [];
  }
}

/**
 * Enhanced category mapping with fallbacks for missing categories
 */
function mapCategoryNamesWithFallbacks(categoryNames: string[]): string[] {
  const mappings: Record<string, string[]> = {
    // Direct mappings for existing categories
    'hypertrophy_programs': ['hypertrophy_programs'],
    'hypertrophy_principles': ['hypertrophy_principles'], 
    'chest': ['chest'],
    'back': ['back'],
    'shoulders': ['shoulders'],
    'legs': ['legs'],
    'myths': ['myths'],
    
    // Fallback mappings for missing categories
    'arms': ['elbow_flexors', 'triceps'],
    'chest_exercises': ['chest'],
    'back_exercises': ['back'],
    'pushing_movements': ['chest', 'shoulders', 'triceps'],
    'pulling_movements': ['back', 'elbow_flexors']
  };
  
  const result: string[] = [];
  for (const categoryName of categoryNames) {
    const mapped = mappings[categoryName];
    if (mapped) {
      result.push(...mapped);
    } else {
      // Try direct mapping if no fallback exists
      result.push(categoryName);
    }
  }
  
  return [...new Set(result)]; // Remove duplicates
}

/**
 * FIXED: Enhanced vector search with proper category mapping and SQL fix
 */
async function performEnhancedVectorSearch(
  query: string, 
  limit: number,
  categoryNames?: string[]
): Promise<EnhancedKnowledgeContext[]> {
  
  try {
    const queryEmbedding = await generateEmbedding(query);
    const embeddingStr = `[${queryEmbedding.embedding.join(',')}]`;
    
    let chunks;
    
    if (categoryNames && categoryNames.length > 0) {
      // Map category names to IDs with fallbacks
      const mappedCategoryNames = mapCategoryNamesWithFallbacks(categoryNames);
      const categoryIds = await getCategoryIdsByNames(mappedCategoryNames);
      
      if (categoryIds.length > 0) {
        // Search with category filtering - FIXED SQL query
        chunks = await prisma.$queryRaw`
          SELECT 
            kc.id,
            kc.content,
            kc."chunkIndex",
            ki.id as "knowledgeId",
            ki.title,
            (1 - (kc."embeddingData"::vector <=> ${embeddingStr}::vector)) as score
          FROM "KnowledgeChunk" kc
          JOIN "KnowledgeItem" ki ON kc."knowledgeItemId" = ki.id  
          JOIN "KnowledgeItemCategory" kic ON ki.id = kic."knowledgeItemId"
          WHERE ki.status = 'READY' 
            AND kc."embeddingData" IS NOT NULL
            AND kic."knowledgeCategoryId" = ANY(${categoryIds})
          ORDER BY (kc."embeddingData"::vector <=> ${embeddingStr}::vector)
          LIMIT ${limit}
        `;
      } else {
        // Fallback to unfiltered search if no valid categories found
        chunks = await performUnfilteredVectorSearch(query, limit, embeddingStr);
      }
    } else {
      // Original search without category filtering
      chunks = await performUnfilteredVectorSearch(query, limit, embeddingStr);
    }

    return (chunks as any[]).map(chunk => ({
      content: chunk.content,
      knowledgeId: chunk.knowledgeId,
      title: chunk.title,
      similarity: chunk.score,
      chunkIndex: chunk.chunkIndex,
      source: 'vector' as const,
      isHighRelevance: chunk.score >= 0.8
    }));
    
  } catch (error) {
    console.error('Enhanced vector search error:', error);
    return [];
  }
}

/**
 * NEW: Specialized search for specific training parameters to prevent hallucination
 */
async function searchSpecificTrainingParameters(
  query: string, 
  context: any
): Promise<EnhancedKnowledgeContext[]> {
  try {
    const lowerQuery = query.toLowerCase();
    const results: EnhancedKnowledgeContext[] = [];
    
    // Search for rest period information specifically
    if (/rest|recovery|between sets|minute|second/.test(lowerQuery)) {
      const restPeriodResults = await prisma.$queryRaw`
        SELECT 
          kc.id,
          kc.content,
          kc."chunkIndex",
          ki.id as "knowledgeId",
          ki.title,
          0.95 as score
        FROM "KnowledgeChunk" kc
        JOIN "KnowledgeItem" ki ON kc."knowledgeItemId" = ki.id  
        JOIN "KnowledgeItemCategory" kic ON ki.id = kic."knowledgeItemId"
        JOIN "KnowledgeCategory" kcat ON kic."knowledgeCategoryId" = kcat.id
        WHERE ki.status = 'READY' 
          AND ki.title ILIKE '%rest period%'
          AND kcat.name IN ('hypertrophy_programs', 'hypertrophy_principles')
        ORDER BY kc."chunkIndex"
        LIMIT 5
      `;
      
      results.push(...(restPeriodResults as any[]).map(chunk => ({
        content: chunk.content,
        knowledgeId: chunk.knowledgeId,
        title: chunk.title,
        similarity: chunk.score,
        chunkIndex: chunk.chunkIndex,
        source: 'hybrid' as const,
        isHighRelevance: true
      })));
    }
    
    // Search for rep range information specifically
    if (/rep|repetition|range/.test(lowerQuery)) {
      const repRangeResults = await prisma.$queryRaw`
        SELECT 
          kc.id,
          kc.content,
          kc."chunkIndex",
          ki.id as "knowledgeId",
          ki.title,
          0.95 as score
        FROM "KnowledgeChunk" kc
        JOIN "KnowledgeItem" ki ON kc."knowledgeItemId" = ki.id  
        JOIN "KnowledgeItemCategory" kic ON ki.id = kic."knowledgeItemId"
        JOIN "KnowledgeCategory" kcat ON kic."knowledgeCategoryId" = kcat.id
        WHERE ki.status = 'READY' 
          AND (
            ki.title ILIKE '%rep range%' OR 
            ki.title ILIKE '%repetition%' OR
            kc.content ILIKE '%5-10%' OR
            kc.content ILIKE '%5 to 10%'
          )
          AND kcat.name IN ('hypertrophy_programs', 'hypertrophy_principles')
        ORDER BY kc."chunkIndex"
        LIMIT 5
      `;
      
      results.push(...(repRangeResults as any[]).map(chunk => ({
        content: chunk.content,
        knowledgeId: chunk.knowledgeId,
        title: chunk.title,
        similarity: chunk.score,
        chunkIndex: chunk.chunkIndex,
        source: 'hybrid' as const,
        isHighRelevance: true
      })));
    }
    
    return results;
  } catch (error) {
    console.error('Error in specialized training parameter search:', error);
    return [];
  }
}

/**
 * Helper function for unfiltered vector search
 */
async function performUnfilteredVectorSearch(
  query: string,
  limit: number,
  embeddingStr: string
): Promise<any[]> {
  return await prisma.$queryRaw`
    SELECT
      kc.id,
      kc.content,
      kc."chunkIndex",
      ki.id as "knowledgeId",
      ki.title,
      (1 - (kc."embeddingData"::vector <=> ${embeddingStr}::vector)) as score
    FROM "KnowledgeChunk" kc
    JOIN "KnowledgeItem" ki ON kc."knowledgeItemId" = ki.id  
    WHERE ki.status = 'READY' 
      AND kc."embeddingData" IS NOT NULL
    ORDER BY (kc."embeddingData"::vector <=> ${embeddingStr}::vector)
    LIMIT ${limit}
  `;
}

/**
 * FIXED: Stricter keyword search with better term handling
 */
async function performStrictKeywordSearch(
  query: string, 
  limit: number
): Promise<EnhancedKnowledgeContext[]> {
  
  try {
    // Clean and prepare search terms with better logic
    const importantTerms = query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(' ')
      .filter(term => term.length > 2)
      .filter(term => !['the', 'and', 'for', 'with', 'how', 'what', 'can'].includes(term));
    
    if (importantTerms.length === 0) return [];
    
    // Use OR logic for broader matching, but rank by number of matches
    const searchTerms = importantTerms.join(' | ');
    
    console.log(`🔍 Keyword search terms: "${searchTerms}"`);
    
    const chunks = await prisma.$queryRaw`
      SELECT 
        kc.content,
        kc."chunkIndex",
        ki.id as "knowledgeId",
        ki.title,
        ts_rank_cd(to_tsvector('english', kc.content), to_tsquery('english', ${searchTerms})) as keyword_score
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
      similarity: 0,
      chunkIndex: chunk.chunkIndex,
      keywordScore: parseFloat(chunk.keyword_score),
      source: 'keyword' as const,
      isHighRelevance: parseFloat(chunk.keyword_score) > 0.5
    }));
    
  } catch (error) {
    console.error('Strict keyword search error:', error);
    return [];
  }
}

/**
 * NEW: Search specifically for training guides
 */
async function searchTrainingGuides(context: any): Promise<EnhancedKnowledgeContext[]> {
  
  try {
    const guidePatterns = [
      'Guide to Structuring',
      'Training Guide',
      'Workout Guide',
      'Programming Guide'
    ];
    
    const results = [];
    
    for (const pattern of guidePatterns) {
      const guides = await prisma.$queryRaw`
        SELECT 
          kc.content,
          kc."chunkIndex",
          ki.id as "knowledgeId",
          ki.title,
          0.95 as similarity
        FROM "KnowledgeChunk" kc
        JOIN "KnowledgeItem" ki ON kc."knowledgeItemId" = ki.id
        WHERE ki.status = 'READY'
          AND ki.title ILIKE ${'%' + pattern + '%'}
        ORDER BY kc."chunkIndex" ASC
        LIMIT 5
      `;
      
      results.push(...(guides as any[]));
    }
    
    return results.map(chunk => ({
      content: chunk.content,
      knowledgeId: chunk.knowledgeId,
      title: chunk.title,
      similarity: chunk.similarity,
      chunkIndex: chunk.chunkIndex,
      source: 'hybrid' as const,
      isHighRelevance: true
    }));
    
  } catch (error) {
    console.error('Training guide search error:', error);
    return [];
  }
}

/**
 * FIXED: Better deduplication and ranking
 */
function deduplicateAndRank(
  candidates: EnhancedKnowledgeContext[],
  options: SearchOptions
): EnhancedKnowledgeContext[] {
  
  const seen = new Set<string>();
  const deduplicated = [];
  
  // Sort by relevance first
  const sorted = candidates.sort((a, b) => {
    const scoreA = a.hybridScore || a.similarity || a.keywordScore || 0;
    const scoreB = b.hybridScore || b.similarity || b.keywordScore || 0;
    return scoreB - scoreA;
  });
  
  for (const candidate of sorted) {
    const key = `${candidate.knowledgeId}-${candidate.chunkIndex}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(candidate);
    }
  }
  
  return deduplicated;
}

/**
 * FIXED: Apply stricter filtering with better thresholds
 */
async function applyStrictFiltering(
  candidates: EnhancedKnowledgeContext[],
  options: SearchOptions,
  context: any
): Promise<EnhancedKnowledgeContext[]> {
  
  // Step 1: Apply basic thresholds
  let filtered = candidates.filter(candidate => {
    const score = candidate.similarity || candidate.keywordScore || 0;
    return score >= options.similarityThreshold;
  });
  
  // Step 2: Boost muscle-specific content
  if (context.muscleGroups.length > 0) {
    filtered = filtered.map(candidate => {
      const titleLower = candidate.title.toLowerCase();
      const contentLower = candidate.content.toLowerCase();
      
      let boost = 0;
      context.muscleGroups.forEach((muscle: string) => {
        if (titleLower.includes(muscle) || contentLower.includes(muscle)) {
          boost += 0.2;
        }
      });
      
      if (boost > 0) {
        candidate.similarity += boost;
        candidate.isHighRelevance = true;
      }
      
      return candidate;
    });
  }
  
  // Step 3: Re-sort after boosting
  filtered.sort((a, b) => {
    const scoreA = a.similarity || a.keywordScore || 0;
    const scoreB = b.similarity || b.keywordScore || 0;
    return scoreB - scoreA;
  });
  
  // Step 4: Ensure minimum quality
  const highQuality = filtered.filter(candidate => {
    const score = candidate.similarity || candidate.keywordScore || 0;
    return score >= 0.4; // Minimum quality threshold
  });
  
  return highQuality.slice(0, options.maxChunks);
}

/**
 * NEW: Ensure mandatory training content is included
 */
async function ensureMandatoryContent(
  results: EnhancedKnowledgeContext[],
  context: any,
  options: SearchOptions
): Promise<EnhancedKnowledgeContext[]> {
  
  // If this is a workout request, ensure we have fundamental training principles
  if (context.isWorkoutRequest && results.length > 0) {
    const hasProgrammingPrinciples = results.some(r => 
      r.content.toLowerCase().includes('programming') ||
      r.content.toLowerCase().includes('rep range') ||
      r.content.toLowerCase().includes('volume')
    );
    
    if (!hasProgrammingPrinciples) {
      console.log('🔍 Adding mandatory programming principles...');
      
      try {
        const programmingContent = await prisma.$queryRaw`
          SELECT 
            kc.content,
            kc."chunkIndex",
            ki.id as "knowledgeId",
            ki.title,
            0.9 as similarity
          FROM "KnowledgeChunk" kc
          JOIN "KnowledgeItem" ki ON kc."knowledgeItemId" = ki.id
          WHERE ki.status = 'READY'
            AND (
              LOWER(kc.content) LIKE '%rep range%' OR
              LOWER(kc.content) LIKE '%programming%' OR
              LOWER(kc.content) LIKE '%volume%' OR
              LOWER(kc.content) LIKE '%frequency%'
            )
          LIMIT 3
        `;
        
        const mandatoryChunks = (programmingContent as any[]).map(chunk => ({
          content: chunk.content,
          knowledgeId: chunk.knowledgeId,
          title: chunk.title,
          similarity: chunk.similarity,
          chunkIndex: chunk.chunkIndex,
          source: 'hybrid' as const,
          isHighRelevance: true
        }));
        
        // Add to beginning for priority
        results.unshift(...mandatoryChunks);
      } catch (error) {
        console.error('Error fetching mandatory content:', error);
      }
    }
  }
  
  return results.slice(0, options.maxChunks);
}

/**
 * FIXED: More detailed logging
 */
function logDetailedMetrics(
  results: EnhancedKnowledgeContext[], 
  timeMs: number, 
  context: any
): void {
  console.log('📊 Enhanced RAG v2 Detailed Metrics:');
  console.log(`   ⏱️  Total time: ${timeMs}ms`);
  console.log(`   📄 Results: ${results.length}`);
  console.log(`   🎯 High relevance: ${results.filter(r => r.isHighRelevance).length}`);
  console.log(`   🔍 Context detected:`, {
    muscles: context.muscleGroups,
    concepts: context.trainingConcepts,
    isWorkout: context.isWorkoutRequest
  });
  
  const sourceDistribution = results.reduce((dist, result) => {
    const source = result.title.split(' ')[0] || 'Unknown';
    dist[source] = (dist[source] || 0) + 1;
    return dist;
  }, {} as Record<string, number>);
  
  console.log(`   📚 Source distribution:`, sourceDistribution);
  console.log(`   📈 Avg similarity: ${(results.reduce((sum, r) => sum + (r.similarity || 0), 0) / results.length).toFixed(3)}`);
  
  // Log top 3 results for debugging
  console.log('   🔝 Top results:');
  results.slice(0, 3).forEach((result, i) => {
    console.log(`      ${i + 1}. ${result.title} (${(result.similarity || 0).toFixed(3)}) - ${result.content.substring(0, 100)}...`);
  });
}

export default enhancedKnowledgeRetrieval;
