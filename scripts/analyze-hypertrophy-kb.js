const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCategoryContent() {
  console.log('🔍 Checking which categories have content...\n');
  
  try {
    const categories = await prisma.knowledgeCategory.findMany({
      include: {
        KnowledgeItemCategory: {
          include: {
            KnowledgeItem: {
              select: {
                id: true,
                title: true,
                status: true
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    categories.forEach(category => {
      console.log(`📂 ${category.name} (${category.id}): ${category.KnowledgeItemCategory.length} items`);
      
      if (category.KnowledgeItemCategory.length > 0) {
        category.KnowledgeItemCategory.forEach((kic, index) => {
          console.log(`   ${index + 1}. ${kic.KnowledgeItem.title} (${kic.KnowledgeItem.status})`);
        });
      }
      console.log('');
    });

    // Now search for rep range content in all knowledge items
    console.log('🔍 Searching for rep range information in all knowledge base...\n');
    
    const allItems = await prisma.knowledgeItem.findMany({
      include: {
        chunks: {
          select: {
            content: true,
            chunkIndex: true
          },
          orderBy: {
            chunkIndex: 'asc'
          }
        }
      }
    });

    allItems.forEach(item => {
      const repRangeChunks = item.chunks.filter(chunk => 
        chunk.content.toLowerCase().includes('5-10') ||
        chunk.content.toLowerCase().includes('8-12') ||
        (chunk.content.toLowerCase().includes('rep') && 
         (chunk.content.toLowerCase().includes('range') || chunk.content.toLowerCase().includes('repetition')))
      );
      
      if (repRangeChunks.length > 0) {
        console.log(`� ${item.title}:`);
        repRangeChunks.forEach(chunk => {
          // Find the specific rep range mention
          const content = chunk.content;
          const repMentions = content.match(/(\d+[-–]\d+\s*rep|\d+[-–]\d+\s*repetition|5-10|8-12)/gi);
          if (repMentions) {
            console.log(`   📊 Chunk ${chunk.chunkIndex}: Found "${repMentions.join(', ')}"`);
            // Show context around the rep range
            repMentions.forEach(mention => {
              const index = content.toLowerCase().indexOf(mention.toLowerCase());
              if (index !== -1) {
                const start = Math.max(0, index - 100);
                const end = Math.min(content.length, index + mention.length + 100);
                const context = content.substring(start, end);
                console.log(`      Context: ...${context}...`);
              }
            });
          }
        });
        console.log('');
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCategoryContent().catch(console.error);
