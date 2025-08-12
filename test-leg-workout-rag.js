const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testLegWorkoutRAGRetrieval() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing RAG Retrieval for Leg Workout Query...\n');
    
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
    console.log(`  Similarity Threshold: ${config.ragSimilarityThreshold}`);
    console.log(`  High Relevance Threshold: ${config.ragHighRelevanceThreshold}\n`);
    
    // Test the exact query that was problematic
    const testQuery = "Design a complete, evidence-based leg workout";
    console.log(`🎯 Testing Query: "${testQuery}"\n`);
    
    try {
      // Generate embedding
      const embeddingResult = await genAI.getGenerativeModel({ model: "text-embedding-004" })
        .embedContent(testQuery);
      const queryEmbedding = embeddingResult.embedding.values;
      
      // Perform the same search the system would do
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
        LIMIT ${config.ragMaxChunks}
      `;
      
      const results = chunks.filter(chunk => chunk.similarity >= config.ragSimilarityThreshold);
      
      console.log(`📊 Retrieved ${results.length}/${config.ragMaxChunks} chunks above threshold\n`);
      
      results.forEach((chunk, i) => {
        console.log(`${i + 1}. "${chunk.title}" (similarity: ${chunk.similarity.toFixed(3)})`);
        
        // Check if this chunk contains sets/reps/rest information
        const content = chunk.content.toLowerCase();
        const hasSetRepsRest = content.includes('sets') || content.includes('reps') || content.includes('repetitions') || content.includes('rest');
        console.log(`   Contains sets/reps/rest: ${hasSetRepsRest ? '✅' : '❌'}`);
        
        // Show content preview
        console.log(`   Content preview: ${chunk.content.substring(0, 150)}...`);
        console.log('');
      });
      
      // Check if we're missing important documents
      console.log('🔍 Checking for missing key documents...\n');
      
      // Search for rest period guide specifically
      const restGuide = await prisma.knowledgeItem.findFirst({
        where: {
          title: {
            contains: 'Rest Periods',
            mode: 'insensitive'
          },
          status: 'READY'
        }
      });
      
      if (restGuide) {
        console.log(`✅ Found "Rest Periods" guide: "${restGuide.title}"`);
        
        // Check if this document appeared in results
        const appeared = results.some(r => r.knowledgeId === restGuide.id);
        console.log(`   Appeared in results: ${appeared ? '✅' : '❌'}`);
        
        if (!appeared) {
          // Check its similarity manually
          const restChunks = await prisma.knowledgeChunk.findMany({
            where: {
              knowledgeItemId: restGuide.id,
              embeddingData: { not: null }
            },
            take: 3
          });
          
          console.log(`   📊 Has ${restChunks.length} embedded chunks`);
          
          if (restChunks.length > 0) {
            const firstChunk = restChunks[0];
            const embedding1 = JSON.parse(firstChunk.embeddingData || '[]');
            
            if (embedding1.length > 0) {
              const embeddingStr1 = `[${embedding1.join(',')}]`;
              const similarityCheck = await prisma.$queryRaw`
                SELECT 1 - (${embeddingStr}::vector <=> ${embeddingStr1}::vector) as similarity
              `;
              console.log(`   📈 Similarity to query: ${similarityCheck[0]?.similarity?.toFixed(3) || 'N/A'}`);
            }
          }
        }
      } else {
        console.log(`❌ "Rest Periods" guide not found`);
      }
      
      // Search for strength vs hypertrophy guide
      const strengthGuide = await prisma.knowledgeItem.findFirst({
        where: {
          title: {
            contains: 'Strength and Hypertrophy',
            mode: 'insensitive'
          },
          status: 'READY'
        }
      });
      
      if (strengthGuide) {
        console.log(`✅ Found "Strength and Hypertrophy" guide: "${strengthGuide.title}"`);
        const appeared = results.some(r => r.knowledgeId === strengthGuide.id);
        console.log(`   Appeared in results: ${appeared ? '✅' : '❌'}`);
      }
      
    } catch (error) {
      console.error(`❌ Error during retrieval test:`, error.message);
    }
    
    console.log('\n🎯 Analysis:');
    console.log('The RAG system should be retrieving documents about:');
    console.log('  • Rest periods (2-5 minutes for hypertrophy)');
    console.log('  • Rep ranges (moderate for hypertrophy)');
    console.log('  • Set numbers and volume guidelines');
    console.log('  • Specific lower body exercise recommendations');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testLegWorkoutRAGRetrieval();
