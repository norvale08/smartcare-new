"use client";
import React, { useState, useEffect } from "react";
import { User, Phone, Mail, Building, Award, Clock, AlertCircle, 
  RefreshCw, MessageSquare, PhoneCall, Shield, Send, ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@repo/ui";
import { useTranslation } from "../../lib/hypertension/useTranslation";

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
  assignmentSource?: string;
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

interface DoctorManagementProps {
  className?: string;
  refreshTrigger?: number;
  condition?: 'hypertension' | 'diabetes' | 'both';
}

const AssignedDoctors: React.FC<{ className?: string; refreshTrigger?: number }> = ({ className, refreshTrigger }) => {
  const { language } = useTranslation();
  const [assignedDoctor, setAssignedDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMessaging, setIsMessaging] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastChecked, setLastChecked] = useState<string>("");
  const [showMessagesSection, setShowMessagesSection] = useState(false);

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

      console.log('📡 Fetching assigned doctor...');
      
      // Use the new endpoint that checks both Patient and User models
      const response = await fetch(`${getApiBaseUrl()}/api/patient/my-doctor`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log(`Response status:`, response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ API Response:', data);
        
        if (data.success && data.assignedDoctor) {
          // Format doctor data
          const doctorData = data.assignedDoctor;
          const formattedDoctor: Doctor = {
            id: doctorData.id || doctorData._id || '',
            fullName: doctorData.fullName || 'Dr. Unknown',
            specialization: doctorData.specialization || 'General Medicine',
            hospital: doctorData.hospital || 'Medical Center',
            email: doctorData.email,
            phoneNumber: doctorData.phoneNumber,
            licenseNumber: doctorData.licenseNumber,
            experience: doctorData.experience || 0,
            createdAt: doctorData.createdAt,
            assignmentSource: data.assignmentSource || 'unknown'
          };
          setAssignedDoctor(formattedDoctor);
          setRetryCount(0);
          setLastChecked(new Date().toLocaleTimeString());
          
          // Auto-fetch messages when doctor is assigned
          if (!showMessagesSection && !isMessaging) {
            fetchMessages(formattedDoctor.id);
          }
        } else if (data.success && data.assignedDoctor === null) {
          // No doctor assigned yet
          console.log('ℹ️ No doctor assigned yet');
          setAssignedDoctor(null);
          setError(null);
          setLastChecked(new Date().toLocaleTimeString());
        } else {
          throw new Error(data.message || 'Invalid response format');
        }
      } else if (response.status === 404) {
        // No doctor assigned - this is not an error
        console.log('ℹ️ No doctor assigned (404 response)');
        setAssignedDoctor(null);
        setError(null);
        setLastChecked(new Date().toLocaleTimeString());
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch assigned doctor: ${response.status}`);
      }
    } catch (error: any) {
      console.error('❌ Error fetching assigned doctor:', error);
      
      // Only show error if we've tried multiple times
      if (retryCount < 2) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          fetchAssignedDoctor();
        }, 3000); // Retry after 3 seconds
      } else {
        setError(error.message || 'Failed to load doctor information. Please try again.');
      }
      
      setAssignedDoctor(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedDoctor();
  }, [refreshTrigger]);

  useEffect(() => {
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      if (!isMessaging && assignedDoctor) {
        fetchAssignedDoctor();
        fetchMessages(assignedDoctor.id);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [isMessaging, assignedDoctor]);

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
          // Refresh messages after sending
          fetchMessages(assignedDoctor.id);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert(language === "en-US" 
        ? 'Failed to send message. Please try again.' 
        : 'Imeshindwa kutuma ujumbe. Tafadhali jaribu tena.');
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

  const toggleMessagesSection = () => {
    if (assignedDoctor) {
      setShowMessagesSection(!showMessagesSection);
      if (!showMessagesSection) {
        fetchMessages(assignedDoctor.id);
      }
    }
  };

  const handleCallClick = () => {
    if (assignedDoctor?.phoneNumber) {
      window.open(`tel:${assignedDoctor.phoneNumber}`, '_blank');
    } else {
      alert(language === "en-US" 
        ? 'Phone number not available for this doctor' 
        : 'Nambari ya simu haipatikani kwa daktari huyu');
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return language === "en-US" ? 'Not specified' : 'Haijaainishwa';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return language === "en-US" ? 'Not specified' : 'Haijaainishwa';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h3 className="font-semibold text-gray-700 mb-1">
            {language === "en-US" 
              ? "Loading Your Doctor Information" 
              : "Inapakia Taarifa ya Daktari Wako"}
          </h3>
          <p className="text-gray-500 text-sm">
            {language === "en-US" 
              ? "Fetching your assigned doctor details..." 
              : "Inapata maelezo ya daktari wako aliyeteuliwa..."}
            {retryCount > 0 && ` (Retry ${retryCount}/2)`}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h3 className="font-semibold text-red-800 mb-2">
            {language === "en-US" 
              ? "Unable to Load Doctor Information" 
              : "Haiwezekani Kupakia Taarifa ya Daktari"}
          </h3>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <div className="flex justify-center space-x-3">
            <button 
              onClick={fetchAssignedDoctor}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {language === "en-US" ? "Try Again" : "Jaribu Tena"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!assignedDoctor) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
          <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="font-bold text-gray-700 text-lg mb-2">
            {language === "en-US" 
              ? "No Doctor Assigned Yet" 
              : "Hakuna Daktari Aliyeteuliwa Bado"}
          </h3>
          <p className="text-gray-500 mb-4 max-w-sm mx-auto">
            {language === "en-US" 
              ? "You haven't been assigned a doctor yet. Please wait for administrator assignment or contact support if this persists."
              : "Hujateuliwa daktari bado. Tafadhali subiri uteuzi wa msimamizi au wasiliana na usaidizi ikiwa hii inaendelea."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button 
              onClick={fetchAssignedDoctor}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {language === "en-US" ? "Check Again" : "Angalia Tena"}
            </button>
            <button 
              onClick={() => window.open('/support', '_blank')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {language === "en-US" ? "Contact Support" : "Wasiliana na Usaidizi"}
            </button>
          </div>
          {lastChecked && (
            <p className="text-xs text-gray-400 mt-4">
              {language === "en-US" ? "Last checked" : "Ilikaguliwa mwisho"}: {lastChecked}
            </p>
          )}
        </div>
      </div>
    );
  }

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="space-y-6">
      {/* Doctor Information Card */}
      <div className="bg-white rounded-xl border-2 border-green-200 shadow-sm overflow-hidden">
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
            <div className="flex flex-col items-end">
              <span className="bg-green-500 text-white text-sm px-3 py-1 rounded-full font-medium flex items-center mb-1">
                <Shield className="w-4 h-4 mr-1" />
                {language === "en-US" ? "Assigned" : "Imeteuliwa"}
              </span>
              {assignedDoctor.assignmentSource && (
                <span className="text-xs text-green-200">
                  {language === "en-US" ? "By Admin" : "Na Msimamizi"}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <Building className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-xs text-blue-600 font-medium">
                    {language === "en-US" ? "Hospital/Clinic" : "Hospitali/Kliniki"}
                  </p>
                  <p className="text-sm font-semibold text-gray-900">{assignedDoctor.hospital}</p>
                </div>
              </div>
              
              {assignedDoctor.experience && assignedDoctor.experience > 0 && (
                <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                  <Award className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="text-xs text-orange-600 font-medium">
                      {language === "en-US" ? "Experience" : "Uzoefu"}
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {assignedDoctor.experience} {language === "en-US" ? "years" : "miaka"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {assignedDoctor.email && (
                <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                  <Mail className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-xs text-purple-600 font-medium">
                      {language === "en-US" ? "Email" : "Barua Pepe"}
                    </p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{assignedDoctor.email}</p>
                  </div>
                </div>
              )}

              {assignedDoctor.phoneNumber && (
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <Phone className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-xs text-green-600 font-medium">
                      {language === "en-US" ? "Phone" : "Simu"}
                    </p>
                    <p className="text-sm font-semibold text-gray-900">{assignedDoctor.phoneNumber}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {assignedDoctor.licenseNumber && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {language === "en-US" ? "Medical License" : "Leseni ya Matibabu"}
                </span>
              </div>
              <p className="text-sm text-gray-600 font-mono">{assignedDoctor.licenseNumber}</p>
            </div>
          )}

          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button 
              onClick={toggleMessagesSection}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-medium flex items-center justify-center space-x-2 transition-colors shadow-sm"
            >
              <MessageSquare className="w-5 h-5" />
              <span>
                {showMessagesSection 
                  ? (language === "en-US" ? "Hide Messages" : "Ficha Ujumbe")
                  : (language === "en-US" ? "View Messages" : "Angalia Ujumbe")}
              </span>
            </button>
          </div>

          <div className="text-center pt-4 border-t border-gray-100">
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>
                  {language === "en-US" ? "Assigned" : "Imeteuliwa"}: {formatDateTime(assignedDoctor.createdAt)}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <span>•</span>
                <span>
                  {language === "en-US" ? "Last checked" : "Ilikaguliwa mwisho"}: {lastChecked}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Section - Always visible when toggled */}
      {showMessagesSection && (
        <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">
                    {language === "en-US" ? "Messages with Doctor" : "Mazungumzo na Daktari"}
                  </h3>
                  <p className="text-blue-100 text-sm">{assignedDoctor.fullName}</p>
                </div>
              </div>
              <button
                onClick={toggleMessagesSection}
                className="p-2 rounded-full hover:bg-blue-500 transition-colors"
                title={language === "en-US" ? "Close messages" : "Funga ujumbe"}
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          <div className="h-96 overflow-y-auto p-4 bg-gray-50 flex flex-col space-y-3">
            {messagesLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium text-gray-600">
                    {language === "en-US" ? "No messages yet" : "Hakuna ujumbe bado"}
                  </p>
                  <p className="text-sm">
                    {language === "en-US" 
                      ? "Start a conversation with your doctor" 
                      : "Anza mazungumzo na daktari wako"}
                  </p>
                </div>
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
                      className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                        isOwnMessage
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-white text-gray-900 border-2 border-gray-200 rounded-bl-none'
                      }`}
                    >
                      {/* Message content */}
                      <p className="text-sm break-words">{message.content}</p>
                      
                      {/* Timestamp */}
                      <div className={`text-xs mt-2 ${
                        isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {formatTime(message.createdAt)}
                      </div>
                      
                      {/* Sender indicator */}
                      {!isOwnMessage && (
                        <div className="text-xs text-gray-400 mt-1">
                          {message.senderId.fullName}
                        </div>
                      )}
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
                placeholder={language === "en-US" 
                  ? "Type your message to the doctor..." 
                  : "Andika ujumbe wako kwa daktari..."}
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
      )}

      {/* Full Screen Messaging View (optional) */}
      {isMessaging && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
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

          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col space-y-3">
            {messagesLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium text-gray-600">
                    {language === "en-US" ? "No messages yet" : "Hakuna ujumbe bado"}
                  </p>
                  <p className="text-sm">
                    {language === "en-US" 
                      ? "Start a conversation with your doctor" 
                      : "Anza mazungumzo na daktari wako"}
                  </p>
                </div>
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
                      className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                        isOwnMessage
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-white text-gray-900 border-2 border-gray-200 rounded-bl-none'
                      }`}
                    >
                      <p className="text-sm break-words">{message.content}</p>
                      <div className={`text-xs mt-2 ${
                        isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {formatTime(message.createdAt)}
                      </div>
                      {!isOwnMessage && (
                        <div className="text-xs text-gray-400 mt-1">
                          {message.senderId.fullName}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-gray-200 p-4 bg-white">
            <div className="flex space-x-3">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={language === "en-US" 
                  ? "Type your message to the doctor..." 
                  : "Andika ujumbe wako kwa daktari..."}
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
      )}
    </div>
  );
};

const DoctorManagement: React.FC<DoctorManagementProps> = ({ 
  className, 
  refreshTrigger, 
  condition = 'hypertension' 
}) => {
  const { language } = useTranslation();
  const [doctorRefreshTrigger, setDoctorRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setDoctorRefreshTrigger(prev => prev + 1);
  };

  return (
    <section className={`w-full max-w-4xl mx-auto ${className}`}>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
              <User className="w-6 h-6 mr-2 text-blue-600" />
              {language === "en-US" ? "My Assigned Doctor" : "Daktari Wangu Aliyeteuliwa"}
            </h2>
            <p className="text-gray-600">
              {language === "en-US" 
                ? "View and communicate with your assigned doctor" 
                : "Angalia na wasiliana na daktari wako aliyeteuliwa"}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors self-start sm:self-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm font-medium">
              {language === "en-US" ? "Refresh" : "Osha Upya"}
            </span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <svg className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {language === "en-US" ? "Your Healthcare Provider" : "Mtoa Huduma Wako wa Afya"}
          </h3>
          <p className="text-green-100 text-sm mt-1">
            {language === "en-US" 
              ? "View your assigned doctor's details and contact information" 
              : "Angalia maelezo ya daktari wako aliyeteuliwa na mawasiliano"}
          </p>
        </div>
        <div className="p-6">
          <AssignedDoctors refreshTrigger={doctorRefreshTrigger} />
        </div>
      </div>

      {/* Information Panel */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">
              {language === "en-US" ? "About Doctor Assignments" : "Kuhusu Uteuzi wa Daktari"}
            </h4>
            <p className="text-blue-800 text-sm">
              {language === "en-US" 
                ? "Doctors are assigned by administrators based on your medical condition and needs. If you have any questions about your assignment, please contact the admin team."
                : "Madaktari wanateuliwa na wasimamizi kulingana na hali yako ya kiafya na mahitaji. Ikiwa una maswali yoyote kuhusu uteuzi wako, tafadhali wasiliana na timu ya wasimamizi."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DoctorManagement;