/**
 * Comprehensive Chest Training RAG Test
 * Tests the full RAG pipeline for chest training queries to ensure knowledge retrieval and citation
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testChestTrainingRAG() {
  try {
    console.log('🔍 Comprehensive Chest Training RAG Test\n');

    // Test queries that should find chest-related knowledge
    const testQueries = [
      'How to effectively train chest for maximum hypertrophy',
      'Best exercises for chest development',
      'Should I do presses or flys for chest',
      'Chest training exercise selection and redundancy',
      'How to train pectorals efficiently'
    ];

    // Check knowledge base coverage for chest content
    console.log('📚 Analyzing chest content in knowledge base...');
    
    const chestItems = await prisma.knowledgeItem.findMany({
      where: {
        OR: [
          { title: { contains: 'chest', mode: 'insensitive' } },
          { title: { contains: 'pectoral', mode: 'insensitive' } },
          { title: { contains: 'press', mode: 'insensitive' } },
          { title: { contains: 'fly', mode: 'insensitive' } }
        ],
        status: 'READY'
      },
      include: {
        chunks: {
          where: {
            embeddingData: { not: null }
          }
        }
      }
    });

    console.log(`Found ${chestItems.length} chest-related knowledge items:`);
    chestItems.forEach((item, index) => {
      console.log(`${index + 1}. ${item.title} (${item.chunks.length} chunks with embeddings)`);
    });

    console.log('\n🎯 Testing keyword search for each query...\n');

    for (const query of testQueries) {
      console.log(`Testing: "${query}"`);
      
      // Test keyword search
      const keywordResults = await prisma.knowledgeChunk.findMany({
        where: {
          knowledgeItem: {
            status: 'READY'
          },
          OR: [
            { content: { contains: 'chest', mode: 'insensitive' } },
            { content: { contains: 'pectoral', mode: 'insensitive' } },
            { content: { contains: 'press', mode: 'insensitive' } },
            { content: { contains: 'fly', mode: 'insensitive' } },
            { content: { contains: 'bench', mode: 'insensitive' } },
            { content: { contains: 'dip', mode: 'insensitive' } }
          ]
        },
        include: {
          knowledgeItem: {
            select: { title: true, id: true }
          }
        },
        take: 5
      });

      console.log(`  📋 Keyword search found ${keywordResults.length} relevant chunks`);
      
      if (keywordResults.length > 0) {
        keywordResults.slice(0, 3).forEach((chunk, index) => {
          console.log(`    ${index + 1}. From: "${chunk.knowledgeItem.title}"`);
          console.log(`       Preview: ${chunk.content.substring(0, 100)}...`);
        });
      } else {
        console.log('    ⚠️  No keyword matches found');
      }

      console.log('');
    }

    // Test vector embeddings existence
    console.log('🔍 Checking vector embeddings for chest content...');
    
    const chestChunksWithEmbeddings = await prisma.knowledgeChunk.count({
      where: {
        knowledgeItem: {
          status: 'READY',
          OR: [
            { title: { contains: 'chest', mode: 'insensitive' } },
            { title: { contains: 'pectoral', mode: 'insensitive' } }
          ]
        },
        embeddingData: { not: null }
      }
    });

    const totalChestChunks = await prisma.knowledgeChunk.count({
      where: {
        knowledgeItem: {
          status: 'READY',
          OR: [
            { title: { contains: 'chest', mode: 'insensitive' } },
            { title: { contains: 'pectoral', mode: 'insensitive' } }
          ]
        }
      }
    });

    console.log(`📊 Vector embeddings: ${chestChunksWithEmbeddings}/${totalChestChunks} chest chunks have embeddings`);

    if (chestChunksWithEmbeddings === 0) {
      console.log('❌ No chest content has vector embeddings - this will prevent vector search from working');
    } else if (chestChunksWithEmbeddings < totalChestChunks) {
      console.log('⚠️  Some chest content is missing embeddings - may affect retrieval completeness');
    } else {
      console.log('✅ All chest content has vector embeddings');
    }

    // Test specifically targeted chest guides
    console.log('\n📖 Analyzing specific chest training guides...');
    
    const specificChestGuides = await prisma.knowledgeItem.findMany({
      where: {
        title: {
          in: [
            'A Guide to Efficient Chest Training: Avoiding Exercise Redundancy (Part 2)',
            'Should You Do Presses or Flys for Your Chest?',
            'A Guide to Effective Chest Training'
          ]
        },
        status: 'READY'
      },
      include: {
        chunks: {
          where: { embeddingData: { not: null } },
          select: {
            id: true,
            content: true,
            chunkIndex: true
          }
        }
      }
    });

    specificChestGuides.forEach(guide => {
      console.log(`\n📄 "${guide.title}"`);
      console.log(`   Status: ${guide.status}`);
      console.log(`   Chunks with embeddings: ${guide.chunks.length}`);
      
      if (guide.chunks.length > 0) {
        console.log(`   Sample content: ${guide.chunks[0].content.substring(0, 150)}...`);
      } else {
        console.log(`   ⚠️  No chunks with embeddings found`);
      }
    });

    console.log('\n✅ Chest RAG test completed. Key findings:');
    console.log(`- ${chestItems.length} chest-related knowledge items found`);
    console.log(`- ${chestChunksWithEmbeddings}/${totalChestChunks} chunks have vector embeddings`);
    console.log(`- ${specificChestGuides.length} specific chest guides analyzed`);

    if (chestItems.length > 0 && chestChunksWithEmbeddings > 0) {
      console.log('\n🎯 RAG system should be able to retrieve chest training knowledge successfully');
      console.log('💡 Test the admin AI interface with chest training queries to verify citation behavior');
    } else {
      console.log('\n❌ RAG system may have issues retrieving chest training knowledge');
      console.log('💡 Check knowledge base content and embedding generation');
    }

  } catch (error) {
    console.error('❌ Error during chest RAG test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testChestTrainingRAG();
