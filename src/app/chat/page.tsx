'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState as reactUseState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
// Updated lucide-react imports
import { Settings, MessageSquare, Send, ChevronLeft, Menu, User, LogOut, Database, Trash2, Copy, Loader2, Image, X } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { useTheme } from 'next-themes';
import { showToast } from '@/lib/toast';
import { InlineLoading, FullPageLoading } from '@/components/ui/loading';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { Suspense } from 'react';
import { MessageContent } from '@/components/message-content';
import { ArticleLinks } from '@/components/article-links';
import { processMessageContent } from '@/lib/article-links';
import { ArabicAwareTextarea } from '@/components/arabic-aware-textarea';

// Imports for DropdownMenu and Avatar
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import { useSearchParams, useRouter } from 'next/navigation';
import { LoginPromptDialog } from '@/components/login-prompt-dialog';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
  imageData?: string; // base64 image data
  imageMimeType?: string; // image MIME type
}

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  lastMessage?: string;
  messageCount?: number;
}

const ChatPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = reactUseState(false); // Default closed on mobile
  const [isMobile, setIsMobile] = reactUseState(false);
  const [user, setUser] = reactUseState<SupabaseUser | null>(null); // Using reactUseState
  const [userRole, setUserRole] = reactUseState<string>('user'); // Add userRole state
  const [chatHistory, setChatHistory] = reactUseState<Conversation[]>([]);
  const [activeChatId, setActiveChatId] = reactUseState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = reactUseState(true);
  const [isLoadingMessages, setIsLoadingMessages] = reactUseState(false);
  const [isSendingMessage, setIsSendingMessage] = reactUseState(false);
  const [isAiThinking, setIsAiThinking] = reactUseState(false);
  const [messages, setMessages] = reactUseState<Message[]>([]);
  const [input, setInput] = reactUseState('');
  const [autoScroll, setAutoScroll] = reactUseState(true);
  const [showLoginDialog, setShowLoginDialog] = reactUseState(false);
  const [guestMessageCount, setGuestMessageCount] = reactUseState(0);
  const [isInitializing, setIsInitializing] = reactUseState(true);

  // Image upload state
  const [selectedImage, setSelectedImage] = reactUseState<File | null>(null);
  const [imagePreview, setImagePreview] = reactUseState<string | null>(null);

  // Add connection status tracking
  const [isOnline, setIsOnline] = reactUseState(true);

  // Theme hook for logo
  const { theme } = useTheme();
  const [mounted, setMounted] = reactUseState(false);

  // Helper function to get logo source safely
  const getLogoSrc = () => {
    if (!mounted) {
      return "/logo.png"; // Default to light logo during SSR
    }
    return theme === 'dark' ? "/logo-dark.png" : "/logo.png";
  };

  const searchParams = useSearchParams();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Mounted effect for theme
  useEffect(() => {
    setMounted(true);
  }, []);  // Empty dependency array is correct here

  // Add network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    // Set initial online status
    setIsOnline(navigator.onLine);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setIsOnline]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const supabase = createClient();
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        setUser(currentUser); // Set actual user or null
        
        // Try to get user role if user is authenticated
        if (currentUser) {
          try {
            const response = await fetch('/api/user/role');
            if (response.ok) {
              const data = await response.json();
              setUserRole(data.role || 'user');
            } else {
              console.error('Error fetching user role');
              setUserRole('user'); // Default to user role on error
            }
          } catch (error) {
            console.error('Error fetching user role:', error);
            setUserRole('user'); // Default to user role on error
          }
        } else {
          setUserRole('user'); // Default for non-authenticated users
        }
        
        // Only fetch chat history for authenticated users
        if (currentUser) {
          await loadChatHistory();

          // Check for chatId in URL and load it
          const chatIdFromUrl = searchParams.get('id');
          if (chatIdFromUrl) {
            loadChatSession(chatIdFromUrl);
          }
        } else {
          // For guest users, set loading states to false
          setIsLoadingHistory(false);
        }
      } catch (error) {
        console.error('Error during initialization:', error);
      } finally {
        setIsInitializing(false);
      }
    };
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check for mobile viewport and handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768; // md breakpoint
      setIsMobile(mobile);
    };

    // Set initial sidebar state based on screen size only on first load
    const initializeSidebar = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // On desktop, default to open; on mobile, default to closed
      setIsSidebarOpen(!mobile);
    };

    // Only initialize on first load
    initializeSidebar();
    
    // Only track mobile state changes, don't force sidebar state
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setIsMobile, setIsSidebarOpen]); // Add dependencies but don't use them in the effect

  // Auto-close sidebar on mobile when navigating to a chat
  useEffect(() => {
    if (isMobile && activeChatId) {
      setIsSidebarOpen(false);
    }
  }, [activeChatId, isMobile, setIsSidebarOpen]);

  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  // Handle scroll to detect if user is at bottom
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isAtBottom = scrollHeight - scrollTop === clientHeight;
    setAutoScroll(isAtBottom);
  };  // Enhanced error handling for API calls
  const handleApiError = useCallback((error: unknown, operation: string) => {
    console.error(`Error during ${operation}:`, error);
    
    // Check if it's a structured API error response
    if (error && typeof error === 'object' && 'message' in error) {
      const apiError = error as { message: string; type?: string; details?: string };
      
      // Show user-friendly message based on error type
      switch (apiError.type) {
        case 'VALIDATION':
          showToast.error('Invalid Input', apiError.message);
          break;
        case 'AUTHENTICATION':
          showToast.authError(apiError.message);
          break;
        case 'AUTHORIZATION':
          showToast.error('Access Denied', apiError.message);
          break;
        case 'NOT_FOUND':
          showToast.error('Not Found', apiError.message);
          break;
        case 'FILE_UPLOAD':
          showToast.fileValidationError('file', apiError.message);
          break;
        case 'NETWORK':
          showToast.networkError(operation);
          break;
        default:
          showToast.error('Error', apiError.message);
      }
    } else if (!isOnline) {
      showToast.networkError(operation);
    } else {
      showToast.error('Error', `Failed to ${operation}. Please try again.`);
    }
  }, [isOnline]);

  const loadChatHistory = useCallback(async () => {
    try {
      setIsLoadingHistory(true);
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        setChatHistory(data.conversations);
      }
    } catch (error) {
      handleApiError(error, 'load chat history');
    } finally {
      setIsLoadingHistory(false);
    }
  }, [handleApiError, setChatHistory, setIsLoadingHistory]);

  const loadChatSession = useCallback(async (chatId: string) => {
    if (activeChatId === chatId && messages.length > 0) return; // Avoid reloading if already active and has messages

    setIsLoadingMessages(true);
    setActiveChatId(chatId);
    
    try {
      const response = await fetch(`/api/conversations/${chatId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.conversation.messages);
        // Update URL without full page reload
        router.push(`/chat?id=${chatId}`, { scroll: false });
      } else {
        console.error("Could not load chat session:", chatId);
        setActiveChatId(null);
        router.push('/chat', { scroll: false }); // Clear URL param
      }
    } catch (error) {
      handleApiError(error, 'load chat session');
      setActiveChatId(null);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [activeChatId, messages.length, router, handleApiError, setIsLoadingMessages, setActiveChatId, setMessages]);

  const handleNewChat = useCallback(async () => {
    setActiveChatId(null);
    setMessages([]);
    setSelectedImage(null);
    setImagePreview(null);
    router.push('/chat', { scroll: false });
  }, [router, setActiveChatId, setMessages, setSelectedImage, setImagePreview]);

  const handleDeleteChat = useCallback(async (chatId: string, e: React.MouseEvent) => {
    // Prevent the chat from being selected when delete button is clicked
    e.stopPropagation();
    
    // Find the chat to get its title for the confirmation
    const chatToDelete = chatHistory.find(chat => chat.id === chatId);
    const chatTitle = chatToDelete?.title || `Chat from ${chatToDelete ? new Date(chatToDelete.createdAt).toLocaleDateString() : 'Unknown date'}`;
    
    if (!confirm(`Are you sure you want to delete "${chatTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/conversations/${chatId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove the chat from local state
        setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
        
        // If the deleted chat was active, redirect to new chat
        if (activeChatId === chatId) {
          setActiveChatId(null);
          setMessages([]);
          router.push('/chat', { scroll: false });
        }
        
        showToast.success('Chat deleted', 'The conversation has been removed');
      } else {
        console.error('Failed to delete chat');
        showToast.error('Failed to delete chat', 'Please try again');
      }
    } catch (error) {
      handleApiError(error, 'delete chat');
    }
  }, [chatHistory, activeChatId, router, handleApiError, setChatHistory, setActiveChatId, setMessages]);

  const copyMessage = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      showToast.success('Copied to clipboard', 'Message content has been copied');
    } catch (error) {
      console.error('Failed to copy message:', error);
      showToast.error('Failed to copy', 'Unable to copy message to clipboard');
    }
  }, []);

  const toggleSidebar = useCallback(() => setIsSidebarOpen(!isSidebarOpen), [isSidebarOpen, setIsSidebarOpen]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= 2000) {
      setInput(value);
    }
  }, [setInput]);

  // Image handling functions
  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast.error('File too large', 'Please select an image smaller than 5MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        showToast.error('Invalid file type', 'Please select an image file');
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [setSelectedImage, setImagePreview]);

  const removeImage = useCallback(() => {
    setSelectedImage(null);
    setImagePreview(null);
  }, [setSelectedImage, setImagePreview]);

  // Handle paste events for image uploads
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboardData = e.clipboardData;
    
    if (clipboardData && clipboardData.files.length > 0) {
      const file = clipboardData.files[0];
      
      // Check if it's an image file
      if (file.type.startsWith('image/')) {
        e.preventDefault(); // Prevent default paste behavior
        
        // Check file size (limit to 5MB)
        if (file.size > 5 * 1024 * 1024) {
          showToast.error('File too large', 'Please select an image smaller than 5MB');
          return;
        }
        
        // If there's already an image, ask for confirmation
        if (selectedImage) {
          const confirm = window.confirm('Replace current image with pasted image?');
          if (!confirm) return;
        }
        
        setSelectedImage(file);
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
        
        showToast.success('Image pasted', 'Image has been added to your message');
      }
    }
  }, [selectedImage, setSelectedImage, setImagePreview]);

  const handleSubmit = useCallback(async (e: React.FormEvent | KeyboardEvent) => {
    e.preventDefault();
    
    if ((!input.trim() && !selectedImage) || isSendingMessage) return;

    // Check if user is a guest and has reached the message limit (4 messages)
    if (!user && guestMessageCount >= 4) {
      setShowLoginDialog(true);
      return;
    }

    const userMessage = input.trim() || (selectedImage ? '[Image]' : '');
    const imageFile = selectedImage;
    let imageDataForMessage = '';
    
    // Convert image to base64 for display if present
    if (imageFile) {
      imageDataForMessage = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(imageFile);
      });
    }
    
    setInput('');
    setSelectedImage(null);
    setImagePreview(null);
    setIsSendingMessage(true);

    // If the user is a guest, increment their message count
    if (!user) {
      setGuestMessageCount(prev => prev + 1);
    }

    // Optimistically add user message
    const tempUserMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString(),
      imageData: imageDataForMessage || undefined,
      imageMimeType: imageFile?.type || undefined,
    };
    setMessages(prev => [...prev, tempUserMessage]);
    setIsAiThinking(true);

    try {
      let response;
      
      if (imageFile) {
        // Use FormData for multipart/form-data request
        const formData = new FormData();
        formData.append('message', userMessage);
        formData.append('image', imageFile);
        formData.append('conversationId', activeChatId || '');
        formData.append('isGuest', (!user).toString());

        response = await fetch('/api/chat', {
          method: 'POST',
          body: formData,
        });
      } else {
        // Use JSON for text-only requests
        response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationId: activeChatId,
            message: userMessage,
            isGuest: !user, // Send isGuest flag for non-authenticated users
          }),
        });
      }

      if (!response.ok) {
        // Try to parse error response
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: 'Failed to send message' };
        }
        throw errorData;
      }

      const data = await response.json();
      
      // Update messages with actual data from server
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== tempUserMessage.id);
        return [
          ...filtered,
          {
            id: data.userMessage.id,
            role: 'user',
            content: data.userMessage.content,
            createdAt: data.userMessage.createdAt,
            // Use image data from server response if available, otherwise preserve temporary data
            imageData: data.userMessage.imageData || tempUserMessage.imageData,
            imageMimeType: data.userMessage.imageMimeType || tempUserMessage.imageMimeType,
          },
          {
            id: data.assistantMessage.id,
            role: 'assistant',
            content: data.assistantMessage.content,
            createdAt: data.assistantMessage.createdAt,
          }
        ];
      });

      // Update active chat ID if this was a new conversation
      if (!activeChatId && data.conversationId) {
        setActiveChatId(data.conversationId);
        router.push(`/chat?id=${data.conversationId}`, { scroll: false });
        // Refresh chat history
        loadChatHistory();
      }

    } catch (error) {
      handleApiError(error, 'send message');
      
      // Remove the optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempUserMessage.id));
      setInput(userMessage); // Restore the input
      if (imageFile) {
        setSelectedImage(imageFile);
        setImagePreview(imageDataForMessage || URL.createObjectURL(imageFile));
      }
    } finally {
      setIsSendingMessage(false);
      setIsAiThinking(false);
    }
  }, [
    input, 
    selectedImage,
    isSendingMessage, 
    user, 
    guestMessageCount, 
    activeChatId, 
    router, 
    loadChatHistory, 
    handleApiError,
    setInput,
    setSelectedImage,
    setImagePreview,
    setIsSendingMessage,
    setShowLoginDialog,
    setGuestMessageCount,
    setMessages,
    setIsAiThinking,
    setActiveChatId
  ]);

  // Add keyboard shortcuts support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Enter to send message
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && (input.trim() || selectedImage) && !isSendingMessage) {
        e.preventDefault();
        handleSubmit(e);
      }
      
      // Cmd/Ctrl + N for new chat
      if ((e.metaKey || e.ctrlKey) && e.key === 'n' && user) {
        e.preventDefault();
        handleNewChat();
      }
      
      // Cmd/Ctrl + K to focus search/input
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const textarea = document.querySelector('textarea[placeholder*="message"]') as HTMLTextAreaElement;
        textarea?.focus();
      }
      
      // Escape to close mobile sidebar
      if (e.key === 'Escape' && isMobile && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [input, selectedImage, isSendingMessage, user, isMobile, isSidebarOpen, handleSubmit, handleNewChat, setIsSidebarOpen]);

  // Add global paste event listener for images
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      // Only handle if not already handled by textarea
      const target = e.target as Element;
      if (target?.tagName === 'TEXTAREA') return;
      
      const clipboardData = e.clipboardData;
      
      if (clipboardData && clipboardData.files.length > 0) {
        const file = clipboardData.files[0];
        
        // Check if it's an image file
        if (file.type.startsWith('image/')) {
          e.preventDefault();
          
          // Check file size (limit to 5MB)
          if (file.size > 5 * 1024 * 1024) {
            showToast.error('File too large', 'Please select an image smaller than 5MB');
            return;
          }
          
          // If there's already an image, ask for confirmation
          if (selectedImage) {
            const confirm = window.confirm('Replace current image with pasted image?');
            if (!confirm) return;
          }
          
          setSelectedImage(file);
          
          // Create preview
          const reader = new FileReader();
          reader.onload = (e) => {
            setImagePreview(e.target?.result as string);
          };
          reader.readAsDataURL(file);
          
          showToast.success('Image pasted', 'Image has been added to your message');
          
          // Focus the textarea
          const textarea = document.querySelector('textarea[placeholder*="message"]') as HTMLTextAreaElement;
          textarea?.focus();
        }
      }
    };

    document.addEventListener('paste', handleGlobalPaste);
    return () => document.removeEventListener('paste', handleGlobalPaste);
  }, [selectedImage, setSelectedImage, setImagePreview]);

  // Enhanced keyboard shortcuts tooltip
  const [showShortcuts, setShowShortcuts] = reactUseState(false);

  const KeyboardShortcuts = () => (
    <div className="absolute bottom-full left-0 mb-3 glass-input rounded-xl p-4 shadow-xl z-50 min-w-72 animate-scale-in border border-border/50">
      <h4 className="text-sm font-semibold mb-3 text-foreground flex items-center">
        <span className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mr-2"></span>
        Keyboard Shortcuts
      </h4>
      <div className="space-y-2 text-xs">
        <div className="flex justify-between items-center py-1">
          <span className="text-muted-foreground">Send message</span>
          <kbd className="px-2 py-1 bg-muted/60 rounded-md text-xs font-mono border border-border/40">⌘ + Enter</kbd>
        </div>
        <div className="flex justify-between items-center py-1">
          <span className="text-muted-foreground">New chat</span>
          <kbd className="px-2 py-1 bg-muted/60 rounded-md text-xs font-mono border border-border/40">⌘ + N</kbd>
        </div>
        <div className="flex justify-between items-center py-1">
          <span className="text-muted-foreground">Focus input</span>
          <kbd className="px-2 py-1 bg-muted/60 rounded-md text-xs font-mono border border-border/40">⌘ + K</kbd>
        </div>
        <div className="flex justify-between items-center py-1">
          <span className="text-muted-foreground">Paste image</span>
          <kbd className="px-2 py-1 bg-muted/60 rounded-md text-xs font-mono border border-border/40">⌘ + V</kbd>
        </div>
        <div className="flex justify-between items-center py-1">
          <span className="text-muted-foreground">Close sidebar</span>
          <kbd className="px-2 py-1 bg-muted/60 rounded-md text-xs font-mono border border-border/40">Esc</kbd>
        </div>
      </div>
    </div>
  );

  // Show loading state while initializing
  if (isInitializing) {
    return (
      <FullPageLoading 
        variant="fitness" 
        message="Preparing your AI fitness coach..." 
        description="Loading your personalized workout and nutrition assistant"
      />
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden relative animate-fade-in">
      {/* Mobile Backdrop Overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Enhanced Mobile Sidebar with Consolidated Navigation */}
      <div
        className={`flex flex-col transition-all duration-300 ease-in-out z-50 ${
          isMobile 
            ? `fixed left-0 top-0 h-full w-80 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl glass-sidebar animate-slide-in-left`
            : `relative ${isSidebarOpen ? 'w-64 md:w-72' : 'w-0'} overflow-hidden glass-sidebar border-r border-border/30`
        }`}
      >
        {(isMobile ? isSidebarOpen : true) && (
          <div className="p-4 md:p-5 h-full flex flex-col">
            {/* Enhanced Header with Logo */}
            <div className="mb-6">
              <Link href="/" className="block hover:opacity-80 transition-all duration-200 hover-lift">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                    <img 
                      src="/logo.png" 
                      alt="HypertroQ Logo" 
                      className="w-8 h-8 object-contain"
                    />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">HypertroQ</h2>
                    <p className="text-xs text-muted-foreground">AI Fitness Coach</p>
                  </div>
                </div>
              </Link>
            </div>

            {/* Main Navigation Section */}
            <div className="space-y-3 mb-6">
              {/* New Chat - Always Prominent */}
              <Button 
                variant="default" 
                className="w-full justify-start h-11 gradient-primary hover-lift text-white font-medium shadow-lg" 
                onClick={handleNewChat}
              >
                <MessageSquare className="mr-3 h-5 w-5" />
                New Chat
              </Button>

              {/* Admin Navigation - Only for Admins */}
              {user && userRole === 'admin' && (
                <>
                  <div className="pt-3 border-t border-border/30">
                    <p className="text-xs font-semibold text-muted-foreground mb-3 px-1">ADMIN TOOLS</p>
                    <div className="space-y-2">
                      <Link href="/admin/knowledge" passHref>
                        <Button variant="ghost" className="w-full justify-start h-10 hover:bg-muted/50 hover-lift text-left">
                          <Database className="mr-3 h-4 w-4" />
                          Knowledge Base
                        </Button>
                      </Link>

                      <Link href="/admin/settings" passHref>
                        <Button variant="ghost" className="w-full justify-start h-10 hover:bg-muted/50 hover-lift text-left">
                          <Settings className="mr-3 h-4 w-4" />
                          AI Configuration
                        </Button>
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* Chat History Section for authenticated users or Login prompt for guests */}
            <div className="flex-1 flex flex-col min-h-0">
              {user ? (
                <>
                  <h3 className="text-sm font-semibold mb-3 text-foreground px-1 flex items-center">
                    Chat History
                    <span className="ml-auto text-xs text-muted-foreground">
                      {chatHistory.length}
                    </span>
                  </h3>
                  
                  {/* Chat History List */}
                  <div className="flex-1 overflow-y-auto -mr-2 pr-2 space-y-1">
                    {isLoadingHistory ? (
                      <div className="flex items-center justify-center py-8">
                        <InlineLoading 
                          variant="dots"
                          message="Loading chat history..."
                        />
                      </div>
                    ) : chatHistory.length > 0 ? (
                      chatHistory.map(chat => (
                        <div
                          key={chat.id}
                          className={`group flex items-center w-full rounded-xl transition-all duration-300 hover-lift ${
                            activeChatId === chat.id 
                              ? "bg-primary/10 border border-primary/20 shadow-md active-chat-glow" 
                              : "hover:bg-muted/40 hover:shadow-sm"
                          }`}
                        >
                          <button
                            className="flex items-center flex-1 min-w-0 text-left p-3"
                            onClick={() => loadChatSession(chat.id)}
                            disabled={isLoadingMessages && activeChatId === chat.id}
                          >
                            <MessageSquare className={`mr-3 h-4 w-4 flex-shrink-0 ${
                              activeChatId === chat.id ? 'text-primary' : 'text-muted-foreground'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className={`truncate text-sm font-medium ${
                                activeChatId === chat.id ? 'text-primary' : 'text-foreground'
                              }`}>
                                {chat.title || `Chat ${chat.id.slice(-6)}`}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {new Date(chat.createdAt).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </button>
                          <button
                            onClick={(e) => handleDeleteChat(chat.id, e)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 mr-1 rounded hover:bg-destructive/10"
                            aria-label="Delete chat"
                          >
                            <Trash2 className="h-4 w-4 text-destructive hover:text-destructive/80" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <MessageSquare className="h-8 w-8 text-muted-foreground/50 mb-2" />
                        <p className="text-sm text-muted-foreground">No conversations yet</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">Start a new chat to begin</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-sm font-semibold mb-3 text-foreground px-1">
                    Guest Mode
                  </h3>
                  
                  {/* Enhanced Login prompt for guest users */}
                  <div className="flex-1 flex flex-col justify-center space-y-5 p-5 glass-input rounded-xl border border-border/50 animate-scale-in">
                    <div className="text-center space-y-3">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <User className="h-7 w-7 text-white" />
                      </div>
                      <h4 className="text-sm font-semibold text-foreground">Save Your Conversations</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Create an account to save your chat history, access all features, and get personalized fitness coaching
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <Button asChild variant="default" size="sm" className="w-full gradient-primary hover-lift text-white font-medium">
                        <Link href="/login">
                          <User className="mr-2 h-4 w-4" />
                          Sign In
                        </Link>
                      </Button>
                      
                      <Button asChild variant="outline" size="sm" className="w-full hover-lift border-border/60">
                        <Link href="/signup">
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Create Account
                        </Link>
                      </Button>
                    </div>
                    
                    <div className="text-center pt-3 border-t border-border/50">
                      <p className="text-xs text-muted-foreground">
                        Messages remaining: 
                        <span className={`ml-1 font-semibold ${guestMessageCount >= 3 ? 'text-orange-500' : 'text-primary'}`}>
                          {4 - guestMessageCount}
                        </span>
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Enhanced Footer with User Profile */}
            <div className="mt-6 pt-5 border-t border-border/50 space-y-4">
              {/* User Profile Section for Mobile */}
              {user && isMobile && (
                <Link href="/profile" className="block hover:opacity-80 transition-all duration-200">
                  <div className="flex items-center space-x-3 p-3 rounded-xl glass-input border border-border/50 hover-lift">
                    <Avatar className="h-10 w-10 shadow-md">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm">
                        {user.user_metadata?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        Tap to view profile
                      </p>
                    </div>
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              )}
              
              <div className="flex justify-center">
                <ThemeToggle />
              </div>
              <div className="text-xs text-muted-foreground text-center">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-1 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
                  <span>HypertroQ v1.0</span>
                  <div className="w-1 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-background relative ${isMobile && isSidebarOpen ? 'pointer-events-none' : ''}`}>
        {/* Enhanced Header with Glassmorphism */}
        <div className="p-3 md:p-4 flex items-center justify-between h-14 md:h-16 flex-shrink-0 glass-header sticky top-0 z-10">
          <div className="flex items-center min-w-0 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="mr-2 md:mr-3 hover:bg-muted/50 flex-shrink-0 hover-lift rounded-xl"
              aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {isSidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="flex flex-col min-w-0">
              <h1 className="text-lg md:text-xl font-bold text-foreground truncate">
                {isMobile && activeChatId ? 
                  (chatHistory.find(chat => chat.id === activeChatId)?.title || 'Chat') 
                  : 'HypertroQ'
                }
              </h1>
              {!isMobile && activeChatId && (
                <p className="text-xs text-muted-foreground truncate">
                  {chatHistory.find(chat => chat.id === activeChatId)?.title || 'Active Chat'}
                </p>
              )}
            </div>
          </div>

          {/* Mobile: New Chat Button + User Menu | Desktop: User Menu Only */}
          <div className="flex items-center space-x-2">
            {/* Mobile New Chat Button */}
            {isMobile && user && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNewChat}
                className="h-9 w-9 rounded-xl hover:bg-muted/50 hover-lift"
                aria-label="Start new chat"
              >
                <MessageSquare className="h-5 w-5" />
              </Button>
            )}

            {/* User Avatar Dropdown Menu or Login Button */}
            {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 md:h-10 md:w-10 rounded-full hover:bg-muted/50 flex-shrink-0">
                  <Avatar className="h-8 w-8 md:h-10 md:w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user.user_metadata?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.user_metadata?.full_name || user.email?.split('@')[0] || 'User Name'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email || 'user@example.com'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                {userRole === 'admin' && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/knowledge">
                        <Database className="mr-2 h-4 w-4" />
                        <span>Knowledge Base</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>AI Configuration</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async () => { 
                  try {
                    console.log('Logout action triggered');
                    
                    const supabase = createClient();
                    
                    // Reset local state immediately for immediate UI update
                    setUser(null);
                    setUserRole('user');
                    setChatHistory([]);
                    setMessages([]);
                    setActiveChatId(null);
                    setGuestMessageCount(0);
                    setSelectedImage(null);
                    setImagePreview(null);
                    
                    // Sign out from Supabase
                    await supabase.auth.signOut();
                    
                    // Redirect to home or chat page
                    router.push('/');
                    showToast.success('Logged out', 'You have been successfully logged out');
                  } catch (error) {
                    console.error('Logout error:', error);
                    showToast.error('Logout failed', 'Please try again');
                    // If there's an error, we might want to reload the page to ensure clean state
                    window.location.href = '/';
                  }
                }}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="default" size="sm" className="flex-shrink-0 gradient-primary text-white">
              <Link href="/login">
                <User className="mr-2 h-4 w-4" />
                Login
              </Link>
            </Button>
          )}
          </div>
        </div>

        {/* Enhanced Chat Messages Area */}
        <div 
          className="flex-1 overflow-y-auto pb-40 message-area w-full"
          onScroll={handleScroll}
        >
          {/* Guest user warning banner */}
          {!user && guestMessageCount === 3 && (
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-l-4 border-orange-400 p-3 mx-3 md:mx-6 rounded-r-xl animate-scale-in">
              <div className="flex items-center">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                  <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                    This is your last free message! Create a free account to continue chatting.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="w-full max-w-5xl mx-auto px-4 md:px-6 py-4 md:py-8 space-y-4 md:space-y-8">
            {isLoadingMessages && (
              <div className="flex justify-center items-center h-32">
                <InlineLoading 
                  variant="pulse"
                  message="Loading messages..."
                />
              </div>
            )}
            
            {!isLoadingMessages && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6 animate-scale-in px-2 md:px-4">
                <div className="relative">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-2xl flex items-center justify-center">
                    <img 
                      src="/logo.png" 
                      alt="HypertroQ AI" 
                      className="w-12 h-12 md:w-14 md:h-14 object-contain"
                    />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">AI</span>
                  </div>
                </div>
                <div className="space-y-3 w-full">
                  <h3 className="text-lg md:text-2xl font-semibold text-foreground">Start a new conversation</h3>
                  <p className="text-muted-foreground max-w-sm md:max-w-md leading-relaxed mx-auto">
                    Ask me anything about hypertrophy, muscle building, training programs, or nutrition. I&apos;m here to help you achieve your fitness goals!
                  </p>
                </div>
                
                {/* Enhanced Example prompt buttons for mobile */}
                <div className="flex flex-wrap gap-2 justify-center w-full max-w-xs md:max-w-2xl mt-6">
                  {[
                    "Best rep range for muscle growth?",
                    "Weekly training structure?", 
                    "Supplement recommendations?"
                  ].map((prompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-xs md:text-sm hover-lift border-border/60 hover:bg-muted/60 rounded-full px-3 md:px-4 py-2"
                      onClick={() => setInput(prompt)}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={msg.id || `${msg.role}-${index}`}
                className={`group flex items-start space-x-3 md:space-x-4 animate-fade-in ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
                data-role={msg.role}
              >
                {/* Enhanced Mobile-Optimized Avatar */}
                <div className="flex-shrink-0">
                  {msg.role === 'user' ? (
                    <Avatar className="h-8 w-8 md:h-10 md:w-10 shadow-md hover-lift">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-xs md:text-sm">
                        {user?.user_metadata?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'G'}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 border-2 border-border/50 flex items-center justify-center overflow-hidden shadow-md hover-lift">
                      <img 
                        src={getLogoSrc()} 
                        alt="HyperTroQ AI" 
                        className="h-5 w-5 md:h-7 md:w-7 object-contain"
                      />
                    </div>
                  )}
                </div>

                {/* Enhanced Mobile-Optimized Message Content */}
                <div className={`flex-1 max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
                  <div className="relative">
                    {(() => {
                      // Process message content to extract article links
                      const { content, articleLinks } = processMessageContent(msg.content);
                      
                      return (
                        <div
                          className={`px-3 md:px-5 py-2.5 md:py-4 ${
                            msg.role === 'user'
                              ? 'chat-bubble-user'
                              : 'chat-bubble-ai'
                          } transition-all duration-200 hover:shadow-lg`}
                        >
                          <MessageContent 
                            content={content} 
                            role={msg.role}
                            imageData={msg.imageData}
                            imageMimeType={msg.imageMimeType}
                          />
                          
                          {/* Article Links at bottom of message bubble */}
                          {articleLinks && (
                            <ArticleLinks 
                              links={articleLinks} 
                              messageRole={msg.role}
                            />
                          )}
                          
                          {msg.createdAt && (
                            <p className={`text-xs mt-2 md:mt-3 opacity-70 ${msg.role === 'user' ? 'text-right text-white/80' : 'text-left text-muted-foreground'}`}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                      );
                    })()}
                    
                    {/* Enhanced Mobile-Optimized Copy Button */}
                    <div className={`absolute ${msg.role === 'user' ? 'left-0 -translate-x-8 md:-translate-x-10' : 'right-0 translate-x-8 md:translate-x-10'} top-2 md:top-3 opacity-0 group-hover:opacity-100 transition-all duration-300`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyMessage(msg.content)}
                        className={`h-7 w-7 md:h-8 md:w-8 p-0 rounded-full hover:bg-background/80 backdrop-blur-sm shadow-md hover-lift ${
                          msg.role === 'user' 
                            ? 'text-muted-foreground hover:text-foreground border border-border/30' 
                            : 'text-muted-foreground hover:text-foreground border border-border/30'
                        }`}
                        aria-label="Copy message"
                      >
                        <Copy className="h-3 w-3 md:h-3.5 md:w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Enhanced Mobile-Optimized AI Thinking Indicator */}
            {isAiThinking && (
              <div className="flex items-start space-x-3 md:space-x-4 animate-fade-in">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center shadow-md animate-glow border border-primary/20">
                    <img 
                      src="/logo.png" 
                      alt="HypertroQ AI" 
                      className="h-5 w-5 md:h-6 md:w-6 object-contain"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="px-3 md:px-5 py-3 md:py-4 chat-bubble-ai">
                    <div className="flex items-center space-x-2 md:space-x-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-primary/80 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-primary/80 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-primary/80 rounded-full animate-bounce"></div>
                      </div>
                      <span className="text-xs md:text-sm text-muted-foreground font-medium">AI is analyzing your question...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
              {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Enhanced Mobile-Optimized Floating Message Input Area */}
        <div className="absolute bottom-0 left-0 right-0 p-2 md:p-6">
          <form onSubmit={handleSubmit} className="w-full max-w-5xl mx-auto">
            <div className="floating-input p-3 md:p-5 animate-scale-in mx-2 md:mx-0">
              {/* Image Preview */}
              {imagePreview && (
                <div className="mb-3 md:mb-4 p-2 md:p-3 bg-muted/50 rounded-xl border border-border/50" data-testid="image-preview">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs md:text-sm font-medium text-foreground">Selected Image</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeImage}
                      className="h-6 w-6 md:h-7 md:w-7 p-0 hover:bg-destructive/10 hover:text-destructive rounded-full hover-lift"
                    >
                      <X className="h-3 w-3 md:h-3.5 md:w-3.5" />
                    </Button>
                  </div>
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Selected image"
                      className="max-w-full max-h-24 md:max-h-32 object-contain rounded-lg border shadow-sm"
                    />
                  </div>
                </div>
              )}
              
              <div className="flex items-end space-x-2 md:space-x-4">
                <div className="flex-1 relative">
                  <ArabicAwareTextarea
                    placeholder="Message HypertroQ..."
                    className="w-full rounded-2xl px-3 md:px-5 pr-10 md:pr-14 py-2.5 md:py-4 text-sm md:text-base border-0 bg-muted/30 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-0 resize-none leading-relaxed chat-textarea"
                    value={input}
                    onChange={handleInputChange}
                    disabled={isSendingMessage || isAiThinking}
                    maxLength={2000}
                    rows={1}
                    data-testid="chat-input"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                    onPaste={handlePaste}
                  />
                  {!autoScroll && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-12 md:right-16 top-1/2 -translate-y-1/2 h-7 w-7 md:h-8 md:w-8 p-0 hover:bg-muted/50 rounded-full hover-lift"
                      onClick={() => {
                        setAutoScroll(true);
                        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      aria-label="Scroll to bottom"
                    >
                      <ChevronLeft className="h-3 w-3 md:h-4 md:w-4 rotate-90" />
                    </Button>
                  )}
                </div>
                
                {/* Enhanced Mobile-Optimized Image Upload Button */}
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="image-upload"
                    disabled={isSendingMessage || isAiThinking}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="rounded-full h-10 w-10 md:h-14 md:w-14 hover:bg-muted/60 flex-shrink-0 hover-lift transition-all duration-200 disabled:cursor-not-allowed border border-border/30"
                    onClick={() => document.getElementById('image-upload')?.click()}
                    disabled={isSendingMessage || isAiThinking}
                    aria-label="Upload image"
                    data-testid="image-upload-button"
                  >
                    <Image className="h-4 w-4 md:h-6 md:w-6 text-muted-foreground" />
                  </Button>
                </div>
                
                {/* Enhanced Mobile-Optimized Send Button */}
                <Button
                  type="submit"
                  size="icon"
                  className="rounded-full h-10 w-10 md:h-14 md:w-14 gradient-primary disabled:opacity-40 flex-shrink-0 shadow-lg transition-all duration-300 hover-lift disabled:cursor-not-allowed"
                  aria-label="Send message"
                  data-testid="send-button"
                  disabled={isSendingMessage || isAiThinking || (!input.trim() && !selectedImage)}
                >
                  {isSendingMessage || isAiThinking ? (
                    <Loader2 className="h-4 w-4 md:h-6 md:w-6 text-white animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 md:h-6 md:w-6 text-white" />
                  )}
                </Button>
              </div>
              
              {/* Enhanced Mobile-Optimized Input helper text */}
              <div className="flex items-center justify-between mt-2 md:mt-3 px-1">
                <div className="flex items-center gap-2 md:gap-3">
                  <p className="text-xs text-muted-foreground hidden md:block">
                    Press ⌘ + Enter to send, Shift + Enter for new line
                  </p>
                  <button
                    onMouseEnter={() => setShowShortcuts(true)}
                    onMouseLeave={() => setShowShortcuts(false)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors relative hidden md:block hover-lift"
                  >
                    Shortcuts
                    {showShortcuts && <KeyboardShortcuts />}
                  </button>
                  <p className="text-xs text-muted-foreground md:hidden">
                    Tap send or press Enter
                  </p>
                  {!user && (
                    <p className={`text-xs font-medium transition-colors ${
                      guestMessageCount >= 3 
                        ? 'text-orange-500 animate-pulse' 
                        : 'text-primary/80'
                    }`}>
                      {4 - guestMessageCount} free messages remaining
                    </p>
                  )}
                </div>
                <p className={`text-xs transition-colors ${
                  input.length > 1800 
                    ? 'text-orange-500 font-medium' 
                    : input.length > 1600 
                    ? 'text-amber-500' 
                    : 'text-muted-foreground'
                }`}>
                  {input.length}/2000
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Login Prompt Dialog */}
      <LoginPromptDialog 
        open={showLoginDialog} 
        onOpenChange={setShowLoginDialog} 
        variant={!user && guestMessageCount >= 4 ? 'messageLimit' : 'initial'}
      />
      
      {/* Keyboard Shortcuts Tooltip - Always show on desktop, toggle on mobile */}
      {(!isMobile || showShortcuts) && (
        <KeyboardShortcuts />
      )}
    </div>
  );
};

export default function ChatPageWrapper() {
  return (
    <Suspense fallback={<FullPageLoading variant="brain" message="Loading AI Chat" description="Preparing your intelligent fitness companion" />}>
      <ChatPage />
    </Suspense>
  );
}
