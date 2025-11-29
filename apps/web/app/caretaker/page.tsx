"use client";

import React, { useState, useEffect } from "react";
import { 
  HeartPulse, Users, Search, Phone, MessageSquare, Calendar,
  Stethoscope, AlertTriangle, CheckCircle, Clock, Filter, Activity, Pill
} from "lucide-react";
import { useSession } from "next-auth/react";
import { Button, Input, Card, CardHeader, CardContent, CardTitle } from "@repo/ui";
import DashboardHeader from "./components/DashboardHeader";
import PatientSearch from "./components/PatientSearch"
import PatientRequests from "./components/PatientRequests";
import PatientTabs from './components/PatientTabs';
import RealTimeNotifications from './components/RealTimeNotifications';
import PatientHeader from './components/PatientHeader';
import PatientMessages from "./components/PatientMessages";
import QuickStats from "./components/QuickStats";
import DoctorMedicationManagement from './components/DoctorMedicationManagement';
import AppointmentsView from './components/AppointmentsView';
interface Patient {
  id: string;
  userId?: string;
  user?: {
    _id: string;
    id?: string;
    fullName: string;
    email: string;
  };
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

type DashboardTab = 'overview' | 'messages' | 'medications' | 'appointments';

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
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

  
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

  // Fetch assigned patients
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
      
      // console.log("🔄 ASSIGNED PATIENTS RAW DATA:", data);
      
      let patientsData: Patient[] = [];
      
      if (Array.isArray(data)) {
        patientsData = data;
      } else if (data.patients) {
        patientsData = data.patients;
      } else if (data.data) {
        patientsData = data.data;
      }
      
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
      
      // console.log("🩺 ===== FETCHING PATIENT VITALS =====");
      // console.log("👤 Patient ID:", patientId);

      if (!token) {
        throw new Error("No authentication token found");
      }

      const apiEndpoints = [
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/patient/vitals/${patientId}`,
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/patient/${patientId}/vitals`,
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/vitals/patient/${patientId}`,
      ];

      let response = null;
      let lastError = null;

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
            continue;
          }
        } catch (err) {
          console.log(`❌ Endpoint ${apiUrl} failed:`, err);
          lastError = err;
          continue;
        }
      }

      console.log("❌ All API endpoints failed");
      setPatientVitals([]);
      
    } catch (error: any) {
      console.error("❌ Failed to fetch patient vitals:", error);
      setPatientVitals([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePatientSelect = (patient: Patient, options?: { tab?: DashboardTab }) => {
    // console.log("🔄 ===== PATIENT SELECTED =====");
    // console.log("👤 Selected Patient:", {
    //   id: patient.id,
    //   userId: patient.userId,
    //   name: patient.fullName,
    //   condition: patient.condition
    // });
    
    const patientIdentifier = patient.userId || patient.id;
    console.log("🔍 Using patient identifier:", patientIdentifier);
    
    const targetTab = options?.tab ?? 'overview';
    setSelectedPatient(patient);
    setActiveTab(targetTab);
    setPatientVitals([]);
    
    fetchPatientVitals(patientIdentifier);
  };

  const findPatientMatch = (patientId?: string) => {
    if (!patientId) return null;
    return patients.find((patient) => 
      patient.id === patientId ||
      patient.userId === patientId ||
      patient.user?._id === patientId ||
      patient.user?.id === patientId
    ) || null;
  };

  const handleNotificationSelect = ({ notification, preferredTab }: { notification: { patientId?: string; patientName?: string }; preferredTab: DashboardTab }) => {
    const matchedPatient = findPatientMatch(notification.patientId);
    if (matchedPatient) {
      handlePatientSelect(matchedPatient, { tab: preferredTab });
      return;
    }
    setMessage(`Unable to open notification for ${notification.patientName || 'patient'} — please refresh assigned patients.`);
  };

  const handleOpenMessaging = () => {
    console.log("💬 Opening messaging for:", selectedPatient);
    if (selectedPatient) {
      setActiveTab('messages');
    } else {
      console.error("No patient selected for messaging");
    }
  };

  const refreshAssignedPatients = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const refreshVitals = () => {
    if (selectedPatient) {
      const patientIdentifier = selectedPatient.userId || selectedPatient.id;
      fetchPatientVitals(patientIdentifier);
    }
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

  const getConditionIcon = (condition: Patient["condition"]) => {
    switch (condition) {
      case "hypertension":
        return <HeartPulse className="w-4 h-4" />;
      case "diabetes":
        return <Activity className="w-4 h-4" />;
      case "both":
        return <div className="flex space-x-1">
          <HeartPulse className="w-4 h-4 text-blue-500" />
          <Activity className="w-4 h-4 text-orange-500" />
        </div>;
      default:
        return null;
    }
  };

  useEffect(() => {
    console.log("📊 PATIENT VITALS STATE UPDATED:", {
      count: patientVitals.length,
      vitals: patientVitals
    });
  }, [patientVitals]);

  if (status === "loading") {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>;
  }

  // Only show access denied if we have a token and the role is explicitly not "doctor"
  // If userRole is null, it means we're still extracting it, so wait
  if (hasToken && userRole !== null && userRole !== "doctor") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">This dashboard is for doctors only. Please log in as a doctor.</p>
        </div>
      </div>
    );
  }

  // If no token and not authenticated, show login message
  if (status === "unauthenticated" && !hasToken) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Log In</h2>
          <p className="text-gray-600">You need to log in first to access this dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <DashboardHeader />
      <RealTimeNotifications onNotificationSelect={handleNotificationSelect} />

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
            {/* Quick Stats Section */}
            <QuickStats patients={patients} />

            <PatientRequests onRequestUpdate={refreshAssignedPatients} />
            
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
                          <div className="flex items-center space-x-2 mt-1">
                            {getConditionIcon(patient.condition)}
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(patient.condition)}`}>
                              {patient.condition}
                            </span>
                          </div>
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
                <PatientHeader 
                  patient={selectedPatient} 
                  onOpenMessaging={handleOpenMessaging}
                />

                {/* Tab Navigation */}
                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="border-b">
                    <nav className="flex space-x-8 px-6">
                      <button
                        onClick={() => setActiveTab('overview')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                          activeTab === 'overview'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Patient Overview
                      </button>
                      <button
                        onClick={() => setActiveTab('medications')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                          activeTab === 'medications'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <Pill className="w-4 h-4 inline mr-1" />
                        Medications
                      </button>
                          <button
        onClick={() => setActiveTab('appointments')}
        className={`py-4 px-1 border-b-2 font-medium text-sm ${
          activeTab === 'appointments'
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`}
      >
        <Calendar className="w-4 h-4 inline mr-1" />
        Appointments
      </button>
                      <button
                        onClick={handleOpenMessaging}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                          activeTab === 'messages'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Messages
                      </button>
                    </nav>
                  </div>

                  <div className="p-6">
                    {activeTab === 'overview' && (
                      <div className="space-y-6">
                    
                        <PatientTabs
                          patient={selectedPatient}
                          patientVitals={patientVitals}
                          isLoading={isLoading}
                        />
                      </div>
                    )}
                    
                    {activeTab === 'medications' && (
                      <DoctorMedicationManagement patient={selectedPatient} />
                    )}
                     {activeTab === 'appointments' && (
                            <AppointmentsView patient={selectedPatient} />
                          )}
                    
                    {activeTab === 'messages' && (
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-medium">
                            Messaging with {selectedPatient.fullName}
                          </h3>
                          <button
                            onClick={() => setActiveTab('overview')}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            Back to Overview
                          </button>
                        </div>

                        {/* ✅ Messaging Component */}
                        <PatientMessages selectedPatient={selectedPatient} />
                      </div>
                    )}
                  </div>
                </div>
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