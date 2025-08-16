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
 * @param query - The text to embed.
 * @returns The embedding vector (an array of numbers).
 */
async function getEmbedding(query: string): Promise<number[]> {
    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await embeddingModel.embedContent(query);
    return result.embedding.values;
}

/**
 * Fetches relevant knowledge base chunks using efficient vector similarity search
 * This is the primary RAG function - currently using pgvector with Pinecone interface compatibility
 * @param query - The user's message/question.
 * @param maxChunks - The maximum number of chunks to return.
 * @param similarityThreshold - The minimum similarity score for a chunk to be considered relevant.
 * @param categoryIds - Optional array of category IDs to filter results to specific categories.
 * @returns A promise that resolves to an array of KnowledgeContext objects.
 */
export async function fetchKnowledgeContext(
    query: string,
    maxChunks: number,
    similarityThreshold: number,
    categoryIds?: string[]
): Promise<KnowledgeContext[]> {
    try {
        console.log(`🚀 Starting vector search for "${query}" with threshold ${similarityThreshold}`);
        
        // Always include "myths" category to check for misconceptions
        const enhancedCategoryIds = categoryIds ? [...categoryIds] : [];
        if (!enhancedCategoryIds.includes('myths')) {
            enhancedCategoryIds.push('myths');
        }
        
        // 1. Generate an embedding for the user's query
        const queryEmbedding = await getEmbedding(query);

        // 2. Use efficient pgvector SQL query for maximum performance
        const embeddingStr = `[${queryEmbedding.join(',')}]`;
        
        // Query more candidates than needed to ensure high-quality filtering
        const candidateLimit = maxChunks * 3;
        
        let chunks;
        
        if (enhancedCategoryIds.length > 0) {
            console.log(`🏷️ Including categories: ${enhancedCategoryIds.join(', ')} (myths always included)`);
            // Query with category filtering (including myths)
            chunks = await prisma.$queryRaw`
                SELECT DISTINCT
                  kc.id,
                  kc.content,
                  ki.title,
                  1 - (kc."embeddingData"::vector <=> ${embeddingStr}::vector) as score
                FROM "KnowledgeChunk" kc
                JOIN "KnowledgeItem" ki ON kc."knowledgeItemId" = ki.id  
                JOIN "KnowledgeItemCategory" kic ON ki.id = kic."knowledgeItemId"
                JOIN "KnowledgeCategory" kcat ON kic."knowledgeCategoryId" = kcat.id
                WHERE ki.status = 'READY' 
                  AND kc."embeddingData" IS NOT NULL
                  AND kcat.name = ANY(${enhancedCategoryIds})
                ORDER BY kc."embeddingData"::vector <=> ${embeddingStr}::vector
                LIMIT ${candidateLimit}
            `;
        } else {
            // Query without category filtering (original behavior)
            chunks = await prisma.$queryRaw`
                SELECT
                  kc.id,
                  kc.content,
                  ki.title,
                  1 - (kc."embeddingData"::vector <=> ${embeddingStr}::vector) as score
                FROM "KnowledgeChunk" kc
                JOIN "KnowledgeItem" ki ON kc."knowledgeItemId" = ki.id  
                WHERE ki.status = 'READY' 
                  AND kc."embeddingData" IS NOT NULL
                ORDER BY kc."embeddingData"::vector <=> ${embeddingStr}::vector
                LIMIT ${candidateLimit}
            `;
        }

        const results = (chunks as Array<{
            id: string;
            content: string;
            title: string; 
            score: number;
        }>);

        // 3. Filter the results based on the similarity threshold
        const relevantChunks = results.filter(
            chunk => chunk.score >= similarityThreshold
        );

        if (relevantChunks.length === 0) {
            console.log(`⚠️ No relevant chunks found above threshold ${similarityThreshold}`);
            return [];
        }

        // 4. Take the top 'maxChunks' from the filtered, high-quality results
        const finalResults = relevantChunks.slice(0, maxChunks);
        
        console.log(`✅ Retrieved ${finalResults.length} high-quality chunks (${relevantChunks.length} above threshold)`);
        return finalResults;

    } catch (error) {
        console.error("Error fetching knowledge context:", error);
        // Fallback to JSON similarity search if pgvector fails
        console.log("🔄 Falling back to JSON similarity search...");
        const queryEmbedding = await getEmbedding(query);
        return await fallbackJsonSimilaritySearch(queryEmbedding, maxChunks, similarityThreshold);
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
                        id: true,
                        title: true
                    }
                }
            },
            take: 1000, // Limit for performance
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Calculate similarities
        const similarities = chunks.map(chunk => {
            try {
                const chunkEmbedding = JSON.parse(chunk.embeddingData!) as number[];
                const score = cosineSimilarity(queryEmbedding, chunkEmbedding);
                
                return {
                    id: chunk.id,
                    content: chunk.content,
                    title: chunk.knowledgeItem.title,
                    score: score
                };
            } catch (parseError) {
                console.error('Error parsing embedding data:', parseError);
                return null;
            }
        }).filter(Boolean) as KnowledgeContext[];

        // Sort by similarity and filter by threshold
        const sortedSimilarities = similarities.sort((a, b) => b.score - a.score);
        const relevantChunks = sortedSimilarities.filter(
            chunk => chunk.score >= similarityThreshold
        );

        return relevantChunks.slice(0, maxChunks);

    } catch (error) {
        console.error("Fallback JSON similarity search failed:", error);
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
 * Get knowledge context for specific muscle groups and workout types
 * This function helps the AI prioritize relevant categories based on the workout context
 */
export async function fetchCategoryBasedKnowledge(
  query: string,
  muscleGroups: string[],
  workoutType: 'hypertrophy' | 'strength' | 'endurance' = 'hypertrophy',
  maxChunks: number = 10,
  similarityThreshold: number = 0.7
): Promise<KnowledgeContext[]> {
  try {
    console.log(`🎯 Fetching category-based knowledge for ${muscleGroups.join(', ')} (${workoutType})`);
    
    // Define category mappings based on workout context
    const categoryMap: Record<string, string[]> = {
      // Muscle-specific categories
      'chest': ['chest', 'chest_exercises', 'pushing_movements'],
      'back': ['back', 'back_exercises', 'pulling_movements', 'lats'],
      'shoulders': ['shoulders', 'shoulder_exercises', 'delts', 'pressing_movements'],
      'biceps': ['biceps', 'arm_exercises', 'elbow_flexors'],
      'triceps': ['triceps', 'arm_exercises', 'elbow_extensors'],
      'forearms': ['forearms', 'arm_exercises', 'grip_strength'],
      'quadriceps': ['quadriceps', 'leg_exercises', 'thighs', 'squatting_movements'],
      'hamstrings': ['hamstrings', 'leg_exercises', 'thighs', 'hip_hinge'],
      'glutes': ['glutes', 'leg_exercises', 'hip_extension'],
      'calves': ['calves', 'leg_exercises', 'lower_legs'],
      'abs': ['abs', 'core', 'core_exercises', 'abdominals'],
      
      // Workout type categories
      'hypertrophy': ['hypertrophy_programs', 'hypertrophy_principles', 'muscle_building'],
      'strength': ['strength_training', 'powerlifting', 'max_strength'],
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
      const normalizedMuscle = muscle.toLowerCase().replace(/s$/, ''); // Remove plural 's'
      if (categoryMap[normalizedMuscle]) {
        categoryMap[normalizedMuscle].forEach(cat => targetCategories.add(cat));
      }
    });
    
    const categoryIds = Array.from(targetCategories);
    console.log(`🔍 Searching in categories: ${categoryIds.join(', ')}`);
    
    // Fetch knowledge with category filtering
    const results = await fetchKnowledgeContext(
      query,
      maxChunks,
      similarityThreshold,
      categoryIds
    );
    
    // If category-specific search yields few results, fall back to general search
    if (results.length < maxChunks / 2) {
      console.log(`⚠️ Category search yielded only ${results.length} results, supplementing with general search`);
      const generalResults = await fetchKnowledgeContext(
        query,
        maxChunks - results.length,
        similarityThreshold
      );
      
      // Combine and deduplicate results
      const combinedResults = [...results];
      const existingIds = new Set(results.map(r => r.id));
      
      generalResults.forEach(result => {
        if (!existingIds.has(result.id)) {
          combinedResults.push(result);
        }
      });
      
      return combinedResults;
    }
    
    return results;
  } catch (error) {
    console.error('Error in category-based knowledge fetch:', error);
    // Fall back to general search
    return await fetchKnowledgeContext(query, maxChunks, similarityThreshold);
  }
}

/**
 * Admin function to re-embed missing chunks
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
