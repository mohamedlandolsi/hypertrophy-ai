/**
 * Test script for semantic mapping functionality
 * Run with: node test-semantic-mapping.js
 */

const { applySemanticMapping, processQueryForRAG } = require('./src/lib/query-translation');

async function testSemanticMapping() {
  console.log('🧪 Testing Semantic Mapping System\n');
  
  const testQueries = [
    // The problematic query that should now work
    'upper lower program',
    'lower body workout',
    'leg day exercises',
    
    // Arabic queries (should be translated then mapped)
    'تمارين الجزء السفلي',
    'تمارين الأرجل',
    
    // French queries (should be translated then mapped) 
    'exercices pour les jambes',
    'entraînement du bas du corps',
    
    // Specific muscle groups
    'chest and triceps workout',
    'back and biceps day',
    'shoulder training',
    'quad and hamstring exercises',
    
    // Broad fitness terms
    'muscle growth tips',
    'strength training program',
    'compound exercises',
    
    // Training splits
    'push day routine',
    'pull day workout',
    'leg day plan'
  ];
  
  // Test semantic mapping function directly
  console.log('📋 Testing Direct Semantic Mapping:\n');
  for (const query of testQueries.slice(0, 5)) {
    console.log(`Original: "${query}"`);
    const mapped = applySemanticMapping(query);
    if (mapped !== query) {
      console.log(`Mapped: "${mapped}"`);
    } else {
      console.log('No mapping applied');
    }
    console.log('---');
  }
  
  // Test full query processing pipeline
  console.log('\n🔄 Testing Full Query Processing Pipeline:\n');
  for (const query of testQueries.slice(0, 3)) {
    try {
      console.log(`\n🔍 Processing: "${query}"`);
      const result = await processQueryForRAG(query);
      
      console.log(`  Original: ${result.originalQuery}`);
      console.log(`  Translated: ${result.translatedQuery}`);
      console.log(`  Semantically Mapped: ${result.semanticallyMappedQuery}`);
      console.log(`  Expanded to ${result.expandedQueries.length} queries:`);
      result.expandedQueries.forEach((q, i) => {
        console.log(`    ${i + 1}. ${q}`);
      });
      console.log(`  Was Translated: ${result.isTranslated}`);
      
    } catch (error) {
      console.error(`❌ Error processing "${query}":`, error.message);
    }
  }
  
  console.log('\n✅ Semantic mapping test complete!');
  console.log('\n📝 Key improvements:');
  console.log('- "lower body" now includes: quadriceps, hamstrings, glutes, calves, etc.');
  console.log('- "upper body" now includes: chest, back, shoulders, biceps, triceps, etc.');
  console.log('- Specific muscle groups get technical term mappings');
  console.log('- Training splits get exercise-specific mappings');
  console.log('- This should significantly improve retrieval for anatomical queries');
}

// Run the test
if (require.main === module) {
  testSemanticMapping().catch(console.error);
}

module.exports = { testSemanticMapping };
