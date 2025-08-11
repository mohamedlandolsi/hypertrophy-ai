const { processQueryForRAG, translateQueryToEnglish, expandQuery } = require('./src/lib/query-translation');

async function testQueryTranslationAndExpansion() {
  console.log('🧪 Testing Query Translation and Expansion System\n');

  // Test cases
  const testQueries = [
    // English queries
    'give me a workout',
    'chest exercises',
    'optimal rep ranges for hypertrophy',
    
    // Arabic queries
    'أعطيني تمارين',
    'تمارين الصدر',
    'كيف أبني العضلات',
    
    // French queries
    'donnez-moi des exercices',
    'exercices pour les pectoraux',
    'comment construire du muscle',
    
    // Broad queries that need expansion
    'push workout',
    'how to build muscle',
    'strength training'
  ];

  for (const query of testQueries) {
    console.log(`\n📝 Testing: "${query}"`);
    console.log('─'.repeat(50));
    
    try {
      // Test the complete processing pipeline
      const result = await processQueryForRAG(query);
      
      console.log(`Original: ${result.originalQuery}`);
      console.log(`Translated: ${result.translatedQuery}`);
      console.log(`Is Translated: ${result.isTranslated}`);
      console.log(`Expanded Queries (${result.expandedQueries.length}):`);
      result.expandedQueries.forEach((eq, i) => {
        console.log(`  ${i + 1}. ${eq}`);
      });
      
    } catch (error) {
      console.error(`❌ Error processing "${query}":`, error.message);
    }
  }

  console.log('\n✅ Query Translation and Expansion Test Complete');
}

async function testIndividualFunctions() {
  console.log('\n🔧 Testing Individual Functions\n');

  // Test translation function
  console.log('Testing Translation Function:');
  const arabicQuery = 'أعطيني تمارين للصدر';
  const frenchQuery = 'donnez-moi des exercices pour les pectoraux';
  
  try {
    const translatedArabic = await translateQueryToEnglish(arabicQuery);
    console.log(`Arabic: "${arabicQuery}" → "${translatedArabic}"`);
    
    const translatedFrench = await translateQueryToEnglish(frenchQuery);
    console.log(`French: "${frenchQuery}" → "${translatedFrench}"`);
  } catch (error) {
    console.error('Translation test error:', error.message);
  }

  // Test expansion function
  console.log('\nTesting Expansion Function:');
  const broadQueries = ['workout', 'build muscle', 'push day'];
  
  for (const query of broadQueries) {
    try {
      const expanded = await expandQuery(query);
      console.log(`"${query}" expanded to ${expanded.length} queries:`);
      expanded.forEach((eq, i) => console.log(`  ${i + 1}. ${eq}`));
    } catch (error) {
      console.error(`Expansion test error for "${query}":`, error.message);
    }
  }
}

// Run tests
async function runAllTests() {
  try {
    await testQueryTranslationAndExpansion();
    await testIndividualFunctions();
  } catch (error) {
    console.error('Test suite error:', error);
  }
}

runAllTests();
