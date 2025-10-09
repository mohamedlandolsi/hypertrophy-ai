const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createCategoryMappingFunction() {
  console.log('=== Creating Category Name to ID Mapping Function ===\n');
  
  try {
    // Get all categories
    const categories = await prisma.knowledgeCategory.findMany({
      select: { id: true, name: true }
    });
    
    console.log('Available categories:');
    categories.forEach(cat => {
      console.log(`  ${cat.name} -> ${cat.id}`);
    });
    
    // Create the mapping function code
    const mappingFunction = `
/**
 * Convert category names to category IDs for database queries
 */
async function getCategoryIdsByNames(categoryNames: string[]): Promise<string[]> {
  try {
    const categories = await prisma.knowledgeCategory.findMany({
      where: {
        name: {
          in: categoryNames
        }
      },
      select: { id: true, name: true }
    });
    
    const foundIds = categories.map(cat => cat.id);
    const foundNames = categories.map(cat => cat.name);
    const notFound = categoryNames.filter(name => !foundNames.includes(name));
    
    if (notFound.length > 0) {
      console.log(\`Warning: Categories not found: \${notFound.join(', ')}\`);
    }
    
    return foundIds;
  } catch (error) {
    console.error('Error mapping category names to IDs:', error);
    return [];
  }
}`;

    console.log('\n=== Generated Mapping Function ===');
    console.log(mappingFunction);
    
    // Test the fixed SQL query without DISTINCT ORDER BY issue
    console.log('\n=== Testing Fixed SQL Query ===');
    
    const testCategoryIds = [
      'cmedd04l9000ef4cwn1yb7g5b', // hypertrophy_programs
      'cmedd04tr000ff4cw6kfdktlc'  // hypertrophy_principles
    ];
    
    const embeddingStr = '[' + Array(768).fill(0.1).join(',') + ']'; // Mock embedding
    
    // Fixed query without DISTINCT in ORDER BY issue
    const chunks = await prisma.$queryRaw`
      SELECT 
        kc.id,
        kc.content,
        kc."chunkIndex",
        ki.id as "knowledgeId",
        ki.title,
        (1 - (kc."embeddingData"::vector <=> ${embeddingStr}::vector)) as score
      FROM "KnowledgeChunk" kc
      JOIN "KnowledgeItem" ki ON kc."knowledgeItemId" = ki.id  
      JOIN "KnowledgeItemCategory" kic ON ki.id = kic."knowledgeItemId"
      WHERE ki.status = 'READY' 
        AND kc."embeddingData" IS NOT NULL
        AND kic."knowledgeCategoryId" = ANY(${testCategoryIds})
      ORDER BY (kc."embeddingData"::vector <=> ${embeddingStr}::vector)
      LIMIT 5
    `;
    
    console.log(`✓ Fixed category-filtered search returned ${chunks.length} results:`);
    chunks.forEach((chunk, index) => {
      console.log(`  ${index + 1}. ${chunk.title} (chunk ${chunk.chunkIndex})`);
      console.log(`     Content preview: ${chunk.content.substring(0, 100)}...`);
    });
    
    // Analyze which categories actually exist and which don't
    console.log('\n=== Category Analysis for RAG System ===');
    
    const ragCategoryNames = [
      'hypertrophy_programs',    // ✓ EXISTS
      'hypertrophy_principles',  // ✓ EXISTS
      'chest',                   // ✓ EXISTS
      'back',                    // ✓ EXISTS  
      'shoulders',               // ✓ EXISTS
      'legs',                    // ✓ EXISTS
      'arms',                    // ✗ MISSING - should map to elbow_flexors + triceps
      'chest_exercises',         // ✗ MISSING - should just use 'chest'
      'back_exercises',          // ✗ MISSING - should just use 'back'
      'pushing_movements',       // ✗ MISSING - should map to chest + shoulders + triceps
      'pulling_movements',       // ✗ MISSING - should map to back + elbow_flexors
      'myths'                    // ✓ EXISTS
    ];
    
    const existingCategories = [];
    const missingCategories = [];
    
    for (const name of ragCategoryNames) {
      const exists = categories.find(c => c.name === name);
      if (exists) {
        existingCategories.push(name);
      } else {
        missingCategories.push(name);
      }
    }
    
    console.log('\n✓ Existing categories that RAG can use:');
    existingCategories.forEach(name => console.log(`  - ${name}`));
    
    console.log('\n✗ Missing categories that need mapping logic:');
    missingCategories.forEach(name => console.log(`  - ${name}`));
    
    // Create improved category mapping with fallbacks
    const improvedMapping = `
/**
 * Enhanced category mapping with fallbacks for missing categories
 */
function mapCategoryNamesWithFallbacks(categoryNames: string[]): string[] {
  const mappings: Record<string, string[]> = {
    // Direct mappings for existing categories
    'hypertrophy_programs': ['hypertrophy_programs'],
    'hypertrophy_principles': ['hypertrophy_principles'], 
    'chest': ['chest'],
    'back': ['back'],
    'shoulders': ['shoulders'],
    'legs': ['legs'],
    'myths': ['myths'],
    
    // Fallback mappings for missing categories
    'arms': ['elbow_flexors', 'triceps'],
    'chest_exercises': ['chest'],
    'back_exercises': ['back'],
    'pushing_movements': ['chest', 'shoulders', 'triceps'],
    'pulling_movements': ['back', 'elbow_flexors']
  };
  
  const result: string[] = [];
  for (const categoryName of categoryNames) {
    const mapped = mappings[categoryName];
    if (mapped) {
      result.push(...mapped);
    } else {
      // Try direct mapping if no fallback exists
      result.push(categoryName);
    }
  }
  
  return [...new Set(result)]; // Remove duplicates
}`;

    console.log('\n=== Enhanced Mapping Function ===');
    console.log(improvedMapping);
    
    console.log('\n=== Recommendations ===');
    console.log('1. Add getCategoryIdsByNames function to enhanced-rag-v2.ts');
    console.log('2. Add mapCategoryNamesWithFallbacks function to handle missing categories');
    console.log('3. Fix the SQL query by removing DISTINCT from ORDER BY');
    console.log('4. Always prioritize hypertrophy_programs and hypertrophy_principles for workout/program queries');
    console.log('5. Ensure rep ranges (5-10) come from these priority categories first');
    
  } catch (error) {
    console.error('Error creating category mapping:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createCategoryMappingFunction();
