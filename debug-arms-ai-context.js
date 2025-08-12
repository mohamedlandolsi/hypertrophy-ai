const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const prisma = new PrismaClient();

async function debugArmsAIContext() {
  try {
    console.log('🔍 Testing Arms AI Context Generation...\n');
    
    const testQuery = "Design a complete, evidence-based arm workout";
    console.log(`📝 Test Query: "${testQuery}"`);
    
    // Initialize Gemini for embeddings
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    
    // Generate embedding for the query
    console.log('\n⚡ Generating query embedding...');
    const result = await embeddingModel.embedContent(testQuery);
    const queryEmbedding = result.embedding.values;
    
    // Get AI configuration for retrieval settings
    const aiConfig = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });
    
    if (!aiConfig) {
      throw new Error('AI Configuration not found');
    }
    
    console.log('\n📊 Current RAG Settings:');
    console.log(`- Max chunks: ${aiConfig.ragMaxChunks}`);
    console.log(`- Similarity threshold: ${aiConfig.ragSimilarityThreshold}`);
    console.log(`- High relevance threshold: ${aiConfig.ragHighRelevanceThreshold}`);
    
    // Fetch relevant knowledge - first get all chunks with embeddings
    console.log('\n🔍 Fetching relevant knowledge...');
    
    const allChunks = await prisma.knowledgeChunk.findMany({
      where: {
        embeddingData: { not: null }
      },
      include: {
        knowledgeItem: {
          select: { title: true }
        }
      }
    });
    
    console.log(`📚 Found ${allChunks.length} chunks with embeddings`);
    
    // Calculate similarities and filter
    const similarities = [];
    for (const chunk of allChunks) {
      try {
        const embedding = JSON.parse(chunk.embeddingData);
        
        // Calculate cosine similarity
        let dotProduct = 0;
        let queryMagnitude = 0;
        let chunkMagnitude = 0;
        
        for (let i = 0; i < queryEmbedding.length; i++) {
          dotProduct += queryEmbedding[i] * embedding[i];
          queryMagnitude += queryEmbedding[i] * queryEmbedding[i];
          chunkMagnitude += embedding[i] * embedding[i];
        }
        
        const similarity = dotProduct / (Math.sqrt(queryMagnitude) * Math.sqrt(chunkMagnitude));
        
        if (similarity >= aiConfig.ragSimilarityThreshold) {
          similarities.push({
            id: chunk.id,
            title: chunk.knowledgeItem.title,
            content: chunk.content,
            similarity: similarity
          });
        }
      } catch (e) {
        console.log(`⚠️ Invalid embedding data for chunk ${chunk.id}`);
      }
    }
    
    // Sort by similarity and take top chunks
    const relevantChunks = similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, aiConfig.ragMaxChunks);
    
    console.log(`\n✅ Retrieved ${relevantChunks.length} chunks`);
    
    // Analyze retrieved chunks
    console.log('\n📚 Retrieved Chunks Analysis:');
    let armsSpecificCount = 0;
    let programmingInfoCount = 0;
    
    relevantChunks.forEach((chunk, index) => {
      const title = chunk.title || 'Unknown';
      const isArmsSpecific = title.toLowerCase().includes('arm') || 
                            title.toLowerCase().includes('bicep') || 
                            title.toLowerCase().includes('tricep') ||
                            title.toLowerCase().includes('elbow flexor') ||
                            title.toLowerCase().includes('forearm');
      
      const hasProgrammingInfo = chunk.content.includes('rep') || 
                               chunk.content.includes('set') ||
                               chunk.content.includes('frequency') ||
                               chunk.content.includes('volume') ||
                               chunk.content.includes('exercise');
      
      if (isArmsSpecific) armsSpecificCount++;
      if (hasProgrammingInfo) programmingInfoCount++;
      
      console.log(`\n${index + 1}. ${title}`);
      console.log(`   Arms-specific: ${isArmsSpecific ? '✅' : '❌'}`);
      console.log(`   Programming info: ${hasProgrammingInfo ? '✅' : '❌'}`);
      console.log(`   Similarity: ${chunk.similarity?.toFixed(3) || 'N/A'}`);
      console.log(`   Content preview: ${chunk.content.substring(0, 100)}...`);
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`   Arms-specific chunks: ${armsSpecificCount}/${relevantChunks.length}`);
    console.log(`   Programming info chunks: ${programmingInfoCount}/${relevantChunks.length}`);
    
    // Generate the actual context that would be sent to AI
    console.log('\n🤖 AI Context Construction:');
    const contextChunks = relevantChunks.map(chunk => chunk.content);
    const fullContext = contextChunks.join('\n\n');
    
    console.log(`\n📏 Context Length: ${fullContext.length} characters`);
    console.log(`\n📝 Full Context Preview (first 500 chars):`);
    console.log(fullContext.substring(0, 500) + '...');
    
    // Check for key programming elements in context
    console.log('\n🔍 Programming Elements in Context:');
    const hasRepRanges = fullContext.toLowerCase().includes('rep') && 
                        (fullContext.includes('5-10') || fullContext.includes('6-10') || fullContext.includes('8-12'));
    const hasFrequency = fullContext.toLowerCase().includes('frequency') || 
                        fullContext.toLowerCase().includes('2-3') || 
                        fullContext.toLowerCase().includes('high frequency');
    const hasVolumeGuidance = fullContext.toLowerCase().includes('volume') && 
                             fullContext.toLowerCase().includes('low');
    const hasExerciseSelection = fullContext.toLowerCase().includes('exercise') && 
                               (fullContext.includes('preacher') || fullContext.includes('overhead') || fullContext.includes('hammer'));
    const hasIntensityGuidance = fullContext.includes('RIR') || fullContext.includes('failure');
    
    console.log(`   Rep ranges: ${hasRepRanges ? '✅' : '❌'}`);
    console.log(`   Frequency guidance: ${hasFrequency ? '✅' : '❌'}`);
    console.log(`   Volume guidance: ${hasVolumeGuidance ? '✅' : '❌'}`);
    console.log(`   Exercise selection: ${hasExerciseSelection ? '✅' : '❌'}`);
    console.log(`   Intensity guidance: ${hasIntensityGuidance ? '✅' : '❌'}`);
    
    if (hasRepRanges && hasFrequency && hasVolumeGuidance && hasExerciseSelection) {
      console.log('\n✅ Context contains comprehensive arms programming information!');
      console.log('🔍 Issue likely in AI prompt or response generation logic.');
    } else {
      console.log('\n❌ Context missing key programming elements.');
      console.log('🔍 RAG retrieval may need optimization.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugArmsAIContext();
