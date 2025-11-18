// app/caretaker/components/PatientSearch.tsx
import React, { useState, useEffect } from 'react';
import { Search, UserPlus, CheckCircle, X, Users, AlertCircle } from 'lucide-react';
import { Input, Button, Card, CardContent, CardHeader, CardTitle } from '@repo/ui';

interface Patient {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  condition: 'hypertension' | 'diabetes' | 'both';
  createdAt: string;
}

interface PatientSearchProps {
  onPatientAssign: (patientId: string) => void;
  assignedPatients: string[];
}

const PatientSearch: React.FC<PatientSearchProps> = ({ onPatientAssign, assignedPatients }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [conditionFilter, setConditionFilter] = useState<'all' | 'hypertension' | 'diabetes' | 'both'>('all');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the base API URL from environment or use default
  const getApiBaseUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  };

  // Helper function to safely parse condition
  const parseCondition = (condition: string): 'hypertension' | 'diabetes' | 'both' => {
    if (condition === 'hypertension' || condition === 'diabetes' || condition === 'both') {
      return condition;
    }
    // Default to hypertension if condition is unexpected
    return 'hypertension';
  };

  // Search patients from Express API
  const searchPatients = async (query: string, condition: string) => {
    if (!query.trim() && condition === 'all') {
      setSearchResults([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Build the API URL with query parameters - pointing to Express backend
      const params = new URLSearchParams();
      if (query.trim()) params.append('q', query);
      if (condition !== 'all') params.append('condition', condition);

      const apiUrl = `${getApiBaseUrl()}/api/patients/search?${params.toString()}`;
      console.log('Searching patients with URL:', apiUrl);

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Search response status:', response.status);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Search endpoint not found. Please check the backend server.');
        }
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        throw new Error(`Search failed with status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Search results:', data);
      
      // Safely parse the patients data with proper typing
      const typedPatients: Patient[] = (data.patients || []).map((patient: any) => ({
        id: patient.id,
        fullName: patient.fullName,
        email: patient.email,
        phoneNumber: patient.phoneNumber,
        condition: parseCondition(patient.condition),
        createdAt: patient.createdAt
      }));
      
      setSearchResults(typedPatients);
      
    } catch (error: any) {
      console.error('Patient search error:', error);
      setError(error.message);
      // Fallback to mock data if API fails
      await loadMockPatients(query, condition);
    } finally {
      setIsLoading(false);
    }
  };

  // Mock data fallback - FIXED with proper typing
  const loadMockPatients = async (query: string, condition: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Define mock patients with proper type assertions
    const mockPatients: Patient[] = [
      {
        id: "1",
        fullName: "John Smith",
        email: "john.smith@example.com",
        phoneNumber: "+1234567890",
        condition: "hypertension" as const, // Use 'as const' for literal types
        createdAt: new Date().toISOString()
      },
      {
        id: "2",
        fullName: "Maria Garcia", 
        email: "maria.garcia@example.com",
        phoneNumber: "+1234567891",
        condition: "diabetes" as const, // Use 'as const' for literal types
        createdAt: new Date().toISOString()
      },
      {
        id: "3",
        fullName: "Robert Johnson",
        email: "robert.johnson@example.com", 
        phoneNumber: "+1234567892",
        condition: "both" as const, // Use 'as const' for literal types
        createdAt: new Date().toISOString()
      },
    ].filter(patient => {
      const matchesSearch = patient.fullName.toLowerCase().includes(query.toLowerCase()) || 
                           patient.email.toLowerCase().includes(query.toLowerCase());
      const matchesCondition = condition === 'all' || patient.condition === condition;
      return matchesSearch && matchesCondition;
    });

    setSearchResults(mockPatients);
    if (query || condition !== 'all') {
      setError("Using demo data - Backend API not available");
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim() || conditionFilter !== 'all') {
        searchPatients(searchQuery, conditionFilter);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, conditionFilter]);

  const handleAssignPatient = async (patientId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Call Express API to assign patient to doctor
      const response = await fetch(`${getApiBaseUrl()}/api/doctor/assign-patient`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ patientId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Assignment failed: ${response.status}`);
      }

      const result = await response.json();
      
      // Notify parent component
      onPatientAssign(patientId);
      
    } catch (error: any) {
      console.error('Patient assignment error:', error);
      setError(error.message);
    }
  };

  const getConditionColor = (condition: Patient['condition']) => {
    switch (condition) {
      case 'hypertension':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'diabetes':
        return 'bg-orange-100 text-orange-800 border border-orange-200';
      case 'both':
        return 'bg-purple-100 text-purple-800 border border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getConditionLabel = (condition: Patient['condition']) => {
    switch (condition) {
      case 'hypertension':
        return 'Hypertension';
      case 'diabetes':
        return 'Diabetes';
      case 'both':
        return 'Both Conditions';
      default:
        return condition;
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="w-5 h-5" />
          <span>Find Patients to Assign</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search patients by name or email..."
            className="w-full pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Condition Filter */}
        <div className="flex space-x-2">
          <select
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value as any)}
          >
            <option value="all">All Conditions</option>
            <option value="hypertension">Hypertension</option>
            <option value="diabetes">Diabetes</option>
            <option value="both">Both Conditions</option>
          </select>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-2 rounded text-sm flex items-start space-x-2">
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
              <p className="text-sm text-gray-500 mt-2">Searching patients...</p>
            </div>
          ) : searchResults.length > 0 ? (
            searchResults.map((patient) => {
              const isAssigned = assignedPatients.includes(patient.id);
              
              return (
                <div
                  key={patient.id}
                  className="p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{patient.fullName}</h4>
                        {isAssigned && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{patient.email}</p>
                      {patient.phoneNumber && (
                        <p className="text-sm text-gray-500 mb-2">📞 {patient.phoneNumber}</p>
                      )}
                      <div className="flex items-center space-x-2">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(patient.condition)}`}>
                          {getConditionLabel(patient.condition)}
                        </span>
                        <span className="text-xs text-gray-400">
                          Joined: {new Date(patient.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      disabled={isAssigned}
                      onClick={() => handleAssignPatient(patient.id)}
                      className={isAssigned ? 
                        'bg-green-100 text-green-800 hover:bg-green-100 border border-green-200' : 
                        'bg-blue-600 hover:bg-blue-700'
                      }
                    >
                      {isAssigned ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Assigned
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-1" />
                          Assign
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (searchQuery || conditionFilter !== 'all') && !isLoading ? (
            <div className="text-center py-6 text-gray-500">
              <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No patients found matching your criteria</p>
              <p className="text-sm mt-1">Try adjusting your search terms or filters</p>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>Enter search terms to find patients</p>
              <p className="text-sm mt-1">Search by name, email, or filter by condition</p>
            </div>
          )}
        </div>

        {/* Assigned Count */}
        {assignedPatients.length > 0 && (
          <div className="text-sm text-gray-600 text-center border-t pt-3">
            <CheckCircle className="w-4 h-4 inline mr-1 text-green-500" />
            {assignedPatients.length} patient(s) assigned to you
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PatientSearch;