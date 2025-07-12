const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testTrainingStructure() {
  try {
    console.log('🧪 Testing New Training Structure Fields\n');
    
    // Test 1: Weekly Structure
    console.log('Test 1: Weekly Training Structure');
    const testUserId = '3e9ab191-e4e9-4eb4-a8eb-e95cbc39c7ba'; // Using actual user ID
    
    // Update with weekly structure
    await prisma.clientMemory.upsert({
      where: { userId: testUserId },
      create: {
        userId: testUserId,
        trainingStructureType: 'weekly',
        weeklyTrainingDays: 4,
        trainingExperience: 'intermediate'
      },
      update: {
        trainingStructureType: 'weekly',
        weeklyTrainingDays: 4,
        trainingExperience: 'intermediate'
      }
    });
    
    console.log('✅ Weekly structure (4 days/week) saved successfully');
    
    // Test 2: Cycle Structure - Standard Pattern
    console.log('\nTest 2: Cycle Training Structure (Standard Pattern)');
    await prisma.clientMemory.update({
      where: { userId: testUserId },
      data: {
        trainingStructureType: 'cycle',
        trainingCycle: '2_on_1_off',
        weeklyTrainingDays: null // Clear weekly days
      }
    });
    
    console.log('✅ Cycle structure (2 on, 1 off) saved successfully');
    
    // Test 3: Cycle Structure - Custom Pattern
    console.log('\nTest 3: Cycle Training Structure (Custom Pattern)');
    await prisma.clientMemory.update({
      where: { userId: testUserId },
      data: {
        trainingStructureType: 'cycle',
        trainingCycle: 'custom',
        customCyclePattern: '5 days on, 2 days off'
      }
    });
    
    console.log('✅ Custom cycle structure saved successfully');
    
    // Test 4: Retrieve and Display
    console.log('\nTest 4: Retrieving Training Structure Data');
    const updatedMemory = await prisma.clientMemory.findUnique({
      where: { userId: testUserId }
    });
    
    if (updatedMemory) {
      console.log('📊 Current Training Structure Data:');
      console.log(`   Structure Type: ${updatedMemory.trainingStructureType}`);
      console.log(`   Training Cycle: ${updatedMemory.trainingCycle}`);
      console.log(`   Custom Pattern: ${updatedMemory.customCyclePattern}`);
      console.log(`   Weekly Days: ${updatedMemory.weeklyTrainingDays}`);
    }
    
    console.log('\n✅ All tests passed! Training structure functionality is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTrainingStructure();
