const { fetchRelevantKnowledge } = require('./src/lib/vector-search');
const { generateEmbeddings } = require('./src/lib/gemini');
require('dotenv').config();

async function testRAGSpeed() {
  console.log('🔍 Testing RAG retrieval speed...');
  const start = Date.now();
  
  try {
    // Test query
    const testQuery = 'Give me a complete upper/lower program';
    console.log('Query:', testQuery);
    
    // Generate embeddings
    const embeddingStart = Date.now();
    const embedding = await generateEmbeddings(testQuery);
    const embeddingTime = Date.now() - embeddingStart;
    console.log('⚡ Embedding generation:', embeddingTime + 'ms');
    
    // Test vector search
    const searchStart = Date.now();
    const results = await fetchRelevantKnowledge(embedding.embedding, 10, 0.05);
    const searchTime = Date.now() - searchStart;
    console.log('🔍 Vector search:', searchTime + 'ms');
    console.log('📄 Results found:', results.length);
    
    const totalTime = Date.now() - start;
    console.log('🏁 Total RAG time:', totalTime + 'ms');
    
    if (totalTime > 10000) {
      console.log('⚠️ RAG is very slow (>10s) - this could cause timeouts');
    } else if (totalTime > 5000) {
      console.log('⚠️ RAG is slow (>5s) - might contribute to timeouts');
    } else {
      console.log('✅ RAG speed is acceptable');
    }
  } catch (error) {
    console.error('❌ RAG test failed:', error.message);
  }
}

testRAGSpeed();
