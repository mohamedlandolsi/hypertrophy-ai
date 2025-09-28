import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Users, CheckCircle } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminLayout from '@/components/admin-layout';
import { ProgramsTable } from '@/components/admin/programs-table';
import { TableSkeleton } from '@/components/ui/loading-skeletons';

// Types
interface TrainingProgramWithDetails {
  id: string;
  name: {
    en: string;
    ar: string;
    fr: string;
  };
  description: {
    en: string;
    ar: string;
    fr: string;
  };
  price: number;
  lemonSqueezyId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // New structure fields
  structureType: string;
  sessionCount: number;
  trainingDays: number;
  restDays: number;
  hasInteractiveBuilder: boolean;
  allowsCustomization: boolean;
  _count: {
    userPurchases: number;
    userPrograms: number;
    workoutTemplates: number;
  };
  programGuide: {
    id: string;
  } | null;
}

// Server Component for data fetching
async function ProgramsTableData() {
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

  // Fetch training programs with related data
  const programs = await prisma.trainingProgram.findMany({
    include: {
      programGuide: {
        select: { id: true }
      },
      _count: {
        select: {
          userPurchases: true,
          userPrograms: true,
          workoutTemplates: true,
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return <ProgramsTable programs={programs as unknown as TrainingProgramWithDetails[]} />;
}

// Main page component
export default function AdminProgramsPage() {
  return (
    <AdminLayout>
      <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Training Programs</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Manage your fitness training programs and workout templates
            </p>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/admin/programs/new">
              <Plus className="mr-2 h-4 w-4" />
              Create New Program
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <Suspense fallback={<StatsCardsSkeleton />}>
          <StatsCards />
        </Suspense>

        {/* Programs Table */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">All Programs</CardTitle>
            <CardDescription>
              View and manage all training programs in your system
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Suspense fallback={<TableSkeleton />}>
              <ProgramsTableData />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

// Stats cards component (Server Component)
async function StatsCards() {
  const stats = await prisma.trainingProgram.aggregate({
    _count: {
      id: true,
    },
    where: {
      isActive: true,
    }
  });

  const totalPrograms = await prisma.trainingProgram.count();
  const totalPurchases = await prisma.userPurchase.count();
  const activePrograms = stats._count.id;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium">Total Programs</CardTitle>
          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
            <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="text-2xl font-bold">{totalPrograms}</div>
          <p className="text-xs text-muted-foreground mt-1">
            All training programs
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium">Active Programs</CardTitle>
          <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="text-2xl font-bold">{activePrograms}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Currently available for purchase
          </p>
        </CardContent>
      </Card>
      
      <Card className="sm:col-span-2 lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
          <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
            <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="text-2xl font-bold">{totalPurchases}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Programs sold to customers
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
export type { TrainingProgramWithDetails };