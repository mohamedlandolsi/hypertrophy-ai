const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function enhanceSystemPrompt() {
  try {
    console.log('🔧 Enhancing AI System Prompt for Better Knowledge Synthesis...\n');

    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });

    if (!config) {
      console.log('❌ No AI configuration found!');
      return;
    }

    const currentPrompt = config.systemPrompt;
    
    // Check if the prompt already has enhanced RAG instructions
    if (currentPrompt.includes('Stage 2: Prioritized Knowledge Retrieval')) {
      console.log('✅ System prompt already contains enhanced RAG instructions');
      
      // However, let's add a specific instruction about comprehensive synthesis
      const enhancedPrompt = currentPrompt.replace(
        'Stage 3: Synthesis & Justification',
        `Stage 3: Comprehensive Synthesis & Evidence-Based Response

MANDATORY: When providing workout programs, training advice, or exercise recommendations, you MUST:

1. **Synthesize ALL relevant retrieved knowledge** - Don't just find one source; combine information from multiple relevant sources to provide comprehensive guidance.

2. **Provide complete, actionable programs** - If asked for a "complete upper/lower program" or similar, deliver a full workout structure with:
   - Specific exercises for each muscle group
   - Sets, reps, and rest periods
   - Progression guidelines
   - Frequency recommendations

3. **Use evidence-based principles** - Base all recommendations on the scientific principles found in your knowledge base, not generic advice.

4. **Address the complete request** - Don't deflect or claim insufficient information if relevant knowledge exists. Synthesize what you have into a comprehensive response.

Stage 3: Synthesis & Justification`
      );

      if (enhancedPrompt !== currentPrompt) {
        await prisma.aIConfiguration.update({
          where: { id: 'singleton' },
          data: { systemPrompt: enhancedPrompt }
        });
        console.log('✅ Enhanced system prompt with comprehensive synthesis instructions');
      }
    } else {
      console.log('⚠️  System prompt needs RAG enhancement - but current prompt is already comprehensive');
    }

    console.log('\n📊 Current System Prompt Length:', currentPrompt.length, 'characters');

  } catch (error) {
    console.error('❌ Error enhancing system prompt:', error);
  } finally {
    await prisma.$disconnect();
  }
}

enhanceSystemPrompt();
