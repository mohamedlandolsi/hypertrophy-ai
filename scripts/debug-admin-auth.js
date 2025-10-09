const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');

const prisma = new PrismaClient();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function debugAdminAuth() {
  try {
    console.log('🔍 Debugging Admin Authentication...\n');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.log('❌ Missing Supabase environment variables');
      console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
      console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Check if we have any users
    console.log('1. Checking all users in database...');
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        role: true,
        hasCompletedOnboarding: true,
        plan: true
      }
    });

    console.log(`Found ${allUsers.length} users:`);
    allUsers.forEach(user => {
      console.log(`  - ID: ${user.id} - Role: ${user.role} - Plan: ${user.plan} - Onboarded: ${user.hasCompletedOnboarding}`);
    });

    // 2. Check specifically for admin users
    console.log('\n2. Checking for admin users...');
    const adminUsers = await prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        role: true,
        hasCompletedOnboarding: true
      }
    });

    if (adminUsers.length === 0) {
      console.log('❌ No admin users found!');
      console.log('Creating an admin user for testing...');
      
      // Get the first user and make them admin
      if (allUsers.length > 0) {
        const firstUser = allUsers[0];
        await prisma.user.update({
          where: { id: firstUser.id },
          data: { role: 'admin' }
        });
        console.log(`✅ Made user ${firstUser.id} an admin`);
      } else {
        console.log('❌ No users exist to promote to admin');
      }
    } else {
      console.log(`✅ Found ${adminUsers.length} admin users:`);
      adminUsers.forEach(admin => {
        console.log(`  - ID: ${admin.id}`);
      });
    }

    // 3. Check Supabase auth users
    console.log('\n3. Checking Supabase auth users...');
    const { data: authUsers, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.log('❌ Error fetching Supabase users:', error.message);
    } else {
      console.log(`Found ${authUsers.users.length} Supabase auth users:`);
      authUsers.users.forEach(user => {
        console.log(`  - ${user.email} (ID: ${user.id})`);
      });
    }

    // 4. Check for auth/database sync issues
    console.log('\n4. Checking for auth/database sync...');
    if (authUsers && !error) {
      for (const authUser of authUsers.users) {
        const dbUser = await prisma.user.findUnique({
          where: { id: authUser.id },
          select: { id: true, role: true }
        });
        
        if (!dbUser) {
          console.log(`⚠️  Auth user ${authUser.email} (${authUser.id}) not found in database`);
        } else {
          console.log(`✅ Auth user ${authUser.email} synced with database (Role: ${dbUser.role})`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error debugging admin auth:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAdminAuth();
