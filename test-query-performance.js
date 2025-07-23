const { performance } = require('perf_hooks');

async function testComplexQueryPerformance() {
  console.log('🔍 Testing Complex Query Performance');
  console.log('===================================\n');

  const complexQueries = [
    "What are the best exercises for chest development?",
    "How should I structure my training program for muscle growth and what nutrition principles should I follow?",
    "What are the most effective exercises for building muscle mass, how often should I train each muscle group, and what rep ranges work best for hypertrophy?"
  ];

  for (let i = 0; i < complexQueries.length; i++) {
    const query = complexQueries[i];
    console.log(`\n${i + 1}. Testing Query: "${query.substring(0, 60)}..."`);
    
    const start = performance.now();
    
    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          isGuest: true
        })
      });

      const end = performance.now();
      const time = end - start;

      if (response.ok) {
        const data = await response.json();
        
        console.log(`   ⏱️ Response Time: ${time.toFixed(0)}ms (${(time/1000).toFixed(1)}s)`);
        
        if (data.citations && data.citations.length > 0) {
          console.log(`   📚 Citations: ${data.citations.length} sources`);
          console.log(`   🔍 RAG System: ACTIVE`);
        } else {
          console.log(`   🔍 RAG System: NOT USED (fallback to general knowledge)`);
        }
        
        if (time > 8000) {
          console.log(`   ❌ EXTREMELY SLOW: ${(time/1000).toFixed(1)}s`);
        } else if (time > 4000) {
          console.log(`   ⚠️  SLOW: ${(time/1000).toFixed(1)}s`);
        } else if (time > 2000) {
          console.log(`   ⚠️  ACCEPTABLE: ${(time/1000).toFixed(1)}s`);
        } else {
          console.log(`   ✅ FAST: ${(time/1000).toFixed(1)}s`);
        }

      } else {
        console.log(`   ❌ Error: ${response.status}`);
      }

    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
    }

    // Wait between requests
    if (i < complexQueries.length - 1) {
      console.log('   ⏳ Waiting 2s before next test...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('\n💡 PERFORMANCE INSIGHTS:');
  console.log('   • If ALL queries are slow (>4s), the issue is systemic');
  console.log('   • If complex queries are slower, multi-query is working but slow');
  console.log('   • If no citations appear, RAG retrieval may be failing');
  console.log('   • Check development server logs for parallel processing messages');
}

testComplexQueryPerformance();
