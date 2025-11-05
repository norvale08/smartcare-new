"use client";

import React, { useState, useEffect } from "react";
import { 
  HeartPulse, Users, Search, Phone, MessageSquare, Calendar,
  Stethoscope, AlertTriangle, CheckCircle, Clock, Filter
} from "lucide-react";
import { useSession } from "next-auth/react";
import { Button, Input, Card, CardHeader, CardContent, CardTitle } from "@repo/ui";
import DashboardHeader from "./components/DashboardHeader";
import PatientSearch from "./components/PatientSearch"
import PatientRequests from "./components/PatientRequests";
import PatientTabs from './components/PatientTabs';
import RealTimeNotifications from './components/RealTimeNotifications';

interface Patient {
  id: string;
  userId?: string;
  fullName: string;
  age: number;
  gender: string;
  condition: "hypertension" | "diabetes" | "both";
  lastVisit: string;
  status: "stable" | "warning" | "critical";
  phoneNumber?: string;
  email?: string;
}

interface VitalSigns {
  id?: string;
  systolic?: number;
  diastolic?: number;
  heartRate?: number;
  glucose?: number;
  timestamp: string;
  patientId: string;
}

interface PatientRequest {
  patientId: string;
  patientName: string;
  requestedAt: string;
  status: 'pending' | 'accepted' | 'rejected';
  _id?: string;
}

const CaretakerDashboard = () => {
  const { data: session, status } = useSession();
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientVitals, setPatientVitals] = useState<VitalSigns[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCondition, setFilterCondition] = useState<"all" | "hypertension" | "diabetes" | "both">("all");
  const [isLoading, setIsLoading] = useState(false);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [hasToken, setHasToken] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Extract role from JWT token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const tokenParts = token.split(".");
        if (tokenParts.length === 3) {
          const base64 = tokenParts[1];
          if (base64) {
            const payload = JSON.parse(atob(base64));
            setUserRole(payload?.role ?? null);
          }
        }
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      setHasToken(!!token);
    }
  }, []);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(''), 3000);
    return () => clearTimeout(t);
  }, [message]);

  // Update the useEffect that fetches assigned patients to include refreshTrigger
  useEffect(() => {
    if (status === "authenticated" || hasToken) {
      fetchAssignedPatients();
    }
  }, [status, hasToken, refreshTrigger]);

  const fetchAssignedPatients = async () => {
    try {
      setPatientsLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/doctor/assigned-patients`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.");
        }
        if (response.status === 404) {
          setPatients([]);
          return;
        }
        throw new Error(`Failed to fetch patients: ${response.status}`);
      }

      const data = await response.json();
      
      console.log("🔄 ASSIGNED PATIENTS RAW DATA:", data);
      
      let patientsData: Patient[] = [];
      
      if (Array.isArray(data)) {
        patientsData = data;
      } else if (data.patients) {
        patientsData = data.patients;
      } else if (data.data) {
        patientsData = data.data;
      }
      
      // Log patient IDs for debugging
      console.log("👥 PROCESSED PATIENTS:", patientsData.map(p => ({
        id: p.id,
        userId: p.userId,
        name: p.fullName,
        condition: p.condition
      })));
      
      setPatients(patientsData);
      
    } catch (error: any) {
      console.error("Failed to fetch assigned patients:", error);
      setError(error.message);
    } finally {
      setPatientsLoading(false);
    }
  };

  const fetchPatientVitals = async (patientId: string) => {
    try {
      setIsLoading(true);
      setPatientVitals([]);
      const token = localStorage.getItem("token");
      
      console.log("🩺 ===== FETCHING PATIENT VITALS =====");
      console.log("👤 Patient ID:", patientId);
      console.log("🔑 Token exists:", !!token);

      if (!token) {
        throw new Error("No authentication token found");
      }

      // Try multiple possible API endpoints
      const apiEndpoints = [
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/patient/vitals/${patientId}`,
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/patient/${patientId}/vitals`,
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/vitals/patient/${patientId}`,
      ];

      let response = null;
      let lastError = null;

      // Try each endpoint until one works
      for (const apiUrl of apiEndpoints) {
        console.log("🌐 Trying API endpoint:", apiUrl);
        
        try {
          response = await fetch(apiUrl, {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
          });

          console.log("📡 Response status:", response.status);
          
          if (response.ok) {
            const result = await response.json();
            console.log("✅ SUCCESS with endpoint:", apiUrl);
            console.log("📊 Vitals data received:", {
              success: result.success,
              count: result.count,
              dataLength: result.data?.length,
              data: result.data
            });

            if (result.success && Array.isArray(result.data) && result.data.length > 0) {
              const validatedVitals = result.data.map((vital: any) => ({
                ...vital,
                patientId: patientId,
                timestamp: vital.timestamp || vital.createdAt || vital.date || new Date().toISOString()
              }));
              
              setPatientVitals(validatedVitals);
              console.log(`✅ Loaded ${validatedVitals.length} vitals`);
              return;
            } else {
              console.log("⚠️ No vitals data in response");
              setPatientVitals([]);
              return;
            }
          } else if (response.status !== 404) {
            // If it's not 404, continue to next endpoint
            continue;
          }
        } catch (err) {
          console.log(`❌ Endpoint ${apiUrl} failed:`, err);
          lastError = err;
          continue;
        }
      }

      // If we get here, no endpoint worked
      console.log("❌ All API endpoints failed");
      setPatientVitals([]);
      
    } catch (error: any) {
      console.error("❌ Failed to fetch patient vitals:", error);
      setPatientVitals([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    console.log("🔄 ===== PATIENT SELECTED =====");
    console.log("👤 Selected Patient:", {
      id: patient.id,
      userId: patient.userId,
      name: patient.fullName,
      condition: patient.condition
    });
    
    // Try userId first, then fall back to id
    const patientIdentifier = patient.userId || patient.id;
    console.log("🔍 Using patient identifier:", patientIdentifier);
    
    setSelectedPatient(patient);
    setPatientVitals([]); // Clear previous vitals
    
    fetchPatientVitals(patientIdentifier);
  };

  // Add this function to test the API directly
  const testVitalsAPI = async (patientId: string) => {
    const token = localStorage.getItem("token");
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/patient/vitals/${patientId}`;
    
    console.log("🧪 TESTING API DIRECTLY:", apiUrl);
    
    try {
      const response = await fetch(apiUrl, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      console.log("🧪 TEST RESPONSE:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      const text = await response.text();
      console.log("🧪 TEST RESPONSE TEXT:", text);
      
      try {
        const json = JSON.parse(text);
        console.log("🧪 TEST RESPONSE JSON:", json);
      } catch (e) {
        console.log("🧪 Response is not JSON");
      }
    } catch (error) {
      console.error("🧪 TEST ERROR:", error);
    }
  };

  // Call test function when patient is selected
  useEffect(() => {
    if (selectedPatient) {
      const patientIdentifier = selectedPatient.userId || selectedPatient.id;
      testVitalsAPI(patientIdentifier);
    }
  }, [selectedPatient]);

  const refreshAssignedPatients = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const refreshVitals = () => {
    if (selectedPatient) {
      const patientIdentifier = selectedPatient.userId || selectedPatient.id;
      fetchPatientVitals(patientIdentifier);
    }
  };

  // Rest of your existing functions (handleSignInPatient, updatePatientLastVisit, etc.)
  const handleSignInPatient = async (patientId: string) => {
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch('/api/doctor/sign-in-patient', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ patientId }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          updatePatientLastVisit(patientId);
          return;
        }
        throw new Error(`Failed to sign in patient: ${response.status}`);
      }

      updatePatientLastVisit(patientId);
      
    } catch (error: any) {
      console.error("Failed to sign in patient:", error);
      updatePatientLastVisit(patientId);
    }
  };

  const updatePatientLastVisit = (patientId: string) => {
    setPatients(prev => prev.map(p => 
      p.id === patientId ? { ...p, lastVisit: new Date().toISOString() } : p
    ));
    
    if (selectedPatient?.id === patientId) {
      setSelectedPatient(prev => 
        prev ? { ...prev, lastVisit: new Date().toISOString() } : null
      );
    }
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCondition = filterCondition === "all" || patient.condition === filterCondition;
    return matchesSearch && matchesCondition;
  });

  const getStatusIcon = (status: Patient["status"]) => {
    switch (status) {
      case "stable":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "critical":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getConditionColor = (condition: Patient["condition"]) => {
    switch (condition) {
      case "hypertension":
        return "bg-blue-100 text-blue-800";
      case "diabetes":
        return "bg-orange-100 text-orange-800";
      case "both":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Debug effect to log vitals changes
  useEffect(() => {
    console.log("📊 PATIENT VITALS STATE UPDATED:", {
      count: patientVitals.length,
      vitals: patientVitals
    });
  }, [patientVitals]);

  // Conditional renders...
  if (status === "loading") {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>;
  }

  if ((status === "unauthenticated" && !hasToken) || (hasToken && userRole !== "doctor")) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">This dashboard is for doctors only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <DashboardHeader />
      <RealTimeNotifications />

      <main className="flex flex-col items-center px-4 py-6 gap-6">
        {message && (
          <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 w-full max-w-7xl">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              <p className="ml-3 text-sm text-yellow-700">{error}</p>
            </div>
          </div>
        )}

        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Patients List */}
          <div className="lg:col-span-1 space-y-6">
            <PatientRequests onRequestUpdate={refreshAssignedPatients} />
            <PatientSearch onPatientAssign={refreshAssignedPatients} assignedPatients={patients.map(p => p.id)} />
            
            {/* Assigned Patients Card */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Assigned Patients</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Search patients..."
                      className="w-full pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={filterCondition}
                    onChange={(e) => setFilterCondition(e.target.value as any)}
                  >
                    <option value="all">All Conditions</option>
                    <option value="hypertension">Hypertension</option>
                    <option value="diabetes">Diabetes</option>
                    <option value="both">Both</option>
                  </select>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredPatients.map((patient) => (
                    <div
                      key={patient.id}
                      className={`p-3 rounded-lg border cursor-pointer ${
                        selectedPatient?.id === patient.id ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"
                      }`}
                      onClick={() => handlePatientSelect(patient)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-gray-900">{patient.fullName}</h3>
                            {getStatusIcon(patient.status)}
                          </div>
                          <p className="text-sm text-gray-500">{patient.age}y • {patient.gender}</p>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getConditionColor(patient.condition)}`}>
                            {patient.condition}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSignInPatient(patient.id);
                          }}
                        >
                          Sign In
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {selectedPatient ? (
              <>
                <Card className="shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{selectedPatient.fullName}</h2>
                        <p className="text-gray-600">
                          {selectedPatient.age} years • {selectedPatient.gender} • {selectedPatient.condition}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Patient ID: {selectedPatient.id} {selectedPatient.userId && `• User ID: ${selectedPatient.userId}`}
                        </p>
                      </div>
                      <div className="flex space-x-3">
                        <Button variant="outline">Message</Button>
                        <Button className="bg-green-600 hover:bg-green-700">Call</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <PatientTabs
                  patient={selectedPatient}
                  patientVitals={patientVitals}
                  isLoading={isLoading}
                  // onRefreshVitals={refreshVitals}
                />
              </>
            ) : (
              <Card className="shadow-lg">
                <CardContent className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Patient Selected</h3>
                  <p className="text-gray-500">Select a patient from the list to view their details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CaretakerDashboard;