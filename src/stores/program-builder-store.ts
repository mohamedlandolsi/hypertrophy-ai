import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Types for our store
export interface TrainingExercise {
  id: string;
  name: Record<string, string>; // Multilingual
  primaryMuscleGroup: string;
  secondaryMuscleGroups: string[];
  type: string;
}

export interface WorkoutTemplate {
  id: string;
  name: Record<string, string>; // Multilingual
  order: number;
  requiredMuscleGroups: string[];
}

export interface TrainingProgram {
  id: string;
  name: Record<string, string>; // Multilingual
  description: Record<string, string>; // Multilingual
  workoutTemplates: WorkoutTemplate[];
}

export interface MuscleGroupVolume {
  muscleGroup: string;
  directSets: number;
  indirectSets: number;
  totalSets: number;
}

export interface MissingMuscleGroup {
  workoutTemplateId: string;
  workoutName: string;
  missingMuscleGroups: string[];
}

// Configuration stores which exercises are selected for each workout template
export type ProgramConfiguration = Record<string, string[]>; // workoutTemplateId -> exerciseIds[]

// Category types based on the schema
export type ProgramCategory = 'Minimalist' | 'Essentialist' | 'Maximalist';

// Exercise limits per category
const EXERCISE_LIMITS: Record<ProgramCategory, { min: number; max: number }> = {
  'Minimalist': { min: 3, max: 4 },
  'Essentialist': { min: 4, max: 6 },
  'Maximalist': { min: 6, max: 8 },
};

export interface ProgramBuilderState {
  // Core data
  program: TrainingProgram | null;
  exercises: TrainingExercise[];
  
  // User selections
  selectedCategory: ProgramCategory;
  configuration: ProgramConfiguration;
  
  // UI state
  isLoading: boolean;
  isSaving: boolean;
  
  // Actions
  setProgram: (program: TrainingProgram) => void;
  setExercises: (exercises: TrainingExercise[]) => void;
  setSelectedCategory: (category: ProgramCategory) => void;
  setWorkoutExercises: (workoutTemplateId: string, exerciseIds: string[]) => void;
  toggleExerciseForWorkout: (workoutTemplateId: string, exerciseId: string) => void;
  setIsLoading: (loading: boolean) => void;
  setIsSaving: (saving: boolean) => void;
  resetConfiguration: () => void;
  
  // Computed selectors
  getFilteredExercises: () => TrainingExercise[];
  getMuscleGroupVolumes: () => MuscleGroupVolume[];
  getMissingMuscleGroups: () => MissingMuscleGroup[];
  getExercisesForWorkout: (workoutTemplateId: string) => TrainingExercise[];
  isWorkoutValid: (workoutTemplateId: string) => boolean;
  canAddMoreExercises: (workoutTemplateId: string) => boolean;
  getTotalSelectedExercisesCount: (workoutTemplateId: string) => number;
}

const useProgramBuilderStore = create<ProgramBuilderState>()(
  devtools(
    (set, get) => ({
      // Initial state
      program: null,
      exercises: [],
      selectedCategory: 'Essentialist',
      configuration: {},
      isLoading: false,
      isSaving: false,

      // Basic setters
      setProgram: (program) => set({ program }),
      setExercises: (exercises) => set({ exercises }),
      setSelectedCategory: (category) => {
        set({ selectedCategory: category });
        // Reset configuration when category changes to prevent invalid states
        const state = get();
        const newConfiguration: ProgramConfiguration = {};
        
        // Clear all existing selections since category changed
        if (state.program) {
          state.program.workoutTemplates.forEach(template => {
            newConfiguration[template.id] = [];
          });
        }
        
        set({ configuration: newConfiguration });
      },
      setWorkoutExercises: (workoutTemplateId, exerciseIds) =>
        set((state) => ({
          configuration: {
            ...state.configuration,
            [workoutTemplateId]: exerciseIds,
          },
        })),
      toggleExerciseForWorkout: (workoutTemplateId, exerciseId) =>
        set((state) => {
          const currentExercises = state.configuration[workoutTemplateId] || [];
          const exerciseIndex = currentExercises.indexOf(exerciseId);
          
          let newExercises: string[];
          if (exerciseIndex >= 0) {
            // Remove exercise
            newExercises = currentExercises.filter(id => id !== exerciseId);
          } else {
            // Add exercise (check limits)
            const limits = EXERCISE_LIMITS[state.selectedCategory];
            if (currentExercises.length < limits.max) {
              newExercises = [...currentExercises, exerciseId];
            } else {
              // Don't add if at limit
              return state;
            }
          }
          
          return {
            configuration: {
              ...state.configuration,
              [workoutTemplateId]: newExercises,
            },
          };
        }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      setIsSaving: (saving) => set({ isSaving: saving }),
      resetConfiguration: () =>
        set((state) => {
          const newConfiguration: ProgramConfiguration = {};
          if (state.program) {
            state.program.workoutTemplates.forEach(template => {
              newConfiguration[template.id] = [];
            });
          }
          return { configuration: newConfiguration };
        }),

      // Computed selectors with memoization-like behavior
      getFilteredExercises: () => {
        const state = get();
        // For now, return all exercises - you can add filtering logic based on category
        // This could filter by exercise type, complexity, etc.
        return state.exercises;
      },

      getMuscleGroupVolumes: () => {
        const state = get();
        const volumes = new Map<string, { direct: number; indirect: number }>();
        
        // Initialize with 0 values for all muscle groups
        state.exercises.forEach(exercise => {
          if (!volumes.has(exercise.primaryMuscleGroup)) {
            volumes.set(exercise.primaryMuscleGroup, { direct: 0, indirect: 0 });
          }
          exercise.secondaryMuscleGroups.forEach(muscle => {
            if (!volumes.has(muscle)) {
              volumes.set(muscle, { direct: 0, indirect: 0 });
            }
          });
        });

        // Calculate volumes based on selected exercises
        Object.entries(state.configuration).forEach(([, exerciseIds]) => {
          exerciseIds.forEach(exerciseId => {
            const exercise = state.exercises.find(ex => ex.id === exerciseId);
            if (exercise) {
              // Assume each exercise contributes 1 set per selection
              // You can modify this logic based on your needs
              const currentPrimary = volumes.get(exercise.primaryMuscleGroup) || { direct: 0, indirect: 0 };
              volumes.set(exercise.primaryMuscleGroup, {
                ...currentPrimary,
                direct: currentPrimary.direct + 1,
              });

              exercise.secondaryMuscleGroups.forEach(muscle => {
                const currentSecondary = volumes.get(muscle) || { direct: 0, indirect: 0 };
                volumes.set(muscle, {
                  ...currentSecondary,
                  indirect: currentSecondary.indirect + 1,
                });
              });
            }
          });
        });

        return Array.from(volumes.entries()).map(([muscleGroup, volume]) => ({
          muscleGroup,
          directSets: volume.direct,
          indirectSets: volume.indirect,
          totalSets: volume.direct + volume.indirect,
        }));
      },

      getMissingMuscleGroups: () => {
        const state = get();
        const missing: MissingMuscleGroup[] = [];

        if (!state.program) return missing;

        state.program.workoutTemplates.forEach(template => {
          const selectedExercises = state.configuration[template.id] || [];
          const coveredMuscleGroups = new Set<string>();

          // Find which muscle groups are covered by selected exercises
          selectedExercises.forEach(exerciseId => {
            const exercise = state.exercises.find(ex => ex.id === exerciseId);
            if (exercise) {
              coveredMuscleGroups.add(exercise.primaryMuscleGroup);
              exercise.secondaryMuscleGroups.forEach(muscle => {
                coveredMuscleGroups.add(muscle);
              });
            }
          });

          // Check for missing required muscle groups
          const missingMuscleGroups = template.requiredMuscleGroups.filter(
            muscle => !coveredMuscleGroups.has(muscle)
          );

          if (missingMuscleGroups.length > 0) {
            missing.push({
              workoutTemplateId: template.id,
              workoutName: template.name.en || Object.values(template.name)[0] || 'Unknown Workout',
              missingMuscleGroups,
            });
          }
        });

        return missing;
      },

      getExercisesForWorkout: (workoutTemplateId) => {
        const state = get();
        const selectedExerciseIds = state.configuration[workoutTemplateId] || [];
        return state.exercises.filter(exercise => 
          selectedExerciseIds.includes(exercise.id)
        );
      },

      isWorkoutValid: (workoutTemplateId) => {
        const state = get();
        const selectedExercises = state.configuration[workoutTemplateId] || [];
        const limits = EXERCISE_LIMITS[state.selectedCategory];
        
        // Check if we have minimum required exercises
        if (selectedExercises.length < limits.min) {
          return false;
        }

        // Check if all required muscle groups are covered
        const template = state.program?.workoutTemplates.find(t => t.id === workoutTemplateId);
        if (!template) return false;

        const coveredMuscleGroups = new Set<string>();
        selectedExercises.forEach(exerciseId => {
          const exercise = state.exercises.find(ex => ex.id === exerciseId);
          if (exercise) {
            coveredMuscleGroups.add(exercise.primaryMuscleGroup);
            exercise.secondaryMuscleGroups.forEach(muscle => {
              coveredMuscleGroups.add(muscle);
            });
          }
        });

        return template.requiredMuscleGroups.every(muscle => 
          coveredMuscleGroups.has(muscle)
        );
      },

      canAddMoreExercises: (workoutTemplateId) => {
        const state = get();
        const selectedExercises = state.configuration[workoutTemplateId] || [];
        const limits = EXERCISE_LIMITS[state.selectedCategory];
        return selectedExercises.length < limits.max;
      },

      getTotalSelectedExercisesCount: (workoutTemplateId) => {
        const state = get();
        return (state.configuration[workoutTemplateId] || []).length;
      },
    }),
    {
      name: 'program-builder-store',
    }
  )
);

export default useProgramBuilderStore;