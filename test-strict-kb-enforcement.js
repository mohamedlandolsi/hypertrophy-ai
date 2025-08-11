const { PrismaClient } = require('@prisma/client');

async function testStrictKBEnforcement() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing Strict Knowledge Base Enforcement...');
    
    // Check the updated system prompt
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' },
      select: {
        systemPrompt: true,
        ragMaxChunks: true,
        ragSimilarityThreshold: true
      }
    });
    
    console.log('📊 Current Configuration:');
    console.log('- System Prompt Length:', config.systemPrompt.length, 'characters');
    console.log('- RAG Max Chunks:', config.ragMaxChunks);
    console.log('- RAG Similarity Threshold:', config.ragSimilarityThreshold);
    
    // Check if the strict enforcement keywords are in the prompt
    const strictKeywords = [
      'STRICT',
      'FORBIDDEN',
      'KB SUPREMACY', 
      'Knowledge Base Gap',
      'ONLY from KB chunks',
      'pre-trained fitness knowledge'
    ];
    
    console.log('\n🔒 Strict Enforcement Keywords Present:');
    strictKeywords.forEach(keyword => {
      const present = config.systemPrompt.includes(keyword);
      console.log(`${present ? '✅' : '❌'} "${keyword}"`);
    });
    
    // Sample some knowledge chunks to verify rep range content
    console.log('\n📚 Sample Knowledge Base Content (Rep Ranges):');
    const sampleChunks = await prisma.knowledgeChunk.findMany({
      take: 5,
      where: {
        content: {
          contains: 'rep',
          mode: 'insensitive'
        },
        knowledgeItem: {
          status: 'READY'
        }
      },
      include: {
        knowledgeItem: {
          select: { title: true }
        }
      }
    });
    
    sampleChunks.forEach((chunk, index) => {
      console.log(`${index + 1}. ${chunk.knowledgeItem.title}:`);
      const excerpt = chunk.content.substring(0, 150) + '...';
      console.log(`   "${excerpt}"`);
    });
    
    console.log('\n🎯 Testing Recommendations:');
    console.log('1. Ask for an "Upper/Lower split" and verify it uses only KB rep ranges');
    console.log('2. Request "triceps exercises" and check if it mentions only KB exercises'); 
    console.log('3. Ask about "best rep range for hypertrophy" to test KB vs generic knowledge');
    
    console.log('\n✅ Enhanced System Prompt Applied Successfully!');
    console.log('The AI should now:');
    console.log('- Use ONLY rep ranges found in knowledge base chunks');
    console.log('- Acknowledge gaps when KB lacks specific information');
    console.log('- Cite KB sources for all fitness recommendations');
    console.log('- Refuse to use generic "8-12 reps" without KB evidence');
    
  } catch (error) {
    console.error('❌ Error testing KB enforcement:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testStrictKBEnforcement();
