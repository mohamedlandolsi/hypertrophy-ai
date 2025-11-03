import { PrismaClient, SubscriptionTier } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // ============================================
  // 1. SEED SUBSCRIPTION TIER FEATURES
  // ============================================
  console.log('\n📦 Seeding subscription tier features...');
  
  const subscriptionFeatures = [
    // FREE TIER
    {
      tier: SubscriptionTier.FREE,
      featureName: 'custom_programs',
      featureLimit: 2,
      resetPeriod: null,
      description: 'Maximum number of custom training programs',
      isActive: true,
    },
    {
      tier: SubscriptionTier.FREE,
      featureName: 'program_customizations',
      featureLimit: 5,
      resetPeriod: 'monthly',
      description: 'Number of program customizations per month',
      isActive: true,
    },
    {
      tier: SubscriptionTier.FREE,
      featureName: 'ai_interactions',
      featureLimit: 10,
      resetPeriod: 'daily',
      description: 'Daily AI assistant interactions',
      isActive: true,
    },
    {
      tier: SubscriptionTier.FREE,
      featureName: 'workout_templates',
      featureLimit: 3,
      resetPeriod: null,
      description: 'Maximum saved workout templates',
      isActive: true,
    },
    {
      tier: SubscriptionTier.FREE,
      featureName: 'exercise_library_access',
      featureLimit: 1,
      resetPeriod: null,
      description: 'Basic exercise library access',
      isActive: true,
    },
    
    // PRO MONTHLY TIER
    {
      tier: SubscriptionTier.PRO_MONTHLY,
      featureName: 'custom_programs',
      featureLimit: -1,
      resetPeriod: null,
      description: 'Unlimited custom training programs',
      isActive: true,
    },
    {
      tier: SubscriptionTier.PRO_MONTHLY,
      featureName: 'program_customizations',
      featureLimit: -1,
      resetPeriod: null,
      description: 'Unlimited program customizations',
      isActive: true,
    },
    {
      tier: SubscriptionTier.PRO_MONTHLY,
      featureName: 'ai_interactions',
      featureLimit: -1,
      resetPeriod: null,
      description: 'Unlimited AI assistant interactions',
      isActive: true,
    },
    {
      tier: SubscriptionTier.PRO_MONTHLY,
      featureName: 'workout_templates',
      featureLimit: -1,
      resetPeriod: null,
      description: 'Unlimited workout templates',
      isActive: true,
    },
    {
      tier: SubscriptionTier.PRO_MONTHLY,
      featureName: 'exercise_library_access',
      featureLimit: -1,
      resetPeriod: null,
      description: 'Full exercise library with advanced filters',
      isActive: true,
    },
    {
      tier: SubscriptionTier.PRO_MONTHLY,
      featureName: 'advanced_analytics',
      featureLimit: 1,
      resetPeriod: null,
      description: 'Advanced progress tracking and analytics',
      isActive: true,
    },
    {
      tier: SubscriptionTier.PRO_MONTHLY,
      featureName: 'priority_support',
      featureLimit: 0,
      resetPeriod: null,
      description: 'Standard support (Pro Yearly gets priority)',
      isActive: true,
    },
    {
      tier: SubscriptionTier.PRO_MONTHLY,
      featureName: 'pdf_export',
      featureLimit: 0,
      resetPeriod: null,
      description: 'PDF export (Pro Yearly exclusive)',
      isActive: true,
    },
    
    // PRO YEARLY TIER
    {
      tier: SubscriptionTier.PRO_YEARLY,
      featureName: 'custom_programs',
      featureLimit: -1,
      resetPeriod: null,
      description: 'Unlimited custom training programs',
      isActive: true,
    },
    {
      tier: SubscriptionTier.PRO_YEARLY,
      featureName: 'program_customizations',
      featureLimit: -1,
      resetPeriod: null,
      description: 'Unlimited program customizations',
      isActive: true,
    },
    {
      tier: SubscriptionTier.PRO_YEARLY,
      featureName: 'ai_interactions',
      featureLimit: -1,
      resetPeriod: null,
      description: 'Unlimited AI assistant interactions',
      isActive: true,
    },
    {
      tier: SubscriptionTier.PRO_YEARLY,
      featureName: 'workout_templates',
      featureLimit: -1,
      resetPeriod: null,
      description: 'Unlimited workout templates',
      isActive: true,
    },
    {
      tier: SubscriptionTier.PRO_YEARLY,
      featureName: 'exercise_library_access',
      featureLimit: -1,
      resetPeriod: null,
      description: 'Full exercise library with advanced filters',
      isActive: true,
    },
    {
      tier: SubscriptionTier.PRO_YEARLY,
      featureName: 'advanced_analytics',
      featureLimit: 1,
      resetPeriod: null,
      description: 'Advanced progress tracking and analytics',
      isActive: true,
    },
    {
      tier: SubscriptionTier.PRO_YEARLY,
      featureName: 'priority_support',
      featureLimit: 1,
      resetPeriod: null,
      description: 'Priority customer support',
      isActive: true,
    },
    {
      tier: SubscriptionTier.PRO_YEARLY,
      featureName: 'pdf_export',
      featureLimit: -1,
      resetPeriod: null,
      description: 'Export programs to PDF',
      isActive: true,
    },
    {
      tier: SubscriptionTier.PRO_YEARLY,
      featureName: 'exclusive_programs',
      featureLimit: 1,
      resetPeriod: null,
      description: 'Access to exclusive training programs',
      isActive: true,
    },
  ];

  for (const feature of subscriptionFeatures) {
    await prisma.subscriptionTierFeature.upsert({
      where: {
        tier_featureName: {
          tier: feature.tier,
          featureName: feature.featureName,
        },
      },
      update: feature,
      create: feature,
    });
  }
  
  console.log(`✅ Created ${subscriptionFeatures.length} subscription tier features`);

  // ============================================
  // 2. SEED TRAINING SPLITS
  // ============================================
  console.log('\n🏋️ Seeding training splits...');

  // Upper/Lower Split
  const upperLowerSplit = await prisma.trainingSplit.upsert({
    where: { name: 'Upper/Lower' },
    update: {},
    create: {
      name: 'Upper/Lower',
      description: 'Classic upper/lower body split. Train upper body one day, lower body the next. Great for building overall strength and muscle mass with adequate recovery between sessions.',
      focusAreas: ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Glutes'],
      difficulty: 'Beginner',
      isActive: true,
    },
  });

  // Push/Pull/Legs Split
  const pplSplit = await prisma.trainingSplit.upsert({
    where: { name: 'Push/Pull/Legs' },
    update: {},
    create: {
      name: 'Push/Pull/Legs',
      description: 'Divide training into pushing movements (chest, shoulders, triceps), pulling movements (back, biceps), and leg day. Allows high frequency with proper recovery.',
      focusAreas: ['Chest', 'Shoulders', 'Triceps', 'Back', 'Biceps', 'Legs'],
      difficulty: 'Intermediate',
      isActive: true,
    },
  });

  // Full Body Split
  const fullBodySplit = await prisma.trainingSplit.upsert({
    where: { name: 'Full Body' },
    update: {},
    create: {
      name: 'Full Body',
      description: 'Train all major muscle groups in each session. Perfect for beginners or those with limited training days. Maximizes frequency and overall stimulus.',
      focusAreas: ['Full Body', 'Compound Movements'],
      difficulty: 'Beginner',
      isActive: true,
    },
  });

  // Anterior/Posterior Split
  const anteriorPosteriorSplit = await prisma.trainingSplit.upsert({
    where: { name: 'Anterior/Posterior' },
    update: {},
    create: {
      name: 'Anterior/Posterior',
      description: 'Split training between front-side muscles (quads, chest, front delts) and back-side muscles (hamstrings, back, rear delts, glutes). Excellent for balanced development.',
      focusAreas: ['Anterior Chain', 'Posterior Chain'],
      difficulty: 'Intermediate',
      isActive: true,
    },
  });

  // Bro Split
  const broSplit = await prisma.trainingSplit.upsert({
    where: { name: 'Bro Split' },
    update: {},
    create: {
      name: 'Bro Split',
      description: 'Traditional bodybuilding split with one muscle group per day (Chest, Back, Shoulders, Arms, Legs). Allows maximum volume per muscle group with long recovery periods.',
      focusAreas: ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs'],
      difficulty: 'Advanced',
      isActive: true,
    },
  });

  console.log('✅ Created 5 training splits');

  // ============================================
  // 3. SEED TRAINING STRUCTURES
  // ============================================
  console.log('\n📅 Seeding training structures and day assignments...');

  // UPPER/LOWER STRUCTURES
  // 4 days per week (2 on, 2 off pattern)
  const ul4Day = await prisma.trainingSplitStructure.upsert({
    where: { id: `ul-4day-${upperLowerSplit.id}` },
    update: {},
    create: {
      id: `ul-4day-${upperLowerSplit.id}`,
      splitId: upperLowerSplit.id,
      daysPerWeek: 4,
      pattern: '2 on, 2 off, repeat',
      isWeeklyBased: true,
    },
  });

  await prisma.trainingDayAssignment.createMany({
    data: [
      { structureId: ul4Day.id, dayOfWeek: 'Monday', dayNumber: 1, workoutType: 'Upper Body' },
      { structureId: ul4Day.id, dayOfWeek: 'Tuesday', dayNumber: 2, workoutType: 'Lower Body' },
      { structureId: ul4Day.id, dayOfWeek: 'Thursday', dayNumber: 3, workoutType: 'Upper Body' },
      { structureId: ul4Day.id, dayOfWeek: 'Friday', dayNumber: 4, workoutType: 'Lower Body' },
    ],
    skipDuplicates: true,
  });

  // 5 days per week
  const ul5Day = await prisma.trainingSplitStructure.upsert({
    where: { id: `ul-5day-${upperLowerSplit.id}` },
    update: {},
    create: {
      id: `ul-5day-${upperLowerSplit.id}`,
      splitId: upperLowerSplit.id,
      daysPerWeek: 5,
      pattern: 'Upper, Lower, Upper, Lower, Upper',
      isWeeklyBased: true,
    },
  });

  await prisma.trainingDayAssignment.createMany({
    data: [
      { structureId: ul5Day.id, dayOfWeek: 'Monday', dayNumber: 1, workoutType: 'Upper Body' },
      { structureId: ul5Day.id, dayOfWeek: 'Tuesday', dayNumber: 2, workoutType: 'Lower Body' },
      { structureId: ul5Day.id, dayOfWeek: 'Wednesday', dayNumber: 3, workoutType: 'Upper Body' },
      { structureId: ul5Day.id, dayOfWeek: 'Thursday', dayNumber: 4, workoutType: 'Lower Body' },
      { structureId: ul5Day.id, dayOfWeek: 'Friday', dayNumber: 5, workoutType: 'Upper Body' },
    ],
    skipDuplicates: true,
  });

  // 6 days per week
  const ul6Day = await prisma.trainingSplitStructure.upsert({
    where: { id: `ul-6day-${upperLowerSplit.id}` },
    update: {},
    create: {
      id: `ul-6day-${upperLowerSplit.id}`,
      splitId: upperLowerSplit.id,
      daysPerWeek: 6,
      pattern: 'Upper, Lower, Upper, Lower, Upper, Lower',
      isWeeklyBased: true,
    },
  });

  await prisma.trainingDayAssignment.createMany({
    data: [
      { structureId: ul6Day.id, dayOfWeek: 'Monday', dayNumber: 1, workoutType: 'Upper Body' },
      { structureId: ul6Day.id, dayOfWeek: 'Tuesday', dayNumber: 2, workoutType: 'Lower Body' },
      { structureId: ul6Day.id, dayOfWeek: 'Wednesday', dayNumber: 3, workoutType: 'Upper Body' },
      { structureId: ul6Day.id, dayOfWeek: 'Thursday', dayNumber: 4, workoutType: 'Lower Body' },
      { structureId: ul6Day.id, dayOfWeek: 'Friday', dayNumber: 5, workoutType: 'Upper Body' },
      { structureId: ul6Day.id, dayOfWeek: 'Saturday', dayNumber: 6, workoutType: 'Lower Body' },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Created Upper/Lower structures (4, 5, 6 days)');

  // PUSH/PULL/LEGS STRUCTURES
  // 6 days per week
  const ppl6Day = await prisma.trainingSplitStructure.upsert({
    where: { id: `ppl-6day-${pplSplit.id}` },
    update: {},
    create: {
      id: `ppl-6day-${pplSplit.id}`,
      splitId: pplSplit.id,
      daysPerWeek: 6,
      pattern: 'Push, Pull, Legs, Push, Pull, Legs',
      isWeeklyBased: true,
    },
  });

  await prisma.trainingDayAssignment.createMany({
    data: [
      { structureId: ppl6Day.id, dayOfWeek: 'Monday', dayNumber: 1, workoutType: 'Push' },
      { structureId: ppl6Day.id, dayOfWeek: 'Tuesday', dayNumber: 2, workoutType: 'Pull' },
      { structureId: ppl6Day.id, dayOfWeek: 'Wednesday', dayNumber: 3, workoutType: 'Legs' },
      { structureId: ppl6Day.id, dayOfWeek: 'Thursday', dayNumber: 4, workoutType: 'Push' },
      { structureId: ppl6Day.id, dayOfWeek: 'Friday', dayNumber: 5, workoutType: 'Pull' },
      { structureId: ppl6Day.id, dayOfWeek: 'Saturday', dayNumber: 6, workoutType: 'Legs' },
    ],
    skipDuplicates: true,
  });

  // 7 days per week (cyclic)
  const ppl7Day = await prisma.trainingSplitStructure.upsert({
    where: { id: `ppl-7day-${pplSplit.id}` },
    update: {},
    create: {
      id: `ppl-7day-${pplSplit.id}`,
      splitId: pplSplit.id,
      daysPerWeek: 7,
      pattern: 'Continuous cycle - no rest days',
      isWeeklyBased: false, // Cyclic pattern
    },
  });

  await prisma.trainingDayAssignment.createMany({
    data: [
      { structureId: ppl7Day.id, dayOfWeek: null, dayNumber: 1, workoutType: 'Push' },
      { structureId: ppl7Day.id, dayOfWeek: null, dayNumber: 2, workoutType: 'Pull' },
      { structureId: ppl7Day.id, dayOfWeek: null, dayNumber: 3, workoutType: 'Legs' },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Created Push/Pull/Legs structures (6, 7 days)');

  // FULL BODY STRUCTURES
  // 3 days per week (every other day)
  const fb3Day = await prisma.trainingSplitStructure.upsert({
    where: { id: `fb-3day-${fullBodySplit.id}` },
    update: {},
    create: {
      id: `fb-3day-${fullBodySplit.id}`,
      splitId: fullBodySplit.id,
      daysPerWeek: 3,
      pattern: 'Every other day',
      isWeeklyBased: true,
    },
  });

  await prisma.trainingDayAssignment.createMany({
    data: [
      { structureId: fb3Day.id, dayOfWeek: 'Monday', dayNumber: 1, workoutType: 'Full Body' },
      { structureId: fb3Day.id, dayOfWeek: 'Wednesday', dayNumber: 2, workoutType: 'Full Body' },
      { structureId: fb3Day.id, dayOfWeek: 'Friday', dayNumber: 3, workoutType: 'Full Body' },
    ],
    skipDuplicates: true,
  });

  // 4 days per week
  const fb4Day = await prisma.trainingSplitStructure.upsert({
    where: { id: `fb-4day-${fullBodySplit.id}` },
    update: {},
    create: {
      id: `fb-4day-${fullBodySplit.id}`,
      splitId: fullBodySplit.id,
      daysPerWeek: 4,
      pattern: '2 on, 1 off, 2 on',
      isWeeklyBased: true,
    },
  });

  await prisma.trainingDayAssignment.createMany({
    data: [
      { structureId: fb4Day.id, dayOfWeek: 'Monday', dayNumber: 1, workoutType: 'Full Body' },
      { structureId: fb4Day.id, dayOfWeek: 'Tuesday', dayNumber: 2, workoutType: 'Full Body' },
      { structureId: fb4Day.id, dayOfWeek: 'Thursday', dayNumber: 3, workoutType: 'Full Body' },
      { structureId: fb4Day.id, dayOfWeek: 'Friday', dayNumber: 4, workoutType: 'Full Body' },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Created Full Body structures (3, 4 days)');

  // ANTERIOR/POSTERIOR STRUCTURES
  // 4 days per week
  const ap4Day = await prisma.trainingSplitStructure.upsert({
    where: { id: `ap-4day-${anteriorPosteriorSplit.id}` },
    update: {},
    create: {
      id: `ap-4day-${anteriorPosteriorSplit.id}`,
      splitId: anteriorPosteriorSplit.id,
      daysPerWeek: 4,
      pattern: 'Anterior, Posterior, Anterior, Posterior',
      isWeeklyBased: true,
    },
  });

  await prisma.trainingDayAssignment.createMany({
    data: [
      { structureId: ap4Day.id, dayOfWeek: 'Monday', dayNumber: 1, workoutType: 'Anterior Chain' },
      { structureId: ap4Day.id, dayOfWeek: 'Tuesday', dayNumber: 2, workoutType: 'Posterior Chain' },
      { structureId: ap4Day.id, dayOfWeek: 'Thursday', dayNumber: 3, workoutType: 'Anterior Chain' },
      { structureId: ap4Day.id, dayOfWeek: 'Friday', dayNumber: 4, workoutType: 'Posterior Chain' },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Created Anterior/Posterior structure (4 days)');

  // BRO SPLIT STRUCTURES
  // 5 days per week
  const bro5Day = await prisma.trainingSplitStructure.upsert({
    where: { id: `bro-5day-${broSplit.id}` },
    update: {},
    create: {
      id: `bro-5day-${broSplit.id}`,
      splitId: broSplit.id,
      daysPerWeek: 5,
      pattern: 'One muscle group per day',
      isWeeklyBased: true,
    },
  });

  await prisma.trainingDayAssignment.createMany({
    data: [
      { structureId: bro5Day.id, dayOfWeek: 'Monday', dayNumber: 1, workoutType: 'Chest' },
      { structureId: bro5Day.id, dayOfWeek: 'Tuesday', dayNumber: 2, workoutType: 'Back' },
      { structureId: bro5Day.id, dayOfWeek: 'Wednesday', dayNumber: 3, workoutType: 'Shoulders' },
      { structureId: bro5Day.id, dayOfWeek: 'Thursday', dayNumber: 4, workoutType: 'Arms' },
      { structureId: bro5Day.id, dayOfWeek: 'Friday', dayNumber: 5, workoutType: 'Legs' },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Created Bro Split structure (5 days)');

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n✨ Database seeding completed successfully!');
  console.log('\nSummary:');
  console.log(`  • ${subscriptionFeatures.length} subscription tier features`);
  console.log('  • 5 training splits (Upper/Lower, PPL, Full Body, Anterior/Posterior, Bro Split)');
  console.log('  • 11 training structures with day assignments');
  console.log('  • All data created with conflict handling (no duplicates)');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
