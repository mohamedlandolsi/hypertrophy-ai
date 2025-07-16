require('dotenv').config();

console.log('Testing LemonSqueezy environment variables...');
console.log('');

console.log('LEMONSQUEEZY_STORE_ID:', process.env.LEMONSQUEEZY_STORE_ID);
console.log('LEMONSQUEEZY_PRO_MONTHLY_PRODUCT_ID:', process.env.LEMONSQUEEZY_PRO_MONTHLY_PRODUCT_ID);
console.log('LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID:', process.env.LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID);
console.log('LEMONSQUEEZY_PRO_YEARLY_PRODUCT_ID:', process.env.LEMONSQUEEZY_PRO_YEARLY_PRODUCT_ID);
console.log('LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID:', process.env.LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID);
console.log('');

const monthlyUrl = 'https://hypertroq.lemonsqueezy.com/buy/3670ca61-2fe7-4fbf-a0ba-01f9f0313099?enabled=898912';
const yearlyUrl = 'https://hypertroq.lemonsqueezy.com/buy/9c872ed8-6ef8-47b2-a2dd-00a832697ebb?enabled=896458';

console.log('Monthly checkout URL:', monthlyUrl);
console.log('Yearly checkout URL:', yearlyUrl);
console.log('');

console.log('Monthly URL contains variant ID 898912?', monthlyUrl.includes('898912'));
console.log('Yearly URL contains variant ID 896458?', yearlyUrl.includes('896458'));
