const { performAndKeywordSearch } = require('./src/lib/vector-search.ts');

async function testActualAPI() {
  console.log('\n🔍 Testing Actual API Functions\n');
  
  try {
    console.log('Testing performAndKeywordSearch with triceps query...');
    const results = await performAndKeywordSearch('What are the best isolation exercises for arms', 10);
    
    console.log(`Found ${results.length} results:`);
    results.forEach((result, i) => {
      console.log(`${i + 1}. ${result.title} (Similarity: ${result.similarity})`);
      if (result.title.toLowerCase().includes('biasing the triceps heads')) {
        console.log(`   🎯 SUCCESS: Found the triceps biasing guide!`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testActualAPI();
