import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import ProgramGuideContent from '@/components/programs/program-guide-content';
import { Card } from '@/components/ui/card';

interface ProgramGuidePageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

async function verifyProgramAccess(programId: string, userId: string) {
  // First check if user is an admin
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });

  // Admin users have access to all programs
  if (dbUser?.role === 'admin') {
    return true;
  }

  // Check if user has purchased this program
  const purchase = await prisma.userPurchase.findUnique({
    where: {
      userId_trainingProgramId: {
        userId,
        trainingProgramId: programId
      }
    }
  });

  return !!purchase;
}

async function getProgramData(programId: string) {
  const program = await prisma.trainingProgram.findUnique({
    where: { id: programId },
    include: {
      programGuide: true,
      programStructures: {
        orderBy: { order: 'asc' }
      },
      workoutTemplates: {
        orderBy: { order: 'asc' }
      },
      exerciseTemplates: {
        orderBy: { priority: 'asc' }
      },
      programCategories: true
    }
  });

  if (!program || !program.isActive) {
    return null;
  }

  return program;
}

async function getUserAccessInfo(userId: string, programId: string) {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });

  const isAdmin = dbUser?.role === 'admin';
  
  const purchase = await prisma.userPurchase.findUnique({
    where: {
      userId_trainingProgramId: {
        userId,
        trainingProgramId: programId
      }
    }
  });

  return {
    isAdmin,
    hasPurchased: !!purchase,
    hasAccess: isAdmin || !!purchase
  };
}

async function getUserCustomization(userId: string, programId: string) {
  return await prisma.userProgram.findFirst({
    where: {
      userId,
      trainingProgramId: programId
    }
  });
}

export default async function ProgramGuidePage({ params }: ProgramGuidePageProps) {
  const { locale, id: programId } = await params;

  // Get authenticated user
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect(`/${locale}/auth/login?redirect=/programs/${programId}/guide`);
  }

  // Verify program access
  const hasAccess = await verifyProgramAccess(programId, user.id);
  if (!hasAccess) {
    redirect(`/${locale}/programs/${programId}?error=access_required`);
  }

  // Get user access information (admin status, purchase status)
  const accessInfo = await getUserAccessInfo(user.id, programId);

  // Get program data
  const program = await getProgramData(programId);
  if (!program) {
    notFound();
  }

  // Get user's customization if it exists
  const userCustomization = await getUserCustomization(user.id, programId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={
          <Card className="p-8 text-center">
            <div className="w-8 h-8 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600 dark:text-gray-400">
              Loading your program guide...
            </p>
          </Card>
        }>
          <ProgramGuideContent
            program={program}
            userCustomization={userCustomization}
            userId={user.id}
            locale={locale}
            accessInfo={accessInfo}
          />
        </Suspense>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: ProgramGuidePageProps) {
  const { id: programId } = await params;
  
  const program = await prisma.trainingProgram.findUnique({
    where: { id: programId },
    select: { name: true, description: true }
  });

  if (!program) {
    return {
      title: 'Program Not Found',
    };
  }

  const programName = typeof program.name === 'object' && program.name !== null 
    ? (program.name as Record<string, string>).en || 'Training Program'
    : 'Training Program';

  return {
    title: `${programName} - Program Guide`,
    description: 'Customize and access your personalized training program guide.',
  };
}