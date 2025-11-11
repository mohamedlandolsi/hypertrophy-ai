// src/lib/vector-search.ts

import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from './prisma';

// Define the structure of our knowledge context
export interface KnowledgeContext {
    content: string;
    knowledgeId: string;
    title: string;
    similarity: number;
    chunkIndex: number;
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
 * This is the primary RAG function that replaces the complex multi-layered approach
 * @param query - The user's message/question.
 * @param maxChunks - The maximum number of chunks to return.
 * @param similarityThreshold - The minimum similarity score for a chunk to be considered relevant.
 * @returns A promise that resolves to an array of KnowledgeContext objects.
 */
export async function fetchKnowledgeContext(
    query: string,
    maxChunks: number,
    similarityThreshold: number,
): Promise<KnowledgeContext[]> {
    try {
        if (process.env.NODE_ENV === 'development') { console.log(`🚀 Starting vector search for "${query}" with threshold ${similarityThreshold}`); }
        
        // 1. Generate an embedding for the user's query
        const queryEmbedding = await getEmbedding(query);

        // 2. Use efficient pgvector SQL query for maximum performance
        const embeddingStr = `[${queryEmbedding.join(',')}]`;
        
        // Query more candidates than needed to ensure high-quality filtering
        const candidateLimit = maxChunks * 3;
        
        const chunks = await prisma.$queryRaw`
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
            LIMIT ${candidateLimit}
          `;

        const results = (chunks as Array<{
            content: string;
            knowledgeId: string;
            title: string; 
            similarity: number;
            chunkIndex: number;
        }>);

        // 3. Filter the results based on the similarity threshold
        const relevantChunks = results.filter(
            chunk => chunk.similarity >= similarityThreshold
        );

        if (relevantChunks.length === 0) {
            if (process.env.NODE_ENV === 'development') { console.log(`⚠️ No relevant chunks found above threshold ${similarityThreshold}`); }
            return [];
        }

        // 4. Take the top 'maxChunks' from the filtered, high-quality results
        const finalResults = relevantChunks.slice(0, maxChunks);
        
        if (process.env.NODE_ENV === 'development') { console.log(`✅ Retrieved ${finalResults.length} high-quality chunks (${relevantChunks.length} above threshold)`); }
        return finalResults;

    } catch (error) {
        console.error("Error fetching knowledge context:", error);
        // Fallback to JSON similarity search if pgvector fails
        if (process.env.NODE_ENV === 'development') { console.log("🔄 Falling back to JSON similarity search..."); }
        const queryEmbedding = await getEmbedding(query);
        return await fallbackJsonSimilaritySearch(queryEmbedding, maxChunks, similarityThreshold);
    }
}

/**
 * Fallback similarity search using JSON embeddings (for systems without pgvector)
 */
async function fallbackJsonSimilaritySearch(
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
                const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);
                
                return {
                    content: chunk.content,
                    knowledgeId: chunk.knowledgeItem.id,
                    title: chunk.knowledgeItem.title,
                    similarity: similarity,
                    chunkIndex: chunk.chunkIndex
                };
            } catch (parseError) {
                console.error('Error parsing embedding data:', parseError);
                return null;
            }
        }).filter(Boolean) as KnowledgeContext[];

        // Sort by similarity and filter by threshold
        const sortedSimilarities = similarities.sort((a, b) => b.similarity - a.similarity);
        const relevantChunks = sortedSimilarities.filter(
            chunk => chunk.similarity >= similarityThreshold
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
