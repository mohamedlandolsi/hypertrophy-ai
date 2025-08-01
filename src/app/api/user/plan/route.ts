import { NextRequest, NextResponse } from 'next/server';
import { getUserPlan } from '@/lib/subscription';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
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

    // Get additional usage data
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new AuthenticationError('User not authenticated');
    }

    // Get user's upload count and knowledge items count
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        uploadsThisMonth: true,
        lastUploadReset: true,
        _count: {
          select: {
            knowledgeItems: true
          }
        }
      }
    });

    // Reset upload count if it's a new month
    let uploadsThisMonth = userData?.uploadsThisMonth || 0;
    if (userData) {
      const now = new Date();
      const lastReset = new Date(userData.lastUploadReset);
      const isNewMonth = now.getMonth() !== lastReset.getMonth() || 
                         now.getFullYear() !== lastReset.getFullYear();
      
      if (isNewMonth && uploadsThisMonth > 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            uploadsThisMonth: 0,
            lastUploadReset: now,
          },
        });
        uploadsThisMonth = 0;
      }
    }

    logger.info('User plan API request completed successfully', { 
      ...context, 
      plan: planInfo.plan,
      messagesUsed: planInfo.messagesUsedToday,
      uploadsThisMonth,
      knowledgeItemsCount: userData?._count.knowledgeItems || 0
    });

    return NextResponse.json({
      plan: planInfo.plan,
      limits: planInfo.limits,
      messagesUsedToday: planInfo.messagesUsedToday,
      dailyLimit: planInfo.limits.dailyMessages, // Add this for backward compatibility
      uploadsThisMonth,
      knowledgeItemsCount: userData?._count.knowledgeItems || 0,
      subscription: planInfo.subscription ? {
        id: planInfo.subscription.id,
        status: planInfo.subscription.status,
        lemonSqueezyId: planInfo.subscription.lemonSqueezyId,
        planId: planInfo.subscription.planId,
        variantId: planInfo.subscription.variantId,
        currentPeriodStart: planInfo.subscription.currentPeriodStart,
        currentPeriodEnd: planInfo.subscription.currentPeriodEnd,
        createdAt: planInfo.subscription.createdAt,
        updatedAt: planInfo.subscription.updatedAt,
      } : null,
    });

  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}
