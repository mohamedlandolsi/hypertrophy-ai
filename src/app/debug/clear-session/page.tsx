'use client';

import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ClearSessionPage() {
  const [isClearing, setIsClearing] = useState(false);
  const [sessionCleared, setSessionCleared] = useState(false);
  const router = useRouter();

  const clearSession = async () => {
    setIsClearing(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setSessionCleared(true);
      
      // Clear any local storage items that might be related
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      
      setTimeout(() => {
        router.push('/chat');
        router.refresh();
      }, 2000);
    } catch (error) {
      console.error('Error clearing session:', error);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <h1 className="text-2xl font-bold">Debug: Clear Session</h1>
        <p className="text-muted-foreground">
          This page will help you clear any existing authentication session.
        </p>
        
        {!sessionCleared ? (
          <Button 
            onClick={clearSession} 
            disabled={isClearing}
            className="w-full"
          >
            {isClearing ? 'Clearing Session...' : 'Clear Authentication Session'}
          </Button>
        ) : (
          <div className="text-green-600">
            ✅ Session cleared! Redirecting to chat page...
          </div>
        )}
        
        <div className="text-sm text-muted-foreground">
          <p>After clearing the session, you should see the guest chat interface.</p>
          <p>You can also manually clear browser data in Dev Tools.</p>
        </div>
      </div>
    </div>
  );
}
