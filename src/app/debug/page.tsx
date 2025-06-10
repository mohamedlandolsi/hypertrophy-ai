'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

export default function AuthDebugPage() {
  const [authState, setAuthState] = useState<{
    user: SupabaseUser | null;
    session?: Session | null;
    error?: string | null;
    timestamp: string;
    event?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    
    // Get initial auth state
    const getInitialAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();        setAuthState({
          user,
          error: error?.message || null,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        setAuthState({
          user: null,
          error: err instanceof Error ? err.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      } finally {
        setLoading(false);
      }
    };

    getInitialAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session);        setAuthState({
          user: session?.user || null,
          event,
          session,
          error: null,
          timestamp: new Date().toISOString()
        });
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="p-8">Loading auth state...</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug</h1>
      
      <div className="space-y-6">
        <div className="bg-card p-4 rounded-lg border">
          <h2 className="font-semibold mb-2">Environment Variables</h2>
          <div className="space-y-1 text-sm">
            <div>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || '❌ Not set'}</div>
            <div>NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set'}</div>
            <div>NEXT_PUBLIC_SITE_URL: {process.env.NEXT_PUBLIC_SITE_URL || '❌ Not set'}</div>
          </div>
        </div>

        <div className="bg-card p-4 rounded-lg border">
          <h2 className="font-semibold mb-2">Current Auth State</h2>
          <pre className="bg-muted p-3 rounded text-sm overflow-auto">
            {JSON.stringify(authState, null, 2)}
          </pre>
        </div>

        <div className="bg-card p-4 rounded-lg border">
          <h2 className="font-semibold mb-2">Quick Actions</h2>
          <div className="space-x-2">
            <button 
              onClick={() => {
                const supabase = createClient();
                supabase.auth.signOut().then(() => {
                  console.log('Signed out');
                });
              }}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Sign Out
            </button>
            <button 
              onClick={() => {
                window.location.href = '/login';
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Go to Login
            </button>
            <button 
              onClick={() => {
                window.location.reload();
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
