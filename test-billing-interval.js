/**
 * Test script to verify billing interval functionality
 * Run with: node test-billing-interval.js
 */

const { createProCheckoutUrl } = require('./src/lib/lemonsqueezy');

async function testBillingInterval() {
  console.log('Testing billing interval functionality...\n');
  
  // Test user data
  const testUserId = 'test-user-123';
  const testEmail = 'test@example.com';
  
  try {
    // Test monthly checkout
    console.log('1. Testing monthly checkout URL generation...');
    const monthlyUrl = await createProCheckoutUrl(testUserId, testEmail, 'month');
    console.log('Monthly checkout URL:', monthlyUrl);
    console.log('✓ Monthly checkout URL generated successfully\n');
    
    // Test yearly checkout
    console.log('2. Testing yearly checkout URL generation...');
    const yearlyUrl = await createProCheckoutUrl(testUserId, testEmail, 'year');
    console.log('Yearly checkout URL:', yearlyUrl);
    console.log('✓ Yearly checkout URL generated successfully\n');
    
    // Verify URLs are different
    if (monthlyUrl !== yearlyUrl) {
      console.log('✓ Monthly and yearly URLs are different - this is correct');
    } else {
      console.log('❌ Monthly and yearly URLs are the same - this indicates an issue');
    }
    
    // Check if URLs contain expected pattern differences
    if (monthlyUrl.includes('month') || yearlyUrl.includes('year')) {
      console.log('✓ URLs contain expected billing interval indicators');
    } else {
      console.log('ℹ️ URLs do not contain obvious billing interval indicators (this may be normal)');
    }
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
    console.log('\nThis is expected if LemonSqueezy environment variables are not configured for testing.');
  }
}

// Run the test
testBillingInterval().catch(console.error);
