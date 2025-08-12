const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const prisma = new PrismaClient();

async function testMultiQueryRAG() {
  try {
    console.log('🔍 Testing Multi-Query RAG Implementation...\n');
    
    const userQuery = "Design a complete, evidence-based leg workout";
    console.log(`📝 Test Query: "${userQuery}"`);
    
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    
    // Generate primary embedding
    console.log('\n⚡ Generating primary query embedding...');
    const result = await embeddingModel.embedContent(userQuery);
    const queryEmbedding = result.embedding.values;
    
    // Get AI configuration
    const aiConfig = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });
    
    console.log('\n📊 RAG Configuration:');
    console.log(`- Max chunks: ${aiConfig.ragMaxChunks}`);
    console.log(`- Similarity threshold: ${aiConfig.ragSimilarityThreshold}`);
    
    // Test keyword detection (same logic as gemini.ts)
    const workoutKeywords = [
      'workout', 'training', 'exercise', 'program', 'routine',
      'design', 'create', 'build', 'structure', 'plan',
      'complete', 'effective', 'optimal', 'best',
      'rep', 'reps', 'set', 'sets', 'rest', 'progression',
      'muscle', 'chest', 'back', 'legs', 'arms', 'shoulders',
      'bicep', 'tricep', 'quad', 'hamstring', 'glute', 'calves'
    ];
    
    const isWorkoutProgrammingQuery = workoutKeywords.some(keyword => 
      userQuery.toLowerCase().includes(keyword.toLowerCase())
    );
    
    console.log(`\n🎯 Workout programming query detected: ${isWorkoutProgrammingQuery}`);
    
    if (isWorkoutProgrammingQuery) {
      console.log('🏋️ Executing comprehensive workout programming retrieval...');
      
      // Step 1: Primary search (exercise selection)
      console.log('\n📚 Step 1: Primary search for exercise selection...');
      const primaryChunkTarget = Math.floor(aiConfig.ragMaxChunks * 0.6); // 60%
      console.log(`   Target chunks: ${primaryChunkTarget}`);
      
      // Simulate fetchRelevantKnowledge for primary search
      const allChunks = await prisma.knowledgeChunk.findMany({
        where: { embeddingData: { not: null } },
        include: { knowledgeItem: { select: { title: true } } }
      });
      
      console.log(`   Total chunks available: ${allChunks.length}`);
      
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
          // Skip invalid embeddings
        }
      }
      
      const primaryResults = primarySimilarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, primaryChunkTarget);
      
      console.log(`   ✅ Primary results: ${primaryResults.length} chunks`);
      primaryResults.forEach((result, i) => {
        console.log(`   ${i + 1}. ${result.title} (${result.similarity.toFixed(3)})`);
      });
      
      // Step 2: Secondary searches (programming parameters)
      console.log('\n📊 Step 2: Secondary searches for programming parameters...');
      const programmingQueries = [
        'sets reps repetitions hypertrophy',
        'rest periods between sets muscle growth',
        'training volume muscle building'
      ];
      
      let allSecondaryResults = [];
      
      for (const progQuery of programmingQueries) {
        console.log(`\n   🔍 Processing: "${progQuery}"`);
        try {
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
              // Skip invalid embeddings
            }
          }
          
          const progResults = progSimilarities
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 2); // 2 chunks per programming aspect
          
          console.log(`   📊 "${progQuery}": ${progResults.length} chunks`);
          progResults.forEach((result, i) => {
            console.log(`      ${i + 1}. ${result.title} (${result.similarity.toFixed(3)})`);
          });
          
          allSecondaryResults = [...allSecondaryResults, ...progResults];
          
        } catch (progError) {
          console.warn(`   ⚠️ Programming query failed: ${progQuery}`, progError.message);
        }
      }
      
      console.log(`\n📊 Secondary results total: ${allSecondaryResults.length} chunks`);
      
      // Step 3: Combine and deduplicate
      console.log('\n🔄 Step 3: Combining and deduplicating results...');
      const combinedResults = [...primaryResults, ...allSecondaryResults];
      const uniqueResults = new Map();
      
      combinedResults.forEach(chunk => {
        const key = `${chunk.knowledgeId}-${chunk.chunkIndex}`;
        if (!uniqueResults.has(key)) {
          uniqueResults.set(key, chunk);
        }
      });
      
      const finalResults = Array.from(uniqueResults.values())
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, aiConfig.ragMaxChunks);
      
      console.log(`\n✅ Final comprehensive results: ${finalResults.length} chunks`);
      
      // Analyze final results
      let exerciseCount = 0;
      let repCount = 0;
      let setCount = 0;
      let restCount = 0;
      
      finalResults.forEach((result, i) => {
        const content = result.content.toLowerCase();
        const hasExercise = content.includes('squat') || content.includes('deadlift') || content.includes('leg press') || content.includes('leg curl');
        const hasReps = content.includes('rep') && (content.includes('range') || content.includes('5-') || content.includes('8-') || content.includes('10-'));
        const hasSets = content.includes('set') && (content.includes('2') || content.includes('3') || content.includes('4'));
        const hasRest = content.includes('rest') && (content.includes('minute') || content.includes('second'));
        
        if (hasExercise) exerciseCount++;
        if (hasReps) repCount++;
        if (hasSets) setCount++;
        if (hasRest) restCount++;
        
        console.log(`${i + 1}. ${result.title} (${result.similarity.toFixed(3)})`);
        console.log(`   Exercise: ${hasExercise ? '✅' : '❌'} | Reps: ${hasReps ? '✅' : '❌'} | Sets: ${hasSets ? '✅' : '❌'} | Rest: ${hasRest ? '✅' : '❌'}`);
      });
      
      console.log(`\n📊 Final Coverage Analysis:`);
      console.log(`   Exercise info: ${exerciseCount}/${finalResults.length} chunks`);
      console.log(`   Rep ranges: ${repCount}/${finalResults.length} chunks`);
      console.log(`   Set numbers: ${setCount}/${finalResults.length} chunks`);
      console.log(`   Rest periods: ${restCount}/${finalResults.length} chunks`);
      
      if (exerciseCount >= 3 && repCount >= 1 && setCount >= 1 && restCount >= 1) {
        console.log('\n✅ GOOD: Comprehensive workout information retrieved!');
      } else {
        console.log('\n❌ PROBLEM: Missing critical workout programming information!');
        console.log('🔧 Multi-query RAG needs optimization');
      }
      
    } else {
      console.log('❌ Standard vector retrieval (no multi-query)');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testMultiQueryRAG();
