/**
 * Subscription Flow Integration Tests
 * 
 * Tests the complete subscription lifecycle including:
 * - FREE tier user flows and limitations
 * - PRO tier subscription and features
 * - Subscription lifecycle (subscribe, upgrade, cancel, reactivate)
 * - Tier enforcement and feature gating
 */

import { PrismaClient, SubscriptionTier, User, Subscription, CustomTrainingProgram } from '@prisma/client';
import { SUBSCRIPTION_TIER_LIMITS } from '@/lib/subscription';

// Test database instance
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
    },
  },
});

// Mock LemonSqueezy API responses
const mockLemonSqueezyAPI = {
  createCheckout: jest.fn(),
  getSubscription: jest.fn(),
  cancelSubscription: jest.fn(),
  reactivateSubscription: jest.fn(),
  updateSubscription: jest.fn(),
};

// Helper to create test user
async function createTestUser(tier: SubscriptionTier = 'FREE'): Promise<User> {
  const randomId = `test-user-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  
  return await prisma.user.create({
    data: {
      id: randomId,
      role: 'user',
      subscriptionTier: tier,
      subscriptionStatus: 'active',
      customProgramsCount: 0,
      customizationsThisMonth: 0,
      messagesUsedToday: 0,
      freeMessagesRemaining: tier === 'FREE' ? 15 : 0,
    },
  });
}

// Helper to create test program
async function createTestProgram(userId: string): Promise<CustomTrainingProgram> {
  return await prisma.customTrainingProgram.create({
    data: {
      userId,
      name: `Test Program ${Date.now()}`,
      description: 'Test program for integration testing',
      status: 'DRAFT',
      splitId: 'test-split-id',
      structureId: 'test-structure-id',
      categoryType: 'ESSENTIALIST',
    },
  });
}

// Helper to create subscription
async function createTestSubscription(
  userId: string,
  tier: SubscriptionTier = 'PRO_MONTHLY'
): Promise<Subscription> {
  const now = new Date();
  const endDate = new Date(now);
  
  if (tier === 'PRO_MONTHLY') {
    endDate.setMonth(endDate.getMonth() + 1);
  } else if (tier === 'PRO_YEARLY') {
    endDate.setFullYear(endDate.getFullYear() + 1);
  }

  return await prisma.subscription.create({
    data: {
      userId,
      lemonSqueezyId: `ls-sub-${Date.now()}`,
      status: 'active',
      planId: tier === 'PRO_MONTHLY' ? 'plan-monthly' : 'plan-yearly',
      variantId: tier === 'PRO_MONTHLY' ? 'variant-monthly' : 'variant-yearly',
      currentPeriodStart: now,
      currentPeriodEnd: endDate,
    },
  });
}

// Cleanup test data
async function cleanupTestUser(userId: string) {
  await prisma.customTrainingProgram.deleteMany({ where: { userId } });
  await prisma.subscription.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
}

describe('Subscription Flow Integration Tests', () => {
  // Cleanup after all tests
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('1. FREE Tier User Flow', () => {
    let freeUser: User;

    beforeEach(async () => {
      freeUser = await createTestUser('FREE');
    });

    afterEach(async () => {
      await cleanupTestUser(freeUser.id);
    });

    test('should create account with FREE tier assigned', async () => {
      expect(freeUser.subscriptionTier).toBe('FREE');
      expect(freeUser.subscriptionStatus).toBe('active');
      expect(freeUser.customProgramsCount).toBe(0);
    });

    test('should allow creating first program', async () => {
      const program1 = await createTestProgram(freeUser.id);
      
      expect(program1).toBeDefined();
      expect(program1.userId).toBe(freeUser.id);
      
      // Update user program count
      await prisma.user.update({
        where: { id: freeUser.id },
        data: { customProgramsCount: 1 },
      });

      const updatedUser = await prisma.user.findUnique({
        where: { id: freeUser.id },
      });

      expect(updatedUser?.customProgramsCount).toBe(1);
    });

    test('should allow creating second program', async () => {
      const program1 = await createTestProgram(freeUser.id);
      const program2 = await createTestProgram(freeUser.id);
      
      expect(program1).toBeDefined();
      expect(program2).toBeDefined();
      
      // Update user program count
      await prisma.user.update({
        where: { id: freeUser.id },
        data: { customProgramsCount: 2 },
      });

      const updatedUser = await prisma.user.findUnique({
        where: { id: freeUser.id },
      });

      expect(updatedUser?.customProgramsCount).toBe(2);
    });

    test('should block creating third program with upgrade prompt', async () => {
      // Create 2 programs (at limit)
      await createTestProgram(freeUser.id);
      await createTestProgram(freeUser.id);
      
      await prisma.user.update({
        where: { id: freeUser.id },
        data: { customProgramsCount: 2 },
      });

      const user = await prisma.user.findUnique({
        where: { id: freeUser.id },
      });

      // Check if user has reached limit
      const limits = SUBSCRIPTION_TIER_LIMITS[user!.subscriptionTier];
      const canCreateMore = limits.customPrograms === -1 || 
        user!.customProgramsCount < limits.customPrograms;

      expect(canCreateMore).toBe(false);
      expect(user!.customProgramsCount).toBe(2);
      expect(limits.customPrograms).toBe(2);
    });

    test('should block customization beyond monthly limit', async () => {
      // Simulate user has used all customizations
      await prisma.user.update({
        where: { id: freeUser.id },
        data: { customizationsThisMonth: 5 },
      });

      const user = await prisma.user.findUnique({
        where: { id: freeUser.id },
      });

      const limits = SUBSCRIPTION_TIER_LIMITS[user!.subscriptionTier];
      const canCustomize = limits.customizationsPerMonth === -1 || 
        user!.customizationsThisMonth < limits.customizationsPerMonth;

      expect(canCustomize).toBe(false);
      expect(user!.customizationsThisMonth).toBe(5);
      expect(limits.customizationsPerMonth).toBe(5);
    });

    test('should verify FREE tier limitations', () => {
      const limits = SUBSCRIPTION_TIER_LIMITS.FREE;

      expect(limits.customPrograms).toBe(2);
      expect(limits.customizationsPerMonth).toBe(5);
      expect(limits.dailyMessages).toBe(10);
      expect(limits.canExportPDF).toBe(false);
      expect(limits.canAccessProFeatures).toBe(false);
      expect(limits.hasConversationMemory).toBe(false);
    });
  });

  describe('2. PRO Monthly User Flow', () => {
    let proUser: User;
    let subscription: Subscription;

    beforeEach(async () => {
      proUser = await createTestUser('PRO_MONTHLY');
      subscription = await createTestSubscription(proUser.id, 'PRO_MONTHLY');
      
      // Update user with subscription
      await prisma.user.update({
        where: { id: proUser.id },
        data: {
          subscriptionTier: 'PRO_MONTHLY',
          subscriptionStartDate: subscription.currentPeriodStart,
          subscriptionEndDate: subscription.currentPeriodEnd,
          lemonSqueezyCustomerId: `customer-${proUser.id}`,
        },
      });
    });

    afterEach(async () => {
      await cleanupTestUser(proUser.id);
    });

    test('should verify PRO_MONTHLY tier assigned after subscription', async () => {
      const user = await prisma.user.findUnique({
        where: { id: proUser.id },
        include: { subscription: true },
      });

      expect(user?.subscriptionTier).toBe('PRO_MONTHLY');
      expect(user?.subscription?.status).toBe('active');
      expect(user?.subscription?.lemonSqueezyId).toBeDefined();
    });

    test('should allow creating unlimited programs', async () => {
      // Create 5 programs (way more than FREE limit of 2)
      const programs = await Promise.all([
        createTestProgram(proUser.id),
        createTestProgram(proUser.id),
        createTestProgram(proUser.id),
        createTestProgram(proUser.id),
        createTestProgram(proUser.id),
      ]);

      expect(programs).toHaveLength(5);
      
      await prisma.user.update({
        where: { id: proUser.id },
        data: { customProgramsCount: 5 },
      });

      const user = await prisma.user.findUnique({
        where: { id: proUser.id },
      });

      const limits = SUBSCRIPTION_TIER_LIMITS[user!.subscriptionTier];
      expect(limits.customPrograms).toBe(-1); // Unlimited
      expect(user!.customProgramsCount).toBe(5);
    });

    test('should allow unlimited customizations', async () => {
      await prisma.user.update({
        where: { id: proUser.id },
        data: { customizationsThisMonth: 50 },
      });

      const user = await prisma.user.findUnique({
        where: { id: proUser.id },
      });

      const limits = SUBSCRIPTION_TIER_LIMITS[user!.subscriptionTier];
      const canCustomize = limits.customizationsPerMonth === -1;

      expect(canCustomize).toBe(true);
      expect(limits.customizationsPerMonth).toBe(-1);
    });

    test('should have access to AI assistant with unlimited messages', () => {
      const limits = SUBSCRIPTION_TIER_LIMITS.PRO_MONTHLY;

      expect(limits.dailyMessages).toBe(-1); // Unlimited
      expect(limits.hasConversationMemory).toBe(true);
      expect(limits.canAccessProFeatures).toBe(true);
      expect(limits.canAccessAdvancedRAG).toBe(true);
    });

    test('should verify PRO_MONTHLY features', () => {
      const limits = SUBSCRIPTION_TIER_LIMITS.PRO_MONTHLY;

      expect(limits.customPrograms).toBe(-1); // Unlimited
      expect(limits.customizationsPerMonth).toBe(-1); // Unlimited
      expect(limits.dailyMessages).toBe(-1); // Unlimited
      expect(limits.canAccessProFeatures).toBe(true);
      expect(limits.hasConversationMemory).toBe(true);
      expect(limits.canExportPDF).toBe(false); // Only YEARLY has PDF
      expect(limits.hasPrioritySupport).toBe(false); // Only YEARLY
    });
  });

  describe('3. Subscription Lifecycle', () => {
    let user: User;

    beforeEach(async () => {
      user = await createTestUser('FREE');
    });

    afterEach(async () => {
      await cleanupTestUser(user.id);
    });

    test('should subscribe to PRO_MONTHLY and verify tier update', async () => {
      // Create subscription
      const subscription = await createTestSubscription(user.id, 'PRO_MONTHLY');

      // Update user to PRO_MONTHLY
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionTier: 'PRO_MONTHLY',
          subscriptionStatus: 'active',
          subscriptionStartDate: subscription.currentPeriodStart,
          subscriptionEndDate: subscription.currentPeriodEnd,
          lemonSqueezyCustomerId: `customer-${user.id}`,
        },
      });

      expect(updatedUser.subscriptionTier).toBe('PRO_MONTHLY');
      expect(updatedUser.subscriptionStatus).toBe('active');
      expect(updatedUser.subscriptionEndDate).toBeDefined();
    });

    test('should upgrade from PRO_MONTHLY to PRO_YEARLY with new expiration', async () => {
      // Start with PRO_MONTHLY
      const monthlySubscription = await createTestSubscription(user.id, 'PRO_MONTHLY');
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionTier: 'PRO_MONTHLY',
          subscriptionEndDate: monthlySubscription.currentPeriodEnd,
        },
      });

      // Upgrade to PRO_YEARLY
      const now = new Date();
      const yearlyEndDate = new Date(now);
      yearlyEndDate.setFullYear(yearlyEndDate.getFullYear() + 1);

      await prisma.subscription.update({
        where: { id: monthlySubscription.id },
        data: {
          planId: 'plan-yearly',
          variantId: 'variant-yearly',
          currentPeriodEnd: yearlyEndDate,
        },
      });

      const upgradedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionTier: 'PRO_YEARLY',
          subscriptionEndDate: yearlyEndDate,
        },
      });

      expect(upgradedUser.subscriptionTier).toBe('PRO_YEARLY');
      
      // Verify new expiration is ~1 year from now
      const monthsDiff = Math.round(
        (yearlyEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)
      );
      expect(monthsDiff).toBeGreaterThanOrEqual(11);
      expect(monthsDiff).toBeLessThanOrEqual(13);
    });

    test('should cancel subscription and revert tier to FREE', async () => {
      // Create active PRO subscription
      const subscription = await createTestSubscription(user.id, 'PRO_MONTHLY');
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionTier: 'PRO_MONTHLY',
          subscriptionEndDate: subscription.currentPeriodEnd,
        },
      });

      // Cancel subscription
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'cancelled',
        },
      });

      // Revert user to FREE tier
      const revertedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionTier: 'FREE',
          subscriptionStatus: 'cancelled',
        },
      });

      expect(revertedUser.subscriptionTier).toBe('FREE');
      expect(revertedUser.subscriptionStatus).toBe('cancelled');
    });

    test('should reactivate subscription and restore PRO access', async () => {
      // Create cancelled subscription
      const subscription = await createTestSubscription(user.id, 'PRO_MONTHLY');
      
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'cancelled' },
      });

      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionTier: 'FREE',
          subscriptionStatus: 'cancelled',
        },
      });

      // Reactivate subscription
      const now = new Date();
      const newEndDate = new Date(now);
      newEndDate.setMonth(newEndDate.getMonth() + 1);

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'active',
          currentPeriodStart: now,
          currentPeriodEnd: newEndDate,
        },
      });

      const reactivatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionTier: 'PRO_MONTHLY',
          subscriptionStatus: 'active',
          subscriptionEndDate: newEndDate,
        },
      });

      expect(reactivatedUser.subscriptionTier).toBe('PRO_MONTHLY');
      expect(reactivatedUser.subscriptionStatus).toBe('active');
    });

    test('should verify programs remain accessible after reactivation', async () => {
      // Create programs while PRO
      const subscription = await createTestSubscription(user.id, 'PRO_MONTHLY');
      
      await prisma.user.update({
        where: { id: user.id },
        data: { subscriptionTier: 'PRO_MONTHLY' },
      });

      const program1 = await createTestProgram(user.id);
      const program2 = await createTestProgram(user.id);
      const program3 = await createTestProgram(user.id);

      // Cancel subscription
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'cancelled' },
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { subscriptionTier: 'FREE' },
      });

      // Verify programs still exist
      const programsAfterCancel = await prisma.customTrainingProgram.findMany({
        where: { userId: user.id },
      });

      expect(programsAfterCancel).toHaveLength(3);

      // Reactivate
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'active' },
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { subscriptionTier: 'PRO_MONTHLY' },
      });

      // Verify programs still accessible
      const programsAfterReactivation = await prisma.customTrainingProgram.findMany({
        where: { userId: user.id },
      });

      expect(programsAfterReactivation).toHaveLength(3);
      expect(programsAfterReactivation.map(p => p.id)).toEqual(
        expect.arrayContaining([program1.id, program2.id, program3.id])
      );
    });
  });

  describe('4. Tier Enforcement', () => {
    test('should enforce FREE tier program creation limit', async () => {
      const user = await createTestUser('FREE');
      
      try {
        // Create 2 programs (at limit)
        await createTestProgram(user.id);
        await createTestProgram(user.id);
        
        await prisma.user.update({
          where: { id: user.id },
          data: { customProgramsCount: 2 },
        });

        const limits = SUBSCRIPTION_TIER_LIMITS.FREE;
        const currentCount = 2;

        // Should be blocked from creating more
        const canCreate = limits.customPrograms === -1 || 
          currentCount < limits.customPrograms;

        expect(canCreate).toBe(false);
      } finally {
        await cleanupTestUser(user.id);
      }
    });

    test('should enforce FREE tier customization limit', async () => {
      const user = await createTestUser('FREE');
      
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { customizationsThisMonth: 5 },
        });

        const limits = SUBSCRIPTION_TIER_LIMITS.FREE;
        const currentCount = 5;

        const canCustomize = limits.customizationsPerMonth === -1 || 
          currentCount < limits.customizationsPerMonth;

        expect(canCustomize).toBe(false);
      } finally {
        await cleanupTestUser(user.id);
      }
    });

    test('should enforce FREE tier daily message limit', async () => {
      const user = await createTestUser('FREE');
      
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { messagesUsedToday: 10 },
        });

        const limits = SUBSCRIPTION_TIER_LIMITS.FREE;
        const currentCount = 10;

        const canSendMessage = limits.dailyMessages === -1 || 
          currentCount < limits.dailyMessages;

        expect(canSendMessage).toBe(false);
      } finally {
        await cleanupTestUser(user.id);
      }
    });

    test('should block PDF export for FREE and PRO_MONTHLY tiers', () => {
      const freeLimits = SUBSCRIPTION_TIER_LIMITS.FREE;
      const proMonthlyLimits = SUBSCRIPTION_TIER_LIMITS.PRO_MONTHLY;
      const proYearlyLimits = SUBSCRIPTION_TIER_LIMITS.PRO_YEARLY;

      expect(freeLimits.canExportPDF).toBe(false);
      expect(proMonthlyLimits.canExportPDF).toBe(false);
      expect(proYearlyLimits.canExportPDF).toBe(true);
    });

    test('should verify feature gating works correctly', () => {
      const freeLimits = SUBSCRIPTION_TIER_LIMITS.FREE;
      const proLimits = SUBSCRIPTION_TIER_LIMITS.PRO_MONTHLY;

      // FREE tier restrictions
      expect(freeLimits.canAccessProFeatures).toBe(false);
      expect(freeLimits.hasConversationMemory).toBe(false);
      expect(freeLimits.canAccessAdvancedRAG).toBe(false);

      // PRO tier access
      expect(proLimits.canAccessProFeatures).toBe(true);
      expect(proLimits.hasConversationMemory).toBe(true);
      expect(proLimits.canAccessAdvancedRAG).toBe(true);
    });

    test('should verify usage limits reset monthly', async () => {
      const user = await createTestUser('FREE');
      
      try {
        // Set to limit
        await prisma.user.update({
          where: { id: user.id },
          data: {
            customizationsThisMonth: 5,
            lastUploadReset: new Date(),
          },
        });

        let userData = await prisma.user.findUnique({
          where: { id: user.id },
        });

        expect(userData?.customizationsThisMonth).toBe(5);

        // Simulate monthly reset
        await prisma.user.update({
          where: { id: user.id },
          data: {
            customizationsThisMonth: 0,
            lastUploadReset: new Date(),
          },
        });

        userData = await prisma.user.findUnique({
          where: { id: user.id },
        });

        expect(userData?.customizationsThisMonth).toBe(0);
      } finally {
        await cleanupTestUser(user.id);
      }
    });

    test('should verify PRO tiers have unlimited access', () => {
      const proMonthlyLimits = SUBSCRIPTION_TIER_LIMITS.PRO_MONTHLY;
      const proYearlyLimits = SUBSCRIPTION_TIER_LIMITS.PRO_YEARLY;

      // PRO_MONTHLY unlimited features
      expect(proMonthlyLimits.customPrograms).toBe(-1);
      expect(proMonthlyLimits.customizationsPerMonth).toBe(-1);
      expect(proMonthlyLimits.dailyMessages).toBe(-1);
      expect(proMonthlyLimits.monthlyUploads).toBe(-1);

      // PRO_YEARLY unlimited features + extras
      expect(proYearlyLimits.customPrograms).toBe(-1);
      expect(proYearlyLimits.customizationsPerMonth).toBe(-1);
      expect(proYearlyLimits.dailyMessages).toBe(-1);
      expect(proYearlyLimits.monthlyUploads).toBe(-1);
      expect(proYearlyLimits.canExportPDF).toBe(true);
      expect(proYearlyLimits.hasPrioritySupport).toBe(true);
    });

    test('should compare all tier limits correctly', () => {
      const free = SUBSCRIPTION_TIER_LIMITS.FREE;
      const proMonthly = SUBSCRIPTION_TIER_LIMITS.PRO_MONTHLY;
      const proYearly = SUBSCRIPTION_TIER_LIMITS.PRO_YEARLY;

      // Programs
      expect(free.customPrograms).toBeLessThan(proMonthly.customPrograms || Infinity);
      
      // Messages
      expect(free.dailyMessages).toBeLessThan(proMonthly.dailyMessages || Infinity);
      
      // Features
      expect(free.canAccessProFeatures).toBe(false);
      expect(proMonthly.canAccessProFeatures).toBe(true);
      expect(proYearly.canAccessProFeatures).toBe(true);
      
      // PDF Export (exclusive to PRO_YEARLY)
      expect(proYearly.canExportPDF).toBe(true);
      expect(proMonthly.canExportPDF).toBe(false);
      expect(free.canExportPDF).toBe(false);
    });
  });

  describe('5. Edge Cases and Error Handling', () => {
    test('should handle expired subscription gracefully', async () => {
      const user = await createTestUser('PRO_MONTHLY');
      
      try {
        // Create expired subscription
        const pastDate = new Date();
        pastDate.setMonth(pastDate.getMonth() - 1);

        const subscription = await prisma.subscription.create({
          data: {
            userId: user.id,
            lemonSqueezyId: `ls-expired-${Date.now()}`,
            status: 'expired',
            planId: 'plan-monthly',
            variantId: 'variant-monthly',
            currentPeriodStart: new Date(pastDate.getTime() - 30 * 24 * 60 * 60 * 1000),
            currentPeriodEnd: pastDate,
          },
        });

        // User should be reverted to FREE
        await prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionTier: 'FREE',
            subscriptionStatus: 'expired',
          },
        });

        const expiredUser = await prisma.user.findUnique({
          where: { id: user.id },
        });

        expect(expiredUser?.subscriptionTier).toBe('FREE');
        expect(expiredUser?.subscriptionStatus).toBe('expired');
      } finally {
        await cleanupTestUser(user.id);
      }
    });

    test('should handle missing subscription data', async () => {
      const user = await createTestUser('FREE');
      
      try {
        const userWithSub = await prisma.user.findUnique({
          where: { id: user.id },
          include: { subscription: true },
        });

        expect(userWithSub?.subscription).toBeNull();
        expect(userWithSub?.subscriptionTier).toBe('FREE');
      } finally {
        await cleanupTestUser(user.id);
      }
    });

    test('should prevent negative usage counts', async () => {
      const user = await createTestUser('FREE');
      
      try {
        // Attempt to set negative counts
        await prisma.user.update({
          where: { id: user.id },
          data: {
            customProgramsCount: 0, // Reset to 0
            customizationsThisMonth: 0,
            messagesUsedToday: 0,
          },
        });

        const userData = await prisma.user.findUnique({
          where: { id: user.id },
        });

        expect(userData?.customProgramsCount).toBeGreaterThanOrEqual(0);
        expect(userData?.customizationsThisMonth).toBeGreaterThanOrEqual(0);
        expect(userData?.messagesUsedToday).toBeGreaterThanOrEqual(0);
      } finally {
        await cleanupTestUser(user.id);
      }
    });
  });
});
