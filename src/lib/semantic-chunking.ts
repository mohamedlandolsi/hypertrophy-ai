import nlp from 'compromise';

interface AnalyzedSentence {
  text: string;
  index: number;
  length: number;
  topics: string[];
  entities: string[];
  nouns: string[];
  verbs: string[];
}

/**
 * Semantic chunking strategy that groups sentences based on semantic similarity
 * and topic coherence using the compromise NLP library.
 * 
 * @param text - Input text to be chunked
 * @param options - Chunking configuration options
 * @returns Array of semantically coherent text chunks
 */
export function semanticChunking(
  text: string,
  options: {
    maxChunkSize?: number;
    minChunkSize?: number;
    overlapRatio?: number;
    preferredChunkSize?: number;
  } = {}
): string[] {
  const {
    maxChunkSize = 1000,
    minChunkSize = 200,
    overlapRatio = 0.1,
    preferredChunkSize = 600,
  } = options;

  // Clean and normalize the input text
  const cleanText = text.replace(/\s+/g, ' ').trim();
  if (!cleanText) return [];

  // Parse text with compromise
  const doc = nlp(cleanText);
  
  // Extract sentences
  const sentences = doc.sentences().out('array') as string[];
  if (sentences.length === 0) return [cleanText];

  // If text is small enough, return as single chunk
  if (cleanText.length <= preferredChunkSize) {
    return [cleanText];
  }

  // Analyze sentences for topics and entities
  const analyzedSentences = sentences.map((sentence, index) => {
    const sentenceDoc = nlp(sentence);
    return {
      text: sentence,
      index,
      length: sentence.length,
      topics: extractTopics(sentenceDoc),
      entities: extractEntities(sentenceDoc),
      nouns: sentenceDoc.nouns().out('array'),
      verbs: sentenceDoc.verbs().out('array'),
    } as AnalyzedSentence;
  });

  // Group sentences into semantic chunks
  const chunks: string[] = [];
  let currentChunk: AnalyzedSentence[] = [];
  let currentLength = 0;

  for (let i = 0; i < analyzedSentences.length; i++) {
    const sentence = analyzedSentences[i];
    
    // Check if adding this sentence would exceed max chunk size
    if (currentLength + sentence.length > maxChunkSize && currentChunk.length > 0) {
      // Finalize current chunk
      chunks.push(createChunkText(currentChunk));
      
      // Start new chunk with overlap if beneficial
      const overlapSize = Math.floor(currentChunk.length * overlapRatio);
      currentChunk = overlapSize > 0 ? currentChunk.slice(-overlapSize) : [];
      currentLength = currentChunk.reduce((sum, s) => sum + s.length, 0);
    }

    // Add sentence to current chunk
    currentChunk.push(sentence);
    currentLength += sentence.length;

    // Check for semantic breaks
    if (currentLength >= minChunkSize && shouldBreakAtSentence(analyzedSentences, i)) {
      // Look ahead to see if next sentences are semantically different
      const nextSentences = analyzedSentences.slice(i + 1, i + 4);
      if (nextSentences.length > 0 && hasSemanticShift(currentChunk, nextSentences)) {
        chunks.push(createChunkText(currentChunk));
        currentChunk = [];
        currentLength = 0;
      }
    }
  }

  // Add remaining sentences as final chunk
  if (currentChunk.length > 0) {
    chunks.push(createChunkText(currentChunk));
  }

  // Filter out chunks that are too small unless they're the only chunk
  return chunks.length > 1 
    ? chunks.filter(chunk => chunk.length >= minChunkSize)
    : chunks;
}

/**
 * Extract topic-related terms from a sentence using NLP analysis
 */
function extractTopics(doc: ReturnType<typeof nlp>): string[] {
  const topics: string[] = [];
  
  // Extract key nouns and noun phrases
  const nouns = doc.nouns().out('array');
  const nounPhrases = doc.match('#Noun+ #Noun').out('array');
  
  // Extract fitness-specific terms
  const fitnessTerms = doc.match('#Noun').if('#Exercise|#Muscle|#Training|#Workout').out('array');
  
  topics.push(...nouns, ...nounPhrases, ...fitnessTerms);
  
  return [...new Set(topics)].filter(topic => topic.length > 2);
}

/**
 * Extract named entities and important terms
 */
function extractEntities(doc: ReturnType<typeof nlp>): string[] {
  const entities: string[] = [];
  
  // Extract people, places, organizations
  entities.push(...doc.people().out('array'));
  entities.push(...doc.places().out('array'));
  entities.push(...doc.organizations().out('array'));
  
  // Extract numbers and measurements (important for fitness content)
  entities.push(...doc.match('#Value').out('array'));
  
  return [...new Set(entities)];
}

/**
 * Determine if we should break at a specific sentence boundary
 */
function shouldBreakAtSentence(sentences: AnalyzedSentence[], index: number): boolean {
  if (index >= sentences.length - 1) return true;
  
  const current = sentences[index];
  const next = sentences[index + 1];
  
  // Break at paragraph indicators
  if (current.text.endsWith('\n') || next.text.startsWith('\n')) {
    return true;
  }
  
  // Break at topic transitions (different dominant topics)
  const currentTopics = new Set(current.topics);
  const nextTopics = new Set(next.topics);
  const topicOverlap = [...currentTopics].filter(topic => nextTopics.has(topic)).length;
  const totalTopics = currentTopics.size + nextTopics.size;
  
  if (totalTopics > 0 && topicOverlap / totalTopics < 0.3) {
    return true;
  }
  
  return false;
}

/**
 * Check if there's a semantic shift between current chunk and upcoming sentences
 */
function hasSemanticShift(currentChunk: AnalyzedSentence[], nextSentences: AnalyzedSentence[]): boolean {
  if (currentChunk.length === 0 || nextSentences.length === 0) return false;
  
  // Collect topics from current chunk
  const currentTopics = new Set(
    currentChunk.flatMap(s => s.topics)
  );
  
  // Collect topics from next sentences
  const nextTopics = new Set(
    nextSentences.flatMap(s => s.topics)
  );
  
  // Calculate semantic similarity
  const overlap = [...currentTopics].filter(topic => nextTopics.has(topic)).length;
  const total = currentTopics.size + nextTopics.size;
  
  // Consider it a shift if less than 40% topic overlap
  return total > 0 && overlap / total < 0.4;
}

/**
 * Create chunk text from analyzed sentences
 */
function createChunkText(sentences: AnalyzedSentence[]): string {
  return sentences.map(s => s.text).join(' ').trim();
}

/**
 * Enhanced semantic chunking with fitness domain awareness
 * Optimized for fitness and exercise content
 */
export function fitnessSemanticChunking(text: string): string[] {
  return semanticChunking(text, {
    maxChunkSize: 800,
    minChunkSize: 150,
    overlapRatio: 0.15,
    preferredChunkSize: 500,
  });
}
