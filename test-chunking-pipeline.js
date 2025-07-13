/**
 * Test the enhanced chunking and embedding pipeline
 * Run from project root: node test-chunking-pipeline.js
 */

const { processFileWithEmbeddings } = require('./src/lib/enhanced-file-processor');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testChunkingPipeline() {
  console.log('🧪 Testing Enhanced Chunking & Embedding Pipeline\n');
  
  // Sample fitness content with common PDF extraction issues
  const sampleText = `Exercise Physiology and Muscle Hypertrophy.This research examines the mechanisms of muscle growth.

Resistance training promotes hypertrophy through several pathways:1)mechanical tension,2)metabolic stress,and 3)muscle damage.Dr.Smith et al.found that training volume significantly impacts growth.

Progressive overload is essential.Sets should be performed with 6-12 reps for hypertrophy.Rest periods of 60-90 sec between sets optimize metabolic stress.Fig.1 shows the relationship between volume and growth.

Research by Johnson et al.(2023)demonstrated that protein synthesis increases by 25% post-exercise.This effect lasts for 24-48 hours.Therefore,training frequency of 2-3x per week per muscle group is optimal.

The role of nutrition cannot be understated.Protein intake should be 1.6-2.2g/kg bodyweight daily.Leucine,in particular,triggers mTOR signaling pathway.

Volume recommendations vary based on training experience.Beginners respond well to 10-12 sets per muscle group per week.Intermediate trainees may benefit from 12-16 sets.Advanced athletes often require 16-20+ sets for continued progress.

Recovery between sessions is crucial.Muscle protein synthesis remains elevated for 24-48 hours post-exercise.This supports training each muscle group 2-3 times per week rather than once weekly.

Periodization strategies can optimize long-term progress.Linear periodization involves gradually increasing intensity while decreasing volume.Undulating periodization varies intensity and volume within shorter timeframes.

Exercise selection should emphasize compound movements.Squats,deadlifts,bench press,and rows provide significant muscle-building stimulus.Isolation exercises can supplement compound movements for specific muscle targeting.`;

  try {
    // Create a test user and knowledge item
    const testUserId = 'test-user-chunking-' + Date.now();
    
    // Create user
    await prisma.user.create({
      data: {
        id: testUserId,
        role: 'user'
      }
    });
    
    console.log(`👤 Created test user: ${testUserId}`);
    
    // Create knowledge item
    const knowledgeItem = await prisma.knowledgeItem.create({
      data: {
        title: 'Test Hypertrophy Research Paper',
        type: 'TEXT',
        content: sampleText,
        status: 'PROCESSING',
        userId: testUserId
      }
    });
    
    console.log(`📄 Created knowledge item: ${knowledgeItem.id}`);
    
    // Create a text buffer
    const textBuffer = Buffer.from(sampleText, 'utf-8');
    
    // Test the enhanced processing pipeline
    console.log('\n🔄 Starting enhanced processing pipeline...\n');
    
    const result = await processFileWithEmbeddings(
      textBuffer,
      'text/plain',
      'test-hypertrophy-research.txt',
      knowledgeItem.id,
      {
        generateEmbeddings: true,
        chunkSize: 512,
        chunkOverlap: 100,
        batchSize: 3
      }
    );
    
    console.log('\n📊 Processing Results:');
    console.log(`Success: ${result.success}`);
    console.log(`Chunks created: ${result.chunksCreated}`);
    console.log(`Embeddings generated: ${result.embeddingsGenerated}`);
    console.log(`Processing time: ${result.processingTime}ms`);
    
    if (result.errors.length > 0) {
      console.log(`\n❌ Errors: ${result.errors.join(', ')}`);
    }
    
    if (result.warnings.length > 0) {
      console.log(`\n⚠️ Warnings: ${result.warnings.join(', ')}`);
    }
    
    // Examine the created chunks
    const chunks = await prisma.knowledgeChunk.findMany({
      where: { knowledgeItemId: knowledgeItem.id },
      orderBy: { chunkIndex: 'asc' }
    });
    
    console.log(`\n📦 Created ${chunks.length} chunks:`);
    chunks.forEach((chunk, i) => {
      const hasEmbedding = chunk.embeddingData ? 'Yes' : 'No';
      const embeddingSize = chunk.embeddingData ? JSON.parse(chunk.embeddingData).length : 0;
      console.log(`\nChunk ${i + 1} (Index ${chunk.chunkIndex}):`);
      console.log(`  Content length: ${chunk.content.length} chars`);
      console.log(`  Has embedding: ${hasEmbedding} (${embeddingSize} dimensions)`);
      console.log(`  Content preview: "${chunk.content.slice(0, 100)}..."`);
    });
    
    // Test retrieval
    if (chunks.length > 0) {
      console.log('\n🔍 Testing chunk retrieval...');
      const { getRelevantContext } = require('./src/lib/vector-search');
      
      try {
        const context = await getRelevantContext(
          'What is progressive overload?',
          { userId: testUserId, limit: 3, threshold: 0.3 }
        );
        
        console.log(`Found ${context.length} relevant chunks for "What is progressive overload?"`);
        context.forEach((item, i) => {
          console.log(`\nResult ${i + 1}:`);
          console.log(`  Similarity: ${item.similarity.toFixed(3)}`);
          console.log(`  Preview: "${item.content.slice(0, 100)}..."`);
        });
      } catch (error) {
        console.log('⚠️ Retrieval test failed:', error.message);
      }
    }
    
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await prisma.knowledgeChunk.deleteMany({
      where: { knowledgeItemId: knowledgeItem.id }
    });
    await prisma.knowledgeItem.delete({
      where: { id: knowledgeItem.id }
    });
    await prisma.user.delete({
      where: { id: testUserId }
    });
    
    console.log('✅ Enhanced chunking pipeline test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testChunkingPipeline();
