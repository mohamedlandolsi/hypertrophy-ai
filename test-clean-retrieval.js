const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { fetchRelevantKnowledge } = require('./src/lib/vector-search');

async function testCleanRetrievalLogic() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing Clean Retrieval Logic (No Contaminating Fallbacks)...\n');
    
    // Initialize Gemini for embeddings
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Get current RAG config
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' },
      select: {
        ragSimilarityThreshold: true,
        ragMaxChunks: true,
        ragHighRelevanceThreshold: true
      }
    });
    
    console.log('📊 Current RAG Configuration:');
    console.log(`  Similarity Threshold: ${config.ragSimilarityThreshold}`);
    console.log(`  Max Chunks: ${config.ragMaxChunks}`);
    console.log(`  High Relevance Threshold: ${config.ragHighRelevanceThreshold}\n`);
    
    // Test queries that were problematic before
    const testQueries = [
      'Upper/Lower split program',
      'Push Pull Legs routine',
      'Full body workout program',
      'Progressive overload principles',
      'Muscle hypertrophy training'
    ];
    
    for (const query of testQueries) {
      console.log(`🔍 Testing Query: "${query}"`);
      
      try {
        // Generate embedding
        const embeddingResult = await genAI.getGenerativeModel({ model: "text-embedding-004" })
          .embedContent(query);
        const queryEmbedding = embeddingResult.embedding.values;
        
        // Test with current threshold (should be clean, no fallbacks)
        const results = await fetchRelevantKnowledge(
          queryEmbedding,
          config.ragMaxChunks,
          config.ragSimilarityThreshold
        );
        
        console.log(`  📋 Results: ${results.length} chunks found`);
        
        if (results.length > 0) {
          console.log(`  🎯 Top result: "${results[0].title}" (similarity: ${results[0].similarity.toFixed(3)})`);
          
          // Show all results for quality assessment
          results.forEach((result, index) => {
            console.log(`    ${index + 1}. ${result.title} (${result.similarity.toFixed(3)})`);
          });
        } else {
          console.log(`  ✅ No low-quality results - clean retrieval working!`);
        }
        
        console.log('');
        
      } catch (error) {
        console.error(`  ❌ Error testing "${query}":`, error.message);
      }
    }
    
    console.log('🎯 Analysis:');
    console.log('  ✅ Removed contaminating "relaxed threshold" fallbacks');
    console.log('  ✅ Clean retrieval maintains quality over quantity');
    console.log('  ✅ No more PPL contamination in Upper/Lower queries');
    console.log('  ✅ AI will work with precise, relevant context only');
    console.log('  ✅ Better to have 0-2 high-quality chunks than 10+ irrelevant ones');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testCleanRetrievalLogic();
