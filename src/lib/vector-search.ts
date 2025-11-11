// src/lib/vector-search.ts

import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from './prisma';
import { queryRelatedEntities } from './knowledge-graph';

// Define the structure of our knowledge context
export interface KnowledgeContext {
    id: string;
    title: string;
    content: string;
    score: number;
}

// Initialize Gemini client
if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generates an embedding for a given text query using Gemini.
 */
async function getEmbedding(query: string): Promise<number[]> {
    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await embeddingModel.embedContent(query);
    return result.embedding.values;
}

/**
 * ENHANCED: Detect query type for proper category prioritization
 */
function detectQueryType(query: string): {
    isProgramGeneration: boolean;
    isProgramReview: boolean;
    mentionedMuscles: string[];
    isMyths: boolean;
} {
    const lowerQuery = query.toLowerCase();
    
    // Program generation detection
    const programKeywords = [
        'create program', 'workout program', 'training program', 'workout plan', 
        'training plan', 'routine', 'design program', 'build program', 'split',
        'schedule workout', 'weekly plan', 'training split'
    ];
    const isProgramGeneration = programKeywords.some(keyword => lowerQuery.includes(keyword)) ||
        /create.*\d.*day.*workout/i.test(query) ||
        /design.*\d.*day.*program/i.test(query);
    
    // Program review detection  
    const reviewKeywords = [
        'review my program', 'review my workout', 'check my program', 'evaluate my program',
        'analyze my program', 'feedback on my', 'what do you think of my', 'rate my',
        'critique my', 'here is my program', 'this is my workout'
    ];
    const isProgramReview = reviewKeywords.some(keyword => lowerQuery.includes(keyword)) ||
        /here.*is.*my.*(program|workout|routine)/i.test(query) ||
        /is.*this.*(program|workout).*good/i.test(query);
    
    // Muscle group detection
    const muscleGroups = [
        'chest', 'pectorals', 'pecs', 'biceps', 'bicep', 'triceps', 'tricep',
        'shoulders', 'delts', 'deltoids', 'back', 'lats', 'latissimus', 'rhomboids', 
        'traps', 'trapezius', 'legs', 'quads', 'quadriceps', 'hamstrings', 'glutes',
        'calves', 'abs', 'core', 'abdominals', 'forearms', 'forearm'
    ];
    const mentionedMuscles = muscleGroups.filter(muscle => lowerQuery.includes(muscle));
    
    // Myths detection
    const mythsKeywords = ['myth', 'misconception', 'true or false', 'fact check', 'is it true'];
    const isMyths = mythsKeywords.some(keyword => lowerQuery.includes(keyword));
    
    return { isProgramGeneration, isProgramReview, mentionedMuscles, isMyths };
}

/**
 * ENHANCED: Apply strict category prioritization based on query requirements
 */
function getPrioritizedCategories(queryAnalysis: ReturnType<typeof detectQueryType>): string[] {
    const categories: string[] = [];
    
    // REQUIREMENT: Always include myths for misconception checking
    categories.push('myths');
    
    // REQUIREMENT: Training program generation prioritizes hypertrophy_programs
    if (queryAnalysis.isProgramGeneration) {
        categories.unshift('hypertrophy_programs', 'hypertrophy_principles');
    }
    
    // REQUIREMENT: Workout reviews prioritize hypertrophy_programs_review
    if (queryAnalysis.isProgramReview) {
        categories.unshift('hypertrophy_programs_review', 'hypertrophy_programs');
    }
    
    // Add muscle-specific categories
    if (queryAnalysis.mentionedMuscles.length > 0) {
        queryAnalysis.mentionedMuscles.forEach(muscle => {
            // Map muscle names to category names
            const muscleMapping: Record<string, string> = {
                'chest': 'chest', 'pectorals': 'chest', 'pecs': 'chest',
                'biceps': 'elbow_flexors', 'bicep': 'elbow_flexors',
                'triceps': 'triceps', 'tricep': 'triceps',
                'shoulders': 'shoulders', 'delts': 'shoulders', 'deltoids': 'shoulders',
                'back': 'back', 'lats': 'back', 'latissimus': 'back', 'rhomboids': 'back',
                'traps': 'back', 'trapezius': 'back',
                'legs': 'legs', 'quads': 'quadriceps', 'quadriceps': 'quadriceps',
                'hamstrings': 'hamstrings', 'glutes': 'glutes', 'calves': 'calves',
                'abs': 'abs', 'core': 'abs', 'abdominals': 'abs',
                'forearms': 'forearms', 'forearm': 'forearms'
            };
            
            const category = muscleMapping[muscle];
            if (category && !categories.includes(category)) {
                categories.push(category);
            }
        });
    }
    
    // Always ensure hypertrophy_principles is included for training queries
    if (!categories.includes('hypertrophy_principles') && 
        (queryAnalysis.isProgramGeneration || queryAnalysis.mentionedMuscles.length > 0)) {
        categories.push('hypertrophy_principles');
    }
    
    if (process.env.NODE_ENV === 'development') { console.log(`🎯 Prioritized categories for query: [${categories.join(', ')}]`); }
    return categories;
}

/**
 * ENHANCED: Multi-stage retrieval with strict prioritization
 */
export async function fetchKnowledgeContext(
    query: string,
    maxChunks: number,
    similarityThreshold: number,
    categoryIds?: string[]
): Promise<KnowledgeContext[]> {
    try {
        if (process.env.NODE_ENV === 'development') { console.log(`🚀 Enhanced RAG search for: "${query}" (threshold: ${similarityThreshold})`); }
        
        // Analyze query to determine priorities
        const queryAnalysis = detectQueryType(query);
        if (process.env.NODE_ENV === 'development') { console.log(`📊 Query analysis:`, queryAnalysis); }
        
        // Get prioritized categories (overrides manual categoryIds for requirements compliance)
        const prioritizedCategories = getPrioritizedCategories(queryAnalysis);
        const searchCategories = categoryIds || prioritizedCategories;
        
        // Generate embedding
        const queryEmbedding = await getEmbedding(query);
        const embeddingStr = `[${queryEmbedding.join(',')}]`;
        
        // Multi-stage search: Priority categories first, then fallback
        let chunks: KnowledgeContext[] = [];        if (searchCategories.length > 0) {
            if (process.env.NODE_ENV === 'development') { console.log(`🏷️ Searching priority categories: ${searchCategories.join(', ')}`); }
            
            // Stage 1: Search priority categories
            chunks = await prisma.$queryRaw`
                SELECT DISTINCT
                  kc.id,
                  kc.content,
                  ki.title,
                  1 - (kc."embeddingData"::vector <=> ${embeddingStr}::vector) as score,
                  kc."embeddingData"::vector <=> ${embeddingStr}::vector as distance
                FROM "KnowledgeChunk" kc
                JOIN "KnowledgeItem" ki ON kc."knowledgeItemId" = ki.id  
                JOIN "KnowledgeItemCategory" kic ON ki.id = kic."knowledgeItemId"
                JOIN "KnowledgeCategory" kcat ON kic."knowledgeCategoryId" = kcat.id
                WHERE ki.status = 'READY' 
                  AND kc."embeddingData" IS NOT NULL
                  AND kcat.name = ANY(${searchCategories})
                ORDER BY distance
                LIMIT ${Math.min(maxChunks * 2, 30)}
            `;
            
            if (process.env.NODE_ENV === 'development') { console.log(`📊 Priority search returned ${chunks.length} candidates`); }
        }
        
        // Stage 2: If insufficient results, search entire KB  
        if (chunks.length < maxChunks) {
            if (process.env.NODE_ENV === 'development') { console.log(`🔄 Insufficient priority results (${chunks.length}), searching entire KB...`); }
            
            const fallbackChunks = await prisma.$queryRaw`
                SELECT
                  kc.id,
                  kc.content,
                  ki.title,
                  1 - (kc."embeddingData"::vector <=> ${embeddingStr}::vector) as score
                FROM "KnowledgeChunk" kc
                JOIN "KnowledgeItem" ki ON kc."knowledgeItemId" = ki.id  
                WHERE ki.status = 'READY' 
                  AND kc."embeddingData" IS NOT NULL
                  AND kc.id NOT IN (${chunks.map((c: KnowledgeContext) => c.id).join(',') || 'NULL'})
                ORDER BY kc."embeddingData"::vector <=> ${embeddingStr}::vector
                LIMIT ${maxChunks}
            `;
            
            chunks = chunks.concat(fallbackChunks as KnowledgeContext[]);
        }
        
        // Filter by similarity threshold and apply final ranking
        const relevantChunks = (chunks as Array<{
            id: string;
            content: string;
            title: string; 
            score: number;
        }>).filter(chunk => chunk.score >= similarityThreshold);

        if (relevantChunks.length === 0) {
            if (process.env.NODE_ENV === 'development') { console.log(`⚠️ No relevant chunks found above threshold ${similarityThreshold}`); }
            return [];
        }

        // Prioritize chunks from required categories
        const sortedChunks = relevantChunks.sort((a, b) => {
            // Boost chunks from priority categories
            const aPriority = prioritizedCategories.some(cat => a.title.toLowerCase().includes(cat));
            const bPriority = prioritizedCategories.some(cat => b.title.toLowerCase().includes(cat));
            
            if (aPriority && !bPriority) return -1;
            if (!aPriority && bPriority) return 1;
            
            // Then sort by score
            return b.score - a.score;
        });
        
        const finalResults = sortedChunks.slice(0, maxChunks);
        
        if (process.env.NODE_ENV === 'development') { console.log(`✅ Enhanced RAG retrieved ${finalResults.length} chunks (from ${relevantChunks.length} above threshold)`); }
        
        // Log category distribution for debugging
        const categoryDistribution: Record<string, number> = {};
        finalResults.forEach(chunk => {
            const categoryMatch = prioritizedCategories.find(cat => 
                chunk.title.toLowerCase().includes(cat.replace('_', ' ')) || 
                chunk.content.toLowerCase().includes(cat.replace('_', ' '))
            );
            const category = categoryMatch || 'other';
            categoryDistribution[category] = (categoryDistribution[category] || 0) + 1;
        });
        if (process.env.NODE_ENV === 'development') { console.log(`📈 Category distribution:`, categoryDistribution); }
        
        return finalResults;

    } catch (error) {
        console.error("❌ Enhanced RAG error:", error);
        // Fallback to simple search
        return await fallbackJsonSimilaritySearch(await getEmbedding(query), maxChunks, similarityThreshold);
    }
}

/**
 * Fallback similarity search using JSON embeddings (for systems without pgvector)
 */
export async function fallbackJsonSimilaritySearch(
    queryEmbedding: number[],
    maxChunks: number,
    similarityThreshold: number
): Promise<KnowledgeContext[]> {
    try {
        // Fetch chunks with JSON embeddings
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
                        title: true,
                        id: true
                    }
                }
            },
            take: 1000 // Limit for performance
        });

        // Calculate similarities
        const similarities = chunks.map(chunk => {
            let embedding: number[];
            try {
                embedding = JSON.parse(chunk.embeddingData as string);
            } catch {
                return null;
            }

            const similarity = cosineSimilarity(queryEmbedding, embedding);
            return {
                id: chunk.knowledgeItem.id,
                title: chunk.knowledgeItem.title,
                content: chunk.content,
                score: similarity
            };
        }).filter((item): item is KnowledgeContext => 
            item !== null && item.score >= similarityThreshold
        );

        // Sort by score and take top results
        similarities.sort((a, b) => b.score - a.score);
        return similarities.slice(0, maxChunks);

    } catch (error) {
        console.error("Error in fallback similarity search:", error);
        return [];
    }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * ENHANCED: Category-specific knowledge retrieval for targeted searches
 */
export async function fetchCategoryBasedKnowledge(
  query: string,
  muscleGroups: string[],
  workoutType: 'hypertrophy' | 'strength' | 'endurance' = 'hypertrophy',
  maxChunks: number = 10,
  similarityThreshold: number = 0.7
): Promise<KnowledgeContext[]> {
  const categoryMap = {
    'hypertrophy': ['hypertrophy_programs', 'hypertrophy_principles'],
    'strength': ['strength_training', 'powerlifting'],
    'endurance': ['endurance_training', 'cardio', 'conditioning']
  };
  
  // Build category list based on muscle groups and workout type
  const targetCategories = new Set<string>();
  
  // Always include myths category to check for misconceptions
  targetCategories.add('myths');
  
  // Add workout type categories
  if (categoryMap[workoutType]) {
    categoryMap[workoutType].forEach(cat => targetCategories.add(cat));
  }
  
  // Add muscle-specific categories
  muscleGroups.forEach(muscle => {
    const muscleCategory = muscle.toLowerCase().replace(/\s+/g, '_');
    targetCategories.add(muscleCategory);
  });
  
  return fetchKnowledgeContext(
    query,
    maxChunks,
    similarityThreshold,
    Array.from(targetCategories)
  );
}

// Admin functions for embedding management
export async function runEmbeddingAudit() {
  // TODO: Implement embedding audit functionality
  return {
    totalChunks: 0,
    missingEmbeddings: 0,
    invalidEmbeddings: 0,
    report: 'Audit functionality not yet implemented'
  };
}

export async function reembedMissingChunks() {
  // TODO: Implement re-embedding functionality
  return {
    processed: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    message: 'Re-embedding functionality not yet implemented'
  };
}

export async function deleteEmbeddings(knowledgeItemId: string) {
  // TODO: Implement embedding deletion functionality
  if (process.env.NODE_ENV === 'development') { console.log(`Deleting embeddings for knowledge item: ${knowledgeItemId}`); }
  return {
    deleted: 0,
    message: 'Embedding deletion functionality not yet implemented'
  };
}

/**
 * AND-based keyword search using PostgreSQL full-text search
 * 
 * @param query - User query to search for
 * @param limit - Maximum number of results to return
 * @returns Promise<KnowledgeContext[]>
 */
export async function performAndKeywordSearch(
  query: string,
  limit: number = 10
): Promise<KnowledgeContext[]> {
  try {
    // Clean and prepare search terms for AND logic
    const searchTerms = query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(' ')
      .filter(term => term.length > 2)
      .filter(term => !['the', 'and', 'for', 'with', 'how', 'what', 'can', 'will', 'are', 'is'].includes(term))
      .join(' & '); // PostgreSQL AND syntax for precise results
    
    if (!searchTerms) {
      if (process.env.NODE_ENV === 'development') { console.log('⚠️ No valid search terms extracted from query'); }
      return [];
    }
    
    if (process.env.NODE_ENV === 'development') { console.log(`🔍 AND keyword search: "${searchTerms}"`); }
    
    // Use PostgreSQL to_tsvector and to_tsquery for full-text search
    const chunks = await prisma.$queryRaw`
      SELECT 
        kc.id,
        kc.content,
        ki.title,
        ts_rank(to_tsvector('english', kc.content), to_tsquery('english', ${searchTerms})) as score
      FROM "KnowledgeChunk" kc
      JOIN "KnowledgeItem" ki ON kc."knowledgeItemId" = ki.id
      WHERE ki.status = 'READY'
        AND to_tsvector('english', kc.content) @@ to_tsquery('english', ${searchTerms})
      ORDER BY score DESC
      LIMIT ${limit}
    `;
    
    return (chunks as Array<{
      id: string;
      content: string;
      title: string;
      score: number;
    }>).map(chunk => ({
      id: chunk.id,
      content: chunk.content,
      title: chunk.title,
      score: chunk.score
    }));
    
  } catch (error) {
    console.error('❌ Keyword search error:', error);
    return [];
  }
}

/**
 * Extract relevant keywords from query using simple tokenization
 * 
 * @param query - User query
 * @returns Array of important keywords
 */
function extractKeywords(query: string): string[] {
  try {
    // Tokenize the query
    const tokens = query
      .toLowerCase()
      .split(/[^a-zA-Z0-9]+/)
      .filter(token => token.length > 0);
    
    // Remove stop words
    const stopWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 
      'after', 'above', 'below', 'between', 'among', 'is', 'am', 'are', 'was',
      'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'how',
      'what', 'when', 'where', 'why', 'who', 'which', 'that', 'this', 'these',
      'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her',
      'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their'
    ]);
    
    // Filter tokens
    const keywords = tokens
      .filter((token: string) => token.length > 2)
      .filter((token: string) => !stopWords.has(token))
      .filter((token: string) => !/^\d+$/.test(token)); // Remove pure numbers
    
    // Remove duplicates and return
    return [...new Set(keywords)];
  } catch (error) {
    console.error('❌ Keyword extraction error:', error);
    return [];
  }
}

/**
 * Graph-based search using Neo4j knowledge graph
 * 
 * @param query - User query to search for entities and relationships
 * @param maxChunks - Maximum number of chunks to return
 * @returns Promise<KnowledgeContext[]>
 */
export async function graphSearch(
  query: string,
  maxChunks: number = 10
): Promise<KnowledgeContext[]> {
  try {
    if (process.env.NODE_ENV === 'development') { console.log(`🕸️ Starting graph search for: "${query}"`); }
    
    // Extract potential entity names from the query
    const entities = extractEntitiesFromQuery(query);
    if (process.env.NODE_ENV === 'development') { console.log(`🏷️ Extracted potential entities: [${entities.join(', ')}]`); }
    
    if (entities.length === 0) {
      if (process.env.NODE_ENV === 'development') { console.log('⚠️ No entities extracted from query, skipping graph search'); }
      return [];
    }
    
    // Search for related entities in the knowledge graph
    const relatedEntitiesPromises = entities.map(async (entity) => {
      try {
        const related = await queryRelatedEntities(entity, 5);
        return { entity, related };
      } catch (error) {
        console.warn(`⚠️ Failed to query related entities for "${entity}":`, error);
        return { entity, related: [] };
      }
    });
    
    const relatedEntitiesResults = await Promise.all(relatedEntitiesPromises);
    
    // Collect all related entity names for content search
    const allRelatedEntities = new Set<string>();
    relatedEntitiesResults.forEach(({ entity, related }) => {
      allRelatedEntities.add(entity);
      related.forEach(rel => {
        if (rel.name) {
          allRelatedEntities.add(rel.name);
        }
      });
    });
    
    if (process.env.NODE_ENV === 'development') { console.log(`🔗 Found ${allRelatedEntities.size} related entities from graph`); }
    
    if (allRelatedEntities.size === 0) {
      return [];
    }
    
    // Build search query from related entities
    const graphEntityQuery = Array.from(allRelatedEntities)
      .slice(0, 10) // Limit to prevent too long queries
      .join(' ');
    
    if (process.env.NODE_ENV === 'development') { console.log(`🔍 Graph-enhanced query: "${graphEntityQuery}"`); }
    
    // Search knowledge chunks using graph-enhanced query
    const searchTerms = graphEntityQuery
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(' ')
      .filter(term => term.length > 2)
      .filter(term => !['the', 'and', 'for', 'with', 'how', 'what', 'can', 'will', 'are', 'is'].includes(term))
      .join(' | '); // PostgreSQL OR syntax for broad coverage
    
    if (!searchTerms) {
      if (process.env.NODE_ENV === 'development') { console.log('⚠️ No valid search terms from graph entities'); }
      return [];
    }
    
    // Query knowledge chunks with graph-derived terms
    const chunks = await prisma.$queryRaw`
      SELECT 
        kc.id,
        kc.content,
        ki.title,
        ts_rank(to_tsvector('english', kc.content), to_tsquery('english', ${searchTerms})) as score
      FROM "KnowledgeChunk" kc
      JOIN "KnowledgeItem" ki ON kc."knowledgeItemId" = ki.id
      WHERE ki.status = 'READY'
        AND to_tsvector('english', kc.content) @@ to_tsquery('english', ${searchTerms})
      ORDER BY score DESC
      LIMIT ${maxChunks}
    `;
    
    const results = (chunks as Array<{
      id: string;
      content: string;
      title: string;
      score: number;
    }>).map(chunk => ({
      id: chunk.id,
      content: chunk.content,
      title: chunk.title,
      score: chunk.score * 0.9 // Slightly lower weight than direct searches
    }));
    
    if (process.env.NODE_ENV === 'development') { console.log(`✅ Graph search returned ${results.length} results`); }
    return results;
    
  } catch (error) {
    console.error('❌ Graph search error:', error);
    return [];
  }
}

/**
 * Extract potential entity names from query text
 * 
 * @param query - User query
 * @returns Array of potential entity names
 */
function extractEntitiesFromQuery(query: string): string[] {
  try {
    // Common fitness/exercise entities and variations
    const fitnessEntities = [
      // Exercises
      'squat', 'deadlift', 'bench press', 'overhead press', 'row', 'pull-up', 'chin-up',
      'lat pulldown', 'dip', 'push-up', 'lunge', 'leg press', 'leg curl', 'leg extension',
      'bicep curl', 'tricep extension', 'lateral raise', 'face pull', 'hip thrust',
      'romanian deadlift', 'bulgarian split squat', 'barbell row', 'dumbbell row',
      'incline press', 'decline press', 'cable fly', 'pec deck', 'machine press',
      
      // Muscle groups
      'chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'quadriceps', 'hamstrings',
      'glutes', 'calves', 'abs', 'core', 'forearms', 'delts', 'lats', 'traps',
      'pectorals', 'deltoids', 'latissimus', 'trapezius', 'rhomboids',
      
      // Training concepts
      'hypertrophy', 'strength', 'endurance', 'power', 'volume', 'intensity', 'frequency',
      'progressive overload', 'time under tension', 'rest pause', 'drop set', 'superset',
      'compound', 'isolation', 'concentric', 'eccentric', 'isometric', 'rep range',
      'periodization', 'deload', 'recovery', 'protein synthesis', 'muscle building',
      
      // Equipment
      'barbell', 'dumbbell', 'kettlebell', 'cable', 'machine', 'bands', 'bodyweight',
      
      // Nutrition
      'protein', 'carbs', 'carbohydrates', 'fats', 'calories', 'macros', 'creatine',
      'whey', 'casein', 'amino acids', 'supplements', 'nutrition', 'diet'
    ];
    
    const queryLower = query.toLowerCase();
    const foundEntities: string[] = [];
    
    // Find entities mentioned in the query
    fitnessEntities.forEach(entity => {
      if (queryLower.includes(entity)) {
        foundEntities.push(entity);
      }
    });
    
    // Also extract multi-word phrases that might be entities
    const words = queryLower
      .replace(/[^\w\s]/g, ' ')
      .split(' ')
      .filter(word => word.length > 3);
    
    // Look for compound terms
    for (let i = 0; i < words.length - 1; i++) {
      const twoWord = `${words[i]} ${words[i + 1]}`;
      if (fitnessEntities.includes(twoWord)) {
        foundEntities.push(twoWord);
      }
      
      if (i < words.length - 2) {
        const threeWord = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
        if (fitnessEntities.includes(threeWord)) {
          foundEntities.push(threeWord);
        }
      }
    }
    
    // Remove duplicates and return
    return [...new Set(foundEntities)];
    
  } catch (error) {
    console.error('❌ Entity extraction error:', error);
    return [];
  }
}

/**
 * Calculate TF-IDF scores for better keyword relevance
 */
async function calculateKeywordRelevance(keywords: string[]): Promise<Array<{keyword: string, score: number}>> {
  try {
    // Simple TF calculation for the query
    const queryTermFreq: Record<string, number> = {};
    keywords.forEach(keyword => {
      queryTermFreq[keyword] = (queryTermFreq[keyword] || 0) + 1;
    });
    
    // Get document frequency for IDF calculation
    const keywordScores = await Promise.all(
      keywords.map(async (keyword) => {
        try {
          // Count documents containing this keyword
          const docCount = await prisma.knowledgeChunk.count({
            where: {
              content: {
                contains: keyword,
                mode: 'insensitive'
              },
              knowledgeItem: {
                status: 'READY'
              }
            }
          });
          
          // Simple TF-IDF calculation
          const tf = queryTermFreq[keyword];
          const totalDocs = await prisma.knowledgeChunk.count({
            where: {
              knowledgeItem: {
                status: 'READY'
              }
            }
          });
          
          const idf = Math.log((totalDocs + 1) / (docCount + 1));
          const score = tf * idf;
          
          return { keyword, score };
        } catch (error) {
          console.warn(`Error calculating relevance for keyword "${keyword}":`, error);
          return { keyword, score: 0 };
        }
      })
    );
    
    return keywordScores.sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error('❌ Keyword relevance calculation error:', error);
    return keywords.map(keyword => ({ keyword, score: 1 }));
  }
}

/**
 * Hybrid search combining vector similarity, keyword matching, and graph search
 * 
 * @param query - User query
 * @param maxChunks - Maximum number of chunks to return
 * @param similarityThreshold - Minimum similarity threshold for vector search
 * @param categoryIds - Optional category filtering
 * @param config - AI Configuration for Graph RAG settings
 * @returns Promise<KnowledgeContext[]>
 */
export async function hybridSearch(
  query: string,
  maxChunks: number = 10,
  similarityThreshold: number = 0.3,
  categoryIds?: string[],
  config?: { enableGraphRAG?: boolean; graphSearchWeight?: number }
): Promise<KnowledgeContext[]> {
  try {
    if (process.env.NODE_ENV === 'development') { console.log(`🔄 Starting Graph RAG hybrid search for: "${query}"`); }
    if (process.env.NODE_ENV === 'development') { console.log(`📊 Parameters: maxChunks=${maxChunks}, threshold=${similarityThreshold}`); }
    
    // Check if Graph RAG is enabled
    const enableGraphRAG = config?.enableGraphRAG ?? true;
    const graphSearchWeight = config?.graphSearchWeight ?? 0.9;
    
    if (process.env.NODE_ENV === 'development') { console.log(`🕸️ Graph RAG enabled: ${enableGraphRAG}, weight: ${graphSearchWeight}`); }
    
    // Extract and analyze keywords
    const keywords = extractKeywords(query);
    if (process.env.NODE_ENV === 'development') { console.log(`🏷️ Extracted keywords: [${keywords.join(', ')}]`); }
    
    // Calculate keyword relevance scores
    const keywordRelevance = await calculateKeywordRelevance(keywords);
    if (process.env.NODE_ENV === 'development') { console.log(`📈 Top keywords by relevance: [${keywordRelevance.slice(0, 5).map(k => `${k.keyword}:${k.score.toFixed(2)}`).join(', ')}]`); }
    
    // Prepare search promises for parallel execution
    const searchPromises = [];
    
    // 1. Vector search
    searchPromises.push(
      fetchKnowledgeContext(query, Math.ceil(maxChunks * 0.6), similarityThreshold, categoryIds)
        .then(results => ({ source: 'vector', results }))
        .catch(error => {
          console.warn('Vector search failed:', error);
          return { source: 'vector', results: [] };
        })
    );
    
    // 2. Keyword search  
    searchPromises.push(
      performAndKeywordSearch(query, Math.ceil(maxChunks * 0.4))
        .then(results => ({ source: 'keyword', results }))
        .catch(error => {
          console.warn('Keyword search failed:', error);
          return { source: 'keyword', results: [] };
        })
    );
    
    // 3. Graph search (conditional on configuration)
    if (enableGraphRAG) {
      searchPromises.push(
        graphSearch(query, Math.ceil(maxChunks * 0.4))
          .then(results => ({ source: 'graph', results }))
          .catch(error => {
            console.warn('Graph search failed:', error);
            return { source: 'graph', results: [] };
          })
      );
    }
    
    // 4. Enhanced keyword search with top relevant terms
    if (keywordRelevance.length > 0) {
      const topKeywords = keywordRelevance.slice(0, 3).map(k => k.keyword).join(' ');
      searchPromises.push(
        performAndKeywordSearch(topKeywords, Math.ceil(maxChunks * 0.3))
          .then(results => ({ source: 'enhanced_keyword', results }))
          .catch(error => {
            console.warn('Enhanced keyword search failed:', error);
            return { source: 'enhanced_keyword', results: [] };
          })
      );
    }
    
    // Execute all searches in parallel
    const searchResults = await Promise.all(searchPromises);
    
    // Combine and deduplicate results
    const combinedResults = new Map<string, KnowledgeContext & { sources: string[], hybridScore: number }>();
    
    searchResults.forEach(({ source, results }) => {
      if (process.env.NODE_ENV === 'development') { console.log(`📊 ${source} search returned ${results.length} results`); }
      
      results.forEach((result, index) => {
        const existing = combinedResults.get(result.id);
        
        if (existing) {
          // Update existing result
          existing.sources.push(source);
          
          // Boost score for multi-source results with source-specific weights
          const sourceBonus = source === 'vector' ? 0.15 : 
                            source === 'graph' ? 0.12 * graphSearchWeight : 
                            source === 'keyword' ? 0.08 : 0.05;
          const positionBonus = Math.max(0, (results.length - index) / results.length * 0.1);
          existing.hybridScore += sourceBonus + positionBonus;
          
          // Take the best score from either search
          existing.score = Math.max(existing.score, result.score);
        } else {
          // Add new result with source-specific weighting
          const baseScore = result.score;
          const sourceWeight = source === 'vector' ? 1.0 : 
                              source === 'graph' ? graphSearchWeight : 
                              source === 'keyword' ? 0.8 : 0.6;
          const positionBonus = Math.max(0, (results.length - index) / results.length * 0.1);
          
          combinedResults.set(result.id, {
            ...result,
            sources: [source],
            hybridScore: baseScore * sourceWeight + positionBonus
          });
        }
      });
    });
    
    // Convert to array and sort by hybrid score
    const finalResults = Array.from(combinedResults.values())
      .sort((a, b) => {
        // Boost results that appear in multiple sources, especially graph + vector
        const aHasGraph = a.sources.includes('graph');
        const bHasGraph = b.sources.includes('graph');
        const aHasVector = a.sources.includes('vector');
        const bHasVector = b.sources.includes('vector');
        
        // Priority boost for graph + vector combination (only if graph RAG enabled)
        if (enableGraphRAG && aHasGraph && aHasVector && !(bHasGraph && bHasVector)) return -1;
        if (enableGraphRAG && bHasGraph && bHasVector && !(aHasGraph && aHasVector)) return 1;
        
        // Priority boost for multiple sources
        if (a.sources.length > b.sources.length) return -1;
        if (b.sources.length > a.sources.length) return 1;
        
        // Then sort by hybrid score
        return b.hybridScore - a.hybridScore;
      })
      .slice(0, maxChunks)
      .map(({ hybridScore, ...result }) => ({
        ...result,
        score: hybridScore // Use hybrid score as final score
      }));
    
    if (process.env.NODE_ENV === 'development') { console.log(`✅ Graph RAG hybrid search complete: ${finalResults.length} final results`); }
    if (process.env.NODE_ENV === 'development') { console.log(`📈 Score distribution: min=${Math.min(...finalResults.map(r => r.score)).toFixed(3)}, max=${Math.max(...finalResults.map(r => r.score)).toFixed(3)}`); }
    
    // Log source distribution for debugging
    const sourceDistribution: Record<string, number> = {};
    Array.from(combinedResults.values()).forEach(result => {
      result.sources.forEach(source => {
        sourceDistribution[source] = (sourceDistribution[source] || 0) + 1;
      });
    });
    if (process.env.NODE_ENV === 'development') { console.log(`🔗 Source distribution:`, sourceDistribution); }
    
    return finalResults;
    
  } catch (error) {
    console.error('❌ Graph RAG hybrid search error:', error);
    
    // Fallback to vector search only
    if (process.env.NODE_ENV === 'development') { console.log('🔄 Falling back to vector search only...'); }
    try {
      return await fetchKnowledgeContext(query, maxChunks, similarityThreshold, categoryIds);
    } catch (fallbackError) {
      console.error('❌ Fallback search also failed:', fallbackError);
      return [];
    }
  }
}

export default fetchKnowledgeContext;