// Test specific continuation scenario that was causing the issue
console.log('🧪 Testing PPL x UL Continuation Issue Fix\n');

// Mock the exact scenario from the user's issue
const scenarioHistory = [
  { 
    role: 'user', 
    content: 'Can you create a PPL x UL program for me?' 
  },
  { 
    role: 'model', 
    content: `Here's your PPL x UL program:

**Day 1: Push Workout (Chest, Shoulders, Triceps)**

| Exercise | Sets | Reps |
|----------|------|------|
| Smith Machine Chest Press | 3 | 8-12 |
| Incline Dumbbell Press | 3 | 8-12 |
| Lateral Raises | 3 | 12-15 |

**Day 2: Pull Workout (Back, Biceps)**
| Exercise | Sets | Reps |
|----------|------|------|
| Lat Pulldown | 3 | 8-12 |
| Chest Supported Row | 3 | 8-12 |

**Day 6: Lower Workout**
This second lower body session provides additional volume and a different stimulus for your quads, hamstrings, glutes, calves, and abs.

| Exercise | Sets | Reps |
|----------|------|------|
| Smith Machine Squat | 2 | 5-10 |`
  }
];

// Test the continuation context logic
function testContinuationContext() {
  console.log('🎯 Simulating user asking to "continue" after receiving partial workout...\n');
  
  // Mock the functions
  function isContinuingExerciseDiscussion(userMessage, conversationHistory) {
    const continuationKeywords = /\b(continue|finish|complete|keep going|go on|rest of|show me the rest|what's next)\b/i;
    const messageIndicatesContinuation = continuationKeywords.test(userMessage);
    
    if (!messageIndicatesContinuation) {
      return false;
    }
    
    const recentMessages = conversationHistory.slice(-6);
    const exerciseKeywords = /\b(exercise|workout|training|program|sets|reps|muscle|chest|back|legs|arms|shoulders|squat|press|row|curl|extension|fly|raise|deadlift)\b/i;
    
    return recentMessages.some(msg => 
      msg.role === 'model' && exerciseKeywords.test(msg.content)
    );
  }

  function mockFormatContextForPrompt(knowledgeContext, userMessage, conversationHistory) {
    const isContinuationMessage = isContinuingExerciseDiscussion(userMessage, conversationHistory);
    
    let contextString = "### CONTEXTUAL INFORMATION ###\n\n";
    
    if (knowledgeContext.length > 0) {
      contextString += "<knowledge_base_context>\n";
      contextString += "This is your source of truth. Synthesize your answer from these scientifically-backed guides:\n";
      // ... KB content would go here
      contextString += "</knowledge_base_context>\n";
    } else {
      if (isContinuationMessage) {
        // FIXED: For continuation messages, provide softer fallback
        contextString += "<knowledge_base_context>\nNo specific information was found in the knowledge base for this continuation query. However, you may refer to exercises from your general knowledge base that were previously discussed in this conversation.\n</knowledge_base_context>\n";
        
        contextString += "\n<continuation_context>\n";
        contextString += "IMPORTANT: This appears to be a continuation of a previous exercise/workout discussion. ";
        contextString += "You may reference exercises and programs you've previously mentioned in this conversation. ";
        contextString += "Do NOT claim you lack exercise knowledge if you were just providing exercises moments ago.\n";
        contextString += "</continuation_context>\n";
      } else {
        // OLD: For regular messages, claim limitations
        contextString += "<knowledge_base_context>\nNo specific information was found in the knowledge base for this query. You MUST inform the user of this and use your general expertise as a fallback.\n</knowledge_base_context>\n";
      }
    }
    
    return contextString;
  }

  // Test scenarios
  const testUserMessage = "continue";
  const emptyKnowledgeContext = []; // Simulating what happens when "continue" doesn't match exercise content
  
  console.log(`📝 User Message: "${testUserMessage}"`);
  console.log(`📚 Knowledge Context: Empty (simulating vector search for "continue" returning no results)`);
  console.log(`🧠 Conversation History: Contains exercise content\n`);
  
  const isContinuation = isContinuingExerciseDiscussion(testUserMessage, scenarioHistory);
  console.log(`🔍 Detected as continuation: ${isContinuation ? '✅ YES' : '❌ NO'}`);
  
  const generatedContext = mockFormatContextForPrompt(emptyKnowledgeContext, testUserMessage, scenarioHistory);
  
  console.log('\n📋 Generated Context for AI:');
  console.log('─'.repeat(80));
  console.log(generatedContext);
  console.log('─'.repeat(80));
  
  if (isContinuation && generatedContext.includes('continuation_context')) {
    console.log('\n✅ SUCCESS: AI will receive continuation context instead of limitation claim!');
    console.log('✅ AI will be told NOT to claim lack of exercise knowledge');
    console.log('✅ AI can reference previously mentioned exercises');
  } else {
    console.log('\n❌ ISSUE: AI might still claim limitations');
  }
}

testContinuationContext();

console.log('\n🎯 Expected Result:');
console.log('   When user says "continue" after partial workout:');
console.log('   ❌ OLD: "I cannot generate a workout plan... no specific exercises"');
console.log('   ✅ NEW: Continues the workout using previously mentioned exercises');
console.log('\n📋 Key Improvements:');
console.log('   ✅ Detects continuation messages in exercise context');
console.log('   ✅ Provides softer fallback for continuation queries');
console.log('   ✅ Explicitly tells AI not to claim limitations when continuing');
console.log('   ✅ Allows referencing previously discussed exercises');
