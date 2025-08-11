const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testAIRetrievalFlow() {
  console.log('🧪 Testing AI Retrieval Flow for Upper/Lower Programs');
  console.log('===================================================\n');

  try {
    // 1. Simulate the exact query that's failing
    const userQuery = 'Create a complete upper/lower program for me';
    console.log(`🎯 Testing Query: "${userQuery}"\n`);

    // 2. Generate embeddings like the AI does
    console.log('🔄 Generating embeddings...');
    const embeddingResult = await genAI.getGenerativeModel({ model: "text-embedding-004" })
      .embedContent(userQuery);
    const queryEmbedding = embeddingResult.embedding.values;
    console.log(`✅ Generated ${queryEmbedding.length} dimension embedding\n`);

    // 3. Get current AI configuration
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });

    console.log('📊 AI Configuration:');
    console.log(`   RAG Similarity Threshold: ${config.ragSimilarityThreshold}`);
    console.log(`   RAG Max Chunks: ${config.ragMaxChunks}`);
    console.log(`   RAG High Relevance Threshold: ${config.ragHighRelevanceThreshold}\n`);

    // 4. Test vector search directly
    console.log('🔍 Testing Vector Search...');
    
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

    console.log(`📊 Vector Search Results: ${vectorResults.length} chunks`);
    
    if (vectorResults.length === 0) {
      console.log('❌ NO RESULTS from vector search!');
      console.log('🔧 Testing with looser threshold...\n');
      
      // Try with much looser threshold
      const looserResults = await prisma.$queryRaw`
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
        ORDER BY similarity ASC
        LIMIT 10
      `;
      
      console.log(`📊 Looser Search Results: ${looserResults.length} chunks`);
      
      if (looserResults.length > 0) {
        console.log('🎯 Top similarity scores:');
        looserResults.slice(0, 5).forEach((result, index) => {
          console.log(`   ${index + 1}. Score: ${result.similarity} - "${result.title}"`);
          console.log(`      Content: "${result.content.substring(0, 100)}..."\n`);
        });
        
        const bestScore = looserResults[0].similarity;
        const currentThreshold = config.ragSimilarityThreshold;
        
        console.log(`🚨 ISSUE FOUND:`);
        console.log(`   Best similarity score: ${bestScore}`);
        console.log(`   Current threshold: ${currentThreshold}`);
        
        if (bestScore > currentThreshold) {
          console.log(`   ❌ THRESHOLD TOO STRICT: Best score (${bestScore}) > threshold (${currentThreshold})`);
          console.log(`   🔧 SOLUTION: Lower threshold to ${Math.max(bestScore + 0.1, 0.5)}`);
        }
      }
    } else {
      console.log('✅ Vector search returned results:');
      vectorResults.forEach((result, index) => {
        console.log(`   ${index + 1}. Score: ${result.similarity} - "${result.title}"`);
        console.log(`      Content: "${result.content.substring(0, 100)}..."\n`);
      });
    }

    // 5. Check for upper/lower specific content
    console.log('🎯 Checking for Upper/Lower Specific Content...\n');
    
    const upperLowerItems = await prisma.knowledgeItem.findMany({
      where: {
        OR: [
          { title: { contains: 'Upper Body', mode: 'insensitive' } },
          { title: { contains: 'Lower Body', mode: 'insensitive' } }
        ],
        status: 'READY'
      },
      include: {
        chunks: {
          select: {
            id: true,
            embeddingData: true,
            content: true
          },
          take: 1
        }
      }
    });

    console.log(`📖 Found ${upperLowerItems.length} Upper/Lower specific guides:`);
    
    for (const item of upperLowerItems) {
      console.log(`\n📄 "${item.title}"`);
      console.log(`   Status: ${item.status}, Chunks: ${item.chunks.length}`);
      
      if (item.chunks.length > 0 && item.chunks[0].embeddingData) {
        // Test similarity to this specific guide
        const guideEmbedding = item.chunks[0].embeddingData;
        
        const similarity = await prisma.$queryRaw`
          SELECT (${guideEmbedding}::vector <=> ${embeddingStr}::vector) as similarity
        `;
        
        console.log(`   Similarity to query: ${similarity[0].similarity}`);
        console.log(`   Content preview: "${item.chunks[0].content.substring(0, 100)}..."`);
        
        if (similarity[0].similarity > config.ragSimilarityThreshold) {
          console.log(`   ❌ Above threshold (${config.ragSimilarityThreshold}) - would be filtered out`);
        } else {
          console.log(`   ✅ Below threshold - would be included`);
        }
      } else {
        console.log(`   ❌ No embeddings found - chunk not processed!`);
      }
    }

    console.log('\n💡 DIAGNOSIS SUMMARY:');
    if (vectorResults.length === 0) {
      console.log('🚨 CRITICAL ISSUE: Vector search returns no results');
      console.log('   Possible causes:');
      console.log('   1. Threshold too strict');
      console.log('   2. Embeddings not generated for upper/lower content');
      console.log('   3. Vector distance calculation issue');
    } else {
      console.log('✅ Vector search working, but may not find upper/lower specific content');
    }

  } catch (error) {
    console.error('❌ Error testing AI retrieval flow:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAIRetrievalFlow();
