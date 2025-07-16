/**
 * Debug script to test LemonSqueezy checkout URL generation
 * Run with: node debug-lemonsqueezy-checkout.js
 */

const { PrismaClient } = require('@prisma/client');
const { createProCheckoutUrl } = require('./src/lib/lemonsqueezy');

const prisma = new PrismaClient();

async function debugCheckoutUrls() {
  console.log('🔍 Debugging LemonSqueezy Checkout URL Generation...');
  console.log('=' .repeat(60));
  
  // Check environment variables
  console.log('\n📋 Environment Variables:');
  console.log('LEMONSQUEEZY_API_KEY:', process.env.LEMONSQUEEZY_API_KEY ? 'SET' : 'NOT SET');
  console.log('LEMONSQUEEZY_STORE_ID:', process.env.LEMONSQUEEZY_STORE_ID);
  console.log('LEMONSQUEEZY_PRO_MONTHLY_PRODUCT_ID:', process.env.LEMONSQUEEZY_PRO_MONTHLY_PRODUCT_ID);
  console.log('LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID:', process.env.LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID);
  console.log('LEMONSQUEEZY_PRO_YEARLY_PRODUCT_ID:', process.env.LEMONSQUEEZY_PRO_YEARLY_PRODUCT_ID);
  console.log('LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID:', process.env.LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID);
  
  // Test data
  const testUserId = 'test-user-12345';
  const testEmail = 'test@example.com';
  
  console.log('\n🧪 Testing Checkout URL Generation...');
  console.log('Test User ID:', testUserId);
  console.log('Test Email:', testEmail);
  
  try {
    // Test monthly checkout
    console.log('\n📅 Testing Monthly Checkout:');
    console.log('Calling createProCheckoutUrl(userId, email, "month")...');
    const monthlyUrl = await createProCheckoutUrl(testUserId, testEmail, 'month');
    console.log('Monthly URL:', monthlyUrl);
    
    // Test yearly checkout
    console.log('\n📅 Testing Yearly Checkout:');
    console.log('Calling createProCheckoutUrl(userId, email, "year")...');
    const yearlyUrl = await createProCheckoutUrl(testUserId, testEmail, 'year');
    console.log('Yearly URL:', yearlyUrl);
    
    // Compare URLs
    console.log('\n🔍 URL Comparison:');
    console.log('Monthly URL:', monthlyUrl);
    console.log('Yearly URL:', yearlyUrl);
    console.log('Are URLs different?', monthlyUrl !== yearlyUrl ? '✅ YES' : '❌ NO');
    
    // Check for variant IDs in URLs
    const monthlyVariantId = process.env.LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID;
    const yearlyVariantId = process.env.LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID;
    
    console.log('\n🔍 Variant ID Analysis:');
    console.log('Monthly Variant ID:', monthlyVariantId);
    console.log('Yearly Variant ID:', yearlyVariantId);
    console.log('Monthly URL contains monthly variant ID?', monthlyUrl.includes(monthlyVariantId) ? '✅ YES' : '❌ NO');
    console.log('Yearly URL contains yearly variant ID?', yearlyUrl.includes(yearlyVariantId) ? '✅ YES' : '❌ NO');
    
    // Extract product IDs from URLs
    const monthlyProductMatch = monthlyUrl.match(/buy\/([^?]+)/);
    const yearlyProductMatch = yearlyUrl.match(/buy\/([^?]+)/);
    
    if (monthlyProductMatch && yearlyProductMatch) {
      console.log('\n🔍 Product ID Analysis:');
      console.log('Monthly Product ID from URL:', monthlyProductMatch[1]);
      console.log('Yearly Product ID from URL:', yearlyProductMatch[1]);
      console.log('Are Product IDs different?', monthlyProductMatch[1] !== yearlyProductMatch[1] ? '✅ YES' : '❌ NO');
    }
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Error during testing:', error);
    console.log('\nThis error is expected if:');
    console.log('1. LemonSqueezy environment variables are not properly configured');
    console.log('2. The API key is invalid or expired');
    console.log('3. The store ID or product/variant IDs are incorrect');
  }
}

// Run the debug
debugCheckoutUrls()
  .catch(console.error)
  .finally(() => process.exit(0));
