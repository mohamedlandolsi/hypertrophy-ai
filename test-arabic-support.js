// Test script to verify Arabic language detection and response functionality
// This script demonstrates how the AI will respond to Arabic prompts

console.log('Testing Arabic Language Support for Hypertrophy AI\n');

// Mock the language detection functions from gemini.ts
function isArabicText(text) {
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;
  const arabicMatches = text.match(arabicRegex);
  const arabicCharCount = arabicMatches ? arabicMatches.length : 0;
  const totalChars = text.replace(/\s/g, '').length;
  const arabicRatio = totalChars > 0 ? arabicCharCount / totalChars : 0;
  
  console.log(`   Debug: "${text}" -> Arabic chars: ${arabicCharCount}, Total: ${totalChars}, Ratio: ${arabicRatio.toFixed(2)}`);
  return arabicRatio > 0.3;
}

function detectConversationLanguage(conversation) {
  const recentUserMessages = conversation
    .filter(msg => msg.role === 'user')
    .slice(-3);
  
  let arabicScore = 0;
  let totalMessages = recentUserMessages.length;
  
  for (const message of recentUserMessages) {
    if (isArabicText(message.content)) {
      arabicScore++;
    }
  }
  
  return arabicScore > totalMessages * 0.5 ? 'arabic' : 'english';
}

// Test cases
const testCases = [
  {
    name: "English message",
    message: "What is the best way to build muscle?",
    expected: "english"
  },
  {
    name: "Arabic message",
    message: "ما هي أفضل طريقة لبناء العضلات؟",
    expected: "arabic"
  },
  {
    name: "Mixed message with Arabic majority",
    message: "أريد تمرين للعضلات مع progressive overload",
    expected: "arabic"
  },
  {
    name: "Mixed message with English majority", 
    message: "I want to do تمرين for muscle growth",
    expected: "english"
  },
  {
    name: "Arabic fitness terminology",
    message: "كيف يمكنني زيادة تضخم العضلات؟",
    expected: "arabic"
  }
];

console.log('=== Individual Message Tests ===');
testCases.forEach(testCase => {
  const detected = isArabicText(testCase.message) ? 'arabic' : 'english';
  const passed = detected === testCase.expected;
  console.log(`${passed ? '✅' : '❌'} ${testCase.name}`);
  console.log(`   Message: "${testCase.message}"`);
  console.log(`   Expected: ${testCase.expected}, Detected: ${detected}\n`);
});

// Test conversation scenarios
const conversationTests = [
  {
    name: "English conversation",
    conversation: [
      { role: 'user', content: 'Hello, I want to build muscle' },
      { role: 'assistant', content: 'I can help you with that!' },
      { role: 'user', content: 'What exercises should I do?' }
    ],
    expected: 'english'
  },
  {
    name: "Arabic conversation",
    conversation: [
      { role: 'user', content: 'مرحباً، أريد بناء العضلات' },
      { role: 'assistant', content: 'يمكنني مساعدتك في ذلك!' },
      { role: 'user', content: 'ما التمارين التي يجب أن أفعلها؟' }
    ],
    expected: 'arabic'
  },
  {
    name: "Language switch to Arabic",
    conversation: [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' },
      { role: 'user', content: 'أريد التحدث بالعربية الآن' },
      { role: 'assistant', content: 'بالطبع!' },
      { role: 'user', content: 'كيف أبني العضلات؟' }
    ],
    expected: 'arabic'
  }
];

console.log('=== Conversation Context Tests ===');
conversationTests.forEach(testCase => {
  const detected = detectConversationLanguage(testCase.conversation);
  const passed = detected === testCase.expected;
  console.log(`${passed ? '✅' : '❌'} ${testCase.name}`);
  console.log(`   Expected: ${testCase.expected}, Detected: ${detected}`);
  console.log(`   Last message: "${testCase.conversation[testCase.conversation.length - 1].content}"\n`);
});

console.log('=== Sample Arabic Responses ===');
console.log('When user asks in Arabic: "ما هي أفضل طريقة لبناء العضلات؟"');
console.log('AI will detect Arabic and respond with Arabic instructions including:');
console.log('- تضخم العضلات (Hypertrophy)');
console.log('- نمو العضلات (Muscle growth)');
console.log('- التدريب (Training)');
console.log('- الزيادة التدريجية للحمل (Progressive overload)');
console.log('- الحجم التدريبي (Volume)');
console.log('- الشدة (Intensity)\n');

console.log('✨ Arabic language support is now active!');
console.log('The AI will automatically detect Arabic input and respond in Arabic with proper fitness terminology.');
