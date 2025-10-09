const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Initialize Supabase admin client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY // You'll need this in your .env file
    );

    console.log('Creating admin user...');

    // Create a user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@example.com', // Change this to your email
      password: 'admin123456', // Change this to a secure password
      email_confirm: true
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return;
    }

    console.log('Auth user created:', authUser.user.id);

    // Create the user record in your database with admin role
    const dbUser = await prisma.user.create({
      data: {
        id: authUser.user.id,
        role: 'admin'
      }
    });

    console.log('Database user created:', dbUser);
    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@example.com');
    console.log('Password: admin123456');
    console.log('You can now log in and access /admin/settings');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Alternative function to update existing user to admin
async function makeUserAdmin(userEmail) {
  try {
    console.log(`Making user ${userEmail} an admin...`);

    // Find the user in Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: users, error } = await supabase.auth.admin.listUsers();
    if (error) {
      console.error('Error listing users:', error);
      return;
    }

    const user = users.users.find(u => u.email === userEmail);
    if (!user) {
      console.error('User not found:', userEmail);
      return;
    }

    // Update the user role in your database
    const updatedUser = await prisma.user.upsert({
      where: { id: user.id },
      update: { role: 'admin' },
      create: { id: user.id, role: 'admin' }
    });

    console.log('✅ User updated to admin:', updatedUser);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Check command line arguments
const args = process.argv.slice(2);
if (args.length > 0) {
  const command = args[0];
  if (command === 'make-admin' && args[1]) {
    makeUserAdmin(args[1]);
  } else {
    console.log('Usage: node create-admin.js make-admin <email>');
  }
} else {
  createAdminUser();
}
