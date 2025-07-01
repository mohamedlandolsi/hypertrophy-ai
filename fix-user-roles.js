const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');

const prisma = new PrismaClient();

// You need to add your Supabase project details here
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // You need to add this to your .env

async function fixUserRoles() {
  try {
    if (!supabaseServiceKey) {
      console.log('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env file');
      console.log('Please add your Supabase service role key to your .env file:');
      console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('🔍 Fetching all Supabase auth users...');
    
    // Get all users from Supabase auth
    const { data: authUsers, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('Error fetching auth users:', error);
      return;
    }
    
    console.log(`Found ${authUsers.users.length} auth users`);
    
    // Get all users from Prisma database
    const dbUsers = await prisma.user.findMany();
    console.log(`Found ${dbUsers.length} database users`);
    
    for (const authUser of authUsers.users) {
      console.log(`\n👤 Processing user: ${authUser.email} (ID: ${authUser.id})`);
      
      // Check if user exists in database
      const existingDbUser = await prisma.user.findUnique({
        where: { id: authUser.id }
      });
      
      if (existingDbUser) {
        console.log(`✅ User exists in database with role: ${existingDbUser.role}`);
        
        // Ask if they want to make this user admin
        if (existingDbUser.role !== 'admin') {
          console.log(`❓ Would you like to make ${authUser.email} an admin?`);
          console.log(`   Run: UPDATE "User" SET role = 'admin' WHERE id = '${authUser.id}';`);
        }
      } else {
        console.log(`❌ User does not exist in database. Creating...`);
        
        // Create user in database
        const newUser = await prisma.user.create({
          data: {
            id: authUser.id, // Use the exact Supabase auth ID
            role: 'user' // Default role
          }
        });
        
        console.log(`✅ Created user in database with role: ${newUser.role}`);
        console.log(`❓ Would you like to make ${authUser.email} an admin?`);
        console.log(`   Run: UPDATE "User" SET role = 'admin' WHERE id = '${authUser.id}';`);
      }
    }
    
    console.log('\n🔧 If you want to make a user admin, you can run:');
    console.log('   npx prisma studio');
    console.log('   Or update directly in the database');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserRoles();
