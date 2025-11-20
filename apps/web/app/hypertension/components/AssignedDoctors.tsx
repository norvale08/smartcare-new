import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, MapPin, Calendar, Stethoscope, MessageSquare, PhoneCall, ArrowLeft,AlertCircle,
  RefreshCw,Send,Shield,Building,Award,Clock } from 'lucide-react';
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
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h3 className="font-semibold text-gray-700 mb-1">Loading Your Healthcare Team</h3>
          <p className="text-gray-500 text-sm">Fetching your doctor information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h3 className="font-semibold text-red-800 mb-2">Unable to Load Doctor</h3>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button 
            onClick={fetchAssignedDoctor}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!assignedDoctor) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
          <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="font-bold text-gray-700 text-lg mb-2">No Doctor Assigned Yet</h3>
          <p className="text-gray-500 mb-4 max-w-sm mx-auto">
            You haven't been assigned a doctor yet. Search for doctors and send them requests to build your healthcare team.
          </p>
          <div className="flex justify-center space-x-3">
            <button 
              onClick={fetchAssignedDoctor}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isMessaging) {
    return (
      <div className="space-y-4">
        {/* Messaging Interface */}
        <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsMessaging(false)}
                className="p-2 rounded-full hover:bg-blue-500 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{assignedDoctor.fullName}</h3>
                <p className="text-blue-100 text-sm">{assignedDoctor.specialization}</p>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="h-80 overflow-y-auto space-y-4 p-4 bg-gray-50">
            {messagesLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium text-gray-600">No messages yet</p>
                <p className="text-sm">Start a conversation with your doctor</p>
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
                      className={`max-w-md px-4 py-3 rounded-2xl ${
                        isOwnMessage
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-white text-gray-900 border-2 border-gray-200 rounded-bl-none'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-2 ${
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
          <div className="border-t border-gray-200 p-4 bg-white">
            <div className="flex space-x-3">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message to the doctor..."
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={2}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 flex items-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Doctor Profile Card */}
      <div className="bg-white rounded-xl border-2 border-green-200 shadow-sm overflow-hidden">
        {/* Header with Status */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                <User className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">{assignedDoctor.fullName}</h3>
                <p className="text-green-100">{assignedDoctor.specialization}</p>
              </div>
            </div>
            <span className="bg-green-500 text-white text-sm px-3 py-1 rounded-full font-medium flex items-center">
              <Shield className="w-4 h-4 mr-1" />
              Assigned
            </span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <Building className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-xs text-blue-600 font-medium">Hospital</p>
                  <p className="text-sm font-semibold text-gray-900">{assignedDoctor.hospital}</p>
                </div>
              </div>
              
              {assignedDoctor.experience && assignedDoctor.experience > 0 && (
                <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                  <Award className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="text-xs text-orange-600 font-medium">Experience</p>
                    <p className="text-sm font-semibold text-gray-900">{assignedDoctor.experience} years</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {assignedDoctor.email && (
                <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                  <Mail className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-xs text-purple-600 font-medium">Email</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{assignedDoctor.email}</p>
                  </div>
                </div>
              )}

              {assignedDoctor.phoneNumber && (
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <Phone className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-xs text-green-600 font-medium">Phone</p>
                    <p className="text-sm font-semibold text-gray-900">{assignedDoctor.phoneNumber}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* License Information */}
          {assignedDoctor.licenseNumber && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-2 mb-2">
                <Stethoscope className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Medical License</span>
              </div>
              <p className="text-sm text-gray-600 font-mono">{assignedDoctor.licenseNumber}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button 
              onClick={handleMessageClick}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-medium flex items-center justify-center space-x-2 transition-colors shadow-sm"
            >
              <MessageSquare className="w-5 h-5" />
              <span>Send Message</span>
            </button>
            <button 
              onClick={handleCallClick}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl text-sm font-medium flex items-center justify-center space-x-2 transition-colors shadow-sm"
            >
              <PhoneCall className="w-5 h-5" />
              <span>Call Now</span>
            </button>
          </div>

          {/* Additional Info */}
          <div className="text-center pt-4 border-t border-gray-100">
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>Assigned: {formatDateTime(assignedDoctor.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignedDoctors;
  