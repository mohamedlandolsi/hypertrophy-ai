/**
 * Enhanced RAG Integration Module
 * 
 * This module integrates all the enhanced RAG components:
 * - Enhanced RAG with hybrid search and query transformation
 * - Dynamic user profile integration
 * - Structured chunking for better content processing
 * - Improved context generation and source tracking
 */

import enhancedKnowledgeRetrieval from './enhanced-rag';
import { fetchUserProfile, generatePersonalizationPrompt } from './user-profile-integration';
import processDocumentWithStructuredChunking from './structured-chunking';
import { getAIConfiguration } from './gemini';
import { prisma } from './prisma';

export interface EnhancedRAGResponse {
  context: string;
  sources: Array<{
    title: string;
    url?: string;
    relevanceScore: number;
    snippet: string;
    metadata: {
      section?: string;
      importance: 'high' | 'medium' | 'low';
      conceptTags: string[];
    };
  }>;
  userContext: string;
  totalChunksRetrieved: number;
  searchStrategies: string[];
  processingTime: number;
}

/**
 * Main enhanced RAG function that orchestrates all components
 */
export async function getEnhancedRAGContext(
  query: string,
  userId?: string,
  options: {
    includeUserProfile?: boolean;
    maxChunks?: number;
    similarityThreshold?: number;
    enableHybridSearch?: boolean;
  } = {}
): Promise<EnhancedRAGResponse> {
  
  const startTime = Date.now();
  if (process.env.NODE_ENV === 'development') { console.log(`🚀 Starting enhanced RAG for query: "${query}"`); }
  
  // Get AI configuration for RAG parameters
  const aiConfig = await getAIConfiguration();
  const ragConfig = {
    maxChunks: options.maxChunks || aiConfig.ragMaxChunks || 8,
    similarityThreshold: options.similarityThreshold || aiConfig.ragSimilarityThreshold || 0.7,
    enableHybridSearch: options.enableHybridSearch ?? true
  };
  
  // Initialize enhanced RAG service
  const ragOptions = {
    maxChunks: ragConfig.maxChunks,
    similarityThreshold: ragConfig.similarityThreshold,
    highRelevanceThreshold: 0.85,
    useHybridSearch: ragConfig.enableHybridSearch
  };
  
  // Step 1: Get user profile context if requested and user is logged in
  let userContext = '';
  if (options.includeUserProfile && userId) {
    try {
      const userProfile = await fetchUserProfile(userId);
      if (userProfile) {
        userContext = generatePersonalizationPrompt(userProfile);
        if (process.env.NODE_ENV === 'development') { console.log(`👤 Retrieved user profile context (${userContext.length} chars)`); }
      }
    } catch (error) {
      console.warn('⚠️ Failed to retrieve user profile context:', error);
    }
  }
  
  // Step 2: Execute enhanced RAG search
  const ragResults = await enhancedKnowledgeRetrieval(query, ragOptions);
  if (process.env.NODE_ENV === 'development') { console.log(`🔍 Enhanced RAG completed: ${ragResults.length} results retrieved`); }
  
  // Step 3: Get source metadata and create enhanced sources
  const enhancedSources = await enhanceSourcesWithMetadata(ragResults);
  
  // Step 4: Combine contexts
  const knowledgeContext = ragResults.map(result => result.content).join('\n\n');
  let combinedContext = knowledgeContext;
  if (userContext) {
    combinedContext = `USER PROFILE CONTEXT:\n${userContext}\n\nKNOWLEDGE BASE CONTEXT:\n${knowledgeContext}`;
  }
  
  const processingTime = Date.now() - startTime;
  if (process.env.NODE_ENV === 'development') { console.log(`✅ Enhanced RAG integration completed in ${processingTime}ms`); }
  
  return {
    context: combinedContext,
    sources: enhancedSources,
    userContext,
    totalChunksRetrieved: ragResults.length,
    searchStrategies: ['hybrid', 'semantic', 'keyword'], // Static for now
    processingTime
  };
}

/**
 * Process a file using structured chunking and store in knowledge base
 */
export async function processFileWithEnhancedChunking(
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string,
  knowledgeItemId: string
): Promise<{
  chunksCreated: number;
  processingTime: number;
  structuredContent: boolean;
}> {
  
  const startTime = Date.now();
  if (process.env.NODE_ENV === 'development') { console.log(`📁 Processing file with enhanced chunking: ${fileName}`); }
  
  try {
    // Extract text content based on file type
    let content = '';
    
    if (mimeType === 'application/pdf') {
      const pdfParse = await import('pdf-parse');
      const pdfData = await pdfParse.default(fileBuffer);
      content = pdfData.text;
    } else if (mimeType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') || 
               mimeType.includes('application/msword')) {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      content = result.value;
    } else if (mimeType.includes('text/')) {
      content = fileBuffer.toString('utf-8');
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }
    
    if (!content.trim()) {
      throw new Error('No text content extracted from file');
    }
    
    // Process with structured chunking
    const structuredChunks = await processDocumentWithStructuredChunking(
      content,
      fileName,
      knowledgeItemId
    );
    
    if (process.env.NODE_ENV === 'development') { console.log(`📚 Created ${structuredChunks.length} structured chunks`); }
    
    // Store chunks in database with embeddings
    const chunksWithEmbeddings = await Promise.all(
      structuredChunks.map(async (chunk, index) => {
        try {
          // Generate embedding for the chunk
          const embedding = await generateEmbedding(chunk.content);
          
          return {
            knowledgeItemId,
            content: chunk.content,
            chunkIndex: index,
            embeddingData: JSON.stringify(embedding) // Store as JSON string per schema
          };
        } catch (error) {
          console.error(`❌ Failed to process chunk ${index}:`, error);
          return null;
        }
      })
    );
    
    // Filter out failed chunks and create database records
    const validChunks = chunksWithEmbeddings.filter(chunk => chunk !== null);
    
    if (validChunks.length === 0) {
      throw new Error('No valid chunks created from file');
    }
    
    // Batch insert chunks
    await prisma.knowledgeChunk.createMany({
      data: validChunks
    });
    
    const processingTime = Date.now() - startTime;
    if (process.env.NODE_ENV === 'development') { console.log(`✅ Enhanced file processing completed in ${processingTime}ms`); }
    
    return {
      chunksCreated: validChunks.length,
      processingTime,
      structuredContent: structuredChunks.some(chunk => chunk.metadata.hasStructuredContent)
    };
    
  } catch (error) {
    console.error('❌ Enhanced file processing failed:', error);
    throw error;
  }
}

/**
 * Enhance sources with additional metadata from database
 */
async function enhanceSourcesWithMetadata(
  sources: Array<{
    knowledgeId: string;
    chunkIndex: number;
    content: string;
    similarity: number;
    title: string;
  }>
): Promise<EnhancedRAGResponse['sources']> {
  
  const enhancedSources = await Promise.all(
    sources.map(async (source) => {
      try {
        // Get knowledge item details
        const knowledgeItem = await prisma.knowledgeItem.findUnique({
          where: { id: source.knowledgeId },
          select: { title: true, fileName: true }
        });
        
        // Get chunk data (no metadata field exists in schema)
        await prisma.knowledgeChunk.findFirst({
          where: {
            knowledgeItemId: source.knowledgeId,
            chunkIndex: source.chunkIndex
          },
          select: { content: true }
        });
        
        return {
          title: knowledgeItem?.title || source.title || 'Unknown Source',
          url: undefined, // No URL field in schema
          relevanceScore: source.similarity,
          snippet: source.content.slice(0, 200) + (source.content.length > 200 ? '...' : ''),
          metadata: {
            section: undefined, // No metadata field in schema
            importance: 'medium' as const,
            conceptTags: []
          }
        };
      } catch (error) {
        console.error('❌ Failed to enhance source metadata:', error);
        return {
          title: source.title || 'Unknown Source',
          relevanceScore: source.similarity,
          snippet: source.content.slice(0, 200) + (source.content.length > 200 ? '...' : ''),
          metadata: {
            importance: 'medium' as const,
            conceptTags: []
          }
        };
      }
    })
  );
  
  return enhancedSources;
}

/**
 * Generate embedding using the Gemini API
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }
  
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  
  const result = await model.embedContent(text);
  return result.embedding.values;
}

/**
 * Test the enhanced RAG system with comprehensive logging
 */
export async function testEnhancedRAGSystem(
  testQuery: string,
  testUserId?: string
): Promise<void> {
  
  if (process.env.NODE_ENV === 'development') { console.log('🧪 Testing Enhanced RAG System'); }
  if (process.env.NODE_ENV === 'development') { console.log('================================'); }
  
  try {
    const result = await getEnhancedRAGContext(testQuery, testUserId, {
      includeUserProfile: true,
      enableHybridSearch: true
    });
    
    if (process.env.NODE_ENV === 'development') { console.log('\n📊 Test Results:'); }
    if (process.env.NODE_ENV === 'development') { console.log(`Query: "${testQuery}"`); }
    if (process.env.NODE_ENV === 'development') { console.log(`Processing Time: ${result.processingTime}ms`); }
    if (process.env.NODE_ENV === 'development') { console.log(`Total Chunks Retrieved: ${result.totalChunksRetrieved}`); }
    if (process.env.NODE_ENV === 'development') { console.log(`Search Strategies Used: ${result.searchStrategies.join(', ')}`); }
    if (process.env.NODE_ENV === 'development') { console.log(`User Context Length: ${result.userContext.length} chars`); }
    if (process.env.NODE_ENV === 'development') { console.log(`Knowledge Context Length: ${result.context.length} chars`); }
    
    if (process.env.NODE_ENV === 'development') { console.log('\n📚 Sources Found:'); }
    result.sources.forEach((source, index) => {
      if (process.env.NODE_ENV === 'development') { console.log(`${index + 1}. ${source.title} (Score: ${source.relevanceScore.toFixed(3)})`); }
      if (process.env.NODE_ENV === 'development') { console.log(`   Section: ${source.metadata.section || 'N/A'}`); }
      if (process.env.NODE_ENV === 'development') { console.log(`   Importance: ${source.metadata.importance}`); }
      if (process.env.NODE_ENV === 'development') { console.log(`   Tags: ${source.metadata.conceptTags.join(', ')}`); }
      if (process.env.NODE_ENV === 'development') { console.log(`   Snippet: ${source.snippet}`); }
      if (process.env.NODE_ENV === 'development') { console.log(''); }
    });
    
    if (process.env.NODE_ENV === 'development') { console.log('✅ Enhanced RAG test completed successfully'); }
    
  } catch (error) {
    console.error('❌ Enhanced RAG test failed:', error);
    throw error;
  }
}

const enhancedRagIntegration = {
  getEnhancedRAGContext,
  processFileWithEnhancedChunking,
  testEnhancedRAGSystem
};

export default enhancedRagIntegration;
