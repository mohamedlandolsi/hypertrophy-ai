'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Target, 
  Edit, 
  Crown, 
  CreditCard, 
  Calendar, 
  MessageSquare, 
  TrendingUp, 
  Settings, 
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { FitnessLoading } from '@/components/ui/loading';
import EnhancedProfileForm from '@/components/enhanced-profile-form';
import { UpgradeButton } from '@/components/upgrade-button';
import { PlanBadge } from '@/components/plan-badge';

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

interface UserPlanData {
  plan: 'FREE' | 'PRO';
  messagesUsedToday: number;
  dailyLimit: number;
  subscription?: {
    id: string;
    status: string;
    lemonSqueezyId: string | null;
    currentPeriodEnd: Date | null;
  };
}

export default function ProfilePage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientMemory, setClientMemory] = useState<ClientMemory | null>(null);
  const [memorySummary, setMemorySummary] = useState<string>('');
  const [activeTab, setActiveTab] = useState('overview');
  const [userPlan, setUserPlan] = useState<UserPlanData | null>(null);

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

        // Fetch user plan data
        try {
          const planResponse = await fetch('/api/user/plan');
          if (planResponse.ok) {
            const planData = await planResponse.json();
            setUserPlan(planData);
          }
        } catch (error) {
          console.error('Error fetching user plan:', error);
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
                    What HypertroQ knows about you
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {memorySummary ? (
                    <div className="space-y-4">
                      <Textarea
                        value={memorySummary}
                        readOnly
                        className="min-h-[120px] resize-none"
                        placeholder="HypertroQ will learn about you as you chat..."
                      />
                      <p className="text-xs text-muted-foreground">
                        This summary is automatically generated from your conversations and profile
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground mt-2">
                        Start chatting with HypertroQ or edit your profile to build your coaching context
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
            <EnhancedProfileForm />
          </TabsContent>

          <TabsContent value="account">
            <div className="space-y-6">
              {/* Account Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Account Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <p className="text-foreground">{user.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Current Plan</label>
                      <div className="mt-1">
                        <PlanBadge plan={userPlan?.plan || 'FREE'} />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">User ID</label>
                      <p className="text-sm text-muted-foreground font-mono">{user.id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                      <p className="text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Last Sign In</label>
                      <p className="text-sm text-muted-foreground">
                        {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Usage Stats */}
              {userPlan?.plan === 'FREE' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Daily Usage
                    </CardTitle>
                    <CardDescription>
                      Track your daily message usage
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Messages used today</span>
                        <span>{userPlan.messagesUsedToday} / {userPlan.dailyLimit}</span>
                      </div>
                      <Progress 
                        value={Math.round((userPlan.messagesUsedToday / userPlan.dailyLimit) * 100)} 
                        className="h-2" 
                      />
                    </div>
                    
                    {Math.round((userPlan.messagesUsedToday / userPlan.dailyLimit) * 100) >= 80 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          You&apos;re running low on messages. Consider upgrading to Pro for unlimited conversations.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Subscription Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Subscription Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {userPlan?.plan === 'PRO' && userPlan.subscription ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-6 w-6 text-green-600" />
                          <div>
                            <p className="font-semibold text-green-900 dark:text-green-100">HypertroQ Pro</p>
                            <p className="text-sm text-green-700 dark:text-green-300">Active subscription</p>
                          </div>
                        </div>
                        <Badge className="bg-green-600">
                          <Crown className="mr-1 h-3 w-3" />
                          Pro
                        </Badge>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Status</label>
                          <p className="text-foreground capitalize">{userPlan.subscription.status}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Next Billing</label>
                          <p className="text-foreground">
                            {userPlan.subscription.currentPeriodEnd 
                              ? new Date(userPlan.subscription.currentPeriodEnd).toLocaleDateString()
                              : 'N/A'
                            }
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium text-foreground">Pro Features Active:</h4>
                        <div className="grid md:grid-cols-2 gap-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            Unlimited messages
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            Conversation memory
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            Progress tracking
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            Priority support
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <p className="text-sm text-muted-foreground mb-3">
                          Manage your subscription through the customer portal:
                        </p>
                        <Button variant="outline" className="w-full md:w-auto">
                          <Calendar className="mr-2 h-4 w-4" />
                          Manage Billing
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center p-8 bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/20">
                        <Crown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          Upgrade to Pro
                        </h3>
                        <p className="text-muted-foreground mb-6">
                          Unlock unlimited messages, conversation memory, and advanced features
                        </p>
                        <UpgradeButton 
                          variant="default" 
                          size="lg" 
                          className="bg-blue-600 hover:bg-blue-700"
                          showDialog={true}
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div className="space-y-2">
                          <h4 className="font-medium text-foreground">Free Plan Includes:</h4>
                          <ul className="space-y-1">
                            <li>• 15 messages per day</li>
                            <li>• Basic AI guidance</li>
                            <li>• Access to knowledge base</li>
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-medium text-foreground">Pro Plan Adds:</h4>
                          <ul className="space-y-1">
                            <li>• Unlimited messages</li>
                            <li>• Conversation memory</li>
                            <li>• Progress tracking</li>
                            <li>• Priority support</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Link href="/chat">
                      <Button className="w-full" variant="outline">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Start Coaching Session
                      </Button>
                    </Link>
                    <Link href="/pricing">
                      <Button className="w-full" variant="outline">
                        <Crown className="mr-2 h-4 w-4" />
                        View Plans & Pricing
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
