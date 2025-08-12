const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testArmsQueryRAG() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing Arms Query RAG Retrieval...\n');
    
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
    
    // Test the exact arms query
    const testQuery = "How can I optimally train my arms (biceps & triceps & forearms)?";
    console.log(`🎯 Testing Query: "${testQuery}"\n`);
    
    // Check what arms-related content exists in KB
    console.log('🔍 First, let\'s see what arms content exists in KB...');
    
    const armsContent = await prisma.knowledgeChunk.findMany({
      where: {
        OR: [
          { content: { contains: 'bicep', mode: 'insensitive' } },
          { content: { contains: 'tricep', mode: 'insensitive' } },
          { content: { contains: 'arms', mode: 'insensitive' } },
          { content: { contains: 'forearm', mode: 'insensitive' } }
        ],
        knowledgeItem: { status: 'READY' }
      },
      include: { knowledgeItem: true },
      take: 5
    });
    
    console.log(`📚 Found ${armsContent.length} arms-related chunks in KB:`);
    armsContent.forEach((chunk, i) => {
      console.log(`  ${i+1}. "${chunk.knowledgeItem.title}"`);
      console.log(`     Preview: ${chunk.content.substring(0, 100)}...`);
    });
    
    // Now test what the RAG system actually retrieves
    console.log('\n🎯 Testing Current RAG Retrieval...');
    
    try {
      // Generate embedding for the arms query
      const embeddingResult = await genAI.getGenerativeModel({ model: "text-embedding-004" })
        .embedContent(testQuery);
      const queryEmbedding = embeddingResult.embedding.values;
      
      // Test current retrieval approach
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
      
      console.log(`📊 RAG Retrieved ${results.length}/${config.ragMaxChunks} chunks:\n`);
      
      results.forEach((chunk, i) => {
        const content = chunk.content.toLowerCase();
        const hasArmsInfo = content.includes('bicep') || content.includes('tricep') || content.includes('arms') || content.includes('forearm');
        console.log(`${i + 1}. "${chunk.title}" (similarity: ${chunk.similarity.toFixed(3)})`);
        console.log(`   Contains arms info: ${hasArmsInfo ? '✅' : '❌'}`);
        console.log(`   Content preview: ${chunk.content.substring(0, 120)}...`);
        console.log('');
      });
      
      // Analysis
      const armsSpecificChunks = results.filter(chunk => {
        const content = chunk.content.toLowerCase();
        return content.includes('bicep') || content.includes('tricep') || content.includes('arms') || content.includes('forearm');
      });
      
      console.log(`🎯 Analysis:`);
      console.log(`  • Total retrieved chunks: ${results.length}`);
      console.log(`  • Arms-specific chunks: ${armsSpecificChunks.length}`);
      console.log(`  • Arms content available in KB: ${armsContent.length} chunks`);
      
      if (armsSpecificChunks.length === 0) {
        console.log(`\n❌ PROBLEM: No arms-specific information retrieved!`);
        console.log(`   This explains why AI gives generic advice instead of specific arms guidance.`);
        
        // Test if arms content would be retrieved with more relaxed threshold
        console.log(`\n🔧 Testing with relaxed threshold...`);
        const relaxedResults = chunks.filter(chunk => chunk.similarity >= 0.2);
        const relaxedArmsChunks = relaxedResults.filter(chunk => {
          const content = chunk.content.toLowerCase();
          return content.includes('bicep') || content.includes('tricep') || content.includes('arms') || content.includes('forearm');
        });
        
        console.log(`   With 0.2 threshold: ${relaxedArmsChunks.length} arms chunks found`);
        if (relaxedArmsChunks.length > 0) {
          console.log(`   Best arms match: "${relaxedArmsChunks[0].title}" (${relaxedArmsChunks[0].similarity.toFixed(3)})`);
        }
      } else {
        console.log(`\n✅ Arms-specific information is being retrieved correctly.`);
      }
      
    } catch (error) {
      console.error(`❌ Error during RAG test:`, error.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testArmsQueryRAG();
