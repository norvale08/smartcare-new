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

  // Real-time updates simulation
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAssignedPatients();
    }, 30000);

    return () => clearInterval(interval);
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
      
      if (Array.isArray(data)) {
        setPatients(data);
      } else if (data.patients) {
        setPatients(data.patients);
      } else if (data.data) {
        setPatients(data.data);
      } else {
        setPatients([]);
      }
    } catch (error: any) {
      console.error("Failed to fetch assigned patients:", error);
      setError(error.message);
    } finally {
      setPatientsLoading(false);
    }
  };

  const handlePatientAssign = (patientId: string) => {
    fetchAssignedPatients();
    setMessage(`Patient assigned successfully!`);
  };

  const refreshAssignedPatients = () => {
    setRefreshTrigger(prev => prev + 1);
    fetchAssignedPatients();
  };

  const fetchPatientVitals = async (patientId: string) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`/api/patient/${patientId}/vitals`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          await loadMockVitals(patientId);
          return;
        }
        throw new Error(`Failed to fetch vitals: ${response.status}`);
      }

      const data = await response.json();
      
      if (Array.isArray(data)) {
        setPatientVitals(data);
      } else if (data.vitals) {
        setPatientVitals(data.vitals);
      } else if (data.data) {
        setPatientVitals(data.data);
      } else {
        await loadMockVitals(patientId);
      }
    } catch (error: any) {
      console.error("Failed to fetch patient vitals:", error);
      await loadMockVitals(patientId);
    } finally {
      setIsLoading(false);
    }
  };

  // Mock vitals data fallback
  const loadMockVitals = async (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    const now = new Date();
    
    const mockVitals: VitalSigns[] = [
      {
        id: "1",
        systolic: patient?.condition === "diabetes" ? undefined : 145,
        diastolic: patient?.condition === "diabetes" ? undefined : 92,
        heartRate: patient?.condition === "diabetes" ? undefined : 88,
        glucose: patient?.condition === "hypertension" ? undefined : 165,
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        patientId: patientId
      },
      {
        id: "2",
        systolic: patient?.condition === "diabetes" ? undefined : 138,
        diastolic: patient?.condition === "diabetes" ? undefined : 85,
        heartRate: patient?.condition === "diabetes" ? undefined : 82,
        glucose: patient?.condition === "hypertension" ? undefined : 142,
        timestamp: new Date(now.getTime() - 26 * 60 * 60 * 1000).toISOString(),
        patientId: patientId
      },
    ].filter(vital => 
      (patient?.condition === "hypertension" && (vital.systolic || vital.heartRate)) ||
      (patient?.condition === "diabetes" && vital.glucose) ||
      (patient?.condition === "both" && (vital.systolic || vital.glucose))
    );

    setPatientVitals(mockVitals);
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    fetchPatientVitals(patient.id);
  };

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

  // Add refresh function for vitals
  const refreshVitals = () => {
    if (selectedPatient) {
      fetchPatientVitals(selectedPatient.id);
    }
  };

  // CONDITIONAL RENDERS MUST COME AFTER ALL HOOKS
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Check access based on token role instead of session role
  if ((status === "unauthenticated" && !hasToken) || (hasToken && userRole !== "doctor")) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">This dashboard is for doctors only.</p>
          {userRole && (
            <p className="text-sm text-gray-500 mt-2">Your role: {userRole}</p>
          )}
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
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <PatientRequests onRequestUpdate={() => {
              refreshAssignedPatients();
            }} />
            
            <PatientSearch 
              onPatientAssign={handlePatientAssign}
              assignedPatients={patients.map(p => p.id)}
            />
            
            {/* Assigned Patients Card */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Assigned Patients</span>
                  {patientsLoading && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      Loading...
                    </span>
                  )}
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
                      disabled={patientsLoading}
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    <select
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                      value={filterCondition}
                      onChange={(e) => setFilterCondition(e.target.value as any)}
                      disabled={patientsLoading}
                    >
                      <option value="all">All Conditions</option>
                      <option value="hypertension">Hypertension</option>
                      <option value="diabetes">Diabetes</option>
                      <option value="both">Both</option>
                    </select>
                    <Filter className={`w-5 h-5 mt-2 ${patientsLoading ? 'text-gray-300' : 'text-gray-400'}`} />
                  </div>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {patientsLoading ? (
                    // Loading skeleton
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="p-3 rounded-lg border bg-white animate-pulse"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <div className="h-4 bg-gray-200 rounded w-24"></div>
                                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                              </div>
                              <div className="h-3 bg-gray-200 rounded w-16 mb-2"></div>
                              <div className="h-6 bg-gray-200 rounded w-20"></div>
                            </div>
                            <div className="ml-2">
                              <div className="h-6 bg-gray-200 rounded w-16"></div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 mt-2">
                            <div className="w-3 h-3 bg-gray-200 rounded"></div>
                            <div className="h-3 bg-gray-200 rounded w-20"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredPatients.length > 0 ? (
                    filteredPatients.map((patient) => (
                      <div
                        key={patient.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedPatient?.id === patient.id
                            ? "bg-blue-50 border-blue-200"
                            : "bg-white border-gray-200 hover:bg-gray-50"
                        }`}
                        onClick={() => handlePatientSelect(patient)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium text-gray-900">{patient.fullName}</h3>
                              {getStatusIcon(patient.status)}
                            </div>
                            <p className="text-sm text-gray-500">
                              {patient.age}y • {patient.gender}
                            </p>
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
                        <div className="flex items-center space-x-1 text-xs text-gray-400 mt-2">
                          <Clock className="w-3 h-3" />
                          <span>Last: {new Date(patient.lastVisit).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      {patients.length === 0 ? (
                        <div>
                          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="font-medium text-gray-900 mb-1">No patients assigned yet</p>
                          <p className="text-sm">Patients will appear here when they request you and you accept them</p>
                        </div>
                      ) : (
                        <div>
                          <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="font-medium text-gray-900 mb-1">No patients found</p>
                          <p className="text-sm">Try adjusting your search or filter criteria</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Patient Count */}
                {!patientsLoading && filteredPatients.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-center">
                      Showing {filteredPatients.length} of {patients.length} assigned patients
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Today's Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Patients</span>
                  <span className="font-medium">{patients.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Signed In</span>
                  <span className="font-medium text-green-600">
                    {patients.filter(p => new Date(p.lastVisit).toDateString() === new Date().toDateString()).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Needs Attention</span>
                  <span className="font-medium text-red-600">
                    {patients.filter(p => p.status === "critical").length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {selectedPatient ? (
              <>
                {/* Patient Header */}
                <Card className="shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          {selectedPatient.fullName}
                        </h2>
                        <p className="text-gray-600">
                          {selectedPatient.age} years • {selectedPatient.gender} • {selectedPatient.condition}
                        </p>
                      </div>
                      <div className="flex space-x-3">
                        <Button variant="outline" className="flex items-center space-x-2">
                          <MessageSquare className="w-4 h-4" />
                          <span>Message</span>
                        </Button>
                        <Button className="flex items-center space-x-2 bg-green-600 hover:bg-green-700">
                          <Phone className="w-4 h-4" />
                          <span>Call</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Patient Tabs - This replaces all the individual components */}
                <PatientTabs
                  patient={selectedPatient}
                  patientVitals={patientVitals}
                  isLoading={isLoading}
                  
                />
              </>
            ) : (
              <Card className="shadow-lg">
                <CardContent className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Patient Selected
                  </h3>
                  <p className="text-gray-500">
                    Select a patient from the list to view their details and vitals
                  </p>
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