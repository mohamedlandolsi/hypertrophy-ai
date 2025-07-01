'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AdminLayout from '@/components/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Database, 
  MessageSquare, 
  Settings, 
  TrendingUp, 
  Activity,
  Clock,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  totalUsers: number;
  totalKnowledgeItems: number;
  totalConversations: number;
  systemStatus: 'healthy' | 'warning' | 'error';
  lastUpdated: string;
}

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const quickActions: QuickAction[] = [
  {
    title: 'AI Configuration',
    description: 'Manage AI model settings and prompts',
    href: '/admin/settings',
    icon: Settings,
    color: 'text-blue-600 dark:text-blue-400'
  },
  {
    title: 'Knowledge Base',
    description: 'Upload and manage training content',
    href: '/admin/knowledge',
    icon: Database,
    color: 'text-green-600 dark:text-green-400'
  },
  {
    title: 'User Management',
    description: 'Manage user accounts and permissions',
    href: '/admin/users',
    icon: Users,
    color: 'text-purple-600 dark:text-purple-400'
  },
  {
    title: 'Analytics',
    description: 'View usage statistics and insights',
    href: '/admin/analytics',
    icon: BarChart3,
    color: 'text-orange-600 dark:text-orange-400'
  }
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminAccessError, setAdminAccessError] = useState<string | null>(null);
  const router = useRouter();

  const checkAdminAccess = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      // Verify admin access
      const response = await fetch('/api/admin/config');
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      if (response.status === 403) {
        setAdminAccessError('Access denied. Admin privileges required to access the dashboard.');
        setLoading(false);
        return;
      }
      if (!response.ok) {
        setAdminAccessError('Unable to verify admin access.');
        setLoading(false);
        return;
      }

      // Fetch dashboard stats
      await fetchDashboardStats();
    } catch (error) {
      console.error('Admin access check failed:', error);
      setAdminAccessError('Access denied. Admin privileges required to access the dashboard.');
      setLoading(false);
    }
  }, [router]);

  const fetchDashboardStats = async () => {
    try {
      // This would be replaced with actual API calls
      // For now, using mock data
      setTimeout(() => {
        setStats({
          totalUsers: 156,
          totalKnowledgeItems: 42,
          totalConversations: 1248,
          systemStatus: 'healthy',
          lastUpdated: new Date().toISOString()
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAdminAccess();
  }, [checkAdminAccess]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (adminAccessError) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md mx-auto p-6">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-6">{adminAccessError}</p>
            <Button onClick={() => router.push('/dashboard')} variant="outline">
              Return to Dashboard
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 min-h-0">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to the admin dashboard. Monitor and manage your AI fitness coach system.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Knowledge Items</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalKnowledgeItems || 0}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +3 new this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversations</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalConversations || 0}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +8% from last week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium capitalize">
                  {stats?.systemStatus || 'Unknown'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                <Clock className="inline h-3 w-3 mr-1" />
                Last checked 2 min ago
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Card key={action.href} className="hover:shadow-md transition-shadow cursor-pointer group">
                <Link href={action.href}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <action.icon className={`h-5 w-5 ${action.color}`} />
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-base mb-2">{action.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {action.description}
                    </CardDescription>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system events and updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="font-medium">Knowledge base updated</p>
                  <p className="text-muted-foreground">Added 3 new fitness articles</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="font-medium">AI model configuration changed</p>
                  <p className="text-muted-foreground">Updated system prompt and parameters</p>
                  <p className="text-xs text-muted-foreground">5 hours ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 text-sm">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="font-medium">New user registered</p>
                  <p className="text-muted-foreground">User joined the platform</p>
                  <p className="text-xs text-muted-foreground">1 day ago</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>Current system performance metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>API Response Time</span>
                  <span className="text-green-600">125ms</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Knowledge Processing</span>
                  <span className="text-blue-600">42/42 items</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Memory Usage</span>
                  <span className="text-orange-600">68%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-orange-600 h-2 rounded-full" style={{ width: '68%' }}></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
