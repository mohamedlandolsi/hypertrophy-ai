const { GoogleGenerativeAI } = require('@google/generative-ai');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function debugQueryTransformation() {
  try {
    console.log('🔍 DEBUG: Query Transformation Analysis');
    console.log('=======================================');
    
    const originalQuery = 'What are the best chest exercises for muscle growth?';
    console.log(`Original query: "${originalQuery}"`);
    
    // Test the query transformation function
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 150,
      }
    });

    const prompt = `You are a query enhancement expert for fitness and hypertrophy knowledge retrieval.

Original query: "${originalQuery}"

Recent conversation context:


Task: Transform the original query into a more effective search query that will retrieve relevant fitness, nutrition, and training information. Focus on:
1. Adding relevant fitness/training terminology
2. Expanding abbreviations and implicit concepts
3. Including alternative phrasings
4. Maintaining the core intent

Rules:
- Keep it concise (max 2-3 sentences)
- Use scientific and fitness terminology
- Include synonyms for key concepts
- Don't change the fundamental question

Enhanced query:`;

    const result = await model.generateContent(prompt);
    const enhancedQuery = result.response.text().trim();
    
    console.log(`Enhanced query: "${enhancedQuery}"`);
    
    // Now test both queries against chest content directly
    const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    
    console.log('\n🧪 Testing both queries against chest content...');
    
    // Get some chest chunks
    const chestChunks = await prisma.knowledgeChunk.findMany({
      where: {
        knowledgeItem: {
          title: { contains: 'Chest', mode: 'insensitive' }
        },
        embeddingData: { not: null }
      },
      take: 5,
      include: { knowledgeItem: { select: { title: true } } }
    });
    
    console.log(`Found ${chestChunks.length} chest chunks to test against`);
    
    // Test original query
    const originalEmbedding = await embeddingModel.embedContent(originalQuery);
    const originalVector = originalEmbedding.embedding.values;
    
    // Test enhanced query
    const enhancedEmbedding = await embeddingModel.embedContent(enhancedQuery);
    const enhancedVector = enhancedEmbedding.embedding.values;
    
    function cosineSimilarity(vectorA, vectorB) {
      let dotProduct = 0;
      let normA = 0;
      let normB = 0;

      for (let i = 0; i < vectorA.length; i++) {
        dotProduct += vectorA[i] * vectorB[i];
        normA += vectorA[i] * vectorA[i];
        normB += vectorB[i] * vectorB[i];
      }

      normA = Math.sqrt(normA);
      normB = Math.sqrt(normB);
      if (normA === 0 || normB === 0) return 0;
      return dotProduct / (normA * normB);
    }
    
    console.log('\n📊 Similarity Comparison:');
    console.log('=========================');
    
    for (let i = 0; i < chestChunks.length; i++) {
      const chunk = chestChunks[i];
      
      try {
        const chunkEmbedding = JSON.parse(chunk.embeddingData);
        
        const originalSim = cosineSimilarity(originalVector, chunkEmbedding);
        const enhancedSim = cosineSimilarity(enhancedVector, chunkEmbedding);
        
        console.log(`\nChunk ${chunk.chunkIndex}:`);
        console.log(`  Original query:  ${(originalSim * 100).toFixed(2)}%`);
        console.log(`  Enhanced query:  ${(enhancedSim * 100).toFixed(2)}%`);
        console.log(`  Improvement:     ${enhancedSim > originalSim ? '✅' : '❌'} ${((enhancedSim - originalSim) * 100).toFixed(2)}%`);
        console.log(`  Content preview: "${chunk.content.substring(0, 100)}..."`);
        
      } catch (error) {
        console.log(`  ❌ Error parsing chunk ${chunk.chunkIndex}`);
      }
    }
    
    // Also test what content is getting higher scores
    console.log('\n🔍 Testing what content gets higher similarity...');
    
    // Get some high-scoring content from our previous test
    const highScoringTitles = [
      'Matching Resistance Profiles to Upper Body Muscles',
      'Full-Body Workouts for Men',
      'Recommended Gym Accessories'
    ];
    
    for (const title of highScoringTitles) {
      const chunks = await prisma.knowledgeChunk.findMany({
        where: {
          knowledgeItem: {
            title: { contains: title, mode: 'insensitive' }
          },
          embeddingData: { not: null }
        },
        take: 2,
        include: { knowledgeItem: { select: { title: true } } }
      });
      
      if (chunks.length > 0) {
        const chunk = chunks[0];
        try {
          const chunkEmbedding = JSON.parse(chunk.embeddingData);
          const similarity = cosineSimilarity(originalVector, chunkEmbedding);
          
          console.log(`\n"${chunk.knowledgeItem.title}": ${(similarity * 100).toFixed(2)}%`);
          console.log(`  Content: "${chunk.content.substring(0, 120)}..."`);
        } catch (error) {
          console.log(`  ❌ Error with ${title}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugQueryTransformation();
