/**
 * Dynamic User Profile Integration for Enhanced RAG
 * 
 * This module dynamically injects user profile data into AI prompts
 * to ensure personalized responses based on current user information.
 */

import { prisma } from './prisma';

export interface UserProfileData {
  // Personal Information
  name?: string;
  age?: number;
  height?: number; // cm
  weight?: number; // kg
  bodyFatPercentage?: number;
  
  // Training Information  
  trainingExperience?: 'beginner' | 'intermediate' | 'advanced';
  weeklyTrainingDays?: number;
  preferredTrainingStyle?: string;
  availableTime?: number; // minutes per session
  
  // Goals and Motivation
  primaryGoal?: 'muscle_gain' | 'fat_loss' | 'strength' | 'endurance' | 'general_fitness' | 'body_recomposition';
  targetWeight?: number;
  motivation?: string;
  
  // Health and Limitations
  injuries?: string[];
  limitations?: string[];
  
  // Training Environment
  gymAccess?: boolean;
  homeGym?: boolean;
  equipmentAvailable?: string[];
  
  // Preferences
  dietaryPreferences?: string[];
  sleepHours?: number;
  stressLevel?: 'low' | 'moderate' | 'high';
  
  // Progress Tracking
  currentBench?: number;
  currentSquat?: number;
  currentDeadlift?: number;
  currentOHP?: number;
}

/**
 * Fetch comprehensive user profile data from database
 */
export async function fetchUserProfile(userId: string): Promise<UserProfileData | null> {
  try {
    console.log(`👤 Fetching user profile for: ${userId}`);
    
    const clientMemory = await prisma.clientMemory.findUnique({
      where: { userId },
      select: {
        // Personal Information
        name: true,
        age: true,
        height: true,
        weight: true,
        bodyFatPercentage: true,
        
        // Training Information
        trainingExperience: true,
        weeklyTrainingDays: true,
        preferredTrainingStyle: true,
        availableTime: true,
        
        // Goals and Motivation
        primaryGoal: true,
        targetWeight: true,
        motivation: true,
        
        // Health and Limitations
        injuries: true,
        limitations: true,
        
        // Training Environment
        gymAccess: true,
        homeGym: true,
        equipmentAvailable: true,
        
        // Preferences  
        dietaryPreferences: true,
        sleepHours: true,
        stressLevel: true,
        
        // Progress Tracking
        currentBench: true,
        currentSquat: true,
        currentDeadlift: true,
        currentOHP: true,
      }
    });
    
    if (!clientMemory) {
      console.log(`👤 No profile found for user: ${userId}`);
      return null;
    }
    
    // Convert database fields to our interface
    const profile: UserProfileData = {
      name: clientMemory.name || undefined,
      age: clientMemory.age || undefined,
      height: clientMemory.height || undefined,
      weight: clientMemory.weight || undefined,
      bodyFatPercentage: clientMemory.bodyFatPercentage || undefined,
      
      trainingExperience: clientMemory.trainingExperience as any || undefined,
      weeklyTrainingDays: clientMemory.weeklyTrainingDays || undefined,
      preferredTrainingStyle: clientMemory.preferredTrainingStyle || undefined,
      availableTime: clientMemory.availableTime || undefined,
      
      primaryGoal: clientMemory.primaryGoal as any || undefined,
      targetWeight: clientMemory.targetWeight || undefined,
      motivation: clientMemory.motivation || undefined,
      
      injuries: clientMemory.injuries || undefined,
      limitations: clientMemory.limitations || undefined,
      
      gymAccess: clientMemory.gymAccess || undefined,
      homeGym: clientMemory.homeGym || undefined,
      equipmentAvailable: clientMemory.equipmentAvailable || undefined,
      
      dietaryPreferences: clientMemory.dietaryPreferences || undefined,
      sleepHours: clientMemory.sleepHours || undefined,
      stressLevel: clientMemory.stressLevel as any || undefined,
      
      // Progress Tracking
      currentBench: clientMemory.currentBench || undefined,
      currentSquat: clientMemory.currentSquat || undefined,
      currentDeadlift: clientMemory.currentDeadlift || undefined,
      currentOHP: clientMemory.currentOHP || undefined,
    };
    
    console.log(`✅ Profile loaded with ${Object.keys(profile).filter(k => profile[k as keyof UserProfileData] != null).length} populated fields`);
    
    return profile;
    
  } catch (error) {
    console.error('❌ Error fetching user profile:', error);
    return null;
  }
}

/**
 * Generate dynamic prompt injection based on user profile
 */
export function generatePersonalizationPrompt(profile: UserProfileData): string {
  if (!profile) {
    return `\n\n--- CLIENT PROFILE ---
No specific client information available. Provide general evidence-based advice while encouraging the client to complete their profile for more personalized recommendations.
--- END CLIENT PROFILE ---`;
  }
  
  const sections: string[] = [];
  
  // Personal Information Section
  if (profile.name || profile.age || profile.weight || profile.height) {
    const personalInfo: string[] = [];
    if (profile.name) personalInfo.push(`Name: ${profile.name}`);
    if (profile.age) personalInfo.push(`Age: ${profile.age} years`);
    if (profile.weight && profile.height) {
      const bmi = profile.weight / Math.pow(profile.height / 100, 2);
      personalInfo.push(`Stats: ${profile.height}cm, ${profile.weight}kg (BMI: ${bmi.toFixed(1)})`);
    } else {
      if (profile.height) personalInfo.push(`Height: ${profile.height}cm`);
      if (profile.weight) personalInfo.push(`Weight: ${profile.weight}kg`);
    }
    if (profile.bodyFatPercentage) personalInfo.push(`Body Fat: ${profile.bodyFatPercentage}%`);
    
    sections.push(`PERSONAL INFO: ${personalInfo.join(', ')}`);
  }
  
  // Training Status Section
  if (profile.trainingExperience || profile.weeklyTrainingDays || profile.availableTime) {
    const trainingInfo: string[] = [];
    if (profile.trainingExperience) trainingInfo.push(`Experience: ${profile.trainingExperience}`);
    if (profile.weeklyTrainingDays) trainingInfo.push(`Training frequency: ${profile.weeklyTrainingDays}x/week`);
    if (profile.availableTime) trainingInfo.push(`Session duration: ${profile.availableTime} minutes`);
    if (profile.preferredTrainingStyle) trainingInfo.push(`Preferred style: ${profile.preferredTrainingStyle}`);
    
    sections.push(`TRAINING STATUS: ${trainingInfo.join(', ')}`);
  }
  
  // Goals Section
  if (profile.primaryGoal || profile.targetWeight || profile.motivation) {
    const goalInfo: string[] = [];
    if (profile.primaryGoal) goalInfo.push(`Primary goal: ${profile.primaryGoal.replace('_', ' ')}`);
    if (profile.targetWeight) goalInfo.push(`Target weight: ${profile.targetWeight}kg`);
    if (profile.motivation) goalInfo.push(`Motivation: ${profile.motivation}`);
    
    sections.push(`GOALS: ${goalInfo.join(', ')}`);
  }
  
  // Limitations Section
  if (profile.injuries?.length || profile.limitations?.length) {
    const limitationInfo: string[] = [];
    if (profile.injuries?.length) limitationInfo.push(`Injuries: ${profile.injuries.join(', ')}`);
    if (profile.limitations?.length) limitationInfo.push(`Limitations: ${profile.limitations.join(', ')}`);
    
    sections.push(`LIMITATIONS: ${limitationInfo.join(', ')}`);
  }
  
  // Equipment & Environment Section
  if (profile.gymAccess !== undefined || profile.homeGym !== undefined || profile.equipmentAvailable?.length) {
    const equipmentInfo: string[] = [];
    if (profile.gymAccess) equipmentInfo.push('Full gym access');
    if (profile.homeGym) equipmentInfo.push('Home gym setup');
    if (profile.equipmentAvailable?.length) equipmentInfo.push(`Available equipment: ${profile.equipmentAvailable.join(', ')}`);
    if (!profile.gymAccess && !profile.homeGym && !profile.equipmentAvailable?.length) {
      equipmentInfo.push('Limited equipment access');
    }
    
    sections.push(`EQUIPMENT: ${equipmentInfo.join(', ')}`);
  }
  
  // Lifestyle Factors Section
  if (profile.sleepHours || profile.stressLevel || profile.dietaryPreferences?.length) {
    const lifestyleInfo: string[] = [];
    if (profile.sleepHours) lifestyleInfo.push(`Sleep: ${profile.sleepHours}h/night`);
    if (profile.stressLevel) lifestyleInfo.push(`Stress level: ${profile.stressLevel}`);
    if (profile.dietaryPreferences?.length) lifestyleInfo.push(`Diet preferences: ${profile.dietaryPreferences.join(', ')}`);
    
    sections.push(`LIFESTYLE: ${lifestyleInfo.join(', ')}`);
  }
  
  // Progress Tracking Section
  if (profile.currentBench || profile.currentSquat || profile.currentDeadlift || profile.currentOHP) {
    const strengthInfo: string[] = [];
    if (profile.currentBench) strengthInfo.push(`Bench: ${profile.currentBench}kg`);
    if (profile.currentSquat) strengthInfo.push(`Squat: ${profile.currentSquat}kg`);
    if (profile.currentDeadlift) strengthInfo.push(`Deadlift: ${profile.currentDeadlift}kg`);
    if (profile.currentOHP) strengthInfo.push(`OHP: ${profile.currentOHP}kg`);
    
    sections.push(`CURRENT STRENGTH: ${strengthInfo.join(', ')}`);
  }
  
  // Build final prompt
  if (sections.length === 0) {
    return `\n\n--- CLIENT PROFILE ---
Client profile is being built. Encourage them to share more information for better personalized advice.
--- END CLIENT PROFILE ---`;
  }
  
  const personalizedPrompt = `\n\n--- CLIENT PROFILE ---
${sections.join('\n')}

PERSONALIZATION INSTRUCTIONS:
- Address the client by name if available
- Consider their experience level when recommending exercises and intensities
- Adapt recommendations to their available time and equipment
- Account for any injuries or limitations mentioned
- Align advice with their specific goals and motivation
- Consider their lifestyle factors (sleep, stress, diet) when making recommendations
- Reference their current program or recent performance when relevant
- Provide progressive advice that matches their training experience
--- END CLIENT PROFILE ---`;
  
  return personalizedPrompt;
}

/**
 * Generate training recommendations based on user profile
 */
export function generateTrainingRecommendations(profile: UserProfileData): string {
  if (!profile) return '';
  
  const recommendations: string[] = [];
  
  // Experience-based recommendations
  if (profile.trainingExperience === 'beginner') {
    recommendations.push('Focus on compound movements and proper form');
    recommendations.push('Start with 2-3 full-body sessions per week');
  } else if (profile.trainingExperience === 'intermediate') {
    recommendations.push('Consider upper/lower or push/pull/legs split');
    recommendations.push('Implement progressive overload systematically');
  } else if (profile.trainingExperience === 'advanced') {
    recommendations.push('Fine-tune training variables for continued progress');
    recommendations.push('Consider periodization and specialized techniques');
  }
  
  // Goal-based recommendations
  if (profile.primaryGoal === 'muscle_gain') {
    recommendations.push('Prioritize hypertrophy rep ranges (6-20 reps)');
    recommendations.push('Ensure adequate caloric surplus');
  } else if (profile.primaryGoal === 'fat_loss') {
    recommendations.push('Combine resistance training with cardiovascular exercise');
    recommendations.push('Maintain strength while in caloric deficit');
  } else if (profile.primaryGoal === 'strength') {
    recommendations.push('Focus on lower rep ranges (1-6 reps)');
    recommendations.push('Emphasize compound movements');
  }
  
  // Equipment-based recommendations
  if (!profile.gymAccess && !profile.homeGym) {
    recommendations.push('Focus on bodyweight progressions');
    recommendations.push('Consider resistance bands or adjustable dumbbells');
  }
  
  // Time-based recommendations
  if (profile.availableTime && profile.availableTime < 45) {
    recommendations.push('Use compound movements for efficiency');
    recommendations.push('Consider supersets to save time');
  }
  
  if (recommendations.length === 0) return '';
  
  return `\n\nTRAINING RECOMMENDATIONS FOR THIS CLIENT:
${recommendations.map(rec => `• ${rec}`).join('\n')}`;
}

/**
 * Check if user profile needs updates
 */
export function assessProfileCompleteness(profile: UserProfileData | null): {
  completeness: number;
  missingCritical: string[];
  suggestions: string[];
} {
  if (!profile) {
    return {
      completeness: 0,
      missingCritical: ['basic profile information'],
      suggestions: ['Complete your profile to get personalized training advice']
    };
  }
  
  const criticalFields = [
    'trainingExperience',
    'primaryGoal', 
    'weeklyTrainingDays',
    'gymAccess'
  ];
  
  const importantFields = [
    'age',
    'weight',
    'height',
    'availableTime',
    'injuries',
    'equipmentAvailable'
  ];
  
  const criticalComplete = criticalFields.filter(field => profile[field as keyof UserProfileData] != null);
  const importantComplete = importantFields.filter(field => profile[field as keyof UserProfileData] != null);
  
  const totalFields = criticalFields.length + importantFields.length;
  const completedFields = criticalComplete.length + importantComplete.length;
  const completeness = Math.round((completedFields / totalFields) * 100);
  
  const missingCritical = criticalFields.filter(field => profile[field as keyof UserProfileData] == null);
  
  const suggestions: string[] = [];
  if (missingCritical.includes('trainingExperience')) {
    suggestions.push('Share your training experience level for better exercise recommendations');
  }
  if (missingCritical.includes('primaryGoal')) {
    suggestions.push('Tell me your primary fitness goal to tailor your program');
  }
  if (missingCritical.includes('weeklyTrainingDays')) {
    suggestions.push('Let me know how many days per week you can train');
  }
  if (missingCritical.includes('gymAccess')) {
    suggestions.push('Share your training environment (gym, home, equipment available)');
  }
  
  return {
    completeness,
    missingCritical,
    suggestions
  };
}


