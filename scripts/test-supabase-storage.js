/**
 * Test script to verify Supabase storage bucket setup
 * Run with: node test-supabase-storage.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('🔍 Checking Supabase Storage Setup...\n');

  try {
    // Check if bucket exists
    console.log('1️⃣ Checking for exercise-images bucket...');
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();

    if (bucketsError) {
      throw bucketsError;
    }

    const exerciseBucket = buckets.find(b => b.name === 'exercise-images');
    
    if (!exerciseBucket) {
      console.error('❌ Bucket "exercise-images" does NOT exist!\n');
      console.log('🔧 Solution: Create the bucket in Supabase');
      console.log('   Option 1: Run the SQL from supabase-exercise-images-bucket-setup.sql');
      console.log('   Option 2: Create manually in Supabase Dashboard > Storage\n');
      console.log('   Bucket settings:');
      console.log('   - Name: exercise-images');
      console.log('   - Public: Yes');
      console.log('   - File size limit: 10MB');
      console.log('   - Allowed MIME types: image/jpeg, image/png, image/gif, image/webp\n');
      return;
    }

    console.log('✅ Bucket "exercise-images" exists!');
    console.log(`   Public: ${exerciseBucket.public ? 'Yes' : 'No'}`);
    console.log(`   Created: ${exerciseBucket.created_at}\n`);

    // List files in bucket
    console.log('2️⃣ Checking files in bucket...');
    const { data: files, error: filesError } = await supabase
      .storage
      .from('exercise-images')
      .list('exercises', {
        limit: 10,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (filesError) {
      console.error('⚠️  Could not list files:', filesError.message);
    } else {
      console.log(`   Files in exercises/ folder: ${files?.length || 0}`);
      if (files && files.length > 0) {
        console.log('\n   Recent files:');
        files.forEach((file, idx) => {
          console.log(`   ${idx + 1}. ${file.name} (${(file.metadata?.size / 1024).toFixed(2)} KB)`);
        });
      }
    }

    // Test upload (using a small test file)
    console.log('\n3️⃣ Testing upload capability...');
    const testFileName = `test-${Date.now()}.txt`;
    const testContent = 'Test file for verifying upload permissions';
    
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('exercise-images')
      .upload(`exercises/${testFileName}`, testContent, {
        contentType: 'text/plain',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Upload test FAILED:', uploadError.message);
      console.log('\n🔧 Possible issues:');
      console.log('   - RLS policies not set correctly');
      console.log('   - Service role key lacks permissions');
      console.log('   - Bucket is not public\n');
      console.log('   Run the SQL from: supabase-storage-policies-fix.sql\n');
    } else {
      console.log('✅ Upload test SUCCESS!');
      console.log(`   File path: ${uploadData.path}`);
      
      // Get public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('exercise-images')
        .getPublicUrl(`exercises/${testFileName}`);
      
      console.log(`   Public URL: ${publicUrl}\n`);

      // Clean up test file
      const { error: deleteError } = await supabase
        .storage
        .from('exercise-images')
        .remove([`exercises/${testFileName}`]);
      
      if (!deleteError) {
        console.log('   ✓ Test file cleaned up\n');
      }
    }

    console.log('📋 Summary:');
    console.log(`   ✅ Bucket exists: Yes`);
    console.log(`   ✅ Bucket is public: ${exerciseBucket.public ? 'Yes' : 'No'}`);
    console.log(`   ${uploadError ? '❌' : '✅'} Upload permissions: ${uploadError ? 'Failed' : 'Working'}\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  });
