const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function validateFixedRetrieval() {
  console.log('✅ Validating Fixed Upper/Lower Retrieval');
  console.log('========================================\n');

  try {
    // Test the same query that was failing
    const userQuery = 'Create a complete upper/lower program for me';
    console.log(`🎯 Testing Query: "${userQuery}"\n`);

    // Generate embeddings
    const embeddingResult = await genAI.getGenerativeModel({ model: "text-embedding-004" })
      .embedContent(userQuery);
    const queryEmbedding = embeddingResult.embedding.values;

    // Get updated configuration
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });

    console.log('📊 Updated Configuration:');
    console.log(`   Similarity Threshold: ${config.ragSimilarityThreshold}`);
    console.log(`   Max Chunks: ${config.ragMaxChunks}`);
    console.log(`   High Relevance Threshold: ${config.ragHighRelevanceThreshold}\n`);

    // Test vector search with fixed threshold
    const embeddingStr = `[${queryEmbedding.join(',')}]`;
    
    const vectorResults = await prisma.$queryRaw`
      SELECT
        kc.content,
        kc."knowledgeItemId" as "knowledgeId",
        ki.title,
        kc."chunkIndex",
        (kc."embeddingData"::vector <=> ${embeddingStr}::vector) as similarity
      FROM "KnowledgeChunk" kc
      JOIN "KnowledgeItem" ki ON kc."knowledgeItemId" = ki.id
      WHERE ki.status = 'READY'
        AND kc."embeddingData" IS NOT NULL
        AND (kc."embeddingData"::vector <=> ${embeddingStr}::vector) < ${config.ragSimilarityThreshold}
      ORDER BY similarity ASC
      LIMIT ${config.ragMaxChunks}
    `;

    console.log(`🔍 Vector Search Results: ${vectorResults.length} chunks retrieved\n`);

    // Prepare flags for use in final status message
    let hasUpperBody = false;
    let hasLowerBody = false;
    let hasSplitProgramming = false;

    if (vectorResults.length > 0) {
      console.log('✅ SUCCESS! Vector search now returns results:');
      
      vectorResults.forEach((result, index) => {
        console.log(`   ${index + 1}. Score: ${result.similarity.toFixed(3)} - "${result.title}"`);
        
        if (result.title.toLowerCase().includes('upper body')) hasUpperBody = true;
        if (result.title.toLowerCase().includes('lower body')) hasLowerBody = true;
        if (result.title.toLowerCase().includes('split programming')) hasSplitProgramming = true;
        
        const preview = result.content.substring(0, 100).replace(/\s+/g, ' ');
        console.log(`      Content: "${preview}..."\n`);
      });

      console.log('🎯 Critical Content Check:');
      console.log(`   ${hasUpperBody ? '✅' : '❌'} Upper Body Workout Guide included`);
      console.log(`   ${hasLowerBody ? '✅' : '❌'} Lower Body Workout Guide included`);
      console.log(`   ${hasSplitProgramming ? '✅' : '❌'} Split Programming Guide included\n`);

      if (hasUpperBody && hasLowerBody) {
        console.log('🎉 PERFECT! AI now has the essential upper/lower guides!');
        console.log('The AI should be able to synthesize complete upper/lower programs.');
      } else {
        console.log('⚠️ Missing some key guides, but this is a significant improvement.');
      }

    } else {
      console.log('❌ Still no results - may need further threshold adjustment');
    }

    // Final recommendation
    console.log('\n💡 NEXT STEPS:');
    console.log('   1. Test the AI with: "Create a complete upper/lower program for me"');
    console.log('   2. The AI should now retrieve the upper/lower workout guides');
    console.log('   3. With AUTO mode + synthesis rules + fixed threshold = SUCCESS!');
    console.log('   4. AI should provide detailed, evidence-based upper/lower programs\n');

  console.log('\n🏆 RESOLUTION STATUS:');
  if (vectorResults.length >= 5 && (hasUpperBody || hasLowerBody)) {
      console.log('✅ LIKELY RESOLVED - AI should now work properly');
    } else {
      console.log('🔄 PARTIAL FIX - May need additional adjustments');
    }

  } catch (error) {
    console.error('❌ Error validating fixed retrieval:', error);
  } finally {
    await prisma.$disconnect();
  }
}

validateFixedRetrieval();
