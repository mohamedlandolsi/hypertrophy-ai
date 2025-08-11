const { PrismaClient } = require('@prisma/client');
const { generateEmbedding } = require('./src/lib/embeddings');
const { fetchRelevantKnowledge, performAndKeywordSearch } = require('./src/lib/vector-search');

const prisma = new PrismaClient();

async function testUpperLowerRetrieval() {
  try {
    console.log('🔍 Testing what gets retrieved for upper/lower program request...\n');
    
    const testQuery = "give me a full upper lower program";
    console.log(`Query: "${testQuery}"\n`);
    
    // Generate embedding for the query
    console.log('🧠 Generating embedding...');
    const embedding = await generateEmbedding(testQuery);
    
    // Test vector search
    console.log('📊 Testing vector search (similarity threshold 0.05, limit 8)...');
    const vectorResults = await fetchRelevantKnowledge(embedding.embedding, 8, 0.05);
    
    console.log(`\n✅ Vector search returned ${vectorResults.length} chunks:`);
    vectorResults.forEach((result, i) => {
      console.log(`\n${i + 1}. Similarity: ${result.similarity.toFixed(3)}`);
      console.log(`   Source: ${result.knowledgeItem.title}`);
      console.log(`   Content preview: ${result.content.substring(0, 150)}...`);
    });
    
    // Test keyword search
    console.log('\n\n🔍 Testing keyword search...');
    const keywordResults = await performAndKeywordSearch(testQuery, 8);
    
    console.log(`\n✅ Keyword search returned ${keywordResults.length} chunks:`);
    keywordResults.forEach((result, i) => {
      console.log(`\n${i + 1}. Source: ${result.knowledgeItem.title}`);
      console.log(`   Content preview: ${result.content.substring(0, 150)}...`);
    });
    
    // Check if any results contain rep ranges or rest periods
    const allResults = [...vectorResults, ...keywordResults];
    const hasRepRanges = allResults.some(r => 
      r.content.toLowerCase().includes('repetition') || 
      r.content.toLowerCase().includes('5-10') ||
      r.content.toLowerCase().includes('rep range')
    );
    
    const hasRestPeriods = allResults.some(r => 
      r.content.toLowerCase().includes('2 and 5 minutes') ||
      r.content.toLowerCase().includes('rest period')
    );
    
    console.log(`\n\n📋 Analysis:`);
    console.log(`- Contains rep ranges: ${hasRepRanges ? '✅ YES' : '❌ NO'}`);
    console.log(`- Contains rest periods: ${hasRestPeriods ? '✅ YES' : '❌ NO'}`);
    
    if (!hasRepRanges || !hasRestPeriods) {
      console.log('\n🎯 ISSUE IDENTIFIED: The methodology chunks are not being retrieved!');
      console.log('💡 Solution: Need to improve query terms or add methodology keywords to search.');
    }
    
  } catch (error) {
    console.error('❌ Error testing retrieval:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUpperLowerRetrieval();
