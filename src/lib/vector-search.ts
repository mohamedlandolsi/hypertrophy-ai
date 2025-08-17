// src/lib/vector-search.ts

import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from './prisma';

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
    
    console.log(`🎯 Prioritized categories for query: [${categories.join(', ')}]`);
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
        console.log(`🚀 Enhanced RAG search for: "${query}" (threshold: ${similarityThreshold})`);
        
        // Analyze query to determine priorities
        const queryAnalysis = detectQueryType(query);
        console.log(`📊 Query analysis:`, queryAnalysis);
        
        // Get prioritized categories (overrides manual categoryIds for requirements compliance)
        const prioritizedCategories = getPrioritizedCategories(queryAnalysis);
        const searchCategories = categoryIds || prioritizedCategories;
        
        // Generate embedding
        const queryEmbedding = await getEmbedding(query);
        const embeddingStr = `[${queryEmbedding.join(',')}]`;
        
        // Multi-stage search: Priority categories first, then fallback
        let chunks: KnowledgeContext[] = [];        if (searchCategories.length > 0) {
            console.log(`🏷️ Searching priority categories: ${searchCategories.join(', ')}`);
            
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
            
            console.log(`📊 Priority search returned ${chunks.length} candidates`);
        }
        
        // Stage 2: If insufficient results, search entire KB  
        if (chunks.length < maxChunks) {
            console.log(`🔄 Insufficient priority results (${chunks.length}), searching entire KB...`);
            
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
            console.log(`⚠️ No relevant chunks found above threshold ${similarityThreshold}`);
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
        
        console.log(`✅ Enhanced RAG retrieved ${finalResults.length} chunks (from ${relevantChunks.length} above threshold)`);
        
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
        console.log(`📈 Category distribution:`, categoryDistribution);
        
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
  console.log(`Deleting embeddings for knowledge item: ${knowledgeItemId}`);
  return {
    deleted: 0,
    message: 'Embedding deletion functionality not yet implemented'
  };
}

export default fetchKnowledgeContext;