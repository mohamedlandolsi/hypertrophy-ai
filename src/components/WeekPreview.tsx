'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calendar,
  Dumbbell,
  TrendingUp,
  TrendingDown,
  Download,
  Copy,
  ChevronDown,
  ChevronUp,
  Activity,
  Target,
  CheckCircle2,
  Crown,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ============================================
// Types & Interfaces
// ============================================

interface Exercise {
  id: string;
  name: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  exerciseType: string;
  volumeContributions: Record<string, number>;
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

interface WeekPreviewProps {
  workouts: Workout[];
  programName: string;
  isPro: boolean;
  locale?: string;
}

interface DaySchedule {
  dayName: string;
  dayIndex: number;
  workouts: Workout[];
  totalExercises: number;
  totalSets: number;
  muscleGroups: Set<string>;
  volumeLevel: 'rest' | 'low' | 'medium' | 'high';
}

interface MuscleVolumeStats {
  muscle: string;
  totalSets: number;
  exercises: number;
  percentage: number;
  recommendation: string;
  status: 'low' | 'optimal' | 'high';
}

interface WeekStats {
  totalWorkouts: number;
  totalExercises: number;
  totalSets: number;
  uniqueMuscles: number;
  muscleVolumeStats: MuscleVolumeStats[];
}

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

// ============================================
// Utility Functions
// ============================================

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
    'Full Body': 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300',
  };
  return colors[workoutType] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
};

const getVolumeLevelColor = (level: string) => {
  const colors: Record<string, string> = {
    'rest': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    'low': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    'medium': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    'high': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  };
  return colors[level] || colors['low'];
};

const calculateVolumeLevel = (totalSets: number): 'rest' | 'low' | 'medium' | 'high' => {
  if (totalSets === 0) return 'rest';
  if (totalSets <= 15) return 'low';
  if (totalSets <= 25) return 'medium';
  return 'high';
};

const calculateMuscleVolumeRecommendation = (
  muscle: string,
  totalSets: number
): { recommendation: string; status: 'low' | 'optimal' | 'high' } => {
  // Recommended weekly volume ranges per muscle group (based on research)
  const volumeRanges: Record<string, { min: number; optimal: number; max: number }> = {
    'Chest': { min: 10, optimal: 16, max: 22 },
    'Back': { min: 12, optimal: 18, max: 25 },
    'Shoulders': { min: 8, optimal: 14, max: 20 },
    'Biceps': { min: 6, optimal: 12, max: 18 },
    'Triceps': { min: 6, optimal: 12, max: 18 },
    'Quads': { min: 10, optimal: 16, max: 22 },
    'Hamstrings': { min: 8, optimal: 14, max: 20 },
    'Glutes': { min: 8, optimal: 14, max: 20 },
    'Calves': { min: 6, optimal: 12, max: 18 },
  };

  const range = volumeRanges[muscle] || { min: 8, optimal: 14, max: 20 };

  if (totalSets < range.min) {
    return {
      recommendation: `Consider adding ${range.min - totalSets} more sets`,
      status: 'low',
    };
  } else if (totalSets > range.max) {
    return {
      recommendation: `Consider reducing by ${totalSets - range.max} sets to avoid overtraining`,
      status: 'high',
    };
  } else {
    return {
      recommendation: 'Volume is within optimal range',
      status: 'optimal',
    };
  }
};

// ============================================
// Main Component
// ============================================

export default function WeekPreview({ workouts, programName, isPro }: WeekPreviewProps) {
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());
  const [isExporting, setIsExporting] = useState(false);

  // ============================================
  // Calculate Week Schedule
  // ============================================

  const weekSchedule = useMemo<DaySchedule[]>(() => {
    return DAYS_OF_WEEK.map((dayName, dayIndex) => {
      // Find workouts assigned to this day
      const dayWorkouts = workouts.filter((workout) =>
        workout.assignedDays.some((day) => day.toLowerCase() === dayName.toLowerCase())
      );

      const totalExercises = dayWorkouts.reduce(
        (sum, workout) => sum + workout.exercises.length,
        0
      );

      const totalSets = dayWorkouts.reduce(
        (sum, workout) =>
          sum + workout.exercises.reduce((s, ex) => s + ex.sets, 0),
        0
      );

      const muscleGroups = new Set<string>();
      dayWorkouts.forEach((workout) => {
        workout.exercises.forEach((ex) => {
          muscleGroups.add(ex.exercise.primaryMuscle);
          ex.exercise.secondaryMuscles.forEach((m) => muscleGroups.add(m));
        });
      });

      return {
        dayName,
        dayIndex,
        workouts: dayWorkouts,
        totalExercises,
        totalSets,
        muscleGroups,
        volumeLevel: calculateVolumeLevel(totalSets),
      };
    });
  }, [workouts]);

  // ============================================
  // Calculate Week Stats
  // ============================================

  const weekStats = useMemo<WeekStats>(() => {
    const totalWorkouts = workouts.length;
    const totalExercises = workouts.reduce((sum, w) => sum + w.exercises.length, 0);
    const totalSets = workouts.reduce(
      (sum, w) => sum + w.exercises.reduce((s, ex) => s + ex.sets, 0),
      0
    );

    // Calculate per-muscle volume
    const muscleVolume = new Map<string, { sets: number; exercises: Set<string> }>();
    
    workouts.forEach((workout) => {
      workout.exercises.forEach((ex) => {
        const muscle = ex.exercise.primaryMuscle;
        if (!muscleVolume.has(muscle)) {
          muscleVolume.set(muscle, { sets: 0, exercises: new Set() });
        }
        const data = muscleVolume.get(muscle)!;
        data.sets += ex.sets;
        data.exercises.add(ex.exerciseId);
      });
    });

    const muscleVolumeStats: MuscleVolumeStats[] = Array.from(muscleVolume.entries())
      .map(([muscle, data]) => {
        const { recommendation, status } = calculateMuscleVolumeRecommendation(muscle, data.sets);
        return {
          muscle,
          totalSets: data.sets,
          exercises: data.exercises.size,
          percentage: (data.sets / totalSets) * 100,
          recommendation,
          status,
        };
      })
      .sort((a, b) => b.totalSets - a.totalSets);

    return {
      totalWorkouts,
      totalExercises,
      totalSets,
      uniqueMuscles: muscleVolume.size,
      muscleVolumeStats,
    };
  }, [workouts]);

  // ============================================
  // Event Handlers
  // ============================================

  const toggleDay = (dayIndex: number) => {
    setExpandedDays((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dayIndex)) {
        newSet.delete(dayIndex);
      } else {
        newSet.add(dayIndex);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setExpandedDays(new Set(DAYS_OF_WEEK.map((_, i) => i)));
  };

  const collapseAll = () => {
    setExpandedDays(new Set());
  };

  const copyToClipboard = async () => {
    try {
      let textContent = `${programName} - Weekly Training Schedule\n`;
      textContent += `${'='.repeat(50)}\n\n`;

      weekSchedule.forEach((day) => {
        textContent += `${day.dayName.toUpperCase()}\n`;
        textContent += `-${'-'.repeat(48)}\n`;

        if (day.workouts.length === 0) {
          textContent += `Rest Day\n\n`;
        } else {
          day.workouts.forEach((workout) => {
            textContent += `Workout: ${workout.name} (${workout.type})\n`;
            textContent += `Exercises: ${workout.exercises.length} | Total Sets: ${workout.exercises.reduce((s, e) => s + e.sets, 0)}\n\n`;

            workout.exercises.forEach((ex, idx) => {
              textContent += `  ${idx + 1}. ${ex.exercise.name}\n`;
              textContent += `     ${ex.sets} sets × ${ex.reps} reps${ex.isBilateral ? ' (each side)' : ''}\n`;
              textContent += `     Primary: ${ex.exercise.primaryMuscle}`;
              if (ex.exercise.secondaryMuscles.length > 0) {
                textContent += ` | Secondary: ${ex.exercise.secondaryMuscles.join(', ')}`;
              }
              textContent += `\n\n`;
            });
          });
        }
        textContent += `\n`;
      });

      textContent += `\nWEEK SUMMARY\n`;
      textContent += `${'='.repeat(50)}\n`;
      textContent += `Total Workouts: ${weekStats.totalWorkouts}\n`;
      textContent += `Total Exercises: ${weekStats.totalExercises}\n`;
      textContent += `Total Sets: ${weekStats.totalSets}\n`;
      textContent += `Muscle Groups Trained: ${weekStats.uniqueMuscles}\n`;

      await navigator.clipboard.writeText(textContent);
      toast.success('Week preview copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  const exportToPDF = async () => {
    if (!isPro) {
      toast.error('PDF export is a PRO feature. Upgrade to unlock!');
      return;
    }

    setIsExporting(true);
    try {
      // TODO: Implement PDF generation using jsPDF or similar
      // For now, just show a success message
      toast.success('PDF export feature coming soon!');
    } catch (error) {
      console.error('Failed to export PDF:', error);
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  // ============================================
  // Render
  // ============================================

  return (
    <div className="space-y-6">
      {/* Stats Panel */}
      <Card className="border-2 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Activity className="h-6 w-6 text-blue-500" />
                Week Overview
              </CardTitle>
              <CardDescription>
                Your complete training week at a glance
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={expandAll}
                className="hidden md:flex"
              >
                <ChevronDown className="h-4 w-4 mr-1" />
                Expand All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={collapseAll}
                className="hidden md:flex"
              >
                <ChevronUp className="h-4 w-4 mr-1" />
                Collapse All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {weekStats.totalWorkouts}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Total Workouts
              </div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {weekStats.totalExercises}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Total Exercises
              </div>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {weekStats.totalSets}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Total Sets
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {weekStats.uniqueMuscles}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Muscle Groups
              </div>
            </div>
          </div>

          <Separator />

          {/* Muscle Volume Analysis */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              Muscle Volume Analysis
            </h3>
            <ScrollArea className="h-64 pr-4">
              <div className="space-y-3">
                {weekStats.muscleVolumeStats.map((stat) => (
                  <div key={stat.muscle} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn('w-3 h-3 rounded-full', getMuscleColor(stat.muscle))} />
                        <span className="font-medium">{stat.muscle}</span>
                        <Badge variant="outline" className="text-xs">
                          {stat.exercises} {stat.exercises === 1 ? 'exercise' : 'exercises'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{stat.totalSets} sets</span>
                        {stat.status === 'low' && (
                          <TrendingDown className="h-4 w-4 text-yellow-500" />
                        )}
                        {stat.status === 'optimal' && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                        {stat.status === 'high' && (
                          <TrendingUp className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Progress value={stat.percentage} className="h-2" />
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {stat.recommendation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Export Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={copyToClipboard}
              variant="outline"
              className="flex-1"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy to Clipboard
            </Button>
            <Button
              onClick={exportToPDF}
              disabled={isExporting}
              className="flex-1 relative"
              variant={isPro ? 'default' : 'outline'}
            >
              {!isPro && (
                <Crown className="h-4 w-4 mr-2 text-yellow-500" />
              )}
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export PDF'}
              {!isPro && (
                <Badge className="ml-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                  PRO
                </Badge>
              )}
            </Button>
          </div>

          {!isPro && (
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription>
                Upgrade to PRO to unlock PDF export and advanced analytics features!
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Weekly Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
        {weekSchedule.map((day) => {
          const isExpanded = expandedDays.has(day.dayIndex);
          const isRestDay = day.workouts.length === 0;

          return (
            <Card
              key={day.dayIndex}
              className={cn(
                'transition-all duration-200 hover:shadow-lg cursor-pointer',
                isRestDay && 'opacity-60',
                isExpanded && 'md:col-span-2 lg:col-span-7'
              )}
              onClick={() => !isRestDay && toggleDay(day.dayIndex)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold">
                    {day.dayName}
                  </CardTitle>
                  {!isRestDay && (
                    <div className="flex items-center gap-1">
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isRestDay ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium">Rest Day</p>
                    <p className="text-xs mt-1">Recovery & Growth</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Collapsed View */}
                    {!isExpanded && (
                      <>
                        {day.workouts.map((workout) => (
                          <div key={workout.id} className="space-y-2">
                            <Badge className={getWorkoutTypeColor(workout.type)}>
                              {workout.type}
                            </Badge>
                            <p className="text-sm font-medium truncate">
                              {workout.name}
                            </p>
                          </div>
                        ))}
                        <Separator />
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-1">
                            <Dumbbell className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {day.totalExercises} exercises
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Activity className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {day.totalSets} sets
                            </span>
                          </div>
                        </div>
                        <Badge className={cn('w-full justify-center', getVolumeLevelColor(day.volumeLevel))}>
                          {day.volumeLevel.toUpperCase()} Volume
                        </Badge>
                      </>
                    )}

                    {/* Expanded View */}
                    {isExpanded && (
                      <div className="space-y-6">
                        {day.workouts.map((workout) => (
                          <div key={workout.id} className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold text-lg">{workout.name}</h4>
                                <Badge className={getWorkoutTypeColor(workout.type)}>
                                  {workout.type}
                                </Badge>
                              </div>
                              <div className="text-right text-sm text-gray-600 dark:text-gray-400">
                                <div>{workout.exercises.length} exercises</div>
                                <div>
                                  {workout.exercises.reduce((s, e) => s + e.sets, 0)} total sets
                                </div>
                              </div>
                            </div>

                            <Separator />

                            {/* Exercise List */}
                            <div className="space-y-3">
                              {workout.exercises.map((ex, idx) => (
                                <div
                                  key={ex.id}
                                  className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
                                >
                                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
                                    {idx + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h5 className="font-medium">{ex.exercise.name}</h5>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      {ex.sets} sets × {ex.reps} reps
                                      {ex.isBilateral && ' (each side)'}
                                    </p>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      <Badge
                                        variant="outline"
                                        className={cn('text-xs', getMuscleColor(ex.exercise.primaryMuscle), 'text-white border-0')}
                                      >
                                        {ex.exercise.primaryMuscle}
                                      </Badge>
                                      {ex.exercise.secondaryMuscles.map((muscle) => (
                                        <Badge
                                          key={muscle}
                                          variant="outline"
                                          className="text-xs opacity-75"
                                        >
                                          {muscle}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {ex.exercise.exerciseType}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}

                        {/* Day Summary */}
                        <div className="pt-4 border-t">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">
                                {day.totalExercises}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                Exercises
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-600">
                                {day.totalSets}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                Total Sets
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-orange-600">
                                {day.muscleGroups.size}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                Muscles
                              </div>
                            </div>
                            <div className="text-center">
                              <Badge className={cn('w-full justify-center', getVolumeLevelColor(day.volumeLevel))}>
                                {day.volumeLevel.toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
