// Test script to simulate the webhook payload you provided
const testWebhookPayload = {
  "data": {
    "id": "3833712",
    "type": "subscription-invoices",
    "links": {
      "self": "https://api.lemonsqueezy.com/v1/subscription-invoices/3833712"
    },
    "attributes": {
      "tax": 0,
      "urls": {
        "invoice_url": "https://app.lemonsqueezy.com/my-orders/94bd669c-d133-4ce0-8459-4a81ef8031cf/subscription-invoice/3833712?expires=1752335838&signature=f23139e0222ae70f152cd0927cc314b12802d41047a3a17144a9ecf60b86912e"
      },
      "total": 0,
      "status": "paid",
      "tax_usd": 0,
      "currency": "TND",
      "refunded": false,
      "store_id": 200567,
      "subtotal": 0,
      "test_mode": true,
      "total_usd": 0,
      "user_name": "mohamed",
      "card_brand": null,
      "created_at": "2025-07-12T09:56:48.000000Z",
      "updated_at": "2025-07-12T09:57:18.000000Z",
      "user_email": "mohamedlandolsi30@gmail.com",
      "customer_id": 6287548,
      "refunded_at": null,
      "subtotal_usd": 0,
      "currency_rate": "0.34447124",
      "tax_formatted": "TND0.000",
      "tax_inclusive": false,
      "billing_reason": "initial",
      "card_last_four": null,
      "discount_total": 0,
      "refunded_amount": 0,
      "subscription_id": 1334075,
      "total_formatted": "TND0.000",
      "status_formatted": "Paid",
      "discount_total_usd": 0,
      "subtotal_formatted": "TND0.000",
      "refunded_amount_usd": 0,
      "discount_total_formatted": "TND0.000",
      "refunded_amount_formatted": "TND0.000"
    },
    "relationships": {
      "store": {
        "links": {
          "self": "https://api.lemonsqueezy.com/v1/subscription-invoices/3833712/relationships/store",
          "related": "https://api.lemonsqueezy.com/v1/subscription-invoices/3833712/store"
        }
      },
      "customer": {
        "links": {
          "self": "https://api.lemonsqueezy.com/v1/subscription-invoices/3833712/relationships/customer",
          "related": "https://api.lemonsqueezy.com/v1/subscription-invoices/3833712/customer"
        }
      },
      "subscription": {
        "links": {
          "self": "https://api.lemonsqueezy.com/v1/subscription-invoices/3833712/relationships/subscription",
          "related": "https://api.lemonsqueezy.com/v1/subscription-invoices/3833712/subscription"
        }
      }
    }
  },
  "meta": {
    "test_mode": true,
    "event_name": "subscription_payment_success",
    "webhook_id": "2263ed9e-9700-497c-9fec-0d3faf4c8c5a",
    "custom_data": {
      "user_id": "9104e76a-a73e-412b-b8d6-03064ce37347"
    }
  }
};

console.log('Testing webhook payload structure...');
console.log('Event name:', testWebhookPayload.meta.event_name);
console.log('User ID:', testWebhookPayload.meta.custom_data.user_id);
console.log('Payment status:', testWebhookPayload.data.attributes.status);
console.log('Billing reason:', testWebhookPayload.data.attributes.billing_reason);
console.log('Subscription ID:', testWebhookPayload.data.attributes.subscription_id);

// Test the webhook endpoint
async function testWebhook() {
  try {
    const response = await fetch('http://localhost:3000/api/webhooks/lemon-squeezy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testWebhookPayload)
    });

    const result = await response.json();
    console.log('Webhook response:', result);
    
    if (response.ok) {
      console.log('✅ Webhook processed successfully!');
    } else {
      console.log('❌ Webhook failed:', result);
    }
  } catch (error) {
    console.error('❌ Error testing webhook:', error);
  }
}

console.log('\n🔄 Testing webhook endpoint...');
testWebhook();
