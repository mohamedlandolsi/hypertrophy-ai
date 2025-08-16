const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCategoryMapping() {
  console.log('=== Testing Category Name to ID Mapping ===\n');
  
  try {
    // Get all categories
    const categories = await prisma.knowledgeCategory.findMany({
      select: { id: true, name: true }
    });
    
    console.log('Available categories:');
    categories.forEach(cat => {
      console.log(`  ${cat.name} -> ${cat.id}`);
    });
    
    // Test category name mappings that the RAG system uses
    const testCategoryNames = [
      'hypertrophy_programs',
      'hypertrophy_principles', 
      'chest',
      'back',
      'shoulders',
      'arms',
      'legs',
      'chest_exercises',
      'back_exercises',
      'pushing_movements',
      'pulling_movements',
      'myths'
    ];
    
    console.log('\n=== Category Name to ID Mapping Test ===');
    
    const categoryMap = new Map();
    for (const categoryName of testCategoryNames) {
      const category = categories.find(c => c.name === categoryName);
      if (category) {
        categoryMap.set(categoryName, category.id);
        console.log(`✓ ${categoryName} -> ${category.id}`);
      } else {
        console.log(`✗ ${categoryName} -> NOT FOUND`);
      }
    }
    
    console.log('\n=== Testing Vector Search with Category Filtering ===');
    
    // Test a query that should prioritize hypertrophy_programs
    const testQuery = "Create a 4-day workout program for muscle building";
    const relevantCategories = ['hypertrophy_programs', 'hypertrophy_principles'];
    const categoryIds = relevantCategories
      .map(name => categoryMap.get(name))
      .filter(id => id !== undefined);
    
    console.log(`Query: "${testQuery}"`);
    console.log(`Relevant categories: ${relevantCategories.join(', ')}`);
    console.log(`Mapped to IDs: ${categoryIds.join(', ')}`);
    
    if (categoryIds.length === 0) {
      console.log('❌ No valid category IDs found! Vector search will not be filtered.');
      return;
    }
    
    // Test the vector search query with category filtering
    const embeddingStr = '[' + Array(768).fill(0.1).join(',') + ']'; // Mock embedding
    
    const chunks = await prisma.$queryRaw`
      SELECT DISTINCT
        kc.id,
        kc.content,
        kc."chunkIndex",
        ki.id as "knowledgeId",
        ki.title,
        1 - (kc."embeddingData"::vector <=> ${embeddingStr}::vector) as score
      FROM "KnowledgeChunk" kc
      JOIN "KnowledgeItem" ki ON kc."knowledgeItemId" = ki.id  
      JOIN "KnowledgeItemCategory" kic ON ki.id = kic."knowledgeItemId"
      WHERE ki.status = 'READY' 
        AND kc."embeddingData" IS NOT NULL
        AND kic."knowledgeCategoryId" = ANY(${categoryIds})
      ORDER BY kc."embeddingData"::vector <=> ${embeddingStr}::vector
      LIMIT 5
    `;
    
    console.log(`\n✓ Category-filtered search returned ${chunks.length} results:`);
    chunks.forEach((chunk, index) => {
      console.log(`  ${index + 1}. ${chunk.title} (chunk ${chunk.chunkIndex})`);
      console.log(`     Content preview: ${chunk.content.substring(0, 100)}...`);
    });
    
    // Test search without category filtering for comparison
    const chunksWithoutFilter = await prisma.$queryRaw`
      SELECT
        kc.id,
        kc.content,
        kc."chunkIndex",
        ki.id as "knowledgeId",
        ki.title,
        1 - (kc."embeddingData"::vector <=> ${embeddingStr}::vector) as score
      FROM "KnowledgeChunk" kc
      JOIN "KnowledgeItem" ki ON kc."knowledgeItemId" = ki.id  
      WHERE ki.status = 'READY' 
        AND kc."embeddingData" IS NOT NULL
      ORDER BY kc."embeddingData"::vector <=> ${embeddingStr}::vector
      LIMIT 5
    `;
    
    console.log(`\n📊 Unfiltered search returned ${chunksWithoutFilter.length} results:`);
    chunksWithoutFilter.forEach((chunk, index) => {
      console.log(`  ${index + 1}. ${chunk.title} (chunk ${chunk.chunkIndex})`);
    });
    
    console.log('\n=== Analysis ===');
    console.log(`Category filtering is ${chunks.length > 0 ? 'working' : 'NOT working'}`);
    console.log(`The RAG system needs a function to map category names to IDs`);
    
  } catch (error) {
    console.error('Error testing category mapping:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCategoryMapping();
