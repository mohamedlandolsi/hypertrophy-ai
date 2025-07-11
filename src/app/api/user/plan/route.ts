import { NextRequest, NextResponse } from 'next/server';
import { getUserPlan } from '@/lib/subscription';
import { 
  ApiErrorHandler, 
  AuthenticationError,
  logger 
} from '@/lib/error-handler';

export async function GET(request: NextRequest) {
  const context = ApiErrorHandler.createContext(request);
  
  try {
    logger.info('User plan API request received', context);
    
    const planInfo = await getUserPlan();
    
    if (!planInfo) {
      throw new AuthenticationError('User not authenticated or not found');
    }

    logger.info('User plan API request completed successfully', { 
      ...context, 
      plan: planInfo.plan,
      messagesUsed: planInfo.messagesUsedToday 
    });

    return NextResponse.json({
      plan: planInfo.plan,
      limits: planInfo.limits,
      messagesUsedToday: planInfo.messagesUsedToday,
      subscription: planInfo.subscription ? {
        status: planInfo.subscription.status,
        currentPeriodEnd: planInfo.subscription.currentPeriodEnd,
      } : null,
    });

  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}
