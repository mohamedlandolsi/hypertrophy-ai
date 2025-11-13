'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, BookOpen, Settings, Crown, Sparkles,
  Filter, Dumbbell,
  Check, X, Eye, BarChart3, Users, Calendar, Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { ProgramDashboardCTA } from '@/components/program-dashboard-cta';

interface TrainingProgram {
  id: string;
  name: Record<string, string>;
  description: Record<string, string>;
  price: number;
  isActive: boolean;
  thumbnailUrl?: string;
  aboutContent?: string;
  createdAt: string;
  purchaseDate?: string;
  isOwned: boolean;
  isAdminAccess?: boolean;
  isProAccess?: boolean;
  accessReason?: 'admin' | 'pro_subscription' | 'purchased' | 'free';
  // Additional metadata for filtering (these would come from DB in real implementation)
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  split?: string;
  duration?: string;
  rating?: number;
  userCount?: number;
  isFeatured?: boolean;
  isNew?: boolean;
  tags?: string[];
}

interface ProgramsData {
  ownedPrograms: TrainingProgram[];
  ownedCount: number;
  isAdmin?: boolean;
  isPro?: boolean;
}

// Template interfaces
interface Template {
  id: string;
  name: string;
  description: string | null;
  difficultyLevel: string;
  popularity: number;
  trainingSplit: {
    name: string;
  } | null;
  splitStructure: {
    pattern: string | null;
    daysPerWeek: number | null;
  } | null;
  _count: {
    trainingPrograms: number;
    templateWorkouts: number;
  };
}

interface TemplateExercise {
  id: string;
  exerciseId: string;
  sets: number;
  reps: string;
  isUnilateral: boolean;
  order: number;
  exercise: {
    name: string;
    primaryMuscle: string;
    secondaryMuscles: string[];
  };
}

interface TemplateWorkout {
  id: string;
  name: string;
  workoutType: string;
  assignedDays: string[];
  order: number;
  templateExercises: TemplateExercise[];
}

interface TemplateDetail extends Template {
  templateWorkouts: TemplateWorkout[];
}

export default function ProgramsPage() {
  const t = useTranslations('ProgramsPage');
  const params = useParams();
  const locale = params?.locale as string || 'en';
  const [programsData, setProgramsData] = useState<ProgramsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [navigatingToProgramId, setNavigatingToProgramId] = useState<string | null>(null);
  const router = useRouter();

  // Template state
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDetail | null>(null);
  const [isTemplatePreviewOpen, setIsTemplatePreviewOpen] = useState(false);
  const [templateFilters, setTemplateFilters] = useState({
    difficulty: [] as string[],
    split: [] as string[],
  });
  const [userProgramCount, setUserProgramCount] = useState(0);
  const [userPlan, setUserPlan] = useState<'FREE' | 'PRO'>('FREE');

  useEffect(() => {
    async function loadPrograms() {
      setIsLoading(true);
      try {
        const supabase = createClient();
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !currentUser) {
          setIsAuthenticated(false);
          // Guest users see minimal data
          setProgramsData({
            ownedPrograms: [],
            ownedCount: 0
          });
          return;
        }

        setIsAuthenticated(true);
        
        const response = await fetch('/api/programs');
        if (response.ok) {
          const data = await response.json();
          setProgramsData({
            ownedPrograms: data.data.ownedPrograms || [],
            ownedCount: data.data.ownedCount || 0,
            isAdmin: data.data.isAdmin,
            isPro: data.data.isPro
          });
        } else {
          throw new Error('Failed to fetch programs');
        }

      } catch (error) {
        console.error('Error loading programs:', error);
        toast.error('Failed to load programs');
      } finally {
        setIsLoading(false);
      }
    }

    loadPrograms();
  }, []);

  // Fetch templates
  useEffect(() => {
    async function loadTemplates() {
      if (!isAuthenticated) return;
      
      setIsLoadingTemplates(true);
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;

        // Fetch templates
        const templatesResponse = await fetch('/api/programs/templates');
        if (templatesResponse.ok) {
          const templatesData = await templatesResponse.json();
          console.log('Templates response:', templatesData); // Debug log
          setTemplates(templatesData.templates || []);
        } else {
          console.error('Failed to fetch templates:', templatesResponse.status);
        }

        // Fetch user's program count and plan
        const userResponse = await fetch('/api/user/programs-count');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUserProgramCount(userData.count || 0);
          setUserPlan(userData.plan || 'FREE');
        }
      } catch (error) {
        console.error('Error loading templates:', error);
      } finally {
        setIsLoadingTemplates(false);
      }
    }

    loadTemplates();
  }, [isAuthenticated]);

  // Fetch template details for preview
  const fetchTemplateDetails = async (templateId: string) => {
    try {
      const response = await fetch(`/api/programs/templates/${templateId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedTemplate(data);
        setIsTemplatePreviewOpen(true);
      } else {
        toast.error('Failed to load template details');
      }
    } catch (error) {
      console.error('Error fetching template details:', error);
      toast.error('Failed to load template details');
    }
  };

  // Get difficulty badge color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toUpperCase()) {
      case 'BEGINNER':
        return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'INTERMEDIATE':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case 'ADVANCED':
        return 'bg-red-500/10 text-red-700 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  // Filter templates
  const getFilteredTemplates = () => {
    if (!Array.isArray(templates)) return [];
    
    return templates.filter(template => {
      const matchesDifficulty = templateFilters.difficulty.length === 0 || 
        templateFilters.difficulty.includes(template.difficultyLevel.toUpperCase());
      
      const matchesSplit = templateFilters.split.length === 0 || 
        (template.trainingSplit && templateFilters.split.includes(template.trainingSplit.name));
      
      return matchesDifficulty && matchesSplit;
    });
  };

  // Check if user can create more programs
  const canCreateProgram = () => {
    if (userPlan === 'PRO') return true;
    return userProgramCount < 2;
  };

  const formatPrice = (priceInCents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(priceInCents / 100);
  };

  const handleProgramClick = (program: TrainingProgram) => {
    setNavigatingToProgramId(program.id);
    router.push(`/${locale}/programs/${program.id}/guide`);
  };

  // Modern Program Card Component
  const ProgramCard = ({ program, variant = 'default' }: { program: TrainingProgram; variant?: 'default' | 'featured' }) => {
    const programName = program.name.en || Object.values(program.name)[0] || 'Unknown Program';
    const programDescription = program.description.en || Object.values(program.description)[0] || 'No description available';
    const isNavigating = navigatingToProgramId === program.id;
    const isFeatured = variant === 'featured';

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
      >
        <Card 
          className={`flex flex-col cursor-pointer hover:shadow-xl transition-all group overflow-hidden border-2 hover:border-primary/50 ${
            isNavigating ? 'opacity-70 pointer-events-none' : ''
          } ${isFeatured ? 'lg:flex-row' : ''}`}
          onClick={() => handleProgramClick(program)}
        >
          {/* Program Image */}
          <div className={`relative ${isFeatured ? 'lg:w-1/2' : 'w-full h-48'} bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden`}>
            {program.thumbnailUrl ? (
              <Image
                src={program.thumbnailUrl}
                alt={programName}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Dumbbell className="h-16 w-16 text-white/30" />
              </div>
            )}
            
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            
            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-2">
              {program.isNew && (
                <Badge className="bg-yellow-500 text-black border-none">{t('card.badges.new')}</Badge>
              )}
              {isFeatured && (
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black border-none">
                  ⭐ {t('card.badges.featured')}
                </Badge>
              )}
            </div>

            {/* Owned/Pro badge */}
            <div className="absolute top-3 right-3">
              {program.isOwned && program.isProAccess ? (
                <Badge className="text-xs bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg">
                  <Crown className="h-3 w-3 mr-1" />
                  {t('card.badges.proAccess')}
                </Badge>
              ) : program.isOwned ? (
                <Badge className="bg-green-600 text-white shadow-lg">
                  <Check className="h-3 w-3 mr-1" />
                  {t('card.badges.owned')}
                </Badge>
              ) : null}
            </div>
          </div>

          {/* Card Content */}
          <div className={`flex flex-col ${isFeatured ? 'lg:w-1/2' : 'flex-1'}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg line-clamp-1 group-hover:text-primary transition-colors">
                {programName}
              </CardTitle>
              <CardDescription className={`${isFeatured ? 'line-clamp-3' : 'line-clamp-2'} text-sm`}>
                {programDescription}
              </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col gap-4">
              {/* Mobile Tracking Badge */}
              <div className="flex items-center gap-1.5 text-sm">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">{t('card.specs.mobileTracking')}</span>
              </div>

              {isFeatured && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold">{t('card.highlights.title')}</p>
                  <ul className="space-y-1">
                    <li className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{t('card.highlights.item1')}</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{t('card.highlights.item2')}</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{t('card.highlights.item3')}</span>
                    </li>
                  </ul>
                </div>
              )}

              {/* Spacer */}
              <div className="flex-1" />

              {/* Price and CTA */}
              <div className="space-y-3 pt-2 border-t">
                {!program.isOwned && (
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">{formatPrice(program.price)}</span>
                      <span className="text-sm text-muted-foreground">{t('card.pricing.oneTime')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{t('card.pricing.lifetimeAccess')}</p>
                  </div>
                )}

                {program.isOwned ? (
                  <Button 
                    className="w-full"
                    size={isFeatured ? "lg" : "default"}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProgramClick(program);
                    }}
                    disabled={isNavigating}
                  >
                    {isNavigating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t('card.cta.loading')}
                      </>
                    ) : (
                      <>
                        <Settings className="h-4 w-4 mr-2" />
                        {t('card.cta.accessProgram')}
                      </>
                    )}
                  </Button>
                ) : (
                  <Button 
                    className="w-full group-hover:shadow-lg transition-shadow" 
                    size={isFeatured ? "lg" : "default"}
                    disabled={isNavigating}
                  >
                    {isNavigating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t('card.cta.loading')}
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        {t('card.cta.viewDetails')}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </div>
        </Card>
      </motion.div>
    );
  };

  // Template Card Component
  const TemplateCard = ({ template }: { template: Template }) => {
    const canCreate = canCreateProgram();
    const totalExercises = template._count.templateWorkouts * 6; // Rough estimate

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
      >
        <Card 
          className="group relative overflow-hidden cursor-pointer border-2 hover:border-primary hover:shadow-xl transition-all duration-300"
          onClick={() => fetchTemplateDetails(template.id)}
        >
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <CardHeader className="relative pb-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <CardTitle className="text-lg line-clamp-1 group-hover:text-primary transition-colors">
                {template.name}
              </CardTitle>
              <Badge className={`${getDifficultyColor(template.difficultyLevel)} border shrink-0`}>
                {template.difficultyLevel}
              </Badge>
            </div>
            
            {template.description && (
              <CardDescription className="line-clamp-2 text-sm">
                {template.description}
              </CardDescription>
            )}
          </CardHeader>

          <CardContent className="relative space-y-4">
            {/* Template Info */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Dumbbell className="h-4 w-4 text-primary" />
                <span>{template.trainingSplit?.name || 'Custom Split'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-primary" />
                <span>{template._count.trainingPrograms} {template._count.trainingPrograms === 1 ? 'use' : 'uses'}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{template._count.templateWorkouts} workouts</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Zap className="h-4 w-4" />
                <span>~{totalExercises} exercises</span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-2 border-t">
              {userPlan === 'FREE' && (
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <Crown className="h-3 w-3" />
                  Uses 1 program slot ({userProgramCount}/2 used)
                </p>
              )}
              
              {!canCreate ? (
                <div className="space-y-2">
                  <Button 
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/${locale}/pricing`);
                    }}
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade to Pro
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Upgrade to create unlimited programs
                  </p>
                </div>
              ) : (
                <Button 
                  className="w-full group-hover:shadow-lg transition-shadow"
                  onClick={(e) => {
                    e.stopPropagation();
                    fetchTemplateDetails(template.id);
                  }}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Use Template
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // Template Preview Modal
  const TemplatePreviewModal = () => {
    if (!selectedTemplate) return null;

    const totalExercises = selectedTemplate.templateWorkouts.reduce(
      (sum, workout) => sum + workout.templateExercises.length,
      0
    );

    return (
      <Dialog open={isTemplatePreviewOpen} onOpenChange={setIsTemplatePreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <DialogTitle className="text-2xl mb-2">{selectedTemplate.name}</DialogTitle>
                <DialogDescription className="text-base">
                  {selectedTemplate.description || 'A comprehensive training template to help you achieve your goals.'}
                </DialogDescription>
              </div>
              <Badge className={`${getDifficultyColor(selectedTemplate.difficultyLevel)} border shrink-0`}>
                {selectedTemplate.difficultyLevel}
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Template Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Dumbbell className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">{selectedTemplate._count.templateWorkouts}</p>
                    <p className="text-sm text-muted-foreground">Workouts</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Zap className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">{totalExercises}</p>
                    <p className="text-sm text-muted-foreground">Exercises</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Dumbbell className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">{selectedTemplate.trainingSplit?.name || 'Custom'}</p>
                    <p className="text-sm text-muted-foreground">Split Type</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">{selectedTemplate._count.trainingPrograms}</p>
                    <p className="text-sm text-muted-foreground">Times Used</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Workouts List */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Training Workouts</h3>
              <div className="space-y-3">
                {selectedTemplate.templateWorkouts.map((workout, index) => (
                  <Card key={workout.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          Day {index + 1}: {workout.name}
                        </CardTitle>
                        <Badge variant="outline">
                          {workout.templateExercises.length} exercises
                        </Badge>
                      </div>
                      {workout.assignedDays.length > 0 && (
                        <CardDescription className="text-sm">
                          Scheduled: {workout.assignedDays.join(', ')}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {workout.templateExercises.slice(0, 3).map((exercise) => (
                          <div key={exercise.id} className="flex items-center justify-between text-sm">
                            <span className="font-medium">{exercise.exercise.name}</span>
                            <span className="text-muted-foreground">
                              {exercise.sets} × {exercise.reps}
                              {exercise.isUnilateral && ' (each side)'}
                            </span>
                          </div>
                        ))}
                        {workout.templateExercises.length > 3 && (
                          <p className="text-sm text-muted-foreground text-center pt-2 border-t">
                            +{workout.templateExercises.length - 3} more exercises
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* CTA Section */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsTemplatePreviewOpen(false)}
              >
                Close
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700"
                onClick={() => {
                  setIsTemplatePreviewOpen(false);
                  router.push(`/${locale}/programs/create?template=${selectedTemplate.id}`);
                }}
                disabled={!canCreateProgram()}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Use This Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">{t('loading.programs')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!programsData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('error.title')}</h3>
            <p className="text-muted-foreground text-center mb-4">
              {t('error.message')}
            </p>
            <Button onClick={() => window.location.reload()}>
              {t('error.retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Loading overlay */}
      {navigatingToProgramId && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card p-8 rounded-lg shadow-lg text-center max-w-sm mx-4 border">
            <div className="mb-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('loading.title')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('loading.message')}
            </p>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {t('title')}
          </h1>
          <p className="text-lg text-muted-foreground">
            {isAuthenticated 
              ? (programsData?.isAdmin 
                  ? t('subtitle.admin')
                  : programsData?.isPro
                  ? t('subtitle.pro')
                  : t('subtitle.user')
                )
              : t('subtitle.guest')
            }
          </p>
        </div>

        {/* Quick Actions CTA */}
        {isAuthenticated && programsData && (
          <>
            <ProgramDashboardCTA 
              isPro={programsData.isPro || false} 
              programCount={programsData.ownedCount}
            />
            <Separator className="my-8" />
          </>
        )}

        {/* My Programs Section */}
        {isAuthenticated && programsData && programsData.ownedCount > 0 && (
          <>
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Dumbbell className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">
                    {programsData.isAdmin 
                      ? t('sections.myPrograms.titleAdmin')
                      : programsData.isPro 
                      ? t('sections.myPrograms.titlePro')
                      : t('sections.myPrograms.title')
                    }
                  </h2>
                  {programsData.isPro && (
                    <Badge className="bg-gradient-to-r from-purple-600 to-blue-600">
                      <Crown className="h-3 w-3 mr-1" />
                      Pro
                    </Badge>
                  )}
                </div>
                <Badge variant="outline" className="text-sm">
                  {programsData.ownedCount} program{programsData.ownedCount !== 1 ? 's' : ''}
                </Badge>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {programsData.ownedPrograms.map(program => (
                  <ProgramCard key={`owned-${program.id}`} program={program} />
                ))}
              </div>
            </div>
            <Separator className="my-12" />
          </>
        )}

        {/* Browse Templates Section */}
        {isAuthenticated && (
          <>
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-primary" />
                  <div>
                    <h2 className="text-2xl font-bold">Browse Templates</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Start with a pre-built template and customize it to your needs
                    </p>
                  </div>
                </div>

                {/* Template Filters */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                      {(templateFilters.difficulty.length + templateFilters.split.length) > 0 && (
                        <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-xs">
                          {templateFilters.difficulty.length + templateFilters.split.length}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Difficulty Level</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map((difficulty) => (
                      <DropdownMenuCheckboxItem
                        key={difficulty}
                        checked={templateFilters.difficulty.includes(difficulty)}
                        onCheckedChange={(checked) => {
                          setTemplateFilters(prev => ({
                            ...prev,
                            difficulty: checked 
                              ? [...prev.difficulty, difficulty]
                              : prev.difficulty.filter(d => d !== difficulty)
                          }));
                        }}
                      >
                        {difficulty.charAt(0) + difficulty.slice(1).toLowerCase()}
                      </DropdownMenuCheckboxItem>
                    ))}
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Training Split</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {Array.isArray(templates) && Array.from(new Set(templates.map(t => t.trainingSplit?.name).filter(Boolean))).map((split) => (
                      <DropdownMenuCheckboxItem
                        key={split}
                        checked={templateFilters.split.includes(split as string)}
                        onCheckedChange={(checked) => {
                          setTemplateFilters(prev => ({
                            ...prev,
                            split: checked 
                              ? [...prev.split, split as string]
                              : prev.split.filter(s => s !== split)
                          }));
                        }}
                      >
                        {split}
                      </DropdownMenuCheckboxItem>
                    ))}

                    {(templateFilters.difficulty.length + templateFilters.split.length) > 0 && (
                      <>
                        <DropdownMenuSeparator />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full"
                          onClick={() => setTemplateFilters({ difficulty: [], split: [] })}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Clear Filters
                        </Button>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {isLoadingTemplates ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                        <div className="h-4 bg-muted rounded w-full" />
                        <div className="h-4 bg-muted rounded w-2/3" />
                      </CardHeader>
                      <CardContent>
                        <div className="h-10 bg-muted rounded" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : getFilteredTemplates().length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No templates found</h3>
                    <p className="text-muted-foreground text-center mb-4 max-w-md">
                      {(templateFilters.difficulty.length + templateFilters.split.length) > 0 
                        ? 'Try adjusting your filters to see more templates'
                        : 'Templates will appear here once they are created by administrators'
                      }
                    </p>
                    {(templateFilters.difficulty.length + templateFilters.split.length) > 0 && (
                      <Button 
                        onClick={() => setTemplateFilters({ difficulty: [], split: [] })}
                        variant="outline"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear Filters
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {getFilteredTemplates().map(template => (
                    <TemplateCard key={template.id} template={template} />
                  ))}
                </div>
              )}
            </div>
            <Separator className="my-12" />
          </>
        )}

        {/* Template Preview Modal */}
        <TemplatePreviewModal />

        {/* Upgrade to Pro Section */}
        {isAuthenticated && !programsData.isPro && !programsData.isAdmin && (
          <div className="mt-8">
            <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 via-blue-50 to-purple-50 dark:from-purple-950/30 dark:via-blue-950/30 dark:to-purple-950/30">
              <CardContent className="py-12">
                <div className="max-w-3xl mx-auto text-center space-y-6">
                  <Badge className="bg-gradient-to-r from-purple-600 to-blue-600">
                    <Sparkles className="h-4 w-4 mr-1" />
                    Unlock Full Potential
                  </Badge>
                  <h2 className="text-3xl md:text-4xl font-bold">
                    Upgrade to Pro for Unlimited Access
                  </h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Get unlimited custom programs, unlimited AI coaching conversations, unlimited knowledge uploads, and access to all future features
                  </p>
                  
                  <div className="grid md:grid-cols-3 gap-4 my-8">
                    <div className="p-4 rounded-lg bg-background/60 backdrop-blur">
                      <div className="text-3xl font-bold mb-2">Unlimited</div>
                      <div className="text-sm text-muted-foreground">Custom Programs</div>
                    </div>
                    <div className="p-4 rounded-lg bg-background/60 backdrop-blur">
                      <div className="text-3xl font-bold mb-2">Unlimited</div>
                      <div className="text-sm text-muted-foreground">AI Conversations</div>
                    </div>
                    <div className="p-4 rounded-lg bg-background/60 backdrop-blur">
                      <div className="text-3xl font-bold mb-2">Unlimited</div>
                      <div className="text-sm text-muted-foreground">Knowledge Uploads</div>
                    </div>
                  </div>

                  <Button 
                    onClick={() => router.push(`/${locale}/pricing`)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    size="lg"
                  >
                    <Crown className="h-5 w-5 mr-2" />
                    View Pro Plans
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Starting at just $19/month • Cancel anytime
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sign In CTA for non-authenticated */}
        {!isAuthenticated && (
          <div className="mt-12">
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">{t('signInCta.title')}</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  {t('signInCta.subtitle')}
                </p>
                <div className="flex gap-3">
                  <Button onClick={() => router.push('/login')} size="lg">
                    {t('signInCta.signIn')}
                  </Button>
                  <Button onClick={() => router.push('/signup')} variant="outline" size="lg">
                    {t('signInCta.createAccount')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
