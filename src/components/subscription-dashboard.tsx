'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Crown, 
  MessageSquare, 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle,
  Calendar,
  CreditCard,
  Loader2
} from 'lucide-react';
import { PlanBadge } from '@/components/plan-badge';
import { UpgradeButton } from '@/components/upgrade-button';

interface UserPlanData {
  plan: 'FREE' | 'PRO';
  limits: {
    dailyMessages: number;
    monthlyUploads: number;
    maxFileSize: number;
    hasConversationMemory: boolean;
    canAccessProFeatures: boolean;
    canAccessAdvancedRAG: boolean;
    maxKnowledgeItems: number;
  };
  messagesUsedToday: number;
  uploadsThisMonth?: number;
  knowledgeItemsCount?: number;
  subscription?: {
    id: string;
    status: string;
    lemonSqueezyId: string | null;
    planId: string | null;
    variantId: string | null;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
  };
}

export function SubscriptionDashboard() {
  const [planData, setPlanData] = useState<UserPlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlanData();
  }, []);

  const fetchPlanData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/plan');
      
      if (!response.ok) {
        throw new Error('Failed to fetch plan data');
      }
      
      const data = await response.json();
      setPlanData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !planData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">Error loading subscription data: {error}</p>
          <Button onClick={fetchPlanData} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isPro = planData.plan === 'PRO';
  const messagesRemaining = planData.limits.dailyMessages === -1 
    ? 'Unlimited' 
    : Math.max(0, planData.limits.dailyMessages - planData.messagesUsedToday);
  
  const uploadsRemaining = planData.limits.monthlyUploads === -1 
    ? 'Unlimited' 
    : Math.max(0, planData.limits.monthlyUploads - (planData.uploadsThisMonth || 0));

  const knowledgeItemsRemaining = planData.limits.maxKnowledgeItems === -1 
    ? 'Unlimited' 
    : Math.max(0, planData.limits.maxKnowledgeItems - (planData.knowledgeItemsCount || 0));



  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Plan Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {isPro ? <Crown className="h-5 w-5 text-yellow-500" /> : <FileText className="h-5 w-5" />}
                Current Plan
              </CardTitle>
              <CardDescription>
                Your subscription details and usage
              </CardDescription>
            </div>
            <PlanBadge plan={planData.plan} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Features */}
            <div>
              <h4 className="font-medium mb-3">Plan Features</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {planData.limits.dailyMessages === -1 ? 
                    <CheckCircle className="h-4 w-4 text-green-500" /> : 
                    <XCircle className="h-4 w-4 text-gray-400" />
                  }
                  <span className="text-sm">Unlimited daily messages</span>
                </div>
                <div className="flex items-center gap-2">
                  {planData.limits.hasConversationMemory ? 
                    <CheckCircle className="h-4 w-4 text-green-500" /> : 
                    <XCircle className="h-4 w-4 text-gray-400" />
                  }
                  <span className="text-sm">Conversation memory</span>
                </div>
                <div className="flex items-center gap-2">
                  {planData.limits.canAccessAdvancedRAG ? 
                    <CheckCircle className="h-4 w-4 text-green-500" /> : 
                    <XCircle className="h-4 w-4 text-gray-400" />
                  }
                  <span className="text-sm">Advanced RAG features</span>
                </div>
                <div className="flex items-center gap-2">
                  {planData.limits.monthlyUploads === -1 ? 
                    <CheckCircle className="h-4 w-4 text-green-500" /> : 
                    <XCircle className="h-4 w-4 text-gray-400" />
                  }
                  <span className="text-sm">Unlimited file uploads</span>
                </div>
              </div>
            </div>

            {/* Billing Info */}
            {isPro && planData.subscription && (
              <div>
                <h4 className="font-medium mb-3">Billing Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      Next billing: {formatDate(planData.subscription.currentPeriodEnd)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      Status: <Badge variant={planData.subscription.status === 'active' ? 'default' : 'secondary'}>
                        {planData.subscription.status}
                      </Badge>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {!isPro && (
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Upgrade to Pro</h4>
                  <p className="text-sm text-gray-600">
                    Get unlimited messages, uploads, and advanced features
                  </p>
                </div>
                <UpgradeButton variant="default" size="sm" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Daily Messages */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Daily Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">
                  {planData.limits.dailyMessages === -1 ? '∞' : planData.messagesUsedToday}
                </span>
                {planData.limits.dailyMessages !== -1 && (
                  <span className="text-sm text-muted-foreground">
                    / {planData.limits.dailyMessages}
                  </span>
                )}
              </div>
              {planData.limits.dailyMessages !== -1 && (
                <Progress
                  value={(planData.messagesUsedToday / planData.limits.dailyMessages) * 100}
                  className="h-2"
                />
              )}
              <p className="text-xs text-muted-foreground">
                {messagesRemaining} remaining today
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Uploads */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Monthly Uploads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">
                  {planData.limits.monthlyUploads === -1 ? '∞' : (planData.uploadsThisMonth || 0)}
                </span>
                {planData.limits.monthlyUploads !== -1 && (
                  <span className="text-sm text-muted-foreground">
                    / {planData.limits.monthlyUploads}
                  </span>
                )}
              </div>
              {planData.limits.monthlyUploads !== -1 && (
                <Progress
                  value={((planData.uploadsThisMonth || 0) / planData.limits.monthlyUploads) * 100}
                  className="h-2"
                />
              )}
              <p className="text-xs text-muted-foreground">
                {uploadsRemaining} remaining this month
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Knowledge Items */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Knowledge Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">
                  {planData.limits.maxKnowledgeItems === -1 ? '∞' : (planData.knowledgeItemsCount || 0)}
                </span>
                {planData.limits.maxKnowledgeItems !== -1 && (
                  <span className="text-sm text-muted-foreground">
                    / {planData.limits.maxKnowledgeItems}
                  </span>
                )}
              </div>
              {planData.limits.maxKnowledgeItems !== -1 && (
                <Progress
                  value={((planData.knowledgeItemsCount || 0) / planData.limits.maxKnowledgeItems) * 100}
                  className="h-2"
                />
              )}
              <p className="text-xs text-muted-foreground">
                {knowledgeItemsRemaining} remaining
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
