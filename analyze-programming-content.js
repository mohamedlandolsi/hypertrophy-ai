const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const prisma = new PrismaClient();

async function analyzeProgrammingContent() {
  try {
    console.log('🔍 Analyzing Programming Content Being Passed to AI...\n');
    
    // Get the specific guides that should contain programming info
    const programmingGuides = [
      'A Guide to Rest Periods: How Long to Rest Between Sets for Muscle Growth',
      'A Guide to Optimal Repetition Ranges for Hypertrophy', 
      'A Guide to Training Goals: The Difference Between Strength and Hypertrophy Training',
      'A Guide to Training Volume: Why Less Is More for Muscle Growth'
    ];
    
    for (const guideTitle of programmingGuides) {
      console.log(`📚 Analyzing: "${guideTitle}"`);
      
      const knowledgeItem = await prisma.knowledgeItem.findFirst({
        where: { title: guideTitle },
        include: { chunks: true }
      });
      
      if (knowledgeItem) {
        console.log(`   ✅ Found ${knowledgeItem.chunks.length} chunks`);
        
        knowledgeItem.chunks.forEach((chunk, i) => {
          const content = chunk.content;
          console.log(`\n   Chunk ${i + 1}:`);
          console.log(`   Content: ${content.substring(0, 300)}...`);
          
          // Check for specific programming details
          const hasSpecificReps = content.includes('5-') || content.includes('6-') || content.includes('8-') || content.includes('10-') || content.includes('12-');
          const hasSpecificSets = content.includes('2 sets') || content.includes('3 sets') || content.includes('4 sets') || content.includes('1-2') || content.includes('2-3') || content.includes('3-4');
          const hasSpecificRest = content.includes('2 minutes') || content.includes('3 minutes') || content.includes('2-5') || content.includes('1-2') || content.includes('minute');
          const hasVolumeGuidance = content.toLowerCase().includes('volume') || content.toLowerCase().includes('less is more') || content.toLowerCase().includes('low volume');
          
          console.log(`   Specific reps: ${hasSpecificReps ? '✅' : '❌'}`);
          console.log(`   Specific sets: ${hasSpecificSets ? '✅' : '❌'}`); 
          console.log(`   Specific rest: ${hasSpecificRest ? '✅' : '❌'}`);
          console.log(`   Volume guidance: ${hasVolumeGuidance ? '✅' : '❌'}`);
        });
      } else {
        console.log(`   ❌ Guide not found`);
      }
      console.log();
    }
    
    // Now test what context would actually be built
    console.log('🎯 Testing Actual Context Construction...\n');
    
    const userQuery = "Design a complete, evidence-based leg workout";
    
    // Get the chunks that would be retrieved (simulate the multi-query RAG)
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    
    const result = await embeddingModel.embedContent(userQuery);
    const queryEmbedding = result.embedding.values;
    
    const aiConfig = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });
    
    // Get programming parameter chunks specifically
    const programmingQueries = [
      'sets reps repetitions hypertrophy',
      'rest periods between sets muscle growth',
      'training volume muscle building'
    ];
    
    let allProgrammingChunks = [];
    
    for (const progQuery of programmingQueries) {
      const progResult = await embeddingModel.embedContent(progQuery);
      const progEmbedding = progResult.embedding.values;
      
      const allChunks = await prisma.knowledgeChunk.findMany({
        where: { embeddingData: { not: null } },
        include: { knowledgeItem: { select: { title: true } } }
      });
      
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
          
          if (similarity >= 0.25) { // Relaxed threshold
            progSimilarities.push({
              title: chunk.knowledgeItem.title,
              content: chunk.content,
              similarity: similarity
            });
          }
        } catch (e) {
          // Skip
        }
      }
      
      const topProgResults = progSimilarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 2);
      
      allProgrammingChunks = [...allProgrammingChunks, ...topProgResults];
    }
    
    // Build context like the app does
    const contextParts = allProgrammingChunks.map(chunk => chunk.content);
    const programmingContext = contextParts.join('\n\n---\n\n');
    
    console.log('📄 Programming Context That Would Be Sent to AI:');
    console.log('=' * 80);
    console.log(programmingContext.substring(0, 1000));
    console.log('...');
    console.log('=' * 80);
    
    // Analyze what's in the context
    const hasRepRanges = programmingContext.includes('5-') || programmingContext.includes('6-') || programmingContext.includes('8-') || programmingContext.includes('10-');
    const hasSetGuidance = programmingContext.includes('2 sets') || programmingContext.includes('3 sets') || programmingContext.includes('2-3') || programmingContext.includes('1-2');
    const hasRestPeriods = programmingContext.includes('2 minutes') || programmingContext.includes('3 minutes') || programmingContext.includes('2-5 minutes');
    const hasVolumeInfo = programmingContext.toLowerCase().includes('volume') && programmingContext.toLowerCase().includes('less');
    
    console.log('\n📊 Programming Context Analysis:');
    console.log(`   Contains specific rep ranges: ${hasRepRanges ? '✅' : '❌'}`);
    console.log(`   Contains set guidance: ${hasSetGuidance ? '✅' : '❌'}`);
    console.log(`   Contains rest periods: ${hasRestPeriods ? '✅' : '❌'}`);
    console.log(`   Contains volume guidance: ${hasVolumeInfo ? '✅' : '❌'}`);
    
    if (hasRepRanges && hasSetGuidance && hasRestPeriods) {
      console.log('\n✅ Programming context is comprehensive - AI should be able to provide complete workout!');
      console.log('🔍 Issue is likely in AI prompt interpretation or response construction');
    } else {
      console.log('\n❌ Programming context is incomplete - need to improve content or retrieval');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeProgrammingContent();
