'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dumbbell, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  ChevronRight,
  Users,
  Target,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types based on Prisma schema
interface TrainingSplit {
  id: string;
  name: string;
  description: string;
  focusAreas: string[];
  difficulty: string;
  isActive: boolean;
  _count: {
    trainingStructures: number;
  };
}

interface TrainingDayAssignment {
  id: string;
  structureId: string;
  dayOfWeek: string | null;
  dayNumber: number;
  workoutType: string;
}

interface TrainingSplitStructure {
  id: string;
  splitId: string;
  daysPerWeek: number;
  pattern: string;
  isWeeklyBased: boolean;
  trainingDayAssignments: TrainingDayAssignment[];
  _count: {
    customTrainingPrograms: number;
  };
}

export interface SplitSelectorData {
  splitId: string;
  structureId: string;
  customDayAssignments?: CustomDayAssignment[];
}

export interface CustomDayAssignment {
  dayOfWeek: string;
  dayNumber: number;
  workoutType: string;
}

interface SplitSelectorProps {
  onComplete: (data: SplitSelectorData) => void;
  existingData?: SplitSelectorData;
}

// Days of the week for weekly-based structures
const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

// Difficulty colors
const getDifficultyColor = (difficulty: string) => {
  switch (difficulty.toLowerCase()) {
    case 'beginner':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'intermediate':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'advanced':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  }
};

// Workout type colors
const getWorkoutTypeColor = (workoutType: string) => {
  const colors: Record<string, string> = {
    'Upper': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    'Lower': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    'Push': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    'Pull': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
    'Legs': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    'Chest': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
    'Back': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
    'Shoulders': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
    'Arms': 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300',
    'Rest': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    'Full Body': 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300',
  };
  return colors[workoutType] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
};

export default function SplitSelector({ onComplete, existingData }: SplitSelectorProps) {
  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1: Split selection
  const [splits, setSplits] = useState<TrainingSplit[]>([]);
  const [selectedSplit, setSelectedSplit] = useState<TrainingSplit | null>(null);
  const [loadingSplits, setLoadingSplits] = useState(true);
  const [splitsError, setSplitsError] = useState<string | null>(null);
  
  // Step 2: Structure selection
  const [structures, setStructures] = useState<TrainingSplitStructure[]>([]);
  const [selectedStructure, setSelectedStructure] = useState<TrainingSplitStructure | null>(null);
  const [loadingStructures, setLoadingStructures] = useState(false);
  const [structuresError, setStructuresError] = useState<string | null>(null);
  
  // Step 3: Day customization (for weekly-based structures)
  const [customDayAssignments, setCustomDayAssignments] = useState<CustomDayAssignment[]>([]);

  // Load existing data if provided
  useEffect(() => {
    if (existingData) {
      // Load split and structure based on existing data
      loadExistingData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingData]);

  const loadExistingData = async () => {
    if (!existingData) return;
    
    try {
      // Fetch the split
      const splitsResponse = await fetch('/api/training-splits');
      const splitsData = await splitsResponse.json();
      
      if (splitsData.success) {
        const split = splitsData.splits.find((s: TrainingSplit) => s.id === existingData.splitId);
        if (split) {
          setSelectedSplit(split);
          
          // Fetch structures
          const structuresResponse = await fetch(`/api/training-splits/${existingData.splitId}/structures`);
          const structuresData = await structuresResponse.json();
          
          if (structuresData.success) {
            setStructures(structuresData.structures);
            const structure = structuresData.structures.find(
              (s: TrainingSplitStructure) => s.id === existingData.structureId
            );
            
            if (structure) {
              setSelectedStructure(structure);
              
              if (structure.isWeeklyBased) {
                if (existingData.customDayAssignments) {
                  setCustomDayAssignments(existingData.customDayAssignments);
                } else {
                  initializeDayAssignments(structure);
                }
                setCurrentStep(3);
              } else {
                setCurrentStep(2);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading existing data:', error);
    }
  };

  // Fetch training splits on mount
  useEffect(() => {
    fetchSplits();
  }, []);

  const fetchSplits = async () => {
    try {
      setLoadingSplits(true);
      setSplitsError(null);
      
      const response = await fetch('/api/training-splits');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch training splits');
      }
      
      setSplits(data.splits);
    } catch (error) {
      setSplitsError(error instanceof Error ? error.message : 'Failed to load training splits');
    } finally {
      setLoadingSplits(false);
    }
  };

  const fetchStructures = async (splitId: string) => {
    try {
      setLoadingStructures(true);
      setStructuresError(null);
      
      const response = await fetch(`/api/training-splits/${splitId}/structures`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch structures');
      }
      
      setStructures(data.structures);
    } catch (error) {
      setStructuresError(error instanceof Error ? error.message : 'Failed to load structures');
    } finally {
      setLoadingStructures(false);
    }
  };

  const handleSplitSelect = async (split: TrainingSplit) => {
    setSelectedSplit(split);
    await fetchStructures(split.id);
    setCurrentStep(2);
  };

  const initializeDayAssignments = (structure: TrainingSplitStructure) => {
    // Create a map to track assignments by day to prevent duplicates
    const dayMap = new Map<string, CustomDayAssignment>();
    
    // Add assignments from structure (prefer these)
    structure.trainingDayAssignments.forEach((assignment) => {
      const dayOfWeek = assignment.dayOfWeek || DAYS_OF_WEEK[assignment.dayNumber - 1];
      dayMap.set(dayOfWeek, {
        dayOfWeek,
        dayNumber: assignment.dayNumber,
        workoutType: assignment.workoutType
      });
    });
    
    // Fill remaining days with "Rest"
    DAYS_OF_WEEK.forEach((day, index) => {
      if (!dayMap.has(day)) {
        dayMap.set(day, {
          dayOfWeek: day,
          dayNumber: index + 1,
          workoutType: 'Rest'
        });
      }
    });
    
    // Convert map to array and sort by day of week
    const assignments = Array.from(dayMap.values()).sort((a, b) => {
      return DAYS_OF_WEEK.indexOf(a.dayOfWeek) - DAYS_OF_WEEK.indexOf(b.dayOfWeek);
    });
    
    setCustomDayAssignments(assignments);
  };

  const handleStructureSelect = (structure: TrainingSplitStructure) => {
    setSelectedStructure(structure);
    
    if (structure.isWeeklyBased) {
      initializeDayAssignments(structure);
      setCurrentStep(3);
    } else {
      // Complete immediately for non-weekly structures
      handleComplete(structure, []);
    }
  };

  const handleDayAssignmentChange = (dayOfWeek: string, newWorkoutType: string) => {
    setCustomDayAssignments(prev => 
      prev.map(assignment => 
        assignment.dayOfWeek === dayOfWeek
          ? { ...assignment, workoutType: newWorkoutType }
          : assignment
      )
    );
  };

  const handleComplete = (structure?: TrainingSplitStructure, assignments?: CustomDayAssignment[]) => {
    if (!selectedSplit || !selectedStructure) return;
    
    const finalStructure = structure || selectedStructure;
    const finalAssignments = assignments !== undefined ? assignments : customDayAssignments;
    
    onComplete({
      splitId: selectedSplit.id,
      structureId: finalStructure.id,
      customDayAssignments: finalStructure.isWeeklyBased ? finalAssignments : undefined
    });
  };

  const calculateEstimatedTime = (structure: TrainingSplitStructure) => {
    // Rough estimate: 60-90 minutes per workout day
    const avgMinutesPerWorkout = 75;
    const totalMinutes = structure.daysPerWeek * avgMinutesPerWorkout;
    const hours = Math.round(totalMinutes / 60 * 10) / 10;
    return `${hours} hrs/week`;
  };

  // Get unique workout types for the structure
  const getUniqueWorkoutTypes = (structure: TrainingSplitStructure) => {
    return [...new Set(structure.trainingDayAssignments.map(a => a.workoutType))];
  };

  // Validate day assignments
  const validateDayAssignments = () => {
    if (!selectedStructure) return false;
    
    const workoutDays = customDayAssignments.filter(a => a.workoutType !== 'Rest');
    return workoutDays.length === selectedStructure.daysPerWeek;
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-center space-x-4">
        <div className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
          currentStep >= 1 
            ? "bg-primary text-primary-foreground border-primary" 
            : "border-muted-foreground text-muted-foreground"
        )}>
          {currentStep > 1 ? <CheckCircle2 className="h-5 w-5" /> : "1"}
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
        <div className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
          currentStep >= 2 
            ? "bg-primary text-primary-foreground border-primary" 
            : "border-muted-foreground text-muted-foreground"
        )}>
          {currentStep > 2 ? <CheckCircle2 className="h-5 w-5" /> : "2"}
        </div>
        {selectedStructure?.isWeeklyBased && (
          <>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
              currentStep >= 3 
                ? "bg-primary text-primary-foreground border-primary" 
                : "border-muted-foreground text-muted-foreground"
            )}>
              3
            </div>
          </>
        )}
      </div>

      {/* Step 1: Select Training Split */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Choose Your Training Split</h2>
            <p className="text-muted-foreground">
              Select a training split that matches your goals and experience level
            </p>
          </div>

          {splitsError && (
            <Alert variant="destructive">
              <AlertDescription>{splitsError}</AlertDescription>
            </Alert>
          )}

          {loadingSplits ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="cursor-pointer">
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : splits.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No training splits available</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {splits.map((split) => (
                <Card
                  key={split.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-lg hover:border-primary",
                    selectedSplit?.id === split.id && "border-primary shadow-lg"
                  )}
                  onClick={() => handleSplitSelect(split)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Dumbbell className="h-6 w-6 text-primary" />
                      <Badge className={getDifficultyColor(split.difficulty)}>
                        {split.difficulty}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{split.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {split.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Focus areas */}
                      {split.focusAreas.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1 flex items-center">
                            <Target className="h-3 w-3 mr-1" />
                            Focus Areas
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {split.focusAreas.slice(0, 3).map((area) => (
                              <Badge key={area} variant="outline" className="text-xs">
                                {area}
                              </Badge>
                            ))}
                            {split.focusAreas.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{split.focusAreas.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Structure count */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {split._count.trainingStructures} structure{split._count.trainingStructures !== 1 ? 's' : ''}
                        </span>
                        <ArrowRight className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Select Structure */}
      {currentStep === 2 && selectedSplit && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Choose Your Training Structure</h2>
              <p className="text-muted-foreground">
                Select a weekly structure for <strong>{selectedSplit.name}</strong>
              </p>
            </div>
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>

          {structuresError && (
            <Alert variant="destructive">
              <AlertDescription>{structuresError}</AlertDescription>
            </Alert>
          )}

          {loadingStructures ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : structures.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No structures available for this split</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {structures.map((structure) => (
                <Card
                  key={structure.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-lg hover:border-primary",
                    selectedStructure?.id === structure.id && "border-primary shadow-lg"
                  )}
                  onClick={() => handleStructureSelect(structure)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Calendar className="h-6 w-6 text-primary" />
                      <Badge variant={structure.isWeeklyBased ? "default" : "secondary"}>
                        {structure.isWeeklyBased ? "Weekly" : "Cyclic"}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">
                      {structure.daysPerWeek} Days Per Week
                    </CardTitle>
                    <CardDescription>
                      {structure.pattern}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Estimated time */}
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-2" />
                        {calculateEstimatedTime(structure)}
                      </div>
                      
                      {/* Popularity indicator */}
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="h-4 w-4 mr-2" />
                        {structure._count.customTrainingPrograms} user{structure._count.customTrainingPrograms !== 1 ? 's' : ''}
                      </div>
                      
                      {/* Workout types */}
                      {structure.trainingDayAssignments.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Workout Types</p>
                          <div className="flex flex-wrap gap-1">
                            {getUniqueWorkoutTypes(structure).slice(0, 3).map((type) => (
                              <Badge key={type} className={getWorkoutTypeColor(type)} variant="outline">
                                {type}
                              </Badge>
                            ))}
                            {getUniqueWorkoutTypes(structure).length > 3 && (
                              <Badge variant="outline">
                                +{getUniqueWorkoutTypes(structure).length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Action button */}
                      <Button 
                        className="w-full mt-2" 
                        variant={selectedStructure?.id === structure.id ? "default" : "outline"}
                      >
                        {structure.isWeeklyBased ? "Customize Schedule" : "Select Structure"}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Customize Day Assignments (Weekly-based only) */}
      {currentStep === 3 && selectedSplit && selectedStructure && selectedStructure.isWeeklyBased && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Customize Your Weekly Schedule</h2>
              <p className="text-muted-foreground">
                Assign workout types to each day of the week ({selectedStructure.daysPerWeek} workout days)
              </p>
            </div>
            <Button variant="outline" onClick={() => setCurrentStep(2)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Click on any day to change its workout type. Make sure you have exactly{' '}
              <strong>{selectedStructure.daysPerWeek} workout days</strong> (non-rest days) in your schedule.
            </AlertDescription>
          </Alert>

          {/* Day assignment grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {customDayAssignments.map((assignment) => {
              const uniqueWorkoutTypes = getUniqueWorkoutTypes(selectedStructure);
              
              return (
                <Card
                  key={assignment.dayOfWeek}
                  className={cn(
                    "transition-all",
                    assignment.workoutType !== 'Rest' && "border-primary"
                  )}
                >
                  <CardHeader className="pb-2 px-3">
                    <CardTitle className="text-sm font-medium text-center">
                      {assignment.dayOfWeek}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3 px-3 pt-0">
                    <select
                      value={assignment.workoutType}
                      onChange={(e) => handleDayAssignmentChange(assignment.dayOfWeek, e.target.value)}
                      className="w-full text-xs p-2 border rounded-md bg-background"
                    >
                      <option value="Rest">Rest</option>
                      {uniqueWorkoutTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    <Badge 
                      className={cn("w-full mt-2 justify-center text-xs", getWorkoutTypeColor(assignment.workoutType))}
                    >
                      {assignment.workoutType}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Validation summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Workout Days: {customDayAssignments.filter(a => a.workoutType !== 'Rest').length} /{' '}
                    {selectedStructure.daysPerWeek}
                  </p>
                  {!validateDayAssignments() && (
                    <p className="text-sm text-destructive">
                      Please adjust your schedule to have exactly {selectedStructure.daysPerWeek} workout days
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => handleComplete()}
                  disabled={!validateDayAssignments()}
                  size="lg"
                >
                  Complete Setup
                  <CheckCircle2 className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
