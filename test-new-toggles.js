const { PrismaClient } = require('@prisma/client');

async function testNewToggles() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Testing Tool Enforcement Mode and Strict Muscle Priority toggles...\n');

    // Get current AI configuration
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });

    if (!config) {
      console.log('❌ No AI configuration found. Creating default configuration...');
      const newConfig = await prisma.aIConfiguration.create({
        data: { id: 'singleton' }
      });
      console.log('✅ Default configuration created:', {
        toolEnforcementMode: newConfig.toolEnforcementMode,
        strictMusclePriority: newConfig.strictMusclePriority
      });
    } else {
      console.log('✅ Current AI configuration found:');
      console.log('   - Tool Enforcement Mode:', config.toolEnforcementMode);
      console.log('   - Strict Muscle Priority:', config.strictMusclePriority);
    }

    // Test updating the toggles
    console.log('\n🔄 Testing toggle updates...');
    
    const updatedConfig = await prisma.aIConfiguration.update({
      where: { id: 'singleton' },
      data: {
        toolEnforcementMode: 'ENABLED',
        strictMusclePriority: true
      }
    });

    console.log('✅ Successfully updated toggles:');
    console.log('   - Tool Enforcement Mode:', updatedConfig.toolEnforcementMode);
    console.log('   - Strict Muscle Priority:', updatedConfig.strictMusclePriority);

    // Test reverting
    const revertedConfig = await prisma.aIConfiguration.update({
      where: { id: 'singleton' },
      data: {
        toolEnforcementMode: 'AUTO',
        strictMusclePriority: false
      }
    });

    console.log('\n🔄 Successfully reverted toggles:');
    console.log('   - Tool Enforcement Mode:', revertedConfig.toolEnforcementMode);
    console.log('   - Strict Muscle Priority:', revertedConfig.strictMusclePriority);

    console.log('\n✅ All toggle tests passed! The new features are ready to use.');
    
  } catch (error) {
    console.error('❌ Error testing toggles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNewToggles();
