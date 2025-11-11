'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp,
  Calendar,
  Award,
  Clock,
  Activity,
  BarChart3,
  CheckCircle,
  Plus
} from 'lucide-react';

interface UserProgressProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  program: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userCustomization: any;
  userId: string;
}

export function UserProgress({
  program: _program,
  userCustomization: _userCustomization,
  userId: _userId
}: UserProgressProps) {
  const [activeProgressTab, setActiveProgressTab] = useState('overview');

  // Use props to avoid unused variable warnings
  if (process.env.NODE_ENV === 'development') { console.log('Program:', _program.id, 'User:', _userId, 'Customization:', _userCustomization?.id); }

  // Mock progress data - in real implementation, this would come from the database
  const progressData = {
    totalWorkouts: 24,
    completedWorkouts: 8,
    currentWeek: 3,
    totalWeeks: 12,
    startDate: new Date('2025-09-01'),
    lastWorkoutDate: new Date('2025-09-28'),
    streak: 5,
    personalBests: [
      { exercise: 'Bench Press', weight: '185 lbs', date: '2025-09-25' },
      { exercise: 'Squat', weight: '225 lbs', date: '2025-09-23' },
      { exercise: 'Deadlift', weight: '275 lbs', date: '2025-09-20' }
    ],
    weeklyProgress: [
      { week: 1, completed: 3, total: 3, percentage: 100 },
      { week: 2, completed: 3, total: 3, percentage: 100 },
      { week: 3, completed: 2, total: 3, percentage: 67 },
      { week: 4, completed: 0, total: 3, percentage: 0 }
    ],
    muscleGroupProgress: [
      { group: 'Chest', workouts: 6, progress: 75 },
      { group: 'Back', workouts: 5, progress: 65 },
      { group: 'Legs', workouts: 8, progress: 85 },
      { group: 'Shoulders', workouts: 4, progress: 55 },
      { group: 'Arms', workouts: 3, progress: 45 }
    ]
  };

  const completionPercentage = Math.round((progressData.completedWorkouts / progressData.totalWorkouts) * 100);
  const weekProgress = Math.round((progressData.currentWeek / progressData.totalWeeks) * 100);

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{progressData.completedWorkouts}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completed Workouts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{progressData.currentWeek}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Current Week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{progressData.streak}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Day Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{progressData.personalBests.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Personal Bests</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Progress Content */}
      <Tabs value={activeProgressTab} onValueChange={setActiveProgressTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Overall Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Overall Progress</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Program Completion</span>
                  <span>{completionPercentage}%</span>
                </div>
                <Progress value={completionPercentage} className="h-2" />
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {progressData.completedWorkouts} of {progressData.totalWorkouts} workouts completed
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Week Progress</span>
                  <span>{weekProgress}%</span>
                </div>
                <Progress value={weekProgress} className="h-2" />
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Week {progressData.currentWeek} of {progressData.totalWeeks}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Muscle Group Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Muscle Group Development</CardTitle>
              <CardDescription>
                Track your progress across different muscle groups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {progressData.muscleGroupProgress.map((muscle) => (
                  <div key={muscle.group} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{muscle.group}</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {muscle.workouts} workouts
                        </Badge>
                        <span className="text-sm">{muscle.progress}%</span>
                      </div>
                    </div>
                    <Progress value={muscle.progress} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Weekly Tab */}
        <TabsContent value="weekly" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Weekly Breakdown</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {progressData.weeklyProgress.map((week) => (
                  <div key={week.week} className="flex items-center space-x-4 p-3 border rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                          W{week.week}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Week {week.week}</span>
                        <Badge 
                          variant={week.percentage === 100 ? "default" : week.percentage > 0 ? "secondary" : "outline"}
                        >
                          {week.completed}/{week.total} workouts
                        </Badge>
                      </div>
                      <Progress value={week.percentage} className="h-2" />
                    </div>
                    
                    <div className="text-right">
                      <p className="text-lg font-bold">{week.percentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6">
          {/* Personal Bests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="w-5 h-5" />
                <span>Personal Bests</span>
              </CardTitle>
              <CardDescription>
                Your recent strength achievements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {progressData.personalBests.map((pb, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center">
                        <Award className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">{pb.exercise}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{pb.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{pb.weight}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Achievements & Milestones */}
          <Card>
            <CardHeader>
              <CardTitle>Milestones</CardTitle>
              <CardDescription>
                Track your journey milestones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="font-medium">First Workout Completed</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">September 1, 2025</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="font-medium">5-Day Streak Achieved</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">September 28, 2025</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 border rounded-lg opacity-50">
                  <div className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium">Complete Week 4</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">In progress...</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Panel */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Keep the momentum going!</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You&apos;re {progressData.streak} days into your streak. Let&apos;s make it {progressData.streak + 1}!
              </p>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Log Workout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}