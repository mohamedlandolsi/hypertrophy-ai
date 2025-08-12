const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const prisma = new PrismaClient();

async function debugCurrentRAGContent() {
  try {
    console.log('🔍 Debugging Current RAG Content Being Sent to AI...\n');
    
    const userQuery = "Design a complete, evidence-based leg workout";
    console.log(`📝 Test Query: "${userQuery}"`);
    
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    
    // Generate primary embedding
    const result = await embeddingModel.embedContent(userQuery);
    const queryEmbedding = result.embedding.values;
    
    // Get AI configuration
    const aiConfig = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });
    
    console.log('\n🏋️ Simulating Current Multi-Query RAG Logic:');
    
    // Step 1: Primary search (5 chunks for exercise selection)
    console.log('\n📚 Step 1: Primary search (5 chunks)...');
    
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
            id: chunk.id,
            knowledgeId: chunk.knowledgeItemId,
            chunkIndex: chunk.chunkIndex,
            title: chunk.knowledgeItem.title,
            content: chunk.content,
            similarity: similarity
          });
        }
      } catch (e) {
        // Skip
      }
    }
    
    const exerciseChunks = primarySimilarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);
    
    console.log(`✅ Exercise chunks: ${exerciseChunks.length}`);
    exerciseChunks.forEach((chunk, i) => {
      console.log(`${i + 1}. ${chunk.title} (${chunk.similarity.toFixed(3)})`);
      console.log(`   Content: ${chunk.content.substring(0, 100)}...`);
    });
    
    // Step 2: Secondary searches (2 chunks for programming)
    console.log('\n📊 Step 2: Programming searches (2 chunks)...');
    
    const programmingQueries = [
      'sets reps repetitions hypertrophy muscle growth',
      'rest periods between sets training'
    ];
    
    let allProgrammingChunks = [];
    
    for (const progQuery of programmingQueries) {
      console.log(`\n🔍 Query: "${progQuery}"`);
      
      const progResult = await embeddingModel.embedContent(progQuery);
      const progEmbedding = progResult.embedding.values;
      
      const progSimilarities = [];
      for (const chunk of allChunks) {
        try {
          const embedding = JSON.parse(chunk.embeddingData);
          
          let dotProduct = 0;
          let queryMagnitude = 0;
          let chunkMagnitude = 0;
          
          for (let i = 0; i < progEmbedding.length; i++) {
            dotProduct += progEmbedding[i] * embedding[i];
            queryMagnitude += progEmbedding[i] * progEmbedding[i];
            chunkMagnitude += embedding[i] * embedding[i];
          }
          
          const similarity = dotProduct / (Math.sqrt(queryMagnitude) * Math.sqrt(chunkMagnitude));
          const relaxedThreshold = Math.max(0.25, aiConfig.ragSimilarityThreshold - 0.1);
          
          if (similarity >= relaxedThreshold) {
            progSimilarities.push({
              id: chunk.id,
              knowledgeId: chunk.knowledgeItemId,
              chunkIndex: chunk.chunkIndex,
              title: chunk.knowledgeItem.title,
              content: chunk.content,
              similarity: similarity
            });
          }
        } catch (e) {
          // Skip
        }
      }
      
      const topProgResult = progSimilarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 1); // Only 1 chunk per query
      
      if (topProgResult.length > 0) {
        const chunk = topProgResult[0];
        console.log(`   Result: ${chunk.title} (${chunk.similarity.toFixed(3)})`);
        console.log(`   Content: ${chunk.content.substring(0, 150)}...`);
        allProgrammingChunks.push(chunk);
      } else {
        console.log(`   No results above threshold`);
      }
    }
    
    const programmingChunks = allProgrammingChunks.slice(0, 2);
    
    console.log(`\n✅ Programming chunks: ${programmingChunks.length}`);
    
    // Step 3: Combine and build final context
    console.log('\n🔄 Step 3: Final combination...');
    
    const combinedResults = [...exerciseChunks, ...programmingChunks];
    const uniqueResults = new Map();
    
    combinedResults.forEach(chunk => {
      const key = `${chunk.knowledgeId}-${chunk.chunkIndex}`;
      if (!uniqueResults.has(key)) {
        uniqueResults.set(key, chunk);
      }
    });
    
    const finalChunks = Array.from(uniqueResults.values()).slice(0, 7);
    
    console.log(`\n📝 Final chunks being sent to AI (${finalChunks.length}):`);
    
    let exerciseCount = 0;
    let programmingCount = 0;
    let hasHypertrophyGuidance = false;
    let hasStrengthGuidance = false;
    
    finalChunks.forEach((chunk, i) => {
      const content = chunk.content.toLowerCase();
      const isExercise = content.includes('squat') || content.includes('deadlift') || content.includes('leg press') || content.includes('leg curl');
      const isProgramming = content.includes('rep') || content.includes('set') || content.includes('rest');
      const hasHypertrophy = content.includes('hypertrophy') && (content.includes('5-10') || content.includes('moderate'));
      const hasStrength = content.includes('strength') && content.includes('3-5');
      
      if (isExercise) exerciseCount++;
      if (isProgramming) programmingCount++;
      if (hasHypertrophy) hasHypertrophyGuidance = true;
      if (hasStrength) hasStrengthGuidance = true;
      
      console.log(`${i + 1}. ${chunk.title}`);
      console.log(`   Type: ${isExercise ? 'Exercise' : ''} ${isProgramming ? 'Programming' : ''}`);
      console.log(`   Content: ${chunk.content.substring(0, 120)}...`);
    });
    
    console.log(`\n📊 Final Analysis:`);
    console.log(`   Exercise chunks: ${exerciseCount}/${finalChunks.length}`);
    console.log(`   Programming chunks: ${programmingCount}/${finalChunks.length}`);
    console.log(`   Has hypertrophy guidance: ${hasHypertrophyGuidance ? '✅' : '❌'}`);
    console.log(`   Has strength guidance: ${hasStrengthGuidance ? '✅' : '❌'}`);
    
    if (exerciseCount >= 3 && programmingCount >= 2 && hasHypertrophyGuidance) {
      console.log('\n✅ Good balance - should produce complete leg workout');
    } else if (hasStrengthGuidance && !hasHypertrophyGuidance) {
      console.log('\n⚠️ ISSUE: Getting strength guidance instead of hypertrophy guidance');
      console.log('   Need to improve programming query specificity');
    } else {
      console.log('\n❌ Poor balance - missing key components for complete workout');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugCurrentRAGContent();
