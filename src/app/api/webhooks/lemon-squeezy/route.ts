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
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
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
    const body = JSON.parse(bodyText);
    
    // Verify webhook signature
    const signature = request.headers.get('x-signature');
    if (!verifyLemonSqueezySignature(bodyText, signature)) {
      throw new ValidationError('Invalid webhook signature');
    }

    const { meta, data } = body;
    const eventType = meta?.event_name;
    
    if (!eventType || !data) {
      throw new ValidationError('Invalid webhook payload');
    }

    logger.info('Processing webhook event', { ...context, eventType });

    switch (eventType) {
      case 'subscription_created':
      case 'subscription_updated':
        await handleSubscriptionActivated(data);
        break;
        
      case 'subscription_cancelled':
      case 'subscription_expired':
      case 'subscription_past_due':
        await handleSubscriptionDeactivated(data);
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
    current_period_start: string;
    current_period_end: string;
    user_name?: string;
    custom_data?: Record<string, unknown>;
  };
}) {
  const {
    id: lemonSqueezyId,
    attributes: {
      status,
      product_id,
      variant_id,
      current_period_start,
      current_period_end,
      custom_data
    }
  } = subscriptionData;

  // You might store user ID in custom_data during checkout
  const userId = custom_data?.user_id as string;
  
  if (!userId || typeof userId !== 'string') {
    throw new ValidationError('User ID not found in subscription data');
  }

  // Only activate for active subscriptions
  if (status === 'active') {
    await upgradeUserToPro(userId, {
      lemonSqueezyId: lemonSqueezyId.toString(),
      planId: product_id.toString(),
      variantId: variant_id.toString(),
      currentPeriodStart: new Date(current_period_start),
      currentPeriodEnd: new Date(current_period_end),
    });
    
    logger.info('User upgraded to Pro', { userId, lemonSqueezyId });
  }
}

async function handleSubscriptionDeactivated(subscriptionData: {
  attributes: {
    custom_data?: Record<string, unknown>;
  };
}) {
  const {
    attributes: {
      custom_data
    }
  } = subscriptionData;

  const userId = custom_data?.user_id as string;
  
  if (!userId || typeof userId !== 'string') {
    throw new ValidationError('User ID not found in subscription data');
  }

  await downgradeUserToFree(userId);
  
  logger.info('User downgraded to Free', { userId });
}