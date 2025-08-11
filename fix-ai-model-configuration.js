const { PrismaClient } = require('@prisma/client');

async function fixAIModelConfiguration() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Fixing AI model configuration...');
    
    // Check current configuration
    const currentConfig = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });
    
    if (!currentConfig) {
      console.log('❌ No AI configuration found. Creating default configuration...');
      
      await prisma.aIConfiguration.create({
        data: {
          id: 'singleton',
          systemPrompt: `You are HypertroQ, an AI-powered fitness coach specialized in bodybuilding, powerlifting, and strength training. Your expertise lies in creating personalized workout programs and providing science-based fitness guidance.

## Core Principles:
- Always prioritize safety and proper form
- Provide evidence-based recommendations
- Personalize advice based on user's experience level and goals
- Reference scientific literature when possible
- Be encouraging and motivational

## Communication Style:
- Professional yet approachable
- Clear and concise explanations
- Use emojis sparingly but effectively
- Encourage questions and clarification

When users ask about exercises, programs, or nutrition, draw from your extensive knowledge base to provide comprehensive, accurate information. Always consider the user's current fitness level, available equipment, and specific goals when making recommendations.`,
          freeModelName: 'gemini-1.5-flash',
          proModelName: 'gemini-1.5-pro',
          temperature: 0.4,
          maxTokens: 8192,
          topK: 30,
          topP: 0.9,
          useKnowledgeBase: true,
          useClientMemory: true,
          enableWebSearch: false,
          ragSimilarityThreshold: 0.05,
          ragMaxChunks: 15,
          ragHighRelevanceThreshold: 0.3
        }
      });
      
      console.log('✅ Created default AI configuration with proper model names');
    } else {
      console.log('📋 Current configuration found:');
      console.log('- Free Model:', currentConfig.freeModelName || 'NOT SET');
      console.log('- Pro Model:', currentConfig.proModelName || 'NOT SET');
      console.log('- System Prompt Length:', currentConfig.systemPrompt?.length || 0, 'characters');
      
      // Fix missing model names
      const updates = {};
      
      if (!currentConfig.freeModelName) {
        updates.freeModelName = 'gemini-1.5-flash';
        console.log('🔧 Setting FREE model to: gemini-1.5-flash');
      }
      
      if (!currentConfig.proModelName) {
        updates.proModelName = 'gemini-1.5-pro';
        console.log('🔧 Setting PRO model to: gemini-1.5-pro');
      }
      
      if (Object.keys(updates).length > 0) {
        await prisma.aIConfiguration.update({
          where: { id: 'singleton' },
          data: updates
        });
        
        console.log('✅ Updated AI configuration with missing model names');
      } else {
        console.log('✅ AI configuration already has model names set');
      }
    }
    
    // Verify the fix
    const updatedConfig = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' },
      select: {
        freeModelName: true,
        proModelName: true,
        systemPrompt: true,
        ragMaxChunks: true
      }
    });
    
    console.log('\n📊 Final Configuration:');
    console.log('- Free Model:', updatedConfig?.freeModelName);
    console.log('- Pro Model:', updatedConfig?.proModelName);
    console.log('- System Prompt:', updatedConfig?.systemPrompt ? 'SET' : 'MISSING');
    console.log('- RAG Max Chunks:', updatedConfig?.ragMaxChunks);
    
    if (updatedConfig?.freeModelName && updatedConfig?.proModelName) {
      console.log('\n🎉 SUCCESS: AI configuration is now properly set up!');
      console.log('The "system delay" error should be resolved.');
    } else {
      console.log('\n❌ FAILED: Model names are still missing');
    }
    
  } catch (error) {
    console.error('❌ Error fixing AI configuration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixAIModelConfiguration();
