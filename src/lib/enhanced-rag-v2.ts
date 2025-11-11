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
  // Enhanced tuning parameters
  useQueryTransformation?: boolean;
  useHyDE?: boolean; // Hypothetical Document Embeddings
  dynamicThresholdAdjustment?: boolean;
  verboseLogging?: boolean;
  fallbackOnLowResults?: boolean;
  minAcceptableResults?: number;
}

/**
 * ENHANCED: Advanced RAG with query transformation, HyDE, and dynamic tuning
 */
export async function enhancedKnowledgeRetrieval(
  userQuery: string,
  options: SearchOptions
): Promise<EnhancedKnowledgeContext[]> {
  
  const startTime = Date.now();
  const verboseLogging = options.verboseLogging ?? true;
  
  if (verboseLogging) {
    if (process.env.NODE_ENV === 'development') { console.log('🚀 Starting Enhanced RAG Retrieval v3 (Optimized Pipeline)'); }
    if (process.env.NODE_ENV === 'development') { console.log(`📝 Original Query: "${userQuery}"`); }
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚙️ Search Options:`, {
      maxChunks: options.maxChunks,
      similarityThreshold: options.similarityThreshold,
      useQueryTransformation: options.useQueryTransformation ?? true,
      useHyDE: options.useHyDE ?? true,
      dynamicThresholdAdjustment: options.dynamicThresholdAdjustment ?? true,
      minAcceptableResults: options.minAcceptableResults ?? 3
      });
    }
  }
  
  try {
    // Step 1: Analyze query context and intent
    const queryContext = await analyzeQueryContext(userQuery);
    if (verboseLogging) {
      if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Query Analysis:', {
      muscleGroups: queryContext.muscleGroups,
      trainingConcepts: queryContext.trainingConcepts,
      requestType: `${queryContext.isWorkoutRequest ? 'Workout' : ''}${queryContext.isProgramRequest ? 'Program' : ''}${queryContext.isNutritionRequest ? 'Nutrition' : 'General'}`,
      relevantCategories: queryContext.relevantCategories.slice(0, 5) // Show first 5
      });
    }
    }
    
    // Step 2: Query transformation and enhancement
    const transformedQueries = await generateOptimizedSearchQueries(userQuery, queryContext, options);
    if (verboseLogging) {
      if (process.env.NODE_ENV === 'development') { console.log(`📚 Generated ${transformedQueries.length} search queries:`, transformedQueries.slice(0, 3)); }
    }
    
    // Step 3: Multi-strategy search with dynamic threshold adjustment
    let searchAttempts = 0;
    let currentThreshold = options.similarityThreshold;
    let candidates: EnhancedKnowledgeContext[] = [];
    
    while (searchAttempts < 3 && candidates.length < (options.minAcceptableResults ?? 3)) {
      searchAttempts++;
      
      if (verboseLogging) {
        if (process.env.NODE_ENV === 'development') { console.log(`🔄 Search Attempt ${searchAttempts} (threshold: ${currentThreshold.toFixed(3)})`); }
      }
      
      const attemptCandidates = await executeAdvancedMultiSearch(
        transformedQueries, 
        { ...options, similarityThreshold: currentThreshold }, 
        queryContext
      );
      
      candidates = attemptCandidates;
      
      if (verboseLogging) {
        if (process.env.NODE_ENV === 'development') { console.log(`📊 Attempt ${searchAttempts} Results: ${candidates.length} candidates`); }
      }
      
      // Dynamic threshold adjustment if enabled and results are insufficient
      if (options.dynamicThresholdAdjustment && candidates.length < (options.minAcceptableResults ?? 3)) {
        currentThreshold = Math.max(0.05, currentThreshold - 0.05); // Lower threshold by 0.05
        if (verboseLogging) {
          if (process.env.NODE_ENV === 'development') { console.log(`⚡ Lowering similarity threshold to ${currentThreshold.toFixed(3)} for broader search`); }
        }
      } else {
        break; // Sufficient results found
      }
    }
    
    // Step 4: Enhanced filtering with quality metrics
    const filteredResults = await applyAdvancedFiltering(candidates, options, queryContext);
    if (verboseLogging) {
      if (process.env.NODE_ENV === 'development') { console.log(`🎯 Advanced Filtering: ${filteredResults.length} high-quality results`); }
    }
    
    // Step 5: Ensure mandatory content coverage
    const finalResults = await ensureMandatoryContent(filteredResults, queryContext, options);
    
    const totalTime = Date.now() - startTime;
    
    // Step 6: Comprehensive metrics and diagnostics
    await logAdvancedMetrics(finalResults, totalTime, queryContext, options, userQuery);
    
    return finalResults;
    
  } catch (error) {
    console.error('❌ Enhanced RAG v3 Pipeline Error:', error);
    if (verboseLogging) {
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
    }
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
 * ENHANCED: Generate optimized search queries with transformation techniques
 */
async function generateOptimizedSearchQueries(
  originalQuery: string,
  context: any,
  options: SearchOptions
): Promise<string[]> {
  const queries = [originalQuery];
  
  // Base query transformations
  if (options.useQueryTransformation ?? true) {
    // Add muscle-specific variations
    context.muscleGroups.forEach((muscle: string) => {
      queries.push(`${muscle} training hypertrophy exercises`);
      queries.push(`${muscle} workout programming guidelines`);
      queries.push(`how to train ${muscle} for muscle growth`);
    });
    
    // Add concept-focused queries
    context.trainingConcepts.forEach((concept: string) => {
      queries.push(`${concept} principles for hypertrophy`);
      queries.push(`${originalQuery} ${concept}`);
    });
    
    // Add intent-based transformations
    if (context.isWorkoutRequest) {
      queries.push('workout structure programming principles');
      queries.push('training program design guidelines');
      queries.push('exercise selection criteria hypertrophy');
    }
    
    if (context.isProgramRequest) {
      queries.push('program periodization muscle building');
      queries.push('training split recommendations');
      queries.push('volume frequency progression');
    }
  }
  
  // HyDE (Hypothetical Document Embeddings) implementation
  if (options.useHyDE ?? true) {
    try {
      const hydeQuery = await generateHypotheticalAnswer(originalQuery, context);
      if (hydeQuery) {
        queries.unshift(hydeQuery); // Add at beginning for priority
      }
    } catch (error) {
      console.warn('⚠️ HyDE generation failed, continuing without it:', error);
    }
  }
  
  // Remove duplicates and limit to reasonable number
  return [...new Set(queries)].slice(0, 8);
}

/**
 * ENHANCED: Generate hypothetical ideal answer for HyDE technique
 */
async function generateHypotheticalAnswer(query: string, context: any): Promise<string | null> {
  try {
    // Generate a hypothetical ideal answer that would contain the information we're looking for
    let hypotheticalContent = '';
    
    if (context.isWorkoutRequest) {
      hypotheticalContent = `A comprehensive ${context.muscleGroups.join(' and ')} workout program designed for hypertrophy should include specific exercises, rep ranges of 5-10 repetitions, set volumes of 2-4 sets per muscle group, and rest periods of 2-5 minutes between sets. The program should emphasize progressive overload and proper exercise selection based on biomechanics and muscle activation patterns.`;
    } else if (context.isProgramRequest) {
      hypotheticalContent = `An effective hypertrophy training program incorporates proper training frequency, exercise selection, volume progression, and recovery protocols. The program should address ${context.muscleGroups.join(', ')} development through evidence-based training methods and periodization strategies.`;
    } else {
      // Generate based on training concepts
      hypotheticalContent = `Training guidance for ${context.trainingConcepts.join(' and ')} should address proper implementation, scientific rationale, and practical application for muscle hypertrophy and strength development.`;
    }
    
    return hypotheticalContent;
  } catch (error) {
    console.error('HyDE generation error:', error);
    return null;
  }
}

/**
 * ENHANCED: Advanced multi-strategy search with improved categorization
 */
async function executeAdvancedMultiSearch(
  queries: string[],
  options: SearchOptions,
  context: any
): Promise<EnhancedKnowledgeContext[]> {
  const allCandidates: EnhancedKnowledgeContext[] = [];
  
  // Strategy 1: Priority-based categorical search
  if (context.isWorkoutRequest || context.isProgramRequest) {
    const priorityCategories = ['hypertrophy_programs', 'hypertrophy_principles'];
    
    for (const query of queries) {
      const priorityResults = await performEnhancedVectorSearch(
        query, 
        Math.ceil(options.maxChunks * 0.7),
        priorityCategories
      );
      
      priorityResults.forEach(result => {
        result.isHighRelevance = true;
        result.source = 'priority' as any;
      });
      
      allCandidates.push(...priorityResults);
    }
  }
  
  // Strategy 2: Muscle-specific targeted search
  if (context.muscleGroups.length > 0) {
    for (const muscle of context.muscleGroups) {
      const muscleResults = await performMuscleSpecificSearch(muscle, options);
      allCandidates.push(...muscleResults);
    }
  }
  
  // Strategy 3: Specialized parameter search for key training variables
  for (const query of queries) {
    const specializedResults = await searchSpecificTrainingParameters(query, context);
    allCandidates.push(...specializedResults);
  }
  
  // Strategy 4: Broad categorical search if insufficient results
  if (allCandidates.length < options.maxChunks) {
    for (const query of queries) {
      const broadResults = await performEnhancedVectorSearch(
        query,
        options.maxChunks,
        context.relevantCategories.length > 0 ? context.relevantCategories : undefined
      );
      allCandidates.push(...broadResults);
    }
  }
  
  // Strategy 5: Keyword-based fallback search
  if (allCandidates.length < (options.minAcceptableResults ?? 3)) {
    for (const query of queries) {
      const keywordResults = await performStrictKeywordSearch(query, options.maxChunks);
      allCandidates.push(...keywordResults);
    }
  }
  
  return deduplicateAndRank(allCandidates, options);
}

/**
 * ENHANCED: Advanced filtering with quality assessment
 */
async function applyAdvancedFiltering(
  candidates: EnhancedKnowledgeContext[],
  options: SearchOptions,
  context: any
): Promise<EnhancedKnowledgeContext[]> {
  
  // Step 1: Basic threshold filtering
  let filtered = candidates.filter(candidate => {
    const score = candidate.similarity || candidate.keywordScore || 0;
    return score >= options.similarityThreshold;
  });
  
  // Step 2: Content quality assessment
  filtered = filtered.filter(candidate => {
    // Filter out very short or low-quality content
    const contentLength = candidate.content.trim().length;
    const hasSubstantiveContent = contentLength > 50; // Minimum content length
    
    // Check for meaningful training-related content
    const trainingKeywords = /\b(exercise|training|workout|rep|set|muscle|hypertrophy|program)\b/gi;
    const hasTrainingContent = trainingKeywords.test(candidate.content);
    
    return hasSubstantiveContent && hasTrainingContent;
  });
  
  // Step 3: Muscle group relevance boosting
  if (context.muscleGroups.length > 0) {
    filtered = filtered.map(candidate => {
      const titleLower = candidate.title.toLowerCase();
      const contentLower = candidate.content.toLowerCase();
      
      let relevanceBoost = 0;
      context.muscleGroups.forEach((muscle: string) => {
        if (titleLower.includes(muscle) || contentLower.includes(muscle)) {
          relevanceBoost += 0.15; // Smaller boost to avoid over-prioritization
          candidate.isHighRelevance = true;
        }
      });
      
      if (relevanceBoost > 0) {
        candidate.similarity = (candidate.similarity || 0) + relevanceBoost;
      }
      
      return candidate;
    });
  }
  
  // Step 4: Training concept relevance
  context.trainingConcepts.forEach((concept: string) => {
    filtered = filtered.map(candidate => {
      if (candidate.content.toLowerCase().includes(concept)) {
        candidate.similarity = (candidate.similarity || 0) + 0.1;
        candidate.isHighRelevance = true;
      }
      return candidate;
    });
  });
  
  // Step 5: Re-sort by enhanced relevance scores
  filtered.sort((a, b) => {
    const scoreA = a.similarity || a.keywordScore || 0;
    const scoreB = b.similarity || b.keywordScore || 0;
    return scoreB - scoreA;
  });
  
  // Step 6: Ensure diversity in results (avoid all results from same document)
  const diverseResults: EnhancedKnowledgeContext[] = [];
  const seenDocuments = new Set<string>();
  const maxPerDocument = Math.max(2, Math.floor(options.maxChunks / 3));
  
  for (const candidate of filtered) {
    const docCount = Array.from(seenDocuments).filter(doc => doc === candidate.knowledgeId).length;
    if (docCount < maxPerDocument) {
      diverseResults.push(candidate);
      seenDocuments.add(candidate.knowledgeId);
    }
  }
  
  return diverseResults.slice(0, options.maxChunks);
}

/**
 * ENHANCED: Advanced metrics and diagnostics logging
 */
async function logAdvancedMetrics(
  results: EnhancedKnowledgeContext[],
  timeMs: number,
  context: any,
  options: SearchOptions,
  originalQuery: string
): Promise<void> {
  if (!options.verboseLogging) return;
  
  if (process.env.NODE_ENV === 'development') { console.log('\n📊 ===== ENHANCED RAG PIPELINE DIAGNOSTICS ====='); }
  if (process.env.NODE_ENV === 'development') { console.log(`🎯 Query: "${originalQuery}"`); }
  if (process.env.NODE_ENV === 'development') { console.log(`⏱️  Total Retrieval Time: ${timeMs}ms`); }
  if (process.env.NODE_ENV === 'development') { console.log(`📄 Total Results Retrieved: ${results.length}/${options.maxChunks}`); }
  
  // Quality Metrics
  const highRelevanceCount = results.filter(r => r.isHighRelevance).length;
  const averageSimilarity = results.length > 0 
    ? (results.reduce((sum, r) => sum + (r.similarity || 0), 0) / results.length).toFixed(3)
    : '0.000';
  
  if (process.env.NODE_ENV === 'development') { console.log(`✨ High Relevance Results: ${highRelevanceCount}/${results.length} (${((highRelevanceCount/results.length)*100).toFixed(1)}%)`); }
  if (process.env.NODE_ENV === 'development') { console.log(`📈 Average Similarity Score: ${averageSimilarity}`); }
  
  // Source Distribution Analysis
  const sourceDistribution = results.reduce((dist, result) => {
    const source = result.title.split(' ')[0] || 'Unknown';
    dist[source] = (dist[source] || 0) + 1;
    return dist;
  }, {} as Record<string, number>);
  
  if (process.env.NODE_ENV === 'development') { console.log(`📚 Source Distribution:`, sourceDistribution); }
  
  // Document Diversity
  const uniqueDocuments = new Set(results.map(r => r.knowledgeId)).size;
  if (process.env.NODE_ENV === 'development') { console.log(`📖 Document Diversity: ${uniqueDocuments} unique documents`); }
  
  // Context Analysis
  if (process.env.NODE_ENV === 'development') { console.log(`🔍 Query Analysis Results:`); }
  if (process.env.NODE_ENV === 'development') { console.log(`   - Muscle Groups: ${context.muscleGroups.join(', ') || 'None'}`); }
  if (process.env.NODE_ENV === 'development') { console.log(`   - Training Concepts: ${context.trainingConcepts.join(', ') || 'None'}`); }
  if (process.env.NODE_ENV === 'development') { console.log(`   - Request Type: ${context.isWorkoutRequest ? 'Workout' : ''}${context.isProgramRequest ? 'Program' : ''}${context.isNutritionRequest ? 'Nutrition' : 'General'}`); }
  if (process.env.NODE_ENV === 'development') { console.log(`   - Relevant Categories: ${context.relevantCategories.slice(0, 5).join(', ')}`); }
  
  // Quality Assessment
  const qualityThresholds = {
    excellent: 0.8,
    good: 0.6,
    acceptable: 0.4,
    poor: 0.2
  };
  
  const qualityDistribution = {
    excellent: results.filter(r => (r.similarity || 0) >= qualityThresholds.excellent).length,
    good: results.filter(r => (r.similarity || 0) >= qualityThresholds.good && (r.similarity || 0) < qualityThresholds.excellent).length,
    acceptable: results.filter(r => (r.similarity || 0) >= qualityThresholds.acceptable && (r.similarity || 0) < qualityThresholds.good).length,
    poor: results.filter(r => (r.similarity || 0) < qualityThresholds.acceptable).length
  };
  
  if (process.env.NODE_ENV === 'development') { console.log(`🎨 Quality Distribution:`, qualityDistribution); }
  
  // Top Results Preview
  if (process.env.NODE_ENV === 'development') { console.log(`🔝 Top 3 Results:`); }
  results.slice(0, 3).forEach((result, i) => {
    if (process.env.NODE_ENV === 'development') { console.log(`   ${i + 1}. "${result.title}" (Score: ${(result.similarity || 0).toFixed(3)}, ${result.isHighRelevance ? 'HIGH' : 'NORMAL'} relevance)`); }
    if (process.env.NODE_ENV === 'development') { console.log(`      Preview: ${result.content.substring(0, 120)}...`); }
  });
  
  // Performance Warnings
  if (timeMs > 3000) {
    if (process.env.NODE_ENV === 'development') { console.log(`⚠️  PERFORMANCE WARNING: Retrieval took ${timeMs}ms (>3s threshold)`); }
  }
  
  if (results.length < (options.minAcceptableResults ?? 3)) {
    if (process.env.NODE_ENV === 'development') { console.log(`⚠️  QUALITY WARNING: Only ${results.length} results found (minimum: ${options.minAcceptableResults ?? 3})`); }
    if (process.env.NODE_ENV === 'development') { console.log(`   Recommendations: Lower similarity threshold or add more diverse content to knowledge base`); }
  }
  
  if (parseFloat(averageSimilarity) < 0.3) {
    if (process.env.NODE_ENV === 'development') { console.log(`⚠️  RELEVANCE WARNING: Low average similarity (${averageSimilarity})`); }
    if (process.env.NODE_ENV === 'development') { console.log(`   Recommendations: Check query phrasing or consider query transformation techniques`); }
  }
  
  if (process.env.NODE_ENV === 'development') { console.log(`========================================\n`); }
}

/**
 * ENHANCED: Execute multiple search strategies with better prioritization
 */
async function executeMultiStrategySearch(
  queries: string[],
  options: SearchOptions,
  context: any
): Promise<EnhancedKnowledgeContext[]> {
  
  // Delegate to the advanced version
  return await executeAdvancedMultiSearch(queries, options, context);
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
      if (process.env.NODE_ENV === 'development') { console.log(`Warning: Categories not found: ${notFound.join(', ')}`); }
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
    
    if (process.env.NODE_ENV === 'development') { console.log(`🔍 Keyword search terms: "${searchTerms}"`); }
    
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
 * ENHANCED: Apply stricter filtering with better thresholds
 */
async function applyStrictFiltering(
  candidates: EnhancedKnowledgeContext[],
  options: SearchOptions,
  context: any
): Promise<EnhancedKnowledgeContext[]> {
  
  // Delegate to the advanced version
  return await applyAdvancedFiltering(candidates, options, context);
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
      if (process.env.NODE_ENV === 'development') { console.log('🔍 Adding mandatory programming principles...'); }
      
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
 * ENHANCED: More detailed logging with performance insights
 */
function logDetailedMetrics(
  results: EnhancedKnowledgeContext[], 
  timeMs: number, 
  context: any
): void {
  // Create minimal options for advanced logging
  const options: SearchOptions = { 
    maxChunks: results.length,
    similarityThreshold: 0.1,
    highRelevanceThreshold: 0.7,
    verboseLogging: true 
  };
  logAdvancedMetrics(results, timeMs, context, options, 'Legacy call').catch(console.error);
}

export default enhancedKnowledgeRetrieval;
