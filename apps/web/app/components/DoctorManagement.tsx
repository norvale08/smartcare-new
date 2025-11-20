import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, MapPin, Calendar, Stethoscope, MessageSquare, PhoneCall, ArrowLeft, AlertCircle,
  RefreshCw, Send, Shield, Building, Award, Clock, Search, UserPlus, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Input, Button } from '@repo/ui';

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

interface DoctorSearchProps {
  onDoctorRequest: (doctorId: string, doctorData?: any) => void;
  requestedDoctors: string[];
}

interface DoctorManagementProps {
  className?: string;
  refreshTrigger?: number;
  condition?: 'hypertension' | 'diabetes' | 'both';
}

const DoctorSearch: React.FC<DoctorSearchProps> = ({ onDoctorRequest, requestedDoctors }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getApiBaseUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  };

  const searchDoctors = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setError(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const params = new URLSearchParams();
      if (query.trim()) params.append('q', query);

      const apiUrl = `${getApiBaseUrl()}/api/doctors/search?${params.toString()}`;

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        throw new Error(`Search failed with status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.doctors) {
        setSearchResults(data.doctors);
        if (data.doctors.length === 0) {
          setError('No doctors found matching your search');
        }
      } else {
        throw new Error(data.message || 'Search request failed');
      }
      
    } catch (error: any) {
      console.error('Doctor search error:', error);
      setError(error.message);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchDoctors(searchQuery);
      } else {
        setSearchResults([]);
        setError(null);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleRequestDoctor = async (doctorId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${getApiBaseUrl()}/api/patient/request-doctor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ doctorId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Request failed: ${response.status}`);
      }

      const result = await response.json();
      const doctorData = searchResults.find(d => d.id === doctorId);
      onDoctorRequest(doctorId, doctorData);
      setError(`Successfully requested ${doctorData?.fullName || 'the doctor'}!`);
      
    } catch (error: any) {
      console.error('Doctor request error:', error);
      setError(error.message);
    }
  };

  const getSpecializationColor = (specialization: string) => {
    const colors: { [key: string]: string } = {
      'Cardiology': 'bg-red-100 text-red-800 border border-red-200',
      'Endocrinology': 'bg-blue-100 text-blue-800 border border-blue-200',
      'General Medicine': 'bg-green-100 text-green-800 border border-green-200',
      'Neurology': 'bg-purple-100 text-purple-800 border border-purple-200',
    };
    return colors[specialization] || 'bg-gray-100 text-gray-800 border border-gray-200';
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="text-sm text-gray-600 ml-1">({rating.toFixed(1)})</span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-gray-900">Search Our Medical Network</h4>
          <p className="text-sm text-gray-600">Find specialists based on your needs</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <User className="w-4 h-4" />
          <span>{searchResults.length} doctors available</span>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          type="text"
          placeholder="Search by name, specialization, hospital, or condition..."
          className="w-full pl-12 pr-24 py-3 text-base border-2 border-gray-200 focus:border-blue-500 transition-colors"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {error && (
        <div className={`p-3 rounded-lg flex items-start space-x-3 ${
          error.includes('Successfully') 
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-gray-600 font-medium">Searching our database...</p>
            <p className="text-sm text-gray-500 mt-1">Finding the best doctors for you</p>
          </div>
        ) : searchResults.length > 0 ? (
          searchResults.map((doctor) => {
            const isRequested = requestedDoctors.includes(doctor.id);
            
            return (
              <div
                key={doctor.id}
                className="p-4 rounded-xl border-2 border-gray-100 bg-white hover:border-blue-200 hover:shadow-md transition-all duration-200"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-bold text-lg text-gray-900">{doctor.fullName}</h4>
                          {isRequested && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Requested
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-3 text-sm text-gray-600">
                          <span className={`inline-block px-3 py-1 rounded-full font-semibold ${getSpecializationColor(doctor.specialization)}`}>
                            {doctor.specialization}
                          </span>
                          <span className="flex items-center">
                            <svg className="w-4 h-4 text-yellow-400 mr-1" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {doctor.rating.toFixed(1)}
                          </span>
                          <span>• {doctor.experience} years</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-gray-700">
                        <Building className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{doctor.hospital}</span>
                      </div>
                      
                      {doctor.phoneNumber && (
                        <div className="flex items-center space-x-2 text-gray-600">
                          <div className="w-4 h-4 flex items-center justify-center">📞</div>
                          <span>{doctor.phoneNumber}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {doctor.treatsHypertension && (
                        <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded border border-blue-200">
                          Hypertension
                        </span>
                      )}
                      {doctor.treatsDiabetes && (
                        <span className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded border border-green-200">
                          Diabetes
                        </span>
                      )}
                      {doctor.treatsCardiovascular && (
                        <span className="bg-red-50 text-red-700 text-xs px-2 py-1 rounded border border-red-200">
                          Cardiovascular
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="ml-4 flex-shrink-0">
                    <Button
                      size="sm"
                      disabled={isRequested}
                      onClick={() => handleRequestDoctor(doctor.id)}
                      className={isRequested ? 
                        'bg-green-100 text-green-800 hover:bg-green-100 border-2 border-green-200 px-4 py-2' : 
                        'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 shadow-sm'
                      }
                    >
                      {isRequested ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Requested
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Request
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        ) : searchQuery && !isLoading ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <h4 className="font-semibold text-gray-700 mb-1">No doctors found</h4>
            <p className="text-gray-500 text-sm">Try adjusting your search terms or filters</p>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <h4 className="font-semibold text-gray-700 mb-1">Ready to find your doctor?</h4>
            <p className="text-gray-500 text-sm">Search by name, specialization, or hospital to get started</p>
          </div>
        )}
      </div>

      {requestedDoctors.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
          <CheckCircle className="w-5 h-5 inline mr-2 text-blue-600" />
          <span className="text-blue-800 font-medium">
            You've requested {requestedDoctors.length} doctor{requestedDoctors.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
};

const AssignedDoctors: React.FC<{ className?: string; refreshTrigger?: number }> = ({ className, refreshTrigger }) => {
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
  }, [refreshTrigger]);

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
        <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
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
            <span className="bg-green-500 text-white text-sm px-3 py-1 rounded-full font-medium flex items-center">
              <Shield className="w-4 h-4 mr-1" />
              Assigned
            </span>
          </div>
        </div>

        <div className="p-6 space-y-6">
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

          {assignedDoctor.licenseNumber && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-2 mb-2">
                <Stethoscope className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Medical License</span>
              </div>
              <p className="text-sm text-gray-600 font-mono">{assignedDoctor.licenseNumber}</p>
            </div>
          )}

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

const DoctorManagement: React.FC<DoctorManagementProps> = ({ 
  className, 
  refreshTrigger, 
  condition = 'hypertension' 
}) => {
  const [requestedDoctorIds, setRequestedDoctorIds] = useState<string[]>([]);
  const [doctorRefreshTrigger, setDoctorRefreshTrigger] = useState(0);

  const handleDoctorRequest = (doctorId: string, doctorData?: any) => {
    setRequestedDoctorIds(prev => [...prev, doctorId]);
    
    setTimeout(() => {
      setDoctorRefreshTrigger(prev => prev + 1);
    }, 1000);
  };

  return (
    <section className={`w-full max-w-6xl ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <User className="w-6 h-6 mr-2 text-blue-600" />
          Doctor Management
        </h2>
        <p className="text-gray-600">Find and manage your healthcare providers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <Search className="w-5 h-5 mr-2" />
              Find Doctors
            </h3>
            <p className="text-blue-100 text-sm mt-1">
              Search and request doctors from our network
            </p>
          </div>
          <div className="p-6">
            <DoctorSearch 
              onDoctorRequest={handleDoctorRequest}
              requestedDoctors={requestedDoctorIds}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Your Healthcare Team
            </h3>
            <p className="text-green-100 text-sm mt-1">
              Manage your assigned doctors and communications
            </p>
          </div>
          <div className="p-6">
            <AssignedDoctors refreshTrigger={doctorRefreshTrigger} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default DoctorManagement;
