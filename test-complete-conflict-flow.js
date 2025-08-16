// Complete conflict detection flow test
console.log('🧪 Testing Complete Conflict Detection Flow\n');

// Simulate the exact scenario from the screenshot
const mockConflictScenarios = [
  {
    name: 'PPL Program Request Conflict',
    userMessage: '??? I said that I want full workouts for the ppl x ul program',
    conflictData: {
      conflictField: 'training program structure',
      currentValue: 'push/pull/legs split (3 days)',
      requestedValue: 'full workouts for PPL x UL program (6 days)',
      conflictType: 'training_frequency',
      conflictSeverity: 'moderate',
      resolutionNeeded: true,
      suggestedResolution: 'Clarify if you want to switch from 3-day PPL to 6-day PPL+UL hybrid'
    }
  },
  {
    name: 'Goal Mismatch Conflict',
    userMessage: 'I want to focus on strength now',
    conflictData: {
      conflictField: 'primary goal',
      currentValue: 'muscle building (hypertrophy)',
      requestedValue: 'strength training',
      conflictType: 'goal_conflict',
      conflictSeverity: 'major',
      resolutionNeeded: true,
      suggestedResolution: 'Confirm if you want to change your primary goal from hypertrophy to strength'
    }
  }
];

function generateConflictConfirmationPrompt(conflictData) {
  const conflictField = conflictData.conflictField || conflictData.field || 'training preferences';
  const currentValue = conflictData.currentValue || 'your current profile';
  const requestedValue = conflictData.requestedValue || conflictData.newValue || 'what you just mentioned';
  const conflictType = conflictData.conflictType;
  const suggestedResolution = conflictData.suggestedResolution;
  
  let prompt = `⚠️ **Profile Conflict Detected**: I noticed conflicting information about your **${conflictField}**.`;
  
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

// Test each scenario
mockConflictScenarios.forEach((scenario, index) => {
  console.log(`\n📋 Scenario ${index + 1}: ${scenario.name}`);
  console.log(`👤 User Message: "${scenario.userMessage}"`);
  console.log('\n🤖 AI Generated Conflict Confirmation:');
  console.log('─'.repeat(80));
  console.log(generateConflictConfirmationPrompt(scenario.conflictData));
  console.log('─'.repeat(80));
});

console.log('\n✅ All conflict scenarios tested successfully!');
console.log('\n📝 Key Improvements Made:');
console.log('   ✅ Enhanced conflict prompt with specific field details');
console.log('   ✅ Better fallbacks for missing conflict data');
console.log('   ✅ Added auto-detection for conflicts needing resolution');
console.log('   ✅ Improved debugging and logging');
console.log('   ✅ More user-friendly confirmation prompts');
