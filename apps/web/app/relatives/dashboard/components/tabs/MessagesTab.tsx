// relative/dashboard/components/tabs/MessagesTab.tsx - FIXED VERSION
import React, { useEffect, useState, useRef } from 'react';
import { PatientInfo, User } from '../../types';
import { Send, Loader2, MessageCircle, AlertCircle } from 'lucide-react';

interface Message {
  _id?: string;
  senderId: string | { _id: string; fullName?: string };
  receiverId: string | { _id: string; fullName?: string };
  content: string;
  createdAt?: string;
  read?: boolean;
  patientId?: string;
}

interface MessagesTabProps {
  patientData: PatientInfo | null;
  user: User;
  message: string;
  sendingMessage: boolean;
  onMessageChange: (message: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
}

export function MessagesTab({
  patientData,
  user,
  message,
  sendingMessage,
  onMessageChange,
  onSendMessage
}: MessagesTabProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Extract current user ID from token
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const base64 = tokenParts[1];
          if (base64) {
            const payload = JSON.parse(atob(base64));
            setCurrentUserId(payload?.userId || payload?.id || null);
            console.log('👤 Current user ID:', payload?.userId || payload?.id);
          }
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, []);

  // Debug logging
  useEffect(() => {
    console.log('📊 MessagesTab State:', {
      monitoredPatient: user?.monitoredPatient,
      patientId: patientData?.id,
      currentUserId,
      messageLength: message.length,
      sendingMessage
    });
  }, [user?.monitoredPatient, patientData?.id, currentUserId, message, sendingMessage])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch conversation with the patient
  const fetchConversation = async () => {
    // Use the ID we know exists from your logs
    const targetId = user?.monitoredPatient || patientData?.id;

    if (!targetId) return;

    const token = localStorage.getItem('token');
    const pId = patientData?.id;

    if (!pId || !token) return;

    try {
      setIsLoadingMessages(true);

      // We'll use the patientId specifically as it's the most reliable link 
      // between the Relative's messages and the Patient's record
      const endpoint = `${API_URL}/api/messages/conversation?patientId=${patientData?.id}`;

      console.log('🌐 Polling for messages using Patient ID:', patientData?.id);

      const res = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache' // Prevent browser caching
        },
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Handle different possible API response structures
        const messageData = data.data || data;
        if (Array.isArray(messageData)) {
          console.log('✅ Messages received:', messageData.length);
          setMessages(messageData);
          setError(null);
        }
      } else {
        console.error('❌ Fetch failed:', data.message);
      }
    } catch (err) {
      console.error('❌ Error fetching messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Handle sending message - now using the parent's onSendMessage
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear any previous errors
    setError(null);

    // Use the prop 'message' directly to validate
    if (!message || !message.trim()) {
      setError('Please enter a message');
      return;
    }

    // Validate patient selection
    const targetId = user?.monitoredPatient || patientData?.id;

    if (!targetId) {
      setError('No patient selected');
      return;
    }

    // Pass control to the parent handler
    onSendMessage(e);
  };

  // Handle key press for sending
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };


  // Handle textarea change
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onMessageChange(e.target.value);
  };

  // Fetch messages when component mounts and when patient changes
  useEffect(() => {
    if (user?.monitoredPatient || patientData?.id) {
      fetchConversation();
    }
  }, [user?.monitoredPatient, patientData?.id]);

  // Set up polling for new messages (every 5 seconds)
  useEffect(() => {
    const targetId = user?.monitoredPatient || patientData?.id;
    if (!targetId) return;

    const interval = setInterval(() => {
      fetchConversation();
    }, 5000);

    return () => clearInterval(interval);
  }, [user?.monitoredPatient, patientData?.id]);

  // Determine if message is from current user
  const isFromCurrentUser = (msg: Message) => {
    if (!currentUserId) return false;

    // Extract ID from object if senderId is populated, otherwise use string
    const senderId = typeof msg.senderId === 'object'
      ? (msg.senderId as any)?._id || (msg.senderId as any)?.id
      : msg.senderId;

    return String(senderId) === String(currentUserId);
  };

  // Check if send button should be enabled
  const isSendEnabled = !sendingMessage &&
    message.trim().length > 0 &&
    (user?.monitoredPatient || patientData?.id);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Conversation View */}
      <div className="lg:col-span-2 order-1">
        <div className="bg-white shadow rounded-lg overflow-hidden flex flex-col" style={{ height: '600px' }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 sm:px-6 py-4 border-b border-blue-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  Conversation with {patientData?.name || 'Patient'}
                </h3>
                <p className="text-xs text-blue-100">
                  {user.relationship ? `You (${user.relationship})` : 'Relative'}
                </p>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 px-4 py-3 mx-4 mt-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 bg-gray-50">
            {isLoadingMessages ? (
              <div className="flex flex-col items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                <p className="text-gray-500 text-sm">Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageCircle className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm">No messages yet.</p>
                <p className="text-gray-400 text-xs mt-1">
                  Start a conversation with {patientData?.name?.split(' ')[0] || 'the patient'}!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => {
                  const isFromMe = isFromCurrentUser(msg);
                  return (
                    <div
                      key={msg._id}
                      className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] sm:max-w-[70%] rounded-lg px-4 py-2.5 ${isFromMe
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-800 border border-gray-200'
                          }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>
                        <p
                          className={`text-xs mt-1.5 ${isFromMe ? 'text-blue-100' : 'text-gray-500'
                            }`}
                        >
                          {msg.createdAt
                            ? new Date(msg.createdAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                            : ''}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="border-t border-gray-200 bg-white px-4 sm:px-6 py-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <textarea
                value={message}
                onChange={(e) => onMessageChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Type your message to ${patientData?.name?.split(' ')[0] || 'patient'}...`}
                rows={2}
                disabled={sendingMessage}
                className="
                  flex-1
                  px-3 py-2
                  border border-gray-300 rounded-lg
                  text-sm
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  resize-none
                  disabled:bg-gray-50 disabled:text-gray-500
                  transition-colors duration-200
                  hover:border-blue-400
                  focus:outline-none
                "
                style={{ minHeight: '60px' }}
              />
              <button
                type="submit"
                disabled={!isSendEnabled}
                className={`
        px-4 py-2 text-white text-sm font-medium rounded-lg
        transition-colors duration-200 flex items-center justify-center
        ${isSendEnabled
                    ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                    : 'bg-gray-300 cursor-not-allowed'}
      `}
              >
                {sendingMessage ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
            <p className="text-xs text-gray-500 mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>

      {/* Contact Info Sidebar */}
      <div className="order-2">
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
            Contact Information
          </h3>

          {patientData ? (
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-gray-500">Patient Name</p>
                <p className="font-medium text-gray-900">{patientData.name}</p>
              </div>

              {patientData.email && (
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium text-gray-900 break-all">
                    {patientData.email}
                  </p>
                </div>
              )}

              {patientData.phoneNumber && (
                <div>
                  <p className="text-gray-500">Phone</p>
                  <p className="font-medium text-gray-900">
                    {patientData.phoneNumber}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Your Relationship</p>
                <p className="font-medium text-gray-900">
                  {user.relationship || 'Not specified'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Access Level: {user.accessLevel}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-600">Messages sync every 5 seconds</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              No contact information available
            </p>
          )}
        </div>
      </div>
    </div>
  );
}