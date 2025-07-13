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
    
    if (!this.apiKey) {
      throw new Error('LEMONSQUEEZY_API_KEY environment variable is required');
    }
    
    if (!this.storeId || this.storeId === 'your_store_id_here') {
      throw new Error('LEMONSQUEEZY_STORE_ID environment variable must be configured with actual store ID');
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
    // Search by variant ID first (should be unique), then by product ID
    const product = Object.values(LEMONSQUEEZY_PRODUCTS).find(
      p => p.variantId === options.variantId
    ) || Object.values(LEMONSQUEEZY_PRODUCTS).find(
      p => p.id === options.productId
    );

    if (!product) {
      throw new Error(`Product not found for productId: ${options.productId}, variantId: ${options.variantId}`);
    }

    console.log(`Selected product: ${product.name} (${product.interval}) with variant ID: ${product.variantId}`);

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
            redirect_url: options.successUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?upgraded=true`,
            receipt_link_url: options.successUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
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

    const checkoutUrl = response.data.attributes.url;
    console.log(`Generated checkout URL: ${checkoutUrl}`);
    console.log(`URL should contain variant: ${product.variantId}`);
    
    return checkoutUrl;
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
  try {
    // Check if LemonSqueezy is properly configured
    const apiKey = process.env.LEMONSQUEEZY_API_KEY;
    const storeId = process.env.LEMONSQUEEZY_STORE_ID;
    
    if (!apiKey) {
      throw new Error('LemonSqueezy API key not configured. Please set LEMONSQUEEZY_API_KEY environment variable.');
    }
    
    if (!storeId || storeId === 'your_store_id_here') {
      throw new Error('LemonSqueezy store ID not configured. Please set LEMONSQUEEZY_STORE_ID environment variable with your actual store ID.');
    }
    
    const service = getLemonSqueezyService();
    const product = interval === 'year' ? LEMONSQUEEZY_PRODUCTS.PRO_YEARLY : LEMONSQUEEZY_PRODUCTS.PRO_MONTHLY;
    
    console.log(`createProCheckoutUrl called with interval: ${interval}`);
    console.log(`Selected product for ${interval}:`, {
      name: product.name,
      id: product.id,
      variantId: product.variantId,
      interval: product.interval
    });
    
    // Check if product configuration is valid
    if (!product.id || product.id === 'your_monthly_product_id' || product.id === 'your_yearly_product_id' || product.id === '') {
      throw new Error(`LemonSqueezy product not configured for interval: ${interval}. Please configure LEMONSQUEEZY_PRO_${interval.toUpperCase()}_PRODUCT_ID environment variable.`);
    }
    
    if (!product.variantId || product.variantId === 'your_monthly_variant_id' || product.variantId === 'your_yearly_variant_id' || product.variantId === '') {
      throw new Error(`LemonSqueezy variant not configured for interval: ${interval}. Please configure LEMONSQUEEZY_PRO_${interval.toUpperCase()}_VARIANT_ID environment variable.`);
    }
    
    return service.createCheckoutUrl({
      productId: product.id,
      variantId: product.variantId,
      userId,
      userEmail,
    });
  } catch (error) {
    console.error('LemonSqueezy checkout creation failed:', error);
    throw error;
  }
}

export { LemonSqueezyService };
