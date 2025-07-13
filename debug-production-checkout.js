const { LEMONSQUEEZY_PRODUCTS } = require('./src/lib/lemonsqueezy.ts');

console.log('=== Production Checkout Debug ===');
console.log('Environment variables:');
console.log('LEMONSQUEEZY_PRO_MONTHLY_PRODUCT_ID:', process.env.LEMONSQUEEZY_PRO_MONTHLY_PRODUCT_ID);
console.log('LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID:', process.env.LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID);
console.log('LEMONSQUEEZY_PRO_YEARLY_PRODUCT_ID:', process.env.LEMONSQUEEZY_PRO_YEARLY_PRODUCT_ID);
console.log('LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID:', process.env.LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID);

console.log('\nProduct configuration:');
console.log('Monthly product:', LEMONSQUEEZY_PRODUCTS.PRO_MONTHLY);
console.log('Yearly product:', LEMONSQUEEZY_PRODUCTS.PRO_YEARLY);

console.log('\nTesting product selection logic:');
const monthlyProduct = Object.values(LEMONSQUEEZY_PRODUCTS).find(p => p.interval === 'month');
const yearlyProduct = Object.values(LEMONSQUEEZY_PRODUCTS).find(p => p.interval === 'year');

console.log('Monthly product found:', monthlyProduct);
console.log('Yearly product found:', yearlyProduct);
