const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkToolEnforcementMode() {
  try {
    console.log('🔧 CHECKING TOOL ENFORCEMENT MODE');
    console.log('=================================');
    
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });
    
    if (!config) {
      console.log('❌ No AI configuration found');
      return;
    }
    
    console.log('🎯 Tool Enforcement Configuration:');
    console.log(`   toolEnforcementMode: ${config.toolEnforcementMode || 'FIELD NOT FOUND'}`);
    
    if (!config.toolEnforcementMode) {
      console.log('\n🔧 Field is missing! Setting to AUTO...');
      
      const updated = await prisma.aIConfiguration.update({
        where: { id: 'singleton' },
        data: {
          toolEnforcementMode: 'AUTO'
        }
      });
      
      console.log(`✅ Updated tool enforcement mode to: ${updated.toolEnforcementMode}`);
    } else {
      console.log(`✅ Current mode: ${config.toolEnforcementMode}`);
    }
    
    // Also check what the system actually receives in the Gemini function
    console.log('\n📋 All Configuration Fields:');
    Object.keys(config).forEach(key => {
      console.log(`   ${key}: ${config[key]}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkToolEnforcementMode();
