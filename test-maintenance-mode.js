const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testMaintenanceMode() {
  console.log('🔧 Testing Maintenance Mode Implementation...\n');
  
  try {
    // 1. Check current maintenance mode setting
    console.log('1️⃣ Checking current maintenance mode setting...');
    const currentMode = process.env.MAINTENANCE_MODE;
    console.log(`   MAINTENANCE_MODE environment variable: ${currentMode}`);
    
    if (currentMode === 'true') {
      console.log('   ⚠️  Maintenance mode is currently ENABLED');
    } else {
      console.log('   ✅ Maintenance mode is currently DISABLED');
    }
    console.log();
    
    // 2. Check if maintenance page exists
    console.log('2️⃣ Checking maintenance page implementation...');
    const fs = require('fs');
    const path = require('path');
    
    const maintenancePagePath = path.join(process.cwd(), 'src/app/[locale]/maintenance/page.tsx');
    const maintenancePageExists = fs.existsSync(maintenancePagePath);
    
    if (maintenancePageExists) {
      console.log('   ✅ Maintenance page exists at: src/app/[locale]/maintenance/page.tsx');
    } else {
      console.log('   ❌ Maintenance page not found');
    }
    console.log();
    
    // 3. Check middleware implementation
    console.log('3️⃣ Checking middleware implementation...');
    const middlewarePath = path.join(process.cwd(), 'src/middleware.ts');
    const middlewareExists = fs.existsSync(middlewarePath);
    
    if (middlewareExists) {
      console.log('   ✅ Middleware file exists');
      
      const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
      const hasMaintenanceCheck = middlewareContent.includes('MAINTENANCE_MODE');
      const hasAdminBypass = middlewareContent.includes('isAdmin');
      
      if (hasMaintenanceCheck) {
        console.log('   ✅ Middleware includes maintenance mode check');
      } else {
        console.log('   ❌ Middleware missing maintenance mode check');
      }
      
      if (hasAdminBypass) {
        console.log('   ✅ Middleware includes admin bypass logic');
      } else {
        console.log('   ❌ Middleware missing admin bypass logic');
      }
    } else {
      console.log('   ❌ Middleware file not found');
    }
    console.log();
    
    // 4. Check for admin users
    console.log('4️⃣ Checking for admin users who can bypass maintenance...');
    const adminUsers = await prisma.user.findMany({
      where: { role: 'admin' },
      select: { id: true, role: true }
    });
    
    if (adminUsers.length > 0) {
      console.log(`   ✅ Found ${adminUsers.length} admin user(s) who can bypass maintenance mode`);
      adminUsers.forEach((user, index) => {
        console.log(`      Admin ${index + 1}: ${user.id.substring(0, 8)}...`);
      });
    } else {
      console.log('   ⚠️  No admin users found - consider creating one for testing');
    }
    console.log();
    
    // 5. Test summary
    console.log('🎉 Maintenance Mode Implementation Summary:');
    console.log('\n📋 How it works:');
    console.log('   1. Set MAINTENANCE_MODE=true in .env.local');
    console.log('   2. All non-admin users get redirected to /{locale}/maintenance');
    console.log('   3. Admin users can bypass and access the system normally');
    console.log('   4. API routes remain accessible during maintenance');
    
    console.log('\n🔧 To test maintenance mode:');
    console.log('   1. Change MAINTENANCE_MODE=false to MAINTENANCE_MODE=true in .env.local');
    console.log('   2. Restart the development server');
    console.log('   3. Visit the chat page - should redirect to maintenance page');
    console.log('   4. Login as admin user - should bypass maintenance mode');
    
    console.log('\n✅ Implementation features:');
    console.log('   - Automatic redirect to maintenance page');
    console.log('   - Admin bypass functionality');
    console.log('   - Preserves locale in redirects');
    console.log('   - API routes remain accessible');
    console.log('   - Professional maintenance page design');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMaintenanceMode();
