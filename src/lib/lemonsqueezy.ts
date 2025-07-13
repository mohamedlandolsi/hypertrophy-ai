/**
 * LemonSqueezy integration service
 * Handles checkout URL generation and subscription management
 */

import { BASE_PRICES_TND } from './currency';

interface LemonSqueezyProduct {
  id: string;
  name: string;
  price: number;
  variantId: string;
  interval?: 'month' | 'year';
}

interface CheckoutOptions {
  productId: string;
  variantId: string;
  userId: string;
  userEmail?: string;
  successUrl?: string;
  cancelUrl?: string;
}

interface LemonSqueezySubscription {
  id: string;
  status: string;
  product_id: string;
  variant_id: string;
  customer_id: string;
  user_email: string;
  renews_at: string | null;
  ends_at: string | null;
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
}

// Product configuration - Updated with TND-based pricing
export const LEMONSQUEEZY_PRODUCTS: Record<string, LemonSqueezyProduct> = {
  PRO_MONTHLY: {
    id: process.env.LEMONSQUEEZY_PRO_MONTHLY_PRODUCT_ID || '',
    name: 'HypertroQ Pro - Monthly',
    price: BASE_PRICES_TND.MONTHLY, // 29 TND
    variantId: process.env.LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID || '',
    interval: 'month'
  },
  PRO_YEARLY: {
    id: process.env.LEMONSQUEEZY_PRO_YEARLY_PRODUCT_ID || '',
    name: 'HypertroQ Pro - Yearly',
    price: BASE_PRICES_TND.YEARLY, // 278 TND (20% discount)
    variantId: process.env.LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID || '',
    interval: 'year'
  }
};

class LemonSqueezyService {
  private apiKey: string;
  private storeId: string;
  private baseUrl = 'https://api.lemonsqueezy.com/v1';

  constructor() {
    this.apiKey = process.env.LEMONSQUEEZY_API_KEY || '';
    this.storeId = process.env.LEMONSQUEEZY_STORE_ID || '';
    
    if (!this.apiKey || !this.storeId) {
      throw new Error('LemonSqueezy API key and store ID must be configured');
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LemonSqueezy API error: ${response.status} ${error}`);
    }

    return response.json();
  }

  /**
   * Generate a checkout URL for a product
   */
  async createCheckoutUrl(options: CheckoutOptions): Promise<string> {
    const product = Object.values(LEMONSQUEEZY_PRODUCTS).find(
      p => p.id === options.productId || p.variantId === options.variantId
    );

    if (!product) {
      throw new Error(`Product not found: ${options.productId}`);
    }

    const checkoutData = {
      data: {
        type: 'checkouts',
        attributes: {
          checkout_options: {
            embed: false,
            media: true,
            logo: true,
          },
          checkout_data: {
            email: options.userEmail,
            custom: {
              user_id: options.userId,
            },
          },
          product_options: {
            enabled_variants: [product.variantId],
            redirect_url: options.successUrl || `${process.env.NEXTAUTH_URL}/dashboard?upgraded=true`,
            receipt_link_url: options.successUrl || `${process.env.NEXTAUTH_URL}/dashboard`,
            receipt_thank_you_note: 'Welcome to HypertroQ Pro! Enjoy unlimited AI coaching.',
          },
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        },
        relationships: {
          store: {
            data: {
              type: 'stores',
              id: this.storeId,
            },
          },
          variant: {
            data: {
              type: 'variants',
              id: product.variantId,
            },
          },
        },
      },
    };

    const response = await this.makeRequest('/checkouts', {
      method: 'POST',
      body: JSON.stringify(checkoutData),
    });

    return response.data.attributes.url;
  }

  /**
   * Get subscription details by ID
   */
  async getSubscription(subscriptionId: string): Promise<LemonSqueezySubscription> {
    const response = await this.makeRequest(`/subscriptions/${subscriptionId}`);
    return response.data.attributes;
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    await this.makeRequest(`/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Pause a subscription
   */
  async pauseSubscription(subscriptionId: string): Promise<void> {
    const pauseData = {
      data: {
        type: 'subscriptions',
        id: subscriptionId,
        attributes: {
          pause: {
            mode: 'void',
          },
        },
      },
    };

    await this.makeRequest(`/subscriptions/${subscriptionId}`, {
      method: 'PATCH',
      body: JSON.stringify(pauseData),
    });
  }

  /**
   * Resume a paused subscription
   */
  async resumeSubscription(subscriptionId: string): Promise<void> {
    const resumeData = {
      data: {
        type: 'subscriptions',
        id: subscriptionId,
        attributes: {
          pause: null,
        },
      },
    };

    await this.makeRequest(`/subscriptions/${subscriptionId}`, {
      method: 'PATCH',
      body: JSON.stringify(resumeData),
    });
  }
}

// Singleton instance
let lemonSqueezyService: LemonSqueezyService | null = null;

export function getLemonSqueezyService(): LemonSqueezyService {
  if (!lemonSqueezyService) {
    lemonSqueezyService = new LemonSqueezyService();
  }
  return lemonSqueezyService;
}

// Helper functions for easy use
export async function createProCheckoutUrl(
  userId: string, 
  userEmail?: string, 
  interval: 'month' | 'year' = 'month'
): Promise<string> {
  const service = getLemonSqueezyService();
  const product = interval === 'year' ? LEMONSQUEEZY_PRODUCTS.PRO_YEARLY : LEMONSQUEEZY_PRODUCTS.PRO_MONTHLY;
  
  return service.createCheckoutUrl({
    productId: product.id,
    variantId: product.variantId,
    userId,
    userEmail,
  });
}

export { LemonSqueezyService };
