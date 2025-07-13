// Test production checkout flow
// Run this with: node test-production-checkout.js

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

console.log('=== Production Environment Test ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('');

console.log('LemonSqueezy Environment Variables:');
console.log('LEMONSQUEEZY_API_KEY:', process.env.LEMONSQUEEZY_API_KEY ? '[SET]' : '[NOT SET]');
console.log('LEMONSQUEEZY_STORE_ID:', process.env.LEMONSQUEEZY_STORE_ID);
console.log('LEMONSQUEEZY_PRO_MONTHLY_PRODUCT_ID:', process.env.LEMONSQUEEZY_PRO_MONTHLY_PRODUCT_ID);
console.log('LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID:', process.env.LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID);
console.log('LEMONSQUEEZY_PRO_YEARLY_PRODUCT_ID:', process.env.LEMONSQUEEZY_PRO_YEARLY_PRODUCT_ID);
console.log('LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID:', process.env.LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID);
console.log('');

// Test product configuration (simulate what happens in lemonsqueezy.ts)
const BASE_PRICES_TND = {
  MONTHLY: 29,
  YEARLY: 278
};

const LEMONSQUEEZY_PRODUCTS = {
  PRO_MONTHLY: {
    id: process.env.LEMONSQUEEZY_PRO_MONTHLY_PRODUCT_ID || '',
    name: 'HypertroQ Pro - Monthly',
    price: BASE_PRICES_TND.MONTHLY,
    variantId: process.env.LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID || '',
    interval: 'month'
  },
  PRO_YEARLY: {
    id: process.env.LEMONSQUEEZY_PRO_YEARLY_PRODUCT_ID || '',
    name: 'HypertroQ Pro - Yearly', 
    price: BASE_PRICES_TND.YEARLY,
    variantId: process.env.LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID || '',
    interval: 'year'
  }
};

console.log('Product Configuration:');
console.log('Monthly Product:', LEMONSQUEEZY_PRODUCTS.PRO_MONTHLY);
console.log('Yearly Product:', LEMONSQUEEZY_PRODUCTS.PRO_YEARLY);
console.log('');

// Test product selection logic
console.log('Testing createProCheckoutUrl logic:');
function testProductSelection(interval) {
  const product = interval === 'year' ? LEMONSQUEEZY_PRODUCTS.PRO_YEARLY : LEMONSQUEEZY_PRODUCTS.PRO_MONTHLY;
  console.log(`For interval "${interval}", selected product:`, {
    name: product.name,
    id: product.id,
    variantId: product.variantId,
    interval: product.interval
  });
  return product;
}

testProductSelection('month');
testProductSelection('year');
console.log('');

// Check for potential issues
const issues = [];
if (!process.env.LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID) {
  issues.push('❌ LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID is not set');
}
if (!process.env.LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID) {
  issues.push('❌ LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID is not set');
}
if (process.env.LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID === process.env.LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID) {
  issues.push('❌ Yearly and Monthly variant IDs are the same');
}

if (issues.length > 0) {
  console.log('ISSUES FOUND:');
  issues.forEach(issue => console.log(issue));
} else {
  console.log('✅ Configuration looks good');
}
