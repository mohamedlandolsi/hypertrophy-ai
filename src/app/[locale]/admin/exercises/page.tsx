'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AdminLayout from '@/components/admin-layout';
import { PageLoading } from '@/components/ui/loading';
import ExerciseManagement from '@/components/admin/exercise-management';

export default function AdminExercisesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      // Check if user has admin role
      try {
        const response = await fetch('/api/user/role');
        const data = await response.json();
        
        if (!data.isAdmin) {
          router.push('/');
          return;
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error checking admin role:', error);
        setError('Failed to verify admin privileges');
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return <PageLoading />;
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-6 py-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Exercise Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Manage and configure exercises for training programs
          </p>
        </div>
        
        <ExerciseManagement />
      </div>
    </AdminLayout>
  );
}