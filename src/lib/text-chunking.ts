/**
 * Text chunking utilities for vector embeddings
 * 
 * This module provides functions to split documents into smaller chunks
 * that are suitable for vector embeddings and semantic search.
 */

/**
 * Clean and preprocess text before chunking
 * 
 * @param text Raw text to clean
 * @returns Cleaned text ready for chunking
 */
export function cleanText(text: string): string {
  if (!text) return '';
  
  let cleaned = text;
  
  // Check if text contains HTML and convert it
  if (/<[^>]*>/g.test(text)) {
    cleaned = htmlToText(text);
  }
  
  return cleaned
    // Normalize whitespace
    .replace(/\r\n/g, '\n')  // Windows line endings to Unix
    .replace(/\r/g, '\n')    // Mac line endings to Unix
    .replace(/\t/g, ' ')     // Tabs to spaces
    .replace(/ +/g, ' ')     // Multiple spaces to single space
    
    // Fix common PDF extraction issues
    .replace(/([a-z])([A-Z])/g, '$1 $2')  // Add space between camelCase
    .replace(/([.!?])([A-Z])/g, '$1 $2')  // Add space after sentence endings
    .replace(/(\d+)([A-Z])/g, '$1 $2')    // Add space between number and letter
    
    // Clean up punctuation spacing
    .replace(/\s+([.!?,;:])/g, '$1')      // Remove space before punctuation
    .replace(/([.!?])\s*\n\s*/g, '$1\n\n') // Ensure paragraph breaks after sentences
    
    // Remove excessive newlines but preserve paragraph structure
    .replace(/\n{3,}/g, '\n\n')           // Max 2 consecutive newlines
    .replace(/^\s+|\s+$/g, '');           // Trim start and end
}

/**
 * Convert HTML to plain text
 * 
 * @param html HTML content to convert
 * @returns Plain text content
 */
function htmlToText(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove styles
    .replace(/<br\s*\/?>/gi, '\n') // Convert br to newlines
    .replace(/<\/p>/gi, '\n\n') // Convert closing p to double newlines
    .replace(/<\/div>/gi, '\n') // Convert closing div to newlines
    .replace(/<\/h[1-6]>/gi, '\n\n') // Convert closing headers to double newlines
    .replace(/<li[^>]*>/gi, '• ') // Convert li to bullet points
    .replace(/<\/li>/gi, '\n') // Convert closing li to newlines
    .replace(/<[^>]*>/g, '') // Remove all other HTML tags
    .replace(/&nbsp;/g, ' ') // Convert &nbsp; to spaces
    .replace(/&amp;/g, '&') // Convert &amp; to &
    .replace(/&lt;/g, '<') // Convert &lt; to <
    .replace(/&gt;/g, '>') // Convert &gt; to >
    .replace(/&quot;/g, '"') // Convert &quot; to "
    .replace(/&#39;/g, "'") // Convert &#39; to '
    .replace(/\n{3,}/g, '\n\n') // Limit consecutive newlines to 2
    .trim();
}

/**
 * Enhanced sentence splitting that handles scientific text better
 * 
 * @param text Text to split into sentences
 * @returns Array of sentences
 */
export function splitIntoSentences(text: string): string[] {
  const sentences: string[] = [];
  
  // Enhanced regex that handles abbreviations common in fitness/science
  const sentencePattern = /[.!?]+(?:\s+|$)/g;
  
  // Common abbreviations that shouldn't end sentences
  const abbreviations = /\b(?:Dr|Mr|Mrs|Ms|vs|etc|i\.e|e\.g|rep|reps|max|min|kg|lb|cm|ft|in|sec|vol|no|fig|ref|al|pp)\./gi;
  
  // Replace abbreviations temporarily
  const protectedText = text.replace(abbreviations, (match) => match.replace('.', '§TEMP§'));
  
  let lastIndex = 0;
  let match;
  
  while ((match = sentencePattern.exec(protectedText)) !== null) {
    const sentence = protectedText.slice(lastIndex, match.index + match[0].length)
      .replace(/§TEMP§/g, '.')
      .trim();
    
    if (sentence.length > 10) { // Filter out very short "sentences"
      sentences.push(sentence);
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text if any
  if (lastIndex < protectedText.length) {
    const remaining = protectedText.slice(lastIndex)
      .replace(/§TEMP§/g, '.')
      .trim();
    if (remaining.length > 10) {
      sentences.push(remaining);
    }
  }
  
  return sentences;
}

export interface TextChunk {
  content: string;
  index: number;
  startChar: number;
  endChar: number;
}

export interface ChunkingOptions {
  chunkSize: number;
  chunkOverlap: number;
  preserveSentences: boolean;
  preserveParagraphs: boolean;
  minChunkSize: number;
}

const DEFAULT_CHUNKING_OPTIONS: ChunkingOptions = {
  chunkSize: 512, // Reduced from 1000 for more focused semantic meaning
  chunkOverlap: 100, // Increased from 200 for better context preservation
  preserveSentences: true, // Try to keep sentences intact
  preserveParagraphs: true, // Try to keep paragraphs intact
  minChunkSize: 50 // Reduced minimum to capture more specific concepts
};

/**
 * Split text into chunks for vector embedding
 * 
 * @param text The text to chunk
 * @param options Chunking configuration options
 * @returns Array of text chunks with metadata
 */
export function chunkText(
  text: string, 
  options: Partial<ChunkingOptions> = {}
): TextChunk[] {
  const opts = { ...DEFAULT_CHUNKING_OPTIONS, ...options };
  
  // Step 1: Clean the text
  const cleanedText = cleanText(text);
  
  if (!cleanedText || cleanedText.trim().length < opts.minChunkSize) {
    return [{
      content: cleanedText.trim(),
      index: 0,
      startChar: 0,
      endChar: cleanedText.length
    }];
  }

  // Step 2: For better chunking, split into sentences first
  const sentences = splitIntoSentences(cleanedText);
  
  // Step 3: Group sentences into chunks
  const chunks: TextChunk[] = [];
  let currentChunk = '';
  let currentStartChar = 0;
  let chunkIndex = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const testChunk = currentChunk + (currentChunk ? ' ' : '') + sentence;
    
    // If adding this sentence would exceed chunk size, finalize current chunk
    if (testChunk.length > opts.chunkSize && currentChunk.length >= opts.minChunkSize) {
      chunks.push({
        content: currentChunk.trim(),
        index: chunkIndex,
        startChar: currentStartChar,
        endChar: currentStartChar + currentChunk.length
      });
      
      chunkIndex++;
      
      // Start new chunk with overlap if configured
      if (opts.chunkOverlap > 0 && currentChunk.length > opts.chunkOverlap) {
        const overlapText = currentChunk.slice(-opts.chunkOverlap);
        currentChunk = overlapText + ' ' + sentence;
        currentStartChar = currentStartChar + currentChunk.length - overlapText.length - sentence.length - 1;
      } else {
        currentChunk = sentence;
        currentStartChar = currentStartChar + currentChunk.length;
      }
    } else {
      // Add sentence to current chunk
      currentChunk = testChunk;
    }
  }
  
  // Add final chunk if it has content
  if (currentChunk.trim().length >= opts.minChunkSize) {
    chunks.push({
      content: currentChunk.trim(),
      index: chunkIndex,
      startChar: currentStartChar,
      endChar: currentStartChar + currentChunk.length
    });
  }

  // Fallback to character-based chunking if sentence-based didn't work well
  if (chunks.length === 0) {
    return characterBasedChunking(cleanedText, opts);
  }

  return chunks;
}

/**
 * Fallback character-based chunking for when sentence splitting doesn't work
 */
function characterBasedChunking(text: string, opts: ChunkingOptions): TextChunk[] {
  const chunks: TextChunk[] = [];
  let currentPosition = 0;
  let chunkIndex = 0;

  while (currentPosition < text.length) {
    const endPosition = Math.min(currentPosition + opts.chunkSize, text.length);
    let chunkEnd = endPosition;

    // If we're not at the end of the text, try to find a good breaking point
    if (endPosition < text.length) {
      chunkEnd = findOptimalBreakPoint(
        text,
        currentPosition,
        endPosition,
        opts
      );
    }

    // Extract the chunk
    const chunkContent = text.slice(currentPosition, chunkEnd).trim();
    
    // Only add chunks that meet minimum size requirements
    if (chunkContent.length >= opts.minChunkSize) {
      chunks.push({
        content: chunkContent,
        index: chunkIndex,
        startChar: currentPosition,
        endChar: chunkEnd
      });
      chunkIndex++;
    }

    // Move to the next position with overlap
    currentPosition = Math.max(
      chunkEnd - opts.chunkOverlap,
      currentPosition + 1 // Ensure we always make progress
    );

    // Prevent infinite loops
    if (currentPosition >= chunkEnd) {
      break;
    }
  }

  return chunks;
}

/**
 * Find the optimal break point for a chunk
 * 
 * @param text Full text
 * @param start Start position
 * @param end End position
 * @param options Chunking options
 * @returns Optimal end position for the chunk
 */
function findOptimalBreakPoint(
  text: string,
  start: number,
  end: number,
  options: ChunkingOptions
): number {
  const searchRegion = text.slice(start, end);
  
  // If preserveParagraphs is enabled, look for paragraph breaks
  if (options.preserveParagraphs) {
    const paragraphBreak = searchRegion.lastIndexOf('\n\n');
    if (paragraphBreak > searchRegion.length * 0.5) { // Only if we're not cutting too much
      return start + paragraphBreak + 2; // Include the paragraph break
    }
  }

  // If preserveSentences is enabled, look for sentence endings
  if (options.preserveSentences) {
    const sentencePattern = /[.!?]\s+/g;
    let lastSentenceEnd = -1;
    let match;

    while ((match = sentencePattern.exec(searchRegion)) !== null) {
      // Only consider sentence breaks that are not too early in the chunk
      if (match.index > searchRegion.length * 0.3) {
        lastSentenceEnd = start + match.index + match[0].length;
      }
    }

    if (lastSentenceEnd > start) {
      return lastSentenceEnd;
    }
  }

  // Fallback: look for any whitespace to avoid breaking words
  const spaceIndex = searchRegion.lastIndexOf(' ');
  if (spaceIndex > searchRegion.length * 0.5) {
    return start + spaceIndex;
  }

  // Last resort: break at the original position
  return end;
}

/**
 * Calculate the overlap between two chunks
 * 
 * @param chunk1 First chunk
 * @param chunk2 Second chunk
 * @returns Percentage of overlap (0-1)
 */
export function calculateChunkOverlap(chunk1: TextChunk, chunk2: TextChunk): number {
  const overlapStart = Math.max(chunk1.startChar, chunk2.startChar);
  const overlapEnd = Math.min(chunk1.endChar, chunk2.endChar);
  
  if (overlapStart >= overlapEnd) {
    return 0;
  }

  const overlapLength = overlapEnd - overlapStart;
  const minChunkLength = Math.min(
    chunk1.endChar - chunk1.startChar,
    chunk2.endChar - chunk2.startChar
  );

  return overlapLength / minChunkLength;
}

/**
 * Chunk text specifically optimized for fitness/scientific content
 * 
 * @param text Text to chunk
 * @returns Array of optimized chunks
 */
export function chunkFitnessContent(text: string): TextChunk[] {
  return chunkText(text, {
    chunkSize: 512,      // Updated to improved chunking parameters
    chunkOverlap: 100,   // Updated to improved chunking parameters  
    preserveSentences: true,
    preserveParagraphs: true,
    minChunkSize: 50     // Updated to match new defaults
  });
}

/**
 * Estimate the number of chunks that will be created
 * 
 * @param text Text to analyze
 * @param options Chunking options
 * @returns Estimated number of chunks
 */
export function estimateChunkCount(
  text: string, 
  options: Partial<ChunkingOptions> = {}
): number {
  const opts = { ...DEFAULT_CHUNKING_OPTIONS, ...options };
  
  if (!text || text.length < opts.minChunkSize) {
    return 1;
  }

  // Rough estimation based on chunk size and overlap
  const effectiveChunkSize = opts.chunkSize - opts.chunkOverlap;
  return Math.ceil(text.length / effectiveChunkSize);
}

/**
 * Validate chunk quality and provide feedback
 * 
 * @param chunks Array of chunks to validate
 * @returns Validation results and suggestions
 */
export function validateChunks(chunks: TextChunk[]): {
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
} {
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Check for very small chunks
  const smallChunks = chunks.filter(chunk => chunk.content.length < 50);
  if (smallChunks.length > 0) {
    warnings.push(`${smallChunks.length} chunks are very small (<50 characters)`);
    suggestions.push('Consider increasing minimum chunk size or merging small chunks');
  }

  // Check for very large chunks
  const largeChunks = chunks.filter(chunk => chunk.content.length > 2000);
  if (largeChunks.length > 0) {
    warnings.push(`${largeChunks.length} chunks are very large (>2000 characters)`);
    suggestions.push('Consider reducing chunk size for better semantic granularity');
  }

  // Check for gaps in coverage
  for (let i = 1; i < chunks.length; i++) {
    const gap = chunks[i].startChar - chunks[i - 1].endChar;
    if (gap > 10) {
      warnings.push(`Gap detected between chunks ${i - 1} and ${i}`);
      suggestions.push('Review text processing to ensure complete coverage');
      break;
    }
  }

  return {
    isValid: warnings.length === 0,
    warnings,
    suggestions
  };
}
