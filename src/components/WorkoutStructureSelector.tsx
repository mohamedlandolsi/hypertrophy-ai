'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Repeat, 
  GitBranch, 
  Layers, 
  CheckCircle2,
  Info,
  Dumbbell
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type WorkoutStructureType = 'REPEATING' | 'AB' | 'ABC';

export interface WorkoutStructureSelectorProps {
  splitStructure: {
    daysPerWeek: number;
    pattern: string;
    workoutTypes: string[]; // e.g., ['Upper', 'Lower'] or ['Push', 'Pull', 'Legs']
  };
  selectedType?: WorkoutStructureType;
  onSelect: (type: WorkoutStructureType) => void;
}

interface StructureOption {
  type: WorkoutStructureType;
  label: string;
  icon: typeof Repeat;
  description: string;
  example: string;
  useCase: string;
  iconColor: string;
  getWorkoutCount: (workoutTypes: string[]) => number;
  getWorkoutNames: (workoutTypes: string[]) => string[];
}

const structureOptions: StructureOption[] = [
  {
    type: 'REPEATING',
    label: 'Repeating',
    icon: Repeat,
    description: 'Same workout repeated each time',
    example: 'Upper, Upper, Upper, Upper...',
    useCase: 'Best for beginners or when you want consistency and simplicity',
    iconColor: 'text-blue-600 dark:text-blue-400',
    getWorkoutCount: (workoutTypes) => workoutTypes.length,
    getWorkoutNames: (workoutTypes) => workoutTypes
  },
  {
    type: 'AB',
    label: 'A/B Split',
    icon: GitBranch,
    description: 'Alternate between two workout variations',
    example: 'Upper A, Upper B, Upper A, Upper B...',
    useCase: 'Ideal for variety and balanced muscle stimulation across the week',
    iconColor: 'text-purple-600 dark:text-purple-400',
    getWorkoutCount: (workoutTypes) => workoutTypes.length * 2,
    getWorkoutNames: (workoutTypes) => [
      ...workoutTypes.map(type => `${type} A`),
      ...workoutTypes.map(type => `${type} B`)
    ]
  },
  {
    type: 'ABC',
    label: 'A/B/C Split',
    icon: Layers,
    description: 'Rotate through three workout variations',
    example: 'Upper A, Upper B, Upper C, Upper A...',
    useCase: 'Advanced option for maximum variety and exercise diversity',
    iconColor: 'text-orange-600 dark:text-orange-400',
    getWorkoutCount: (workoutTypes) => workoutTypes.length * 3,
    getWorkoutNames: (workoutTypes) => [
      ...workoutTypes.map(type => `${type} A`),
      ...workoutTypes.map(type => `${type} B`),
      ...workoutTypes.map(type => `${type} C`)
    ]
  }
];

export default function WorkoutStructureSelector({
  splitStructure,
  selectedType,
  onSelect
}: WorkoutStructureSelectorProps) {
  const { workoutTypes } = splitStructure;

  const getExampleSchedule = (option: StructureOption): string => {
    if (workoutTypes.length === 0) return option.example;

    const workoutNames = option.getWorkoutNames(workoutTypes);
    const cycleLength = workoutNames.length;
    
    // Generate a 7-day example schedule
    const schedule: string[] = [];
    let workoutIndex = 0;
    
    for (let day = 0; day < 7; day++) {
      if (day < splitStructure.daysPerWeek) {
        schedule.push(workoutNames[workoutIndex % cycleLength]);
        workoutIndex++;
      } else {
        schedule.push('Rest');
      }
    }
    
    return schedule.slice(0, 4).join(' → ') + '...';
  };

  const selectedOption = structureOptions.find(opt => opt.type === selectedType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Workout Structure</h3>
        <p className="text-sm text-muted-foreground">
          Choose how you want to organize your workouts throughout the week
        </p>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {structureOptions.map((option) => {
          const isSelected = selectedType === option.type;
          const workoutCount = option.getWorkoutCount(workoutTypes);
          const Icon = option.icon;

          return (
            <Card
              key={option.type}
              className={cn(
                'relative cursor-pointer transition-all hover:shadow-md',
                isSelected && 'ring-2 ring-primary border-primary shadow-lg'
              )}
              onClick={() => onSelect(option.type)}
            >
              {isSelected && (
                <div className="absolute -top-2 -right-2 z-10">
                  <div className="bg-primary rounded-full p-1">
                    <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
                  </div>
                </div>
              )}

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between mb-2">
                  <div className={cn('p-3 rounded-lg bg-muted', isSelected && 'bg-primary/10')}>
                    <Icon className={cn('h-6 w-6', option.iconColor)} />
                  </div>
                  <Badge variant={isSelected ? 'default' : 'secondary'} className="ml-2">
                    {workoutCount} workout{workoutCount !== 1 ? 's' : ''}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{option.label}</CardTitle>
                <CardDescription className="text-sm">
                  {option.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                {/* Example */}
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Example
                  </p>
                  <p className="text-xs font-mono bg-muted px-2 py-1.5 rounded">
                    {getExampleSchedule(option)}
                  </p>
                </div>

                {/* Use Case */}
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Best For
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {option.useCase}
                  </p>
                </div>

                {/* Select Button */}
                <Button
                  variant={isSelected ? 'default' : 'outline'}
                  className="w-full mt-4"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(option.type);
                  }}
                >
                  {isSelected ? 'Selected' : 'Select'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selected Structure Summary */}
      {selectedOption && (
        <Alert className="border-primary/50 bg-primary/5">
          <Info className="h-4 w-4" />
          <AlertDescription className="ml-2">
            <div className="space-y-2">
              <p className="font-medium">
                You&apos;ll create {selectedOption.getWorkoutCount(workoutTypes)} workout
                {selectedOption.getWorkoutCount(workoutTypes) !== 1 ? 's' : ''}:
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedOption.getWorkoutNames(workoutTypes).map((name, idx) => (
                  <Badge 
                    key={idx} 
                    variant="secondary" 
                    className="flex items-center gap-1"
                  >
                    <Dumbbell className="h-3 w-3" />
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">Repeating:</strong> Same exercises each time. 
                Great for mastering movement patterns.
              </p>
              <p>
                <strong className="text-foreground">A/B Split:</strong> Two variations with different 
                exercises. Provides variety while maintaining consistency.
              </p>
              <p>
                <strong className="text-foreground">A/B/C Split:</strong> Three variations with 
                maximum exercise diversity. Ideal for experienced lifters.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
