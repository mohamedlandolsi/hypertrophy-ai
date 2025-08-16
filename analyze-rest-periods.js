const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeRestPeriods() {
  console.log('=== Analyzing Rest Period Information in Knowledge Base ===\n');
  
  try {
    // Search for rest period information in priority categories
    const restPeriodResults = await prisma.$queryRaw`
      SELECT 
        ki.title,
        kc.content,
        kcat.name as category_name,
        kc."chunkIndex"
      FROM "KnowledgeChunk" kc
      JOIN "KnowledgeItem" ki ON kc."knowledgeItemId" = ki.id  
      JOIN "KnowledgeItemCategory" kic ON ki.id = kic."knowledgeItemId"
      JOIN "KnowledgeCategory" kcat ON kic."knowledgeCategoryId" = kcat.id
      WHERE ki.status = 'READY' 
        AND (
          kc.content ILIKE '%rest%' OR 
          kc.content ILIKE '%recovery%' OR 
          kc.content ILIKE '%minute%' OR
          kc.content ILIKE '%second%' OR
          kc.content ILIKE '%between sets%'
        )
        AND kcat.name IN ('hypertrophy_programs', 'hypertrophy_principles')
      ORDER BY kcat.name, ki.title, kc."chunkIndex"
    `;
    
    console.log(`Found ${restPeriodResults.length} chunks with rest period information:\n`);
    
    const restPeriodRecommendations = [];
    
    restPeriodResults.forEach((result, index) => {
      console.log(`${index + 1}. [${result.category_name}] ${result.title} (chunk ${result.chunkIndex})`);
      
      const content = result.content.toLowerCase();
      
      // Look for specific rest period mentions
      const restMatches = content.match(/(\d+(?:-\d+)?)\s*(?:to\s*)?(\d+)?\s*(minute|min|second|sec)/gi);
      const contextMatches = content.match(/rest\s+(?:for\s+)?(\d+(?:-\d+)?(?:\s*to\s*\d+)?)\s*(minute|min|second|sec)/gi);
      
      if (restMatches || contextMatches) {
        console.log(`   🕐 Rest periods found:`);
        if (restMatches) {
          restMatches.forEach(match => {
            console.log(`      - "${match}"`);
            restPeriodRecommendations.push({
              source: result.title,
              category: result.category_name,
              recommendation: match,
              context: result.content.substring(
                Math.max(0, result.content.toLowerCase().indexOf(match.toLowerCase()) - 50),
                Math.min(result.content.length, result.content.toLowerCase().indexOf(match.toLowerCase()) + match.length + 50)
              )
            });
          });
        }
        if (contextMatches) {
          contextMatches.forEach(match => {
            console.log(`      - "${match}"`);
            restPeriodRecommendations.push({
              source: result.title,
              category: result.category_name,
              recommendation: match,
              context: result.content.substring(
                Math.max(0, result.content.toLowerCase().indexOf(match.toLowerCase()) - 50),
                Math.min(result.content.length, result.content.toLowerCase().indexOf(match.toLowerCase()) + match.length + 50)
              )
            });
          });
        }
      }
      
      // Show content preview
      console.log(`   Preview: ${result.content.substring(0, 200)}...`);
      console.log('');
    });
    
    // Analyze the AI's recommendation vs KB recommendations
    console.log('\n=== Rest Period Analysis ===');
    console.log('AI said: "Rest for 2-3 minutes between sets for multi-joint exercises and 60-90 seconds for single-joint (isolation) exercises"');
    console.log('');
    
    console.log('Knowledge Base Recommendations:');
    const uniqueRecommendations = [...new Set(restPeriodRecommendations.map(r => r.recommendation))];
    uniqueRecommendations.forEach(rec => {
      const sources = restPeriodRecommendations.filter(r => r.recommendation === rec);
      console.log(`✓ "${rec}" - Found in ${sources.length} source(s):`);
      sources.forEach(source => {
        console.log(`   - [${source.category}] ${source.source}`);
        console.log(`     Context: ...${source.context}...`);
      });
      console.log('');
    });
    
    // Check for specific patterns mentioned by the AI
    console.log('=== Specific Pattern Analysis ===');
    
    // Look for 2-3 minutes
    const twoThreeMinutes = restPeriodResults.filter(r => 
      r.content.toLowerCase().includes('2-3 minute') ||
      r.content.toLowerCase().includes('2 to 3 minute') ||
      r.content.toLowerCase().includes('2-3 min')
    );
    
    console.log(`"2-3 minutes" pattern found in ${twoThreeMinutes.length} sources:`);
    twoThreeMinutes.forEach(result => {
      console.log(`✓ [${result.category_name}] ${result.title}`);
    });
    
    // Look for 60-90 seconds
    const sixtyNinetySeconds = restPeriodResults.filter(r => 
      r.content.toLowerCase().includes('60-90 second') ||
      r.content.toLowerCase().includes('60 to 90 second') ||
      r.content.toLowerCase().includes('1-1.5 minute')
    );
    
    console.log(`\n"60-90 seconds" pattern found in ${sixtyNinetySeconds.length} sources:`);
    sixtyNinetySeconds.forEach(result => {
      console.log(`✓ [${result.category_name}] ${result.title}`);
    });
    
    // Look for alternative rest period recommendations
    console.log('\n=== Alternative Rest Period Recommendations ===');
    
    const alternativePatterns = [
      '3-5 minute',
      '1-2 minute', 
      '90 second',
      '2 minute',
      '3 minute',
      '4 minute',
      '5 minute'
    ];
    
    alternativePatterns.forEach(pattern => {
      const matches = restPeriodResults.filter(r => 
        r.content.toLowerCase().includes(pattern)
      );
      
      if (matches.length > 0) {
        console.log(`"${pattern}" found in ${matches.length} source(s):`);
        matches.forEach(match => {
          console.log(`  - [${match.category_name}] ${match.title}`);
        });
      }
    });
    
    console.log('\n=== Conclusion ===');
    if (twoThreeMinutes.length === 0 && sixtyNinetySeconds.length === 0) {
      console.log('❌ The AI\'s rest period recommendation (2-3 min / 60-90 sec) is NOT found in the knowledge base');
      console.log('🔍 This suggests the AI is hallucinating rest periods not present in the KB');
      console.log('💡 Need to ensure RAG system includes accurate rest period information');
    } else {
      console.log('✅ The AI\'s rest period recommendation matches the knowledge base');
    }
    
  } catch (error) {
    console.error('Error analyzing rest periods:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeRestPeriods();
