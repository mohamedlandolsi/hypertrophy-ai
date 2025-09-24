'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Play, 
  Pause, 
  CheckCircle, 
  Clock, 
  Target, 
  TrendingUp, 
  Calendar,
  Dumbbell,
  Trophy,
  BarChart3,
  BookOpen,
  Settings,
  Share2,
  Download,
  MessageCircle
} from 'lucide-react';

import { SetCompletionModal } from './set-completion-modal';

interface ExerciseSet {
  id: string;
  reps: number | string; // Can be "8-12" or specific number
  weight?: number;
  restPeriod: number; // in seconds
  isCompleted?: boolean;
  actualReps?: number;
  actualWeight?: number;
  rpe?: number; // Rate of Perceived Exertion
  notes?: string;
}

interface ExerciseDemo {
  id: string;
  name: string;
  description: string;
  instructions: string[];
  videoUrl?: string;
  imageUrl?: string;
  muscleGroups: string[];
  equipment: string[];
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  tips: string[];
  commonMistakes: string[];
  sets: ExerciseSet[];
  estimatedDuration: number; // in minutes
}

interface WorkoutSession {
  id: string;
  name: string;
  description: string;
  day: number;
  week: number;
  exercises: ExerciseDemo[];
  totalVolume: number;
  estimatedDuration: number;
  targetMuscleGroups: string[];
  isCompleted?: boolean;
  completedAt?: Date;
  userRating?: number;
  userNotes?: string;
}

interface ProgramProgress {
  totalWorkouts: number;
  completedWorkouts: number;
  currentWeek: number;
  totalWeeks: number;
  totalVolume: number;
  completedVolume: number;
  streakDays: number;
  lastWorkoutDate?: Date;
}

interface InteractiveProgramViewerProps {
  programName: string;
  programDescription: string;
  workouts: WorkoutSession[];
  progress: ProgramProgress;
  onUpdateProgress?: (workoutId: string, exerciseId: string, setId: string, data: Partial<ExerciseSet>) => void;
  onCompleteWorkout?: (workoutId: string, rating: number, notes: string) => void;
  onShareProgress?: () => void;
}

export function InteractiveProgramViewer({
  programName,
  programDescription,
  workouts,
  progress,
  onUpdateProgress,
  onCompleteWorkout,
  onShareProgress
}: InteractiveProgramViewerProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [currentWorkout, setCurrentWorkout] = useState<WorkoutSession | null>(null);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [workoutTimer, setWorkoutTimer] = useState(0);
  const [restTimer, setRestTimer] = useState(0);
  const [setModalOpen, setSetModalOpen] = useState(false);
  const [selectedSetData, setSelectedSetData] = useState<{
    workout: WorkoutSession;
    exercise: ExerciseDemo;
    set: ExerciseSet;
    setIndex: number;
  } | null>(null);

  // Timer effects
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isWorkoutActive) {
      interval = setInterval(() => {
        setWorkoutTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isWorkoutActive]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [restTimer]);

  // Get next workout to do
  const getNextWorkout = () => {
    return workouts.find(w => !w.isCompleted) || workouts[0];
  };

  const nextWorkout = getNextWorkout();

  // Start workout
  const startWorkout = (workout: WorkoutSession) => {
    setCurrentWorkout(workout);
    setIsWorkoutActive(true);
    setWorkoutTimer(0);
    setActiveTab('workout');
  };

  // Complete set
  const completeSet = (exerciseId: string, setId: string, data: Partial<ExerciseSet>) => {
    if (onUpdateProgress && currentWorkout) {
      onUpdateProgress(currentWorkout.id, exerciseId, setId, { ...data, isCompleted: true });
    }
    
    // Find the set's rest period and start rest timer
    const exercise = currentWorkout?.exercises.find(e => e.id === exerciseId);
    const set = exercise?.sets.find(s => s.id === setId);
    if (set?.restPeriod) {
      setRestTimer(set.restPeriod);
    }

    setSetModalOpen(false);
    setSelectedSetData(null);
  };

  // Open set completion modal
  const openSetModal = (workout: WorkoutSession, exercise: ExerciseDemo, set: ExerciseSet, setIndex: number) => {
    setSelectedSetData({ workout, exercise, set, setIndex });
    setSetModalOpen(true);
  };

  // Format time helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate completion percentage
  const completionPercentage = Math.round((progress.completedWorkouts / progress.totalWorkouts) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src="/program-avatar.png" alt={programName} />
              <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {programName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold">{programName}</h1>
              <p className="text-muted-foreground">{programDescription}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onShareProgress}>
              <Share2 className="w-4 h-4 mr-2" />
              Share Progress
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Progress Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Your Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{progress.completedWorkouts}</div>
                <div className="text-sm text-muted-foreground">Workouts Complete</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{progress.currentWeek}</div>
                <div className="text-sm text-muted-foreground">Current Week</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{progress.streakDays}</div>
                <div className="text-sm text-muted-foreground">Day Streak</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{completionPercentage}%</div>
                <div className="text-sm text-muted-foreground">Program Complete</div>
              </div>
            </div>
            <Progress value={completionPercentage} className="h-3" />
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">
              <BookOpen className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="workout">
              <Dumbbell className="w-4 h-4 mr-2" />
              Workout
            </TabsTrigger>
            <TabsTrigger value="progress">
              <BarChart3 className="w-4 h-4 mr-2" />
              Progress
            </TabsTrigger>
            <TabsTrigger value="schedule">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule
            </TabsTrigger>
            <TabsTrigger value="community">
              <MessageCircle className="w-4 h-4 mr-2" />
              Community
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Next Workout Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Next Workout
                </CardTitle>
              </CardHeader>
              <CardContent>
                {nextWorkout && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-semibold">{nextWorkout.name}</h3>
                        <p className="text-muted-foreground">{nextWorkout.description}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <Badge variant="outline">
                            <Clock className="w-3 h-3 mr-1" />
                            {nextWorkout.estimatedDuration} min
                          </Badge>
                          <Badge variant="outline">
                            <Dumbbell className="w-3 h-3 mr-1" />
                            {nextWorkout.exercises.length} exercises
                          </Badge>
                          <Badge variant="outline">Week {nextWorkout.week}</Badge>
                        </div>
                      </div>
                      <Button 
                        size="lg" 
                        onClick={() => startWorkout(nextWorkout)}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        <Play className="w-5 h-5 mr-2" />
                        Start Workout
                      </Button>
                    </div>
                    
                    {/* Exercise Preview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {nextWorkout.exercises.slice(0, 4).map((exercise) => (
                        <div key={exercise.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                            <Dumbbell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{exercise.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {exercise.sets.length} sets × {exercise.muscleGroups.join(', ')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Week Overview */}
            <Card>
              <CardHeader>
                <CardTitle>This Week&apos;s Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {workouts
                    .filter(w => w.week === progress.currentWeek)
                    .map((workout) => (
                      <div key={workout.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {workout.isCompleted ? (
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          ) : (
                            <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />
                          )}
                          <div>
                            <div className="font-medium">{workout.name}</div>
                            <div className="text-sm text-muted-foreground">Day {workout.day}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={workout.isCompleted ? 'default' : 'secondary'}>
                            {workout.isCompleted ? 'Completed' : 'Pending'}
                          </Badge>
                          {!workout.isCompleted && (
                            <Button size="sm" variant="outline" onClick={() => startWorkout(workout)}>
                              <Play className="w-4 h-4 mr-1" />
                              Start
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Active Workout Tab */}
          <TabsContent value="workout" className="space-y-6">
            {currentWorkout ? (
              <div className="space-y-6">
                {/* Workout Header */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {isWorkoutActive ? (
                            <Pause className="w-5 h-5 text-orange-600" />
                          ) : (
                            <Play className="w-5 h-5 text-green-600" />
                          )}
                          {currentWorkout.name}
                        </CardTitle>
                        <CardDescription>{currentWorkout.description}</CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {formatTime(workoutTimer)}
                        </div>
                        <div className="text-sm text-muted-foreground">Workout Time</div>
                      </div>
                    </div>
                  </CardHeader>
                  {restTimer > 0 && (
                    <CardContent>
                      <Alert>
                        <Clock className="h-4 w-4" />
                        <AlertDescription>
                          Rest Period: <strong>{formatTime(restTimer)}</strong> remaining
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  )}
                </Card>

                {/* Exercise List */}
                {currentWorkout.exercises.map((exercise, index) => (
                  <Card key={exercise.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Exercise {index + 1}: {exercise.name}</span>
                        <Badge variant="outline">{exercise.difficulty}</Badge>
                      </CardTitle>
                      <CardDescription>{exercise.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Sets Table */}
                      <div className="space-y-3">
                        <div className="grid grid-cols-6 gap-2 text-sm font-medium text-muted-foreground border-b pb-2">
                          <div>Set</div>
                          <div>Target</div>
                          <div>Weight</div>
                          <div>Actual</div>
                          <div>RPE</div>
                          <div>Action</div>
                        </div>
                        
                        {exercise.sets.map((set, setIndex) => (
                          <div key={set.id} className="grid grid-cols-6 gap-2 items-center">
                            <div className="font-medium">{setIndex + 1}</div>
                            <div>{set.reps}</div>
                            <div>{set.weight ? `${set.weight} kg` : '-'}</div>
                            <div>
                              {set.isCompleted ? (
                                <span className="text-green-600 font-medium">
                                  {set.actualReps} × {set.actualWeight || set.weight}kg
                                </span>
                              ) : (
                                '-'
                              )}
                            </div>
                            <div>
                              {set.isCompleted ? (
                                <Badge variant="outline">{set.rpe || '-'}</Badge>
                              ) : (
                                '-'
                              )}
                            </div>
                            <div>
                              {!set.isCompleted ? (
                                <Button
                                  size="sm"
                                  onClick={() => openSetModal(currentWorkout, exercise, set, setIndex)}
                                >
                                  Complete
                                </Button>
                              ) : (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Complete Workout Button */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-center">
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                        onClick={() => {
                          if (onCompleteWorkout) {
                            onCompleteWorkout(currentWorkout.id, 5, 'Great workout!');
                          }
                          setIsWorkoutActive(false);
                          setActiveTab('overview');
                        }}
                      >
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Complete Workout
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Dumbbell className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Active Workout</h3>
                  <p className="text-muted-foreground">Start a workout from the Overview tab to begin training.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-6">
            <Alert>
              <TrendingUp className="h-4 w-4" />
              <AlertDescription>
                Detailed progress tracking and analytics coming soon! 
                This will include volume progression, strength gains, and visual charts.
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-6">
            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertDescription>
                Interactive program schedule and calendar integration coming soon!
                Plan your workouts and track your consistency.
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* Community Tab */}
          <TabsContent value="community" className="space-y-6">
            <Alert>
              <MessageCircle className="h-4 w-4" />
              <AlertDescription>
                Community features coming soon! Share progress, get support, and connect with other users.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>

        {/* Set Completion Modal */}
        {selectedSetData && (
          <SetCompletionModal
            isOpen={setModalOpen}
            onClose={() => {
              setSetModalOpen(false);
              setSelectedSetData(null);
            }}
            onComplete={(data) => completeSet(selectedSetData.exercise.id, selectedSetData.set.id, data)}
            set={selectedSetData.set}
            exerciseName={selectedSetData.exercise.name}
            setNumber={selectedSetData.setIndex + 1}
            previousSets={selectedSetData.exercise.sets.slice(0, selectedSetData.setIndex)}
          />
        )}
      </div>
    </div>
  );
}

export type { ExerciseSet, ExerciseDemo, WorkoutSession, ProgramProgress };