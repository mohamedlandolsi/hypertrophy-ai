'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, BookOpen, Settings, ShoppingCart, Star, Calendar, DollarSign, Crown, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';

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

export default function ProgramsPage() {
  const [programsData, setProgramsData] = useState<ProgramsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [navigatingToProgramId, setNavigatingToProgramId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadPrograms() {
      setIsLoading(true);
      try {
        // Check authentication
        const supabase = createClient();
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !currentUser) {
          setIsAuthenticated(false);
          // Still fetch programs for browse-only view
          const response = await fetch('/api/programs');
          if (response.ok) {
            const data = await response.json();
            setProgramsData({
              ownedPrograms: [],
              browsePrograms: data.data.browsePrograms,
              totalPrograms: data.data.totalPrograms,
              ownedCount: 0,
              browseCount: data.data.browseCount
            });
          }
          return;
        }

        setIsAuthenticated(true);
        
        // Fetch programs with user purchase status
        const response = await fetch('/api/programs');
        if (response.ok) {
          const data = await response.json();
          setProgramsData(data.data);
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

  const formatPrice = (priceInCents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(priceInCents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleProgramClick = (program: TrainingProgram) => {
    setNavigatingToProgramId(program.id);
    if (program.isOwned) {
      // Navigate to program guide page for owned programs (including admin access)
      router.push(`/programs/${program.id}/guide`);
    } else {
      // Navigate to program about page
      router.push(`/programs/${program.id}/about`);
    }
  };

  const handleAccessProgram = (programId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setNavigatingToProgramId(programId);
    router.push(`/programs/${programId}/guide`);
  };

  const ProgramCard = ({ program, showPurchaseDate = false }: { program: TrainingProgram; showPurchaseDate?: boolean }) => {
    const programName = program.name.en || Object.values(program.name)[0] || 'Unknown Program';
    const programDescription = program.description.en || Object.values(program.description)[0] || 'No description available';
    const isNavigating = navigatingToProgramId === program.id;

    return (
      <Card 
        key={program.id} 
        className={`flex flex-col cursor-pointer hover:shadow-md transition-shadow ${isNavigating ? 'opacity-70 pointer-events-none' : ''}`}
        onClick={() => handleProgramClick(program)}
      >
        <CardHeader className="pb-2">
          {program.thumbnailUrl && (
            <div className="relative w-full h-32 mb-3 rounded-lg overflow-hidden bg-muted">
              <Image
                src={program.thumbnailUrl}
                alt={programName}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          )}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg line-clamp-1">{programName}</CardTitle>
              <CardDescription className="mt-1 line-clamp-2">
                {programDescription}
              </CardDescription>
            </div>
            <div className="ml-2 shrink-0 flex flex-col gap-1">
              {program.isOwned && program.isAdminAccess ? (
                <Badge variant="destructive" className="text-xs">
                  Admin Access
                </Badge>
              ) : program.isOwned && program.isProAccess ? (
                <Badge className="text-xs bg-gradient-to-r from-purple-600 to-blue-600">
                  <Crown className="h-3 w-3 mr-1" />
                  Pro Access
                </Badge>
              ) : program.isOwned ? (
                <Badge variant="default">
                  Owned
                </Badge>
              ) : (
                <Badge variant="secondary">
                  {formatPrice(program.price)}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col pt-2">
          <div className="space-y-2 mb-4 flex-1">
            {showPurchaseDate && program.purchaseDate && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-3 w-3 mr-1" />
                <span>Purchased {formatDate(program.purchaseDate)}</span>
              </div>
            )}
            {!program.isOwned && (
              <div className="flex items-center text-sm">
                <DollarSign className="h-3 w-3 mr-1 text-muted-foreground" />
                <span className="font-medium">{formatPrice(program.price)}</span>
              </div>
            )}
            <div className="flex items-center text-sm text-muted-foreground">
              <Star className="h-3 w-3 mr-1" />
              <span>Created {formatDate(program.createdAt)}</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            {program.isOwned ? (
              <Button 
                className="w-full"
                onClick={(e) => handleAccessProgram(program.id, e)}
                disabled={isNavigating}
              >
                {isNavigating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Settings className="h-4 w-4 mr-2" />
                    Access Program
                  </>
                )}
              </Button>
            ) : (
              <Button className="w-full" disabled={isNavigating}>
                {isNavigating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Learn More
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading programs...</p>
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
            <h3 className="text-lg font-semibold mb-2">Unable to Load Programs</h3>
            <p className="text-muted-foreground text-center mb-4">
              There was an issue loading the training programs. Please try again later.
            </p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Loading overlay when navigating to a program */}
      {navigatingToProgramId && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card p-8 rounded-lg shadow-lg text-center max-w-sm mx-4 border">
            <div className="mb-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Loading Program</h3>
            <p className="text-sm text-muted-foreground">
              Taking you to the program guide...
            </p>
          </div>
        </div>
      )}
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Training Programs</h1>
        <p className="text-muted-foreground">
          {isAuthenticated 
            ? (programsData?.isAdmin 
                ? "Admin access: View and manage all training programs" 
                : programsData?.isPro
                ? "Pro member: Full access to all training programs"
                : "Manage your owned programs and discover new training plans"
              )
            : "Discover professional training programs designed for your fitness goals"
          }
        </p>
      </div>

      {/* Pro Subscription Banner - Show for non-Pro authenticated users with browse programs */}
      {isAuthenticated && !programsData.isPro && !programsData.isAdmin && programsData.browseCount > 0 && (
        <Card className="mb-8 border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-lg font-semibold">Upgrade to Pro</h3>
                  <Badge className="bg-gradient-to-r from-purple-600 to-blue-600">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Best Value
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Get unlimited access to all {programsData.totalPrograms} training programs for one monthly price. 
                  {programsData.ownedCount > 0 && ` You've already purchased ${programsData.ownedCount} program${programsData.ownedCount > 1 ? 's' : ''}.`}
                </p>
                <div className="flex flex-wrap gap-3 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span>All programs included</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span>Future programs free</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Crown className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span>Premium support</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={() => router.push('/pricing')}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  View Pro Plans
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Starting at $19/month
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* My Programs Section - Only show if authenticated and has programs */}
      {isAuthenticated && programsData.ownedCount > 0 && (
        <>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-semibold">
                  {programsData.isAdmin ? 'All Programs (Admin Access)' : programsData.isPro ? 'All Programs' : 'My Programs'}
                </h2>
                <p className="text-muted-foreground">
                  {programsData.isAdmin 
                    ? 'Administrative access to all training programs'
                    : programsData.isPro
                    ? 'Pro membership: Full access to all training programs'
                    : 'Programs you own and can configure'
                  }
                </p>
              </div>
              <div className="flex items-center gap-2">
                {programsData.isPro && (
                  <Badge className="bg-gradient-to-r from-purple-600 to-blue-600">
                    <Crown className="h-3 w-3 mr-1" />
                    Pro
                  </Badge>
                )}
                <Badge variant="outline" className="text-sm">
                  {programsData.ownedCount} program{programsData.ownedCount !== 1 ? 's' : ''}
                </Badge>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {programsData.ownedPrograms.map((program) => (
                <ProgramCard key={`owned-${program.id}`} program={program} showPurchaseDate={true} />
              ))}
            </div>
          </div>
          <Separator className="my-8" />
        </>
      )}

      {/* Browse Programs Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-semibold">
              {isAuthenticated && programsData.ownedCount > 0 ? "Browse Programs" : "Available Programs"}
            </h2>
            <p className="text-muted-foreground">
              {isAuthenticated && programsData.ownedCount > 0 
                ? "Discover new programs to add to your collection"
                : "Professional training programs designed for your fitness goals"
              }
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            {programsData.browseCount} program{programsData.browseCount !== 1 ? 's' : ''}
          </Badge>
        </div>

        {programsData.browseCount === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {isAuthenticated && programsData.ownedCount > 0 
                  ? "All Programs Owned!" 
                  : "No Programs Available"
                }
              </h3>
              <p className="text-muted-foreground text-center">
                {isAuthenticated && programsData.ownedCount > 0 
                  ? "You already own all available training programs. Check back later for new releases!"
                  : "There are no training programs available at the moment. Check back soon!"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {programsData.browsePrograms.map((program) => (
              <ProgramCard key={`browse-${program.id}`} program={program} />
            ))}
          </div>
        )}
      </div>

      {/* Not authenticated notice */}
      {!isAuthenticated && (
        <div className="mt-8">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <BookOpen className="h-8 w-8 text-muted-foreground mb-3" />
              <h3 className="text-lg font-semibold mb-2">Want to Purchase Programs?</h3>
              <p className="text-muted-foreground mb-4">
                Sign in to purchase and configure your own training programs.
              </p>
              <Button onClick={() => router.push('/login')}>
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}