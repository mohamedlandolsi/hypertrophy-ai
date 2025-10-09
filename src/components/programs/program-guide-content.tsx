'use client';

import { useState } from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ProgramInfo } from './program-info';
import { ProgramCustomizer } from './program-customizer';
import { WorkoutTemplates } from './workout-templates';
import { UserProgress } from './user-progress';
import { 
  BookOpen, 
  Settings, 
  Dumbbell, 
  TrendingUp,
  CheckCircle,
  Clock,
  Users,
  Target
} from 'lucide-react';

interface ProgramGuideContentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  program: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userCustomization: any;
  userId: string;
  locale: string;
  accessInfo: {
    isAdmin: boolean;
    hasPurchased: boolean;
    hasAccess: boolean;
  };
}

export default function ProgramGuideContent({
  program,
  userCustomization,
  userId,
  locale,
  accessInfo
}: ProgramGuideContentProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [hasCustomization, setHasCustomization] = useState(!!userCustomization);

  // Extract multilingual content
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getLocalizedContent = (content: any, fallback: string = '') => {
    if (typeof content === 'object' && content !== null) {
      return content[locale] || content.en || fallback;
    }
    return content || fallback;
  };

  const programName = getLocalizedContent(program.name, 'Training Program');
  const programDescription = getLocalizedContent(program.description, '');

  return (
    <div className="space-y-6">
      {/* Program Header */}
      <div className="relative">
        {program.thumbnailUrl && (
          <div className="h-48 rounded-lg overflow-hidden mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={program.thumbnailUrl}
              alt={programName}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>
        )}
        
        <Card className={program.thumbnailUrl ? 'relative -mt-20 mx-4' : ''}>
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold">{programName}</CardTitle>
                <CardDescription className="text-base">
                  {programDescription}
                </CardDescription>
              </div>
              <div className="flex flex-col items-end space-y-2">
                {accessInfo.isAdmin ? (
                  <Badge variant="destructive" className="text-sm">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Admin Access
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-sm">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Purchased
                  </Badge>
                )}
                {hasCustomization && (
                  <Badge variant="outline" className="text-sm">
                    <Settings className="w-4 h-4 mr-1" />
                    Customized
                  </Badge>
                )}
                {accessInfo.isAdmin && !accessInfo.hasPurchased && (
                  <Badge variant="outline" className="text-xs">
                    Preview Mode
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Program Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Dumbbell className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium">Workouts</p>
              <p className="text-2xl font-bold">{program.workoutTemplates.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm font-medium">Structures</p>
              <p className="text-2xl font-bold">{program.programStructures.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-sm font-medium">Exercises</p>
              <p className="text-2xl font-bold">{program.exerciseTemplates.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-sm font-medium">Categories</p>
              <p className="text-2xl font-bold">{program.programCategories.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="customize" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Customize</span>
          </TabsTrigger>
          <TabsTrigger value="workouts" className="flex items-center space-x-2">
            <Dumbbell className="w-4 h-4" />
            <span>Workouts</span>
          </TabsTrigger>
          <TabsTrigger value="progress" disabled className="flex items-center space-x-2 opacity-60 cursor-not-allowed">
            <TrendingUp className="w-4 h-4" />
            <div className="flex items-center space-x-1">
              <span>Progress</span>
              <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0 h-4">Soon</Badge>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ProgramInfo 
            program={program}
            locale={locale}
          />
        </TabsContent>

        <TabsContent value="customize" className="space-y-6">
          <ProgramCustomizer
            program={program}
            userCustomization={userCustomization}
            userId={userId}
            locale={locale}
            onCustomizationSaved={() => {
              setHasCustomization(true);
            }}
          />
        </TabsContent>

        <TabsContent value="workouts" className="space-y-6">
          <WorkoutTemplates
            program={program}
            userCustomization={userCustomization}
            locale={locale}
            userId={userId}
          />
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <UserProgress
            program={program}
            userCustomization={userCustomization}
            userId={userId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}