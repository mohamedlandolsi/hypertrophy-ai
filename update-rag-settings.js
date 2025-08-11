const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateRAGSettings() {
  try {
    console.log('🔧 Updating RAG settings in database...');
    
    // Check current settings
    const currentConfig = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });
    
    if (currentConfig) {
      console.log('📊 Current settings:');
      console.log('- Similarity Threshold:', currentConfig.ragSimilarityThreshold);
      console.log('- Max Chunks:', currentConfig.ragMaxChunks);
      console.log('- High Relevance Threshold:', currentConfig.ragHighRelevanceThreshold);
      
      // Update to optimal settings
      const updated = await prisma.aIConfiguration.update({
        where: { id: 'singleton' },
        data: {
          ragSimilarityThreshold: 0.05,  // Broader content inclusion
          ragMaxChunks: 8,               // More comprehensive programs
          ragHighRelevanceThreshold: 0.3 // Balanced secondary filtering
        }
      });
      
      console.log('✅ Updated settings:');
      console.log('- Similarity Threshold:', updated.ragSimilarityThreshold);
      console.log('- Max Chunks:', updated.ragMaxChunks);
      console.log('- High Relevance Threshold:', updated.ragHighRelevanceThreshold);
      
      console.log('\n🎉 RAG settings updated successfully!');
      console.log('💡 The admin settings page will now show these new values.');
      
    } else {
      console.log('❌ No AI configuration found. Please set up AI configuration first through admin settings.');
    }
    
  } catch (error) {
    console.error('❌ Error updating RAG settings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateRAGSettings();
