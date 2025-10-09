const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function reprocessKnowledgeItems() {
  try {
    console.log('🔄 Reprocessing knowledge items without chunks...\n');

    // Get all knowledge items without chunks
    const itemsWithoutChunks = await prisma.knowledgeItem.findMany({
      where: {
        status: 'READY',
        type: 'TEXT',
        chunks: {
          none: {}
        }
      },
      take: 5 // Limit to 5 items for testing
    });

    console.log(`Found ${itemsWithoutChunks.length} items without chunks`);

    for (const item of itemsWithoutChunks) {
      console.log(`\n🔄 Processing: "${item.title}"`);
      
      if (!item.content) {
        console.log('  ❌ No content found, skipping');
        continue;
      }

      // Set status to processing
      await prisma.knowledgeItem.update({
        where: { id: item.id },
        data: { status: 'PROCESSING' }
      });

      try {
        // Make API call to reprocess this item
        const response = await fetch('http://localhost:3000/api/knowledge/reprocess', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            specificItemId: item.id
          })
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`  ✅ Reprocessed successfully: ${result.chunksCreated} chunks created`);
        } else {
          const error = await response.text();
          console.log(`  ❌ Failed to reprocess: ${error}`);
          
          // Reset status back to READY
          await prisma.knowledgeItem.update({
            where: { id: item.id },
            data: { status: 'READY' }
          });
        }
      } catch (error) {
        console.log(`  ❌ Error calling reprocess API: ${error.message}`);
        
        // Reset status back to READY
        await prisma.knowledgeItem.update({
          where: { id: item.id },
          data: { status: 'READY' }
        });
      }
    }

    console.log('\n✅ Reprocessing complete');

  } catch (error) {
    console.error('❌ Error reprocessing items:', error);
  } finally {
    await prisma.$disconnect();
  }
}

reprocessKnowledgeItems();
