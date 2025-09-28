'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, ArrowLeft, ShoppingCart, Star, Calendar, DollarSign } from 'lucide-react';
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
  isOwned?: boolean;
}

export default function ProgramAboutPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params?.id as string;
  
  const [program, setProgram] = useState<TrainingProgram | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProgram() {
      if (!programId) return;
      
      setIsLoading(true);
      try {
        // Check authentication
        const supabase = createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        setIsAuthenticated(!!user && !userError);

        // Fetch specific program details
        const response = await fetch(`/api/programs/${programId}`);
        if (!response.ok) {
          throw new Error('Program not found');
        }

        const data = await response.json();
        if (data.success) {
          setProgram(data.program);
        } else {
          throw new Error(data.error || 'Failed to load program');
        }

      } catch (error) {
        console.error('Error loading program:', error);
        setError(error instanceof Error ? error.message : 'Failed to load program');
      } finally {
        setIsLoading(false);
      }
    }

    loadProgram();
  }, [programId]);

  const formatPrice = (priceInCents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(priceInCents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handlePurchase = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    // Navigate to checkout or pricing page
    router.push(`/checkout?program=${programId}`);
  };

  const handleBackToPrograms = () => {
    router.push('/programs');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading program details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <span className="text-destructive text-xl">!</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Program Not Found</h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              {error || 'The requested program could not be found or may no longer be available.'}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleBackToPrograms}>
                Back to Programs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const programName = program.name.en || Object.values(program.name)[0] || 'Unknown Program';
  const programDescription = program.description.en || Object.values(program.description)[0] || 'No description available';

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Navigation */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={handleBackToPrograms}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Programs
        </Button>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Program Header */}
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">{programName}</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {programDescription}
            </p>
          </div>
          
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              <span className="font-medium text-lg text-foreground">{formatPrice(program.price)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Created {formatDate(program.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4" />
              <Badge variant={program.isActive ? "default" : "secondary"}>
                {program.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Program Thumbnail */}
        {program.thumbnailUrl && (
          <Card>
            <CardContent className="p-0">
              <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                <Image
                  src={program.thumbnailUrl}
                  alt={programName}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
                  priority
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Program About Content */}
        {program.aboutContent ? (
          <Card>
            <CardHeader>
              <CardTitle>About This Program</CardTitle>
              <CardDescription>
                Everything you need to know about this training program
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: program.aboutContent }}
              />
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <span className="text-muted-foreground text-xl">📝</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">No Detailed Description</h3>
              <p className="text-muted-foreground">
                This program doesn&apos;t have a detailed description yet, but you can still purchase and configure it.
              </p>
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* Purchase/Action Section */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Ready to Get Started?</CardTitle>
            <CardDescription className="text-base">
              Purchase this program and start building your personalized training plan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Pricing */}
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {formatPrice(program.price)}
              </div>
              <p className="text-sm text-muted-foreground">
                One-time purchase • Lifetime access
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto">
              <Button
                onClick={handlePurchase}
                className="flex-1 h-12"
                size="lg"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {isAuthenticated ? 'Purchase Program' : 'Sign In to Purchase'}
              </Button>
            </div>

            {/* Additional Info */}
            {!isAuthenticated && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Need an account?{' '}
                  <Button
                    variant="link"
                    className="p-0 h-auto text-sm"
                    onClick={() => router.push('/signup')}
                  >
                    Sign up here
                  </Button>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}