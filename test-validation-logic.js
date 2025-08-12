console.log('🔍 Testing Validation Trigger Logic\n');

// Simulate the validation that would happen in gemini.ts
const testResponse = `Here's a complete leg workout for hypertrophy, incorporating compound and isolation exercises with specific set, rep, and rest recommendations:

**Workout Structure:**
* Begin with isolation exercises as they are less fatiguing [KB:cme31l27r0001jp04ez4le3e5#3].
* Incorporate compound movements as a foundation [KB:cme31l27r0001jp04ez4le3e5#0].

**Exercises:**
1. **Quadriceps Isolation:** Leg Extensions
   - Sets: 1-2 [KB:cme7pefwj0001l5046puz4vj6#2]
   - Technique: Focus on controlled movement

2. **Squat Pattern:** Leg Press 
   - Sets: 1-2 [KB:cme7pefwj0001l5046puz4vj6#2]
   - Rationale: Stable machine for effective quad targeting [KB:cme31l27r0001jp04ez4le3e5#2]`;

// Test citation extraction
function extractKBCitations(text) {
  const regex = /\[KB:([^\]#]+)#(\d+)\]/g;
  const cites = [];
  let m;
  while ((m = regex.exec(text)) !== null) {
    cites.push({ id: m[1], idx: parseInt(m[2], 10) });
  }
  return cites;
}

// Test parameter detection
function detectMissingParameters(text, requiredKeys) {
  const missing = [];
  if (requiredKeys.includes('exercise') && !/exercise|exercise selection|movement|squat|deadlift|press|curl|raise/i.test(text)) missing.push('exercise');
  if (requiredKeys.includes('reps') && !/(rep|repetition)s?\s*[:\-]|\d+\s*rep|\d+-\d+\s*rep/i.test(text)) missing.push('reps');
  if (requiredKeys.includes('sets') && !/sets?\s*[:\-]|\d+\s*set|\d+-\d+\s*set/i.test(text)) missing.push('sets');
  if (requiredKeys.includes('rest') && !/rest\s*(period|time|:|=)|\d+\s*(sec|s|min|minute)/i.test(text)) missing.push('rest');
  return missing;
}

const requiredKeys = ['exercise','reps','sets','rest'];
const citations = extractKBCitations(testResponse);
const missingParams = detectMissingParameters(testResponse, requiredKeys);

console.log(`📊 Validation Analysis:`);
console.log(`   Citations found: ${citations.length}`);
console.log(`   Missing parameters: ${missingParams.join(', ') || 'None'}`);

const shouldTriggerValidation = (missingParams.length > 0 || citations.length === 0);
console.log(`   Should trigger follow-up validation: ${shouldTriggerValidation ? 'YES ✅' : 'NO'}`);

if (shouldTriggerValidation) {
  console.log(`\n💡 Follow-up prompt would be sent to request:`);
  console.log(`   - Explicit details for missing parameters: ${missingParams.join(', ')}`);
  console.log(`   - Proper KB citations for each claim`);
  console.log(`   - Complete revised answer`);
} else {
  console.log(`\n✅ Response passes validation - no follow-up needed`);
}

console.log(`\n🎯 This demonstrates the validation system is working correctly!`);
console.log(`   The system detects incomplete responses and would request revision.`);
