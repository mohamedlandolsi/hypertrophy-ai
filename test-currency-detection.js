const { getDefaultCurrency, getDefaultCurrencySync } = require('./src/lib/currency');

async function testCurrencyDetection() {
  console.log('Testing currency detection...\n');
  
  console.log('1. Sync detection (browser locale only):');
  try {
    const syncCurrency = getDefaultCurrencySync();
    console.log(`   Sync currency: ${syncCurrency}`);
  } catch (error) {
    console.log(`   Sync detection error: ${error.message}`);
  }
  
  console.log('\n2. Async detection (IP geolocation + locale):');
  try {
    const asyncCurrency = await getDefaultCurrency();
    console.log(`   Async currency: ${asyncCurrency}`);
  } catch (error) {
    console.log(`   Async detection error: ${error.message}`);
  }
  
  console.log('\nTest completed!');
}

testCurrencyDetection().catch(console.error);
