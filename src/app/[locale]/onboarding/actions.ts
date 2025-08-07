'use server';

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function completeOnboarding() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Update the user's profile to mark onboarding as complete
  await prisma.user.update({
    where: { id: user.id },
    data: { hasCompletedOnboarding: true },
  });

  return { success: true };
}

export async function saveOnboardingData(formData: {
  // Personal Information
  name?: string;
  age?: number;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  height?: number;
  weight?: number;
  bodyFatPercentage?: number;
  dataProcessingConsent?: boolean;

  // Training Information
  trainingExperience?: string;
  weeklyTrainingDays?: number;
  preferredTrainingStyle?: string;
  trainingSchedule?: string;
  availableTime?: number;
  activityLevel?: 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE';

  // Goals and Motivation
  primaryGoal?: string;
  secondaryGoals?: string[];
  targetWeight?: number;
  targetBodyFat?: number;
  goalDeadline?: Date;
  motivation?: string;

  // Training Environment
  gymAccess?: boolean;
  homeGym?: boolean;
  equipmentAvailable?: string[];
  gymBudget?: number;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Extract consent and other user-level data
  const { dataProcessingConsent, ...clientMemoryData } = formData;

  // Create or update client memory with the provided data
  await prisma.clientMemory.upsert({
    where: { userId: user.id },
    update: {
      ...clientMemoryData,
      lastInteraction: new Date(),
    },
    create: {
      userId: user.id,
      ...clientMemoryData,
      lastInteraction: new Date(),
    },
  });

  // Update user table with consent information and mark onboarding as complete
  await prisma.user.update({
    where: { id: user.id },
    data: { 
      hasCompletedOnboarding: true,
      ...(dataProcessingConsent !== undefined && {
        dataProcessingConsent,
        consentTimestamp: dataProcessingConsent ? new Date() : null,
        privacyPolicyVersion: dataProcessingConsent ? '1.0' : null,
      }),
    },
  });

  return { success: true };
}
