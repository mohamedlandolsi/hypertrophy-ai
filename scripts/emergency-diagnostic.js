#!/usr/bin/env node

/**
 * Emergency Diagnostic - Check why AI is giving terrible responses
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function emergencyDiagnostic() {
  console.log('🚨 EMERGENCY DIAGNOSTIC: Checking AI Response Quality...\n');

  try {
    // 1. Check AI Configuration
    console.log('=== 1. AI Configuration Check ===');
    const aiConfig = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });
    
    if (!aiConfig) {
      console.error('❌ CRITICAL: No AI Configuration found!');
      console.log('Solution: Visit /admin/settings to configure AI system');
      return;
    }
    
    console.log('✅ AI Configuration exists');
    console.log(`Model: ${aiConfig.modelName}`);
    console.log(`RAG Enforcement: ${aiConfig.ragEnforcement}`);
    console.log(`Enhanced RAG: ${aiConfig.enhancedRAG}`);
    console.log(`RAG Max Chunks: ${aiConfig.ragMaxChunks}`);
    console.log(`RAG Threshold: ${aiConfig.ragThreshold}`);
    
    // 2. Check Knowledge Base Content
    console.log('\n=== 2. Knowledge Base Content Check ===');
    
    // Check for leg exercises
    const legChunks = await prisma.knowledgeChunk.findMany({
      where: {
        OR: [
          { content: { contains: 'leg press', mode: 'insensitive' } },
          { content: { contains: 'squat', mode: 'insensitive' } },
          { content: { contains: 'leg extension', mode: 'insensitive' } },
          { content: { contains: 'leg curl', mode: 'insensitive' } },
          { content: { contains: 'quadriceps', mode: 'insensitive' } },
          { content: { contains: 'hamstring', mode: 'insensitive' } }
        ]
      },
      take: 5,
      include: {
        knowledgeItem: {
          select: { title: true }
        }
      }
    });
    
    console.log(`✅ Found ${legChunks.length} leg exercise chunks:`);
    legChunks.forEach((chunk, i) => {
      console.log(`  ${i+1}. ${chunk.knowledgeItem.title}`);
      console.log(`     Content: ${chunk.content.substring(0, 100)}...`);
    });
    
    // Check for upper body exercises
    const upperChunks = await prisma.knowledgeChunk.findMany({
      where: {
        OR: [
          { content: { contains: 'bench press', mode: 'insensitive' } },
          { content: { contains: 'chest press', mode: 'insensitive' } },
          { content: { contains: 'row', mode: 'insensitive' } },
          { content: { contains: 'pulldown', mode: 'insensitive' } },
          { content: { contains: 'lat', mode: 'insensitive' } }
        ]
      },
      take: 5,
      include: {
        knowledgeItem: {
          select: { title: true }
        }
      }
    });
    
    console.log(`\n✅ Found ${upperChunks.length} upper body exercise chunks:`);
    upperChunks.forEach((chunk, i) => {
      console.log(`  ${i+1}. ${chunk.knowledgeItem.title}`);
      console.log(`     Content: ${chunk.content.substring(0, 100)}...`);
    });
    
    // 3. Check system prompt
    console.log('\n=== 3. System Prompt Check ===');
    if (aiConfig.systemPrompt) {
      const promptLength = aiConfig.systemPrompt.length;
      console.log(`✅ System prompt exists (${promptLength} characters)`);
      
      const hasKBEnforcement = aiConfig.systemPrompt.toLowerCase().includes('knowledge base');
      const hasExerciseCompliance = aiConfig.systemPrompt.toLowerCase().includes('exercise');
      const hasStrictGuidelines = aiConfig.systemPrompt.toLowerCase().includes('strict') || 
                                 aiConfig.systemPrompt.toLowerCase().includes('must');
      
      console.log(`Knowledge Base enforcement: ${hasKBEnforcement ? '✅' : '❌'}`);
      console.log(`Exercise compliance: ${hasExerciseCompliance ? '✅' : '❌'}`);
      console.log(`Strict guidelines: ${hasStrictGuidelines ? '✅' : '❌'}`);
      
      // Show first 200 chars of prompt
      console.log(`\nPrompt preview: ${aiConfig.systemPrompt.substring(0, 200)}...`);
    } else {
      console.error('❌ CRITICAL: No system prompt configured!');
    }
    
    // 4. Check for exercise replacement logic issues
    console.log('\n=== 4. Exercise Replacement Logic Check ===');
    
    const exercisePattern = /["']([^"']*exercise[^"']*)["']/gi;
    if (aiConfig.systemPrompt) {
      const exerciseReferences = aiConfig.systemPrompt.match(exercisePattern);
      if (exerciseReferences) {
        console.log('⚠️ Found exercise references in system prompt:');
        exerciseReferences.forEach(ref => console.log(`  - ${ref}`));
      }
    }
    
    // 5. Problem Analysis
    console.log('\n=== 5. PROBLEM ANALYSIS ===');
    
    if (!aiConfig.ragEnforcement) {
      console.error('❌ CRITICAL: RAG enforcement is DISABLED!');
      console.log('   This allows AI to use general knowledge instead of KB');
    }
    
    if (!aiConfig.enhancedRAG) {
      console.error('❌ CRITICAL: Enhanced RAG is DISABLED!');
      console.log('   This means the improved retrieval system is not active');
    }
    
    if (aiConfig.ragThreshold > 0.3) {
      console.error('❌ CRITICAL: RAG threshold too high!');
      console.log(`   Current: ${aiConfig.ragThreshold}, Recommended: < 0.1`);
    }
    
    if (legChunks.length === 0) {
      console.error('❌ CRITICAL: No leg exercise content found in KB!');
      console.log('   This explains why AI is substituting "chest press" for leg exercises');
    }
    
    console.log('\n=== EMERGENCY SOLUTIONS ===');
    console.log('1. Enable RAG enforcement via /admin/settings');
    console.log('2. Enable Enhanced RAG via /admin/settings');  
    console.log('3. Lower RAG threshold to 0.05');
    console.log('4. Check if leg exercise content was properly uploaded');
    console.log('5. Verify system prompt has strict KB compliance directives');
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

emergencyDiagnostic().catch(console.error);
