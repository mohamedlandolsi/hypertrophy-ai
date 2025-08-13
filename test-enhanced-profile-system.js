const { PrismaClient } = require('@prisma/client');

async function testEnhancedProfileSystem() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing Enhanced Profile Conflict Resolution System...\n');
    
    // Find a test user
    const user = await prisma.user.findFirst({
      where: { role: 'admin' }
    });
    
    if (!user) {
      console.log('❌ No admin user found for testing');
      return;
    }
    
    console.log(`👤 Testing with user: ${user.id}`);
    
    // Check current memory state
    const currentMemory = await prisma.clientMemory.findUnique({
      where: { userId: user.id }
    });
    
    console.log('\n📋 Current User Profile State:');
    if (currentMemory) {
      console.log(`- Weekly Training Days: ${currentMemory.weeklyTrainingDays || 'Not set'}`);
      console.log(`- Training Style: ${currentMemory.preferredTrainingStyle || 'Not set'}`);
      console.log(`- Primary Goal: ${currentMemory.primaryGoal || 'Not set'}`);
      console.log(`- Injuries: ${currentMemory.injuries ? currentMemory.injuries.join(', ') : 'None'}`);
      console.log(`- Equipment Available: ${currentMemory.equipmentAvailable ? currentMemory.equipmentAvailable.join(', ') : 'Not set'}`);
      console.log(`- Last Updated: ${currentMemory.updatedAt}`);
      console.log(`- Coaching Notes: ${currentMemory.coachingNotes ? JSON.stringify(currentMemory.coachingNotes, null, 2) : 'None'}`);
    } else {
      console.log('- No memory record found');
    }
    
    // Check if AI config has enhanced instructions
    const aiConfig = await prisma.aIConfiguration.findFirst();
    const hasEnhancedProtocol = aiConfig?.systemPrompt.includes('ENHANCED MEMORY UPDATE PROTOCOL');
    const hasFunctionCalling = aiConfig?.systemPrompt.includes('MANDATORY FUNCTION CALLING');
    
    console.log('\n✅ System Configuration Status:');
    console.log(`- Enhanced Memory Protocol: ${hasEnhancedProtocol ? '✅ Present' : '❌ Missing'}`);
    console.log(`- Function Calling Instructions: ${hasFunctionCalling ? '✅ Present' : '❌ Missing'}`);
    console.log(`- System Prompt Length: ${aiConfig?.systemPrompt.length} characters`);
    
    // Test function calling imports
    console.log('\n🔧 Testing Function Calling System...');
    try {
      const { functionDeclarations, handleProfileUpdate, handleConflictDetection } = require('./src/lib/function-calling');
      console.log(`✅ Function declarations loaded: ${functionDeclarations.length} functions`);
      console.log(`  - ${functionDeclarations.map(f => f.name).join(', ')}`);
      console.log('✅ Handler functions available');
      
      // Test function calling structure
      const updateFunc = functionDeclarations.find(f => f.name === 'updateClientProfile');
      const conflictFunc = functionDeclarations.find(f => f.name === 'detectProfileConflict');
      
      console.log('\n📋 Function Schemas:');
      console.log(`- updateClientProfile parameters: ${Object.keys(updateFunc.parameters.properties).length} fields`);
      console.log(`- detectProfileConflict parameters: ${Object.keys(conflictFunc.parameters.properties).length} fields`);
      
    } catch (error) {
      console.error('❌ Function calling system error:', error.message);
    }
    
    // Test scenarios that should trigger the enhanced system
    console.log('\n🧪 Profile Conflict Test Scenarios:');
    
    const testScenarios = [
      {
        name: "Training Frequency Conflict",
        currentValue: currentMemory?.weeklyTrainingDays || 3,
        userRequest: "I want a 5-day PPL x Upper/Lower split",
        expectedAction: "Should detect conflict and call detectProfileConflict function",
        conflictType: "training_frequency"
      },
      {
        name: "Exercise Preference Update", 
        userMessage: "I hate squats, they hurt my knees",
        expectedAction: "Should call updateClientProfile to add injury/limitation",
        newData: { injuries: ["knee pain with squats"], limitations: ["avoid squats"] }
      },
      {
        name: "Goal Change Detection",
        userMessage: "My new goal is to reach 180lbs by next summer",
        expectedAction: "Should call updateClientProfile to update goals",
        newData: { targetWeight: 82, primaryGoal: "reach 180lbs by summer" }
      },
      {
        name: "Equipment Access Change",
        userMessage: "I just got a home gym with dumbbells and a bench",
        expectedAction: "Should call updateClientProfile to update equipment",
        newData: { homeGym: true, equipmentAvailable: ["dumbbells", "bench"] }
      }
    ];
    
    testScenarios.forEach((scenario, index) => {
      console.log(`\n${index + 1}. ${scenario.name}`);
      if (scenario.currentValue !== undefined) {
        console.log(`   📊 Current: ${scenario.currentValue}`);
        console.log(`   💬 User Request: "${scenario.userRequest}"`);
        console.log(`   ⚠️ Conflict Type: ${scenario.conflictType}`);
      } else {
        console.log(`   💬 User Message: "${scenario.userMessage}"`);
        console.log(`   📝 Expected Data Update: ${JSON.stringify(scenario.newData)}`);
      }
      console.log(`   🎯 Expected Action: ${scenario.expectedAction}`);
    });
    
    console.log('\n💡 Testing Instructions:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Go to the chat interface');
    console.log('3. Try the test scenarios above');
    console.log('4. Monitor console logs for function calling activity');
    console.log('5. Check if profile updates are saved to database');
    
    console.log('\n🔍 What to Look For in Console Logs:');
    console.log('- "🛠️ Processing X function calls..." when functions are triggered');
    console.log('- "📞 Calling function: updateClientProfile" for profile updates');
    console.log('- "📞 Calling function: detectProfileConflict" for conflicts');
    console.log('- "🔄 Processing profile update for user:" for successful updates');
    console.log('- "⚠️ Conflict detected for user:" when conflicts are found');
    
    console.log('\n📊 Success Indicators:');
    console.log('✅ Functions are called automatically during conversations');
    console.log('✅ Profile conflicts are detected and logged');
    console.log('✅ User profile is updated with new information');
    console.log('✅ Coaching notes contain conflict/update history');
    console.log('✅ User confirmation is requested for major conflicts');
    
  } catch (error) {
    console.error('❌ Error testing system:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEnhancedProfileSystem();
