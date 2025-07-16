/**
 * Simple test to verify LemonSqueezy configuration
 */
require('dotenv').config();

const envVars = {
  LEMONSQUEEZY_API_KEY: process.env.LEMONSQUEEZY_API_KEY ? 'SET' : 'NOT SET',
  LEMONSQUEEZY_STORE_ID: process.env.LEMONSQUEEZY_STORE_ID,
  LEMONSQUEEZY_PRO_MONTHLY_PRODUCT_ID: process.env.LEMONSQUEEZY_PRO_MONTHLY_PRODUCT_ID,
  LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID: process.env.LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID,
  LEMONSQUEEZY_PRO_YEARLY_PRODUCT_ID: process.env.LEMONSQUEEZY_PRO_YEARLY_PRODUCT_ID,
  LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID: process.env.LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID,
  LEMONSQUEEZY_WEBHOOK_SECRET: process.env.LEMONSQUEEZY_WEBHOOK_SECRET ? 'SET' : 'NOT SET'
};

console.log('🔍 LemonSqueezy Configuration Check');
console.log('=' .repeat(50));

Object.entries(envVars).forEach(([key, value]) => {
  console.log(`${key}: ${value}`);
});

console.log('\n✅ Configuration Analysis:');

// Check if all required variables are set
const requiredVars = [
  'LEMONSQUEEZY_STORE_ID',
  'LEMONSQUEEZY_PRO_MONTHLY_PRODUCT_ID',
  'LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID',
  'LEMONSQUEEZY_PRO_YEARLY_PRODUCT_ID',
  'LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.log(`❌ Missing variables: ${missingVars.join(', ')}`);
} else {
  console.log('✅ All required environment variables are set');
}

// Validate format
const storeId = process.env.LEMONSQUEEZY_STORE_ID;
const monthlyProductId = process.env.LEMONSQUEEZY_PRO_MONTHLY_PRODUCT_ID;
const monthlyVariantId = process.env.LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID;
const yearlyProductId = process.env.LEMONSQUEEZY_PRO_YEARLY_PRODUCT_ID;
const yearlyVariantId = process.env.LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID;

console.log('\n🔍 ID Format Validation:');
console.log(`Store ID (${storeId}): ${/^\d+$/.test(storeId) ? '✅ Valid' : '❌ Invalid (should be numeric)'}`);
console.log(`Monthly Product ID (${monthlyProductId}): ${/^\d+$/.test(monthlyProductId) ? '✅ Valid' : '❌ Invalid (should be numeric)'}`);
console.log(`Monthly Variant ID (${monthlyVariantId}): ${/^\d+$/.test(monthlyVariantId) ? '✅ Valid' : '❌ Invalid (should be numeric)'}`);
console.log(`Yearly Product ID (${yearlyProductId}): ${/^\d+$/.test(yearlyProductId) ? '✅ Valid' : '❌ Invalid (should be numeric)'}`);
console.log(`Yearly Variant ID (${yearlyVariantId}): ${/^\d+$/.test(yearlyVariantId) ? '✅ Valid' : '❌ Invalid (should be numeric)'}`);

// Check if both products use the same product ID (expected)
if (monthlyProductId === yearlyProductId) {
  console.log('✅ Both monthly and yearly variants use the same product ID (expected)');
} else {
  console.log('⚠️  Monthly and yearly variants use different product IDs');
}

// Check if variant IDs are different (expected)
if (monthlyVariantId !== yearlyVariantId) {
  console.log('✅ Monthly and yearly variants have different variant IDs (expected)');
} else {
  console.log('❌ Monthly and yearly variants have the same variant ID (problematic)');
}

console.log('\n📋 Expected Checkout URL Format:');
console.log(`Monthly: https://hypertroq.lemonsqueezy.com/buy/${monthlyProductId}?enabled=${monthlyVariantId}`);
console.log(`Yearly: https://hypertroq.lemonsqueezy.com/buy/${yearlyProductId}?enabled=${yearlyVariantId}`);

console.log('\n✅ Configuration check completed!');
