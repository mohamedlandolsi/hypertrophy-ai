'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, Dumbbell, Target, TrendingUp } from 'lucide-react';
import { TrainingExercise, ProgramCategory } from '@/stores/program-builder-store';

interface CategoryTemplatesProps {
  selectedCategory: ProgramCategory;
  availableExercises: TrainingExercise[];
  workoutName: string;
  requiredMuscleGroups: string[];
  onApplyTemplate: (exerciseIds: string[]) => void;
}

// Exercise prioritization for each category
const CATEGORY_PRIORITIES = {
  MINIMALIST: {
    name: 'Minimalist',
    description: 'Compound movements for maximum efficiency',
    icon: Target,
    exerciseTypes: ['COMPOUND'],
    targetCount: 3,
    focusAreas: ['Time-efficient', 'Full-body emphasis', 'Heavy basics'],
    priority: (exercise: TrainingExercise) => {
      let score = 0;
      if (exercise.type === 'COMPOUND') score += 100;
      if (exercise.name.en.toLowerCase().includes('squat')) score += 20;
      if (exercise.name.en.toLowerCase().includes('deadlift')) score += 20;
      if (exercise.name.en.toLowerCase().includes('press')) score += 15;
      if (exercise.name.en.toLowerCase().includes('row')) score += 15;
      if (exercise.name.en.toLowerCase().includes('pull')) score += 10;
      return score;
    }
  },
  ESSENTIALIST: {
    name: 'Essentialist',
    description: 'Balanced mix of compound and isolation',
    icon: Dumbbell,
    exerciseTypes: ['COMPOUND', 'ISOLATION'],
    targetCount: 5,
    focusAreas: ['Balanced approach', 'Quality over quantity', 'Targeted growth'],
    priority: (exercise: TrainingExercise) => {
      let score = 0;
      if (exercise.type === 'COMPOUND') score += 80;
      if (exercise.type === 'ISOLATION') score += 60;
      if (exercise.type === 'UNILATERAL') score += 40;
      // Bonus for key movements
      if (exercise.name.en.toLowerCase().includes('squat')) score += 15;
      if (exercise.name.en.toLowerCase().includes('press')) score += 15;
      if (exercise.name.en.toLowerCase().includes('row')) score += 10;
      return score;
    }
  },
  MAXIMALIST: {
    name: 'Maximalist',
    description: 'Comprehensive muscle targeting with isolation focus',
    icon: TrendingUp,
    exerciseTypes: ['COMPOUND', 'ISOLATION', 'UNILATERAL'],
    targetCount: 7,
    focusAreas: ['Maximum hypertrophy', 'Detail-oriented', 'Complete development'],
    priority: (exercise: TrainingExercise) => {
      let score = 0;
      if (exercise.type === 'ISOLATION') score += 80;
      if (exercise.type === 'UNILATERAL') score += 70;
      if (exercise.type === 'COMPOUND') score += 60;
      // Bonus for specialized movements
      if (exercise.name.en.toLowerCase().includes('curl')) score += 10;
      if (exercise.name.en.toLowerCase().includes('extension')) score += 10;
      if (exercise.name.en.toLowerCase().includes('raise')) score += 10;
      return score;
    }
  }
};

export default function CategoryTemplates({
  selectedCategory,
  availableExercises,
  workoutName,
  requiredMuscleGroups,
  onApplyTemplate
}: CategoryTemplatesProps) {
  const categoryConfig = CATEGORY_PRIORITIES[selectedCategory];
  const IconComponent = categoryConfig.icon;

  const generateOptimalTemplate = () => {
    const template: string[] = [];
    const usedMuscleGroups = new Set<string>();
    
    // Step 1: Ensure all required muscle groups are covered
    requiredMuscleGroups.forEach(muscleGroup => {
      const suitableExercises = availableExercises
        .filter(exercise => 
          exercise.primaryMuscleGroup === muscleGroup ||
          exercise.secondaryMuscleGroups.includes(muscleGroup)
        )
        .filter(exercise => categoryConfig.exerciseTypes.includes(exercise.type))
        .sort((a, b) => categoryConfig.priority(b) - categoryConfig.priority(a));

      if (suitableExercises.length > 0 && template.length < categoryConfig.targetCount) {
        const bestExercise = suitableExercises[0];
        if (!template.includes(bestExercise.id)) {
          template.push(bestExercise.id);
          usedMuscleGroups.add(bestExercise.primaryMuscleGroup);
          bestExercise.secondaryMuscleGroups.forEach(mg => usedMuscleGroups.add(mg));
        }
      }
    });

    // Step 2: Fill remaining slots with highest-priority exercises
    const remainingSlots = categoryConfig.targetCount - template.length;
    if (remainingSlots > 0) {
      const remainingExercises = availableExercises
        .filter(exercise => !template.includes(exercise.id))
        .filter(exercise => categoryConfig.exerciseTypes.includes(exercise.type))
        .sort((a, b) => categoryConfig.priority(b) - categoryConfig.priority(a));

      for (let i = 0; i < Math.min(remainingSlots, remainingExercises.length); i++) {
        template.push(remainingExercises[i].id);
      }
    }

    return template;
  };

  const generateAlternativeTemplate = () => {
    const template: string[] = [];
    const usedExercises = new Set<string>();
    
    // More diverse selection prioritizing different movement patterns
    const movementPatterns = [
      'squat', 'deadlift', 'press', 'row', 'pull', 
      'lunge', 'curl', 'extension', 'raise', 'fly'
    ];

    movementPatterns.forEach(pattern => {
      if (template.length >= categoryConfig.targetCount) return;
      
      const patternExercises = availableExercises
        .filter(exercise => 
          exercise.name.en.toLowerCase().includes(pattern) &&
          categoryConfig.exerciseTypes.includes(exercise.type) &&
          !usedExercises.has(exercise.id)
        )
        .sort((a, b) => categoryConfig.priority(b) - categoryConfig.priority(a));

      if (patternExercises.length > 0) {
        template.push(patternExercises[0].id);
        usedExercises.add(patternExercises[0].id);
      }
    });

    // Fill remaining slots
    const remainingSlots = categoryConfig.targetCount - template.length;
    if (remainingSlots > 0) {
      const remainingExercises = availableExercises
        .filter(exercise => 
          !usedExercises.has(exercise.id) &&
          categoryConfig.exerciseTypes.includes(exercise.type)
        )
        .sort((a, b) => categoryConfig.priority(b) - categoryConfig.priority(a));

      for (let i = 0; i < Math.min(remainingSlots, remainingExercises.length); i++) {
        template.push(remainingExercises[i].id);
        usedExercises.add(remainingExercises[i].id);
      }
    }

    return template;
  };

  const optimalTemplate = generateOptimalTemplate();
  const alternativeTemplate = generateAlternativeTemplate();

  const getExerciseName = (exerciseId: string) => {
    const exercise = availableExercises.find(ex => ex.id === exerciseId);
    return exercise?.name.en || 'Unknown Exercise';
  };

  const getExerciseType = (exerciseId: string) => {
    const exercise = availableExercises.find(ex => ex.id === exerciseId);
    return exercise?.type || 'Unknown';
  };

  const getTemplateCoverage = (template: string[]) => {
    const coveredMuscles = new Set<string>();
    template.forEach(exerciseId => {
      const exercise = availableExercises.find(ex => ex.id === exerciseId);
      if (exercise) {
        coveredMuscles.add(exercise.primaryMuscleGroup);
        exercise.secondaryMuscleGroups.forEach(mg => coveredMuscles.add(mg));
      }
    });
    
    const requiredCovered = requiredMuscleGroups.filter(mg => coveredMuscles.has(mg));
    const coveragePercentage = requiredMuscleGroups.length > 0 
      ? Math.round((requiredCovered.length / requiredMuscleGroups.length) * 100)
      : 100;
    
    return { coveredMuscles: Array.from(coveredMuscles), coveragePercentage };
  };

  const optimalCoverage = getTemplateCoverage(optimalTemplate);
  const alternativeCoverage = getTemplateCoverage(alternativeTemplate);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconComponent className="h-5 w-5" />
          {categoryConfig.name} Templates
        </CardTitle>
        <CardDescription>
          Pre-configured exercise selections optimized for {workoutName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Category Overview */}
        <Alert className="border-blue-200 bg-blue-50">
          <Sparkles className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="font-medium mb-1">{categoryConfig.description}</div>
            <div className="text-sm">
              Focus: {categoryConfig.focusAreas.join(' • ')}
            </div>
          </AlertDescription>
        </Alert>

        {/* Optimal Template */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Optimal Template</h4>
            <div className="flex items-center gap-2">
              <Badge variant={optimalCoverage.coveragePercentage >= 100 ? "default" : "secondary"}>
                {optimalCoverage.coveragePercentage}% Coverage
              </Badge>
              <Button 
                size="sm"
                onClick={() => onApplyTemplate(optimalTemplate)}
                disabled={optimalTemplate.length === 0}
              >
                Apply Template
              </Button>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid gap-2">
              {optimalTemplate.map((exerciseId, index) => (
                <div key={exerciseId} className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-sm">{index + 1}. {getExerciseName(exerciseId)}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {getExerciseType(exerciseId)}
                  </Badge>
                </div>
              ))}
            </div>
            
            {optimalTemplate.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No suitable exercises found for this category
              </p>
            )}
          </div>
        </div>

        {/* Alternative Template */}
        {alternativeTemplate.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Alternative Template</h4>
              <div className="flex items-center gap-2">
                <Badge variant={alternativeCoverage.coveragePercentage >= 100 ? "default" : "secondary"}>
                  {alternativeCoverage.coveragePercentage}% Coverage
                </Badge>
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => onApplyTemplate(alternativeTemplate)}
                >
                  Apply Alternative
                </Button>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid gap-2">
                {alternativeTemplate.map((exerciseId, index) => (
                  <div key={exerciseId} className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-sm">{index + 1}. {getExerciseName(exerciseId)}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {getExerciseType(exerciseId)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Template Insights */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
          <h5 className="font-medium text-purple-800 mb-2">Template Insights</h5>
          <div className="text-sm text-purple-700 space-y-1">
            <div>• Targets {optimalCoverage.coveragePercentage}% of required muscle groups</div>
            <div>• {optimalTemplate.length} exercises selected for optimal {categoryConfig.name.toLowerCase()} approach</div>
            <div>• Prioritizes {categoryConfig.exerciseTypes.join(' and ').toLowerCase()} movements</div>
            {optimalCoverage.coveragePercentage < 100 && (
              <div className="text-yellow-700">⚠ Consider adding exercises for complete coverage</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}