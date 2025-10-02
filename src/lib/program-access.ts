import { prisma } from './prisma';

/**
 * Check if a user has Pro subscription access
 * Returns true if user has an active Pro subscription
 */
export async function hasProAccess(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        plan: true,
        subscription: {
          select: {
            status: true,
            currentPeriodEnd: true,
          },
        },
      },
    });

    if (!user) return false;

    // Check if user has PRO plan
    if (user.plan !== 'PRO') return false;

    // Check if subscription is active and not expired
    if (!user.subscription) return false;

    const isActive = ['active', 'on_trial'].includes(user.subscription.status);
    const notExpired =
      !user.subscription.currentPeriodEnd ||
      new Date(user.subscription.currentPeriodEnd) > new Date();

    return isActive && notExpired;
  } catch (error) {
    console.error('Error checking Pro access:', error);
    return false;
  }
}

/**
 * Check if a user can access a specific training program
 * Access is granted if:
 * 1. User is an admin, OR
 * 2. User has Pro subscription (access to all programs), OR
 * 3. User has purchased the specific program, OR
 * 4. Program is free (price = 0)
 */
export async function canAccessProgram(
  userId: string,
  programId: string
): Promise<{
  hasAccess: boolean;
  reason: 'admin' | 'pro_subscription' | 'purchased' | 'free' | 'no_access';
  isPro: boolean;
  hasPurchased: boolean;
  isAdmin: boolean;
}> {
  try {
    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        plan: true,
      },
    });

    if (!user) {
      return {
        hasAccess: false,
        reason: 'no_access',
        isPro: false,
        hasPurchased: false,
        isAdmin: false,
      };
    }

    const isAdmin = user.role === 'admin';

    // Admins have access to everything
    if (isAdmin) {
      return {
        hasAccess: true,
        reason: 'admin',
        isPro: user.plan === 'PRO',
        hasPurchased: false,
        isAdmin: true,
      };
    }

    // Check Pro subscription
    const isPro = await hasProAccess(userId);

    // Pro users have access to all programs
    if (isPro) {
      return {
        hasAccess: true,
        reason: 'pro_subscription',
        isPro: true,
        hasPurchased: false,
        isAdmin: false,
      };
    }

    // Get program details
    const program = await prisma.trainingProgram.findUnique({
      where: { id: programId },
      select: { price: true, isActive: true },
    });

    if (!program || !program.isActive) {
      return {
        hasAccess: false,
        reason: 'no_access',
        isPro: false,
        hasPurchased: false,
        isAdmin: false,
      };
    }

    // Check if program is free
    if (program.price === 0) {
      return {
        hasAccess: true,
        reason: 'free',
        isPro: false,
        hasPurchased: false,
        isAdmin: false,
      };
    }

    // Check if user has purchased this specific program
    const purchase = await prisma.userPurchase.findUnique({
      where: {
        userId_trainingProgramId: {
          userId,
          trainingProgramId: programId,
        },
      },
    });

    const hasPurchased = !!purchase;

    return {
      hasAccess: hasPurchased,
      reason: hasPurchased ? 'purchased' : 'no_access',
      isPro: false,
      hasPurchased,
      isAdmin: false,
    };
  } catch (error) {
    console.error('Error checking program access:', error);
    return {
      hasAccess: false,
      reason: 'no_access',
      isPro: false,
      hasPurchased: false,
      isAdmin: false,
    };
  }
}

/**
 * Get a list of all programs the user has access to
 * Includes purchased programs and all programs if user has Pro subscription
 */
export async function getUserAccessiblePrograms(userId: string): Promise<{
  allAccess: boolean; // True if user has Pro (access to all programs)
  accessibleProgramIds: string[];
  isPro: boolean;
  isAdmin: boolean;
}> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        plan: true,
      },
    });

    if (!user) {
      return {
        allAccess: false,
        accessibleProgramIds: [],
        isPro: false,
        isAdmin: false,
      };
    }

    const isAdmin = user.role === 'admin';

    // Admins have access to everything
    if (isAdmin) {
      const allPrograms = await prisma.trainingProgram.findMany({
        where: { isActive: true },
        select: { id: true },
      });

      return {
        allAccess: true,
        accessibleProgramIds: allPrograms.map((p) => p.id),
        isPro: user.plan === 'PRO',
        isAdmin: true,
      };
    }

    // Check Pro subscription
    const isPro = await hasProAccess(userId);

    // Pro users have access to all active programs
    if (isPro) {
      const allPrograms = await prisma.trainingProgram.findMany({
        where: { isActive: true },
        select: { id: true },
      });

      return {
        allAccess: true,
        accessibleProgramIds: allPrograms.map((p) => p.id),
        isPro: true,
        isAdmin: false,
      };
    }

    // Get purchased programs + free programs
    const [purchases, freePrograms] = await Promise.all([
      prisma.userPurchase.findMany({
        where: { userId },
        select: { trainingProgramId: true },
      }),
      prisma.trainingProgram.findMany({
        where: { price: 0, isActive: true },
        select: { id: true },
      }),
    ]);

    const purchasedIds = purchases.map((p) => p.trainingProgramId);
    const freeIds = freePrograms.map((p) => p.id);
    const accessibleProgramIds = [...new Set([...purchasedIds, ...freeIds])];

    return {
      allAccess: false,
      accessibleProgramIds,
      isPro: false,
      isAdmin: false,
    };
  } catch (error) {
    console.error('Error getting accessible programs:', error);
    return {
      allAccess: false,
      accessibleProgramIds: [],
      isPro: false,
      isAdmin: false,
    };
  }
}

/**
 * Get upgrade information for a user
 * Shows what they would gain by upgrading to Pro
 */
export async function getUpgradeInfo(userId: string): Promise<{
  shouldShowUpgrade: boolean;
  currentProgramCount: number;
  totalProgramCount: number;
  potentialSavings: number; // How much they would save vs buying all programs
  upgradeMessage: string;
}> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    // Don't show upgrade to Pro users
    if (user?.plan === 'PRO') {
      return {
        shouldShowUpgrade: false,
        currentProgramCount: 0,
        totalProgramCount: 0,
        potentialSavings: 0,
        upgradeMessage: '',
      };
    }

    // Get user's purchased programs
    const purchases = await prisma.userPurchase.count({
      where: { userId },
    });

    // Get total program count and value
    const [totalPrograms, totalValue] = await Promise.all([
      prisma.trainingProgram.count({
        where: { isActive: true, price: { gt: 0 } },
      }),
      prisma.trainingProgram.aggregate({
        where: { isActive: true, price: { gt: 0 } },
        _sum: { price: true },
      }),
    ]);

    const totalProgramValue = (totalValue._sum.price || 0) / 100; // Convert cents to dollars

    // Pro subscription annual cost (assuming $149/year from strategy)
    const proAnnualCost = 149;

    // Calculate potential savings
    const potentialSavings = Math.max(0, totalProgramValue - proAnnualCost);

    // Show upgrade if they have 2+ programs or total value > $100
    const shouldShowUpgrade =
      purchases >= 2 || totalProgramValue >= 100;

    let upgradeMessage = '';
    if (shouldShowUpgrade) {
      if (purchases >= 2) {
        upgradeMessage = `You've purchased ${purchases} programs. Upgrade to Pro for unlimited access to all ${totalPrograms} programs!`;
      } else {
        upgradeMessage = `Get unlimited access to all ${totalPrograms} programs and save $${potentialSavings.toFixed(0)} with Pro!`;
      }
    }

    return {
      shouldShowUpgrade,
      currentProgramCount: purchases,
      totalProgramCount: totalPrograms,
      potentialSavings,
      upgradeMessage,
    };
  } catch (error) {
    console.error('Error getting upgrade info:', error);
    return {
      shouldShowUpgrade: false,
      currentProgramCount: 0,
      totalProgramCount: 0,
      potentialSavings: 0,
      upgradeMessage: '',
    };
  }
}
