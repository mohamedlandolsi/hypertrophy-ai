// test-comprehensive-api-flow.js
// Test the exact API flow to identify the empty response issue

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testComprehensiveAPIFlow() {
  console.log('🔬 COMPREHENSIVE API FLOW TEST');
  console.log('==============================\n');

  try {
    // Get a test user
    const testUser = await prisma.user.findFirst({
      include: {
        clientMemory: true
      }
    });

    if (!testUser) {
      console.log('❌ No test user found');
      return;
    }

    console.log(`👤 Test User: ${testUser.id}`);
    console.log(`   Plan: ${testUser.plan}`);
    console.log(`   Has Memory: ${testUser.clientMemory ? 'Yes' : 'No'}`);

    // Test the exact steps from the chat API
    const message = "How can I build muscle effectively?";
    
    console.log('\n📝 Testing message:', message);

    // 1. Test AI Configuration fetch
    console.log('\n1️⃣ Testing AI Configuration...');
    const aiConfig = await prisma.aIConfiguration.findFirst();
    if (!aiConfig) {
      console.log('   ❌ No AI configuration found');
      return;
    }
    console.log(`   ✅ AI Config: threshold=${aiConfig.ragSimilarityThreshold}, model=${aiConfig.freeModelName}`);

    // 2. Test fetchUserProfile
    console.log('\n2️⃣ Testing fetchUserProfile...');
    try {
      // Since we can't import TS modules directly, let's manually test the user profile logic
      const userProfile = await prisma.clientMemory.findUnique({
        where: { userId: testUser.id },
        select: {
          name: true,
          age: true,
          primaryGoal: true,
          trainingExperience: true,
          currentBench: true,
          currentSquat: true,
          currentDeadlift: true,
        }
      });
      console.log(`   ✅ User profile: ${userProfile ? 'found' : 'not found'}`);
    } catch (error) {
      console.log(`   ❌ User profile error: ${error.message}`);
    }

    // 3. Test vector search
    console.log('\n3️⃣ Testing vector search...');
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      
      // Generate embedding
      const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
      const embeddingResult = await embeddingModel.embedContent(message);
      const queryEmbedding = embeddingResult.embedding.values;
      
      console.log(`   ✅ Generated embedding: ${queryEmbedding.length} dimensions`);
      
      // Test vector search
      const embeddingStr = `[${queryEmbedding.join(',')}]`;
      const candidateLimit = aiConfig.ragMaxChunks * 3;
      
      const chunks = await prisma.$queryRaw`
        SELECT
          kc.id,
          kc.content,
          ki.title,
          1 - (kc."embeddingData"::vector <=> ${embeddingStr}::vector) as score
        FROM "KnowledgeChunk" kc
        JOIN "KnowledgeItem" ki ON kc."knowledgeItemId" = ki.id  
        WHERE ki.status = 'READY' 
          AND kc."embeddingData" IS NOT NULL
        ORDER BY kc."embeddingData"::vector <=> ${embeddingStr}::vector
        LIMIT ${candidateLimit}
      `;
      
      const relevantChunks = chunks.filter(chunk => chunk.score >= aiConfig.ragSimilarityThreshold);
      console.log(`   ✅ Vector search: ${chunks.length} total, ${relevantChunks.length} above threshold`);
      
      if (relevantChunks.length > 0) {
        console.log(`   Top result: "${relevantChunks[0].title}" (score: ${relevantChunks[0].score.toFixed(3)})`);
      }

      // 4. Test context formatting
      console.log('\n4️⃣ Testing context formatting...');
      
      let contextString = "### CONTEXTUAL INFORMATION ###\n\n";
      contextString += "<knowledge_base_context>\n";
      contextString += "This is your source of truth. Synthesize your answer from these scientifically-backed guides:\n";
      relevantChunks.slice(0, 5).forEach((chunk, index) => {
        contextString += `--- Guide Chunk ${index + 1}: ${chunk.title} (Relevance Score: ${chunk.score.toFixed(2)}) ---\n`;
        contextString += `${chunk.content.substring(0, 200)}...\n`;
      });
      contextString += "</knowledge_base_context>\n";
      contextString += "### END CONTEXTUAL INFORMATION ###";
      
      console.log(`   ✅ Context formatted: ${contextString.length} characters`);

      // 5. Test Gemini API call
      console.log('\n5️⃣ Testing Gemini API call...');
      
      const fullSystemPrompt = `${aiConfig.systemPrompt}\n\n${contextString}`;
      console.log(`   System prompt total: ${fullSystemPrompt.length} characters`);
      
      const modelName = testUser.plan === 'PRO' ? aiConfig.proModelName : aiConfig.freeModelName;
      console.log(`   Using model: ${modelName}`);
      
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        systemInstruction: {
          role: "system",
          parts: [{ text: fullSystemPrompt }]
        }
      });
      
      const generationConfig = {
        temperature: aiConfig.temperature,
        topP: aiConfig.topP,
        topK: aiConfig.topK,
        maxOutputTokens: aiConfig.maxTokens,
      };
      
      const chat = model.startChat({ 
        history: [], 
        generationConfig 
      });
      
      console.log('   🚀 Sending request to Gemini...');
      const result = await chat.sendMessage(message);
      const aiContent = result.response.text();
      
      console.log(`   📊 Response received:`);
      console.log(`     Length: ${aiContent.length} characters`);
      console.log(`     Preview: "${aiContent.substring(0, 150)}..."`);
      
      if (aiContent.length === 0) {
        console.log('   ❌ EMPTY RESPONSE FROM GEMINI!');
        console.log('   This is the root cause of the issue!');
      } else {
        console.log('   ✅ Response is not empty');
      }

      // 6. Test the exact validation we added
      console.log('\n6️⃣ Testing response validation...');
      
      if (!aiContent || aiContent.trim().length === 0) {
        console.log('   ❌ Response would fail validation (empty content)');
      } else {
        console.log('   ✅ Response passes validation');
      }

      // 7. Test with different context
      console.log('\n7️⃣ Testing with minimal context...');
      
      const minimalModel = genAI.getGenerativeModel({ 
        model: modelName,
        systemInstruction: {
          role: "system",
          parts: [{ text: "You are a helpful fitness coach. Provide concise, helpful answers." }]
        }
      });
      
      const minimalChat = minimalModel.startChat({ 
        history: [], 
        generationConfig 
      });
      
      const minimalResult = await minimalChat.sendMessage(message);
      const minimalContent = minimalResult.response.text();
      
      console.log(`   Minimal context response: ${minimalContent.length} characters`);
      console.log(`   Preview: "${minimalContent.substring(0, 100)}..."`);

    } catch (error) {
      console.error('   ❌ Vector search error:', error);
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testComprehensiveAPIFlow();
