'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState as reactUseState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, MessageSquare, Send, ChevronLeft, Menu, User, LogOut, Database, Trash2, Copy, Loader2, Image as ImageIcon, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
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
import LanguageSwitcher from '@/components/language-switcher';
import { useTranslations, useLocale } from 'next-intl';

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
  AvatarImage,
} from "@/components/ui/avatar";
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { LoginPromptDialog } from '@/components/login-prompt-dialog';
import { MessageLimitIndicator } from '@/components/message-limit-indicator';
import { PlanBadge } from '@/components/plan-badge';
import { UpgradeButton } from '@/components/upgrade-button';
import { useOnlineStatus } from '@/hooks/use-online-status';

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  lastMessage?: string;
  messageCount?: number;
}

const ChatPage = () => {
  const t = useTranslations('ChatPage');
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get conversation ID from URL parameters - supports both /chat/[id] and /chat?id=...
  const initialConversationId = Array.isArray(params.id) ? params.id[0] : params.id || searchParams.get('id') || null;
  
  const [isSidebarOpen, setIsSidebarOpen] = reactUseState(false); // Default closed on mobile
  const [isMobile, setIsMobile] = reactUseState(false);
  const [user, setUser] = reactUseState<SupabaseUser | null>(null); // Using reactUseState
  const [userRole, setUserRole] = reactUseState<string>('user'); // Add userRole state
  const [userPlan, setUserPlan] = reactUseState<{
    plan: 'FREE' | 'PRO';
    messagesUsedToday: number;
    dailyLimit: number;
  } | null>(null);
  const [chatHistory, setChatHistory] = reactUseState<Conversation[]>([]);
  const [activeChatId, setActiveChatId] = reactUseState<string | null>(initialConversationId);
  const [conversationId, setConversationId] = reactUseState<string | null>(initialConversationId);
  const [isLoadingHistory, setIsLoadingHistory] = reactUseState(true);
  const [isLoadingMessages, setIsLoadingMessages] = reactUseState(false);
  const [autoScroll, setAutoScroll] = reactUseState(true);
  const [showLoginDialog, setShowLoginDialog] = reactUseState(false);
  const [guestMessageCount, setGuestMessageCount] = reactUseState(0);
  const [isInitializing, setIsInitializing] = reactUseState(true);

  // Image upload state
  const [selectedImage, setSelectedImage] = reactUseState<File | null>(null);
  const [imagePreview, setImagePreview] = reactUseState<string | null>(null);

  // Add connection status tracking
  const { isOnline } = useOnlineStatus();

  // Theme hook for logo
  const { theme } = useTheme();
  const [mounted, setMounted] = reactUseState(false);

  // Message state - custom implementation instead of useChat to avoid streaming issues
  const [messages, setMessages] = reactUseState<Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    imageData?: string;
    imageMimeType?: string;
  }>>([]);
  const [input, setInput] = reactUseState('');
  const [isLoading, setIsLoading] = reactUseState(false);

  // Custom input change handler
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, [setInput]);

  // Custom submit handler
  const sendMessage = useCallback(async (messageText: string, imageFile?: File) => {
    if ((!messageText.trim() && !imageFile) || isLoading) return;

    if (!user && guestMessageCount >= 4) {
      setShowLoginDialog(true);
      return;
    }

    // Safety guard: If we're sending a second message but don't have a conversationId yet,
    // wait a moment for the state to update
    if (messages.length > 0 && !conversationId) {
      console.warn("⚠️ Attempting to send second message without conversationId, waiting...");
      showToast.error(t('toasts.errorSendingMessage'), "Chat not fully initialized. Please wait a moment and try again.");
      return;
    }

    setIsLoading(true);

    try {
      const userMessage = {
        id: Date.now().toString(),
        role: 'user' as const,
        content: messageText,
        imageData: imageFile ? await convertFileToBase64(imageFile) : undefined,
        imageMimeType: imageFile?.type,
      };

      setMessages(prev => [...prev, userMessage]);
      setInput('');

      // Use local variable instead of stale state
      let tempConversationId = conversationId;

      console.log("▶️ Sending message:", messageText);
      console.log("📨 Conversation ID:", tempConversationId);
      console.log("🕒 Original conversationId state:", conversationId);

      let body: FormData | string;
      let contentType: string | undefined;

      if (imageFile) {
        const formData = new FormData();
        formData.append('message', messageText);
        formData.append('conversationId', tempConversationId || '');
        formData.append('isGuest', (!user).toString());
        formData.append('image', imageFile);
        body = formData;
        console.log("📤 Request Body (FormData):", {
          message: messageText,
          conversationId: tempConversationId || '',
          isGuest: !user,
          hasImage: true
        });
      } else {
        body = JSON.stringify({
          message: messageText,
          conversationId: tempConversationId || '',
          isGuest: !user,
        });
        contentType = 'application/json';
        console.log("📤 Request Body (JSON):", body);
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        body,
        ...(contentType && { headers: { 'Content-Type': contentType } }),
      });

      if (!response.ok) {
        let errorPayload;
        try {
          errorPayload = await response.json();
        } catch {
          const errorText = await response.text();
          throw new Error(`Server error: ${response.statusText} (${errorText})`);
        }

        if (errorPayload.error === 'MESSAGE_LIMIT_REACHED') {
          if (userPlan) {
            setUserPlan(prev => prev ? { ...prev, messagesUsedToday: prev.dailyLimit } : null);
          }
          showToast.error(t('toasts.limitReachedTitle'), t('toasts.limitReachedText'));
          return;
        }

        throw new Error(errorPayload.message || errorPayload.error || 'An unknown server error occurred.');
      }

      let responseData;
      try {
        responseData = await response.json();
      } catch {
        const text = await response.text().catch(() => "N/A");
        throw new Error(`Invalid JSON from server. Response: ${text}`);
      }

      // Capture and persist the new conversationId
      if (responseData.conversationId && !conversationId) {
        tempConversationId = responseData.conversationId;
        setConversationId(tempConversationId);
        setActiveChatId(tempConversationId);
        window.history.replaceState(null, '', `/${locale}/chat?id=${tempConversationId}`);
      }

      const assistantMessage = {
        id: responseData.assistantMessage?.id || (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: responseData.content,
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (user && userPlan && userPlan.plan === 'FREE') {
        setUserPlan(prev => prev ? {
          ...prev,
          messagesUsedToday: Math.min(prev.messagesUsedToday + 1, prev.dailyLimit)
        } : null);
      }

      if (!user) {
        setGuestMessageCount(prev => prev + 1);
      }

    } catch (error) {
      console.error('Chat error:', error);
      showToast.error(t('toasts.errorSendingMessage'), error instanceof Error ? error.message : 'Unexpected error');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [user, guestMessageCount, conversationId, userPlan, locale, t, isLoading, messages.length, setShowLoginDialog, setMessages, setInput, setIsLoading, setConversationId, setActiveChatId, setUserPlan, setGuestMessageCount]);

  // Helper function to convert File to base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
      reader.readAsDataURL(file);
    });
  };

  // Helper function to get logo source safely
  const getLogoSrc = () => {
    if (!mounted) {
      return "/logo.png"; // Default to light logo during SSR
    }
    return theme === 'dark' ? "/logo-dark.png" : "/logo.png";
  };

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Mounted effect for theme
  useEffect(() => {
    setMounted(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
              console.error(t('toasts.errorFetchingRole'));
              setUserRole('user'); // Default to user role on error
            }
          } catch (error) {
            console.error(t('toasts.errorFetchingRole'), error);
            setUserRole('user'); // Default to user role on error
          }

          // Fetch user plan information
          try {
            const planResponse = await fetch('/api/user/plan');
            if (planResponse.ok) {
              const planData = await planResponse.json();
              setUserPlan({
                plan: planData.plan,
                messagesUsedToday: planData.messagesUsedToday,
                dailyLimit: planData.limits.dailyMessages === -1 ? Infinity : planData.limits.dailyMessages,
              });
            }
          } catch (error) {
            console.error(t('toasts.errorFetchingPlan'), error);
            // Default to free plan for authenticated users
            setUserPlan({
              plan: 'FREE',
              messagesUsedToday: 0,
              dailyLimit: 15,
            });
          }
        } else {
          setUserRole('user'); // Default for non-authenticated users
          setUserPlan(null); // No plan for guest users
        }
        
        // Only fetch chat history for authenticated users
        if (currentUser) {
          await loadChatHistory();

          // Check for chatId in URL and load it
          if (initialConversationId) {
            loadChatSession(initialConversationId);
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
    // Enhanced error logging
    if (error instanceof Error) {
      console.error(`Error during ${operation}:`, {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    } else if (error && typeof error === 'object') {
      console.error(`Error during ${operation}:`, {
        errorObject: JSON.stringify(error, null, 2),
        keys: Object.keys(error as object)
      });
    } else {
      console.error(`Error during ${operation}:`, {
        rawError: String(error),
        type: typeof error
      });
    }
    
    // Check if it's a structured API error response
    if (error && typeof error === 'object' && 'message' in error) {
      const apiError = error as { message: string; type?: string; details?: string };
      
      // Show user-friendly message based on error type
      switch (apiError.type) {
        case 'VALIDATION':
          showToast.error(t('toasts.invalidInputTitle'), apiError.message);
          break;
        case 'AUTHENTICATION':
          showToast.authError(apiError.message);
          break;
        case 'AUTHORIZATION':
          showToast.error(t('toasts.accessDeniedTitle'), apiError.message);
          break;
        case 'NOT_FOUND':
          showToast.error(t('toasts.notFoundTitle'), apiError.message);
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
      // Handle cases where error object is malformed or empty
      const errorMessage = error instanceof Error ? error.message : 
                          (error && typeof error === 'string') ? error :
                          `Failed to ${operation}. Please try again.`;
      showToast.error('Error', errorMessage);
    }
  }, [isOnline, t]);

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
    setConversationId(chatId); // Ensure conversationId is also set
    
    try {
      const response = await fetch(`/api/conversations/${chatId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.conversation.messages); // Use setMessages from useChat
        // Update URL without full page reload
        router.push(`/${locale}/chat?id=${chatId}`, { scroll: false });
      } else {
        console.error(t('toasts.errorLoadingSession', { chatId }));
        setActiveChatId(null);
        setConversationId(null); // Also reset conversationId
        router.push(`/${locale}/chat`, { scroll: false }); // Clear URL param
      }
    } catch (error) {
      handleApiError(error, 'load chat session');
      setActiveChatId(null);
      setConversationId(null); // Also reset conversationId
    } finally {
      setIsLoadingMessages(false);
    }
  }, [activeChatId, messages.length, router, handleApiError, setIsLoadingMessages, setActiveChatId, setConversationId, setMessages, t, locale]);

  const handleNewChat = useCallback(async () => {
    setActiveChatId(null);
    setConversationId(null); // Also reset conversationId
    setMessages([]); // Use setMessages from useChat
    setInput(''); // Use setInput from useChat
    setSelectedImage(null);
    setImagePreview(null);
    router.push(`/${locale}/chat`, { scroll: false });
  }, [router, setActiveChatId, setConversationId, setMessages, setInput, setSelectedImage, setImagePreview, locale]);

  const handleDeleteChat = useCallback(async (chatId: string, e: React.MouseEvent) => {
    // Prevent the chat from being selected when delete button is clicked
    e.stopPropagation();
    
    // Find the chat to get its title for the confirmation
    const chatToDelete = chatHistory.find(chat => chat.id === chatId);
    const chatTitle = chatToDelete?.title || `Chat from ${chatToDelete ? new Date(chatToDelete.createdAt).toLocaleDateString() : 'Unknown date'}`;
    
    if (!confirm(t('toasts.deleteConfirmText', { chatTitle }))) {
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
          setConversationId(null); // Also reset conversationId
          setMessages([]); // Use setMessages from useChat
          router.push(`/${locale}/chat`, { scroll: false });
        }
        
        showToast.success(t('toasts.deleteSuccessTitle'), t('toasts.deleteSuccessText'));
      } else {
        console.error('Failed to delete chat');
        showToast.error(t('toasts.deleteErrorTitle'), t('toasts.deleteErrorText'));
      }
    } catch (error) {
      handleApiError(error, 'delete chat');
    }
  }, [chatHistory, activeChatId, router, handleApiError, setChatHistory, setActiveChatId, setConversationId, setMessages, t, locale]);

  const copyMessage = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      showToast.success(t('toasts.copySuccessTitle'), t('toasts.copySuccessText'));
    } catch (error) {
      console.error('Failed to copy message:', error);
      showToast.error(t('toasts.copyErrorTitle'), t('toasts.copyErrorText'));
    }
  }, [t]);

  const toggleSidebar = useCallback(() => setIsSidebarOpen(!isSidebarOpen), [isSidebarOpen, setIsSidebarOpen]);

  // Custom input change handler with character limit
  const customHandleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= 2000) {
      handleInputChange(e); // Use our custom handleInputChange
    }
  }, [handleInputChange]);

  // Image handling functions
  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast.error(t('toasts.fileTooLargeTitle'), t('toasts.fileTooLargeText'));
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        showToast.error(t('toasts.invalidFileTypeTitle'), t('toasts.invalidFileTypeText'));
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
  }, [setSelectedImage, setImagePreview, t]);

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
          showToast.error(t('toasts.fileTooLargeTitle'), t('toasts.fileTooLargeText'));
          return;
        }
        
        // If there's already an image, ask for confirmation
        if (selectedImage) {
          const confirm = window.confirm(t('toasts.confirmImageReplace'));
          if (!confirm) return;
        }
        
        setSelectedImage(file);
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
        
        showToast.success(t('toasts.imagePastedTitle'), t('toasts.imagePastedText'));
      }
    }
  }, [selectedImage, setSelectedImage, setImagePreview, t]);

  // Custom submit handler to use our sendMessage function
  const onSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!input.trim() && !selectedImage) || isLoading) return;

    // Check if user is a guest and has reached the message limit (4 messages)
    if (!user && guestMessageCount >= 4) {
      setShowLoginDialog(true);
      return;
    }

    // Send the message using our custom function
    await sendMessage(input, selectedImage || undefined);
    
    // Clear image state after submitting
    setSelectedImage(null);
    setImagePreview(null);
  }, [input, selectedImage, isLoading, user, guestMessageCount, setShowLoginDialog, setSelectedImage, setImagePreview, sendMessage]);

  // Add keyboard shortcuts support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Enter to send message
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && (input.trim() || selectedImage) && !isLoading) {
        e.preventDefault();
        onSubmit(e as unknown as React.FormEvent);
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
  }, [input, selectedImage, isLoading, user, isMobile, isSidebarOpen, onSubmit, handleNewChat, setIsSidebarOpen]);

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
            showToast.error(t('toasts.fileTooLargeTitle'), t('toasts.fileTooLargeText'));
            return;
          }
          
          // If there's already an image, ask for confirmation
          if (selectedImage) {
            const confirm = window.confirm(t('toasts.confirmImageReplace'));
            if (!confirm) return;
          }
          
          setSelectedImage(file);
          
          // Create preview
          const reader = new FileReader();
          reader.onload = (e) => {
            setImagePreview(e.target?.result as string);
          };
          reader.readAsDataURL(file);
          
          showToast.success(t('toasts.imagePastedTitle'), t('toasts.imagePastedText'));
          
          // Focus the textarea
          const textarea = document.querySelector('textarea[placeholder*="message"]') as HTMLTextAreaElement;
          textarea?.focus();
        }
      }
    };

    document.addEventListener('paste', handleGlobalPaste);
    return () => document.removeEventListener('paste', handleGlobalPaste);
  }, [selectedImage, setSelectedImage, setImagePreview, t]);

  // Enhanced keyboard shortcuts tooltip
  const [showShortcuts, setShowShortcuts] = reactUseState(false);

  const KeyboardShortcuts = () => (
    <div className="absolute bottom-full left-0 mb-3 glass-input rounded-xl p-4 shadow-xl z-50 min-w-72 animate-scale-in border border-border/50">
      <h4 className="text-sm font-semibold mb-3 text-foreground flex items-center">
        <span className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mr-2"></span>
        {t('keyboardShortcuts.title')}
      </h4>
      <div className="space-y-2 text-xs">
        <div className="flex justify-between items-center py-1">
          <span className="text-muted-foreground">{t('keyboardShortcuts.send')}</span>
          <kbd className="px-2 py-1 bg-muted/60 rounded-md text-xs font-mono border border-border/40">⌘ + Enter</kbd>
        </div>
        <div className="flex justify-between items-center py-1">
          <span className="text-muted-foreground">{t('keyboardShortcuts.newChat')}</span>
          <kbd className="px-2 py-1 bg-muted/60 rounded-md text-xs font-mono border border-border/40">⌘ + N</kbd>
        </div>
        <div className="flex justify-between items-center py-1">
          <span className="text-muted-foreground">{t('keyboardShortcuts.focusInput')}</span>
          <kbd className="px-2 py-1 bg-muted/60 rounded-md text-xs font-mono border border-border/40">⌘ + K</kbd>
        </div>
        <div className="flex justify-between items-center py-1">
          <span className="text-muted-foreground">{t('keyboardShortcuts.pasteImage')}</span>
          <kbd className="px-2 py-1 bg-muted/60 rounded-md text-xs font-mono border border-border/40">⌘ + V</kbd>
        </div>
        <div className="flex justify-between items-center py-1">
          <span className="text-muted-foreground">{t('keyboardShortcuts.closeSidebar')}</span>
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
        message={t('loading.pageTitle')} 
        description={t('loading.pageDescription')}
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
              <Link href={`/${locale}`} className="block hover:opacity-80 transition-all duration-200 hover-lift">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                    <Image 
                      src="/logo.png" 
                      alt="HypertroQ Logo" 
                      width={32}
                      height={32}
                      className="w-8 h-8 object-contain"
                    />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{t('sidebar.header')}</h2>
                    <p className="text-xs text-muted-foreground">{t('sidebar.subheader')}</p>
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
                {t('sidebar.newChat')}
              </Button>

              {/* Admin Navigation - Only for Admins */}
              {user && userRole === 'admin' && (
                <>
                  <div className="pt-3 border-t border-border/30">
                    <p className="text-xs font-semibold text-muted-foreground mb-3 px-1">{t('sidebar.adminTools')}</p>
                    <div className="space-y-2">
                      <Link href={`/${locale}/admin/knowledge`} passHref>
                        <Button variant="ghost" className="w-full justify-start h-10 hover:bg-muted/50 hover-lift text-left">
                          <Database className="mr-3 h-4 w-4" />
                          {t('sidebar.knowledgeBase')}
                        </Button>
                      </Link>

                      <Link href={`/${locale}/admin/settings`} passHref>
                        <Button variant="ghost" className="w-full justify-start h-10 hover:bg-muted/50 hover-lift text-left">
                          <Settings className="mr-3 h-4 w-4" />
                          {t('sidebar.aiConfig')}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* Subscription Status Section for authenticated users */}
            {user && userPlan && (
              <div className="pt-3 border-t border-border/30">
                <div className="space-y-3">
                  {/* Plan Badge */}
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('sidebar.plan')}</span>
                    <PlanBadge plan={userPlan.plan} className="px-3 py-1 text-xs" />
                  </div>
                  
                  {/* Message Limit Indicator for Free Users */}
                  {userPlan.plan === 'FREE' && (
                    <>
                      <MessageLimitIndicator
                        messagesUsed={userPlan.messagesUsedToday}
                        dailyLimit={userPlan.dailyLimit}
                        plan={userPlan.plan}
                        className="px-1"
                      />
                      
                      {/* Upgrade Button for Free Users */}
                      <div className="px-1">
                        <UpgradeButton 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          showDialog={true}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
            
            {/* Chat History Section for authenticated users or Login prompt for guests */}
            <div className="flex-1 flex flex-col min-h-0">
              {user ? (
                <>
                  <h3 className="text-sm font-semibold mb-3 text-foreground px-1 flex items-center">
                    {t('sidebar.history')}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {t('sidebar.historyCount', { count: chatHistory.length })}
                    </span>
                  </h3>
                  
                  {/* Chat History List */}
                  <div className="flex-1 overflow-y-auto -mr-2 pr-2 space-y-1">
                    {isLoadingHistory ? (
                      <div className="flex items-center justify-center py-8">
                        <InlineLoading 
                          variant="dots"
                          message={t('loading.history')}
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
                        <p className="text-sm text-muted-foreground">{t('sidebar.noHistory')}</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">{t('sidebar.noHistorySubtext')}</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-sm font-semibold mb-3 text-foreground px-1">
                    {t('sidebar.guestMode')}
                  </h3>
                  
                  {/* Enhanced Login prompt for guest users */}
                  <div className="flex-1 flex flex-col justify-center space-y-5 p-5 glass-input rounded-xl border border-border/50 animate-scale-in">
                    <div className="text-center space-y-3">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <User className="h-7 w-7 text-white" />
                      </div>
                      <h4 className="text-sm font-semibold text-foreground">{t('sidebar.guestPromptTitle')}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {t('sidebar.guestPromptBody')}
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <Button asChild variant="default" size="sm" className="w-full gradient-primary hover-lift text-white font-medium">
                        <Link href={`/${locale}/login`}>
                          <User className="mr-2 h-4 w-4" />
                          {t('sidebar.signIn')}
                        </Link>
                      </Button>
                      
                      <Button asChild variant="outline" size="sm" className="w-full hover-lift border-border/60">
                        <Link href={`/${locale}/signup`}>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          {t('sidebar.createAccount')}
                        </Link>
                      </Button>
                    </div>
                    
                    <div className="text-center pt-3 border-t border-border/50">
                      <p className="text-xs text-muted-foreground">
                        {t('sidebar.messagesRemaining', { count: 4 - guestMessageCount })}
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
                <Link href={`/${locale}/profile`} className="block hover:opacity-80 transition-all duration-200">
                  <div className="flex items-center space-x-3 p-3 rounded-xl glass-input border border-border/50 hover-lift">
                    <Avatar className="h-10 w-10 shadow-md">
                      <AvatarImage 
                        src={user.user_metadata?.avatar_url || user.user_metadata?.picture || "/placeholder-avatar.png"} 
                        alt="User Avatar" 
                      />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm">
                        {user.user_metadata?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {t('sidebar.viewProfile')}
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
                    <AvatarImage 
                      src={user.user_metadata?.avatar_url || user.user_metadata?.picture || "/placeholder-avatar.png"} 
                      alt="User Avatar" 
                    />
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
                  <Link href={`/${locale}/profile`}>
                    <User className="mr-2 h-4 w-4" />
                    <span>{t('userMenu.myProfile')}</span>
                  </Link>
                </DropdownMenuItem>
                {userRole === 'admin' && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href={`/${locale}/admin`}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>{t('userMenu.admin')}</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <div className="px-1 py-1">
                  <div className="flex items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-muted cursor-default">
                    <span>{t('userMenu.language')}</span>
                    <LanguageSwitcher />
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async () => { 
                  try {
                    console.log('Logout action triggered');
                    
                    const supabase = createClient();
                    
                    // Reset local state immediately for immediate UI update
                    setUser(null);
                    setUserRole('user');
                    setChatHistory([]);
                    setMessages([]); // Use setMessages from useChat
                    setActiveChatId(null);
                    setConversationId(null); // Also reset conversationId
                    setGuestMessageCount(0);
                    setSelectedImage(null);
                    setImagePreview(null);
                    
                    // Sign out from Supabase
                    await supabase.auth.signOut();
                    
                    // Redirect to home or chat page
                    router.push(`/${locale}/`);
                    showToast.success(t('toasts.logoutSuccessTitle'), t('toasts.logoutSuccessText'));
                  } catch (error) {
                    console.error('Logout error:', error);
                    showToast.error(t('toasts.logoutErrorTitle'), t('toasts.logoutErrorText'));
                    // If there's an error, we might want to reload the page to ensure clean state
                    window.location.href = `/${locale}/`;
                  }
                }}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t('userMenu.signOut')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="default" size="sm" className="flex-shrink-0 gradient-primary text-white">
              <Link href={`/${locale}/login`}>
                <User className="mr-2 h-4 w-4" />
                {t('userMenu.login')}
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
          {/* Offline warning banner */}
          {!isOnline && (
            <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-l-4 border-orange-500 p-3 mx-3 md:mx-6 mb-4 rounded-r-xl animate-scale-in">
              <div className="flex items-center">
                <div className="flex items-center space-x-2">
                  <span className="text-orange-600 dark:text-orange-400 font-medium text-sm">
                    {t('main.offlineWarning')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Guest user warning banner */}
          {!user && guestMessageCount === 3 && (
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-l-4 border-orange-400 p-3 mx-3 md:mx-6 rounded-r-xl animate-scale-in">
              <div className="flex items-center">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                  <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                    {t('main.guestMessageWarning')}
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
                  message={t('loading.messages')}
                />
              </div>
            )}
            
            {!isLoadingMessages && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6 animate-scale-in px-2 md:px-4">
                <div className="relative">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-2xl flex items-center justify-center">
                    <Image 
                      src="/logo.png" 
                      alt="HypertroQ AI" 
                      width={56}
                      height={56}
                      className="w-12 h-12 md:w-14 md:h-14 object-contain"
                    />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">AI</span>
                  </div>
                </div>
                <div className="space-y-3 w-full">
                  <h3 className="text-lg md:text-2xl font-semibold text-foreground">{t('main.startNewConversation')}</h3>
                  <p className="text-muted-foreground max-w-sm md:max-w-md leading-relaxed mx-auto">
                    {t('main.askAnything')}
                  </p>
                </div>
                
                {/* Enhanced Example prompt buttons for mobile */}
                <div className="flex flex-wrap gap-2 justify-center w-full max-w-xs md:max-w-2xl mt-6">
                  {[
                    t('promptRecommendations.bestRepRange'),
                    t('promptRecommendations.weeklyTraining'), 
                    t('promptRecommendations.supplementRecommendations')
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
                      <AvatarImage 
                        src={user?.user_metadata?.avatar_url || user?.user_metadata?.picture || "/placeholder-avatar.png"} 
                        alt="User Avatar" 
                      />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-xs md:text-sm">
                        {user?.user_metadata?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'G'}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 border-2 border-border/50 flex items-center justify-center overflow-hidden shadow-md hover-lift">
                      <Image 
                        src={getLogoSrc()} 
                        alt="HyperTroQ AI" 
                        width={28}
                        height={28}
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
                            role={msg.role as 'user' | 'assistant'}
                            imageData={(msg as unknown as { imageData?: string }).imageData}
                            imageMimeType={(msg as unknown as { imageMimeType?: string }).imageMimeType}
                          />
                          
                          {/* Article Links at bottom of message bubble */}
                          {articleLinks && (
                            <ArticleLinks 
                              links={articleLinks} 
                              messageRole={msg.role as 'user' | 'assistant'}
                            />
                          )}
                        </div>
                      );
                    })()}

                    {/* Copy button */}
                    <div className={`absolute top-1/2 -translate-y-1/2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${msg.role === 'user' ? '-left-10 md:-left-12' : '-right-10 md:-right-12'}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => copyMessage(msg.content)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="group flex items-start space-x-3 md:space-x-4 animate-fade-in">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 border-2 border-border/50 flex items-center justify-center overflow-hidden shadow-md hover-lift">
                    <Image 
                      src={getLogoSrc()} 
                      alt="HyperTroQ AI" 
                      width={28}
                      height={28}
                      className="h-5 w-5 md:h-7 md:w-7 object-contain"
                    />
                  </div>
                </div>
                <div className="flex-1 max-w-[85%] md:max-w-[75%]">
                  <div className="px-3 md:px-5 py-2.5 md:py-4 chat-bubble-ai">
                    <InlineLoading 
                      variant="dots"
                      message={t('main.aiThinking')}
                    />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Enhanced Chat Input Area */}
        <div className="absolute bottom-0 left-0 right-0 p-2 md:p-4 bg-background/80 backdrop-blur-sm border-t border-border/30">
          <div className="w-full max-w-5xl mx-auto">
            <form onSubmit={onSubmit} className="relative">
              {/* Image Preview */}
              {imagePreview && (
                <div className="absolute bottom-full left-0 mb-2 p-1.5 bg-muted rounded-xl shadow-lg border border-border/50 animate-scale-in">
                  <Image src={imagePreview} alt={t('main.imagePreviewAlt')} width={72} height={72} className="rounded-lg" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80 shadow-md"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {/* Keyboard Shortcuts Tooltip */}
              {showShortcuts && <KeyboardShortcuts />}
              
              <div className="relative flex items-center">
                <ArabicAwareTextarea
                  value={input}
                  onChange={customHandleInputChange}
                  onPaste={handlePaste}
                  placeholder={t('main.inputPlaceholder')}
                  className="w-full pr-24 pl-12 py-3 text-base rounded-2xl glass-input resize-none"
                  rows={1}
                  maxLength={2000}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center">
                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-muted/50" onClick={() => document.getElementById('image-upload')?.click()}>
                    <ImageIcon className="h-5 w-5" />
                  </Button>
                  <input type="file" id="image-upload" accept="image/*" className="hidden" onChange={handleImageSelect} />
                </div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                  <Button type="submit" size="icon" className="h-9 w-9 rounded-xl gradient-primary text-white shadow-lg hover-lift" disabled={isLoading || (!input.trim() && !selectedImage)}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </Button>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-2 flex justify-between items-center px-2">
                <button 
                  type="button" 
                  className="hover:text-primary transition-colors flex items-center space-x-1"
                  onMouseEnter={() => setShowShortcuts(true)}
                  onMouseLeave={() => setShowShortcuts(false)}
                >
                  <span>⌘+Enter</span>
                </button>
                <span className={`${input.length > 1800 ? 'text-orange-500' : ''}`}>{input.length}/2000</span>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Suspense fallback={null}>
        <LoginPromptDialog 
          open={showLoginDialog} 
          onOpenChange={setShowLoginDialog} 
          variant={!user && guestMessageCount >= 4 ? 'messageLimit' : 'initial'}
        />
      </Suspense>
    </div>
  );
};

export default ChatPage;
