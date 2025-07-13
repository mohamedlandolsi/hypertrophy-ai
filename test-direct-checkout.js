// Test the checkout API directly
const fetch = require('node-fetch');

async function testCheckout() {
  try {
    console.log('🧪 Testing checkout API...');
    
    const response = await fetch('http://localhost:3000/api/checkout/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ interval: 'month' }),
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testCheckout();
