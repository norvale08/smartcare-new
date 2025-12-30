"use client";

import React, { useState, useEffect } from "react";
import { 
  HeartPulse, Users, Search, Phone, MessageSquare, Calendar,
  Stethoscope, AlertTriangle, CheckCircle, Clock, Filter, Activity, Pill, PlusCircle,
  TrendingUp,Shield,Bell
} from "lucide-react";
import { useSession } from "next-auth/react";
import { Button, Input, Card, CardHeader, CardContent, CardTitle } from "@repo/ui";
import DashboardHeader from "./components/DashboardHeader";
import PatientRequests from "./components/PatientRequests";
import PatientTabs from './components/PatientTabs';
import RealTimeNotifications from './components/RealTimeNotifications';
import PatientHeader from './components/PatientHeader';
import PatientMessages from "./components/PatientMessages";
import QuickStats from "./components/QuickStats";
import DoctorMedicationManagement from './components/DoctorMedicationManagement';
import AppointmentsView from './components/AppointmentsView';
import MedicationPrescriptionModal from './components/MedicationPrescriptionModal'; // Import the modal

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
  allergies?: Array<{
    allergyName: string;
    severity: string;
    reaction: string;
  }>;
}

interface VitalSigns {
  id?: string;
  systolic?: number;
  diastolic?: number;
  heartRate?: number;
  glucose?: number;
  timestamp: string;
  patientId: string;
  age?: number;
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
  
  // New state for prescription modal
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [selectedPatientForPrescription, setSelectedPatientForPrescription] = useState<Patient | null>(null);
  const [activePatientTab, setActivePatientTab] = useState<'overview' | 'current-vitals' | 'health-trends' | 'risk-assessment' | 'alerts' | 'medications' | 'appointments' | 'messages'>('overview');

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
        try {
          response = await fetch(apiUrl, {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
          });
          
          if (response.ok) {
            const result = await response.json();

            if (result.success && Array.isArray(result.data) && result.data.length > 0) {
              const validatedVitals = result.data.map((vital: any) => ({
                ...vital,
                patientId: patientId,
                timestamp: vital.timestamp || vital.createdAt || vital.date || new Date().toISOString(),
                age: vital.age || undefined
              }));
              
              setPatientVitals(validatedVitals);
              return;
            } else {
              setPatientVitals([]);
              return;
            }
          } else if (response.status !== 404) {
            continue;
          }
        } catch (err) {
          lastError = err;
          continue;
        }
      }

      setPatientVitals([]);
      
    } catch (error: any) {
      console.error("Failed to fetch patient vitals:", error);
      setPatientVitals([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    const patientIdentifier = patient.userId || patient.id;
    
    setSelectedPatient(patient);
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

  const handleNotificationSelect = ({ notification, preferredTab }: { notification: { patientId?: string; patientName?: string }; preferredTab: string }) => {
    const matchedPatient = findPatientMatch(notification.patientId);
    if (matchedPatient) {
      handlePatientSelect(matchedPatient);
      return;
    }
    setMessage(`Unable to open notification for ${notification.patientName || 'patient'} — please refresh assigned patients.`);
  };

  const handleOpenMessaging = () => {
    if (selectedPatient) {
      // Set the active tab to messages
      // This will be handled by the PatientTabs component internally
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

  // NEW: Handle prescription button click
  const handlePrescribeMedication = () => {
    if (selectedPatient) {
      setSelectedPatientForPrescription(selectedPatient);
      setShowPrescriptionModal(true);
    } else {
      setMessage('Please select a patient first');
    }
  };

  // NEW: Handle prescription modal close
  const handleClosePrescriptionModal = () => {
    setShowPrescriptionModal(false);
    setSelectedPatientForPrescription(null);
  };

  // NEW: Handle prescription success
  const handlePrescriptionSuccess = () => {
    setShowPrescriptionModal(false);
    setSelectedPatientForPrescription(null);
    setMessage('Medication prescribed successfully!');
    // Refresh medications if on medications tab
    // You might want to add a refresh trigger for medications
    setRefreshTrigger(prev => prev + 1);
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCondition = filterCondition === "all" || patient.condition === filterCondition;
    return matchesSearch && matchesCondition;
  });

  // Patients shown in the main list – hide the currently selected patient
  const visiblePatients = filteredPatients.filter(patient => 
    !selectedPatient || patient.id !== selectedPatient.id
  );

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
          <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50">
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

        {/* When a patient is selected, show their key details at the top */}
        {selectedPatient && (
          <div className="w-full max-w-7xl mb-4 transition-all duration-300 ease-out">
            <div className="transform scale-100 opacity-100">
              <PatientHeader 
                patient={selectedPatient} 
                onOpenMessaging={handleOpenMessaging}
              />
            </div>
          </div>
        )}

        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Stats, Requests, and Patient Tabs */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Stats Section */}
            <QuickStats patients={patients} />

            <PatientRequests onRequestUpdate={refreshAssignedPatients} />

            {/* Assignment Info – admin controlled */}
            <Card className="shadow border-cyan-100">
              <CardHeader className="bg-gradient-to-r from-cyan-50 via-emerald-50 to-blue-50 rounded-t-lg">
                <CardTitle className="text-xs font-semibold text-gray-900">
                  Patient Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                <p className="text-xs text-gray-600">
                  Patients are assigned to you by an administrator. You cannot search or attach new
                  patients from this dashboard. Contact your admin team to update assignments.
                </p>
              </CardContent>
            </Card>

            {/* Patient Actions / Tabs in Sidebar */}
            <Card className="shadow-lg border-emerald-100">
              <CardHeader className="bg-gradient-to-r from-emerald-50 via-cyan-50 to-blue-50 rounded-t-lg">
                <CardTitle className="flex items-center space-x-2 text-sm font-semibold text-gray-900">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span>Patient Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2">
                {[
                  { id: 'overview', label: 'Overview', icon: Users },
                  { id: 'current-vitals', label: 'Current Vitals', icon: Activity },
                  { id: 'health-trends', label: 'Health Trends', icon: TrendingUp },
                  { id: 'risk-assessment', label: 'Risk Assessment', icon: Shield },
                  { id: 'alerts', label: 'Alerts & Notifications', icon: Bell },
                  { id: 'medications', label: 'Medications', icon: Pill },
                  { id: 'appointments', label: 'Appointments', icon: Calendar },
                  { id: 'messages', label: 'Messages', icon: MessageSquare },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activePatientTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActivePatientTab(tab.id as any)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 text-white shadow-md'
                          : 'bg-white text-gray-700 border border-gray-100 hover:border-emerald-300 hover:bg-emerald-50'
                      }`}
                    >
                      <span className="flex items-center space-x-2">
                        <span
                          className={`w-6 h-6 rounded-md flex items-center justify-center ${
                            isActive
                              ? 'bg-white/20'
                              : 'bg-gradient-to-br from-emerald-50 via-cyan-50 to-blue-50'
                          }`}
                        >
                          <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-emerald-600'}`} />
                        </span>
                        <span>{tab.label}</span>
                      </span>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Right Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Assigned Patients full-width list */}
            <Card className="shadow-lg border-emerald-100">
              <CardHeader className="bg-gradient-to-r from-emerald-50 via-cyan-50 to-blue-50 rounded-t-lg">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-emerald-700" />
                    <span className="text-base font-semibold text-gray-900">Assigned Patients</span>
                  </span>
                  <span className="text-xs text-gray-600">
                    {filteredPatients.length} of {patients.length} showing
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2 space-y-3">
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
                  </div>
                  <div>
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
                </div>

                <div className="space-y-3 max-h-[26rem] overflow-y-auto pr-1">
                  {visiblePatients.map((patient) => (
                    <div
                      key={patient.id}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedPatient?.id === patient.id
                          ? 'bg-gradient-to-r from-emerald-50 via-cyan-50 to-blue-50 border-emerald-300 shadow-md'
                          : 'bg-white border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/40'
                      }`}
                      onClick={() => {
                        handlePatientSelect(patient);
                        setActivePatientTab('overview');
                      }}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center flex-wrap gap-2">
                            <h3 className="font-semibold text-gray-900">{patient.fullName}</h3>
                            {getStatusIcon(patient.status)}
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${getConditionColor(patient.condition)}`}>
                              {getConditionIcon(patient.condition)}
                              <span className="ml-1 capitalize">{patient.condition}</span>
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {patient.age}y • {patient.gender} • Last visit:{' '}
                            {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : 'Never'}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
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

                  {visiblePatients.length === 0 && (
                    <div className="py-10 text-center text-gray-500">
                      <Users className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                      <p className="font-medium">No patients found</p>
                      <p className="text-xs mt-1">Adjust your search or filters to see more patients.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Patient detail + tabs */}
            {selectedPatient ? (
              <>
                <PatientHeader 
                  patient={selectedPatient} 
                  onOpenMessaging={handleOpenMessaging}
                />

                <PatientTabs
                  patient={selectedPatient}
                  patientVitals={patientVitals}
                  isLoading={isLoading}
                  onRefreshVitals={refreshVitals}
                  onPrescribeMedication={handlePrescribeMedication}
                  onOpenMessaging={handleOpenMessaging}
                  activeTab={activePatientTab}
                  onTabChange={setActivePatientTab}
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

      {/* Medication Prescription Modal */}
      {showPrescriptionModal && selectedPatientForPrescription && (
        <MedicationPrescriptionModal
          patient={selectedPatientForPrescription}
          isOpen={showPrescriptionModal}
          onClose={handleClosePrescriptionModal}
          onPrescribe={handlePrescriptionSuccess}
        />
      )}
    </div>
  );
};

export default CaretakerDashboard;
