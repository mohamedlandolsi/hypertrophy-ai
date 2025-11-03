/**
 * WorkoutStructureSelector Component - Usage Examples
 * 
 * This file demonstrates how to use the WorkoutStructureSelector component
 * in different scenarios within the training program builder flow.
 */

'use client';

import { useState } from 'react';
import WorkoutStructureSelector, { 
  type WorkoutStructureType 
} from './WorkoutStructureSelector';

/**
 * Example 1: Basic Usage - Upper/Lower Split
 * 
 * User has selected a 4-day Upper/Lower split.
 * Component helps them choose between Repeating, A/B, or A/B/C structure.
 */
export function UpperLowerExample() {
  const [selectedStructure, setSelectedStructure] = useState<WorkoutStructureType>();

  const splitStructure = {
    daysPerWeek: 4,
    pattern: 'Upper/Lower/Upper/Lower',
    workoutTypes: ['Upper', 'Lower']
  };

  const handleSelect = (type: WorkoutStructureType) => {
    setSelectedStructure(type);
    console.log('Selected structure:', type);
    
    // In a real app, you'd navigate to workout builder or save this choice
    // Example outcomes:
    // - REPEATING: Create 2 workouts (Upper, Lower)
    // - AB: Create 4 workouts (Upper A, Upper B, Lower A, Lower B)
    // - ABC: Create 6 workouts (Upper A, Upper B, Upper C, Lower A, Lower B, Lower C)
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Configure Your Upper/Lower Program</h2>
      <WorkoutStructureSelector
        splitStructure={splitStructure}
        selectedType={selectedStructure}
        onSelect={handleSelect}
      />
    </div>
  );
}

/**
 * Example 2: Push/Pull/Legs Split
 * 
 * User has selected a 6-day PPL split.
 * This will create more workouts based on the structure type.
 */
export function PushPullLegsExample() {
  const [selectedStructure, setSelectedStructure] = useState<WorkoutStructureType>('AB');

  const splitStructure = {
    daysPerWeek: 6,
    pattern: 'Push/Pull/Legs/Push/Pull/Legs',
    workoutTypes: ['Push', 'Pull', 'Legs']
  };

  const handleSelect = (type: WorkoutStructureType) => {
    setSelectedStructure(type);
    
    // Example outcomes for PPL:
    // - REPEATING: 3 workouts (Push, Pull, Legs)
    // - AB: 6 workouts (Push A, Push B, Pull A, Pull B, Legs A, Legs B)
    // - ABC: 9 workouts (Push A/B/C, Pull A/B/C, Legs A/B/C)
  };

  return (
    <WorkoutStructureSelector
      splitStructure={splitStructure}
      selectedType={selectedStructure}
      onSelect={handleSelect}
    />
  );
}

/**
 * Example 3: Full Body Split
 * 
 * User has selected a 3-day full body split.
 * Simpler case with fewer workout variations.
 */
export function FullBodyExample() {
  const [selectedStructure, setSelectedStructure] = useState<WorkoutStructureType>();

  const splitStructure = {
    daysPerWeek: 3,
    pattern: 'Full Body',
    workoutTypes: ['Full Body']
  };

  const handleSelect = (type: WorkoutStructureType) => {
    setSelectedStructure(type);
    
    // Example outcomes:
    // - REPEATING: 1 workout (Full Body)
    // - AB: 2 workouts (Full Body A, Full Body B)
    // - ABC: 3 workouts (Full Body A, Full Body B, Full Body C)
  };

  return (
    <WorkoutStructureSelector
      splitStructure={splitStructure}
      selectedType={selectedStructure}
      onSelect={handleSelect}
    />
  );
}

/**
 * Example 4: In a Multi-Step Wizard
 * 
 * This shows how to integrate WorkoutStructureSelector into a
 * multi-step program creation flow.
 */
export function ProgramWizardExample() {
  const [step, setStep] = useState(1);
  const [selectedStructure, setSelectedStructure] = useState<WorkoutStructureType>();

  // Assume user selected this split in step 1
  const splitStructure = {
    daysPerWeek: 4,
    pattern: 'Upper/Lower',
    workoutTypes: ['Upper', 'Lower']
  };

  const handleStructureSelect = (type: WorkoutStructureType) => {
    setSelectedStructure(type);
  };

  const handleNext = () => {
    if (!selectedStructure) {
      alert('Please select a workout structure');
      return;
    }

    // Calculate how many workouts need to be created
    const workoutCounts = {
      REPEATING: 2,
      AB: 4,
      ABC: 6
    };

    const workoutCount = workoutCounts[selectedStructure];
    console.log(`Moving to step 3: Create ${workoutCount} workouts`);
    
    // Navigate to workout builder
    setStep(3);
  };

  if (step !== 2) return null;

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2">
        <div className="h-2 w-2 rounded-full bg-green-500" />
        <div className="h-2 w-2 rounded-full bg-blue-500" />
        <div className="h-2 w-2 rounded-full bg-gray-300" />
      </div>

      <WorkoutStructureSelector
        splitStructure={splitStructure}
        selectedType={selectedStructure}
        onSelect={handleStructureSelect}
      />

      {/* Navigation buttons */}
      <div className="flex justify-between pt-6">
        <button
          onClick={() => setStep(1)}
          className="px-4 py-2 border rounded-md"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!selectedStructure}
          className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
        >
          Next: Configure Workouts
        </button>
      </div>
    </div>
  );
}

/**
 * Example 5: With Pre-Selected Value (Edit Mode)
 * 
 * When user is editing an existing program, show the currently
 * selected structure type.
 */
export function EditProgramExample() {
  // User's existing program has AB structure
  const [selectedStructure, setSelectedStructure] = useState<WorkoutStructureType>('AB');

  const splitStructure = {
    daysPerWeek: 5,
    pattern: 'Upper/Lower/Push/Pull/Legs',
    workoutTypes: ['Upper', 'Lower', 'Push', 'Pull', 'Legs']
  };

  const handleSelect = (type: WorkoutStructureType) => {
    // Warn user if they're changing structure type
    if (type !== selectedStructure) {
      const confirmed = confirm(
        'Changing the workout structure will affect your existing workouts. Continue?'
      );
      if (confirmed) {
        setSelectedStructure(type);
      }
    }
  };

  return (
    <WorkoutStructureSelector
      splitStructure={splitStructure}
      selectedType={selectedStructure}
      onSelect={handleSelect}
    />
  );
}

/**
 * Example 6: Integration with Form State
 * 
 * Shows how to use WorkoutStructureSelector with form management
 * libraries like react-hook-form or formik.
 */
export function FormIntegrationExample() {
  const [formData, setFormData] = useState({
    programName: '',
    splitStructure: {
      daysPerWeek: 4,
      pattern: 'Upper/Lower',
      workoutTypes: ['Upper', 'Lower']
    },
    workoutStructureType: undefined as WorkoutStructureType | undefined
  });

  const handleStructureSelect = (type: WorkoutStructureType) => {
    setFormData(prev => ({
      ...prev,
      workoutStructureType: type
    }));
  };

  const handleSubmit = () => {
    if (!formData.workoutStructureType) {
      alert('Please select a workout structure');
      return;
    }

    console.log('Submitting form:', formData);
    // API call to save program configuration
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      <div className="space-y-6">
        <input
          type="text"
          value={formData.programName}
          onChange={(e) => setFormData(prev => ({ ...prev, programName: e.target.value }))}
          placeholder="Program Name"
          className="w-full px-4 py-2 border rounded-md"
        />

        <WorkoutStructureSelector
          splitStructure={formData.splitStructure}
          selectedType={formData.workoutStructureType}
          onSelect={handleStructureSelect}
        />

        <button
          type="submit"
          disabled={!formData.workoutStructureType}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
        >
          Create Program
        </button>
      </div>
    </form>
  );
}

/**
 * Helper function to calculate workout names based on structure type
 * This can be used after structure selection to generate workout templates
 */
export function generateWorkoutNames(
  workoutTypes: string[],
  structureType: WorkoutStructureType
): string[] {
  switch (structureType) {
    case 'REPEATING':
      return workoutTypes;
    
    case 'AB':
      return [
        ...workoutTypes.map(type => `${type} A`),
        ...workoutTypes.map(type => `${type} B`)
      ];
    
    case 'ABC':
      return [
        ...workoutTypes.map(type => `${type} A`),
        ...workoutTypes.map(type => `${type} B`),
        ...workoutTypes.map(type => `${type} C`)
      ];
  }
}

// Example usage of helper function:
// const workoutNames = generateWorkoutNames(['Upper', 'Lower'], 'AB');
// Result: ['Upper A', 'Upper B', 'Lower A', 'Lower B']
