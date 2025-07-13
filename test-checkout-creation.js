/**
 * Test script to debug LemonSqueezy checkout creation
 */

// Import necessary modules for testing
const dotenv = require('dotenv');
dotenv.config();

// Since we can't directly import ES modules, let's check the configuration first
const fetch = require('node-fetch');
global.fetch = fetch;

async function testCheckoutCreation() {
  console.log('🧪 Testing LemonSqueezy Checkout Creation\n');

  try {
    // Check environment variables
    console.log('Environment Variables:');
    console.log('- LEMONSQUEEZY_API_KEY:', process.env.LEMONSQUEEZY_API_KEY ? 'Set' : 'Missing');
    console.log('- LEMONSQUEEZY_STORE_ID:', process.env.LEMONSQUEEZY_STORE_ID || 'Missing');
    console.log('- LEMONSQUEEZY_PRO_MONTHLY_PRODUCT_ID:', process.env.LEMONSQUEEZY_PRO_MONTHLY_PRODUCT_ID || 'Missing');
    console.log('- LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID:', process.env.LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID || 'Missing');
    console.log('- LEMONSQUEEZY_PRO_YEARLY_PRODUCT_ID:', process.env.LEMONSQUEEZY_PRO_YEARLY_PRODUCT_ID || 'Missing');
    console.log('- LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID:', process.env.LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID || 'Missing');
    console.log('');

    // Test monthly checkout creation
    console.log('Testing monthly checkout creation...');
    const monthlyCheckoutUrl = await createProCheckoutUrl(
      'test-user-id',
      'test@example.com',
      'month'
    );
    console.log('✅ Monthly checkout URL created:', monthlyCheckoutUrl);
    console.log('');

    // Test yearly checkout creation
    console.log('Testing yearly checkout creation...');
    const yearlyCheckoutUrl = await createProCheckoutUrl(
      'test-user-id',
      'test@example.com',
      'year'
    );
    console.log('✅ Yearly checkout URL created:', yearlyCheckoutUrl);

  } catch (error) {
    console.error('❌ Error during checkout creation:');
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    
    // Check for common issues
    if (error.message.includes('API key')) {
      console.log('\n💡 Suggestion: Check if LEMONSQUEEZY_API_KEY is properly set');
    }
    if (error.message.includes('store')) {
      console.log('\n💡 Suggestion: Check if LEMONSQUEEZY_STORE_ID is properly set');
    }
    if (error.message.includes('Product not found')) {
      console.log('\n💡 Suggestion: Check if product and variant IDs are properly configured');
    }
    if (error.message.includes('NEXTAUTH_URL')) {
      console.log('\n💡 Suggestion: Make sure NEXT_PUBLIC_SITE_URL or NEXTAUTH_URL is set for redirect URLs');
    }
  }
}

// Run the test
testCheckoutCreation();
