const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeKnowledgeBase() {
  try {
    console.log('🔍 Analyzing Knowledge Base Structure...');
    
    // Get all categories with their items and chunks
    const categories = await prisma.knowledgeCategory.findMany({
      include: {
        KnowledgeItemCategory: {
          include: {
            KnowledgeItem: {
              include: {
                chunks: true
              }
            }
          }
        }
      }
    });

    // Also get ready items count for filtering
    const readyItems = await prisma.knowledgeItem.findMany({
      where: { status: 'READY' }
    });

    console.log('\n📚 Knowledge Categories Analysis:');
    console.log('=' + '='.repeat(60));
    
    categories.forEach(cat => {
      const allKnowledgeItems = cat.KnowledgeItemCategory.map(kic => kic.KnowledgeItem);
      // Filter for ready items
      const readyKnowledgeItems = allKnowledgeItems.filter(item => item.status === 'READY');
      const itemCount = readyKnowledgeItems.length;
      const chunkCount = readyKnowledgeItems.reduce((sum, item) => sum + item.chunks.length, 0);
      console.log(`📁 ${cat.name} (${cat.id})`);
      console.log(`   Items: ${itemCount}, Chunks: ${chunkCount}`);
      console.log(`   Description: ${cat.description || 'No description'}`);
      
      // Show some item titles for key categories
      if (['hypertrophy_programs', 'hypertrophy_programs_review', 'myths', 'hypertrophy_principles'].includes(cat.name)) {
        console.log('   Sample Items:');
        readyKnowledgeItems.slice(0, 3).forEach(item => {
          console.log(`     - ${item.title}`);
        });
      }
      console.log('');
    });
    
    // Priority categories check
    console.log('🎯 Priority Categories for Requirements:');
    const priorityCategories = ['hypertrophy_programs', 'hypertrophy_programs_review', 'myths'];
    priorityCategories.forEach(catName => {
      const cat = categories.find(c => c.name === catName);
      if (cat) {
        const allKnowledgeItems = cat.KnowledgeItemCategory.map(kic => kic.KnowledgeItem);
        const readyKnowledgeItems = allKnowledgeItems.filter(item => item.status === 'READY');
        const chunkCount = readyKnowledgeItems.reduce((sum, item) => sum + item.chunks.length, 0);
        console.log(`✅ ${catName}: ${readyKnowledgeItems.length} items, ${chunkCount} chunks`);
      } else {
        console.log(`❌ ${catName}: Not found`);
      }
    });
    
    // Total stats
    console.log('\n📊 Overall Statistics:');
    console.log(`- Total Categories: ${categories.length}`);
    console.log(`- Total Ready Items: ${readyItems.length}`);
    
    const totalChunks = await prisma.knowledgeChunk.count({
      where: {
        knowledgeItem: {
          status: 'READY'
        }
      }
    });
    console.log(`- Total Chunks: ${totalChunks}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeKnowledgeBase();
