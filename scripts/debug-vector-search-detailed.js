/**
 * Comprehensive debug script for the enhanced RAG system
 */

const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const prisma = new PrismaClient();

const TEST_CONFIG = {
  userId: '3e9ab191-e4e9-4eb4-a8eb-e95cbc39c7ba',
  testQuery: 'What are the best exercises for muscle hypertrophy?'
};

// Mock the vector search functions to see what's happening
async function debugVectorSearchStep() {
  console.log('🔬 Debugging Vector Search Step by Step');
  console.log('========================================\n');

  try {
    // Step 1: Test embedding generation
    console.log('1️⃣ Testing Embedding Generation...');
    
    if (!process.env.GEMINI_API_KEY) {
      console.log('❌ No GEMINI_API_KEY found in environment');
      return;
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    
    try {
      console.log(`   Generating embedding for: "${TEST_CONFIG.testQuery}"`);
      const result = await model.embedContent(TEST_CONFIG.testQuery);
      const embedding = result.embedding;
      
      console.log(`   ✅ Embedding generated successfully`);
      console.log(`   📊 Embedding dimensions: ${embedding.values.length}`);
      console.log(`   🔢 First 5 values: [${embedding.values.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
    } catch (embeddingError) {
      console.log(`   ❌ Embedding generation failed: ${embeddingError.message}`);
      return;
    }

    // Step 2: Test database connection and chunk retrieval
    console.log('\n2️⃣ Testing Database Chunk Retrieval...');
    
    const chunks = await prisma.knowledgeChunk.findMany({
      where: {
        knowledgeItem: {
          userId: TEST_CONFIG.userId
        },
        embeddingData: {
          not: null
        }
      },
      include: {
        knowledgeItem: {
          select: {
            title: true
          }
        }
      },
      take: 5
    });

    console.log(`   ✅ Found ${chunks.length} chunks with embeddings`);
    
    // Step 3: Test similarity calculation
    console.log('\n3️⃣ Testing Similarity Calculation...');
    
    if (chunks.length > 0) {
      const sampleChunk = chunks[0];
      console.log(`   Testing with chunk: "${sampleChunk.content.substring(0, 100)}..."`);
      
      try {
        const chunkEmbedding = JSON.parse(sampleChunk.embeddingData);
        console.log(`   ✅ Chunk embedding parsed successfully`);
        console.log(`   📊 Chunk embedding dimensions: ${chunkEmbedding.length}`);
        
        // Calculate cosine similarity manually
        function cosineSimilarity(a, b) {
          const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
          const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
          const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
          return dotProduct / (magnitudeA * magnitudeB);
        }
        
        // We need to generate the query embedding again for comparison
        const queryResult = await model.embedContent(TEST_CONFIG.testQuery);
        const queryEmbedding = queryResult.embedding.values;
        
        const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);
        console.log(`   📈 Similarity score: ${(similarity * 100).toFixed(2)}%`);
        
        if (similarity < 0.4) {
          console.log(`   ⚠️ Similarity is below typical threshold (40%)`);
        } else {
          console.log(`   ✅ Similarity is above threshold`);
        }
        
      } catch (parseError) {
        console.log(`   ❌ Failed to parse chunk embedding: ${parseError.message}`);
      }
    }

    // Step 4: Test the actual getRelevantContext function if we can import it
    console.log('\n4️⃣ Testing getRelevantContext Function...');
    
    try {
      // Try to import and test the actual function
      console.log('   Attempting to call getRelevantContext...');
      
      // Since we can't easily import ES modules in CommonJS, let's simulate what it does
      console.log('   Simulating getRelevantContext logic...');
      
      // First, let's check if chunks exist with relevant content
      const relevantChunks = await prisma.knowledgeChunk.findMany({
        where: {
          knowledgeItem: {
            userId: TEST_CONFIG.userId
          },
          embeddingData: {
            not: null
          },
          OR: [
            { content: { contains: 'exercise', mode: 'insensitive' } },
            { content: { contains: 'muscle', mode: 'insensitive' } },
            { content: { contains: 'hypertrophy', mode: 'insensitive' } }
          ]
        },
        include: {
          knowledgeItem: {
            select: {
              title: true
            }
          }
        },
        take: 5
      });

      console.log(`   ✅ Found ${relevantChunks.length} potentially relevant chunks via keyword search`);
      
      if (relevantChunks.length > 0) {
        console.log('   📝 Sample relevant chunks:');
        relevantChunks.forEach((chunk, i) => {
          console.log(`      ${i + 1}. "${chunk.content.substring(0, 80)}..." (from ${chunk.knowledgeItem.title})`);
        });
      }
      
    } catch (functionError) {
      console.log(`   ❌ Error testing getRelevantContext: ${functionError.message}`);
    }

    // Step 5: Manual similarity search
    console.log('\n5️⃣ Manual Similarity Search...');
    
    try {
      const queryResult = await model.embedContent(TEST_CONFIG.testQuery);
      const queryEmbedding = queryResult.embedding.values;
      
      const allChunks = await prisma.knowledgeChunk.findMany({
        where: {
          knowledgeItem: {
            userId: TEST_CONFIG.userId
          },
          embeddingData: {
            not: null
          }
        },
        include: {
          knowledgeItem: {
            select: {
              title: true
            }
          }
        }
      });

      console.log(`   Processing ${allChunks.length} chunks for similarity...`);
      
      const similarities = [];
      
      for (const chunk of allChunks.slice(0, 10)) { // Test first 10 chunks
        try {
          const chunkEmbedding = JSON.parse(chunk.embeddingData);
          
          function cosineSimilarity(a, b) {
            const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
            const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
            const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
            return dotProduct / (magnitudeA * magnitudeB);
          }
          
          const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);
          
          similarities.push({
            id: chunk.id,
            content: chunk.content.substring(0, 100),
            title: chunk.knowledgeItem.title,
            similarity: similarity
          });
          
        } catch (parseError) {
          console.log(`   ⚠️ Failed to parse embedding for chunk ${chunk.id}`);
        }
      }
      
      // Sort by similarity
      similarities.sort((a, b) => b.similarity - a.similarity);
      
      console.log(`   🏆 Top 5 most similar chunks:`);
      similarities.slice(0, 5).forEach((item, i) => {
        console.log(`      ${i + 1}. ${(item.similarity * 100).toFixed(1)}% - "${item.content}..." (${item.title})`);
      });
      
      const threshold = 0.4;
      const aboveThreshold = similarities.filter(s => s.similarity >= threshold);
      console.log(`   📊 Chunks above ${(threshold * 100).toFixed(0)}% threshold: ${aboveThreshold.length}`);
      
    } catch (manualError) {
      console.log(`   ❌ Manual similarity search failed: ${manualError.message}`);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run the debug
async function runDebug() {
  try {
    await debugVectorSearchStep();
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

runDebug();
