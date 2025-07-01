/**
 * Vector embedding utilities using Google Gemini's embedding model
 * 
 * This module provides functions to create embeddings for text chunks
 * and perform semantic similarity operations.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini client for embeddings
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface EmbeddingResult {
  embedding: number[];
  text: string;
  metadata?: Record<string, unknown>;
}

export interface SimilarityResult {
  score: number;
  text: string;
  metadata?: Record<string, unknown>;
}

/**
 * Generate embedding for a text using Gemini's embedding model
 * 
 * @param text Text to embed
 * @param metadata Optional metadata to include with the embedding
 * @returns Promise<EmbeddingResult>
 */
export async function generateEmbedding(
  text: string,
  metadata?: Record<string, unknown>
): Promise<EmbeddingResult> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty for embedding generation');
    }

    // Use Gemini's text embedding model
    const model = genAI.getGenerativeModel({ 
      model: 'text-embedding-004' // Gemini's latest embedding model
    });

    const result = await model.embedContent(text);
    
    if (!result.embedding || !result.embedding.values) {
      throw new Error('Failed to generate embedding - no values returned');
    }

    return {
      embedding: result.embedding.values,
      text: text,
      metadata: metadata || {}
    };

  } catch (error) {
    console.error('Error generating embedding:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('API_KEY')) {
        throw new Error('Gemini API key is not properly configured');
      } else if (error.message.includes('quota') || error.message.includes('limit')) {
        throw new Error('API quota exceeded. Please try again later.');
      } else if (error.message.includes('model')) {
        throw new Error('Embedding model is not available. Please check the model name.');
      }
    }
    
    throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate embeddings for multiple text chunks in batch
 * 
 * @param texts Array of texts to embed
 * @param metadata Optional metadata for each text
 * @param batchSize Number of texts to process in each batch
 * @returns Promise<EmbeddingResult[]>
 */
export async function generateEmbeddingsBatch(
  texts: string[],
  metadata?: Record<string, unknown>[],
  batchSize: number = 10
): Promise<EmbeddingResult[]> {
  const results: EmbeddingResult[] = [];
  
  // Process in batches to avoid rate limits
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchMetadata = metadata ? metadata.slice(i, i + batchSize) : undefined;
    
    // Process batch in parallel
    const batchPromises = batch.map((text, index) =>
      generateEmbedding(
        text,
        batchMetadata ? batchMetadata[index] : undefined
      )
    );
    
    try {
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Add delay between batches to respect rate limits
      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`Error processing batch ${i / batchSize + 1}:`, error);
      
      // Try to process failed batch items individually
      for (let j = 0; j < batch.length; j++) {
        try {
          const result = await generateEmbedding(
            batch[j],
            batchMetadata ? batchMetadata[j] : undefined
          );
          results.push(result);
        } catch (itemError) {
          console.error(`Failed to process text ${i + j}:`, itemError);
          // Add a placeholder result to maintain array consistency
          results.push({
            embedding: new Array(768).fill(0), // Gemini embeddings are 768-dimensional
            text: batch[j],
            metadata: { error: 'Failed to generate embedding' }
          });
        }
        
        // Small delay between individual retries
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
  }
  
  return results;
}

/**
 * Calculate cosine similarity between two vectors
 * 
 * @param vectorA First vector
 * @param vectorB Second vector
 * @returns Cosine similarity score (0-1, where 1 is most similar)
 */
export function cosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length !== vectorB.length) {
    throw new Error('Vectors must have the same dimension');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Find the most similar embeddings to a query embedding
 * 
 * @param queryEmbedding Query vector
 * @param candidates Array of candidate embeddings
 * @param topK Number of top results to return
 * @returns Array of similarity results sorted by score (descending)
 */
export function findMostSimilar(
  queryEmbedding: number[],
  candidates: EmbeddingResult[],
  topK: number = 5
): SimilarityResult[] {
  const similarities = candidates.map(candidate => ({
    score: cosineSimilarity(queryEmbedding, candidate.embedding),
    text: candidate.text,
    metadata: candidate.metadata
  }));

  // Sort by similarity score (descending) and return top K
  return similarities
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * Convert embedding array to a format suitable for database storage
 * 
 * @param embedding Embedding vector
 * @returns String representation for pgvector
 */
export function embeddingToDbFormat(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}

/**
 * Parse embedding from database format back to number array
 * 
 * @param dbEmbedding String representation from database
 * @returns Number array
 */
export function embeddingFromDbFormat(dbEmbedding: string): number[] {
  try {
    // Remove brackets and split by comma
    const cleanString = dbEmbedding.replace(/^\[|\]$/g, '');
    return cleanString.split(',').map(num => parseFloat(num.trim()));
  } catch (error) {
    console.error('Error parsing embedding from database:', error);
    throw new Error('Invalid embedding format in database');
  }
}

/**
 * Validate that an embedding has the correct dimensions
 * 
 * @param embedding Embedding to validate
 * @param expectedDimensions Expected number of dimensions (default: 768 for Gemini)
 * @returns Boolean indicating if embedding is valid
 */
export function validateEmbedding(
  embedding: number[], 
  expectedDimensions: number = 768
): boolean {
  if (!Array.isArray(embedding)) {
    return false;
  }

  if (embedding.length !== expectedDimensions) {
    return false;
  }

  // Check if all values are numbers
  return embedding.every(value => typeof value === 'number' && !isNaN(value));
}

/**
 * Generate a query embedding for semantic search
 * This is a convenience function for generating embeddings specifically for search queries
 * 
 * @param query Search query text
 * @returns Promise<number[]> Query embedding vector
 */
export async function generateQueryEmbedding(query: string): Promise<number[]> {
  if (!query || query.trim().length === 0) {
    throw new Error('Query cannot be empty');
  }

  // Optimize query for better semantic search
  const optimizedQuery = optimizeSearchQuery(query);
  
  const result = await generateEmbedding(optimizedQuery);
  return result.embedding;
}

/**
 * Optimize a search query for better semantic matching
 * 
 * @param query Original query
 * @returns Optimized query
 */
function optimizeSearchQuery(query: string): string {
  // Add context for better fitness/training semantic matching
  const fitnessKeywords = [
    'training', 'exercise', 'workout', 'muscle', 'strength', 'fitness',
    'hypertrophy', 'lifting', 'bodybuilding', 'powerlifting'
  ];
  
  const queryLower = query.toLowerCase();
  const hasfitnessContext = fitnessKeywords.some(keyword => 
    queryLower.includes(keyword)
  );

  if (!hasfitnessContext && query.length < 50) {
    // Add general fitness context for short queries without fitness terms
    return `${query} fitness training exercise`;
  }

  return query;
}

/**
 * Calculate embedding statistics for analysis and debugging
 * 
 * @param embeddings Array of embeddings to analyze
 * @returns Statistics object
 */
export function calculateEmbeddingStats(embeddings: number[][]): {
  mean: number[];
  std: number[];
  min: number[];
  max: number[];
  dimensions: number;
  count: number;
} {
  if (embeddings.length === 0) {
    throw new Error('Cannot calculate stats for empty embedding array');
  }

  const dimensions = embeddings[0].length;
  const count = embeddings.length;
  
  // Initialize arrays
  const mean = new Array(dimensions).fill(0);
  const min = new Array(dimensions).fill(Infinity);
  const max = new Array(dimensions).fill(-Infinity);

  // Calculate mean, min, max
  for (const embedding of embeddings) {
    for (let i = 0; i < dimensions; i++) {
      mean[i] += embedding[i];
      min[i] = Math.min(min[i], embedding[i]);
      max[i] = Math.max(max[i], embedding[i]);
    }
  }

  // Finalize mean
  for (let i = 0; i < dimensions; i++) {
    mean[i] /= count;
  }

  // Calculate standard deviation
  const std = new Array(dimensions).fill(0);
  for (const embedding of embeddings) {
    for (let i = 0; i < dimensions; i++) {
      std[i] += Math.pow(embedding[i] - mean[i], 2);
    }
  }

  for (let i = 0; i < dimensions; i++) {
    std[i] = Math.sqrt(std[i] / count);
  }

  return { mean, std, min, max, dimensions, count };
}
