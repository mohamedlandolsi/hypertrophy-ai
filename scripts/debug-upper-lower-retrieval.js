const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugUpperLowerRetrieval() {
  console.log('🔍 Debugging Upper/Lower Program Retrieval');
  console.log('==========================================');
  
  try {
    // Test 1: Search for upper/lower content in knowledge base
    console.log('\n📚 1. Searching for Upper/Lower content in knowledge base...');
    
    const upperLowerKeywords = [
      'upper lower',
      'upper/lower', 
      'upper-lower',
      'split',
      'program',
      'routine'
    ];
    
    for (const keyword of upperLowerKeywords) {
      console.log(`\n🔍 Searching for "${keyword}":`);
      
      // Search in knowledge item titles
      const knowledgeItems = await prisma.knowledgeItem.findMany({
        where: {
          OR: [
            {
              title: {
                contains: keyword,
                mode: 'insensitive'
              }
            },
            {
              content: {
                contains: keyword,
                mode: 'insensitive'
              }
            }
          ],
          status: 'READY'
        },
        select: {
          id: true,
          title: true,
          type: true,
          _count: {
            select: { chunks: true }
          }
        }
      });
      
      if (knowledgeItems.length > 0) {
        console.log(`   ✅ Found ${knowledgeItems.length} knowledge items:`);
        knowledgeItems.forEach(item => {
          console.log(`      - "${item.title}" (${item._count.chunks} chunks)`);
        });
      } else {
        console.log(`   ❌ No knowledge items found`);
      }
      
      // Search in chunks
      const chunks = await prisma.knowledgeChunk.findMany({
        where: {
          content: {
            contains: keyword,
            mode: 'insensitive'
          },
          knowledgeItem: {
            status: 'READY'
          }
        },
        include: {
          knowledgeItem: {
            select: {
              title: true
            }
          }
        },
        take: 5
      });
      
      if (chunks.length > 0) {
        console.log(`   ✅ Found ${chunks.length} chunks containing "${keyword}"`);
        chunks.slice(0, 3).forEach((chunk, index) => {
          const preview = chunk.content.substring(0, 100).replace(/\n/g, ' ');
          console.log(`      ${index + 1}. From "${chunk.knowledgeItem.title}": ${preview}...`);
        });
      } else {
        console.log(`   ❌ No chunks found containing "${keyword}"`);
      }
    }
    
    // Test 2: Test vector search simulation
    console.log('\n🧮 2. Testing Vector Search Simulation...');
    
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    
    if (!process.env.GEMINI_API_KEY) {
      console.log('❌ GEMINI_API_KEY not found, skipping vector search test');
    } else {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      
      try {
        const testQuery = "complete upper lower program";
        console.log(`🔍 Testing query: "${testQuery}"`);
        
        // Generate embedding for test query
        const embeddingResult = await genAI.getGenerativeModel({ model: "text-embedding-004" })
          .embedContent(testQuery);
        const queryEmbedding = embeddingResult.embedding.values;
        
        console.log(`✅ Generated embedding (${queryEmbedding.length} dimensions)`);
        
        // Test pgvector search
        const embeddingStr = `[${queryEmbedding.join(',')}]`;
        
        const vectorResults = await prisma.$queryRaw`
          SELECT
            kc.content,
            ki.id as "knowledgeId", 
            ki.title,
            1 - (kc."embeddingData"::vector <=> ${embeddingStr}::vector) as similarity,
            kc."chunkIndex"
          FROM "KnowledgeChunk" kc
          JOIN "KnowledgeItem" ki ON kc."knowledgeItemId" = ki.id  
          WHERE ki.status = 'READY' 
            AND kc."embeddingData" IS NOT NULL
          ORDER BY kc."embeddingData"::vector <=> ${embeddingStr}::vector
          LIMIT 10
        `;
        
        console.log(`✅ Vector search returned ${vectorResults.length} results`);
        
        if (vectorResults.length > 0) {
          console.log(`\n📊 Top similarity scores:`);
          vectorResults.slice(0, 5).forEach((result, index) => {
            const similarity = parseFloat(result.similarity).toFixed(4);
            const preview = result.content.substring(0, 80).replace(/\n/g, ' ');
            console.log(`   ${index + 1}. Score: ${similarity} - "${result.title}": ${preview}...`);
          });
          
          // Check if any results are above threshold
          const highQualityResults = vectorResults.filter(r => parseFloat(r.similarity) >= 0.4);
          console.log(`\n🎯 Results above 0.4 threshold: ${highQualityResults.length}`);
          
          if (highQualityResults.length === 0) {
            console.log(`⚠️  No results meet the 0.4 similarity threshold!`);
            console.log(`   Highest score: ${parseFloat(vectorResults[0].similarity).toFixed(4)}`);
            console.log(`   This explains why the AI says "insufficient information"`);
          }
        }
        
      } catch (error) {
        console.error('❌ Vector search test failed:', error.message);
      }
    }
    
    // Test 3: Check specific upper/lower knowledge items
    console.log('\n📋 3. Detailed Upper/Lower Content Analysis...');
    
    const potentialItems = await prisma.knowledgeItem.findMany({
      where: {
        OR: [
          { title: { contains: 'upper', mode: 'insensitive' } },
          { title: { contains: 'lower', mode: 'insensitive' } },
          { title: { contains: 'split', mode: 'insensitive' } },
          { title: { contains: 'program', mode: 'insensitive' } },
          { title: { contains: 'routine', mode: 'insensitive' } }
        ],
        status: 'READY'
      },
      select: {
        id: true,
        title: true,
        type: true,
        createdAt: true,
        _count: {
          select: { chunks: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (potentialItems.length > 0) {
      console.log(`✅ Found ${potentialItems.length} potentially relevant items:`);
      
      for (const item of potentialItems.slice(0, 10)) {
        console.log(`\n📄 "${item.title}"`);
        console.log(`   - Type: ${item.type}`);
        console.log(`   - Chunks: ${item._count.chunks}`);
        console.log(`   - Created: ${item.createdAt.toISOString().split('T')[0]}`);
        
        // Get sample content from first chunk
        const sampleChunk = await prisma.knowledgeChunk.findFirst({
          where: {
            knowledgeItemId: item.id
          },
          select: {
            content: true
          }
        });
        
        if (sampleChunk) {
          const preview = sampleChunk.content.substring(0, 200).replace(/\n/g, ' ');
          console.log(`   - Preview: ${preview}...`);
        }
      }
    } else {
      console.log(`❌ No items found with upper/lower related titles`);
    }
    
    // Test 4: Recommendations
    console.log('\n💡 4. Recommendations...');
    
    if (potentialItems.length === 0) {
      console.log('🔧 ISSUE: No upper/lower content found in knowledge base');
      console.log('   - Check if upper/lower guides were successfully uploaded');
      console.log('   - Verify knowledge items have status "READY"');
      console.log('   - Re-upload upper/lower content if needed');
    } else {
      console.log('🔧 POSSIBLE ISSUES:');
      console.log('   - Upper/lower content exists but embeddings may not capture the relationship');
      console.log('   - Query terms might not match the content structure');
      console.log('   - Similarity thresholds might be too strict');
      
      console.log('\n🎯 SOLUTIONS TO TRY:');
      console.log('   1. Lower the similarity threshold temporarily (0.3 instead of 0.4)');
      console.log('   2. Use more specific queries like "upper body workout" or "lower body routine"');
      console.log('   3. Check if the content uses different terminology');
      console.log('   4. Verify embeddings were generated for these items');
    }
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugUpperLowerRetrieval();
