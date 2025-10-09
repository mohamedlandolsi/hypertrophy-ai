const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const prisma = new PrismaClient();

async function analyzeRAGIssues() {
  try {
    console.log('🔍 Analyzing RAG Issues for Leg Workout...\n');
    
    // First, let's see what programming guides exist
    console.log('📚 Checking for programming guides in KB...');
    const programmingGuides = await prisma.knowledgeItem.findMany({
      where: {
        OR: [
          { title: { contains: 'rep', mode: 'insensitive' } },
          { title: { contains: 'set', mode: 'insensitive' } },
          { title: { contains: 'rest', mode: 'insensitive' } },
          { title: { contains: 'volume', mode: 'insensitive' } },
          { title: { contains: 'frequency', mode: 'insensitive' } },
          { title: { contains: 'hypertrophy', mode: 'insensitive' } },
          { title: { contains: 'strength', mode: 'insensitive' } }
        ]
      },
      include: {
        chunks: { take: 1 }
      }
    });
    
    console.log(`\n✅ Found ${programmingGuides.length} programming guides:`);
    programmingGuides.forEach(guide => {
      console.log(`- ${guide.title} (${guide.chunks.length} chunks)`);
    });
    
    // Test leg workout query embedding
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    
    const legQuery = "Design a complete, evidence-based leg workout";
    const result = await embeddingModel.embedContent(legQuery);
    const legQueryEmbedding = result.embedding.values;
    
    // Test programming-specific queries
    const programmingQueries = [
      "How many sets and reps for leg workout",
      "Rest periods between sets for hypertrophy", 
      "Rep ranges for muscle growth",
      "Training volume for legs"
    ];
    
    console.log('\n🧪 Testing programming query similarities...');
    
    for (const query of programmingQueries) {
      console.log(`\n📝 Query: "${query}"`);
      const result = await embeddingModel.embedContent(query);
      const queryEmbedding = result.embedding.values;
      
      // Get all chunks and calculate similarities
      const allChunks = await prisma.knowledgeChunk.findMany({
        where: { embeddingData: { not: null } },
        include: { knowledgeItem: { select: { title: true } } }
      });
      
      const similarities = [];
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
          
          if (similarity >= 0.2) { // Lower threshold to see more results
            similarities.push({
              title: chunk.knowledgeItem.title,
              content: chunk.content.substring(0, 100),
              similarity: similarity
            });
          }
        } catch (e) {
          // Skip
        }
      }
      
      // Sort and show top results
      const topResults = similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5);
      
      console.log(`   Top matches (threshold 0.2+):`);
      topResults.forEach((result, i) => {
        console.log(`   ${i + 1}. ${result.title} (${result.similarity.toFixed(3)})`);
        console.log(`      ${result.content}...`);
      });
      
      if (topResults.length === 0) {
        console.log('   ❌ No matches above 0.2 similarity');
      }
    }
    
    // Now test what happens with comprehensive workout query
    console.log('\n🎯 Testing comprehensive workout retrieval...');
    
    const comprehensiveQuery = "Design a complete leg workout including sets reps rest periods exercises for muscle growth hypertrophy";
    const compResult = await embeddingModel.embedContent(comprehensiveQuery);
    const compQueryEmbedding = compResult.embedding.values;
    
    const allChunks = await prisma.knowledgeChunk.findMany({
      where: { embeddingData: { not: null } },
      include: { knowledgeItem: { select: { title: true } } }
    });
    
    const compSimilarities = [];
    for (const chunk of allChunks) {
      try {
        const embedding = JSON.parse(chunk.embeddingData);
        
        let dotProduct = 0;
        let queryMagnitude = 0;
        let chunkMagnitude = 0;
        
        for (let i = 0; i < compQueryEmbedding.length; i++) {
          dotProduct += compQueryEmbedding[i] * embedding[i];
          queryMagnitude += compQueryEmbedding[i] * compQueryEmbedding[i];
          chunkMagnitude += embedding[i] * embedding[i];
        }
        
        const similarity = dotProduct / (Math.sqrt(queryMagnitude) * Math.sqrt(chunkMagnitude));
        
        if (similarity >= 0.3) {
          compSimilarities.push({
            title: chunk.knowledgeItem.title,
            content: chunk.content,
            similarity: similarity
          });
        }
      } catch (e) {
        // Skip
      }
    }
    
    const topCompResults = compSimilarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 7);
    
    console.log(`\n📊 Comprehensive query results (${topCompResults.length}/7):`);
    let hasRepInfo = 0;
    let hasSetInfo = 0;
    let hasRestInfo = 0;
    let hasExerciseInfo = 0;
    
    topCompResults.forEach((result, i) => {
      const content = result.content.toLowerCase();
      const hasReps = content.includes('rep') && (content.includes('range') || content.includes('5-') || content.includes('8-') || content.includes('10-'));
      const hasSets = content.includes('set') && (content.includes('3') || content.includes('4') || content.includes('2'));
      const hasRest = content.includes('rest') && (content.includes('minute') || content.includes('second'));
      const hasExercise = content.includes('squat') || content.includes('deadlift') || content.includes('leg press') || content.includes('leg curl');
      
      if (hasReps) hasRepInfo++;
      if (hasSets) hasSetInfo++;
      if (hasRest) hasRestInfo++;
      if (hasExercise) hasExerciseInfo++;
      
      console.log(`${i + 1}. ${result.title} (${result.similarity.toFixed(3)})`);
      console.log(`   Reps: ${hasReps ? '✅' : '❌'} | Sets: ${hasSets ? '✅' : '❌'} | Rest: ${hasRest ? '✅' : '❌'} | Exercise: ${hasExercise ? '✅' : '❌'}`);
    });
    
    console.log(`\n📊 Programming Info Coverage:`);
    console.log(`   Rep ranges: ${hasRepInfo}/7 chunks`);
    console.log(`   Set numbers: ${hasSetInfo}/7 chunks`);
    console.log(`   Rest periods: ${hasRestInfo}/7 chunks`);
    console.log(`   Exercise info: ${hasExerciseInfo}/7 chunks`);
    
    if (hasRepInfo < 2 || hasSetInfo < 2 || hasRestInfo < 1) {
      console.log('\n❌ PROBLEM IDENTIFIED: Programming info not being retrieved!');
      console.log('🔧 Need to implement multi-query RAG or adjust similarity thresholds');
    } else {
      console.log('\n✅ Good programming coverage in retrieval');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeRAGIssues();
