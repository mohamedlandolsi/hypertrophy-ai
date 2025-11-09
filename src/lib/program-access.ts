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
 * 2. User has Pro subscription (access to all programs)
 * 
 * Note: Individual program purchases deprecated Nov 2025 (subscription-only model)
 */
export async function canAccessProgram(
  userId: string,
  programId: string
): Promise<{
  hasAccess: boolean;
  reason: 'admin' | 'pro_subscription' | 'no_access';
  isPro: boolean;
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
        isAdmin: false,
      };
    }

    // Verify program exists and is active
    const program = await prisma.trainingProgram.findUnique({
      where: { id: programId },
      select: { isActive: true },
    });

    if (!program || !program.isActive) {
      return {
        hasAccess: false,
        reason: 'no_access',
        isPro: false,
        isAdmin: false,
      };
    }

    // No access without Pro subscription
    return {
      hasAccess: false,
      reason: 'no_access',
      isPro: false,
      isAdmin: false,
    };
  } catch (error) {
    console.error('Error checking program access:', error);
    return {
      hasAccess: false,
      reason: 'no_access',
      isPro: false,
      isAdmin: false,
    };
  }
}

/**
 * Get a list of all programs the user has access to
 * Returns all active programs if user has Pro subscription or is admin
 * 
 * Note: Individual program purchases deprecated Nov 2025 (subscription-only model)
 */
export async function getUserAccessiblePrograms(userId: string): Promise<{
  allAccess: boolean; // True if user has Pro or is admin (access to all programs)
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

    // Free users have no program access (subscription required)
    return {
      allAccess: false,
      accessibleProgramIds: [],
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
 * 
 * Note: Simplified for subscription-only model (Nov 2025)
 */
export async function getUpgradeInfo(userId: string): Promise<{
  shouldShowUpgrade: boolean;
  totalProgramCount: number;
  upgradeMessage: string;
}> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, role: true },
    });

    // Don't show upgrade to Pro users or admins
    if (user?.plan === 'PRO' || user?.role === 'admin') {
      return {
        shouldShowUpgrade: false,
        totalProgramCount: 0,
        upgradeMessage: '',
      };
    }

    // Get total active program count
    const totalPrograms = await prisma.trainingProgram.count({
      where: { isActive: true },
    });

    const shouldShowUpgrade = true; // Always show to free users

    const upgradeMessage = `Upgrade to Pro for unlimited access to all ${totalPrograms} programs, unlimited AI coaching, and exclusive features!`;

    return {
      shouldShowUpgrade,
      totalProgramCount: totalPrograms,
      upgradeMessage,
    };
  } catch (error) {
    console.error('Error getting upgrade info:', error);
    return {
      shouldShowUpgrade: false,
      totalProgramCount: 0,
      upgradeMessage: '',
    };
  }
}
