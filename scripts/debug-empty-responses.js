// debug-empty-responses.js
// Investigate why AI responses are empty

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugEmptyResponses() {
  console.log('🔍 DEBUGGING EMPTY AI RESPONSES');
  console.log('==============================\n');

  try {
    // Get recent empty assistant messages
    const emptyMessages = await prisma.message.findMany({
      where: {
        role: 'ASSISTANT',
        content: ''
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        chat: {
          include: {
            messages: {
              orderBy: { createdAt: 'asc' }
            }
          }
        }
      }
    });

    console.log(`📊 Found ${emptyMessages.length} recent empty assistant messages`);

    for (const message of emptyMessages) {
      console.log(`\n💬 Chat ${message.chatId}:`);
      console.log(`   Created: ${message.createdAt}`);
      console.log(`   Total messages in chat: ${message.chat.messages.length}`);
      
      // Show the conversation context
      const userMessages = message.chat.messages.filter(m => m.role === 'USER');
      if (userMessages.length > 0) {
        const lastUserMessage = userMessages[userMessages.length - 1];
        console.log(`   Last user message: "${lastUserMessage.content}"`);
      }
    }

    // Test the actual generateChatResponse function
    console.log('\n🧪 TESTING generateChatResponse DIRECTLY:');
    
    // Find a user to test with
    const testUser = await prisma.user.findFirst();
    if (!testUser) {
      console.log('❌ No test user found');
      return;
    }

    console.log(`👤 Testing with user: ${testUser.id}`);

    // Test with a simple message
    try {
      console.log('\n1. Testing simple greeting...');
      
      // We need to require the actual function correctly
      // Let's test by making a manual API call to our own endpoint
      const testResponse = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // This won't work without proper auth, but let's see the error
        },
        body: JSON.stringify({
          message: 'Hello, can you help me?',
          conversationId: null
        })
      });

      console.log(`   Response status: ${testResponse.status}`);
      const responseData = await testResponse.json();
      console.log(`   Response data:`, responseData);

    } catch (error) {
      console.log(`   ❌ API test failed: ${error.message}`);
    }

    // Let's check the AI configuration more thoroughly
    console.log('\n🤖 DETAILED AI CONFIGURATION CHECK:');
    const config = await prisma.aIConfiguration.findFirst();
    
    console.log(`   System prompt preview: "${config.systemPrompt.substring(0, 200)}..."`);
    console.log(`   Model settings:`);
    console.log(`     Free model: ${config.freeModelName}`);
    console.log(`     Pro model: ${config.proModelName}`);
    console.log(`     Temperature: ${config.temperature}`);
    console.log(`     Max tokens: ${config.maxTokens}`);
    console.log(`     Top K: ${config.topK}`);
    console.log(`     Top P: ${config.topP}`);

    // Check if there are any errors in the logs that might indicate the issue
    console.log('\n📝 CHECKING FOR PATTERNS IN EMPTY RESPONSES:');
    
    const chatWithEmptyResponse = await prisma.chat.findFirst({
      where: {
        messages: {
          some: {
            role: 'ASSISTANT',
            content: ''
          }
        }
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (chatWithEmptyResponse) {
      console.log('\n📋 Example chat with empty response:');
      chatWithEmptyResponse.messages.forEach((msg, index) => {
        console.log(`   ${index + 1}. [${msg.role}] "${msg.content}" (${msg.content.length} chars)`);
      });
    }

  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugEmptyResponses();
