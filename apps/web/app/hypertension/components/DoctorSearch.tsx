// app/patient/components/DoctorSearch.tsx
import React, { useState, useEffect } from 'react';
import { Search, UserPlus, CheckCircle, X, Users, Building, Star, AlertCircle,Filter} from 'lucide-react';
import { Input, Button, Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { useTranslation } from "../../../lib/TranslationContext";

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
  const { t, language } = useTranslation();
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
        throw new Error(language === "en-US" ? 'No authentication token found' : 'Hakuna token ya utambulisho iliyopatikana');
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
          throw new Error(language === "en-US" ? 'Authentication failed. Please log in again.' : 'Uthibitishaji umeshindwa. Tafadhali ingia tena.');
        }
        throw new Error(language === "en-US" 
          ? `Search failed with status: ${response.status}`
          : `Utafutaji umeshindwa na hali: ${response.status}`
        );
      }

      const data = await response.json();
      
      if (data.success && data.doctors) {
        setSearchResults(data.doctors);
        if (data.doctors.length === 0) {
          setError(language === "en-US" ? 'No doctors found matching your search' : 'Hakuna madaktari waliofanana na utafutaji wako');
        }
      } else {
        throw new Error(data.message || (language === "en-US" ? 'Search request failed' : 'Ombi la utafutaji limeshindwa'));
      }
      
    } catch (error: any) {
      console.error('Doctor search error:', error);
      
      // Check if it's a network error (backend offline)
      if (error.message?.includes('Failed to fetch') || 
          error.message?.includes('NetworkError') || 
          error.message?.includes('Network request failed') ||
          error.name === 'TypeError' && error.message?.includes('fetch')) {
        setError(language === "en-US" 
          ? 'Backend is offline. Please check if the server is running.'
          : 'Backend haipo. Tafadhali hakikisha server inaendesha.'
        );
      } else {
        setError(error.message);
      }
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
        throw new Error(language === "en-US" ? 'No authentication token found' : 'Hakuna token ya utambulisho iliyopatikana');
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
        throw new Error(errorData.message || (language === "en-US" 
          ? `Request failed: ${response.status}`
          : `Ombi limeshindwa: ${response.status}`
        ));
      }

      const result = await response.json();
      
      // Find the doctor data to pass to parent
      const doctorData = searchResults.find(d => d.id === doctorId);
      
      // Notify parent component
      onDoctorRequest(doctorId, doctorData);
      setError(language === "en-US" 
        ? `Successfully requested ${doctorData?.fullName || 'the doctor'}!`
        : `Umeomba kwa mafanikio ${doctorData?.fullName || 'daktari'}!`
      );
      
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
    <div className="space-y-4">
      {/* Search Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-gray-900">
            {language === "en-US" ? "Search Our Medical Network" : "Tafuta Katika Mtandao Wetu wa Matibabu"}
          </h4>
          <p className="text-sm text-gray-600">
            {language === "en-US" ? "Find specialists based on your needs" : "Pata wataalamu kulingana na mahitaji yako"}
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Users className="w-4 h-4" />
          <span>
            {searchResults.length} {language === "en-US" ? "doctors available" : "madaktari wanapatikana"}
          </span>
        </div>
      </div>

      {/* Search Input with Filters */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          type="text"
          placeholder={language === "en-US" 
            ? "Search by name, specialization, hospital, or condition..."
            : "Tafuta kwa jina, utaalam, hospitali, au hali ya afya..."
          }
          className="w-full pl-12 pr-24 py-3 text-base border-2 border-gray-200 focus:border-blue-500 transition-colors"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          <Button variant="outline" size="sm" className="flex items-center space-x-1">
            <Filter className="w-4 h-4" />
            <span>{language === "en-US" ? "Filters" : "Vichujio"}</span>
          </Button>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className={`p-3 rounded-lg flex items-start space-x-3 ${
          error.includes('Successfully') || error.includes('Umeomba')
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <span className="font-medium">{error}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setError(null)} className="flex-shrink-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Search Results */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-gray-600 font-medium">
              {language === "en-US" ? "Searching our database..." : "Inatafuta kwenye hifadhidata yetu..."}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {language === "en-US" ? "Finding the best doctors for you" : "Kupata madaktari bora kwako"}
            </p>
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
                    {/* Doctor Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-bold text-lg text-gray-900">{doctor.fullName}</h4>
                          {isRequested && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              {language === "en-US" ? "Requested" : "Imeombwa"}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-3 text-sm text-gray-600">
                          <span className={`inline-block px-3 py-1 rounded-full font-semibold ${getSpecializationColor(doctor.specialization)}`}>
                            {doctor.specialization}
                          </span>
                          <span className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-400 mr-1" />
                            {doctor.rating.toFixed(1)}
                          </span>
                          <span>• {doctor.experience} {language === "en-US" ? "years" : "miaka"}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Hospital and Contact */}
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

                    {/* Conditions Treated */}
                    <div className="flex flex-wrap gap-2">
                      {doctor.treatsHypertension && (
                        <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded border border-blue-200">
                          {language === "en-US" ? "Hypertension" : "Shinikizo la Damu"}
                        </span>
                      )}
                      {doctor.treatsDiabetes && (
                        <span className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded border border-green-200">
                          {language === "en-US" ? "Diabetes" : "Kisukari"}
                        </span>
                      )}
                      {doctor.treatsCardiovascular && (
                        <span className="bg-red-50 text-red-700 text-xs px-2 py-1 rounded border border-red-200">
                          {language === "en-US" ? "Cardiovascular" : "Moyo na Mishipa"}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Request Button */}
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
                          {language === "en-US" ? "Requested" : "Imeombwa"}
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          {language === "en-US" ? "Request" : "Omba"}
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
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <h4 className="font-semibold text-gray-700 mb-1">
              {language === "en-US" ? "No doctors found" : "Hakuna madaktari walio patikana"}
            </h4>
            <p className="text-gray-500 text-sm">
              {language === "en-US" ? "Try adjusting your search terms or filters" : "Jaribu kurekebisha maneno yako ya utafutaji au vichujio"}
            </p>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <h4 className="font-semibold text-gray-700 mb-1">
              {language === "en-US" ? "Ready to find your doctor?" : "Uko tayari kupata daktari wako?"}
            </h4>
            <p className="text-gray-500 text-sm">
              {language === "en-US" ? "Search by name, specialization, or hospital to get started" : "Tafuta kwa jina, utaalam, au hospitali kuanza"}
            </p>
          </div>
        )}
      </div>

      {/* Requested Count */}
      {requestedDoctors.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
          <CheckCircle className="w-5 h-5 inline mr-2 text-blue-600" />
          <span className="text-blue-800 font-medium">
            {language === "en-US" 
              ? `You've requested ${requestedDoctors.length} doctor${requestedDoctors.length !== 1 ? 's' : ''}`
              : `Umeomba madaktari ${requestedDoctors.length}`
            }
          </span>
        </div>
      )}
    </div>
  );
};

export default DoctorSearch;