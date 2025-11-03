'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import SplitSelector, { type SplitSelectorData } from '@/components/SplitSelector';
import { 
  Calendar, 
  Edit, 
  ChevronRight, 
  ChevronLeft, 
  Dumbbell,
  Target,
  CheckCircle2,
  ArrowRight,
  Info,
  Home
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TrainingDayAssignment {
  id: string;
  dayOfWeek: string | null;
  dayNumber: number;
  workoutType: string;
}

interface TrainingSplitStructure {
  id: string;
  daysPerWeek: number;
  pattern: string;
  isWeeklyBased: boolean;
  trainingDayAssignments: TrainingDayAssignment[];
}

interface TrainingSplit {
  id: string;
  name: string;
  description: string;
  focusAreas: string[];
  difficulty: string;
}

interface Workout {
  id: string;
  name: string;
  type: string;
  assignedDays: string[];
}

interface ProgramData {
  id: string;
  name: string;
  description: string;
  status: string;
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
    'Rest': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-300',
    'Full Body': 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300 border-violet-300',
  };
  return colors[workoutType] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-300';
};

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

export default function SplitStructurePage() {
  const params = useParams();
  const router = useRouter();
  const programId = params.id as string;
  const locale = params.locale as string;

  const [program, setProgram] = useState<ProgramData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

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

      setProgram(data.program);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load program');
      toast.error('Failed to load program data');
    } finally {
      setLoading(false);
    }
  };

  const handleSplitSelectorComplete = async (data: SplitSelectorData) => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/programs/${programId}/split-structure`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update split and structure');
      }

      toast.success('Split and structure updated successfully');
      
      // Refresh program data
      await fetchProgramData();
      setIsEditing(false);

      // Show warning if workouts were affected
      if (result.workoutsAffected > 0) {
        toast.info(
          `${result.workoutsAffected} workout(s) may need review due to structure changes`,
          { duration: 5000 }
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update split and structure');
      toast.error('Failed to update split and structure');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const getWeeklySchedule = () => {
    if (!program?.structure.isWeeklyBased) return [];

    // Create a map of day assignments
    const assignmentMap = new Map<string, string>();
    program.structure.trainingDayAssignments.forEach((assignment) => {
      const day = assignment.dayOfWeek || DAYS_OF_WEEK[assignment.dayNumber - 1];
      assignmentMap.set(day, assignment.workoutType);
    });

    // Fill in all 7 days
    return DAYS_OF_WEEK.map((day) => ({
      day,
      workoutType: assignmentMap.get(day) || 'Rest'
    }));
  };

  const handleNextStep = () => {
    // Navigate to workout customization or next step
    router.push(`/${locale}/programs/${programId}/build`);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 max-w-6xl">
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
      <div className="container mx-auto py-8 max-w-6xl">
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

  return (
    <div className="container mx-auto py-8 max-w-6xl">
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
        <span className="text-foreground font-medium">Split & Structure</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Training Split & Structure</h1>
        <p className="text-muted-foreground">
          Configure your training split and weekly structure for {program.name}
        </p>
      </div>

      {saving && (
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>Saving changes...</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      {isEditing ? (
        <div className="space-y-6">
          {/* Edit Mode - Show SplitSelector */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Edit Training Split & Structure</CardTitle>
                  <CardDescription>
                    Select a new split or structure for your program
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={handleCancelEdit} disabled={saving}>
                  Cancel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <SplitSelector
                onComplete={handleSplitSelectorComplete}
                existingData={{
                  splitId: program.split.id,
                  structureId: program.structure.id,
                  customDayAssignments: program.structure.isWeeklyBased
                    ? program.structure.trainingDayAssignments.map((a) => ({
                        dayOfWeek: a.dayOfWeek || DAYS_OF_WEEK[a.dayNumber - 1],
                        dayNumber: a.dayNumber,
                        workoutType: a.workoutType
                      }))
                    : undefined
                }}
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Read-only Mode - Display Current Configuration */}
          
          {/* Current Split Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Dumbbell className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle>Training Split</CardTitle>
                    <CardDescription>Your selected training split</CardDescription>
                  </div>
                </div>
                <Button onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{program.split.name}</h3>
                    <p className="text-muted-foreground mb-3">{program.split.description}</p>
                    <Badge className={getDifficultyColor(program.split.difficulty)}>
                      {program.split.difficulty}
                    </Badge>
                  </div>
                </div>

                {program.split.focusAreas.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2 flex items-center">
                      <Target className="h-4 w-4 mr-1" />
                      Focus Areas
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {program.split.focusAreas.map((area) => (
                        <Badge key={area} variant="outline">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Current Structure Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Calendar className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>Training Structure</CardTitle>
                  <CardDescription>Your weekly training schedule</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Structure Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-3xl font-bold text-primary mb-1">
                      {program.structure.daysPerWeek}
                    </div>
                    <div className="text-sm text-muted-foreground">Days per Week</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-lg font-semibold mb-1">
                      {program.structure.isWeeklyBased ? 'Weekly' : 'Cyclic'}
                    </div>
                    <div className="text-sm text-muted-foreground">Structure Type</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-sm font-medium mb-1">
                      {program.structure.pattern}
                    </div>
                    <div className="text-sm text-muted-foreground">Pattern</div>
                  </div>
                </div>

                <Separator />

                {/* Weekly Schedule */}
                {program.structure.isWeeklyBased && (
                  <div>
                    <h4 className="text-lg font-semibold mb-4 flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      Weekly Schedule
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
                      {getWeeklySchedule().map(({ day, workoutType }) => (
                        <Card
                          key={day}
                          className={cn(
                            "transition-all",
                            workoutType !== 'Rest' && "border-2"
                          )}
                        >
                          <CardHeader className="pb-3 pt-4">
                            <CardTitle className="text-sm font-semibold text-center">
                              {day}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pb-4">
                            <Badge 
                              className={cn(
                                "w-full justify-center py-2",
                                getWorkoutTypeColor(workoutType)
                              )}
                            >
                              {workoutType}
                            </Badge>
                            {workoutType !== 'Rest' && (
                              <div className="mt-2 text-center">
                                <CheckCircle2 className="h-4 w-4 mx-auto text-green-600" />
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cyclic Pattern Info */}
                {!program.structure.isWeeklyBased && (
                  <div>
                    <h4 className="text-lg font-semibold mb-4">Training Days</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {program.structure.trainingDayAssignments.map((assignment) => (
                        <Card key={assignment.id}>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">
                              Day {assignment.dayNumber}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pb-3">
                            <Badge className={getWorkoutTypeColor(assignment.workoutType)}>
                              {assignment.workoutType}
                            </Badge>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          {program.workouts.length > 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                You have {program.workouts.length} workout(s) configured. 
                Changing your split or structure may require adjusting your workouts.
              </AlertDescription>
            </Alert>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6">
            <Button
              variant="outline"
              onClick={() => router.push(`/${locale}/programs/${programId}`)}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Program
            </Button>
            <Button onClick={handleNextStep} size="lg">
              Next: Workout Customization
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
