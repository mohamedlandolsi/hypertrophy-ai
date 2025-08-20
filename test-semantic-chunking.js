// Simple test to verify compromise library is working
const nlp = require('compromise');

console.log('🧪 Testing Compromise NLP Library');
console.log('=' .repeat(50));

const testText = `
Hypertrophy training is the process of building muscle mass through resistance exercise. 
Progressive overload is a fundamental principle in strength training.
The squat is a compound exercise that targets multiple muscle groups.
`;

try {
  const doc = nlp(testText);
  const sentences = doc.sentences().out('array');
  
  console.log(`📝 Original text: ${testText.trim()}`);
  console.log('');
  console.log(`📊 Found ${sentences.length} sentences:`);
  
  sentences.forEach((sentence, index) => {
    console.log(`${index + 1}. ${sentence}`);
  });
  
  console.log('');
  console.log('🔍 Extracted nouns:');
  const nouns = doc.nouns().out('array');
  console.log(nouns.join(', '));
  
  console.log('');
  console.log('✅ Compromise library test completed successfully!');
  console.log('✅ Semantic chunking dependencies are working correctly.');
  
} catch (error) {
  console.error('❌ Error testing compromise library:', error);
}
