// test-exact-chat-flow.js
// Test the exact flow that the chat API uses

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testExactChatFlow() {
  console.log('🔍 TESTING EXACT CHAT API FLOW');
  console.log('==============================\n');

  try {
    // Get a test user
    const testUser = await prisma.user.findFirst();
    if (!testUser) {
      console.log('❌ No test user found');
      return;
    }

    console.log(`👤 Testing with user: ${testUser.id}`);

    // Simulate the exact chat API flow
    const message = "Help me build muscle";
    const conversationId = null; // New conversation
    
    console.log(`📝 Message: "${message}"`);
    console.log(`💬 Conversation ID: ${conversationId}`);

    // Step 1: Prepare conversation history (like the API does)
    let existingMessages = [];
    let chatId;

    if (conversationId) {
      // Find existing chat
      const existingChat = await prisma.chat.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' }
          }
        }
      });
      
      if (existingChat) {
        existingMessages = existingChat.messages;
        chatId = existingChat.id;
      }
    } else {
      // Create new chat
      const newChat = await prisma.chat.create({
        data: {
          title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
          userId: testUser.id,
        }
      });
      chatId = newChat.id;
      console.log(`✅ Created new chat: ${chatId}`);
    }

    // Step 2: Prepare conversation for Gemini (like the API does)
    const allMessages = [...existingMessages, { role: 'USER', content: message }];
    
    // Convert to the format expected by sendToGeminiWithCitations
    const conversationForGemini = allMessages.map(msg => ({
      role: msg.role.toLowerCase() === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    console.log(`📋 Conversation history: ${conversationForGemini.length} messages`);
    conversationForGemini.forEach((msg, index) => {
      console.log(`   ${index + 1}. [${msg.role}] "${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}"`);
    });

    // Step 3: Call sendToGeminiWithCitations (like the API does)
    console.log('\n🤖 Calling sendToGeminiWithCitations...');
    
    try {
      // We need to test this in a way that works from our script
      // Let's manually call the generateChatResponse function
      console.log('   Manually testing generateChatResponse...');
      
      // Get the AI config first
      const aiConfig = await prisma.aIConfiguration.findFirst();
      if (!aiConfig) {
        console.log('   ❌ No AI configuration found');
        return;
      }
      
      console.log(`   AI Config found: threshold=${aiConfig.ragSimilarityThreshold}, maxChunks=${aiConfig.ragMaxChunks}`);
      
      // Test the vector search first
      console.log('   Testing vector search...');
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      
      // Generate embedding
      const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
      const embeddingResult = await embeddingModel.embedContent(message);
      const queryEmbedding = embeddingResult.embedding.values;
      
      console.log(`   Generated embedding: ${queryEmbedding.length} dimensions`);
      
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
      
      const results = chunks;
      const relevantChunks = results.filter(chunk => chunk.score >= aiConfig.ragSimilarityThreshold);
      
      console.log(`   Vector search results: ${results.length} total, ${relevantChunks.length} above threshold`);
      
      if (relevantChunks.length > 0) {
        console.log(`   Top result: "${relevantChunks[0].title}" (score: ${relevantChunks[0].score.toFixed(3)})`);
      }
      
      // Test user profile fetch
      console.log('   Testing user profile fetch...');
      const userProfile = await prisma.user.findUnique({
        where: { id: testUser.id },
        select: {
          plan: true,
          name: true,
          email: true
        }
      });
      console.log(`   User profile: plan=${userProfile?.plan}`);
      
      // Test client memory fetch
      const clientMemory = await prisma.clientMemory.findUnique({ 
        where: { userId: testUser.id } 
      });
      console.log(`   Client memory: ${clientMemory ? 'found' : 'not found'}`);
      
      // Now test the actual Gemini call
      console.log('   Testing Gemini API call...');
      
      const modelName = userProfile?.plan === 'PRO' ? aiConfig.proModelName : aiConfig.freeModelName;
      console.log(`   Using model: ${modelName}`);
      
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        systemInstruction: {
          role: "system",
          parts: [{ text: aiConfig.systemPrompt }]
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
      
      const result = await chat.sendMessage(message);
      const aiContent = result.response.text();
      
      console.log(`   ✅ Gemini response received!`);
      console.log(`   Response length: ${aiContent.length} characters`);
      console.log(`   Response preview: "${aiContent.substring(0, 200)}..."`);
      
      if (aiContent.length === 0) {
        console.log('   ❌ EMPTY RESPONSE! This is the issue.');
      } else {
        console.log('   ✅ Response is not empty - something else is causing the issue');
      }
      
    } catch (error) {
      console.error('   ❌ Error in AI generation:', error);
      console.error('   Stack:', error.stack);
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testExactChatFlow();
