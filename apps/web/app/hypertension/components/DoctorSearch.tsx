// app/patient/components/DoctorSearch.tsx
import React, { useState, useEffect } from 'react';
import { Search, UserPlus, CheckCircle, X, Users, Building, Star, AlertCircle } from 'lucide-react';
import { Input, Button, Card, CardContent, CardHeader, CardTitle } from '@repo/ui';

interface Doctor {
  id: string;
  fullName: string;
  email: string;
  specialization: string;
  hospital: string;
  phoneNumber?: string;
  licenseNumber?: string;
  experience: number;
  rating: number;
  isAvailable: boolean;
  conditions: string[];
  treatsDiabetes: boolean;
  treatsHypertension: boolean;
  treatsCardiovascular: boolean;
  createdAt: string;
}

interface DoctorSearchProps {
  onDoctorRequest: (doctorId: string, doctorData?: Doctor) => void;
  requestedDoctors: string[];
}

const DoctorSearch: React.FC<DoctorSearchProps> = ({ onDoctorRequest, requestedDoctors }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the base API URL from environment or use default
  const getApiBaseUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  };

  // Search doctors from Express API
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

      // Build the API URL with query parameters
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

  // Debounced search
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

      // Call Express API to request doctor
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
      
      // Find the doctor data to pass to parent
      const doctorData = searchResults.find(d => d.id === doctorId);
      
      // Notify parent component
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
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">({rating.toFixed(1)})</span>
      </div>
    );
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="w-5 h-5" />
          <span>Find Doctors</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search doctors by name, specialization, or hospital..."
            className="w-full pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className={`px-3 py-2 rounded text-sm flex items-start space-x-2 ${
            error.includes('Successfully') 
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <span>{error}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setError(null)} className="flex-shrink-0">
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Search Results */}
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Searching doctors...</p>
            </div>
          ) : searchResults.length > 0 ? (
            searchResults.map((doctor) => {
              const isRequested = requestedDoctors.includes(doctor.id);
              
              return (
                <div
                  key={doctor.id}
                  className="p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{doctor.fullName}</h4>
                        {isRequested && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getSpecializationColor(doctor.specialization)}`}>
                            {doctor.specialization}
                          </span>
                          <span>{doctor.experience} years experience</span>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Building className="w-4 h-4" />
                          <span>{doctor.hospital}</span>
                        </div>
                        
                        {doctor.phoneNumber && (
                          <div className="text-sm text-gray-600">
                            📞 {doctor.phoneNumber}
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2">
                          {renderStars(doctor.rating)}
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      disabled={isRequested}
                      onClick={() => handleRequestDoctor(doctor.id)}
                      className={isRequested ? 
                        'bg-green-100 text-green-800 hover:bg-green-100 border border-green-200' : 
                        'bg-blue-600 hover:bg-blue-700'
                      }
                    >
                      {isRequested ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Requested
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-1" />
                          Request
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })
          ) : searchQuery && !isLoading ? (
            <div className="text-center py-6 text-gray-500">
              <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No doctors found matching your search</p>
              <p className="text-sm mt-1">Try adjusting your search terms</p>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>Search for doctors</p>
              <p className="text-sm mt-1">Enter a name, specialization, or hospital to find doctors</p>
            </div>
          )}
        </div>

        {/* Requested Count */}
        {requestedDoctors.length > 0 && (
          <div className="text-sm text-gray-600 text-center border-t pt-3">
            <CheckCircle className="w-4 h-4 inline mr-1 text-green-500" />
            {requestedDoctors.length} doctor(s) requested
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DoctorSearch;