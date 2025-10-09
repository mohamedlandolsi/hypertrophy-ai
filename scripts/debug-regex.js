// Simple text analysis
const sampleText = "**Reps:** 5-10 (KB: Training Goals Guide, Optimal Repetition Ranges)";

console.log('Testing regex patterns:');
console.log('Sample text:', sampleText);

const patterns = [
  { name: 'Pattern 1', regex: /\d+-\d+\s*(rep|reps?)/i },
  { name: 'Pattern 2', regex: /reps?:\s*\d+-\d+/i },
  { name: 'Pattern 3', regex: /\*\*reps?\*\*:\s*\d+-\d+/i },
  { name: 'Pattern 4', regex: /reps?\*\*:\s*\d+-\d+/i },
  { name: 'Pattern 5', regex: /\d+-\d+/g }
];

patterns.forEach(pattern => {
  const match = pattern.regex.test(sampleText);
  const matches = sampleText.match(pattern.regex);
  console.log(`${pattern.name}: ${match ? '✓' : '✗'} - ${matches ? matches[0] : 'no match'}`);
});

console.log('\nFull response analysis:');
const fullResponse = `**Sets:** 3-4 (KB: Training Volume Guide)
*   **Reps:** 5-10 (KB: Training Goals Guide, Optimal Repetition Ranges)
*   **Rest:** 3-5 minutes (KB: Rest Periods Guide)`;

console.log('Full sample:', fullResponse);

const finalRegex = /reps?\*\*:\s*\d+-\d+/gi;
const finalMatches = fullResponse.match(finalRegex);
console.log('Final regex matches:', finalMatches);

// Better patterns
const betterPatterns = [
  { name: 'Reps pattern', regex: /\*\*reps?\*\*:\s*\d+-\d+/gi },
  { name: 'Sets pattern', regex: /\*\*sets?\*\*:\s*\d+-?\d*/gi },
  { name: 'Rest pattern', regex: /\*\*rest\*\*:\s*\d+-?\d*\s*minute/gi }
];

console.log('\nBetter patterns:');
betterPatterns.forEach(pattern => {
  const matches = fullResponse.match(pattern.regex);
  console.log(`${pattern.name}: ${matches ? matches.length : 0} matches - ${matches || 'none'}`);
});
