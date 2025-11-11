/**
 * Example usage of SplitSelector component
 * 
 * This file demonstrates how to integrate the SplitSelector component
 * into your program creation/customization flow.
 */

import { useState, useEffect } from 'react';
import SplitSelector, { type SplitSelectorData } from '@/components/SplitSelector';

// Example 1: New Program Creation
function CreateProgramPage() {
  const handleComplete = async (data: SplitSelectorData) => {
    if (process.env.NODE_ENV === 'development') { console.log('User selections:', data); }
    
    // Save to database
    const response = await fetch('/api/programs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        splitId: data.splitId,
        structureId: data.structureId,
        customDayAssignments: data.customDayAssignments,
        // ... other program fields
      })
    });
    
    if (response.ok) {
      const program = await response.json();
      // Navigate to next step or program page
      window.location.href = `/programs/${program.id}`;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Create Your Training Program</h1>
      <SplitSelector onComplete={handleComplete} />
    </div>
  );
}

// Example 2: Edit Existing Program
function EditProgramPage({ programId }: { programId: string }) {
  const [existingData, setExistingData] = useState<SplitSelectorData | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch existing program data
    fetch(`/api/programs/${programId}`)
      .then(res => res.json())
      .then(program => {
        setExistingData({
          splitId: program.splitId,
          structureId: program.structureId,
          customDayAssignments: program.customDayAssignments || undefined
        });
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to load program:', error);
        setLoading(false);
      });
  }, [programId]);

  const handleComplete = async (data: SplitSelectorData) => {
    // Update existing program
    const response = await fetch(`/api/programs/${programId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      // Navigate back or show success message
      window.location.href = `/programs/${programId}`;
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Edit Training Program</h1>
      <SplitSelector 
        onComplete={handleComplete} 
        existingData={existingData}
      />
    </div>
  );
}

// Example 3: Multi-step Form Integration
function ProgramWizard() {
  const [currentPhase, setCurrentPhase] = useState<'split' | 'details' | 'exercises'>('split');
  const [splitData, setSplitData] = useState<SplitSelectorData | null>(null);

  const handleSplitComplete = (data: SplitSelectorData) => {
    setSplitData(data);
    setCurrentPhase('details');
  };

  return (
    <div className="container mx-auto py-8">
      {currentPhase === 'split' && (
        <SplitSelector onComplete={handleSplitComplete} />
      )}
      
      {currentPhase === 'details' && splitData && (
        <div>
          {/* Placeholder for ProgramDetailsForm */}
          <p>Program details form would go here</p>
          <button onClick={() => setCurrentPhase('exercises')}>
            Next
          </button>
        </div>
      )}
      
      {currentPhase === 'exercises' && splitData && (
        <div>
          {/* Placeholder for ExerciseSelectionForm */}
          <p>Exercise selection form would go here</p>
          <button onClick={() => console.log('Final submit', splitData)}>
            Complete
          </button>
        </div>
      )}
    </div>
  );
}

// Example 4: With Custom Validation
function AdvancedProgramBuilder() {
  const handleComplete = (data: SplitSelectorData) => {
    // Custom validation before saving
    if (!validateUserEligibility(data)) {
      alert('You need a PRO subscription for this split');
      return;
    }
    
    if (!validateScheduleConflicts(data)) {
      alert('This schedule conflicts with your existing programs');
      return;
    }
    
    // Proceed with save
    saveProgram(data);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const validateUserEligibility = (_data: SplitSelectorData) => {
    // Check user's subscription level
    return true;
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const validateScheduleConflicts = (_data: SplitSelectorData) => {
    // Check for overlapping programs
    return true;
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const saveProgram = async (_data: SplitSelectorData) => {
    // Save logic here
  };

  return <SplitSelector onComplete={handleComplete} />;
}

export { CreateProgramPage, EditProgramPage, ProgramWizard, AdvancedProgramBuilder };
