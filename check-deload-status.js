const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDeloadArticleStatus() {
  console.log('🔍 Checking Deload Article Status...');
  
  try {
    // Find the deload article
    const deloadArticle = await prisma.knowledgeItem.findFirst({
      where: {
        title: {
          contains: 'deload',
          mode: 'insensitive'
        }
      },
      include: {
        chunks: {
          select: {
            id: true,
            embeddingData: true
          }
        }
      }
    });
    
    if (!deloadArticle) {
      console.log('❌ Deload article not found');
      return;
    }
    
    console.log(`📄 Article: ${deloadArticle.title}`);
    console.log(`📊 Status: ${deloadArticle.status}`);
    console.log(`📚 Total chunks: ${deloadArticle.chunks.length}`);
    console.log(`🔢 Chunks with embeddings: ${deloadArticle.chunks.filter(c => c.embeddingData).length}`);
    
    if (deloadArticle.status !== 'READY') {
      console.log('🚨 FOUND THE ISSUE! The deload article status is not READY');
      console.log('This explains why the RAG system is not finding the deload content.');
      
      // Fix the status
      console.log('\n🔧 Fixing the deload article status...');
      await prisma.knowledgeItem.update({
        where: { id: deloadArticle.id },
        data: { status: 'READY' }
      });
      
      console.log('✅ Updated deload article status to READY');
      
      // Test immediately
      console.log('\n🧪 Testing RAG system after fix...');
      
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: "What is a deload week?",
          isGuest: true,
          conversationId: null
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        console.log('\n🎯 AI Response After Fix:');
        console.log('=====================================');
        console.log(result.content.substring(0, 300) + '...');
        console.log('=====================================');
        console.log(`📚 Citations: ${result.citations?.length || 0}`);
        
        // Check if we now get deload article citations
        const hasDeloadCitation = result.citations?.some(c => 
          c.title?.toLowerCase().includes('deload')
        );
        
        console.log(`🎯 Contains deload article citation: ${hasDeloadCitation ? '✅ FIXED!' : '❌ Still not working'}`);
        
      } else {
        console.log(`❌ Test request failed: ${response.status}`);
      }
      
    } else {
      console.log('✅ Article status is READY - this is not the issue');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDeloadArticleStatus();
