'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin-layout';
import { FitnessLoading } from '@/components/ui/loading';
import { AITestingInterface } from '@/components/admin/ai-testing-interface';
import { Button } from '@/components/ui/button';

export default function AITestingPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string; email?: string; role?: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        setError(null);
        
        // Use server-side API to check admin status
        const response = await fetch('/api/admin/check-status');
        const data = await response.json();

        if (process.env.NODE_ENV === 'development') { console.log('Admin check response:', data); }

        if (!response.ok) {
          if (response.status === 401) {
            if (process.env.NODE_ENV === 'development') { console.log('Not authenticated, redirecting to login'); }
            router.push('/login');
            return;
          }
          setError(data.error || 'Failed to check admin status');
          return;
        }

        if (!data.isAdmin) {
          setError(`Access denied. Current role: ${data.user?.role || 'none'}. Admin access required.`);
          return;
        }

        setUser(data.user);
        setIsAdmin(true);
        if (process.env.NODE_ENV === 'development') { console.log('Admin access confirmed for:', data.user.email); }

      } catch (error) {
        console.error('Error checking admin access:', error);
        setError('Network error: ' + (error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FitnessLoading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-600">Access Error</h1>
          <p className="text-gray-600 max-w-md">{error}</p>
          {user && (
            <div className="text-sm text-gray-500">
              <p>Logged in as: {user.email}</p>
              <p>User ID: {user.id}</p>
            </div>
          )}
          <div className="space-x-4">
            <Button onClick={() => router.push('/login')}>
              Login
            </Button>
            <Button variant="outline" onClick={() => router.push('/')}>
              Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              AI Response Testing
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Test AI responses across multiple prompts to evaluate performance, consistency, and quality. Use this tool to validate AI behavior and identify areas for improvement.
            </p>
          </div>
          
          <AITestingInterface />
        </div>
      </div>
    </AdminLayout>
  );
}
