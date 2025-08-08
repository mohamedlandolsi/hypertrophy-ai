const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testFreeMessagesImplementation() {
  try {
    console.log('🧪 Testing Free Messages Implementation...\n');
    
    // Test 1: Check database schema
    console.log('1️⃣ Testing database schema...');
    const sampleUser = await prisma.user.findFirst({
      select: {
        id: true,
        freeMessagesRemaining: true,
        messagesUsedToday: true,
        plan: true,
      }
    });
    
    if (sampleUser) {
      console.log('✅ Database schema updated successfully');
      console.log(`   Sample user: ${sampleUser.id}`);
      console.log(`   Free messages remaining: ${sampleUser.freeMessagesRemaining}`);
      console.log(`   Messages used today: ${sampleUser.messagesUsedToday}`);
      console.log(`   Plan: ${sampleUser.plan}`);
    } else {
      console.log('❌ No users found in database');
    }
    
    // Test 2: Check all users have free messages
    console.log('\n2️⃣ Checking all users have free messages...');
    const userStats = await prisma.user.groupBy({
      by: ['freeMessagesRemaining'],
      _count: true,
      orderBy: {
        freeMessagesRemaining: 'asc'
      }
    });
    
    console.log('📊 Free messages distribution:');
    userStats.forEach(stat => {
      console.log(`   ${stat.freeMessagesRemaining} free messages: ${stat._count} users`);
    });
    
    // Test 3: Simulate message consumption logic
    console.log('\n3️⃣ Testing message consumption logic...');
    
    if (sampleUser) {
      const originalFreeMessages = sampleUser.freeMessagesRemaining;
      const originalMessagesUsed = sampleUser.messagesUsedToday;
      
      console.log(`   Before: ${originalFreeMessages} free, ${originalMessagesUsed} used today`);
      
      // Simulate sending a message (free message consumption)
      if (originalFreeMessages > 0) {
        await prisma.user.update({
          where: { id: sampleUser.id },
          data: {
            freeMessagesRemaining: {
              decrement: 1,
            },
          },
        });
        console.log('   ✅ Free message consumed successfully');
        
        // Check result
        const updatedUser = await prisma.user.findUnique({
          where: { id: sampleUser.id },
          select: {
            freeMessagesRemaining: true,
            messagesUsedToday: true,
          }
        });
        
        console.log(`   After: ${updatedUser.freeMessagesRemaining} free, ${updatedUser.messagesUsedToday} used today`);
        
        // Restore the original state
        await prisma.user.update({
          where: { id: sampleUser.id },
          data: {
            freeMessagesRemaining: originalFreeMessages,
            messagesUsedToday: originalMessagesUsed,
          },
        });
        console.log('   ↩️ State restored');
      } else {
        console.log('   ⚠️ No free messages to test consumption');
      }
    }
    
    // Test 4: Check migration was successful
    console.log('\n4️⃣ Verifying migration success...');
    const totalUsers = await prisma.user.count();
    const usersWithFreeMessages = await prisma.user.count({
      where: {
        freeMessagesRemaining: {
          gte: 0
        }
      }
    });
    
    console.log(`   Total users: ${totalUsers}`);
    console.log(`   Users with free messages field: ${usersWithFreeMessages}`);
    
    if (totalUsers === usersWithFreeMessages) {
      console.log('   ✅ All users have the free messages field');
    } else {
      console.log('   ❌ Some users missing free messages field');
    }
    
    console.log('\n🎉 Free messages implementation test completed!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testFreeMessagesImplementation();
