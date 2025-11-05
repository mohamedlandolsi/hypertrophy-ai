import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Layers, CheckCircle, TrendingUp } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminLayout from '@/components/admin-layout';
import { TemplatesTable } from '@/components/admin/templates-table';
import { TableSkeleton } from '@/components/ui/loading-skeletons';

// Types
interface ProgramTemplateWithDetails {
  id: string;
  name: string;
  description: string;
  difficultyLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  workoutStructureType: 'REPEATING' | 'AB' | 'ABC';
  estimatedDurationWeeks: number;
  targetAudience: string;
  popularity: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  split: {
    id: string;
    name: string;
  } | null;
  structure: {
    id: string;
    pattern: string;
    daysPerWeek: number;
  } | null;
  _count: {
    trainingPrograms: number; // Changed from userPrograms to match schema
    templateWorkouts: number; // Changed from workouts to match schema
  };
}

// Server Component for data fetching
async function TemplatesTableData() {
  // Check admin authentication
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Check if user is admin
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  });

  if (!dbUser || dbUser.role !== 'admin') {
    redirect('/unauthorized');
  }

  // Fetch program templates with related data
  const templatesRaw = await prisma.programTemplate.findMany({
    include: {
      trainingSplit: {
        select: {
          id: true,
          name: true,
        },
      },
      splitStructure: {
        select: {
          id: true,
          pattern: true,
          daysPerWeek: true,
        },
      },
      _count: {
        select: {
          trainingPrograms: true, // Number of times template has been used
          templateWorkouts: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Map to expected format
  const templates = templatesRaw.map(t => ({
    ...t,
    split: t.trainingSplit,
    structure: t.splitStructure,
  }));

  return <TemplatesTable templates={templates as unknown as ProgramTemplateWithDetails[]} />;
}

// Main page component
export default function AdminTemplatesPage() {
  return (
    <AdminLayout>
      <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Program Templates</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Create and manage workout templates that users can clone and customize
            </p>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/admin/templates/new">
              <Plus className="mr-2 h-4 w-4" />
              Create New Template
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <Suspense fallback={<StatsCardsSkeleton />}>
          <StatsCards />
        </Suspense>

        {/* Templates Table */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">All Templates</CardTitle>
            <CardDescription>
              View and manage all program templates in your system
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Suspense fallback={<TableSkeleton />}>
              <TemplatesTableData />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

// Stats cards component (Server Component)
async function StatsCards() {
  const stats = await prisma.programTemplate.aggregate({
    _count: {
      id: true,
    },
    where: {
      isActive: true,
    },
  });

  const totalTemplates = await prisma.programTemplate.count();
  const activeTemplates = stats._count.id;

  // Calculate total times templates have been used
  const usageStats = await prisma.programTemplate.findMany({
    select: {
      _count: {
        select: {
          trainingPrograms: true,
        },
      },
    },
  });

  const totalTimesUsed = usageStats.reduce((sum, template) => sum + template._count.trainingPrograms, 0);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
            <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="text-2xl font-bold">{totalTemplates}</div>
          <p className="text-xs text-muted-foreground mt-1">
            All program templates
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium">Active Templates</CardTitle>
          <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="text-2xl font-bold">{activeTemplates}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Currently available for users
          </p>
        </CardContent>
      </Card>
      
      <Card className="sm:col-span-2 lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium">Times Used</CardTitle>
          <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="text-2xl font-bold">{totalTimesUsed}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Total programs created by users
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Loading skeletons
function StatsCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
            <div className="h-3 w-32 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Export types for use in other components
export type { ProgramTemplateWithDetails };