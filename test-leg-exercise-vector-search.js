// Test vector search for leg exercises specifically
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testLegExerciseRetrieval() {
  try {
    console.log('🧪 Testing Vector Search for Leg Exercises...\n');
    
    const queries = [
      "leg exercises quadriceps hamstrings glutes",
      "lower body workout exercises",
      "quad hamstring glute exercises",
      "leg training exercises",
      "squat deadlift leg press leg extension",
      "Design a complete, evidence-based leg workout"
    ];
    
    for (const query of queries) {
      console.log(`\n🔍 Testing Query: "${query}"`);
      console.log('=' + '='.repeat(50));
      
      // Generate embedding
      const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
      const result = await model.embedContent(query);
      const queryEmbedding = result.embedding.values;
      
      // Test vector search with different thresholds
      for (const threshold of [0.05, 0.1, 0.2, 0.3]) {
        console.log(`\n📊 Threshold: ${threshold}`);
        
        // Use the exact same query as in the RAG system
        const vectorResults = await prisma.$queryRaw`
          SELECT 
            kc.content,
            ki.id as "knowledgeId",
            ki.title,
            1 - (kc."embeddingData"::vector <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity,
            kc."chunkIndex"
          FROM "KnowledgeChunk" kc
          JOIN "KnowledgeItem" ki ON kc."knowledgeItemId" = ki.id
          WHERE ki.status = 'READY' 
            AND kc."embeddingData" IS NOT NULL
            AND 1 - (kc."embeddingData"::vector <=> ${JSON.stringify(queryEmbedding)}::vector) >= ${threshold}
          ORDER BY kc."embeddingData"::vector <=> ${JSON.stringify(queryEmbedding)}::vector
          LIMIT 10;
        `;
        
        console.log(`   Found ${vectorResults.length} results`);
        vectorResults.forEach((result, i) => {
          const similarity = parseFloat(result.similarity);
          console.log(`   ${i + 1}. "${result.title}" (${(similarity * 100).toFixed(1)}%)`);
          
          // Check if content contains exercise names
          const hasExerciseNames = /\b(squat|deadlift|leg press|leg extension|leg curl|hip thrust|lunge|hack squat|bulgarian split|calf raise|glute bridge)\b/i.test(result.content);
          console.log(`      Has Exercise Names: ${hasExerciseNames ? '✅' : '❌'}`);
          
          if (hasExerciseNames) {
            const exercises = result.content.match(/\b(squat|deadlift|leg press|leg extension|leg curl|hip thrust|lunge|hack squat|bulgarian split|calf raise|glute bridge)[^.]*[.]/gi);
            if (exercises) {
              console.log(`      Exercises Found: ${exercises.slice(0, 2).join(', ')}...`);
            }
          }
        });
      }
    }
    
    // Also test keyword search
    console.log('\n\n🔍 Testing Keyword Search for Leg Exercises:');
    console.log('=' + '='.repeat(50));
    
    const keywordResults = await prisma.$queryRaw`
      SELECT 
        kc.content,
        ki.title,
        ts_rank(to_tsvector('english', kc.content), plainto_tsquery('english', 'leg exercise squat deadlift quadriceps hamstring glute')) as rank
      FROM "KnowledgeChunk" kc
      JOIN "KnowledgeItem" ki ON kc."knowledgeItemId" = ki.id
      WHERE ki.status = 'READY'
        AND to_tsvector('english', kc.content) @@ plainto_tsquery('english', 'leg exercise squat deadlift quadriceps hamstring glute')
      ORDER BY rank DESC
      LIMIT 10;
    `;
    
    console.log(`Found ${keywordResults.length} keyword matches`);
    keywordResults.forEach((result, i) => {
      console.log(`${i + 1}. "${result.title}" (Rank: ${parseFloat(result.rank).toFixed(3)})`);
      
      // Check for specific exercise mentions
      const exercises = result.content.match(/\b(squat|deadlift|leg press|leg extension|leg curl|hip thrust|lunge|hack squat|bulgarian split|calf raise|glute bridge)\b/gi);
      if (exercises) {
        const uniqueExercises = [...new Set(exercises.map(e => e.toLowerCase()))];
        console.log(`   Exercises: ${uniqueExercises.join(', ')}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error testing leg exercise retrieval:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLegExerciseRetrieval();
