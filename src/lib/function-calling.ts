// src/lib/function-calling.ts

import { FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { updateClientMemory, type MemoryUpdate } from './client-memory';
import { prisma } from './prisma';

// Enhanced memory update interface that matches the ClientMemory schema
export interface EnhancedMemoryUpdate extends MemoryUpdate {
  // Additional fields for conflict resolution
  conflictDetected?: boolean;
  conflictField?: string;
  conflictOldValue?: string;
  conflictNewValue?: string;
  conflictReason?: string;
  
  // Profile update tracking
  updateReason?: string;
  updateTimestamp?: Date;
}

// Function declaration for updating client profile
export const updateClientProfileFunction: FunctionDeclaration = {
  name: 'updateClientProfile',
  description: 'Update the client\'s profile information when new information is learned or conflicts are resolved',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      // Personal Information
      name: { type: SchemaType.STRING, description: 'Client name' },
      age: { type: SchemaType.NUMBER, description: 'Client age in years' },
      gender: { 
        type: SchemaType.STRING, 
        format: 'enum',
        enum: ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'],
        description: 'Client gender' 
      },
      height: { type: SchemaType.NUMBER, description: 'Height in centimeters' },
      weight: { type: SchemaType.NUMBER, description: 'Weight in kilograms' },
      bodyFatPercentage: { type: SchemaType.NUMBER, description: 'Body fat percentage' },
      
      // Training Information
      trainingExperience: { type: SchemaType.STRING, description: 'Training experience level' },
      weeklyTrainingDays: { type: SchemaType.NUMBER, description: 'Number of training days per week' },
      preferredTrainingStyle: { type: SchemaType.STRING, description: 'Preferred training style or split' },
      trainingSchedule: { type: SchemaType.STRING, description: 'Specific training schedule' },
      availableTime: { type: SchemaType.NUMBER, description: 'Available training time per session in minutes' },
      activityLevel: { 
        type: SchemaType.STRING,
        format: 'enum',
        enum: ['SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE'],
        description: 'Overall activity level'
      },
      trainingStructureType: { type: SchemaType.STRING, description: 'Type of training structure' },
      trainingCycle: { type: SchemaType.STRING, description: 'Current training cycle' },
      
      // Goals and Motivation
      primaryGoal: { type: SchemaType.STRING, description: 'Primary fitness goal' },
      secondaryGoals: { 
        type: SchemaType.ARRAY, 
        items: { type: SchemaType.STRING },
        description: 'Secondary fitness goals' 
      },
      targetWeight: { type: SchemaType.NUMBER, description: 'Target weight in kilograms' },
      targetBodyFat: { type: SchemaType.NUMBER, description: 'Target body fat percentage' },
      motivation: { type: SchemaType.STRING, description: 'Motivation and reasons for training' },
      
      // Health and Limitations
      injuries: { 
        type: SchemaType.ARRAY, 
        items: { type: SchemaType.STRING },
        description: 'Current or past injuries' 
      },
      limitations: { 
        type: SchemaType.ARRAY, 
        items: { type: SchemaType.STRING },
        description: 'Physical limitations or restrictions' 
      },
      medications: { 
        type: SchemaType.ARRAY, 
        items: { type: SchemaType.STRING },
        description: 'Current medications' 
      },
      allergies: { 
        type: SchemaType.ARRAY, 
        items: { type: SchemaType.STRING },
        description: 'Known allergies' 
      },
      
      // Preferences and Lifestyle
      dietaryPreferences: { 
        type: SchemaType.ARRAY, 
        items: { type: SchemaType.STRING },
        description: 'Dietary preferences and restrictions' 
      },
      foodDislikes: { 
        type: SchemaType.ARRAY, 
        items: { type: SchemaType.STRING },
        description: 'Foods the client dislikes' 
      },
      supplementsUsed: { 
        type: SchemaType.ARRAY, 
        items: { type: SchemaType.STRING },
        description: 'Supplements currently used' 
      },
      sleepHours: { type: SchemaType.NUMBER, description: 'Average sleep hours per night' },
      stressLevel: { type: SchemaType.STRING, description: 'Current stress level' },
      workSchedule: { type: SchemaType.STRING, description: 'Work schedule details' },
      
      // Training Environment
      gymAccess: { type: SchemaType.BOOLEAN, description: 'Has access to a gym' },
      homeGym: { type: SchemaType.BOOLEAN, description: 'Has a home gym setup' },
      equipmentAvailable: { 
        type: SchemaType.ARRAY, 
        items: { type: SchemaType.STRING },
        description: 'Available equipment' 
      },
      gymBudget: { type: SchemaType.NUMBER, description: 'Monthly gym/equipment budget' },
      
      // Progress Tracking
      currentBench: { type: SchemaType.NUMBER, description: 'Current bench press 1RM in kg' },
      currentSquat: { type: SchemaType.NUMBER, description: 'Current squat 1RM in kg' },
      currentDeadlift: { type: SchemaType.NUMBER, description: 'Current deadlift 1RM in kg' },
      currentOHP: { type: SchemaType.NUMBER, description: 'Current overhead press 1RM in kg' },
      
      // Communication Preferences
      preferredLanguage: { type: SchemaType.STRING, description: 'Preferred communication language' },
      communicationStyle: { type: SchemaType.STRING, description: 'Preferred communication style' },
      
      // Conflict Resolution Fields
      conflictDetected: { type: SchemaType.BOOLEAN, description: 'Whether a conflict was detected' },
      conflictField: { type: SchemaType.STRING, description: 'The field where conflict occurred' },
      conflictOldValue: { type: SchemaType.STRING, description: 'Previous value that conflicts' },
      conflictNewValue: { type: SchemaType.STRING, description: 'New value being requested' },
      conflictReason: { type: SchemaType.STRING, description: 'Reason for the conflict' },
      updateReason: { type: SchemaType.STRING, description: 'Reason for this profile update' }
    },
    required: ['updateReason']
  }
};

// Function declaration for detecting profile conflicts
export const detectProfileConflictFunction: FunctionDeclaration = {
  name: 'detectProfileConflict',
  description: 'Detect conflicts between user requests and their current profile information',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      conflictField: { type: SchemaType.STRING, description: 'The profile field that conflicts' },
      currentValue: { type: SchemaType.STRING, description: 'Current value in profile' },
      requestedValue: { type: SchemaType.STRING, description: 'Value being requested by user' },
      conflictType: { 
        type: SchemaType.STRING,
        format: 'enum',
        enum: ['training_frequency', 'exercise_preference', 'goal_conflict', 'experience_mismatch'],
        description: 'Type of conflict detected'
      },
      conflictSeverity: {
        type: SchemaType.STRING,
        format: 'enum',
        enum: ['minor', 'moderate', 'major'],
        description: 'Severity of the conflict'
      },
      resolutionNeeded: { type: SchemaType.BOOLEAN, description: 'Whether user confirmation is needed' },
      suggestedResolution: { type: SchemaType.STRING, description: 'Suggested way to resolve the conflict' }
    },
    required: ['conflictField', 'currentValue', 'requestedValue', 'conflictType']
  }
};

// Handler function for profile updates
export async function handleProfileUpdate(userId: string, updateData: EnhancedMemoryUpdate): Promise<void> {
  try {
    console.log('🔄 Processing profile update for user:', userId);
    console.log('📝 Update data:', updateData);
    
    // Validate the update data
    if (!updateData.updateReason) {
      console.warn('⚠️ Profile update missing reason, skipping');
      return;
    }
    
    // Log conflict resolution if applicable
    if (updateData.conflictDetected) {
      console.log('⚠️ Conflict resolved:', {
        field: updateData.conflictField,
        oldValue: updateData.conflictOldValue,
        newValue: updateData.conflictNewValue,
        reason: updateData.conflictReason
      });
    }
    
    // Remove function calling specific fields before updating
    const cleanUpdateData = { ...updateData };
    delete cleanUpdateData.conflictDetected;
    delete cleanUpdateData.conflictField;
    delete cleanUpdateData.conflictOldValue;
    delete cleanUpdateData.conflictNewValue;
    delete cleanUpdateData.conflictReason;
    delete cleanUpdateData.updateReason;
    delete cleanUpdateData.updateTimestamp;
    
    // Perform the update
    await updateClientMemory(userId, cleanUpdateData);
    
    // Log successful update
    console.log('✅ Profile updated successfully for user:', userId);
    
    // Log the update for audit purposes
    await logProfileUpdate(userId, updateData);
    
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    throw error;
  }
}

// Handler function for conflict detection
export async function handleConflictDetection(userId: string, conflictData: {
  conflictField: string;
  currentValue: string;
  requestedValue: string;
  conflictType: string;
  conflictSeverity?: string;
  resolutionNeeded?: boolean;
  suggestedResolution?: string;
}): Promise<boolean> {
  try {
    console.log('🔍 Conflict detected for user:', userId);
    console.log('⚠️ Conflict details:', conflictData);
    
    // Log the conflict for monitoring
    await logConflictDetection(userId, conflictData);
    
    // Return true to indicate conflict was properly handled
    return true;
    
  } catch (error) {
    console.error('❌ Error handling conflict detection:', error);
    return false;
  }
}

// Audit logging functions
async function logProfileUpdate(userId: string, updateData: EnhancedMemoryUpdate): Promise<void> {
  try {
    // Create a log entry for the profile update
    await prisma.clientMemory.upsert({
      where: { userId },
      create: { userId },
      update: {
        coachingNotes: {
          ...(typeof updateData.coachingNotes === 'object' ? updateData.coachingNotes : {}),
          lastUpdate: {
            timestamp: new Date().toISOString(),
            reason: updateData.updateReason,
            conflict: updateData.conflictDetected || false,
            fields: Object.keys(updateData).filter(key => 
              !['updateReason', 'conflictDetected', 'conflictField', 'conflictOldValue', 'conflictNewValue', 'conflictReason'].includes(key)
            )
          }
        }
      }
    });
  } catch (error) {
    console.error('Error logging profile update:', error);
  }
}

async function logConflictDetection(userId: string, conflictData: {
  conflictField: string;
  currentValue: string;
  requestedValue: string;
  conflictType: string;
  conflictSeverity?: string;
  resolutionNeeded?: boolean;
  suggestedResolution?: string;
}): Promise<void> {
  try {
    // Update coaching notes with conflict information
    const existingMemory = await prisma.clientMemory.findUnique({
      where: { userId }
    });
    
    const existingNotes = (existingMemory?.coachingNotes as Record<string, unknown>) || {};
    
    await prisma.clientMemory.upsert({
      where: { userId },
      create: { userId },
      update: {
        coachingNotes: JSON.parse(JSON.stringify({
          ...existingNotes,
          conflicts: [
            ...((existingNotes.conflicts as Array<Record<string, unknown>>) || []),
            {
              timestamp: new Date().toISOString(),
              ...conflictData
            }
          ]
        }))
      }
    });
  } catch (error) {
    console.error('Error logging conflict detection:', error);
  }
}

// Export all function declarations for use in Gemini
export const functionDeclarations = [
  updateClientProfileFunction,
  detectProfileConflictFunction
];
