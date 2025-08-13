// detailed-ai-config-analysis.js
// Deep analysis of AI configuration and system behavior

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function detailedAIConfigAnalysis() {
  console.log('🔍 DETAILED AI CONFIGURATION ANALYSIS');
  console.log('=====================================\n');

  try {
    const aiConfig = await prisma.aIConfiguration.findFirst();
    
    if (!aiConfig) {
      console.log('❌ No AI configuration found!');
      return;
    }

    console.log('📊 CURRENT RAG CONFIGURATION:');
    console.log('-----------------------------');
    console.log(`   Similarity Threshold: ${aiConfig.ragSimilarityThreshold}`);
    console.log(`   High Relevance Threshold: ${aiConfig.ragHighRelevanceThreshold}`);
    console.log(`   Max Chunks: ${aiConfig.ragMaxChunks}`);
    console.log(`   Strict Muscle Priority: ${aiConfig.strictMusclePriority}`);
    console.log(`   Use Knowledge Base: ${aiConfig.useKnowledgeBase}`);
    console.log(`   Use Client Memory: ${aiConfig.useClientMemory}`);

    // Test vector search performance with current thresholds
    console.log('\n🧪 TESTING VECTOR SEARCH WITH CURRENT THRESHOLDS:');
    console.log('------------------------------------------------');
    
    const testQueries = [
      'muscle hypertrophy training',
      'workout programming',
      'protein intake recommendations',
      'deadlift technique',
      'rest between sets'
    ];

    for (const query of testQueries) {
      try {
        const chunks = await prisma.knowledgeChunk.findMany({
          where: {
            knowledgeItem: {
              status: 'READY'
            }
          },
          select: {
            id: true,
            content: true,
            embedding: true
          }
        });

        // Simulate embedding comparison (simplified)
        let relevantChunks = 0;
        let maxSimilarity = 0;
        
        chunks.forEach(chunk => {
          if (chunk.embedding) {
            // Simplified similarity check - in real implementation this would use actual vector similarity
            const contentLower = chunk.content.toLowerCase();
            const queryLower = query.toLowerCase();
            const queryWords = queryLower.split(' ');
            
            let matches = 0;
            queryWords.forEach(word => {
              if (contentLower.includes(word)) matches++;
            });
            
            const similarity = matches / queryWords.length;
            if (similarity > maxSimilarity) maxSimilarity = similarity;
            
            // Check if it would pass current threshold
            if (similarity >= aiConfig.ragSimilarityThreshold) {
              relevantChunks++;
            }
          }
        });

        console.log(`   "${query}": ${relevantChunks} chunks pass threshold (max sim: ${maxSimilarity.toFixed(3)})`);
      } catch (error) {
        console.log(`   "${query}": Error testing - ${error.message}`);
      }
    }

    // Analyze system prompt for critical instructions
    console.log('\n📝 SYSTEM PROMPT ANALYSIS:');
    console.log('--------------------------');
    
    const prompt = aiConfig.systemPrompt;
    const promptLower = prompt.toLowerCase();
    
    const criticalInstructions = {
      'Knowledge Base Priority': {
        present: promptLower.includes('knowledge base') || promptLower.includes('reference material'),
        keywords: ['knowledge base', 'reference material', 'primary source']
      },
      'Evidence-Based Approach': {
        present: promptLower.includes('evidence') || promptLower.includes('scientific'),
        keywords: ['evidence', 'scientific', 'research', 'data-driven']
      },
      'Synthesis Instructions': {
        present: promptLower.includes('synthesize') || promptLower.includes('combine') || promptLower.includes('integrate'),
        keywords: ['synthesize', 'combine', 'integrate', 'merge']
      },
      'Fallback Strategy': {
        present: promptLower.includes('fallback') || promptLower.includes('general knowledge'),
        keywords: ['fallback', 'general knowledge', 'if absent', 'only if']
      },
      'Client Personalization': {
        present: promptLower.includes('client') || promptLower.includes('personal'),
        keywords: ['client', 'personal', 'profile', 'individual']
      },
      'Professional Coaching': {
        present: promptLower.includes('coach') || promptLower.includes('trainer'),
        keywords: ['coach', 'trainer', 'guidance', 'support']
      }
    };

    Object.entries(criticalInstructions).forEach(([instruction, data]) => {
      const status = data.present ? '✅' : '❌';
      console.log(`   ${status} ${instruction}: ${data.present}`);
      
      if (data.present) {
        // Find which keywords are present
        const foundKeywords = data.keywords.filter(keyword => promptLower.includes(keyword));
        console.log(`      Keywords found: ${foundKeywords.join(', ')}`);
      }
    });

    // Check for restrictive language
    console.log('\n⚠️  RESTRICTIVE LANGUAGE ANALYSIS:');
    console.log('---------------------------------');
    
    const restrictivePhrases = [
      'only if',
      'must not',
      'never use',
      'strictly forbidden',
      'do not use',
      'exclusively',
      'only when'
    ];

    restrictivePhrases.forEach(phrase => {
      if (promptLower.includes(phrase)) {
        console.log(`   ⚠️  Found: "${phrase}"`);
        // Find context
        const index = promptLower.indexOf(phrase);
        const context = prompt.substring(Math.max(0, index - 50), index + phrase.length + 50);
        console.log(`      Context: "...${context}..."`);
      }
    });

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('-------------------');
    
    const recommendations = [];
    
    if (aiConfig.ragSimilarityThreshold > 0.5) {
      recommendations.push('🔧 CRITICAL: Lower similarity threshold from ' + aiConfig.ragSimilarityThreshold + ' to 0.1-0.3 for better recall');
    }
    
    if (!criticalInstructions['Evidence-Based Approach'].present) {
      recommendations.push('📝 Add explicit "evidence-based" language to system prompt');
    }
    
    if (!criticalInstructions['Synthesis Instructions'].present) {
      recommendations.push('📝 Add synthesis instructions to encourage combining knowledge sources');
    }
    
    if (aiConfig.ragMaxChunks < 10) {
      recommendations.push('🔧 Increase max chunks from ' + aiConfig.ragMaxChunks + ' to 15-20 for better context');
    }
    
    if (aiConfig.temperature > 0.6) {
      recommendations.push('🔧 Consider lowering temperature from ' + aiConfig.temperature + ' for more focused responses');
    }

    if (recommendations.length === 0) {
      console.log('✅ Configuration appears optimal');
    } else {
      recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }

    // Check knowledge base coverage
    console.log('\n📚 KNOWLEDGE BASE COVERAGE:');
    console.log('---------------------------');
    
    const kbStats = await prisma.knowledgeItem.aggregate({
      where: { status: 'READY' },
      _count: { id: true }
    });
    
    const chunkStats = await prisma.knowledgeChunk.aggregate({
      where: {
        knowledgeItem: { status: 'READY' }
      },
      _count: { id: true }
    });

    console.log(`   Total Knowledge Items: ${kbStats._count.id}`);
    console.log(`   Total Knowledge Chunks: ${chunkStats._count.id}`);
    console.log(`   Average chunks per item: ${(chunkStats._count.id / kbStats._count.id).toFixed(1)}`);

    // Check for content gaps
    const categories = await prisma.knowledgeItem.groupBy({
      by: ['category'],
      where: { status: 'READY' },
      _count: { id: true }
    });

    console.log('\n   Content by category:');
    categories.forEach(cat => {
      console.log(`   - ${cat.category || 'Uncategorized'}: ${cat._count.id} items`);
    });

  } catch (error) {
    console.error('❌ Error in analysis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

detailedAIConfigAnalysis();
