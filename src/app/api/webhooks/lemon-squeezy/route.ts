import { NextRequest, NextResponse } from 'next/server';
import { upgradeUserToPro, downgradeUserToFree } from '@/lib/subscription';
import { 
  ApiErrorHandler, 
  ValidationError,
  logger 
} from '@/lib/error-handler';
import crypto from 'crypto';

// Verify Lemon Squeezy webhook signature
function verifyLemonSqueezySignature(payload: string, signature: string | null): boolean {
  if (!signature) {
    return false;
  }
  
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    logger.error('LEMONSQUEEZY_WEBHOOK_SECRET not configured');
    return false;
  }
  
  const hmac = crypto.createHmac('sha256', secret);
  const digest = Buffer.from(hmac.update(payload).digest('hex'), 'utf8');
  const signatureBuffer = Buffer.from(signature, 'utf8');
  
  if (digest.length !== signatureBuffer.length) {
    return false;
  }
  
  try {
    return crypto.timingSafeEqual(digest, signatureBuffer);
  } catch (error) {
    logger.error('Error verifying webhook signature', error as Error);
    return false;
  }
}

// This will be called by Lemon Squeezy webhooks
export async function POST(request: NextRequest) {
  const context = ApiErrorHandler.createContext(request);
  
  try {
    logger.info('Lemon Squeezy webhook received', context);
    
    const bodyText = await request.text();
    console.log('Webhook body:', bodyText); // Debug log
    
    const body = JSON.parse(bodyText);
    console.log('Parsed webhook body:', JSON.stringify(body, null, 2)); // Debug log
    
    // Verify webhook signature
    const signature = request.headers.get('x-signature');
    console.log('Webhook signature:', signature); // Debug log
    
    if (!verifyLemonSqueezySignature(bodyText, signature)) {
      console.error('Webhook signature verification failed'); // Debug log
      throw new ValidationError('Invalid webhook signature');
    }
    
    console.log('Webhook signature verified successfully'); // Debug log

    const { meta, data } = body;
    const eventType = meta?.event_name;
    
    if (!eventType || !data) {
      throw new ValidationError('Invalid webhook payload');
    }

    logger.info('Processing webhook event', { ...context, eventType });

    switch (eventType) {
      case 'subscription_created':
      case 'subscription_updated':
        await handleSubscriptionActivated(data, meta);
        break;
        
      case 'subscription_payment_success':
        await handleSubscriptionPaymentSuccess(data, meta);
        break;
        
      case 'subscription_cancelled':
      case 'subscription_expired':
      case 'subscription_past_due':
        await handleSubscriptionDeactivated(data, meta);
        break;
        
      default:
        logger.info('Unhandled webhook event type', { ...context, eventType });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}

async function handleSubscriptionActivated(subscriptionData: {
  id: string;
  attributes: {
    user_email?: string;
    status: string;
    product_id: string;
    variant_id: string;
    created_at: string;
    renews_at: string;
    user_name?: string;
  };
}, meta: {
  test_mode: boolean;
  event_name: string;
  webhook_id: string;
  custom_data?: Record<string, unknown>;
}) {
  console.log('handleSubscriptionActivated called with:', JSON.stringify(subscriptionData, null, 2)); // Debug log
  console.log('Meta data:', JSON.stringify(meta, null, 2)); // Debug log
  
  const {
    id: lemonSqueezyId,
    attributes: {
      status,
      product_id,
      variant_id,
      created_at,
      renews_at
    }
  } = subscriptionData;

  console.log('Extracted data:', { lemonSqueezyId, status, product_id, variant_id }); // Debug log

  // Get user ID from meta.custom_data
  const userId = meta.custom_data?.user_id as string;
  
  console.log('User ID from custom_data:', userId); // Debug log
  
  if (!userId || typeof userId !== 'string') {
    console.error('User ID validation failed:', { userId, type: typeof userId }); // Debug log
    throw new ValidationError('User ID not found in subscription data');
  }

  // Activate for active subscriptions or trial subscriptions
  if (status === 'active' || status === 'on_trial') {
    console.log(`Subscription is ${status}, upgrading user to Pro...`); // Debug log
    
    await upgradeUserToPro(userId, {
      lemonSqueezyId: lemonSqueezyId.toString(),
      planId: product_id.toString(),
      variantId: variant_id.toString(),
      currentPeriodStart: new Date(created_at),
      currentPeriodEnd: new Date(renews_at),
    });
    
    console.log('User successfully upgraded to Pro:', { userId, lemonSqueezyId }); // Debug log
    logger.info('User upgraded to Pro', { userId, lemonSqueezyId, status });
  } else {
    console.log('Subscription status does not qualify for Pro access:', status); // Debug log
  }
}

async function handleSubscriptionDeactivated(subscriptionData: {
  attributes: {
    user_email?: string;
    status: string;
  };
}, meta: {
  test_mode: boolean;
  event_name: string;
  webhook_id: string;
  custom_data?: Record<string, unknown>;
}) {
  console.log('handleSubscriptionDeactivated called with:', JSON.stringify(subscriptionData, null, 2)); // Debug log
  console.log('Meta data:', JSON.stringify(meta, null, 2)); // Debug log

  // Get user ID from meta.custom_data
  const userId = meta.custom_data?.user_id as string;
  
  if (!userId || typeof userId !== 'string') {
    throw new ValidationError('User ID not found in subscription data');
  }

  await downgradeUserToFree(userId);
  
  logger.info('User downgraded to Free', { userId });
}

async function handleSubscriptionPaymentSuccess(invoiceData: {
  id: string;
  type: string;
  attributes: {
    status: string;
    billing_reason: string;
    user_email: string;
    subscription_id: number;
    total: number;
    currency: string;
    test_mode: boolean;
  };
}, meta: {
  test_mode: boolean;
  event_name: string;
  webhook_id: string;
  custom_data?: Record<string, unknown>;
}) {
  console.log('handleSubscriptionPaymentSuccess called with:', JSON.stringify(invoiceData, null, 2)); // Debug log
  console.log('Meta data:', JSON.stringify(meta, null, 2)); // Debug log
  
  const {
    attributes: {
      status,
      billing_reason,
      user_email,
      subscription_id
    }
  } = invoiceData;

  console.log('Extracted invoice data:', { status, billing_reason, user_email, subscription_id }); // Debug log

  // Get user ID from custom_data
  const userId = meta.custom_data?.user_id as string;
  
  console.log('User ID from custom_data:', userId); // Debug log
  
  if (!userId || typeof userId !== 'string') {
    console.error('User ID validation failed:', { userId, type: typeof userId }); // Debug log
    throw new ValidationError('User ID not found in payment success data');
  }

  // Only upgrade for successful payments
  if (status === 'paid') {
    console.log('Payment is successful, upgrading user to Pro...'); // Debug log
    
    // For subscription payments, especially initial payments, upgrade to Pro
    if (billing_reason === 'initial' || billing_reason === 'renewal') {
      await upgradeUserToPro(userId, {
        lemonSqueezyId: subscription_id.toString(),
        planId: 'pro', // You might want to get this from your product configuration
        variantId: process.env.LEMONSQUEEZY_VARIANT_ID || 'unknown',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      });
      
      console.log('User successfully upgraded to Pro:', { userId, subscription_id }); // Debug log
      logger.info('User upgraded to Pro via payment success', { userId, subscription_id, billing_reason });
    }
  } else {
    console.log('Payment status is not paid:', status); // Debug log
  }
}