const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixCorruptedGuides() {
  try {
    console.log('🔧 Fixing Corrupted Knowledge Base Guides...\n');
    
    // Identify the problematic guides
    const corruptedGuides = [
      'A Guide to Training Goals: The Difference Between Strength and Hypertrophy Training',
      'A Guide to Training Volume: Why High Volume Is Not Optimal for Hypertrophy'
    ];
    
    for (const guideTitle of corruptedGuides) {
      console.log(`🗑️ Processing: ${guideTitle}`);
      
      const guide = await prisma.knowledgeItem.findFirst({
        where: { title: guideTitle },
        include: { chunks: true }
      });
      
      if (!guide) {
        console.log(`   ❌ Guide not found`);
        continue;
      }
      
      console.log(`   📊 Current chunks: ${guide.chunks.length}`);
      
      // Identify corrupted chunks (very short or repetitive content)
      const corruptedChunks = [];
      const validChunks = [];
      
      guide.chunks.forEach(chunk => {
        const content = chunk.content.trim();
        
        // Mark as corrupted if:
        // 1. Very short content (< 100 chars)
        // 2. Repetitive content (same sentence fragments)
        // 3. Incomplete sentences
        const isCorrupted = (
          content.length < 100 ||
          content.includes('lifting more weight or performing more reps over time)....') ||
          content.endsWith('...') && content.length < 200 ||
          content.startsWith('e in strength') ||
          content.startsWith('n increase') ||
          content.startsWith('increase in')
        );
        
        if (isCorrupted) {
          corruptedChunks.push(chunk);
        } else {
          validChunks.push(chunk);
        }
      });
      
      console.log(`   🗑️ Corrupted chunks to remove: ${corruptedChunks.length}`);
      console.log(`   ✅ Valid chunks to keep: ${validChunks.length}`);
      
      if (corruptedChunks.length > 0) {
        // Remove corrupted chunks
        const chunkIds = corruptedChunks.map(chunk => chunk.id);
        
        console.log(`   🗑️ Removing ${chunkIds.length} corrupted chunks...`);
        
        const deleted = await prisma.knowledgeChunk.deleteMany({
          where: {
            id: { in: chunkIds }
          }
        });
        
        console.log(`   ✅ Deleted ${deleted.count} corrupted chunks`);
        
        // Show remaining valid chunks
        if (validChunks.length > 0) {
          console.log(`   📚 Remaining valid chunks:`);
          validChunks.slice(0, 3).forEach((chunk, i) => {
            console.log(`      ${i + 1}. ${chunk.content.substring(0, 80)}... (${chunk.content.length} chars)`);
          });
        } else {
          console.log(`   ⚠️ No valid chunks remaining - guide may need complete reprocessing`);
        }
      } else {
        console.log(`   ✅ No corrupted chunks found`);
      }
      
      console.log();
    }
    
    console.log('🧪 Testing improved retrieval...');
    
    // Test leg workout query again to see if it's improved
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    
    const legQuery = "Design a complete, evidence-based leg workout";
    const result = await embeddingModel.embedContent(legQuery);
    const queryEmbedding = result.embedding.values;
    
    const aiConfig = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });
    
    // Test programming queries
    const programmingQueries = [
      'sets reps repetitions hypertrophy',
      'rest periods between sets muscle growth'
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
          
          if (similarity >= 0.25) {
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
    
    console.log(`\n📊 Post-cleanup programming retrieval: ${allProgrammingChunks.length} chunks`);
    
    let hasCleanContent = 0;
    allProgrammingChunks.forEach((chunk, i) => {
      const isClean = chunk.content.length > 100 && 
                     !chunk.content.includes('lifting more weight or performing more reps over time)') &&
                     !chunk.content.endsWith('....');
      
      if (isClean) hasCleanContent++;
      
      console.log(`${i + 1}. ${chunk.title} (${chunk.similarity.toFixed(3)})`);
      console.log(`   Clean content: ${isClean ? '✅' : '❌'} (${chunk.content.length} chars)`);
    });
    
    console.log(`\n📈 Improvement: ${hasCleanContent}/${allProgrammingChunks.length} chunks have clean content`);
    
    if (hasCleanContent >= allProgrammingChunks.length * 0.8) {
      console.log('✅ Corruption cleanup successful!');
      console.log('🎯 Leg workout responses should now be much more complete');
    } else {
      console.log('❌ Additional cleanup may be needed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixCorruptedGuides();
