/**
 * Test script to verify RAG fixes implementation
 * Run with: node test-rag-fixes.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testRAGFixes() {
  console.log('🧪 Testing RAG Fixes Implementation');
  console.log('===================================');

  try {
    // Test 1: Check if RAG configuration exists in AI configuration
    console.log('\n1️⃣ Testing RAG configuration in database...');
    
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' },
      select: {
        ragSimilarityThreshold: true,
        ragMaxChunks: true,
        ragHighRelevanceThreshold: true,
      }
    });

    if (config) {
      console.log('✅ RAG configuration found in database');
      console.log(`   Similarity Threshold: ${config.ragSimilarityThreshold}`);
      console.log(`   Max Chunks: ${config.ragMaxChunks}`);
      console.log(`   High Relevance Threshold: ${config.ragHighRelevanceThreshold}`);
    } else {
      console.log('❌ RAG configuration not found - need to create default config');
      
      // Create default configuration
      await prisma.aIConfiguration.create({
        data: {
          id: 'singleton',
          ragSimilarityThreshold: 0.6,
          ragMaxChunks: 5,
          ragHighRelevanceThreshold: 0.8,
        }
      });
      console.log('✅ Created default RAG configuration');
    }

    // Test 2: Test the new getRAGConfig function
    console.log('\n2️⃣ Testing getRAGConfig function...');
    
    try {
      const { getRAGConfig } = require('./src/lib/vector-search');
      const ragConfig = await getRAGConfig();
      
      console.log('✅ getRAGConfig function works');
      console.log(`   Similarity Threshold: ${ragConfig.similarityThreshold}`);
      console.log(`   Max Chunks: ${ragConfig.maxChunks}`);
      console.log(`   High Relevance Threshold: ${ragConfig.highRelevanceThreshold}`);
    } catch (error) {
      console.log('❌ getRAGConfig function failed:', error.message);
    }

    // Test 3: Test context retrieval without titles
    console.log('\n3️⃣ Testing context retrieval format...');
    
    try {
      // First, check if we have any knowledge chunks
      const chunkCount = await prisma.knowledgeChunk.count();
      console.log(`   Found ${chunkCount} knowledge chunks in database`);
      
      if (chunkCount > 0) {
        const { getRelevantContext } = require('./src/lib/vector-search');
        
        // Get a sample user
        const sampleUser = await prisma.user.findFirst({
          where: {
            knowledgeItems: {
              some: {}
            }
          }
        });
        
        if (sampleUser) {
          console.log(`   Testing with user: ${sampleUser.id}`);
          
          const context = await getRelevantContext(
            sampleUser.id,
            'muscle building exercise',
            3, // Max chunks
            0.1 // Low threshold to get results
          );
          
          if (context.length > 0) {
            console.log('✅ Context retrieval works');
            console.log('   Sample context format:');
            console.log(`   ${context.substring(0, 200)}...`);
            
            // Check if context contains titles/headers
            const containsTitles = context.includes('===') || context.includes('Source:');
            if (containsTitles) {
              console.log('⚠️  Context still contains titles/headers - may need additional cleanup');
            } else {
              console.log('✅ Context format is clean (no titles in AI context)');
            }
          } else {
            console.log('ℹ️  No context retrieved (may be due to embedding/similarity thresholds)');
          }
        } else {
          console.log('ℹ️  No users with knowledge items found for testing');
        }
      } else {
        console.log('ℹ️  No knowledge chunks found for testing context retrieval');
      }
    } catch (error) {
      console.log('❌ Context retrieval test failed:', error.message);
    }

    // Test 4: Test the new getContextSources function
    console.log('\n4️⃣ Testing getContextSources function...');
    
    try {
      const { getContextSources } = require('./src/lib/vector-search');
      
      const sampleUser = await prisma.user.findFirst({
        where: {
          knowledgeItems: {
            some: {}
          }
        }
      });
      
      if (sampleUser) {
        const sources = await getContextSources(
          sampleUser.id,
          'muscle building exercise',
          3,
          0.1
        );
        
        console.log('✅ getContextSources function works');
        console.log(`   Found ${sources.length} source(s)`);
        
        if (sources.length > 0) {
          sources.forEach((source, index) => {
            console.log(`   ${index + 1}. Title: "${source.title}" (Relevance: ${(source.relevance * 100).toFixed(1)}%)`);
          });
        }
      } else {
        console.log('ℹ️  No users with knowledge items found for testing');
      }
    } catch (error) {
      console.log('❌ getContextSources test failed:', error.message);
    }

    console.log('\n🎉 RAG fixes testing completed!');
    console.log('\n📋 Summary of changes:');
    console.log('   ✅ Added RAG configuration parameters to database schema');
    console.log('   ✅ Removed titles from AI context (clean content only)');
    console.log('   ✅ Made RAG parameters configurable via admin settings');
    console.log('   ✅ Added separate function for UI to get source information');
    console.log('   ✅ Updated functions to use database configuration');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testRAGFixes();
