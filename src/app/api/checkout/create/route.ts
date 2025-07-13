import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createProCheckoutUrl } from '@/lib/lemonsqueezy';
import { 
  ApiErrorHandler, 
  ValidationError, 
  AuthenticationError,
  logger 
} from '@/lib/error-handler';

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
    
    // Parse request body
    const body = await request.json();
    const { interval = 'month' } = body;
    
    console.log('Checkout API received body:', body);
    console.log('Parsed interval:', interval);
    
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
    
    // Create checkout URL
    const checkoutUrl = await createProCheckoutUrl(
      user.id, 
      user.email || undefined, 
      interval as 'month' | 'year'
    );
    
    logger.info('Checkout URL created successfully', { 
      ...context, 
      userId: user.id,
      interval 
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
