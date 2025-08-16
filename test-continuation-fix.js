// Test continuation message detection fix
console.log('🧪 Testing Continuation Message Detection Fix\n');

// Mock conversation history showing exercise discussion
const mockConversationHistory = [
  { role: 'user', content: 'Can you create a PPL x UL program for me?' },
  { 
    role: 'model', 
    content: `Here's your PPL x UL program:

**Day 1: Push (Chest, Shoulders, Triceps)**
1. Smith Machine Chest Press - 3 sets, 8-12 reps
2. Incline Dumbbell Press - 3 sets, 8-12 reps
3. Lateral Raises - 3 sets, 12-15 reps

**Day 2: Pull (Back, Biceps)**
1. Lat Pulldown - 3 sets, 8-12 reps
2. Chest Supported Row - 3 sets, 8-12 reps

**Day 3: Legs (Quads, Hams, Glutes, Calves)**
1. Smith Machine Squat - 2 sets, 5-10 reps` 
  }
];

// Mock the detection function
function isContinuingExerciseDiscussion(userMessage, conversationHistory) {
  // Check if user message indicates continuation
  const continuationKeywords = /\b(continue|finish|complete|more|next|rest of|keep going|go on)\b/i;
  const messageIndicatesContinuation = continuationKeywords.test(userMessage);
  
  if (!messageIndicatesContinuation) {
    return false;
  }
  
  // Check if recent conversation history contains exercise/workout content
  const recentMessages = conversationHistory.slice(-6); // Check last 6 messages
  const exerciseKeywords = /\b(exercise|workout|training|program|sets|reps|muscle|chest|back|legs|arms|shoulders|squat|press|row|curl|extension|fly|raise|deadlift)\b/i;
  
  return recentMessages.some(msg => 
    msg.role === 'model' && exerciseKeywords.test(msg.content)
  );
}

// Test cases
const testCases = [
  {
    userMessage: 'continue',
    expected: true,
    description: 'Simple continue request after exercise discussion'
  },
  {
    userMessage: 'can you finish the program?',
    expected: true,
    description: 'Request to finish program after exercise discussion'
  },
  {
    userMessage: 'tell me more about nutrition',
    expected: false,
    description: 'Non-continuation message (different topic)'
  },
  {
    userMessage: 'continue',
    conversationHistory: [{ role: 'user', content: 'How are you?' }, { role: 'model', content: 'I am fine, thank you!' }],
    expected: false,
    description: 'Continue request but no exercise context'
  }
];

console.log('📊 Testing continuation detection:');
console.log('─'.repeat(80));

testCases.forEach((testCase, index) => {
  const history = testCase.conversationHistory || mockConversationHistory;
  const result = isContinuingExerciseDiscussion(testCase.userMessage, history);
  const status = result === testCase.expected ? '✅' : '❌';
  
  console.log(`${index + 1}. ${status} "${testCase.userMessage}"`);
  console.log(`   Expected: ${testCase.expected}, Got: ${result}`);
  console.log(`   ${testCase.description}`);
  console.log('');
});

console.log('─'.repeat(80));
console.log('\n📋 Expected Behavior:');
console.log('   ✅ "continue" after exercise discussion → detected as continuation');
console.log('   ✅ Continuation provides softer context instead of claiming no exercises');
console.log('   ✅ Non-continuation messages work normally');
console.log('   ✅ AI told not to claim limitations when continuing exercise discussions');

console.log('\n🎯 This should fix the issue where AI claims no exercises exist when asked to continue a workout program.');
