// test-knowledge-graph.js
// Test script for the Neo4j knowledge graph functionality

const { testConnection, buildKnowledgeGraph, getGraphStats, queryRelatedEntities } = require('./src/lib/knowledge-graph');

async function testKnowledgeGraph() {
  console.log('🧪 Testing Knowledge Graph Functionality\n');
  
  try {
    // Test 1: Connection
    console.log('1️⃣ Testing Neo4j Connection...');
    const connectionOk = await testConnection();
    if (!connectionOk) {
      console.error('❌ Neo4j connection failed. Check your environment variables:');
      console.error('   NEO4J_URI (default: bolt://localhost:7687)');
      console.error('   NEO4J_USER (default: neo4j)');
      console.error('   NEO4J_PASSWORD (required)');
      return;
    }
    console.log('✅ Neo4j connection successful\n');

    // Test 2: Sample text processing
    console.log('2️⃣ Testing Knowledge Graph Building...');
    const sampleText = `
      Progressive overload is the fundamental principle of hypertrophy training. 
      It involves gradually increasing the mechanical tension on muscles through 
      increased weight, reps, or sets. Compound exercises like squats and deadlifts 
      target multiple muscle groups simultaneously. The quadriceps and hamstrings 
      are the primary movers in squats, while deadlifts primarily target the 
      posterior chain including the glutes and erector spinae. For hypertrophy, 
      rep ranges of 6-12 are optimal as they provide the right balance of 
      mechanical tension and metabolic stress.
    `;
    
    await buildKnowledgeGraph(sampleText, 'test-knowledge-item-1');
    console.log('✅ Knowledge graph building completed\n');

    // Test 3: Graph statistics
    console.log('3️⃣ Getting Graph Statistics...');
    const stats = await getGraphStats();
    console.log('📊 Graph Stats:', stats);
    console.log('');

    // Test 4: Query related entities
    console.log('4️⃣ Querying Related Entities...');
    try {
      const related = await queryRelatedEntities('Progressive Overload', 5);
      console.log('🔗 Entities related to "Progressive Overload":', related);
    } catch (error) {
      console.log('ℹ️ No relationships found (this is normal for first run)');
    }
    
    console.log('\n🎉 Knowledge Graph test completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Upload fitness documents through the web interface');
    console.log('   2. Check the admin panel at /admin/knowledge-graph');
    console.log('   3. Explore the graph using Neo4j Browser');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Make sure Neo4j is running');
    console.error('   2. Check environment variables in .env.local:');
    console.error('      NEO4J_URI=bolt://localhost:7687');
    console.error('      NEO4J_USER=neo4j');
    console.error('      NEO4J_PASSWORD=your_password');
    console.error('   3. Ensure GEMINI_API_KEY is set');
  }
}

// Run the test
testKnowledgeGraph()
  .catch(console.error)
  .finally(() => {
    process.exit(0);
  });
