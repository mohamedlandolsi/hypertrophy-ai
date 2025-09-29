'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar,
  Target,
  Zap,
  Info,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface ProgramInfoProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  program: any;
  locale: string;
}

export function ProgramInfo({ program, locale }: ProgramInfoProps) {
  // Extract multilingual content
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getLocalizedContent = (content: any, fallback: string = '') => {
    if (typeof content === 'object' && content !== null) {
      return content[locale] || content.en || fallback;
    }
    return content || fallback;
  };

  // Parse guide content sections
  const guideContent = program.programGuide?.content 
    ? (Array.isArray(program.programGuide.content) 
        ? program.programGuide.content 
        : JSON.parse(program.programGuide.content))
    : [];

  // Parse about content if it's HTML
  const aboutContent = program.aboutContent || '';

  return (
    <div className="space-y-6">
      {/* Program Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="w-5 h-5" />
            <span>Program Features</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-medium">Interactive Builder</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {program.hasInteractiveBuilder ? 'Available' : 'Not available'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-medium">Customization</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {program.allowsCustomization ? 'Full customization' : 'Fixed program'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Program About Content */}
      {aboutContent && (
        <Card>
          <CardHeader>
            <CardTitle>About This Program</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: aboutContent }}
            />
          </CardContent>
        </Card>
      )}

      {/* Program Structure Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Program Structures</span>
          </CardTitle>
          <CardDescription>
            Choose from different training structures to match your schedule
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {program.programStructures.map((structure: Record<string, unknown>) => {
              const structureName = getLocalizedContent(structure.name as Record<string, string> | string, `Structure ${(structure.order as number) + 1}`);
              
              return (
                <div key={structure.id as string} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{structureName}</h4>
                        {structure.isDefault as boolean && (
                          <Badge variant="secondary">Default</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Target className="w-4 h-4" />
                          <span>{structure.structureType === 'weekly' ? 'Weekly' : 'Cyclic'}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            {structure.structureType === 'weekly' 
                              ? `${structure.sessionCount as number} sessions/week`
                              : `${structure.trainingDays as number} training days, ${structure.restDays as number} rest days`
                            }
                          </span>
                        </div>
                      </div>
                      
                      {(structure.weeklySchedule as Record<string, string> | undefined) && (
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-2">Weekly Schedule:</p>
                          <div className="grid grid-cols-7 gap-1 text-xs">
                            {Object.entries(structure.weeklySchedule as Record<string, string>).map(([day, workout]) => (
                              <div key={day} className="text-center">
                                <div className="font-medium capitalize mb-1">{day.slice(0, 3)}</div>
                                <div className={`p-1 rounded text-xs ${
                                  workout ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : 'bg-gray-100 dark:bg-gray-800'
                                }`}>
                                  {workout || 'Rest'}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Program Guide Sections */}
      {guideContent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5" />
              <span>Program Guide</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {guideContent
                .sort((a: Record<string, unknown>, b: Record<string, unknown>) => ((a.order as number) || 0) - ((b.order as number) || 0))
                .map((section: Record<string, unknown>, index: number) => (
                  <div key={(section.id as string) || index} className="space-y-3">
                    <h3 className="text-lg font-semibold">{section.title as string}</h3>
                    <div 
                      className="prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: section.content as string }}
                    />
                    {index < guideContent.length - 1 && <Separator />}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}