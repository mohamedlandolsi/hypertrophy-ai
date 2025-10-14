'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar,
  Target,
  Zap,
  Info,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';

interface ProgramInfoProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  program: any;
  locale: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userCustomization?: any;
  onNavigateToStructures?: () => void;
}

export function ProgramInfo({ program, locale, userCustomization, onNavigateToStructures }: ProgramInfoProps) {
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

  // Get selected structure ID (from customization or default)
  const selectedStructureId = userCustomization?.configuration?.structureId 
    || program.programStructures.find((s: Record<string, unknown>) => s.isDefault)?.id 
    || program.programStructures[0]?.id;

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
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Program Structures</span>
              </CardTitle>
              <CardDescription>
                Choose from different training structures to match your schedule
              </CardDescription>
            </div>
            {onNavigateToStructures && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onNavigateToStructures}
                className="flex items-center gap-2"
              >
                <span>Go to Structures</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {program.programStructures.map((structure: Record<string, unknown>) => {
              const structureName = getLocalizedContent(structure.name as Record<string, string> | string, `Structure ${(structure.order as number) + 1}`);
              const isSelected = structure.id === selectedStructureId;
              
              return (
                <div 
                  key={structure.id as string} 
                  className={`border rounded-lg p-4 transition-all ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-md ring-2 ring-blue-500 ring-opacity-50' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{structureName}</h4>
                        {isSelected && (
                          <Badge variant="default" className="bg-blue-500">
                            Selected
                          </Badge>
                        )}
                        {structure.isDefault as boolean && !isSelected && (
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
                      
                      {structure.structureType === 'weekly' && (structure.weeklySchedule as Record<string, string> | undefined) && (
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-2">Weekly Schedule:</p>
                          <div className="flex flex-wrap gap-1 text-xs">
                            {Object.entries(structure.weeklySchedule as Record<string, string>).map(([day, workout], index) => {
                              const isRestDay = !workout || workout.trim() === '' || workout.toLowerCase() === 'rest';
                              const displayLabel = isRestDay ? 'Rest' : workout;
                              
                              return (
                                <div key={day} className="flex flex-col items-center">
                                  <div className="font-medium mb-1">Day {index + 1}</div>
                                  <div className={`px-2 py-1 rounded text-center min-w-12 ${
                                    isRestDay
                                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' 
                                      : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                                  }`}>
                                    {displayLabel}
                                  </div>
                                </div>
                              );
                            })}
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
            <CardDescription>
              Detailed guide to help you get the most out of this program
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {guideContent
                .sort((a: Record<string, unknown>, b: Record<string, unknown>) => ((a.order as number) || 0) - ((b.order as number) || 0))
                .map((section: Record<string, unknown>, index: number) => (
                  <div key={(section.id as string) || index} className="border rounded-lg p-6 bg-muted/40 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-semibold break-words">{section.title as string}</h3>
                      <Badge variant="secondary" className="text-xs font-mono shrink-0">
                        #{(section.order as number) || (index + 1)}
                      </Badge>
                    </div>
                    <Separator className="my-3" />
                    <div 
                      className="
                        prose prose-base lg:prose-lg max-w-none dark:prose-invert
                        prose-headings:font-semibold prose-headings:text-foreground prose-headings:mt-6 prose-headings:mb-4 first:prose-headings:mt-0
                        prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
                        prose-p:text-foreground/90 prose-p:leading-7 prose-p:mb-4 prose-p:mt-0
                        prose-strong:text-foreground prose-strong:font-bold
                        prose-ul:my-6 prose-ul:list-disc prose-ul:pl-8 prose-ul:space-y-3
                        prose-ol:my-6 prose-ol:list-decimal prose-ol:pl-8 prose-ol:space-y-3
                        prose-li:text-foreground/90 prose-li:leading-7 prose-li:my-1
                        prose-li:marker:text-foreground/60
                        [&_ul]:!list-disc [&_ul]:!block [&_ul]:!my-6 [&_ul]:!pl-8
                        [&_ol]:!list-decimal [&_ol]:!block [&_ol]:!my-6 [&_ol]:!pl-8
                        [&_li]:!block [&_li]:!my-2
                        [&_br]:block [&_br]:my-2
                        [&>*:first-child]:mt-0
                        [&>*:last-child]:mb-0
                        [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-4 [&_img]:mx-auto [&_img]:block"
                      dangerouslySetInnerHTML={{ __html: section.content as string }}
                    />
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}