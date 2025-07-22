/**
 * Debug script to analyze knowledge chunk distribution and identify dominating items
 * Run this to see if "Foundational Training" or any other item is dominating the results
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeChunkDistribution() {
  console.log('🔍 Analyzing Knowledge Chunk Distribution\n');
  
  try {
    // Query chunk distribution by knowledge item
    const chunkCounts = await prisma.knowledgeChunk.groupBy({
      by: ['knowledgeItemId'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });
    
    console.log('📊 CHUNK DISTRIBUTION BY KNOWLEDGE ITEM:');
    console.log('=' + '='.repeat(60));
    
    // Get knowledge item details for each group
    const enrichedCounts = await Promise.all(
      chunkCounts.map(async (item) => {
        const knowledgeItem = await prisma.knowledgeItem.findUnique({
          where: { id: item.knowledgeItemId },
          select: { title: true, type: true, status: true }
        });
        
        return {
          ...item,
          title: knowledgeItem?.title || 'Unknown',
          type: knowledgeItem?.type || 'Unknown',
          status: knowledgeItem?.status || 'Unknown'
        };
      })
    );
    
    // Display results
    let totalChunks = 0;
    enrichedCounts.forEach((item, index) => {
      const chunkCount = item._count.id;
      totalChunks += chunkCount;
      
      console.log(`${index + 1}. "${item.title}"`);
      console.log(`   Chunks: ${chunkCount} | Type: ${item.type} | Status: ${item.status}`);
      console.log(`   ID: ${item.knowledgeItemId}`);
      console.log('');
    });
    
    console.log(`📈 ANALYSIS SUMMARY:`);
    console.log(`   Total Knowledge Items: ${enrichedCounts.length}`);
    console.log(`   Total Chunks: ${totalChunks}`);
    
    if (enrichedCounts.length > 0) {
      const topItem = enrichedCounts[0];
      const topItemPercentage = ((topItem._count.id / totalChunks) * 100).toFixed(1);
      
      console.log(`   Largest Item: "${topItem.title}" (${topItem._count.id} chunks - ${topItemPercentage}%)`);
      
      if (topItem._count.id > totalChunks * 0.4) {
        console.log(`\n⚠️  WARNING: "${topItem.title}" dominates with ${topItemPercentage}% of all chunks!`);
        console.log(`   This could cause bias in search results.`);
        console.log(`   Consider splitting this item into smaller, focused documents.`);
      }
      
      // Check for items with excessive chunks
      const heavyItems = enrichedCounts.filter(item => item._count.id > 20);
      if (heavyItems.length > 0) {
        console.log(`\n📋 ITEMS WITH >20 CHUNKS (potential for splitting):`);
        heavyItems.forEach(item => {
          console.log(`   - "${item.title}": ${item._count.id} chunks`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error analyzing chunk distribution:', error);
  }
}

async function testBasicRetrieval() {
  console.log('\n\n🧪 Testing Basic Query Structure\n');
  
  // Get the first user for testing
  const firstUser = await prisma.user.findFirst();
  if (!firstUser) {
    console.log('❌ No users found for testing');
    return;
  }
  
  console.log(`Testing with user: ${firstUser.id}\n`);
  
  // Test basic database queries that the vector search would use
  const testQueries = [
    'chest',
    'bicep', 
    'training',
    'muscle'
  ];
  
  for (const term of testQueries) {
    console.log(`🔍 Testing database search for "${term}"`);
    console.log('-'.repeat(50));
    
    try {
      // Test title matching (what muscle-specific queries would use)
      const titleMatches = await prisma.knowledgeChunk.findMany({
        where: {
          knowledgeItem: {
            userId: firstUser.id,
            status: 'READY',
            title: {
              contains: term,
              mode: 'insensitive'
            }
          }
        },
        take: 5,
        orderBy: { chunkIndex: 'asc' },
        include: { 
          knowledgeItem: { 
            select: { title: true, id: true } 
          } 
        }
      });
      
      console.log(`   Title matches found: ${titleMatches.length}`);
      titleMatches.forEach((match, index) => {
        console.log(`   ${index + 1}. "${match.knowledgeItem.title}" (chunk ${match.chunkIndex})`);
      });
      
      // Test content matching (fallback search)
      const contentMatches = await prisma.knowledgeChunk.findMany({
        where: {
          knowledgeItem: { 
            userId: firstUser.id, 
            status: 'READY' 
          },
          content: {
            contains: term,
            mode: 'insensitive'
          }
        },
        take: 5,
        orderBy: { chunkIndex: 'asc' },
        include: { 
          knowledgeItem: { 
            select: { title: true, id: true } 
          } 
        }
      });
      
      console.log(`   Content matches found: ${contentMatches.length}`);
      
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
    
    console.log(''); // Empty line between queries
  }
}

async function main() {
  try {
    await analyzeChunkDistribution();
    await testBasicRetrieval();
    
  } catch (error) {
    console.error('❌ Script failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the analysis
main();
