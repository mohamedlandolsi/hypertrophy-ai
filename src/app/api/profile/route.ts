import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { Gender, ActivityLevel } from '@prisma/client';

// GET handler to fetch the user's profile
export async function GET() {
  try {
    // Get the authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the user's client memory (profile)
    const profile = await prisma.clientMemory.findUnique({
      where: { userId: user.id },
    });

    // Fetch user consent information
    const userWithConsent = await prisma.user.findUnique({
      where: { id: user.id },
      select: { 
        dataProcessingConsent: true, 
        consentTimestamp: true 
      }
    });

    return NextResponse.json({
      success: true,
      profile: profile ? {
        ...profile,
        consentGiven: userWithConsent?.dataProcessingConsent,
        consentTimestamp: userWithConsent?.consentTimestamp?.toISOString(),
      } : {
        consentGiven: userWithConsent?.dataProcessingConsent,
        consentTimestamp: userWithConsent?.consentTimestamp?.toISOString(),
      }
    });

  } catch (error) {
    console.error('Profile API GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST handler to update the user's profile
export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // Validate enum values if provided
    if (data.gender && !Object.values(Gender).includes(data.gender)) {
      return NextResponse.json({ error: 'Invalid gender value' }, { status: 400 });
    }

    if (data.activityLevel && !Object.values(ActivityLevel).includes(data.activityLevel)) {
      return NextResponse.json({ error: 'Invalid activity level value' }, { status: 400 });
    }

    // Convert string arrays to proper arrays if they come as strings
    const processArray = (value: unknown) => {
      if (typeof value === 'string') {
        return value.split(',').map(item => item.trim()).filter(Boolean);
      }
      return Array.isArray(value) ? value : [];
    };

    // Extract consent and other user-level data
    const { 
      consentGiven,
      consentTimestamp,
      ...clientMemoryData 
    } = data;

    // Update or create the user's profile
    const updatedProfile = await prisma.clientMemory.upsert({
      where: { userId: user.id },
      update: {
        // Personal Information
        name: clientMemoryData.name || undefined,
        age: clientMemoryData.age ? parseInt(clientMemoryData.age) : undefined,
        gender: clientMemoryData.gender || undefined,
        height: clientMemoryData.height ? parseFloat(clientMemoryData.height) : undefined,
        weight: clientMemoryData.weight ? parseFloat(clientMemoryData.weight) : undefined,
        bodyFatPercentage: clientMemoryData.bodyFatPercentage ? parseFloat(clientMemoryData.bodyFatPercentage) : undefined,

        // Training Information
        trainingExperience: clientMemoryData.trainingExperience || undefined,
        weeklyTrainingDays: clientMemoryData.weeklyTrainingDays ? parseInt(clientMemoryData.weeklyTrainingDays) : undefined,
        preferredTrainingStyle: clientMemoryData.preferredTrainingStyle || undefined,
        trainingSchedule: clientMemoryData.trainingSchedule || undefined,
        availableTime: clientMemoryData.availableTime ? parseInt(clientMemoryData.availableTime) : undefined,
        activityLevel: clientMemoryData.activityLevel || undefined,

        // Goals and Motivation
        primaryGoal: clientMemoryData.primaryGoal || undefined,
        secondaryGoals: clientMemoryData.secondaryGoals ? processArray(clientMemoryData.secondaryGoals) : undefined,
        targetWeight: clientMemoryData.targetWeight ? parseFloat(clientMemoryData.targetWeight) : undefined,
        targetBodyFat: clientMemoryData.targetBodyFat ? parseFloat(clientMemoryData.targetBodyFat) : undefined,
        goalDeadline: clientMemoryData.goalDeadline ? new Date(clientMemoryData.goalDeadline) : undefined,
        motivation: clientMemoryData.motivation || undefined,

        // Health and Limitations
        injuries: clientMemoryData.injuries ? processArray(clientMemoryData.injuries) : undefined,
        limitations: clientMemoryData.limitations ? processArray(clientMemoryData.limitations) : undefined,
        medications: clientMemoryData.medications ? processArray(clientMemoryData.medications) : undefined,
        allergies: clientMemoryData.allergies ? processArray(clientMemoryData.allergies) : undefined,

        // Preferences and Lifestyle
        dietaryPreferences: clientMemoryData.dietaryPreferences ? processArray(clientMemoryData.dietaryPreferences) : undefined,
        foodDislikes: clientMemoryData.foodDislikes ? processArray(clientMemoryData.foodDislikes) : undefined,
        supplementsUsed: clientMemoryData.supplementsUsed ? processArray(clientMemoryData.supplementsUsed) : undefined,
        sleepHours: clientMemoryData.sleepHours ? parseFloat(clientMemoryData.sleepHours) : undefined,
        stressLevel: clientMemoryData.stressLevel || undefined,
        workSchedule: clientMemoryData.workSchedule || undefined,

        // Training Environment
        gymAccess: clientMemoryData.gymAccess !== undefined ? Boolean(clientMemoryData.gymAccess) : undefined,
        homeGym: clientMemoryData.homeGym !== undefined ? Boolean(clientMemoryData.homeGym) : undefined,
        equipmentAvailable: clientMemoryData.equipmentAvailable ? processArray(clientMemoryData.equipmentAvailable) : undefined,
        gymBudget: clientMemoryData.gymBudget ? parseFloat(clientMemoryData.gymBudget) : undefined,

        // Progress Tracking
        currentBench: clientMemoryData.currentBench ? parseFloat(clientMemoryData.currentBench) : undefined,
        currentSquat: clientMemoryData.currentSquat ? parseFloat(clientMemoryData.currentSquat) : undefined,
        currentDeadlift: clientMemoryData.currentDeadlift ? parseFloat(clientMemoryData.currentDeadlift) : undefined,
        currentOHP: clientMemoryData.currentOHP ? parseFloat(clientMemoryData.currentOHP) : undefined,

        // Communication Preferences
        preferredLanguage: clientMemoryData.preferredLanguage || undefined,
        communicationStyle: clientMemoryData.communicationStyle || undefined,

        lastInteraction: new Date(),
      },
      create: {
        userId: user.id,
        // Personal Information
        name: clientMemoryData.name || undefined,
        age: clientMemoryData.age ? parseInt(clientMemoryData.age) : undefined,
        gender: clientMemoryData.gender || undefined,
        height: clientMemoryData.height ? parseFloat(clientMemoryData.height) : undefined,
        weight: clientMemoryData.weight ? parseFloat(clientMemoryData.weight) : undefined,
        bodyFatPercentage: clientMemoryData.bodyFatPercentage ? parseFloat(clientMemoryData.bodyFatPercentage) : undefined,

        // Training Information
        trainingExperience: clientMemoryData.trainingExperience || undefined,
        weeklyTrainingDays: clientMemoryData.weeklyTrainingDays ? parseInt(clientMemoryData.weeklyTrainingDays) : undefined,
        preferredTrainingStyle: clientMemoryData.preferredTrainingStyle || undefined,
        trainingSchedule: clientMemoryData.trainingSchedule || undefined,
        availableTime: clientMemoryData.availableTime ? parseInt(clientMemoryData.availableTime) : undefined,
        activityLevel: clientMemoryData.activityLevel || undefined,

        // Goals and Motivation
        primaryGoal: clientMemoryData.primaryGoal || undefined,
        secondaryGoals: clientMemoryData.secondaryGoals ? processArray(clientMemoryData.secondaryGoals) : undefined,
        targetWeight: clientMemoryData.targetWeight ? parseFloat(clientMemoryData.targetWeight) : undefined,
        targetBodyFat: clientMemoryData.targetBodyFat ? parseFloat(clientMemoryData.targetBodyFat) : undefined,
        goalDeadline: clientMemoryData.goalDeadline ? new Date(clientMemoryData.goalDeadline) : undefined,
        motivation: clientMemoryData.motivation || undefined,

        // Health and Limitations
        injuries: clientMemoryData.injuries ? processArray(clientMemoryData.injuries) : undefined,
        limitations: clientMemoryData.limitations ? processArray(clientMemoryData.limitations) : undefined,
        medications: clientMemoryData.medications ? processArray(clientMemoryData.medications) : undefined,
        allergies: clientMemoryData.allergies ? processArray(clientMemoryData.allergies) : undefined,

        // Preferences and Lifestyle
        dietaryPreferences: clientMemoryData.dietaryPreferences ? processArray(clientMemoryData.dietaryPreferences) : undefined,
        foodDislikes: clientMemoryData.foodDislikes ? processArray(clientMemoryData.foodDislikes) : undefined,
        supplementsUsed: clientMemoryData.supplementsUsed ? processArray(clientMemoryData.supplementsUsed) : undefined,
        sleepHours: clientMemoryData.sleepHours ? parseFloat(clientMemoryData.sleepHours) : undefined,
        stressLevel: clientMemoryData.stressLevel || undefined,
        workSchedule: clientMemoryData.workSchedule || undefined,

        // Training Environment
        gymAccess: clientMemoryData.gymAccess !== undefined ? Boolean(clientMemoryData.gymAccess) : undefined,
        homeGym: clientMemoryData.homeGym !== undefined ? Boolean(clientMemoryData.homeGym) : undefined,
        equipmentAvailable: clientMemoryData.equipmentAvailable ? processArray(clientMemoryData.equipmentAvailable) : undefined,
        gymBudget: clientMemoryData.gymBudget ? parseFloat(clientMemoryData.gymBudget) : undefined,

        // Progress Tracking
        currentBench: clientMemoryData.currentBench ? parseFloat(clientMemoryData.currentBench) : undefined,
        currentSquat: clientMemoryData.currentSquat ? parseFloat(clientMemoryData.currentSquat) : undefined,
        currentDeadlift: clientMemoryData.currentDeadlift ? parseFloat(clientMemoryData.currentDeadlift) : undefined,
        currentOHP: clientMemoryData.currentOHP ? parseFloat(clientMemoryData.currentOHP) : undefined,

        // Communication Preferences
        preferredLanguage: clientMemoryData.preferredLanguage || 'en',
        communicationStyle: clientMemoryData.communicationStyle || undefined,

        lastInteraction: new Date(),
      }
    });

    // Update user table with consent information if provided
    if (consentGiven !== undefined) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          dataProcessingConsent: consentGiven,
          consentTimestamp: consentGiven ? (consentTimestamp ? new Date(consentTimestamp) : new Date()) : null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      profile: updatedProfile
    });

  } catch (error) {
    console.error('Profile API POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
