'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings,
  Layers,
  Dumbbell,
  Save,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Info,
  Plus,
  X,
  Search,
  HelpCircle
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
  'trapezius_rhomboids': ['TRAPEZIUS_RHOMBOIDS'],
  // Legacy mappings for backward compatibility with old separated values
  'trapezius': ['TRAPEZIUS_RHOMBOIDS'],
  'rhomboids': ['TRAPEZIUS_RHOMBOIDS'],
  'back': ['LATS', 'TRAPEZIUS_RHOMBOIDS'],
  'upper_back': ['TRAPEZIUS_RHOMBOIDS'],
  
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
  'erectors': ['TRAPEZIUS_RHOMBOIDS'], // Map erectors to trapezius & rhomboids (upper back)
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
  exerciseSets?: Record<string, Record<string, number>>; // templateId -> exerciseId -> sets count
  exerciseEquipment?: Record<string, Record<string, string>>; // templateId -> exerciseId -> selected equipment
}

export function ProgramCustomizer({
  program,
  userCustomization,
  userId,
  locale,
  onCustomizationSaved
}: ProgramCustomizerProps) {
  // Use userId to avoid unused variable warning
  if (process.env.NODE_ENV === 'development') { console.log('User ID:', userId); }
  
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [activeCustomizationTab, setActiveCustomizationTab] = useState('structure');
  
  // Helper function to get a valid structure ID
  const getValidStructureId = useCallback(() => {
    // First check if saved structureId exists in current program structures
    const savedStructureId = userCustomization?.configuration?.structureId;
    if (savedStructureId && program.programStructures.some((s: Record<string, unknown>) => s.id === savedStructureId)) {
      return savedStructureId;
    }
    // Fall back to default or first structure
    return program.programStructures.find((s: Record<string, unknown>) => s.isDefault)?.id || program.programStructures[0]?.id || '';
  }, [userCustomization?.configuration?.structureId, program.programStructures]);
  
  // Customization state
  const [customization, setCustomization] = useState<CustomizationConfig>(() => ({
    structureId: getValidStructureId(),
    categoryType: userCustomization?.categoryType || 'ESSENTIALIST',
    workoutConfiguration: userCustomization?.configuration?.workoutConfiguration || {},
    weeklyScheduleMapping: userCustomization?.configuration?.weeklyScheduleMapping || {},
    workoutPattern: userCustomization?.configuration?.workoutPattern || 1,
    exerciseSets: userCustomization?.configuration?.exerciseSets || {},
    exerciseEquipment: userCustomization?.configuration?.exerciseEquipment || {}
  }));

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Track unsaved changes per workout template (templateId -> boolean)
  const [workoutUnsavedChanges, setWorkoutUnsavedChanges] = useState<Record<string, boolean>>({});
  
  // Track the saved workout pattern (updates only after save)
  const [savedWorkoutPattern, setSavedWorkoutPattern] = useState<number>(
    userCustomization?.configuration?.workoutPattern || 1
  );

  // Track exercise sets (templateId -> exerciseId -> sets)
  const [exerciseSets, setExerciseSets] = useState<Record<string, Record<string, number>>>(
    userCustomization?.configuration?.exerciseSets || {}
  );

  // Track exercise equipment selection (templateId -> exerciseId -> equipment)
  const [exerciseEquipment, setExerciseEquipment] = useState<Record<string, Record<string, string>>>(
    userCustomization?.configuration?.exerciseEquipment || {}
  );

  // Track muscle priority order (templateId -> ordered muscle array)
  const [musclePriorityOrder, setMusclePriorityOrder] = useState<Record<string, string[]>>({});

  // Sync customization state when userCustomization prop changes (e.g., after hot reload or data refresh)
  useEffect(() => {
    if (userCustomization) {
      const validStructureId = getValidStructureId();
      const savedStructureId = userCustomization?.configuration?.structureId;
      
      // Notify user if their saved structure was invalid and has been reset
      if (savedStructureId && savedStructureId !== validStructureId) {
        console.warn('Invalid structure ID detected:', savedStructureId, '- Reset to:', validStructureId);
        toast({
          title: 'Program Structure Updated',
          description: 'Your saved workout structure was outdated and has been reset to the current default. Please review and save your workout again.',
          variant: 'default'
        });
      }
      
      setCustomization({
        structureId: validStructureId,
        categoryType: userCustomization.categoryType || 'ESSENTIALIST',
        workoutConfiguration: userCustomization.configuration?.workoutConfiguration || {},
        weeklyScheduleMapping: userCustomization.configuration?.weeklyScheduleMapping || {},
        workoutPattern: userCustomization.configuration?.workoutPattern || 1,
        exerciseSets: userCustomization.configuration?.exerciseSets || {},
        exerciseEquipment: userCustomization.configuration?.exerciseEquipment || {}
      });
      setSavedWorkoutPattern(userCustomization.configuration?.workoutPattern || 1);
      setExerciseSets(userCustomization.configuration?.exerciseSets || {});
      setExerciseEquipment(userCustomization.configuration?.exerciseEquipment || {});
    }
  }, [userCustomization, program.programStructures, getValidStructureId, toast]);

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
    imageUrl?: string | null;
    imageType?: string | null;
    volumeContributions: Record<string, number>;
  }

  const [exercisesByMuscleGroup, setExercisesByMuscleGroup] = useState<Record<string, Exercise[]>>({});
  const [loadingExercises, setLoadingExercises] = useState<Record<string, boolean>>({});
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);
  
  // Exercise dialog state
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');
  const [tempSelectedExercises, setTempSelectedExercises] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentTemplateId, setCurrentTemplateId] = useState<string>('');
  const [currentMuscleGroup, setCurrentMuscleGroup] = useState<string>('');
  const [equipmentFilter, setEquipmentFilter] = useState<string>('all');

  // Function to get Exercise muscle groups for a workout template muscle group
  const getExerciseMuscleGroups = useCallback((workoutMuscleGroup: string): string[] => {
    const lowerCaseGroup = workoutMuscleGroup.toLowerCase();
    return muscleGroupMapping[lowerCaseGroup] || [];
  }, []);

  // Helper to get/set exercise sets
  const getExerciseSets = (templateId: string, exerciseId: string) => {
    return exerciseSets[templateId]?.[exerciseId] || 2; // default 2 sets
  };

  const setExerciseSetCount = (templateId: string, exerciseId: string, sets: number) => {
    setExerciseSets(prev => ({
      ...prev,
      [templateId]: {
        ...(prev[templateId] || {}),
        [exerciseId]: sets
      }
    }));
    setHasUnsavedChanges(true);
    setWorkoutUnsavedChanges(prev => ({ ...prev, [templateId]: true }));
  };

  // Helper to get/set exercise equipment
  const getExerciseEquipment = (templateId: string, exerciseId: string) => {
    return exerciseEquipment[templateId]?.[exerciseId] || '';
  };

  const setExerciseEquipmentChoice = (templateId: string, exerciseId: string, equipment: string) => {
    setExerciseEquipment(prev => ({
      ...prev,
      [templateId]: {
        ...(prev[templateId] || {}),
        [exerciseId]: equipment
      }
    }));
    setHasUnsavedChanges(true);
    setWorkoutUnsavedChanges(prev => ({ ...prev, [templateId]: true }));
  };

  // Calculate total volume for a muscle in a workout
  const calculateMuscleVolume = (template: WorkoutTemplateWithPattern, muscleGroup: string): number => {
    const selectedExercises = customization.workoutConfiguration[template.displayId] || [];
    let totalVolume = 0;
    
    // Map workout muscle group to exercise muscle groups (e.g., "chest" -> ["CHEST"])
    const exerciseMuscleGroups = getExerciseMuscleGroups(muscleGroup);
    
    selectedExercises.forEach(exerciseId => {
      const sets = getExerciseSets(template.displayId, exerciseId);
      const exercise = Object.values(exercisesByMuscleGroup).flat().find(ex => ex.id === exerciseId);
      
      if (exercise && exercise.volumeContributions) {
        // Get max contribution across all mapped muscle groups
        const contribution = Math.max(
          ...exerciseMuscleGroups.map(emg => exercise.volumeContributions?.[emg] || 0)
        );
        totalVolume += sets * contribution;
      }
    });
    
    return Math.round(totalVolume * 10) / 10; // Round to 1 decimal
  };

  // Get volume range from template
  const getVolumeRange = (template: WorkoutTemplateWithPattern, muscleGroup: string) => {
    const volumeRange = template.volumeRange as Record<string, { min: number; max: number }> | undefined;
    return volumeRange?.[muscleGroup] || { min: 2, max: 5 };
  };

  // Determine volume status
  const getVolumeStatus = (volume: number, range: { min: number; max: number }) => {
    if (volume < range.min) {
      return { 
        color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200', 
        label: 'Too Low',
        icon: '⚠️'
      };
    }
    if (volume > range.max) {
      return { 
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200', 
        label: 'Too High',
        icon: '⚠️'
      };
    }
    return { 
      color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200', 
      label: 'Optimal',
      icon: '✓'
    };
  };

  // Get ordered muscles for a template
  const getOrderedMuscles = (templateId: string, muscles: string[]) => {
    const order = musclePriorityOrder[templateId];
    if (!order) return muscles;
    
    // Sort based on custom order, then append remaining
    const ordered = [...order].filter(m => muscles.includes(m));
    const remaining = muscles.filter(m => !order.includes(m));
    return [...ordered, ...remaining];
  };

  // Move muscle up in priority
  const moveMuscleUp = (templateId: string, muscleGroup: string, allMuscles: string[]) => {
    const currentOrder = musclePriorityOrder[templateId] || allMuscles;
    const index = currentOrder.indexOf(muscleGroup);
    if (index > 0) {
      const newOrder = [...currentOrder];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      setMusclePriorityOrder(prev => ({ ...prev, [templateId]: newOrder }));
      setHasUnsavedChanges(true);
    }
  };

  // Move muscle down in priority
  const moveMuscleDown = (templateId: string, muscleGroup: string, allMuscles: string[]) => {
    const currentOrder = musclePriorityOrder[templateId] || allMuscles;
    const index = currentOrder.indexOf(muscleGroup);
    if (index < currentOrder.length - 1 && index !== -1) {
      const newOrder = [...currentOrder];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      setMusclePriorityOrder(prev => ({ ...prev, [templateId]: newOrder }));
      setHasUnsavedChanges(true);
    }
  };

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
  if (process.env.NODE_ENV === 'development') { console.log('Selected structure:', selectedStructure?.id); }

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

  // Save customization (legacy - kept for reference, now using individual save functions)
  // const saveCustomization = async () => {
  //   setIsSaving(true);
  //   try {
  //     console.log('Saving customization:', customization);
  //     
  //     const response = await fetch('/api/programs/customize', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         trainingProgramId: program.id,
  //         customization
  //       })
  //     });

  //     if (!response.ok) {
  //       throw new Error('Failed to save customization');
  //     }

  //     const result = await response.json();
  //     onCustomizationSaved(result);
  //     setHasUnsavedChanges(false);
  //     
  //     toast({
  //       title: 'Customization Saved',
  //       description: 'Your program customization has been saved successfully.'
  //     });
  //   } catch {
  //     toast({
  //       title: 'Save Failed',
  //       description: 'Failed to save your customization. Please try again.',
  //       variant: 'destructive'
  //     });
  //   } finally {
  //     setIsSaving(false);
  //   }
  // };

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

  // Update customization and mark as changed (no auto-save)
  const updateCustomization = (updates: Partial<CustomizationConfig>) => {
    setCustomization(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  };

  // Generate workout templates based on pattern multiplier
  interface WorkoutTemplateWithPattern {
    id: string;
    name: Record<string, string>;
    order: number;
    requiredMuscleGroups: string[];
    exercisesPerMuscle?: Record<string, number>;
    volumeRange?: Record<string, { min: number; max: number }>;
    patternLabel: string | null;
    patternIndex: number;
    displayId: string;
    baseId: string;
  }

  const getWorkoutsToDisplay = (): WorkoutTemplateWithPattern[] => {
    const baseWorkouts = program.workoutTemplates || [];
    const pattern = savedWorkoutPattern;
    
    if (pattern === 1) {
      // Pattern 1: Same workout repeated - show all workouts as they are
      return baseWorkouts.map((workout: WorkoutTemplateWithPattern) => ({
        ...workout,
        patternLabel: null,
        patternIndex: 0,
        displayId: workout.id,
        baseId: workout.id
      }));
    } else {
      // Pattern 2 or 3: Multiply workouts by pattern
      const expandedWorkouts: WorkoutTemplateWithPattern[] = [];
      const labels = ['A', 'B', 'C'];
      
      for (let patternIndex = 0; patternIndex < pattern; patternIndex++) {
        baseWorkouts.forEach((workout: WorkoutTemplateWithPattern) => {
          expandedWorkouts.push({
            ...workout,
            patternLabel: labels[patternIndex],
            patternIndex: patternIndex,
            displayId: `${workout.id}-${labels[patternIndex]}`,
            baseId: workout.id
          });
        });
      }
      
      return expandedWorkouts;
    }
  };

  // Save structure selection
  const saveStructure = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/programs/customize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainingProgramId: program.id,
          customization: {
            structureId: customization.structureId,
            categoryType: customization.categoryType,
            workoutConfiguration: {}, // Clear workout config when changing structure
            weeklyScheduleMapping: customization.weeklyScheduleMapping || {},
            workoutPattern: customization.workoutPattern || 1
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save structure');
      }

      const result = await response.json();
      onCustomizationSaved(result);
      setHasUnsavedChanges(false);
      
      toast({
        title: 'Structure Saved',
        description: 'Your training structure has been saved successfully.'
      });
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save your structure.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Save category selection
  const saveCategory = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/programs/customize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainingProgramId: program.id,
          customization: {
            structureId: customization.structureId,
            categoryType: customization.categoryType,
            workoutConfiguration: {}, // Clear workout config when changing category
            weeklyScheduleMapping: customization.weeklyScheduleMapping || {},
            workoutPattern: customization.workoutPattern || 1
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save category');
      }

      const result = await response.json();
      onCustomizationSaved(result);
      setHasUnsavedChanges(false);
      
      toast({
        title: 'Category Saved',
        description: 'Your program category has been saved successfully.'
      });
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save your category.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Save workout pattern
  const saveWorkoutPattern = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/programs/customize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainingProgramId: program.id,
          customization: {
            structureId: customization.structureId,
            categoryType: customization.categoryType,
            workoutConfiguration: {}, // Clear workout config when changing pattern
            weeklyScheduleMapping: customization.weeklyScheduleMapping || {},
            workoutPattern: customization.workoutPattern || 1
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save workout pattern');
      }

      const result = await response.json();
      
      // Update saved pattern and clear workout configuration
      setSavedWorkoutPattern(customization.workoutPattern || 1);
      setCustomization(prev => ({
        ...prev,
        workoutConfiguration: {}
      }));
      
      onCustomizationSaved(result);
      setHasUnsavedChanges(false);
      
      // Get pattern description for user feedback
      const patternDescriptions: Record<number, string> = {
        1: 'One same workout repeated',
        2: 'Workout A and Workout B alternating',
        3: 'Workout A, B, and C rotating'
      };
      
      const patternValue = customization.workoutPattern || 1;
      
      toast({
        title: 'Pattern Saved',
        description: `Your workout pattern has been updated to: ${patternDescriptions[patternValue]}. Workout templates have been regenerated.`
      });
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save your workout pattern.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Save individual workout configuration
  const saveWorkoutConfiguration = async (workoutDisplayId: string) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/programs/customize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainingProgramId: program.id,
          customization: {
            structureId: customization.structureId,
            categoryType: customization.categoryType,
            workoutConfiguration: customization.workoutConfiguration || {},
            weeklyScheduleMapping: customization.weeklyScheduleMapping || {},
            workoutPattern: customization.workoutPattern || 1,
            exerciseSets: exerciseSets, // Include exercise sets in save
            exerciseEquipment: exerciseEquipment // Include exercise equipment choices in save
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save workout');
      }

      const result = await response.json();
      onCustomizationSaved(result);
      setHasUnsavedChanges(false);
      // Clear unsaved changes flag for this specific workout
      setWorkoutUnsavedChanges(prev => ({ ...prev, [workoutDisplayId]: false }));
      
      toast({
        title: 'Workout Saved',
        description: `Your workout exercises have been saved successfully.`
      });
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save your workout.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
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

  const getExerciseLimit = (template: WorkoutTemplateWithPattern, muscleGroup: string) => {
    // Get admin-defined limit from template's exercisesPerMuscle field
    const exercisesPerMuscle = template.exercisesPerMuscle as Record<string, number> | undefined;
    if (exercisesPerMuscle && exercisesPerMuscle[muscleGroup]) {
      return exercisesPerMuscle[muscleGroup];
    }
    // Fallback to category-based limits if not defined
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
    setWorkoutUnsavedChanges(prev => ({ ...prev, [workoutTemplateId]: true }));
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
                <div className="space-y-3 sm:space-y-4">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {program.programStructures.map((structure: any) => {
                    const structureName = getLocalizedContent(structure.name, `Structure ${structure.order + 1}`);
                    
                    return (
                      <div key={structure.id} className="flex items-start space-x-2 sm:space-x-3 p-3 sm:p-4 border rounded-lg">
                        <RadioGroupItem value={structure.id} id={structure.id} className="mt-1 shrink-0" />
                        <Label htmlFor={structure.id} className="flex-1 cursor-pointer min-w-0">
                          <div className="space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <h4 className="font-medium text-sm sm:text-base">{structureName}</h4>
                              {structure.isDefault && (
                                <Badge variant="secondary" className="w-fit text-xs">Recommended</Badge>
                              )}
                            </div>
                            
                            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                              <p>
                                {structure.structureType === 'weekly' 
                                  ? `${structure.sessionCount} sessions per week`
                                  : `${structure.trainingDays} training days, ${structure.restDays} rest days`
                                }
                              </p>
                            </div>
                            
                            {structure.weeklySchedule && (
                              <div className="mt-2">
                                <div className="flex flex-wrap gap-1 text-xs">
                                  {Object.entries(structure.weeklySchedule as Record<string, string>).map(([day, workout]) => {
                                    const isRestDay = !workout || workout.trim() === '' || workout.toLowerCase() === 'rest';
                                    const displayLabel = isRestDay ? 'Rest' : workout;
                                    
                                    return (
                                      <div 
                                        key={day} 
                                        className={`px-2 py-1 rounded text-center min-w-[3rem] sm:min-w-[3.5rem] flex-shrink-0 ${
                                          isRestDay
                                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' 
                                            : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                                        }`}
                                      >
                                        <span className="block truncate text-[10px] sm:text-xs">{displayLabel}</span>
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
            <CardFooter className="flex justify-end">
              <Button
                onClick={saveStructure}
                disabled={!customization.structureId || isSaving}
              >
                {isSaving ? (
                  <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Structure
              </Button>
            </CardFooter>
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
            <CardFooter className="flex justify-end">
              <Button
                onClick={saveCategory}
                disabled={!customization.categoryType || isSaving}
              >
                {isSaving ? (
                  <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Category
              </Button>
            </CardFooter>
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
            <CardFooter className="flex justify-end">
              <Button
                onClick={saveWorkoutPattern}
                disabled={!customization.workoutPattern || isSaving}
              >
                {isSaving ? (
                  <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Pattern
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workout Templates</CardTitle>
              <CardDescription>
                {savedWorkoutPattern === 1 
                  ? `Your program includes ${program.workoutTemplates.length} workout template${program.workoutTemplates.length !== 1 ? 's' : ''}`
                  : `Your program includes ${program.workoutTemplates.length} base workout${program.workoutTemplates.length !== 1 ? 's' : ''} multiplied by ${savedWorkoutPattern}x pattern (${getWorkoutsToDisplay().length} total workout templates)`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {getWorkoutsToDisplay().map((template: WorkoutTemplateWithPattern, index: number) => {
                  const templateName = getLocalizedContent(template.name, `Workout ${template.order + 1}`);
                  const displayName = template.patternLabel 
                    ? `${templateName} (${template.patternLabel})`
                    : templateName;
                  const selectedExercises = customization.workoutConfiguration[template.displayId] || [];
                  // Filter to only include valid muscle groups from the predefined list
                  const validMuscleGroups = filterValidMuscleGroups(template.requiredMuscleGroups || []);
                  
                  return (
                    <AccordionItem key={template.displayId} value={`workout-${index}`} className="border rounded-lg px-4 mb-3">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center space-x-3">
                            <Dumbbell className="w-5 h-5 text-blue-500 flex-shrink-0" />
                            <div className="text-left min-w-0">
                              <h4 className="font-semibold truncate">{displayName}</h4>
                              {/* Mobile: Show count only */}
                              <div className="flex sm:hidden items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {validMuscleGroups.length} muscle{validMuscleGroups.length !== 1 ? 's' : ''}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {selectedExercises.length} ex
                                </Badge>
                              </div>
                              {/* Desktop: Show full badges */}
                              <div className="hidden sm:flex flex-wrap gap-1 mt-1">
                                {validMuscleGroups.slice(0, 3).map((muscleGroupId) => {
                                  const muscleInfo = getMuscleGroupInfo(muscleGroupId);
                                  const volume = calculateMuscleVolume(template, muscleGroupId);
                                  const range = getVolumeRange(template, muscleGroupId);
                                  const status = getVolumeStatus(volume, range);
                                  return (
                                    <div key={muscleGroupId} className="flex items-center gap-1">
                                      <Badge 
                                        variant="secondary" 
                                        className={`${muscleInfo.color} text-xs`}
                                      >
                                        {muscleInfo.name}
                                      </Badge>
                                      <Badge className={`${status.color} text-[10px] px-1.5 py-0.5`}>
                                        {status.icon} {volume}/{range.min}-{range.max}
                                      </Badge>
                                    </div>
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
                          <Badge variant="outline" className="ml-auto hidden sm:inline-flex">
                            {selectedExercises.length} exercise{selectedExercises.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="relative">
                        <div className="space-y-4 pt-4 pb-2">
                          
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Exercise Selection
                          </h5>
                        
                        {getOrderedMuscles(template.displayId, validMuscleGroups).map((muscleGroup: string, muscleIndex: number) => {
                          const muscleInfo = getMuscleGroupInfo(muscleGroup);
                          const availableExercises = getAvailableExercises(muscleGroup);
                          const isLoadingMuscleGroup = loadingExercises[muscleGroup];
                          
                          // Only include exercises with 0.75 or 1.0 volume contribution for this muscle
                          const muscleGroupExercises = selectedExercises.filter((exerciseId: string) => {
                            const exercise = availableExercises.find((ex: Exercise) => ex.id === exerciseId);
                            if (!exercise || !exercise.volumeContributions) return false;
                            
                            const exerciseMuscleGroups = getExerciseMuscleGroups(muscleGroup);
                            const volumeContribution = Math.max(
                              ...exerciseMuscleGroups.map(emg => exercise.volumeContributions?.[emg] || 0)
                            );
                            
                            // Only show exercises with 0.75 or higher volume contribution
                            return volumeContribution >= 0.75;
                          });
                          
                          // Find exercises with 0.5 volume (indirect)
                          const indirectExercises = selectedExercises.filter((exerciseId: string) => {
                            const exercise = availableExercises.find((ex: Exercise) => ex.id === exerciseId);
                            if (!exercise || !exercise.volumeContributions) return false;
                            
                            const exerciseMuscleGroups = getExerciseMuscleGroups(muscleGroup);
                            const volumeContribution = Math.max(
                              ...exerciseMuscleGroups.map(emg => exercise.volumeContributions?.[emg] || 0)
                            );
                            
                            return volumeContribution === 0.5;
                          });
                          
                          // Find exercises with 0.25 volume (minimal)
                          const minimalExercises = selectedExercises.filter((exerciseId: string) => {
                            const exercise = availableExercises.find((ex: Exercise) => ex.id === exerciseId);
                            if (!exercise || !exercise.volumeContributions) return false;
                            
                            const exerciseMuscleGroups = getExerciseMuscleGroups(muscleGroup);
                            const volumeContribution = Math.max(
                              ...exerciseMuscleGroups.map(emg => exercise.volumeContributions?.[emg] || 0)
                            );
                            
                            return volumeContribution === 0.25;
                          });
                          
                          const volume = calculateMuscleVolume(template, muscleGroup);
                          const range = getVolumeRange(template, muscleGroup);
                          const status = getVolumeStatus(volume, range);

                          return (
                            <div key={muscleGroup} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <div className="flex flex-col space-y-1">
                                    <Button 
                                      size="icon" 
                                      variant="ghost" 
                                      className="h-5 w-5 p-0"
                                      onClick={() => moveMuscleUp(template.displayId, muscleGroup, validMuscleGroups)}
                                      disabled={muscleIndex === 0}
                                      title="Move up (higher priority)"
                                    >
                                      ↑
                                    </Button>
                                    <Button 
                                      size="icon" 
                                      variant="ghost" 
                                      className="h-5 w-5 p-0"
                                      onClick={() => moveMuscleDown(template.displayId, muscleGroup, validMuscleGroups)}
                                      disabled={muscleIndex === validMuscleGroups.length - 1}
                                      title="Move down (lower priority)"
                                    >
                                      ↓
                                    </Button>
                                  </div>
                                  <Badge variant="secondary" className={muscleInfo.color}>
                                    {muscleInfo.name}
                                  </Badge>
                                  <Badge className={`${status.color} text-[10px] sm:text-xs px-1.5 py-0.5 leading-tight`}>
                                    <span className="flex items-center gap-0.5">
                                      <span>{status.icon}</span>
                                      <span className="font-medium">{volume}/{range.min}-{range.max}</span>
                                      <span className="hidden sm:inline ml-0.5">({status.label})</span>
                                    </span>
                                  </Badge>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {muscleGroupExercises.length}/{getExerciseLimit(template, muscleGroup)} selected
                                </Badge>
                              </div>
                              
                              {isLoadingMuscleGroup ? (
                                <div className="flex items-center justify-center py-4">
                                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                  <span className="ml-2 text-sm text-gray-500">Loading exercises...</span>
                                </div>
                              ) : (
                                <>
                                  {/* Selected Exercises - Compact View */}
                                  {muscleGroupExercises.length > 0 && (
                                    <div className="space-y-2 mb-3">
                                      <div className="text-xs font-medium text-muted-foreground">Selected Exercises:</div>
                                      <div className="grid grid-cols-1 gap-2">
                                        {muscleGroupExercises.map((exerciseId: string) => {
                                          const exercise = availableExercises.find((ex: Exercise) => ex.id === exerciseId);
                                          if (!exercise) return null;
                                          
                                          const exerciseMuscleGroups = getExerciseMuscleGroups(muscleGroup);
                                          const volumeContribution = Math.max(
                                            ...exerciseMuscleGroups.map(emg => exercise.volumeContributions?.[emg] || 0)
                                          );
                                          
                                          return (
                                            <div
                                              key={exercise.id}
                                              className="border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 rounded overflow-hidden"
                                            >
                                              <div className="p-2">
                                                <div className="flex items-center gap-3">
                                                  {exercise.imageUrl && (
                                                    <Image 
                                                      src={exercise.imageUrl} 
                                                      alt={exercise.name}
                                                      width={40}
                                                      height={40}
                                                      className="w-10 h-10 object-cover rounded flex-shrink-0"
                                                    />
                                                  )}
                                                  <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                      <p className="text-sm font-medium truncate">{exercise.name}</p>
                                                      {exercise.isRecommended && (
                                                        <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-1.5 py-0.5 rounded flex-shrink-0">
                                                          ⭐
                                                        </span>
                                                      )}
                                                    </div>
                                                    <p className="text-xs text-gray-500 truncate">
                                                      {getExerciseEquipment(template.displayId, exercise.id) || exercise.equipment[0] || 'Select equipment'} • {Math.round(volumeContribution * 100)}% volume
                                                    </p>
                                                  </div>
                                                  <div className="flex items-center gap-1 flex-shrink-0">
                                                    <Button
                                                      type="button"
                                                      variant="ghost"
                                                      size="sm"
                                                      className="h-8 w-8 p-0 flex-shrink-0"
                                                      onClick={() => setExpandedExerciseId(expandedExerciseId === exercise.id ? null : exercise.id)}
                                                      title="View details"
                                                    >
                                                      <Info className="h-4 w-4" />
                                                    </Button>
                                                  </div>
                                                </div>
                                                {/* Equipment and Sets Selection Row */}
                                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                                                  <div className="flex-1 min-w-0">
                                                    <Select
                                                      value={getExerciseEquipment(template.displayId, exercise.id) || exercise.equipment[0] || ''}
                                                      onValueChange={(value) => setExerciseEquipmentChoice(template.displayId, exercise.id, value)}
                                                    >
                                                      <SelectTrigger className="w-full h-10 text-xs sm:text-sm">
                                                        <SelectValue placeholder="Equipment" />
                                                      </SelectTrigger>
                                                      <SelectContent>
                                                        {exercise.equipment.map((equip) => (
                                                          <SelectItem key={equip} value={equip}>
                                                            {equip.charAt(0).toUpperCase() + equip.slice(1)}
                                                          </SelectItem>
                                                        ))}
                                                      </SelectContent>
                                                    </Select>
                                                  </div>
                                                  <div className="flex items-center gap-2">
                                                    <div className="flex-1 sm:w-32">
                                                      <Select
                                                        value={getExerciseSets(template.displayId, exercise.id).toString()}
                                                        onValueChange={(value) => setExerciseSetCount(template.displayId, exercise.id, parseInt(value))}
                                                      >
                                                        <SelectTrigger className="w-full h-10 text-xs sm:text-sm">
                                                          <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                          {[1, 2, 3, 4].map(num => (
                                                            <SelectItem key={num} value={num.toString()}>{num} sets</SelectItem>
                                                          ))}
                                                        </SelectContent>
                                                      </Select>
                                                    </div>
                                                    <Button
                                                      type="button"
                                                      variant="ghost"
                                                      size="sm"
                                                      className="h-10 w-10 p-0 flex-shrink-0"
                                                      onClick={() => toggleExerciseSelection(template.displayId, exercise.id)}
                                                    >
                                                      <X className="h-4 w-4" />
                                                    </Button>
                                                  </div>
                                                </div>
                                              </div>
                                              
                                              {/* Expandable Details */}
                                              {expandedExerciseId === exercise.id && (
                                                <div className="px-3 pb-3 pt-1 border-t border-blue-200 dark:border-blue-800 bg-white/50 dark:bg-blue-950/20">
                                                  <div className="space-y-2 text-xs">
                                                    {exercise.description && (
                                                      <div>
                                                        <p className="font-medium text-gray-700 dark:text-gray-300">Description:</p>
                                                        <p className="text-gray-600 dark:text-gray-400">{exercise.description}</p>
                                                      </div>
                                                    )}
                                                    {exercise.instructions && (
                                                      <div>
                                                        <p className="font-medium text-gray-700 dark:text-gray-300">Instructions:</p>
                                                        <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{exercise.instructions}</p>
                                                      </div>
                                                    )}
                                                    <div>
                                                      <p className="font-medium text-gray-700 dark:text-gray-300">Type:</p>
                                                      <Badge variant="secondary" className="text-xs mt-1">
                                                        {exercise.exerciseType}
                                                      </Badge>
                                                    </div>
                                                    <div>
                                                      <p className="font-medium text-gray-700 dark:text-gray-300">Equipment:</p>
                                                      <p className="text-gray-600 dark:text-gray-400">{exercise.equipment.join(', ')}</p>
                                                    </div>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Notes for indirect and minimal volume contributions */}
                                  {(indirectExercises.length > 0 || minimalExercises.length > 0) && (
                                    <div className="space-y-2 mb-3 text-xs">
                                      {indirectExercises.length > 0 && (
                                        <div className="flex items-start gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                                          <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                                          <div>
                                            <p className="font-medium text-yellow-800 dark:text-yellow-300">Indirect Volume</p>
                                            <p className="text-yellow-700 dark:text-yellow-400">
                                              {indirectExercises.length} selected exercise{indirectExercises.length > 1 ? 's' : ''} provide{indirectExercises.length === 1 ? 's' : ''} indirect volume to this muscle (50% contribution):
                                              {indirectExercises.map((exerciseId: string) => {
                                                const exercise = availableExercises.find((ex: Exercise) => ex.id === exerciseId);
                                                return exercise ? ` ${exercise.name}` : '';
                                              }).join(', ')}
                                            </p>
                                          </div>
                                        </div>
                                      )}
                                      {minimalExercises.length > 0 && (
                                        <div className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded">
                                          <Info className="h-4 w-4 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                                          <div>
                                            <p className="font-medium text-gray-700 dark:text-gray-300">Minimal Contribution</p>
                                            <p className="text-gray-600 dark:text-gray-400">
                                              {minimalExercises.length} selected exercise{minimalExercises.length > 1 ? 's' : ''} contribute{minimalExercises.length === 1 ? 's' : ''} minimally to this muscle (25% contribution):
                                              {minimalExercises.map((exerciseId: string) => {
                                                const exercise = availableExercises.find((ex: Exercise) => ex.id === exerciseId);
                                                return exercise ? ` ${exercise.name}` : '';
                                              }).join(', ')}
                                            </p>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* Enhanced Add Exercise Dialog */}
                                  {muscleGroupExercises.length < getExerciseLimit(template, muscleGroup) && (
                                    <Dialog open={dialogOpen && currentTemplateId === template.displayId && currentMuscleGroup === muscleGroup} onOpenChange={(open) => {
                                      setDialogOpen(open);
                                      if (!open) {
                                        // Reset when closing
                                        setExerciseSearchQuery('');
                                        setTempSelectedExercises([]);
                                        setEquipmentFilter('all');
                                        setExpandedExerciseId(null);
                                      }
                                    }}>
                                      <DialogTrigger asChild>
                                        <Button 
                                          type="button" 
                                          variant="outline" 
                                          size="lg" 
                                          className="w-full h-14 md:h-12 hover:bg-primary/5 hover:border-primary transition-all"
                                          onClick={() => {
                                            setCurrentTemplateId(template.displayId);
                                            setCurrentMuscleGroup(muscleGroup);
                                            setDialogOpen(true);
                                            // Load exercises when opening dialog
                                            if (availableExercises.length === 0) {
                                              fetchExercisesForMuscleGroup(muscleGroup);
                                            }
                                            // Initialize with already selected exercises (muscleGroupExercises is already an array of IDs)
                                            setTempSelectedExercises(muscleGroupExercises);
                                          }}
                                        >
                                          <Plus className="w-5 h-5 mr-2" />
                                          <span className="font-medium">Add Exercise ({muscleGroupExercises.length}/{getExerciseLimit(template, muscleGroup)})</span>
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-4xl max-h-[90vh] md:max-h-[85vh] overflow-hidden flex flex-col p-0">
                                        <DialogHeader className="px-4 md:px-6 pt-3 md:pt-6 pb-2 md:pb-4 border-b">
                                          <div className="flex items-start justify-between gap-2 md:gap-4">
                                            <div className="flex-1 min-w-0">
                                              <DialogTitle className="text-lg md:text-2xl font-bold mb-1 md:mb-2">Select Exercises for {muscleGroup}</DialogTitle>
                                              <DialogDescription className="text-xs md:text-base hidden md:block">
                                                Choose exercises that target this muscle group effectively.  
                                                <TooltipProvider>
                                                  <Tooltip>
                                                    <TooltipTrigger asChild>
                                                      <span className="inline-flex items-center gap-1 ml-1 text-primary cursor-help">
                                                        <HelpCircle className="h-4 w-4" />
                                                        Why these exercises?
                                                      </span>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="max-w-xs">
                                                      <p className="text-sm">Exercises shown have 75%+ volume contribution to {muscleGroup}, meaning they effectively target this muscle for growth.</p>
                                                    </TooltipContent>
                                                  </Tooltip>
                                                </TooltipProvider>
                                              </DialogDescription>
                                            </div>
                                            {/* Selection Counter Badge */}
                                            <Badge variant="secondary" className="text-sm md:text-lg px-2 md:px-4 py-1 md:py-2 whitespace-nowrap flex-shrink-0">
                                              {tempSelectedExercises.length}/{getExerciseLimit(template, muscleGroup)}
                                            </Badge>
                                          </div>
                                        </DialogHeader>
                                        
                                        {/* Search and Filter Bar */}
                                        <div className="px-4 md:px-6 py-2 md:py-4 border-b bg-muted/30 space-y-2 md:space-y-3">
                                          <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 md:h-5 w-4 md:w-5 text-muted-foreground" />
                                            <Input
                                              placeholder="Search exercises by name..."
                                              value={exerciseSearchQuery}
                                              onChange={(e) => setExerciseSearchQuery(e.target.value)}
                                              className="pl-9 md:pl-10 h-9 md:h-12 text-sm md:text-base"
                                            />
                                          </div>
                                          <div className="flex gap-1.5 md:gap-2 flex-wrap">
                                            <Button
                                              type="button"
                                              variant={equipmentFilter === 'all' ? 'default' : 'outline'}
                                              size="sm"
                                              className="h-7 md:h-9 text-xs md:text-sm px-2 md:px-3"
                                              onClick={() => setEquipmentFilter('all')}
                                            >
                                              All Equipment
                                            </Button>
                                            <Button
                                              type="button"
                                              variant={equipmentFilter === 'barbell' ? 'default' : 'outline'}
                                              size="sm"
                                              className="h-7 md:h-9 text-xs md:text-sm px-2 md:px-3"
                                              onClick={() => setEquipmentFilter('barbell')}
                                            >
                                              Barbell
                                            </Button>
                                            <Button
                                              type="button"
                                              variant={equipmentFilter === 'dumbbell' ? 'default' : 'outline'}
                                              size="sm"
                                              className="h-7 md:h-9 text-xs md:text-sm px-2 md:px-3"
                                              onClick={() => setEquipmentFilter('dumbbell')}
                                            >
                                              Dumbbell
                                            </Button>
                                            <Button
                                              type="button"
                                              variant={equipmentFilter === 'machine' ? 'default' : 'outline'}
                                              size="sm"
                                              className="h-7 md:h-9 text-xs md:text-sm px-2 md:px-3"
                                              onClick={() => setEquipmentFilter('machine')}
                                            >
                                              Machine
                                            </Button>
                                            <Button
                                              type="button"
                                              variant={equipmentFilter === 'cable' ? 'default' : 'outline'}
                                              size="sm"
                                              className="h-7 md:h-9 text-xs md:text-sm px-2 md:px-3"
                                              onClick={() => setEquipmentFilter('cable')}
                                            >
                                              Cable
                                            </Button>
                                          </div>
                                        </div>
                                        
                                        {/* Exercise Grid - Scrollable */}
                                        <div className="flex-1 overflow-y-auto px-3 md:px-6 py-3 md:py-4">
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                            {availableExercises
                                              .filter((exercise: Exercise) => {
                                                // Filter logic
                                                const exerciseMuscleGroups = getExerciseMuscleGroups(muscleGroup);
                                                const hasHighContribution = exerciseMuscleGroups.some(emg => {
                                                  const contribution = exercise.volumeContributions?.[emg] || 0;
                                                  return contribution >= 0.75;
                                                });
                                                
                                                if (!hasHighContribution) return false;
                                                
                                                // Search filter
                                                if (exerciseSearchQuery && !exercise.name.toLowerCase().includes(exerciseSearchQuery.toLowerCase())) {
                                                  return false;
                                                }
                                                
                                                // Equipment filter
                                                if (equipmentFilter !== 'all' && !exercise.equipment.some(eq => eq.toLowerCase().includes(equipmentFilter.toLowerCase()))) {
                                                  return false;
                                                }
                                                
                                                return true;
                                              })
                                              .map((exercise: Exercise) => {
                                              const exerciseMuscleGroups = getExerciseMuscleGroups(muscleGroup);
                                              const volumeContribution = Math.max(
                                                ...exerciseMuscleGroups.map(emg => exercise.volumeContributions?.[emg] || 0)
                                              );
                                              const isSelected = tempSelectedExercises.includes(exercise.id);
                                              const canSelect = tempSelectedExercises.length < getExerciseLimit(template, muscleGroup);
                                              
                                              return (
                                                <div
                                                  key={exercise.id}
                                                  className={`
                                                    relative border-2 rounded-xl overflow-hidden transition-all duration-200 cursor-pointer
                                                    ${isSelected 
                                                      ? 'border-primary bg-primary/5 shadow-md' 
                                                      : 'border-border hover:border-primary/50 hover:shadow-sm'
                                                    }
                                                    ${!canSelect && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}
                                                  `}
                                                  onClick={() => {
                                                    if (isSelected) {
                                                      setTempSelectedExercises(prev => prev.filter(id => id !== exercise.id));
                                                    } else if (canSelect) {
                                                      setTempSelectedExercises(prev => [...prev, exercise.id]);
                                                    }
                                                  }}
                                                >
                                                  {/* Selection Indicator */}
                                                  {isSelected && (
                                                    <div className="absolute top-3 right-3 z-10 bg-primary text-primary-foreground rounded-full p-1">
                                                      <CheckCircle className="h-5 w-5" />
                                                    </div>
                                                  )}
                                                  
                                                  {/* Recommended Badge */}
                                                  {exercise.isRecommended && (
                                                    <div className="absolute top-3 left-3 z-10">
                                                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-md">
                                                        ⭐ Recommended
                                                      </Badge>
                                                    </div>
                                                  )}
                                                  
                                                  {/* Exercise Image */}
                                                  <div className="relative h-48 md:h-40 bg-muted">
                                                    {exercise.imageUrl ? (
                                                      <Image 
                                                        src={exercise.imageUrl} 
                                                        alt={exercise.name}
                                                        fill
                                                        className="object-cover"
                                                      />
                                                    ) : (
                                                      <div className="w-full h-full flex items-center justify-center">
                                                        <Dumbbell className="h-16 w-16 text-muted-foreground/30" />
                                                      </div>
                                                    )}
                                                  </div>
                                                  
                                                  {/* Exercise Info */}
                                                  <div className="p-4 space-y-2.5">
                                                    <div className="flex items-start justify-between gap-2">
                                                      <h4 className="font-semibold text-base md:text-sm line-clamp-2 flex-1">{exercise.name}</h4>
                                                      <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 flex-shrink-0"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          setExpandedExerciseId(expandedExerciseId === exercise.id ? null : exercise.id);
                                                        }}
                                                        title="View details"
                                                      >
                                                        <Info className="h-4 w-4" />
                                                      </Button>
                                                    </div>
                                                    
                                                    <div className="space-y-1">
                                                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Badge variant="secondary" className="text-xs">
                                                          {exercise.exerciseType}
                                                        </Badge>
                                                        <span className="text-xs">{exercise.equipment.slice(0, 2).join(', ')}</span>
                                                      </div>
                                                      
                                                      {/* Volume Contribution Bar */}
                                                      <div className="space-y-1">
                                                        <div className="flex items-center justify-between text-xs">
                                                          <span className="text-muted-foreground">Volume Contribution</span>
                                                          <TooltipProvider>
                                                            <Tooltip>
                                                              <TooltipTrigger asChild>
                                                                <span className="font-semibold text-primary cursor-help">
                                                                  {Math.round(volumeContribution * 100)}%
                                                                </span>
                                                              </TooltipTrigger>
                                                              <TooltipContent>
                                                                <p className="text-sm">This exercise targets {muscleGroup} with {Math.round(volumeContribution * 100)}% effectiveness</p>
                                                              </TooltipContent>
                                                            </Tooltip>
                                                          </TooltipProvider>
                                                        </div>
                                                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                                          <div 
                                                            className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all"
                                                            style={{ width: `${volumeContribution * 100}%` }}
                                                          />
                                                        </div>
                                                      </div>
                                                    </div>
                                                    
                                                    {/* Expanded Details */}
                                                    {expandedExerciseId === exercise.id && (
                                                      <div className="mt-3 pt-3 border-t space-y-2 text-sm">
                                                        {exercise.description && (
                                                          <div>
                                                            <p className="font-medium mb-1">Description:</p>
                                                            <p className="text-muted-foreground text-xs">{exercise.description}</p>
                                                          </div>
                                                        )}
                                                        <div>
                                                          <p className="font-medium mb-1">Equipment:</p>
                                                          <p className="text-muted-foreground text-xs">{exercise.equipment.join(', ')}</p>
                                                        </div>
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                          
                                          {/* No Results Message */}
                                          {availableExercises.filter((exercise: Exercise) => {
                                            const exerciseMuscleGroups = getExerciseMuscleGroups(muscleGroup);
                                            const hasHighContribution = exerciseMuscleGroups.some(emg => {
                                              const contribution = exercise.volumeContributions?.[emg] || 0;
                                              return contribution >= 0.75;
                                            });
                                            if (!hasHighContribution) return false;
                                            if (exerciseSearchQuery && !exercise.name.toLowerCase().includes(exerciseSearchQuery.toLowerCase())) return false;
                                            if (equipmentFilter !== 'all' && !exercise.equipment.some(eq => eq.toLowerCase().includes(equipmentFilter.toLowerCase()))) return false;
                                            return true;
                                          }).length === 0 && (
                                            <div className="text-center py-12">
                                              <Dumbbell className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                                              <p className="text-lg font-medium text-muted-foreground mb-2">No exercises found</p>
                                              <p className="text-sm text-muted-foreground">
                                                {exerciseSearchQuery || equipmentFilter !== 'all' 
                                                  ? 'Try adjusting your search or filters'
                                                  : 'No more exercises available for this muscle group'
                                                }
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                        
                                        {/* Sticky Footer with Actions */}
                                        <DialogFooter className="px-4 md:px-6 py-2.5 md:py-4 border-t bg-muted/30">
                                          <div className="flex items-center justify-between w-full gap-2 md:gap-4">
                                            <div className="text-xs md:text-sm text-muted-foreground">
                                              <span className="font-medium">{tempSelectedExercises.length}</span>/{getExerciseLimit(template, muscleGroup)}
                                            </div>
                                            <div className="flex gap-2">
                                              <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-8 md:h-10 text-xs md:text-sm"
                                                onClick={() => {
                                                  setDialogOpen(false);
                                                  setTempSelectedExercises([]);
                                                }}
                                              >
                                                Cancel
                                              </Button>
                                              <Button
                                                type="button"
                                                size="sm"
                                                className="h-8 md:h-10 text-xs md:text-sm"
                                                onClick={() => {
                                                  // Apply selections
                                                  const currentExercises = customization.workoutConfiguration[template.displayId] || [];
                                                  const otherMuscleExercises = currentExercises.filter(id => {
                                                    const ex = Object.values(exercisesByMuscleGroup).flat().find(e => e.id === id);
                                                    if (!ex) return false;
                                                    const exerciseMuscleGroups = getExerciseMuscleGroups(muscleGroup);
                                                    const contribution = Math.max(...exerciseMuscleGroups.map(emg => ex.volumeContributions?.[emg] || 0));
                                                    return contribution < 0.75;
                                                  });
                                                  
                                                  setCustomization(prev => ({
                                                    ...prev,
                                                    workoutConfiguration: {
                                                      ...prev.workoutConfiguration,
                                                      [template.displayId]: [...otherMuscleExercises, ...tempSelectedExercises]
                                                    }
                                                  }));
                                                  setHasUnsavedChanges(true);
                                                  setWorkoutUnsavedChanges(prev => ({ ...prev, [template.displayId]: true }));
                                                  setDialogOpen(false);
                                                  setTempSelectedExercises([]);
                                                }}
                                                disabled={tempSelectedExercises.length === 0}
                                              >
                                                <CheckCircle className="mr-1.5 md:mr-2 h-3.5 md:h-4 w-3.5 md:w-4" />
                                                Add Selected
                                              </Button>
                                            </div>
                                          </div>
                                        </DialogFooter>
                                      </DialogContent>
                                    </Dialog>
                                  )}
                                  
                                  {availableExercises.length === 0 && !isLoadingMuscleGroup && muscleGroupExercises.length === 0 && (
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

      {/* Sticky save buttons - fixed to bottom of viewport, only shows when workout has unsaved changes */}
      {Object.entries(workoutUnsavedChanges).map(([templateId, hasChanges]) => {
        if (!hasChanges) return null;
        
        const template = getWorkoutsToDisplay().find((t: WorkoutTemplateWithPattern) => t.displayId === templateId);
        if (!template) return null;
        
        const templateName = getLocalizedContent(template.name, `Workout ${template.order + 1}`);
        const displayName = template.patternLabel 
          ? `${templateName} (${template.patternLabel})`
          : templateName;
        
        return (
          <div 
            key={templateId}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t shadow-2xl px-4 py-3 md:px-6 md:py-4"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse flex-shrink-0"></div>
                <span className="text-sm text-muted-foreground truncate">
                  <span className="font-medium">{displayName}:</span> You have unsaved changes
                </span>
              </div>
              <Button
                onClick={() => saveWorkoutConfiguration(templateId)}
                disabled={isSaving}
                size="default"
                className="shadow-md flex-shrink-0"
              >
                {isSaving ? (
                  <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save {displayName}
              </Button>
            </div>
          </div>
        );
      })}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <Button
          variant="outline"
          onClick={resetToDefaults}
          disabled={isSaving}
          className="w-full sm:w-auto justify-center"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          <span className="text-sm sm:text-base">Reset to Defaults</span>
        </Button>
        
        <div className="flex items-center justify-center sm:justify-end">
          <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-right">
            Use individual save buttons for each section
          </p>
        </div>
      </div>
    </div>
  );
}