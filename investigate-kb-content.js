const { PrismaClient } = require('@prisma/client');

async function investigateKnowledgeBaseContent() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Investigating Knowledge Base Content for Sets/Reps/Rest...\n');
    
    // Search for content related to sets, reps, rest periods
    const searchTerms = ['sets', 'reps', 'repetitions', 'rest', 'rest period', 'lower body', 'leg workout'];
    
    for (const term of searchTerms) {
      console.log(`🔍 Searching for: "${term}"`);
      
      const chunks = await prisma.knowledgeChunk.findMany({
        where: {
          content: {
            contains: term,
            mode: 'insensitive'
          },
          knowledgeItem: {
            status: 'READY'
          }
        },
        include: {
          knowledgeItem: true
        },
        take: 3
      });
      
      console.log(`  📊 Found ${chunks.length} chunks containing "${term}"`);
      
      chunks.forEach((chunk, i) => {
        console.log(`    ${i+1}. "${chunk.knowledgeItem.title}"`);
        // Find the specific part containing the search term
        const content = chunk.content.toLowerCase();
        const termIndex = content.indexOf(term.toLowerCase());
        if (termIndex !== -1) {
          const start = Math.max(0, termIndex - 50);
          const end = Math.min(content.length, termIndex + 100);
          const snippet = chunk.content.substring(start, end);
          console.log(`       ...${snippet}...`);
        }
      });
      
      console.log('');
    }
    
    // Specifically look for "Building a complete and powerful lower body"
    console.log('🎯 Checking specific document: "Building a complete and powerful lower body"');
    
    const lowerBodyDoc = await prisma.knowledgeItem.findFirst({
      where: {
        title: {
          contains: 'Building a complete and powerful lower body',
          mode: 'insensitive'
        }
      },
      include: {
        chunks: {
          orderBy: {
            chunkIndex: 'asc'
          }
        }
      }
    });
    
    if (lowerBodyDoc) {
      console.log(`  📄 Found document: "${lowerBodyDoc.title}"`);
      console.log(`  📊 Total chunks: ${lowerBodyDoc.chunks.length}`);
      
      // Check each chunk for sets/reps/rest information
      let foundSetsReps = false;
      lowerBodyDoc.chunks.forEach((chunk, i) => {
        const content = chunk.content.toLowerCase();
        if (content.includes('sets') || content.includes('reps') || content.includes('rest')) {
          foundSetsReps = true;
          console.log(`  ✅ Chunk ${i+1} contains sets/reps/rest info:`);
          console.log(`     ${chunk.content.substring(0, 300)}...`);
        }
      });
      
      if (!foundSetsReps) {
        console.log(`  ❌ No sets/reps/rest information found in this document`);
      }
    } else {
      console.log(`  ❌ Document not found`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

investigateKnowledgeBaseContent();
