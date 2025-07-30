const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function debugDeloadRetrieval() {
  console.log('🔍 Debugging Deload Content Retrieval...');
  
  try {
    const query = "Are deload weeks really necessary?";
    
    // Step 1: Generate embedding for the query
    console.log(`\n📝 Query: "${query}"`);
    const embeddingResult = await genAI.getGenerativeModel({ model: "text-embedding-004" })
      .embedContent(query);
    const queryEmbedding = embeddingResult.embedding.values;
    
    // Step 2: Manually search for relevant chunks with very low threshold
    console.log(`\n🔍 Searching for chunks with similarity > 0.1...`);
    
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
      }
    });
    
    console.log(`📊 Processing ${chunks.length} total chunks`);
    
    // Calculate similarities
    const results = [];
    for (const chunk of chunks) {
      try {
        const embeddingData = JSON.parse(chunk.embeddingData);
        const similarity = cosineSimilarity(queryEmbedding, embeddingData);
        
        if (similarity > 0.1) { // Very low threshold
          results.push({
            similarity,
            content: chunk.content,
            title: chunk.knowledgeItem.title,
            chunkIndex: chunk.chunkIndex
          });
        }
      } catch (error) {
        // Skip invalid embeddings
      }
    }
    
    // Sort by similarity
    results.sort((a, b) => b.similarity - a.similarity);
    
    console.log(`\n📚 Found ${results.length} relevant chunks`);
    console.log('\n🏆 Top 10 chunks:');
    
    results.slice(0, 10).forEach((result, index) => {
      console.log(`\n${index + 1}. Similarity: ${result.similarity.toFixed(3)}`);
      console.log(`   Title: ${result.title}`);
      console.log(`   Content: ${result.content.substring(0, 150)}...`);
      
      // Check if this chunk contains the advanced perspective
      const hasAdvanced = result.content.toLowerCase().includes('symptom of a flawed') ||
                         result.content.toLowerCase().includes('sustainable and never requires') ||
                         result.content.toLowerCase().includes('well-designed program');
      console.log(`   Has advanced perspective: ${hasAdvanced}`);
    });
    
    // Step 3: Check what chunks are about deloads specifically
    console.log('\n🎯 Deload-specific chunks:');
    const deloadChunks = results.filter(r => r.content.toLowerCase().includes('deload'));
    
    console.log(`Found ${deloadChunks.length} chunks mentioning deload`);
    deloadChunks.slice(0, 5).forEach((chunk, index) => {
      console.log(`\n${index + 1}. Similarity: ${chunk.similarity.toFixed(3)}`);
      console.log(`   Content: ${chunk.content.substring(0, 200)}...`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
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

debugDeloadRetrieval();
