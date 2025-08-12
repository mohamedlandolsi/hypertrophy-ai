const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const prisma = new PrismaClient();

async function optimizeRAGRetrieval() {
  try {
    console.log('🔧 Optimizing RAG Retrieval for Complete Leg Workouts...\n');
    
    const testQuery = "Design a complete, evidence-based leg workout";
    console.log(`📝 Test Query: "${testQuery}"`);
    
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    
    // Generate embedding for the query
    const result = await embeddingModel.embedContent(testQuery);
    const queryEmbedding = result.embedding.values;
    
    // Get AI configuration
    const aiConfig = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });
    
    console.log('\n🎯 Current Multi-Query RAG Logic:');
    console.log('Primary search (60%): Exercise selection');
    console.log('Secondary searches (40%): Programming parameters');
    
    // Test primary search to see if lower body guide is being retrieved
    console.log('\n📚 Testing Primary Search (Exercise Selection):');
    
    const allChunks = await prisma.knowledgeChunk.findMany({
      where: { embeddingData: { not: null } },
      include: { knowledgeItem: { select: { title: true } } }
    });
    
    const primarySimilarities = [];
    for (const chunk of allChunks) {
      try {
        const embedding = JSON.parse(chunk.embeddingData);
        
        let dotProduct = 0;
        let queryMagnitude = 0;
        let chunkMagnitude = 0;
        
        for (let i = 0; i < queryEmbedding.length; i++) {
          dotProduct += queryEmbedding[i] * embedding[i];
          queryMagnitude += queryEmbedding[i] * queryEmbedding[i];
          chunkMagnitude += embedding[i] * embedding[i];
        }
        
        const similarity = dotProduct / (Math.sqrt(queryMagnitude) * Math.sqrt(chunkMagnitude));
        
        if (similarity >= aiConfig.ragSimilarityThreshold) {
          primarySimilarities.push({
            title: chunk.knowledgeItem.title,
            content: chunk.content,
            similarity: similarity
          });
        }
      } catch (e) {
        // Skip
      }
    }
    
    const primaryResults = primarySimilarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10); // Show top 10 to see what's available
    
    console.log(`\n📊 Top Primary Results (${primaryResults.length}):`);
    let lowerBodyGuideFound = false;
    primaryResults.forEach((result, i) => {
      const isLowerBodyGuide = result.title.includes('Lower Body Workout');
      if (isLowerBodyGuide) lowerBodyGuideFound = true;
      
      console.log(`${i + 1}. ${result.title} (${result.similarity.toFixed(3)}) ${isLowerBodyGuide ? '🎯' : ''}`);
    });
    
    if (!lowerBodyGuideFound) {
      console.log('\n❌ PROBLEM: Lower Body Workout guide not in top results!');
      
      // Search specifically for the lower body guide
      const lowerBodyChunks = await prisma.knowledgeChunk.findMany({
        where: {
          knowledgeItem: {
            title: { contains: 'Lower Body Workout', mode: 'insensitive' }
          }
        },
        include: { knowledgeItem: { select: { title: true } } }
      });
      
      console.log(`\n🔍 Lower Body Guide Analysis:`);
      console.log(`Found ${lowerBodyChunks.length} chunks from lower body guide`);
      
      // Calculate their similarities
      const lowerBodySimilarities = [];
      for (const chunk of lowerBodyChunks) {
        try {
          const embedding = JSON.parse(chunk.embeddingData);
          
          let dotProduct = 0;
          let queryMagnitude = 0;
          let chunkMagnitude = 0;
          
          for (let i = 0; i < queryEmbedding.length; i++) {
            dotProduct += queryEmbedding[i] * embedding[i];
            queryMagnitude += queryEmbedding[i] * queryEmbedding[i];
            chunkMagnitude += embedding[i] * embedding[i];
          }
          
          const similarity = dotProduct / (Math.sqrt(queryMagnitude) * Math.sqrt(chunkMagnitude));
          lowerBodySimilarities.push({ chunk, similarity });
        } catch (e) {
          // Skip
        }
      }
      
      lowerBodySimilarities.sort((a, b) => b.similarity - a.similarity);
      
      console.log('\nLower body guide chunk similarities:');
      lowerBodySimilarities.forEach((item, i) => {
        const meetsThreshold = item.similarity >= aiConfig.ragSimilarityThreshold;
        console.log(`${i + 1}. Similarity: ${item.similarity.toFixed(3)} ${meetsThreshold ? '✅' : '❌'}`);
        console.log(`   Content: ${item.chunk.content.substring(0, 100)}...`);
      });
      
      const bestLowerBodySimilarity = lowerBodySimilarities[0]?.similarity || 0;
      if (bestLowerBodySimilarity < aiConfig.ragSimilarityThreshold) {
        console.log(`\n🔧 SOLUTION: Lower similarity threshold (${aiConfig.ragSimilarityThreshold}) may be too high`);
        console.log(`   Best lower body chunk similarity: ${bestLowerBodySimilarity.toFixed(3)}`);
        console.log(`   Recommend lowering threshold to 0.25 or adding specific exercise query`);
      }
    } else {
      console.log('\n✅ Lower Body Workout guide found in primary results');
    }
    
    // Test with a more specific query that should definitely get the lower body guide
    console.log('\n🧪 Testing with more specific query:');
    const specificQuery = "leg workout squat deadlift leg press exercise selection lower body";
    const specificResult = await embeddingModel.embedContent(specificQuery);
    const specificEmbedding = specificResult.embedding.values;
    
    const specificSimilarities = [];
    for (const chunk of allChunks) {
      try {
        const embedding = JSON.parse(chunk.embeddingData);
        
        let dotProduct = 0;
        let queryMagnitude = 0;
        let chunkMagnitude = 0;
        
        for (let i = 0; i < specificEmbedding.length; i++) {
          dotProduct += specificEmbedding[i] * embedding[i];
          queryMagnitude += specificEmbedding[i] * specificEmbedding[i];
          chunkMagnitude += embedding[i] * embedding[i];
        }
        
        const similarity = dotProduct / (Math.sqrt(queryMagnitude) * Math.sqrt(chunkMagnitude));
        
        if (similarity >= 0.25) { // Lower threshold
          specificSimilarities.push({
            title: chunk.knowledgeItem.title,
            content: chunk.content,
            similarity: similarity
          });
        }
      } catch (e) {
        // Skip
      }
    }
    
    const specificResults = specificSimilarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);
    
    console.log(`\nSpecific query results (threshold 0.25):`);
    specificResults.forEach((result, i) => {
      const isLowerBodyGuide = result.title.includes('Lower Body Workout');
      console.log(`${i + 1}. ${result.title} (${result.similarity.toFixed(3)}) ${isLowerBodyGuide ? '🎯' : ''}`);
    });
    
    // Recommendation for fixing the retrieval
    console.log('\n📋 RAG Optimization Recommendations:');
    console.log('1. Add specific exercise query to multi-query RAG');
    console.log('2. Lower similarity threshold for exercise guides (0.25)');
    console.log('3. Ensure comprehensive lower body guide gets priority');
    console.log('4. Balance programming (40%) and exercise selection (60%) chunks');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

optimizeRAGRetrieval();
