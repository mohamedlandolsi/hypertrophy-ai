'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, Target, AlertTriangle, CheckCircle, Clock, Dumbbell } from 'lucide-react';
import useProgramBuilderStore from '@/stores/program-builder-store';

interface VolumeAnalysisPanelProps {
  workoutTemplateId: string;
  workoutName: string;
}

const VOLUME_LOAD_COLORS = {
  LOW: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  MODERATE: 'bg-green-100 text-green-800 border-green-300',
  HIGH: 'bg-blue-100 text-blue-800 border-blue-300',
  EXCESSIVE: 'bg-red-100 text-red-800 border-red-300'
};

const MUSCLE_GROUP_NAMES: Record<string, string> = {
  CHEST: 'Chest',
  BACK: 'Back',
  SHOULDERS: 'Shoulders',
  BICEPS: 'Biceps',
  TRICEPS: 'Triceps',
  QUADRICEPS: 'Quadriceps',
  HAMSTRINGS: 'Hamstrings',
  GLUTES: 'Glutes',
  CALVES: 'Calves',
  ABS: 'Abs',
  FOREARMS: 'Forearms',
  ADDUCTORS: 'Adductors'
};

export default function VolumeAnalysisPanel({ workoutTemplateId, workoutName }: VolumeAnalysisPanelProps) {
  const getWorkoutVolume = useProgramBuilderStore(state => state.getWorkoutVolume);
  const getWeeklyVolumeAnalysis = useProgramBuilderStore(state => state.getWeeklyVolumeAnalysis);
  
  const workoutVolume = getWorkoutVolume(workoutTemplateId);
  const weeklyAnalysis = getWeeklyVolumeAnalysis();

  // Sort muscle groups by total volume (descending)
  const sortedMuscleGroups = [...workoutVolume.muscleGroups].sort((a, b) => b.totalSets - a.totalSets);

  return (
    <div className="space-y-4">
      {/* Workout Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Dumbbell className="h-5 w-5" />
            {workoutName} - Volume Analysis
          </CardTitle>
          <CardDescription>
            Real-time volume tracking and muscle group analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{workoutVolume.totalExercises}</div>
              <div className="text-sm text-muted-foreground">Exercises</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{workoutVolume.estimatedDuration}m</div>
              <div className="text-sm text-muted-foreground">Duration</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{workoutVolume.muscleGroups.length}</div>
              <div className="text-sm text-muted-foreground">Muscle Groups</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${workoutVolume.completionScore >= 100 ? 'text-green-600' : 'text-orange-600'}`}>
                {workoutVolume.completionScore}%
              </div>
              <div className="text-sm text-muted-foreground">Complete</div>
            </div>
          </div>

          {/* Completion Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Workout Completion</span>
              <span className="text-sm text-muted-foreground">{workoutVolume.completionScore}%</span>
            </div>
            <Progress value={workoutVolume.completionScore} className="h-2" />
          </div>

          {/* Completion Status */}
          <div className="mt-3">
            {workoutVolume.isComplete ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Workout is complete! All required muscle groups are being trained.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-orange-200 bg-orange-50">
                <Target className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  Add more exercises to target all required muscle groups.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Muscle Group Breakdown */}
      {sortedMuscleGroups.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" />
              Muscle Group Volume
            </CardTitle>
            <CardDescription>
              Direct and indirect training volume per muscle group
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedMuscleGroups.map(muscle => (
                <div key={muscle.muscleGroup} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="font-medium text-sm">
                      {MUSCLE_GROUP_NAMES[muscle.muscleGroup] || muscle.muscleGroup}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={VOLUME_LOAD_COLORS[muscle.volumeLoad as keyof typeof VOLUME_LOAD_COLORS]}
                    >
                      {muscle.volumeLoad}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {muscle.totalSets.toFixed(1)} sets
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {muscle.directSets}d + {muscle.indirectSets.toFixed(1)}i
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            Program Summary
          </CardTitle>
          <CardDescription>
            Overall program statistics and muscle coverage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-sm font-medium mb-1">Total Workouts</div>
              <div className="text-2xl font-bold">{weeklyAnalysis.totalWorkouts}</div>
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Total Exercises</div>
              <div className="text-2xl font-bold">{weeklyAnalysis.totalExercises}</div>
            </div>
          </div>

          {/* Training Balance */}
          <div className="space-y-2 mb-4">
            <div className="text-sm font-medium">Exercise Balance</div>
            <div className="flex gap-2">
              <Badge variant="secondary">
                Compound: {weeklyAnalysis.trainingBalance.compoundRatio}%
              </Badge>
              <Badge variant="secondary">
                Isolation: {weeklyAnalysis.trainingBalance.isolationRatio}%
              </Badge>
              <Badge variant="secondary">
                Unilateral: {weeklyAnalysis.trainingBalance.unilateralRatio}%
              </Badge>
            </div>
          </div>

          {/* Muscle Coverage Summary */}
          <div className="space-y-3">
            {weeklyAnalysis.muscleGroupCoverage.missing.length > 0 && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <span className="font-medium">Missing:</span>{' '}
                  {weeklyAnalysis.muscleGroupCoverage.missing.map(muscle => 
                    MUSCLE_GROUP_NAMES[muscle] || muscle
                  ).join(', ')}
                </AlertDescription>
              </Alert>
            )}

            {weeklyAnalysis.muscleGroupCoverage.underTrained.length > 0 && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <span className="font-medium">Under-trained:</span>{' '}
                  {weeklyAnalysis.muscleGroupCoverage.underTrained.map(muscle => 
                    MUSCLE_GROUP_NAMES[muscle] || muscle
                  ).join(', ')}
                </AlertDescription>
              </Alert>
            )}

            {weeklyAnalysis.muscleGroupCoverage.overTrained.length > 0 && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <span className="font-medium">Over-trained:</span>{' '}
                  {weeklyAnalysis.muscleGroupCoverage.overTrained.map(muscle => 
                    MUSCLE_GROUP_NAMES[muscle] || muscle
                  ).join(', ')}
                </AlertDescription>
              </Alert>
            )}

            {weeklyAnalysis.muscleGroupCoverage.wellTrained.length > 0 && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <span className="font-medium">Well-trained:</span>{' '}
                  {weeklyAnalysis.muscleGroupCoverage.wellTrained.map(muscle => 
                    MUSCLE_GROUP_NAMES[muscle] || muscle
                  ).join(', ')}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}