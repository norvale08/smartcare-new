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

import PatientTabs from './components/PatientTabs';
import RealTimeNotifications from './components/RealTimeNotifications';
import PatientHeader from './components/PatientHeader';
import PatientMessages from "./components/PatientMessages";
import QuickStats from "./components/QuickStats";
import DoctorMedicationManagement from './components/DoctorMedicationManagement';
import AppointmentsView from './components/AppointmentsView';
import MedicationPrescriptionModal from './components/MedicationPrescriptionModal';
import AssignedPatientsGrid from './components/AssignedPatientsGrid';

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
    
    if (selectedPatient && selectedPatient.id === patientId) {
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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl px-8 py-10 border border-emerald-100/60 max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Please Log In</h2>
          <p className="text-gray-600 text-sm">
            You need to log in first to access this SmartCare clinician dashboard.
          </p>
        </div>
      </div>
    );
  }
 
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Non-sticky header with white background */}
      <div className="w-full bg-white shadow-xl border-b border-gray-200">
        <DashboardHeader />
      </div>
 
      {/* Floating realtime notifications tray */}
      <RealTimeNotifications onNotificationSelect={handleNotificationSelect} />
 
      <main className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex flex-col gap-6">
        {message && (
          <div className="fixed top-24 right-4 bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-xl shadow-md z-50 text-sm">
            {message}
          </div>
        )}
 
        {error && (
          <div className="bg-amber-50/90 border-l-4 border-amber-400 p-4 w-full rounded-xl shadow-sm max-w-7xl mx-auto">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              <p className="ml-3 text-sm text-yellow-700">{error}</p>
            </div>
          </div>
        )}

        {/* Removed duplicate patient header - keeping only the one in the patient details section */}

        {/* Main responsive grid layout – mirrors hypertension dashboard structure */}
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Left Sidebar - Stats, Requests, and Patient Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Patient Actions / Tabs in Sidebar - Show at top when patient is selected */}
            {selectedPatient && (
              <Card className="shadow-xl border-emerald-100/70 bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500 rounded-t-xl">
                  <CardTitle className="flex items-center justify-between text-sm font-semibold text-gray-900">
                    <span className="flex items-center space-x-2">
                      <span className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
                        <Activity className="w-4 h-4 text-white" />
                      </span>
                      <span className="text-white">Patient Actions</span>
                    </span>
                    <button
                      onClick={() => setSelectedPatient(null)}
                      className="text-xs text-emerald-50 hover:text-white font-medium underline-offset-2 hover:underline"
                    >
                      Back to Patients
                    </button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-2 bg-white/80 rounded-b-xl">
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
                            ? 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 text-white shadow-md scale-[1.01]'
                            : 'bg-white/90 text-gray-700 border border-gray-100 hover:border-emerald-300 hover:bg-emerald-50'
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
            )}

            {/* Enhanced Quick Stats Section */}
            <QuickStats patients={patients} />

            {/* Assignment Info – admin controlled */}
            <Card className="shadow-md border-cyan-100/70 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-cyan-500 via-emerald-500 to-teal-500 rounded-t-xl">
                <CardTitle className="text-xs font-semibold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center">
                    <Users className="w-3.5 h-3.5 text-white" />
                  </span>
                  Patient Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 bg-white/80 rounded-b-xl">
                <p className="text-xs text-gray-700 leading-relaxed">
                  Patients are assigned to you by an administrator. You cannot search or attach new
                  patients from this dashboard. Contact your admin team to update assignments.
                </p>
              </CardContent>
            </Card>

            {/* Removed the duplicate patient list from sidebar to avoid redundancy */}
            {/* Patients are now only shown in the main content area via AssignedPatientsGrid */}
          </div>

          {/* Right Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Show assigned patients grid when no patient is selected */}
            <div className="bg-white/85 backdrop-blur-sm rounded-2xl shadow-2xl border border-emerald-100/60 overflow-hidden">
              {!selectedPatient ? (
                <div className="p-4 sm:p-6">
                  <AssignedPatientsGrid
                    patients={filteredPatients}
                    onPatientSelect={handlePatientSelect}
                    selectedPatient={selectedPatient}
                  />
                </div>
              ) : (
                <>
                  <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 px-4 sm:px-6 py-4">
                    <PatientHeader 
                      patient={selectedPatient} 
                      onOpenMessaging={handleOpenMessaging}
                    />
                  </div>
 
                  <div className="p-4 sm:p-6 bg-gradient-to-b from-white via-white to-emerald-50/40">
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
                  </div>
                </>
              )}
            </div>
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
