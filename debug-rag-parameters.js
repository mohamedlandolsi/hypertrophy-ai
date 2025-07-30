const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Copy the exact function from vector-search.ts
async function optimizedJsonSimilaritySearch(queryEmbedding, topK, highRelevanceThreshold) {
  try {
    console.log(`🚀 Starting optimized similarity search for top ${topK} chunks with threshold ${highRelevanceThreshold}`);
    const searchStart = Date.now();
    
    // Process chunks in smaller batches for better performance
    const batchSize = 50;
    
    // Get total count first for pagination
    const totalChunks = await prisma.knowledgeChunk.count({
      where: {
        embeddingData: { not: null }
      }
    });
    
    console.log(`📊 Processing ${totalChunks} total chunks with embeddings`);
    
    const results = [];
    const totalBatches = Math.ceil(totalChunks / batchSize);
    
    for (let batch = 0; batch < totalBatches; batch++) {
      const offset = batch * batchSize;
      
      // Fetch batch of chunks with knowledge item details
      const chunks = await prisma.knowledgeChunk.findMany({
        where: {
          embeddingData: { not: null }
        },
        include: {
          knowledgeItem: {
            select: {
              id: true,
              title: true
            }
          }
        },
        skip: offset,
        take: batchSize,
        orderBy: { id: 'asc' }
      });
      
      // Process similarities for this batch
      for (const chunk of chunks) {
        try {
          const embeddingData = JSON.parse(chunk.embeddingData);
          const similarity = cosineSimilarity(queryEmbedding, embeddingData);
          
          // Apply threshold filter here
          if (similarity >= (highRelevanceThreshold || 0.3)) {
            results.push({
              content: chunk.content,
              knowledgeId: chunk.knowledgeItem.id,
              title: chunk.knowledgeItem.title,
              similarity: similarity,
              chunkIndex: chunk.chunkIndex
            });
          }
        } catch (embeddingError) {
          console.warn(`⚠️ Failed to parse embedding for chunk ${chunk.id}:`, embeddingError.message);
        }
      }
    }
    
    // Sort results by similarity and return top K
    results.sort((a, b) => b.similarity - a.similarity);
    const topResults = results.slice(0, topK);
    
    const searchTime = Date.now() - searchStart;
    console.log(`✅ Similarity search completed in ${searchTime}ms - found ${topResults.length} relevant chunks out of ${results.length} above threshold`);
    
    return topResults;
    
  } catch (error) {
    console.error('❌ Error in optimized similarity search:', error);
    throw error;
  }
}

function cosineSimilarity(a, b) {
  if (a.length !== b.length) {
    throw new Error(`Vector dimensions don't match: ${a.length} vs ${b.length}`);
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function debugRAGParameters() {
  console.log('🔍 Debugging RAG Parameters and Threshold Issues...');
  
  try {
    // Get current AI configuration
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });
    
    console.log('\n📋 Current RAG Configuration:');
    console.log('- Similarity Threshold:', config.ragSimilarityThreshold);
    console.log('- Max Chunks:', config.ragMaxChunks);
    console.log('- High Relevance Threshold:', config.ragHighRelevanceThreshold);
    
    // Test the exact query that's failing
    const query = "What is a deload week?";
    console.log(`\n🔍 Testing query: "${query}"`);
    
    // Generate embedding
    const embeddingResult = await genAI.getGenerativeModel({ model: "text-embedding-004" })
      .embedContent(query);
    const queryEmbedding = embeddingResult.embedding.values;
    
    // Test with current configuration
    console.log('\n🧪 Testing with CURRENT configuration:');
    const currentResults = await optimizedJsonSimilaritySearch(
      queryEmbedding,
      config.ragMaxChunks,
      config.ragHighRelevanceThreshold
    );
    
    console.log(`📚 Found ${currentResults.length} chunks with current settings`);
    currentResults.forEach((chunk, index) => {
      console.log(`  ${index + 1}. ${chunk.similarity.toFixed(3)} - ${chunk.title}`);
      if (chunk.title.toLowerCase().includes('deload')) {
        console.log(`     ✅ THIS IS THE DELOAD ARTICLE!`);
      }
    });
    
    // Test with very low threshold
    console.log('\n🧪 Testing with VERY LOW threshold (0.1):');
    const lowThresholdResults = await optimizedJsonSimilaritySearch(
      queryEmbedding,
      config.ragMaxChunks,
      0.1 // Very low threshold
    );
    
    console.log(`📚 Found ${lowThresholdResults.length} chunks with low threshold`);
    lowThresholdResults.forEach((chunk, index) => {
      console.log(`  ${index + 1}. ${chunk.similarity.toFixed(3)} - ${chunk.title}`);
      if (chunk.title.toLowerCase().includes('deload')) {
        console.log(`     ✅ THIS IS THE DELOAD ARTICLE!`);
      }
    });
    
    // Test with no threshold
    console.log('\n🧪 Testing with NO threshold (0.0):');
    const noThresholdResults = await optimizedJsonSimilaritySearch(
      queryEmbedding,
      20, // Get more results
      0.0 // No threshold
    );
    
    console.log(`📚 Found ${noThresholdResults.length} chunks with no threshold`);
    noThresholdResults.slice(0, 10).forEach((chunk, index) => {
      console.log(`  ${index + 1}. ${chunk.similarity.toFixed(3)} - ${chunk.title}`);
      if (chunk.title.toLowerCase().includes('deload')) {
        console.log(`     ✅ THIS IS THE DELOAD ARTICLE!`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugRAGParameters();
