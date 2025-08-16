// Debug script to test coming soon functionality
console.log('🔍 Debugging Coming Soon Feature\n');

// Test environment variable
console.log('Environment Variables:');
console.log('NEXT_PUBLIC_CHAT_COMING_SOON:', process.env.NEXT_PUBLIC_CHAT_COMING_SOON);
console.log('Type:', typeof process.env.NEXT_PUBLIC_CHAT_COMING_SOON);
console.log('Strict equality check:', process.env.NEXT_PUBLIC_CHAT_COMING_SOON === 'true');

console.log('\nComparison Tests:');
console.log('== "true":', process.env.NEXT_PUBLIC_CHAT_COMING_SOON == 'true');
console.log('=== "true":', process.env.NEXT_PUBLIC_CHAT_COMING_SOON === 'true');
console.log('Boolean(value):', Boolean(process.env.NEXT_PUBLIC_CHAT_COMING_SOON));

console.log('\nExpected Behavior:');
if (process.env.NEXT_PUBLIC_CHAT_COMING_SOON === 'true') {
  console.log('✅ Should show Coming Soon page');
} else {
  console.log('❌ Should show normal chat interface');
  console.log('Current value:', `"${process.env.NEXT_PUBLIC_CHAT_COMING_SOON}"`);
}

// Additional debugging
console.log('\nAll NEXT_PUBLIC environment variables:');
Object.keys(process.env)
  .filter(key => key.startsWith('NEXT_PUBLIC_'))
  .forEach(key => {
    console.log(`${key}: "${process.env[key]}"`);
  });
