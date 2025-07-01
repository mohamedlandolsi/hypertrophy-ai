/**
 * Test script to demonstrate enhanced information extraction with LLM function calling
 * 
 * This script tests the new LLM-based information extraction vs the old regex-based approach
 */

const { sendToGemini, formatConversationForGemini } = require('./src/lib/gemini');
const { getClientMemory, generateMemorySummary, extractAndSaveInformationLegacy } = require('./src/lib/client-memory');

// Test cases that demonstrate the superiority of LLM function calling
const testCases = [
  {
    name: "Complex natural language with multiple data points",
    message: "Hi! I'm John, I'm 28 years old and weigh about 75 kilograms. I'm pretty new to lifting but I've been going to the gym for 3 times a week for the past month. My main goal is to build muscle mass, especially in my upper body since I feel like my shoulders and arms are quite weak. I have access to a full gym with all the equipment."
  },
  {
    name: "Casual conversation with embedded information",
    message: "Yeah so I mentioned I'm trying to bulk up right? I currently can bench around 60kg for my 1RM, which feels pretty weak for someone my size. I'm also dealing with some lower back issues from sitting at a desk all day - nothing serious but it gets tight. I usually get about 7 hours of sleep and work a pretty standard 9-5 office job."
  },
  {
    name: "Mixed units and informal language",
    message: "I'm 5'10\" tall and trying to get from my current 165 lbs to maybe 180 lbs. I've got dumbbells at home up to 50 lbs each, plus a pull-up bar. Been training for like 2 years on and off, so I'd say I'm somewhere between beginner and intermediate level."
  },
  {
    name: "Updates and corrections",
    message: "Actually, I need to correct something - I'm actually 29 now, just had my birthday last week! And I've been more consistent lately, training 4 days per week instead of 3. My squat has improved too - I can do 80kg now for my max."
  },
  {
    name: "Health and lifestyle information",
    message: "I should mention I'm lactose intolerant so I can't have regular whey protein. I also take creatine daily and a multivitamin. My stress levels have been pretty high lately due to work deadlines, which I know isn't great for recovery."
  }
];

async function testExtraction() {
  console.log('🧪 Testing Enhanced Information Extraction with LLM Function Calling\n');
  console.log('This test demonstrates how LLM function calling provides more robust and flexible');
  console.log('information extraction compared to rigid regex patterns.\n');
  
  // Use a test user ID
  const testUserId = 'test-user-123';
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Test ${i + 1}: ${testCase.name}`);
    console.log(`${'='.repeat(80)}`);
    console.log(`\n📝 User Message:`);
    console.log(`"${testCase.message}"\n`);
    
    try {
      // Test the new LLM function calling approach
      console.log('🤖 Testing Enhanced LLM Function Calling Extraction...');
      
      const conversation = formatConversationForGemini([
        { role: 'USER', content: testCase.message }
      ]);
      
      // This will now use function calling to extract information
      const aiResponse = await sendToGemini(conversation, testUserId);
      
      console.log('✅ LLM Response received (with function calling)');
      console.log('📊 Response preview:', aiResponse.substring(0, 150) + '...');
      
      // Show what was extracted
      const memorySummary = await generateMemorySummary(testUserId);
      console.log('\n📋 Current Client Memory:');
      console.log(memorySummary);
      
      // For comparison, test the old regex approach
      console.log('\n🔍 Comparing with Legacy Regex Extraction...');
      const legacyUpdates = await extractAndSaveInformationLegacy(testUserId + '-legacy', testCase.message);
      
      console.log('📊 Legacy Regex Extracted:');
      if (Object.keys(legacyUpdates).length > 0) {
        Object.entries(legacyUpdates).forEach(([key, value]) => {
          console.log(`  - ${key}: ${Array.isArray(value) ? value.join(', ') : value}`);
        });
      } else {
        console.log('  - No information extracted by regex patterns');
      }
      
    } catch (error) {
      console.error('❌ Error during test:', error.message);
    }
    
    console.log('\n⏳ Waiting 2 seconds before next test...');
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log(`\n${'='.repeat(80)}`);
  console.log('🎉 Test Complete!');
  console.log(`${'='.repeat(80)}`);
  console.log('\n✨ Key Benefits of LLM Function Calling:');
  console.log('1. 🎯 More accurate extraction from natural language');
  console.log('2. 🔄 Handles complex, multi-part information in single messages');
  console.log('3. 🌍 Better handling of different units and formats');
  console.log('4. 🧠 Contextual understanding vs rigid pattern matching');
  console.log('5. 🚀 Extensible - easily add new information types');
  console.log('6. 🛡️ Fallback to regex if function calling fails');
  
  console.log('\n📝 Final Client Memory Summary:');
  try {
    const finalMemory = await generateMemorySummary(testUserId);
    console.log(finalMemory);
  } catch (error) {
    console.error('Error getting final memory:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testExtraction()
    .then(() => {
      console.log('\n✅ Test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testExtraction };
