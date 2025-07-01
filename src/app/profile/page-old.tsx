'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Activity, Target, Edit3 } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import ProfileForm from '@/components/profile-form';

interface ClientMemory {
  id: string;
  name?: string;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  trainingExperience?: string;
  weeklyTrainingDays?: number;
  primaryGoal?: string;
  motivation?: string;
  injuries?: string[];
  gymAccess?: boolean;
  homeGym?: boolean;
  equipmentAvailable?: string[];
}

export default function ProfilePage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientMemory, setClientMemory] = useState<ClientMemory | null>(null);
  const [memorySummary, setMemorySummary] = useState<string>('');

  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      
      if (currentUser) {
        // Fetch client memory
        try {
          const response = await fetch('/api/client-memory');
          if (response.ok) {
            const data = await response.json();
            setClientMemory(data.memory);
            setMemorySummary(data.summary);
          }
        } catch (error) {
          console.error('Error fetching client memory:', error);
        }
      }
      
      setLoading(false);
    };
    fetchUserData();
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
      <div className="container max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Profile</h1>
          <p className="text-muted-foreground">
            Manage your account settings and training profile
          </p>
        </div>
        
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="edit">
              <Edit3 className="mr-2 h-4 w-4" />
              Edit Profile
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  <div className="grid grid-cols-1 gap-4">
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="mr-2 h-5 w-5" />
                    Coach Summary
                  </CardTitle>
                  <CardDescription>
                    What your AI coach knows about you
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {memorySummary ? (
                    <div className="space-y-4">
                      <Textarea
                        value={memorySummary}
                        readOnly
                        className="min-h-[120px] resize-none"
                        placeholder="Your AI coach will learn about you as you chat..."
                      />
                      <p className="text-xs text-muted-foreground">
                        This summary is automatically generated from your conversations
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground mt-2">
                        Start chatting with your AI coach to build your profile
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {clientMemory && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="mr-2 h-5 w-5" />
                    Training Profile
                  </CardTitle>
                  <CardDescription>
                    Detailed information your coach has learned about you
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {clientMemory.name && (
                      <div>
                        <label className="text-sm font-medium text-foreground">Name</label>
                        <p className="text-sm text-muted-foreground">{clientMemory.name}</p>
                      </div>
                    )}
                    {clientMemory.age && (
                      <div>
                        <label className="text-sm font-medium text-foreground">Age</label>
                        <p className="text-sm text-muted-foreground">{clientMemory.age} years</p>
                      </div>
                    )}
                    {clientMemory.gender && (
                      <div>
                        <label className="text-sm font-medium text-foreground">Gender</label>
                        <p className="text-sm text-muted-foreground">{clientMemory.gender}</p>
                      </div>
                    )}
                    {clientMemory.height && (
                      <div>
                        <label className="text-sm font-medium text-foreground">Height</label>
                        <p className="text-sm text-muted-foreground">{clientMemory.height} cm</p>
                      </div>
                    )}
                    {clientMemory.weight && (
                      <div>
                        <label className="text-sm font-medium text-foreground">Weight</label>
                        <p className="text-sm text-muted-foreground">{clientMemory.weight} kg</p>
                      </div>
                    )}
                    {clientMemory.trainingExperience && (
                      <div>
                        <label className="text-sm font-medium text-foreground">Training Experience</label>
                        <p className="text-sm text-muted-foreground">{clientMemory.trainingExperience}</p>
                      </div>
                    )}
                    {clientMemory.weeklyTrainingDays && (
                      <div>
                        <label className="text-sm font-medium text-foreground">Training Days/Week</label>
                        <p className="text-sm text-muted-foreground">{clientMemory.weeklyTrainingDays} days</p>
                      </div>
                    )}
                    {clientMemory.primaryGoal && (
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-foreground">Primary Goal</label>
                        <p className="text-sm text-muted-foreground">{clientMemory.primaryGoal}</p>
                      </div>
                    )}
                    {clientMemory.motivation && (
                      <div className="md:col-span-3">
                        <label className="text-sm font-medium text-foreground">Motivation</label>
                        <p className="text-sm text-muted-foreground">{clientMemory.motivation}</p>
                      </div>
                    )}
                    {clientMemory.injuries && clientMemory.injuries.length > 0 && (
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-foreground">Injuries/Limitations</label>
                        <p className="text-sm text-muted-foreground">{clientMemory.injuries.join(', ')}</p>
                      </div>
                    )}
                    {(clientMemory.gymAccess !== undefined || clientMemory.homeGym !== undefined) && (
                      <div>
                        <label className="text-sm font-medium text-foreground">Training Location</label>
                        <p className="text-sm text-muted-foreground">
                          {[
                            clientMemory.gymAccess && 'Gym',
                            clientMemory.homeGym && 'Home Gym'
                          ].filter(Boolean).join(', ') || 'Not specified'}
                        </p>
                      </div>
                    )}
                    {clientMemory.equipmentAvailable && clientMemory.equipmentAvailable.length > 0 && (
                      <div className="md:col-span-3">
                        <label className="text-sm font-medium text-foreground">Available Equipment</label>
                        <p className="text-sm text-muted-foreground">{clientMemory.equipmentAvailable.join(', ')}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="edit">
            <Card>
              <CardHeader>
                <CardTitle>Edit Your Training Profile</CardTitle>
                <CardDescription>
                  Update your information to get more personalized coaching
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProfileForm />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}