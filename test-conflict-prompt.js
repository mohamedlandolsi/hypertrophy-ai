// Test conflict confirmation prompt generation
const testConflictData = [
  // Test case 1: Complete conflict data
  {
    conflictField: 'training program',
    currentValue: 'upper/lower split',
    requestedValue: 'push/pull/legs program',
    conflictType: 'training_frequency',
    resolutionNeeded: true,
    suggestedResolution: 'Clarify which program you prefer to follow'
  },
  
  // Test case 2: Minimal conflict data (like what might cause the issue)
  {
    conflictType: 'goal_conflict',
    resolutionNeeded: true
  },
  
  // Test case 3: Mixed data
  {
    conflictField: 'workout frequency',
    conflictType: 'training_frequency',
    currentValue: '3 days per week',
    requestedValue: 'full workouts for PPL x UL program',
    resolutionNeeded: true
  }
];

// Mock the function (since we can't import from TS file directly)
function generateConflictConfirmationPrompt(conflictData) {
  // Handle both old and new conflict data formats
  const conflictField = conflictData.conflictField || conflictData.field || 'training preferences';
  const currentValue = conflictData.currentValue || 'your current profile';
  const requestedValue = conflictData.requestedValue || conflictData.newValue || 'what you just mentioned';
  const conflictType = conflictData.conflictType;
  const suggestedResolution = conflictData.suggestedResolution;
  
  let prompt = `⚠️ **Profile Conflict Detected**: I noticed conflicting information about your **${conflictField}**.`;
  
  // Add specific conflict details if available
  if (currentValue !== 'your current profile' && requestedValue !== 'what you just mentioned') {
    prompt += `\n\n**Current profile shows**: ${currentValue}`;
    prompt += `\n**You just mentioned**: ${requestedValue}`;
  } else if (conflictField && conflictType) {
    prompt += `\n\n**Conflict type**: ${conflictType}`;
    if (conflictField !== 'training preferences') {
      prompt += `\n**Field**: ${conflictField}`;
    }
  }
  
  if (suggestedResolution) {
    prompt += `\n\n**💡 Suggested resolution**: ${suggestedResolution}`;
  }
  
  prompt += `\n\n**Please clarify**: Which information should I use for your profile? This will help me provide the most accurate recommendations for you.`;
  
  return prompt;
}

console.log('🧪 Testing Conflict Confirmation Prompt Generation\n');

testConflictData.forEach((conflictData, index) => {
  console.log(`\n📝 Test Case ${index + 1}:`);
  console.log('Input data:', JSON.stringify(conflictData, null, 2));
  console.log('\nGenerated prompt:');
  console.log('---');
  console.log(generateConflictConfirmationPrompt(conflictData));
  console.log('---');
});

console.log('\n✅ All test cases completed!');
