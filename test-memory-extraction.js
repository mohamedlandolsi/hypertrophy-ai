/**
 * Test script for memory extraction functionality
 * Run with: node test-memory-extraction.js
 */

const { extractProfileInformation, extractImportantMemory } = require('./src/lib/ai/memory-extractor.ts');

async function testMemoryExtraction() {
  console.log('🧪 Testing Memory Extraction Functionality...\n');

  // Test case 1: Profile information extraction
  const userMessage1 = "I'm John, 25 years old, 180cm tall and I weigh 75kg. I want to build muscle and I'm a beginner. I can train 4 days per week.";
  const aiResponse1 = "Great John! Based on your profile - 25 years old, 180cm, 75kg, beginner level - I'll create a 4-day training program focused on muscle building.";

  console.log('📋 Test 1: Profile Information Extraction');
  console.log('User Message:', userMessage1);
  console.log('AI Response:', aiResponse1);
  
  try {
    const profileExtractions = await extractProfileInformation(userMessage1, aiResponse1, 'test-user');
    console.log('✅ Profile Extractions:', JSON.stringify(profileExtractions, null, 2));
  } catch (error) {
    console.error('❌ Profile extraction failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test case 2: Memory extraction
  const userMessage2 = "I really loved the upper/lower split you gave me last week. My shoulder has been feeling much better since I started doing the face pulls you recommended.";
  const aiResponse2 = "I'm glad to hear your shoulder is improving with the face pulls! That upper/lower split seems to be working well for you. Let's continue with that structure.";

  console.log('🧠 Test 2: Important Memory Extraction');
  console.log('User Message:', userMessage2);
  console.log('AI Response:', aiResponse2);
  
  try {
    const memoryExtractions = await extractImportantMemory(userMessage2, aiResponse2, 'test-user');
    console.log('✅ Memory Extractions:', JSON.stringify(memoryExtractions, null, 2));
  } catch (error) {
    console.error('❌ Memory extraction failed:', error.message);
  }

  console.log('\n🎉 Memory extraction testing completed!');
}

// Only run if this file is executed directly
if (require.main === module) {
  testMemoryExtraction().catch(console.error);
}

module.exports = { testMemoryExtraction };
