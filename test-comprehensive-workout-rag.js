const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testComprehensiveWorkoutRAG() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing Comprehensive Workout RAG Approach...\n');
    
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
    console.log(`  Max Chunks: ${config.ragMaxChunks}`);
    console.log(`  Similarity Threshold: ${config.ragSimilarityThreshold}\n`);
    
    // Test the exact query that was problematic
    const testQuery = "Design a complete, evidence-based leg workout";
    console.log(`🎯 Testing Query: "${testQuery}"\n`);
    
    // Step 1: Primary search (Exercise selection)
    console.log('🎯 Step 1: Primary Exercise Search');
    const primaryEmbedding = await genAI.getGenerativeModel({ model: "text-embedding-004" })
      .embedContent(testQuery);
    
    const primaryResults = await performVectorSearch(
      primaryEmbedding.embedding.values,
      Math.floor(config.ragMaxChunks * 0.6), // 60% for primary
      config.ragSimilarityThreshold,
      prisma
    );
    
    console.log(`  📊 Primary results: ${primaryResults.length} chunks`);
    primaryResults.forEach((chunk, i) => {
      console.log(`    ${i+1}. "${chunk.title}" (${chunk.similarity.toFixed(3)})`);
    });
    
    // Step 2: Programming parameters searches
    console.log('\n📊 Step 2: Programming Parameters Search');
    const programmingQueries = [
      'sets reps repetitions hypertrophy',
      'rest periods between sets muscle growth',
      'training volume muscle building'
    ];
    
    let allSecondaryResults = [];
    
    for (const progQuery of programmingQueries) {
      console.log(`\n🔍 Searching: "${progQuery}"`);
      
      try {
        const progEmbedding = await genAI.getGenerativeModel({ model: "text-embedding-004" })
          .embedContent(progQuery);
        
        const progResults = await performVectorSearch(
          progEmbedding.embedding.values,
          2, // 2 chunks per aspect
          Math.max(0.25, config.ragSimilarityThreshold - 0.1), // Relaxed threshold
          prisma
        );
        
        console.log(`  📊 Found ${progResults.length} chunks:`);
        progResults.forEach((chunk, i) => {
          console.log(`    ${i+1}. "${chunk.title}" (${chunk.similarity.toFixed(3)})`);
        });
        
        allSecondaryResults = [...allSecondaryResults, ...progResults];
        
      } catch (error) {
        console.error(`  ❌ Error: ${error.message}`);
      }
    }
    
    // Step 3: Combine and deduplicate
    console.log('\n🔄 Step 3: Combining Results');
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
      .slice(0, config.ragMaxChunks);
    
    console.log(`\n✅ Final Combined Results: ${finalResults.length}/${config.ragMaxChunks} chunks`);
    finalResults.forEach((chunk, i) => {
      const content = chunk.content.toLowerCase();
      const hasSetRepsRest = content.includes('sets') || content.includes('reps') || content.includes('repetitions') || content.includes('rest');
      console.log(`  ${i+1}. "${chunk.title}" (${chunk.similarity.toFixed(3)}) ${hasSetRepsRest ? '✅' : '❌'}`);
    });
    
    // Analysis
    const totalWithSetRepsRest = finalResults.filter(chunk => {
      const content = chunk.content.toLowerCase();
      return content.includes('sets') || content.includes('reps') || content.includes('repetitions') || content.includes('rest');
    }).length;
    
    console.log(`\n🎯 Analysis:`);
    console.log(`  • Exercise selection chunks: ${primaryResults.length}`);
    console.log(`  • Programming parameter chunks: ${allSecondaryResults.length}`);
    console.log(`  • Final chunks with sets/reps/rest: ${totalWithSetRepsRest}/${finalResults.length}`);
    
    if (totalWithSetRepsRest > 0) {
      console.log(`  ✅ SUCCESS: AI will have programming parameters!`);
    } else {
      console.log(`  ❌ ISSUE: Still missing programming parameters`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function performVectorSearch(queryEmbedding, topK, threshold, prisma) {
  const embeddingStr = `[${queryEmbedding.join(',')}]`;
  
  const chunks = await prisma.$queryRaw`
    SELECT
      kc.content,
      ki.id as "knowledgeId", 
      ki.title,
      1 - (kc."embeddingData"::vector <=> ${embeddingStr}::vector) as similarity,
      kc."chunkIndex"
    FROM "KnowledgeChunk" kc
    JOIN "KnowledgeItem" ki ON kc."knowledgeItemId" = ki.id  
    WHERE ki.status = 'READY' 
      AND kc."embeddingData" IS NOT NULL
    ORDER BY kc."embeddingData"::vector <=> ${embeddingStr}::vector
    LIMIT ${topK}
  `;
  
  return chunks.filter(chunk => chunk.similarity >= threshold);
}

testComprehensiveWorkoutRAG();
