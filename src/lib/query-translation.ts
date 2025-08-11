/**
 * Query Translation and Expansion Module
 * 
 * This module handles:
 * 1. Language detection for queries
 * 2. Translation of non-English queries to English for vector search
 * 3. Query expansion for broad queries to include core fitness principles
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Cache for translations to avoid repeated API calls
const translationCache = new Map<string, string>();
const TRANSLATION_CACHE_MAX_SIZE = 1000;

/**
 * Detects if text is in Arabic
 */
function isArabicQuery(text: string): boolean {
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;
  const arabicMatches = text.match(arabicRegex);
  const arabicCharCount = arabicMatches ? arabicMatches.length : 0;
  const totalChars = text.replace(/\s/g, '').length;
  const arabicRatio = totalChars > 0 ? arabicCharCount / totalChars : 0;
  return arabicRatio > 0.3;
}

/**
 * Detects if text is in French
 */
function isFrenchQuery(text: string): boolean {
  const frenchIndicators = [
    'quel', 'quelle', 'comment', 'pourquoi', 'où', 'quand', 'qui', 'que',
    'est-ce', 'c\'est', 'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles',
    'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'à', 'au', 'aux',
    'entraînement', 'exercice', 'muscle', 'fitness', 'sport', 'poids', 'répétitions'
  ];
  
  const lowerText = text.toLowerCase();
  const frenchMatches = frenchIndicators.filter(word => lowerText.includes(word));
  return frenchMatches.length >= 2;
}

/**
 * Detects if the query is in English
 */
function isEnglishQuery(text: string): boolean {
  return !isArabicQuery(text) && !isFrenchQuery(text);
}

/**
 * Translates a query to English for vector search compatibility
 */
export async function translateQueryToEnglish(query: string): Promise<string> {
  // Return early if already in English
  if (isEnglishQuery(query)) {
    return query;
  }

  // Check cache first
  if (translationCache.has(query)) {
    return translationCache.get(query)!;
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    let sourceLanguage = 'unknown';
    if (isArabicQuery(query)) {
      sourceLanguage = 'Arabic';
    } else if (isFrenchQuery(query)) {
      sourceLanguage = 'French';
    }

    const prompt = `Translate this ${sourceLanguage} fitness/workout query to English. Keep it concise and maintain the original meaning. Only return the English translation, nothing else:

Query: "${query}"

English translation:`;

    const result = await model.generateContent(prompt);
    const translation = result.response.text().trim();

    // Cache the translation
    if (translationCache.size >= TRANSLATION_CACHE_MAX_SIZE) {
      // Clear oldest entries to prevent memory issues
      const firstKey = translationCache.keys().next().value;
      if (firstKey) {
        translationCache.delete(firstKey);
      }
    }
    translationCache.set(query, translation);

    console.log(`🌐 Translated "${query}" → "${translation}"`);
    return translation;

  } catch (error) {
    console.error('Translation error:', error);
    // Fallback: return original query if translation fails
    return query;
  }
}

/**
 * Semantic mapping layer that bridges the gap between common user terms
 * and specific technical terms used in the knowledge base
 */
export function applySemanticMapping(query: string): string {
  const queryLower = query.toLowerCase();
  let enhancedQuery = query;
  
  // Define mappings from common terms to knowledge base's specific terms
  const semanticMap: Record<string, string[]> = {
    // Body regions to specific muscles and training terms
    'lower body': ['quadriceps', 'hamstrings', 'glutes', 'calves', 'leg training', 'squats', 'deadlifts', 'leg press', 'lunges'],
    'lower': ['quadriceps', 'hamstrings', 'glutes', 'calves', 'leg training', 'squats', 'deadlifts'], // Handle "lower" alone
    'legs': ['quadriceps', 'hamstrings', 'glutes', 'calves', 'leg training', 'squats', 'deadlifts', 'leg press'],
    'upper body': ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'arm training', 'pectorals', 'latissimus dorsi'],
    'upper': ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'pectorals', 'latissimus dorsi'], // Handle "upper" alone
    
    // Specific muscle groups to technical terms
    'arms': ['biceps', 'triceps', 'brachialis', 'forearms', 'arm training', 'curls', 'extensions'],
    'chest': ['pectorals', 'pecs', 'incline press', 'chest fly', 'bench press', 'pectoral training'],
    'back': ['latissimus dorsi', 'lats', 'rhomboids', 'traps', 'rows', 'pulldowns', 'pull-ups', 'back training'],
    'shoulders': ['deltoids', 'delts', 'shoulder press', 'lateral raises', 'rear delts', 'shoulder training'],
    
    // Specific leg muscles
    'quads': ['quadriceps', 'vastus lateralis', 'vastus medialis', 'rectus femoris', 'leg extensions'],
    'hamstrings': ['biceps femoris', 'semitendinosus', 'semimembranosus', 'leg curls', 'romanian deadlifts'],
    'glutes': ['gluteus maximus', 'gluteus medius', 'gluteus minimus', 'hip thrusts', 'glute bridges'],
    'calves': ['gastrocnemius', 'soleus', 'calf raises', 'standing calf raises', 'seated calf raises'],
    
    // Training splits to specific components
    'push day': ['chest', 'shoulders', 'triceps', 'bench press', 'shoulder press', 'tricep extensions'],
    'pull day': ['back', 'biceps', 'rows', 'pull-ups', 'pulldowns', 'curls', 'latissimus dorsi'],
    'leg day': ['quadriceps', 'hamstrings', 'glutes', 'calves', 'squats', 'deadlifts', 'leg press'],
    
    // Training goals to specific methods
    'muscle growth': ['hypertrophy', 'muscle building', 'rep ranges', 'time under tension', 'progressive overload'],
    'strength': ['powerlifting', 'maximal strength', 'low reps', 'heavy weight', 'compound movements'],
    'endurance': ['muscular endurance', 'high reps', 'circuit training', 'metabolic training'],
    
    // Exercise categories to specific exercises
    'compound': ['squats', 'deadlifts', 'bench press', 'rows', 'overhead press', 'pull-ups'],
    'isolation': ['bicep curls', 'tricep extensions', 'leg extensions', 'leg curls', 'lateral raises'],
    
    // Equipment-specific mappings
    'dumbbells': ['dumbbell exercises', 'unilateral training', 'stabilization', 'free weights'],
    'barbells': ['barbell exercises', 'bilateral training', 'compound movements', 'heavy loading'],
    'machines': ['machine exercises', 'isolation', 'safety', 'controlled movement'],
    
    // Training frequency terms
    'frequency': ['training frequency', 'sessions per week', 'recovery time', 'workout scheduling'],
    'volume': ['training volume', 'sets and reps', 'weekly volume', 'progression'],
    'intensity': ['training intensity', 'load', 'weight selection', 'effort level']
  };
  
  // Apply semantic mappings
  const appliedMappings: string[] = [];
  
  for (const [commonTerm, specificTerms] of Object.entries(semanticMap)) {
    if (queryLower.includes(commonTerm)) {
      // Add the specific terms to enhance the query
      const termsToAdd = specificTerms.slice(0, 6); // Limit to prevent query bloat
      enhancedQuery += ` ${termsToAdd.join(' ')}`;
      appliedMappings.push(commonTerm);
    }
  }
  
  if (appliedMappings.length > 0) {
    console.log(`🧠 Semantic mapping applied for: [${appliedMappings.join(', ')}]`);
    console.log(`📝 Enhanced query: "${enhancedQuery}"`);
  }
  
  return enhancedQuery;
}

/**
 * Expands broad queries to include core fitness principles
 */
export async function expandQuery(query: string): Promise<string[]> {
  const lowerQuery = query.toLowerCase();
  
  // Define patterns for broad queries that need expansion
  const broadPatterns = [
    // Workout requests
    /\b(workout|training|exercise|routine)\b/,
    // Body part requests without specificity
    /\b(chest|back|legs|arms|shoulders|abs)\b.*\b(workout|training|exercise)\b/,
    // General fitness questions
    /\b(how to|best way|optimal|effective)\b.*\b(build|gain|lose|train)\b/,
    // Split requests
    /\b(push|pull|upper|lower)\b.*\b(day|workout|split)\b/
  ];

  const isBroadQuery = broadPatterns.some(pattern => pattern.test(lowerQuery));
  
  if (!isBroadQuery) {
    return [query]; // Return original query if not broad
  }

  console.log(`🔄 Expanding broad query: "${query}"`);

  // Select relevant expansion terms based on query content
  const relevantExpansions: string[] = [];
  
  if (/\b(hypertrophy|muscle|growth|size|mass)\b/i.test(query)) {
    relevantExpansions.push('optimal rep ranges', 'hypertrophy training', 'progressive overload');
  }
  
  if (/\b(strength|strong|1rm|max)\b/i.test(query)) {
    relevantExpansions.push('strength training fundamentals', 'progressive overload');
  }
  
  if (/\b(workout|routine|program|split)\b/i.test(query)) {
    relevantExpansions.push('training frequency', 'exercise selection principles', 'ideal rest periods');
  }
  
  // If no specific matches, add general principles
  if (relevantExpansions.length === 0) {
    relevantExpansions.push('optimal rep ranges', 'ideal rest periods', 'progressive overload');
  }

  // Combine original query with relevant expansions
  const expandedQueries = [query, ...relevantExpansions.slice(0, 3)]; // Limit to 3 additional terms
  
  console.log(`✅ Expanded to ${expandedQueries.length} queries:`, expandedQueries);
  return expandedQueries;
}

/**
 * Complete query processing: translation + semantic mapping + expansion
 */
export async function processQueryForRAG(originalQuery: string): Promise<{
  originalQuery: string;
  translatedQuery: string;
  semanticallyMappedQuery: string;
  expandedQueries: string[];
  isTranslated: boolean;
}> {
  console.log(`🔄 Processing query for RAG: "${originalQuery}"`);
  
  // Step 1: Translate to English if needed
  const translatedQuery = await translateQueryToEnglish(originalQuery);
  const isTranslated = translatedQuery !== originalQuery;
  
  // Step 2: Apply semantic mapping to bridge user terms with knowledge base terms
  const semanticallyMappedQuery = applySemanticMapping(translatedQuery);
  
  // Step 3: Expand the semantically mapped query
  const expandedQueries = await expandQuery(semanticallyMappedQuery);
  
  const result = {
    originalQuery,
    translatedQuery,
    semanticallyMappedQuery,
    expandedQueries,
    isTranslated
  };
  
  console.log(`✅ Query processing complete:`, {
    original: originalQuery,
    translated: translatedQuery,
    semanticallyMapped: semanticallyMappedQuery !== translatedQuery ? semanticallyMappedQuery : 'no mapping applied',
    expanded: expandedQueries.length,
    isTranslated
  });
  
  return result;
}
