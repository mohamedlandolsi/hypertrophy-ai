/**
 * Simple test to verify checkout URL generation
 */
require('dotenv').config();

// Mock the logging functions
const mockContext = { requestId: 'test-request' };
const mockLogger = {
  info: (message, context) => console.log(`[INFO] ${message}`, context),
  error: (message, context) => console.log(`[ERROR] ${message}`, context),
  warn: (message, context) => console.log(`[WARN] ${message}`, context)
};

// Mock the API handler
const mockApiErrorHandler = {
  createContext: () => mockContext,
  handleError: (error, context) => {
    console.error('API Error:', error);
    return { error: error.message };
  }
};

// Simple test of the product configuration
const LEMONSQUEEZY_PRODUCTS = {
  PRO_MONTHLY: {
    id: process.env.LEMONSQUEEZY_PRO_MONTHLY_PRODUCT_ID || '',
    name: 'HypertroQ Pro - Monthly',
    price: 29,
    variantId: process.env.LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID || '',
    interval: 'month'
  },
  PRO_YEARLY: {
    id: process.env.LEMONSQUEEZY_PRO_YEARLY_PRODUCT_ID || '',
    name: 'HypertroQ Pro - Yearly',
    price: 278,
    variantId: process.env.LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID || '',
    interval: 'year'
  }
};

console.log('🔍 Testing Product Configuration...');
console.log('Monthly Product:', LEMONSQUEEZY_PRODUCTS.PRO_MONTHLY);
console.log('Yearly Product:', LEMONSQUEEZY_PRODUCTS.PRO_YEARLY);

// Test interval selection
function testIntervalSelection() {
  console.log('\n🧪 Testing Interval Selection...');
  
  const testCases = [
    { interval: 'month', expected: 'PRO_MONTHLY' },
    { interval: 'year', expected: 'PRO_YEARLY' }
  ];
  
  testCases.forEach(({ interval, expected }) => {
    const product = interval === 'year' ? LEMONSQUEEZY_PRODUCTS.PRO_YEARLY : LEMONSQUEEZY_PRODUCTS.PRO_MONTHLY;
    console.log(`Interval: ${interval} → Product: ${product.name} (${product.variantId})`);
    
    // Simulate URL generation
    const mockUrl = `https://hypertroq.lemonsqueezy.com/buy/${product.id}?enabled=${product.variantId}`;
    console.log(`Generated URL: ${mockUrl}`);
    
    // Check if URL would contain correct variant
    const correctVariant = interval === 'month' ? '898912' : '896458';
    const hasCorrectVariant = mockUrl.includes(correctVariant);
    console.log(`Contains correct variant (${correctVariant}): ${hasCorrectVariant ? '✅' : '❌'}`);
  });
}

testIntervalSelection();

// Test URL parameter addition
function testUrlParameterAddition() {
  console.log('\n🔗 Testing URL Parameter Addition...');
  
  const testUrls = [
    'https://hypertroq.lemonsqueezy.com/buy/3670ca61-2fe7-4fbf-a0ba-01f9f0313099',
    'https://hypertroq.lemonsqueezy.com/buy/3670ca61-2fe7-4fbf-a0ba-01f9f0313099?embed=1'
  ];
  
  const variantId = '896458';
  
  testUrls.forEach(url => {
    let updatedUrl = url;
    if (!updatedUrl.includes('enabled=')) {
      const separator = updatedUrl.includes('?') ? '&' : '?';
      updatedUrl = `${updatedUrl}${separator}enabled=${variantId}`;
    }
    console.log(`Original: ${url}`);
    console.log(`Updated:  ${updatedUrl}`);
    console.log(`Contains enabled param: ${updatedUrl.includes('enabled=') ? '✅' : '❌'}`);
    console.log('---');
  });
}

testUrlParameterAddition();

console.log('\n✅ Configuration test completed!');
