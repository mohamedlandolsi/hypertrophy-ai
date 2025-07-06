'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Activity, Target, Edit } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { FitnessLoading } from '@/components/ui/loading';
import ProfileForm from '@/components/profile-form';

interface ClientMemory {
  id: string;
  name?: string;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  bodyFatPercentage?: number;
  trainingExperience?: string;
  weeklyTrainingDays?: number;
  activityLevel?: string;
  primaryGoal?: string;
  motivation?: string;
  injuries?: string[];
  gymAccess?: boolean;
  homeGym?: boolean;
  equipmentAvailable?: string[];
  currentBench?: number;
  currentSquat?: number;
  currentDeadlift?: number;
  currentOHP?: number;
}

export default function ProfilePage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientMemory, setClientMemory] = useState<ClientMemory | null>(null);
  const [memorySummary, setMemorySummary] = useState<string>('');
  const [activeTab, setActiveTab] = useState('overview');

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
        <FitnessLoading />
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="edit">Edit Profile</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                        This summary is automatically generated from your conversations and profile
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground mt-2">
                        Start chatting with your AI coach or edit your profile to build your coaching context
                      </p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setActiveTab('edit')}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Profile
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {clientMemory && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Target className="mr-2 h-5 w-5" />
                      Quick Stats
                    </CardTitle>
                    <CardDescription>
                      Key information from your profile
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
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
                      {clientMemory.trainingExperience && (
                        <div>
                          <label className="text-sm font-medium text-foreground">Experience</label>
                          <p className="text-sm text-muted-foreground capitalize">{clientMemory.trainingExperience}</p>
                        </div>
                      )}
                      {clientMemory.weeklyTrainingDays && (
                        <div>
                          <label className="text-sm font-medium text-foreground">Training Days</label>
                          <p className="text-sm text-muted-foreground">{clientMemory.weeklyTrainingDays}/week</p>
                        </div>
                      )}
                      {clientMemory.primaryGoal && (
                        <div className="col-span-2">
                          <label className="text-sm font-medium text-foreground">Primary Goal</label>
                          <p className="text-sm text-muted-foreground">{clientMemory.primaryGoal.replace('_', ' ')}</p>
                        </div>
                      )}
                    </div>
                    
                    {(clientMemory.currentBench || clientMemory.currentSquat || clientMemory.currentDeadlift || clientMemory.currentOHP) && (
                      <div className="mt-6 pt-4 border-t">
                        <h4 className="text-sm font-medium text-foreground mb-2">Current Lifts</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {clientMemory.currentBench && <div>Bench: {clientMemory.currentBench}kg</div>}
                          {clientMemory.currentSquat && <div>Squat: {clientMemory.currentSquat}kg</div>}
                          {clientMemory.currentDeadlift && <div>Deadlift: {clientMemory.currentDeadlift}kg</div>}
                          {clientMemory.currentOHP && <div>OHP: {clientMemory.currentOHP}kg</div>}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="edit">
            <Card>
              <CardHeader>
                <CardTitle>Edit Your Training Profile</CardTitle>
                <CardDescription>
                  Provide detailed information to help your AI coach give you personalized advice
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProfileForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account">
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
                <div className="pt-4">
                  <Button variant="outline">
                    Edit Account Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
