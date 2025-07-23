const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testOptimizedRAG() {
  console.log('🧪 Testing Optimized RAG System...\n');

  try {
    // 1. Check if we have any knowledge with embeddings
    const totalChunks = await prisma.knowledgeChunk.count({
      where: {
        embeddingData: { not: null }
      }
    });

    console.log(`📊 Total chunks with embeddings: ${totalChunks}`);

    if (totalChunks === 0) {
      console.log('❌ No chunks with embeddings found. Please add some knowledge first.');
      return;
    }

    // 2. Sample a few chunks to check title prefixing
    const sampleChunks = await prisma.knowledgeChunk.findMany({
      where: {
        embeddingData: { not: null }
      },
      include: {
        knowledgeItem: {
          select: {
            title: true
          }
        }
      },
      take: 3
    });

    console.log('\n🔍 Sample Chunks (checking for title context):');
    sampleChunks.forEach((chunk, i) => {
      console.log(`\n--- Chunk ${i + 1} ---`);
      console.log(`Title: ${chunk.knowledgeItem.title}`);
      console.log(`Content start: ${chunk.content.substring(0, 100)}...`);
      
      // Check if content starts with title (indicating prefixing worked)
      const startsWithTitle = chunk.content.startsWith(chunk.knowledgeItem.title);
      console.log(`Starts with title: ${startsWithTitle ? '✅' : '❌'}`);
    });

    // 3. Test vector search with sample query
    console.log('\n🔎 Testing Vector Search with Sample Query...');
    
    const testQuery = "chest exercises";
    
    // Simulate the RAG process
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: testQuery,
        userId: '1' // Use admin user ID to enable RAG
      })
    });

    if (response.ok) {
      const reader = response.body?.getReader();
      let fullResponse = '';
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  fullResponse += data.content;
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }
      
      console.log(`✅ RAG Response Length: ${fullResponse.length} characters`);
      console.log(`Response preview: ${fullResponse.substring(0, 200)}...`);
      
      // Check for citations
      const hasCitations = fullResponse.includes('Source:') || fullResponse.includes('Reference:');
      console.log(`Citations present: ${hasCitations ? '✅' : '❌'}`);
      
    } else {
      console.log(`❌ API request failed: ${response.status}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testOptimizedRAG().catch(console.error);
