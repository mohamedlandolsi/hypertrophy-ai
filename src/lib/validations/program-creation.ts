import { z } from 'zod';

// Multilingual content schema
const multilingualContentSchema = z.object({
  en: z.string().min(1, 'English content is required'),
  ar: z.string().min(1, 'Arabic content is required'),
  fr: z.string().min(1, 'French content is required'),
});

// Volume guidelines schema
const volumeGuidelinesSchema = z.object({
  sets: z.array(z.number().min(1).max(10)).min(2).max(2), // [min, max]
  reps: z.array(z.number().min(1).max(50)).min(2).max(2), // [min, max]
  restPeriod: z.number().min(30).max(300), // seconds
});

// Exercise template schema
const exerciseTemplateSchema = z.object({
  muscleGroup: z.string().min(1, 'Muscle group is required'),
  exerciseType: z.enum(['COMPOUND', 'ISOLATION', 'UNILATERAL']),
  categoryType: z.enum(['MINIMALIST', 'ESSENTIALIST', 'MAXIMALIST']),
  priority: z.number().min(1).max(10),
  volume: volumeGuidelinesSchema,
  alternatives: z.array(z.string()).default([]),
});

// Program category configuration schema
const categoryConfigurationSchema = z.object({
  exerciseFocus: z.enum(['COMPOUND', 'ISOLATION', 'BALANCED']),
  sessionLength: z.enum(['SHORT', 'MODERATE', 'LONG']), // 30-45min, 45-60min, 60-90min
  volumeApproach: z.enum(['MINIMAL', 'MODERATE', 'HIGH']),
  exerciseSelection: z.object({
    compoundRatio: z.number().min(0).max(100), // percentage
    isolationRatio: z.number().min(0).max(100), // percentage
    unilateralRatio: z.number().min(0).max(100), // percentage
  }),
});

// Program category schema
const programCategorySchema = z.object({
  categoryType: z.enum(['MINIMALIST', 'ESSENTIALIST', 'MAXIMALIST']),
  configuration: categoryConfigurationSchema,
});

// Workout template schema
const workoutTemplateSchema = z.object({
  name: multilingualContentSchema,
  order: z.number().min(1),
  requiredMuscleGroups: z.array(z.string()).min(1, 'At least one muscle group is required'),
});

// Program guide content schema
const programGuideContentSchema = z.object({
  introduction: multilingualContentSchema,
  structure: multilingualContentSchema,
  exerciseSelection: multilingualContentSchema,
  volumeAdjustment: multilingualContentSchema,
  beginnerGuidelines: multilingualContentSchema,
  progressionPlan: multilingualContentSchema,
  faq: z.array(z.object({
    question: multilingualContentSchema,
    answer: multilingualContentSchema,
  })).default([]),
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
  
  // Interactive features
  hasInteractiveBuilder: z.boolean().default(true),
  allowsCustomization: z.boolean().default(true),
  
  // Categories (minimalist, essentialist, maximalist)
  categories: z.array(programCategorySchema).min(1, 'At least one category is required').max(3),
  
  // Workout templates
  workoutTemplates: z.array(workoutTemplateSchema).min(1, 'At least one workout template is required'),
  
  // Exercise templates for each category
  exerciseTemplates: z.array(exerciseTemplateSchema).default([]),
  
  // Program guide content
  programGuide: programGuideContentSchema,
  
  // Status
  isActive: z.boolean().default(true),
});

// Type exports
export type ProgramCreationInput = z.infer<typeof programCreationSchema>;
export type MultilingualContent = z.infer<typeof multilingualContentSchema>;
export type VolumeGuidelines = z.infer<typeof volumeGuidelinesSchema>;
export type ExerciseTemplate = z.infer<typeof exerciseTemplateSchema>;
export type ProgramCategory = z.infer<typeof programCategorySchema>;
export type WorkoutTemplate = z.infer<typeof workoutTemplateSchema>;
export type ProgramGuideContent = z.infer<typeof programGuideContentSchema>;

// Helper functions for form defaults
export const getDefaultMultilingualContent = (): MultilingualContent => ({
  en: '',
  ar: '',
  fr: '',
});

export const getDefaultVolumeGuidelines = (): VolumeGuidelines => ({
  sets: [3, 4],
  reps: [8, 12],
  restPeriod: 120,
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