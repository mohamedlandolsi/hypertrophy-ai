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
  sessionCount?: number; // Number of sessions per week
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

// Enhanced volume tracking interfaces
export interface VolumeDistribution {
  muscleGroup: string;
  directSets: number;
  indirectSets: number;
  totalSets: number;
  weeklyFrequency: number;
  setsPerSession: number;
  volumeLoad: 'LOW' | 'MODERATE' | 'HIGH' | 'EXCESSIVE';
}

export interface WorkoutVolume {
  workoutTemplateId: string;
  workoutName: string;
  totalExercises: number;
  estimatedDuration: number; // in minutes
  muscleGroups: VolumeDistribution[];
  isComplete: boolean;
  completionScore: number; // 0-100
}

export interface WeeklyVolumeAnalysis {
  totalWorkouts: number;
  totalExercises: number;
  weeklyVolume: VolumeDistribution[];
  muscleGroupCoverage: {
    covered: string[];
    missing: string[];
    underTrained: string[]; // < 10 sets per week
    wellTrained: string[]; // 10-20 sets per week  
    overTrained: string[]; // > 20 sets per week
  };
  trainingBalance: {
    compoundRatio: number;
    isolationRatio: number;
    unilateralRatio: number;
  };
}

// Program scheduling interfaces
export interface ProgramSchedule {
  type: 'weekly' | 'cyclic';
  weeklyPattern?: WeeklySchedule;
  cyclicPattern?: CyclicSchedule;
}

export interface WeeklySchedule {
  selectedDays: number[]; // 0 = Sunday, 1 = Monday, etc.
  restDayPreference: 'distributed' | 'consecutive' | 'custom';
}

export interface CyclicSchedule {
  workoutDays: number;
  restDays: number;
  startDate?: Date;
}

// Configuration stores which exercises are selected for each workout template
export type ProgramConfiguration = Record<string, string[]>; // workoutTemplateId -> exerciseIds[]

// Category types based on the schema
export type ProgramCategory = 'MINIMALIST' | 'ESSENTIALIST' | 'MAXIMALIST';

// Exercise limits per category
const EXERCISE_LIMITS: Record<ProgramCategory, { min: number; max: number }> = {
  'MINIMALIST': { min: 3, max: 4 },
  'ESSENTIALIST': { min: 4, max: 6 },
  'MAXIMALIST': { min: 6, max: 8 },
};

export interface ProgramBuilderState {
  // Core data
  program: TrainingProgram | null;
  exercises: TrainingExercise[];
  
  // User selections
  selectedCategory: ProgramCategory;
  configuration: ProgramConfiguration;
  schedule: ProgramSchedule | null;
  
  // UI state
  isLoading: boolean;
  isSaving: boolean;
  
  // Actions
  setProgram: (program: TrainingProgram) => void;
  setExercises: (exercises: TrainingExercise[]) => void;
  setSelectedCategory: (category: ProgramCategory) => void;
  setWorkoutExercises: (workoutTemplateId: string, exerciseIds: string[]) => void;
  toggleExerciseForWorkout: (workoutTemplateId: string, exerciseId: string) => void;
  setSchedule: (schedule: ProgramSchedule | null) => void;
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
  
  // Enhanced volume calculations
  getWorkoutVolume: (workoutTemplateId: string) => WorkoutVolume;
  getWeeklyVolumeAnalysis: () => WeeklyVolumeAnalysis;
  getRecommendedSets: (exerciseType: string, muscleGroup: string) => number;
  getVolumeLoadClassification: (setsPerWeek: number, muscleGroup: string) => 'LOW' | 'MODERATE' | 'HIGH' | 'EXCESSIVE';
  calculateEstimatedDuration: (workoutTemplateId: string) => number;
}

const useProgramBuilderStore = create<ProgramBuilderState>()(
  devtools(
    (set, get) => ({
      // Initial state
      program: null,
      exercises: [],
      selectedCategory: 'ESSENTIALIST',
      configuration: {},
      schedule: null,
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
      setSchedule: (schedule) => set({ schedule }),
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

      // Enhanced volume calculation methods
      getRecommendedSets: (exerciseType, muscleGroup) => {
        const state = get();
        const category = state.selectedCategory;
        
        // Base recommendations by exercise type and category
        const baseRecommendations = {
          COMPOUND: { MINIMALIST: 4, ESSENTIALIST: 3, MAXIMALIST: 3 },
          ISOLATION: { MINIMALIST: 2, ESSENTIALIST: 3, MAXIMALIST: 4 },
          UNILATERAL: { MINIMALIST: 2, ESSENTIALIST: 3, MAXIMALIST: 3 }
        };

        // Muscle group modifiers (some muscles can handle more volume)
        const muscleModifiers: Record<string, number> = {
          CHEST: 1.0, BACK: 1.1, SHOULDERS: 0.9, BICEPS: 0.8, TRICEPS: 0.9,
          QUADRICEPS: 1.1, HAMSTRINGS: 1.0, GLUTES: 1.0, CALVES: 1.2,
          ABS: 1.3, FOREARMS: 0.7, ADDUCTORS: 0.8
        };

        const baseSets = baseRecommendations[exerciseType as keyof typeof baseRecommendations]?.[category] || 3;
        const modifier = muscleModifiers[muscleGroup] || 1.0;
        
        return Math.round(baseSets * modifier);
      },

      getVolumeLoadClassification: (setsPerWeek, muscleGroup) => {
        // Volume landmarks by muscle group (sets per week)
        const volumeLandmarks: Record<string, { low: number; moderate: number; high: number }> = {
          CHEST: { low: 8, moderate: 16, high: 22 },
          BACK: { low: 10, moderate: 18, high: 25 },
          SHOULDERS: { low: 8, moderate: 14, high: 20 },
          BICEPS: { low: 6, moderate: 12, high: 18 },
          TRICEPS: { low: 6, moderate: 12, high: 18 },
          QUADRICEPS: { low: 10, moderate: 16, high: 22 },
          HAMSTRINGS: { low: 8, moderate: 14, high: 20 },
          GLUTES: { low: 8, moderate: 16, high: 22 },
          CALVES: { low: 8, moderate: 16, high: 24 },
          ABS: { low: 6, moderate: 12, high: 20 },
          FOREARMS: { low: 4, moderate: 8, high: 14 },
          ADDUCTORS: { low: 4, moderate: 8, high: 14 }
        };

        const landmarks = volumeLandmarks[muscleGroup] || { low: 8, moderate: 14, high: 20 };
        
        if (setsPerWeek < landmarks.low) return 'LOW';
        if (setsPerWeek < landmarks.moderate) return 'MODERATE';
        if (setsPerWeek < landmarks.high) return 'HIGH';
        return 'EXCESSIVE';
      },

      calculateEstimatedDuration: (workoutTemplateId) => {
        const state = get();
        const selectedExerciseIds = state.configuration[workoutTemplateId] || [];
        const selectedExercises = state.exercises.filter(ex => selectedExerciseIds.includes(ex.id));
        
        let totalTime = 0;
        
        selectedExercises.forEach(exercise => {
          const sets = get().getRecommendedSets(exercise.type, exercise.primaryMuscleGroup);
          const timePerSet = exercise.type === 'COMPOUND' ? 4 : 3; // minutes per set including rest
          totalTime += sets * timePerSet;
        });

        // Add warm-up time
        totalTime += 10;
        
        return Math.round(totalTime);
      },

      getWorkoutVolume: (workoutTemplateId) => {
        const state = get();
        const program = state.program;
        const selectedExerciseIds = state.configuration[workoutTemplateId] || [];
        const selectedExercises = state.exercises.filter(ex => selectedExerciseIds.includes(ex.id));
        
        if (!program) {
          return {
            workoutTemplateId,
            workoutName: 'Unknown',
            totalExercises: 0,
            estimatedDuration: 0,
            muscleGroups: [],
            isComplete: false,
            completionScore: 0
          };
        }

        const workoutTemplate = program.workoutTemplates.find(wt => wt.id === workoutTemplateId);
        const workoutName = workoutTemplate?.name.en || 'Unknown Workout';
        const requiredMuscleGroups = workoutTemplate?.requiredMuscleGroups || [];
        
        // Calculate muscle group volumes
        const muscleGroupVolumes: Record<string, VolumeDistribution> = {};
        
        selectedExercises.forEach(exercise => {
          const sets = get().getRecommendedSets(exercise.type, exercise.primaryMuscleGroup);
          const primaryMuscle = exercise.primaryMuscleGroup;
          
          // Direct volume
          if (!muscleGroupVolumes[primaryMuscle]) {
            muscleGroupVolumes[primaryMuscle] = {
              muscleGroup: primaryMuscle,
              directSets: 0,
              indirectSets: 0,
              totalSets: 0,
              weeklyFrequency: program.sessionCount || 1,
              setsPerSession: 0,
              volumeLoad: 'LOW'
            };
          }
          muscleGroupVolumes[primaryMuscle].directSets += sets;
          
          // Indirect volume for secondary muscles
          exercise.secondaryMuscleGroups.forEach(secondaryMuscle => {
            if (!muscleGroupVolumes[secondaryMuscle]) {
              muscleGroupVolumes[secondaryMuscle] = {
                muscleGroup: secondaryMuscle,
                directSets: 0,
                indirectSets: 0,
                totalSets: 0,
                weeklyFrequency: program.sessionCount || 1,
                setsPerSession: 0,
                volumeLoad: 'LOW'
              };
            }
            muscleGroupVolumes[secondaryMuscle].indirectSets += sets * 0.5;
          });
        });

        // Calculate totals and classifications
        Object.values(muscleGroupVolumes).forEach(volume => {
          volume.totalSets = volume.directSets + volume.indirectSets;
          volume.setsPerSession = volume.totalSets;
          const weeklyVolume = volume.totalSets * volume.weeklyFrequency;
          volume.volumeLoad = get().getVolumeLoadClassification(weeklyVolume, volume.muscleGroup);
        });

        // Calculate completion score
        const coveredMuscles = Object.keys(muscleGroupVolumes).filter(muscle => 
          muscleGroupVolumes[muscle].totalSets > 0
        );
        const requiredCovered = requiredMuscleGroups.filter(muscle => 
          coveredMuscles.includes(muscle)
        ).length;
        
        const completionScore = requiredMuscleGroups.length > 0 
          ? Math.round((requiredCovered / requiredMuscleGroups.length) * 100)
          : selectedExercises.length > 0 ? 100 : 0;

        return {
          workoutTemplateId,
          workoutName,
          totalExercises: selectedExercises.length,
          estimatedDuration: get().calculateEstimatedDuration(workoutTemplateId),
          muscleGroups: Object.values(muscleGroupVolumes),
          isComplete: completionScore >= 100,
          completionScore
        };
      },

      getWeeklyVolumeAnalysis: () => {
        const state = get();
        const program = state.program;
        
        if (!program) {
          return {
            totalWorkouts: 0,
            totalExercises: 0,
            weeklyVolume: [],
            muscleGroupCoverage: {
              covered: [],
              missing: [],
              underTrained: [],
              wellTrained: [],
              overTrained: []
            },
            trainingBalance: {
              compoundRatio: 0,
              isolationRatio: 0,
              unilateralRatio: 0
            }
          };
        }

        // Aggregate volume from all workouts
        const weeklyMuscleVolumes: Record<string, VolumeDistribution> = {};
        let totalExercises = 0;
        let compoundCount = 0, isolationCount = 0, unilateralCount = 0;

        program.workoutTemplates.forEach(template => {
          const workoutVolume = get().getWorkoutVolume(template.id);
          totalExercises += workoutVolume.totalExercises;
          
          // Count exercise types
          const selectedExerciseIds = state.configuration[template.id] || [];
          const selectedExercises = state.exercises.filter(ex => selectedExerciseIds.includes(ex.id));
          selectedExercises.forEach(exercise => {
            if (exercise.type === 'COMPOUND') compoundCount++;
            else if (exercise.type === 'ISOLATION') isolationCount++;
            else if (exercise.type === 'UNILATERAL') unilateralCount++;
          });

          // Aggregate muscle volumes
          workoutVolume.muscleGroups.forEach(muscleVolume => {
            const muscle = muscleVolume.muscleGroup;
            if (!weeklyMuscleVolumes[muscle]) {
              weeklyMuscleVolumes[muscle] = {
                muscleGroup: muscle,
                directSets: 0,
                indirectSets: 0,
                totalSets: 0,
                weeklyFrequency: program.sessionCount || 1,
                setsPerSession: 0,
                volumeLoad: 'LOW'
              };
            }
            
            weeklyMuscleVolumes[muscle].directSets += muscleVolume.directSets;
            weeklyMuscleVolumes[muscle].indirectSets += muscleVolume.indirectSets;
          });
        });

        // Calculate final totals and classifications
        Object.values(weeklyMuscleVolumes).forEach(volume => {
          volume.totalSets = volume.directSets + volume.indirectSets;
          volume.setsPerSession = volume.totalSets / program.workoutTemplates.length;
          volume.volumeLoad = get().getVolumeLoadClassification(volume.totalSets, volume.muscleGroup);
        });

        // Categorize muscle groups by training status
        const allMuscleGroups = ['CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS', 'QUADRICEPS', 'HAMSTRINGS', 'GLUTES', 'CALVES'];
        const covered = Object.keys(weeklyMuscleVolumes).filter(muscle => weeklyMuscleVolumes[muscle].totalSets > 0);
        const missing = allMuscleGroups.filter(muscle => !covered.includes(muscle));
        const underTrained = covered.filter(muscle => weeklyMuscleVolumes[muscle].volumeLoad === 'LOW');
        const wellTrained = covered.filter(muscle => ['MODERATE', 'HIGH'].includes(weeklyMuscleVolumes[muscle].volumeLoad));
        const overTrained = covered.filter(muscle => weeklyMuscleVolumes[muscle].volumeLoad === 'EXCESSIVE');

        // Calculate training balance
        const totalExerciseCount = compoundCount + isolationCount + unilateralCount;
        const trainingBalance = {
          compoundRatio: totalExerciseCount > 0 ? Math.round((compoundCount / totalExerciseCount) * 100) : 0,
          isolationRatio: totalExerciseCount > 0 ? Math.round((isolationCount / totalExerciseCount) * 100) : 0,
          unilateralRatio: totalExerciseCount > 0 ? Math.round((unilateralCount / totalExerciseCount) * 100) : 0
        };

        return {
          totalWorkouts: program.workoutTemplates.length,
          totalExercises,
          weeklyVolume: Object.values(weeklyMuscleVolumes),
          muscleGroupCoverage: {
            covered,
            missing,
            underTrained,
            wellTrained,
            overTrained
          },
          trainingBalance
        };
      },
    }),
    {
      name: 'program-builder-store',
    }
  )
);

export default useProgramBuilderStore;