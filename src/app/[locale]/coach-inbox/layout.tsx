import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { FitnessLoading } from '@/components/ui/loading';

export default async function CoachInboxLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      redirect(`/${locale}/login`);
    }

    // Check if user has coach role
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    });

    if (!dbUser) {
      redirect(`/${locale}/login`);
    }

    const hasCoachRole = dbUser.role?.split(',').map(r => r.trim()).includes('coach');
    if (!hasCoachRole) {
      redirect(`/${locale}/chat`);
    }

    // If user is authorized, render the page
    return (
      <Suspense fallback={<FitnessLoading />}>
        {children}
      </Suspense>
    );
  } catch (error) {
    console.error('Coach inbox layout error:', error);
    redirect(`/${locale}/login`);
  }
}

export const metadata = {
  title: 'Coach Inbox - HypertroQ',
  description: 'Manage your coaching conversations and messages',
};
