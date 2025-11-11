/**
 * Enhanced Document Chunkin  knowledgeItemId?: string; // Made optional and marked as potentially unused
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _knowledgeItemId?: string; // Alternative name to indicate it may be unused with Structured Processing
 * 
 * This module provides intelligent document chunking that preserves
 * structure, metadata, and semantic coherence for better RAG performance.
 */

export interface StructuredChunk {
  content: string;
  chunkIndex: number;
  metadata: ChunkMetadata;
  structuralType: 'header' | 'paragraph' | 'list' | 'table' | 'quote' | 'mixed';
  contextBefore?: string; // Previous section for continuity
  contextAfter?: string;  // Next section for continuity
}

export interface ChunkMetadata {
  sourceDocument: string;
  section?: string;
  subsection?: string;
  pageNumber?: number;
  hasStructuredContent: boolean;
  importance: 'high' | 'medium' | 'low';
  keywords: string[];
  conceptTags: string[];
}

/**
 * Enhanced document processing with intelligent chunking
 */
export async function processDocumentWithStructuredChunking(
  content: string,
  fileName: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _knowledgeItemId: string
): Promise<StructuredChunk[]> {
  
  try {
    // Step 1: Detect document structure and type
    analyzeDocumentStructure(content, fileName);
    
    // Step 2: Extract structural elements
    const structuralElements = extractStructuralElements(content);
    
    // Step 3: Create intelligent chunks preserving structure
    const structuredChunks = await createStructuredChunks(
      structuralElements, 
      fileName
    );
    
    // Step 4: Enhance chunks with metadata and context
    const enhancedChunks = await enhanceChunksWithMetadata(structuredChunks, content);
    
    return enhancedChunks;
    
  } catch (error) {
    console.error('❌ Structured chunking error:', error);
    // Fallback to simple chunking
    return await fallbackSimpleChunking(content, fileName);
  }
}

/**
 * Analyze document structure to guide chunking strategy
 */
function analyzeDocumentStructure(content: string, fileName: string): DocumentStructure {
  const structure: DocumentStructure = {
    type: 'unstructured',
    hasHeaders: false,
    hasLists: false,
    hasTables: false,
    hasNumberedSections: false,
    isAcademic: false,
    isFitnessGuide: false
  };
  
  // Detect file type patterns
  if (fileName.toLowerCase().includes('guide') || fileName.toLowerCase().includes('manual')) {
    structure.isFitnessGuide = true;
  }
  
  if (content.includes('Abstract') || content.includes('References') || content.includes('DOI:')) {
    structure.isAcademic = true;
  }
  
  // Detect structural elements
  structure.hasHeaders = /^#+\s|^[A-Z][^a-z\n]*$|^\d+\.\s[A-Z]/m.test(content);
  structure.hasLists = /^\s*[-*•]\s|^\s*\d+\.\s/m.test(content);
  structure.hasTables = /\|.*\|.*\|/.test(content) || /┌|├|└/.test(content);
  structure.hasNumberedSections = /^\d+\.\d+\s/.test(content);
  
  // Determine primary structure type
  if (structure.hasHeaders && structure.hasLists) {
    structure.type = 'structured';
  } else if (structure.isAcademic) {
    structure.type = 'academic';
  } else if (structure.isFitnessGuide) {
    structure.type = 'guide';
  } else if (structure.hasLists) {
    structure.type = 'list-based';
  }
  
  return structure;
}

/**
 * Extract and categorize structural elements from document
 */
function extractStructuralElements(content: string): StructuralElement[] {
  const elements: StructuralElement[] = [];
  const lines = content.split('\n');
  
  let currentSection = '';
  let currentSubsection = '';
  let elementBuffer = '';
  let elementType: StructuralElement['type'] = 'paragraph';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line) {
      // Empty line - potential element boundary
      if (elementBuffer.trim()) {
        elements.push({
          content: elementBuffer.trim(),
          type: elementType,
          section: currentSection,
          subsection: currentSubsection,
          lineStart: i - elementBuffer.split('\n').length + 1,
          lineEnd: i
        });
        elementBuffer = '';
      }
      continue;
    }
    
    // Detect headers
    if (isHeader(line)) {
      // Save previous element
      if (elementBuffer.trim()) {
        elements.push({
          content: elementBuffer.trim(),
          type: elementType,
          section: currentSection,
          subsection: currentSubsection,
          lineStart: i - elementBuffer.split('\n').length,
          lineEnd: i - 1
        });
      }
      
      // Update section tracking
      if (isMainHeader(line)) {
        currentSection = line;
        currentSubsection = '';
      } else {
        currentSubsection = line;
      }
      
      // Start new header element
      elementBuffer = line;
      elementType = 'header';
      continue;
    }
    
    // Detect lists
    if (isListItem(line)) {
      if (elementType !== 'list') {
        // Save previous element and start new list
        if (elementBuffer.trim()) {
          elements.push({
            content: elementBuffer.trim(),
            type: elementType,
            section: currentSection,
            subsection: currentSubsection,
            lineStart: i - elementBuffer.split('\n').length,
            lineEnd: i - 1
          });
        }
        elementBuffer = line;
        elementType = 'list';
      } else {
        elementBuffer += '\n' + line;
      }
      continue;
    }
    
    // Detect tables
    if (isTableRow(line)) {
      if (elementType !== 'table') {
        if (elementBuffer.trim()) {
          elements.push({
            content: elementBuffer.trim(),
            type: elementType,
            section: currentSection,
            subsection: currentSubsection,
            lineStart: i - elementBuffer.split('\n').length,
            lineEnd: i - 1
          });
        }
        elementBuffer = line;
        elementType = 'table';
      } else {
        elementBuffer += '\n' + line;
      }
      continue;
    }
    
    // Regular paragraph content
    if (elementType === 'paragraph') {
      elementBuffer += (elementBuffer ? '\n' : '') + line;
    } else {
      // Type change - save previous and start new paragraph
      if (elementBuffer.trim()) {
        elements.push({
          content: elementBuffer.trim(),
          type: elementType,
          section: currentSection,
          subsection: currentSubsection,
          lineStart: i - elementBuffer.split('\n').length,
          lineEnd: i - 1
        });
      }
      elementBuffer = line;
      elementType = 'paragraph';
    }
  }
  
  // Save final element
  if (elementBuffer.trim()) {
    elements.push({
      content: elementBuffer.trim(),
      type: elementType,
      section: currentSection,
      subsection: currentSubsection,
      lineStart: lines.length - elementBuffer.split('\n').length,
      lineEnd: lines.length
    });
  }
  
  return elements;
}

/**
 * Create structured chunks while preserving semantic coherence
 */
async function createStructuredChunks(
  elements: StructuralElement[],
  fileName: string
): Promise<StructuredChunk[]> {
  
  const chunks: StructuredChunk[] = [];
  const maxChunkSize = 800; // Slightly larger for structured content
  const contextOverlap = 150;
  
  let chunkIndex = 0;
  
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    
    // Small elements can be combined
    if (element.content.length < maxChunkSize / 2) {
      let combinedContent = element.content;
      let combinedType = element.type;
      let j = i + 1;
      
      // Combine similar adjacent elements
      while (j < elements.length && 
             combinedContent.length + elements[j].content.length < maxChunkSize &&
             elements[j].section === element.section) {
        
        combinedContent += '\n\n' + elements[j].content;
        
        // Mixed type if combining different types
        if (elements[j].type !== combinedType) {
          combinedType = 'mixed';
        }
        
        j++;
      }
      
      // Create chunk
      chunks.push({
        content: combinedContent,
        chunkIndex: chunkIndex++,
        structuralType: combinedType as 'header' | 'paragraph' | 'list' | 'table' | 'quote' | 'mixed',
        metadata: {
          sourceDocument: fileName,
          section: element.section,
          subsection: element.subsection,
          hasStructuredContent: true,
          importance: determineImportance(element),
          keywords: extractKeywords(combinedContent),
          conceptTags: extractConceptTags(combinedContent)
        },
        contextBefore: i > 0 ? elements[i - 1].content.slice(-contextOverlap) : undefined,
        contextAfter: j < elements.length ? elements[j].content.slice(0, contextOverlap) : undefined
      });
      
      i = j - 1; // Skip processed elements
      
    } else {
      // Large element needs to be split
      const splitChunks = splitLargeElement(element.content);
      
      splitChunks.forEach(chunk => {
        chunks.push({
          ...chunk,
          chunkIndex: chunkIndex++,
          metadata: {
            sourceDocument: fileName,
            section: element.section,
            subsection: element.subsection,
            hasStructuredContent: true,
            importance: determineImportance(element),
            keywords: extractKeywords(chunk.content),
            conceptTags: extractConceptTags(chunk.content)
          }
        });
      });
    }
  }
  
  return chunks;
}

/**
 * Enhanced metadata extraction for fitness content
 */
async function enhanceChunksWithMetadata(
  chunks: StructuredChunk[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _originalContent: string
): Promise<StructuredChunk[]> {
  
  return chunks.map((chunk) => ({
    ...chunk,
    metadata: {
      ...chunk.metadata,
      importance: refineImportanceScore(chunk),
      keywords: enhanceFitnessKeywords(chunk.metadata.keywords, chunk.content),
      conceptTags: enhanceFitnessConceptTags(chunk.metadata.conceptTags, chunk.content)
    }
  }));
}

// Helper functions for structural analysis

interface DocumentStructure {
  type: 'structured' | 'academic' | 'guide' | 'list-based' | 'unstructured';
  hasHeaders: boolean;
  hasLists: boolean;
  hasTables: boolean;
  hasNumberedSections: boolean;
  isAcademic: boolean;
  isFitnessGuide: boolean;
}

interface StructuralElement {
  content: string;
  type: 'header' | 'paragraph' | 'list' | 'table' | 'quote' | 'mixed';
  section: string;
  subsection: string;
  lineStart: number;
  lineEnd: number;
}

function isHeader(line: string): boolean {
  return /^#+\s/.test(line) || // Markdown headers
         /^[A-Z][A-Z\s]{10,}$/.test(line) || // ALL CAPS headers
         /^\d+\.\s[A-Z]/.test(line) || // Numbered headers
         /^[A-Z][^a-z]*[A-Z]$/.test(line); // Title case headers
}

function isMainHeader(line: string): boolean {
  return /^#+\s/.test(line) || /^\d+\.\s/.test(line);
}

function isListItem(line: string): boolean {
  return /^\s*[-*•]\s/.test(line) || /^\s*\d+\.\s/.test(line);
}

function isTableRow(line: string): boolean {
  return /\|.*\|/.test(line) || /┌|├|└|│/.test(line);
}

function determineImportance(element: StructuralElement): 'high' | 'medium' | 'low' {
  if (element.type === 'header') return 'high';
  if (element.content.length > 500) return 'high';
  if (element.type === 'list' || element.type === 'table') return 'medium';
  return 'low';
}

function extractKeywords(content: string): string[] {
  // Fitness-specific keyword extraction
  const fitnessTerms = [
    'reps', 'sets', 'volume', 'intensity', 'frequency', 'RIR', 'RPE',
    'hypertrophy', 'strength', 'muscle', 'training', 'exercise',
    'chest', 'back', 'shoulders', 'arms', 'legs', 'core',
    'progressive overload', 'mechanical tension', 'range of motion'
  ];
  
  const words = content.toLowerCase().match(/\b\w{4,}\b/g) || [];
  const keywords = words.filter(word => 
    fitnessTerms.some(term => word.includes(term) || term.includes(word))
  );
  
  return [...new Set(keywords)].slice(0, 10);
}

function extractConceptTags(content: string): string[] {
  const conceptPatterns = {
    'exercise-technique': /form|technique|execution|biomechanics/i,
    'programming': /program|routine|split|frequency|periodization/i,
    'muscle-growth': /hypertrophy|growth|gains|muscle building/i,
    'strength-training': /strength|power|1RM|max/i,
    'volume-intensity': /volume|intensity|load|weight|reps|sets/i,
    'recovery': /recovery|rest|sleep|adaptation/i,
    'nutrition': /diet|nutrition|protein|calories|macros/i
  };
  
  const tags: string[] = [];
  Object.entries(conceptPatterns).forEach(([tag, pattern]) => {
    if (pattern.test(content)) {
      tags.push(tag);
    }
  });
  
  return tags;
}

function refineImportanceScore(chunk: StructuredChunk): 'high' | 'medium' | 'low' {
  let score = chunk.metadata.importance === 'high' ? 3 : chunk.metadata.importance === 'medium' ? 2 : 1;
  
  // Boost for fitness-specific content
  if (chunk.metadata.keywords.length > 3) score += 1;
  if (chunk.metadata.conceptTags.length > 2) score += 1;
  
  // Boost for exercise instructions or specific techniques
  if (/step|instruction|how to|technique/i.test(chunk.content)) score += 1;
  
  return score >= 4 ? 'high' : score >= 2 ? 'medium' : 'low';
}

function enhanceFitnessKeywords(keywords: string[], content: string): string[] {
  const additionalFitnessTerms = content.toLowerCase().match(/\b(rep|set|workout|train|muscle|strength|hypertrophy|volume|intensity|frequency|progression|overload|RIR|RPE|1RM|tempo|form|technique|biomechanics|activation|contraction|eccentric|concentric|isometric)\b/g) || [];
  
  return [...new Set([...keywords, ...additionalFitnessTerms])].slice(0, 15);
}

function enhanceFitnessConceptTags(tags: string[], content: string): string[] {
  const additionalTags: string[] = [];
  
  // Muscle-specific tags
  const muscles = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'glutes', 'core'];
  muscles.forEach(muscle => {
    if (new RegExp(muscle, 'i').test(content)) {
      additionalTags.push(`${muscle}-training`);
    }
  });
  
  // Movement pattern tags
  if (/press|push/i.test(content)) additionalTags.push('pressing-movement');
  if (/pull|row/i.test(content)) additionalTags.push('pulling-movement');
  if (/squat|lunge/i.test(content)) additionalTags.push('leg-movement');
  
  return [...new Set([...tags, ...additionalTags])];
}

function splitLargeElement(
  content: string
): Omit<StructuredChunk, 'chunkIndex' | 'metadata'>[] {
  
  const chunks: Omit<StructuredChunk, 'chunkIndex' | 'metadata'>[] = [];
  const maxSize = 800;
  const overlap = 100;
  
  // Simple text splitting by sentences
  const sentences = content.match(/[^.!?]+[.!?]+/g) || [content];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxSize && currentChunk) {
      chunks.push({
        content: currentChunk.trim(),
        structuralType: 'paragraph'
      });
      currentChunk = currentChunk.slice(-overlap) + ' ' + sentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      structuralType: 'paragraph'
    });
  }
  
  return chunks;
}

async function fallbackSimpleChunking(
  content: string,
  fileName: string
): Promise<StructuredChunk[]> {
  
  if (process.env.NODE_ENV === 'development') { console.log('🔄 Using fallback simple chunking'); }
  
  const chunkSize = 512;
  const overlap = 100;
  const chunks: StructuredChunk[] = [];
  
  for (let i = 0; i < content.length; i += chunkSize - overlap) {
    const chunkContent = content.slice(i, i + chunkSize);
    
    chunks.push({
      content: chunkContent,
      chunkIndex: Math.floor(i / (chunkSize - overlap)),
      structuralType: 'paragraph',
      metadata: {
        sourceDocument: fileName,
        hasStructuredContent: false,
        importance: 'medium',
        keywords: extractKeywords(chunkContent),
        conceptTags: extractConceptTags(chunkContent)
      }
    });
  }
  
  return chunks;
}

export default processDocumentWithStructuredChunking;
