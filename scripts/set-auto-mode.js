const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setToolEnforcementToAuto() {
  try {
    console.log('🔧 SETTING TOOL ENFORCEMENT TO AUTO MODE');
    console.log('========================================');
    
    // Update the existing configuration to AUTO mode
    const result = await prisma.aIConfiguration.upsert({
      where: { id: 'singleton' },
      update: { 
        toolEnforcementMode: 'AUTO',
        updatedAt: new Date()
      },
      create: {
        id: 'singleton',
        toolEnforcementMode: 'AUTO'
      }
    });
    
    console.log('✅ Tool enforcement mode set to AUTO');
    console.log(`   Updated configuration: ${result.id}`);
    console.log(`   Mode: ${result.toolEnforcementMode}`);
    console.log(`   Updated at: ${result.updatedAt}`);
    
    console.log('\n🎯 BEHAVIOR CHANGES:');
    console.log('   - When knowledge base has content: AI will prioritize it');
    console.log('   - When knowledge base is empty: AI will use general expertise');
    console.log('   - No more refusals for supplement/general questions');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setToolEnforcementToAuto();
