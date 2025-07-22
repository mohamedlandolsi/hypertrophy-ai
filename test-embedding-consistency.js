const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const prisma = new PrismaClient();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testEmbeddingConsistency() {
  try {
    console.log('🔍 Testing embedding generation consistency');
    
    const model = genAI.getGenerativeModel({ 
      model: 'text-embedding-004'
    });

    // Test the same text multiple times
    const testText = "chest training exercises for muscle hypertrophy";
    
    console.log(`\n🧪 Testing text: "${testText}"`);
    
    const embeddings = [];
    for (let i = 0; i < 3; i++) {
      const result = await model.embedContent(testText);
      embeddings.push(result.embedding.values);
      
      console.log(`  Generation ${i + 1}: ${result.embedding.values.length}D`);
      console.log(`    First 5 values: [${result.embedding.values.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
      
      // Calculate magnitude (norm)
      const magnitude = Math.sqrt(result.embedding.values.reduce((sum, val) => sum + val * val, 0));
      console.log(`    Magnitude: ${magnitude.toFixed(4)}`);
    }

    // Test self-similarity
    function cosineSimilarity(vectorA, vectorB) {
      let dotProduct = 0;
      let normA = 0;
      let normB = 0;

      for (let i = 0; i < vectorA.length; i++) {
        dotProduct += vectorA[i] * vectorB[i];
        normA += vectorA[i] * vectorA[i];
        normB += vectorB[i] * vectorB[i];
      }

      normA = Math.sqrt(normA);
      normB = Math.sqrt(normB);

      if (normA === 0 || normB === 0) {
        return 0;
      }

      return dotProduct / (normA * normB);
    }

    console.log(`\n🔬 Self-similarity tests:`);
    const sim1_2 = cosineSimilarity(embeddings[0], embeddings[1]);
    const sim1_3 = cosineSimilarity(embeddings[0], embeddings[2]);
    const sim2_3 = cosineSimilarity(embeddings[1], embeddings[2]);
    
    console.log(`  Generation 1 vs 2: ${(sim1_2 * 100).toFixed(2)}%`);
    console.log(`  Generation 1 vs 3: ${(sim1_3 * 100).toFixed(2)}%`);
    console.log(`  Generation 2 vs 3: ${(sim2_3 * 100).toFixed(2)}%`);

    // Test with very similar texts
    console.log(`\n🧪 Testing similar vs dissimilar texts:`);
    
    const texts = [
      "chest muscle training for hypertrophy",
      "pectoral muscle exercises for growth", 
      "leg workout routine for strength",
      "shoulder training program"
    ];

    const allEmbeddings = [];
    for (const text of texts) {
      const result = await model.embedContent(text);
      allEmbeddings.push({ text, embedding: result.embedding.values });
      console.log(`  Generated embedding for: "${text}"`);
    }

    console.log(`\n📊 Cross-similarity matrix:`);
    for (let i = 0; i < texts.length; i++) {
      for (let j = i + 1; j < texts.length; j++) {
        const sim = cosineSimilarity(allEmbeddings[i].embedding, allEmbeddings[j].embedding);
        console.log(`  "${texts[i]}" vs "${texts[j]}": ${(sim * 100).toFixed(2)}%`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEmbeddingConsistency();
