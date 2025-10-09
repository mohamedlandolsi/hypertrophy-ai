const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function identifyCorruptedGuides() {
  try {
    console.log('🔍 Identifying Corrupted Knowledge Base Guides...\n');
    
    // Get guides that are likely to have programming information
    const programmingGuides = await prisma.knowledgeItem.findMany({
      where: {
        OR: [
          { title: { contains: 'rep', mode: 'insensitive' } },
          { title: { contains: 'set', mode: 'insensitive' } },
          { title: { contains: 'rest', mode: 'insensitive' } },
          { title: { contains: 'volume', mode: 'insensitive' } },
          { title: { contains: 'hypertrophy', mode: 'insensitive' } },
          { title: { contains: 'strength', mode: 'insensitive' } }
        ]
      },
      include: {
        chunks: true
      }
    });
    
    console.log(`📚 Found ${programmingGuides.length} programming guides to analyze:`);
    
    for (const guide of programmingGuides) {
      console.log(`\n📖 ${guide.title}`);
      console.log(`   Chunks: ${guide.chunks.length}`);
      
      if (guide.chunks.length === 0) {
        console.log(`   ❌ NO CHUNKS - Guide not processed`);
        continue;
      }
      
      // Check for content issues
      let duplicateCount = 0;
      let shortContentCount = 0;
      let validContentCount = 0;
      const contentSet = new Set();
      
      guide.chunks.forEach((chunk, i) => {
        const content = chunk.content.trim();
        
        // Check for duplicates
        if (contentSet.has(content)) {
          duplicateCount++;
        } else {
          contentSet.add(content);
        }
        
        // Check for very short content (likely incomplete)
        if (content.length < 100) {
          shortContentCount++;
        } else {
          validContentCount++;
        }
        
        // Show problematic chunks
        if (content.length < 50 || i < 3) {
          console.log(`   Chunk ${i + 1}: "${content.substring(0, 80)}..." (${content.length} chars)`);
        }
      });
      
      console.log(`   📊 Analysis:`);
      console.log(`      Valid content chunks: ${validContentCount}`);
      console.log(`      Short/incomplete chunks: ${shortContentCount}`);
      console.log(`      Duplicate chunks: ${duplicateCount}`);
      
      // Determine if guide needs repair
      const needsRepair = (
        duplicateCount > guide.chunks.length * 0.3 || // 30%+ duplicates
        shortContentCount > guide.chunks.length * 0.5 || // 50%+ short chunks
        validContentCount < 3 // Less than 3 valid chunks
      );
      
      if (needsRepair) {
        console.log(`   🔧 NEEDS REPAIR - Poor content quality`);
      } else {
        console.log(`   ✅ Content quality appears good`);
      }
    }
    
    // Check for critical missing guides
    console.log('\n🎯 Checking for Critical Programming Guides...');
    
    const criticalGuides = [
      'A Guide to Optimal Repetition Ranges for Hypertrophy',
      'A Guide to Rest Periods: How Long to Rest Between Sets for Muscle Growth',
      'A Guide to Training Volume: Why Less Is More for Muscle Growth',
      'A Guide to Programming Your Sets (Training Volume)'
    ];
    
    for (const criticalTitle of criticalGuides) {
      const guide = programmingGuides.find(g => g.title === criticalTitle);
      if (guide) {
        const hasGoodContent = guide.chunks.some(chunk => 
          chunk.content.length > 200 && 
          (chunk.content.includes('5-10') || 
           chunk.content.includes('2-5 minutes') || 
           chunk.content.includes('2 to 5') ||
           chunk.content.includes('sets'))
        );
        
        console.log(`   ${criticalTitle}: ${hasGoodContent ? '✅ Good' : '❌ Poor'} content`);
      } else {
        console.log(`   ${criticalTitle}: ❌ MISSING`);
      }
    }
    
    console.log('\n📋 Recommendations:');
    console.log('1. Re-process corrupted guides with improved chunking');
    console.log('2. Ensure source PDF/document quality is good');
    console.log('3. Verify chunking parameters (size: 512, overlap: 100)');
    console.log('4. Test with manual content verification');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

identifyCorruptedGuides();
