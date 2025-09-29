import { z } from 'zod';

// Multilingual content schema - flexible for optional languages
const multilingualContentSchema = z.object({
  en: z.string().min(1, 'English content is required'),
  ar: z.string().optional().default(''),
  fr: z.string().optional().default(''),
});

// Program category schema (simplified)
const programCategorySchema = z.object({
  type: z.enum(['minimalist', 'essentialist', 'maximalist']),
  description: multilingualContentSchema,
});

// Exercise in template schema
const exerciseInTemplateSchema = z.object({
  id: z.string(),
  targetedMuscle: z.enum(['CHEST', 'BACK', 'SIDE_DELTS', 'FRONT_DELTS', 'REAR_DELTS', 'ELBOW_FLEXORS', 'TRICEPS', 'FOREARMS', 'GLUTES', 'QUADRICEPS', 'HAMSTRINGS', 'ADDUCTORS', 'CALVES', 'ERECTORS', 'ABS', 'OBLIQUES', 'HIP_FLEXORS']).optional(),
  selectedExercise: z.string().optional(),
});

// Workout template schema (updated for admin form)
const workoutTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Workout name is required'),
  muscleGroups: z.array(z.string()).default([]),
  exercises: z.array(exerciseInTemplateSchema).default([]),
});

// Guide section schema
export const guideSectionSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Section title is required'),
  content: z.string().min(1, 'Section content is required'),
  order: z.number().min(1),
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

// Program structure schema
const programStructureSchema = z.object({
  id: z.string().optional(), // Optional for new structures
  name: multilingualContentSchema,
  structureType: z.enum(['weekly', 'cyclic']).default('weekly'),
  sessionCount: z.number().min(1, 'At least 1 session per week').max(7, 'Maximum 7 sessions per week').optional(),
  trainingDays: z.number().min(1, 'At least 1 training day').max(6, 'Maximum 6 training days').optional(),
  restDays: z.number().min(1, 'At least 1 rest day').max(3, 'Maximum 3 rest days').optional(),
  weeklySchedule: weeklyScheduleSchema.optional(),
  order: z.number().default(0),
  isDefault: z.boolean().default(false),
});

// Main program creation schema
export const programCreationSchema = z.object({
  // Basic information
  name: multilingualContentSchema,
  description: multilingualContentSchema,
  price: z.number().min(0, 'Price must be positive').max(999999, 'Price too high'),
  lemonSqueezyId: z.string().min(1, 'LemonSqueezy ID is required').optional(),
  
  // Program structures (multiple structures support)
  programStructures: z.array(programStructureSchema).min(1, 'At least one program structure is required'),
  
  // Interactive features
  hasInteractiveBuilder: z.boolean().default(true),
  allowsCustomization: z.boolean().default(true),
  
  // Categories (minimalist, essentialist, maximalist) - optional for now
  categories: z.array(programCategorySchema).max(3).default([]),
  
  // Workout templates - can be empty initially
  workoutTemplates: z.array(workoutTemplateSchema).default([]),
  
  // Guide sections
  guideSections: z.array(guideSectionSchema).default([]),
  
  // About program
  aboutContent: z.string().default(''),
  thumbnailUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  
  // Status
  isActive: z.boolean().default(true),
});

// Type exports
export type ProgramCreationInput = z.infer<typeof programCreationSchema>;
export type MultilingualContent = z.infer<typeof multilingualContentSchema>;
export type ProgramCategory = z.infer<typeof programCategorySchema>;
export type ProgramStructure = z.infer<typeof programStructureSchema>;
export type WorkoutTemplate = z.infer<typeof workoutTemplateSchema>;
export type GuideSection = z.infer<typeof guideSectionSchema>;
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