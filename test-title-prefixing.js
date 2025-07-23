const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testTitlePrefixing() {
  console.log('🧪 Testing Title Prefixing in New Knowledge...\n');

  try {
    // Create a simple test knowledge item via API
    const testKnowledge = {
      title: "Test Knowledge for Title Prefixing",
      content: "This is test content about push-ups. Push-ups are a great exercise for chest, shoulders, and triceps."
    };

    console.log('📝 Creating new knowledge item to test title prefixing...');
    
    const response = await fetch('http://localhost:3000/api/knowledge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testKnowledge)
    });

    if (!response.ok) {
      console.log(`❌ Failed to create knowledge: ${response.status}`);
      const errorText = await response.text();
      console.log('Error:', errorText);
      return;
    }

    const result = await response.json();
    console.log(`✅ Created knowledge item: ${result.title}`);
    console.log(`   - Chunks created: ${result.chunksProcessed || 'Unknown'}`);

    // Wait a moment for processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check the chunks for title prefixing
    const chunks = await prisma.knowledgeChunk.findMany({
      where: {
        knowledgeItemId: result.id
      },
      include: {
        knowledgeItem: {
          select: {
            title: true
          }
        }
      }
    });

    console.log(`\n📊 Checking ${chunks.length} chunks for title prefixing:`);
    
    let titlePrefixedCount = 0;
    chunks.forEach((chunk, i) => {
      const startsWithTitle = chunk.content.startsWith(chunk.knowledgeItem.title);
      if (startsWithTitle) titlePrefixedCount++;
      
      console.log(`\n--- Chunk ${i + 1} ---`);
      console.log(`Title: ${chunk.knowledgeItem.title}`);
      console.log(`Starts with title: ${startsWithTitle ? '✅' : '❌'}`);
      console.log(`Content preview: ${chunk.content.substring(0, 100)}...`);
      console.log(`Has embedding: ${chunk.embeddingData ? '✅' : '❌'}`);
    });

    console.log(`\n📈 Summary:`);
    console.log(`- Total chunks: ${chunks.length}`);
    console.log(`- Title prefixed: ${titlePrefixedCount}`);
    console.log(`- Success rate: ${((titlePrefixedCount / chunks.length) * 100).toFixed(1)}%`);

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await prisma.knowledgeChunk.deleteMany({
      where: { knowledgeItemId: result.id }
    });
    await prisma.knowledgeItem.delete({
      where: { id: result.id }
    });
    console.log('✅ Test data cleaned up');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTitlePrefixing().catch(console.error);
