import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createProCheckoutUrl } from '@/lib/lemonsqueezy';
import { prisma } from '@/lib/prisma';
import { 
  ApiErrorHandler, 
  ValidationError, 
  AuthenticationError,
  logger 
} from '@/lib/error-handler';

// Rate limiting for checkout creation (simple in-memory store)
const checkoutRateLimit = new Map<string, { count: number; resetTime: number }>();
const CHECKOUT_RATE_LIMIT = 5; // Max 5 checkout requests per hour per user
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

// Check rate limit for checkout creation
function checkCheckoutRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimitData = checkoutRateLimit.get(userId);
  
  if (!userLimitData || now > userLimitData.resetTime) {
    checkoutRateLimit.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (userLimitData.count >= CHECKOUT_RATE_LIMIT) {
    return false;
  }
  
  userLimitData.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const context = ApiErrorHandler.createContext(request);
  
  try {
    logger.info('Checkout URL generation requested', context);
    
    // Get the authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new AuthenticationError('User must be authenticated to create checkout');
    }
    
    // Apply rate limiting
    if (!checkCheckoutRateLimit(user.id)) {
      logger.warn('Checkout rate limit exceeded', { ...context, userId: user.id });
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please wait before creating another checkout.',
          retryAfter: 3600 // 1 hour in seconds
        }, 
        { status: 429 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { interval = 'month' } = body;
    
    // Validate interval
    if (!['month', 'year'].includes(interval)) {
      throw new ValidationError('Interval must be "month" or "year"');
    }
    
    logger.info('Creating checkout URL', { 
      ...context, 
      userId: user.id, 
      userEmail: user.email,
      interval 
    });
    
    // Security: Validate user doesn't already have an active subscription
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
      select: { status: true, currentPeriodEnd: true }
    });
    
    if (existingSubscription && 
        existingSubscription.status === 'active' && 
        existingSubscription.currentPeriodEnd && 
        existingSubscription.currentPeriodEnd > new Date()) {
      return NextResponse.json({
        error: 'User already has an active subscription',
        hasActiveSubscription: true
      }, { status: 400 });
    }
    
    // Create checkout URL
    const checkoutUrl = await createProCheckoutUrl(
      user.id, 
      user.email || undefined, 
      interval as 'month' | 'year'
    );
    
    logger.info('Checkout URL created successfully', { 
      ...context, 
      userId: user.id,
      interval,
      checkoutUrl: 'REDACTED'
    });
    
    return NextResponse.json({
      success: true,
      checkoutUrl,
      interval
    });
    
  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}
