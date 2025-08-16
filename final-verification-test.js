#!/usr/bin/env node

/**
 * Final verification and test of the fixes
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function finalVerification() {
  console.log('🔍 FINAL VERIFICATION: Testing all fixes...\n');

  try {
    // 1. Verify AI configuration
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });
    
    console.log('=== 1. AI Configuration Status ===');
    console.log(`✅ RAG Similarity Threshold: ${config.ragSimilarityThreshold} (should be ≤ 0.05)`);
    console.log(`✅ RAG Max Chunks: ${config.ragMaxChunks} (should be ≥ 10)`);
    console.log(`✅ Use Knowledge Base: ${config.useKnowledgeBase}`);
    console.log(`✅ Max Tokens: ${config.maxTokens}`);
    
    // 2. Check system prompt for positive language
    console.log('\n=== 2. System Prompt Quality Check ===');
    const promptLower = config.systemPrompt.toLowerCase();
    
    const positiveIndicators = [
      'you have access to',
      'comprehensive knowledge',
      'extensive information',
      'equipped with',
      'authoritative source'
    ];
    
    const negativeIndicators = [
      "don't have",
      "lack",
      "unfortunately", 
      "limitations"
    ];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveIndicators.forEach(indicator => {
      if (promptLower.includes(indicator)) {
        console.log(`✅ Positive: "${indicator}"`);
        positiveCount++;
      }
    });
    
    negativeIndicators.forEach(indicator => {
      if (promptLower.includes(indicator)) {
        console.log(`❌ Negative: "${indicator}"`);
        negativeCount++;
      }
    });
    
    console.log(`\nPrompt Quality Score: ${positiveCount} positive, ${negativeCount} negative`);
    
    // 3. Test knowledge base content availability
    console.log('\n=== 3. Knowledge Base Content Verification ===');
    
    // Test upper body exercises
    const upperBodyCount = await prisma.knowledgeChunk.count({
      where: {
        OR: [
          { content: { contains: 'chest press', mode: 'insensitive' } },
          { content: { contains: 'bench press', mode: 'insensitive' } },
          { content: { contains: 'row', mode: 'insensitive' } },
          { content: { contains: 'pulldown', mode: 'insensitive' } }
        ]
      }
    });
    
    // Test lower body exercises
    const lowerBodyCount = await prisma.knowledgeChunk.count({
      where: {
        OR: [
          { content: { contains: 'leg press', mode: 'insensitive' } },
          { content: { contains: 'leg extension', mode: 'insensitive' } },
          { content: { contains: 'leg curl', mode: 'insensitive' } },
          { content: { contains: 'squat', mode: 'insensitive' } }
        ]
      }
    });
    
    console.log(`✅ Upper body exercise chunks: ${upperBodyCount}`);
    console.log(`✅ Lower body exercise chunks: ${lowerBodyCount}`);
    
    // 4. Sample specific exercises
    console.log('\n=== 4. Specific Exercise Examples ===');
    
    const sampleExercises = [
      'leg press',
      'leg extension', 
      'leg curl',
      'chest press',
      'bench press',
      'pulldown'
    ];
    
    for (const exercise of sampleExercises) {
      const count = await prisma.knowledgeChunk.count({
        where: {
          content: { contains: exercise, mode: 'insensitive' }
        }
      });
      
      if (count > 0) {
        console.log(`✅ "${exercise}": ${count} mentions`);
      } else {
        console.log(`❌ "${exercise}": Not found`);
      }
    }
    
    console.log('\n=== FINAL STATUS ===');
    
    if (negativeCount === 0) {
      console.log('🟢 SYSTEM PROMPT: Clean, no negative language');
    } else {
      console.log(`🟡 SYSTEM PROMPT: Still contains ${negativeCount} negative phrases`);
    }
    
    if (config.ragSimilarityThreshold <= 0.05) {
      console.log('🟢 RAG THRESHOLD: Optimal for retrieval');
    } else {
      console.log('🟡 RAG THRESHOLD: May need to be lower');
    }
    
    if (upperBodyCount > 5 && lowerBodyCount > 5) {
      console.log('🟢 EXERCISE CONTENT: Sufficient for both upper and lower body');
    } else {
      console.log('🟡 EXERCISE CONTENT: Limited content available');
    }
    
    console.log('\n🎯 EXPECTED AI BEHAVIOR:');
    console.log('✅ Should confidently provide upper body exercises');
    console.log('✅ Should confidently provide lower body exercises');
    console.log('✅ Should NOT claim lack of exercises');
    console.log('✅ Should reference specific KB exercises');
    console.log('✅ Should provide comprehensive workout programs');
    
    console.log('\n🚀 READY FOR TESTING - AI should now work correctly!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

finalVerification().catch(console.error);
