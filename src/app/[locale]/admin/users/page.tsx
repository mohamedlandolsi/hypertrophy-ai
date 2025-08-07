'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import AdminLayout from '@/components/admin-layout';
import { FullPageLoading } from '@/components/ui/loading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Users, 
  Search, 
  MoreHorizontal, 
  UserCheck, 
  UserX, 
  Trash2,
  Shield,
  User as UserIcon,
  Calendar,
  Crown
} from 'lucide-react';
import { showToast } from '@/lib/toast';
import { GrantProPlanDialog } from '@/components/admin/grant-pro-plan-dialog';

interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  plan: 'FREE' | 'PRO';
  hasCompletedOnboarding: boolean;
  createdAt: string;
  lastSignIn?: string;
  emailConfirmed?: boolean;
  chatCount: number;
  knowledgeItemsCount: number;
  lastChatTitle?: string;
  isActive: boolean;
  avatarUrl?: string;
  subscription?: {
    id: string;
    status: string;
    currentPeriodEnd: string | null;
    planId: string | null;
  };
}

interface UserStats {
  totalUsers: number;
  totalAdmins: number;
  newUsersThisWeek: number;
  activeUsers: number;
}

export default function UserManagementPage() {
  const tToasts = useTranslations('toasts');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<'all' | 'user' | 'admin'>('all');
  
  // Grant PRO Plan Dialog state
  const [grantProDialogOpen, setGrantProDialogOpen] = useState(false);
  const [selectedUserForPro, setSelectedUserForPro] = useState<UserProfile | null>(null);
  const [adminApiWarning, setAdminApiWarning] = useState<string | null>(null);

  const filterUsers = useCallback(() => {
    let filtered = users;

    // Filter by search term (email or display name)
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by role
    if (selectedRole !== 'all') {
      filtered = filtered.filter(user => user.role === selectedRole);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, selectedRole]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/users');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 500 && errorData.error?.includes('authentication data')) {
          // Specific error for Supabase admin API issues
          showToast.error(
            'Authentication Error', 
            'Unable to fetch user data. Please check Supabase admin permissions and service role key.'
          );
          console.error('Supabase admin API error:', errorData);
          return;
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      
      // Handle both direct user array and wrapped response with warning
      if (Array.isArray(responseData)) {
        // Normal successful response
        setUsers(responseData);
      } else if (responseData.users && Array.isArray(responseData.users)) {
        // Fallback response with warning
        setUsers(responseData.users);
        
        if (responseData.warning) {
          setAdminApiWarning(responseData.warning);
          console.warn('Admin API warning:', responseData.adminApiError);
        } else {
          setAdminApiWarning(null);
        }
      } else {
        throw new Error('Unexpected response format');
      }
      
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast.error(
        tToasts('usersLoadErrorTitle'),
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }, [tToasts]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/users/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      const statsData = await response.json();
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [fetchUsers, fetchStats]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, selectedRole, filterUsers]);

  const updateUserRole = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user role');
      }

      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));

      showToast.success(tToasts('userRoleUpdatedTitle', { role: newRole }));
      
      // Refresh stats
      fetchStats();
    } catch (error) {
      console.error('Error updating user role:', error);
      showToast.error(tToasts('userRoleUpdateErrorTitle'));
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      // Remove from local state
      setUsers(prev => prev.filter(user => user.id !== userId));

      showToast.success(tToasts('userDeletedTitle'));
      
      // Refresh stats
      fetchStats();
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast.error(tToasts('userDeleteErrorTitle'));
    }
  };

  // Function to handle successful PRO plan grant
  const handleProPlanGrantSuccess = () => {
    // Refresh the users list to show updated plan status
    fetchUsers();
  };

  const getRoleBadgeVariant = (role: 'user' | 'admin') => {
    return role === 'admin' ? 'default' : 'secondary';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <FullPageLoading 
          variant="default"
          message="Loading User Management"
          description="Fetching user data and statistics"
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">
              Manage user accounts, roles, and permissions
            </p>
          </div>
        </div>

        {/* Admin API Warning Banner */}
        {adminApiWarning && (
          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5">
                ⚠️
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                  Limited User Data Available
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                  {adminApiWarning}
                </p>
                <div className="text-sm text-yellow-700 dark:text-yellow-300">
                  <p className="font-medium mb-2">To show real user emails and names:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Go to Supabase Dashboard → Settings → API</li>
                    <li>Copy the <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">service_role</code> key</li>
                    <li>Update <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code> in your environment</li>
                    <li>Restart your development server</li>
                  </ol>
                  <p className="mt-2 text-xs">
                    You can still grant PRO plans using the displayed User IDs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  All registered users
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Administrators</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalAdmins}</div>
                <p className="text-xs text-muted-foreground">
                  Users with admin privileges
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New This Week</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.newUsersThisWeek}</div>
                <p className="text-xs text-muted-foreground">
                  Recently joined users
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Completed onboarding
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle>User List</CardTitle>
            <CardDescription>
              Search and manage all user accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  variant={selectedRole === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedRole('all')}
                >
                  All
                </Button>
                <Button
                  variant={selectedRole === 'user' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedRole('user')}
                >
                  Users
                </Button>
                <Button
                  variant={selectedRole === 'admin' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedRole('admin')}
                >
                  Admins
                </Button>
              </div>
            </div>

            {/* Users Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex flex-col items-center space-y-2">
                          <UserIcon className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            {searchTerm || selectedRole !== 'all' 
                              ? 'No users match your filters' 
                              : 'No users found'
                            }
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              {user.avatarUrl ? (
                                <Image 
                                  src={user.avatarUrl} 
                                  alt={user.displayName} 
                                  width={32}
                                  height={32}
                                  className="rounded-full object-cover"
                                />
                              ) : (
                                <UserIcon className="h-4 w-4 text-primary" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{user.displayName}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                              {(user.email.includes('user-') && user.email.includes('@hidden.email')) && (
                                <p className="text-xs text-blue-600 dark:text-blue-400 font-mono">
                                  ID: {user.id.substring(0, 12)}...
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {user.role === 'admin' ? (
                              <>
                                <Shield className="h-3 w-3 mr-1" />
                                Admin
                              </>
                            ) : (
                              <>
                                <UserIcon className="h-3 w-3 mr-1" />
                                User
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={user.plan === 'PRO' ? 'default' : 'outline'} 
                                   className={user.plan === 'PRO' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}>
                              {user.plan === 'PRO' ? (
                                <>
                                  <Crown className="h-3 w-3 mr-1" />
                                  PRO
                                </>
                              ) : (
                                'FREE'
                              )}
                            </Badge>
                            {user.plan === 'PRO' && user.subscription?.currentPeriodEnd && (
                              <span className="text-xs text-muted-foreground">
                                until {new Date(user.subscription.currentPeriodEnd).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.hasCompletedOnboarding ? 'default' : 'outline'}>
                            {user.hasCompletedOnboarding ? 'Active' : 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDate(user.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              
                              {/* Plan Management */}
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUserForPro(user);
                                  setGrantProDialogOpen(true);
                                }}
                              >
                                <Crown className="mr-2 h-4 w-4" />
                                Grant PRO Plan
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              
                              {/* Role Management */}
                              {user.role === 'user' ? (
                                <DropdownMenuItem
                                  onClick={() => updateUserRole(user.id, 'admin')}
                                >
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Promote to Admin
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => updateUserRole(user.id, 'user')}
                                >
                                  <UserX className="mr-2 h-4 w-4" />
                                  Demote to User
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onSelect={(e) => e.preventDefault()}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete User
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete the user account for <strong>{user.displayName} ({user.email})</strong> and remove all their data from our servers.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteUser(user.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete User
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grant PRO Plan Dialog */}
      {selectedUserForPro && (
        <GrantProPlanDialog
          open={grantProDialogOpen}
          onOpenChange={setGrantProDialogOpen}
          user={{
            id: selectedUserForPro.id,
            email: selectedUserForPro.email,
            displayName: selectedUserForPro.displayName,
            plan: selectedUserForPro.plan
          }}
          onSuccess={handleProPlanGrantSuccess}
        />
      )}
    </AdminLayout>
  );
}
