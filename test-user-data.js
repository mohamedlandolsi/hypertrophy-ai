// Test script to verify user data API
import { createClient } from '@supabase/supabase-js';

async function testUserData() {
  console.log('🔍 Testing user data API...');
  
  // Test the admin client
  try {
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
    
    // Test listing users
    const { data: authUsers, error } = await adminClient.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ Supabase admin API error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return;
    }
    
    console.log('✅ Successfully fetched users from Supabase');
    console.log(`📊 Found ${authUsers.users.length} users`);
    
    // Display user data
    authUsers.users.forEach((user, index) => {
      console.log(`\n👤 User ${index + 1}:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Display Name: ${user.user_metadata?.display_name || 'Not set'}`);
      console.log(`   Full Name: ${user.user_metadata?.full_name || 'Not set'}`);
      console.log(`   Avatar URL: ${user.user_metadata?.avatar_url || 'Not set'}`);
      console.log(`   Email Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
      console.log(`   Created: ${new Date(user.created_at).toLocaleDateString()}`);
      console.log(`   Last Sign In: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}`);
    });
    
  } catch (error) {
    console.error('❌ Error testing user data:', error);
  }
}

testUserData();
