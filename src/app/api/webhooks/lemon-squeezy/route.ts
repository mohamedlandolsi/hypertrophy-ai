import { NextRequest, NextResponse } from 'next/server';
import { upgradeUserToProTier, downgradeUserToFreeTier } from '@/lib/subscription';
import { 
  ApiErrorHandler, 
  ValidationError,
  logger 
} from '@/lib/error-handler';
import { prisma } from '@/lib/prisma';
import { SubscriptionTier } from '@prisma/client';
import crypto from 'crypto';

// Rate limiting for webhooks (simple in-memory store)
const webhookRateLimit = new Map<string, { count: number; resetTime: number }>();
const WEBHOOK_RATE_LIMIT = 10; // Max 10 requests per minute per IP
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

// Map LemonSqueezy variant IDs to subscription tiers
function getSubscriptionTierFromVariant(variantId: string): 'PRO_MONTHLY' | 'PRO_YEARLY' {
  const monthlyVariantId = process.env.LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID;
  const yearlyVariantId = process.env.LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID;

  if (variantId === yearlyVariantId) {
    return 'PRO_YEARLY';
  } else if (variantId === monthlyVariantId) {
    return 'PRO_MONTHLY';
  }

  // Default to PRO_MONTHLY if variant ID doesn't match (backward compatibility)
  logger.warn('Unknown variant ID, defaulting to PRO_MONTHLY', { variantId });
  return 'PRO_MONTHLY';
}

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

// Rate limiting check
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const clientData = webhookRateLimit.get(ip);
  
  if (!clientData || now > clientData.resetTime) {
    webhookRateLimit.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (clientData.count >= WEBHOOK_RATE_LIMIT) {
    return false;
  }
  
  clientData.count++;
  return true;
}

// Validate payment data
function validatePaymentData(data: Record<string, unknown>, eventType: string): void {
  const requiredFields = ['id', 'attributes'];
  const requiredAttributes = ['status'];
  
  for (const field of requiredFields) {
    if (!data[field]) {
      throw new ValidationError(`Missing required field: ${field}`);
    }
  }
  
  const attributes = data.attributes as Record<string, unknown>;
  if (!attributes) {
    throw new ValidationError('Missing attributes object');
  }
  
  for (const attr of requiredAttributes) {
    if (!attributes[attr]) {
      throw new ValidationError(`Missing required attribute: ${attr}`);
    }
  }
  
  // Validate subscription-specific fields
  if (eventType.includes('subscription')) {
    const subscriptionRequiredFields = ['product_id', 'variant_id'];
    for (const field of subscriptionRequiredFields) {
      if (!attributes[field]) {
        throw new ValidationError(`Missing subscription field: ${field}`);
      }
    }
    
    // Validate product and variant IDs against our configuration
    const validProductIds = [
      process.env.LEMONSQUEEZY_PRO_MONTHLY_PRODUCT_ID,
      process.env.LEMONSQUEEZY_PRO_YEARLY_PRODUCT_ID
    ];
    const validVariantIds = [
      process.env.LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID,
      process.env.LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID
    ];
    
    if (!validProductIds.includes(attributes.product_id as string)) {
      throw new ValidationError(`Invalid product ID: ${attributes.product_id}`);
    }
    
    if (!validVariantIds.includes(attributes.variant_id as string)) {
      throw new ValidationError(`Invalid variant ID: ${attributes.variant_id}`);
    }
  }
}

// Audit trail function
async function createAuditTrail(eventType: string, userId: string, data: Record<string, unknown>): Promise<void> {
  try {
    const attributes = data.attributes as Record<string, unknown> || {};
    // Note: You might want to create a separate AuditLog table for this
    logger.info('Payment audit trail', {
      eventType,
      userId,
      timestamp: new Date().toISOString(),
      subscriptionId: data.id,
      status: attributes.status,
      productId: attributes.product_id,
      variantId: attributes.variant_id,
      userAgent: 'webhook',
      ip: 'unknown'
    });
  } catch (error) {
    logger.error('Failed to create audit trail', error as Error);
  }
}

// This will be called by Lemon Squeezy webhooks
export async function POST(request: NextRequest) {
  const context = ApiErrorHandler.createContext(request);
  
  try {
    // Get client IP for rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    context.ip || 'unknown';
    
    // Apply rate limiting
    if (!checkRateLimit(clientIP)) {
      logger.warn('Webhook rate limit exceeded', { ...context, clientIP });
      return NextResponse.json(
        { error: 'Rate limit exceeded' }, 
        { status: 429 }
      );
    }
    
    logger.info('Lemon Squeezy webhook received', { ...context, clientIP });
    
    const bodyText = await request.text();
    const body = JSON.parse(bodyText);
    
    // Verify webhook signature BEFORE processing
    const signature = request.headers.get('x-signature');
    
    if (!verifyLemonSqueezySignature(bodyText, signature)) {
      logger.error(`Webhook signature verification failed - Client: ${clientIP}, Signature: ${signature ? 'present' : 'missing'}`);
      throw new ValidationError('Invalid webhook signature');
    }
    
    const { meta, data } = body;
    const eventType = meta?.event_name;
    
    if (!eventType || !data) {
      throw new ValidationError('Invalid webhook payload');
    }

    // Validate payment data structure and values
    validatePaymentData(data, eventType);

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

  // Get user ID from meta.custom_data
  const userId = meta.custom_data?.user_id as string;
  
  if (!userId || typeof userId !== 'string') {
    logger.error(`User ID validation failed in subscription activation - UserID: ${userId}, Type: ${typeof userId}`);
    throw new ValidationError('User ID not found in subscription data');
  }

  // Validate user exists in database
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, subscriptionTier: true }
  });

  if (!user) {
    logger.error(`User not found in database during subscription activation - UserID: ${userId}`);
    throw new ValidationError('User not found in database');
  }

  // Determine subscription tier from variant ID
  const tier = getSubscriptionTierFromVariant(variant_id);

  // Create audit trail
  await createAuditTrail('subscription_activated', userId, subscriptionData);

  // Activate for active subscriptions or trial subscriptions
  if (status === 'active' || status === 'on_trial') {
    logger.info('Upgrading user to Pro', { userId, lemonSqueezyId, status, tier });
    
    await upgradeUserToProTier(userId, tier, {
      lemonSqueezyId: lemonSqueezyId.toString(),
      planId: product_id.toString(),
      variantId: variant_id.toString(),
      currentPeriodStart: new Date(created_at),
      currentPeriodEnd: new Date(renews_at),
    });
    
    logger.info('User successfully upgraded to Pro', { userId, lemonSqueezyId, status, tier });
  } else {
    logger.warn('Subscription status does not qualify for Pro access', { status, userId });
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
  // Get user ID from meta.custom_data
  const userId = meta.custom_data?.user_id as string;
  
  if (!userId || typeof userId !== 'string') {
    logger.error(`User ID validation failed in subscription deactivation - UserID: ${userId}, Type: ${typeof userId}`);
    throw new ValidationError('User ID not found in subscription data');
  }

  // Validate user exists in database
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, subscriptionTier: true }
  });

  if (!user) {
    logger.error(`User not found in database during subscription deactivation - UserID: ${userId}`);
    throw new ValidationError('User not found in database');
  }

  // Create audit trail
  await createAuditTrail('subscription_deactivated', userId, subscriptionData);

  await downgradeUserToFreeTier(userId);
  
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
  const {
    attributes: {
      status,
      billing_reason,
      subscription_id,
      total,
      currency
    }
  } = invoiceData;

  // Get user ID from custom_data
  const userId = meta.custom_data?.user_id as string;
  
  if (!userId || typeof userId !== 'string') {
    logger.error(`User ID validation failed in payment success - UserID: ${userId}, Type: ${typeof userId}`);
    throw new ValidationError('User ID not found in payment success data');
  }

  // Validate user exists in database
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, subscriptionTier: true }
  });

  if (!user) {
    logger.error(`User not found in database during payment success - UserID: ${userId}`);
    throw new ValidationError('User not found in database');
  }

  // Validate payment amount and currency
  const expectedAmounts = [9, 90]; // $9 monthly, $90 yearly
  const expectedCurrency = 'USD';
  
  if (currency !== expectedCurrency) {
    logger.error(`Invalid payment currency - Currency: ${currency}, Expected: ${expectedCurrency}, UserID: ${userId}`);
    throw new ValidationError(`Invalid payment currency: ${currency}`);
  }
  
  if (!expectedAmounts.includes(total)) {
    logger.error(`Invalid payment amount - Amount: ${total}, Expected: ${expectedAmounts.join(' or ')}, UserID: ${userId}`);
    throw new ValidationError(`Invalid payment amount: ${total}`);
  }

  // Create audit trail
  await createAuditTrail('payment_success', userId, invoiceData);

  // Only upgrade for successful payments
  if (status === 'paid') {
    logger.info('Payment successful, processing upgrade', { userId, total, currency });
    
    // For subscription payments, especially initial payments, upgrade to Pro
    if (billing_reason === 'initial' || billing_reason === 'renewal') {
      // Determine subscription tier based on amount
      const isYearly = total === 90;
      const tier: SubscriptionTier = isYearly ? 'PRO_YEARLY' : 'PRO_MONTHLY';
      const currentPeriodEnd = new Date();
      if (isYearly) {
        currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
      } else {
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
      }
      
      await upgradeUserToProTier(userId, tier, {
        lemonSqueezyId: subscription_id.toString(),
        planId: isYearly ? 'pro_yearly' : 'pro_monthly',
        variantId: isYearly ? 
          process.env.LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID || 'unknown' :
          process.env.LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID || 'unknown',
        currentPeriodStart: new Date(),
        currentPeriodEnd,
      });
      
      logger.info('User successfully upgraded to Pro via payment', { 
        userId, 
        subscription_id, 
        billing_reason,
        amount: total,
        period: isYearly ? 'yearly' : 'monthly',
        tier
      });
    }
  } else {
    logger.warn('Payment status is not paid', { status, userId });
  }
}