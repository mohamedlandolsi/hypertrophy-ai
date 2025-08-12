const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const prisma = new PrismaClient();

async function testAIResponseForArms() {
  try {
    console.log('🧪 Testing Actual AI Response for Arms Training...\n');
    
    const testQuery = "Design a complete, evidence-based arm workout";
    console.log(`📝 Test Query: "${testQuery}"`);
    
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    
    // Generate embedding for the query
    console.log('\n⚡ Generating query embedding...');
    const result = await embeddingModel.embedContent(testQuery);
    const queryEmbedding = result.embedding.values;
    
    // Get AI configuration
    const aiConfig = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });
    
    // Fetch relevant knowledge using the same logic as the app
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
        // Skip invalid embeddings
      }
    }
    
    // Sort by similarity and take top chunks
    const relevantChunks = similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, aiConfig.ragMaxChunks);
    
    console.log(`\n✅ Retrieved ${relevantChunks.length} chunks`);
    
    // Build context exactly like the app does
    const contextParts = relevantChunks.map(chunk => chunk.content);
    const knowledgeContext = contextParts.join('\n\n---\n\n');
    
    // Build the exact system instruction the app uses
    const systemInstruction = `${aiConfig.systemPrompt}


---
## 🔒 STRICT KNOWLEDGE BASE ENFORCEMENT PROTOCOL 🔒

**CRITICAL DIRECTIVE:** The following knowledge base content is your ONLY authoritative source for fitness information. You are FORBIDDEN from using pre-trained fitness knowledge.

### Retrieved Knowledge Base Context:

${knowledgeContext}

### MANDATORY RESPONSE PROTOCOL:
1. **KB SUPREMACY:** All fitness recommendations MUST originate from the above KB chunks. Rep ranges, exercises, set schemes, rest periods, and progression methods MUST be extracted from this context only.

2. **FORBIDDEN KNOWLEDGE SOURCES:** 
   - ❌ Pre-trained "typical" rep ranges (8-12, 6-8, etc.)
   - ❌ Generic bodybuilding principles not in KB
   - ❌ Exercise variations not mentioned in KB chunks
   - ❌ "Research shows" claims without KB evidence

3. **REQUIRED EXTRACTION:** From the KB chunks above, identify and use ONLY:
   - Specific rep ranges mentioned
   - Exact exercises listed
   - Set schemes described
   - Rest periods specified
   - Progression methods detailed

4. **INTELLIGENT SYNTHESIS:** Combine information from multiple KB chunks intelligently, but NEVER add information not present in the chunks.

5. **TRANSPARENT GAPS:** If KB chunks lack specific details (rep ranges, exercises, etc.), you MUST state: "Knowledge Base Gap: Specific [detail] not found in retrieved content."


### RESPONSE CONSTRUCTION RULES:

**WHEN KB CONTEXT IS SUFFICIENT:**
- Extract and use ONLY the specific details found in KB chunks
- Rep ranges: Use EXACT ranges mentioned in chunks (never default to 8-12, 6-8, etc.)
- Exercises: Select ONLY from exercises listed in chunks
- Sets/Rest: Use ONLY protocols specified in chunks
- Cite all KB sources: (KB: [source name])

**WHEN KB CONTEXT HAS GAPS:**
1. **Acknowledge Gap:** "Knowledge Base Gap: [specific missing information]"
2. **Use KB Adjacent:** Apply only closely related KB principles if available
3. **No Speculation:** Never fill gaps with generic fitness knowledge
4. **Transparency:** Make clear what comes from KB vs what's missing

**QUALITY CONTROL:** Every fitness recommendation must trace to specific KB chunks. If you cannot connect advice to retrieved content, acknowledge the limitation.


---
`;

    // Test with Gemini 2.0 Flash Exp
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: aiConfig.temperature,
        topK: aiConfig.topK,
        topP: aiConfig.topP,
        maxOutputTokens: aiConfig.maxTokens,
      },
      systemInstruction: systemInstruction
    });
    
    console.log('\n🤖 Sending query to AI...');
    const result2 = await model.generateContent(testQuery);
    const response = result2.response.text();
    
    console.log('\n📝 AI Response:');
    console.log('=' * 80);
    console.log(response);
    console.log('=' * 80);
    
    // Analyze the response
    console.log('\n🔍 Response Analysis:');
    const hasSpecificRepRanges = response.includes('5-10') || response.includes('6-10');
    const hasHighFrequency = response.toLowerCase().includes('high frequency') || response.includes('2-3');
    const hasLowVolume = response.toLowerCase().includes('low volume') || response.toLowerCase().includes('keep volume low');
    const hasSpecificExercises = response.includes('preacher') || response.includes('overhead') || response.includes('hammer');
    const hasIntensityGuidance = response.includes('RIR') || response.includes('failure');
    const hasGenericAdvice = response.includes('8-12') || response.includes('12-15') || response.includes('moderate');
    
    console.log(`   Uses KB-specific rep ranges (5-10): ${hasSpecificRepRanges ? '✅' : '❌'}`);
    console.log(`   Mentions high frequency: ${hasHighFrequency ? '✅' : '❌'}`);
    console.log(`   Mentions low volume: ${hasLowVolume ? '✅' : '❌'}`);
    console.log(`   Uses specific exercises from KB: ${hasSpecificExercises ? '✅' : '❌'}`);
    console.log(`   Includes intensity guidance (RIR): ${hasIntensityGuidance ? '✅' : '❌'}`);
    console.log(`   Contains generic advice: ${hasGenericAdvice ? '⚠️' : '✅'}`);
    
    if (hasSpecificRepRanges && hasHighFrequency && hasLowVolume && !hasGenericAdvice) {
      console.log('\n✅ AI response follows KB context correctly!');
    } else {
      console.log('\n❌ AI response is not following KB context properly.');
      console.log('🔧 System prompt or enforcement may need adjustment.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testAIResponseForArms();
