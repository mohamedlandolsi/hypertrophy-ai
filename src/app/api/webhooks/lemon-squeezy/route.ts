import { NextRequest, NextResponse } from 'next/server';
import { upgradeUserToPro, downgradeUserToFree } from '@/lib/subscription';
import { 
  ApiErrorHandler, 
  ValidationError,
  logger 
} from '@/lib/error-handler';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// Rate limiting for webhooks (simple in-memory store)
const webhookRateLimit = new Map<string, { count: number; resetTime: number }>();
const WEBHOOK_RATE_LIMIT = 10; // Max 10 requests per minute per IP
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

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
      
      // NEW: Handle one-time training program purchases
      case 'order_created':
        await handleOrderCreated(data, meta);
        break;
        
      default:
        logger.info('Unhandled webhook event type', { ...context, eventType });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}

// NEW: Handle order_created events for training program purchases
async function handleOrderCreated(orderData: {
  id: string;
  attributes: {
    user_email?: string;
    status: string;
    total: number;
    currency: string;
    first_order_item?: {
      product_id?: string;
      variant_id?: string;
      product_name?: string;
    };
    order_items?: Array<{
      product_id?: string;
      variant_id?: string;
      product_name?: string;
    }>;
  };
}, meta: {
  test_mode: boolean;
  event_name: string;
  webhook_id: string;
  custom_data?: Record<string, unknown>;
}) {
  const {
    id: orderId,
    attributes: {
      user_email,
      status,
      total,
      currency,
      first_order_item,
      order_items
    }
  } = orderData;

  logger.info('Processing order_created event', { 
    orderId, 
    user_email, 
    status, 
    total, 
    currency 
  });

  // Only process completed/paid orders
  if (status !== 'paid') {
    logger.info('Skipping order - not paid', { orderId, status });
    return;
  }

  // Get product ID from first order item or order items array
  const productId = first_order_item?.product_id || 
                   (order_items && order_items[0]?.product_id);

  if (!productId) {
    logger.error('No product ID found in order', undefined, { order_id: orderId });
    throw new ValidationError('Product ID not found in order data');
  }

  // Check if this is a subscription product (skip if it is - handled by subscription events)
  const subscriptionProductIds = [
    process.env.LEMONSQUEEZY_PRO_MONTHLY_PRODUCT_ID,
    process.env.LEMONSQUEEZY_PRO_YEARLY_PRODUCT_ID
  ].filter(Boolean);

  if (subscriptionProductIds.includes(productId)) {
    logger.info('Skipping order - subscription product handled by subscription events', { 
      order_id: orderId, 
      product_id: productId 
    });
    return;
  }

  // Check if this is a training program purchase
  const trainingProgram = await prisma.trainingProgram.findUnique({
    where: { lemonSqueezyId: productId },
    select: { 
      id: true, 
      name: true, 
      price: true,
      isActive: true 
    }
  });

  if (!trainingProgram) {
    logger.info('Product not found in training programs', { order_id: orderId, product_id: productId });
    return;
  }

  if (!trainingProgram.isActive) {
    logger.error('Attempt to purchase inactive training program', undefined, { 
      order_id: orderId, 
      product_id: productId, 
      program_id: trainingProgram.id 
    });
    throw new ValidationError('Training program is not active');
  }

  // Find user by email
  if (!user_email) {
    logger.error('No user email in order data', undefined, { order_id: orderId });
    throw new ValidationError('User email not found in order data');
  }

  // Look up user by email in Supabase auth
  const user = await prisma.user.findFirst({
    where: {
      id: {
        // We need to find the user by their Supabase auth email
        // Since we don't store email in our User table, we'll use the custom_data user_id if available
        // or we'll need to implement email lookup via Supabase
        in: meta.custom_data?.user_id ? [meta.custom_data.user_id as string] : []
      }
    },
    select: { id: true }
  });

  // If no user found via custom_data, we might need to implement email lookup
  // For now, we'll require user_id in custom_data
  const userId = meta.custom_data?.user_id as string;
  
  if (!userId || !user) {
    logger.error('User not found for training program purchase', undefined, { 
      order_id: orderId, 
      user_email, 
      user_id: userId,
      product_id: productId 
    });
    throw new ValidationError('User not found for training program purchase. User must be logged in during purchase.');
  }

  // Validate purchase amount matches training program price
  const expectedPriceCents = trainingProgram.price;
  const orderTotalCents = Math.round(total * 100); // Convert to cents

  if (orderTotalCents !== expectedPriceCents) {
    logger.error('Order total does not match training program price', undefined, {
      order_id: orderId,
      order_total: orderTotalCents,
      expected_price: expectedPriceCents,
      program_id: trainingProgram.id
    });
    throw new ValidationError('Order total does not match training program price');
  }

  // Check if user already owns this program
  const existingPurchase = await prisma.userPurchase.findUnique({
    where: {
      userId_trainingProgramId: {
        userId: userId,
        trainingProgramId: trainingProgram.id
      }
    }
  });

  if (existingPurchase) {
    logger.info('User already owns this training program', {
      order_id: orderId,
      user_id: userId,
      program_id: trainingProgram.id,
      existing_purchase_date: existingPurchase.purchaseDate
    });
    return; // Don't create duplicate purchase
  }

  // Create UserPurchase record
  await prisma.userPurchase.create({
    data: {
      userId: userId,
      trainingProgramId: trainingProgram.id,
      purchaseDate: new Date()
    }
  });

  // Create audit trail
  await createAuditTrail('training_program_purchased', userId, {
    ...orderData,
    trainingProgramId: trainingProgram.id,
    trainingProgramName: trainingProgram.name
  });

  logger.info('Training program purchase completed successfully', {
    order_id: orderId,
    user_id: userId,
    program_id: trainingProgram.id,
    program_name: trainingProgram.name,
    price: trainingProgram.price,
    user_email
  });
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
    select: { id: true, plan: true }
  });

  if (!user) {
    logger.error(`User not found in database during subscription activation - UserID: ${userId}`);
    throw new ValidationError('User not found in database');
  }

  // Create audit trail
  await createAuditTrail('subscription_activated', userId, subscriptionData);

  // Activate for active subscriptions or trial subscriptions
  if (status === 'active' || status === 'on_trial') {
    logger.info('Upgrading user to Pro', { userId, lemonSqueezyId, status });
    
    await upgradeUserToPro(userId, {
      lemonSqueezyId: lemonSqueezyId.toString(),
      planId: product_id.toString(),
      variantId: variant_id.toString(),
      currentPeriodStart: new Date(created_at),
      currentPeriodEnd: new Date(renews_at),
    });
    
    logger.info('User successfully upgraded to Pro', { userId, lemonSqueezyId, status });
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
    select: { id: true, plan: true }
  });

  if (!user) {
    logger.error(`User not found in database during subscription deactivation - UserID: ${userId}`);
    throw new ValidationError('User not found in database');
  }

  // Create audit trail
  await createAuditTrail('subscription_deactivated', userId, subscriptionData);

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
    select: { id: true, plan: true }
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
      // Determine subscription period based on amount
      const isYearly = total === 90;
      const currentPeriodEnd = new Date();
      if (isYearly) {
        currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
      } else {
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
      }
      
      await upgradeUserToPro(userId, {
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
        period: isYearly ? 'yearly' : 'monthly'
      });
    }
  } else {
    logger.warn('Payment status is not paid', { status, userId });
  }
}