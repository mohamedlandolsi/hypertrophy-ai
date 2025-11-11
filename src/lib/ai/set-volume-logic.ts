/**
 * SET VOLUME DISTRIBUTION LOGIC
 * 
 * Implements the requirements for set volume distribution:
 * - 72h frequency (Upper/Lower): 2-4 sets per muscle group per session
 * - 48h frequency (Full Body): 1-3 sets per muscle group per session
 * - Maximum ~20 total sets per session
 * - Distribute sets across multiple exercises for same muscle
 */

export interface ExerciseRecommendation {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  notes: string;
  muscleGroup: string;
}

export interface SetVolumeDistribution {
  totalSets: number;
  muscleGroupSets: Record<string, number>;
  exerciseDistribution: ExerciseRecommendation[];
  warnings: string[];
}

/**
 * Calculate set volume distribution based on training frequency and muscle groups
 */
export function calculateSetVolumeDistribution(
  exercises: Array<{
    name: string;
    muscleGroup: string;
    isCompound?: boolean;
  }>,
  trainingFrequency: '48h' | '72h' = '72h', // Default to Upper/Lower split
  sessionType: 'upper' | 'lower' | 'full_body' | 'push' | 'pull' | 'legs' = 'upper'
): SetVolumeDistribution {
  
  // Set volume limits based on frequency
  const volumeLimits = {
    '72h': { min: 2, max: 4 }, // Upper/Lower split
    '48h': { min: 1, max: 3 }  // Full body split
  };
  
  const limits = volumeLimits[trainingFrequency];
  const warnings: string[] = [];
  
  // Log session type for context
  if (process.env.NODE_ENV === 'development') { console.log(`Calculating set volume for ${sessionType} session with ${trainingFrequency} frequency`); }
  
  // Group exercises by muscle group
  const muscleGroupExercises: Record<string, string[]> = {};
  exercises.forEach(exercise => {
    if (!muscleGroupExercises[exercise.muscleGroup]) {
      muscleGroupExercises[exercise.muscleGroup] = [];
    }
    muscleGroupExercises[exercise.muscleGroup].push(exercise.name);
  });
  
  // Calculate sets per muscle group
  const muscleGroupSets: Record<string, number> = {};
  let totalSets = 0;
  
  Object.keys(muscleGroupExercises).forEach(muscleGroup => {
    const exerciseCount = muscleGroupExercises[muscleGroup].length;
    
    // Distribute sets within the range
    if (exerciseCount === 1) {
      // Single exercise gets the target number of sets
      muscleGroupSets[muscleGroup] = limits.max;
    } else if (exerciseCount === 2) {
      // Two exercises: distribute as 2+1 or 2+2 to stay in range
      muscleGroupSets[muscleGroup] = limits.max;
    } else {
      // Multiple exercises: aim for middle of range
      muscleGroupSets[muscleGroup] = Math.ceil((limits.min + limits.max) / 2);
    }
    
    totalSets += muscleGroupSets[muscleGroup];
  });
  
  // Check session limit
  if (totalSets > 20) {
    warnings.push(`Session exceeds recommended 20 sets (current: ${totalSets}). Consider reducing exercises or sets.`);
  }
  
  // Distribute sets across exercises within each muscle group
  const exerciseDistribution: ExerciseRecommendation[] = [];
  
  Object.entries(muscleGroupExercises).forEach(([muscleGroup, exerciseNames]) => {
    const totalSetsForMuscle = muscleGroupSets[muscleGroup];
    const exerciseCount = exerciseNames.length;
    
    exerciseNames.forEach((exerciseName, index) => {
      let sets: number;
      
      if (exerciseCount === 1) {
        sets = totalSetsForMuscle;
      } else if (exerciseCount === 2) {
        // First exercise gets more sets if odd total
        sets = index === 0 ? Math.ceil(totalSetsForMuscle / 2) : Math.floor(totalSetsForMuscle / 2);
      } else {
        // Distribute evenly, giving extra to first exercises if needed
        const baseSets = Math.floor(totalSetsForMuscle / exerciseCount);
        const extraSets = totalSetsForMuscle % exerciseCount;
        sets = baseSets + (index < extraSets ? 1 : 0);
      }
      
      // Ensure minimum of 1 set per exercise
      sets = Math.max(1, sets);
      
      exerciseDistribution.push({
        name: exerciseName,
        sets,
        reps: '5-10', // From KB: optimal hypertrophy range
        rest: sets > 1 ? '2-5 min' : '1-3 min', // Compound vs isolation rest
        notes: `Take to 0-2 RIR (close to failure)`,
        muscleGroup
      });
    });
  });
  
  // Validate distribution
  if (exerciseDistribution.some(ex => ex.sets < 1)) {
    warnings.push('Some exercises assigned less than 1 set. Adjust exercise selection.');
  }
  
  return {
    totalSets,
    muscleGroupSets,
    exerciseDistribution,
    warnings
  };
}

/**
 * Format workout table according to requirements
 */
export function formatWorkoutTable(distribution: SetVolumeDistribution): string {
  let table = `
| Exercise | Sets | Reps | Rest | Notes |
|----------|------|------|------|-------|
`;
  
  distribution.exerciseDistribution.forEach(exercise => {
    table += `| ${exercise.name} | ${exercise.sets} | ${exercise.reps} | ${exercise.rest} | ${exercise.notes} |\n`;
  });
  
  // Add summary
  table += `\n**Session Summary:**\n`;
  table += `- Total Sets: ${distribution.totalSets}\n`;
  table += `- Muscle Groups: ${Object.keys(distribution.muscleGroupSets).join(', ')}\n`;
  
  Object.entries(distribution.muscleGroupSets).forEach(([muscle, sets]) => {
    table += `- ${muscle}: ${sets} sets\n`;
  });
  
  if (distribution.warnings.length > 0) {
    table += `\n**⚠️ Recommendations:**\n`;
    distribution.warnings.forEach(warning => {
      table += `- ${warning}\n`;
    });
  }
  
  return table;
}

/**
 * Example usage for testing
 */
export function demonstrateSetVolumeLogic() {
  const upperBodyExercises = [
    { name: 'Chest Press Machine', muscleGroup: 'chest', isCompound: true },
    { name: 'Incline Dumbbell Press', muscleGroup: 'chest' },
    { name: 'Lat Pulldown', muscleGroup: 'back', isCompound: true },
    { name: 'Cable Row', muscleGroup: 'back' },
    { name: 'Shoulder Press Machine', muscleGroup: 'shoulders' },
    { name: 'Dumbbell Bicep Curls', muscleGroup: 'biceps' },
    { name: 'Cable Tricep Pushdowns', muscleGroup: 'triceps' }
  ];
  
  const distribution = calculateSetVolumeDistribution(upperBodyExercises, '72h', 'upper');
  const formattedTable = formatWorkoutTable(distribution);
  
  if (process.env.NODE_ENV === 'development') { console.log('🏋️ Example Upper Body Workout (72h frequency):'); }
  if (process.env.NODE_ENV === 'development') { console.log(formattedTable); }
  
  return { distribution, formattedTable };
}