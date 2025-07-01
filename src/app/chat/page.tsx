'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState as reactUseState, useRef } from 'react'; // Added useRef
import { Button } from '@/components/ui/button';
// Updated lucide-react imports
import { Settings, MessageSquare, Send, ChevronLeft, Menu, User, LogOut, Database, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { showToast } from '@/lib/toast';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { Suspense } from 'react';
import { MessageContent } from '@/components/message-content';
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
  AvatarImage,
} from "@/components/ui/avatar";
import { signOut } from '../actions'; // Import the server action
import { useSearchParams, useRouter } from 'next/navigation';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  lastMessage?: string;
  messageCount?: number;
}

const ChatPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = reactUseState(true);
  const [user, setUser] = reactUseState<SupabaseUser | null>(null); // Using reactUseState
  const [chatHistory, setChatHistory] = reactUseState<Conversation[]>([]);
  const [activeChatId, setActiveChatId] = reactUseState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = reactUseState(true);
  const [isLoadingMessages, setIsLoadingMessages] = reactUseState(false);  const [isSendingMessage, setIsSendingMessage] = reactUseState(false);
  const [isAiThinking, setIsAiThinking] = reactUseState(false);  const [messages, setMessages] = reactUseState<Message[]>([]);  const [input, setInput] = reactUseState('');
  const [autoScroll, setAutoScroll] = reactUseState(true);

  const searchParams = useSearchParams();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);useEffect(() => {
    const fetchInitialData = async () => {
      const supabase = createClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      // For testing, create a mock user if no authentication
      let testUser = currentUser;
      if (!testUser) {
        testUser = {
          id: 'test-user-123',
          email: 'test@example.com',
          user_metadata: { full_name: 'Test User' },
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString()
        } as SupabaseUser;
      }
      
      setUser(testUser);
      // Fetch chat history
      await loadChatHistory();

      // Check for chatId in URL and load it
      const chatIdFromUrl = searchParams.get('id');
      if (chatIdFromUrl) {
        loadChatSession(chatIdFromUrl);
      }
    };
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll to bottom when new messages arrive
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
  };const loadChatHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        setChatHistory(data.conversations);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const loadChatSession = async (chatId: string) => {
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
      console.error('Error loading chat session:', error);
      setActiveChatId(null);    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleNewChat = async () => {
    setActiveChatId(null);
    setMessages([]);
    router.push('/chat', { scroll: false });
  };
  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
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
      console.error('Error deleting chat:', error);
      showToast.networkError('delete chat');
    }
  };  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= 2000) {
      setInput(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isSendingMessage) return;

    const userMessage = input.trim();
    setInput('');
    setIsSendingMessage(true);    // Optimistically add user message
    const tempUserMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMessage]);
    setIsAiThinking(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: activeChatId,
          message: userMessage,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
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
      console.error('Error sending message:', error);
      
      // Show error toast
      showToast.error('Failed to send message', 'Please check your connection and try again');
      
      // Remove the optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempUserMessage.id));
      setInput(userMessage); // Restore the input
    } finally {
      setIsSendingMessage(false);
      setIsAiThinking(false);
    }
  };
  
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  if (!user) {
    return <div className="flex flex-1 items-center justify-center bg-background text-foreground">Loading user data or redirecting...</div>; // Or a loading spinner
  }

  return (    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <div
        className={`flex flex-col bg-muted/20 border-r border-border transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'w-64 md:w-72' : 'w-0'
        } overflow-hidden shadow-sm`}
      >
        {isSidebarOpen && (
          <div className="p-4 h-full flex flex-col">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-lg font-bold text-foreground mb-1">Hypertrophy AI</h2>
              <p className="text-xs text-muted-foreground">Your AI fitness coach</p>
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
            </div>
            
            {/* Chat History Section */}
            <div className="flex-1 flex flex-col min-h-0">
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
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm">Loading...</span>
                    </div>
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
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-border space-y-2">
              <ThemeToggle />
              <div className="text-xs text-muted-foreground text-center">
                Hypertrophy AI v1.0
              </div>
            </div>
          </div>
        )}
      </div>{/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-background relative">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between h-16 flex-shrink-0 bg-background/95 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="mr-3 hover:bg-muted/50"
              aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {isSidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-foreground">Hypertrophy AI</h1>
              {activeChatId && (
                <p className="text-xs text-muted-foreground">
                  {chatHistory.find(chat => chat.id === activeChatId)?.title || 'Active Chat'}
                </p>
              )}
            </div>
          </div>

          {/* User Avatar Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-muted/50">
                <Avatar className="h-10 w-10">
                  {/* You can set a dynamic src for AvatarImage e.g., user.imageUrl */}
                  <AvatarImage src="/placeholder-avatar.png" alt="User Avatar" />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user.user_metadata?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  {/* Replace with dynamic user data */}
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
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={async () => { 
                console.log('Logout action triggered'); 
                await signOut();
              }}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Chat Messages Area */}
        <div 
          className="flex-1 overflow-y-auto pb-32"
          onScroll={handleScroll}
        >
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            {isLoadingMessages && (
              <div className="flex justify-center items-center h-32">
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading messages...</span>
                </div>
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
                className={`flex items-start space-x-3 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {msg.role === 'user' ? (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder-avatar.png" alt="User" />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {user.user_metadata?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">AI</span>
                    </div>
                  )}
                </div>                {/* Message Content */}
                <div className={`flex-1 max-w-[80%] ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
                  <div
                    className={`px-4 py-3 rounded-2xl shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted text-foreground rounded-bl-md border'
                    }`}
                  >
                    <MessageContent content={msg.content} role={msg.role} />
                    {msg.createdAt && (
                      <p className={`text-xs mt-2 opacity-70 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
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
          <form onSubmit={handleSubmit} className="p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-end space-x-3">                <div className="flex-1 relative">
                  <ArabicAwareTextarea
                    placeholder="Message AI Coach..."
                    className="w-full rounded-2xl px-4 pr-12 text-sm border-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 focus-visible:border-primary/50"
                    value={input}
                    onChange={handleInputChange}
                    disabled={isSendingMessage || isAiThinking}
                    maxLength={2000}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                  />
                  {!autoScroll && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-14 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted/50"
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
                <Button
                  type="submit"
                  size="icon"
                  className="rounded-full h-12 w-12 bg-primary hover:bg-primary/90 flex-shrink-0 shadow-lg transition-all duration-200 hover:scale-105"
                  aria-label="Send message"
                  disabled={isSendingMessage || isAiThinking || !input.trim()}
                >
                  {isSendingMessage ? (
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="h-5 w-5 text-primary-foreground" />
                  )}
                </Button>
              </div>
              
              {/* Input helper text */}
              <div className="flex items-center justify-between mt-2 px-1">
                <p className="text-xs text-muted-foreground">
                  Press Enter to send, Shift+Enter for new line
                </p>
                <p className="text-xs text-muted-foreground">
                  {input.length}/2000
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default function ChatPageWrapper() {
  return (
    <Suspense fallback={<div className="flex flex-1 items-center justify-center">Loading...</div>}>
      <ChatPage />
    </Suspense>
  );
}
