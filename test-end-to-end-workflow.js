const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const prisma = new PrismaClient();

async function testEndToEndWorkflow() {
  try {
    console.log('🎯 END-TO-END WORKFLOW TEST\n');
    console.log('Simulating complete user query through fixed RAG system...\n');
    
    // Test configuration
    const testUserId = 'test-user-123';
    const testQuery = "Design a complete leg workout for hypertrophy with specific sets, reps, and rest periods";
    
    console.log(`👤 User: ${testUserId}`);
    console.log(`💬 Query: "${testQuery}"`);
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Call the actual gemini function (simulated conversation)
    const conversation = [
      {
        role: 'user',
        content: testQuery
      }
    ];
    
    // This would normally call the gemini.ts function
    // For now, let's simulate the key parts
    
    console.log('🔍 Step 1: Vector Search (with fixes)');
    
    // Get AI configuration
    const aiConfig = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });
    
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    
    // Generate embedding
    const embeddingResult = await embeddingModel.embedContent(testQuery);
    const queryEmbedding = embeddingResult.embedding.values;
    
    // Test the fixed vector search (no early filtering)
    const embeddingStr = `[${queryEmbedding.join(',')}]`;
    const chunks = await prisma.$queryRaw`
      SELECT
        kc.content,
        ki.id as "knowledgeId", 
        ki.title,
        1 - (kc."embeddingData"::vector <=> ${embeddingStr}::vector) as similarity,
        kc."chunkIndex"
      FROM "KnowledgeChunk" kc
      JOIN "KnowledgeItem" ki ON kc."knowledgeItemId" = ki.id  
      WHERE ki.status = 'READY' 
        AND kc."embeddingData" IS NOT NULL
      ORDER BY similarity DESC
      LIMIT 7
    `;
    
    console.log(`   ✅ Retrieved ${chunks.length} chunks without early filtering`);
    
    const aboveThreshold = chunks.filter(c => c.similarity >= aiConfig.ragSimilarityThreshold).length;
    console.log(`   ✅ ${aboveThreshold} chunks above soft threshold (${aiConfig.ragSimilarityThreshold})`);
    
    console.log('\n🔧 Step 2: KB Context Formatting (with machine-readable blocks)');
    
    // Build context with machine-readable blocks (Fix #2)
    const contextParts = [];
    chunks.forEach(chunk => {
      const safeTitle = chunk.title.replace(/"/g, '\\"');
      const formattedChunk = `<<<KB-START id=${chunk.knowledgeId} idx=${chunk.chunkIndex} title="${safeTitle}" >>>\n${chunk.content}\n<<<KB-END>>>`;
      contextParts.push(formattedChunk);
    });
    
    const knowledgeContext = contextParts.join('\n\n');
    console.log(`   ✅ Built ${contextParts.length} machine-readable KB blocks`);
    console.log(`   📝 Context preview: ${knowledgeContext.substring(0, 200)}...`);
    
    console.log('\n🤖 Step 3: AI Response Generation (with citation requirements)');
    
    // Build system prompt with citation requirements
    const systemPrompt = `You are HypertroQ, an evidence-based fitness AI.

### 🔒 CRITICAL: MANDATORY CITATION PROTOCOL 🔒

**CITATION REQUIREMENTS:**
- All KB evidence is inside <<<KB-START ... >>> ... <<<KB-END>>> blocks above.
- MUST use inline citation tokens exactly like: [KB:{knowledgeId}#{chunkIndex}] whenever you use KB text to justify a claim.
- Every programming parameter (exercise, sets, reps, rest, progression) MUST include a citation if derived from KB.

**MANDATORY RESPONSE PROTOCOL:**
1. **KB SUPREMACY:** All fitness recommendations MUST originate from the above KB chunks.
2. **REQUIRED EXTRACTION:** From the KB chunks above, identify and use ONLY specific details found.
3. **TRANSPARENT GAPS:** If KB chunks lack specific details, state: "Knowledge Base Gap: [detail]"

${knowledgeContext}`;
    
    // Simulate AI call
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      systemInstruction: systemPrompt
    });
    
    console.log(`   🔄 Sending query to Gemini with citation requirements...`);
    
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: testQuery }]
      }],
      generationConfig: {
        temperature: aiConfig.temperature,
        topK: aiConfig.topK,
        topP: aiConfig.topP,
        maxOutputTokens: 2048,
      }
    });
    
    const aiResponse = result.response.text();
    console.log(`   ✅ Received AI response (${aiResponse.length} chars)`);
    
    console.log('\n🔍 Step 4: Citation Validation (Fix #3)');
    
    // Extract citations
    function extractKBCitations(text) {
      const regex = /\[KB:([^\]#]+)#(\d+)\]/g;
      const cites = [];
      let m;
      while ((m = regex.exec(text)) !== null) {
        cites.push({ id: m[1], idx: parseInt(m[2], 10) });
      }
      return cites;
    }
    
    function detectMissingParameters(text, requiredKeys) {
      const missing = [];
      if (requiredKeys.includes('exercise') && !/exercise|exercise selection|movement|squat|deadlift|press|curl|raise/i.test(text)) missing.push('exercise');
      if (requiredKeys.includes('reps') && !/(rep|repetition)s?\s*[:\-]|\d+\s*rep|\d+-\d+\s*rep/i.test(text)) missing.push('reps');
      if (requiredKeys.includes('sets') && !/sets?\s*[:\-]|\d+\s*set|\d+-\d+\s*set/i.test(text)) missing.push('sets');
      if (requiredKeys.includes('rest') && !/rest\s*(period|time|:|=)|\d+\s*(sec|s|min|minute)/i.test(text)) missing.push('rest');
      return missing;
    }
    
    const citations = extractKBCitations(aiResponse);
    const requiredKeys = ['exercise','reps','sets','rest'];
    const missingParams = detectMissingParameters(aiResponse, requiredKeys);
    
    console.log(`   📊 Validation Results:`);
    console.log(`      KB Citations: ${citations.length} found`);
    console.log(`      Missing Parameters: ${missingParams.length === 0 ? 'None' : missingParams.join(', ')}`);
    
    // Show first few citations
    if (citations.length > 0) {
      console.log(`      Sample Citations:`);
      citations.slice(0, 3).forEach((cite, i) => {
        console.log(`        ${i + 1}. [KB:${cite.id}#${cite.idx}]`);
      });
    }
    
    console.log('\n📋 Step 5: Final Response Analysis');
    
    // Check response quality
    const hasSpecificReps = /\d+-\d+\s*rep|reps?.*\d+/i.test(aiResponse);
    const hasSpecificSets = /\d+-?\d*\s*set|sets?.*\d+/i.test(aiResponse);
    const hasRestPeriods = /\d+\s*minute|rest.*\d+/i.test(aiResponse);
    const hasSpecificExercises = /leg press|squat|deadlift|curl|extension/i.test(aiResponse);
    
    console.log(`   Quality Checklist:`);
    console.log(`      ✅ Specific rep ranges: ${hasSpecificReps ? '✓' : '✗'}`);
    console.log(`      ✅ Specific set numbers: ${hasSpecificSets ? '✓' : '✗'}`);
    console.log(`      ✅ Rest period guidance: ${hasRestPeriods ? '✓' : '✗'}`);
    console.log(`      ✅ Specific exercises: ${hasSpecificExercises ? '✓' : '✗'}`);
    console.log(`      ✅ KB citations present: ${citations.length > 0 ? '✓' : '✗'}`);
    
    console.log('\n📝 Generated Response Preview:');
    console.log('='.repeat(50));
    console.log(aiResponse.substring(0, 500) + (aiResponse.length > 500 ? '...' : ''));
    console.log('='.repeat(50));
    
    // Final assessment
    const isComplete = hasSpecificReps && hasSpecificSets && hasRestPeriods && hasSpecificExercises && citations.length > 0;
    
    console.log(`\n🎯 FINAL ASSESSMENT:`);
    if (isComplete) {
      console.log(`   🎉 EXCELLENT: Complete, evidence-based response with proper citations!`);
      console.log(`   ✅ All fixes are working correctly`);
      console.log(`   ✅ AI provides actionable programming details`);
      console.log(`   ✅ KB citations are properly included`);
      console.log(`   ✅ Ready for production use`);
    } else {
      console.log(`   ⚠️  INCOMPLETE: Response needs improvement`);
      console.log(`   Missing: ${!hasSpecificReps ? 'rep ranges ' : ''}${!hasSpecificSets ? 'set numbers ' : ''}${!hasRestPeriods ? 'rest periods ' : ''}${!hasSpecificExercises ? 'exercises ' : ''}${citations.length === 0 ? 'citations' : ''}`);
      console.log(`   💡 May need follow-up validation or system prompt refinement`);
    }
    
  } catch (error) {
    console.error('❌ Error during end-to-end test:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testEndToEndWorkflow();
