'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, 
  Send, 
  Clock,
  Search
} from 'lucide-react';
import { FitnessLoading } from '@/components/ui/loading';

interface CoachChat {
  id: string;
  userId: string;
  userName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  unreadCount: number;
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    isFromUser: boolean;
  } | null;
}

interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  isRead: boolean;
}

interface ChatMessagesResponse {
  messages: ChatMessage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function CoachInboxPage() {
  const searchParams = useSearchParams();
  const selectedChatId = searchParams.get('chat');
  
  const [chats, setChats] = useState<CoachChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<CoachChat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/user/role');
        if (response.ok) {
          const data = await response.json();
          if (data.user && data.user.id) {
            setCurrentUser({ id: data.user.id });
          } else {
            console.error('User data not found in response:', data);
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, []);

  // Fetch coach chats
  const fetchChats = async () => {
    try {
      const response = await fetch('/api/coach-inbox/chats');
      if (response.ok) {
        const data = await response.json();
        setChats(data.chats);
        
        // If there's a selected chat ID from URL, find and select it
        if (selectedChatId) {
          const chat = data.chats.find((c: CoachChat) => c.id === selectedChatId);
          if (chat) {
            setSelectedChat(chat);
          }
        }
      } else {
        console.error('Failed to fetch chats');
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for selected chat
  const fetchMessages = async (chatId: string) => {
    setMessagesLoading(true);
    try {
      const response = await fetch(`/api/coach-chat/${chatId}/messages`);
      if (response.ok) {
        const data: ChatMessagesResponse = await response.json();
        setMessages(data.messages);
        
        // Mark messages as read
        await fetch('/api/coach-inbox/mark-read', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ coachChatId: chatId })
        });
        
        // Update the chat's unread count locally
        setChats(prev => prev.map(chat => 
          chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
        ));
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  // Send new message
  const sendMessage = async () => {
    if (!selectedChat || !newMessage.trim() || sendingMessage) return;
    
    setSendingMessage(true);
    try {
      const response = await fetch('/api/coach-chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coachChatId: selectedChat.id,
          content: newMessage.trim()
        })
      });
      
      if (response.ok) {
        setNewMessage('');
        // Refresh messages
        await fetchMessages(selectedChat.id);
        // Refresh chats to update last message
        await fetchChats();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
    }
  }, [selectedChat]);

  const filteredChats = chats.filter(chat =>
    chat.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (date: string) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <FitnessLoading />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-background p-4">
        <div className="flex items-center gap-4">
          <MessageCircle className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Coach Inbox</h1>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Chat List Sidebar */}
        <div className="w-1/3 border-r flex flex-col">
          {/* Search */}
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Chat List */}
          <ScrollArea className="flex-1">
            {filteredChats.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No conversations found
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredChats.map((chat) => (
                  <Card
                    key={chat.id}
                    className={`cursor-pointer transition-colors hover:bg-accent ${
                      selectedChat?.id === chat.id ? 'bg-accent' : ''
                    }`}
                    onClick={() => setSelectedChat(chat)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {chat.userName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">{chat.userName}</p>
                            {chat.unreadCount > 0 && (
                              <Badge variant="destructive" className="ml-2">
                                {chat.unreadCount}
                              </Badge>
                            )}
                          </div>
                          {chat.lastMessage && (
                            <p className="text-sm text-muted-foreground truncate">
                              {chat.lastMessage.content}
                            </p>
                          )}
                          <div className="flex items-center text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDate(chat.updatedAt)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="border-b p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {selectedChat.userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold">{selectedChat.userName}</h2>
                    <p className="text-sm text-muted-foreground">
                      Status: {selectedChat.status}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {messagesLoading ? (
                  <div className="flex justify-center">
                    <FitnessLoading />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.senderId === currentUser?.id ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            message.senderId === currentUser?.id
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
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 min-h-[40px] max-h-[120px]"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
