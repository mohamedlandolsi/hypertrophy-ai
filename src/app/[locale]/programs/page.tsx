'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { 
  Loader2, BookOpen, Settings, DollarSign, Crown, Sparkles,
  Search, Filter, ChevronDown, ChevronUp, Dumbbell, TrendingUp,
  Check, X, Eye, BarChart3, Users, Calendar, Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  browsePrograms: TrainingProgram[];
  totalPrograms: number;
  ownedCount: number;
  browseCount: number;
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

  // Filter and view state
  const [searchQuery, setSearchQuery] = useState('');
  const viewMode = 'grid'; // Fixed to grid view
  const [sortBy, setSortBy] = useState('popular');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string[]>([]);
  const [selectedSplit, setSelectedSplit] = useState<string[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<string[]>([]);
  const [isFilterVisible, setIsFilterVisible] = useState(true);

  useEffect(() => {
    async function loadPrograms() {
      setIsLoading(true);
      try {
        const supabase = createClient();
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !currentUser) {
          setIsAuthenticated(false);
          const response = await fetch('/api/programs');
          if (response.ok) {
            const data = await response.json();
            setProgramsData({
              ownedPrograms: [],
              browsePrograms: data.data.browsePrograms.map((p: TrainingProgram) => ({
                ...p,
                // Mock data for demo - would come from DB
                difficulty: (['beginner', 'intermediate', 'advanced'][Math.floor(Math.random() * 3)]) as 'beginner' | 'intermediate' | 'advanced',
                rating: 4.5 + Math.random() * 0.4,
                userCount: Math.floor(Math.random() * 500) + 50,
                split: ['3-Day', '4-Day', '5-Day', 'PPL'][Math.floor(Math.random() * 4)],
                duration: ['4-8 weeks', '8-12 weeks', '12+ weeks'][Math.floor(Math.random() * 3)],
                isFeatured: Math.random() > 0.7,
                isNew: Math.random() > 0.8
              })),
              totalPrograms: data.data.totalPrograms,
              ownedCount: 0,
              browseCount: data.data.browseCount
            });
          }
          return;
        }

        setIsAuthenticated(true);
        
        const response = await fetch('/api/programs');
        if (response.ok) {
          const data = await response.json();
          // Add mock metadata
          const enrichedData = {
            ...data.data,
            browsePrograms: data.data.browsePrograms.map((p: TrainingProgram) => ({
              ...p,
              difficulty: (['beginner', 'intermediate', 'advanced'][Math.floor(Math.random() * 3)]) as 'beginner' | 'intermediate' | 'advanced',
              rating: 4.5 + Math.random() * 0.4,
              userCount: Math.floor(Math.random() * 500) + 50,
              split: ['3-Day', '4-Day', '5-Day', 'PPL'][Math.floor(Math.random() * 4)],
              duration: ['4-8 weeks', '8-12 weeks', '12+ weeks'][Math.floor(Math.random() * 3)],
              isFeatured: Math.random() > 0.7,
              isNew: Math.random() > 0.8
            })),
            ownedPrograms: data.data.ownedPrograms.map((p: TrainingProgram) => ({
              ...p,
              difficulty: (['beginner', 'intermediate', 'advanced'][Math.floor(Math.random() * 3)]) as 'beginner' | 'intermediate' | 'advanced',
              rating: 4.5 + Math.random() * 0.4,
              userCount: Math.floor(Math.random() * 500) + 50,
              split: ['3-Day', '4-Day', '5-Day', 'PPL'][Math.floor(Math.random() * 4)],
              duration: ['4-8 weeks', '8-12 weeks', '12+ weeks'][Math.floor(Math.random() * 3)]
            }))
          };
          setProgramsData(enrichedData);
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
          setTemplates(templatesData);
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
    if (program.isOwned) {
      router.push(`/programs/${program.id}/guide`);
    } else {
      router.push(`/programs/${program.id}/about`);
    }
  };

  // Filter programs
  const getFilteredPrograms = (programs: TrainingProgram[]) => {
    return programs.filter(program => {
      // Search filter
      const programName = program.name.en || Object.values(program.name)[0] || '';
      const programDesc = program.description.en || Object.values(program.description)[0] || '';
      const matchesSearch = !searchQuery || 
        programName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        programDesc.toLowerCase().includes(searchQuery.toLowerCase());

      // Difficulty filter
      const matchesDifficulty = selectedDifficulty.length === 0 || 
        (program.difficulty && selectedDifficulty.includes(program.difficulty));

      // Split filter
      const matchesSplit = selectedSplit.length === 0 || 
        (program.split && selectedSplit.includes(program.split));

      // Duration filter
      const matchesDuration = selectedDuration.length === 0 || 
        (program.duration && selectedDuration.includes(program.duration));

      // Price range filter
      const priceInDollars = program.price / 100;
      const matchesPrice = priceRange.length === 0 || priceRange.some(range => {
        if (range === 'under-39') return priceInDollars < 39;
        if (range === '40-59') return priceInDollars >= 40 && priceInDollars <= 59;
        if (range === '60-plus') return priceInDollars >= 60;
        return true;
      });

      return matchesSearch && matchesDifficulty && matchesSplit && matchesDuration && matchesPrice;
    });
  };

  // Sort programs
  const getSortedPrograms = (programs: TrainingProgram[]) => {
    const sorted = [...programs];
    switch (sortBy) {
      case 'popular':
        return sorted.sort((a, b) => (b.userCount || 0) - (a.userCount || 0));
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'price-low':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price-high':
        return sorted.sort((a, b) => b.price - a.price);
      case 'rating':
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      default:
        return sorted;
    }
  };

  const getDifficultyLabel = (difficulty?: string) => {
    if (!difficulty) return 'Unknown';
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  };

  const clearAllFilters = () => {
    setSelectedDifficulty([]);
    setSelectedSplit([]);
    setSelectedDuration([]);
    setPriceRange([]);
    setSearchQuery('');
  };

  const hasActiveFilters = selectedDifficulty.length > 0 || selectedSplit.length > 0 || 
    selectedDuration.length > 0 || priceRange.length > 0 || searchQuery.length > 0;

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

  // Pro Upsell Card
  const ProUpsellCard = () => (
    <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 via-blue-50 to-purple-50 dark:from-purple-950/30 dark:via-blue-950/30 dark:to-purple-950/30 overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-400/20 to-purple-600/20 rounded-full blur-3xl" />
      <CardContent className="relative py-8">
        <div className="flex flex-col items-center text-center gap-4">
          <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-1">
            <Crown className="h-4 w-4 mr-1" />
            {t('proUpsell.badge')}
          </Badge>
          
          <div>
            <h3 className="text-2xl font-bold mb-2">{t('proUpsell.title')}</h3>
            <p className="text-muted-foreground text-sm">
              {t('proUpsell.subtitle')}
            </p>
          </div>

          <div className="w-full space-y-2 my-2">
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span>{t('proUpsell.benefits.allPrograms', { count: programsData?.totalPrograms || 0 })}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span>{t('proUpsell.benefits.unlimitedAI')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span>{t('proUpsell.benefits.analytics')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span>{t('proUpsell.benefits.earlyAccess')}</span>
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-baseline justify-center gap-2 mb-1">
              <span className="text-3xl font-bold">{t('proUpsell.pricing.monthly')}</span>
              <span className="text-muted-foreground">{t('proUpsell.pricing.perMonth')}</span>
            </div>
            <p className="text-xs text-muted-foreground">{t('proUpsell.pricing.yearly')}</p>
          </div>

          <Button 
            onClick={() => router.push('/pricing')}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            size="lg"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {t('proUpsell.cta')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

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
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary" />
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

  // Get filtered and sorted programs
  const filteredBrowsePrograms = getSortedPrograms(getFilteredPrograms(programsData.browsePrograms));
  const featuredPrograms = filteredBrowsePrograms.filter(p => p.isFeatured).slice(0, 2);
  const regularPrograms = filteredBrowsePrograms.filter(p => !p.isFeatured || !featuredPrograms.includes(p));

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

        {/* Sticky Filter Bar */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b -mx-4 px-4">
          {/* Toggle Button - Always Visible */}
          <div className="flex items-center justify-between py-3 sm:py-3">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {isFilterVisible ? t('filters.hideFilters') || 'Hide Filters' : t('filters.showFilters') || 'Show Filters'}
              </span>
              {hasActiveFilters && !isFilterVisible && (
                <Badge variant="secondary" className="text-xs">
                  {[
                    searchQuery ? 1 : 0,
                    selectedDifficulty.length,
                    selectedSplit.length,
                    selectedDuration.length,
                    priceRange.length
                  ].reduce((a, b) => a + b, 0)}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFilterVisible(!isFilterVisible)}
              className="h-8"
            >
              {isFilterVisible ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Collapsible Filter Section */}
          {isFilterVisible && (
            <div className="pb-3 sm:pb-4 mb-6 sm:mb-8 space-y-3 sm:space-y-4 border-t pt-3 sm:pt-4">
              {/* Search Bar - Full Width on Mobile */}
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('search.placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-11 sm:h-10"
                />
              </div>

              {/* Filters Row */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-2">
                {/* Filter Buttons */}
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 flex-1">
                  {/* Difficulty Filter */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-10 justify-start sm:justify-center">
                        <Filter className="h-4 w-4 mr-2" />
                        <span className="truncate">{t('filters.difficulty.label')}</span>
                        {selectedDifficulty.length > 0 && (
                          <Badge variant="secondary" className="ml-auto sm:ml-2 px-1.5 py-0 text-xs">
                            {selectedDifficulty.length}
                          </Badge>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      <DropdownMenuLabel>{t('filters.difficulty.selectLevel')}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {['beginner', 'intermediate', 'advanced'].map((level) => (
                        <DropdownMenuCheckboxItem
                          key={level}
                          checked={selectedDifficulty.includes(level)}
                          onCheckedChange={(checked) => {
                            setSelectedDifficulty(checked 
                              ? [...selectedDifficulty, level]
                              : selectedDifficulty.filter(d => d !== level)
                            );
                          }}
                        >
                          {t(`filters.difficulty.${level}`)}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Split Filter */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-10 justify-start sm:justify-center">
                        <span className="truncate">{t('filters.split.label')}</span>
                        {selectedSplit.length > 0 && (
                          <Badge variant="secondary" className="ml-auto sm:ml-2 px-1.5 py-0 text-xs">
                            {selectedSplit.length}
                          </Badge>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      <DropdownMenuLabel>{t('filters.split.title')}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {['3-Day', '4-Day', '5-Day', '6-Day', 'PPL', 'Upper/Lower'].map((split) => (
                        <DropdownMenuCheckboxItem
                          key={split}
                          checked={selectedSplit.includes(split)}
                          onCheckedChange={(checked) => {
                            setSelectedSplit(checked 
                              ? [...selectedSplit, split]
                              : selectedSplit.filter(s => s !== split)
                            );
                          }}
                        >
                          {split}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Duration Filter */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-10 justify-start sm:justify-center">
                        <span className="truncate">{t('filters.duration.label')}</span>
                        {selectedDuration.length > 0 && (
                          <Badge variant="secondary" className="ml-auto sm:ml-2 px-1.5 py-0 text-xs">
                            {selectedDuration.length}
                          </Badge>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      <DropdownMenuLabel>{t('filters.duration.title')}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {['4-8 weeks', '8-12 weeks', '12+ weeks'].map((duration) => (
                        <DropdownMenuCheckboxItem
                          key={duration}
                          checked={selectedDuration.includes(duration)}
                          onCheckedChange={(checked) => {
                            setSelectedDuration(checked 
                              ? [...selectedDuration, duration]
                              : selectedDuration.filter(d => d !== duration)
                            );
                          }}
                        >
                          {duration}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Price Filter */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-10 justify-start sm:justify-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        <span className="truncate">{t('filters.price.label')}</span>
                        {priceRange.length > 0 && (
                          <Badge variant="secondary" className="ml-auto sm:ml-2 px-1.5 py-0 text-xs">
                            {priceRange.length}
                          </Badge>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      <DropdownMenuLabel>{t('filters.price.title')}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {[
                        { value: 'under-39', label: t('filters.price.under39') },
                        { value: '40-59', label: t('filters.price.range4059') },
                        { value: '60-plus', label: t('filters.price.over60') }
                      ].map((range) => (
                        <DropdownMenuCheckboxItem
                          key={range.value}
                          checked={priceRange.includes(range.value)}
                          onCheckedChange={(checked) => {
                            setPriceRange(checked 
                              ? [...priceRange, range.value]
                              : priceRange.filter(p => p !== range.value)
                            );
                          }}
                        >
                          {range.label}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Clear Filters - Full Width on Mobile */}
                  {hasActiveFilters && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-10 col-span-2 sm:col-span-1 sm:w-auto" 
                      onClick={clearAllFilters}
                    >
                      <X className="h-4 w-4 mr-1" />
                      {t('filters.clearAll')}
                    </Button>
                  )}
                </div>

                {/* Sort Dropdown - Full Width on Mobile */}
                <div className="w-full sm:w-auto sm:min-w-[180px]">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full h-10">
                      <SelectValue placeholder={t('sort.label')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="popular">{t('sort.popular')}</SelectItem>
                      <SelectItem value="newest">{t('sort.newest')}</SelectItem>
                      <SelectItem value="rating">{t('sort.rating')}</SelectItem>
                      <SelectItem value="price-low">{t('sort.priceLow')}</SelectItem>
                      <SelectItem value="price-high">{t('sort.priceHigh')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Active Filters Display */}
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2">
                  {searchQuery && (
                    <Badge variant="secondary" className="gap-1">
                      Search: {searchQuery}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery('')} />
                    </Badge>
                  )}
                  {selectedDifficulty.map(d => (
                    <Badge key={d} variant="secondary" className="gap-1">
                      {getDifficultyLabel(d)}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => 
                        setSelectedDifficulty(selectedDifficulty.filter(item => item !== d))
                      } />
                    </Badge>
                  ))}
                  {selectedSplit.map(s => (
                    <Badge key={s} variant="secondary" className="gap-1">
                      {s}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => 
                        setSelectedSplit(selectedSplit.filter(item => item !== s))
                      } />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Featured Programs Section */}
        {!isAuthenticated && featuredPrograms.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">{t('sections.featured.title')}</h2>
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black">
                {t('sections.featured.badge')}
              </Badge>
            </div>
            <div className="grid gap-6 lg:grid-cols-1">
              {featuredPrograms.map(program => (
                <ProgramCard key={`featured-${program.id}`} program={program} variant="featured" />
              ))}
            </div>
          </div>
        )}

        {/* My Programs Section */}
        {isAuthenticated && programsData.ownedCount > 0 && (
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
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
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
                    {Array.from(new Set(templates.map(t => t.trainingSplit?.name).filter(Boolean))).map((split) => (
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

        {/* Browse Programs Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">
                {isAuthenticated && programsData.ownedCount > 0 
                  ? t('sections.browse.titleMore')
                  : t('sections.browse.titleAll')
                }
              </h2>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{t('search.showing', { count: filteredBrowsePrograms.length, total: programsData.browseCount })}</span>
            </div>
          </div>

          {filteredBrowsePrograms.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Filter className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('emptyState.noResults.title')}</h3>
                <p className="text-muted-foreground text-center mb-4 max-w-md">
                  {t('emptyState.noResults.message')}
                </p>
                {hasActiveFilters && (
                  <Button onClick={clearAllFilters} variant="outline">
                    <X className="h-4 w-4 mr-2" />
                    {t('emptyState.noResults.clearFilters')}
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {regularPrograms.map((program, index) => (
                  <>
                    <ProgramCard key={`browse-${program.id}`} program={program} />
                    {/* Pro Upsell every 6 programs */}
                    {!isAuthenticated && !programsData.isPro && index === 5 && viewMode === 'grid' && (
                      <ProUpsellCard key="pro-upsell" />
                    )}
                  </>
                ))}
              </div>

              {/* Load More Button */}
              {regularPrograms.length >= 12 && (
                <div className="flex justify-center mt-12">
                  <Button variant="outline" size="lg">
                    {t('loadMore.button')}
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Pro Banner at Bottom */}
        {isAuthenticated && !programsData.isPro && !programsData.isAdmin && (
          <div className="mt-16">
            <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 via-blue-50 to-purple-50 dark:from-purple-950/30 dark:via-blue-950/30 dark:to-purple-950/30">
              <CardContent className="py-12">
                <div className="max-w-3xl mx-auto text-center">
                  <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 mb-4">
                    <Sparkles className="h-4 w-4 mr-1" />
                    {t('proBanner.badge')}
                  </Badge>
                  <h2 className="text-3xl font-bold mb-4">
                    {t('proBanner.title', { count: programsData.totalPrograms })}
                  </h2>
                  <p className="text-lg text-muted-foreground mb-6">
                    {t('proBanner.subtitle')}
                  </p>
                  <Button 
                    onClick={() => router.push('/pricing')}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    size="lg"
                  >
                    <Crown className="h-5 w-5 mr-2" />
                    {t('proBanner.cta')}
                  </Button>
                  <p className="text-sm text-muted-foreground mt-4">
                    {t('proBanner.guarantee')}
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
