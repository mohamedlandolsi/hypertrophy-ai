import { z } from 'zod';

// Multilingual content schema
const multilingualContentSchema = z.object({
  en: z.string().min(1, 'English content is required'),
  ar: z.string().min(1, 'Arabic content is required'),
  fr: z.string().min(1, 'French content is required'),
});

// Program category schema (simplified)
const programCategorySchema = z.object({
  type: z.enum(['minimalist', 'essentialist', 'maximalist']),
  description: multilingualContentSchema,
});

// Exercise in template schema
const exerciseInTemplateSchema = z.object({
  id: z.string(),
  targetedMuscle: z.enum(['CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS', 'FOREARMS', 'ABS', 'GLUTES', 'QUADRICEPS', 'HAMSTRINGS', 'ADDUCTORS', 'CALVES']).optional(),
  selectedExercise: z.string().optional(),
});

// Workout template schema (updated for admin form)
const workoutTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Workout name is required'),
  muscleGroups: z.array(z.string()).default([]),
  exercises: z.array(exerciseInTemplateSchema).default([]),
});

// Weekly schedule schema
const weeklyScheduleSchema = z.object({
  monday: z.string().optional(),
  tuesday: z.string().optional(),
  wednesday: z.string().optional(),
  thursday: z.string().optional(),
  friday: z.string().optional(),
  saturday: z.string().optional(),
  sunday: z.string().optional(),
});

// Main program creation schema
export const programCreationSchema = z.object({
  // Basic information
  name: multilingualContentSchema,
  description: multilingualContentSchema,
  price: z.number().min(0, 'Price must be positive').max(999999, 'Price too high'),
  lemonSqueezyId: z.string().min(1, 'LemonSqueezy ID is required').optional(),
  
  // Training structure
  structureType: z.enum(['weekly', 'cyclic']).default('weekly'),
  sessionCount: z.number().min(1, 'At least 1 session per week').max(7, 'Maximum 7 sessions per week').optional(),
  trainingDays: z.number().min(1, 'At least 1 training day').max(6, 'Maximum 6 training days').optional(),
  restDays: z.number().min(1, 'At least 1 rest day').max(3, 'Maximum 3 rest days').optional(),
  
  // Weekly schedule (when structureType is 'weekly')
  weeklySchedule: weeklyScheduleSchema.optional(),
  
  // Interactive features
  hasInteractiveBuilder: z.boolean().default(true),
  allowsCustomization: z.boolean().default(true),
  
  // Categories (minimalist, essentialist, maximalist)
  categories: z.array(programCategorySchema).min(1, 'At least one category is required').max(3),
  
  // Workout templates
  workoutTemplates: z.array(workoutTemplateSchema).min(1, 'At least one workout template is required'),
  
  // Status
  isActive: z.boolean().default(true),
});

// Type exports
export type ProgramCreationInput = z.infer<typeof programCreationSchema>;
export type MultilingualContent = z.infer<typeof multilingualContentSchema>;
export type ProgramCategory = z.infer<typeof programCategorySchema>;
export type WorkoutTemplate = z.infer<typeof workoutTemplateSchema>;
export type ExerciseInTemplate = z.infer<typeof exerciseInTemplateSchema>;
export type WeeklySchedule = z.infer<typeof weeklyScheduleSchema>;

// Helper functions for form defaults
export const getDefaultMultilingualContent = (): MultilingualContent => ({
  en: '',
  ar: '',
  fr: '',
});

export const getDefaultCategoryConfiguration = () => ({
  exerciseFocus: 'BALANCED' as const,
  sessionLength: 'MODERATE' as const,
  volumeApproach: 'MODERATE' as const,
  exerciseSelection: {
    compoundRatio: 50,
    isolationRatio: 40,
    unilateralRatio: 10,
  },
});

export const getProgramTypeTemplates = () => ({
  'Upper/Lower': {
    sessionCount: 4,
    workoutTemplates: [
      { name: 'Upper Body A', muscleGroups: ['CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS'] },
      { name: 'Lower Body A', muscleGroups: ['QUADRICEPS', 'HAMSTRINGS', 'GLUTES', 'CALVES'] },
      { name: 'Upper Body B', muscleGroups: ['CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS'] },
      { name: 'Lower Body B', muscleGroups: ['QUADRICEPS', 'HAMSTRINGS', 'GLUTES', 'CALVES'] },
    ],
  },
  'FB EOD': {
    sessionCount: 3,
    workoutTemplates: [
      { name: 'Full Body A', muscleGroups: ['CHEST', 'BACK', 'SHOULDERS', 'QUADRICEPS', 'HAMSTRINGS', 'GLUTES'] },
      { name: 'Full Body B', muscleGroups: ['CHEST', 'BACK', 'SHOULDERS', 'QUADRICEPS', 'HAMSTRINGS', 'GLUTES'] },
      { name: 'Full Body C', muscleGroups: ['CHEST', 'BACK', 'SHOULDERS', 'QUADRICEPS', 'HAMSTRINGS', 'GLUTES'] },
    ],
  },
  'Anterior/Posterior': {
    sessionCount: 4,
    workoutTemplates: [
      { name: 'Anterior A', muscleGroups: ['CHEST', 'SHOULDERS', 'QUADRICEPS', 'BICEPS'] },
      { name: 'Posterior A', muscleGroups: ['BACK', 'HAMSTRINGS', 'GLUTES', 'TRICEPS'] },
      { name: 'Anterior B', muscleGroups: ['CHEST', 'SHOULDERS', 'QUADRICEPS', 'BICEPS'] },
      { name: 'Posterior B', muscleGroups: ['BACK', 'HAMSTRINGS', 'GLUTES', 'TRICEPS'] },
    ],
  },
  'PPL x UL': {
    sessionCount: 5,
    workoutTemplates: [
      { name: 'Push', muscleGroups: ['CHEST', 'SHOULDERS', 'TRICEPS'] },
      { name: 'Pull', muscleGroups: ['BACK', 'BICEPS'] },
      { name: 'Legs', muscleGroups: ['QUADRICEPS', 'HAMSTRINGS', 'GLUTES', 'CALVES'] },
      { name: 'Upper Body', muscleGroups: ['CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS'] },
      { name: 'Lower Body', muscleGroups: ['QUADRICEPS', 'HAMSTRINGS', 'GLUTES', 'CALVES'] },
    ],
  },
  'Upper/Lower x5': {
    sessionCount: 5,
    workoutTemplates: [
      { name: 'Upper Body A', muscleGroups: ['CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS'] },
      { name: 'Lower Body A', muscleGroups: ['QUADRICEPS', 'HAMSTRINGS', 'GLUTES', 'CALVES'] },
      { name: 'Upper Body B', muscleGroups: ['CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS'] },
      { name: 'Lower Body B', muscleGroups: ['QUADRICEPS', 'HAMSTRINGS', 'GLUTES', 'CALVES'] },
      { name: 'Upper Body C', muscleGroups: ['CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS'] },
    ],
  },
});