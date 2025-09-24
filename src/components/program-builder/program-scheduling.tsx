'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Target, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProgramSchedulingProps {
  totalWorkouts: number;
  onScheduleChange: (schedule: ProgramSchedule) => void;
  currentSchedule?: ProgramSchedule | null;
}

interface ProgramSchedule {
  type: 'weekly' | 'cyclic';
  weeklyPattern?: WeeklySchedule;
  cyclicPattern?: CyclicSchedule;
}

interface WeeklySchedule {
  selectedDays: number[]; // 0 = Sunday, 1 = Monday, etc.
  restDayPreference: 'distributed' | 'consecutive' | 'custom';
}

interface CyclicSchedule {
  workoutDays: number;
  restDays: number;
  startDate?: Date;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];

const SCHEDULE_TEMPLATES = {
  '3-day': {
    name: '3-Day Split',
    description: 'Perfect for beginners or busy schedules',
    weeklyPattern: { selectedDays: [1, 3, 5], restDayPreference: 'distributed' as const },
    cyclicPattern: { workoutDays: 1, restDays: 1 }
  },
  '4-day': {
    name: '4-Day Split',
    description: 'Balanced approach for intermediate trainees',
    weeklyPattern: { selectedDays: [1, 2, 4, 5], restDayPreference: 'distributed' as const },
    cyclicPattern: { workoutDays: 2, restDays: 1 }
  },
  '5-day': {
    name: '5-Day Split',
    description: 'High volume for advanced trainees',
    weeklyPattern: { selectedDays: [1, 2, 3, 4, 5], restDayPreference: 'consecutive' as const },
    cyclicPattern: { workoutDays: 3, restDays: 1 }
  },
  '6-day': {
    name: '6-Day Split',
    description: 'Maximum volume for experienced athletes',
    weeklyPattern: { selectedDays: [1, 2, 3, 4, 5, 6], restDayPreference: 'consecutive' as const },
    cyclicPattern: { workoutDays: 3, restDays: 1 }
  },
};

export default function ProgramScheduling({ totalWorkouts, onScheduleChange, currentSchedule }: ProgramSchedulingProps) {
  const [scheduleType, setScheduleType] = useState<'weekly' | 'cyclic'>(currentSchedule?.type || 'weekly');
  const [selectedDays, setSelectedDays] = useState<number[]>(
    currentSchedule?.weeklyPattern?.selectedDays || []
  );
  const [restDayPreference, setRestDayPreference] = useState<'distributed' | 'consecutive' | 'custom'>(
    currentSchedule?.weeklyPattern?.restDayPreference || 'distributed'
  );
  const [cyclicWorkoutDays, setCyclicWorkoutDays] = useState(
    currentSchedule?.cyclicPattern?.workoutDays || 3
  );
  const [cyclicRestDays, setCyclicRestDays] = useState(
    currentSchedule?.cyclicPattern?.restDays || 1
  );

  const handleDayToggle = (dayValue: number) => {
    const newSelectedDays = selectedDays.includes(dayValue)
      ? selectedDays.filter(day => day !== dayValue)
      : [...selectedDays, dayValue].sort();
    
    setSelectedDays(newSelectedDays);
    updateSchedule('weekly', { selectedDays: newSelectedDays, restDayPreference });
  };

  const applyTemplate = (templateKey: string) => {
    const template = SCHEDULE_TEMPLATES[templateKey as keyof typeof SCHEDULE_TEMPLATES];
    if (scheduleType === 'weekly') {
      setSelectedDays(template.weeklyPattern.selectedDays);
      setRestDayPreference(template.weeklyPattern.restDayPreference);
      updateSchedule('weekly', template.weeklyPattern);
    } else {
      setCyclicWorkoutDays(template.cyclicPattern.workoutDays);
      setCyclicRestDays(template.cyclicPattern.restDays);
      updateSchedule('cyclic', template.cyclicPattern);
    }
  };

  const updateSchedule = (type: 'weekly' | 'cyclic', pattern: WeeklySchedule | CyclicSchedule) => {
    const schedule: ProgramSchedule = { type };
    if (type === 'weekly') {
      schedule.weeklyPattern = pattern as WeeklySchedule;
    } else {
      schedule.cyclicPattern = pattern as CyclicSchedule;
    }
    onScheduleChange(schedule);
  };

  const getOptimizedRestDays = (workoutDays: number[]): string => {
    if (workoutDays.length === 0) return 'No workouts scheduled';
    
    const restDays = DAYS_OF_WEEK.filter(day => !workoutDays.includes(day.value));
    
    if (restDayPreference === 'distributed') {
      return `Rest days distributed: ${restDays.map(d => d.short).join(', ')}`;
    } else if (restDayPreference === 'consecutive') {
      return `Rest days grouped: ${restDays.map(d => d.short).join(', ')}`;
    }
    
    return `Custom rest pattern: ${restDays.map(d => d.short).join(', ')}`;
  };

  const getCyclicPattern = (): string => {
    const cycle = cyclicWorkoutDays + cyclicRestDays;
    const workoutsPerWeek = (7 / cycle) * cyclicWorkoutDays;
    return `${cyclicWorkoutDays} on, ${cyclicRestDays} off (≈${workoutsPerWeek.toFixed(1)} workouts/week)`;
  };

  const isValidSchedule = scheduleType === 'weekly' 
    ? selectedDays.length > 0 && selectedDays.length >= totalWorkouts
    : cyclicWorkoutDays > 0 && cyclicRestDays > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Program Scheduling
        </CardTitle>
        <CardDescription>
          Design your training schedule with optimal rest day distribution
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Schedule Type Selection */}
        <Tabs value={scheduleType} onValueChange={(value) => setScheduleType(value as 'weekly' | 'cyclic')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="weekly">Weekly Pattern</TabsTrigger>
            <TabsTrigger value="cyclic">Cyclic Pattern</TabsTrigger>
          </TabsList>

          {/* Weekly Pattern Tab */}
          <TabsContent value="weekly" className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-3 block">Quick Templates</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(SCHEDULE_TEMPLATES).map(([key, template]) => (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    onClick={() => applyTemplate(key)}
                    className="h-auto p-3 text-left"
                  >
                    <div>
                      <div className="font-medium text-sm">{template.name}</div>
                      <div className="text-xs text-muted-foreground">{template.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-3 block">Select Training Days</Label>
              <div className="grid grid-cols-7 gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <Button
                    key={day.value}
                    variant={selectedDays.includes(day.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleDayToggle(day.value)}
                    className="h-16 p-2 flex flex-col"
                  >
                    <span className="text-xs font-medium">{day.short}</span>
                    <span className="text-xs">{day.label.slice(0, 3)}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="rest-preference" className="text-sm font-medium">Rest Day Distribution</Label>
              <Select value={restDayPreference} onValueChange={(value) => {
                const newPref = value as 'distributed' | 'consecutive' | 'custom';
                setRestDayPreference(newPref);
                updateSchedule('weekly', { selectedDays, restDayPreference: newPref });
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="distributed">Distributed (Optimal Recovery)</SelectItem>
                  <SelectItem value="consecutive">Consecutive (Weekends Off)</SelectItem>
                  <SelectItem value="custom">Custom Pattern</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedDays.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Schedule Preview</span>
                </div>
                <div className="space-y-1 text-sm text-blue-700">
                  <div>Training Days: {selectedDays.map(day => DAYS_OF_WEEK[day].label).join(', ')}</div>
                  <div>{getOptimizedRestDays(selectedDays)}</div>
                  <div>Frequency: {selectedDays.length} workouts per week</div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Cyclic Pattern Tab */}
          <TabsContent value="cyclic" className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-3 block">Quick Templates</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(SCHEDULE_TEMPLATES).map(([key, template]) => (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    onClick={() => applyTemplate(key)}
                    className="h-auto p-3 text-left"
                  >
                    <div>
                      <div className="font-medium text-sm">{template.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {template.cyclicPattern.workoutDays} on, {template.cyclicPattern.restDays} off
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="workout-days" className="text-sm font-medium">Workout Days</Label>
                <Input
                  id="workout-days"
                  type="number"
                  min="1"
                  max="6"
                  value={cyclicWorkoutDays}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    setCyclicWorkoutDays(value);
                    updateSchedule('cyclic', { workoutDays: value, restDays: cyclicRestDays });
                  }}
                />
              </div>
              <div>
                <Label htmlFor="rest-days" className="text-sm font-medium">Rest Days</Label>
                <Input
                  id="rest-days"
                  type="number"
                  min="1"
                  max="3"
                  value={cyclicRestDays}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    setCyclicRestDays(value);
                    updateSchedule('cyclic', { workoutDays: cyclicWorkoutDays, restDays: value });
                  }}
                />
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">Cyclic Pattern</span>
              </div>
              <div className="text-sm text-green-700">
                {getCyclicPattern()}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Validation */}
        {!isValidSchedule && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {scheduleType === 'weekly' 
                ? `Please select at least ${totalWorkouts} training days to accommodate all workouts.`
                : 'Please ensure both workout days and rest days are greater than 0.'
              }
            </AlertDescription>
          </Alert>
        )}

        {isValidSchedule && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Schedule is valid and optimized for recovery!
            </AlertDescription>
          </Alert>
        )}

        {/* Program Insights */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-2">Recovery Recommendations</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Allow at least 48h between training the same muscle groups</li>
            <li>• Consider consecutive rest days for better recovery</li>
            <li>• Adjust intensity based on training frequency</li>
            <li>• Monitor fatigue and adjust schedule as needed</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}