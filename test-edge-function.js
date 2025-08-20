// test-edge-function.js
// Test script for the Supabase Edge Function

const testEdgeFunction = async () => {
  console.log('🧪 Testing Supabase Edge Function for File Processing\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase configuration');
    console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set');
    return;
  }

  // Test data (you would replace this with actual file data)
  const testRequest = {
    filePath: 'test-file.txt',
    fileName: 'test-document.txt',
    mimeType: 'text/plain',
    userId: 'test-user-id',
    knowledgeItemId: 'test-knowledge-item-id'
  };

  const edgeFunctionUrl = `${supabaseUrl}/functions/v1/file-processor`;

  console.log('🌐 Edge Function URL:', edgeFunctionUrl);
  console.log('📤 Test Request:', testRequest);
  console.log('');

  try {
    console.log('🚀 Calling Edge Function...');
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify(testRequest)
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Edge Function failed:', errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ Edge Function Response:', result);

    if (result.success) {
      console.log('\n🎉 Edge Function Test Results:');
      console.log(`   📄 Chunks Created: ${result.chunksCreated}`);
      console.log(`   🧠 Embeddings Generated: ${result.embeddingsGenerated}`);
      console.log(`   ⏱️  Processing Time: ${result.processingTime}ms`);
      console.log(`   ❌ Errors: ${result.errors.length}`);
      
      if (result.errors.length > 0) {
        console.log('   Error Details:', result.errors);
      }
    } else {
      console.log('\n❌ Edge Function Processing Failed:');
      console.log('   Errors:', result.errors);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

console.log('🧪 Edge Function Test Script');
console.log('=============================\n');

console.log('📋 What this test does:');
console.log('   1. Tests the Supabase Edge Function endpoint');
console.log('   2. Verifies the function can receive and parse requests');
console.log('   3. Checks error handling and response format');
console.log('   4. Note: This test uses mock data (no actual file processing)');
console.log('');

console.log('⚠️  Prerequisites:');
console.log('   1. Supabase Edge Function deployed and running');
console.log('   2. Environment variables configured');
console.log('   3. Supabase project accessible');
console.log('');

console.log('🚀 Starting test...\n');

testEdgeFunction().catch(console.error);
