'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Loader2, Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import useProgramBuilderStore, { 
  type ProgramCategory, 
  type TrainingExercise 
} from '@/stores/program-builder-store';
import { getProgramBuilderData, saveUserProgram } from '@/app/api/admin/programs/builder-actions';
import EnhancedExerciseSelector from '@/components/program-builder/enhanced-exercise-selector';
import ProgramScheduling from '@/components/program-builder/program-scheduling';

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
    setWorkoutExercises,
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

  const handleApplyTemplate = (exerciseIds: string[]) => {
    setWorkoutExercises(workoutTemplateId, exerciseIds);
  };

  return (
    <EnhancedExerciseSelector
      workoutTemplateId={workoutTemplateId}
      workoutName={workoutName}
      requiredMuscleGroups={requiredMuscleGroups}
      availableExercises={availableExercises}
      selectedExerciseIds={selectedExerciseIds}
      onToggleExercise={(exerciseId) => toggleExerciseForWorkout(workoutTemplateId, exerciseId)}
      onApplyTemplate={handleApplyTemplate}
      canAddMore={canAddMore}
      isValid={isValid}
      selectedCount={selectedCount}
      maxCount={limits.max}
    />
  );
}

function VolumeAnalysisSidebar() {
  const program = useProgramBuilderStore(state => state.program);
  const getWeeklyVolumeAnalysis = useProgramBuilderStore(state => state.getWeeklyVolumeAnalysis);
  
  const weeklyAnalysis = getWeeklyVolumeAnalysis();

  if (!program) return null;

  return (
    <div className="space-y-4">
      {/* Program Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Program Overview</CardTitle>
          <CardDescription>
            Overall program statistics and balance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{weeklyAnalysis.totalWorkouts}</div>
              <div className="text-xs text-muted-foreground">Workouts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{weeklyAnalysis.totalExercises}</div>
              <div className="text-xs text-muted-foreground">Exercises</div>
            </div>
          </div>

          {/* Training Balance */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Exercise Balance</div>
            <div className="flex gap-1 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                C: {weeklyAnalysis.trainingBalance.compoundRatio}%
              </Badge>
              <Badge variant="secondary" className="text-xs">
                I: {weeklyAnalysis.trainingBalance.isolationRatio}%
              </Badge>
              <Badge variant="secondary" className="text-xs">
                U: {weeklyAnalysis.trainingBalance.unilateralRatio}%
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Muscle Volume */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Weekly Volume</CardTitle>
          <CardDescription>
            Total weekly training volume by muscle group
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {weeklyAnalysis.weeklyVolume
              .filter(volume => volume.totalSets > 0)
              .sort((a, b) => b.totalSets - a.totalSets)
              .map((volume) => (
                <div key={volume.muscleGroup} className="flex justify-between items-center">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-sm font-medium truncate">
                      {volume.muscleGroup.charAt(0) + volume.muscleGroup.slice(1).toLowerCase()}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        volume.volumeLoad === 'LOW' ? 'border-yellow-300 text-yellow-800' :
                        volume.volumeLoad === 'MODERATE' ? 'border-green-300 text-green-800' :
                        volume.volumeLoad === 'HIGH' ? 'border-blue-300 text-blue-800' :
                        'border-red-300 text-red-800'
                      }`}
                    >
                      {volume.volumeLoad}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {volume.totalSets.toFixed(1)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {volume.directSets}d+{volume.indirectSets.toFixed(1)}i
                    </div>
                  </div>
                </div>
              ))}
            
            {weeklyAnalysis.weeklyVolume.filter(v => v.totalSets > 0).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No exercises selected yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Muscle Coverage Alerts */}
      {(weeklyAnalysis.muscleGroupCoverage.missing.length > 0 ||
        weeklyAnalysis.muscleGroupCoverage.underTrained.length > 0 ||
        weeklyAnalysis.muscleGroupCoverage.overTrained.length > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Training Alerts</CardTitle>
            <CardDescription>
              Issues requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {weeklyAnalysis.muscleGroupCoverage.missing.length > 0 && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 text-sm">
                  <span className="font-medium">Missing:</span>{' '}
                  {weeklyAnalysis.muscleGroupCoverage.missing.slice(0, 2).join(', ')}
                  {weeklyAnalysis.muscleGroupCoverage.missing.length > 2 && ` +${weeklyAnalysis.muscleGroupCoverage.missing.length - 2}`}
                </AlertDescription>
              </Alert>
            )}

            {weeklyAnalysis.muscleGroupCoverage.underTrained.length > 0 && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800 text-sm">
                  <span className="font-medium">Low volume:</span>{' '}
                  {weeklyAnalysis.muscleGroupCoverage.underTrained.slice(0, 2).join(', ')}
                  {weeklyAnalysis.muscleGroupCoverage.underTrained.length > 2 && ` +${weeklyAnalysis.muscleGroupCoverage.underTrained.length - 2}`}
                </AlertDescription>
              </Alert>
            )}

            {weeklyAnalysis.muscleGroupCoverage.overTrained.length > 0 && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 text-sm">
                  <span className="font-medium">High volume:</span>{' '}
                  {weeklyAnalysis.muscleGroupCoverage.overTrained.slice(0, 2).join(', ')}
                  {weeklyAnalysis.muscleGroupCoverage.overTrained.length > 2 && ` +${weeklyAnalysis.muscleGroupCoverage.overTrained.length - 2}`}
                </AlertDescription>
              </Alert>
            )}
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
    schedule,
    isLoading,
    isSaving,
    setProgram,
    setExercises,
    setSelectedCategory,
    setSchedule,
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

          {/* Program Scheduling */}
          <ProgramScheduling
            totalWorkouts={program.workoutTemplates.length}
            currentSchedule={schedule}
            onScheduleChange={setSchedule}
          />

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