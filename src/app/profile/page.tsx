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
  CheckCircle,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
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
            {/* Personalized Header */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 p-6 text-white">
              <div className="absolute inset-0 bg-black/20" />
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <h1 className="text-2xl font-bold">
                      Welcome back{user.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ''}! 💪
                    </h1>
                    <p className="text-blue-100">
                      {clientMemory?.primaryGoal 
                        ? `Let&apos;s continue working on ${clientMemory.primaryGoal.replace('_', ' ').toLowerCase()}`
                        : "Ready to start your fitness journey?"
                      }
                    </p>
                  </div>
                  <div className="hidden md:block">
                    <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                      {user.user_metadata?.avatar_url ? (
                        <Image 
                          src={user.user_metadata.avatar_url} 
                          alt="Profile" 
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <MessageSquare className="h-8 w-8" />
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Quick Action */}
                <div className="mt-4">
                  <Link href="/chat">
                    <Button size="lg" variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Continue Coaching Session
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Main Grid Layout */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left Column - Coach Summary (Spans 2 columns) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Coach Summary */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                        <Activity className="h-4 w-4 text-white" />
                      </div>
                      Your AI Coach Summary
                    </CardTitle>
                    <CardDescription>
                      Personalized insights based on your conversations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {clientMemory || memorySummary ? (
                      <>
                        {/* Memory Summary */}
                        {memorySummary && (
                          <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg border border-blue-200 dark:border-blue-800">
                            <Textarea
                              value={memorySummary}
                              readOnly
                              className="min-h-[100px] resize-none border-0 bg-transparent focus:ring-0 focus:border-0"
                              placeholder="HypertroQ will learn about you as you chat..."
                            />
                            <p className="text-xs text-muted-foreground mt-2">
                              This summary is automatically generated from your conversations and profile
                            </p>
                          </div>
                        )}
                        
                        {/* Key Insights */}
                        {clientMemory && (
                          <div className="grid md:grid-cols-2 gap-6">
                            {clientMemory.primaryGoal && (
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                                  <h4 className="font-semibold text-foreground">Primary Goal</h4>
                                </div>
                                <p className="text-muted-foreground pl-4">{clientMemory.primaryGoal.replace('_', ' ')}</p>
                              </div>
                            )}
                            
                            {clientMemory.trainingExperience && (
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-2 rounded-full bg-green-500" />
                                  <h4 className="font-semibold text-foreground">Experience Level</h4>
                                </div>
                                <p className="text-muted-foreground pl-4 capitalize">{clientMemory.trainingExperience}</p>
                              </div>
                            )}
                            
                            {clientMemory.weeklyTrainingDays && (
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-2 rounded-full bg-orange-500" />
                                  <h4 className="font-semibold text-foreground">Training Frequency</h4>
                                </div>
                                <p className="text-muted-foreground pl-4">{clientMemory.weeklyTrainingDays} days/week</p>
                              </div>
                            )}
                            
                            {clientMemory.name && (
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-2 rounded-full bg-purple-500" />
                                  <h4 className="font-semibold text-foreground">Name</h4>
                                </div>
                                <p className="text-muted-foreground pl-4">{clientMemory.name}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Additional Insights Row */}
                        {clientMemory && (
                          <div className="grid md:grid-cols-3 gap-4 pt-4 border-t">
                            {clientMemory.age && (
                              <div className="text-center p-3 bg-muted/30 rounded-lg">
                                <div className="text-xl font-bold text-foreground">{clientMemory.age}</div>
                                <div className="text-xs text-muted-foreground">Age (years)</div>
                              </div>
                            )}
                            {(clientMemory.currentBench || clientMemory.currentSquat || clientMemory.currentDeadlift) && (
                              <div className="text-center p-3 bg-muted/30 rounded-lg">
                                <div className="text-xl font-bold text-foreground">
                                  {clientMemory.currentBench || clientMemory.currentSquat || clientMemory.currentDeadlift}kg
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {clientMemory.currentBench ? 'Bench' : clientMemory.currentSquat ? 'Squat' : 'Deadlift'}
                                </div>
                              </div>
                            )}
                            {clientMemory.weeklyTrainingDays && (
                              <div className="text-center p-3 bg-muted/30 rounded-lg">
                                <div className="text-xl font-bold text-foreground">{clientMemory.weeklyTrainingDays}</div>
                                <div className="text-xs text-muted-foreground">Days/Week</div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Current Lifts Section */}
                        {clientMemory && (clientMemory.currentBench || clientMemory.currentSquat || clientMemory.currentDeadlift || clientMemory.currentOHP) && (
                          <div className="mt-6 pt-4 border-t">
                            <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                              <Target className="h-4 w-4" />
                              Current Lifts
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                              {clientMemory.currentBench && (
                                <div className="text-center p-2 bg-blue-50 dark:bg-blue-950 rounded">
                                  <div className="font-bold text-blue-700 dark:text-blue-300">{clientMemory.currentBench}kg</div>
                                  <div className="text-blue-600 dark:text-blue-400">Bench</div>
                                </div>
                              )}
                              {clientMemory.currentSquat && (
                                <div className="text-center p-2 bg-green-50 dark:bg-green-950 rounded">
                                  <div className="font-bold text-green-700 dark:text-green-300">{clientMemory.currentSquat}kg</div>
                                  <div className="text-green-600 dark:text-green-400">Squat</div>
                                </div>
                              )}
                              {clientMemory.currentDeadlift && (
                                <div className="text-center p-2 bg-red-50 dark:bg-red-950 rounded">
                                  <div className="font-bold text-red-700 dark:text-red-300">{clientMemory.currentDeadlift}kg</div>
                                  <div className="text-red-600 dark:text-red-400">Deadlift</div>
                                </div>
                              )}
                              {clientMemory.currentOHP && (
                                <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-950 rounded">
                                  <div className="font-bold text-yellow-700 dark:text-yellow-300">{clientMemory.currentOHP}kg</div>
                                  <div className="text-yellow-600 dark:text-yellow-400">OHP</div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center p-8 bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg border-2 border-dashed border-muted-foreground/20">
                        <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-4">
                          <MessageSquare className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">
                          Let&apos;s Get Started! 🚀
                        </h3>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                          Start chatting with your AI coach to build your personalized fitness profile and unlock tailored recommendations
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <Link href="/chat">
                            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Start Your First Session
                            </Button>
                          </Link>
                          <Button 
                            size="lg" 
                            variant="outline" 
                            onClick={() => setActiveTab('edit')}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Profile
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Stats Dashboard */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center">
                        <BarChart3 className="h-4 w-4 text-white" />
                      </div>
                      Today&apos;s Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-xl border border-blue-200 dark:border-blue-800">
                        <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                          {userPlan?.messagesUsedToday || 0}
                        </div>
                        <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                          Messages Used
                        </div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-xl border border-green-200 dark:border-green-800">
                        <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                          {userPlan?.plan === 'PRO' ? '∞' : Math.max(0, (userPlan?.dailyLimit || 15) - (userPlan?.messagesUsedToday || 0))}
                        </div>
                        <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                          Remaining
                        </div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-xl border border-purple-200 dark:border-purple-800">
                        <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                          <PlanBadge plan={userPlan?.plan || 'FREE'} />
                        </div>
                        <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                          Plan Status
                        </div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 rounded-xl border border-orange-200 dark:border-orange-800">
                        <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                          {userPlan?.plan === 'PRO' ? '100' : Math.round(((userPlan?.messagesUsedToday || 0) / (userPlan?.dailyLimit || 1)) * 100)}%
                        </div>
                        <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                          Daily Usage
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Subscription & Quick Actions */}
              <div className="space-y-6">
                {/* Enhanced Subscription Card */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        userPlan?.plan === 'PRO' 
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500' 
                          : 'bg-gradient-to-r from-gray-500 to-gray-600'
                      }`}>
                        <Crown className="h-4 w-4 text-white" />
                      </div>
                      Subscription
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {userPlan?.plan === 'PRO' ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-foreground">Pro Plan</h3>
                            <p className="text-sm text-muted-foreground">Premium features active</p>
                          </div>
                          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                            <Crown className="mr-1 h-3 w-3" />
                            Pro
                          </Badge>
                        </div>

                        <div className="space-y-3">
                          <h4 className="font-medium text-foreground text-sm">Pro Features Active:</h4>
                          <div className="space-y-2">
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
                          </div>
                        </div>

                        <div className="pt-4 border-t">
                          <Button variant="outline" className="w-full" size="sm">
                            <CreditCard className="mr-2 h-4 w-4" />
                            Manage Billing
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg border-2 border-dashed border-blue-200 dark:border-blue-800">
                          <Crown className="h-10 w-10 text-blue-500 mx-auto mb-3" />
                          <h3 className="font-semibold text-foreground mb-2">
                            Upgrade to Pro
                          </h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Unlock unlimited messages and advanced features
                          </p>
                          <UpgradeButton 
                            variant="default" 
                            size="sm" 
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 w-full"
                            showDialog={true}
                          />
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium text-foreground text-sm">Free Plan Includes:</h4>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div>• 15 messages per day</div>
                            <div>• Basic AI guidance</div>
                            <div>• Access to knowledge base</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-white" />
                      </div>
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Link href="/chat" className="block">
                      <Button className="w-full justify-start" variant="outline" size="lg">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Start Coaching Session
                      </Button>
                    </Link>
                    <Button 
                      className="w-full justify-start" 
                      variant="outline" 
                      size="lg"
                      onClick={() => setActiveTab('edit')}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Profile
                    </Button>
                    <Link href="/pricing" className="block">
                      <Button className="w-full justify-start" variant="outline" size="lg">
                        <Crown className="mr-2 h-4 w-4" />
                        View Plans & Pricing
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
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
