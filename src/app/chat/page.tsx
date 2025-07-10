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

  // Add keyboard shortcuts tooltip
  const [showShortcuts, setShowShortcuts] = reactUseState(false);

  const KeyboardShortcuts = () => (
    <div className="absolute bottom-full left-0 mb-2 bg-popover border border-border rounded-lg p-3 shadow-lg z-50 min-w-64">
      <h4 className="text-sm font-medium mb-2">Keyboard Shortcuts</h4>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span>Send message</span>
          <kbd className="px-1 py-0.5 bg-muted rounded text-xs">⌘ Enter</kbd>
        </div>
        <div className="flex justify-between">
          <span>New chat</span>
          <kbd className="px-1 py-0.5 bg-muted rounded text-xs">⌘ N</kbd>
        </div>
        <div className="flex justify-between">
          <span>Focus input</span>
          <kbd className="px-1 py-0.5 bg-muted rounded text-xs">⌘ K</kbd>
        </div>
        <div className="flex justify-between">
          <span>Paste image</span>
          <kbd className="px-1 py-0.5 bg-muted rounded text-xs">⌘ V</kbd>
        </div>
        <div className="flex justify-between">
          <span>Close sidebar</span>
          <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Esc</kbd>
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
    <div className="flex h-screen bg-background text-foreground overflow-hidden relative">
      {/* Mobile Backdrop Overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`flex flex-col border-r border-border transition-all duration-300 ease-in-out z-50 ${
          isMobile 
            ? `fixed left-0 top-0 h-full w-80 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} shadow-xl bg-background`
            : `relative ${isSidebarOpen ? 'w-64 md:w-72' : 'w-0'} overflow-hidden shadow-sm bg-muted/20`
        }`}
      >
        {(isMobile ? isSidebarOpen : true) && (
          <div className="p-4 h-full flex flex-col">
            {/* Header */}
            <div className="mb-6">
              <Link href="/" className="block hover:opacity-80 transition-opacity">
                <h2 className="text-lg font-bold text-foreground mb-1">HypertroQ</h2>
                <p className="text-xs text-muted-foreground">Your AI fitness coach</p>
              </Link>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 mb-6">
              <Button 
                variant="default" 
                className="w-full justify-start h-10 bg-primary hover:bg-primary/90 shadow-sm" 
                onClick={handleNewChat}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                New Chat
              </Button>
              
              {user && userRole === 'admin' && (
                <>
                  <Link href="/admin/knowledge" passHref>
                    <Button variant="outline" className="w-full justify-start h-10 hover:bg-muted/50">
                      <Database className="mr-2 h-4 w-4" />
                      Knowledge Base
                    </Button>
                  </Link>

                  <Link href="/admin/settings" passHref>
                    <Button variant="outline" className="w-full justify-start h-10 hover:bg-muted/50">
                      <Settings className="mr-2 h-4 w-4" />
                      AI Configuration
                    </Button>
                  </Link>
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
                          className={`group flex items-center w-full rounded-lg transition-all duration-200 ${
                            activeChatId === chat.id 
                              ? "bg-primary/10 border border-primary/20 shadow-sm" 
                              : "hover:bg-muted/30"
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
                  
                  {/* Login prompt for guest users */}
                  <div className="flex-1 flex flex-col justify-center space-y-4 p-4 bg-muted/30 rounded-lg border border-border">
                    <div className="text-center space-y-2">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <h4 className="text-sm font-medium text-foreground">Save Your Conversations</h4>
                      <p className="text-xs text-muted-foreground">
                        You need to login to save your chat history and access all features
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Button asChild variant="default" size="sm" className="w-full">
                        <Link href="/login">
                          <User className="mr-2 h-4 w-4" />
                          Login
                        </Link>
                      </Button>
                      
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <Link href="/signup">
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Create Account
                        </Link>
                      </Button>
                    </div>
                    
                    <div className="text-center pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        Messages left: <span className="font-medium text-foreground">{4 - guestMessageCount}</span>
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-border space-y-2">
              <ThemeToggle />
              <div className="text-xs text-muted-foreground text-center">
                HypertroQ v1.0
              </div>
            </div>
          </div>
        )}
      </div>      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-background relative ${isMobile && isSidebarOpen ? 'pointer-events-none' : ''}`}>
        {/* Header */}
        <div className="p-3 md:p-4 border-b border-border flex items-center justify-between h-14 md:h-16 flex-shrink-0 bg-background/95 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center min-w-0 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="mr-2 md:mr-3 hover:bg-muted/50 flex-shrink-0"
              aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {isSidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="flex flex-col min-w-0">
              <h1 className="text-lg md:text-xl font-bold text-foreground truncate">HypertroQ</h1>
              {activeChatId && (
                <p className="text-xs text-muted-foreground truncate">
                  {chatHistory.find(chat => chat.id === activeChatId)?.title || 'Active Chat'}
                </p>
              )}
            </div>
          </div>

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
            <Button asChild variant="default" size="sm" className="flex-shrink-0">
              <Link href="/login">
                <User className="mr-2 h-4 w-4" />
                Login
              </Link>
            </Button>
          )}
        </div>

        {/* Chat Messages Area */}
        <div 
          className="flex-1 overflow-y-auto pb-32"
          onScroll={handleScroll}
        >
          {/* Guest user warning banner */}
          {!user && guestMessageCount === 3 && (
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-l-4 border-orange-400 p-3 m-3 rounded-r-lg">
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
          
          <div className="max-w-4xl mx-auto px-3 md:px-4 py-4 md:py-6 space-y-4 md:space-y-6">
            {isLoadingMessages && (
              <div className="flex justify-center items-center h-32">
                <InlineLoading 
                  variant="pulse"
                  message="Loading messages..."
                />
              </div>
            )}
            
            {!isLoadingMessages && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                <MessageSquare className="h-16 w-16 text-muted-foreground/50" />
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">Start a new conversation</h3>                  <p className="text-muted-foreground max-w-md">
                    Ask me anything about hypertrophy, muscle building, training programs, or nutrition. I&apos;m here to help you achieve your fitness goals!
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={msg.id || `${msg.role}-${index}`}
                className={`group flex items-start space-x-3 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
                data-role={msg.role}
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {msg.role === 'user' ? (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {user?.user_metadata?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'G'}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-background border-2 border-border flex items-center justify-center overflow-hidden">
                      <img 
                        src={getLogoSrc()} 
                        alt="HyperTroQ AI" 
                        className="h-6 w-6 object-contain"
                      />
                    </div>
                  )}
                </div>

                {/* Message Content */}
                <div className={`flex-1 max-w-[85%] md:max-w-[80%] ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
                  <div className="relative">
                    {(() => {
                      // Process message content to extract article links
                      const { content, articleLinks } = processMessageContent(msg.content);
                      
                      return (
                        <div
                          className={`px-3 md:px-4 py-2 md:py-3 rounded-2xl shadow-sm ${
                            msg.role === 'user'
                              ? 'bg-blue-500 text-white rounded-br-md'
                              : 'bg-muted text-foreground rounded-bl-md border'
                          }`}
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
                            <p className={`text-xs mt-2 opacity-70 ${msg.role === 'user' ? 'text-right text-white/80' : 'text-left'}`}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                      );
                    })()}
                    
                    {/* Copy Button */}
                    <div className={`absolute ${msg.role === 'user' ? 'left-0 -translate-x-8' : 'right-0 translate-x-8'} top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyMessage(msg.content)}
                        className={`h-7 w-7 p-0 rounded-full hover:bg-muted/80 ${
                          msg.role === 'user' 
                            ? 'text-muted-foreground hover:text-foreground' 
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                        aria-label="Copy message"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* AI Thinking Indicator */}
            {isAiThinking && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">AI</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-muted text-foreground border shadow-sm">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"></div>
                      </div>
                      <span className="text-sm text-muted-foreground">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
              {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input Area - Fixed at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border">
          <form onSubmit={handleSubmit} className="p-3 md:p-4">
            <div className="max-w-4xl mx-auto">
              {/* Image Preview */}
              {imagePreview && (
                <div className="mb-3 p-3 border border-border rounded-lg bg-muted/30" data-testid="image-preview">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">Selected Image</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeImage}
                      className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Selected image"
                      className="max-w-full max-h-32 object-contain rounded border"
                    />
                  </div>
                </div>
              )}
              
              <div className="flex items-end space-x-2 md:space-x-3">
                <div className="flex-1 relative">
                  <ArabicAwareTextarea
                    placeholder="Message HypertroQ..."
                    className="w-full rounded-2xl px-3 md:px-4 pr-10 md:pr-12 text-sm border-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 focus-visible:border-primary/50"
                    value={input}
                    onChange={handleInputChange}
                    disabled={isSendingMessage || isAiThinking}
                    maxLength={2000}
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
                      className="absolute right-12 md:right-14 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted/50"
                      onClick={() => {
                        setAutoScroll(true);
                        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      aria-label="Scroll to bottom"
                    >
                      <ChevronLeft className="h-4 w-4 rotate-90" />
                    </Button>
                  )}
                </div>
                
                {/* Image Upload Button */}
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
                    className="rounded-full h-10 w-10 md:h-12 md:w-12 hover:bg-muted/50 flex-shrink-0 transition-all duration-200 hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed"
                    onClick={() => document.getElementById('image-upload')?.click()}
                    disabled={isSendingMessage || isAiThinking}
                    aria-label="Upload image"
                    data-testid="image-upload-button"
                  >
                    <Image className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                  </Button>
                </div>
                
                <Button
                  type="submit"
                  size="icon"
                  className="rounded-full h-10 w-10 md:h-12 md:w-12 bg-primary hover:bg-primary/90 disabled:opacity-40 flex-shrink-0 shadow-lg transition-all duration-200 hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed"
                  aria-label="Send message"
                  data-testid="send-button"
                  disabled={isSendingMessage || isAiThinking || (!input.trim() && !selectedImage)}
                >
                  {isSendingMessage || isAiThinking ? (
                    <Loader2 className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" />
                  )}
                </Button>
              </div>
              
              {/* Input helper text */}
              <div className="flex items-center justify-between mt-2 px-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground hidden md:block">
                    Press Enter to send, Shift+Enter for new line
                  </p>
                  <button
                    onMouseEnter={() => setShowShortcuts(true)}
                    onMouseLeave={() => setShowShortcuts(false)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors relative hidden md:block"
                  >
                    Shortcuts
                    {showShortcuts && <KeyboardShortcuts />}
                  </button>
                  <p className="text-xs text-muted-foreground md:hidden">
                    Tap send or press Enter
                  </p>
                  {!user && (
                    <p className={`text-xs font-medium ${
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
