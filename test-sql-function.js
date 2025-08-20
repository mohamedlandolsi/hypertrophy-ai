// Test the match_document_sections SQL function
const { createClient } = require('@supabase/supabase-js');

async function testSQLFunction() {
    try {
        console.log('🧪 Testing match_document_sections SQL function...');
        
        // Create Supabase client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        
        console.log('🔑 Using service role key for testing...');
        const supabase = createClient(supabaseUrl, serviceKey);
        
        // Test embedding (dummy values for testing) - convert to JSON string
        const testEmbedding = Array.from({ length: 768 }, () => Math.random() - 0.5);
        const embeddingString = JSON.stringify(testEmbedding);
        
        console.log('📡 Calling match_document_sections function...');
        const { data, error } = await supabase.rpc('match_document_sections', {
            query_embedding: embeddingString,
            match_threshold: 0.1,
            match_count: 5
        });
        
        if (error) {
            console.error('❌ SQL function error:', error);
            return;
        }
        
        console.log('✅ SQL function executed successfully!');
        console.log(`📊 Returned ${data?.length || 0} results`);
        
        if (data && data.length > 0) {
            console.log('🔍 Sample result structure:');
            console.log(JSON.stringify(data[0], null, 2));
        } else {
            console.log('ℹ️ No matching documents found (expected with random embedding)');
        }
        
    } catch (error) {
        console.error('💥 Test failed:', error);
    }
}

// Load environment variables
require('dotenv').config({ path: '.env' });

testSQLFunction();
