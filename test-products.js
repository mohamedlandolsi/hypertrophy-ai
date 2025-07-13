// Test yearly vs monthly product selection
require('dotenv').config();

console.log('=== Product Configuration Test ===');

const monthlyProductId = process.env.LEMONSQUEEZY_PRO_MONTHLY_PRODUCT_ID;
const monthlyVariantId = process.env.LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID;
const yearlyProductId = process.env.LEMONSQUEEZY_PRO_YEARLY_PRODUCT_ID;
const yearlyVariantId = process.env.LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID;

console.log('Monthly Product ID:', monthlyProductId);
console.log('Monthly Variant ID:', monthlyVariantId);
console.log('Yearly Product ID:', yearlyProductId);
console.log('Yearly Variant ID:', yearlyVariantId);

console.log('\n=== Issue Analysis ===');
if (monthlyProductId === yearlyProductId) {
  console.log('❌ ISSUE FOUND: Both monthly and yearly use the same Product ID!');
  console.log('This will cause confusion in product selection.');
} else {
  console.log('✅ Product IDs are different - good!');
}

if (monthlyVariantId === yearlyVariantId) {
  console.log('❌ CRITICAL ISSUE: Both monthly and yearly use the same Variant ID!');
} else {
  console.log('✅ Variant IDs are different - good!');
}
