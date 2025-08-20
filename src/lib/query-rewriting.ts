import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAIConfiguration } from './gemini';

/**
 * Query rewriting for enhanced vector search
 * 
 * This module uses the Gemini API to rewrite user queries to make them more
 * specific and include additional relevant keywords for better vector search results.
 */

interface QueryRewriteOptions {
  maxRetries?: number;
  enhanceKeywords?: boolean;
  preserveOriginal?: boolean;
  fitnessContext?: boolean;
}

interface QueryRewriteResult {
  originalQuery: string;
  rewrittenQuery: string;
  additionalKeywords: string[];
  success: boolean;
  error?: string;
}

const DEFAULT_OPTIONS: QueryRewriteOptions = {
  maxRetries: 2,
  enhanceKeywords: true,
  preserveOriginal: true,
  fitnessContext: true,
};

/**
 * Rewrite a user query to make it more specific and include relevant keywords
 * for better vector search results.
 * 
 * @param query - Original user query
 * @param options - Query rewriting options
 * @returns Promise<QueryRewriteResult>
 */
export async function rewriteQuery(
  query: string,
  options: QueryRewriteOptions = {}
): Promise<QueryRewriteResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  if (!query || query.trim().length === 0) {
    return {
      originalQuery: query,
      rewrittenQuery: query,
      additionalKeywords: [],
      success: false,
      error: 'Empty query provided'
    };
  }

  const cleanQuery = query.trim();
  
  // For very short queries, add minimal enhancement
  if (cleanQuery.length < 10) {
    return {
      originalQuery: cleanQuery,
      rewrittenQuery: cleanQuery,
      additionalKeywords: [],
      success: true
    };
  }

  try {
    const aiConfig = await getAIConfiguration();
    
    if (!aiConfig || !process.env.GEMINI_API_KEY) {
      return {
        originalQuery: cleanQuery,
        rewrittenQuery: cleanQuery,
        additionalKeywords: [],
        success: false,
        error: 'AI configuration not available'
      };
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: aiConfig.proModelName || 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.3, // Lower temperature for more consistent rewrites
        maxOutputTokens: 200,
      }
    });

    const rewritePrompt = createRewritePrompt(cleanQuery, opts);
    
    let lastError: Error | null = null;
    
    // Retry logic for robustness
    for (let attempt = 1; attempt <= opts.maxRetries!; attempt++) {
      try {
        const result = await model.generateContent(rewritePrompt);
        const response = result.response;
        const rewrittenText = response.text();

        const parsed = parseRewriteResponse(rewrittenText, cleanQuery);
        
        if (parsed.success) {
          return {
            originalQuery: cleanQuery,
            rewrittenQuery: parsed.rewrittenQuery,
            additionalKeywords: parsed.additionalKeywords,
            success: true
          };
        }
        
        lastError = new Error(`Parse failed: ${parsed.error}`);
        
      } catch (error) {
        lastError = error as Error;
        console.warn(`Query rewrite attempt ${attempt} failed:`, error);
        
        if (attempt === opts.maxRetries) {
          break;
        }
        
        // Brief delay before retry
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
      }
    }

    // If all attempts failed, return original query
    return {
      originalQuery: cleanQuery,
      rewrittenQuery: cleanQuery,
      additionalKeywords: [],
      success: false,
      error: lastError?.message || 'Query rewrite failed'
    };

  } catch (error) {
    console.error('Query rewriting error:', error);
    return {
      originalQuery: cleanQuery,
      rewrittenQuery: cleanQuery,
      additionalKeywords: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Create the prompt for query rewriting
 */
function createRewritePrompt(query: string, options: QueryRewriteOptions): string {
  const basePrompt = `You are a fitness and exercise expert helping to rewrite user queries for better search results.

TASK: Rewrite the user's query to be more specific and include relevant fitness keywords.

RULES:
1. Expand abbreviations and add specific terminology
2. Include relevant muscle groups, exercise types, or training concepts
3. Keep the core intent of the original query
4. Add 2-3 relevant keywords that would help find related content
5. Return ONLY a JSON object with this exact format:

{
  "rewritten_query": "the enhanced query with specific fitness terms",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}

EXAMPLES:
User: "chest workout"
Response: {"rewritten_query": "chest muscle hypertrophy training exercises pectoral workout routine", "keywords": ["pectoral", "push exercises", "upper body"]}

User: "how to squat"
Response: {"rewritten_query": "proper squat form technique leg exercise quadriceps glutes", "keywords": ["leg training", "compound movement", "lower body"]}

User: "protein"
Response: {"rewritten_query": "protein intake muscle building nutrition muscle protein synthesis", "keywords": ["muscle growth", "nutrition", "macronutrients"]}`;

  const contextualPrompt = options.fitnessContext 
    ? `${basePrompt}

FOCUS: This is for a fitness and hypertrophy training knowledge base. Emphasize:
- Muscle building and hypertrophy
- Exercise form and technique  
- Training principles and programming
- Nutrition for muscle growth
- Recovery and rest

USER QUERY: "${query}"

Response (JSON only):` 
    : `${basePrompt}

USER QUERY: "${query}"

Response (JSON only):`;

  return contextualPrompt;
}

/**
 * Parse the AI response and extract rewritten query and keywords
 */
function parseRewriteResponse(
  response: string, 
  originalQuery: string
): { success: boolean; rewrittenQuery: string; additionalKeywords: string[]; error?: string } {
  try {
    // Clean the response - remove any markdown formatting
    const cleanResponse = response
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    const parsed = JSON.parse(cleanResponse);
    
    if (!parsed.rewritten_query || typeof parsed.rewritten_query !== 'string') {
      return {
        success: false,
        rewrittenQuery: originalQuery,
        additionalKeywords: [],
        error: 'Missing or invalid rewritten_query field'
      };
    }

    const rewrittenQuery = parsed.rewritten_query.trim();
    const keywords = Array.isArray(parsed.keywords) 
      ? parsed.keywords.filter((k: unknown) => typeof k === 'string' && k.trim().length > 0)
      : [];

    // Validate that the rewritten query is reasonable
    if (rewrittenQuery.length < originalQuery.length * 0.5) {
      return {
        success: false,
        rewrittenQuery: originalQuery,
        additionalKeywords: [],
        error: 'Rewritten query too short'
      };
    }

    if (rewrittenQuery.length > originalQuery.length * 5) {
      return {
        success: false,
        rewrittenQuery: originalQuery,
        additionalKeywords: [],
        error: 'Rewritten query too long'
      };
    }

    return {
      success: true,
      rewrittenQuery,
      additionalKeywords: keywords,
    };

  } catch (error) {
    return {
      success: false,
      rewrittenQuery: originalQuery,
      additionalKeywords: [],
      error: `JSON parse error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Enhanced query rewriting specifically optimized for fitness content
 * with domain-specific enhancements.
 */
export async function rewriteFitnessQuery(query: string): Promise<QueryRewriteResult> {
  return rewriteQuery(query, {
    maxRetries: 2,
    enhanceKeywords: true,
    preserveOriginal: true,
    fitnessContext: true,
  });
}

/**
 * Quick query enhancement for simple cases where full rewriting might be overkill
 */
export function enhanceQueryKeywords(query: string): string {
  const fitnessTermMap: Record<string, string[]> = {
    'chest': ['pectoral', 'upper body', 'push'],
    'back': ['latissimus', 'rhomboids', 'pull'],
    'legs': ['quadriceps', 'hamstrings', 'glutes', 'lower body'],
    'arms': ['biceps', 'triceps', 'upper body'],
    'shoulders': ['deltoids', 'upper body'],
    'abs': ['core', 'abdominals', 'midsection'],
    'cardio': ['cardiovascular', 'endurance', 'aerobic'],
    'strength': ['resistance training', 'muscle building'],
    'workout': ['training', 'exercise routine'],
    'diet': ['nutrition', 'macronutrients'],
    'protein': ['muscle protein synthesis', 'amino acids'],
    'rest': ['recovery', 'muscle repair'],
  };

  let enhancedQuery = query.toLowerCase();
  
  for (const [term, synonyms] of Object.entries(fitnessTermMap)) {
    if (enhancedQuery.includes(term)) {
      // Add the first synonym that's not already in the query
      const newSynonym = synonyms.find(syn => !enhancedQuery.includes(syn));
      if (newSynonym) {
        enhancedQuery += ` ${newSynonym}`;
      }
    }
  }
  
  return enhancedQuery;
}
