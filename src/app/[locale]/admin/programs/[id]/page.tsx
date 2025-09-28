'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  Edit, 
  Users, 
  FileText, 
  Clock, 
  Dumbbell,
  CheckCircle,
  XCircle,
  Calendar,
  Activity
} from 'lucide-react';
import { showToast } from '@/lib/toast';
import AdminLayout from '@/components/admin-layout';

// Types
interface WorkoutTemplate {
  id: string;
  name: Record<string, string>;
  order: number;
  requiredMuscleGroups: string[];
  createdAt: string;
}

interface ProgramGuide {
  id: string;
  content: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface TrainingProgramDetail {
  id: string;
  name: Record<string, string>;
  description: Record<string, string>;
  price: number;
  lemonSqueezyId: string | null;
  isActive: boolean;
  structureType: string;
  sessionCount: number;
  trainingDays: number;
  restDays: number;
  weeklySchedule: Record<string, string> | null;
  hasInteractiveBuilder: boolean;
  allowsCustomization: boolean;
  createdAt: string;
  updatedAt: string;
  workoutTemplates: WorkoutTemplate[];
  programGuide: ProgramGuide | null;
  _count: {
    userPurchases: number;
    userPrograms: number;
    exerciseTemplates: number;
  };
}

// Fetching function
async function fetchProgramDetails(programId: string): Promise<TrainingProgramDetail> {
  const response = await fetch(`/api/admin/programs/${programId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch program details');
  }

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch program details');
  }

  return result.data;
}

export default function ProgramDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params.id as string;
  
  const [program, setProgram] = useState<TrainingProgramDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProgramDetails() {
      try {
        setIsLoading(true);
        setError(null);
        const programData = await fetchProgramDetails(programId);
        setProgram(programData);
      } catch (err) {
        console.error('Error loading program details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load program details');
        showToast.error('Error', 'Failed to load program details');
      } finally {
        setIsLoading(false);
      }
    }

    if (programId) {
      loadProgramDetails();
    }
  }, [programId]);

  const formatPrice = (priceInCents: number) => {
    const usdPrice = (priceInCents / 100 * 0.32).toFixed(2);
    const tndPrice = (priceInCents / 100).toFixed(2);
    return { usd: usdPrice, tnd: tndPrice };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMuscleGroupBadgeVariant = (muscle: string): "default" | "destructive" | "outline" | "secondary" => {
    const colors: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      'CHEST': 'default',
      'BACK': 'secondary', 
      'SHOULDERS': 'outline',
      'BICEPS': 'destructive',
      'TRICEPS': 'destructive',
      'FOREARMS': 'destructive',
      'ABS': 'default',
      'GLUTES': 'secondary',
      'QUADRICEPS': 'outline',
      'HAMSTRINGS': 'outline',
      'ADDUCTORS': 'outline',
      'CALVES': 'secondary'
    };
    return colors[muscle] || 'default';
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
          {/* Header Skeleton */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <Skeleton className="h-10 w-20 shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
          
          {/* Cards Skeleton */}
          <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-80 w-full" />
          </div>
          
          {/* Statistics Skeleton */}
          <Skeleton className="h-32 w-full" />
          
          {/* Templates Skeleton */}
          <Skeleton className="h-64 w-full" />
          
          {/* Guide Skeleton */}
          <Skeleton className="h-48 w-full" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !program) {
    return (
      <AdminLayout>
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="flex items-start gap-4 mb-8">
            <Button variant="ghost" onClick={() => router.back()} className="shrink-0">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          
          <Card className="max-w-md mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Error Loading Program</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {error || 'Program not found or could not be loaded. Please try again or contact support if the problem persists.'}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Try Again
                </Button>
                <Button onClick={() => router.push('/admin/programs')}>
                  Return to Programs
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  const prices = formatPrice(program.price);

  return (
    <AdminLayout>
      <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <Button variant="ghost" onClick={() => router.back()} className="shrink-0 mt-1">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight break-words">
                {program.name.en || 'Untitled Program'}
              </h1>
              <p className="text-sm md:text-base text-muted-foreground mt-1 break-words">
                {program.description.en || 'No description available'}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Badge variant={program.isActive ? 'default' : 'secondary'} className="h-6 shrink-0">
              {program.isActive ? 'Active' : 'Inactive'}
            </Badge>
            <Button asChild className="w-full sm:w-auto">
              <Link href={`/admin/programs/${programId}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Program
              </Link>
            </Button>
          </div>
        </div>

        {/* Main Info Cards */}
        <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
          {/* Basic Information */}
          <Card className="h-fit">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg">
                <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Price</label>
                  <div className="space-y-1">
                    <div className="font-mono text-lg font-semibold text-green-600">${prices.usd} USD</div>
                    <div className="text-sm text-muted-foreground">{prices.tnd} TND</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">LemonSqueezy ID</label>
                  <div className="font-mono text-sm bg-muted px-2 py-1 rounded border">
                    {program.lemonSqueezyId || 'Not set'}
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium">Interactive Builder</span>
                  {program.hasInteractiveBuilder ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium">Allow Customization</span>
                  {program.allowsCustomization ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-muted-foreground">Created:</span>
                  <span className="text-sm font-mono">{formatDate(program.createdAt)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-muted-foreground">Last Updated:</span>
                  <span className="text-sm font-mono">{formatDate(program.updatedAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Program Structure */}
          <Card className="h-fit">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg">
                <Activity className="h-5 w-5 mr-2 text-muted-foreground" />
                Program Structure
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Structure Type</label>
                  <Badge variant="outline" className="w-fit">
                    {program.structureType || 'Not specified'}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Session Count</label>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">{program.sessionCount} sessions</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Training Days</label>
                  <div className="flex items-center">
                    <Dumbbell className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">{program.trainingDays} days/week</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Rest Days</label>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">{program.restDays} days/week</span>
                  </div>
                </div>
              </div>

              {program.weeklySchedule && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-muted-foreground">Weekly Schedule</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(program.weeklySchedule).map(([day, activity]) => (
                        activity && (
                          <div key={day} className="flex justify-between items-center p-2 bg-muted/30 rounded text-sm">
                            <span className="capitalize font-medium">{day}:</span>
                            <span className="text-muted-foreground truncate ml-2">{activity}</span>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Statistics */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-lg">
              <Users className="h-5 w-5 mr-2 text-muted-foreground" />
              Usage Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400">
                  {program._count.userPurchases}
                </div>
                <div className="text-sm font-medium text-green-700 dark:text-green-300 mt-1">Total Purchases</div>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {program._count.userPrograms}
                </div>
                <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mt-1">Active Configurations</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="text-2xl md:text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {program._count.exerciseTemplates}
                </div>
                <div className="text-sm font-medium text-purple-700 dark:text-purple-300 mt-1">Exercise Templates</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Workout Templates */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center">
                <Dumbbell className="h-5 w-5 mr-2 text-muted-foreground" />
                Workout Templates
              </div>
              <Badge variant="outline" className="ml-2">
                {program.workoutTemplates.length} {program.workoutTemplates.length === 1 ? 'template' : 'templates'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {program.workoutTemplates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium mb-2">No workout templates configured</h3>
                <p className="text-sm">This program needs workout templates to be functional for users.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {program.workoutTemplates.map((template, index) => (
                  <Card key={template.id} className="border-2 hover:border-primary/20 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-3">
                            <Badge variant="secondary" className="text-xs font-mono shrink-0">
                              #{template.order}
                            </Badge>
                            <h4 className="font-semibold text-base truncate">
                              {template.name.en || `Workout ${index + 1}`}
                            </h4>
                          </div>
                          
                          {template.requiredMuscleGroups.length > 0 ? (
                            <div>
                              <label className="text-sm font-medium text-muted-foreground mb-2 block">Target Muscle Groups</label>
                              <div className="flex flex-wrap gap-2">
                                {template.requiredMuscleGroups.map((muscle) => (
                                  <Badge 
                                    key={muscle}
                                    variant={getMuscleGroupBadgeVariant(muscle)}
                                    className="text-xs"
                                  >
                                    {muscle.toLowerCase().replace('_', ' ')}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground italic">
                              No muscle groups specified
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Program Guide */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
                Program Guide
              </div>
              <Badge variant={program.programGuide ? 'default' : 'destructive'} className="ml-2">
                {program.programGuide ? 'Complete' : 'Missing'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {program.programGuide ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-muted-foreground">Guide ID</span>
                    <div className="font-mono text-sm bg-background px-2 py-1 rounded border">
                      {program.programGuide.id}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-muted-foreground">Created</span>
                    <div className="text-sm">{formatDate(program.programGuide.createdAt)}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-muted-foreground">Last Updated</span>
                    <div className="text-sm">{formatDate(program.programGuide.updatedAt)}</div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-muted-foreground">Content Preview</label>
                    <Badge variant="outline" className="text-xs">JSON Format</Badge>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 max-h-40 overflow-y-auto border">
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">
                      {JSON.stringify(program.programGuide.content, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                  <XCircle className="h-8 w-8 text-destructive" />
                </div>
                <h3 className="text-lg font-medium mb-2">No program guide created</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Users will not be able to properly understand this program without a guide.
                </p>
                <Button variant="outline" size="sm">
                  Create Program Guide
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}