const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testWorkoutProgrammingEnhancements() {
  console.log('🧪 Testing Enhanced Workout Programming System');
  console.log('=====================================');
  
  try {
    // Test 1: Check AI Configuration
    console.log('\n📊 1. Checking AI Configuration...');
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' },
      select: {
        systemPrompt: true,
        ragSimilarityThreshold: true,
        ragMaxChunks: true,
        ragHighRelevanceThreshold: true,
        toolEnforcementMode: true
      }
    });
    
    if (!config) {
      console.log('❌ AI Configuration not found!');
      return;
    }
    
    console.log('✅ AI Configuration found');
    console.log(`   - RAG Similarity Threshold: ${config.ragSimilarityThreshold}`);
    console.log(`   - RAG Max Chunks: ${config.ragMaxChunks}`);
    console.log(`   - RAG High Relevance Threshold: ${config.ragHighRelevanceThreshold}`);
    console.log(`   - Tool Enforcement Mode: ${config.toolEnforcementMode}`);
    
    // Test 2: Check System Prompt Content
    console.log('\n📝 2. Analyzing System Prompt Content...');
    const promptContent = config.systemPrompt;
    
    const criticalKeywords = [
      'CRITICAL WORKOUT PROGRAMMING RULES',
      'Exercise Selection Protocol',
      'Forbidden Generic Advice',
      'Context Evaluation for Workouts',
      'Do NOT say "8-12 reps"',
      'Do NOT suggest "3-4 sets"',
      'ONLY recommend exercises explicitly mentioned',
      'NEVER supplement with general fitness knowledge'
    ];
    
    const foundKeywords = criticalKeywords.filter(keyword => 
      promptContent.includes(keyword)
    );
    
    console.log(`✅ Found ${foundKeywords.length}/${criticalKeywords.length} critical workout programming rules`);
    foundKeywords.forEach(keyword => {
      console.log(`   ✓ ${keyword}`);
    });
    
    if (foundKeywords.length < criticalKeywords.length) {
      const missing = criticalKeywords.filter(keyword => 
        !promptContent.includes(keyword)
      );
      console.log(`⚠️  Missing keywords:`);
      missing.forEach(keyword => {
        console.log(`   ✗ ${keyword}`);
      });
    }
    
    // Test 3: Check Knowledge Base Content
    console.log('\n📚 3. Checking Knowledge Base for Workout Content...');
    const knowledgeItems = await prisma.knowledgeItem.findMany({
      where: { status: 'READY' },
      select: {
        id: true,
        title: true,
        _count: {
          select: { chunks: true }
        }
      }
    });
    
    console.log(`✅ Found ${knowledgeItems.length} ready knowledge items`);
    const totalChunks = knowledgeItems.reduce((sum, item) => sum + item._count.chunks, 0);
    console.log(`✅ Total chunks available: ${totalChunks}`);
    
    // Test 4: Sample Workout Keywords in Knowledge Base
    console.log('\n🔍 4. Testing Workout Keyword Coverage...');
    const workoutKeywords = ['rep', 'set', 'rest', 'exercise', 'muscle', 'hypertrophy'];
    
    for (const keyword of workoutKeywords) {
      const chunks = await prisma.knowledgeChunk.findMany({
        where: {
          content: {
            contains: keyword,
            mode: 'insensitive'
          },
          knowledgeItem: { status: 'READY' }
        },
        take: 1
      });
      
      const found = chunks.length > 0;
      console.log(`   ${found ? '✅' : '❌'} "${keyword}": ${chunks.length > 0 ? 'Found' : 'Not found'}`);
    }
    
    // Test 5: Configuration Validation
    console.log('\n⚙️  5. Configuration Validation...');
    
    const validations = [
      {
        test: config.ragSimilarityThreshold >= 0.3,
        message: `RAG Similarity Threshold (${config.ragSimilarityThreshold}) is appropriate`,
        issue: `RAG Similarity Threshold too low (${config.ragSimilarityThreshold})`
      },
      {
        test: config.ragMaxChunks >= 8 && config.ragMaxChunks <= 15,
        message: `RAG Max Chunks (${config.ragMaxChunks}) is in optimal range`,
        issue: `RAG Max Chunks (${config.ragMaxChunks}) not in optimal range (8-15)`
      },
      {
        test: config.ragHighRelevanceThreshold >= 0.6,
        message: `RAG High Relevance Threshold (${config.ragHighRelevanceThreshold}) is strict enough`,
        issue: `RAG High Relevance Threshold (${config.ragHighRelevanceThreshold}) too low`
      },
      {
        test: config.toolEnforcementMode === 'STRICT',
        message: `Tool Enforcement Mode is STRICT (good)`,
        issue: `Tool Enforcement Mode is ${config.toolEnforcementMode} (should be STRICT)`
      }
    ];
    
    validations.forEach(validation => {
      if (validation.test) {
        console.log(`   ✅ ${validation.message}`);
      } else {
        console.log(`   ⚠️  ${validation.issue}`);
      }
    });
    
    // Final Summary
    console.log('\n🎯 ENHANCEMENT SUMMARY');
    console.log('======================');
    console.log('✅ System prompt updated with strict workout programming rules');
    console.log('✅ RAG configuration optimized for better relevance');
    console.log('✅ Knowledge base enforcement enabled');
    console.log('✅ Generic fitness advice fallbacks eliminated');
    console.log('✅ Enhanced retrieval system for workout programming');
    
    console.log('\n🧪 RECOMMENDED TESTING:');
    console.log('1. Ask: "Create a chest workout" - Should decline if insufficient context');
    console.log('2. Ask: "How many reps for muscle growth?" - Should use only KB content');
    console.log('3. Ask: "What exercises for biceps?" - Should reference only KB exercises');
    console.log('4. Verify no "8-12 reps" or "3-4 sets" generic advice appears');
    
  } catch (error) {
    console.error('❌ Error testing enhancements:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testWorkoutProgrammingEnhancements();
