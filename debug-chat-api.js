// debug-chat-api.js
// Debug the chat API to find why responses are empty

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugChatAPI() {
  console.log('🔍 DEBUGGING CHAT API');
  console.log('====================\n');

  try {
    // Check if there's a test user we can use
    const users = await prisma.user.findMany({
      take: 1,
      include: {
        clientMemory: true,
        chats: {
          include: {
            messages: true
          },
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }

    const testUser = users[0];
    console.log('👤 Test User:', testUser.id);
    console.log(`   Plan: ${testUser.plan}`);
    console.log(`   Has Memory: ${testUser.clientMemory ? 'Yes' : 'No'}`);
    console.log(`   Recent Chats: ${testUser.chats.length}`);

    // Check AI Configuration
    const aiConfig = await prisma.aIConfiguration.findFirst();
    if (!aiConfig) {
      console.log('❌ No AI configuration found!');
      return;
    }
    
    console.log('\n🤖 AI Configuration:');
    console.log(`   Similarity Threshold: ${aiConfig.ragSimilarityThreshold}`);
    console.log(`   Max Chunks: ${aiConfig.ragMaxChunks}`);
    console.log(`   Use Knowledge Base: ${aiConfig.useKnowledgeBase}`);
    console.log(`   System Prompt Length: ${aiConfig.systemPrompt.length} chars`);

    // Check knowledge base
    const kbCount = await prisma.knowledgeItem.count({
      where: { status: 'READY' }
    });
    
    const chunkCount = await prisma.knowledgeChunk.count({
      where: {
        knowledgeItem: { status: 'READY' },
        embeddingData: { not: null }
      }
    });

    console.log('\n📚 Knowledge Base:');
    console.log(`   Ready Items: ${kbCount}`);
    console.log(`   Embedded Chunks: ${chunkCount}`);

    // Check environment variables
    console.log('\n� Environment Check:');
    console.log(`   GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? 'Set' : 'Missing'}`);
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? 'Set' : 'Missing'}`);

    // Test simple Gemini API call
    console.log('\n🤖 Testing Gemini API...');
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      
      if (!process.env.GEMINI_API_KEY) {
        console.log('   ❌ GEMINI_API_KEY not found');
        return;
      }
      
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const result = await model.generateContent('Say hello in one sentence.');
      const response = result.response.text();
      
      console.log(`   ✅ Gemini API works!`);
      console.log(`   Response: "${response}"`);
      console.log(`   Length: ${response.length} characters`);
      
    } catch (error) {
      console.log(`   ❌ Gemini API error: ${error.message}`);
    }

    // Check recent messages in the database
    console.log('\n💬 Recent Messages:');
    const recentMessages = await prisma.message.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        chat: {
          select: { userId: true }
        }
      }
    });

    recentMessages.forEach((msg, index) => {
      console.log(`   ${index + 1}. [${msg.role}] "${msg.content.substring(0, 50)}..." (${msg.content.length} chars)`);
    });

  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugChatAPI();
