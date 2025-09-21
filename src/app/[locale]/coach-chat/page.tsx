'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  Send, 
  User, 
  Loader2, 
  Users,
  Crown,
  Menu,
  ChevronLeft
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from '@/components/theme-toggle';
import { showToast } from '@/lib/toast';
import { FullPageLoading } from '@/components/ui/loading';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { ArabicAwareTextarea } from '@/components/arabic-aware-textarea';
import LanguageSwitcher from '@/components/language-switcher';
import { useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';

// UI Components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

// Types
interface Coach {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  role: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  isRead: boolean;
}

interface UserPlan {
  plan: 'FREE' | 'PRO';
}

const CoachChatPage = () => {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get selected coach from URL
  const selectedCoachId = searchParams.get('coach');
  
  // State
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Check if user has access (PRO plan)
  const hasAccess = userPlan?.plan === 'PRO';

  // Fetch coaches
  const fetchCoaches = useCallback(async () => {
    try {
      const response = await fetch('/api/coaches');
      
      if (response.ok) {
        const data = await response.json();
        
        const coachList = data.coaches || [];
        setCoaches(coachList);
        
        // Auto-select coach if specified in URL
        if (selectedCoachId && coachList.length > 0) {
          const coach = coachList.find((c: Coach) => c.id === selectedCoachId);
          if (coach) {
            setSelectedCoach(coach);
          }
        }
      } else {
        console.error('Failed to fetch coaches:', response.status, response.statusText);
        showToast.error('Error', 'Failed to fetch available coaches.');
      }
    } catch (error) {
      console.error('Error fetching coaches:', error);
      showToast.error('Error', 'Failed to fetch available coaches.');
    }
  }, [selectedCoachId]);

  // Initialize
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const supabase = createClient();
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (!currentUser) {
          router.push(`/${locale}/login`);
          return;
        }
        
        setUser(currentUser);
        
        // Fetch user plan
        const planResponse = await fetch('/api/user/plan');
        if (planResponse.ok) {
          const planData = await planResponse.json();
          setUserPlan(planData);
          
          // Check if user has PRO access
          if (planData.plan !== 'PRO') {
            showToast.error('Access Denied', 'This feature is only available for PRO users.');
            router.push(`/${locale}/pricing`);
            return;
          }
        }
        
        // Fetch available coaches
        await fetchCoaches();
        
      } catch (error) {
        console.error('Error during initialization:', error);
        showToast.error('Error', 'Failed to initialize coach chat.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInitialData();
  }, [locale, router, fetchCoaches]);

  // Load messages for chat
  const loadMessages = useCallback(async (chatId: string) => {
    try {
      const response = await fetch(`/api/coach-chat/${chatId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        
        // Mark messages as read
        await fetch('/api/coach-inbox/mark-read', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ coachChatId: chatId })
        });
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, []);

  // Load chat with selected coach
  const loadChatWithCoach = useCallback(async (coach: Coach) => {
    if (selectedCoach?.id === coach.id && messages.length > 0) return;
    
    setSelectedCoach(coach);
    setMessages([]);
    setIsLoadingMessages(true);
    
    // Update URL
    router.push(`/${locale}/coach-chat?coach=${coach.id}`, { scroll: false });
    
    try {
      // Find or create chat with this coach
      const response = await fetch('/api/coach-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coachId: coach.id })
      });
      
      if (response.ok) {
        const data = await response.json();
        const chatId = data.id; // API returns chat object with 'id', not 'chatId'
        setChatId(chatId);
        
        // Load messages if chat exists
        if (chatId) {
          await loadMessages(chatId);
        }
      } else {
        showToast.error('Error', 'Failed to load chat with coach.');
      }
    } catch (error) {
      console.error('Error loading chat:', error);
      showToast.error('Error', 'Failed to load chat with coach.');
    } finally {
      setIsLoadingMessages(false);
    }
  }, [selectedCoach, messages.length, router, locale, loadMessages]);

  // Real-time message polling
  useEffect(() => {
    if (!chatId || !selectedCoach) return;

    let isActive = true;
    
    const pollMessages = async () => {
      if (!isActive) return;
      await loadMessages(chatId);
    };

    // Poll every 3 seconds for new messages (reduced frequency)
    const interval = setInterval(pollMessages, 3000);

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [chatId, selectedCoach, loadMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Send message
  const sendMessage = async () => {
    if (!input.trim() || !chatId || isSendingMessage) return;
    
    setIsSendingMessage(true);
    const messageContent = input.trim();
    setInput('');
    
    // Add optimistic message
    const optimisticId = Date.now().toString();
    const optimisticMessage: Message = {
      id: optimisticId,
      content: messageContent,
      senderId: user?.id || '',
      createdAt: new Date().toISOString(),
      isRead: true
    };
    setMessages(prev => [...prev, optimisticMessage]);
    
    try {
      const response = await fetch('/api/coach-chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coachChatId: chatId,
          content: messageContent
        })
      });
      
      if (response.ok) {
        const responseData = await response.json();
        // Replace optimistic message with real message data
        setMessages(prev => 
          prev.map(msg => 
            msg.id === optimisticId 
              ? { 
                  id: responseData.id,
                  content: responseData.content,
                  senderId: responseData.senderId,
                  createdAt: responseData.createdAt,
                  isRead: responseData.isRead || true
                }
              : msg
          )
        );
      } else {
        // Remove optimistic message on error
        setMessages(prev => prev.filter(msg => msg.id !== optimisticId));
        showToast.error('Error', 'Failed to send message.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(msg => msg.id !== optimisticId));
      showToast.error('Error', 'Failed to send message.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Handle form submission
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile); // Default open on desktop, closed on mobile
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-close sidebar on mobile when selecting a coach
  useEffect(() => {
    if (isMobile && selectedCoach) {
      setIsSidebarOpen(false);
    }
  }, [selectedCoach, isMobile]);

  // Auto-select coach from URL on load
  useEffect(() => {
    if (selectedCoachId && coaches.length > 0 && !selectedCoach) {
      const coach = coaches.find(c => c.id === selectedCoachId);
      if (coach) {
        loadChatWithCoach(coach);
      }
    }
  }, [selectedCoachId, coaches, selectedCoach, loadChatWithCoach]);

  // Toggle sidebar
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Handle logout
  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/';
    }
  };

  // Format time
  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (isLoading) {
    return (
      <FullPageLoading 
        variant="fitness" 
        message="Loading Coach Chat..." 
        description="Connecting you with available coaches"
      />
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <Crown className="h-16 w-16 text-yellow-500 mx-auto" />
          <h1 className="text-2xl font-bold">PRO Feature</h1>
          <p className="text-muted-foreground">Coach chat is available for PRO users only.</p>
          <Button asChild>
            <Link href={`/${locale}/pricing`}>Upgrade to PRO</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isMobile ? 'mobile-chat-container' : 'h-[100dvh]'} bg-background text-foreground overflow-hidden relative`}>
      {/* Mobile Backdrop Overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Coaches List */}
      <div
        className={`flex flex-col transition-all duration-300 ease-in-out z-50 ${
          isMobile 
            ? `fixed left-0 top-0 h-full w-80 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl glass-sidebar`
            : `relative ${isSidebarOpen ? 'w-64 md:w-72' : 'w-0'} overflow-y-auto glass-sidebar border-r border-border/30`
        }`}
      >
        {(isMobile ? isSidebarOpen : true) && (
          <div className="p-4 md:p-5 flex flex-col h-full">
            {/* Header */}
            <div className="mb-6">
              <Link href={`/${locale}`} className="block hover:opacity-80 transition-all duration-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Image 
                      src="/logo.png" 
                      alt="HypertroQ Logo" 
                      width={32}
                      height={32}
                      className="w-8 h-8 object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-foreground">Coach Chat</h2>
                    <p className="text-xs text-muted-foreground">Connect with expert coaches</p>
                  </div>
                </div>
              </Link>
            </div>

            {/* Coaches List */}
            <div className="flex-1 flex flex-col min-h-0">
              <h3 className="text-sm font-semibold mb-4 text-foreground px-1 flex items-center">
                Available Coaches
                <span className="ml-auto text-xs text-muted-foreground">
                  {coaches.length} coach{coaches.length !== 1 ? 'es' : ''}
                </span>
              </h3>
              
              <div className="flex-1 overflow-y-auto space-y-2">
                {coaches.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Users className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">No coaches available</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">Please try again later</p>
                  </div>
                ) : (
                  coaches.map(coach => (
                    <div
                      key={coach.id}
                      className={`group flex items-center w-full rounded-xl transition-all duration-300 cursor-pointer ${
                        selectedCoach?.id === coach.id 
                          ? "bg-primary/10 border border-primary/20 shadow-md" 
                          : "hover:bg-muted/40 hover:shadow-sm"
                      }`}
                      onClick={() => loadChatWithCoach(coach)}
                    >
                      <div className="flex items-center flex-1 min-w-0 p-3">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarImage 
                            src={coach.user_metadata?.avatar_url || "/placeholder-avatar.png"} 
                            alt={coach.name} 
                          />
                          <AvatarFallback>
                            {coach.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`truncate text-sm font-medium ${
                              selectedCoach?.id === coach.id ? 'text-primary' : 'text-foreground'
                            }`}>
                              {coach.name}
                            </p>
                            <Badge 
                              variant={coach.status === 'active' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {coach.status === 'active' ? 'Online' : 'Offline'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {coach.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-5 border-t border-border/50 space-y-4">
              <div className="flex justify-center">
                <ThemeToggle />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-background relative min-w-0 ${isMobile && isSidebarOpen ? 'pointer-events-none' : ''}`}>
        {/* Header */}
        <div className="p-3 md:p-4 flex items-center justify-between h-14 md:h-16 flex-shrink-0 border-b border-border/30">
          <div className="flex items-center min-w-0 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="mr-2 md:mr-3 hover:bg-muted/50 flex-shrink-0 rounded-xl"
            >
              {isSidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            
            <div className="flex flex-col min-w-0">
              <h1 className="text-lg md:text-xl font-bold text-foreground truncate">
                {selectedCoach ? `Chat with ${selectedCoach.name}` : 'Coach Chat'}
              </h1>
              {selectedCoach && (
                <p className="text-xs text-muted-foreground truncate">
                  {selectedCoach.status === 'active' ? 'Online now' : 'Offline'}
                </p>
              )}
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-2">
            <LanguageSwitcher />
            
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage 
                        src={user.user_metadata?.avatar_url || "/placeholder-avatar.png"} 
                        alt="User Avatar" 
                      />
                      <AvatarFallback>
                        {user.user_metadata?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user.user_metadata?.full_name || user.email?.split('@')[0]}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/${locale}/profile`}>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/${locale}/chat`}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      AI Chat
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <User className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {selectedCoach ? (
            <div className="h-full flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoadingMessages ? (
                  <div className="flex justify-center items-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage 
                        src={selectedCoach.user_metadata?.avatar_url || "/placeholder-avatar.png"} 
                        alt={selectedCoach.name} 
                      />
                      <AvatarFallback className="text-2xl">
                        {selectedCoach.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold">Start chatting with {selectedCoach.name}</h3>
                      <p className="text-muted-foreground">Send a message to begin your conversation</p>
                    </div>
                  </div>
                ) : (
                  messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.senderId === user?.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {formatTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="border-t p-4">
                <form onSubmit={onSubmit} className="flex gap-2">
                  <ArabicAwareTextarea
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    placeholder={`Message ${selectedCoach.name}...`}
                    className="flex-1 min-h-[40px] max-h-[120px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <Button
                    type="submit"
                    disabled={!input.trim() || !chatId || isSendingMessage}
                    size="icon"
                  >
                    {isSendingMessage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a coach to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoachChatPage;
