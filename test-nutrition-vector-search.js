const { performVectorSearch } = require('./src/lib/vector-search');

async function testNutritionVectorSearch() {
  try {
    console.log('🔍 Testing Vector Search for Nutrition Query');
    console.log('============================================');
    
    const query = "How much protein do I need for muscle building?";
    const userId = "3e9ab191-e4e9-4eb4-a8eb-e95cbc39c7ba";
    
    console.log('Query:', query);
    console.log('User ID:', userId);
    
    const results = await performVectorSearch(query, {
      limit: 7,
      threshold: 0.3,
      userId
    });
    
    console.log('\n📊 Vector Search Results:');
    console.log('=========================');
    console.log(`Found ${results.length} results`);
    
    results.forEach((result, index) => {
      console.log(`\n${index + 1}. Similarity: ${(result.similarity * 100).toFixed(1)}%`);
      console.log(`   Knowledge Item: ${result.knowledgeItemId}`);
      console.log(`   Content preview: ${result.content.substring(0, 200)}...`);
      console.log(`   Full content length: ${result.content.length} chars`);
    });
    
    // Check if any results contain protein-related information
    const proteinResults = results.filter(result => 
      result.content.toLowerCase().includes('protein') ||
      result.content.toLowerCase().includes('amino') ||
      result.content.toLowerCase().includes('nutrition') ||
      result.content.toLowerCase().includes('diet')
    );
    
    console.log(`\n🥩 Protein-related results: ${proteinResults.length}`);
    if (proteinResults.length > 0) {
      proteinResults.forEach((result, index) => {
        console.log(`\n${index + 1}. Protein Content (${(result.similarity * 100).toFixed(1)}%):`);
        console.log(result.content.substring(0, 500));
        console.log('...');
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testNutritionVectorSearch();
