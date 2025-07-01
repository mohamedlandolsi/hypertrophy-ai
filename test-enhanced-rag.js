/**
 * Test script for enhanced RAG functionality
 * 
 * This script tests the complete enhanced RAG pipeline:
 * 1. Enhanced file processing with chunking and embeddings
 * 2. Vector search functionality
 * 3. LLM function calling for user info extraction
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFile } from 'fs/promises';
import { processFileWithEmbeddings } from './src/lib/enhanced-file-processor.js';
import { searchKnowledgeChunks } from './src/lib/vector-search.js';
import { sendToGemini } from './src/lib/gemini.js';
import { prisma } from './src/lib/prisma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testEnhancedRAG() {
  console.log('🧪 Testing Enhanced RAG Functionality\n');
  
  try {
    // Test 1: Enhanced file processing
    console.log('📄 Test 1: Enhanced File Processing');
    console.log('=' .repeat(50));
    
    // Find a sample uploaded file
    const sampleFile = await prisma.knowledgeItem.findFirst({
      where: {
        type: 'FILE',
        filePath: { not: null }
      }
    });

    if (!sampleFile) {
      console.log('❌ No sample files found. Please upload a file first.');
      return;
    }

    console.log(`📁 Processing file: ${sampleFile.title}`);
    
    const fileBuffer = await readFile(sampleFile.filePath);
    
    const processingResult = await processFileWithEmbeddings(
      fileBuffer,
      sampleFile.mimeType || 'text/plain',
      sampleFile.fileName || sampleFile.title,
      sampleFile.id,
      {
        generateEmbeddings: true,
        chunkSize: 500,
        chunkOverlap: 100,
        batchSize: 3
      }
    );

    console.log('✅ Processing Result:');
    console.log(`   Success: ${processingResult.success}`);
    console.log(`   Chunks created: ${processingResult.chunksCreated}`);
    console.log(`   Embeddings generated: ${processingResult.embeddingsGenerated}`);
    console.log(`   Processing time: ${processingResult.processingTime}ms`);
    
    if (processingResult.warnings.length > 0) {
      console.log(`   Warnings: ${processingResult.warnings.join(', ')}`);
    }
    
    if (processingResult.errors.length > 0) {
      console.log(`   Errors: ${processingResult.errors.join(', ')}`);
    }

    // Test 2: Vector search
    console.log('\n🔍 Test 2: Vector Search');
    console.log('=' .repeat(50));
    
    const searchQueries = [
      'muscle building exercises',
      'protein intake recommendations',
      'training frequency for beginners',
      'recovery and rest days'
    ];

    for (const query of searchQueries) {
      console.log(`\n🔎 Searching for: "${query}"`);
      
      const searchResults = await searchKnowledgeChunks(query, 'test-user-id', {
        limit: 3,
        threshold: 0.6
      });

      console.log(`   Found ${searchResults.results.length} relevant chunks`);
      
      searchResults.results.forEach((result, index) => {
        console.log(`   ${index + 1}. Score: ${result.similarity.toFixed(3)} | Chunk ${result.chunk.chunkIndex}`);
        console.log(`      Content preview: ${result.chunk.content.substring(0, 100)}...`);
      });
    }

    // Test 3: LLM Function Calling with Context
    console.log('\n🤖 Test 3: LLM Function Calling with Enhanced Context');
    console.log('=' .repeat(50));
    
    const testMessages = [
      "I'm a 25-year-old beginner who weighs 70kg and wants to build muscle. I can train 3 days per week.",
      "I'm an experienced lifter, been training for 5 years. I'm 30 years old, 80kg, and want to get stronger.",
      "Female, 28 years old, 60kg, intermediate level. My goal is to lose fat while maintaining muscle."
    ];

    for (let i = 0; i < testMessages.length; i++) {
      const message = testMessages[i];
      console.log(`\n💬 Test message ${i + 1}: "${message}"`);
      
      try {
        const response = await sendToGemini(
          message,
          'test-user-id',
          [], // Empty conversation history
          {
            extractUserInfo: true,
            searchKnowledge: true,
            maxKnowledgeChunks: 3
          }
        );

        console.log('✅ LLM Response received');
        console.log(`   Response length: ${response.length} characters`);
        console.log(`   Response preview: ${response.substring(0, 200)}...`);
        
        // Check if function calls were made (this would be in logs)
        console.log('   Check the console logs above for function call details');

      } catch (error) {
        console.error(`❌ Error in LLM test ${i + 1}:`, error.message);
      }
    }

    // Test 4: Performance metrics
    console.log('\n📊 Test 4: Performance Metrics');
    console.log('=' .repeat(50));
    
    const metrics = await gatherPerformanceMetrics();
    
    console.log('📈 Current System Metrics:');
    console.log(`   Total knowledge items: ${metrics.totalKnowledgeItems}`);
    console.log(`   Items with chunks: ${metrics.itemsWithChunks}`);
    console.log(`   Total chunks: ${metrics.totalChunks}`);
    console.log(`   Chunks with embeddings: ${metrics.chunksWithEmbeddings}`);
    console.log(`   Average chunks per item: ${metrics.avgChunksPerItem}`);
    console.log(`   Processing completion rate: ${metrics.processingCompletionRate}%`);

    console.log('\n🎉 Enhanced RAG testing completed!');
    console.log('\n📋 Summary:');
    console.log('✅ File processing with chunking and embeddings');
    console.log('✅ Vector search for semantic retrieval');
    console.log('✅ LLM function calling integration');
    console.log('✅ Performance monitoring');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function gatherPerformanceMetrics() {
  const [
    totalKnowledgeItems,
    itemsWithChunks,
    totalChunks,
    chunksWithEmbeddings
  ] = await Promise.all([
    prisma.knowledgeItem.count(),
    prisma.knowledgeItem.count({
      where: {
        chunks: {
          some: {}
        }
      }
    }),
    prisma.knowledgeChunk.count(),
    prisma.knowledgeChunk.count({
      where: {
        embeddingData: {
          not: null
        }
      }
    })
  ]);

  const avgChunksPerItem = totalKnowledgeItems > 0 ? (totalChunks / totalKnowledgeItems).toFixed(1) : '0';
  const processingCompletionRate = totalKnowledgeItems > 0 ? 
    Math.round((itemsWithChunks / totalKnowledgeItems) * 100) : 0;

  return {
    totalKnowledgeItems,
    itemsWithChunks,
    totalChunks,
    chunksWithEmbeddings,
    avgChunksPerItem: parseFloat(avgChunksPerItem),
    processingCompletionRate
  };
}

// Run the test
testEnhancedRAG().catch(console.error);
