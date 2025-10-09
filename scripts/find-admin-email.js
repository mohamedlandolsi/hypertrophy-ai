const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function findAdminEmail() {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) { 
    console.log('Error:', error); 
    return; 
  }
  
  const adminUser = data.users.find(u => u.id === '9104e76a-a73e-412b-b8d6-03064ce37347');
  if (adminUser) {
    console.log('🎯 Admin user details:');
    console.log('📧 Email:', adminUser.email);
    console.log('🆔 ID:', adminUser.id);
    console.log('\n✅ Log in with this email to access the admin panel!');
  } else {
    console.log('❌ Admin user not found in auth');
  }
}

findAdminEmail();
