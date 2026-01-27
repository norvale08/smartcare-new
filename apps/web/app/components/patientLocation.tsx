'use client';

import { useState, useEffect } from 'react';
import { APIProvider, Map, Marker, InfoWindow } from '@vis.gl/react-google-maps';
import { 
  MapPin, 
  Loader2, 
  AlertCircle, 
  Navigation2,
  User,
  Clock,
  ArrowLeft,
  Phone,
  Mail,
  Heart,
  Activity,
  Calendar,
  RefreshCcw,
  Navigation
} from 'lucide-react';

interface PatientLocation {
  lat: number;
  lng: number;
  address?: string;
  updatedAt?: string;
}

interface PatientInfo {
  id: string;
  name: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  age?: number;
  dob?: string;
  gender?: string;
  condition?: string;
  diabetes?: boolean;
  hypertension?: boolean;
  cardiovascular?: boolean;
  location?: PatientLocation;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function PatientLocationViewer() {
  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInfoWindow, setShowInfoWindow] = useState(false);
  const [userRole, setUserRole] = useState<'doctor' | 'relative' | null>(null);

  const defaultCenter = { lat: -1.286389, lng: 36.817223 };

  useEffect(() => {
    fetchPatientLocation();
  }, []);

  const fetchPatientLocation = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to view patient locations');
        setLoading(false);
        return;
      }

      // Decode token to get user role
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3 || !tokenParts[1]) {
        setError('Invalid token format');
        setLoading(false);
        return;
      }
      
      const tokenPayload = JSON.parse(atob(tokenParts[1] as string));
      const role = tokenPayload.role;
      setUserRole(role);

      let response;
      let data;

      // Fetch based on user role
      if (role === 'doctor') {
        // Doctors: Fetch all assigned patients and show the first one with location
        response = await fetch(`${API_URL}/api/doctorDashboard/assignedPatients`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch assigned patients');
        }

        const patients = await response.json();
        
        // FIXED: Check for location object instead of coordinates
        const patientWithLocation = patients.find((p: any) => 
          p.location && p.location.lat && p.location.lng
        );

        if (!patientWithLocation) {
          setError('No patients with location data found');
          setLoading(false);
          return;
        }

        // FIXED: Transform doctor's patient data format - location is already properly formatted
        data = {
          success: true,
          data: {
            id: patientWithLocation._id || patientWithLocation.userId,
            name: patientWithLocation.fullName || `${patientWithLocation.firstname || ''} ${patientWithLocation.lastname || ''}`.trim(),
            email: patientWithLocation.email,
            phoneNumber: patientWithLocation.phoneNumber,
            age: patientWithLocation.age,
            gender: patientWithLocation.gender,
            condition: patientWithLocation.conditions?.diabetes && patientWithLocation.conditions?.hypertension 
              ? 'both' 
              : patientWithLocation.conditions?.diabetes 
                ? 'diabetes' 
                : patientWithLocation.conditions?.hypertension 
                  ? 'hypertension' 
                  : 'unknown',
            diabetes: patientWithLocation.conditions?.diabetes || false,
            hypertension: patientWithLocation.conditions?.hypertension || false,
            location: patientWithLocation.location  // Already formatted as { lat, lng, address, updatedAt }
          }
        };

      } else if (role === 'relative') {
        // Relatives: Fetch their monitored patient's profile
        response = await fetch(`${API_URL}/api/relative/patient-profile`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch patient profile');
        }

        data = await response.json();

        // Check if location data is included
        if (!data.data.location) {
          setError('Patient has not shared their location yet');
          setLoading(false);
          return;
        }

      } else {
        setError('Unauthorized access. Only doctors and relatives can view patient locations.');
        setLoading(false);
        return;
      }
      
      if (data.success && data.data) {
        const patientData = data.data;
        
        // Check if location exists
        if (!patientData.location || !patientData.location.lat || !patientData.location.lng) {
          setError('Patient has not shared their location yet');
          setLoading(false);
          return;
        }

        setPatient(patientData);
        setShowInfoWindow(true);
      } else {
        setError(data.message || 'Failed to fetch patient location');
      }
    } catch (err: any) {
      console.error('Error fetching patient location:', err);
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getDirectionsToPatient = () => {
    if (!patient?.location) return;
    
    const url = `https://www.google.com/maps/dir/?api=1&destination=${patient.location.lat},${patient.location.lng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const navigateToPatient = () => {
    if (!patient?.location) return;
    
    // Open in Google Maps app or browser
    if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
      window.location.href = `maps://maps.google.com/maps?daddr=${patient.location.lat},${patient.location.lng}&amp;ll=`;
    } else {
      window.open(`geo:${patient.location.lat},${patient.location.lng}`, '_blank');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleString('en-KE', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  const calculateAge = (dob?: string) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getConditionColor = (condition?: string) => {
    switch (condition?.toLowerCase()) {
      case 'diabetes':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'hypertension':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'both':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <APIProvider 
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
      libraries={['places']}
    >
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.history.back()}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="text-sm font-medium hidden sm:inline">Back</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-6 h-6 text-blue-600" />
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                  Patient Location
                </h1>
              </div>
              <button
                onClick={fetchPatientLocation}
                disabled={loading}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                title="Refresh location"
              >
                <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-3 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
            {/* Left Panel - Patient Info */}
            <div className="lg:col-span-4 space-y-4">
              {/* Loading State */}
              {loading && !patient && (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-600">Loading patient location...</p>
                </div>
              )}

              {/* Error Alert */}
              {error && !loading && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-900 mb-1">Unable to Load Location</p>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Patient Information Card */}
              {patient && (
                <>
                  <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Patient Information</h3>
                      <span className="text-xs text-gray-500 capitalize">
                        ({userRole} View)
                      </span>
                    </div>

                    <div className="space-y-3">
                      {/* Name */}
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">Patient Name</p>
                          <p className="font-medium text-gray-900">{patient.name}</p>
                        </div>
                      </div>

                      {/* Condition Badge */}
                      {patient.condition && (
                        <div className={`${getConditionColor(patient.condition)} border rounded-lg px-3 py-2`}>
                          <p className="text-xs font-medium capitalize">
                            Condition: {patient.condition === 'both' ? 'Diabetes & Hypertension' : patient.condition}
                          </p>
                        </div>
                      )}

                      {/* Email */}
                      {patient.email && (
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Mail className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-gray-500">Email</p>
                            <a 
                              href={`mailto:${patient.email}`}
                              className="text-sm text-blue-600 hover:underline break-all"
                            >
                              {patient.email}
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Phone */}
                      {patient.phoneNumber && (
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Phone className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-gray-500">Phone</p>
                            <a 
                              href={`tel:${patient.phoneNumber}`}
                              className="text-sm text-blue-600 hover:underline"
                            >
                              {patient.phoneNumber}
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Additional Info */}
                      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
                        {(patient.age || patient.dob) && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-500">Age</p>
                              <p className="text-sm font-medium">
                                {patient.age || calculateAge(patient.dob)} years
                              </p>
                            </div>
                          </div>
                        )}
                        {patient.gender && (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-500">Gender</p>
                              <p className="text-sm font-medium capitalize">{patient.gender}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Location Status Card */}
                  {patient.location ? (
                    <div className="bg-white rounded-lg shadow-md p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-green-600" />
                        <h3 className="font-semibold text-gray-900">Location Status</h3>
                      </div>

                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm font-medium text-green-900 mb-1">
                          Location Available
                        </p>
                        <p className="text-xs text-gray-600 break-words mb-2">
                          {patient.location.address || 'Location coordinates available'}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />
                          <span>
                            {patient.location.lat.toFixed(6)}, {patient.location.lng.toFixed(6)}
                          </span>
                        </div>
                      </div>

                      {patient.location.updatedAt && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span>Last updated: {formatDate(patient.location.updatedAt)}</span>
                        </div>
                      )}

                      <div className="space-y-2">
                        <button
                          onClick={getDirectionsToPatient}
                          className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2 transition-colors"
                        >
                          <Navigation2 className="w-4 h-4" />
                          Get Directions (Google Maps)
                        </button>

                        <button
                          onClick={navigateToPatient}
                          className="w-full bg-green-600 text-white py-2.5 px-4 rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2 transition-colors"
                        >
                          <Navigation className="w-4 h-4" />
                          Navigate Now
                        </button>

                        {patient.phoneNumber && (
                          <a
                            href={`tel:${patient.phoneNumber}`}
                            className="w-full bg-purple-600 text-white py-2.5 px-4 rounded-lg hover:bg-purple-700 font-medium flex items-center justify-center gap-2 transition-colors"
                          >
                            <Phone className="w-4 h-4" />
                            Call Patient
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg shadow-md p-4">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-yellow-700 mb-2">
                          <AlertCircle className="w-5 h-5" />
                          <p className="font-medium">No Location Available</p>
                        </div>
                        <p className="text-sm text-gray-600">
                          This patient hasn't shared their location yet. Please ask them to update their location in their profile.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Info Card when no patient loaded */}
              {!patient && !loading && !error && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Patient Location Tracker</h4>
                  <p className="text-sm text-gray-700">
                    This page shows the real-time location of your assigned patient. 
                    The location will load automatically when you visit this page.
                  </p>
                </div>
              )}
            </div>

            {/* Right Panel - Map */}
            <div className="lg:col-span-8">
              <div className="bg-white rounded-lg shadow-md overflow-hidden h-[500px] sm:h-[600px] lg:h-[calc(100vh-140px)] relative">
                {/* Map Status Indicator */}
                {!patient?.location && !loading && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-white rounded-lg shadow-lg p-6 text-center max-w-sm">
                    <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">
                      {loading ? 'Loading patient location...' : error ? 'Unable to display location' : 'Waiting for patient location data'}
                    </p>
                  </div>
                )}

                {loading && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                  </div>
                )}

                <Map
                  defaultCenter={defaultCenter}
                  center={patient?.location || defaultCenter}
                  defaultZoom={12}
                  zoom={patient?.location ? 15 : 12}
                  gestureHandling="greedy"
                  mapId="patient-location-map"
                >
                  {patient?.location && (
                    <Marker
                      position={{ lat: patient.location.lat, lng: patient.location.lng }}
                      title={`${patient.name}'s Location`}
                      onClick={() => setShowInfoWindow(true)}
                    />
                  )}

                  {patient?.location && showInfoWindow && (
                    <InfoWindow
                      position={{ lat: patient.location.lat, lng: patient.location.lng }}
                      onCloseClick={() => setShowInfoWindow(false)}
                    >
                      <div className="p-3 max-w-xs">
                        <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                          <User className="w-4 h-4 text-blue-600" />
                          {patient.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {patient.location.address || 'Patient Location'}
                        </p>
                        {patient.condition && (
                          <p className="text-xs text-gray-500 mb-2 capitalize">
                            Condition: {patient.condition === 'both' ? 'Diabetes & Hypertension' : patient.condition}
                          </p>
                        )}
                        {patient.location.updatedAt && (
                          <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Updated: {formatDate(patient.location.updatedAt)}
                          </p>
                        )}
                        <div className="space-y-2">
                          <button
                            onClick={getDirectionsToPatient}
                            className="w-full bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 flex items-center justify-center gap-2"
                          >
                            <Navigation2 className="w-4 h-4" />
                            Get Directions
                          </button>
                          {patient.phoneNumber && (
                            <a
                              href={`tel:${patient.phoneNumber}`}
                              className="w-full bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 flex items-center justify-center gap-2"
                            >
                              <Phone className="w-4 h-4" />
                              Call Patient
                            </a>
                          )}
                        </div>
                      </div>
                    </InfoWindow>
                  )}
                </Map>
              </div>
            </div>
          </div>
        </div>
      </div>
    </APIProvider>
  );
}