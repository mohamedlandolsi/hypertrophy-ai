const crypto = require('crypto');

const payload = {
  "data": {
    "id": "1334098",
    "type": "subscriptions",
    "links": {
      "self": "https://api.lemonsqueezy.com/v1/subscriptions/1334098"
    },
    "attributes": {
      "urls": {
        "customer_portal": "https://hypertroq.lemonsqueezy.com/billing?expires=1752337417&test_mode=1&user=5197310&signature=b409367818d38621e798a599cf9fe25ea13eb20885a2b3a6afa5359ef88539b9",
        "update_payment_method": "https://hypertroq.lemonsqueezy.com/subscription/1334098/payment-details?expires=1752337417&signature=01a7a29bd28e26013e06f493ad7bd4ce2dc77a12b3904f94de0b2f1d0db2e539",
        "customer_portal_update_subscription": "https://hypertroq.lemonsqueezy.com/billing/1334098/update?expires=1752337417&user=5197310&signature=df4db33cc5fb0ce1be40dd5b84e7b954a0e3333d07cfc4c357db59a2372279ba"
      },
      "pause": null,
      "status": "on_trial",
      "ends_at": null,
      "order_id": 5932606,
      "store_id": 200567,
      "cancelled": false,
      "renews_at": "2025-07-19T10:23:32.000000Z",
      "test_mode": true,
      "user_name": "mohamed",
      "card_brand": "mastercard",
      "created_at": "2025-07-12T10:23:33.000000Z",
      "product_id": 575214,
      "updated_at": "2025-07-12T10:23:36.000000Z",
      "user_email": "mohamedlandolsi30@gmail.com",
      "variant_id": 896458,
      "customer_id": 6287548,
      "product_name": "Pro Plan",
      "variant_name": "Default",
      "order_item_id": 5871833,
      "trial_ends_at": "2025-07-19T10:23:32.000000Z",
      "billing_anchor": 19,
      "card_last_four": "4444",
      "status_formatted": "On Trial",
      "payment_processor": "stripe",
      "first_subscription_item": {
        "id": 3011320,
        "price_id": 1385711,
        "quantity": 1,
        "created_at": "2025-07-12T10:23:36.000000Z",
        "updated_at": "2025-07-12T10:23:36.000000Z",
        "is_usage_based": false,
        "subscription_id": 1334098
      }
    },
    "relationships": {
      "order": {
        "links": {
          "self": "https://api.lemonsqueezy.com/v1/subscriptions/1334098/relationships/order",
          "related": "https://api.lemonsqueezy.com/v1/subscriptions/1334098/order"
        }
      },
      "store": {
        "links": {
          "self": "https://api.lemonsqueezy.com/v1/subscriptions/1334098/relationships/store",
          "related": "https://api.lemonsqueezy.com/v1/subscriptions/1334098/store"
        }
      },
      "product": {
        "links": {
          "self": "https://api.lemonsqueezy.com/v1/subscriptions/1334098/relationships/product",
          "related": "https://api.lemonsqueezy.com/v1/subscriptions/1334098/product"
        }
      },
      "variant": {
        "links": {
          "self": "https://api.lemonsqueezy.com/v1/subscriptions/1334098/relationships/variant",
          "related": "https://api.lemonsqueezy.com/v1/subscriptions/1334098/variant"
        }
      },
      "customer": {
        "links": {
          "self": "https://api.lemonsqueezy.com/v1/subscriptions/1334098/relationships/customer",
          "related": "https://api.lemonsqueezy.com/v1/subscriptions/1334098/customer"
        }
      },
      "order-item": {
        "links": {
          "self": "https://api.lemonsqueezy.com/v1/subscriptions/1334098/relationships/order-item",
          "related": "https://api.lemonsqueezy.com/v1/subscriptions/1334098/order-item"
        }
      },
      "subscription-items": {
        "links": {
          "self": "https://api.lemonsqueezy.com/v1/subscriptions/1334098/relationships/subscription-items",
          "related": "https://api.lemonsqueezy.com/v1/subscriptions/1334098/subscription-items"
        }
      },
      "subscription-invoices": {
        "links": {
          "self": "https://api.lemonsqueezy.com/v1/subscriptions/1334098/relationships/subscription-invoices",
          "related": "https://api.lemonsqueezy.com/v1/subscriptions/1334098/subscription-invoices"
        }
      }
    }
  },
  "meta": {
    "test_mode": true,
    "event_name": "subscription_created",
    "webhook_id": "e0896ad4-cccf-4151-8468-46349b642785",
    "custom_data": {
      "user_id": "9104e76a-a73e-412b-b8d6-03064ce37347"
    }
  }
};

const payloadString = JSON.stringify(payload);
const secret = 'whsec_a7f8d9e6c5b4a3f2e1d0c9b8a7f6e5d4'; // Your webhook secret

// Generate signature
const hmac = crypto.createHmac('sha256', secret);
const signature = hmac.update(payloadString).digest('hex');

console.log('Testing subscription_created webhook...');
console.log('Payload size:', payloadString.length);
console.log('Generated signature:', signature);

// Test the webhook
fetch('http://localhost:3000/api/webhooks/lemon-squeezy', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-signature': signature
  },
  body: payloadString
})
.then(response => {
  console.log('Response status:', response.status);
  return response.text();
})
.then(text => {
  console.log('Response body:', text);
})
.catch(error => {
  console.error('Error:', error);
});
