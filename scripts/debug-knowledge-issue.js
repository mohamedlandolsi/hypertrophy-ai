const { PrismaClient } = require('@prisma/client');

async function debugKnowledgeIssueFix() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Debugging knowledge items issue...');
    
    // Check which users are admin
    const adminUsers = await prisma.user.findMany({
      where: { role: 'admin' },
      select: { id: true, role: true }
    });
    
    console.log(`👑 Found ${adminUsers.length} admin users:`);
    adminUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.id} (${user.role})`);
    });
    
    // Check knowledge items ownership
    const knowledgeItemsOwnership = await prisma.knowledgeItem.groupBy({
      by: ['userId'],
      _count: {
        id: true
      }
    });
    
    console.log('\n📊 Knowledge items by user:');
    for (const ownership of knowledgeItemsOwnership) {
      const user = await prisma.user.findUnique({
        where: { id: ownership.userId },
        select: { id: true, role: true }
      });
      console.log(`   ${ownership.userId} (${user?.role || 'unknown'}): ${ownership._count.id} items`);
    }
    
    // Check if the main knowledge owner is an admin
    const mainOwner = '3e9ab191-e4e9-4eb4-a8eb-e95cbc39c7ba';
    const mainOwnerDetails = await prisma.user.findUnique({
      where: { id: mainOwner },
      select: { id: true, role: true }
    });
    
    console.log(`\n🎯 Main knowledge owner (${mainOwner}):`);
    if (mainOwnerDetails) {
      console.log(`   Role: ${mainOwnerDetails.role}`);
      console.log(`   Is Admin: ${mainOwnerDetails.role === 'admin' ? 'YES' : 'NO'}`);
    } else {
      console.log('   User not found in database!');
    }
    
    // Solution analysis
    console.log('\n💡 Issue Analysis:');
    console.log('1. Knowledge items are user-specific (userId field)');
    console.log('2. Admin page checks admin role via /api/admin/config');
    console.log('3. Knowledge API (/api/knowledge) returns items for authenticated user only');
    console.log('4. If admin user is different from knowledge owner, no items will show');
    
    // Check if we need to update the main owner to admin
    if (mainOwnerDetails && mainOwnerDetails.role !== 'admin') {
      console.log('\n🔧 RECOMMENDED FIX:');
      console.log(`Make user ${mainOwner} an admin since they own all knowledge items`);
      console.log('Or: Update knowledge items to belong to an admin user');
    } else if (!mainOwnerDetails) {
      console.log('\n⚠️ CRITICAL ISSUE:');
      console.log('Knowledge items belong to a user that doesn\'t exist in the database!');
    } else {
      console.log('\n✅ Knowledge owner is already an admin');
      console.log('Issue might be elsewhere - check authentication flow');
    }
    
    return { adminUsers, knowledgeItemsOwnership, mainOwnerDetails };
    
  } catch (error) {
    console.error('❌ Error debugging knowledge issue:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the debug
debugKnowledgeIssueFix()
  .then(() => {
    console.log('\n✅ Debug completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Debug failed:', error);
    process.exit(1);
  });
