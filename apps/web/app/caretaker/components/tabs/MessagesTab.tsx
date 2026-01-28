import React, { useState, useEffect, useRef } from 'react';
import { Patient } from '../../types';
import { MessageSquare, Send, Phone, PhoneCall, User, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';

interface Message {
  _id: string;
  senderId: {
    _id: string;
    fullName: string;
    profilePicture?: string;
  };
  receiverId: {
    _id: string;
    fullName: string;
    profilePicture?: string;
  };
  patientId?: {
    _id: string;
    fullName: string;
  };
  content: string;
  type: 'text' | 'call' | 'system';
  read: boolean;
  metadata?: {
    callDuration?: number;
    callType?: 'incoming' | 'outgoing' | 'missed';
  };
  createdAt: string;
}

interface MessagesTabProps {
  patient: Patient;
}

const MessagesTab: React.FC<MessagesTabProps> = ({ patient }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getApiBaseUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  };

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${getApiBaseUrl()}/api/messages/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setConversations(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (otherUserId: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${getApiBaseUrl()}/api/messages/conversation?otherUserId=${otherUserId}&patientId=${patient.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setMessages(result.data);
          setInitialLoad(false);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setInitialLoad(false);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${getApiBaseUrl()}/api/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: selectedConversation,
          patientId: patient.id,
          content: newMessage.trim(),
          type: 'text'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setMessages(prev => [...prev, result.data]);
          setNewMessage('');
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startCall = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${getApiBaseUrl()}/api/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: selectedConversation,
          patientId: patient.id,
          content: 'Voice call initiated',
          type: 'call',
          metadata: {
            callType: 'outgoing',
            callDuration: 0
          }
        }),
      });

      if (response.ok) {
        // In a real app, you would integrate with a WebRTC service
        alert('Call functionality would be integrated here with WebRTC');
      }
    } catch (error) {
      console.error('Error initiating call:', error);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const prevMessagesCount = useRef(messages.length);
  
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
      
      // Refresh messages every 30 seconds when tab is visible
      const interval = setInterval(() => {
        if (!document.hidden) {
          fetchMessages(selectedConversation);
        }
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [selectedConversation, patient.id]);

  // Combined scroll effect handler
  useEffect(() => {
    if (messages.length !== prevMessagesCount.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: messages.length > prevMessagesCount.current ? 'smooth' : 'auto'
        });
      }, 100);
      prevMessagesCount.current = messages.length;
    }
  }, [messages]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getConversationUser = (conversation: any) => {
    return conversation.user;
  };

  if (!selectedConversation) {
    return (
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Messages</h3>
        <div className="space-y-4">
          {conversations.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No conversations yet</p>
              <p className="text-sm">Start a conversation with a doctor</p>
            </div>
          ) : (
            conversations.map((conversation) => {
              const user = getConversationUser(conversation);
              return (
                <div
                  key={conversation._id}
                  className="flex items-center p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedConversation(user._id)}
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 ml-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {user.fullName}
                      </h4>
                      <span className="text-xs text-gray-500">
                        {formatTime(conversation.lastMessageTime)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.lastMessage}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                        {conversation.unreadCount} unread
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  const selectedUser = conversations.find(c => getConversationUser(c)._id === selectedConversation);
  const currentUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}') : null;

  return (
    <div className="flex flex-col h-full">
      {/* Conversation Header */}
      <div className="flex items-center p-4 bg-white border-b border-gray-200">
        <button
          onClick={() => {
            setSelectedConversation(null);
            setInitialLoad(true);
            setMessages([]);
          }}
          className="mr-3 p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600" />
          </div>
        </div>
        <div className="flex-1 min-w-0 ml-3">
          <h3 className="text-sm font-medium text-gray-900">
            {selectedUser?.user?.fullName}
          </h3>
          <p className="text-xs text-gray-500">
            Patient: {patient.fullName}
          </p>
        </div>
        <button
          onClick={startCall}
          className="ml-3 p-2 bg-green-600 hover:bg-green-700 text-white rounded-full transition-colors"
          title="Start call"
        >
          <PhoneCall className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {initialLoad ? (
          <div className="text-center text-gray-500 py-8">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300 animate-pulse" />
            <p className="animate-pulse">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.senderId._id === currentUser?.userId;
            return (
              <div
                key={message._id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isOwnMessage
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {formatTime(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        {loading && messages.length > 0 && (
          <div className="text-center p-2 text-sm text-gray-500">
            <div className="inline-flex items-center space-x-2">
              <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse animation-delay-200"></div>
              <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse animation-delay-400"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={1}
              disabled={isComposing}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || isComposing}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessagesTab;