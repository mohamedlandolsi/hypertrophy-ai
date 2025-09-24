'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BookOpen,
  Target,
  Dumbbell,
  Clock,
  Save,
  Eye,
  AlertTriangle
} from 'lucide-react';

import { 
  MultilingualEditor, 
  MultilingualContent, 
  createEmptyMultilingualContent
} from '@/components/ui/multilingual-editor';

interface ProgramGuideContent {
  introduction: MultilingualContent;
  structure: MultilingualContent;
  exerciseSelection: MultilingualContent;
  progressionTips: MultilingualContent;
  troubleshooting: MultilingualContent;
}

interface ExerciseDescriptionContent {
  name: MultilingualContent;
  description: MultilingualContent;
  instructions: MultilingualContent;
  tips: MultilingualContent;
  commonMistakes: MultilingualContent;
}

interface WorkoutDescription {
  name: MultilingualContent;
  description: MultilingualContent;
  objectives: MultilingualContent;
  targetMuscles: MultilingualContent;
}

interface ProgramContentData {
  name: MultilingualContent;
  shortDescription: MultilingualContent;
  detailedDescription: MultilingualContent;
  targetAudience: MultilingualContent;
  programGuide: ProgramGuideContent;
  workoutDescriptions: WorkoutDescription[];
  exerciseDescriptions: ExerciseDescriptionContent[];
}

interface ProgramContentEditorProps {
  initialData?: Partial<ProgramContentData>;
  onSave?: (data: ProgramContentData) => void;
  onPreview?: (data: ProgramContentData) => void;
  isLoading?: boolean;
}

export function ProgramContentEditor({
  initialData,
  onSave,
  onPreview,
  isLoading = false
}: ProgramContentEditorProps) {
  const [activeSection, setActiveSection] = useState('basic');
  const [contentData, setContentData] = useState<ProgramContentData>({
    name: initialData?.name || createEmptyMultilingualContent(),
    shortDescription: initialData?.shortDescription || createEmptyMultilingualContent(),
    detailedDescription: initialData?.detailedDescription || createEmptyMultilingualContent(),
    targetAudience: initialData?.targetAudience || createEmptyMultilingualContent(),
    programGuide: initialData?.programGuide || {
      introduction: createEmptyMultilingualContent(),
      structure: createEmptyMultilingualContent(),
      exerciseSelection: createEmptyMultilingualContent(),
      progressionTips: createEmptyMultilingualContent(),
      troubleshooting: createEmptyMultilingualContent()
    },
    workoutDescriptions: initialData?.workoutDescriptions || [],
    exerciseDescriptions: initialData?.exerciseDescriptions || []
  });

  // Calculate completion status
  const getCompletionStatus = () => {
    const sections = {
      basic: [
        contentData.name,
        contentData.shortDescription,
        contentData.detailedDescription,
        contentData.targetAudience
      ],
      guide: Object.values(contentData.programGuide),
      workouts: contentData.workoutDescriptions.flatMap(w => Object.values(w)),
      exercises: contentData.exerciseDescriptions.flatMap(e => Object.values(e))
    };

    const sectionStats = Object.entries(sections).map(([key, contents]) => {
      const totalFields = contents.length;
      const completedFields = contents.filter(content => {
        return content.en?.trim() && content.ar?.trim() && content.fr?.trim();
      }).length;
      
      return {
        name: key,
        completed: completedFields,
        total: totalFields,
        percentage: totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 100
      };
    });

    return sectionStats;
  };

  const completionStats = getCompletionStatus();

  const updateContent = <T extends keyof ProgramContentData>(
    section: T,
    value: ProgramContentData[T]
  ) => {
    setContentData(prev => ({
      ...prev,
      [section]: value
    }));
  };

  const updateGuideSection = <T extends keyof ProgramGuideContent>(
    guideSection: T,
    value: ProgramGuideContent[T]
  ) => {
    setContentData(prev => ({
      ...prev,
      programGuide: {
        ...prev.programGuide,
        [guideSection]: value
      }
    }));
  };

  const handleSave = () => {
    if (onSave) {
      onSave(contentData);
    }
  };

  const handlePreview = () => {
    if (onPreview) {
      onPreview(contentData);
    }
  };

  // Real translation function using API endpoint
  const handleTranslate = async (fromLang: string, toLang: string, content: string): Promise<string> => {
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromLang,
          toLang,
          content
        })
      });

      if (!response.ok) {
        throw new Error(`Translation failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.translatedText || content;
    } catch (error) {
      console.error('Translation error:', error);
      // Fallback to mock translation
      return `[Translation failed - using fallback] ${content}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with completion stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Multilingual Program Content Editor
          </CardTitle>
          <CardDescription>
            Create comprehensive, multilingual content for your training program
          </CardDescription>
          
          {/* Completion badges */}
          <div className="flex flex-wrap gap-2 pt-2">
            {completionStats.map((stat) => (
              <Badge 
                key={stat.name}
                variant={stat.percentage === 100 ? 'default' : stat.percentage > 0 ? 'secondary' : 'outline'}
              >
                {stat.name}: {stat.completed}/{stat.total} ({stat.percentage}%)
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {/* Action buttons */}
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={isLoading}>
              <Save className="w-4 h-4 mr-2" />
              Save Content
            </Button>
            <Button variant="outline" onClick={handlePreview} disabled={isLoading}>
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeSection} onValueChange={setActiveSection}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Basic Info
          </TabsTrigger>
          <TabsTrigger value="guide" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Program Guide
          </TabsTrigger>
          <TabsTrigger value="workouts" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Workouts
          </TabsTrigger>
          <TabsTrigger value="exercises" className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4" />
            Exercises
          </TabsTrigger>
        </TabsList>

        {/* Basic Information */}
        <TabsContent value="basic" className="space-y-6">
          <MultilingualEditor
            label="Program Name"
            description="The main title of your training program"
            value={contentData.name}
            onChange={(value) => updateContent('name', value)}
            required
            maxLength={100}
            placeholder={{
              en: "e.g., Upper/Lower Split Program",
              ar: "البرنامج التدريبي العلوي/السفلي",
              fr: "Programme Haut/Bas du Corps"
            }}
            onTranslate={handleTranslate}
          />

          <MultilingualEditor
            label="Short Description"
            description="Brief, compelling summary for program listings"
            value={contentData.shortDescription}
            onChange={(value) => updateContent('shortDescription', value)}
            type="textarea"
            maxLength={200}
            minHeight="80px"
            placeholder={{
              en: "A comprehensive 4-day training program focusing on...",
              ar: "برنامج تدريبي شامل لأربعة أيام يركز على...",
              fr: "Un programme d'entraînement complet de 4 jours axé sur..."
            }}
            onTranslate={handleTranslate}
          />

          <MultilingualEditor
            label="Detailed Description"
            description="In-depth explanation of the program methodology and benefits"
            value={contentData.detailedDescription}
            onChange={(value) => updateContent('detailedDescription', value)}
            type="textarea"
            minHeight="200px"
            placeholder={{
              en: "This program is designed to maximize muscle growth through...",
              ar: "تم تصميم هذا البرنامج لزيادة نمو العضلات من خلال...",
              fr: "Ce programme est conçu pour maximiser la croissance musculaire grâce à..."
            }}
            onTranslate={handleTranslate}
          />

          <MultilingualEditor
            label="Target Audience"
            description="Who this program is designed for"
            value={contentData.targetAudience}
            onChange={(value) => updateContent('targetAudience', value)}
            type="textarea"
            minHeight="120px"
            placeholder={{
              en: "Suitable for intermediate lifters with 6+ months experience...",
              ar: "مناسب للرياضيين المتوسطين مع خبرة 6 أشهر أو أكثر...",
              fr: "Convient aux pratiquants intermédiaires avec 6+ mois d'expérience..."
            }}
            onTranslate={handleTranslate}
          />
        </TabsContent>

        {/* Program Guide */}
        <TabsContent value="guide" className="space-y-6">
          <MultilingualEditor
            label="Introduction"
            description="Welcome message and program overview"
            value={contentData.programGuide.introduction}
            onChange={(value) => updateGuideSection('introduction', value)}
            type="textarea"
            minHeight="150px"
            placeholder={{
              en: "Welcome to your personalized training journey...",
              ar: "مرحباً بك في رحلتك التدريبية الشخصية...",
              fr: "Bienvenue dans votre parcours d'entraînement personnalisé..."
            }}
            onTranslate={handleTranslate}
          />

          <MultilingualEditor
            label="Program Structure"
            description="How the program is organized and scheduled"
            value={contentData.programGuide.structure}
            onChange={(value) => updateGuideSection('structure', value)}
            type="textarea"
            minHeight="150px"
            placeholder={{
              en: "This program follows a 4-day split structure...",
              ar: "يتبع هذا البرنامج هيكل تقسيم لأربعة أيام...",
              fr: "Ce programme suit une structure de division de 4 jours..."
            }}
            onTranslate={handleTranslate}
          />

          <MultilingualEditor
            label="Exercise Selection Guide"
            description="How to choose and modify exercises"
            value={contentData.programGuide.exerciseSelection}
            onChange={(value) => updateGuideSection('exerciseSelection', value)}
            type="textarea"
            minHeight="150px"
            placeholder={{
              en: "Exercise selection is based on movement patterns...",
              ar: "يعتمد اختيار التمارين على أنماط الحركة...",
              fr: "La sélection d'exercices est basée sur les modèles de mouvement..."
            }}
            onTranslate={handleTranslate}
          />

          <MultilingualEditor
            label="Progression Tips"
            description="How to progress through the program"
            value={contentData.programGuide.progressionTips}
            onChange={(value) => updateGuideSection('progressionTips', value)}
            type="textarea"
            minHeight="150px"
            placeholder={{
              en: "Progressive overload is achieved through...",
              ar: "يتم تحقيق الحمل التدريجي من خلال...",
              fr: "La surcharge progressive s'obtient par..."
            }}
            onTranslate={handleTranslate}
          />

          <MultilingualEditor
            label="Troubleshooting"
            description="Common issues and solutions"
            value={contentData.programGuide.troubleshooting}
            onChange={(value) => updateGuideSection('troubleshooting', value)}
            type="textarea"
            minHeight="150px"
            placeholder={{
              en: "If you're experiencing difficulties with...",
              ar: "إذا كنت تواجه صعوبات في...",
              fr: "Si vous rencontrez des difficultés avec..."
            }}
            onTranslate={handleTranslate}
          />
        </TabsContent>

        {/* Workout Descriptions */}
        <TabsContent value="workouts" className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Workout descriptions will be dynamically generated based on your program structure. 
              This section will allow editing of workout-specific descriptions and objectives.
            </AlertDescription>
          </Alert>
          
          <Card>
            <CardHeader>
              <CardTitle>Coming Soon: Workout Descriptions</CardTitle>
              <CardDescription>
                Individual workout descriptions, objectives, and target muscle explanations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This section will allow you to create detailed, multilingual descriptions for each workout in your program.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exercise Descriptions */}
        <TabsContent value="exercises" className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Exercise descriptions will be managed through the exercise database. 
              This section will allow program-specific exercise notes and modifications.
            </AlertDescription>
          </Alert>
          
          <Card>
            <CardHeader>
              <CardTitle>Coming Soon: Exercise Customization</CardTitle>
              <CardDescription>
                Program-specific exercise notes, modifications, and detailed instructions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This section will allow you to add program-specific exercise instructions and modifications.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export type { ProgramContentData, ProgramGuideContent, ExerciseDescriptionContent, WorkoutDescription };