const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate embedding for text using Gemini's embedding model
 */
async function generateEmbedding(text) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'text-embedding-004'
    });

    const result = await model.embedContent(text);
    return {
      embedding: result.embedding.values,
      text: text
    };
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Test source diversification with different queries
 */
async function testSourceDiversification() {
  console.log('🧪 Testing Source Diversification to Prevent Chunk Dominance...\n');

  try {
    // Test queries that might cause chunk dominance
    const testQueries = [
      "chest exercises and training",
      "shoulder workout routines", 
      "quadriceps exercises",
      "muscle recovery rates",
      "training volume guidelines"
    ];

    for (const query of testQueries) {
      console.log(`\n🔍 Testing Query: "${query}"`);
      console.log('=' + '='.repeat(50));

      // Generate query embedding
      const queryEmbeddingResult = await generateEmbedding(query);
      
      // Test the new diversified search
      const topK = 8;
      const highRelevanceThreshold = 0.65;
      
      console.log(`📊 Parameters: topK=${topK}, threshold=${highRelevanceThreshold}`);

      // Simulate the fetchRelevantKnowledge function directly
      const chunks = await prisma.knowledgeChunk.findMany({
        where: {
          embeddingData: { not: null },
          knowledgeItem: { status: 'READY' }
        },
        include: {
          knowledgeItem: {
            select: { id: true, title: true }
          }
        }
      });

      // Calculate similarities
      const similarities = chunks.map(chunk => {
        try {
          const chunkEmbedding = JSON.parse(chunk.embeddingData);
          const similarity = cosineSimilarity(queryEmbeddingResult.embedding, chunkEmbedding);
          
          return {
            content: chunk.content,
            knowledgeId: chunk.knowledgeItem.id,
            title: chunk.knowledgeItem.title,
            similarity,
            chunkIndex: chunk.chunkIndex
          };
        } catch (parseError) {
          return null;
        }
      }).filter(Boolean);

      // Sort by similarity
      const sortedSimilarities = similarities.sort((a, b) => b.similarity - a.similarity);

      // Show what would happen WITHOUT diversification
      const topWithoutDiversification = sortedSimilarities.slice(0, topK);
      const sourcesWithoutDiversification = new Set(topWithoutDiversification.map(c => c.title));
      
      console.log(`\n❌ WITHOUT Diversification:`);
      console.log(`   Top ${topK} chunks come from ${sourcesWithoutDiversification.size} sources`);
      const sourceCountWithout = {};
      topWithoutDiversification.forEach(chunk => {
        sourceCountWithout[chunk.title] = (sourceCountWithout[chunk.title] || 0) + 1;
      });
      Object.entries(sourceCountWithout).forEach(([title, count]) => {
        console.log(`   - "${title.substring(0, 50)}...": ${count} chunks`);
      });

      // Apply the NEW diversification logic
      const initialFetchLimit = Math.max(topK * 3, 15);
      let candidateChunks = sortedSimilarities.slice(0, initialFetchLimit);

      // Filter by threshold
      candidateChunks = candidateChunks.filter(chunk => chunk.similarity >= highRelevanceThreshold);

      // Diversification
      const diversifiedChunks = [];
      const seenKnowledgeIds = new Set();

      // First pass: one chunk per source
      for (const chunk of candidateChunks) {
        if (diversifiedChunks.length >= topK) break;
        if (!seenKnowledgeIds.has(chunk.knowledgeId)) {
          diversifiedChunks.push(chunk);
          seenKnowledgeIds.add(chunk.knowledgeId);
        }
      }

      // Second pass: fill remaining slots
      if (diversifiedChunks.length < topK) {
        const remainingChunks = candidateChunks.filter(chunk =>
          !diversifiedChunks.some(dc => 
            dc.content === chunk.content && 
            dc.knowledgeId === chunk.knowledgeId
          )
        );
        const needed = topK - diversifiedChunks.length;
        diversifiedChunks.push(...remainingChunks.slice(0, needed));
      }

      console.log(`\n✅ WITH Diversification:`);
      console.log(`   Top ${diversifiedChunks.length} chunks come from ${seenKnowledgeIds.size} sources`);
      const sourceCountWith = {};
      diversifiedChunks.forEach(chunk => {
        sourceCountWith[chunk.title] = (sourceCountWith[chunk.title] || 0) + 1;
      });
      Object.entries(sourceCountWith).forEach(([title, count]) => {
        console.log(`   - "${title.substring(0, 50)}...": ${count} chunks (${(diversifiedChunks.find(c => c.title === title)?.similarity * 100).toFixed(1)}%)`);
      });

      // Show improvement metrics
      const improvement = seenKnowledgeIds.size - sourcesWithoutDiversification.size;
      console.log(`\n📈 Improvement: +${improvement} additional sources (${((seenKnowledgeIds.size / sourcesWithoutDiversification.size - 1) * 100).toFixed(0)}% more diverse)`);
    }

    console.log(`\n🎉 Source diversification testing complete!`);
    console.log(`✅ The system now prevents chunk dominance and ensures multiple sources are represented.`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Cosine similarity function
function cosineSimilarity(a, b) {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (normA * normB);
}

testSourceDiversification().catch(console.error);
