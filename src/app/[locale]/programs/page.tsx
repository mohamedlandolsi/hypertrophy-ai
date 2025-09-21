'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, BookOpen, Settings, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface TrainingProgram {
  id: string;
  name: Record<string, string>;
  description: Record<string, string>;
  price: number;
  isActive: boolean;
}

interface UserPurchase {
  id: string;
  trainingProgramId: string;
  purchaseDate: string;
  trainingProgram: TrainingProgram;
}

interface UserProgram {
  id: string;
  trainingProgramId: string;
  category: string;
  createdAt: string;
  trainingProgram: TrainingProgram;
}

export default function ProgramsPage() {
  const [userPurchases, setUserPurchases] = useState<UserPurchase[]>([]);
  const [userPrograms, setUserPrograms] = useState<UserProgram[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadUserPrograms() {
      setIsLoading(true);
      try {
        // Check authentication
        const supabase = createClient();
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !currentUser) {
          router.push('/login');
          return;
        }

        // Fetch user's purchased programs
        const purchasesResponse = await fetch('/api/user/programs/purchases');
        if (purchasesResponse.ok) {
          const purchasesData = await purchasesResponse.json();
          setUserPurchases(purchasesData.purchases || []);
        }

        // Fetch user's configured programs
        const programsResponse = await fetch('/api/user/programs/configurations');
        if (programsResponse.ok) {
          const programsData = await programsResponse.json();
          setUserPrograms(programsData.programs || []);
        }

      } catch (error) {
        console.error('Error loading programs:', error);
        toast.error('Failed to load programs');
      } finally {
        setIsLoading(false);
      }
    }

    loadUserPrograms();
  }, [router]);

  const formatPrice = (priceInCents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(priceInCents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleBuildProgram = (programId: string) => {
    router.push(`/programs/${programId}/build`);
  };

  const handleViewProgram = (programId: string) => {
    // This could navigate to a program details/view page
    router.push(`/programs/${programId}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your programs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Training Programs</h1>
        <p className="text-muted-foreground">
          Manage and configure your purchased training programs
        </p>
      </div>

      {userPurchases.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Programs Yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              You haven&apos;t purchased any training programs yet. Check out our available programs to get started.
            </p>
            <Button onClick={() => router.push('/pricing')}>
              Browse Programs
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {userPurchases.map((purchase) => {
            const program = purchase.trainingProgram;
            const userConfig = userPrograms.find(up => up.trainingProgramId === program.id);
            const programName = program.name.en || Object.values(program.name)[0] || 'Unknown Program';
            const programDescription = program.description.en || Object.values(program.description)[0] || 'No description available';

            return (
              <Card key={purchase.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{programName}</CardTitle>
                      <CardDescription className="mt-1">
                        {programDescription}
                      </CardDescription>
                    </div>
                    <Badge variant={program.isActive ? "default" : "secondary"}>
                      {program.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="space-y-2 mb-4 flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Purchased:</span>
                      <span>{formatDate(purchase.purchaseDate)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Price:</span>
                      <span>{formatPrice(program.price)}</span>
                    </div>
                    {userConfig && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Configuration:</span>
                        <Badge variant="outline">{userConfig.category}</Badge>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {userConfig ? (
                      <>
                        <Button
                          onClick={() => handleBuildProgram(program.id)}
                          className="w-full"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Modify Configuration
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleViewProgram(program.id)}
                          className="w-full"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Program
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => handleBuildProgram(program.id)}
                        className="w-full"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Build Program
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}