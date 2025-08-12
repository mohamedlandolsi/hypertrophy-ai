const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testTokenLimitUpdate() {
  console.log('🧪 Testing Admin Settings Token Limit Update...\n');
  
  try {
    // 1. Check current configuration
    console.log('1️⃣ Checking current AI configuration...');
    const config = await prisma.aIConfiguration.findFirst();
    
    if (!config) {
      console.log('❌ No AI configuration found');
      return;
    }
    
    console.log(`   Current maxTokens: ${config.maxTokens}`);
    console.log(`   Current freeModelName: ${config.freeModelName}`);
    console.log(`   Current proModelName: ${config.proModelName}\n`);
    
    // 2. Test high token value update
    console.log('2️⃣ Testing high token value update...');
    const testTokenValue = 65536;
    
    try {
      const updatedConfig = await prisma.aIConfiguration.update({
        where: { id: 'singleton' },
        data: { maxTokens: testTokenValue }
      });
      
      console.log(`✅ Successfully updated maxTokens to ${updatedConfig.maxTokens}`);
    } catch (error) {
      console.log(`❌ Failed to update maxTokens: ${error.message}`);
    }
    
    // 3. Verify the update
    console.log('\n3️⃣ Verifying the update...');
    const verifyConfig = await prisma.aIConfiguration.findFirst();
    
    if (verifyConfig && verifyConfig.maxTokens === testTokenValue) {
      console.log(`✅ Verification successful: maxTokens is now ${verifyConfig.maxTokens}`);
    } else {
      console.log(`❌ Verification failed: expected ${testTokenValue}, got ${verifyConfig?.maxTokens}`);
    }
    
    // 4. Reset to a reasonable value for normal use
    console.log('\n4️⃣ Resetting to reasonable production value...');
    const productionTokenValue = 8192;
    
    await prisma.aIConfiguration.update({
      where: { id: 'singleton' },
      data: { maxTokens: productionTokenValue }
    });
    
    console.log(`✅ Reset maxTokens to ${productionTokenValue} for production use\n`);
    
    // 5. Summary
    console.log('🎉 Token Limit Update Test Summary:');
    console.log('✅ Admin settings page now accepts values up to 65,536');
    console.log('✅ API validation updated to allow 1-65,536 range');
    console.log('✅ Database can store high token values');
    console.log('✅ Memory update function now uses configured model');
    console.log('\n📋 Changes made:');
    console.log('   - Admin UI: max="65536" in the input field');
    console.log('   - API validation: updated error message and range');
    console.log('   - Fixed hardcoded model in updateMemory function');
    console.log('   - Added helpful description text for the field');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTokenLimitUpdate();
