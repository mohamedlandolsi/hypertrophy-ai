const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugKnowledgeItem() {
  try {
    console.log('🔍 Debugging a specific knowledge item...\n');

    // Get the first knowledge item without chunks
    const item = await prisma.knowledgeItem.findFirst({
      where: {
        status: 'READY',
        type: 'TEXT'
      },
      include: {
        chunks: true
      }
    });

    if (!item) {
      console.log('❌ No knowledge items found');
      return;
    }

    console.log(`📄 Analyzing: "${item.title}"`);
    console.log(`   ID: ${item.id}`);
    console.log(`   Status: ${item.status}`);
    console.log(`   Type: ${item.type}`);
    console.log(`   Content length: ${item.content ? item.content.length : 'No content'} characters`);
    console.log(`   Chunks: ${item.chunks.length}`);
    console.log(`   Created: ${item.createdAt.toLocaleString()}`);
    console.log('');

    if (item.content) {
      console.log('📝 Content preview:');
      console.log(item.content.substring(0, 500) + '...');
      console.log('');

      // Test chunking on this content manually
      const { chunkText, cleanText } = require('./src/lib/text-chunking.js');
      
      console.log('🧹 Testing text cleaning...');
      const cleanedText = cleanText(item.content);
      console.log(`   Original length: ${item.content.length}`);
      console.log(`   Cleaned length: ${cleanedText.length}`);
      console.log(`   Cleaned preview: ${cleanedText.substring(0, 200)}...`);
      
      console.log('🧪 Testing chunking...');
      const chunks = chunkText(cleanedText, {
        chunkSize: 512,
        chunkOverlap: 100,
        preserveSentences: true,
        preserveParagraphs: true,
        minChunkSize: 50
      });
      
      console.log(`   Manual chunking test: ${chunks.length} chunks would be created`);
      if (chunks.length > 0) {
        console.log('   First chunk preview:', chunks[0].content.substring(0, 200) + '...');
      }
    } else {
      console.log('❌ No content found in knowledge item');
    }

  } catch (error) {
    console.error('❌ Error debugging knowledge item:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugKnowledgeItem();
