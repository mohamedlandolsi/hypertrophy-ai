const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const prisma = new PrismaClient();

// Initialize Gemini AI
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Import the fetchRelevantKnowledge function logic
async function optimizedJsonSimilaritySearch(queryEmbedding, topK, highRelevanceThreshold) {
  try {
    console.log(`🚀 Starting optimized similarity search for top ${topK} chunks`);
    const searchStart = Date.now();
    
    // Process chunks in smaller batches for better performance
    const batchSize = 50; // Process 50 chunks at a time
    
    // Get total count first for pagination
    const totalChunks = await prisma.knowledgeChunk.count({
      where: {
        embeddingData: { not: null }  // Only process chunks with embeddings
      }
    });
    
    console.log(`📊 Processing ${totalChunks} total chunks with embeddings`);
    
    const results = [];
    const totalBatches = Math.ceil(totalChunks / batchSize);
    
    for (let batch = 0; batch < totalBatches; batch++) {
      const offset = batch * batchSize;
      console.log(`📦 Processing batch ${batch + 1}/${totalBatches} (offset: ${offset})`);
      
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
        orderBy: { id: 'asc' } // Consistent ordering for pagination
      });
      
      // Process similarities for this batch
      for (const chunk of chunks) {
        try {
          const embeddingData = JSON.parse(chunk.embeddingData);
          const similarity = cosineSimilarity(queryEmbedding, embeddingData);
          
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
    console.log(`✅ Similarity search completed in ${searchTime}ms - found ${topResults.length} relevant chunks`);
    
    return topResults;
    
  } catch (error) {
    console.error('❌ Error in optimized similarity search:', error);
    throw error;
  }
}

// Cosine similarity function
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

async function testDeloadRAGSystem() {
  console.log('🧪 Testing Deload RAG System...');
  
  try {
    // Test deload-related queries
    const deloadQueries = [
      "What is a deload week?",
      "How should I program deload weeks?",
      "When should I take a deload?",
      "What should I do during deload week?",
      "How to structure deload training?"
    ];
    
    for (const query of deloadQueries) {
      console.log(`\n🔍 Testing query: "${query}"`);
      
      try {
        // Generate embedding for the query
        const embeddingResult = await genAI.getGenerativeModel({ model: "text-embedding-004" })
          .embedContent(query);
        const queryEmbedding = embeddingResult.embedding.values;
        
        // Search for relevant chunks
        const chunks = await optimizedJsonSimilaritySearch(
          queryEmbedding,
          10, // topK
          0.2 // lowered threshold for testing
        );
        
        console.log(`📚 Retrieved ${chunks.length} chunks`);
        
        if (chunks.length > 0) {
          console.log('Top chunks:');
          chunks.slice(0, 3).forEach((chunk, index) => {
            console.log(`  ${index + 1}. Score: ${chunk.similarity.toFixed(3)} - ${chunk.content.substring(0, 100)}...`);
          });
          
          // Show the knowledge context that would be sent to AI
          const contextText = chunks.map(chunk => chunk.content).join('\n\n');
          console.log('\n📋 Knowledge Context Preview:');
          console.log(contextText.substring(0, 500) + '...');
        } else {
          console.log('❌ No relevant chunks found');
        }
        
      } catch (error) {
        console.error(`❌ Error processing query "${query}":`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error in test:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDeloadRAGSystem();
