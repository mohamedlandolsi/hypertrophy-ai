/**
 * WorkoutEditor Component - Usage Examples
 * 
 * This file demonstrates how to use the comprehensive WorkoutEditor component
 * for creating and customizing training workouts.
 */

'use client';

import { useState } from 'react';
import WorkoutEditor from './WorkoutEditor';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

/**
 * Example 1: Basic Usage
 * 
 * Simple integration of WorkoutEditor within a page.
 */
export function BasicWorkoutEditorExample() {
  const programId = 'example-program-id';
  const workoutId = 'example-workout-id';

  return (
    <div className="container mx-auto py-8">
      <WorkoutEditor
        workoutId={workoutId}
        programId={programId}
        onSave={() => console.log('Workout saved!')}
        onPreview={() => console.log('Preview clicked')}
      />
    </div>
  );
}

/**
 * Example 2: With Navigation
 * 
 * Shows how to integrate WorkoutEditor with Next.js routing.
 */
export function WorkoutEditorWithNavigation({ 
  programId, 
  workoutId 
}: { 
  programId: string; 
  workoutId: string;
}) {
  const router = useRouter();

  const handleSave = () => {
    console.log('Workout saved');
    // Navigate back to program overview
    router.push(`/programs/${programId}`);
  };

  const handlePreview = () => {
    // Navigate to preview page
    router.push(`/programs/${programId}/preview`);
  };

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
        >
          ← Back
        </Button>
      </div>

      <WorkoutEditor
        workoutId={workoutId}
        programId={programId}
        onSave={handleSave}
        onPreview={handlePreview}
      />
    </div>
  );
}

/**
 * Example 3: In a Multi-Workout Program Builder
 * 
 * Managing multiple workouts in a program with tabs or navigation.
 */
export function MultiWorkoutProgramBuilder({
  programId
}: {
  programId: string;
}) {
  const [workouts] = useState([
    { id: 'workout-1', name: 'Upper A', type: 'Upper' },
    { id: 'workout-2', name: 'Lower A', type: 'Lower' },
    { id: 'workout-3', name: 'Upper B', type: 'Upper' },
    { id: 'workout-4', name: 'Lower B', type: 'Lower' }
  ]);
  
  const [currentWorkoutIndex, setCurrentWorkoutIndex] = useState(0);
  const currentWorkout = workouts[currentWorkoutIndex];

  const handleNext = () => {
    if (currentWorkoutIndex < workouts.length - 1) {
      setCurrentWorkoutIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentWorkoutIndex > 0) {
      setCurrentWorkoutIndex(prev => prev - 1);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      {/* Progress Indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold">
            Configure Workout {currentWorkoutIndex + 1} of {workouts.length}
          </h2>
          <div className="flex gap-2">
            {workouts.map((workout, idx) => (
              <button
                key={workout.id}
                onClick={() => setCurrentWorkoutIndex(idx)}
                className={`h-2 w-12 rounded-full transition-colors ${
                  idx === currentWorkoutIndex 
                    ? 'bg-primary' 
                    : idx < currentWorkoutIndex 
                    ? 'bg-green-500' 
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Workout Editor */}
      <WorkoutEditor
        key={currentWorkout.id}
        workoutId={currentWorkout.id}
        programId={programId}
        onSave={() => console.log(`Saved ${currentWorkout.name}`)}
      />

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentWorkoutIndex === 0}
        >
          ← Previous Workout
        </Button>
        <Button
          onClick={handleNext}
          disabled={currentWorkoutIndex === workouts.length - 1}
        >
          Next Workout →
        </Button>
      </div>
    </div>
  );
}

/**
 * Example 4: With Validation Before Navigation
 * 
 * Warns users if they try to leave with unsaved changes.
 */
export function WorkoutEditorWithValidation({
  programId,
  workoutId
}: {
  programId: string;
  workoutId: string;
}) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const router = useRouter();

  const handleSave = () => {
    setHasUnsavedChanges(false);
    console.log('Changes saved');
  };

  const handleExit = () => {
    if (hasUnsavedChanges) {
      const confirmed = confirm(
        'You have unsaved changes. Are you sure you want to leave?'
      );
      if (!confirmed) return;
    }
    router.push(`/programs/${programId}`);
  };

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" onClick={handleExit}>
          ← Back to Program
        </Button>
        {hasUnsavedChanges && (
          <span className="text-sm text-orange-600">
            • Unsaved changes
          </span>
        )}
      </div>

      <WorkoutEditor
        workoutId={workoutId}
        programId={programId}
        onSave={handleSave}
      />
    </div>
  );
}

/**
 * Example 5: Integration with Form State
 * 
 * Managing workout editor state within a larger form context.
 */
export function WorkoutEditorInFormContext({
  programId
}: {
  programId: string;
}) {
  const [formState, setFormState] = useState({
    programName: '',
    programDescription: '',
    workouts: [
      { id: 'w1', name: 'Upper Body', configured: false },
      { id: 'w2', name: 'Lower Body', configured: false }
    ]
  });

  const [currentWorkout, setCurrentWorkout] = useState<string | null>(null);

  const handleWorkoutSave = (workoutId: string) => {
    setFormState(prev => ({
      ...prev,
      workouts: prev.workouts.map(w =>
        w.id === workoutId ? { ...w, configured: true } : w
      )
    }));
    setCurrentWorkout(null);
    console.log('Workout configured:', workoutId);
  };

  const handleSubmitProgram = async () => {
    const allConfigured = formState.workouts.every(w => w.configured);
    
    if (!allConfigured) {
      alert('Please configure all workouts before submitting');
      return;
    }

    console.log('Submitting program:', formState);
    // Submit to API
  };

  if (currentWorkout) {
    return (
      <div className="container mx-auto py-8 max-w-7xl">
        <Button 
          variant="ghost" 
          onClick={() => setCurrentWorkout(null)}
          className="mb-6"
        >
          ← Back to Program Setup
        </Button>

        <WorkoutEditor
          workoutId={currentWorkout}
          programId={programId}
          onSave={() => handleWorkoutSave(currentWorkout)}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Program Setup</h1>

      {/* Program Info */}
      <div className="space-y-4 mb-8">
        <input
          type="text"
          placeholder="Program Name"
          value={formState.programName}
          onChange={(e) => setFormState(prev => ({ 
            ...prev, 
            programName: e.target.value 
          }))}
          className="w-full px-4 py-2 border rounded-md"
        />
        <textarea
          placeholder="Program Description"
          value={formState.programDescription}
          onChange={(e) => setFormState(prev => ({ 
            ...prev, 
            programDescription: e.target.value 
          }))}
          className="w-full px-4 py-2 border rounded-md"
          rows={3}
        />
      </div>

      {/* Workouts Configuration */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Configure Workouts</h2>
        {formState.workouts.map(workout => (
          <div 
            key={workout.id}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className={`h-4 w-4 rounded-full ${
                workout.configured ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              <span className="font-medium">{workout.name}</span>
            </div>
            <Button onClick={() => setCurrentWorkout(workout.id)}>
              {workout.configured ? 'Edit' : 'Configure'} Workout
            </Button>
          </div>
        ))}
      </div>

      {/* Submit */}
      <div className="mt-8">
        <Button 
          onClick={handleSubmitProgram}
          className="w-full"
          size="lg"
        >
          Create Program
        </Button>
      </div>
    </div>
  );
}

/**
 * Example 6: Read-Only Preview Mode
 * 
 * Display workout without editing capabilities.
 */
export function WorkoutPreview() {
  // In a real implementation, you'd fetch the workout data
  // and display it without the editor functionality
  
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => window.history.back()}>
          ← Back
        </Button>
      </div>

      {/* 
        For preview, you might create a separate component
        or conditionally disable editing in WorkoutEditor
      */}
      <div className="bg-muted/50 p-6 rounded-lg">
        <p className="text-sm text-muted-foreground">
          Preview mode - Read-only view of the workout
        </p>
      </div>
    </div>
  );
}

/**
 * Helper Functions
 */

/**
 * Calculate total weekly volume for a muscle group across all workouts
 */
export function calculateWeeklyVolume(
  workouts: Array<{
    exercises: Array<{
      sets: number;
      exercise: {
        volumeContributions: Record<string, number>;
      };
    }>;
  }>,
  muscleGroup: string
): number {
  let totalVolume = 0;

  workouts.forEach(workout => {
    workout.exercises.forEach(we => {
      const contribution = we.exercise.volumeContributions[muscleGroup] || 0;
      totalVolume += we.sets * contribution;
    });
  });

  return totalVolume;
}

/**
 * Validate workout has minimum required exercises
 */
export function validateWorkout(workout: {
  exercises: Array<{ exercise: { targetMuscle: string } }>;
  type: string;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (workout.exercises.length === 0) {
    errors.push('Workout must have at least one exercise');
  }

  if (workout.exercises.length < 4) {
    errors.push('Workout should have at least 4 exercises for optimal results');
  }

  // Check for muscle group coverage based on workout type
  if (workout.type === 'Upper') {
    const hasChest = workout.exercises.some(e => 
      e.exercise.targetMuscle === 'Chest'
    );
    const hasBack = workout.exercises.some(e => 
      e.exercise.targetMuscle === 'Back'
    );

    if (!hasChest) errors.push('Upper workout should include chest exercises');
    if (!hasBack) errors.push('Upper workout should include back exercises');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Generate default workout template based on type
 */
export async function generateWorkoutTemplate(
  workoutType: string
): Promise<{
  exercises: Array<{
    exerciseId: string;
    sets: number;
    reps: number;
    order: number;
  }>;
}> {
  // This would fetch recommended exercises from the database
  // based on workout type and return a template
  
  console.log(`Generating template for ${workoutType}`);
  
  return {
    exercises: []
  };
}
