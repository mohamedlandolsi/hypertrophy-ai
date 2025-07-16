require('dotenv').config();

// Test the checkout URL generation
const monthlyProduct = {
  checkoutUrl: 'https://hypertroq.lemonsqueezy.com/buy/3670ca61-2fe7-4fbf-a0ba-01f9f0313099?enabled=898912'
};

const yearlyProduct = {
  checkoutUrl: 'https://hypertroq.lemonsqueezy.com/buy/9c872ed8-6ef8-47b2-a2dd-00a832697ebb?enabled=896458'
};

function createProCheckoutUrl(userId, userEmail, interval = 'month') {
  console.log(`createProCheckoutUrl called with interval: ${interval}`);
  
  const product = interval === 'year' ? yearlyProduct : monthlyProduct;
  
  console.log(`Selected product for ${interval}:`, {
    interval,
    checkoutUrl: product.checkoutUrl
  });
  
  return product.checkoutUrl;
}

console.log('Testing checkout URL generation...');
console.log('');

console.log('Monthly test:');
const monthlyUrl = createProCheckoutUrl('test-user', 'test@example.com', 'month');
console.log('Generated URL:', monthlyUrl);
console.log('');

console.log('Yearly test:');
const yearlyUrl = createProCheckoutUrl('test-user', 'test@example.com', 'year');
console.log('Generated URL:', yearlyUrl);
console.log('');

console.log('URLs are different?', monthlyUrl !== yearlyUrl);
console.log('Monthly URL contains 898912?', monthlyUrl.includes('898912'));
console.log('Yearly URL contains 896458?', yearlyUrl.includes('896458'));
