// Test Multi-Query Logic
// This tests the core logic without TypeScript imports

function shouldUseMultiQuery(userQuery) {
  const query = userQuery.toLowerCase();
  
  // Skip multi-query for very specific questions
  const specificPatterns = [
    /what is.*exactly/,
    /define/,
    /definition of/,
    /how many.*in/,
    /when was/,
    /who is/,
    /which exercise.*specifically/
  ];
  
  if (specificPatterns.some(pattern => pattern.test(query))) {
    return false;
  }
  
  // Use multi-query for broad training questions
  const broadPatterns = [
    /how to train/,
    /how to build/,
    /how to grow/,
    /best.*for.*muscle/,
    /workout.*for/,
    /training.*program/,
    /muscle.*growth/,
    /hypertrophy/
  ];
  
  return broadPatterns.some(pattern => pattern.test(query)) || query.split(' ').length <= 5;
}

console.log('🔍 Testing Multi-Query Decision Logic...\n');

const testQueries = [
  { query: "how to train chest", expected: true },
  { query: "how to build bigger arms", expected: true },
  { query: "best back workout for muscle growth", expected: true },
  { query: "what is the optimal rep range", expected: false },
  { query: "define hypertrophy exactly", expected: false },
  { query: "which exercise targets biceps specifically", expected: false },
  { query: "workout program for beginners", expected: true },
  { query: "how many reps in a set", expected: false }
];

testQueries.forEach(({ query, expected }) => {
  const result = shouldUseMultiQuery(query);
  const status = result === expected ? '✅' : '❌';
  const strategy = result ? 'MULTI-QUERY' : 'SINGLE-QUERY';
  
  console.log(`${status} "${query}" → ${strategy}`);
});

console.log('\n🎯 Multi-Query Strategy Summary:');
console.log('=====================================');
console.log('✅ Broad questions (how to train X) → Use multiple targeted searches');
console.log('✅ Specific questions (what is X exactly) → Use single focused search');
console.log('✅ This ensures comprehensive context for complex topics');
console.log('✅ While maintaining efficiency for simple queries');

console.log('\n📝 Example Sub-Queries for "how to train chest":');
console.log('1. "how to train chest" (original)');
console.log('2. "what are the most effective chest exercises"'); 
console.log('3. "what volume and rep ranges work best for chest growth"');
console.log('4. "how often should I train chest per week"');
console.log('5. "what is proper chest exercise technique"');

console.log('\n🚀 This will retrieve from multiple guides:');
console.log('• "A Guide to Effective Chest Training" (exercise selection)');
console.log('• "A Guide to Training Volume" (sets/reps/frequency)');
console.log('• "A Guide to Foundational Training Principles" (technique)');
console.log('• "A Guide to Effective Split Programming" (frequency/scheduling)');

console.log('\n📊 Result: Comprehensive, knowledge-grounded answers!');
