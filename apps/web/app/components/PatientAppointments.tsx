"use client";

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface Appointment {
  _id: string;
  patientId: {
    _id: string;
    fullName: string;
    email?: string;
    phoneNumber?: string;
  };
  doctorId: {
    _id: string;
    fullName: string;
    specialization?: string;
  };
  type: 'follow-up' | 'consultation' | 'check-up' | 'emergency';
  scheduledDate: string;
  duration: number;
  notes: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  reminderSent: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PatientAppointmentsProps {
  patientId?: string;
  language?: 'en' | 'sw';
}

const PatientAppointments: React.FC<PatientAppointmentsProps> = ({ patientId, language = 'en' }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [userId, setUserId] = useState<string | null>(null);

  const translations = {
    en: {
      title: "Your Appointments",
      subtitle: "Manage your medical appointments",
      all: "All",
      upcoming: "Upcoming",
      past: "Past",
      noAppointments: "No appointments found",
      noUpcoming: "No upcoming appointments scheduled",
      noPast: "No past appointments found",
      refresh: "Refresh",
      doctor: "Doctor",
      typeFollowUp: "Follow-up",
      typeConsultation: "Consultation",
      typeCheckUp: "Check-up",
      typeEmergency: "Emergency",
      statusScheduled: "Scheduled",
      statusCompleted: "Completed",
      statusCancelled: "Cancelled",
      statusNoShow: "No-show",
      notes: "Notes",
      duration: "Duration",
      minutes: "minutes",
      loginRequired: "Please log in to view appointments",
      loading: "Loading appointments...",
      tokenError: "Invalid authentication token"
    },
    sw: {
      title: "Miamsha Yako",
      subtitle: "Dhibiti miamsha yako ya kimatibabu",
      all: "Zote",
      upcoming: "Inayokuja",
      past: "Zilizopita",
      noAppointments: "Hakuna miamsha iliyopatikana",
      noUpcoming: "Hakuna miamsha inayokuja",
      noPast: "Hakuna miamsha zilizopita",
      refresh: "Sasisha",
      doctor: "Daktari",
      typeFollowUp: "Fuatilia",
      typeConsultation: "Mshauriano",
      typeCheckUp: "Angalia",
      typeEmergency: "Dharura",
      statusScheduled: "Imepangwa",
      statusCompleted: "Imekamilika",
      statusCancelled: "Imeghairiwa",
      statusNoShow: "Haikufika",
      notes: "Maelezo",
      duration: "Muda",
      minutes: "dakika",
      loginRequired: "Tafadhali ingia kwenye mfumo kuona miamsha",
      loading: "Inapakia miamsha...",
      tokenError: "Tokeni batili ya utambulisho"
    }
  };

  const t = translations[language];

  // Safe base64 decode function
  const safeBase64Decode = (base64String: string): string => {
    try {
      // Replace URL-safe base64 characters
      const safeBase64 = base64String.replace(/-/g, '+').replace(/_/g, '/');
      // Add padding if necessary
      const paddedBase64 = safeBase64.padEnd(safeBase64.length + (4 - safeBase64.length % 4) % 4, '=');
      return decodeURIComponent(
        atob(paddedBase64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    } catch (error) {
      console.error('Error decoding base64:', error);
      return '';
    }
  };

  // Get user ID from localStorage on component mount
  useEffect(() => {
    const getUserInfo = () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError(t.loginRequired);
          return null;
        }

        console.log('🔑 Token found:', token.substring(0, 20) + '...');

        // Try to get user from localStorage first (most reliable)
        const userData = localStorage.getItem('user');
        if (userData) {
          try {
            const user = JSON.parse(userData);
            console.log('👤 User data from localStorage:', user);
            
            // Check if user is a patient
            const userRole = user.role || user.userType || user.type;
            if (userRole === 'patient' || userRole === 'user' || userRole === 'Patient') {
              const userId = user.id || user._id || user.userId;
              console.log('👤 Patient ID found:', userId);
              if (userId) {
                setUserId(userId);
                return userId;
              }
            } else {
              setError(language === 'sw' ? 'Hii ukurasa ni kwa wagonjwa pekee' : 'This page is for patients only');
              return null;
            }
          } catch (parseError) {
            console.error('Error parsing user data:', parseError);
          }
        }

        // If no user in localStorage, try to decode from token
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          try {
            // Get the payload part (index 1) safely
            const payloadPart = tokenParts[1];
            if (!payloadPart) {
              throw new Error('Token payload is missing');
            }
            
            // Decode the payload
            const decodedPayload = safeBase64Decode(payloadPart);
            if (!decodedPayload) {
              throw new Error('Failed to decode token payload');
            }
            
            const payload = JSON.parse(decodedPayload);
            console.log('👤 Token payload:', payload);
            
            // Check user role from token
            const userRole = payload.role || payload.userType || payload.type;
            if (userRole === 'patient' || userRole === 'user' || userRole === 'Patient') {
              const userId = payload.userId || payload.id || payload.sub;
              if (userId) {
                setUserId(userId);
                return userId;
              } else {
                throw new Error('User ID not found in token');
              }
            } else {
              setError(language === 'sw' ? 'Hii ukurasa ni kwa wagonjwa pekee' : 'This page is for patients only');
              return null;
            }
          } catch (decodeError: any) {
            console.error('Error decoding token:', decodeError);
            setError(`${t.tokenError}: ${decodeError.message}`);
            return null;
          }
        } else {
          console.error('Invalid token format. Expected 3 parts, got:', tokenParts.length);
          setError(t.tokenError);
          return null;
        }

        setError(t.loginRequired);
        return null;
      } catch (error: any) {
        console.error('Error getting user info:', error);
        setError(language === 'sw' ? 'Hitilafu katika upatikanaji wa taarifa' : 'Error getting user information');
        return null;
      }
    };

    const id = getUserInfo();
    if (id || patientId) {
      fetchAppointments(id || patientId);
    } else if (!loading) {
      setLoading(false);
    }
  }, [patientId, language]);

  const fetchAppointments = async (targetPatientId?: string) => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error(t.loginRequired);
      }

      console.log('🔑 Using token for API request');

      // For patients, use patient-specific endpoints first to get only their appointments
      // Try multiple endpoints in order
      const endpoints = [
        patientId ? `/api/appointments/patient/${patientId}` : null,
        targetPatientId ? `/api/appointments/patient/${targetPatientId}` : null,
        '/api/appointments/my-appointments',
        '/api/appointments'
      ].filter(Boolean) as string[];

      let response: Response | null = null;
      let result: any = null;

      // Try each endpoint until we get a successful response
      for (const endpoint of endpoints) {
        console.log(`🔍 Trying endpoint: ${endpoint}`);
        try {
          response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${endpoint}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          console.log(`📡 Response from ${endpoint}:`, response.status);
          
          if (response.ok) {
            result = await response.json();
            console.log(`✅ Success from ${endpoint}:`, result);
            
            if (result.success && (result.appointments || result.data)) {
              handleAppointmentsResponse(result);
              return; // Exit loop on success
            }
          } else if (response.status === 404) {
            console.log(`❌ Endpoint not found: ${endpoint}`);
            continue; // Try next endpoint
          }
        } catch (endpointError) {
          console.error(`❌ Error with endpoint ${endpoint}:`, endpointError);
          continue; // Try next endpoint
        }
      }

      // If we get here, all endpoints failed
      if (response && !response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 100)}`);
      }

      throw new Error(language === 'sw' ? 'Hakuna miamsha iliyopatikana' : 'No appointments found');

    } catch (err: any) {
      console.error('❌ Error fetching appointments:', err);
      setError(err.message || (language === 'sw' ? 'Hitilafu katika kupata miamsha' : 'Error fetching appointments'));
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAppointmentsResponse = (result: any) => {
    console.log('📊 Handling API Response:', result);
    
    let appointmentsArray: Appointment[] = [];
    
    if (result.success) {
      if (Array.isArray(result.appointments)) {
        appointmentsArray = result.appointments;
      } else if (Array.isArray(result.data)) {
        appointmentsArray = result.data;
      } else if (Array.isArray(result)) {
        appointmentsArray = result;
      }
    } else if (Array.isArray(result)) {
      // Handle case where API returns array directly
      appointmentsArray = result;
    }
    
    setAppointments(appointmentsArray);
    console.log(`📋 Found ${appointmentsArray.length} appointments`);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(language === 'sw' ? 'sw-TZ' : 'en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'no-show':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'follow-up':
        return <RefreshCw className="w-4 h-4" />;
      case 'consultation':
        return <Stethoscope className="w-4 h-4" />;
      case 'check-up':
        return <CheckCircle className="w-4 h-4" />;
      case 'emergency':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const translateType = (type: string) => {
    switch (type) {
      case 'follow-up': return t.typeFollowUp;
      case 'consultation': return t.typeConsultation;
      case 'check-up': return t.typeCheckUp;
      case 'emergency': return t.typeEmergency;
      default: return type;
    }
  };

  const translateStatus = (status: string) => {
    switch (status) {
      case 'scheduled': return t.statusScheduled;
      case 'completed': return t.statusCompleted;
      case 'cancelled': return t.statusCancelled;
      case 'no-show': return t.statusNoShow;
      default: return status;
    }
  };

  // Filter appointments based on selected filter
  const filteredAppointments = appointments.filter(apt => {
    if (!apt.scheduledDate) return false;
    
    const now = new Date();
    const appointmentDate = new Date(apt.scheduledDate);
    
    switch (filter) {
      case 'upcoming':
        return appointmentDate >= now && apt.status === 'scheduled';
      case 'past':
        return appointmentDate < now || apt.status !== 'scheduled';
      case 'all':
        return true;
      default:
        return true;
    }
  });

  // Debug logging
  useEffect(() => {
    console.log('📊 All appointments:', appointments);
    console.log('🔍 Current filter:', filter);
    console.log('📋 Filtered appointments:', filteredAppointments);
    console.log('🔢 Filtered count:', filteredAppointments.length);
  }, [appointments, filter]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-center space-x-2 py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">{t.loading}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t.title}</h2>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => fetchAppointments(userId || patientId)}
            className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm transition-colors"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{t.refresh}</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex space-x-2">
        {(['upcoming', 'past', 'all'] as const).map((filterType) => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType)}
            disabled={loading}
            className={`px-4 py-2 rounded-lg font-medium capitalize text-sm transition-colors ${
              filter === filterType
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {filterType === 'all' ? t.all : filterType === 'upcoming' ? t.upcoming : t.past} 
            ({filteredAppointments.length})
          </button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <span className="text-sm">{error}</span>
              <div className="mt-2">
                <button 
                  onClick={() => fetchAppointments(userId || patientId)} 
                  className="text-red-700 hover:text-red-900 text-sm font-medium"
                >
                  {t.refresh}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Appointments List */}
      <div className="space-y-3">
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border">
            <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              {filter === 'upcoming' ? t.noUpcoming : 
               filter === 'past' ? t.noPast : t.noAppointments}
            </h3>
            <p className="text-gray-500 text-sm">
              {filter === 'upcoming' ? t.noUpcoming : 
               filter === 'past' ? t.noPast : t.noAppointments}
            </p>
          </div>
        ) : (
          filteredAppointments.map((appointment) => (
            <div
              key={appointment._id}
              className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {getTypeIcon(appointment.type)}
                    <h3 className="text-lg font-semibold text-gray-900 capitalize">
                      {translateType(appointment.type)}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                      {translateStatus(appointment.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{formatDate(appointment.scheduledDate)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{t.duration}: {appointment.duration} {t.minutes}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>{t.doctor}: {appointment.doctorId?.fullName || 'Unknown Doctor'}</span>
                      </div>
                      {appointment.doctorId?.specialization && (
                        <div className="flex items-center space-x-2">
                          <Stethoscope className="w-4 h-4 text-gray-400" />
                          <span>{appointment.doctorId.specialization}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {appointment.notes && (
                    <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>{t.notes}:</strong> {appointment.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PatientAppointments;