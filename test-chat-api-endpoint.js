const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function testChatAPIEndpoint() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing chat API endpoint directly...');
    
    // Get a test user
    const testUser = await prisma.user.findFirst({
      where: {
        role: 'admin'
      },
      select: {
        id: true,
        email: true,
        plan: true
      }
    });
    
    if (!testUser) {
      console.log('❌ No admin user found');
      return;
    }
    
    console.log('✅ Found test user:', testUser.email);
    
    // Start the dev server if not already running
    console.log('\n📡 Testing HTTP request to chat API...');
    console.log('Make sure dev server is running: npm run dev');
    
    const fetch = require('node-fetch');
    
    try {
      // Test the chat API endpoint
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Hello, this is a test message',
          conversationId: null
        })
      });
      
      console.log('📊 Response status:', response.status);
      console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();
      console.log('📊 Response body:', responseText);
      
      if (responseText.includes('system delay')) {
        console.log('🚨 FOUND SYSTEM DELAY MESSAGE IN RESPONSE!');
      }
      
      if (responseText.includes('Authentication required')) {
        console.log('📝 This is expected - the API requires authentication');
        console.log('The "system delay" issue is likely NOT related to authentication');
      }
      
    } catch (fetchError) {
      console.log('❌ HTTP request failed:', fetchError.message);
      console.log('💡 Make sure the dev server is running: npm run dev');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Also check if the dev server is running
async function checkDevServer() {
  console.log('🔍 Checking if dev server is running...');
  
  const fetch = require('node-fetch');
  
  try {
    const response = await fetch('http://localhost:3000/api/health', {
      timeout: 3000
    });
    console.log('✅ Dev server is running');
    return true;
  } catch (error) {
    console.log('❌ Dev server is not running or not responding');
    console.log('💡 Start it with: npm run dev');
    return false;
  }
}

async function runTest() {
  const serverRunning = await checkDevServer();
  if (serverRunning) {
    await testChatAPIEndpoint();
  } else {
    console.log('\n🛠️ To test the chat API:');
    console.log('1. Start dev server: npm run dev');
    console.log('2. Run this script again: node test-chat-api-endpoint.js');
    console.log('3. Or test manually in browser: http://localhost:3000');
  }
}

runTest();
