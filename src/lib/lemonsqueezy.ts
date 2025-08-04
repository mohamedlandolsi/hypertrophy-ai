/**
 * LemonSqueezy integration service
 * Handles checkout URL generation and subscription management
 */

import { BASE_PRICES_USD } from './currency';

interface LemonSqueezyProduct {
  id: string;
  name: string;
  price: number;
  variantId: string;
  interval?: 'month' | 'year';
  checkoutUrl?: string;
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

// Product configuration - Updated with USD-based pricing
export const LEMONSQUEEZY_PRODUCTS: Record<string, LemonSqueezyProduct> = {
  PRO_MONTHLY: {
    id: process.env.LEMONSQUEEZY_PRO_MONTHLY_PRODUCT_ID || '',
    name: 'HypertroQ Pro - Monthly',
    price: BASE_PRICES_USD.MONTHLY, // $9 USD
    variantId: process.env.LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID || '',
    interval: 'month',
    checkoutUrl: 'https://hypertroq.lemonsqueezy.com/buy/3670ca61-2fe7-4fbf-a0ba-01f9f0313099'
  },
  PRO_YEARLY: {
    id: process.env.LEMONSQUEEZY_PRO_YEARLY_PRODUCT_ID || '',
    name: 'HypertroQ Pro - Yearly',
    price: BASE_PRICES_USD.YEARLY, // $90 USD (10 months pricing)
    variantId: process.env.LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID || '',
    interval: 'year',
    checkoutUrl: 'https://hypertroq.lemonsqueezy.com/buy/9c872ed8-6ef8-47b2-a2dd-00a832697ebb'
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

    // Validate that the product and variant IDs are properly configured
    if (!product.id || product.id === '') {
      throw new Error(`Product ID is not configured for ${product.name}`);
    }
    
    if (!product.variantId || product.variantId === '') {
      throw new Error(`Variant ID is not configured for ${product.name}`);
    }

    const checkoutData = {
      data: {
        type: 'checkouts',
        attributes: {
          checkout_options: {
            embed: false, // Explicitly prevent embedding to avoid iframe issues
            media: true,
            logo: true,
            button_color: '#3b82f6', // Brand color
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

    if (!response.data || !response.data.attributes || !response.data.attributes.url) {
      throw new Error('Invalid response from LemonSqueezy API: missing checkout URL');
    }

    let checkoutUrl = response.data.attributes.url;
    
    // Ensure the URL has the correct variant enabled
    // If the URL doesn't already have the enabled parameter, add it
    if (!checkoutUrl.includes('enabled=')) {
      const separator = checkoutUrl.includes('?') ? '&' : '?';
      checkoutUrl = `${checkoutUrl}${separator}enabled=${product.variantId}`;
    }
    
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
    
    // Use pre-created checkout URLs instead of dynamic API creation
    const product = interval === 'year' ? LEMONSQUEEZY_PRODUCTS.PRO_YEARLY : LEMONSQUEEZY_PRODUCTS.PRO_MONTHLY;
    
    if (!product.checkoutUrl) {
      throw new Error(`No checkout URL configured for ${interval} plan`);
    }
    
    let checkoutUrl = product.checkoutUrl;
    
    // Add user data and success URL as query parameters
    const params = new URLSearchParams();
    if (userEmail) {
      params.append('checkout[email]', userEmail);
    }
    params.append('checkout[custom][user_id]', userId);
    
    // Add success and cancel URLs
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hypertroq.com';
    params.append('checkout[success_url]', `${baseUrl}/checkout/success`);
    params.append('checkout[cancel_url]', `${baseUrl}/pricing`);
    
    if (params.toString()) {
      const separator = checkoutUrl.includes('?') ? '&' : '?';
      checkoutUrl = `${checkoutUrl}${separator}${params.toString()}`;
    }
    
    return checkoutUrl;
    
  } catch (error) {
    console.error('Error creating checkout URL:', error);
    throw error;
  }
}

export { LemonSqueezyService };
