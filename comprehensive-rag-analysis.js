// comprehensive-rag-analysis.js
// Comprehensive analysis of the RAG system, AI configuration, and knowledge base

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function comprehensiveRAGAnalysis() {
  console.log('🔍 COMPREHENSIVE RAG SYSTEM ANALYSIS');
  console.log('=====================================\n');

  try {
    // 1. AI Configuration Analysis
    console.log('📋 1. AI CONFIGURATION ANALYSIS');
    console.log('--------------------------------');
    
    const aiConfig = await prisma.aIConfiguration.findFirst();
    if (aiConfig) {
      console.log('✅ AI Configuration Found:');
      console.log(`   📊 RAG Settings:`);
      console.log(`      - Max Chunks: ${aiConfig.ragMaxChunks}`);
      console.log(`      - Similarity Threshold: ${aiConfig.ragSimilarityThreshold}`);
      console.log(`      - High Relevance Threshold: ${aiConfig.ragHighRelevanceThreshold || 'Not set'}`);
      console.log(`      - Strict Muscle Priority: ${aiConfig.strictMusclePriority}`);
      console.log(`   🤖 Model Settings:`);
      console.log(`      - Free Model: ${aiConfig.freeModelName}`);
      console.log(`      - Pro Model: ${aiConfig.proModelName}`);
      console.log(`      - Temperature: ${aiConfig.temperature}`);
      console.log(`      - Max Tokens: ${aiConfig.maxTokens}`);
      console.log(`      - Top K: ${aiConfig.topK}`);
      console.log(`      - Top P: ${aiConfig.topP}`);
      console.log(`   🧠 Memory & KB Settings:`);
      console.log(`      - Use Knowledge Base: ${aiConfig.useKnowledgeBase}`);
      console.log(`      - Use Client Memory: ${aiConfig.useClientMemory}`);
      
      // Analyze system prompt length and content
      const promptLength = aiConfig.systemPrompt.length;
      console.log(`   📝 System Prompt:`);
      console.log(`      - Length: ${promptLength} characters`);
      console.log(`      - Contains "knowledge base": ${aiConfig.systemPrompt.toLowerCase().includes('knowledge base')}`);
      console.log(`      - Contains "scientific": ${aiConfig.systemPrompt.toLowerCase().includes('scientific')}`);
      console.log(`      - Contains "evidence": ${aiConfig.systemPrompt.toLowerCase().includes('evidence')}`);
      console.log(`      - Contains "muscle": ${aiConfig.systemPrompt.toLowerCase().includes('muscle')}`);
      
      // Check for potential issues
      console.log(`\n   🚨 POTENTIAL ISSUES:`);
      if (aiConfig.ragSimilarityThreshold > 0.7) {
        console.log(`      ⚠️  Similarity threshold (${aiConfig.ragSimilarityThreshold}) is very high - may miss relevant content`);
      }
      if (aiConfig.ragMaxChunks < 10) {
        console.log(`      ⚠️  Max chunks (${aiConfig.ragMaxChunks}) might be too low for comprehensive answers`);
      }
      if (!aiConfig.useKnowledgeBase) {
        console.log(`      ❌ Knowledge base is disabled!`);
      }
    } else {
      console.log('❌ AI Configuration not found!');
    }

    // 2. Knowledge Base Analysis
    console.log('\n\n📚 2. KNOWLEDGE BASE ANALYSIS');
    console.log('-----------------------------');
    
    const knowledgeStats = await prisma.knowledgeItem.groupBy({
      by: ['status'],
      _count: { id: true }
    });
    
    console.log('📊 Knowledge Items by Status:');
    knowledgeStats.forEach(stat => {
      console.log(`   ${stat.status}: ${stat._count.id} items`);
    });
    
    const totalChunks = await prisma.knowledgeChunk.count();
    const chunksWithEmbeddings = await prisma.knowledgeChunk.count({
      where: { embeddingData: { not: null } }
    });
    
    console.log(`\n📊 Knowledge Chunks:`);
    console.log(`   Total chunks: ${totalChunks}`);
    console.log(`   Chunks with embeddings: ${chunksWithEmbeddings}`);
    console.log(`   Missing embeddings: ${totalChunks - chunksWithEmbeddings}`);
    
    // Analyze content categories
    const categoryStats = await prisma.knowledgeItem.groupBy({
      by: ['category'],
      where: { status: 'READY' },
      _count: { id: true }
    });
    
    console.log(`\n📊 Content Categories (READY status):`);
    categoryStats.forEach(stat => {
      console.log(`   ${stat.category || 'Uncategorized'}: ${stat._count.id} items`);
    });
    
    // Sample knowledge content analysis
    const sampleItems = await prisma.knowledgeItem.findMany({
      where: { status: 'READY' },
      select: {
        id: true,
        title: true,
        category: true,
        content: true,
        chunks: {
          select: {
            content: true,
            embeddingData: true
          },
          take: 1
        }
      },
      take: 5
    });
    
    console.log(`\n📋 Sample Knowledge Items:`);
    sampleItems.forEach((item, index) => {
      console.log(`   ${index + 1}. "${item.title}"`);
      console.log(`      Category: ${item.category || 'None'}`);
      console.log(`      Has embedding: ${item.chunks[0]?.embeddingData ? 'Yes' : 'No'}`);
      if (item.chunks[0]?.content) {
        const preview = item.chunks[0].content.substring(0, 100).replace(/\n/g, ' ');
        console.log(`      Content preview: "${preview}..."`);
      }
    });

    // 3. Vector Search Performance Analysis
    console.log('\n\n🔍 3. VECTOR SEARCH ANALYSIS');
    console.log('----------------------------');
    
    // Test vector search with fitness queries
    const testQueries = [
      'muscle hypertrophy',
      'workout programming',
      'protein intake',
      'deadlift technique',
      'rest between sets'
    ];
    
    for (const query of testQueries) {
      try {
        // Simulate embedding (simple test)
        const testEmbedding = Array(768).fill(0).map(() => Math.random() * 0.1);
        const embeddingStr = `[${testEmbedding.join(',')}]`;
        
        const results = await prisma.$queryRaw`
          SELECT 
            COUNT(*) as total_results,
            AVG(1 - (kc."embeddingData"::vector <=> ${embeddingStr}::vector)) as avg_similarity,
            MAX(1 - (kc."embeddingData"::vector <=> ${embeddingStr}::vector)) as max_similarity
          FROM "KnowledgeChunk" kc
          JOIN "KnowledgeItem" ki ON kc."knowledgeItemId" = ki.id
          WHERE ki.status = 'READY' 
            AND kc."embeddingData" IS NOT NULL
        `;
        
        const result = results[0];
        console.log(`   "${query}":`);
        console.log(`      Searchable chunks: ${result.total_results}`);
        console.log(`      Avg similarity: ${parseFloat(result.avg_similarity).toFixed(4)}`);
        console.log(`      Max similarity: ${parseFloat(result.max_similarity).toFixed(4)}`);
        
      } catch (error) {
        console.log(`   "${query}": Error - ${error.message}`);
      }
    }

    // 4. Client Memory and Profile Analysis
    console.log('\n\n👤 4. CLIENT MEMORY & PROFILE ANALYSIS');
    console.log('--------------------------------------');
    
    const totalUsers = await prisma.user.count();
    const usersWithMemory = await prisma.clientMemory.count();
    
    console.log(`📊 User Statistics:`);
    console.log(`   Total users: ${totalUsers}`);
    console.log(`   Users with memory: ${usersWithMemory}`);
    console.log(`   Memory coverage: ${((usersWithMemory / totalUsers) * 100).toFixed(1)}%`);
    
    // Sample memory content
    const sampleMemory = await prisma.clientMemory.findFirst({
      where: {
        OR: [
          { currentGoals: { not: null } },
          { trainingExperience: { not: null } },
          { injuries: { not: null } }
        ]
      }
    });
    
    if (sampleMemory) {
      console.log(`\n📋 Sample Client Memory:`);
      console.log(`   Goals: ${sampleMemory.currentGoals || 'None'}`);
      console.log(`   Experience: ${sampleMemory.trainingExperience || 'None'}`);
      console.log(`   Injuries: ${sampleMemory.injuries || 'None'}`);
      console.log(`   Preferences: ${sampleMemory.exercisePreferences || 'None'}`);
    }

    // 5. System Integration Analysis
    console.log('\n\n⚙️ 5. SYSTEM INTEGRATION ANALYSIS');
    console.log('---------------------------------');
    
    console.log('🔄 Data Flow Check:');
    console.log('   User Query → Vector Search → Knowledge Retrieval → Context Formation → AI Response');
    
    // Check if all components are properly connected
    console.log('\n📋 Component Status:');
    console.log(`   ✅ Database: Connected`);
    console.log(`   ✅ Vector Search: ${chunksWithEmbeddings > 0 ? 'Operational' : 'No embeddings'}`);
    console.log(`   ✅ AI Config: ${aiConfig ? 'Found' : 'Missing'}`);
    console.log(`   ✅ Knowledge Base: ${knowledgeStats.find(s => s.status === 'READY')?._count.id || 0} ready items`);
    
    // 6. Recommendations
    console.log('\n\n🎯 6. RECOMMENDATIONS & ISSUES');
    console.log('------------------------------');
    
    console.log('🚨 CRITICAL ISSUES:');
    if (!aiConfig?.useKnowledgeBase) {
      console.log('   ❌ Knowledge base usage is disabled');
    }
    if (aiConfig?.ragSimilarityThreshold > 0.8) {
      console.log('   ⚠️  Similarity threshold too high - consider lowering to 0.3-0.5');
    }
    if (totalChunks - chunksWithEmbeddings > 100) {
      console.log('   ⚠️  Many chunks missing embeddings - run re-embedding');
    }
    
    console.log('\n💡 OPTIMIZATION SUGGESTIONS:');
    console.log('   1. Lower similarity threshold for broader knowledge retrieval');
    console.log('   2. Increase max chunks for more comprehensive context');
    console.log('   3. Ensure all knowledge items have proper categories');
    console.log('   4. Regular embedding updates for new content');
    console.log('   5. Monitor client memory utilization');

  } catch (error) {
    console.error('❌ Analysis failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

comprehensiveRAGAnalysis();
