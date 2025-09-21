'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, CheckCircle, Loader2, Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import useProgramBuilderStore, { 
  type ProgramCategory, 
  type TrainingExercise 
} from '@/stores/program-builder-store';
import { getProgramBuilderData, saveUserProgram } from '@/app/api/admin/programs/builder-actions';

interface ExerciseSelectProps {
  workoutTemplateId: string;
  workoutName: string;
  requiredMuscleGroups: string[];
  availableExercises: TrainingExercise[];
}

function ExerciseSelect({ 
  workoutTemplateId, 
  workoutName, 
  requiredMuscleGroups, 
  availableExercises 
}: ExerciseSelectProps) {
  const {
    configuration,
    selectedCategory,
    toggleExerciseForWorkout,
    canAddMoreExercises,
    getTotalSelectedExercisesCount,
    isWorkoutValid,
  } = useProgramBuilderStore();

  const selectedExerciseIds = configuration[workoutTemplateId] || [];
  const selectedCount = getTotalSelectedExercisesCount(workoutTemplateId);
  const canAddMore = canAddMoreExercises(workoutTemplateId);
  const isValid = isWorkoutValid(workoutTemplateId);

  const categoryLimits = {
    'MINIMALIST': { min: 3, max: 4 },
    'ESSENTIALIST': { min: 4, max: 6 },
    'MAXIMALIST': { min: 6, max: 8 },
  };

  const limits = categoryLimits[selectedCategory];

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{workoutName}</CardTitle>
            <CardDescription>
              Required muscle groups: {requiredMuscleGroups.join(', ')}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isValid ? "default" : "destructive"}>
              {selectedCount}/{limits.max} exercises
            </Badge>
            {isValid && <CheckCircle className="h-5 w-5 text-green-500" />}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {availableExercises.map((exercise) => {
            const isSelected = selectedExerciseIds.includes(exercise.id);
            const canSelect = canAddMore || isSelected;
            
            return (
              <div
                key={exercise.id}
                className={`flex items-center space-x-3 p-3 rounded-lg border ${
                  isSelected ? 'bg-primary/5 border-primary' : 'border-border'
                } ${!canSelect ? 'opacity-50' : 'hover:bg-muted/50 cursor-pointer'}`}
                onClick={() => canSelect && toggleExerciseForWorkout(workoutTemplateId, exercise.id)}
              >
                <Checkbox
                  checked={isSelected}
                  disabled={!canSelect}
                  onChange={() => {}} // Handled by div onClick
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">
                    {exercise.name.en || Object.values(exercise.name)[0]}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {exercise.primaryMuscleGroup}
                    {exercise.secondaryMuscleGroups.length > 0 && 
                      ` + ${exercise.secondaryMuscleGroups.join(', ')}`
                    }
                  </div>
                  <Badge variant="outline" className="text-xs mt-1">
                    {exercise.type}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
        
        {selectedCount < limits.min && (
          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Minimum exercises required</AlertTitle>
            <AlertDescription>
              Select at least {limits.min} exercises for this workout (currently {selectedCount}).
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

function VolumeAnalysisSidebar() {
  const { getMuscleGroupVolumes, getMissingMuscleGroups } = useProgramBuilderStore();
  
  const volumes = getMuscleGroupVolumes();
  const missingMuscleGroups = getMissingMuscleGroups();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Training Volume Analysis</CardTitle>
          <CardDescription>
            Volume distribution across muscle groups
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {volumes
              .filter(volume => volume.totalSets > 0)
              .sort((a, b) => b.totalSets - a.totalSets)
              .map((volume) => (
                <div key={volume.muscleGroup} className="flex justify-between items-center">
                  <span className="text-sm font-medium">{volume.muscleGroup}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {volume.directSets}D + {volume.indirectSets}I
                    </span>
                    <Badge variant="outline">
                      {volume.totalSets} sets
                    </Badge>
                  </div>
                </div>
              ))}
            
            {volumes.filter(v => v.totalSets > 0).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No exercises selected yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {missingMuscleGroups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-destructive">Missing Muscle Groups</CardTitle>
            <CardDescription>
              Required muscle groups not covered by selected exercises
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {missingMuscleGroups.map((missing) => (
                <Alert key={missing.workoutTemplateId} variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>{missing.workoutName}</AlertTitle>
                  <AlertDescription>
                    Missing: {missing.missingMuscleGroups.join(', ')}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function ProgramBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params.id as string;
  
  const [isInitializing, setIsInitializing] = useState(true);

  // Helper function to format category names for display
  const formatCategoryName = (category: ProgramCategory) => {
    return category.toLowerCase().replace(/^\w/, c => c.toUpperCase());
  };
  
  const {
    program,
    exercises,
    selectedCategory,
    configuration,
    isLoading,
    isSaving,
    setProgram,
    setExercises,
    setSelectedCategory,
    setIsLoading,
    setIsSaving,
    setWorkoutExercises,
    resetConfiguration,
    getMissingMuscleGroups,
  } = useProgramBuilderStore();

  // Load program data on mount
  useEffect(() => {
    async function loadProgramData() {
      setIsLoading(true);
      try {
        const result = await getProgramBuilderData(programId);
        
        if (!result.success || !result.data) {
          toast.error(result.error || 'Failed to load program data');
          router.push('/programs');
          return;
        }

        const { program: programData, exercises: exercisesData, existingConfiguration } = result.data;
        
        // Transform program data to match store types
        const transformedProgram = {
          ...programData,
          name: programData.name as Record<string, string>,
          description: programData.description as Record<string, string>,
          workoutTemplates: programData.workoutTemplates.map(template => ({
            ...template,
            name: template.name as Record<string, string>,
          })),
        };
        
        // Transform exercises data
        const transformedExercises = exercisesData.map(exercise => ({
          ...exercise,
          name: exercise.name as Record<string, string>,
        }));
        
        setProgram(transformedProgram);
        setExercises(transformedExercises);
        
        // Load existing configuration if available
        if (existingConfiguration) {
          setSelectedCategory(existingConfiguration.categoryType as ProgramCategory);
          // Set configuration directly without triggering category reset
          const config = existingConfiguration.configuration as Record<string, string[]>;
          Object.entries(config).forEach(([workoutId, exerciseIds]) => {
            setWorkoutExercises(workoutId, exerciseIds);
          });
        }
        
      } catch (error) {
        console.error('Error loading program data:', error);
        toast.error('Failed to load program data');
        router.push('/programs');
      } finally {
        setIsLoading(false);
        setIsInitializing(false);
      }
    }

    loadProgramData();
  }, [programId, router, setProgram, setExercises, setSelectedCategory, setWorkoutExercises, setIsLoading]);

  const handleSave = async () => {
    if (!program) return;

    // Validate that all workouts are properly configured
    const missingMuscleGroups = getMissingMuscleGroups();
    if (missingMuscleGroups.length > 0) {
      toast.error('Please complete all workouts before saving');
      return;
    }

    setIsSaving(true);
    try {
      const result = await saveUserProgram({
        trainingProgramId: program.id,
        categoryType: selectedCategory,
        configuration,
      });

      if (result.success && result.data) {
        toast.success(result.data.message);
      } else {
        toast.error(result.error || 'Failed to save program configuration');
      }
    } catch (error) {
      console.error('Error saving program:', error);
      toast.error('Failed to save program configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    resetConfiguration();
    toast.info('Configuration reset');
  };

  if (isInitializing || isLoading || !program) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading program builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Build Your Program: {program.name.en || Object.values(program.name)[0]}
        </h1>
        <p className="text-muted-foreground">
          {program.description.en || Object.values(program.description)[0]}
        </p>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Configuration Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Category Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Training Category</CardTitle>
              <CardDescription>
                Choose your training approach - this affects exercise limits per workout
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select 
                value={selectedCategory} 
                onValueChange={(value) => setSelectedCategory(value as ProgramCategory)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select training category">
                    {selectedCategory && formatCategoryName(selectedCategory)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MINIMALIST">
                    Minimalist (3-4 exercises per workout)
                  </SelectItem>
                  <SelectItem value="ESSENTIALIST">
                    Essentialist (4-6 exercises per workout)
                  </SelectItem>
                  <SelectItem value="MAXIMALIST">
                    Maximalist (6-8 exercises per workout)
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Separator />

          {/* Workout Templates */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Configure Workouts</h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleReset} disabled={isSaving}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Program
                </Button>
              </div>
            </div>

            {program.workoutTemplates
              .sort((a, b) => a.order - b.order)
              .map((template) => (
                <ExerciseSelect
                  key={template.id}
                  workoutTemplateId={template.id}
                  workoutName={template.name.en || Object.values(template.name)[0]}
                  requiredMuscleGroups={template.requiredMuscleGroups}
                  availableExercises={exercises}
                />
              ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <VolumeAnalysisSidebar />
          </div>
        </div>
      </div>
    </div>
  );
}