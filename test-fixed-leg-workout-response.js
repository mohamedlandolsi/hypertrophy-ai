const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const prisma = new PrismaClient();

async function testFixedLegWorkoutResponse() {
  try {
    console.log('🧪 Testing Fixed Leg Workout AI Response...\n');
    
    const testQuery = "Design a complete, evidence-based leg workout";
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
    
    console.log('\n📊 RAG Configuration:');
    console.log(`- Max chunks: ${aiConfig.ragMaxChunks}`);
    console.log(`- Similarity threshold: ${aiConfig.ragSimilarityThreshold}`);
    
    // Simulate the comprehensive multi-query RAG exactly like gemini.ts
    console.log('\n🏋️ Executing comprehensive workout programming retrieval...');
    
    // Step 1: Primary search (exercise selection)
    const primaryChunkTarget = Math.floor(aiConfig.ragMaxChunks * 0.6); // 60%
    
    const allChunks = await prisma.knowledgeChunk.findMany({
      where: { embeddingData: { not: null } },
      include: { knowledgeItem: { select: { title: true } } }
    });
    
    const primarySimilarities = [];
    for (const chunk of allChunks) {
      try {
        const embedding = JSON.parse(chunk.embeddingData);
        
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
          primarySimilarities.push({
            id: chunk.id,
            knowledgeId: chunk.knowledgeItemId,
            chunkIndex: chunk.chunkIndex,
            title: chunk.knowledgeItem.title,
            content: chunk.content,
            similarity: similarity
          });
        }
      } catch (e) {
        // Skip invalid embeddings
      }
    }
    
    const primaryResults = primarySimilarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, primaryChunkTarget);
    
    console.log(`✅ Primary results: ${primaryResults.length} chunks`);
    
    // Step 2: Secondary searches (programming parameters)
    const programmingQueries = [
      'sets reps repetitions hypertrophy',
      'rest periods between sets muscle growth',
      'training volume muscle building'
    ];
    
    let allSecondaryResults = [];
    
    for (const progQuery of programmingQueries) {
      const progResult = await embeddingModel.embedContent(progQuery);
      const progEmbedding = progResult.embedding.values;
      
      const progSimilarities = [];
      for (const chunk of allChunks) {
        try {
          const embedding = JSON.parse(chunk.embeddingData);
          
          let dotProduct = 0;
          let queryMagnitude = 0;
          let chunkMagnitude = 0;
          
          for (let i = 0; i < progEmbedding.length; i++) {
            dotProduct += progEmbedding[i] * embedding[i];
            queryMagnitude += progEmbedding[i] * progEmbedding[i];
            chunkMagnitude += embedding[i] * embedding[i];
          }
          
          const similarity = dotProduct / (Math.sqrt(queryMagnitude) * Math.sqrt(chunkMagnitude));
          const relaxedThreshold = Math.max(0.25, aiConfig.ragSimilarityThreshold - 0.1);
          
          if (similarity >= relaxedThreshold) {
            progSimilarities.push({
              id: chunk.id,
              knowledgeId: chunk.knowledgeItemId,
              chunkIndex: chunk.chunkIndex,
              title: chunk.knowledgeItem.title,
              content: chunk.content,
              similarity: similarity
            });
          }
        } catch (e) {
          // Skip invalid embeddings
        }
      }
      
      const progResults = progSimilarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 2);
      
      allSecondaryResults = [...allSecondaryResults, ...progResults];
    }
    
    console.log(`✅ Secondary results: ${allSecondaryResults.length} chunks`);
    
    // Step 3: Combine and deduplicate
    const combinedResults = [...primaryResults, ...allSecondaryResults];
    const uniqueResults = new Map();
    
    combinedResults.forEach(chunk => {
      const key = `${chunk.knowledgeId}-${chunk.chunkIndex}`;
      if (!uniqueResults.has(key)) {
        uniqueResults.set(key, chunk);
      }
    });
    
    const finalResults = Array.from(uniqueResults.values())
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, aiConfig.ragMaxChunks);
    
    console.log(`✅ Final comprehensive results: ${finalResults.length} chunks`);
    
    // Build context exactly like the app does
    const contextParts = finalResults.map(chunk => chunk.content);
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
    
    console.log('\n🤖 Sending query to AI with cleaned context...');
    const result2 = await model.generateContent(testQuery);
    const response = result2.response.text();
    
    console.log('\n📝 AI Response:');
    console.log('=' * 80);
    console.log(response);
    console.log('=' * 80);
    
    // Analyze the response for improvement
    console.log('\n🔍 Response Analysis:');
    const hasSpecificRepRanges = response.includes('5-10');
    const hasSpecificSets = response.includes('2-5 sets') || response.includes('3-4 sets') || response.includes('2 to 5') || response.includes('2-3 sets');
    const hasSpecificRest = response.includes('2-5 minutes') || response.includes('2 to 5 minutes') || response.includes('2 minutes') || response.includes('3 minutes');
    const hasLegExercises = response.includes('squat') || response.includes('deadlift') || response.includes('leg press') || response.includes('leg curl');
    const hasAccessoryExercises = response.includes('leg extension') || response.includes('leg curl') || response.includes('calf') || response.includes('isolation');
    const hasKnowledgeGaps = response.includes('Knowledge Base Gap');
    const hasCompleteWorkout = hasSpecificRepRanges && hasSpecificSets && hasSpecificRest && hasLegExercises;
    
    console.log(`   Uses KB-specific rep ranges (5-10): ${hasSpecificRepRanges ? '✅' : '❌'}`);
    console.log(`   Mentions specific set ranges: ${hasSpecificSets ? '✅' : '❌'}`);
    console.log(`   Mentions specific rest periods: ${hasSpecificRest ? '✅' : '❌'}`);
    console.log(`   Includes leg exercises: ${hasLegExercises ? '✅' : '❌'}`);
    console.log(`   Includes accessory exercises: ${hasAccessoryExercises ? '✅' : '❌'}`);
    console.log(`   Has knowledge gaps: ${hasKnowledgeGaps ? '⚠️' : '✅'}`);
    console.log(`   Complete workout provided: ${hasCompleteWorkout ? '✅' : '❌'}`);
    
    if (hasCompleteWorkout && !hasKnowledgeGaps) {
      console.log('\n🎉 SUCCESS: AI now provides complete, evidence-based leg workouts!');
      console.log('✅ The corruption cleanup fixed the knowledge base retrieval issue');
    } else if (hasCompleteWorkout && hasKnowledgeGaps) {
      console.log('\n🎯 PARTIAL SUCCESS: AI provides most workout details but acknowledges some gaps');
      console.log('✅ This is transparent and honest - much better than generic advice');
    } else {
      console.log('\n❌ STILL INCOMPLETE: Additional fixes may be needed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testFixedLegWorkoutResponse();
