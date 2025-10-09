const { PrismaClient } = require('@prisma/client');
const { performance } = require('perf_hooks');

const prisma = new PrismaClient();

async function diagnoseSLOWResponse() {
  console.log('🐌 DIAGNOSING SLOW AI RESPONSE PERFORMANCE');
  console.log('==========================================\n');

  try {
    // Test 1: Check AI Configuration
    console.log('1. Checking AI Configuration Speed...');
    const configStart = performance.now();
    const aiConfig = await prisma.aIConfiguration.findFirst();
    const configTime = performance.now() - configStart;
    console.log(`   ⏱️ AI Config fetch: ${configTime.toFixed(0)}ms`);
    
    if (!aiConfig) {
      console.log('❌ No AI configuration found!');
      return;
    }

    // Test 2: Check Knowledge Base Query Speed
    console.log('\n2. Testing Knowledge Base Query Speed...');
    const kbStart = performance.now();
    const chunkCount = await prisma.knowledgeChunk.count();
    const kbTime = performance.now() - kbStart;
    console.log(`   ⏱️ Knowledge chunk count (${chunkCount} chunks): ${kbTime.toFixed(0)}ms`);

    // Test 3: Test Vector Search Speed (if chunks exist)
    if (chunkCount > 0) {
      console.log('\n3. Testing Vector Search Speed...');
      const vectorStart = performance.now();
      const sampleChunks = await prisma.knowledgeChunk.findMany({
        where: { embeddingData: { not: null } },
        take: 10,
        include: {
          knowledgeItem: {
            select: { title: true }
          }
        }
      });
      const vectorTime = performance.now() - vectorStart;
      console.log(`   ⏱️ Sample chunk fetch: ${vectorTime.toFixed(0)}ms`);
      console.log(`   📊 Chunks with embeddings: ${sampleChunks.length}/10`);
    }

    // Test 4: Test a REAL AI Chat Request
    console.log('\n4. Testing ACTUAL Chat API Performance...');
    console.log('   🚀 Making real chat request to measure total time...');
    
    const chatStart = performance.now();
    
    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: "What are the best exercises for chest development?",
          isGuest: true
        })
      });

      const chatEnd = performance.now();
      const totalChatTime = chatEnd - chatStart;

      if (response.ok) {
        const data = await response.json();
        
        console.log(`\n📊 PERFORMANCE BREAKDOWN:`);
        console.log(`   🚀 Total API Response Time: ${totalChatTime.toFixed(0)}ms`);
        
        if (totalChatTime < 2000) {
          console.log(`   ✅ FAST: Under 2 seconds - Good performance!`);
        } else if (totalChatTime < 5000) {
          console.log(`   ⚠️  SLOW: ${(totalChatTime/1000).toFixed(1)}s - Could be optimized`);
        } else {
          console.log(`   ❌ VERY SLOW: ${(totalChatTime/1000).toFixed(1)}s - Major performance issue!`);
        }

        // Check if citations were returned (indicates RAG was used)
        if (data.citations && data.citations.length > 0) {
          console.log(`   📚 RAG System Used: ${data.citations.length} sources retrieved`);
        } else {
          console.log(`   ℹ️  No RAG retrieval (may have used general knowledge)`);
        }

        console.log(`   📝 Response Length: ${data.assistantReply?.length || 0} characters`);

      } else {
        console.log(`   ❌ Chat API Error: ${response.status}`);
        const errorText = await response.text();
        console.log(`   Error: ${errorText.substring(0, 200)}`);
      }

    } catch (fetchError) {
      console.log(`   ❌ Network Error: ${fetchError.message}`);
      console.log(`   💡 Make sure development server is running (npm run dev)`);
    }

    // Test 5: Identify Performance Bottlenecks
    console.log(`\n🔍 PERFORMANCE ANALYSIS:`);
    console.log(`   • Database queries: ~${(configTime + kbTime).toFixed(0)}ms`);
    console.log(`   • Network overhead: Usually 10-50ms`);
    console.log(`   • RAG processing: This is likely the bottleneck`);
    console.log(`   • AI generation: Depends on Gemini API response time`);

    console.log(`\n💡 OPTIMIZATION RECOMMENDATIONS:`);
    if (chunkCount > 1000) {
      console.log(`   🗃️  Large knowledge base (${chunkCount} chunks) - consider indexing`);
    }
    console.log(`   ⚡ Ensure parallel processing is working correctly`);
    console.log(`   🚀 Monitor Gemini API response times`);
    console.log(`   📊 Check if multi-query retrieval is causing delays`);

  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseSLOWResponse();
