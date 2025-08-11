const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixUpperLowerSynthesis() {
  console.log('🔧 Fixing Upper/Lower Program Synthesis Issue');
  console.log('============================================\n');

  try {
    // Get current AI configuration
    const currentConfig = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });

    if (!currentConfig) {
      throw new Error('AI Configuration not found');
    }

    console.log('📊 Current Configuration:');
    console.log(`   - Tool Enforcement Mode: ${currentConfig.toolEnforcementMode}`);
    console.log(`   - RAG Similarity Threshold: ${currentConfig.ragSimilarityThreshold}`);
    console.log(`   - RAG Max Chunks: ${currentConfig.ragMaxChunks}`);
    console.log(`   - High Relevance Threshold: ${currentConfig.ragHighRelevanceThreshold}\n`);

    // The problem: STRICT mode prevents synthesis of available content
    if (currentConfig.toolEnforcementMode === 'STRICT') {
      console.log('🚨 PROBLEM IDENTIFIED:');
      console.log('   STRICT mode prevents AI from combining multiple knowledge chunks');
      console.log('   into comprehensive programs. AI can only use explicit examples.\n');
      
      console.log('🛠️ SOLUTION: Change to AUTO mode for intelligent synthesis\n');
      
      // Update to AUTO mode
      await prisma.aIConfiguration.update({
        where: { id: 'singleton' },
        data: {
          toolEnforcementMode: 'AUTO'
        }
      });
      
      console.log('✅ Updated Tool Enforcement Mode: STRICT → AUTO\n');
    } else {
      console.log('✅ Tool Enforcement Mode is already set to AUTO\n');
    }

    // Also ensure optimal RAG settings for synthesis
    const optimalSettings = {
      ragSimilarityThreshold: 0.25,    // Even lower for better recall
      ragMaxChunks: 20,                // More chunks for comprehensive synthesis
      ragHighRelevanceThreshold: 0.45  // Lower threshold for synthesis
    };

    await prisma.aIConfiguration.update({
      where: { id: 'singleton' },
      data: optimalSettings
    });

    console.log('🎯 Applied Optimal Settings for Upper/Lower Synthesis:');
    console.log(`   - Similarity Threshold: ${currentConfig.ragSimilarityThreshold} → ${optimalSettings.ragSimilarityThreshold}`);
    console.log(`   - Max Chunks: ${currentConfig.ragMaxChunks} → ${optimalSettings.ragMaxChunks}`);
    console.log(`   - High Relevance Threshold: ${currentConfig.ragHighRelevanceThreshold} → ${optimalSettings.ragHighRelevanceThreshold}\n`);

    // Update system prompt to encourage synthesis
    const updatedSystemPrompt = currentConfig.systemPrompt.replace(
      'You MUST first attempt to answer the query exclusively using the SCIENTIFIC REFERENCE MATERIAL provided',
      'You MUST first attempt to answer the query using the SCIENTIFIC REFERENCE MATERIAL provided. When the user asks for complete programs or routines, intelligently synthesize and combine relevant information from multiple sources to create comprehensive, evidence-based guidance'
    );

    if (updatedSystemPrompt !== currentConfig.systemPrompt) {
      await prisma.aIConfiguration.update({
        where: { id: 'singleton' },
        data: {
          systemPrompt: updatedSystemPrompt
        }
      });
      console.log('✅ Updated system prompt to encourage intelligent synthesis\n');
    }

    console.log('📋 What the AI Can Now Do:');
    console.log('   ✅ Combine upper body workout structure + lower body workout structure');
    console.log('   ✅ Use split programming guidelines + volume recommendations');
    console.log('   ✅ Apply training frequency principles + recovery guidelines');
    console.log('   ✅ Synthesize exercise selection + progression methods');
    console.log('   ✅ Create complete upper/lower programs from available building blocks\n');

    console.log('📊 Available Content for Synthesis:');
    console.log('   📖 "A Guide to Common Training Splits" - scheduling patterns');
    console.log('   📖 "A Guide to Effective Split Programming" - volume distribution');
    console.log('   📖 "A Guide to Structuring an Effective Upper Body Workout" - upper day structure');
    console.log('   📖 "A Guide to Structuring an Effective Lower Body Workout" - lower day structure');
    console.log('   📖 "A Guide to Rating Workout Splits" - frequency and benefits\n');

    console.log('🧪 Test Queries That Should Now Work:');
    console.log('   1. "Create a complete upper/lower program for me"');
    console.log('   2. "Give me a detailed upper lower split routine"');
    console.log('   3. "How do I structure an upper/lower program with specific exercises?"');
    console.log('   4. "What should my upper and lower day workouts look like?"\n');

    console.log('💡 Expected AI Behavior:');
    console.log('   - Will combine upper body + lower body guides into complete programs');
    console.log('   - Will apply volume guidelines from split programming guide');
    console.log('   - Will use scheduling patterns from training splits guide');
    console.log('   - Will synthesize exercise selection from workout structure guides');
    console.log('   - Will create evidence-based, comprehensive upper/lower programs\n');

    console.log('✅ Upper/Lower Program Synthesis Fix Complete!');
    console.log('The AI should now successfully create complete upper/lower programs');
    console.log('by intelligently combining the available knowledge base content.');

  } catch (error) {
    console.error('❌ Error fixing upper/lower synthesis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixUpperLowerSynthesis();
