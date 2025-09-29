const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kbxqoaeytmuabopwlngy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtieHFvYWV5dG11YWJvcHdsbmd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzk5MjI5OCwiZXhwIjoyMDYzNTY4Mjk4fQ.g50ym63TJM6PsmpZeTeAPpA9rATYqwZ0AAx--q46Jyo';

async function debugStorageUpload() {
    console.log('🔍 Debugging storage upload issue...\n');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // 1. Check if bucket exists
    console.log('1. Checking if program-thumbnails bucket exists...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
        console.error('❌ Error listing buckets:', bucketError);
        return;
    }
    
    const thumbnailBucket = buckets.find(bucket => bucket.name === 'program-thumbnails');
    if (thumbnailBucket) {
        console.log('✅ program-thumbnails bucket exists');
        console.log('   Public:', thumbnailBucket.public);
        console.log('   Created at:', thumbnailBucket.created_at);
    } else {
        console.log('❌ program-thumbnails bucket NOT found');
        console.log('📋 Available buckets:', buckets.map(b => b.name));
        return;
    }

    // 2. Check bucket policies
    console.log('\n2. Checking bucket policies...');
    try {
        // Try to list files in the bucket (this will test read permissions)
        const { data: files, error: listError } = await supabase.storage
            .from('program-thumbnails')
            .list('', { limit: 1 });
            
        if (listError) {
            console.log('❌ Error listing files (policy issue?):', listError);
        } else {
            console.log('✅ Can list files in bucket');
        }
    } catch (error) {
        console.log('❌ Exception when listing files:', error.message);
    }

    // 3. Test a simple upload
    console.log('\n3. Testing simple upload...');
    try {
        const testFileName = `test-${Date.now()}.txt`;
        const testContent = 'This is a test upload';
        
        const { error: uploadError } = await supabase.storage
            .from('program-thumbnails')
            .upload(testFileName, testContent, {
                contentType: 'text/plain',
                upsert: false
            });
            
        if (uploadError) {
            console.log('❌ Upload test failed:', uploadError);
        } else {
            console.log('✅ Test upload successful');
            
            // Clean up test file
            await supabase.storage
                .from('program-thumbnails')
                .remove([testFileName]);
            console.log('🧹 Test file cleaned up');
        }
    } catch (error) {
        console.log('❌ Exception during upload test:', error.message);
    }

    // 4. Check user authentication
    console.log('\n4. Testing user authentication path...');
    
    // Create a regular client (not service role)
    const regularClient = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtieHFvYWV5dG11YWJvcHdsbmd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5OTIyOTgsImV4cCI6MjA2MzU2ODI5OH0.UfTFQL6rIAg_NO5ZXo15IdGlzuGFKxM0loSi60PKD2M');
    
    try {
        const { data: { user }, error: authError } = await regularClient.auth.getUser();
        
        if (authError) {
            console.log('❌ Regular client auth check failed:', authError);
        } else if (!user) {
            console.log('ℹ️ No authenticated user (expected for this test)');
        } else {
            console.log('✅ User authenticated:', user.id);
        }
    } catch (error) {
        console.log('❌ Exception during auth test:', error.message);
    }
    
    console.log('\n✅ Storage debugging complete');
}

debugStorageUpload().catch(console.error);