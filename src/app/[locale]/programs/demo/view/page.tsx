'use client';

import { useState } from 'react';
import { InteractiveProgramViewer, ExerciseSet, WorkoutSession, ProgramProgress } from '@/components/programs/interactive-program-viewer';

// Mock data for demonstration
const mockWorkouts: WorkoutSession[] = [
  {
    id: '1',
    name: 'Upper Body Power',
    description: 'Focus on compound movements for upper body strength and power',
    day: 1,
    week: 1,
    totalVolume: 1200,
    estimatedDuration: 60,
    targetMuscleGroups: ['Chest', 'Back', 'Shoulders', 'Arms'],
    isCompleted: false,
    exercises: [
      {
        id: 'ex1',
        name: 'Bench Press',
        description: 'Primary chest exercise for strength and mass',
        instructions: [
          'Lie flat on bench with feet firmly on floor',
          'Grip bar with hands slightly wider than shoulders',
          'Lower bar to chest with control',
          'Press up explosively while maintaining form'
        ],
        muscleGroups: ['Chest', 'Triceps', 'Anterior Deltoids'],
        equipment: ['Barbell', 'Bench'],
        difficulty: 'INTERMEDIATE',
        tips: [
          'Keep shoulder blades retracted',
          'Maintain slight arch in lower back',
          'Control the eccentric portion'
        ],
        commonMistakes: [
          'Bouncing bar off chest',
          'Flaring elbows too wide',
          'Not using full range of motion'
        ],
        estimatedDuration: 15,
        sets: [
          { id: 'set1', reps: '8-10', weight: 80, restPeriod: 180 },
          { id: 'set2', reps: '8-10', weight: 80, restPeriod: 180 },
          { id: 'set3', reps: '6-8', weight: 85, restPeriod: 180 },
          { id: 'set4', reps: '6-8', weight: 85, restPeriod: 180 }
        ]
      },
      {
        id: 'ex2', 
        name: 'Pull-ups',
        description: 'Bodyweight exercise for back and bicep development',
        instructions: [
          'Hang from bar with arms fully extended',
          'Engage core and pull body up',
          'Get chin over bar',
          'Lower with control to starting position'
        ],
        muscleGroups: ['Lats', 'Rhomboids', 'Biceps'],
        equipment: ['Pull-up Bar'],
        difficulty: 'INTERMEDIATE',
        tips: [
          'Avoid kipping or swinging',
          'Focus on pulling elbows down and back',
          'Full range of motion is key'
        ],
        commonMistakes: [
          'Not achieving full range of motion',
          'Using momentum to complete reps',
          'Neglecting the eccentric portion'
        ],
        estimatedDuration: 10,
        sets: [
          { id: 'set5', reps: 8, restPeriod: 150 },
          { id: 'set6', reps: 8, restPeriod: 150 },
          { id: 'set7', reps: '6-8', restPeriod: 150 }
        ]
      },
      {
        id: 'ex3',
        name: 'Overhead Press',
        description: 'Standing shoulder press for deltoid strength',
        instructions: [
          'Stand with feet shoulder-width apart',
          'Hold bar at shoulder level',
          'Press overhead in straight line',
          'Lower with control to starting position'
        ],
        muscleGroups: ['Shoulders', 'Triceps', 'Core'],
        equipment: ['Barbell'],
        difficulty: 'INTERMEDIATE',
        tips: [
          'Keep core tight throughout',
          'Don&apos;t arch back excessively',
          'Press in straight line over head'
        ],
        commonMistakes: [
          'Excessive back arch',
          'Pressing in front of head',
          'Not using full shoulder range'
        ],
        estimatedDuration: 12,
        sets: [
          { id: 'set8', reps: '8-10', weight: 50, restPeriod: 120 },
          { id: 'set9', reps: '8-10', weight: 50, restPeriod: 120 },
          { id: 'set10', reps: '6-8', weight: 52.5, restPeriod: 120 }
        ]
      }
    ]
  },
  {
    id: '2',
    name: 'Lower Body Power',
    description: 'Compound leg exercises for strength and muscle development',
    day: 2,
    week: 1,
    totalVolume: 1500,
    estimatedDuration: 70,
    targetMuscleGroups: ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves'],
    isCompleted: true,
    completedAt: new Date('2024-01-15'),
    userRating: 4,
    exercises: [
      {
        id: 'ex4',
        name: 'Back Squat',
        description: 'King of leg exercises for overall lower body development',
        instructions: [
          'Position bar on upper traps',
          'Stand with feet slightly wider than shoulders',
          'Descend by pushing hips back and down',
          'Drive through heels to return to standing'
        ],
        muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings'],
        equipment: ['Barbell', 'Squat Rack'],
        difficulty: 'INTERMEDIATE',
        tips: [
          'Keep chest up and core braced',
          'Track knees over toes',
          'Descend until thighs parallel to floor'
        ],
        commonMistakes: [
          'Knees caving inward',
          'Forward lean of torso',
          'Not reaching proper depth'
        ],
        estimatedDuration: 20,
        sets: [
          { 
            id: 'set11', 
            reps: '8-10', 
            weight: 100, 
            restPeriod: 240,
            isCompleted: true,
            actualReps: 9,
            actualWeight: 100,
            rpe: 7
          },
          { 
            id: 'set12', 
            reps: '8-10', 
            weight: 100, 
            restPeriod: 240,
            isCompleted: true,
            actualReps: 8,
            actualWeight: 100,
            rpe: 8
          },
          { 
            id: 'set13', 
            reps: '6-8', 
            weight: 105, 
            restPeriod: 240,
            isCompleted: true,
            actualReps: 7,
            actualWeight: 105,
            rpe: 8
          }
        ]
      }
    ]
  }
];

const mockProgress: ProgramProgress = {
  totalWorkouts: 16,
  completedWorkouts: 3,
  currentWeek: 2,
  totalWeeks: 8,
  totalVolume: 12000,
  completedVolume: 3200,
  streakDays: 7,
  lastWorkoutDate: new Date('2024-01-15')
};

export default function InteractiveProgramViewerPage() {
  const [workouts, setWorkouts] = useState<WorkoutSession[]>(mockWorkouts);
  const [progress, setProgress] = useState<ProgramProgress>(mockProgress);

  const handleUpdateProgress = (workoutId: string, exerciseId: string, setId: string, data: Partial<ExerciseSet>) => {
    setWorkouts(prev => prev.map(workout => 
      workout.id === workoutId 
        ? {
            ...workout,
            exercises: workout.exercises.map(exercise =>
              exercise.id === exerciseId
                ? {
                    ...exercise,
                    sets: exercise.sets.map(set =>
                      set.id === setId
                        ? { ...set, ...data }
                        : set
                    )
                  }
                : exercise
            )
          }
        : workout
    ));
  };

  const handleCompleteWorkout = (workoutId: string, rating: number, notes: string) => {
    setWorkouts(prev => prev.map(workout => 
      workout.id === workoutId
        ? {
            ...workout,
            isCompleted: true,
            completedAt: new Date(),
            userRating: rating,
            userNotes: notes
          }
        : workout
    ));

    setProgress(prev => ({
      ...prev,
      completedWorkouts: prev.completedWorkouts + 1,
      streakDays: prev.streakDays + 1,
      lastWorkoutDate: new Date()
    }));
  };

  const handleShareProgress = () => {
    // Mock share functionality
    console.log('Sharing progress:', progress);
    alert('Progress shared successfully!');
  };

  return (
    <InteractiveProgramViewer
      programName="Upper/Lower Power Split"
      programDescription="A comprehensive 8-week program designed to build strength and muscle through compound movements and progressive overload."
      workouts={workouts}
      progress={progress}
      onUpdateProgress={handleUpdateProgress}
      onCompleteWorkout={handleCompleteWorkout}
      onShareProgress={handleShareProgress}
    />
  );
}