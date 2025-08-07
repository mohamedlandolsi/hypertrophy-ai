const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function debugSupabaseAdmin() {
  console.log('🔍 Debugging Supabase Admin Configuration...\n');

  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.log('❌ NEXT_PUBLIC_SUPABASE_URL is missing');
    return;
  }
  
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('❌ SUPABASE_SERVICE_ROLE_KEY is missing');
    return;
  }

  try {
    // Test admin client creation
    console.log('\n🔑 Creating Supabase Admin Client...');
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    console.log('✅ Admin client created successfully');

    // Test admin API access
    console.log('\n👥 Testing admin.listUsers()...');
    const { data: authUsers, error: supabaseError } = await adminClient.auth.admin.listUsers();
    
    if (supabaseError) {
      console.log('❌ Admin API Error:');
      console.log('   Message:', supabaseError.message);
      console.log('   Status:', supabaseError.status);
      console.log('   Code:', supabaseError.code);
      
      if (supabaseError.message?.includes('JWT')) {
        console.log('\n💡 This looks like a JWT/Authentication issue. Check that:');
        console.log('   1. SUPABASE_SERVICE_ROLE_KEY is correct');
        console.log('   2. The service role key has admin privileges');
        console.log('   3. The key is not expired');
      }
      
      return;
    }

    console.log('✅ Successfully fetched user data');
    console.log(`📊 Found ${authUsers?.users?.length || 0} users`);
    
    if (authUsers?.users?.length > 0) {
      console.log('\n📋 Sample user data:');
      const sampleUser = authUsers.users[0];
      console.log('   User ID:', sampleUser.id);
      console.log('   Email:', sampleUser.email || 'No email');
      console.log('   Created:', sampleUser.created_at);
      console.log('   Metadata keys:', Object.keys(sampleUser.user_metadata || {}));
    }

  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
    console.log('Full error:', error);
  }
}

// Run the debug script
debugSupabaseAdmin();
