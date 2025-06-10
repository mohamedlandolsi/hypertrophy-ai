'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export default function ProfilePage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      setLoading(false);
    };
    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background text-foreground">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background text-foreground">
        Please log in to view your profile.
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background text-foreground">
      <div className="container max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Profile</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>
              Your basic account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Email</label>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">User ID</label>
                <p className="text-sm text-muted-foreground font-mono">{user.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Created</label>
                <p className="text-sm text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Last Sign In</label>
                <p className="text-sm text-muted-foreground">
                  {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
            <div className="pt-4">
              <Button variant="outline">
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}