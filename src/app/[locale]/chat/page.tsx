'use client';

import React from 'react';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState as reactUseState, useRef, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, MessageSquare, Send, ChevronLeft, Menu, User, LogOut, Database, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from '@/components/theme-toggle';
import { useTheme } from 'next-themes';
import { showToast } from '@/lib/toast';
import { InlineLoading, FullPageLoading } from '@/components/ui/loading';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { Suspense } from 'react';
import { ArabicAwareTextarea } from '@/components/arabic-aware-textarea';
import LanguageSwitcher from '@/components/language-switcher';
import { useTranslations, useLocale } from 'next-intl';

// Performance optimizations
import { useApiCache } from '@/hooks/use-smart-cache';
import { useOptimizedChatHistory, useOptimizedUserPlan, useOptimizedUserRole } from '@/hooks/use-optimized-fetch';
import { OptimizedMessage } from '@/components/optimized-message';
import { OptimizedImage } from '@/components/optimized-image';

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { LoginPromptDialog } from '@/components/login-prompt-dialog';
import { MessageLimitIndicator } from '@/components/message-limit-indicator';
import { PlanBadge } from '@/components/plan-badge';
import { UpgradeButton } from '@/components/upgrade-button';
import { useOnlineStatus } from '@/hooks/use-online-status';

const ChatPage = () => {
  const t = useTranslations('ChatPage');
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get conversation ID from URL parameters - supports both /chat/[id] and /chat?id=...
  const initialConversationId = Array.isArray(params.id) ? params.id[0] : params.id || searchParams.get('id') || null;
  
  // Performance optimizations
  const cache = useApiCache(30); // 30 items cache
  // Removed debouncing for immediate input response - better typing experience
  
  const [isSidebarOpen, setIsSidebarOpen] = reactUseState(false); // Default closed on mobile
  const [isMobile, setIsMobile] = reactUseState(false);
  const [user, setUser] = reactUseState<SupabaseUser | null>(null); // Using reactUseState
  const [isLoadingHistory, setIsLoadingHistory] = reactUseState(true);
  const [isLoadingMessages, setIsLoadingMessages] = reactUseState(false);
  const [autoScroll, setAutoScroll] = reactUseState(true);
  const [showLoginDialog, setShowLoginDialog] = reactUseState(false);
  const [isInitializing, setIsInitializing] = reactUseState(true);

  // Use optimized hooks for user data - these will cache and reduce API calls
  const { 
    data: userRoleData
  } = useOptimizedUserRole(!!user);
  
  const { 
    data: userPlan,
    refetch: refetchUserPlan
  } = useOptimizedUserPlan(!!user);
  
  const { 
    data: chatHistoryData,
    refetch: refetchChatHistory
  } = useOptimizedChatHistory(1, 10, !!user);

  // Extract data from optimized hooks with useMemo to prevent dependency issues
  const userRole = userRoleData?.role || 'user';
  const chatHistory = useMemo(() => chatHistoryData?.conversations || [], [chatHistoryData?.conversations]);
  const hasMoreChats = chatHistoryData?.pagination?.hasMore || false;

  // Type for chat history items
  type ChatHistoryItem = {
    id: string;
    title?: string;
    createdAt: string;
  };

  const [activeChatId, setActiveChatId] = reactUseState<string | null>(initialConversationId);
  const [conversationId, setConversationId] = reactUseState<string | null>(initialConversationId);

  // Delete chat dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = reactUseState(false);
  const [chatToDelete, setChatToDelete] = reactUseState<{ id: string; title: string } | null>(null);
  const [isDeletingChat, setIsDeletingChat] = reactUseState(false);

  // State for loading more chats
  const [isLoadingMoreChats, setIsLoadingMoreChats] = reactUseState(false);

  // Multi-image upload state
  const [selectedImages, setSelectedImages] = reactUseState<File[]>([]);
  const [imagePreviews, setImagePreviews] = reactUseState<string[]>([]);
  
  // Backward compatibility - keep old single image state for gradual migration
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
    imageData?: string | string[]; // Support both single and multiple images
    imageMimeType?: string | string[]; // Support both single and multiple mime types
    images?: Array<{ // New structured format for multiple images
      data: string;
      mimeType: string;
      name?: string;
    }>;
  }>>([]);
  const [input, setInput] = reactUseState('');
  const [isLoading, setIsLoading] = reactUseState(false);

  // Refs to access current values without causing re-renders
  const userPlanRef = useRef(userPlan);
  const selectedImagesRef = useRef(selectedImages);
  const messagesRef = useRef(messages);
  const refetchUserPlanRef = useRef(refetchUserPlan);
  const refetchChatHistoryRef = useRef(refetchChatHistory);

  // Update refs when values change
  userPlanRef.current = userPlan;
  selectedImagesRef.current = selectedImages;
  messagesRef.current = messages;
  refetchUserPlanRef.current = refetchUserPlan;
  refetchChatHistoryRef.current = refetchChatHistory;

  // Direct input change handler for immediate response - no debouncing for better UX
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= 2000) {
      setInput(value); // Direct, immediate update
    }
  }, [setInput]);

  // Mobile keyboard handling state
  const [isInputFocused, setIsInputFocused] = reactUseState(false);
  const [viewportHeight, setViewportHeight] = reactUseState(0);
  
  // Handle input focus/blur for mobile keyboard management
  const handleInputFocus = useCallback(() => {
    setIsInputFocused(true);
  }, [setIsInputFocused]);

  const handleInputBlur = useCallback(() => {
    setIsInputFocused(false);
  }, [setIsInputFocused]);

  // Track viewport height changes for mobile keyboard detection
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const updateViewportHeight = () => {
      setViewportHeight(window.visualViewport?.height || window.innerHeight);
    };
    
    // Initial height
    updateViewportHeight();
    
    // Listen for viewport changes (mainly for mobile keyboard)
    window.visualViewport?.addEventListener('resize', updateViewportHeight);
    window.addEventListener('resize', updateViewportHeight);
    
    return () => {
      window.visualViewport?.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('resize', updateViewportHeight);
    };
  }, [setViewportHeight]);

  // Calculate if keyboard is visible based on viewport height change
  const isKeyboardVisible = useMemo(() => {
    if (!isMobile || viewportHeight === 0) return false;
    const fullHeight = window.screen.availHeight || window.innerHeight;
    const heightDifference = fullHeight - viewportHeight;
    return heightDifference > 150; // Keyboard is likely visible if viewport shrunk by more than 150px
  }, [isMobile, viewportHeight]);

  // Enhanced mobile keyboard handling with Visual Viewport API
  useEffect(() => {
    if (typeof window === 'undefined' || !isMobile) return;

    const handleViewportChange = () => {
      const viewport = window.visualViewport;
      if (!viewport) return;

      // Calculate actual keyboard height
      const fullHeight = window.screen.availHeight || window.innerHeight;
      const keyboardHeight = Math.max(0, fullHeight - viewport.height);
      const isKeyboardVisible = keyboardHeight > 150; // Threshold for keyboard detection
      
      // Set CSS custom properties for dynamic positioning
      document.documentElement.style.setProperty('--viewport-height', `${viewport.height}px`);
      document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
      document.documentElement.style.setProperty('--keyboard-visible', isKeyboardVisible ? '1' : '0');
      
      // For more precise positioning, set the offset from bottom
      const offsetFromBottom = isKeyboardVisible ? keyboardHeight : 0;
      document.documentElement.style.setProperty('--keyboard-offset', `${offsetFromBottom}px`);
    };

    // Initial setup
    handleViewportChange();
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      return () => {
        window.visualViewport?.removeEventListener('resize', handleViewportChange);
      };
    }
  }, [isMobile]);

  // Custom submit handler - updated for multiple images
  const sendMessage = useCallback(async (messageText: string, imageFiles?: File[]) => {
    const images = imageFiles || selectedImagesRef.current; // Use ref instead of state
    if ((!messageText.trim() && (!images || images.length === 0)) || isLoading) return;

    // Guest users must login to send messages
    if (!user) {
      setShowLoginDialog(true);
      return;
    }

    // Safety guard: If we're sending a second message but don't have a conversationId yet,
    // wait a moment for the state to update
    if (messagesRef.current.length > 0 && !conversationId) { // Use ref instead of state
      console.warn("⚠️ Attempting to send second message without conversationId, waiting...");
      showToast.error(t('toasts.errorSendingMessage'), "Chat not fully initialized. Please wait a moment and try again.");
      return;
    }

    setIsLoading(true);

    try {
      // Convert multiple images to base64
      const imageDataArray: Array<{ data: string; mimeType: string; name?: string }> = [];
      if (images && images.length > 0) {
        for (const file of images) {
          const base64Data = await convertFileToBase64(file);
          imageDataArray.push({
            data: base64Data,
            mimeType: file.type,
            name: file.name
          });
        }
      }

      const userMessage = {
        id: Date.now().toString(),
        role: 'user' as const,
        content: messageText,
        // Backward compatibility
        imageData: imageDataArray.length > 0 ? (imageDataArray.length === 1 ? imageDataArray[0].data : imageDataArray.map(img => img.data)) : undefined,
        imageMimeType: imageDataArray.length > 0 ? (imageDataArray.length === 1 ? imageDataArray[0].mimeType : imageDataArray.map(img => img.mimeType)) : undefined,
        // New structured format
        images: imageDataArray.length > 0 ? imageDataArray : undefined,
      };

      setMessages(prev => [...prev, userMessage]);
      setInput('');
      // Clear selected images after sending
      setSelectedImages([]);
      setImagePreviews([]);

      // Use local variable instead of stale state
      let tempConversationId = conversationId;

      console.log("▶️ Sending message:", messageText);
      console.log("📨 Conversation ID:", tempConversationId);
      console.log("� Images count:", images?.length || 0);

      let body: FormData | string;
      let contentType: string | undefined;

      if (images && images.length > 0) {
        const formData = new FormData();
        formData.append('message', messageText);
        formData.append('conversationId', tempConversationId || '');
        formData.append('isGuest', (!user).toString());
        
        // Append multiple images
        images.forEach((file, index) => {
          formData.append(`image_${index}`, file);
        });
        formData.append('imageCount', images.length.toString());
        
        body = formData;
        console.log("📤 Request Body (FormData):", {
          message: messageText,
          conversationId: tempConversationId || '',
          isGuest: !user,
          imageCount: images.length
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
          // Don't try to read response.text() again - the stream is already consumed
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }

        if (errorPayload.error === 'MESSAGE_LIMIT_REACHED') {
          if (userPlan) {
            // Refetch to get updated limit status
            refetchUserPlan();
          }
          showToast.error(t('toasts.limitReachedTitle'), t('toasts.limitReachedText'));
          return;
        }

        throw new Error(errorPayload.message || errorPayload.error || 'An unknown server error occurred.');
      }

      let responseData;
      try {
        responseData = await response.json();
      } catch (parseError) {
        console.error("❌ JSON parse error:", parseError);
        // Don't try to read response.text() again - the stream is already consumed
        throw new Error(`Invalid JSON from server. Status: ${response.status} ${response.statusText}`);
      }

        // Capture and persist the new conversationId
        if (responseData.conversationId && !conversationId) {
          tempConversationId = responseData.conversationId;
          setConversationId(tempConversationId);
          setActiveChatId(tempConversationId);
          window.history.replaceState(null, '', `/${locale}/chat?id=${tempConversationId}`);
          
          // Refresh chat history to show the new conversation in sidebar
          if (user) {
            refetchChatHistoryRef.current();
          }
        }

        const assistantMessage = {
          id: responseData.assistantMessage?.id || (Date.now() + 1).toString(),
          role: 'assistant' as const,
          content: responseData.content,
        };

        setMessages(prev => [...prev, assistantMessage]);

        if (user && userPlanRef.current && userPlanRef.current.plan === 'FREE') {
          // Refetch user plan to get updated message count
          refetchUserPlanRef.current();
        }    } catch (error) {
      console.error('Chat error:', error);
      showToast.error(t('toasts.errorSendingMessage'), error instanceof Error ? error.message : 'Unexpected error');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [user, conversationId, isLoading, locale, t, refetchUserPlan, setActiveChatId, setConversationId, setImagePreviews, setInput, setIsLoading, setMessages, setSelectedImages, setShowLoginDialog, userPlan]); // Add missing dependencies

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
        
        // The optimized hooks will automatically handle user role, plan, and chat history
        // when user changes, so we don't need to manually fetch them here
        
        // Only load specific chat session if provided
        if (currentUser && initialConversationId) {
          loadChatSession(initialConversationId);
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

  // State for mobile keyboard handling (keeping keyboardHeight for potential future use)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [keyboardHeight, setKeyboardHeight] = reactUseState(0);

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

  // Scroll to bottom when keyboard appears on mobile to keep input visible
  useEffect(() => {
    if (isMobile && isKeyboardVisible && isInputFocused && messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 200); // Small delay to allow keyboard animation
    }
  }, [isMobile, isKeyboardVisible, isInputFocused]);

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

  const loadMoreChats = useCallback(async () => {
    // For now, just refetch - the hook could be extended to support pagination
    setIsLoadingMoreChats(true);
    try {
      await refetchChatHistory();
    } finally {
      setIsLoadingMoreChats(false);
    }
  }, [refetchChatHistory, setIsLoadingMoreChats]);

  const loadChatSession = useCallback(async (chatId: string) => {
    if (activeChatId === chatId && messages.length > 0) return; // Avoid reloading if already active and has messages

    // Clear current messages immediately to show loading state
    setMessages([]);
    setIsLoadingMessages(true);
    setActiveChatId(chatId);
    setConversationId(chatId); // Ensure conversationId is also set
    
    try {
      // Use cache for chat messages to improve performance
      const data = await cache.getCachedResponse(
        `chat-messages-${chatId}`,
        async () => {
          const response = await fetch(`/api/conversations/${chatId}/messages`);
          if (!response.ok) {
            throw new Error(`Failed to load chat: ${response.status} ${response.statusText}`);
          }
          return response.json();
        },
        60000 // 1 minute cache for messages
      ) as { conversation?: { messages: Array<{ id: string; role: 'user' | 'assistant'; content: string; imageData?: string | string[]; imageMimeType?: string | string[]; images?: Array<{ data: string; mimeType: string; name?: string; }>; }> } };
      
      if (data.conversation && data.conversation.messages) {
        setMessages(data.conversation.messages);
        // Update URL without full page reload
        router.push(`/${locale}/chat?id=${chatId}`, { scroll: false });
      } else {
        console.error('Invalid data structure received for chat:', chatId);
        setActiveChatId(null);
        setConversationId(null);
        router.push(`/${locale}/chat`, { scroll: false }); // Clear URL param
      }
    } catch (error) {
      handleApiError(error, 'load chat session');
      setActiveChatId(null);
      setConversationId(null); // Also reset conversationId
    } finally {
      setIsLoadingMessages(false);
    }
  }, [activeChatId, messages.length, router, handleApiError, setIsLoadingMessages, setActiveChatId, setConversationId, setMessages, locale, cache]);

  const handleNewChat = useCallback(async () => {
    setActiveChatId(null);
    setConversationId(null); // Also reset conversationId
    setMessages([]); // Use setMessages from useChat
    setInput(''); // Use setInput from useChat
    // Clear all image states
    setSelectedImages([]);
    setImagePreviews([]);
    setSelectedImage(null);
    setImagePreview(null);
    router.push(`/${locale}/chat`, { scroll: false });
  }, [router, setActiveChatId, setConversationId, setMessages, setInput, setSelectedImages, setImagePreviews, setSelectedImage, setImagePreview, locale]);

  const handleDeleteChat = useCallback(async (chatId: string, e: React.MouseEvent) => {
    // Prevent the chat from being selected when delete button is clicked
    e.stopPropagation();
    
    // Find the chat to get its title for the confirmation
    const chatToDelete = (chatHistory as ChatHistoryItem[]).find((chat) => chat.id === chatId);
    const chatTitle = chatToDelete?.title || `Chat from ${chatToDelete ? new Date(chatToDelete.createdAt).toLocaleDateString() : 'Unknown date'}`;
    
    // Set the chat to delete and open dialog
    setChatToDelete({ id: chatId, title: chatTitle });
    setDeleteDialogOpen(true);
  }, [chatHistory, setChatToDelete, setDeleteDialogOpen]);

  const confirmDeleteChat = useCallback(async () => {
    if (!chatToDelete) return;
    
    setIsDeletingChat(true);
    try {
      const response = await fetch(`/api/conversations/${chatToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh chat history after deletion
        await refetchChatHistory();
        
        // If the deleted chat was active, redirect to new chat
        if (activeChatId === chatToDelete.id) {
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
    } finally {
      setIsDeletingChat(false);
      setDeleteDialogOpen(false);
      setChatToDelete(null);
    }
  }, [chatToDelete, activeChatId, router, handleApiError, refetchChatHistory, setActiveChatId, setConversationId, setMessages, t, locale, setIsDeletingChat, setDeleteDialogOpen, setChatToDelete]);

  const toggleSidebar = useCallback(() => setIsSidebarOpen(!isSidebarOpen), [isSidebarOpen, setIsSidebarOpen]);

  // Use the optimized direct input handler - no separate custom handler needed
  // This eliminates double handling and improves performance

  // Multi-image handling functions
  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles: File[] = [];
    const maxImages = 5; // Limit to 5 images per message
    const maxFileSize = 5 * 1024 * 1024; // 5MB per image

    // Check if adding these files would exceed the limit
    if (selectedImages.length + files.length > maxImages) {
      showToast.error(t('toasts.tooManyImagesTitle'), t('toasts.tooManyImagesText', { max: maxImages }));
      return;
    }

    for (const file of files) {
      // Check file size
      if (file.size > maxFileSize) {
        showToast.error(t('toasts.fileTooLargeTitle'), t('toasts.fileTooLargeText'));
        continue;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        showToast.error(t('toasts.invalidFileTypeTitle'), t('toasts.invalidFileTypeText'));
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Add valid files to the selection
    setSelectedImages(prev => [...prev, ...validFiles]);
    
    // Create previews for new files
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }, [selectedImages.length, setSelectedImages, setImagePreviews, t]);

  const removeImage = useCallback((index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  }, [setSelectedImages, setImagePreviews]);

  const removeAllImages = useCallback(() => {
    setSelectedImages([]);
    setImagePreviews([]);
  }, [setSelectedImages, setImagePreviews]);

  const removeSingleImage = useCallback(() => {
    setSelectedImage(null);
    setImagePreview(null);
  }, [setSelectedImage, setImagePreview]);

  // Handle paste events for multi-image uploads
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboardData = e.clipboardData;
    
    if (clipboardData && clipboardData.files.length > 0) {
      const files = Array.from(clipboardData.files);
      const imageFiles = files.filter(file => file.type.startsWith('image/'));
      
      if (imageFiles.length > 0) {
        e.preventDefault(); // Prevent default paste behavior
        
        const maxImages = 5;
        const maxFileSize = 5 * 1024 * 1024; // 5MB
        
        // Check if adding these files would exceed the limit
        if (selectedImages.length + imageFiles.length > maxImages) {
          showToast.error(t('toasts.tooManyImagesTitle'), t('toasts.tooManyImagesText', { max: maxImages }));
          return;
        }
        
        const validFiles: File[] = [];
        
        for (const file of imageFiles) {
          // Check file size
          if (file.size > maxFileSize) {
            showToast.error(t('toasts.fileTooLargeTitle'), t('toasts.fileTooLargeText'));
            continue;
          }
          validFiles.push(file);
        }
        
        if (validFiles.length === 0) return;
        
        // Add valid files to the selection
        setSelectedImages(prev => [...prev, ...validFiles]);
        
        // Create previews for new files
        validFiles.forEach(file => {
          const reader = new FileReader();
          reader.onload = (e) => {
            setImagePreviews(prev => [...prev, e.target?.result as string]);
          };
          reader.readAsDataURL(file);
        });
        
        const message = validFiles.length === 1 
          ? t('toasts.imagePastedText')
          : t('toasts.imagesPastedText', { count: validFiles.length });
        showToast.success(t('toasts.imagePastedTitle'), message);
      }
    }
  }, [selectedImages.length, setSelectedImages, setImagePreviews, t]);

  // Custom submit handler to use our sendMessage function with multi-image support
  const onSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const hasImages = selectedImages.length > 0;
    if ((!input.trim() && !hasImages) || isLoading) return;

    // Guest users must login to send messages
    if (!user) {
      setShowLoginDialog(true);
      return;
    }

    // Send the message using our custom function (which will clear images internally)
    await sendMessage(input, selectedImages.length > 0 ? selectedImages : undefined);
  }, [input, selectedImages, isLoading, user, setShowLoginDialog, sendMessage]);

  // Add keyboard shortcuts support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
  }, [user, isMobile, isSidebarOpen, handleNewChat, setIsSidebarOpen]);

  // Add global paste event listener for multi-image support
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      // Only handle if not already handled by textarea
      const target = e.target as Element;
      if (target?.tagName === 'TEXTAREA') return;
      
      const clipboardData = e.clipboardData;
      
      if (clipboardData && clipboardData.files.length > 0) {
        const files = Array.from(clipboardData.files);
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length > 0) {
          e.preventDefault();
          
          const maxImages = 5;
          const maxFileSize = 5 * 1024 * 1024; // 5MB
          
          // Check if adding these files would exceed the limit
          if (selectedImages.length + imageFiles.length > maxImages) {
            showToast.error(t('toasts.tooManyImagesTitle'), t('toasts.tooManyImagesText', { max: maxImages }));
            return;
          }
          
          const validFiles: File[] = [];
          
          for (const file of imageFiles) {
            // Check file size
            if (file.size > maxFileSize) {
              showToast.error(t('toasts.fileTooLargeTitle'), t('toasts.fileTooLargeText'));
              continue;
            }
            validFiles.push(file);
          }
          
          if (validFiles.length === 0) return;
          
          // Add valid files to the selection
          setSelectedImages(prev => [...prev, ...validFiles]);
          
          // Create previews for new files
          validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
              setImagePreviews(prev => [...prev, e.target?.result as string]);
            };
            reader.readAsDataURL(file);
          });
          
          const message = validFiles.length === 1 
            ? t('toasts.imagePastedText')
            : t('toasts.imagesPastedText', { count: validFiles.length });
          showToast.success(t('toasts.imagePastedTitle'), message);
          
          // Focus the textarea
          const textarea = document.querySelector('textarea[placeholder*="message"]') as HTMLTextAreaElement;
          textarea?.focus();
        }
      }
    };

    document.addEventListener('paste', handleGlobalPaste);
    return () => document.removeEventListener('paste', handleGlobalPaste);
  }, [selectedImages.length, setSelectedImages, setImagePreviews, t]);

  // Add mobile sidebar slide gesture support
  useEffect(() => {
    if (!isMobile) return;

    let startX = 0;
    let startY = 0;
    let isDragging = false;
    let gestureDirection: 'horizontal' | 'vertical' | 'none' = 'none';

    const handleTouchStart = (e: Event) => {
      const touchEvent = e as TouchEvent;
      startX = touchEvent.touches[0].clientX;
      startY = touchEvent.touches[0].clientY;
      isDragging = false;
      gestureDirection = 'none';
    };

    const handleTouchMove = (e: Event) => {
      const touchEvent = e as TouchEvent;
      if (!touchEvent.touches[0]) return;
      
      const currentX = touchEvent.touches[0].clientX;
      const currentY = touchEvent.touches[0].clientY;
      const deltaX = currentX - startX;
      const deltaY = currentY - startY;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);
      
      // Determine gesture direction if not already set
      if (gestureDirection === 'none' && (absDeltaX > 5 || absDeltaY > 5)) {
        gestureDirection = absDeltaX > absDeltaY ? 'horizontal' : 'vertical';
      }
      
      // Only handle horizontal gestures with significant movement
      if (gestureDirection === 'horizontal' && absDeltaX > 30) {
        // Additional checks to ensure this is a deliberate sidebar gesture
        const isValidSidebarGesture = 
          (deltaX > 0 && !isSidebarOpen && startX < 50) || // Right swipe from left edge to open
          (deltaX < 0 && isSidebarOpen); // Left swipe to close when open
        
        if (isValidSidebarGesture) {
          isDragging = true;
          e.preventDefault();
        }
      }
      
      // For vertical gestures or invalid horizontal gestures, allow normal scrolling
    };

    const handleTouchEnd = (e: Event) => {
      const touchEvent = e as TouchEvent;
      if (!isDragging) return;
      
      const endX = touchEvent.changedTouches[0].clientX;
      const deltaX = endX - startX;
      const threshold = 50; // Minimum swipe distance
      
      // Right swipe to open sidebar (when closed)
      if (deltaX > threshold && !isSidebarOpen) {
        setIsSidebarOpen(true);
      }
      // Left swipe to close sidebar (when open)
      else if (deltaX < -threshold && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
      
      isDragging = false;
      gestureDirection = 'none';
    };

    const chatArea = document.querySelector('.message-area');
    if (chatArea) {
      chatArea.addEventListener('touchstart', handleTouchStart, { passive: false });
      chatArea.addEventListener('touchmove', handleTouchMove, { passive: false });
      chatArea.addEventListener('touchend', handleTouchEnd, { passive: false });
      
      return () => {
        chatArea.removeEventListener('touchstart', handleTouchStart);
        chatArea.removeEventListener('touchmove', handleTouchMove);
        chatArea.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isMobile, isSidebarOpen, setIsSidebarOpen]);

  // Enhanced keyboard shortcuts tooltip state
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
          <kbd className="px-2 py-1 bg-muted/60 rounded-md text-xs font-mono border border-border/40">Enter</kbd>
        </div>
        <div className="flex justify-between items-center py-1">
          <span className="text-muted-foreground">{t('keyboardShortcuts.newLine')}</span>
          <kbd className="px-2 py-1 bg-muted/60 rounded-md text-xs font-mono border border-border/40">⇧ + Enter</kbd>
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
    <div className={`flex ${isMobile ? 'mobile-chat-container' : 'h-screen'} bg-background text-foreground overflow-hidden relative animate-fade-in`}>
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
              <div className="pt-3 border-t border-border/30 mb-4">
                <div className="space-y-4">
                  {/* Plan Badge */}
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('sidebar.plan')}</span>
                    <PlanBadge plan={userPlan.plan} className="px-3 py-1 text-xs" />
                  </div>
                  
                  {/* Message Limit Indicator for Free Users */}
                  {userPlan.plan === 'FREE' && (
                    <>
                      <MessageLimitIndicator
                        messagesUsed={userPlan.messagesUsedToday || 0}
                        dailyLimit={userPlan.dailyLimit || 15}
                        plan={userPlan.plan}
                        className="px-1"
                      />
                      
                      {/* Upgrade Button for Free Users */}
                      <div className="px-1 pt-2">
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
            <div className="flex-1 flex flex-col min-h-0 mt-6">
              {user ? (
                <>
                  <h3 className="text-sm font-semibold mb-3 text-foreground px-1 flex items-center mt-4">
                    {t('sidebar.history')}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {t('sidebar.historyCount', { count: chatHistory.length })}
                    </span>
                  </h3>
                  
                  {/* Chat History List */}
                  <div className="flex-1 overflow-y-auto chat-history-scroll -mr-2 pr-2 space-y-1">
                    {isLoadingHistory ? (
                      <div className="flex items-center justify-center py-8">
                        <InlineLoading 
                          variant="dots"
                          message={t('loading.history')}
                        />
                      </div>
                    ) : chatHistory.length > 0 ? (
                      (chatHistory as ChatHistoryItem[]).map(chat => (
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
                    
                    {/* Load More Button */}
                    {hasMoreChats && (
                      <div className="pt-3 border-t border-border/30">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-center h-9 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          onClick={loadMoreChats}
                          disabled={isLoadingMoreChats}
                        >
                          {isLoadingMoreChats ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {t('sidebar.loadingMore')}
                            </>
                          ) : (
                            t('sidebar.loadMore')
                          )}
                        </Button>
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
      <div className={`flex-1 flex flex-col bg-background relative min-w-0 ${isMobile && isSidebarOpen ? 'pointer-events-none' : ''}`}>
        {/* Enhanced Header with Glassmorphism - Sticky on Mobile */}
        <div className={`
          p-3 md:p-4 flex items-center justify-between h-14 md:h-16 flex-shrink-0 glass-header 
          ${isMobile ? 'fixed top-0 left-0 right-0 z-30 bg-background/90 backdrop-blur-md border-b border-border/30' : 'sticky top-0 z-10'}
        `}>
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
                  ((chatHistory as ChatHistoryItem[]).find((chat) => chat.id === activeChatId)?.title || 'Chat') 
                  : 'HypertroQ'
                }
              </h1>
              {!isMobile && activeChatId && (
                <p className="text-xs text-muted-foreground truncate">
                  {(chatHistory as ChatHistoryItem[]).find((chat) => chat.id === activeChatId)?.title || 'Active Chat'}
                </p>
              )}
            </div>
          </div>

          {/* Mobile: New Chat Button + Theme Toggle + User Menu | Desktop: User Menu Only */}
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

            {/* Language Switcher - Always visible next to avatar */}
            <LanguageSwitcher />

            {/* Theme Toggle - Always visible next to avatar */}
            <ThemeToggle />

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
                {user && userRole === 'admin' && (
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
                <DropdownMenuItem onClick={async () => { 
                  try {
                    console.log('Logout action triggered');
                    
                    const supabase = createClient();
                    
                    // Reset local state immediately for immediate UI update
                    setUser(null);
                    setMessages([]); // Use setMessages from useChat
                    setActiveChatId(null);
                    setConversationId(null); // Also reset conversationId
                    // Clear all image states
                    setSelectedImages([]);
                    setImagePreviews([]);
                    setSelectedImage(null);
                    setImagePreview(null);
                    
                    // Clear all caches
                    cache.clear();
                    
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

        {/* Enhanced Chat Messages Area - Account for fixed header on mobile */}
        <div 
          className={`flex-1 overflow-y-auto message-area w-full ${messages.length === 0 ? 'flex items-center justify-center' : ''} ${isMobile ? 'pt-16 mobile-message-area' : ''}`}
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
                      <OptimizedImage 
                        src="/logo.png" 
                        alt="HypertroQ AI" 
                        index={0}
                        className="w-12 h-12 md:w-14 md:h-14 object-contain"
                        priority={true}
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
              <OptimizedMessage
                key={msg.id || `${msg.role}-${index}`}
                message={msg}
                index={index}
                isLast={index === messages.length - 1}
                user={user}
                userRole={userRole}
                getLogoSrc={getLogoSrc}
              />
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

        {/* Enhanced Chat Input Area - Sticky on Mobile */}
        <div 
          className={`
            ${messages.length === 0 ? 'relative' : isMobile ? 'mobile-input-area' : 'absolute left-0 right-0 bottom-0'} 
            ${isMobile && messages.length > 0 ? 'p-2 pt-2 pb-0' : 'p-2 md:p-4'}
            ${messages.length > 0 ? 'bg-background/95 backdrop-blur-lg border-t border-border/30' : ''}
          `}
        >
          <div className="w-full max-w-5xl mx-auto">
            <form onSubmit={onSubmit} className="relative">
              {/* Multi-Image Preview */}
              {selectedImages.length > 0 && (
                <div className="absolute bottom-full left-0 mb-2 p-2 bg-muted rounded-xl shadow-lg border border-border/50 animate-scale-in">
                  <div className="flex flex-wrap gap-2 max-w-md">
                    {selectedImages.map((file, index) => {
                      // Ensure we have a valid preview for this image
                      const previewSrc = imagePreviews[index];
                      if (!previewSrc || previewSrc.trim() === '') {
                        return null; // Skip rendering if no valid preview
                      }
                      
                      return (
                        <OptimizedImage 
                          key={index}
                          src={previewSrc} 
                          alt={`Preview ${index + 1}`} 
                          index={index}
                          onRemove={() => removeImage(index)}
                          className="rounded-lg object-cover w-16 h-16"
                          priority={false}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-border/30">
                    <span className="text-xs text-muted-foreground">
                      {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''} selected
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-6 px-2 text-destructive hover:text-destructive/80"
                      onClick={removeAllImages}
                    >
                      Clear all
                    </Button>
                  </div>
                </div>
              )}

              {/* Legacy Single Image Preview (for backward compatibility) */}
              {selectedImages.length === 0 && imagePreview && imagePreview.trim() !== '' && (
                <div className="absolute bottom-full left-0 mb-2 p-1.5 bg-muted rounded-xl shadow-lg border border-border/50 animate-scale-in">
                  <OptimizedImage 
                    src={imagePreview} 
                    alt={t('main.imagePreviewAlt')} 
                    index={0}
                    onRemove={() => removeSingleImage()}
                    className="rounded-lg w-[72px] h-[72px]"
                    priority={false}
                  />
                </div>
              )}
              
              {/* Keyboard Shortcuts Tooltip */}
              {showShortcuts && <KeyboardShortcuts />}
              
              <div className="relative flex items-center">
                <ArabicAwareTextarea
                  value={input}
                  onChange={handleInputChange}
                  onPaste={handlePaste}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  placeholder={t('main.inputPlaceholder')}
                  className="w-full pr-24 pl-12 py-3 text-base rounded-2xl glass-input resize-none"
                  rows={1}
                  maxLength={2000}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center">
                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-muted/50" onClick={() => document.getElementById('image-upload')?.click()}>
                    <ImageIcon className="h-5 w-5" />
                  </Button>
                  <input 
                    type="file" 
                    id="image-upload" 
                    accept="image/*" 
                    multiple 
                    className="hidden" 
                    onChange={handleImageSelect} 
                  />
                </div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                  <Button 
                    type="submit" 
                    size="icon" 
                    className="h-9 w-9 rounded-xl gradient-primary text-white shadow-lg hover-lift" 
                    disabled={isLoading || (!input.trim() && selectedImages.length === 0 && !selectedImage)}
                  >
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
                  <span>Enter to send • Shift+Enter for new line</span>
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
          variant='initial'
        />
      </Suspense>

      {/* Delete Chat Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              {t('dialogs.deleteChat.title')}
            </DialogTitle>
            <DialogDescription>
              {t('dialogs.deleteChat.description')}
            </DialogDescription>
          </DialogHeader>

          {chatToDelete && (
            <div className="py-4">
              <div className="p-3 bg-muted/50 rounded-lg border border-border/50">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {chatToDelete.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('dialogs.deleteChat.chatPreview')}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-destructive rounded-full mt-2 flex-shrink-0"></div>
                  <div className="text-sm text-destructive-foreground">
                    <p className="font-medium mb-1">{t('dialogs.deleteChat.warningTitle')}</p>
                    <ul className="text-xs space-y-1 text-destructive-foreground/80">
                      <li>• {t('dialogs.deleteChat.warning1')}</li>
                      <li>• {t('dialogs.deleteChat.warning2')}</li>
                      <li>• {t('dialogs.deleteChat.warning3')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setChatToDelete(null);
              }}
              disabled={isDeletingChat}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteChat}
              disabled={isDeletingChat}
            >
              {isDeletingChat ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('dialogs.deleteChat.deleting')}
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('dialogs.deleteChat.confirm')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatPage;
