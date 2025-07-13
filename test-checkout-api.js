// Simple test to check if checkout API works
async function testCheckoutAPI() {
  try {
    console.log('Testing checkout API...');
    
    const response = await fetch('http://localhost:3000/api/checkout/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // You'll need to add proper authentication headers here
      },
      body: JSON.stringify({ 
        interval: 'month'
      }),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Checkout API test successful:', result);
    } else {
      console.log('❌ Checkout API test failed:', result);
    }
  } catch (error) {
    console.error('❌ Error testing checkout API:', error);
  }
}

// Wait for server to start and then test
setTimeout(() => {
  testCheckoutAPI();
}, 5000);
