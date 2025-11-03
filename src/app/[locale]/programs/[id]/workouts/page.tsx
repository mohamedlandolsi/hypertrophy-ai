'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import WorkoutEditor from '@/components/WorkoutEditor';
import WorkoutTemplateImporter from '@/components/WorkoutTemplateImporter';
import { 
  ChevronRight, 
  ChevronLeft, 
  Dumbbell,
  CheckCircle2,
  Circle,
  Calendar,
  Edit,
  Home,
  ArrowRight,
  Info,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Exercise {
  id: string;
  name: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  exerciseType: string;
  volumeContributions: Record<string, number>;
  canBeUnilateral: boolean;
}

interface WorkoutExercise {
  id: string;
  exerciseId: string;
  sets: number;
  reps: string;
  isBilateral: boolean;
  order: number;
  exercise: Exercise;
}

interface Workout {
  id: string;
  name: string;
  type: string;
  assignedDays: string[];
  exercises: WorkoutExercise[];
}

interface TrainingSplit {
  id: string;
  name: string;
  description: string;
  focusAreas: string[];
  difficulty: string;
}

interface TrainingSplitStructure {
  id: string;
  daysPerWeek: number;
  pattern: string;
  isWeeklyBased: boolean;
}

interface ProgramData {
  id: string;
  name: string;
  description: string;
  workoutStructureType: 'REPEATING' | 'AB' | 'ABC';
  split: TrainingSplit;
  structure: TrainingSplitStructure;
  workouts: Workout[];
}

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

const STRUCTURE_LABELS = {
  REPEATING: 'Repeating',
  AB: 'A/B Split',
  ABC: 'A/B/C Split'
};

const getWorkoutTypeColor = (workoutType: string) => {
  const colors: Record<string, string> = {
    'Upper': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-blue-300',
    'Lower': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 border-purple-300',
    'Push': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 border-orange-300',
    'Pull': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300 border-cyan-300',
    'Legs': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 border-indigo-300',
    'Chest': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300 border-pink-300',
    'Back': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300 border-teal-300',
    'Shoulders': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 border-amber-300',
    'Arms': 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300 border-rose-300',
    'Full Body': 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300 border-violet-300',
  };
  return colors[workoutType] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-300';
};

const getMuscleColor = (muscle: string) => {
  const colors: Record<string, string> = {
    'Chest': 'bg-pink-500',
    'Back': 'bg-teal-500',
    'Shoulders': 'bg-amber-500',
    'Biceps': 'bg-blue-500',
    'Triceps': 'bg-purple-500',
    'Forearms': 'bg-slate-500',
    'Quads': 'bg-indigo-500',
    'Hamstrings': 'bg-orange-500',
    'Glutes': 'bg-rose-500',
    'Calves': 'bg-cyan-500',
    'Abs': 'bg-green-500',
    'Lower Back': 'bg-yellow-500',
  };
  return colors[muscle] || 'bg-gray-500';
};

export default function WorkoutsPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params.id as string;
  const locale = params.locale as string;

  const [program, setProgram] = useState<ProgramData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'edit' | 'preview'>('overview');
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [importerOpen, setImporterOpen] = useState(false);

  // Fetch program data
  useEffect(() => {
    fetchProgramData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programId]);

  const fetchProgramData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/programs/${programId}/split-structure`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch program data');
      }

      // Transform the response to match our interface
      const programData: ProgramData = {
        id: data.program.id,
        name: data.program.name,
        description: data.program.description,
        workoutStructureType: data.program.workoutStructureType,
        split: data.program.split,
        structure: data.program.structure,
        workouts: data.program.workouts || []
      };

      setProgram(programData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load program');
      toast.error('Failed to load program data');
    } finally {
      setLoading(false);
    }
  };

  const handleWorkoutClick = (workout: Workout) => {
    setSelectedWorkout(workout);
    setActiveTab('edit');
  };

  const handleWorkoutSave = async () => {
    // Refresh program data after save
    await fetchProgramData();
    toast.success('Workout updated successfully');
  };

  const handleBackToOverview = () => {
    setSelectedWorkout(null);
    setActiveTab('overview');
  };

  const toggleDayExpansion = (day: string) => {
    setExpandedDays((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(day)) {
        newSet.delete(day);
      } else {
        newSet.add(day);
      }
      return newSet;
    });
  };

  const getWorkoutsForDay = (day: string): Workout[] => {
    if (!program) return [];
    return program.workouts.filter((w) => w.assignedDays.includes(day));
  };

  const getProgressStats = () => {
    if (!program) return { completed: 0, total: 0, percentage: 0 };
    
    const total = program.workouts.length;
    const completed = program.workouts.filter((w) => w.exercises.length > 0).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  };

  const canProceedToNext = () => {
    if (!program) return false;
    const stats = getProgressStats();
    return stats.completed === stats.total && stats.total > 0;
  };

  const handleNextStep = () => {
    if (!canProceedToNext()) {
      toast.error('Please complete all workouts before proceeding');
      return;
    }
    // Navigate to next step (e.g., review or finalize)
    router.push(`/${locale}/programs/${programId}/review`);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 max-w-7xl">
        {/* Breadcrumb skeleton */}
        <div className="mb-6">
          <Skeleton className="h-5 w-64" />
        </div>

        {/* Header skeleton */}
        <div className="mb-8">
          <Skeleton className="h-10 w-96 mb-2" />
          <Skeleton className="h-5 w-full max-w-2xl" />
        </div>

        {/* Content skeleton */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className="container mx-auto py-8 max-w-7xl">
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error || 'Program not found'}</AlertDescription>
        </Alert>
        <Button onClick={() => router.push(`/${locale}/programs`)}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Programs
        </Button>
      </div>
    );
  }

  const progressStats = getProgressStats();

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
        <Link href={`/${locale}/programs`} className="hover:text-foreground transition-colors flex items-center">
          <Home className="h-4 w-4 mr-1" />
          Programs
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/${locale}/programs/${programId}`} className="hover:text-foreground transition-colors">
          {program.name}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">Workout Customization</span>
      </nav>

      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{program.name}</h1>
            <p className="text-muted-foreground mb-3">{program.description}</p>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="text-sm">
                {program.split.name}
              </Badge>
              <Badge variant="outline" className="text-sm">
                {STRUCTURE_LABELS[program.workoutStructureType]}
              </Badge>
              <Badge variant="outline" className="text-sm">
                {program.structure.daysPerWeek} days/week
              </Badge>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push(`/${locale}/programs/${programId}/split-structure`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Structure
          </Button>
        </div>

        {/* Progress Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Dumbbell className="h-5 w-5 text-primary" />
                <span className="font-semibold">Workout Completion</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {progressStats.completed} of {progressStats.total} complete
              </span>
            </div>
            <Progress value={progressStats.percentage} className="h-2" />
            <div className="mt-2 text-sm text-muted-foreground">
              {progressStats.percentage}% complete
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'overview' | 'edit' | 'preview')}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <Dumbbell className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="edit" disabled={!selectedWorkout} className="flex items-center space-x-2">
            <Edit className="h-4 w-4" />
            <span>Edit Workout</span>
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Weekly Preview</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Structure Overview */}
        <TabsContent value="overview" className="space-y-6">
          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Your Workouts</h3>
              <p className="text-sm text-muted-foreground">
                Manage and customize your training workouts
              </p>
            </div>
            <Button onClick={() => setImporterOpen(true)} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Import Template
            </Button>
          </div>

          {/* Info Alert */}
          {progressStats.total === 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                No workouts have been created yet. You can import a template or create workouts based on your selected split and structure type.
              </AlertDescription>
            </Alert>
          )}

          {/* Workouts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {program.workouts.map((workout) => {
              const isComplete = workout.exercises.length > 0;
              
              return (
                <Card
                  key={workout.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-lg",
                    isComplete ? "border-green-500 border-2" : "border-muted"
                  )}
                  onClick={() => handleWorkoutClick(workout)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-1">{workout.name}</CardTitle>
                        <Badge className={getWorkoutTypeColor(workout.type)}>
                          {workout.type}
                        </Badge>
                      </div>
                      {isComplete ? (
                        <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                      ) : (
                        <Circle className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Assigned Days */}
                      {workout.assignedDays.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1 flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            Assigned Days
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {workout.assignedDays.map((day) => (
                              <Badge key={day} variant="secondary" className="text-xs">
                                {day.substring(0, 3)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <Separator />

                      {/* Exercise Count */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Exercises</span>
                        <span className="font-semibold">{workout.exercises.length}</span>
                      </div>

                      {/* Status */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <Badge variant={isComplete ? "default" : "secondary"}>
                          {isComplete ? "Complete" : "Incomplete"}
                        </Badge>
                      </div>
                    </div>

                    <Button className="w-full mt-4" variant={isComplete ? "outline" : "default"}>
                      <Edit className="h-4 w-4 mr-2" />
                      {isComplete ? "Edit Workout" : "Configure Workout"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}

            {/* Add Workout Card (if structure allows) */}
            {/* Note: This would depend on business logic for whether more workouts can be added */}
          </div>

          {/* Checklist */}
          {program.workouts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Progress Checklist</CardTitle>
                <CardDescription>Complete all workouts to proceed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {program.workouts.map((workout) => {
                    const isComplete = workout.exercises.length > 0;
                    return (
                      <div
                        key={workout.id}
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                        onClick={() => handleWorkoutClick(workout)}
                      >
                        {isComplete ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className={cn(
                          "flex-1",
                          isComplete && "text-muted-foreground"
                        )}>
                          {workout.name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {workout.exercises.length} exercises
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab 2: Edit Workout */}
        <TabsContent value="edit" className="space-y-6">
          {selectedWorkout ? (
            <div className="space-y-4">
              {/* Back Button */}
              <Button variant="outline" onClick={handleBackToOverview}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Overview
              </Button>

              {/* WorkoutEditor Component */}
              <WorkoutEditor
                workoutId={selectedWorkout.id}
                programId={programId}
                onSave={handleWorkoutSave}
              />
            </div>
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Select a workout from the Overview tab to edit it.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Tab 3: Weekly Preview */}
        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Training Schedule</CardTitle>
              <CardDescription>
                View your complete training week with all workouts and exercises
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4">
                  {DAYS_OF_WEEK.map((day) => {
                    const dayWorkouts = getWorkoutsForDay(day);
                    const isExpanded = expandedDays.has(day);
                    const hasWorkouts = dayWorkouts.length > 0;

                    return (
                      <Card key={day} className={cn(
                        "transition-all",
                        !hasWorkouts && "opacity-60"
                      )}>
                        <CardHeader
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => hasWorkouts && toggleDayExpansion(day)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Calendar className="h-5 w-5 text-primary" />
                              <div>
                                <CardTitle className="text-lg">{day}</CardTitle>
                                <CardDescription>
                                  {hasWorkouts ? `${dayWorkouts.length} workout(s)` : 'Rest Day'}
                                </CardDescription>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {hasWorkouts && (
                                <>
                                  <div className="flex -space-x-1">
                                    {dayWorkouts.map((workout) => (
                                      <Badge
                                        key={workout.id}
                                        className={cn(
                                          "text-xs",
                                          getWorkoutTypeColor(workout.type)
                                        )}
                                      >
                                        {workout.type}
                                      </Badge>
                                    ))}
                                  </div>
                                  {isExpanded ? (
                                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                  ) : (
                                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </CardHeader>

                        {isExpanded && hasWorkouts && (
                          <CardContent>
                            <div className="space-y-6">
                              {dayWorkouts.map((workout, workoutIndex) => (
                                <div key={workout.id}>
                                  {workoutIndex > 0 && <Separator className="my-4" />}
                                  
                                  {/* Workout Header */}
                                  <div className="mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                      <h4 className="font-semibold text-lg">{workout.name}</h4>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleWorkoutClick(workout)}
                                      >
                                        <Edit className="h-3 w-3 mr-1" />
                                        Edit
                                      </Button>
                                    </div>
                                    <Badge className={getWorkoutTypeColor(workout.type)}>
                                      {workout.type}
                                    </Badge>
                                  </div>

                                  {/* Exercises List */}
                                  {workout.exercises.length > 0 ? (
                                    <div className="space-y-3">
                                      {workout.exercises
                                        .sort((a, b) => a.order - b.order)
                                        .map((ex, index) => (
                                          <div
                                            key={ex.id}
                                            className="flex items-start space-x-3 p-3 rounded-lg bg-muted"
                                          >
                                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                                              {index + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <p className="font-medium">{ex.exercise.name}</p>
                                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                                <Badge
                                                  variant="secondary"
                                                  className="text-xs"
                                                >
                                                  {ex.sets} × {ex.reps}
                                                </Badge>
                                                <Badge
                                                  variant="outline"
                                                  className="text-xs"
                                                >
                                                  {ex.exercise.primaryMuscle}
                                                </Badge>
                                                {!ex.isBilateral && ex.exercise.canBeUnilateral && (
                                                  <Badge variant="secondary" className="text-xs">
                                                    Unilateral
                                                  </Badge>
                                                )}
                                              </div>
                                            </div>
                                            {/* Muscle indicator */}
                                            <div
                                              className={cn(
                                                "w-2 h-full rounded-full flex-shrink-0",
                                                getMuscleColor(ex.exercise.primaryMuscle)
                                              )}
                                            />
                                          </div>
                                        ))}
                                    </div>
                                  ) : (
                                    <Alert>
                                      <AlertCircle className="h-4 w-4" />
                                      <AlertDescription>
                                        No exercises configured yet. Click Edit to add exercises.
                                      </AlertDescription>
                                    </Alert>
                                  )}
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-8 mt-8 border-t">
        <Button
          variant="outline"
          onClick={() => router.push(`/${locale}/programs/${programId}/split-structure`)}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Structure
        </Button>

        <Button
          size="lg"
          onClick={handleNextStep}
          disabled={!canProceedToNext()}
        >
          Complete & Next
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Warning if incomplete */}
      {!canProceedToNext() && progressStats.total > 0 && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please complete all {progressStats.total - progressStats.completed} remaining workout(s) before proceeding to the next step.
          </AlertDescription>
        </Alert>
      )}

      {/* Workout Template Importer */}
      <WorkoutTemplateImporter
        programId={programId}
        open={importerOpen}
        onOpenChange={setImporterOpen}
        onImportSuccess={fetchProgramData}
      />
    </div>
  );
}
