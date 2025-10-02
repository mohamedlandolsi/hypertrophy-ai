'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings,
  Layers,
  Dumbbell,
  Save,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

// Muscle group definitions (matching admin form)
const MUSCLE_GROUPS = [
  { id: 'chest', name: 'Chest', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200' },
  // Back muscles
  { id: 'lats', name: 'Lats', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200' },
  { id: 'trapezius_rhomboids', name: 'Trapezius & Rhomboids', color: 'bg-sky-100 text-sky-800 dark:bg-sky-900/20 dark:text-sky-200' },
  // Shoulder muscles (separated by head)
  { id: 'front_delts', name: 'Front Delts', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200' },
  { id: 'side_delts', name: 'Side Delts', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200' },
  { id: 'rear_delts', name: 'Rear Delts', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200' },
  // Arm muscles
  { id: 'elbow_flexors', name: 'Elbow Flexors (Biceps, Brachialis, Brachioradialis)', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' },
  { id: 'triceps', name: 'Triceps', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200' },
  // Forearm muscles (separated by function)
  { id: 'wrist_flexors', name: 'Wrist Flexors', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-200' },
  { id: 'wrist_extensors', name: 'Wrist Extensors', color: 'bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-200' },
  // Lower body
  { id: 'glutes', name: 'Glutes', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-200' },
  { id: 'quadriceps', name: 'Quadriceps', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200' },
  { id: 'hamstrings', name: 'Hamstrings', color: 'bg-violet-100 text-violet-800 dark:bg-violet-900/20 dark:text-violet-200' },
  { id: 'adductors', name: 'Adductors', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-200' },
  { id: 'calves', name: 'Calves', color: 'bg-blue-200 text-blue-900 dark:bg-blue-900/20 dark:text-blue-200' },
  // Core
  { id: 'abs', name: 'Abs', color: 'bg-lime-100 text-lime-800 dark:bg-lime-900/20 dark:text-lime-200' },
  { id: 'obliques', name: 'Obliques', color: 'bg-yellow-200 text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-200' },
  // Additional
  { id: 'erectors', name: 'Erectors', color: 'bg-cyan-200 text-cyan-900 dark:bg-cyan-900/20 dark:text-cyan-200' },
  { id: 'hip_flexors', name: 'Hip Flexors', color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/20 dark:text-rose-200' }
];

// Helper function to get muscle group display info
function getMuscleGroupInfo(muscleGroupId: string) {
  return MUSCLE_GROUPS.find(mg => mg.id === muscleGroupId) || {
    id: muscleGroupId,
    name: muscleGroupId.charAt(0).toUpperCase() + muscleGroupId.slice(1).replace(/_/g, ' '),
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200'
  };
}

// Helper function to filter valid muscle groups
function filterValidMuscleGroups(muscleGroups: string[]): string[] {
  const validIds = MUSCLE_GROUPS.map(mg => mg.id);
  return muscleGroups.filter(mg => validIds.includes(mg));
}

// Mapping from detailed muscle groups (workout templates) to simplified muscle groups (Exercise enum)
const muscleGroupMapping: Record<string, string[]> = {
  // Chest
  'chest': ['CHEST'],
  
  // Back muscles (separated anatomically)
  'lats': ['LATS'],
  'trapezius': ['TRAPEZIUS'],
  'rhomboids': ['RHOMBOIDS'],
  // Legacy mappings for backward compatibility
  'back': ['LATS', 'TRAPEZIUS', 'RHOMBOIDS'],
  'upper_back': ['TRAPEZIUS', 'RHOMBOIDS'],
  
  // Shoulder muscles (separated by head)
  'front_delts': ['FRONT_DELTS'],
  'side_delts': ['SIDE_DELTS'],
  'rear_delts': ['REAR_DELTS'],
  // Legacy mappings for backward compatibility
  'shoulders': ['FRONT_DELTS', 'SIDE_DELTS', 'REAR_DELTS'],
  
  // Arm muscles
  'elbow_flexors': ['ELBOW_FLEXORS'], // Biceps, brachialis, brachioradialis
  'triceps': ['TRICEPS'],
  // Legacy mappings for backward compatibility
  'arms': ['ELBOW_FLEXORS', 'TRICEPS'],
  'biceps': ['ELBOW_FLEXORS'],
  
  // Forearm muscles (separated by function)
  'wrist_flexors': ['WRIST_FLEXORS'],
  'wrist_extensors': ['WRIST_EXTENSORS'],
  // Legacy mappings for backward compatibility
  'forearms': ['WRIST_FLEXORS', 'WRIST_EXTENSORS'],
  
  // Core/Abs
  'core': ['ABS'],
  'abs': ['ABS'],
  'obliques': ['ABS'], // Map obliques to ABS since that's the closest match
  
  // Legs - map to specific leg muscle groups
  'legs': ['GLUTES', 'QUADRICEPS', 'HAMSTRINGS', 'CALVES'], // Generic legs maps to all leg muscles
  'glutes': ['GLUTES'],
  'quadriceps': ['QUADRICEPS'],
  'hamstrings': ['HAMSTRINGS'],
  'adductors': ['ADDUCTORS'],
  'calves': ['CALVES'],
  
  // Additional mappings
  'hip_flexors': ['GLUTES'], // Map to closest available muscle group
  'erectors': ['TRAPEZIUS'], // Map erectors to trapezius (upper back)
};

interface ProgramCustomizerProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  program: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userCustomization: any;
  userId: string;
  locale: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onCustomizationSaved: (customization: any) => void;
}

interface CustomizationConfig {
  structureId: string;
  categoryType: 'MINIMALIST' | 'ESSENTIALIST' | 'MAXIMALIST';
  workoutConfiguration: Record<string, string[]>; // workoutTemplateId -> exerciseIds[]
  weeklyScheduleMapping?: Record<string, string>; // day1 -> monday, day2 -> tuesday, etc.
  workoutPattern?: number; // 1 = same workout, 2 = A/B, 3 = A/B/C
}

export function ProgramCustomizer({
  program,
  userCustomization,
  userId,
  locale,
  onCustomizationSaved
}: ProgramCustomizerProps) {
  // Use userId to avoid unused variable warning
  console.log('User ID:', userId);
  
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [activeCustomizationTab, setActiveCustomizationTab] = useState('structure');
  
  // Customization state
  const [customization, setCustomization] = useState<CustomizationConfig>(() => ({
    structureId: userCustomization?.configuration?.structureId || program.programStructures.find((s: Record<string, unknown>) => s.isDefault)?.id || program.programStructures[0]?.id || '',
    categoryType: userCustomization?.categoryType || 'ESSENTIALIST',
    workoutConfiguration: userCustomization?.configuration?.workoutConfiguration || {},
    weeklyScheduleMapping: userCustomization?.configuration?.weeklyScheduleMapping || {},
    workoutPattern: userCustomization?.configuration?.workoutPattern || 1
  }));

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Exercise state
  interface Exercise {
    id: string;
    name: string;
    exerciseType: 'COMPOUND' | 'ISOLATION' | 'UNILATERAL';
    description?: string | null;
    instructions?: string | null;
    equipment: string[];
    category: 'APPROVED' | 'PENDING' | 'DEPRECATED';
    isActive: boolean;
    isRecommended: boolean;
    volumeContributions: Record<string, number>;
  }

  const [exercisesByMuscleGroup, setExercisesByMuscleGroup] = useState<Record<string, Exercise[]>>({});
  const [loadingExercises, setLoadingExercises] = useState<Record<string, boolean>>({});

  // Function to get Exercise muscle groups for a workout template muscle group
  const getExerciseMuscleGroups = useCallback((workoutMuscleGroup: string): string[] => {
    const lowerCaseGroup = workoutMuscleGroup.toLowerCase();
    return muscleGroupMapping[lowerCaseGroup] || [];
  }, []);

  // Function to fetch exercises for a muscle group
  const fetchExercisesForMuscleGroup = useCallback(async (muscleGroup: string) => {
    if (exercisesByMuscleGroup[muscleGroup] || loadingExercises[muscleGroup]) {
      return; // Already loaded or loading
    }

    setLoadingExercises(prev => ({ ...prev, [muscleGroup]: true }));

    try {
      // Map workout template muscle group to exercise muscle groups
      const exerciseMuscleGroups = getExerciseMuscleGroups(muscleGroup);
      
      if (exerciseMuscleGroups.length === 0) {
        console.warn(`No exercise muscle groups found for: ${muscleGroup}`);
        setExercisesByMuscleGroup(prev => ({
          ...prev,
          [muscleGroup]: []
        }));
        return;
      }

      // Fetch exercises for all mapped muscle groups
      const allExercises: Exercise[] = [];
      
      for (const exerciseMuscleGroup of exerciseMuscleGroups) {
        const response = await fetch(`/api/exercises/by-muscle-group?muscleGroup=${encodeURIComponent(exerciseMuscleGroup)}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch exercises for ${exerciseMuscleGroup}`);
        }

        const data = await response.json();
        allExercises.push(...(data.exercises || []));
      }

      // Remove duplicates and sort
      const uniqueExercises = allExercises.filter((exercise, index, self) => 
        index === self.findIndex(e => e.id === exercise.id)
      ).sort((a, b) => a.name.localeCompare(b.name));
      
      setExercisesByMuscleGroup(prev => ({
        ...prev,
        [muscleGroup]: uniqueExercises
      }));
    } catch (error) {
      console.error(`Failed to fetch exercises for ${muscleGroup}:`, error);
      setExercisesByMuscleGroup(prev => ({
        ...prev,
        [muscleGroup]: []
      }));
    } finally {
      setLoadingExercises(prev => ({ ...prev, [muscleGroup]: false }));
    }
  }, [exercisesByMuscleGroup, loadingExercises, getExerciseMuscleGroups]);

  // Preload exercises for all muscle groups used in workout templates
  useEffect(() => {
    const muscleGroups = new Set<string>();
    
    // Collect all muscle groups from all workout templates
    program.workoutTemplates?.forEach((template: { requiredMuscleGroups?: string[] }) => {
      template.requiredMuscleGroups?.forEach((muscleGroup: string) => {
        muscleGroups.add(muscleGroup);
      });
    });

    // Fetch exercises for each muscle group
    muscleGroups.forEach(muscleGroup => {
      fetchExercisesForMuscleGroup(muscleGroup);
    });
  }, [program.workoutTemplates, fetchExercisesForMuscleGroup]);

  // Extract multilingual content
  const getLocalizedContent = (content: Record<string, unknown> | string, fallback: string = '') => {
    if (typeof content === 'object' && content !== null) {
      return (content as Record<string, string>)[locale] || (content as Record<string, string>).en || fallback;
    }
    return content || fallback;
  };

  // Get selected structure
  const selectedStructure = program.programStructures.find((s: Record<string, unknown>) => s.id === customization.structureId);
  
  // Use selectedStructure to avoid unused warning
  console.log('Selected structure:', selectedStructure?.id);

  // Helper function to auto-schedule remaining days based on program structure
  const autoScheduleRemainingDays = (selectedDay: string, selectedWeekday: string) => {
    if (!selectedStructure?.weeklySchedule) return {};

    // Get all days in order
    const allDays = Object.entries(selectedStructure.weeklySchedule as Record<string, string>)
      .sort(([dayA], [dayB]) => {
        const dayNumA = parseInt(dayA.replace('day', ''));
        const dayNumB = parseInt(dayB.replace('day', ''));
        return dayNumA - dayNumB;
      });

    // Find the index of the selected day
    const selectedDayIndex = allDays.findIndex(([day]) => day === selectedDay);
    if (selectedDayIndex === -1) return {};

    // Get weekday order (starting from the selected weekday)
    const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const selectedWeekdayIndex = weekdays.indexOf(selectedWeekday);
    if (selectedWeekdayIndex === -1) return {};

    // Create new mapping for ALL days (including rest days)
    const newMapping: Record<string, string> = {};
    
    allDays.forEach(([day], index) => {
      // Calculate which weekday this should be assigned to
      const dayOffset = index - selectedDayIndex;
      const targetWeekdayIndex = (selectedWeekdayIndex + dayOffset + 7) % 7;
      newMapping[day] = weekdays[targetWeekdayIndex];
    });

    return newMapping;
  };

  // Helper function to check if workout days are consecutive
  const validateConsecutiveWorkouts = (scheduleMapping: Record<string, string>) => {
    if (!selectedStructure?.weeklySchedule) return { isValid: true, warnings: [] };

    // Get all days in program order with their mapped weekdays
    const allDaysInOrder = Object.entries(selectedStructure.weeklySchedule as Record<string, string>)
      .sort(([dayA], [dayB]) => {
        const dayNumA = parseInt(dayA.replace('day', ''));
        const dayNumB = parseInt(dayB.replace('day', ''));
        return dayNumA - dayNumB;
      })
      .map(([day, workout]) => ({
        programDay: day,
        workout,
        mappedWeekday: scheduleMapping[day] || '',
        isRestDay: !workout || workout.trim() === '' || workout.toLowerCase() === 'rest'
      }))
      .filter(item => item.mappedWeekday); // Only consider days that have been mapped

    if (allDaysInOrder.length < 2) return { isValid: true, warnings: [] };

    // Convert weekdays to numbers for comparison
    const weekdayMap: Record<string, number> = {
      sunday: 0, monday: 1, tuesday: 2, wednesday: 3, 
      thursday: 4, friday: 5, saturday: 6
    };

    const warnings: string[] = [];
    
    // Check for gaps in the COMPLETE weekly structure (including rest days)
    for (let i = 1; i < allDaysInOrder.length; i++) {
      const current = allDaysInOrder[i];
      const previous = allDaysInOrder[i - 1];
      
      const currentWeekdayNum = weekdayMap[current.mappedWeekday];
      const previousWeekdayNum = weekdayMap[previous.mappedWeekday];
      
      // Calculate expected difference based on program structure
      const currentProgramDayNum = parseInt(current.programDay.replace('day', ''));
      const previousProgramDayNum = parseInt(previous.programDay.replace('day', ''));
      const expectedDayDifference = currentProgramDayNum - previousProgramDayNum;
      
      // Calculate actual weekday difference (handle week wrapping)
      let actualDayDifference = currentWeekdayNum - previousWeekdayNum;
      if (actualDayDifference < 0) {
        actualDayDifference += 7; // Handle week wrapping
      }
      
      // Only flag as a problem if the actual gap doesn't match the program structure
      if (actualDayDifference !== expectedDayDifference) {
        // Check if this appears to be a structured program that should be consecutive
        const hasStructuredWorkouts = allDaysInOrder.some(item => 
          item.workout && (
            item.workout.toLowerCase().includes('upper') ||
            item.workout.toLowerCase().includes('lower') ||
            item.workout.toLowerCase().includes('push') ||
            item.workout.toLowerCase().includes('pull') ||
            item.workout.toLowerCase().includes('legs')
          )
        );

        if (hasStructuredWorkouts && !current.isRestDay && !previous.isRestDay) {
          // Only warn about gaps between workout days, not including rest days
          const previousWeekdayName = Object.keys(weekdayMap).find(key => weekdayMap[key] === previousWeekdayNum);
          const currentWeekdayName = Object.keys(weekdayMap).find(key => weekdayMap[key] === currentWeekdayNum);
          
          warnings.push(
            `Scheduling mismatch: ${previous.workout} on ${previousWeekdayName} to ${current.workout} on ${currentWeekdayName} doesn't follow the program's intended ${expectedDayDifference}-day structure.`
          );
        }
      }
    }

    return { 
      isValid: warnings.length === 0, 
      warnings 
    };
  };

  // Category descriptions
  const categoryDescriptions = {
    MINIMALIST: 'Fewer exercises, focus on compound movements. Perfect for beginners or those with limited time.',
    ESSENTIALIST: 'Balanced approach with optimal exercise selection. Recommended for most users.',
    MAXIMALIST: 'More exercises and volume. Best for advanced users who want maximum muscle stimulation.'
  };

  // Save customization
  const saveCustomization = async () => {
    setIsSaving(true);
    try {
      console.log('Saving customization:', customization);
      
      const response = await fetch('/api/programs/customize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainingProgramId: program.id,
          customization
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save customization');
      }

      const result = await response.json();
      onCustomizationSaved(result);
      setHasUnsavedChanges(false);
      
      toast({
        title: 'Customization Saved',
        description: 'Your program customization has been saved successfully.'
      });
    } catch {
      toast({
        title: 'Save Failed',
        description: 'Failed to save your customization. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to defaults
  const resetToDefaults = () => {
    const defaultCustomization: CustomizationConfig = {
      structureId: program.programStructures.find((s: Record<string, unknown>) => s.isDefault)?.id || program.programStructures[0]?.id || '',
      categoryType: 'ESSENTIALIST',
      workoutConfiguration: {},
      weeklyScheduleMapping: {}
    };
    
    setCustomization(defaultCustomization);
    setHasUnsavedChanges(true);
  };

  // Update customization and mark as changed
  const updateCustomization = (updates: Partial<CustomizationConfig>) => {
    setCustomization(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
    
    // Auto-save when structure is changed
    if (updates.structureId) {
      // Debounce auto-save slightly
      setTimeout(() => {
        autoSaveCustomization({ ...customization, ...updates });
      }, 500);
    }
  };
  
  // Auto-save customization (for structure changes)
  const autoSaveCustomization = async (config: CustomizationConfig) => {
    try {
      const response = await fetch('/api/programs/customize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainingProgramId: program.id,
          customization: config
        })
      });

      if (response.ok) {
        const result = await response.json();
        onCustomizationSaved(result);
        setHasUnsavedChanges(false);
        
        toast({
          title: 'Structure Saved',
          description: 'Your training structure has been automatically saved.',
        });
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
      // Don't show error toast for auto-save failures
    }
  };

  // Helper functions for exercise selection
  const getAvailableExercises = (muscleGroup: string) => {
    // Return exercises from our state, filtered by category type
    const exercises = exercisesByMuscleGroup[muscleGroup] || [];
    
    // Filter and sort: recommended exercises first, then alphabetically
    return exercises
      .filter(exercise => exercise.isActive && exercise.category === 'APPROVED')
      .sort((a, b) => {
        // Recommended exercises come first
        if (a.isRecommended && !b.isRecommended) return -1;
        if (!a.isRecommended && b.isRecommended) return 1;
        // Then sort alphabetically by name
        return a.name.localeCompare(b.name);
      });
  };

  const getExerciseLimit = () => {
    const limits = {
      'MINIMALIST': 1,
      'ESSENTIALIST': 2,
      'MAXIMALIST': 3
    };
    return limits[customization.categoryType] || 2;
  };

  const toggleExerciseSelection = (workoutTemplateId: string, exerciseId: string) => {
    const currentSelection = customization.workoutConfiguration[workoutTemplateId] || [];
    let newSelection: string[];
    
    if (currentSelection.includes(exerciseId)) {
      // Remove exercise
      newSelection = currentSelection.filter(id => id !== exerciseId);
    } else {
      // Add exercise
      newSelection = [...currentSelection, exerciseId];
    }
    
    updateCustomization({
      workoutConfiguration: {
        ...customization.workoutConfiguration,
        [workoutTemplateId]: newSelection
      }
    });
  };

  const autoSelectExercises = (workoutTemplateId: string, requiredMuscleGroups: string[]) => {
    const newSelection: string[] = [];
    
    requiredMuscleGroups.forEach(muscleGroup => {
      const availableExercises = getAvailableExercises(muscleGroup);
      const limit = getExerciseLimit();
      
      // Select top priority exercises up to the limit
      const topExercises = availableExercises.slice(0, limit);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      newSelection.push(...topExercises.map((ex: any) => ex.id));
    });
    
    updateCustomization({
      workoutConfiguration: {
        ...customization.workoutConfiguration,
        [workoutTemplateId]: newSelection
      }
    });
    
    toast({
      title: 'Exercises Auto-Selected',
      description: `Selected ${newSelection.length} exercises based on your category preferences.`
    });
  };

  return (
    <div className="space-y-6">
      {/* Customization Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Program Customization</span>
              </CardTitle>
              <CardDescription>
                Customize this program to match your preferences and goals
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-orange-600">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Unsaved Changes
                </Badge>
              )}
              {userCustomization && !hasUnsavedChanges && (
                <Badge variant="secondary">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Customized
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Customization Tabs */}
      <Tabs value={activeCustomizationTab} onValueChange={setActiveCustomizationTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="structure">
            <Layers className="w-4 h-4 mr-2" />
            Structure
          </TabsTrigger>
          <TabsTrigger value="category">
            <Dumbbell className="w-4 h-4 mr-2" />
            Category
          </TabsTrigger>
          <TabsTrigger value="workouts">
            <Settings className="w-4 h-4 mr-2" />
            Workouts
          </TabsTrigger>
        </TabsList>

        {/* Structure Selection */}
        <TabsContent value="structure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Choose Your Training Structure</CardTitle>
              <CardDescription>
                Select the training schedule that best fits your lifestyle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={customization.structureId} 
                onValueChange={(value: string) => updateCustomization({ structureId: value })}
              >
                <div className="space-y-4">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {program.programStructures.map((structure: any) => {
                    const structureName = getLocalizedContent(structure.name, `Structure ${structure.order + 1}`);
                    
                    return (
                      <div key={structure.id} className="flex items-start space-x-3 p-4 border rounded-lg">
                        <RadioGroupItem value={structure.id} id={structure.id} className="mt-1" />
                        <Label htmlFor={structure.id} className="flex-1 cursor-pointer">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium">{structureName}</h4>
                              {structure.isDefault && (
                                <Badge variant="secondary">Recommended</Badge>
                              )}
                            </div>
                            
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              <p>
                                {structure.structureType === 'weekly' 
                                  ? `${structure.sessionCount} sessions per week`
                                  : `${structure.trainingDays} training days, ${structure.restDays} rest days`
                                }
                              </p>
                            </div>
                            
                            {structure.weeklySchedule && (
                              <div className="mt-2">
                                <div className="flex space-x-1 text-xs">
                                  {Object.entries(structure.weeklySchedule as Record<string, string>).map(([day, workout]) => {
                                    const isRestDay = !workout || workout.trim() === '' || workout.toLowerCase() === 'rest';
                                    const displayLabel = isRestDay ? 'Rest' : workout;
                                    
                                    return (
                                      <div 
                                        key={day} 
                                        className={`px-2 py-1 rounded text-center min-w-12 ${
                                          isRestDay
                                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' 
                                            : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                                        }`}
                                      >
                                        {displayLabel}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
          
          {/* Weekly Schedule Customization */}
          {(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const selectedStructure = program.programStructures.find((s: any) => s.id === customization.structureId);
            if (selectedStructure?.structureType === 'weekly' && selectedStructure?.weeklySchedule) {
              return (
                <Card>
                  <CardHeader>
                    <CardTitle>Customize Your Weekly Schedule</CardTitle>
                    <CardDescription>
                      Select a weekday for any workout session and the system will automatically schedule all days (including rest days) to create a complete weekly structure.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(() => {
                        // Get all days and sort by day number (1-7)
                        const allDays = Object.entries(selectedStructure.weeklySchedule as Record<string, string>)
                          .sort(([dayA], [dayB]) => {
                            const dayNumA = parseInt(dayA.replace('day', ''));
                            const dayNumB = parseInt(dayB.replace('day', ''));
                            return dayNumA - dayNumB;
                          });

                        // Helper function to check if auto-scheduling would create conflicts
                        const wouldCreateConflict = (day: string, weekday: string) => {
                          const potentialMapping = autoScheduleRemainingDays(day, weekday);
                          const potentialWeekdays = Object.values(potentialMapping);
                          
                          // Since we're using all 7 days of the week, check if we have exactly 7 unique weekdays
                          const uniqueWeekdays = new Set(potentialWeekdays);
                          return uniqueWeekdays.size !== potentialWeekdays.length || potentialWeekdays.length !== 7;
                        };

                        return allDays.map(([programDay, workoutName]) => {
                          const isRestDay = !workoutName || workoutName.trim() === '' || workoutName.toLowerCase() === 'rest';
                          const currentMapping = customization.weeklyScheduleMapping?.[programDay] || '';
                          
                          if (isRestDay) {
                            // Rest day display
                            return (
                              <div key={programDay} className="flex items-center space-x-4 opacity-75">
                                <div className="w-16 text-sm font-medium">
                                  {programDay.replace('day', 'Day ')}:
                                </div>
                                <div className="flex-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm text-gray-500">
                                  Rest Day
                                </div>
                                <div className="w-4 text-center text-gray-400">→</div>
                                <div className="w-32 text-sm text-center">
                                  {currentMapping ? (
                                    <span className="text-gray-600 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                                      {currentMapping.charAt(0).toUpperCase() + currentMapping.slice(1)}
                                    </span>
                                  ) : (
                                    <span className="text-gray-500 text-xs">Not set</span>
                                  )}
                                </div>
                              </div>
                            );
                          } else {
                            // Workout day display
                            return (
                              <div key={programDay} className="flex items-center space-x-4">
                                <div className="w-16 text-sm font-medium">
                                  {programDay.replace('day', 'Day ')}:
                                </div>
                                <div className="flex-1 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                                  {workoutName}
                                </div>
                                <div className="w-4 text-center text-gray-400">→</div>
                                <Select
                                  value={currentMapping || "none"}
                                  onValueChange={(value: string) => {
                                    if (value === "none") {
                                      // Clear this day's mapping
                                      const newMapping = { ...customization.weeklyScheduleMapping, [programDay]: "" };
                                      updateCustomization({ weeklyScheduleMapping: newMapping });
                                    } else {
                                      // Auto-schedule all workout days based on this selection
                                      const autoScheduledMapping = autoScheduleRemainingDays(programDay, value);
                                      updateCustomization({ weeklyScheduleMapping: autoScheduledMapping });
                                    }
                                  }}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue placeholder="Select day" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">No day</SelectItem>
                                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(weekday => {
                                      const wouldConflict = wouldCreateConflict(programDay, weekday);
                                      const isCurrentSelection = currentMapping === weekday;
                                      const isDisabled = wouldConflict && !isCurrentSelection;
                                      
                                      return (
                                        <SelectItem 
                                          key={weekday} 
                                          value={weekday}
                                          disabled={isDisabled}
                                          className={isDisabled ? "opacity-50 cursor-not-allowed" : ""}
                                        >
                                          {weekday.charAt(0).toUpperCase() + weekday.slice(1)}
                                          {wouldConflict && !isCurrentSelection ? " (conflicts)" : ""}
                                        </SelectItem>
                                      );
                                    })}
                                  </SelectContent>
                                </Select>
                              </div>
                            );
                          }
                        });
                      })()}
                      
                      {/* Validation warnings for consecutive workouts */}
                      {(() => {
                        const validation = validateConsecutiveWorkouts(customization.weeklyScheduleMapping || {});
                        if (validation.warnings.length > 0) {
                          return (
                            <div className="mt-4 space-y-2">
                              {validation.warnings.map((warning, index) => (
                                <Alert key={index} className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                                  <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                  <AlertDescription className="text-amber-800 dark:text-amber-200">
                                    <strong>Scheduling Tip:</strong> {warning}
                                  </AlertDescription>
                                </Alert>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </CardContent>
                </Card>
              );
            }
            return null;
          })()}
        </TabsContent>

        {/* Category Selection */}
        <TabsContent value="category" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Training Philosophy</CardTitle>
              <CardDescription>
                Choose your approach to exercise selection and volume
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={customization.categoryType} 
                onValueChange={(value: string) => updateCustomization({ categoryType: value as 'MINIMALIST' | 'ESSENTIALIST' | 'MAXIMALIST' })}
              >
                <div className="space-y-4">
                  {Object.entries(categoryDescriptions).map(([category, description]) => (
                    <div key={category} className="flex items-start space-x-3 p-4 border rounded-lg">
                      <RadioGroupItem value={category} id={category} className="mt-1" />
                      <Label htmlFor={category} className="flex-1 cursor-pointer">
                        <div className="space-y-1">
                          <h4 className="font-medium capitalize">{category.toLowerCase()}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {description}
                          </p>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workout Configuration */}
        <TabsContent value="workouts" className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Choose your workout pattern and customize exercises for each workout template.
            </AlertDescription>
          </Alert>

          {/* Workout Pattern Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Workout Pattern</CardTitle>
              <CardDescription>
                Choose how you want to cycle through your workouts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={customization.workoutPattern?.toString() || '1'}
                onValueChange={(value) => {
                  setCustomization(prev => ({
                    ...prev,
                    workoutPattern: parseInt(value)
                  }));
                  setHasUnsavedChanges(true);
                }}
              >
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="1" id="pattern-1" />
                    <Label htmlFor="pattern-1" className="flex-1 cursor-pointer">
                      <div className="font-medium">Same Workout Repeated</div>
                      <div className="text-sm text-muted-foreground">
                        Repeat the same workout every training day (e.g., Full Body, Full Body, Full Body...)
                      </div>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="2" id="pattern-2" />
                    <Label htmlFor="pattern-2" className="flex-1 cursor-pointer">
                      <div className="font-medium">Workout A and B</div>
                      <div className="text-sm text-muted-foreground">
                        Alternate between two different workouts (e.g., A, B, A, B, A, B...)
                      </div>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="3" id="pattern-3" />
                    <Label htmlFor="pattern-3" className="flex-1 cursor-pointer">
                      <div className="font-medium">Workout A, B, and C</div>
                      <div className="text-sm text-muted-foreground">
                        Rotate through three different workouts (e.g., A, B, C, A, B, C...)
                      </div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workout Templates</CardTitle>
              <CardDescription>
                Your program includes {program.workoutTemplates.length} workout template{program.workoutTemplates.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {program.workoutTemplates.map((template: any, index: number) => {
                  const templateName = getLocalizedContent(template.name, `Workout ${template.order + 1}`);
                  const selectedExercises = customization.workoutConfiguration[template.id] || [];
                  // Filter to only include valid muscle groups from the predefined list
                  const validMuscleGroups = filterValidMuscleGroups(template.requiredMuscleGroups || []);
                  
                  return (
                    <AccordionItem key={template.id} value={`workout-${index}`} className="border rounded-lg px-4 mb-3">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center space-x-3">
                            <Dumbbell className="w-5 h-5 text-blue-500" />
                            <div className="text-left">
                              <h4 className="font-semibold">{templateName}</h4>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {validMuscleGroups.slice(0, 3).map((muscleGroupId) => {
                                  const muscleInfo = getMuscleGroupInfo(muscleGroupId);
                                  return (
                                    <Badge 
                                      key={muscleGroupId} 
                                      variant="secondary" 
                                      className={`${muscleInfo.color} text-xs`}
                                    >
                                      {muscleInfo.name}
                                    </Badge>
                                  );
                                })}
                                {validMuscleGroups.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{validMuscleGroups.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" className="ml-auto">
                            {selectedExercises.length} exercise{selectedExercises.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-4">
                          {/* Auto-select button */}
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => autoSelectExercises(template.id, validMuscleGroups)}
                            >
                              Auto-Select Exercises
                            </Button>
                          </div>
                          
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Exercise Selection
                          </h5>
                        
                        {validMuscleGroups.map((muscleGroup: string) => {
                          const muscleInfo = getMuscleGroupInfo(muscleGroup);
                          const availableExercises = getAvailableExercises(muscleGroup);
                          const isLoadingMuscleGroup = loadingExercises[muscleGroup];
                          const muscleGroupExercises = selectedExercises.filter((exerciseId: string) => {
                            const exercise = availableExercises.find((ex: Exercise) => ex.id === exerciseId);
                            // Check if exercise has volume contribution for this muscle group
                            return exercise && exercise.volumeContributions && 
                                   Object.keys(exercise.volumeContributions).some(muscle => 
                                     muscle.toLowerCase() === muscleGroup.toLowerCase()
                                   );
                          });

                          return (
                            <div key={muscleGroup} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <Badge variant="secondary" className={muscleInfo.color}>
                                    {muscleInfo.name}
                                  </Badge>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {muscleGroupExercises.length}/{getExerciseLimit()} selected
                                </Badge>
                              </div>
                              
                              {isLoadingMuscleGroup ? (
                                <div className="flex items-center justify-center py-4">
                                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                  <span className="ml-2 text-sm text-gray-500">Loading exercises...</span>
                                </div>
                              ) : (
                                <>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {availableExercises.map((exercise: Exercise) => {
                                      const isSelected = selectedExercises.includes(exercise.id);
                                      const canSelect = !isSelected && muscleGroupExercises.length < getExerciseLimit();
                                      
                                      return (
                                        <div
                                          key={exercise.id}
                                          className={`p-2 border rounded cursor-pointer transition-colors ${
                                            isSelected 
                                              ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' 
                                              : canSelect
                                                ? 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                                : 'opacity-50 cursor-not-allowed'
                                          }`}
                                          onClick={() => canSelect || isSelected ? toggleExerciseSelection(template.id, exercise.id) : undefined}
                                        >
                                          <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                              <p className="text-sm font-medium">
                                                {exercise.name}
                                                {exercise.isRecommended && (
                                                  <span className="ml-2 text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-0.5 rounded">
                                                    ⭐ Recommended
                                                  </span>
                                                )}
                                              </p>
                                              <p className="text-xs text-gray-500">
                                                {exercise.equipment.join(', ')}
                                              </p>
                                            </div>
                                            {isSelected && (
                                              <CheckCircle className="w-4 h-4 text-blue-600" />
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  
                                  {availableExercises.length === 0 && !isLoadingMuscleGroup && (
                                    <p className="text-sm text-gray-500 text-center py-2">
                                      No exercises available for {muscleGroup}
                                    </p>
                                  )}
                                </>
                              )}
                            </div>
                          );
                        })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <Button
          variant="outline"
          onClick={resetToDefaults}
          disabled={isSaving}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset to Defaults
        </Button>
        
        <div className="flex items-center space-x-3">
          {hasUnsavedChanges && (
            <p className="text-sm text-orange-600">
              You have unsaved changes
            </p>
          )}
          <Button
            onClick={saveCustomization}
            disabled={!hasUnsavedChanges || isSaving}
          >
            {isSaving ? (
              <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Customization
          </Button>
        </div>
      </div>
    </div>
  );
}