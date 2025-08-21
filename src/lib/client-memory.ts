import { prisma } from './prisma';
import type { Prisma } from '@prisma/client';

export interface MemoryUpdate {
  // Personal Information
  name?: string;
  age?: number;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  height?: number; // in cm
  weight?: number; // in kg
  bodyFatPercentage?: number;
  
  // Training Information
  trainingExperience?: string;
  trainingStructureType?: string;
  weeklyTrainingDays?: number;
  trainingCycle?: string;
  customCyclePattern?: string;
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
  
  // Health and Limitations
  injuries?: string[];
  limitations?: string[];
  medications?: string[];
  allergies?: string[];
  
  // Preferences and Lifestyle
  dietaryPreferences?: string[];
  foodDislikes?: string[];
  supplementsUsed?: string[];
  sleepHours?: number;
  stressLevel?: string;
  workSchedule?: string;
  
  // Training Environment
  gymAccess?: boolean;
  homeGym?: boolean;
  equipmentAvailable?: string[];
  gymBudget?: number;
  
  // Progress Tracking
  currentBench?: number;
  currentSquat?: number;
  currentDeadlift?: number;
  currentOHP?: number;
  
  // Communication Preferences
  preferredLanguage?: string;
  communicationStyle?: string;
  
  // AI Coaching Notes
  coachingNotes?: Prisma.InputJsonValue;
}

/**
 * Get or create client memory for a user (optimized with select)
 */
export async function getClientMemory(userId: string) {
  const memory = await prisma.clientMemory.findUnique({
    where: { userId },
    select: {
      id: true,
      userId: true,
      name: true,
      age: true,
      gender: true,
      height: true,
      weight: true,
      bodyFatPercentage: true,
      trainingExperience: true,
      weeklyTrainingDays: true,
      preferredTrainingStyle: true,
      trainingSchedule: true,
      availableTime: true,
      activityLevel: true,
      primaryGoal: true,
      secondaryGoals: true,
      targetWeight: true,
      targetBodyFat: true,
      goalDeadline: true,
      motivation: true,
      injuries: true,
      limitations: true,
      medications: true,
      allergies: true,
      dietaryPreferences: true,
      foodDislikes: true,
      supplementsUsed: true,
      sleepHours: true,
      stressLevel: true,
      workSchedule: true,
      gymAccess: true,
      homeGym: true,
      equipmentAvailable: true,
      gymBudget: true,
      currentBench: true,
      currentSquat: true,
      currentDeadlift: true,
      currentOHP: true,
      preferredLanguage: true,
      communicationStyle: true,
      coachingNotes: true,
      lastInteraction: true,
      trainingStructureType: true,
      trainingCycle: true,
      customCyclePattern: true,
      createdAt: true,
      updatedAt: true
    }
  });
  
  if (!memory) {
    return await prisma.clientMemory.create({
      data: {
        userId,
        lastInteraction: new Date()
      }
    });
  }
  
  return memory;
}

/**
 * Update client memory with new information
 */
export async function updateClientMemory(userId: string, updates: MemoryUpdate) {
  return await prisma.clientMemory.upsert({
    where: { userId },
    create: {
      userId,
      lastInteraction: new Date(),
      ...updates
    },
    update: {
      ...updates,
      lastInteraction: new Date(),
      updatedAt: new Date()
    }
  });
}

/**
 * Add coaching notes to the AI memory
 */
export async function addCoachingNote(userId: string, note: string, category: string = 'general') {
  const memory = await getClientMemory(userId);
  const existingNotes = (memory.coachingNotes as Record<string, unknown[]>) || {};
  
  if (!existingNotes[category]) {
    existingNotes[category] = [];
  }
  
  existingNotes[category].push({
    note,
    timestamp: new Date().toISOString(),
    id: Date.now().toString()
  });
  
  // Keep only the last 20 notes per category to avoid bloat
  if (existingNotes[category].length > 20) {
    existingNotes[category] = existingNotes[category].slice(-20);
  }
    return await updateClientMemory(userId, {
    coachingNotes: existingNotes as Prisma.InputJsonValue
  });
}

/**
 * Legacy regex-based extraction (kept as fallback)
 * Extract and save information from user messages using regex patterns
 */
export async function extractAndSaveInformationLegacy(userId: string, userMessage: string) {
  const message = userMessage.toLowerCase();
  const updates: MemoryUpdate = {};
  
  // Extract name
  const namePattern = /(?:my name is|i'm|i am|call me)\s+([a-z]+)/i;
  const nameMatch = userMessage.match(namePattern);
  if (nameMatch) {
    updates.name = nameMatch[1];
  }
  
  // Extract age
  const agePattern = /(?:i'm|i am|age|old)\s*(\d{1,2})\s*(?:years?\s*old)?/i;
  const ageMatch = message.match(agePattern);
  if (ageMatch && parseInt(ageMatch[1]) >= 13 && parseInt(ageMatch[1]) <= 99) {
    updates.age = parseInt(ageMatch[1]);
  }
  
  // Extract weight
  const weightKgPattern = /(\d+(?:\.\d+)?)\s*(?:kg|kilos?|kilograms?)/i;
  const weightLbPattern = /(\d+(?:\.\d+)?)\s*(?:lbs?|pounds?)/i;
  const weightKgMatch = message.match(weightKgPattern);
  const weightLbMatch = message.match(weightLbPattern);
  
  if (weightKgMatch) {
    updates.weight = parseFloat(weightKgMatch[1]);
  } else if (weightLbMatch) {
    updates.weight = parseFloat(weightLbMatch[1]) * 0.453592; // Convert lbs to kg
  }
  
  // Extract height
  const heightCmPattern = /(\d+(?:\.\d+)?)\s*(?:cm|centimeters?)/i;
  const heightFeetPattern = /(\d+)\s*(?:ft|feet|')\s*(\d+)\s*(?:in|inches?|")?/i;
  const heightCmMatch = message.match(heightCmPattern);
  const heightFeetMatch = message.match(heightFeetPattern);
  
  if (heightCmMatch) {
    updates.height = parseFloat(heightCmMatch[1]);
  } else if (heightFeetMatch) {
    const feet = parseInt(heightFeetMatch[1]);
    const inches = parseInt(heightFeetMatch[2]) || 0;
    updates.height = (feet * 12 + inches) * 2.54; // Convert to cm
  }
  
  // Extract training experience
  if (message.includes('beginner') || message.includes('new to') || message.includes('just started')) {
    updates.trainingExperience = 'beginner';
  } else if (message.includes('intermediate') || message.includes('been training for') || message.includes('few years')) {
    updates.trainingExperience = 'intermediate';
  } else if (message.includes('advanced') || message.includes('experienced') || message.includes('many years')) {
    updates.trainingExperience = 'advanced';
  }
  
  // Extract training days per week
  const trainingDaysPattern = /(\d+)\s*(?:days?\s*(?:per\s*week|a\s*week|weekly))/i;
  const trainingDaysMatch = message.match(trainingDaysPattern);
  if (trainingDaysMatch) {
    const days = parseInt(trainingDaysMatch[1]);
    if (days >= 1 && days <= 7) {
      updates.weeklyTrainingDays = days;
    }
  }
  
  // Extract goals
  if (message.includes('build muscle') || message.includes('gain muscle') || message.includes('hypertrophy')) {
    updates.primaryGoal = 'muscle_gain';
  } else if (message.includes('lose weight') || message.includes('fat loss') || message.includes('cut')) {
    updates.primaryGoal = 'fat_loss';
  } else if (message.includes('get stronger') || message.includes('strength') || message.includes('powerlifting')) {
    updates.primaryGoal = 'strength';
  }
  
  // Extract injuries or limitations
  const injuries = [];
  if (message.includes('knee injury') || message.includes('bad knee')) injuries.push('knee');
  if (message.includes('back injury') || message.includes('back pain')) injuries.push('back');
  if (message.includes('shoulder injury') || message.includes('shoulder pain')) injuries.push('shoulder');
  if (message.includes('wrist injury') || message.includes('wrist pain')) injuries.push('wrist');
  
  if (injuries.length > 0) {
    const memory = await getClientMemory(userId);
    const existingInjuries = memory.injuries || [];
    updates.injuries = [...new Set([...existingInjuries, ...injuries])];
  }
  
  // Extract gym access
  if (message.includes('home gym') || message.includes('workout at home')) {
    updates.homeGym = true;
    updates.gymAccess = false;
  } else if (message.includes('gym membership') || message.includes('go to gym')) {
    updates.gymAccess = true;
  }
  
  // Extract equipment
  const equipment = [];
  if (message.includes('dumbbells')) equipment.push('dumbbells');
  if (message.includes('barbell')) equipment.push('barbell');
  if (message.includes('resistance bands')) equipment.push('resistance_bands');
  if (message.includes('pull up bar') || message.includes('pullup bar')) equipment.push('pullup_bar');
  if (message.includes('treadmill')) equipment.push('treadmill');
  if (message.includes('bike') || message.includes('cycling')) equipment.push('bike');
  
  if (equipment.length > 0) {
    const memory = await getClientMemory(userId);
    const existingEquipment = memory.equipmentAvailable || [];
    updates.equipmentAvailable = [...new Set([...existingEquipment, ...equipment])];
  }
  
  // If we found any information, save it
  if (Object.keys(updates).length > 0) {
    await updateClientMemory(userId, updates);
    
    // Add a coaching note about the new information
    const infoItems = Object.keys(updates).map(key => {
      const value = updates[key as keyof MemoryUpdate];
      return `${key}: ${Array.isArray(value) ? value.join(', ') : value}`;
    }).join('; ');
    
    await addCoachingNote(userId, `User provided new information: ${infoItems}`, 'personal_info');
  }
  
  return updates;
}

/**
 * Generate a memory summary for the AI to use in responses
 */
export async function generateMemorySummary(userId: string): Promise<string> {
  const memory = await getClientMemory(userId);
  
  const sections = [];
  
  // Personal info with new fields
  if (memory.name || memory.age || memory.gender || memory.height || memory.weight) {
    const personal = [];
    if (memory.name) personal.push(`Name: ${memory.name}`);
    if (memory.age) personal.push(`Age: ${memory.age}`);
    if (memory.gender) personal.push(`Gender: ${memory.gender.toLowerCase()}`);
    if (memory.height) personal.push(`Height: ${memory.height}cm`);
    if (memory.weight) personal.push(`Weight: ${memory.weight}kg`);
    if (memory.bodyFatPercentage) personal.push(`Body Fat: ${memory.bodyFatPercentage}%`);
    sections.push(`PERSONAL INFO: ${personal.join(', ')}`);
  }
  
  // Training info with activity level
  if (memory.trainingExperience || memory.weeklyTrainingDays || memory.trainingStructureType || memory.preferredTrainingStyle || memory.activityLevel) {
    const training = [];
    if (memory.trainingExperience) training.push(`Experience: ${memory.trainingExperience}`);
    
    // Handle training structure
    if (memory.trainingStructureType === 'weekly' && memory.weeklyTrainingDays) {
      training.push(`Training Days: ${memory.weeklyTrainingDays}/week`);
    } else if (memory.trainingStructureType === 'cycle') {
      if (memory.trainingCycle === 'custom' && memory.customCyclePattern) {
        training.push(`Training Cycle: ${memory.customCyclePattern}`);
      } else if (memory.trainingCycle) {
        const cycleDisplay = memory.trainingCycle.replace(/_/g, ' ').replace(/on/g, 'on').replace(/off/g, 'off');
        training.push(`Training Cycle: ${cycleDisplay}`);
      }
    }
    
    if (memory.activityLevel) training.push(`Activity Level: ${memory.activityLevel.toLowerCase()}`);
    if (memory.preferredTrainingStyle) training.push(`Style: ${memory.preferredTrainingStyle}`);
    if (memory.availableTime) training.push(`Session Time: ${memory.availableTime}min`);
    if (memory.trainingSchedule) training.push(`Prefers: ${memory.trainingSchedule} training`);
    sections.push(`TRAINING: ${training.join(', ')}`);
  }
  
  // Goals with enhanced information
  if (memory.primaryGoal || memory.secondaryGoals?.length || memory.targetWeight || memory.motivation) {
    const goals = [];
    if (memory.primaryGoal) goals.push(`Primary: ${memory.primaryGoal}`);
    if (memory.secondaryGoals?.length) goals.push(`Secondary: ${memory.secondaryGoals.join(', ')}`);
    if (memory.targetWeight) goals.push(`Target Weight: ${memory.targetWeight}kg`);
    if (memory.targetBodyFat) goals.push(`Target Body Fat: ${memory.targetBodyFat}%`);
    if (memory.goalDeadline) goals.push(`Deadline: ${memory.goalDeadline.toDateString()}`);
    if (memory.motivation) goals.push(`Motivation: ${memory.motivation}`);
    sections.push(`GOALS: ${goals.join(', ')}`);
  }
  
  // Health & limitations
  if (memory.injuries?.length || memory.limitations?.length || memory.medications?.length || memory.allergies?.length) {
    const health = [];
    if (memory.injuries?.length) health.push(`Injuries: ${memory.injuries.join(', ')}`);
    if (memory.limitations?.length) health.push(`Limitations: ${memory.limitations.join(', ')}`);
    if (memory.medications?.length) health.push(`Medications: ${memory.medications.join(', ')}`);
    if (memory.allergies?.length) health.push(`Allergies: ${memory.allergies.join(', ')}`);
    sections.push(`HEALTH: ${health.join(', ')}`);
  }
  
  // Lifestyle factors
  if (memory.sleepHours || memory.stressLevel || memory.workSchedule || memory.dietaryPreferences?.length) {
    const lifestyle = [];
    if (memory.sleepHours) lifestyle.push(`Sleep: ${memory.sleepHours}h/night`);
    if (memory.stressLevel) lifestyle.push(`Stress Level: ${memory.stressLevel}`);
    if (memory.workSchedule) lifestyle.push(`Work Schedule: ${memory.workSchedule}`);
    if (memory.dietaryPreferences?.length) lifestyle.push(`Diet: ${memory.dietaryPreferences.join(', ')}`);
    if (memory.supplementsUsed?.length) lifestyle.push(`Supplements: ${memory.supplementsUsed.join(', ')}`);
    sections.push(`LIFESTYLE: ${lifestyle.join(', ')}`);
  }
  
  // Equipment & environment
  if (memory.gymAccess !== null || memory.homeGym !== null || memory.equipmentAvailable?.length || memory.gymBudget) {
    const environment = [];
    if (memory.gymAccess) environment.push('Has gym access');
    if (memory.homeGym) environment.push('Has home gym');
    if (memory.equipmentAvailable?.length) environment.push(`Equipment: ${memory.equipmentAvailable.join(', ')}`);
    if (memory.gymBudget) environment.push(`Budget: ${memory.gymBudget}/month`);
    sections.push(`ENVIRONMENT: ${environment.join(', ')}`);
  }
  
  // Progress tracking
  if (memory.currentBench || memory.currentSquat || memory.currentDeadlift || memory.currentOHP) {
    const progress = [];
    if (memory.currentBench) progress.push(`Bench: ${memory.currentBench}kg`);
    if (memory.currentSquat) progress.push(`Squat: ${memory.currentSquat}kg`);
    if (memory.currentDeadlift) progress.push(`Deadlift: ${memory.currentDeadlift}kg`);
    if (memory.currentOHP) progress.push(`OHP: ${memory.currentOHP}kg`);
    sections.push(`CURRENT LIFTS: ${progress.join(', ')}`);
  }
  
  // Communication preferences
  if (memory.preferredLanguage !== 'en' || memory.communicationStyle) {
    const comm = [];
    if (memory.preferredLanguage !== 'en') comm.push(`Language: ${memory.preferredLanguage}`);
    if (memory.communicationStyle) comm.push(`Style: ${memory.communicationStyle}`);
    sections.push(`COMMUNICATION: ${comm.join(', ')}`);
  }
  
  return sections.length > 0 ? sections.join('\n') : 'No client information stored yet.';
}

/**
 * Get complete user profile for enhanced AI context
 */
export async function getCompleteUserProfile(userId: string) {
  const memory = await prisma.clientMemory.findUnique({
    where: { userId },
    select: {
      id: true,
      userId: true,
      name: true,
      age: true,
      gender: true,
      height: true,
      weight: true,
      bodyFatPercentage: true,
      trainingExperience: true,
      trainingStructureType: true,
      weeklyTrainingDays: true,
      trainingCycle: true,
      customCyclePattern: true,
      preferredTrainingStyle: true,
      trainingSchedule: true,
      availableTime: true,
      activityLevel: true,
      primaryGoal: true,
      secondaryGoals: true,
      targetWeight: true,
      targetBodyFat: true,
      goalDeadline: true,
      motivation: true,
      injuries: true,
      limitations: true,
      medications: true,
      allergies: true,
      dietaryPreferences: true,
      foodDislikes: true,
      supplementsUsed: true,
      sleepHours: true,
      stressLevel: true,
      workSchedule: true,
      gymAccess: true,
      homeGym: true,
      equipmentAvailable: true,
      gymBudget: true,
      currentBench: true,
      currentSquat: true,
      currentDeadlift: true,
      currentOHP: true,
      preferredLanguage: true,
      communicationStyle: true,
      coachingNotes: true,
      createdAt: true,
      updatedAt: true,
    }
  });

  return memory;
}

/**
 * Get full chat history for a conversation
 */
export async function getFullChatHistory(chatId: string) {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          content: true,
          role: true,
          createdAt: true,
        }
      }
    }
  });

  return chat?.messages || [];
}
