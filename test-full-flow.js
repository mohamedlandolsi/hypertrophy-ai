// Test the full LemonSqueezy flow
require('dotenv').config();

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

console.log('=== Testing Product Selection Logic ===');

// Test monthly selection
const monthlyProduct = LEMONSQUEEZY_PRODUCTS.PRO_MONTHLY;
console.log('Monthly product:', {
  name: monthlyProduct.name,
  id: monthlyProduct.id,
  variantId: monthlyProduct.variantId,
  interval: monthlyProduct.interval
});

// Test yearly selection
const yearlyProduct = LEMONSQUEEZY_PRODUCTS.PRO_YEARLY;
console.log('Yearly product:', {
  name: yearlyProduct.name,
  id: yearlyProduct.id,
  variantId: yearlyProduct.variantId,
  interval: yearlyProduct.interval
});

console.log('\n=== Testing Interval-based Selection ===');
function selectProduct(interval) {
  return interval === 'year' ? LEMONSQUEEZY_PRODUCTS.PRO_YEARLY : LEMONSQUEEZY_PRODUCTS.PRO_MONTHLY;
}

const testMonthly = selectProduct('month');
console.log('selectProduct("month"):', testMonthly.name, '- Variant ID:', testMonthly.variantId);

const testYearly = selectProduct('year');
console.log('selectProduct("year"):', testYearly.name, '- Variant ID:', testYearly.variantId);

console.log('\n=== Testing Product Search Logic ===');
// Simulate the search logic from createCheckoutUrl
function findProduct(productId, variantId) {
  // Search by variant ID first (should be unique), then by product ID
  return Object.values(LEMONSQUEEZY_PRODUCTS).find(
    p => p.variantId === variantId
  ) || Object.values(LEMONSQUEEZY_PRODUCTS).find(
    p => p.id === productId
  );
}

const foundMonthly = findProduct(monthlyProduct.id, monthlyProduct.variantId);
console.log('Found monthly product:', foundMonthly?.name, '- Variant ID:', foundMonthly?.variantId);

const foundYearly = findProduct(yearlyProduct.id, yearlyProduct.variantId);
console.log('Found yearly product:', foundYearly?.name, '- Variant ID:', foundYearly?.variantId);
