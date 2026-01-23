// app/caretaker/components/DashboardHeader.tsx
import React, { useState, useEffect } from 'react';
import { Stethoscope, User, Calendar, Building, BadgeCheck, AlertCircle } from 'lucide-react';

interface DoctorData {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string | number;
  specialization?: string;
  hospital?: string;
  licenseNumber?: string;
  diabetes?: boolean;
  hypertension?: boolean;
  conditions?: string;
  role?: string;
  createdAt: string;
  updatedAt?: string;
}

interface DashboardHeaderProps {
  doctorName?: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ doctorName }) => {
  const [doctorData, setDoctorData] = useState<DoctorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDoctorData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error('No authentication token found. Please log in again.');
        }

        console.log('Fetching doctor data from /api/doctor/me...');

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/doctor/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Authentication failed. Please log in again.');
          } else if (response.status === 403) {
            throw new Error('Access denied. This dashboard is for doctors only.');
          } else if (response.status === 404) {
            console.log('Doctor/me endpoint not found, extracting from token...');
            await extractDoctorDataFromToken(token);
            return;
          } else {
            throw new Error(`Server error: ${response.status}`);
          }
        }

        const data = await response.json();
        console.log('Doctor data received:', data);

        if (data.doctor) {
          setDoctorData(data.doctor);
        } else {
          throw new Error('Invalid response format from server');
        }
      } catch (err: any) {
        console.error('Error fetching doctor data:', err);
        setError(err.message);

        // Try to extract data from token as fallback
        const token = localStorage.getItem("token");
        if (token) {
          await extractDoctorDataFromToken(token);
        }
      } finally {
        setIsLoading(false);
      }
    };

    const extractDoctorDataFromToken = async (token: string) => {
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length < 2) {
          throw new Error('Invalid token format');
        }

        // Add proper base64 decoding with padding
        const base64Url = tokenParts[1] ?? "";
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
        const payloadJson = atob(padded);
        const payload = JSON.parse(payloadJson);

        console.log('Token payload:', payload);

        // Extract name properly - check both firstName/lastName and name fields
        let firstName = 'Doctor';
        let lastName = '';
        
        if (payload.firstName && payload.lastName) {
          firstName = payload.firstName;
          lastName = payload.lastName;
        } else if (payload.name) {
          const nameParts = payload.name.split(' ');
          firstName = nameParts[0] || 'Doctor';
          lastName = nameParts.slice(1).join(' ') || '';
        } else if (payload.firstname && payload.lastname) {
          firstName = payload.firstname;
          lastName = payload.lastname;
        }

        // Get actual doctor data from your user object if available
        const basicDoctorData: DoctorData = {
          _id: payload.userId || payload.id || 'unknown',
          firstName: firstName,
          lastName: lastName,
          email: payload.email || '',
          role: payload.role || 'doctor',
          createdAt: payload.createdAt || new Date().toISOString(),
          specialization: payload.specialization || 'General Practice',
          hospital: payload.hospital || 'Medical Center',
          licenseNumber: payload.licenseNumber || 'LIC-' + (payload.userId ? payload.userId.toString().slice(-6) : '000000'),
          diabetes: payload.diabetes || payload.disease?.includes('diabetes') || false,
          hypertension: payload.hypertension || payload.disease?.includes('hypertension') || false,
          phoneNumber: payload.phoneNumber
        };

        setDoctorData(basicDoctorData);
        // setError('Using profile data from login - complete your doctor profile for full features');
      } catch (tokenError) {
        console.error('Error extracting token data:', tokenError);
        // Minimal fallback with just the basics
        setDoctorData({
          _id: 'unknown',
          firstName: 'Doctor',
          lastName: '',
          email: '',
          role: 'doctor',
          createdAt: new Date().toISOString()
        });
        setError('Could not load complete doctor profile. Some features may be limited.');
      }
    };

    fetchDoctorData();
  }, []);

  const getCurrentGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getSpecializationBadge = (specialization?: string) => {
    if (!specialization) return 'text-gray-600 bg-gray-50 border-gray-200';

    const specializations: { [key: string]: string } = {
      'Cardiology': 'text-red-600 bg-red-50 border-red-200',
      'Endocrinology': 'text-blue-600 bg-blue-50 border-blue-200',
      'Internal Medicine': 'text-green-600 bg-green-50 border-green-200',
      'General Practice': 'text-purple-600 bg-purple-50 border-purple-200',
      'Family Medicine': 'text-orange-600 bg-orange-50 border-orange-200',
      'Nephrology': 'text-teal-600 bg-teal-50 border-teal-200',
      'Diabetology': 'text-orange-600 bg-orange-50 border-orange-200',
      'Hypertension Specialist': 'text-blue-600 bg-blue-50 border-blue-200'
    };

    return specializations[specialization] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const formatPhoneNumber = (phoneNumber?: string | number) => {
    if (!phoneNumber) return 'Not provided';
    const phoneStr = phoneNumber.toString();
    const cleaned = phoneStr.replace(/\D/g, '');

    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phoneStr;
  };

  // Format date to be more specific
  const formatCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

      if (isLoading) {
    return (
      <header className="w-full bg-white">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Stethoscope className="w-8 h-8 text-emerald-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Caretaker Dashboard</h1>
                <p className="text-sm text-emerald-600">SmartCare</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                <div className="h-3 bg-gray-100 rounded w-16"></div>
              </div>
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="w-full bg-white">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-300 p-3 rounded-md mt-3">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-3">
            <Stethoscope className="w-8 h-8 text-emerald-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Caretaker Dashboard</h1>
              <p className="text-sm text-emerald-600">SmartCare</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="font-medium text-gray-900">
                {getCurrentGreeting()}, Dr. {doctorData?.firstName} {doctorData?.lastName}
              </p>
              <p className="text-sm text-emerald-600">
                {formatCurrentDate()}
              </p>
            </div>
            <div className="relative">
              <User className="w-8 h-8 bg-emerald-100 rounded-full p-1 text-emerald-600" />
              {doctorData?.licenseNumber && (
                <BadgeCheck className="w-3 h-3 text-emerald-600 absolute -top-1 -right-1" />
              )}
            </div>
          </div>
        </div>

        {doctorData && (
          <div className="border-t border-gray-200 pt-4 pb-4">
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700">
              {doctorData.specialization && (
                <div className="flex items-center space-x-2">
                  <Stethoscope className="w-4 h-4 text-emerald-600" />
                  <span className="font-medium text-emerald-700">Specialization:</span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium border border-emerald-200 bg-emerald-50 text-emerald-800">
                    {doctorData.specialization}
                  </span>
                </div>
              )}

              {doctorData.hospital && doctorData.hospital !== 'Medical Center' && (
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4 text-emerald-600" />
                  <span className="font-medium text-emerald-700">Hospital:</span>
                  <span className="text-emerald-700">{doctorData.hospital}</span>
                </div>
              )}

              {doctorData.licenseNumber && !doctorData.licenseNumber.startsWith('LIC-000000') && (
                <div className="flex items-center space-x-2">
                  <BadgeCheck className="w-4 h-4 text-emerald-600" />
                  <span className="font-medium text-emerald-700">License:</span>
                  <span className="text-emerald-700 font-mono text-xs">{doctorData.licenseNumber}</span>
                </div>
              )}

              {doctorData.phoneNumber && (
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-emerald-700">Phone:</span>
                  <span className="text-emerald-700">{formatPhoneNumber(doctorData.phoneNumber)}</span>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span className="font-medium text-emerald-700">Treats:</span>
                <div className="flex space-x-2">
                  {doctorData.diabetes && (
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-800 text-xs rounded-full border border-emerald-200">
                      Diabetes
                    </span>
                  )}
                  {doctorData.hypertension && (
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-800 text-xs rounded-full border border-emerald-200">
                      Hypertension
                    </span>
                  )}
                  {!doctorData.diabetes && !doctorData.hypertension && doctorData.specialization && (
                    <span className="text-emerald-700 text-xs">{doctorData.specialization}</span>
                  )}
                  {!doctorData.diabetes && !doctorData.hypertension && !doctorData.specialization && (
                    <span className="text-emerald-700 text-xs">General Practice</span>
                  )}
                </div>
              </div>

              {doctorData.createdAt && (
                <div className="flex items-center space-x-2 ml-auto">
                  <span className="font-medium text-emerald-700">Member since:</span>
                  <span className="text-emerald-700">
                    {new Date(doctorData.createdAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default DashboardHeader;