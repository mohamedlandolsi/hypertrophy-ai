import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateSubscriptionSecurity } from '@/lib/subscription';
import { prisma } from '@/lib/prisma';
import { 
  ApiErrorHandler, 
  AuthenticationError,
  AuthorizationError,
  logger 
} from '@/lib/error-handler';

export async function POST(request: NextRequest) {
  const context = ApiErrorHandler.createContext(request);
  
  try {
    logger.info('Subscription validation API called', context);
    
    // Get the authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new AuthenticationError('User must be authenticated');
    }
    
    // Check if user is admin
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    });
    
    if (!userData || userData.role !== 'admin') {
      throw new AuthorizationError('Admin access required');
    }
    
    logger.info('Running subscription security validation', { ...context, adminId: user.id });
    
    // Run the subscription security validation
    const result = await validateSubscriptionSecurity();
    
    logger.info('Subscription security validation completed', {
      ...context,
      adminId: user.id,
      result
    });
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: result
    });
    
  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}

export async function GET(request: NextRequest) {
  const context = ApiErrorHandler.createContext(request);
  
  try {
    // Get the authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new AuthenticationError('User must be authenticated');
    }
    
    // Check if user is admin
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    });
    
    if (!userData || userData.role !== 'admin') {
      throw new AuthorizationError('Admin access required');
    }
    
    // Get subscription statistics
    const stats = await prisma.$transaction([
      // Total users by plan
      prisma.user.groupBy({
        by: ['plan'],
        _count: { plan: true },
        orderBy: { plan: 'asc' }
      }),
      
      // Total subscriptions by status
      prisma.subscription.groupBy({
        by: ['status'],
        _count: { status: true },
        orderBy: { status: 'asc' }
      }),
      
      // Expired active subscriptions
      prisma.subscription.count({
        where: {
          status: 'active',
          currentPeriodEnd: {
            lt: new Date()
          }
        }
      }),
      
      // PRO users without subscriptions
      prisma.user.count({
        where: {
          plan: 'PRO',
          subscription: null
        }
      }),
      
      // Recent subscriptions (last 30 days)
      prisma.subscription.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);
    
    const [usersByPlan, subscriptionsByStatus, expiredActiveCount, proUsersWithoutSubs, recentSubscriptions] = stats;
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      statistics: {
        usersByPlan,
        subscriptionsByStatus,
        expiredActiveSubscriptions: expiredActiveCount,
        proUsersWithoutSubscriptions: proUsersWithoutSubs,
        recentSubscriptions
      }
    });
    
  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}
