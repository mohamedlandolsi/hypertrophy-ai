const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');

const prisma = new PrismaClient();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function makeCurrentUserAdmin() {
  try {
    console.log('🔧 Making current user admin...\n');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.log('❌ Missing Supabase environment variables');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the most recent user (likely you)
    const recentUsers = await prisma.user.findMany({
      where: {
        hasCompletedOnboarding: true
      },
      orderBy: {
        id: 'desc'
      },
      take: 5,
      select: {
        id: true,
        role: true,
        hasCompletedOnboarding: true,
        plan: true
      }
    });

    console.log('Recent onboarded users:');
    recentUsers.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id} - Role: ${user.role} - Plan: ${user.plan}`);
    });

    if (recentUsers.length === 0) {
      console.log('❌ No onboarded users found');
      return;
    }

    // Make the first onboarded user an admin (most likely you)
    const userToPromote = recentUsers[0];
    
    if (userToPromote.role === 'admin') {
      console.log(`✅ User ${userToPromote.id} is already an admin`);
      return;
    }

    // Update the user to admin
    await prisma.user.update({
      where: { id: userToPromote.id },
      data: { role: 'admin' }
    });

    console.log(`✅ Successfully made user ${userToPromote.id} an admin`);

    // Verify by checking auth user details
    const { data: authUsers, error } = await supabase.auth.admin.listUsers();
    if (!error) {
      const authUser = authUsers.users.find(u => u.id === userToPromote.id);
      if (authUser) {
        console.log(`📧 Admin user email: ${authUser.email}`);
        console.log(`🆔 Admin user ID: ${authUser.id}`);
        console.log('\n🎯 You can now login with this email and access the admin panel!');
      }
    }

  } catch (error) {
    console.error('❌ Error making user admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

makeCurrentUserAdmin();
