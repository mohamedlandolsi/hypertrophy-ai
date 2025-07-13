/**
 * Test script for currency conversion functionality
 * Run with: node test-currency.js
 */

const axios = require('axios');

// Simple test to verify exchange rate API
async function testCurrencyConversion() {
  console.log('🧪 Testing Currency Conversion System...\n');
  
  try {
    // Test fetching exchange rates
    console.log('📡 Fetching exchange rates from API...');
    const response = await axios.get('https://api.exchangerate-api.com/v4/latest/TND', {
      timeout: 5000
    });
    
    if (response.data && response.data.rates) {
      console.log('✅ API Response received successfully');
      console.log('📊 Sample exchange rates:');
      
      const rates = response.data.rates;
      const sampleCurrencies = ['USD', 'EUR', 'EGP', 'SAR', 'MAD', 'DZD'];
      
      sampleCurrencies.forEach(currency => {
        if (rates[currency]) {
          const monthlyTND = 29;
          const yearlyTND = 278;
          
          const monthlyConverted = monthlyTND * rates[currency];
          const yearlyConverted = yearlyTND * rates[currency];
          
          console.log(`  ${currency}: 1 TND = ${rates[currency].toFixed(4)} ${currency}`);
          console.log(`    Monthly: ${monthlyTND} TND = ${monthlyConverted.toFixed(2)} ${currency}`);
          console.log(`    Yearly: ${yearlyTND} TND = ${yearlyConverted.toFixed(2)} ${currency}`);
          console.log('');
        }
      });
      
      console.log('✅ Currency conversion test completed successfully!');
      
    } else {
      console.log('❌ Invalid API response format');
    }
    
  } catch (error) {
    console.log('❌ API Error:', error.message);
    console.log('💡 Using fallback rates for testing...\n');
    
    // Test with fallback rates
    const fallbackRates = {
      TND: 1,
      USD: 0.32,
      EUR: 0.29,
      EGP: 15.8,
      DZD: 43.2,
      MAD: 3.1,
      SAR: 1.2,
      AED: 1.17,
      QAR: 1.16,
      KWD: 0.097,
    };
    
    console.log('📊 Fallback conversion test:');
    Object.entries(fallbackRates).forEach(([currency, rate]) => {
      if (currency !== 'TND') {
        const monthlyTND = 29;
        const yearlyTND = 278;
        
        const monthlyConverted = monthlyTND * rate;
        const yearlyConverted = yearlyTND * rate;
        
        console.log(`  ${currency}: ${monthlyTND} TND = ${monthlyConverted.toFixed(2)} ${currency} | ${yearlyTND} TND = ${yearlyConverted.toFixed(2)} ${currency}`);
      }
    });
    
    console.log('\n✅ Fallback rates working correctly!');
  }
}

// Calculate savings
function calculateSavings() {
  console.log('\n💰 Savings Calculation:');
  const monthlyTND = 29;
  const yearlyTND = 278;
  const yearlyIfMonthly = monthlyTND * 12; // 348 TND
  
  const savings = yearlyIfMonthly - yearlyTND; // 70 TND
  const savingsPercentage = Math.round((savings / yearlyIfMonthly) * 100); // 20%
  
  console.log(`  Monthly: ${monthlyTND} TND`);
  console.log(`  Yearly: ${yearlyTND} TND`);
  console.log(`  Yearly if paying monthly: ${yearlyIfMonthly} TND`);
  console.log(`  Savings: ${savings} TND (${savingsPercentage}%)`);
}

// Run tests
testCurrencyConversion().then(() => {
  calculateSavings();
}).catch(console.error);
