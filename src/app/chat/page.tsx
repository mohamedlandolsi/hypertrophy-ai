'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState as reactUseState } from 'react'; // Renamed to avoid conflict
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// Updated lucide-react imports
import { Settings, MessageSquare, Send, ChevronLeft, Menu, User, LogOut, Database, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { Suspense } from 'react';

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
  const [isAiThinking, setIsAiThinking] = reactUseState(false);
  const [messages, setMessages] = reactUseState<Message[]>([]);
  const [input, setInput] = reactUseState('');

  const searchParams = useSearchParams();
  const router = useRouter();  useEffect(() => {
    const fetchInitialData = async () => {
      const supabase = createClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      // For testing, create a mock user if no authentication
      let testUser = currentUser;
      if (!testUser) {        testUser = {
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
      }    };
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);  const loadChatHistory = async () => {
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
      } else {
        console.error('Failed to delete chat');
        alert('Failed to delete chat. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      alert('Failed to delete chat. Please try again.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
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
      console.error('Error sending message:', error);      // Remove the optimistic message on error
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

  return (
    <div className="flex flex-1 bg-background text-foreground">
      {/* Sidebar */}
      <div
        className={`flex flex-col bg-muted/30 border-r border-border transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'w-64 md:w-72' : 'w-0'
        } overflow-hidden`}
      >
        {isSidebarOpen && (
          <div className="p-4 h-full flex flex-col">            {/* Parameters Button */}
            <div className="mb-4">
              <Link href="/parameters" passHref>
                <Button variant="outline" className="w-full justify-start h-10">
                  <Settings className="mr-2 h-4 w-4" />
                  Parameters
                </Button>
              </Link>
            </div>

            {/* Knowledge Base Button */}
            <div className="mb-4">
              <Link href="/knowledge" passHref>
                <Button variant="outline" className="w-full justify-start h-10">
                  <Database className="mr-2 h-4 w-4" />
                  Knowledge Base
                </Button>
              </Link>
            </div>

            <div className="mb-4">
              <Button variant="default" className="w-full justify-start h-10" onClick={handleNewChat}>
                <MessageSquare className="mr-2 h-4 w-4" />
                New Chat
              </Button>
            </div>
            
            {/* Chat History Title */}
            <h2 className="text-base font-semibold mb-2.5 text-foreground px-1">Chat History</h2>
            
            {/* Chat History List */}
            <div className="flex-1 space-y-1.5 overflow-y-auto -mr-2 pr-2">
              {isLoadingHistory ? (
                <p className="text-sm text-muted-foreground text-center pt-10">Loading history...</p>              ) : chatHistory.length > 0 ? (
                chatHistory.map(chat => (
                  <div
                    key={chat.id}
                    className={`group flex items-center w-full h-9 px-2.5 rounded-md hover:bg-muted/50 ${
                      activeChatId === chat.id ? "bg-secondary" : ""
                    }`}
                  >
                    <button
                      className="flex items-center flex-1 min-w-0 text-left"
                      onClick={() => loadChatSession(chat.id)}
                      disabled={isLoadingMessages && activeChatId === chat.id}
                    >
                      <MessageSquare className="mr-2 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                      <span className="truncate text-sm font-normal text-foreground/90">
                        {chat.title || `Chat from ${new Date(chat.createdAt).toLocaleDateString()}`}
                      </span>
                    </button>
                    <button
                      onClick={(e) => handleDeleteChat(chat.id, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded hover:bg-destructive/10"
                      aria-label="Delete chat"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive hover:text-destructive/80" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center pt-10">No chat history.</p>
              )}
            </div>

            {/* Theme Toggle */}
            <div className="mt-auto pt-4 border-t border-border">
              <ThemeToggle />
            </div>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Header */}
        <div className="p-3 border-b border-border flex items-center justify-between h-14 flex-shrink-0">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="mr-2.5"
              aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {isSidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <h1 className="text-lg font-semibold text-foreground">Hypertrophy AI</h1>
          </div>

          {/* User Avatar Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  {/* You can set a dynamic src for AvatarImage e.g., user.imageUrl */}
                  <AvatarImage src="/placeholder-avatar.png" alt="User Avatar" />
                  <AvatarFallback>UA</AvatarFallback> {/* Placeholder initials */}
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
              <DropdownMenuSeparator />              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/knowledge">
                  <Database className="mr-2 h-4 w-4" />
                  <span>Knowledge Base</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/parameters">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Parameter</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
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
        </div>        {/* Chat Messages Area */}
        <div className="flex-1 p-4 md:p-6 space-y-4 overflow-y-auto">
          {isLoadingMessages && <p className="text-center text-muted-foreground">Loading messages...</p>}
          {!isLoadingMessages && messages.length === 0 && (
            <p className="text-center text-muted-foreground">This chat is empty. Send a message to start!</p>
          )}          {messages.map((msg, index) => (
            <div
              key={msg.id || `${msg.role}-${index}`}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] md:max-w-[65%] px-3.5 py-2 shadow-sm rounded-xl ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-muted text-foreground rounded-bl-none'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          
          {/* AI Thinking Indicator */}
          {isAiThinking && (
            <div className="flex justify-start">
              <div className="max-w-[75%] md:max-w-[65%] px-3.5 py-3 shadow-sm rounded-xl bg-muted text-foreground rounded-bl-none">
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
          )}
        </div>

        {/* Message Input Area */}
        <form
          onSubmit={handleSubmit}
          className="border-t border-border p-3 md:p-4 bg-background/80 backdrop-blur-sm flex-shrink-0"
        >
          <div className="flex items-center space-x-2.5 max-w-3xl mx-auto">            <Input
              type="text"
              placeholder="Message AI Coach..."
              className="flex-1 h-11 rounded-lg px-4 text-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0"              value={input}
              onChange={handleInputChange}
              disabled={isSendingMessage || isAiThinking}
            />
            <Button
              type="submit"
              size="icon"
              className="rounded-lg h-11 w-11 bg-primary hover:bg-primary/90 flex-shrink-0"
              aria-label="Send message"
              disabled={isSendingMessage || isAiThinking || !input.trim()}
            >
              <Send className="h-4 w-4 text-primary-foreground" />
            </Button>
          </div>
        </form>
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
