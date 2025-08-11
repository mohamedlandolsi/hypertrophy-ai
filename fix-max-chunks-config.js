const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixMaxChunksConfiguration() {
  console.log('🔧 Fixing maxChunks Configuration to Prevent Timeouts...\n');
  
  try {
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });

    if (!config) {
      console.error('❌ No AI configuration found!');
      return;
    }

    console.log('🔍 Current Configuration:');
    console.log(`- Max Chunks: ${config.maxChunks || 'undefined (PROBLEM!)'}`);
    console.log(`- Similarity Threshold: ${config.similarityThreshold || 'undefined'}`);

    // Set reasonable defaults to prevent timeouts
    const updates = {
      maxChunks: 20,  // Reasonable limit to prevent timeouts
      similarityThreshold: config.similarityThreshold || 0.6  // Default if not set
    };

    await prisma.aIConfiguration.update({
      where: { id: 'singleton' },
      data: updates
    });

    console.log('\n✅ Configuration Updated:');
    console.log(`- Max Chunks: ${updates.maxChunks} (prevents loading too many chunks)`);
    console.log(`- Similarity Threshold: ${updates.similarityThreshold} (ensures quality matches)`);

    console.log('\n🎯 Expected Impact:');
    console.log('1. ✅ Reduced context size = faster Gemini API responses');
    console.log('2. ✅ Lower chance of 20-second timeout threshold');
    console.log('3. ✅ More predictable response times');
    console.log('4. ✅ Better user experience with fewer "system delay" messages');

    console.log('\n📊 Performance Comparison:');
    console.log('Before: undefined chunks (potentially 100+ chunks = slow)');
    console.log('After: 20 chunks maximum (focused, fast responses)');

    console.log('\n🧪 Next Steps:');
    console.log('1. Test with the problematic PPL x UL query');
    console.log('2. Monitor for timeout reduction');
    console.log('3. Adjust maxChunks if needed (can increase to 25-30 if stable)');

  } catch (error) {
    console.error('❌ Error updating configuration:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixMaxChunksConfiguration();
