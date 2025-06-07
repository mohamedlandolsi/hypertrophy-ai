// Test script to verify Supabase connection and auth
// Run this in browser console on your app to test

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  
  // Test environment variables
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not found');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not found');
  console.log('NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL || 'Not found');
  
  // Test if we can create a Supabase client
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    console.log('✅ Supabase client created successfully');
    
    // Test getting current user
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.log('❌ Error getting user:', error.message);
    } else {
      console.log('✅ User check successful:', user ? `Logged in as ${user.email}` : 'No user logged in');
    }
    
    return supabase;
  } catch (error) {
    console.error('❌ Error creating Supabase client:', error);
    return null;
  }
}

// Run the test
testSupabaseConnection();
