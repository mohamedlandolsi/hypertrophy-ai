#!/usr/bin/env node

/**
 * Emergency Investigation - Why is AI claiming no exercises exist?
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function investigateNoExercises() {
  console.log('🚨 INVESTIGATING: Why AI claims no exercises exist...\n');

  try {
    // 1. Check current AI configuration
    console.log('=== 1. Current AI Configuration ===');
    const aiConfig = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });
    
    if (!aiConfig) {
      console.error('❌ CRITICAL: No AI Configuration found!');
      return;
    }
    
    console.log(`✅ AI Config exists`);
    console.log(`RAG Similarity Threshold: ${aiConfig.ragSimilarityThreshold}`);
    console.log(`RAG High Relevance Threshold: ${aiConfig.ragHighRelevanceThreshold}`);
    console.log(`RAG Max Chunks: ${aiConfig.ragMaxChunks}`);
    console.log(`Use Knowledge Base: ${aiConfig.useKnowledgeBase}`);
    console.log(`Max Tokens: ${aiConfig.maxTokens}`);
    
    // 2. Search for upper body exercises
    console.log('\n=== 2. Upper Body Exercise Content ===');
    const upperBodyTerms = ['bench press', 'chest press', 'row', 'pulldown', 'lat', 'shoulder press', 'tricep', 'bicep'];
    
    for (const term of upperBodyTerms.slice(0, 4)) { // Test first 4 terms
      const chunks = await prisma.knowledgeChunk.findMany({
        where: {
          content: { contains: term, mode: 'insensitive' }
        },
        include: {
          knowledgeItem: { select: { title: true } }
        },
        take: 2
      });
      
      if (chunks.length > 0) {
        console.log(`✅ "${term}": ${chunks.length} chunks found`);
        chunks.forEach(chunk => {
          const excerpt = chunk.content.substring(0, 80).replace(/\n/g, ' ');
          console.log(`   - ${chunk.knowledgeItem.title}: "${excerpt}..."`);
        });
      } else {
        console.log(`❌ "${term}": No chunks found`);
      }
    }
    
    // 3. Search for lower body exercises  
    console.log('\n=== 3. Lower Body Exercise Content ===');
    const lowerBodyTerms = ['leg press', 'squat', 'leg extension', 'leg curl'];
    
    for (const term of lowerBodyTerms) {
      const chunks = await prisma.knowledgeChunk.findMany({
        where: {
          content: { contains: term, mode: 'insensitive' }
        },
        include: {
          knowledgeItem: { select: { title: true } }
        },
        take: 2
      });
      
      if (chunks.length > 0) {
        console.log(`✅ "${term}": ${chunks.length} chunks found`);
        chunks.forEach(chunk => {
          const excerpt = chunk.content.substring(0, 80).replace(/\n/g, ' ');
          console.log(`   - ${chunk.knowledgeItem.title}: "${excerpt}..."`);
        });
      } else {
        console.log(`❌ "${term}": No chunks found`);
      }
    }
    
    // 4. Check for workout programming guides
    console.log('\n=== 4. Workout Programming Guides ===');
    const workoutGuides = await prisma.knowledgeItem.findMany({
      where: {
        OR: [
          { title: { contains: 'upper body', mode: 'insensitive' } },
          { title: { contains: 'lower body', mode: 'insensitive' } },
          { title: { contains: 'workout', mode: 'insensitive' } },
          { title: { contains: 'training', mode: 'insensitive' } }
        ]
      },
      take: 10
    });
    
    console.log(`✅ Found ${workoutGuides.length} workout-related guides:`);
    workoutGuides.forEach((guide, i) => {
      console.log(`   ${i+1}. ${guide.title}`);
    });
    
    // 5. Test vector search simulation
    console.log('\n=== 5. Vector Search Simulation ===');
    
    // Simulate searching for upper body exercises
    const upperBodyQuery = "upper body workout exercises chest back shoulders";
    const upperBodyChunks = await prisma.knowledgeChunk.findMany({
      where: {
        OR: [
          { content: { contains: 'chest', mode: 'insensitive' } },
          { content: { contains: 'back', mode: 'insensitive' } },
          { content: { contains: 'shoulder', mode: 'insensitive' } },
          { content: { contains: 'upper body', mode: 'insensitive' } }
        ]
      },
      include: {
        knowledgeItem: { select: { title: true } }
      },
      take: 5
    });
    
    console.log(`Upper body search: Found ${upperBodyChunks.length} relevant chunks`);
    
    // 6. Check system prompt for problematic language
    console.log('\n=== 6. System Prompt Analysis ===');
    if (aiConfig.systemPrompt) {
      const promptLower = aiConfig.systemPrompt.toLowerCase();
      
      const problematicPhrases = [
        "don't have",
        "no exercises",
        "limitations of my knowledge base",
        "unfortunately",
        "lack exercises"
      ];
      
      let foundProblematic = false;
      problematicPhrases.forEach(phrase => {
        if (promptLower.includes(phrase)) {
          console.log(`⚠️  Found problematic phrase: "${phrase}"`);
          foundProblematic = true;
        }
      });
      
      if (!foundProblematic) {
        console.log('✅ No obviously problematic phrases in system prompt');
      }
      
      // Check for positive exercise guidance
      const positiveIndicators = [
        'knowledge base',
        'exercises',
        'workout',
        'training'
      ];
      
      positiveIndicators.forEach(indicator => {
        if (promptLower.includes(indicator)) {
          console.log(`✅ Contains: "${indicator}"`);
        }
      });
    }
    
    console.log('\n=== ANALYSIS & SOLUTIONS ===');
    
    if (upperBodyChunks.length === 0) {
      console.error('❌ CRITICAL: No upper body content found - KB may be corrupted');
    } else {
      console.log('✅ Upper body content exists in KB');
    }
    
    if (aiConfig.ragSimilarityThreshold > 0.1) {
      console.error(`❌ CRITICAL: RAG threshold too high (${aiConfig.ragSimilarityThreshold})`);
      console.log('   Solution: Lower to 0.05 or below');
    }
    
    if (!aiConfig.useKnowledgeBase) {
      console.error('❌ CRITICAL: Knowledge base usage disabled');
      console.log('   Solution: Enable knowledge base in config');
    }
    
    console.log('\n🎯 IMMEDIATE FIXES NEEDED:');
    console.log('1. Verify RAG retrieval is actually working');
    console.log('2. Test actual vector search with embeddings');
    console.log('3. Check if Enhanced RAG v2 is being used');
    console.log('4. Update system prompt to be more assertive about KB content');
    
  } catch (error) {
    console.error('❌ Investigation failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

investigateNoExercises().catch(console.error);
