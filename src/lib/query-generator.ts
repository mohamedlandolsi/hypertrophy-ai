/**
 * Multi-Query Retrieval System - Query Generator
 * 
 * This module generates sub-queries from user input to enable comprehensive 
 * context retrieval from multiple relevant documents.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const subQueryGenerationPrompt = `
You are an expert query analyzer for a fitness AI. Your task is to decompose a user's question into a series of more specific, self-contained questions that can be used to retrieve relevant documents from a knowledge base.

Based on the user's question below, generate up to 4 distinct questions that cover the key aspects of a comprehensive answer (like exercise selection, volume, frequency, technique, and programming).

RULES:
- Return the questions as a JSON array of strings.
- Do not number the questions.
- The questions should be phrased as if a user is asking them.
- Focus on different aspects: exercises, volume/sets/reps, frequency, technique, programming
- Keep questions concise and specific
- Avoid overly similar questions

Examples:
- User asks "how to grow my back" → ["what are the best exercises for back growth", "what is the optimal training volume for lats", "how to program rows and pulldowns effectively", "what is the ideal frequency for back training"]
- User asks "how to train chest" → ["what are the most effective chest exercises", "what volume and rep ranges work best for chest growth", "how often should I train chest per week", "what is proper chest exercise technique"]

User's question: "{userQuery}"

Return only the JSON array, no other text.
`;

/**
 * Generates sub-queries from a user's main query to enable comprehensive retrieval
 */
export async function generateSubQueries(userQuery: string): Promise<string[]> {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    
    // Use a fast model for query generation
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash-latest',
      generationConfig: {
        temperature: 0.3, // Lower temperature for more consistent output
        maxOutputTokens: 500, // Limit tokens for efficiency
      }
    });
    
    const prompt = subQueryGenerationPrompt.replace('{userQuery}', userQuery);

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Clean and parse the JSON response
    const jsonString = responseText.replace(/```json|```/g, '').trim();
    let queries: string[];
    
    try {
      queries = JSON.parse(jsonString);
    } catch (parseError) {
      console.warn('Failed to parse sub-queries JSON, using fallback:', parseError);
      // Fallback: try to extract questions from text
      const lines = responseText.split('\n').filter(line => line.trim());
      queries = lines
        .filter(line => line.includes('?') || line.match(/^["\'].*["\']$/))
        .map(line => line.replace(/^["\']|["\']$/g, '').trim())
        .slice(0, 4);
    }

    // Ensure queries is an array
    if (!Array.isArray(queries)) {
      console.warn('Sub-queries response is not an array, using fallback');
      return [userQuery];
    }

    // Add the original query to the list to ensure it's always included
    const allQueries = [userQuery, ...queries];
    
    // Remove duplicates and limit to reasonable number
    const uniqueQueries = [...new Set(allQueries)].slice(0, 5);
    
    return uniqueQueries;
    
  } catch (error) {
    console.error('❌ Error generating sub-queries:', error);
    // Fallback to just the original query if generation fails
    return [userQuery];
  }
}

/**
 * Determines if a query would benefit from multi-query retrieval
 * Simple heuristics to avoid unnecessary sub-query generation for very specific questions
 */
export function shouldUseMultiQuery(userQuery: string): boolean {
  const query = userQuery.toLowerCase();
  
  // Skip multi-query for very specific questions
  const specificPatterns = [
    /what is.*exactly/,
    /define/,
    /definition of/,
    /how many.*in/,
    /when was/,
    /who is/,
    /which exercise.*specifically/
  ];
  
  if (specificPatterns.some(pattern => pattern.test(query))) {
    return false;
  }
  
  // Use multi-query for broad training questions
  const broadPatterns = [
    /how to train/,
    /how to build/,
    /how to grow/,
    /best.*for.*muscle/,
    /workout.*for/,
    /training.*program/,
    /muscle.*growth/,
    /hypertrophy/
  ];
  
  return broadPatterns.some(pattern => pattern.test(query)) || query.split(' ').length <= 5;
}
