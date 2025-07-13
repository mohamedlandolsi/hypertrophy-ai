/**
 * Quick script to get your LemonSqueezy store ID using your API key
 * Run: node get-lemonsqueezy-store-info.js
 */

const LEMONSQUEEZY_API_KEY = process.env.LEMONSQUEEZY_API_KEY || 'your_api_key_here';

async function getStoreInfo() {
  try {
    const response = await fetch('https://api.lemonsqueezy.com/v1/stores', {
      headers: {
        'Authorization': `Bearer ${LEMONSQUEEZY_API_KEY}`,
        'Accept': 'application/vnd.api+json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('🏪 Your LemonSqueezy Stores:');
    console.log('================================');
    
    data.data.forEach((store, index) => {
      console.log(`Store ${index + 1}:`);
      console.log(`  Name: ${store.attributes.name}`);
      console.log(`  ID: ${store.id}`);
      console.log(`  Slug: ${store.attributes.slug}`);
      console.log(`  Domain: ${store.attributes.domain}`);
      console.log(`  URL: ${store.attributes.url}`);
      console.log('');
    });

    if (data.data.length > 0) {
      console.log(`✅ Use this Store ID in your .env file:`);
      console.log(`LEMONSQUEEZY_STORE_ID=${data.data[0].id}`);
    }

  } catch (error) {
    console.error('❌ Error fetching store info:', error.message);
    console.log('\n💡 Make sure your LEMONSQUEEZY_API_KEY is correct in your .env file');
  }
}

getStoreInfo();
