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

    return NextResponse.json({
      success: true,
      profile: profile || null
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

    // Update or create the user's profile
    const updatedProfile = await prisma.clientMemory.upsert({
      where: { userId: user.id },
      update: {
        // Personal Information
        name: data.name || undefined,
        age: data.age ? parseInt(data.age) : undefined,
        gender: data.gender || undefined,
        height: data.height ? parseFloat(data.height) : undefined,
        weight: data.weight ? parseFloat(data.weight) : undefined,
        bodyFatPercentage: data.bodyFatPercentage ? parseFloat(data.bodyFatPercentage) : undefined,

        // Training Information
        trainingExperience: data.trainingExperience || undefined,
        weeklyTrainingDays: data.weeklyTrainingDays ? parseInt(data.weeklyTrainingDays) : undefined,
        preferredTrainingStyle: data.preferredTrainingStyle || undefined,
        trainingSchedule: data.trainingSchedule || undefined,
        availableTime: data.availableTime ? parseInt(data.availableTime) : undefined,
        activityLevel: data.activityLevel || undefined,

        // Goals and Motivation
        primaryGoal: data.primaryGoal || undefined,
        secondaryGoals: data.secondaryGoals ? processArray(data.secondaryGoals) : undefined,
        targetWeight: data.targetWeight ? parseFloat(data.targetWeight) : undefined,
        targetBodyFat: data.targetBodyFat ? parseFloat(data.targetBodyFat) : undefined,
        goalDeadline: data.goalDeadline ? new Date(data.goalDeadline) : undefined,
        motivation: data.motivation || undefined,

        // Health and Limitations
        injuries: data.injuries ? processArray(data.injuries) : undefined,
        limitations: data.limitations ? processArray(data.limitations) : undefined,
        medications: data.medications ? processArray(data.medications) : undefined,
        allergies: data.allergies ? processArray(data.allergies) : undefined,

        // Preferences and Lifestyle
        dietaryPreferences: data.dietaryPreferences ? processArray(data.dietaryPreferences) : undefined,
        foodDislikes: data.foodDislikes ? processArray(data.foodDislikes) : undefined,
        supplementsUsed: data.supplementsUsed ? processArray(data.supplementsUsed) : undefined,
        sleepHours: data.sleepHours ? parseFloat(data.sleepHours) : undefined,
        stressLevel: data.stressLevel || undefined,
        workSchedule: data.workSchedule || undefined,

        // Training Environment
        gymAccess: data.gymAccess !== undefined ? Boolean(data.gymAccess) : undefined,
        homeGym: data.homeGym !== undefined ? Boolean(data.homeGym) : undefined,
        equipmentAvailable: data.equipmentAvailable ? processArray(data.equipmentAvailable) : undefined,
        gymBudget: data.gymBudget ? parseFloat(data.gymBudget) : undefined,

        // Progress Tracking
        currentBench: data.currentBench ? parseFloat(data.currentBench) : undefined,
        currentSquat: data.currentSquat ? parseFloat(data.currentSquat) : undefined,
        currentDeadlift: data.currentDeadlift ? parseFloat(data.currentDeadlift) : undefined,
        currentOHP: data.currentOHP ? parseFloat(data.currentOHP) : undefined,

        // Communication Preferences
        preferredLanguage: data.preferredLanguage || undefined,
        communicationStyle: data.communicationStyle || undefined,

        lastInteraction: new Date(),
      },
      create: {
        userId: user.id,
        // Personal Information
        name: data.name || undefined,
        age: data.age ? parseInt(data.age) : undefined,
        gender: data.gender || undefined,
        height: data.height ? parseFloat(data.height) : undefined,
        weight: data.weight ? parseFloat(data.weight) : undefined,
        bodyFatPercentage: data.bodyFatPercentage ? parseFloat(data.bodyFatPercentage) : undefined,

        // Training Information
        trainingExperience: data.trainingExperience || undefined,
        weeklyTrainingDays: data.weeklyTrainingDays ? parseInt(data.weeklyTrainingDays) : undefined,
        preferredTrainingStyle: data.preferredTrainingStyle || undefined,
        trainingSchedule: data.trainingSchedule || undefined,
        availableTime: data.availableTime ? parseInt(data.availableTime) : undefined,
        activityLevel: data.activityLevel || undefined,

        // Goals and Motivation
        primaryGoal: data.primaryGoal || undefined,
        secondaryGoals: data.secondaryGoals ? processArray(data.secondaryGoals) : undefined,
        targetWeight: data.targetWeight ? parseFloat(data.targetWeight) : undefined,
        targetBodyFat: data.targetBodyFat ? parseFloat(data.targetBodyFat) : undefined,
        goalDeadline: data.goalDeadline ? new Date(data.goalDeadline) : undefined,
        motivation: data.motivation || undefined,

        // Health and Limitations
        injuries: data.injuries ? processArray(data.injuries) : undefined,
        limitations: data.limitations ? processArray(data.limitations) : undefined,
        medications: data.medications ? processArray(data.medications) : undefined,
        allergies: data.allergies ? processArray(data.allergies) : undefined,

        // Preferences and Lifestyle
        dietaryPreferences: data.dietaryPreferences ? processArray(data.dietaryPreferences) : undefined,
        foodDislikes: data.foodDislikes ? processArray(data.foodDislikes) : undefined,
        supplementsUsed: data.supplementsUsed ? processArray(data.supplementsUsed) : undefined,
        sleepHours: data.sleepHours ? parseFloat(data.sleepHours) : undefined,
        stressLevel: data.stressLevel || undefined,
        workSchedule: data.workSchedule || undefined,

        // Training Environment
        gymAccess: data.gymAccess !== undefined ? Boolean(data.gymAccess) : undefined,
        homeGym: data.homeGym !== undefined ? Boolean(data.homeGym) : undefined,
        equipmentAvailable: data.equipmentAvailable ? processArray(data.equipmentAvailable) : undefined,
        gymBudget: data.gymBudget ? parseFloat(data.gymBudget) : undefined,

        // Progress Tracking
        currentBench: data.currentBench ? parseFloat(data.currentBench) : undefined,
        currentSquat: data.currentSquat ? parseFloat(data.currentSquat) : undefined,
        currentDeadlift: data.currentDeadlift ? parseFloat(data.currentDeadlift) : undefined,
        currentOHP: data.currentOHP ? parseFloat(data.currentOHP) : undefined,

        // Communication Preferences
        preferredLanguage: data.preferredLanguage || 'en',
        communicationStyle: data.communicationStyle || undefined,

        lastInteraction: new Date(),
      }
    });

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
