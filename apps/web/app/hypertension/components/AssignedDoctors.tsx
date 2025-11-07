import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, MapPin, Calendar, Stethoscope, MessageSquare, PhoneCall, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';

interface Doctor {
  id: string;
  fullName: string;
  specialization: string;
  hospital: string;
  email?: string;
  phoneNumber?: string;
  licenseNumber?: string;
  experience?: number;
  createdAt?: string;
}

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

interface AssignedDoctorsProps {
  className?: string;
  refreshTrigger?: number; // Add prop to trigger refresh from parent
}

const AssignedDoctors: React.FC<AssignedDoctorsProps> = ({ className, refreshTrigger }) => {
  const [assignedDoctor, setAssignedDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMessaging, setIsMessaging] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [messagesLoading, setMessagesLoading] = useState(false);

  const getApiBaseUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  };

  const fetchAssignedDoctor = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${getApiBaseUrl()}/api/patient/assigned-doctors`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setAssignedDoctor(null);
          return;
        }
        throw new Error(`Failed to fetch assigned doctor: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('Assigned doctor data:', data);
      
      if (data.success && data.assignedDoctor) {
        setAssignedDoctor(data.assignedDoctor);
      } else {
        setAssignedDoctor(null);
      }
    } catch (error: any) {
      console.error('Error fetching assigned doctor:', error);
      setError(error.message);
      setAssignedDoctor(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedDoctor();
  }, [refreshTrigger]); // Re-fetch when refreshTrigger changes

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAssignedDoctor();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchMessages = async (doctorId: string) => {
    try {
      setMessagesLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${getApiBaseUrl()}/api/messages/conversation?otherUserId=${doctorId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setMessages(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !assignedDoctor) return;

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
          receiverId: assignedDoctor.id,
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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleMessageClick = () => {
    if (assignedDoctor) {
      setIsMessaging(true);
      fetchMessages(assignedDoctor.id);
    }
  };

  const handleCallClick = () => {
    if (assignedDoctor?.phoneNumber) {
      window.open(`tel:${assignedDoctor.phoneNumber}`, '_blank');
    } else {
      alert('Phone number not available for this doctor');
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Not specified';
    }
  };

  if (loading) {
    return (
      <Card className={`shadow-lg ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Stethoscope className="w-5 h-5" />
            <span>Your Assigned Doctor</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading doctor information...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`shadow-lg ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Stethoscope className="w-5 h-5" />
            <span>Your Assigned Doctor</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{error}</p>
              <button 
                onClick={fetchAssignedDoctor}
                className="mt-2 text-blue-600 text-sm hover:underline"
              >
                Try again
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!assignedDoctor) {
    return (
      <Card className={`shadow-lg ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Stethoscope className="w-5 h-5" />
            <span>Your Assigned Doctor</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-gray-500">
            <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <h3 className="font-medium text-gray-900 mb-1">No Doctor Assigned</h3>
            <p className="text-sm">You don't have an assigned doctor yet.</p>
            <p className="text-xs mt-2">Search for doctors and send them a request.</p>
            <button 
              onClick={fetchAssignedDoctor}
              className="mt-3 text-blue-600 text-sm hover:underline"
            >
              Refresh
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isMessaging) {
    return (
      <Card className={`shadow-lg ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <button
              onClick={() => setIsMessaging(false)}
              className="mr-3 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <span>Messaging with {assignedDoctor.fullName}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Messages Area */}
          <div className="h-64 overflow-y-auto space-y-3 p-2 bg-gray-50 rounded-lg">
            {messagesLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No messages yet</p>
                <p className="text-xs">Start the conversation</p>
              </div>
            ) : (
              messages.map((message) => {
                const isOwnMessage = message.senderId._id === JSON.parse(localStorage.getItem('user') || '{}')?.userId;
                return (
                  <div
                    key={message._id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg ${
                        isOwnMessage
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-900 border'
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
          </div>

          {/* Message Input */}
          <div className="flex space-x-2">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={2}
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`shadow-lg ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Stethoscope className="w-5 h-5" />
          <span>Your Assigned Doctor</span>
          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
            Assigned
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Doctor Header */}
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {assignedDoctor.fullName}
            </h3>
            <p className="text-sm text-blue-600 font-medium">
              {assignedDoctor.specialization}
            </p>
            <div className="flex items-center space-x-2 mt-1">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600 truncate">
                {assignedDoctor.hospital}
              </span>
            </div>
          </div>
        </div>

        {/* Doctor Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          {assignedDoctor.experience && assignedDoctor.experience > 0 && (
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Experience</p>
                <p className="text-sm font-medium">{assignedDoctor.experience} years</p>
              </div>
            </div>
          )}
          
          {assignedDoctor.licenseNumber && (
            <div className="flex items-center space-x-2">
              <Stethoscope className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">License</p>
                <p className="text-sm font-medium truncate">{assignedDoctor.licenseNumber}</p>
              </div>
            </div>
          )}

          {assignedDoctor.email && (
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm font-medium truncate">{assignedDoctor.email}</p>
              </div>
            </div>
          )}

          {assignedDoctor.phoneNumber && (
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="text-sm font-medium">{assignedDoctor.phoneNumber}</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4 border-t border-gray-200">
          <button 
            onClick={handleMessageClick}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center space-x-2 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Message</span>
          </button>
          <button 
            onClick={handleCallClick}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center space-x-2 transition-colors"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Call</span>
          </button>
        </div>

        {/* Additional Info */}
        <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
          <p>Assigned on: {formatDateTime(assignedDoctor.createdAt)}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AssignedDoctors;
